// =============================================
// FILE: app/api/analytics/complaints/route.ts
// Enhanced Complaints Analytics API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

// Mark as dynamic since it uses cookies for authentication
export const dynamic = 'force-dynamic';
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
            { count: totalComplaints },
            { count: positiveCount },
            { count: negativeCount },
            { count: newCount },
            { count: underInvestigationCount },
            { count: resolvedCount },
            { count: closedCount },
            { count: overdueCount },
        ] = await Promise.all([
            // Total complaints this month
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfCurrentMonth.toISOString())
                .lte('created_at', endOfCurrentMonth.toISOString()),
            // Total complaints
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true }),
            // Positive complaints (resolved + closed)
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .in('status', ['resolved', 'closed']),
            // Negative complaints (new + under_investigation)
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .in('status', ['new', 'under_investigation']),
            // New complaints
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new'),
            // Under investigation
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'under_investigation'),
            // Resolved
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'resolved'),
            // Closed
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'closed'),
            // Overdue complaints
            serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .lt('sla_deadline', new Date().toISOString())
                .not('status', 'eq', 'closed')
                .not('status', 'eq', 'resolved'),
        ]);

        // Calculate satisfaction score (0-100)
        // Based on: resolution rate, SLA compliance, and positive/negative ratio
        const total = totalComplaints || 0;
        const positive = positiveCount || 0;
        const negative = negativeCount || 0;
        const resolved = resolvedCount || 0;
        const closed = closedCount || 0;
        const overdue = overdueCount || 0;

        // Resolution rate (weight: 40%)
        const resolutionRate = total > 0 ? (positive / total) * 100 : 0;
        
        // SLA compliance (weight: 30%)
        const activeComplaints = negative;
        const slaCompliance = activeComplaints > 0 ? ((activeComplaints - overdue) / activeComplaints) * 100 : 100;
        
        // Positive/Negative ratio (weight: 30%)
        const totalWithOutcome = positive + negative;
        const positiveRatio = totalWithOutcome > 0 ? (positive / totalWithOutcome) * 100 : 50;

        // Weighted satisfaction score
        const satisfactionScore = Math.round(
            (resolutionRate * 0.4) + 
            (slaCompliance * 0.3) + 
            (positiveRatio * 0.3)
        );

        // Get resolved complaints for average calculation
        const { data: resolvedComplaints } = await (
            serverClient.from('complaints') as unknown as {
                select: (columns: string) => {
                    not: (column: string, operator: string, value: null) => Promise<{
                        data: Array<{
                            created_at: string;
                            resolved_at: string | null;
                        }> | null;
                    }>;
                };
            }
        )
            .select('created_at, resolved_at')
            .not('resolved_at', 'is', null);

        let averageResolutionTime = 0;
        if (resolvedComplaints && resolvedComplaints.length > 0) {
            const totalDays = resolvedComplaints.reduce((sum, complaint) => {
                if (complaint.resolved_at && complaint.created_at) {
                    const created = new Date(complaint.created_at);
                    const resolved = new Date(complaint.resolved_at);
                    const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                    return sum + days;
                }
                return sum;
            }, 0);
            averageResolutionTime = totalDays / resolvedComplaints.length;
        }

        // Status breakdown
        const statusBreakdown = {
            new: newCount || 0,
            under_investigation: underInvestigationCount || 0,
            resolved: resolvedCount || 0,
            closed: closedCount || 0,
        };

        // Monthly trend (last 12 months)
        const monthlyTrend = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const monthEnd = endOfMonth(subMonths(now, i));
            const monthKey = format(monthStart, 'MMM yyyy');

            const { count } = await serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', monthStart.toISOString())
                .lte('created_at', monthEnd.toISOString());

            monthlyTrend.push({
                month: monthKey,
                count: count || 0,
            });
        }

        // Monthly resolution trend
        const resolutionTrend = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const monthEnd = endOfMonth(subMonths(now, i));
            const monthKey = format(monthStart, 'MMM yyyy');

            // Get resolved complaints (either resolved_at or closed_at in this month)
            const { data: resolvedComplaints } = await (
                serverClient.from('complaints') as unknown as {
                    select: (columns: string) => {
                        in: (column: string, values: string[]) => Promise<{
                            data: Array<{
                                resolved_at: string | null;
                                closed_at: string | null;
                            }> | null;
                        }>;
                    };
                }
            )
                .select('resolved_at, closed_at')
                .in('status', ['resolved', 'closed']);

            let resolvedCount = 0;
            if (resolvedComplaints) {
                resolvedCount = resolvedComplaints.filter((complaint) => {
                    const resolvedAt = complaint.resolved_at ? new Date(complaint.resolved_at) : null;
                    const closedAt = complaint.closed_at ? new Date(complaint.closed_at) : null;
                    const resolutionDate = resolvedAt || closedAt;
                    
                    if (!resolutionDate) return false;
                    
                    return resolutionDate >= monthStart && resolutionDate <= monthEnd;
                }).length;
            }

            const { count: total } = await serverClient
                .from('complaints')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', monthStart.toISOString())
                .lte('created_at', monthEnd.toISOString());

            resolutionTrend.push({
                month: monthKey,
                resolved: resolvedCount,
                total: total || 0,
            });
        }

        // Complaints by category
        const { data: categoryData } = await (
            serverClient.from('complaints') as unknown as {
                select: (columns: string) => Promise<{
                    data: Array<{ category: string }> | null;
                }>;
            }
        ).select('category');

        const categoryCounts: Record<string, number> = {};
        if (categoryData) {
            categoryData.forEach((complaint) => {
                const category = complaint.category;
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
        }

        const topCategories = Object.entries(categoryCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Complaints by priority
        const { data: priorityData } = await (
            serverClient.from('complaints') as unknown as {
                select: (columns: string) => {
                    not: (column: string, operator: string, value: string) => Promise<{
                        data: Array<{ priority: string }> | null;
                    }>;
                };
            }
        )
            .select('priority')
            .not('status', 'eq', 'closed');

        const priorityCounts: Record<string, number> = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };

        if (priorityData) {
            priorityData.forEach((complaint) => {
                const priority = complaint.priority as keyof typeof priorityCounts;
                if (priority in priorityCounts) {
                    priorityCounts[priority]++;
                }
            });
        }

        // Activity feed (recent complaints)
        const { data: recentComplaints } = await (
            serverClient.from('complaints') as unknown as {
                select: (columns: string) => {
                    order: (column: string, options: { ascending: boolean }) => {
                        limit: (count: number) => Promise<{
                            data: Array<{
                                id: string;
                                complaint_number: string;
                                status: string;
                                category: string;
                                created_at: string;
                            }> | null;
                        }>;
                    };
                };
            }
        )
            .select('id, complaint_number, status, category, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        const activityFeed = (recentComplaints || []).map((complaint) => ({
            id: complaint.id,
            type: 'complaint',
            description: `Complaint ${complaint.complaint_number} - ${complaint.category.replace(/_/g, ' ')}`,
            status: complaint.status,
            timestamp: complaint.created_at,
        }));

        const responseData = {
            // Basic stats
            totalThisMonth: totalThisMonth || 0,
            total: totalComplaints || 0,
            positive: positive,
            negative: negative,
            satisfactionScore: satisfactionScore,
            resolutionRate: Math.round(resolutionRate * 10) / 10,
            averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
            overdue: overdue,
            
            // Status breakdown
            statusBreakdown,
            
            // Charts data
            monthlyTrend,
            resolutionTrend,
            topCategories,
            priorityBreakdown: priorityCounts,
            
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
        console.error('[COMPLAINTS_ANALYTICS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch complaints analytics',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

