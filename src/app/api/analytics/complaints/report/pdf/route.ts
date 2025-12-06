// =============================================
// FILE: app/api/analytics/complaints/report/pdf/route.ts
// Generate Monthly Complaints PDF Report
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
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

        // Use service role client to bypass RLS
        const serverClient = createServerClient();

        // Get monthly statistics
        const { count: totalThisMonth } = await serverClient
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfCurrentMonth.toISOString())
            .lte('created_at', endOfCurrentMonth.toISOString());

        const { count: resolvedThisMonth } = await serverClient
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'resolved')
            .gte('created_at', startOfCurrentMonth.toISOString())
            .lte('created_at', endOfCurrentMonth.toISOString());

        const { count: closedThisMonth } = await serverClient
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'closed')
            .gte('created_at', startOfCurrentMonth.toISOString())
            .lte('created_at', endOfCurrentMonth.toISOString());

        // Get overdue count
        const { count: overdueCount } = await serverClient
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .lt('sla_deadline', new Date().toISOString())
            .not('status', 'eq', 'closed')
            .not('status', 'eq', 'resolved');

        // Generate PDF
        const doc = new jsPDF();
        let yPos = 20;

        // Title
        doc.setFontSize(20);
        doc.text('Monthly Complaints Report', 105, yPos, { align: 'center' });
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
        doc.text(`Total Complaints: ${totalThisMonth || 0}`, 20, yPos);
        yPos += 7;
        doc.text(`Resolved: ${resolvedThisMonth || 0}`, 20, yPos);
        yPos += 7;
        doc.text(`Closed: ${closedThisMonth || 0}`, 20, yPos);
        yPos += 7;
        const totalResolved = (resolvedThisMonth || 0) + (closedThisMonth || 0);
        doc.text(
            `Resolution Rate: ${totalThisMonth ? ((totalResolved / totalThisMonth) * 100).toFixed(1) : 0}%`,
            20,
            yPos
        );
        yPos += 7;
        doc.text(`Overdue Complaints: ${overdueCount || 0}`, 20, yPos);

        // Convert to buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="complaints-report-${format(now, 'yyyy-MM')}.pdf"`,
            },
        });
    } catch (error) {
        console.error('[COMPLAINTS_PDF_REPORT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate PDF report',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

