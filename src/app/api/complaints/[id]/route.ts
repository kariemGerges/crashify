// =============================================
// FILE: app/api/complaints/[id]/route.ts
// Complaint Detail API (REQ-70, REQ-72, REQ-73)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/server/lib/supabase/client';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { logAuditEventFromRequest } from '@/server/lib/audit/logger';
import { getSession } from '@/server/lib/auth/session';
import type { Database, Json } from '@/server/lib/types/database.types';

type ComplaintUpdate = Database['public']['Tables']['complaints']['Update'];

// GET: Get complaint details (public endpoint for tracking, admin for full details)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Use service role client to bypass RLS
        const serverClient = createServerClient();

        // Check if user is authenticated (admin access)
        const user = await getSession();
        const isAdmin = !!user;

        const { data: complaint, error } = await (
            serverClient.from('complaints') as unknown as {
                select: (columns: string) => {
                    eq: (column: string, value: string) => {
                        single: () => Promise<{
                            data: Database['public']['Tables']['complaints']['Row'] | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .select('*')
            .eq('id', id)
            .single();

        if (error || !complaint) {
            return NextResponse.json(
                { error: 'Complaint not found' },
                { status: 404 }
            );
        }

        // Get attachments with signed URLs
        const { data: attachments, error: attachmentsError } = await (
            serverClient.from('complaint_attachments') as unknown as {
                select: (columns: string) => {
                    eq: (column: string, value: string) => Promise<{
                        data: Array<{
                            id: string;
                            complaint_id: string;
                            file_name: string;
                            file_size: number;
                            file_type: string;
                            storage_path: string;
                            uploaded_by: string | null;
                            created_at: string;
                        }> | null;
                        error: { message: string } | null;
                    }>;
                };
            }
        )
            .select('*')
            .eq('complaint_id', id);

        if (attachmentsError) {
            console.error('[COMPLAINT] Error fetching attachments:', attachmentsError);
        } else {
            console.log('[COMPLAINT] Fetched attachments from DB:', attachments?.length || 0, 'for complaint:', id);
            if (attachments && attachments.length > 0) {
                console.log('[COMPLAINT] Attachment storage paths:', attachments.map(a => a.storage_path));
            } else {
                console.log('[COMPLAINT] No attachments found in database for complaint:', id);
            }
        }

        // Generate signed URLs for attachments
        const attachmentsWithUrls = await Promise.all(
            (attachments || []).map(async (attachment) => {
                try {
                    const { data: urlData, error: urlError } = await serverClient.storage
                        .from('complaint-attachments')
                        .createSignedUrl(attachment.storage_path, 3600); // 1 hour expiry

                    if (urlError) {
                        console.error('[COMPLAINT] Error creating signed URL for:', attachment.storage_path, urlError);
                        return {
                            ...attachment,
                            signed_url: null,
                            error: urlError.message,
                        };
                    }

                    return {
                        ...attachment,
                        signed_url: urlData?.signedUrl || null,
                    };
                } catch (error) {
                    console.error('[COMPLAINT] Exception creating signed URL:', error);
                    return {
                        ...attachment,
                        signed_url: null,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            })
        );

        console.log('[COMPLAINT] Raw attachments from DB:', attachments?.length || 0);
        console.log('[COMPLAINT] Attachments with URLs:', attachmentsWithUrls.length, 'for complaint:', id);
        console.log('[COMPLAINT] Attachment details:', attachmentsWithUrls.map(a => ({
            id: a.id,
            file_name: a.file_name,
            storage_path: a.storage_path,
            has_signed_url: !!a.signed_url
        })));

        // Get messages (filter out internal messages for public access)
        const { data: messages } = await (
            serverClient.from('complaint_messages') as unknown as {
                select: (columns: string) => {
                    eq: (column: string, value: string) => {
                        order: (column: string, options: { ascending: boolean }) => Promise<{
                            data: Array<{
                                id: string;
                                complaint_id: string;
                                sender_id: string | null;
                                sender_type: 'admin' | 'complainant' | 'system';
                                message: string;
                                is_internal: boolean;
                                created_at: string;
                                metadata: Json | null;
                            }> | null;
                        }>;
                    };
                };
            }
        )
            .select('*')
            .eq('complaint_id', id)
            .order('created_at', { ascending: true });

        // Filter messages based on access level
        const filteredMessages = isAdmin
            ? messages || []
            : (messages || []).filter((msg) => !msg.is_internal);

        // Prepare complaint data (hide internal_notes for public access)
        const complaintData = isAdmin
            ? complaint
            : {
                  ...complaint,
                  internal_notes: undefined, // Don't expose internal notes publicly
              };

        const responseData = {
            complaint: complaintData,
            attachments: attachmentsWithUrls,
            messages: filteredMessages,
        };

        console.log('[COMPLAINT] Response data structure:', {
            hasComplaint: !!responseData.complaint,
            attachmentsCount: responseData.attachments.length,
            messagesCount: responseData.messages.length
        });

        return NextResponse.json(responseData);
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

        // Use service role client to bypass RLS
        const serverClient = createServerClient();

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
                const { data: slaData } = await (serverClient.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown }>)('calculate_sla_deadline', {
                    priority_level: body.priority,
                });
                if (slaData) {
                    updateData.sla_deadline = slaData as string;
                }
            }
        }

        const { data: complaint, error } = await (
            serverClient.from('complaints') as unknown as {
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

