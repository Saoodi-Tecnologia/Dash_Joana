import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tzhonyngvparefzoptqb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aG9ueW5ndnBhcmVmem9wdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzcwODcsImV4cCI6MjA2Mzk1MzA4N30.DhyNXEFbw0tqXc25si0ew8EUPLl3igntkueT5CSqd38';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
