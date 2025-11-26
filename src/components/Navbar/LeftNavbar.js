import React, { useState, useEffect } from 'react';
import './LeftNavbar.css';

const LeftNavbar = ({ isAuthenticated }) => {
  const [activeSection, setActiveSection] = useState('marketplace');

  useEffect(() => {
    // Determine active section based on current route
    const hash = window.location.hash;
    const path = window.location.pathname;
    
    if (hash === '#products' || hash.startsWith('#product/') || hash === '#cart' || hash === '#checkout' || hash.startsWith('#order-details')) {
      setActiveSection('marketplace');
    } else if (hash === '#admin') {
      // Admin is part of marketplace
      setActiveSection('marketplace');
    } else {
      // Check localStorage/sessionStorage for selected app
      const selectedApp = localStorage.getItem('selectedApp') || 'cv-builder';
      if (selectedApp === 'id-card-print') {
        setActiveSection('id-card-printer');
      } else {
        setActiveSection('cv-builder');
      }
    }
  }, []);

  const navigateToMarketplace = () => {
    // Clear any navigation flags
    sessionStorage.removeItem('navigateToCVBuilder');
    sessionStorage.removeItem('navigateToIDCardPrint');
    localStorage.removeItem('navigateToCVBuilder');
    localStorage.removeItem('navigateToIDCardPrint');
    
    // Set products page flags
    localStorage.setItem('showProductsPage', 'true');
    sessionStorage.setItem('showProductsPage', 'true');
    localStorage.setItem('selectedApp', 'marketplace');
    
    // Navigate to products page
    window.location.href = '/#products';
  };

  const navigateToCVBuilder = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to CV Builder after login
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      localStorage.setItem('navigateToCVBuilder', 'true');
      localStorage.setItem('selectedApp', 'cv-builder');
      
      // Clear products page flags
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      
      // Navigate to login or root
      window.location.href = '/';
      return;
    }
    
    // Clear products page flags
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    
    // Set CV Builder navigation flags
    sessionStorage.setItem('navigateToCVBuilder', 'true');
    localStorage.setItem('navigateToCVBuilder', 'true');
    localStorage.setItem('selectedApp', 'cv-builder');
    
    // Clear ID Card Print flags
    sessionStorage.removeItem('navigateToIDCardPrint');
    localStorage.removeItem('navigateToIDCardPrint');
    
    // Navigate to CV Builder dashboard
    window.location.href = '/';
  };

  const navigateToIDCardPrinter = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to ID Card Printer after login
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      localStorage.setItem('navigateToIDCardPrint', 'true');
      localStorage.setItem('selectedApp', 'id-card-print');
      
      // Clear products page flags
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      
      // Clear CV Builder flags
      sessionStorage.removeItem('navigateToCVBuilder');
      localStorage.removeItem('navigateToCVBuilder');
      
      // Navigate to login or root
      window.location.href = '/';
      return;
    }
    
    // Clear products page flags first
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    
    // Clear CV Builder flags
    sessionStorage.removeItem('navigateToCVBuilder');
    localStorage.removeItem('navigateToCVBuilder');
    
    // Set ID Card Print navigation flags - MUST be set before navigation
    sessionStorage.setItem('navigateToIDCardPrint', 'true');
    localStorage.setItem('navigateToIDCardPrint', 'true');
    localStorage.setItem('selectedApp', 'id-card-print');
    
    // Set idCardView to dashboard to show the dashboard
    // Store in localStorage as well to persist through page reload
    localStorage.setItem('idCardView', 'dashboard');
    if (window.setIdCardView) {
      window.setIdCardView('dashboard');
    }
    
    // Verify flags are set before navigation
    console.log('Navbar: Setting ID Card Print flags', {
      navigateToIDCardPrint: sessionStorage.getItem('navigateToIDCardPrint'),
      selectedApp: localStorage.getItem('selectedApp'),
      idCardView: localStorage.getItem('idCardView')
    });
    
    // Navigate to ID Card Printer dashboard
    window.location.href = '/';
  };

  return (
    <nav className="left-navbar">
      <div className="left-navbar-content">
        <ul className="left-navbar-menu">
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
  );
};

export default LeftNavbar;

