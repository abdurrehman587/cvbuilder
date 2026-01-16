import React, { useState, useEffect } from 'react';
import './CVDashboard.css';
import SearchCV from './SearchCV';
import { setCurrentApp, setCVView } from '../../utils/routing';
import { authService, cvCreditsService, supabase } from '../Supabase/supabase';
import { Share } from '@capacitor/share';

// Share App Component for getting free credit
const ShareAppSection = ({ onShareSuccess }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setShareMessage('');

      // Get current user
      const user = await authService.getCurrentUser();
      if (!user) {
        setShareMessage('Please login to share and earn credits.');
        setIsSharing(false);
        return;
      }

      // Generate unique referral link for this user
      // Encode user ID as base64 and make it URL-safe
      const referralCode = btoa(user.id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const shareUrl = `${window.location.origin}?ref=${referralCode}`;
      const shareText = 'Sign in the app and get free credits.';
      const shareTitle = 'Get Glory - CV Builder';

      // Try Capacitor Share first (for mobile apps)
      try {
        if (window.Capacitor && Share) {
          const shareResult = await Share.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
            dialogTitle: 'Share Get Glory App'
          });
          
          // Share dialog opened - show message that credit will be given when link is visited
          if (shareResult && shareResult.activityType && shareResult.activityType !== 'cancel') {
            setShareMessage('✅ Link shared! You will earn 1 credit when someone visits your link.');
          } else if (shareResult && !shareResult.activityType) {
            setShareMessage('✅ Link shared! You will earn 1 credit when someone visits your link.');
          } else {
            setShareMessage('Share was cancelled. Please share to earn credit.');
          }
          setIsSharing(false);
          return;
        }
      } catch (capError) {
        // Capacitor Share throws error if user cancels or share fails
        if (capError.message && (capError.message.includes('cancel') || capError.message.includes('dismiss'))) {
          setShareMessage('Share was cancelled. Please share to earn credit.');
        } else {
          console.log('Capacitor Share error:', capError);
          setShareMessage('Share failed. Please try again.');
        }
        setIsSharing(false);
        // Don't continue to fallback - user needs to try again
        return;
      }

      // Fallback to Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          
          // If we reach here, share was successful (not aborted)
          // Credit will be given when someone visits the link
          setShareMessage('✅ Link shared! You will earn 1 credit when someone visits your link.');
        } catch (shareError) {
          // AbortError means user cancelled the share dialog
          if (shareError.name === 'AbortError') {
            setShareMessage('Share was cancelled. Please share to earn credit.');
          } else {
            console.error('Error sharing:', shareError);
            setShareMessage('Failed to share. Please try again.');
          }
        }
      } else {
        // Fallback: Copy to clipboard - require user confirmation
        const fullText = `${shareText}\n${shareUrl}`;
        try {
          await navigator.clipboard.writeText(fullText);
          
          // Link copied - credit will be given when someone visits the link
          setShareMessage('✅ Link copied! Share it and you will earn 1 credit when someone visits your link.');
        } catch (clipError) {
          setShareMessage('Unable to copy. Please share manually.');
        }
      }
    } catch (err) {
      console.error('Error in share process:', err);
      setShareMessage('An error occurred. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div style={{
      marginTop: '16px',
      padding: '16px',
      backgroundColor: '#f0f9ff',
      borderRadius: '12px',
      border: '2px solid #3b82f6',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <p style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#1e40af',
        margin: '0 0 12px 0',
        textAlign: 'center',
        width: '100%'
      }}>
        📤 Share App & Earn Credits
      </p>
      <p style={{
        fontSize: '14px',
        color: '#475569',
        margin: '0 0 16px 0',
        textAlign: 'center',
        width: '100%'
      }}>
        Share the app and get 1 credit for each successful share
      </p>
      <button
        onClick={handleShare}
        disabled={isSharing}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          backgroundColor: isSharing ? '#94a3b8' : '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          cursor: isSharing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          display: 'block',
          margin: '0 auto'
        }}
        onMouseEnter={(e) => {
          if (!isSharing) {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSharing) {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }
        }}
      >
        {isSharing ? 'Sharing...' : '📤 Share App & Get Free Credit'}
      </button>
      {shareMessage && (
        <p style={{
          fontSize: '14px',
          color: shareMessage.includes('✅') ? '#059669' : shareMessage.includes('already') ? '#f59e0b' : '#dc2626',
          margin: '12px 0 0 0',
          fontWeight: '500',
          textAlign: 'center',
          width: '100%'
        }}>
          {shareMessage}
        </p>
      )}
    </div>
  );
};

/**
 * Fresh CV Dashboard - Rebuilt from scratch
 * Simple, direct navigation using routing utilities
 * No complex state management
 */
const CVDashboard = ({ onTemplateSelect, onLogout, onEditCV, onCreateNewCV }) => {
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [cvCredits, setCvCredits] = useState(null);
  // eslint-disable-next-line no-unused-vars
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
              {cvCredits > 0 && (
                <span style={{ 
                  fontSize: '14px', 
                  color: '#333',
                  textAlign: 'center',
                  marginTop: '8px'
                }}>
                  To get more CV Download Credits Contact Administrator : 0315-3338612
                </span>
              )}
            </div>
          )}

          {/* Share App Section - Always Visible */}
          {cvCredits !== null && (
            <ShareAppSection 
              onShareSuccess={async () => {
                // Reload credits after successful share
                try {
                  const user = await authService.getCurrentUser();
                  if (user) {
                    const credits = await cvCreditsService.getCredits(user.id);
                    setCvCredits(credits);
                  }
                } catch (err) {
                  console.error('Error reloading credits:', err);
                }
              }}
            />
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
