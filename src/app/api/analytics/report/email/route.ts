// =============================================
// FILE: app/api/analytics/report/email/route.ts
// Email Monthly Report (REQ-55)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { EmailService } from '@/server/lib/services/email-service';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { createServerClient } from '@/server/lib/supabase/client';

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

        // Use service role client for accurate data
        const serverClient = createServerClient();
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);

        // Calculate actual statistics from database
        const [
            { count: totalAssessments },
            { count: completedAssessments },
            { data: revenueData },
        ] = await Promise.all([
            // Total assessments this month
            serverClient
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfCurrentMonth.toISOString())
                .lte('created_at', endOfCurrentMonth.toISOString())
                .is('deleted_at', null),
            // Completed assessments this month
            serverClient
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('created_at', startOfCurrentMonth.toISOString())
                .lte('created_at', endOfCurrentMonth.toISOString())
                .is('deleted_at', null),
            // Revenue from paid quote requests this month
            serverClient
                .from('quote_requests')
                .select('payment_amount')
                .eq('status', 'payment_received')
                .not('payment_amount', 'is', null)
                .gte('paid_at', startOfCurrentMonth.toISOString())
                .lte('paid_at', endOfCurrentMonth.toISOString()),
        ]);

        const total = totalAssessments || 0;
        const completed = completedAssessments || 0;
        const completionRate = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;

        // Calculate revenue
        let revenue = 0;
        if (revenueData && Array.isArray(revenueData)) {
            revenue = (revenueData as Array<{ payment_amount: number | null }>).reduce((sum, item) => {
                const amount = typeof item.payment_amount === 'number' ? item.payment_amount : 0;
                return sum + amount;
            }, 0);
        }

        // Get overdue count
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: overdueCount } = await serverClient
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'processing'])
            .lt('created_at', sevenDaysAgo.toISOString())
            .is('deleted_at', null);

        // Generate report summary
        const reportSummary = {
            month: format(now, 'MMMM yyyy'),
            totalAssessments: total,
            completed,
            completionRate,
            revenue,
            overdue: overdueCount || 0,
        };

        // Send email with comprehensive report
        await EmailService.sendEmail({
            to: recipientEmail,
            subject: `Monthly Assessment Report - ${reportSummary.month}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                        .stat-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
                        .stat-label { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
                        .stat-value { font-size: 32px; font-weight: bold; color: #111827; margin: 10px 0; }
                        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
                        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 28px;">Monthly Assessment Report</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">${reportSummary.month}</p>
                        </div>
                        <div class="content">
                            <h2 style="color: #111827; margin-top: 0;">Summary Statistics</h2>
                            
                            <div class="stat-box">
                                <div class="stat-label">Total Assessments</div>
                                <div class="stat-value">${reportSummary.totalAssessments.toLocaleString()}</div>
                            </div>
                            
                            <div class="stat-box">
                                <div class="stat-label">Completed Assessments</div>
                                <div class="stat-value">${reportSummary.completed.toLocaleString()}</div>
                            </div>
                            
                            <div class="stat-box">
                                <div class="stat-label">Completion Rate</div>
                                <div class="stat-value">${reportSummary.completionRate}%</div>
                            </div>
                            
                            <div class="stat-box">
                                <div class="stat-label">Revenue This Month</div>
                                <div class="stat-value">$${reportSummary.revenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                            
                            ${reportSummary.overdue > 0 ? `
                            <div class="alert">
                                <strong>⚠️ Attention Required:</strong> ${reportSummary.overdue} assessment(s) are overdue (older than 7 days).
                            </div>
                            ` : ''}
                            
                            <p style="margin-top: 30px; color: #6b7280;">
                                For detailed analytics, charts, and comprehensive reporting, please log in to the admin dashboard.
                            </p>
                        </div>
                        <div class="footer">
                            <p>Best regards,<br><strong>Crashify System</strong></p>
                            <p style="font-size: 12px; margin-top: 10px;">This is an automated monthly report.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        return NextResponse.json({
            success: true,
            message: 'Monthly report email sent successfully',
            data: reportSummary,
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

