const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = 'https://poqarsztryrdlliwjhgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWFyc3p0cnlyZGxsaXdqaGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTE0NzUsImV4cCI6MjA2NTYyNzQ3NX0.3fkTjLRdfTdIne_uE-m3GoNbu2mxREBlYrraRGX81_4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Check if custom_sections column exists
    const { data, error } = await supabase
      .from('cvs')
      .select('id, name, custom_sections')
      .limit(3);
    
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    console.log('Database check successful');
    console.log('Number of records found:', data.length);
    
    if (data.length > 0) {
      console.log('\nSample records:');
      data.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log('  ID:', record.id);
        console.log('  Name:', record.name);
        console.log('  custom_sections:', record.custom_sections);
        console.log('  custom_sections type:', typeof record.custom_sections);
        if (record.custom_sections) {
          console.log('  custom_sections JSON:', JSON.stringify(record.custom_sections));
        }
      });
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testDatabase(); 