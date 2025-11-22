import React from 'react';
import './Header.css';
import { authService } from '../Supabase/supabase';

const Header = ({ isAuthenticated, onLogout, currentProduct, onProductSelect, showProductsOnHeader = false }) => {
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

  const goToProducts = () => {
    // Navigate to products page without logging out
    // Always preserve authentication state first
    const wasAuthenticated = isAuthenticated || localStorage.getItem('cvBuilderAuth') === 'true';
    
    if (wasAuthenticated) {
      // Preserve authentication state
      localStorage.setItem('cvBuilderAuth', 'true');
    }
    
    // Set flag to show products page - this takes ABSOLUTE priority over other routing
    // Use multiple storage methods for redundancy
    localStorage.setItem('showProductsPage', 'true');
    localStorage.setItem('showProductsPageTimestamp', Date.now().toString());
    sessionStorage.setItem('showProductsPage', 'true');
    
    // Always navigate - if already on products page, reload to ensure state is refreshed
    if (window.location.pathname === '/' && window.location.hash === '#products') {
      // Already on products page - reload to ensure routing works
      window.location.reload();
    } else {
      // Navigate to products page with hash
      // This will trigger a page load, and App.js will read the flags on mount
      window.location.href = '/#products';
    }
  };

  const handleSignIn = () => {
    // If on products page and login form function is available, show login form popup
    if (showProductsOnHeader && window.showLoginForm) {
      window.showLoginForm();
    } else {
      // If not on products page, navigate to products page with login form
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      window.location.href = '/#products';
    }
  };

  const navigateToCVBuilder = () => {
    if (!isAuthenticated) {
      // User is not signed in: Show login form
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      localStorage.setItem('selectedApp', 'cv-builder');
      if (showProductsOnHeader && window.showLoginForm) {
        window.showLoginForm();
      } else {
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        window.location.href = '/#products';
      }
    } else {
      // User is signed in: Navigate directly to CV Builder dashboard
      sessionStorage.setItem('isReloading', 'true');
      localStorage.setItem('selectedApp', 'cv-builder');
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      if (window.resetProductsPageFlag) {
        window.resetProductsPageFlag();
      }
      window.location.href = '/';
    }
  };

  const navigateToIDCardDashboard = () => {
    if (!isAuthenticated) {
      // User is not signed in: Show login form
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      localStorage.setItem('selectedApp', 'id-card-print');
      if (showProductsOnHeader && window.showLoginForm) {
        window.showLoginForm();
      } else {
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        window.location.href = '/#products';
      }
    } else {
      // User is signed in: Navigate directly to ID Card Dashboard
      sessionStorage.setItem('isReloading', 'true');
      localStorage.setItem('selectedApp', 'id-card-print');
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      // Reset idCardView to dashboard
      if (window.setIdCardView) {
        window.setIdCardView('dashboard');
      }
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      if (window.resetProductsPageFlag) {
        window.resetProductsPageFlag();
      }
      window.location.href = '/';
    }
  };

  // Handle navigation to sections on products page
  const scrollToSection = (sectionId) => {
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
  };


  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <img 
            src="/images/glory-logo.png" 
            alt="Glory Logo" 
            className="glory-logo"
            onClick={goToProducts}
            onError={(e) => {
              // Fallback if logo doesn't exist - hide it
              e.target.style.display = 'none';
            }}
          />
          <div className="logo" onClick={goToProducts} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">🚀</span>
            <span className="logo-text">My Products</span>
          </div>
        </div>

        <div className="header-center">
          {isAuthenticated && !showProductsOnHeader && (
            <nav className="header-navigation">
              <button
                onClick={navigateToCVBuilder}
                className={`nav-button ${currentProduct === 'cv-builder' ? 'active' : ''}`}
              >
                CV Builder
              </button>
              <button
                onClick={navigateToIDCardDashboard}
                className={`nav-button ${currentProduct === 'id-card-print' ? 'active' : ''}`}
              >
                ID Card Print
              </button>
            </nav>
          )}
          {showProductsOnHeader && (
            <nav className="header-navigation header-products-navigation">
              <button
                onClick={() => scrollToSection('marketplace-section')}
                className="header-products-nav-button"
              >
                <span className="nav-icon">🛒</span>
                <span className="nav-text">Market Place</span>
              </button>
              <button
                onClick={() => scrollToSection('cv-builder-section')}
                className="header-products-nav-button"
              >
                <span className="nav-icon">📄</span>
                <span className="nav-text">CV Builder</span>
              </button>
              <button
                onClick={() => scrollToSection('id-card-print-section')}
                className="header-products-nav-button"
              >
                <span className="nav-icon">🪪</span>
                <span className="nav-text">ID Card Printer</span>
              </button>
            </nav>
          )}
        </div>

        <div className="header-right">
          {isAuthenticated ? (
            <button onClick={handleLogout} className="logout-btn-header">
              Logout
            </button>
          ) : (
            <button onClick={handleSignIn} className="signin-btn-header">
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

