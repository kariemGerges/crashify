import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { verifyPassword } from '@/server/lib/auth/password';
import { createSession, createTempToken } from '@/server/lib/auth/session';
import {
    isAccountLocked,
    isIpBlocked,
    getProgressiveDelay,
    recordLoginAttempt,
    resetFailedAttempts,
} from '@/server/lib/auth/brute-force';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        const ipAddress = request.headers.get('x-forwarded-for');

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Check if IP is blocked
        if (await isIpBlocked(ipAddress)) {
            await recordLoginAttempt(email.toLowerCase(), ipAddress, false);
            return NextResponse.json(
                {
                    error: 'Too many failed attempts from this IP. Please try again later.',
                },
                { status: 429 }
            );
        }

        // Check if account is locked
        const lockStatus = await isAccountLocked(email.toLowerCase());
        if (lockStatus.locked) {
            const minutesRemaining = Math.ceil(
                (lockStatus.unlockAt!.getTime() - Date.now()) / 60000
            );
            return NextResponse.json(
                {
                    error: `Account temporarily locked due to too many failed attempts. Please try again in ${minutesRemaining} minute(s).`,
                },
                { status: 423 } // 423 Locked
            );
        }

        // Apply progressive delay for failed attempts
        const delay = await getProgressiveDelay(email.toLowerCase());
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Find user
        const { data: user, error } = await (supabase.from('users') as any)
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('is_active', true)
            .single();

        if (error || !user) {
            // Log failed attempt
            await recordLoginAttempt(email.toLowerCase(), ipAddress, false);

            // Generic error message (don't reveal if email exists)
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const passwordValid = await verifyPassword(
            password,
            user.password_hash
        );

        if (!passwordValid) {
            await recordLoginAttempt(
                email.toLowerCase(),
                ipAddress,
                false,
                user.id
            );

            // Generic error message
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check if 2FA is enabled
        if (user.two_factor_enabled) {
            const tempToken = await createTempToken(user.id);

            return NextResponse.json({
                requiresTwoFactor: true,
                tempToken,
            });
        }

        // Reset failed attempts on successful login
        await resetFailedAttempts(email.toLowerCase());

        // Create session
        const userAgent = request.headers.get('user-agent');

        await createSession(
            user.id,
            ipAddress || undefined,
            userAgent || undefined
        );

        // Log successful login
        await recordLoginAttempt(email.toLowerCase(), ipAddress, true, user.id);

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                twoFactorEnabled: user.two_factor_enabled,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        // Don't expose error details in production
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
