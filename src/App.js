import React, { useEffect, useState } from 'react';
import supabase from './supabase';
import SignupSignIn from './SignupSignIn';
import LandingPage from './landingpage';

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
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Handle automatic sign-out when browser/tab is closed
    const handleBeforeUnload = () => {
      // Only clear non-admin related data, preserve admin access
      const adminAccess = localStorage.getItem('admin_cv_access');
      const user = localStorage.getItem('user');
      const isAdmin = adminAccess === 'true' || (user && JSON.parse(user)?.isAdmin);
      
      if (!isAdmin) {
        // Only clear localStorage for non-admin users
        localStorage.clear();
        // Sign out from Supabase
        supabase.auth.signOut();
      }
      // Admin users keep their session intact
    };

    // Handle page visibility change (when tab becomes hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Only clear non-admin related data, preserve admin access
        const adminAccess = localStorage.getItem('admin_cv_access');
        const user = localStorage.getItem('user');
        const isAdmin = adminAccess === 'true' || (user && JSON.parse(user)?.isAdmin);
        
        if (!isAdmin) {
          // Only clear localStorage for non-admin users
          localStorage.clear();
          // Sign out from Supabase
          supabase.auth.signOut();
        }
        // Admin users keep their session intact
      }
    };

    // Handle page unload (when page is being unloaded)
    const handlePageHide = () => {
      // Only clear non-admin related data, preserve admin access
      const adminAccess = localStorage.getItem('admin_cv_access');
      const user = localStorage.getItem('user');
      const isAdmin = adminAccess === 'true' || (user && JSON.parse(user)?.isAdmin);
      
      if (!isAdmin) {
        // Only clear localStorage for non-admin users
        localStorage.clear();
        // Sign out from Supabase
        supabase.auth.signOut();
      }
      // Admin users keep their session intact
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      listener?.subscription?.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
          // Clear download state when signing out
          localStorage.removeItem('cv_downloaded');
          await supabase.auth.signOut();
          // Reload the page to clear state and show login page
          window.location.reload();
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
