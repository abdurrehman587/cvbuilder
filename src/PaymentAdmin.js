import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './landingpage';
import { PaymentService } from './paymentService';
import supabase from './supabase';

// Custom hook for responsive design
const useResponsive = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowWidth <= 480,
    isTablet: windowWidth > 480 && windowWidth <= 768,
    isDesktop: windowWidth > 768,
    windowWidth
  };
};

const PaymentAdmin = ({ onAccessCVBuilder }) => {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [showCVBuilder, setShowCVBuilder] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [adminUser] = useState({
    id: 'admin-user',
    email: process.env.REACT_APP_ADMIN_EMAIL || 'admin@cvbuilder.com',
    user_metadata: { role: 'admin' },
    isAdmin: true
  });

  // Function to map template IDs to proper template names
  const getTemplateName = (templateId) => {
    const templateMap = {
      'template1': 'Template 1',
      'template2': 'Template 2', 
      'template3': 'Template 3',
      'template4': 'Template 4',
      'template5': 'Template 5',
      'template6': 'Template 6',
      'template7': 'Template 7',
      'template8': 'Template 8',
      'template9': 'Template 9',
      'template10': 'Template 10'
    };
    
    return templateMap[templateId] || templateId || 'Unknown Template';
  };

  const loadPayments = useCallback(async () => {
    console.log('PaymentAdmin - loadPayments called');
    
    try {
      const allPayments = await PaymentService.getAllPayments();
      console.log('PaymentAdmin - Payments loaded from Supabase:', allPayments);
      
      // Fetch user names for each payment
      const paymentsWithUserNames = await Promise.all(
        allPayments.map(async (payment) => {
          try {
            console.log('Looking up user name for payment:', {
              paymentId: payment.id,
              userEmail: payment.user_email
            });

            // First try to fetch from user_cvs table
            let { data: cvData, error: cvError } = await supabase
              .from('user_cvs')
              .select('name, user_email')
              .eq('user_email', payment.user_email)
              .maybeSingle();
            
            console.log('User CV lookup result:', {
              userEmail: payment.user_email,
              cvData: cvData,
              cvError: cvError
            });
            
            // If not found in user_cvs, try admin_cvs table
            if (!cvData && !cvError) {
              console.log('User CV not found, trying admin CV table...');
              const { data: adminCvData, error: adminCvError } = await supabase
                .from('admin_cvs')
                .select('name, user_email')
                .eq('user_email', payment.user_email)
                .maybeSingle();
              
              console.log('Admin CV lookup result:', {
                userEmail: payment.user_email,
                adminCvData: adminCvData,
                adminCvError: adminCvError
              });
              
              if (adminCvError) {
                console.error('Error fetching admin CV data for user:', payment.user_email, adminCvError);
              } else {
                cvData = adminCvData;
              }
            }
            
            if (cvError) {
              console.error('Error fetching CV data for user:', payment.user_email, cvError);
            }
            
            // If still no CV data found, let's check what users exist in the CV tables
            if (!cvData) {
              console.log('No CV data found for user:', payment.user_email);
              
              // Debug: Check what users exist in user_cvs table
              const { data: allUserCvs, error: allUserCvsError } = await supabase
                .from('user_cvs')
                .select('user_email, name')
                .limit(5);
              
              console.log('Sample user_cvs data:', {
                allUserCvs: allUserCvs,
                allUserCvsError: allUserCvsError
              });
              
              // Debug: Check what users exist in admin_cvs table
              const { data: allAdminCvs, error: allAdminCvsError } = await supabase
                .from('admin_cvs')
                .select('user_email, name')
                .limit(5);
              
              console.log('Sample admin_cvs data:', {
                allAdminCvs: allAdminCvs,
                allAdminCvsError: allAdminCvsError
              });
            }
            
            console.log('Final payment user name lookup result:', {
              paymentId: payment.id,
              userEmail: payment.user_email,
              userName: cvData?.name || `User (${payment.user_email})`,
              cvDataFound: !!cvData
            });
            
            return {
              ...payment,
              userName: cvData?.name || `User (${payment.user_email})`
            };
          } catch (error) {
            console.error('Error fetching user name for payment:', payment.id, error);
            return {
              ...payment,
              userName: `User (${payment.user_email})`
            };
          }
        })
      );
      
      // Check for new payments
      const previousCount = payments.length;
      const newCount = paymentsWithUserNames.length;
      
      if (newCount > previousCount) {
        const newPayments = paymentsWithUserNames.slice(0, newCount - previousCount);
        console.log('PaymentAdmin - New payments detected:', newPayments);
      }
      
      setPayments(paymentsWithUserNames);
      setLastChecked(new Date());
      console.log('PaymentAdmin - Payments set to state:', paymentsWithUserNames);
    } catch (error) {
      console.error('Error loading payments:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load payments. ';
      
      if (error.message.includes('Admin access required')) {
        errorMessage += 'Admin access is required. Please log in as admin.';
      } else if (error.message.includes('Database not ready')) {
        errorMessage += 'Database is not ready. Please check your Supabase setup.';
      } else if (error.message.includes('relation "payments" does not exist')) {
        errorMessage += 'Payments table does not exist. Please run the database setup script.';
      } else if (error.message.includes('RLS')) {
        errorMessage += 'Row Level Security is blocking access. Please run the RLS fix script.';
      } else {
        errorMessage += 'Please check the console for more details.';
      }
      
      console.error('Detailed error:', error);
      alert(errorMessage);
    }
  }, [payments.length]);

  // Set up admin access when component mounts
  useEffect(() => {
    // Set admin access flag in localStorage
    localStorage.setItem('admin_cv_access', 'true');
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    console.log('PaymentAdmin - Admin access set up:', adminUser);
    
    // Verify admin access is set
    const adminAccess = localStorage.getItem('admin_cv_access');
    const storedAdminUser = localStorage.getItem('admin_user');
    console.log('PaymentAdmin - Admin access verification:', {
      adminAccess,
      storedAdminUser: storedAdminUser ? JSON.parse(storedAdminUser) : null
    });
  }, []);

  useEffect(() => {
    loadPayments();
    
    // Set up interval to check for new payments every 5 seconds
    const interval = setInterval(() => {
      loadPayments();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loadPayments]);

  const approvePayment = async (paymentId) => {
    try {
      await PaymentService.updatePaymentStatus(paymentId, 'approved');
      loadPayments();
      alert(`Payment ${paymentId} approved! User can now download CV.`);
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment. Please try again.');
    }
  };

  const rejectPayment = async (paymentId) => {
    try {
      await PaymentService.updatePaymentStatus(paymentId, 'rejected');
      loadPayments();
      alert(`Payment ${paymentId} rejected! User will be notified.`);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment. Please try again.');
    }
  };

  const deletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await PaymentService.deletePayment(paymentId);
        loadPayments();
        alert('Payment deleted successfully.');
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Failed to delete payment. Please try again.');
      }
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#22c55e';
      case 'downloaded': return '#3b82f6';
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
        
                <LandingPage user={adminUser} />
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '100%',
      margin: '0 auto',
      padding: '10px',
      fontFamily: "'Inter', sans-serif",
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      
      {/* Header Section */}
      <div style={{
        display: 'flex',
        flexDirection: !isDesktop ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: !isDesktop ? 'stretch' : 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #22c55e',
        paddingBottom: '15px',
        gap: !isDesktop ? '15px' : '0'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            color: '#22c55e',
            fontSize: isMobile ? '1.5rem' : '2rem',
            textAlign: !isDesktop ? 'center' : 'left'
          }}>
            💰 Payment Admin Panel
          </h1>
          <p style={{ 
            margin: '5px 0 0 0', 
            fontSize: isMobile ? '0.8rem' : '0.9rem', 
            color: '#666',
            textAlign: !isDesktop ? 'center' : 'left'
          }}>
            Note: User names will show as "User (email)" if CV data hasn't been saved yet
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '10px', 
          alignItems: 'center',
          justifyContent: !isDesktop ? 'center' : 'flex-end'
        }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: isMobile ? '12px' : '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              minWidth: isMobile ? '120px' : 'auto'
            }}
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="downloaded">Downloaded</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={handleAccessCVBuilder}
            style={{
              padding: isMobile ? '10px 16px' : '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
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
            🎨 {isMobile ? 'CV Builder' : 'Access CV Builder'}
          </button>
        </div>
      </div>

      {/* Payments Display - Responsive */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Desktop Table View */}
        {isDesktop && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Payment ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Template</th>
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
                    {payment.userName || `User (${payment.user_email})`}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      color: '#1e40af',
                      fontWeight: '500'
                    }}>
                      {getTemplateName(payment.template_id)}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      textTransform: 'capitalize'
                    }}>
                      {payment.payment_method}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>
                    PKR {payment.amount}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {payment.phone_number}
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
                        backgroundColor: '#22c55e',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        ⏳ Available
                      </span>
                    ) : payment.status === 'downloaded' ? (
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        ✅ Downloaded
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
                    {new Date(payment.created_at).toLocaleString()}
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
        )}

        {/* Mobile Card View */}
        {!isDesktop && (
          <div style={{ padding: '10px' }}>
            {filteredPayments.map((payment) => (
              <div key={payment.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                backgroundColor: 'white'
              }}>
                {/* Payment ID */}
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#666' }}>Payment ID:</strong>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                    {payment.id}
                  </div>
                </div>

                {/* User */}
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#666' }}>User:</strong>
                  <div style={{ fontSize: '0.9rem' }}>
                    {payment.userName || `User (${payment.user_email})`}
                  </div>
                </div>

                {/* Template */}
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#666' }}>Template:</strong>
                  <div>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      color: '#1e40af',
                      fontWeight: '500'
                    }}>
                      {getTemplateName(payment.template_id)}
                    </span>
                  </div>
                </div>

                {/* Method and Amount Row */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.8rem', color: '#666' }}>Method:</strong>
                    <div>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        textTransform: 'capitalize'
                      }}>
                        {payment.payment_method}
                      </span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.8rem', color: '#666' }}>Amount:</strong>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      PKR {payment.amount}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#666' }}>Phone:</strong>
                  <div style={{ fontSize: '0.9rem' }}>
                    {payment.phone_number}
                  </div>
                </div>

                {/* Status and Download Row */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.8rem', color: '#666' }}>Status:</strong>
                    <div>
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
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.8rem', color: '#666' }}>Download:</strong>
                    <div>
                      {payment.status === 'approved' ? (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          ⏳ Available
                        </span>
                      ) : payment.status === 'downloaded' ? (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          ✅ Downloaded
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
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#666' }}>Date:</strong>
                  <div style={{ fontSize: '0.9rem' }}>
                    {new Date(payment.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '8px'
                }}>
                  {payment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approvePayment(payment.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          flex: 1
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => rejectPayment(payment.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          flex: 1
                        }}
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deletePayment(payment.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      flex: 1
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredPayments.length === 0 && (
          <div style={{
            padding: isMobile ? '20px' : '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            {payments.length === 0 ? (
              <div>
                <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '10px' }}>📭</div>
                <div style={{ 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: '600', 
                  marginBottom: '8px' 
                }}>
                  No payment requests found
                </div>
                <div style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  When users make payments through the CV builder, they will appear here for your approval.
                </div>
                <div style={{ 
                  fontSize: isMobile ? '10px' : '12px', 
                  marginTop: '8px', 
                  color: '#9ca3af' 
                }}>
                  The system automatically checks for new payments every 5 seconds.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '10px' }}>🔍</div>
                <div style={{ 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: '600', 
                  marginBottom: '8px' 
                }}>
                  No payments match the current filter
                </div>
                <div style={{ fontSize: isMobile ? '12px' : '14px' }}>
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
        <h3 style={{ 
          margin: '0 0 10px 0', 
          color: '#22c55e',
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          textAlign: !isDesktop ? 'center' : 'left'
        }}>
          Summary
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: !isDesktop 
            ? 'repeat(auto-fit, minmax(150px, 1fr))' 
            : 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: isMobile ? '10px' : '15px'
        }}>
          <div style={{
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '6px',
            textAlign: !isDesktop ? 'center' : 'left'
          }}>
            <strong style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Total Payments:</strong>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
              {payments.length}
            </div>
          </div>
          <div style={{
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '6px',
            textAlign: !isDesktop ? 'center' : 'left'
          }}>
            <strong style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Pending:</strong>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {payments.filter(p => p.status === 'pending').length}
            </div>
          </div>
          <div style={{
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '6px',
            textAlign: !isDesktop ? 'center' : 'left'
          }}>
            <strong style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Approved:</strong>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
              {payments.filter(p => p.status === 'approved').length}
            </div>
          </div>
          <div style={{
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '6px',
            textAlign: !isDesktop ? 'center' : 'left'
          }}>
            <strong style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Downloaded:</strong>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {payments.filter(p => p.status === 'downloaded').length}
            </div>
          </div>
          <div style={{
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '6px',
            textAlign: !isDesktop ? 'center' : 'left'
          }}>
            <strong style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Rejected:</strong>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
              {payments.filter(p => p.status === 'rejected').length}
            </div>
          </div>
          <div style={{
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '6px',
            textAlign: !isDesktop ? 'center' : 'left'
          }}>
            <strong style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Total Revenue:</strong>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 'bold', color: '#059669' }}>
              PKR {payments.filter(p => p.status === 'approved' || p.status === 'downloaded').reduce((sum, p) => sum + p.amount, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAdmin;