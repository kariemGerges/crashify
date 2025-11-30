-- =============================================
-- Migration: Create repairers table (optional but useful)
-- =============================================

CREATE TABLE IF NOT EXISTS repairers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    suburb TEXT,
    state TEXT,
    postcode TEXT,
    abn TEXT,
    is_trusted BOOLEAN DEFAULT FALSE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_repairers_email ON repairers(email);
CREATE INDEX IF NOT EXISTS idx_repairers_name ON repairers(name);
CREATE INDEX IF NOT EXISTS idx_repairers_is_trusted ON repairers(is_trusted);

-- Add comments
COMMENT ON TABLE repairers IS 'Directory of repairers for quick reference';
COMMENT ON COLUMN repairers.is_trusted IS 'Whether this is a trusted/preferred repairer';

