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
import IDCardDashboard from './components/IDCardDashboard/IDCardDashboard';
import ProductsPage from './components/Products/ProductsPage';
import Header from './components/Header/Header';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [currentView, setCurrentView] = useState('dashboard');
  const [idCardView, setIdCardView] = useState('dashboard'); // 'dashboard' or 'print'
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
    // Set default template if none is selected
    if (!selectedTemplate || selectedTemplate === 'dashboard') {
      setSelectedTemplate('template1');
    }
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

    // Clear isReloading flag on mount (after reload completes)
    // This ensures that if the page was reloaded (not closed), we don't logout
    sessionStorage.removeItem('isReloading');
    
    checkAuth();
    
    // Check selected app on mount
    const app = localStorage.getItem('selectedApp') || 'cv-builder';
    setSelectedApp(app);
    
    // DON'T remove navigateToCVBuilder flag here - let the PRIORITY 0 routing check handle it
    // The flag will be removed after routing decision is made

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
      
      // Check if user wants to navigate to ID Card Print dashboard after login (check FIRST)
      const navigateToIDCardPrint = sessionStorage.getItem('navigateToIDCardPrint') === 'true';
      if (navigateToIDCardPrint) {
        // Don't remove the flag here - let PRIORITY 0 routing check handle it
        // Clear products page flags to allow navigation
        setForceShowProductsPage(false);
        showProductsPageRef.current = false;
        localStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('showProductsPage');
        // Set idCardView to dashboard
        setIdCardView('dashboard');
        // DO NOT set currentView to 'dashboard' - this would trigger CV Builder routing
        console.log('handleAuth: ID Card Print flag detected, setting idCardView to dashboard');
      }
      // Check if user wants to navigate to CV Builder dashboard after login
      else {
        const navigateToCVBuilder = sessionStorage.getItem('navigateToCVBuilder') === 'true';
        if (navigateToCVBuilder) {
          // Don't remove the flag here - let PRIORITY 0 routing check handle it
          setCurrentView('dashboard');
          // Clear products page flags to allow navigation
          setForceShowProductsPage(false);
          showProductsPageRef.current = false;
          localStorage.removeItem('showProductsPage');
          sessionStorage.removeItem('showProductsPage');
          console.log('handleAuth: CV Builder flag detected, setting currentView to dashboard');
        } else if (currentView === 'cv-builder') {
          // If user was on form/preview page, redirect to dashboard after login
          setCurrentView('dashboard');
        }
      }
    };

    window.addEventListener('userAuthenticated', handleAuth);
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle page unload (tab/window close) - logout user
    // Only logout on actual close, not on page reload
    const handleBeforeUnload = (e) => {
      // Check if this is a reload (navigation) or actual close
      // If it's a reload, the performance.navigation.type will be 1 (reload)
      // But we can't access that in beforeunload, so we use a flag
      const isReload = sessionStorage.getItem('isReloading') === 'true';
      
      // Only logout if user is authenticated AND it's not a reload
      if (!isReload && (isAuthenticated || localStorage.getItem('cvBuilderAuth') === 'true')) {
        // Clear authentication state immediately (synchronous)
        localStorage.removeItem('cvBuilderAuth');
        localStorage.removeItem('selectedApp');
        sessionStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('navigateToCVBuilder');
        sessionStorage.removeItem('navigateToIDCardPrint');
        localStorage.removeItem('navigateToIDCardPrint');
        
        // Attempt async logout (may not complete if page closes quickly)
        // Use a flag to indicate logout is in progress
        sessionStorage.setItem('logoutOnClose', 'true');
        
        // Try to sign out (non-blocking)
        authService.signOut().catch(() => {
          // Ignore errors during unload - state is already cleared
        });
      } else {
        // If it's a reload, DON'T clear navigation flags - they're needed for routing after reload
        // The isReloading flag will be cleared on mount
      }
    };
    
    // Also handle pagehide event (more reliable than beforeunload)
    const handlePageHide = (e) => {
      // Check if this is a reload or actual close
      const isReload = sessionStorage.getItem('isReloading') === 'true';
      
      // Only logout if it's not a reload
      if (!isReload && (isAuthenticated || localStorage.getItem('cvBuilderAuth') === 'true')) {
        // Clear authentication state
        localStorage.removeItem('cvBuilderAuth');
        localStorage.removeItem('selectedApp');
        sessionStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('navigateToCVBuilder');
        sessionStorage.removeItem('navigateToIDCardPrint');
        localStorage.removeItem('navigateToIDCardPrint');
        
        // Attempt logout
        authService.signOut().catch(() => {
          // Ignore errors
        });
      } else {
        // If it's a reload, DON'T clear navigation flags - they're needed for routing after reload
        // The isReloading flag will be cleared on mount
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('userAuthenticated', handleAuth);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      delete window.navigateToDashboard;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Include isAuthenticated to have current value

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
  // IMPORTANT: Move state updates to useEffect to prevent infinite loops
  useEffect(() => {
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
  }, [showProductsPageLocal, showProductsPageSession, showProductsPageHash, showProductsPageFlag, forceShowProductsPage, isAuthenticated]);

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
    // Expose function to set ID Card view (for Header to call)
    window.setIdCardView = (view) => {
      setIdCardView(view);
    };
    return () => {
      delete window.resetProductsPageFlag;
      delete window.forceShowProductsPage;
      delete window.setIdCardView;
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
  
  // Handle navigateToCVBuilder flag - must be before any conditional returns
  const navigateToCVBuilderFlagRaw = sessionStorage.getItem('navigateToCVBuilder');
  const navigateToCVBuilderFlag = navigateToCVBuilderFlagRaw === 'true';
  
  // Handle navigateToIDCardPrint flag - must be before any conditional returns
  // Check both sessionStorage and localStorage (localStorage as backup)
  const navigateToIDCardPrintFlagRaw = sessionStorage.getItem('navigateToIDCardPrint') || localStorage.getItem('navigateToIDCardPrint');
  const navigateToIDCardPrintFlag = navigateToIDCardPrintFlagRaw === 'true';
  
  // Debug: Always log the flag values
  console.log('=== Navigation flags check ===', {
    navigateToCVBuilderFlag: {
      raw: navigateToCVBuilderFlagRaw,
      isTrue: navigateToCVBuilderFlag
    },
    navigateToIDCardPrintFlag: {
      raw: navigateToIDCardPrintFlagRaw,
      isTrue: navigateToIDCardPrintFlag
    },
    isAuthenticated,
    isLoading,
    willCheckIDCard: navigateToIDCardPrintFlag && isAuthenticated && !isLoading,
    willCheckCV: navigateToCVBuilderFlag && isAuthenticated && !isLoading
  });
  
  if (navigateToCVBuilderFlag) {
    console.log('✓ navigateToCVBuilderFlag is TRUE - should navigate to CV Dashboard');
  }
  if (navigateToIDCardPrintFlag) {
    console.log('✓ navigateToIDCardPrintFlag is TRUE - should navigate to ID Card Dashboard');
  }
  useEffect(() => {
    if (navigateToCVBuilderFlag && isAuthenticated && !isLoading) {
      // Clear products page flags to allow navigation to CV Builder
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      // Set current view to dashboard
      setCurrentView('dashboard');
      // Remove hash if present
      if (window.location.hash === '#products') {
        window.location.hash = '';
      }
      // Don't clear the flag immediately - let it persist for routing check
      // It will be cleared after routing completes
    }
    if (navigateToIDCardPrintFlag && isAuthenticated && !isLoading) {
      // Clear products page flags to allow navigation to ID Card Print
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      // Remove hash if present
      if (window.location.hash === '#products') {
        window.location.hash = '';
      }
      // Don't clear the flag immediately - let it persist for routing check
      // It will be cleared after routing completes
    }
  }, [navigateToCVBuilderFlag, navigateToIDCardPrintFlag, isAuthenticated, isLoading]);
  
  // Keep forceShowProductsPage true once set - don't reset it automatically
  // It will only be reset when user explicitly navigates to a product via Header buttons
  // This ensures products page stays visible and doesn't redirect

  // PRIORITY 0: Check if user wants to navigate to ID Card Print - MUST be checked FIRST
  // This takes absolute priority over products page and CV Builder
  console.log('Checking ID Card Print flag:', {
    navigateToIDCardPrintFlag,
    raw: navigateToIDCardPrintFlagRaw,
    isAuthenticated,
    isLoading,
    idCardView,
    willTrigger: navigateToIDCardPrintFlag && isAuthenticated && !isLoading
  });
  if (navigateToIDCardPrintFlag && isAuthenticated && !isLoading) {
    console.log('PRIORITY 0: Navigating to ID Card - navigateToIDCardPrintFlag detected', {
      navigateToIDCardPrintFlag,
      raw: navigateToIDCardPrintFlagRaw,
      isAuthenticated,
      isLoading,
      idCardView,
      forceShowProductsPage,
      showProductsPageRef: showProductsPageRef.current
    });
    
    // Clear the navigateToIDCardPrint flag after routing decision is made
    sessionStorage.removeItem('navigateToIDCardPrint');
    localStorage.removeItem('navigateToIDCardPrint');
    // Also clear products page flags to ensure clean navigation
    setForceShowProductsPage(false);
    showProductsPageRef.current = false;
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    if (window.location.hash === '#products') {
      window.location.hash = '';
    }
    
    // Check if user wants to go directly to print page or dashboard
    if (idCardView === 'print') {
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
    } else {
      // Show ID Card Dashboard (default)
      return (
        <>
          <Header 
            isAuthenticated={true} 
            onLogout={handleLogout}
            currentProduct="id-card-print"
          />
          <IDCardDashboard 
            onCreateNewIDCard={() => {
              // Navigate to ID Card Print page
              setIdCardView('print');
            }}
          />
        </>
      );
    }
  }
  
  // PRIORITY 0: Check if user wants to navigate to CV Builder - MUST be checked FIRST
  // This takes absolute priority over products page
  if (navigateToCVBuilderFlag && isAuthenticated && !isLoading) {
    console.log('PRIORITY 0: Navigating to CV Builder Dashboard - navigateToCVBuilderFlag detected', {
      navigateToCVBuilderFlag,
      isAuthenticated,
      isLoading,
      forceShowProductsPage,
      showProductsPageRef: showProductsPageRef.current
    });
    
    // Clear the navigateToCVBuilder flag after routing decision is made
    sessionStorage.removeItem('navigateToCVBuilder');
    // Also clear products page flags to ensure clean navigation
    setForceShowProductsPage(false);
    showProductsPageRef.current = false;
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    if (window.location.hash === '#products') {
      window.location.hash = '';
    }
    
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
  
  // PRIORITY 1: Show products page if flag is set (regardless of auth status)
  // OR if user is not authenticated (default behavior for unauthenticated users)
  // OR if ref/state indicates we should show products page (persists through re-renders)
  const shouldShowProductsPage = showProductsPageFlag || showProductsPageRef.current || forceShowProductsPage || !isAuthenticated;
  
  // Debug logging for routing decision - ALWAYS log navigateToCVBuilderFlag
  console.log('Routing decision:', {
      shouldShowProductsPage,
      showProductsPageFlag,
      refValue: showProductsPageRef.current,
      forceShowProductsPage,
      isAuthenticated,
      isLoading,
      navigateToCVBuilderFlag: navigateToCVBuilderFlag,
      navigateToCVBuilderFlagValue: sessionStorage.getItem('navigateToCVBuilder'),
      selectedApp: localStorage.getItem('selectedApp')
    });
  
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
          currentProduct="products"
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
  if (selectedProduct === 'id-card-print' && !forceShowProductsPage && !showProductsPageRef.current && !navigateToIDCardPrintFlag) {
    // Check if user wants to go to ID Card Print page directly or dashboard
    if (idCardView === 'print') {
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
    } else {
      // Show ID Card Dashboard (default view)
      return (
        <>
          <Header 
            isAuthenticated={true} 
            onLogout={handleLogout}
            currentProduct="id-card-print"
          />
          <IDCardDashboard 
            onCreateNewIDCard={() => {
              setIdCardView('print');
            }}
          />
        </>
      );
    }
  }

  // Check if user wants to go to ID Card Print (when authenticated and selectedApp is id-card-print)
  // This should take priority over CV Builder if user explicitly clicked ID Card Print button
  // This handles the case when user is already on ID Card Dashboard and clicks "Create New ID Card"
  const wantsIDCardPrint = isAuthenticated && selectedProduct === 'id-card-print' && !forceShowProductsPage && !showProductsPageRef.current;
  if (wantsIDCardPrint && idCardView === 'print') {
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
  
  // Also check if user is on ID Card Dashboard (when authenticated and selectedApp is id-card-print)
  if (wantsIDCardPrint && idCardView === 'dashboard') {
    return (
      <>
        <Header 
          isAuthenticated={true} 
          onLogout={handleLogout}
          currentProduct="id-card-print"
        />
        <IDCardDashboard 
          onCreateNewIDCard={() => {
            setIdCardView('print');
          }}
        />
      </>
    );
  }
  
  // Check if user wants to go to CV Builder (when authenticated and selectedApp is cv-builder)
  // This should take priority over products page if user explicitly clicked CV Builder button
  // BUT NOT if user wants ID Card Print
  const wantsCVBuilder = isAuthenticated && selectedProduct === 'cv-builder' && !forceShowProductsPage && !showProductsPageRef.current && !navigateToCVBuilderFlag && !navigateToIDCardPrintFlag;
  
  // Render Form and Preview when currentView is 'cv-builder'
  if (currentView === 'cv-builder' && isAuthenticated && !forceShowProductsPage && !showProductsPageRef.current && !isLoading && selectedProduct !== 'id-card-print') {
    const renderFormAndPreview = () => {
      switch (selectedTemplate) {
        case 'template1':
          return (
            <>
              <Form1 
                key={formResetKey}
                formData={formData}
                updateFormData={updateFormData}
                markAsChanged={hookMarkAsChanged}
              />
              <Preview1 
                formData={formData}
                autoSaveStatus={hookAutoSaveStatus}
                hasUnsavedChanges={hookHasUnsavedChanges}
              />
            </>
          );
        case 'template2':
          return (
            <>
              <Form2 
                key={formResetKey}
                formData={formData}
                updateFormData={updateFormData}
                markAsChanged={hookMarkAsChanged}
              />
              <Preview2 
                formData={formData}
                autoSaveStatus={hookAutoSaveStatus}
                hasUnsavedChanges={hookHasUnsavedChanges}
              />
            </>
          );
        case 'template3':
          return (
            <>
              <Form3 
                key={formResetKey}
                formData={formData}
                updateFormData={updateFormData}
                markAsChanged={hookMarkAsChanged}
              />
              <Preview3 
                formData={formData}
                autoSaveStatus={hookAutoSaveStatus}
                hasUnsavedChanges={hookHasUnsavedChanges}
              />
            </>
          );
        default:
          return (
            <>
              <Form1 
                key={formResetKey}
                formData={formData}
                updateFormData={updateFormData}
                markAsChanged={hookMarkAsChanged}
              />
              <Preview1 
                formData={formData}
                autoSaveStatus={hookAutoSaveStatus}
                hasUnsavedChanges={hookHasUnsavedChanges}
              />
            </>
          );
      }
    };

    return (
      <>
        <Header 
          isAuthenticated={true} 
          onLogout={handleLogout}
          currentProduct="cv-builder"
        />
        <div className="app-header-cv">
          <h1>CV Builder</h1>
          <div className="header-actions">
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
            <div className="auto-save-status">
              {hookAutoSaveStatus ? (
                <div className={`status-indicator ${
                  hookAutoSaveStatus.includes('saved') || hookAutoSaveStatus.includes('Saved') || hookAutoSaveStatus === 'Ready' ? 'success' : 
                  hookAutoSaveStatus.includes('Saving') || hookAutoSaveStatus.includes('saving') ? 'warning' : 
                  'error'
                }`}>
                  {hookAutoSaveStatus}
                </div>
              ) : hookHasUnsavedChanges ? (
                <div className="status-indicator warning">
                  Unsaved Changes
                </div>
              ) : (
                <div className="status-indicator success">
                  Saved
                </div>
              )}
            </div>
            <button onClick={handleBackToDashboard} className="back-to-dashboard-button">
              Back to Dashboard
            </button>
          </div>
        </div>
        <div className="container">
          {renderFormAndPreview()}
        </div>
      </>
    );
  }

  // Default to CV Builder dashboard
  // BUT only if we're not forcing products page to show
  // AND only if user doesn't want ID Card Print
  // AND only if navigateToIDCardPrintFlag is not set (already checked in PRIORITY 0)
  if ((currentView === 'dashboard' || wantsCVBuilder) && !forceShowProductsPage && !showProductsPageRef.current && !isLoading && !navigateToIDCardPrintFlag && selectedProduct !== 'id-card-print') {
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