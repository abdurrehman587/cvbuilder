# Download Count Feature

## Overview
The CV Builder now tracks the number of times each user has downloaded their CV for each template. This feature provides better transparency to users about their download history.

## How It Works

### Database Tracking
- The system uses the existing `cv_downloads` table to track each download
- Each download record includes: user_email, template_id, payment_id, and timestamp
- The `PaymentService.getDownloadCount()` method counts downloads for a specific user and template

### Button Text Logic
The download button now shows different text based on download count:

1. **First Download**: "Downloaded (1 time)"
2. **Multiple Downloads**: "Downloaded (2 times)", "Downloaded (3 times)", etc.
3. **No Downloads**: Shows payment status (approved, pending, or payment required)

### Button Text Priority
1. **Admin User**: "Download PDF (Admin)"
2. **Approved Payment**: "Payment Approved (Download Now)"
3. **Pending Payment**: "Payment Submitted (Waiting for Approval)"
4. **Downloaded CV**: Shows count like "Downloaded (1 time)" or "Downloaded (2 times)"
5. **No Payment**: "Download PDF (PKR 100)"

## Implementation Details

### PaymentService Updates
- Added `getDownloadCount(templateId)` method to count downloads
- Updated `getDownloadButtonText()` to include download count in button text
- Enhanced `debugPaymentStatus()` to show download count in debug output

### Template Updates
- Template1PDF and Template2PDF debug functions now show download count
- All templates automatically benefit from the new button text logic since they use `PaymentService.getDownloadButtonText()`

## User Experience

### For Users
- Clear indication of how many times they've downloaded their CV
- Better understanding of their download history
- Consistent button text across all templates

### For Admins
- Debug information includes download count
- Better visibility into user download patterns
- Enhanced payment status debugging

## Testing
To test the download count feature:

1. **Login as a user**
2. **Make a payment and get it approved by admin**
3. **Download the CV** - button should show "Downloaded (1 time)"
4. **Make another payment and get it approved**
5. **Download again** - button should show "Downloaded (2 times)"
6. **Use debug button** to see detailed download count information

## Database Schema
The feature uses the existing `cv_downloads` table:
```sql
CREATE TABLE IF NOT EXISTS cv_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    template_id TEXT NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Files Modified
- `src/paymentService.js` - Added download count functionality
- `src/Template1PDF.js` - Updated debug function
- `src/Template2PDF.js` - Updated debug function
- All other template files automatically benefit from the changes 