import { cookies } from 'next/headers';
import { supabase, createServerClient } from '@/server/lib/supabase/client';
import { randomBytes } from 'crypto';
import type { User } from '@/server/lib/types/auth';
import type { Database } from '@/server/lib/types/database.types';

type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

const SESSION_COOKIE_NAME = 'car_admin_session';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours (REQ-125)

export async function createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
): Promise<string> {
    // Use service role client to bypass RLS for session creation
    const serverClient = createServerClient();
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    const sessionData: SessionInsert = {
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress ?? null,
        user_agent: userAgent ?? null,
    };
    const { error } = await (serverClient.from('sessions') as unknown as {
        insert: (values: SessionInsert[]) => Promise<{ error: { message: string } | null }>;
    }).insert([sessionData]);

    if (error) {
        console.error('Failed to create session:', error);
        throw new Error('Failed to create session');
    }

    // Set HTTP-only secure cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/',
    });

    // Update last login
    const userUpdate: UserUpdate = { last_login: new Date().toISOString() };
    await (supabase.from('users') as unknown as {
        update: (values: UserUpdate) => {
            eq: (column: string, value: string) => Promise<unknown>;
        };
    }).update(userUpdate).eq('id', userId);

    return token;
}

export async function getSession(): Promise<User | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    // TEMPORARY FIX: Use service role client to bypass RLS for session lookup
    // RLS blocks session lookup because auth.uid() is null during session validation
    const serverClient = createServerClient();
    const { data: session, error } = await (serverClient
        .from('sessions') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    single: () => Promise<{
                        data: { 
                            expires_at: string; 
                            users: Database['public']['Tables']['users']['Row'] | null 
                        } | null;
                        error: { message: string } | null;
                    }>;
                };
            };
        })
        .select('*, users(*)')
        .eq('token', token)
        .single();

    if (error || !session) {
        if (error) {
            console.error('Session lookup error:', error);
        }
        return null;
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
        await deleteSession(token);
        return null;
    }

    const user = session.users;
    if (!user) {
        return null;
    }
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.two_factor_enabled,
        lastLogin: user.last_login ?? undefined,
    };
}

export async function deleteSession(token?: string): Promise<void> {
    const cookieStore = await cookies();
    const sessionToken = token || cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
        await (supabase.from('sessions') as unknown as {
            delete: () => {
                eq: (column: string, value: string) => Promise<unknown>;
            };
        })
            .delete()
            .eq('token', sessionToken);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function createTempToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const tempSessionData: SessionInsert = {
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
    };
    await (supabase.from('sessions') as unknown as {
        insert: (values: SessionInsert) => Promise<unknown>;
    }).insert(tempSessionData);

    return token;
}
