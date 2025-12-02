import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { verifyPassword } from '@/server/lib/auth/password';
import { createSession, createTempToken } from '@/server/lib/auth/session';
import {
    isAccountLocked,
    isIpBlocked,
    getProgressiveDelay,
    recordLoginAttempt,
    resetFailedAttempts,
} from '@/server/lib/auth/brute-force';
import {
    validateAndExtractIp,
    isValidEmail,
    sanitizeEmail,
    isValidPasswordLength,
} from '@/server/lib/utils/security';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { logLoginAttempt } from '@/server/lib/audit/logger';
import type { Database } from '@/server/lib/types/database.types';

// Extended user type to include fields not in generated types
type UserWithPassword = Database['public']['Tables']['users']['Row'] & {
    password_hash: string;
    is_active: boolean;
};

export async function POST(request: NextRequest) {
    try {
        // Verify CSRF token (REQ-132)
        const csrfCheck = await requireCsrfToken(request);
        if (!csrfCheck.valid) {
            await logLoginAttempt(undefined, false, undefined, undefined, csrfCheck.error);
            return NextResponse.json(
                { error: csrfCheck.error || 'CSRF token validation failed' },
                { status: 403 }
            );
        }

        const { email, password, recaptchaToken } = await request.json();

        // Verify reCAPTCHA (REQ-127)
        if (recaptchaToken) {
            try {
                const recaptchaResponse = await fetch(
                    `${request.nextUrl.origin}/api/auth/verify-recaptcha`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: recaptchaToken }),
                    }
                );

                if (!recaptchaResponse.ok) {
                    const recaptchaError = await recaptchaResponse.json();
                    await logLoginAttempt(undefined, false, undefined, undefined, 'reCAPTCHA verification failed');
                    return NextResponse.json(
                        { error: recaptchaError.error || 'reCAPTCHA verification failed' },
                        { status: 400 }
                    );
                }
            } catch (recaptchaError) {
                console.error('[LOGIN] reCAPTCHA verification error:', recaptchaError);
                // Don't block login if reCAPTCHA service is down, but log it
            }
        }

        // Validate and sanitize IP address from header
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent') || undefined;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Validate email format and length
        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password length to prevent DoS attacks
        if (!isValidPasswordLength(password)) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Sanitize email (trim and lowercase)
        const sanitizedEmail = sanitizeEmail(email);

        // Check if IP is blocked
        if (await isIpBlocked(ipAddress)) {
            await recordLoginAttempt(sanitizedEmail, ipAddress, false);
            return NextResponse.json(
                {
                    error: 'Too many failed attempts from this IP. Please try again later.',
                },
                { status: 429 }
            );
        }

        // Check if account is locked
        const lockStatus = await isAccountLocked(sanitizedEmail);
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
        const delay = await getProgressiveDelay(sanitizedEmail);
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Use service role client to bypass RLS for login lookup
        // RLS blocks user lookup during login because auth.uid() is null
        const serverClient = createServerClient();
        const { data: user, error } = (await serverClient
            .from('users')
            .select('*')
            .eq('email', sanitizedEmail)
            .eq('is_active', true)
            .single()) as {
            data: UserWithPassword | null;
            error: { message: string } | null;
        };

        if (error || !user) {
            // Log failed attempt (brute-force tracking)
            await recordLoginAttempt(sanitizedEmail, ipAddress, false);

            // Log audit event (REQ-136)
            await logLoginAttempt(undefined, false, ipAddress || undefined, userAgent || undefined, 'Invalid email or password');

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
            // Log failed attempt (brute-force tracking)
            await recordLoginAttempt(sanitizedEmail, ipAddress, false, user.id);

            // Log audit event (REQ-136)
            await logLoginAttempt(user.id, false, ipAddress || undefined, userAgent || undefined, 'Invalid password');

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
        await resetFailedAttempts(sanitizedEmail);

        // Create session
        await createSession(
            user.id,
            ipAddress || undefined,
            userAgent
        );

        // Log successful login (brute-force tracking)
        await recordLoginAttempt(sanitizedEmail, ipAddress, true, user.id);

        // Log audit event (REQ-136)
        await logLoginAttempt(user.id, true, ipAddress || undefined, userAgent || undefined);

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
