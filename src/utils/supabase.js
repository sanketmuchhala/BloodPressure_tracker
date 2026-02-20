import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// Security: PIN-based authentication for single-user app
// - Data is stored in Supabase but without Supabase Auth
// - Single fixed user ID for all data
// - Storage: Private bucket with per-user folders, accessed via signed URLs

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fixed user ID for single-user app (replaces Supabase Auth user ID)
export const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001';

// Helper function to check if user is authenticated (PIN-based)
export function isAuthenticated() {
  return localStorage.getItem('authenticated') === 'true';
}

// Helper function to sign out (clear PIN authentication)
export function signOut() {
  localStorage.removeItem('authenticated');
}
