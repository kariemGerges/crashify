-- =====================================================
-- Check if CICOP tables exist and are set up correctly
-- =====================================================

-- Check all tables
SELECT 
    table_name,
    'EXISTS ✓' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'cicop_%'
ORDER BY table_name;

-- Count records in each table
SELECT 'cicop_assessments' as table_name, COUNT(*) as record_count FROM cicop_assessments
UNION ALL
SELECT 'cicop_processed_emails', COUNT(*) FROM cicop_processed_emails
UNION ALL
SELECT 'cicop_sla_tracking', COUNT(*) FROM cicop_sla_tracking
UNION ALL
SELECT 'cicop_complaints', COUNT(*) FROM cicop_complaints
UNION ALL
SELECT 'cicop_conversations', COUNT(*) FROM cicop_conversations
UNION ALL
SELECT 'cicop_ai_cache', COUNT(*) FROM cicop_ai_cache
UNION ALL
SELECT 'cicop_audit_log', COUNT(*) FROM cicop_audit_log
UNION ALL
SELECT 'cicop_follow_up_drafts', COUNT(*) FROM cicop_follow_up_drafts
UNION ALL
SELECT 'cicop_daily_stats', COUNT(*) FROM cicop_daily_stats
UNION ALL
SELECT 'cicop_email_templates', COUNT(*) FROM cicop_email_templates
UNION ALL
SELECT 'cicop_config', COUNT(*) FROM cicop_config;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    'ACTIVE' as status
FROM pg_policies 
WHERE tablename LIKE 'cicop_%'
ORDER BY tablename, policyname;
