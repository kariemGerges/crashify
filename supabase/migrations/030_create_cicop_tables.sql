-- ============================================================================
-- CRASHIFY INTEGRATED CLAIMS OPERATIONS PLATFORM (CICOP) - Database Schema
-- ============================================================================

-- Assessment Data Table (main table for 458+ assessments with 111+ fields)
CREATE TABLE IF NOT EXISTS cicop_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_no INTEGER UNIQUE NOT NULL,
    
    -- Basic Information
    claim_number TEXT,
    date_received DATE,
    status TEXT DEFAULT 'In Progress',
    client TEXT,
    insurer TEXT,
    
    -- Vehicle Information
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    rego TEXT,
    vin TEXT,
    vehicle_type TEXT,
    
    -- Customer Information
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    customer_address TEXT,
    
    -- Assessment Details
    assessment_type TEXT, -- Desktop, On-site, etc.
    inspection_type TEXT,
    inspection_location TEXT,
    assessor_name TEXT,
    assessment_date DATE,
    
    -- Financial Information
    repairer_quote DECIMAL(10, 2),
    crashify_assessed DECIMAL(10, 2),
    total_actual_cost DECIMAL(10, 2),
    savings DECIMAL(10, 2),
    
    -- Damage Information
    damage_description TEXT,
    damage_severity TEXT,
    damage_location TEXT,
    parts_required TEXT[],
    labour_hours DECIMAL(6, 2),
    
    -- Risk & Fraud
    risk_level TEXT,
    fraud_indicators TEXT[],
    total_loss BOOLEAN DEFAULT false,
    
    -- Repairer Information
    repairer_name TEXT,
    repairer_compliance_score INTEGER,
    
    -- Photos & Documents
    photos TEXT[], -- Array of photo URLs
    documents TEXT[], -- Array of document URLs
    
    -- Status & Workflow
    workflow_stage TEXT,
    priority TEXT,
    assigned_to TEXT,
    
    -- Metadata
    data_completeness DECIMAL(5, 2), -- Percentage
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB, -- Store any additional dynamic fields
    
    -- Audit
    created_by TEXT,
    updated_by TEXT
);

-- Processed Emails Table (deduplication & tracking)
CREATE TABLE IF NOT EXISTS cicop_processed_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_id TEXT UNIQUE NOT NULL,
    message_id_hash TEXT,
    thread_id TEXT,
    claim_reference TEXT,
    sender TEXT NOT NULL,
    subject TEXT,
    processed_at TIMESTAMP DEFAULT NOW(),
    is_complaint BOOLEAN DEFAULT false,
    is_follow_up BOOLEAN DEFAULT false,
    
    -- Indexes
    CONSTRAINT unique_email_id UNIQUE (email_id)
);

CREATE INDEX IF NOT EXISTS idx_cicop_emails_message_id ON cicop_processed_emails(message_id_hash);
CREATE INDEX IF NOT EXISTS idx_cicop_emails_thread ON cicop_processed_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_cicop_emails_claim ON cicop_processed_emails(claim_reference);

