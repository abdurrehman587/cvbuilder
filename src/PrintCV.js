import React from 'react';
import Template4PDF from './Template4PDF';

const PrintCV = ({ formData, visibleSections = [] }) => {
  return (
    <div style={{ 
      width: '210mm', 
      minHeight: '297mm',
      margin: '0 auto',
      background: '#ffffff',
      fontFamily: "'Open Sans', Arial, sans-serif",
      color: '#333',
      boxSizing: 'border-box'
    }}>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .cv-page {
              width: 210mm;
              height: 297mm;
              min-height: 297mm;
              page-break-after: always;
              display: flex;
              flex-direction: row;
              box-sizing: border-box;
            }
            .cv-page:last-child {
              page-break-after: auto;
            }
            .left-column, .right-column {
              position: relative !important;
              height: 297mm !important;
              min-height: 297mm !important;
              box-sizing: border-box;
              overflow: hidden;
            }
            .top-graphic {
              position: absolute !important;
              top: 0;
              left: 0;
              width: 100% !important;
              height: 80px !important;
              z-index: 10;
            }
            .bottom-graphic {
              position: absolute !important;
              bottom: 0;
              left: 0;
              width: 100% !important;
              height: 80px !important;
              z-index: 10;
            }
            .left-column {
              background: #107268 !important;
              color: white !important;
            }
            button, .template-controls, .signout-btn {
              display: none !important;
            }
          }
          @media screen {
            .cv-page {
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              border-radius: 10px;
              margin: 20px auto;
              width: 210mm;
              min-height: 297mm;
              display: flex;
              flex-direction: row;
            }
          }
        `}
      </style>
      <div className="cv-page">
        <Template4PDF 
          formData={formData} 
          visibleSections={visibleSections}
          isPrintMode={true}
        />
      </div>
    </div>
  );
};

export default PrintCV; 