import {createClient} from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* can now call supabase from any component */
/* example: */
/* import {supabase} from './supabaseClient'; */
/* const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
}); */