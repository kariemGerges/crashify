// =============================================
// FILE: app/api/assessments/[id]/send-emails/route.ts
// POST: Send emails to repairer and insurance with PDF attachments
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { Database } from '@/server/lib/types/database.types';
import { Resend } from 'resend';
import { revalidateTag } from 'next/cache';
import JSZip from 'jszip';

type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];
type UploadedFileRow = Database['public']['Tables']['uploaded_files']['Row'];
type EmailLogInsert = {
    assessment_id: string;
    recipient_type: string;
    recipient_email: string;
    recipient_name: string | null;
    subject: string;
    body_html: string;
    sent_at?: string;
    attachments?: Array<{ filename: string }>;
    status?: string;
    message_id?: string | null;
    [key: string]: unknown;
};
type AssessmentRow = Database['public']['Tables']['assessments']['Row'] & { assessed_quote?: unknown };

const BUCKET_NAME = 'Assessment-photos';

export const runtime = 'nodejs';

// Initialize Resend
const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('RESEND_API_KEY environment variable is required');
    }
    return new Resend(apiKey);
};

// POST: Send emails with attachments
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createServerClient();
    const rawIpHeader = request.headers.get('x-forwarded-for');
    const ipAddress = validateAndExtractIp(rawIpHeader);
    const userAgent = request.headers.get('user-agent');

    try {
        const { id: assessmentId } = await params;

        // Validate assessment ID
        if (
            !assessmentId ||
            typeof assessmentId !== 'string' ||
            assessmentId.length < 10
        ) {
            return NextResponse.json(
                { error: 'Invalid assessment ID' },
                { status: 400 }
            );
        }

        // Verify assessment exists
        const { data: assessment, error: assessmentError } = (await supabase
            .from('assessments')
            .select('*')
            .eq('id', assessmentId)
            .is('deleted_at', null)
            .single()) as { data: AssessmentRow | null; error: unknown };

        if (assessmentError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Parse form data
        const formData = await request.formData();

        // Get document files
        const repairAuthorityFile = formData.get('repair_authority') as File | null;
        const assessedQuoteFile = formData.get('assessed_quote') as File | null;
        const assessmentReportFile = formData.get('assessment_report') as File | null;

        // Get email addresses
        const repairerEmail = formData.get('repairer_email') as string;
        const repairerName = formData.get('repairer_name') as string || '';
        const insuranceEmail = formData.get('insurance_email') as string;
        const insuranceName = formData.get('insurance_name') as string || '';
        const additionalNotes = formData.get('additional_notes') as string || '';

        // Validate at least one document and one email
        if (!repairAuthorityFile && !assessmentReportFile) {
            return NextResponse.json(
                { error: 'Please upload at least Repair Authority or Assessment Report' },
                { status: 400 }
            );
        }

        if (!repairerEmail && !insuranceEmail) {
            return NextResponse.json(
                { error: 'Please provide at least one recipient email address' },
                { status: 400 }
            );
        }

        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (repairerEmail && !emailRegex.test(repairerEmail)) {
            return NextResponse.json(
                { error: 'Invalid repairer email address' },
                { status: 400 }
            );
        }
        if (insuranceEmail && !emailRegex.test(insuranceEmail)) {
            return NextResponse.json(
                { error: 'Invalid insurance email address' },
                { status: 400 }
            );
        }

        const resend = getResendClient();
        const fromEmail = process.env.RESEND_EMAIL_FROM || 'info@crashify.com.au';
        const results: Array<{ recipient: string; success: boolean; error?: string }> = [];

        // Prepare vehicle info for email templates
        const vehicleDisplay = `${assessment.make} ${assessment.model}${assessment.year ? ` (${assessment.year})` : ''}${assessment.registration ? ` - ${assessment.registration}` : ''}`;

        // Send email to repairer (if provided)
        if (repairerEmail && (repairAuthorityFile || assessedQuoteFile)) {
            try {
                const attachments: Array<{ filename: string; content: Buffer }> = [];

                if (repairAuthorityFile) {
                    const buffer = Buffer.from(await repairAuthorityFile.arrayBuffer());
                    attachments.push({
                        filename: repairAuthorityFile.name || 'Repair_Authority.pdf',
                        content: buffer,
                    });
                }

                if (assessedQuoteFile) {
                    const buffer = Buffer.from(await assessedQuoteFile.arrayBuffer());
                    attachments.push({
                        filename: assessedQuoteFile.name || 'Assessed_Quote.pdf',
                        content: buffer,
                    });
                }

                const repairerEmailBody = generateRepairerEmailBody(
                    assessment,
                    vehicleDisplay,
                    additionalNotes
                );

                const repairerResponse = await resend.emails.send({
                    from: fromEmail,
                    to: repairerEmail,
                    subject: `Repair Authority - ${vehicleDisplay}`,
                    html: repairerEmailBody,
                    attachments: attachments.length > 0 ? attachments : undefined,
                });

                if (repairerResponse.error) {
                    results.push({
                        recipient: repairerEmail,
                        success: false,
                        error: repairerResponse.error.message,
                    });
                } else {
                    results.push({
                        recipient: repairerEmail,
                        success: true,
                    });

                    // Log email to email_logs table
                    try {
                        await (supabase.from('email_logs') as unknown as {
                            insert: (values: EmailLogInsert[]) => Promise<unknown>;
                        }).insert([{
                            assessment_id: assessmentId,
                            recipient_type: 'repairer',
                            recipient_email: repairerEmail,
                            recipient_name: repairerName || null,
                            subject: `Repair Authority - ${vehicleDisplay}`,
                            body_html: repairerEmailBody,
                            attachments: attachments.map(a => ({ filename: a.filename })),
                            status: 'sent',
                            message_id: repairerResponse.data?.id || null,
                        }]);
                    } catch (logError) {
                        console.error('[SEND_EMAILS] Failed to log repairer email:', logError);
                    }
                }
            } catch (err) {
                results.push({
                    recipient: repairerEmail,
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        // Send email to insurance (if provided)
        if (insuranceEmail && assessmentReportFile) {
            try {
                const attachments: Array<{ filename: string; content: Buffer }> = [];

                // Add assessment report
                const reportBuffer = Buffer.from(await assessmentReportFile.arrayBuffer());
                attachments.push({
                    filename: assessmentReportFile.name || 'Assessment_Report.pdf',
                    content: reportBuffer,
                });

                // Create photos ZIP if photos exist
                const { data: photoFiles } = await supabase
                    .from('uploaded_files')
                    .select('*')
                    .eq('assessment_id', assessmentId)
                    .like('file_type', 'image/%')
                    .order('uploaded_at', { ascending: true });

                if (photoFiles && photoFiles.length > 0) {
                    const zip = new JSZip();

                    for (let i = 0; i < photoFiles.length; i++) {
                        const file = photoFiles[i] as UploadedFileRow;
                        try {
                            const { data: fileData } = await supabase.storage
                                .from(BUCKET_NAME)
                                .download(file.storage_path);

                            if (fileData) {
                                const arrayBuffer = await fileData.arrayBuffer();
                                const index = String(i + 1).padStart(3, '0');
                                const fileExt = file.file_name.split('.').pop() || 'jpg';
                                zip.file(`IMG_${index}.${fileExt}`, arrayBuffer);
                            }
                        } catch (err) {
                            console.error(`Failed to add photo ${file.file_name} to ZIP:`, err);
                        }
                    }

                    if (Object.keys(zip.files).length > 0) {
                        const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });
                        attachments.push({
                            filename: `CarDamage_${assessmentId}.zip`,
                            content: zipBlob,
                        });
                    }
                }

                const insuranceEmailBody = generateInsuranceEmailBody(
                    assessment,
                    vehicleDisplay,
                    additionalNotes
                );

                const insuranceResponse = await resend.emails.send({
                    from: fromEmail,
                    to: insuranceEmail,
                    subject: `Assessment Report - Claim ${assessment.claim_reference || assessmentId}`,
                    html: insuranceEmailBody,
                    attachments: attachments.length > 0 ? attachments : undefined,
                });

                if (insuranceResponse.error) {
                    results.push({
                        recipient: insuranceEmail,
                        success: false,
                        error: insuranceResponse.error.message,
                    });
                } else {
                    results.push({
                        recipient: insuranceEmail,
                        success: true,
                    });

                    // Log email to email_logs table
                    try {
                        await (supabase.from('email_logs') as unknown as {
                            insert: (values: EmailLogInsert[]) => Promise<unknown>;
                        }).insert([{
                            assessment_id: assessmentId,
                            recipient_type: 'insurer',
                            recipient_email: insuranceEmail,
                            recipient_name: insuranceName || null,
                            subject: `Assessment Report - Claim ${assessment.claim_reference || assessmentId}`,
                            body_html: insuranceEmailBody,
                            attachments: attachments.map(a => ({ filename: a.filename })),
                            status: 'sent',
                            message_id: insuranceResponse.data?.id || null,
                        }]);
                    } catch (logError) {
                        console.error('[SEND_EMAILS] Failed to log insurance email:', logError);
                    }
                }
            } catch (err) {
                results.push({
                    recipient: insuranceEmail,
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        // Update assessment status to completed
        await (supabase
            .from('assessments') as unknown as {
                update: (values: Database['public']['Tables']['assessments']['Update']) => {
                    eq: (column: string, value: string) => Promise<unknown>;
                };
            }
        )
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', assessmentId);

        // REQ-120: Notify client of status change
        try {
            const { notifyClient } = await import('@/server/lib/services/notification-service');
            await notifyClient(assessment.your_email, 'status_change', {
                title: 'Assessment Completed',
                message: `Your assessment has been completed. Reports and documents have been sent to the relevant parties.`,
                assessmentId: assessmentId,
                status: 'completed',
            });
        } catch (notifyError) {
            console.error('[SEND_EMAILS] Notification error (non-critical):', notifyError);
        }

        // Log audit event
        try {
            const auditLogInsert: AuditLogInsert = {
                action: 'emails_sent',
                resource_type: 'assessment',
                resource_id: assessmentId,
                details: {
                    old_status: assessment.status,
                    new_status: 'completed',
                    emails_sent: results,
                },
                ip_address: ipAddress || undefined,
                user_agent: userAgent || undefined,
                created_at: new Date().toISOString(),
                success: true,
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: AuditLogInsert[]) => Promise<unknown>;
            }).insert([auditLogInsert]);
        } catch (auditError) {
            console.error('[SEND_EMAILS] Audit log failed:', auditError);
        }

        // Invalidate cache
        await revalidateTag('assessment', 'default');
        await revalidateTag('assessments-list', 'default');

        const allSuccessful = results.every(r => r.success);
        const hasErrors = results.some(r => !r.success);

        return NextResponse.json({
            success: allSuccessful,
            results,
            message: allSuccessful
                ? 'All emails sent successfully'
                : hasErrors
                  ? 'Some emails failed to send'
                  : 'No emails were sent',
        });
    } catch (error) {
        console.error('[SEND_EMAILS] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send emails',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Generate repairer email body
function generateRepairerEmailBody(
    assessment: AssessmentRow,
    vehicleDisplay: string,
    additionalNotes: string
): string {
    const ownerInfo = assessment.owner_info as Record<string, unknown> | null;
    const ownerName = ownerInfo
        ? `${(ownerInfo.firstName as string) || ''} ${(ownerInfo.lastName as string) || ''}`.trim()
        : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f6f8; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
        .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9fafb; }
        .info-box { background: white; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { padding: 20px; text-align: center; color: #6B7280; font-size: 12px; background: #ffffff; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Repair Authority</h1>
        </div>
        <div class="content">
            <p>Dear ${ownerName || 'Team'},</p>
            <p>Please find attached the repair authority and assessed quote for:</p>
            <div class="info-box">
                <p><strong>Vehicle:</strong> ${vehicleDisplay}</p>
                ${assessment.claim_reference ? `<p><strong>Claim:</strong> ${assessment.claim_reference}</p>` : ''}
                <p><strong>Assessment #:</strong> ${assessment.id}</p>
                <p><strong>Insurer:</strong> ${assessment.company_name}</p>
            </div>
            <p><strong>Attached Documents:</strong></p>
            <ul>
                <li>Repair Authority.pdf</li>
                ${assessment.assessed_quote ? '<li>Assessed Quote.pdf</li>' : ''}
            </ul>
            <p>Please proceed with authorized repairs as detailed.</p>
            ${additionalNotes ? `<div class="info-box"><p><strong>Additional Notes:</strong></p><p>${additionalNotes.replace(/\n/g, '<br>')}</p></div>` : ''}
            <p>If you have any questions, please contact:</p>
            <p>
                <strong>Fady Tadros</strong><br>
                Crashify Pty Ltd<br>
                Mobile: 0426 000 910<br>
                Email: info@crashify.com.au
            </p>
            <p>Kind regards,<br>Crashify Assessment Team</p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} Crashify Pty Ltd. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

// Generate insurance email body
function generateInsuranceEmailBody(
    assessment: AssessmentRow,
    vehicleDisplay: string,
    additionalNotes: string
): string {
    const ownerInfo = assessment.owner_info as Record<string, unknown> | null;
    const ownerName = ownerInfo
        ? `${(ownerInfo.firstName as string) || ''} ${(ownerInfo.lastName as string) || ''}`.trim()
        : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f6f8; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
        .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9fafb; }
        .info-box { background: white; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { padding: 20px; text-align: center; color: #6B7280; font-size: 12px; background: #ffffff; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Assessment Report</h1>
        </div>
        <div class="content">
            <p>Dear ${assessment.your_name || 'Team'},</p>
            <p>Please find attached the complete assessment report${assessment.claim_reference ? ` for claim ${assessment.claim_reference}` : ''}.</p>
            <div class="info-box">
                <h3 style="margin-top: 0; color: #DC2626;">ASSESSMENT SUMMARY</h3>
                <p><strong>Vehicle:</strong> ${vehicleDisplay}</p>
                ${assessment.registration ? `<p><strong>Registration:</strong> ${assessment.registration}</p>` : ''}
                ${assessment.claim_reference ? `<p><strong>Claim:</strong> ${assessment.claim_reference}</p>` : ''}
                <p><strong>Assessment #:</strong> ${assessment.id}</p>
                <p><strong>Assessment Date:</strong> ${new Date(assessment.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                ${ownerName ? `<p><strong>Insured:</strong> ${ownerName}</p>` : ''}
                ${assessment.incident_description ? `<p><strong>Incident:</strong> ${assessment.incident_description}</p>` : ''}
            </div>
            <p><strong>ATTACHED DOCUMENTS</strong></p>
            <ul>
                <li>Full Assessment Report.pdf</li>
                <li>Damage Photos.zip (if applicable)</li>
            </ul>
            <p><strong>NEXT STEPS</strong></p>
            <p>Repair authority has been issued to the repairer. Estimated completion: 12-14 working days.</p>
            ${additionalNotes ? `<div class="info-box"><p><strong>Additional Notes:</strong></p><p>${additionalNotes.replace(/\n/g, '<br>')}</p></div>` : ''}
            <p>Please contact me if you require any additional information or clarification.</p>
            <p>Kind regards,</p>
            <p>
                <strong>Fady Tadros</strong><br>
                Director / Motor Vehicle Assessor<br>
                Crashify Pty Ltd<br>
                ABN: 82 676 363 116<br><br>
                Mobile: 0426 000 910<br>
                Email: info@crashify.com.au<br>
                Website: www.crashify.com.au
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} Crashify Pty Ltd. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