-- SLA Tracking Table
CREATE TABLE IF NOT EXISTS cicop_sla_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_reference TEXT UNIQUE NOT NULL,
    sender TEXT NOT NULL,
    insurer_domain TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal', -- normal, urgent
    started_at TIMESTAMP DEFAULT NOW(),
    sla_deadline TIMESTAMP NOT NULL,
    sla_hours INTEGER NOT NULL,
    business_hours_only BOOLEAN DEFAULT false,
    responded_at TIMESTAMP,
    breached BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'in_progress', -- in_progress, completed, breached
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cicop_sla_claim ON cicop_sla_tracking(claim_reference);
CREATE INDEX IF NOT EXISTS idx_cicop_sla_deadline ON cicop_sla_tracking(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_cicop_sla_status ON cicop_sla_tracking(status);
CREATE INDEX IF NOT EXISTS idx_cicop_sla_breached ON cicop_sla_tracking(breached);

-- Complaints Table
CREATE TABLE IF NOT EXISTS cicop_complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_reference TEXT,
    vehicle_rego TEXT,
    sender TEXT NOT NULL,
    subject TEXT,
    complaint_type TEXT, -- service_quality, delay, communication, regulatory, other
    severity TEXT, -- low, medium, high
    detected_at TIMESTAMP DEFAULT NOW(),
    alerted BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cicop_complaints_claim ON cicop_complaints(claim_reference);
CREATE INDEX IF NOT EXISTS idx_cicop_complaints_resolved ON cicop_complaints(resolved);
CREATE INDEX IF NOT EXISTS idx_cicop_complaints_severity ON cicop_complaints(severity);

-- Conversations Tracking Table (follow-ups)
CREATE TABLE IF NOT EXISTS cicop_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_reference TEXT NOT NULL,
    conversation_id TEXT UNIQUE NOT NULL,
    sender TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    message_count INTEGER DEFAULT 1,
    requires_human BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active', -- active, resolved, escalated
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cicop_conv_claim ON cicop_conversations(claim_reference);
CREATE INDEX IF NOT EXISTS idx_cicop_conv_status ON cicop_conversations(status);

-- AI Analysis Cache Table (performance & cost optimization)
CREATE TABLE IF NOT EXISTS cicop_ai_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_hash TEXT UNIQUE NOT NULL,
    model_version TEXT NOT NULL,
    prompt_type TEXT NOT NULL,
    response JSONB NOT NULL,
    confidence DECIMAL(3, 2),
    hits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cicop_ai_cache_hash ON cicop_ai_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_cicop_ai_cache_model ON cicop_ai_cache(model_version);

-- Audit Log Table (compliance & traceability)
CREATE TABLE IF NOT EXISTS cicop_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    event_type TEXT NOT NULL,
    actor TEXT,
    claim_reference TEXT,
    action TEXT NOT NULL,
    details JSONB,
    success BOOLEAN DEFAULT true,
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_cicop_audit_timestamp ON cicop_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_cicop_audit_event ON cicop_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_cicop_audit_claim ON cicop_audit_log(claim_reference);

-- Follow-up Drafts Table (AI-generated email drafts)
CREATE TABLE IF NOT EXISTS cicop_follow_up_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_reference TEXT NOT NULL,
    draft_type TEXT NOT NULL, -- acknowledgment, status_update, reminder
    subject TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cicop_drafts_claim ON cicop_follow_up_drafts(claim_reference);

-- Daily Stats Table (performance monitoring)
CREATE TABLE IF NOT EXISTS cicop_daily_stats (
    date DATE PRIMARY KEY,
    emails_processed INTEGER DEFAULT 0,
    acknowledgments_sent INTEGER DEFAULT 0,
    follow_ups_handled INTEGER DEFAULT 0,
    complaints_detected INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    avg_confidence DECIMAL(3, 2),
    sla_breaches INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Templates Configuration Table
CREATE TABLE IF NOT EXISTS cicop_email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT UNIQUE NOT NULL,
    insurer_domain TEXT, -- null for default template
    template_type TEXT NOT NULL, -- acknowledgment, follow_up, complaint_response
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    variables JSONB, -- List of available variables
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- System Configuration Table
CREATE TABLE IF NOT EXISTS cicop_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by TEXT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Assessments indexes
CREATE INDEX IF NOT EXISTS idx_cicop_assess_claim ON cicop_assessments(claim_number);
CREATE INDEX IF NOT EXISTS idx_cicop_assess_rego ON cicop_assessments(rego);
CREATE INDEX IF NOT EXISTS idx_cicop_assess_vin ON cicop_assessments(vin);
CREATE INDEX IF NOT EXISTS idx_cicop_assess_customer ON cicop_assessments(customer_name);
CREATE INDEX IF NOT EXISTS idx_cicop_assess_status ON cicop_assessments(status);
CREATE INDEX IF NOT EXISTS idx_cicop_assess_insurer ON cicop_assessments(insurer);
CREATE INDEX IF NOT EXISTS idx_cicop_assess_date ON cicop_assessments(date_received);
CREATE INDEX IF NOT EXISTS idx_cicop_assess_make ON cicop_assessments(vehicle_make);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_cicop_assess_search ON cicop_assessments USING gin(
    to_tsvector('english', coalesce(claim_number, '') || ' ' || 
                            coalesce(rego, '') || ' ' || 
                            coalesce(customer_name, '') || ' ' ||
                            coalesce(vehicle_make, '') || ' ' ||
                            coalesce(vehicle_model, ''))
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE cicop_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_processed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_follow_up_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicop_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write CICOP tables
CREATE POLICY "Allow authenticated CICOP access" ON cicop_assessments
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated email access" ON cicop_processed_emails
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated SLA access" ON cicop_sla_tracking
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated complaints access" ON cicop_complaints
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated conversations access" ON cicop_conversations
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated AI cache access" ON cicop_ai_cache
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated audit log access" ON cicop_audit_log
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated drafts access" ON cicop_follow_up_drafts
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated stats access" ON cicop_daily_stats
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated templates access" ON cicop_email_templates
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated config access" ON cicop_config
    FOR ALL TO authenticated USING (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cicop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_cicop_assessments_updated_at
    BEFORE UPDATE ON cicop_assessments
    FOR EACH ROW EXECUTE FUNCTION update_cicop_updated_at();

CREATE TRIGGER update_cicop_sla_updated_at
    BEFORE UPDATE ON cicop_sla_tracking
    FOR EACH ROW EXECUTE FUNCTION update_cicop_updated_at();

CREATE TRIGGER update_cicop_complaints_updated_at
    BEFORE UPDATE ON cicop_complaints
    FOR EACH ROW EXECUTE FUNCTION update_cicop_updated_at();

CREATE TRIGGER update_cicop_conversations_updated_at
    BEFORE UPDATE ON cicop_conversations
    FOR EACH ROW EXECUTE FUNCTION update_cicop_updated_at();

-- Function to calculate data completeness
CREATE OR REPLACE FUNCTION calculate_assessment_completeness(assessment_record cicop_assessments)
RETURNS DECIMAL AS $$
DECLARE
    total_fields INTEGER := 30; -- Adjust based on key fields
    filled_fields INTEGER := 0;
BEGIN
    -- Count non-null important fields
    IF assessment_record.claim_number IS NOT NULL AND assessment_record.claim_number != '' THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.customer_name IS NOT NULL AND assessment_record.customer_name != '' THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.vehicle_make IS NOT NULL AND assessment_record.vehicle_make != '' THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.vehicle_model IS NOT NULL AND assessment_record.vehicle_model != '' THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.rego IS NOT NULL AND assessment_record.rego != '' THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.vin IS NOT NULL AND assessment_record.vin != '' THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.insurer IS NOT NULL AND assessment_record.insurer != '' THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.assessment_type IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.crashify_assessed IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF assessment_record.damage_description IS NOT NULL AND assessment_record.damage_description != '' THEN filled_fields := filled_fields + 1; END IF;
    
    -- Add more field checks as needed...
    
    RETURN ROUND((filled_fields::DECIMAL / total_fields) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default email templates
INSERT INTO cicop_email_templates (template_name, insurer_domain, template_type, subject_template, body_template, variables)
VALUES (
    'default_acknowledgment',
    NULL,
    'acknowledgment',
    'Assessment Confirmation - {{claim_reference}}',
    'Dear {{customer_name}},

Thank you for engaging Crashify for your vehicle assessment requirements.

ASSESSMENT DETAILS
Reference: {{claim_reference}}
Vehicle: {{vehicle_details}}
Received: {{date_received}}
Assessment Type: {{assessment_type}}
Status: {{status}}

SERVICE COMMITMENT
Your assessment will be completed within our standard 48-hour service level from instruction receipt.

Best regards,
Crashify Assessment Team',
    '{"claim_reference": "string", "customer_name": "string", "vehicle_details": "string", "date_received": "string", "assessment_type": "string", "status": "string"}'::jsonb
)
ON CONFLICT (template_name) DO NOTHING;

-- Insert initial system configuration
INSERT INTO cicop_config (key, value, description)
VALUES 
    ('sla_default_hours', '48'::jsonb, 'Default SLA hours for all insurers'),
    ('business_hours_enabled', 'false'::jsonb, 'Whether to calculate SLA in business hours only'),
    ('auto_reply_enabled', 'true'::jsonb, 'Enable automatic email replies'),
    ('complaint_auto_alert', 'true'::jsonb, 'Send alerts for detected complaints'),
    ('ai_analysis_enabled', 'true'::jsonb, 'Enable AI analysis for emails')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cicop_assessments IS 'Main table for managing 458+ vehicle assessments with 111+ fields';
COMMENT ON TABLE cicop_sla_tracking IS 'Track SLA deadlines for email responses and claim processing';
COMMENT ON TABLE cicop_complaints IS 'Log and track customer complaints detected via AI';
COMMENT ON TABLE cicop_ai_cache IS 'Cache AI analysis results for performance and cost optimization';
COMMENT ON TABLE cicop_audit_log IS 'Comprehensive audit trail for compliance and debugging';
