/**
 * Check if a session exists and is valid
 */

const { createClient } = require('@supabase/supabase-js');

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

async function checkSession() {
    const token = process.argv[2] || 'c91b4239a66527a617e3bd09e79f8dc4b58feb397cf681d4f46df515afbe559d';

    console.log('Checking session with token:', token.substring(0, 20) + '...');
    console.log('');

    // Check session with service role (bypasses RLS)
    const { data: session, error } = await supabase
        .from('sessions')
        .select('*, users(*)')
        .eq('token', token)
        .single();

    if (error || !session) {
        console.error('❌ Session not found or error:', error?.message);
        return;
    }

    console.log('✅ Session found:');
    console.log(`  Session ID: ${session.id}`);
    console.log(`  User ID: ${session.user_id}`);
    console.log(`  Expires: ${session.expires_at}`);
    console.log(`  Created: ${session.created_at}`);
    console.log('');

    // Check if expired
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    if (expiresAt < now) {
        console.log('❌ Session is EXPIRED');
        console.log(`  Expired ${Math.floor((now - expiresAt) / 1000 / 60)} minutes ago`);
    } else {
        console.log('✅ Session is VALID');
        console.log(`  Expires in ${Math.floor((expiresAt - now) / 1000 / 60)} minutes`);
    }

    console.log('');
    if (session.users) {
        const user = Array.isArray(session.users) ? session.users[0] : session.users;
        console.log('✅ User data:');
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Active: ${user.is_active}`);
    } else {
        console.log('❌ User data not found');
    }
}

checkSession().catch(console.error);

