import React, { useState, useEffect } from 'react';
import { CleanPaymentService } from './cleanPaymentService';
import { debugPaymentStatus } from './debugPaymentStatus';

const LoadingTest = ({ templateId = 'template1' }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [buttonText, setButtonText] = useState('Initializing...');
  const [debugInfo, setDebugInfo] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState([]);

  const addLoadingStep = (step) => {
    setLoadingSteps(prev => [...prev, `${new Date().toLocaleTimeString()}: ${step}`]);
  };

  // Get current user email
  useEffect(() => {
    addLoadingStep('Getting current user...');
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await import('./supabase').then(m => m.default.auth.getUser());
        if (user?.email) {
          setUserEmail(user.email);
          addLoadingStep(`User email found: ${user.email}`);
        } else {
          addLoadingStep('No user email found');
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        addLoadingStep(`Error getting user: ${error.message}`);
      }
    };
    
    getCurrentUser();
  }, []);

  // Test button text loading
  useEffect(() => {
    if (!userEmail) return;

    addLoadingStep('Testing button text loading...');
    const testButtonText = async () => {
      try {
        const text = await CleanPaymentService.getUserButtonText(templateId);
        setButtonText(text);
        addLoadingStep(`Button text loaded: ${text}`);
      } catch (error) {
        console.error('Error loading button text:', error);
        setButtonText('Error loading button text');
        addLoadingStep(`Error loading button text: ${error.message}`);
      }
    };

    testButtonText();
  }, [userEmail, templateId]);

  // Run debug test
  const runDebugTest = async () => {
    addLoadingStep('Running debug test...');
    try {
      const result = await debugPaymentStatus(templateId);
      setDebugInfo(result);
      addLoadingStep('Debug test completed');
    } catch (error) {
      console.error('Debug test error:', error);
      addLoadingStep(`Debug test error: ${error.message}`);
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #dc3545',
      borderRadius: '8px',
      margin: '20px 0',
      backgroundColor: '#fff5f5'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#dc3545' }}>
        🔴 Loading Test Component
      </h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Template:</strong> {templateId}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>User Email:</strong> {userEmail || 'Loading...'}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Button Text:</strong> 
        <span style={{ 
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          marginLeft: '10px',
          fontSize: '14px'
        }}>
          {buttonText}
        </span>
      </div>
      
      <button 
        onClick={runDebugTest}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '15px'
        }}
      >
        Run Debug Test
      </button>
      
      {debugInfo && (
        <div style={{ 
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <h4>Debug Results:</h4>
          <div><strong>User:</strong> {debugInfo.user}</div>
          <div><strong>Expected Button Text:</strong> {debugInfo.expectedButtonText}</div>
          <div><strong>Approved Payments:</strong> {debugInfo.approvedCount}</div>
          <div><strong>Pending Payments:</strong> {debugInfo.pendingCount}</div>
          <div><strong>Downloads:</strong> {debugInfo.downloadCount}</div>
          {debugInfo.debugInfo && (
            <div style={{ marginTop: '10px' }}>
              <strong>Debug Info:</strong>
              <ul style={{ margin: '5px 0 0 20px' }}>
                <li>User Email Available: {debugInfo.debugInfo.userEmailAvailable ? 'Yes' : 'No'}</li>
                <li>Template ID Available: {debugInfo.debugInfo.templateIdAvailable ? 'Yes' : 'No'}</li>
                <li>Payments Found: {debugInfo.debugInfo.paymentsFound}</li>
                <li>Downloads Found: {debugInfo.debugInfo.downloadsFound}</li>
                <li>Is Admin: {debugInfo.debugInfo.isAdmin ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div style={{ 
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        fontSize: '12px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <strong>Loading Steps:</strong>
        {loadingSteps.map((step, index) => (
          <div key={index} style={{ margin: '2px 0' }}>{step}</div>
        ))}
      </div>
    </div>
  );
};

export default LoadingTest; 