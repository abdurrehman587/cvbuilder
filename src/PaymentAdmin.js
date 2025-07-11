import React, { useState, useEffect, useCallback } from 'react';
import ChooseTemplate from './choosetemplate';
import AdminCVEntry from './AdminCVEntry';
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
  const [showCVEntry, setShowCVEntry] = useState(false);
  const [selectedCV, setSelectedCV] = useState(null);
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
  }, [adminUser]);

  useEffect(() => {
    // Add a small delay to ensure admin access is set
    const timer = setTimeout(() => {
      loadPayments();
    }, 100);
    
    // Set up interval to check for new payments every 5 seconds
    const interval = setInterval(() => {
      loadPayments();
    }, 5000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
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



  const handleBackToAdmin = () => {
    setShowCVBuilder(false);
    setShowCVEntry(false);
    setSelectedCV(null); // Clear selected CV when going back
    // Don't clear admin access flag - keep it for the admin panel
    // Only clear admin_selected_cv if it exists
    if (localStorage.getItem('admin_selected_cv')) {
      localStorage.removeItem('admin_selected_cv');
    }
  };

  const handleAccessCVEntry = () => {
    // Set admin access flag in localStorage
    localStorage.setItem('admin_cv_access', 'true');
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    setShowCVEntry(true);
  };

  const handleMakeNewCV = () => {
    setSelectedCV(null); // Clear any selected CV when making a new one
    setShowCVEntry(false);
    setShowCVBuilder(true);
  };

  const handleSelectCV = (cvData) => {
    // Handle selecting an existing CV
    console.log('Selected CV:', cvData);
    setSelectedCV(cvData);
    setShowCVEntry(false);
    setShowCVBuilder(true);
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  // If CV Entry is accessed, show the AdminCVEntry component
  if (showCVEntry) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
        {/* Navigation button */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
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
        </div>
        
        <AdminCVEntry 
          onMakeNewCV={handleMakeNewCV}
          onSelectCV={handleSelectCV}
        />
      </div>
    );
  }

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
        </div>
        
        <ChooseTemplate 
          user={adminUser} 
          initialCV={selectedCV}
          newAdminCV={!selectedCV} // Only set newAdminCV to true if no CV is selected
        />
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
            onClick={handleAccessCVEntry}
            style={{
              padding: isMobile ? '10px 16px' : '12px 24px',
              backgroundColor: '#22c55e',
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
              e.currentTarget.style.backgroundColor = '#16a34a';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            📝 {isMobile ? 'CV Entry' : 'CV Entry'}
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
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {/* Header with Status */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#666', 
                      marginBottom: '2px',
                      fontWeight: '500'
                    }}>
                      Payment ID
                    </div>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem', 
                      wordBreak: 'break-all',
                      color: '#374151'
                    }}>
                      {payment.id.slice(0, 8)}...
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: getStatusColor(payment.status),
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                      fontWeight: '600'
                    }}>
                      {payment.status}
                    </span>
                  </div>
                </div>

                {/* User Info */}
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#666', 
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    User Details
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
                    {payment.userName || `User (${payment.user_email})`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                    {payment.user_email}
                  </div>
                </div>

                {/* Payment Details */}
                <div style={{ 
                  backgroundColor: '#f0fdf4', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#666', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Payment Details
                  </div>
                  
                  {/* Template and Amount Row */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Template</div>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: '#1e40af',
                        fontWeight: '600'
                      }}>
                        {getTemplateName(payment.template_id)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Amount</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#059669' }}>
                        PKR {payment.amount}
                      </div>
                    </div>
                  </div>

                  {/* Method and Phone Row */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Method</div>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        fontWeight: '500'
                      }}>
                        {payment.payment_method}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Phone</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>
                        {payment.phone_number}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date and Download Status */}
                <div style={{ 
                  backgroundColor: '#fef3c7', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#666', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Additional Info
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Date</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#374151' }}>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Download</div>
                      {payment.status === 'approved' ? (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          ⏳ Available
                        </span>
                      ) : payment.status === 'downloaded' ? (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          ✅ Downloaded
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          N/A
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {payment.status === 'pending' && (
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => approvePayment(payment.id)}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#16a34a';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#22c55e';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        ✅ Approve Payment
                      </button>
                      <button
                        onClick={() => rejectPayment(payment.id)}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        ❌ Reject Payment
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => deletePayment(payment.id)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4b5563';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#6b7280';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    🗑️ Delete Payment
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