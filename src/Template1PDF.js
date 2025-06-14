import React, { useRef } from 'react';
import PropTypes from 'prop-types';


// Load html2pdf from CDN dynamically
const loadHtml2Pdf = () => {
  if (window.html2pdf) return Promise.resolve(window.html2pdf);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error('Failed to load html2pdf.js'));
    document.body.appendChild(script);
  });
};

const Template1PDF = ({ formData, visibleSections = [] }) => {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const containerStyle = {
    width: '100%',
    maxWidth: '850px',
    margin: '2px 0 0',
    padding: '18px',
    background: '#fdfdfd',
    borderRadius: '10px',
    fontFamily: "'Open Sans', Arial, sans-serif",
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center', // Vertical center alignment
    height: '140px', // Same as image height for stable vertical centering
    marginBottom: '16px',
    gap: '16px',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
    flexWrap: 'wrap',
  };

  const photoStyle = {
    flexShrink: 0,
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #3f51b5',
    boxShadow: '0 3px 12px rgba(63,81,181,0.3)',
  };

  const noPhotoPlaceholderStyle = {
    ...photoStyle,
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontStyle: 'italic',
    fontSize: '0.95rem',
  };

  const personalInfoStyle = {
    flexGrow: 1,
    height: '100%', // Fill header height for vertical centering
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // Vertically centers name and contacts within header height
    color: '#3f51b5',
  };

  const nameStyle = {
    fontSize: '2.3rem',        // Slightly increased size from 2rem
    fontWeight: 700,
    margin: 0,                // Remove margin for tight stacking
    letterSpacing: '0.05em',
  };

  const contactRowStyle = {
    fontSize: '1rem',          // Increased from 0.85rem
    margin: '2px 0',           // Keep smaller vertical margins for tight spacing
    color: '#555',
  };

  const sectionStyle = {
    marginBottom: '10px',
    paddingBottom: '2px',
    borderBottom: '1px solid #ddd',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
    pageBreakAfter: 'auto',
  };

  const sectionTitleStyle = {
    fontFamily: "'Merriweather', serif",
    fontWeight: 700,
    fontSize: '1.2rem',
    color: '#3f51b5',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderLeft: '4px solid #3f51b5',
    paddingLeft: '8px',
  };

  const paragraphStyle = {
    fontSize: '0.85rem',
    lineHeight: 1.25,
    color: '#444',
    marginBottom: '6px',
  };

  const listStyle = {
    listStyleType: 'disc',
    paddingLeft: '18px',
    marginBottom: '4px',
  };

  const listItemStyle = {
    fontSize: '0.85rem',
    marginBottom: '2px',
    color: '#444',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: '8px',
  };

  const tableHeaderStyle = {
    backgroundColor: '#3f51b5',
    color: '#fff',
    textAlign: 'left',
    padding: '6px 8px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    fontSize: '0.85rem', // Decreased font size for headers
  };

  const tableRowStyle = {
    borderBottom: '1px solid #eee',
  };

  const tableCellStyle = {
    padding: '6px 8px',
    color: '#444',
    fontSize: '0.85rem',
  };

  const skillsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 16px',
  };

  const skillBarContainer = {
    backgroundColor: '#eee',
    borderRadius: 10,
    height: 14,
    width: '100%',
    overflow: 'hidden',
  };

  const skillBarFill = (percent) => ({
    height: '100%',
    width: percent,
    backgroundColor: '#3f51b5',
    borderRadius: '10px 0 0 10px',
  });

  const tagsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  };

  const tagStyle = {
    backgroundColor: '#3f51b5',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: '0.85rem',
    fontWeight: 600,
    userSelect: 'none',
  };

  const renderEducation = (education) => (
    <table style={tableStyle} aria-label="Education details">
      <thead>
        <tr>
          <th style={tableHeaderStyle}>Degree</th>
          <th style={tableHeaderStyle}>Institute</th>
          <th style={tableHeaderStyle}>Year</th>
        </tr>
      </thead>
      <tbody>
        {education.map((item, idx) => (
          <tr key={idx} style={tableRowStyle}>
            <td style={tableCellStyle}>{item.degree || '-'}</td>
            <td style={tableCellStyle}>{item.institute || '-'}</td>
            <td style={tableCellStyle}>{item.year || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderWorkExperience = (workExp) => (
  <table style={tableStyle} aria-label="Work experience details">
    <thead>
      <tr>
        <th style={tableHeaderStyle}>Company</th>
        <th style={tableHeaderStyle}>Designation</th>
        <th style={tableHeaderStyle}>Duration</th>
      </tr>
    </thead>
    <tbody>
      {workExp.map((item, idx) => (
        <React.Fragment key={idx}>
          <tr style={tableRowStyle}>
            <td style={tableCellStyle}>{item.company || '-'}</td>
            <td style={tableCellStyle}>{item.designation || '-'}</td>
            <td style={tableCellStyle}>{item.duration || '-'}</td>
          </tr>
          {item.details?.trim() && (
            <tr>
              <td colSpan={3} style={{ ...tableCellStyle, paddingTop: 0, fontStyle: 'italic', color: '#444' }}>
              {item.details}
              </td>
            </tr>
          )}
        </React.Fragment>
      ))}
    </tbody>
  </table>
);



  const renderSkills = (skills) => (
    <div style={skillsContainerStyle}>
      {skills.map((skill, idx) => {
        let name = '';
        let percentage = '0%';
        if (typeof skill === 'string') {
          name = skill;
          percentage = '';
        } else if (skill.name) {
          name = skill.name;
          percentage = skill.percentage || '0%';
        }
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                marginBottom: 3,
                color: '#1e88e5',
              }}
              title={percentage}
            >
              {name} {percentage ? `(${percentage})` : ''}
            </div>
            <div style={skillBarContainer}>
              <div style={skillBarFill(percentage)} />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSimpleList = (items) => (
    <ul style={listStyle}>
      {items.map((item, idx) => (
        <li key={idx} style={listItemStyle}>{item}</li>
      ))}
    </ul>
  );

  const renderLanguages = (languages) => (
    <div style={tagsContainerStyle}>
      {languages.map((lang, idx) => (
        <div key={idx} style={tagStyle} title={lang}>
          {lang}
        </div>
      ))}
    </div>
  );

  const renderOtherInformation = (otherInfo) => {
    if (!Array.isArray(otherInfo) || otherInfo.length === 0) return null;

    const selectedRadio = otherInfo.find(
      (item) => item.labelType === 'radio' && item.checked && item.name === 'parentSpouse'
    );

    const checkedCheckboxes = otherInfo.filter(
      (item) => item.labelType === 'checkbox' && item.checked
    );

    return (
      <section style={sectionStyle} aria-label="Other Information Section">
        <h2 style={sectionTitleStyle}>Other Information</h2>

        {selectedRadio && (
          <p style={paragraphStyle}>
            <strong>{selectedRadio.label}</strong> {selectedRadio.value || '-'}
          </p>
        )}

        {checkedCheckboxes.map((item) => (
          <p key={item.id} style={paragraphStyle}>
            <strong>{item.label}</strong> {item.value || '-'}
          </p>
        ))}
      </section>
    );
  };

  const combinedLanguages = (() => {
    if (!formData.languages) return [];
    if (!formData.customLanguages || formData.customLanguages.length === 0) return formData.languages;
    const customSelected = formData.customLanguages
      .filter(l => l.selected && l.name.trim() !== '')
      .map(l => l.name.trim());
    return [...new Set([...formData.languages, ...customSelected])];
  })();

  const generatePDF = async () => {
    if (!containerRef.current || !buttonRef.current) {
      alert('Preview content is not available for PDF generation');
      return;
    }

    try {
      buttonRef.current.style.display = 'none';

      const html2pdf = await loadHtml2Pdf();

      await html2pdf()
        .set({
          margin: 10,
          filename: 'cv.pdf',
          image: { type: 'png', quality: 0.98 },
          html2canvas: {
            scale: 3,
            useCORS: true,
            letterRendering: 1,
            backgroundColor: null,
            scrollY: 0,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(containerRef.current)
        .save();
    } catch (error) {
      alert('Error generating PDF: ' + error.message);
    } finally {
      buttonRef.current.style.display = 'inline-block';
    }
  };

  return (
    <article ref={containerRef} style={containerStyle}>
      <header style={headerStyle}>
        {formData.image ? (
          <img
            src={URL.createObjectURL(formData.image)}
            alt="Profile"
            style={photoStyle}
          />
        ) : (
          <div style={noPhotoPlaceholderStyle}>No Photo</div>
        )}
        <div style={personalInfoStyle}>
          {formData.name && <h1 style={nameStyle}>{formData.name}</h1>}
          {formData.phone && <p style={contactRowStyle}>📞 {formData.phone}</p>}
          {formData.email && <p style={contactRowStyle}>✉️ {formData.email}</p>}
          {formData.address && <p style={contactRowStyle}>📍 {formData.address}</p>}
        </div>
      </header>

      {visibleSections.includes('objective') && formData.objective && (
        <section style={sectionStyle} aria-label="Objective Section">
          <h2 style={sectionTitleStyle}>Objective</h2>
          {formData.objective.map((obj, idx) => (
            <p key={idx} style={paragraphStyle}>{obj}</p>
          ))}
        </section>
      )}

      {visibleSections.includes('education') && formData.education?.length > 0 && (
        <section style={sectionStyle} aria-label="Education Section">
          <h2 style={sectionTitleStyle}>Education</h2>
          {renderEducation(formData.education)}
        </section>
      )}

      {visibleSections.includes('workExperience') && formData.workExperience?.length > 0 && (
        <section style={sectionStyle} aria-label="Work Experience Section">
          <h2 style={sectionTitleStyle}>Work Experience</h2>
          {renderWorkExperience(formData.workExperience)}
        </section>
      )}

      {/* Insert Other Information section here after Work Experience */}
      {visibleSections.includes('otherInformation') && renderOtherInformation(formData.otherInformation)}

      {visibleSections.includes('skills') && formData.skills?.length > 0 && (
        <section style={sectionStyle} aria-label="Skills Section">
          <h2 style={sectionTitleStyle}>Skills</h2>
          {renderSkills(formData.skills)}
        </section>
      )}

      {visibleSections.includes('certifications') && formData.certifications?.length > 0 && (
        <section style={sectionStyle} aria-label="Certifications Section">
          <h2 style={sectionTitleStyle}>Certifications</h2>
          {renderSimpleList(formData.certifications)}
        </section>
      )}

      {visibleSections.includes('projects') && formData.projects?.length > 0 && (
        <section style={sectionStyle} aria-label="Projects Section">
          <h2 style={sectionTitleStyle}>Projects</h2>
          {renderSimpleList(formData.projects)}
        </section>
      )}

      {visibleSections.includes('languages') && combinedLanguages.length > 0 && (
        <section style={sectionStyle} aria-label="Languages Section">
          <h2 style={sectionTitleStyle}>Languages</h2>
          {renderLanguages(combinedLanguages)}
        </section>
      )}

      {visibleSections.includes('hobbies') && formData.hobbies?.length > 0 && (
        <section style={sectionStyle} aria-label="Hobbies Section">
          <h2 style={sectionTitleStyle}>Hobbies</h2>
          {renderSimpleList(formData.hobbies)}
        </section>
      )}

      {visibleSections.includes('references') && formData.references?.length > 0 && (
        <section style={sectionStyle} aria-label="References Section">
          <h2 style={sectionTitleStyle}>References</h2>
          {renderSimpleList(formData.references)}
        </section>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={generatePDF}
        style={{
          marginTop: 16,
          cursor: 'pointer',
          padding: '6px 18px',
          fontSize: '0.95rem',
          borderRadius: 6,
          border: 'none',
          backgroundColor: '#3f51b5',
          color: 'white',
          transition: 'background-color 0.3s ease',
          alignSelf: 'flex-start',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#303f9f')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3f51b5')}
      >
        Download PDF
      </button>
    </article>
  );
};

Template1PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.array,
};

export default Template1PDF;
