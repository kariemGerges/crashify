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

    // cicop_complaints / cicop_audit_log may be missing from generated DB types
    const result = await supabase
      .from('cicop_complaints')
      // @ts-expect-error - table may be missing from generated types
      .insert(complaintData)
      .select()
      .single();

    const { data, error } = result;
    if (error) {
      console.error('Error creating complaint:', error);
      return NextResponse.json(
        { error: 'Failed to create complaint', details: error.message },
        { status: 500 }
      );
    }

    const inserted = data as { claim_reference?: string; id?: string; severity?: string };
    // @ts-expect-error - table may be missing from generated types
    await supabase.from('cicop_audit_log').insert({
      event_type: 'complaint_created',
      action: 'create',
      claim_reference: inserted.claim_reference,
      details: { complaint_id: inserted.id, severity: inserted.severity },
      success: true
    });

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });

  } catch (error: any) {
    console.error('Error in complaints POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
