import supabase from './supabase';

// Payment Service using Supabase
export class PaymentService {
  
  // Check if database is ready
  static async checkDatabaseReady() {
    try {
      console.log('PaymentService - checkDatabaseReady called');
      
      // For admin access, we don't need to check user authentication
      // Just try to query the payments table directly
      console.log('PaymentService - Testing database connection...');
      
      const { error } = await supabase
        .from('payments')
        .select('id')
        .limit(1);
      
      // If there's an error, check if it's a table not found error
      if (error) {
        if (error.message && error.message.includes('relation "payments" does not exist')) {
          console.error('PaymentService - Database not ready - payments table does not exist');
          return false;
        }
        // For other errors (like RLS), we'll assume the table exists
        console.log('PaymentService - Database check - table exists but query failed (likely RLS):', error.message);
        return true;
      }
      
      // If we get here, the table exists (even if empty)
      console.log('PaymentService - Database is ready - payments table exists and accessible');
      return true;
    } catch (error) {
      console.error('PaymentService - Database not ready - exception:', error);
      return false;
    }
  }

  // Submit a new payment
  static async submitPayment(paymentData) {
    try {
      console.log('PaymentService - submitPayment called with:', paymentData);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('PaymentService - Current user:', user);
      
      if (!user) {
        console.error('PaymentService - No authenticated user');
        throw new Error('User not authenticated');
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      console.log('PaymentService - Database ready for submission:', dbReady);
      
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
      
      console.log('PaymentService - Inserting payment record:', paymentRecord);

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentRecord)
        .select()
        .single();

      if (error) {
        console.error('PaymentService - Error submitting payment:', error);
        throw error;
      }

      console.log('PaymentService - Payment submitted successfully:', data);
      return data;
    } catch (error) {
      console.error('PaymentService - Payment submission failed:', error);
      throw error;
    }
  }

  // Check if user has an approved payment for a template
  static async checkApprovedPayment(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user for approved payment check');
        return null;
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        console.log('Database not ready, returning null for approved payment');
        return null;
      }

      console.log('PaymentService - Checking approved payment for:', {
        user: user.email,
        templateId,
        status: 'approved'
      });

      // First try to get all payments for this user and template to debug
      const { data: allPayments, error: allError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('Error getting all payments for debug:', allError);
      } else {
        console.log('PaymentService - All payments for user and template (approved check):', allPayments);
      }

