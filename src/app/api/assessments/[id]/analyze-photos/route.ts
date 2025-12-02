// =============================================
// FILE: app/api/assessments/[id]/analyze-photos/route.ts
// Analyze damage photos with Claude AI (REQ-32)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { analyzeDamagePhotos } from '@/server/lib/services/claude-service';
import { logAuditEventFromRequest } from '@/server/lib/audit/logger';
import type { Database } from '@/server/lib/types/database.types';

type UploadedFileRow = Database['public']['Tables']['uploaded_files']['Row'];

// POST: Analyze photos with Claude AI
export async function POST(
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

        // Get assessment
        const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', id)
            .single();

        if (assessmentError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Get uploaded files (photos)
        const { data: files, error: filesError } = (await supabase
            .from('uploaded_files')
            .select('*')
            .eq('assessment_id', id)
            .eq('file_type', 'image')) as {
            data: UploadedFileRow[] | null;
            error: unknown;
        };

        if (filesError) {
            return NextResponse.json(
                { error: 'Failed to fetch photos' },
                { status: 500 }
            );
        }

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No photos found for this assessment' },
                { status: 400 }
            );
        }

        // Get signed URLs for photos
        const photos = await Promise.all(
            files.map(async file => {
                const { data: urlData } = await supabase.storage
                    .from('Assessment-photos')
                    .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

                return {
                    url: urlData?.signedUrl || '',
                    description: file.file_name,
                };
            })
        );

        // Analyze photos with Claude AI
        const analysisResult = await analyzeDamagePhotos(photos);

        // Save analysis result to assessment metadata or create analysis record
        const { error: updateError } = await (
            supabase.from('assessments') as unknown as {
                update: (
                    values: Database['public']['Tables']['assessments']['Update']
                ) => {
                    eq: (
                        column: string,
                        value: string
                    ) => Promise<{
                        data:
                            | Database['public']['Tables']['assessments']['Row']
                            | null;
                        error: { message: string } | null;
                    }>;
                };
            }
        )
            .update({
                internal_notes: `AI Analysis: ${
                    analysisResult.damageDescription
                }\nSeverity: ${
                    analysisResult.severity
                }\nAreas: ${analysisResult.damageAreas.join(', ')}`,
            })
            .eq('id', id);

        if (updateError) {
            console.error('[ANALYZE_PHOTOS] Update error:', updateError);
        }

        // Log audit event
        await logAuditEventFromRequest(request, {
            userId: user.id,
            action: 'other',
            resourceType: 'assessment',
            resourceId: id,
            details: {
                ai_action: 'photo_analysis',
                damageDetected: analysisResult.damageDetected,
                severity: analysisResult.severity,
            },
            success: true,
        });

        return NextResponse.json({
            success: true,
            analysis: analysisResult,
        });
    } catch (error) {
        console.error('[ANALYZE_PHOTOS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to analyze photos',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
