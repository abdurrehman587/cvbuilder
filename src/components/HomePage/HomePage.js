import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HomePage.css';
import '../Products/Marketplace.css';
import { authService } from '../Supabase/supabase';

const HomePage = ({ onProductSelect }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Login form state
  const [showLogin, setShowLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('regular');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [pendingGoogleSignIn, setPendingGoogleSignIn] = useState(false);
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
    // Check flag on mount
    const shouldShowLogin = sessionStorage.getItem('showLoginForm') === 'true' ||
                            localStorage.getItem('showLoginForm') === 'true';
    
    if (shouldShowLogin) {
      const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
      if (!isAuth) {
        setShowLogin(true);
      }
    }

    // Expose function to show login form
    window.showLoginFormHomepage = () => {
      setShowLogin(true);
    };

    // Listen for showLoginFormHomepage event
    const handleShowLoginForm = () => {
      const flagSet = sessionStorage.getItem('showLoginForm') === 'true' ||
                      localStorage.getItem('showLoginForm') === 'true';
      if (flagSet) {
        const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
        if (!isAuth) {
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
        setUserType('regular');
        const isAuth = localStorage.getItem('cvBuilderAuth') === 'true';
        if (!isAuth) {
          localStorage.setItem('showLoginForm', 'true');
          sessionStorage.setItem('showLoginForm', 'true');
        }
      }
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      delete window.showLoginFormHomepage;
      window.removeEventListener('showLoginFormHomepage', handleShowLoginForm);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showLogin]);

  // Login handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await authService.signIn(email, password);
        
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
          setUserType('regular');
          
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
        if (!userType || (userType !== 'regular' && userType !== 'shopkeeper')) {
          setError('Please select whether you are a Regular User or Shopkeeper');
          return;
        }
        
        const { data, error } = await authService.signUp(email, password, {
          full_name: email.split('@')[0],
          user_type: userType
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
    setUserType('regular');
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

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setError('');
  };

  const handleGoogleSignIn = useCallback(async (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent if already signing in
    if (isGoogleSigningIn || pendingGoogleSignIn) {
      return;
    }
    
    setError('');
    // Show user type selection modal first
    setShowUserTypeModal(true);
    setPendingGoogleSignIn(true);
  }, [isGoogleSigningIn, pendingGoogleSignIn]);
  
  // Mobile-specific touch handler
  const handleGoogleSignInTouch = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Call handleGoogleSignIn directly
    if (isGoogleSigningIn || pendingGoogleSignIn) {
      return;
    }
    setError('');
    setShowUserTypeModal(true);
    setPendingGoogleSignIn(true);
  }, [isGoogleSigningIn, pendingGoogleSignIn]);

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
    <div className="homepage">
      <div className="homepage-container">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <h2 className="welcome-text">
            Welcome to <span className="glory-text">Glory</span>
          </h2>
        </div>

        {/* Homepage Header */}
        <div className="homepage-header">
          <h1 className="homepage-title">Online CV Builder in Pakistan | Free Resume Maker</h1>
          <p className="homepage-subtitle">Create professional CVs online in Pakistan. Free resume builder with modern templates. Download PDF and print your CV instantly. Get Glory offers the best CV builder and resume maker tools for job seekers in Pakistan.</p>
        </div>

        {/* Digital Tools Category */}
        <div className="category-section">
          <h2 className="category-title">Free Resume Builder and CV Maker Tools</h2>
          <div className="category-items">
            <div 
              className="category-item"
              onClick={() => handleGetStarted('cv-builder')}
            >
              <div className="category-item-icon">📄</div>
              <div className="category-item-content">
                <h3 className="category-item-title">Online CV Builder - Free Resume Maker</h3>
                <p className="category-item-description">Create professional CVs online in Pakistan with our free resume builder. Choose from multiple modern templates and download your CV as PDF.</p>
              </div>
              <div className="category-item-arrow">→</div>
            </div>
            <div 
              className="category-item"
              onClick={() => handleGetStarted('id-card-print')}
            >
              <div className="category-item-icon">🪪</div>
              <div className="category-item-content">
                <h3 className="category-item-title">ID Card Printing Utility</h3>
                <p className="category-item-description">Design and print professional ID cards</p>
              </div>
              <div className="category-item-arrow">→</div>
            </div>
          </div>
        </div>

        {/* Products Category */}
        <div className="category-section">
          <h2 className="category-title">Professional Services and Resources</h2>
          <div className="category-items">
            <div 
              className="category-item"
              onClick={() => handleGetStarted('marketplace')}
            >
              <div className="category-item-icon">🛒</div>
              <div className="category-item-content">
                <h3 className="category-item-title">Marketplace</h3>
                <p className="category-item-description">Discover professional services, templates, and resources</p>
              </div>
              <div className="category-item-arrow">→</div>
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
          setUserType('regular');
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
                setUserType('regular');
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
                    <>
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGoogleSignIn(e);
                    }}
                    onTouchStart={(e) => {
                      // Prevent double-firing on mobile
                      e.stopPropagation();
                      handleGoogleSignInTouch(e);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      // Ensure click works on mobile browsers that simulate mouse events
                      if (!isGoogleSigningIn && !pendingGoogleSignIn) {
                        e.stopPropagation();
                      }
                    }}
                    className="google-button-inline"
                    disabled={isGoogleSigningIn || pendingGoogleSignIn}
                    style={{ 
                      opacity: (isGoogleSigningIn || pendingGoogleSignIn) ? 0.7 : 1, 
                      cursor: (isGoogleSigningIn || pendingGoogleSignIn) ? 'wait' : 'pointer',
                      pointerEvents: (isGoogleSigningIn || pendingGoogleSignIn) ? 'none' : 'auto',
                      WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      touchAction: 'manipulation'
                    }}
                    aria-label="Continue with Google"
                    aria-disabled={isGoogleSigningIn || pendingGoogleSignIn}
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
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setShowUserTypeModal(false);
                  setPendingGoogleSignIn(false);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeSelectedForGoogle(userType)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

