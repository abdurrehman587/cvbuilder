import React, { useState, useEffect } from 'react';
import { CleanPaymentService } from './cleanPaymentService';
import supabase from './supabase';

const ManualPaymentStatusCheck = ({ templateId }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

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
    const checkPayments = async () => {
      if (!userEmail || !templateId) return;

      try {
        console.log('ManualPaymentStatusCheck - Checking payments for:', { userEmail, templateId });
        
        // Get all payments for this user and template
        const { data: payments, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_email', userEmail)
          .eq('template_id', templateId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching payments:', error);
          setMessage('Error fetching payments: ' + error.message);
        } else {
          console.log('ManualPaymentStatusCheck - Payments found:', payments);
          setPayments(payments || []);
          
          if (payments && payments.length > 0) {
            const approvedPayments = payments.filter(p => p.status === 'approved');
            const pendingPayments = payments.filter(p => p.status === 'pending');
            
            if (approvedPayments.length > 0) {
              setMessage(`✅ Found ${approvedPayments.length} approved payment(s). You should be able to download.`);
            } else if (pendingPayments.length > 0) {
              setMessage(`⏳ Found ${pendingPayments.length} pending payment(s). Waiting for admin approval.`);
            } else {
              setMessage(`❌ Found ${payments.length} payment(s) but none are approved.`);
            }
          } else {
            setMessage('❌ No payments found for this template.');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking payments:', error);
        setMessage('Error checking payments: ' + error.message);
        setIsLoading(false);
      }
    };

    checkPayments();
  }, [userEmail, templateId]);

  const forceApprovePayment = async (paymentId) => {
    try {
      console.log('Force approving payment:', paymentId);
      
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        console.error('Error force approving payment:', error);
        setMessage('Error force approving payment: ' + error.message);
      } else {
        console.log('Payment force approved:', data);
        setMessage('✅ Payment force approved! Refresh the page to see the download button.');
        
        // Refresh the payments list
        const { data: updatedPayments } = await supabase
          .from('payments')
          .select('*')
          .eq('user_email', userEmail)
          .eq('template_id', templateId)
          .order('created_at', { ascending: false });
        
        setPayments(updatedPayments || []);
      }
    } catch (error) {
      console.error('Error in force approve:', error);
      setMessage('Error force approving payment: ' + error.message);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  if (isLoading) {
    return <div>Loading payment data...</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #dc3545', 
      borderRadius: '8px', 
      margin: '20px 0',
      backgroundColor: '#f8d7da'
    }}>
      <h3 style={{ color: '#dc3545', marginTop: 0 }}>🔧 Manual Payment Status Check</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>User Email:</strong> {userEmail || 'Not signed in'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Template ID:</strong> {templateId}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Status:</strong> {message}
      </div>
      
      {payments.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <strong>All Payments for this Template:</strong>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '8px'
          }}>
            {payments.map((payment, index) => (
              <div key={payment.id} style={{ 
                padding: '10px', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px', 
                marginBottom: '8px',
                backgroundColor: payment.status === 'approved' ? '#d4edda' : 
                               payment.status === 'pending' ? '#fff3cd' : '#f8d7da'
              }}>
                <div><strong>Payment ID:</strong> {payment.id}</div>
                <div><strong>Status:</strong> 
                  <span style={{ 
                    color: payment.status === 'approved' ? '#28a745' : 
                           payment.status === 'pending' ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {payment.status}
                  </span>
                </div>
                <div><strong>Amount:</strong> {payment.amount}</div>
                <div><strong>Method:</strong> {payment.payment_method}</div>
                <div><strong>Created:</strong> {new Date(payment.created_at).toLocaleString()}</div>
                
                {payment.status === 'pending' && (
                  <button
                    onClick={() => forceApprovePayment(payment.id)}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🔧 Force Approve This Payment
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={refreshPage}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh Page
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Hard Refresh
        </button>
      </div>
    </div>
  );
};

export default ManualPaymentStatusCheck; 