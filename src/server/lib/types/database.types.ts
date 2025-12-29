// =============================================
// FILE location: lib/types/database.types.ts
// Generated TypeScript types for Supabase
// =============================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            assessments: {
                Row: {
                    id: string;
                    created_at: string;
                    updated_at: string;
                    company_name: string;
                    your_name: string;
                    your_email: string;
                    your_phone: string;
                    your_role: string | null;
                    department: string | null;
                    assessment_type: 'Desktop Assessment' | 'Onsite Assessment' | '';
                    claim_reference: string | null;
                    policy_number: string | null;
                    incident_date: string | null;
                    incident_location: string | null;
                    vehicle_type: string | null;
                    year: number | null;
                    make: string;
                    model: string;
                    registration: string | null;
                    vin: string | null;
                    color: string | null;
                    odometer: number | null;
                    insurance_value_type: string | null;
                    insurance_value_amount: number | null;
                    owner_info: Json;
                    location_info: Json;
                    incident_description: string | null;
                    damage_areas: string[];
                    special_instructions: string | null;
                    internal_notes: string | null;
                    authority_confirmed: boolean;
                    privacy_consent: boolean;
                    email_report_consent: boolean;
                    sms_updates: boolean;
                    status:
                        | 'pending'
                        | 'processing'
                        | 'completed'
                        | 'cancelled';
                    completed_at: string | null;
                    deleted_at: string | null;
                    // PDF Report fields
                    assessor_name: string | null;
                    assessor_phone: string | null;
                    assessor_email: string | null;
                    assessor_mobile: string | null;
                    assessment_reference_number: string | null;
                    assessment_date: string | null;
                    inspection_date: string | null;
                    inspection_address: string | null;
                    insurer_name: string | null;
                    insurer_abn: string | null;
                    insurer_phone: string | null;
                    insurer_email: string | null;
                    insurer_address: string | null;
                    repairer_name: string | null;
                    repairer_abn: string | null;
                    repairer_address: string | null;
                    repairer_phone: string | null;
                    repairer_email: string | null;
                    labor_items: Json | null;
                    labor_total_hours: number | null;
                    labor_total_cost: number | null;
                    labor_rate_rr: number | null;
                    labor_rate_ra: number | null;
                    labor_rate_ref: number | null;
                    parts_items: Json | null;
                    parts_total_cost: number | null;
                    sublet_items: Json | null;
                    sublet_total_cost: number | null;
                    misc_items: Json | null;
                    misc_total_cost: number | null;
                    total_excluding_gst: number | null;
                    gst_amount: number | null;
                    total_including_gst: number | null;
                    excess_amount: number | null;
                    repair_authority_issued: boolean | null;
                    repair_authority_date: string | null;
                    repair_authority_issued_by: string | null;
                    repair_conditions: string | null;
                    is_total_loss: boolean | null;
                    total_loss_reason: string | null;
                    total_loss_value: number | null;
                    salvage_tender_required: boolean | null;
                    salvage_tender_date: string | null;
                    salvage_estimated_value: number | null;
                    estimate_number: string | null;
                    estimate_date: string | null;
                    quoted_hours: number | null;
                    assessed_hours: number | null;
                    hours_variance: number | null;
                    quoted_total: number | null;
                    assessed_total: number | null;
                    total_variance: number | null;
                    assessment_notes: string | null;
                    additional_damage_notes: string | null;
                    fault_codes_notes: string | null;
                    post_repair_requirements: string | null;
                    registration_state: string | null;
                    vehicle_state: string | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    company_name: string;
                    your_name: string;
                    your_email: string;
                    your_phone: string;
                    your_role?: string | null;
                    department?: string | null;
                    assessment_type: 'Desktop Assessment' | 'Onsite Assessment';
                    claim_reference?: string | null;
                    policy_number?: string | null;
                    incident_date?: string | null;
                    incident_location?: string | null;
                    vehicle_type?: string | null;
                    year?: number | null;
                    make: string;
                    model: string;
                    registration?: string | null;
                    vin?: string | null;
                    color?: string | null;
                    odometer?: number | null;
                    insurance_value_type?: string | null;
                    insurance_value_amount?: number | null;
                    owner_info?: Json;
                    location_info?: Json;
                    incident_description?: string | null;
                    damage_areas?: string[];
                    special_instructions?: string | null;
                    internal_notes?: string | null;
                    authority_confirmed: boolean;
                    privacy_consent: boolean;
                    email_report_consent?: boolean;
                    sms_updates?: boolean;
                    status?:
                        | 'pending'
                        | 'processing'
                        | 'completed'
                        | 'cancelled';
                    completed_at?: string | null;
                    deleted_at?: string | null;
                    // PDF Report fields
                    assessor_name?: string | null;
                    assessor_phone?: string | null;
                    assessor_email?: string | null;
                    assessor_mobile?: string | null;
                    assessment_reference_number?: string | null;
                    assessment_date?: string | null;
                    inspection_date?: string | null;
                    inspection_address?: string | null;
                    insurer_name?: string | null;
                    insurer_abn?: string | null;
                    insurer_phone?: string | null;
                    insurer_email?: string | null;
                    insurer_address?: string | null;
                    repairer_name?: string | null;
                    repairer_abn?: string | null;
                    repairer_address?: string | null;
                    repairer_phone?: string | null;
                    repairer_email?: string | null;
                    labor_items?: Json | null;
                    labor_total_hours?: number | null;
                    labor_total_cost?: number | null;
                    labor_rate_rr?: number | null;
                    labor_rate_ra?: number | null;
                    labor_rate_ref?: number | null;
                    parts_items?: Json | null;
                    parts_total_cost?: number | null;
                    sublet_items?: Json | null;
                    sublet_total_cost?: number | null;
                    misc_items?: Json | null;
                    misc_total_cost?: number | null;
                    total_excluding_gst?: number | null;
                    gst_amount?: number | null;
                    total_including_gst?: number | null;
                    excess_amount?: number | null;
                    repair_authority_issued?: boolean | null;
                    repair_authority_date?: string | null;
                    repair_authority_issued_by?: string | null;
                    repair_conditions?: string | null;
                    is_total_loss?: boolean | null;
                    total_loss_reason?: string | null;
                    total_loss_value?: number | null;
                    salvage_tender_required?: boolean | null;
                    salvage_tender_date?: string | null;
                    salvage_estimated_value?: number | null;
                    estimate_number?: string | null;
                    estimate_date?: string | null;
                    quoted_hours?: number | null;
                    assessed_hours?: number | null;
                    hours_variance?: number | null;
                    quoted_total?: number | null;
                    assessed_total?: number | null;
                    total_variance?: number | null;
                    assessment_notes?: string | null;
                    additional_damage_notes?: string | null;
                    fault_codes_notes?: string | null;
                    post_repair_requirements?: string | null;
                    registration_state?: string | null;
                    vehicle_state?: string | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    company_name?: string;
                    your_name?: string;
                    your_email?: string;
                    your_phone?: string;
                    your_role?: string | null;
                    department?: string | null;
                    assessment_type?:
                        | 'Desktop Assessment'
                        | 'Onsite Assessment';
                    claim_reference?: string | null;
                    policy_number?: string | null;
                    incident_date?: string | null;
                    incident_location?: string | null;
                    vehicle_type?: string | null;
                    year?: number | null;
                    make?: string;
                    model?: string;
                    registration?: string | null;
                    vin?: string | null;
                    color?: string | null;
                    odometer?: number | null;
                    insurance_value_type?: string | null;
                    insurance_value_amount?: number | null;
                    owner_info?: Json;
                    location_info?: Json;
                    incident_description?: string | null;
                    damage_areas?: string[];
                    special_instructions?: string | null;
                    internal_notes?: string | null;
                    authority_confirmed?: boolean;
                    privacy_consent?: boolean;
                    email_report_consent?: boolean;
                    sms_updates?: boolean;
                    status?:
                        | 'pending'
                        | 'processing'
                        | 'completed'
                        | 'cancelled';
                    completed_at?: string | null;
                    deleted_at?: string | null;
                    // PDF Report fields
                    assessor_name?: string | null;
                    assessor_phone?: string | null;
                    assessor_email?: string | null;
                    assessor_mobile?: string | null;
                    assessment_reference_number?: string | null;
                    assessment_date?: string | null;
                    inspection_date?: string | null;
                    inspection_address?: string | null;
                    insurer_name?: string | null;
                    insurer_abn?: string | null;
                    insurer_phone?: string | null;
                    insurer_email?: string | null;
                    insurer_address?: string | null;
                    repairer_name?: string | null;
                    repairer_abn?: string | null;
                    repairer_address?: string | null;
                    repairer_phone?: string | null;
                    repairer_email?: string | null;
                    labor_items?: Json | null;
                    labor_total_hours?: number | null;
                    labor_total_cost?: number | null;
                    labor_rate_rr?: number | null;
                    labor_rate_ra?: number | null;
                    labor_rate_ref?: number | null;
                    parts_items?: Json | null;
                    parts_total_cost?: number | null;
                    sublet_items?: Json | null;
                    sublet_total_cost?: number | null;
                    misc_items?: Json | null;
                    misc_total_cost?: number | null;
                    total_excluding_gst?: number | null;
                    gst_amount?: number | null;
                    total_including_gst?: number | null;
                    excess_amount?: number | null;
                    repair_authority_issued?: boolean | null;
                    repair_authority_date?: string | null;
                    repair_authority_issued_by?: string | null;
                    repair_conditions?: string | null;
                    is_total_loss?: boolean | null;
                    total_loss_reason?: string | null;
                    total_loss_value?: number | null;
                    salvage_tender_required?: boolean | null;
                    salvage_tender_date?: string | null;
                    salvage_estimated_value?: number | null;
                    estimate_number?: string | null;
                    estimate_date?: string | null;
                    quoted_hours?: number | null;
                    assessed_hours?: number | null;
                    hours_variance?: number | null;
                    quoted_total?: number | null;
                    assessed_total?: number | null;
                    total_variance?: number | null;
                    assessment_notes?: string | null;
                    additional_damage_notes?: string | null;
                    fault_codes_notes?: string | null;
                    post_repair_requirements?: string | null;
                    registration_state?: string | null;
                    vehicle_state?: string | null;
                };
            };
            uploaded_files: {
                Row: {
                    id: string;
                    assessment_id: string;
                    file_name: string;
                    file_url: string;
                    file_type: string;
                    file_size: number;
                    storage_path: string;
                    uploaded_at: string;
                    processing_status:
                        | 'uploaded'
                        | 'processing'
                        | 'processed'
                        | 'failed';
                    metadata: Json;
                };
                Insert: {
                    id?: string;
                    assessment_id: string;
                    file_name: string;
                    file_url: string;
                    file_type: string;
                    file_size: number;
                    storage_path: string;
                    uploaded_at?: string;
                    processing_status?:
                        | 'uploaded'
                        | 'processing'
                        | 'processed'
                        | 'failed';
                    metadata?: Json;
                };
                Update: {
                    id?: string;
                    assessment_id?: string;
                    file_name?: string;
                    file_url?: string;
                    file_type?: string;
                    file_size?: number;
                    storage_path?: string;
                    uploaded_at?: string;
                    processing_status?:
                        | 'uploaded'
                        | 'processing'
                        | 'processed'
                        | 'failed';
                    metadata?: Json;
                };
            };
            sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    token: string;
                    expires_at: string;
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    token: string;
                    expires_at: string;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    token?: string;
                    expires_at?: string;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
            };
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    role: 'super_admin' | 'admin' | 'assessor' | 'read_only' | 'reviewer' | 'manager';
                    two_factor_enabled: boolean;
                    last_login: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    name: string;
                    role: 'super_admin' | 'admin' | 'assessor' | 'read_only' | 'reviewer' | 'manager';
                    two_factor_enabled?: boolean;
                    last_login?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    role?: 'super_admin' | 'admin' | 'assessor' | 'read_only' | 'reviewer' | 'manager';
                    two_factor_enabled?: boolean;
                    last_login?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            audit_logs: {
                Row: {
                    id: string;
                    user_id: string | null;
                    action: string;
                    resource_type: string | null;
                    resource_id: string | null;
                    details: Json | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    success: boolean;
                    error_message: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    action: string;
                    resource_type?: string | null;
                    resource_id?: string | null;
                    details?: Json | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    success?: boolean;
                    error_message?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    action?: string;
                    resource_type?: string | null;
                    resource_id?: string | null;
                    details?: Json | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    success?: boolean;
                    error_message?: string | null;
                    created_at?: string;
                };
            };
            complaints: {
                Row: {
                    id: string;
                    complaint_number: string;
                    complainant_name: string;
                    complainant_email: string;
                    complainant_phone: string | null;
                    category: 'service_quality' | 'delayed_response' | 'incorrect_assessment' | 'billing_issue' | 'communication' | 'data_privacy' | 'other';
                    priority: 'critical' | 'high' | 'medium' | 'low';
                    description: string;
                    status: 'new' | 'under_investigation' | 'resolved' | 'closed';
                    assessment_id: string | null;
                    internal_notes: string | null;
                    assigned_to: string | null;
                    created_at: string;
                    updated_at: string;
                    resolved_at: string | null;
                    closed_at: string | null;
                    sla_deadline: string | null;
                    sla_breached: boolean;
                    metadata: Json | null;
                };
                Insert: {
                    id?: string;
                    complaint_number?: string;
                    complainant_name: string;
                    complainant_email: string;
                    complainant_phone?: string | null;
                    category: 'service_quality' | 'delayed_response' | 'incorrect_assessment' | 'billing_issue' | 'communication' | 'data_privacy' | 'other';
                    priority?: 'critical' | 'high' | 'medium' | 'low';
                    description: string;
                    status?: 'new' | 'under_investigation' | 'resolved' | 'closed';
                    assessment_id?: string | null;
                    internal_notes?: string | null;
                    assigned_to?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    resolved_at?: string | null;
                    closed_at?: string | null;
                    sla_deadline?: string | null;
                    sla_breached?: boolean;
                    metadata?: Json | null;
                };
                Update: {
                    id?: string;
                    complaint_number?: string;
                    complainant_name?: string;
                    complainant_email?: string;
                    complainant_phone?: string | null;
                    category?: 'service_quality' | 'delayed_response' | 'incorrect_assessment' | 'billing_issue' | 'communication' | 'data_privacy' | 'other';
                    priority?: 'critical' | 'high' | 'medium' | 'low';
                    description?: string;
                    status?: 'new' | 'under_investigation' | 'resolved' | 'closed';
                    assessment_id?: string | null;
                    internal_notes?: string | null;
                    assigned_to?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    resolved_at?: string | null;
                    closed_at?: string | null;
                    sla_deadline?: string | null;
                    sla_breached?: boolean;
                    metadata?: Json | null;
                };
            };
            complaint_messages: {
                Row: {
                    id: string;
                    complaint_id: string;
                    sender_id: string | null;
                    sender_type: 'admin' | 'complainant' | 'system';
                    message: string;
                    is_internal: boolean;
                    created_at: string;
                    metadata: Json | null;
                };
                Insert: {
                    id?: string;
                    complaint_id: string;
                    sender_id?: string | null;
                    sender_type: 'admin' | 'complainant' | 'system';
                    message: string;
                    is_internal?: boolean;
                    created_at?: string;
                    metadata?: Json | null;
                };
                Update: {
                    id?: string;
                    complaint_id?: string;
                    sender_id?: string | null;
                    sender_type?: 'admin' | 'complainant' | 'system';
                    message?: string;
                    is_internal?: boolean;
                    created_at?: string;
                    metadata?: Json | null;
                };
            };
            complaint_attachments: {
                Row: {
                    id: string;
                    complaint_id: string;
                    file_name: string;
                    file_size: number;
                    file_type: string;
                    storage_path: string;
                    uploaded_by: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    complaint_id: string;
                    file_name: string;
                    file_size: number;
                    file_type: string;
                    storage_path: string;
                    uploaded_by?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    complaint_id?: string;
                    file_name?: string;
                    file_size?: number;
                    file_type?: string;
                    storage_path?: string;
                    uploaded_by?: string | null;
                    created_at?: string;
                };
            };
            supplementary_requests: {
                Row: {
                    id: string;
                    original_assessment_id: string;
                    supplementary_number: number;
                    amount: number;
                    pdf_path: string | null;
                    ai_recommendation: string | null;
                    ai_confidence: number | null;
                    status: 'pending' | 'approved' | 'rejected' | 'under_review';
                    reviewed_by: string | null;
                    reviewed_at: string | null;
                    notes: string | null;
                    metadata: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    original_assessment_id: string;
                    supplementary_number?: number;
                    amount?: number;
                    pdf_path?: string | null;
                    ai_recommendation?: string | null;
                    ai_confidence?: number | null;
                    status?: 'pending' | 'approved' | 'rejected' | 'under_review';
                    reviewed_by?: string | null;
                    reviewed_at?: string | null;
                    notes?: string | null;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    original_assessment_id?: string;
                    supplementary_number?: number;
                    amount?: number;
                    pdf_path?: string | null;
                    ai_recommendation?: string | null;
                    ai_confidence?: number | null;
                    status?: 'pending' | 'approved' | 'rejected' | 'under_review';
                    reviewed_by?: string | null;
                    reviewed_at?: string | null;
                    notes?: string | null;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            review_queue: {
                Row: {
                    id: string;
                    assessment_id: string | null;
                    quote_request_id: string | null;
                    spam_score: number;
                    recaptcha_score: number | null;
                    review_reason: string;
                    status: 'pending' | 'approved' | 'rejected' | 'more_info_requested';
                    assigned_to: string | null;
                    reviewed_by: string | null;
                    reviewed_at: string | null;
                    admin_notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    assessment_id?: string | null;
                    quote_request_id?: string | null;
                    spam_score?: number;
                    recaptcha_score?: number | null;
                    review_reason: string;
                    status?: 'pending' | 'approved' | 'rejected' | 'more_info_requested';
                    assigned_to?: string | null;
                    reviewed_by?: string | null;
                    reviewed_at?: string | null;
                    admin_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    assessment_id?: string | null;
                    quote_request_id?: string | null;
                    spam_score?: number;
                    recaptcha_score?: number | null;
                    review_reason?: string;
                    status?: 'pending' | 'approved' | 'rejected' | 'more_info_requested';
                    assigned_to?: string | null;
                    reviewed_by?: string | null;
                    reviewed_at?: string | null;
                    admin_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            email_filters: {
                Row: {
                    id: string;
                    type: 'whitelist' | 'blacklist';
                    email_domain: string | null;
                    email_address: string | null;
                    reason: string | null;
                    created_by: string | null;
                    created_at: string;
                    updated_at: string;
                    is_active: boolean;
                };
                Insert: {
                    id?: string;
                    type: 'whitelist' | 'blacklist';
                    email_domain?: string | null;
                    email_address?: string | null;
                    reason?: string | null;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    is_active?: boolean;
                };
                Update: {
                    id?: string;
                    type?: 'whitelist' | 'blacklist';
                    email_domain?: string | null;
                    email_address?: string | null;
                    reason?: string | null;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    is_active?: boolean;
                };
            };
            email_quarantine: {
                Row: {
                    id: string;
                    email_from: string;
                    email_subject: string | null;
                    email_body: string | null;
                    email_html: string | null;
                    spam_score: number;
                    spam_flags: string[];
                    reason: string;
                    email_uid: number | null;
                    attachments_count: number;
                    raw_email_data: Json | null;
                    reviewed_by: string | null;
                    reviewed_at: string | null;
                    review_action: 'approve' | 'reject' | 'pending' | null;
                    review_notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email_from: string;
                    email_subject?: string | null;
                    email_body?: string | null;
                    email_html?: string | null;
                    spam_score?: number;
                    spam_flags?: string[];
                    reason: string;
                    email_uid?: number | null;
                    attachments_count?: number;
                    raw_email_data?: Json | null;
                    reviewed_by?: string | null;
                    reviewed_at?: string | null;
                    review_action?: 'approve' | 'reject' | 'pending' | null;
                    review_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email_from?: string;
                    email_subject?: string | null;
                    email_body?: string | null;
                    email_html?: string | null;
                    spam_score?: number;
                    spam_flags?: string[];
                    reason?: string;
                    email_uid?: number | null;
                    attachments_count?: number;
                    raw_email_data?: Json | null;
                    reviewed_by?: string | null;
                    reviewed_at?: string | null;
                    review_action?: 'approve' | 'reject' | 'pending' | null;
                    review_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type: 'assessment_new' | 'assessment_overdue' | 'complaint_new' | 'system_error' | 'status_change' | 'submission_received';
                    title: string;
                    message: string;
                    resource_type: string | null;
                    resource_id: string | null;
                    priority: 'low' | 'medium' | 'high' | 'critical';
                    metadata: Json;
                    is_read: boolean;
                    read_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: 'assessment_new' | 'assessment_overdue' | 'complaint_new' | 'system_error' | 'status_change' | 'submission_received';
                    title: string;
                    message: string;
                    resource_type?: string | null;
                    resource_id?: string | null;
                    priority?: 'low' | 'medium' | 'high' | 'critical';
                    metadata?: Json;
                    is_read?: boolean;
                    read_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: 'assessment_new' | 'assessment_overdue' | 'complaint_new' | 'system_error' | 'status_change' | 'submission_received';
                    title?: string;
                    message?: string;
                    resource_type?: string | null;
                    resource_id?: string | null;
                    priority?: 'low' | 'medium' | 'high' | 'critical';
                    metadata?: Json;
                    is_read?: boolean;
                    read_at?: string | null;
                    created_at?: string;
                };
            };
            email_processing: {
                Row: {
                    id: string;
                    email_provider_id: string;
                    email_provider_type: 'microsoft_graph' | 'imap';
                    folder_name: string | null;
                    email_from: string;
                    email_from_name: string | null;
                    email_to: string | null;
                    email_subject: string | null;
                    email_received_at: string | null;
                    email_message_id: string | null;
                    email_has_attachments: boolean | null;
                    email_attachments_count: number | null;
                    processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped' | 'duplicate' | 'quarantined' | 'filtered';
                    processing_method: 'graph_api' | 'imap' | null;
                    processing_started_at: string | null;
                    processing_completed_at: string | null;
                    processing_duration_ms: number | null;
                    assessment_id: string | null;
                    assessment_created: boolean | null;
                    error_message: string | null;
                    error_type: string | null;
                    error_stack: string | null;
                    retry_count: number | null;
                    retry_after: string | null;
                    spam_score: number | null;
                    spam_flags: string[] | null;
                    is_spam: boolean | null;
                    is_whitelisted: boolean | null;
                    is_blacklisted: boolean | null;
                    extracted_data: Json | null;
                    extraction_confidence: number | null;
                    raw_email_data: Json | null;
                    email_body_preview: string | null;
                    request_id: string | null;
                    processed_by_user_id: string | null;
                    processing_batch_id: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                    metadata: Json | null;
                };
                Insert: {
                    id?: string;
                    email_provider_id: string;
                    email_provider_type: 'microsoft_graph' | 'imap';
                    folder_name?: string | null;
                    email_from: string;
                    email_from_name?: string | null;
                    email_to?: string | null;
                    email_subject?: string | null;
                    email_received_at?: string | null;
                    email_message_id?: string | null;
                    email_has_attachments?: boolean | null;
                    email_attachments_count?: number | null;
                    processing_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped' | 'duplicate' | 'quarantined' | 'filtered';
                    processing_method?: 'graph_api' | 'imap' | null;
                    processing_started_at?: string | null;
                    processing_completed_at?: string | null;
                    processing_duration_ms?: number | null;
                    assessment_id?: string | null;
                    assessment_created?: boolean | null;
                    error_message?: string | null;
                    error_type?: string | null;
                    error_stack?: string | null;
                    retry_count?: number | null;
                    retry_after?: string | null;
                    spam_score?: number | null;
                    spam_flags?: string[] | null;
                    is_spam?: boolean | null;
                    is_whitelisted?: boolean | null;
                    is_blacklisted?: boolean | null;
                    extracted_data?: Json | null;
                    extraction_confidence?: number | null;
                    raw_email_data?: Json | null;
                    email_body_preview?: string | null;
                    request_id?: string | null;
                    processed_by_user_id?: string | null;
                    processing_batch_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    metadata?: Json | null;
                };
                Update: {
                    id?: string;
                    email_provider_id?: string;
                    email_provider_type?: 'microsoft_graph' | 'imap';
                    folder_name?: string | null;
                    email_from?: string;
                    email_from_name?: string | null;
                    email_to?: string | null;
                    email_subject?: string | null;
                    email_received_at?: string | null;
                    email_message_id?: string | null;
                    email_has_attachments?: boolean | null;
                    email_attachments_count?: number | null;
                    processing_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped' | 'duplicate' | 'quarantined' | 'filtered';
                    processing_method?: 'graph_api' | 'imap' | null;
                    processing_started_at?: string | null;
                    processing_completed_at?: string | null;
                    processing_duration_ms?: number | null;
                    assessment_id?: string | null;
                    assessment_created?: boolean | null;
                    error_message?: string | null;
                    error_type?: string | null;
                    error_stack?: string | null;
                    retry_count?: number | null;
                    retry_after?: string | null;
                    spam_score?: number | null;
                    spam_flags?: string[] | null;
                    is_spam?: boolean | null;
                    is_whitelisted?: boolean | null;
                    is_blacklisted?: boolean | null;
                    extracted_data?: Json | null;
                    extraction_confidence?: number | null;
                    raw_email_data?: Json | null;
                    email_body_preview?: string | null;
                    request_id?: string | null;
                    processed_by_user_id?: string | null;
                    processing_batch_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    metadata?: Json | null;
                };
            };
        };
        Functions: {
            get_assessment_full: {
                Args: { assessment_uuid: string };
                Returns: {
                    assessment: Json;
                    files: Json;
                }[];
            };
            search_assessments: {
                Args: { search_query: string };
                Returns: {
                    id: string;
                    company_name: string;
                    your_name: string;
                    make: string;
                    model: string;
                    registration: string;
                    created_at: string;
                    rank: number;
                }[];
            };
            mark_notification_read: {
                Args: { notification_id: string; user_id_param: string };
                Returns: boolean;
            };
            mark_all_notifications_read: {
                Args: { user_id_param: string };
                Returns: number;
            };
            get_email_processing_stats: {
                Args: {
                    start_date?: string;
                    end_date?: string;
                };
                Returns: {
                    total_processed: number;
                    successful: number;
                    failed: number;
                    skipped: number;
                    duplicates: number;
                    quarantined: number;
                    assessments_created: number;
                    avg_processing_time_ms: number;
                    spam_detected: number;
                }[];
            };
            get_emails_ready_for_retry: {
                Args: { max_retries?: number };
                Returns: {
                    id: string;
                    email_provider_id: string;
                    email_provider_type: string;
                    retry_count: number;
                    error_message: string | null;
                    raw_email_data: Json | null;
                }[];
            };
        };
    };
}

// =============================================
// Application-level Types
// =============================================

export interface OwnerInfo {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    altPhone?: string;
    address?: string;
}

export interface LocationInfo {
    type?: string;
    name?: string;
    streetAddress?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    preferredDate?: string;
    preferredTime?: string;
    accessInstructions?: string;
}

export interface AssessmentFormData {
    // Section 1
    companyName: string;
    yourName: string;
    yourEmail: string;
    yourPhone: string;
    yourRole?: string;
    department?: string;

    // Section 2
    assessmentType?: 'Desktop Assessment' | 'Onsite Assessment' | '';
    claimReference?: string;
    policyNumber?: string;
    incidentDate?: string;
    incidentLocation?: string;

    // Section 3
    vehicleType?: string;
    year?: string;
    make: string;
    model: string;
    registration?: string;
    vin?: string;
    color?: string;
    odometer?: string;
    insuranceValueType?: string;
    insuranceValueAmount?: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
    ownerMobile: string;
    ownerAltPhone?: string;
    ownerAddress?: string;
    onsiteLocationType: string;
    locationName: string;
    streetAddress?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    locationContactName?: string;
    locationPhone?: string;
    locationEmail?: string;
    preferredDate?: string;
    preferredTime?: string;
    accessInstructions?: string;

    // Section 4
    ownerInfo?: OwnerInfo;

    // Section 5
    locationInfo?: LocationInfo;

    // Section 7
    incidentDescription?: string;
    damageAreas: string[];
    specialInstructions?: string;
    internalNotes?: string;

    // Section 8
    authorityConfirmed: boolean;
    privacyConsent: boolean;
    emailReportConsent: boolean;
    smsUpdates: boolean;
}

export interface FormErrors {
    [key: string]: string;
}

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
    preview?: string;
    uploadProgress?: number;
}

