-- =============================================
-- Migration: Create email_logs table
-- =============================================

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('repairer', 'insurer', 'client', 'admin')),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened')),
    message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_assessment_id ON email_logs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_type ON email_logs(recipient_type);

-- Add comments
COMMENT ON TABLE email_logs IS 'Log of all emails sent by the system';
COMMENT ON COLUMN email_logs.recipient_type IS 'Type of recipient: repairer, insurer, client, or admin';
COMMENT ON COLUMN email_logs.attachments IS 'JSON array of attachment filenames';
COMMENT ON COLUMN email_logs.message_id IS 'Email provider message ID for tracking';
COMMENT ON COLUMN email_logs.metadata IS 'Additional metadata about the email';

