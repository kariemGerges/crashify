-- =============================================
-- QUICK FIX: Create admin user (bypass RLS temporarily)
-- Run this in Supabase SQL Editor
-- =============================================

-- Option 1: Use service role (if you have it)
-- Just run this INSERT directly - service role bypasses RLS
-- Replace the values below with your details

-- You need to hash your password first using bcrypt
-- Use this online tool: https://bcrypt-generator.com/
-- Or run: node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('YourPassword123!', 12).then(console.log)"

INSERT INTO users (
    email,
    name,
    password_hash,
    role,
    two_factor_enabled,
    is_active
) VALUES (
    'admin@example.com',  -- ⚠️ CHANGE THIS to your email
    'Admin User',          -- ⚠️ CHANGE THIS to your name
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5',  -- ⚠️ CHANGE THIS - hash your password
    'super_admin',        -- or 'admin'
    false,
    true
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email, name, role;

-- If the above doesn't work, use Option 2 below:

