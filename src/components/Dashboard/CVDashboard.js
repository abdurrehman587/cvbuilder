import React from 'react';
import './CVDashboard.css';
import SearchCV from './SearchCV';
import { setCurrentApp, setCVView } from '../../utils/routing';

/**
 * Fresh CV Dashboard - Rebuilt from scratch
 * Simple, direct navigation using routing utilities
 * No complex state management
 */
const CVDashboard = ({ onTemplateSelect, onLogout, onEditCV, onCreateNewCV }) => {
  const [currentView, setCurrentView] = React.useState('dashboard');

  // Fresh handler for creating new CV
  const handleMakeNewCV = React.useCallback(() => {
    console.log('CVDashboard: Create New CV clicked');
    
    // Use routing utilities to set state
    setCurrentApp('cv-builder');
    setCVView('cv-builder');
    
    // Call parent handler if provided
    if (onCreateNewCV) {
      onCreateNewCV();
    } else if (onTemplateSelect) {
      // Fallback: select template 1
      onTemplateSelect('template1');
    }
  }, [onCreateNewCV, onTemplateSelect]);

  // Fresh handler for searching CVs
  const handleSearchCV = React.useCallback(() => {
    console.log('CVDashboard: Search CV clicked');
    setCurrentView('search-cv');
  }, []);

  // Fresh handler for going back to dashboard
  const handleBackToDashboard = React.useCallback(() => {
    console.log('CVDashboard: Back to dashboard');
    setCurrentView('dashboard');
  }, []);

  // Fresh handler for editing CV
  const handleEditCV = React.useCallback((cv) => {
    console.log('CVDashboard: Edit CV clicked', cv);
    
    // Ensure we're on CV Builder section
    setCurrentApp('cv-builder');
    setCVView('cv-builder');
    
    // Call parent handler
    if (onEditCV) {
      onEditCV(cv);
    }
  }, [onEditCV]);

  // Show search view if active
  if (currentView === 'search-cv') {
    return (
      <SearchCV 
        onBack={handleBackToDashboard}
        onEditCV={handleEditCV}
      />
    );
  }

  // Main dashboard view
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
        <div 
          className="option-card" 
          onClick={handleMakeNewCV}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMakeNewCV();
            }
          }}
        >
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

        <div 
          className="option-card" 
          onClick={handleSearchCV}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSearchCV();
            }
          }}
        >
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
