// =============================================
// FILE: lib/services/microsoft-graph-email.ts
// Microsoft Graph API Email Service
// Replaces IMAP functionality with Microsoft Graph API
// =============================================

import { Client } from '@microsoft/microsoft-graph-client';
import { MicrosoftGraphAuth } from './microsoft-graph-auth';
import { simpleParser, ParsedMail } from 'mailparser';
import { createLogger } from '@/server/lib/utils/logger';

const logger = createLogger('MicrosoftGraphEmail');

export interface GraphEmail {
    id: string;
    subject: string;
    from: {
        emailAddress: {
            address: string;
            name: string;
        };
    };
    receivedDateTime: string;
    bodyPreview: string;
    body: {
        contentType: string;
        content: string;
    };
    hasAttachments: boolean;
    isRead: boolean;
    internetMessageId?: string;
}

export interface GraphAttachment {
    id: string;
    name: string;
    contentType: string;
    size: number;
    contentBytes?: string;
}

/**
 * Microsoft Graph Email Service
 * Handles email operations using Microsoft Graph API
 */
export class MicrosoftGraphEmailService {
    private graphClient: Client | null = null;
    private authService: MicrosoftGraphAuth;
    private userEmail: string;

    constructor(userEmail?: string) {
        this.authService = MicrosoftGraphAuth.getInstance();
        this.userEmail =
            userEmail ||
            process.env.IMAP_USER ||
            process.env.MICROSOFT_USER_EMAIL ||
            '';

        if (!this.userEmail) {
            throw new Error(
                'User email is required. Set IMAP_USER or MICROSOFT_USER_EMAIL environment variable.'
            );
        }
    }

    /**
     * Initialize Graph client with access token
     */
    private async getGraphClient(): Promise<Client> {
        // Always get a fresh token to ensure it's valid
        const accessToken = await this.authService.getAccessToken();

        // Create a new client instance with the access token
        // The authProvider callback is called for each request
        this.graphClient = Client.init({
            authProvider: async done => {
                try {
                    // Get a fresh token for each request (or use cached if valid)
                    const token = await this.authService.getAccessToken();
                    done(null, token);
                } catch (error) {
                    done(error as Error, null);
                }
            },
        });

        return this.graphClient;
    }

    /**
     * Get folder by name (case-insensitive)
     */
    async getFolderByName(folderName: string): Promise<string | null> {
        try {
            const client = await this.getGraphClient();

            // Get user ID from email address
            const user = await client.api(`/users/${this.userEmail}`).get();

            if (!user || !user.id) {
                throw new Error(`User not found: ${this.userEmail}`);
            }

            // Get all mail folders
            const response = await client
                .api(`/users/${user.id}/mailFolders`)
                .get();

            const folders = response.value || [];

            // Find folder by name (case-insensitive)
            const folder = folders.find(
                (f: { displayName: string }) =>
                    f.displayName.toLowerCase() === folderName.toLowerCase()
            );

            return folder ? folder.id : null;
        } catch (error) {
            logger.error('Error finding folder', error, {
                folderName,
            });
            return null;
        }
    }

