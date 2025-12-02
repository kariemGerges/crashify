// =============================================
// FILE: server/lib/audit/logger.ts
// Comprehensive Audit Logging Service (REQ-136, REQ-137)
// =============================================

import { supabase } from '@/server/lib/supabase/client';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { Database, Json } from '@/server/lib/types/database.types';

type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

export type AuditAction =
    | 'login'
    | 'logout'
    | 'login_failed'
    | 'user_created'
    | 'user_updated'
    | 'user_deleted'
    | 'user_deactivated'
    | 'password_changed'
    | 'password_reset'
    | 'role_changed'
    | 'assessment_created'
    | 'assessment_updated'
    | 'assessment_deleted'
    | 'assessment_status_changed'
    | 'file_uploaded'
    | 'file_deleted'
    | 'email_sent'
    | 'email_processed'
    | 'token_generated'
    | 'token_revoked'
    | 'export_downloaded'
    | 'report_generated'
    | 'settings_updated'
    | 'backup_created'
    | 'backup_deleted'
    | 'api_access'
    | 'data_exported'
    | 'data_imported'
    | 'permission_denied'
    | 'security_event'
    | 'other';

export interface AuditLogData {
    userId?: string;
    action: AuditAction;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
    try {
        const logEntry: AuditLogInsert = {
            user_id: data.userId || null,
            action: data.action,
            resource_type: data.resourceType || null,
            resource_id: data.resourceId || null,
            details: data.details ? (data.details as Json) : null,
            ip_address: data.ipAddress || null,
            user_agent: data.userAgent || null,
            success: data.success ?? true,
            error_message: data.errorMessage || null,
            created_at: new Date().toISOString(),
        };

        await (supabase.from('audit_logs') as unknown as {
            insert: (values: AuditLogInsert[]) => Promise<{
                error: { message: string } | null;
            }>;
        }).insert([logEntry]);
    } catch (error) {
        // Don't throw - audit logging should never break the application
        console.error('[AUDIT_LOG] Failed to log event:', error);
    }
}

/**
 * Log audit event from request context
 */
export async function logAuditEventFromRequest(
    request: Request,
    data: Omit<AuditLogData, 'ipAddress' | 'userAgent'>
): Promise<void> {
    const rawIpHeader = request.headers.get('x-forwarded-for');
    const ipAddress = validateAndExtractIp(rawIpHeader);
    const userAgent = request.headers.get('user-agent') || undefined;

    await logAuditEvent({
        ...data,
        ipAddress: ipAddress || undefined,
        userAgent,
    });
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
    userId: string | undefined,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        action: success ? 'login' : 'login_failed',
        success,
        ipAddress,
        userAgent,
        errorMessage,
    });
}

/**
 * Log user action
 */
export async function logUserAction(
    userId: string,
    action: AuditAction,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        userAgent,
        success: true,
    });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
    action: AuditAction,
    details: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
    userId?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        action: 'security_event',
        details: {
            ...details,
            security_action: action,
        },
        ipAddress,
        userAgent,
        success: false,
    });
}

/**
 * Log data access
 */
export async function logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'export' | 'download',
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        action: action === 'read' ? 'api_access' : 'data_exported',
        resourceType,
        resourceId,
        details: {
            access_type: action,
        },
        ipAddress,
        userAgent,
        success: true,
    });
}

/**
 * Log permission denied
 */
export async function logPermissionDenied(
    userId: string | undefined,
    action: string,
    resourceType?: string,
    resourceId?: string,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        action: 'permission_denied',
        resourceType,
        resourceId,
        details: {
            attempted_action: action,
        },
        ipAddress,
        userAgent,
        success: false,
    });
}

