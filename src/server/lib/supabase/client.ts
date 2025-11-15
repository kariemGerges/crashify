// =============================================
// FILE location: lib/supabase/client.ts
// Supabase client configuration with caching
// =============================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/server/lib/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (with built-in caching)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        headers: {
            'x-application-name': 'crashify-web',
        },
    },
    db: {
        schema: 'public',
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Server-side client (for API routes)
export const createServerClient = (): SupabaseClient<Database> => {
    return createClient<Database>(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for server
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    );
};
