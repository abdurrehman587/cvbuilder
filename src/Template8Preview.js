import React, { useState, useEffect } from 'react';
import Template8PDF from './Template8PDF';

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
    case 'customSections':
      return formData.customSections && formData.customSections.length > 0 &&
             formData.customSections.some(section => 
               section && typeof section === 'object' && 
               (section.title || section.heading || section.details) // Show if either title, heading, or details exist
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
};

const Template8Preview = ({ formData, formHeight }) => {
  const [visibleSections, setVisibleSections] = useState([]);

  // Update visible sections when formData changes
  useEffect(() => {
    const sectionsWithData = sectionList
      .filter(section => hasSectionData(formData, section.key))
      .map(section => section.key);
    setVisibleSections(sectionsWithData);
  }, [formData]);

  const previewHeight = formHeight || 'auto';

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
      {/* Save Reminder */}
      <div style={{
        width: '100%',
        padding: '1rem 2rem',
        backgroundColor: '#fef3c7',
        borderBottom: '1px solid #f59e0b',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          💾 Don't forget to save your CV for later use.
        </div>
      </div>
      <style>
        {`
          @media (max-width: 768px) {
            .template-container {
              width: 100% !important;
              max-width: 100% !important;
            }
            
            .template-controls {
              flex-wrap: wrap !important;
              gap: 6px !important;
              margin-bottom: 12px !important;
            }
            
            .template-control-btn {
              padding: 4px 10px !important;
              font-size: 0.75rem !important;
            }
            
            .template-article {
              width: 100% !important;
              border-radius: 8px !important;
              margin: 0 10px !important;
            }
          }
          
          @media (max-width: 480px) {
            .template-controls {
              gap: 4px !important;
              margin-bottom: 10px !important;
            }
            
            .template-control-btn {
              padding: 3px 8px !important;
              font-size: 0.7rem !important;
            }
            
            .template-article {
              margin: 0 5px !important;
            }
          }
        `}
      </style>
      <div className="template-container" style={{ width: '210mm', marginBottom: '20px' }}>
        <div
          className="template-controls"
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
                className="template-control-btn"
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
        className="template-article"
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
          overflow: 'visible',
          boxSizing: 'border-box',
        }}
        aria-label="Curriculum Vitae Preview"
      >
        <Template8PDF formData={formData} visibleSections={visibleSections} />
      </article>
    </div>
  );
};

export default Template8Preview;

