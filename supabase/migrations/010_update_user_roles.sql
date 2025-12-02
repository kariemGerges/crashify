-- =============================================
-- Migration: Update user roles enum
-- REQ-128: Complete role-based access
-- =============================================

-- IMPORTANT: This migration updates the role column and all RLS policies that depend on it
-- We need to drop policies first, update the column, then recreate policies

-- Step 1: Drop all RLS policies that depend on users.role
DROP POLICY IF EXISTS "admins_all_access_assessments" ON assessments;
DROP POLICY IF EXISTS "staff_all_access_assessments" ON assessments;
DROP POLICY IF EXISTS "users_access_own_files" ON uploaded_files;
DROP POLICY IF EXISTS "staff_access_email_logs" ON email_logs;
DROP POLICY IF EXISTS "staff_access_quote_requests" ON quote_requests;
DROP POLICY IF EXISTS "staff_access_secure_links" ON secure_form_links;
DROP POLICY IF EXISTS "admins_modify_users" ON users;
DROP POLICY IF EXISTS "admins_access_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "staff_access_repairers" ON repairers;
DROP POLICY IF EXISTS "staff_access_clients" ON clients;

-- Step 2: Remove the CHECK constraint (if it exists)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Update the role column to accept new values
-- Note: This will allow any text temporarily
ALTER TABLE users ALTER COLUMN role TYPE TEXT;

-- Step 4: Add new CHECK constraint with all allowed roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('super_admin', 'admin', 'assessor', 'read_only', 'reviewer', 'manager'));

-- Step 5: Recreate RLS policies with updated role checks
-- =============================================
-- RLS Policies for assessments
-- =============================================

-- Policy: Super admins and admins can see all assessments
CREATE POLICY "admins_all_access_assessments"
ON assessments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin')
    )
);

-- Policy: Reviewers, managers, assessors, and read_only can see all assessments
CREATE POLICY "staff_all_access_assessments"
ON assessments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('reviewer', 'manager', 'assessor', 'read_only')
    )
);

-- =============================================
-- RLS Policies for uploaded_files
-- =============================================

-- Policy: Users can only see files for assessments they can access
DROP POLICY IF EXISTS "users_access_own_files" ON uploaded_files;
CREATE POLICY "users_access_own_files"
ON uploaded_files FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM assessments
        WHERE assessments.id = uploaded_files.assessment_id
        AND (
            -- Super admin/Admin/Staff can see all
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager', 'assessor', 'read_only')
            )
        )
    )
);

-- =============================================
-- RLS Policies for email_logs
-- =============================================

CREATE POLICY "staff_access_email_logs"
ON email_logs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
    )
);

-- =============================================
-- RLS Policies for quote_requests
-- =============================================

CREATE POLICY "staff_access_quote_requests"
ON quote_requests FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
    )
);

-- =============================================
-- RLS Policies for secure_form_links
-- =============================================

CREATE POLICY "staff_access_secure_links"
ON secure_form_links FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
    )
);

-- =============================================
-- RLS Policies for users
-- =============================================

-- Policy: Only super admins and admins can modify users
CREATE POLICY "admins_modify_users"
ON users FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin')
    )
);

-- =============================================
-- RLS Policies for audit_logs
-- =============================================

CREATE POLICY "admins_access_audit_logs"
ON audit_logs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin')
    )
);

-- =============================================
-- RLS Policies for repairers and clients
-- =============================================

CREATE POLICY "staff_access_repairers"
ON repairers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
    )
);

CREATE POLICY "staff_access_clients"
ON clients FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'reviewer', 'manager')
    )
);

-- Step 6: Add comment
COMMENT ON COLUMN users.role IS 'User role: super_admin (full access), admin (admin access), assessor (assessment only), read_only (view only), reviewer (review access), manager (management access)';
