-- =============================================
-- TEMPORARY FIX: Disable RLS, create user, re-enable
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================

BEGIN;

-- Step 1: Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Create admin user
-- ⚠️ IMPORTANT: Replace these values:
-- - 'admin@example.com' with your email
-- - 'Admin User' with your name
-- - The password_hash with a bcrypt hash of your password
--   (Use: https://bcrypt-generator.com/ or run the Node.js script)

INSERT INTO users (
    email,
    name,
    password_hash,
    role,
    two_factor_enabled,
    is_active
) VALUES (
    'admin@example.com',  -- ⚠️ CHANGE THIS
    'Admin User',          -- ⚠️ CHANGE THIS  
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5',  -- ⚠️ CHANGE THIS - use bcrypt hash
    'super_admin',
    false,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Step 3: Re-enable RLS immediately
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verify user was created
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'admin@example.com';  -- ⚠️ CHANGE THIS to match your email

