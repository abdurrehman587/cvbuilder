// NewPaymentAdmin.js - Version 1.0 - Enhanced Payment Admin Panel
// Last updated: 2024-12-19 16:00:00
// Unique ID: NEW_PAYMENT_ADMIN_20241219_1600

import React, { useState, useEffect, useCallback } from 'react';
import { NewPaymentService } from './NewPaymentService';

const NewPaymentAdmin = ({ onAccessCVBuilder }) => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const [adminUser] = useState({
    id: 'admin-user',
    email: process.env.REACT_APP_ADMIN_EMAIL || 'admin@cvbuilder.com',
    user_metadata: { role: 'admin' },
    isAdmin: true
  });

  const templateNames = {
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

  const paymentMethodNames = {
    'easypaisa': 'EasyPaisa',
    'jazzcash': 'JazzCash',
    'sadapay': 'SadaPay',
    'bank_transfer': 'Bank Transfer',
    'cash': 'Cash'
  };

  const loadPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const allPayments = await NewPaymentService.getAllPayments();
      setPayments(allPayments);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error loading payments:', error);
      alert(`Failed to load payments: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const paymentStats = await NewPaymentService.getPaymentStats();
      setStats(paymentStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    // Set up admin access
    localStorage.setItem('admin_cv_access', 'true');
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    
    loadPayments();
    loadStats();
    
    // Set up auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadPayments();
      loadStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [loadPayments, loadStats, adminUser]);

  const approvePayment = async (paymentId) => {
    try {
      await NewPaymentService.updatePaymentStatus(paymentId, NewPaymentService.STATUS.APPROVED);
      await loadPayments();
      await loadStats();
      alert(`Payment ${paymentId} approved! User can now download CV.`);
    } catch (error) {
      console.error('Error approving payment:', error);
      alert(`Failed to approve payment: ${error.message}`);
    }
  };

  const rejectPayment = async (paymentId, reason = '') => {
    const rejectionReason = reason || prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;
    
    try {
      await NewPaymentService.updatePaymentStatus(paymentId, NewPaymentService.STATUS.REJECTED);
      await loadPayments();
      await loadStats();
      alert(`Payment ${paymentId} rejected! Reason: ${rejectionReason}`);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert(`Failed to reject payment: ${error.message}`);
    }
  };

  const deletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }
    
    try {
      await NewPaymentService.deletePayment(paymentId);
      await loadPayments();
      await loadStats();
      alert('Payment deleted successfully.');
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert(`Failed to delete payment: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#22c55e';
      case 'downloaded': return '#3b82f6';
      case 'rejected': return '#ef4444';
      case 'expired': return '#6b7280';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      downloaded: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `PKR ${parseFloat(amount).toFixed(2)}`;
  };

  const filteredAndSortedPayments = payments
    .filter(payment => {
      // Filter by status
      if (filter !== 'all' && payment.status !== filter) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          payment.user_email.toLowerCase().includes(searchLower) ||
          payment.template_name.toLowerCase().includes(searchLower) ||
          payment.payment_method.toLowerCase().includes(searchLower) ||
          payment.id.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle date sorting
      if (sortBy.includes('_at')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  const handleAccessCVBuilder = () => {
    localStorage.setItem('admin_cv_access', 'true');
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    onAccessCVBuilder();
  };

  if (isLoading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-sm text-gray-600">
                Last updated: {formatDate(lastChecked)}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadPayments}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Refresh
              </button>
              <button
                onClick={handleAccessCVBuilder}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Access CV Builder
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Payments</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Amount</h3>
              <p className="text-3xl font-bold text-green-600">{formatAmount(stats.totalAmount)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Approved</h3>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Downloaded</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.downloaded}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="downloaded">Downloaded</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at">Date Created</option>
                  <option value="updated_at">Date Updated</option>
                  <option value="user_email">User Email</option>
                  <option value="template_name">Template</option>
                  <option value="amount">Amount</option>
                </select>
                
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedPayments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handlePaymentClick(payment)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {templateNames[payment.template_id] || payment.template_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {paymentMethodNames[payment.payment_method] || payment.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                approvePayment(payment.id);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectPayment(payment.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePayment(payment.id);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedPayments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No payments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {showPaymentDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Payment Details</h2>
                <button
                  onClick={() => setShowPaymentDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment ID</label>
                    <p className="text-sm text-gray-900">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Email</label>
                    <p className="text-sm text-gray-900">{selectedPayment.user_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template</label>
                    <p className="text-sm text-gray-900">
                      {templateNames[selectedPayment.template_id] || selectedPayment.template_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-sm text-gray-900">
                      {paymentMethodNames[selectedPayment.payment_method] || selectedPayment.payment_method}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-sm text-gray-900">{formatAmount(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="text-sm text-gray-900">{selectedPayment.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedPayment.created_at)}</p>
                  </div>
                </div>
                
                {selectedPayment.payment_proof_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Proof</label>
                    <a
                      href={selectedPayment.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Proof
                    </a>
                  </div>
                )}
                
                {selectedPayment.status === 'pending' && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        approvePayment(selectedPayment.id);
                        setShowPaymentDetails(false);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Approve Payment
                    </button>
                    <button
                      onClick={() => {
                        rejectPayment(selectedPayment.id);
                        setShowPaymentDetails(false);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Reject Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPaymentAdmin; 