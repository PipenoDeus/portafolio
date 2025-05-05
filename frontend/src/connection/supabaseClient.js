// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Sustituye estos valores con los de tu proyecto
const SUPABASE_URL = 'https://xtckolxiipfxnstcbofm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Y2tvbHhpaXBmeG5zdGNib2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjk3NzgsImV4cCI6MjA2MDYwNTc3OH0.Ey7NfufULbDx7QxlcPcqNg46k6LnsAsA_6HMk7f8CsE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
