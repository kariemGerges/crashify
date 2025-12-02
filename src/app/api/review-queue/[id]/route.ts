// =============================================
// FILE: app/api/review-queue/[id]/route.ts
// Review Queue Item Actions (REQ-111, REQ-112, REQ-113)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { logAuditEventFromRequest } from '@/server/lib/audit/logger';
import type { Database } from '@/server/lib/types/database.types';

type ReviewQueueUpdate = Database['public']['Tables']['review_queue']['Update'];

// PATCH: Update review queue item (approve/reject/request more info)
export async function PATCH(
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
        const { action, adminNotes } = body;

        // REQ-111: Approve, REQ-112: Reject, REQ-113: Request more info
        let status: 'approved' | 'rejected' | 'more_info_requested' | undefined;
        if (action === 'approve') {
            status = 'approved';
        } else if (action === 'reject') {
            status = 'rejected';
        } else if (action === 'request_info') {
            status = 'more_info_requested';
        }

        if (!status) {
            return NextResponse.json(
                { error: 'Invalid action. Use approve, reject, or request_info' },
                { status: 400 }
            );
        }

        // Use service role client to bypass RLS
        const serverClient = createServerClient();

        const updateData: ReviewQueueUpdate = {
            status,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            admin_notes: adminNotes || null,
        };

        const { data: queueItem, error } = await (
            serverClient.from('review_queue') as unknown as {
                update: (values: ReviewQueueUpdate) => {
                    eq: (column: string, value: string) => {
                        select: () => {
                            single: () => Promise<{
                                data: Database['public']['Tables']['review_queue']['Row'] | null;
                                error: { message: string } | null;
                            }>;
                        };
                    };
                };
            }
        )
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error || !queueItem) {
            return NextResponse.json(
                {
                    error: 'Failed to update review queue item',
                    details: error?.message || 'Unknown error',
                },
                { status: 500 }
            );
        }

        // If approved, update the related assessment or quote request
        if (status === 'approved' && queueItem.assessment_id) {
            await (serverClient
                .from('assessments') as unknown as {
                    update: (values: { status: string }) => {
                        eq: (column: string, value: string) => Promise<unknown>;
                    };
                }
            )
                .update({ status: 'processing' })
                .eq('id', queueItem.assessment_id);
        }

        // Log audit event
        await logAuditEventFromRequest(request, {
            userId: user.id,
            action: `review_queue_${status}` as unknown as Parameters<typeof logAuditEventFromRequest>[1]['action'],
            resourceType: 'review_queue',
            resourceId: id,
            success: true,
        });

        return NextResponse.json({
            success: true,
            queueItem,
        });
    } catch (error) {
        console.error('[REVIEW_QUEUE] Update error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update review queue item',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

