-- =============================================
-- Migration: Create complaint_messages table
-- REQ-71: Allow admin to send messages to complainant
-- =============================================

CREATE TABLE IF NOT EXISTS complaint_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'complainant', 'system')),
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint_id ON complaint_messages(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_messages_sender_id ON complaint_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_complaint_messages_created_at ON complaint_messages(created_at);

-- Add comments
COMMENT ON TABLE complaint_messages IS 'Messages between admin and complainant (REQ-71)';
COMMENT ON COLUMN complaint_messages.is_internal IS 'If true, message is internal note only (not visible to complainant)';

