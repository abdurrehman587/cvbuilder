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
import Form4 from './components/template4/Form4';
import Preview4 from './components/template4/Preview4';
import useAutoSave from './components/Supabase/useAutoSave';
import { authService, supabase } from './components/Supabase/supabase';
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
  const [selectedApp, setSelectedApp] = useState(() => {
    // Default to marketplace (homepage) on initial load
    const savedApp = localStorage.getItem('selectedApp');
    const hash = window.location.hash;
    if (!hash && !savedApp) {
      return 'marketplace';
    }
    return savedApp || 'marketplace';
  }); // 'marketplace', 'cv-builder', or 'id-card-print'
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
    // Clear navigation flags on mount (after reload completes)
    // This ensures that if the page was reloaded (not closed), we don't logout
    sessionStorage.removeItem('isNavigating');
    sessionStorage.removeItem('isReloading');
    
    // Get initial session from Supabase (this is the source of truth)
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.log('Error getting initial session:', error);
          setIsAuthenticated(false);
          localStorage.removeItem('cvBuilderAuth');
        } else if (session?.user) {
          setIsAuthenticated(true);
          localStorage.setItem('cvBuilderAuth', 'true');
        } else {
          setIsAuthenticated(false);
            localStorage.removeItem('cvBuilderAuth');
        }
      } catch (error) {
        console.log('Error getting initial session:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('cvBuilderAuth');
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes (this is the authoritative source)
    // Supabase handles session management internally
    const authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        localStorage.setItem('cvBuilderAuth', 'true');
        
        // Set a flag to prevent logout immediately after login (for 10 seconds)
        const loginTimestamp = Date.now();
        sessionStorage.setItem('justLoggedIn', loginTimestamp.toString());
        // Clear this flag after 10 seconds
        setTimeout(() => {
          sessionStorage.removeItem('justLoggedIn');
        }, 10000);
        
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
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
        setIsAuthenticated(false);
        localStorage.removeItem('cvBuilderAuth');
        sessionStorage.removeItem('justLoggedIn');
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Session refreshed - user is still authenticated
        setIsAuthenticated(true);
        localStorage.setItem('cvBuilderAuth', 'true');
      } else if (event === 'INITIAL_SESSION') {
        // Initial session check - use session if available
        if (session?.user) {
          setIsAuthenticated(true);
          localStorage.setItem('cvBuilderAuth', 'true');
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('cvBuilderAuth');
        }
        setIsLoading(false);
      }
    });
    
    // Check selected app on mount
    // Default to marketplace (homepage) if no hash and no specific app selected
    const hash = window.location.hash;
    const savedApp = localStorage.getItem('selectedApp');
    
    // Check if user is navigating to a dashboard (has navigation flags)
    const hasNavigationIntent = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                 sessionStorage.getItem('navigateToIDCardPrint') === 'true' ||
                                 localStorage.getItem('navigateToCVBuilder') === 'true' ||
                                 localStorage.getItem('navigateToIDCardPrint') === 'true';
    
    // If navigating to a dashboard, ensure we don't set hash to #products
    if (hasNavigationIntent && (savedApp === 'cv-builder' || savedApp === 'id-card-print')) {
      // Clear products page flags
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
      // Ensure hash is NOT #products
      if (window.location.hash === '#products') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      // Set the selected app
      setSelectedApp(savedApp);
    } else if (!hash && !savedApp && !hasNavigationIntent) {
      // If no hash and no saved app, default to homepage
      localStorage.setItem('selectedApp', 'marketplace');
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      setSelectedApp('marketplace');
      setForceShowProductsPage(true);
      showProductsPageRef.current = true;
      // Set hash to products page
      if (window.location.hash !== '#products') {
        window.location.hash = '#products';
      }
    } else {
      // If there's a saved app or navigation intent, use it
      const app = savedApp || 'marketplace';
    setSelectedApp(app);
    }
    
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
        localStorage.setItem('selectedApp', 'marketplace');
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        setForceShowProductsPage(true);
        showProductsPageRef.current = true;
      } else if (window.location.hash.startsWith('#admin')) {
        // Hash changed to #admin or #admin?tab=xxx - clear products page flags
        setForceShowProductsPage(false);
        showProductsPageRef.current = false;
        localStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('showProductsPage');
      } else if (window.location.hash === '' || !window.location.hash) {
        // Hash cleared - user navigating to a dashboard
        // Don't clear products page flags here, let routing logic handle it
        // Just update the hash state
      } else if (window.location.hash !== '#products' && (forceShowProductsPage || showProductsPageRef.current)) {
        // Hash changed away from #products - clear products page state
        setForceShowProductsPage(false);
        showProductsPageRef.current = false;
        localStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('showProductsPage');
      }
    };
    
    // Listen for custom navigation events (from Navbar and Header)
    const handleNavigateToMarketplace = () => {
      localStorage.setItem('selectedApp', 'marketplace');
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      setForceShowProductsPage(true);
      showProductsPageRef.current = true;
      setCurrentHash('#products');
      setHashKey(prev => prev + 1);
    };
    
    const handleNavigateToCVBuilder = () => {
      console.log('handleNavigateToCVBuilder called - navigating to CV Builder');
      localStorage.setItem('selectedApp', 'cv-builder');
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('navigateToCVBuilder');
      localStorage.removeItem('navigateToCVBuilder');
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
      setSelectedApp('cv-builder');
      setCurrentView('dashboard');
      // Don't set hash here - let the navbar handle it, or set it after a brief delay
      if (window.location.hash !== '') {
        window.location.hash = '';
      }
      setCurrentHash('');
      setHashKey(prev => prev + 1);
    };
    
    const handleNavigateToIDCardPrinter = () => {
      console.log('handleNavigateToIDCardPrinter called - navigating to ID Card Printer');
      localStorage.setItem('selectedApp', 'id-card-print');
      localStorage.setItem('idCardView', 'dashboard');
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('navigateToIDCardPrint');
      localStorage.removeItem('navigateToIDCardPrint');
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
      setSelectedApp('id-card-print');
      setIdCardView('dashboard');
      // Don't set hash here - let the navbar handle it, or set it after a brief delay
      if (window.location.hash !== '') {
        window.location.hash = '';
      }
      setCurrentHash('');
      setHashKey(prev => prev + 1);
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
    window.addEventListener('navigateToMarketplace', handleNavigateToMarketplace);
    window.addEventListener('navigateToCVBuilder', handleNavigateToCVBuilder);
    window.addEventListener('navigateToIDCardPrinter', handleNavigateToIDCardPrinter);
    
    // Handle page unload (tab/window close) - logout user
    // Use multiple events to reliably detect tab/window close
    let isNavigating = false;
    let navigationTimestamp = 0;
    
    // Detect navigation (reload, link click, etc.) to prevent logout
    const handleNavigation = () => {
      isNavigating = true;
      navigationTimestamp = Date.now();
      // Set a flag that will be checked in unload handlers
      sessionStorage.setItem('isNavigating', 'true');
      sessionStorage.setItem('navigationTimestamp', navigationTimestamp.toString());
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
        sessionStorage.setItem('isReloading', 'true');
        sessionStorage.setItem('reloadTimestamp', Date.now().toString());
        handleNavigation();
      }
    });
    
    // Handle beforeunload - fires when tab/window is closing
    const handleBeforeUnload = (e) => {
      // Check if this is a very recent navigation/reload (within 1 second)
      // This prevents logout during page reloads or hash-based navigation
      const isNav = sessionStorage.getItem('isNavigating') === 'true';
      const isReloading = sessionStorage.getItem('isReloading') === 'true';
      const navTimestamp = parseInt(sessionStorage.getItem('navigationTimestamp') || '0', 10);
      const reloadTimestamp = parseInt(sessionStorage.getItem('reloadTimestamp') || '0', 10);
      const now = Date.now();
      
      // Only skip logout if navigation/reload happened very recently (within 1 second)
      const isRecentNavigation = isNav && (now - navTimestamp) < 1000;
      const isRecentReload = isReloading && (now - reloadTimestamp) < 1000;
      
      // If it's a recent navigation/reload, don't logout
      if (isRecentNavigation || isRecentReload) {
        return;
      }
      
      // Tab/browser is closing - logout user
      if (localStorage.getItem('cvBuilderAuth') === 'true') {
        // Clear authentication state immediately (synchronous)
        localStorage.removeItem('cvBuilderAuth');
        localStorage.removeItem('selectedApp');
        sessionStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('navigateToCVBuilder');
        sessionStorage.removeItem('navigateToIDCardPrint');
        localStorage.removeItem('navigateToIDCardPrint');
        sessionStorage.removeItem('justLoggedIn');
        
        // Attempt logout (may not complete if page closes quickly, but state is cleared)
        supabase.auth.signOut().catch(() => {
          // Ignore errors during unload - state is already cleared
        });
      }
    };
    
    // Handle pagehide event (more reliable than beforeunload for mobile)
    const handlePageHide = (e) => {
      // pagehide.persisted is true when page is cached (not closed)
      // If persisted is true, the page is being cached (e.g., tab switch) - don't logout
      if (e.persisted) {
        // Page is being cached, not closed - don't logout
        return;
      }
      
      // Check if this is a very recent navigation/reload (within 1 second)
      // This prevents logout during page reloads or hash-based navigation
      const isNav = sessionStorage.getItem('isNavigating') === 'true';
      const isReloading = sessionStorage.getItem('isReloading') === 'true';
      const navTimestamp = parseInt(sessionStorage.getItem('navigationTimestamp') || '0', 10);
      const reloadTimestamp = parseInt(sessionStorage.getItem('reloadTimestamp') || '0', 10);
      const now = Date.now();
      
      // Only skip logout if navigation/reload happened very recently (within 1 second)
      const isRecentNavigation = isNav && (now - navTimestamp) < 1000;
      const isRecentReload = isReloading && (now - reloadTimestamp) < 1000;
      
      // If it's a recent navigation/reload, don't logout
      if (isRecentNavigation || isRecentReload) {
        return;
      }
      
      // Tab/browser is closing - logout user
      if (localStorage.getItem('cvBuilderAuth') === 'true') {
        // Clear authentication state immediately
        localStorage.removeItem('cvBuilderAuth');
        localStorage.removeItem('selectedApp');
        sessionStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('navigateToCVBuilder');
        sessionStorage.removeItem('navigateToIDCardPrint');
        localStorage.removeItem('navigateToIDCardPrint');
        sessionStorage.removeItem('justLoggedIn');
        
        // Attempt logout (async, may not complete if page closes quickly)
        supabase.auth.signOut().catch(() => {
          // Ignore errors during unload
        });
      }
    };
    
    // Note: Removed visibilitychange handler - it was causing logout on tab switches
    // Only beforeunload and pagehide are used to detect tab/window closes
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('userAuthenticated', handleAuth);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('navigateToMarketplace', handleNavigateToMarketplace);
      window.removeEventListener('navigateToCVBuilder', handleNavigateToCVBuilder);
      window.removeEventListener('navigateToIDCardPrinter', handleNavigateToIDCardPrinter);
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
    
    // Set a flag to prevent logout immediately after login (for 10 seconds)
    const loginTimestamp = Date.now();
    sessionStorage.setItem('justLoggedIn', loginTimestamp.toString());
    // Clear this flag after 10 seconds
    setTimeout(() => {
      sessionStorage.removeItem('justLoggedIn');
    }, 10000);
    
    // Check if user is on products page (homepage) - this takes priority
    const isOnProductsPage = window.location.hash === '#products' || 
                              window.location.hash === '' ||
                              localStorage.getItem('showProductsPage') === 'true' ||
                              sessionStorage.getItem('showProductsPage') === 'true';
    
    // Check if user clicked on a template - if so, navigate to CV Dashboard after login
    const templateClicked = sessionStorage.getItem('templateClicked') === 'true' || 
                            localStorage.getItem('templateClicked') === 'true';
    
    // If user logged in from homepage (products page), keep them there
    // UNLESS they clicked on a template - in that case, navigate to CV Dashboard
    // This is the default behavior when logging in from header signin button
    if (isOnProductsPage && !templateClicked) {
      // Clear any navigation flags that might redirect away from homepage
      sessionStorage.removeItem('navigateToCVBuilder');
      localStorage.removeItem('navigateToCVBuilder');
      sessionStorage.removeItem('navigateToIDCardPrint');
      localStorage.removeItem('navigateToIDCardPrint');
      
      // Ensure products page flags are set
      localStorage.setItem('selectedApp', 'marketplace');
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      setForceShowProductsPage(true);
      showProductsPageRef.current = true;
      setSelectedApp('marketplace');
      
      // Ensure hash is set to products page
      if (window.location.hash !== '#products') {
        window.location.hash = '#products';
      }
      
      console.log('handleAuth: User logged in from homepage, keeping them on homepage');
      return; // Exit early to prevent any redirects
    }
    
    // If template was clicked, clear the flag after using it
    if (templateClicked) {
      sessionStorage.removeItem('templateClicked');
      localStorage.removeItem('templateClicked');
    }
    
    // If not on products page, check for navigation flags
    // Get selected app from localStorage
    const app = localStorage.getItem('selectedApp') || 'cv-builder';
    setSelectedApp(app);
    
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
      // Ensure selectedApp is set correctly
      localStorage.setItem('selectedApp', 'id-card-print');
      setSelectedApp('id-card-print');
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
        // Ensure selectedApp is set correctly
        localStorage.setItem('selectedApp', 'cv-builder');
        setSelectedApp('cv-builder');
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
      } else {
        // Default: redirect to homepage if no specific navigation intent
        localStorage.setItem('selectedApp', 'marketplace');
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        setForceShowProductsPage(true);
        showProductsPageRef.current = true;
        setSelectedApp('marketplace');
        window.location.hash = '#products';
        console.log('handleAuth: No specific navigation intent, redirecting to homepage');
      }
    }
  };

  // Helper function to wrap content with navbar - navbar is ALWAYS included
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
  
  // Check if user wants to see admin panel (support #admin and #admin?tab=xxx)
  const showAdminPanel = window.location.hash.startsWith('#admin') && isAuthenticated && !isLoading;
  
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
  // On page reload, if no hash and no saved app, show homepage
  const hash = window.location.hash;
  const savedApp = localStorage.getItem('selectedApp');
  
  // Prioritize savedApp - if it's set to a dashboard (cv-builder or id-card-print), always use it
  // This ensures that when navigating to a dashboard, it stays there even if hash changes
  const currentSelectedApp = (savedApp === 'cv-builder' || savedApp === 'id-card-print') ? savedApp :
                              (hash === '#products' ? 'marketplace' : (savedApp || 'marketplace'));
  
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
          case 'template4':
            return (
              <>
                <Form4 
                  key={formResetKey}
                  formData={formData}
                  updateFormData={updateFormData}
                  markAsChanged={hookMarkAsChanged}
                />
                <Preview4 
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
                <button
                  onClick={() => handleTemplateSwitch('template4')}
                  className={selectedTemplate === 'template4' ? 'active' : ''}
                >
                  Template 4
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
  
  // Skip early login check for unauthenticated users visiting domain directly (no hash)
  // This prevents stale localStorage flags from showing login page on new tabs
  // The later routing logic will handle showing homepage for direct domain visits
  
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
          case 'template4':
            return (
              <>
                <Form4 formData={formData} updateFormData={updateFormData} />
                <Preview4 formData={formData} />
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
  
  // Simple products page check: Show if URL hash indicates marketplace page
  // BUT don't show products page if user is navigating to a dashboard (has selectedApp set to cv-builder or id-card-print)
  const hasDashboardNavigation = currentSelectedApp === 'cv-builder' || currentSelectedApp === 'id-card-print';
  const shouldShowProductsPage = (showProductsPageHash || currentHash === '#products') && !hasDashboardNavigation;
  
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
        case 'template4':
          return (
            <>
              <Form4 
                key={formResetKey}
                formData={formData}
                updateFormData={updateFormData}
                markAsChanged={hookMarkAsChanged}
              />
              <Preview4 
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
            left: '200px',
            right: 0,
            zIndex: 999,
            width: 'calc(100% - 200px)',
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
              <button
                className={`template-button ${selectedTemplate === 'template4' ? 'active' : ''}`}
                onClick={() => handleTemplateSwitch('template4')}
                  style={{ visibility: 'visible', opacity: 1 }}
              >
                Template 4
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
  // Only show login if they're explicitly trying to access a dashboard (with navigation flags)
  if (!isAuthenticated && !isLoading) {
    // Get current hash
    const currentHash = window.location.hash;
    
    // Check if user has explicit navigation intent to a dashboard
    const hasNavigationIntent = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                 sessionStorage.getItem('navigateToIDCardPrint') === 'true' ||
                                 localStorage.getItem('navigateToCVBuilder') === 'true' ||
                                 localStorage.getItem('navigateToIDCardPrint') === 'true';
    
    // Only clear navigation flags if there's no hash AND no navigation intent (direct visit to homepage)
    // This ensures flags persist when navigating to #products from navbar buttons
    if (!currentHash && !hasNavigationIntent) {
      // Clear any dashboard selections that might cause login page to show
      const savedApp = localStorage.getItem('selectedApp');
      if (savedApp === 'cv-builder' || savedApp === 'id-card-print') {
        localStorage.setItem('selectedApp', 'marketplace');
      }
      
      // Clear any stale navigation flags that might persist from previous sessions
      sessionStorage.removeItem('navigateToCVBuilder');
      sessionStorage.removeItem('navigateToIDCardPrint');
      localStorage.removeItem('navigateToCVBuilder');
      localStorage.removeItem('navigateToIDCardPrint');
      
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      setForceShowProductsPage(true);
      showProductsPageRef.current = true;
      if (window.location.hash !== '#products') {
        window.location.hash = '#products';
      }
    }
    
    // Only show login directly if there's explicit navigation intent AND no hash (meaning they're trying to access a dashboard directly)
    // If there's a hash (like #products), show ProductsPage which will show login form
    if (hasNavigationIntent && !currentHash) {
      return wrapWithNavbar(
        <Login onAuth={handleAuth} />
      );
    }
    
    // Show homepage (ProductsPage) for all unauthenticated users
    // If there are navigation flags, the login form will be shown automatically by ProductsPage
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={false} 
          currentProduct="products"
          showProductsOnHeader={true}
        />
        <ProductsPage showLoginOnMount={hasNavigationIntent} />
      </>
    );
  }
  
  // For authenticated users, default to homepage if no specific route
  // Only show CV Builder Dashboard if explicitly selected
  if (currentSelectedApp === 'cv-builder' && !shouldShowProductsPage) {
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
  
  // Default to homepage for authenticated users if no specific route
  if (!currentSelectedApp || currentSelectedApp === 'marketplace' || (!hash && !savedApp)) {
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