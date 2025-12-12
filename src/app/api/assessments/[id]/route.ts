// =============================================
// FILE: app/api/assessments/[id]/route.ts
// GET: Get single assessment with files
// PATCH: Update assessment
// DELETE: Soft delete assessment
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';
import { revalidateTag } from 'next/cache';

type GetAssessmentFullArgs =
    Database['public']['Functions']['get_assessment_full']['Args'];
type GetAssessmentFullReturns =
    Database['public']['Functions']['get_assessment_full']['Returns'];
type AssessmentUpdate = Database['public']['Tables']['assessments']['Update'];

export const runtime = 'nodejs';

// GET: Get single assessment
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerClient();
        const { id } = await params;

        // Try RPC function first
        const { data: rpcData, error: rpcError } = (await (supabase.rpc as unknown as {
            (functionName: string, args: GetAssessmentFullArgs): Promise<{
                data: GetAssessmentFullReturns | null;
                error: { message: string } | null;
            }>;
        })(
            'get_assessment_full',
            { assessment_uuid: id }
        ));

        // If RPC works and returns data, use it
        if (!rpcError && rpcData && rpcData.length > 0) {
            const assessmentData = rpcData[0];
            // Check if assessment is soft-deleted
            if (
                assessmentData.assessment &&
                typeof assessmentData.assessment === 'object' &&
                'deleted_at' in assessmentData.assessment &&
                assessmentData.assessment.deleted_at
            ) {
                return NextResponse.json(
                    { error: 'Assessment not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({ data: assessmentData });
        }

        // Fallback: Query directly from assessments table
        const { data: assessment, error: assessmentError } = await (supabase.from('assessments') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    is: (column: string, value: null) => {
                        single: () => Promise<{
                            data: Database['public']['Tables']['assessments']['Row'] | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            };
        })
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (assessmentError || !assessment) {
            console.log(
                `Assessment ${id} not found:`,
                assessmentError?.message || 'No data'
            );
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Get files separately
        const { data: files } = await supabase
            .from('uploaded_files')
            .select('*')
            .eq('assessment_id', id)
            .order('uploaded_at', { ascending: false });

        return NextResponse.json({
            data: {
                assessment,
                files: files || [],
            },
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// PATCH: Update assessment
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerClient();
        const { id } = await params;
        const updates = await request.json();

        // Remove fields that shouldn't be updated
        delete updates.id;
        delete updates.created_at;
        delete updates.deleted_at;

        // Validate that we have fields to update
        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const updateData: AssessmentUpdate = updates;
        const { data, error } = await (supabase.from('assessments') as unknown as {
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
        })
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) {
            console.error('Assessment update error:', error || 'No data returned');
            return NextResponse.json(
                {
                    error: 'Failed to update assessment',
                    details: error?.message || 'No data returned from update',
                },
                { status: 500 }
            );
        }

        // Invalidate cache
        await revalidateTag('assessment', 'default');
        await revalidateTag('assessments-list', 'default');

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// DELETE: Soft delete
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerClient();
        const { id } = await params;

        const deleteUpdate: AssessmentUpdate = { deleted_at: new Date().toISOString() };
        const { error } = await (supabase.from('assessments') as unknown as {
            update: (values: AssessmentUpdate) => {
                eq: (column: string, value: string) => Promise<{
                    error: { message: string } | null;
                }>;
            };
        })
            .update(deleteUpdate)
            .eq('id', id);

        if (error) {
            return NextResponse.json(
                {
                    error: 'Failed to delete assessment',
                    details: error.message,
                },
                { status: 500 }
            );
        }

        // Invalidate cache
        await revalidateTag('assessments-list', 'default');
        await revalidateTag('stats', 'default');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
