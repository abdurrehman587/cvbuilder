#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 CV Builder Admin Setup');
console.log('========================\n');

console.log('This script will help you set up secure admin credentials.');
console.log('The credentials will be stored in a .env file.\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAdmin() {
  try {
    const adminEmail = await question('Enter admin email: ');
    const adminPassword = await question('Enter admin password: ');
    
    if (!adminEmail || !adminPassword) {
      console.log('\n❌ Email and password are required!');
      rl.close();
      return;
    }

    const envContent = `# Admin credentials
REACT_APP_ADMIN_EMAIL=${adminEmail}
REACT_APP_ADMIN_PASSWORD=${adminPassword}

# Add your Supabase configuration here
# REACT_APP_SUPABASE_URL=your_supabase_url_here
# REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
`;

    const envPath = path.join(process.cwd(), '.env');
    
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      const overwrite = await question('\n⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('\n❌ Setup cancelled.');
        rl.close();
        return;
      }
    }

    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Admin credentials set up successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Press Ctrl + Alt + A to access admin panel');
    console.log('3. Use the credentials you just set up');
    console.log('\n🔒 Security reminder:');
    console.log('- Never commit .env files to version control');
    console.log('- Use strong, unique passwords in production');
    console.log('- Consider implementing additional security measures');
    
  } catch (error) {
    console.error('\n❌ Error setting up admin credentials:', error.message);
  } finally {
    rl.close();
  }
}

setupAdmin(); 