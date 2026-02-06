import React, { useState, useEffect, startTransition, Suspense, lazy } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import { SupabaseProvider } from './components/Supabase';
import useAutoSave from './components/Supabase/useAutoSave';
import { authService, supabase, cvCreditsService } from './components/Supabase/supabase';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import generatePDF1 from './components/template1/pdf1';
import generatePDF2 from './components/template2/pdf2';
import generatePDF3 from './components/template3/pdf3';
import generatePDF4 from './components/template4/pdf4';
import generatePDF5 from './components/template5/pdf5';
import { setCurrentApp, getCVView, setCVView, setIDCardView, getRoute } from './utils/routing';
import { pathToApp, getProductIdFromPath, getOrderIdFromPath } from './utils/routeMapping';
import { setNavigate } from './utils/navigation';

// Critical components - load immediately
import Header from './components/Header/Header';
import HomePage from './components/HomePage/HomePage';
import ProductsPage from './components/Products/Marketplace';

// Lazy load non-critical components for code splitting
const Login = lazy(() => import('./components/Login/Login'));
const CVDashboard = lazy(() => import('./components/Dashboard/CVDashboard'));
const Form1 = lazy(() => import('./components/template1/Form1'));
const Form5 = lazy(() => import('./components/template5/Form5'));
const Preview1 = lazy(() => import('./components/template1/Preview1'));
const Preview2 = lazy(() => import('./components/template2/Preview2'));
const Preview3 = lazy(() => import('./components/template3/Preview3'));
const Preview4 = lazy(() => import('./components/template4/Preview4'));
const Preview5 = lazy(() => import('./components/template5/Preview5'));
const IDCardPrintPage = lazy(() => import('./components/IDCardPrint/IDCardPrintPage'));
const IDCardDashboard = lazy(() => import('./components/IDCardDashboard/IDCardDashboard'));
const UserProfile = lazy(() => import('./components/UserProfile/UserProfile'));
// const MarketplaceAdmin = lazy(() => import('./components/MarketplaceAdmin/MarketplaceAdmin')); // Not currently used
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const ShopkeeperDashboard = lazy(() => import('./components/Shopkeeper/ShopkeeperDashboard'));
const ProductDetail = lazy(() => import('./components/Products/ProductDetail'));
const Cart = lazy(() => import('./components/Cart/Cart'));
const Checkout = lazy(() => import('./components/Checkout/Checkout'));
const OrderDetails = lazy(() => import('./components/OrderDetails/OrderDetails'));
const OrderHistory = lazy(() => import('./components/OrderHistory/OrderHistory'));
const LeftNavbar = lazy(() => import('./components/Navbar/LeftNavbar'));
const TopNav = lazy(() => import('./components/TopNav/TopNav'));
const PreviewPage = lazy(() => import('./components/PreviewPage/PreviewPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }}></div>
      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading...</p>
    </div>
  </div>
);

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Support both hash-based (legacy) and clean URL routing
  // eslint-disable-next-line no-unused-vars
  const getCurrentPath = () => {
    // If using clean URLs, use pathname
    if (location.pathname && location.pathname !== '/') {
      return location.pathname;
    }
    // Fallback to hash for backward compatibility
    const hash = window.location.hash.replace('#', '');
    return hash || '/';
  };
  
  // const currentPath = getCurrentPath(); // Not currently used
  
  // Set navigate function for navigation utility
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);
  
  // Sync URL path to internal routing system
  useEffect(() => {
    // Don't sync for cart, checkout, orders, order details, admin, shopkeeper, or profile - these are handled separately
    const pathname = location.pathname;
    if (pathname === '/cart' || pathname === '/checkout' || pathname === '/orders' || 
        pathname.startsWith('/order/') || pathname === '/admin' || pathname.startsWith('/admin/') ||
        pathname === '/shopkeeper' || pathname.startsWith('/shopkeeper/') || pathname === '/profile') {
      // These routes are handled by specific route checks, don't override with routingApp
      return;
    }
    
    const pathApp = pathToApp(location.pathname);
    if (pathApp) {
      setCurrentApp(pathApp);
      setSelectedApp(pathApp);
    }
    
    // Handle product detail route
    const productId = getProductIdFromPath(location.pathname);
    if (productId && pathApp === 'marketplace') {
      setCurrentApp('marketplace');
      setSelectedApp('marketplace');
    }
  }, [location.pathname]);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [currentView, setCurrentView] = useState('dashboard');
  // Initialize idCardView from localStorage if available, otherwise default to 'dashboard'
  // eslint-disable-next-line no-unused-vars
  const [idCardView, setIdCardView] = useState(() => {
    const savedView = localStorage.getItem('idCardView');
    return savedView === 'print' ? 'print' : 'dashboard';
  });
  // Initialize selectedApp from localStorage, but don't write to localStorage during init
  // Writing during init can cause React error #301
  // CRITICAL: Default to empty string to allow homepage to show
  const [selectedApp, setSelectedApp] = useState(() => {
    // On page reload with pathname "/", always show homepage
    // Check if this is a fresh page load (pathname is "/" and no navigation flags)
    const pathname = window.location.pathname;
    const hasNavFlags = sessionStorage.getItem('navigateToCVBuilder') ||
                       sessionStorage.getItem('navigateToIDCardPrint') ||
                       localStorage.getItem('navigateToCVBuilder') ||
                       localStorage.getItem('navigateToIDCardPrint') ||
                       sessionStorage.getItem('isNavigating');
    
    // If pathname is "/" and no navigation flags, clear selectedApp to show homepage
    if (pathname === '/' && !hasNavFlags) {
      localStorage.removeItem('selectedApp');
      return '';
    }
    
    // Otherwise, preserve user's section from localStorage (for navigation within app)
    const savedApp = localStorage.getItem('selectedApp');
    return savedApp || '';
  }); // 'marketplace', 'cv-builder', 'id-card-print', or '' for homepage
  // Normalize languages: convert strings to objects
  const normalizeLanguages = (languages) => {
    if (!Array.isArray(languages)) return [];
    return languages.map(lang => {
      if (typeof lang === 'string') {
        // Convert string to object format (no default level)
        return { name: lang, level: '' };
      } else if (typeof lang === 'object' && lang !== null && lang.name) {
        // Already an object, preserve existing level or leave empty
        return { name: lang.name, level: lang.level || '' };
      }
      // Invalid format, return default
      return { name: '', level: '' };
    });
  };

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    profileImage: null,
    professionalSummary: '',
    education: [],
    experience: [],
    skills: ['Communication Skills', 'Time Management', 'Problem Solving', 'Hardworking'],
    certifications: [],
    languages: [{ name: 'English', level: '' }, { name: 'Urdu', level: '' }, { name: 'Punjabi', level: '' }],
    hobbies: [],
    references: [],
    otherInfo: [],
    customSection: []
  });

  // Debug: Track formData changes
  useEffect(() => {
  }, [formData]);
  // Local state for UI (will be overridden by hook)
  // eslint-disable-next-line no-unused-vars
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const productDetailIdRef = React.useRef(null); // Ref to access current productDetailId in callbacks
  const sessionCheckIntervalRef = React.useRef(null); // Ref for session check interval
  // eslint-disable-next-line no-unused-vars
  const hasInitializedRef = React.useRef(false);
  const isMountedRef = React.useRef(false); // Track if component has finished initial render
  const ignoreInitialSessionRef = React.useRef(true); // Ignore first INITIAL_SESSION event
  const lastKnownAppRef = React.useRef(null); // Track last known app to prevent redirects
  const explicitlyClickedMarketplaceRef = React.useRef(false); // Track if user explicitly clicked marketplace
  const [productDetailId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [, setProductDetailId] = useState(null);
  
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
    duplicateCV,
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


  // Listen for hash changes to trigger re-renders when admin panel is accessed
  React.useEffect(() => {
    const handleHashChange = () => {
      // Hash changes are now handled by React Router, but we keep this for backward compatibility
      // Force a re-render by updating selectedApp state
      const hash = window.location.hash;
      if (hash.startsWith('#admin')) {
        // Admin panel accessed via hash - let React Router handle it
        navigate('/admin');
      }
    };
    
    // Listen for hash changes (for backward compatibility with hash routes)
    window.addEventListener('hashchange', handleHashChange);
    
    // Listen for homepage navigation event
    const handleHomePageNavigation = () => {
      // Preserve authentication state
      const wasAuthenticated = localStorage.getItem('cvBuilderAuth') === 'true';
      if (wasAuthenticated) {
        localStorage.setItem('cvBuilderAuth', 'true');
      }
      // Clear selectedApp to show homepage
      localStorage.removeItem('selectedApp');
      // Clear cvView to reset CV Builder state
      localStorage.removeItem('cvView');
      // Navigate to homepage using React Router
      navigate('/');
      // Force a re-render by updating selectedApp state and resetting currentView
      startTransition(() => {
        setSelectedApp('');
        setCurrentView('dashboard'); // Reset currentView to prevent CV Builder from showing
      });
    };
    
    window.addEventListener('navigateToHomePage', handleHomePageNavigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('navigateToHomePage', handleHomePageNavigation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // navigate is stable from useNavigate hook

  // Load saved draft on component mount - CRITICAL: Load BEFORE form renders
  // Load formData from localStorage when returning from preview page
  // This must run synchronously during initialization to prevent form from rendering with empty data
  React.useEffect(() => {
    // Function to attempt loading data from localStorage
    const attemptLoadData = () => {
      // Check if we're returning from preview - check this FIRST before any other logic
      const returningFromPreview = localStorage.getItem('returningFromPreview') === 'true';
      const goToCVForm = sessionStorage.getItem('goToCVForm') === 'true' || localStorage.getItem('goToCVForm') === 'true';
      const cvView = getCVView();
      
      // Data loading check on mount
      
      // If returning from preview OR goToCVForm flag is set, ALWAYS load from localStorage
      // This is the primary condition - don't check other things first
      if (returningFromPreview || goToCVForm) {
        const storedData = localStorage.getItem('cvFormData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            const hasStoredData = parsedData.name || parsedData.education?.length > 0 || parsedData.experience?.length > 0;
            
            if (hasStoredData) {
              // Normalize languages if needed (convert strings to objects)
              if (parsedData.languages && parsedData.languages.length > 0) {
                parsedData.languages = normalizeLanguages(parsedData.languages);
              } else {
                // If no languages or empty array, use default languages
                parsedData.languages = [{ name: 'English', level: '' }, { name: 'Urdu', level: '' }, { name: 'Punjabi', level: '' }];
              }
              
              // Load the data IMMEDIATELY
              setFormData(parsedData);
              
              // Clear the flags AFTER setting the data
              localStorage.removeItem('returningFromPreview');
              sessionStorage.removeItem('goToCVForm');
              localStorage.removeItem('goToCVForm');
              
              return true; // Successfully loaded
            } else {
              // Still clear flags even if data is empty
              localStorage.removeItem('returningFromPreview');
              sessionStorage.removeItem('goToCVForm');
              localStorage.removeItem('goToCVForm');
              return false;
            }
          } catch (e) {
            console.error('App.js - Error parsing stored form data:', e, e.stack);
            // Clear flags even on error
            localStorage.removeItem('returningFromPreview');
            sessionStorage.removeItem('goToCVForm');
            localStorage.removeItem('goToCVForm');
            return false;
          }
        } else {
          // Clear flags even if no data
          localStorage.removeItem('returningFromPreview');
          sessionStorage.removeItem('goToCVForm');
          localStorage.removeItem('goToCVForm');
          return false;
        }
      } else if (cvView === 'cv-builder') {
        // Only if NOT returning from preview, check if we should load stored data
        const storedData = localStorage.getItem('cvFormData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            const hasStoredData = parsedData.name || parsedData.education?.length > 0 || parsedData.experience?.length > 0;
            const hasCurrentData = formData.name || formData.education?.length > 0 || formData.experience?.length > 0;
            
            if (hasStoredData && !hasCurrentData) {
              // If formData is empty, load stored data
              // Normalize languages if needed
              if (parsedData.languages && parsedData.languages.length > 0) {
                parsedData.languages = normalizeLanguages(parsedData.languages);
              } else {
                // If no languages or empty array, use default languages
                parsedData.languages = [{ name: 'English', level: '' }, { name: 'Urdu', level: '' }, { name: 'Punjabi', level: '' }];
              }
              setFormData(parsedData);
              return true;
            } else if (hasStoredData && hasCurrentData) {
              // If both have data, prefer stored data if it's more complete
              const storedDataComplete = (parsedData.education?.length || 0) + (parsedData.experience?.length || 0);
              const currentDataComplete = (formData.education?.length || 0) + (formData.experience?.length || 0);
              if (storedDataComplete > currentDataComplete) {
                // Normalize languages if needed
                if (parsedData.languages && parsedData.languages.length > 0) {
                  parsedData.languages = normalizeLanguages(parsedData.languages);
                } else {
                  // If no languages or empty array, use default languages
                  parsedData.languages = [{ name: 'English', level: '' }, { name: 'Urdu', level: '' }, { name: 'Punjabi', level: '' }];
                }
                setFormData(parsedData);
                return true;
              }
            }
          } catch (e) {
            console.error('App.js - Error parsing stored form data:', e);
          }
        }
      }
      return false;
    };
    
    // Try to load data immediately
    const loaded = attemptLoadData();
    
    // If loading failed but flags are still set, retry after a short delay
    // This handles race conditions where localStorage might not be ready yet
    if (!loaded) {
      const returningFromPreview = localStorage.getItem('returningFromPreview') === 'true';
      const goToCVForm = sessionStorage.getItem('goToCVForm') === 'true' || localStorage.getItem('goToCVForm') === 'true';
      
      if (returningFromPreview || goToCVForm) {
        const retryTimeout = setTimeout(() => {
          const retryLoaded = attemptLoadData();
          if (!retryLoaded) {
            setTimeout(() => {
              attemptLoadData();
            }, 300);
          }
        }, 100);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => clearTimeout(retryTimeout);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY on mount - page reload will trigger this

  // Removed localStorage saving on page unload - form data will reset on page reload

  // Auto-save happens automatically every 10 seconds

  // Mark as changed - using hook's markAsChanged instead

  // Update form data
  const updateFormData = (newData) => {
    setFormData(newData);
    hookMarkAsChanged(); // Use hook's markAsChanged instead of local state
  };

  // Fresh, simplified navigation handler
  const handleNavigateToSection = (section) => {
    // Update localStorage (single source of truth)
    setCurrentApp(section);
    lastKnownAppRef.current = section; // Track as last known app
    
    // Track if user explicitly clicked marketplace
    if (section === 'marketplace') {
      explicitlyClickedMarketplaceRef.current = true;
    } else {
      explicitlyClickedMarketplaceRef.current = false;
    }
    
    // Reset views to dashboard when switching sections
    setCVView('dashboard');
    setIDCardView('dashboard');
    
    // Update React state using startTransition to prevent React error #301
    startTransition(() => {
      setSelectedApp(section);
      setCurrentView('dashboard');
      setIdCardView('dashboard');
    });
  };

  // Fresh handler for "Make a new CV" button - Rebuilt from scratch
  const handleMakeNewCV = React.useCallback(() => {
    // Check if we're returning from preview - if so, load data from localStorage
    const returningFromPreview = localStorage.getItem('returningFromPreview') === 'true';
    if (returningFromPreview) {
      const storedData = localStorage.getItem('cvFormData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setFormData(parsedData);
        } catch (e) {
          console.error('App.js - Error parsing stored form data in handleMakeNewCV:', e);
        }
      }
      localStorage.removeItem('returningFromPreview');
      // Still set the view and app state
      setCurrentApp('cv-builder');
      setCVView('cv-builder');
      lastKnownAppRef.current = 'cv-builder';
      startTransition(() => {
        setSelectedApp('cv-builder');
        setCurrentView('cv-builder');
      });
      return;
    }
    
    // Set app to CV Builder and view to form using routing utils
    setCurrentApp('cv-builder');
    setCVView('cv-builder');
    lastKnownAppRef.current = 'cv-builder'; // Track as last known app
    
    // Reset form data to empty
    const newFormData = {
      name: '',
      position: '',
      phone: '',
      email: '',
      address: '',
      profileImage: null,
      showProfileImage: true,
      professionalSummary: '',
      education: [],
      experience: [],
      skills: ['Communication Skills', 'Time Management', 'Problem Solving', 'Hardworking'],
      certifications: [],
      languages: [{ name: 'English', level: '' }, { name: 'Urdu', level: '' }, { name: 'Punjabi', level: '' }],
      hobbies: [],
      references: [],
      otherInfo: [],
      customSection: []
    };
    setFormData(newFormData);
    setHasUnsavedChanges(false);
    setAutoSaveStatus('');
    setFormResetKey(prev => prev + 1); // Force form re-render
    createNewCV(); // Reset the hook state
    
    // Set template to template1 and switch to form view
      setSelectedTemplate('template1');
    
    // Update React state using startTransition
    startTransition(() => {
      setSelectedApp('cv-builder');
    setCurrentView('cv-builder');
    });
    
  }, [createNewCV]);

  // Duplicate current CV - creates a new record with same data for editing experience/education separately
  const handleDuplicateCV = React.useCallback(async () => {
    const result = await duplicateCV(formData, selectedTemplate);
    // Guest mode returns the duplicated form data to update the form
    if (result && typeof result === 'object' && result.name) {
      setFormData(result);
    }
  }, [duplicateCV, formData, selectedTemplate]);

  // Fresh handler for "Create New ID Card" button - Rebuilt from scratch
  const handleCreateNewIDCard = React.useCallback(() => {
    setCurrentApp('id-card-print');
    setIDCardView('print');
    localStorage.setItem('selectedApp', 'id-card-print');
    localStorage.setItem('idCardView', 'print');
    lastKnownAppRef.current = 'id-card-print'; // Track as last known app
    startTransition(() => {
      setSelectedApp('id-card-print');
      setIdCardView('print');
    });
  }, []);

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
            localStorage.removeItem('guestMode');
              setIsLoading(false);
          } else if (session?.user) {
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
              setIsLoading(false);
          } else if (localStorage.getItem('guestMode') === 'true') {
            // Guest/demo mode - allow app access for Play Store review
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
              setIsLoading(false);
          } else {
            const guestMode = localStorage.getItem('guestMode');
            if (guestMode !== 'true') {
              setIsAuthenticated(false);
              localStorage.removeItem('cvBuilderAuth');
            } else {
              setIsAuthenticated(true);
              localStorage.setItem('cvBuilderAuth', 'true');
            }
              setIsLoading(false);
            }
          }, 0);
        } else {
          // No result - stop loading
          setTimeout(() => {
            setIsLoading(false);
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
          const cachedAuth = localStorage.getItem('cvBuilderAuth');
          const guestMode = localStorage.getItem('guestMode');
          setIsAuthenticated(cachedAuth === 'true' || guestMode === 'true');
        } else {
          console.log('Error getting initial session:', error);
          setIsAuthenticated(false);
          localStorage.removeItem('cvBuilderAuth');
          localStorage.removeItem('guestMode');
        }
        // Ensure loading is stopped
        setIsLoading(false);
        }, 0);
      }
      // REMOVED: finally block - loading state is now set in each branch above
    };

    getInitialSession();

    // Handle deep links for OAuth callback (mobile app) - OPTIMIZED
    const handleAppUrl = async (url) => {
      
      // Clear the loading timeout since we received a callback
      clearTimeout(loadingTimeout);
      
      // Dispatch event to hide loading state
      window.dispatchEvent(new CustomEvent('googleSignInCallbackReceived'));
      
      // Check if this is an OAuth callback
      if (url.url && url.url.includes('oauth-callback')) {
        
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
                  
                  // CRITICAL: Clear OAuth flags immediately to prevent redirect loop
                  sessionStorage.removeItem('googleSignInStarted');
                  sessionStorage.removeItem('pendingUserType');
                  
                  setIsAuthenticated(true);
                  localStorage.setItem('cvBuilderAuth', 'true');
                  
                  // Dispatch authentication event to hide login forms
                  window.dispatchEvent(new CustomEvent('userAuthenticated'));
                  
                  // Navigate to homepage after successful OAuth login
                  sessionStorage.removeItem('navigateToCVBuilder');
                  localStorage.removeItem('navigateToCVBuilder');
                  sessionStorage.removeItem('navigateToIDCardPrint');
                  localStorage.removeItem('navigateToIDCardPrint');
                  // Clear selectedApp to show homepage
                  localStorage.removeItem('selectedApp');
                  startTransition(() => {
                    setSelectedApp('');
                  });
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
            
            // CRITICAL: Clear OAuth flags immediately to prevent redirect loop
            sessionStorage.removeItem('googleSignInStarted');
            sessionStorage.removeItem('pendingUserType');
            
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
            
            // Dispatch authentication event to hide login forms
            window.dispatchEvent(new CustomEvent('userAuthenticated'));
            
            // Navigate to homepage after OAuth login
            sessionStorage.removeItem('navigateToCVBuilder');
            localStorage.removeItem('navigateToCVBuilder');
            sessionStorage.removeItem('navigateToIDCardPrint');
            localStorage.removeItem('navigateToIDCardPrint');
            localStorage.removeItem('selectedApp');
            startTransition(() => {
              setSelectedApp('');
            });
          }
          
        } catch (urlError) {
          console.error('Error processing OAuth callback URL:', urlError);
          setIsLoading(false);
          // Last resort: check for any existing session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // CRITICAL: Clear OAuth flags immediately to prevent redirect loop
            sessionStorage.removeItem('googleSignInStarted');
            sessionStorage.removeItem('pendingUserType');
            
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
            
            // Dispatch authentication event to hide login forms
            window.dispatchEvent(new CustomEvent('userAuthenticated'));
            
            // Navigate to homepage after OAuth login
            sessionStorage.removeItem('navigateToCVBuilder');
            localStorage.removeItem('navigateToCVBuilder');
            sessionStorage.removeItem('navigateToIDCardPrint');
            localStorage.removeItem('navigateToIDCardPrint');
            localStorage.removeItem('selectedApp');
            startTransition(() => {
              setSelectedApp('');
            });
          }
        }
      }
    };

    // Listen for app URL open events (deep links)
    CapacitorApp.addListener('appUrlOpen', handleAppUrl);

    // Fallback: If deep link doesn't work, check for session periodically after Google sign-in starts
    const handleGoogleSignInStarted = () => {
      
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
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user && !isAuthenticated) {
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
            startTransition(() => {
              setSelectedApp('marketplace');
            });
            
            // Clear interval
            if (sessionCheckIntervalRef.current) {
              clearInterval(sessionCheckIntervalRef.current);
              sessionCheckIntervalRef.current = null;
            }
          } else if (checkCount >= maxChecks) {
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
      localStorage.setItem('selectedApp', 'cv-builder');
      startTransition(() => {
      setSelectedApp('cv-builder');
    });
      setCurrentView('dashboard');
    };

    // Listen for authentication events from Login component
    window.addEventListener('userAuthenticated', handleAuth);

    // Check for referral codes and process referrals
    const checkReferralCode = async () => {
      try {
        // Check URL for referral parameter (both query string and hash)
        const urlParams = new URLSearchParams(window.location.search);
        let refCode = urlParams.get('ref');
        
        // Also check hash for referral code (in case it's in the hash)
        if (!refCode) {
          const hash = window.location.hash;
          const hashParams = new URLSearchParams(hash.split('?')[1] || '');
          refCode = hashParams.get('ref');
        }
        
        // Check sessionStorage for pending referral (from OAuth redirect)
        if (!refCode) {
          refCode = sessionStorage.getItem('pendingReferral');
        }
        
        if (!refCode) return;

        console.log('Referral code found:', refCode);

        // Get current user
        const { authService, cvCreditsService } = await import('./components/Supabase/supabase');
        const user = await authService.getCurrentUser();
        
        if (!user) {
          // User not logged in yet - store referral code to process after login
          console.log('User not authenticated, storing referral code for later');
          sessionStorage.setItem('pendingReferral', refCode);
          // Also store in localStorage as backup
          localStorage.setItem('pendingReferral', refCode);
          return;
        }

        console.log('User authenticated, processing referral. Visitor ID:', user.id);

        // Decode referral code to get referrer user ID
        try {
          // Decode the referral code (base64 with URL-safe characters)
          // Replace URL-safe characters back to base64 format
          const base64Code = refCode.replace(/-/g, '+').replace(/_/g, '/');
          // Add padding if needed
          let paddedCode = base64Code;
          while (paddedCode.length % 4) {
            paddedCode += '=';
          }
          const referrerUserId = atob(paddedCode);
          
          console.log('Decoded referrer user ID:', referrerUserId);
          console.log('Visitor user ID:', user.id);
          
          // Process referral
          const result = await cvCreditsService.addCreditsForReferral(referrerUserId, user.id);
          
          console.log('Referral processing result:', result);
          
          if (result.success) {
            if (result.isNewUser && result.visitorCredits !== null) {
              console.log('✅ Referral credit added successfully! Both referrer and new user got 1 credit each.');
              // Show notification if possible
              if (window.showNotification) {
                window.showNotification('🎉 Welcome! You earned 1 free credit for signing up via referral link!');
              }
            } else {
              console.log('✅ Referral credit added successfully! Referrer got 1 credit.');
              // Show notification if possible
              if (window.showNotification) {
                window.showNotification('Referral processed! The referrer earned 1 credit.');
              }
            }
            // Clear pending referral
            sessionStorage.removeItem('pendingReferral');
            localStorage.removeItem('pendingReferral');
          } else {
            console.warn('Referral processing failed:', result.message);
          }
          
          // Remove referral code from URL to prevent reprocessing
          urlParams.delete('ref');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
        } catch (decodeError) {
          console.error('Error decoding referral code:', decodeError);
          console.error('Referral code that failed:', refCode);
        }
      } catch (err) {
        console.error('Error processing referral:', err);
      }
    };

    // Check referral on initial load
    checkReferralCode();

    // Also check referral after authentication
    const handleReferralAfterAuth = async () => {
      console.log('User authenticated event received, checking for pending referral...');
      // Check both sessionStorage and localStorage for pending referral
      const pendingRef = sessionStorage.getItem('pendingReferral') || localStorage.getItem('pendingReferral');
      if (pendingRef) {
        console.log('Pending referral found, processing...');
        sessionStorage.removeItem('pendingReferral');
        localStorage.removeItem('pendingReferral');
        // Wait a bit for auth to fully complete, then process
        setTimeout(() => {
          checkReferralCode();
        }, 2000);
      } else {
        // Also check URL in case referral code is still there
        checkReferralCode();
      }
    };
    
    window.addEventListener('userAuthenticated', handleReferralAfterAuth);
    
    // Also check on auth state change (for Supabase auth)
    const checkReferralOnAuthChange = async () => {
      const { authService } = await import('./components/Supabase/supabase');
      const user = await authService.getCurrentUser();
      if (user) {
        // User is authenticated, check for referral
        setTimeout(() => {
          checkReferralCode();
        }, 1000);
      }
    };
    
    // Check referral when auth state might have changed
    setTimeout(checkReferralOnAuthChange, 3000);
    
    // Listen for Facebook-style navigation events from LeftNavbar
    const handleSectionNavigation = (e) => {
      const section = e.detail;
      if (section) {
        handleNavigateToSection(section);
      }
    };
    // eslint-disable-next-line no-unused-vars
    window.addEventListener('navigateToSection', handleSectionNavigation);
    
    // Handle page unload (tab/window close) - logout user
    // Use multiple events to reliably detect tab/window close
    // eslint-disable-next-line no-unused-vars
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
    
    // NOTE: We intentionally do NOT use a `visibilitychange` handler.
    // It previously caused unwanted state resets on tab/window switching (including marketplace/admin UX issues).
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    // Listen for ID Card print completion to ensure we stay on print page
    const handleIDCardPrintCompleted = (event) => {
      if (event.detail && event.detail.stayOnPrintPage) {
        localStorage.setItem('idCardView', 'print');
        localStorage.setItem('selectedApp', 'id-card-print');
        setCurrentApp('id-card-print');
        setIdCardView('print');
      }
    };
    
    window.addEventListener('idCardPrintCompleted', handleIDCardPrintCompleted);
    
    return () => {
      window.removeEventListener('userAuthenticated', handleAuth);
      window.removeEventListener('navigateToSection', handleSectionNavigation);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('idCardPrintCompleted', handleIDCardPrintCompleted);
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
        
        // CRITICAL: Skip INITIAL_SESSION - we already handle it in getInitialSession
        // This prevents React error #301 from INITIAL_SESSION firing during render
        if (event === 'INITIAL_SESSION') {
          // Mark that we've seen the initial session, so we can handle future ones if needed
          ignoreInitialSessionRef.current = false;
          return;
        }
        
        // Double-check: if we're still ignoring initial session and this is somehow INITIAL_SESSION, skip it
        if (ignoreInitialSessionRef.current && event === 'INITIAL_SESSION') {
          console.log('Still ignoring INITIAL_SESSION');
          return;
        }
        
        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY') {
          // The Login component will handle showing the reset form
          // Just ensure we're on the right route
          if (!window.location.hash.includes('#reset-password') && !window.location.hash.includes('type=recovery')) {
            window.location.hash = '#reset-password';
          }
          return; // Don't process as a normal sign-in
        }
        
        // Handle user type for Google OAuth sign-in (before state updates)
        if (event === 'SIGNED_IN' && session?.user) {
          // Check for OAuth callback - only if we have tokens OR flag with valid session
          const hasOAuthTokens = window.location.hash.includes('access_token') || 
                                 window.location.hash.includes('code') ||
                                 window.location.search.includes('code');
          const hasOAuthFlag = sessionStorage.getItem('googleSignInStarted') === 'true';
          const isOAuthCallback = hasOAuthTokens || (hasOAuthFlag && session?.user);
          
          if (isOAuthCallback) {
            // All new Google sign-ins default to 'regular' user type
            // Check if user already has user_type in metadata
            const currentUserType = session.user.user_metadata?.user_type;
            
            // Only set user_type if it doesn't exist yet (new user)
            // All new users are regular by default
            if (!currentUserType) {
              // New user - set to regular by default
              try {
                await authService.updateUserMetadata({
                  user_type: 'regular',
                  ...session.user.user_metadata // Preserve existing metadata
                });
                console.log('Set new Google sign-in user to regular type');
              } catch (err) {
                console.error('Error setting user type:', err);
                // If error is about not being able to change type, that's expected for existing users
                if (err.message && err.message.includes('cannot change your own user type')) {
                }
              }
            }
            
            // Clear OAuth flag
            sessionStorage.removeItem('pendingUserType');
            sessionStorage.removeItem('googleSignInStarted');
          }
        }
        
        // Use startTransition to mark all state updates as non-urgent
        // This prevents React error #301
        startTransition(() => {
          if (event === 'SIGNED_IN' && session?.user) {
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
            
            // Set flags to prevent logout immediately after login (for 10 seconds)
            // Set both flags for compatibility with all auth checks
            const loginTimestamp = Date.now();
            sessionStorage.setItem('justLoggedIn', loginTimestamp.toString());
            sessionStorage.setItem('justAuthenticated', 'true');
            // Clear these flags after 10 seconds
            setTimeout(() => {
              sessionStorage.removeItem('justLoggedIn');
            }, 10000);
            setTimeout(() => {
              sessionStorage.removeItem('justAuthenticated');
            }, 5000);
            
            // Check if this is an OAuth callback (Google login)
            // IMPORTANT: Only check for actual OAuth tokens in URL, not the flag
            // The flag might persist and cause false positives
            const hasOAuthTokens = window.location.hash.includes('access_token') || 
                                   window.location.hash.includes('code') ||
                                   window.location.search.includes('code');
            const hasOAuthFlag = sessionStorage.getItem('googleSignInStarted') === 'true';
            const isOAuthCallback = hasOAuthTokens || (hasOAuthFlag && session?.user);
            
            // For OAuth logins (Google sign-in), always redirect to homepage
            if (isOAuthCallback) {
              // Clear OAuth hash/query from URL immediately
              if (window.location.hash.includes('access_token') || window.location.hash.includes('code')) {
                window.location.hash = '';
              }
              if (window.location.search.includes('code')) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              
              // CRITICAL: Clear Google sign-in flag immediately to prevent redirect loop
              sessionStorage.removeItem('googleSignInStarted');
              sessionStorage.removeItem('pendingUserType');
              
              // Verify session is actually set before proceeding
              // Note: session is already available from the callback parameter, so we can use it directly
              if (!session?.user) {
                console.error('OAuth callback detected but no session found - this should not happen');
                // Wait a bit and check again (session might be setting asynchronously)
                setTimeout(async () => {
                  const { data: { session: retrySession } } = await supabase.auth.getSession();
                  if (retrySession?.user) {
                    setIsAuthenticated(true);
                    localStorage.setItem('cvBuilderAuth', 'true');
                  } else {
                    console.error('No session found even after retry - user needs to sign in again');
                    // Don't redirect to login - let the auth state handle it
                  }
                }, 1000);
                return; // Exit early if no session
              }
              
              // For Google OAuth login, redirect to homepage
              // Clear any navigation flags to ensure user lands on homepage
              sessionStorage.removeItem('navigateToCVBuilder');
              localStorage.removeItem('navigateToCVBuilder');
              sessionStorage.removeItem('navigateToIDCardPrint');
              localStorage.removeItem('navigateToIDCardPrint');
              
              // Clear selectedApp to show homepage (not marketplace)
              localStorage.removeItem('selectedApp');
              startTransition(() => {
                setSelectedApp('');
              });
            }
            
            // Trigger auth event for other components
            window.dispatchEvent(new CustomEvent('userAuthenticated'));
          } else if (event === 'SIGNED_OUT') {
            // User explicitly signed out - but check if this is a false positive
            // Sometimes SIGNED_OUT can fire during login if there's a race condition
            const justLoggedIn = sessionStorage.getItem('justLoggedIn');
            const justAuthenticated = sessionStorage.getItem('justAuthenticated') === 'true';
            
            // Only clear auth if user didn't just log in (prevent race conditions)
            if (!justLoggedIn && !justAuthenticated) {
              setIsAuthenticated(false);
              localStorage.removeItem('cvBuilderAuth');
              localStorage.removeItem('guestMode');
            } else {
              // User just logged in - this might be a false SIGNED_OUT event
              // Keep auth state and wait for SIGNED_IN event
              console.log('SIGNED_OUT event ignored - user just logged in');
            }
            // Don't remove justLoggedIn here - let it expire naturally
          } else if (event === 'TOKEN_REFRESHED' && !session) {
            // Token refresh failed - but don't clear auth if user just logged in
            // This prevents race conditions where session hasn't propagated yet
            const justLoggedIn = sessionStorage.getItem('justLoggedIn');
            const justAuthenticated = sessionStorage.getItem('justAuthenticated') === 'true';
            const isAuthInStorage = localStorage.getItem('cvBuilderAuth') === 'true';
            
            // Only clear auth if user didn't just log in AND there's no auth in storage
            // This prevents clearing auth for admin users or during race conditions
            if (!justLoggedIn && !justAuthenticated && !isAuthInStorage) {
              setIsAuthenticated(false);
              localStorage.removeItem('cvBuilderAuth');
              localStorage.removeItem('guestMode');
            } else if (isAuthInStorage || justLoggedIn || justAuthenticated) {
              // User is authenticated - ensure auth state is set
              setIsAuthenticated(true);
              localStorage.setItem('cvBuilderAuth', 'true');
            }
            // Don't remove justLoggedIn here - let it expire naturally
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('cvBuilderAuth');
      localStorage.removeItem('guestMode');
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
    // Check if user clicked on a template - if so, navigate to CV Dashboard after login
    const templateClicked = sessionStorage.getItem('templateClicked') === 'true' || 
                            localStorage.getItem('templateClicked') === 'true';
    
    // Check for specific navigation intent (CV Builder or ID Card Print)
    const navigateToCVBuilder = sessionStorage.getItem('navigateToCVBuilder') === 'true' || 
                                localStorage.getItem('navigateToCVBuilder') === 'true';
    const navigateToIDCardPrintCheck = sessionStorage.getItem('navigateToIDCardPrint') === 'true' || 
                                  localStorage.getItem('navigateToIDCardPrint') === 'true';
    
    // If user has specific navigation intent, handle it
    if (navigateToCVBuilder || navigateToIDCardPrintCheck || templateClicked) {
      // User wants to go to a specific section - let the navigation logic handle it
      // Don't clear selectedApp here - let the navigation flags work
    } else {
      // Default behavior: After login, land on homepage
      // Clear any navigation flags that might redirect away from homepage
      sessionStorage.removeItem('navigateToCVBuilder');
      localStorage.removeItem('navigateToCVBuilder');
      sessionStorage.removeItem('navigateToIDCardPrint');
      localStorage.removeItem('navigateToIDCardPrint');
      
      // Clear selectedApp to show homepage (not marketplace)
      localStorage.removeItem('selectedApp');
      startTransition(() => {
        setSelectedApp('');
      });
      
      return; // Exit early to prevent any redirects
    }
    
    // If template was clicked, clear the flag after using it
    if (templateClicked) {
      sessionStorage.removeItem('templateClicked');
      localStorage.removeItem('templateClicked');
    }
    
    // If not on products page, check for navigation flags
    // Default to homepage (empty selectedApp) instead of cv-builder
    const savedApp = localStorage.getItem('selectedApp');
    
    // Check if user wants to navigate to ID Card Print dashboard after login (check FIRST)
    const navigateToIDCardPrint = sessionStorage.getItem('navigateToIDCardPrint') === 'true' || 
                                   localStorage.getItem('navigateToIDCardPrint') === 'true';
    if (navigateToIDCardPrint) {
      // Don't remove the flag here - let PRIORITY 0 routing check handle it
        // Clear any old marketplace flags
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      // Ensure selectedApp is set correctly
      localStorage.setItem('selectedApp', 'id-card-print');
      startTransition(() => {
      setSelectedApp('id-card-print');
      });
      // Set idCardView to dashboard
      setIdCardView('dashboard');
      // DO NOT set currentView to 'dashboard' - this would trigger CV Builder routing
    }
    // Check if user wants to navigate to CV Builder dashboard after login
    else {
      const navigateToCVBuilder = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                   localStorage.getItem('navigateToCVBuilder') === 'true';
      if (navigateToCVBuilder) {
        // Don't remove the flag here - let PRIORITY 0 routing check handle it
        // Ensure selectedApp is set correctly
        localStorage.setItem('selectedApp', 'cv-builder');
          startTransition(() => {
        startTransition(() => {
        setSelectedApp('cv-builder');
    });
        setCurrentView('dashboard');
          });
        // Clear products page flags to allow navigation
          // Removed - no longer needed
        localStorage.removeItem('showProductsPage');
        sessionStorage.removeItem('showProductsPage');
      } else if (currentView === 'cv-builder') {
        // If user was on form/preview page, redirect to dashboard after login
        setCurrentView('dashboard');
        // Keep selectedApp as cv-builder if it was already set
        if (savedApp === 'cv-builder') {
          startTransition(() => {
            setSelectedApp('cv-builder');
          });
        }
      } else {
        // Default: redirect to homepage if no specific navigation intent
        // Clear selectedApp to show homepage
        localStorage.removeItem('selectedApp');
        startTransition(() => {
          setSelectedApp('');
        });
      }
    }
    }, 0);
  };

  // Helper function to wrap content with navbar - navbar is ALWAYS included
  // Helper function to wrap lazy components with Suspense
  // eslint-disable-next-line no-unused-vars
  const wrapLazy = (Component, props = {}) => {
    if (!Component) return null;
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };

  const wrapWithNavbar = (content) => {
    return (
      <>
        <Suspense fallback={null}>
          <LeftNavbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        </Suspense>
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
    // Clear the goToCVForm flag to prevent showing form
    sessionStorage.removeItem('goToCVForm');
    localStorage.removeItem('goToCVForm');
    
    // Set app to CV Builder and view to dashboard using routing utils
    setCurrentApp('cv-builder');
    setCVView('dashboard');
    
    // Update React state
    startTransition(() => {
      setSelectedApp('cv-builder');
    setCurrentView('dashboard');
    });
    
    // Force a page reload to ensure routing state is properly applied
    // Small delay to ensure localStorage is written
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  // Handle share app
  const handleShareApp = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        alert('Please login to share and earn credits.');
        return;
      }

      // Generate unique referral link for this user
      const referralCode = btoa(user.id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const shareUrl = `${window.location.origin}?ref=${referralCode}`;
      const shareText = 'Sign in the app and get free credits.';
      const shareTitle = 'Get Glory - CV Builder';

      try {
        if (window.Capacitor && Share) {
          await Share.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
            dialogTitle: 'Share Get Glory App'
          });
          return;
        }
      } catch (capError) {
        if (capError.message && (capError.message.includes('cancel') || capError.message.includes('dismiss'))) {
          return;
        }
        console.log('Capacitor Share error:', capError);
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.error('Error sharing:', shareError);
          }
        }
      } else {
        const fullText = `${shareText}\n${shareUrl}`;
        try {
          await navigator.clipboard.writeText(fullText);
          alert('Link copied to clipboard!');
        } catch (clipError) {
          alert('Unable to copy. Please share manually.');
        }
      }
    } catch (err) {
      console.error('Error in share process:', err);
    }
  };

  // Handle download PDF (reserved for future use / passed to child components)
  const handleDownloadPDF = async () => { // eslint-disable-line no-unused-vars
    try {
      // Check CV credits before allowing download
      const user = await authService.getCurrentUser();
      if (user) {
        const canDownload = await cvCreditsService.canDownloadCV(user.id);
        if (!canDownload) {
          const credits = await cvCreditsService.getCredits(user.id);
          alert(`You have no CV download credits remaining (${credits} credits). To get more CV Download Credits Contact Administrator : 0315-3338612`);
          return;
        }
      }

      // Get formData from state or localStorage
      let dataForFileName = formData;
      if (!dataForFileName || !dataForFileName.name) {
        const storedData = localStorage.getItem('cvFormData');
        if (storedData) {
          try {
            dataForFileName = JSON.parse(storedData);
          } catch (e) {
            console.error('Error parsing stored data for filename:', e);
          }
        }
      }

      // Get the correct PDF generator based on selected template
      let generatePDF;
      switch (selectedTemplate) {
        case 'template1':
          generatePDF = generatePDF1;
          break;
        case 'template2':
          generatePDF = generatePDF2;
          break;
        case 'template3':
          generatePDF = generatePDF3;
          break;
        case 'template4':
          generatePDF = generatePDF4;
          break;
        case 'template5':
          generatePDF = generatePDF5;
          break;
        default:
          generatePDF = generatePDF1;
      }

      // Call the PDF generation function
      if (generatePDF) {
        if (selectedTemplate === 'template1' || selectedTemplate === 'template2' || selectedTemplate === 'template3' || selectedTemplate === 'template4' || selectedTemplate === 'template5') {
          generatePDF(dataForFileName);
        } else {
          generatePDF();
        }
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Error downloading PDF. Please try again.');
    }
  };

  // Handle template switching without resetting form data
  const handleTemplateSwitch = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handleEditCV = async (cv) => {
    // Load the CV data and switch to CV builder view
    if (cv && cv.id) {
      try {
        // CRITICAL: Ensure we're on CV Builder section before loading CV
        localStorage.setItem('selectedApp', 'cv-builder');
        startTransition(() => {
      setSelectedApp('cv-builder');
    });
        
        // Use the loadCV function from the hook to properly set currentCVId
        const loadedFormData = await loadCV(cv.id);
        if (loadedFormData) {
          setFormData(loadedFormData);
          
          // Store formData in localStorage immediately after loading from database
          // This ensures it's available when navigating to preview
          try {
            // Create a serializable copy (handle profileImage properly)
            const serializableData = {
              ...loadedFormData,
              profileImage: loadedFormData.profileImage 
                ? (loadedFormData.profileImage.data 
                    ? { data: loadedFormData.profileImage.data } 
                    : loadedFormData.profileImage instanceof File 
                      ? null // Can't serialize File objects
                      : loadedFormData.profileImage)
                : null
            };
            localStorage.setItem('cvFormData', JSON.stringify(serializableData));
          } catch (e) {
            console.error('App.js - Error storing loaded CV formData in localStorage:', e);
          }
          
          setCurrentView('cv-builder');
          setSelectedTemplate(cv.template_id || 'template1');
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
  // eslint-disable-next-line no-unused-vars
  const currentProduct = localStorage.getItem('selectedApp') || 'cv-builder';
  
  // All hash-based routing removed - user will add navigation one by one

    // Expose function to set ID Card view (for Header to call)
  useEffect(() => {
    window.setIdCardView = (view) => {
      setIdCardView(view);
      // Save to localStorage to persist through page reloads
      localStorage.setItem('idCardView', view);
    };
    // Expose function to navigate to marketplace (for Header to call)
    window.navigateToMarketplace = () => {
      localStorage.setItem('selectedApp', 'marketplace');
      setSelectedApp('marketplace');
    };
    return () => {
      delete window.setIdCardView;
      delete window.navigateToMarketplace;
    };
  }, []);

  // REMOVED: useEffect that was updating state - this was causing React error #301
  // We don't need to sync state here because render function reads directly from localStorage
  // State updates should only happen in event handlers, not in useEffect hooks
  // The routing logic already reads from localStorage directly, so no state sync needed
  
  // Keep forceShowProductsPage true once set - don't reset it automatically
  // It will only be reset when user explicitly navigates to a product via Header buttons
  // This ensures products page stays visible and doesn't redirect

  // Facebook-like navigation: Simple section-based routing
  // CRITICAL: Read directly from localStorage - don't default to marketplace if user is on a dashboard
  const savedAppForNav = localStorage.getItem('selectedApp');
  // CRITICAL: Default to 'cv-builder' NOT 'marketplace' to prevent homepage redirects
  // eslint-disable-next-line no-unused-vars
  const currentSection = savedAppForNav || 'cv-builder';
  
  // Wrap content with TopNav for authenticated users
  const wrapWithTopNav = (content) => {
    if (!isAuthenticated || isLoading) {
      return content;
    }
    // Always read current section from localStorage on every render - don't use React state
    // CRITICAL: Default to 'cv-builder' NOT 'marketplace' to prevent homepage redirects
    const currentSectionForNav = localStorage.getItem('selectedApp') || 'cv-builder';
    return (
      <>
        <Suspense fallback={null}>
          <TopNav 
            currentSection={currentSectionForNav}
            onSectionChange={handleNavigateToSection}
            isAuthenticated={isAuthenticated} 
          />
        </Suspense>
        <div style={{ marginTop: '56px', minHeight: 'calc(100vh - 56px)' }}>
          {content}
        </div>
      </>
    );
  };

  // ============================================
  // FRESH ROUTING SYSTEM - SIMPLIFIED
  // ============================================
  // Single source of truth: localStorage via routing utils
  // No state updates during render - only reads
  // ============================================
  
  // ABSOLUTE PRIORITY: Check for order-details, cart, checkout, order-history FIRST
  // These routes should work even when coming from admin panel
  // Always read directly from window.location.hash to ensure we get the latest value
  const hashToCheck = window.location.hash;
  
  // Check for order details route BEFORE admin check (allows navigation from admin panel)
  if (hashToCheck.startsWith('#order-details')) {
    if (isAuthenticated && !isLoading) {
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <Suspense fallback={<LoadingFallback />}>
              <OrderDetails />
            </Suspense>
          </>
        )
      );
    } else {
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={false} 
            currentProduct="products"
            showProductsOnHeader={true}
          />
          <OrderDetails />
        </>
      );
    }
  }
  
  // Check for admin panel route (both hash-based and clean URL routing)
  // This must take priority over other routing logic (except order-details above)
  // Check this BEFORE authentication check to ensure admin panel always shows
  const isAdminRoute = location.pathname === '/admin' || 
                       location.pathname.startsWith('/admin/') ||
                       hashToCheck === '#admin' || 
                       hashToCheck.startsWith('#admin/') || 
                       hashToCheck.includes('#admin?');
  
  if (isAdminRoute) {
    // Show admin dashboard - it will handle authentication check internally
    // DO NOT wrap with TopNav - admin panel should be full screen
    return (
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
          currentProduct="products"
          showProductsOnHeader={false}
          onLogout={isAuthenticated ? handleLogout : undefined}
        />
        <Suspense fallback={<LoadingFallback />}>
          <AdminDashboard />
        </Suspense>
      </>
    );
  }

  // Check for shopkeeper panel route (both hash-based and clean URL routing)
  // This must take priority over other routing logic (except order-details and admin above)
  const isShopkeeperRoute = location.pathname === '/shopkeeper' || 
                             location.pathname.startsWith('/shopkeeper/') ||
                             hashToCheck === '#shopkeeper' || 
                             hashToCheck.startsWith('#shopkeeper/') || 
                             hashToCheck.includes('#shopkeeper?');
  
  if (isShopkeeperRoute) {
    console.log('Shopkeeper route detected:', { pathname: location.pathname, hash: hashToCheck });
    // Show shopkeeper dashboard - it will handle authentication check internally
    // DO NOT wrap with TopNav - shopkeeper panel should be full screen
    return (
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
          currentProduct="products"
          showProductsOnHeader={false}
          onLogout={isAuthenticated ? handleLogout : undefined}
        />
        <Suspense fallback={<LoadingFallback />}>
          <ShopkeeperDashboard />
        </Suspense>
      </>
    );
  }

  // Check for cart, checkout, and orders routes FIRST (before authentication check)
  // These routes should be accessible to everyone
  const currentHash = window.location.hash;
  if (location.pathname === '/cart' || currentHash === '#cart') {
    return wrapWithTopNav(
      wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={isAuthenticated} 
            currentProduct="products"
            showProductsOnHeader={true}
            onLogout={isAuthenticated ? handleLogout : undefined}
          />
          <Suspense fallback={<LoadingFallback />}>
            <Cart />
          </Suspense>
        </>
      )
    );
  }
  
  if (isAuthenticated && !isLoading) {
    
    // PRIORITY 0: Check pathname FIRST - before any other routing logic
    // This ensures that when user navigates to /cv-builder, we show CV Builder regardless of localStorage
    const pathname = location.pathname;
    
    // Early return for shopkeeper routes - these are handled earlier but double-check here
    if (pathname === '/shopkeeper' || pathname.startsWith('/shopkeeper/')) {
      // This should not happen as shopkeeper routes are handled earlier, but just in case
      return null;
    }
    
    let routingApp = null;
    
    // PRIORITY: If pathname is "/", check for navigation flags FIRST
    // Note: Admin and shopkeeper routes are handled earlier in routing, so they won't reach here
    if (pathname === '/') {
      const navigateToCVBuilderCheck = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                       localStorage.getItem('navigateToCVBuilder') === 'true';
      const navigateToIDCardPrintCheck = sessionStorage.getItem('navigateToIDCardPrint') === 'true' ||
                                         localStorage.getItem('navigateToIDCardPrint') === 'true';
      const hasNavFlags = navigateToCVBuilderCheck || navigateToIDCardPrintCheck;
      
      // If navigation flags are set, set routingApp accordingly
      if (navigateToIDCardPrintCheck) {
        routingApp = 'id-card-print';
        localStorage.setItem('selectedApp', 'id-card-print');
        // DON'T reset idCardView here - preserve it if it's already set to 'print'
        const currentIdCardView = localStorage.getItem('idCardView');
        if (currentIdCardView !== 'print') {
          localStorage.setItem('idCardView', 'dashboard');
        }
        console.log('PRIORITY: pathname is "/" with navigateToIDCardPrint flag - routing to ID Card, idCardView:', localStorage.getItem('idCardView'));
      } else if (navigateToCVBuilderCheck) {
        routingApp = 'cv-builder';
        localStorage.setItem('selectedApp', 'cv-builder');
      } else if (!hasNavFlags) {
        // If no navigation flags, force homepage
        routingApp = null;
        localStorage.removeItem('selectedApp');
        // Clear refs to prevent restoring previous app
        lastKnownAppRef.current = null;
        explicitlyClickedMarketplaceRef.current = false;
        console.log('PRIORITY: pathname is "/" - forcing homepage');
      }
    }
    
    if (pathname === '/cv-builder') {
      // User navigated to CV Builder URL - force CV Builder routing
      routingApp = 'cv-builder';
      localStorage.setItem('selectedApp', 'cv-builder');
      // Clear any navigation flags
      sessionStorage.removeItem('navigateToCVBuilder');
      localStorage.removeItem('navigateToCVBuilder');
    }
    
    if (pathname === '/id-card-print') {
      // User navigated to ID Card Print URL - force ID Card Print routing
      routingApp = 'id-card-print';
      localStorage.setItem('selectedApp', 'id-card-print');
      // DON'T reset idCardView here - preserve it if it's already set to 'print'
      // Only set to 'dashboard' if it's not already set to 'print'
      const currentIdCardView = localStorage.getItem('idCardView');
      if (currentIdCardView !== 'print') {
        localStorage.setItem('idCardView', 'dashboard');
      }
      // Clear any navigation flags
      sessionStorage.removeItem('navigateToIDCardPrint');
      localStorage.removeItem('navigateToIDCardPrint');
      console.log('PRIORITY 0: /id-card-print pathname detected - forcing ID Card Print routing, idCardView:', localStorage.getItem('idCardView'));
    }
    
    // Get current route from routing utility (reads from localStorage)
    // Only use this if pathname didn't force a routing decision
    const route = getRoute();
    const cvView = route.cvView;
    
    // PRIORITY: Check for preview page FIRST (before any other routing logic)
    // This ensures that when cvView is 'preview', we show the preview page
    if (cvView === 'preview') {
      const selectedProduct = localStorage.getItem('selectedApp');
      // Don't show preview if user is on marketplace or id-card-print
      if (selectedProduct !== 'id-card-print' && selectedProduct !== 'marketplace') {
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PreviewPage 
              formData={formData}
              selectedTemplate={selectedTemplate}
              onTemplateSwitch={handleTemplateSwitch}
            />
          </Suspense>
        );
      }
    }
    
    // Check for specific routes FIRST before determining routingApp
    // This prevents routingApp from overriding specific routes like cart, checkout, profile, etc.
    if (pathname === '/cart' || pathname === '/checkout' || pathname.startsWith('/order/') || pathname === '/orders' || pathname === '/profile') {
      // These routes are handled above, but if we reach here, let routingApp be determined normally
      // The route checks above should have caught these, but this is a safety check
      // For profile, we want routingApp to remain null so it doesn't interfere
      if (pathname === '/profile') {
        routingApp = null;
      }
    }
    
    // If pathname didn't force routingApp, use route.app
    // BUT: If pathname is "/" or "/profile", don't use route.app - keep routingApp as null
    if (!routingApp && pathname !== '/' && pathname !== '/profile') {
      routingApp = route.app;
    }
    
    // Check if hash contains product detail route - if so, ensure marketplace routing
    const productHashCheck = window.location.hash;
    const productMatch = productHashCheck.match(/^#product\/(.+)$/);
    if (productMatch && routingApp !== 'marketplace') {
      // User is viewing a product detail page - ensure marketplace routing
      routingApp = 'marketplace';
      setCurrentApp('marketplace');
      explicitlyClickedMarketplaceRef.current = true;
    }
    
    
    // Check for CV Builder flags and pathname (needed for all checks below)
    const navigateToCVBuilderFlag = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                                     localStorage.getItem('navigateToCVBuilder') === 'true';
    const selectedAppIsCVBuilder = localStorage.getItem('selectedApp') === 'cv-builder';
    const isCVBuilderPathname = pathname === '/cv-builder';
    
    // Check for ID Card Print flags and pathname (needed for all checks below)
    const navigateToIDCardPrintFlag = sessionStorage.getItem('navigateToIDCardPrint') === 'true' ||
                                      localStorage.getItem('navigateToIDCardPrint') === 'true';
    const selectedAppIsIDCardPrint = localStorage.getItem('selectedApp') === 'id-card-print';
    const isIDCardPrintPathname = pathname === '/id-card-print';
    
    // PRIORITY 0: Check for navigateToCVBuilder flag FIRST (before homepage check)
    // This ensures CV Builder is accessible when user clicks on it
    // BUT: Only if pathname is not already /cv-builder (already handled above)
    // AND: Only if routingApp is not already set (to avoid overriding earlier decisions)
    if (!routingApp && !isCVBuilderPathname && (navigateToCVBuilderFlag || selectedAppIsCVBuilder)) {
      // User wants CV Builder - set routingApp and clear flag
      routingApp = 'cv-builder';
      localStorage.setItem('selectedApp', 'cv-builder');
      // Clear the flag after using it (but keep selectedApp)
      if (navigateToCVBuilderFlag) {
        sessionStorage.removeItem('navigateToCVBuilder');
        localStorage.removeItem('navigateToCVBuilder');
      }
    }
    
    // PRIORITY 0: Check for navigateToIDCardPrint flag (similar to CV Builder)
    // This ensures ID Card Dashboard is accessible when user clicks on it
    // BUT: Only if pathname is not already /id-card-print (already handled above)
    // AND: Only if routingApp is not already set (to avoid overriding earlier decisions)
    if (!routingApp && !isIDCardPrintPathname && (navigateToIDCardPrintFlag || selectedAppIsIDCardPrint)) {
      // User wants ID Card Dashboard - set routingApp and clear flag
      routingApp = 'id-card-print';
      localStorage.setItem('selectedApp', 'id-card-print');
      // DON'T reset idCardView here - preserve it if it's already set to 'print'
      const currentIdCardView = localStorage.getItem('idCardView');
      if (currentIdCardView !== 'print') {
        localStorage.setItem('idCardView', 'dashboard');
      }
      // Clear the flag after using it (but keep selectedApp)
      if (navigateToIDCardPrintFlag) {
        sessionStorage.removeItem('navigateToIDCardPrint');
        localStorage.removeItem('navigateToIDCardPrint');
      }
      console.log('PRIORITY 0: navigateToIDCardPrint flag or selectedApp=id-card-print detected - routing to ID Card, idCardView:', localStorage.getItem('idCardView'));
    }
    
    // PRIORITY: Check for homepage navigation flag BEFORE any default logic
    const navigateToHomePageFlag = sessionStorage.getItem('navigateToHomePage') === 'true';
    if (navigateToHomePageFlag && !isCVBuilderPathname && !isIDCardPrintPathname && !navigateToCVBuilderFlag && !selectedAppIsCVBuilder && !navigateToIDCardPrintFlag && !selectedAppIsIDCardPrint) {
      // User wants homepage - clear the flag and force homepage
      sessionStorage.removeItem('navigateToHomePage');
      // Clear lastKnownAppRef to prevent restoring CV Builder
      lastKnownAppRef.current = null;
      // Don't set routingApp - let it stay null so homepage shows
      routingApp = null;
      // Clear selectedApp to ensure homepage shows
      localStorage.removeItem('selectedApp');
    }
    
    // CRITICAL: If routingApp is 'marketplace', check if user was actually on it
    // BUT: Don't override if user wants CV Builder (pathname is /cv-builder or flags are set)
    
    if (routingApp === 'marketplace' && !isCVBuilderPathname && !isIDCardPrintPathname && !navigateToCVBuilderFlag && !selectedAppIsCVBuilder && !navigateToIDCardPrintFlag && !selectedAppIsIDCardPrint) {
      // Only redirect away if user was NOT on marketplace (ref doesn't have it) AND didn't explicitly click it
      if (lastKnownAppRef.current !== 'marketplace' && !explicitlyClickedMarketplaceRef.current) {
        // User was NOT on marketplace - restore their actual section
        if (lastKnownAppRef.current && lastKnownAppRef.current !== 'marketplace') {
          routingApp = lastKnownAppRef.current;
          setCurrentApp(routingApp);
          explicitlyClickedMarketplaceRef.current = false;
        } else {
          // No last known app - show homepage (not cv-builder)
          routingApp = null;
          localStorage.removeItem('selectedApp');
          explicitlyClickedMarketplaceRef.current = false;
        }
      }
    } else if (!routingApp && !navigateToHomePageFlag && !isCVBuilderPathname && !isIDCardPrintPathname && !navigateToCVBuilderFlag && !selectedAppIsCVBuilder && !navigateToIDCardPrintFlag && !selectedAppIsIDCardPrint) {
      // routingApp is null/empty - use last known app or show homepage
      // BUT: Don't default if user wants homepage (flag was already checked above)
      // CRITICAL: If pathname is "/", always show homepage regardless of last known app
      if (pathname === '/') {
        routingApp = null;
        localStorage.removeItem('selectedApp');
        lastKnownAppRef.current = null;
      } else if (lastKnownAppRef.current === 'marketplace') {
        // User was on marketplace - restore it
        routingApp = 'marketplace';
        setCurrentApp('marketplace');
        // Keep explicitlyClickedMarketplaceRef.current as is if it was set
      } else if (lastKnownAppRef.current && lastKnownAppRef.current !== 'marketplace') {
        routingApp = lastKnownAppRef.current;
        setCurrentApp(routingApp);
      } else {
        // No last known app - show homepage (not cv-builder)
        routingApp = null;
        localStorage.removeItem('selectedApp');
      }
    }
    
    // Update ref to track current app
    if (routingApp && routingApp !== 'marketplace') {
      lastKnownAppRef.current = routingApp;
    } else if (routingApp === 'marketplace') {
      // Track marketplace if user explicitly clicked it OR if ref already has it (preserved from tab switch)
      if (explicitlyClickedMarketplaceRef.current || lastKnownAppRef.current === 'marketplace') {
        lastKnownAppRef.current = 'marketplace';
      }
    }
    
    
    // cvView was already declared at the beginning for preview check
    // Use it here with default fallback if needed
    const finalCvView = cvView || 'dashboard';
    // eslint-disable-next-line no-unused-vars
    const idCardView = route.idCardView || 'dashboard';
    
    // ============================================
    // CHECKOUT, ORDER DETAILS, RESET PASSWORD - CHECK BEFORE HOMEPAGE
    // (Cart is checked above, before authentication check)
    // ============================================
    const currentHash = window.location.hash;
    
    // Check for checkout route FIRST - support both clean URLs and hash
    // This must be before homepage check to prevent redirect
    if (location.pathname === '/checkout' || currentHash === '#checkout') {
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <Suspense fallback={<LoadingFallback />}>
              <Checkout />
            </Suspense>
          </>
        )
      );
    }
    
    // Check for order details route BEFORE homepage - support both clean URLs and hash
    // This must be before homepage check to prevent redirect
    const orderIdFromParams = params.orderId;
    const orderIdFromPath = getOrderIdFromPath(location.pathname);
    const orderHash = window.location.hash;
    const orderMatch = orderHash.match(/#order-details\?orderId=(.+)/);
    const orderId = orderIdFromParams || orderIdFromPath || (orderMatch ? orderMatch[1] : null);
    
    if (orderId || location.pathname.startsWith('/order/') || currentHash.startsWith('#order-details')) {
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <Suspense fallback={<LoadingFallback />}>
              <OrderDetails />
            </Suspense>
          </>
        )
      );
    }
    
    // Check for password reset route
    if (currentHash === '#reset-password' || currentHash.startsWith('#reset-password') || currentHash.includes('type=recovery')) {
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="home"
              showProductsOnHeader={false}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <Login />
          </>
        )
      );
    }
    
    // Check for profile route BEFORE homepage check - this must be early to prevent routingApp from interfering
    if (location.pathname === '/profile') {
      if (!isAuthenticated) {
        navigate('/');
        return null;
      }
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="home"
              showProductsOnHeader={false}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <Suspense fallback={<LoadingFallback />}>
              <UserProfile />
            </Suspense>
          </>
        )
      );
    }
    
    // ============================================
    // HOMEPAGE SECTION - CHECK when routingApp is null
    // ============================================
    if (!routingApp || routingApp === null) {
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={isAuthenticated} 
            currentProduct="home"
            showProductsOnHeader={false}
            onLogout={isAuthenticated ? handleLogout : undefined}
          />
          <HomePage />
        </>
      );
    }
    
    // Check for order history route - support both clean URLs and hash
    if (location.pathname === '/orders' || currentHash === '#order-history') {
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <Suspense fallback={<LoadingFallback />}>
              <OrderHistory />
            </Suspense>
          </>
        )
      );
    }
    
    // ============================================
    // MARKETPLACE SECTION - CHECK SECOND to prevent override
    // ============================================
    if (routingApp === 'marketplace') {
      // Check if we're viewing a product detail page - support both clean URLs and hash
      const productIdFromParams = params.productId;
      const productIdFromPath = getProductIdFromPath(location.pathname);
      const productHash = window.location.hash;
      const productMatch = productHash.match(/^#product\/(.+)$/);
      const productId = productIdFromParams || productIdFromPath || (productMatch ? productMatch[1] : null);
      
      if (productId) {
        return wrapWithTopNav(
          wrapWithNavbar(
            <>
              <Header 
                isAuthenticated={isAuthenticated} 
                currentProduct="products"
                showProductsOnHeader={true}
                onLogout={isAuthenticated ? handleLogout : undefined}
              />
              <Suspense fallback={<LoadingFallback />}>
                <ProductDetail productId={productId} />
              </Suspense>
            </>
          )
        );
      }
      
      // Check if login form should be shown
      const shouldShowLogin = sessionStorage.getItem('showLoginForm') === 'true' ||
                              localStorage.getItem('showLoginForm') === 'true';
      return wrapWithTopNav(
        wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={isAuthenticated} 
              currentProduct="products"
          showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <ProductsPage showLoginOnMount={shouldShowLogin} />
          </>
        )
      );
    }
    
    // ============================================
    // CV BUILDER SECTION
    // ============================================
    if (routingApp === 'cv-builder') {
      // Check if user wants to see the form (cvView === 'cv-builder' OR currentView === 'cv-builder')
      // This takes priority over showing the dashboard
      if (finalCvView === 'cv-builder' || currentView === 'cv-builder') {
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
                  <Form1 
                    key={formResetKey}
                    formData={formData}
                    updateFormData={updateFormData}
                    markAsChanged={hookMarkAsChanged}
                  />
                  <Preview2 
                    formData={formData}
                    autoSaveStatus={hookAutoSaveStatus}
                    hasUnsavedChanges={hookHasUnsavedChanges}
                    updateFormData={updateFormData}
                  />
                </>
              );
            case 'template3':
              return (
                <>
                  <Form1 
                    key={formResetKey}
                    formData={formData}
                    updateFormData={updateFormData}
                    markAsChanged={hookMarkAsChanged}
                  />
                  <Preview3 
                    formData={formData}
                    autoSaveStatus={hookAutoSaveStatus}
                    hasUnsavedChanges={hookHasUnsavedChanges}
                    isPreviewPage={false}
                  />
                </>
              );
            case 'template4':
              return (
                <>
                  <Form1 
                    key={formResetKey}
                    formData={formData}
                    updateFormData={updateFormData}
                    markAsChanged={hookMarkAsChanged}
                  />
                  <Preview4 
                    formData={formData}
                    autoSaveStatus={hookAutoSaveStatus}
                    hasUnsavedChanges={hookHasUnsavedChanges}
                    selectedTemplate={selectedTemplate}
                    onTemplateSwitch={handleTemplateSwitch}
                    isPreviewPage={false}
                    updateFormData={updateFormData}
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
                    selectedTemplate={selectedTemplate}
                    onTemplateSwitch={handleTemplateSwitch}
                    isPreviewPage={false}
                    updateFormData={updateFormData}
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
                  {currentCVId && (
                    <button 
                      onClick={handleDuplicateCV} 
                      className="duplicate-cv-button"
                      style={{ 
                        padding: '10px 18px',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: 'white',
                        backgroundColor: '#0d9488',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '8px',
                        boxShadow: '0 2px 6px rgba(13, 148, 136, 0.4)'
                      }}
                      title="Create a copy of this CV to edit experience/education separately"
                    >
                      📋 Duplicate CV
                    </button>
                  )}
                  <button 
                    onClick={handleShareApp} 
                    className="share-button-header"
                    style={{ 
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
                      backgroundColor: '#3b82f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                    title="Share App & Get Free Credit"
                  >
                    📤 Share App & Get Free Credit
                  </button>
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
            <Suspense fallback={<LoadingFallback />}>
              <CVDashboard 
                onTemplateSelect={handleTemplateSelect}
                onLogout={handleLogout}
                onEditCV={handleEditCV}
                onCreateNewCV={handleMakeNewCV}
              />
            </Suspense>
      </>
        )
    );
  }
    
    // ============================================
    // ID CARD PRINTER SECTION
    // ============================================
    if (routingApp === 'id-card-print') {
      // Check if user wants to see the print page
      // This takes priority over showing the dashboard
      // Read from localStorage directly to avoid state sync issues
      // CRITICAL: If printing is in progress, always show print page
      const printingInProgress = localStorage.getItem('idCardPrintingInProgress') === 'true';
      const currentIdCardView = localStorage.getItem('idCardView') || 'dashboard';
      if (printingInProgress || currentIdCardView === 'print') {
        const handleBackToIDCardDashboard = () => {
          // Clear saved ID card designs when navigating back to dashboard
          localStorage.removeItem('idCardDesigns');
          sessionStorage.removeItem('idCardPrintSessionActive');
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
              onCreateNewIDCard={handleCreateNewIDCard}
            />
      </>
        )
    );
  }
  }
  
  // PRIORITY: Check if we should show CV Builder form/preview FIRST
  // This ensures that when currentView is 'cv-builder', we show the form instead of dashboard
  // CRITICAL: Don't show CV form if user is on marketplace
  if (currentView === 'cv-builder' && isAuthenticated && !isLoading) {
    const selectedProduct = localStorage.getItem('selectedApp');
    // Don't show CV form if user is on marketplace or id-card-print
    if (selectedProduct !== 'id-card-print' && selectedProduct !== 'marketplace') {
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
                  selectedTemplate={selectedTemplate}
                  onTemplateSwitch={handleTemplateSwitch}
                />
              </>
            );
          case 'template2':
            return (
              <>
                <Form1 
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
                <Preview3 
                  formData={formData}
                  autoSaveStatus={hookAutoSaveStatus}
                  hasUnsavedChanges={hookHasUnsavedChanges}
                  isPreviewPage={false}
                />
              </>
            );
          case 'template4':
            return (
              <>
                <Form1 
                  key={formResetKey}
                  formData={formData}
                  updateFormData={updateFormData}
                  markAsChanged={hookMarkAsChanged}
                />
                <Preview4 
                  formData={formData}
                  autoSaveStatus={hookAutoSaveStatus}
                  hasUnsavedChanges={hookHasUnsavedChanges}
                  selectedTemplate={selectedTemplate}
                  onTemplateSwitch={handleTemplateSwitch}
                  isPreviewPage={false}
                  updateFormData={updateFormData}
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
                  selectedTemplate={selectedTemplate}
                  onTemplateSwitch={handleTemplateSwitch}
                  isPreviewPage={false}
                  updateFormData={updateFormData}
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
              {currentCVId && (
                <button 
                  onClick={handleDuplicateCV} 
                  className="duplicate-cv-button"
                  style={{ 
                    padding: '10px 18px',
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'white',
                    backgroundColor: '#0d9488',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginRight: '8px',
                    boxShadow: '0 2px 6px rgba(13, 148, 136, 0.4)'
                  }}
                  title="Create a copy of this CV to edit experience/education separately"
                >
                  📋 Duplicate CV
                </button>
              )}
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
                <Form1 formData={formData} updateFormData={updateFormData} />
                <Preview2 formData={formData} updateFormData={updateFormData} />
              </>
            );
          case 'template3':
            return (
              <>
                <Preview3 formData={formData} isPreviewPage={false} />
              </>
            );
          case 'template5':
            return (
              <>
                <Form5 formData={formData} updateFormData={updateFormData} />
                <Preview5 formData={formData} updateFormData={updateFormData} />
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
              {currentCVId && (
                <button 
                  onClick={handleDuplicateCV} 
                  className="duplicate-cv-button"
                  style={{ 
                    padding: '10px 18px',
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'white',
                    backgroundColor: '#0d9488',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginRight: '8px',
                    boxShadow: '0 2px 6px rgba(13, 148, 136, 0.4)'
                  }}
                  title="Create a copy of this CV to edit experience/education separately"
                >
                  📋 Duplicate CV
                </button>
              )}
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
        <Suspense fallback={<LoadingFallback />}>
          <CVDashboard 
            onTemplateSelect={handleTemplateSelect}
            onLogout={handleLogout}
            onEditCV={handleEditCV}
            onCreateNewCV={handleMakeNewCV}
          />
        </Suspense>
      </>
    );
  }
  
  // PRIORITY: Check if we should show CV Builder form/preview
  // This ensures that when currentView is 'cv-builder', we show the form instead of products page
  // ABSOLUTE PRIORITY: If currentView is 'cv-builder', show it regardless of products page flags
  if (currentView === 'cv-builder' && isAuthenticated && !isLoading) {
    const selectedProduct = localStorage.getItem('selectedApp');
    if (selectedProduct !== 'id-card-print') {
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
                updateFormData={updateFormData}
              />
            </>
          );
        case 'template2':
          return (
            <>
              <Form1 
                key={formResetKey}
                formData={formData}
                updateFormData={updateFormData}
                markAsChanged={hookMarkAsChanged}
              />
              <Preview2 
                formData={formData}
                autoSaveStatus={hookAutoSaveStatus}
                hasUnsavedChanges={hookHasUnsavedChanges}
                updateFormData={updateFormData}
              />
            </>
          );
        case 'template3':
          return (
            <>
              <Form1 
                key={formResetKey}
                formData={formData}
                updateFormData={updateFormData}
                markAsChanged={hookMarkAsChanged}
              />
              <Preview3 
                formData={formData}
                autoSaveStatus={hookAutoSaveStatus}
                hasUnsavedChanges={hookHasUnsavedChanges}
                isPreviewPage={false}
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
                updateFormData={updateFormData}
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
              {currentCVId && (
                <button 
                  onClick={handleDuplicateCV} 
                  className="duplicate-cv-button"
                  style={{ 
                    padding: '10px 18px',
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'white',
                    backgroundColor: '#0d9488',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginRight: '8px',
                    boxShadow: '0 2px 6px rgba(13, 148, 136, 0.4)'
                  }}
                  title="Create a copy of this CV to edit experience/education separately"
                >
                  📋 Duplicate CV
                </button>
              )}
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
    
    // Check for cart, checkout, order-details, or reset-password routes FIRST (these should work for unauthenticated users too)
    const hash = window.location.hash;
    
    // Check for password reset route
    if (hash === '#reset-password' || hash.startsWith('#reset-password') || hash.includes('type=recovery')) {
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={false} 
            currentProduct="home"
            showProductsOnHeader={false}
          />
          <Login />
        </>
      );
    }
    
    if (hash === '#cart') {
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={false} 
            currentProduct="products"
            showProductsOnHeader={true}
          />
          <Cart />
        </>
      );
    }
    
    if (location.pathname === '/checkout' || hash === '#checkout') {
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={false} 
            currentProduct="products"
            showProductsOnHeader={true}
          />
          <Checkout />
        </>
      );
    }
    
    if (hash.startsWith('#order-details')) {
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={false} 
            currentProduct="products"
            showProductsOnHeader={true}
          />
          <OrderDetails />
        </>
      );
    }
    
    // Check if user wants to see products page (marketplace) - either via hash or flag
    // Support both clean URLs and hash routes for product detail
    const productIdFromParams = params.productId;
    const productIdFromPath = getProductIdFromPath(location.pathname);
    const productMatch = hash.match(/^#product\/(.+)$/);
    const productId = productIdFromParams || productIdFromPath || (productMatch ? productMatch[1] : null);
    // Support both clean URLs and hash routes
    const wantsProductsPage = location.pathname === '/marketplace' ||
                              location.pathname.startsWith('/product/') ||
                              hash === '#products' ||
                              hash.startsWith('#product/') ||
                              localStorage.getItem('showProductsPage') === 'true' ||
                              sessionStorage.getItem('showProductsPage') === 'true' ||
                              localStorage.getItem('selectedApp') === 'marketplace';
    
    // Only clear navigation flags if there's no navigation intent (direct visit to homepage)
    // BUT: Don't clear selectedApp for unauthenticated users - preserve it for when they log in
    if (!hasNavigationIntent && !wantsProductsPage) {
      // Don't clear selectedApp - preserve user's intended destination
      // This ensures they go to the right place after logging in
      
      // Clear any stale navigation flags that might persist from previous sessions
      sessionStorage.removeItem('navigateToCVBuilder');
      sessionStorage.removeItem('navigateToIDCardPrint');
      localStorage.removeItem('navigateToCVBuilder');
      localStorage.removeItem('navigateToIDCardPrint');
      
      // CRITICAL: Don't set marketplace automatically - preserve current section
      // Only set if truly no section exists, and default to cv-builder instead of marketplace
      const currentSection = localStorage.getItem('selectedApp');
      if (!currentSection) {
        // No section exists - default to CV Builder instead of marketplace
        // This prevents redirect to homepage when switching tabs
        setTimeout(() => {
          if (!localStorage.getItem('selectedApp')) {
            localStorage.setItem('selectedApp', 'cv-builder');
            startTransition(() => {
      setSelectedApp('cv-builder');
    });
          }
        }, 0);
      }
      // If currentSection exists, preserve it - don't override
    }
    
    // Only show login directly if there's explicit navigation intent (meaning they're trying to access a dashboard directly)
    if (hasNavigationIntent && !wantsProductsPage) {
      return wrapWithNavbar(
        <Login onAuth={handleAuth} />
      );
    }
    
    // Show ProductsPage (Marketplace) if user wants to see it or has navigation intent
    if (wantsProductsPage || hasNavigationIntent) {
      // Check if we're viewing a product detail page
      if (productId) {
        return wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={false} 
              currentProduct="products"
              showProductsOnHeader={true}
            />
            <ProductDetail productId={productId} />
          </>
        );
      }
      
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={false} 
            currentProduct="products"
            showProductsOnHeader={true}
          />
          <ProductsPage showLoginOnMount={hasNavigationIntent || wantsProductsPage} />
        </>
      );
    }
    
    // Show HomePage for unauthenticated users without navigation intent or products page request
    return wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={false} 
          currentProduct="home"
          showProductsOnHeader={false}
        />
        <HomePage />
      </>
    );
  }
  
  // Handle authenticated users - check if they want to see homepage
  if (isAuthenticated && !isLoading) {
    const finalSelectedApp = localStorage.getItem('selectedApp');
    const navigateToHomePageFlag = sessionStorage.getItem('navigateToHomePage') === 'true';
    
    // Check if user explicitly wants to see homepage (navigation flag takes priority)
    // If navigateToHomePage flag is set, always show homepage regardless of selectedApp
    if (navigateToHomePageFlag) {
      // User explicitly navigated to homepage - show it
      // Clear navigation flags after using them
      sessionStorage.removeItem('isNavigating');
      sessionStorage.removeItem('navigateToHomePage');
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={true} 
            currentProduct="home"
            showProductsOnHeader={false}
            onLogout={handleLogout}
          />
          <HomePage />
        </>
      );
    }
    
    // If finalSelectedApp is null/empty AND selectedApp state is empty string, show homepage
    // This handles the case when user clicks Home button and selectedApp is cleared
    if ((!finalSelectedApp || finalSelectedApp === '') && (selectedApp === '' || !selectedApp)) {
      // User navigated to homepage - show it
      return wrapWithNavbar(
        <>
          <Header 
            isAuthenticated={true} 
            currentProduct="home"
            showProductsOnHeader={false}
            onLogout={handleLogout}
          />
          <HomePage />
        </>
      );
    }
    
    // If finalSelectedApp is null/empty, try to preserve current state
    // Only use selectedApp if it has a value (not empty string - empty string means homepage)
    let appToShow = finalSelectedApp || (selectedApp && selectedApp !== '' ? selectedApp : null);
    
    // If no app is selected, check if we should show homepage or preserve current view
    // BUT: Don't check currentView if user explicitly navigated to homepage (flag was already handled in routing logic above)
    if (!appToShow) {
      // Check if we should show homepage or default to cv-builder based on context
      // If user was on a dashboard, preserve that state (unless they explicitly navigated to homepage)
      // The navigateToHomePage flag was already checked in the routing logic above, so if we reach here,
      // it means the flag was not set, so we can check currentView
      if (currentView === 'cv-builder') {
        appToShow = 'cv-builder';
      } else if (idCardView === 'print') {
        appToShow = 'id-card-print';
      } else {
        // No context and no selectedApp - show homepage instead of defaulting to cv-builder
        return wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={true} 
              currentProduct="home"
              showProductsOnHeader={false}
              onLogout={handleLogout}
            />
            <HomePage />
          </>
        );
      }
    }
    
    // If user is on CV Builder or ID Card, show it - NEVER show marketplace unless explicitly set
    if (appToShow === 'cv-builder') {
      return wrapWithTopNav(
        wrapWithNavbar(
      <>
        <Header 
          isAuthenticated={true} 
          onLogout={handleLogout}
          currentProduct="cv-builder"
        />
        <Suspense fallback={<LoadingFallback />}>
          <CVDashboard 
            onTemplateSelect={handleTemplateSelect}
            onLogout={handleLogout}
            onEditCV={handleEditCV}
            onCreateNewCV={handleMakeNewCV}
          />
        </Suspense>
      </>
        )
    );
  }
  
    if (appToShow === 'id-card-print') {
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
            <div className="app-header-cv">
              <h1>ID Card Printer</h1>
              <button 
                onClick={handleBackToIDCardDashboard} 
                className="back-to-dashboard-button"
              >
                Back to Dashboard
              </button>
            </div>
            <div className="id-card-print-content-wrapper">
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
              onCreateNewIDCard={handleCreateNewIDCard}
            />
          </>
        )
      );
    }
  
    // Only show marketplace if explicitly set to marketplace
    // CRITICAL: Don't default to marketplace if appToShow is null/empty
    // This prevents redirect to homepage when switching tabs
    if (appToShow === 'marketplace') {
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
        <Suspense fallback={<LoadingFallback />}>
          <CVDashboard 
            onTemplateSelect={handleTemplateSelect}
            onLogout={handleLogout}
            onEditCV={handleEditCV}
            onCreateNewCV={handleMakeNewCV}
          />
        </Suspense>
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