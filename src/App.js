import React, { useState, useEffect, startTransition } from 'react';
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
import Form5 from './components/template5/Form5';
import Preview5 from './components/template5/Preview5';
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
import OrderHistory from './components/OrderHistory/OrderHistory';
import LeftNavbar from './components/Navbar/LeftNavbar';
import TopNav from './components/TopNav/TopNav';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

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
  // Initialize selectedApp from localStorage, but don't write to localStorage during init
  // Writing during init can cause React error #301
  const [selectedApp, setSelectedApp] = useState(() => {
    // Read from localStorage - preserve user's current section
    const savedApp = localStorage.getItem('selectedApp');
    if (savedApp) {
      return savedApp; // Preserve user's section
    }
    // First visit - default to marketplace (don't write to localStorage here)
    // It will be written when user navigates or in event handlers
    return 'marketplace';
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
  const productDetailIdRef = React.useRef(null); // Ref to access current productDetailId in callbacks
  const sessionCheckIntervalRef = React.useRef(null); // Ref for session check interval
  const hasInitializedRef = React.useRef(false);
  const isMountedRef = React.useRef(false); // Track if component has finished initial render
  const ignoreInitialSessionRef = React.useRef(true); // Ignore first INITIAL_SESSION event // Track if we've already initialized to prevent re-initialization on tab switch
  const [forceShowProductsPage, setForceShowProductsPage] = useState(false);
  const [productDetailId, setProductDetailId] = useState(null);
  
  // Update ref whenever productDetailId changes
  React.useEffect(() => {
    productDetailIdRef.current = productDetailId;
  }, [productDetailId]);

  // Use the useAutoSave hook for Supabase integration
  const { 
    autoSaveStatus: hookAutoSaveStatus, 
    hasUnsavedChanges: hookHasUnsavedChanges, 
    currentCVId,
    loadCV,
    createNewCV,
    markAsChanged: hookMarkAsChanged
  } = useAutoSave(formData);

  // Debug: Log hook status (only in development, and only when values change)
  // Removed to prevent infinite re-render loops
  // Uncomment for debugging if needed:
  // React.useEffect(() => {
  //   console.log('App.js - Hook status:', { 
  //     hookAutoSaveStatus, 
  //     hookHasUnsavedChanges, 
  //     currentCVId, 
  //     formDataName: formData.name 
  //   });
  // }, [hookAutoSaveStatus, hookHasUnsavedChanges, currentCVId, formData.name]);


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

  // Facebook-like navigation handlers - Instant switching like Facebook
  const handleNavigateToSection = (section) => {
    // Update localStorage immediately (single source of truth)
    localStorage.setItem('selectedApp', section);
    
    // Update React state immediately for instant UI update
    setSelectedApp(section);
    setCurrentView('dashboard');
    
    // Clear any conflicting flags
    setForceShowProductsPage(false);
    showProductsPageRef.current = false;
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    
    // Force immediate re-render by updating a key
    // This ensures the component switches instantly like Facebook
  };

  // Handle "Make a new CV" button - Facebook-style instant navigation
  const handleMakeNewCV = () => {
    console.log('handleMakeNewCV called - creating new CV');
    
    // Ensure we're on CV Builder section
    localStorage.setItem('selectedApp', 'cv-builder');
    setSelectedApp('cv-builder');
    
    // Reset products page flags
    setForceShowProductsPage(false);
    showProductsPageRef.current = false;
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    
    // Reset form data
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
    
    // Set template to template1 and switch to form view
    setSelectedTemplate('template1');
    setCurrentView('cv-builder');
    
    console.log('handleMakeNewCV - Form view activated');
  };

  useEffect(() => {
    // Mark component as mounted after initial render
    isMountedRef.current = true;
    
    // Clear navigation flags on mount (after reload completes)
    // This ensures that if the page was reloaded (not closed), we don't logout
    sessionStorage.removeItem('isNavigating');
    sessionStorage.removeItem('isReloading');
    
    // Declare loadingTimeout in outer scope so it can be accessed by cleanup
    let loadingTimeout;
    
    // Get initial session from Supabase with timeout (8 seconds)
    const getInitialSession = async () => {
      let timeoutId;
      
      // Set a maximum loading timeout (10 seconds total)
      // Already in setTimeout, so safe
      loadingTimeout = setTimeout(() => {
        console.warn('Authentication check timeout - stopping loading after 10 seconds');
        setIsLoading(false);
      }, 10000);

      try {
        // Create a timeout promise for the Supabase call (8 seconds)
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Supabase session check timed out'));
          }, 8000);
        });

        // Race between Supabase call and timeout
        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);

        // Clear the Supabase timeout since we got a response
        if (timeoutId) clearTimeout(timeoutId);
        if (loadingTimeout) clearTimeout(loadingTimeout);

        // Check if result is from timeout (it will be an error) or from Supabase
        if (result && result.data !== undefined) {
          const { data: { session }, error } = result;
          
          // Defer state updates to prevent React error #301
          setTimeout(() => {
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
          }, 0);
        }
      } catch (error) {
        // Clear timeouts
        if (timeoutId) clearTimeout(timeoutId);
        if (loadingTimeout) clearTimeout(loadingTimeout);
        
        // Defer state updates to prevent React error #301
        setTimeout(() => {
          // If it's a timeout error, use localStorage as fallback
          if (error.message === 'Supabase session check timed out') {
            console.warn('Supabase session check timed out after 8 seconds, using localStorage fallback');
            const cachedAuth = localStorage.getItem('cvBuilderAuth');
            setIsAuthenticated(cachedAuth === 'true');
          } else {
            console.log('Error getting initial session:', error);
            setIsAuthenticated(false);
            localStorage.removeItem('cvBuilderAuth');
          }
          // Ensure loading is stopped
          setIsLoading(false);
        }, 0);
      } finally {
        // Defer loading state update to prevent React error #301
        setTimeout(() => {
          setIsLoading(false);
        }, 0);
      }
    };

    getInitialSession();

    // Handle deep links for OAuth callback (mobile app) - OPTIMIZED
    const handleAppUrl = async (url) => {
      console.log('App opened with URL:', url);
      
      // Clear the loading timeout since we received a callback
      clearTimeout(loadingTimeout);
      
      // Dispatch event to hide loading state
      window.dispatchEvent(new CustomEvent('googleSignInCallbackReceived'));
      
      // Check if this is an OAuth callback
      if (url.url && url.url.includes('oauth-callback')) {
        console.log('OAuth callback detected:', url.url);
        
        // Close the browser immediately (don't wait)
        Browser.close().catch(() => {
          // Browser might already be closed, ignore error
        });
        
        // Extract parameters from the deep link - OPTIMIZED
        // Format: getglory://oauth-callback?code=xxx&state=xxx#access_token=xxx&refresh_token=xxx
        try {
          // Handle both getglory:// and https:// schemes
          let urlString = url.url;
          if (!urlString.startsWith('http') && !urlString.startsWith('getglory')) {
            urlString = 'getglory://' + urlString.replace(/^\/+/, '');
          }
          
          // Fast token extraction using regex (faster than URL parsing for hash)
          const hashMatch = urlString.match(/#([^?]*)/);
          const hash = hashMatch ? hashMatch[1] : '';
          
          if (hash) {
            // Fast token extraction using split (faster than URLSearchParams for simple cases)
            const hashParts = hash.split('&');
            let accessToken = null;
            let refreshToken = null;
            
            for (const part of hashParts) {
              if (part.startsWith('access_token=')) {
                accessToken = decodeURIComponent(part.substring(13));
              } else if (part.startsWith('refresh_token=')) {
                refreshToken = decodeURIComponent(part.substring(14));
              }
              // Early exit if both tokens found
              if (accessToken && refreshToken) break;
            }
            
            if (accessToken && refreshToken) {
              console.log('Found tokens, setting session immediately...');
              
              // Set session immediately (don't wait for browser close)
              try {
                const { data: { session }, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                });
                
                if (error) {
                  console.error('Error setting session:', error);
                  // Fallback: check for session
                  const { data: { session: fallbackSession } } = await supabase.auth.getSession();
                  if (fallbackSession?.user) {
                    setIsAuthenticated(true);
                    localStorage.setItem('cvBuilderAuth', 'true');
                  }
                } else if (session?.user) {
                  console.log('Session set successfully:', session.user?.email);
                  setIsAuthenticated(true);
                  localStorage.setItem('cvBuilderAuth', 'true');
                  
                  // Dispatch authentication event to hide login forms
                  window.dispatchEvent(new CustomEvent('userAuthenticated'));
                  
                  // Navigate to homepage after successful OAuth login
                  sessionStorage.removeItem('navigateToCVBuilder');
                  localStorage.removeItem('navigateToCVBuilder');
                  sessionStorage.removeItem('navigateToIDCardPrint');
                  localStorage.removeItem('navigateToIDCardPrint');
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
                setIsLoading(false);
              } catch (sessionError) {
                console.error('Exception setting session:', sessionError);
                setIsLoading(false);
              }
              return; // Early return after successful token extraction
            }
          }
          
          // Fallback: check for existing session (parallel check)
          const sessionCheck = supabase.auth.getSession();
          setIsLoading(false);
          
          const { data: { session } } = await sessionCheck;
          if (session?.user) {
            console.log('Session found:', session.user?.email);
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
            
            // Dispatch authentication event to hide login forms
            window.dispatchEvent(new CustomEvent('userAuthenticated'));
            
            // Navigate to homepage after OAuth login
            sessionStorage.removeItem('navigateToCVBuilder');
            localStorage.removeItem('navigateToCVBuilder');
            sessionStorage.removeItem('navigateToIDCardPrint');
            localStorage.removeItem('navigateToIDCardPrint');
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
          
        } catch (urlError) {
          console.error('Error processing OAuth callback URL:', urlError);
          setIsLoading(false);
          // Last resort: check for any existing session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
            
            // Dispatch authentication event to hide login forms
            window.dispatchEvent(new CustomEvent('userAuthenticated'));
            
            // Navigate to homepage after OAuth login
            sessionStorage.removeItem('navigateToCVBuilder');
            localStorage.removeItem('navigateToCVBuilder');
            sessionStorage.removeItem('navigateToIDCardPrint');
            localStorage.removeItem('navigateToIDCardPrint');
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
        }
      }
    };

    // Listen for app URL open events (deep links)
    CapacitorApp.addListener('appUrlOpen', handleAppUrl);

    // Fallback: If deep link doesn't work, check for session periodically after Google sign-in starts
    const handleGoogleSignInStarted = () => {
      console.log('Google sign-in started, setting up fallback session check');
      
      // Clear any existing interval
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      
      // Check for session every 2 seconds for up to 30 seconds
      let checkCount = 0;
      const maxChecks = 15; // 15 * 2 seconds = 30 seconds
      
      sessionCheckIntervalRef.current = setInterval(async () => {
        checkCount++;
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session?.user && !isAuthenticated) {
            console.log('Fallback: Session found after Google sign-in:', session.user.email);
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
            setIsLoading(false);
            
            // Dispatch authentication event to hide login forms
            window.dispatchEvent(new CustomEvent('userAuthenticated'));
            
            // Close browser if still open
            Browser.close().catch(() => {});
            
            // Navigate to homepage after OAuth login
            sessionStorage.removeItem('navigateToCVBuilder');
            localStorage.removeItem('navigateToCVBuilder');
            sessionStorage.removeItem('navigateToIDCardPrint');
            localStorage.removeItem('navigateToIDCardPrint');
            localStorage.setItem('selectedApp', 'marketplace');
            localStorage.setItem('showProductsPage', 'true');
            sessionStorage.setItem('showProductsPage', 'true');
            setForceShowProductsPage(true);
            showProductsPageRef.current = true;
            
            // Navigate to products page
            if (window.location.hash !== '#products') {
              window.location.hash = '#products';
            }
            
            // Clear interval
            if (sessionCheckIntervalRef.current) {
              clearInterval(sessionCheckIntervalRef.current);
              sessionCheckIntervalRef.current = null;
            }
          } else if (checkCount >= maxChecks) {
            console.log('Fallback: Max checks reached, stopping session check');
            if (sessionCheckIntervalRef.current) {
              clearInterval(sessionCheckIntervalRef.current);
              sessionCheckIntervalRef.current = null;
            }
          }
        } catch (err) {
          console.error('Fallback session check error:', err);
        }
      }, 2000);
      
      // Clean up interval after max time
      setTimeout(() => {
        if (sessionCheckIntervalRef.current) {
          clearInterval(sessionCheckIntervalRef.current);
          sessionCheckIntervalRef.current = null;
        }
      }, 30000);
    };
    
    // Listen for Google sign-in start event
    window.addEventListener('googleSignInStarted', handleGoogleSignInStarted);

    // CRITICAL: Do NOT register onAuthStateChange here - it fires immediately and causes React error #301
    // Instead, register it in a separate useEffect that runs after initial render
    
    // REMOVED: setSelectedApp call from useEffect - this was causing React error #301
    // We don't need to sync state here because render function reads directly from localStorage
    // State updates should only happen in event handlers, not during render/useEffect
    
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

    // Listen for authentication events from Login component
    window.addEventListener('userAuthenticated', handleAuth);
    
    // Listen for Facebook-style navigation events from LeftNavbar
    const handleSectionNavigation = (e) => {
      const section = e.detail;
      if (section) {
        handleNavigateToSection(section);
      }
    };
    window.addEventListener('navigateToSection', handleSectionNavigation);
    
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
    // NOTE: This event can fire on tab switches in some browsers, so we don't clear selectedApp here
    // Only pagehide with e.persisted === false should clear selectedApp
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
      // NOTE: Don't clear selectedApp here - it can fire on tab switches
      // Only clear auth state, selectedApp will be cleared in pagehide if actually closing
      if (localStorage.getItem('cvBuilderAuth') === 'true') {
        // Clear authentication state immediately (synchronous)
        localStorage.removeItem('cvBuilderAuth');
        // DO NOT clear selectedApp here - it will be cleared in pagehide if actually closing
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
      
      // Tab/browser is ACTUALLY closing (not cached) - logout user
      // Only clear auth state, NEVER clear selectedApp - it should persist
      if (localStorage.getItem('cvBuilderAuth') === 'true') {
        // Clear authentication state immediately
        localStorage.removeItem('cvBuilderAuth');
        // DO NOT clear selectedApp - it should persist across sessions
        // localStorage.removeItem('selectedApp'); // REMOVED - preserve state
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
    
    // Preserve selectedApp when window regains focus - CRITICAL for tab switching
    // Use requestIdleCallback or setTimeout to prevent state updates during render
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Tab regained focus - restore state from localStorage
        // Use setTimeout to ensure this doesn't happen during render
        setTimeout(() => {
          const savedApp = localStorage.getItem('selectedApp');
          
          // Only update if different from current state to prevent unnecessary re-renders
          if (savedApp === 'cv-builder' || savedApp === 'id-card-print') {
            setSelectedApp(prev => prev !== savedApp ? savedApp : prev);
            // Clear products page flags
            localStorage.removeItem('showProductsPage');
            sessionStorage.removeItem('showProductsPage');
            setForceShowProductsPage(false);
            showProductsPageRef.current = false;
          } else if (savedApp === 'marketplace') {
            setSelectedApp(prev => prev !== 'marketplace' ? 'marketplace' : prev);
            const showProducts = localStorage.getItem('showProductsPage') === 'true' || 
                                sessionStorage.getItem('showProductsPage') === 'true';
            if (showProducts) {
              setForceShowProductsPage(true);
              showProductsPageRef.current = true;
            }
          } else if (!savedApp) {
            // If no saved app, default to marketplace
            localStorage.setItem('selectedApp', 'marketplace');
            setSelectedApp(prev => prev !== 'marketplace' ? 'marketplace' : prev);
          }
        }, 0);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('userAuthenticated', handleAuth);
      window.removeEventListener('navigateToSection', handleSectionNavigation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      delete window.navigateToDashboard;
      // Clear loading timeout if it exists
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      // Clear session check interval if it exists
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      // Remove Google sign-in event listener
      window.removeEventListener('googleSignInStarted', handleGoogleSignInStarted);
      // Remove App URL listener
      CapacitorApp.removeAllListeners();
      // Note: authStateSubscription is now in a separate useEffect, cleaned up there
      // Mark component as unmounted
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Include isAuthenticated to have current value

  // CRITICAL: Register onAuthStateChange in a separate useEffect that runs AFTER initial render
  // This prevents the INITIAL_SESSION event from firing during render and causing React error #301
  useEffect(() => {
    // Use queueMicrotask to ensure this runs after all synchronous code completes
    // This is more reliable than setTimeout for ensuring render is complete
    let cancelled = false;
    
    queueMicrotask(() => {
      if (cancelled || !isMountedRef.current) return;
      
      // Additional delay to be absolutely sure render is complete
      setTimeout(() => {
        if (cancelled || !isMountedRef.current) return;
        registerAuthListener();
      }, 50);
    });
    
    return () => {
      cancelled = true;
    };

    function registerAuthListener() {
      // Listen for auth state changes (this is the authoritative source)
      // Supabase handles session management internally
      const authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // CRITICAL: Skip INITIAL_SESSION - we already handle it in getInitialSession
        // This prevents React error #301 from INITIAL_SESSION firing during render
        if (event === 'INITIAL_SESSION') {
          console.log('Skipping INITIAL_SESSION - already handled by getInitialSession');
          // Mark that we've seen the initial session, so we can handle future ones if needed
          ignoreInitialSessionRef.current = false;
          return;
        }
        
        // Double-check: if we're still ignoring initial session and this is somehow INITIAL_SESSION, skip it
        if (ignoreInitialSessionRef.current && event === 'INITIAL_SESSION') {
          console.log('Still ignoring INITIAL_SESSION');
          return;
        }
        
        // Use startTransition to mark all state updates as non-urgent
        // This prevents React error #301
        startTransition(() => {
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
                                    window.location.search.includes('code') ||
                                    sessionStorage.getItem('googleSignInStarted') === 'true';
            
            // For OAuth logins (Google sign-in), always redirect to homepage
            if (isOAuthCallback) {
              // Clear OAuth hash/query from URL
              if (window.location.hash.includes('access_token') || window.location.hash.includes('code')) {
                window.location.hash = '';
              }
              if (window.location.search.includes('code')) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              
              // Clear Google sign-in flag
              sessionStorage.removeItem('googleSignInStarted');
              
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
          }
        });
      });

      // Cleanup on unmount
      return () => {
        if (authStateSubscription && authStateSubscription.data && authStateSubscription.data.subscription) {
          authStateSubscription.data.subscription.unsubscribe();
        }
      };
    }
  }, []); // Empty deps - only run once after mount

  // REMOVED: State sync useEffect that was causing React error #301
  // Instead, we read directly from localStorage in the render function for routing
  // State updates only happen in event handlers (handleNavigateToSection, etc.)
  // This completely prevents state updates during render

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
    // CRITICAL: Defer ALL state updates to prevent React error #301
    setTimeout(() => {
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
    }, 0);
  };

  // Helper function to wrap content with navbar - navbar is ALWAYS included
  const wrapWithNavbar = (content) => {
    return (
      <>
        <LeftNavbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
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
    // Ensure selectedApp is set to cv-builder
    localStorage.setItem('selectedApp', 'cv-builder');
    setSelectedApp('cv-builder');
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
        // CRITICAL: Ensure we're on CV Builder section before loading CV
        localStorage.setItem('selectedApp', 'cv-builder');
        setSelectedApp('cv-builder');
        
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
  
  // All hash-based routing removed - user will add navigation one by one

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
  // NOTE: This runs after the main useEffect, so it should only run if selectedApp wasn't already set
  useEffect(() => {
    const savedApp = localStorage.getItem('selectedApp');
    if (savedApp && (savedApp === 'cv-builder' || savedApp === 'id-card-print')) {
      // Only set if we're on a dashboard app and it's not already set correctly
      // This ensures we don't override the main initialization logic
      setSelectedApp(savedApp);
      // Clear products page flags
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      setForceShowProductsPage(false);
      showProductsPageRef.current = false;
      // Ensure hash is NOT #products when on dashboard
      if (window.location.hash === '#products') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);
  
  // Keep forceShowProductsPage true once set - don't reset it automatically
  // It will only be reset when user explicitly navigates to a product via Header buttons
  // This ensures products page stays visible and doesn't redirect

  // Facebook-like navigation: Simple section-based routing
  // CRITICAL: Read directly from localStorage - don't default to marketplace if user is on a dashboard
  const savedAppForNav = localStorage.getItem('selectedApp');
  const currentSection = savedAppForNav || 'marketplace';
  
  // Wrap content with TopNav for authenticated users
  const wrapWithTopNav = (content) => {
    if (!isAuthenticated || isLoading) {
      return content;
    }
    // Always read current section from localStorage on every render - don't use React state
    const currentSectionForNav = localStorage.getItem('selectedApp') || 'marketplace';
    return (
      <>
        <TopNav 
          currentSection={currentSectionForNav}
          onSectionChange={handleNavigateToSection}
          isAuthenticated={isAuthenticated}
        />
        <div style={{ marginTop: '56px', minHeight: 'calc(100vh - 56px)' }}>
          {content}
        </div>
      </>
    );
  };

  // CRITICAL ROUTING: Check localStorage.getItem('selectedApp') FIRST - single source of truth
  // This MUST happen FIRST for authenticated users to prevent homepage redirects
  // Read directly from localStorage on EVERY render - don't rely on React state
  if (isAuthenticated && !isLoading) {
    // ALWAYS read from localStorage directly - don't use React state for routing
    // This is the single source of truth and prevents React error #301
    const selectedAppFromStorage = localStorage.getItem('selectedApp');
    
    // CRITICAL: Don't update state or write to localStorage in render function
    // State updates should only happen in event handlers
    // Just read from localStorage and use it for routing decisions
    
    // If localStorage is empty, default to marketplace for routing
    // Don't write to localStorage here - it will be set in event handlers
    const routingApp = selectedAppFromStorage || 'marketplace';
    
    // If user is on CV Builder section
    if (routingApp === 'cv-builder') {
      // Check if user wants to see the form (currentView === 'cv-builder')
      // This takes priority over showing the dashboard
      if (currentView === 'cv-builder') {
        // Show CV Builder form/preview
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
            case 'template5':
              return (
                <>
                  <Form5 
                    key={formResetKey}
                    formData={formData}
                    updateFormData={updateFormData}
                    markAsChanged={hookMarkAsChanged}
                  />
                  <Preview5 
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

        return wrapWithTopNav(
          wrapWithNavbar(
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
                    <button
                      onClick={() => handleTemplateSwitch('template5')}
                      className={selectedTemplate === 'template5' ? 'active' : ''}
                    >
                      Template 5 (Europass)
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
          )
        );
      }
      
      // Otherwise, show CV Dashboard
      return wrapWithTopNav(
        wrapWithNavbar(
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
        )
      );
    }
    
    // If user is on ID Card Printer section
    if (routingApp === 'id-card-print') {
      // Check if user wants to see the print page (idCardView === 'print')
      // This takes priority over showing the dashboard
      if (idCardView === 'print') {
        const handleBackToIDCardDashboard = () => {
          setIdCardView('dashboard');
          localStorage.setItem('idCardView', 'dashboard');
        };
        
        return wrapWithTopNav(
          wrapWithNavbar(
            <>
              <Header 
                isAuthenticated={true} 
                onLogout={handleLogout}
                currentProduct="id-card-print"
              />
              <div className="app-header-cv" style={{ 
                display: 'flex', 
                visibility: 'visible', 
                opacity: 1, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                padding: '24px 20px 12px 20px', 
                position: 'fixed',
                top: 'calc(var(--header-height, 80px) + 56px)',
                left: '200px',
                right: 0,
                zIndex: 999,
                width: 'calc(100% - 200px)',
                minHeight: '80px',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: 0
              }}>
                <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 700 }}>ID Card Printer</h1>
                <button 
                  onClick={handleBackToIDCardDashboard} 
                  className="back-to-dashboard-button"
                  style={{ 
                    visibility: 'visible', 
                    opacity: 1, 
                    display: 'block',
                    padding: '10px 20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
              <div style={{ marginTop: 'calc(var(--header-height, 80px) + 56px + 80px)' }}>
                <IDCardPrintPage />
              </div>
            </>
          )
        );
      }
      
      // Otherwise, show ID Card Dashboard
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={true} 
              onLogout={handleLogout}
              currentProduct="id-card-print"
            />
            <IDCardDashboard 
              onCreateNewIDCard={() => {
                setIdCardView('print');
                localStorage.setItem('idCardView', 'print');
              }}
            />
          </>
        )
      );
    }
    
    // If user is on Marketplace, show ProductsPage
    if (routingApp === 'marketplace') {
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <ProductsPage />
          </>
        )
      );
    }
  }

  // All hash-based routing removed - user will add navigation one by one
  
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
          case 'template5':
            return (
              <>
                <Form5 
                  key={formResetKey}
                  formData={formData}
                  updateFormData={updateFormData}
                  markAsChanged={hookMarkAsChanged}
                />
                <Preview5 
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
                <button
                  onClick={() => handleTemplateSwitch('template5')}
                  className={selectedTemplate === 'template5' ? 'active' : ''}
                >
                  Template 5 (Europass)
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
  
  // Duplicate routing logic removed - handled above in the main routing section

  // Route to CV Builder Dashboard
  const selectedAppForCV = localStorage.getItem('selectedApp');
  if (isAuthenticated && !isLoading && selectedAppForCV === 'cv-builder') {
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
          case 'template5':
            return (
              <>
                <Form5 formData={formData} updateFormData={updateFormData} />
                <Preview5 formData={formData} />
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
  
  // PRIORITY: Check if we should show CV Builder form/preview
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
        case 'template5':
          return (
            <>
              <Form5 
                key={formResetKey}
                formData={formData}
                updateFormData={updateFormData}
                markAsChanged={hookMarkAsChanged}
              />
              <Preview5 
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
              <button
                className={`template-button ${selectedTemplate === 'template5' ? 'active' : ''}`}
                onClick={() => handleTemplateSwitch('template5')}
                  style={{ visibility: 'visible', opacity: 1 }}
              >
                Template 5 (Europass)
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
  
  // Products page routing is handled above in the authenticated user routing section
  
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
    // Check if user has explicit navigation intent to a dashboard
    const hasNavigationIntent = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                 sessionStorage.getItem('navigateToIDCardPrint') === 'true' ||
                                 localStorage.getItem('navigateToCVBuilder') === 'true' ||
                                 localStorage.getItem('navigateToIDCardPrint') === 'true';
    
    // Only clear navigation flags if there's no navigation intent (direct visit to homepage)
    // BUT: Don't clear selectedApp for unauthenticated users - preserve it for when they log in
    if (!hasNavigationIntent) {
      // Don't clear selectedApp - preserve user's intended destination
      // This ensures they go to the right place after logging in
      
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
    
    // Only show login directly if there's explicit navigation intent (meaning they're trying to access a dashboard directly)
    if (hasNavigationIntent) {
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
  
  // FINAL FALLBACK: For authenticated users, check localStorage one more time
  // This ensures we never show homepage if user is on a dashboard
  const finalSelectedApp = localStorage.getItem('selectedApp');
  
  if (isAuthenticated && !isLoading) {
    // If user is on CV Builder or ID Card, show it - NEVER show marketplace
    if (finalSelectedApp === 'cv-builder') {
      return wrapWithTopNav(
        wrapWithNavbar(
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
        )
      );
    }
    
    if (finalSelectedApp === 'id-card-print') {
      if (idCardView === 'print') {
        const handleBackToIDCardDashboard = () => {
          setIdCardView('dashboard');
          localStorage.setItem('idCardView', 'dashboard');
        };
        
        return wrapWithTopNav(
          wrapWithNavbar(
            <>
              <Header 
                isAuthenticated={true} 
                onLogout={handleLogout}
                currentProduct="id-card-print"
              />
              <div className="app-header-cv" style={{ 
                display: 'flex', 
                visibility: 'visible', 
                opacity: 1, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                padding: '24px 20px 12px 20px', 
                position: 'fixed',
                top: 'calc(var(--header-height, 80px) + 56px)',
                left: '200px',
                right: 0,
                zIndex: 999,
                width: 'calc(100% - 200px)',
                minHeight: '80px',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: 0
              }}>
                <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 700 }}>ID Card Printer</h1>
                <button 
                  onClick={handleBackToIDCardDashboard} 
                  className="back-to-dashboard-button"
                  style={{ 
                    visibility: 'visible', 
                    opacity: 1, 
                    display: 'block',
                    padding: '10px 20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
              <div style={{ marginTop: 'calc(var(--header-height, 80px) + 56px + 80px)' }}>
                <IDCardPrintPage />
              </div>
            </>
          )
        );
      }
      
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={true} 
              onLogout={handleLogout}
              currentProduct="id-card-print"
            />
            <IDCardDashboard 
              onCreateNewIDCard={() => {
                setIdCardView('print');
                localStorage.setItem('idCardView', 'print');
              }}
            />
          </>
        )
      );
    }
    
    // Only show marketplace if explicitly set to marketplace
    if (finalSelectedApp === 'marketplace' || !finalSelectedApp) {
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <ProductsPage />
          </>
        )
      );
    }
  }
  
  // Ultimate fallback: Show CV Dashboard (shouldn't reach here)
  return wrapWithTopNav(
    wrapWithNavbar(
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
    )
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