-- =============================================
-- Migration: Create complaints table
-- REQ-56 to REQ-79: Complaint System
-- =============================================

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number TEXT NOT NULL UNIQUE,
    complainant_name TEXT NOT NULL,
    complainant_email TEXT NOT NULL,
    complainant_phone TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'service_quality',
        'delayed_response',
        'incorrect_assessment',
        'billing_issue',
        'communication',
        'data_privacy',
        'other'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_investigation', 'resolved', 'closed')),
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    internal_notes TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_assessment_id ON complaints(assessment_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_sla_deadline ON complaints(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_complaints_sla_breached ON complaints(sla_breached);
CREATE INDEX IF NOT EXISTS idx_complaints_complainant_email ON complaints(complainant_email);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_complaints_status_priority ON complaints(status, priority);
CREATE INDEX IF NOT EXISTS idx_complaints_status_created ON complaints(status, created_at);

-- Function to generate complaint number (COMP-YYYY-XXX)
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    complaint_num TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(complaint_number FROM 10) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM complaints
    WHERE complaint_number LIKE 'COMP-' || year_part || '-%';
    
    -- Format: COMP-YYYY-XXX (3-digit sequence)
    complaint_num := 'COMP-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN complaint_num;
END;
$$;

-- Function to calculate SLA deadline based on priority
CREATE OR REPLACE FUNCTION calculate_sla_deadline(priority_level TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
    deadline TIMESTAMPTZ;
BEGIN
    deadline := NOW();
    
    CASE priority_level
        WHEN 'critical' THEN
            deadline := deadline + INTERVAL '4 hours';
        WHEN 'high' THEN
            deadline := deadline + INTERVAL '24 hours';
        WHEN 'medium' THEN
            deadline := deadline + INTERVAL '48 hours';
        WHEN 'low' THEN
            deadline := deadline + INTERVAL '72 hours';
        ELSE
            deadline := deadline + INTERVAL '48 hours'; -- Default to medium
    END CASE;
    
    RETURN deadline;
END;
$$;

-- Trigger to auto-generate complaint number on insert
CREATE OR REPLACE FUNCTION set_complaint_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.complaint_number IS NULL OR NEW.complaint_number = '' THEN
        NEW.complaint_number := generate_complaint_number();
    END IF;
    
    -- Set SLA deadline if not set
    IF NEW.sla_deadline IS NULL THEN
        NEW.sla_deadline := calculate_sla_deadline(NEW.priority);
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_complaint_number
    BEFORE INSERT ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION set_complaint_number();

-- Trigger to update updated_at on update
CREATE OR REPLACE FUNCTION update_complaint_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    
    -- Set resolved_at when status changes to resolved
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at := NOW();
    END IF;
    
    -- Set closed_at when status changes to closed
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        NEW.closed_at := NOW();
    END IF;
    
    -- Check for SLA breach
    IF NEW.sla_deadline IS NOT NULL AND NOW() > NEW.sla_deadline AND NEW.status NOT IN ('resolved', 'closed') THEN
        NEW.sla_breached := true;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_complaint_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_complaint_updated_at();

-- Add comments
COMMENT ON TABLE complaints IS 'Complaint management system (REQ-56 to REQ-79)';
COMMENT ON COLUMN complaints.complaint_number IS 'Unique complaint number format: COMP-YYYY-XXX (REQ-58)';
COMMENT ON COLUMN complaints.priority IS 'Priority level: critical (4hrs), high (24hrs), medium (48hrs), low (72hrs) (REQ-77)';
COMMENT ON COLUMN complaints.status IS 'Complaint status: new → under_investigation → resolved → closed (REQ-64)';
COMMENT ON COLUMN complaints.sla_deadline IS 'SLA deadline based on priority (REQ-77)';
COMMENT ON COLUMN complaints.sla_breached IS 'Whether SLA deadline has been breached (REQ-79)';

