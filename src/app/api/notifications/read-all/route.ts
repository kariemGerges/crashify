// =============================================
// FILE: app/api/notifications/read-all/route.ts
// Mark all notifications as read
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { createServerClient } from '@/server/lib/supabase/client';
import { requireCsrfToken } from '@/server/lib/security/csrf';

// POST: Mark all notifications as read
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
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createServerClient();

        // Use the database function to mark all as read
        const { data, error } = await (
            supabase.rpc as unknown as (
                name: 'mark_all_notifications_read',
                args: { user_id_param: string }
            ) => Promise<{
                data: number | null;
                error: { message: string } | null;
            }>
        )('mark_all_notifications_read', {
            user_id_param: user.id,
        });

        if (error) {
            console.error('[NOTIFICATIONS] Error:', error);
            return NextResponse.json(
                { error: 'Failed to mark all notifications as read' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            count: data || 0,
            message: `Marked ${data || 0} notification(s) as read`,
        });
    } catch (error) {
        console.error('[NOTIFICATIONS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to mark all notifications as read',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

