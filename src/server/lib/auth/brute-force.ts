// =============================================
// FILE: lib/auth/brute-force.ts
// Enterprise-level brute force protection
// =============================================

import { supabase } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

const MAX_LOGIN_ATTEMPTS = 5; // Lock after 5 failed attempts
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const PROGRESSIVE_DELAY_BASE = 1000; // 1 second base delay
const MAX_DELAY = 30 * 1000; // Max 30 seconds delay

// Removed unused interface - LoginAttempt was not being used

/**
 * Check if account is locked due to too many failed attempts
 * Optimized: Only fetches failed attempts in the time window, then filters by email
 * Also checks for successful logins - if there's been a successful login after failed attempts,
 * those failed attempts are effectively "cleared"
 */
export async function isAccountLocked(
    email: string
): Promise<{ locked: boolean; unlockAt?: Date }> {
    const fifteenMinutesAgo = new Date(Date.now() - LOCKOUT_DURATION);
    const lowerEmail = email.toLowerCase();

    // Query failed attempts in the last 15 minutes
    // Note: We filter by email in JS since Supabase JS client has limited JSON path support
    // This is still efficient as we limit by time window and action type
    const { data: allAttempts } = await (supabase
        .from('audit_logs') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    gte: (column: string, value: string) => {
                        order: (column: string, options: { ascending: boolean }) => Promise<{
                            data: Array<{ changed_at: string; new_values: Database['public']['Tables']['audit_logs']['Row']['new_values'] }> | null;
                        }>;
                    };
                };
            };
        })
        .select('changed_at, new_values')
        .eq('action', 'login_failed')
        .gte('changed_at', fifteenMinutesAgo.toISOString())
        .order('changed_at', { ascending: false });

    if (!allAttempts) return { locked: false };

    // Filter attempts for this specific email
    const failedAttempts = allAttempts.filter((attempt) => {
        const details = attempt.new_values;
        return details && typeof details === 'object' && details !== null && 'email' in details && details.email === lowerEmail;
    });

    if (failedAttempts.length < MAX_LOGIN_ATTEMPTS) {
        return { locked: false };
    }

    // Check if there's been a successful login after the oldest failed attempt
    // If so, the failed attempts are effectively "cleared"
    const oldestFailedAttempt = failedAttempts[failedAttempts.length - 1];
    const oldestFailedTime = new Date(oldestFailedAttempt.changed_at);

    const { data: successAttempts } = await (supabase
        .from('audit_logs') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    gte: (column: string, value: string) => {
                        order: (column: string, options: { ascending: boolean }) => Promise<{
                            data: Array<{ changed_at: string; new_values: Database['public']['Tables']['audit_logs']['Row']['new_values'] }> | null;
                        }>;
                    };
                };
            };
        })
        .select('changed_at, new_values')
        .eq('action', 'login_success')
        .gte('changed_at', oldestFailedTime.toISOString())
        .order('changed_at', { ascending: false });

    if (successAttempts) {
        // Check if any successful login is for this email and happened after failed attempts
        const hasRecentSuccess = successAttempts.some((attempt) => {
            const details = attempt.new_values;
            return details && typeof details === 'object' && details !== null && 'email' in details && details.email === lowerEmail;
        });

        if (hasRecentSuccess) {
            // Successful login occurred after failed attempts - account is not locked
            return { locked: false };
        }
    }

    // Account is locked, calculate unlock time from oldest attempt
    const unlockAt = new Date(
        oldestFailedTime.getTime() + LOCKOUT_DURATION
    );
    return { locked: true, unlockAt };
}

/**
 * Get progressive delay based on recent failed attempts
 * Optimized: Only fetches failed attempts in the time window, then filters by email
 */
export async function getProgressiveDelay(
    email: string
): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lowerEmail = email.toLowerCase();

    // Query failed attempts in the last 5 minutes
    // Note: We filter by email in JS since Supabase JS client has limited JSON path support
    const { data: allAttempts } = await (supabase
        .from('audit_logs') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    gte: (column: string, value: string) => {
                        order: (column: string, options: { ascending: boolean }) => Promise<{
                            data: Array<{ new_values: Database['public']['Tables']['audit_logs']['Row']['new_values'] }> | null;
                        }>;
                    };
                };
            };
        })
        .select('new_values')
        .eq('action', 'login_failed')
        .gte('changed_at', fiveMinutesAgo.toISOString())
        .order('changed_at', { ascending: false });

    if (!allAttempts) return 0;

    // Filter attempts for this specific email
    const attempts = allAttempts.filter((attempt) => {
        const details = attempt.new_values;
        return details && typeof details === 'object' && details !== null && 'email' in details && details.email === lowerEmail;
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
        .from('audit_logs') as unknown as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    eq: (column: string, value: string) => {
                        gte: (column: string, value: string) => Promise<{
                            data: Array<{ id: string }> | null;
                        }>;
                    };
                };
            };
        })
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
    const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
        changed_by: userId || null,
        action: success ? 'login_success' : 'login_failed',
        new_values: success
            ? { email: email.toLowerCase() }
            : { email: email.toLowerCase(), reason: 'invalid_credentials' },
        ip_address: ipAddress,
        changed_at: new Date().toISOString(),
    };
    await (supabase.from('audit_logs') as unknown as {
        insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
    }).insert(auditLogInsert);
}

/**
 * Reset failed attempts on successful login
 * 
 * Note: We don't delete audit logs as they're needed for security auditing.
 * Instead, the isAccountLocked() function now checks for successful logins
 * after failed attempts. If a successful login occurred after failed attempts,
 * those failed attempts are effectively "cleared" and don't contribute to lock status.
 * 
 * This function is kept for API consistency and future enhancements.
 * The actual "reset" logic is handled in isAccountLocked() by checking for
 * successful logins that occurred after the failed attempts.
 * 
 * @param email The email address to reset failed attempts for
 */
export async function resetFailedAttempts(email: string): Promise<void> {
    // The reset logic is implemented in isAccountLocked() which checks for
    // successful logins after failed attempts. This ensures that:
    // 1. Audit logs are preserved for security auditing
    // 2. Failed attempts are effectively cleared on successful login
    // 3. The lock status is accurate and doesn't persist after successful authentication
    
    // No action needed here - the successful login record (created by recordLoginAttempt)
    // will be checked by isAccountLocked() to determine if the account should be locked
}

