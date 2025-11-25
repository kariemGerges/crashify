import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { hashPassword } from '@/server/lib/auth/password';
import type { Database } from '@/server/lib/types/database.types';

// Update user
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
        const { id: userId } = await params;

        // Build update object
        const updates: Database['public']['Tables']['users']['Update'] & { password_hash?: string; is_active?: boolean } = {};
        if (name !== undefined) updates.name = name;
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.is_active = isActive;
        if (password) {
            updates.password_hash = await hashPassword(password);
        }

        const { data: updatedUser, error } = await (supabase.from('users') as unknown as {
            update: (values: Database['public']['Tables']['users']['Update']) => {
                eq: (column: string, value: string) => {
                    select: () => {
                        single: () => Promise<{
                            data: Database['public']['Tables']['users']['Row'] | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            };
        })
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error || !updatedUser) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to update user' },
                { status: 500 }
            );
        }

        // Log the action
        const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
            changed_by: currentUser.id,
            action: 'user_updated',
            new_values: {
                updated_user_id: userId,
                changes: updates,
            },
            ip_address: request.headers.get('x-forwarded-for'),
        };
        await (supabase.from('audit_logs') as unknown as {
            insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
        }).insert(auditLogInsert);

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                isActive: (updates.is_active !== undefined ? updates.is_active : true),
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
    { params }: { params: Promise<{ id: string }> }
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

        const { id: userId } = await params;

        // Prevent self-deletion
        if (userId === currentUser.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // First, verify the user exists and get current state
        const { data: existingUser, error: fetchError } = await (supabase.from('users') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    single: () => Promise<{
                        data: (Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'name'> & { is_active?: boolean }) | null;
                        error: { message: string } | null;
                    }>;
                };
            };
        })
            .select('id, is_active, email, name')
            .eq('id', userId)
            .single();

        if (fetchError || !existingUser) {
            console.error('User not found:', fetchError);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }


        // Soft delete (set is_active to false) - allow re-deleting if already deleted
        const deleteUpdate: Database['public']['Tables']['users']['Update'] & { is_active: boolean } = { 
            is_active: false, 
            updated_at: new Date().toISOString() 
        };
        const {
            data: updatedUser,
            error,
        } = await (supabase.from('users') as unknown as {
            update: (values: Database['public']['Tables']['users']['Update'] & { is_active?: boolean }) => {
                eq: (column: string, value: string) => {
                    select: () => {
                        single: () => Promise<{
                            data: Database['public']['Tables']['users']['Row'] | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            };
        })
            .update(deleteUpdate)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Database update error:', error);
            return NextResponse.json(
                { error: 'Failed to delete user', details: error.message },
                { status: 500 }
            );
        }

        // Verify the update actually worked
        if (!updatedUser) {
            console.error('Update returned no data for user:', userId);
            return NextResponse.json(
                { error: 'Failed to delete user - no data returned' },
                { status: 500 }
            );
        }

        // Double-check by querying the user again
        const { data: verifyUser } = await (supabase.from('users') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    single: () => Promise<{
                        data: (Pick<Database['public']['Tables']['users']['Row'], 'id'> & { is_active?: boolean }) | null;
                    }>;
                };
            };
        })
            .select('id, is_active')
            .eq('id', userId)
            .single();

        if (verifyUser && verifyUser.is_active !== false) {
            console.error(
                'Verification failed - user still active:',
                verifyUser
            );
            return NextResponse.json(
                { error: 'Failed to delete user - verification failed' },
                { status: 500 }
            );
        }

        console.log('User successfully deleted:', {
            userId,
            email: existingUser.email,
        });

        // Delete all user sessions
        await (supabase.from('sessions') as unknown as {
            delete: () => {
                eq: (column: string, value: string) => Promise<unknown>;
            };
        }).delete().eq('user_id', userId);

        // Log the action
        const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
            changed_by: currentUser.id,
            action: 'user_deleted',
            new_values: { deleted_user_id: userId },
            ip_address: request.headers.get('x-forwarded-for'),
        };
        await (supabase.from('audit_logs') as unknown as {
            insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
        }).insert(auditLogInsert);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('User deletion error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
