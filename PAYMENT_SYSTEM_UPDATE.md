# Payment System Update - One Payment Per Download

## Overview
The payment system requires **one payment for each download**. After each download, the user must pay again for the next download. This ensures users can only download templates they've paid for, and each payment allows exactly one download.

## Key Changes Made

### 1. **One Payment Per Download**
- **Before**: Users could download multiple times with one approved payment
- **After**: Each approved payment allows exactly one download
- **Implementation**: Added `is_used` field check in payment validation

### 2. **Payment Count Tracking**
- **Track how many times payment is coming** - Each new payment is recorded separately
- **User sending payment again should be able to download again on approval** - New payments create new download opportunities
- **Download count tracking** - Shows how many times user has downloaded each template

### 3. **Template-Specific Payments**
- Users can only download templates they've specifically paid for
- Each template requires its own payment
- Payment records are tied to specific `template_id`

### 4. **Centralized Payment System**
- All templates now use the same `CentralizedPaymentSystem` component
- Consistent payment logic across all 10 templates
- Single point of control for payment method changes

## Technical Implementation

### Payment Status Logic
```javascript
// Check for approved payment that hasn't been used yet
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .eq('user_email', user.email)
  .eq('template_id', templateId)
  .eq('status', 'approved')
  .eq('is_used', false)  // Only unused payments
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### After Download Process
```javascript
// Mark payment as used
await supabase
  .from('payments')
  .update({ is_used: true })
  .eq('id', paymentId);

// Record download for tracking
await supabase
  .from('cv_downloads')
  .insert({
    user_email: user.email,
    template_id: templateId,
    payment_id: paymentId,
    downloaded_at: new Date().toISOString()
  });
```

### Button Text States
1. **"Download Now"** - User has unused approved payment
2. **"Payment Submitted (Waiting for Approval)"** - User has pending payment
3. **"Download PDF (PKR 100) - New Payment Required"** - User has downloaded before but needs new payment
4. **"Download PDF (PKR 100)"** - No payment history

## Files Updated

### Core Payment System
- `src/CentralizedPaymentSystem.js` - Main payment logic updated
- `src/cleanPaymentService.js` - Payment service methods updated
- `src/UnifiedPaymentSystem.js` - Alternative payment system updated

### Template Files
- `src/Template1PDF.js` - Uses CentralizedPaymentSystem
- `src/Template2PDF.js` - Uses CentralizedPaymentSystem
- `src/Template3PDF.js` - Uses CentralizedPaymentSystem
- `src/Template4PDF.js` - Uses CentralizedPaymentSystem
- `src/Template5PDF.js` - **Added** CentralizedPaymentSystem
- `src/Template6PDF.js` - Uses CentralizedPaymentSystem
- `src/Template7PDF.js` - Uses CentralizedPaymentSystem
- `src/Template8PDF.js` - Uses CentralizedPaymentSystem
- `src/Template9PDF.js` - Uses CentralizedPaymentSystem
- `src/Template10PDF.js` - **Added** CentralizedPaymentSystem

### Debug Tools
- `src/PaymentDebugTool.js` - New debug tool to check payment status

## Database Schema Requirements

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  template_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  is_used BOOLEAN DEFAULT FALSE,  -- Track if payment has been used
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### CV Downloads Table
```sql
CREATE TABLE cv_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  template_id TEXT NOT NULL,
  payment_id UUID REFERENCES payments(id),
  downloaded_at TIMESTAMP DEFAULT NOW()
);
```

## Benefits

### For Users
- **Clear understanding**: one payment = one download
- **No confusion about payment status**
- **Consistent experience across all templates**
- **Real-time updates** - Button updates immediately after admin approval

### For Admins
- **Better tracking** - Can see payment count vs download count
- **Clear audit trail** - Know which payments led to which downloads
- **Payment history** - Track how many times users have paid for each template

### For Developers
- **Single payment system** - Easy to maintain and modify
- **Consistent behavior** - Same logic across all templates
- **Real-time updates** - Immediate button updates with Supabase subscriptions

## Migration Notes

### Existing Payments
- Existing approved payments will work for one download
- After first download, `is_used` will be set to `true`
- Users will need new payments for subsequent downloads

### Admin Panel
- Admin panel shows payment status including `is_used` field
- Can approve/reject payments as before
- Download tracking available in `cv_downloads` table

## Testing Checklist

- [ ] New user can submit payment and download once
- [ ] After download, button shows "New Payment Required"
- [ ] User can submit new payment for additional downloads
- [ ] Admin can approve payments
- [ ] Real-time updates work when admin approves payment
- [ ] All 10 templates use same payment system
- [ ] Payment method changes affect all templates
- [ ] Download tracking works correctly
- [ ] Payment count tracking works correctly

## Future Enhancements

1. **Bulk Payment Options** - Allow users to pay for multiple templates at once
2. **Subscription Model** - Monthly/yearly access to all templates
3. **Download Limits** - Allow multiple downloads per payment (configurable)
4. **Payment Analytics** - Better reporting on payment vs download patterns 