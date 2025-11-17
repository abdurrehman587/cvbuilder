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
  };

  if (isAuthenticated) {
    return null; // This component will be hidden when authenticated
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome</h1>
          <p>{isLogin ? 'Sign in to access all products' : 'Get Started - It\'s Free!'}</p>
          {!isLogin && (
            <div className="welcome-message">
              <p>Access all our products with one account</p>
              <p>Your data is automatically saved</p>
              <p>No experience needed - we guide you through it</p>
            </div>
          )}
        </div>

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

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={toggleMode} className="toggle-button">
              {isLogin ? 'Get Started' : 'Sign In'}
            </button>
          </p>
          {isLogin && (
            <div className="forgot-password">
              <button type="button" className="forgot-password-link">
                Forgot your password?
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Login;
