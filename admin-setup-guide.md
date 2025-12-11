# Admin Setup Guide

## Step 1: Run the Database Schema
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ctygupgtlawlgcikmkqz
2. Go to **SQL Editor**
3. Copy and paste the contents of `admin-setup-simple.sql`
4. Click **Run**

## Step 2: Create Admin User in Supabase Auth
1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click **Add User**
3. **Email**: Use your preferred admin email
4. **Password**: Use a strong password
5. **Auto Confirm User**: ✅ Yes
6. Click **Create User**

## Step 3: Update Admin User Record
After creating the user in Auth, run this SQL in the SQL Editor (replace with your admin email):

```sql
UPDATE public.users 
SET is_admin = TRUE, 
    full_name = 'Admin User',
    updated_at = NOW()
WHERE email = 'your-admin-email@domain.com';
```

## Step 4: Test Admin Access
1. Start your application: `npm start`
2. Login with your admin credentials
3. You should have admin privileges

## Troubleshooting
- If you get foreign key errors, make sure to create the user in Supabase Auth first
- The user ID must match between `auth.users` and `public.users`
- Check that the email matches exactly in both Auth and the SQL update query
