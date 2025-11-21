import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getSession } from '@/server/lib/auth/session';
import { supabase } from '@/server/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        const user = await getSession();

        if (user) {
            await (supabase.from('audit_logs') as any).insert({
                user_id: user.id,
                action: 'logout',
                ip_address: request.headers.get('x-forwarded-for'),
            });
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
