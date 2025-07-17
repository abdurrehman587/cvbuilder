import React, { useEffect, useState } from 'react';
import supabase from './supabase';
import SignupSignIn from './SignupSignIn';
import ChooseTemplate from './choosetemplate';
import DatabaseSetupCheck from './DatabaseSetupCheck';
import PrintCV from './PrintCV';
import APITest from './APITest';
import RealTimePaymentNotifier from './RealTimePaymentNotifier';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './responsive.css';
import { initializeJWTFix } from './JWTTokenFix';

// Simplified error boundary to prevent flickering
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      // Only handle critical errors, ignore JWT token errors
      if (error?.message && error.message.includes('InvalidJWTToken')) {
        console.log('Ignoring JWT token error to prevent flickering');
        return;
      }
      
      console.error('App Error:', error);
      setError(error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f6fa',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Something went wrong</h2>
          <p>Error: {error?.message || 'Unknown error'}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Clear Data & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('App component mounted');
    console.log('Environment check:', {
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL || 'using fallback',
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production'
    });

    // Gentle JWT error handler (doesn't cause flickering)
    const handleJWTError = (event) => {
      if (event.error && event.error.message && event.error.message.includes('InvalidJWTToken')) {
        console.log('JWT Token error detected, but not clearing data to prevent flickering');
        // Just log the error, don't clear data or reload
        return;
      }
    };

    window.addEventListener('error', handleJWTError);

    // Handle OAuth callback
    const handleAuthCallback = async () => {
      try {
        console.log('Handling auth callback');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const userWithType = {
            ...session.user,
            userType: 'user',
            isAdmin: false
          };
          setUser(userWithType);
          // Store user object in localStorage for payment utilities
          localStorage.setItem('user', JSON.stringify(userWithType));
          // Clear any admin access flags for regular users
          localStorage.removeItem('admin_cv_access');
          localStorage.removeItem('admin_user');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error in handleAuthCallback:', err);
        setError(err);
        setLoading(false);
      }
    };

    // Check for session on mount
    const checkSession = async () => {
      try {
        console.log('Checking session');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userWithType = {
            ...session.user,
            userType: 'user',
            isAdmin: false
          };
          setUser(userWithType);
          // Store user object in localStorage for payment utilities
          localStorage.setItem('user', JSON.stringify(userWithType));
          // Clear any admin access flags for regular users
          localStorage.removeItem('admin_cv_access');
          localStorage.removeItem('admin_user');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error in checkSession:', err);
        setError(err);
        setLoading(false);
      }
    };

    // Check if we're on an auth callback page
    if (window.location.pathname === '/auth/callback') {
      handleAuthCallback();
    } else {
      checkSession();
    }

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        console.log('Auth state change:', _event, session?.user?.email);
        
        // Prevent rapid re-renders by checking if user state actually changed
        const currentUserEmail = user?.email;
        const newUserEmail = session?.user?.email;
        
        if (currentUserEmail === newUserEmail && user && session?.user) {
          console.log('Auth state change - User unchanged, skipping update');
          return;
        }
        
        if (session?.user) {
          const userWithType = {
            ...session.user,
            userType: 'user',
            isAdmin: false
          };
          setUser(userWithType);
          // Store user object in localStorage for payment utilities
          localStorage.setItem('user', JSON.stringify(userWithType));
          // Clear any admin access flags for regular users
          localStorage.removeItem('admin_cv_access');
          localStorage.removeItem('admin_user');
          console.log('Auth state change - User signed in, stored user object:', userWithType.email);
        } else {
          setUser(null);
          // Don't remove user from localStorage here - preserve it for payment status
          console.log('Auth state change - User signed out, preserving user object in localStorage');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err);
        setLoading(false);
      }
    });

    // Handle automatic sign-out only when browser is actually closing (not tab switching)
    const handleBeforeUnload = () => {
      // Only clear non-admin related data, preserve admin access and payment records
      const adminAccess = localStorage.getItem('admin_cv_access');
      const user = localStorage.getItem('user');
      const isAdmin = adminAccess === 'true' || (user && JSON.parse(user)?.isAdmin);
      
      if (!isAdmin) {
        // Clear user-specific localStorage data but preserve payment records and user object
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !key.startsWith('payment_') && key !== 'user') {
            keysToRemove.push(key);
          }
        }
        
        // Remove only user-specific data, preserve payment records and user object
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Sign out from Supabase but don't clear user object
        supabase.auth.signOut();
        console.log('BeforeUnload - Preserved user object and payment records');
      }
      // Admin users keep their session intact
    };

    // Add event listeners - only for actual browser close, not tab switching
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      listener?.subscription?.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('error', handleJWTError);
    };
  }, []);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f6fa',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Connection Error</h2>
          <p>Error: {error.message || 'Failed to connect to services'}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f6fa'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Check if this is a print route
  if (window.location.pathname === '/print-cv') {
    // Try to get data from URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    const sectionsParam = urlParams.get('sections');
    let formDataStr = dataParam;
    let visibleSectionsStr = sectionsParam;
    if (!formDataStr) {
      // Fallback to localStorage
      formDataStr = localStorage.getItem('print_cv_data');
      visibleSectionsStr = localStorage.getItem('print_cv_sections');
    }
    
    console.log('Print route accessed');
    console.log('formDataStr exists:', !!formDataStr);
    console.log('visibleSectionsStr exists:', !!visibleSectionsStr);
    
    if (formDataStr) {
      try {
        const formData = JSON.parse(formDataStr);
        const visibleSections = visibleSectionsStr ? JSON.parse(visibleSectionsStr) : [];
        console.log('Print CV data loaded successfully:', { formData: !!formData, visibleSections });
        return <PrintCV formData={formData} visibleSections={visibleSections} />;
      } catch (error) {
        console.error('Error parsing print CV data:', error);
        return <div>Error loading CV data: {error.message}</div>;
      }
    } else {
      return <div>No CV data found for printing. Please try downloading again.</div>;
    }
  }

  // Check if this is the API test route
  if (window.location.pathname === '/api-test') {
    return <APITest />;
  }

  // Always show SignupSignIn as homepage/root route
  if (!user) {
    return <SignupSignIn onAuth={setUser} />;
  }

  // If user is admin, they should be handled by SignupSignIn component
  if (user.isAdmin) {
    return <SignupSignIn onAuth={setUser} />;
  }

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
      
      {/* Real-time payment notifications */}
      <RealTimePaymentNotifier />
      
      <style>
        {`
          /* Ensure toast notifications are visible */
          .Toastify__toast-container {
            z-index: 9999 !important;
            position: fixed !important;
            top: 1em !important;
            right: 1em !important;
          }
          
          .Toastify__toast {
            z-index: 9999 !important;
            position: relative !important;
            min-height: 64px !important;
            box-sizing: border-box !important;
            margin-bottom: 1rem !important;
            padding: 8px !important;
            border-radius: 4px !important;
            box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.1), 0 2px 15px 0 rgba(0, 0, 0, 0.05) !important;
            display: flex !important;
            justify-content: space-between !important;
            max-height: 800px !important;
            font-family: sans-serif !important;
            cursor: pointer !important;
            direction: ltr !important;
          }
          
          .Toastify__toast--success {
            background: #07bc0c !important;
            color: white !important;
          }
          
          .Toastify__toast--error {
            background: #e74c3c !important;
            color: white !important;
          }
          
          .Toastify__toast--info {
            background: #3498db !important;
            color: white !important;
          }
          
          @media (max-width: 768px) {
            .signout-btn {
              top: 10px !important;
              right: 10px !important;
              padding: 8px 12px !important;
              font-size: 14px !important;
              border-radius: 8px !important;
            }
            
            .signout-btn svg {
              width: 16px !important;
              height: 16px !important;
            }
          }
          
          @media (max-width: 480px) {
            .signout-btn {
              top: 8px !important;
              right: 8px !important;
              padding: 6px 10px !important;
              font-size: 12px !important;
            }
          }
        `}
      </style>
      <DatabaseSetupCheck />
      
      <button
        className="signout-btn"
        style={{ 
          position: 'absolute', 
          top: 20, 
          right: 20, 
          zIndex: 1000,
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: "'Inter', sans-serif"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#dc2626';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ef4444';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
        }}
        onClick={async () => {
          console.log('Sign out button clicked');
          try {
            // Clear download state when signing out
            localStorage.removeItem('cv_downloaded');
            // Clear admin access when signing out
            localStorage.removeItem('admin_cv_access');
            localStorage.removeItem('admin_user');
            console.log('Cleared cv_downloaded and admin access from localStorage');
            
            // Sign out from Supabase
            await supabase.auth.signOut();
            console.log('Supabase sign out completed');
            
            // Clear user-specific localStorage data but preserve payment records and user object
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && !key.startsWith('payment_') && key !== 'user') {
                keysToRemove.push(key);
              }
            }
            
            // Remove only user-specific data, preserve payment records and user object
            keysToRemove.forEach(key => {
              localStorage.removeItem(key);
            });
            console.log('Cleared user-specific data, preserved payment records');
            
            // Don't reload the page - let the auth state change handle the UI update
            console.log('Sign out completed - auth state change will handle UI update');
          } catch (error) {
            console.error('Error during sign out:', error);
            // Don't reload even if there's an error - let auth state handle it
          }
        }}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="mobile-hidden"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16,17 21,12 16,7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span className="desktop-hidden">Sign Out</span>
        <span className="mobile-hidden">Sign Out</span>
      </button>

              <ChooseTemplate user={user} />
    </div>
  );
};

const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
