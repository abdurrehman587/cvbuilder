import React from 'react';
import './HomePage.css';

const HomePage = ({ onProductSelect }) => {
  const handleGetStarted = (productId) => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const isAuthInStorage = localStorage.getItem('cvBuilderAuth');
        if (isAuthInStorage) {
          // User is authenticated - navigate directly
          if (productId === 'marketplace') {
            // Navigate to marketplace
            localStorage.setItem('selectedApp', 'marketplace');
            sessionStorage.setItem('showProductsPage', 'true');
            // Dispatch event to set explicitlyClickedMarketplaceRef in App.js
            window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'marketplace' }));
            window.location.href = '/#products';
          } else if (productId === 'cv-builder') {
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
          if (productId === 'marketplace') {
            // For marketplace, navigate to products page
            localStorage.setItem('selectedApp', 'marketplace');
            localStorage.setItem('showProductsPage', 'true');
            sessionStorage.setItem('showProductsPage', 'true');
            // Dispatch event to set explicitlyClickedMarketplaceRef in App.js
            window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'marketplace' }));
            window.location.href = '/#products';
          } else if (productId === 'cv-builder') {
            sessionStorage.setItem('navigateToCVBuilder', 'true');
            localStorage.setItem('selectedApp', 'cv-builder');
            localStorage.setItem('showProductsPage', 'true');
            sessionStorage.setItem('showProductsPage', 'true');
            window.location.href = '/#products';
          } else if (productId === 'id-card-print') {
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('selectedApp', 'id-card-print');
            localStorage.setItem('showProductsPage', 'true');
            sessionStorage.setItem('showProductsPage', 'true');
            window.location.href = '/#products';
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

