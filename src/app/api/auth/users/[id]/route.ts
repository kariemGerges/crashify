import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { hashPassword } from '@/server/lib/auth/password';

// Update user
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await getSession();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        if (currentUser.role !== 'admin') {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const { name, role, isActive, password } = await request.json();
        const userId = params.id;

        // Build update object
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.is_active = isActive;
        if (password) {
            updates.password_hash = await hashPassword(password);
        }

        const { data: updatedUser, error } = await (
            supabase.from('users') as any
        )
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to update user' },
                { status: 500 }
            );
        }

        // Log the action
        await (supabase.from('audit_logs') as any).insert({
            user_id: currentUser.id,
            action: 'user_updated',
            resource: 'users',
            details: {
                updated_user_id: userId,
                changes: updates,
            },
            ip_address: request.headers.get('x-forwarded-for'),
        });

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                isActive: updatedUser.is_active,
            },
        });
    } catch (error) {
        console.error('User update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete user (soft delete by setting is_active to false)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await getSession();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        if (currentUser.role !== 'admin') {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const userId = params.id;

        // Prevent self-deletion
        if (userId === currentUser.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Soft delete (set is_active to false)
        const { error } = await (supabase.from('users') as any)
            .update({ is_active: false })
            .eq('id', userId);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to delete user' },
                { status: 500 }
            );
        }

        // Delete all user sessions
        await (supabase.from('sessions') as any).delete().eq('user_id', userId);

        // Log the action
        await (supabase.from('audit_logs') as any).insert({
            user_id: currentUser.id,
            action: 'user_deleted',
            resource: 'users',
            details: { deleted_user_id: userId },
            ip_address: request.headers.get('x-forwarded-for'),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('User deletion error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
