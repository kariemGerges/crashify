import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getSession } from '@/server/lib/auth/session';
import { supabase } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

export async function POST(request: NextRequest) {
    try {
        const user = await getSession();

        if (user) {
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                user_id: user.id,
                action: 'logout',
                ip_address: request.headers.get('x-forwarded-for'),
                created_at: new Date().toISOString(),
                success: true,
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
            }).insert(auditLogInsert);
        }

        await deleteSession();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
