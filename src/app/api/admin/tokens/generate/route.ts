import { NextRequest, NextResponse } from 'next/server';
import { TokenRepository } from '@/server/lib/db/token-repository';
import { EmailService } from '@/server/lib/services/email-service';
import { SMSService } from '@/server/lib/services/Sms-service';
import { CreateTokenRequest } from '@/server/lib/types/claim-token';
import { getSession } from '@/server/lib/auth/session';
import {
    validateAndExtractIp,
    isValidEmail,
    sanitizeEmail,
} from '@/server/lib/utils/security';
import { validateAustralianPhone } from '@/server/lib/utils/validation';
import { supabase } from '@/server/lib/supabase/client';
import type { Database } from '@/server/lib/types/database.types';

// Maximum expiration time (7 days) to prevent abuse
const MAX_EXPIRES_IN_HOURS = 168;
const MIN_EXPIRES_IN_HOURS = 1;
const MAX_CUSTOMER_ID_LENGTH = 100;
const MAX_POLICY_NUMBER_LENGTH = 50;

export async function POST(request: NextRequest) {
    try {
        // 🔒 Authentication and Authorization Check
        const currentUser = await getSession();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Only admin and manager can generate tokens
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

        const body: CreateTokenRequest = await request.json();

        // Validate required fields
        if (!body.customerEmail || !body.customerPhone || !body.customerId) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: customerEmail, customerPhone, and customerId are required',
                },
                { status: 400 }
            );
        }

        // Validate email format and length
        if (!isValidEmail(body.customerEmail)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate phone number format (Australian)
        if (!validateAustralianPhone(body.customerPhone)) {
            return NextResponse.json(
                {
                    error: 'Invalid phone number format. Australian phone numbers required.',
                },
                { status: 400 }
            );
        }

        // Validate customerId
        if (
            typeof body.customerId !== 'string' ||
            body.customerId.trim().length === 0
        ) {
            return NextResponse.json(
                { error: 'Invalid customerId' },
                { status: 400 }
            );
        }

        if (body.customerId.length > MAX_CUSTOMER_ID_LENGTH) {
            return NextResponse.json(
                {
                    error: `customerId exceeds maximum length of ${MAX_CUSTOMER_ID_LENGTH} characters`,
                },
                { status: 400 }
            );
        }

        // Validate policyNumber if provided
        if (body.policyNumber !== undefined) {
            if (
                typeof body.policyNumber !== 'string' ||
                body.policyNumber.trim().length === 0
            ) {
                return NextResponse.json(
                    { error: 'Invalid policyNumber format' },
                    { status: 400 }
                );
            }
            if (body.policyNumber.length > MAX_POLICY_NUMBER_LENGTH) {
                return NextResponse.json(
                    {
                        error: `policyNumber exceeds maximum length of ${MAX_POLICY_NUMBER_LENGTH} characters`,
                    },
                    { status: 400 }
                );
            }
        }

        // Validate expiresInHours
        const expiresInHours = body.expiresInHours || 48;
        if (typeof expiresInHours !== 'number' || isNaN(expiresInHours)) {
            return NextResponse.json(
                { error: 'expiresInHours must be a valid number' },
                { status: 400 }
            );
        }

        if (
            expiresInHours < MIN_EXPIRES_IN_HOURS ||
            expiresInHours > MAX_EXPIRES_IN_HOURS
        ) {
            return NextResponse.json(
                {
                    error: `expiresInHours must be between ${MIN_EXPIRES_IN_HOURS} and ${MAX_EXPIRES_IN_HOURS} hours`,
                },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedEmail = sanitizeEmail(body.customerEmail);
        const sanitizedPhone = body.customerPhone.replace(/\s/g, '').trim();
        const sanitizedCustomerId = body.customerId.trim();
        const sanitizedPolicyNumber = body.policyNumber?.trim();

        // Create token with sanitized data
        const tokenRequest: CreateTokenRequest = {
            customerEmail: sanitizedEmail,
            customerPhone: sanitizedPhone,
            customerId: sanitizedCustomerId,
            policyNumber: sanitizedPolicyNumber,
            claimType: body.claimType,
            expiresInHours,
            metadata: body.metadata,
        };

        const claimToken = await TokenRepository.create(tokenRequest);

        // Generate claim link
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const claimLink = `${baseUrl}/pages/claims?access=${claimToken.token}`;

        // Send via email and/or SMS based on preference
        const sendEmail = body.metadata?.sendEmail !== false;
        const sendSMS = body.metadata?.sendSMS === true;

        // Track email/SMS sending errors but don't fail the request
        const errors: string[] = [];

        if (sendEmail) {
            try {
                await EmailService.sendClaimLink({
                    to: sanitizedEmail,
                    customerName: typeof body.metadata?.customerName === 'string' ? body.metadata.customerName : undefined,
                    claimLink,
                    expiresInHours,
                });
            } catch (error) {
                console.error('[TOKEN_GENERATION] Email send failed:', error);
                errors.push('Failed to send email');
            }
        }

        if (sendSMS) {
            try {
                await SMSService.sendClaimLink({
                    to: sanitizedPhone,
                    claimLink,
                    expiresInHours,
                });
            } catch (error) {
                console.error('[TOKEN_GENERATION] SMS send failed:', error);
                errors.push('Failed to send SMS');
            }
        }

        // Log the action to audit logs
        try {
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                changed_by: currentUser.id,
                action: 'token_generated',
                new_values: {
                    tokenId: claimToken.id,
                    customerId: sanitizedCustomerId,
                    customerEmail: sanitizedEmail.substring(0, 3) + '***', // Partial email for privacy
                    expiresInHours,
                    sendEmail,
                    sendSMS,
                },
                ip_address: ipAddress,
                user_agent: userAgent,
                changed_at: new Date().toISOString(),
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
            }).insert(auditLogInsert);
        } catch (auditError) {
            // Don't fail the request if audit logging fails, but log it
            console.error('[TOKEN_GENERATION] Audit log failed:', auditError);
        }

        // Log the action (console for debugging)
        console.log('[TOKEN_GENERATED]', {
            tokenId: claimToken.id,
            customerId: sanitizedCustomerId,
            expiresAt: claimToken.expiresAt,
            generatedBy: currentUser.id,
            ipAddress,
        });

        return NextResponse.json({
            success: true,
            token: {
                id: claimToken.id,
                expiresAt: claimToken.expiresAt,
            },
            link: claimLink,
            warnings: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('[TOKEN_GENERATION_ERROR]', error);

        // Log to audit if we have a user session
        try {
            const currentUser = await getSession();
            if (currentUser) {
                const rawIpHeader = request.headers.get('x-forwarded-for');
                const ipAddress = validateAndExtractIp(rawIpHeader);
                const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                    changed_by: currentUser.id,
                    action: 'token_generation_failed',
                    new_values: {
                        error: 'Token generation failed',
                    },
                    ip_address: ipAddress,
                    changed_at: new Date().toISOString(),
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: Database['public']['Tables']['audit_logs']['Insert']) => Promise<unknown>;
                }).insert(auditLogInsert);
            }
        } catch (auditError) {
            console.error('[TOKEN_GENERATION] Audit log failed:', auditError);
        }

        return NextResponse.json(
            { error: 'Failed to generate token. Please try again.' },
            { status: 500 }
        );
    }
}
