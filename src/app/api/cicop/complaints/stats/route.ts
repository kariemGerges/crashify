import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cicop/complaints/stats
 * Get complaint statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: complaints, error } = await supabase
      .from('cicop_complaints')
      .select('*');

    if (error) {
      console.error('Error fetching complaints for stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch complaints' },
        { status: 500 }
      );
    }

    if (!complaints || complaints.length === 0) {
      return NextResponse.json({
        total: 0,
        unresolved: 0,
        resolved: 0,
        by_severity: { low: 0, medium: 0, high: 0 },
        by_type: {},
        resolution_rate: 0
      });
    }

    // Calculate stats
    const total = complaints.length;
    const unresolved = complaints.filter(c => !c.resolved).length;
    const resolved = complaints.filter(c => c.resolved).length;
    const resolution_rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // By severity
    const by_severity = {
      low: complaints.filter(c => c.severity === 'low').length,
      medium: complaints.filter(c => c.severity === 'medium').length,
      high: complaints.filter(c => c.severity === 'high').length
    };

    // By type
    const by_type: Record<string, number> = {};
    complaints.forEach(c => {
      const type = c.complaint_type || 'other';
      by_type[type] = (by_type[type] || 0) + 1;
    });

    return NextResponse.json({
      total,
      unresolved,
      resolved,
      by_severity,
      by_type,
      resolution_rate
    });

  } catch (error: any) {
    console.error('Error in complaints stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
