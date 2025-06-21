import React, { useState } from 'react';
import axios from 'axios';

const JazzCashPayment = ({ amount, onPaymentSuccess, onPaymentFailure, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const JAZZCASH_CONFIG = {
    merchantId: process.env.REACT_APP_JAZZCASH_MERCHANT_ID || 'MC12345',
    password: process.env.REACT_APP_JAZZCASH_PASSWORD || 'test123',
    returnUrl: process.env.REACT_APP_JAZZCASH_RETURN_URL || 'https://your-domain.com/payment-success',
    cancelUrl: process.env.REACT_APP_JAZZCASH_CANCEL_URL || 'https://your-domain.com/payment-cancelled',
    currency: 'PKR',
    language: 'EN',
    apiUrl: process.env.REACT_APP_JAZZCASH_API_URL || 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction',
  };

  const generateTransactionId = () => {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
  };

  const createPaymentRequest = async () => {
    console.log('Pay with JazzCash button clicked!');
    setLoading(true);
    setError('');

    try {
      const transactionId = generateTransactionId();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);

      console.log('Generated transaction ID:', transactionId);

      const requestData = {
        pp_MerchantID: JAZZCASH_CONFIG.merchantId,
        pp_Password: JAZZCASH_CONFIG.password,
        pp_ReturnURL: JAZZCASH_CONFIG.returnUrl,
        pp_CancelURL: JAZZCASH_CONFIG.cancelUrl,
        pp_Amount: amount * 100,
        pp_TxnCurrency: JAZZCASH_CONFIG.currency,
        pp_TxnDateTime: new Date().toISOString(),
        pp_BillReference: transactionId,
        pp_Description: 'CV Download Payment',
        pp_TxnExpiryDateTime: expiryDate.toISOString(),
        pp_TxnRefNo: transactionId,
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET',
        pp_Language: JAZZCASH_CONFIG.language,
        pp_ProductID: 'RETL',
        pp_MobileNumber: '',
      };

      setPaymentData({
        ...requestData,
        transactionId,
        amount,
      });

      console.log('Showing payment form...');
      setShowPaymentForm(true);
      setLoading(false);

    } catch (error) {
      console.error('Payment request error:', error);
      setError('Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      // Simulate payment processing for testing
      console.log('Processing payment with data:', {
        mobileNumber: formData.mobileNumber,
        amount: amount,
        transactionId: paymentData.transactionId
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment
      const mockResponse = {
        pp_ResponseCode: '000',
        pp_ResponseMessage: 'Transaction Successful',
        pp_TxnRefNo: paymentData.transactionId,
        pp_Amount: amount * 100,
        pp_TxnCurrency: 'PKR'
      };

      if (mockResponse.pp_ResponseCode === '000') {
        onPaymentSuccess({
          transactionId: paymentData.transactionId,
          amount: amount,
          response: mockResponse,
        });
      } else {
        onPaymentFailure({
          transactionId: paymentData.transactionId,
          error: mockResponse.pp_ResponseMessage || 'Payment failed',
        });
      }

    } catch (error) {
      console.error('Payment submission error:', error);
      setError('Payment failed. Please check your mobile number and try again.');
      setLoading(false);
    }
  };

  const PaymentForm = () => {
    const [formData, setFormData] = useState({
      mobileNumber: '',
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.mobileNumber) {
        setError('Please enter your mobile number.');
        return;
      }
      handlePaymentSubmit(formData);
    };

    return (
      <div style={styles.formContainer}>
        <h3 style={styles.formTitle}>Complete Payment</h3>
        <p style={styles.formSubtitle}>
          Amount: <strong>PKR {amount}</strong>
        </p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Mobile Number *</label>
            <input
              type="tel"
              placeholder="e.g., 03001234567"
              value={formData.mobileNumber}
              onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
              style={styles.input}
              required
            />
            <small style={styles.helpText}>
              Enter the mobile number registered with your JazzCash account
            </small>
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay with JazzCash'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (showPaymentForm) {
    return <PaymentForm />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Download CV</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.pricingCard}>
            <div style={styles.priceHeader}>
              <h3 style={styles.priceTitle}>Professional CV Download</h3>
              <div style={styles.price}>
                <span style={styles.currency}>PKR</span>
                <span style={styles.amount}>{amount}</span>
              </div>
            </div>

            <div style={styles.features}>
              <div style={styles.feature}>
                <span style={styles.checkmark}>✓</span>
                High-quality PDF format
              </div>
              <div style={styles.feature}>
                <span style={styles.checkmark}>✓</span>
                Professional layout
              </div>
              <div style={styles.feature}>
                <span style={styles.checkmark}>✓</span>
                Print-ready design
              </div>
              <div style={styles.feature}>
                <span style={styles.checkmark}>✓</span>
                Instant download
              </div>
            </div>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            <button
              onClick={createPaymentRequest}
              style={styles.payButton}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#047857';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'Initializing...' : 'Pay with JazzCash'}
            </button>

            <p style={styles.secureNote}>
              🔒 Secure payment powered by JazzCash
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },
  content: {
    padding: '24px',
  },
  pricingCard: {
    textAlign: 'center',
  },
  priceHeader: {
    marginBottom: '24px',
  },
  priceTitle: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
  },
  price: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: '4px',
  },
  currency: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#6b7280',
  },
  amount: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#059669',
  },
  features: {
    marginBottom: '24px',
    textAlign: 'left',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    fontSize: '16px',
    color: '#374151',
  },
  checkmark: {
    color: '#059669',
    fontWeight: 'bold',
    marginRight: '8px',
    fontSize: '18px',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  payButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
  },
  secureNote: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  formContainer: {
    padding: '24px',
  },
  formTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
  },
  formSubtitle: {
    margin: '0 0 24px 0',
    fontSize: '16px',
    color: '#6b7280',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '16px',
    transition: 'border-color 0.2s',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  submitButton: {
    flex: 2,
    padding: '12px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
  },
};

export default JazzCashPayment;
