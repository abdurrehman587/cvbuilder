import React, { useState } from 'react';
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

const Template1Preview = ({ formData, formHeight }) => {
  const [visibleSections, setVisibleSections] = useState([]);

  const previewHeight = formHeight || 'auto';

  const toggleSection = (key) => {
    setVisibleSections((prev) =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  return (
    <div
      style={{
        maxWidth: 830,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 794 }}>
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

        <article
          style={{
            width: '794px',
            height: previewHeight,
            margin: '0 auto',
            padding: 24,
            background: '#fdfdfd',
            borderRadius: 10,
            fontFamily: "'Open Sans', Arial, sans-serif",
            color: '#333',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'visible',
            boxSizing: 'border-box',
          }}
          aria-label="Curriculum Vitae Preview"
        >
          <Template1PDF formData={formData} visibleSections={visibleSections} />
        </article>
      </div>
    </div>
  );
};

export default Template1Preview;

