-- =============================================
-- Migration: Fix assessment audit trigger
-- Fixes trigger that incorrectly uses assessment_id column in audit_logs
-- =============================================

-- The error "column assessment_id of relation audit_logs does not exist" indicates
-- there's a database trigger or function trying to insert into audit_logs with a
-- column named 'assessment_id', but audit_logs uses 'resource_id' and 'resource_type'
-- instead.

-- This migration removes any problematic triggers/functions on assessments
-- that reference audit_logs with the wrong column name.

-- Step 1: Drop any triggers on assessments that might be causing issues
-- (This is safe because application code handles audit logging manually)

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Checking for triggers on assessments table...';
    FOR r IN
        SELECT 
            t.tgname as trigger_name,
            p.proname as function_name,
            p.prosrc as function_source
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE c.relname = 'assessments'
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND t.tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
    LOOP
        RAISE NOTICE 'Found trigger: % (function: %)', r.trigger_name, r.function_name;
        
        -- If function references audit_logs with assessment_id (but not resource_id), drop it
        IF r.function_source LIKE '%audit_logs%' 
           AND r.function_source LIKE '%assessment_id%'
           AND r.function_source NOT LIKE '%resource_id%' THEN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON assessments CASCADE', r.trigger_name);
            RAISE NOTICE 'Dropped problematic trigger: %', r.trigger_name;
        END IF;
    END LOOP;
END $$;

-- Step 2: Drop any standalone functions that might be problematic
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Checking for functions that reference audit_logs with assessment_id...';
    FOR r IN
        SELECT 
            p.proname as function_name,
            n.nspname as schema_name,
            p.prosrc as function_source
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosrc LIKE '%audit_logs%'
        AND p.prosrc LIKE '%assessment_id%'
        AND p.prosrc NOT LIKE '%resource_id%'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', r.schema_name, r.function_name);
        RAISE NOTICE 'Dropped problematic function: %.%', r.schema_name, r.function_name;
    END LOOP;
END $$;

-- Note: Application code handles audit logging manually using the correct schema:
-- - resource_type = 'assessment'  
-- - resource_id = <assessment_id as text>
-- The audit_logs table does NOT have an assessment_id column.
