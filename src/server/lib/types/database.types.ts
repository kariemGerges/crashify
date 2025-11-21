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
                    deleted_at: string | null;
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
                    deleted_at?: string | null;
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
                    deleted_at?: string | null;
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
            audit_logs: {
                Row: {
                    id: string;
                    assessment_id: string | null;
                    action: string;
                    changed_by: string | null;
                    changed_at: string;
                    old_values: Json | null;
                    new_values: Json | null;
                    ip_address: string | null;
                    user_agent: string | null;
                };
                Insert: {
                    id?: string;
                    assessment_id?: string | null;
                    action: string;
                    changed_by?: string | null;
                    changed_at?: string;
                    old_values?: Json | null;
                    new_values?: Json | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                };
                Update: {
                    id?: string;
                    assessment_id?: string | null;
                    action?: string;
                    changed_by?: string | null;
                    changed_at?: string;
                    old_values?: Json | null;
                    new_values?: Json | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
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
                    role: 'admin' | 'reviewer' | 'manager';
                    two_factor_enabled: boolean;
                    last_login: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    name: string;
                    role: 'admin' | 'reviewer' | 'manager';
                    two_factor_enabled?: boolean;
                    last_login?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    role?: 'admin' | 'reviewer' | 'manager';
                    two_factor_enabled?: boolean;
                    last_login?: string | null;
                    created_at?: string;
                    updated_at?: string;
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