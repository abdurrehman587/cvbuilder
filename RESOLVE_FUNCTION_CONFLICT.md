# Resolving Function Name Conflict

## Problem
You're getting this error:
```
ERROR: 42725: function name "admin_update_cv" is not unique
HINT: Specify the argument list to select the function unambiguously.
```

This happens because there are multiple functions with the same name but different parameter lists in your database.

## Solution Steps

### Step 1: Check Current Functions
First, run the diagnostic script to see what functions exist:

```sql
-- Run this in your database
\i check_admin_functions.sql
```

This will show you all existing `admin_update_cv` functions and their signatures.

### Step 2: Add Custom Sections Column
Run the database migration to add the custom_sections column:

```sql
-- Run this in your database
\i add_custom_sections_column.sql
```

### Step 3: Fix the Function Conflict
Run the fixed function script that properly handles the function signature conflict:

```sql
-- Run this in your database
\i fix_admin_rpc_function.sql
```

This script will:
- Drop all existing `admin_update_cv` functions with different signatures
- Create a new function with the correct signature including `custom_sections`
- Grant proper permissions
- Verify the function was created successfully

### Step 4: Update Search Functions
Run the updated search functions:

```sql
-- Run this in your database
\i update_admin_search_functions.sql
```

### Step 5: Verify Everything Works
Run these verification queries:

```sql
-- Check if custom_sections column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cvs' AND column_name = 'custom_sections';

-- Check if admin_update_cv function exists with correct signature
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public';

-- Check if admin search functions exist
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE 'admin_%' AND n.nspname = 'public'
ORDER BY p.proname;
```

## Alternative Manual Approach

If the automated scripts don't work, you can manually resolve this:

### 1. List All Functions
```sql
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  p.oid as function_oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public';
```

### 2. Drop Each Function Individually
For each function shown, drop it using its specific signature:

```sql
-- Example (replace with actual signatures from step 1)
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
-- Add more DROP statements for each function found
```

### 3. Create New Function
```sql
-- Run the CREATE OR REPLACE FUNCTION statement from fix_admin_rpc_function.sql
```

## Troubleshooting

### If You Still Get Errors:

1. **Check Function Permissions**:
   ```sql
   SELECT 
     p.proname,
     n.nspname,
     p.proacl
   FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE p.proname = 'admin_update_cv';
   ```

2. **Check Schema**:
   ```sql
   SELECT current_schema();
   SHOW search_path;
   ```

3. **Force Drop All Functions**:
   ```sql
   -- This will drop ALL functions with this name (use with caution)
   DO $$
   DECLARE
     func_record RECORD;
   BEGIN
     FOR func_record IN 
       SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
       FROM pg_proc p
       JOIN pg_namespace n ON p.pronamespace = n.oid
       WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public'
     LOOP
       EXECUTE 'DROP FUNCTION IF EXISTS admin_update_cv(' || func_record.args || ')';
     END LOOP;
   END $$;
   ```

### Common Issues:

1. **Permission Denied**: Make sure you're running as a database superuser or have DROP privileges
2. **Schema Issues**: Make sure you're in the correct schema (usually 'public')
3. **Function in Use**: Restart your application to release any active connections using the function

## Success Indicators

After running the scripts successfully, you should see:

1. ✅ `custom_sections` column exists in the `cvs` table
2. ✅ Only one `admin_update_cv` function exists with the correct signature
3. ✅ Admin search functions include `custom_sections` in their return types
4. ✅ No function name conflicts when running queries

## Next Steps

Once the database is properly set up:

1. Restart your application
2. Test the "Add more Section" feature in the CV Builder
3. Verify that custom sections are saved and loaded correctly
4. Test admin functionality with custom sections

## Support

If you continue to have issues:

1. Check the PostgreSQL logs for detailed error messages
2. Verify your database user has the necessary permissions
3. Ensure you're connected to the correct database
4. Consider recreating the function from scratch if conflicts persist 