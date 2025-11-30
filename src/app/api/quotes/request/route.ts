// =============================================
// FILE: app/api/quotes/request/route.ts
// POST: Submit quote request from public form
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { SpamDetector } from '@/server/lib/services/spam-detector';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { Database } from '@/server/lib/types/database.types';

type QuoteRequestInsert = Database['public']['Tables']['quote_requests']['Insert'];
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

const BUCKET_NAME = 'Assessment-photos';

export const runtime = 'nodejs';

// POST: Submit quote request
export async function POST(request: NextRequest) {
    const supabase = createServerClient();
    const rawIpHeader = request.headers.get('x-forwarded-for');
    const ipAddress = validateAndExtractIp(rawIpHeader);
    const userAgent = request.headers.get('user-agent') || '';

    try {
        const formData = await request.formData();

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const vehicle = formData.get('vehicle') as string;
        const description = formData.get('description') as string;
        const submitTimeSeconds = parseFloat(formData.get('submitTimeSeconds') as string) || 0;
        const photos = formData.getAll('photos') as File[];

        // Validate required fields
        if (!name || !email || !phone || !vehicle || !description) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Validate description length
        if (description.trim().length < 10) {
            return NextResponse.json(
                { error: 'Description must be at least 10 characters' },
                { status: 400 }
            );
        }

        // Spam detection
        const spamCheck = SpamDetector.checkSpam({
            email,
            phone,
            name,
            description,
            photoCount: photos.length,
            submitTimeSeconds,
            ipAddress: ipAddress || undefined,
            userAgent,
        });

        // Auto-reject if spam
        if (spamCheck.action === 'auto_reject') {
            console.log('[QUOTE_REQUEST] Spam detected, auto-rejecting:', {
                email,
                spamScore: spamCheck.spamScore,
                flags: spamCheck.flags,
            });

            // Log spam attempt
            try {
                const auditLogInsert: AuditLogInsert = {
                    action: 'quote_request_spam_detected',
                    old_values: {},
                    new_values: {
                        email,
                        spamScore: spamCheck.spamScore,
                        flags: spamCheck.flags,
                        action: 'auto_reject',
                    },
                    ip_address: ipAddress || undefined,
                    user_agent: userAgent || undefined,
                    changed_at: new Date().toISOString(),
                };
                await (supabase.from('audit_logs') as unknown as {
                    insert: (values: AuditLogInsert[]) => Promise<unknown>;
                }).insert([auditLogInsert]);
            } catch (auditError) {
                console.error('[QUOTE_REQUEST] Failed to log spam attempt:', auditError);
            }

            return NextResponse.json(
                {
                    error: 'Submission rejected',
                    message: 'Your request could not be processed. Please contact us directly if you believe this is an error.',
                },
                { status: 403 }
            );
        }

        // Create quote request
        const quoteRequestData: QuoteRequestInsert = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            vehicle: vehicle.trim(),
            description: description.trim(),
            photo_count: photos.length,
            status: spamCheck.action === 'manual_review' ? 'pending_review' : 'pending_review', // Always review for now
            spam_score: spamCheck.spamScore,
            metadata: {
                submitTimeSeconds,
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined,
                flags: spamCheck.flags,
            },
        };

        const { data: quoteRequest, error: insertError } = await (
            supabase.from('quote_requests') as unknown as {
                insert: (values: QuoteRequestInsert[]) => {
                    select: () => {
                        single: () => Promise<{
                            data: { id: string } | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert([quoteRequestData])
            .select()
            .single();

        if (insertError || !quoteRequest) {
            console.error('[QUOTE_REQUEST] Insert error:', insertError);
            return NextResponse.json(
                {
                    error: 'Failed to submit request',
                    details: insertError?.message || 'Unknown error',
                },
                { status: 500 }
            );
        }

        // Upload photos if any
        if (photos.length > 0) {
            const quoteRequestId = quoteRequest.id;
            for (const photo of photos) {
                try {
                    // Validate file size (max 10MB)
                    if (photo.size > 10 * 1024 * 1024) {
                        console.error(`[QUOTE_REQUEST] Photo ${photo.name} exceeds 10MB limit`);
                        continue;
                    }

                    // Generate file path
                    const timestamp = Date.now();
                    const randomStr = Math.random().toString(36).substring(2, 9);
                    const fileExt = photo.name.split('.').pop() || 'jpg';
                    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
                    const filePath = `quote-requests/${quoteRequestId}/${fileName}`;

                    // Convert File to Buffer
                    const arrayBuffer = await photo.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Upload to Supabase Storage
                    const { error: uploadError } = await supabase.storage
                        .from(BUCKET_NAME)
                        .upload(filePath, buffer, {
                            cacheControl: '3600',
                            upsert: false,
                        });

                    if (uploadError) {
                        console.error(`[QUOTE_REQUEST] Failed to upload ${photo.name}:`, uploadError);
                        continue;
                    }

                    // Get public URL
                    const {
                        data: { publicUrl },
                    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

                    // Store photo reference in metadata (we'll use uploaded_files table later if needed)
                    // For now, just store the count
                } catch (err) {
                    console.error(`[QUOTE_REQUEST] Error processing photo ${photo.name}:`, err);
                }
            }
        }

        // Log successful submission
        try {
            const auditLogInsert: AuditLogInsert = {
                action: 'quote_request_submitted',
                old_values: {},
                new_values: {
                    quote_request_id: quoteRequest.id,
                    email,
                    spamScore: spamCheck.spamScore,
                },
                ip_address: ipAddress || undefined,
                user_agent: userAgent || undefined,
                changed_at: new Date().toISOString(),
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: AuditLogInsert[]) => Promise<unknown>;
            }).insert([auditLogInsert]);
        } catch (auditError) {
            console.error('[QUOTE_REQUEST] Failed to log submission:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: 'Quote request submitted successfully',
            quoteRequestId: quoteRequest.id,
        });
    } catch (error) {
        console.error('[QUOTE_REQUEST] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to submit quote request',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

