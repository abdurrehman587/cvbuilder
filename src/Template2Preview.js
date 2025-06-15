import React, { useState } from 'react';
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
  { key: 'references', title: 'References' },
  { key: 'otherInformation', title: 'Other Information' },
];

const Template2Preview = ({ formData }) => {
  const [visibleSections, setVisibleSections] = useState(sectionList.map(s => s.key));

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
        boxSizing: 'border-box',
        padding: '0 8px',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '900px',
        marginBottom: '20px',
        boxSizing: 'border-box',
      }}>
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
          width: '100%',
          maxWidth: '900px',
          minWidth: 0,
          margin: '0 auto',
          background: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          boxSizing: 'border-box',
          borderRadius: 10,
          padding: 0,
        }}
        aria-label="Curriculum Vitae Preview"
      >
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: 0,
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              padding: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '210mm',
                minWidth: 0,
                boxSizing: 'border-box',
                padding: 0,
              }}
            >
              <Template2PDF formData={formData} visibleSections={visibleSections} />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default Template2Preview;
