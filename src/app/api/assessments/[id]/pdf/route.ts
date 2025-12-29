// =============================================
// FILE: app/api/assessments/[id]/pdf/route.ts
// Generate PDF reports for assessments
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { generatePDFReport } from '@/server/lib/utils/pdf-generators';
import { assessmentToPDFData } from '@/server/lib/utils/assessment-to-pdf-data';
import type { PDFReportType } from '@/server/lib/types/pdf-report.types';
import type { Database } from '@/server/lib/types/database.types';

type AssessmentRow = Database['public']['Tables']['assessments']['Row'];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const reportType = (searchParams.get('type') || 'detailed-assessment') as PDFReportType;

        // Validate report type
        const validTypes: PDFReportType[] = [
            'assessed-quote',
            'detailed-assessment',
            'salvage-tender',
            'total-loss',
        ];
        if (!validTypes.includes(reportType)) {
            return NextResponse.json(
                { error: 'Invalid report type' },
                { status: 400 }
            );
        }

        // Get assessment from database
        const serverClient = createServerClient();
        const { data: assessment, error: fetchError } = await serverClient
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

        // Ensure TypeScript recognizes all fields
        const typedAssessment = assessment as AssessmentRow;

        // Convert to PDF data format
        const pdfData = assessmentToPDFData(typedAssessment);

        // Generate PDF
        const doc = generatePDFReport({
            reportType,
            assessmentData: pdfData,
            includeCompanyHeader: true,
        });

        // Convert to buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        // Generate filename
        const reportTypeNames: Record<PDFReportType, string> = {
            'assessed-quote': 'Assessed-Quote',
            'detailed-assessment': 'Detailed-Assessment-Report',
            'salvage-tender': 'Salvage-Tender-Request',
            'total-loss': 'Total-Loss-Assessment',
        };

        const filename = `${reportTypeNames[reportType]}-${typedAssessment.assessment_reference_number || id}.pdf`;

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('[PDF_GENERATION] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

