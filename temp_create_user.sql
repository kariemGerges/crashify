-- =============================================
-- TEMPORARY SCRIPT: Create first admin user
-- Run this in Supabase SQL Editor
-- =============================================
-- 
-- This temporarily disables RLS to create the first user,
-- then re-enables it. Use this ONLY for initial setup.

BEGIN;

-- Step 1: Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Create your admin user (replace with your details)
-- You'll need to hash the password first - use your app's hashPassword function
-- For now, you can insert directly and hash it later, or use a temporary password

-- Example: Create admin user
-- Replace these values:
-- - 'your-email@example.com' with your email
-- - 'Your Name' with your name  
-- - 'your-hashed-password' with a bcrypt hash of your password
-- - 'admin' or 'super_admin' for role

INSERT INTO users (
    email,
    name,
    password_hash,
    role,
    two_factor_enabled,
    is_active
) VALUES (
    'admin@example.com',  -- CHANGE THIS
    'Admin User',          -- CHANGE THIS
    '$2b$10$YourHashedPasswordHere',  -- CHANGE THIS - use your hashPassword function
    'super_admin',         -- or 'admin'
    false,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Step 3: Re-enable RLS immediately
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verify the user was created
SELECT id, email, name, role, is_active FROM users WHERE email = 'admin@example.com';

