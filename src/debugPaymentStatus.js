import supabase from './supabase';

export const debugPaymentStatus = async (templateId) => {
  try {
    console.log('=== DEBUG PAYMENT STATUS ===');
    console.log('Template ID:', templateId);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No authenticated user found');
      return;
    }
    
    // Check all payments for this user and template
    const { data: allPayments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_email', user.email)
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching payments:', error);
      return;
    }
    
    console.log('All payments for user and template:', allPayments);
    
    // Check specific statuses
    const approvedPayments = allPayments.filter(p => p.status === 'approved');
    const pendingPayments = allPayments.filter(p => p.status === 'pending');
    const downloadedPayments = allPayments.filter(p => p.status === 'downloaded');
    
    console.log('Approved payments:', approvedPayments.length);
    console.log('Pending payments:', pendingPayments.length);
    console.log('Downloaded payments:', downloadedPayments.length);
    
    // Check admin status
    const adminAccess = localStorage.getItem('admin_cv_access');
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    console.log('Admin check data:', {
      adminAccess,
      userEmail: userObj?.email,
      userIsAdmin: userObj?.isAdmin,
      adminUserEmail: adminUser?.email,
      adminUserIsAdmin: adminUser?.isAdmin
    });
    
    // Determine expected button text
    let expectedButtonText = 'Download PDF (PKR 100)';
    
    if (approvedPayments.length > 0) {
      expectedButtonText = 'Download Now';
    } else if (pendingPayments.length > 0) {
      expectedButtonText = 'Payment Submitted (Waiting for Approval)';
    } else if (downloadedPayments.length > 0) {
      expectedButtonText = 'Download PDF (PKR 100) - New Download';
    }
    
    console.log('Expected button text:', expectedButtonText);
    console.log('=== END DEBUG ===');
    
    return {
      user: user.email,
      allPayments,
      approvedPayments,
      pendingPayments,
      downloadedPayments,
      expectedButtonText,
      adminData: {
        adminAccess,
        userEmail: userObj?.email,
        userIsAdmin: userObj?.isAdmin,
        adminUserEmail: adminUser?.email,
        adminUserIsAdmin: adminUser?.isAdmin
      }
    };
    
  } catch (error) {
    console.error('Debug payment status error:', error);
    return null;
  }
}; 