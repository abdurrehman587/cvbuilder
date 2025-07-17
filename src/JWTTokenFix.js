import supabase from './supabase';

/**
 * Utility to fix JWT token expiration issues
 */
export const fixJWTTokenIssue = async () => {
  try {
    console.log('Attempting to fix JWT token issue...');
    
    // Clear all local storage items related to authentication
    const itemsToRemove = [
      'sb-poqarsztryrdlliwjhgx-auth-token',
      'supabase.auth.token',
      'user',
      'admin_user',
      'admin_cv_access'
    ];
    
    itemsToRemove.forEach(item => {
      if (localStorage.getItem(item)) {
        console.log(`Removing ${item} from localStorage`);
        localStorage.removeItem(item);
      }
    });
    
    // Sign out from Supabase to clear any cached tokens
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      console.log('Successfully signed out from Supabase');
    }
    
    // Clear session storage as well
    sessionStorage.clear();
    
    console.log('JWT token fix completed. Please refresh the page and sign in again.');
    
    // Reload the page to ensure clean state
    window.location.reload();
    
  } catch (error) {
    console.error('Error fixing JWT token issue:', error);
  }
};

/**
 * Check if JWT token is expired
 */
export const isJWTExpired = () => {
  try {
    const token = localStorage.getItem('sb-poqarsztryrdlliwjhgx-auth-token');
    if (!token) return true;
    
    const tokenData = JSON.parse(token);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (tokenData.expires_at && tokenData.expires_at < currentTime) {
      console.log('JWT token is expired');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking JWT expiration:', error);
    return true;
  }
};

/**
 * Auto-fix JWT issues on app startup
 */
export const initializeJWTFix = () => {
  if (isJWTExpired()) {
    console.log('JWT token is expired, attempting to fix...');
    fixJWTTokenIssue();
  }
}; 