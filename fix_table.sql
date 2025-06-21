-- Add unique constraint on user_id column
ALTER TABLE cvs ADD CONSTRAINT cvs_user_id_unique UNIQUE (user_id);

-- Verify the constraint was added
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'cvs' 
AND constraint_type = 'UNIQUE'; 