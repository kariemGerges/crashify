// =============================================
// FILE: app/api/notifications/route.ts
// Notifications API (REQ-121)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { createServerClient } from '@/server/lib/supabase/client';

// GET: Get user's notifications
export async function GET(request: NextRequest) {
    try {
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread_only') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[NOTIFICATIONS] Error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch notifications' },
                { status: 500 }
            );
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        return NextResponse.json({
            success: true,
            data: data || [],
            unreadCount: unreadCount || 0,
        });
    } catch (error) {
        console.error('[NOTIFICATIONS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch notifications',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

