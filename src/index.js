import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Force cache refresh
console.log('App version: 1.0.1 - Cache busted at:', new Date().toISOString());
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'SET' : 'NOT SET',
  REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
});

// Simple fallback component
const FallbackApp = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f6fa',
    padding: '20px',
    textAlign: 'center'
  }}>
    <div>
      <h1>CV Builder</h1>
      <p>Loading application...</p>
      <p>If this page doesn't load, please check your internet connection and try again.</p>
    </div>
  </div>
);

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <FallbackApp />
    </React.StrictMode>
  );
}

// Performance monitoring removed - reportWebVitals was deleted
