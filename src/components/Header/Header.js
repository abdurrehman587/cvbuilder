import React from 'react';
import './Header.css';
import { authService } from '../Supabase/supabase';

const Header = ({ isAuthenticated, onLogout, currentProduct }) => {
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
    window.location.reload();
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
          {isAuthenticated && (
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

