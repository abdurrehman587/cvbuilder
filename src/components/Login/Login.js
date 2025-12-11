import React, { useState } from 'react';
import './Login.css';
import { authService } from '../Supabase/supabase';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

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
        
        const { data, error } = await authService.signUp(email, password, {
          full_name: email.split('@')[0] // Use email prefix as name
        });
        
        if (error) {
          console.error('Signup error:', error);
          setError('Signup failed: ' + error.message);
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

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleSigningIn(true);
    
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
      console.log('Attempting Google sign-in...');
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
          <h1>{showForgotPassword ? 'Reset Password' : 'Welcome'}</h1>
          <p>
            {showForgotPassword 
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

        {showForgotPassword ? (
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
    </div>
  );
}

export default Login;
