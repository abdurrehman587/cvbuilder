import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { PaymentService } from './paymentService';
import ManualPayment from './ManualPayment';

const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_TOP_MM = 20;
const PAGE_MARGIN_BOTTOM_MM = 20;
const GRAPHICS_HEIGHT_MM = 20; // Account for header graphics
const PAGE_CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - PAGE_MARGIN_TOP_MM - PAGE_MARGIN_BOTTOM_MM - GRAPHICS_HEIGHT_MM; // 237mm
const MM_TO_PX = 3.7795275591; // 1mm = 3.78px (approx, for 96dpi)
// const PAGE_CONTENT_HEIGHT_PX = PAGE_CONTENT_HEIGHT_MM * MM_TO_PX;

const Template4PDF = ({ formData, visibleSections = [], isPrintMode = false }) => {
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
    { key: 'otherInformation', title: 'Other Information' },
    { key: 'references', title: 'References' },
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
    width: '38%',
    background: 'linear-gradient(180deg, #107268 0%, #0d5a52 100%)',
    color: '#ffffff',
    padding: '35px 25px 35px 25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '297mm',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.08)',
  };

  // Remove overlay and accent bar

  // Clean section headings
  const leftColumnSectionTitleStyle = {
    fontSize: '17px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '10px',
    marginTop: '0px',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    borderBottom: 'none',
    paddingBottom: '0px',
    position: 'relative',
  };

  // Clean profile image
  const photoContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
    marginTop: '0px',
    position: 'relative',
  };
  const photoStyle = {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
  };

  // Modern tag design consistent with other templates
  const tagsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginTop: '8px',
    alignItems: 'flex-start',
  };

  const skillItemStyle = {
    backgroundColor: '#ffffff',
    color: '#107268',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    margin: '0',
    display: 'inline-block',
    minWidth: 'fit-content',
    maxWidth: '100%',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflow: 'visible',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
    transition: 'all 0.2s ease',
    lineHeight: '1.2',
    textAlign: 'center',
    letterSpacing: '0.3px',
    textTransform: 'capitalize',
  };

  const languageItemStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid rgba(255, 255, 255, 0.35)',
    margin: '0',
    display: 'inline-block',
    minWidth: 'fit-content',
    maxWidth: '100%',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflow: 'visible',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
    transition: 'all 0.2s ease',
    lineHeight: '1.2',
    textAlign: 'center',
    letterSpacing: '0.3px',
    textTransform: 'capitalize',
  };

  const rightColumnStyle = {
    width: '62%',
    padding: '0 30px 30px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
  };

  const contactInfoStyle = {
    marginBottom: '2px',
    padding: '0px',
  };

  const contactRowStyle = {
    fontSize: '14px',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '6px 0',
    lineHeight: '1.2',
    wordWrap: 'normal',
    overflowWrap: 'normal',
    whiteSpace: 'normal',
  };

  const contactIconStyle = {
    flexShrink: 0,
    marginTop: '2px',
  };

  const contactTextStyle = {
    flex: 1,
    wordWrap: 'normal',
    overflowWrap: 'normal',
    whiteSpace: 'normal',
    minWidth: 0,
  };

  const nameStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#107268',
    marginBottom: '8px',
    textTransform: 'uppercase',
  };

  // const titleStyle = {
  //   fontSize: '20px',
  //   color: '#000000',
  //   marginBottom: '20px',
  //   fontWeight: '500',
  // };

  // Section spacing for left column
  const sectionStyle = {
    marginBottom: '0px',
    padding: '2px 0',
  };

  // Enhance section headings
  const sectionTitleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#107268',
    marginBottom: '4px',
    textTransform: 'uppercase',
    borderBottom: '2px solid #107268',
    paddingBottom: '2px',
  };

  const sectionContentStyle = {
    fontSize: '16px',
    lineHeight: '1.4',
  };

  const paragraphStyle = {
    margin: '0px',
    padding: '0px',
    fontSize: '16px',
    lineHeight: '1.3',
    display: 'block',
    textAlign: 'justify',
    marginBottom: '3px',
    color: '#000000',
  };

  const educationItemStyle = {
    marginBottom: '6px',
  };

  const degreeStyle = {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '0px',
    padding: '0px',
    lineHeight: '1.2',
    color: '#107268',
    display: 'block',
    marginBottom: '2px',
  };

  const institutionStyle = {
    fontSize: '15px',
    margin: '0px',
    padding: '0px',
    lineHeight: '1.2',
    color: '#333',
    display: 'block',
  };

  const workExperienceItemStyle = {
    marginBottom: '12px',
  };

  const jobTitleStyle = {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#107268',
    margin: '0px',
    padding: '0px',
    lineHeight: '1.2',
    display: 'block',
    marginBottom: '4px',
  };

  const companyNameStyle = {
    fontSize: '16px',
    color: '#000000',
    margin: '0px',
    padding: '0px',
    lineHeight: '1.2',
    display: 'block',
    marginBottom: '6px',
  };





  const listStyle = {
    margin: '0',
    paddingLeft: '20px',
    color: '#000000',
  };

  const listItemStyle = {
    marginBottom: '0px',
    fontSize: '16px',
    color: '#000000',
  };

  // const leftColumnListItemStyle = {
  //   marginBottom: '4px',
  //   fontSize: '14px',
  //   color: '#ffffff',
  //   margin: 0,
  //   padding: '3px 0',
  //   listStyle: 'none',
  //   lineHeight: '1.5',
  // };

  const headerGraphicStyle = {
    position: 'relative',
    height: '60px',
    backgroundColor: '#107268',
    marginBottom: '8px',
    marginTop: '0px',
    marginLeft: '-30px',
    marginRight: '-30px',
    borderRadius: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(16, 114, 104, 0.3)',
    '@keyframes pulse': {
      '0%': { opacity: 0.4, transform: 'translateY(-50%) scale(1)' },
      '50%': { opacity: 1, transform: 'translateY(-50%) scale(1.2)' },
      '100%': { opacity: 0.4, transform: 'translateY(-50%) scale(1)' }
    }
  };

  const decorativeElementStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #107268 0%, #0d5a52 25%, #0a4a44 50%, #083d38 75%, #06302c 100%)',
    borderRadius: '0 0 20px 0',
  };

  const accentLineStyle = {
    position: 'absolute',
    top: '50%',
    left: '30px',
    right: '30px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent 0%, #ffffff 15%, #ffffff 85%, transparent 100%)',
    transform: 'translateY(-50%)',
    opacity: '0.8',
    borderRadius: '2px',
  };

  const accentDotStyle = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    top: '50%',
    transform: 'translateY(-50%)',
    boxShadow: '0 2px 4px rgba(255, 255, 255, 0.3)',
  };

  const geometricPatternStyle = {
    position: 'absolute',
    top: '10px',
    right: '20px',
    width: '40px',
    height: '40px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    transform: 'rotate(45deg)',
  };

  const accentTriangleStyle = {
    position: 'absolute',
    bottom: '8px',
    left: '25px',
    width: '0',
    height: '0',
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderBottom: '12px solid rgba(255, 255, 255, 0.4)',
  };

  const accentCircleStyle = {
    position: 'absolute',
    top: '15px',
    left: '40px',
    width: '12px',
    height: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  };

  const wavePatternStyle = {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    height: '15px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)',
    borderRadius: '0 0 20px 0',
  };

  const cornerAccentStyle = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    borderTop: '2px solid rgba(255, 255, 255, 0.5)',
    borderRight: '2px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '0 8px 0 0',
  };

  const diagonalLineStyle = {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '60px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 100%)',
    transform: 'rotate(-45deg)',
    transformOrigin: 'top right',
  };

  const pulseDotStyle = {
    position: 'absolute',
    width: '6px',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '50%',
    top: '50%',
    transform: 'translateY(-50%)',
    animation: 'pulse 2s infinite',
  };

  const accentBarStyle = {
    position: 'absolute',
    top: '12px',
    left: '15px',
    width: '25px',
    height: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '2px',
  };

  const starPatternStyle = {
    position: 'absolute',
    top: '18px',
    right: '45px',
    width: '0',
    height: '0',
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderBottom: '8px solid rgba(255, 255, 255, 0.3)',
    transform: 'rotate(180deg)',
  };

  const gradientOverlayStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    borderRadius: '0 0 20px 0',
  };

  const accentRingStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '30px',
    height: '30px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
  };

  const bottomGraphicStyle = {
    position: 'relative',
    height: '60px',
    backgroundColor: '#107268',
    marginTop: 'auto',
    marginBottom: '-30px',
    marginLeft: '-20px',
    marginRight: '-20px',
    borderRadius: '20px 0 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0 -4px 12px rgba(16, 114, 104, 0.3)',
  };

  const bottomDecorativeElementStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(315deg, #107268 0%, #0d5a52 25%, #0a4a44 50%, #083d38 75%, #06302c 100%)',
    borderRadius: '20px 0 0 0',
  };

  const bottomAccentLineStyle = {
    position: 'absolute',
    top: '50%',
    left: '30px',
    right: '30px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent 0%, #ffffff 15%, #ffffff 85%, transparent 100%)',
    transform: 'translateY(-50%)',
    opacity: '0.8',
    borderRadius: '2px',
  };

  const bottomAccentDotStyle = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    top: '50%',
    transform: 'translateY(-50%)',
    boxShadow: '0 2px 4px rgba(255, 255, 255, 0.3)',
  };

  const bottomGeometricPatternStyle = {
    position: 'absolute',
    bottom: '10px',
    left: '20px',
    width: '40px',
    height: '40px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    transform: 'rotate(45deg)',
  };

  const bottomAccentTriangleStyle = {
    position: 'absolute',
    top: '8px',
    right: '25px',
    width: '0',
    height: '0',
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderTop: '12px solid rgba(255, 255, 255, 0.4)',
  };

  const bottomAccentCircleStyle = {
    position: 'absolute',
    bottom: '15px',
    right: '40px',
    width: '12px',
    height: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  };

  const bottomWavePatternStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '15px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)',
    borderRadius: '20px 0 0 0',
  };

  const bottomCornerAccentStyle = {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    width: '20px',
    height: '20px',
    borderBottom: '2px solid rgba(255, 255, 255, 0.5)',
    borderLeft: '2px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '0 0 0 8px',
  };

  const bottomDiagonalLineStyle = {
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '60px',
    height: '2px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
    transform: 'rotate(45deg)',
    transformOrigin: 'bottom left',
  };

  const bottomGradientOverlayStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    borderRadius: '20px 0 0 0',
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
      console.log('Template4PDF - Starting PDF generation with Puppeteer...');

      // Check if user is admin
      const adminAccess = localStorage.getItem('admin_cv_access');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = adminAccess === 'true' || user?.isAdmin === true;

      if (!isAdmin) {
        // For non-admin users, check for approved payment
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
      } else {
        console.log('Template4PDF - Admin user, proceeding with direct download');
      }

      // Update button text
      const newText = await PaymentService.getDownloadButtonText('template4', isAdmin);
      setButtonText(newText);

      // Create the print URL with data as URL parameters
      const formDataParam = encodeURIComponent(JSON.stringify(formData));
      const sectionsParam = encodeURIComponent(JSON.stringify(visibleSections));
      const printUrl = `${window.location.origin}/print-cv?data=${formDataParam}&sections=${sectionsParam}`;
      console.log('Template4PDF - Print URL:', printUrl);

      // Get the CV container HTML
      const cvContainer = containerRef.current;
      if (!cvContainer) {
        throw new Error('CV container not found');
      }

      // Create a complete HTML document with the CV content
      const cvHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>CV - Template 4</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Arial, sans-serif;
              background: white;
            }
            * { 
              box-sizing: border-box; 
            }
            .page-break { 
              page-break-before: always; 
            }
            .avoid-break { 
              page-break-inside: avoid; 
            }
            .cv-page {
              page-break-after: always;
            }
            .cv-page:last-child {
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
          ${cvContainer.outerHTML}
        </body>
        </html>
      `;

      // Call the Vercel API to generate PDF
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: cvHTML,
          filename: 'cv-template4.pdf'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cv-template4.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Template4PDF - PDF generated and downloaded successfully');
    } catch (error) {
      console.error('Template4PDF - Error generating PDF:', error);
      alert('Error generating PDF. Please try again. If the problem persists, contact support.');
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

  const hasData = (sectionKey) => {
    // Handle custom sections - they should be included if customSections is in visibleSections or if custom sections exist
    if (sectionKey.startsWith('custom-')) {
      console.log('Template4PDF - Checking custom section visibility:', sectionKey, 'visibleSections:', visibleSections, 'includes customSections:', visibleSections.includes('customSections'));
      
      // Check if custom sections should be visible (either in visibleSections or if custom sections exist)
      // For custom sections, be more permissive - show them if they exist and have data
      const shouldShowCustomSections = visibleSections.includes('customSections') || 
                                      visibleSections.length === 0 || // Show if no visibleSections specified
                                      (formData.customSections && formData.customSections.length > 0);
      
      if (!shouldShowCustomSections) {
        console.log('Template4PDF - Custom sections not visible, returning false');
        return false;
      }
      
      const customIndex = parseInt(sectionKey.split('-')[1], 10);
      const customSection = formData.customSections[customIndex];
      const hasCustomData = customSection && customSection.details && customSection.details.length > 0 && 
             customSection.details.some(detail => detail && typeof detail === 'string' && detail.trim());
      console.log('Template4PDF - hasData for custom section:', sectionKey, 'customIndex:', customIndex, 'customSection:', customSection, 'hasData:', hasCustomData);
      console.log('Template4PDF - shouldShowCustomSections:', shouldShowCustomSections);
      return hasCustomData && shouldShowCustomSections;
    }
    
    // First check if section is in visibleSections
    // For some sections, be more permissive if no visibleSections are specified
    if (visibleSections.length > 0 && !visibleSections.includes(sectionKey)) return false;
    
    // Check if there's actual data for this section using raw form data
    switch (sectionKey) {
      case 'objective':
        return objective && objective.length > 0 && objective.some(obj => obj && typeof obj === 'string' && obj.trim());
      case 'education':
        return education && education.length > 0;
      case 'workExperience':
        return workExperience && workExperience.length > 0;
      case 'skills':
        return skills && skills.length > 0;
      case 'certifications':
        return certifications && certifications.length > 0 && certifications.some(cert => cert && typeof cert === 'string' && cert.trim());
      case 'projects':
        return projects && projects.length > 0 && projects.some(project => project && typeof project === 'string' && project.trim());
      case 'languages':
        return allLanguages && allLanguages.length > 0;
      case 'hobbies':
        return hobbies && hobbies.length > 0 && hobbies.some(hobby => hobby && typeof hobby === 'string' && hobby.trim());
      case 'references':
        return cv_references && Object.keys(cv_references).length > 0;
      case 'otherInformation':
        console.log('Template4PDF - Checking otherInformation:', otherInformation);
        const hasOtherInfo = otherInformation && otherInformation.length > 0 && otherInformation.some(info => 
          info && info.labelType && (
            (info.labelType === 'radio' && info.checked) ||
            (info.labelType === 'checkbox' && info.checked)
          )
        );
        console.log('Template4PDF - otherInformation hasData result:', hasOtherInfo);
        return hasOtherInfo;
      default:
        return false; // Unknown section
    }
  };

  // Clean left column section content
  const leftColumnSectionContentStyle = {
    margin: 0,
    padding: '0 4px',
    lineHeight: 1.6,
    fontSize: '14px',
    marginTop: '10px',
  };

  // Helper function to format section titles with proper spacing
  const formatSectionTitle = (key) => {
    const titleMap = {
      'otherInformation': 'OTHER INFORMATION',
      'workExperience': 'WORK EXPERIENCE',
      'customSections': 'CUSTOM SECTIONS'
    };
    
    if (titleMap[key]) {
      return titleMap[key];
    }
    
    // Handle custom section titles
    if (key.startsWith('custom-')) {
      const customIndex = parseInt(key.split('-')[1], 10);
      const customSection = formData.customSections[customIndex];
      if (customSection && customSection.heading) {
        return customSection.heading.trim().toUpperCase();
      }
      return 'ADDITIONAL INFORMATION';
    }
    
    // Default formatting: capitalize first letter and add spaces before capitals
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').toUpperCase();
  };

  const getSectionIcon = (key) => {
    const iconMap = {
      'objective': '🎯',
      'education': '🎓',
      'workExperience': '💼',
      'skills': '⚡',
      'certifications': '🏆',
      'projects': '🚀',
      'languages': '🌍',
      'hobbies': '🎨',
      'references': '📞',
      'otherInformation': 'ℹ️',
      'contact': '📧'
    };
    
    // Handle custom sections with a more versatile icon
    if (key.startsWith('custom-')) {
      return '⭐';
    }
    
    return iconMap[key] || '📄';
  };

  const renderSection = (key, title, content, isLeftColumn) => {
    if (!hasData(key) || !content) return null;
    const icon = getSectionIcon(key);
    return (
      <div className={"section-avoid-break"} style={isLeftColumn ? { ...sectionStyle, marginBottom: 0, padding: '8px 0' } : { ...sectionStyle, marginBottom: '0px', padding: '2px 0' }}>
        <h2 style={isLeftColumn ? leftColumnSectionTitleStyle : sectionTitleStyle}>
          <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{icon}</span>
          {title}
        </h2>
        <div style={isLeftColumn ? leftColumnSectionContentStyle : sectionContentStyle}>{content}</div>
      </div>
    );
  };

  const renderObjective = (objective) => (
    <p style={paragraphStyle}>{objective.join(' ')}</p>
  );

  const renderEducation = (education) => (
    <div style={{ margin: '0px', padding: '0px' }}>
      {education.map((edu, index) => (
        <div key={index} style={educationItemStyle}>
          <span style={degreeStyle}>{edu.degree} ({edu.year})</span>
          <span style={institutionStyle}>{edu.institute}</span>
        </div>
      ))}
    </div>
  );

  const renderWorkExperience = (workExp) => (
    <div style={{ margin: '0px', padding: '0px' }}>
      {workExp.map((job, index) => {
        const isLastJob = index === workExp.length - 1;
        return (
                      <div key={index} id={`workExperience-item-${index}`} style={{
              ...workExperienceItemStyle,
              position: 'relative',
              paddingLeft: '25px',
              marginBottom: '12px'
            }}>
            {/* Timeline bullet point */}
            <div style={{
              position: 'absolute',
              left: '0',
              top: '4px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#107268',
              border: '3px solid #107268',
              boxShadow: '0 2px 4px rgba(16, 114, 104, 0.3)',
              zIndex: 2
            }}></div>
            
            {/* Timeline line (except for last job) */}
            {!isLastJob && (
              <div style={{
                position: 'absolute',
                left: '6px',
                top: '22px',
                width: '2px',
                height: 'calc(100% + 12px)',
                backgroundColor: '#107268',
                zIndex: 1
              }}></div>
            )}
            
            <span style={jobTitleStyle}>{job.designation}</span>
            <span style={companyNameStyle}>{job.company} | {job.duration}</span>
            {job.details && job.details.split('\n').filter(line => line.trim()).map((detail, detailIndex) => (
              <span key={detailIndex} style={{
                ...paragraphStyle,
                display: 'block',
                marginLeft: '0',
                paddingLeft: '0',
                marginTop: '0px',
                textIndent: '-12px',
                paddingLeft: '12px',
                lineHeight: '1.2'
              }}>
                • {detail.trim()}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );

  const renderSkills = (skills) => (
    <div style={tagsContainerStyle}>
      {skills.map((skill, index) => (
        <div key={index} style={skillItemStyle}>
          {skill.name || skill}
        </div>
      ))}
    </div>
  );

  const renderSimpleList = (items, isLeftColumn = false) => {
    if (!Array.isArray(items)) return null;
    const itemColor = isLeftColumn ? '#ffffff' : '#000000';
    return (
      <ul style={{ ...listStyle, paddingLeft: '20px', listStyleType: 'disc' }}>
        {items.map((item, index) => (
          <li key={index} id={`certifications-item-${index}`} style={{ marginBottom: '0px', color: itemColor }}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderReferences = (references) => {
    if (!references || references.length === 0) {
      return (
        <ul style={listStyle}>
          <li style={listItemStyle}>References would be furnished on demand.</li>
        </ul>
      );
    }
    
    return (
      <ul style={listStyle}>
        {references.map((reference, index) => (
          <li key={index} id={`references-item-${index}`} style={listItemStyle}>{reference}</li>
        ))}
      </ul>
    );
  };

  const renderLanguages = (languages) => (
    <div style={tagsContainerStyle}>
      {languages.map((language, index) => (
        <div key={index} style={languageItemStyle}>
          {language}
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

    const otherInfoItemStyle = {
      marginBottom: '4px',
      fontSize: '14px',
      color: '#ffffff',
      margin: 0,
      padding: '3px 0',
      listStyle: 'none',
      lineHeight: '1.5',
      paddingLeft: '0px',
      marginLeft: '-25px',
    };

    return (
      <ul style={listStyle}>
        {checkedItems.map((item, idx) => (
          <li key={idx} style={otherInfoItemStyle}>
            {item.label}: {item.value || '-'}
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
      const icon = getSectionIcon(`custom-${sectionIndex}`);
      
      console.log(`Template4PDF - rendering section ${sectionIndex}:`, sectionHeading);
      return (
        <div key={sectionIndex} style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{icon}</span>
            {sectionHeading}
          </h3>
          <ul style={listStyle}>
            {section.details.map((detail, detailIndex) => (
              <li key={detailIndex} style={listItemStyle}>{detail}</li>
            ))}
          </ul>
        </div>
      );
    });
  };

  const renderAllSections = () => {
    const leftColumnSections = [];
    const rightColumnSections = [];
    
    // Define the order of standard sections for each column
    const leftColumnOrder = ['skills', 'languages', 'projects', 'hobbies', 'otherInformation'];
    const rightColumnOrder = ['objective', 'education', 'workExperience', 'certifications', 'references'];
    
    // Add standard left column sections
    leftColumnOrder.forEach(sectionKey => {
      if (hasData(sectionKey)) {
        const section = sectionList.find(s => s.key === sectionKey);
        if (section) {
          let content;
          // Use left column specific render functions for projects and hobbies
          if (sectionKey === 'projects') {
            content = renderLeftColumnProjects();
          } else if (sectionKey === 'hobbies') {
            content = renderLeftColumnHobbies();
          } else {
            content = sectionData[sectionKey];
          }
          
          leftColumnSections.push({
            key: sectionKey,
            content: renderSection(sectionKey, section.title, content, true),
            type: 'standard'
          });
        }
      }
    });

    // Add standard right column sections
    rightColumnOrder.forEach(sectionKey => {
      if (hasData(sectionKey)) {
        const section = sectionList.find(s => s.key === sectionKey);
        if (section) {
          rightColumnSections.push({
            key: sectionKey,
            content: renderSection(sectionKey, section.title, sectionData[sectionKey], false),
            type: 'standard'
          });
        }
      }
    });

    // Add custom sections in their specified positions
    if (customSections && customSections.length > 0) {
      console.log('Template4PDF - Processing custom sections in renderAllSections:', customSections);
      console.log('Template4PDF - visibleSections:', visibleSections);
      console.log('Template4PDF - customSections in visibleSections:', visibleSections.includes('customSections'));
      
      customSections.forEach((customSection, customIndex) => {
        console.log(`Template4PDF - Processing custom section ${customIndex}:`, customSection);
        if (customSection.details && customSection.details.length > 0) {
          const sectionHeading = customSection.heading?.trim() || 'Additional Information';
          const positionAfter = customSection.positionAfter || 'end';
          
          console.log(`Template4PDF - Custom section ${customIndex} heading:`, sectionHeading);
          console.log(`Template4PDF - Custom section ${customIndex} positionAfter:`, positionAfter);
          
          // Check if this custom section should be included using hasData
          const customSectionKey = `custom-${customIndex}`;
          if (hasData(customSectionKey)) {
            // Determine which column this custom section will be in
            const isLeftColumnSection = leftColumnOrder.includes(positionAfter);
            
            // Use appropriate styling based on the target column
            const titleStyle = isLeftColumnSection ? leftColumnSectionTitleStyle : sectionTitleStyle;
            
            // Create specific style for left column custom sections to align with heading
            const customLeftColumnItemStyle = {
              marginBottom: '4px',
              fontSize: '14px',
              color: '#ffffff',
              margin: 0,
              padding: '3px 0',
              listStyle: 'none',
              lineHeight: '1.5',
              paddingLeft: '0px',
              marginLeft: '-25px',
            };
            
            const itemStyle = isLeftColumnSection ? customLeftColumnItemStyle : listItemStyle;
            
            const customContent = (
              <div key={`custom-${customIndex}`} style={sectionStyle}>
                <h3 style={titleStyle}>
                  <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(`custom-${customIndex}`)}</span>
                  {sectionHeading}
                </h3>
                <ul style={listStyle}>
                  {customSection.details.map((detail, detailIndex) => (
                    <li key={detailIndex} style={itemStyle}>{detail}</li>
                  ))}
                </ul>
              </div>
            );
            
            if (positionAfter === 'end') {
              // Add to the end of right column
              rightColumnSections.push({
                key: `custom-${customIndex}`,
                content: customContent,
                type: 'custom'
              });
              console.log(`Template4PDF - Added custom section ${customIndex} to right column (end)`);
            } else {
              // Check if the target section is in left column
              const targetArray = isLeftColumnSection ? leftColumnSections : rightColumnSections;
              
              // Find the position to insert after
              const insertIndex = targetArray.findIndex(section => section.key === positionAfter);
              if (insertIndex !== -1) {
                // Insert after the specified section
                targetArray.splice(insertIndex + 1, 0, {
                  key: `custom-${customIndex}`,
                  content: customContent,
                  type: 'custom'
                });
                console.log(`Template4PDF - Inserted custom section ${customIndex} after ${positionAfter}`);
              } else {
                // If section not found, add to end of right column
                rightColumnSections.push({
                  key: `custom-${customIndex}`,
                  content: customContent,
                  type: 'custom'
                });
                console.log(`Template4PDF - Added custom section ${customIndex} to right column (fallback)`);
              }
            }
          } else {
            console.log(`Template4PDF - Custom section ${customIndex} not included (hasData returned false):`, customSectionKey);
          }
        } else {
          console.log(`Template4PDF - Skipping custom section ${customIndex}: no valid details`);
        }
      });
    }

    console.log('Template4PDF - Final left column sections:', leftColumnSections.map(s => s.key));
    console.log('Template4PDF - Final right column sections:', rightColumnSections.map(s => s.key));

    return {
      leftColumn: leftColumnSections.map(section => (
        <div key={section.key} style={{ margin: 0, padding: 0 }}>
          {section.content}
        </div>
      )),
      rightColumn: rightColumnSections.map(section => (
        <div key={section.key} style={{ margin: 0, padding: 0 }}>
          {section.content}
        </div>
      ))
    };
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

  const allLanguages = [
    ...(languages || []),
    ...(customLanguages || [])
      .filter(l => l.selected && l.name)
      .map(l => `${l.name} (${l.level})`)
  ];

  // Define sectionData early so it's available for hasData function
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

  // Create left column specific render functions for sections that need white text
  const renderLeftColumnProjects = () => renderSimpleList(projects, true);
  const renderLeftColumnHobbies = () => renderSimpleList(hobbies, true);

  // Debug logging for custom sections
  console.log('Template4PDF - formData.customSections:', customSections);
  console.log('Template4PDF - visibleSections:', visibleSections);

  // Debug logging
  console.log('Template4PDF - workExperience:', workExperience);
  console.log('Template4PDF - professionalTitle:', professionalTitle);
  
  console.log('Section data keys:', Object.keys(sectionData));

  // --- Height-based pagination logic ---
  // Only used in print mode
  // Use the same logic as preview to determine which sections to include
  console.log('Template4PDF - visibleSections:', visibleSections);
  console.log('Template4PDF - formData.customSections:', formData.customSections);
  const getSectionsWithData = () => {
    const rightColumnSections = [];
    const leftColumnSections = [];
    
    // Define the order of standard sections for each column
    const leftColumnOrder = ['skills', 'languages', 'projects', 'hobbies', 'otherInformation'];
    const rightColumnOrder = ['objective', 'education', 'workExperience', 'certifications', 'references'];
    
    // Add standard left column sections only if they have data
    leftColumnOrder.forEach(sectionKey => {
      if (hasData(sectionKey)) {
        leftColumnSections.push(sectionKey);
      }
    });

    // Add standard right column sections only if they have data
    rightColumnOrder.forEach(sectionKey => {
      if (hasData(sectionKey)) {
        rightColumnSections.push(sectionKey);
      }
    });

    // Add custom sections in their specified positions
    if (customSections && customSections.length > 0) {
      console.log('Template4PDF - Processing custom sections in getSectionsWithData:', customSections);
      customSections.forEach((customSection, customIndex) => {
        console.log('Template4PDF - Processing custom section in getSectionsWithData:', customIndex, customSection);
        if (customSection.details && customSection.details.length > 0) {
          const positionAfter = customSection.positionAfter || 'end';
          console.log('Template4PDF - Custom section position in getSectionsWithData:', positionAfter);
          
          // Check if this custom section should be included using hasData
          const customSectionKey = `custom-${customIndex}`;
          if (hasData(customSectionKey)) {
            if (leftColumnOrder.includes(positionAfter)) {
              leftColumnSections.push(customSectionKey);
              console.log('Template4PDF - Added custom section to left column in getSectionsWithData:', customSectionKey);
            } else {
              rightColumnSections.push(customSectionKey);
              console.log('Template4PDF - Added custom section to right column in getSectionsWithData:', customSectionKey);
            }
          } else {
            console.log('Template4PDF - Custom section not included in getSectionsWithData (hasData returned false):', customSectionKey);
          }
        } else {
          console.log('Template4PDF - Skipping custom section in getSectionsWithData (no valid details):', customIndex);
        }
      });
    }
    
    return { rightColumnSections, leftColumnSections };
  };
  
  const { rightColumnSections, leftColumnSections } = getSectionsWithData();
  const rightColumnSectionKeys = rightColumnSections;
  const leftColumnSectionKeys = leftColumnSections;
  const [pages, setPages] = useState([]);
  const [contentChangeTrigger, setContentChangeTrigger] = useState(0);
  const sectionRefs = useRef([]);
  const leftSectionRefs = useRef([]);

  // Helper: Render all sections offscreen for measurement
  const renderOffscreenSections = () => (
    <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '130mm', zIndex: -1, visibility: 'hidden' }}>
      {rightColumnSectionKeys.map((key, idx) => {
        if (key.startsWith('custom-')) {
          // Handle custom sections
          const customIndex = parseInt(key.split('-')[1], 10);
          const customSection = formData.customSections[customIndex];
          if (customSection && customSection.details && customSection.details.length > 0) {
            return (
              <div key={key} ref={el => (sectionRefs.current[idx] = el)}>
                <h2 style={sectionTitleStyle}>
                  <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
                  {customSection.heading?.trim().toUpperCase() || 'ADDITIONAL INFORMATION'}
                </h2>
                <ul style={listStyle}>
                  {customSection.details.map((detail, detailIndex) => (
                    <li key={detailIndex} style={listItemStyle}>{detail}</li>
                  ))}
                </ul>
              </div>
            );
          }
          return null;
        } else {
          // Handle standard sections
          return (
            <div key={key} ref={el => (sectionRefs.current[idx] = el)}>
              {renderSection(key, formatSectionTitle(key), sectionData[key], false)}
            </div>
          );
        }
      })}
    </div>
  );

  // Helper: Render left column sections offscreen for measurement
  const renderOffscreenLeftSections = () => (
    <div style={{ 
      position: 'absolute', 
      left: '-9999px', 
      top: 0, 
      width: '80mm', 
      zIndex: -1, 
      visibility: 'hidden',
      padding: '35px 10px 35px 10px',
      boxSizing: 'border-box',
      background: 'linear-gradient(180deg, #107268 0%, #0d5a52 100%)'
    }}>
      {leftColumnSectionKeys.map((key, idx) => {
        if (key.startsWith('custom-')) {
          // Handle custom sections
          const customIndex = parseInt(key.split('-')[1], 10);
          const customSection = formData.customSections[customIndex];
          if (customSection && customSection.details && customSection.details.length > 0) {
            return (
              <div key={key} ref={el => (leftSectionRefs.current[idx] = el)}>
                <h2 style={leftColumnSectionTitleStyle}>
                  <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
                  {customSection.heading?.trim().toUpperCase() || 'ADDITIONAL INFORMATION'}
                </h2>
                <ul style={listStyle}>
                  {customSection.details.map((detail, detailIndex) => (
                    <li key={detailIndex} style={{ ...listItemStyle, color: '#ffffff' }}>{detail}</li>
                  ))}
                </ul>
              </div>
            );
          }
          return null;
        } else {
          // Handle standard sections
          let content;
          // Use left column specific render functions for projects and hobbies
          if (key === 'projects') {
            content = renderLeftColumnProjects();
          } else if (key === 'hobbies') {
            content = renderLeftColumnHobbies();
          } else {
            content = sectionData[key];
          }
          
          return (
            <div key={key} ref={el => (leftSectionRefs.current[idx] = el)}>
              {renderSection(key, formatSectionTitle(key), content, true)}
            </div>
          );
        }
      })}
    </div>
  );

  // Helper: Render all right column items offscreen for measurement
  const renderOffscreenRightItems = () => (
    <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '130mm', zIndex: -1, visibility: 'hidden' }}>
      {/* Objective */}
      {formData.objective && formData.objective.length > 0 && (
        <div id="objective-item-0" style={{ minHeight: 1 }}>{sectionData.objective}</div>
      )}
      {/* Education */}
      {formData.education && formData.education.length > 0 && (
        <div id="education-item-0" style={{ minHeight: 1 }}>{sectionData.education}</div>
      )}
      {/* Work Experience */}
      {formData.workExperience && formData.workExperience.length > 0 && formData.workExperience.map((job, i) => (
        <div key={i} id={`workExperience-item-${i}`} style={{ minHeight: 1 }}>{renderWorkExperience([job])}</div>
      ))}
      {/* Certifications */}
      {formData.certifications && formData.certifications.length > 0 && formData.certifications.map((cert, i) => (
        <li key={i} id={`certifications-item-${i}`} style={{ minHeight: 1 }}>{cert}</li>
      ))}
      {/* References */}
      {formData.cv_references && formData.cv_references.length > 0 && formData.cv_references.map((ref, i) => (
        <li key={i} id={`references-item-${i}`} style={{ minHeight: 1 }}>{ref}</li>
      ))}
      {/* Custom Sections */}
      {formData.customSections && formData.customSections.length > 0 && formData.customSections.map((customSection, sectionIndex) => {
        console.log('Template4PDF - Rendering offscreen custom section:', sectionIndex, customSection);
        return customSection.details && customSection.details.length > 0 && customSection.details.map((detail, i) => {
          console.log('Template4PDF - Rendering offscreen custom detail:', i, detail);
          // Split by newlines and render each line with bullet points
          const lines = detail.split('\n').filter(line => line.trim());
          return (
            <div key={`${sectionIndex}-${i}`} id={`custom-${sectionIndex}-item-${i}`} style={{ 
              minHeight: 1, 
              color: '#000000',
              marginBottom: '8px', 
              fontSize: '14px', 
              lineHeight: '1.4',
              paddingLeft: '0',
              textIndent: '-12px',
              paddingLeft: '12px'
            }}>
              {lines.map((line, lineIndex) => (
                <div key={lineIndex} style={{ 
                  marginBottom: '4px',
                  paddingLeft: lineIndex === 0 ? '0' : '12px',
                  color: '#000000'
                }}>
                  {line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`}
                </div>
              ))}
            </div>
          );
        });
      })}
    </div>
  );

  // Pagination effect: after mount, measure and group sections into pages
  useLayoutEffect(() => {
    console.log('Pagination useLayoutEffect triggered, isPrintMode:', isPrintMode);
    if (!isPrintMode) {
      console.log('Not in print mode, skipping pagination');
      return;
    }

    setTimeout(() => {
      // Check if custom section elements exist in DOM
      if (formData.customSections && formData.customSections.length > 0) {
        formData.customSections.forEach((customSection, sectionIndex) => {
          if (customSection.details && customSection.details.length > 0) {
            customSection.details.forEach((detail, i) => {
              const element = document.getElementById(`custom-${sectionIndex}-item-${i}`);
              console.log('Template4PDF - DOM check for custom element:', `custom-${sectionIndex}-item-${i}`, element);
            });
          }
        });
      }
      const newPages = [];
      
      // Start with empty pages array - we'll build it properly

      // Restore getSectionItemsAndRefs function
      function getSectionItemsAndRefs(sectionKey) {
        if (sectionKey === 'workExperience' && formData.workExperience && formData.workExperience.length > 0) {
          return formData.workExperience.map((job, i) => ({
            key: `workExperience-${i}`,
            ref: document.getElementById(`workExperience-item-${i}`)
          }));
        }
        if (sectionKey === 'certifications' && formData.certifications && formData.certifications.length > 0) {
          return formData.certifications.map((cert, i) => ({
            key: `certifications-${i}`,
            ref: document.getElementById(`certifications-item-${i}`)
          }));
        }
        if (sectionKey === 'references' && formData.cv_references && formData.cv_references.length > 0) {
          return formData.cv_references.map((ref, i) => ({
            key: `references-${i}`,
            ref: document.getElementById(`references-item-${i}`)
          }));
        }
        // Handle custom sections
        if (sectionKey.startsWith('custom-')) {
          const customIndex = parseInt(sectionKey.split('-')[1], 10);
          const customSection = formData.customSections[customIndex];
          console.log('Template4PDF - getSectionItemsAndRefs for custom section:', sectionKey, 'customIndex:', customIndex, 'customSection:', customSection);
          if (customSection && customSection.details && customSection.details.length > 0) {
            const items = customSection.details.map((detail, i) => {
              const ref = document.getElementById(`custom-${customIndex}-item-${i}`);
              console.log('Template4PDF - Custom item ref:', `custom-${customIndex}-item-${i}`, ref);
              return {
                key: `custom-${customIndex}-${i}`,
                ref: ref
              };
            });
            console.log('Template4PDF - Custom section items:', items);
            return items;
          }
        }
        // For other sections, treat as a single block
        const idx = rightColumnSectionKeys.indexOf(sectionKey);
        return [{ key: sectionKey, ref: sectionRefs.current[idx] }];
      }

      // --- Begin item-level pagination for right column ---
      // We'll need to measure each item in each section
      // We'll use a helper to get items and refs for each section
      const PAGE_HEIGHT_PX = PAGE_CONTENT_HEIGHT_MM * MM_TO_PX;
      const PAGE_TOP_OFFSET = 10; // px reserved for photo+contact+graphics (minimal to allow maximum content)
      const PAGE_BUFFER = 0; // px buffer to allow slightly oversized items (eliminated for maximum fitting)
      
      let currentPage = [];
      let currentHeight = PAGE_TOP_OFFSET;
      let lastSectionKey = null;
      let workExpStarted = false;
      for (let sIdx = 0; sIdx < rightColumnSectionKeys.length; sIdx++) {
        const sectionKey = rightColumnSectionKeys[sIdx];
        const itemsAndRefs = getSectionItemsAndRefs(sectionKey);
        let sectionHeaderHeight = 40;
        const sectionIdx = rightColumnSectionKeys.indexOf(sectionKey);
        const sectionHeaderRef = sectionRefs.current[sectionIdx];
        if (sectionHeaderRef) {
          if (itemsAndRefs.length > 0 && itemsAndRefs[0].ref) {
            sectionHeaderHeight = sectionHeaderRef.offsetHeight - itemsAndRefs[0].ref.offsetHeight;
            if (sectionHeaderHeight < 20) sectionHeaderHeight = 40;
          }
        }
        let headerAdded = false;
        if (sectionKey === 'education') {
          console.log('After Education, currentHeight:', currentHeight, 'Available:', PAGE_HEIGHT_PX - currentHeight);
        }
        if (sectionKey === 'workExperience') {
          console.log('Starting Work Experience section, currentHeight:', currentHeight, 'Available:', PAGE_HEIGHT_PX - currentHeight);
        }
        if (sectionKey === 'certifications') {
          console.log('Starting Certifications section, currentHeight:', currentHeight, 'Available:', PAGE_HEIGHT_PX - currentHeight, 'Total certifications:', formData.certifications.length);
        }
        if (sectionKey.startsWith('custom-')) {
          const customIndex = parseInt(sectionKey.split('-')[1], 10);
          const customSection = formData.customSections[customIndex];
          console.log('Starting Custom section:', sectionKey, 'currentHeight:', currentHeight, 'Available:', PAGE_HEIGHT_PX - currentHeight, 'Total items:', customSection?.details?.length || 0);
          console.log('Template4PDF - Custom section details:', customSection?.details);
        }
        for (let i = 0; i < itemsAndRefs.length; i++) {
          const item = itemsAndRefs[i];
          if (sectionKey.startsWith('custom-')) {
            console.log('Template4PDF - Processing custom item:', i, 'item:', item, 'hasRef:', !!item.ref);
          }
          if (!item.ref) continue;
          const itemHeight = item.ref.offsetHeight;
          let totalItemHeight = itemHeight;
          if (!headerAdded) totalItemHeight += sectionHeaderHeight;
          if (sectionKey === 'workExperience') {
            const willFit = currentHeight + totalItemHeight <= PAGE_HEIGHT_PX + 200;
            console.log(`Job ${i} height:`, itemHeight, 'currentHeight:', currentHeight, 'totalItemHeight:', totalItemHeight, 'Available:', PAGE_HEIGHT_PX - currentHeight, 'Will fit:', willFit, 'newPages.length:', newPages.length);
          }
          if (sectionKey === 'certifications') {
            const willFit = currentHeight + totalItemHeight <= PAGE_HEIGHT_PX + 500;
            console.log(`Certification ${i} height:`, itemHeight, 'currentHeight:', currentHeight, 'totalItemHeight:', totalItemHeight, 'Available:', PAGE_HEIGHT_PX - currentHeight, 'Will fit:', willFit, 'newPages.length:', newPages.length);
          }
          if (sectionKey.startsWith('custom-')) {
            const willFit = currentHeight + totalItemHeight <= PAGE_HEIGHT_PX + 500;
            console.log(`Custom item ${i} height:`, itemHeight, 'currentHeight:', currentHeight, 'totalItemHeight:', totalItemHeight, 'Available:', PAGE_HEIGHT_PX - currentHeight, 'Will fit:', willFit, 'newPages.length:', newPages.length);
          }
                      // Ultra aggressive fitting for work experience, certifications, and custom sections on first page
            if ((sectionKey === 'workExperience' || sectionKey === 'certifications' || sectionKey.startsWith('custom-')) && newPages.length === 0) {
              // On first page, be ultra lenient with work experience, certifications, and custom sections fitting - allow massive overflow
              if (currentHeight + totalItemHeight > PAGE_HEIGHT_PX + 500) {
                console.log(`Creating new page after ${sectionKey} ${i} - currentHeight: ${currentHeight}, totalItemHeight: ${totalItemHeight}, threshold: ${PAGE_HEIGHT_PX + 500}`);
                newPages.push([...currentPage]);
                currentPage = [];
                currentHeight = 0;
                headerAdded = false;
              }
            } else {
              // For other sections or subsequent pages, use normal logic
              if (currentHeight + totalItemHeight > PAGE_HEIGHT_PX + PAGE_BUFFER && currentPage.length > 0) {
                newPages.push([...currentPage]);
                currentPage = [];
                currentHeight = 0;
                headerAdded = false;
              }
            }
          if (!headerAdded) {
            currentPage.push({ type: 'right-header', key: sectionKey });
            currentHeight += sectionHeaderHeight;
            headerAdded = true;
            if (sectionKey.startsWith('custom-')) {
              console.log('Template4PDF - Added custom section header to page:', sectionKey);
            }
          }
          currentPage.push({ type: 'right-item', key: item.key, sectionKey });
          currentHeight += itemHeight;
          if (sectionKey.startsWith('custom-')) {
            console.log('Template4PDF - Added custom section item to page:', item.key, 'sectionKey:', sectionKey);
          }
          if (sectionKey === 'workExperience') workExpStarted = true;
        }
      }
      if (currentPage.length > 0) {
        newPages.push(currentPage);
      }
      
      // Now handle left column pagination - distribute left sections across pages
      const LEFT_COLUMN_HEIGHT_PX = PAGE_CONTENT_HEIGHT_MM * MM_TO_PX;
      const LEFT_COLUMN_TOP_OFFSET = 200; // px reserved for photo+contact+graphics
      const LEFT_COLUMN_BOTTOM_GRAPHICS_HEIGHT = 80; // px for bottom graphics
      const LEFT_COLUMN_BOTTOM_PADDING = 20; // px for bottom padding - reduced from 40
      const LEFT_COLUMN_BUFFER = 20; // px buffer - reduced from 50
      
      // Process left column sections and distribute them across pages
      let currentLeftHeight = LEFT_COLUMN_TOP_OFFSET;
      let currentPageIndex = 0;
      
      leftSectionRefs.current.forEach((el, idx) => {
        if (el) {
          const sectionKey = leftColumnSectionKeys[idx];
          const sectionHeight = el.offsetHeight;
          
          // Check if this section would cause overflow on current page (accounting for bottom graphics and padding)
          const totalBottomSpace = LEFT_COLUMN_BOTTOM_GRAPHICS_HEIGHT + LEFT_COLUMN_BOTTOM_PADDING;
          const availableHeight = LEFT_COLUMN_HEIGHT_PX - totalBottomSpace;
          
          console.log(`Left column section ${sectionKey}: height=${sectionHeight}, currentHeight=${currentLeftHeight}, available=${availableHeight}, total bottom space: ${totalBottomSpace}`);
          
          // Be more lenient on the first page - allow more content to fit
          const isFirstPage = currentPageIndex === 0;
          const isHobbiesSection = sectionKey === 'hobbies';
          
          // Use different buffer strategies based on section and page
          let bufferToUse = LEFT_COLUMN_BUFFER;
          if (isFirstPage) {
            if (isHobbiesSection) {
              // For hobbies on first page, be more strict to ensure it flows to next page if needed
              bufferToUse = 10; // Reduced from 30
            } else {
              // For other sections on first page, be more lenient
              bufferToUse = LEFT_COLUMN_BUFFER + 50; // Reduced from 100
            }
          }
          
          if (currentLeftHeight + sectionHeight > availableHeight + bufferToUse) {
            // Move to next page
            currentPageIndex++;
            currentLeftHeight = LEFT_COLUMN_TOP_OFFSET;
            console.log(`Moving left column section ${sectionKey} to page ${currentPageIndex} due to overflow. Current height: ${currentLeftHeight}, section height: ${sectionHeight}, available: ${availableHeight}, buffer used: ${bufferToUse}`);
          }
          
          // Ensure we have enough pages
          while (newPages.length <= currentPageIndex) {
            newPages.push([]);
          }
          
          // Add the section to the current page
          newPages[currentPageIndex].push({ type: 'left', key: sectionKey });
          currentLeftHeight += sectionHeight + 20; // Add 20px gap between sections
        }
      });
      console.log('Final pages structure:', newPages.map((page, idx) => ({
        pageIndex: idx,
        sections: page.map(s => ({ type: s.type, key: s.key, sectionKey: s.sectionKey }))
      })));
      console.log('Template4PDF - Right column section keys:', rightColumnSectionKeys);
      console.log('Template4PDF - Left column section keys:', leftColumnSectionKeys);
      
      // Check if custom sections are in any page
      const customSectionsInPages = newPages.flatMap(page => 
        page.filter(section => section.sectionKey && section.sectionKey.startsWith('custom-'))
      );
      console.log('Template4PDF - Custom sections in pages:', customSectionsInPages);
      setPages(newPages);
    }, 200);
  }, [isPrintMode, contentChangeTrigger]);

  // Effect to trigger pagination recalculation when content changes
  useEffect(() => {
    if (isPrintMode) {
      console.log('Content changed, triggering pagination recalculation');
      setContentChangeTrigger(prev => prev + 1);
    }
  }, [isPrintMode, formData.projects, formData.hobbies, formData.customSections]);

  // Render sections for a specific page
  const renderPageSections = (pageSections, pageIdx) => {
    const rightSections = pageSections.filter(s => s.type === 'right').map(s => s.key);
    const leftSections = pageSections.filter(s => s.type === 'left').map(s => s.key);
    // New: item-level rendering for right column
    const rightContent = [];
    let lastSectionKey = null;
    pageSections.forEach((section, idx) => {
      if (section.type === 'right-header') {
        // Render section header
        const icon = getSectionIcon(section.key);
        rightContent.push(
          <h2 key={`header-${section.key}-${pageIdx}-${idx}`} style={sectionTitleStyle}>
            <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{icon}</span>
            {formatSectionTitle(section.key)}
          </h2>
        );
        lastSectionKey = section.key;
      } else if (section.type === 'right-item') {
        // Render item for the section
        if (section.sectionKey === 'workExperience') {
          const i = parseInt(section.key.split('-')[1], 10);
          const job = formData.workExperience[i];
          const isLastJob = i === formData.workExperience.length - 1;
          rightContent.push(
            <div key={section.key} style={{
              ...workExperienceItemStyle,
              position: 'relative',
              paddingLeft: '25px',
              marginBottom: '12px'
            }}>
              {/* Timeline bullet point */}
              <div style={{
                position: 'absolute',
                left: '0',
                top: '4px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#107268',
                border: '3px solid #107268',
                boxShadow: '0 2px 4px rgba(16, 114, 104, 0.3)',
                zIndex: 2
              }}></div>
              
              {/* Timeline line (except for last job) */}
              {!isLastJob && (
                <div style={{
                  position: 'absolute',
                  left: '6px',
                  top: '22px',
                  width: '2px',
                  height: 'calc(100% + 12px)',
                  backgroundColor: '#107268',
                  zIndex: 1
                }}></div>
              )}
              
              <span style={jobTitleStyle}>{job.designation}</span>
              <span style={companyNameStyle}>{job.company} | {job.duration}</span>
              {job.details && job.details.split('\n').filter(line => line.trim()).map((detail, detailIndex) => (
                <span key={detailIndex} style={{
                  ...paragraphStyle,
                  display: 'block',
                  marginLeft: '0',
                  paddingLeft: '0',
                  marginTop: '0px',
                  textIndent: '-12px',
                  paddingLeft: '12px',
                  lineHeight: '1.2'
                }}>
                  • {detail.trim()}
                </span>
              ))}
            </div>
          );
        } else if (section.sectionKey === 'certifications') {
          const i = parseInt(section.key.split('-')[1], 10);
          const cert = formData.certifications[i];
          // Split by newlines and render each line with bullet points
          const lines = cert.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            rightContent.push(
              <div key={section.key} style={{ 
                marginBottom: '8px', 
                fontSize: '14px', 
                lineHeight: '1.4',
                paddingLeft: '0',
                textIndent: '-12px',
                paddingLeft: '12px',
                color: '#000000'
              }}>
                {lines.map((line, lineIndex) => (
                  <div key={lineIndex} style={{ 
                    marginBottom: '4px',
                    paddingLeft: lineIndex === 0 ? '0' : '12px',
                    color: '#000000'
                  }}>
                    {line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`}
                  </div>
                ))}
              </div>
            );
          }
        } else if (section.sectionKey === 'references') {
          const i = parseInt(section.key.split('-')[1], 10);
          const ref = formData.cv_references[i];
          rightContent.push(
            <li key={section.key} style={listItemStyle}>{ref}</li>
          );
        } else if (section.sectionKey === 'objective') {
          rightContent.push(
            <div key={section.key}>{sectionData.objective}</div>
          );
        } else if (section.sectionKey === 'education') {
          rightContent.push(
            <div key={section.key}>{sectionData.education}</div>
          );
        } else if (section.sectionKey && section.sectionKey.startsWith('custom-')) {
          // Handle custom sections
          const customIndex = parseInt(section.sectionKey.split('-')[1], 10);
          const customSection = formData.customSections[customIndex];
          console.log('Template4PDF - Rendering custom section item:', section.key, 'customIndex:', customIndex, 'customSection:', customSection);
          if (customSection && customSection.details && customSection.details.length > 0) {
            const itemIndex = parseInt(section.key.split('-')[2], 10);
            const detail = customSection.details[itemIndex];
            console.log('Template4PDF - Custom section detail:', detail, 'itemIndex:', itemIndex);
            if (detail) {
              // Split by newlines and render each line with bullet points
              const lines = detail.split('\n').filter(line => line.trim());
              console.log('Template4PDF - Custom section lines:', lines);
              if (lines.length > 0) {
                const renderedContent = (
                  <div key={section.key} style={{ 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    lineHeight: '1.4',
                    paddingLeft: '0',
                    textIndent: '-12px',
                    paddingLeft: '12px',
                    color: '#000000'
                  }}>
                    {lines.map((line, lineIndex) => (
                      <div key={lineIndex} style={{ 
                        marginBottom: '4px',
                        paddingLeft: lineIndex === 0 ? '0' : '12px',
                        color: '#000000'
                      }}>
                        {line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`}
                      </div>
                    ))}
                  </div>
                );
                console.log('Template4PDF - Pushing custom content to rightContent:', renderedContent);
                rightContent.push(renderedContent);
              }
            }
          }
        }
      }
    });
    return (
      <div className="cv-page print-page" key={pageIdx}>
        <div style={containerStyle}>
          <div className="left-column" style={{ ...leftColumnStyle, position: 'relative', overflow: 'hidden', paddingBottom: 80 }}>
            {/* Only show photo and contact on the first page */}
            {pageIdx === 0 && (
              <>
                <div style={photoContainerStyle}>
                  {formData.image ? (
                    <img src={URL.createObjectURL(formData.image)} alt="Profile" style={photoStyle} />
                  ) : imageUrl ? (
                    <img src={imageUrl} alt="Profile" style={photoStyle} />
                  ) : (
                    <div style={{...photoStyle, background: '#107268' }} />
                  )}
                </div>
                <div style={contactInfoStyle}>
                  <h2 style={leftColumnSectionTitleStyle}>Contact</h2>
                  {phone && <div style={contactRowStyle}><span style={contactIconStyle}>📞</span> <span style={contactTextStyle}>{phone}</span></div>}
                  {email && <div style={contactRowStyle}><span style={contactIconStyle}>📧</span> <span style={contactTextStyle}>{email}</span></div>}
                  {address && <div style={contactRowStyle}><span style={contactIconStyle}>🏠</span> <span style={contactTextStyle}>{address}</span></div>}
                </div>
              </>
            )}
            {/* Render left column sections for this page */}
            {leftSections.map((key) => {
              if (key.startsWith('custom-')) {
                // Handle custom sections in left column
                const customIndex = parseInt(key.split('-')[1], 10);
                const customSection = formData.customSections[customIndex];
                if (customSection && customSection.details && customSection.details.length > 0) {
                  const sectionHeading = customSection.heading?.trim() || 'Additional Information';
                  const icon = getSectionIcon(key);
                  return (
                    <div key={key} className={"section-avoid-break"} style={{ ...sectionStyle, marginBottom: 0, padding: '8px 0' }}>
                      <h2 style={leftColumnSectionTitleStyle}>
                        <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{icon}</span>
                        {sectionHeading}
                      </h2>
                      <ul style={listStyle}>
                        {customSection.details.map((detail, detailIndex) => (
                          <li key={detailIndex} style={{ ...listItemStyle, color: '#ffffff' }}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              } else {
                // Handle standard sections
                const icon = getSectionIcon(key);
                const title = formatSectionTitle(key);
                let content;
                // Use left column specific render functions for projects and hobbies
                if (key === 'projects') {
                  content = renderLeftColumnProjects();
                } else if (key === 'hobbies') {
                  content = renderLeftColumnHobbies();
                } else {
                  content = sectionData[key];
                }
                
                return (
                  <div key={key} className={"section-avoid-break"} style={{ ...sectionStyle, marginBottom: 0, padding: '8px 0' }}>
                    <h2 style={leftColumnSectionTitleStyle}>
                      <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{icon}</span>
                      {title}
                    </h2>
                    <div style={leftColumnSectionContentStyle}>{content}</div>
                  </div>
                );
              }
            })}
            {/* Footer graphics (bottom-graphic) */}
            <div className="bottom-graphic" style={{
              ...bottomGraphicStyle,
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              height: 80,
              zIndex: 10,
              margin: 0
            }}>
              <div style={bottomDecorativeElementStyle}></div>
              <div style={bottomAccentLineStyle}></div>
              <div style={{...bottomAccentDotStyle, left: '35px'}}></div>
              <div style={{...bottomAccentDotStyle, right: '35px'}}></div>
              <div style={bottomGeometricPatternStyle}></div>
              <div style={bottomAccentTriangleStyle}></div>
              <div style={bottomAccentCircleStyle}></div>
              <div style={bottomWavePatternStyle}></div>
              <div style={bottomCornerAccentStyle}></div>
              <div style={bottomDiagonalLineStyle}></div>
              <div style={bottomGradientOverlayStyle}></div>
            </div>
          </div>
          <div className="right-column" style={{ ...rightColumnStyle, position: 'relative', overflow: 'hidden', paddingTop: 80 }}>
            {/* Header graphics (top-graphic) */}
            <div className="top-graphic" style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: 80,
              zIndex: 10,
              margin: 0
            }}>
              <div style={decorativeElementStyle}></div>
              <div style={accentLineStyle}></div>
              <div style={{...accentDotStyle, left: '35px'}}></div>
              <div style={{...accentDotStyle, right: '35px'}}></div>
              <div style={geometricPatternStyle}></div>
              <div style={accentTriangleStyle}></div>
              <div style={accentCircleStyle}></div>
              <div style={wavePatternStyle}></div>
              <div style={cornerAccentStyle}></div>
              <div style={diagonalLineStyle}></div>
              <div style={pulseDotStyle}></div>
              <div style={accentBarStyle}></div>
              <div style={starPatternStyle}></div>
              <div style={gradientOverlayStyle}></div>
              <div style={accentRingStyle}></div>
            </div>
            {/* Only show candidate name on the first page */}
            {pageIdx === 0 && <h1 style={nameStyle}>{name || 'Your Name'}</h1>}
            {rightContent}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .cv-page, .print-page {
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 auto !important;
          box-sizing: border-box;
          background: #fff !important;
          overflow: hidden;
        }
        .left-column {
          display: inline-block;
          vertical-align: top;
          width: 80mm;
          min-height: 297mm;
          box-sizing: border-box;
          background: linear-gradient(180deg, #107268 0%, #0d5a52 100%);
          color: #fff;
          padding: 35px 10px 35px 10px;
          gap: 20px;
          overflow: hidden;
        }
        .right-column {
          display: inline-block;
          vertical-align: top;
          width: 130mm;
          min-height: 297mm;
          box-sizing: border-box;
          padding: 0 15px 15px 15px;
          overflow: hidden;
        }
        @media print {
          .cv-page, .print-page {
            display: block !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            box-sizing: border-box;
            background: #fff !important;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          }
          .cv-page:last-child, .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .left-column, .right-column {
            display: inline-block !important;
            vertical-align: top;
            min-height: 297mm !important;
            box-sizing: border-box;
            overflow: hidden;
          }
          .left-column {
            width: 80mm !important;
          }
          .right-column {
            width: 130mm !important;
          }
          /* Allow content to flow naturally across pages */
          .section-avoid-break {
            page-break-inside: auto;
            break-inside: auto;
          }
          /* Ensure paragraphs and list items can break across pages */
          p, li, div {
            page-break-inside: auto;
            break-inside: auto;
          }
        }
      `}</style>
             {isPrintMode && (
         <>
           {renderOffscreenSections()}
           {renderOffscreenLeftSections()}
           {renderOffscreenRightItems()}
         </>
       )}
      {isPrintMode && pages.length > 0 ? (
        pages.map((pageSections, pageIdx) => renderPageSections(pageSections, pageIdx))
      ) : isPrintMode ? (
        // Fallback: render single page if pagination fails
        <div className="cv-page print-page">
          <div style={containerStyle}>
            <div className="left-column" style={{ ...leftColumnStyle, position: 'relative', overflow: 'hidden', paddingBottom: 80 }}>
              <div style={photoContainerStyle}>
                {formData.image ? (
                  <img src={URL.createObjectURL(formData.image)} alt="Profile" style={photoStyle} />
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Profile" style={photoStyle} />
                ) : (
                  <div style={{...photoStyle, background: '#107268' }} />
                )}
              </div>
              <div style={contactInfoStyle}>
                <h2 style={leftColumnSectionTitleStyle}>Contact</h2>
                {phone && <div style={contactRowStyle}><span style={contactIconStyle}>📞</span> <span style={contactTextStyle}>{phone}</span></div>}
                {email && <div style={contactRowStyle}><span style={contactIconStyle}>📧</span> <span style={contactTextStyle}>{email}</span></div>}
                {address && <div style={contactRowStyle}><span style={contactIconStyle}>🏠</span> <span style={contactTextStyle}>{address}</span></div>}
              </div>
              {renderAllSections().leftColumn}
              <div className="bottom-graphic" style={{
                ...bottomGraphicStyle,
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: 80,
                zIndex: 10,
                margin: 0
              }}>
                <div style={bottomDecorativeElementStyle}></div>
                <div style={bottomAccentLineStyle}></div>
                <div style={{...bottomAccentDotStyle, left: '35px'}}></div>
                <div style={{...bottomAccentDotStyle, right: '35px'}}></div>
                <div style={bottomGeometricPatternStyle}></div>
                <div style={bottomAccentTriangleStyle}></div>
                <div style={bottomAccentCircleStyle}></div>
                <div style={bottomWavePatternStyle}></div>
                <div style={bottomCornerAccentStyle}></div>
                <div style={bottomDiagonalLineStyle}></div>
                <div style={bottomGradientOverlayStyle}></div>
              </div>
            </div>
            <div className="right-column" style={{ ...rightColumnStyle, position: 'relative', overflow: 'hidden', paddingTop: 80 }}>
              <div className="top-graphic" style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: 80,
                zIndex: 10,
                margin: 0
              }}>
                <div style={decorativeElementStyle}></div>
                <div style={accentLineStyle}></div>
                <div style={{...accentDotStyle, left: '35px'}}></div>
                <div style={{...accentDotStyle, right: '35px'}}></div>
                <div style={geometricPatternStyle}></div>
                <div style={accentTriangleStyle}></div>
                <div style={accentCircleStyle}></div>
                <div style={wavePatternStyle}></div>
                <div style={cornerAccentStyle}></div>
                <div style={diagonalLineStyle}></div>
                <div style={pulseDotStyle}></div>
                <div style={accentBarStyle}></div>
                <div style={starPatternStyle}></div>
                <div style={gradientOverlayStyle}></div>
                <div style={accentRingStyle}></div>
              </div>
              <h1 style={nameStyle}>{name || 'Your Name'}</h1>
              {renderAllSections().rightColumn}
            </div>
          </div>
        </div>
      ) : (
        <div className="cv-page">
          <div ref={containerRef} style={containerStyle}>
            <div className="left-column" style={{ ...leftColumnStyle, position: 'relative', overflow: 'hidden', paddingBottom: 80 }}>
              <div style={photoContainerStyle}>
                {formData.image ? (
                  <img src={URL.createObjectURL(formData.image)} alt="Profile" style={photoStyle} />
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Profile" style={photoStyle} />
                ) : (
                  <div style={{...photoStyle, background: '#107268' }} />
                )}
              </div>
              <div style={contactInfoStyle}>
                <h2 style={leftColumnSectionTitleStyle}>Contact</h2>
                {phone && <div style={contactRowStyle}><span style={contactIconStyle}>📞</span> <span style={contactTextStyle}>{phone}</span></div>}
                {email && <div style={contactRowStyle}><span style={contactIconStyle}>📧</span> <span style={contactTextStyle}>{email}</span></div>}
                {address && <div style={contactRowStyle}><span style={contactIconStyle}>🏠</span> <span style={contactTextStyle}>{address}</span></div>}
              </div>
              {renderAllSections().leftColumn}
              <div className="bottom-graphic" style={{
                ...bottomGraphicStyle,
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: 80,
                zIndex: 10,
                margin: 0
              }}>
                <div style={bottomDecorativeElementStyle}></div>
                <div style={bottomAccentLineStyle}></div>
                <div style={{...bottomAccentDotStyle, left: '35px'}}></div>
                <div style={{...bottomAccentDotStyle, right: '35px'}}></div>
                <div style={bottomGeometricPatternStyle}></div>
                <div style={bottomAccentTriangleStyle}></div>
                <div style={bottomAccentCircleStyle}></div>
                <div style={bottomWavePatternStyle}></div>
                <div style={bottomCornerAccentStyle}></div>
                <div style={bottomDiagonalLineStyle}></div>
                <div style={bottomGradientOverlayStyle}></div>
              </div>
            </div>
            <div className="right-column" style={{ ...rightColumnStyle, position: 'relative', overflow: 'hidden', paddingTop: 80 }}>
              <div className="top-graphic" style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: 80,
                zIndex: 10,
                margin: 0
              }}>
                <div style={decorativeElementStyle}></div>
                <div style={accentLineStyle}></div>
                <div style={{...accentDotStyle, left: '35px'}}></div>
                <div style={{...accentDotStyle, right: '35px'}}></div>
                <div style={geometricPatternStyle}></div>
                <div style={accentTriangleStyle}></div>
                <div style={accentCircleStyle}></div>
                <div style={wavePatternStyle}></div>
                <div style={cornerAccentStyle}></div>
                <div style={diagonalLineStyle}></div>
                <div style={pulseDotStyle}></div>
                <div style={accentBarStyle}></div>
                <div style={starPatternStyle}></div>
                <div style={gradientOverlayStyle}></div>
                <div style={accentRingStyle}></div>
              </div>
              <h1 style={nameStyle}>{name || 'Your Name'}</h1>
              {renderAllSections().rightColumn}
            </div>
          </div>
        </div>
      )}
      {/* Download Button - Hidden in print mode */}
      {!isPrintMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 40 }}>
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
      )}
      {showPaymentModal && !isPrintMode && (
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