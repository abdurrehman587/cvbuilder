const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://poqarsztryrdlliwjhgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWFyc3p0cnlyZGxsaXdqaGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTE0NzUsImV4cCI6MjA2NTYyNzQ3NX0.3fkTjLRdfTdIne_uE-m3GoNbu2mxREBlYrraRGX81_4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStructure() {
  try {
    console.log('Checking database structure...');
    
    // Try to get all columns by selecting all data from one record
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('\nDatabase table structure:');
      console.log('Available columns:', Object.keys(data[0]));
      
      console.log('\nSample record:');
      console.log('ID:', data[0].id);
      console.log('Name:', data[0].name);
      console.log('Has custom_sections column:', 'custom_sections' in data[0]);
      
      if ('custom_sections' in data[0]) {
        console.log('custom_sections value:', data[0].custom_sections);
        console.log('custom_sections type:', typeof data[0].custom_sections);
        console.log('custom_sections JSON:', JSON.stringify(data[0].custom_sections));
      } else {
        console.log('❌ custom_sections column is MISSING from the database!');
      }
    } else {
      console.log('No records found in the database.');
    }
    
  } catch (err) {
    console.error('Check failed:', err);
  }
}

checkDatabaseStructure(); 