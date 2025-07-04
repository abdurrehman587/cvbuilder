-- Create separate CV tables for regular users and admin users
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS cvs;
DROP TABLE IF EXISTS user_cvs;
DROP TABLE IF EXISTS admin_cvs;

-- Create user_cvs table for regular users (one CV per user)
CREATE TABLE user_cvs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL UNIQUE, -- Ensure one CV per user
    image_url TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    objective JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    work_experience JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    hobbies JSONB DEFAULT '[]',
    cv_references JSONB DEFAULT '[]',
    other_information JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraint to ensure user_email is not empty
    CONSTRAINT user_cvs_user_email_not_empty CHECK (user_email != '')
);

-- Create admin_cvs table for admin-created CVs (multiple CVs possible)
CREATE TABLE admin_cvs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    cv_name TEXT NOT NULL, -- Name/identifier for the CV
    image_url TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    objective JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    work_experience JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    hobbies JSONB DEFAULT '[]',
    cv_references JSONB DEFAULT '[]',
    other_information JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraint to ensure admin_email is not empty
    CONSTRAINT admin_cvs_admin_email_not_empty CHECK (admin_email != ''),
    CONSTRAINT admin_cvs_cv_name_not_empty CHECK (cv_name != '')
);

-- Enable Row Level Security
ALTER TABLE user_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_cvs ENABLE ROW LEVEL SECURITY;

-- Create policies for user_cvs table
CREATE POLICY "Users can view own CV" ON user_cvs
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own CV" ON user_cvs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own CV" ON user_cvs
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own CV" ON user_cvs
    FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Create policies for admin_cvs table
CREATE POLICY "Admins can view all admin CVs" ON admin_cvs
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert admin CVs" ON admin_cvs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update admin CVs" ON admin_cvs
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete admin CVs" ON admin_cvs
    FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_cvs_user_email ON user_cvs(user_email);
CREATE INDEX IF NOT EXISTS idx_user_cvs_name ON user_cvs(name);
CREATE INDEX IF NOT EXISTS idx_user_cvs_phone ON user_cvs(phone);

CREATE INDEX IF NOT EXISTS idx_admin_cvs_admin_email ON admin_cvs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_cvs_cv_name ON admin_cvs(cv_name);
CREATE INDEX IF NOT EXISTS idx_admin_cvs_name ON admin_cvs(name);
CREATE INDEX IF NOT EXISTS idx_admin_cvs_phone ON admin_cvs(phone);

-- Create trigger to automatically update updated_at for user_cvs
CREATE TRIGGER update_user_cvs_updated_at 
    BEFORE UPDATE ON user_cvs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at for admin_cvs
CREATE TRIGGER update_admin_cvs_updated_at 
    BEFORE UPDATE ON admin_cvs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to upsert user CV (insert or update)
CREATE OR REPLACE FUNCTION upsert_user_cv(
    p_user_email TEXT,
    p_image_url TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_address TEXT,
    p_objective JSONB,
    p_education JSONB,
    p_work_experience JSONB,
    p_skills JSONB,
    p_certifications JSONB,
    p_projects JSONB,
    p_languages JSONB,
    p_hobbies JSONB,
    p_cv_references JSONB,
    p_other_information JSONB
) RETURNS UUID AS $$
DECLARE
    cv_id UUID;
BEGIN
    -- Try to update existing CV
    UPDATE user_cvs SET
        image_url = p_image_url,
        name = p_name,
        phone = p_phone,
        email = p_email,
        address = p_address,
        objective = p_objective,
        education = p_education,
        work_experience = p_work_experience,
        skills = p_skills,
        certifications = p_certifications,
        projects = p_projects,
        languages = p_languages,
        hobbies = p_hobbies,
        cv_references = p_cv_references,
        other_information = p_other_information,
        updated_at = NOW()
    WHERE user_email = p_user_email
    RETURNING id INTO cv_id;
    
    -- If no row was updated, insert new CV
    IF cv_id IS NULL THEN
        INSERT INTO user_cvs (
            user_email, image_url, name, phone, email, address,
            objective, education, work_experience, skills, certifications,
            projects, languages, hobbies, cv_references, other_information
        ) VALUES (
            p_user_email, p_image_url, p_name, p_phone, p_email, p_address,
            p_objective, p_education, p_work_experience, p_skills, p_certifications,
            p_projects, p_languages, p_hobbies, p_cv_references, p_other_information
        ) RETURNING id INTO cv_id;
    END IF;
    
    RETURN cv_id;
END;
$$ LANGUAGE plpgsql; 