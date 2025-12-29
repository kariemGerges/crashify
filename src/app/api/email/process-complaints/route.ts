// =============================================
// FILE: app/api/email/process-complaints/route.ts
// POST: Process unread emails from "Urgent Complaints" folder
// Creates complaints from emails
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

const logger = createLogger('EMAIL_PROCESS_COMPLAINTS');
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function generateRequestId(): string {
    return `complaint-email-${randomUUID()}`;
}

interface StructuredLog {
    timestamp: string;
    requestId: string;
    method: string;
    endpoint: string;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    [key: string]: unknown;
}

function createStructuredLog(
    request: NextRequest,
    requestId: string,
    userId?: string,
    additionalData?: Record<string, unknown>
): StructuredLog {
    const ipAddress = validateAndExtractIp(
        request.headers.get('x-forwarded-for')
    );
    const userAgent = request.headers.get('user-agent') || null;

    return {
        timestamp: new Date().toISOString(),
        requestId,
        method: request.method,
        endpoint: '/api/email/process-complaints',
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        userId,
        ...additionalData,
    };
}

// POST: Process unread emails from "Urgent Complaints" folder
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
            action: 'complaint_email_process_start',
        });

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
                    endpoint: '/api/email/process-complaints',
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
                'email_process_complaints',
                'api',
                'email/process-complaints',
                ipAddress || undefined,
                userAgent || undefined
            );

            return NextResponse.json(
                {
                    error: 'Unauthorized',
                    message: 'Bearer token or admin authentication required.',
                    requestId,
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
            resourceId: 'email/process-complaints',
            details: {
                requestId,
                authMethod,
                endpoint: '/api/email/process-complaints',
            },
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            success: true,
        });

        // Process emails with timeout protection
        const processor = new EmailProcessor();

        const processingPromise = processor.processComplaintEmails(
            requestId,
            userId || undefined,
            'Urgent Complaints'
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
            'Complaint email processing complete',
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
            action: 'email_processed' as AuditAction,
            resourceType: 'email',
            resourceId: requestId,
            details: {
                requestId,
                processed: result.processed,
                created: result.created,
                errorsCount: result.errors.length,
                duration,
                success: result.success,
                folder: 'Urgent Complaints',
            },
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            success: result.success,
            errorMessage: result.success
                ? undefined
                : result.errors.length > 0
                ? `${result.errors.length} errors occurred`
                : 'Unknown error',
        });

        return NextResponse.json(
            {
                success: result.success,
                processed: result.processed,
                created: result.created,
                errors: result.errors,
                requestId,
            },
            {
                status: result.success ? 200 : 500,
                headers: {
                    'X-Request-ID': requestId,
                },
            }
        );
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

        logger.error(
            'Complaint email processing failed',
            error,
            {
                requestId,
                duration: `${duration}ms`,
                error: errorMessage,
            },
            { requestId, userId }
        );

        await logAuditEvent({
            userId,
            action: 'email_processed' as AuditAction,
            resourceType: 'email',
            resourceId: requestId,
            details: {
                requestId,
                error: errorMessage,
                duration,
            },
            ipAddress: validateAndExtractIp(
                request.headers.get('x-forwarded-for')
            ) || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            success: false,
            errorMessage,
        });

        return NextResponse.json(
            {
                error: 'Failed to process complaint emails',
                details: errorMessage,
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

