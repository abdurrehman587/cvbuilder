// Database schema and setup functions for Supabase

// SQL commands to create tables in Supabase
export const createTables = `
-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CVs table
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

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON public.cvs(created_at);
CREATE INDEX IF NOT EXISTS idx_cvs_name ON public.cvs(name);
CREATE INDEX IF NOT EXISTS idx_cvs_title ON public.cvs(title);
CREATE INDEX IF NOT EXISTS idx_cvs_company ON public.cvs(company);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
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

-- Create RLS policies for CVs table
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

-- Create RLS policies for templates table (public read access)
CREATE POLICY "Templates are publicly readable" ON public.templates
  FOR SELECT USING (true);

-- Create function to handle user creation
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

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default templates
INSERT INTO public.templates (id, name, description, preview_url) VALUES
('template1', 'Template 1', 'Classic professional layout with clean design', '/templates/template1-preview.png'),
('template2', 'Template 2', 'Modern layout with enhanced visual appeal', '/templates/template2-preview.png'),
('template3', 'Template 3', 'Professional card-style layout', '/templates/template3-preview.png'),
('template4', 'Template 4', 'Europass format', '/templates/template4-preview.png'),
('template5', 'Template 5', 'Elegant minimalist design with refined typography', '/templates/template5-preview.png')
ON CONFLICT (id) DO NOTHING;
`;

// Storage bucket setup
export const createStorageBuckets = `
-- Create storage bucket for CV files
INSERT INTO storage.buckets (id, name, public) VALUES
('cv-files', 'cv-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload own CV files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own CV files" ON storage.objects
  FOR SELECT USING (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own CV files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own CV files" ON storage.objects
  FOR DELETE USING (bucket_id = 'cv-files' AND auth.uid()::text = (storage.foldername(name))[1]);
`;

// Database initialization function
export const initializeDatabase = async (supabase) => {
  try {
    // Execute table creation
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTables
    })
    
    if (tableError) {
      console.error('Error creating tables:', tableError)
      return false
    }

    // Execute storage bucket creation
    const { error: storageError } = await supabase.rpc('exec_sql', {
      sql: createStorageBuckets
    })
    
    if (storageError) {
      console.error('Error creating storage buckets:', storageError)
      return false
    }

    console.log('Database initialized successfully')
    return true
  } catch (error) {
    console.error('Error initializing database:', error)
    return false
  }
}

// Helper functions for database operations
export const dbHelpers = {
  // Format CV data for database storage
  formatCVData: async (formData) => {
    let profileImageData = null;
    
    // Handle profile image - convert file to base64 if it exists
    if (formData.profileImage && formData.profileImage instanceof File) {
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.profileImage);
        });
        profileImageData = {
          name: formData.profileImage.name,
          type: formData.profileImage.type,
          size: formData.profileImage.size,
          data: base64
        };
      } catch (error) {
        console.error('Error converting profile image to base64:', error);
      }
    } else if (formData.profileImage && typeof formData.profileImage === 'object') {
      // If it's already a base64 object, use it directly
      profileImageData = formData.profileImage;
    }

    return {
      name: formData.name || '',
      title: formData.position || '',
      company: formData.company || '',
      cv_data: {
        personal_info: {
          name: formData.name,
          position: formData.position,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          showProfileImage: formData.showProfileImage !== false
        },
        professional_summary: formData.professionalSummary,
        education: formData.education || [],
        experience: formData.experience || [],
        skills: formData.skills || [],
        certifications: formData.certifications || [],
        languages: formData.languages || [],
        hobbies: formData.hobbies || [],
        otherInfo: formData.otherInfo || [],
        customSection: formData.customSection || [],
        references: formData.references || [],
        profileImage: profileImageData
      }
    }
  },

  // Extract form data from database CV data
  extractFormData: (cvData) => {
    const data = cvData.cv_data
    
    return {
      name: data.personal_info?.name || '',
      position: data.personal_info?.position || '',
      phone: data.personal_info?.phone || '',
      email: data.personal_info?.email || '',
      address: data.personal_info?.address || '',
      showProfileImage: data.personal_info?.showProfileImage !== false,
      professionalSummary: data.professional_summary || '',
      education: data.education || [],
      experience: data.experience || [],
      skills: data.skills || [],
      certifications: data.certifications || [],
      languages: data.languages || [],
      hobbies: data.hobbies || [],
      otherInfo: data.otherInfo || [],
      customSection: data.customSection || [],
      references: data.references || [],
      profileImage: data.profileImage || null
    };
  }
}

const dbExports = {
  createTables,
  createStorageBuckets,
  initializeDatabase,
  dbHelpers
};

export default dbExports;
