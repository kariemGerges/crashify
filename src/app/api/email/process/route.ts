// =============================================
// FILE: app/api/email/process/route.ts
// POST: Process unread emails from info@crashify.com.au
// This can be called manually or via cron job
// Enterprise-level security and logging implementation
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { EmailProcessor } from '@/server/lib/services/email-processor';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import { getSession } from '@/server/lib/auth/session';
import {
    logAuditEvent,
    logSecurityEvent,
    logPermissionDenied,
    type AuditAction,
} from '@/server/lib/audit/logger';
import { createLogger } from '@/server/lib/utils/logger';
import { randomUUID } from 'crypto';

const logger = createLogger('EMAIL_PROCESS');

export const runtime = 'nodejs';

// Request timeout (30 seconds)
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

/**
 * Sanitize error message to prevent information leakage
 */
function sanitizeErrorMessage(error: unknown, requestId: string): string {
    if (error instanceof Error) {
        // Log full error internally but return sanitized message
        const errorName = error.name || 'Error';
        const message = error.message || 'An error occurred';

        // Don't expose internal paths, stack traces, or sensitive data
        const sanitized = message
            .replace(/\/[^\s]+/g, '[path]') // Remove file paths
            .replace(/at\s+.*/g, '') // Remove stack trace lines
            .replace(/password|secret|token|key/gi, '[redacted]') // Remove sensitive keywords
            .substring(0, 200); // Limit length

        return `${errorName}: ${sanitized}`;
    }
    return 'An unexpected error occurred';
}

/**
 * Create structured log entry
 */
interface StructuredLog {
    requestId: string;
    timestamp: string;
    method: string;
    path: string;
    ipAddress: string | null;
    userAgent: string | null;
    userId?: string;
    [key: string]: unknown;
}

function createStructuredLog(
    request: NextRequest,
    requestId: string,
    userId?: string,
    additionalData?: Record<string, unknown>
): StructuredLog {
    const rawIpHeader = request.headers.get('x-forwarded-for');
    const ipAddress = validateAndExtractIp(rawIpHeader);
    const userAgent = request.headers.get('user-agent');

    return {
        requestId,
        timestamp: new Date().toISOString(),
        method: request.method,
        path: request.nextUrl.pathname,
        ipAddress,
        userAgent,
        userId,
        ...additionalData,
    };
}

