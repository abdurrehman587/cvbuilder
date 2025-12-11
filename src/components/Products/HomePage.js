import React, { useState, useEffect, useRef, useCallback } from 'react';
import './HomePage.css';
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
    {
      id: 'cv-builder',
      name: 'CV Builder',
      description: 'Create professional CVs with multiple templates. Build, edit, and download your resume in PDF format.',
      icon: '📄',
      color: '#60a5fa',
      textColor: '#60a5fa',
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1920&h=1080&fit=crop&q=90',
      overlay: 'rgba(255, 255, 255, 0.85)'
    },
    {
      id: 'id-card-print',
      name: 'ID Card Printing Utility',
      description: 'Print multiple ID cards on A4 paper with perfect alignment. Supports front and back printing.',
      icon: '🪪',
      color: '#34d399',
      textColor: '#34d399',
      gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1920&h=1080&fit=crop&q=90',
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
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
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
  
  // Handle mouse enter - start sliding images
  const handleProductCardMouseEnter = (productId, images) => {
    if (images.length <= 1) return; // No need to slide if only one image
    
    // Clear any existing interval for this product
    if (imageSlideIntervals.current[productId]) {
      clearInterval(imageSlideIntervals.current[productId]);
    }
    
    // Set initial index to 0
    setProductImageIndices(prev => ({ ...prev, [productId]: 0 }));
    
    // Start sliding through images every 1.5 seconds
    let currentIndex = 0;
    imageSlideIntervals.current[productId] = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      setProductImageIndices(prev => ({ ...prev, [productId]: currentIndex }));
    }, 1500);
  };
  
  // Handle mouse leave - stop sliding and reset to first image
  const handleProductCardMouseLeave = (productId) => {
    if (imageSlideIntervals.current[productId]) {
      clearInterval(imageSlideIntervals.current[productId]);
      delete imageSlideIntervals.current[productId];
    }
    // Reset to first image after a short delay
    setTimeout(() => {
      setProductImageIndices(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
    }, 300);
  };
  
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
    // Initialize from localStorage or default to cv-builder
    return localStorage.getItem('selectedApp') || 'cv-builder';
  });
  const [currentSlide, setCurrentSlide] = useState(() => {
    // Initialize slide based on selected product
    const initialProduct = localStorage.getItem('selectedApp') || 'marketplace';
    const productList = [
      { id: 'marketplace' },
      { id: 'cv-builder' },
      { id: 'id-card-print' }
    ];
    const index = productList.findIndex(p => p.id === initialProduct);
    return index !== -1 ? index : 0;
  });
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  // Handle product selection from header
  React.useEffect(() => {
    const handleProductChange = (productId) => {
      setSelectedCarouselProduct(productId);
      localStorage.setItem('selectedApp', productId);
      // Find the index of the selected product
      const index = products.findIndex(p => p.id === productId);
      if (index !== -1) {
        setCurrentSlide(index);
      }
    };

    if (onProductSelect) {
      // Expose the handler to parent
      window.handleProductSelect = handleProductChange;
    }
  }, [onProductSelect, products]);

  // This function is called from Header component
  const handleProductSelect = useCallback((productId) => {
    localStorage.setItem('selectedApp', productId);
    setSelectedCarouselProduct(productId);
    // Find the index of the selected product
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      setCurrentSlide(index);
    }
  }, []); // products is now a stable constant outside the component

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
    // Check for navigation flags on mount and when prop changes
    const checkAndShowLogin = () => {
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
    checkAndShowLogin();
    
    // Also listen for hash changes in case navigation flags are set after mount
    const handleHashChange = () => {
      checkAndShowLogin();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [showLoginOnMount]);

  // Load marketplace sections and products from database
  useEffect(() => {
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

        // Load products
        const { data: productsData, error: productsError } = await supabase
          .from('marketplace_products')
          .select('*, marketplace_sections(name)')
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

  // Auto-rotate carousel
  useEffect(() => {
    if (isPaused || showLogin) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isPaused, showLogin, products.length]);

  // Handle product click from carousel
  const handleProductClick = (productId, index) => {
    setSelectedCarouselProduct(productId);
    setCurrentSlide(index);
    localStorage.setItem('selectedApp', productId);
    if (window.handleProductSelect) {
      window.handleProductSelect(productId);
    }
    
    // Scroll to the product section
    setTimeout(() => {
      const sectionId = productId === 'cv-builder' ? 'cv-builder-section' : 'id-card-print-section';
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
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
        
        const { data, error } = await authService.signUp(email, password, {
          full_name: email.split('@')[0] // Use email prefix as name
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
    setIsGoogleSigningIn(true);
    
    // Listen for callback to hide loading
    const handleCallback = () => {
      setIsGoogleSigningIn(false);
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    };
    
    const handleError = (event) => {
      setIsGoogleSigningIn(false);
      setError('Google sign-in failed. Please try again.');
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    };
    
    window.addEventListener('googleSignInCallbackReceived', handleCallback);
    window.addEventListener('googleSignInError', handleError);
    
    try {
      console.log('Attempting Google sign-in...');
      const { error } = await authService.signInWithGoogle();
      
      if (error) {
        console.error('Google sign-in error:', error);
        setIsGoogleSigningIn(false);
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
      setError('Google authentication failed: ' + err.message);
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    }
  };

  return (
    <>
    <div className="products-page">
      <div className="products-container">
        {/* Animated Product Carousel */}
            <div 
              className="products-carousel-container"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="carousel-wrapper">
                <div 
                  className="carousel-track"
                  ref={carouselRef}
                  style={{
                    transform: `translateX(-${currentSlide * 100}%)`
                  }}
                >
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className={`carousel-slide ${selectedCarouselProduct === product.id ? 'active' : ''} ${currentSlide === index ? 'current' : ''}`}
                      onClick={() => handleProductClick(product.id, index)}
                      style={{ 
                        '--product-color': product.color,
                        '--product-text-color': product.textColor,
                        '--product-gradient': product.gradient,
                        '--product-overlay': product.overlay
                      }}
                    >
                      <div className="carousel-slide-inner">
                        <div className="carousel-image-section">
                          {product.id === 'id-card-print' ? (
                            <img 
                              src="/images/carousel/id-card-printing-utility.jpg" 
                              alt="ID Card Printing Utility Interface"
                              className="carousel-featured-image id-card-interface-image"
                              loading="lazy"
                              onError={(e) => {
                                // Fallback to placeholder if image not found
                                e.target.src = product.image;
                              }}
                            />
                          ) : (
                            <>
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="carousel-featured-image"
                                loading="lazy"
                              />
                              <div className="carousel-image-overlay"></div>
                            </>
                          )}
                        </div>
                        <div className="carousel-slide-content">
                          <div className="carousel-product-icon">{product.icon}</div>
                          <h2 className="carousel-product-name">{product.name}</h2>
                          <p className="carousel-product-description">{product.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Indicators */}
              <div className="carousel-indicators">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    className={`carousel-indicator ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentSlide(index);
                      handleProductClick(product.id, index);
                    }}
                    aria-label={`Go to ${product.name}`}
                  />
                ))}
              </div>
            </div>

            {/* Market Place Detailed View - Fresh Design */}
            <div id="marketplace-section" className="product-section-fresh">
              <div className="product-hero-section">
                <div className="product-hero-content">
                  <div className="product-hero-icon">🛒</div>
                  <h1 className="product-hero-title">Market Place</h1>
                  <p className="product-hero-subtitle">Discover professional services, templates, and resources</p>
                  <p className="product-hero-description">Browse our curated collection of tools and services to enhance your career.</p>
                    </div>
                  </div>

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

            {/* CV Builder Detailed View - Fresh Design */}
            <div id="cv-builder-section" className="product-section-fresh">
              <div className="product-hero-section">
                <div className="product-hero-content">
                  <div className="product-hero-icon">📄</div>
                  <h1 className="product-hero-title">CV Builder</h1>
                  <p className="product-hero-subtitle">Create professional CVs that stand out from the crowd</p>
                  <p className="product-hero-description">Fill the form and get your CV Ready.</p>
                      </div>
                    </div>

              <div className="product-content-wrapper">
                <div className="section-header-fresh">
                  <h2 className="section-title-fresh">Select Template to Get Ready your CV</h2>
                  <p className="section-subtitle-fresh">Each template is designed to showcase your skills and experience in the best possible way</p>
                  <div className="section-divider"></div>
                  </div>

                <div className="templates-grid-fresh">
                  <div className="template-card-fresh" onClick={() => handleTemplateClick(1)}>
                    <div className="template-card-image-wrapper">
                          <img 
                            src="/images/templates/Template1.jpg" 
                            alt="Template 1 - Two Column Layout"
                        className="template-card-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                      <div className="template-card-placeholder" style={{ display: 'none' }}>
                            <div className="template-preview-box">
                              <div className="template-preview-left"></div>
                              <div className="template-preview-right"></div>
                            </div>
                            <p>Template 1 Preview</p>
                          </div>
                      <div className="template-card-overlay">
                        <span className="template-card-badge">Template 1</span>
                        </div>
                    </div>
                    <div className="template-card-body">
                      <div className="template-card-action">
                        <span>Select Template</span>
                        <span className="template-card-arrow">→</span>
                      </div>
                    </div>
                      </div>

                  <div className="template-card-fresh" onClick={() => handleTemplateClick(2)}>
                    <div className="template-card-image-wrapper">
                          <img 
                            src="/images/templates/Template2.jpg" 
                            alt="Template 2 - Modern Design"
                        className="template-card-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                      <div className="template-card-placeholder" style={{ display: 'none' }}>
                            <div className="template-preview-box template-2">
                              <div className="template-preview-header"></div>
                              <div className="template-preview-content"></div>
                            </div>
                            <p>Template 2 Preview</p>
                          </div>
                      <div className="template-card-overlay">
                        <span className="template-card-badge">Template 2</span>
                        </div>
                    </div>
                    <div className="template-card-body">
                      <div className="template-card-action">
                        <span>Select Template</span>
                        <span className="template-card-arrow">→</span>
                      </div>
                    </div>
                      </div>

                  <div className="template-card-fresh" onClick={() => handleTemplateClick(3)}>
                    <div className="template-card-image-wrapper">
                          <img 
                            src="/images/templates/Template3.jpg" 
                            alt="Template 3 - Gradient Design"
                        className="template-card-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                      <div className="template-card-placeholder" style={{ display: 'none' }}>
                            <div className="template-preview-box template-3">
                              <div className="template-preview-gradient"></div>
                              <div className="template-preview-content"></div>
                            </div>
                            <p>Template 3 Preview</p>
                          </div>
                      <div className="template-card-overlay">
                        <span className="template-card-badge">Template 3</span>
                        </div>
                      </div>
                    <div className="template-card-body">
                      <div className="template-card-action">
                        <span>Select Template</span>
                        <span className="template-card-arrow">→</span>
                    </div>
                  </div>
                    </div>
                    </div>

                <div className="features-section-fresh">
                  <div className="section-header-fresh">
                    <h2 className="section-title-fresh">Powerful Features</h2>
                    <div className="section-divider"></div>
                        </div>
                  <div className="features-grid-fresh">
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">✨</div>
                      <h3 className="feature-card-title">Easy to Use</h3>
                      <p className="feature-card-description">Intuitive interface that makes CV creation simple and fast. No design skills required.</p>
                      </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">💾</div>
                      <h3 className="feature-card-title">Auto-Save</h3>
                      <p className="feature-card-description">Your CV is automatically saved as you work. Never lose your progress.</p>
                        </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">📥</div>
                      <h3 className="feature-card-title">PDF Export</h3>
                      <p className="feature-card-description">Download your CV as a high-quality PDF ready for printing or emailing.</p>
                      </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">🎨</div>
                      <h3 className="feature-card-title">Multiple Templates</h3>
                      <p className="feature-card-description">Choose from 3 professionally designed templates that suit your style.</p>
                        </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">📝</div>
                      <h3 className="feature-card-title">Comprehensive Sections</h3>
                      <p className="feature-card-description">Include education, experience, skills, languages, certifications, and more.</p>
                      </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">🔒</div>
                      <h3 className="feature-card-title">Secure & Private</h3>
                      <p className="feature-card-description">Your data is securely stored and only accessible by you.</p>
                        </div>
                      </div>
                        </div>
                    </div>
                  </div>

            {/* ID Card Print Detailed View - Fresh Design */}
            <div id="id-card-print-section" className="product-section-fresh">
              <div className="product-hero-section">
                <div className="product-hero-content">
                  <div className="product-hero-icon">🪪</div>
                  <h1 className="product-hero-title">ID Card Printing Utility</h1>
                  <p className="product-hero-subtitle">Print multiple ID cards with perfect alignment and professional quality</p>
                  <p className="product-hero-description">Create and print professional ID cards with front and back support.</p>
                </div>
              </div>

              <div className="product-content-wrapper">
                <div className="section-header-fresh">
                  <h2 className="section-title-fresh">See It In Action</h2>
                  <p className="section-subtitle-fresh">Explore the powerful features of our ID Card Printing Utility</p>
                  <div className="section-divider"></div>
              </div>
                    
                <div className="screenshots-grid-fresh">
                  <div className="screenshot-card-fresh">
                    <div className="screenshot-card-image-wrapper">
                        <img 
                          src="/images/id-card-printing/screenshot-1.jpg" 
                          alt="ID Card Printing Interface"
                        className="screenshot-card-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      <div className="screenshot-card-placeholder" style={{ display: 'none' }}>
                          <p>Screenshot 1</p>
                      </div>
                        </div>
                      </div>

                  <div className="screenshot-card-fresh">
                    <div className="screenshot-card-image-wrapper">
                        <img 
                          src="/images/id-card-printing/screenshot-2.jpg" 
                          alt="Card Design Interface"
                        className="screenshot-card-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      <div className="screenshot-card-placeholder" style={{ display: 'none' }}>
                          <p>Screenshot 2</p>
                      </div>
                        </div>
                      </div>

                  <div className="screenshot-card-fresh">
                    <div className="screenshot-card-image-wrapper">
                        <img 
                          src="/images/id-card-printing/screenshot-3.jpg" 
                          alt="ID Card Cropping Tool"
                        className="screenshot-card-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      <div className="screenshot-card-placeholder" style={{ display: 'none' }}>
                          <p>Screenshot 3</p>
                      </div>
                        </div>
                      </div>

                  <div className="screenshot-card-fresh">
                    <div className="screenshot-card-image-wrapper">
                        <img 
                          src="/images/id-card-printing/screenshot-4.jpg" 
                          alt="ID Card Processing"
                        className="screenshot-card-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      <div className="screenshot-card-placeholder" style={{ display: 'none' }}>
                          <p>Screenshot 4</p>
                        </div>
                      </div>
                    </div>
                  </div>

                <div className="features-section-fresh">
                  <div className="section-header-fresh">
                    <h2 className="section-title-fresh">Powerful Features</h2>
                    <p className="section-subtitle-fresh">Everything you need for professional ID card printing</p>
                    <div className="section-divider"></div>
                    </div>
                  <div className="features-grid-fresh">
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">🔄</div>
                      <h3 className="feature-card-title">Front & Back Printing</h3>
                      <p className="feature-card-description">Print both sides of ID cards with perfect alignment. Supports double-sided printing on A4 paper.</p>
                    </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">📄</div>
                      <h3 className="feature-card-title">Multiple Cards Per Page</h3>
                      <p className="feature-card-description">Print multiple ID cards at once on a single A4 page. Up to 8 cards per page in a 2x4 grid layout.</p>
                        </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">🔢</div>
                      <h3 className="feature-card-title">Copy Count Control</h3>
                      <p className="feature-card-description">Set the number of copies for each ID card design independently. Maximum 8 copies per design.</p>
                      </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">✨</div>
                      <h3 className="feature-card-title">Image Enhancement Filters</h3>
                      <p className="feature-card-description">Apply filters (Original, Auto, Gray) to enhance image clarity and quality for better printing results.</p>
                        </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">💡</div>
                      <h3 className="feature-card-title">Brightness Adjustment</h3>
                      <p className="feature-card-description">Fine-tune brightness levels with an intuitive slider to achieve optimal print quality.</p>
                      </div>
                    <div className="feature-card-fresh">
                      <div className="feature-card-icon">✂️</div>
                      <h3 className="feature-card-title">Rotate & Crop Tools</h3>
                      <p className="feature-card-description">Rotate and crop ID card images with precision. Extract cards with rotation support for perfect alignment.</p>
                        </div>
                      </div>
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
                      disabled={isGoogleSigningIn}
                      style={{ opacity: isGoogleSigningIn ? 0.7 : 1, cursor: isGoogleSigningIn ? 'wait' : 'pointer' }}
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

    {/* Footer */}
    <footer className="homepage-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section footer-about">
            <h3 className="footer-title">About GLORY</h3>
            <p className="footer-description">
              Your trusted partner for professional CV building, ID card printing, and marketplace services. 
              We help you create professional documents that make a lasting impression.
            </p>
            <div className="footer-logo">
              <img 
                src="/images/glory-logo.png" 
                alt="GLORY Logo" 
                className="footer-logo-image"
                onError={(e) => {
                  console.error('Footer logo failed to load:', e.target.src);
                  // Don't hide, show a fallback text instead
                  e.target.style.display = 'none';
                  const fallback = document.createElement('span');
                  fallback.textContent = 'GLORY';
                  fallback.style.color = '#ffffff';
                  fallback.style.fontSize = '1.5rem';
                  fallback.style.fontWeight = '700';
                  e.target.parentNode.appendChild(fallback);
                }}
              />
            </div>
          </div>

          <div className="footer-section footer-services">
            <h3 className="footer-title">Our Services</h3>
            <ul className="footer-links">
              <li><a href="/#products">Marketplace</a></li>
              <li><a href="/#products">CV Builder</a></li>
              <li><a href="/#products">ID Card Printer</a></li>
              <li><a href="/#products">Professional Templates</a></li>
            </ul>
          </div>

          <div className="footer-section footer-contact">
            <h3 className="footer-title">Contact Us</h3>
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon-wrapper contact-icon-phone">
                  <svg className="contact-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.01 15.38C18.78 15.38 17.59 15.18 16.48 14.82C16.13 14.7 15.74 14.79 15.47 15.06L13.9 17.03C11.07 15.68 8.42 13.13 7.01 10.2L8.96 8.58C9.23 8.31 9.31 7.92 9.2 7.57C8.84 6.41 8.64 5.22 8.64 3.99C8.64 3.45 8.19 3 7.65 3H4.19C3.65 3 3 3.24 3 3.99C3 13.28 10.73 21 20.01 21C20.76 21 21 20.37 21 19.82V16.37C21 15.83 20.55 15.38 20.01 15.38Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <span className="contact-label">PHONE</span>
                  <a href="tel:03153338612" className="contact-value">0315-3338612</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon-wrapper contact-icon-whatsapp">
                  <svg className="contact-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <span className="contact-label">WHATSAPP</span>
                  <a href="https://wa.me/9231553338612" target="_blank" rel="noopener noreferrer" className="contact-value">0315-3338612</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon-wrapper contact-icon-email">
                  <svg className="contact-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <span className="contact-label">EMAIL</span>
                  <a href="mailto:glorycomposing@gmail.com" className="contact-value">glorycomposing@gmail.com</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon-wrapper contact-icon-address">
                  <svg className="contact-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="contact-details">
                  <span className="contact-label">ADDRESS</span>
                  <div className="contact-value contact-address">
                    <div className="address-line">E-850/C, Main Road</div>
                    <div className="address-line">Nishat Colony Lahore Cantt.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} GLORY. All rights reserved.</p>
            <p className="footer-tagline">Empowering professionals with quality tools and services.</p>
          </div>
        </div>
      </div>
    </footer>

    </>
  );
};

export default ProductsPage;

