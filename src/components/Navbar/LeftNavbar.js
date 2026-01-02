import React, { useState, useEffect } from 'react';
import './LeftNavbar.css';
import { authService } from '../Supabase/supabase';

const LeftNavbar = ({ isAuthenticated, onLogout }) => {
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
      
      if (hash === '#products' || hash.startsWith('#product/') || hash === '#cart' || hash === '#checkout' || hash.startsWith('#order-details') || hash === '#admin') {
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
    
    // Navigate to homepage without reload - use hash and custom event
    window.location.hash = '';
    window.history.replaceState(null, '', '/');
    // Trigger navigation event for App.js to handle
    window.dispatchEvent(new CustomEvent('navigateToHomePage'));
  };

  const navigateToMarketplace = () => {
    // Facebook-style: Instant navigation using localStorage
    localStorage.setItem('selectedApp', 'marketplace');
    localStorage.setItem('showProductsPage', 'true');
    sessionStorage.setItem('showProductsPage', 'true');
    // Trigger navigation event for App.js to handle
    window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'marketplace' }));
  };

  const navigateToCVBuilder = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to CV Builder after login
      localStorage.setItem('selectedApp', 'cv-builder');
      localStorage.setItem('navigateToCVBuilder', 'true');
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      // Navigate to marketplace to show login
      navigateToMarketplace();
      return;
    }
    
    // Facebook-style: Instant navigation
    localStorage.setItem('selectedApp', 'cv-builder');
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    // Trigger navigation event for App.js to handle
    window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'cv-builder' }));
  };

  const navigateToIDCardPrinter = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to ID Card Printer after login
      localStorage.setItem('selectedApp', 'id-card-print');
      localStorage.setItem('idCardView', 'dashboard');
      localStorage.setItem('navigateToIDCardPrint', 'true');
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      // Navigate to marketplace to show login
      navigateToMarketplace();
      return;
    }
    
    // Facebook-style: Instant navigation
    localStorage.setItem('selectedApp', 'id-card-print');
    localStorage.setItem('idCardView', 'dashboard');
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    // Trigger navigation event for App.js to handle
    window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'id-card-print' }));
  };

  const handleSignIn = () => {
    // Navigate to products page (Marketplace) and show login form
    localStorage.setItem('showProductsPage', 'true');
    sessionStorage.setItem('showProductsPage', 'true');
    localStorage.setItem('selectedApp', 'marketplace');
    // Clear any navigation flags that might interfere
    sessionStorage.removeItem('navigateToCVBuilder');
    sessionStorage.removeItem('navigateToIDCardPrint');
    localStorage.removeItem('navigateToCVBuilder');
    localStorage.removeItem('navigateToIDCardPrint');
    
    // Navigate to products page
    window.location.href = '/#products';
    
    // Show login form after navigation
    setTimeout(() => {
      if (window.showLoginForm) {
        window.showLoginForm();
      }
    }, 100);
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
            className="bottom-nav-item signin-btn"
            onClick={handleSignIn}
          >
            <span className="bottom-nav-icon">🔐</span>
            <span className="bottom-nav-text">Sign In</span>
          </button>
        ) : (
          <button
            className="bottom-nav-item signout-btn"
            onClick={handleLogout}
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
