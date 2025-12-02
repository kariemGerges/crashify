// =============================================
// FILE: app/api/csrf-token/route.ts
// GET: Get CSRF token for forms (REQ-132)
// =============================================

import { NextResponse } from 'next/server';
import { setCsrfToken } from '@/server/lib/security/csrf';

export async function GET() {
    try {
        const token = await setCsrfToken();
        return NextResponse.json({ token });
    } catch (error) {
        console.error('[CSRF_TOKEN] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate CSRF token' },
            { status: 500 }
        );
    }
}

