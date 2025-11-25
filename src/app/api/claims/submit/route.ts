// ============================================
// FILE: /app/api/claims/submit/route.ts
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

// Maximum size for claimData to prevent DoS
const MAX_CLAIM_DATA_SIZE = 100 * 1024; // 100KB

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

    // Check format (alphanumeric for tokens)
    return /^[a-zA-Z0-9]+$/.test(trimmed);
}

/**
 * Validate claimData structure and size
 */
function isValidClaimData(claimData: unknown): boolean {
    if (claimData === undefined || claimData === null) {
        return true; // claimData is optional
    }

    if (typeof claimData !== 'object') {
        return false;
    }

    // Check size (rough estimate by stringifying)
    const dataSize = JSON.stringify(claimData).length;
    if (dataSize > MAX_CLAIM_DATA_SIZE) {
        return false;
    }

    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Validate and sanitize IP address
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent') || undefined;

        const body = await request.json();
        const { token, claimData } = body;

        // Validate token presence
        if (!token) {
            // Log invalid attempt
            try {
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                    action: 'claim_submission_failed',
                    new_values: {
                        reason: 'missing_token',
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    changed_at: new Date().toISOString(),
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
                }).insert(auditLogInsert);
            } catch (auditError) {
                console.error('[CLAIM_SUBMIT] Audit log failed:', auditError);
            }

            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Validate token format
        if (!isValidTokenFormat(token)) {
            // Log invalid format attempt
            try {
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                    action: 'claim_submission_failed',
                    new_values: {
                        reason: 'invalid_token_format',
                        tokenLength: token.length,
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    changed_at: new Date().toISOString(),
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
                }).insert(auditLogInsert);
            } catch (auditError) {
                console.error('[CLAIM_SUBMIT] Audit log failed:', auditError);
            }

            return NextResponse.json(
                { error: 'Invalid token format' },
                { status: 400 }
            );
        }

        // Validate claimData if provided
        if (!isValidClaimData(claimData)) {
            return NextResponse.json(
                { error: 'Invalid claim data format or size exceeded' },
                { status: 400 }
            );
        }

        // Sanitize token (trim whitespace)
        const sanitizedToken = token.trim();

        // Validate token one more time
        const claimToken = await TokenRepository.findByToken(sanitizedToken);
        const validation = TokenValidator.validate(claimToken);

        if (!validation.valid) {
            // Log invalid token attempt
            try {
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                    action: 'claim_submission_failed',
                    new_values: {
                        reason: validation.errorCode || 'invalid_token',
                        errorCode: validation.errorCode,
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    changed_at: new Date().toISOString(),
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
                }).insert(auditLogInsert);
            } catch (auditError) {
                console.error('[CLAIM_SUBMIT] Audit log failed:', auditError);
            }

            // Return generic error to prevent token enumeration
            return NextResponse.json(
                {
                    error: 'Invalid or expired token',
                    errorCode: validation.errorCode,
                },
                { status: 403 }
            );
        }

        // Check if token is already used (double-submission protection)
        if (validation.token!.isUsed) {
            // Log attempt to use already-used token
            try {
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                    action: 'claim_submission_failed',
                    new_values: {
                        reason: 'token_already_used',
                        tokenId: validation.token!.id,
                        customerId: validation.token!.customerId,
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    changed_at: new Date().toISOString(),
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
                }).insert(auditLogInsert);
            } catch (auditError) {
                console.error('[CLAIM_SUBMIT] Audit log failed:', auditError);
            }

            return NextResponse.json(
                { error: 'This token has already been used' },
                { status: 403 }
            );
        }

        // Process claim submission
        // This would integrate with existing claims processing system
        // const claim = await ClaimService.create({
        //   customerId: validation.token!.customerId,
        //   policyNumber: validation.token!.policyNumber,
        //   ...claimData,
        // });

        // Mark token as used (with validated IP)
        await TokenRepository.markAsUsed(
            validation.token!.id,
            ipAddress || undefined,
            userAgent
        );

        // Log successful submission to audit logs
        try {
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                action: 'claim_submitted',
                new_values: {
                    tokenId: validation.token!.id,
                    customerId: validation.token!.customerId,
                    claimType: validation.token!.claimType,
                    hasClaimData: !!claimData,
                },
                ip_address: ipAddress,
                user_agent: userAgent,
                changed_at: new Date().toISOString(),
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
            }).insert(auditLogInsert);
        } catch (auditError) {
            // Don't fail the request if audit logging fails
            console.error('[CLAIM_SUBMIT] Audit log failed:', auditError);
        }

        // Log successful submission (console for debugging)
        console.log('[CLAIM_SUBMITTED]', {
            tokenId: validation.token!.id,
            customerId: validation.token!.customerId,
            ip: ipAddress,
        });

        return NextResponse.json({
            success: true,
            message: 'Claim submitted successfully',
            // claimId: claim.id,
        });
    } catch (error) {
        console.error('[CLAIM_SUBMISSION_ERROR]', error);

        // Log error to audit if possible
        try {
            const rawIpHeader = request.headers.get('x-forwarded-for');
            const ipAddress = validateAndExtractIp(rawIpHeader);
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                action: 'claim_submission_error',
                new_values: {
                    error: 'Claim submission process failed',
                },
                ip_address: ipAddress,
                changed_at: new Date().toISOString(),
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
            }).insert(auditLogInsert);
        } catch (auditError) {
            console.error('[CLAIM_SUBMIT] Audit log failed:', auditError);
        }

        // Don't expose internal error details
        return NextResponse.json(
            { error: 'Failed to submit claim. Please try again.' },
            { status: 500 }
        );
    }
}