      // Check if there's an approved payment (status = 'approved' means it's available for download)
      const { data: approvedPayment, error: approvedError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (approvedError) {
        console.error('Error checking approved payment:', approvedError);
        // Don't throw error, just return null
        return null;
      }

      if (!approvedPayment) {
        console.log('No approved payment found');
        return null;
      }

      console.log('Approved payment found:', approvedPayment);
      return approvedPayment;
    } catch (error) {
      console.error('Error checking approved payment:', error);
      return null;
    }
  }

  // Check if user has a pending payment for a template
  static async checkPendingPayment(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user for pending payment check');
        return null;
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        console.log('Database not ready, returning null for pending payment');
        return null;
      }

      console.log('PaymentService - Checking pending payment for:', {
        user: user.email,
        templateId,
        status: 'pending'
      });

      // First try to get all payments for this user and template to debug
      const { data: allPayments, error: allError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('Error getting all payments for debug:', allError);
      } else {
        console.log('PaymentService - All payments for user and template:', allPayments);
      }

      // Now check for pending payment
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking pending payment:', error);
        // Don't throw error, just return null
        return null;
      }

      console.log('Pending payment check result:', data);
      return data || null;
    } catch (error) {
      console.error('Error checking pending payment:', error);
      return null;
    }
  }

  // Check if user has downloaded the CV for a template
  static async checkDownloadedPayment(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user for download check');
        return null;
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        console.log('Database not ready, returning null for download check');
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
        console.error('Error checking downloads:', error);
        return null;
      }

      // Return the most recent download if any exist
      const result = downloads && downloads.length > 0 ? downloads[0] : null;
      console.log('Download check result:', result);
      return result;
    } catch (error) {
      console.error('Error checking downloads:', error);
      return null;
    }
  }

  // Mark payment as used and record download
  static async markPaymentAsUsed(paymentId, templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        throw new Error('Database not ready');
      }

      // Keep payment status as 'approved' - don't change it to 'downloaded'
      // Instead, just record the download in cv_downloads table
      const { data: download, error: downloadError } = await supabase
        .from('cv_downloads')
        .insert({
          user_email: user.email,
          template_id: templateId,
          payment_id: paymentId
        })
        .select()
        .single();

      if (downloadError) {
        console.error('Error recording download:', downloadError);
        throw downloadError;
      }

      console.log('Download recorded successfully:', download);
      return download;
    } catch (error) {
      console.error('Error recording download:', error);
      throw error;
    }
  }

  // Get download count for a template
  static async getDownloadCount(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user for download count check');
        return 0;
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        console.log('Database not ready, returning 0 for download count');
        return 0;
      }

      const { count, error } = await supabase
        .from('cv_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', user.email)
        .eq('template_id', templateId);

      if (error) {
        console.error('Error getting download count:', error);
        return 0;
      }

      console.log('Download count for template:', count);
      return count || 0;
    } catch (error) {
      console.error('Error getting download count:', error);
      return 0;
    }
  }

  // Get download button text based on payment status
  static async getDownloadButtonText(templateId, isAdminUser = false) {
    if (isAdminUser) {
      return 'Download PDF (Admin)';
    }

    try {
      // First check for approved payment (most important) - if approved, user can always download
      const approvedPayment = await this.checkApprovedPayment(templateId);
      if (approvedPayment) {
        // Check download count to show appropriate text
        const downloadCount = await this.getDownloadCount(templateId);
        if (downloadCount === 0) {
          return 'Download Now';
        } else if (downloadCount === 1) {
          return 'Download Again';
        } else {
          return `Download Again (${downloadCount} times downloaded)`;
        }
      }

      // Then check for pending payment
      const pendingPayment = await this.checkPendingPayment(templateId);
      if (pendingPayment) {
        return 'Payment Submitted (Waiting for Approval)';
      }

      // Then check download count (but no approved payment)
      const downloadCount = await this.getDownloadCount(templateId);
      if (downloadCount > 0) {
        return 'Download PDF (PKR 100) - New Payment Required';
      }

      // No payment found - show payment option
      return 'Download PDF (PKR 100)';
    } catch (error) {
      console.error('Error getting download button text:', error);
      return 'Download PDF (PKR 100)';
    }
  }

  // Get all payments for admin
  static async getAllPayments() {
    try {
      console.log('PaymentService - getAllPayments called');
      
      // Check admin access from localStorage instead of Supabase auth
      const adminAccess = localStorage.getItem('admin_cv_access');
      const adminUserStr = localStorage.getItem('admin_user');
      let adminUser = {};
      
      try {
        adminUser = adminUserStr ? JSON.parse(adminUserStr) : {};
      } catch (parseError) {
        console.error('PaymentService - Error parsing admin user:', parseError);
        adminUser = {};
      }
      
      const isAdmin = adminAccess === 'true' || adminUser?.isAdmin === true;
      
      console.log('PaymentService - Admin check:', {
        adminAccess,
        adminUser,
        isAdmin,
        adminUserStr
      });
      
      if (!isAdmin) {
        console.error('PaymentService - Admin access denied. Current localStorage state:', {
          admin_cv_access: localStorage.getItem('admin_cv_access'),
          admin_user: localStorage.getItem('admin_user'),
          allKeys: Object.keys(localStorage)
        });
        throw new Error('Admin access required');
      }

      console.log('PaymentService - Admin access granted, checking database...');

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      console.log('PaymentService - Database ready:', dbReady);
      
      if (!dbReady) {
        throw new Error('Database not ready');
      }

      console.log('PaymentService - Fetching payments from Supabase...');
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('PaymentService - Error fetching payments:', error);
        throw error;
      }

      console.log('PaymentService - Payments fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('PaymentService - Error getting all payments:', error);
      throw error;
    }
  }

  // Update payment status (admin only)
  static async updatePaymentStatus(paymentId, status) {
    try {
      // Check admin access from localStorage instead of Supabase auth
      const adminAccess = localStorage.getItem('admin_cv_access');
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const isAdmin = adminAccess === 'true' || adminUser?.isAdmin === true;
      
      if (!isAdmin) {
        throw new Error('Admin access required');
      }

      // Check if database is ready
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
        console.error('Error updating payment status:', error);
        throw error;
      }

      console.log('Payment status updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Delete payment (admin only)
  static async deletePayment(paymentId) {
    try {
      // Check admin access from localStorage instead of Supabase auth
      const adminAccess = localStorage.getItem('admin_cv_access');
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const isAdmin = adminAccess === 'true' || adminUser?.isAdmin === true;
      
      if (!isAdmin) {
        throw new Error('Admin access required');
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        throw new Error('Database not ready');
      }

      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        console.error('Error deleting payment:', error);
        throw error;
      }

      console.log('Payment deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }



  // Debug function to check payment status
  static async debugPaymentStatus(templateId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user');
        return null;
      }

      console.log('=== SUPABASE PAYMENT STATUS DEBUG ===');
      console.log('Current user:', user.email);

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      console.log('Database ready:', dbReady);

      if (!dbReady) {
        console.log('Database not ready - cannot fetch payments');
        return {
          user: user.email,
          databaseReady: false,
          payments: [],
          approvedPayment: null,
          pendingPayment: null,
          downloadedPayment: null
        };
      }

      // Get all payments for this user and template
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return null;
      }

      console.log('All payments for user and template:', payments);

      // Check specific payment types
      const approvedPayment = await this.checkApprovedPayment(templateId);
      const pendingPayment = await this.checkPendingPayment(templateId);
      const downloadedPayment = await this.checkDownloadedPayment(templateId);
      const downloadCount = await this.getDownloadCount(templateId);

      const result = {
        user: user.email,
        databaseReady: true,
        payments: payments,
        approvedPayment: approvedPayment,
        pendingPayment: pendingPayment,
        downloadedPayment: downloadedPayment,
        downloadCount: downloadCount,
        buttonText: await this.getDownloadButtonText(templateId, false)
      };

      console.log('=== DEBUG RESULT ===');
      console.log('User:', result.user);
      console.log('All payments:', result.payments);
      console.log('Approved payment:', result.approvedPayment);
      console.log('Pending payment:', result.pendingPayment);
      console.log('Downloaded payment:', result.downloadedPayment);
      console.log('Download count:', result.downloadCount);
      console.log('Button text:', result.buttonText);
      console.log('=== END DEBUG ===');

      return result;
    } catch (error) {
      console.error('Error in debug function:', error);
      return null;
    }
  }
} 