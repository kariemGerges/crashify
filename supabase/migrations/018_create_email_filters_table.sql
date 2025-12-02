-- =============================================
-- Migration: Create email_filters table
-- REQ-4: Email whitelist/blacklist filtering
-- REQ-6: Quarantine suspicious emails
-- =============================================

DROP TABLE IF EXISTS email_filters CASCADE;

CREATE TABLE IF NOT EXISTS email_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('whitelist', 'blacklist')),
    email_domain TEXT,
    email_address TEXT,
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT email_filters_domain_or_address CHECK (
        (email_domain IS NOT NULL AND email_address IS NULL) OR
        (email_domain IS NULL AND email_address IS NOT NULL)
    )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_filters_type ON email_filters(type);
CREATE INDEX IF NOT EXISTS idx_email_filters_email_domain ON email_filters(email_domain);
CREATE INDEX IF NOT EXISTS idx_email_filters_email_address ON email_filters(email_address);
CREATE INDEX IF NOT EXISTS idx_email_filters_is_active ON email_filters(is_active);

-- Add comments
COMMENT ON TABLE email_filters IS 'Email whitelist and blacklist for spam filtering (REQ-4)';
COMMENT ON COLUMN email_filters.type IS 'Type of filter: whitelist or blacklist';
COMMENT ON COLUMN email_filters.email_domain IS 'Email domain to filter (e.g., example.com)';
COMMENT ON COLUMN email_filters.email_address IS 'Specific email address to filter';
COMMENT ON COLUMN email_filters.reason IS 'Reason for adding to filter list';
COMMENT ON COLUMN email_filters.is_active IS 'Whether the filter is currently active';

-- Create function to check if email is whitelisted
CREATE OR REPLACE FUNCTION is_email_whitelisted(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM email_filters
        WHERE type = 'whitelist'
            AND is_active = true
            AND (
                email_address = email_to_check
                OR email_domain = LOWER(SPLIT_PART(email_to_check, '@', 2))
            )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to check if email is blacklisted
CREATE OR REPLACE FUNCTION is_email_blacklisted(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM email_filters
        WHERE type = 'blacklist'
            AND is_active = true
            AND (
                email_address = email_to_check
                OR email_domain = LOWER(SPLIT_PART(email_to_check, '@', 2))
            )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

