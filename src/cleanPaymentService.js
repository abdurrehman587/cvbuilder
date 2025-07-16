import supabase from './supabase';

// Clean Payment Service - Separate systems for Admin and Users
export class CleanPaymentService {
  
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

      return approvedPayment;
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

      const { data: downloadedPayment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'downloaded')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('CleanPaymentService - Error checking downloaded payment:', error);
        return null;
      }

      return downloadedPayment;
    } catch (error) {
      console.error('CleanPaymentService - Error checking downloaded payment:', error);
      return null;
    }
  }
  
  static async markUserPaymentAsUsed(paymentId, templateId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'downloaded',
          downloaded_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('CleanPaymentService - Payment marked as used:', data);
      return data;
    } catch (error) {
      console.error('CleanPaymentService - Error marking payment as used:', error);
      throw error;
    }
  }
  
  static async getUserButtonText(templateId) {
    try {
      console.log('CleanPaymentService - Getting button text for template:', templateId);
      
      // Check for approved payment first
      const approvedPayment = await this.checkUserApprovedPayment(templateId);
      console.log('CleanPaymentService - Approved payment check:', approvedPayment ? 'Found' : 'Not found');
      if (approvedPayment) {
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
      
      // Check for downloaded payment (user wants to download again)
      const downloadedPayment = await this.checkUserDownloadedPayment(templateId);
      console.log('CleanPaymentService - Downloaded payment check:', downloadedPayment ? 'Found' : 'Not found');
      if (downloadedPayment) {
        console.log('CleanPaymentService - Returning: Download PDF (PKR 100) - New Download');
        return 'Download PDF (PKR 100) - New Download';
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
      
      // Check for approved payment
      const approvedPayment = await this.checkUserApprovedPayment(templateId);
      console.log('CleanPaymentService - Approved payment check:', approvedPayment ? 'Found' : 'Not found');
      if (approvedPayment) {
        console.log('CleanPaymentService - Marking payment as used and allowing download');
        // Mark payment as used and allow download
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
      
      // Check for downloaded payment
      const downloadedPayment = await this.checkUserDownloadedPayment(templateId);
      console.log('CleanPaymentService - Downloaded payment check:', downloadedPayment ? 'Found' : 'Not found');
      if (downloadedPayment) {
        console.log('CleanPaymentService - Downloaded payment found, new payment required');
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