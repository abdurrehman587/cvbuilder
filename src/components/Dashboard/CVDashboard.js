import React, { useState, useEffect } from 'react';
import './CVDashboard.css';
import SearchCV from './SearchCV';
import { setCurrentApp, setCVView } from '../../utils/routing';
import { authService, cvCreditsService, supabase } from '../Supabase/supabase';

/**
 * Fresh CV Dashboard - Rebuilt from scratch
 * Simple, direct navigation using routing utilities
 * No complex state management
 */
const CVDashboard = ({ onTemplateSelect, onLogout, onEditCV, onCreateNewCV }) => {
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [cvCredits, setCvCredits] = useState(null);
  const [userType, setUserType] = useState(null);

  // Fresh handler for creating new CV
  const handleMakeNewCV = React.useCallback(() => {
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
    setCurrentView('search-cv');
  }, []);

  // Fresh handler for going back to dashboard
  const handleBackToDashboard = React.useCallback(() => {
    setCurrentView('dashboard');
  }, []);

  // Fresh handler for editing CV
  const handleEditCV = React.useCallback((cv) => {
    // Ensure we're on CV Builder section
    setCurrentApp('cv-builder');
    setCVView('cv-builder');
    
    // Call parent handler
    if (onEditCV) {
      onEditCV(cv);
    }
  }, [onEditCV]);

  // Load CV credits for shopkeepers
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          setCvCredits(null);
          setUserType(null);
          return;
        }
        
        // Get user type - first try metadata, then check database via RPC
        let type = user.user_metadata?.user_type || 'regular';
        
        // Always check database via RPC to ensure we have the correct user type
        // This is more reliable than just checking metadata
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_users_with_type');
          
          if (!rpcError && rpcData) {
            const dbUser = rpcData.find(u => u.email === user.email);
            if (dbUser) {
              type = dbUser.user_type || type;
            }
          }
        } catch (dbErr) {
          // Fall back to metadata type
        }
        
        setUserType(type);

        // Load credits for all users (not just shopkeepers)
        const credits = await cvCreditsService.getCredits(user.id);
        setCvCredits(credits);
      } catch (err) {
        console.error('CVDashboard: Error loading CV credits:', err);
        setCvCredits(null);
      }
    };

    loadCredits();
    
    // Refresh credits periodically (every 30 seconds)
    const interval = setInterval(loadCredits, 30000);
    
    // Also listen for credit updates
    const handleCreditUpdate = () => {
      loadCredits();
    };
    window.addEventListener('cvCreditsUpdated', handleCreditUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('cvCreditsUpdated', handleCreditUpdate);
    };
  }, []);

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
          
          {/* CV Credits Display for All Users */}
          {cvCredits !== null && (
            <div 
              className="cv-credits-badge"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '20px 30px',
                marginTop: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: `3px solid ${cvCredits > 0 ? '#28a745' : '#dc3545'}`,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
              }}
              title="CV Download Credits Remaining"
            >
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#333',
                textAlign: 'center'
              }}>
                📥 Remaining CV Download Credits
              </span>
              <span style={{ 
                fontSize: '48px', 
                fontWeight: '800', 
                color: cvCredits > 0 ? '#28a745' : '#dc3545',
                lineHeight: '1',
                textAlign: 'center'
              }}>
                {cvCredits}
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: '#333',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                To get more CV Download Credits Contact Administrator : 0315-3338612
              </span>
            </div>
          )}
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
