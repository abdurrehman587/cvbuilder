-- Create the cvs table for storing CV data
CREATE TABLE IF NOT EXISTS cvs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
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
  custom_sections JSONB DEFAULT '[]'::jsonb,
  other_information JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_name ON cvs(name);
CREATE INDEX IF NOT EXISTS idx_cvs_phone ON cvs(phone);

-- Create unique constraint for name and phone combination (for admin CVs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cvs_name_phone_unique ON cvs(name, phone) WHERE user_id IS NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can insert own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can view all CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can insert CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can update CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can delete CVs" ON cvs;

-- Create policy to allow users to view their own CVs
CREATE POLICY "Users can view own CVs" ON cvs
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own CVs
CREATE POLICY "Users can insert own CVs" ON cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own CVs
CREATE POLICY "Users can update own CVs" ON cvs
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own CVs
CREATE POLICY "Users can delete own CVs" ON cvs
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for admin access (admin CVs have user_id = NULL)
CREATE POLICY "Admin can view all CVs" ON cvs
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Admin can insert CVs" ON cvs
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Admin can update CVs" ON cvs
  FOR UPDATE USING (user_id IS NULL);

CREATE POLICY "Admin can delete CVs" ON cvs
  FOR DELETE USING (user_id IS NULL);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_cvs_updated_at ON cvs;
CREATE TRIGGER update_cvs_updated_at 
  BEFORE UPDATE ON cvs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON cvs TO authenticated;
GRANT USAGE ON SEQUENCE cvs_id_seq TO authenticated; 