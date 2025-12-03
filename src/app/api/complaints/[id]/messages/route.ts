// =============================================
// FILE: app/api/complaints/[id]/messages/route.ts
// Complaint Messages API (REQ-71)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { logAuditEventFromRequest } from '@/server/lib/audit/logger';
import { getSession } from '@/server/lib/auth/session';
import { EmailService } from '@/server/lib/services/email-service';
import type { Database } from '@/server/lib/types/database.types';

type ComplaintMessageInsert =
    Database['public']['Tables']['complaint_messages']['Insert'];

// POST: Send message to complainant (REQ-71)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify CSRF token
        const csrfCheck = await requireCsrfToken(request);
        if (!csrfCheck.valid) {
            return NextResponse.json(
                { error: csrfCheck.error || 'CSRF token validation failed' },
                { status: 403 }
            );
        }

        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { message, isInternal } = body;

        if (!message || !message.trim()) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Use service role client to bypass RLS
        const serverClient = createServerClient();

        // Get complaint to access complainant email
        const { data: complaint } = (await serverClient
            .from('complaints')
            .select('complainant_email, complainant_name, complaint_number')
            .eq('id', id)
            .single()) as {
            data: {
                complainant_email: string;
                complainant_name: string;
                complaint_number: string;
            } | null;
        };

        if (!complaint) {
            return NextResponse.json(
                { error: 'Complaint not found' },
                { status: 404 }
            );
        }

        // Create message record
        const messageData: ComplaintMessageInsert = {
            complaint_id: id,
            sender_id: user.id,
            sender_type: 'admin',
            message: message.trim(),
            is_internal: isInternal || false,
        };

        const { data: savedMessage, error: insertError } = await (
            serverClient.from('complaint_messages') as unknown as {
                insert: (values: ComplaintMessageInsert[]) => {
                    select: () => {
                        single: () => Promise<{
                            data:
                                | Database['public']['Tables']['complaint_messages']['Row']
                                | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert([messageData])
            .select()
            .single();

        if (insertError || !savedMessage) {
            return NextResponse.json(
                {
                    error: 'Failed to send message',
                    details: insertError?.message || 'Unknown error',
                },
                { status: 500 }
            );
        }

        // Send email to complainant if not internal (REQ-71)
        if (!isInternal) {
            try {
                await EmailService.sendEmail({
                    to: complaint.complainant_email,
                    subject: `Update on Complaint ${complaint.complaint_number}`,
                    html: `
                        <h2>Complaint Update</h2>
                        <p>Dear ${complaint.complainant_name},</p>
                        <p>We have an update regarding your complaint (${
                            complaint.complaint_number
                        }):</p>
                        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            ${message.trim().replace(/\n/g, '<br>')}
                        </div>
                        <p>You can track the status of your complaint at: <a href="${
                            process.env.NEXT_PUBLIC_APP_URL ||
                            'https://crashify.com.au'
                        }/complaint/track?number=${
                            complaint.complaint_number
                        }">Track Complaint</a></p>
                        <p>Best regards,<br>Crashify Team</p>
                    `,
                });
            } catch (emailError) {
                console.error(
                    '[COMPLAINT_MESSAGE] Email send error:',
                    emailError
                );
                // Don't fail the request if email fails
            }
        }

        // Log audit event
        await logAuditEventFromRequest(request, {
            userId: user.id,
            action: 'complaints.message_sent' as unknown as Parameters<
                typeof logAuditEventFromRequest
            >[1]['action'],
            resourceType: 'complaint',
            resourceId: id,
            details: {
                isInternal,
            },
            success: true,
        });

        return NextResponse.json({
            success: true,
            message: savedMessage,
        });
    } catch (error) {
        console.error('[COMPLAINT_MESSAGE] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send message',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
