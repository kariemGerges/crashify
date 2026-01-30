-- =====================================================
-- CICOP Tables Cleanup Script
-- Use this to drop all CICOP tables before re-running migration
-- =====================================================

-- Drop policies first
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_assessments;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_processed_emails;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_sla_tracking;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_complaints;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_conversations;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_ai_cache;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_audit_log;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_follow_up_drafts;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_daily_stats;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_email_templates;
DROP POLICY IF EXISTS "Allow authenticated CICOP access" ON cicop_config;

-- Drop triggers
DROP TRIGGER IF EXISTS update_cicop_assessments_updated_at ON cicop_assessments;
DROP TRIGGER IF EXISTS update_cicop_processed_emails_updated_at ON cicop_processed_emails;
DROP TRIGGER IF EXISTS update_cicop_sla_tracking_updated_at ON cicop_sla_tracking;
DROP TRIGGER IF EXISTS update_cicop_complaints_updated_at ON cicop_complaints;
DROP TRIGGER IF EXISTS update_cicop_conversations_updated_at ON cicop_conversations;
DROP TRIGGER IF EXISTS update_cicop_ai_cache_updated_at ON cicop_ai_cache;
DROP TRIGGER IF EXISTS update_cicop_follow_up_drafts_updated_at ON cicop_follow_up_drafts;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_assessment_completeness();

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS cicop_config CASCADE;
DROP TABLE IF EXISTS cicop_email_templates CASCADE;
DROP TABLE IF EXISTS cicop_daily_stats CASCADE;
DROP TABLE IF EXISTS cicop_follow_up_drafts CASCADE;
DROP TABLE IF EXISTS cicop_audit_log CASCADE;
DROP TABLE IF EXISTS cicop_ai_cache CASCADE;
DROP TABLE IF EXISTS cicop_conversations CASCADE;
DROP TABLE IF EXISTS cicop_complaints CASCADE;
DROP TABLE IF EXISTS cicop_sla_tracking CASCADE;
DROP TABLE IF EXISTS cicop_processed_emails CASCADE;
DROP TABLE IF EXISTS cicop_assessments CASCADE;

-- Success message
SELECT 'All CICOP tables, policies, triggers, and functions have been dropped successfully!' as status;
