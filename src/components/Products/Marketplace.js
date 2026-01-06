import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Marketplace.css';
import { authService, supabase } from '../Supabase/supabase';
import { addToCart } from '../../utils/cart';

// Move products array outside component to keep it stable
  const products = [
    {
      id: 'marketplace',
      name: 'Market Place',
      description: 'Discover and explore a wide range of professional services, templates, and resources for your career needs.',
      icon: '🛒',
      color: '#f59e0b',
      textColor: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop&q=90',
      overlay: 'rgba(255, 255, 255, 0.85)'
    },
  ];

const ProductsPage = ({ onProductSelect, showLoginOnMount = false }) => {
  console.log('ProductsPage component is rendering');
  const [showLogin, setShowLogin] = useState(showLoginOnMount);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('regular'); // 'regular' or 'shopkeeper'
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [pendingGoogleSignIn, setPendingGoogleSignIn] = useState(false);
  const [productImageIndices, setProductImageIndices] = useState({});
  const imageSlideIntervals = useRef({});
  
  // Get images for a product
  const getProductImages = (product) => {
    // Check for image_urls array (JSONB from database)
    if (product.image_urls) {
      // Handle both array and string formats
      if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        // Filter out empty/null/undefined URLs
        return product.image_urls.filter(url => url && url.trim() !== '');
      } else if (typeof product.image_urls === 'string') {
        // If it's a string, try to parse it as JSON
        try {
          const parsed = JSON.parse(product.image_urls);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(url => url && url.trim() !== '');
          }
        } catch (e) {
          // If parsing fails, treat as single URL
          if (product.image_urls.trim() !== '') {
            return [product.image_urls];
          }
        }
      }
    }
    // Fallback to single image_url
    if (product.image_url && product.image_url.trim() !== '') {
      return [product.image_url];
    }
    return [];
  };
  
  // Handle mouse enter - start sliding images (optimized to reduce re-renders)
  const handleProductCardMouseEnter = useCallback((productId, images) => {
    if (images.length <= 1) return; // No need to slide if only one image
    
    // Clear any existing interval for this product
    if (imageSlideIntervals.current[productId]) {
      clearInterval(imageSlideIntervals.current[productId]);
    }
    
    // Set initial index to 0 (only if not already set)
    setProductImageIndices(prev => {
      if (prev[productId] === 0) return prev; // Skip update if already 0
      return { ...prev, [productId]: 0 };
    });
    
    // Start sliding through images every 2 seconds (increased from 1.5s for better performance)
    let currentIndex = 0;
    imageSlideIntervals.current[productId] = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      // Use functional update and only update if index changed
      setProductImageIndices(prev => {
        if (prev[productId] === currentIndex) return prev; // Skip if same
        return { ...prev, [productId]: currentIndex };
      });
    }, 2000); // Increased interval for better performance
  }, []);
  
  // Handle mouse leave - stop sliding and reset to first image
  const handleProductCardMouseLeave = useCallback((productId) => {
    if (imageSlideIntervals.current[productId]) {
      clearInterval(imageSlideIntervals.current[productId]);
      delete imageSlideIntervals.current[productId];
    }
    // Reset to first image immediately (no delay for better UX)
    setProductImageIndices(prev => {
      if (!prev[productId] || prev[productId] === 0) return prev; // Skip if already reset
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  }, []);
  
  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(imageSlideIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [marketplaceSections, setMarketplaceSections] = useState([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  const [cartNotification, setCartNotification] = useState({ 
    show: false, 
    message: '', 
    productName: '',
    position: { top: 0, left: 0 }
  });

  const [selectedCarouselProduct, setSelectedCarouselProduct] = useState(() => {
    // Initialize from localStorage or default to marketplace
    return localStorage.getItem('selectedApp') || 'marketplace';
  });

  // Handle product selection from header
  React.useEffect(() => {
    const handleProductChange = (productId) => {
      setSelectedCarouselProduct(productId);
      localStorage.setItem('selectedApp', productId);
    };

    if (onProductSelect) {
      // Expose the handler to parent
      window.handleProductSelect = handleProductChange;
    }
  }, [onProductSelect]);

  // This function is called from Header component
  const handleProductSelect = useCallback((productId) => {
    localStorage.setItem('selectedApp', productId);
    setSelectedCarouselProduct(productId);
  }, []);

  // Expose handler to window for Header to call
  React.useEffect(() => {
    window.handleProductSelect = handleProductSelect;
    // Expose function to show login form
    window.showLoginForm = () => {
      setShowLogin(true);
    };
    return () => {
      delete window.handleProductSelect;
      delete window.showLoginForm;
    };
  }, [handleProductSelect]);
  
  // Show login form on mount if showLoginOnMount is true (when navigation flags are set)
  React.useEffect(() => {
    // Check if user is already authenticated - if so, don't show login
    const checkAuth = async () => {
      try {
        const isAuthInStorage = localStorage.getItem('cvBuilderAuth') === 'true';
        if (isAuthInStorage) {
          // User is authenticated, hide login form
          setShowLogin(false);
          return;
        }
        
        // Check with authService
        const user = await authService.getCurrentUser();
        if (user) {
          setShowLogin(false);
          return;
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
      
      // Check for navigation flags on mount and when prop changes
      const hasNavIntent = sessionStorage.getItem('navigateToCVBuilder') === 'true' ||
                           sessionStorage.getItem('navigateToIDCardPrint') === 'true' ||
                           localStorage.getItem('navigateToCVBuilder') === 'true' ||
                           localStorage.getItem('navigateToIDCardPrint') === 'true';
      
      if (showLoginOnMount || hasNavIntent) {
        // Small delay to ensure component is fully mounted
        setTimeout(() => {
          setShowLogin(true);
        }, 100);
      }
    };
    
    // Check immediately
    checkAuth();
    
    // Also listen for hash changes in case navigation flags are set after mount
    const handleHashChange = () => {
      checkAuth();
    };
    
    // Listen for authentication events to hide login form
    const handleUserAuthenticated = () => {
      console.log('User authenticated event received, hiding login form');
      setShowLogin(false);
      // Clear navigation flags after successful authentication
      sessionStorage.removeItem('navigateToCVBuilder');
      sessionStorage.removeItem('navigateToIDCardPrint');
      localStorage.removeItem('navigateToCVBuilder');
      localStorage.removeItem('navigateToIDCardPrint');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('userAuthenticated', handleUserAuthenticated);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('userAuthenticated', handleUserAuthenticated);
    };
  }, [showLoginOnMount]);

  // Load marketplace sections and products from database
  // Defer loading to prevent blocking initial render
  useEffect(() => {
    // Use requestIdleCallback or setTimeout to defer data loading after initial render
    const loadTimeout = setTimeout(() => {
      const loadMarketplaceData = async () => {
        try {
          setLoadingMarketplace(true);
          
          // Load sections
          const { data: sectionsData, error: sectionsError } = await supabase
            .from('marketplace_sections')
            .select('*')
            .order('display_order', { ascending: true });

          if (sectionsError) throw sectionsError;
          setMarketplaceSections(sectionsData || []);

          // Load products (exclude hidden products)
          const { data: productsData, error: productsError } = await supabase
            .from('marketplace_products')
            .select('*, marketplace_sections(name)')
            .or('is_hidden.is.null,is_hidden.eq.false')
            .order('created_at', { ascending: false });

          if (productsError) throw productsError;
          setMarketplaceProducts(productsData || []);
        } catch (err) {
          console.error('Error loading marketplace data:', err);
        } finally {
          setLoadingMarketplace(false);
        }
      };

      loadMarketplaceData();
    }, 200); // Defer by 200ms to allow initial render to complete

    return () => clearTimeout(loadTimeout);
  }, []);


  // Handle escape key to close login modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showLogin) {
        setShowLogin(false);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUserType('regular');
      }
    };
    
    if (showLogin) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showLogin]);

  // Handle product click
  const handleProductClick = (productId) => {
    setSelectedCarouselProduct(productId);
    localStorage.setItem('selectedApp', productId);
    if (window.handleProductSelect) {
      window.handleProductSelect(productId);
    }
    
    // Scroll to the product section (optimized to prevent conflicts)
    requestAnimationFrame(() => {
      setTimeout(() => {
        const sectionId = 'marketplace-section';
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 100;
          // Use requestAnimationFrame for smooth scroll
          requestAnimationFrame(() => {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          });
        }
      }, 100);
    });
  };

  const handleGetStarted = (productId) => {
    // Check if user is authenticated - check both authService and localStorage
    const checkAuth = async () => {
      try {
        // First check localStorage for quick auth status
        const isAuthInStorage = localStorage.getItem('cvBuilderAuth') === 'true';
        
        // Then check with authService
        const user = await authService.getCurrentUser();
        const isAuthenticated = user !== null || isAuthInStorage;
        
        if (isAuthenticated) {
          // User is authenticated - navigate to respective dashboard
          // Clear products page flags
          localStorage.removeItem('showProductsPage');
          sessionStorage.removeItem('showProductsPage');
          if (window.resetProductsPageFlag) {
            window.resetProductsPageFlag();
          }
          
          // Set selected product
          localStorage.setItem('selectedApp', productId);
          
          if (productId === 'marketplace') {
            // For marketplace, scroll to the section using the products-page container
            setTimeout(() => {
              const productsPage = document.querySelector('.products-page');
              const element = document.getElementById('marketplace-section');
              if (element && productsPage) {
                const headerOffset = 20;
                const containerRect = productsPage.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                const currentScrollTop = productsPage.scrollTop;
                const elementTopInContainer = currentScrollTop + (elementRect.top - containerRect.top);
                const offsetPosition = elementTopInContainer - headerOffset;
                
                productsPage.scrollTo({
                  top: Math.max(0, offsetPosition),
                  behavior: 'smooth'
                });
              } else if (element) {
                // Fallback to window scroll
                const headerOffset = 100;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + (window.pageYOffset || window.scrollY || 0) - headerOffset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }, 100);
          } else if (productId === 'cv-builder') {
            // Navigate to CV Builder dashboard
            // Set navigation flags FIRST to prevent logout on page reload
            sessionStorage.setItem('isNavigating', 'true');
            sessionStorage.setItem('isReloading', 'true');
            sessionStorage.setItem('navigationTimestamp', Date.now().toString());
            sessionStorage.setItem('navigateToCVBuilder', 'true');
            localStorage.setItem('navigateToCVBuilder', 'true'); // Backup in localStorage
            localStorage.setItem('selectedApp', 'cv-builder');
            
            // Clear products page flags to ensure navigation works
            localStorage.removeItem('showProductsPage');
            sessionStorage.removeItem('showProductsPage');
            if (window.resetProductsPageFlag) {
              window.resetProductsPageFlag();
            }
            
            // Ensure selectedApp is set to cv-builder (already set above, but ensure it's correct)
            localStorage.setItem('selectedApp', 'cv-builder');
            
            // Clear hash if present - this ensures shouldShowProductsPage will be false
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            
            // Navigate to root - App.js will show CV Dashboard
            // All flags are set in localStorage/sessionStorage before navigation
            // The routing check at line 1006 in App.js will detect currentSelectedApp === 'cv-builder'
            // and show the CV Dashboard
            window.location.href = '/';
          } else if (productId === 'id-card-print') {
            // Navigate to ID Card Print dashboard
            // Set navigation flags FIRST to prevent logout on page reload
            sessionStorage.setItem('isNavigating', 'true');
            sessionStorage.setItem('isReloading', 'true');
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('selectedApp', 'id-card-print');
            // Clear products page flags
            localStorage.removeItem('showProductsPage');
            sessionStorage.removeItem('showProductsPage');
            // Navigate to root - App.js will show ID Card Print dashboard
            window.location.href = '/';
          }
        } else {
          // User is not authenticated - show login form
          // Set flag to navigate to respective dashboard after login
          if (productId === 'marketplace') {
            // For marketplace, just scroll to section (no login required)
            setTimeout(() => {
              const productsPage = document.querySelector('.products-page');
              const element = document.getElementById('marketplace-section');
              if (element && productsPage) {
                const headerOffset = 20;
                const containerRect = productsPage.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                const currentScrollTop = productsPage.scrollTop;
                const elementTopInContainer = currentScrollTop + (elementRect.top - containerRect.top);
                const offsetPosition = elementTopInContainer - headerOffset;
                
                productsPage.scrollTo({
                  top: Math.max(0, offsetPosition),
                  behavior: 'smooth'
                });
              } else if (element) {
                // Fallback to window scroll
                const headerOffset = 100;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + (window.pageYOffset || window.scrollY || 0) - headerOffset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }, 100);
          } else if (productId === 'id-card-print') {
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('selectedApp', 'id-card-print');
            setShowLogin(true);
          } else if (productId === 'cv-builder') {
            sessionStorage.setItem('navigateToCVBuilder', 'true');
            localStorage.setItem('selectedApp', 'cv-builder');
            setShowLogin(true);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, show login form
        setShowLogin(true);
      }
    };
    checkAuth();
  };

  const handleTemplateClick = (templateNumber) => {
    // Check if user is authenticated - check both authService and localStorage
    const checkAuth = async () => {
      try {
        // First check localStorage for quick auth status
        const isAuthInStorage = localStorage.getItem('cvBuilderAuth') === 'true';
        
        // Then check with authService
        const user = await authService.getCurrentUser();
        const isAuthenticated = user !== null || isAuthInStorage;
        
        // Set template selection and navigation flags FIRST (for both authenticated and unauthenticated)
        // This ensures navigation works correctly after login
        sessionStorage.setItem('navigateToCVBuilder', 'true');
        localStorage.setItem('navigateToCVBuilder', 'true');
        localStorage.setItem('selectedTemplate', `template${templateNumber}`);
        localStorage.setItem('selectedApp', 'cv-builder');
        // Set a special flag to indicate template was clicked - this prevents handleAuth from clearing navigation flags
        sessionStorage.setItem('templateClicked', 'true');
        localStorage.setItem('templateClicked', 'true');
        
        if (isAuthenticated) {
          // User is authenticated - navigate to CV Dashboard with selected template
          // Set navigation flag to prevent logout on page reload
          sessionStorage.setItem('isNavigating', 'true');
          sessionStorage.setItem('isReloading', 'true');
          sessionStorage.setItem('navigationTimestamp', Date.now().toString());
          // Do NOT set goToCVForm - we want to go to Dashboard, not form
          
          // Clear products page flags to ensure navigation works
          localStorage.removeItem('showProductsPage');
          sessionStorage.removeItem('showProductsPage');
          if (window.resetProductsPageFlag) {
            window.resetProductsPageFlag();
          }
          
          // Ensure selectedApp is set to cv-builder (already set above, but ensure it's correct)
          localStorage.setItem('selectedApp', 'cv-builder');
          
          // Clear hash if present - this ensures shouldShowProductsPage will be false
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          // Navigate to root - App.js will show CV Dashboard
          // All flags are set in localStorage/sessionStorage before navigation
          // The routing check at line 1006 in App.js will detect currentSelectedApp === 'cv-builder'
          // and show the CV Dashboard
          window.location.href = '/';
        } else {
          // User is not authenticated - show login form
          // Flags are already set above, so after login, user will be navigated to CV Dashboard
          setShowLogin(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, show login form and set flags
        sessionStorage.setItem('navigateToCVBuilder', 'true');
        localStorage.setItem('navigateToCVBuilder', 'true');
        localStorage.setItem('selectedTemplate', `template${templateNumber}`);
        localStorage.setItem('selectedApp', 'cv-builder');
        sessionStorage.setItem('templateClicked', 'true');
        localStorage.setItem('templateClicked', 'true');
        setShowLogin(true);
      }
    };
    checkAuth();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Real Supabase login
        console.log('Attempting Supabase login...');
        const { data, error } = await authService.signIn(email, password);
        
        if (error) {
          console.error('Login error:', error);
          setError('Login failed: ' + error.message);
          return;
        }
        
        console.log('Login successful:', data);
        localStorage.setItem('cvBuilderAuth', 'true');
        // Show success message
        setLoginSuccess(true);
        setError('');
        // Dispatch authentication event
        window.dispatchEvent(new CustomEvent('userAuthenticated'));
        
        // Check if user wants to navigate to CV Builder or ID Card Print
        const navigateToCVBuilder = sessionStorage.getItem('navigateToCVBuilder') === 'true' || localStorage.getItem('navigateToCVBuilder') === 'true';
        const navigateToIDCardPrint = sessionStorage.getItem('navigateToIDCardPrint') === 'true' || localStorage.getItem('navigateToIDCardPrint') === 'true';
        
        console.log('Login successful - checking navigation flags:', {
          navigateToCVBuilder,
          navigateToIDCardPrint,
          sessionStorageCV: sessionStorage.getItem('navigateToCVBuilder'),
          sessionStorageID: sessionStorage.getItem('navigateToIDCardPrint'),
          localStorageCV: localStorage.getItem('navigateToCVBuilder'),
          localStorageID: localStorage.getItem('navigateToIDCardPrint')
        });
        
        // Ensure flags are set in both storages for persistence
        if (navigateToIDCardPrint) {
          sessionStorage.setItem('navigateToIDCardPrint', 'true');
          localStorage.setItem('navigateToIDCardPrint', 'true');
        }
        if (navigateToCVBuilder) {
          sessionStorage.setItem('navigateToCVBuilder', 'true');
        }
        
        // Wait a moment to show success message, then proceed
        setTimeout(() => {
          // Close login modal
          setShowLogin(false);
          setLoginSuccess(false);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setUserType('regular');
          
          if (navigateToCVBuilder || navigateToIDCardPrint) {
            // User wants to navigate to a specific product after login
            // Clear products page flags to allow navigation to specific product
            localStorage.removeItem('showProductsPage');
            sessionStorage.removeItem('showProductsPage');
            // Set flag to indicate this is a navigation, not a close
            sessionStorage.setItem('isNavigating', 'true');
            sessionStorage.setItem('navigationTimestamp', Date.now().toString());
            // Clear hash to allow dashboard to show
            window.location.hash = '';
            // The auth state change event will trigger handleAuth in App.js, which will handle navigation
            // No need to reload - the auth state change will trigger a re-render
          } else {
            // No navigation flags - user should stay on products page (homepage)
            // Ensure products page flags are set
            localStorage.setItem('selectedApp', 'marketplace');
            localStorage.setItem('showProductsPage', 'true');
            sessionStorage.setItem('showProductsPage', 'true');
            // Set hash to products page
            window.location.hash = '#products';
            // Don't reload - just update the hash to trigger re-render
            // The auth state change will handle the UI update
            console.log('Login from homepage - staying on homepage');
          }
        }, 1500); // Show success message for 1.5 seconds
        
      } else {
        // Real Supabase signup
        console.log('Attempting Supabase signup...');
        
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        if (!userType || (userType !== 'regular' && userType !== 'shopkeeper')) {
          setError('Please select whether you are a Regular User or Shopkeeper');
          return;
        }
        
        const { data, error } = await authService.signUp(email, password, {
          full_name: email.split('@')[0], // Use email prefix as name
          user_type: userType // 'regular' or 'shopkeeper'
        });
        
        if (error) {
          console.error('Signup error:', error);
          setError('Signup failed: ' + error.message);
          return;
        }
        
        console.log('Signup successful:', data);
        setError('Signup successful! Please check your email to confirm your account, then login.');
        setIsLogin(true);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed: ' + err.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUserType('regular'); // Reset to default
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await authService.resetPassword(email);
      setResetEmailSent(true);
      setError('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to send reset email: ' + err.message);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    // Show user type selection modal first
    setShowUserTypeModal(true);
    setPendingGoogleSignIn(true);
  };

  const handleUserTypeSelectedForGoogle = async (selectedType) => {
    setUserType(selectedType);
    setShowUserTypeModal(false);
    setIsGoogleSigningIn(true);
    
    // Store user type in sessionStorage for after OAuth callback
    sessionStorage.setItem('pendingUserType', selectedType);
    
    // Listen for callback to hide loading
    const handleCallback = () => {
      setIsGoogleSigningIn(false);
      setPendingGoogleSignIn(false);
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    };
    
    const handleError = (event) => {
      setIsGoogleSigningIn(false);
      setPendingGoogleSignIn(false);
      setError('Google sign-in failed. Please try again.');
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    };
    
    window.addEventListener('googleSignInCallbackReceived', handleCallback);
    window.addEventListener('googleSignInError', handleError);
    
    try {
      console.log('Attempting Google sign-in with user type:', selectedType);
      const { error } = await authService.signInWithGoogle();
      
      if (error) {
        console.error('Google sign-in error:', error);
        setIsGoogleSigningIn(false);
        setPendingGoogleSignIn(false);
        setError('Google sign-in failed: ' + error.message);
        window.removeEventListener('googleSignInCallbackReceived', handleCallback);
        window.removeEventListener('googleSignInError', handleError);
        return;
      }
      
      // The OAuth flow will redirect, so we don't need to handle success here
      // The auth state change will be handled by App.js
      // Loading state will be cleared when callback is received
    } catch (err) {
      console.error('Google authentication error:', err);
      setIsGoogleSigningIn(false);
      setPendingGoogleSignIn(false);
      setError('Google authentication failed: ' + err.message);
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    }
  };

  return (
    <>
    <div className="products-page">
      <div className="products-container">
        {/* Market Place Detailed View - Fresh Design */}
            <div id="marketplace-section" className="product-section-fresh">
              <div className="product-content-wrapper">
                <div className="section-header-fresh">
                  <h2 className="section-title-fresh">Featured Products</h2>
                  <div className="section-divider"></div>
                  </div>

                <div className="marketplace-categories-fresh">
                    {loadingMarketplace ? (
                    <div className="empty-state-fresh">
                      <div className="empty-state-icon">⏳</div>
                      <p className="empty-state-text">Loading products...</p>
                      </div>
                    ) : marketplaceSections.length === 0 ? (
                    <div className="empty-state-fresh">
                      <div className="empty-state-icon">📦</div>
                      <p className="empty-state-text">No products available yet. Admin can add sections and products using the Admin Panel.</p>
                      </div>
                    ) : (
                      marketplaceSections.map((section) => {
                        const sectionProducts = marketplaceProducts.filter(
                          (product) => product.section_id === section.id
                        );
                        
                        if (sectionProducts.length === 0) {
                        return null;
                        }

                        return (
                        <div key={section.id} className="category-section-fresh">
                          <div className="category-header-fresh">
                            <h3 className="category-title-fresh">{section.name}</h3>
                            <div className="category-badge">{sectionProducts.length} {sectionProducts.length === 1 ? 'product' : 'products'}</div>
                          </div>
                          <div className="products-grid-fresh">
                              {sectionProducts.map((product) => {
                                const handleProductClick = (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Product clicked:', product);
                                  window.location.href = `/#product/${product.id}`;
                                };

                                const handleAddToCart = (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addToCart(product);
                                  
                                  // Calculate position relative to the clicked card
                                  const cardElement = e.target.closest('.product-card-fresh');
                                  if (cardElement) {
                                    const cardRect = cardElement.getBoundingClientRect();
                                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                                    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                                    
                                    // Notification dimensions (approximate)
                                    const notificationWidth = window.innerWidth > 768 ? 320 : Math.min(300, window.innerWidth - 20);
                                    
                                    // Position notification near the top of the card
                                    let top = cardRect.top + scrollTop + 10;
                                    let left = cardRect.left + scrollLeft + (cardRect.width / 2) - (notificationWidth / 2);
                                    
                                    // Ensure notification stays within viewport
                                    if (left < scrollLeft + 10) {
                                      left = scrollLeft + 10;
                                    } else if (left + notificationWidth > scrollLeft + window.innerWidth - 10) {
                                      left = scrollLeft + window.innerWidth - notificationWidth - 10;
                                    }
                                    
                                    // On mobile, position it at the top of the card
                                    if (window.innerWidth <= 768) {
                                      top = cardRect.top + scrollTop + 5;
                                      left = scrollLeft + (window.innerWidth / 2) - (notificationWidth / 2);
                                    }
                                    
                                    // Show clear notification message
                                    setCartNotification({
                                      show: true,
                                      message: 'Added to cart!',
                                      productName: product.name,
                                      position: { top, left }
                                    });
                                    
                                    // Hide notification after 3 seconds
                                    setTimeout(() => {
                                      setCartNotification({ 
                                        show: false, 
                                        message: '', 
                                        productName: '',
                                        position: { top: 0, left: 0 }
                                      });
                                    }, 3000);
                                  }
                                };

                                const handleBuyNow = (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Add product to cart first
                                  addToCart(product);
                                  // Navigate directly to checkout
                                  window.location.href = '/#checkout';
                                };
                                
                                const productImages = getProductImages(product);
                                // Debug: Log image info
                                if (productImages.length === 0) {
                                  console.warn(`No images found for product: ${product.name}`, {
                                    image_urls: product.image_urls,
                                    image_url: product.image_url,
                                    productId: product.id
                                  });
                                } else {
                                  console.log(`Product ${product.name} has ${productImages.length} image(s):`, productImages);
                                }
                                const currentImageIndex = productImageIndices[product.id] !== undefined 
                                  ? productImageIndices[product.id] 
                                  : 0;
                                
                                return (
                                <div 
                                  key={product.id} 
                                  className="product-card-fresh" 
                                  data-product-id={product.id}
                                  onClick={handleProductClick}
                                  onMouseEnter={() => handleProductCardMouseEnter(product.id, productImages)}
                                  onMouseLeave={() => handleProductCardMouseLeave(product.id)}
                                >
                                  <div className="product-card-image-wrapper">
                                    {productImages.length > 0 ? (
                                      <>
                                        {productImages.map((imageUrl, index) => {
                                          const isActive = index === currentImageIndex;
                                          const isFirst = index === 0;
                                          return (
                                            <img 
                                              key={`${product.id}-${index}`}
                                              src={imageUrl} 
                                              alt={`${product.name} - Image ${index + 1}`}
                                              className={`product-card-image ${isActive ? 'active' : ''} ${isFirst ? 'first-image' : ''}`}
                                              style={isFirst ? { opacity: 1, zIndex: 1, transform: 'translate(-50%, -50%)' } : { transform: 'translate(-50%, -50%)' }}
                                              onError={(e) => {
                                                console.error(`Failed to load image ${index + 1} for product ${product.name}:`, imageUrl);
                                                e.target.style.display = 'none';
                                              }}
                                              onLoad={(e) => {
                                                console.log(`Image ${index + 1} loaded for product ${product.name}`);
                                                // Force first image to be visible when loaded
                                                if (isFirst) {
                                                  e.target.style.opacity = '1';
                                                  e.target.style.zIndex = '1';
                                                }
                                              }}
                                            />
                                          );
                                        })}
                                      </>
                                    ) : null}
                                    <div className="product-card-placeholder" style={{ 
                                      display: productImages.length > 0 ? 'none' : 'flex' 
                                    }}>
                                      <span className="product-placeholder-icon-fresh">📦</span>
                                    </div>
                                    <div className="product-card-overlay"></div>
                                  </div>
                                  <div className="product-card-body">
                                    <h4 className="product-card-name">{product.name}</h4>
                                    <div className="product-card-footer">
                                      <div className="product-card-price-container">
                                        {product.original_price && product.original_price > product.price ? (
                                          <>
                                            <span className="product-card-price-discounted">Rs. {product.price?.toLocaleString() || '0'}</span>
                                            <span className="product-card-price-original">Rs. {product.original_price?.toLocaleString() || '0'}</span>
                                          </>
                                        ) : (
                                      <span className="product-card-price">Rs. {product.price?.toLocaleString() || '0'}</span>
                                        )}
                                      </div>
                                      <div className="product-card-action-buttons">
                                        <button 
                                          className="product-card-buy-now-btn"
                                          onClick={handleBuyNow}
                                          title="Buy Now"
                                        >
                                          Buy Now
                                        </button>
                                        <button 
                                          className="product-card-add-to-cart-btn"
                                          onClick={handleAddToCart}
                                          title="Add to Cart"
                                        >
                                          Add to Cart
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                </div>
              </div>
            </div>


        {/* Login Form Modal Popup */}
        {showLogin && (
          <div className="login-modal-overlay" onClick={() => {
            setShowLogin(false);
            setError('');
            setLoginSuccess(false);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setUserType('regular');
          }}>
            <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="login-modal-close"
                onClick={() => {
                  setShowLogin(false);
                  setError('');
                  setLoginSuccess(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setUserType('regular');
                }}
                aria-label="Close"
              >
                ×
              </button>
              <div className="login-card-inline">
                <div className="login-header-inline">
                  <h2>Welcome</h2>
                  <p>{isLogin ? 'Sign in to access all products' : 'Get Started - It\'s Free!'}</p>
                  {!isLogin && (
                    <div className="welcome-message-inline">
                      <p>Access all our products with one account</p>
                      <p>Your data is automatically saved</p>
                    </div>
                  )}
                </div>

                {loginSuccess && (
                  <div className="login-success-message">
                    <div className="success-icon">✓</div>
                    <div className="success-text">
                      <h3>Login Successful!</h3>
                      <p>You are now logged in. Redirecting...</p>
                    </div>
                  </div>
                )}
                {error && !loginSuccess && (
                  <div className="error-message-inline">{error}</div>
                )}
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="login-form-inline" style={{ display: loginSuccess ? 'none' : 'block' }}>
                    {resetEmailSent ? (
                      <div className="success-message-inline">
                        <p>✅ Password reset email sent!</p>
                        <p>Please check your email inbox and follow the instructions to reset your password.</p>
                        <button 
                          type="button" 
                          onClick={handleBackToLogin}
                          className="login-button-inline"
                          style={{ marginTop: '1rem' }}
                        >
                          Back to Sign In
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="form-group-inline">
                          <label htmlFor="reset-email-inline">Email Address</label>
                          <input
                            type="email"
                            id="reset-email-inline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                          />
                        </div>

                        {error && <div className="error-message-inline">{error}</div>}

                        <button type="submit" className="login-button-inline">
                          Send Reset Link
                        </button>

                        <button 
                          type="button" 
                          onClick={handleBackToLogin}
                          className="toggle-button-inline"
                          style={{ 
                            width: '100%', 
                            marginTop: '0.5rem',
                            background: 'transparent',
                            color: '#667eea',
                            border: '1px solid #667eea',
                            padding: '0.5rem'
                          }}
                        >
                          Back to Sign In
                        </button>
                      </>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="login-form-inline" style={{ display: loginSuccess ? 'none' : 'block' }}>
                    <div className="form-group-inline">
                      <label htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="form-group-inline">
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>

                    {!isLogin && (
                      <>
                        <div className="form-group-inline">
                          <label htmlFor="confirmPassword">Confirm Password</label>
                          <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                          />
                        </div>
                        
                        <div className="form-group-inline">
                          <label>I am a <span style={{ color: '#c33' }}>*</span></label>
                          <div className="option-selector">
                            <button
                              type="button"
                              className={`option-button ${userType === 'regular' ? 'active' : ''}`}
                              onClick={() => setUserType('regular')}
                            >
                              Regular User
                            </button>
                            <button
                              type="button"
                              className={`option-button ${userType === 'shopkeeper' ? 'active' : ''}`}
                              onClick={() => setUserType('shopkeeper')}
                            >
                              Shopkeeper
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {error && !loginSuccess && <div className="error-message-inline">{error}</div>}

                    <button type="submit" className="login-button-inline">
                      {isLogin ? 'Sign In' : 'Get Started'}
                    </button>
                  </form>
                )}

                {!showForgotPassword && (
                  <>
                    <div className="divider-inline">
                      <span>or</span>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleGoogleSignIn} 
                      className="google-button-inline"
                      disabled={isGoogleSigningIn || pendingGoogleSignIn}
                      style={{ opacity: (isGoogleSigningIn || pendingGoogleSignIn) ? 0.7 : 1, cursor: (isGoogleSigningIn || pendingGoogleSignIn) ? 'wait' : 'pointer' }}
                    >
                      <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {isGoogleSigningIn ? 'Signing in...' : 'Continue with Google'}
                    </button>
                  </>
                )}

                {!showForgotPassword && (
                  <div className="login-footer-inline">
                    <p>
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <button type="button" onClick={toggleMode} className="toggle-button-inline">
                        {isLogin ? 'Get Started' : 'Sign In'}
                      </button>
                    </p>
                    {isLogin && (
                      <div className="forgot-password-inline">
                        <button 
                          type="button" 
                          onClick={() => setShowForgotPassword(true)}
                          className="forgot-password-link-inline"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Cart Notification */}
    {cartNotification.show && (
      <div 
        className="cart-notification"
        style={{
          top: `${cartNotification.position.top}px`,
          left: `${cartNotification.position.left}px`
        }}
      >
        <div className="cart-notification-content">
          <span className="cart-notification-icon">✓</span>
          <div className="cart-notification-text">
            <div className="cart-notification-message">{cartNotification.message}</div>
            <div className="cart-notification-product">{cartNotification.productName}</div>
          </div>
        </div>
      </div>
    )}


      {/* User Type Selection Modal for Google Sign-In */}
      {showUserTypeModal && (
        <div className="user-type-modal-overlay" onClick={() => {
          setShowUserTypeModal(false);
          setPendingGoogleSignIn(false);
        }}>
          <div className="user-type-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Select Your Account Type</h2>
            <p>Please select whether you are a Regular User or Shopkeeper before continuing with Google</p>
            <div className="option-selector" style={{ marginTop: '20px', marginBottom: '20px' }}>
              <button
                type="button"
                className={`option-button ${userType === 'regular' ? 'active' : ''}`}
                onClick={() => setUserType('regular')}
              >
                Regular User
              </button>
              <button
                type="button"
                className={`option-button ${userType === 'shopkeeper' ? 'active' : ''}`}
                onClick={() => setUserType('shopkeeper')}
              >
                Shopkeeper
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="toggle-button-inline"
                onClick={() => {
                  setShowUserTypeModal(false);
                  setPendingGoogleSignIn(false);
                }}
                style={{ padding: '10px 20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="login-button-inline"
                onClick={() => handleUserTypeSelectedForGoogle(userType)}
                style={{ padding: '10px 20px' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductsPage;

