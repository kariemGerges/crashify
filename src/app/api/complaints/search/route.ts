// =============================================
// FILE: app/api/complaints/search/route.ts
// Search complaint by number (REQ-76)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

// GET: Search complaint by number (public endpoint for tracking)
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

        // Use service role client to bypass RLS for public tracking
        const serverClient = createServerClient();

        // Normalize the complaint number (trim and uppercase)
        const normalizedNumber = number.trim().toUpperCase();

        console.log('[COMPLAINT_SEARCH] Searching for:', normalizedNumber);

        // Search for exact match (complaint numbers are stored in uppercase format COMP-YYYY-XXX)
        const { data: complaint, error } = await (
            serverClient.from('complaints') as unknown as {
                select: (columns: string) => {
                    eq: (column: string, value: string) => {
                        maybeSingle: () => Promise<{
                            data: {
                                id: string;
                                complaint_number: string;
                                status: string;
                                created_at: string;
                            } | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .select('id, complaint_number, status, created_at')
            .eq('complaint_number', normalizedNumber)
            .maybeSingle();

        if (error) {
            // Log the error for debugging
            console.error('[COMPLAINT_SEARCH] Database error:', error, 'Number searched:', number, 'Normalized:', normalizedNumber);
            return NextResponse.json(
                { error: 'Failed to search complaint', details: error?.message },
                { status: 500 }
            );
        }

        if (!complaint) {
            // Try to find similar complaint numbers for debugging
            const { data: similarComplaints } = await (
                serverClient.from('complaints') as unknown as {
                    select: (columns: string) => {
                        like: (column: string, pattern: string) => {
                            limit: (count: number) => {
                                order: (column: string, options: { ascending: boolean }) => Promise<{
                                    data: Array<{ complaint_number: string; created_at: string }> | null;
                                }>;
                            };
                        };
                    };
                }
            )
                .select('complaint_number, created_at')
                .like('complaint_number', 'COMP-2025-%')
                .limit(5)
                .order('created_at', { ascending: false });
            
            console.log('[COMPLAINT_SEARCH] No complaint found for:', normalizedNumber);
            console.log('[COMPLAINT_SEARCH] Recent complaint numbers:', similarComplaints?.map(c => c.complaint_number) || []);
            
            return NextResponse.json(
                { 
                    error: 'Complaint not found',
                    hint: similarComplaints && similarComplaints.length > 0 
                        ? `Recent complaints: ${similarComplaints.map(c => c.complaint_number).join(', ')}`
                        : 'No complaints found in database'
                },
                { status: 404 }
            );
        }

        console.log('[COMPLAINT_SEARCH] Found complaint:', complaint.id, complaint.complaint_number);

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

