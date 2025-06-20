import React, { useState, useEffect } from 'react';
import Form from './Form';
import Template1Preview from './Template1Preview';
import Template2Preview from './Template2Preview';
import Template3Preview from './Template3Preview';
import Template4Preview from './Template4Preview';
import Template5Preview from './Template5Preview';
import Template6Preview from './Template6Preview';
import Template7Preview from './Template7Preview';

const LandingPage = ({ user }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    image: null,
    imageUrl: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    objective: ['Seeking a challenging position where I can develop my education skills further and become a valuable team member.'],
    education: [{ degree: '', institute: '', year: '' }],
    workExperience: [{ company: '', designation: '', duration: '', details: '' }],
    skills: [
      { name: 'Communication', percentage: '90%' },
      { name: 'Hardworking', percentage: '95%' },
      { name: 'Time Management', percentage: '95%' },
      { name: 'Accurate Planning', percentage: '80%' },
    ],
    certifications: [''],
    projects: [''],
    languages: ['English', 'Urdu', 'Punjabi'],
    customLanguages: [],
    hobbies: [''],
    references: [''],
    otherInformation: [
      { id: 1, labelType: 'radio', label: "Father's Name:", checked: true, value: '', name: 'parentSpouse', radioValue: 'father' },
      { id: 2, labelType: 'radio', label: "Husband's Name:", checked: false, value: '', name: 'parentSpouse', radioValue: 'husband' },
      { id: 3, labelType: 'checkbox', label: 'CNIC:', checked: true, value: '', isCustom: false },
      { id: 4, labelType: 'checkbox', label: 'Date of Birth:', checked: true, value: '', isCustom: false },
      { id: 5, labelType: 'checkbox', label: 'Marital Status:', checked: true, value: '', isCustom: false },
      { id: 6, labelType: 'checkbox', label: 'Religion:', checked: true, value: '', isCustom: false },
    ],
  });

  const templates = Array.from({ length: 7 }, (_, i) => ({
    name: `Template ${i + 1}`,
    imageUrl: `/templates/template${i + 1}.jpg`,
  }));

  const TemplateComponentsMap = {
    'Template 1': Template1Preview,
    'Template 2': Template2Preview,
    'Template 3': Template3Preview,
    'Template 4': Template4Preview,
    'Template 5': Template5Preview,
    'Template 6': Template6Preview,
    'Template 7': Template7Preview,
  };

  const handleTemplateClick = (template) => {
    if (selectedTemplate === template) {
      return; // Prevent duplicate selection
    }
    
    if (!TemplateComponentsMap[template]) {
      console.error('Template component not found:', template);
      return;
    }
    
    setSelectedTemplate(template);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    // formData is preserved globally, not per template
  };

  const handleFormDataChange = (data) => {
    setFormData(data);
  };

  const renderBackButton = () => (
    <button
      onClick={handleBack}
      style={{
        marginBottom: '0',
        padding: '10px 20px',
        fontWeight: '600',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        userSelect: 'none',
        alignSelf: 'flex-start',
        maxWidth: '160px',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#217dbb')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3498db')}
      type="button"
    >
      &larr; Back to Templates
    </button>
  );

  // Debug useEffect to track selectedTemplate changes
  useEffect(() => {
    console.log('selectedTemplate changed to:', selectedTemplate);
    console.log('Will render template view:', selectedTemplate && TemplateComponentsMap[selectedTemplate]);
  }, [selectedTemplate]);

  if (selectedTemplate && TemplateComponentsMap[selectedTemplate]) {
    const PreviewComponent = TemplateComponentsMap[selectedTemplate];

    return (
      <div
        style={{
          // Remove the left padding to prevent the "zoomed in" effect
          display: 'flex',
          padding: '20px 40px 20px 40px', // changed from '20px 40px 20px 180px'
          flexDirection: 'column',
          minHeight: '100vh',
          boxSizing: 'border-box',
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#f4f6f8',
        }}
      >
        {renderBackButton()}
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            marginBottom: '32px',
            color: '#111827',
            textAlign: 'left',
          }}
        >
          Editing {selectedTemplate}
        </h1>
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'flex-start',
            gap: '60px', // changed from '250px' for better layout
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: '1 1 600px',
              maxWidth: '1100px',
              backgroundColor: '#fff',
              padding: '20px',
              boxSizing: 'border-box',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              // Remove the scale transform to prevent zooming
              // transform: 'scale(1.2)',
              // transformOrigin: 'top',
            }}
          >
            <Form
              formData={formData}
              setFormData={setFormData}
              onChange={handleFormDataChange}
              user={user}
            />
          </div>
          <div
            style={{
              flex: '0 0 auto',
              boxSizing: 'border-box',
              // Remove the scale transform to prevent zooming
              // transform: 'scale(1.2)',
              // transformOrigin: 'top',
            }}
          >
            {formData ? (
              <PreviewComponent formData={formData} />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#999',
                  fontSize: '1.2rem',
                  fontStyle: 'italic',
                  padding: '20px',
                }}
              >
                Fill out the form to see a live preview.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Template selection screen with left-aligned grid
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 40px',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f4f6f8',
        color: '#6b7280',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          fontWeight: 700,
          fontSize: '48px',
          marginBottom: '40px',
          color: '#111827',
          userSelect: 'none',
          textAlign: 'left',
        }}
      >
        Select a CV Template
      </h1>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '32px',
          justifyContent: 'flex-start',
        }}
      >
        {templates.map((template) => (
          <div
            key={template.name}
            onClick={() => handleTemplateClick(template.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleTemplateClick(template.name);
              }
            }}
            title={`Click to use ${template.name}`}
            style={{
              width: '480px',
              height: '750px',
              backgroundColor: '#fff',
              border: '2px solid #3498db',
              borderRadius: '12px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div
              style={{
                width: '100%',
                height: '87%',
                backgroundColor: '#ecf0f1',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#7f8c8d',
                textAlign: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={template.imageUrl}
                alt={`${template.name} Preview`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', borderRadius: '12px' }}
              />
            </div>
            <div
              style={{
                fontWeight: '700',
                fontSize: '1.3rem',
                color: '#2980b9',
                marginTop: '10px',
              }}
            >
              {template.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;

