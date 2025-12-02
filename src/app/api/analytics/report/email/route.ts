// =============================================
// FILE: app/api/analytics/report/email/route.ts
// Email Monthly Report (REQ-55)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { EmailService } from '@/server/lib/services/email-service';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get admin email from request or use default
        const body = await request.json().catch(() => ({}));
        const recipientEmail = body.email || user.email;

        // Generate report summary (simplified for email)
        const reportSummary = {
            month: format(new Date(), 'MMMM yyyy'),
            totalAssessments: 0, // TODO: Calculate from database
            completed: 0,
            completionRate: 0,
        };

        // Send email
        await EmailService.sendEmail({
            to: recipientEmail,
            subject: `Monthly Assessment Report - ${reportSummary.month}`,
            html: `
                <h2>Monthly Assessment Report</h2>
                <p>Report Period: ${reportSummary.month}</p>
                <h3>Summary</h3>
                <ul>
                    <li>Total Assessments: ${reportSummary.totalAssessments}</li>
                    <li>Completed: ${reportSummary.completed}</li>
                    <li>Completion Rate: ${reportSummary.completionRate}%</li>
                </ul>
                <p>For detailed analytics, please log in to the admin dashboard.</p>
                <p>Best regards,<br>Crashify System</p>
            `,
        });

        return NextResponse.json({
            success: true,
            message: 'Monthly report email sent successfully',
        });
    } catch (error) {
        console.error('[EMAIL_REPORT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send email report',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

