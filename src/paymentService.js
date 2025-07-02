import supabase from './supabase';

// Payment Service using Supabase
export class PaymentService {
  
  // Check if database is ready
  static async checkDatabaseReady() {
    try {
      // First check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Database check - no authenticated user');
        return false;
      }

      // Try to query the payments table
      const { data, error } = await supabase
        .from('payments')
        .select('id')
        .limit(1);
      
      // If there's an error, check if it's a table not found error
      if (error) {
        if (error.message && error.message.includes('relation "payments" does not exist')) {
          console.error('Database not ready - payments table does not exist');
          return false;
        }
        // For other errors (like RLS), we'll assume the table exists
        console.log('Database check - table exists but query failed (likely RLS):', error.message);
        return true;
      }
      
      // If we get here, the table exists (even if empty)
      console.log('Database is ready - payments table exists and accessible');
      return true;
    } catch (error) {
      console.error('Database not ready - exception:', error);
      return false;
    }
  }

  // Submit a new payment
  static async submitPayment(paymentData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        throw new Error('Database not ready. Please contact support.');
      }

      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_email: user.email,
          template_id: paymentData.templateId,
          amount: paymentData.amount,
          payment_method: paymentData.method,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting payment:', error);
        throw error;
      }

      console.log('Payment submitted successfully:', data);
      return data;
    } catch (error) {
      console.error('Payment submission failed:', error);
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

      // First check if there's an approved payment
      const { data: approvedPayment, error: approvedError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (approvedError && approvedError.code !== 'PGRST116') {
        console.error('Error checking approved payment:', approvedError);
        throw approvedError;
      }

      if (!approvedPayment) {
        console.log('No approved payment found');
        return null;
      }

      // Check if this payment has been used for download
      const { data: download, error: downloadError } = await supabase
        .from('cv_downloads')
        .select('*')
        .eq('payment_id', approvedPayment.id)
        .limit(1)
        .single();

      if (downloadError && downloadError.code !== 'PGRST116') {
        console.error('Error checking download:', downloadError);
        throw downloadError;
      }

      // If no download record exists, payment is still available
      if (!download) {
        console.log('Approved payment found and not used:', approvedPayment);
        return approvedPayment;
      }

      console.log('Approved payment found but already used');
      return null;
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

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', user.email)
        .eq('template_id', templateId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pending payment:', error);
        throw error;
      }

      console.log('Pending payment check result:', data);
      return data || null;
    } catch (error) {
      console.error('Error checking pending payment:', error);
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

      // Record the download
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
      console.error('Error marking payment as used:', error);
      throw error;
    }
  }

  // Get download button text based on payment status
  static async getDownloadButtonText(templateId, isAdminUser = false) {
    if (isAdminUser) {
      return 'Download PDF (Admin)';
    }

    try {
      const approvedPayment = await this.checkApprovedPayment(templateId);
      if (approvedPayment) {
        return 'Payment Approved (Download Now)';
      }

      const pendingPayment = await this.checkPendingPayment(templateId);
      if (pendingPayment) {
        return 'Payment Submitted (Waiting for Approval)';
      }

      return 'Download PDF (PKR 100)';
    } catch (error) {
      console.error('Error getting download button text:', error);
      return 'Download PDF (PKR 100)';
    }
  }

  // Get all payments for admin
  static async getAllPayments() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'admin@cvbuilder.com') {
        throw new Error('Admin access required');
      }

      // Check if database is ready
      const dbReady = await this.checkDatabaseReady();
      if (!dbReady) {
        throw new Error('Database not ready');
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting all payments:', error);
      throw error;
    }
  }

  // Update payment status (admin only)
  static async updatePaymentStatus(paymentId, status) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'admin@cvbuilder.com') {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'admin@cvbuilder.com') {
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
          pendingPayment: null
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

      const approvedPayment = await this.checkApprovedPayment(templateId);
      const pendingPayment = await this.checkPendingPayment(templateId);

      console.log(`Template ${templateId}:`);
      console.log('- Has approved payment:', !!approvedPayment);
      console.log('- Has pending payment:', !!pendingPayment);

      return {
        user: user.email,
        databaseReady: true,
        payments: payments,
        approvedPayment: approvedPayment,
        pendingPayment: pendingPayment
      };
    } catch (error) {
      console.error('Error in debug payment status:', error);
      return null;
    }
  }
} 