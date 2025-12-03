// =============================================
// FILE: app/api/cron/check-overdue/route.ts
// Check for overdue assessments and notify admins (REQ-116)
// Runs daily to check for overdue assessments
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { notifyAdmins } from '@/server/lib/services/notification-service';
import { validateAndExtractIp } from '@/server/lib/utils/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET/POST: Check for overdue assessments
 * This endpoint is called by Vercel Cron Jobs daily
 */
export async function GET(request: NextRequest) {
    return handleCronRequest(request);
}

export async function POST(request: NextRequest) {
    return handleCronRequest(request);
}

async function handleCronRequest(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || process.env.EMAIL_PROCESSOR_TOKEN;
        
        if (authHeader !== `Bearer ${cronSecret}`) {
            const cronHeader = request.headers.get('x-vercel-cron');
            if (!cronHeader && !cronSecret) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        }

        console.log('[CRON_CHECK_OVERDUE] Starting overdue assessment check...');

        const supabase = createServerClient();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find overdue assessments (older than 7 days, still pending/processing)
        const { data: overdueAssessments, error } = await (
            supabase.from('assessments') as unknown as {
                select: (columns: string) => {
                    in: (column: string, values: string[]) => {
                        lt: (column: string, value: string) => {
                            is: (column: string, value: null) => Promise<{
                                data: Array<{
                                    id: string;
                                    company_name: string;
                                    your_name: string;
                                    your_email: string;
                                    created_at: string;
                                    status: string;
                                }> | null;
                                error: { message: string } | null;
                            }>;
                        };
                    };
                };
            }
        )
            .select('id, company_name, your_name, your_email, created_at, status')
            .in('status', ['pending', 'processing'])
            .lt('created_at', sevenDaysAgo.toISOString())
            .is('deleted_at', null);

        if (error) {
            console.error('[CRON_CHECK_OVERDUE] Error:', error);
            return NextResponse.json(
                { error: 'Failed to check overdue assessments' },
                { status: 500 }
            );
        }

        const overdueCount = overdueAssessments?.length || 0;

        if (overdueCount > 0) {
            // REQ-116: Notify admins of overdue assessments
            await notifyAdmins('assessment_overdue', {
                title: `${overdueCount} Overdue Assessment(s) Detected`,
                message: `There are ${overdueCount} assessment(s) that are overdue (older than 7 days and still pending/processing). Please review and take action.`,
                resourceType: 'assessment',
                metadata: {
                    overdueCount,
                    assessments: overdueAssessments?.map(a => ({
                        id: a.id,
                        company: a.company_name,
                        name: a.your_name,
                        created: a.created_at,
                        status: a.status,
                    })),
                },
            });

            console.log(`[CRON_CHECK_OVERDUE] Found ${overdueCount} overdue assessment(s), admins notified`);
        } else {
            console.log('[CRON_CHECK_OVERDUE] No overdue assessments found');
        }

        return NextResponse.json({
            success: true,
            overdueCount,
            message: `Checked for overdue assessments. Found ${overdueCount} overdue.`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[CRON_CHECK_OVERDUE] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to check overdue assessments',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

