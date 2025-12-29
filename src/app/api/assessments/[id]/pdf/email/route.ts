// =============================================
// FILE: app/api/assessments/[id]/pdf/email/route.ts
// Send PDF report via email
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import { generatePDFReport } from '@/server/lib/utils/pdf-generators';
import { assessmentToPDFData } from '@/server/lib/utils/assessment-to-pdf-data';
import { Resend } from 'resend';
import type { PDFReportType } from '@/server/lib/types/pdf-report.types';

// Get email configuration (same as EmailService uses)
function getEmailConfig() {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_EMAIL_FROM;

    if (!apiKey || apiKey.trim() === '') {
        throw new Error('RESEND_API_KEY environment variable is required');
    }

    if (!fromEmail || fromEmail.trim() === '') {
        throw new Error('RESEND_EMAIL_FROM environment variable is required');
    }

    return { apiKey, fromEmail };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { reportType, recipientEmail, subject, message } = body as {
            reportType: PDFReportType;
            recipientEmail: string;
            subject?: string;
            message?: string;
        };

        if (!recipientEmail) {
            return NextResponse.json(
                { error: 'Recipient email is required' },
                { status: 400 }
            );
        }

        // Validate report type
        const validTypes: PDFReportType[] = [
            'assessed-quote',
            'detailed-assessment',
            'salvage-tender',
            'total-loss',
        ];
        if (!validTypes.includes(reportType)) {
            return NextResponse.json(
                { error: 'Invalid report type' },
                { status: 400 }
            );
        }

        // Get assessment from database
        const serverClient = createServerClient();
        const { data: assessment, error: fetchError } = await serverClient
            .from('assessments')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (fetchError || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Convert to PDF data format
        const pdfData = assessmentToPDFData(assessment);

        // Generate PDF
        const doc = generatePDFReport({
            reportType,
            assessmentData: pdfData,
            includeCompanyHeader: true,
        });

        // Convert to buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        // Generate filename
        const reportTypeNames: Record<PDFReportType, string> = {
            'assessed-quote': 'Assessed-Quote',
            'detailed-assessment': 'Detailed-Assessment-Report',
            'salvage-tender': 'Salvage-Tender-Request',
            'total-loss': 'Total-Loss-Assessment',
        };

        const filename = `${reportTypeNames[reportType]}-${assessment.assessment_reference_number || id}.pdf`;

        // Generate email subject
        const defaultSubject = `${reportTypeNames[reportType]} - ${assessment.claim_reference || 'Assessment'}`;
        const emailSubject = subject || defaultSubject;

        // Generate email body
        const vehicleInfo = `${assessment.make} ${assessment.model}${assessment.year ? ` (${assessment.year})` : ''}`;
        const emailBody = message || `
            <p>Dear ${recipientEmail},</p>
            <p>Please find attached the ${reportTypeNames[reportType]} for the following assessment:</p>
            <ul>
                <li><strong>Claim Reference:</strong> ${assessment.claim_reference || 'N/A'}</li>
                <li><strong>Vehicle:</strong> ${vehicleInfo}</li>
                <li><strong>Assessment Reference:</strong> ${assessment.assessment_reference_number || id}</li>
            </ul>
            <p>If you have any questions, please contact us.</p>
            <p>Best regards,<br>Crashify Team</p>
        `;

        // Get email configuration (same as EmailService uses)
        const config = getEmailConfig();
        const resend = new Resend(config.apiKey);

        const result = await resend.emails.send({
            from: config.fromEmail,
            to: recipientEmail,
            subject: emailSubject,
            html: emailBody,
            attachments: [
                {
                    filename,
                    content: pdfBuffer,
                },
            ],
        });

        if (result.error) {
            return NextResponse.json(
                {
                    error: 'Failed to send email',
                    details: result.error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            messageId: result.data?.id,
            message: 'PDF sent successfully via email',
        });
    } catch (error) {
        console.error('[PDF_EMAIL] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send PDF via email',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

