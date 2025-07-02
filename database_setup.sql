-- CV Builder Payment System Database Setup
-- Copy and paste this entire content into Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "Users can view own downloads" ON cv_downloads;
DROP POLICY IF EXISTS "Users can insert own downloads" ON cv_downloads;
DROP POLICY IF EXISTS "Users can update own downloads" ON cv_downloads;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all downloads" ON cv_downloads;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS cv_downloads;
DROP TABLE IF EXISTS payments;

-- Create payments table
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    template_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cv_downloads table
CREATE TABLE cv_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    template_id TEXT NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_downloads ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Create policies for cv_downloads table
CREATE POLICY "Users can view own downloads" ON cv_downloads
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own downloads" ON cv_downloads
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own downloads" ON cv_downloads
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Create admin policies (for admin users)
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can update all payments" ON payments
    FOR UPDATE USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can view all downloads" ON cv_downloads
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_payments_user_email ON payments(user_email);
CREATE INDEX idx_payments_template_id ON payments(template_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_cv_downloads_user_email ON cv_downloads(user_email);
CREATE INDEX idx_cv_downloads_payment_id ON cv_downloads(payment_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 