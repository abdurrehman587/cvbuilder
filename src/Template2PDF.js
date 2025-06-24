import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import JazzCashPayment from './JazzCashPayment';

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  // Check if download was already completed for this session
  React.useEffect(() => {
    const adminAccess = localStorage.getItem('admin_cv_access');
    
    if (adminAccess === 'true') {
      // Admin users can download unlimited times
      setDownloadCompleted(false);
      return;
    }
    
    const hasDownloaded = localStorage.getItem('cv_downloaded');
    if (hasDownloaded) {
      setDownloadCompleted(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const styles = {
    container: {
      display: 'flex',
      fontFamily: "'Roboto', sans-serif",
      boxSizing: 'border-box',
      position: 'relative',
    },
    leftColumn: {
      width: '35%',
      backgroundColor: '#f4f4f4',
      color: '#333333',
      padding: '25px 20px',
      boxSizing: 'border-box',
    },
    rightColumn: {
      width: '65%',
      backgroundColor: 'transparent',
      padding: '20px 25px',
      boxSizing: 'border-box',
    },
    photo: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '5px solid #3498db',
      margin: '0 auto 20px',
      display: 'block',
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

      // Mark download as completed (only for non-admin users)
      const adminAccess = localStorage.getItem('admin_cv_access');
      if (adminAccess !== 'true') {
        setDownloadCompleted(true);
        localStorage.setItem('cv_downloaded', 'true'); // Persist download state
      }
      
    } catch (error) {
      alert('Error generating PDF: ' + error.message);
    } finally {
      if (buttonRef.current) {
        buttonRef.current.style.display = 'block';
      }
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    // Now trigger the PDF download
    generatePDF();
  };

  const handlePaymentFailure = (error) => {
    console.log('Payment failed:', error);
    setShowPaymentModal(false);
    alert('Payment failed. Please try again.');
  };

  const checkForApprovedPayment = () => {
    // Check if user is admin (bypass payment)
    const adminAccess = localStorage.getItem('admin_cv_access');
    if (adminAccess === 'true') {
      return true;
    }

    // Check localStorage for approved payments
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('payment_')) {
        try {
          const payment = JSON.parse(localStorage.getItem(key));
          if (payment.status === 'approved') {
            return true;
          }
        } catch (error) {
          console.error('Error parsing payment:', error);
        }
      }
    }
    return false;
  };

  const getDownloadButtonText = () => {
    const adminAccess = localStorage.getItem('admin_cv_access');
    if (adminAccess === 'true') {
      return 'Download Now (Admin Access)';
    }

    if (paymentCompleted) {
      return 'Download PDF';
    }
    
    const hasApprovedPayment = checkForApprovedPayment();
    if (hasApprovedPayment) {
      return 'Payment Approved (Download Now)';
    }
    
    return 'Download PDF (PKR 200)';
  };

  const handleDownloadClick = () => {
    const adminAccess = localStorage.getItem('admin_cv_access');
    if (adminAccess === 'true') {
      generatePDF();
      return;
    }

    if (downloadCompleted) {
      alert('You have already downloaded a CV in this session. Please sign out and sign in again to download another CV.');
      return;
    }
    
    // Check if user has an approved payment
    const hasApprovedPayment = checkForApprovedPayment();
    
    if (hasApprovedPayment) {
      // User has an approved payment, allow download
      generatePDF();
    } else {
      // Show payment modal
      setShowPaymentModal(true);
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

  const renderSimpleList = (items) => {
    // Filter out empty, null, or whitespace-only items
    const validItems = items.filter(item => {
      if (item === null || item === undefined) return false;
      if (typeof item === 'string') return item.trim() !== '';
      if (typeof item === 'object') {
        const value = item.label || item.value || item.name;
        return value && value.trim() !== '';
      }
      return true;
    });

    if (validItems.length === 0) return null;

    return (
      <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
        {validItems.map((item, idx) => (
          <li key={idx} style={styles.listItem}>
            <span style={{
              position: 'absolute',
              left: '0',
              color: '#2ecc71',
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}>✦</span>
            {typeof item === 'string' ? item : 
             typeof item === 'object' && item !== null ? 
               (item.label || item.value || item.name || JSON.stringify(item)) : 
               String(item)}
          </li>
        ))}
      </ul>
    );
  };

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

  // Get admin access status for use in render
  const adminAccess = localStorage.getItem('admin_cv_access');

  return (
    <div ref={containerRef} style={{ ...styles.container, paddingBottom: '50px' }}>
      <div style={styles.leftColumn}>
        {formData.image ? (
          <img src={URL.createObjectURL(formData.image)} alt="Profile" style={styles.photo} />
        ) : formData.imageUrl ? (
          <img src={formData.imageUrl} alt="Profile" style={styles.photo} />
        ) : (
          <div style={styles.noPhoto}>No Photo</div>
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

        {visibleSections.includes('hobbies') && formData.hobbies && formData.hobbies.length > 0 && (() => {
          const hobbiesList = renderSimpleList(formData.hobbies);
          return hobbiesList ? (
            <div style={styles.leftSection}>
              <h2 style={styles.leftSectionTitle}>Hobbies</h2>
              {hobbiesList}
            </div>
          ) : null;
        })()}
      </div>

      <div style={styles.rightColumn}>
        <div style={styles.rightHeader}>
          <h1 style={styles.name}>{formData.name || 'Your Name'}</h1>
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

        {visibleSections.includes('projects') && formData.projects && formData.projects.length > 0 && (() => {
          const projectsList = renderSimpleList(formData.projects);
          return projectsList ? (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>Projects</h2>
              {projectsList}
            </div>
          ) : null;
        })()}

        {visibleSections.includes('certifications') && formData.certifications && formData.certifications.length > 0 && (() => {
          const certificationsList = renderSimpleList(formData.certifications);
          return certificationsList ? (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>Certifications</h2>
              {certificationsList}
            </div>
          ) : null;
        })()}

        {visibleSections.includes('references') && (
          <div style={styles.rightSection}>
            <h2 style={styles.rightSectionTitle}>References</h2>
            {formData.references && formData.references.length > 0 ? (
              renderSimpleList(formData.references)
            ) : (
              <p style={styles.paragraph}>Reference would be furnished on demand</p>
            )}
          </div>
        )}
      </div>
      {/* Download Button - Same logic as Template3 */}
      {(adminAccess === 'true' || !downloadCompleted) ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleDownloadClick}
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
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ecc71')}
        >
          {getDownloadButtonText()}
        </button>
      ) : (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '5px',
          color: '#0369a1',
          fontSize: '0.9rem',
          textAlign: 'center',
          maxWidth: '300px',
        }}>
          ✅ CV Downloaded Successfully!<br />
          <small>Sign out and sign in again to download another CV.</small>
        </div>
      )}

      {showPaymentModal && (
        <JazzCashPayment
          amount={200}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

Template2PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.array,
};

export default Template2PDF;
