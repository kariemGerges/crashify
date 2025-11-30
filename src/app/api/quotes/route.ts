// =============================================
// FILE: app/api/quotes/route.ts
// GET: List quote requests (admin only)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

export const runtime = 'nodejs';

// GET: List quote requests
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const searchParams = request.nextUrl.searchParams;

        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Build query
        let query = supabase
            .from('quote_requests')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filter by status
        if (status) {
            query = query.eq('status', status);
        }

        // Apply pagination
        const { data, error, count } = await query.range(from, to);

        if (error) {
            return NextResponse.json(
                {
                    error: 'Failed to fetch quote requests',
                    details: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: data || [],
            pagination: {
                page,
                pageSize,
                total: count || 0,
                totalPages: count ? Math.ceil(count / pageSize) : 0,
            },
        });
    } catch (error) {
        console.error('[QUOTES_LIST] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch quote requests',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

