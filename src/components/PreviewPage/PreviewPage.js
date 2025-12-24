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
    // Ensure formData is stored in localStorage before navigating back
    if (formData) {
      try {
        // Store formData in localStorage so it can be loaded when returning to form
        localStorage.setItem('cvFormData', JSON.stringify(formData));
        console.log('PreviewPage - Stored formData in localStorage before navigating back:', formData);
      } catch (e) {
        console.error('PreviewPage - Error storing formData:', e);
      }
    }
    
    // Set CV view to builder and reload
    setCVView('cv-builder');
    // Small delay to ensure localStorage is written
    setTimeout(() => {
      window.location.reload(); // Force reload to update the view
    }, 50);
  };

  const handleDownloadPDF = () => {
    // Call the PDF generation function
    if (generatePDF) {
      generatePDF();
    }
  };

  return (
    <div className="preview-page-container">
      {/* Header with controls */}
      <div className="preview-page-header">
        <button 
          className="preview-page-back-button"
          onClick={handleBack}
          title="Back to CV Builder"
        >
          ← Back
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

