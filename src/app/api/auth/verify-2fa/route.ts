import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { verifyTwoFactorToken } from '@/server/lib/auth/two-factor';
import { createSession } from '@/server/lib/auth/session';

export async function POST(request: NextRequest) {
    try {
        const { code, tempToken } = await request.json();

        if (!code || !tempToken) {
            return NextResponse.json(
                { error: 'Code and temp token required' },
                { status: 400 }
            );
        }

        // Verify temp token
        const { data: session, error } = await (
            supabase.from('sessions') as any
        )
            .select('*, users(*)')
            .eq('token', tempToken)
            .single();

        if (error || !session) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Check expiration
        if (new Date(session.expires_at) < new Date()) {
            await (supabase.from('sessions') as any)
                .delete()
                .eq('token', tempToken);
            return NextResponse.json(
                { error: 'Token expired' },
                { status: 401 }
            );
        }

        const user = session.users;

        // Verify 2FA code
        const isValid = verifyTwoFactorToken(code, user.two_factor_secret);

        if (!isValid) {
            await (supabase.from('audit_logs') as any).insert({
                user_id: user.id,
                action: '2fa_failed',
                ip_address: request.headers.get('x-forwarded-for'),
            });

            return NextResponse.json(
                { error: 'Invalid 2FA code' },
                { status: 401 }
            );
        }

        // Delete temp token
        await (supabase.from('sessions') as any)
            .delete()
            .eq('token', tempToken);

        // Create actual session
        const ipAddress = request.headers.get('x-forwarded-for');
        const userAgent = request.headers.get('user-agent');

        await createSession(
            user.id,
            ipAddress || undefined,
            userAgent || undefined
        );

        // Log successful 2FA
        await (supabase.from('audit_logs') as any).insert({
            user_id: user.id,
            action: '2fa_success',
            ip_address: ipAddress,
        });

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
        console.error('2FA verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
