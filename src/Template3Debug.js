import React, { useState } from 'react';
import Template3PDF from './Template3PDF';

const Template3Debug = () => {
  const [testFormData] = useState({
    name: 'Test User',
    title: 'Software Developer',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test Street, Test City',
    objective: 'To become a successful software developer',
    education: [
      {
        degree: 'Bachelor of Science',
        institution: 'Test University',
        year: '2020',
        gpa: '3.8'
      }
    ],
    workExperience: [
      {
        position: 'Junior Developer',
        company: 'Test Company',
        duration: '2020-2022',
        description: 'Developed web applications'
      }
    ],
    skills: [
      { name: 'JavaScript', percentage: 90 },
      { name: 'React', percentage: 85 },
      { name: 'Node.js', percentage: 80 }
    ]
  });

  const [visibleSections] = useState([
    'objective',
    'education',
    'workExperience',
    'skills'
  ]);

  const testDownload = async () => {
    console.log('Template3Debug: Testing direct download...');
    try {
      // Create a temporary div to render the PDF
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      // Render the PDF component
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      root.render(
        <Template3PDF 
          formData={testFormData} 
          visibleSections={visibleSections} 
        />
      );

      // Wait a bit for rendering
      setTimeout(() => {
        // Try to trigger download
        const downloadButton = tempDiv.querySelector('button');
        if (downloadButton) {
          console.log('Template3Debug: Found download button, clicking...');
          downloadButton.click();
        } else {
          console.log('Template3Debug: No download button found');
        }

        // Cleanup
        setTimeout(() => {
          root.unmount();
          document.body.removeChild(tempDiv);
        }, 5000);
      }, 2000);

    } catch (error) {
      console.error('Template3Debug: Test download failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Template 3 Debug</h1>
      <p>This is a debug component to test Template 3 download functionality.</p>
      
      <button 
        onClick={testDownload}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Test Direct Download
      </button>

      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '4px' }}>
        <h2>Template 3 Preview</h2>
        <Template3PDF 
          formData={testFormData} 
          visibleSections={visibleSections} 
        />
      </div>
    </div>
  );
};

export default Template3Debug; 