// =============================================
// FILE: lib/services/email-filter.ts
// Email whitelist/blacklist filtering service (REQ-4)
// =============================================

import { createServerClient } from '@/server/lib/supabase/client';

export interface EmailFilterResult {
    isWhitelisted: boolean;
    isBlacklisted: boolean;
    filterType: 'whitelist' | 'blacklist' | null;
    reason: string | null;
}

/**
 * Check if email is whitelisted or blacklisted
 */
export async function checkEmailFilter(email: string): Promise<EmailFilterResult> {
    const supabase = createServerClient();
    const emailDomain = email.split('@')[1]?.toLowerCase() || '';

    // Check whitelist first
    const { data: whitelistData } = await supabase
        .from('email_filters')
        .select('reason')
        .eq('type', 'whitelist')
        .eq('is_active', true)
        .or(`email_address.eq.${email},email_domain.eq.${emailDomain}`)
        .limit(1);

    if (whitelistData && whitelistData.length > 0) {
        return {
            isWhitelisted: true,
            isBlacklisted: false,
            filterType: 'whitelist',
            reason: whitelistData[0].reason || 'Email is whitelisted',
        };
    }

    // Check blacklist
    const { data: blacklistData } = await supabase
        .from('email_filters')
        .select('reason')
        .eq('type', 'blacklist')
        .eq('is_active', true)
        .or(`email_address.eq.${email},email_domain.eq.${emailDomain}`)
        .limit(1);

    if (blacklistData && blacklistData.length > 0) {
        return {
            isWhitelisted: false,
            isBlacklisted: true,
            filterType: 'blacklist',
            reason: blacklistData[0].reason || 'Email is blacklisted',
        };
    }

    return {
        isWhitelisted: false,
        isBlacklisted: false,
        filterType: null,
        reason: null,
    };
}

