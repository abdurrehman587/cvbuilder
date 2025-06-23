import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ManualPayment from './ManualPayment';

const sectionList = [
  { key: 'objective', title: 'Objective' },
  { key: 'education', title: 'Education' },
  { key: 'workExperience', title: 'Work Experience' },
  { key: 'otherInformation', title: 'Other Information' },  // Moved early here as per order
  { key: 'skills', title: 'Skills' },
  { key: 'certifications', title: 'Certifications' },
  { key: 'projects', title: 'Award' },
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

const Template4PDF = ({ formData, visibleSections = [] }) => {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentState, setPaymentState] = useState('idle');
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  // Check download state on component mount
  useEffect(() => {
    const isDownloaded = localStorage.getItem('cv_downloaded') === 'true';
    setDownloadCompleted(isDownloaded);
  }, []);

  const containerStyle = {
    width: '100%',
    margin: '0',
    padding: '0',
    background: '#ffffff',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#2d3748',
    display: 'flex',
    boxSizing: 'border-box',
    minHeight: '1123px',
  };

  const leftColumnStyle = {
    background: '#083935',
    color: '#ffffff',
    padding: '40px 20px',
    width: '35%',
    boxSizing: 'border-box',
  };

  const rightColumnStyle = {
    background: '#ffffff',
    color: '#2d3748',
    padding: '40px 20px',
    width: '65%',
    boxSizing: 'border-box',
  };

  const photoContainerStyle = {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    overflow: 'hidden',
    margin: '0 auto 20px auto',
    border: '5px solid #107268',
  };

  const photoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const nameStyle = {
    fontSize: '2.8rem',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
    color: '#083935',
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'normal',
    margin: '0 0 20px 0',
    color: '#107268',
  };

  const sectionTitleStyle = {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#107268',
    marginBottom: '15px',
    textTransform: 'uppercase',
    borderBottom: '2px solid #107268',
    paddingBottom: '5px',
  };

  const leftColumnSectionTitleStyle = {
      ...sectionTitleStyle,
      color: '#ffffff',
      borderColor: '#ffffff',
  };

  const contactInfoStyle = {
    marginBottom: '30px',
  };

  const contactRowStyle = {
    fontSize: '0.9rem',
    margin: '8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const paragraphStyle = {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#4a5568',
    marginBottom: '20px',
    textAlign: 'justify',
  };

  const workExperienceItemStyle = {
      marginBottom: '20px',
  };

  const jobTitleStyle = {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: '#083935',
      margin: '0',
  };

    const companyNameStyle = {
        fontSize: '1rem',
        fontWeight: 'normal',
        margin: '0 0 10px 0',
        color: '#4a5568',
  };

  const skillsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  };

  const skillItemStyle = {
    background: '#e6fffa',
    padding: '8px 15px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#083935',
  };

  const educationItemStyle = {
      marginBottom: '15px',
  };

  const degreeStyle = {
      fontSize: '1rem',
      fontWeight: 'bold',
      margin: '0',
      color: '#ffffff'
  };

    const institutionStyle = {
        fontSize: '0.9rem',
        margin: '0',
        color: '#e6fffa'
    };

  const sectionContentStyle = {
    padding: '1px 0',
  };

  const sectionStyle = {
    marginBottom: '0px',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  };

  const listStyle = {
    listStyleType: 'none',
    paddingLeft: '0',
    marginBottom: '0px',
  };

  const downloadButtonStyle = {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    padding: '15px 25px',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'white',
    background: paymentCompleted
      ? 'linear-gradient(135deg, #4ade80, #22c55e)'
      : 'linear-gradient(135deg, #f87171, #ef4444)',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
    zIndex: 1001,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const downloadButtonHoverStyle = {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
  };
  
  const hasData = (sectionKey) => visibleSections.includes(sectionKey);

  const renderSection = (key, title, content, isLeftColumn) => {
    if (!hasData(key) || !content) return null;
    return (
      <div style={sectionStyle}>
        <h2 style={isLeftColumn ? leftColumnSectionTitleStyle : sectionTitleStyle}>
          {title}
        </h2>
        <div style={sectionContentStyle}>{content}</div>
      </div>
    );
  };

  const renderObjective = (objective) => (
    <p style={paragraphStyle}>{objective.join(' ')}</p>
  );

  const renderEducation = (education) => (
    <div>
      {education.map((edu, index) => (
        <div key={index} style={educationItemStyle}>
          <p style={degreeStyle}>{edu.degree} ({edu.year})</p>
          <p style={institutionStyle}>{edu.institution}</p>
        </div>
      ))}
    </div>
  );

  const renderWorkExperience = (workExp) => (
    <div>
      {workExp.map((job, index) => (
        <div key={index} style={workExperienceItemStyle}>
          <p style={jobTitleStyle}>{job.title}</p>
          <p style={companyNameStyle}>{job.company} | {job.year}</p>
          <p style={paragraphStyle}>{job.description}</p>
        </div>
      ))}
    </div>
  );

  const renderSkills = (skills) => (
    <div style={skillsContainerStyle}>
      {skills.map((skill, index) => (
        <div key={index} style={skillItemStyle}>
          {skill}
        </div>
      ))}
    </div>
  );

  const renderSimpleList = (items) => {
    if (!Array.isArray(items)) return null;
    return (
      <ul style={{ ...listStyle, paddingLeft: '20px', listStyleType: 'disc' }}>
        {items.map((item, index) => (
          <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderReferences = (references) => (
    <p style={paragraphStyle}>
      {references.available ? 'Available upon request' : (references.list || []).map(ref => `${ref.name} (${ref.contact})`).join(', ')}
    </p>
  );

  const renderLanguages = (languages) => (
    <p style={paragraphStyle}>
      {languages.join(', ')}
    </p>
  );

  const renderOtherInformation = (otherInfo) => {
    if (!otherInfo) return null;
    const checkedItems = otherInfo.filter(item => item.checked);
    if (checkedItems.length === 0) return <p style={paragraphStyle}>No additional information provided.</p>;

    return (
      <ul style={{ ...listStyle, paddingLeft: '20px', listStyleType: 'disc' }}>
        {checkedItems.map((item, index) => (
          <li key={index} style={{ marginBottom: '4px' }}>
            {item.text || 'Untitled Information'}
          </li>
        ))}
      </ul>
    );
  };
  const generatePDF = async () => {
    if (paymentState === 'processing') return;
  
    setPaymentState('processing');
    
    try {
      const cvElement = containerRef.current;
      if (!cvElement) {
        console.error("CV container element not found for PDF generation.");
        setPaymentState('error');
        return;
      }
  
      // Temporarily remove the download button from the capture
      const buttonElement = buttonRef.current;
      if (buttonElement) {
        buttonElement.style.display = 'none';
      }
      
      const html2pdf = await loadHtml2Pdf();
      const pdfOptions = {
        margin: [0, 0, 0, 0],
        filename: `${formData.personalInfo.fullName || 'CV'}_template3.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
      };
      
      await html2pdf().set(pdfOptions).from(cvElement).save();
  
      // Restore the button after capture
      if (buttonElement) {
        buttonElement.style.display = 'flex';
      }
  
      setPaymentState('success');
      setDownloadCompleted(true);
      localStorage.setItem('cv_downloaded', 'true'); // Persist download state
  
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPaymentState('error');
  
      const buttonElement = buttonRef.current;
      if (buttonElement) {
        buttonElement.style.display = 'flex';
      }
    }
  };
  

  const handlePaymentSuccess = (paymentData) => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    console.log('Payment successful:', paymentData);
    generatePDF();
  };

  const handlePaymentFailure = (error) => {
    setShowPaymentModal(false);
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again.');
  };

  const checkForApprovedPayment = () => {
    // This is a mock check. Replace with actual Supabase logic if needed.
    const approved = localStorage.getItem('payment_approved') === 'true';
    if (approved) {
      setPaymentCompleted(true);
      setDownloadCompleted(true);
      localStorage.setItem('cv_downloaded', 'true');
    }
    return approved;
  };

  // Periodically check for payment approval if not completed
  useEffect(() => {
    if (!paymentCompleted) {
      const interval = setInterval(() => {
        if (checkForApprovedPayment()) {
          clearInterval(interval);
        }
      }, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [paymentCompleted]);

  const getDownloadButtonText = () => {
    const adminAccess = localStorage.getItem('admin_cv_access');
    if (adminAccess === 'true') {
      return 'Download Now (Admin Access)';
    }
    if (paymentState === 'processing') return 'Processing...';
    if (paymentState === 'error') return 'Error! Retry';
    if (downloadCompleted) return 'Download Again';
    return paymentCompleted ? 'Download CV' : 'Unlock & Download';
  };

  const {
    personalInfo = {},
    objective = [],
    education = [],
    workExperience = [],
    skills = [],
    certifications = [],
    projects = [],
    languages: languageData = {},
    hobbies = [],
    references = {},
    otherInformation = [],
  } = formData;

  const handleDownloadClick = () => {
    const adminAccess = localStorage.getItem('admin_cv_access');
    if (adminAccess === 'true') {
      generatePDF();
      return;
    }
    const isApproved = checkForApprovedPayment();
    if (downloadCompleted || isApproved) {
      generatePDF();
    } else {
      setShowPaymentModal(true);
    }
  };

  const allLanguages = [
    ...(languageData.languages || []),
    ...(languageData.customLanguages || [])
      .filter(l => l.selected && l.name)
      .map(l => `${l.name} (${l.level})`)
  ];

  // This is where we will map our sections to the new layout
  const leftColumnSections = ['education', 'certifications', 'projects', 'hobbies'];
  const rightColumnSections = ['objective', 'workExperience', 'skills', 'languages', 'references', 'otherInformation'];

  const sectionData = {
    objective: renderObjective(objective),
    education: renderEducation(education),
    workExperience: renderWorkExperience(workExperience),
    skills: renderSkills(skills),
    certifications: renderSimpleList(certifications),
    projects: renderSimpleList(projects),
    languages: renderLanguages(allLanguages),
    hobbies: renderSimpleList(hobbies),
    references: renderReferences(references),
    otherInformation: renderOtherInformation(otherInformation),
  };

  return (
    <>
      <div ref={containerRef} style={containerStyle}>
        <div style={leftColumnStyle}>
            <div style={photoContainerStyle}>
                {personalInfo.photo ? (
                    <img src={personalInfo.photo} alt="Profile" style={photoStyle} />
                ) : (
                    <div style={{...photoStyle, background: '#107268' }} />
                )}
            </div>
            <div style={contactInfoStyle}>
                <h2 style={leftColumnSectionTitleStyle}>Contact</h2>
                {personalInfo.email && <div style={contactRowStyle}>📧 {personalInfo.email}</div>}
                {personalInfo.phone && <div style={contactRowStyle}>📞 {personalInfo.phone}</div>}
                {personalInfo.address && <div style={contactRowStyle}>🏠 {personalInfo.address}</div>}
            </div>
            {sectionList
                .filter(section => leftColumnSections.includes(section.key))
                .map(section =>
                    renderSection(section.key, section.title, sectionData[section.key], true)
            )}
        </div>
        <div style={rightColumnStyle}>
            <h1 style={nameStyle}>{personalInfo.fullName || 'Richard Sanchez'}</h1>
            <h2 style={titleStyle}>{personalInfo.title || 'Graphic Designer'}</h2>
            {sectionList
                .filter(section => rightColumnSections.includes(section.key))
                .map(section =>
                    renderSection(section.key, section.title, sectionData[section.key], false)
            )}
        </div>
      </div>

      <button
        ref={buttonRef}
        onClick={handleDownloadClick}
        onMouseEnter={e => {
          e.currentTarget.style.transform = downloadButtonHoverStyle.transform;
          e.currentTarget.style.boxShadow = downloadButtonHoverStyle.boxShadow;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = downloadButtonStyle.boxShadow;
        }}
        style={{...downloadButtonStyle, 
          ...(paymentState === 'processing' ? { cursor: 'not-allowed', background: '#a5b4fc' } : {}),
          ...(paymentState === 'error' ? { background: 'linear-gradient(135deg, #fb923c, #f97316)' } : {}),
          ...(downloadCompleted ? { background: 'linear-gradient(135deg, #4ade80, #22c55e)' } : 
             !paymentCompleted ? { background: 'linear-gradient(135deg, #f87171, #ef4444)' } : {}
           ),
        }}
        disabled={paymentState === 'processing'}
        aria-label={getDownloadButtonText()}
      >
        {paymentState === 'processing' ? '...' : 
         downloadCompleted ? '✔' : 
         paymentCompleted ? '⬇' : '🔒'}
        <span>{getDownloadButtonText()}</span>
      </button>

      {showPaymentModal && (
        <ManualPayment
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

Template4PDF.propTypes = {
  formData: PropTypes.object.isRequired,
  visibleSections: PropTypes.arrayOf(PropTypes.string),
};

export default Template4PDF;
