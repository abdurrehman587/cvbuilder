import React, { useState, useEffect } from 'react';
import LandingPage from './landingpage';
import supabase from './supabase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PaymentAdmin = ({ onAccessCVBuilder }) => {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [showCVBuilder, setShowCVBuilder] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [adminUser] = useState({
    id: 'admin-user',
    email: 'admin@cvbuilder.com',
    user_metadata: { role: 'admin' },
    isAdmin: true
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = () => {
    const allPayments = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('payment_')) {
        try {
          const payment = JSON.parse(localStorage.getItem(key));
          allPayments.push(payment);
        } catch (error) {
          console.error('Error parsing payment:', error);
        }
      }
    }
    
    // Sort by timestamp (newest first)
    allPayments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setPayments(allPayments);
  };

  const handleSearchCV = async () => {
    console.log('Admin Search Clicked:', { searchName, searchPhone });
    if (!searchName && !searchPhone) {
      toast.error("Please enter name or phone number to search.");
      return;
    }

    setIsSearching(true);
    try {
      if (!supabase || !supabase.from) {
        toast.error('Supabase client is not configured!');
        setIsSearching(false);
        return;
      }
      let query = supabase.from('cvs').select('*');

      if (searchName) {
        query = query.ilike('name', `%${searchName}%`);
      }

      if (searchPhone) {
        query = query.ilike('phone', `%${searchPhone}%`);
      }

      const { data, error } = await query;
      console.log('Supabase search result:', { data, error });

      if (error) {
        toast.error("Failed to search CVs: " + error.message);
        setIsSearching(false);
        return;
      }

      setSearchResults(data || []);
      
      if (!data || data.length === 0) {
        toast.info("No matching CVs found.");
      } else {
        toast.success(`Found ${data.length} CV(s)`);
      }
    } catch (error) {
      console.error("Search exception:", error);
      toast.error("An error occurred while searching: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadCV = (cvData) => {
    // Store the CV data in localStorage for the CV Builder to access
    localStorage.setItem('admin_selected_cv', JSON.stringify(cvData));
    localStorage.setItem('admin_cv_access', 'true');
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    setShowCVBuilder(true);
    toast.success(`Loading CV for ${cvData.name || 'Unknown User'}...`);
  };

  const clearSearch = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchResults([]);
  };

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
    // Clear search results
    setSearchResults([]);
    setSearchName('');
    setSearchPhone('');
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
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
              padding: '8px 16px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
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

      {/* CV Search Section */}
      <div style={{
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #f59e0b'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#92400e' }}>🔍 Search & Load CVs</h3>
        <p style={{ margin: '0 0 15px 0', color: '#92400e', fontSize: '14px' }}>
          Search for existing CVs by name or phone number. Click "Load CV" to open the CV in the builder with all data pre-filled.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '15px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search by phone..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearchCV}
            disabled={isSearching}
            style={{
              padding: '10px 20px',
              backgroundColor: isSearching ? '#9ca3af' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            {isSearching ? '🔍 Searching...' : '🔍 Search CVs'}
          </button>
          <button
            onClick={clearSearch}
            style={{
              padding: '10px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🗑️ Clear
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontWeight: '600',
              color: '#374151'
            }}>
              Search Results ({searchResults.length})
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {searchResults.map((cv, index) => (
                <div
                  key={cv.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {cv.name || 'No Name'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      📞 {cv.phone || 'No Phone'} | 📧 {cv.email || 'No Email'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      ID: {cv.id} | Created: {new Date(cv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoadCV(cv)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    📝 Load CV
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Method</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Phone</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
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
            No payments found.
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
            <strong>Total Revenue:</strong> PKR {payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAdmin; 