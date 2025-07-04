# CV Saving Debug Guide

## Issue: CV not saving to user_cvs table

### Step 1: Check Database Setup

**Run this SQL script in Supabase:**
```sql
-- Copy content from create_simple_cv_tables.sql
-- Make sure user_cvs and admin_cvs tables exist
```

### Step 2: Test Database Connection

1. Open browser console (F12)
2. Sign in as regular user
3. Go to CV form
4. Click "🔍 Test Database Connection" button
5. Check console output

**Expected output:**
```
=== TESTING DATABASE CONNECTION ===
User CVs table test: { data: [...], error: null }
Admin CVs table test: { data: [...], error: null }
Auth user: { id: "...", email: "..." }
=== DATABASE CONNECTION TEST END ===
```

### Step 3: Try Saving CV

1. Fill out CV form with basic info
2. Click Save button
3. Check console for logs

**Expected output:**
```
=== SAVE CV START ===
User: { id: "...", email: "..." }
Form data: { name: "...", email: "...", ... }
Is admin user: false
Checking for existing CV for user: user@example.com
Inserting new CV for user: user@example.com
Save result: { data: [...], error: null }
=== SAVE CV END ===
```

### Step 4: Common Issues

#### Issue 1: Tables don't exist
**Error:** `relation "user_cvs" does not exist`
**Solution:** Run the SQL script in Supabase

#### Issue 2: RLS Policy blocking access
**Error:** `new row violates row-level security policy`
**Solution:** Check RLS policies in Supabase dashboard

#### Issue 3: Authentication issues
**Error:** `JWT token is invalid`
**Solution:** Make sure user is properly signed in

#### Issue 4: Column type mismatch
**Error:** `column "cv_references" is of type jsonb but expression is of type text`
**Solution:** Check data types in form submission

### Step 5: Manual Database Check

**In Supabase SQL Editor, run:**
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_cvs', 'admin_cvs');

-- Check table structure
\d user_cvs

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_cvs';

-- Test insert manually (replace with your email)
INSERT INTO user_cvs (user_email, name, email) 
VALUES ('your-email@example.com', 'Test CV', 'your-email@example.com');
```

### Step 6: Fix RLS Policies (if needed)

**If RLS is blocking access, run:**
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own CV" ON user_cvs;

-- Create new policy
CREATE POLICY "Users can insert own CV" ON user_cvs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
```

### Step 7: Test with Simple Data

**Try saving with minimal data:**
- Name: "Test User"
- Email: "test@example.com"
- Phone: "1234567890"

### Step 8: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try saving CV
4. Look for failed requests to Supabase
5. Check request/response details

### Step 9: Verify Supabase Configuration

**Check src/supabase.js:**
```javascript
const supabaseUrl = 'your-supabase-url';
const supabaseAnonKey = 'your-supabase-anon-key';
```

### Step 10: Contact Support

If all else fails:
1. Share console logs
2. Share network tab errors
3. Share Supabase error messages
4. Check Supabase logs in dashboard

## Quick Fix Commands

**If you need to reset everything:**
```sql
-- Drop and recreate tables
DROP TABLE IF EXISTS user_cvs;
DROP TABLE IF EXISTS admin_cvs;

-- Then run create_simple_cv_tables.sql
``` 