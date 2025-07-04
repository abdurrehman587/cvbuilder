import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ManualPayment from './ManualPayment';
import { PaymentService } from './paymentService';

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
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [buttonText, setButtonText] = useState('Loading...');

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

  // Check admin status and payment status on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Wait a bit for authentication to be established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check both localStorage and user object for admin access
        const adminAccess = localStorage.getItem('admin_cv_access');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
        
        console.log('Template2PDF - Admin status check:', {
          adminAccess,
          user: user?.email,
          userIsAdmin: user?.isAdmin,
          isAdmin
        });
        
        setIsAdminUser(isAdmin);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Add a periodic check to maintain admin status
  useEffect(() => {
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

  // Update button text based on payment status
  useEffect(() => {
    const updateButtonText = async () => {
      // Don't update button text while loading
      if (isLoading) {
        setButtonText('Loading...');
        return;
      }

      if (isAdminUser) {
        setButtonText('Download PDF (Admin)');
        return;
      }

      try {
        const text = await PaymentService.getDownloadButtonText('template2', isAdminUser);
        setButtonText(text);
      } catch (error) {
        console.error('Error getting button text:', error);
        setButtonText('Download PDF (PKR 100)');
      }
    };

    updateButtonText();
  }, [isAdminUser, isLoading]);

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
          filename: `${formData.name || 'CV'}_template2.pdf`,
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

      // Mark the user's approved payment as used (only for non-admin users)
      if (!isAdminUser) {
        try {
          const approvedPayment = await PaymentService.checkApprovedPayment('template2');
          if (approvedPayment) {
            await PaymentService.markPaymentAsUsed(approvedPayment.id, 'template2');
            console.log('Payment marked as used after download');
            
            // Refresh button text after marking payment as used
            const newButtonText = await PaymentService.getDownloadButtonText('template2', isAdminUser);
            setButtonText(newButtonText);
            console.log('Button text refreshed after download:', newButtonText);
          }
        } catch (error) {
          console.error('Error marking payment as used:', error);
        }
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
    setShowPaymentModal(false);
    
    // Update button text to reflect pending payment status
    setButtonText('Payment Submitted (Waiting for Approval)');
    
    // Don't auto-download - wait for admin approval
    // generatePDF();
  };

  const handlePaymentFailure = (error) => {
    console.log('Payment failed:', error);
    setShowPaymentModal(false);
    alert('Payment failed. Please try again.');
  };

  const handleDownloadClick = async () => {
    console.log('=== DOWNLOAD CLICK START ===');
    console.log('Template2PDF - handleDownloadClick called');
    console.log('Template2PDF - isAdminUser:', isAdminUser);
    
    if (isAdminUser) {
      console.log('Template2PDF - Admin user, generating PDF directly');
      generatePDF();
      return;
    }
    
    try {
      // Check if user has an approved payment
      const approvedPayment = await PaymentService.checkApprovedPayment('template2');
      console.log('Template2PDF - approvedPayment:', approvedPayment);
      
      if (approvedPayment) {
        // User has an approved payment, allow download
        console.log('Template2PDF - Payment approved, generating PDF');
        generatePDF();
      } else {
        // Show payment modal
        console.log('Template2PDF - No approved payment, showing modal');
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
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
    console.log('Template2PDF - renderOtherInformation called with:', otherInfo);
    
    if (!otherInfo || otherInfo.length === 0) {
      console.log('Template2PDF - renderOtherInformation: no otherInfo or empty array');
      return null;
    }

    const checkedItems = otherInfo.filter(item => 
      (item.labelType === 'radio' && item.checked) ||
      (item.labelType === 'checkbox' && item.checked)
    );

    console.log('Template2PDF - renderOtherInformation filtered items:', checkedItems);

    // If no checked items, show all items for debugging
    const itemsToShow = checkedItems.length > 0 ? checkedItems : otherInfo;
    console.log('Template2PDF - renderOtherInformation items to show:', itemsToShow);

    return (
      <div style={styles.leftSection}>
        <h2 style={styles.leftSectionTitle}>Other Information</h2>
        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
          {itemsToShow.map((item, idx) => (
            <li key={idx} style={{ ...styles.listItem, marginLeft: '0px' }}>
              {item.label} {item.value || '-'}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderCustomSections = (customSections) => {
    console.log('Template2PDF - renderCustomSections called with:', customSections);
    
    if (!customSections || customSections.length === 0) {
      console.log('Template2PDF - renderCustomSections: no customSections or empty array');
      return null;
    }

    return customSections.map((section, sectionIndex) => {
      console.log(`Template2PDF - processing section ${sectionIndex}:`, section);
      
      // Get title and items, supporting both new and old structure
      const sectionTitle = section.title || section.heading || 'Additional Information';
      const sectionItems = section.items || section.details || [];
      
      // Simplified validation: show section if it has a resolved title AND valid items
      const hasTitle = sectionTitle && sectionTitle.trim() !== '';
      
      // Filter out empty items for display
      const validItems = sectionItems.filter(item => item && item.trim() !== '');
      
      // Only show sections that have both a title AND valid items
      if (!hasTitle || validItems.length === 0) {
        console.log(`Template2PDF - section ${sectionIndex} hidden: no title or no valid items`);
        return null;
      }
      
      console.log(`Template2PDF - rendering section ${sectionIndex}:`, sectionTitle);
      return (
        <div key={sectionIndex} style={styles.rightSection}>
          <h2 style={styles.rightSectionTitle}>{sectionTitle}</h2>
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            {validItems.map((item, itemIndex) => (
              <li key={itemIndex} style={{ ...styles.listItem, marginLeft: '0px' }}>{item}</li>
            ))}
          </ul>
        </div>
      );
    });
  };

  return (
    <>
      <div ref={containerRef} style={{ ...styles.container, paddingBottom: '50px' }}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Photo */}
          {formData.image ? (
            <img src={URL.createObjectURL(formData.image)} alt="Profile" style={styles.photo} />
          ) : formData.imageUrl ? (
            <img src={formData.imageUrl} alt="Profile" style={styles.photo} />
          ) : (
            <div style={styles.noPhoto}>Photo</div>
          )}
          
          {/* Contact Information */}
          <div style={styles.leftSection}>
            <h2 style={styles.leftSectionTitle}>Contact</h2>
            {formData.phone && <p style={styles.contactInfo}><span style={styles.contactIcon}>📞</span>{formData.phone}</p>}
            {formData.email && <p style={styles.contactInfo}><span style={styles.contactIcon}>✉️</span>{formData.email}</p>}
            {formData.address && <p style={styles.contactInfo}><span style={styles.contactIcon}>📍</span>{formData.address}</p>}
          </div>

          {/* Skills in left column */}
          {visibleSections.includes('skills') && formData.skills?.length > 0 && (
            <div style={styles.leftSection}>
              <h2 style={styles.leftSectionTitle}>Skills</h2>
              {renderSkills(formData.skills)}
            </div>
          )}

          {/* Languages in left column */}
          {visibleSections.includes('languages') && formData.languages?.length > 0 && (
            <div style={styles.leftSection}>
              <h2 style={styles.leftSectionTitle}>Languages</h2>
              {renderLanguages(formData.languages || [], formData.customLanguages || [])}
            </div>
          )}

          {/* Other Information section in left column */}
          {(() => {
            console.log('Template2PDF - otherInformation check:', {
              visibleSections,
              hasOtherInformation: visibleSections.includes('otherInformation'),
              formDataOtherInformation: formData.otherInformation,
              otherInformationLength: formData.otherInformation?.length
            });
            return visibleSections.includes('otherInformation') && renderOtherInformation(formData.otherInformation);
          })()}
        </div>

        {/* Right Column */}
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

          {visibleSections.includes('hobbies') && formData.hobbies && formData.hobbies.length > 0 && (() => {
            const hobbiesList = renderSimpleList(formData.hobbies);
            return hobbiesList ? (
              <div style={styles.rightSection}>
                <h2 style={styles.rightSectionTitle}>Hobbies</h2>
                {hobbiesList}
              </div>
            ) : null;
          })()}

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

          {/* Custom Sections - rendered before references */}
          {(() => {
            console.log('Template2PDF - customSections check:', {
              visibleSections,
              hasCustomSections: visibleSections.includes('customSections'),
              formDataCustomSections: formData.customSections,
              customSectionsLength: formData.customSections?.length
            });
            return visibleSections.includes('customSections') && formData.customSections && formData.customSections.length > 0 && (
              renderCustomSections(formData.customSections)
            );
          })()}

          {visibleSections.includes('references') && (
            <div style={styles.rightSection}>
              <h2 style={styles.rightSectionTitle}>References</h2>
              {formData.references && formData.references.length > 0 ? (
                renderSimpleList(formData.references)
              ) : (
                <p style={styles.paragraph}>References would be furnished on demand</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Download Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 16 }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleDownloadClick}
          disabled={isLoading}
          style={{
            cursor: isLoading ? 'not-allowed' : 'pointer',
            padding: '6px 18px',
            fontSize: '0.95rem',
            borderRadius: 6,
            border: 'none',
            backgroundColor: isLoading ? '#cccccc' : '#3498db',
            color: 'white',
            transition: 'background-color 0.3s ease',
            userSelect: 'none',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#2980b9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#3498db';
            }
          }}
        >
          {buttonText}
        </button>
      </div>

      {/* Payment Modal - Outside PDF container */}
      {showPaymentModal && (
        <ManualPayment
          amount={100}
          templateId="template2"
          templateName="Template 2"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

Template2PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.array,
};

export default Template2PDF;
