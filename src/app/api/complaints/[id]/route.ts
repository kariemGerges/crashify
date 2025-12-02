// =============================================
// FILE: app/api/complaints/[id]/route.ts
// Complaint Detail API (REQ-70, REQ-72, REQ-73)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { logAuditEventFromRequest } from '@/server/lib/audit/logger';
import { getSession } from '@/server/lib/auth/session';
import type { Database } from '@/server/lib/types/database.types';

type ComplaintUpdate = Database['public']['Tables']['complaints']['Update'];

// GET: Get complaint details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: complaint, error } = await supabase
            .from('complaints')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !complaint) {
            return NextResponse.json(
                { error: 'Complaint not found' },
                { status: 404 }
            );
        }

        // Get attachments
        const { data: attachments } = await supabase
            .from('complaint_attachments')
            .select('*')
            .eq('complaint_id', id);

        // Get messages
        const { data: messages } = await supabase
            .from('complaint_messages')
            .select('*')
            .eq('complaint_id', id)
            .order('created_at', { ascending: true });

        return NextResponse.json({
            complaint,
            attachments: attachments || [],
            messages: messages || [],
        });
    } catch (error) {
        console.error('[COMPLAINT] Get error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch complaint',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// PATCH: Update complaint (REQ-70, REQ-72, REQ-73)
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

        // Build update object
        const updateData: ComplaintUpdate = {};

        if (body.status !== undefined) {
            updateData.status = body.status as ComplaintUpdate['status'];
        }

        if (body.internal_notes !== undefined) {
            updateData.internal_notes = body.internal_notes;
        }

        if (body.assigned_to !== undefined) {
            updateData.assigned_to = body.assigned_to || null;
        }

        if (body.priority !== undefined) {
            updateData.priority = body.priority as ComplaintUpdate['priority'];
            // Recalculate SLA deadline if priority changes
            if (body.priority) {
                const { data: slaData } = await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown }>)('calculate_sla_deadline', {
                    priority_level: body.priority,
                });
                if (slaData) {
                    updateData.sla_deadline = slaData as string;
                }
            }
        }

        const { data: complaint, error } = await (
            supabase.from('complaints') as unknown as {
                update: (values: ComplaintUpdate) => {
                    eq: (column: string, value: string) => {
                        select: () => {
                            single: () => Promise<{
                                data: Database['public']['Tables']['complaints']['Row'] | null;
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

        if (error || !complaint) {
            return NextResponse.json(
                {
                    error: 'Failed to update complaint',
                    details: error?.message || 'Unknown error',
                },
                { status: 500 }
            );
        }

        // Log audit event
        await logAuditEventFromRequest(request, {
            userId: user.id,
            action: 'complaints.update' as unknown as Parameters<typeof logAuditEventFromRequest>[1]['action'],
            resourceType: 'complaint',
            resourceId: id,
            details: {
                changes: updateData,
            },
            success: true,
        });

        return NextResponse.json({
            success: true,
            complaint,
        });
    } catch (error) {
        console.error('[COMPLAINT] Update error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update complaint',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

