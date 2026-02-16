import { createClient } from '@supabase/supabase-js';

// These should be loaded from .env in the consuming app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to get specific schema client if needed (though RLS handle this better usually)
// For "1 project check", we rely on RLS and app_metadata.
