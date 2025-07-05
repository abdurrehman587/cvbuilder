-- Fix payment status to include 'downloaded'
-- This script adds 'downloaded' as a valid status for payments

-- First, drop the existing check constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add the new check constraint that includes 'downloaded'
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'downloaded'));

-- Update any existing payments that might have 'downloaded' status to be properly set
-- (This is just in case there are any existing records with invalid status)
UPDATE payments 
SET status = 'approved' 
WHERE status NOT IN ('pending', 'approved', 'rejected', 'downloaded');

-- Verify the constraint is working
SELECT status, COUNT(*) as count 
FROM payments 
GROUP BY status; 