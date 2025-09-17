# Supabase Integration Setup

This project has been integrated with Supabase for data persistence. Follow these steps to complete the setup:

## 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/poqarsztryrdlliwjhgx
2. Navigate to **Settings** → **API**
3. Copy your **Project URL** and **anon/public key**

## 2. Update Configuration

Edit `frontend/js/supabase-config.js` and replace the placeholder values:

```javascript
// Replace these with your actual Supabase project credentials
this.supabaseUrl = 'https://poqarsztryrdlliwjhgx.supabase.co'; // Your actual URL
this.supabaseKey = 'YOUR_ACTUAL_ANON_KEY_HERE'; // Your actual anon key
```

## 3. Database Table Structure

Your existing `admin_cvs` table should have the following structure:

```sql
CREATE TABLE admin_cvs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    cv_data JSONB NOT NULL,
    personal_info JSONB,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    template TEXT DEFAULT 'classic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_admin_cvs_user_id ON admin_cvs(user_id);
CREATE INDEX idx_admin_cvs_full_name ON admin_cvs(full_name);
CREATE INDEX idx_admin_cvs_email ON admin_cvs(email);
CREATE INDEX idx_admin_cvs_phone ON admin_cvs(phone);
CREATE INDEX idx_admin_cvs_template ON admin_cvs(template);
CREATE INDEX idx_admin_cvs_created_at ON admin_cvs(created_at);
```

## 4. Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS
ALTER TABLE admin_cvs ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own CVs
CREATE POLICY "Users can manage their own CVs" ON admin_cvs
    FOR ALL USING (auth.uid()::text = user_id);

-- Policy for admin users to see all CVs (if you have admin functionality)
CREATE POLICY "Admins can see all CVs" ON admin_cvs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
```

## 5. Features

### ✅ Implemented Features:
- **CV Creation**: Save new CVs to Supabase
- **CV Updates**: Update existing CVs
- **CV Deletion**: Delete CVs from Supabase
- **CV Search**: Search CVs by name, phone, template
- **Admin Dashboard**: View all CVs with live search
- **Fallback Support**: Falls back to localStorage if Supabase is unavailable

### 🔄 Data Flow:
1. **Create CV**: `supabaseDatabaseManager.saveCV(cvData, userId)`
2. **Update CV**: `supabaseDatabaseManager.updateCV(cvId, cvData, userId)`
3. **Delete CV**: `supabaseDatabaseManager.deleteCV(cvId, userId)`
4. **Search CVs**: `supabaseDatabaseManager.searchCVs(name, phone, template, userId)`
5. **Get All CVs**: `supabaseDatabaseManager.getAllCVs(userId)`

### 🛡️ Security:
- Row Level Security (RLS) enabled
- Users can only access their own CVs
- Admin users can view all CVs
- All operations are user-scoped

### 📊 Data Structure:
Each CV record contains:
- `id`: Unique identifier
- `user_id`: Owner of the CV
- `cv_data`: Complete CV data (JSON)
- `personal_info`: Extracted personal info (JSON)
- `full_name`: For easy searching
- `email`: For easy searching
- `phone`: For easy searching
- `template`: CV template used
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## 6. Testing

1. Open the CV builder
2. Create a new CV
3. Save it (should save to Supabase)
4. Check your Supabase dashboard to see the data
5. Test search functionality in admin dashboard

## 7. Troubleshooting

### Common Issues:
1. **"Supabase not available"**: Check your API key and URL
2. **Permission denied**: Check your RLS policies
3. **Network errors**: Check your internet connection and Supabase status

### Debug Mode:
Open browser console to see detailed logs of all Supabase operations.

## 8. Migration from localStorage

The system automatically falls back to localStorage if Supabase is unavailable, so existing data will continue to work while you set up Supabase.

Once Supabase is configured, you can manually migrate existing localStorage data by:
1. Opening the admin dashboard
2. The system will automatically sync data when users access their CVs
