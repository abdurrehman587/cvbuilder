import React, { useState, useEffect } from 'react';
import './App.css';
import { SupabaseProvider } from './components/Supabase';
import Login from './components/Login/Login';
import CVDashboard from './components/Dashboard/CVDashboard';
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
import ProductsPage from './components/Products/HomePage';
import Header from './components/Header/Header';
import MarketplaceAdmin from './components/MarketplaceAdmin/MarketplaceAdmin';
import ProductDetail from './components/Products/ProductDetail';
import Cart from './components/Cart/Cart';
import Checkout from './components/Checkout/Checkout';
import OrderDetails from './components/OrderDetails/OrderDetails';
import LeftNavbar from './components/Navbar/LeftNavbar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [currentView, setCurrentView] = useState('dashboard');
  // Initialize idCardView from localStorage if available, otherwise default to 'dashboard'
  const [idCardView, setIdCardView] = useState(() => {
    const savedView = localStorage.getItem('idCardView');
    return savedView === 'print' ? 'print' : 'dashboard';
  });
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
  const [hashKey, setHashKey] = useState(0); // Force re-render on hash change
  const [currentHash, setCurrentHash] = useState(window.location.hash); // Track current hash for routing

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
    console.log('handleMakeNewCV called - resetting products page flags and setting cv-builder view');
    // Reset products page flags to ensure CV builder can be shown
    setForceShowProductsPage(false);
    showProductsPageRef.current = false;
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    // Clear products page hash if present
    if (window.location.hash === '#products') {
      window.location.hash = '';
    }
    
    // Set selected product to cv-builder
    localStorage.setItem('selectedApp', 'cv-builder');
    
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
    // Always set template to template1 for new CV (ensure it's set before setting currentView)
    setSelectedTemplate('template1');
    // Set currentView to cv-builder - this should trigger the form/preview to show
    setCurrentView('cv-builder');
    console.log('handleMakeNewCV - currentView set to cv-builder, selectedTemplate set to template1');
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

    // Clear navigation flags on mount (after reload completes)
    // This ensures that if the page was reloaded (not closed), we don't logout
    sessionStorage.removeItem('isNavigating');
    sessionStorage.removeItem('isReloading');
    
    checkAuth();

    // Listen for auth state changes (handles OAuth callbacks)
    const authStateSubscription = authService.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        localStorage.setItem('cvBuilderAuth', 'true');
        
        // Check if this is an OAuth callback (Google login)
        const isOAuthCallback = window.location.hash.includes('access_token') || 
                                window.location.hash.includes('code') ||
                                window.location.search.includes('code');
        
        if (isOAuthCallback) {
          // Clear OAuth hash/query from URL
          if (window.location.hash.includes('access_token') || window.location.hash.includes('code')) {
            window.location.hash = '';
          }
          if (window.location.search.includes('code')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          // For Google OAuth login, redirect to homepage (products page)
          // Clear any navigation flags to ensure user lands on homepage
          sessionStorage.removeItem('navigateToCVBuilder');
          localStorage.removeItem('navigateToCVBuilder');
          sessionStorage.removeItem('navigateToIDCardPrint');
          localStorage.removeItem('navigateToIDCardPrint');
          
          // Set homepage flags
          localStorage.setItem('selectedApp', 'marketplace');
          localStorage.setItem('showProductsPage', 'true');
          sessionStorage.setItem('showProductsPage', 'true');
          setForceShowProductsPage(true);
          showProductsPageRef.current = true;
          
          // Navigate to products page
          if (window.location.hash !== '#products') {
            window.location.hash = '#products';
          }
        }
        
        // Trigger auth event for other components
        window.dispatchEvent(new CustomEvent('userAuthenticated'));
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        localStorage.removeItem('cvBuilderAuth');
      }
    });
    
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
      // Update current hash state to trigger re-render
      setCurrentHash(window.location.hash);
      
      // Force re-render when hash changes
      setHashKey(prev => prev + 1);
      
      if (window.location.hash === '#products') {
        // Hash changed to #products - ensure flags are set
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        setForceShowProductsPage(true);
        showProductsPageRef.current = true;
      } else if (window.location.hash === '#admin') {
        // Hash changed to #admin - clear products page flags
        setForceShowProductsPage(false);
        showProductsPageRef.current = false;
        localStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('showProductsPage');
      } else if (window.location.hash !== '#products' && (forceShowProductsPage || showProductsPageRef.current)) {
        // Hash changed away from #products - clear products page state
        setForceShowProductsPage(false);
        showProductsPageRef.current = false;
        localStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('showProductsPage');
      }
    };
    
    // Check hash on mount
    setCurrentHash(window.location.hash);
    
    // Check hash on mount to handle page reloads
    if (window.location.hash === '#products') {
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      setForceShowProductsPage(true);
      showProductsPageRef.current = true;
    }

    // Listen for authentication events from Login component
    window.addEventListener('userAuthenticated', handleAuth);
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle page unload (tab/window close) - logout user
    // Use multiple events to reliably detect tab/window close
    let isNavigating = false;
    
    // Detect navigation (reload, link click, etc.) to prevent logout
    const handleNavigation = () => {
      isNavigating = true;
      // Set a flag that will be checked in unload handlers
      sessionStorage.setItem('isNavigating', 'true');
    };
    
    // Listen for navigation events
    window.addEventListener('click', (e) => {
      // Check if click is on a link or button that causes navigation
      const target = e.target.closest('a, button');
      if (target && (target.tagName === 'A' || target.onclick || target.getAttribute('href'))) {
        handleNavigation();
      }
    }, true);
    
    // Detect reload (F5, Ctrl+R, etc.)
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'F5') || (e.ctrlKey && e.key === 'r') || (e.ctrlKey && e.key === 'R')) {
        handleNavigation();
      }
    });
    
    // Handle beforeunload - fires when tab/window is closing
    const handleBeforeUnload = (e) => {
      const isNav = sessionStorage.getItem('isNavigating') === 'true';
      const isReloading = sessionStorage.getItem('isReloading') === 'true';
      const hasNavigationFlags = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                  sessionStorage.getItem('navigateToIDCardPrint') === 'true' ||
                                  localStorage.getItem('navigateToCVBuilder') === 'true' ||
                                  localStorage.getItem('navigateToIDCardPrint') === 'true';
      
      // Only logout if user is authenticated AND it's not a navigation/reload
      // Don't logout if there are navigation flags set (user is navigating within the app)
      if (!isNav && !isReloading && !hasNavigationFlags && (isAuthenticated || localStorage.getItem('cvBuilderAuth') === 'true')) {
        // Clear authentication state immediately (synchronous)
        localStorage.removeItem('cvBuilderAuth');
        localStorage.removeItem('selectedApp');
        sessionStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('navigateToCVBuilder');
        sessionStorage.removeItem('navigateToIDCardPrint');
        localStorage.removeItem('navigateToIDCardPrint');
        
        // Attempt logout (may not complete if page closes quickly, but state is cleared)
        authService.signOut().catch(() => {
          // Ignore errors during unload - state is already cleared
        });
      } else {
        // If it's a navigation, clear the flag for next time
        sessionStorage.removeItem('isNavigating');
      }
    };
    
    // Handle pagehide event (more reliable than beforeunload for mobile)
    const handlePageHide = (e) => {
      const isNav = sessionStorage.getItem('isNavigating') === 'true';
      const isReloading = sessionStorage.getItem('isReloading') === 'true';
      const hasNavigationFlags = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                  sessionStorage.getItem('navigateToIDCardPrint') === 'true' ||
                                  localStorage.getItem('navigateToCVBuilder') === 'true' ||
                                  localStorage.getItem('navigateToIDCardPrint') === 'true';
      
      // pagehide.persisted is true when page is cached (not closed)
      // If persisted is false, the page is being unloaded (closed)
      // Don't logout if there are navigation flags set (user is navigating within the app)
      if (!e.persisted && !isNav && !isReloading && !hasNavigationFlags && (isAuthenticated || localStorage.getItem('cvBuilderAuth') === 'true')) {
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
      } else if (isNav || isReloading) {
        // Clear navigation flags
        sessionStorage.removeItem('isNavigating');
        sessionStorage.removeItem('isReloading');
      }
    };
    
    // Note: Removed visibilitychange handler - it was causing logout on tab switches
    // Only beforeunload and pagehide are used to detect tab/window closes
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('userAuthenticated', handleAuth);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      delete window.navigateToDashboard;
      // Cleanup auth state change subscription
      if (authStateSubscription && authStateSubscription.data && authStateSubscription.data.subscription) {
        authStateSubscription.data.subscription.unsubscribe();
      }
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

  // Handle authentication from Login component
  const handleAuth = () => {
    setIsAuthenticated(true);
    setIsLoading(false);
    // Get selected app from localStorage
    const app = localStorage.getItem('selectedApp') || 'cv-builder';
    setSelectedApp(app);
    
    // Check if user is on products page (check hash and flags)
    const isOnProductsPage = window.location.hash === '#products' || 
                              localStorage.getItem('showProductsPage') === 'true' ||
                              sessionStorage.getItem('showProductsPage') === 'true';
    
    // Check if user wants to navigate to ID Card Print dashboard after login (check FIRST)
    const navigateToIDCardPrint = sessionStorage.getItem('navigateToIDCardPrint') === 'true' || 
                                   localStorage.getItem('navigateToIDCardPrint') === 'true';
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
      const navigateToCVBuilder = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                   localStorage.getItem('navigateToCVBuilder') === 'true';
      if (navigateToCVBuilder) {
        // Don't remove the flag here - let PRIORITY 0 routing check handle it
        setCurrentView('dashboard');
        // Clear products page flags to allow navigation
        setForceShowProductsPage(false);
        showProductsPageRef.current = false;
        localStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('showProductsPage');
        console.log('handleAuth: CV Builder flag detected, setting currentView to dashboard');
      } else if (isOnProductsPage) {
        // User is on products page and logged in - keep them on products page
        // Ensure products page flags are set
        setForceShowProductsPage(true);
        showProductsPageRef.current = true;
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        if (window.location.hash !== '#products') {
          window.location.hash = '#products';
        }
        console.log('handleAuth: User on products page, keeping them on products page');
      } else if (currentView === 'cv-builder') {
        // If user was on form/preview page, redirect to dashboard after login
        setCurrentView('dashboard');
      }
    }
  };

  // Helper function to wrap content with navbar
  const wrapWithNavbar = (content) => {
    return (
      <>
        <LeftNavbar isAuthenticated={isAuthenticated} />
        <div className="app-content-with-navbar">
          {content}
        </div>
      </>
    );
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setCurrentView('cv-builder');
    // Don't reset form data - preserve it when switching templates
  };

  const handleBackToDashboard = () => {
    console.log('handleBackToDashboard called - navigating to CV dashboard');
    // Clear any products page flags
    setForceShowProductsPage(false);
    showProductsPageRef.current = false;
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    // Clear products page hash if present
    if (window.location.hash === '#products') {
      window.location.hash = '';
    }
    // Ensure selectedApp is set to cv-builder
    localStorage.setItem('selectedApp', 'cv-builder');
    // Navigate to dashboard
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
  
  // Check if user wants to see admin panel
  const showAdminPanel = window.location.hash === '#admin' && isAuthenticated && !isLoading;
  
  // Check if user wants to see product detail page
  const productDetailMatch = window.location.hash.match(/^#product\/([a-f0-9-]+)$/i);
  const productDetailId = productDetailMatch ? productDetailMatch[1] : null;

  // Check if user wants to see cart
  const showCart = currentHash === '#cart';
  const showCheckout = currentHash === '#checkout';
  const showOrderDetails = currentHash.startsWith('#order-details');

  // Simple check: Show products page if URL hash is #products
  const showProductsPageHash = currentHash === '#products';

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
      // Save to localStorage to persist through page reloads
      localStorage.setItem('idCardView', view);
    };
    return () => {
      delete window.resetProductsPageFlag;
      delete window.forceShowProductsPage;
      delete window.setIdCardView;
    };
  }, []);

  // Simple routing: Use localStorage.selectedApp to determine which dashboard to show
  // Initialize selectedApp from localStorage on mount
  useEffect(() => {
    const savedApp = localStorage.getItem('selectedApp');
    if (savedApp) {
      setSelectedApp(savedApp);
    }
  }, []);
  
  // Keep forceShowProductsPage true once set - don't reset it automatically
  // It will only be reset when user explicitly navigates to a product via Header buttons
  // This ensures products page stays visible and doesn't redirect

  // PRIORITY -1: Check if user wants to see product detail page (HIGHEST PRIORITY)
  if (productDetailId) {
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
          onLogout={handleLogout}
          showProductsOnHeader={true}
        />
        <ProductDetail productId={productDetailId} />
      </>
    );
  }

  // PRIORITY -1: Check if user wants to see cart (HIGHEST PRIORITY)
  if (showCart) {
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
          onLogout={handleLogout}
          showProductsOnHeader={true}
        />
        <Cart />
      </>
    );
  }

  if (showCheckout) {
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
          onLogout={handleLogout}
          showProductsOnHeader={true}
        />
        <Checkout />
      </>
    );
  }

  if (showOrderDetails) {
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
          onLogout={handleLogout}
          showProductsOnHeader={true}
        />
        <OrderDetails />
      </>
    );
  }

  // PRIORITY -1: Check if user wants to see admin panel (HIGHEST PRIORITY)
  if (showAdminPanel) {
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
          onLogout={handleLogout}
          currentProduct={currentProduct}
        />
        <MarketplaceAdmin />
      </>
    );
  }

  // Simple routing based on selectedApp from localStorage
  // Check URL hash first for marketplace pages, then check selectedApp for dashboards
  
  // Get current selectedApp from localStorage - default to 'marketplace' for homepage
  const currentSelectedApp = localStorage.getItem('selectedApp') || 'marketplace';
  
  // PRIORITY: Check if we should show CV Builder form/preview FIRST
  // This ensures that when currentView is 'cv-builder', we show the form instead of dashboard
  if (currentView === 'cv-builder' && isAuthenticated && !isLoading) {
    const selectedProduct = localStorage.getItem('selectedApp');
    if (selectedProduct !== 'id-card-print') {
      console.log('Rendering CV Builder form/preview - currentView is cv-builder');
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

      return wrapWithNavbar(
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
                  onClick={() => handleTemplateSwitch('template1')}
                  className={selectedTemplate === 'template1' ? 'active' : ''}
                >
                  Template 1
                </button>
                <button
                  onClick={() => handleTemplateSwitch('template2')}
                  className={selectedTemplate === 'template2' ? 'active' : ''}
                >
                  Template 2
                </button>
                <button
                  onClick={() => handleTemplateSwitch('template3')}
                  className={selectedTemplate === 'template3' ? 'active' : ''}
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
                  }`} style={{ visibility: 'visible', opacity: 1 }}>
                    {hookAutoSaveStatus}
                  </div>
                ) : hookHasUnsavedChanges ? (
                  <div className="status-indicator warning" style={{ visibility: 'visible', opacity: 1 }}>
                    Unsaved Changes
                  </div>
                ) : (
                  <div className="status-indicator success" style={{ visibility: 'visible', opacity: 1 }}>
                    Saved
                  </div>
                )}
              </div>
              <button 
                onClick={handleBackToDashboard} 
                className="back-to-dashboard-button"
                style={{ visibility: 'visible', opacity: 1, display: 'block' }}
              >
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
  }
  
  // If user is not authenticated and trying to access a dashboard, show login
  if (!isAuthenticated && !isLoading && (currentSelectedApp === 'cv-builder' || currentSelectedApp === 'id-card-print')) {
    return wrapWithNavbar(
      <Login onAuth={handleAuth} />
    );
  }
  
  // Route to ID Card Printer Dashboard
  if (isAuthenticated && !isLoading && currentSelectedApp === 'id-card-print') {
    // Ensure idCardView is set correctly
    const savedIdCardView = localStorage.getItem('idCardView');
    if (idCardView === 'print' || savedIdCardView === 'print') {
      return wrapWithNavbar(
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
      // Show ID Card Dashboard
      return wrapWithNavbar(
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

  // Route to CV Builder Dashboard
  if (isAuthenticated && !isLoading && currentSelectedApp === 'cv-builder') {
    // Check if user wants to go directly to CV form (when template is selected and goToCVForm flag is set)
    const goToCVForm = sessionStorage.getItem('goToCVForm') === 'true' || localStorage.getItem('goToCVForm') === 'true';
    const selectedTemplateFromStorage = localStorage.getItem('selectedTemplate');
    
    // If template is selected and goToCVForm flag is set, go directly to CV form
    if (goToCVForm && selectedTemplateFromStorage) {
      setSelectedTemplate(selectedTemplateFromStorage);
      setCurrentView('cv-builder');
      
      // Render CV form directly
      const renderFormAndPreview = () => {
        switch (selectedTemplateFromStorage) {
          case 'template1':
            return (
              <>
                <Form1 formData={formData} updateFormData={updateFormData} />
                <Preview1 formData={formData} />
              </>
            );
          case 'template2':
            return (
              <>
                <Form2 formData={formData} updateFormData={updateFormData} />
                <Preview2 formData={formData} />
              </>
            );
          case 'template3':
            return (
              <>
                <Form3 formData={formData} updateFormData={updateFormData} />
                <Preview3 formData={formData} />
              </>
            );
          default:
            return (
              <>
                <Form1 formData={formData} updateFormData={updateFormData} />
                <Preview1 formData={formData} />
              </>
            );
        }
      };
      
      return wrapWithNavbar(
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
                  className={`template-button ${selectedTemplateFromStorage === 'template1' ? 'active' : ''}`}
                  onClick={() => handleTemplateSelect('template1')}
                >
                  Template 1
                </button>
                <button
                  className={`template-button ${selectedTemplateFromStorage === 'template2' ? 'active' : ''}`}
                  onClick={() => handleTemplateSelect('template2')}
                >
                  Template 2
                </button>
                <button
                  className={`template-button ${selectedTemplateFromStorage === 'template3' ? 'active' : ''}`}
                  onClick={() => handleTemplateSelect('template3')}
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
    
    // Show CV Dashboard (when clicking template, it should go here)
    // Don't clear flags here - let useEffect handle it after navigation completes
    return (
      <>
        <Header 
          isAuthenticated={true} 
          onLogout={handleLogout}
          currentProduct="cv-builder"
        />
        <CVDashboard 
          onTemplateSelect={handleTemplateSelect}
          onLogout={handleLogout}
          onEditCV={handleEditCV}
          onCreateNewCV={handleMakeNewCV}
        />
      </>
    );
  }
  
  // Simple products page check: Show if URL hash indicates marketplace page
  const shouldShowProductsPage = showProductsPageHash || currentHash === '#products';
  
  // PRIORITY 1.5: Check if we should show CV Builder form/preview BEFORE products page
  // This ensures that when currentView is 'cv-builder', we show the form instead of products page
  // ABSOLUTE PRIORITY: If currentView is 'cv-builder', show it regardless of products page flags
  if (currentView === 'cv-builder' && isAuthenticated && !isLoading) {
    const selectedProduct = localStorage.getItem('selectedApp');
    if (selectedProduct !== 'id-card-print') {
      console.log('Rendering CV Builder form/preview - currentView is cv-builder');
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

      console.log('Rendering CV Builder with header - currentView:', currentView, 'selectedTemplate:', selectedTemplate);

      return (
        <>
          <Header 
            isAuthenticated={true} 
            onLogout={handleLogout}
            currentProduct="cv-builder"
          />
          <div className="app-header-cv" style={{ 
            display: 'flex', 
            visibility: 'visible', 
            opacity: 1, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '24px 20px 12px 20px', 
            position: 'fixed',
            top: 'var(--header-height, 80px)',
            left: 0,
            right: 0,
            zIndex: 999,
            width: '100%',
            minHeight: '80px',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: 0
          }}>
            <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 700 }}>CV Builder</h1>
            <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="template-selector" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className={`template-button ${selectedTemplate === 'template1' ? 'active' : ''}`}
                  onClick={() => handleTemplateSwitch('template1')}
                  style={{ visibility: 'visible', opacity: 1 }}
                >
                  Template 1
                </button>
                <button
                  className={`template-button ${selectedTemplate === 'template2' ? 'active' : ''}`}
                  onClick={() => handleTemplateSwitch('template2')}
                  style={{ visibility: 'visible', opacity: 1 }}
                >
                  Template 2
                </button>
                <button
                  className={`template-button ${selectedTemplate === 'template3' ? 'active' : ''}`}
                  onClick={() => handleTemplateSwitch('template3')}
                  style={{ visibility: 'visible', opacity: 1 }}
                >
                  Template 3
                </button>
              </div>
              <div className="auto-save-status" style={{ display: 'flex', alignItems: 'center', visibility: 'visible' }}>
                {hookAutoSaveStatus ? (
                  <div className={`status-indicator ${
                    hookAutoSaveStatus.includes('saved') || hookAutoSaveStatus.includes('Saved') || hookAutoSaveStatus === 'Ready' ? 'success' : 
                    hookAutoSaveStatus.includes('Saving') || hookAutoSaveStatus.includes('saving') ? 'warning' : 
                    'error'
                  }`} style={{ visibility: 'visible', opacity: 1 }}>
                    {hookAutoSaveStatus}
                  </div>
                ) : hookHasUnsavedChanges ? (
                  <div className="status-indicator warning" style={{ visibility: 'visible', opacity: 1 }}>
                    Unsaved Changes
                  </div>
                ) : (
                  <div className="status-indicator success" style={{ visibility: 'visible', opacity: 1 }}>
                    Saved
                  </div>
                )}
              </div>
              <button 
                onClick={handleBackToDashboard} 
                className="back-to-dashboard-button"
                style={{ visibility: 'visible', opacity: 1, display: 'block' }}
              >
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
  }
  
  // Show products page if URL hash indicates marketplace
  if (shouldShowProductsPage) {
    return wrapWithNavbar(
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
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return wrapWithNavbar(
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

  // If user is not authenticated, show homepage (ProductsPage) instead of login
  // Only show login if they're trying to access a dashboard
  if (!isAuthenticated && !isLoading) {
    // If trying to access a dashboard, show login
    if (currentSelectedApp === 'cv-builder' || currentSelectedApp === 'id-card-print') {
      return wrapWithNavbar(
        <Login onAuth={handleAuth} />
      );
    }
    // Otherwise, show homepage (ProductsPage)
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={false} 
          currentProduct="products"
          showProductsOnHeader={true}
        />
        <ProductsPage />
      </>
    );
  }
  
  // For authenticated users, default to CV Builder Dashboard if no specific route
  if (currentSelectedApp === 'cv-builder' || !currentSelectedApp || currentSelectedApp === 'marketplace') {
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={true} 
          onLogout={handleLogout}
          currentProduct="cv-builder"
        />
        <CVDashboard 
          onTemplateSelect={handleTemplateSelect}
          onLogout={handleLogout}
          onEditCV={handleEditCV}
          onCreateNewCV={handleMakeNewCV}
        />
      </>
    );
  }
  
  // Final fallback: Show homepage
  return wrapWithNavbar(
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

// Wrap the entire app with SupabaseProvider
function AppWithSupabase() {
  return (
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  );
}

export default AppWithSupabase;