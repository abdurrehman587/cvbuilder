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
    if (showProductsOnHeader && window.handleProductSelect) {
      // If on products page, use window handler to update state
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
    if (isAuthenticated) {
      handleLogout();
    } else {
      window.location.href = '/';
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

