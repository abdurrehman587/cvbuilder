import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './landingpage';

const PaymentAdmin = ({ onAccessCVBuilder }) => {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [showCVBuilder, setShowCVBuilder] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [newPaymentNotification, setNewPaymentNotification] = useState(null);
  const [adminUser] = useState({
    id: 'admin-user',
    email: process.env.REACT_APP_ADMIN_EMAIL || 'admin@cvbuilder.com',
    user_metadata: { role: 'admin' },
    isAdmin: true
  });

  const loadPayments = useCallback(() => {
    console.log('PaymentAdmin - loadPayments called');
    console.log('PaymentAdmin - localStorage.length:', localStorage.length);
    
    const allPayments = [];
    const allKeys = [];
    
    // Log all localStorage keys for debugging
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      allKeys.push(key);
      console.log('PaymentAdmin - Key found:', key);
      
      if (key && key.startsWith('payment_')) {
        try {
          const payment = JSON.parse(localStorage.getItem(key));
          console.log('PaymentAdmin - Found payment:', payment);
          allPayments.push(payment);
        } catch (error) {
          console.error('Error parsing payment:', error);
        }
      }
    }
    
    console.log('PaymentAdmin - All localStorage keys:', allKeys);
    console.log('PaymentAdmin - Total payments found:', allPayments.length);
    
    // Check for new payments
    const previousCount = payments.length;
    const newCount = allPayments.length;
    
    if (newCount > previousCount) {
      const newPayments = allPayments.slice(0, newCount - previousCount);
      console.log('PaymentAdmin - New payments detected:', newPayments);
      setNewPaymentNotification({
        message: `New payment request received! Payment ID: ${newPayments[0].id}`,
        timestamp: new Date()
      });
      
      // Clear notification after 5 seconds
      setTimeout(() => {
        setNewPaymentNotification(null);
      }, 5000);
    }
    
    // Sort by timestamp (newest first)
    allPayments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setPayments(allPayments);
    setLastChecked(new Date());
    console.log('PaymentAdmin - Payments set to state:', allPayments);
  }, []);

  useEffect(() => {
    loadPayments();
    
    // Set up interval to check for new payments every 5 seconds
    const interval = setInterval(() => {
      loadPayments();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loadPayments]);

  const approvePayment = (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = 'approved';
      payment.approvedAt = new Date().toISOString();
      localStorage.setItem(`payment_${paymentId}`, JSON.stringify(payment));
      loadPayments();
      
      // Here you would typically send SMS/email to user
      alert(`Payment ${paymentId} approved! User can now download CV.`);
    }
  };

  const rejectPayment = (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = 'rejected';
      payment.rejectedAt = new Date().toISOString();
      localStorage.setItem(`payment_${paymentId}`, JSON.stringify(payment));
      loadPayments();
      
      // Here you would typically send SMS/email to user
      alert(`Payment ${paymentId} rejected! User will be notified.`);
    }
  };

  const deletePayment = (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      localStorage.removeItem(`payment_${paymentId}`);
      loadPayments();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleAccessCVBuilder = () => {
    // Set admin access flag in localStorage
    localStorage.setItem('admin_cv_access', 'true');
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    setShowCVBuilder(true);
  };

  const handleBackToAdmin = () => {
    setShowCVBuilder(false);
    // Clear admin access flag
    localStorage.removeItem('admin_cv_access');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_selected_cv');
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  // If CV Builder is accessed, show the app
  if (showCVBuilder) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
        {/* Navigation buttons container */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button
            onClick={handleBackToAdmin}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Inter', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ← Back to Admin Panel
          </button>
          
          <button
            onClick={() => {
              // This will trigger the LandingPage's back functionality
              const event = new CustomEvent('backToTemplates');
              window.dispatchEvent(event);
            }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Inter', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#16a34a';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🎨 Back to Templates
          </button>
        </div>
        
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
          padding: '8px 16px',
          backgroundColor: '#22c55e',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Inter', sans-serif"
        }}>
          🔓 Admin CV Builder Access
        </div>

        <LandingPage user={adminUser} />
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* New Payment Notification */}
      {newPaymentNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#22c55e',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          🎉 {newPaymentNotification.message}
        </div>
      )}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #22c55e',
        paddingBottom: '15px'
      }}>
        <h1 style={{ margin: 0, color: '#22c55e' }}>💰 Payment Admin Panel</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleAccessCVBuilder}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🎨 Access CV Builder
          </button>
          <button
            onClick={loadPayments}
            style={{
              padding: '12px 24px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#16a34a';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🔄 Refresh Payments
          </button>
        </div>
        
        {/* Status Indicator */}
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#f0f9ff',
          borderRadius: '6px',
          border: '1px solid #0ea5e9',
          fontSize: '12px',
          color: '#0c4a6e',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span>⏰</span>
          <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
          <span>•</span>
          <span>Auto-refresh every 5 seconds</span>
          <span>•</span>
          <span>Total payments: {payments.length}</span>
          <span>•</span>
          <span>Pending: {payments.filter(p => p.status === 'pending').length}</span>
        </div>
        
        {/* Test Payment Button */}
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#fef3c7',
          borderRadius: '6px',
          border: '1px solid #f59e0b',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <button
            onClick={() => {
              const testPayment = {
                id: `TEST-${Date.now()}`,
                method: 'easypaisa',
                amount: 100,
                phoneNumber: '03001234567',
                timestamp: new Date().toISOString(),
                status: 'pending'
              };
              localStorage.setItem(`payment_${testPayment.id}`, JSON.stringify(testPayment));
              console.log('Test payment created:', testPayment);
              loadPayments();
              alert('Test payment created! Check if it appears in the list.');
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              marginRight: '8px'
            }}
          >
            🧪 Create Test Payment
          </button>
          <span>Use this to test if the admin panel is working correctly</span>
        </div>
        
        {/* Manual Payment Simulation */}
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#fce7f3',
          borderRadius: '6px',
          border: '1px solid #ec4899',
          fontSize: '12px',
          color: '#be185d'
        }}>
          <button
            onClick={() => {
              // Simulate a user payment submission
              const userPayment = {
                id: `USER-${Date.now()}`,
                method: 'easypaisa',
                amount: 100,
                phoneNumber: '03001234567',
                timestamp: new Date().toISOString(),
                status: 'pending'
              };
              localStorage.setItem(`payment_${userPayment.id}`, JSON.stringify(userPayment));
              console.log('User payment simulation created:', userPayment);
              loadPayments();
              alert('User payment simulation created! This simulates what happens when a real user submits a payment.');
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              marginRight: '8px'
            }}
          >
            👤 Simulate User Payment
          </button>
          <span>Simulates a real user payment submission</span>
        </div>
        
        {/* Complete User Flow Simulation */}
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#e0e7ff',
          borderRadius: '6px',
          border: '1px solid #6366f1',
          fontSize: '12px',
          color: '#3730a3'
        }}>
          <button
            onClick={() => {
              // Simulate the complete user payment flow
              console.log('=== COMPLETE USER FLOW SIMULATION ===');
              
              // Step 1: User clicks download button
              console.log('Step 1: User clicks download button');
              
              // Step 2: Payment modal shows
              console.log('Step 2: Payment modal shows');
              
              // Step 3: User fills payment form
              console.log('Step 3: User fills payment form');
              
              // Step 4: User submits payment
              console.log('Step 4: User submits payment');
              
              // Step 5: Payment is stored in localStorage
              const userPayment = {
                id: `FLOW-${Date.now()}`,
                method: 'easypaisa',
                amount: 100,
                phoneNumber: '03001234567',
                timestamp: new Date().toISOString(),
                status: 'pending'
              };
              localStorage.setItem(`payment_${userPayment.id}`, JSON.stringify(userPayment));
              console.log('Step 5: Payment stored in localStorage:', userPayment);
              
              // Step 6: Admin panel detects new payment
              console.log('Step 6: Admin panel should detect new payment');
              loadPayments();
              
              alert('Complete user flow simulation created! This simulates the entire process from user clicking download to payment appearing in admin panel.');
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              marginRight: '8px'
            }}
          >
            🔄 Simulate Complete User Flow
          </button>
          <span>Simulates the entire user payment journey</span>
        </div>
        
        {/* Quick Test Payment */}
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#dcfce7',
          borderRadius: '6px',
          border: '1px solid #22c55e',
          fontSize: '12px',
          color: '#15803d'
        }}>
          <button
            onClick={() => {
              // Create a test payment directly
              const testPayment = {
                id: `QUICK-${Date.now()}`,
                method: 'easypaisa',
                amount: 100,
                phoneNumber: '03001234567',
                timestamp: new Date().toISOString(),
                status: 'pending'
              };
              
              console.log('=== QUICK TEST PAYMENT ===');
              console.log('Creating test payment:', testPayment);
              
              localStorage.setItem(`payment_${testPayment.id}`, JSON.stringify(testPayment));
              
              // Verify it was stored
              const stored = localStorage.getItem(`payment_${testPayment.id}`);
              console.log('Payment stored successfully:', stored);
              
              // Trigger immediate refresh
              loadPayments();
              
              alert(`Quick test payment created!\n\nPayment ID: ${testPayment.id}\n\nCheck if it appears in the list above.`);
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              marginRight: '8px'
            }}
          >
            ⚡ Quick Test Payment
          </button>
          <span>Creates a test payment immediately to verify the system</span>
        </div>
      </div>

      {/* Admin Access Info */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#dbeafe',
        borderRadius: '8px',
        border: '1px solid #3b82f6'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>🔓 Admin CV Builder Access</h3>
        <p style={{ margin: '0', color: '#1e40af', fontSize: '14px' }}>
          Click "Access CV Builder" to use the CV builder app without any payment restrictions. 
          You can create, edit, and download CVs freely as an admin user.
        </p>
      </div>

      {/* Filter Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 12px',
            marginRight: '10px',
            backgroundColor: filter === 'all' ? '#22c55e' : '#e5e7eb',
            color: filter === 'all' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          All ({payments.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{
            padding: '6px 12px',
            marginRight: '10px',
            backgroundColor: filter === 'pending' ? '#f59e0b' : '#e5e7eb',
            color: filter === 'pending' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Pending ({payments.filter(p => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          style={{
            padding: '6px 12px',
            marginRight: '10px',
            backgroundColor: filter === 'approved' ? '#22c55e' : '#e5e7eb',
            color: filter === 'approved' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Approved ({payments.filter(p => p.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          style={{
            padding: '6px 12px',
            backgroundColor: filter === 'rejected' ? '#ef4444' : '#e5e7eb',
            color: filter === 'rejected' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Rejected ({payments.filter(p => p.status === 'rejected').length})
        </button>
      </div>

      {/* Payments Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Payment ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Method</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Phone</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Download</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {payment.id}
                </td>
                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                  {payment.userId || 'Unknown User'}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize'
                  }}>
                    {payment.method}
                  </span>
                </td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>
                  PKR {payment.amount}
                </td>
                <td style={{ padding: '12px' }}>
                  {payment.phoneNumber}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: getStatusColor(payment.status),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize'
                  }}>
                    {payment.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {payment.status === 'approved' ? (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: payment.downloadUsed ? '#ef4444' : '#22c55e',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {payment.downloadUsed ? '✅ Used' : '⏳ Available'}
                    </span>
                  ) : (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      N/A
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                  {new Date(payment.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '12px' }}>
                  {payment.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => approvePayment(payment.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => rejectPayment(payment.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => deletePayment(payment.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      marginTop: '4px'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPayments.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
                    {payments.length === 0 ? (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📭</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No payment requests found</div>
            <div style={{ fontSize: '14px' }}>
              When users make payments through the CV builder, they will appear here for your approval.
            </div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#9ca3af' }}>
              The system automatically checks for new payments every 5 seconds.
            </div>
            
            {/* Testing Instructions */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #f59e0b'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#92400e' }}>🧪 Testing Instructions:</h4>
              <ol style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: '#92400e' }}>
                <li><strong>Quick Test:</strong> Click "⚡ Quick Test Payment" above to verify the system works</li>
                <li><strong>User Flow Test:</strong> Open CV builder in a new tab, fill a CV, and try to download</li>
                <li><strong>Payment Form Test:</strong> Use "🧪 Auto-Fill Test Payment" in the payment modal</li>
                <li><strong>Check Console:</strong> Open browser console (F12) to see detailed logs</li>
              </ol>
            </div>
          </div>
        ) : (
              <div>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No payments match the current filter</div>
                <div style={{ fontSize: '14px' }}>
                  Try changing the filter or viewing all payments.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '1px solid #22c55e'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#22c55e' }}>Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Total Payments:</strong> {payments.length}
          </div>
          <div>
            <strong>Pending:</strong> {payments.filter(p => p.status === 'pending').length}
          </div>
          <div>
            <strong>Approved:</strong> {payments.filter(p => p.status === 'approved').length}
          </div>
          <div>
            <strong>Downloads Used:</strong> {payments.filter(p => p.status === 'approved' && p.downloadUsed).length}
          </div>
          <div>
            <strong>Downloads Available:</strong> {payments.filter(p => p.status === 'approved' && !p.downloadUsed).length}
          </div>
          <div>
            <strong>Total Revenue:</strong> PKR {payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAdmin; 