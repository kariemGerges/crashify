// =============================================
// FILE: app/api/auth/verify-recaptcha/route.ts
// POST: Verify reCAPTCHA v3 token (REQ-127)
// =============================================

import { NextRequest, NextResponse } from 'next/server';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'reCAPTCHA token is required' },
                { status: 400 }
            );
        }

        if (!RECAPTCHA_SECRET_KEY) {
            console.error('[RECAPTCHA] RECAPTCHA_SECRET_KEY not configured');
            return NextResponse.json(
                { error: 'reCAPTCHA not configured' },
                { status: 500 }
            );
        }

        // Verify token with Google
        const response = await fetch(RECAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: RECAPTCHA_SECRET_KEY,
                response: token,
            }),
        });

        const data = await response.json();

        if (!data.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'reCAPTCHA verification failed',
                    errors: data['error-codes'],
                },
                { status: 400 }
            );
        }

        // Check score (v3 returns score 0.0-1.0, typically >0.5 is human)
        const score = data.score || 0;
        const threshold = 0.5;

        if (score < threshold) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'reCAPTCHA score too low',
                    score,
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            score,
            action: data.action,
        });
    } catch (error) {
        console.error('[RECAPTCHA] Verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify reCAPTCHA' },
            { status: 500 }
        );
    }
}

