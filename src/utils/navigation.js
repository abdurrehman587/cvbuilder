/**
 * Navigation utility - provides clean URL navigation
 * This should be used instead of window.location.href or window.location.hash
 */

let navigateFunction = null;

/**
 * Set the navigate function from React Router
 * Call this in App.js after getting useNavigate hook
 */
export const setNavigate = (navigate) => {
  navigateFunction = navigate;
};

/**
 * Navigate to a route using clean URLs
 */
export const navigateTo = (path, options = {}) => {
  if (navigateFunction) {
    navigateFunction(path, options);
  } else {
    // Fallback to window.location for backward compatibility
    if (path.startsWith('/')) {
      window.location.href = path;
    } else {
      window.location.hash = `#${path}`;
    }
  }
};

/**
 * Navigate to home
 */
export const navigateToHome = () => navigateTo('/');

/**
 * Navigate to CV Builder
 */
export const navigateToCVBuilder = () => navigateTo('/cv-builder');

/**
 * Navigate to Marketplace
 */
export const navigateToMarketplace = () => navigateTo('/marketplace');

/**
 * Navigate to ID Card Print
 */
export const navigateToIDCardPrint = () => navigateTo('/id-card-print');

/**
 * Navigate to Product Detail
 */
export const navigateToProduct = (productId) => navigateTo(`/product/${productId}`);

/**
 * Navigate to Cart
 */
export const navigateToCart = () => navigateTo('/cart');

/**
 * Navigate to Checkout
 */
export const navigateToCheckout = () => navigateTo('/checkout');

/**
 * Navigate to Orders
 */
export const navigateToOrders = () => navigateTo('/orders');

/**
 * Navigate to Order Detail
 */
export const navigateToOrder = (orderId) => navigateTo(`/order/${orderId}`);

/**
 * Navigate to Admin
 */
export const navigateToAdmin = () => navigateTo('/admin');

/**
 * Navigate to Admin Marketplace
 */
export const navigateToAdminMarketplace = () => navigateTo('/admin/marketplace');

/**
 * Navigate to Resume Templates
 */
export const navigateToResumeTemplates = () => navigateTo('/resume-templates');

