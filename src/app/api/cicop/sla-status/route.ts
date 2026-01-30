import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cicop/sla-status
 * Get current SLA status for email monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Fetch SLA tracking data
    const { data: slaData, error } = await supabase
      .from('cicop_sla_tracking')
      .select('*')
      .order('sla_deadline', { ascending: true });

    if (error) {
      console.error('Error fetching SLA data:', error);
      return NextResponse.json(
        { 
          total: 0,
          in_progress: 0,
          completed: 0,
          overdue: 0,
          compliance_rate: 100,
          active_claims: []
        },
        { status: 200 }
      );
    }

    if (!slaData || slaData.length === 0) {
      return NextResponse.json({
        total: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0,
        compliance_rate: 100,
        active_claims: []
      });
    }

    const now = new Date();
    const total = slaData.length;
    let in_progress = 0;
    let completed = 0;
    let overdue = 0;
    const active_claims: any[] = [];

    slaData.forEach((record: any) => {
      if (record.status === 'in_progress' || !record.responded_at) {
        in_progress++;
        
        const deadline = new Date(record.sla_deadline);
        const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isOverdue = hoursRemaining < 0;
        
        if (isOverdue) {
          overdue++;
        }

        active_claims.push({
          claim_ref: record.claim_reference,
          vehicle: record.metadata?.vehicle || 'N/A',
          insurer: record.insurer_domain || 'N/A',
          hours_remaining: Math.round(hoursRemaining * 10) / 10,
          is_overdue: isOverdue,
          status: isOverdue ? 'overdue' : (hoursRemaining < 6 ? 'urgent' : 'on_track')
        });
      } else {
        completed++;
      }
    });

    // Sort active claims by hours remaining
    active_claims.sort((a, b) => a.hours_remaining - b.hours_remaining);

    const compliance_rate = total > 0 ? Math.round(((total - overdue) / total) * 100 * 10) / 10 : 100;

    return NextResponse.json({
      total,
      in_progress,
      completed,
      overdue,
      compliance_rate,
      active_claims: active_claims.slice(0, 10) // Top 10 most urgent
    });

  } catch (error: any) {
    console.error('Error in SLA status API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
