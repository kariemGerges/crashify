// =============================================
// FILE: app/api/supplementary/route.ts
// Supplementary Requests API (REQ-138-147)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { logAuditEventFromRequest } from '@/server/lib/audit/logger';
import type { Database } from '@/server/lib/types/database.types';

type SupplementaryInsert = Database['public']['Tables']['supplementary_requests']['Insert'];

// POST: Create supplementary request
export async function POST(request: NextRequest) {
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

        const formData = await request.formData();
        const assessmentId = formData.get('assessmentId') as string;
        const amount = parseFloat((formData.get('amount') as string) || '0');
        const pdfFile = formData.get('pdf') as File | null;

        if (!assessmentId) {
            return NextResponse.json(
                { error: 'Assessment ID is required' },
                { status: 400 }
            );
        }

        // Use service role client to bypass RLS (we've already verified user is authenticated)
        const serverClient = createServerClient();

        // Verify assessment exists
        const { data: assessment, error: assessmentError } = await serverClient
            .from('assessments')
            .select('id')
            .eq('id', assessmentId)
            .single();

        if (assessmentError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Upload PDF if provided
        let pdfPath: string | null = null;
        if (pdfFile) {
            const fileBuffer = await pdfFile.arrayBuffer();
            const fileName = `${assessmentId}/supplementary/${Date.now()}_${pdfFile.name}`;
            const { error: uploadError } = await serverClient.storage
                .from('Assessment-photos')
                .upload(fileName, fileBuffer, {
                    contentType: pdfFile.type,
                    upsert: false,
                });

            if (!uploadError) {
                pdfPath = fileName;
            }
        }

        // Get original quote data for AI review
        // TODO: Fetch original assessment quote data

        // Create supplementary request
        const supplementaryData: SupplementaryInsert = {
            original_assessment_id: assessmentId,
            amount,
            pdf_path: pdfPath,
            status: 'pending',
            metadata: {
                created_by: user.id,
            },
        };

        const { data: supplementary, error: insertError } = await (
            serverClient.from('supplementary_requests') as unknown as {
                insert: (values: SupplementaryInsert[]) => {
                    select: () => {
                        single: () => Promise<{
                            data: Database['public']['Tables']['supplementary_requests']['Row'] | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert([supplementaryData])
            .select()
            .single();

        if (insertError || !supplementary) {
            return NextResponse.json(
                {
                    error: 'Failed to create supplementary request',
                    details: insertError?.message || 'Unknown error',
                },
                { status: 500 }
            );
        }

        // REQ-143: Send to Claude for review if PDF available
        if (pdfPath) {
            try {
                // TODO: Extract text from PDF and send to Claude
                // const pdfText = await extractPDFText(pdfPath);
                // const aiReview = await reviewSupplementaryQuote(originalQuote, supplementaryQuote, originalAmount);
                // Update supplementary with AI recommendation
            } catch (aiError) {
                console.error('[SUPPLEMENTARY] AI review error:', aiError);
                // Continue without AI review
            }
        }

        // Log audit event
        await logAuditEventFromRequest(request, {
            userId: user.id,
            action: 'supplementary_created' as unknown as Parameters<typeof logAuditEventFromRequest>[1]['action'],
            resourceType: 'supplementary_request',
            resourceId: supplementary.id,
            success: true,
        });

        return NextResponse.json({
            success: true,
            supplementary,
        });
    } catch (error) {
        console.error('[SUPPLEMENTARY] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create supplementary request',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET: List supplementary requests
export async function GET(request: NextRequest) {
    try {
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use service role client to bypass RLS (we've already verified user is authenticated)
        const serverClient = createServerClient();

        const searchParams = request.nextUrl.searchParams;
        const assessmentId = searchParams.get('assessmentId');
        const status = searchParams.get('status');

        let query = serverClient
            .from('supplementary_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (assessmentId) {
            query = query.eq('original_assessment_id', assessmentId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch supplementary requests' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: data || [],
        });
    } catch (error) {
        console.error('[SUPPLEMENTARY] List error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch supplementary requests',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

