// =============================================
// FILE: lib/utils/assessment-to-pdf-data.ts
// Convert database assessment to PDF report data format
// =============================================

import type { AssessmentData } from '../types/pdf-report.types';
import type { Database } from '../types/database.types';

type AssessmentRow = Database['public']['Tables']['assessments']['Row'];

/**
 * Convert database assessment row to PDF report data
 */
export function assessmentToPDFData(assessment: AssessmentRow): AssessmentData {
    const ownerInfo = assessment.owner_info as
        | {
              first_name?: string;
              last_name?: string;
              full_name?: string;
              email?: string;
              mobile?: string;
              alt_phone?: string;
              address?: string;
          }
        | null;

    const locationInfo = assessment.location_info as
        | {
              name?: string;
              street_address?: string;
              suburb?: string;
              state?: string;
              postcode?: string;
          }
        | null;

    // Parse labor items from JSONB
    let laborItems: AssessmentData['labor_items'] = [];
    if (assessment.labor_items) {
        try {
            laborItems =
                (assessment.labor_items as unknown as AssessmentData['labor_items']) ||
                [];
        } catch {
            laborItems = [];
        }
    }

    // Parse parts items from JSONB
    let partsItems: AssessmentData['parts_items'] = [];
    if (assessment.parts_items) {
        try {
            partsItems =
                (assessment.parts_items as unknown as AssessmentData['parts_items']) ||
                [];
        } catch {
            partsItems = [];
        }
    }

    // Parse sublet items from JSONB
    let subletItems: AssessmentData['sublet_items'] = [];
    if (assessment.sublet_items) {
        try {
            subletItems =
                (assessment.sublet_items as unknown as AssessmentData['sublet_items']) ||
                [];
        } catch {
            subletItems = [];
        }
    }

    // Parse misc items from JSONB
    let miscItems: AssessmentData['misc_items'] = [];
    if (assessment.misc_items) {
        try {
            miscItems =
                (assessment.misc_items as unknown as AssessmentData['misc_items']) ||
                [];
        } catch {
            miscItems = [];
        }
    }

    return {
        // Basic info
        assessment_reference_number: assessment.assessment_reference_number || undefined,
        assessment_date: assessment.assessment_date || undefined,
        inspection_date: assessment.inspection_date || undefined,
        inspection_address: assessment.inspection_address || undefined,
        claim_reference: assessment.claim_reference || undefined,
        policy_number: assessment.policy_number || undefined,
        incident_date: assessment.incident_date || undefined,
        incident_location: assessment.incident_location || undefined,

        // People/Organizations
        assessor: assessment.assessor_name
            ? {
                  name: assessment.assessor_name,
                  phone: assessment.assessor_phone || undefined,
                  email: assessment.assessor_email || undefined,
                  mobile: assessment.assessor_mobile || undefined,
              }
            : undefined,

        insurer: assessment.insurer_name
            ? {
                  name: assessment.insurer_name,
                  abn: assessment.insurer_abn || undefined,
                  phone: assessment.insurer_phone || undefined,
                  email: assessment.insurer_email || undefined,
                  address: assessment.insurer_address || undefined,
              }
            : undefined,

        repairer: assessment.repairer_name
            ? {
                  name: assessment.repairer_name,
                  abn: assessment.repairer_abn || undefined,
                  address: assessment.repairer_address || undefined,
                  phone: assessment.repairer_phone || undefined,
                  email: assessment.repairer_email || undefined,
              }
            : undefined,

        owner: ownerInfo
            ? {
                  first_name: ownerInfo.first_name,
                  last_name: ownerInfo.last_name,
                  full_name: ownerInfo.full_name,
                  email: ownerInfo.email,
                  mobile: ownerInfo.mobile,
                  alt_phone: ownerInfo.alt_phone,
                  address: ownerInfo.address,
              }
            : undefined,

        // Vehicle
        vehicle: {
            make: assessment.make,
            model: assessment.model,
            year: assessment.year || undefined,
            registration: assessment.registration || undefined,
            registration_state: assessment.registration_state || undefined,
            vin: assessment.vin || undefined,
            color: assessment.color || undefined,
            odometer: assessment.odometer || undefined,
            vehicle_type: assessment.vehicle_type || undefined,
        },

        // Financial
        labor_items: laborItems,
        parts_items: partsItems,
        sublet_items: subletItems,
        misc_items: miscItems,
        labor_total_hours: assessment.labor_total_hours
            ? Number(assessment.labor_total_hours)
            : undefined,
        labor_total_cost: assessment.labor_total_cost
            ? Number(assessment.labor_total_cost)
            : undefined,
        labor_rate_rr: assessment.labor_rate_rr
            ? Number(assessment.labor_rate_rr)
            : undefined,
        labor_rate_ra: assessment.labor_rate_ra
            ? Number(assessment.labor_rate_ra)
            : undefined,
        labor_rate_ref: assessment.labor_rate_ref
            ? Number(assessment.labor_rate_ref)
            : undefined,
        parts_total_cost: assessment.parts_total_cost
            ? Number(assessment.parts_total_cost)
            : undefined,
        sublet_total_cost: assessment.sublet_total_cost
            ? Number(assessment.sublet_total_cost)
            : undefined,
        misc_total_cost: assessment.misc_total_cost
            ? Number(assessment.misc_total_cost)
            : undefined,
        total_excluding_gst: assessment.total_excluding_gst
            ? Number(assessment.total_excluding_gst)
            : undefined,
        gst_amount: assessment.gst_amount ? Number(assessment.gst_amount) : undefined,
        total_including_gst: assessment.total_including_gst
            ? Number(assessment.total_including_gst)
            : undefined,
        excess_amount: assessment.excess_amount
            ? Number(assessment.excess_amount)
            : undefined,

        // Estimates
        estimate_number: assessment.estimate_number || undefined,
        estimate_date: assessment.estimate_date || undefined,
        quoted_hours: assessment.quoted_hours
            ? Number(assessment.quoted_hours)
            : undefined,
        assessed_hours: assessment.assessed_hours
            ? Number(assessment.assessed_hours)
            : undefined,
        hours_variance: assessment.hours_variance
            ? Number(assessment.hours_variance)
            : undefined,
        quoted_total: assessment.quoted_total
            ? Number(assessment.quoted_total)
            : undefined,
        assessed_total: assessment.assessed_total
            ? Number(assessment.assessed_total)
            : undefined,
        total_variance: assessment.total_variance
            ? Number(assessment.total_variance)
            : undefined,

        // Repair authority
        repair_authority_issued: assessment.repair_authority_issued || false,
        repair_authority_date: assessment.repair_authority_date || undefined,
        repair_authority_issued_by: assessment.repair_authority_issued_by || undefined,
        repair_authority_conditions: assessment.repair_conditions || undefined,

        // Total loss
        is_total_loss: assessment.is_total_loss || false,
        total_loss_reason: assessment.total_loss_reason || undefined,
        total_loss_value: assessment.total_loss_value
            ? Number(assessment.total_loss_value)
            : undefined,

        // Salvage
        salvage_tender_required: assessment.salvage_tender_required || false,
        salvage_tender_date: assessment.salvage_tender_date || undefined,
        salvage_estimated_value: assessment.salvage_estimated_value
            ? Number(assessment.salvage_estimated_value)
            : undefined,

        // Notes
        assessment_notes: assessment.assessment_notes || undefined,
        repair_conditions: assessment.repair_conditions || undefined,
        additional_damage_notes: assessment.additional_damage_notes || undefined,
        fault_codes_notes: assessment.fault_codes_notes || undefined,
        post_repair_requirements: assessment.post_repair_requirements || undefined,
        incident_description: assessment.incident_description || undefined,
        damage_areas: assessment.damage_areas || [],
    };
}

