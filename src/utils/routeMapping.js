/**
 * Route mapping utility - maps clean URLs to internal routing system
 * This bridges React Router clean URLs with the existing localStorage-based routing
 */

/**
 * Map clean URL path to internal app route
 */
export const pathToApp = (pathname) => {
  if (!pathname || pathname === '/') return null;
  
  // CV Builder routes
  if (pathname.startsWith('/cv-builder') || pathname.startsWith('/resume-templates')) {
    return 'cv-builder';
  }
  
  // Marketplace routes
  if (pathname.startsWith('/marketplace') || pathname.startsWith('/product/')) {
    return 'marketplace';
  }
  
  // ID Card routes
  if (pathname.startsWith('/id-card-print')) {
    return 'id-card-print';
  }
  
  // Admin routes
  if (pathname.startsWith('/admin')) {
    return 'admin';
  }
  
  return null;
};

/**
 * Map clean URL path to CV view
 */
export const pathToCVView = (pathname) => {
  if (pathname === '/cv-builder' || pathname.startsWith('/resume-templates')) {
    return 'dashboard';
  }
  // If pathname has more specific routes, could map to 'cv-builder' or 'preview'
  return 'dashboard';
};

/**
 * Get product ID from URL
 */
export const getProductIdFromPath = (pathname) => {
  const match = pathname.match(/^\/product\/(.+)$/);
  return match ? match[1] : null;
};

/**
 * Get order ID from URL
 */
export const getOrderIdFromPath = (pathname) => {
  const match = pathname.match(/^\/order\/(.+)$/);
  return match ? match[1] : null;
};

/**
 * Navigate using clean URLs
 */
export const navigateToRoute = (navigate, route, options = {}) => {
  const routes = {
    'home': '/',
    'cv-builder': '/cv-builder',
    'marketplace': '/marketplace',
    'id-card-print': '/id-card-print',
    'cart': '/cart',
    'checkout': '/checkout',
    'orders': '/orders',
    'admin': '/admin',
    'admin-marketplace': '/admin/marketplace',
  };
  
  const path = routes[route] || '/';
  navigate(path, options);
};

/**
 * Navigate to product detail
 */
export const navigateToProduct = (navigate, productId) => {
  navigate(`/product/${productId}`);
};

/**
 * Navigate to order detail
 */
export const navigateToOrder = (navigate, orderId) => {
  navigate(`/order/${orderId}`);
};

