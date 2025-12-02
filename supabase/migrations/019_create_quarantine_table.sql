-- =============================================
-- Migration: Create email_quarantine table
-- REQ-6: Quarantine suspicious emails for review
-- =============================================

DROP TABLE IF EXISTS email_quarantine CASCADE;

CREATE TABLE IF NOT EXISTS email_quarantine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_from TEXT NOT NULL,
    email_subject TEXT,
    email_body TEXT,
    email_html TEXT,
    spam_score INTEGER NOT NULL DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100),
    spam_flags TEXT[] DEFAULT '{}',
    reason TEXT NOT NULL,
    email_uid INTEGER, -- IMAP UID if available
    attachments_count INTEGER DEFAULT 0,
    raw_email_data JSONB,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_action TEXT CHECK (review_action IN ('approve', 'reject', 'pending')),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_quarantine_email_from ON email_quarantine(email_from);
CREATE INDEX IF NOT EXISTS idx_email_quarantine_spam_score ON email_quarantine(spam_score);
CREATE INDEX IF NOT EXISTS idx_email_quarantine_review_action ON email_quarantine(review_action);
CREATE INDEX IF NOT EXISTS idx_email_quarantine_created_at ON email_quarantine(created_at);
CREATE INDEX IF NOT EXISTS idx_email_quarantine_reviewed_by ON email_quarantine(reviewed_by);

-- Add comments
COMMENT ON TABLE email_quarantine IS 'Quarantined suspicious emails for manual review (REQ-6)';
COMMENT ON COLUMN email_quarantine.spam_score IS 'Spam score 0-100, higher is more suspicious';
COMMENT ON COLUMN email_quarantine.spam_flags IS 'Array of spam detection flags';
COMMENT ON COLUMN email_quarantine.reason IS 'Reason for quarantining the email';
COMMENT ON COLUMN email_quarantine.review_action IS 'Action taken during review: approve, reject, or pending';

