import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { generateQRCode } from '@/server/lib/auth/two-factor';
import * as speakeasy from 'speakeasy';
import type { Database } from '@/server/lib/types/database.types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check if user is authenticated and is admin
        const currentUser = await getSession();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        if (currentUser.role !== 'admin') {
            return NextResponse.json(
                { error: 'Insufficient permissions. Admin role required.' },
                { status: 403 }
            );
        }

        const { id: userId } = await params;

        // Get user from database
        const { data: user, error } = await (supabase.from('users') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    single: () => Promise<{
                        data: Database['public']['Tables']['users']['Row'] & { two_factor_secret: string | null } | null;
                        error: { message: string } | null;
                    }>;
                };
            };
        })
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (!user.two_factor_enabled || !user.two_factor_secret) {
            return NextResponse.json(
                { error: '2FA is not enabled for this user' },
                { status: 400 }
            );
        }

        // Generate OTP Auth URL
        const otpauthUrl = speakeasy.otpauthURL({
            secret: user.two_factor_secret,
            label: encodeURIComponent(`CarInsure Admin (${user.email})`),
            issuer: 'CarInsure',
            encoding: 'base32',
        });

        // Generate QR code
        const qrCodeDataUrl = await generateQRCode(otpauthUrl);

        return NextResponse.json({
            qrCode: qrCodeDataUrl,
            secret: user.two_factor_secret,
            email: user.email,
            otpauthUrl,
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

