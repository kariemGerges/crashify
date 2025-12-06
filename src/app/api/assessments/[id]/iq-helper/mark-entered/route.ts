// =============================================
// FILE: app/api/assessments/[id]/iq-helper/mark-entered/route.ts
// POST: Mark assessment as entered in IQ Controls
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { Database } from '@/server/lib/types/database.types';
import { revalidateTag } from 'next/cache';

type AssessmentUpdate = Database['public']['Tables']['assessments']['Update'];
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

export const runtime = 'nodejs';

// POST: Mark assessment as entered in IQ Controls
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerClient();
        const { id: assessmentId } = await params;
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent');
        
        const body = await request.json();
        const { iqReference } = body;

        // Validate assessment ID
        if (
            !assessmentId ||
            typeof assessmentId !== 'string' ||
            assessmentId.length < 10
        ) {
            return NextResponse.json(
                { error: 'Invalid assessment ID' },
                { status: 400 }
            );
        }

        // Verify assessment exists
        const { data: assessment, error: assessmentError } = (await supabase
            .from('assessments')
            .select('id, status, internal_notes')
            .eq('id', assessmentId)
            .is('deleted_at', null)
            .single()) as { data: { id: string; status: string; internal_notes?: string | null } | null; error: unknown };

        if (assessmentError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Update assessment status
        // Note: We'll add these fields to the database schema later
        // For now, we'll update status to 'processing' and store IQ reference in internal_notes if needed
        const updateData: AssessmentUpdate = {
            status: 'processing',
            updated_at: new Date().toISOString(),
            // If iq_reference field exists in schema, use it:
            // iq_reference: iqReference || null,
            // entered_iq_at: new Date().toISOString(),
        };

        // If IQ reference provided and we have internal_notes field, append it
        if (iqReference && assessment.internal_notes !== undefined) {
            const existingNotes = assessment.internal_notes || '';
            const iqNote = `\n\n[IQ Controls] Reference: ${iqReference} - Entered at ${new Date().toLocaleString('en-AU')}`;
            updateData.internal_notes = existingNotes + iqNote;
        }

        const { data: updatedAssessment, error: updateError } = await (
            supabase.from('assessments') as unknown as {
                update: (values: AssessmentUpdate) => {
                    eq: (column: string, value: string) => {
                        select: () => {
                            single: () => Promise<{
                                data: Database['public']['Tables']['assessments']['Row'] | null;
                                error: { message: string } | null;
                            }>;
                        };
                    };
                };
            }
        )
            .update(updateData)
            .eq('id', assessmentId)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json(
                {
                    error: 'Failed to update assessment',
                    details: updateError.message,
                },
                { status: 500 }
            );
        }

        // Log audit event
        try {
            const auditLogInsert: AuditLogInsert = {
                action: 'marked_entered_iq_controls',
                resource_type: 'assessment',
                resource_id: assessmentId,
                details: {
                    old_status: assessment.status,
                    new_status: 'processing',
                    iq_reference: iqReference || null,
                    entered_at: new Date().toISOString(),
                },
                ip_address: ipAddress || undefined,
                user_agent: userAgent || undefined,
                created_at: new Date().toISOString(),
                success: true,
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: AuditLogInsert[]) => Promise<unknown>;
            }).insert([auditLogInsert]);
        } catch (auditError) {
            console.error('[IQ_HELPER] Audit log failed:', auditError);
            // Don't fail the request if audit logging fails
        }

        // Invalidate cache
        await revalidateTag('assessment', 'default');
        await revalidateTag('assessments-list', 'default');

        return NextResponse.json({
            success: true,
            data: updatedAssessment,
            message: 'Assessment marked as entered in IQ Controls',
        });
    } catch (error) {
        console.error('[IQ_HELPER] Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

