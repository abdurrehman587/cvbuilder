import React, { useState } from 'react';
import './ProductsPage.css';
import { authService } from '../Supabase/supabase';

const ProductsPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = [
    {
      id: 'cv-builder',
      name: 'CV Builder',
      description: 'Create professional CVs with multiple templates. Build, edit, and download your resume in PDF format.',
      icon: '📄',
      color: '#3b82f6'
    },
    {
      id: 'id-card-print',
      name: 'ID Card Printing Utility',
      description: 'Print multiple ID cards on A4 paper with perfect alignment. Supports front and back printing.',
      icon: '🪪',
      color: '#10b981'
    },
    // More products can be added here later
  ];

  const handleProductClick = (productId) => {
    // Store selected product in localStorage for after login
    localStorage.setItem('selectedApp', productId);
    setSelectedProduct(productId);
    setShowLogin(true);
  };

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
        localStorage.setItem('cvBuilderAuth', 'true');
        window.dispatchEvent(new CustomEvent('userAuthenticated'));
        window.location.reload();
        
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

  return (
    <div className="products-page">
      <div className="products-container">
        {!showLogin ? (
          <div className="products-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product.id)}
                style={{ '--product-color': product.color }}
              >
                <div className="product-icon">{product.icon}</div>
                <h2 className="product-name">{product.name}</h2>
                <p className="product-description">{product.description}</p>
                <div className="product-button">
                  Get Started →
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="login-form-container">
            <div className="login-card-inline">
              <div className="login-header-inline">
                <h2>Welcome</h2>
                <p>{isLogin ? 'Sign in to access all products' : 'Get Started - It\'s Free!'}</p>
                {!isLogin && (
                  <div className="welcome-message-inline">
                    <p>Access all our products with one account</p>
                    <p>Your data is automatically saved</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="login-form-inline">
                <div className="form-group-inline">
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

                <div className="form-group-inline">
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
                  <div className="form-group-inline">
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

                {error && <div className="error-message-inline">{error}</div>}

                <button type="submit" className="login-button-inline">
                  {isLogin ? 'Sign In' : 'Get Started'}
                </button>
              </form>

              <div className="login-footer-inline">
                <p>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button type="button" onClick={toggleMode} className="toggle-button-inline">
                    {isLogin ? 'Get Started' : 'Sign In'}
                  </button>
                </p>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowLogin(false);
                    setError('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="back-to-products-button"
                >
                  ← Back to Products
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;

