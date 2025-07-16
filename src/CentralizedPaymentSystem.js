import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ManualPayment from './ManualPayment';
import supabase from './supabase';

/**
 * Centralized Payment and Download System
 * This component handles all payment logic and download functionality for all templates
 */
const CentralizedPaymentSystem = ({ 
  templateId, 
  templateName, 
  onDownload, 
  isPrintMode = false 
}) => {
  const [buttonText, setButtonText] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminAccess = localStorage.getItem('admin_cv_access');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      
      // Clear admin flags for regular users
      if (user?.email !== adminUser?.email && user?.email !== process.env.REACT_APP_ADMIN_EMAIL) {
        localStorage.removeItem('admin_cv_access');
        localStorage.removeItem('admin_user');
        if (user?.isAdmin) {
          user.isAdmin = false;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      // Check if user is actually an admin
      const isAdmin = (adminAccess === 'true' && adminUser?.isAdmin === true && 
                      (user?.email === adminUser?.email || user?.email === process.env.REACT_APP_ADMIN_EMAIL)) ||
                     (user?.isAdmin === true && user?.email === process.env.REACT_APP_ADMIN_EMAIL);
      
      setIsAdminUser(isAdmin);
      console.log('CentralizedPaymentSystem - Admin check:', {
        adminAccess,
        userEmail: user?.email,
        userIsAdmin: user?.isAdmin,
        adminUserEmail: adminUser?.email,
        adminUserIsAdmin: adminUser?.isAdmin,
        isAdmin
      });
    };

    checkAdminStatus();
    setIsLoading(false);
  }, []);

  // Update button text based on payment status
  useEffect(() => {
    if (isLoading) return;

    const updateButtonText = async () => {
      try {
        if (isAdminUser) {
          setButtonText('Download PDF (Admin)');
          setHasPendingPayment(false);
          return;
        }

        const text = await getDownloadButtonText(templateId, isAdminUser);
        setButtonText(text);
        
        // Check for pending payment
        const pendingPayment = await checkPendingPayment(templateId);
        setHasPendingPayment(!!pendingPayment);
      } catch (error) {
        console.error('Error updating button text:', error);
        setButtonText('Download PDF (PKR 100)');
      }
    };

    updateButtonText();

    // Set up periodic updates
    const interval = setInterval(updateButtonText, 5000);
    return () => clearInterval(interval);
  }, [isAdminUser, isLoading, templateId]);

  // Payment service methods
  const checkPendingPayment = async (templateId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pending payment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error checking pending payment:', error);
      return null;
    }
  };

  const checkApprovedPayment = async (templateId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'approved')
        .eq('is_used', false)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking approved payment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error checking approved payment:', error);
      return null;
    }
  };

  const checkDownloadedPayment = async (templateId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'approved')
        .eq('is_used', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking downloaded payment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error checking downloaded payment:', error);
      return null;
    }
  };

  const markPaymentAsUsed = async (paymentId, templateId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (error) {
        console.error('Error marking payment as used:', error);
        throw error;
      }

      console.log('Payment marked as used successfully');
    } catch (error) {
      console.error('Error marking payment as used:', error);
      throw error;
    }
  };

  const getDownloadButtonText = async (templateId, isAdminUser) => {
    if (isAdminUser) {
      return 'Download PDF (Admin)';
    }

    try {
      // Check for approved payment first
      const approvedPayment = await checkApprovedPayment(templateId);
      if (approvedPayment) {
        return 'Download Now';
      }

      // Check for pending payment
      const pendingPayment = await checkPendingPayment(templateId);
      if (pendingPayment) {
        return 'Payment Submitted (Waiting for Approval)';
      }

      // Check for downloaded payment
      const downloadedPayment = await checkDownloadedPayment(templateId);
      if (downloadedPayment) {
        return 'Download PDF (PKR 100) - New Download';
      }

      // No payment found
      return 'Download PDF (PKR 100)';
    } catch (error) {
      console.error('Error getting download button text:', error);
      return 'Download PDF (PKR 100)';
    }
  };

  // Handle download click
  const handleDownloadClick = async () => {
    console.log('CentralizedPaymentSystem - Download button clicked for template:', templateId);
    console.log('CentralizedPaymentSystem - isAdminUser:', isAdminUser);
    
    setIsDownloading(true);
    
    try {
      if (isAdminUser) {
        // Admin user - always free download
        console.log('CentralizedPaymentSystem - Admin user, proceeding with direct download');
        await onDownload();
        toast.success('PDF downloaded successfully!');
        return;
      }

      // Check if user has an approved payment
      const approvedPayment = await checkApprovedPayment(templateId);
      if (approvedPayment) {
        console.log('CentralizedPaymentSystem - User has approved payment, proceeding with download');
        await onDownload();
        
        // Mark payment as used
        await markPaymentAsUsed(approvedPayment.id, templateId);
        
        // Update button text
        const newButtonText = await getDownloadButtonText(templateId, isAdminUser);
        setButtonText(newButtonText);
        
        toast.success('PDF downloaded successfully!');
        return;
      }

      // Check if there's a pending payment
      const pendingPayment = await checkPendingPayment(templateId);
      if (pendingPayment) {
        toast.info('You have a pending payment. Please wait for admin approval.');
        return;
      }

      // Show payment modal
      console.log('CentralizedPaymentSystem - No approved payment, showing payment modal');
      setShowPaymentModal(true);
    } catch (error) {
      console.error('CentralizedPaymentSystem - Download error:', error);
      toast.error('An error occurred during download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentData) => {
    console.log('CentralizedPaymentSystem - Payment successful:', paymentData);
    setShowPaymentModal(false);
    setHasPendingPayment(true);
    setButtonText('Payment Submitted (Waiting for Approval)');
    
    toast.success(`Payment submitted successfully! Payment ID: ${paymentData.paymentId}. Please wait for admin approval.`);
  };

  // Handle payment failure
  const handlePaymentFailure = (error) => {
    console.error('CentralizedPaymentSystem - Payment failed:', error);
    setShowPaymentModal(false);
    toast.error(`Payment failed: ${error.message}`);
  };

  // Don't render anything in print mode
  if (isPrintMode) {
    return null;
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={handleDownloadClick}
          disabled={isLoading || isDownloading}
          style={{
            padding: '12px 24px',
            backgroundColor: buttonText === 'Download Now' ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: (isLoading || isDownloading) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || isDownloading) ? 0.6 : 1,
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: '0 auto'
          }}
        >
          {isDownloading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Processing...
            </>
          ) : (
            buttonText
          )}
        </button>

        {hasPendingPayment && !isAdminUser && (
          <div style={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '10px',
            border: '1px solid #ffeaa7'
          }}>
            ⏳ Payment submitted and waiting for admin approval
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <ManualPayment
          amount={100}
          templateId={templateId}
          templateName={templateName}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

export default CentralizedPaymentSystem; 