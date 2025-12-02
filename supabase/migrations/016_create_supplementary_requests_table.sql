-- =============================================
-- Migration: Create supplementary_requests table
-- REQ-138 to REQ-147: Supplementary Requests System
-- =============================================

CREATE TABLE IF NOT EXISTS supplementary_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    supplementary_number INTEGER NOT NULL DEFAULT 1,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    pdf_path TEXT,
    ai_recommendation TEXT,
    ai_confidence DECIMAL(5, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to get next supplementary number for an assessment
CREATE OR REPLACE FUNCTION get_next_supplementary_number(assessment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(supplementary_number), 0) + 1
    INTO next_num
    FROM supplementary_requests
    WHERE original_assessment_id = assessment_id;
    
    RETURN next_num;
END;
$$;

-- Trigger to auto-set supplementary number
CREATE OR REPLACE FUNCTION set_supplementary_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.supplementary_number IS NULL OR NEW.supplementary_number = 0 THEN
        NEW.supplementary_number := get_next_supplementary_number(NEW.original_assessment_id);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_supplementary_number
    BEFORE INSERT ON supplementary_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_supplementary_number();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_supplementary_requests_assessment_id ON supplementary_requests(original_assessment_id);
CREATE INDEX IF NOT EXISTS idx_supplementary_requests_status ON supplementary_requests(status);
CREATE INDEX IF NOT EXISTS idx_supplementary_requests_created_at ON supplementary_requests(created_at);

-- Add comments
COMMENT ON TABLE supplementary_requests IS 'Supplementary quote requests linked to original assessments (REQ-138-147)';
COMMENT ON COLUMN supplementary_requests.supplementary_number IS 'Sequential number for this assessment (1st, 2nd, etc.)';
COMMENT ON COLUMN supplementary_requests.ai_recommendation IS 'AI recommendation from Claude (REQ-144)';
COMMENT ON COLUMN supplementary_requests.ai_confidence IS 'AI confidence score (0-100)';

