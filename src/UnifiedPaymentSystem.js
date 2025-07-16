import React, { useState, useEffect } from 'react';
import { CleanPaymentService } from './cleanPaymentService';
import CleanPaymentModal from './CleanPaymentModal';
import { toast } from 'react-toastify';

const UnifiedPaymentSystem = ({ 
  templateId, 
  onDownload, 
  isPrintMode = false,
  buttonStyle = {},
  containerStyle = {}
}) => {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [buttonText, setButtonText] = useState('Loading...');
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Update button text and check payment status
  useEffect(() => {
    const updateButtonText = async () => {
      try {
        // Clear admin flags for regular users first
        CleanPaymentService.clearAdminFlagsForRegularUsers();
        
        // Check if user is admin
        const isAdmin = CleanPaymentService.isAdminUser();
        
        // Update admin status if changed
        if (isAdmin !== isAdminUser) {
          setIsAdminUser(isAdmin);
          console.log('UnifiedPaymentSystem - Admin status updated:', isAdmin);
        }
        
        // Don't update button text while loading
        if (isLoading) {
          setButtonText('Loading...');
          return;
        }

        if (isAdmin) {
          // Admin user - always free download
          setButtonText(CleanPaymentService.getAdminButtonText());
          setHasPendingPayment(false);
          return;
        }

        // Regular user - check payment status
        const buttonText = await CleanPaymentService.getUserButtonText(templateId);
        setButtonText(buttonText);
        
        // Check for pending payment to show banner
        const pendingPayment = await CleanPaymentService.checkUserPendingPayment(templateId);
        setHasPendingPayment(!!pendingPayment);
        
      } catch (error) {
        console.error('UnifiedPaymentSystem - Error updating button text:', error);
        setButtonText('Download PDF (PKR 100)');
      }
    };

    // Initial call with delay to avoid conflicts
    const initialTimeout = setTimeout(() => {
      console.log('UnifiedPaymentSystem - Initial payment system check for template:', templateId);
      updateButtonText();
    }, 1000);
    
    // Set up periodic refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('UnifiedPaymentSystem - Periodic payment system check for template:', templateId);
      updateButtonText();
    }, 10000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isAdminUser, isLoading, templateId]);

  // Set loading to false after initial setup
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDownloadClick = async () => {
    console.log('UnifiedPaymentSystem - Download button clicked for template:', templateId);
    console.log('UnifiedPaymentSystem - isAdminUser:', isAdminUser);
    
    setIsDownloading(true);
    
    try {
      if (isAdminUser) {
        // Admin user - always free download
        console.log('UnifiedPaymentSystem - Admin user, proceeding with direct download');
        await onDownload();
        
        // Show success message briefly
        setButtonText('PDF Downloaded!');
        setTimeout(() => {
          setButtonText(CleanPaymentService.getAdminButtonText());
        }, 3000);
        return;
      }

      // Regular user - use clean payment system
      console.log('UnifiedPaymentSystem - Regular user, using clean payment system');
      const downloadResult = await CleanPaymentService.handleUserDownload(templateId);
      
      if (downloadResult.canDownload) {
        console.log('UnifiedPaymentSystem - User can download, proceeding with PDF generation');
        await onDownload();
        
        // Immediately update button text after successful download
        const newButtonText = await CleanPaymentService.getUserButtonText(templateId);
        setButtonText(newButtonText);
        console.log('UnifiedPaymentSystem - Button text updated after download:', newButtonText);
        return;
      }
      
      // Handle different reasons why user can't download
      switch (downloadResult.reason) {
        case 'pending_payment':
          console.log('UnifiedPaymentSystem - Pending payment found, showing alert');
          toast.warning('You have a pending payment. Please wait for admin approval.');
          break;
          
        case 'needs_new_payment':
        case 'no_payment':
          console.log('UnifiedPaymentSystem - Payment required, showing payment modal');
          setShowPaymentModal(true);
          break;
          
        default:
          console.log('UnifiedPaymentSystem - Unknown reason, showing payment modal');
          setShowPaymentModal(true);
          break;
      }
    } catch (error) {
      console.error('UnifiedPaymentSystem - Download error:', error);
      toast.error('An error occurred during download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    setShowPaymentModal(false);
    console.log('UnifiedPaymentSystem - Payment successful for template:', templateId, paymentData);
    toast.success('Payment submitted successfully! Please wait for admin approval.');
    
    // Update button text to reflect pending payment status
    const newButtonText = await CleanPaymentService.getUserButtonText(templateId);
    setButtonText(newButtonText);
    console.log('UnifiedPaymentSystem - Button text updated after payment submission:', newButtonText);
  };

  const handlePaymentFailure = (error) => {
    setShowPaymentModal(false);
    console.error('UnifiedPaymentSystem - Payment failed for template:', templateId, error);
    toast.error('Payment failed. Please try again.');
  };

  // Don't render anything in print mode
  if (isPrintMode) {
    return null;
  }

  return (
    <div style={containerStyle}>
      {hasPendingPayment ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '6px', 
            padding: '16px', 
            marginBottom: '16px' 
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '16px' }}>
              ⏳ Payment Submitted - Waiting for Approval
            </h3>
            <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
              Your payment has been submitted and is being reviewed. You will be able to download your CV once approved.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={isLoading || isDownloading}
            style={{
              cursor: (isLoading || isDownloading) ? 'not-allowed' : 'pointer',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: (isLoading || isDownloading) ? '#cccccc' : '#3f51b5',
              color: 'white',
              transition: 'background-color 0.3s ease',
              userSelect: 'none',
              opacity: (isLoading || isDownloading) ? 0.6 : 1,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              ...buttonStyle
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isDownloading) {
                e.currentTarget.style.backgroundColor = '#303f9f';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && !isDownloading) {
                e.currentTarget.style.backgroundColor = '#3f51b5';
              }
            }}
          >
            {isDownloading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing...
              </>
            ) : (
              buttonText
            )}
          </button>
        </div>
      )}
      
      {showPaymentModal && (
        <CleanPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          templateId={templateId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentFailure}
        />
      )}
    </div>
  );
};

export default UnifiedPaymentSystem; 