import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cicop/emails
 * Get processed emails (mock for now - replace with real data)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // For now, return mock data
    // In production, this would fetch from cicop_processed_emails
    // and join with SLA tracking and complaint data
    
    const mockEmails = [
      {
        id: '1',
        sender: 'claims@racv.com.au',
        subject: 'Assessment Request - Claim #12345',
        content: 'Please provide assessment for Toyota Camry, Rego ABC123. Customer reported front bumper damage.',
        received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        is_read: false,
        has_sla: true,
        sla_hours_remaining: 46,
        is_complaint: false,
        analysis: {
          claim_reference: '12345',
          vehicle_rego: 'ABC123',
          urgency: 'normal',
          confidence: 0.92
        }
      },
      {
        id: '2',
        sender: 'customer@email.com',
        subject: 'Urgent - When will my car be ready?',
        content: 'I sent photos 3 days ago and haven\'t heard back. This is unacceptable!',
        received_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
        is_read: false,
        has_sla: true,
        sla_hours_remaining: 2.5,
        is_complaint: true,
        analysis: {
          urgency: 'urgent',
          confidence: 0.88
        }
      },
      {
        id: '3',
        sender: 'info@qbe.com',
        subject: 'Assessment Follow-up - Claim REF678',
        content: 'Following up on the assessment report sent last week.',
        received_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        is_read: true,
        has_sla: false,
        is_complaint: false,
        analysis: {
          claim_reference: 'REF678',
          urgency: 'normal',
          confidence: 0.85
        }
      }
    ];

    return NextResponse.json({ emails: mockEmails });

  } catch (error: any) {
    console.error('Error in emails GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
