// =============================================
// FILE: app/api/complaints/stats/route.ts
// Complaint Statistics API (REQ-66, REQ-67, REQ-68, REQ-69)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';

// GET: Get complaint statistics
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

        // Get total complaints
        const { count: totalCount } = await supabase
            .from('complaints')
            .select('*', { count: 'exact', head: true });

        // Get active complaints (not closed) (REQ-66)
        const { count: activeCount } = await supabase
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .not('status', 'eq', 'closed');

        // Get overdue complaints (REQ-67)
        const { count: overdueCount } = await supabase
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .lt('sla_deadline', new Date().toISOString())
            .not('status', 'eq', 'closed')
            .not('status', 'eq', 'resolved');

        // Get resolved complaints for average calculation
        const { data: resolvedComplaints } = (await supabase
            .from('complaints')
            .select('created_at, resolved_at')
            .not('resolved_at', 'is', null)) as { data: Array<{ created_at: string; resolved_at: string | null }> | null };

        // Calculate average resolution time (REQ-68)
        let averageResolutionTime: number | null = null;
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

        // Get total assessments for complaint rate calculation
        const { count: assessmentCount } = await supabase
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null);

        // Calculate complaint rate percentage (REQ-69)
        let complaintRate: number | null = null;
        if (assessmentCount && assessmentCount > 0 && totalCount) {
            complaintRate = (totalCount / assessmentCount) * 100;
        }

        // Get complaints by status
        const { data: statusData } = (await supabase
            .from('complaints')
            .select('status')) as { data: Array<{ status: string }> | null };

        const statusCounts = {
            new: 0,
            under_investigation: 0,
            resolved: 0,
            closed: 0,
        };

        if (statusData) {
            statusData.forEach((complaint) => {
                const status = complaint.status as keyof typeof statusCounts;
                if (status in statusCounts) {
                    statusCounts[status]++;
                }
            });
        }

        // Get complaints by priority
        const { data: priorityData } = (await supabase
            .from('complaints')
            .select('priority')
            .not('status', 'eq', 'closed')) as { data: Array<{ priority: string }> | null };

        const priorityCounts = {
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

        return NextResponse.json({
            total: totalCount || 0,
            active: activeCount || 0,
            overdue: overdueCount || 0,
            averageResolutionTime: averageResolutionTime
                ? Math.round(averageResolutionTime * 10) / 10
                : null,
            complaintRate: complaintRate ? Math.round(complaintRate * 100) / 100 : null,
            byStatus: statusCounts,
            byPriority: priorityCounts,
        });
    } catch (error) {
        console.error('[COMPLAINT_STATS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch complaint statistics',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

