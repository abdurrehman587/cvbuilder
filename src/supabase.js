// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://suuwywjdccmyaajwfsfd.supabase.co'; // Your Supabase project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1dXd5d2pkY2NteWFhandmc2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTA3NTUsImV4cCI6MjA2NTYyNjc1NX0.UuDC0p6lTBrU5Py6xbxClmHzcivoFCaaZbLdgrdG4fI'; // Your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
