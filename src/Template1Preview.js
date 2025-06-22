import React, { useState, useEffect } from 'react';
import Template1PDF from './Template1PDF';

const sectionList = [
  { key: 'objective', title: 'Objective' },
  { key: 'education', title: 'Education' },
  { key: 'workExperience', title: 'Work Experience' },
  { key: 'skills', title: 'Skills' },
  { key: 'certifications', title: 'Certifications' },
  { key: 'projects', title: 'Projects' },
  { key: 'languages', title: 'Languages' },
  { key: 'hobbies', title: 'Hobbies' },
  { key: 'references', title: 'References' },
  { key: 'otherInformation', title: 'Other Information' },  // Added new section
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
};

const Template1Preview = ({ formData, formHeight }) => {
  const [visibleSections, setVisibleSections] = useState([]);

  // Update visible sections when formData changes
  useEffect(() => {
    const sectionsWithData = sectionList
      .filter(section => hasSectionData(formData, section.key))
      .map(section => section.key);
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
                  border: active ? '2px solid #3f51b5' : '2px solid #ccc',
                  backgroundColor: active ? '#3f51b5' : '#fff',
                  color: active ? '#fff' : '#555',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  userSelect: 'none',
                  letterSpacing: '0.02em',
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
          background: '#fdfdfd',
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontFamily: "'Open Sans', Arial, sans-serif",
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible', // changed from 'overflowY: visible'
          boxSizing: 'border-box',
          // removed fixed height/minHeight so it grows with content
        }}
        aria-label="Curriculum Vitae Preview"
      >
        <Template1PDF formData={formData} visibleSections={visibleSections} />
      </article>
    </div>
  );
};

export default Template1Preview;

