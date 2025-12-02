import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';

export async function GET(request: NextRequest) {
    try {
        // Check if user is authenticated
        const currentUser = await getSession();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Only admin and manager can list users
        if (!['admin', 'manager'].includes(currentUser.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const role = searchParams.get('role');
        const search = searchParams.get('search');

        const offset = (page - 1) * limit;

        // Use service role client to bypass RLS (we've already verified user is admin/manager)
        const serverClient = createServerClient();

        // Build query
        let query = serverClient
            .from('users')
            .select(
                'id, email, name, role, two_factor_enabled, is_active, last_login, created_at',
                { count: 'exact' }
            );

        // Apply filters
        if (role && ['admin', 'manager', 'reviewer'].includes(role)) {
            query = query.eq('role', role);
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
        }

        // Apply pagination
        query = query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        const { data: users, error, count } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch users' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('User list error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
