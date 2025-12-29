-- =============================================
-- Migration: Add 'manual' as valid source value for assessments
-- =============================================

-- Drop the existing check constraint(s) on the source column
-- PostgreSQL may have auto-generated constraint names, so we find and drop them
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find all check constraints on the assessments table that involve the source column
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'assessments'::regclass
        AND contype = 'c'
        AND (
            -- Check if constraint name contains 'source' or if it's a system-generated name
            conname LIKE '%source%'
            OR conname LIKE 'assessments_source%'
            -- Also check the constraint definition to see if it references 'source'
            OR pg_get_constraintdef(oid) LIKE '%source%'
        )
    LOOP
        EXECUTE format('ALTER TABLE assessments DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
    
    -- Also try common constraint names that might have been used
    BEGIN
        ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_source_check;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore if constraint doesn't exist
        NULL;
    END;
END $$;

-- Add new check constraint that includes 'manual'
ALTER TABLE assessments
ADD CONSTRAINT assessments_source_check 
CHECK (source IN ('web_form', 'email', 'phone', 'portal', 'manual'));

-- Update comment
COMMENT ON COLUMN assessments.source IS 'Source of the assessment request: web_form, email, phone, portal, or manual';

