import supabase from './supabase';

// Clean Payment Service - Separate systems for Admin and Users
export class CleanPaymentService {
  
  // Real-time subscription management
  static subscriptions = new Map();
  
  // ========================================
  // REAL-TIME SUBSCRIPTION METHODS
  // ========================================
  
  static subscribeToPaymentUpdates(userEmail, templateId, callback) {
    try {
      console.log('CleanPaymentService - Setting up real-time subscription for:', { userEmail, templateId });
      
      const subscriptionKey = `${userEmail}-${templateId}`;
      
      // Remove existing subscription if any
      if (this.subscriptions.has(subscriptionKey)) {
        this.subscriptions.get(subscriptionKey).unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      }
      
      // Subscribe to payment changes for this user and template
      const subscription = supabase
        .channel(`payment-updates-${subscriptionKey}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `user_email=eq.${userEmail} AND template_id=eq.${templateId}`
          },
          (payload) => {
            console.log('CleanPaymentService - Real-time payment update:', payload);
            callback(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cv_downloads',
            filter: `user_email=eq.${userEmail} AND template_id=eq.${templateId}`
          },
          (payload) => {
            console.log('CleanPaymentService - Real-time download update:', payload);
            callback(payload);
          }
        )
        .subscribe();
      
      this.subscriptions.set(subscriptionKey, subscription);
      console.log('CleanPaymentService - Real-time subscription active for:', subscriptionKey);
      
      return subscription;
    } catch (error) {
      console.error('CleanPaymentService - Error setting up real-time subscription:', error);
      return null;
    }
  }
  
  static unsubscribeFromPaymentUpdates(userEmail, templateId) {
    try {
      const subscriptionKey = `${userEmail}-${templateId}`;
      
      if (this.subscriptions.has(subscriptionKey)) {
        const subscription = this.subscriptions.get(subscriptionKey);
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
        console.log('CleanPaymentService - Unsubscribed from payment updates for:', subscriptionKey);
      }
    } catch (error) {
      console.error('CleanPaymentService - Error unsubscribing from payment updates:', error);
    }
  }
  
  static unsubscribeAll() {
    try {
      for (const [key, subscription] of this.subscriptions) {
        subscription.unsubscribe();
        console.log('CleanPaymentService - Unsubscribed from:', key);
      }
      this.subscriptions.clear();
    } catch (error) {
      console.error('CleanPaymentService - Error unsubscribing all:', error);
    }
  }
  
  // ========================================
  // ADMIN SYSTEM - Always free downloads
  // ========================================
  
  static isAdminUser() {
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    // First, clear admin flags if current user is not the admin user
    if (user?.email !== adminUser?.email && user?.email !== process.env.REACT_APP_ADMIN_EMAIL) {
      console.log('CleanPaymentService - Clearing admin flags for non-admin user:', user?.email);
      localStorage.removeItem('admin_cv_access');
      localStorage.removeItem('admin_user');
      return false;
    }
    
    // Check if user is actually an admin (only if they are the admin user)
    const isAdmin = (user?.email === process.env.REACT_APP_ADMIN_EMAIL) || 
                   (adminAccess === 'true' && adminUser?.isAdmin === true && user?.email === adminUser?.email);
    
    console.log('CleanPaymentService - Admin check:', {
      adminAccess,
      userEmail: user?.email,
      userIsAdmin: user?.isAdmin,
      adminUserEmail: adminUser?.email,
      adminUserIsAdmin: adminUser?.isAdmin,
      isAdmin
    });
    
    return isAdmin;
  }
  
  static getAdminButtonText() {
    return 'Download PDF (Admin)';
  }
  
  static clearAdminFlagsForRegularUsers() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    
    // If current user is not the admin user, clear admin flags
    if (user?.email !== adminUser?.email && user?.email !== process.env.REACT_APP_ADMIN_EMAIL) {
      console.log('CleanPaymentService - Clearing admin flags for regular user:', user?.email);
      localStorage.removeItem('admin_cv_access');
      localStorage.removeItem('admin_user');
      
      // Also clear any user object that might have admin flags
      if (user?.isAdmin === true && user?.email !== process.env.REACT_APP_ADMIN_EMAIL) {
        const updatedUser = { ...user, isAdmin: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('CleanPaymentService - Updated user object to remove admin flag');
      }
      
      return true;
    }
    
    return false;
  }
  
  static async adminDownload(templateId) {
    console.log('CleanPaymentService - Admin download for template:', templateId);
    // Admin can always download - no payment required
    return true;
  }
  
  // ========================================
  // USER SYSTEM - Complete payment flow
  // ========================================
  
  static async checkDatabaseReady() {
    try {
      const { error } = await supabase
        .from('payments')
        .select('id')
        .limit(1);
      
      if (error && error.message && error.message.includes('relation "payments" does not exist')) {
        console.error('CleanPaymentService - Database not ready - payments table does not exist');
        return false;
      }
      
      console.log('CleanPaymentService - Database is ready');
      return true;
    } catch (error) {
      console.error('CleanPaymentService - Database not ready:', error);
      return false;
    }
  }
  
  static async submitUserPayment(paymentData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        throw new Error('Database not ready. Please contact support.');
      }

      const paymentRecord = {
        user_email: user.email,
        template_id: paymentData.templateId,
        amount: paymentData.amount,
        payment_method: paymentData.method,
        phone_number: paymentData.phoneNumber,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentRecord)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('CleanPaymentService - User payment submitted:', data);
      return data;
    } catch (error) {
      console.error('CleanPaymentService - User payment submission failed:', error);
      throw error;
    }
  }
  
  static async checkUserApprovedPayment(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        return null;
      }

      // Check for approved payment that hasn't been used yet
      // Since is_used column doesn't exist, we'll use cv_downloads table to check if payment was used
      const { data: approvedPayment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('CleanPaymentService - Error checking approved payment:', error);
        return null;
      }

      if (!approvedPayment) {
        return null;
      }

      // Check if this payment has been used by looking in cv_downloads table
      const { data: downloads, error: downloadError } = await supabase
        .from('cv_downloads')
        .select('*')
        .eq('payment_id', approvedPayment.id);

      if (downloadError) {
        console.error('CleanPaymentService - Error checking downloads:', downloadError);
        return null;
      }

      // If no downloads found for this payment, it's unused
      if (!downloads || downloads.length === 0) {
        return approvedPayment;
      }

      // Payment has been used, return null
      return null;
    } catch (error) {
      console.error('CleanPaymentService - Error checking approved payment:', error);
      return null;
    }
  }
  
  static async checkUserPendingPayment(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        return null;
      }

      const { data: pendingPayment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('CleanPaymentService - Error checking pending payment:', error);
        return null;
      }

      return pendingPayment;
    } catch (error) {
      console.error('CleanPaymentService - Error checking pending payment:', error);
      return null;
    }
  }
  
  static async checkUserDownloadedPayment(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        return null;
      }

      // Check cv_downloads table instead of payments with 'downloaded' status
      const { data: downloads, error } = await supabase
        .from('cv_downloads')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .order('downloaded_at', { ascending: false });

      if (error) {
        console.error('CleanPaymentService - Error checking downloads:', error);
        return null;
      }

      // Return the most recent download if any exist
      return downloads && downloads.length > 0 ? downloads[0] : null;
    } catch (error) {
      console.error('CleanPaymentService - Error checking downloads:', error);
      return null;
    }
  }

  static async getUserDownloadCount(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return 0;
      }

      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        return 0;
      }

      // Get total download count for this template
      const { data: downloads, error } = await supabase
        .from('cv_downloads')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId);

      if (error) {
        console.error('CleanPaymentService - Error getting download count:', error);
        return 0;
      }

      return downloads ? downloads.length : 0;
    } catch (error) {
      console.error('CleanPaymentService - Error getting download count:', error);
      return 0;
    }
  }
  
  static async markUserPaymentAsUsed(paymentId, templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update payment status to 'downloaded' for admin panel visibility
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({ status: 'downloaded' })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        console.error('CleanPaymentService - Error updating payment status:', updateError);
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
        .single();

      if (downloadError) {
        console.error('CleanPaymentService - Error recording download:', downloadError);
        // Don't throw here as the main payment update was successful
      }

      console.log('CleanPaymentService - Payment marked as downloaded and download recorded:', { updatedPayment, download });
      return { updatedPayment, download };
    } catch (error) {
      console.error('CleanPaymentService - Error marking payment as downloaded:', error);
      throw error;
    }
  }
  
  static async getUserButtonText(templateId) {
    try {
      console.log('CleanPaymentService - Getting button text for template:', templateId);
      
      // Check for approved payment that hasn't been used yet
      const approvedPayment = await this.checkUserApprovedPayment(templateId);
      console.log('CleanPaymentService - Approved payment check:', approvedPayment ? 'Found' : 'Not found');
      if (approvedPayment) {
        // User has an unused approved payment - can download once
        console.log('CleanPaymentService - Returning: Download Now');
        return 'Download Now';
      }
      
      // Check for pending payment
      const pendingPayment = await this.checkUserPendingPayment(templateId);
      console.log('CleanPaymentService - Pending payment check:', pendingPayment ? 'Found' : 'Not found');
      if (pendingPayment) {
        console.log('CleanPaymentService - Returning: Payment Submitted (Waiting for Approval)');
        return 'Payment Submitted (Waiting for Approval)';
      }
      
      // Check for previous downloads to show appropriate message
      const previousDownload = await this.checkUserDownloadedPayment(templateId);
      console.log('CleanPaymentService - Previous download check:', previousDownload ? 'Found' : 'Not found');
      if (previousDownload) {
        console.log('CleanPaymentService - Returning: Download PDF (PKR 100) - New Payment Required');
        return 'Download PDF (PKR 100) - New Payment Required';
      }
      
      // No payment found
      console.log('CleanPaymentService - No payment found, returning: Download PDF (PKR 100)');
      return 'Download PDF (PKR 100)';
    } catch (error) {
      console.error('CleanPaymentService - Error getting user button text:', error);
      return 'Download PDF (PKR 100)';
    }
  }
  
  static async handleUserDownload(templateId) {
    try {
      console.log('CleanPaymentService - Handling user download for template:', templateId);
      
      // Check for approved payment - if approved, user can always download
      const approvedPayment = await this.checkUserApprovedPayment(templateId);
      console.log('CleanPaymentService - Approved payment check:', approvedPayment ? 'Found' : 'Not found');
      if (approvedPayment) {
        console.log('CleanPaymentService - Recording download and allowing download');
        // Record the download and allow download
        await this.markUserPaymentAsUsed(approvedPayment.id, templateId);
        return { canDownload: true, reason: 'approved_payment' };
      }
      
      // Check for pending payment
      const pendingPayment = await this.checkUserPendingPayment(templateId);
      console.log('CleanPaymentService - Pending payment check:', pendingPayment ? 'Found' : 'Not found');
      if (pendingPayment) {
        console.log('CleanPaymentService - Pending payment found, download blocked');
        return { canDownload: false, reason: 'pending_payment' };
      }
      
      // Check for previous downloads (but no approved payment)
      const previousDownload = await this.checkUserDownloadedPayment(templateId);
      console.log('CleanPaymentService - Previous download check:', previousDownload ? 'Found' : 'Not found');
      if (previousDownload) {
        console.log('CleanPaymentService - Previous download found, new payment required');
        return { canDownload: false, reason: 'needs_new_payment' };
      }
      
      // No payment found
      console.log('CleanPaymentService - No payment found, new payment required');
      return { canDownload: false, reason: 'no_payment' };
    } catch (error) {
      console.error('CleanPaymentService - Error handling user download:', error);
      return { canDownload: false, reason: 'error' };
    }
  }
  
  // ========================================
  // ADMIN MANAGEMENT FUNCTIONS
  // ========================================
  
  static async getAllPayments() {
    try {
      const adminAccess = localStorage.getItem('admin_cv_access');
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const isAdmin = adminAccess === 'true' || adminUser?.isAdmin === true;
      
      if (!isAdmin) {
        throw new Error('Admin access required');
      }

      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        throw new Error('Database not ready');
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('CleanPaymentService - Error getting all payments:', error);
      throw error;
    }
  }
  
  static async updatePaymentStatus(paymentId, status) {
    try {
      const adminAccess = localStorage.getItem('admin_cv_access');
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const isAdmin = adminAccess === 'true' || adminUser?.isAdmin === true;
      
      if (!isAdmin) {
        throw new Error('Admin access required');
      }

      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        throw new Error('Database not ready');
      }

      const { data, error } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('CleanPaymentService - Error updating payment status:', error);
      throw error;
    }
  }
  
  static async deletePayment(paymentId) {
    try {
      const adminAccess = localStorage.getItem('admin_cv_access');
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const isAdmin = adminAccess === 'true' || adminUser?.isAdmin === true;
      
      if (!isAdmin) {
        throw new Error('Admin access required');
      }

      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        throw new Error('Database not ready');
      }

      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('CleanPaymentService - Error deleting payment:', error);
      throw error;
    }
  }
} 