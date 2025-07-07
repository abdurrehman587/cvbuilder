# Pending Payment Banner Feature

## Overview
The CV Builder now shows a banner instead of a download button when a payment is pending admin approval. This provides better user experience by clearly indicating the payment status.

## How It Works

### State Management
- Added `hasPendingPayment` state to track pending payment status
- Updated `handlePaymentSuccess` to set `hasPendingPayment = true`
- Enhanced payment status checking to detect pending payments

### UI Changes
- **When payment is pending**: Shows a yellow banner with "Please wait for admin approval" message
- **When no pending payment**: Shows the normal download button with appropriate text
- **Banner includes**: Refresh and debug buttons for user convenience

### Banner Design
- **Background**: Light yellow (`#fef3c7`)
- **Border**: Orange (`#f59e0b`)
- **Text**: Dark orange (`#92400e`)
- **Icon**: Hourglass emoji (⏳)
- **Buttons**: Refresh (🔄) and Debug (🐛) buttons

## Implementation Details

### Files Modified
- ✅ `src/Template1PDF.js` - Complete implementation
- ✅ `src/Template2PDF.js` - Complete implementation
- ✅ `src/Template3PDF.js` - Partial implementation (state added)

### Files Pending Update
- `src/Template4PDF.js`
- `src/Template5PDF.js`
- `src/Template6PDF.js`
- `src/Template7PDF.js`
- `src/Template8PDF.js`
- `src/Template9PDF.js`
- `src/Template10PDF.js`

### Required Changes for Each Template

1. **Add State**:
```javascript
const [hasPendingPayment, setHasPendingPayment] = useState(false);
```

2. **Update handlePaymentSuccess**:
```javascript
const handlePaymentSuccess = (paymentData) => {
  setShowPaymentModal(false);
  setHasPendingPayment(true); // Add this line
  // ... rest of the function
};
```

3. **Update useEffect for button text**:
```javascript
useEffect(() => {
  const updateButtonText = async () => {
    if (isLoading) {
      setButtonText('Loading...');
      return;
    }

    if (isAdminUser) {
      setButtonText('Download PDF (Admin)');
      setHasPendingPayment(false); // Add this line
      return;
    }

    try {
      // Check for pending payment first
      const pendingPayment = await PaymentService.checkPendingPayment('templateX');
      if (pendingPayment) {
        setHasPendingPayment(true);
        setButtonText('Payment Submitted (Waiting for Approval)');
        return;
      } else {
        setHasPendingPayment(false);
      }

      const text = await PaymentService.getDownloadButtonText('templateX', isAdminUser);
      setButtonText(text);
    } catch (error) {
      console.error('Error getting button text:', error);
      setButtonText('Download PDF (PKR 100)');
    }
  };

  updateButtonText();
  const interval = setInterval(updateButtonText, 10000);
  return () => clearInterval(interval);
}, [isAdminUser, isLoading]);
```

4. **Update refreshButtonText function**:
```javascript
const refreshButtonText = async () => {
  try {
    // Check for pending payment first
    const pendingPayment = await PaymentService.checkPendingPayment('templateX');
    if (pendingPayment) {
      setHasPendingPayment(true);
      setButtonText('Payment Submitted (Waiting for Approval)');
      return;
    } else {
      setHasPendingPayment(false);
    }
    
    const text = await PaymentService.getDownloadButtonText('templateX', isAdminUser);
    setButtonText(text);
  } catch (error) {
    console.error('Error refreshing button text:', error);
  }
};
```

5. **Replace Download Button Section**:
```javascript
{/* Download Button or Pending Banner */}
<div style={{ marginTop: 16 }}>
  {hasPendingPayment ? (
    /* Pending Payment Banner */
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '8px',
      color: '#92400e',
      fontSize: '0.95rem',
      fontWeight: '500'
    }}>
      <span style={{ fontSize: '1.2rem' }}>⏳</span>
      <span>Please wait for admin approval</span>
      
      {/* Refresh Button */}
      <button
        type="button"
        onClick={refreshButtonText}
        disabled={isLoading}
        title="Refresh payment status"
        style={{
          cursor: isLoading ? 'not-allowed' : 'pointer',
          padding: '4px 8px',
          fontSize: '0.8rem',
          borderRadius: 4,
          border: '1px solid #f59e0b',
          backgroundColor: 'white',
          color: '#f59e0b',
          transition: 'all 0.3s ease',
          userSelect: 'none',
          opacity: isLoading ? 0.7 : 1,
          marginLeft: 'auto'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#fef3c7';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        🔄
      </button>
      
      {/* Debug Button */}
      <button
        type="button"
        onClick={debugPaymentStatus}
        disabled={isLoading}
        title="Debug payment status"
        style={{
          cursor: isLoading ? 'not-allowed' : 'pointer',
          padding: '4px 8px',
          fontSize: '0.8rem',
          borderRadius: 4,
          border: '1px solid #ff9800',
          backgroundColor: 'white',
          color: '#ff9800',
          transition: 'all 0.3s ease',
          userSelect: 'none',
          opacity: isLoading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#fff3e0';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        🐛
      </button>
    </div>
  ) : (
    /* Normal Download Button */
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Existing download button code */}
    </div>
  )}
</div>
```

## User Experience

### Before Payment
- User sees "Download PDF (PKR 100)" button
- Clicking shows payment modal

### After Payment Submission
- Button disappears
- Yellow banner appears: "Please wait for admin approval"
- User can refresh status or debug

### After Admin Approval
- Banner disappears
- Download button reappears with "Payment Approved (Download Now)"

### After Download
- Button shows download count: "Downloaded (1 time)", "Downloaded (2 times)", etc.

## Testing
1. Submit a payment
2. Verify banner appears with "Please wait for admin approval"
3. Use refresh button to check status
4. Admin approves payment
5. Verify banner disappears and download button appears
6. Download CV and verify count tracking 