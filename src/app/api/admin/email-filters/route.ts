// =============================================
// FILE: app/api/admin/email-filters/route.ts
// Email Filter Management API (REQ-4)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { createServerClient } from '@/server/lib/supabase/client';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import type { Database } from '@/server/lib/types/database.types';

type EmailFilterInsert = Database['public']['Tables']['email_filters']['Insert'];

// GET: List all email filters
export async function GET(request: NextRequest) {
    try {
        const user = await getSession();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'whitelist' or 'blacklist'
        const isActive = searchParams.get('is_active');

        let query = supabase.from('email_filters').select('*').order('created_at', { ascending: false });

        if (type) {
            query = query.eq('type', type);
        }

        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data, error } = await query;

        if (error) {
            console.error('[EMAIL_FILTERS] Error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch email filters' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data || [],
        });
    } catch (error) {
        console.error('[EMAIL_FILTERS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch email filters',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// POST: Create new email filter
export async function POST(request: NextRequest) {
    try {
        // Verify CSRF token
        const csrfCheck = await requireCsrfToken(request);
        if (!csrfCheck.valid) {
            return NextResponse.json(
                { error: csrfCheck.error || 'CSRF token validation failed' },
                { status: 403 }
            );
        }

        const user = await getSession();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, email_domain, email_address, reason, is_active } = body;

        if (!type || !(type === 'whitelist' || type === 'blacklist')) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "whitelist" or "blacklist"' },
                { status: 400 }
            );
        }

        if (!email_domain && !email_address) {
            return NextResponse.json(
                { error: 'Either email_domain or email_address is required' },
                { status: 400 }
            );
        }

        if (email_domain && email_address) {
            return NextResponse.json(
                { error: 'Cannot specify both email_domain and email_address' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();
        const filterData: EmailFilterInsert = {
            type,
            email_domain: email_domain || null,
            email_address: email_address || null,
            reason: reason || null,
            created_by: user.id,
            is_active: is_active !== undefined ? is_active : true,
        };

        const { data, error } = await (
            supabase.from('email_filters') as unknown as {
                insert: (values: EmailFilterInsert) => {
                    select: () => {
                        single: () => Promise<{
                            data: Database['public']['Tables']['email_filters']['Row'] | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert(filterData)
            .select()
            .single();

        if (error) {
            console.error('[EMAIL_FILTERS] Error:', error);
            return NextResponse.json(
                { error: 'Failed to create email filter' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('[EMAIL_FILTERS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create email filter',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

