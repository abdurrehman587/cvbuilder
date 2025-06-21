import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import JazzCashPayment from './JazzCashPayment';

const sectionList = [
  { key: 'objective', title: 'Objective' },
  { key: 'education', title: 'Education' },
  { key: 'workExperience', title: 'Work Experience' },
  { key: 'otherInformation', title: 'Other Information' },  // Moved early here as per order
  { key: 'skills', title: 'Skills' },
  { key: 'certifications', title: 'Certifications' },
  { key: 'projects', title: 'Projects' },
  { key: 'languages', title: 'Languages' },
  { key: 'hobbies', title: 'Hobbies' },
  { key: 'references', title: 'References' },
];

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
  const [paymentState, setPaymentState] = useState('idle');
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  // Check if download was already completed for this session
  React.useEffect(() => {
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
    padding: '5px 20px',
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
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderBottom: '2px solid #22c55e',
    paddingBottom: '1px',
    position: 'relative',
  };

  const sectionTitleAfter = {
    content: '""',
    position: 'absolute',
    bottom: '-2px',
    left: '0',
    width: '25px',
    height: '2px',
    background: '#16a34a',
  };

  const paragraphStyle = {
    fontSize: '0.95rem',
    lineHeight: 1.3,
    color: '#4a5568',
    marginBottom: '2px',
    textAlign: 'justify',
  };

  const listStyle = {
    listStyleType: 'none',
    paddingLeft: '0',
    marginBottom: '2px',
  };

  const listItemStyle = {
    fontSize: '0.95rem',
    marginBottom: '2px',
    color: '#4a5568',
    paddingLeft: '18px',
    position: 'relative',
  };

  const listItemBefore = {
    content: '"▸"',
    position: 'absolute',
    left: '0',
    color: '#22c55e',
    fontWeight: 'bold',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '4px',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const tableHeaderStyle = {
    backgroundColor: '#22c55e',
    color: '#ffffff',
    textAlign: 'left',
    padding: '6px 8px',
    fontWeight: 600,
    fontSize: '0.9rem',
  };

  const tableRowStyle = {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s',
  };

  const tableRowHover = {
    backgroundColor: '#f0fdf4',
  };

  const tableCellStyle = {
    padding: '6px 8px',
    color: '#4a5568',
    fontSize: '0.9rem',
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

  const experienceItemHover = {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
    marginTop: 16,
    cursor: 'pointer',
    padding: '6px 18px',
    fontSize: '0.95rem',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#22c55e',
    color: 'white',
    transition: 'background-color 0.3s ease',
    alignSelf: 'flex-start',
    userSelect: 'none',
  };

  const downloadButtonHover = {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(34, 197, 94, 0.6)',
  };

  const downloadButtonDisabled = {
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

  const renderSimpleList = (items) => (
    <ul style={listStyle}>
      {items.map((item, index) => (
        <li key={index} style={listItemStyle}>
          {typeof item === 'string' ? item : 
           typeof item === 'object' && item !== null ? 
             (item.label || item.value || item.name || JSON.stringify(item)) : 
             String(item)}
        </li>
      ))}
    </ul>
  );

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
    if (!otherInfo || !Array.isArray(otherInfo)) {
      return null;
    }

    const selectedRadio = otherInfo.find(
      (item) => item.labelType === 'radio' && item.checked && item.name === 'parentSpouse'
    );

    const checkedCheckboxes = otherInfo.filter(
      (item) => item.labelType === 'checkbox' && item.checked
    );

    return (
      <div>
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
      </div>
    );
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

      // Mark as downloaded
      localStorage.setItem('cv_downloaded', 'true');
      setDownloadCompleted(true);
      
      // Show success message
      alert('CV downloaded successfully! You will need to sign in again to download another CV.');

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
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    setPaymentState('completed');
    generatePDF();
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setPaymentState('failed');
    alert('Payment failed. Please try again.');
  };

  const handleDownloadClick = () => {
    if (downloadCompleted) {
      alert('You have already downloaded a CV in this session. Please sign out and sign in again to download another CV.');
      return;
    }
    
    if (paymentCompleted) {
      // If payment is already completed, download directly
      generatePDF();
    } else {
      // Show payment modal first
      setShowPaymentModal(true);
    }
  };

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
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Additional Information</h3>
              {renderOtherInformation(formData.otherInformation)}
            </div>
          )}

          {/* Certifications */}
          {visibleSections.includes('certifications') && formData.certifications && formData.certifications.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Certifications</h3>
              {renderSimpleList(formData.certifications)}
            </div>
          )}

          {/* Projects */}
          {visibleSections.includes('projects') && formData.projects && formData.projects.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Projects</h3>
              {renderSimpleList(formData.projects)}
            </div>
          )}

          {/* Languages */}
          {visibleSections.includes('languages') && formData.languages && formData.languages.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Languages</h3>
              {renderLanguages(formData.languages)}
            </div>
          )}

          {/* Hobbies */}
          {visibleSections.includes('hobbies') && formData.hobbies && formData.hobbies.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Hobbies</h3>
              {renderSimpleList(formData.hobbies)}
            </div>
          )}

          {/* References */}
          {visibleSections.includes('references') && formData.references && formData.references.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>References</h3>
              {renderSimpleList(formData.references)}
            </div>
          )}
        </div>

        {/* Download Button */}
        {!downloadCompleted ? (
          <button
            ref={buttonRef}
            type="button"
            onClick={handleDownloadClick}
            style={{
              ...downloadButtonStyle,
              ...(downloadCompleted && downloadButtonDisabled)
            }}
            onMouseEnter={(e) => {
              if (!downloadCompleted) {
                e.currentTarget.style.backgroundColor = '#16a34a';
              }
            }}
            onMouseLeave={(e) => {
              if (!downloadCompleted) {
                e.currentTarget.style.backgroundColor = '#22c55e';
              }
            }}
          >
            {paymentCompleted ? 'Download PDF' : 'Download PDF (PKR 200)'}
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
        )}
      </div>

      {/* Payment Modal - Outside PDF container */}
      {showPaymentModal && (
        <JazzCashPayment
          amount={200}
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
