import React, { useState, useEffect } from 'react';
import supabase from './supabase';

const QuickPaymentCheck = ({ templateId }) => {
  const [userEmail, setUserEmail] = useState('');
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        checkPayments(user.email);
      }
    };
    getUser();
  }, [templateId]);

  const checkPayments = async (email) => {
    if (!email || !templateId) return;

    try {
      setIsLoading(true);
      console.log('QuickPaymentCheck - Checking payments for:', { email, templateId });

      // Get all payments for this user and template
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', email)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return;
      }

      setPayments(paymentsData || []);
      console.log('QuickPaymentCheck - Payments found:', paymentsData);

    } catch (error) {
      console.error('QuickPaymentCheck - Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approvePayment = async (paymentId) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        alert('Error approving payment: ' + error.message);
      } else {
        alert('Payment approved! Refresh the page to see the download button.');
        checkPayments(userEmail);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const resetPaymentUsage = async (paymentId) => {
    try {
      // Remove download records for this payment to make it available again
      const { error } = await supabase
        .from('cv_downloads')
        .delete()
        .eq('payment_id', paymentId);

      if (error) {
        alert('Error resetting payment: ' + error.message);
      } else {
        alert('Payment usage reset! Refresh the page to see the download button.');
        checkPayments(userEmail);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (isLoading) {
    return <div>Loading payment info...</div>;
  }

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '4px',
      margin: '10px 0',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>🔍 Quick Payment Check</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>User:</strong> {userEmail}<br/>
        <strong>Template:</strong> {templateId}<br/>
        <strong>Total Payments:</strong> {payments.length}
      </div>

      {payments.length === 0 ? (
        <div style={{ color: '#856404' }}>
          ❌ No payments found for this template. Please submit a payment first.
        </div>
      ) : (
        <div>
          {payments.map((payment, index) => (
            <div key={payment.id} style={{
              padding: '6px',
              backgroundColor: payment.status === 'approved' ? '#d4edda' : 
                              payment.status === 'pending' ? '#fff3cd' : '#f8d7da',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              marginTop: '4px',
              fontSize: '11px'
            }}>
              <strong>Payment {index + 1}:</strong><br/>
              Status: <span style={{ 
                color: payment.status === 'approved' ? '#155724' : 
                       payment.status === 'pending' ? '#856404' : '#721c24'
              }}>{payment.status}</span><br/>
              Amount: PKR {payment.amount}<br/>
              
              <div style={{ marginTop: '4px' }}>
                {payment.status === 'pending' && (
                  <button
                    onClick={() => approvePayment(payment.id)}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      marginRight: '4px'
                    }}
                  >
                    ✅ Approve
                  </button>
                )}
                
                {payment.status === 'approved' && (
                  <button
                    onClick={() => resetPaymentUsage(payment.id)}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#ffc107',
                      color: 'black',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    🔄 Reset Usage
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '8px' }}>
        <button
          onClick={() => checkPayments(userEmail)}
          style={{
            padding: '4px 8px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '10px',
            marginRight: '4px'
          }}
        >
          🔄 Refresh
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '4px 8px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          🔄 Reload Page
        </button>
      </div>
    </div>
  );
};

export default QuickPaymentCheck; 