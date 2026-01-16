import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './IDCardDashboard.css';
import { setCurrentApp, setIDCardView } from '../../utils/routing';
import { authService, idCardCreditsService, supabase } from '../Supabase/supabase';

/**
 * Fresh ID Card Dashboard - Rebuilt from scratch
 * Simple, direct navigation using routing utilities
 * No complex state management
 */
const IDCardDashboard = ({ onCreateNewIDCard }) => {
  const navigate = useNavigate();
  const [idCardCredits, setIdCardCredits] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [userType, setUserType] = useState(null);

  // Fresh handler for creating new ID card
  const handleCreateNewIDCard = React.useCallback(() => {
    // Set navigation flags FIRST to prevent logout on page reload
    sessionStorage.setItem('isNavigating', 'true');
    sessionStorage.setItem('navigationTimestamp', Date.now().toString());
    sessionStorage.setItem('navigateToIDCardPrint', 'true');
    localStorage.setItem('navigateToIDCardPrint', 'true');
    
    // Use routing utilities to set state - SET THESE FIRST
    localStorage.setItem('selectedApp', 'id-card-print');
    localStorage.setItem('idCardView', 'print');
    
    // Then use routing utilities
    setCurrentApp('id-card-print');
    setIDCardView('print');
    
    // Call parent handler if provided
    if (onCreateNewIDCard) {
      onCreateNewIDCard();
    }
    
    // Small delay to ensure localStorage is written before navigation
    setTimeout(() => {
      navigate('/id-card-print');
    }, 50);
  }, [onCreateNewIDCard, navigate]);

  // Load ID Card credits for all users
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          console.log('IDCardDashboard: No user found');
          setIdCardCredits(null);
          setUserType(null);
          return;
        }

        console.log('IDCardDashboard: User found:', user.email);
        console.log('IDCardDashboard: User metadata:', user.user_metadata);
        
        // Get user type - first try metadata, then check database via RPC
        let type = user.user_metadata?.user_type || 'regular';
        console.log('IDCardDashboard: User type from metadata:', type);
        
        // Always check database via RPC to ensure we have the correct user type
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_users_with_type');
          
          if (!rpcError && rpcData) {
            const dbUser = rpcData.find(u => u.email === user.email);
            if (dbUser) {
              type = dbUser.user_type || type;
              console.log('IDCardDashboard: User type from database:', type);
            }
          }
        } catch (dbErr) {
          console.error('IDCardDashboard: Error checking database for user type:', dbErr);
          // Fall back to metadata type
        }
        
        setUserType(type);
        console.log('IDCardDashboard: Final user type:', type, 'for user:', user.email);

        // Load ID Card credits for all users
        console.log('IDCardDashboard: Loading ID Card credits...');
        const credits = await idCardCreditsService.getCredits(user.id);
        console.log('IDCardDashboard: ID Card credits loaded:', credits);
        setIdCardCredits(credits);
      } catch (err) {
        console.error('IDCardDashboard: Error loading ID Card credits:', err);
        setIdCardCredits(null);
      }
    };

    loadCredits();
    
    // Refresh credits periodically (every 30 seconds)
    const interval = setInterval(loadCredits, 30000);
    
    // Also listen for credit updates
    const handleCreditUpdate = () => {
      console.log('IDCardDashboard: ID Card credit update event received');
      loadCredits();
    };
    window.addEventListener('idCardCreditsUpdated', handleCreditUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('idCardCreditsUpdated', handleCreditUpdate);
    };
  }, []);

  return (
    <div className="id-card-dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>My ID Card Dashboard</h1>
          <p className="welcome-message">Welcome! Let's create your professional ID cards</p>
          <p className="sub-message">Print multiple ID cards on A4 paper with perfect alignment</p>
          
          {/* ID Card Credits Display for All Users */}
          {idCardCredits !== null && (
            <div 
              className="id-card-credits-badge"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '20px 30px',
                marginTop: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: `3px solid ${idCardCredits > 0 ? '#28a745' : '#dc3545'}`,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
              }}
              title="ID Card Printing Credits Remaining"
            >
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#333',
                textAlign: 'center'
              }}>
                🪪 Remaining ID Card Printing Credits
              </span>
              <span style={{ 
                fontSize: '48px', 
                fontWeight: '800', 
                color: idCardCredits > 0 ? '#28a745' : '#dc3545',
                lineHeight: '1',
                textAlign: 'center'
              }}>
                {idCardCredits}
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: '#333',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                To get more ID Card Credits Contact Administrator : 0315-3338612
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="dashboard-options">
        <button
          className="option-card"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCreateNewIDCard();
          }}
          style={{ 
            cursor: 'pointer', 
            position: 'relative', 
            zIndex: 10,
            border: 'none',
            background: 'white',
            width: '100%',
            textAlign: 'center'
          }}
        >
          <div className="option-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <h3>Get Your ID Card Ready for Printing</h3>
          <p>Start creating ID cards with front and back printing support</p>
        </button>
      </div>
    </div>
  );
};

export default IDCardDashboard;
