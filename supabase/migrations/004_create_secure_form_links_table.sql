-- =============================================
-- Migration: Create secure_form_links table
-- =============================================

CREATE TABLE IF NOT EXISTS secure_form_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,
    quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    used_by_ip TEXT,
    used_by_user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_secure_form_links_token ON secure_form_links(token);
CREATE INDEX IF NOT EXISTS idx_secure_form_links_quote_request_id ON secure_form_links(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_secure_form_links_assessment_id ON secure_form_links(assessment_id);
CREATE INDEX IF NOT EXISTS idx_secure_form_links_expires_at ON secure_form_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_secure_form_links_is_used ON secure_form_links(is_used, expires_at);

-- Add comments
COMMENT ON TABLE secure_form_links IS 'Secure token-based links for form access';
COMMENT ON COLUMN secure_form_links.token IS 'Unique secure token for form access';
COMMENT ON COLUMN secure_form_links.expires_at IS 'When the link expires';
COMMENT ON COLUMN secure_form_links.is_used IS 'Whether the link has been used';
COMMENT ON COLUMN secure_form_links.metadata IS 'Additional metadata about the link';

