import React, { useState, useEffect, useRef } from 'react';
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


const ChooseTemplate = ({ user, initialCV, newAdminCV }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isAdminAccess, setIsAdminAccess] = useState(false);
  const [isLoadingCV, setIsLoadingCV] = useState(false);
  const [cvLoadedStatus, setCvLoadedStatus] = useState(null); // null, true (loaded), false (not found)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [mouseStart, setMouseStart] = useState(null);
  const [mouseEnd, setMouseEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasSetTemplateRef = useRef(false);
  const formRef = useRef();
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
    cv_references: [''],
    customSections: [],
    otherInformation: [
      { id: 1, labelType: 'radio', label: "Father's Name:", checked: true, value: '', name: 'parentSpouse', radioValue: 'father' },
      { id: 2, labelType: 'radio', label: "Husband's Name:", checked: false, value: '', name: 'parentSpouse', radioValue: 'husband' },
      { id: 3, labelType: 'checkbox', label: 'CNIC:', checked: true, value: '', isCustom: false },
      { id: 4, labelType: 'checkbox', label: 'Date of Birth:', checked: true, value: '', isCustom: false },
      { id: 5, labelType: 'checkbox', label: 'Marital Status:', checked: true, value: '', isCustom: false },
      { id: 6, labelType: 'checkbox', label: 'Religion:', checked: true, value: '', isCustom: false },
    ],
  });
  const [adminCVId, setAdminCVId] = useState(null);



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
    console.log('Back button clicked - setting selectedTemplate to null');
    setSelectedTemplate(null);
    // formData is preserved globally, not per template
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + templates.length) % templates.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % templates.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Swipe functions for carousel
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      prevSlide(); // Swipe left = previous slide (flow from right to left)
    }
    if (isRightSwipe) {
      nextSlide(); // Swipe right = next slide (flow from right to left)
    }
  };

  // Mouse drag functions for desktop
  const onMouseDown = (e) => {
    setIsDragging(true);
    setMouseEnd(null);
    setMouseStart(e.clientX);
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    setMouseEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging || !mouseStart || !mouseEnd) {
      setIsDragging(false);
      return;
    }
    
    const distance = mouseStart - mouseEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      prevSlide(); // Drag left = previous slide (flow from right to left)
    }
    if (isRightSwipe) {
      nextSlide(); // Drag right = next slide (flow from right to left)
    }
    
    setIsDragging(false);
  };

  // Auto-advance carousel every 5 seconds (flow from right to left)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev - 1 + templates.length) % templates.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [templates.length]);

  // Handle window resize for responsive template display
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFormDataChange = (data) => {
    setFormData(data);
  };

  const handleCVLoaded = (wasLoaded) => {
    setCvLoadedStatus(wasLoaded);
    setIsLoadingCV(false);
    
    // Show notification based on result
    if (wasLoaded) {
      // CV was loaded successfully
      setTimeout(() => {
        setCvLoadedStatus(null);
      }, 3000);
    } else {
      // No CV found
      setTimeout(() => {
        setCvLoadedStatus(null);
      }, 2000);
    }
  };

  const renderBackButton = () => {
    return (
      <button
        onClick={handleBack}
        className="cv-back-button"
        style={{
          marginBottom: '0',
          padding: '10px 20px',
          fontWeight: '600',
          backgroundColor: isAdminAccess ? '#22c55e' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          userSelect: 'none',
          alignSelf: 'flex-start',
          maxWidth: '160px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isAdminAccess ? '#16a34a' : '#217dbb')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isAdminAccess ? '#22c55e' : '#3498db')}
        type="button"
      >
        &larr; Back to Templates
      </button>
    );
  };

  // Check if this is admin access and handle automatic CV loading for regular users
  useEffect(() => {
    const adminAccess = localStorage.getItem('admin_cv_access');
    setIsAdminAccess(adminAccess === 'true');
    
    // If initialCV is provided (CV was selected from search), automatically set template
    if (initialCV) {
      console.log('CV selected from search - setting template to Template 1');
      setSelectedTemplate('Template 1');
      return;
    }
    
    if (adminAccess === 'true') {
      const adminSelectedCV = localStorage.getItem('admin_selected_cv');
      if (adminSelectedCV) {
        console.log('Admin access - setting template to Template 1');
        setSelectedTemplate('Template 1');
      }
    } else if (user && user.email && !user.isAdmin && !hasSetTemplateRef.current) {
      // Only set if not already set for this user session
      console.log('Regular user - setting template to Template 1 (first time)');
      hasSetTemplateRef.current = true;
      setIsLoadingCV(true);
      setSelectedTemplate('Template 1');
      setTimeout(() => {
        if (isLoadingCV) {
          setIsLoadingCV(false);
        }
      }, 3000);
    } else {
      console.log('useEffect - no action taken:', {
        user: user?.email,
        isAdmin: user?.isAdmin,
        hasSetTemplate: hasSetTemplateRef.current
      });
    }
  }, [user, isLoadingCV, initialCV]);

  // Reset the ref when user changes
  useEffect(() => {
    hasSetTemplateRef.current = false;
  }, [user?.email]);

  // Listen for back to templates event from admin panel
  useEffect(() => {
    const handleBackToTemplates = () => {
      setSelectedTemplate(null);
    };

    window.addEventListener('backToTemplates', handleBackToTemplates);
    
    return () => {
      window.removeEventListener('backToTemplates', handleBackToTemplates);
    };
  }, []);

  // UseEffect to set formData from initialCV if provided
  // Note: This is handled by the Form component, so we don't need to duplicate the logic here
  // The Form component will handle initialCV properly and update the formData through props.setFormData

  // Autosave every 10 seconds
  useEffect(() => {
    if (!selectedTemplate) return;
    const interval = setInterval(() => {
      if (formRef.current && formRef.current.handleSave) {
        formRef.current.handleSave();
        // Optionally show a toast or log
        // toast.info('Autosaved!');
        console.log('Autosave triggered');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedTemplate, formData]);

  if (selectedTemplate && TemplateComponentsMap[selectedTemplate]) {
    const PreviewComponent = TemplateComponentsMap[selectedTemplate];

    return (
      <div
        className="cv-editing-wrapper"
        style={{
          display: 'flex',
          padding: '20px 40px',
          flexDirection: 'column',
          minHeight: '100vh',
          boxSizing: 'border-box',
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#f4f6f8',
        }}
      >
        {/* Navigation Area with proper spacing for admin */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingTop: isAdminAccess ? '60px' : '0', // Add top padding for admin to avoid overlap
        }}>
          <div style={{ flex: 1 }}>
            {renderBackButton()}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1
              className="cv-editing-title"
              style={{
                fontSize: '48px',
                fontWeight: 700,
                margin: '0',
                color: '#111827',
                textAlign: 'center',
              }}
            >
              Editing {selectedTemplate}
            </h1>
          </div>
          <div style={{ flex: 1 }}></div> {/* Empty space for balance */}
        </div>
        <div
          className="cv-editing-container"
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'flex-start',
            gap: '60px',
          }}
        >
          <div
            className="cv-form-container"
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
              height: '120vh',
              overflowY: 'auto',
            }}
          >
            <Form
              key={initialCV ? `cv-${initialCV.id}` : 'new-cv'}
              ref={formRef}
              formData={formData}
              setFormData={setFormData}
              onChange={handleFormDataChange}
              user={user}
              isAdminAccess={isAdminAccess}
              onCVLoaded={handleCVLoaded}
              adminCVId={adminCVId}
              setAdminCVId={setAdminCVId}
              newAdminCV={newAdminCV}
              initialCV={initialCV}
            />
          </div>
          <div
            className="cv-preview-container"
            style={{
              flex: '0 0 auto',
              boxSizing: 'border-box',
              position: 'sticky',
              top: 30,
              alignSelf: 'flex-start',
              zIndex: 2,
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

  // Template selection screen with modern carousel
  return (
    <div
      style={{
        height: '100vh',
        padding: '20px',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f4f6f8',
        color: '#6b7280',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .carousel-container {
            animation: fadeIn 0.6s ease-out;
          }
          
          .template-card {
            transition: all 0.3s ease;
          }
          
          .template-card:hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
          }
          
          .carousel-nav-btn {
            transition: all 0.3s ease;
          }
          
          .carousel-nav-btn:hover {
            background-color: #2563eb !important;
            transform: scale(1.1);
          }
          
          .carousel-container {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          .template-card {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          .dot-indicator {
            transition: all 0.3s ease;
          }
          
          .dot-indicator:hover {
            background-color: #2563eb !important;
            transform: scale(1.2);
          }
          
          @media (max-width: 768px) {
            .carousel-container {
              padding: 0 10px;
            }
            
            .template-card {
              max-height: calc(100vh - 150px) !important;
            }
            
            .page-title {
              font-size: 1.8rem !important;
              text-align: center !important;
            }
          }
          
          @media (max-width: 480px) {
            .template-card {
              max-height: calc(100vh - 120px) !important;
            }
            
            .page-title {
              font-size: 1.5rem !important;
            }
          }
        `}
      </style>
      
      {/* Loading notification for regular users */}
      {isLoadingCV && user && !user.isAdmin && (
        <div
          className="notification"
          style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#1e40af',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #3b82f6',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          Loading your saved CV data...
        </div>
      )}

      {/* Success notification when CV is loaded */}
      {cvLoadedStatus === true && user && !user.isAdmin && (
        <div
          className="notification"
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#166534',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          <span style={{ fontSize: '20px' }}>✅</span>
          Your saved CV data has been loaded successfully!
        </div>
      )}

      {/* Info notification when no CV is found */}
      {cvLoadedStatus === false && user && !user.isAdmin && (
        <div
          className="notification"
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#92400e',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          <span style={{ fontSize: '20px' }}>ℹ️</span>
          No saved CV found. Start building your CV by selecting a template!
        </div>
      )}

      <div style={{ flexShrink: 0, marginBottom: '20px' }}>
        <h1
          className="page-title"
          style={{
            fontWeight: 700,
            fontSize: '2.5rem',
            marginBottom: '10px',
            color: '#111827',
            userSelect: 'none',
            textAlign: 'center',
            marginTop: '10px',
          }}
        >
          Choose Your CV Template
        </h1>
        
        <p
          style={{
            fontSize: '1rem',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '20px',
            maxWidth: '500px',
            margin: '0 auto 20px',
          }}
        >
          Select from our professional templates to create your perfect CV
        </p>


      </div>

      {/* Carousel Container */}
      <div className="carousel-container" style={{ 
        position: 'relative', 
        width: '100%',
        margin: '0 auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        
        {/* Main Template Display */}
        <div 
          style={{ 
            position: 'relative', 
            marginBottom: '20px',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            touchAction: 'pan-y pinch-zoom',
            userSelect: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="carousel-nav-btn"
            style={{
              position: 'absolute',
              left: windowWidth >= 768 ? '10px' : '-60px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
            }}
            aria-label="Previous template"
          >
            ‹
          </button>
          
          <button
            onClick={nextSlide}
            className="carousel-nav-btn"
            style={{
              position: 'absolute',
              right: windowWidth >= 768 ? '10px' : '-60px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
            }}
            aria-label="Next template"
          >
            ›
          </button>

          {/* Template Cards Container - Responsive Multi-Template Display */}
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '0 20px',
            transform: isDragging ? 'scale(0.98)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}>
            {/* Show multiple templates based on screen size */}
            {(() => {
              let templatesToShow = 1;
              
              if (windowWidth >= 1200) {
                templatesToShow = 3; // Desktop: 3 templates
              } else if (windowWidth >= 768) {
                templatesToShow = 2; // Tablet: 2 templates
              } else {
                templatesToShow = 1; // Mobile: 1 template
              }
              
              // Calculate which templates to show with current slide in center
              let startIndex, endIndex;
              
              if (templatesToShow === 3) {
                // For 3 templates: show previous, current, next
                startIndex = Math.max(0, currentSlide - 1);
                endIndex = Math.min(templates.length, currentSlide + 2);
                
                // Adjust if we're near the beginning or end
                if (currentSlide === 0) {
                  startIndex = 0;
                  endIndex = Math.min(3, templates.length);
                } else if (currentSlide === templates.length - 1) {
                  startIndex = Math.max(0, templates.length - 3);
                  endIndex = templates.length;
                }
              } else if (templatesToShow === 2) {
                // For 2 templates: show current and next, or previous and current
                if (currentSlide === templates.length - 1) {
                  startIndex = Math.max(0, currentSlide - 1);
                  endIndex = templates.length;
                } else {
                  startIndex = currentSlide;
                  endIndex = Math.min(templates.length, currentSlide + 2);
                }
              } else {
                // For 1 template: show only current
                startIndex = currentSlide;
                endIndex = currentSlide + 1;
              }
              
              return templates.slice(startIndex, endIndex).map((template, index) => {
                const actualIndex = startIndex + index;
                const isCurrentSlide = actualIndex === currentSlide;
                
                return (
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
                    className="template-card"
                    style={{
                      flex: templatesToShow === 1 ? '1' : `0 0 ${100 / templatesToShow - 5}%`,
                      maxWidth: templatesToShow === 1 ? '600px' : `${100 / templatesToShow - 5}%`,
                      height: '100%',
                      backgroundColor: '#fff',
                      border: isCurrentSlide ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                      borderRadius: '20px',
                      boxShadow: isCurrentSlide 
                        ? '0 20px 40px rgba(0,0,0,0.1)' 
                        : '0 8px 20px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: isCurrentSlide ? '20px' : '15px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      boxSizing: 'border-box',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      transform: isCurrentSlide ? 'scale(1)' : 'scale(0.9)',
                      opacity: isCurrentSlide ? 1 : 0.6,
                      zIndex: isCurrentSlide ? 10 : 1,
                      filter: isCurrentSlide ? 'none' : 'brightness(0.8)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentSlide) {
                        e.currentTarget.style.transform = 'scale(0.95)';
                        e.currentTarget.style.opacity = '0.8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentSlide) {
                        e.currentTarget.style.transform = 'scale(0.9)';
                        e.currentTarget.style.opacity = '0.6';
                      }
                    }}
                  >
                    {/* Template Image */}
                    <div
                      style={{
                        width: '100%',
                        flex: 1,
                        backgroundColor: '#f8fafc',
                        borderRadius: '15px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        minHeight: 0,
                      }}
                    >
                      <img
                        src={template.imageUrl}
                        alt={`${template.name} Preview`}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain', 
                          borderRadius: '15px' 
                        }}
                      />
                    </div>
                    
                    {/* Template Title and Button Container */}
                    <div style={{ flexShrink: 0, marginTop: '10px' }}>
                      <div
                        style={{
                          fontWeight: '700',
                          fontSize: isCurrentSlide ? '1.3rem' : '1.1rem',
                          color: isCurrentSlide ? '#1e40af' : '#6b7280',
                          marginBottom: '8px',
                          textAlign: 'center',
                        }}
                      >
                        {template.name}
                      </div>
                      
                      {/* Use Template Button */}
                      <button
                        style={{
                          padding: isCurrentSlide ? '10px 24px' : '8px 20px',
                          backgroundColor: isCurrentSlide ? '#3b82f6' : '#9ca3af',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          fontSize: isCurrentSlide ? '0.9rem' : '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (isCurrentSlide) {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isCurrentSlide) {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                          }
                        }}
                      >
                        {isCurrentSlide ? 'Use This Template' : 'Select Template'}
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Dot Indicators */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '15px',
            flexShrink: 0,
          }}
        >
          {templates.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="dot-indicator"
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: index === currentSlide ? '#3b82f6' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              aria-label={`Go to template ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default ChooseTemplate;
