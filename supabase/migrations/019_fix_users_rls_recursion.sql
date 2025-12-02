-- =============================================
-- Migration: Fix infinite recursion in users RLS policy
-- =============================================
-- 
-- PROBLEM: The admins_modify_users policy queries the users table,
-- which triggers the same policy again, causing infinite recursion.
--
-- SOLUTION: Create a SECURITY DEFINER function to check admin status
-- without triggering RLS recursion.

-- Function to check if current user is admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user role directly from users table (bypasses RLS due to SECURITY DEFINER)
    SELECT role INTO user_role
    FROM users
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- Return true if user is super_admin or admin
    RETURN user_role IN ('super_admin', 'admin');
END;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "admins_modify_users" ON users;

-- Recreate the policy using the function instead of querying users directly
CREATE POLICY "admins_modify_users"
ON users FOR ALL
USING (is_admin_user());

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO anon;

-- Add comment
COMMENT ON FUNCTION is_admin_user IS 'Checks if the current authenticated user is an admin. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion when checking admin status.';

