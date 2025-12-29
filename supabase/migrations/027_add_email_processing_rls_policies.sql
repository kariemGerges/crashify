-- =============================================
-- Migration: Add RLS policies for email_processing table
-- Enterprise-level security for email processing data
-- =============================================

-- Enable RLS on email_processing table
ALTER TABLE email_processing ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for email_processing
-- =============================================

-- Policy: Super admins and admins can access all email processing records
CREATE POLICY "admins_all_access_email_processing"
ON email_processing FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin')
    )
);

-- Policy: Reviewers and managers can view email processing records (read-only)
CREATE POLICY "staff_view_email_processing"
ON email_processing FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('reviewer', 'manager')
    )
);

-- Policy: Reviewers and managers can update email processing records (for retry, status updates)
CREATE POLICY "staff_update_email_processing"
ON email_processing FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('reviewer', 'manager')
    )
);

-- Policy: Read-only users can view email processing records (read-only)
CREATE POLICY "read_only_view_email_processing"
ON email_processing FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'read_only'
    )
);

-- Policy: Service role (server) can access all email processing records
-- Note: Service role bypasses RLS by default, but this makes it explicit
-- This is needed for server-side email processing operations

-- Add comments
COMMENT ON POLICY "admins_all_access_email_processing" ON email_processing IS 
    'Super admins and admins have full access to all email processing records';
COMMENT ON POLICY "staff_view_email_processing" ON email_processing IS 
    'Reviewers and managers can view email processing records';
COMMENT ON POLICY "staff_update_email_processing" ON email_processing IS 
    'Reviewers and managers can update email processing records for retry and status updates';
COMMENT ON POLICY "read_only_view_email_processing" ON email_processing IS 
    'Read-only users can view email processing records';

