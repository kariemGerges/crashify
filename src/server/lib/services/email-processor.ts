// =============================================
// FILE: lib/services/email-processor.ts
// Email processing service for info@crashify.com.au
// Supports both IMAP (legacy) and Microsoft Graph API (OAuth2)
// =============================================

import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { createServerClient } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';
import { checkEmailFilter } from './email-filter';
import { quarantineEmail } from './email-quarantine';
import { SpamDetector } from './spam-detector';
import { EmailService } from './email-service';
import { MicrosoftGraphEmailService } from './microsoft-graph-email';
import { createLogger } from '@/server/lib/utils/logger';
import { extractClaimFromEmail, extractComplaintFromEmail, validateEmailAsClaim } from './claude-service';

const logger = createLogger('EmailProcessor');

type AssessmentInsert = Database['public']['Tables']['assessments']['Insert'];
type UploadedFileInsert =
    Database['public']['Tables']['uploaded_files']['Insert'];
type EmailProcessingInsert = Database['public']['Tables']['email_processing']['Insert'];

interface EmailProcessingResult {
    success: boolean;
    processed: number;
    created: number;
    errors: Array<{ emailId: string; error: string }>;
}

interface ExtractedData {
    claimReference?: string;
    vehicleInfo?: {
        year?: string;
        make?: string;
        model?: string;
        registration?: string;
    };
    insuredName?: string;
    incidentDescription?: string;
    repairerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
}

export class EmailProcessor {
    private imap: Imap | null = null;
    private supabase = createServerClient();
    private graphEmailService: MicrosoftGraphEmailService | null = null;
    private useGraphAPI: boolean;
    private currentBatchId: string | null = null; // Track batch processing

