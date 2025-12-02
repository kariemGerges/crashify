// =============================================
// FILE: app/api/complaints/search/route.ts
// Search complaint by number (REQ-76)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';

// GET: Search complaint by number
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const number = searchParams.get('number');

        if (!number) {
            return NextResponse.json(
                { error: 'Complaint number is required' },
                { status: 400 }
            );
        }

        const { data: complaint, error } = await supabase
            .from('complaints')
            .select('id, complaint_number, status, created_at')
            .eq('complaint_number', number.toUpperCase())
            .single();

        if (error || !complaint) {
            return NextResponse.json(
                { error: 'Complaint not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            complaint,
        });
    } catch (error) {
        console.error('[COMPLAINT_SEARCH] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to search complaint',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

