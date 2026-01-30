import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cicop/complaints
 * Get all complaints with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // resolved/unresolved
    const severity = searchParams.get('severity'); // low/medium/high

    const supabase = createServerClient();
    let query = supabase
      .from('cicop_complaints')
      .select('*')
      .order('detected_at', { ascending: false });

    // Apply filters
    if (status === 'resolved') {
      query = query.eq('resolved', true);
    } else if (status === 'unresolved') {
      query = query.eq('resolved', false);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: complaints, error } = await query;

    if (error) {
      console.error('Error fetching complaints:', error);
      return NextResponse.json(
        { error: 'Failed to fetch complaints' },
        { status: 500 }
      );
    }

    return NextResponse.json(complaints || []);

  } catch (error: any) {
    console.error('Error in complaints GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cicop/complaints
 * Create new complaint manually
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    const complaintData = {
      claim_reference: body.claim_reference,
      vehicle_rego: body.vehicle_rego,
      sender: body.sender,
      subject: body.subject,
      complaint_type: body.complaint_type || 'other',
      severity: body.severity || 'medium',
      resolved: false,
      metadata: body.metadata || {}
    };

    const { data, error } = await supabase
      .from('cicop_complaints')
      .insert(complaintData)
      .select()
      .single();

    if (error) {
      console.error('Error creating complaint:', error);
      return NextResponse.json(
        { error: 'Failed to create complaint', details: error.message },
        { status: 500 }
      );
    }

    // Log audit
    await supabase.from('cicop_audit_log').insert({
      event_type: 'complaint_created',
      action: 'create',
      claim_reference: data.claim_reference,
      details: { complaint_id: data.id, severity: data.severity },
      success: true
    });

    return NextResponse.json({ success: true, data }, { status: 201 });

  } catch (error: any) {
    console.error('Error in complaints POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
