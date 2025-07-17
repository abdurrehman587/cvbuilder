import React, { useState, useEffect } from 'react';
import { CleanPaymentService } from './cleanPaymentService';
import { toast } from 'react-toastify';

const RealTimePaymentDemo = ({ templateId = 'template1' }) => {
  const [buttonText, setButtonText] = useState('Loading...');
  const [userEmail, setUserEmail] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Get current user email
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await import('./supabase').then(m => m.default.auth.getUser());
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    
    getCurrentUser();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!userEmail || !templateId) return;

    console.log('RealTimePaymentDemo - Setting up subscription for:', { userEmail, templateId });
    
    const handlePaymentUpdate = async (payload) => {
      console.log('RealTimePaymentDemo - Real-time update received:', payload);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Update button text immediately
      try {
        const newButtonText = await CleanPaymentService.getUserButtonText(templateId);
        setButtonText(newButtonText);
        
        // Show notification
        if (payload.table === 'payments' && payload.eventType === 'UPDATE') {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          
          if (oldStatus === 'pending' && newStatus === 'approved') {
            toast.success('🎉 Payment approved in real-time! Button updated immediately.');
          }
        }
      } catch (error) {
        console.error('Error updating button text:', error);
      }
    };

    // Subscribe to real-time updates
    const subscription = CleanPaymentService.subscribeToPaymentUpdates(
      userEmail, 
      templateId, 
      handlePaymentUpdate
    );

    setIsSubscribed(true);

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        CleanPaymentService.unsubscribeFromPaymentUpdates(userEmail, templateId);
        setIsSubscribed(false);
      }
    };
  }, [userEmail, templateId]);

  // Initial button text load
  useEffect(() => {
    const loadButtonText = async () => {
      try {
        if (!userEmail) {
          setButtonText('No user email');
          return;
        }
        
        const text = await CleanPaymentService.getUserButtonText(templateId);
        setButtonText(text);
        console.log('RealTimePaymentDemo - Initial button text loaded:', text);
      } catch (error) {
        console.error('Error loading button text:', error);
        setButtonText('Error loading status');
      }
    };

    // Load button text immediately when user email is available
    if (userEmail) {
      loadButtonText();
    } else {
      // Set a fallback if no user email after a delay
      const timer = setTimeout(() => {
        if (!userEmail) {
          setButtonText('No user email available');
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [userEmail, templateId]);

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #007bff',
      borderRadius: '8px',
      margin: '20px 0',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>
        🔴 Real-Time Payment Demo
      </h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Template:</strong> {templateId}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>User:</strong> {userEmail || 'Loading...'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Subscription Status:</strong> 
        <span style={{ 
          color: isSubscribed ? '#28a745' : '#dc3545',
          marginLeft: '5px'
        }}>
          {isSubscribed ? '✅ Active' : '❌ Inactive'}
        </span>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Current Button Text:</strong> 
        <span style={{ 
          backgroundColor: '#007bff',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          marginLeft: '10px',
          fontSize: '14px'
        }}>
          {buttonText}
        </span>
      </div>
      
      {lastUpdate && (
        <div style={{ 
          fontSize: '12px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          Last real-time update: {lastUpdate}
        </div>
      )}
      
      <div style={{ 
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>How it works:</strong>
        <ul style={{ margin: '5px 0 0 20px' }}>
          <li>This component subscribes to real-time payment updates</li>
          <li>When admin approves/rejects a payment, button text updates immediately</li>
          <li>No page refresh needed - updates happen in real-time</li>
          <li>Toast notifications appear for status changes</li>
        </ul>
      </div>
    </div>
  );
};

export default RealTimePaymentDemo; 