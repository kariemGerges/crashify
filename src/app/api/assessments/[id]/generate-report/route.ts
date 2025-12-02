// =============================================
// FILE: app/api/assessments/[id]/generate-report/route.ts
// Generate assessment report with Claude AI (REQ-34)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { generateAssessmentReport } from '@/server/lib/services/claude-service';
import { logAuditEventFromRequest } from '@/server/lib/audit/logger';

// POST: Generate assessment report
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

        // Get uploaded files
        const { data: files } = (await supabase
            .from('uploaded_files')
            .select('*')
            .eq('assessment_id', id)) as { data: Array<{ file_type: string; storage_path: string; file_name: string }> | null };

        // Get signed URLs for photos
        const photos = await Promise.all(
            (files || [])
                .filter((f) => f.file_type.startsWith('image/'))
                .map(async (file) => {
                    const { data: urlData } = await supabase.storage
                        .from('Assessment-photos')
                        .createSignedUrl(file.storage_path, 3600);

                    return {
                        url: urlData?.signedUrl || '',
                        description: file.file_name,
                    };
                })
        );

        // Generate report with Claude AI
        const reportContent = await generateAssessmentReport({
            assessmentId: id,
            assessmentData: assessment as Record<string, unknown>,
            photos,
        });

        // Log audit event
        await logAuditEventFromRequest(request, {
            userId: user.id,
            action: 'report_generated',
            resourceType: 'assessment',
            resourceId: id,
            success: true,
        });

        return NextResponse.json({
            success: true,
            report: reportContent,
            format: 'markdown',
        });
    } catch (error) {
        console.error('[GENERATE_REPORT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate report',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

