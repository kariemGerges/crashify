/**
 * Script to create a session for an existing user
 * This bypasses the login flow and creates a session directly
 * 
 * Usage: node scripts/create-session.js <email>
 */

const { createClient } = require('@supabase/supabase-js');
const { randomBytes } = require('crypto');

// Load from .env.local
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
    // Ignore
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Environment variables not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSession() {
    const email = process.argv[2] || 'info@me.com';

    console.log('Creating session for:', email);
    console.log('');

    // Get user from database
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role, is_active')
        .eq('email', email.toLowerCase())
        .single();

    if (userError || !user) {
        console.error('❌ User not found:', userError?.message || 'User does not exist');
        process.exit(1);
    }

    if (!user.is_active) {
        console.error('❌ User is not active');
        process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log('');

    // Generate session token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Create session
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
            user_id: user.id,
            token: token,
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

    if (sessionError) {
        console.error('❌ Failed to create session:', sessionError);
        process.exit(1);
    }

    console.log('✅ Session created successfully!');
    console.log('');
    console.log('To use this session, set this cookie in your browser:');
    console.log('');
    console.log(`Cookie Name: car_admin_session`);
    console.log(`Cookie Value: ${token}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log('');
    console.log('Or use this in your browser console:');
    console.log('');
    console.log(`document.cookie = "car_admin_session=${token}; path=/; max-age=7200";`);
    console.log('');
    console.log('Then refresh the page and you should be logged in!');
}

createSession().catch(console.error);

