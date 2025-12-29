// =============================================
// FILE: app/api/assessments/manual/route.ts
// POST: Create assessment manually by admin
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';
import { getSession } from '@/server/lib/auth/session';
import type { Database, Json } from '@/server/lib/types/database.types';
import { createLogger } from '@/server/lib/utils/logger';

const logger = createLogger('ASSESSMENT_MANUAL');

type AssessmentInsert = Database['public']['Tables']['assessments']['Insert'];
type AssessmentRow = Database['public']['Tables']['assessments']['Row'];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const user = await getSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user has permission (admin, manager, or assessor)
        const allowedRoles = ['super_admin', 'admin', 'manager', 'assessor'];
        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json(
                { error: 'Forbidden - Insufficient permissions' },
                { status: 403 }
            );
        }

        const supabase = createServerClient();
        const body = await request.json();

        // Validate required fields
        if (!body.company_name || !body.your_name || !body.your_email || !body.your_phone) {
            return NextResponse.json(
                { error: 'Missing required fields: company_name, your_name, your_email, your_phone' },
                { status: 400 }
            );
        }

        if (!body.assessment_type || !body.make || !body.model) {
            return NextResponse.json(
                { error: 'Missing required fields: assessment_type, make, model' },
                { status: 400 }
            );
        }

        // Parse year if provided
        const year = body.year ? parseInt(body.year.toString()) : null;
        if (year && (year < 1900 || year > 2026)) {
            return NextResponse.json(
                { error: 'Year must be between 1900 and 2026' },
                { status: 400 }
            );
        }

        // Parse odometer if provided
        const odometer = body.odometer ? parseInt(body.odometer.toString()) : null;

        // Parse insurance value amount if provided
        const insuranceAmount = body.insurance_value_amount
            ? parseFloat(body.insurance_value_amount.toString().replace(/[$,]/g, ''))
            : null;

        // Prepare owner info
        const ownerInfo: Json = body.owner_info || {};

        // Prepare location info (only for onsite assessments)
        const locationInfo: Json = body.location_info || {};

        // Insert assessment with source='manual'
        const insertData: AssessmentInsert = {
            // Section 1
            company_name: body.company_name,
            your_name: body.your_name,
            your_email: body.your_email,
            your_phone: body.your_phone,
            your_role: body.your_role || null,
            department: body.department || null,

            // Section 2
            assessment_type: body.assessment_type === 'Onsite Assessment' 
                ? 'Onsite Assessment' 
                : 'Desktop Assessment',
            claim_reference: body.claim_reference || null,
            policy_number: body.policy_number || null,
            incident_date: body.incident_date || null,
            incident_location: body.incident_location || null,

            // Section 3
            vehicle_type: body.vehicle_type || null,
            year,
            make: body.make,
            model: body.model,
            registration: body.registration?.toUpperCase() || null,
            vin: body.vin?.toUpperCase() || null,
            color: body.color || null,
            odometer,
            insurance_value_type: body.insurance_value_type || null,
            insurance_value_amount: insuranceAmount,

            // Section 4
            owner_info: ownerInfo,

            // Section 5
            location_info: locationInfo,

            // Section 7
            incident_description: body.incident_description || null,
            damage_areas: Array.isArray(body.damage_areas) ? body.damage_areas : [],
            special_instructions: body.special_instructions || null,
            internal_notes: body.internal_notes 
                ? `${body.internal_notes}\n\n[MANUALLY ADDED BY ADMIN] Added by ${user.name} (${user.email}) on ${new Date().toISOString()}`
                : `[MANUALLY ADDED BY ADMIN] Added by ${user.name} (${user.email}) on ${new Date().toISOString()}`,

            // Section 8
            authority_confirmed: body.authority_confirmed !== false, // Default to true
            privacy_consent: body.privacy_consent !== false, // Default to true
            email_report_consent: body.email_report_consent || false,
            sms_updates: body.sms_updates || false,

            // Defaults
            status: 'pending',
            source: 'manual',
        } as AssessmentInsert & { source?: string };

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
            logger.error('Manual assessment insert error', insertError);
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

        // Log assessment creation in audit log
        try {
            const auditLogInsert: Database['public']['Tables']['audit_logs']['Insert'] = {
                action: 'assessment_created_manual',
                resource_type: 'assessment',
                resource_id: assessment.id,
                details: {
                    assessmentId: assessment.id,
                    companyName: body.company_name,
                    assessmentType: body.assessment_type,
                    addedBy: user.name,
                    addedByEmail: user.email,
                    addedByUserId: user.id,
                },
                created_at: new Date().toISOString(),
                success: true,
            };
            await (supabase.from('audit_logs') as unknown as {
                insert: (values: Database['public']['Tables']['audit_logs']['Insert'][]) => Promise<unknown>;
            }).insert([auditLogInsert]);
        } catch (auditError) {
            logger.error('Failed to log manual assessment creation', auditError);
            // Don't fail the request if audit logging fails
        }

        logger.info('Manual assessment created', {
            assessmentId: assessment.id,
            companyName: body.company_name,
            addedBy: user.name,
        });

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
        logger.error('API Error', error);
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

