const fs = require('fs');
const path = require('path');

// Function to update admin access checks in a file
function updateAdminAccessChecks(filePath) {
  console.log(`Updating ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update useEffect admin access check
  content = content.replace(
    /React\.useEffect\(\(\) => \{\s*const adminAccess = localStorage\.getItem\('admin_cv_access'\);\s*if \(adminAccess === 'true'\)/g,
    `React.useEffect(() => {
    // Check both localStorage and user object for admin access
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
    
    if (isAdmin`
  );
  
  // Update checkForApprovedPayment admin access check
  content = content.replace(
    /const checkForApprovedPayment = \(\) => \{\s*\/\/ Check if user is admin \(bypass payment\)\s*const adminAccess = localStorage\.getItem\('admin_cv_access'\);\s*if \(adminAccess === 'true'\)/g,
    `const checkForApprovedPayment = () => {
    // Check if user is admin (bypass payment)
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
    
    if (isAdmin`
  );
  
  // Update getDownloadButtonText admin access check
  content = content.replace(
    /const getDownloadButtonText = \(\) => \{\s*const adminAccess = localStorage\.getItem\('admin_cv_access'\);\s*if \(adminAccess === 'true'\)/g,
    `const getDownloadButtonText = () => {
    // Check both localStorage and user object for admin access
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
    
    if (isAdmin`
  );
  
  // Update handleDownloadClick admin access check
  content = content.replace(
    /const handleDownloadClick = \(\) => \{\s*const adminAccess = localStorage\.getItem\('admin_cv_access'\);\s*if \(adminAccess === 'true'\)/g,
    `const handleDownloadClick = () => {
    // Check both localStorage and user object for admin access
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
    
    if (isAdmin`
  );
  
  // Update download button visibility condition
  content = content.replace(
    /\{\(adminAccess === 'true' \|\| !downloadCompleted\) \? \(/g,
    `{(() => {
        // Check both localStorage and user object for admin access
        const adminAccess = localStorage.getItem('admin_cv_access');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
        
        return (isAdmin || !downloadCompleted) ? (`
  );
  
  // Update the closing part of the download button condition
  content = content.replace(
    /\) : \(/g,
    `) : (`
  );
  
  // Add the closing part for the IIFE
  content = content.replace(
    /\)\s*\)\s*\{showPaymentModal/g,
    `);
      })()}

      {showPaymentModal`
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${filePath}`);
}

// Update all templates from 3 to 9
for (let i = 3; i <= 9; i++) {
  const templatePath = path.join(__dirname, 'src', `Template${i}PDF.js`);
  if (fs.existsSync(templatePath)) {
    updateAdminAccessChecks(templatePath);
  } else {
    console.log(`⚠️  Template${i}PDF.js not found`);
  }
}

console.log('🎉 All templates updated with resilient admin access checks!'); 