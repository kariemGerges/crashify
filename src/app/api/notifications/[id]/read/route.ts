// =============================================
// FILE: app/api/notifications/[id]/read/route.ts
// Mark notification as read
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { createServerClient } from '@/server/lib/supabase/client';
import { requireCsrfToken } from '@/server/lib/security/csrf';

// POST: Mark notification as read
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const supabase = createServerClient();

        // Use the database function to mark as read
        const { data, error } = await (
            supabase.rpc as unknown as (
                name: 'mark_notification_read',
                args: { notification_id: string; user_id_param: string }
            ) => Promise<{
                data: boolean | null;
                error: { message: string } | null;
            }>
        )('mark_notification_read', {
            notification_id: id,
            user_id_param: user.id,
        });

        if (error) {
            console.error('[NOTIFICATIONS] Error:', error);
            return NextResponse.json(
                { error: 'Failed to mark notification as read' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error) {
        console.error('[NOTIFICATIONS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to mark notification as read',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

