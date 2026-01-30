import { NextRequest, NextResponse } from 'next/server';
import { cicopEmailIntegration } from '@/server/services/cicop-email-integration';
import { createServerClient } from '@/server/lib/supabase/client';

/**
 * GET /api/cron/cicop-process-emails
 * Cron job to poll and process emails from Microsoft 365
 * 
 * Set up in Vercel Cron Jobs:
 * - Schedule: */5 * * * * (every 5 minutes)
 * - Or use external cron service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📧 Starting CICOP email processing...');

    const results = await cicopEmailIntegration.pollEmails();

    // Count results
    const processed = results.filter(r => r.processed).length;
    const slaStarted = results.filter(r => r.sla_started).length;
    const complaintsDetected = results.filter(r => r.complaint_detected).length;
    const autoResponsesSent = results.filter(r => r.auto_response_sent).length;
    const errors = results.filter(r => r.error).length;

    // Log daily stats
    const supabase = createServerClient();
    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('cicop_daily_stats')
      .upsert({
        date: today,
        emails_processed: processed,
        acknowledgments_sent: autoResponsesSent,
        complaints_detected: complaintsDetected,
        errors
      });

    const summary = {
      timestamp: new Date().toISOString(),
      total_emails: results.length,
      processed,
      sla_started: slaStarted,
      complaints_detected: complaintsDetected,
      auto_responses_sent: autoResponsesSent,
      errors,
      success: true
    };

    console.log('✅ CICOP email processing complete:', summary);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('❌ Error in CICOP email processing cron:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        success: false 
      },
      { status: 500 }
    );
  }
}
