// =============================================
// FILE: app/api/analytics/export/route.ts
// Export Analytics Data (REQ-53, REQ-54)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import * as XLSX from 'xlsx';
import type { Database } from '@/server/lib/types/database.types';

type AssessmentRow = Database['public']['Tables']['assessments']['Row'] & { completed_at?: string | null };

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const format = searchParams.get('format') || 'csv';

        // Get all assessments data
        const { data: assessments, error } = (await supabase
            .from('assessments')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })) as { data: AssessmentRow[] | null; error: unknown };

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch data' },
                { status: 500 }
            );
        }

        if (format === 'csv') {
            // Generate CSV
            const headers = [
                'ID',
                'Company Name',
                'Contact Name',
                'Email',
                'Phone',
                'Assessment Type',
                'Status',
                'Make',
                'Model',
                'Registration',
                'Created At',
                'Completed At',
            ];

            const rows = (assessments || []).map((assessment) => [
                assessment.id,
                assessment.company_name || '',
                assessment.your_name || '',
                assessment.your_email || '',
                assessment.your_phone || '',
                assessment.assessment_type || '',
                assessment.status || '',
                assessment.make || '',
                assessment.model || '',
                assessment.registration || '',
                assessment.created_at || '',
                assessment.completed_at || '',
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            ].join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`,
                },
            });
        } else if (format === 'xlsx') {
            // Generate Excel
            const worksheetData = [
                [
                    'ID',
                    'Company Name',
                    'Contact Name',
                    'Email',
                    'Phone',
                    'Assessment Type',
                    'Status',
                    'Make',
                    'Model',
                    'Registration',
                    'Created At',
                    'Completed At',
                ],
                ...(assessments || []).map((assessment) => [
                    assessment.id,
                    assessment.company_name || '',
                    assessment.your_name || '',
                    assessment.your_email || '',
                    assessment.your_phone || '',
                    assessment.assessment_type || '',
                    assessment.status || '',
                    assessment.make || '',
                    assessment.model || '',
                    assessment.registration || '',
                    assessment.created_at || '',
                    assessment.completed_at || '',
                ]),
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessments');

            // Add formatting
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
                if (!worksheet[cellAddress]) continue;
                worksheet[cellAddress].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: 'FFD700' } },
                };
            }

            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            return new NextResponse(excelBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.xlsx"`,
                },
            });
        }

        return NextResponse.json(
            { error: 'Invalid format. Use csv or xlsx' },
            { status: 400 }
        );
    } catch (error) {
        console.error('[EXPORT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to export data',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

