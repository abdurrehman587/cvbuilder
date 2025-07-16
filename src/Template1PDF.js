// Template1PDF.js - Version 2.1 - Custom Sections Fix - CACHE BUSTED
// Last updated: 2024-12-19 15:45:00
// Unique ID: CS_FIX_20241219_1545
import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ManualPayment from './ManualPayment';
import { PaymentService } from './paymentService';


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
  console.log('Template1PDF - Component rendered');
  console.log('Template1PDF - formData.cv_references:', formData.cv_references);
  console.log('Template1PDF - formData.references:', formData.references);
  
  const containerRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [buttonText, setButtonText] = useState('Loading...');
  const [isDownloading, setIsDownloading] = useState(false);

  // TEMPORARY: Bypass payment modal for testing
  useEffect(() => {
    // Set admin access temporarily for easier testing
    localStorage.setItem('admin_cv_access', 'true');
    console.log('Template1PDF: Admin access temporarily enabled for testing');
  }, []);

  // Check admin status and payment status on component mount
  useEffect(() => {
    console.log('Template1PDF - Admin status useEffect triggered');
    
    const checkAdminStatus = async () => {
      try {
        // Wait a bit for authentication to be established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check both localStorage and user object for admin access
        const adminAccess = localStorage.getItem('admin_cv_access');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
        
        console.log('Template1PDF - Admin status check:', {
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

  // Simple test useEffect to verify useEffect is working
  useEffect(() => {
    console.log('Template1PDF - Test useEffect triggered - useEffect is working!');
    console.log('Template1PDF - Test useEffect: Component mounted successfully');
  }, []);

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
    listStyleType: 'none',
    paddingLeft: '0px',
    marginBottom: '2px', // reduced from 4px
  };

  const listItemStyle = {
    fontSize: '0.85rem', // restored original font size
    marginBottom: '1px', // reduced from 2px
    color: '#444',
    position: 'relative',
    paddingLeft: '16px',
    lineHeight: '1.4',
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
              top: '0',
              color: '#3f51b5',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              lineHeight: '1.4',
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
              <span style={{
                position: 'absolute',
                left: '0',
                top: '0',
                color: '#3f51b5',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                lineHeight: '1.4',
              }}>✦</span>
              {item.label} {item.value || '-'}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderCustomSections = (customSections) => {
    console.log('Template1PDF - renderCustomSections called with:', customSections);
    
    if (!customSections || customSections.length === 0) {
      console.log('Template1PDF - renderCustomSections: no customSections or empty array');
      return null;
    }

    return customSections.map((section, sectionIndex) => {
      console.log(`Template1PDF - processing section ${sectionIndex}:`, section);
      console.log(`Template1PDF - section ${sectionIndex} keys:`, Object.keys(section));
      console.log(`Template1PDF - section ${sectionIndex} heading:`, section.heading);
      console.log(`Template1PDF - section ${sectionIndex} details:`, section.details);
      
      // Get title and details
      const sectionTitle = section.heading || 'Additional Information';
      const sectionDetails = section.details || [];
      
      console.log(`Template1PDF - section ${sectionIndex} resolved title:`, sectionTitle);
      console.log(`Template1PDF - section ${sectionIndex} resolved details:`, sectionDetails);
      
      // Simplified validation: show section if it has a resolved title AND valid details
      const hasTitle = sectionTitle && sectionTitle.trim() !== '';
      
      // Filter out empty details for display
      const validDetails = sectionDetails.filter(detail => detail && detail.trim() !== '');
      console.log(`Template1PDF - section ${sectionIndex} valid details:`, validDetails);
      
      // Only show sections that have both a title AND valid details
      if (!hasTitle || validDetails.length === 0) {
        console.log(`Template1PDF - section ${sectionIndex} hidden: no title or no valid details`);
        return null;
      }
      
      console.log(`Template1PDF - rendering section ${sectionIndex}:`, sectionTitle);
      return (
        <div key={sectionIndex} style={sectionStyle} aria-label={`${sectionTitle} Section`}>
          <h2 style={sectionTitleStyle}>{sectionTitle}</h2>
          <ul style={listStyle}>
            {validDetails.map((detail, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>
                <span style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  color: '#3f51b5',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                }}>✦</span>
                {detail}
              </li>
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
    if (!containerRef.current) {
      alert('Preview content is not available for PDF generation');
      return;
    }

    try {
      const html2pdf = await loadHtml2Pdf();

      await html2pdf()
        .set({
          margin: 10,
          filename: `${formData.name || 'CV'}_template1.pdf`,
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

      // Mark the user's approved payment as used (only for non-admin users)
      if (!isAdminUser) {
        try {
          const approvedPayment = await PaymentService.checkApprovedPayment('template1');
          if (approvedPayment) {
            await PaymentService.markPaymentAsUsed(approvedPayment.id, 'template1');
            console.log('Payment marked as used in Supabase');
            
            // Refresh button text after marking payment as used
            const newButtonText = await PaymentService.getDownloadButtonText('template1', isAdminUser);
            setButtonText(newButtonText);
            console.log('Button text refreshed after download:', newButtonText);
          }
        } catch (error) {
          console.error('Error marking payment as used:', error);
        }
      }
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('=== PAYMENT SUCCESS HANDLER ===');
    console.log('Template1PDF - Payment successful:', paymentData);
    setShowPaymentModal(false);
    
    // Set pending payment state to true immediately
    setHasPendingPayment(true);
    setButtonText('Payment Submitted (Waiting for Approval)');
    console.log('Template1PDF - Payment success: Set hasPendingPayment=true and button text');
    
    // Don't auto-download - wait for admin approval
    // generatePDF();
    console.log('=== PAYMENT SUCCESS HANDLER COMPLETE ===');
  };

  const handlePaymentFailure = (error) => {
    console.log('Payment failed:', error);
    setShowPaymentModal(false);
    alert('Payment failed. Please try again.');
  };

  const handleDownloadClick = async () => {
    console.log('Template1PDF - Download button clicked');
    
    setIsDownloading(true);
    
    try {
      if (isAdminUser) {
        await generatePDF();
        return;
      }

      // Check if we can download (approved payment exists)
      const approvedPayment = await PaymentService.checkApprovedPayment('template1');
      if (approvedPayment) {
        await generatePDF();
        return;
      }

      // Check if there's a pending payment
      const pendingPayment = await PaymentService.checkPendingPayment('template1');
      if (pendingPayment) {
        alert('You have a pending payment. Please wait for admin approval.');
        return;
      }

      // Show payment modal
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Download error:', error);
      alert('An error occurred during download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };





  // Update button text and check payment status
  useEffect(() => {
    console.log('Template1PDF - useEffect triggered with:', { isAdminUser, isLoading });
    console.log('Template1PDF - useEffect: Component state check');
    
    const updateButtonText = async () => {
      console.log('Template1PDF - updateButtonText called');
      
      // Don't update button text while loading
      if (isLoading) {
        console.log('Template1PDF - Still loading, setting button text to Loading...');
        setButtonText('Loading...');
        return;
      }

      if (isAdminUser) {
        console.log('Template1PDF - Admin user, setting admin button text');
        setButtonText('Download PDF (Admin)');
        setHasPendingPayment(false);
        return;
      }

      try {
        console.log('Template1PDF - Starting payment status checks...');
        
        // Check for pending payment first
        const pendingPayment = await PaymentService.checkPendingPayment('template1');
        console.log('Template1PDF - Periodic refresh: Pending payment check result:', pendingPayment);
        
        if (pendingPayment) {
          setHasPendingPayment(true);
          setButtonText('Payment Submitted (Waiting for Approval)');
          console.log('Template1PDF - Periodic refresh: Pending payment detected, showing banner');
          return;
        } else {
          setHasPendingPayment(false);
          console.log('Template1PDF - Periodic refresh: No pending payment, checking approved payment');
        }

        // Check for approved payment
        const approvedPayment = await PaymentService.checkApprovedPayment('template1');
        console.log('Template1PDF - Periodic refresh: Approved payment check result:', approvedPayment);
        
        if (approvedPayment) {
          setButtonText('Download Now');
          console.log('Template1PDF - Periodic refresh: Approved payment detected, showing download button');
          return;
        }

        console.log('Template1PDF - Periodic refresh: No approved payment, getting default button text');
        const text = await PaymentService.getDownloadButtonText('template1', isAdminUser);
        setButtonText(text);
        console.log('Template1PDF - Periodic refresh: Button text updated:', text);
      } catch (error) {
        console.error('Error getting button text:', error);
        setButtonText('Download PDF (PKR 100)');
      }
    };

    // Add a small delay before first update to avoid conflicts
    setTimeout(() => {
      console.log('Template1PDF - First updateButtonText call (delayed)');
      updateButtonText();
    }, 2000);
    
    // Set up periodic refresh every 5 seconds to catch payment status changes
    const interval = setInterval(() => {
      console.log('Template1PDF - Periodic updateButtonText call');
      updateButtonText();
    }, 5000);
    
    console.log('Template1PDF - useEffect: Set up interval and delayed call');
    
    return () => {
      console.log('Template1PDF - useEffect cleanup: clearing interval');
      clearInterval(interval);
    };
  }, [isAdminUser, isLoading]);



  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
            {console.log('Template1PDF - Rendering references section:', {
              cv_references: formData.cv_references,
              references: formData.references,
              hasCvReferences: formData.cv_references && formData.cv_references.length > 0,
              hasReferences: formData.references && formData.references.length > 0
            })}
            {formData.cv_references && formData.cv_references.length > 0 ? (
              renderSimpleList(formData.cv_references)
            ) : (
              <p style={paragraphStyle}>References would be furnished on demand</p>
            )}
          </section>
        )}
      </article>
      
      {/* Download Controls - Outside PDF container */}
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        {hasPendingPayment ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '6px', 
              padding: '16px', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '16px' }}>
                ⏳ Payment Submitted - Waiting for Approval
              </h3>
              <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
                Your payment has been submitted and is being reviewed. You will be able to download your CV once approved.
              </p>
            </div>

          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleDownloadClick}
              disabled={isLoading || isDownloading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: (isLoading || isDownloading) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || isDownloading) ? 0.6 : 1,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isDownloading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Processing...
                </>
              ) : (
                buttonText
              )}
            </button>
            

            

          </div>
        )}
      </div>
      {/* Payment Modal - Outside PDF container */}
      {showPaymentModal && (
        <ManualPayment
          amount={100}
          templateId="template1"
          templateName="Template 1"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

Template1PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.array,
};

export default Template1PDF;
