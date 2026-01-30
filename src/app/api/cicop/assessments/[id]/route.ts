import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cicop/assessments/[id]
 * Get single assessment by assessment_no
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentNo = parseInt(params.id);
    
    if (isNaN(assessmentNo)) {
      return NextResponse.json(
        { error: 'Invalid assessment number' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data: assessment, error } = await supabase
      .from('cicop_assessments')
      .select('*')
      .eq('assessment_no', assessmentNo)
      .single();

    if (error || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Calculate completeness
    const fields = Object.keys(assessment).filter(k => !k.startsWith('_') && k !== 'id');
    const filled = fields.filter(k => {
      const val = assessment[k];
      return val !== null && val !== '' && val !== undefined;
    }).length;
    const total = fields.length;
    const percentage = Math.round((filled / total) * 100 * 10) / 10;

    return NextResponse.json({
      ...assessment,
      _completeness: {
        filled,
        total,
        empty: total - filled,
        percentage
      }
    });

  } catch (error: any) {
    console.error('Error in assessment GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cicop/assessments/[id]
 * Update existing assessment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentNo = parseInt(params.id);
    
    if (isNaN(assessmentNo)) {
      return NextResponse.json(
        { error: 'Invalid assessment number' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const supabase = createServerClient();

    // Update assessment
    const { data, error } = await supabase
      .from('cicop_assessments')
      .update({
        ...body,
        last_updated: new Date().toISOString()
      })
      .eq('assessment_no', assessmentNo)
      .select()
      .single();

    if (error) {
      console.error('Error updating assessment:', error);
      return NextResponse.json(
        { error: 'Failed to update assessment', details: error.message },
        { status: 500 }
      );
    }

    // Log audit
    await supabase.from('cicop_audit_log').insert({
      event_type: 'assessment_updated',
      action: 'update',
      claim_reference: data.claim_number,
      details: { assessment_no: data.assessment_no, changes: Object.keys(body) },
      success: true
    });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error in assessment PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cicop/assessments/[id]
 * Delete assessment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentNo = parseInt(params.id);
    
    if (isNaN(assessmentNo)) {
      return NextResponse.json(
        { error: 'Invalid assessment number' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get assessment before deleting for audit
    const { data: assessment } = await supabase
      .from('cicop_assessments')
      .select('claim_number')
      .eq('assessment_no', assessmentNo)
      .single();

    // Delete assessment
    const { error } = await supabase
      .from('cicop_assessments')
      .delete()
      .eq('assessment_no', assessmentNo);

    if (error) {
      console.error('Error deleting assessment:', error);
      return NextResponse.json(
        { error: 'Failed to delete assessment', details: error.message },
        { status: 500 }
      );
    }

    // Log audit
    await supabase.from('cicop_audit_log').insert({
      event_type: 'assessment_deleted',
      action: 'delete',
      claim_reference: assessment?.claim_number,
      details: { assessment_no: assessmentNo },
      success: true
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in assessment DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
