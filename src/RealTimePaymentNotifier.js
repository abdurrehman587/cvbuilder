import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import supabase from './supabase';

const RealTimePaymentNotifier = () => {
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

  // Set up global real-time subscription for payment updates
  useEffect(() => {
    if (!userEmail) return;

    console.log('RealTimePaymentNotifier - Setting up global payment subscription for:', userEmail);
    
    const handlePaymentUpdate = (payload) => {
      console.log('RealTimePaymentNotifier - Payment update received:', payload);
      
      // Handle payment status changes
      if (payload.table === 'payments' && payload.eventType === 'UPDATE') {
        const newStatus = payload.new.status;
        const oldStatus = payload.old.status;
        const templateId = payload.new.template_id;
        const paymentId = payload.new.id;
        
        if (oldStatus === 'pending' && newStatus === 'approved') {
          toast.success(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                🎉 Payment Approved!
              </div>
              <div style={{ fontSize: '14px' }}>
                Your payment for template {templateId} has been approved.
              </div>
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                Payment ID: {paymentId}
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            }
          );
        } else if (oldStatus === 'pending' && newStatus === 'rejected') {
          toast.error(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                ❌ Payment Rejected
              </div>
              <div style={{ fontSize: '14px' }}>
                Your payment for template {templateId} was rejected.
              </div>
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                Please contact support for assistance.
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: 10000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            }
          );
        }
      }
      
      // Handle new payment submissions
      if (payload.table === 'payments' && payload.eventType === 'INSERT') {
        const status = payload.new.status;
        const templateId = payload.new.template_id;
        const paymentId = payload.new.id;
        
        if (status === 'pending') {
          toast.info(
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                📝 Payment Submitted
              </div>
              <div style={{ fontSize: '14px' }}>
                Your payment for template {templateId} has been submitted.
              </div>
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                Payment ID: {paymentId}
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            }
          );
        }
      }
    };

    // Subscribe to all payment changes for this user
    const newSubscription = supabase
      .channel(`global-payment-updates-${userEmail}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_email=eq.${userEmail}`
        },
        handlePaymentUpdate
      )
      .subscribe();

    setSubscription(newSubscription);

    // Cleanup subscription on unmount
    return () => {
      if (newSubscription) {
        newSubscription.unsubscribe();
        console.log('RealTimePaymentNotifier - Unsubscribed from global payment updates');
      }
    };
  }, [userEmail]);

  // This component doesn't render anything visible
  return null;
};

export default RealTimePaymentNotifier; 