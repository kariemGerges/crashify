// ============================================
// FILE: /app/api/claims/validate-token/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { TokenRepository } from '@/server/lib/db/token-repository';
import { TokenValidator } from '@/server/lib/token/validator';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import { supabase } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

// Token format validation constants
// Secure tokens are 32 bytes = 64 hex characters
const TOKEN_MIN_LENGTH = 32;
const TOKEN_MAX_LENGTH = 128; // Allow some flexibility for different token formats

/**
 * Validate token format before database lookup
 * Prevents invalid queries and potential DoS attacks
 */
function isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    const trimmed = token.trim();

    // Check length
    if (
        trimmed.length < TOKEN_MIN_LENGTH ||
        trimmed.length > TOKEN_MAX_LENGTH
    ) {
        return false;
    }

    // Check format (hex characters for secure tokens)
    // Allow alphanumeric for readable tokens
    return /^[a-zA-Z0-9]+$/.test(trimmed);
}

export async function POST(request: NextRequest) {
    try {
        // Validate and sanitize IP address
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent') || undefined;

        const body = await request.json();
        const { token } = body;

        // Validate token presence
        if (!token) {
            // Log invalid attempt
            try {
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                    action: 'token_validation_failed',
                    details: {
                        reason: 'missing_token',
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    created_at: new Date().toISOString(),
                    success: false,
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
                }).insert(auditLogInsert);
            } catch (auditError) {
                console.error(
                    '[TOKEN_VALIDATION] Audit log failed:',
                    auditError
                );
            }

            return NextResponse.json(
                { valid: false, error: 'Token is required' },
                { status: 400 }
            );
        }

        // Validate token format
        if (!isValidTokenFormat(token)) {
            // Log invalid format attempt
            try {
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                    action: 'token_validation_failed',
                    details: {
                        reason: 'invalid_format',
                        tokenLength: token.length,
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    created_at: new Date().toISOString(),
                    success: false,
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
                }).insert(auditLogInsert);
            } catch (auditError) {
                console.error(
                    '[TOKEN_VALIDATION] Audit log failed:',
                    auditError
                );
            }

            return NextResponse.json(
                { valid: false, error: 'Invalid token format' },
                { status: 400 }
            );
        }

        // Sanitize token (trim whitespace)
        const sanitizedToken = token.trim();

        // Find token in database
        const claimToken = await TokenRepository.findByToken(sanitizedToken);

        // Validate token
        const validation = TokenValidator.validate(claimToken);

        if (!validation.valid) {
            // Log invalid access attempt to audit logs
            try {
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                    action: 'token_validation_failed',
                    details: {
                        reason: validation.errorCode || 'invalid',
                        errorCode: validation.errorCode,
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    created_at: new Date().toISOString(),
                    success: false,
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
                }).insert(auditLogInsert);
            } catch (auditError) {
                console.error(
                    '[TOKEN_VALIDATION] Audit log failed:',
                    auditError
                );
            }

            // Also log to console for monitoring
            console.warn('[INVALID_TOKEN_ACCESS]', {
                tokenPrefix: sanitizedToken.substring(0, 8) + '...',
                error: validation.errorCode,
                ip: ipAddress,
                userAgent,
            });

            // Return generic error to prevent token enumeration
            return NextResponse.json(
                {
                    valid: false,
                    error: 'Invalid or expired token',
                    errorCode: validation.errorCode,
                },
                { status: 403 }
            );
        }

        // Log successful validation
        try {
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                action: 'token_validated',
                details: {
                    tokenId: validation.token!.id,
                    customerId: validation.token!.customerId,
                    claimType: validation.token!.claimType,
                },
                ip_address: ipAddress,
                user_agent: userAgent,
                created_at: new Date().toISOString(),
                success: true,
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
            }).insert(auditLogInsert);
        } catch (auditError) {
            // Don't fail the request if audit logging fails
            console.error('[TOKEN_VALIDATION] Audit log failed:', auditError);
        }

        // Return validated token data (without sensitive info)
        return NextResponse.json({
            valid: true,
            data: {
                customerEmail: validation.token!.customerEmail,
                customerPhone: validation.token!.customerPhone,
                customerId: validation.token!.customerId,
                policyNumber: validation.token!.policyNumber,
                expiresAt: validation.token!.expiresAt,
                claimType: validation.token!.claimType,
            },
        });
    } catch (error) {
        console.error('[TOKEN_VALIDATION_ERROR]', error);

        // Log error to audit if possible
        try {
            const rawIpHeader = request.headers.get('x-forwarded-for');
            const ipAddress = validateAndExtractIp(rawIpHeader);
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                action: 'token_validation_error',
                details: {
                    error: 'Validation process failed',
                },
                ip_address: ipAddress,
                created_at: new Date().toISOString(),
                success: false,
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
            }).insert(auditLogInsert);
        } catch (auditError) {
            console.error('[TOKEN_VALIDATION] Audit log failed:', auditError);
        }

        // Don't expose internal error details
        return NextResponse.json(
            { valid: false, error: 'Validation failed. Please try again.' },
            { status: 500 }
        );
    }
}
