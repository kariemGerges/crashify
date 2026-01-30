import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cicop/search
 * Global search across assessments
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const supabase = createServerClient();
        const pattern = `%${query.trim().toLowerCase()}%`;
        // Quote pattern so commas/parentheses in input don't break PostgREST .or() filter
        const quoted = `"${pattern.replace(/"/g, '""')}"`;

        // Search across multiple fields (OR: match any column)
        const orFilter = [
            `claim_number.ilike.${quoted}`,
            `rego.ilike.${quoted}`,
            `vin.ilike.${quoted}`,
            `customer_name.ilike.${quoted}`,
            `vehicle_make.ilike.${quoted}`,
            `vehicle_model.ilike.${quoted}`,
        ].join(',');

        const { data: assessments, error } = await supabase
            .from('cicop_assessments')
            .select('*')
            .or(orFilter)
            .limit(10);

        if (error) {
            console.error('Error searching assessments:', error);
            return NextResponse.json(
                { error: 'Search failed', results: [] },
                { status: 500 }
            );
        }

        // Format results for display
        const results = (assessments || []).map((a: any) => ({
            assessment_no: a.assessment_no,
            claim_number: a.claim_number,
            status: a.status,
            make: a.vehicle_make,
            model: a.vehicle_model,
            rego: a.rego,
            insurer: a.insurer,
            customer: a.customer_name,
            date_received: a.date_received,
            savings: a.savings ? `$${a.savings.toLocaleString()}` : '$0',
        }));

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('Error in search API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
