import React, { useState } from 'react';
import Template3PDF from './Template3PDF';

const sectionList = [
  { key: 'objective', title: 'Objective' },
  { key: 'education', title: 'Education' },
  { key: 'workExperience', title: 'Work Experience' },
  { key: 'skills', title: 'Skills' },
  { key: 'otherInformation', title: 'Other Information' },
  { key: 'certifications', title: 'Certifications' },
  { key: 'projects', title: 'Projects' },
  { key: 'languages', title: 'Languages' },
  { key: 'hobbies', title: 'Hobbies' },
  { key: 'references', title: 'References' },
];

const Template3Preview = ({ formData, formHeight }) => {
  const [visibleSections, setVisibleSections] = useState(sectionList.map(s => s.key));

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
                  border: active ? '2px solid #667eea' : '2px solid #ccc',
                  backgroundColor: active ? '#667eea' : '#fff',
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
            background: '#ffffff',
            borderRadius: 10,
            fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: '#2d3748',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'visible',
            boxSizing: 'border-box',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
          aria-label="Curriculum Vitae Preview"
        >
          <Template3PDF formData={formData} visibleSections={visibleSections} />
        </article>
      </div>
    </div>
  );
};

export default Template3Preview;

