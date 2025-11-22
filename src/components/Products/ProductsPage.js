import React, { useState, useEffect, useRef } from 'react';
import './ProductsPage.css';
import { authService } from '../Supabase/supabase';

const ProductsPage = ({ onProductSelect }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const products = [
    {
      id: 'cv-builder',
      name: 'CV Builder',
      description: 'Create professional CVs with multiple templates. Build, edit, and download your resume in PDF format.',
      icon: '📄',
      color: '#60a5fa',
      textColor: '#60a5fa',
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1920&h=1080&fit=crop&q=90',
      overlay: 'rgba(255, 255, 255, 0.85)'
    },
    {
      id: 'id-card-print',
      name: 'ID Card Printing Utility',
      description: 'Print multiple ID cards on A4 paper with perfect alignment. Supports front and back printing.',
      icon: '🪪',
      color: '#34d399',
      textColor: '#34d399',
      gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1920&h=1080&fit=crop&q=90',
      overlay: 'rgba(255, 255, 255, 0.85)'
    },
    // More products can be added here later
  ];

  const [selectedProduct, setSelectedProduct] = useState(() => {
    // Initialize from localStorage or default to cv-builder
    return localStorage.getItem('selectedApp') || 'cv-builder';
  });
  const [currentSlide, setCurrentSlide] = useState(() => {
    // Initialize slide based on selected product
    const initialProduct = localStorage.getItem('selectedApp') || 'cv-builder';
    const productList = [
      { id: 'cv-builder' },
      { id: 'id-card-print' }
    ];
    return productList.findIndex(p => p.id === initialProduct);
  });
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  // Handle product selection from header
  React.useEffect(() => {
    const handleProductChange = (productId) => {
      setSelectedProduct(productId);
      localStorage.setItem('selectedApp', productId);
      // Find the index of the selected product
      const index = products.findIndex(p => p.id === productId);
      if (index !== -1) {
        setCurrentSlide(index);
      }
    };

    if (onProductSelect) {
      // Expose the handler to parent
      window.handleProductSelect = handleProductChange;
    }
  }, [onProductSelect, products]);

  // This function is called from Header component
  const handleProductSelect = (productId) => {
    localStorage.setItem('selectedApp', productId);
    setSelectedProduct(productId);
    // Find the index of the selected product
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      setCurrentSlide(index);
    }
  };

  // Expose handler to window for Header to call
  React.useEffect(() => {
    window.handleProductSelect = handleProductSelect;
    // Expose function to show login form
    window.showLoginForm = () => {
      setShowLogin(true);
    };
    return () => {
      delete window.handleProductSelect;
      delete window.showLoginForm;
    };
  }, []);

  // Handle escape key to close modal and body scroll lock
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showLogin) {
        setShowLogin(false);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    };
    
    if (showLogin) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showLogin]);

  // Auto-rotate carousel
  useEffect(() => {
    if (isPaused || showLogin) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isPaused, showLogin, products.length]);

  // Handle product click from carousel
  const handleProductClick = (productId, index) => {
    setSelectedProduct(productId);
    setCurrentSlide(index);
    localStorage.setItem('selectedApp', productId);
    if (window.handleProductSelect) {
      window.handleProductSelect(productId);
    }
    
    // Scroll to the product section
    setTimeout(() => {
      const sectionId = productId === 'cv-builder' ? 'cv-builder-section' : 'id-card-print-section';
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleGetStarted = (productId) => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          // User is authenticated - navigate to respective dashboard
          // Clear products page flags
          localStorage.removeItem('showProductsPage');
          sessionStorage.removeItem('showProductsPage');
          if (window.resetProductsPageFlag) {
            window.resetProductsPageFlag();
          }
          
          // Set selected product
          localStorage.setItem('selectedApp', productId);
          
          if (productId === 'cv-builder') {
            // Navigate to CV Builder dashboard
            // Set flag to indicate this is a reload, not a close
            sessionStorage.setItem('isReloading', 'true');
            // Set flag to navigate to dashboard
            sessionStorage.setItem('navigateToCVBuilder', 'true');
            // Clear hash if present
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            // Navigate to root - App.js will show dashboard
            window.location.href = '/';
          } else if (productId === 'id-card-print') {
            // Navigate to ID Card Print dashboard
            // Set flag to indicate this is a reload, not a close
            sessionStorage.setItem('isReloading', 'true');
            // Set flag to navigate to ID Card Print dashboard
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            // Also set in localStorage as backup
            localStorage.setItem('navigateToIDCardPrint', 'true');
            console.log('Setting navigateToIDCardPrint flag:', sessionStorage.getItem('navigateToIDCardPrint'));
            // Clear hash if present
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            // Navigate to root - App.js will show ID Card Print dashboard
            window.location.href = '/';
          }
        } else {
          // User is not authenticated - show login form
          // Set flag to navigate to respective dashboard after login
          if (productId === 'id-card-print') {
            sessionStorage.setItem('navigateToIDCardPrint', 'true');
            localStorage.setItem('navigateToIDCardPrint', 'true'); // Backup in localStorage
            localStorage.setItem('selectedApp', 'id-card-print');
            console.log('Setting navigateToIDCardPrint flag for unauthenticated user:', sessionStorage.getItem('navigateToIDCardPrint'));
          } else if (productId === 'cv-builder') {
            sessionStorage.setItem('navigateToCVBuilder', 'true');
            localStorage.setItem('selectedApp', 'cv-builder');
          }
          setShowLogin(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, show login form
        setShowLogin(true);
      }
    };
    checkAuth();
  };

  const handleTemplateClick = (templateNumber) => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          // User is authenticated - navigate to CV Dashboard
          // Set flag to indicate this is a reload, not a close
          sessionStorage.setItem('isReloading', 'true');
          // Clear products page flags
          localStorage.removeItem('showProductsPage');
          sessionStorage.removeItem('showProductsPage');
          if (window.resetProductsPageFlag) {
            window.resetProductsPageFlag();
          }
          // Set selected template and app
          localStorage.setItem('selectedTemplate', `template${templateNumber}`);
          localStorage.setItem('selectedApp', 'cv-builder');
          // Set flag to navigate to CV Builder dashboard
          sessionStorage.setItem('navigateToCVBuilder', 'true');
          // Clear hash if present
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          // Navigate to root - App.js will show dashboard
          window.location.href = '/';
        } else {
          // User is not authenticated - show login form
          // Set flag to navigate to CV Builder dashboard after login
          sessionStorage.setItem('navigateToCVBuilder', 'true');
          localStorage.setItem('selectedTemplate', `template${templateNumber}`);
          localStorage.setItem('selectedApp', 'cv-builder');
          setShowLogin(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, show login form
        // Set flag to navigate to CV Builder dashboard after login
        sessionStorage.setItem('navigateToCVBuilder', 'true');
        localStorage.setItem('selectedTemplate', `template${templateNumber}`);
        localStorage.setItem('selectedApp', 'cv-builder');
        setShowLogin(true);
      }
    };
    checkAuth();
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
        // Show success message
        setLoginSuccess(true);
        setError('');
        // Dispatch authentication event
        window.dispatchEvent(new CustomEvent('userAuthenticated'));
        
        // Check if user wants to navigate to CV Builder or ID Card Print
        const navigateToCVBuilder = sessionStorage.getItem('navigateToCVBuilder') === 'true' || localStorage.getItem('navigateToCVBuilder') === 'true';
        const navigateToIDCardPrint = sessionStorage.getItem('navigateToIDCardPrint') === 'true' || localStorage.getItem('navigateToIDCardPrint') === 'true';
        
        console.log('Login successful - checking navigation flags:', {
          navigateToCVBuilder,
          navigateToIDCardPrint,
          sessionStorageCV: sessionStorage.getItem('navigateToCVBuilder'),
          sessionStorageID: sessionStorage.getItem('navigateToIDCardPrint'),
          localStorageCV: localStorage.getItem('navigateToCVBuilder'),
          localStorageID: localStorage.getItem('navigateToIDCardPrint')
        });
        
        // Ensure flags are set in both storages for persistence
        if (navigateToIDCardPrint) {
          sessionStorage.setItem('navigateToIDCardPrint', 'true');
          localStorage.setItem('navigateToIDCardPrint', 'true');
        }
        if (navigateToCVBuilder) {
          sessionStorage.setItem('navigateToCVBuilder', 'true');
        }
        
        if (navigateToCVBuilder || navigateToIDCardPrint) {
          // Clear products page flags to allow navigation
          localStorage.removeItem('showProductsPage');
          sessionStorage.removeItem('showProductsPage');
        }
        
        // Wait a moment to show success message, then proceed
        setTimeout(() => {
          // Set flag to indicate this is a reload, not a close
          sessionStorage.setItem('isReloading', 'true');
          // Close login modal
          setShowLogin(false);
          setLoginSuccess(false);
          // Reload to trigger navigation
          window.location.reload();
        }, 2000); // Show success message for 2 seconds
        
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
        {/* Animated Product Carousel */}
            <div 
              className="products-carousel-container"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="carousel-wrapper">
                <div 
                  className="carousel-track"
                  ref={carouselRef}
                  style={{
                    transform: `translateX(-${currentSlide * 100}%)`
                  }}
                >
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className={`carousel-slide ${selectedProduct === product.id ? 'active' : ''} ${currentSlide === index ? 'current' : ''}`}
                      onClick={() => handleProductClick(product.id, index)}
                      style={{ 
                        '--product-color': product.color,
                        '--product-text-color': product.textColor,
                        '--product-gradient': product.gradient,
                        '--product-overlay': product.overlay
                      }}
                    >
                      <div className="carousel-slide-inner">
                        <div className="carousel-image-section">
                          {product.id === 'id-card-print' ? (
                            <img 
                              src="/images/carousel/id-card-printing-utility.jpg" 
                              alt="ID Card Printing Utility Interface"
                              className="carousel-featured-image id-card-interface-image"
                              loading="lazy"
                              onError={(e) => {
                                // Fallback to placeholder if image not found
                                e.target.src = product.image;
                              }}
                            />
                          ) : (
                            <>
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="carousel-featured-image"
                                loading="lazy"
                              />
                              <div className="carousel-image-overlay"></div>
                            </>
                          )}
                        </div>
                        <div className="carousel-slide-content">
                          <div className="carousel-product-icon">{product.icon}</div>
                          <h2 className="carousel-product-name">{product.name}</h2>
                          <p className="carousel-product-description">{product.description}</p>
                          <div 
                            className="carousel-product-button"
                            onClick={() => handleGetStarted(product.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span>Get Started</span>
                            <span className="button-arrow">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Indicators */}
              <div className="carousel-indicators">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    className={`carousel-indicator ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentSlide(index);
                      handleProductClick(product.id, index);
                    }}
                    aria-label={`Go to ${product.name}`}
                  />
                ))}
              </div>
            </div>

            {/* CV Builder Detailed View - Always visible */}
            <div id="cv-builder-section" className="product-detail-view-inline">
              <div className="product-detail-content">
                {/* Templates Section with CV Builder Header */}
                <div className="templates-section">
                  {/* CV Builder Header */}
                  <div className="product-detail-header">
                    <div className="product-detail-header-content">
                      <div className="product-detail-icon-large">📄</div>
                      <div className="product-detail-text-content">
                        <h1 className="product-detail-title">CV Builder</h1>
                        <p className="product-detail-subtitle">Create professional CVs that stand out from the crowd</p>
                        <p className="product-detail-instruction">Fill the form and get your CV Ready.</p>
                      </div>
                    </div>
                  </div>

                  <h2 className="section-title">Choose from Professional Templates</h2>
                  <p className="section-description">Each template is designed to showcase your skills and experience in the best possible way</p>
                    
                    <div className="templates-grid">
                      <div className="template-card" onClick={() => handleTemplateClick(1)}>
                        <div className="template-image-container">
                          <img 
                            src="/images/templates/Template1.jpg" 
                            alt="Template 1 - Two Column Layout"
                            className="template-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="template-placeholder" style={{ display: 'none' }}>
                            <div className="template-preview-box">
                              <div className="template-preview-left"></div>
                              <div className="template-preview-right"></div>
                            </div>
                            <p>Template 1 Preview</p>
                          </div>
                        </div>
                        <p className="template-description">Clean, modern design with blue accents. Ideal for professional and corporate environments.</p>
                      </div>

                      <div className="template-card" onClick={() => handleTemplateClick(2)}>
                        <div className="template-image-container">
                          <img 
                            src="/images/templates/Template2.jpg" 
                            alt="Template 2 - Modern Design"
                            className="template-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="template-placeholder" style={{ display: 'none' }}>
                            <div className="template-preview-box template-2">
                              <div className="template-preview-header"></div>
                              <div className="template-preview-content"></div>
                            </div>
                            <p>Template 2 Preview</p>
                          </div>
                        </div>
                        <p className="template-description">Two-column layout with purple sidebar. Perfect for highlighting skills and personal information.</p>
                      </div>

                      <div className="template-card" onClick={() => handleTemplateClick(3)}>
                        <div className="template-image-container">
                          <img 
                            src="/images/templates/Template3.jpg" 
                            alt="Template 3 - Gradient Design"
                            className="template-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="template-placeholder" style={{ display: 'none' }}>
                            <div className="template-preview-box template-3">
                              <div className="template-preview-gradient"></div>
                              <div className="template-preview-content"></div>
                            </div>
                            <p>Template 3 Preview</p>
                          </div>
                        </div>
                        <p className="template-description">Vibrant gradient design with orange accents. Great for creative professionals.</p>
                      </div>
                    </div>
                  </div>

                  {/* Features Section */}
                  <div className="features-section-modern">
                    <div className="features-graphics-left">
                      <div className="graphic-orb graphic-orb-1"></div>
                      <div className="graphic-orb graphic-orb-2"></div>
                      <div className="graphic-shape graphic-shape-1"></div>
                      <div className="graphic-line graphic-line-1"></div>
                      <div className="graphic-dot graphic-dot-1"></div>
                      <div className="graphic-dot graphic-dot-2"></div>
                      <div className="graphic-dot graphic-dot-3"></div>
                    </div>
                    <div className="features-graphics-right">
                      <div className="graphic-orb graphic-orb-3"></div>
                      <div className="graphic-shape graphic-shape-2"></div>
                      <div className="graphic-shape graphic-shape-3"></div>
                      <div className="graphic-line graphic-line-2"></div>
                      <div className="graphic-dot graphic-dot-4"></div>
                      <div className="graphic-dot graphic-dot-5"></div>
                      <div className="graphic-dot graphic-dot-6"></div>
                    </div>
                    <h2 className="section-title">Powerful Features</h2>
                    <div className="features-list">
                      <div className="feature-row feature-row-left">
                        <div className="feature-number">01</div>
                        <div className="feature-text">
                          <div className="feature-icon-inline">✨</div>
                          <h3 className="feature-title-inline">Easy to Use</h3>
                          <p className="feature-description-inline">Intuitive interface that makes CV creation simple and fast. No design skills required.</p>
                        </div>
                      </div>
                      <div className="feature-row feature-row-right">
                        <div className="feature-text">
                          <div className="feature-icon-inline">💾</div>
                          <h3 className="feature-title-inline">Auto-Save</h3>
                          <p className="feature-description-inline">Your CV is automatically saved as you work. Never lose your progress.</p>
                        </div>
                        <div className="feature-number">02</div>
                      </div>
                      <div className="feature-row feature-row-left">
                        <div className="feature-number">03</div>
                        <div className="feature-text">
                          <div className="feature-icon-inline">📥</div>
                          <h3 className="feature-title-inline">PDF Export</h3>
                          <p className="feature-description-inline">Download your CV as a high-quality PDF ready for printing or emailing.</p>
                        </div>
                      </div>
                      <div className="feature-row feature-row-right">
                        <div className="feature-text">
                          <div className="feature-icon-inline">🎨</div>
                          <h3 className="feature-title-inline">Multiple Templates</h3>
                          <p className="feature-description-inline">Choose from 3 professionally designed templates that suit your style.</p>
                        </div>
                        <div className="feature-number">04</div>
                      </div>
                      <div className="feature-row feature-row-left">
                        <div className="feature-number">05</div>
                        <div className="feature-text">
                          <div className="feature-icon-inline">📝</div>
                          <h3 className="feature-title-inline">Comprehensive Sections</h3>
                          <p className="feature-description-inline">Include education, experience, skills, languages, certifications, and more.</p>
                        </div>
                      </div>
                      <div className="feature-row feature-row-right">
                        <div className="feature-text">
                          <div className="feature-icon-inline">🔒</div>
                          <h3 className="feature-title-inline">Secure & Private</h3>
                          <p className="feature-description-inline">Your data is securely stored and only accessible by you.</p>
                        </div>
                        <div className="feature-number">06</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="cta-section">
                    <h2 className="cta-title">Ready to Create Your Professional CV?</h2>
                    <p className="cta-description">Join thousands of professionals who have created their CVs with our builder</p>
                    <button className="cta-button" onClick={() => handleGetStarted('cv-builder')}>
                      Get Started Now →
                    </button>
                  </div>
                </div>
              </div>

            {/* ID Card Print Detailed View - Always visible */}
            <div id="id-card-print-section" className="product-detail-view-inline">
              <div className="product-detail-header">
                <div className="product-detail-icon">🪪</div>
                <h1 className="product-detail-title">ID Card Printing Utility</h1>
                <p className="product-detail-subtitle">Print multiple ID cards with perfect alignment and professional quality</p>
              </div>
              <div className="product-detail-content">
                  {/* Screenshots Section - Natural Layout */}
                  <div className="screenshots-section">
                    <h2 className="section-title">See It In Action</h2>
                    <p className="section-description">Explore the powerful features of our ID Card Printing Utility</p>
                    
                    <div className="screenshots-grid">
                      <div className="screenshot-item">
                        <img 
                          src="/images/id-card-printing/screenshot-1.jpg" 
                          alt="ID Card Printing Interface"
                          className="screenshot-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="screenshot-placeholder" style={{ display: 'none' }}>
                          <p>Screenshot 1</p>
                        </div>
                      </div>

                      <div className="screenshot-item">
                        <img 
                          src="/images/id-card-printing/screenshot-2.jpg" 
                          alt="Card Design Interface"
                          className="screenshot-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="screenshot-placeholder" style={{ display: 'none' }}>
                          <p>Screenshot 2</p>
                        </div>
                      </div>

                      <div className="screenshot-item">
                        <img 
                          src="/images/id-card-printing/screenshot-3.jpg" 
                          alt="ID Card Cropping Tool"
                          className="screenshot-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="screenshot-placeholder" style={{ display: 'none' }}>
                          <p>Screenshot 3</p>
                        </div>
                      </div>

                      <div className="screenshot-item">
                        <img 
                          src="/images/id-card-printing/screenshot-4.jpg" 
                          alt="ID Card Processing"
                          className="screenshot-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="screenshot-placeholder" style={{ display: 'none' }}>
                          <p>Screenshot 4</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features Section - Modern Style */}
                  <div className="features-section-modern">
                    <div className="features-graphics-left">
                      <div className="graphic-orb graphic-orb-1"></div>
                      <div className="graphic-orb graphic-orb-2"></div>
                      <div className="graphic-shape graphic-shape-1"></div>
                      <div className="graphic-line graphic-line-1"></div>
                      <div className="graphic-dot graphic-dot-1"></div>
                      <div className="graphic-dot graphic-dot-2"></div>
                      <div className="graphic-dot graphic-dot-3"></div>
                    </div>
                    <div className="features-graphics-right">
                      <div className="graphic-orb graphic-orb-3"></div>
                      <div className="graphic-shape graphic-shape-2"></div>
                      <div className="graphic-shape graphic-shape-3"></div>
                      <div className="graphic-line graphic-line-2"></div>
                      <div className="graphic-dot graphic-dot-4"></div>
                      <div className="graphic-dot graphic-dot-5"></div>
                      <div className="graphic-dot graphic-dot-6"></div>
                    </div>
                    <h2 className="section-title">Powerful Features</h2>
                    <p className="section-description">Everything you need for professional ID card printing</p>
                    
                    <div className="features-list">
                      <div className="feature-row feature-row-left">
                        <div className="feature-number">01</div>
                        <div className="feature-text">
                          <div className="feature-icon-inline">🔄</div>
                          <h3 className="feature-title-inline">Front & Back Printing</h3>
                          <p className="feature-description-inline">Print both sides of ID cards with perfect alignment. Supports double-sided printing on A4 paper.</p>
                        </div>
                      </div>

                      <div className="feature-row feature-row-right">
                        <div className="feature-text">
                          <div className="feature-icon-inline">📄</div>
                          <h3 className="feature-title-inline">Multiple Cards Per Page</h3>
                          <p className="feature-description-inline">Print multiple ID cards at once on a single A4 page. Up to 8 cards per page in a 2x4 grid layout.</p>
                        </div>
                        <div className="feature-number">02</div>
                      </div>

                      <div className="feature-row feature-row-left">
                        <div className="feature-number">03</div>
                        <div className="feature-text">
                          <div className="feature-icon-inline">🔢</div>
                          <h3 className="feature-title-inline">Copy Count Control</h3>
                          <p className="feature-description-inline">Set the number of copies for each ID card design independently. Maximum 8 copies per design.</p>
                        </div>
                      </div>

                      <div className="feature-row feature-row-right">
                        <div className="feature-text">
                          <div className="feature-icon-inline">✨</div>
                          <h3 className="feature-title-inline">Image Enhancement Filters</h3>
                          <p className="feature-description-inline">Apply filters (Original, Auto, Gray) to enhance image clarity and quality for better printing results.</p>
                        </div>
                        <div className="feature-number">04</div>
                      </div>

                      <div className="feature-row feature-row-left">
                        <div className="feature-number">05</div>
                        <div className="feature-text">
                          <div className="feature-icon-inline">💡</div>
                          <h3 className="feature-title-inline">Brightness Adjustment</h3>
                          <p className="feature-description-inline">Fine-tune brightness levels with an intuitive slider to achieve optimal print quality.</p>
                        </div>
                      </div>

                      <div className="feature-row feature-row-right">
                        <div className="feature-text">
                          <div className="feature-icon-inline">✂️</div>
                          <h3 className="feature-title-inline">Rotate & Crop Tools</h3>
                          <p className="feature-description-inline">Rotate and crop ID card images with precision. Extract cards with rotation support for perfect alignment.</p>
                        </div>
                        <div className="feature-number">06</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="cta-section">
                    <h2 className="cta-title">Ready to Print Your ID Cards?</h2>
                    <p className="cta-description">Create and print professional ID cards with front and back support</p>
                    <button className="cta-button" onClick={() => handleGetStarted('id-card-print')}>
                      Get Started Now →
                    </button>
                  </div>
                </div>
              </div>

        {/* Login Form Modal Popup */}
        {showLogin && (
          <div className="login-modal-overlay" onClick={() => {
            setShowLogin(false);
            setError('');
            setLoginSuccess(false);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
          }}>
            <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="login-modal-close"
                onClick={() => {
                  setShowLogin(false);
                  setError('');
                  setLoginSuccess(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                aria-label="Close"
              >
                ×
              </button>
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

                {loginSuccess && (
                  <div className="login-success-message">
                    <div className="success-icon">✓</div>
                    <div className="success-text">
                      <h3>Login Successful!</h3>
                      <p>You are now logged in. Redirecting...</p>
                    </div>
                  </div>
                )}
                {error && !loginSuccess && (
                  <div className="error-message-inline">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="login-form-inline" style={{ display: loginSuccess ? 'none' : 'block' }}>
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

                  {error && !loginSuccess && <div className="error-message-inline">{error}</div>}

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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;

