// =============================================
// FILE: lib/types/pdf-report.types.ts
// TypeScript types for PDF report generation
// =============================================

export type PDFReportType =
    | 'assessed-quote'
    | 'detailed-assessment'
    | 'salvage-tender'
    | 'total-loss';

export interface LaborItem {
    description: string;
    comment?: string;
    hours_quoted?: number;
    hours_assessed?: number;
    variance?: number;
    rate_type?: 'RR' | 'RA' | 'REF';
    rate?: number;
    cost?: number;
}

export interface PartItem {
    part_number?: string;
    item: string;
    part_type?: 'New' | 'Used' | 'Refurbished' | 'Aftermarket';
    comment?: string;
    quantity?: number;
    quantity_assessed?: number;
    price?: number;
    price_assessed?: number;
    variance?: number;
}

export interface SubletItem {
    description: string;
    comment?: string;
    quoted?: number;
    assessed?: number;
    variance?: number;
}

export interface MiscItem {
    description: string;
    comment?: string;
    quoted?: number;
    assessed?: number;
    variance?: number;
}

export interface AssessorInfo {
    name: string;
    phone?: string;
    email?: string;
    mobile?: string;
}

export interface InsurerInfo {
    name: string;
    abn?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface RepairerInfo {
    name: string;
    abn?: string;
    address?: string;
    phone?: string;
    email?: string;
}

export interface OwnerInfo {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    mobile?: string;
    alt_phone?: string;
    address?: string;
}

export interface VehicleInfo {
    make: string;
    model: string;
    year?: number;
    registration?: string;
    registration_state?: string;
    vin?: string;
    color?: string;
    odometer?: number;
    vehicle_type?: string;
}

export interface AssessmentData {
    // Basic info
    assessment_reference_number?: string;
    assessment_date?: string;
    inspection_date?: string;
    inspection_address?: string;
    claim_reference?: string;
    policy_number?: string;
    incident_date?: string;
    incident_location?: string;

    // People/Organizations
    assessor?: AssessorInfo;
    insurer?: InsurerInfo;
    repairer?: RepairerInfo;
    owner?: OwnerInfo;

    // Vehicle
    vehicle?: VehicleInfo;

    // Financial
    labor_items?: LaborItem[];
    parts_items?: PartItem[];
    sublet_items?: SubletItem[];
    misc_items?: MiscItem[];
    labor_total_hours?: number;
    labor_total_cost?: number;
    labor_rate_rr?: number;
    labor_rate_ra?: number;
    labor_rate_ref?: number;
    parts_total_cost?: number;
    sublet_total_cost?: number;
    misc_total_cost?: number;
    total_excluding_gst?: number;
    gst_amount?: number;
    total_including_gst?: number;
    excess_amount?: number;

    // Estimates
    estimate_number?: string;
    estimate_date?: string;
    quoted_hours?: number;
    assessed_hours?: number;
    hours_variance?: number;
    quoted_total?: number;
    assessed_total?: number;
    total_variance?: number;

    // Repair authority
    repair_authority_issued?: boolean;
    repair_authority_date?: string;
    repair_authority_issued_by?: string;
    repair_authority_conditions?: string;

    // Total loss
    is_total_loss?: boolean;
    total_loss_reason?: string;
    total_loss_value?: number;

    // Salvage
    salvage_tender_required?: boolean;
    salvage_tender_date?: string;
    salvage_estimated_value?: number;

    // Notes
    assessment_notes?: string;
    repair_conditions?: string;
    additional_damage_notes?: string;
    fault_codes_notes?: string;
    post_repair_requirements?: string;
    incident_description?: string;
    damage_areas?: string[];
}

export interface PDFGenerationOptions {
    reportType: PDFReportType;
    assessmentData: AssessmentData;
    includeCompanyHeader?: boolean;
    companyName?: string;
    companyAbn?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyWebsite?: string;
}

