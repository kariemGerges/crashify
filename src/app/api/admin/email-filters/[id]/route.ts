// =============================================
// FILE: app/api/admin/email-filters/[id]/route.ts
// Individual Email Filter Management API
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';
import { createServerClient } from '@/server/lib/supabase/client';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import type { Database } from '@/server/lib/types/database.types';

type EmailFilterUpdate = Database['public']['Tables']['email_filters']['Update'];

// PATCH: Update email filter
export async function PATCH(
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
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        const supabase = createServerClient();
        const updateData: EmailFilterUpdate = {
            updated_at: new Date().toISOString(),
        };

        if (body.is_active !== undefined) {
            updateData.is_active = body.is_active;
        }

        if (body.reason !== undefined) {
            updateData.reason = body.reason;
        }

        const { data, error } = await supabase
            .from('email_filters')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[EMAIL_FILTERS] Error:', error);
            return NextResponse.json(
                { error: 'Failed to update email filter' },
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
                error: 'Failed to update email filter',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// DELETE: Delete email filter
export async function DELETE(
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
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const supabase = createServerClient();

        const { error } = await supabase
            .from('email_filters')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[EMAIL_FILTERS] Error:', error);
            return NextResponse.json(
                { error: 'Failed to delete email filter' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email filter deleted successfully',
        });
    } catch (error) {
        console.error('[EMAIL_FILTERS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete email filter',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

