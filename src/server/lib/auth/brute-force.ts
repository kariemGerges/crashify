// =============================================
// FILE: lib/auth/brute-force.ts
// Enterprise-level brute force protection
// =============================================

import { supabase } from '@/server/lib/supabase/client';

const MAX_LOGIN_ATTEMPTS = 5; // Lock after 5 failed attempts
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const PROGRESSIVE_DELAY_BASE = 1000; // 1 second base delay
const MAX_DELAY = 30 * 1000; // Max 30 seconds delay

interface LoginAttempt {
    email: string;
    ipAddress: string | null;
    timestamp: number;
    success: boolean;
}

/**
 * Check if account is locked due to too many failed attempts
 */
export async function isAccountLocked(
    email: string
): Promise<{ locked: boolean; unlockAt?: Date }> {
    const fifteenMinutesAgo = new Date(Date.now() - LOCKOUT_DURATION);

    // Get all failed login attempts in the last 15 minutes
    const { data: allAttempts } = await (supabase
        .from('audit_logs') as any)
        .select('changed_at, new_values')
        .eq('action', 'login_failed')
        .gte('changed_at', fifteenMinutesAgo.toISOString())
        .order('changed_at', { ascending: false });

    if (!allAttempts) return { locked: false };

    // Filter attempts for this specific email
    const attempts = allAttempts.filter((attempt: any) => {
        const details = attempt.new_values;
        return details && details.email === email.toLowerCase();
    });

    if (attempts.length >= MAX_LOGIN_ATTEMPTS) {
        // Account is locked, calculate unlock time
        const oldestAttempt = attempts[attempts.length - 1];
        const unlockAt = new Date(
            new Date(oldestAttempt.changed_at).getTime() + LOCKOUT_DURATION
        );
        return { locked: true, unlockAt };
    }

    return { locked: false };
}

/**
 * Get progressive delay based on recent failed attempts
 */
export async function getProgressiveDelay(
    email: string
): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const { data: allAttempts } = await (supabase
        .from('audit_logs') as any)
        .select('changed_at, new_values')
        .eq('action', 'login_failed')
        .gte('changed_at', fiveMinutesAgo.toISOString())
        .order('changed_at', { ascending: false });

    if (!allAttempts) return 0;

    // Filter attempts for this specific email
    const attempts = allAttempts.filter((attempt: any) => {
        const details = attempt.new_values;
        return details && details.email === email.toLowerCase();
    });

    if (attempts.length === 0) {
        return 0;
    }

    // Exponential backoff: delay = base * 2^(attempts - 1)
    const delay = Math.min(
        PROGRESSIVE_DELAY_BASE * Math.pow(2, attempts.length - 1),
        MAX_DELAY
    );

    return delay;
}

/**
 * Check if IP address should be blocked
 */
export async function isIpBlocked(
    ipAddress: string | null
): Promise<boolean> {
    if (!ipAddress) return false;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count failed attempts from this IP in the last hour
    const { data: attempts } = await (supabase
        .from('audit_logs') as any)
        .select('id')
        .eq('action', 'login_failed')
        .eq('ip_address', ipAddress)
        .gte('changed_at', oneHourAgo.toISOString());

    // Block IP if more than 20 failed attempts in an hour
    return attempts ? attempts.length > 20 : false;
}

/**
 * Record login attempt for tracking
 */
export async function recordLoginAttempt(
    email: string,
    ipAddress: string | null,
    success: boolean,
    userId?: string
): Promise<void> {
    await (supabase.from('audit_logs') as any).insert({
        changed_by: userId || null,
        action: success ? 'login_success' : 'login_failed',
        new_values: success
            ? { email: email.toLowerCase() }
            : { email: email.toLowerCase(), reason: 'invalid_credentials' },
        ip_address: ipAddress,
        changed_at: new Date().toISOString(),
    });
}

/**
 * Reset failed attempts on successful login
 */
export async function resetFailedAttempts(email: string): Promise<void> {
    // This is handled automatically by the time-based window
    // But we could add a flag to users table if needed
}

