import React, { useState, useEffect } from 'react';
import supabase from './supabase';
import PaymentAdmin from './PaymentAdmin';

const SignupSignIn = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [userType, setUserType] = useState('user'); // 'user' or 'admin'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminToggle, setShowAdminToggle] = useState(false);
  const [adminAccessAttempts, setAdminAccessAttempts] = useState(0);

  // Admin credentials (in production, this should be in environment variables)
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'admin@cvbuilder.com';
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123456';

  useEffect(() => {
    // Handle automatic sign-out when browser/tab is closed
    const handleBeforeUnload = () => {
      // Clear all localStorage data
      localStorage.clear();
      // Sign out from Supabase
      supabase.auth.signOut();
    };

    // Handle page visibility change (when tab becomes hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Clear all localStorage data
        localStorage.clear();
        // Sign out from Supabase
        supabase.auth.signOut();
      }
    };

    // Handle page unload (when page is being unloaded)
    const handlePageHide = () => {
      // Clear all localStorage data
      localStorage.clear();
      // Sign out from Supabase
      supabase.auth.signOut();
    };

    // Handle keyboard shortcuts for admin access
    const handleKeyPress = (e) => {
      // Ctrl + Alt + A to toggle admin access (hidden feature)
      if (e.ctrlKey && e.altKey && e.key === 'a') {
        e.preventDefault();
        setShowAdminToggle(!showAdminToggle);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showAdminToggle]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setLoading(true);
    
    try {
      // Check if this is an admin login attempt
      if (userType === 'admin') {
        // Rate limiting for admin access attempts
        if (adminAccessAttempts >= 3) {
          setError('Too many admin access attempts. Please try again later.');
          setLoading(false);
          return;
        }

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          // Create admin user object
          const adminUser = {
            id: 'admin-user',
            email: ADMIN_EMAIL,
            user_metadata: { role: 'admin' },
            isAdmin: true
          };
          onAuth(adminUser);
          setShowAdminPanel(true);
          setAdminAccessAttempts(0); // Reset attempts on successful login
          return;
        } else {
          setAdminAccessAttempts(prev => prev + 1);
          const remainingAttempts = 3 - adminAccessAttempts - 1;
          setError(`Invalid admin credentials. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : 'No attempts remaining.'}`);
          setLoading(false);
          return;
        }
      }

      // Regular user authentication
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
        // Add user type to user object
        const userWithType = {
          ...result.data.user,
          userType: 'user',
          isAdmin: false
        };
        onAuth(userWithType);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (userType === 'admin') {
      setError('Google sign-in is not available for admin accounts. Please use email/password.');
      return;
    }

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

  const handleBackToLogin = () => {
    setShowAdminPanel(false);
    setUserType('user');
    setEmail('');
    setPassword('');
    setError('');
  };

  // If admin panel is shown, render the admin interface
  if (showAdminPanel) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f6fa',
        position: 'relative'
      }}>
        <button
          onClick={handleBackToLogin}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1000,
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Inter', sans-serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← Back to Login
        </button>
        
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
          padding: '8px 16px',
          backgroundColor: '#dc2626',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Inter', sans-serif"
        }}>
          🔐 Admin Mode
        </div>

        <PaymentAdmin />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f6fa'
    }}>
      <form onSubmit={handleAuth} style={{
        background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px #0001',
        minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <h2 style={{ margin: 0, textAlign: 'center' }}>
          {userType === 'admin' ? '🔐 Admin Login' : (mode === 'signup' ? 'Sign Up' : 'Sign In')}
        </h2>

        {/* Hidden Admin Toggle - Only show on specific conditions */}
        <div style={{
          display: 'flex',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          marginBottom: '8px',
          opacity: showAdminToggle ? 1 : 0.1,
          transition: 'opacity 0.3s ease',
          pointerEvents: showAdminToggle ? 'auto' : 'none'
        }}>
          <button
            type="button"
            onClick={() => {
              setUserType('user');
              setAdminAccessAttempts(0); // Reset attempts when switching to user mode
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: userType === 'user' ? '#3f51b5' : '#f9fafb',
              color: userType === 'user' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: userType === 'user' ? '600' : '400',
              transition: 'all 0.2s ease'
            }}
          >
            👤 User
          </button>
          <button
            type="button"
            onClick={() => setUserType('admin')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: userType === 'admin' ? '#dc2626' : '#f9fafb',
              color: userType === 'admin' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: userType === 'admin' ? '600' : '400',
              transition: 'all 0.2s ease'
            }}
          >
            🔐 Admin
          </button>
        </div>

        {/* Admin access info with rate limiting display */}
        {userType === 'admin' && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#dc2626'
          }}>
            <strong>Admin Access:</strong><br />
            Please contact the system administrator for access credentials.
            {adminAccessAttempts > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                Failed attempts: {adminAccessAttempts}/3
              </div>
            )}
          </div>
        )}

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
            background: loading ? '#ccc' : (userType === 'admin' ? '#dc2626' : '#3f51b5'), 
            color: '#fff', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : (userType === 'admin' ? 'Admin Login' : (mode === 'signup' ? 'Sign Up' : 'Sign In'))}
        </button>
        
        {userType === 'user' && (
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
        )}
        
        {userType === 'user' && (
          <div style={{ textAlign: 'center', fontSize: 14 }}>
            {mode === 'signup'
              ? <>Already have an account? <span style={{ color: '#3f51b5', cursor: 'pointer' }} onClick={() => setMode('signin')}>Sign In</span></>
              : <>Don't have an account? <span style={{ color: '#3f51b5', cursor: 'pointer' }} onClick={() => setMode('signup')}>Sign Up</span></>
            }
          </div>
        )}

        {/* Hidden admin access indicator - only shows when admin mode is active */}
        {showAdminToggle && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '4px 8px',
            backgroundColor: '#dc2626',
            color: 'white',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            opacity: 0.7
          }}>
            ADMIN
          </div>
        )}
      </form>
    </div>
  );
};

export default SignupSignIn;
