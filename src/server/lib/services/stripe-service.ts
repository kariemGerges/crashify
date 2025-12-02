// =============================================
// FILE: lib/services/stripe-service.ts
// Stripe payment service for one-off clients
// =============================================

import Stripe from 'stripe';

/**
 * Get Stripe client instance (lazy initialization)
 * Checks for API key only when actually needed
 */
function getStripeClient(): Stripe {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    return new Stripe(apiKey, {
        apiVersion: '2025-11-17.clover',
        typescript: true,
    });
}

export interface CreateCheckoutSessionParams {
    amount: number; // Amount in cents (e.g., 17500 for $175.00)
    currency?: string;
    customerEmail: string;
    customerName?: string;
    description: string;
    metadata: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
}

export interface PaymentResult {
    success: boolean;
    sessionId?: string;
    url?: string;
    error?: string;
}

export class StripeService {
    /**
     * Create a Stripe Checkout session
     */
    static async createCheckoutSession(
        params: CreateCheckoutSessionParams
    ): Promise<PaymentResult> {
        try {
            const session = await getStripeClient().checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                customer_email: params.customerEmail,
                line_items: [
                    {
                        price_data: {
                            currency: params.currency || 'aud',
                            product_data: {
                                name: params.description,
                                description: `Crashify Assessment - ${params.description}`,
                            },
                            unit_amount: params.amount,
                        },
                        quantity: 1,
                    },
                ],
                metadata: params.metadata,
                success_url: params.successUrl,
                cancel_url: params.cancelUrl,
                allow_promotion_codes: false,
            });

            return {
                success: true,
                sessionId: session.id,
                url: session.url || undefined,
            };
        } catch (error) {
            console.error('[StripeService] Error creating checkout session:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Retrieve a checkout session
     */
    static async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
        try {
            const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
            return session;
        } catch (error) {
            console.error('[StripeService] Error retrieving checkout session:', error);
            return null;
        }
    }

    /**
     * Verify webhook signature
     */
    static verifyWebhookSignature(
        payload: string | Buffer,
        signature: string
    ): Stripe.Event | null {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('[StripeService] STRIPE_WEBHOOK_SECRET not configured');
            return null;
        }

        try {
            const event = getStripeClient().webhooks.constructEvent(
                payload,
                signature,
                webhookSecret
            );
            return event;
        } catch (error) {
            console.error('[StripeService] Webhook signature verification failed:', error);
            return null;
        }
    }

    /**
     * Get payment intent from checkout session
     */
    static async getPaymentIntent(sessionId: string): Promise<Stripe.PaymentIntent | null> {
        try {
            const session = await this.getCheckoutSession(sessionId);
            if (!session || !session.payment_intent) {
                return null;
            }

            if (typeof session.payment_intent === 'string') {
                const paymentIntent = await getStripeClient().paymentIntents.retrieve(
                    session.payment_intent
                );
                return paymentIntent;
            }

            return session.payment_intent as Stripe.PaymentIntent;
        } catch (error) {
            console.error('[StripeService] Error retrieving payment intent:', error);
            return null;
        }
    }
}

