// Batch update script for remaining templates (6-10)
// This script provides the exact code changes needed for each template

const templateUpdates = {
  // Template 6
  'Template6PDF.js': {
    renderCustomSections: `
  const renderCustomSections = (customSections) => {
    if (!customSections || customSections.length === 0) return null;

    return customSections.map((section, sectionIndex) => {
      if (!section.heading || !section.details || section.details.length === 0) {
        return null;
      }

      return (
        <section key={sectionIndex} style={sectionStyle} aria-label={\`\${section.heading} Section\`}>
          <h2 style={sectionTitleStyle}>{section.heading}</h2>
          <ul style={listStyle}>
            {section.details.map((detail, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{detail}</li>
            ))}
          </ul>
        </section>
      );
    });
  };`,
    customSectionsRendering: `
      {/* Custom Sections - rendered before references */}
      {visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
        renderCustomSections(formData.customSections)
      )}`
  },
  
  // Template 7
  'Template7PDF.js': {
    renderCustomSections: `
  const renderCustomSections = (customSections) => {
    if (!customSections || customSections.length === 0) return null;

    return customSections.map((section, sectionIndex) => {
      if (!section.heading || !section.details || section.details.length === 0) {
        return null;
      }

      return (
        <section key={sectionIndex} style={sectionStyle} aria-label={\`\${section.heading} Section\`}>
          <h2 style={sectionTitleStyle}>{section.heading}</h2>
          <ul style={listStyle}>
            {section.details.map((detail, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{detail}</li>
            ))}
          </ul>
        </section>
      );
    });
  };`,
    customSectionsRendering: `
      {/* Custom Sections - rendered before references */}
      {visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
        renderCustomSections(formData.customSections)
      )}`
  },
  
  // Template 8
  'Template8PDF.js': {
    renderCustomSections: `
  const renderCustomSections = (customSections) => {
    if (!customSections || customSections.length === 0) return null;

    return customSections.map((section, sectionIndex) => {
      if (!section.heading || !section.details || section.details.length === 0) {
        return null;
      }

      return (
        <section key={sectionIndex} style={sectionStyle} aria-label={\`\${section.heading} Section\`}>
          <h2 style={sectionTitleStyle}>{section.heading}</h2>
          <ul style={listStyle}>
            {section.details.map((detail, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{detail}</li>
            ))}
          </ul>
        </section>
      );
    });
  };`,
    customSectionsRendering: `
      {/* Custom Sections - rendered before references */}
      {visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
        renderCustomSections(formData.customSections)
      )}`
  },
  
  // Template 9
  'Template9PDF.js': {
    renderCustomSections: `
  const renderCustomSections = (customSections) => {
    if (!customSections || customSections.length === 0) return null;

    return customSections.map((section, sectionIndex) => {
      if (!section.heading || !section.details || section.details.length === 0) {
        return null;
      }

      return (
        <section key={sectionIndex} style={sectionStyle} aria-label={\`\${section.heading} Section\`}>
          <h2 style={sectionTitleStyle}>{section.heading}</h2>
          <ul style={listStyle}>
            {section.details.map((detail, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{detail}</li>
            ))}
          </ul>
        </section>
      );
    });
  };`,
    customSectionsRendering: `
      {/* Custom Sections - rendered before references */}
      {visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
        renderCustomSections(formData.customSections)
      )}`
  },
  
  // Template 10
  'Template10PDF.js': {
    renderCustomSections: `
  const renderCustomSections = (customSections) => {
    if (!customSections || customSections.length === 0) return null;

    return customSections.map((section, sectionIndex) => {
      if (!section.heading || !section.details || section.details.length === 0) {
        return null;
      }

      return (
        <section key={sectionIndex} style={sectionStyle} aria-label={\`\${section.heading} Section\`}>
          <h2 style={sectionTitleStyle}>{section.heading}</h2>
          <ul style={listStyle}>
            {section.details.map((detail, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{detail}</li>
            ))}
          </ul>
        </section>
      );
    });
  };`,
    customSectionsRendering: `
      {/* Custom Sections - rendered before references */}
      {visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
        renderCustomSections(formData.customSections)
      )}`
  }
};

// Preview template updates
const previewUpdates = {
  sectionList: `const sectionList = [
  { key: 'objective', title: 'Objective' },
  { key: 'education', title: 'Education' },
  { key: 'workExperience', title: 'Work Experience' },
  { key: 'skills', title: 'Skills' },
  { key: 'certifications', title: 'Certifications' },
  { key: 'projects', title: 'Projects' },
  { key: 'languages', title: 'Languages' },
  { key: 'hobbies', title: 'Hobbies' },
  { key: 'customSections', title: 'Custom Sections' },
  { key: 'references', title: 'References' },
  { key: 'otherInformation', title: 'Other Information' },
];`,
  
  hasSectionData: `// Helper function to check if a section has data
const hasSectionData = (formData, sectionKey) => {
  switch (sectionKey) {
    case 'objective':
      return formData.objective && formData.objective.length > 0 && 
             formData.objective.some(obj => obj && obj.trim() !== '');
    case 'education':
      return formData.education && formData.education.length > 0;
    case 'workExperience':
      return formData.workExperience && formData.workExperience.length > 0;
    case 'skills':
      return formData.skills && formData.skills.length > 0;
    case 'certifications':
      return formData.certifications && formData.certifications.length > 0;
    case 'projects':
      return formData.projects && formData.projects.length > 0;
    case 'languages':
      return (formData.languages && formData.languages.length > 0) ||
             (formData.customLanguages && formData.customLanguages.length > 0 && 
              formData.customLanguages.some(l => l.selected && l.name.trim() !== ''));
    case 'hobbies':
      return formData.hobbies && formData.hobbies.length > 0;
    case 'customSections':
      return formData.customSections && formData.customSections.length > 0 &&
             formData.customSections.some(section => 
               section.heading && section.details && section.details.length > 0
             );
    case 'references':
      return true; // Always show references section
    case 'otherInformation':
      return formData.otherInformation && formData.otherInformation.length > 0 &&
             formData.otherInformation.some(item => 
               (item.labelType === 'radio' && item.checked) ||
               (item.labelType === 'checkbox' && item.checked)
             );
    default:
      return false;
  }
};`
};

console.log('Template update guide created successfully!');
console.log('Use this script to manually update the remaining templates.'); 