import React, { useState, useEffect } from 'react';
import Template2PDF from './Template2PDF';

const sectionList = [
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
];

// Helper function to check if a section has data
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
      const hasCustomSections = formData.customSections && formData.customSections.length > 0 &&
             formData.customSections.some(section => 
               section && typeof section === 'object' && 
               (section.heading || section.details) // Show if either heading or details exist
             );
      console.log('Template2Preview - customSections check:', {
        customSections: formData.customSections,
        hasCustomSections,
        sections: formData.customSections?.map(s => ({
          heading: s.heading,
          detailsLength: s.details?.length,
          hasHeading: !!s.heading,
          hasDetails: s.details && s.details.length > 0
        }))
      });
      return hasCustomSections;
    case 'references':
      return true; // Always show references section
    case 'otherInformation':
      console.log('Template2Preview - otherInformation check:', {
        otherInformation: formData.otherInformation,
        length: formData.otherInformation?.length,
        items: formData.otherInformation?.map(item => ({
          labelType: item.labelType,
          checked: item.checked,
          value: item.value,
          label: item.label,
          hasValue: item.value && item.value.trim() !== '',
          shouldShow: (item.labelType === 'radio' && item.checked) ||
                     (item.labelType === 'checkbox' && item.checked)
        }))
      });
      return formData.otherInformation && formData.otherInformation.length > 0 &&
             formData.otherInformation.some(item => 
               (item.labelType === 'radio' && item.checked) ||
               (item.labelType === 'checkbox' && item.checked)
             );
    default:
      return false;
  }
};

const renderOtherInformation = (otherInfo) => {
  console.log('Template2Preview - renderOtherInformation called with:', otherInfo);
  
  if (!otherInfo || otherInfo.length === 0) {
    console.log('Template2Preview - renderOtherInformation: no otherInfo or empty array');
    return null;
  }

  // Force show all items for debugging
  const checkedItems = otherInfo.filter(item =>
    (item.labelType === 'radio' && item.checked) ||
    (item.labelType === 'checkbox' && item.checked)
  );

  console.log('Template2Preview - renderOtherInformation filtered items:', checkedItems);

  // If no checked items, show all items for debugging
  const itemsToShow = checkedItems.length > 0 ? checkedItems : otherInfo;
  console.log('Template2Preview - renderOtherInformation items to show:', itemsToShow);

  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: '1.1rem', margin: '8px 0' }}>Other Information</h2>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {itemsToShow.map((item, idx) => (
          <li key={idx} style={{ fontSize: '0.95rem', marginBottom: 2 }}>
            {item.label} {item.value || '-'}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Template2Preview = ({ formData }) => {
  const [visibleSections, setVisibleSections] = useState([]);

  // Update visible sections when formData changes
  useEffect(() => {
    console.log('Template2Preview - formData changed:', formData);
    console.log('Template2Preview - customSections:', formData.customSections);
    
    const sectionsWithData = sectionList
      .filter(section => {
        const hasData = hasSectionData(formData, section.key);
        console.log(`Template2Preview - Section ${section.key}:`, hasData);
        return hasData;
      })
      .map(section => section.key);
    
    console.log('Template2Preview - sectionsWithData:', sectionsWithData);
    setVisibleSections(sectionsWithData);
  }, [formData]);

  const toggleSection = (key) => {
    setVisibleSections((prev) =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '210mm', marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 16,
            gap: 8,
            userSelect: 'none',
          }}
          role="toolbar"
          aria-label="Toggle CV sections"
        >
          {sectionList.map(({ key, title }) => {
            const active = visibleSections.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleSection(key)}
                aria-pressed={active}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  borderRadius: 30,
                  border: active ? '2px solid #3498db' : '2px solid #ccc',
                  backgroundColor: active ? '#3498db' : '#fff',
                  color: active ? '#fff' : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  userSelect: 'none',
                }}
                type="button"
              >
                {active ? `Hide ${title}` : `Show ${title}`}
              </button>
            );
          })}
        </div>
      </div>

      <article
        style={{
          width: '210mm',
          margin: '0 auto',
          background: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
        }}
        aria-label="Curriculum Vitae Preview"
      >
        {/* Left column for sidebar sections */}
        <div style={{ width: '35%', padding: '24px 16px 24px 24px', background: '#f7f7f7', minHeight: '100%' }}>
          {/* Render Other Information in the left column if visible */}
          {(() => {
            console.log('Template2Preview - otherInformation rendering check:', {
              visibleSections,
              hasOtherInformation: visibleSections.includes('otherInformation'),
              formDataOtherInformation: formData.otherInformation,
              otherInformationLength: formData.otherInformation?.length
            });
            return visibleSections.includes('otherInformation') && renderOtherInformation(formData.otherInformation);
          })()}
        </div>
        {/* Main content (PDF preview) */}
        <div style={{ width: '65%', padding: '24px' }}>
          <Template2PDF formData={formData} visibleSections={visibleSections} />
        </div>
      </article>
    </div>
  );
};

export default Template2Preview;
