-- =============================================
-- Migration: Add missing fields to assessments table
-- =============================================

-- Add new columns to assessments table
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS entered_iq_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS entered_by TEXT,
ADD COLUMN IF NOT EXISTS iq_controls_reference TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web_form' CHECK (source IN ('web_form', 'email', 'phone', 'portal')),
ADD COLUMN IF NOT EXISTS email_id TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_entered_iq_at ON assessments(entered_iq_at);
CREATE INDEX IF NOT EXISTS idx_assessments_source ON assessments(source);
CREATE INDEX IF NOT EXISTS idx_assessments_email_id ON assessments(email_id);
CREATE INDEX IF NOT EXISTS idx_assessments_payment_id ON assessments(payment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_completed_at ON assessments(completed_at);

-- Add comments for documentation
COMMENT ON COLUMN assessments.entered_iq_at IS 'Timestamp when assessment was entered into IQ Controls';
COMMENT ON COLUMN assessments.entered_by IS 'User ID who entered the assessment into IQ Controls';
COMMENT ON COLUMN assessments.iq_controls_reference IS 'Reference ID from IQ Controls system';
COMMENT ON COLUMN assessments.source IS 'Source of the assessment request: web_form, email, phone, or portal';
COMMENT ON COLUMN assessments.email_id IS 'Email UID if imported from email';
COMMENT ON COLUMN assessments.payment_id IS 'Stripe payment intent ID if paid assessment';
COMMENT ON COLUMN assessments.completed_at IS 'Timestamp when assessment was completed';

