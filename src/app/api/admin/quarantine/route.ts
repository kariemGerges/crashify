// =============================================
// FILE: app/api/admin/quarantine/route.ts
// Email Quarantine Management API (REQ-6)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { getQuarantinedEmails, reviewQuarantinedEmail } from '@/server/lib/services/email-quarantine';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { EmailProcessor } from '@/server/lib/services/email-processor';
import type { Database } from '@/server/lib/types/database.types';

// GET: List quarantined emails
export async function GET(request: NextRequest) {
    try {
        const user = await getSession();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const emails = await getQuarantinedEmails(limit);

        return NextResponse.json({
            success: true,
            data: emails,
        });
    } catch (error) {
        console.error('[QUARANTINE] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch quarantined emails',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// POST: Review quarantined email (approve/reject)
export async function POST(request: NextRequest) {
    try {
        // Verify CSRF token
        const csrfCheck = await requireCsrfToken(request);
        if (!csrfCheck.valid) {
            return NextResponse.json(
                { error: csrfCheck.error || 'CSRF token validation failed' },
                { status: 403 }
            );
        }

        const user = await getSession();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { quarantine_id, action, notes } = body;

        if (!quarantine_id || !action) {
            return NextResponse.json(
                { error: 'quarantine_id and action are required' },
                { status: 400 }
            );
        }

        if (action !== 'approve' && action !== 'reject') {
            return NextResponse.json(
                { error: 'action must be "approve" or "reject"' },
                { status: 400 }
            );
        }

        // Get quarantined email data before updating
        const { createServerClient } = await import('@/server/lib/supabase/client');
        const serverClient = createServerClient();
        
        const { data: quarantinedEmail } = await (
            serverClient.from('email_quarantine') as unknown as {
                select: (columns?: string) => {
                    eq: (column: string, value: string) => {
                        single: () => Promise<{
                            data: Database['public']['Tables']['email_quarantine']['Row'] | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .select('*')
            .eq('id', quarantine_id)
            .single();

        if (!quarantinedEmail) {
            return NextResponse.json(
                { error: 'Quarantined email not found' },
                { status: 404 }
            );
        }

        await reviewQuarantinedEmail(quarantine_id, action, user.id, notes);

        // If approved, re-process the email
        if (action === 'approve') {
            try {
                // Reconstruct ParsedMail object from stored data
                const emailProcessor = new EmailProcessor();
                
                // Create a minimal email structure for processing
                // Note: This is a simplified approach - in production, you might want to store the full raw email
                const rawEmailData = quarantinedEmail.raw_email_data as Record<string, unknown> | null;
                const reconstructedEmail = {
                    from: {
                        text: quarantinedEmail.email_from,
                        value: [{ address: quarantinedEmail.email_from }],
                    },
                    subject: quarantinedEmail.email_subject || '',
                    text: quarantinedEmail.email_body || '',
                    html: quarantinedEmail.email_html || null,
                    attachments: [],
                    date: quarantinedEmail.created_at ? new Date(quarantinedEmail.created_at) : new Date(),
                    messageId: (rawEmailData?.messageId as string) || '',
                    headers: (rawEmailData?.headers as Record<string, unknown>) || {},
                    headerLines: [],
                    to: { text: '', value: [] },
                    cc: { text: '', value: [] },
                    bcc: { text: '', value: [] },
                    replyTo: { text: '', value: [] },
                    inReplyTo: null,
                    references: [],
                    priority: 'normal',
                    flags: [],
                } as Parameters<typeof emailProcessor.processEmailDirectly>[0];

                // Process the email (this will skip quarantine since it's already approved)
                await emailProcessor.processEmailDirectly(reconstructedEmail);
                
                console.log(`[QUARANTINE] Email ${quarantine_id} approved and re-processed by ${user.id}`);
            } catch (processError) {
                console.error(`[QUARANTINE] Error re-processing approved email:`, processError);
                // Don't fail the request - email is already marked as approved
            }
        }

        return NextResponse.json({
            success: true,
            message: `Email ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
    } catch (error) {
        console.error('[QUARANTINE] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to review quarantined email',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

