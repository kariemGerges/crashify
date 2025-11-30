// =============================================
// FILE: app/api/payments/create-checkout/route.ts
// POST: Create Stripe checkout session for quote request
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/server/lib/services/stripe-service';
import { validateAndExtractIp } from '@/server/lib/utils/security';

export const runtime = 'nodejs';

// POST: Create checkout session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            quoteRequestId,
            amount, // in dollars (e.g., 175.00)
            customerEmail,
            customerName,
            description,
        } = body;

        // Validate input
        if (!quoteRequestId || !amount || !customerEmail) {
            return NextResponse.json(
                { error: 'Missing required fields: quoteRequestId, amount, customerEmail' },
                { status: 400 }
            );
        }

        // Validate amount (must be positive)
        const amountInCents = Math.round(parseFloat(amount.toString()) * 100);
        if (amountInCents < 100) {
            return NextResponse.json(
                { error: 'Amount must be at least $1.00' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Get base URL for redirects
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${origin}/payment/cancel?quote_request_id=${quoteRequestId}`;

        // Create checkout session
        const result = await StripeService.createCheckoutSession({
            amount: amountInCents,
            currency: 'aud',
            customerEmail,
            customerName,
            description: description || 'Crashify Assessment Deposit',
            metadata: {
                quote_request_id: quoteRequestId,
                type: 'assessment_deposit',
            },
            successUrl,
            cancelUrl,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to create checkout session' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            sessionId: result.sessionId,
            url: result.url,
        });
    } catch (error) {
        console.error('[CREATE_CHECKOUT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create checkout session',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

