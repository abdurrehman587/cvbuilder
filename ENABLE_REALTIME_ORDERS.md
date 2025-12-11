# How to Enable Realtime for Marketplace Orders in Supabase

This guide will help you enable realtime subscriptions for the `marketplace_orders` table so you receive instant notifications when new orders are placed.

## Step-by-Step Instructions

### Method 1: Using Supabase Dashboard (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to Database Settings**
   - Click on **"Database"** in the left sidebar
   - Click on **"Replication"** in the submenu (or look for "Realtime" settings)

3. **Enable Realtime for marketplace_orders Table**
   - You should see a list of all your tables
   - Find the **`marketplace_orders`** table in the list
   - Toggle the switch/checkbox next to `marketplace_orders` to enable realtime
   - The table should now show as "Enabled" or have a green indicator

4. **Verify Realtime is Enabled**
   - The `marketplace_orders` table should appear in the enabled tables list
   - You may see a confirmation message

### Method 2: Using SQL Editor (Alternative)

If you prefer using SQL, you can run this command in the Supabase SQL Editor:

```sql
-- Enable realtime for marketplace_orders table
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_orders;
```

**To run this:**
1. Go to **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Paste the SQL command above
4. Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Method 3: Using Supabase CLI (Advanced)

If you're using Supabase CLI for local development:

```bash
# Connect to your project
supabase link --project-ref your-project-ref

# Enable realtime via migration
supabase migration new enable_realtime_orders
```

Then in the migration file, add:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_orders;
```

Run the migration:
```bash
supabase db push
```

## Verification

To verify that realtime is working:

1. **Check in Dashboard:**
   - Go to Database → Replication
   - Confirm `marketplace_orders` is listed and enabled

2. **Test in Your App:**
   - Log in as an admin user
   - Place a test order (or have someone place an order)
   - You should see the notification appear immediately
   - Check the browser console for any realtime connection messages

## Troubleshooting

### If Realtime Doesn't Work:

1. **Check RLS Policies:**
   - Make sure Row Level Security (RLS) policies allow admins to read orders
   - Go to **Database → Tables → marketplace_orders → Policies**

2. **Check Realtime Status:**
   - In Supabase Dashboard, go to **Settings → API**
   - Verify that "Realtime" is enabled for your project

3. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Look for any errors related to Supabase realtime
   - Check Network tab for WebSocket connections

4. **Verify Table Exists:**
   - Make sure the `marketplace_orders` table exists
   - Check that it has the correct structure

### Common Issues:

- **"Table not found"**: Make sure the table name is exactly `marketplace_orders` (case-sensitive)
- **"Permission denied"**: Check your RLS policies allow SELECT operations
- **"Realtime not enabled"**: Make sure you've toggled it on in the Replication settings

## Notes

- Realtime subscriptions use WebSocket connections
- There may be a slight delay (1-2 seconds) for the subscription to establish
- The notification system has a fallback polling mechanism (checks every 30 seconds) if realtime is not available
- Realtime works best with stable internet connections

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Replication](https://supabase.com/docs/guides/database/replication)

---

**After enabling realtime, your order notifications will appear instantly when new orders are placed!** 🎉

