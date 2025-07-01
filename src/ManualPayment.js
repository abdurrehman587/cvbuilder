import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ManualPayment = ({ amount, onPaymentSuccess, onPaymentFailure, onClose }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [proofFile, setProofFile] = useState(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setProofFile(file);
    } else {
      alert('Please select an image file (JPG, PNG, etc.)');
    }
  };

  const handleSubmit = async () => {
    console.log('=== PAYMENT SUBMISSION START ===');
    console.log('ManualPayment - handleSubmit called');
    console.log('ManualPayment - selectedMethod:', selectedMethod);
    console.log('ManualPayment - proofFile:', proofFile);
    console.log('ManualPayment - phoneNumber:', phoneNumber);
    console.log('ManualPayment - amount:', amount);
    console.log('ManualPayment - isSubmitting:', isSubmitting);
    
    if (!selectedMethod || !proofFile || !phoneNumber) {
      console.log('ManualPayment - Missing required fields');
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    console.log('ManualPayment - Starting payment submission');

    try {
      // Here you would typically upload the proof to your server
      // For now, we'll simulate the process
      
      // Create a unique payment ID
      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('ManualPayment - Generated payment ID:', paymentId);
      
      // Simulate server upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store payment info in localStorage for tracking
      const paymentInfo = {
        id: paymentId,
        method: selectedMethod,
        amount: amount,
        phoneNumber: phoneNumber,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      console.log('ManualPayment - Storing payment info:', paymentInfo);
      localStorage.setItem(`payment_${paymentId}`, JSON.stringify(paymentInfo));
      
      // Verify the payment was stored correctly
      const storedPayment = localStorage.getItem(`payment_${paymentId}`);
      console.log('ManualPayment - Verification - stored payment:', storedPayment);
      console.log('ManualPayment - Verification - localStorage keys after storage:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('payment_')) {
          console.log('ManualPayment - Found payment key:', key);
        }
      }
      
      // Show success message
      alert(`Payment proof submitted successfully!\n\nPayment ID: ${paymentId}\n\nPlease wait for manual verification. You will be able to download your CV once approved by admin.`);
      
      console.log('ManualPayment - Calling onPaymentSuccess');
      console.log('ManualPayment - Payment data being passed:', {
        paymentId,
        method: selectedMethod,
        amount: amount
      });
      onPaymentSuccess({
        paymentId,
        method: selectedMethod,
        amount: amount
      });
      console.log('=== PAYMENT SUBMISSION COMPLETE ===');
      
    } catch (error) {
      console.error('Payment submission failed:', error);
      alert('Failed to submit payment proof. Please try again.');
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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #22c55e',
          paddingBottom: '10px'
        }}>
          <h2 style={{
            margin: 0,
            color: '#22c55e',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            💳 Manual Payment
          </h2>
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

        {/* Proof Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Upload Payment Proof (Screenshot/Receipt):
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
          {proofFile && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f0fdf4',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: '#22c55e'
            }}>
              ✓ File selected: {proofFile.name}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          <strong>Instructions:</strong>
          <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li>Send PKR {amount} to the selected payment method</li>
            <li>Take a screenshot or photo of the payment receipt</li>
            <li>Upload the proof above</li>
            <li>Click "Submit Payment Proof"</li>
            <li>Wait for verification (usually within 1-2 hours)</li>
          </ol>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedMethod || !proofFile || !phoneNumber}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSubmitting || !selectedMethod || !proofFile || !phoneNumber ? '#ccc' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: isSubmitting || !selectedMethod || !proofFile || !phoneNumber ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment Proof'}
        </button>

        {/* Footer */}
        <div style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#666'
        }}>
          Need help? Contact: abdurrehman587@gmail.com
        </div>
      </div>
    </div>
  );
};

ManualPayment.propTypes = {
  amount: PropTypes.number.isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
  onPaymentFailure: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ManualPayment; 