import { Capacitor } from '@capacitor/core';

// Register FileDownload plugin once - shared across all templates
// This prevents "plugin already registered" errors
let FileDownload = null;
let registrationAttempted = false;

// Use a module-level flag to prevent multiple registrations
const PLUGIN_NAME = 'FileDownload';

// Initialize plugin only once - use a singleton pattern
if (typeof window !== 'undefined') {
  // First, always try to get existing plugin (safest approach)
  try {
    FileDownload = Capacitor.getPlugin(PLUGIN_NAME);
  } catch (e) {
    // getPlugin might throw, but that's okay - we'll try registration
  }
  
  // Only attempt registration once, even if getPlugin failed
  if (!FileDownload && !registrationAttempted) {
    registrationAttempted = true; // Set flag immediately to prevent multiple attempts
    
    try {
      // Use require to avoid static import issues
      const { registerPlugin } = require('@capacitor/core');
      FileDownload = registerPlugin(PLUGIN_NAME);
    } catch (registerError) {
      // Registration failed - likely already registered by another module
      // Silently handle this - it's expected when multiple modules import this utility
      try {
        // Try to get it after registration attempt
        FileDownload = Capacitor.getPlugin(PLUGIN_NAME);
      } catch (e) {
        // If that also fails, try window access
        if (window.Capacitor?.Plugins?.[PLUGIN_NAME]) {
          FileDownload = window.Capacitor.Plugins[PLUGIN_NAME];
        }
        // If all else fails, FileDownload will be null (which is fine for web)
      }
    }
  } else if (!FileDownload && registrationAttempted) {
    // Registration was already attempted, just try to get the plugin
    try {
      FileDownload = Capacitor.getPlugin(PLUGIN_NAME);
    } catch (e) {
      if (window.Capacitor?.Plugins?.[PLUGIN_NAME]) {
        FileDownload = window.Capacitor.Plugins[PLUGIN_NAME];
      }
    }
  }
}

// Export null if plugin is not available (for web environments)
export default FileDownload;
