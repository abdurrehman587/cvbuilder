import React, { useState, useEffect } from 'react';
import supabase from './supabase';
import { CleanPaymentService } from './cleanPaymentService';

const PaymentDebugTool = ({ templateId }) => {
  const [userEmail, setUserEmail] = useState('');
  const [paymentStatus, setPaymentStatus] = useState({});
  const [allPayments, setAllPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        checkPaymentStatus(user.email);
      }
    };
    getUser();
  }, [templateId]);

  const checkPaymentStatus = async (email) => {
    if (!email || !templateId) return;

    try {
      setIsLoading(true);
      console.log('PaymentDebugTool - Checking status for:', { email, templateId });

      // Get all payments for this user and template
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', email)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return;
      }

      setAllPayments(payments || []);

      // Check specific statuses
      const approvedPayment = await CleanPaymentService.checkUserApprovedPayment(templateId);
      const pendingPayment = await CleanPaymentService.checkUserPendingPayment(templateId);
      const previousDownload = await CleanPaymentService.checkUserDownloadedPayment(templateId);
      const buttonText = await CleanPaymentService.getUserButtonText(templateId);

      setPaymentStatus({
        approvedPayment: approvedPayment ? 'Found' : 'Not found',
        pendingPayment: pendingPayment ? 'Found' : 'Not found',
        previousDownload: previousDownload ? 'Found' : 'Not found',
        buttonText: buttonText,
        totalPayments: payments?.length || 0
      });

      console.log('PaymentDebugTool - Status:', {
        approvedPayment: approvedPayment ? 'Found' : 'Not found',
        pendingPayment: pendingPayment ? 'Found' : 'Not found',
        previousDownload: previousDownload ? 'Found' : 'Not found',
        buttonText: buttonText,
        totalPayments: payments?.length || 0
      });

    } catch (error) {
      console.error('PaymentDebugTool - Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefresh = () => {
    checkPaymentStatus(userEmail);
  };

  const approveLatestPayment = async () => {
    if (allPayments.length === 0) {
      alert('No payments found to approve');
      return;
    }

    const latestPayment = allPayments[0];
    if (latestPayment.status === 'approved') {
      alert('Latest payment is already approved');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', latestPayment.id)
        .select()
        .single();

      if (error) {
        alert('Error approving payment: ' + error.message);
      } else {
        alert('Payment approved! Check the button status now.');
        checkPaymentStatus(userEmail);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (isLoading) {
    return <div>Loading payment debug info...</div>;
  }

  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      margin: '10px 0',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>🔧 Payment Debug Tool</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>User:</strong> {userEmail}<br/>
        <strong>Template:</strong> {templateId}<br/>
        <strong>Total Payments:</strong> {paymentStatus.totalPayments || 0}
      </div>

      <div style={{ 
        padding: '10px', 
        backgroundColor: '#e9ecef',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        marginBottom: '10px'
      }}>
        <strong>Current Status:</strong><br/>
        ✅ Approved Payment: {paymentStatus.approvedPayment}<br/>
        ⏳ Pending Payment: {paymentStatus.pendingPayment}<br/>
        📥 Previous Download: {paymentStatus.previousDownload}<br/>
        🔘 Button Text: "{paymentStatus.buttonText}"
      </div>

      {allPayments.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>All Payments:</strong>
          {allPayments.map((payment, index) => (
            <div key={payment.id} style={{
              padding: '8px',
              backgroundColor: payment.status === 'approved' ? '#d4edda' : 
                              payment.status === 'pending' ? '#fff3cd' : '#f8d7da',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              marginTop: '5px',
              fontSize: '11px'
            }}>
              <strong>Payment {index + 1}:</strong><br/>
              ID: {payment.id}<br/>
              Status: {payment.status}<br/>
              Used: {payment.is_used ? 'Yes' : 'No'}<br/>
              Amount: PKR {payment.amount}<br/>
              Created: {new Date(payment.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={forceRefresh}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🔄 Refresh Status
        </button>

        {allPayments.length > 0 && allPayments[0].status === 'pending' && (
          <button
            onClick={approveLatestPayment}
            style={{
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            ✅ Approve Latest Payment
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🔄 Reload Page
        </button>
      </div>
    </div>
  );
};

export default PaymentDebugTool; 