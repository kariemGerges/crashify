import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/auth/session';

export async function GET(request: NextRequest) {
    try {
        // Debug: Log all cookies
        const cookieHeader = request.headers.get('cookie');
        console.log('Cookies received:', cookieHeader);

        const user = await getSession();

        if (!user) {
            // Debug: Check what getSession found
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('car_admin_session');
            console.log(
                'Session cookie from store:',
                sessionCookie ? 'Found' : 'Not found',
                sessionCookie?.value?.substring(0, 20)
            );

            return NextResponse.json(
                {
                    error: 'Not authenticated',
                    debug: { cookieFound: !!sessionCookie },
                },
                { status: 401 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