// POST: Process unread emails
export async function POST(request: NextRequest) {
    const requestId = generateRequestId();
    const startTime = Date.now();
    let userId: string | undefined;
    let authMethod: 'bearer_token' | 'session' | 'none' = 'none';

    try {
        // Extract request metadata
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent') || null;

        // Structured logging for request start
        const logData = createStructuredLog(request, requestId, undefined, {
            action: 'email_process_start',
        });
        // console.log('[EMAIL_PROCESS] Request started', logData);

        // API Authentication: Accept either Bearer token OR authenticated admin user
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.EMAIL_PROCESSOR_TOKEN;

        let isAuthorized = false;
        let authError: string | null = null;

        // Check for Bearer token authentication (for cron jobs/external calls)
        if (expectedToken && authHeader) {
            const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
            if (tokenMatch && tokenMatch[1] === expectedToken) {
                isAuthorized = true;
                authMethod = 'bearer_token';
            } else if (authHeader) {
                // Token provided but incorrect
                authError = 'Invalid bearer token';
            }
        }

        // Check for authenticated admin user (for frontend calls)
        if (!isAuthorized) {
            try {
                const user = await getSession();
                if (user && ['admin', 'super_admin'].includes(user.role)) {
                    isAuthorized = true;
                    authMethod = 'session';
                    userId = user.id;
                } else if (user) {
                    authError = `Insufficient permissions. User role: ${user.role}`;
                } else {
                    authError = 'No valid session found';
                }
            } catch (sessionError) {
                authError = 'Session validation failed';
                logger.error(
                    'Session validation failed',
                    sessionError,
                    { requestId },
                    { requestId }
                );
            }
        }

        // Log unauthorized access attempts
        if (!isAuthorized) {
            await logSecurityEvent(
                'api_access' as AuditAction,
                {
                    requestId,
                    endpoint: '/api/email/process',
                    method: 'POST',
                    authMethod,
                    reason: authError || 'No authentication provided',
                    attemptedToken: authHeader
                        ? `${authHeader.substring(0, 20)}...`
                        : null,
                },
                ipAddress || undefined,
                userAgent || undefined,
                userId
            );

            await logPermissionDenied(
                userId,
                'email_process',
                'api',
                'email/process',
                ipAddress || undefined,
                userAgent || undefined
            );

            return NextResponse.json(
                {
                    error: 'Unauthorized',
                    message: 'Bearer token or admin authentication required.',
                    requestId, // Include for support/debugging
                },
                {
                    status: 401,
                    headers: {
                        'X-Request-ID': requestId,
                    },
                }
            );
        }

        // Log successful authentication
        await logAuditEvent({
            userId,
            action: 'api_access',
            resourceType: 'api',
            resourceId: 'email/process',
            details: {
                requestId,
                authMethod,
                endpoint: '/api/email/process',
            },
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            success: true,
        });

        // Email authentication supports two methods:
        // 1. Microsoft Graph API (OAuth2) - Recommended for Microsoft 365
        //    Requires: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID (optional)
        // 2. IMAP (legacy) - For non-Microsoft email providers
        //    Requires: IMAP_HOST, IMAP_USER, IMAP_PASSWORD
        //
        // The system will automatically use Graph API if OAuth2 credentials are configured,
        // otherwise it falls back to IMAP.

        // Check which email method will be used
        const hasGraphConfig =
            !!process.env.MICROSOFT_CLIENT_ID &&
            !!process.env.MICROSOFT_CLIENT_SECRET;
        const hasImapConfig = !!process.env.IMAP_PASSWORD;
        const emailMethod = hasGraphConfig
            ? 'Microsoft Graph API (OAuth2)'
            : hasImapConfig
            ? 'IMAP (Legacy)'
            : 'NONE CONFIGURED';

        // Enterprise logging
        logger.info(
            'Starting email processing',
            {
                requestId,
                userId,
                authMethod,
                emailMethod,
                hasGraphConfig,
                hasImapConfig,
            },
            { requestId, userId }
        );

        // Process emails with timeout protection
        const processor = new EmailProcessor();

        // Log which method EmailProcessor is using
        const processorMethod = (
            processor as unknown as { useGraphAPI?: boolean }
        ).useGraphAPI
            ? 'Microsoft Graph API (OAuth2)'
            : 'IMAP (Legacy)';
        logger.debug(
            'EmailProcessor method selected',
            {
                method: processorMethod,
            },
            { requestId }
        );

        const processingPromise = processor.processUnreadEmails(
            requestId,
            userId || undefined,
            'Crashify Assessments'
        );

        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(
                    new Error(
                        'Request timeout: Email processing exceeded time limit'
                    )
                );
            }, REQUEST_TIMEOUT_MS);
        });

        const result = await Promise.race([processingPromise, timeoutPromise]);

        const duration = Date.now() - startTime;

        // Enterprise logging
        const successRate =
            result.processed > 0
                ? ((result.processed - result.errors.length) /
                      result.processed) *
                  100
                : 0;
        const creationRate =
            result.processed > 0
                ? (result.created / result.processed) * 100
                : 0;

        logger.info(
            'Email processing complete',
            {
                requestId,
                duration: `${duration}ms`,
                processed: result.processed,
                created: result.created,
                errors: result.errors.length,
                success: result.success,
                successRate: successRate.toFixed(1) + '%',
                creationRate: creationRate.toFixed(1) + '%',
                errorDetails:
                    result.errors.length > 0
                        ? result.errors.map(err => ({
                              emailId: err.emailId,
                              error: err.error,
                          }))
                        : undefined,
            },
            { requestId, userId }
        );

        // Log audit event for email processing
        await logAuditEvent({
            userId,
            action: 'email_processed',
            resourceType: 'email',
            resourceId: requestId,
            details: {
                requestId,
                processed: result.processed,
                created: result.created,
                errorsCount: result.errors.length,
                duration,
                success: result.success,
            },
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            success: result.success,
            errorMessage: result.success
                ? undefined
                : result.errors.length > 0
                ? `${result.errors.length} errors occurred`
                : 'Processing failed',
        });

        // Sanitize error details before returning
        const sanitizedErrors = result.errors.map(err => ({
            emailId: err.emailId,
            error: sanitizeErrorMessage(err.error, requestId),
        }));

        return NextResponse.json(
            {
                success: result.success,
                processed: result.processed,
                created: result.created,
                errors: sanitizedErrors,
                message: `Processed ${result.processed} emails, created ${result.created} assessments`,
                requestId,
                duration: `${duration}ms`,
            },
            {
                headers: {
                    'X-Request-ID': requestId,
                    'X-Processing-Duration': `${duration}ms`,
                },
            }
        );
    } catch (error) {
        const duration = Date.now() - startTime;
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent') || null;

        // Determine error type
        const isTimeout =
            error instanceof Error && error.message.includes('timeout');
        const isAuthError =
            error instanceof Error && error.message.includes('Unauthorized');
        const statusCode = isTimeout ? 504 : isAuthError ? 401 : 500;

        // Sanitize error message
        const sanitizedError = sanitizeErrorMessage(error, requestId);

        // Structured error logging
        const errorLog = createStructuredLog(request, requestId, userId, {
            action: 'email_process_error',
            error: sanitizedError,
            errorType: error instanceof Error ? error.name : 'UnknownError',
            duration: `${duration}ms`,
            statusCode,
        });

        logger.error(
            'Email processing error occurred',
            error,
            {
                ...errorLog,
            },
            { requestId, userId }
        );

        // Log security event for critical errors
        if (statusCode >= 500) {
            await logSecurityEvent(
                'api_access' as AuditAction,
                {
                    requestId,
                    endpoint: '/api/email/process',
                    method: 'POST',
                    error: sanitizedError,
                    statusCode,
                    duration,
                },
                ipAddress || undefined,
                userAgent || undefined,
                userId
            );
        }

        // Log audit event for failure
        await logAuditEvent({
            userId,
            action: 'email_processed',
            resourceType: 'email',
            resourceId: requestId,
            details: {
                requestId,
                error: sanitizedError,
                duration,
            },
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            success: false,
            errorMessage: sanitizedError,
        });

        return NextResponse.json(
            {
                error: 'Failed to process emails',
                message: sanitizedError,
                requestId,
            },
            {
                status: statusCode,
                headers: {
                    'X-Request-ID': requestId,
                    'X-Error-Type':
                        error instanceof Error ? error.name : 'UnknownError',
                },
            }
        );
    }
}

