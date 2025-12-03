-- =============================================
-- Migration: Allow anonymous users to insert complaints
-- REQ-56: Public complaint submission
-- =============================================

-- Policy: Allow anonymous/public users to insert complaints
-- This allows unauthenticated users to submit complaints through the public form
-- The API route already validates CSRF tokens, form data, and other security measures
CREATE POLICY "public_insert_complaints"
ON complaints FOR INSERT
WITH CHECK (true);

-- Also allow anonymous users to insert complaint attachments
-- This is needed when users upload files with their complaint
CREATE POLICY "public_insert_complaint_attachments"
ON complaint_attachments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM complaints
        WHERE complaints.id = complaint_attachments.complaint_id
        AND complaints.status = 'new'
    )
);

