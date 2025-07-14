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
  const [isHovering, setIsHovering] = useState(false);

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
    setCurrentSlide((prev) => (prev + 1) % templates.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + templates.length) % templates.length);
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
      nextSlide(); // Swipe left = next slide (Template 1 → 2 → 3...)
    }
    if (isRightSwipe) {
      prevSlide(); // Swipe right = previous slide (Template 10 → 9 → 8...)
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
      nextSlide(); // Drag left = next slide (Template 1 → 2 → 3...)
    }
    if (isRightSwipe) {
      prevSlide(); // Drag right = previous slide (Template 10 → 9 → 8...)
    }
    
    setIsDragging(false);
  };

  // Auto-advance carousel every 5 seconds (Template 1 → 2 → 3...)
  useEffect(() => {
    if (isHovering) return; // Pause auto-advance when hovering
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % templates.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [templates.length, isHovering]);

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

  // Template selection screen with modern design
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      backgroundColor: '#ffffff',
      color: '#374151',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        {/* Floating geometric shapes */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '140px',
          height: '140px',
          background: 'linear-gradient(135deg, #667eea30, #764ba230, #f093fb30)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
          filter: 'blur(1px)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '8%',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #764ba235, #667eea35, #f093fb25)',
          borderRadius: '25px',
          transform: 'rotate(45deg)',
          animation: 'float 8s ease-in-out infinite reverse',
          filter: 'blur(1px)',
          boxShadow: '0 8px 32px rgba(118, 75, 162, 0.2)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #667eea25, #764ba225, #f093fb20)',
          borderRadius: '35px',
          transform: 'rotate(-15deg)',
          animation: 'float 7s ease-in-out infinite',
          filter: 'blur(1px)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '12%',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #764ba230, #667eea30, #f093fb25)',
          borderRadius: '50%',
          animation: 'float 9s ease-in-out infinite reverse',
          filter: 'blur(1px)',
          boxShadow: '0 8px 32px rgba(118, 75, 162, 0.2)',
        }} />
        
        {/* Additional decorative elements */}
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '2%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #f093fb25, #667eea25)',
          borderRadius: '15px',
          transform: 'rotate(30deg)',
          animation: 'float 10s ease-in-out infinite',
          filter: 'blur(1px)',
        }} />
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '3%',
          width: '70px',
          height: '70px',
          background: 'linear-gradient(135deg, #667eea20, #f093fb20)',
          borderRadius: '20px',
          transform: 'rotate(-60deg)',
          animation: 'float 11s ease-in-out infinite reverse',
          filter: 'blur(1px)',
        }} />
        
        {/* Enhanced grid pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(102, 126, 234, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.6,
        }} />
        
        {/* Enhanced gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '-150px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, rgba(240, 147, 251, 0.1) 30%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          animation: 'pulse 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '-200px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.12) 0%, rgba(102, 126, 234, 0.08) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 10s ease-in-out infinite reverse',
        }} />
        
        {/* Additional ambient orbs */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '-80px',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(240, 147, 251, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(35px)',
          animation: 'pulse 12s ease-in-out infinite',
        }} />
      </div>
      {/* Modern Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: windowWidth >= 768 ? '30px 40px' : '20px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        {/* Header background patterns */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
        }} />
        
        {/* Enhanced header decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
        
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '50%',
          animation: 'float 5s ease-in-out infinite',
          filter: 'blur(1px)',
          boxShadow: '0 8px 32px rgba(255,255,255,0.2)',
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '15%',
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '25px',
          transform: 'rotate(45deg)',
          animation: 'float 7s ease-in-out infinite reverse',
          filter: 'blur(1px)',
          boxShadow: '0 8px 32px rgba(255,255,255,0.15)',
        }} />
        
        {/* Additional header elements */}
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '8%',
          width: '60px',
          height: '60px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '15px',
          transform: 'rotate(-30deg)',
          animation: 'float 6s ease-in-out infinite',
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '30%',
          right: '5%',
          width: '90px',
          height: '90px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: windowWidth >= 768 ? '3.5rem' : '2.5rem',
            fontWeight: 700,
            margin: '0 0 16px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            Choose Your CV Template
          </h1>

          

        </div>
      </div>

      {/* Notifications Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: windowWidth >= 768 ? '24px 40px' : '16px 20px',
      }}>
        {/* Loading notification */}
        {isLoadingCV && user && !user.isAdmin && (
          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #3b82f6',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#1e40af',
            fontSize: '16px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #3b82f6',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Loading your saved CV data...
          </div>
        )}

        {/* Success notification */}
        {cvLoadedStatus === true && user && !user.isAdmin && (
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #22c55e',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#166534',
            fontSize: '16px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)',
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            Your saved CV data has been loaded successfully!
          </div>
        )}

        {/* Info notification */}
        {cvLoadedStatus === false && user && !user.isAdmin && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#92400e',
            fontSize: '16px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)',
          }}>
            <span style={{ fontSize: '24px' }}>ℹ️</span>
            No saved CV found. Start building your CV by selecting a template!
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: windowWidth >= 768 ? '0 40px 60px' : '0 20px 40px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Featured Templates Section */}
        <div style={{
          marginBottom: windowWidth >= 768 ? '80px' : '60px',
        }}>
          
          {/* Carousel Container */}
          <div className="carousel-container" style={{ 
            position: 'relative', 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: windowWidth >= 1200 ? '700px' : windowWidth >= 768 ? '600px' : '400px',
            maxHeight: windowWidth >= 1200 ? '1000px' : windowWidth >= 768 ? '800px' : '600px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '24px',
            padding: windowWidth >= 768 ? '40px' : '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            {/* Enhanced carousel decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '250px',
              height: '250px',
              background: 'radial-gradient(circle, rgba(102, 126, 234, 0.12) 0%, rgba(240, 147, 251, 0.08) 40%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(35px)',
              animation: 'pulse 6s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '-15%',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.06) 50%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(30px)',
              animation: 'pulse 8s ease-in-out infinite reverse',
            }} />
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '5%',
              width: '6px',
              height: '80px',
              background: 'linear-gradient(to bottom, transparent, rgba(102, 126, 234, 0.4), rgba(240, 147, 251, 0.3), transparent)',
              borderRadius: '3px',
              animation: 'pulse 3s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '30%',
              right: '8%',
              width: '6px',
              height: '60px',
              background: 'linear-gradient(to bottom, transparent, rgba(118, 75, 162, 0.4), rgba(102, 126, 234, 0.3), transparent)',
              borderRadius: '3px',
              animation: 'pulse 4s ease-in-out infinite reverse',
            }} />
            
            {/* Additional carousel elements */}
            <div style={{
              position: 'absolute',
              top: '60%',
              left: '8%',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(240, 147, 251, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(20px)',
              animation: 'float 9s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              top: '10%',
              right: '15%',
              width: '4px',
              height: '40px',
              background: 'linear-gradient(to bottom, transparent, rgba(240, 147, 251, 0.3), transparent)',
              borderRadius: '2px',
              animation: 'pulse 5s ease-in-out infinite',
            }} />
            
            {/* Main Template Display */}
            <div 
              style={{ 
                position: 'relative', 
                marginBottom: '20px',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: windowWidth >= 1200 ? '650px' : windowWidth >= 768 ? '550px' : '350px',
                maxHeight: windowWidth >= 1200 ? '950px' : windowWidth >= 768 ? '750px' : '550px',
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
                  backgroundColor: '#667eea',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
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
                  backgroundColor: '#667eea',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                aria-label="Next template"
              >
                ›
              </button>

              {/* Template Cards Container */}
              <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                minHeight: windowWidth >= 1200 ? '650px' : windowWidth >= 768 ? '550px' : '350px',
                maxHeight: windowWidth >= 1200 ? '950px' : windowWidth >= 768 ? '750px' : '550px',
                padding: '0 20px',
                transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                transition: 'transform 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Show templates with slide animation */}
                {(() => {
                  // Show all templates but position them based on their relationship to current slide
                  return templates.map((template, index) => {
                    const actualIndex = index;
                    const isCurrentSlide = actualIndex === currentSlide;
                    const isNextSlide = actualIndex === (currentSlide + 1) % templates.length;
                    const isPrevSlide = actualIndex === (currentSlide - 1 + templates.length) % templates.length;
                    
                    // Calculate animation states
                    let transform = 'translateX(0)';
                    let opacity = 1;
                    let zIndex = 1;
                    
                    if (isCurrentSlide) {
                      transform = 'translateX(0)';
                      opacity = 1;
                      zIndex = 10;
                    } else if (isNextSlide) {
                      transform = 'translateX(100%)';
                      opacity = 0.3;
                      zIndex = 5;
                    } else if (isPrevSlide) {
                      transform = 'translateX(-100%)';
                      opacity = 0.3;
                      zIndex = 5;
                    } else {
                      transform = 'translateX(200%)';
                      opacity = 0;
                      zIndex = 1;
                    }
                    
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
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) ${transform}`,
                          width: windowWidth >= 1200 ? '800px' : windowWidth >= 768 ? '700px' : '400px',
                          maxWidth: windowWidth >= 1200 ? '800px' : windowWidth >= 768 ? '700px' : '400px',
                          minWidth: windowWidth >= 1200 ? '600px' : windowWidth >= 768 ? '500px' : '300px',
                          height: '100%',
                          minHeight: windowWidth >= 1200 ? '650px' : windowWidth >= 768 ? '550px' : '350px',
                          maxHeight: windowWidth >= 1200 ? '950px' : windowWidth >= 768 ? '750px' : '550px',
                          backgroundColor: '#fff',
                          border: isCurrentSlide ? '3px solid #667eea' : '2px solid #e2e8f0',
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
                          overflow: 'hidden',
                          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: opacity,
                          zIndex: zIndex,
                          filter: isCurrentSlide ? 'none' : 'brightness(0.8)',
                        }}
                        onMouseEnter={(e) => {
                          setIsHovering(true);
                          if (isCurrentSlide) {
                            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          setIsHovering(false);
                          if (isCurrentSlide) {
                            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
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
                            minHeight: windowWidth >= 768 ? '350px' : '250px',
                            maxHeight: windowWidth >= 1200 ? '650px' : windowWidth >= 768 ? '550px' : '450px',
                            aspectRatio: '0.707', // A4 aspect ratio (210mm/297mm)
                          }}
                        >
                          <img
                            src={template.imageUrl}
                            alt={`${template.name} Preview`}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain', 
                              borderRadius: '15px',
                              padding: '10px',
                            }}
                          />
                        </div>
                        
                        {/* Template Title and Button Container */}
                        <div style={{ flexShrink: 0, marginTop: '10px' }}>
                          <div
                            style={{
                              fontWeight: '700',
                              fontSize: isCurrentSlide ? '1.3rem' : '1.1rem',
                              color: isCurrentSlide ? '#667eea' : '#6b7280',
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
                              backgroundColor: isCurrentSlide ? '#667eea' : '#9ca3af',
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
                                e.currentTarget.style.backgroundColor = '#5a67d8';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isCurrentSlide) {
                                e.currentTarget.style.backgroundColor = '#667eea';
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
                    backgroundColor: index === currentSlide ? '#667eea' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  aria-label={`Go to template ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* All Templates Grid Section */}
        <div style={{
          marginTop: windowWidth >= 768 ? '80px' : '60px',
          padding: windowWidth >= 768 ? '40px' : '24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Enhanced grid section decorative elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.12) 0%, rgba(240, 147, 251, 0.08) 40%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(25px)',
            animation: 'pulse 7s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '15%',
            left: '8%',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.06) 50%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(20px)',
            animation: 'pulse 9s ease-in-out infinite reverse',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '2%',
            width: '4px',
            height: '100px',
            background: 'linear-gradient(to bottom, transparent, rgba(102, 126, 234, 0.3), rgba(240, 147, 251, 0.2), transparent)',
            borderRadius: '2px',
            animation: 'pulse 4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '3%',
            width: '4px',
            height: '70px',
            background: 'linear-gradient(to bottom, transparent, rgba(118, 75, 162, 0.3), rgba(102, 126, 234, 0.2), transparent)',
            borderRadius: '2px',
            animation: 'pulse 5s ease-in-out infinite reverse',
          }} />
          
          {/* Additional grid elements */}
          <div style={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, rgba(240, 147, 251, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(15px)',
            animation: 'float 10s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '40%',
            left: '15%',
            width: '5px',
            height: '40px',
            background: 'linear-gradient(to bottom, transparent, rgba(240, 147, 251, 0.25), transparent)',
            borderRadius: '3px',
            animation: 'pulse 6s ease-in-out infinite',
          }} />
          <h2 style={{
            textAlign: 'center',
            fontSize: windowWidth >= 768 ? '2.5rem' : '2rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: windowWidth >= 768 ? '16px' : '12px',
            position: 'relative',
          }}>
            All Templates
            <div style={{
              width: '60px',
              height: '4px',
              backgroundColor: '#667eea',
              margin: '16px auto 0',
              borderRadius: '2px',
            }} />
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: windowWidth >= 768 ? '1.1rem' : '1rem',
            color: '#6b7280',
            marginBottom: windowWidth >= 768 ? '40px' : '32px',
            maxWidth: '600px',
            margin: '0 auto 40px',
          }}>
            Browse all available templates in A4 format
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth >= 1200 ? 'repeat(auto-fit, minmax(210px, 1fr))' :
                               windowWidth >= 768 ? 'repeat(auto-fit, minmax(180px, 1fr))' :
                               windowWidth >= 480 ? 'repeat(auto-fit, minmax(150px, 1fr))' :
                               'repeat(auto-fit, minmax(120px, 1fr))',
            gap: windowWidth >= 768 ? '30px' : windowWidth >= 480 ? '20px' : '15px',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: windowWidth >= 768 ? '0 20px' : '0 10px',
          }}>
            {templates.map((template, index) => (
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
                  width: windowWidth >= 1200 ? '210mm' : 
                         windowWidth >= 768 ? '180mm' : 
                         windowWidth >= 480 ? '150mm' : '120mm',
                  height: windowWidth >= 1200 ? '297mm' : 
                          windowWidth >= 768 ? '254mm' : 
                          windowWidth >= 480 ? '212mm' : '170mm',
                  maxWidth: '100%',
                  maxHeight: windowWidth >= 768 ? '400px' : 
                             windowWidth >= 480 ? '300px' : '250px',
                  backgroundColor: '#fff',
                  border: '2px solid #e2e8f0',
                  borderRadius: windowWidth >= 768 ? '8px' : '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  boxSizing: 'border-box',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  margin: '0 auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
              >
                {/* A4 Template Preview */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                }}>
                  <img
                    src={template.imageUrl}
                    alt={`${template.name} A4 Preview`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      padding: '10px',
                    }}
                  />
                  
                  {/* Template Overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: windowWidth >= 768 ? '20px' : windowWidth >= 480 ? '15px' : '10px',
                    color: 'white',
                  }}>
                    <div style={{
                      fontWeight: '700',
                      fontSize: windowWidth >= 768 ? '1.1rem' : windowWidth >= 480 ? '1rem' : '0.9rem',
                      marginBottom: windowWidth >= 768 ? '8px' : '6px',
                    }}>
                      {template.name}
                    </div>
                    <button
                      style={{
                        padding: windowWidth >= 768 ? '8px 16px' : windowWidth >= 480 ? '6px 12px' : '4px 8px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: windowWidth >= 768 ? '6px' : '4px',
                        fontSize: windowWidth >= 768 ? '0.85rem' : windowWidth >= 480 ? '0.8rem' : '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#5a67d8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#667eea';
                      }}
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) rotate(2deg);
          }
          50% {
            transform: translateY(-25px) rotate(0deg);
          }
          75% {
            transform: translateY(-15px) rotate(-2deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.25;
            transform: scale(1.08);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
          }
          50% {
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ChooseTemplate;
