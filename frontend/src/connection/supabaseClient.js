import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eakoogbjlxlidtjclcxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha29vZ2JqbHhsaWR0amNsY3hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIwNTIzNiwiZXhwIjoyMDYzNzgxMjM2fQ.jtFrT2kARhqcfXtNCkPg1mtPXnXUbt0WBkqnIfguSaw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