    /**
     * Get unread emails from inbox or specific folder
     */
    async getUnreadEmails(folderName?: string): Promise<GraphEmail[]> {
        try {
            const client = await this.getGraphClient();

            // Get user ID from email address
            const user = await client.api(`/users/${this.userEmail}`).get();

            if (!user || !user.id) {
                throw new Error(`User not found: ${this.userEmail}`);
            }

            let apiPath = `/users/${user.id}/messages`;

            // If folder name is provided, get emails from that folder
            if (folderName) {
                const folderId = await this.getFolderByName(folderName);
                if (!folderId) {
                    logger.warn('Folder not found, falling back to inbox', {
                        folderName,
                    });
                } else {
                    apiPath = `/users/${user.id}/mailFolders/${folderId}/messages`;
                    logger.debug('Reading from folder', {
                        folderName,
                        folderId,
                    });
                }
            }

            // Get unread messages
            const response = await client
                .api(apiPath)
                .filter('isRead eq false')
                .select(
                    'id,subject,from,receivedDateTime,bodyPreview,body,hasAttachments,isRead,internetMessageId'
                )
                .top(50) // Limit to 50 emails per request
                .get();

            return response.value || [];
        } catch (error) {
            logger.error('Error fetching unread emails', error);
            throw new Error(
                `Failed to fetch unread emails: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    /**
     * Get email by ID with full content (supports folder-based emails)
     */
    async getEmailById(
        emailId: string,
        folderId?: string
    ): Promise<GraphEmail> {
        try {
            const client = await this.getGraphClient();

            // Get user ID from email address
            const user = await client.api(`/users/${this.userEmail}`).get();

            if (!user || !user.id) {
                throw new Error(`User not found: ${this.userEmail}`);
            }

            let apiPath = `/users/${user.id}/messages/${emailId}`;
            if (folderId) {
                apiPath = `/users/${user.id}/mailFolders/${folderId}/messages/${emailId}`;
            }

            const email = await client
                .api(apiPath)
                .select(
                    'id,subject,from,receivedDateTime,bodyPreview,body,hasAttachments,isRead,internetMessageId'
                )
                .get();

            return email;
        } catch (error) {
            logger.error('Error fetching email', error, {
                emailId,
            });
            throw new Error(
                `Failed to fetch email: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    /**
     * Get email MIME content (for parsing with mailparser, supports folder-based emails)
     */
    async getEmailMimeContent(
        emailId: string,
        folderId?: string
    ): Promise<Buffer> {
        try {
            const client = await this.getGraphClient();

            // Get user ID from email address
            const user = await client.api(`/users/${this.userEmail}`).get();

            if (!user || !user.id) {
                throw new Error(`User not found: ${this.userEmail}`);
            }

            let apiPath = `/users/${user.id}/messages/${emailId}/$value`;
            if (folderId) {
                apiPath = `/users/${user.id}/mailFolders/${folderId}/messages/${emailId}/$value`;
            }

            // Get MIME content
            const mimeContent = await client.api(apiPath).getStream();

            // Convert stream to buffer
            const chunks: Buffer[] = [];
            for await (const chunk of mimeContent) {
                chunks.push(Buffer.from(chunk));
            }

            return Buffer.concat(chunks);
        } catch (error) {
            logger.error('Error fetching MIME content', error, {
                emailId,
            });
            throw new Error(
                `Failed to fetch email MIME content: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    /**
     * Parse email from Graph API response to ParsedMail format
     */
    async parseEmail(
        graphEmail: GraphEmail,
        folderId?: string
    ): Promise<ParsedMail> {
        try {
            // Get MIME content for proper parsing
            const mimeContent = await this.getEmailMimeContent(
                graphEmail.id,
                folderId
            );
            const parsed = await simpleParser(mimeContent);
            return parsed;
        } catch (error) {
            logger.error('Error parsing email', error, {
                emailId: graphEmail.id,
            });

            // Fallback: Create a basic ParsedMail from Graph API data
            // Using 'as unknown as ParsedMail' because this is a partial fallback object
            return {
                from: {
                    text:
                        graphEmail.from.emailAddress.name ||
                        graphEmail.from.emailAddress.address,
                    value: [
                        {
                            address: graphEmail.from.emailAddress.address,
                            name: graphEmail.from.emailAddress.name || '',
                        },
                    ],
                },
                subject: graphEmail.subject || '',
                text: graphEmail.bodyPreview || graphEmail.body?.content || '',
                html:
                    graphEmail.body?.contentType === 'html'
                        ? graphEmail.body.content
                        : null,
                attachments: [],
                date: new Date(graphEmail.receivedDateTime),
                messageId: graphEmail.internetMessageId || graphEmail.id,
                headers: new Map(),
                headerLines: [],
            } as unknown as ParsedMail;
        }
    }

    /**
     * Get attachments for an email (supports folder-based emails)
     */
    async getEmailAttachments(
        emailId: string,
        folderId?: string
    ): Promise<GraphAttachment[]> {
        try {
            const client = await this.getGraphClient();

            // Get user ID from email address
            const user = await client.api(`/users/${this.userEmail}`).get();

            if (!user || !user.id) {
                throw new Error(`User not found: ${this.userEmail}`);
            }

            let apiPath = `/users/${user.id}/messages/${emailId}/attachments`;
            if (folderId) {
                apiPath = `/users/${user.id}/mailFolders/${folderId}/messages/${emailId}/attachments`;
            }

            const response = await client.api(apiPath).get();

            return response.value || [];
        } catch (error) {
            logger.error('Error fetching attachments', error, {
                emailId,
            });
            return [];
        }
    }

    /**
     * Get attachment content as buffer (supports folder-based emails)
     */
    async getAttachmentContent(
        emailId: string,
        attachmentId: string,
        folderId?: string
    ): Promise<Buffer> {
        try {
            const client = await this.getGraphClient();

            // Get user ID from email address
            const user = await client.api(`/users/${this.userEmail}`).get();

            if (!user || !user.id) {
                throw new Error(`User not found: ${this.userEmail}`);
            }

            let apiPath = `/users/${user.id}/messages/${emailId}/attachments/${attachmentId}`;
            if (folderId) {
                apiPath = `/users/${user.id}/mailFolders/${folderId}/messages/${emailId}/attachments/${attachmentId}`;
            }

            const attachment = await client.api(apiPath).get();

            if (!attachment.contentBytes) {
                throw new Error('Attachment has no content');
            }

            return Buffer.from(attachment.contentBytes, 'base64');
        } catch (error) {
            logger.error('Error fetching attachment', error, {
                emailId,
                attachmentId,
            });
            throw new Error(
                `Failed to fetch attachment: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    /**
     * Mark email as read (supports folder-based emails)
     */
    async markEmailAsRead(emailId: string, folderId?: string): Promise<void> {
        try {
            const client = await this.getGraphClient();

            // Get user ID from email address
            const user = await client.api(`/users/${this.userEmail}`).get();

            if (!user || !user.id) {
                throw new Error(`User not found: ${this.userEmail}`);
            }

            let apiPath = `/users/${user.id}/messages/${emailId}`;
            if (folderId) {
                apiPath = `/users/${user.id}/mailFolders/${folderId}/messages/${emailId}`;
            }

            await client.api(apiPath).patch({
                isRead: true,
            });

            logger.debug('Marked email as read', {
                emailId,
            });
        } catch (error) {
            logger.error('Error marking email as read', error, {
                emailId,
            });
            throw new Error(
                `Failed to mark email as read: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    /**
     * Test connection and authentication
     */
    async testConnection(): Promise<boolean> {
        try {
            const client = await this.getGraphClient();
            const user = await client.api(`/users/${this.userEmail}`).get();

            return !!user && !!user.id;
        } catch (error) {
            logger.error('Connection test failed', error);

            // Provide detailed error information for permission issues
            if (error && typeof error === 'object') {
                const statusCode = (error as { statusCode?: number })
                    .statusCode;
                const code = (error as { code?: string }).code;
                const body = (error as { body?: string }).body;

                if (
                    statusCode === 403 ||
                    code === 'Authorization_RequestDenied'
                ) {
                    let errorDetails = '';
                    try {
                        if (body) {
                            const parsed =
                                typeof body === 'string'
                                    ? JSON.parse(body)
                                    : body;
                            errorDetails = parsed.message || parsed.code || '';
                        }
                    } catch {
                        // Ignore parse errors
                    }

                    logger.error(
                        'Permission error: Insufficient privileges',
                        error,
                        {
                            statusCode,
                            code,
                            errorDetails,
                            message:
                                'Authentication is working but app lacks required permissions or admin consent not granted',
                        }
                    );
                } else if (statusCode === 404) {
                    logger.error(
                        'User not found in Microsoft 365 tenant',
                        error,
                        {
                            userEmail: this.userEmail,
                            statusCode,
                        }
                    );
                }
            }

            return false;
        }
    }
}
