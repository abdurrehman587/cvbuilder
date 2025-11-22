import React, { useState, useEffect } from 'react';
import './Header.css';
import { authService, supabase } from '../Supabase/supabase';

const Header = ({ isAuthenticated, onLogout, currentProduct, onProductSelect, showProductsOnHeader = false }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnAdminPage, setIsOnAdminPage] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated) {
        setIsAdmin(false);
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('email', user.email)
          .single();

        if (error) throw error;
        setIsAdmin(data?.is_admin || false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated]);

  // Check if we're on the admin panel page
  useEffect(() => {
    const checkAdminPage = () => {
      setIsOnAdminPage(window.location.hash === '#admin');
    };

    // Check on mount
    checkAdminPage();

    // Listen for hash changes
    window.addEventListener('hashchange', checkAdminPage);

    return () => {
      window.removeEventListener('hashchange', checkAdminPage);
    };
  }, []);
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
    setTimeout(() => {
    const element = document.getElementById(sectionId);
    if (element) {
        // Find the scrollable products-page container
        const productsPage = document.querySelector('.products-page');
        if (productsPage) {
          // Get the header height for offset calculation
          const header = document.querySelector('.app-header');
          const headerOffset = 20; // Extra spacing from top of container
          
          // Get current scroll position of the container
          const currentScrollTop = productsPage.scrollTop;
          
          // Get bounding rectangles
          const containerRect = productsPage.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          
          // Calculate element's position relative to the container's scrollable content
          // elementRect.top is relative to viewport
          // containerRect.top is container's top relative to viewport
          // We need: element position in container's content = current scroll + (element top - container top)
          const elementTopInContainer = currentScrollTop + (elementRect.top - containerRect.top);
          
          // Calculate final scroll position with header offset
          const offsetPosition = elementTopInContainer - headerOffset;
          
          // Scroll the products-page container
          productsPage.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        } else {
          // Fallback: if products-page not found, try window scroll (for compatibility)
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + (window.pageYOffset || window.scrollY || 0) - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
      } else {
        console.warn(`Section with id "${sectionId}" not found. Please ensure you are on the products page.`);
      }
    }, 100);
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
            <>
              {isAdmin && !isOnAdminPage && (
                <button 
                  onClick={() => {
                    // Clear any products page flags
                    localStorage.removeItem('showProductsPage');
                    sessionStorage.removeItem('showProductsPage');
                    // Clear any other navigation flags
                    localStorage.removeItem('selectedApp');
                    sessionStorage.removeItem('navigateToCVBuilder');
                    sessionStorage.removeItem('navigateToIDCardPrint');
                    // Navigate to admin panel
                    window.location.href = '/#admin';
                  }}
                  className="admin-btn-header"
                >
                  Admin Panel
                </button>
              )}
              <button onClick={handleLogout} className="logout-btn-header">
                Logout
              </button>
            </>
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

