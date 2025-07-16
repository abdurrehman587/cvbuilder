import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import PropTypes from 'prop-types';
import { PaymentService } from './paymentService';
import ManualPayment from './ManualPayment';
import html2pdf from 'html2pdf.js';





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
    width: '794px',
    height: '1123px',
    backgroundColor: '#ffffff',
    fontFamily: "'Open Sans', Arial, sans-serif",
    color: '#333',
    position: 'relative',
    boxSizing: 'border-box',
  };

  const leftColumnStyle = {
    width: '302px',
    background: 'linear-gradient(180deg, #107268 0%, #0d5a52 100%)',
    color: '#ffffff',
    padding: '35px 25px 35px 25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '1123px',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.08)',
    boxSizing: 'border-box',
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
    width: '491px',
    padding: '0 30px 30px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
    height: '1123px',
    boxSizing: 'border-box',
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
    console.log('=== HYBRID PDF GENERATION START ===');
    
    try {
      setIsLoading(true);
      setButtonText('Generating PDF...');

      // Import required libraries
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      // Get the actual CV container
      const cvContainer = containerRef.current;
      if (!cvContainer) {
        throw new Error('CV container not found');
      }

      console.log('CV container found:', cvContainer);

      // Get all CV pages
      const cvPages = cvContainer.querySelectorAll('.cv-page, .print-page');
      console.log('Found CV pages:', cvPages.length);

      if (cvPages.length === 0) {
        throw new Error('No CV pages found');
      }

      // Add CSS to hide page break indicators
      const style = document.createElement('style');
      style.textContent = `
        .pdf-generation-mode .cv-page:not(:first-child) {
          margin-top: 0 !important;
          border-top: none !important;
          padding-top: 0 !important;
        }
        .pdf-generation-mode .cv-page:not(:first-child)::before {
          display: none !important;
          content: none !important;
        }
      `;
      document.head.appendChild(style);

      // Add class to container to activate PDF generation mode
      cvContainer.classList.add('pdf-generation-mode');

      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Process each page
      for (let i = 0; i < cvPages.length; i++) {
        const page = cvPages[i];
        console.log(`Processing page ${i + 1}/${cvPages.length}`);

        // Convert page to canvas
        const canvas = await html2canvas.default(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          logging: true,
          removeContainer: true,
          scrollX: 0,
          scrollY: 0
        });

        console.log(`Canvas created for page ${i + 1}, size:`, canvas.width, 'x', canvas.height);

        // Convert canvas to image
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        console.log(`Image data created for page ${i + 1}, length:`, imgData.length);

        // Add page to PDF
        if (i > 0) {
          pdf.addPage();
        }

        // Calculate dimensions to fit A4
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add image to PDF
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        
        console.log(`Page ${i + 1} added to PDF`);
      }

      // Remove PDF generation mode and cleanup
      cvContainer.classList.remove('pdf-generation-mode');
      document.head.removeChild(style);

      // Save the PDF
      const filename = `cv-${name || 'template4'}.pdf`;
      pdf.save(filename);

      console.log('PDF generation completed successfully');
      
      setButtonText('PDF Downloaded!');
      alert('PDF downloaded successfully! Check your downloads folder.');
      
      setTimeout(() => {
        setButtonText('Download PDF (Free)');
      }, 3000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Cleanup in case of error
      const cvContainer = containerRef.current;
      if (cvContainer) {
        cvContainer.classList.remove('pdf-generation-mode');
      }
      const style = document.querySelector('style[data-pdf-generation]');
      if (style) {
        document.head.removeChild(style);
      }
      
      let errorMessage = 'Error generating PDF. Please try again.';
      
      if (error.message.includes('CV container not found')) {
        errorMessage = 'CV content not found. Please refresh the page and try again.';
      } else if (error.message.includes('No CV pages found')) {
        errorMessage = 'No CV pages found. Please check if the CV is properly loaded.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('=== HYBRID PDF GENERATION END ===');
    }
  };

  const handleDownloadClick = async () => {
    console.log('Template4PDF - Download button clicked');
    console.log('Template4PDF - isLoading:', isLoading);
    console.log('Template4PDF - containerRef.current:', containerRef.current);
    
    if (isLoading) {
      console.log('Template4PDF - Download already in progress');
      return;
    }

    try {
      console.log('Template4PDF - Starting download process...');
      await generatePDF();
    } catch (error) {
      console.error('Template4PDF - Error in download click handler:', error);
      alert(`Download failed: ${error.message}`);
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

  // --- A4 Page-based Pagination Logic for Preview ---
  const [pages, setPages] = useState([]);
  
  // A4 Page dimensions and measurements (exact A4 size)
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const A4_WIDTH_PX = A4_WIDTH_MM * 3.7795275591; // Convert mm to px (794px)
  const A4_HEIGHT_PX = A4_HEIGHT_MM * 3.7795275591; // Convert mm to px (1123px)
  
  // Content area measurements (accounting for margins and graphics)
  const CONTENT_TOP_MARGIN = 80; // px for header graphics
  const CONTENT_BOTTOM_MARGIN = 80; // px for footer graphics
  const CONTENT_LEFT_MARGIN = 30; // px for left margin
  const CONTENT_RIGHT_MARGIN = 30; // px for right margin
  const AVAILABLE_HEIGHT = A4_HEIGHT_PX - CONTENT_TOP_MARGIN - CONTENT_BOTTOM_MARGIN; // 963px
  const AVAILABLE_WIDTH = A4_WIDTH_PX - CONTENT_LEFT_MARGIN - CONTENT_RIGHT_MARGIN; // 734px
  
  // Column widths (exact measurements)
  const LEFT_COLUMN_WIDTH_MM = 80; // mm
  const RIGHT_COLUMN_WIDTH_MM = 130; // mm
  const LEFT_COLUMN_WIDTH_PX = LEFT_COLUMN_WIDTH_MM * 3.7795275591; // 302px
  const RIGHT_COLUMN_WIDTH_PX = RIGHT_COLUMN_WIDTH_MM * 3.7795275591; // 491px
  
  // Helper function to get all content sections
  const getAllContentSections = () => {
    const sections = [];
    
    // Define which sections should only appear in left column (not in pagination)
    const leftColumnOnlySections = ['skills', 'languages', 'hobbies', 'otherInformation'];
    
    // Add standard sections (excluding left-column-only sections)
    const standardSections = [
      { key: 'objective', title: 'Objective', data: formData.objective },
      { key: 'education', title: 'Education', data: formData.education },
      { key: 'workExperience', title: 'Work Experience', data: formData.workExperience },
      { key: 'certifications', title: 'Certifications', data: formData.certifications },
      { key: 'projects', title: 'Projects', data: formData.projects },
      { key: 'references', title: 'References', data: formData.cv_references }
    ];
    
    // Add sections that have data (excluding left-column-only sections)
    standardSections.forEach(section => {
      if (hasData(section.key) && !leftColumnOnlySections.includes(section.key)) {
        sections.push(section);
      }
    });
    
    // Add custom sections
    if (formData.customSections && formData.customSections.length > 0) {
      formData.customSections.forEach((customSection, index) => {
        if (customSection.details && customSection.details.length > 0) {
          sections.push({
            key: `custom-${index}`,
            title: customSection.heading || 'Additional Information',
            data: customSection.details,
            isCustom: true,
            customIndex: index
          });
        }
      });
    }
    
    return sections;
  };
  
  // Helper function to render a section for measurement
  const renderSectionForMeasurement = (section) => {
    const { key, title, data, isCustom, customIndex } = section;
    
    if (isCustom) {
      return (
        <div key={key} style={{ marginBottom: '20px' }}>
          <h2 style={sectionTitleStyle}>
            <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
            {title.toUpperCase()}
          </h2>
          <ul style={listStyle}>
            {data.map((detail, index) => (
              <li key={index} style={listItemStyle}>{detail}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    switch (key) {
      case 'objective':
        return (
          <div key={key} style={{ marginBottom: '20px' }}>
            <h2 style={sectionTitleStyle}>
              <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
              {title.toUpperCase()}
            </h2>
            <p style={paragraphStyle}>{data.join(' ')}</p>
          </div>
        );
      case 'education':
        return (
          <div key={key} style={{ marginBottom: '20px' }}>
            <h2 style={sectionTitleStyle}>
              <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
              {title.toUpperCase()}
            </h2>
            {renderEducation(data)}
          </div>
        );
      case 'workExperience':
        return (
          <div key={key} style={{ marginBottom: '20px' }}>
            <h2 style={sectionTitleStyle}>
              <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
              {title.toUpperCase()}
            </h2>
            {renderWorkExperience(data)}
          </div>
        );
      case 'certifications':
        return (
          <div key={key} style={{ marginBottom: '20px' }}>
            <h2 style={sectionTitleStyle}>
              <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
              {title.toUpperCase()}
            </h2>
            {renderSimpleList(data)}
          </div>
        );
      case 'projects':
        return (
          <div key={key} style={{ marginBottom: '20px' }}>
            <h2 style={sectionTitleStyle}>
              <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
              {title.toUpperCase()}
            </h2>
            {renderSimpleList(data)}
          </div>
        );
      case 'references':
        return (
          <div key={key} style={{ marginBottom: '20px' }}>
            <h2 style={sectionTitleStyle}>
              <span style={{ marginRight: '8px', fontSize: '1.1em' }}>{getSectionIcon(key)}</span>
              {title.toUpperCase()}
            </h2>
            {renderReferences(data)}
          </div>
        );
      default:
        return null;
    }
  };
  
  // Main pagination logic with smart section distribution for preview
  useLayoutEffect(() => {
    console.log('Starting smart pagination with section distribution...');
    
    const calculatePages = () => {
      try {
        const allSections = getAllContentSections();
        console.log('All sections to paginate:', allSections.map(s => s.key));
        
        if (allSections.length === 0) {
          console.log('No sections to paginate, creating single page');
          setPages([[]]);
          return;
        }
        
        // Smart pagination: Find good break points to keep related sections together
        let pages = [];
        
        // If we have 3 or fewer sections, keep them all on one page
        if (allSections.length <= 3) {
          console.log('Few sections, keeping all on one page');
          pages = [allSections];
        } else {
          // Find optimal break points
          const educationIndex = allSections.findIndex(s => s.key === 'education');
          const workExpIndex = allSections.findIndex(s => s.key === 'workExperience');
          const skillsIndex = allSections.findIndex(s => s.key === 'skills');
          
          let breakPoint = Math.ceil(allSections.length / 2);
          
          // Try to break after education (keep education with objective)
          if (educationIndex !== -1 && educationIndex < allSections.length - 1) {
            breakPoint = educationIndex + 1;
            console.log(`Breaking after education section at index ${breakPoint}`);
          }
          // Or break after work experience (keep work exp with education)
          else if (workExpIndex !== -1 && workExpIndex < allSections.length - 1) {
            breakPoint = workExpIndex + 1;
            console.log(`Breaking after work experience section at index ${breakPoint}`);
          }
          // Or break after skills (keep skills with work exp)
          else if (skillsIndex !== -1 && skillsIndex < allSections.length - 1) {
            breakPoint = skillsIndex + 1;
            console.log(`Breaking after skills section at index ${breakPoint}`);
          }
          
          const firstPageSections = allSections.slice(0, breakPoint);
          const secondPageSections = allSections.slice(breakPoint);
          
          // Check if second page has enough content to justify a separate page
          if (secondPageSections.length === 0) {
            console.log('Second page would be empty, keeping all on one page');
            pages = [allSections];
          } else if (secondPageSections.length === 1 && firstPageSections.length > 2) {
            // If second page would only have 1 section and first page has more than 2, 
            // try to fit everything on one page
            console.log('Second page would only have 1 section, trying to fit all on one page');
            pages = [allSections];
          } else {
            pages = [firstPageSections, secondPageSections];
            console.log(`First page sections:`, firstPageSections.map(s => s.key));
            console.log(`Second page sections:`, secondPageSections.map(s => s.key));
          }
        }
        
        console.log(`Pagination complete: ${pages.length} pages created`);
        console.log('Pages structure:', pages.map((page, idx) => ({
          page: idx + 1,
          sections: page.map(s => s.key),
          sectionCount: page.length
        })));
        
        setPages(pages);
        
      } catch (error) {
        console.error('Error in pagination calculation:', error);
        // Fallback: create simple layout
        const allSections = getAllContentSections();
        if (allSections.length > 0) {
          // For fallback, just put everything on one page if there are 4 or fewer sections
          if (allSections.length <= 4) {
            setPages([allSections]);
          } else {
            // Find a good break point
            let breakPoint = Math.ceil(allSections.length / 2);
            
            // Try to break after education or work experience if they exist
            const educationIndex = allSections.findIndex(s => s.key === 'education');
            const workExpIndex = allSections.findIndex(s => s.key === 'workExperience');
            
            if (educationIndex !== -1 && educationIndex < allSections.length - 1) {
              breakPoint = educationIndex + 1;
            } else if (workExpIndex !== -1 && workExpIndex < allSections.length - 1) {
              breakPoint = workExpIndex + 1;
            }
            
            const firstPageSections = allSections.slice(0, breakPoint);
            const secondPageSections = allSections.slice(breakPoint);
            
            // Only create second page if it has content
            if (secondPageSections.length > 0) {
              setPages([firstPageSections, secondPageSections]);
            } else {
              setPages([allSections]);
            }
          }
        } else {
          setPages([[]]);
        }
      }
    };
    
    // Run pagination after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(calculatePages, 100);
    
    return () => clearTimeout(timeoutId);
  }, [formData, visibleSections]);

  // Effect to trigger pagination recalculation when content changes
  useEffect(() => {
    console.log('Content changed, triggering pagination recalculation');
    // Clear pages to force recalculation
    setPages([]);
    
    // Add a small delay to ensure the form data has been updated
    const timeoutId = setTimeout(() => {
      console.log('Recalculating pagination after content change');
      const allSections = getAllContentSections();
      console.log('Current sections after change:', allSections.map(s => s.key));
      
      // Force recalculation by triggering the useLayoutEffect
      setPages([]);
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [formData.projects, formData.hobbies, formData.customSections, formData.workExperience, formData.education, formData.skills, formData.languages, formData.objective, formData.certifications, formData.cv_references, formData.otherInformation]);

  // Render a single page with its sections for preview
  const renderPage = (pageSections, pageIdx) => {
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
            {renderAllSections().leftColumn}
            
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
              <div className="bottom-decorative-element" style={bottomDecorativeElementStyle}></div>
              <div className="bottom-accent-line" style={bottomAccentLineStyle}></div>
              <div className="bottom-accent-dot" style={{...bottomAccentDotStyle, left: '35px'}}></div>
              <div className="bottom-accent-dot" style={{...bottomAccentDotStyle, right: '35px'}}></div>
              <div className="bottom-geometric-pattern" style={bottomGeometricPatternStyle}></div>
              <div className="bottom-accent-triangle" style={bottomAccentTriangleStyle}></div>
              <div className="bottom-accent-circle" style={bottomAccentCircleStyle}></div>
              <div className="bottom-wave-pattern" style={bottomWavePatternStyle}></div>
              <div className="bottom-corner-accent" style={bottomCornerAccentStyle}></div>
              <div className="bottom-diagonal-line" style={bottomDiagonalLineStyle}></div>
              <div className="bottom-gradient-overlay" style={bottomGradientOverlayStyle}></div>
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
              <div className="decorative-element" style={decorativeElementStyle}></div>
              <div className="accent-line" style={accentLineStyle}></div>
              <div className="accent-dot" style={{...accentDotStyle, left: '35px'}}></div>
              <div className="accent-dot" style={{...accentDotStyle, right: '35px'}}></div>
              <div className="geometric-pattern" style={geometricPatternStyle}></div>
              <div className="accent-triangle" style={accentTriangleStyle}></div>
              <div className="accent-circle" style={accentCircleStyle}></div>
              <div className="wave-pattern" style={wavePatternStyle}></div>
              <div className="corner-accent" style={cornerAccentStyle}></div>
              <div className="diagonal-line" style={diagonalLineStyle}></div>
              <div className="pulse-dot" style={pulseDotStyle}></div>
              <div className="accent-bar" style={accentBarStyle}></div>
              <div className="star-pattern" style={starPatternStyle}></div>
              <div className="gradient-overlay" style={gradientOverlayStyle}></div>
              <div className="accent-ring" style={accentRingStyle}></div>
            </div>
            
            {/* Only show candidate name on the first page */}
            {pageIdx === 0 && <h1 style={nameStyle}>{name || 'Your Name'}</h1>}
            
            {/* Render right column sections for this page */}
            {pageSections.map((section) => renderSectionForMeasurement(section))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .cv-page, .print-page {
          width: 794px !important;
          height: 1123px !important;
          margin: 0 auto !important;
          box-sizing: border-box;
          background: #fff !important;
          overflow: hidden;
          position: relative;
        }
        
        /* Visual page breaks in preview mode - only after first page */
        .cv-page:not(:first-child) {
          margin-top: 30px !important;
          border-top: 3px solid #107268 !important;
          padding-top: 30px !important;
          position: relative !important;
        }
        
        /* Page number indicator in preview */
        .cv-page:not(:first-child)::before {
          content: "Page " counter(page) !important;
          position: absolute !important;
          top: -15px !important;
          right: 20px !important;
          background: #107268 !important;
          color: white !important;
          padding: 4px 12px !important;
          border-radius: 12px !important;
          font-size: 12px !important;
          font-weight: bold !important;
          z-index: 1000 !important;
        }
        
        /* Ensure first page has no break before it */
        .cv-page:first-child {
          margin-top: 0 !important;
          border-top: none !important;
          padding-top: 0 !important;
        }
        
        /* Counter for page numbers */
        .cv-page {
          counter-increment: page !important;
        }
        
        /* Remove visual breaks in print mode */
        @media print {
          .cv-page:not(:first-child) {
            margin-top: 0 !important;
            border-top: none !important;
            padding-top: 0 !important;
          }
        }
        .left-column {
          display: inline-block;
          vertical-align: top;
          width: 302px;
          height: 1123px;
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
          width: 491px;
          height: 1123px;
          box-sizing: border-box;
          padding: 0 15px 15px 15px;
          overflow: hidden;
        }
        @media print {
          .cv-page, .print-page {
            display: block !important;
            width: 794px !important;
            height: 1123px !important;
            margin: 0 auto !important;
            box-sizing: border-box;
            background: #fff !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .cv-page:last-child, .print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .cv-page:not(:first-child) {
            page-break-before: always !important;
            break-before: page !important;
          }
          .left-column, .right-column {
            display: inline-block !important;
            vertical-align: top;
            height: 1123px !important;
            box-sizing: border-box;
            overflow: hidden;
          }
          .left-column {
            width: 302px !important;
            background: linear-gradient(180deg, #107268 0%, #0d5a52 100%) !important;
            color: #ffffff !important;
          }
          .right-column {
            width: 491px !important;
          }
          /* Ensure graphics are visible in print */
          .top-graphic, .bottom-graphic {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Force background colors and gradients in print */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ensure left column background is preserved in print */
          .left-column {
            background: linear-gradient(180deg, #107268 0%, #0d5a52 100%) !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ensure all decorative elements are visible in print */
          .decorative-element, .bottom-decorative-element,
          .accent-line, .bottom-accent-line,
          .accent-dot, .bottom-accent-dot,
          .geometric-pattern, .bottom-geometric-pattern,
          .accent-triangle, .bottom-accent-triangle,
          .accent-circle, .bottom-accent-circle,
          .wave-pattern, .bottom-wave-pattern,
          .corner-accent, .bottom-corner-accent,
          .diagonal-line, .bottom-diagonal-line,
          .gradient-overlay, .bottom-gradient-overlay,
          .pulse-dot, .accent-bar, .star-pattern, .accent-ring {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
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
              {pages.length > 0 ? (
          <>
            {console.log('Rendering paginated pages:', pages.length, 'pages')}
            <div ref={containerRef}>
              {pages.map((pageSections, pageIdx) => renderPage(pageSections, pageIdx))}
            </div>
          </>
        ) : (
          <>
            {console.log('No pages available, rendering single page fallback')}
            <div ref={containerRef}>
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
                      <div className="bottom-decorative-element" style={bottomDecorativeElementStyle}></div>
                      <div className="bottom-accent-line" style={bottomAccentLineStyle}></div>
                      <div className="bottom-accent-dot" style={{...bottomAccentDotStyle, left: '35px'}}></div>
                      <div className="bottom-accent-dot" style={{...bottomAccentDotStyle, right: '35px'}}></div>
                      <div className="bottom-geometric-pattern" style={bottomGeometricPatternStyle}></div>
                      <div className="bottom-accent-triangle" style={bottomAccentTriangleStyle}></div>
                      <div className="bottom-accent-circle" style={bottomAccentCircleStyle}></div>
                      <div className="bottom-wave-pattern" style={bottomWavePatternStyle}></div>
                      <div className="bottom-corner-accent" style={bottomCornerAccentStyle}></div>
                      <div className="bottom-diagonal-line" style={bottomDiagonalLineStyle}></div>
                      <div className="bottom-gradient-overlay" style={bottomGradientOverlayStyle}></div>
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
                      <div className="decorative-element" style={decorativeElementStyle}></div>
                      <div className="accent-line" style={accentLineStyle}></div>
                      <div className="accent-dot" style={{...accentDotStyle, left: '35px'}}></div>
                      <div className="accent-dot" style={{...accentDotStyle, right: '35px'}}></div>
                      <div className="geometric-pattern" style={geometricPatternStyle}></div>
                      <div className="accent-triangle" style={accentTriangleStyle}></div>
                      <div className="accent-circle" style={accentCircleStyle}></div>
                      <div className="wave-pattern" style={wavePatternStyle}></div>
                      <div className="corner-accent" style={cornerAccentStyle}></div>
                      <div className="diagonal-line" style={diagonalLineStyle}></div>
                      <div className="pulse-dot" style={pulseDotStyle}></div>
                      <div className="accent-bar" style={accentBarStyle}></div>
                      <div className="star-pattern" style={starPatternStyle}></div>
                      <div className="gradient-overlay" style={gradientOverlayStyle}></div>
                      <div className="accent-ring" style={accentRingStyle}></div>
                    </div>
                    <h1 style={nameStyle}>{name || 'Your Name'}</h1>
                    {renderAllSections().rightColumn}
                  </div>
                </div>
              </div>
            </div>
          </>
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