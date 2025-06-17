// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://poqarsztryrdlliwjhgx.supabase.co'; // Your Supabase project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWFyc3p0cnlyZGxsaXdqaGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTE0NzUsImV4cCI6MjA2NTYyNzQ3NX0.3fkTjLRdfTdIne_uE-m3GoNbu2mxREBlYrraRGX81_4'; // Your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
