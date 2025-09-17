-- Create user_cvs table for regular users
-- This will fix the permission denied error

-- Drop table if it exists (to avoid conflicts)
DROP TABLE IF EXISTS public.user_cvs CASCADE;

-- Create user_cvs table with proper structure
CREATE TABLE public.user_cvs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    cv_name VARCHAR(255),
    name VARCHAR(255),
    email VARCHAR(255),
    phone TEXT,
    address TEXT,
    objective TEXT,
    image_url TEXT,
    education JSONB DEFAULT '[]',
    work_experience JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    hobbies JSONB DEFAULT '[]',
    cv_references JSONB DEFAULT '[]',
    other_information JSONB DEFAULT '[]',
    custom_sections JSONB DEFAULT '[]',
    template VARCHAR(50) DEFAULT 'classic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_cvs_user_id ON public.user_cvs(user_id);
CREATE INDEX idx_user_cvs_name ON public.user_cvs(name);
CREATE INDEX idx_user_cvs_email ON public.user_cvs(email);
CREATE INDEX idx_user_cvs_created_at ON public.user_cvs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can update their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Admins can view all user CVs" ON public.user_cvs;

-- Create RLS policies
CREATE POLICY "Users can view their own CVs" ON public.user_cvs
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own CVs" ON public.user_cvs
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own CVs" ON public.user_cvs
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own CVs" ON public.user_cvs
    FOR DELETE USING (user_id = auth.uid()::text);

-- Allow admins to view all user CVs
CREATE POLICY "Admins can view all user CVs" ON public.user_cvs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.user_cvs TO authenticated;
GRANT USAGE ON SEQUENCE user_cvs_id_seq TO authenticated;

-- Insert a test record to verify the table works
INSERT INTO public.user_cvs (user_id, name, email, cv_name) 
VALUES ('test_user_123', 'Test User', 'test@example.com', 'Test CV');

-- Verify the table was created successfully
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'user_cvs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test query to verify permissions
SELECT * FROM public.user_cvs WHERE user_id = 'test_user_123';

-- Clean up test data
DELETE FROM public.user_cvs WHERE user_id = 'test_user_123';
