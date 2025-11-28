import React, { useState } from 'react';
import './CVDashboard.css';
import SearchCV from './SearchCV';

const CVDashboard = ({ onTemplateSelect, onLogout, onEditCV, onCreateNewCV }) => {
  const [currentView, setCurrentView] = useState('dashboard');

  const handleMakeNewCV = () => {
    if (onCreateNewCV) {
      onCreateNewCV(); // Call the proper function that resets form data
    } else {
      onTemplateSelect('template1'); // Fallback to template selection
    }
  };

  const handleSearchCV = () => {
    setCurrentView('search-cv');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleEditCV = (cv) => {
    console.log('CV Dashboard - CV selected for editing:', cv);
    if (onEditCV) {
      onEditCV(cv);
    }
  };



  if (currentView === 'search-cv') {
    return (
      <SearchCV 
        onBack={handleBackToDashboard}
        onEditCV={handleEditCV}
      />
    );
  }

  return (
    <div className="cv-dashboard-container">
      <div className="cv-dashboard-header">
        <div className="header-content">
          <h1>My CV Dashboard</h1>
          <p className="welcome-message">Welcome! Let's create your professional CV</p>
          <p className="sub-message">Your CVs are automatically saved and secure</p>
        </div>
      </div>
      
      <div className="cv-dashboard-options">
        <div className="option-card" onClick={handleMakeNewCV}>
          <div className="option-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <h3>Create New CV</h3>
          <p>Start building your professional CV with our easy-to-use templates</p>
        </div>

        <div className="option-card" onClick={handleSearchCV}>
          <div className="option-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <h3>My Saved CVs</h3>
          <p>Find and edit your previously created CVs</p>
        </div>
      </div>
    </div>
  );
};

export default CVDashboard;















