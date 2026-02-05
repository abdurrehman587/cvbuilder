import React, { useEffect, useState, useRef } from 'react';
import { setCVView } from '../../utils/routing';
import generatePDF1 from '../template1/pdf1';
import generatePDF2 from '../template2/pdf2';
import generatePDF3 from '../template3/pdf3';
import generatePDF4 from '../template4/pdf4';
import generatePDF5 from '../template5/pdf5';
import { Share } from '@capacitor/share';
import { authService } from '../Supabase/supabase';
import './PreviewPage.css';

// Import all preview components
import Preview1 from '../template1/Preview1';
import Preview2 from '../template2/Preview2';
import Preview3 from '../template3/Preview3';
import Preview4 from '../template4/Preview4';
import Preview5 from '../template5/Preview5';

function PreviewPage({ formData, selectedTemplate, onTemplateSwitch }) {
  // On mount, check if formData is empty and try to load from localStorage
  useEffect(() => {
    if ((!formData || !formData.name) && !formData?.education?.length && !formData?.experience?.length) {
      const storedData = localStorage.getItem('cvFormData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log('PreviewPage - Loaded form data from localStorage:', parsedData);
          // Note: We can't update App.js state from here, but PreviewHandler1 will use this
        } catch (e) {
          console.error('PreviewPage - Error parsing stored form data:', e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // formData changes are handled internally
  // eslint-disable-next-line no-unused-vars
  const [userZoom, setUserZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const previewRef = useRef(null);

  // Get the appropriate preview component based on selected template
  const renderPreview = () => {
    const previewProps = {
      formData: formData,
      autoSaveStatus: '',
      hasUnsavedChanges: false,
      selectedTemplate: selectedTemplate,
      onTemplateSwitch: onTemplateSwitch,
      isPreviewPage: true // Flag to indicate this is the preview page
    };

    switch (selectedTemplate) {
      case 'template1':
        return <Preview1 {...previewProps} />;
      case 'template2':
        return <Preview2 {...previewProps} />;
      case 'template3':
        return <Preview3 {...previewProps} />;
      case 'template4':
        return <Preview4 {...previewProps} />;
      case 'template5':
        return <Preview5 {...previewProps} />;
      default:
        return <Preview1 {...previewProps} />;
    }
  };

  const handleBack = () => {
    // Show loading indicator
    setIsLoading(true);
    
    // Set a timeout to clear loading state if navigation takes too long (5 seconds)
    const loadingTimeout = setTimeout(() => {
      console.warn('PreviewPage - Navigation timeout, clearing loading state');
      setIsLoading(false);
    }, 5000);
    
    // Ensure formData is stored in localStorage before navigating back
    // First, check if formData from props has meaningful data
    const hasPropData = formData && (formData.name || formData.education?.length > 0 || formData.experience?.length > 0);
    
    // If props don't have data, try to get from localStorage (preview components may have loaded it there)
    let dataToStore = formData;
    if (!hasPropData) {
      const storedData = localStorage.getItem('cvFormData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          const hasStoredData = parsedData.name || parsedData.education?.length > 0 || parsedData.experience?.length > 0;
          if (hasStoredData) {
            console.log('PreviewPage - Using stored data from localStorage (props were empty):', parsedData);
            dataToStore = parsedData;
          }
        } catch (e) {
          console.error('PreviewPage - Error parsing stored data:', e);
        }
      }
    }
    
    // Check if we have meaningful data to store
    const hasDataToStore = dataToStore && (dataToStore.name || dataToStore.education?.length > 0 || dataToStore.experience?.length > 0);
    
    if (hasDataToStore) {
      // Convert File to base64 if needed before storing
      const storeDataWithImage = async () => {
        try {
          let profileImageData = null;
          
          if (dataToStore.profileImage) {
            if (dataToStore.profileImage.data) {
              // Already base64 from database
              profileImageData = { data: dataToStore.profileImage.data };
            } else if (dataToStore.profileImage instanceof File) {
              // Convert File to base64
              try {
                const base64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(dataToStore.profileImage);
                });
                profileImageData = { data: base64 };
                console.log('PreviewPage - Converted profile image to base64');
              } catch (err) {
                console.error('PreviewPage - Error converting profile image to base64:', err);
                profileImageData = null;
              }
            } else {
              profileImageData = dataToStore.profileImage;
            }
          }
          
          // Create a serializable copy
          const serializableData = {
            ...dataToStore,
            profileImage: profileImageData
          };
          
          // Store formData in localStorage so it can be loaded when returning to form
          localStorage.setItem('cvFormData', JSON.stringify(serializableData));
          // Set a flag to indicate we're returning from preview (not creating new CV)
          localStorage.setItem('returningFromPreview', 'true');
          console.log('PreviewPage - Stored formData in localStorage before navigating back:', serializableData);
        } catch (e) {
          console.error('PreviewPage - Error storing formData:', e);
          // If serialization fails, try storing without profileImage
          try {
            const { profileImage, ...dataWithoutImage } = dataToStore;
            localStorage.setItem('cvFormData', JSON.stringify(dataWithoutImage));
            localStorage.setItem('returningFromPreview', 'true');
            console.log('PreviewPage - Stored formData without profileImage due to serialization error');
          } catch (e2) {
            console.error('PreviewPage - Error storing formData even without profileImage:', e2);
          }
        }
      };
      
      // Convert and store
      storeDataWithImage();
    } else {
      // If no meaningful data, still set the flag but log a warning
      console.warn('PreviewPage - No meaningful formData available to store when going back');
      console.warn('PreviewPage - formData from props:', formData);
      console.warn('PreviewPage - localStorage data:', localStorage.getItem('cvFormData'));
      localStorage.setItem('returningFromPreview', 'true');
    }
    
    // Set CV view to builder
    setCVView('cv-builder');
    // Set goToCVForm flag to ensure form is shown (not dashboard)
    sessionStorage.setItem('goToCVForm', 'true');
    localStorage.setItem('goToCVForm', 'true');
    
    // Small delay to ensure localStorage is written and loading indicator is visible
    setTimeout(() => {
      // Clear timeout since we're navigating now
      clearTimeout(loadingTimeout);
      
      // Navigate back using direct reload - this is the most reliable method
      // The component will unmount on reload, so loading state will be cleared automatically
      window.location.hash = '#cv-builder';
      window.location.reload();
    }, 150);
  };

  const handleDownloadPDF = () => {
    // Get formData from props or localStorage for filename
    let dataForFileName = formData;
    
    // If formData from props is empty, try localStorage
    if (!dataForFileName || !dataForFileName.name) {
      const storedData = localStorage.getItem('cvFormData');
      if (storedData) {
        try {
          dataForFileName = JSON.parse(storedData);
        } catch (e) {
          console.error('Error parsing stored data for filename:', e);
        }
      }
    }
    
    // Get the correct PDF generator based on selected template
    let generatePDF;
    switch (selectedTemplate) {
      case 'template1':
        generatePDF = generatePDF1;
        break;
      case 'template2':
        generatePDF = generatePDF2;
        break;
      case 'template3':
        generatePDF = generatePDF3;
        break;
      case 'template4':
        generatePDF = generatePDF4;
        break;
      case 'template5':
        generatePDF = generatePDF5;
        break;
      default:
        generatePDF = generatePDF1;
    }
    
    // Call the PDF generation function
    if (generatePDF) {
      // Template 1, 2, 3, and 4 accept formData parameter for filename
      if (selectedTemplate === 'template1' || selectedTemplate === 'template2' || selectedTemplate === 'template3' || selectedTemplate === 'template4' || selectedTemplate === 'template5') {
        generatePDF(dataForFileName);
      } else {
        // Other templates don't accept formData parameter
        generatePDF();
      }
    }
  };

  const handleShareApp = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        alert('Please login to share and earn credits.');
        return;
      }

      // Generate unique referral link for this user
      const referralCode = btoa(user.id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const shareUrl = `${window.location.origin}?ref=${referralCode}`;
      const shareText = 'Sign in the app and get free credits.';
      const shareTitle = 'Get Glory - CV Builder';

      try {
        if (window.Capacitor && Share) {
          await Share.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
            dialogTitle: 'Share Get Glory App'
          });
          return;
        }
      } catch (capError) {
        if (capError.message && (capError.message.includes('cancel') || capError.message.includes('dismiss'))) {
          return;
        }
        console.log('Capacitor Share error:', capError);
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.error('Error sharing:', shareError);
          }
        }
      } else {
        const fullText = `${shareText}\n${shareUrl}`;
        try {
          await navigator.clipboard.writeText(fullText);
          alert('Link copied to clipboard!');
        } catch (clipError) {
          alert('Unable to copy. Please share manually.');
        }
      }
    } catch (err) {
      console.error('Error in share process:', err);
    }
  };

  return (
    <div className="preview-page-container">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="preview-page-loading-overlay">
          <div className="preview-page-loading-spinner">
            <div className="spinner"></div>
            <p className="loading-text">Loading form data...</p>
          </div>
        </div>
      )}
      
      {/* Header with controls */}
      <div className="preview-page-header">
        <button 
          className="preview-page-back-button"
          onClick={handleBack}
          title="Back to CV Builder"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-small"></span>
              Loading...
            </>
          ) : (
            '← Back'
          )}
        </button>

        {/* Template Switcher - Buttons */}
        {onTemplateSwitch && (
          <div className="preview-page-template-switcher">
            <label className="preview-template-label">Template:</label>
            <div className="preview-template-buttons">
              <button
                className={`preview-template-button ${selectedTemplate === 'template1' ? 'active' : ''}`}
                onClick={() => onTemplateSwitch('template1')}
                title="Template 1"
              >
                T1
              </button>
              <button
                className={`preview-template-button ${selectedTemplate === 'template2' ? 'active' : ''}`}
                onClick={() => onTemplateSwitch('template2')}
                title="Template 2"
              >
                T2
              </button>
              <button
                className={`preview-template-button ${selectedTemplate === 'template3' ? 'active' : ''}`}
                onClick={() => onTemplateSwitch('template3')}
                title="Template 3"
              >
                T3
              </button>
              <button
                className={`preview-template-button ${selectedTemplate === 'template4' ? 'active' : ''}`}
                onClick={() => onTemplateSwitch('template4')}
                title="Template 4 (Europass)"
              >
                T4
              </button>
              <button
                className={`preview-template-button ${selectedTemplate === 'template5' ? 'active' : ''}`}
                onClick={() => onTemplateSwitch('template5')}
                title="Template 5"
              >
                T5
              </button>
            </div>
          </div>
        )}

        {/* Share Button */}
        <button 
          className="preview-page-share-button"
          onClick={handleShareApp}
          title="Share App & Get Free Credit"
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          📤 Share App & Get Free Credit
        </button>

        {/* Download PDF Button */}
        <button 
          className="preview-page-download-button"
          onClick={handleDownloadPDF}
          title="Download CV as PDF"
        >
          📥 Download PDF
        </button>
      </div>

      {/* Preview Content */}
      <div className="preview-page-content" ref={previewRef}>
        {selectedTemplate === 'template3' ? (
          <div className="preview-page-preview-wrapper template3-wrapper">
            {renderPreview()}
          </div>
        ) : (
          renderPreview()
        )}
      </div>
    </div>
  );
}

export default PreviewPage;

