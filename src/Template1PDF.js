// Template1PDF.js - Version 2.1 - Custom Sections Fix - CACHE BUSTED
// Last updated: 2024-12-19 15:45:00
// Unique ID: CS_FIX_20241219_1545
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ManualPayment from './ManualPayment';


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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Check if download was already completed for this session
  React.useEffect(() => {
    // Check both localStorage and user object for admin access
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
    
    setIsAdminUser(isAdmin);
    
    if (isAdmin) {
      // Admin users can download unlimited times
      setDownloadCompleted(false);
      return;
    }
    
    const hasDownloaded = localStorage.getItem('cv_downloaded');
    if (hasDownloaded) {
      setDownloadCompleted(true);
    }
  }, []);

  // Add a periodic check to maintain admin status
  React.useEffect(() => {
    const checkAdminStatus = () => {
      const adminAccess = localStorage.getItem('admin_cv_access');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
      
      if (isAdmin !== isAdminUser) {
        setIsAdminUser(isAdmin);
        console.log('Admin status updated:', isAdmin);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkAdminStatus, 5000);
    
    return () => clearInterval(interval);
  }, [isAdminUser]);

  const containerStyle = {
    width: '100%',
    margin: '2px 0 0',
    padding: '24px', // increased from 16px for more page margin
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
    alignItems: 'center',
    height: '100px', // reduced from 140px
    marginBottom: '8px', // reduced from 16px
    gap: '10px', // reduced from 16px
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  };

  const photoStyle = {
    flexShrink: 0,
    width: '100px', // reduced from 140px
    height: '100px', // reduced from 140px
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #3f51b5', // thinner border
    boxShadow: '0 2px 6px rgba(63,81,181,0.2)', // lighter shadow
  };

  const noPhotoPlaceholderStyle = {
    ...photoStyle,
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontStyle: 'italic',
    fontSize: '0.95rem', // restored original font size
  };

  const personalInfoStyle = {
    flexGrow: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: '#3f51b5',
  };

  const nameStyle = {
    fontSize: '2.3rem', // restored original font size
    fontWeight: 700,
    margin: 0,
    letterSpacing: '0.05em',
  };

  const contactRowStyle = {
    fontSize: '1rem', // restored original font size
    margin: '1px 0', // reduced from 2px 0
    color: '#555',
  };

  const sectionStyle = {
    marginBottom: '6px', // reduced from 10px
    paddingBottom: '1px', // reduced from 2px
    borderBottom: '1px solid #ddd',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
    pageBreakAfter: 'auto',
  };

  const sectionTitleStyle = {
    fontFamily: "'Merriweather', serif",
    fontWeight: 700,
    fontSize: '1.2rem', // restored original font size
    color: '#3f51b5',
    marginBottom: '3px', // reduced from 6px
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderLeft: '3px solid #3f51b5', // thinner
    paddingLeft: '5px', // reduced from 8px
  };

  const paragraphStyle = {
    fontSize: '0.85rem', // restored original font size
    lineHeight: 1.15, // reduced from 1.25
    color: '#444',
    marginBottom: '3px', // reduced from 6px
  };

  const listStyle = {
    listStyleType: 'disc',
    paddingLeft: '12px', // reduced from 18px
    marginBottom: '2px', // reduced from 4px
  };

  const listItemStyle = {
    fontSize: '0.85rem', // restored original font size
    marginBottom: '1px', // reduced from 2px
    color: '#444',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    boxShadow: 'none', // remove shadow for compactness
    marginBottom: '4px', // reduced from 8px
  };

  const tableHeaderStyle = {
    backgroundColor: '#3f51b5',
    color: '#fff',
    textAlign: 'left',
    padding: '3px 5px', // reduced from 6px 8px
    fontWeight: 700,
    letterSpacing: '0.04em',
    fontSize: '0.85rem', // restored original font size
  };

  const tableRowStyle = {
    borderBottom: '1px solid #eee',
  };

  const tableCellStyle = {
    padding: '3px 5px', // reduced from 6px 8px
    color: '#444',
    fontSize: '0.85rem', // restored original font size
  };

  const skillsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 8px', // reduced
  };

  const skillBarContainer = {
    backgroundColor: '#eee',
    borderRadius: 6, // reduced from 10
    height: 8, // reduced from 14
    width: '100%',
    overflow: 'hidden',
  };

  const skillBarFill = (percent) => ({
    height: '100%',
    width: percent,
    backgroundColor: '#3f51b5',
    borderRadius: '6px 0 0 6px', // reduced
  });

  const tagsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4, // reduced from 6
  };

  const tagStyle = {
    backgroundColor: '#3f51b5',
    color: '#fff',
    padding: '2px 7px', // reduced
    borderRadius: 14, // reduced from 20
    fontSize: '0.85rem', // restored original font size
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
      <ul style={listStyle}>
        {validItems.map((item, idx) => (
          <li key={idx} style={listItemStyle}>
            <span style={{
              position: 'absolute',
              left: '0',
              color: '#3f51b5',
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
    if (!otherInfo || otherInfo.length === 0) return null;

    const checkedItems = otherInfo.filter(item => 
      (item.labelType === 'radio' && item.checked) ||
      (item.labelType === 'checkbox' && item.checked)
    );

    if (checkedItems.length === 0) return null;

    return (
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Other Information</h2>
        <ul style={listStyle}>
          {checkedItems.map((item, idx) => (
            <li key={idx} style={listItemStyle}>
              {item.label} {item.value || '-'}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderCustomSections = (customSections) => {
    console.log('=== TEMPLATE1PDF VERSION 2.1 CACHE BUSTED RUNNING ===');
    console.log('=== CS_FIX_20241219_1545 ===');
    console.log('Template1PDF - renderCustomSections called with:', customSections);
    console.log('Template1PDF - customSections type:', typeof customSections);
    console.log('Template1PDF - customSections length:', customSections?.length);
    
    if (!customSections || customSections.length === 0) {
      console.log('Template1PDF - renderCustomSections: no customSections or empty array');
      return null;
    }

    return customSections.map((section, sectionIndex) => {
      console.log(`Template1PDF - processing section ${sectionIndex}:`, section);
      console.log(`Template1PDF - section ${sectionIndex} keys:`, Object.keys(section));
      console.log(`Template1PDF - section ${sectionIndex} title:`, section.title);
      console.log(`Template1PDF - section ${sectionIndex} heading:`, section.heading);
      console.log(`Template1PDF - section ${sectionIndex} items:`, section.items);
      console.log(`Template1PDF - section ${sectionIndex} details:`, section.details);
      
      // Get title and items, supporting both new and old structure
      const sectionTitle = section.title || section.heading || 'Additional Information';
      const sectionItems = section.items || section.details || [];
      
      console.log(`Template1PDF - section ${sectionIndex} resolved title:`, sectionTitle);
      console.log(`Template1PDF - section ${sectionIndex} resolved items:`, sectionItems);
      
      // Simplified validation: show section if it has a resolved title AND valid items
      const hasTitle = sectionTitle && sectionTitle.trim() !== '';
      
      // Filter out empty items for display
      const validItems = sectionItems ? sectionItems.filter(item => item && item.trim() !== '') : [];
      console.log(`Template1PDF - section ${sectionIndex} valid items:`, validItems);
      
      // Only show sections that have both a title AND valid items
      if (!hasTitle || validItems.length === 0) {
        console.log(`Template1PDF - section ${sectionIndex} hidden: no title or no valid items`);
        return null;
      }
      
      console.log(`Template1PDF - rendering section ${sectionIndex}:`, sectionTitle);
      return (
        <div key={sectionIndex} style={sectionStyle} aria-label={`${sectionTitle} Section`}>
          <h2 style={sectionTitleStyle}>{sectionTitle}</h2>
          <ul style={listStyle}>
            {validItems.map((item, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </div>
      );
    });
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

      // Mark download as completed (only for non-admin users)
      const adminAccess = localStorage.getItem('admin_cv_access');
      if (adminAccess !== 'true') {
        setDownloadCompleted(true);
        localStorage.setItem('cv_downloaded', 'true'); // Persist download state
      }
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      if (buttonRef.current) {
        buttonRef.current.style.display = 'block'; // ⭐ Button is shown again after download
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

  const handleDownloadClick = () => {
    console.log('Template1PDF - handleDownloadClick called');
    console.log('Template1PDF - isAdminUser:', isAdminUser);
    console.log('Template1PDF - downloadCompleted:', downloadCompleted);
    
    // Use the state instead of checking localStorage every time
    if (isAdminUser) {
      console.log('Template1PDF - Admin user, generating PDF directly');
      generatePDF();
      return;
    }

    if (downloadCompleted) {
      console.log('Template1PDF - Download already completed');
      alert('You have already downloaded a CV in this session. Please sign out and sign in again to download another CV.');
      return;
    }
    
    // Check if user has an approved payment
    const hasApprovedPayment = checkForApprovedPayment();
    console.log('Template1PDF - hasApprovedPayment:', hasApprovedPayment);
    
    if (hasApprovedPayment) {
      // User has an approved payment, allow download
      console.log('Template1PDF - Payment approved, generating PDF');
      generatePDF();
    } else {
      // Show payment modal
      console.log('Template1PDF - No approved payment, showing modal. showPaymentModal will be set to true');
      setShowPaymentModal(true);
    }
  };

  const checkForApprovedPayment = () => {
    // Use the state instead of checking localStorage every time
    if (isAdminUser) {
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
    if (isAdminUser) {
      return 'Download PDF (Admin)';
    }
    
    if (paymentCompleted) {
      return 'Download PDF';
    }
    
    const hasApprovedPayment = checkForApprovedPayment();
    if (hasApprovedPayment) {
      return 'Payment Approved (Download Now)';
    }
    
    return 'Download PDF (PKR 100)';
  };

  return (
    <>
      <article ref={containerRef} style={containerStyle}>
        <header style={headerStyle}>
          {formData.image ? (
            <img
              src={URL.createObjectURL(formData.image)}
              alt="Profile"
              style={photoStyle}
            />
          ) : formData.imageUrl ? (
            <img
              src={formData.imageUrl}
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

        {visibleSections.includes('certifications') && formData.certifications && formData.certifications.length > 0 && (() => {
          const certificationsList = renderSimpleList(formData.certifications);
          return certificationsList ? (
            <section style={sectionStyle} aria-label="Certifications Section">
              <h2 style={sectionTitleStyle}>Certifications</h2>
              {certificationsList}
            </section>
          ) : null;
        })()}

        {visibleSections.includes('projects') && formData.projects && formData.projects.length > 0 && (() => {
          const projectsList = renderSimpleList(formData.projects);
          return projectsList ? (
            <section style={sectionStyle} aria-label="Projects Section">
              <h2 style={sectionTitleStyle}>Projects</h2>
              {projectsList}
            </section>
          ) : null;
        })()}

        {visibleSections.includes('languages') && combinedLanguages.length > 0 && (
          <section style={sectionStyle} aria-label="Languages Section">
            <h2 style={sectionTitleStyle}>Languages</h2>
            {renderLanguages(combinedLanguages)}
          </section>
        )}

        {visibleSections.includes('hobbies') && formData.hobbies && formData.hobbies.length > 0 && (() => {
          const hobbiesList = renderSimpleList(formData.hobbies);
          return hobbiesList ? (
            <section style={sectionStyle} aria-label="Hobbies Section">
              <h2 style={sectionTitleStyle}>Hobbies</h2>
              {hobbiesList}
            </section>
          ) : null;
        })()}

        {/* Custom Sections - rendered before references */}
        {(() => {
          console.log('Template1PDF - customSections check:', {
            visibleSections,
            hasCustomSections: visibleSections.includes('customSections'),
            formDataCustomSections: formData.customSections,
            customSectionsLength: formData.customSections?.length
          });
          
          // Force custom sections to be visible if they exist
          const shouldShowCustomSections = (visibleSections.includes('customSections') || formData.customSections?.length > 0) && 
                                          formData.customSections && 
                                          formData.customSections.length > 0;
          
          console.log('Template1PDF - shouldShowCustomSections:', shouldShowCustomSections);
          
          return shouldShowCustomSections && (
            renderCustomSections(formData.customSections)
          );
        })()}

        {visibleSections.includes('references') && (
          <section style={sectionStyle} aria-label="References Section">
            <h2 style={sectionTitleStyle}>References</h2>
            {formData.references && formData.references.length > 0 ? (
              renderSimpleList(formData.references)
            ) : (
              <p style={paragraphStyle}>References would be furnished on demand</p>
            )}
          </section>
        )}

        {/* Download Button - Same logic as Template3 */}
        {(() => {
          // Use the state instead of checking localStorage every time
          return (isAdminUser || !downloadCompleted) ? (
            <button
              ref={buttonRef}
              type="button"
              onClick={handleDownloadClick}
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
              {getDownloadButtonText()}
            </button>
          ) : (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: 6,
              color: '#0369a1',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}>
              ✅ CV Downloaded Successfully!<br />
              <small>Sign out and sign in again to download another CV.</small>
            </div>
          );
        })()}
      </article>

      {/* Payment Modal - Outside PDF container */}
      {showPaymentModal && (
        <>
          {console.log('Template1PDF - Rendering ManualPayment modal')}
          <ManualPayment
            amount={100}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            onClose={() => setShowPaymentModal(false)}
          />
        </>
      )}
    </>
  );
};

Template1PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.array,
};

export default Template1PDF;
