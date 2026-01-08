import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = ({ onProductSelect }) => {
  const navigate = useNavigate();
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
            localStorage.setItem('selectedApp', 'cv-builder');
            localStorage.setItem('cvView', 'dashboard');
            // Use navigateToSection event like ID Card does
            window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'cv-builder' }));
          } else if (productId === 'id-card-print') {
            // Navigate to ID Card Printer
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('selectedApp', 'id-card-print');
            localStorage.setItem('idCardView', 'dashboard');
            window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'id-card-print' }));
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
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('selectedApp', 'id-card-print');
            localStorage.setItem('showLoginForm', 'true');
            sessionStorage.setItem('showLoginForm', 'true');
            // Use React Router navigation instead of window.location.href
            navigate('/marketplace');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        {/* Homepage Header */}
        <div className="homepage-header">
          <h1 className="homepage-title">Welcome to GLORY</h1>
          <p className="homepage-subtitle">Your trusted partner for professional tools and services</p>
        </div>

        {/* Digital Tools Category */}
        <div className="category-section">
          <h2 className="category-title">Digital Tools</h2>
          <div className="category-items">
            <div 
              className="category-item"
              onClick={() => handleGetStarted('cv-builder')}
            >
              <div className="category-item-icon">📄</div>
              <div className="category-item-content">
                <h3 className="category-item-title">CV Builder</h3>
                <p className="category-item-description">Create professional CVs with multiple templates</p>
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
          <h2 className="category-title">Products</h2>
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
    </div>
  );
};

export default HomePage;

