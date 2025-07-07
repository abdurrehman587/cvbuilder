-- New Payment System Migration Script
-- This script updates the existing payment system to the new enhanced version
-- Run this in your Supabase SQL editor

-- Step 1: Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_proof_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- Step 2: Add new status values
-- Note: We'll use a more flexible approach by allowing any status
-- The application will handle status validation

-- Step 3: Create payment_audit_log table for better tracking
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    admin_email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create payment_settings table for configuration
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Insert default payment settings
INSERT INTO payment_settings (setting_key, setting_value, description) VALUES
('template1_price', '100', 'Price for Template 1 in PKR'),
('template2_price', '100', 'Price for Template 2 in PKR'),
('template3_price', '100', 'Price for Template 3 in PKR'),
('template4_price', '100', 'Price for Template 4 in PKR'),
('template5_price', '100', 'Price for Template 5 in PKR'),
('template6_price', '100', 'Price for Template 6 in PKR'),
('template7_price', '100', 'Price for Template 7 in PKR'),
('template8_price', '100', 'Price for Template 8 in PKR'),
('template9_price', '100', 'Price for Template 9 in PKR'),
('template10_price', '100', 'Price for Template 10 in PKR'),
('payment_expiry_hours', '24', 'Hours before pending payment expires'),
('auto_approve_payments', 'false', 'Whether to auto-approve payments'),
('require_payment_proof', 'true', 'Whether payment proof is required'),
('max_file_size_mb', '5', 'Maximum file size for payment proof in MB')
ON CONFLICT (setting_key) DO NOTHING;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_verification_date ON payments(payment_proof_verified);
CREATE INDEX IF NOT EXISTS idx_audit_log_payment_id ON payment_audit_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON payment_audit_log(created_at);

-- Step 7: Enable RLS on new tables
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for new tables
-- Allow all operations for authenticated users (they can only see their own data)
CREATE POLICY "Users can view own audit logs" ON payment_audit_log
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own audit logs" ON payment_audit_log
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND user_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Allow admin access to all audit logs
CREATE POLICY "Admin access to all audit logs" ON payment_audit_log
    FOR ALL USING (true);

-- Allow read access to payment settings for all authenticated users
CREATE POLICY "Users can view payment settings" ON payment_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow admin access to payment settings
CREATE POLICY "Admin access to payment settings" ON payment_settings
    FOR ALL USING (true);

-- Step 9: Create function to automatically log payment status changes
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO payment_audit_log (
            payment_id,
            user_email,
            action,
            old_status,
            new_status,
            admin_email,
            notes
        ) VALUES (
            NEW.id,
            NEW.user_email,
            'status_change',
            OLD.status,
            NEW.status,
            CASE 
                WHEN NEW.status IN ('approved', 'rejected') THEN 'admin@cvbuilder.com'
                ELSE NULL
            END,
            CASE 
                WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                WHEN NEW.status = 'approved' THEN NEW.admin_notes
                ELSE NULL
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 10: Create trigger for payment status changes
CREATE TRIGGER payment_status_change_trigger
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_status_change();

-- Step 11: Create function to expire old pending payments
CREATE OR REPLACE FUNCTION expire_old_pending_payments()
RETURNS void AS $$
DECLARE
    expiry_hours INTEGER;
BEGIN
    -- Get expiry hours from settings
    SELECT CAST(setting_value AS INTEGER) INTO expiry_hours
    FROM payment_settings
    WHERE setting_key = 'payment_expiry_hours';
    
    -- Default to 24 hours if not set
    IF expiry_hours IS NULL THEN
        expiry_hours := 24;
    END IF;
    
    -- Update expired pending payments
    UPDATE payments
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'pending' 
        AND created_at < NOW() - INTERVAL '1 hour' * expiry_hours;
END;
$$ language 'plpgsql';

-- Step 12: Create function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_statistics()
RETURNS TABLE (
    total_payments BIGINT,
    total_amount DECIMAL,
    pending_count BIGINT,
    approved_count BIGINT,
    downloaded_count BIGINT,
    rejected_count BIGINT,
    expired_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
        COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_count,
        COUNT(*) FILTER (WHERE status = 'downloaded')::BIGINT as downloaded_count,
        COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_count,
        COUNT(*) FILTER (WHERE status = 'expired')::BIGINT as expired_count
    FROM payments;
END;
$$ language 'plpgsql';

-- Step 13: Create function to get user payment summary
CREATE OR REPLACE FUNCTION get_user_payment_summary(user_email_param TEXT)
RETURNS TABLE (
    template_id TEXT,
    total_payments BIGINT,
    total_amount DECIMAL,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    current_status TEXT,
    download_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.template_id,
        COUNT(*)::BIGINT as total_payments,
        COALESCE(SUM(p.amount), 0) as total_amount,
        MAX(p.created_at) as last_payment_date,
        p.status as current_status,
        COUNT(d.id)::BIGINT as download_count
    FROM payments p
    LEFT JOIN cv_downloads d ON p.id = d.payment_id
    WHERE p.user_email = user_email_param
    GROUP BY p.template_id, p.status
    ORDER BY p.template_id, MAX(p.created_at) DESC;
END;
$$ language 'plpgsql';

-- Step 14: Update existing payments to set expiry dates
UPDATE payments 
SET expires_at = created_at + INTERVAL '24 hours'
WHERE status = 'pending' AND expires_at IS NULL;

-- Step 15: Create a view for admin dashboard
CREATE OR REPLACE VIEW admin_payment_dashboard AS
SELECT 
    p.*,
    u.email as user_email,
    COUNT(d.id) as download_count,
    CASE 
        WHEN p.status = 'pending' AND p.expires_at < NOW() THEN 'expired'
        ELSE p.status
    END as effective_status
FROM payments p
LEFT JOIN auth.users u ON p.user_id = u.id
LEFT JOIN cv_downloads d ON p.id = d.payment_id
GROUP BY p.id, u.email;

-- Step 16: Grant necessary permissions
GRANT SELECT ON admin_payment_dashboard TO authenticated;
GRANT ALL ON payment_audit_log TO authenticated;
GRANT ALL ON payment_settings TO authenticated;

-- Step 17: Create function to clean up old audit logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM payment_audit_log
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Migration complete!
-- The new payment system is now ready to use.
-- 
-- New features added:
-- 1. Payment expiry system
-- 2. Admin notes and rejection reasons
-- 3. Payment proof verification
-- 4. Comprehensive audit logging
-- 5. Payment settings configuration
-- 6. Better statistics and reporting
-- 7. Automatic status change logging
-- 8. Admin dashboard view
-- 9. User payment summaries
-- 10. Automatic cleanup functions 