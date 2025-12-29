// =============================================
// FILE: app/api/assessments/[id]/estimate/recalculate/route.ts
// POST: Recalculate all totals based on current estimate items
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

// POST: Recalculate totals
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

        // Get all items
        const laborItems = (typedAssessment.labor_items as LaborItem[] | null) || [];
        const partsItems = (typedAssessment.parts_items as PartItem[] | null) || [];
        const subletItems = (typedAssessment.sublet_items as SubletItem[] | null) || [];
        const miscItems = (typedAssessment.misc_items as MiscItem[] | null) || [];

        // Get rates
        const rateRR = typedAssessment.labor_rate_rr || 0;
        const rateRA = typedAssessment.labor_rate_ra || 0;
        const rateREF = typedAssessment.labor_rate_ref || 0;

        // Calculate labor totals
        let laborTotalHours = 0;
        let laborTotalCost = 0;

        laborItems.forEach((item) => {
            const hours = item.hours_assessed || item.hours_quoted || 0;
            laborTotalHours += hours;

            let rate = 0;
            if (item.rate_type === 'RR') rate = rateRR;
            else if (item.rate_type === 'RA') rate = rateRA;
            else if (item.rate_type === 'REF') rate = rateREF;
            else rate = item.rate || rateRR; // Default to RR

            const cost = hours * rate;
            laborTotalCost += cost;
        });

        // Calculate parts total
        const partsTotalCost = partsItems.reduce((sum, item) => {
            const qty = item.quantity_assessed || item.quantity || 0;
            const price = item.price_assessed || item.price || 0;
            return sum + qty * price;
        }, 0);

        // Calculate sublet total
        const subletTotalCost = subletItems.reduce((sum, item) => {
            return sum + (item.assessed || item.quoted || 0);
        }, 0);

        // Calculate misc total
        const miscTotalCost = miscItems.reduce((sum, item) => {
            return sum + (item.assessed || item.quoted || 0);
        }, 0);

        // Calculate grand totals
        const totalExcludingGST = laborTotalCost + partsTotalCost + subletTotalCost + miscTotalCost;
        const gstAmount = totalExcludingGST * 0.1; // 10% GST
        const totalIncludingGST = totalExcludingGST + gstAmount;

        // Update assessment with calculated totals
        const updateData = {
            labor_total_hours: laborTotalHours,
            labor_total_cost: laborTotalCost,
            parts_total_cost: partsTotalCost,
            sublet_total_cost: subletTotalCost,
            misc_total_cost: miscTotalCost,
            total_excluding_gst: totalExcludingGST,
            gst_amount: gstAmount,
            total_including_gst: totalIncludingGST,
            // Update assessed totals
            assessed_hours: laborTotalHours,
            assessed_total: totalIncludingGST,
            // Calculate variances if quoted values exist
            hours_variance: typedAssessment.quoted_hours
                ? laborTotalHours - (typedAssessment.quoted_hours || 0)
                : null,
            total_variance: typedAssessment.quoted_total
                ? totalIncludingGST - (typedAssessment.quoted_total || 0)
                : null,
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
                    error: 'Failed to recalculate totals',
                    details: updateError.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                labor_total_hours: laborTotalHours,
                labor_total_cost: laborTotalCost,
                parts_total_cost: partsTotalCost,
                sublet_total_cost: subletTotalCost,
                misc_total_cost: miscTotalCost,
                total_excluding_gst: totalExcludingGST,
                gst_amount: gstAmount,
                total_including_gst: totalIncludingGST,
            },
        });
    } catch (error) {
        console.error('[ESTIMATE_RECALCULATE] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to recalculate totals',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

