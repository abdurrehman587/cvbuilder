# Supabase Database Setup Guide

## Step 1: Access Your Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your CV Builder project

## Step 2: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire content from `database_setup.sql`
4. Click **Run** to execute the SQL

## Step 3: Verify Tables Created

1. Go to **Table Editor** in your Supabase dashboard
2. You should see two new tables:
   - `payments`
   - `cv_downloads`

## Step 4: Test the Setup

1. Run your React app
2. Try submitting a payment
3. Check the Supabase dashboard to see if the payment appears in the `payments` table

## Troubleshooting

### If you get "relation does not exist" errors:
- Make sure you ran the SQL schema in the correct Supabase project
- Check that the tables were created successfully

### If payments aren't being stored:
- Check the browser console for errors
- Verify your Supabase URL and API key are correct in `src/supabase.js`

### If RLS (Row Level Security) is blocking access:
- Make sure you're signed in as the correct user
- Check that the RLS policies are set up correctly

## Database Schema Overview

### Payments Table
- `id`: Unique payment identifier
- `user_id`: Supabase user ID
- `user_email`: User's email address
- `template_id`: Which template the payment is for
- `template_name`: Human-readable template name
- `payment_method`: Payment method used
- `amount`: Payment amount
- `phone_number`: User's phone number
- `payment_proof_url`: URL to payment proof
- `status`: 'pending', 'approved', or 'rejected'
- `download_used`: Whether the CV has been downloaded
- `downloaded_at`: When the CV was downloaded
- `created_at`: When the payment was submitted
- `updated_at`: When the payment was last updated

### CV Downloads Table
- `id`: Unique download identifier
- `user_id`: Supabase user ID
- `user_email`: User's email address
- `template_id`: Which template was downloaded
- `payment_id`: Reference to the payment used
- `downloaded_at`: When the download occurred
- `created_at`: When the record was created 