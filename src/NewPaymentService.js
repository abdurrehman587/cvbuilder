// NewPaymentService.js - Version 1.0 - Complete Payment Management System
// Last updated: 2024-12-19 16:00:00
// Unique ID: NEW_PAYMENT_SYSTEM_20241219_1600

import supabase from './supabase';

/**
 * New Payment Service - Complete Payment Management System
 * 
 * Features:
 * - Better error handling and validation
 * - Comprehensive payment status tracking
 * - Admin controls and analytics
 * - Payment history and audit trail
 * - Automatic status updates
 * - Better security and validation
 */

export class NewPaymentService {
  
  // Payment status constants
  static STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved', 
    REJECTED: 'rejected',
    DOWNLOADED: 'downloaded',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
  };

  // Payment methods
  static PAYMENT_METHODS = {
    EASYPAISA: 'easypaisa',
    JAZZCASH: 'jazzcash', 
    SADAPAY: 'sadapay',
    BANK_TRANSFER: 'bank_transfer',
    CASH: 'cash'
  };

  // Template pricing
  static TEMPLATE_PRICING = {
    template1: 100,
    template2: 100,
    template3: 100,
    template4: 100,
    template5: 100,
    template6: 100,
    template7: 100,
    template8: 100,
    template9: 100,
    template10: 100
  };

  /**
   * Initialize the payment service
   */
  static async initialize() {
    try {
      console.log('NewPaymentService - Initializing...');
      
      // Check database connectivity
      const { error } = await supabase
        .from('payments')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('NewPaymentService - Database connection failed:', error);
        throw new Error('Database connection failed');
      }
      
      console.log('NewPaymentService - Initialized successfully');
      return true;
    } catch (error) {
      console.error('NewPaymentService - Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('NewPaymentService - Auth error:', error);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      return user;
    } catch (error) {
      console.error('NewPaymentService - Get current user failed:', error);
      throw error;
    }
  }

  /**
   * Create a new payment request
   */
  static async createPayment(paymentData) {
    try {
      console.log('NewPaymentService - Creating payment:', paymentData);
      
      const user = await this.getCurrentUser();
      
      // Validate payment data
      this.validatePaymentData(paymentData);
      
      // Check if user already has a pending payment for this template
      const existingPending = await this.getPendingPayment(paymentData.templateId);
      if (existingPending) {
        throw new Error('You already have a pending payment for this template');
      }
      
      // Create payment record
      const paymentRecord = {
        user_id: user.id,
        user_email: user.email,
        template_id: paymentData.templateId,
        template_name: paymentData.templateName || `Template ${paymentData.templateId.replace('template', '')}`,
        payment_method: paymentData.method,
        amount: this.TEMPLATE_PRICING[paymentData.templateId] || 100,
        phone_number: paymentData.phoneNumber,
        payment_proof_url: paymentData.proofUrl,
        status: this.STATUS.PENDING,
        download_used: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('NewPaymentService - Inserting payment record:', paymentRecord);
      
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentRecord)
        .select()
        .single();
      
      if (error) {
        console.error('NewPaymentService - Payment creation failed:', error);
        throw error;
      }
      
      console.log('NewPaymentService - Payment created successfully:', data);
      return data;
      
    } catch (error) {
      console.error('NewPaymentService - Create payment failed:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  static async getPayment(paymentId) {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('NewPaymentService - Get payment failed:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('NewPaymentService - Get payment failed:', error);
      throw error;
    }
  }

  /**
   * Get all payments for current user
   */
  static async getUserPayments(templateId = null) {
    try {
      const user = await this.getCurrentUser();
      
      let query = supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (templateId) {
        query = query.eq('template_id', templateId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('NewPaymentService - Get user payments failed:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('NewPaymentService - Get user payments failed:', error);
      throw error;
    }
  }

  /**
   * Get pending payment for template
   */
  static async getPendingPayment(templateId) {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('template_id', templateId)
        .eq('status', this.STATUS.PENDING)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('NewPaymentService - Get pending payment failed:', error);
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('NewPaymentService - Get pending payment failed:', error);
      return null;
    }
  }

  /**
   * Get approved payment for template
   */
  static async getApprovedPayment(templateId) {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('template_id', templateId)
        .eq('status', this.STATUS.APPROVED)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('NewPaymentService - Get approved payment failed:', error);
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('NewPaymentService - Get approved payment failed:', error);
      return null;
    }
  }

  /**
   * Get download count for template
   */
  static async getDownloadCount(templateId) {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('cv_downloads')
        .select('id')
        .eq('user_email', user.email)
        .eq('template_id', templateId);
      
      if (error) {
        console.error('NewPaymentService - Get download count failed:', error);
        throw error;
      }
      
      return data ? data.length : 0;
    } catch (error) {
      console.error('NewPaymentService - Get download count failed:', error);
      return 0;
    }
  }

  /**
   * Mark payment as downloaded
   */
  static async markPaymentAsDownloaded(paymentId, templateId) {
    try {
      const user = await this.getCurrentUser();
      
      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: this.STATUS.DOWNLOADED,
          download_used: true,
          downloaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('NewPaymentService - Update payment status failed:', updateError);
        throw updateError;
      }
      
      // Record download
      const { data: download, error: downloadError } = await supabase
        .from('cv_downloads')
        .insert({
          user_id: user.id,
          user_email: user.email,
          template_id: templateId,
          payment_id: paymentId,
          downloaded_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (downloadError) {
        console.error('NewPaymentService - Record download failed:', downloadError);
        throw downloadError;
      }
      
      console.log('NewPaymentService - Payment marked as downloaded:', updatedPayment);
      return { payment: updatedPayment, download };
      
    } catch (error) {
      console.error('NewPaymentService - Mark payment as downloaded failed:', error);
      throw error;
    }
  }

  /**
   * Get download button text based on payment status
   */
  static async getDownloadButtonText(templateId, isAdminUser = false) {
    try {
      if (isAdminUser) {
        return 'Download PDF (Admin)';
      }
      
      // Check for approved payment first
      const approvedPayment = await this.getApprovedPayment(templateId);
      if (approvedPayment) {
        return 'Download Now';
      }
      
      // Check for pending payment
      const pendingPayment = await this.getPendingPayment(templateId);
      if (pendingPayment) {
        return 'Payment Submitted (Waiting for Approval)';
      }
      
      // Check download count
      const downloadCount = await this.getDownloadCount(templateId);
      if (downloadCount > 0) {
        if (downloadCount === 1) {
          return 'Downloaded (1 time)';
        } else {
          return `Downloaded (${downloadCount} times)`;
        }
      }
      
      // No payment found - show payment option
      return 'Download PDF (PKR 100)';
      
    } catch (error) {
      console.error('NewPaymentService - Get download button text failed:', error);
      return 'Download PDF (PKR 100)';
    }
  }

  /**
   * Check if user can download CV
   */
  static async canDownload(templateId) {
    try {
      const approvedPayment = await this.getApprovedPayment(templateId);
      return !!approvedPayment;
    } catch (error) {
      console.error('NewPaymentService - Can download check failed:', error);
      return false;
    }
  }

  /**
   * Check if user has pending payment
   */
  static async hasPendingPayment(templateId) {
    try {
      const pendingPayment = await this.getPendingPayment(templateId);
      return !!pendingPayment;
    } catch (error) {
      console.error('NewPaymentService - Has pending payment check failed:', error);
      return false;
    }
  }

  /**
   * Validate payment data
   */
  static validatePaymentData(paymentData) {
    if (!paymentData.templateId) {
      throw new Error('Template ID is required');
    }
    
    if (!paymentData.method) {
      throw new Error('Payment method is required');
    }
    
    if (!Object.values(this.PAYMENT_METHODS).includes(paymentData.method)) {
      throw new Error('Invalid payment method');
    }
    
    if (!paymentData.phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(paymentData.phoneNumber)) {
      throw new Error('Phone number must be 11 digits');
    }
  }

  /**
   * Admin functions
   */
  
  /**
   * Get all payments (admin only)
   */
  static async getAllPayments() {
    try {
      // Check admin access
      const adminAccess = localStorage.getItem('admin_cv_access');
      if (adminAccess !== 'true') {
        throw new Error('Admin access required');
      }
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('NewPaymentService - Get all payments failed:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('NewPaymentService - Get all payments failed:', error);
      throw error;
    }
  }

  /**
   * Update payment status (admin only)
   */
  static async updatePaymentStatus(paymentId, status, adminNotes = '') {
    try {
      // Check admin access
      const adminAccess = localStorage.getItem('admin_cv_access');
      if (adminAccess !== 'true') {
        throw new Error('Admin access required');
      }
      
      // Validate status
      if (!Object.values(this.STATUS).includes(status)) {
        throw new Error('Invalid payment status');
      }
      
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();
      
      if (error) {
        console.error('NewPaymentService - Update payment status failed:', error);
        throw error;
      }
      
      console.log('NewPaymentService - Payment status updated:', data);
      return data;
    } catch (error) {
      console.error('NewPaymentService - Update payment status failed:', error);
      throw error;
    }
  }

  /**
   * Delete payment (admin only)
   */
  static async deletePayment(paymentId) {
    try {
      // Check admin access
      const adminAccess = localStorage.getItem('admin_cv_access');
      if (adminAccess !== 'true') {
        throw new Error('Admin access required');
      }
      
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) {
        console.error('NewPaymentService - Delete payment failed:', error);
        throw error;
      }
      
      console.log('NewPaymentService - Payment deleted successfully');
      return true;
    } catch (error) {
      console.error('NewPaymentService - Delete payment failed:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics (admin only)
   */
  static async getPaymentStats() {
    try {
      // Check admin access
      const adminAccess = localStorage.getItem('admin_cv_access');
      if (adminAccess !== 'true') {
        throw new Error('Admin access required');
      }
      
      const { data, error } = await supabase
        .from('payments')
        .select('status, amount, created_at');
      
      if (error) {
        console.error('NewPaymentService - Get payment stats failed:', error);
        throw error;
      }
      
      const stats = {
        total: data.length,
        totalAmount: data.reduce((sum, payment) => sum + parseFloat(payment.amount), 0),
        pending: data.filter(p => p.status === this.STATUS.PENDING).length,
        approved: data.filter(p => p.status === this.STATUS.APPROVED).length,
        downloaded: data.filter(p => p.status === this.STATUS.DOWNLOADED).length,
        rejected: data.filter(p => p.status === this.STATUS.REJECTED).length
      };
      
      return stats;
    } catch (error) {
      console.error('NewPaymentService - Get payment stats failed:', error);
      throw error;
    }
  }

  /**
   * Debug function
   */
  static async debugPaymentStatus(templateId) {
    try {
      const user = await this.getCurrentUser();
      
      const pendingPayment = await this.getPendingPayment(templateId);
      const approvedPayment = await this.getApprovedPayment(templateId);
      const downloadCount = await this.getDownloadCount(templateId);
      const buttonText = await this.getDownloadButtonText(templateId);
      
      const result = {
        user: user.email,
        templateId,
        pendingPayment,
        approvedPayment,
        downloadCount,
        buttonText,
        canDownload: await this.canDownload(templateId),
        hasPending: await this.hasPendingPayment(templateId)
      };
      
      console.log('NewPaymentService - Debug result:', result);
      return result;
    } catch (error) {
      console.error('NewPaymentService - Debug failed:', error);
      throw error;
    }
  }
}

export default NewPaymentService; 