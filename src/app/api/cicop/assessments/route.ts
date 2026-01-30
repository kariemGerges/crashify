import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cicop/assessments
 * Get all assessments with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const client = searchParams.get('client');
    const insurer = searchParams.get('insurer');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    const supabase = createServerClient();
    let query = supabase.from('cicop_assessments').select('*');

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (client) {
      query = query.eq('client', client);
    }
    if (insurer) {
      query = query.eq('insurer', insurer);
    }
    if (date_from) {
      query = query.gte('date_received', date_from);
    }
    if (date_to) {
      query = query.lte('date_received', date_to);
    }

    const { data: assessments, error } = await query.order('assessment_no', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    // Calculate completeness for each assessment
    const results = (assessments || []).map((a: any) => {
      const fields = Object.keys(a).filter(k => !k.startsWith('_') && k !== 'id');
      const filled = fields.filter(k => {
        const val = a[k];
        return val !== null && val !== '' && val !== undefined;
      }).length;
      const total = fields.length;
      const percentage = Math.round((filled / total) * 100 * 10) / 10;

      return {
        ...a,
        _completeness: {
          filled,
          total,
          empty: total - filled,
          percentage
        }
      };
    });

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Error in assessments GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cicop/assessments
 * Create new assessment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    // Generate assessment number
    const { data: maxAssessment } = await supabase
      .from('cicop_assessments')
      .select('assessment_no')
      .order('assessment_no', { ascending: false })
      .limit(1);

    const nextAssessmentNo = maxAssessment && maxAssessment.length > 0
      ? maxAssessment[0].assessment_no + 1
      : 1;

    // Prepare data
    const assessmentData = {
      assessment_no: nextAssessmentNo,
      date_received: body.date_received || new Date().toISOString().split('T')[0],
      status: body.status || 'In Progress',
      ...body,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    // Insert assessment
    const { data, error } = await supabase
      .from('cicop_assessments')
      .insert(assessmentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating assessment:', error);
      return NextResponse.json(
        { error: 'Failed to create assessment', details: error.message },
        { status: 500 }
      );
    }

    // Log audit
    await supabase.from('cicop_audit_log').insert({
      event_type: 'assessment_created',
      action: 'create',
      claim_reference: data.claim_number,
      details: { assessment_no: data.assessment_no },
      success: true
    });

    return NextResponse.json(
      { success: true, assessment_no: data.assessment_no, data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error in assessments POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
