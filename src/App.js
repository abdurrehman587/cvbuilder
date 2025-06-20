import React, { useEffect, useState } from 'react';
import supabase from './supabase';
import SignupSignIn from './SignupSignIn';
import LandingPage from './landingpage'; // <-- import LandingPage

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for session on mount
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

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
      <LandingPage />
    </div>
  );
};

export default App;
