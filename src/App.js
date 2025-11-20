import React, { useState, useEffect } from 'react';
import './App.css';
import { SupabaseProvider, AdminPanel } from './components/Supabase';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Form1 from './components/template1/Form1';
import Preview1 from './components/template1/Preview1';
import Form2 from './components/template2/Form2';
import Preview2 from './components/template2/Preview2';
import Form3 from './components/template3/Form3';
import Preview3 from './components/template3/Preview3';
import useAutoSave from './components/Supabase/useAutoSave';
import { authService } from './components/Supabase/supabase';
import IDCardPrintPage from './components/IDCardPrint/IDCardPrintPage';
import ProductsPage from './components/Products/ProductsPage';
import Header from './components/Header/Header';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedApp, setSelectedApp] = useState('cv-builder'); // 'cv-builder' or 'id-card-print'
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    professionalSummary: '',
    education: [],
    experience: [],
    skills: ['Communication Skills', 'Time Management', 'Problem Solving', 'Hardworking'],
    certifications: [],
    languages: [],
    hobbies: [],
    references: []
  });
  // Local state for UI (will be overridden by hook)
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const showProductsPageRef = React.useRef(false);
  const [forceShowProductsPage, setForceShowProductsPage] = useState(false);

  // Use the useAutoSave hook for Supabase integration
  const { 
    autoSaveStatus: hookAutoSaveStatus, 
    hasUnsavedChanges: hookHasUnsavedChanges, 
    currentCVId,
    loadCV,
    createNewCV,
    markAsChanged: hookMarkAsChanged
  } = useAutoSave(formData);

  // Debug: Log hook status
  console.log('App.js - Hook status:', { 
    hookAutoSaveStatus, 
    hookHasUnsavedChanges, 
    currentCVId,
    formDataName: formData.name 
  });


  // Load saved draft on component mount
  // Removed localStorage loading - form data will reset on page reload

  // Removed localStorage saving on page unload - form data will reset on page reload

  // Auto-save happens automatically every 10 seconds

  // Mark as changed - using hook's markAsChanged instead

  // Update form data
  const updateFormData = (newData) => {
    setFormData(newData);
    hookMarkAsChanged(); // Use hook's markAsChanged instead of local state
  };

  // Handle "Make a new CV" button
  const handleMakeNewCV = () => {
    console.log('handleMakeNewCV called - resetting products page flags');
    // Reset products page flags to ensure CV builder can be shown
    setForceShowProductsPage(false);
    showProductsPageRef.current = false;
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    
    const newFormData = {
      name: '',
      position: '',
      phone: '',
      email: '',
      address: '',
      professionalSummary: '',
      education: [],
      experience: [],
      skills: ['Communication Skills', 'Time Management', 'Problem Solving', 'Hardworking'],
      certifications: [],
      languages: [],
      hobbies: [],
      references: []
    };
    setFormData(newFormData);
    setHasUnsavedChanges(false);
    setAutoSaveStatus('');
    setFormResetKey(prev => prev + 1); // Force form re-render
    createNewCV(); // Reset the hook state
    setCurrentView('cv-builder'); // Ensure we're in the CV builder view
  };

  useEffect(() => {
    // Check authentication status on mount only
    const checkAuth = async () => {
      try {
        // First check localStorage flag as a quick check
        const localAuth = localStorage.getItem('cvBuilderAuth') === 'true';
        
        // Then verify with Supabase
        const user = await authService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          // Ensure localStorage flag is set
          localStorage.setItem('cvBuilderAuth', 'true');
        } else {
          setIsAuthenticated(false);
          // Clear localStorage flag if no user
          if (localAuth) {
            localStorage.removeItem('cvBuilderAuth');
          }
        }
      } catch (error) {
        console.log('Error checking auth:', error);
        // If there's an error but localStorage says authenticated, keep it temporarily
        const localAuth = localStorage.getItem('cvBuilderAuth') === 'true';
        setIsAuthenticated(localAuth);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Check selected app on mount
    const app = localStorage.getItem('selectedApp') || 'cv-builder';
    setSelectedApp(app);
    
    // Check if we need to navigate to CV Builder dashboard
    const navigateToCVBuilder = sessionStorage.getItem('navigateToCVBuilder') === 'true';
    if (navigateToCVBuilder) {
      sessionStorage.removeItem('navigateToCVBuilder');
      setCurrentView('dashboard');
    }

    // Expose function to navigate to dashboard from ProductsPage
    window.navigateToDashboard = () => {
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      setCurrentView('dashboard');
    };

    // Listen for hash changes to handle products page navigation
    const handleHashChange = () => {
      if (window.location.hash === '#products') {
        // Hash changed to #products - ensure flags are set
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        setForceShowProductsPage(true);
        showProductsPageRef.current = true;
      } else if (window.location.hash !== '#products' && (forceShowProductsPage || showProductsPageRef.current)) {
        // Hash changed away from #products - clear products page state
        setForceShowProductsPage(false);
        showProductsPageRef.current = false;
        localStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('showProductsPage');
      }
    };
    
    // Check hash on mount to handle page reloads
    if (window.location.hash === '#products') {
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      setForceShowProductsPage(true);
      showProductsPageRef.current = true;
    }

    // Listen for authentication events from Login component
    const handleAuth = () => {
      setIsAuthenticated(true);
      setIsLoading(false);
      // Get selected app from localStorage
      const app = localStorage.getItem('selectedApp') || 'cv-builder';
      setSelectedApp(app);
      // If user was on form/preview page, redirect to dashboard after login
      if (currentView === 'cv-builder') {
        setCurrentView('dashboard');
      }
    };

    window.addEventListener('userAuthenticated', handleAuth);
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('userAuthenticated', handleAuth);
      window.removeEventListener('hashchange', handleHashChange);
      delete window.navigateToDashboard;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not on currentView changes - intentionally excluded to prevent logout on view change

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('cvBuilderAuth');
      setIsAuthenticated(false);
      setIsLoading(false);
      // Reset to dashboard view so when user logs back in, they go to dashboard
      setCurrentView('dashboard');
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setCurrentView('cv-builder');
    // Don't reset form data - preserve it when switching templates
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Handle template switching without resetting form data
  const handleTemplateSwitch = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handleEditCV = async (cv) => {
    console.log('App.js - CV selected for editing:', cv);
    // Load the CV data and switch to CV builder view
    if (cv && cv.id) {
      try {
        // Use the loadCV function from the hook to properly set currentCVId
        const loadedFormData = await loadCV(cv.id);
        if (loadedFormData) {
          setFormData(loadedFormData);
          setCurrentView('cv-builder');
          setSelectedTemplate(cv.template_id || 'template1');
          console.log('CV loaded for editing, currentCVId should be set in hook');
        } else {
          console.error('Failed to load CV data for ID:', cv.id);
          alert('Failed to load CV data. Please try again.');
        }
      } catch (error) {
        console.error('Error loading CV for editing:', error);
        alert('An error occurred while loading the CV. Please try again.');
      }
    }
  };

  // Get current product for header
  const currentProduct = localStorage.getItem('selectedApp') || 'cv-builder';
  
  // Check if user wants to see products page (for both authenticated and unauthenticated users)
  // Check this FIRST, before ANY other routing logic, to ensure it takes absolute priority
  // Check multiple sources: localStorage, sessionStorage, and URL hash
  // IMPORTANT: Read flags BEFORE clearing them
  const showProductsPageLocal = localStorage.getItem('showProductsPage') === 'true';
  const showProductsPageSession = sessionStorage.getItem('showProductsPage') === 'true';
  const showProductsPageHash = window.location.hash === '#products';
  const showProductsPageFlag = showProductsPageLocal || showProductsPageSession || showProductsPageHash;
  
  // Use ref and state to persist the decision through re-renders
  // IMPORTANT: Set these IMMEDIATELY when flags are detected, before any other logic
  if (showProductsPageFlag) {
    // Set ref immediately (synchronous)
    showProductsPageRef.current = true;
    // Set state if not already set (this will trigger a re-render)
    if (!forceShowProductsPage) {
      setForceShowProductsPage(true);
    }
  } else {
    // Only clear if we're sure we shouldn't show products page
    // Don't clear if we're already showing it (to prevent flickering)
    if (!showProductsPageFlag && !forceShowProductsPage && showProductsPageRef.current) {
      // Only clear if hash is also not set
      if (window.location.hash !== '#products') {
        showProductsPageRef.current = false;
      }
    }
  }

  // Debug logging (remove in production)
  if (showProductsPageFlag) {
    console.log('Products page flag detected:', {
      local: showProductsPageLocal,
      session: showProductsPageSession,
      hash: showProductsPageHash,
      isAuthenticated,
      refValue: showProductsPageRef.current
    });
  }

  // Expose function to reset products page flag (for Header to call)
  // MUST be called before ANY conditional returns (React Hooks rule)
  useEffect(() => {
    window.resetProductsPageFlag = () => {
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
    };
    // Expose function to force show products page (for Header to call)
    window.forceShowProductsPage = () => {
      setForceShowProductsPage(true);
      showProductsPageRef.current = true;
    };
    return () => {
      delete window.resetProductsPageFlag;
      delete window.forceShowProductsPage;
    };
  }, []);

  // Keep products page state persistent - don't clear flags/hash when on products page
  // This ensures page reloads keep user on products page
  useEffect(() => {
    // If we're showing products page, ensure hash is set for reload persistence
    if (forceShowProductsPage || showProductsPageRef.current) {
      // Ensure hash is set so reload works
      if (window.location.hash !== '#products') {
        window.location.hash = '#products';
      }
      // Set flags to ensure they persist
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      
      if (showProductsPageFlag && isAuthenticated) {
        setCurrentView('products');
      }
    }
  }, [showProductsPageLocal, showProductsPageSession, showProductsPageHash, showProductsPageFlag, isAuthenticated, forceShowProductsPage]);
  
  // Keep forceShowProductsPage true once set - don't reset it automatically
  // It will only be reset when user explicitly navigates to a product via Header buttons
  // This ensures products page stays visible and doesn't redirect

  // PRIORITY 0: If user explicitly wants CV Builder (currentView is 'cv-builder'), show it
  // This takes absolute priority over products page - check BEFORE products page
  if (currentView === 'cv-builder' && isAuthenticated) {
    // User explicitly wants CV Builder - show it immediately
    // Reset products page flags to ensure CV builder shows
    if (forceShowProductsPage || showProductsPageRef.current) {
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
    }
    
    return (
      <>
        <Header 
          isAuthenticated={true} 
          onLogout={handleLogout}
          currentProduct="cv-builder"
        />
        <div className="App">
          <div className="app-header-cv">
            <h1>CV Builder</h1>
            
            <div className="template-selector">
              <button 
                className={`template-button ${selectedTemplate === 'template1' ? 'active' : ''}`}
                onClick={() => handleTemplateSwitch('template1')}
              >
                Template 1
              </button>
              <button 
                className={`template-button ${selectedTemplate === 'template2' ? 'active' : ''}`}
                onClick={() => handleTemplateSwitch('template2')}
              >
                Template 2
              </button>
              <button 
                className={`template-button ${selectedTemplate === 'template3' ? 'active' : ''}`}
                onClick={() => handleTemplateSwitch('template3')}
              >
                Template 3
              </button>
            </div>
            
            <div className="header-actions">
              <div className="auto-save-status">
                {hookAutoSaveStatus && (
                  <span className={`status-indicator ${hookAutoSaveStatus.includes('failed') ? 'error' : 'success'}`}>
                    {hookAutoSaveStatus}
                  </span>
                )}
                {hookHasUnsavedChanges && !hookAutoSaveStatus && (
                  <span className="status-indicator warning">
                    Unsaved changes
                  </span>
                )}
                {!hookAutoSaveStatus && !hookHasUnsavedChanges && (
                  <span className="status-indicator success">
                    All changes saved
                  </span>
                )}
              </div>
              <button onClick={handleBackToDashboard} className="back-to-dashboard-button">
                Back to Dashboard
              </button>
            </div>
          </div>
        <div className="container">
          {/* Form Side */}
          {selectedTemplate === 'template1' ? 
            <Form1 
              key={formResetKey}
              formData={formData}
              updateFormData={updateFormData}
              markAsChanged={hookMarkAsChanged}
            /> : 
            selectedTemplate === 'template2' ?
            <Form2 
              key={formResetKey}
              formData={formData}
              updateFormData={updateFormData}
              markAsChanged={hookMarkAsChanged}
            /> :
            <Form3 
              key={formResetKey}
              formData={formData}
              updateFormData={updateFormData}
              markAsChanged={hookMarkAsChanged}
            />
          }

          {/* Preview Side */}
          {selectedTemplate === 'template1' ? 
            <Preview1 
              formData={formData}
              autoSaveStatus={autoSaveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
            /> : 
            selectedTemplate === 'template2' ?
            <Preview2 
              formData={formData}
              autoSaveStatus={autoSaveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
            /> :
            <Preview3 
              formData={formData}
              autoSaveStatus={autoSaveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          }
        </div>
      </div>
      </>
    );
  }

  // PRIORITY 1: Show products page if flag is set (regardless of auth status)
  // OR if user is not authenticated (default behavior for unauthenticated users)
  // OR if ref/state indicates we should show products page (persists through re-renders)
  // This check MUST happen BEFORE loading checks to ensure it takes absolute priority
  const shouldShowProductsPage = showProductsPageFlag || showProductsPageRef.current || forceShowProductsPage || !isAuthenticated;
  
  // Debug logging for routing decision
  if (showProductsPageFlag) {
    console.log('Routing decision:', {
      shouldShowProductsPage,
      showProductsPageFlag,
      refValue: showProductsPageRef.current,
      isAuthenticated,
      isLoading
    });
  }
  
  // If products page flag is set, show products page IMMEDIATELY, even during loading
  if (shouldShowProductsPage) {
    // Show products page (which includes login form for unauthenticated users)
    const selectedProduct = localStorage.getItem('selectedApp');
    
    console.log('Rendering ProductsPage - shouldShowProductsPage is true');
    
    // IMPORTANT: Return immediately - don't let any other logic interfere
    return (
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
          currentProduct={selectedProduct}
          showProductsOnHeader={true}
          onLogout={isAuthenticated ? handleLogout : undefined}
        />
        <ProductsPage />
      </>
    );
  }

  // Show loading screen while checking authentication (only if not showing products page)
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Checking authentication...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Clear any remaining flags if we're not showing products page
  if (showProductsPageLocal) {
    localStorage.removeItem('showProductsPage');
    localStorage.removeItem('showProductsPageTimestamp');
  }
  if (showProductsPageSession) {
    sessionStorage.removeItem('showProductsPage');
  }

  // After login, check if a product was selected from products page
  // BUT only if we're not forcing products page to show
  const selectedProduct = localStorage.getItem('selectedApp');
  if (selectedProduct === 'id-card-print' && !forceShowProductsPage && !showProductsPageRef.current) {
    return (
      <>
        <Header 
          isAuthenticated={true} 
          onLogout={handleLogout}
          currentProduct="id-card-print"
        />
        <IDCardPrintPage />
      </>
    );
  }

  // Check if user wants to go to CV Builder (when authenticated and selectedApp is cv-builder)
  // This should take priority over products page if user explicitly clicked CV Builder button
  const wantsCVBuilder = isAuthenticated && selectedProduct === 'cv-builder' && !forceShowProductsPage && !showProductsPageRef.current;
  
  // Default to CV Builder dashboard
  // BUT only if we're not forcing products page to show
  if ((currentView === 'dashboard' || wantsCVBuilder) && !forceShowProductsPage && !showProductsPageRef.current) {
    return (
      <>
        <Header 
          isAuthenticated={true} 
          onLogout={handleLogout}
          currentProduct="cv-builder"
        />
        <Dashboard 
          onTemplateSelect={handleTemplateSelect}
          onLogout={handleLogout}
          onEditCV={handleEditCV}
          onCreateNewCV={handleMakeNewCV}
        />
      </>
    );
  }

  if (currentView === 'admin') {
    return <AdminPanel />;
  }


  return null;
}

// Wrap the entire app with SupabaseProvider
function AppWithSupabase() {
  return (
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  );
}

export default AppWithSupabase;