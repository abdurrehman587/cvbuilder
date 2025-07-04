-- Create CV table for storing user CV data
-- Run this in Supabase SQL Editor

-- Create cvs table
CREATE TABLE IF NOT EXISTS cvs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    image_url TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    objective JSONB,
    education JSONB,
    work_experience JSONB,
    skills JSONB,
    certifications JSONB,
    projects JSONB,
    languages JSONB,
    hobbies JSONB,
    references JSONB,
    other_information JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Create policies for cvs table
CREATE POLICY "Users can view own CV" ON cvs
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own CV" ON cvs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own CV" ON cvs
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own CV" ON cvs
    FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Allow admin access to all CVs
CREATE POLICY "Admin access to all CVs" ON cvs
    FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cvs_user_email ON cvs(user_email);
CREATE INDEX IF NOT EXISTS idx_cvs_name ON cvs(name);
CREATE INDEX IF NOT EXISTS idx_cvs_phone ON cvs(phone);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cvs_updated_at 
    BEFORE UPDATE ON cvs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 