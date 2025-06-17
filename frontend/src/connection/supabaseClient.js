import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xtckolxiipfxnstcbofm.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Y2tvbHhpaXBmeG5zdGNib2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjk3NzgsImV4cCI6MjA2MDYwNTc3OH0.Ey7NfufULbDx7QxlcPcqNg46k6LnsAsA_6HMk7f8CsE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;