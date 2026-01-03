import React, { useState, useEffect, startTransition } from 'react';
import './App.css';
import { SupabaseProvider } from './components/Supabase';
import Login from './components/Login/Login';
import CVDashboard from './components/Dashboard/CVDashboard';
import Form1 from './components/template1/Form1';
import Preview1 from './components/template1/Preview1';
import Preview2 from './components/template2/Preview2';
import Preview3 from './components/template3/Preview3';
import Preview4 from './components/template4/Preview4';
import useAutoSave from './components/Supabase/useAutoSave';
import { authService, supabase } from './components/Supabase/supabase';
import IDCardPrintPage from './components/IDCardPrint/IDCardPrintPage';
import IDCardDashboard from './components/IDCardDashboard/IDCardDashboard';
import ProductsPage from './components/Products/Marketplace';
import HomePage from './components/HomePage/HomePage';
import Header from './components/Header/Header';
import MarketplaceAdmin from './components/MarketplaceAdmin/MarketplaceAdmin';
import AdminDashboard from './components/Admin/AdminDashboard';
import ProductDetail from './components/Products/ProductDetail';
import Cart from './components/Cart/Cart';
import Checkout from './components/Checkout/Checkout';
import OrderDetails from './components/OrderDetails/OrderDetails';
import OrderHistory from './components/OrderHistory/OrderHistory';
import LeftNavbar from './components/Navbar/LeftNavbar';
import TopNav from './components/TopNav/TopNav';
import PreviewPage from './components/PreviewPage/PreviewPage';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { getCurrentApp, setCurrentApp, getCVView, setCVView, getIDCardView, setIDCardView, getRoute } from './utils/routing';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [currentView, setCurrentView] = useState('dashboard');
  // Initialize idCardView from localStorage if available, otherwise default to 'dashboard'
  const [idCardView, setIdCardView] = useState(() => {
    const savedView = localStorage.getItem('idCardView');
    return savedView === 'print' ? 'print' : 'dashboard';
  });
  // Initialize selectedApp from localStorage, but don't write to localStorage during init
  // Writing during init can cause React error #301
  // CRITICAL: Default to empty string to allow homepage to show
  const [selectedApp, setSelectedApp] = useState(() => {
    // Read from localStorage - preserve user's current section
    const savedApp = localStorage.getItem('selectedApp');
    if (savedApp) {
      return savedApp; // Preserve user's section
    }
    // First visit - return empty string to allow homepage to show
    // It will be written when user navigates or in event handlers
    return '';
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
    languages: [],
    hobbies: [],
    references: [],
    otherInfo: [],
    customSection: []
  });

  // Debug: Track formData changes
  useEffect(() => {
    console.log('[App] ========== formData State Changed ==========');
    console.log('[App] formData changed');
    console.log('[App] formData.languages:', formData.languages);
    console.log('[App] formData.languages length:', formData.languages?.length);
    console.log('[App] formData.languages is array:', Array.isArray(formData.languages));
    if (Array.isArray(formData.languages)) {
      console.log('[App] formData.languages structure:', formData.languages.map((lang, idx) => ({
        index: idx,
        type: typeof lang,
        value: lang,
        isString: typeof lang === 'string',
        isObject: typeof lang === 'object' && lang !== null
      })));
    }
    console.log('[App] ========== formData State Change Completed ==========');
  }, [formData]);
  // Local state for UI (will be overridden by hook)
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const productDetailIdRef = React.useRef(null); // Ref to access current productDetailId in callbacks
  const sessionCheckIntervalRef = React.useRef(null); // Ref for session check interval
  const hasInitializedRef = React.useRef(false);
  const isMountedRef = React.useRef(false); // Track if component has finished initial render
  const ignoreInitialSessionRef = React.useRef(true); // Ignore first INITIAL_SESSION event
  const lastKnownAppRef = React.useRef(null); // Track last known app to prevent redirects
  const explicitlyClickedMarketplaceRef = React.useRef(false); // Track if user explicitly clicked marketplace
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


  // Listen for hash changes to trigger re-renders when admin panel is accessed
  React.useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    
    // Set initial hash
    setCurrentHash(window.location.hash);
    
    // Listen for hash changes
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
      // Force re-render by updating hash state
      setCurrentHash('');
      // Force a re-render by updating selectedApp state and resetting currentView
      startTransition(() => {
        setSelectedApp('');
        setCurrentView('dashboard'); // Reset currentView to prevent CV Builder from showing
      });
    };
    
    window.addEventListener('navigateToHomePage', handleHomePageNavigation);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('navigateToHomePage', handleHomePageNavigation);
    };
  }, []);

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
      
      console.log('App.js - Data loading check (MOUNT):', { 
        returningFromPreview, 
        goToCVForm,
        cvView, 
        currentHash,
        hasStoredData: !!localStorage.getItem('cvFormData'),
        currentFormDataName: formData.name,
        timestamp: new Date().toISOString()
      });
      
      // If returning from preview OR goToCVForm flag is set, ALWAYS load from localStorage
      // This is the primary condition - don't check other things first
      if (returningFromPreview || goToCVForm) {
        const storedData = localStorage.getItem('cvFormData');
        console.log('App.js - Flags detected, checking stored data. Stored data exists:', !!storedData);
        
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            const hasStoredData = parsedData.name || parsedData.education?.length > 0 || parsedData.experience?.length > 0;
            
            console.log('App.js - Parsed data:', { 
              hasName: !!parsedData.name, 
              name: parsedData.name,
              educationCount: parsedData.education?.length || 0,
              experienceCount: parsedData.experience?.length || 0,
              hasStoredData 
            });
            
            if (hasStoredData) {
              console.log('App.js - *** LOADING formData from localStorage ***');
              console.log('App.js - Flags that triggered load:', { returningFromPreview, goToCVForm });
              console.log('App.js - Data being loaded:', parsedData);
              
              // Normalize languages if needed (convert strings to objects)
              if (parsedData.languages) {
                parsedData.languages = normalizeLanguages(parsedData.languages);
                console.log('App.js - Normalized languages:', parsedData.languages);
              }
              
              // Load the data IMMEDIATELY
              setFormData(parsedData);
              
              // Verify data was set (check on next tick after state update)
              setTimeout(() => {
                // Read from localStorage again to verify
                const verifyData = localStorage.getItem('cvFormData');
                if (verifyData) {
                  try {
                    const verifyParsed = JSON.parse(verifyData);
                    console.log('App.js - Verification: Data still in localStorage after setFormData:', {
                      hasName: !!verifyParsed.name,
                      name: verifyParsed.name,
                      educationCount: verifyParsed.education?.length || 0,
                      experienceCount: verifyParsed.experience?.length || 0
                    });
                  } catch (e) {
                    console.error('App.js - Verification: Error parsing verify data:', e);
                  }
                }
              }, 50);
              
              // Clear the flags AFTER setting the data
              localStorage.removeItem('returningFromPreview');
              sessionStorage.removeItem('goToCVForm');
              localStorage.removeItem('goToCVForm');
              
              console.log('App.js - Form data loaded and flags cleared');
              return true; // Successfully loaded
            } else {
              console.warn('App.js - Stored data exists but is empty, not loading');
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
          console.warn('App.js - No stored data found in localStorage, but flags were set');
          console.warn('App.js - Available localStorage keys:', Object.keys(localStorage));
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
              console.log('App.js - Loading formData from localStorage (form is empty):', parsedData);
              // Normalize languages if needed
              if (parsedData.languages) {
                parsedData.languages = normalizeLanguages(parsedData.languages);
                console.log('App.js - Normalized languages:', parsedData.languages);
              }
              setFormData(parsedData);
              return true;
            } else if (hasStoredData && hasCurrentData) {
              // If both have data, prefer stored data if it's more complete
              const storedDataComplete = (parsedData.education?.length || 0) + (parsedData.experience?.length || 0);
              const currentDataComplete = (formData.education?.length || 0) + (formData.experience?.length || 0);
              if (storedDataComplete > currentDataComplete) {
                console.log('App.js - Loading formData from localStorage (stored data is more complete):', parsedData);
                // Normalize languages if needed
                if (parsedData.languages) {
                  parsedData.languages = normalizeLanguages(parsedData.languages);
                  console.log('App.js - Normalized languages:', parsedData.languages);
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
        console.log('App.js - Initial load failed, retrying after 100ms...');
        const retryTimeout = setTimeout(() => {
          const retryLoaded = attemptLoadData();
          if (!retryLoaded) {
            console.warn('App.js - Retry also failed, trying one more time after 300ms...');
            setTimeout(() => {
              attemptLoadData();
            }, 300);
          }
        }, 100);
        
        return () => clearTimeout(retryTimeout);
      }
    }
  }, []); // Run ONLY on mount - page reload will trigger this

  // Removed localStorage saving on page unload - form data will reset on page reload

  // Auto-save happens automatically every 10 seconds

  // Mark as changed - using hook's markAsChanged instead

  // Update form data
  const updateFormData = (newData) => {
    console.log('[App] ========== updateFormData called ==========');
    console.log('[App] Current formData.languages:', formData.languages);
    console.log('[App] Current formData.languages length:', formData.languages?.length);
    console.log('[App] New data.languages:', newData.languages);
    console.log('[App] New data.languages length:', newData.languages?.length);
    console.log('[App] Languages changed:', formData.languages !== newData.languages);
    console.log('[App] Languages length changed:', formData.languages?.length !== newData.languages?.length);
    if (Array.isArray(newData.languages)) {
      console.log('[App] New data.languages structure:', newData.languages.map((lang, idx) => ({
        index: idx,
        type: typeof lang,
        value: lang,
        isString: typeof lang === 'string',
        isObject: typeof lang === 'object' && lang !== null
      })));
    }
    console.log('[App] Full newData:', newData);
    console.log('[App] Calling setFormData...');
    setFormData(newData);
    console.log('[App] setFormData called - React will schedule a re-render');
    console.log('[App] Calling hookMarkAsChanged...');
    hookMarkAsChanged(); // Use hook's markAsChanged instead of local state
    console.log('[App] hookMarkAsChanged called');
    console.log('[App] ========== updateFormData completed ==========');
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
    console.log('App.js: handleMakeNewCV called - creating new CV');
    
    // Check if we're returning from preview - if so, load data from localStorage
    const returningFromPreview = localStorage.getItem('returningFromPreview') === 'true';
    if (returningFromPreview) {
      console.log('App.js - Returning from preview, loading form data from localStorage');
      const storedData = localStorage.getItem('cvFormData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log('App.js - Loading formData from localStorage in handleMakeNewCV:', parsedData);
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
      professionalSummary: '',
      education: [],
      experience: [],
      skills: ['Communication Skills', 'Time Management', 'Problem Solving', 'Hardworking'],
      certifications: [],
      languages: [],
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
    
    console.log('handleMakeNewCV - Form view activated');
  }, [createNewCV]);

  // Fresh handler for "Create New ID Card" button - Rebuilt from scratch
  const handleCreateNewIDCard = React.useCallback(() => {
    console.log('App.js: handleCreateNewIDCard called');
    setCurrentApp('id-card-print');
    setIDCardView('print');
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
              setIsLoading(false);
          } else if (session?.user) {
            setIsAuthenticated(true);
            localStorage.setItem('cvBuilderAuth', 'true');
              setIsLoading(false);
          } else {
            setIsAuthenticated(false);
            localStorage.removeItem('cvBuilderAuth');
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
      }
      // REMOVED: finally block - loading state is now set in each branch above
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
            startTransition(() => {
              setSelectedApp('marketplace');
            });
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
            startTransition(() => {
              setSelectedApp('marketplace');
            });
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
            startTransition(() => {
              setSelectedApp('marketplace');
            });
            
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
      localStorage.setItem('selectedApp', 'cv-builder');
      startTransition(() => {
      setSelectedApp('cv-builder');
    });
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
    // ULTRA-AGGRESSIVE: NEVER allow marketplace unless user explicitly clicked it
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Tab regained focus - IMMEDIATELY preserve current state
        // Priority 1: Check localStorage
        let appToPreserve = localStorage.getItem('selectedApp');
        
        // CRITICAL: If appToPreserve is 'marketplace', check if user was actually on it
        // Preserve marketplace if ref has it (user was on it when tab lost focus)
        if (appToPreserve === 'marketplace') {
          // Check if user was actually on marketplace
          if (lastKnownAppRef.current === 'marketplace') {
            // User was on marketplace - preserve it
            // Update localStorage to ensure marketplace is preserved
            setCurrentApp('marketplace');
            // Keep explicitlyClickedMarketplaceRef.current as is (don't clear it)
          } else {
            // User was NOT on marketplace - restore their actual section
            if (lastKnownAppRef.current && lastKnownAppRef.current !== 'marketplace') {
              appToPreserve = lastKnownAppRef.current;
            } else {
              // Infer from React state
              if (currentView === 'cv-builder') {
                appToPreserve = 'cv-builder';
              } else if (idCardView === 'print') {
                appToPreserve = 'id-card-print';
              } else {
                // No evidence of any app - preserve homepage instead of defaulting to cv-builder
                appToPreserve = null;
              }
            }
            setCurrentApp(appToPreserve);
            explicitlyClickedMarketplaceRef.current = false; // Clear flag
          }
        } else if (!appToPreserve) {
          // Priority 2: If localStorage is empty, check if user is on homepage
          // Only restore from lastKnownAppRef if it has a valid value
          if (lastKnownAppRef.current === 'marketplace') {
            // User was on marketplace - restore it
            appToPreserve = 'marketplace';
            setCurrentApp('marketplace');
            // Keep explicitlyClickedMarketplaceRef.current as is if it was set
          } else if (lastKnownAppRef.current && lastKnownAppRef.current !== 'marketplace') {
            appToPreserve = lastKnownAppRef.current;
            setCurrentApp(appToPreserve);
          } else {
            // Priority 3: Infer from React state only if there's evidence of active use
            // If no evidence, preserve null to keep homepage
            if (currentView === 'cv-builder') {
              appToPreserve = 'cv-builder';
              setCurrentApp(appToPreserve);
            } else if (idCardView === 'print') {
              appToPreserve = 'id-card-print';
              setCurrentApp(appToPreserve);
            }
            // If no evidence of active use, keep appToPreserve as null/empty to preserve homepage
            // DO NOT default to 'cv-builder' when on homepage
          }
        }
        
        // Update ref to track this as last known app
        // Only update ref if appToPreserve has a valid value (not null/empty)
        if (appToPreserve && appToPreserve !== 'marketplace') {
          lastKnownAppRef.current = appToPreserve;
        } else if (appToPreserve === 'marketplace') {
          // Track marketplace if user was on it (ref already has it) or explicitly clicked it
          if (lastKnownAppRef.current === 'marketplace' || explicitlyClickedMarketplaceRef.current) {
            lastKnownAppRef.current = 'marketplace';
          }
        } else if (!appToPreserve) {
          // If appToPreserve is null/empty (homepage), clear the ref to prevent restoring a previous app
          lastKnownAppRef.current = null;
        }
        
        // Sync React state - only update if appToPreserve has a value, otherwise preserve null/empty for homepage
        startTransition(() => {
          setSelectedApp(appToPreserve || '');
        });
      } else if (document.hidden && isAuthenticated) {
        // Tab lost focus - save current app to ref
        const currentApp = getCurrentApp();
        if (currentApp === 'marketplace') {
          // User is on marketplace - always save it to ref to preserve state
          lastKnownAppRef.current = 'marketplace';
          // Keep explicitlyClickedMarketplaceRef.current as is (don't clear it)
        } else if (currentApp && currentApp !== 'marketplace') {
          lastKnownAppRef.current = currentApp;
          explicitlyClickedMarketplaceRef.current = false; // Clear flag on tab switch
        } else if (selectedApp && selectedApp !== 'marketplace') {
          lastKnownAppRef.current = selectedApp;
          explicitlyClickedMarketplaceRef.current = false;
        } else if (!currentApp && !selectedApp) {
          // User is on homepage - clear ref to prevent restoring a previous app
          lastKnownAppRef.current = null;
          explicitlyClickedMarketplaceRef.current = false;
        }
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
        
        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY') {
          console.log('PASSWORD_RECOVERY event detected in App.js');
          // The Login component will handle showing the reset form
          // Just ensure we're on the right route
          if (!window.location.hash.includes('#reset-password') && !window.location.hash.includes('type=recovery')) {
            window.location.hash = '#reset-password';
          }
          return; // Don't process as a normal sign-in
        }
        
        // Handle user type for Google OAuth sign-in (before state updates)
        if (event === 'SIGNED_IN' && session?.user) {
          const isOAuthCallback = window.location.hash.includes('access_token') || 
                                  window.location.hash.includes('code') ||
                                  window.location.search.includes('code') ||
                                  sessionStorage.getItem('googleSignInStarted') === 'true';
          
          if (isOAuthCallback) {
            const pendingUserType = sessionStorage.getItem('pendingUserType');
            if (pendingUserType) {
              // Check if user already has user_type in metadata
              const currentUserType = session.user.user_metadata?.user_type;
              
              // Only set user_type if it doesn't exist yet (new user)
              // If user already has a type, don't allow changing it (prevents users from switching types)
              if (!currentUserType) {
                // New user - set the user type
                try {
                  await authService.updateUserMetadata({
                    user_type: pendingUserType,
                    ...session.user.user_metadata // Preserve existing metadata
                  });
                  console.log('User type set to:', pendingUserType);
                } catch (err) {
                  console.error('Error setting user type:', err);
                  // If error is about not being able to change type, that's expected for existing users
                  if (err.message && err.message.includes('cannot change your own user type')) {
                    console.log('User already has a type set, cannot change it');
                  }
                }
              } else {
                // User already has a type - check if it matches the selected type
                if (currentUserType !== pendingUserType) {
                  // User is trying to sign in with a different type than they signed up with
                  console.error('User type mismatch:', currentUserType, 'vs', pendingUserType);
                  
                  // Clear pending user type first
                  sessionStorage.removeItem('pendingUserType');
                  
                  // Sign out the user immediately
                  try {
                    await supabase.auth.signOut();
                  } catch (signOutErr) {
                    console.error('Error signing out:', signOutErr);
                  }
                  
                  // Clear auth state
                  localStorage.removeItem('cvBuilderAuth');
                  sessionStorage.removeItem('googleSignInStarted');
                  
                  // Show error message
                  const errorMsg = `You cannot sign in as a ${pendingUserType === 'shopkeeper' ? 'shopkeeper' : 'regular user'}. Your account is registered as a ${currentUserType === 'shopkeeper' ? 'shopkeeper' : 'regular user'}. Please contact admin if you need to change your account type.`;
                  alert(errorMsg);
                  
                  // Redirect to home immediately
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 100);
                  
                  // Return early to prevent any further authentication processing
                  return;
                } else {
                  // Types match - proceed normally
                  console.log('User type matches:', currentUserType);
                }
              }
              // Clear pending user type
              sessionStorage.removeItem('pendingUserType');
            }
          }
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
                                localStorage.getItem('selectedApp') === 'marketplace';
    
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
      
      // Clear selectedApp to show homepage (not marketplace)
      localStorage.removeItem('selectedApp');
      startTransition(() => {
        setSelectedApp('');
      });
      
      console.log('handleAuth: User logged in from homepage, keeping them on homepage');
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
        console.log('handleAuth: CV Builder flag detected, setting currentView to dashboard');
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
            console.log('App.js - Stored loaded CV formData in localStorage:', serializableData);
          } catch (e) {
            console.error('App.js - Error storing loaded CV formData in localStorage:', e);
          }
          
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

  // ============================================
  // FRESH ROUTING SYSTEM - SIMPLIFIED
  // ============================================
  // Single source of truth: localStorage via routing utils
  // No state updates during render - only reads
  // ============================================
  
  // ABSOLUTE PRIORITY: Check for admin panel route FIRST (hash-based routing)
  // This must take priority over ALL other routing logic
  // Check this BEFORE authentication check to ensure admin panel always shows
  // Always read directly from window.location.hash to ensure we get the latest value
  const hashToCheck = window.location.hash;
  
  // Force check - this should ALWAYS run first
  if (hashToCheck === '#admin' || hashToCheck.startsWith('#admin/')) {
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
        <AdminDashboard />
      </>
    );
  }

  if (isAuthenticated && !isLoading) {
    
    // Get current route from routing utility (reads from localStorage)
    const route = getRoute();
    const cvView = route.cvView;
    
    // PRIORITY: Check for preview page FIRST (before any other routing logic)
    // This ensures that when cvView is 'preview', we show the preview page
    if (cvView === 'preview') {
      const selectedProduct = localStorage.getItem('selectedApp');
      // Don't show preview if user is on marketplace or id-card-print
      if (selectedProduct !== 'id-card-print' && selectedProduct !== 'marketplace') {
        console.log('App.js: Rendering Preview Page - cvView is preview');
        return (
          <PreviewPage 
            formData={formData}
            selectedTemplate={selectedTemplate}
            onTemplateSwitch={handleTemplateSwitch}
          />
        );
      }
    }
    
    let routingApp = route.app;
    
    // Check if hash contains product detail route - if so, ensure marketplace routing
    const hash = window.location.hash;
    const productMatch = hash.match(/^#product\/(.+)$/);
    if (productMatch && routingApp !== 'marketplace') {
      // User is viewing a product detail page - ensure marketplace routing
      routingApp = 'marketplace';
      setCurrentApp('marketplace');
      explicitlyClickedMarketplaceRef.current = true;
    }
    
    // DEBUG: Log initial routing state
    console.log('App.js routing - Initial route.app:', route.app, 'localStorage selectedApp:', localStorage.getItem('selectedApp'), 'explicitlyClickedMarketplace:', explicitlyClickedMarketplaceRef.current, 'lastKnownApp:', lastKnownAppRef.current);
    
    // PRIORITY: Check for homepage navigation flag BEFORE any default logic
    const navigateToHomePageFlag = sessionStorage.getItem('navigateToHomePage') === 'true';
    if (navigateToHomePageFlag) {
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
    // Preserve marketplace if user was on it (ref has marketplace) OR explicitly clicked it
    if (routingApp === 'marketplace') {
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
    } else if (!routingApp && !navigateToHomePageFlag) {
      // routingApp is null/empty - use last known app or show homepage
      // BUT: Don't default if user wants homepage (flag was already checked above)
      if (lastKnownAppRef.current === 'marketplace') {
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
    
    // DEBUG: Log final routing decision
    console.log('App.js routing - Final routingApp:', routingApp, 'Will check marketplace:', routingApp === 'marketplace');
    
    // cvView was already declared at the beginning for preview check
    // Use it here with default fallback if needed
    const finalCvView = cvView || 'dashboard';
    const idCardView = route.idCardView || 'dashboard';
    
    // ============================================
    // HOMEPAGE SECTION - CHECK FIRST when routingApp is null
    // ============================================
    if (!routingApp || routingApp === null) {
      console.log('App.js routing - Rendering HOMEPAGE (routingApp is null)');
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
    
    // ============================================
    // CART, CHECKOUT, ORDER DETAILS, RESET PASSWORD - CHECK BEFORE MARKETPLACE
    // ============================================
    const currentHash = window.location.hash;
    
    // Check for password reset route
    if (currentHash === '#reset-password' || currentHash.startsWith('#reset-password') || currentHash.includes('type=recovery')) {
      console.log('App.js routing - Rendering RESET PASSWORD');
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
    
    // Check for cart route
    if (currentHash === '#cart') {
      console.log('App.js routing - Rendering CART');
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <Cart />
          </>
        )
      );
    }
    
    // Check for checkout route
    if (currentHash === '#checkout') {
      console.log('App.js routing - Rendering CHECKOUT');
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <Checkout />
          </>
        )
      );
    }
    
    // Check for order details route
    if (currentHash.startsWith('#order-details')) {
      console.log('App.js routing - Rendering ORDER DETAILS');
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <OrderDetails />
          </>
        )
      );
    }
    
    // Check for order history route
    if (currentHash === '#order-history') {
      console.log('App.js routing - Rendering ORDER HISTORY');
      return wrapWithTopNav(
        wrapWithNavbar(
          <>
            <Header 
              isAuthenticated={isAuthenticated} 
              currentProduct="products"
              showProductsOnHeader={true}
              onLogout={isAuthenticated ? handleLogout : undefined}
            />
            <OrderHistory />
          </>
        )
      );
    }
    
    // ============================================
    // MARKETPLACE SECTION - CHECK SECOND to prevent override
    // ============================================
    if (routingApp === 'marketplace') {
      // Check if we're viewing a product detail page
      const productMatch = currentHash.match(/^#product\/(.+)$/);
      const productId = productMatch ? productMatch[1] : null;
      
      if (productId) {
        console.log('App.js routing - Rendering PRODUCT DETAIL:', productId);
        return wrapWithTopNav(
          wrapWithNavbar(
            <>
              <Header 
                isAuthenticated={isAuthenticated} 
                currentProduct="products"
                showProductsOnHeader={true}
                onLogout={isAuthenticated ? handleLogout : undefined}
              />
              <ProductDetail productId={productId} />
            </>
          )
        );
      }
      
      console.log('App.js routing - Rendering MARKETPLACE');
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

    // ============================================
    // ID CARD PRINTER SECTION
    // ============================================
    if (routingApp === 'id-card-print') {
      // Check if user wants to see the print page
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
              onCreateNewIDCard={handleCreateNewIDCard}
            />
      </>
        )
    );
  }

    // Marketplace section moved to top to prevent override
  }

  // All hash-based routing removed - user will add navigation one by one
  
  // PRIORITY: Check if we should show CV Builder form/preview FIRST
  // This ensures that when currentView is 'cv-builder', we show the form instead of dashboard
  // CRITICAL: Don't show CV form if user is on marketplace
  if (currentView === 'cv-builder' && isAuthenticated && !isLoading) {
    const selectedProduct = localStorage.getItem('selectedApp');
    // Don't show CV form if user is on marketplace or id-card-print
    if (selectedProduct !== 'id-card-print' && selectedProduct !== 'marketplace') {
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
    
    if (hash === '#checkout') {
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
    const productMatch = hash.match(/^#product\/(.+)$/);
    const productId = productMatch ? productMatch[1] : null;
    const wantsProductsPage = hash === '#products' ||
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