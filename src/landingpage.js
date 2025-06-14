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
    // formData is preserved globally, not per template
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

  if (selectedTemplate && TemplateComponentsMap[selectedTemplate]) {
    const PreviewComponent = TemplateComponentsMap[selectedTemplate];

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          boxSizing: 'border-box',
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#f4f6f8',
          padding: '16px 0',
        }}
      >
        {renderBackButton()}
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '2rem',
            color: '#111827',
            textAlign: 'left',
            paddingLeft: '1rem',
          }}
        >
          Editing {selectedTemplate}
        </h1>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            width: '100%',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '2rem',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                flex: '1 1 350px',
                minWidth: '320px',
                maxWidth: '600px',
                backgroundColor: '#fff',
                padding: '1rem',
                boxSizing: 'border-box',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                // Remove transform scaling for responsiveness
                width: '100%',
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
                boxSizing: 'border-box',
                width: '100%',
                // Remove transform scaling for responsiveness
                overflowX: 'auto',
              }}
            >
              {formData ? (
                <PreviewComponent formData={formData} />
              ) : (
                <div
                  style={{
                    height: '100%',
                    minHeight: '300px',
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
      </div>
    );
  }

  // Responsive Template selection screen
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem 1rem',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f4f6f8',
        color: '#6b7280',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          fontWeight: 700,
          fontSize: '2.5rem',
          marginBottom: '2rem',
          color: '#111827',
          userSelect: 'none',
          textAlign: 'left',
        }}
      >
        Select a CV Template
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
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
              width: '100%',
              aspectRatio: '2/3',
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
              userSelect: 'none',
              minHeight: '350px',
              maxHeight: '600px',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div
              style={{
                width: '100%',
                flex: 1,
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

