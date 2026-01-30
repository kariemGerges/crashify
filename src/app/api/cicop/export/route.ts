import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * POST /api/cicop/export
 * Export assessments to CSV
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessments: assessmentNos } = body;

    const supabase = createServerClient();
    
    let query = supabase.from('cicop_assessments').select('*');
    
    if (assessmentNos && assessmentNos.length > 0) {
      query = query.in('assessment_no', assessmentNos);
    }

    const { data: assessments, error } = await query.order('assessment_no', { ascending: false });

    if (error) {
      console.error('Error fetching assessments for export:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    if (!assessments || assessments.length === 0) {
      return NextResponse.json(
        { error: 'No assessments to export' },
        { status: 404 }
      );
    }

    // Generate CSV
    const headers = [
      'Assessment No',
      'Claim Number',
      'Date Received',
      'Status',
      'Client',
      'Insurer',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Vehicle Make',
      'Vehicle Model',
      'Vehicle Year',
      'Rego',
      'VIN',
      'Assessment Type',
      'Assessor Name',
      'Repairer Quote',
      'Crashify Assessed',
      'Total Actual Cost',
      'Savings',
      'Damage Description',
      'Damage Severity',
      'Risk Level',
      'Total Loss',
      'Repairer Name',
      'Priority',
      'Workflow Stage',
      'Assigned To',
      'Created At'
    ];

    const rows = assessments.map((a: any) => [
      a.assessment_no,
      a.claim_number || '',
      a.date_received || '',
      a.status || '',
      a.client || '',
      a.insurer || '',
      a.customer_name || '',
      a.customer_phone || '',
      a.customer_email || '',
      a.vehicle_make || '',
      a.vehicle_model || '',
      a.vehicle_year || '',
      a.rego || '',
      a.vin || '',
      a.assessment_type || '',
      a.assessor_name || '',
      a.repairer_quote || '',
      a.crashify_assessed || '',
      a.total_actual_cost || '',
      a.savings || '',
      a.damage_description ? `"${a.damage_description.replace(/"/g, '""')}"` : '',
      a.damage_severity || '',
      a.risk_level || '',
      a.total_loss ? 'Yes' : 'No',
      a.repairer_name || '',
      a.priority || '',
      a.workflow_stage || '',
      a.assigned_to || '',
      a.created_at || ''
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Return as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cicop_assessments_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
