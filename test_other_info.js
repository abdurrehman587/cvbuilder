const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = 'https://poqarsztryrdlliwjhgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWFyc3p0cnlyZGxsaXdqaGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTE0NzUsImV4cCI6MjA2NTYyNzQ3NX0.3fkTjLRdfTdIne_uE-m3GoNbu2mxREBlYrraRGX81_4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOtherInformation() {
  console.log('Testing RPC function for other_information...');
  
  try {
    const { data, error } = await supabase.rpc('admin_search_cvs', { p_name: 'jahangir' });
    
    if (error) {
      console.error('RPC error:', error);
      return;
    }
    
    console.log('RPC result:', {
      dataLength: data?.length,
      firstResultKeys: data?.[0] ? Object.keys(data[0]) : 'No data'
    });
    
    if (data && data.length > 0) {
      console.log('First result other_information:', data[0].other_information);
      console.log('First result other_information type:', typeof data[0].other_information);
    }
    
  } catch (err) {
    console.error('Test error:', err);
  }
}

testOtherInformation(); 