import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_admin_key';

// Public client for browser/client-side use
export const supabasePublic = createClient(supabaseUrl, supabaseKey);

// Admin client for server-side use bypassing RLS (use with caution!)
export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// For backward compatibility until fully migrated
export const supabase = supabaseAdmin;
