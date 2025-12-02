import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('car_admin_session');
    const pathname = request.nextUrl.pathname;

    // Public routes
    const publicRoutes = ['/login', '/verify-2fa'];
    const isPublicRoute = publicRoutes.some(route =>
        pathname.startsWith(route)
    );

    // If no session and trying to access protected route
    if (!sessionCookie && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If has session and trying to access auth pages
    if (sessionCookie && isPublicRoute) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Verify session is valid (you'd check database in production)
    if (sessionCookie && !isPublicRoute) {
        // Add role-based route protection here
        const response = await fetch(
            new URL('/api/auth/session', request.url).toString(),
            {
                headers: {
                    Cookie: `car_admin_session=${sessionCookie.value}`,
                },
            }
        );

        if (!response.ok) {
            const redirectResponse = NextResponse.redirect(
                new URL('/login', request.url)
            );
            redirectResponse.cookies.delete('car_admin_session');
            return redirectResponse;
        }

        const { user } = await response.json();

        // Role-based access control (REQ-128)
        // Super Admin has access to everything
        if (user.role === 'super_admin') {
            return NextResponse.next();
        }

        // Admin settings - only admin and super_admin
        if (pathname.startsWith('/admin/settings')) {
            if (!['admin', 'super_admin'].includes(user.role)) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
        }

        // User management - admin, super_admin, and manager
        if (pathname.startsWith('/admin/users')) {
            if (!['admin', 'super_admin', 'manager'].includes(user.role)) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
        }

        // Read-only role - can only view, no modifications
        if (user.role === 'read_only') {
            // Block all POST/PUT/DELETE/PATCH requests
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
                return NextResponse.json(
                    { error: 'Read-only access: modifications not allowed' },
                    { status: 403 }
                );
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
