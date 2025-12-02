/**
 * TEMPORARY: Set session cookie via API
 * This bypasses the need to manually set cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email required' },
                { status: 400 }
            );
        }

        // Get user
        const serverClient = createServerClient();
        const { data: user, error: userError } = (await serverClient
            .from('users')
            .select('id, email, name, role, is_active')
            .eq('email', email.toLowerCase())
            .single()) as { data: { id: string; email: string; name: string | null; role: string; is_active?: boolean } | null; error: unknown };

        if (userError || !user || !user.is_active) {
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 404 }
            );
        }

        // Get or create session
        const { data: existingSession } = (await serverClient
            .from('sessions')
            .select('token')
            .eq('user_id', user.id)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()) as { data: { token: string } | null };

        let token: string;
        
        if (existingSession?.token) {
            token = existingSession.token;
        } else {
            // Create new session
            const crypto = await import('crypto');
            token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

            await (serverClient.from('sessions') as unknown as {
                insert: (values: { user_id: string; token: string; expires_at: string }) => Promise<unknown>;
            }).insert({
                user_id: user.id,
                token,
                expires_at: expiresAt.toISOString(),
            });
        }

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('car_admin_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
            path: '/',
        });

        return NextResponse.json({
            success: true,
            message: 'Session cookie set successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Set session error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

