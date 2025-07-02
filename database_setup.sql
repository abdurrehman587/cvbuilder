-- CV Builder Payment System Database Setup
-- Copy and paste this entire content into Supabase SQL Editor

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    template_id TEXT NOT NULL,
    template_name TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    phone_number TEXT,
    payment_proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    download_used BOOLEAN DEFAULT FALSE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create downloads table to track CV downloads
CREATE TABLE IF NOT EXISTS cv_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    template_id TEXT NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_email ON payments(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_template_id ON payments(template_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_template ON payments(user_email, template_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user_email ON cv_downloads(user_email);
CREATE INDEX IF NOT EXISTS idx_downloads_template_id ON cv_downloads(template_id);

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_downloads ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@cvbuilder.com'
        )
    );

-- Create policies for downloads table
CREATE POLICY "Users can view own downloads" ON cv_downloads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads" ON cv_downloads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all downloads" ON cv_downloads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@cvbuilder.com'
        )
    );

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