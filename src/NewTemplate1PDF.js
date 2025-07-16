// NewTemplate1PDF.js - Version 1.0 - Template with New Payment System
// Last updated: 2024-12-19 16:00:00
// Unique ID: NEW_TEMPLATE1_20241219_1600

import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import NewPaymentModal from './NewPaymentModal';
import { NewPaymentService } from './NewPaymentService';

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

const NewTemplate1PDF = ({ formData, visibleSections = [] }) => {
  console.log('NewTemplate1PDF - Component rendered');
  
  const containerRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [buttonText, setButtonText] = useState('Loading...');
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({
    canDownload: false,
    hasPending: false,
    downloadCount: 0
  });

  // TEMPORARY: Bypass payment modal for testing
  useEffect(() => {
    // Set admin access temporarily for easier testing
    localStorage.setItem('admin_cv_access', 'true');
    console.log('NewTemplate1PDF: Admin access temporarily enabled for testing');
  }, []);

  // Initialize payment service and check admin status
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log('NewTemplate1PDF - Initializing component...');
        
        // Initialize payment service
        await NewPaymentService.initialize();
        
        // Check admin status
        const adminAccess = localStorage.getItem('admin_cv_access');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
        
        console.log('NewTemplate1PDF - Admin status:', { adminAccess, user: user?.email, isAdmin });
        setIsAdminUser(isAdmin);
        setIsLoading(false);
        
        // Initial payment status check
        await updatePaymentStatus();
        
      } catch (error) {
        console.error('NewTemplate1PDF - Initialization failed:', error);
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, []);

  // Update payment status and button text
  const updatePaymentStatus = async () => {
    try {
      console.log('NewTemplate1PDF - Updating payment status...');
      
      if (isAdminUser) {
        setButtonText('Download PDF (Admin)');
        setHasPendingPayment(false);
        setPaymentStatus({
          canDownload: true,
          hasPending: false,
          downloadCount: 0
        });
        return;
      }

      // Check payment status
      const canDownload = await NewPaymentService.canDownload('template1');
      const hasPending = await NewPaymentService.hasPendingPayment('template1');
      const downloadCount = await NewPaymentService.getDownloadCount('template1');
      const buttonTextResult = await NewPaymentService.getDownloadButtonText('template1', isAdminUser);

      console.log('NewTemplate1PDF - Payment status:', {
        canDownload,
        hasPending,
        downloadCount,
        buttonText: buttonTextResult
      });

      setButtonText(buttonTextResult);
      setHasPendingPayment(hasPending);
      setPaymentStatus({
        canDownload,
        hasPending,
        downloadCount
      });

    } catch (error) {
      console.error('NewTemplate1PDF - Update payment status failed:', error);
      setButtonText('Download PDF (PKR 100)');
    }
  };

  // Periodic status updates
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      console.log('NewTemplate1PDF - Periodic status update');
      updatePaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoading, isAdminUser]);

  // Listen for authentication changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('NewTemplate1PDF - Auth change detected');
      setTimeout(updatePaymentStatus, 1000);
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, []);

  const generatePDF = async () => {
    try {
      console.log('NewTemplate1PDF - Generating PDF...');
      
      const html2pdf = await loadHtml2Pdf();
      
      const element = containerRef.current;
      if (!element) {
        throw new Error('Container element not found');
      }

      const opt = {
        margin: 0.5,
        filename: `${formData.name || 'CV'}_Template1.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      
      console.log('NewTemplate1PDF - PDF generated successfully');
      
      // Mark payment as downloaded if not admin
      if (!isAdminUser && paymentStatus.canDownload) {
        try {
          const approvedPayment = await NewPaymentService.getApprovedPayment('template1');
          if (approvedPayment) {
            await NewPaymentService.markPaymentAsDownloaded(approvedPayment.id, 'template1');
            console.log('NewTemplate1PDF - Payment marked as downloaded');
            await updatePaymentStatus();
          }
        } catch (error) {
          console.error('NewTemplate1PDF - Failed to mark payment as downloaded:', error);
        }
      }
      
    } catch (error) {
      console.error('NewTemplate1PDF - PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadClick = async () => {
    console.log('NewTemplate1PDF - Download button clicked');
    console.log('NewTemplate1PDF - Current status:', paymentStatus);
    
    if (isAdminUser) {
      await generatePDF();
      return;
    }

    if (paymentStatus.canDownload) {
      await generatePDF();
      return;
    }

    if (paymentStatus.hasPending) {
      alert('You have a pending payment. Please wait for admin approval.');
      return;
    }

    // Show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('NewTemplate1PDF - Payment successful:', paymentData);
    setShowPaymentModal(false);
    setHasPendingPayment(true);
    setButtonText('Payment Submitted (Waiting for Approval)');
    
    alert(`Payment submitted successfully!\n\nPayment ID: ${paymentData.paymentId}\n\nPlease wait for admin approval. You will be able to download your CV once approved.`);
  };

  const handlePaymentFailure = (error) => {
    console.error('NewTemplate1PDF - Payment failed:', error);
    setShowPaymentModal(false);
    alert(`Payment failed: ${error.message}`);
  };

  const handleRefreshStatus = async () => {
    console.log('NewTemplate1PDF - Manual refresh requested');
    await updatePaymentStatus();
  };

  const handleDebugStatus = async () => {
    try {
      console.log('NewTemplate1PDF - Debug status requested');
      const debugResult = await NewPaymentService.debugPaymentStatus('template1');
      console.log('NewTemplate1PDF - Debug result:', debugResult);
      
      alert(`Debug Information:\n\nUser: ${debugResult.user}\nTemplate: template1\nCan Download: ${debugResult.canDownload}\nHas Pending: ${debugResult.hasPending}\nDownload Count: ${debugResult.downloadCount}\nButton Text: ${debugResult.buttonText}`);
    } catch (error) {
      console.error('NewTemplate1PDF - Debug failed:', error);
      alert(`Debug failed: ${error.message}`);
    }
  };

  // Styles (same as original template)
  const containerStyle = {
    width: '100%',
    margin: '2px 0 0',
    padding: '24px',
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
    height: '100px',
    marginBottom: '8px',
    gap: '10px',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  };

  const photoStyle = {
    flexShrink: 0,
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #3f51b5',
    boxShadow: '0 2px 6px rgba(63,81,181,0.2)',
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
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: '#3f51b5',
  };

  const nameStyle = {
    fontSize: '2.3rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '0.05em',
  };

  const contactRowStyle = {
    fontSize: '1rem',
    margin: '1px 0',
    color: '#555',
  };

  const sectionStyle = {
    marginBottom: '6px',
    paddingBottom: '1px',
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
    marginBottom: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderLeft: '3px solid #3f51b5',
    paddingLeft: '5px',
  };

  const paragraphStyle = {
    fontSize: '0.85rem',
    lineHeight: 1.15,
    color: '#444',
    marginBottom: '3px',
  };

  const listStyle = {
    listStyleType: 'disc',
    paddingLeft: '12px',
    marginBottom: '2px',
  };

  const listItemStyle = {
    fontSize: '0.85rem',
    marginBottom: '1px',
    color: '#444',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    boxShadow: 'none',
    marginBottom: '4px',
  };

  const tableHeaderStyle = {
    backgroundColor: '#3f51b5',
    color: '#fff',
    textAlign: 'left',
    padding: '3px 5px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    fontSize: '0.85rem',
  };

  const tableRowStyle = {
    borderBottom: '1px solid #eee',
  };

  const tableCellStyle = {
    padding: '3px 5px',
    color: '#444',
    fontSize: '0.85rem',
  };

  const skillBarFill = (percent) => ({
    width: `${percent}%`,
    height: '8px',
    backgroundColor: '#3f51b5',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  });

  const skillBarContainer = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    marginTop: '2px',
  };

  const renderEducation = (education) => (
    <div>
      {education.map((edu, index) => (
        <div key={index} style={{ marginBottom: '4px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#3f51b5' }}>
            {edu.degree} - {edu.institution}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
            {edu.year} • {edu.grade}
          </div>
        </div>
      ))}
    </div>
  );

  const renderWorkExperience = (workExp) => (
    <div>
      {workExp.map((work, index) => (
        <div key={index} style={{ marginBottom: '6px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#3f51b5' }}>
            {work.position} at {work.company}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
            {work.duration}
          </div>
          <p style={paragraphStyle}>{work.description}</p>
        </div>
      ))}
    </div>
  );

  const renderSkills = (skills) => (
    <div>
      {skills.map((skill, index) => (
        <div key={index} style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{skill.name}</span>
            <span style={{ fontSize: '0.75rem', color: '#666' }}>{skill.level}%</span>
          </div>
          <div style={skillBarContainer}>
            <div style={skillBarFill(skill.level)}></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSimpleList = (items) => {
    if (!items || items.length === 0) return null;
    
    const validItems = items.filter(item => item && item.trim() !== '');
    if (validItems.length === 0) return null;
    
    return (
      <ul style={listStyle}>
        {validItems.map((item, index) => (
          <li key={index} style={listItemStyle}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderLanguages = (languages) => (
    <div>
      {languages.map((lang, index) => (
        <div key={index} style={{ marginBottom: '2px' }}>
          <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{lang.language}:</span>
          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '4px' }}>
            {lang.proficiency}
          </span>
        </div>
      ))}
    </div>
  );

  const renderOtherInformation = (otherInfo) => {
    if (!otherInfo || otherInfo.length === 0) return null;
    
    const validItems = otherInfo.filter(item => item && item.trim() !== '');
    if (validItems.length === 0) return null;
    
    return (
      <section style={sectionStyle} aria-label="Other Information Section">
        <h2 style={sectionTitleStyle}>Other Information</h2>
        <ul style={listStyle}>
          {validItems.map((item, index) => (
            <li key={index} style={listItemStyle}>{item}</li>
          ))}
        </ul>
      </section>
    );
  };

  const combinedLanguages = [
    ...(formData.languages || []),
    ...(formData.additionalLanguages || [])
  ];

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

        {visibleSections.includes('references') && formData.references && formData.references.length > 0 && (
          <section style={sectionStyle} aria-label="References Section">
            <h2 style={sectionTitleStyle}>References</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Name</th>
                  <th style={tableHeaderStyle}>Position</th>
                  <th style={tableHeaderStyle}>Company</th>
                  <th style={tableHeaderStyle}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {formData.references.map((ref, index) => (
                  <tr key={index} style={tableRowStyle}>
                    <td style={tableCellStyle}>{ref.name}</td>
                    <td style={tableCellStyle}>{ref.position}</td>
                    <td style={tableCellStyle}>{ref.company}</td>
                    <td style={tableCellStyle}>{ref.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </article>

      {/* Download Controls */}
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
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleRefreshStatus}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Refresh Status
              </button>
              <button
                onClick={handleDebugStatus}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Debug Info
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleDownloadClick}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: paymentStatus.canDownload ? '#28a745' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {buttonText}
            </button>
            
            {!isAdminUser && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={handleRefreshStatus}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh
                </button>
                <button
                  onClick={handleDebugStatus}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Debug
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <NewPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        templateId="template1"
        templateName="Template 1"
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />
    </>
  );
};

NewTemplate1PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.array
};

export default NewTemplate1PDF; 