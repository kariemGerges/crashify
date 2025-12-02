// =============================================
// FILE: server/lib/security/csrf.ts
// CSRF Protection Service (REQ-132)
// =============================================

import { randomBytes, createHmac } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_SECRET = process.env.CSRF_SECRET || 'change-me-in-production';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
    return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Create HMAC signature for CSRF token
 */
function signToken(token: string): string {
    return createHmac('sha256', CSRF_SECRET)
        .update(token)
        .digest('hex');
}

/**
 * Verify CSRF token signature
 */
function verifyTokenSignature(token: string, signature: string): boolean {
    const expectedSignature = signToken(token);
    return expectedSignature === signature;
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfToken(): Promise<string> {
    const token = generateCsrfToken();
    const signature = signToken(token);
    const signedToken = `${token}.${signature}`;

    const cookieStore = await cookies();
    cookieStore.set(CSRF_COOKIE_NAME, signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 60, // 2 hours (matches session duration)
        path: '/',
    });

    return token; // Return unsigned token for client
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const signedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!signedToken) {
        return null;
    }

    const [token, signature] = signedToken.split('.');
    if (!token || !signature) {
        return null;
    }

    if (!verifyTokenSignature(token, signature)) {
        return null;
    }

    return token;
}

/**
 * Verify CSRF token from request
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
    // Get token from cookie
    const cookieToken = await getCsrfToken();
    if (!cookieToken) {
        return false;
    }

    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (!headerToken) {
        return false;
    }

    // Compare tokens
    return cookieToken === headerToken;
}

/**
 * Middleware to require CSRF token for POST/PUT/DELETE requests
 */
export async function requireCsrfToken(request: Request): Promise<{ valid: boolean; error?: string }> {
    const method = request.method.toUpperCase();

    // Only require CSRF for state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return { valid: true };
    }

    const isValid = await verifyCsrfToken(request);
    if (!isValid) {
        return {
            valid: false,
            error: 'Invalid or missing CSRF token',
        };
    }

    return { valid: true };
}

