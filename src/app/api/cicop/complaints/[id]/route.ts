import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cicop/complaints/[id]
 * Get single complaint by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaintId = params.id;
    const supabase = createServerClient();

    const { data: complaint, error } = await supabase
      .from('cicop_complaints')
      .select('*')
      .eq('id', complaintId)
      .single();

    if (error || !complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(complaint);

  } catch (error: any) {
    console.error('Error in complaint GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cicop/complaints/[id]
 * Update complaint (e.g., resolve, add notes)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaintId = params.id;
    const body = await request.json();
    const supabase = createServerClient();

    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // If resolving, set resolved_at
    if (body.resolved === true) {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('cicop_complaints')
      .update(updateData)
      .eq('id', complaintId)
      .select()
      .single();

    if (error) {
      console.error('Error updating complaint:', error);
      return NextResponse.json(
        { error: 'Failed to update complaint', details: error.message },
        { status: 500 }
      );
    }

    // Log audit
    await supabase.from('cicop_audit_log').insert({
      event_type: 'complaint_updated',
      action: body.resolved ? 'resolved' : 'update',
      claim_reference: data.claim_reference,
      details: { complaint_id: data.id, changes: Object.keys(body) },
      success: true
    });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error in complaint PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cicop/complaints/[id]
 * Delete complaint
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const complaintId = params.id;
    const supabase = createServerClient();

    // Get complaint before deleting for audit
    const { data: complaint } = await supabase
      .from('cicop_complaints')
      .select('claim_reference')
      .eq('id', complaintId)
      .single();

    const { error } = await supabase
      .from('cicop_complaints')
      .delete()
      .eq('id', complaintId);

    if (error) {
      console.error('Error deleting complaint:', error);
      return NextResponse.json(
        { error: 'Failed to delete complaint', details: error.message },
        { status: 500 }
      );
    }

    // Log audit
    await supabase.from('cicop_audit_log').insert({
      event_type: 'complaint_deleted',
      action: 'delete',
      claim_reference: complaint?.claim_reference,
      details: { complaint_id: complaintId },
      success: true
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in complaint DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
