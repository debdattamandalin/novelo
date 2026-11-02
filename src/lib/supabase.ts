import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://embtczgtlpyeoarndnfd.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYnRjemd0bHB5ZW9hcm5kbmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MDcyMDksImV4cCI6MjEwOTE4MzIwOX0.IoMVpUzeaRte2RaG4R2_lFa47qF--Pr378Dcg9RrYLc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
