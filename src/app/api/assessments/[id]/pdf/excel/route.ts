// =============================================
// FILE: app/api/assessments/[id]/pdf/excel/route.ts
// Export assessment data to Excel format
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { assessmentToPDFData } from '@/server/lib/utils/assessment-to-pdf-data';
import * as XLSX from 'xlsx';
import type { PDFReportType } from '@/server/lib/types/pdf-report.types';

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

        // Convert to PDF data format
        const pdfData = assessmentToPDFData(assessment);

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Summary sheet
        const summaryData: Array<Array<string | number>> = [
            ['Assessment Report Summary'],
            [],
            ['Report Type', reportType],
            ['Assessment Reference', pdfData.assessment_reference_number || id],
            ['Claim Reference', pdfData.claim_reference || ''],
            ['Policy Number', pdfData.policy_number || ''],
            [],
            ['Vehicle Information'],
            ['Make', pdfData.vehicle?.make || ''],
            ['Model', pdfData.vehicle?.model || ''],
            ['Year', pdfData.vehicle?.year || ''],
            ['Registration', pdfData.vehicle?.registration || ''],
            ['VIN', pdfData.vehicle?.vin || ''],
            [],
            ['Financial Summary'],
            ['Labor Total Cost', pdfData.labor_total_cost || 0],
            ['Parts Total Cost', pdfData.parts_total_cost || 0],
            ['Sublet Total Cost', pdfData.sublet_total_cost || 0],
            ['Misc Total Cost', pdfData.misc_total_cost || 0],
            ['Total Excluding GST', pdfData.total_excluding_gst || 0],
            ['GST Amount', pdfData.gst_amount || 0],
            ['Total Including GST', pdfData.total_including_gst || 0],
            ['Excess Amount', pdfData.excess_amount || 0],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Labor items sheet
        if (pdfData.labor_items && pdfData.labor_items.length > 0) {
            const laborHeaders = [
                'Description',
                'Comment',
                'Rate Type',
                'Hours Quoted',
                'Hours Assessed',
                'Variance',
                'Rate',
                'Cost',
            ];
            const laborRows = pdfData.labor_items.map((item) => [
                item.description,
                item.comment || '',
                item.rate_type || '',
                item.hours_quoted || 0,
                item.hours_assessed || 0,
                item.variance || 0,
                item.rate || 0,
                item.cost || 0,
            ]);
            const laborData = [laborHeaders, ...laborRows];
            const laborSheet = XLSX.utils.aoa_to_sheet(laborData);
            XLSX.utils.book_append_sheet(workbook, laborSheet, 'Labor');
        }

        // Parts items sheet
        if (pdfData.parts_items && pdfData.parts_items.length > 0) {
            const partsHeaders = [
                'Part Number',
                'Item',
                'Part Type',
                'Comment',
                'Quantity',
                'Quantity Assessed',
                'Price',
                'Price Assessed',
                'Variance',
            ];
            const partsRows = pdfData.parts_items.map((item) => [
                item.part_number || '',
                item.item,
                item.part_type || '',
                item.comment || '',
                item.quantity || 0,
                item.quantity_assessed || 0,
                item.price || 0,
                item.price_assessed || 0,
                item.variance || 0,
            ]);
            const partsData = [partsHeaders, ...partsRows];
            const partsSheet = XLSX.utils.aoa_to_sheet(partsData);
            XLSX.utils.book_append_sheet(workbook, partsSheet, 'Parts');
        }

        // Sublet items sheet
        if (pdfData.sublet_items && pdfData.sublet_items.length > 0) {
            const subletHeaders = ['Description', 'Comment', 'Quoted', 'Assessed', 'Variance'];
            const subletRows = pdfData.sublet_items.map((item) => [
                item.description,
                item.comment || '',
                item.quoted || 0,
                item.assessed || 0,
                item.variance || 0,
            ]);
            const subletData = [subletHeaders, ...subletRows];
            const subletSheet = XLSX.utils.aoa_to_sheet(subletData);
            XLSX.utils.book_append_sheet(workbook, subletSheet, 'Sublets');
        }

        // Misc items sheet
        if (pdfData.misc_items && pdfData.misc_items.length > 0) {
            const miscHeaders = ['Description', 'Comment', 'Quoted', 'Assessed', 'Variance'];
            const miscRows = pdfData.misc_items.map((item) => [
                item.description,
                item.comment || '',
                item.quoted || 0,
                item.assessed || 0,
                item.variance || 0,
            ]);
            const miscData = [miscHeaders, ...miscRows];
            const miscSheet = XLSX.utils.aoa_to_sheet(miscData);
            XLSX.utils.book_append_sheet(workbook, miscSheet, 'Miscellaneous');
        }

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
        });

        // Generate filename
        const reportTypeNames: Record<PDFReportType, string> = {
            'assessed-quote': 'Assessed-Quote',
            'detailed-assessment': 'Detailed-Assessment-Report',
            'salvage-tender': 'Salvage-Tender-Request',
            'total-loss': 'Total-Loss-Assessment',
        };

        const filename = `${reportTypeNames[reportType]}-${assessment.assessment_reference_number || id}.xlsx`;

        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('[EXCEL_EXPORT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate Excel file',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

