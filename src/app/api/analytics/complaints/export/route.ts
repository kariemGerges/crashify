// =============================================
// FILE: app/api/analytics/complaints/export/route.ts
// Export Complaints Analytics Data
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import * as XLSX from 'xlsx';
import type { Database } from '@/server/lib/types/database.types';

type ComplaintRow = Database['public']['Tables']['complaints']['Row'];

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

        // Use service role client to bypass RLS
        const serverClient = createServerClient();

        // Get all complaints data
        const { data: complaints, error } = (await serverClient
            .from('complaints')
            .select('*')
            .order('created_at', { ascending: false })) as { data: ComplaintRow[] | null; error: unknown };

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
                'Complaint Number',
                'Complainant Name',
                'Complainant Email',
                'Complainant Phone',
                'Category',
                'Priority',
                'Status',
                'Description',
                'Created At',
                'Resolved At',
                'Closed At',
                'SLA Deadline',
                'SLA Breached',
            ];

            const rows = (complaints || []).map((complaint) => [
                complaint.id,
                complaint.complaint_number || '',
                complaint.complainant_name || '',
                complaint.complainant_email || '',
                complaint.complainant_phone || '',
                complaint.category || '',
                complaint.priority || '',
                complaint.status || '',
                (complaint.description || '').replace(/"/g, '""').substring(0, 500), // Limit description length
                complaint.created_at || '',
                complaint.resolved_at || '',
                complaint.closed_at || '',
                complaint.sla_deadline || '',
                complaint.sla_breached ? 'Yes' : 'No',
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            ].join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="complaints-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
                },
            });
        } else if (format === 'xlsx') {
            // Generate Excel
            const worksheetData = [
                [
                    'ID',
                    'Complaint Number',
                    'Complainant Name',
                    'Complainant Email',
                    'Complainant Phone',
                    'Category',
                    'Priority',
                    'Status',
                    'Description',
                    'Created At',
                    'Resolved At',
                    'Closed At',
                    'SLA Deadline',
                    'SLA Breached',
                ],
                ...(complaints || []).map((complaint) => [
                    complaint.id,
                    complaint.complaint_number || '',
                    complaint.complainant_name || '',
                    complaint.complainant_email || '',
                    complaint.complainant_phone || '',
                    complaint.category || '',
                    complaint.priority || '',
                    complaint.status || '',
                    (complaint.description || '').substring(0, 500), // Limit description length
                    complaint.created_at || '',
                    complaint.resolved_at || '',
                    complaint.closed_at || '',
                    complaint.sla_deadline || '',
                    complaint.sla_breached ? 'Yes' : 'No',
                ]),
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');

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
                    'Content-Disposition': `attachment; filename="complaints-analytics-${new Date().toISOString().split('T')[0]}.xlsx"`,
                },
            });
        }

        return NextResponse.json(
            { error: 'Invalid format. Use csv or xlsx' },
            { status: 400 }
        );
    } catch (error) {
        console.error('[COMPLAINTS_EXPORT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to export data',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

