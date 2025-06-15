import React, { useRef } from 'react';
import PropTypes from 'prop-types';

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

const Template2PDF = ({ formData, visibleSections = [] }) => {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      fontFamily: "'Roboto', sans-serif",
      boxSizing: 'border-box',
      position: 'relative',
      width: '100%',
      maxWidth: '210mm',
      margin: '0 auto',
      background: '#fff',
      borderRadius: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      flexWrap: 'wrap',
    },
    leftColumn: {
      width: '35%',
      minWidth: '220px',
      backgroundColor: '#f4f4f4',
      color: '#333333',
      padding: '25px 20px',
      boxSizing: 'border-box',
      borderRadius: '10px 0 0 10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    rightColumn: {
      width: '65%',
      minWidth: '220px',
      backgroundColor: 'transparent',
      padding: '20px 25px',
      boxSizing: 'border-box',
      borderRadius: '0 10px 10px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    photo: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '5px solid #3498db',
      margin: '0 auto 20px',
      display: 'block',
      background: '#fff',
    },
    noPhoto: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      backgroundColor: '#bdc3c7',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#2c3e50',
      fontSize: '1rem',
    },
    leftSection: {
      marginBottom: '20px',
      breakInside: 'avoid',
      pageBreakInside: 'avoid',
    },
    leftSectionTitle: {
      fontSize: '1.4rem',
      color: '#3498db',
      textTransform: 'uppercase',
      marginBottom: '15px',
      borderBottom: '2px solid #3498db',
      paddingBottom: '5px',
      letterSpacing: '1px',
    },
    contactInfo: {
      fontSize: '0.9rem',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
    },
    contactIcon: {
      marginRight: '10px',
      width: '16px',
    },
    skill: {
      marginBottom: '15px',
    },
    skillName: {
      fontSize: '1rem',
      fontWeight: 'bold',
      marginBottom: '5px',
    },
    skillBar: {
      height: '8px',
      backgroundColor: '#7f8c8d',
      borderRadius: '4px',
    },
    skillProgress: (percentage) => ({
      height: '100%',
      width: percentage,
      backgroundColor: '#3498db',
      borderRadius: '4px',
    }),
    language: {
      backgroundColor: '#3498db',
      color: '#fff',
      padding: '5px 10px',
      borderRadius: '5px',
      margin: '0 5px 5px 0',
      display: 'inline-block',
      fontSize: '0.9rem',
    },
    rightHeader: {
      textAlign: 'left',
      marginBottom: '15px',
    },
    name: {
      fontSize: '3.5rem',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: '0',
      lineHeight: '1.1',
    },
    rightSection: {
      marginBottom: '8px',
      breakInside: 'avoid',
      pageBreakInside: 'avoid',
    },
    rightSectionTitle: {
      fontSize: '1.6rem',
      color: '#2c3e50',
      textTransform: 'uppercase',
      marginBottom: '10px',
      borderBottom: '3px solid #2c3e50',
      paddingBottom: '5px',
    },
    paragraph: {
      fontSize: '1rem',
      lineHeight: '1.3',
      color: '#34495e',
      textAlign: 'justify',
    },
    listItem: {
      fontSize: '1rem',
      lineHeight: '1.2',
      color: '#34495e',
      listStyleType: 'square',
      marginLeft: '20px',
      margin: '0 0 5px 0',
    },
    experienceItem: {
      marginBottom: '4px',
    },
    itemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    itemTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#34495e',
      margin: 0,
    },
    itemSubtitle: {
      fontSize: '1rem',
      fontStyle: 'italic',
      color: '#7f8c8d',
      margin: '2px 0 4px 0',
    },
    itemDate: {
      fontSize: '1rem',
      color: '#3498db',
      fontWeight: 'bold',
    },
  };

  // Add responsive styles using a style tag
  const responsiveStyles = `
@media (max-width: 1100px) {
  .template2-container {
    flex-direction: column !important;
    max-width: 100vw !important;
    border-radius: 10px !important;
  }
  .template2-left, .template2-right {
    width: 100% !important;
    min-width: 0 !important;
    border-radius: 10px !important;
    padding-left: 8vw !important;
    padding-right: 8vw !important;
  }
  .template2-left {
    border-radius: 10px 10px 0 0 !important;
    padding-top: 32px !important;
    padding-bottom: 18px !important;
  }
  .template2-right {
    border-radius: 0 0 10px 10px !important;
    padding-top: 18px !important;
    padding-bottom: 32px !important;
  }
}
@media (max-width: 700px) {
  .template2-left, .template2-right {
    padding-left: 4vw !important;
    padding-right: 4vw !important;
  }
  .template2-left, .template2-right {
    font-size: 0.97rem !important;
  }
  .template2-photo, .template2-nophoto {
    width: 100px !important;
    height: 100px !important;
    min-width: 100px !important;
    min-height: 100px !important;
    margin-bottom: 12px !important;
  }
}
@media (max-width: 480px) {
  .template2-left, .template2-right {
    padding-left: 2vw !important;
    padding-right: 2vw !important;
    font-size: 0.93rem !important;
  }
  .template2-photo, .template2-nophoto {
    width: 70px !important;
    height: 70px !important;
    min-width: 70px !important;
    min-height: 70px !important;
    margin-bottom: 8px !important;
  }
  .template2-name {
    font-size: 2rem !important;
  }
}
`;

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
          margin: 0,
          filename: 'cv.pdf',
          image: { type: 'png', quality: 0.98 },
          html2canvas: {
            scale: 3,
            useCORS: true,
            letterRendering: 1,
            backgroundColor: '#f4f4f4',
            scrollY: 0,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(containerRef.current)
        .save();
    } catch (error) {
      alert('Error generating PDF: ' + error.message);
    } finally {
      if (buttonRef.current) {
        buttonRef.current.style.display = 'inline-block';
      }
    }
  };

  const renderSkills = (skills) => (
    <div>
      {skills.map((skill, idx) => (
        <div key={idx} style={styles.skill}>
          <div style={styles.skillName}>{skill.name}</div>
          <div style={styles.skillBar}>
            <div style={styles.skillProgress(skill.percentage || '0%')}></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSimpleList = (items) => (
    <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
      {items.map((item, idx) => (
        <li key={idx} style={styles.listItem}>{item}</li>
      ))}
    </ul>
  );

  const renderLanguages = (languages, customLanguages) => {
    const allLanguages = [...languages];
    customLanguages.forEach(lang => {
      if (lang.selected && lang.name) {
        allLanguages.push(lang.name);
      }
    });

    return (
      <div>
        {allLanguages.map((lang, idx) => (
          <span key={idx} style={styles.language}>{lang}</span>
        ))}
      </div>
    );
  };

  const renderOtherInformation = (otherInfo) => {
    if (!Array.isArray(otherInfo) || otherInfo.length === 0) return null;

    const selectedRadio = otherInfo.find(
      (item) => item.labelType === 'radio' && item.checked && item.name === 'parentSpouse'
    );

    const checkedCheckboxes = otherInfo.filter(
      (item) => item.labelType === 'checkbox' && item.checked
    );

    if (!selectedRadio && checkedCheckboxes.length === 0) return null;

    return (
      <div style={styles.leftSection}>
        <h2 style={styles.leftSectionTitle}>Other Information</h2>
        {selectedRadio && (
          <div style={styles.contactInfo}>
            <strong>{selectedRadio.label}:</strong>&nbsp;{selectedRadio.value || '-'}
          </div>
        )}
        {checkedCheckboxes.map((item) => (
          <div key={item.id} style={styles.contactInfo}>
            <strong>{item.label}:</strong>&nbsp;{item.value || '-'}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{responsiveStyles}</style>
      <div
        ref={containerRef}
        className="template2-container"
        style={styles.container}
      >
        <div className="template2-left" style={styles.leftColumn}>
          {formData.image ? (
            <img src={URL.createObjectURL(formData.image)} alt="Profile" className="template2-photo" style={styles.photo} />
          ) : (
            <div className="template2-nophoto" style={styles.noPhoto}>No Photo</div>
          )}

          <div style={styles.leftSection}>
            <h2 style={styles.leftSectionTitle}>Contact</h2>
            {formData.phone && <p style={styles.contactInfo}><span style={styles.contactIcon}>📞</span>{formData.phone}</p>}
            {formData.email && <p style={styles.contactInfo}><span style={styles.contactIcon}>✉️</span>{formData.email}</p>}
            {formData.address && <p style={styles.contactInfo}><span style={styles.contactIcon}>📍</span>{formData.address}</p>}
          </div>

          {visibleSections.includes('otherInformation') && renderOtherInformation(formData.otherInformation)}

          {visibleSections.includes('skills') && formData.skills?.length > 0 && (
            <div style={styles.leftSection}>
              <h2 style={styles.leftSectionTitle}>Skills</h2>
              {renderSkills(formData.skills)}
            </div>
          )}

          {visibleSections.includes('languages') && formData.languages?.length > 0 && (
            <div style={styles.leftSection}>
              <h2 style={styles.leftSectionTitle}>Languages</h2>
              {renderLanguages(formData.languages || [], formData.customLanguages || [])}
            </div>
          )}


          {visibleSections.includes('hobbies') && formData.hobbies?.length > 0 && (
            <div style={styles.leftSection}>
              <h2 style={styles.leftSectionTitle}>Hobbies</h2>
              {renderSimpleList(formData.hobbies)}
            </div>
          )}
        </div>

        <div className="template2-right" style={styles.rightColumn}>
          <div style={styles.rightHeader}>
            <h1 className="template2-name" style={styles.name}>{formData.name || 'Your Name'}</h1>
          </div>

          {visibleSections.includes('objective') && formData.objective && (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>Objective</h2>
              <p style={styles.paragraph}>{formData.objective}</p>
            </div>
          )}

          {visibleSections.includes('workExperience') && formData.workExperience?.length > 0 && (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>Work Experience</h2>
              {formData.workExperience.map((exp, idx) => (
                <div key={idx} style={styles.experienceItem}>
                  <div style={styles.itemHeader}>
                    <h3 style={styles.itemTitle}>{exp.designation}</h3>
                    <span style={styles.itemDate}>{exp.duration}</span>
                  </div>
                  <h4 style={styles.itemSubtitle}>{exp.company}</h4>

                  {/* Existing description rendering */}
                  {exp.description && <p style={styles.paragraph}>{exp.description}</p>}

                  {/* ✅ NEW: Additional Details rendering below description, if any */}
                  {exp.details?.trim() && (
                    <p style={{ ...styles.paragraph, marginTop: '0px' }}>{exp.details}</p>
                  )}
                </div>
              ))}
            </div>
          )}


          {visibleSections.includes('education') && formData.education?.length > 0 && (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>Education</h2>
              {formData.education.map((edu, idx) => (
                <div key={idx} style={styles.experienceItem}>
                  <div style={styles.itemHeader}>
                    <h3 style={styles.itemTitle}>{edu.degree}</h3>
                    <span style={styles.itemDate}>{edu.year}</span>
                  </div>
                  <h4 style={styles.itemSubtitle}>{edu.institute}</h4>
                </div>
              ))}
            </div>
          )}

          {visibleSections.includes('projects') && formData.projects?.length > 0 && (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>Projects</h2>
              {renderSimpleList(formData.projects)}
            </div>
          )}

          {visibleSections.includes('certifications') && formData.certifications?.length > 0 && (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>Certifications</h2>
              {renderSimpleList(formData.certifications)}
            </div>
          )}

          {visibleSections.includes('references') && formData.references?.length > 0 && (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>References</h2>
              {renderSimpleList(formData.references)}
            </div>
          )}
        </div>
        <button
          ref={buttonRef}
          type="button"
          onClick={generatePDF}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            fontSize: '1rem',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#2ecc71',
            color: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
        >
          Download PDF
        </button>
      </div>
    </>
  );
};

Template2PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.array,
};

export default Template2PDF;
