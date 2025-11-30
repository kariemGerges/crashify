// =============================================
// FILE: app/api/email/process/route.ts
// POST: Process unread emails from intake@crashify.com.au
// This can be called manually or via cron job
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { EmailProcessor } from '@/server/lib/services/email-processor';
import { validateAndExtractIp } from '@/server/lib/utils/security';

export const runtime = 'nodejs';

// POST: Process unread emails
export async function POST(request: NextRequest) {
    try {
        // Optional: Add authentication/authorization check here
        // For now, we'll allow it but you should add proper auth
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.EMAIL_PROCESSOR_TOKEN;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);

        console.log('[EMAIL_PROCESS] Starting email processing...');

        const processor = new EmailProcessor();
        const result = await processor.processUnreadEmails();

        console.log('[EMAIL_PROCESS] Processing complete:', {
            processed: result.processed,
            created: result.created,
            errors: result.errors.length,
        });

        return NextResponse.json({
            success: result.success,
            processed: result.processed,
            created: result.created,
            errors: result.errors,
            message: `Processed ${result.processed} emails, created ${result.created} assessments`,
        });
    } catch (error) {
        console.error('[EMAIL_PROCESS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process emails',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET: Check email processing status (health check)
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Email processor is ready',
        config: {
            imapHost: process.env.IMAP_HOST || 'not configured',
            imapUser: process.env.IMAP_USER || 'not configured',
            imapPort: process.env.IMAP_PORT || 'not configured',
        },
    });
}

