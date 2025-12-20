import React from 'react';
import './TopNav.css';

const TopNav = ({ currentSection, onSectionChange, isAuthenticated }) => {
  const sections = [
    { id: 'cv-builder', label: 'CV Builder', icon: '📄' },
    { id: 'id-card-print', label: 'ID Card', icon: '🪪' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒' }
  ];

  const handleLogoClick = () => {
    // Navigate to marketplace (home) when clicking logo
    onSectionChange('marketplace');
  };

  return (
    <nav className="top-nav">
      <div className="top-nav-container">
        <div className="top-nav-logo" onClick={handleLogoClick}>
          <span className="logo-icon">✨</span>
        </div>
        
        <div className="top-nav-sections">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`top-nav-item ${currentSection === section.id ? 'active' : ''}`}
              onClick={() => onSectionChange(section.id)}
              aria-label={section.label}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-label">{section.label}</span>
            </button>
          ))}
        </div>
        
        <div className="top-nav-spacer"></div>
      </div>
    </nav>
  );
};

export default TopNav;

