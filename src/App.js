import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import supabase from './supabase';
import SignupSignIn from './SignupSignIn';
import Form from './Form';
import Template1Preview from './Template1Preview';

const App = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(null);

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
      <Form formData={formData} setFormData={setFormData} user={user} />
      <Template1Preview formData={formData || {}} />
    </div>
  );
};

export default App;