    constructor() {
        // Determine which email service to use
        // Use Graph API if OAuth2 credentials are configured
        const hasGraphConfig = !!(
            process.env.MICROSOFT_CLIENT_ID &&
            process.env.MICROSOFT_CLIENT_SECRET
        );
        this.useGraphAPI = hasGraphConfig;

        logger.debug('Initializing Email Processor', {
            hasGraphConfig,
            hasImapConfig: !!process.env.IMAP_PASSWORD,
        });

        if (this.useGraphAPI) {
            try {
                this.graphEmailService = new MicrosoftGraphEmailService();
                logger.info('Using Microsoft Graph API (OAuth2)', {
                    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
                });
            } catch (error) {
                logger.warn('Failed to initialize Graph API, falling back to IMAP', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                this.useGraphAPI = false;
            }
        } else {
            logger.info('Using IMAP (legacy)', {
                host: process.env.IMAP_HOST || 'imap.secureserver.net',
                port: process.env.IMAP_PORT || '993',
                user: process.env.IMAP_USER || 'info@crashify.com.au',
            });
        }
    }

    /**
     * Clean and prepare password for IMAP authentication
     * Handles trimming, URL decoding, and quote removal
     */
    private cleanPassword(rawPassword: string): string {
        if (!rawPassword) return '';

        let cleaned = rawPassword;

        // Remove surrounding quotes if present
        if (
            (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
            (cleaned.startsWith("'") && cleaned.endsWith("'"))
        ) {
            cleaned = cleaned.slice(1, -1);
        }

        // Trim whitespace
        cleaned = cleaned.trim();

        // Try URL decoding (in case password was URL-encoded in env var)
        try {
            const urlDecoded = decodeURIComponent(cleaned);
            // Only use decoded version if it's different and doesn't contain invalid sequences
            if (urlDecoded !== cleaned && !urlDecoded.includes('%')) {
                cleaned = urlDecoded;
            }
        } catch {
            // If URL decoding fails, use original
        }

        return cleaned;
    }

    /**
     * Connect to IMAP server
     */
    private async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Get and clean password
            const rawPassword = process.env.IMAP_PASSWORD || '';
            const cleanedPassword = this.cleanPassword(rawPassword);

            // Get and clean username
            const rawUser = process.env.IMAP_USER || 'info@crashify.com.au';
            const cleanedUser = rawUser.trim();

            const config = {
                user: cleanedUser,
                password: cleanedPassword,
                // GoDaddy legacy email hosting uses imap.secureserver.net
                // For Microsoft 365 (GoDaddy Microsoft 365), use outlook.office365.com
                // For Outlook.com personal accounts, use imap-mail.outlook.com
                host: process.env.IMAP_HOST || 'imap.secureserver.net',
                port: parseInt(process.env.IMAP_PORT || '993', 10),
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                connTimeout: 30000, // 30 seconds connection timeout
                authTimeout: 30000, // 30 seconds authentication timeout
            };

            // Log configuration (without exposing password)
            logger.debug('Connecting to IMAP server', {
                host: config.host,
                port: config.port,
                user: config.user,
                passwordConfigured: !!config.password,
                passwordLength: config.password.length,
                passwordWasCleaned: rawPassword !== cleanedPassword,
            });

            if (!config.password) {
                reject(
                    new Error('IMAP_PASSWORD environment variable is required')
                );
                return;
            }

            // Warn about potential password issues
            if (rawPassword.trim() !== rawPassword) {
                logger.warn('Password had leading/trailing spaces, removed');
            }
            if (
                rawPassword.startsWith('"') ||
                rawPassword.startsWith("'") ||
                rawPassword.endsWith('"') ||
                rawPassword.endsWith("'")
            ) {
                logger.warn('Password had quotes, removed');
            }

            // Set up connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.imap) {
                    this.imap.end();
                    this.imap = null;
                }
                reject(
                    new Error(
                        'Connection timeout: Unable to connect to IMAP server. ' +
                            'Please check: 1) IMAP is enabled on your email account, ' +
                            '2) You are using an app password (not regular password) for Outlook/Office 365, ' +
                            '3) Network/firewall is not blocking the connection.'
                    )
                );
            }, 30000);

            this.imap = new Imap(config);

            this.imap.once('ready', () => {
                clearTimeout(connectionTimeout);
                logger.info('Connected to IMAP server', {
                    host: config.host,
                    port: config.port,
                });
                resolve();
            });

            this.imap.once(
                'error',
                (
                    err: Error & {
                        source?: string;
                        textCode?: string;
                        code?: string;
                    }
                ) => {
                    clearTimeout(connectionTimeout);
                    logger.error('IMAP connection error', err, {
                        source: err.source,
                        textCode: err.textCode,
                        code: err.code,
                    });

                    // Provide more helpful error messages
                    let errorMessage = err.message;
                    const errorText = err.message.toLowerCase();
                    const errorCode = err.textCode || err.code || '';
                    const errorCodeLower = errorCode.toLowerCase();

                    // Comprehensive check for authentication/credential errors
                    // Check error message, error code, and source
                    const isAuthError =
                        // Error message patterns
                        errorText.includes('login failed') ||
                        errorText.includes('authentication') ||
                        errorText.includes('authenticate') ||
                        errorText.includes('invalid credentials') ||
                        errorText.includes('wrong password') ||
                        errorText.includes('incorrect password') ||
                        errorText.includes('bad credentials') ||
                        errorText.includes('unauthorized') ||
                        // Error code patterns (IMAP standard codes)
                        errorCodeLower.includes('authenticationfailed') ||
                        errorCodeLower.includes('authorizationfailed') ||
                        errorCodeLower === 'no' ||
                        // Source indicates authentication
                        err.source === 'authentication' ||
                        err.source === 'auth';

                    if (isAuthError) {
                        // Check if using Microsoft 365
                        const isMicrosoft365 = config.host.includes('office365.com') || config.host.includes('outlook.com');
                        
                        // Provide detailed troubleshooting for authentication failures
                        const troubleshootingSteps = [
                            '1. Verify your password is correct by logging into webmail',
                            '2. Check that IMAP_PASSWORD in .env.local has no quotes or extra spaces',
                            '3. Verify the email address (IMAP_USER) is correct and matches the account',
                        ];

                        // Microsoft 365 specific steps
                        if (isMicrosoft365) {
                            troubleshootingSteps.push(
                                '4. ⚠️  CRITICAL: If "Let devices and apps use POP" toggle is GRAYED OUT:',
                                '   - This means IMAP/POP is disabled at the organization level',
                                '   - You MUST enable IMAP in Microsoft 365 Admin Center first (see step 5)',
                                '   - If you don\'t have admin access, contact GoDaddy support to enable IMAP',
                                '5. ⚠️  CRITICAL: IMAP must be enabled in Microsoft 365 Admin Center:',
                                '   - Go to https://admin.microsoft.com/ (or https://productivity.godaddy.com)',
                                '   - Navigate to Users > Active users > Select your user (info@crashify.com.au)',
                                '   - Click Mail tab > Manage email apps',
                                '   - Ensure "IMAP" is CHECKED and click Save',
                                '   - After enabling here, the Outlook.com toggle should become available',
                                '6. ⚠️  IMPORTANT: Microsoft 365 requires OAuth2/Modern Auth',
                                '   - The current IMAP library (imap v0.8.19) does NOT support OAuth2',
                                '   - Basic auth is deprecated - app passwords may not work',
                                '   - We may need to switch to Microsoft Graph API for proper OAuth2 support',
                                '7. If MFA is enabled, try using an app password:',
                                '   - Create app password at: https://account.microsoft.com/security',
                                '   - Use the app password in IMAP_PASSWORD',
                                '   - Note: This may still fail due to OAuth2 requirement',
                                '8. Contact GoDaddy Support if:',
                                '   - You cannot access Microsoft 365 Admin Center',
                                '   - IMAP option is not available in Admin Center',
                                '   - Your plan may not support IMAP/SMTP access',
                                '   - Test connectivity: https://testconnectivity.microsoft.com/tests/O365Imap/input'
                            );
                        } else {
                            troubleshootingSteps.push(
                                '4. For GoDaddy: Ensure IMAP is enabled in your email account settings',
                                '5. For GoDaddy: Try using an app password if 2FA is enabled',
                                '6. For special characters in password: Ensure they are properly escaped or use an app password'
                            );
                        }

                        // Check if using wrong IMAP host for Microsoft 365
                        const currentHost = config.host;
                        const isUsingGoDaddyLegacyHost = currentHost.includes('secureserver.net');
                        const microsoft365Hint = isUsingGoDaddyLegacyHost
                            ? '\n\n⚠️  IMPORTANT: If you are using GoDaddy Microsoft 365, you need to set IMAP_HOST=outlook.office365.com in your .env.local file (not imap.secureserver.net)'
                            : '';

                        const additionalInfo = isMicrosoft365
                            ? '\n\n🔍 Microsoft 365 Specific Checks:\n- If toggle is grayed out: Enable IMAP in Admin Center first (see step 5 above)\n- Microsoft requires OAuth2 - the current IMAP library does NOT support OAuth2\n- We may need to switch to Microsoft Graph API for proper authentication\n- Test at: https://testconnectivity.microsoft.com/tests/O365Imap/input\n\n⚠️  LIKELY SOLUTION: Switch to Microsoft Graph API\n- The imap library doesn\'t support OAuth2 which Microsoft 365 requires\n- Microsoft Graph API is the recommended approach for Microsoft 365\n- This will require code changes but will work properly with OAuth2\n\n📚 Reference: https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-for-outlook-com-d088b986-291d-42b8-9564-9c414e2aa040'
                            : '';

                        errorMessage = `Authentication failed. Invalid email or password. (${
                            errorCode || err.message
                        })\n\nTroubleshooting:\n${troubleshootingSteps.join(
                            '\n'
                        )}${microsoft365Hint}${additionalInfo}\n\nFor GoDaddy Microsoft 365: Check settings at https://productivity.godaddy.com\nFor app passwords: https://account.microsoft.com/security (Microsoft 365)`;
                    } else if (
                        errorText.includes('timeout') ||
                        errorText.includes('timed out')
                    ) {
                        errorMessage = `Connection timeout. Unable to connect to ${config.host}:${config.port}`;
                    } else if (
                        errorCode === 'EAI_AGAIN' ||
                        errorCode === 'ENOTFOUND' ||
                        errorText.includes('getaddrinfo') ||
                        errorText.includes('eai_again') ||
                        errorText.includes('enotfound')
                    ) {
                        errorMessage = `DNS lookup failed. Cannot resolve hostname: ${config.host}`;
                    } else if (
                        errorText.includes('econnrefused') ||
                        errorText.includes('econnreset')
                    ) {
                        errorMessage = `Connection refused. Cannot connect to ${config.host}:${config.port}`;
                    } else {
                        errorMessage = `IMAP error: ${err.message}${
                            errorCode ? ` (${errorCode})` : ''
                        }`;
                    }

                    reject(new Error(errorMessage));
                }
            );

            this.imap.connect();
        });
    }

    /**
     * Disconnect from IMAP server
     */
    private async disconnect(): Promise<void> {
        if (this.imap) {
            this.imap.end();
            this.imap = null;
        }
    }

    /**
     * Process all unread emails
     * Uses Microsoft Graph API if configured, otherwise falls back to IMAP
     */
    async processUnreadEmails(
        requestId?: string,
        userId?: string,
        folderName?: string
    ): Promise<EmailProcessingResult> {
        if (this.useGraphAPI && this.graphEmailService) {
            return this.processUnreadEmailsGraphAPI(requestId, userId, folderName);
        } else {
            return this.processUnreadEmailsIMAP(requestId, userId);
        }
    }

    /**
     * Process unread emails and create complaints
     * Uses Microsoft Graph API if configured, otherwise falls back to IMAP
     */
    async processComplaintEmails(
        requestId?: string,
        userId?: string,
        folderName: string = 'Urgent Complaints'
    ): Promise<EmailProcessingResult> {
        if (this.useGraphAPI && this.graphEmailService) {
            return this.processComplaintEmailsGraphAPI(requestId, userId, folderName);
        } else {
            return this.processComplaintEmailsIMAP(requestId, userId);
        }
    }

    /**
     * Process unread emails using Microsoft Graph API (OAuth2)
     */
    private async processUnreadEmailsGraphAPI(
        requestId?: string,
        userId?: string,
        folderName?: string
    ): Promise<EmailProcessingResult> {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const result: EmailProcessingResult = {
            success: true,
            processed: 0,
            created: 0,
            errors: [],
        };

        if (!this.graphEmailService) {
            result.success = false;
            result.errors.push({
                emailId: 'system',
                error: 'Graph API service not initialized',
            });
            return result;
        }

        try {
            // Test connection first
            const isConnected = await this.graphEmailService.testConnection();
            if (!isConnected) {
                const errorMessage = `Failed to connect to Microsoft Graph API.

Common causes:
1. Missing API permissions (Mail.Read, Mail.ReadWrite)
2. Admin consent not granted - THIS IS THE MOST COMMON ISSUE
3. User not found in tenant
4. Insufficient privileges

⚠️  QUICK FIX:
1. Go to Azure Portal > App registrations > Your app > API permissions
2. Verify you have Application permissions (NOT Delegated):
   - Mail.Read
   - Mail.ReadWrite
   - User.Read.All (for user lookup)
3. Click "Grant admin consent for [Your Organization]" button
4. Wait 1-2 minutes, then try again

Check the error logs above for detailed troubleshooting steps.`;
                
                throw new Error(errorMessage);
            }

            // Get unread emails from "Crashify Assessments" folder
            const FOLDER_NAME = 'Crashify Assessments';
            const graphEmails = await this.graphEmailService.getUnreadEmails(FOLDER_NAME);
            
            // Get folder ID for subsequent operations
            const folderId = await this.graphEmailService.getFolderByName(FOLDER_NAME);

            if (graphEmails.length === 0) {
                logger.info('No unread emails found');
                return result;
            }

            logger.info('Found unread emails', {
                count: graphEmails.length,
                method: 'graph_api',
            });

            // Process each email
            for (let i = 0; i < graphEmails.length; i++) {
                const graphEmail = graphEmails[i];
                let processingLogId: string | null = null;
                const processingStartTime = Date.now();
                
                try {
                    result.processed++;
                    
                    logger.debug('Processing email', {
                        index: i + 1,
                        total: graphEmails.length,
                        emailId: graphEmail.id,
                        from: graphEmail.from.emailAddress.address,
                        subject: graphEmail.subject || '(no subject)',
                        hasAttachments: graphEmail.hasAttachments,
                    });

                    // Log email processing start
                    processingLogId = await this.logEmailProcessing({
                        email_provider_id: graphEmail.id,
                        email_provider_type: 'microsoft_graph',
                        folder_name: folderName || null,
                        email_from: graphEmail.from.emailAddress.address,
                        email_from_name: graphEmail.from.emailAddress.name || null,
                        email_subject: graphEmail.subject || null,
                        email_received_at: graphEmail.receivedDateTime || null,
                        email_message_id: graphEmail.internetMessageId || null,
                        email_has_attachments: graphEmail.hasAttachments || false,
                        email_attachments_count: 0, // Will update after fetching attachments
                        processing_status: 'processing',
                        processing_method: 'graph_api',
                        processing_started_at: new Date().toISOString(),
                        request_id: requestId || null,
                        processed_by_user_id: userId || null,
                        processing_batch_id: this.currentBatchId,
                        email_body_preview: graphEmail.bodyPreview?.substring(0, 500) || null,
                    });

                    // Parse email to ParsedMail format
                    logger.debug('Parsing email content', {
                        emailId: graphEmail.id,
                    });
                    const parsedEmail = await this.graphEmailService.parseEmail(
                        graphEmail,
                        folderId || undefined
                    );
                    
                    logger.debug('Email parsed successfully', {
                        emailId: graphEmail.id,
                    });

                    // Get attachments if any
                    if (graphEmail.hasAttachments) {
                        logger.debug('Fetching attachments', {
                            emailId: graphEmail.id,
                        });
                        const attachments =
                            await this.graphEmailService.getEmailAttachments(
                                graphEmail.id,
                                folderId || undefined
                            );

                        logger.debug('Found attachments', {
                            emailId: graphEmail.id,
                            count: attachments.length,
                        });

                        // Add attachments to parsed email
                        for (const attachment of attachments) {
                            try {
                                logger.debug('Processing attachment', {
                                    emailId: graphEmail.id,
                                    attachmentName: attachment.name,
                                    attachmentSize: attachment.size,
                                    attachmentType: attachment.contentType,
                                });
                                const content =
                                    await this.graphEmailService.getAttachmentContent(
                                        graphEmail.id,
                                        attachment.id,
                                        folderId || undefined
                                    );
                                parsedEmail.attachments = parsedEmail.attachments || [];
                                parsedEmail.attachments.push({
                                    filename: attachment.name,
                                    contentType: attachment.contentType,
                                    content: content,
                                    size: attachment.size,
                                    related: false,
                                    type: 'attachment',
                                    contentDisposition: 'attachment',
                                    headers: new Map(),
                                    headerLines: [],
                                    checksum: '',
                                    cid: '',
                                } as ParsedMail['attachments'][0]);
                                } catch (attachErr) {
                                    logger.error(
                                        'Failed to fetch attachment',
                                        attachErr,
                                        {
                                            emailId: graphEmail.id,
                                            attachmentId: attachment.id,
                                            attachmentName: attachment.name,
                                        }
                                    );
                                }
                        }
                    }

                    // Process email
                    logger.debug('Processing email (spam check, extraction, etc.)', {
                        emailId: graphEmail.id,
                    });
                    const created = await this.processEmail(
                        parsedEmail,
                        graphEmail.id,
                        processingLogId
                    );

                    const processingDuration = Date.now() - processingStartTime;

                    if (created) {
                        result.created++;
                        logger.info('Assessment created successfully', {
                            emailId: graphEmail.id,
                            duration: `${processingDuration}ms`,
                        });
                        
                        // Update log with success
                        if (processingLogId) {
                            await this.updateEmailProcessingLog(processingLogId, {
                                processing_status: 'completed',
                                processing_completed_at: new Date().toISOString(),
                                processing_duration_ms: processingDuration,
                                assessment_created: true,
                            });
                        }
                    } else {
                        logger.info('Email processed but no assessment created (duplicate/filtered)', {
                            emailId: graphEmail.id,
                            duration: `${processingDuration}ms`,
                        });
                        
                        // Update log with skipped status
                        if (processingLogId) {
                            await this.updateEmailProcessingLog(processingLogId, {
                                processing_status: 'skipped',
                                processing_completed_at: new Date().toISOString(),
                                processing_duration_ms: processingDuration,
                                assessment_created: false,
                            });
                        }
                    }

                    // Mark email as read
                    logger.debug('Marking email as read', {
                        emailId: graphEmail.id,
                    });
                    await this.graphEmailService.markEmailAsRead(
                        graphEmail.id,
                        folderId || undefined
                    );
                    
                    logger.debug('Email marked as read', {
                        emailId: graphEmail.id,
                    });
                } catch (emailErr) {
                    const processingDuration = Date.now() - processingStartTime;
                    const errorMessage = emailErr instanceof Error ? emailErr.message : 'Unknown error';
                    const errorStack = emailErr instanceof Error ? emailErr.stack?.substring(0, 1000) : null;
                    
                    logger.error(
                        'Failed to process email',
                        emailErr,
                        {
                            emailId: graphEmail.id,
                            errorMessage,
                            duration: `${processingDuration}ms`,
                        }
                    );
                    
                    // Update log with error
                    if (processingLogId) {
                        await this.updateEmailProcessingLog(processingLogId, {
                            processing_status: 'failed',
                            processing_completed_at: new Date().toISOString(),
                            processing_duration_ms: processingDuration,
                            error_message: errorMessage,
                            error_type: emailErr instanceof Error ? emailErr.name : 'UnknownError',
                            error_stack: errorStack,
                            retry_count: 0, // Will be incremented on retry
                        });
                    }
                    
                    result.errors.push({
                        emailId: graphEmail.id,
                        error: errorMessage,
                    });
                }
            }
            
            logger.info('Graph API processing complete', {
                processed: result.processed,
                created: result.created,
                errors: result.errors.length,
            });
        } catch (err) {
            logger.error('Error processing emails (Graph API)', err);
            result.success = false;
            result.errors.push({
                emailId: 'system',
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }

        return result;
    }

    /**
     * Process unread complaint emails using Microsoft Graph API (OAuth2)
     */
    private async processComplaintEmailsGraphAPI(
        requestId?: string,
        userId?: string,
        folderName: string = 'Urgent Complaints'
    ): Promise<EmailProcessingResult> {
        const result: EmailProcessingResult = {
            success: true,
            processed: 0,
            created: 0,
            errors: [],
        };

        if (!this.graphEmailService) {
            result.success = false;
            result.errors.push({
                emailId: 'system',
                error: 'Graph API service not initialized',
            });
            return result;
        }

        try {
            // Test connection first
            const isConnected = await this.graphEmailService.testConnection();
            if (!isConnected) {
                throw new Error('Failed to connect to Microsoft Graph API');
            }

            // Get unread emails from the specified folder
            const graphEmails = await this.graphEmailService.getUnreadEmails(folderName);
            
            // Get folder ID for subsequent operations
            const folderId = await this.graphEmailService.getFolderByName(folderName);

            if (graphEmails.length === 0) {
                logger.info('No unread complaint emails found', { folderName });
                return result;
            }

            logger.info('Found unread complaint emails', {
                count: graphEmails.length,
                folder: folderName,
                method: 'graph_api',
            });

            // Process each email
            for (let i = 0; i < graphEmails.length; i++) {
                const graphEmail = graphEmails[i];
                let processingLogId: string | null = null;
                
                try {
                    result.processed++;
                    
                    logger.debug('Processing complaint email', {
                        index: i + 1,
                        total: graphEmails.length,
                        emailId: graphEmail.id,
                        from: graphEmail.from.emailAddress.address,
                        subject: graphEmail.subject || '(no subject)',
                    });

                    // Log email processing start
                    processingLogId = await this.logEmailProcessing({
                        email_provider_id: graphEmail.id,
                        email_provider_type: 'microsoft_graph',
                        folder_name: folderName,
                        email_from: graphEmail.from.emailAddress.address,
                        email_from_name: graphEmail.from.emailAddress.name || null,
                        email_subject: graphEmail.subject || null,
                        email_received_at: graphEmail.receivedDateTime || null,
                        email_message_id: graphEmail.internetMessageId || null,
                        email_has_attachments: graphEmail.hasAttachments || false,
                        email_attachments_count: 0,
                        processing_status: 'processing',
                        processing_method: 'graph_api',
                        processing_started_at: new Date().toISOString(),
                        request_id: requestId || null,
                        processed_by_user_id: userId || null,
                        processing_batch_id: this.currentBatchId,
                        email_body_preview: graphEmail.bodyPreview?.substring(0, 500) || null,
                    });

                    // Parse email to ParsedMail format
                    const parsedEmail = await this.graphEmailService.parseEmail(
                        graphEmail,
                        folderId || undefined
                    );

                    // Get attachments if any
                    if (graphEmail.hasAttachments) {
                        logger.debug('Fetching attachments for complaint email', {
                            emailId: graphEmail.id,
                        });
                        const attachments =
                            await this.graphEmailService.getEmailAttachments(
                                graphEmail.id,
                                folderId || undefined
                            );

                        logger.debug('Found attachments for complaint', {
                            emailId: graphEmail.id,
                            count: attachments.length,
                        });

                        // Add attachments to parsed email
                        for (const attachment of attachments) {
                            try {
                                logger.debug('Processing attachment', {
                                    emailId: graphEmail.id,
                                    attachmentName: attachment.name,
                                    attachmentSize: attachment.size,
                                    attachmentType: attachment.contentType,
                                });
                                const content =
                                    await this.graphEmailService.getAttachmentContent(
                                        graphEmail.id,
                                        attachment.id,
                                        folderId || undefined
                                    );
                                parsedEmail.attachments = parsedEmail.attachments || [];
                                parsedEmail.attachments.push({
                                    filename: attachment.name,
                                    contentType: attachment.contentType,
                                    content: content,
                                    size: attachment.size,
                                    related: false,
                                    type: 'attachment',
                                    contentDisposition: 'attachment',
                                    headers: new Map(),
                                    headerLines: [],
                                    checksum: '',
                                    cid: '',
                                } as ParsedMail['attachments'][0]);
                            } catch (attachErr) {
                                logger.error(
                                    'Failed to fetch attachment',
                                    attachErr,
                                    {
                                        emailId: graphEmail.id,
                                        attachmentId: attachment.id,
                                        attachmentName: attachment.name,
                                    }
                                );
                            }
                        }
                    }

                    // Create complaint from email
                    const complaintCreated = await this.createComplaintFromEmail(
                        parsedEmail,
                        graphEmail.id
                    );

                    if (complaintCreated) {
                        result.created++;
                        
                        // Mark email as read
                        await this.graphEmailService.markEmailAsRead(
                            graphEmail.id,
                            folderId || undefined
                        );

                        // Update processing log
                        if (processingLogId) {
                            await this.updateEmailProcessingLog(processingLogId, {
                                processing_status: 'completed',
                                processing_completed_at: new Date().toISOString(),
                                assessment_created: false,
                            } as Record<string, unknown>);
                        }
                    } else {
                        throw new Error('Failed to create complaint from email');
                    }
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    logger.error('Error processing complaint email', err, {
                        emailId: graphEmail.id,
                    });
                    
                            // Update processing log
                            if (processingLogId) {
                                await this.updateEmailProcessingLog(processingLogId, {
                                    processing_status: 'failed',
                                    processing_completed_at: new Date().toISOString(),
                                } as Record<string, unknown>);
                            }
                    
                    result.errors.push({
                        emailId: graphEmail.id,
                        error: errorMessage,
                    });
                }
            }
            
            logger.info('Complaint email processing complete (Graph API)', {
                processed: result.processed,
                created: result.created,
                errors: result.errors.length,
            });
        } catch (err) {
            logger.error('Error processing complaint emails (Graph API)', err);
            result.success = false;
            result.errors.push({
                emailId: 'system',
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }

        return result;
    }

    /**
     * Process unread complaint emails using IMAP (legacy)
     */
    private async processComplaintEmailsIMAP(
        requestId?: string,
        userId?: string
    ): Promise<EmailProcessingResult> {
        const result: EmailProcessingResult = {
            success: true,
            processed: 0,
            created: 0,
            errors: [],
        };

        try {
            await this.connect();

            await new Promise<void>((resolve, reject) => {
                if (!this.imap) {
                    reject(new Error('IMAP not connected'));
                    return;
                }

                // Open the "Urgent Complaints" folder (or INBOX if folder doesn't exist)
                this.imap.openBox('Urgent Complaints', false, (err, box) => {
                    if (err) {
                        // If folder doesn't exist, try INBOX
                        logger.warn('Urgent Complaints folder not found, trying INBOX', { error: err.message });
                        this.imap!.openBox('INBOX', false, (openErr, inboxBox) => {
                            if (openErr) {
                                reject(openErr);
                                return;
                            }
                            this.processComplaintEmailsFromBox(inboxBox, result, requestId, userId)
                                .then(() => resolve())
                                .catch(reject);
                        });
                        return;
                    }
                    this.processComplaintEmailsFromBox(box, result, requestId, userId)
                        .then(() => resolve())
                        .catch(reject);
                });
            });

            await this.disconnect();
        } catch (err) {
            logger.error('Error processing complaint emails (IMAP)', err);
            result.success = false;
            result.errors.push({
                emailId: 'system',
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }

        return result;
    }

    /**
     * Process complaint emails from an IMAP box
     */
    private async processComplaintEmailsFromBox(
        box: Imap.Box,
        result: EmailProcessingResult,
        requestId?: string,
        userId?: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.imap) {
                reject(new Error('IMAP not connected'));
                return;
            }

            // Search for unread emails
            this.imap.search(['UNSEEN'], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!results || results.length === 0) {
                    logger.info('No unread complaint emails found');
                    resolve();
                    return;
                }

                logger.info('Found unread complaint emails', { count: results.length });

                const fetch = this.imap!.fetch(results, { bodies: '', struct: true });
                let processedCount = 0;
                const totalCount = results.length;

                fetch.on('message', (msg, seqno) => {
                    let buffer = Buffer.alloc(0);
                    
                    msg.on('body', (stream) => {
                        stream.on('data', (chunk: Buffer) => {
                            buffer = Buffer.concat([buffer, chunk]);
                        });
                        
                        stream.once('end', async () => {
                            try {
                                const parsed = await simpleParser(buffer);
                                result.processed++;

                                const complaintCreated = await this.createComplaintFromEmail(
                                    parsed,
                                    seqno.toString()
                                );

                                if (complaintCreated) {
                                    result.created++;
                                    // Mark as read
                                    this.imap!.setFlags([seqno], ['\\Seen'], (flagErr) => {
                                        if (flagErr) {
                                            logger.error('Failed to mark email as read', flagErr);
                                        }
                                    });
                                }
                            } catch (err) {
                                logger.error('Error processing complaint email', err);
                                result.errors.push({
                                    emailId: seqno.toString(),
                                    error: err instanceof Error ? err.message : 'Unknown error',
                                });
                            } finally {
                                processedCount++;
                                if (processedCount === totalCount) {
                                    resolve();
                                }
                            }
                        });
                    });
                });

                fetch.once('error', (err) => {
                    reject(err);
                });

                fetch.once('end', () => {
                    if (processedCount < totalCount) {
                        // Some emails may have failed to process
                        resolve();
                    }
                });
            });
        });
    }

    /**
     * Create a complaint from email data
     * Uses Claude AI extraction if available, otherwise falls back to pattern matching
     */
    private async createComplaintFromEmail(
        email: ParsedMail | {
            from: { text: string; value: Array<{ address: string }> };
            subject: string;
            text: string;
            html: string | null;
            date: Date;
            attachments?: Array<{
                filename?: string;
                contentType: string;
                content: Buffer | string;
            }>;
        },
        emailId: string | number
    ): Promise<boolean> {
        try {
            const senderEmail = email.from?.text || (email.from?.value?.[0] && 'address' in email.from.value[0] ? email.from.value[0].address : '') || '';
            const senderName = (email.from?.value?.[0] && 'name' in email.from.value[0] ? email.from.value[0].name : null) || 
                              email.from?.text?.split('<')[0]?.trim() || 
                              senderEmail.split('@')[0] || 
                              'Unknown';

            // Extract data using Claude AI from email body and PDF attachments
            let claudeExtractionResult = null;
            let useClaudeData = false;
            
            try {
                // Prepare email body text
                const emailBody = email.text || email.html || '';
                const emailSubject = email.subject || '';
                const emailFrom = senderEmail;
                
                // Extract text from PDF attachments
                const pdfTexts: string[] = [];
                if (email.attachments && email.attachments.length > 0) {
                    for (const attachment of email.attachments) {
                        if (attachment.contentType === 'application/pdf') {
                            try {
                                const pdfParseModule = await import('pdf-parse');
                                type PdfParseFunction = (
                                    data: Buffer
                                ) => Promise<{ text: string; [key: string]: unknown }>;
                                const pdfParse: PdfParseFunction =
                                    'default' in pdfParseModule &&
                                    typeof pdfParseModule.default === 'function'
                                        ? (pdfParseModule.default as unknown as PdfParseFunction)
                                        : (pdfParseModule as unknown as PdfParseFunction);
                                
                                const pdfBuffer = Buffer.isBuffer(attachment.content)
                                    ? attachment.content
                                    : Buffer.from(attachment.content);
                                const pdfData = await pdfParse(pdfBuffer);
                                pdfTexts.push(pdfData.text);
                            } catch (pdfErr) {
                                logger.warn('Failed to parse PDF attachment for complaint', pdfErr, {
                                    emailId: String(emailId),
                                    attachmentName: attachment.filename,
                                });
                            }
                        }
                    }
                }
                
                // Use Claude to extract complaint information
                logger.debug('Extracting complaint information using Claude AI', {
                    emailId: String(emailId),
                    hasPdfAttachments: pdfTexts.length > 0,
                });
                
                claudeExtractionResult = await extractComplaintFromEmail(
                    emailBody,
                    emailSubject,
                    emailFrom,
                    pdfTexts.length > 0 ? pdfTexts : undefined
                );
                
                logger.info('Claude complaint extraction completed', {
                    emailId: String(emailId),
                    confidence: claudeExtractionResult.confidence,
                    fieldsExtracted: Object.keys(claudeExtractionResult).length,
                });
                
                useClaudeData = true;
            } catch (claudeErr) {
                logger.error('Claude extraction failed for complaint, falling back to pattern matching', claudeErr, {
                    emailId: String(emailId),
                });
            }

            // Use email subject and body as description
            const emailText = email.text || email.html || '';
            let description: string;
            let category: 'service_quality' | 'delayed_response' | 'incorrect_assessment' | 'billing_issue' | 'communication' | 'data_privacy' | 'other';
            let priority: 'low' | 'medium' | 'high' | 'critical';
            let phone: string | null;
            let complainantName: string;
            let complainantEmail: string;
            let assessmentId: string | null = null;

            if (useClaudeData && claudeExtractionResult) {
                // Use Claude extracted data
                description = claudeExtractionResult.description || 
                    (email.subject ? `${email.subject}\n\n${emailText.substring(0, 2000)}` : emailText.substring(0, 2000));
                category = claudeExtractionResult.category || 'other';
                priority = claudeExtractionResult.priority || 'medium';
                phone = claudeExtractionResult.complainant_phone || null;
                complainantName = claudeExtractionResult.complainant_name || senderName;
                complainantEmail = claudeExtractionResult.complainant_email || senderEmail.toLowerCase();
                
                // Try to find assessment if reference is provided
                if (claudeExtractionResult.assessment_reference || claudeExtractionResult.assessment_id) {
                    const assessmentRef = claudeExtractionResult.assessment_reference || claudeExtractionResult.assessment_id;
                    const { data: assessment } = await this.supabase
                        .from('assessments')
                        .select('id')
                        .or(`id.eq.${assessmentRef},claim_reference.eq.${assessmentRef}`)
                        .single();
                    if (assessment) {
                        assessmentId = assessment.id;
                    }
                }
            } else {
                // Fallback to pattern matching
                description = email.subject 
                    ? `${email.subject}\n\n${emailText.substring(0, 2000)}`
                    : emailText.substring(0, 2000);
                
                // Extract phone if available in email text
                const phoneMatch = emailText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                phone = phoneMatch ? phoneMatch[0] : null;

                // Determine category and priority from email content
                const emailContent = (email.subject + ' ' + emailText).toLowerCase();
                category = 'other';
                priority = 'medium';

                if (emailContent.includes('urgent') || emailContent.includes('critical') || emailContent.includes('immediate')) {
                    priority = 'critical';
                } else if (emailContent.includes('important') || emailContent.includes('asap')) {
                    priority = 'high';
                }

                if (emailContent.includes('billing') || emailContent.includes('invoice') || emailContent.includes('payment')) {
                    category = 'billing_issue';
                } else if (emailContent.includes('service') || emailContent.includes('quality') || emailContent.includes('work')) {
                    category = 'service_quality';
                } else if (emailContent.includes('communication') || emailContent.includes('response') || emailContent.includes('reply')) {
                    category = 'communication';
                }
                
                complainantName = senderName;
                complainantEmail = senderEmail.toLowerCase();
            }

            if (description.trim().length < 10) {
                logger.warn('Email content too short to create complaint', {
                    emailId: String(emailId),
                    senderEmail,
                });
                return false;
            }

            // Import Database type
            type ComplaintInsert = import('@/server/lib/types/database.types').Database['public']['Tables']['complaints']['Insert'];

            const complaintData: ComplaintInsert = {
                complainant_name: complainantName,
                complainant_email: complainantEmail,
                complainant_phone: phone,
                category,
                priority,
                description: description.trim(),
                assessment_id: assessmentId,
                status: 'new',
                metadata: {
                    source: 'email',
                    emailId: String(emailId),
                    emailSubject: email.subject || null,
                    emailReceivedAt: email.date?.toISOString() || null,
                    claudeExtraction: useClaudeData ? {
                        confidence: claudeExtractionResult?.confidence,
                        extractionNotes: claudeExtractionResult?.extraction_notes,
                    } : undefined,
                },
            };

            const { data: complaint, error } = await (
                this.supabase.from('complaints') as unknown as {
                    insert: (values: ComplaintInsert) => {
                        select: () => {
                            single: () => Promise<{
                                data: { id: string } | null;
                                error: { message: string } | null;
                            }>;
                        };
                    };
                }
            )
                .insert(complaintData)
                .select()
                .single();

            if (error || !complaint) {
                logger.error('Failed to create complaint from email', error, {
                    emailId: String(emailId),
                    senderEmail,
                });
                return false;
            }

            logger.info('Complaint created from email', {
                complaintId: complaint.id,
                emailId: String(emailId),
                senderEmail,
            });

            return true;
        } catch (err) {
            logger.error('Error creating complaint from email', err, {
                emailId: String(emailId),
            });
            return false;
        }
    }

    /**
     * Process unread emails using IMAP (legacy)
     */
    private async processUnreadEmailsIMAP(
        requestId?: string,
        userId?: string
    ): Promise<EmailProcessingResult> {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const result: EmailProcessingResult = {
            success: true,
            processed: 0,
            created: 0,
            errors: [],
        };

        try {
            await this.connect();

            await new Promise<void>((resolve, reject) => {
                if (!this.imap) {
                    reject(new Error('IMAP not connected'));
                    return;
                }

                this.imap.openBox('INBOX', false, (err, box) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Search for unread emails
                    this.imap!.search(['UNSEEN'], (searchErr, results) => {
                        if (searchErr) {
                            reject(searchErr);
                            return;
                        }

                        if (!results || results.length === 0) {
                            logger.info('No unread emails found');
                            resolve();
                            return;
                        }

                        logger.info('Found unread emails', {
                            count: results.length,
                            method: 'imap',
                        });

                        // Fetch emails using UIDs
                        const fetch = this.imap!.fetch(results, {
                            bodies: '',
                            struct: true,
                        });

                        const emails: Array<{
                            uid: number;
                            parsed: ParsedMail;
                        }> = [];

                        fetch.on('message', msg => {
                            let buffer = Buffer.alloc(0);
                            let uid: number | null = null;

                            msg.on('attributes', attrs => {
                                uid = attrs.uid || null;
                            });

                            msg.on('body', stream => {
                                stream.on('data', (chunk: Buffer) => {
                                    buffer = Buffer.concat([buffer, chunk]);
                                });
                            });

                            msg.once('end', async () => {
                                if (!uid) {
                                    console.error(
                                        '[EmailProcessor] No UID found for email'
                                    );
                                    return;
                                }

                                try {
                                    const parsed = await simpleParser(buffer);
                                    emails.push({ uid, parsed });
                                } catch (parseErr) {
                                    console.error(
                                        `[EmailProcessor] Failed to parse email ${uid}:`,
                                        parseErr
                                    );
                                    result.errors.push({
                                        emailId: `uid-${uid}`,
                                        error:
                                            parseErr instanceof Error
                                                ? parseErr.message
                                                : 'Parse error',
                                    });
                                }
                            });
                        });

                        fetch.once('error', fetchErr => {
                            reject(fetchErr);
                        });

                        fetch.once('end', async () => {
                            logger.info('Fetched emails', {
                                count: emails.length,
                            });
                            
                            // Process each email
                            for (let i = 0; i < emails.length; i++) {
                                const email = emails[i];
                                try {
                                    result.processed++;
                                    
                                    logger.debug('Processing email', {
                                        index: i + 1,
                                        total: emails.length,
                                        uid: email.uid,
                                        from: email.parsed.from?.text || email.parsed.from?.value?.[0]?.address || 'Unknown',
                                        subject: email.parsed.subject || '(no subject)',
                                        attachments: email.parsed.attachments?.length || 0,
                                    });
                                    
                                    const created = await this.processEmail(
                                        email.parsed,
                                        email.uid
                                    );
                                    
                                    if (created) {
                                        result.created++;
                                        logger.info('Assessment created successfully', {
                                            uid: email.uid,
                                        });
                                    } else {
                                        logger.info('Email processed but no assessment created (duplicate/filtered)', {
                                            uid: email.uid,
                                        });
                                    }
                                } catch (emailErr) {
                                    logger.error(
                                        'Failed to process email',
                                        emailErr,
                                        {
                                            uid: email.uid,
                                        }
                                    );
                                    result.errors.push({
                                        emailId: `uid-${email.uid}`,
                                        error:
                                            emailErr instanceof Error
                                                ? emailErr.message
                                                : 'Processing error',
                                    });
                                }
                            }

                            logger.info('IMAP processing complete', {
                                processed: result.processed,
                                created: result.created,
                                errors: result.errors.length,
                            });
                            
                            resolve();
                        });
                    });
                });
            });

            await this.disconnect();
        } catch (err) {
            logger.error('Error processing emails', err);
            result.success = false;
            result.errors.push({
                emailId: 'system',
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }

        return result;
    }

    /**
     * Process email directly (for re-processing approved quarantined emails)
     * Bypasses IMAP and quarantine checks
     */
    async processEmailDirectly(
        email:
            | ParsedMail
            | {
                    from: { text: string; value: Array<{ address: string }> };
                    subject: string;
                    text: string;
                    html: string | null;
                    attachments: unknown[];
                    date: Date;
                    messageId: string;
                    headers: Record<string, unknown>;
            }
    ): Promise<boolean> {
        try {
            // Extract data from email
            const extractedData = this.extractDataFromEmail(email);

            // Create assessment from email data
            return await this.createAssessmentFromEmailData(
                extractedData,
                email
            );
        } catch (error) {
            logger.error('Error processing email directly', error);
            return false;
        }
    }

    /**
     * Create assessment from extracted email data
     */
    private async createAssessmentFromEmailData(
        extractedData: ExtractedData,
        email:
            | ParsedMail
            | {
                  from: { text: string; value: Array<{ address: string }> };
                  subject: string;
                  text: string;
                  html: string | null;
                  attachments: unknown[];
                  date: Date;
                  messageId: string;
                  headers: Record<string, unknown>;
              }
    ): Promise<boolean> {
        try {
            const assessmentData: AssessmentInsert = {
                your_name:
                    extractedData.insuredName || email.from?.text || 'Unknown',
                your_email:
                    email.from?.value?.[0]?.address || 'unknown@example.com',
                your_phone: '',
                company_name:
                    extractedData.repairerInfo?.name || 'Unknown Company',
                year: extractedData.vehicleInfo?.year
                    ? parseInt(extractedData.vehicleInfo.year)
                    : null,
                make: extractedData.vehicleInfo?.make || '',
                model: extractedData.vehicleInfo?.model || '',
                registration: extractedData.vehicleInfo?.registration || null,
                incident_description:
                    extractedData.incidentDescription ||
                    email.text?.substring(0, 1000) ||
                    '',
                assessment_type: 'Desktop Assessment',
                status: 'pending',
                internal_notes: `Imported from email. Source: ${
                    email.from?.text || 'unknown'
                }. Subject: ${email.subject || 'no subject'}. Claim: ${
                    extractedData.claimReference || 'N/A'
                }`,
                authority_confirmed: true,
                privacy_consent: true,
                source: 'email' as any,
            };

            const { data: assessment, error } = await (
                this.supabase.from('assessments') as unknown as {
                    insert: (values: AssessmentInsert) => {
                        select: (columns: string) => {
                            single: () => Promise<{
                                data: { id: string } | null;
                                error: { message: string } | null;
                            }>;
                        };
                    };
                }
            )
                .insert(assessmentData)
                .select('id')
                .single();

            if (error || !assessment) {
                logger.error('Failed to create assessment', error);
                return false;
            }

            logger.info('Created assessment from email', {
                assessmentId: assessment.id,
            });
            return true;
        } catch (error) {
            logger.error('Error creating assessment', error);
            return false;
        }
    }

    /**
     * Process a single email
     * Enhanced with whitelist/blacklist, spam detection, quarantine, and auto-reply (REQ-4, REQ-5, REQ-6)
     * uidOrEmailId can be a number (IMAP UID) or string (Graph API email ID)
     * processingLogId is the ID of the email_processing log entry (optional)
     */
    private async processEmail(
        email: ParsedMail,
        uidOrEmailId: number | string,
        processingLogId?: string | null
    ): Promise<boolean> {
        try {
            const senderEmail =
                email.from?.text || email.from?.value?.[0]?.address || '';

            // REQ-4: Check whitelist/blacklist
            const filterResult = await checkEmailFilter(senderEmail);

            if (filterResult.isBlacklisted) {
                logger.warn('Email is blacklisted', {
                    emailId: String(uidOrEmailId),
                    senderEmail,
                    reason: filterResult.reason,
                });

                // REQ-5: Send auto-reply for rejected emails
                await this.sendAutoRejectReply(
                    senderEmail,
                    filterResult.reason || 'Email address is blacklisted'
                );

                // Mark email as read (don't process)
                await this.markEmailAsRead(uidOrEmailId);
                return false;
            }

            // If whitelisted, skip spam check
            let spamCheckResult = null;
            if (!filterResult.isWhitelisted) {
                // Perform spam detection
                const emailText = email.text || email.html || '';
                spamCheckResult = SpamDetector.checkSpam({
                    email: senderEmail,
                    description: emailText.substring(0, 1000), // First 1000 chars
                    photoCount: email.attachments?.length || 0,
                });

                // REQ-6: Quarantine suspicious emails
                if (
                    spamCheckResult.action === 'manual_review' ||
                    spamCheckResult.spamScore >= 50
                ) {
                    logger.warn('Email is suspicious, quarantining', {
                        emailId: String(uidOrEmailId),
                        senderEmail,
                        spamScore: spamCheckResult.spamScore,
                    });

                    await quarantineEmail({
                        email,
                        emailUid: typeof uidOrEmailId === 'number' ? uidOrEmailId : undefined,
                        emailId: typeof uidOrEmailId === 'string' ? uidOrEmailId : undefined,
                        spamScore: spamCheckResult.spamScore,
                        spamFlags: spamCheckResult.flags,
                        reason: `Spam score: ${
                            spamCheckResult.spamScore
                        }, Flags: ${spamCheckResult.flags.join(', ')}`,
                    });

                    // Mark email as read (quarantined)
                    await this.markEmailAsRead(uidOrEmailId);
                    return false;
                }

                // Auto-reject if spam score is too high
                if (spamCheckResult.action === 'auto_reject') {
                    logger.warn('Email is spam, auto-rejecting', {
                        emailId: String(uidOrEmailId),
                        senderEmail,
                        spamScore: spamCheckResult.spamScore,
                    });

                    // REQ-5: Send auto-reply for rejected emails
                    await this.sendAutoRejectReply(
                        senderEmail,
                        'Your email was automatically rejected due to spam detection. Please contact us directly if you believe this is an error.'
                    );

                    // Mark email as read (rejected)
                    await this.markEmailAsRead(uidOrEmailId);
                    return false;
                }
            }

            // Claude AI validation: Check if email is a valid claim request
            const emailBody = email.text || email.html || '';
            const emailSubject = email.subject || '';
            const emailFrom = email.from?.text || email.from?.value?.[0]?.address || '';
            
            logger.debug('Validating email with Claude AI', {
                emailId: String(uidOrEmailId),
                senderEmail: emailFrom,
            });
            
            try {
                const validationResult = await validateEmailAsClaim(
                    emailBody,
                    emailSubject,
                    emailFrom
                );
                
                logger.info('Claude email validation completed', {
                    emailId: String(uidOrEmailId),
                    isValidClaim: validationResult.isValidClaim,
                    confidence: validationResult.confidence,
                    reasoning: validationResult.reasoning,
                });
                
                if (!validationResult.isValidClaim) {
                    logger.warn('Email rejected by Claude validation', {
                        emailId: String(uidOrEmailId),
                        senderEmail: emailFrom,
                        rejectionReason: validationResult.rejectionReason,
                        isSpam: validationResult.isSpam,
                        isMarketing: validationResult.isMarketing,
                        isSystemNotification: validationResult.isSystemNotification,
                    });
                    
                    // Send auto-reply for rejected emails
                    await this.sendAutoRejectReply(
                        emailFrom,
                        validationResult.rejectionReason || 'Email does not appear to be a valid claim or assessment request.'
                    );
                    
                    // Mark email as read (rejected)
                    await this.markEmailAsRead(uidOrEmailId);
                    return false;
                }
            } catch (validationErr) {
                logger.error('Claude validation failed, proceeding with caution', validationErr, {
                    emailId: String(uidOrEmailId),
                });
                // On validation error, we'll proceed but log it
            }

            // Extract data using Claude AI from email body and PDF attachments
            let extractedData: ExtractedData = {};
            let claudeExtractionResult = null;
            
            try {
                
                // Extract text from PDF attachments
                const pdfTexts: string[] = [];
                if (email.attachments && email.attachments.length > 0) {
                    for (const attachment of email.attachments) {
                        if (attachment.contentType === 'application/pdf') {
                            try {
                                const pdfParseModule = await import('pdf-parse');
                                type PdfParseFunction = (
                                    data: Buffer
                                ) => Promise<{ text: string; [key: string]: unknown }>;
                                const pdfParse: PdfParseFunction =
                                    'default' in pdfParseModule &&
                                    typeof pdfParseModule.default === 'function'
                                        ? (pdfParseModule.default as unknown as PdfParseFunction)
                                        : (pdfParseModule as unknown as PdfParseFunction);
                                
                                const pdfBuffer = Buffer.isBuffer(attachment.content)
                                    ? attachment.content
                                    : Buffer.from(attachment.content);
                                const pdfData = await pdfParse(pdfBuffer);
                                pdfTexts.push(pdfData.text);
                            } catch (pdfErr) {
                                logger.warn('Failed to parse PDF attachment', pdfErr, {
                                    emailId: String(uidOrEmailId),
                                    attachmentName: attachment.filename,
                                });
                            }
                        }
                    }
                }
                
                // Use Claude to extract claim information
                logger.debug('Extracting claim information using Claude AI', {
                    emailId: String(uidOrEmailId),
                    hasPdfAttachments: pdfTexts.length > 0,
                });
                
                claudeExtractionResult = await extractClaimFromEmail(
                    emailBody,
                    emailSubject,
                    emailFrom,
                    pdfTexts.length > 0 ? pdfTexts : undefined
                );
                
                logger.info('Claude extraction completed', {
                    emailId: String(uidOrEmailId),
                    confidence: claudeExtractionResult.confidence,
                    fieldsExtracted: Object.keys(claudeExtractionResult).length,
                });
                
                // Convert Claude extraction result to ExtractedData format
                extractedData = {
                    claimReference: claudeExtractionResult.claim_reference,
                    vehicleInfo: {
                        year: claudeExtractionResult.year?.toString(),
                        make: claudeExtractionResult.make,
                        model: claudeExtractionResult.model,
                        registration: claudeExtractionResult.registration,
                    },
                    insuredName: claudeExtractionResult.your_name,
                    incidentDescription: claudeExtractionResult.incident_description,
                    repairerInfo: {
                        name: claudeExtractionResult.company_name,
                        email: claudeExtractionResult.your_email,
                        phone: claudeExtractionResult.your_phone,
                    },
                };
                
                // Store full Claude result for assessment creation
                (extractedData as any).claudeResult = claudeExtractionResult;
                
            } catch (claudeErr) {
                logger.error('Claude extraction failed, falling back to pattern matching', claudeErr, {
                    emailId: String(uidOrEmailId),
                });
                
                // Fallback to original pattern matching extraction
                extractedData = this.extractDataFromEmail(email);
                
                // Still try to extract from PDFs using old method
                if (email.attachments && email.attachments.length > 0) {
                    for (const attachment of email.attachments) {
                        if (attachment.contentType === 'application/pdf') {
                            try {
                                const pdfData = await this.extractDataFromPDF(
                                    attachment.content
                                );
                                Object.assign(extractedData, pdfData);
                            } catch (pdfErr) {
                                logger.warn('Failed to extract PDF data', pdfErr);
                            }
                        }
                    }
                }
            }

            // Check for duplicates
            const isDuplicate = await this.checkDuplicate(extractedData);
            if (isDuplicate) {
                logger.info('Duplicate email detected, skipping', {
                    emailId: String(uidOrEmailId),
                });
                return false;
            }

            // Create assessment
            const assessmentId = await this.createAssessmentFromEmail(
                email,
                extractedData
            );

            // Update log with assessment ID if available
            if (processingLogId && assessmentId) {
                await this.updateEmailProcessingLog(processingLogId, {
                    assessment_id: assessmentId,
                    assessment_created: true,
                    extracted_data: extractedData as any,
                });
            }

            // Download and save attachments (photos)
            if (email.attachments && email.attachments.length > 0) {
                await this.saveAttachments(assessmentId, email.attachments);
            }

            // Mark email as read
            await this.markEmailAsRead(uidOrEmailId);

            return true;
        } catch (err) {
            logger.error('Error processing email', err, {
                emailId: String(uidOrEmailId),
            });
            throw err;
        }
    }

    /**
     * Send auto-reply for rejected emails (REQ-5)
     */
    private async sendAutoRejectReply(
        toEmail: string,
        reason: string
    ): Promise<void> {
        try {
            await EmailService.sendEmail({
                to: toEmail,
                subject: 'Re: Your email to Crashify',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2 style="margin: 0;">Crashify - Email Rejected</h2>
                            </div>
                            <div class="content">
                                <p>Dear Sender,</p>
                                <p>Thank you for contacting Crashify. Unfortunately, your email could not be processed.</p>
                                <div class="alert">
                                    <strong>Reason:</strong> ${reason}
                                </div>
                                <p>If you believe this is an error, please contact us directly at:</p>
                                <ul>
                                    <li>Email: info@crashify.com.au</li>
                                    <li>Phone: (02) 1234 5678</li>
                                </ul>
                                <p>Best regards,<br>Crashify Team</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });
            logger.info('Auto-reject reply sent', {
                toEmail,
            });
        } catch (error) {
            logger.error('Failed to send auto-reject reply', error, {
                toEmail,
            });
            // Don't throw - email sending failure shouldn't break processing
        }
    }

    /**
     * Extract phone number from email content
     */
    private extractPhoneFromEmail(
        email: ParsedMail | {
            from: { text: string; value: Array<{ address: string }> };
            subject: string;
            text: string;
            html: string | null;
            attachments: unknown[];
            date: Date;
            messageId: string;
            headers: Record<string, unknown>;
        }
    ): string | null {
        const text = email.text || email.html || '';
        
        // Try to extract Australian phone number patterns
        // Matches: 04XX XXX XXX, (02) XXXX XXXX, +61 4XX XXX XXX, etc.
        const phonePatterns = [
            /(\+?61\s?)?(\(?0?[2-9]\)?)\s?(\d{1,4})\s?(\d{1,4})\s?(\d{1,4})/g,
            /(\+?61\s?)?4\d{2}\s?\d{3}\s?\d{3}/g,
            /(\(?\d{2}\)?\s?\d{4}\s?\d{4})/g,
        ];
        
        for (const pattern of phonePatterns) {
            const match = text.match(pattern);
            if (match && match[0]) {
                // Clean up the phone number
                const cleaned = match[0].replace(/\s+/g, ' ').trim();
                if (cleaned.length >= 8) {
                    return cleaned;
                }
            }
        }
        
        return null;
    }

    /**
     * Extract data from email body using pattern matching
     */
    private extractDataFromEmail(
        email:
            | ParsedMail
            | {
                  from: { text: string; value: Array<{ address: string }> };
                  subject: string;
                  text: string;
                  html: string | null;
                  attachments: unknown[];
                  date: Date;
                  messageId: string;
                  headers: Record<string, unknown>;
              }
    ): ExtractedData {
        const data: ExtractedData = {};
        const text = email.text || email.html || '';

        // Extract claim reference
        const claimMatch = text.match(/Claim:?\s*([A-Z0-9\-]+)/i);
        if (claimMatch) {
            data.claimReference = claimMatch[1];
        }

        // Extract vehicle info
        const vehicleMatch = text.match(/Vehicle:?\s*(.*?)(?:\n|$)/i);
        if (vehicleMatch) {
            const vehicleStr = vehicleMatch[1];
            // Try to parse: "2021 Toyota Camry Hybrid ABC123"
            const yearMatch = vehicleStr.match(/(\d{4})/);
            if (yearMatch) {
                data.vehicleInfo = { year: yearMatch[1] };
            }

            // Extract make/model (basic parsing)
            const makeModelMatch = vehicleStr.match(
                /(Toyota|Honda|Mazda|Ford|Holden|BMW|Mercedes|Audi|Volkswagen|Hyundai|Kia|Nissan|Subaru|Mitsubishi|Lexus|Jeep|Volvo|Peugeot|Renault|Skoda|Suzuki|Isuzu|LDV|Great Wall|MG|BYD|Tesla|Polestar|Genesis|Alfa Romeo|Fiat|Chrysler|Dodge|RAM|GMC|Cadillac|Lincoln|Infiniti|Acura|Porsche|Jaguar|Land Rover|Mini|Smart|Ferrari|Lamborghini|Maserati|Bentley|Rolls-Royce|Aston Martin|McLaren|Lotus|Alpine|Cupra|SEAT|Opel|Vauxhall|Citroen|DS|Dacia|Lada|Tata|Mahindra|Chery|Haval|Great Wall|GWM|ORA|BYD|MG|LDV|Maxus|Foton|JAC|Geely|Proton|Perodua|Suzuki|Daihatsu|Isuzu|Mazda|Mitsubishi|Nissan|Subaru|Toyota|Honda|Hyundai|Kia|Genesis)\s+([A-Za-z0-9\s\-]+)/i
            );
            if (makeModelMatch) {
                data.vehicleInfo = {
                    ...data.vehicleInfo,
                    make: makeModelMatch[1],
                    model: makeModelMatch[2].trim(),
                };
            }

            // Extract registration
            const regoMatch = vehicleStr.match(/([A-Z0-9]{1,6})/i);
            if (regoMatch && !data.vehicleInfo?.registration) {
                data.vehicleInfo = {
                    ...data.vehicleInfo,
                    registration: regoMatch[1].toUpperCase(),
                };
            }
        }

        // Extract insured name
        const insuredMatch = text.match(/Insured:?\s*(.*?)(?:\n|$)/i);
        if (insuredMatch) {
            data.insuredName = insuredMatch[1].trim();
        }

        // Extract incident description
        const incidentMatch = text.match(
            /Incident:?\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i
        );
        if (incidentMatch) {
            data.incidentDescription = incidentMatch[1].trim();
        }

        return data;
    }

    /**
     * Extract data from PDF (repairer info)
     */
    private async extractDataFromPDF(
        pdfBuffer: Buffer
    ): Promise<Partial<ExtractedData>> {
        try {
            const pdfParseModule = await import('pdf-parse');
            // Handle both default export and namespace export
            type PdfParseFunction = (
                data: Buffer
            ) => Promise<{ text: string; [key: string]: unknown }>;
            const pdfParse: PdfParseFunction =
                'default' in pdfParseModule &&
                typeof pdfParseModule.default === 'function'
                    ? (pdfParseModule.default as unknown as PdfParseFunction)
                    : (pdfParseModule as unknown as PdfParseFunction);
            const data = await pdfParse(pdfBuffer);
            const text = data.text;

            const repairerInfo: ExtractedData['repairerInfo'] = {};

            // Extract email
            const emailMatch = text.match(
                /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i
            );
            if (emailMatch) {
                repairerInfo.email = emailMatch[1];
            }

            // Extract phone
            const phoneMatch = text.match(/(\(?\d{2}\)?\s?\d{4}\s?\d{4})/);
            if (phoneMatch) {
                repairerInfo.phone = phoneMatch[1];
            }

            // Extract company name (first line or line with ABN)
            const lines = text
                .split('\n')
                .filter((line: string) => line.trim().length > 0);
            const abnMatch = text.match(
                /ABN:?\s*(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})/i
            );
            if (abnMatch) {
                // Find line before ABN line
                const abnIndex = lines.findIndex((line: string) =>
                    line.includes('ABN')
                );
                if (abnIndex > 0) {
                    repairerInfo.name = lines[abnIndex - 1].trim();
                }
            } else if (lines.length > 0) {
                // Use first non-empty line as company name
                repairerInfo.name = lines[0].trim();
            }

            // Extract address (line with state/postcode)
            const addressMatch = text.match(
                /(\d+[^,]*,\s*[^,]*,\s*[A-Z]{2,3}\s+\d{4})/i
            );
            if (addressMatch) {
                repairerInfo.address = addressMatch[1].trim();
            }

            return { repairerInfo };
        } catch (err) {
            logger.error('Error extracting PDF data', err);
            return {};
        }
    }

    /**
     * Check for duplicate assessments
     */
    private async checkDuplicate(data: ExtractedData): Promise<boolean> {
        if (!data.claimReference && !data.vehicleInfo?.registration) {
            return false; // Can't check without identifiers
        }

        // Build query based on available data
        let query = this.supabase
            .from('assessments')
            .select('id')
            .is('deleted_at', null)
            .gte(
                'created_at',
                new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            ); // Last 24 hours

        if (data.claimReference && data.vehicleInfo?.registration) {
            query = query.or(
                `claim_reference.eq.${data.claimReference},registration.eq.${data.vehicleInfo.registration}`
            );
        } else if (data.claimReference) {
            query = query.eq('claim_reference', data.claimReference);
        } else if (data.vehicleInfo?.registration) {
            query = query.eq('registration', data.vehicleInfo.registration);
        } else {
            return false; // Can't check without identifiers
        }

        const { data: existing } = await query.limit(1);

        return (existing?.length || 0) > 0;
    }

    /**
     * Create assessment from email data
     * Uses Claude extraction result if available, otherwise falls back to pattern matching
     */
    private async createAssessmentFromEmail(
        email: ParsedMail,
        extractedData: ExtractedData
    ): Promise<string> {
        const fromEmail = email.from?.value[0]?.address || '';
        const fromName = email.from?.value[0]?.name || '';
        
        // Check if we have Claude extraction result
        const claudeResult = (extractedData as any).claudeResult;
        const useClaudeData = !!claudeResult;

        // Determine company name
        let companyName: string;
        if (useClaudeData && claudeResult.company_name) {
            companyName = claudeResult.company_name;
        } else {
            const domain = fromEmail.split('@')[1] || '';
            companyName = this.getCompanyNameFromDomain(domain) || fromName || domain;
        }

        // Parse owner info - use Claude data if available
        const ownerInfo: Record<string, unknown> = {};
        if (useClaudeData && claudeResult.owner_info) {
            Object.assign(ownerInfo, claudeResult.owner_info);
        } else if (extractedData.insuredName) {
            const nameParts = extractedData.insuredName.split(' ');
            ownerInfo.firstName = nameParts[0] || '';
            ownerInfo.lastName = nameParts.slice(1).join(' ') || '';
        }

        // Parse location info from Claude if available
        const locationInfo: Record<string, unknown> = {};
        if (useClaudeData && claudeResult.location_info) {
            Object.assign(locationInfo, claudeResult.location_info);
        }

        // Build assessment data - prioritize Claude extraction
        const assessmentData: AssessmentInsert = {
            company_name: companyName,
            your_name: useClaudeData && claudeResult.your_name 
                ? claudeResult.your_name 
                : fromName,
            your_email: useClaudeData && claudeResult.your_email 
                ? claudeResult.your_email 
                : fromEmail,
            your_phone: useClaudeData && claudeResult.your_phone 
                ? claudeResult.your_phone 
                : this.extractPhoneFromEmail(email) || '0400000000', // Default placeholder for email imports
            your_role: useClaudeData ? claudeResult.your_role || null : null,
            department: useClaudeData ? claudeResult.department || null : null,
            assessment_type: useClaudeData && claudeResult.assessment_type
                ? (claudeResult.assessment_type === 'Onsite Assessment' 
                    ? 'Onsite Assessment' 
                    : 'Desktop Assessment')
                : 'Desktop Assessment',
            claim_reference: useClaudeData && claudeResult.claim_reference
                ? claudeResult.claim_reference
                : extractedData.claimReference || null,
            policy_number: useClaudeData ? claudeResult.policy_number || null : null,
            incident_date: useClaudeData && claudeResult.incident_date
                ? claudeResult.incident_date
                : null,
            incident_location: useClaudeData && claudeResult.incident_location
                ? claudeResult.incident_location
                : null,
            vehicle_type: useClaudeData ? claudeResult.vehicle_type || null : null,
            make: useClaudeData && claudeResult.make
                ? claudeResult.make
                : extractedData.vehicleInfo?.make || '',
            model: useClaudeData && claudeResult.model
                ? claudeResult.model
                : extractedData.vehicleInfo?.model || '',
            year: useClaudeData && claudeResult.year
                ? claudeResult.year
                : extractedData.vehicleInfo?.year
                ? parseInt(extractedData.vehicleInfo.year)
                : null,
            registration: useClaudeData && claudeResult.registration
                ? claudeResult.registration.toUpperCase()
                : extractedData.vehicleInfo?.registration?.toUpperCase() || null,
            vin: useClaudeData ? claudeResult.vin?.toUpperCase() || null : null,
            color: useClaudeData ? claudeResult.color || null : null,
            odometer: useClaudeData ? claudeResult.odometer || null : null,
            insurance_value_type: useClaudeData ? claudeResult.insurance_value_type || null : null,
            insurance_value_amount: useClaudeData ? claudeResult.insurance_value_amount || null : null,
            owner_info: Object.keys(ownerInfo).length > 0 ? ownerInfo : {},
            location_info: Object.keys(locationInfo).length > 0 ? locationInfo : {},
            incident_description: useClaudeData && claudeResult.incident_description
                ? claudeResult.incident_description
                : extractedData.incidentDescription || null,
            damage_areas: useClaudeData && claudeResult.damage_areas
                ? claudeResult.damage_areas
                : [],
            special_instructions: useClaudeData ? claudeResult.special_instructions || null : null,
            status: 'pending', // Needs manual review
            internal_notes: `Imported from email. Source: ${
                email.from?.value[0]?.address || 'unknown'
            }. Subject: ${email.subject || 'no subject'}. ${
                useClaudeData 
                    ? `Claude extraction confidence: ${claudeResult.confidence || 'N/A'}%. ${claudeResult.extraction_notes || ''}`
                    : 'Extracted using pattern matching.'
            }`.trim(),
            // For email-imported assessments, set required consents to true
            // since they come from authorized email sources
            authority_confirmed: true,
            privacy_consent: true,
            email_report_consent: false,
            sms_updates: false,
            // Set source to 'email' so it appears in the email-processed tab
            source: 'email' as any,
        };

        const { data, error } = await (
            this.supabase.from('assessments') as unknown as {
                insert: (values: AssessmentInsert[]) => {
                    select: () => {
                        single: () => Promise<{
                            data: { id: string } | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert([assessmentData])
            .select()
            .single();

        if (error || !data) {
            // Log payload and DB response to diagnose constraint failures
            logger.error('Assessment insert failed', error, {
                payload: assessmentData,
                response: { data, error },
            });
            throw new Error(error?.message || 'Failed to create assessment');
        }

        return data.id;
    }

    /**
     * Save email attachments as files
     */
    private async saveAttachments(
        assessmentId: string,
        attachments: Array<{
            filename?: string;
            contentType: string;
            content: Buffer | string;
        }>
    ): Promise<void> {
        const BUCKET_NAME = 'Assessment-photos';

        for (const attachment of attachments) {
            // Only save images
            if (!attachment.contentType.startsWith('image/')) {
                continue;
            }

            try {
                const fileName =
                    attachment.filename || `photo_${Date.now()}.jpg`;
                const filePath = `${assessmentId}/${Date.now()}-${fileName}`;
                const content = Buffer.isBuffer(attachment.content)
                    ? attachment.content
                    : Buffer.from(attachment.content);

                // Upload to Supabase Storage
                const { error: uploadError } = await this.supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, content, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    logger.error('Failed to upload attachment', uploadError, {
                        fileName,
                        assessmentId,
                    });
                    continue;
                }

                // Get public URL
                const {
                    data: { publicUrl },
                } = this.supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);

                // Save file record
                const fileInsert: UploadedFileInsert = {
                    assessment_id: assessmentId,
                    file_name: fileName,
                    file_url: publicUrl,
                    file_type: attachment.contentType,
                    file_size: content.length,
                    storage_path: filePath,
                    processing_status: 'uploaded',
                    metadata: {
                        source: 'email',
                        uploadedAt: new Date().toISOString(),
                    },
                };

                await (
                    this.supabase.from('uploaded_files') as unknown as {
                        insert: (
                            values: UploadedFileInsert[]
                        ) => Promise<unknown>;
                    }
                ).insert([fileInsert]);
            } catch (err) {
                logger.error('Error saving attachment', err, {
                    fileName: attachment.filename,
                    assessmentId,
                });
            }
        }
    }

    /**
     * Mark email as read
     * Supports both IMAP (uid) and Graph API (emailId)
     */
    private async markEmailAsRead(uidOrEmailId: number | string): Promise<void> {
        if (this.useGraphAPI && this.graphEmailService && typeof uidOrEmailId === 'string') {
            // Graph API
            await this.graphEmailService.markEmailAsRead(uidOrEmailId);
        } else if (typeof uidOrEmailId === 'number') {
            // IMAP
            return new Promise((resolve, reject) => {
                if (!this.imap) {
                    reject(new Error('IMAP not connected'));
                    return;
                }

                this.imap.addFlags(uidOrEmailId, '\\Seen', err => {
                    if (err) {
                        logger.error('Failed to mark email as read', err, {
                            uid: uidOrEmailId,
                        });
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            throw new Error('Invalid email identifier');
        }
    }

    /**
     * Get company name from email domain
     */
    private getCompanyNameFromDomain(domain: string): string | null {
        // Map common insurance company domains
        const domainMap: Record<string, string> = {
            'p2pcover.com.au': 'P2P Cover Limited',
            'nrma.com.au': 'NRMA Insurance',
            'allianz.com.au': 'Allianz Australia',
            'aami.com.au': 'AAMI',
            'gio.com.au': 'GIO',
            'suncorp.com.au': 'Suncorp',
            'racv.com.au': 'RACV',
            'racq.com.au': 'RACQ',
            'rac.com.au': 'RAC',
            'australianunity.com.au': 'Australian Unity',
        };

        return domainMap[domain.toLowerCase()] || null;
    }

    /**
     * Log email processing start
     */
    private async logEmailProcessing(
        data: EmailProcessingInsert
    ): Promise<string | null> {
        try {
            const { data: logEntry, error } = await (
                this.supabase.from('email_processing') as unknown as {
                    insert: (values: EmailProcessingInsert[]) => {
                        select: (columns: string) => {
                            single: () => Promise<{
                                data: { id: string } | null;
                                error: { message: string } | null;
                            }>;
                        };
                    };
                }
            )
                .insert([data])
                .select('id')
                .single();

            if (error || !logEntry) {
                logger.error('Failed to log email processing', error, {
                    emailProviderId: data.email_provider_id,
                });
                return null;
            }

            return logEntry.id;
        } catch (error) {
            logger.error('Error logging email processing', error);
            return null;
        }
    }

    /**
     * Update email processing log
     */
    private async updateEmailProcessingLog(
        logId: string,
        updates: Partial<EmailProcessingInsert>
    ): Promise<void> {
        try {
            const { error } = await (
                this.supabase.from('email_processing') as unknown as {
                    update: (values: Partial<EmailProcessingInsert>) => {
                        eq: (column: string, value: string) => Promise<{
                            error: { message: string } | null;
                        }>;
                    };
                }
            )
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', logId);

            if (error) {
                logger.error('Failed to update email processing log', error, {
                    logId,
                });
            }
        } catch (error) {
            logger.error('Error updating email processing log', error, {
                logId,
            });
        }
    }
}
