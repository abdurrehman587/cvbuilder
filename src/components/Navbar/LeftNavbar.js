import React, { useState, useEffect } from 'react';
import './LeftNavbar.css';
import { authService } from '../Supabase/supabase';

const LeftNavbar = ({ isAuthenticated, onLogout }) => {
  const [activeSection, setActiveSection] = useState('marketplace');

  useEffect(() => {
    // Determine active section based on current route
    const updateActiveSection = () => {
      const hash = window.location.hash;
      
      if (hash === '#products' || hash.startsWith('#product/') || hash === '#cart' || hash === '#checkout' || hash.startsWith('#order-details') || hash === '#admin') {
        setActiveSection('marketplace');
      } else {
        // Check localStorage for selected app
        const selectedApp = localStorage.getItem('selectedApp') || 'cv-builder';
        if (selectedApp === 'id-card-print') {
          setActiveSection('id-card-printer');
        } else if (selectedApp === 'cv-builder') {
          setActiveSection('cv-builder');
        } else {
          setActiveSection('marketplace');
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

  const navigateToMarketplace = () => {
    const currentHash = window.location.hash;
    
    // If already on marketplace page, do nothing
    if (currentHash === '#products' || currentHash.startsWith('#product/') || currentHash === '#cart' || currentHash === '#checkout' || currentHash.startsWith('#order-details') || currentHash === '#admin') {
      return;
    }
    
    // Navigate to marketplace using hash (no page reload)
    localStorage.setItem('selectedApp', 'marketplace');
    localStorage.setItem('showProductsPage', 'true');
    sessionStorage.setItem('showProductsPage', 'true');
    // Use hash change instead of page reload to preserve session
    window.location.hash = '#products';
    // Trigger a custom event to notify App.js
    window.dispatchEvent(new CustomEvent('navigateToMarketplace'));
  };

  const navigateToCVBuilder = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to CV Builder after login
      localStorage.setItem('selectedApp', 'cv-builder');
      localStorage.setItem('navigateToCVBuilder', 'true');
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      // Navigate to products page to show login
      window.location.hash = '#products';
      // Trigger a small delay to ensure hash change is processed
      setTimeout(() => {
        window.dispatchEvent(new Event('hashchange'));
      }, 50);
      return;
    }
    
    // Navigate to CV Builder dashboard using hash-based routing
    // Set navigation flags to prevent logout
    sessionStorage.setItem('isNavigating', 'true');
    sessionStorage.setItem('navigationTimestamp', Date.now().toString());
    sessionStorage.setItem('navigateToCVBuilder', 'true');
    localStorage.setItem('selectedApp', 'cv-builder');
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    // Clear hash to show dashboard
    window.location.hash = '';
    // Trigger a custom event to notify App.js
    window.dispatchEvent(new CustomEvent('navigateToCVBuilder'));
  };

  const navigateToIDCardPrinter = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to ID Card Printer after login
      localStorage.setItem('selectedApp', 'id-card-print');
      localStorage.setItem('idCardView', 'dashboard');
      localStorage.setItem('navigateToIDCardPrint', 'true');
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      // Navigate to products page to show login
      window.location.hash = '#products';
      // Trigger a small delay to ensure hash change is processed
      setTimeout(() => {
        window.dispatchEvent(new Event('hashchange'));
      }, 50);
      return;
    }
    
    // Navigate to ID Card Printer dashboard using hash-based routing
    // Set navigation flags to prevent logout
    sessionStorage.setItem('isNavigating', 'true');
    sessionStorage.setItem('navigationTimestamp', Date.now().toString());
    sessionStorage.setItem('navigateToIDCardPrint', 'true');
    localStorage.setItem('selectedApp', 'id-card-print');
    localStorage.setItem('idCardView', 'dashboard');
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    // Clear hash to show dashboard
    window.location.hash = '';
    // Trigger a custom event to notify App.js
    window.dispatchEvent(new CustomEvent('navigateToIDCardPrinter'));
  };

  const handleSignIn = () => {
    // Navigate to products page and show login form
    localStorage.setItem('showProductsPage', 'true');
    sessionStorage.setItem('showProductsPage', 'true');
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
