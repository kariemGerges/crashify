-- =============================================
-- Migration: Create complaint_attachments table
-- REQ-62: Allow file attachments
-- =============================================

CREATE TABLE IF NOT EXISTS complaint_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_complaint_attachments_complaint_id ON complaint_attachments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_attachments_uploaded_by ON complaint_attachments(uploaded_by);

-- Add comments
COMMENT ON TABLE complaint_attachments IS 'File attachments for complaints (REQ-62)';

