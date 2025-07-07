// NewPaymentModal.js - Version 1.0 - Enhanced Payment Modal
// Last updated: 2024-12-19 16:00:00
// Unique ID: NEW_PAYMENT_MODAL_20241219_1600

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { NewPaymentService } from './NewPaymentService';

const NewPaymentModal = ({ 
  isOpen, 
  onClose, 
  templateId, 
  templateName, 
  onPaymentSuccess, 
  onPaymentFailure 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Select method, 2: Payment details, 3: Upload proof

  const paymentMethods = [
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      number: '03406892728',
      icon: '📱',
      color: '#00A651',
      instructions: [
        'Send PKR 100 to 03406892728',
        'Take a screenshot of the payment',
        'Upload the screenshot below'
      ]
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      number: '03153338612',
      icon: '📱',
      color: '#00A651',
      instructions: [
        'Send PKR 100 to 03153338612',
        'Take a screenshot of the payment',
        'Upload the screenshot below'
      ]
    },
    {
      id: 'sadapay',
      name: 'SadaPay',
      number: '03153338612',
      icon: '📱',
      color: '#00A651',
      instructions: [
        'Send PKR 100 to 03153338612',
        'Take a screenshot of the payment',
        'Upload the screenshot below'
      ]
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      details: {
        bank: 'Meezan Bank',
        accountTitle: 'Abdul Rehman',
        accountNumber: '02180100520304',
        iban: 'PK72MEZN0002180100520304'
      },
      icon: '🏦',
      color: '#1E40AF',
      instructions: [
        'Transfer PKR 100 to the bank account',
        'Take a screenshot of the transfer receipt',
        'Upload the screenshot below'
      ]
    }
  ];

  const selectedMethodData = paymentMethods.find(method => method.id === selectedMethod);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedMethod('');
      setPhoneNumber('');
      setProofFile(null);
      setErrors({});
    }
  }, [isOpen]);

  const validateStep = () => {
    const newErrors = {};

    if (step === 1 && !selectedMethod) {
      newErrors.method = 'Please select a payment method';
    }

    if (step === 2) {
      if (!phoneNumber) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!/^[0-9]{11}$/.test(phoneNumber)) {
        newErrors.phoneNumber = 'Phone number must be 11 digits';
      }
    }

    if (step === 3 && !proofFile) {
      newErrors.proofFile = 'Please upload payment proof';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          setProofFile(file);
          setErrors(prev => ({ ...prev, proofFile: '' }));
        } else {
          setErrors(prev => ({ ...prev, proofFile: 'File size must be less than 5MB' }));
        }
      } else {
        setErrors(prev => ({ ...prev, proofFile: 'Please select an image file (JPG, PNG, etc.)' }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, you would upload the file to Supabase storage
      // For now, we'll simulate the upload
      const proofUrl = `https://example.com/proofs/${Date.now()}_${proofFile.name}`;

      const paymentData = {
        templateId,
        templateName,
        method: selectedMethod,
        phoneNumber,
        proofUrl
      };

      const payment = await NewPaymentService.createPayment(paymentData);

      onPaymentSuccess({
        paymentId: payment.id,
        method: selectedMethod,
        amount: payment.amount
      });

    } catch (error) {
      console.error('Payment submission failed:', error);
      
      let errorMessage = 'Failed to submit payment. Please try again.';
      
      if (error.message.includes('pending payment')) {
        errorMessage = 'You already have a pending payment for this template.';
      } else if (error.message.includes('Phone number')) {
        errorMessage = error.message;
      } else if (error.message.includes('Invalid payment method')) {
        errorMessage = 'Please select a valid payment method.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onPaymentFailure(new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedMethod(method.id)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{method.icon}</span>
              <div>
                <h4 className="font-medium">{method.name}</h4>
                <p className="text-sm text-gray-600">
                  {method.number || `${method.details?.bank} - ${method.details?.accountNumber}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {errors.method && (
        <p className="text-red-500 text-sm mt-2">{errors.method}</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Payment Instructions:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {selectedMethodData?.instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Phone Number *
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            setErrors(prev => ({ ...prev, phoneNumber: '' }));
          }}
          placeholder="03001234567"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.phoneNumber && (
          <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3 className="text-lg font-semibold mb-4">Upload Payment Proof</h3>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Payment Summary:</h4>
        <div className="space-y-1 text-sm">
          <p><strong>Template:</strong> {templateName}</p>
          <p><strong>Amount:</strong> PKR 100</p>
          <p><strong>Method:</strong> {selectedMethodData?.name}</p>
          <p><strong>Phone:</strong> {phoneNumber}</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Payment Screenshot *
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.proofFile && (
          <p className="text-red-500 text-sm mt-1">{errors.proofFile}</p>
        )}
        {proofFile && (
          <p className="text-green-600 text-sm mt-1">✓ File selected: {proofFile.name}</p>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Note:</strong> After submitting, please wait for admin approval (usually 1-2 hours).</p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Payment for {templateName}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {renderStepContent()}

          <div className="flex justify-between mt-6">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
            )}
            
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

NewPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  templateId: PropTypes.string.isRequired,
  templateName: PropTypes.string.isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
  onPaymentFailure: PropTypes.func.isRequired,
};

export default NewPaymentModal; 