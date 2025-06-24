# Database Setup Guide - Fix admin_update_cv Function Error

## 🚨 **Error You're Seeing:**
```
POST https://poqarsztryrdlliwjhgx.supabase.co/rest/v1/rpc/admin_update_cv 404 (Not Found)
Could not find the function public.admin_update_cv
```

## ✅ **Solution: Run the Database Setup Script**

### **Step 1: Access Your Supabase Database**
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query

### **Step 2: Run the Complete Setup Script**
1. Copy the entire content from `complete_database_setup.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the script

### **Step 3: Verify the Setup**
After running the script, you should see:
- ✅ `custom_sections` column added to the `cvs` table
- ✅ `admin_update_cv` function created with correct signature
- ✅ `admin_search_cvs` and `admin_get_all_cvs` functions updated
- ✅ All permissions granted

## 🔧 **What the Script Does:**

1. **Adds `custom_sections` column** to the `cvs` table
2. **Drops all conflicting functions** with different signatures
3. **Creates the correct `admin_update_cv` function** with 17 parameters
4. **Updates admin search functions** to include custom_sections
5. **Grants proper permissions** to authenticated and anon users
6. **Verifies everything** is set up correctly

## 🎯 **Expected Results:**

After running the script, you should see verification queries showing:
- `custom_sections` column exists
- `admin_update_cv` function with correct signature
- All admin functions properly created

## 🚀 **Test the Fix:**

1. **Refresh your application** in the browser
2. **Try saving a CV** as an admin user
3. **Check the console** - no more 404 errors
4. **Test the "Add more Section" feature** - it should work now

## 📝 **If You Still Get Errors:**

1. **Check Supabase logs** for any SQL errors
2. **Verify you're in the correct database** (not a test database)
3. **Make sure you have admin privileges** in Supabase
4. **Try running the script in sections** if the full script fails

## 🔍 **Manual Verification:**

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check if custom_sections column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cvs' AND column_name = 'custom_sections';

-- Check if admin_update_cv function exists
SELECT p.proname, pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public';
```

## ✅ **Success Indicators:**

- ✅ No more 404 errors when saving CVs
- ✅ Admin search functionality works
- ✅ Custom sections can be added and saved
- ✅ All admin features work properly

---

**Need Help?** If you continue to have issues, check the Supabase logs for specific error messages and ensure you're running the script in the correct database environment. 