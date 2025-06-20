import React, { useState } from 'react';
import supabase from './supabase';

const SignupSignIn = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    let result;
    if (mode === 'signup') {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    if (result.error) {
      setError(result.error.message);
      if (
        result.error.message &&
        result.error.message.toLowerCase().includes('email not confirmed')
      ) {
        setShowResend(true);
      }
    } else if (result.data?.user) {
      onAuth(result.data.user);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
  };

  const handleResend = async () => {
    setError('');
    setShowResend(false);
    // Supabase JS client does not support resend confirmation directly.
    // Instruct user to check their email.
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
          onChange={e => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={e => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
        />
        {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
        {showResend && (
          <button
            type="button"
            onClick={handleResend}
            style={{
              padding: 8,
              borderRadius: 6,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              marginBottom: 8,
              marginTop: -8,
            }}
          >
            I did not receive the confirmation email
          </button>
        )}
        <button type="submit" style={{
          padding: 10, borderRadius: 6, border: 'none', background: '#3f51b5', color: '#fff', fontWeight: 600
        }}>
          {mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </button>
        <button type="button" onClick={handleGoogle} style={{
          padding: 10, borderRadius: 6, border: 'none', background: '#ea4335', color: '#fff', fontWeight: 600
        }}>
          Continue with Google
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
