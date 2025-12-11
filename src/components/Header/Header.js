import React, { useState, useEffect } from 'react';
import './Header.css';
import { authService, supabase } from '../Supabase/supabase';
import { getCartItemCount } from '../../utils/cart';
import OrderNotification from '../OrderNotification/OrderNotification';

const Header = ({ isAuthenticated, onLogout, currentProduct, onProductSelect, showProductsOnHeader = false }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnAdminPage, setIsOnAdminPage] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if PWA is already installed and handle install button visibility
  useEffect(() => {
    const checkInstallState = () => {
      // Check if running as installed PWA
      const installed = window.isPWA ? window.isPWA() : false;
      setIsInstalled(installed);
      
      // Check if should show install button
      const shouldShow = window.shouldShowInstall ? window.shouldShowInstall() : false;
      setShowInstallButton(shouldShow && !installed);
    };
    
    checkInstallState();
    
    // Listen for install availability
    const handleInstallAvailable = () => {
      checkInstallState();
    };
    
    // Listen for successful installation
    const handleInstalled = () => {
      setShowInstallButton(false);
      setIsInstalled(true);
    };
    
    window.addEventListener('pwaInstallAvailable', handleInstallAvailable);
    window.addEventListener('pwaInstalled', handleInstalled);
    
    return () => {
      window.removeEventListener('pwaInstallAvailable', handleInstallAvailable);
      window.removeEventListener('pwaInstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (window.installPWA) {
      const installed = await window.installPWA();
      if (installed) {
        setShowInstallButton(false);
        setIsInstalled(true);
      }
    }
  };

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated) {
        setIsAdmin(false);
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('email', user.email)
          .single();

        if (error) throw error;
        setIsAdmin(data?.is_admin || false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated]);

  // Check if we're on the admin panel page
  useEffect(() => {
    const checkAdminPage = () => {
      const currentHash = window.location.hash;
      const onAdminPage = currentHash === '#admin';
      setIsOnAdminPage(onAdminPage);
    };

    // Check on mount
    checkAdminPage();

    // Listen for hash changes
    window.addEventListener('hashchange', checkAdminPage);
    
    // Also listen for popstate (back/forward navigation)
    window.addEventListener('popstate', checkAdminPage);

    return () => {
      window.removeEventListener('hashchange', checkAdminPage);
      window.removeEventListener('popstate', checkAdminPage);
    };
  }, []);

  // Load and update cart item count
  useEffect(() => {
    const updateCartCount = () => {
      setCartItemCount(getCartItemCount());
    };

    // Load initial count
    updateCartCount();

    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);
  const handleLogout = async () => {
    try {
      await authService.signOut();
      localStorage.removeItem('cvBuilderAuth');
      localStorage.removeItem('selectedApp');
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('cvBuilderAuth');
      localStorage.removeItem('selectedApp');
      window.location.href = '/';
    }
  };

  const goToProducts = () => {
    // Navigate to products page without logging out
    // Always preserve authentication state first
    const wasAuthenticated = isAuthenticated || localStorage.getItem('cvBuilderAuth') === 'true';
    
    if (wasAuthenticated) {
      // Preserve authentication state
      localStorage.setItem('cvBuilderAuth', 'true');
    }
    
    // Set flag to show products page
    localStorage.setItem('selectedApp', 'marketplace');
    localStorage.setItem('showProductsPage', 'true');
    sessionStorage.setItem('showProductsPage', 'true');
    
    // Use hash-based navigation instead of page reload to preserve session
    if (window.location.hash !== '#products') {
      window.location.hash = '#products';
      window.dispatchEvent(new CustomEvent('navigateToMarketplace'));
    }
  };

  const handleSignIn = () => {
    // If on products page and login form function is available, show login form popup
    if (showProductsOnHeader && window.showLoginForm) {
      window.showLoginForm();
    } else {
      // If not on products page, navigate to products page with login form
      localStorage.setItem('showProductsPage', 'true');
      sessionStorage.setItem('showProductsPage', 'true');
      window.location.href = '/#products';
    }
  };

  const navigateToCVBuilder = () => {
    if (!isAuthenticated) {
      // User is not signed in: Show login form
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      localStorage.setItem('selectedApp', 'cv-builder');
      if (showProductsOnHeader && window.showLoginForm) {
        window.showLoginForm();
      } else {
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        window.location.hash = '#products';
      }
    } else {
      // User is signed in: Navigate directly to CV Builder dashboard
      // Set navigation flags to prevent logout
      sessionStorage.setItem('isNavigating', 'true');
      sessionStorage.setItem('navigationTimestamp', Date.now().toString());
      localStorage.setItem('selectedApp', 'cv-builder');
      sessionStorage.setItem('navigateToCVBuilder', 'true');
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      if (window.resetProductsPageFlag) {
        window.resetProductsPageFlag();
      }
      // Use hash-based navigation instead of page reload
      window.location.hash = '';
      window.dispatchEvent(new CustomEvent('navigateToCVBuilder'));
    }
  };

  const navigateToIDCardDashboard = () => {
    if (!isAuthenticated) {
      // User is not signed in: Show login form
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      localStorage.setItem('selectedApp', 'id-card-print');
      if (showProductsOnHeader && window.showLoginForm) {
        window.showLoginForm();
      } else {
        localStorage.setItem('showProductsPage', 'true');
        sessionStorage.setItem('showProductsPage', 'true');
        window.location.hash = '#products';
      }
    } else {
      // User is signed in: Navigate directly to ID Card Dashboard
      // Set navigation flags to prevent logout
      sessionStorage.setItem('isNavigating', 'true');
      sessionStorage.setItem('navigationTimestamp', Date.now().toString());
      localStorage.setItem('selectedApp', 'id-card-print');
      sessionStorage.setItem('navigateToIDCardPrint', 'true');
      // Reset idCardView to dashboard
      if (window.setIdCardView) {
        window.setIdCardView('dashboard');
      }
      localStorage.removeItem('showProductsPage');
      sessionStorage.removeItem('showProductsPage');
      if (window.resetProductsPageFlag) {
        window.resetProductsPageFlag();
      }
      // Use hash-based navigation instead of page reload
      window.location.hash = '';
      window.dispatchEvent(new CustomEvent('navigateToIDCardPrinter'));
    }
  };

  // Handle navigation to sections on products page
  const scrollToSection = (sectionId) => {
    setTimeout(() => {
    const element = document.getElementById(sectionId);
    if (element) {
        // Find the scrollable products-page container
        const productsPage = document.querySelector('.products-page');
        if (productsPage) {
          // Get the header height for offset calculation
          const header = document.querySelector('.app-header');
          const headerOffset = 20; // Extra spacing from top of container
          
          // Get current scroll position of the container
          const currentScrollTop = productsPage.scrollTop;
          
          // Get bounding rectangles
          const containerRect = productsPage.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          
          // Calculate element's position relative to the container's scrollable content
          // elementRect.top is relative to viewport
          // containerRect.top is container's top relative to viewport
          // We need: element position in container's content = current scroll + (element top - container top)
          const elementTopInContainer = currentScrollTop + (elementRect.top - containerRect.top);
          
          // Calculate final scroll position with header offset
          const offsetPosition = elementTopInContainer - headerOffset;
          
          // Scroll the products-page container
          productsPage.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        } else {
          // Fallback: if products-page not found, try window scroll (for compatibility)
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + (window.pageYOffset || window.scrollY || 0) - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
      } else {
        console.warn(`Section with id "${sectionId}" not found. Please ensure you are on the products page.`);
      }
    }, 100);
  };



  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <div className="header-left">
            <img 
              src="/images/glory-logo.png" 
              alt="Glory Logo" 
              className="glory-logo"
              onClick={goToProducts}
              onError={(e) => {
                // Fallback if logo doesn't exist - hide it
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="header-center">
            {/* Navigation buttons removed */}
          </div>

          <div className="header-right">
            {/* Install App Button */}
            {showInstallButton && !isInstalled && (
              <button
                onClick={handleInstallClick}
                className="install-btn-header"
                title="Install Get Glory App"
              >
                Install App
              </button>
            )}
            
            {/* Cart Button - Show on products page */}
            {showProductsOnHeader && (
              <button
                onClick={() => window.location.href = '/#cart'}
                className="cart-btn-header"
                title="View Cart"
              >
Cart
                {cartItemCount > 0 && (
                  <span className="cart-badge">{cartItemCount}</span>
                )}
              </button>
            )}
            {isAuthenticated && isAdmin && window.location.hash !== '#admin' && (
              <button 
                type="button"
                onClick={() => {
                  // Clear any products page flags
                  localStorage.removeItem('showProductsPage');
                  sessionStorage.removeItem('showProductsPage');
                  // Clear any other navigation flags
                  localStorage.removeItem('selectedApp');
                  sessionStorage.removeItem('navigateToCVBuilder');
                  sessionStorage.removeItem('navigateToIDCardPrint');
                  // Navigate to admin panel
                  window.location.href = '/#admin';
                }}
                className="admin-btn-header"
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </header>
      {/* Order Notification - Always visible for admins */}
      <OrderNotification isAdmin={isAdmin} isAuthenticated={isAuthenticated} />
    </>
  );
};

export default Header;

