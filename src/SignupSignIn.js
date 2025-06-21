import React, { useState } from 'react';
import supabase from './supabase';

const SignupSignIn = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setLoading(true);
    
    try {
      let result;
      if (mode === 'signup') {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      
      if (result.error) {
        setError(result.error.message);
        if (result.error.message.toLowerCase().includes('email not confirmed')) {
          setShowResend(true);
        }
      } else if (result.data?.user) {
        onAuth(result.data.user);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        setError(error.message || 'Google sign-in failed. Please try again.');
      } else if (data) {
        console.log('Google OAuth initiated successfully');
        // The redirect will happen automatically
      }
    } catch (err) {
      console.error('Google OAuth exception:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setShowResend(false);
    setError('Please check your email inbox and spam folder for the confirmation email. If you did not receive it, try signing up again or contact support.');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f6fa'
    }}>
      <form onSubmit={handleAuth} style={{
        background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px #0001',
        minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <h2 style={{ margin: 0 }}>{mode === 'signup' ? 'Sign Up' : 'Sign In'}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          disabled={loading}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          disabled={loading}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
        />
        {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
        {showResend && (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            style={{
              padding: 8,
              borderRadius: 6,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              marginBottom: 8,
              marginTop: -8,
              opacity: loading ? 0.6 : 1
            }}
          >
            I did not receive the confirmation email
          </button>
        )}
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: 10, borderRadius: 6, border: 'none', 
            background: loading ? '#ccc' : '#3f51b5', 
            color: '#fff', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : (mode === 'signup' ? 'Sign Up' : 'Sign In')}
        </button>
        <button 
          type="button" 
          onClick={handleGoogle} 
          disabled={loading}
          style={{
            padding: 10, borderRadius: 6, border: 'none', 
            background: loading ? '#ccc' : '#ea4335', 
            color: '#fff', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Continue with Google'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 14 }}>
          {mode === 'signup'
            ? <>Already have an account? <span style={{ color: '#3f51b5', cursor: 'pointer' }} onClick={() => setMode('signin')}>Sign In</span></>
            : <>Don't have an account? <span style={{ color: '#3f51b5', cursor: 'pointer' }} onClick={() => setMode('signup')}>Sign Up</span></>
          }
        </div>
      </form>
    </div>
  );
};

export default SignupSignIn;
