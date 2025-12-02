// ============================================
// FILE: /app/api/admin/tokens/list/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { TokenRepository } from '@/server/lib/db/token-repository';
import { getSession } from '@/server/lib/auth/session';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import { supabase } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

// Maximum limit for pagination to prevent DoS
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest) {
    try {
        // 🔒 Authentication and Authorization Check
        const currentUser = await getSession();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Only admin and manager can list tokens
        if (!['admin', 'manager'].includes(currentUser.role)) {
            return NextResponse.json(
                {
                    error: 'Insufficient permissions. Admin or Manager role required.',
                },
                { status: 403 }
            );
        }

        // Validate and sanitize IP address
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent') || undefined;

        // Get and validate query parameters
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const pageParam = searchParams.get('page');
        const includeUsedParam = searchParams.get('includeUsed');
        const includeExpiredParam = searchParams.get('includeExpired');

        // Validate limit
        let limit = DEFAULT_LIMIT;
        if (limitParam) {
            const parsedLimit = parseInt(limitParam, 10);
            if (isNaN(parsedLimit) || parsedLimit < 1) {
                return NextResponse.json(
                    {
                        error: 'Invalid limit parameter. Must be a positive number.',
                    },
                    { status: 400 }
                );
            }
            if (parsedLimit > MAX_LIMIT) {
                return NextResponse.json(
                    { error: `Limit cannot exceed ${MAX_LIMIT}` },
                    { status: 400 }
                );
            }
            limit = parsedLimit;
        }

        // Validate page
        let page = 1;
        if (pageParam) {
            const parsedPage = parseInt(pageParam, 10);
            if (isNaN(parsedPage) || parsedPage < 1) {
                return NextResponse.json(
                    {
                        error: 'Invalid page parameter. Must be a positive number.',
                    },
                    { status: 400 }
                );
            }
            page = parsedPage;
        }

        // Validate boolean parameters
        const includeUsed = includeUsedParam === 'true';
        const includeExpired = includeExpiredParam === 'true';

        // Fetch tokens
        const tokens = await TokenRepository.getActiveTokens();

        // Filter tokens based on parameters
        let filteredTokens = tokens;
        if (!includeUsed) {
            filteredTokens = filteredTokens.filter(token => !token.isUsed);
        }
        if (!includeExpired) {
            const now = new Date();
            filteredTokens = filteredTokens.filter(
                token => new Date(token.expiresAt) > now
            );
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        const paginatedTokens = filteredTokens.slice(offset, offset + limit);
        const total = filteredTokens.length;
        const totalPages = Math.ceil(total / limit);

        // Sanitize tokens - mask sensitive data for privacy
        const sanitizedTokens = paginatedTokens.map(token => ({
            id: token.id,
            customerEmail: maskEmail(token.customerEmail),
            customerPhone: maskPhone(token.customerPhone),
            customerId: token.customerId,
            policyNumber: token.policyNumber
                ? maskPolicyNumber(token.policyNumber)
                : null,
            expiresAt: token.expiresAt,
            isUsed: token.isUsed,
            usedAt: token.usedAt,
            createdAt: token.createdAt,
            claimType: token.claimType,
        }));

        // Log the action to audit logs
        try {
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] =
                {
                    user_id: currentUser.id,
                    action: 'tokens_listed',
                    details: {
                        page,
                        limit,
                        totalResults: total,
                        includeUsed,
                        includeExpired,
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    created_at: new Date().toISOString(),
                    success: true,
                };
            await (
                supabase.from('audit_logs') as unknown as {
                    insert: (
                        values: Database['public']['Tables']['audit_logs']['Insert']
                    ) => Promise<unknown>;
                }
            ).insert(auditLogInsert);
        } catch (auditError) {
            // Don't fail the request if audit logging fails, but log it
            console.error('[TOKEN_LIST] Audit log failed:', auditError);
        }

        return NextResponse.json({
            tokens: sanitizedTokens,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    } catch (error) {
        console.error('[TOKEN_LIST_ERROR]', error);

        // Log to audit if we have a user session
        try {
            const currentUser = await getSession();
            if (currentUser) {
                const rawIpHeader = request.headers.get('x-forwarded-for');
                const ipAddress = validateAndExtractIp(rawIpHeader);
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] =
                    {
                        user_id: currentUser.id,
                        action: 'token_list_failed',
                        details: {
                            error: 'Token list fetch failed',
                        },
                        ip_address: ipAddress,
                        created_at: new Date().toISOString(),
                        success: false,
                    };
                await (
                    supabase.from('audit_logs') as unknown as {
                        insert: (
                            values: Database['public']['Tables']['audit_logs']['Insert']
                        ) => Promise<unknown>;
                    }
                ).insert(auditLogInsert);
            }
        } catch (auditError) {
            console.error('[TOKEN_LIST] Audit log failed:', auditError);
        }

        return NextResponse.json(
            { error: 'Failed to fetch tokens. Please try again.' },
            { status: 500 }
        );
    }
}

/**
 * Mask email address for privacy (show first 3 chars + ***)
 */
function maskEmail(email: string): string {
    if (!email || email.length <= 3) return '***';
    const [localPart, domain] = email.split('@');
    if (!domain) return email.substring(0, 3) + '***';
    return localPart.substring(0, 3) + '***@' + domain;
}

/**
 * Mask phone number for privacy (show last 4 digits)
 */
function maskPhone(phone: string): string {
    if (!phone || phone.length <= 4) return '***';
    return '***' + phone.slice(-4);
}

/**
 * Mask policy number for privacy (show first 2 and last 2 chars)
 */
function maskPolicyNumber(policyNumber: string): string {
    if (!policyNumber || policyNumber.length <= 4) return '****';
    return policyNumber.substring(0, 2) + '***' + policyNumber.slice(-2);
}
