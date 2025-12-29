// =============================================
// FILE: app/api/assessments/[id]/estimate/items/route.ts
// GET: Get all estimate items for an assessment
// POST: Add a new estimate item
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import type { Database } from '@/server/lib/types/database.types';
import type { LaborItem, PartItem, SubletItem, MiscItem } from '@/server/lib/types/pdf-report.types';

type AssessmentRow = Database['public']['Tables']['assessments']['Row'];
type Json = Database['public']['Tables']['assessments']['Row']['labor_items'];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Get all estimate items
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createServerClient();

        // Get assessment
        const { data: assessment, error: fetchError } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        const typedAssessment = assessment as AssessmentRow;

        // Extract items from JSONB fields
        const laborItems = (typedAssessment.labor_items as LaborItem[] | null) || [];
        const partsItems = (typedAssessment.parts_items as PartItem[] | null) || [];
        const subletItems = (typedAssessment.sublet_items as SubletItem[] | null) || [];
        const miscItems = (typedAssessment.misc_items as MiscItem[] | null) || [];

        return NextResponse.json({
            data: {
                labor: laborItems.map((item, index) => ({ ...item, _id: `labor_${index}`, _type: 'labor' })),
                parts: partsItems.map((item, index) => ({ ...item, _id: `parts_${index}`, _type: 'parts' })),
                sublet: subletItems.map((item, index) => ({ ...item, _id: `sublet_${index}`, _type: 'sublet' })),
                misc: miscItems.map((item, index) => ({ ...item, _id: `misc_${index}`, _type: 'misc' })),
                totals: {
                    labor_total_hours: typedAssessment.labor_total_hours,
                    labor_total_cost: typedAssessment.labor_total_cost,
                    labor_rate_rr: typedAssessment.labor_rate_rr,
                    labor_rate_ra: typedAssessment.labor_rate_ra,
                    labor_rate_ref: typedAssessment.labor_rate_ref,
                    parts_total_cost: typedAssessment.parts_total_cost,
                    sublet_total_cost: typedAssessment.sublet_total_cost,
                    misc_total_cost: typedAssessment.misc_total_cost,
                    total_excluding_gst: typedAssessment.total_excluding_gst,
                    gst_amount: typedAssessment.gst_amount,
                    total_including_gst: typedAssessment.total_including_gst,
                },
            },
        });
    } catch (error) {
        console.error('[ESTIMATE_ITEMS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch estimate items',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// POST: Add a new estimate item
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { itemType, item } = body as {
            itemType: 'labor' | 'parts' | 'sublet' | 'misc';
            item: LaborItem | PartItem | SubletItem | MiscItem;
        };

        if (!itemType || !item) {
            return NextResponse.json(
                { error: 'itemType and item are required' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Get current assessment
        const { data: assessment, error: fetchError } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        const typedAssessment = assessment as AssessmentRow;

        // Get current items array
        const fieldName = `${itemType}_items` as 'labor_items' | 'parts_items' | 'sublet_items' | 'misc_items';
        const currentItems = (typedAssessment[fieldName] as Json) || [];

        // Add new item
        const updatedItems = [...(Array.isArray(currentItems) ? currentItems : []), item as unknown as Json];

        // Update assessment
        const updateData = {
            [fieldName]: updatedItems as Json,
        };

        const { error: updateError } = await (
            supabase.from('assessments') as unknown as {
                update: (values: Record<string, unknown>) => {
                    eq: (column: string, value: string) => Promise<{
                        error: { message: string } | null;
                    }>;
                };
            }
        )
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            return NextResponse.json(
                {
                    error: 'Failed to add estimate item',
                    details: updateError.message,
                },
                { status: 500 }
            );
        }

        // Log adjustment
        await (
            supabase.from('estimate_adjustments') as unknown as {
                insert: (values: Record<string, unknown>) => Promise<{
                    error: { message: string } | null;
                }>;
            }
        ).insert({
            assessment_id: id,
            item_type: itemType,
            item_index: updatedItems.length - 1,
            action: 'created',
            new_value: item as unknown as Json,
            adjusted_by: user.id,
            comment: 'Item added via estimate editor',
        });

        return NextResponse.json({
            success: true,
            message: 'Estimate item added successfully',
        });
    } catch (error) {
        console.error('[ESTIMATE_ITEMS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to add estimate item',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

