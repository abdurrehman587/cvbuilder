import React, { useState, useEffect } from 'react';
import './LeftNavbar.css';

const LeftNavbar = ({ isAuthenticated }) => {
  const [activeSection, setActiveSection] = useState('marketplace');

  useEffect(() => {
    // Determine active section based on current route
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
  }, []);

  const navigateToMarketplace = () => {
    const currentHash = window.location.hash;
    
    // If already on marketplace page, do nothing
    if (currentHash === '#products' || currentHash.startsWith('#product/') || currentHash === '#cart' || currentHash === '#checkout' || currentHash.startsWith('#order-details') || currentHash === '#admin') {
      return;
    }
    
    // Navigate to marketplace
    localStorage.setItem('selectedApp', 'marketplace');
    window.location.hash = '#products';
  };

  const navigateToCVBuilder = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to CV Builder after login
      localStorage.setItem('selectedApp', 'cv-builder');
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      sessionStorage.setItem('isNavigating', 'true');
      window.location.href = '/';
      return;
    }
    
    // Navigate to CV Builder dashboard
    // Set navigation flags FIRST to prevent logout on page reload
    sessionStorage.setItem('isNavigating', 'true');
    sessionStorage.setItem('isReloading', 'true');
    sessionStorage.setItem('navigateToCVBuilder', 'true');
    localStorage.setItem('selectedApp', 'cv-builder');
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    window.location.hash = '';
    window.location.href = '/';
  };

  const navigateToIDCardPrinter = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store intent to navigate to ID Card Printer after login
      localStorage.setItem('selectedApp', 'id-card-print');
      localStorage.setItem('idCardView', 'dashboard');
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      sessionStorage.setItem('isNavigating', 'true');
      window.location.href = '/';
      return;
    }
    
    // Navigate to ID Card Printer dashboard
    // Set navigation flags FIRST to prevent logout on page reload
    sessionStorage.setItem('isNavigating', 'true');
    sessionStorage.setItem('isReloading', 'true');
    sessionStorage.setItem('navigateToIDCardPrint', 'true');
    localStorage.setItem('selectedApp', 'id-card-print');
    localStorage.setItem('idCardView', 'dashboard');
    localStorage.removeItem('showProductsPage');
    sessionStorage.removeItem('showProductsPage');
    window.location.hash = '';
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
