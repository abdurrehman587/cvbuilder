import React, { useEffect, useState } from 'react';
import supabase from './supabase';
import SignupSignIn from './SignupSignIn';
import LandingPage from './landingpage';
import DatabaseSetupCheck from './DatabaseSetupCheck';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth callback
    const handleAuthCallback = async () => {
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
    };

    // Check for session on mount
    const checkSession = async () => {
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
    };

    // Check if we're on an auth callback page
    if (window.location.pathname === '/auth/callback') {
      handleAuthCallback();
    } else {
      checkSession();
    }

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
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
    };
  }, []);

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
      <DatabaseSetupCheck />
      
      <button
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
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16,17 21,12 16,7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Sign Out
      </button>

      <LandingPage user={user} />
    </div>
  );
};

export default App;
