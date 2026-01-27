import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HomePage.css';
import '../Products/Marketplace.css';
import { authService } from '../Supabase/supabase';
import { supabase } from '../Supabase/supabase';
import { addToCart } from '../../utils/cart';

const HomePage = ({ onProductSelect }) => {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const location = useLocation();
  
  // Check authentication status
  const isAuthenticated = localStorage.getItem('cvBuilderAuth') === 'true';
  
  // Login form state
  const [showLogin, setShowLogin] = useState(false);
  
  // Debug: Log when showLogin changes
  useEffect(() => {
    console.log('HomePage: showLogin state changed to:', showLogin);
  }, [showLogin]);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [showBecomeShopkeeper, setShowBecomeShopkeeper] = useState(false);
  const [isUpdatingUserType, setIsUpdatingUserType] = useState(false);
  
  // Marketplace products state
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [adminShopName, setAdminShopName] = useState('Glory');

  // Shuffle array function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Load featured products
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setProductsLoading(true);
        
        // Load admin shop name
        try {
          const { data: adminUsers } = await supabase
            .from('users')
            .select('shop_name')
            .eq('is_admin', true)
            .limit(1)
            .single();
          
          if (adminUsers?.shop_name) {
            setAdminShopName(adminUsers.shop_name);
          }
        } catch (err) {
          // Silent fail
        }
        
        // Load products
        const { data, error } = await supabase
          .from('marketplace_products')
          .select('*, marketplace_sections(name), shopkeeper:users!shopkeeper_id(shop_name)')
          .or('is_hidden.is.null,is_hidden.eq.false')
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;
        
        // Shuffle and set products
        const shuffled = shuffleArray(data || []);
        setFeaturedProducts(shuffled);
      } catch (err) {
        console.error('Error loading featured products:', err);
      } finally {
        setProductsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  // Get product images
  const getProductImages = (product) => {
    if (!product) return null;
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    if (product.image_url) {
      return product.image_url;
    }
    return null;
  };

  // Handle product click
  const handleProductClick = (product) => {
    navigate(`/#product/${product.id}`);
  };

  // Handle add to cart
  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if ((product.stock || 0) === 0) {
      alert('This product is out of stock.');
      return;
    }
    addToCart(product);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  // Handle buy now
  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    if ((product.stock || 0) === 0) {
      alert('This product is out of stock.');
      return;
    }
    addToCart(product);
    navigate('/checkout');
  };
  const handleGetStarted = (productId) => {
    if (productId === 'marketplace') {
      // Marketplace is accessible without login - navigate directly
      // Preserve authentication state before navigation
      const wasAuthenticated = localStorage.getItem('cvBuilderAuth') === 'true';
      
      // Set navigation flag to prevent auth clearing during navigation
      sessionStorage.setItem('isNavigating', 'true');
      sessionStorage.setItem('navigationTimestamp', Date.now().toString());
      
      localStorage.setItem('selectedApp', 'marketplace');
      // Clear any login flags that might be set from previous actions
      sessionStorage.removeItem('showLoginForm');
      localStorage.removeItem('showLoginForm');
      sessionStorage.removeItem('showProductsPage');
      localStorage.removeItem('showProductsPage');
      // Don't set any login flags - marketplace is public
      // Dispatch event to set explicitlyClickedMarketplaceRef in App.js
      window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'marketplace' }));
      
      // Use React Router navigation instead of window.location.href to avoid full page reload
      // This preserves authentication state
      navigate('/marketplace');
      
      // Restore auth state after navigation (in case it was cleared during navigation)
      if (wasAuthenticated) {
        setTimeout(() => {
          localStorage.setItem('cvBuilderAuth', 'true');
        }, 100);
      }
      return;
    }
    
    // For CV Builder and ID Card Print, check authentication
    const checkAuth = async () => {
      try {
        const isAuthInStorage = localStorage.getItem('cvBuilderAuth');
        if (isAuthInStorage) {
          // User is authenticated - navigate directly
          if (productId === 'cv-builder') {
            // Navigate to CV Builder dashboard
            sessionStorage.setItem('navigateToCVBuilder', 'true');
            localStorage.setItem('navigateToCVBuilder', 'true');
            localStorage.setItem('selectedApp', 'cv-builder');
            localStorage.setItem('cvView', 'dashboard');
            // Clear any marketplace flags
            localStorage.removeItem('showProductsPage');
            sessionStorage.removeItem('showProductsPage');
            // Navigate to /cv-builder route using React Router
            navigate('/cv-builder');
          } else if (productId === 'id-card-print') {
            // Navigate to ID Card Dashboard
            // Set navigation flags FIRST to prevent logout on page reload
            sessionStorage.setItem('isNavigating', 'true');
            sessionStorage.setItem('navigationTimestamp', Date.now().toString());
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('selectedApp', 'id-card-print');
            localStorage.setItem('idCardView', 'dashboard');
            // Clear any marketplace flags
            localStorage.removeItem('showProductsPage');
            sessionStorage.removeItem('showProductsPage');
            // Navigate to /id-card-print route using React Router
            navigate('/id-card-print');
          }
        } else {
          // User is not authenticated - show login form
          if (productId === 'cv-builder') {
            sessionStorage.setItem('navigateToCVBuilder', 'true');
            localStorage.setItem('selectedApp', 'cv-builder');
            localStorage.setItem('showLoginForm', 'true');
            sessionStorage.setItem('showLoginForm', 'true');
            // Use React Router navigation instead of window.location.href
            navigate('/marketplace');
          } else if (productId === 'id-card-print') {
            // User is not authenticated - show login form on homepage
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('selectedApp', 'id-card-print');
            localStorage.setItem('showLoginForm', 'true');
            sessionStorage.setItem('showLoginForm', 'true');
            // Show login form on homepage (don't navigate away)
            setShowLogin(true);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  };

  // Check for showLoginForm flag and expose function to show login form
  useEffect(() => {
    // Check flag on mount and after a short delay (for production navigation timing)
    const checkAndShowLogin = () => {
      const shouldShowLogin = sessionStorage.getItem('showLoginForm') === 'true' ||
                              localStorage.getItem('showLoginForm') === 'true';
      
      if (shouldShowLogin) {
        const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
        if (!isAuth) {
          console.log('HomePage: Setting showLogin to true from storage flag');
          setShowLogin(true);
          return true;
        }
      }
      return false;
    };
    
    // Check immediately
    checkAndShowLogin();
    
    // Also check after a delay to handle navigation timing in production
    const timeoutId = setTimeout(() => {
      checkAndShowLogin();
    }, 100);

    // Expose function to show login form
    window.showLoginFormHomepage = () => {
      console.log('HomePage: showLoginFormHomepage called');
      const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
      console.log('HomePage: isAuth check:', isAuth);
      if (!isAuth) {
        console.log('HomePage: User not authenticated, setting showLogin to true');
        // Also ensure flags are set
        localStorage.setItem('showLoginForm', 'true');
        sessionStorage.setItem('showLoginForm', 'true');
        // Direct state update
        setShowLogin(true);
        console.log('HomePage: setShowLogin(true) called');
      } else {
        console.log('HomePage: User already authenticated, not showing login form');
      }
    };

    // Listen for showLoginFormHomepage event
    const handleShowLoginForm = (e) => {
      console.log('HomePage: showLoginFormHomepage event received', e);
      const flagSet = sessionStorage.getItem('showLoginForm') === 'true' ||
                      localStorage.getItem('showLoginForm') === 'true';
      if (flagSet) {
        const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
        if (!isAuth) {
          console.log('HomePage: Setting showLogin to true from event');
          setShowLogin(true);
        }
      }
    };
    window.addEventListener('showLoginFormHomepage', handleShowLoginForm);

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showLogin) {
        setShowLogin(false);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
        if (!isAuth) {
          localStorage.setItem('showLoginForm', 'true');
          sessionStorage.setItem('showLoginForm', 'true');
        }
      }
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      delete window.showLoginFormHomepage;
      window.removeEventListener('showLoginFormHomepage', handleShowLoginForm);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showLogin]); // Include showLogin as dependency

  // Separate effect for escape key handling that depends on showLogin
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showLogin) {
        setShowLogin(false);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
        if (!isAuth) {
          localStorage.setItem('showLoginForm', 'true');
          sessionStorage.setItem('showLoginForm', 'true');
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showLogin]);

  // Check for showLoginForm flag when location changes (for production navigation)
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      const checkFlag = () => {
        const shouldShowLogin = sessionStorage.getItem('showLoginForm') === 'true' ||
                                localStorage.getItem('showLoginForm') === 'true';
        
        if (shouldShowLogin) {
          const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
          if (!isAuth && !showLogin) {
            console.log('HomePage: Location changed, showing login form from flag');
            setShowLogin(true);
            return true;
          }
        }
        return false;
      };
      
      // Check immediately
      checkFlag();
      
      // Check with delays to handle navigation timing
      setTimeout(() => checkFlag(), 50);
      setTimeout(() => checkFlag(), 100);
      setTimeout(() => checkFlag(), 200);
      setTimeout(() => checkFlag(), 300);
    }
  }, [location.pathname, showLogin]);

  // Login handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const { error } = await authService.signIn(email, password);
        
        if (error) {
          setError('Login failed: ' + error.message);
          return;
        }
        
        localStorage.setItem('cvBuilderAuth', 'true');
        // Set flags to prevent checkAuth and App.js from clearing auth state
        // Set both flags to ensure compatibility with all auth checks
        const loginTimestamp = Date.now();
        sessionStorage.setItem('justAuthenticated', 'true');
        sessionStorage.setItem('justLoggedIn', loginTimestamp.toString());
        // Clear these flags after navigation completes (longer delay)
        setTimeout(() => {
          sessionStorage.removeItem('justAuthenticated');
        }, 5000); // 5 seconds to ensure navigation completes
        setTimeout(() => {
          sessionStorage.removeItem('justLoggedIn');
        }, 10000); // 10 seconds for App.js auth handler
        
        setLoginSuccess(true);
        setError('');
        // Dispatch authentication event
        window.dispatchEvent(new CustomEvent('userAuthenticated'));
        
        // Check if user wants to navigate to CV Builder or ID Card Print
        const navigateToCVBuilder = sessionStorage.getItem('navigateToCVBuilder') === 'true' || localStorage.getItem('navigateToCVBuilder') === 'true';
        const navigateToIDCardPrint = sessionStorage.getItem('navigateToIDCardPrint') === 'true' || localStorage.getItem('navigateToIDCardPrint') === 'true';
        
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
            // Clear login form flags
            sessionStorage.removeItem('showLoginForm');
            localStorage.removeItem('showLoginForm');
            // Set flag to indicate this is a navigation, not a close
            sessionStorage.setItem('isNavigating', 'true');
            sessionStorage.setItem('navigationTimestamp', Date.now().toString());
            
            if (navigateToIDCardPrint) {
              // Navigate to ID Card Dashboard
              localStorage.setItem('selectedApp', 'id-card-print');
              localStorage.setItem('idCardView', 'dashboard');
              // Navigate to /id-card-print route using React Router
              navigate('/id-card-print');
            } else if (navigateToCVBuilder) {
              // Navigate to CV Builder dashboard
              localStorage.setItem('selectedApp', 'cv-builder');
              localStorage.setItem('cvView', 'dashboard');
              navigate('/cv-builder');
            }
          } else {
            // No navigation flags - user should land on homepage after login
            // Clear selectedApp to show homepage
            localStorage.removeItem('selectedApp');
            // Clear all marketplace and login flags
            sessionStorage.removeItem('showProductsPage');
            localStorage.removeItem('showProductsPage');
            sessionStorage.removeItem('showLoginForm');
            localStorage.removeItem('showLoginForm');
            // Don't reload - let the auth state change handle the UI update
            // The auth state change event will trigger a re-render in App.js
            console.log('Login successful - staying on homepage');
          }
        }, 1500); // Show success message for 1.5 seconds
      } else {
        // Signup
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        // All new signups are regular users by default
        const { error } = await authService.signUp(email, password, {
          full_name: email.split('@')[0],
          user_type: 'regular'
        });
        
        if (error) {
          setError('Signup failed: ' + error.message);
          return;
        }
        
        setError('Signup successful! Please check your email to confirm your account, then login.');
        setIsLogin(true);
      }
    } catch (err) {
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
      setError('Failed to send reset email: ' + err.message);
    }
  };

  const handleBecomeShopkeeper = async () => {
    if (!isAuthenticated) {
      setShowBecomeShopkeeper(false);
      setShowLogin(true);
      return;
    }

    setIsUpdatingUserType(true);
    setError('');

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setError('Please sign in first');
        setIsUpdatingUserType(false);
        return;
      }

      // Check if user is already a shopkeeper
      const currentUserType = user.user_metadata?.user_type;
      if (currentUserType === 'shopkeeper') {
        setError('You are already a shopkeeper!');
        setIsUpdatingUserType(false);
        setShowBecomeShopkeeper(false);
        // Redirect to shopkeeper dashboard
        setTimeout(() => {
          window.location.href = '/shopkeeper';
        }, 1500);
        return;
      }

      // Update user type to shopkeeper
      await authService.updateUserMetadata({
        user_type: 'shopkeeper',
        ...user.user_metadata
      });

      setError('Success! You are now a shopkeeper. Redirecting to your dashboard...');
      setShowBecomeShopkeeper(false);
      
      // Redirect to shopkeeper dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/shopkeeper';
      }, 1500);
    } catch (err) {
      console.error('Error updating user type:', err);
      setError('Failed to update account type: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdatingUserType(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setError('');
  };

  const handleGoogleSignIn = useCallback(async (e) => {
    console.log('handleGoogleSignIn called', { isGoogleSigningIn });
    
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent if already signing in
    if (isGoogleSigningIn) {
      console.log('Already signing in, returning');
      return;
    }
    
    setError('');
    setIsGoogleSigningIn(true);
    
    // All Google sign-ins create regular users by default
    // Store 'regular' as default user type for OAuth callback
    sessionStorage.setItem('pendingUserType', 'regular');
    
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
      console.log('Attempting Google sign-in (default: regular user)');
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
  }, [isGoogleSigningIn]);

  return (
    <div className="homepage-new">
      <div className="homepage-container-new">
        {/* Hero Section - Mobile First */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="glory-text">Glory</span>
            </h1>
            <p className="hero-subtitle">
              Your one-stop destination for quality products and professional services
            </p>
            
            {/* Prominent Google Sign In Button */}
            {!isAuthenticated && (
              <div className="hero-cta">
                <button 
                  type="button" 
                  onClick={handleGoogleSignIn}
                  className="google-button-hero"
                  disabled={isGoogleSigningIn}
                >
                  <svg className="google-icon-hero" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{isGoogleSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
                </button>
                <p className="hero-cta-note">
                  Quick & secure sign in. Most users choose Google.
                </p>
                <button 
                  className="email-login-link"
                  onClick={() => setShowLogin(true)}
                >
                  Or sign in with email (Admin/Test accounts)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Marketplace Section - Primary Focus with Products */}
        <div className="section-marketplace">
          <div className="section-header">
            <h2 className="section-title">🛍️ Featured Products</h2>
            <p className="section-description">
              Discover amazing products from trusted sellers. Shop with confidence and get the best deals.
            </p>
          </div>

          {/* Featured Products Grid */}
          {productsLoading ? (
            <div className="products-loading">Loading products...</div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="homepage-products-grid">
                {featuredProducts.map((product) => {
                  const imageUrl = getProductImages(product);
                  const isOutOfStock = (product.stock || 0) === 0;
                  
                  return (
                    <div 
                      key={product.id} 
                      className="homepage-product-card"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="homepage-product-image-container">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={product.name}
                            className="homepage-product-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="homepage-product-placeholder">📦</div>
                        )}
                        {isOutOfStock && (
                          <div className="homepage-product-stock-badge">Out of Stock</div>
                        )}
                      </div>
                      <div className="homepage-product-info">
                        <h3 className="homepage-product-name">{product.name}</h3>
                        <div className="homepage-product-shop">
                          {product.shopkeeper_id && product.shopkeeper?.shop_name 
                            ? `By: ${product.shopkeeper.shop_name}`
                            : product.shopkeeper_id 
                              ? 'By: Shop' 
                              : `By: ${adminShopName}`}
                        </div>
                        <div className="homepage-product-price">
                          {product.original_price && product.original_price > product.price ? (
                            <>
                              <span className="homepage-price-current">Rs. {product.price?.toLocaleString() || '0'}</span>
                              <span className="homepage-price-old">Rs. {product.original_price?.toLocaleString() || '0'}</span>
                            </>
                          ) : (
                            <span className="homepage-price-current">Rs. {product.price?.toLocaleString() || '0'}</span>
                          )}
                        </div>
                        <div className="homepage-product-actions">
                          <button
                            className="homepage-btn-buy"
                            onClick={(e) => handleBuyNow(e, product)}
                            disabled={isOutOfStock}
                          >
                            Buy Now
                          </button>
                          <button
                            className="homepage-btn-cart"
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={isOutOfStock}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="marketplace-cta">
                <button 
                  className="cta-button-primary"
                  onClick={() => handleGetStarted('marketplace')}
                >
                  View All Products →
                </button>
                <p className="cta-note">Browse thousands of products. No account needed to explore.</p>
              </div>
            </>
          ) : (
            <div className="products-empty">
              <p>No products available at the moment.</p>
              <button 
                className="cta-button-primary"
                onClick={() => handleGetStarted('marketplace')}
              >
                Explore Marketplace →
              </button>
            </div>
          )}
        </div>

        {/* CV Builder Section - Secondary Focus */}
        <div className="section-cv-builder">
          <div className="section-header">
            <h2 className="section-title">📄 CV Builder</h2>
            <p className="section-description">
              Create professional CVs and resumes in minutes. No design skills needed. Multiple templates available.
            </p>
          </div>

          <div className="cv-features">
            <div className="cv-feature-item">
              <span className="cv-feature-icon">⚡</span>
              <div className="cv-feature-content">
                <h3>Quick & Easy</h3>
                <p>Fill in your details and get a professional CV ready in minutes. No complicated forms or confusing steps.</p>
              </div>
            </div>
            <div className="cv-feature-item">
              <span className="cv-feature-icon">🎨</span>
              <div className="cv-feature-content">
                <h3>Beautiful Templates</h3>
                <p>Choose from multiple professional templates designed by experts. All templates are ATS-friendly and print-ready.</p>
              </div>
            </div>
            <div className="cv-feature-item">
              <span className="cv-feature-icon">💾</span>
              <div className="cv-feature-content">
                <h3>Auto-Save</h3>
                <p>Your progress is automatically saved. Access and edit your CV anytime, anywhere. Never lose your work.</p>
              </div>
            </div>
            <div className="cv-feature-item">
              <span className="cv-feature-icon">📥</span>
              <div className="cv-feature-content">
                <h3>PDF Download</h3>
                <p>Download your CV as high-quality PDF. Perfect for printing or emailing to employers. Professional format guaranteed.</p>
              </div>
            </div>
          </div>

          <div className="cv-cta">
            <button 
              className="cta-button-secondary"
              onClick={() => handleGetStarted('cv-builder')}
            >
              Build Your CV →
            </button>
            <p className="cta-note">Sign in required. Use Google for quick access.</p>
          </div>
        </div>

        {/* Become a Shopkeeper Section */}
        <div className="section-become-shopkeeper">
          <div className="section-header">
            <h2 className="section-title">🏪 Become a Shopkeeper</h2>
            <p className="section-description">
              Start selling your products and offering services to customers. Join our marketplace and grow your business.
            </p>
          </div>

          <div className="become-shopkeeper-features-preview">
            <div className="become-shopkeeper-feature-preview">
              <span className="become-shopkeeper-icon">🛍️</span>
              <p>Sell Products</p>
            </div>
            <div className="become-shopkeeper-feature-preview">
              <span className="become-shopkeeper-icon">📄</span>
              <p>Bulk CVs</p>
            </div>
            <div className="become-shopkeeper-feature-preview">
              <span className="become-shopkeeper-icon">🪪</span>
              <p>ID Cards</p>
            </div>
            <div className="become-shopkeeper-feature-preview">
              <span className="become-shopkeeper-icon">📊</span>
              <p>Track Sales</p>
            </div>
          </div>

          <div className="become-shopkeeper-cta-section">
            <button 
              className="become-shopkeeper-cta-button"
              onClick={() => setShowBecomeShopkeeper(true)}
            >
              Learn More & Register →
            </button>
            <p className="become-shopkeeper-note">
              {isAuthenticated ? 'Click to upgrade your account' : 'Sign up first, then become a shopkeeper'}
            </p>
          </div>
        </div>

        {/* Become a Shopkeeper Section */}
        <div className="section-become-shopkeeper">
          <div className="section-header">
            <h2 className="section-title">🏪 Become a Shopkeeper</h2>
            <p className="section-description">
              Start selling your products and offering services to customers. Join our marketplace and grow your business.
            </p>
          </div>

          <div className="become-shopkeeper-features-preview">
            <div className="become-shopkeeper-feature-preview">
              <span className="become-shopkeeper-icon">🛍️</span>
              <p>Sell Products</p>
            </div>
            <div className="become-shopkeeper-feature-preview">
              <span className="become-shopkeeper-icon">📄</span>
              <p>Bulk CVs</p>
            </div>
            <div className="become-shopkeeper-feature-preview">
              <span className="become-shopkeeper-icon">🪪</span>
              <p>ID Cards</p>
            </div>
            <div className="become-shopkeeper-feature-preview">
              <span className="become-shopkeeper-icon">📊</span>
              <p>Track Sales</p>
            </div>
          </div>

          <div className="become-shopkeeper-cta-section">
            <button 
              className="become-shopkeeper-cta-button"
              onClick={() => setShowBecomeShopkeeper(true)}
            >
              Learn More & Register →
            </button>
            <p className="become-shopkeeper-note">
              {isAuthenticated ? 'Click to upgrade your account' : 'Sign up first, then become a shopkeeper'}
            </p>
          </div>
        </div>

        {/* ID Card Printing Section - Tertiary Focus */}
        <div className="section-id-card">
          <div className="section-header">
            <h2 className="section-title">🖨️ ID Card Printer</h2>
            <p className="section-description">
              Print multiple ID cards on a single A4 page. Perfect for offices, schools, and organizations.
            </p>
          </div>

          <div className="id-card-features">
            <div className="id-card-feature-item">
              <span className="id-card-feature-icon">📄</span>
              <h3>Multiple Cards Per Page</h3>
              <p>Print up to 8 ID cards on a single A4 page. Save paper and printing costs.</p>
            </div>
            <div className="id-card-feature-item">
              <span className="id-card-feature-icon">🔄</span>
              <h3>Front & Back</h3>
              <p>Print both sides of ID cards with perfect alignment. Professional results every time.</p>
            </div>
            <div className="id-card-feature-item">
              <span className="id-card-feature-icon">⚙️</span>
              <h3>Easy to Use</h3>
              <p>Simple interface for uploading photos and entering details. No technical knowledge required.</p>
            </div>
          </div>

          <div className="id-card-cta">
            <button 
              className="cta-button-secondary"
              onClick={() => handleGetStarted('id-card-print')}
            >
              Start Printing →
            </button>
            <p className="cta-note">Sign in required. Use Google for quick access.</p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="footer-cta">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of users who trust Glory for their shopping and professional needs.</p>
          {!isAuthenticated && (
            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              className="google-button-footer"
              disabled={isGoogleSigningIn}
            >
              <svg className="google-icon-hero" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          )}
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
          const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
          if (!isAuth) {
            localStorage.setItem('showLoginForm', 'true');
            sessionStorage.setItem('showLoginForm', 'true');
          }
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
                const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
                if (!isAuth) {
                  localStorage.setItem('showLoginForm', 'true');
                  sessionStorage.setItem('showLoginForm', 'true');
                }
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="login-card-inline">
              <div className="login-header-inline">
                <h2>Welcome</h2>
                <p>{isLogin ? 'Sign in to access all products' : 'Get Started - It\'s Free!'}</p>
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

              {/* Google Sign In Button - First */}
              {!showForgotPassword && (
                <>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      console.log('Google button clicked - onClick handler');
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('State check:', { isGoogleSigningIn });
                      if (!isGoogleSigningIn) {
                        console.log('Calling handleGoogleSignIn');
                        handleGoogleSignIn(e);
                      } else {
                        console.log('Button disabled, not calling handler');
                      }
                    }}
                    onMouseDown={(e) => {
                      console.log('Google button mouseDown');
                      e.stopPropagation();
                    }}
                    className="google-button-inline"
                    disabled={isGoogleSigningIn}
                    style={{ 
                      opacity: isGoogleSigningIn ? 0.7 : 1, 
                      cursor: isGoogleSigningIn ? 'wait' : 'pointer',
                      marginBottom: '1.5rem',
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 10
                    }}
                    aria-label="Continue with Google"
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isGoogleSigningIn ? 'Signing in...' : 'Continue with Google'}
                  </button>

                  <div className="divider-inline">
                    <span>or</span>
                  </div>
                </>
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
                        <label htmlFor="reset-email-homepage">Email Address</label>
                        <input
                          type="email"
                          id="reset-email-homepage"
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
                    <label htmlFor="email-homepage">Email Address</label>
                    <input
                      type="email"
                      id="email-homepage"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="form-group-inline">
                    <label htmlFor="password-homepage">Password</label>
                    <input
                      type="password"
                      id="password-homepage"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {!isLogin && (
                    <div className="form-group-inline">
                      <label htmlFor="confirmPassword-homepage">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword-homepage"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  )}
                  <button type="submit" className="login-button-inline">
                    {isLogin ? 'Sign In' : 'Get Started'}
                  </button>
                </form>
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

      {/* Become a Shopkeeper Modal */}
      {showBecomeShopkeeper && (
        <div className="become-shopkeeper-modal-overlay" onClick={() => setShowBecomeShopkeeper(false)}>
          <div className="become-shopkeeper-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="become-shopkeeper-close"
              onClick={() => setShowBecomeShopkeeper(false)}
            >
              ×
            </button>
            <h2>Become a Shopkeeper</h2>
            <p className="become-shopkeeper-subtitle">
              Join our marketplace and start selling your products to customers. As a shopkeeper, you'll have access to powerful tools to grow your business.
            </p>
            
            <div className="shopkeeper-features-list">
              <div className="shopkeeper-feature-item">
                <div className="shopkeeper-feature-icon">🛍️</div>
                <div className="shopkeeper-feature-content">
                  <h3>Sell your Products to Customers</h3>
                  <p>Upload and manage your product catalog. Reach thousands of customers and grow your sales.</p>
                </div>
              </div>
              
              <div className="shopkeeper-feature-item">
                <div className="shopkeeper-feature-icon">📄</div>
                <div className="shopkeeper-feature-content">
                  <h3>Make Bulk CV's for Customers</h3>
                  <p>Offer professional CV creation services to your customers. Create multiple CVs efficiently.</p>
                </div>
              </div>
              
              <div className="shopkeeper-feature-item">
                <div className="shopkeeper-feature-icon">🪪</div>
                <div className="shopkeeper-feature-content">
                  <h3>Print ID Cards Front and Back</h3>
                  <p>Print professional ID cards with front and back designs for your customers.</p>
                </div>
              </div>
              
              <div className="shopkeeper-feature-item">
                <div className="shopkeeper-feature-icon">📋</div>
                <div className="shopkeeper-feature-content">
                  <h3>Print Multiple ID Cards on Single Page</h3>
                  <p>Efficiently print multiple ID cards on a single page to save time and resources.</p>
                </div>
              </div>
              
              <div className="shopkeeper-feature-item">
                <div className="shopkeeper-feature-icon">📊</div>
                <div className="shopkeeper-feature-content">
                  <h3>Manage Inventory</h3>
                  <p>Track your products, manage stock levels, and keep your inventory organized.</p>
                </div>
              </div>
              
              <div className="shopkeeper-feature-item">
                <div className="shopkeeper-feature-icon">💰</div>
                <div className="shopkeeper-feature-content">
                  <h3>Track Sales</h3>
                  <p>Monitor your sales performance, view analytics, and track your business growth.</p>
                </div>
              </div>
              
              <div className="shopkeeper-feature-item">
                <div className="shopkeeper-feature-icon">🏪</div>
                <div className="shopkeeper-feature-content">
                  <h3>Shop Dashboard</h3>
                  <p>Access a comprehensive dashboard to manage all aspects of your shop in one place.</p>
                </div>
              </div>
            </div>
            
            {!isAuthenticated ? (
              <div className="become-shopkeeper-cta">
                <p className="become-shopkeeper-cta-text">Sign up or log in to become a shopkeeper</p>
                <button 
                  className="become-shopkeeper-btn"
                  onClick={() => {
                    setShowBecomeShopkeeper(false);
                    setShowLogin(true);
                  }}
                >
                  Get Started
                </button>
              </div>
            ) : (
              <div className="become-shopkeeper-cta">
                <button 
                  className="become-shopkeeper-btn"
                  onClick={handleBecomeShopkeeper}
                  disabled={isUpdatingUserType}
                >
                  {isUpdatingUserType ? 'Updating...' : 'Become a Shopkeeper'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

