import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { PaymentService } from './paymentService';
import ManualPayment from './ManualPayment';

const Template4PDF = ({ formData, visibleSections = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [buttonText, setButtonText] = useState('Download PDF (PKR 100)');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const sectionList = [
    { key: 'objective', title: 'Objective' },
    { key: 'education', title: 'Education' },
    { key: 'workExperience', title: 'Work Experience' },
    { key: 'skills', title: 'Skills' },
    { key: 'certifications', title: 'Certifications' },
    { key: 'projects', title: 'Projects' },
    { key: 'languages', title: 'Languages' },
    { key: 'hobbies', title: 'Hobbies' },
    { key: 'customSections', title: 'Custom Sections' },
    { key: 'references', title: 'References' },
    { key: 'otherInformation', title: 'Other Information' },
  ];

  // Styles
  const containerStyle = {
    display: 'flex',
    minHeight: '297mm',
    backgroundColor: '#ffffff',
    fontFamily: "'Open Sans', Arial, sans-serif",
    color: '#333',
    position: 'relative',
  };

  const leftColumnStyle = {
    width: '35%',
    backgroundColor: '#107268',
    color: '#ffffff',
    padding: '30px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const rightColumnStyle = {
    width: '65%',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const photoContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  };

  const photoStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #ffffff',
  };

  const contactInfoStyle = {
    marginBottom: '20px',
  };

  const contactRowStyle = {
    fontSize: '14px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const nameStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#107268',
    marginBottom: '8px',
    textTransform: 'uppercase',
  };

  const titleStyle = {
    fontSize: '18px',
    color: '#666',
    marginBottom: '20px',
    fontWeight: '500',
  };

  const sectionStyle = {
    marginBottom: '20px',
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#107268',
    marginBottom: '12px',
    textTransform: 'uppercase',
    borderBottom: '2px solid #107268',
    paddingBottom: '4px',
  };

  const leftColumnSectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '10px',
    textTransform: 'uppercase',
  };

  const sectionContentStyle = {
    fontSize: '14px',
    lineHeight: '1.4',
  };

  const paragraphStyle = {
    margin: '0 0 4px 0',
    fontSize: '14px',
    lineHeight: '1.4',
  };

  const educationItemStyle = {
    marginBottom: '6px',
  };

  const degreeStyle = {
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '1px',
    color: '#ffffff',
  };

  const institutionStyle = {
    fontSize: '13px',
    color: '#ffffff',
  };

  const workExperienceItemStyle = {
    marginBottom: '8px',
  };

  const jobTitleStyle = {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#107268',
    marginBottom: '2px',
  };

  const companyNameStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '3px',
  };

  const skillsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  };

  const skillItemStyle = {
    backgroundColor: '#107268',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  };

  const listStyle = {
    margin: '0',
    paddingLeft: '20px',
  };

  const listItemStyle = {
    marginBottom: '2px',
    fontSize: '14px',
  };

  // Check admin status on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
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
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
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

    const interval = setInterval(checkAdminStatus, 5000);
    return () => clearInterval(interval);
  }, [isAdminUser]);

  // Update button text based on payment status
  useEffect(() => {
    const updateButtonText = async () => {
      try {
        const adminAccess = localStorage.getItem('admin_cv_access');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
        
        const text = await PaymentService.getDownloadButtonText('template4', isAdmin);
        setButtonText(text);
      } catch (error) {
        console.error('Error getting button text:', error);
        setButtonText('Download PDF (PKR 100)');
      }
    };

    updateButtonText();
  }, [isAdminUser, isLoading]);

  const generatePDF = async () => {
    if (!containerRef.current) {
      console.error('Container ref not available');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Template4PDF - Starting PDF generation...');

      // Check for approved payment first
      const approvedPayment = await PaymentService.checkApprovedPayment('template4');
      if (!approvedPayment) {
        console.log('Template4PDF - No approved payment found, showing payment modal');
        setShowPaymentModal(true);
        setIsLoading(false);
        return;
      }

      console.log('Template4PDF - Approved payment found, proceeding with download');

      // Mark payment as used
      await PaymentService.markPaymentAsUsed(approvedPayment.id, 'template4');
      console.log('Template4PDF - Payment marked as used');

      // Update button text
      const adminAccess = localStorage.getItem('admin_cv_access');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = adminAccess === 'true' || user?.isAdmin === true;
      const newText = await PaymentService.getDownloadButtonText('template4', isAdmin);
      setButtonText(newText);

      // Generate and download PDF
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      const canvas = await html2canvas.default(containerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('cv-template4.pdf');
      console.log('Template4PDF - PDF generated and downloaded successfully');
    } catch (error) {
      console.error('Template4PDF - Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadClick = async () => {
    if (isLoading) {
      console.log('Template4PDF - Download already in progress');
      return;
    }

    try {
      await generatePDF();
    } catch (error) {
      console.error('Template4PDF - Error in download click handler:', error);
      setIsLoading(false);
    }
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
          <p style={institutionStyle}>{edu.institute}</p>
        </div>
      ))}
    </div>
  );

  const renderWorkExperience = (workExp) => (
    <div>
      {workExp.map((job, index) => (
        <div key={index} style={workExperienceItemStyle}>
          <p style={jobTitleStyle}>{job.designation}</p>
          <p style={companyNameStyle}>{job.company} | {job.duration}</p>
          <p style={paragraphStyle}>{job.details}</p>
        </div>
      ))}
    </div>
  );

  const renderSkills = (skills) => (
    <div style={skillsContainerStyle}>
      {skills.map((skill, index) => (
        <div key={index} style={skillItemStyle}>
          {skill.name || skill}
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
      <ul style={listStyle}>
        {checkedItems.map((item, idx) => (
          <li key={idx} style={listItemStyle}>
            {item.label} {item.value || '-'}
          </li>
        ))}
      </ul>
    );
  };

  const renderCustomSections = (customSections) => {
    if (!customSections || customSections.length === 0) return null;

    return customSections.map((section, sectionIndex) => {
      if (!section.details || section.details.length === 0) {
        console.log(`Template4PDF - section ${sectionIndex} invalid: no details`);
        return null;
      }

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

  const handlePaymentSuccess = (paymentData) => {
    setShowPaymentModal(false);
    console.log('Payment successful:', paymentData);
  };

  const handlePaymentFailure = (error) => {
    setShowPaymentModal(false);
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again.');
  };

  const {
    imageUrl,
    name,
    phone,
    email,
    address,
    objective = [],
    education = [],
    workExperience = [],
    skills = [],
    certifications = [],
    projects = [],
    languages = [],
    customLanguages = [],
    hobbies = [],
    cv_references = {},
    otherInformation = [],
    customSections = [],
  } = formData;

  // Get the professional title from first work experience
  const professionalTitle = workExperience && workExperience.length > 0 && workExperience[0].designation 
    ? workExperience[0].designation 
    : 'Professional Title';

  // Debug logging
  console.log('Template4PDF - workExperience:', workExperience);
  console.log('Template4PDF - professionalTitle:', professionalTitle);

  const allLanguages = [
    ...(languages || []),
    ...(customLanguages || [])
      .filter(l => l.selected && l.name)
      .map(l => `${l.name} (${l.level})`)
  ];

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
    customSections: renderCustomSections(customSections),
    references: renderReferences(cv_references),
    otherInformation: renderOtherInformation(otherInformation),
  };

  return (
    <>
      <div ref={containerRef} style={containerStyle}>
        <div style={leftColumnStyle}>
          <div style={photoContainerStyle}>
            {imageUrl ? (
              <img src={imageUrl} alt="Profile" style={photoStyle} />
            ) : (
              <div style={{...photoStyle, background: '#107268' }} />
            )}
          </div>
          <div style={contactInfoStyle}>
            <h2 style={leftColumnSectionTitleStyle}>Contact</h2>
            {email && <div style={contactRowStyle}>📧 {email}</div>}
            {phone && <div style={contactRowStyle}>📞 {phone}</div>}
            {address && <div style={contactRowStyle}>🏠 {address}</div>}
          </div>
          {sectionList
            .filter(section => leftColumnSections.includes(section.key))
            .map(section =>
              renderSection(section.key, section.title, sectionData[section.key], true)
            )}
        </div>
        <div style={rightColumnStyle}>
          <h1 style={nameStyle}>{name || 'Your Name'}</h1>
          <h2 style={titleStyle}>{professionalTitle}</h2>
          {sectionList
            .filter(section => rightColumnSections.includes(section.key))
            .map(section =>
              renderSection(section.key, section.title, sectionData[section.key], false)
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
            backgroundColor: isLoading ? '#cccccc' : '#3f51b5',
            color: 'white',
            transition: 'background-color 0.3s ease',
            userSelect: 'none',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#303f9f';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#3f51b5';
            }
          }}
        >
          {buttonText}
        </button>
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