-- =============================================
-- Migration: Create audit_logs table
-- REQ-136: Audit log all actions
-- REQ-137: Retain audit logs for 12 months
-- =============================================

-- Drop table if it exists (to handle any previous failed migrations)
-- WARNING: This will delete all existing audit logs!
-- Comment out the DROP line if you want to preserve existing data
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create audit_logs table
-- Note: user_id is a UUID that can reference either auth.users or public.users
-- We don't add a foreign key constraint to avoid schema dependency issues
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- References auth.users(id) or public.users(id) - no FK constraint to avoid migration order issues
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_action ON audit_logs(created_at, action);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all system actions (REQ-136)';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (null for system actions)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., assessment, user, complaint)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource affected';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action (JSON)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string';
COMMENT ON COLUMN audit_logs.success IS 'Whether the action was successful';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if action failed';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when the action occurred';

-- Function to automatically delete logs older than 12 months (REQ-137)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '12 months';
END;
$$;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- Note: This requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs();');

-- Manual cleanup can be run with:
-- SELECT cleanup_old_audit_logs();
