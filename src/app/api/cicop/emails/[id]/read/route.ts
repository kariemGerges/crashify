import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * POST /api/cicop/emails/[id]/read
 * Mark email as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emailId = params.id;
    const supabase = createServerClient();

    // Update email status (mock for now)
    // In production: update cicop_processed_emails table
    
    console.log(`Marking email ${emailId} as read`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error marking email as read:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
