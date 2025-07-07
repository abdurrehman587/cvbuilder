// remove_temporary_download.js
// This script helps you remove the temporary direct download feature
// Run this when you want to restore the normal payment system

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/Template1PDF.js',
  'src/Template2PDF.js'
];

console.log('🔧 Removing temporary direct download feature...');

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📝 Processing: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the handleDirectDownload function
    content = content.replace(
      /\/\/ TEMPORARY: Direct download function that bypasses payment system[\s\S]*?};/g,
      ''
    );
    
    // Remove the temporary download button section
    content = content.replace(
      /\/\* TEMPORARY: Direct Download Button \*\/[\s\S]*?This bypasses the payment system temporarily[\s\S]*?<\/div>/g,
      ''
    );
    
    // Clean up any extra whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n🎉 Temporary download feature removed!');
console.log('📋 Next steps:');
console.log('1. Test the payment system to ensure it works correctly');
console.log('2. Delete this script file (remove_temporary_download.js)');
console.log('3. Commit your changes to git'); 