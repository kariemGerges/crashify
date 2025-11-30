// =============================================
// FILE: app/api/quotes/[id]/approve/route.ts
// POST: Approve quote request and send payment email
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { StripeService } from '@/server/lib/services/stripe-service';
import { EmailService } from '@/server/lib/services/email-service';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { Database } from '@/server/lib/types/database.types';

type QuoteRequestUpdate = Database['public']['Tables']['quote_requests']['Update'];

export const runtime = 'nodejs';

// POST: Approve quote request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerClient();
        const { id: quoteRequestId } = await params;
        const body = await request.json();
        const { recommendedService, recommendedPrice, reviewedBy } = body;

        // Validate input
        if (!recommendedService || !recommendedPrice) {
            return NextResponse.json(
                { error: 'Recommended service and price are required' },
                { status: 400 }
            );
        }

        // Get quote request
        const { data: quoteRequest, error: fetchError } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('id', quoteRequestId)
            .single();

        if (fetchError || !quoteRequest) {
            return NextResponse.json(
                { error: 'Quote request not found' },
                { status: 404 }
            );
        }

        if (quoteRequest.status !== 'pending_review') {
            return NextResponse.json(
                { error: 'Quote request is not in pending review status' },
                { status: 400 }
            );
        }

        // Update quote request
        const updateData: QuoteRequestUpdate = {
            status: 'approved',
            recommended_service: recommendedService,
            recommended_price: parseFloat(recommendedPrice.toString()),
            reviewed_by: reviewedBy || null,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await (supabase.from('quote_requests') as unknown as {
            update: (values: QuoteRequestUpdate) => {
                eq: (column: string, value: string) => Promise<unknown>;
            };
        })
            .update(updateData)
            .eq('id', quoteRequestId);

        if (updateError) {
            return NextResponse.json(
                {
                    error: 'Failed to update quote request',
                    details: updateError.message,
                },
                { status: 500 }
            );
        }

        // Create Stripe checkout session for deposit (50% of total)
        const depositAmount = parseFloat(recommendedPrice.toString()) * 0.5;
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${origin}/payment/cancel?quote_request_id=${quoteRequestId}`;

        const checkoutResult = await StripeService.createCheckoutSession({
            amount: Math.round(depositAmount * 100), // Convert to cents
            currency: 'aud',
            customerEmail: quoteRequest.email,
            customerName: quoteRequest.name,
            description: `${recommendedService} - Deposit (50%)`,
            metadata: {
                quote_request_id: quoteRequestId,
                type: 'assessment_deposit',
                service: recommendedService,
                total_price: recommendedPrice.toString(),
                deposit_amount: depositAmount.toString(),
            },
            successUrl,
            cancelUrl,
        });

        if (!checkoutResult.success || !checkoutResult.url) {
            return NextResponse.json(
                { error: 'Failed to create payment link' },
                { status: 500 }
            );
        }

        // Send email with payment link
        try {
            const emailBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f6f8; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
        .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9fafb; }
        .info-box { background: white; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; padding: 15px 30px; background: #DC2626; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .footer { padding: 20px; text-align: center; color: #6B7280; font-size: 12px; background: #ffffff; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Your Crashify Quote</h1>
        </div>
        <div class="content">
            <p>Hi ${quoteRequest.name},</p>
            <p>Thanks for your quote request. Here's your assessment quote:</p>
            <div class="info-box">
                <p><strong>SERVICE:</strong> ${recommendedService}</p>
                <p><strong>VEHICLE:</strong> ${quoteRequest.vehicle}</p>
                <p><strong>DAMAGE:</strong> ${quoteRequest.description}</p>
                <p><strong>PRICE:</strong> $${parseFloat(recommendedPrice.toString()).toLocaleString('en-AU', { minimumFractionDigits: 2 })} (inc GST)</p>
                <p><strong>TURNAROUND:</strong> 48 hours from photos received</p>
            </div>
            <p><strong>TO PROCEED:</strong></p>
            <ol>
                <li>Pay $${depositAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} deposit (50%)</li>
                <li>Complete full assessment form</li>
                <li>Receive report within 48 hours</li>
                <li>Pay remaining $${depositAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} when satisfied</li>
            </ol>
            <p>Payment secured by Stripe. Refund policy: Full refund if not satisfied.</p>
            <div style="text-align: center;">
                <a href="${checkoutResult.url}" class="button">Pay Deposit & Start</a>
            </div>
            <p>Questions? Call Fady: <a href="tel:0426000910">0426 000 910</a></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} Crashify Pty Ltd. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
            `;

            await EmailService.sendEmail({
                to: quoteRequest.email,
                subject: `Your Crashify Quote - $${parseFloat(recommendedPrice.toString()).toLocaleString('en-AU')} ${recommendedService}`,
                html: emailBody,
            });
        } catch (emailError) {
            console.error('[QUOTE_APPROVE] Failed to send email:', emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Quote request approved and payment email sent',
            paymentUrl: checkoutResult.url,
        });
    } catch (error) {
        console.error('[QUOTE_APPROVE] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to approve quote request',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

