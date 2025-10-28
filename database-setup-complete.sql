-- Complete Database Setup Script for CV Builder
-- Run this in your Supabase SQL Editor

-- Step 1: Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create CVs table
CREATE TABLE IF NOT EXISTS public.cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  template_id TEXT DEFAULT 'template1',
  cv_data JSONB NOT NULL,
  pdf_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON public.cvs(created_at);
CREATE INDEX IF NOT EXISTS idx_cvs_name ON public.cvs(name);
CREATE INDEX IF NOT EXISTS idx_cvs_title ON public.cvs(title);
CREATE INDEX IF NOT EXISTS idx_cvs_company ON public.cvs(company);

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own CVs" ON public.cvs;
DROP POLICY IF EXISTS "Users can insert own CVs" ON public.cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON public.cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON public.cvs;
DROP POLICY IF EXISTS "Admins can view all CVs" ON public.cvs;
DROP POLICY IF EXISTS "Admins can update all CVs" ON public.cvs;
DROP POLICY IF EXISTS "Admins can delete all CVs" ON public.cvs;
DROP POLICY IF EXISTS "Templates are publicly readable" ON public.templates;

-- Step 7: Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admin policies for users table
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 8: Create RLS policies for CVs table
CREATE POLICY "Users can view own CVs" ON public.cvs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CVs" ON public.cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CVs" ON public.cvs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CVs" ON public.cvs
  FOR DELETE USING (auth.uid() = user_id);

-- Admin policies for CVs table
CREATE POLICY "Admins can view all CVs" ON public.cvs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update all CVs" ON public.cvs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete all CVs" ON public.cvs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 9: Create RLS policies for templates table (public read access)
CREATE POLICY "Templates are publicly readable" ON public.templates
  FOR SELECT USING (true);

-- Step 10: Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 12: Insert default templates
INSERT INTO public.templates (id, name, description, preview_url) VALUES
('template1', 'Template 1', 'Classic professional layout with clean design', '/templates/template1-preview.png'),
('template2', 'Template 2', 'Modern layout with enhanced visual appeal', '/templates/template2-preview.png')
ON CONFLICT (id) DO NOTHING;

-- Step 13: Create storage bucket for CV files
INSERT INTO storage.buckets (id, name, public) VALUES
('cv-files', 'cv-files', false)
ON CONFLICT (id) DO NOTHING;

-- Step 14: Create storage policies
CREATE POLICY "Users can upload own CV files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own CV files" ON storage.objects
  FOR SELECT USING (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own CV files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own CV files" ON storage.objects
  FOR DELETE USING (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Step 15: Verify tables were created
SELECT 'Tables created successfully' as status;

-- Step 16: Check if admin user exists (replace with your admin email)
SELECT 
  u.id, 
  u.email, 
  u.full_name, 
  u.is_admin,
  u.created_at
FROM public.users u
WHERE u.email = 'admin@cvbuilder.com';

-- Step 17: If admin user doesn't exist, you'll need to create them in Supabase Auth first
-- Then run this to set them as admin:
-- UPDATE public.users 
-- SET is_admin = TRUE, 
--     full_name = 'Admin User',
--     updated_at = NOW()
-- WHERE email = 'admin@cvbuilder.com';
