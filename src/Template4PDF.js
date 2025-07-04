import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ManualPayment from './ManualPayment';
import { PaymentService } from './paymentService';

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
  const downloadButtonRef = useRef(null);
  const debugButtonRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentState, setPaymentState] = useState('idle');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [buttonText, setButtonText] = useState('Loading...');

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

  const listItemStyle = {
    fontSize: '0.95rem',
    lineHeight: 1.4,
    color: '#4a5568',
    marginBottom: '8px',
    paddingLeft: '0',
  };

  const downloadButtonStyle = {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    padding: '15px 25px',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'white',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
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

  // Check admin status and payment status on component mount
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Wait a bit for authentication to be established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check both localStorage and user object for admin access
        const adminAccess = localStorage.getItem('admin_cv_access');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
        
        console.log('Template - Admin status check:', {
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

  // Update button text based on payment status
  React.useEffect(() => {
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
        const text = await PaymentService.getDownloadButtonText('template', isAdminUser);
        setButtonText(text);
      } catch (error) {
        console.error('Error getting button text:', error);
        setButtonText('Download PDF (PKR 100)');
      }
    };

    updateButtonText();
  }, [isAdminUser, isLoading]);
  
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
    if (!customSections || customSections.length === 0) return null;

    return customSections.map((section, sectionIndex) => {
      // More lenient validation: require details but heading can be empty
      if (!section.details || section.details.length === 0) {
        console.log(`Template4PDF - section ${sectionIndex} invalid: no details`);
        return null;
      }

      // Use default heading if empty
      const sectionHeading = section.heading?.trim() || 'Additional Information';
      
      console.log(`Template4PDF - rendering section ${sectionIndex}:`, sectionHeading);
      return (
        <div key={sectionIndex} style={sectionStyle}>
          <h3 style={sectionTitleStyle}>{sectionHeading}</h3>
          <ul style={listStyle}>
            {section.details.map((detail, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{detail}</li>
            ))}
          </ul>
        </div>
      );
    });
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
      // Hide download and debug buttons
      if (downloadButtonRef.current) downloadButtonRef.current.style.display = 'none';
      if (debugButtonRef.current) debugButtonRef.current.style.display = 'none';
      const html2pdf = await loadHtml2Pdf();
      const pdfOptions = {
        margin: [0, 0, 0, 0],
        filename: `${formData.personalInfo?.fullName || 'CV'}_template4.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
      };
      await html2pdf().set(pdfOptions).from(cvElement).save();
      // Restore buttons
      if (downloadButtonRef.current) downloadButtonRef.current.style.display = 'block';
      if (debugButtonRef.current) debugButtonRef.current.style.display = 'block';
      setPaymentState('success');
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPaymentState('error');
      if (downloadButtonRef.current) downloadButtonRef.current.style.display = 'block';
      if (debugButtonRef.current) debugButtonRef.current.style.display = 'block';
    }
  };
  

  const handlePaymentSuccess = (paymentData) => {
    setShowPaymentModal(false);
    console.log('Payment successful:', paymentData);
    
    // Update button text to reflect pending payment status
    setButtonText('Payment Submitted (Waiting for Approval)');
    
    // Don't auto-download - wait for admin approval
    // generatePDF();
  };

  const handlePaymentFailure = (error) => {
    setShowPaymentModal(false);
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again.');
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
    cv_references = {},
    otherInformation = [],
  } = formData;

  const handleDownloadClick = async () => {
    console.log('=== DOWNLOAD CLICK START ===');
    console.log('Template4PDF - handleDownloadClick called');
    console.log('Template4PDF - isAdminUser:', isAdminUser);
    
    if (isAdminUser) {
      console.log('Template4PDF - Admin user, generating PDF directly');
      generatePDF();
      return;
    }
    
    try {
      // Check if user has an approved payment
      const approvedPayment = await PaymentService.checkApprovedPayment('template4');
      console.log('Template4PDF - approvedPayment:', approvedPayment);
      
      if (approvedPayment) {
        // User has an approved payment, allow download
        console.log('Template4PDF - Payment approved, generating PDF');
        generatePDF();
      } else {
        // Show payment modal
        console.log('Template4PDF - No approved payment, showing modal');
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
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
  const rightColumnSections = ['objective', 'workExperience', 'skills', 'languages', 'customSections', 'references', 'otherInformation'];

  const sectionData = {
    objective: renderObjective(objective),
    education: renderEducation(education),
    workExperience: renderWorkExperience(workExperience),
    skills: renderSkills(skills),
    certifications: renderSimpleList(certifications),
    projects: renderSimpleList(projects),
    languages: renderLanguages(allLanguages),
    hobbies: renderSimpleList(hobbies),
    customSections: renderCustomSections(formData.customSections),
    references: renderReferences(cv_references),
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

      {showPaymentModal && (
        <ManualPayment
          amount={100}
          templateId="template4"
          templateName="Template 4"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
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
