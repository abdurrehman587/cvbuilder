// Script to update all remaining templates with custom sections support
// This script will be used to guide the manual updates

const templatesToUpdate = [
  'Template4PDF.js',
  'Template4Preview.js',
  'Template5PDF.js', 
  'Template5Preview.js',
  'Template6PDF.js',
  'Template6Preview.js',
  'Template7PDF.js',
  'Template7Preview.js',
  'Template8PDF.js',
  'Template8Preview.js',
  'Template9PDF.js',
  'Template9Preview.js',
  'Template10PDF.js',
  'Template10Preview.js'
];

console.log('Templates to update with custom sections support:');
templatesToUpdate.forEach(template => console.log(`- ${template}`));

console.log('\nFor each template, you need to:');
console.log('1. Add renderCustomSections function');
console.log('2. Add custom sections rendering before references section');
console.log('3. Update sectionList to include customSections');
console.log('4. Update hasSectionData function to handle customSections'); 