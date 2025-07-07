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
  const [showAdminToggle, setShowAdminToggle] = useState(true);
  const [adminAccessAttempts, setAdminAccessAttempts] = useState(0);

  // Admin credentials (in production, this should be in environment variables)
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'admin@cvbuilder.com';
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123456';

  useEffect(() => {
    // Handle automatic sign-out only when browser is actually closing (not tab switching)
    const handleBeforeUnload = () => {
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

    // Add event listeners - only for actual browser close, not tab switching
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showAdminToggle]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setLoading(true);
    
    console.log('=== AUTHENTICATION START ===');
    console.log('SignupSignIn - Mode:', mode);
    console.log('SignupSignIn - UserType:', userType);
    console.log('SignupSignIn - Email:', email);
    console.log('SignupSignIn - Password length:', password.length);
    
    try {
      // Check if this is an admin login attempt
      if (userType === 'admin') {
        console.log('SignupSignIn - Admin login attempt');
        // Rate limiting for admin access attempts
        if (adminAccessAttempts >= 3) {
          console.log('SignupSignIn - Too many admin attempts');
          setError('Too many admin access attempts. Please try again later.');
          setLoading(false);
          return;
        }

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          console.log('SignupSignIn - Admin login successful');
          // Create admin user object
          const adminUser = {
            id: 'admin-user',
            email: ADMIN_EMAIL,
            user_metadata: { role: 'admin' },
            isAdmin: true
          };
          onAuth(adminUser);
          // Store admin user object in localStorage for payment utilities
          localStorage.setItem('user', JSON.stringify(adminUser));
          setShowAdminPanel(true);
          setAdminAccessAttempts(0); // Reset attempts on successful login
          return;
        } else {
          console.log('SignupSignIn - Admin login failed');
          setAdminAccessAttempts(prev => prev + 1);
          const remainingAttempts = 3 - adminAccessAttempts - 1;
          setError(`Invalid admin credentials. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : 'No attempts remaining.'}`);
          setLoading(false);
          return;
        }
      }

      // Regular user authentication
      console.log('SignupSignIn - Regular user authentication');
      let result;
      if (mode === 'signup') {
        console.log('SignupSignIn - Attempting signup');
        result = await supabase.auth.signUp({ email, password });
      } else {
        console.log('SignupSignIn - Attempting signin');
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      
      console.log('SignupSignIn - Auth result:', result);
      
      if (result.error) {
        console.log('SignupSignIn - Auth error:', result.error);
        setError(result.error.message);
        if (result.error.message.toLowerCase().includes('email not confirmed')) {
          setShowResend(true);
        }
      } else if (result.data?.user) {
        console.log('SignupSignIn - Auth successful, user:', result.data.user);
        // Add user type to user object
        const userWithType = {
          ...result.data.user,
          userType: 'user',
          isAdmin: false
        };
        onAuth(userWithType);
        // Store user object in localStorage for payment utilities
        localStorage.setItem('user', JSON.stringify(userWithType));
      }
    } catch (err) {
      console.log('SignupSignIn - Auth exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== AUTHENTICATION END ===');
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
        


        <PaymentAdmin />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f5f6fa',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <style>
        {`
          @media (max-width: 768px) {
            .auth-form {
              min-width: 280px !important;
              padding: 24px !important;
              margin: 10px !important;
            }
            
            .auth-title {
              font-size: 1.5rem !important;
            }
            
            .auth-input {
              font-size: 16px !important;
              padding: 12px !important;
            }
            
            .auth-button {
              padding: 12px !important;
              font-size: 16px !important;
            }
            
            .auth-toggle {
              margin-bottom: 12px !important;
            }
            
            .auth-toggle button {
              padding: 12px !important;
              font-size: 14px !important;
            }
          }
          
          @media (max-width: 480px) {
            .auth-form {
              min-width: 250px !important;
              padding: 20px !important;
              margin: 5px !important;
            }
            
            .auth-title {
              font-size: 1.25rem !important;
            }
            
            .auth-input {
              padding: 10px !important;
            }
            
            .auth-button {
              padding: 10px !important;
            }
            
            .auth-toggle button {
              padding: 10px !important;
              font-size: 13px !important;
            }
          }
        `}
      </style>
      <form onSubmit={handleAuth} className="auth-form" style={{
        background: '#fff', 
        padding: 32, 
        borderRadius: 12, 
        boxShadow: '0 2px 12px #0001',
        minWidth: 320, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16,
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 className="auth-title" style={{ margin: 0, textAlign: 'center' }}>
          {userType === 'admin' ? '🔐 Admin Login' : (mode === 'signup' ? 'Sign Up' : 'Sign In')}
        </h2>

        {/* Hidden Admin Toggle - Only show on specific conditions */}
        <div className="auth-toggle" style={{
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

        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          disabled={loading}
          onChange={e => setEmail(e.target.value)}
          className="auth-input"
          style={{ 
            padding: 10, 
            borderRadius: 6, 
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          disabled={loading}
          onChange={e => setPassword(e.target.value)}
          className="auth-input"
          style={{ 
            padding: 10, 
            borderRadius: 6, 
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
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
          className="auth-button"
          style={{
            padding: 10, 
            borderRadius: 6, 
            border: 'none', 
            background: loading ? '#ccc' : (userType === 'admin' ? '#dc2626' : '#3f51b5'), 
            color: '#fff', 
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Loading...' : (userType === 'admin' ? 'Admin Login' : (mode === 'signup' ? 'Sign Up' : 'Sign In'))}
        </button>
        

        
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
