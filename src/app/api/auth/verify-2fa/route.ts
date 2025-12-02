import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { verifyTwoFactorToken } from '@/server/lib/auth/two-factor';
import { createSession } from '@/server/lib/auth/session';
import type { Database } from '@/server/lib/types/database.types';

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
        const { data: session, error } = await (supabase.from('sessions') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    single: () => Promise<{
                        data: Database['public']['Tables']['sessions']['Row'] & { users: Database['public']['Tables']['users']['Row'] } | null;
                        error: { message: string } | null;
                    }>;
                };
            };
        })
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
            await (supabase.from('sessions') as unknown as {
                delete: () => {
                    eq: (column: string, value: string) => Promise<unknown>;
                };
            })
                .delete()
                .eq('token', tempToken);
            return NextResponse.json(
                { error: 'Token expired' },
                { status: 401 }
            );
        }

        const user = session.users as Database['public']['Tables']['users']['Row'] & { two_factor_secret: string | null };

        // Verify 2FA code
        if (!user.two_factor_secret) {
            return NextResponse.json(
                { error: '2FA is not configured for this user' },
                { status: 400 }
            );
        }
        const isValid = verifyTwoFactorToken(code, user.two_factor_secret);

        if (!isValid) {
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                user_id: user.id,
                action: '2fa_failed',
                ip_address: request.headers.get('x-forwarded-for'),
                created_at: new Date().toISOString(),
                success: false,
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
            }).insert(auditLogInsert);

            return NextResponse.json(
                { error: 'Invalid 2FA code' },
                { status: 401 }
            );
        }

        // Delete temp token
        await (supabase.from('sessions') as unknown as {
            delete: () => {
                eq: (column: string, value: string) => Promise<unknown>;
            };
        })
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
        const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
            user_id: user.id,
            action: '2fa_success',
            ip_address: ipAddress,
            created_at: new Date().toISOString(),
            success: true,
        };
        await (supabase.from('audit_logs') as unknown as {
            insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
        }).insert(auditLogInsert);

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
