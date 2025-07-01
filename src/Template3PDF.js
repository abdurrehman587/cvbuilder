import React, { useRef, useState, useEffect } from 'react';
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

const Template3PDF = ({ formData, visibleSections = [] }) => {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  // Check if download was already completed for this session
  useEffect(() => {
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
  }, []);

  const containerStyle = {
    width: '100%',
    margin: '0',
    padding: '0',
    background: '#ffffff',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#2d3748',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    minHeight: '100vh',
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
    color: '#ffffff',
    padding: '20px 20px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  };

  const headerOverlay = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.1)',
    zIndex: 1,
  };

  const headerContent = {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '25px',
    flexWrap: 'wrap',
  };

  const photoStyle = {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '5px solid rgba(255,255,255,0.4)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  };

  const noPhotoPlaceholderStyle = {
    ...photoStyle,
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontStyle: 'italic',
    fontSize: '1rem',
  };

  const personalInfoStyle = {
    flexGrow: 1,
    textAlign: 'left',
  };

  const nameStyle = {
    fontSize: '2.5rem',
    fontWeight: 800,
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    color: '#ffffff',
  };

  const titleStyle = {
    fontSize: '1.2rem',
    fontWeight: 400,
    margin: '0 0 10px 0',
    opacity: 0.9,
    letterSpacing: '0.05em',
    color: '#ffffff',
  };

  const contactRowStyle = {
    fontSize: '0.95rem',
    margin: '3px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: 0.9,
    color: '#ffffff',
    fontWeight: 700,
  };

  const contentStyle = {
    padding: '0px 20px',
    flexGrow: 1,
  };

  const sectionStyle = {
    marginBottom: '0px',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  };

  const sectionTitleStyle = {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#22c55e',
    marginBottom: '0px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderBottom: '2px solid #22c55e',
    paddingBottom: '1px',
    position: 'relative',
  };

  const paragraphStyle = {
    fontSize: '0.95rem',
    lineHeight: 1.3,
    color: '#4a5568',
    marginBottom: '0px',
    textAlign: 'justify',
  };

  const listStyle = {
    listStyleType: 'none',
    paddingLeft: '0',
    marginBottom: '0px',
  };

  const listItemStyle = {
    fontSize: '0.95rem',
    marginBottom: '0px',
    color: '#4a5568',
    paddingLeft: '18px',
    position: 'relative',
  };

  const skillsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    justifyContent: 'center',
  };

  const skillItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  };

  const skillNameStyle = {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#2d3748',
    marginBottom: '4px',
    textAlign: 'center',
  };

  const circularProgressContainer = {
    position: 'relative',
    width: '60px',
    height: '60px',
    marginBottom: '4px',
  };

  const circularProgressSvg = {
    width: '60px',
    height: '60px',
    transform: 'rotate(-90deg)',
  };

  const circularProgressBackground = {
    fill: 'none',
    stroke: '#e2e8f0',
    strokeWidth: '6',
  };

  const circularProgressFill = (percentage) => ({
    fill: 'none',
    stroke: '#22c55e',
    strokeWidth: '6',
    strokeLinecap: 'round',
    strokeDasharray: `${2 * Math.PI * 27}`,
    strokeDashoffset: `${2 * Math.PI * 27 * (1 - parseInt(percentage) / 100)}`,
    transition: 'stroke-dashoffset 0.5s ease',
  });

  const circularProgressText = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#2d3748',
  };

  const tagsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3px',
    marginTop: '3px',
  };

  const tagStyle = {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#ffffff',
    padding: '3px 6px',
    borderRadius: '14px',
    fontSize: '0.85rem',
    fontWeight: 500,
    boxShadow: '0 2px 4px rgba(34, 197, 94, 0.3)',
  };

  const experienceItemStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px',
    marginBottom: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.2s',
  };

  const experienceHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '3px',
    flexWrap: 'wrap',
    gap: '4px',
  };

  const experienceTitleStyle = {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#2d3748',
    margin: '0',
  };

  const experienceCompanyStyle = {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#22c55e',
    margin: '0',
  };

  const experienceDateStyle = {
    fontSize: '0.85rem',
    color: '#718096',
    fontWeight: 500,
    background: '#f0fdf4',
    padding: '1px 4px',
    borderRadius: '4px',
  };

  const educationItemStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '6px',
    marginBottom: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  const educationHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
    flexWrap: 'wrap',
    gap: '4px',
  };

  const educationTitleStyle = {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#2d3748',
    margin: '0',
  };

  const educationInstitutionStyle = {
    fontSize: '0.9rem',
    color: '#22c55e',
    margin: '0',
  };

  const educationDateStyle = {
    fontSize: '0.8rem',
    color: '#718096',
    fontWeight: 500,
  };

  const downloadButtonStyle = {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const downloadButtonDisabledStyle = {
    background: '#cbd5e0',
    cursor: 'not-allowed',
    boxShadow: 'none',
  };

  const renderEducation = (education) => (
    <div style={educationItemStyle}>
      <div style={educationHeaderStyle}>
        <div>
          <h4 style={educationTitleStyle}>{education.degree}</h4>
          <p style={educationInstitutionStyle}>{education.institute}</p>
        </div>
        <span style={educationDateStyle}>{education.year}</span>
      </div>
    </div>
  );

  const renderWorkExperience = (workExp) => (
    <div style={experienceItemStyle}>
      <div style={experienceHeaderStyle}>
        <div>
          <h4 style={experienceTitleStyle}>{workExp.designation}</h4>
          <p style={experienceCompanyStyle}>{workExp.company}</p>
        </div>
        <span style={experienceDateStyle}>{workExp.duration}</span>
      </div>
      {workExp.details && <p style={paragraphStyle}>{workExp.details}</p>}
    </div>
  );

  const renderSkills = (skills) => (
    <div style={skillsContainerStyle}>
      {skills.map((skill, index) => (
        <div key={index} style={skillItemStyle}>
          <div style={skillNameStyle}>{skill.name}</div>
          <div style={circularProgressContainer}>
            <svg style={circularProgressSvg}>
              <circle style={circularProgressBackground} cx="30" cy="30" r="27"></circle>
              <circle style={circularProgressFill(skill.percentage)} cx="30" cy="30" r="27"></circle>
            </svg>
            <span style={circularProgressText}>{skill.percentage}</span>
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
      <ul style={listStyle}>
        {validItems.map((item, index) => (
          <li key={index} style={listItemStyle}>
            <span style={{
              position: 'absolute',
              left: '0',
              color: '#22c55e',
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
      {languages.map((language, index) => (
        <span key={index} style={tagStyle}>
          {language}
        </span>
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
        <h3 style={sectionTitleStyle}>Other Information</h3>
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
    console.log('Template3PDF - renderCustomSections called with:', customSections);
    
    if (!customSections || customSections.length === 0) {
      console.log('Template3PDF - renderCustomSections: no customSections or empty array');
      return null;
    }

    return customSections.map((section, sectionIndex) => {
      console.log(`Template3PDF - processing section ${sectionIndex}:`, section);
      
      // Get title and items, supporting both new and old structure
      const sectionTitle = section.title || section.heading || 'Additional Information';
      const sectionItems = section.items || section.details || [];
      
      // Simplified validation: show section if it has a resolved title AND valid items
      const hasTitle = sectionTitle && sectionTitle.trim() !== '';
      
      // Filter out empty items for display
      const validItems = sectionItems.filter(item => item && item.trim() !== '');
      
      // Only show sections that have both a title AND valid items
      if (!hasTitle || validItems.length === 0) {
        console.log(`Template3PDF - section ${sectionIndex} hidden: no title or no valid items`);
        return null;
      }
      
      console.log(`Template3PDF - rendering section ${sectionIndex}:`, sectionTitle);
      return (
        <div key={sectionIndex} style={sectionStyle}>
          <h3 style={sectionTitleStyle}>{sectionTitle}</h3>
          <ul style={listStyle}>
            {validItems.map((item, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </div>
      );
    });
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
          margin: 5,
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
        buttonRef.current.style.display = 'block';
      }
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    setPaymentCompleted(false); // Don't auto-complete, wait for admin approval
    setShowPaymentModal(false);
    
    // Show message about waiting for approval
    alert(`Payment proof submitted successfully!\n\nPayment ID: ${paymentData.paymentId}\n\nPlease wait for manual verification. You will be able to download once approved.`);
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again.');
  };

  const checkForApprovedPayment = () => {
    // Check if user is admin (bypass payment)
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
    
    if (isAdmin) {
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
    // Check both localStorage and user object for admin access
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
    
    if (isAdmin) {
      return 'Download Now (Admin Access)';
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

  const handleDownloadClick = () => {
    // Check both localStorage and user object for admin access
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
    
    if (isAdmin) {
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

  // Get admin access status for use in render
  const adminAccess = localStorage.getItem('admin_cv_access');

  return (
    <>
      <div ref={containerRef} style={containerStyle}>
        {/* Header Section */}
        <div style={headerStyle}>
          <div style={headerOverlay}></div>
          <div style={headerContent}>
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
              <h1 style={nameStyle}>{formData.name || 'Your Name'}</h1>
              {formData.title && <h2 style={titleStyle}>{formData.title}</h2>}
              <div>
                {formData.email && (
                  <div style={contactRowStyle}>
                    <span>📧</span> {formData.email}
                  </div>
                )}
                {formData.phone && (
                  <div style={contactRowStyle}>
                    <span>📱</span> {formData.phone}
                  </div>
                )}
                {formData.address && (
                  <div style={contactRowStyle}>
                    <span>📍</span> {formData.address}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={contentStyle}>
          {/* Objective */}
          {visibleSections.includes('objective') && formData.objective && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Objective</h3>
              {Array.isArray(formData.objective) ? (
                formData.objective.map((obj, index) => (
                  <p key={index} style={paragraphStyle}>{obj}</p>
                ))
              ) : (
                <p style={paragraphStyle}>{formData.objective}</p>
              )}
            </div>
          )}

          {/* Education */}
          {visibleSections.includes('education') && formData.education && formData.education.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Education</h3>
              {formData.education.map((edu, index) => (
                <div key={index}>{renderEducation(edu)}</div>
              ))}
            </div>
          )}

          {/* Work Experience */}
          {visibleSections.includes('workExperience') && formData.workExperience && formData.workExperience.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Work Experience</h3>
              {formData.workExperience.map((exp, index) => (
                <div key={index}>{renderWorkExperience(exp)}</div>
              ))}
            </div>
          )}

          {/* Skills */}
          {visibleSections.includes('skills') && formData.skills && formData.skills.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Skills</h3>
              {renderSkills(formData.skills)}
            </div>
          )}

          {/* Other Information */}
          {visibleSections.includes('otherInformation') && formData.otherInformation && (
            renderOtherInformation(formData.otherInformation)
          )}

          {/* Certifications */}
          {visibleSections.includes('certifications') && formData.certifications && formData.certifications.length > 0 && (() => {
            const certificationsList = renderSimpleList(formData.certifications);
            return certificationsList ? (
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Certifications</h3>
                {certificationsList}
              </div>
            ) : null;
          })()}

          {/* Projects */}
          {visibleSections.includes('projects') && formData.projects && formData.projects.length > 0 && (() => {
            const projectsList = renderSimpleList(formData.projects);
            return projectsList ? (
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Projects</h3>
                {projectsList}
              </div>
            ) : null;
          })()}

          {/* Languages */}
          {visibleSections.includes('languages') && formData.languages && formData.languages.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Languages</h3>
              {renderLanguages(formData.languages)}
            </div>
          )}

          {/* Hobbies */}
          {visibleSections.includes('hobbies') && formData.hobbies && formData.hobbies.length > 0 && (() => {
            const hobbiesList = renderSimpleList(formData.hobbies);
            return hobbiesList ? (
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Hobbies</h3>
                {hobbiesList}
              </div>
            ) : null;
          })()}

          {/* Custom Sections - rendered before references */}
          {(() => {
            console.log('Template3PDF - customSections check:', {
              visibleSections,
              hasCustomSections: visibleSections.includes('customSections'),
              formDataCustomSections: formData.customSections,
              customSectionsLength: formData.customSections?.length
            });
            return visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
              renderCustomSections(formData.customSections)
            );
          })()}

          {/* References */}
          {visibleSections.includes('references') && (() => {
            const referencesList = renderSimpleList(formData.references);
            return (
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>References</h3>
                {referencesList ? referencesList : (
                  <p style={paragraphStyle}>References would be furnished on demand</p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Download Button */}
        {(() => {
          // Check both localStorage and user object for admin access
          const adminAccess = localStorage.getItem('admin_cv_access');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
          
          return (isAdmin || !downloadCompleted) ? (
            <button
              ref={buttonRef}
              type="button"
              onClick={handleDownloadClick}
              style={{
                ...downloadButtonStyle,
                ...(downloadCompleted && adminAccess !== 'true' && downloadButtonDisabledStyle)
              }}
              onMouseEnter={(e) => {
                if (!downloadCompleted || adminAccess === 'true') {
                  e.currentTarget.style.backgroundColor = '#16a34a';
                }
              }}
              onMouseLeave={(e) => {
                if (!downloadCompleted || adminAccess === 'true') {
                  e.currentTarget.style.backgroundColor = '#22c55e';
                }
              }}
            >
              {getDownloadButtonText()}
            </button>
          ) : (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e',
              borderRadius: 6,
              color: '#15803d',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}>
              ✅ CV Downloaded Successfully!<br />
              <small>Sign out and sign in again to download another CV.</small>
            </div>
          );
        })()}
      </div>

      {/* Payment Modal - Outside PDF container */}
      {showPaymentModal && (
        <ManualPayment
          amount={100}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

Template3PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.arrayOf(PropTypes.string),
};

export default Template3PDF;
