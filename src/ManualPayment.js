import React, { useState } from 'react';
import { PaymentService } from './paymentService';
import PropTypes from 'prop-types';

const ManualPayment = ({ amount, templateId, templateName, onPaymentSuccess, onPaymentFailure, onClose }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    {
      id: 'easypaisa',
      name: 'EasyPaisa', 
      number: '03406892728',
      icon: '📱',
      color: '#00A651'
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      number: '03153338612',
      icon: '📱',
      color: '#00A651'
    },
    {
      id: 'sadapay',
      name: 'SadaPay',
      number: '03153338612',
      icon: '📱',
      color: '#00A651'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      details: {
        bank: 'Meezan Bank',
        accountTitle: 'Abdul Rehman',
        accountNumber: '02180100520304',
        iban: 'PK72MEZN0002180100520304'
      },
      icon: '🏦',
      color: '#1E40AF'
    }
  ];



  const handleSubmit = async () => {
    
    if (!selectedMethod || !phoneNumber) {
      alert('Please select payment method and enter phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload proof file to Supabase storage (simplified for now)
      // In a real implementation, you would upload the file to Supabase storage
      // Placeholder for actual file upload functionality
      
      // Submit payment to Supabase
      const paymentData = {
        templateId: templateId,
        method: selectedMethod,
        amount: amount
      };
      
      const payment = await PaymentService.submitPayment(paymentData);
      
      // Show success message
      alert(`Payment proof submitted successfully!\n\nPayment ID: ${payment.id}\n\nPlease wait for manual verification. You will be able to download your CV once approved by admin.`);
      
      onPaymentSuccess({
        paymentId: payment.id,
        method: selectedMethod,
        amount: amount
      });
      
    } catch (error) {
      console.error('Payment submission failed:', error);
      
      // Show more specific error messages
      let errorMessage = 'Failed to submit payment proof. Please try again.';
      
      if (error.message === 'User not authenticated') {
        errorMessage = 'Please sign in to submit payment proof.';
      } else if (error.message === 'Database not ready. Please contact support.') {
        errorMessage = 'Database not ready. Please contact support or check database setup.';
      } else if (error.message && error.message.includes('relation "payments" does not exist')) {
        errorMessage = 'Database tables not found. Please run the SQL schema in Supabase first.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
      onPaymentFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy. Please copy manually.');
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #f59e0b'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#92400e' }}>
            Pay Rs. 100 to any of these Accounts
          </div>
        </div>

        {/* Amount Display */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #22c55e'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>
            Amount to Pay: PKR {amount}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
            CV Download Fee
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333', fontSize: '1.1rem' }}>
            Choose Payment Method:
          </h3>
          
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              style={{
                border: selectedMethod === method.id ? '2px solid #22c55e' : '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '10px',
                cursor: 'pointer',
                backgroundColor: selectedMethod === method.id ? '#f0fdf4' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{method.icon}</span>
                <span style={{ fontWeight: 'bold', color: '#333' }}>{method.name}</span>
              </div>
              
              {method.id === 'bank' ? (
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  <div><strong>Bank:</strong> {method.details.bank}</div>
                  <div><strong>Account Title:</strong> {method.details.accountTitle}</div>
                  <div><strong>Account Number:</strong> {method.details.accountNumber}</div>
                  <div><strong>IBAN:</strong> {method.details.iban}</div>
                </div>
              ) : (
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  <strong>Number:</strong> {method.number}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(method.number);
                    }}
                    style={{
                      marginLeft: '10px',
                      padding: '2px 8px',
                      fontSize: '0.8rem',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Phone Number Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Your Phone Number (for verification):
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="03XX-XXXXXXX"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
        </div>




        
        {/* Form Status */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          <strong>Form Status:</strong>
          <div style={{ marginTop: '8px' }}>
            <div style={{ color: selectedMethod ? '#22c55e' : '#ef4444' }}>
              {selectedMethod ? '✅' : '❌'} Payment Method: {selectedMethod || 'Not selected'}
            </div>
            <div style={{ color: phoneNumber ? '#22c55e' : '#ef4444' }}>
              {phoneNumber ? '✅' : '❌'} Phone Number: {phoneNumber || 'Not entered'}
            </div>
            <div style={{ 
              color: (selectedMethod && phoneNumber) ? '#22c55e' : '#f59e0b',
              fontWeight: 'bold',
              marginTop: '8px'
            }}>
              {selectedMethod && phoneNumber ? '✅ Ready to Submit' : '⚠️ Please complete all fields'}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedMethod || !phoneNumber}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSubmitting || !selectedMethod || !phoneNumber ? '#ccc' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: isSubmitting || !selectedMethod || !phoneNumber ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment'}
        </button>
        


        {/* Footer */}
        <div style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#22c55e',
          padding: '15px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '2px solid #22c55e'
        }}>
          Need help? Contact: 03153338612
        </div>
      </div>
    </div>
  );
};

ManualPayment.propTypes = {
  amount: PropTypes.number.isRequired,
  templateId: PropTypes.string.isRequired,
  templateName: PropTypes.string.isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
  onPaymentFailure: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ManualPayment;