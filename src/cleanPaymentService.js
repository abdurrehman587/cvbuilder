import supabase from './supabase';

// Clean Payment Service - Separate systems for Admin and Users
export class CleanPaymentService {
  
  // ========================================
  // ADMIN SYSTEM - Always free downloads
  // ========================================
  
  static isAdminUser() {
    const adminAccess = localStorage.getItem('admin_cv_access');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return adminAccess === 'true' || user?.isAdmin === true;
  }
  
  static getAdminButtonText() {
    return 'Download PDF (Admin)';
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
      // Check for approved payment first
      const approvedPayment = await this.checkUserApprovedPayment(templateId);
      if (approvedPayment) {
        return 'Download Now';
      }
      
      // Check for pending payment
      const pendingPayment = await this.checkUserPendingPayment(templateId);
      if (pendingPayment) {
        return 'Payment Submitted (Waiting for Approval)';
      }
      
      // Check for downloaded payment (user wants to download again)
      const downloadedPayment = await this.checkUserDownloadedPayment(templateId);
      if (downloadedPayment) {
        return 'Download PDF (PKR 100) - New Download';
      }
      
      // No payment found
      return 'Download PDF (PKR 100)';
    } catch (error) {
      console.error('CleanPaymentService - Error getting user button text:', error);
      return 'Download PDF (PKR 100)';
    }
  }
  
  static async handleUserDownload(templateId) {
    try {
      // Check for approved payment
      const approvedPayment = await this.checkUserApprovedPayment(templateId);
      if (approvedPayment) {
        // Mark payment as used and allow download
        await this.markUserPaymentAsUsed(approvedPayment.id, templateId);
        return { canDownload: true, reason: 'approved_payment' };
      }
      
      // Check for pending payment
      const pendingPayment = await this.checkUserPendingPayment(templateId);
      if (pendingPayment) {
        return { canDownload: false, reason: 'pending_payment' };
      }
      
      // Check for downloaded payment
      const downloadedPayment = await this.checkUserDownloadedPayment(templateId);
      if (downloadedPayment) {
        return { canDownload: false, reason: 'needs_new_payment' };
      }
      
      // No payment found
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