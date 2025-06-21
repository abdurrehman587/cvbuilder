-- Create the cvs table for storing CV data
CREATE TABLE IF NOT EXISTS cvs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can insert own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON cvs;

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