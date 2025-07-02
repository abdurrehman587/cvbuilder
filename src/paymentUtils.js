// Utility functions for payment handling across all templates

export const checkForApprovedPayment = (isAdminUser, templateId) => {
  // Admin users can always download
  if (isAdminUser) {
    return true;
  }

  // Get current user info - try multiple sources
  let userEmail = 'unknown@user.com';
  
  // First try to get from localStorage user object
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (currentUser.email) {
    userEmail = currentUser.email;
  } else {
    // If no user object, try to get from Supabase session
    const session = JSON.parse(localStorage.getItem('sb-auth-token') || '{}');
    if (session?.user?.email) {
      userEmail = session.user.email;
    }
  }

  console.log('PaymentUtils - Checking for approved payment for user:', userEmail, 'template:', templateId);
  console.log('PaymentUtils - Current user object:', currentUser);

  // Check localStorage for approved payments for this specific user and template
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('payment_')) {
      try {
        const payment = JSON.parse(localStorage.getItem(key));
        console.log('PaymentUtils - Found payment:', payment);
        
        // Check if payment belongs to current user, is for this template, is approved, and download not used
        if (payment.userId === userEmail && 
            payment.templateId === templateId && 
            payment.status === 'approved' && 
            !payment.downloadUsed) {
          console.log('PaymentUtils - Found approved payment:', payment.id);
          return true;
        }
      } catch (error) {
        console.error('Error parsing payment:', error);
      }
    }
  }
  
  console.log('PaymentUtils - No approved payment found for user:', userEmail, 'template:', templateId);
  return false;
};

export const checkForPendingPayment = (templateId) => {
  // Get current user info - try multiple sources
  let userEmail = 'unknown@user.com';
  
  // First try to get from localStorage user object
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (currentUser.email) {
    userEmail = currentUser.email;
  } else {
    // If no user object, try to get from Supabase session
    const session = JSON.parse(localStorage.getItem('sb-auth-token') || '{}');
    if (session?.user?.email) {
      userEmail = session.user.email;
    }
  }

  console.log('PaymentUtils - Checking for pending payment for user:', userEmail, 'template:', templateId);
  console.log('PaymentUtils - Current user object:', currentUser);

  // Check localStorage for pending payments for this specific user and template
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('payment_')) {
      try {
        const payment = JSON.parse(localStorage.getItem(key));
        // Check if payment belongs to current user, is for this template, and is pending
        if (payment.userId === userEmail && 
            payment.templateId === templateId && 
            payment.status === 'pending') {
          console.log('PaymentUtils - Found pending payment:', payment.id);
          return true;
        }
      } catch (error) {
        console.error('Error parsing payment:', error);
      }
    }
  }
  
  console.log('PaymentUtils - No pending payment found for user:', userEmail, 'template:', templateId);
  return false;
};

export const markPaymentAsUsed = (templateId) => {
  // Get current user info - try multiple sources
  let userEmail = 'unknown@user.com';
  
  // First try to get from localStorage user object
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (currentUser.email) {
    userEmail = currentUser.email;
  } else {
    // If no user object, try to get from Supabase session
    const session = JSON.parse(localStorage.getItem('sb-auth-token') || '{}');
    if (session?.user?.email) {
      userEmail = session.user.email;
    }
  }
  
  console.log('PaymentUtils - Marking payment as used for user:', userEmail, 'template:', templateId);
  
  // Find and mark the user's approved payment for this template as used
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('payment_')) {
      try {
        const payment = JSON.parse(localStorage.getItem(key));
        if (payment.userId === userEmail && 
            payment.templateId === templateId && 
            payment.status === 'approved' && 
            !payment.downloadUsed) {
          payment.downloadUsed = true;
          payment.downloadedAt = new Date().toISOString();
          localStorage.setItem(key, JSON.stringify(payment));
          console.log('Payment marked as used:', payment.id, 'for template:', templateId);
          return true; // Successfully marked a payment as used
        }
      } catch (error) {
        console.error('Error updating payment:', error);
      }
    }
  }
  return false; // No payment was marked as used
};

export const getDownloadButtonText = (isAdminUser, templateId) => {
  if (isAdminUser) {
    return 'Download PDF (Admin)';
  }
  
  const hasApprovedPayment = checkForApprovedPayment(isAdminUser, templateId);
  const hasPendingPayment = checkForPendingPayment(templateId);
  
  if (hasApprovedPayment) {
    return 'Payment Approved (Download Now)';
  }
  
  if (hasPendingPayment) {
    return 'Payment Submitted (Waiting for Approval)';
  }
  
  return 'Download PDF (PKR 100)';
};

export const clearDownloadState = () => {
  // Remove the session-based download flag
  localStorage.removeItem('cv_downloaded');
};

// Debug function to check payment status
export const debugPaymentStatus = (templateId) => {
  console.log('=== PAYMENT STATUS DEBUG ===');
  
  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('Current user:', currentUser);
  
  // List all payment records
  const payments = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('payment_')) {
      try {
        const payment = JSON.parse(localStorage.getItem(key));
        payments.push(payment);
      } catch (error) {
        console.error('Error parsing payment:', error);
      }
    }
  }
  
  console.log('All payments:', payments);
  
  // Check specific template
  const hasApproved = checkForApprovedPayment(false, templateId);
  const hasPending = checkForPendingPayment(templateId);
  
  console.log(`Template ${templateId}:`);
  console.log('- Has approved payment:', hasApproved);
  console.log('- Has pending payment:', hasPending);
  
  // Additional debugging - check if any payments match the current user
  if (currentUser.email) {
    const userPayments = payments.filter(p => p.userId === currentUser.email);
    console.log('Payments for current user:', userPayments);
    
    const templatePayments = userPayments.filter(p => p.templateId === templateId);
    console.log('Payments for current template:', templatePayments);
  }
  
  return {
    user: currentUser,
    payments: payments,
    hasApproved: hasApproved,
    hasPending: hasPending
  };
};

// Function to manually test payment persistence
export const testPaymentPersistence = () => {
  console.log('=== TESTING PAYMENT PERSISTENCE ===');
  
  // Create a test payment
  const testPayment = {
    id: `TEST-${Date.now()}`,
    userId: 'test@example.com',
    templateId: 'template1',
    templateName: 'Template 1',
    method: 'easypaisa',
    amount: 100,
    phoneNumber: '03001234567',
    timestamp: new Date().toISOString(),
    status: 'pending',
    downloadUsed: false
  };
  
  localStorage.setItem(`payment_${testPayment.id}`, JSON.stringify(testPayment));
  console.log('Test payment created:', testPayment);
  
  // Test the payment utilities
  const hasPending = checkForPendingPayment('template1');
  console.log('Has pending payment after creation:', hasPending);
  
  return testPayment;
}; 