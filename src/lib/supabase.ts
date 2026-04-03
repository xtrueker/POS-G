import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const _configured = !!supabaseUrl && !!supabaseAnonKey;

if (!_configured) {
  console.warn('Supabase credentials missing. Check your .env file. Running in local-only mode.');
}

// Use placeholder values when not configured to prevent createClient from throwing
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => _configured;
