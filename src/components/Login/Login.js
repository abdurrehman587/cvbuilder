import React, { useState, useEffect } from 'react';
import './Login.css';
import { authService, supabase } from '../Supabase/supabase';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Check if we're on a password reset page
  useEffect(() => {
    const checkPasswordReset = async () => {
      const hash = window.location.hash;
      const fullUrl = window.location.href;
      
      console.log('Checking password reset - Hash:', hash);
      console.log('Full URL:', fullUrl);
      
      // Check for error in URL (expired or invalid link)
      if (hash.includes('error=') || fullUrl.includes('error=')) {
        const errorMatch = hash.match(/error_description=([^&]+)/) || fullUrl.match(/error_description=([^&]+)/);
        const errorDescription = errorMatch ? decodeURIComponent(errorMatch[1].replace(/\+/g, ' ')) : 'Invalid or expired reset link';
        setError(errorDescription + '. Please request a new password reset link.');
        setIsResettingPassword(false);
        setShowForgotPassword(true);
        return;
      }
      
      // Check if hash contains recovery token
      // Supabase formats: #reset-password&access_token=xxx&type=recovery&... 
      // OR: #access_token=xxx&type=recovery&...
      const hasAccessToken = hash.includes('access_token=');
      const hasRecoveryType = hash.includes('type=recovery');
      const hasRecoveryToken = hasRecoveryType || (hasAccessToken && hash.includes('recovery'));
      const isResetPasswordRoute = hash.includes('reset-password') || hash === '#reset-password' || hash.startsWith('#reset-password');
      
      console.log('Token check - hasAccessToken:', hasAccessToken, 'hasRecoveryType:', hasRecoveryType, 'isResetPasswordRoute:', isResetPasswordRoute, 'hasRecoveryToken:', hasRecoveryToken);
      
      // Show reset form if we have recovery tokens OR if we're on the reset-password route (Supabase might redirect there)
      if (hasRecoveryToken || isResetPasswordRoute) {
        // Check if there's a recovery session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check - has session:', !!session);
        
        // If we have recovery tokens in the URL, show the form immediately
        // Supabase will establish the session when it processes the hash
        if (hasRecoveryToken) {
          console.log('Recovery tokens detected in URL, showing reset form');
          setIsResettingPassword(true);
          setIsLogin(true);
        } else if (session) {
          // User has a recovery session, show password reset form
          console.log('Recovery session found, showing reset form');
          setIsResettingPassword(true);
          setIsLogin(true);
        } else if (isResetPasswordRoute) {
          // We're on the reset-password route but no tokens yet
          // Wait a bit for Supabase to process any tokens
          console.log('On reset-password route, waiting for session');
        }
        
        // Always set up listener to catch when session is established
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state change in Login:', event, session ? 'has session' : 'no session');
          if (event === 'PASSWORD_RECOVERY') {
            console.log('PASSWORD_RECOVERY event detected, showing reset form');
            setIsResettingPassword(true);
            setIsLogin(true);
          } else if (session && (hasRecoveryType || hasAccessToken || isResetPasswordRoute)) {
            console.log('Session established, showing reset form');
            setIsResettingPassword(true);
            setIsLogin(true);
          }
        });
        
        // Also check after delays in case Supabase processes it asynchronously
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            console.log('Recovery session found after 500ms delay');
            setIsResettingPassword(true);
            setIsLogin(true);
          }
        }, 500);
        
        setTimeout(async () => {
          const { data: { session: retrySession2 } } = await supabase.auth.getSession();
          if (retrySession2) {
            console.log('Recovery session found after 2000ms delay');
            setIsResettingPassword(true);
            setIsLogin(true);
          } else if (hasRecoveryToken) {
            // If we have tokens but no session after delays, still show the form
            // The user might be able to proceed once Supabase finishes processing
            console.log('No session found after delays but tokens present, showing form anyway');
            setIsResettingPassword(true);
            setIsLogin(true);
          } else {
            console.log('No session found after delays, hash:', hash);
          }
        }, 2000);
        
        return () => {
          subscription.unsubscribe();
        };
      } else {
        console.log('No recovery token detected in hash');
      }
    };
    
    checkPasswordReset();
    
    // Also listen for hash changes in case the hash is updated after component mounts
    const handleHashChange = () => {
      checkPasswordReset();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Real Supabase login
        console.log('Attempting Supabase login...');
        const { data, error } = await authService.signIn(email, password);
        
        if (error) {
          console.error('Login error:', error);
          
          // Check if this is a "user not found" or "invalid password" error
          // which might indicate the account was created with Google
          if (error.message && (
            error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.toLowerCase().includes('password')
          )) {
            // Check if user exists with this email (might be a Google account)
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email, user_metadata')
                .eq('email', email)
                .single();
              
              if (userData && !userError) {
                // User exists - likely created with Google
                setError('This email is registered with Google sign-in. Please use "Continue with Google" to sign in. If you want to set a password, please contact support.');
                return;
              }
            } catch (checkErr) {
              // If we can't check, just show the original error
              console.log('Could not check user existence:', checkErr);
            }
          }
          
          setError('Login failed: ' + error.message);
          return;
        }
        
        console.log('Login successful:', data);
        setIsAuthenticated(true);
        localStorage.setItem('cvBuilderAuth', 'true');
        // Don't set selectedApp here - user will choose after login
        window.dispatchEvent(new CustomEvent('userAuthenticated'));
        
      } else {
        // Real Supabase signup
        console.log('Attempting Supabase signup...');
        
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        // All new signups are regular users by default
        const { data, error } = await authService.signUp(email, password, {
          full_name: email.split('@')[0], // Use email prefix as name
          user_type: 'regular' // All new signups default to regular
        });
        
        if (error) {
          console.error('Signup error:', error);
          
          // Check if error is due to existing user (might be a Google account)
          if (error.message && (
            error.message.includes('already registered') ||
            error.message.includes('User already registered') ||
            error.message.includes('already exists')
          )) {
            setError('An account with this email already exists. If you signed up with Google, please use "Continue with Google" to sign in instead.');
          } else {
            setError('Signup failed: ' + error.message);
          }
          return;
        }
        
        console.log('Signup successful:', data);
        setError('Signup successful! Please check your email to confirm your account, then login.');
        setIsLogin(true);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed: ' + err.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await authService.resetPassword(email);
      setResetEmailSent(true);
      setError('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to send reset email: ' + err.message);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setError('');
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmNewPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await authService.updatePassword(newPassword);
      setPasswordResetSuccess(true);
      setError('');
      // Clear the hash to remove the token
      window.history.replaceState(null, '', window.location.pathname);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setIsResettingPassword(false);
        setPasswordResetSuccess(false);
        setNewPassword('');
        setConfirmNewPassword('');
        window.location.hash = '';
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to reset password: ' + (err.message || 'Invalid or expired reset link. Please request a new one.'));
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleSigningIn(true);
    
    // All Google sign-ins create regular users by default
    // Store 'regular' as default user type for OAuth callback
    sessionStorage.setItem('pendingUserType', 'regular');
    
    // Listen for callback to hide loading
    const handleCallback = () => {
      setIsGoogleSigningIn(false);
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    };
    
    const handleError = (event) => {
      setIsGoogleSigningIn(false);
      setError('Google sign-in failed. Please try again.');
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    };
    
    window.addEventListener('googleSignInCallbackReceived', handleCallback);
    window.addEventListener('googleSignInError', handleError);
    
    try {
      console.log('Attempting Google sign-in (default: regular user)');
      const { error } = await authService.signInWithGoogle();
      
      if (error) {
        console.error('Google sign-in error:', error);
        setIsGoogleSigningIn(false);
        setError('Google sign-in failed: ' + error.message);
        window.removeEventListener('googleSignInCallbackReceived', handleCallback);
        window.removeEventListener('googleSignInError', handleError);
        return;
      }
      
      // The OAuth flow will redirect, so we don't need to handle success here
      // The auth state change will be handled by App.js
      // Loading state will be cleared when callback is received
    } catch (err) {
      console.error('Google authentication error:', err);
      setIsGoogleSigningIn(false);
      setError('Google authentication failed: ' + err.message);
      window.removeEventListener('googleSignInCallbackReceived', handleCallback);
      window.removeEventListener('googleSignInError', handleError);
    }
  };

  if (isAuthenticated) {
    return null; // This component will be hidden when authenticated
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{showForgotPassword || isResettingPassword ? 'Reset Password' : 'Welcome'}</h1>
          <p>
            {isResettingPassword
              ? 'Enter your new password'
              : showForgotPassword 
              ? (resetEmailSent 
                  ? 'Check your email for reset instructions' 
                  : 'Enter your email to reset your password')
              : (isLogin ? 'Sign in to access all products' : 'Get Started - It\'s Free!')
            }
          </p>
          {!isLogin && !showForgotPassword && (
            <div className="welcome-message">
              <p>Access all our products with one account</p>
              <p>Your data is automatically saved</p>
              <p>No experience needed - we guide you through it</p>
            </div>
          )}
        </div>

        {isResettingPassword ? (
          <form onSubmit={handlePasswordReset} className="login-form">
            {passwordResetSuccess ? (
              <div className="success-message">
                <p>✅ Password reset successful!</p>
                <p>Your password has been updated. Redirecting to login...</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-new-password">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm-new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="login-button">
                  Reset Password
                </button>

                <button 
                  type="button" 
                  onClick={() => {
                    setIsResettingPassword(false);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setError('');
                    window.location.hash = '';
                  }}
                  className="toggle-button"
                  style={{ 
                    width: '100%', 
                    marginTop: '0.5rem',
                    background: 'transparent',
                    color: '#667eea',
                    border: '1px solid #667eea'
                  }}
                >
                  Back to Sign In
                </button>
              </>
            )}
          </form>
        ) : showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="login-form">
            {resetEmailSent ? (
              <div className="success-message">
                <p>✅ Password reset email sent!</p>
                <p>Please check your email inbox and follow the instructions to reset your password.</p>
                <button 
                  type="button" 
                  onClick={handleBackToLogin}
                  className="login-button"
                  style={{ marginTop: '1rem' }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="reset-email">Email Address</label>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="login-button">
                  Send Reset Link
                </button>

                <button 
                  type="button" 
                  onClick={handleBackToLogin}
                  className="toggle-button"
                  style={{ 
                    width: '100%', 
                    marginTop: '0.5rem',
                    background: 'transparent',
                    color: '#667eea',
                    border: '1px solid #667eea'
                  }}
                >
                  Back to Sign In
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
            </>
          )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button">
              {isLogin ? 'Sign In' : 'Get Started'}
            </button>
          </form>
        )}

        {!showForgotPassword && (
          <>
            <div className="divider">
              <span>or</span>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleSignIn} 
              className="google-button"
              disabled={isGoogleSigningIn}
              style={{ opacity: isGoogleSigningIn ? 0.7 : 1, cursor: isGoogleSigningIn ? 'wait' : 'pointer' }}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isGoogleSigningIn ? 'Signing in...' : 'Continue with Google'}
            </button>
          </>
        )}

        {!showForgotPassword && (
          <div className="login-footer">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={toggleMode} className="toggle-button">
                {isLogin ? 'Get Started' : 'Sign In'}
              </button>
            </p>
            {isLogin && (
              <div className="forgot-password">
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(true)}
                  className="forgot-password-link"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* User Type Selection Modal for Google Sign-In */}
    </div>
  );
}

export default Login;
