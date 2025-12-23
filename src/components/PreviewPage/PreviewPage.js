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
    setCVView('cv-builder');
    window.location.reload(); // Force reload to update the view
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

        {/* Template Switcher */}
        {onTemplateSwitch && (
          <div className="preview-page-template-switcher">
            <label className="preview-template-label">Template:</label>
            <select 
              className="preview-template-select"
              value={selectedTemplate || 'template1'}
              onChange={(e) => {
                if (onTemplateSwitch) {
                  onTemplateSwitch(e.target.value);
                }
              }}
              title="Switch Template"
            >
              <option value="template1">Template 1</option>
              <option value="template2">Template 2</option>
              <option value="template3">Template 3</option>
              <option value="template4">Template 4</option>
              <option value="template5">Template 5 (Europass)</option>
            </select>
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

