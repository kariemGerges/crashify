// =============================================
// FILE: app/api/payments/webhook/route.ts
// POST: Stripe webhook handler
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/server/lib/services/stripe-service';
import { createServerClient } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

export const runtime = 'nodejs';

// POST: Handle Stripe webhook events
export async function POST(request: NextRequest) {
    const supabase = createServerClient();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    try {
        const body = await request.text();
        const event = StripeService.verifyWebhookSignature(body, signature);

        if (!event) {
            return NextResponse.json(
                { error: 'Invalid webhook signature' },
                { status: 400 }
            );
        }

        console.log('[STRIPE_WEBHOOK] Event received:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                // Update quote request with payment info
                if (session.metadata?.quote_request_id) {
                    const quoteRequestId = session.metadata.quote_request_id;
                    const paymentIntentId = session.payment_intent as string;
                    const amount = session.amount_total ? session.amount_total / 100 : 0;

                    await (supabase.from('quote_requests') as unknown as {
                        update: (values: any) => {
                            eq: (column: string, value: string) => Promise<unknown>;
                        };
                    })
                        .update({
                            status: 'payment_received',
                            payment_id: paymentIntentId,
                            payment_amount: amount,
                            paid_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', quoteRequestId);

                    // Generate secure form link automatically
                    try {
                        const { randomBytes } = await import('crypto');
                        const token = randomBytes(32).toString('hex');
                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

                        await (supabase.from('secure_form_links') as unknown as {
                            insert: (values: any[]) => Promise<unknown>;
                        }).insert([{
                            token,
                            quote_request_id: quoteRequestId,
                            expires_at: expiresAt.toISOString(),
                            is_used: false,
                            metadata: {
                                created_at: new Date().toISOString(),
                                auto_generated: true,
                            },
                        }]);

                        console.log('[STRIPE_WEBHOOK] Generated secure link for quote request:', quoteRequestId);
                    } catch (linkError) {
                        console.error('[STRIPE_WEBHOOK] Failed to generate secure link:', linkError);
                        // Don't fail the webhook if link generation fails
                    }

                    console.log('[STRIPE_WEBHOOK] Updated quote request:', quoteRequestId);
                }

                // If linked to assessment, update assessment
                if (session.metadata?.assessment_id) {
                    const assessmentId = session.metadata.assessment_id;
                    const paymentIntentId = session.payment_intent as string;

                    await (supabase.from('assessments') as unknown as {
                        update: (values: any) => {
                            eq: (column: string, value: string) => Promise<unknown>;
                        };
                    })
                        .update({
                            payment_id: paymentIntentId,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', assessmentId);

                    console.log('[STRIPE_WEBHOOK] Updated assessment:', assessmentId);
                }

                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('[STRIPE_WEBHOOK] Payment succeeded:', paymentIntent.id);
                // Additional handling if needed
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('[STRIPE_WEBHOOK] Payment failed:', paymentIntent.id);
                // Log failure if needed
                break;
            }

            default:
                console.log('[STRIPE_WEBHOOK] Unhandled event type:', event.type);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[STRIPE_WEBHOOK] Error:', error);
        return NextResponse.json(
            {
                error: 'Webhook processing failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

