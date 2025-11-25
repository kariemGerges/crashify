import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import {
    hashPassword,
    validatePasswordStrength,
} from '@/server/lib/auth/password';
import { getSession } from '@/server/lib/auth/session';
import {
    generateTwoFactorSecret,
    generateQRCode,
} from '@/server/lib/auth/two-factor';
import { EmailService } from '@/server/lib/services/email-service';
import * as speakeasy from 'speakeasy';
import type { Database } from '@/server/lib/types/database.types';

export async function POST(request: NextRequest) {
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

        const { email, name, password, role, twoFactorEnabled } =
            await request.json();

        // Validate required fields
        if (!email || !name || !password || !role) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { error: passwordValidation.errors.join(', ') },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['admin', 'manager', 'reviewer'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role specified' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser } = await (supabase.from('users') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    single: () => Promise<{
                        data: Pick<Database['public']['Tables']['users']['Row'], 'id'> | null;
                    }>;
                };
            };
        })
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate 2FA secret if enabled
        let twoFactorSecret = null;
        if (twoFactorEnabled) {
            const secret = generateTwoFactorSecret(email);
            twoFactorSecret = secret.base32;
        }

        // Create user
        const userInsert: Database['public']['Tables']['users']['Insert'] & { password_hash: string; two_factor_secret: string | null; is_active: boolean } = {
            email: email.toLowerCase(),
            name,
            password_hash: passwordHash,
            role,
            two_factor_enabled: twoFactorEnabled || false,
            two_factor_secret: twoFactorSecret,
            is_active: true,
        };
        const { data: newUser, error } = await (supabase.from('users') as unknown as {
            insert: (values: typeof userInsert[]) => {
                select: () => {
                    single: () => Promise<{
                        data: Database['public']['Tables']['users']['Row'] | null;
                        error: { message: string } | null;
                    }>;
                };
            };
        })
            .insert([userInsert])
            .select()
            .single();

        if (error || !newUser) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        // Log the action
        const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
            changed_by: currentUser.id,
            action: 'user_created',
            new_values: {
                created_user_id: newUser.id,
                email: newUser.email,
                role: newUser.role,
            },
            ip_address: request.headers.get('x-forwarded-for'),
        };
        await (supabase.from('audit_logs') as unknown as {
            insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
        }).insert(auditLogInsert);

        // If 2FA is enabled, send setup email automatically
        if (newUser.two_factor_enabled && twoFactorSecret) {
            try {
                // Generate OTP Auth URL
                const otpauthUrl = speakeasy.otpauthURL({
                    secret: twoFactorSecret,
                    label: encodeURIComponent(`CarInsure Admin (${newUser.email})`),
                    issuer: 'CarInsure',
                    encoding: 'base32',
                });

                // Generate QR code
                const qrCodeDataUrl = await generateQRCode(otpauthUrl);

                // Send email with QR code
                await EmailService.sendTwoFactorSetup({
                    to: newUser.email,
                    userName: name,
                    qrCodeDataUrl,
                    secret: twoFactorSecret,
                    otpauthUrl,
                });
            } catch (emailError) {
                // Log email error but don't fail user creation
                console.error('Failed to send 2FA setup email:', emailError);
                // Continue - user can still get QR code via the API endpoint
            }
        }

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    twoFactorEnabled: newUser.two_factor_enabled,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('User creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
