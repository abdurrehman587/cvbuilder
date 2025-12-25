import React, { useEffect, useState, useRef } from 'react';
import { setCVView } from '../../utils/routing';
import generatePDF from '../template1/pdf1';
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
  }, []);
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
    
    // Ensure formData is stored in localStorage before navigating back
    // Use formData from props (which comes from App.js state) or fallback to localStorage
    const dataToStore = formData;
    
    if (dataToStore) {
      try {
        // Create a serializable copy (handle profileImage properly)
        const serializableData = {
          ...dataToStore,
          profileImage: dataToStore.profileImage 
            ? (dataToStore.profileImage.data 
                ? { data: dataToStore.profileImage.data } 
                : dataToStore.profileImage instanceof File 
                  ? null // Can't serialize File objects
                  : dataToStore.profileImage)
            : null
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
    } else {
      // If no formData in props, try to get from localStorage (should already be there)
      const storedData = localStorage.getItem('cvFormData');
      if (!storedData) {
        console.warn('PreviewPage - No formData available to store when going back');
      }
      localStorage.setItem('returningFromPreview', 'true');
    }
    
    // Set CV view to builder
    setCVView('cv-builder');
    // Set goToCVForm flag to ensure form is shown (not dashboard)
    sessionStorage.setItem('goToCVForm', 'true');
    localStorage.setItem('goToCVForm', 'true');
    
    // Small delay to ensure localStorage is written and loading indicator is visible
    setTimeout(() => {
      // Navigate back without reload to preserve form data
      // Use hash change to trigger navigation
      window.location.hash = '#cv-builder';
      
      // Additional delay to ensure navigation happens
      setTimeout(() => {
        // Force navigation by updating hash - this will trigger App.js to re-render
        // without losing the form data that's already in localStorage
        window.location.hash = '#cv-builder';
        // If hash change doesn't work, reload as fallback
        if (window.location.hash !== '#cv-builder') {
          window.location.reload();
        }
      }, 100);
    }, 100);
  };

  const handleDownloadPDF = () => {
    // Call the PDF generation function
    if (generatePDF) {
      generatePDF();
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
                title="Template 4"
              >
                T4
              </button>
              <button
                className={`preview-template-button ${selectedTemplate === 'template5' ? 'active' : ''}`}
                onClick={() => onTemplateSwitch('template5')}
                title="Template 5 (Europass)"
              >
                T5
              </button>
            </div>
          </div>
        )}

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
        {renderPreview()}
      </div>
    </div>
  );
}

export default PreviewPage;

