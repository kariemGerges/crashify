// =============================================
// FILE: app/api/review-queue/route.ts
// Manual Review Queue API (REQ-107-114)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { EmailService } from '@/server/lib/services/email-service';
import type { Database } from '@/server/lib/types/database.types';

type ReviewQueueInsert = Database['public']['Tables']['review_queue']['Insert'];

// POST: Add item to review queue
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            assessmentId,
            quoteRequestId,
            spamScore,
            recaptchaScore,
            reviewReason,
        } = body;

        if (!reviewReason) {
            return NextResponse.json(
                { error: 'Review reason is required' },
                { status: 400 }
            );
        }

        // Use service role client to bypass RLS
        const serverClient = createServerClient();

        const queueData: ReviewQueueInsert = {
            assessment_id: assessmentId || null,
            quote_request_id: quoteRequestId || null,
            spam_score: spamScore || 0,
            recaptcha_score: recaptchaScore || null,
            review_reason: reviewReason,
            status: 'pending',
        };

        const { data: queueItem, error: insertError } = await (
            serverClient.from('review_queue') as unknown as {
                insert: (values: ReviewQueueInsert[]) => {
                    select: () => {
                        single: () => Promise<{
                            data: Database['public']['Tables']['review_queue']['Row'] | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert([queueData])
            .select()
            .single();

        if (insertError || !queueItem) {
            return NextResponse.json(
                {
                    error: 'Failed to add item to review queue',
                    details: insertError?.message || 'Unknown error',
                },
                { status: 500 }
            );
        }

        // REQ-114: Notify admins when new item in queue
        try {
            const { notifyAdmins } = await import('@/server/lib/services/notification-service');
            await notifyAdmins('system_error', {
                title: 'New Item in Review Queue',
                message: `A new item has been added to the review queue. Reason: ${reviewReason}. Spam Score: ${spamScore || 0}/100${recaptchaScore ? `. reCAPTCHA Score: ${recaptchaScore}` : ''}.`,
                resourceType: 'review_queue',
                resourceId: queueItem.id,
                metadata: {
                    reviewReason,
                    spamScore: spamScore || 0,
                    recaptchaScore: recaptchaScore || null,
                },
            });
        } catch (notifyError) {
            console.error('[REVIEW_QUEUE] Notification error:', notifyError);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({
            success: true,
            queueItem,
        });
    } catch (error) {
        console.error('[REVIEW_QUEUE] Create error:', error);
        return NextResponse.json(
            {
                error: 'Failed to add item to review queue',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET: List review queue items
export async function GET(request: NextRequest) {
    try {
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use service role client to bypass RLS (we've already verified user is authenticated)
        const serverClient = createServerClient();

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const assignedTo = searchParams.get('assignedTo');

        let query = serverClient
            .from('review_queue')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (assignedTo) {
            query = query.eq('assigned_to', assignedTo);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[REVIEW_QUEUE] Query error:', error);
            console.error('[REVIEW_QUEUE] Error details:', JSON.stringify(error, null, 2));
            return NextResponse.json(
                { 
                    error: 'Failed to fetch review queue',
                    details: error.message || 'Unknown database error',
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: data || [],
        });
    } catch (error) {
        console.error('[REVIEW_QUEUE] List error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch review queue',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

