// =============================================
// FILE: app/api/cron/email-process/route.ts
// Automated Email Processing Cron Job (REQ-1)
// Runs every 15 minutes to process unread emails
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { EmailProcessor } from '@/server/lib/services/email-processor';
import { validateAndExtractIp } from '@/server/lib/utils/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET/POST: Process emails via cron job
 * This endpoint is called by Vercel Cron Jobs every 15 minutes
 */
export async function GET(request: NextRequest) {
    return handleCronRequest(request);
}

export async function POST(request: NextRequest) {
    return handleCronRequest(request);
}

async function handleCronRequest(request: NextRequest) {
    try {
        // Verify cron secret (Vercel Cron Jobs send this header)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || process.env.EMAIL_PROCESSOR_TOKEN;
        
        // Check for Vercel Cron authorization
        if (authHeader !== `Bearer ${cronSecret}`) {
            // Also check for Vercel's cron-specific header
            const cronHeader = request.headers.get('x-vercel-cron');
            if (!cronHeader && !cronSecret) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        }

        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);

        console.log('[CRON_EMAIL_PROCESS] Starting automated email processing...', {
            timestamp: new Date().toISOString(),
            ipAddress,
        });

        const processor = new EmailProcessor();
        const result = await processor.processUnreadEmails();

        console.log('[CRON_EMAIL_PROCESS] Processing complete:', {
            processed: result.processed,
            created: result.created,
            errors: result.errors.length,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: result.success,
            processed: result.processed,
            created: result.created,
            errors: result.errors.length,
            message: `Processed ${result.processed} emails, created ${result.created} assessments`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[CRON_EMAIL_PROCESS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process emails',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

