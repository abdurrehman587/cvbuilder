import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LeftNavbar.css';
import { authService } from '../Supabase/supabase';

const LeftNavbar = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('marketplace');

  useEffect(() => {
    // Determine active section based on current route
    const updateActiveSection = () => {
      const hash = window.location.hash;
      
      // Check if we're on homepage (no hash or empty hash, and no selectedApp)
      const selectedApp = localStorage.getItem('selectedApp');
      if (!hash || hash === '#' || hash === '') {
        if (!selectedApp || selectedApp === '') {
          setActiveSection('home');
          return;
        }
      }
      
      // Check for marketplace routes (clean URLs and hash for backward compatibility)
      const isMarketplaceRoute = window.location.pathname === '/marketplace' || 
                                 window.location.pathname.startsWith('/product/') ||
                                 hash === '#products' || 
                                 hash.startsWith('#product/');
      const isOtherRoute = window.location.pathname === '/cart' || 
                          window.location.pathname === '/checkout' ||
                          window.location.pathname.startsWith('/order/') ||
                          window.location.pathname.startsWith('/admin') ||
                          hash === '#cart' || 
                          hash === '#checkout' || 
                          hash.startsWith('#order-details') || 
                          hash === '#admin';
      if (isMarketplaceRoute || isOtherRoute) {
        setActiveSection('marketplace');
      } else {
        // Check localStorage for selected app
        if (selectedApp === 'id-card-print') {
          setActiveSection('id-card-printer');
        } else if (selectedApp === 'cv-builder') {
          setActiveSection('cv-builder');
        } else if (selectedApp === 'marketplace') {
          setActiveSection('marketplace');
        } else {
          setActiveSection('home');
        }
      }
    };
    
    // Update on mount
    updateActiveSection();
    
    // Listen for hash changes
    window.addEventListener('hashchange', updateActiveSection);
    
    // Listen for custom navigation events
    const handleNavigate = () => {
      setTimeout(updateActiveSection, 100);
    };
    window.addEventListener('navigateToMarketplace', handleNavigate);
    window.addEventListener('navigateToCVBuilder', handleNavigate);
    window.addEventListener('navigateToIDCardPrinter', handleNavigate);
    
    return () => {
      window.removeEventListener('hashchange', updateActiveSection);
      window.removeEventListener('navigateToMarketplace', handleNavigate);
      window.removeEventListener('navigateToCVBuilder', handleNavigate);
      window.removeEventListener('navigateToIDCardPrinter', handleNavigate);
    };
  }, []);

  const navigateToHomePage = () => {
    // Preserve authentication state first
    const wasAuthenticated = isAuthenticated || localStorage.getItem('cvBuilderAuth') === 'true';
    
    if (wasAuthenticated) {
      // Preserve authentication state
      localStorage.setItem('cvBuilderAuth', 'true');
      // Clear login form flags if authenticated
      sessionStorage.removeItem('showLoginForm');
      localStorage.removeItem('showLoginForm');
    } else {
      // If not authenticated, preserve any existing showLoginForm flag
      // Don't clear it - let it show the login form if needed
    }
    
    // Set navigation flag to prevent logout
    sessionStorage.setItem('isNavigating', 'true');
    sessionStorage.setItem('navigationTimestamp', Date.now().toString());
    
    // Set a flag to indicate homepage navigation intent
    sessionStorage.setItem('navigateToHomePage', 'true');
    
    // Clear navigation flags but preserve auth
    localStorage.removeItem('selectedApp');
    localStorage.removeItem('showProductsPage');
    localStorage.removeItem('navigateToCVBuilder');
    localStorage.removeItem('navigateToIDCardPrint');
    sessionStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('navigateToCVBuilder');
    sessionStorage.removeItem('navigateToIDCardPrint');
    
    // Use React Router navigation instead of window.location manipulation
    // This preserves authentication state and avoids full page reload
    navigate('/');
    
    // Restore auth state after navigation (in case it was cleared during navigation)
    if (wasAuthenticated) {
      setTimeout(() => {
        localStorage.setItem('cvBuilderAuth', 'true');
      }, 100);
    }
  };

  const navigateToMarketplace = () => {
    // Preserve authentication state before navigation
    const wasAuthenticated = isAuthenticated || localStorage.getItem('cvBuilderAuth') === 'true';
    
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
  };

  const navigateToCVBuilder = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to CV Builder after login
      localStorage.setItem('selectedApp', 'cv-builder');
      localStorage.setItem('navigateToCVBuilder', 'true');
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      // Show login form on homepage
      localStorage.setItem('showLoginForm', 'true');
      sessionStorage.setItem('showLoginForm', 'true');
      navigate('/');
      return;
    }
    
    // User is authenticated - navigate to CV Builder
    // Set navigation flags FIRST to prevent logout on page reload
    sessionStorage.setItem('isNavigating', 'true');
    sessionStorage.setItem('navigationTimestamp', Date.now().toString());
    sessionStorage.setItem('navigateToCVBuilder', 'true');
    localStorage.setItem('navigateToCVBuilder', 'true');
    localStorage.setItem('selectedApp', 'cv-builder');
    localStorage.setItem('cvView', 'dashboard');
    // Clear any marketplace flags
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    // Navigate to /cv-builder route using React Router
    navigate('/cv-builder');
  };

  const navigateToIDCardPrinter = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to ID Card Printer after login
      localStorage.setItem('selectedApp', 'id-card-print');
      localStorage.setItem('idCardView', 'dashboard');
      localStorage.setItem('navigateToIDCardPrint', 'true');
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      // Show login form on homepage
      localStorage.setItem('showLoginForm', 'true');
      sessionStorage.setItem('showLoginForm', 'true');
      navigate('/');
      return;
    }
    
    // User is authenticated - navigate to ID Card Dashboard
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
  };

  const handleSignIn = () => {
    console.log('Sign in button clicked', { pathname: location.pathname });
    
    // Always set flags to show login form
    localStorage.setItem('showLoginForm', 'true');
    sessionStorage.setItem('showLoginForm', 'true');
    
    // If already on homepage, try to show login form immediately
    if (location.pathname === '/' || location.pathname === '') {
      console.log('On homepage, showing login form');
      // Try multiple methods to ensure form shows
      const showForm = () => {
        if (typeof window.showLoginFormHomepage === 'function') {
          console.log('Calling window.showLoginFormHomepage()');
          try {
            window.showLoginFormHomepage();
            return true;
          } catch (err) {
            console.error('Error calling showLoginFormHomepage:', err);
          }
        }
        return false;
      };
      
      // Try immediately
      showForm();
      
      // Dispatch event
      console.log('Dispatching showLoginFormHomepage event');
      try {
        window.dispatchEvent(new CustomEvent('showLoginFormHomepage'));
      } catch (err) {
        console.error('Error dispatching event:', err);
      }
      
      // Try with delays to ensure component is ready
      setTimeout(() => showForm(), 50);
      setTimeout(() => showForm(), 100);
      setTimeout(() => showForm(), 200);
      setTimeout(() => showForm(), 300);
      setTimeout(() => showForm(), 500);
    } else {
      console.log('Navigating to homepage to show login form');
      // Navigate to homepage - the flag will be checked on mount
      navigate('/');
      // Also try to show form after navigation with delays
      setTimeout(() => {
        if (typeof window.showLoginFormHomepage === 'function') {
          window.showLoginFormHomepage();
        } else {
          window.dispatchEvent(new CustomEvent('showLoginFormHomepage'));
        }
      }, 100);
      setTimeout(() => {
        if (typeof window.showLoginFormHomepage === 'function') {
          window.showLoginFormHomepage();
        } else {
          window.dispatchEvent(new CustomEvent('showLoginFormHomepage'));
        }
      }, 300);
      setTimeout(() => {
        if (typeof window.showLoginFormHomepage === 'function') {
          window.showLoginFormHomepage();
        }
      }, 500);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      localStorage.removeItem('cvBuilderAuth');
      localStorage.removeItem('selectedApp');
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('cvBuilderAuth');
      localStorage.removeItem('selectedApp');
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Desktop Left Navbar */}
      <nav className="left-navbar">
        <div className="left-navbar-content">
          <ul className="left-navbar-menu">
            {/* Sign In / Sign Out Button */}
            <li>
              {!isAuthenticated ? (
                <button
                  className="left-navbar-item signin-navbar-btn"
                  onClick={handleSignIn}
                >
                  <span className="nav-icon">🔐</span>
                  <span className="nav-text">Sign In</span>
                </button>
              ) : (
                <button
                  className="left-navbar-item signout-navbar-btn"
                  onClick={handleLogout}
                >
                  <span className="nav-icon">🚪</span>
                  <span className="nav-text">Sign Out</span>
                </button>
              )}
            </li>
            <li>
              <button
                className={`left-navbar-item ${activeSection === 'home' ? 'active' : ''}`}
                onClick={navigateToHomePage}
              >
                <span className="nav-icon">🏠</span>
                <span className="nav-text">Home</span>
              </button>
            </li>
            <li>
              <button
                className={`left-navbar-item ${activeSection === 'marketplace' ? 'active' : ''}`}
                onClick={navigateToMarketplace}
              >
                <span className="nav-icon">🛒</span>
                <span className="nav-text">Marketplace</span>
              </button>
            </li>
            <li>
              <button
                className={`left-navbar-item ${activeSection === 'cv-builder' ? 'active' : ''}`}
                onClick={navigateToCVBuilder}
              >
                <span className="nav-icon">📄</span>
                <span className="nav-text">CV Builder</span>
              </button>
            </li>
            <li>
              <button
                className={`left-navbar-item ${activeSection === 'id-card-printer' ? 'active' : ''}`}
                onClick={navigateToIDCardPrinter}
              >
                <span className="nav-icon">🪪</span>
                <span className="nav-text">ID Card Printer</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-navbar">
        <button
          className={`bottom-nav-item ${activeSection === 'home' ? 'active' : ''}`}
          onClick={navigateToHomePage}
        >
          <span className="bottom-nav-icon">🏠</span>
          <span className="bottom-nav-text">Home</span>
        </button>
        <button
          className={`bottom-nav-item ${activeSection === 'marketplace' ? 'active' : ''}`}
          onClick={navigateToMarketplace}
        >
          <span className="bottom-nav-icon">🛒</span>
          <span className="bottom-nav-text">Shop</span>
        </button>
        <button
          className={`bottom-nav-item ${activeSection === 'cv-builder' ? 'active' : ''}`}
          onClick={navigateToCVBuilder}
        >
          <span className="bottom-nav-icon">📄</span>
          <span className="bottom-nav-text">CV</span>
        </button>
        <button
          className={`bottom-nav-item ${activeSection === 'id-card-printer' ? 'active' : ''}`}
          onClick={navigateToIDCardPrinter}
        >
          <span className="bottom-nav-icon">🪪</span>
          <span className="bottom-nav-text">ID Card</span>
        </button>
        {!isAuthenticated ? (
          <button
            type="button"
            className="bottom-nav-item signin-btn"
            onClick={(e) => {
              console.log('Sign in button onClick fired', e);
              e.preventDefault();
              e.stopPropagation();
              try {
                handleSignIn();
              } catch (error) {
                console.error('Error in handleSignIn:', error);
                // Fallback: just navigate to homepage
                navigate('/');
              }
            }}
            onTouchStart={(e) => {
              console.log('Sign in button onTouchStart fired');
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              console.log('Sign in button onMouseDown fired');
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              console.log('Sign in button onPointerDown fired');
            }}
            disabled={false}
            aria-label="Sign In"
            style={{ 
              pointerEvents: 'auto',
              cursor: 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            <span className="bottom-nav-icon">🔐</span>
            <span className="bottom-nav-text">Sign In</span>
          </button>
        ) : (
          <button
            type="button"
            className="bottom-nav-item signout-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLogout();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            aria-label="Sign Out"
          >
            <span className="bottom-nav-icon">🚪</span>
            <span className="bottom-nav-text">Sign Out</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default LeftNavbar;