// GET: Check email processing status (health check)
export async function GET(request: NextRequest) {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent') || null;

        // Log health check access
        logger.info(
            'Health check requested',
            {
                requestId,
                ipAddress,
                userAgent,
            },
            { requestId }
        );
        // Check for Microsoft Graph API (OAuth2) configuration
        const hasGraphConfig =
            !!process.env.MICROSOFT_CLIENT_ID &&
            !!process.env.MICROSOFT_CLIENT_SECRET;
        const microsoftTenantId = process.env.MICROSOFT_TENANT_ID || 'common';
        const microsoftUserEmail =
            process.env.MICROSOFT_USER_EMAIL ||
            process.env.IMAP_USER ||
            'info@crashify.com.au';

        // Check for IMAP configuration (legacy)
        const imapHost = process.env.IMAP_HOST || 'imap.secureserver.net';
        const imapUser = process.env.IMAP_USER || 'info@crashify.com.au';
        const imapPort = process.env.IMAP_PORT || '993';
        const imapPassword = process.env.IMAP_PASSWORD || '';

        // Determine which method will be used
        const usingGraphAPI = hasGraphConfig;
        const usingIMAP = !hasGraphConfig && !!imapPassword;

        // Diagnostic information (without exposing passwords/secrets)
        const passwordInfo = imapPassword
            ? {
                  configured: true,
                  length: imapPassword.length,
                  hasSpaces: imapPassword.includes(' '),
                  startsWithQuote:
                      imapPassword.startsWith('"') ||
                      imapPassword.startsWith("'"),
                  endsWithQuote:
                      imapPassword.endsWith('"') || imapPassword.endsWith("'"),
                  trimmedLength: imapPassword.trim().length,
              }
            : {
                  configured: false,
              };

        const graphConfigInfo = hasGraphConfig
            ? {
                  configured: true,
                  clientId: process.env.MICROSOFT_CLIENT_ID
                      ? `${process.env.MICROSOFT_CLIENT_ID.substring(0, 8)}...`
                      : 'not set',
                  tenantId: microsoftTenantId,
                  userEmail: microsoftUserEmail,
              }
            : {
                  configured: false,
              };

        // Check for common configuration issues
        const issues: string[] = [];
        const warnings: string[] = [];

        if (usingGraphAPI) {
            // Graph API configuration checks
            if (!process.env.MICROSOFT_CLIENT_ID) {
                issues.push('MICROSOFT_CLIENT_ID is not set');
            }
            if (!process.env.MICROSOFT_CLIENT_SECRET) {
                issues.push('MICROSOFT_CLIENT_SECRET is not set');
            }
            if (!microsoftUserEmail.includes('@')) {
                issues.push(
                    'MICROSOFT_USER_EMAIL or IMAP_USER should be a full email address'
                );
            }
        } else if (usingIMAP) {
            // IMAP configuration checks
            if (!imapPassword) {
                issues.push('IMAP_PASSWORD is not set');
            } else {
                if (imapPassword.trim() !== imapPassword) {
                    warnings.push(
                        'Password has leading/trailing spaces - this may cause authentication to fail'
                    );
                }
                if (
                    imapPassword.startsWith('"') ||
                    imapPassword.startsWith("'")
                ) {
                    warnings.push(
                        'Password starts with quotes - remove quotes from .env.local'
                    );
                }
                if (imapPassword.endsWith('"') || imapPassword.endsWith("'")) {
                    warnings.push(
                        'Password ends with quotes - remove quotes from .env.local'
                    );
                }
                if (imapPassword.length < 8) {
                    warnings.push(
                        'Password seems too short (less than 8 characters)'
                    );
                }
            }

            if (!imapUser.includes('@')) {
                issues.push('IMAP_USER should be a full email address');
            }

            if (
                imapHost.includes('map.secureserver.net') &&
                !imapHost.includes('imap.secureserver.net')
            ) {
                issues.push(
                    'IMAP_HOST appears to have a typo (should be "imap.secureserver.net", not "map.secureserver.net")'
                );
            }
        } else {
            // No configuration found
            issues.push(
                'No email configuration found. Configure either Microsoft Graph API (OAuth2) or IMAP.'
            );
        }

        const recommendations: string[] = [];

        if (usingGraphAPI) {
            recommendations.push(
                '✅ Using Microsoft Graph API (OAuth2) - Modern authentication',
                'To set up Microsoft Graph API:',
                '1. Go to https://portal.azure.com',
                '2. Navigate to Azure Active Directory > App registrations',
                '3. Create a new app registration or use existing',
                '4. Go to Certificates & secrets > New client secret',
                '5. Go to API permissions > Add permission > Microsoft Graph',
                '6. Add permissions: Mail.Read, Mail.ReadWrite',
                '7. Grant admin consent for your organization',
                '8. Set environment variables:',
                '   - MICROSOFT_CLIENT_ID (Application ID)',
                '   - MICROSOFT_CLIENT_SECRET (Client Secret)',
                '   - MICROSOFT_TENANT_ID (optional, defaults to "common")',
                '   - MICROSOFT_USER_EMAIL or IMAP_USER (email address)'
            );
        } else if (usingIMAP) {
            recommendations.push(
                '⚠️  Using IMAP (legacy) - Consider upgrading to Microsoft Graph API for OAuth2 support',
                'For GoDaddy legacy email: Use your regular email password',
                'For GoDaddy Microsoft 365: Set IMAP_HOST=outlook.office365.com and use an app password if MFA is enabled',
                'For Microsoft 365: You need an app password from https://account.microsoft.com/security',
                'Note: Microsoft 365 may require OAuth2. If IMAP fails, switch to Graph API.',
                'Verify IMAP is enabled in your email account settings',
                'Test your password by logging into webmail at https://productivity.godaddy.com'
            );
        } else {
            recommendations.push(
                'Configure email processing by choosing one of the following:',
                '',
                'Option 1: Microsoft Graph API (OAuth2) - Recommended for Microsoft 365',
                '  Set: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_USER_EMAIL',
                '',
                'Option 2: IMAP (Legacy) - For non-Microsoft email providers',
                '  Set: IMAP_HOST, IMAP_USER, IMAP_PASSWORD'
            );
        }

        const duration = Date.now() - startTime;

        return NextResponse.json(
            {
                status: issues.length === 0 ? 'ok' : 'configuration_issues',
                message: 'Email processor configuration check',
                method: usingGraphAPI
                    ? 'microsoft_graph_oauth2'
                    : usingIMAP
                    ? 'imap'
                    : 'none',
                config: {
                    graph: graphConfigInfo,
                    imap: {
                        host: imapHost,
                        user: imapUser,
                        port: imapPort,
                        passwordInfo,
                    },
                },
                diagnostics: {
                    issues,
                    warnings,
                    recommendations,
                },
                requestId,
                timestamp: new Date().toISOString(),
            },
            {
                headers: {
                    'X-Request-ID': requestId,
                    'X-Response-Time': `${duration}ms`,
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            }
        );
    } catch (error) {
        const duration = Date.now() - startTime;
        const sanitizedError = sanitizeErrorMessage(error, requestId);

        logger.error(
            'Health check error',
            error,
            {
                requestId,
                error: sanitizedError,
                duration: `${duration}ms`,
            },
            { requestId }
        );

        return NextResponse.json(
            {
                status: 'error',
                message: 'Failed to check configuration',
                error: sanitizedError,
                requestId,
            },
            {
                status: 500,
                headers: {
                    'X-Request-ID': requestId,
                },
            }
        );
    }
}
