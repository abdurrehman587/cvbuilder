import React, { useState } from 'react';
import { CleanPaymentService } from './cleanPaymentService';
import { toast } from 'react-toastify';

const CleanPaymentModal = ({ 
  isOpen, 
  onClose, 
  templateId, 
  onPaymentSuccess,
  onPaymentError 
}) => {
  const [formData, setFormData] = useState({
    method: 'easypaisa',
    phoneNumber: '',
    amount: 100
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    { value: 'easypaisa', label: 'EasyPaisa' },
    { value: 'jazzcash', label: 'JazzCash' },
    { value: 'sadapay', label: 'SadaPay' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const paymentData = {
        templateId,
        method: formData.method,
        phoneNumber: formData.phoneNumber,
        amount: formData.amount
      };

      const result = await CleanPaymentService.submitUserPayment(paymentData);
      
      console.log('CleanPaymentModal - Payment submitted successfully:', result);
      
      toast.success('Payment submitted successfully! Please wait for admin approval.');
      
      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
      
      onClose();
    } catch (error) {
      console.error('CleanPaymentModal - Payment submission failed:', error);
      
      const errorMessage = error.message || 'Failed to submit payment. Please try again.';
      toast.error(errorMessage);
      
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Payment for Template {templateId.replace('template', '')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Payment Method
            </label>
            <select
              name="method"
              value={formData.method}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Amount (PKR)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              readOnly
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '16px',
                cursor: 'pointer'
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <strong>Note:</strong> After submitting payment, please wait for admin approval. 
          You will be able to download your CV once the payment is approved.
        </div>
      </div>
    </div>
  );
};

export default CleanPaymentModal; 