-- =============================================
-- Migration: Create clients table (optional but useful)
-- =============================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL UNIQUE,
    contact_name TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    domain TEXT,
    is_trusted BOOLEAN DEFAULT TRUE,
    portal_token TEXT,
    portal_enabled BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_contact_email ON clients(contact_email);
CREATE INDEX IF NOT EXISTS idx_clients_domain ON clients(domain);
CREATE INDEX IF NOT EXISTS idx_clients_is_trusted ON clients(is_trusted);
CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON clients(portal_token);

-- Add comments
COMMENT ON TABLE clients IS 'Directory of insurance company clients';
COMMENT ON COLUMN clients.domain IS 'Email domain for auto-detection';
COMMENT ON COLUMN clients.portal_token IS 'Token for portal access';
COMMENT ON COLUMN clients.portal_enabled IS 'Whether portal access is enabled';

