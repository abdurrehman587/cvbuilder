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
  isPrintMode = false,
  debug = false
}) => {
  const [buttonText, setButtonText] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [subscription, setSubscription] = useState(null);

  // Get current user email
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

  // Set up real-time subscription for payment updates
  useEffect(() => {
    if (!userEmail || !templateId || isAdminUser) return;

    console.log('CentralizedPaymentSystem - Setting up real-time subscription for:', { userEmail, templateId });
    
    const handlePaymentUpdate = async (payload) => {
      console.log('CentralizedPaymentSystem - Real-time update received:', payload);
      
      // Update button text immediately when payment status changes
      try {
        const newButtonText = await getDownloadButtonText(templateId, isAdminUser);
        setButtonText(newButtonText);
        console.log('CentralizedPaymentSystem - Button text updated via real-time:', newButtonText);
        
        // Check for pending payment to show banner
        const pendingPayment = await checkPendingPayment(templateId);
        setHasPendingPayment(!!pendingPayment);
        
        // Show notification for status changes
        if (payload.table === 'payments' && payload.eventType === 'UPDATE') {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          
          if (oldStatus === 'pending' && newStatus === 'approved') {
            toast.success('🎉 Your payment has been approved! You can now download your CV.');
          } else if (oldStatus === 'pending' && newStatus === 'rejected') {
            toast.error('❌ Your payment was rejected. Please contact support.');
          }
        }
      } catch (error) {
        console.error('CentralizedPaymentSystem - Error updating button text from real-time update:', error);
      }
    };

    // Subscribe to real-time updates with error handling
    const newSubscription = supabase
      .channel(`payment-updates-${userEmail}-${templateId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_email=eq.${userEmail} AND template_id=eq.${templateId}`
        },
        handlePaymentUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cv_downloads',
          filter: `user_email=eq.${userEmail} AND template_id=eq.${templateId}`
        },
        handlePaymentUpdate
      )
      .subscribe((status) => {
        console.log('CentralizedPaymentSystem - Subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.warn('CentralizedPaymentSystem - WebSocket connection failed, falling back to polling');
          // Fallback to polling every 30 seconds
          const pollInterval = setInterval(async () => {
            try {
              const newButtonText = await getDownloadButtonText(templateId, isAdminUser);
              setButtonText(newButtonText);
            } catch (error) {
              console.error('CentralizedPaymentSystem - Polling error:', error);
            }
          }, 30000);
          
          // Clean up polling on unmount
          return () => clearInterval(pollInterval);
        }
      });

    setSubscription(newSubscription);

    // Cleanup subscription on unmount
    return () => {
      if (newSubscription) {
        newSubscription.unsubscribe();
        console.log('CentralizedPaymentSystem - Unsubscribed from payment updates');
      }
    };
  }, [userEmail, templateId, isAdminUser]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminAccess = localStorage.getItem('admin_cv_access');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      
      const isAdmin = (user?.email === process.env.REACT_APP_ADMIN_EMAIL) || 
                     (adminAccess === 'true' && adminUser?.isAdmin === true && user?.email === adminUser?.email);
      
      console.log('CentralizedPaymentSystem - Admin status check:', {
        userEmail: user?.email,
        adminEmail: process.env.REACT_APP_ADMIN_EMAIL,
        adminAccess,
        adminUser,
        isAdmin
      });
      
      setIsAdminUser(isAdmin);
      
      // If admin user, immediately update button text
      if (isAdmin) {
        setButtonText('Download PDF (Admin)');
        setIsLoading(false);
      }
    };

    checkAdminStatus();
    
    // Check admin status periodically
    const interval = setInterval(checkAdminStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update button text based on payment status
  useEffect(() => {
    const updateButtonText = async () => {
      try {
        if (isAdminUser) {
          setButtonText('Download PDF (Admin)');
          setHasPendingPayment(false);
          setIsLoading(false);
          return;
        }

        const text = await getDownloadButtonText(templateId, isAdminUser);
        setButtonText(text);
        console.log('CentralizedPaymentSystem - Button text updated:', text);
        
        // Check for pending payment
        const pendingPayment = await checkPendingPayment(templateId);
        setHasPendingPayment(!!pendingPayment);
      } catch (error) {
        console.error('Error updating button text:', error);
        setButtonText('Download PDF (PKR 100)');
      }
    };

    // Initial call immediately if we have user email or admin status
    if (userEmail || isAdminUser) {
      updateButtonText();
    }

    // Set up periodic updates as fallback (less frequent since we have real-time)
    const interval = setInterval(() => {
      if (userEmail || isAdminUser) {
        updateButtonText();
      }
    }, 30000); // 30 seconds as fallback
    return () => clearInterval(interval);
  }, [isAdminUser, userEmail, templateId]);

  // Set loading to false when we have user email or admin status is determined
  useEffect(() => {
    if (userEmail || isAdminUser) {
      setIsLoading(false);
    } else {
      // Set loading to false after a short delay if no user email
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userEmail, isAdminUser]);

  // Payment service methods
  const checkPendingPayment = async (templateId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.email) return null;

      // Retry mechanism for 406 errors
      let retries = 3;
      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_email', user.email)
            .eq('template_id', templateId)
            .eq('status', 'pending')
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            if (error.code === '406' && retries > 1) {
              console.warn(`CentralizedPaymentSystem - 406 error, retrying... (${retries} attempts left)`);
              retries--;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              continue;
            }
            console.error('Error checking pending payment:', error);
            return null;
          }

          return data;
        } catch (retryError) {
          if (retries > 1) {
            console.warn(`CentralizedPaymentSystem - Query error, retrying... (${retries} attempts left)`, retryError);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw retryError;
        }
      }
    } catch (error) {
      console.error('Error checking pending payment:', error);
      return null;
    }
  };

  const checkApprovedPayment = async (templateId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.email) return null;

      // Retry mechanism for 406 errors
      let retries = 3;
      while (retries > 0) {
        try {
          // Check for approved payment that hasn't been used yet
          // Since is_used column doesn't exist, we'll use cv_downloads table to check if payment was used
          const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_email', user.email)
            .eq('template_id', templateId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            if (error.code === '406' && retries > 1) {
              console.warn(`CentralizedPaymentSystem - 406 error, retrying... (${retries} attempts left)`);
              retries--;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              continue;
            }
            console.error('Error checking approved payment:', error);
            return null;
          }

          if (!data) {
            return null;
          }

          // Check if this payment has been used by looking in cv_downloads table
          const { data: downloads, error: downloadError } = await supabase
            .from('cv_downloads')
            .select('*')
            .eq('payment_id', data.id);

          if (downloadError) {
            console.error('Error checking downloads:', downloadError);
            return null;
          }

          // If no downloads found for this payment, it's unused
          if (!downloads || downloads.length === 0) {
            console.log('CentralizedPaymentSystem - checkApprovedPayment result:', data);
            return data;
          }

          // Payment has been used, return null
          console.log('CentralizedPaymentSystem - Payment has been used, returning null');
          return null;
        } catch (retryError) {
          if (retries > 1) {
            console.warn(`CentralizedPaymentSystem - Query error, retrying... (${retries} attempts left)`, retryError);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw retryError;
        }
      }
    } catch (error) {
      console.error('Error checking approved payment:', error);
      return null;
    }
  };

  const checkDownloadedPayment = async (templateId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.email) return null;

      const { data: downloads, error } = await supabase
        .from('cv_downloads')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .order('downloaded_at', { ascending: false });

      if (error) {
        console.error('Error checking downloads:', error);
        return null;
      }

      // Return the most recent download if any exist
      return downloads && downloads.length > 0 ? downloads[0] : null;
    } catch (error) {
      console.error('Error checking downloads:', error);
      return null;
    }
  };

  const getDownloadCount = async (templateId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.email) return 0;

      const { data: downloads, error } = await supabase
        .from('cv_downloads')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId);

      if (error) {
        console.error('Error getting download count:', error);
        return 0;
      }

      return downloads ? downloads.length : 0;
    } catch (error) {
      console.error('Error getting download count:', error);
      return 0;
    }
  };

  const markPaymentAsUsed = async (paymentId, templateId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.email) {
        throw new Error('User not authenticated');
      }

      // Update payment status to 'downloaded' for admin panel visibility
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({ status: 'downloaded' })
        .eq('id', paymentId)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        throw updateError;
      }

      // Also record the download in cv_downloads table for tracking
      const { data: download, error: downloadError } = await supabase
        .from('cv_downloads')
        .insert({
          user_email: user.email,
          template_id: templateId,
          payment_id: paymentId,
          downloaded_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (downloadError) {
        console.error('Error recording download:', downloadError);
        // Don't throw here as the main payment update was successful
      }

      console.log('Payment marked as downloaded and download recorded:', { updatedPayment, download });
      return { updatedPayment, download };
    } catch (error) {
      console.error('Error marking payment as downloaded:', error);
      throw error;
    }
  };

  const getDownloadButtonText = async (templateId, isAdminUser) => {
    if (isAdminUser) {
      return 'Download PDF (Admin)';
    }

    try {
      console.log('CentralizedPaymentSystem - getDownloadButtonText called for template:', templateId);
      
      // Check for approved payment that hasn't been used yet
      const approvedPayment = await checkApprovedPayment(templateId);
      console.log('CentralizedPaymentSystem - checkApprovedPayment result:', approvedPayment);
      
      if (approvedPayment) {
        // User has an unused approved payment - can download once
        console.log('CentralizedPaymentSystem - Returning: Download Now');
        return 'Download Now';
      }

      // Check for pending payment
      const pendingPayment = await checkPendingPayment(templateId);
      console.log('CentralizedPaymentSystem - checkPendingPayment result:', pendingPayment);
      
      if (pendingPayment) {
        console.log('CentralizedPaymentSystem - Returning: Payment Submitted (Waiting for Approval)');
        return 'Payment Submitted (Waiting for Approval)';
      }

      // Check for previous downloads to show appropriate message
      const previousDownload = await checkDownloadedPayment(templateId);
      console.log('CentralizedPaymentSystem - checkDownloadedPayment result:', previousDownload);
      
      if (previousDownload) {
        console.log('CentralizedPaymentSystem - Returning: Download PDF (PKR 100) - New Payment Required');
        return 'Download PDF (PKR 100) - New Payment Required';
      }

      // No payment found
      console.log('CentralizedPaymentSystem - Returning: Download PDF (PKR 100)');
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
        {debug && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '10px',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            <strong>Debug Info:</strong><br/>
            Button Text: {buttonText}<br/>
            Loading: {isLoading.toString()}<br/>
            Admin User: {isAdminUser.toString()}<br/>
            User Email: {userEmail || 'Not set'}<br/>
            Template ID: {templateId}
          </div>
        )}
        
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