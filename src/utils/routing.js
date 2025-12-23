/**
 * Fresh, simplified routing system
 * Single source of truth: localStorage.getItem('selectedApp')
 * No state updates during render - only reads from localStorage
 */

/**
 * Get the current app section from localStorage
 * Returns: 'marketplace', 'cv-builder', or 'id-card-print'
 * CRITICAL: Default to 'cv-builder' NOT 'marketplace' to prevent homepage redirects
 */
export const getCurrentApp = () => {
  return localStorage.getItem('selectedApp') || 'cv-builder';
};

/**
 * Set the current app section in localStorage
 * This is the ONLY place where selectedApp should be written
 */
export const setCurrentApp = (app) => {
  if (app && ['marketplace', 'cv-builder', 'id-card-print'].includes(app)) {
    localStorage.setItem('selectedApp', app);
  }
};

/**
 * Get the current view for CV Builder
 * Returns: 'dashboard', 'cv-builder' (form view), or 'preview' (preview page)
 */
export const getCVView = () => {
  return localStorage.getItem('cvView') || 'dashboard';
};

/**
 * Set the current view for CV Builder
 */
export const setCVView = (view) => {
  if (view && ['dashboard', 'cv-builder', 'preview'].includes(view)) {
    localStorage.setItem('cvView', view);
  }
};

/**
 * Get the current view for ID Card
 * Returns: 'dashboard' or 'print'
 */
export const getIDCardView = () => {
  return localStorage.getItem('idCardView') || 'dashboard';
};

/**
 * Set the current view for ID Card
 */
export const setIDCardView = (view) => {
  if (view && ['dashboard', 'print'].includes(view)) {
    localStorage.setItem('idCardView', view);
  }
};

/**
 * Determine what page to show based on current state
 * This is a pure function - no side effects, only reads from localStorage
 */
export const getRoute = () => {
  const app = getCurrentApp();
  const cvView = getCVView();
  const idCardView = getIDCardView();
  
  return {
    app, // 'marketplace', 'cv-builder', or 'id-card-print'
    cvView, // 'dashboard' or 'cv-builder'
    idCardView, // 'dashboard' or 'print'
  };
};

