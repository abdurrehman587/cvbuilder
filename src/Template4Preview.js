import React, { useState, useEffect } from 'react';

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
      return formData.customSections && formData.customSections.length > 0 &&
             formData.customSections.some(section => 
               section && typeof section === 'object' && 
               (section.title || section.heading || section.details)
             );
    case 'references':
      return true;
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

const blue = '#2563eb';
const lightBlue = '#e0e7ff';

const Template4Preview = ({ formData, formHeight }) => {
  const [visibleSections, setVisibleSections] = useState([]);

  // Update visible sections when formData changes
  useEffect(() => {
    const sectionsWithData = sectionList
      .filter(section => hasSectionData(formData, section.key))
      .map(section => section.key);
    setVisibleSections(sectionsWithData);
  }, [formData]);

  const previewHeight = formHeight || 'auto';

  // Helper renderers for each section
  const renderObjective = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 18, marginBottom: 8, letterSpacing: 0.5 }}>Professional Summary</h3>
      <div style={{ fontSize: 15, color: '#374151' }}>
        {formData.objective && formData.objective.map((obj, i) => obj && <div key={i}>{obj}</div>)}
      </div>
    </section>
  );

  const renderEducation = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>Education</h3>
      {formData.education && formData.education.map((edu, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>{edu.degree}</div>
          <div style={{ fontSize: 14 }}>{edu.institute} {edu.year && <>| <span>{edu.year}</span></>}</div>
        </div>
      ))}
    </section>
  );

  const renderWorkExperience = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>Professional Experience</h3>
      {formData.workExperience && formData.workExperience.map((exp, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>{exp.designation}</div>
          <div style={{ fontSize: 14, color: '#374151' }}>{exp.company} {exp.duration && <>| <span>{exp.duration}</span></>}</div>
          {exp.details && (
            <ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: 14 }}>
              {exp.details.split('\n').map((d, idx) => d.trim() && <li key={idx}>{d.trim()}</li>)}
            </ul>
          )}
        </div>
      ))}
    </section>
  );

  const renderSkills = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>Key Skills</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {formData.skills && formData.skills.map((skill, i) => (
          <span key={i} style={{
            background: lightBlue,
            color: blue,
            borderRadius: 16,
            padding: '4px 14px',
            fontSize: 13,
            fontWeight: 500,
            border: `1px solid ${blue}`,
            marginBottom: 4
          }}>{skill.name}</span>
        ))}
      </div>
    </section>
  );

  const renderCertifications = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>Certifications</h3>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
        {formData.certifications && formData.certifications.map((cert, i) => cert && <li key={i}>{cert}</li>)}
      </ul>
    </section>
  );

  const renderProjects = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>Projects</h3>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
        {formData.projects && formData.projects.map((proj, i) => proj && <li key={i}>{proj}</li>)}
      </ul>
    </section>
  );

  const renderLanguages = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>Languages</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {formData.languages && formData.languages.map((lang, i) => (
          <span key={i} style={{
            background: lightBlue,
            color: blue,
            borderRadius: 16,
            padding: '4px 14px',
            fontSize: 13,
            fontWeight: 500,
            border: `1px solid ${blue}`,
            marginBottom: 4
          }}>{lang}</span>
        ))}
        {formData.customLanguages && formData.customLanguages.filter(l => l.selected && l.name.trim()).map((lang, i) => (
          <span key={i} style={{
            background: lightBlue,
            color: blue,
            borderRadius: 16,
            padding: '4px 14px',
            fontSize: 13,
            fontWeight: 500,
            border: `1px solid ${blue}`,
            marginBottom: 4
          }}>{lang.name}</span>
        ))}
      </div>
    </section>
  );

  const renderHobbies = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>Hobbies</h3>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
        {formData.hobbies && formData.hobbies.map((hobby, i) => hobby && <li key={i}>{hobby}</li>)}
      </ul>
    </section>
  );

  const renderCustomSections = () => (
    <section style={{ marginBottom: 24 }}>
      {formData.customSections && formData.customSections.map((section, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>{section.title || section.heading}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {section.details && Array.isArray(section.details)
              ? section.details.map((d, idx) => d && <li key={idx}>{d}</li>)
              : section.details && <li>{section.details}</li>}
          </ul>
        </div>
      ))}
    </section>
  );

  const renderReferences = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>References</h3>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
        {formData.references && formData.references.map((ref, i) => ref && <li key={i}>{ref}</li>)}
      </ul>
    </section>
  );

  const renderOtherInformation = () => (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ color: blue, fontSize: 16, marginBottom: 8, letterSpacing: 0.5 }}>Other Information</h3>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
        {formData.otherInformation && formData.otherInformation.filter(item => item.checked).map((item, i) => (
          <li key={i}>{item.label} {item.value && <span>: {item.value}</span>}</li>
        ))}
      </ul>
    </section>
  );

  // Main render
  return (
    <div style={{
      maxWidth: 830,
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{ width: 794 }}>
        {/* Section toggles */}
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
                onClick={() => setVisibleSections(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])}
                aria-pressed={active}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  borderRadius: 30,
                  border: active ? `2px solid ${blue}` : '2px solid #ccc',
                  backgroundColor: active ? blue : '#fff',
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

        {/* CV Layout */}
        <article
          style={{
            width: '794px',
            height: previewHeight,
            margin: '0 auto',
            padding: 0,
            background: '#fff',
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
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            borderBottom: `2px solid ${lightBlue}`,
            padding: '32px 32px 18px 32px',
            background: '#f8fafc',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            position: 'relative',
            minHeight: 120
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: blue, marginBottom: 2, letterSpacing: 0.5 }}>
                {formData.name || 'Your Name'}
              </div>
              <div style={{ fontSize: 18, color: '#374151', fontWeight: 500, marginBottom: 10 }}>
                {formData.designation || 'Your Job Title'}
              </div>
              <div style={{ fontSize: 15, color: '#374151', marginBottom: 2 }}>
                {formData.phone && <span>{formData.phone} / </span>}
                {formData.address && <span>{formData.address} / </span>}
                {formData.email && <span>{formData.email} / </span>}
                {formData.linkedin && <span>{formData.linkedin}</span>}
              </div>
            </div>
            {/* Rectangular profile photo container with rounded corners */}
            <div style={{ width: 110, height: 140, borderRadius: 16, overflow: 'hidden', border: `3px solid ${blue}`, marginLeft: 24, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: lightBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: blue, fontSize: 32 }}>
                  <span>?</span>
                </div>
              )}
            </div>
          </div>

          {/* Main two-column layout */}
          <div style={{ display: 'flex', flexDirection: 'row', padding: 32, gap: 32 }}>
            {/* Left/Main column */}
            <div style={{ flex: 2, minWidth: 0 }}>
              {visibleSections.includes('objective') && renderObjective()}
              {visibleSections.includes('workExperience') && renderWorkExperience()}
              {visibleSections.includes('projects') && renderProjects()}
              {visibleSections.includes('certifications') && renderCertifications()}
              {visibleSections.includes('customSections') && renderCustomSections()}
              {visibleSections.includes('references') && renderReferences()}
              {visibleSections.includes('otherInformation') && renderOtherInformation()}
            </div>
            {/* Right/Sidebar column */}
            <div style={{ flex: 1, minWidth: 180 }}>
              {visibleSections.includes('education') && renderEducation()}
              {visibleSections.includes('skills') && renderSkills()}
              {visibleSections.includes('languages') && renderLanguages()}
              {visibleSections.includes('hobbies') && renderHobbies()}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default Template4Preview;

