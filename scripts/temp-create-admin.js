/**
 * TEMPORARY SCRIPT: Create first admin user
 *
 * This script temporarily disables RLS, creates an admin user,
 * then re-enables RLS. Use this ONLY for initial setup.
 *
 * Usage: node scripts/temp-create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Load from .env.local if it exists, otherwise use process.env
try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    // Ignore if .env.local doesn't exist
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
        'Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
    );
    process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
    // Get user input (you can hardcode these for quick setup)
    const email = process.argv[2] || 'info@me.com';
    const name = process.argv[3] || 'Super Kariem';
    const password = process.argv[4] || 'Admin@123';
    const role = process.argv[5] || 'super_admin';

    console.log('Creating admin user...');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${role}`);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('Password hashed');

    // Check if user already exists
    const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

    if (existingUser) {
        console.log('User already exists!');
        return;
    }

    // Create user (service role key bypasses RLS)
    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            email: email.toLowerCase(),
            name,
            password_hash: passwordHash,
            role,
            two_factor_enabled: false,
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }

    console.log('\n✅ User created successfully!');
    console.log(`ID: ${newUser.id}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log('\nYou can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

createAdminUser().catch(console.error);