export interface AssessmentResponse {
    assessment: Database['public']['Tables']['assessments']['Row'];
    files: Database['public']['Tables']['uploaded_files']['Row'][];
}


// interface FormData {
//     companyName: string;
//     yourName: string;
//     yourEmail: string;
//     yourPhone: string;
//     yourRole: string;
//     department: string;
//     assessmentType: string;
//     claimReference: string;
//     policyNumber: string;
//     incidentDate: string;
//     incidentLocation: string;
//     vehicleType: string;
//     year: string;
//     make: string;
//     model: string;
//     registration: string;
//     vin: string;
//     color: string;
//     odometer: string;
//     insuranceValueType: string;
//     insuranceValueAmount: string;
//     ownerFirstName: string;
//     ownerLastName: string;
//     ownerEmail: string;
//     ownerMobile: string;
//     ownerAltPhone: string;
//     ownerAddress: string;
//     onsiteLocationType: string;
//     locationName: string;
//     streetAddress: string;
//     suburb: string;
//     state: string;
//     postcode: string;
//     locationContactName: string;
//     locationPhone: string;
//     locationEmail: string;
//     preferredDate: string;
//     preferredTime: string;
//     accessInstructions: string;
//     incidentDescription: string;
//     damageAreas: string[];
//     specialInstructions: string;
//     internalNotes: string;
//     authorityConfirmed: boolean;
//     privacyConsent: boolean;
//     emailReportConsent: boolean;
//     smsUpdates: boolean;
// }


// interface UploadedFile {
//     id: string;
//     name: string;
//     size: number;
//     type: string;
//     file: File;
//     preview?: string;
//     uploadProgress?: number;
// }