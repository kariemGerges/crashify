// =============================================
// FILE: app/api/assessments/route.ts
// POST: Create new assessment with file uploads
// GET: List assessments with pagination & filtering
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { validateAssessmentForm } from '@/server/lib/utils/validation';
import { SpamDetector } from '@/server/lib/services/spam-detector';
import { validateAndExtractIp } from '@/server/lib/utils/security';
import type { AssessmentFormData, Database, Json } from '@/server/lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

type AssessmentInsert = Database['public']['Tables']['assessments']['Insert'];
type AssessmentRow = Database['public']['Tables']['assessments']['Row'];
type Supabase = SupabaseClient<Database>;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: Create assessment
export async function POST(request: NextRequest) {
    try {
        const supabase: Supabase = createServerClient();
        const body = await request.json();
        const formData: AssessmentFormData = body.formData;

        // Validate form data
        const validationErrors = validateAssessmentForm(formData);
        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: 'Validation failed', errors: validationErrors },
                { status: 400 }
            );
        }

        // Spam detection (only for non-trusted domains)
        const rawIpHeader = request.headers.get('x-forwarded-for');
        const ipAddress = validateAndExtractIp(rawIpHeader);
        const userAgent = request.headers.get('user-agent') || '';
        const submitTimeSeconds = body.submitTimeSeconds || undefined; // Should be sent from frontend
        const photoCount = body.photoCount || 0;

        // Skip spam check for trusted insurance company domains
        const isTrusted = SpamDetector.isTrustedDomain(formData.yourEmail);
        let spamCheckResult: { spamScore: number; flags: string[]; action: string } | null = null;
        
        if (!isTrusted) {
            const spamCheck = SpamDetector.checkSpam({
                email: formData.yourEmail,
                phone: formData.yourPhone,
                name: formData.yourName,
                description: formData.incidentDescription,
                photoCount,
                submitTimeSeconds,
                ipAddress: ipAddress || undefined,
                userAgent,
            });

            spamCheckResult = {
                spamScore: spamCheck.spamScore,
                flags: spamCheck.flags,
                action: spamCheck.action,
            };

            // Auto-reject if spam score is too high
            if (spamCheck.action === 'auto_reject') {
                console.log('[ASSESSMENT] Spam detected, auto-rejecting:', {
                    email: formData.yourEmail,
                    spamScore: spamCheck.spamScore,
                    flags: spamCheck.flags,
                });

                // Log spam attempt
                try {
                    const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                        action: 'spam_detected',
                        details: {
                            email: formData.yourEmail,
                            spamScore: spamCheck.spamScore,
                            flags: spamCheck.flags,
                            action: 'auto_reject',
                        },
                        ip_address: ipAddress || undefined,
                        user_agent: userAgent || undefined,
                        created_at: new Date().toISOString(),
                        success: false,
                    };
                    await (supabase.from('audit_logs') as unknown as {
                        insert: (values: Database['public']['Tables']['audit_logs']['Insert'][]) => Promise<unknown>;
                    }).insert([auditLogInsert]);
                } catch (auditError) {
                    console.error('[ASSESSMENT] Failed to log spam attempt:', auditError);
                }

                return NextResponse.json(
                    {
                        error: 'Submission rejected',
                        message: 'Your submission could not be processed. Please contact us directly if you believe this is an error.',
                        spamScore: spamCheck.spamScore,
                    },
                    { status: 403 }
                );
            }

            // For manual review, will add spam score to internal notes below
            if (spamCheck.action === 'manual_review' && spamCheck.spamScore > 0) {
                console.log('[ASSESSMENT] Manual review required:', {
                    email: formData.yourEmail,
                    spamScore: spamCheck.spamScore,
                    flags: spamCheck.flags,
                });
            }
        }

        // Parse insurance value amount (remove $ and commas)
        const insuranceAmount = formData.insuranceValueAmount
            ? parseFloat(
                  formData.insuranceValueAmount.toString().replace(/[$,]/g, '')
              )
            : null;

        // Parse year
        const year = formData.year ? parseInt(formData.year.toString()) : null;

        // Parse odometer
        const odometer = formData.odometer
            ? parseInt(formData.odometer.toString())
            : null;

        // Prepare owner info
        const ownerInfo: Json = formData.ownerInfo
            ? {
                  firstName: formData.ownerInfo.firstName || null,
                  lastName: formData.ownerInfo.lastName || null,
                  email: formData.ownerInfo.email || null,
                  mobile: formData.ownerInfo.mobile || null,
                  altPhone: formData.ownerInfo.altPhone || null,
                  address: formData.ownerInfo.address || null,
              }
            : {};

        // Prepare location info (only for onsite assessments)
        const locationInfo: Json =
            formData.assessmentType === 'Onsite Assessment' &&
            formData.locationInfo
                ? (formData.locationInfo as Json)
                : {};

        // Insert assessment
        const insertData: AssessmentInsert = {
                // Section 1
                company_name: formData.companyName,
                your_name: formData.yourName,
                your_email: formData.yourEmail,
                your_phone: formData.yourPhone,
                your_role: formData.yourRole || null,
                department: formData.department || null,

                // Section 2
                assessment_type: (formData.assessmentType === 'Desktop Assessment' || formData.assessmentType === 'Onsite Assessment') 
                    ? formData.assessmentType 
                    : 'Desktop Assessment', // Default to Desktop Assessment if invalid
                claim_reference: formData.claimReference || null,
                policy_number: formData.policyNumber || null,
                incident_date: formData.incidentDate || null,
                incident_location: formData.incidentLocation || null,

                // Section 3
                vehicle_type: formData.vehicleType || null,
                year,
                make: formData.make,
                model: formData.model,
                registration: formData.registration?.toUpperCase() || null,
                vin: formData.vin?.toUpperCase() || null,
                color: formData.color || null,
                odometer,
                insurance_value_type: formData.insuranceValueType || null,
                insurance_value_amount: insuranceAmount,

                // Section 4
                owner_info: ownerInfo,

                // Section 5
                location_info: locationInfo,

                // Section 7
                incident_description: formData.incidentDescription || null,
                damage_areas: formData.damageAreas || [],
                special_instructions: formData.specialInstructions || null,
                internal_notes: spamCheckResult && spamCheckResult.spamScore > 0
                    ? `${formData.internalNotes || ''}\n\n[SPAM CHECK] Score: ${spamCheckResult.spamScore}/100, Flags: ${spamCheckResult.flags.join(', ')}, Action: ${spamCheckResult.action}`.trim()
                    : formData.internalNotes || null,

                // Section 8
                authority_confirmed: formData.authorityConfirmed,
                privacy_consent: formData.privacyConsent,
                email_report_consent: formData.emailReportConsent,
                sms_updates: formData.smsUpdates,

                // Defaults
                status: 'pending',
        };

        const { data, error: insertError } = await (supabase.from('assessments') as unknown as {
            insert: (values: AssessmentInsert[]) => {
                select: () => {
                    single: () => Promise<{
                        data: AssessmentRow | null;
                        error: { message: string } | null;
                    }>;
                };
            };
        })
            .insert([insertData])
            .select()
            .single();
        
        const assessment = data as AssessmentRow | null;

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                {
                    error: 'Failed to create assessment',
                    details: insertError.message,
                },
                { status: 500 }
            );
        }

        if (!assessment) {
            return NextResponse.json(
                {
                    error: 'Failed to create assessment',
                    details: 'No data returned from insert',
                },
                { status: 500 }
            );
        }

        // REQ-115: Notify admins of new assessment
        // REQ-119: Notify client of submission received
        try {
            const { notifyAdmins, notifyClient } = await import('@/server/lib/services/notification-service');
            
            // Notify admins
            await notifyAdmins('assessment_new', {
                title: 'New Assessment Submitted',
                message: `A new ${formData.assessmentType} assessment has been submitted by ${formData.yourName} (${formData.yourEmail}) for ${formData.companyName}.`,
                resourceType: 'assessment',
                resourceId: assessment.id,
                metadata: {
                    assessmentType: formData.assessmentType,
                    companyName: formData.companyName,
                },
            });

            // Notify client
            await notifyClient(formData.yourEmail, 'submission_received', {
                title: 'Assessment Submission Received',
                message: `Thank you for submitting your ${formData.assessmentType} assessment. We have received your submission and will begin processing it shortly.`,
                assessmentId: assessment.id,
                metadata: {
                    assessmentType: formData.assessmentType,
                },
            });
        } catch (notifyError) {
            console.error('[ASSESSMENT] Notification error (non-critical):', notifyError);
            // Don't fail the request if notifications fail
        }

        // Invalidate cache
        await revalidateTag('assessments-list', 'default');
        await revalidateTag('stats', 'default');

        // Return success with assessment ID for file uploads
        return NextResponse.json(
            {
                success: true,
                assessment: {
                    id: assessment.id,
                    status: assessment.status,
                    created_at: assessment.created_at,
                },
                message: 'Assessment created successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// GET: List assessments with filtering
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const searchParams = request.nextUrl.searchParams;

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Filters
        const status = searchParams.get('status');
        const assessmentType = searchParams.get('type');
        const companyName = searchParams.get('company');

        // Build query
        let query = supabase
            .from('assessments')
            .select(
                `
        id,
        company_name,
        your_name,
        your_email,
        assessment_type,
        make,
        model,
        registration,
        status,
        created_at
      `,
                { count: 'exact' }
            )
            .is('deleted_at', null);

        // Apply filters
        if (status) query = query.eq('status', status);
        if (assessmentType) query = query.eq('assessment_type', assessmentType);
        if (companyName)
            query = query.ilike('company_name', `%${companyName}%`);

        // Apply pagination
        query = query.order('created_at', { ascending: false }).range(from, to);

        const { data, error, count } = await query;

        if (error) {
            return NextResponse.json(
                {
                    error: 'Failed to fetch assessments',
                    details: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data,
            pagination: {
                page,
                pageSize,
                total: count || 0,
                totalPages: count ? Math.ceil(count / pageSize) : 0,
            },
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
