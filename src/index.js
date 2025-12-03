import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New Service Worker found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              console.log('📦 New content available! Please refresh.');
              
              // Optional: Show a toast/notification to the user
              if (window.showUpdateNotification) {
                window.showUpdateNotification();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// PWA Install Prompt Handler
let deferredPrompt = null;

// Check if app is already installed
const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

// Check if install was dismissed recently (within 7 days)
const wasInstallDismissed = () => {
  const dismissedTime = localStorage.getItem('pwaInstallDismissed');
  if (!dismissedTime) return false;
  const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
  return daysSinceDismissed < 7; // Show again after 7 days
};

// Mark install as dismissed
const markInstallDismissed = () => {
  localStorage.setItem('pwaInstallDismissed', Date.now().toString());
};

// Clear dismissed state (for testing)
window.resetInstallPrompt = () => {
  localStorage.removeItem('pwaInstallDismissed');
  localStorage.removeItem('pwaInstalled');
  console.log('Install prompt state reset. Reload the page.');
};

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  console.log('📱 PWA install prompt available');
  
  // Store in window for access from components
  window.deferredPrompt = deferredPrompt;
  
  // Dispatch custom event so UI components can show install button
  window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
});

// Function to trigger install prompt (can be called from any component)
window.installPWA = async () => {
  // If native prompt is available, use it
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
    
    if (outcome === 'dismissed') {
      markInstallDismissed();
    }
    
    // Clear the deferredPrompt
    deferredPrompt = null;
    window.deferredPrompt = null;
    
    return outcome === 'accepted';
  }
  
  // If no native prompt, show manual instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS) {
    alert('To install this app on iOS:\n\n1. Tap the Share button (📤) at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm');
  } else if (isAndroid) {
    alert('To install this app:\n\n1. Tap the menu (⋮) in your browser\n2. Tap "Add to Home Screen" or "Install App"\n3. Tap "Add" to confirm');
  } else {
    alert('To install this app:\n\n1. Click the install icon (⊕) in your browser\'s address bar\n2. Or use your browser\'s menu to find "Install" option');
  }
  
  return false;
};

// Listen for successful install
window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA was installed successfully!');
  localStorage.setItem('pwaInstalled', 'true');
  deferredPrompt = null;
  window.deferredPrompt = null;
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('pwaInstalled'));
});

// Check if running as installed PWA
window.isPWA = isAppInstalled;

// Check if should show install button
window.shouldShowInstall = () => {
  // Don't show if already installed
  if (isAppInstalled()) return false;
  // Don't show if marked as installed
  if (localStorage.getItem('pwaInstalled') === 'true') return false;
  // Don't show if dismissed recently
  if (wasInstallDismissed()) return false;
  return true;
};

// Dispatch initial state on load
window.addEventListener('load', () => {
  if (window.shouldShowInstall()) {
    // Small delay to ensure everything is ready
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
    }, 1000);
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
