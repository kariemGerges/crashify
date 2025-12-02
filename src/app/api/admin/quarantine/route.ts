// =============================================
// FILE: app/api/admin/quarantine/route.ts
// Email Quarantine Management API (REQ-6)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { getQuarantinedEmails, reviewQuarantinedEmail } from '@/server/lib/services/email-quarantine';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { EmailProcessor } from '@/server/lib/services/email-processor';

// GET: List quarantined emails
export async function GET(request: NextRequest) {
    try {
        const user = await getSession();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const emails = await getQuarantinedEmails(limit);

        return NextResponse.json({
            success: true,
            data: emails,
        });
    } catch (error) {
        console.error('[QUARANTINE] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch quarantined emails',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// POST: Review quarantined email (approve/reject)
export async function POST(request: NextRequest) {
    try {
        // Verify CSRF token
        const csrfCheck = await requireCsrfToken(request);
        if (!csrfCheck.valid) {
            return NextResponse.json(
                { error: csrfCheck.error || 'CSRF token validation failed' },
                { status: 403 }
            );
        }

        const user = await getSession();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { quarantine_id, action, notes } = body;

        if (!quarantine_id || !action) {
            return NextResponse.json(
                { error: 'quarantine_id and action are required' },
                { status: 400 }
            );
        }

        if (action !== 'approve' && action !== 'reject') {
            return NextResponse.json(
                { error: 'action must be "approve" or "reject"' },
                { status: 400 }
            );
        }

        await reviewQuarantinedEmail(quarantine_id, action, user.id, notes);

        // If approved, process the email (this would require storing the original email data)
        // For now, we'll just mark it as reviewed
        if (action === 'approve') {
            // TODO: Re-process the quarantined email if needed
            console.log(`[QUARANTINE] Email ${quarantine_id} approved by ${user.id}`);
        }

        return NextResponse.json({
            success: true,
            message: `Email ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
    } catch (error) {
        console.error('[QUARANTINE] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to review quarantined email',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

