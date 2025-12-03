-- =============================================
-- Migration: Create notifications table
-- REQ-121: In-app notification bell icon
-- =============================================

DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'assessment_new',
        'assessment_overdue',
        'complaint_new',
        'system_error',
        'status_change',
        'submission_received'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Add comments
COMMENT ON TABLE notifications IS 'In-app notifications for users (REQ-121)';
COMMENT ON COLUMN notifications.type IS 'Type of notification';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read';

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = true,
        read_at = NOW()
    WHERE id = notification_id
        AND user_id = user_id_param
        AND is_read = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true,
        read_at = NOW()
    WHERE user_id = user_id_param
        AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

