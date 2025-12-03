// =============================================
// FILE: app/api/complaints/route.ts
// Complaint API Endpoints (REQ-56 to REQ-79)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/server/lib/supabase/client';
import { requireCsrfToken } from '@/server/lib/security/csrf';
import { logAuditEventFromRequest } from '@/server/lib/audit/logger';
import { EmailService } from '@/server/lib/services/email-service';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { Database } from '@/server/lib/types/database.types';

type ComplaintInsert = Database['public']['Tables']['complaints']['Insert'];
type ComplaintRow = Database['public']['Tables']['complaints']['Row'];

const BUCKET_NAME = 'complaint-attachments';

// POST: Create new complaint (REQ-56, REQ-59-62)
export async function POST(request: NextRequest) {
    try {
        // Verify CSRF token
        const csrfCheck = await requireCsrfToken(request);
        if (!csrfCheck.valid) {
            return NextResponse.json(
                { error: csrfCheck.error || 'CSRF token validation failed' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = (formData.get('phone') as string) || '';
        const category = formData.get('category') as string;
        const priority = (formData.get('priority') as string) || 'medium';
        const description = formData.get('description') as string;
        const assessmentReference = formData.get('assessmentReference') as
            | string
            | null;
        const submitTimeSeconds = parseFloat(
            (formData.get('submitTimeSeconds') as string) || '0'
        );
        const attachments = formData.getAll('attachments') as File[];

        // Validation
        if (!name || !email || !category || !description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Description length validation
        if (description.trim().length < 10) {
            return NextResponse.json(
                { error: 'Description must be at least 10 characters' },
                { status: 400 }
            );
        }

        // Time-based validation (REQ-88)
        if (submitTimeSeconds < 10) {
            return NextResponse.json(
                { error: 'Form submission too fast' },
                { status: 400 }
            );
        }

        if (submitTimeSeconds > 24 * 60 * 60) {
            return NextResponse.json(
                { error: 'Form session expired' },
                { status: 400 }
            );
        }

        // Use service role client to bypass RLS (we have CSRF and validation)
        const serverClient = createServerClient();

        // Find assessment if reference provided (REQ-74)
        let assessmentId: string | null = null;
        if (assessmentReference) {
            const { data: assessment } = (await serverClient
                .from('assessments')
                .select('id')
                .or(
                    `id.eq.${assessmentReference},claim_reference.eq.${assessmentReference}`
                )
                .single()) as { data: { id: string } | null };

            if (assessment) {
                assessmentId = assessment.id;
            }
        }

        // Create complaint (complaint number and SLA deadline set by database triggers)
        const complaintData: ComplaintInsert = {
            complainant_name: name.trim(),
            complainant_email: email.trim().toLowerCase(),
            complainant_phone: phone.trim() || null,
            category: category as ComplaintInsert['category'],
            priority: priority as ComplaintInsert['priority'],
            description: description.trim(),
            assessment_id: assessmentId,
            status: 'new',
            metadata: {
                submitTimeSeconds,
                ipAddress:
                    validateAndExtractIp(
                        request.headers.get('x-forwarded-for')
                    ) || undefined,
                userAgent: request.headers.get('user-agent') || undefined,
            },
        };

        const { data: complaint, error: insertError } = await (
            serverClient.from('complaints') as unknown as {
                insert: (values: ComplaintInsert[]) => {
                    select: () => {
                        single: () => Promise<{
                            data: ComplaintRow | null;
                            error: { message: string } | null;
                        }>;
                    };
                };
            }
        )
            .insert([complaintData])
            .select()
            .single();

        if (insertError || !complaint) {
            console.error('[COMPLAINT] Insert error:', insertError);
            return NextResponse.json(
                {
                    error: 'Failed to create complaint',
                    details: insertError?.message || 'Unknown error',
                },
                { status: 500 }
            );
        }

        // Upload attachments (REQ-62)
        if (attachments.length > 0) {
            console.log(
                '[COMPLAINT] Starting upload of',
                attachments.length,
                'attachment(s)'
            );
            for (const file of attachments) {
                try {
                    const fileExt = file.name.split('.').pop() || 'bin';
                    const fileName = `${complaint.id}/${Date.now()}_${
                        file.name
                    }`;
                    const fileBuffer = await file.arrayBuffer();

                    console.log(
                        '[COMPLAINT] Uploading file:',
                        file.name,
                        'Size:',
                        file.size,
                        'Type:',
                        file.type
                    );

                    const { data: uploadData, error: uploadError } =
                        await serverClient.storage
                            .from(BUCKET_NAME)
                            .upload(fileName, fileBuffer, {
                                contentType: file.type,
                                upsert: false,
                            });

                    if (uploadError) {
                        console.error(
                            '[COMPLAINT] File upload error:',
                            uploadError,
                            'File:',
                            file.name
                        );
                        continue; // Skip this file
                    }

                    console.log(
                        '[COMPLAINT] File uploaded successfully to storage:',
                        fileName
                    );

                    // Save attachment record
                    const { data: insertedAttachment, error: insertError } =
                        await (
                            serverClient.from(
                                'complaint_attachments'
                            ) as unknown as {
                                insert: (values: {
                                    complaint_id: string;
                                    file_name: string;
                                    file_size: number;
                                    file_type: string;
                                    storage_path: string;
                                    uploaded_by?: string | null;
                                }) => {
                                    select: () => {
                                        single: () => Promise<{
                                            data:
                                                | Database['public']['Tables']['complaint_attachments']['Row']
                                                | null;
                                            error: { message: string } | null;
                                        }>;
                                    };
                                };
                            }
                        )
                            .insert({
                                complaint_id: complaint.id,
                                file_name: file.name,
                                file_size: file.size,
                                file_type: file.type,
                                storage_path: fileName,
                            })
                            .select()
                            .single();

                    if (insertError) {
                        console.error(
                            '[COMPLAINT] Error saving attachment record:',
                            insertError
                        );
                        console.error(
                            '[COMPLAINT] Insert error details:',
                            JSON.stringify(insertError, null, 2)
                        );
                    } else if (insertedAttachment) {
                        console.log(
                            '[COMPLAINT] Successfully saved attachment record:',
                            insertedAttachment.id,
                            'File:',
                            file.name
                        );
                    } else {
                        console.error(
                            '[COMPLAINT] No data returned from insert, but no error either'
                        );
                    }
                } catch (fileError) {
                    console.error(
                        '[COMPLAINT] File upload exception:',
                        fileError
                    );
                    if (fileError instanceof Error) {
                        console.error(
                            '[COMPLAINT] Error stack:',
                            fileError.stack
                        );
                    }
                    // Continue with other files
                }
            }
            console.log('[COMPLAINT] Finished processing attachments');
        } else {
            console.log('[COMPLAINT] No attachments to upload');
        }

        // Send auto-acknowledgment email (REQ-63)
        try {
            await EmailService.sendEmail({
                to: email,
                subject: `Complaint Received - ${complaint.complaint_number}`,
                html: `
                    <h2>Complaint Received</h2>
                    <p>Dear ${name},</p>
                    <p>Thank you for contacting us. We have received your complaint and assigned it the following reference number:</p>
                    <p style="font-size: 18px; font-weight: bold; color: #f59e0b;">${
                        complaint.complaint_number
                    }</p>
                    <p>We will investigate your complaint and respond within the timeframe based on the priority level you selected.</p>
                    <p>You can track the status of your complaint at: <a href="${
                        process.env.NEXT_PUBLIC_APP_URL ||
                        'https://crashify.com.au'
                    }/complaint/track?number=${
                        complaint.complaint_number
                    }">Track Complaint</a></p>
                    <p>Best regards,<br>Crashify Team</p>
                `,
            });
        } catch (emailError) {
            console.error('[COMPLAINT] Email send error:', emailError);
            // Don't fail the request if email fails
        }

        // REQ-117: Notify admins of new complaint
        try {
            const { notifyAdmins } = await import(
                '@/server/lib/services/notification-service'
            );
            await notifyAdmins('complaint_new', {
                title: 'New Complaint Received',
                message: `A new ${priority} priority complaint has been submitted by ${name} (${email}): ${complaint.complaint_number}`,
                resourceType: 'complaint',
                resourceId: complaint.id,
                metadata: {
                    complaintNumber: complaint.complaint_number,
                    category,
                    priority,
                    complainantName: name,
                },
            });
        } catch (notifyError) {
            console.error(
                '[COMPLAINT] Notification error (non-critical):',
                notifyError
            );
        }

        // Log audit event
        await logAuditEventFromRequest(request, {
            action: 'complaints.create' as unknown as Parameters<
                typeof logAuditEventFromRequest
            >[1]['action'],
            resourceType: 'complaint',
            resourceId: complaint.id,
            details: {
                complaintNumber: complaint.complaint_number,
                category,
                priority,
            },
            success: true,
        });

        return NextResponse.json({
            success: true,
            complaintNumber: complaint.complaint_number,
            id: complaint.id,
        });
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create complaint',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET: List complaints (admin only)
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const { getSession } = await import('@/server/lib/auth/session');
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use service role client to bypass RLS for admin access
        const serverClient = createServerClient();
        const searchParams = request.nextUrl.searchParams;

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Filters
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const category = searchParams.get('category');

        // Build query
        let query = serverClient
            .from('complaints')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }
        if (priority) {
            query = query.eq('priority', priority);
        }
        if (category) {
            query = query.eq('category', category);
        }

        // Apply pagination
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            return NextResponse.json(
                {
                    error: 'Failed to fetch complaints',
                    details: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: data || [],
            pagination: {
                page,
                pageSize,
                total: count || 0,
                totalPages: count ? Math.ceil(count / pageSize) : 0,
            },
        });
    } catch (error) {
        console.error('[COMPLAINT] List error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch complaints',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
