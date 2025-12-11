# Checkout System Setup Guide

## Overview
This guide will help you set up the manual payment checkout system with Bank Transfer and Cash on Delivery options.

## Step 1: Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration file: `marketplace-orders-migration.sql`

This will create:
- `marketplace_orders` table
- Row Level Security (RLS) policies
- Indexes for better performance

## Step 2: Configure Bank Details

After running the migration, you need to update the bank details in the checkout confirmation page.

**File to edit:** `src/components/Checkout/Checkout.js`

**Find this section (around line 120-130):**
```javascript
<div className="bank-details">
  <p><strong>Bank Name:</strong> [Your Bank Name]</p>
  <p><strong>Account Number:</strong> [Your Account Number]</p>
  <p><strong>Account Title:</strong> [Account Title]</p>
  <p><strong>IBAN:</strong> [Your IBAN]</p>
</div>
```

**Replace with your actual bank details:**
```javascript
<div className="bank-details">
  <p><strong>Bank Name:</strong> HBL</p>
  <p><strong>Account Number:</strong> 1234567890123</p>
  <p><strong>Account Title:</strong> Your Company Name</p>
  <p><strong>IBAN:</strong> PK12HBLB1234567890123456</p>
</div>
```

## Step 3: Test the Checkout Flow

1. Add products to cart
2. Click "My Cart" in the header
3. Click "Proceed to Checkout"
4. Fill in customer information
5. Select payment method (Bank Transfer or Cash on Delivery)
6. Click "Place Order"

## Step 4: View Orders (Admin)

To view all orders, you'll need to create an admin panel or use Supabase dashboard:

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Select `marketplace_orders` table
4. View all orders with their status

## Order Status Flow

- **Payment Status:**
  - `pending` - Order placed, payment not confirmed
  - `paid` - Payment confirmed
  - `cancelled` - Order cancelled

- **Order Status:**
  - `pending` - Order received
  - `confirmed` - Order confirmed by admin
  - `processing` - Order being prepared
  - `shipped` - Order shipped
  - `delivered` - Order delivered
  - `cancelled` - Order cancelled

## Features

✅ Guest checkout (no login required)
✅ Bank Transfer payment option
✅ Cash on Delivery payment option
✅ Order confirmation with instructions
✅ Order stored in database
✅ Cart automatically cleared after order

## Next Steps (Optional)

1. **Email Notifications:** Add email notifications when orders are placed
2. **Order Tracking:** Create a page for customers to track their orders
3. **Admin Panel:** Create an admin interface to manage orders
4. **Order History:** Show order history for logged-in users
5. **SMS Notifications:** Send SMS when orders are placed

## Troubleshooting

**Issue:** Orders not saving
- Check Supabase RLS policies are correctly set
- Verify Supabase connection in browser console
- Check network tab for API errors

**Issue:** Bank details not showing
- Verify you updated the bank details in `Checkout.js`
- Clear browser cache and reload

**Issue:** Cart not clearing after order
- Check browser console for errors
- Verify `clearCart()` function is being called

## Support

If you encounter any issues, check:
1. Browser console for errors
2. Supabase logs in dashboard
3. Network tab for failed API calls

