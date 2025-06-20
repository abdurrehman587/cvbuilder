import React, { useEffect, useState } from 'react';
import supabase from './supabase';
import SignupSignIn from './SignupSignIn';
import LandingPage from './landingpage'; // <-- import LandingPage

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth callback
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      setLoading(false);
    };

    // Check for session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
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
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      listener?.subscription?.unsubscribe();
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

  return (
    <div>
      <button
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
        onClick={() => supabase.auth.signOut()}
      >
        Sign Out
      </button>
      <LandingPage user={user} />
    </div>
  );
};

export default App;
