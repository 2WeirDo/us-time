import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client factory.
 * Reads URL and anon key from localStorage (saved during setup).
 * Falls back to env vars for development.
 */
export function getSupabase() {
  // Try localStorage first (user-configured)
  const storedUrl = localStorage.getItem('supabase-url');
  const storedKey = localStorage.getItem('supabase-anon-key');

  const url = storedUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const key = storedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

/**
 * Save Supabase config to localStorage.
 */
export function saveSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem('supabase-url', url);
  localStorage.setItem('supabase-anon-key', anonKey);
}

/**
 * Check if Supabase is configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = localStorage.getItem('supabase-url') || import.meta.env.VITE_SUPABASE_URL;
  const key = localStorage.getItem('supabase-anon-key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key);
}
