// =============================================
// FILE: lib/services/notification-service.ts
// Comprehensive Notification Service (REQ-115-121)
// =============================================

import { EmailService } from './email-service';
import { createServerClient } from '@/server/lib/supabase/client';
import type { Database, Json } from '@/server/lib/types/database.types';

type NotificationInsert =
    Database['public']['Tables']['notifications']['Insert'];

export interface NotificationData {
    userId: string;
    type:
        | 'assessment_new'
        | 'assessment_overdue'
        | 'complaint_new'
        | 'system_error'
        | 'status_change';
    title: string;
    message: string;
    resourceType?: string;
    resourceId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, unknown>;
}

/**
 * Send email notification to admin users (REQ-115, REQ-116, REQ-117, REQ-118)
 */
export async function notifyAdmins(
    type:
        | 'assessment_new'
        | 'assessment_overdue'
        | 'complaint_new'
        | 'system_error',
    data: {
        title: string;
        message: string;
        resourceType?: string;
        resourceId?: string;
        metadata?: Record<string, unknown>;
    }
): Promise<void> {
    try {
        const supabase = createServerClient();

        // Get all admin users
        const { data: admins, error } = await (
            supabase.from('users') as unknown as {
                select: (columns: string) => {
                    in: (
                        column: string,
                        values: string[]
                    ) => {
                        eq: (
                            column: string,
                            value: boolean
                        ) => Promise<{
                            data: Array<{
                                id: string;
                                email: string;
                                role: string;
                            }> | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .select('id, email, role')
            .in('role', ['admin', 'super_admin'])
            .eq('is_active', true);

        if (error || !admins || admins.length === 0) {
            console.error(
                '[NotificationService] Failed to fetch admin users:',
                error
            );
            return;
        }

        // Send email to each admin
        const emailPromises = admins.map(async admin => {
            try {
                await EmailService.sendEmail({
                    to: admin.email,
                    subject: `[Crashify] ${data.title}`,
                    html: generateAdminNotificationEmail(type, data),
                });

                // Create in-app notification
                await createInAppNotification({
                    userId: admin.id,
                    type,
                    title: data.title,
                    message: data.message,
                    resourceType: data.resourceType,
                    resourceId: data.resourceId,
                    priority:
                        type === 'system_error' || type === 'assessment_overdue'
                            ? 'high'
                            : 'medium',
                    metadata: data.metadata,
                });
            } catch (err) {
                console.error(
                    `[NotificationService] Failed to notify admin ${admin.email}:`,
                    err
                );
            }
        });

        await Promise.allSettled(emailPromises);
        console.log(
            `[NotificationService] Notified ${admins.length} admin(s) about ${type}`
        );
    } catch (error) {
        console.error('[NotificationService] Error notifying admins:', error);
    }
}

/**
 * Send email notification to client (REQ-119, REQ-120)
 */
export async function notifyClient(
    clientEmail: string,
    type: 'submission_received' | 'status_change',
    data: {
        title: string;
        message: string;
        assessmentId?: string;
        status?: string;
        metadata?: Record<string, unknown>;
    }
): Promise<void> {
    try {
        await EmailService.sendEmail({
            to: clientEmail,
            subject: `[Crashify] ${data.title}`,
            html: generateClientNotificationEmail(type, data),
        });

        console.log(
            `[NotificationService] Client notification sent to ${clientEmail} for ${type}`
        );
    } catch (error) {
        console.error(
            `[NotificationService] Failed to send client notification:`,
            error
        );
    }
}

/**
 * Create in-app notification (REQ-121)
 */
export async function createInAppNotification(
    data: NotificationData
): Promise<string | null> {
    try {
        const supabase = createServerClient();

        const notificationData: NotificationInsert = {
            user_id: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            resource_type: data.resourceType || null,
            resource_id: data.resourceId || null,
            priority: data.priority || 'medium',
            metadata: (data.metadata || {}) as Json,
            is_read: false,
        };

        const { data: notification, error } = await (
            supabase.from('notifications') as unknown as {
                insert: (values: NotificationInsert) => {
                    select: (columns: string) => {
                        single: () => Promise<{
                            data: { id: string } | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert(notificationData)
            .select('id')
            .single();

        if (error) {
            console.error(
                '[NotificationService] Failed to create in-app notification:',
                error
            );
            return null;
        }

        return notification?.id || null;
    } catch (error) {
        console.error(
            '[NotificationService] Error creating in-app notification:',
            error
        );
        return null;
    }
}

/**
 * Generate HTML email template for admin notifications
 */
function generateAdminNotificationEmail(
    type: string,
    data: {
        title: string;
        message: string;
        resourceType?: string;
        resourceId?: string;
        metadata?: Record<string, unknown>;
    }
): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crashify.com.au';
    let actionUrl = `${appUrl}/admin`;

    if (data.resourceType && data.resourceId) {
        if (data.resourceType === 'assessment') {
            actionUrl = `${appUrl}/admin/assessments/${data.resourceId}`;
        } else if (data.resourceType === 'complaint') {
            actionUrl = `${appUrl}/admin/complaints/${data.resourceId}`;
        }
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">${data.title}</h2>
                </div>
                <div class="content">
                    <p>${data.message}</p>
                    ${
                        data.resourceId
                            ? `<a href="${actionUrl}" class="button">View Details</a>`
                            : ''
                    }
                </div>
                <div class="footer">
                    <p>This is an automated notification from Crashify System.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate HTML email template for client notifications
 */
function generateClientNotificationEmail(
    type: string,
    data: {
        title: string;
        message: string;
        assessmentId?: string;
        status?: string;
        metadata?: Record<string, unknown>;
    }
): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crashify.com.au';
    let trackingUrl = `${appUrl}/track`;

    if (data.assessmentId) {
        trackingUrl = `${appUrl}/track/${data.assessmentId}`;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">${data.title}</h2>
                </div>
                <div class="content">
                    <p>${data.message}</p>
                    ${
                        data.assessmentId
                            ? `<a href="${trackingUrl}" class="button">Track Your Assessment</a>`
                            : ''
                    }
                </div>
                <div class="footer">
                    <p>Thank you for using Crashify.</p>
                    <p>If you have any questions, please contact us at info@crashify.com.au</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
