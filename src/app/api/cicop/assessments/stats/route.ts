import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

function getDateRange(dateRange: string | null): { from: string; to: string } | null {
  if (!dateRange || dateRange === 'all') return null;
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: string;
  switch (dateRange) {
    case 'last-7': {
      const d = new Date(now); d.setDate(d.getDate() - 7); from = d.toISOString().slice(0, 10); break;
    }
    case 'last-30': {
      const d = new Date(now); d.setDate(d.getDate() - 30); from = d.toISOString().slice(0, 10); break;
    }
    case 'last-90': {
      const d = new Date(now); d.setDate(d.getDate() - 90); from = d.toISOString().slice(0, 10); break;
    }
    case 'this-year':
      from = `${now.getFullYear()}-01-01`; break;
    default:
      return null;
  }
  return { from, to };
}

/**
 * GET /api/cicop/assessments/stats
 * Get assessment statistics for dashboard
 * Query params: insurer, repairer, vehicle_make, assessment_type, date_range (last-7|last-30|last-90|this-year)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = request.nextUrl;
    const insurer = searchParams.get('insurer');
    const repairer = searchParams.get('repairer');
    const vehicleMake = searchParams.get('vehicle_make');
    const assessmentType = searchParams.get('assessment_type');
    const dateRange = searchParams.get('date_range');

    let query = supabase.from('cicop_assessments').select('*');

    if (insurer && insurer !== 'all') query = query.eq('insurer', insurer);
    if (repairer && repairer !== 'all') query = query.eq('repairer_name', repairer);
    if (vehicleMake && vehicleMake !== 'all') query = query.eq('vehicle_make', vehicleMake);
    if (assessmentType && assessmentType !== 'all') query = query.eq('assessment_type', assessmentType);

    const range = getDateRange(dateRange);
    if (range) {
      query = query.gte('date_received', range.from).lte('date_received', range.to);
    }

    const { data: assessments, error } = await query;

    if (error) {
      console.error('Error fetching assessments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    if (!assessments || assessments.length === 0) {
      return NextResponse.json({
        total: 0,
        completed: 0,
        in_progress: 0,
        avg_completeness: 0,
        status_breakdown: {},
        total_data_points: 0
      });
    }

    // Calculate stats
    const total = assessments.length;
    const completed = assessments.filter((a: any) => a.status === 'Completed').length;
    const in_progress = assessments.filter((a: any) => a.status === 'In Progress').length;

    // Calculate average completeness
    const completenessValues = assessments.map((a: any) => {
      const fields = Object.keys(a);
      const filled = fields.filter((k) => {
        const val = a[k];
        return val !== null && val !== '' && val !== undefined && val !== 'NaN';
      }).length;
      return (filled / fields.length) * 100;
    });
    
    const avg_completeness = completenessValues.length > 0
      ? Math.round(completenessValues.reduce((sum, val) => sum + val, 0) / completenessValues.length * 10) / 10
      : 0;

    // Status breakdown
    const status_breakdown: Record<string, number> = {};
    assessments.forEach((a: any) => {
      const status = a.status || 'Unknown';
      status_breakdown[status] = (status_breakdown[status] || 0) + 1;
    });

    return NextResponse.json({
      total,
      completed,
      in_progress,
      avg_completeness,
      status_breakdown,
      total_data_points: total * 111 // Assuming 111 fields per assessment
    });

  } catch (error: any) {
    console.error('Error in assessments stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
