// Utility functions for payment handling across all templates

export const checkForApprovedPayment = (isAdminUser, templateId) => {
  // Admin users can always download
  if (isAdminUser) {
    return true;
  }

  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = currentUser.email || 'unknown@user.com';

  // Check localStorage for approved payments for this specific user and template
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('payment_')) {
      try {
        const payment = JSON.parse(localStorage.getItem(key));
        // Check if payment belongs to current user, is for this template, is approved, and download not used
        if (payment.userId === userEmail && 
            payment.templateId === templateId && 
            payment.status === 'approved' && 
            !payment.downloadUsed) {
          return true;
        }
      } catch (error) {
        console.error('Error parsing payment:', error);
      }
    }
  }
  return false;
};

export const markPaymentAsUsed = (templateId) => {
  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = currentUser.email || 'unknown@user.com';
  
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

export const getDownloadButtonText = (isAdminUser, paymentCompleted, templateId) => {
  if (isAdminUser) {
    return 'Download PDF (Admin)';
  }
  
  const hasApprovedPayment = checkForApprovedPayment(isAdminUser, templateId);
  if (hasApprovedPayment) {
    return 'Payment Approved (Download Now)';
  }
  
  if (paymentCompleted) {
    return 'Payment Submitted (Waiting for Approval)';
  }
  
  return 'Download PDF (PKR 100)';
}; 