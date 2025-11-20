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

  const switchProduct = (productId) => {
    localStorage.setItem('selectedApp', productId);
    
    if (showProductsOnHeader && !isAuthenticated) {
      // If on products page and not authenticated, show login form popup
      if (window.showLoginForm) {
        window.showLoginForm();
      }
    } else if (showProductsOnHeader && isAuthenticated) {
      // If on products page and authenticated, navigate to the product
      // Clear the products page flag to allow navigation
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      
      // Reset the force show products page flag via window function if available
      if (window.resetProductsPageFlag) {
        window.resetProductsPageFlag();
      }
      
      // Navigate to the selected product
      if (productId === 'cv-builder') {
        // Set currentView to dashboard for CV Builder
        // Store in sessionStorage so App.js can read it on reload
        sessionStorage.setItem('navigateToCVBuilder', 'true');
        // Navigate to CV Builder dashboard
        window.location.href = '/';
        // The App.js will route to CV Builder dashboard based on selectedApp
      } else if (productId === 'id-card-print') {
        // Navigate to ID Card Print
        window.location.href = '/';
        // The App.js will route to ID Card Print based on selectedApp
      }
    } else if (showProductsOnHeader && window.handleProductSelect) {
      // Fallback: If on products page and window handler exists, use it
      window.handleProductSelect(productId);
      
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
    } else if (onProductSelect) {
      // If callback provided, use it
      onProductSelect(productId);
    } else {
      // If authenticated, reload to switch products
      window.location.reload();
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

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo" onClick={goToProducts} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">🚀</span>
            <span className="logo-text">My Products</span>
          </div>
        </div>

        <div className="header-center">
          {(isAuthenticated || showProductsOnHeader) && (
            <div className="product-switcher-header">
              <button
                onClick={() => switchProduct('cv-builder')}
                className={`product-switch-btn ${currentProduct === 'cv-builder' ? 'active' : ''}`}
              >
                CV Builder
              </button>
              <button
                onClick={() => switchProduct('id-card-print')}
                className={`product-switch-btn ${currentProduct === 'id-card-print' ? 'active' : ''}`}
              >
                ID Card Print
              </button>
            </div>
          )}
        </div>

        <div className="header-right">
          {isAuthenticated ? (
            <button onClick={handleLogout} className="logout-btn-header">
              Logout
            </button>
          ) : (
            <div className="header-auth-status">
              <span>Not signed in</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

