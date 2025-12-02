// =============================================
// FILE: app/api/analytics/dashboard/route.ts
// Comprehensive Dashboard Analytics (REQ-37 to REQ-55)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import type { Database } from '@/server/lib/types/database.types';

type AssessmentRow = Database['public']['Tables']['assessments']['Row'];

// Cache for 30 minutes (1800 seconds)
export const revalidate = 1800;

export async function GET() {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use service role client to bypass RLS and improve performance
        const serverClient = createServerClient();

        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);

        // Run all count queries in parallel for better performance
        const [
            { count: totalThisMonth },
            { count: pendingCount },
            { count: inProgressCount },
            { count: completedCount },
        ] = await Promise.all([
            // REQ-37: Total assessments this month
            serverClient
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfCurrentMonth.toISOString())
                .lte('created_at', endOfCurrentMonth.toISOString())
                .is('deleted_at', null),
            // REQ-38: Pending count
            serverClient
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
                .is('deleted_at', null),
            // REQ-39: In progress count
            serverClient
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'processing')
                .is('deleted_at', null),
            // REQ-40: Completed count
            serverClient
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .is('deleted_at', null),
        ]);

        // REQ-41: Completion rate percentage
        const total = (totalThisMonth || 0) + (pendingCount || 0) + (inProgressCount || 0);
        const completionRate = total > 0 ? ((completedCount || 0) / total) * 100 : 0;

        // REQ-42: Average days to complete
        const { data: completedAssessments } = await serverClient
            .from('assessments')
            .select('created_at, completed_at')
            .eq('status', 'completed')
            .not('completed_at', 'is', null)
            .is('deleted_at', null) as { data: Array<{ created_at: string; completed_at: string | null }> | null };

        let averageDaysToComplete = 0;
        if (completedAssessments && completedAssessments.length > 0) {
            const totalDays = completedAssessments.reduce((sum, assessment) => {
                if (assessment.completed_at && assessment.created_at) {
                    const created = new Date(assessment.created_at);
                    const completed = new Date(assessment.completed_at);
                    const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                    return sum + days;
                }
                return sum;
            }, 0);
            averageDaysToComplete = totalDays / completedAssessments.length;
        }

        // REQ-43: Revenue this month (from payment_id if available)
        // Note: This would need integration with payment system
        // For now, we'll use a placeholder or calculate from quote amounts
        const revenueThisMonth = 0; // TODO: Calculate from payments/quotes

        // REQ-44: Overdue count (assessments older than 7 days in pending/processing)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: overdueCount } = await serverClient
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'processing'])
            .lt('created_at', sevenDaysAgo.toISOString())
            .is('deleted_at', null);

        // REQ-45: Pie chart - assessments by status
        // Get all assessments once and use for both status breakdown and top insurers
        const { data: allAssessments } = await serverClient
            .from('assessments')
            .select('status, company_name')
            .is('deleted_at', null) as { data: Array<{ status: string; company_name: string }> | null };

        const statusBreakdown = {
            pending: 0,
            processing: 0,
            completed: 0,
            cancelled: 0,
        };

        if (allAssessments) {
            allAssessments.forEach((assessment) => {
                const status = assessment.status as keyof typeof statusBreakdown;
                if (status in statusBreakdown) {
                    statusBreakdown[status]++;
                }
            });
        }

        // REQ-46: Line graph - monthly volume trend (last 12 months)
        // Run all monthly queries in parallel
        const monthlyQueries = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const monthEnd = endOfMonth(subMonths(now, i));
            monthlyQueries.push(
                serverClient
                    .from('assessments')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', monthStart.toISOString())
                    .lte('created_at', monthEnd.toISOString())
                    .is('deleted_at', null)
            );
        }
        const monthlyResults = await Promise.all(monthlyQueries);
        const monthlyTrend = monthlyResults.map((result, index) => {
            const monthStart = startOfMonth(subMonths(now, 11 - index));
            return {
                month: format(monthStart, 'MMM yyyy'),
                count: result.count || 0,
            };
        });

        // REQ-47: Bar chart - top insurers (by company_name)
        // Use data already fetched from allAssessments
        const insurerCounts: Record<string, number> = {};
        if (allAssessments) {
            allAssessments.forEach((assessment) => {
                if (assessment.company_name) {
                    const company = assessment.company_name;
                    insurerCounts[company] = (insurerCounts[company] || 0) + 1;
                }
            });
        }

        const topInsurers = Object.entries(insurerCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // REQ-48: Bar chart - top repairers
        // Note: This would require a repairers table or extraction from assessment data
        const topRepairers: Array<{ name: string; count: number }> = [];
        // TODO: Implement when repairer data is available

        // REQ-49: Bar chart - average completion time by month
        // Run all monthly completion queries in parallel
        const completionQueries = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const monthEnd = endOfMonth(subMonths(now, i));
            completionQueries.push(
                serverClient
                    .from('assessments')
                    .select('created_at, completed_at')
                    .eq('status', 'completed')
                    .not('completed_at', 'is', null)
                    .gte('completed_at', monthStart.toISOString())
                    .lte('completed_at', monthEnd.toISOString())
                    .is('deleted_at', null)
            );
        }
        const completionResults = await Promise.all(completionQueries) as Array<{ data: Array<{ created_at: string; completed_at: string | null }> | null }>;
        const completionTimeByMonth = completionResults.map((result, index) => {
            const monthStart = startOfMonth(subMonths(now, 11 - index));
            if (result.data && result.data.length > 0) {
                const totalDays = result.data.reduce((sum, assessment) => {
                    if (assessment.completed_at && assessment.created_at) {
                        const created = new Date(assessment.created_at);
                        const completed = new Date(assessment.completed_at);
                        const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                        return sum + days;
                    }
                    return sum;
                }, 0);
                return {
                    month: format(monthStart, 'MMM yyyy'),
                    days: totalDays / result.data.length,
                };
            } else {
                return {
                    month: format(monthStart, 'MMM yyyy'),
                    days: 0,
                };
            }
        });

        // REQ-50: Bar chart - revenue by month
        const revenueByMonth: Array<{ month: string; revenue: number }> = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            revenueByMonth.push({
                month: format(monthStart, 'MMM yyyy'),
                revenue: 0, // TODO: Calculate from payments
            });
        }

        // REQ-51: Live activity feed (recent assessments)
        const { data: recentActivity } = await serverClient
            .from('assessments')
            .select('id, company_name, status, created_at, assessment_type')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(20) as { data: Array<{ id: string; company_name: string; status: string; created_at: string; assessment_type: string | null }> | null };

        const activityFeed = (recentActivity || []).map((assessment) => ({
            id: assessment.id,
            type: 'assessment_created',
            description: `New ${assessment.assessment_type || 'assessment'} from ${assessment.company_name || 'Unknown'}`,
            status: assessment.status,
            timestamp: assessment.created_at,
        }));

        const responseData = {
            // Basic stats
            totalThisMonth: totalThisMonth || 0,
            pending: pendingCount || 0,
            inProgress: inProgressCount || 0,
            completed: completedCount || 0,
            completionRate: Math.round(completionRate * 10) / 10,
            averageDaysToComplete: Math.round(averageDaysToComplete * 10) / 10,
            revenueThisMonth: revenueThisMonth,
            overdue: overdueCount || 0,

            // Charts data
            statusBreakdown,
            monthlyTrend,
            topInsurers,
            topRepairers,
            completionTimeByMonth,
            revenueByMonth,

            // Activity feed
            activityFeed,

            // Metadata
            lastRefreshed: new Date().toISOString(),
        };

        // Cache for 30 minutes (1800 seconds)
        return NextResponse.json(responseData, {
            headers: {
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('[ANALYTICS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch analytics',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

