import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eakoogbjlxlidtjclcxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha29vZ2JqbHhsaWR0amNsY3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDUyMzYsImV4cCI6MjA2Mzc4MTIzNn0.JltBp_nuH9UwlOK2m1mIVICxEy_QG8XJw36TA6fp7i4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
