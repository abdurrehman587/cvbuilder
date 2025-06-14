import React, { useState } from 'react';
import Form from './Form';
import Template1Preview from './Template1Preview';
import Template2Preview from './Template2Preview';
import Template3Preview from './Template3Preview';
import Template4Preview from './Template4Preview';
import Template5Preview from './Template5Preview';
import Template6Preview from './Template6Preview';
import Template7Preview from './Template7Preview';
import Template8Preview from './Template8Preview';
import Template9Preview from './Template9Preview';
import Template10Preview from './Template10Preview';

const LandingPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState(null);

  const templates = Array.from({ length: 10 }, (_, i) => ({
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
    'Template 8': Template8Preview,
    'Template 9': Template9Preview,
    'Template 10': Template10Preview,
  };

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
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

  if (selectedTemplate && TemplateComponentsMap[selectedTemplate]) {
    const PreviewComponent = TemplateComponentsMap[selectedTemplate];

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#f4f6f8',
          padding: '16px',
        }}
      >
        {renderBackButton()}
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '2rem',
            color: '#111827',
          }}
        >
          Editing {selectedTemplate}
        </h1>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              flex: '1 1 350px',
              minWidth: '320px',
              maxWidth: '600px',
              backgroundColor: '#fff',
              padding: '1rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Form
              formData={formData}
              setFormData={setFormData}
              onChange={handleFormDataChange}
            />
          </div>
          <div
            style={{
              flex: '1 1 350px',
              minWidth: '320px',
              maxWidth: '800px',
            }}
          >
            {formData ? (
              <PreviewComponent formData={formData} />
            ) : (
              <div
                style={{
                  minHeight: '300px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#999',
                  fontSize: '1.2rem',
                  fontStyle: 'italic',
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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

  // Template selection screen
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem 1rem',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f4f6f8',
        color: '#6b7280',
      }}
    >
      <h1
        style={{
          fontWeight: 700,
          fontSize: '2.5rem',
          marginBottom: '2rem',
          color: '#111827',
          userSelect: 'none',
          textAlign: 'center',
        }}
      >
        Select a CV Template
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          justifyContent: 'center',
          alignItems: 'start',
          width: '100%',
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
              backgroundColor: '#fff',
              border: '2px solid #3498db',
              borderRadius: '12px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              minHeight: '360px',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'translateY(-4px)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = 'translateY(0)')
            }
          >
            <div
              style={{
                width: '100%',
                backgroundColor: '#ecf0f1',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                aspectRatio: '2 / 3',
              }}
            >
              <img
                src={template.imageUrl}
                alt={`${template.name} Preview`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px',
                }}
              />
            </div>
            <div
              style={{
                fontWeight: '700',
                fontSize: '1.1rem',
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
