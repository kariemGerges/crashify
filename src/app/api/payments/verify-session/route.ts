// =============================================
// FILE: app/api/payments/verify-session/route.ts
// GET: Verify payment session status
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/server/lib/services/stripe-service';

export const runtime = 'nodejs';

// GET: Verify payment session
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'session_id is required' },
                { status: 400 }
            );
        }

        const session = await StripeService.getCheckoutSession(sessionId);

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            session: {
                id: session.id,
                status: session.payment_status,
                customer_email: session.customer_email,
                amount_total: session.amount_total,
                currency: session.currency,
                metadata: session.metadata,
            },
        });
    } catch (error) {
        console.error('[VERIFY_SESSION] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to verify session',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

