import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import {
    hashPassword,
    validatePasswordStrength,
} from '@/server/lib/auth/password';
import { getSession } from '@/server/lib/auth/session';
import { generateTwoFactorSecret } from '@/server/lib/auth/two-factor';

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
        const { data: existingUser } = await (supabase.from('users') as any)
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
        const { data: newUser, error } = await (supabase.from('users') as any)
            .insert([
                {
                    email: email.toLowerCase(),
                    name,
                    password_hash: passwordHash,
                    role,
                    two_factor_enabled: twoFactorEnabled || false,
                    two_factor_secret: twoFactorSecret,
                    is_active: true,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        // Log the action
        await (supabase.from('audit_logs') as any).insert({
            user_id: currentUser.id,
            action: 'user_created',
            resource: 'users',
            details: {
                created_user_id: newUser.id,
                email: newUser.email,
                role: newUser.role,
            },
            ip_address: request.headers.get('x-forwarded-for'),
        });

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
