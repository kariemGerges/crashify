// =============================================
// FILE: app/api/analytics/report/pdf/route.ts
// Generate Monthly PDF Report (REQ-54)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { jsPDF } from 'jspdf';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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

        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);

        // Get monthly statistics
        const { count: totalThisMonth } = await supabase
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfCurrentMonth.toISOString())
            .lte('created_at', endOfCurrentMonth.toISOString())
            .is('deleted_at', null);

        const { count: completedThisMonth } = await supabase
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('created_at', startOfCurrentMonth.toISOString())
            .lte('created_at', endOfCurrentMonth.toISOString())
            .is('deleted_at', null);

        // Generate PDF
        const doc = new jsPDF();
        let yPos = 20;

        // Title
        doc.setFontSize(20);
        doc.text('Monthly Assessment Report', 105, yPos, { align: 'center' });
        yPos += 10;

        // Date
        doc.setFontSize(12);
        doc.text(`Report Period: ${format(startOfCurrentMonth, 'MMMM yyyy')}`, 105, yPos, {
            align: 'center',
        });
        yPos += 15;

        // Statistics
        doc.setFontSize(14);
        doc.text('Summary Statistics', 20, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.text(`Total Assessments: ${totalThisMonth || 0}`, 20, yPos);
        yPos += 7;
        doc.text(`Completed: ${completedThisMonth || 0}`, 20, yPos);
        yPos += 7;
        doc.text(
            `Completion Rate: ${totalThisMonth ? ((completedThisMonth || 0) / totalThisMonth * 100).toFixed(1) : 0}%`,
            20,
            yPos
        );

        // Convert to buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="monthly-report-${format(now, 'yyyy-MM')}.pdf"`,
            },
        });
    } catch (error) {
        console.error('[PDF_REPORT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate PDF report',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

