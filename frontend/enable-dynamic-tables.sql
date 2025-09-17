-- Enable Dynamic Table Creation for Shopkeepers
-- Run this SQL in your Supabase SQL Editor to enable dynamic table creation

-- 1. Create a function to safely create shopkeeper tables
CREATE OR REPLACE FUNCTION create_shopkeeper_table(table_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Validate table name to prevent SQL injection
    IF table_name !~ '^shop_[a-z0-9_]+_cvs$' THEN
        RETURN 'Invalid table name format';
    END IF;
    
    -- Create the table
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I (
        id BIGSERIAL PRIMARY KEY,
        shopkeeper_id TEXT NOT NULL,
        cv_name TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        objective TEXT,
        image_url TEXT,
        education JSONB DEFAULT ''[]''::jsonb,
        work_experience JSONB DEFAULT ''[]''::jsonb,
        skills JSONB DEFAULT ''[]''::jsonb,
        certifications JSONB DEFAULT ''[]''::jsonb,
        projects JSONB DEFAULT ''[]''::jsonb,
        languages JSONB DEFAULT ''[]''::jsonb,
        hobbies JSONB DEFAULT ''[]''::jsonb,
        cv_references JSONB DEFAULT ''[]''::jsonb,
        other_information JSONB DEFAULT ''[]''::jsonb,
        custom_sections JSONB DEFAULT ''[]''::jsonb,
        template TEXT DEFAULT ''classic'',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )', table_name);
    
    -- Create indexes for better performance
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_shopkeeper_id ON %I(shopkeeper_id)', 
                   table_name, table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_name ON %I(name)', 
                   table_name, table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_email ON %I(email)', 
                   table_name, table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_created_at ON %I(created_at)', 
                   table_name, table_name);
    
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    
    -- Create RLS policy
    EXECUTE format('CREATE POLICY "Shopkeeper can manage their own CVs" ON %I
        FOR ALL USING (shopkeeper_id = current_setting(''app.current_user_id'', true))', table_name);
    
    RETURN 'Table created successfully: ' || table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_shopkeeper_table(TEXT) TO authenticated;

-- 3. Create a function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Grant execute permission for table existence check
GRANT EXECUTE ON FUNCTION table_exists(TEXT) TO authenticated;

-- 5. Test the function (optional - you can remove this)
-- SELECT create_shopkeeper_table('shop_test_shop_cvs');

-- Success message
SELECT 'Dynamic table creation functions installed successfully!' as message;
