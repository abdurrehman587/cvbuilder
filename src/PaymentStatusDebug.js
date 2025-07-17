import React, { useState, useEffect } from 'react';
import { CleanPaymentService } from './cleanPaymentService';
import supabase from './supabase';

const PaymentStatusDebug = ({ templateId }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [buttonText, setButtonText] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    
    getCurrentUser();
  }, []);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!userEmail || !templateId) return;

      try {
        console.log('PaymentStatusDebug - Checking payment status for:', { userEmail, templateId });
        
        // Check all payment statuses
        const approvedPayment = await CleanPaymentService.checkUserApprovedPayment(templateId);
        const pendingPayment = await CleanPaymentService.checkUserPendingPayment(templateId);
        const previousDownload = await CleanPaymentService.checkUserDownloadedPayment(templateId);
        const buttonTextResult = await CleanPaymentService.getUserButtonText(templateId);
        
        setPaymentStatus({
          approvedPayment: approvedPayment ? 'Found' : 'Not found',
          pendingPayment: pendingPayment ? 'Found' : 'Not found',
          previousDownload: previousDownload ? 'Found' : 'Not found',
          buttonText: buttonTextResult
        });
        
        setButtonText(buttonTextResult);
        setIsLoading(false);
        
        console.log('PaymentStatusDebug - Status:', {
          approvedPayment: approvedPayment ? 'Found' : 'Not found',
          pendingPayment: pendingPayment ? 'Found' : 'Not found',
          previousDownload: previousDownload ? 'Found' : 'Not found',
          buttonText: buttonTextResult
        });
        
      } catch (error) {
        console.error('PaymentStatusDebug - Error checking status:', error);
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [userEmail, templateId]);

  if (isLoading) {
    return <div>Loading payment status...</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #007bff', 
      borderRadius: '8px', 
      margin: '20px 0',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ color: '#007bff', marginTop: 0 }}>🔍 Payment Status Debug</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>User Email:</strong> {userEmail || 'Not signed in'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Template ID:</strong> {templateId}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Approved Payment:</strong> 
        <span style={{ 
          color: paymentStatus.approvedPayment === 'Found' ? '#28a745' : '#dc3545',
          fontWeight: 'bold'
        }}>
          {paymentStatus.approvedPayment}
        </span>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Pending Payment:</strong> 
        <span style={{ 
          color: paymentStatus.pendingPayment === 'Found' ? '#ffc107' : '#6c757d',
          fontWeight: 'bold'
        }}>
          {paymentStatus.pendingPayment}
        </span>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Previous Download:</strong> 
        <span style={{ 
          color: paymentStatus.previousDownload === 'Found' ? '#17a2b8' : '#6c757d',
          fontWeight: 'bold'
        }}>
          {paymentStatus.previousDownload}
        </span>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Button Text:</strong> 
        <span style={{ 
          color: '#007bff',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          "{paymentStatus.buttonText}"
        </span>
      </div>
      
      <div style={{ 
        padding: '10px', 
        backgroundColor: paymentStatus.approvedPayment === 'Found' ? '#d4edda' : '#f8d7da',
        border: `1px solid ${paymentStatus.approvedPayment === 'Found' ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px'
      }}>
        <strong>Status:</strong> {
          paymentStatus.approvedPayment === 'Found' 
            ? '✅ Payment Approved - You can download!' 
            : paymentStatus.pendingPayment === 'Found'
            ? '⏳ Payment Pending - Waiting for admin approval'
            : '❌ No approved payment - Payment required'
        }
      </div>
      
      {paymentStatus.approvedPayment === 'Found' && (
        <div style={{ 
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px'
        }}>
          <strong>🎉 Download Available!</strong><br/>
          Look for the download button below this debug panel. 
          It should show "{paymentStatus.buttonText}" and be clickable.
        </div>
      )}
    </div>
  );
};

export default PaymentStatusDebug; 