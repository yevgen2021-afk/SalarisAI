import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if keys are not provided yet, so the app doesn't crash
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (supabase) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) console.error('Supabase init error:', error);
    else console.log('Supabase initialized successfully');
  });
}
