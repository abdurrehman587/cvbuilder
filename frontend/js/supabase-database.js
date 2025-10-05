// Supabase Database Management System for CV Builder
class SupabaseDatabaseManager {
    constructor() {
        this.adminTableName = 'admin_cvs';
        this.userTableName = 'user_cvs';
        this.supabase = null;
        this.init();
    }

    async init() {
        console.log('Supabase Database Manager initializing...');
        
        // Wait for Supabase to be available
        const checkSupabase = () => {
            if (window.supabaseConfig && window.supabaseConfig.isAvailable()) {
                this.supabase = window.supabaseConfig.getClient();
                console.log('Supabase client found and initialized');
                return true;
            }
            return false;
        };

        if (!checkSupabase()) {
            // Retry multiple times with increasing delays
            let retryCount = 0;
            const maxRetries = 5;
            
            const retryCheck = () => {
                retryCount++;
                if (checkSupabase()) {
                    console.log('Supabase connected on retry', retryCount);
                } else if (retryCount < maxRetries) {
                    console.log(`Retrying Supabase connection (${retryCount}/${maxRetries})...`);
                    setTimeout(retryCheck, 1000 * retryCount);
                } else {
                    console.error('Supabase not available after', maxRetries, 'retries');
                }
            };
            
            setTimeout(retryCheck, 1000);
        }
    }

    isSupabaseAvailable() {
        return this.supabase !== null;
    }

    async testConnection() {
        try {
            if (!this.isSupabaseAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }

            const { data, error } = await this.supabase
                .from(this.adminTableName)
                .select('count')
                .limit(1);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testUserCVsTable() {
        try {
            if (!this.isSupabaseAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }

            console.log('Testing user_cvs table access...');
            const { data, error } = await this.supabase
                .from(this.userTableName)
                .select('*')
                .limit(1);

            if (error) {
                console.error('user_cvs table test failed:', error);
                return { success: false, error: error.message };
            }

            console.log('user_cvs table test successful:', data);
            return { success: true, data: data };
        } catch (error) {
            console.error('user_cvs table test error:', error);
            return { success: false, error: error.message };
        }
    }

    async saveCV(cvData, userId, userRole = 'admin') {
        try {
            console.log('=== SAVE CV DEBUG ===');
            console.log('User ID:', userId);
            console.log('User Role:', userRole);
            console.log('CV Data:', cvData);
            
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available, saving to localStorage');
                const localCVs = JSON.parse(localStorage.getItem('localCVs') || '[]');
                const newCV = {
                    id: Date.now().toString(),
                    ...cvData,
                    created_at: new Date().toISOString(),
                    user_id: userId
                };
                localCVs.push(newCV);
                localStorage.setItem('localCVs', JSON.stringify(localCVs));
                return newCV;
            }
            
            // Determine which table to use based on user role
            let tableName;
            if (userRole === 'shopkeeper') {
                // Use the existing shopkeeper_cvs table for all shopkeepers
                tableName = 'shopkeeper_cvs';
                console.log('Using shopkeeper_cvs table for shopkeeper CVs');
            } else if (userRole === 'user') {
                tableName = this.userTableName;
            } else {
                tableName = this.adminTableName;
            }
            
            console.log('Selected table:', tableName);
            
            // Map to the appropriate table structure
            const fullName = cvData.personalInfo?.fullName || cvData.name || 'Untitled CV';
            
            // Create record based on table type
            let cvRecord;
            if (userRole === 'shopkeeper') {
                // Get shop name from user data
                const users = JSON.parse(localStorage.getItem('cvBuilder_users') || '[]');
                const user = users.find(u => u.id === userId);
                const shopName = user?.shopName || 'Unknown Shop';
                
                // For shopkeeper_cvs table
                cvRecord = {
                    shopkeeper_id: userId,
                    shop_name: shopName,
                    cv_name: fullName,
                    name: fullName,
                    email: cvData.personalInfo?.email || cvData.email || '',
                    phone: cvData.personalInfo?.phones ? 
                        (Array.isArray(cvData.personalInfo.phones) ? 
                            cvData.personalInfo.phones.map(p => p.phone || p).join(', ') : 
                            cvData.personalInfo.phones) : 
                        (cvData.phone || ''),
                    address: cvData.personalInfo?.address || cvData.address || '',
                    objective: cvData.personalInfo?.summary || '',
                    image_url: cvData.personalInfo?.profilePicture || null,
                    education: cvData.education || [],
                    work_experience: cvData.experience || [],
                    skills: cvData.skills || [],
                    certifications: cvData.certifications || [],
                    projects: cvData.customSections || [],
                    languages: cvData.languages || [],
                    hobbies: cvData.hobbies || [],
                    cv_references: cvData.references || [],
                    other_information: cvData.otherInfo || [],
                    custom_sections: cvData.customSections || [],
                    template: cvData.template || 'classic',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            } else if (userRole === 'user') {
                // For user_cvs table - match the actual table structure
                cvRecord = {
                    user_id: userId, // Correct column name is user_id
                    name: fullName,
                    email: cvData.personalInfo?.email || cvData.email || '',
                    cv_name: fullName // Add cv_name field
                };
                
                // Add optional fields that exist in the table
                if (cvData.personalInfo?.phones) {
                    cvRecord.phone = Array.isArray(cvData.personalInfo.phones) ? 
                        cvData.personalInfo.phones.map(p => p.phone || p).join(', ') : 
                        cvData.personalInfo.phones;
                }
                
                if (cvData.personalInfo?.address || cvData.address) {
                    cvRecord.address = cvData.personalInfo?.address || cvData.address;
                }
                
                // objective is JSONB, so store as array
                if (cvData.personalInfo?.summary) {
                    cvRecord.objective = [cvData.personalInfo.summary];
                } else {
                    cvRecord.objective = [];
                }
                
                if (cvData.personalInfo?.profilePicture) {
                    cvRecord.image_url = cvData.personalInfo.profilePicture;
                }
                
                // Add JSONB fields (all are arrays in this table)
                cvRecord.education = cvData.education || [];
                cvRecord.work_experience = cvData.experience || [];
                cvRecord.skills = cvData.skills || [];
                cvRecord.certifications = cvData.certifications || [];
                cvRecord.projects = cvData.customSections || [];
                cvRecord.languages = cvData.languages || [];
                cvRecord.hobbies = cvData.hobbies || [];
                cvRecord.cv_references = cvData.references || [];
                cvRecord.other_information = cvData.otherInfo || [];
                cvRecord.custom_sections = cvData.customSections || [];
            } else {
                // For admin_cvs table (legacy structure)
                cvRecord = {
                    admin_email: userId,
                    cv_name: fullName,
                    name: fullName,
                    email: cvData.personalInfo?.email || cvData.email || '',
                    phone: cvData.personalInfo?.phones ? 
                        (Array.isArray(cvData.personalInfo.phones) ? 
                            cvData.personalInfo.phones.map(p => p.phone || p).join(', ') : 
                            cvData.personalInfo.phones) : 
                        (cvData.phone || ''),
                    address: cvData.personalInfo?.address || cvData.address || '',
                objective: cvData.personalInfo?.summary || '',
                image_url: cvData.personalInfo?.profilePicture || null,
                education: JSON.stringify(cvData.education || []),
                work_experience: JSON.stringify(cvData.experience || []),
                skills: JSON.stringify(cvData.skills || []),
                certifications: JSON.stringify(cvData.certifications || []),
                projects: JSON.stringify(cvData.customSections || []),
                languages: JSON.stringify(cvData.languages || []),
                hobbies: JSON.stringify(cvData.hobbies || []),
                cv_references: JSON.stringify(cvData.references || []),
                other_information: JSON.stringify(cvData.otherInfo || []),
                custom_sections: JSON.stringify(cvData.customSections || []),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            }

            console.log('Attempting to insert CV record:', cvRecord);
            
            // First, let's test if the table exists by trying to select from it
            console.log('Testing table access for:', tableName);
            const { data: testData, error: testError } = await this.supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (testError) {
                console.error('Table access test failed for', tableName, ':', testError);
                console.error('This might mean the table does not exist or has permission issues');
                // Don't fallback to localStorage - force database save
                console.log('Proceeding with database save despite test error');
            } else {
                console.log('Table access test successful for', tableName);
            }
            
            // Check if CV already exists for this user to handle duplicate key constraint
            let uniqueField;
            if (userRole === 'shopkeeper') {
                uniqueField = 'shopkeeper_id';
            } else if (userRole === 'user') {
                uniqueField = 'user_id';
            } else {
                uniqueField = 'admin_email';
            }
            
            console.log('Checking for existing CV with', uniqueField, '=', userId);
            const { data: existingCV, error: checkError } = await this.supabase
                .from(tableName)
                .select('*')
                .eq(uniqueField, userId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                // PGRST116 is "not found" error, which is expected if no CV exists
                console.error('Error checking for existing CV:', checkError);
                throw new Error(`Error checking existing CV: ${checkError.message}`);
            }

            let data, error;
            if (existingCV) {
                console.log('Existing CV found, updating instead of inserting');
                // Update existing CV
                const updateData = { ...cvRecord };
                // Remove the unique field from update data to avoid conflicts
                delete updateData[uniqueField];
                delete updateData.created_at; // Don't update created_at
                updateData.updated_at = new Date().toISOString();
                
                const result = await this.supabase
                    .from(tableName)
                    .update(updateData)
                    .eq(uniqueField, userId)
                    .select();
                
                data = result.data;
                error = result.error;
            } else {
                console.log('No existing CV found, creating new one');
                // Try to insert the CV
                const result = await this.supabase
                    .from(tableName)
                    .insert([cvRecord])
                    .select();
                
                data = result.data;
                error = result.error;
            }

            if (error) {
                console.error('Error saving CV to', tableName, ':', error);
                console.error('Error details:', error.message, error.details, error.hint);
                console.error('Full error object:', error);
                
                // Don't fallback to localStorage - throw the error to be handled by caller
                throw new Error(`Database save failed: ${error.message}`);
            }

            console.log('CV saved successfully to', tableName, ':', data[0]);
            return data[0];
        } catch (error) {
            console.error('Error in saveCV:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            throw error; // Re-throw to get more details
        }
    }

    async updateCV(cvId, cvData, userId, userRole = 'admin') {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for update');
                return null;
            }
            
            // Determine which table to use based on user role
            let tableName;
            if (userRole === 'shopkeeper') {
                // Use shopkeeper_cvs table for all shopkeepers
                tableName = 'shopkeeper_cvs';
            } else if (userRole === 'user') {
                tableName = this.userTableName;
            } else {
                tableName = this.adminTableName;
            }
            
            // Map to the appropriate table structure
            const fullName = cvData.personalInfo?.fullName || cvData.name || 'Untitled CV';
            
            // Create update data based on table type
            let updateData;
            if (userRole === 'shopkeeper') {
                // For dynamic shopkeeper table
                updateData = {
                    shopkeeper_id: userId,
                    cv_name: fullName,
                    name: fullName,
                    email: cvData.personalInfo?.email || cvData.email || '',
                    phone: cvData.personalInfo?.phones ? 
                        (Array.isArray(cvData.personalInfo.phones) ? 
                            cvData.personalInfo.phones.map(p => p.phone || p).join(', ') : 
                            cvData.personalInfo.phones) : 
                        (cvData.phone || ''),
                    address: cvData.personalInfo?.address || cvData.address || '',
                    objective: cvData.personalInfo?.summary || '',
                    image_url: cvData.personalInfo?.profilePicture || null,
                    education: cvData.education || [],
                    work_experience: cvData.experience || [],
                    skills: cvData.skills || [],
                    certifications: cvData.certifications || [],
                    projects: cvData.customSections || [],
                    languages: cvData.languages || [],
                    hobbies: cvData.hobbies || [],
                    cv_references: cvData.references || [],
                    other_information: cvData.otherInfo || [],
                    custom_sections: cvData.customSections || [],
                    template: cvData.template || 'classic',
                    updated_at: new Date().toISOString()
                };
            } else if (userRole === 'user') {
                // For user_cvs table - match the actual table structure
                updateData = {
                    user_id: userId, // Correct column name is user_id
                    cv_name: fullName,
                    name: fullName,
                    email: cvData.personalInfo?.email || cvData.email || '',
                    phone: cvData.personalInfo?.phones ? 
                        (Array.isArray(cvData.personalInfo.phones) ? 
                            cvData.personalInfo.phones.map(p => p.phone || p).join(', ') : 
                            cvData.personalInfo.phones) : 
                        (cvData.phone || ''),
                    address: cvData.personalInfo?.address || cvData.address || '',
                    objective: cvData.personalInfo?.summary ? [cvData.personalInfo.summary] : [], // JSONB array
                    image_url: cvData.personalInfo?.profilePicture || null,
                    education: cvData.education || [],
                    work_experience: cvData.experience || [],
                    skills: cvData.skills || [],
                    certifications: cvData.certifications || [],
                    projects: cvData.customSections || [],
                    languages: cvData.languages || [],
                    hobbies: cvData.hobbies || [],
                    cv_references: cvData.references || [],
                    other_information: cvData.otherInfo || [],
                    custom_sections: cvData.customSections || [],
                    updated_at: new Date().toISOString()
                };
            } else {
                // For admin_cvs table (legacy structure)
                updateData = {
                    admin_email: userId,
                    cv_name: fullName,
                    name: fullName,
                    email: cvData.personalInfo?.email || cvData.email || '',
                    phone: cvData.personalInfo?.phones ? 
                        (Array.isArray(cvData.personalInfo.phones) ? 
                            cvData.personalInfo.phones.map(p => p.phone || p).join(', ') : 
                            cvData.personalInfo.phones) : 
                        (cvData.phone || ''),
                    address: cvData.personalInfo?.address || cvData.address || '',
                objective: cvData.personalInfo?.summary || '',
                image_url: cvData.personalInfo?.profilePicture || null,
                education: JSON.stringify(cvData.education || []),
                work_experience: JSON.stringify(cvData.experience || []),
                skills: JSON.stringify(cvData.skills || []),
                certifications: JSON.stringify(cvData.certifications || []),
                projects: JSON.stringify(cvData.customSections || []),
                languages: JSON.stringify(cvData.languages || []),
                hobbies: JSON.stringify(cvData.hobbies || []),
                cv_references: JSON.stringify(cvData.references || []),
                other_information: JSON.stringify(cvData.otherInfo || []),
                custom_sections: JSON.stringify(cvData.customSections || []),
                updated_at: new Date().toISOString()
            };
            }
            
            const { data, error } = await this.supabase
                .from(tableName)
                .update(updateData)
                .eq('id', cvId)
                .select();

            if (error) {
                console.error('Error updating CV:', error);
                return null;
            }

            console.log('CV updated successfully in', tableName, ':', data[0]);
            return data[0];
        } catch (error) {
            console.error('Error in updateCV:', error);
            return null;
        }
    }

    async getCVById(cvId, userRole = 'admin') {
        try {
            console.log('=== GET CV BY ID DEBUG ===');
            console.log('CV ID:', cvId);
            console.log('User Role:', userRole);
            
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available, checking localStorage');
                const localCVs = JSON.parse(localStorage.getItem('localCVs') || '[]');
                return localCVs.find(cv => cv.id === cvId);
            }

            // For admin role, search ALL tables to find the CV
            if (userRole === 'admin') {
                return await this.getCVByIdFromAllTables(cvId);
            }

            // Determine which table to use based on user role
            let tableName;
            if (userRole === 'shopkeeper') {
                // Use the existing shopkeeper_cvs table
                tableName = 'shopkeeper_cvs';
            } else if (userRole === 'user') {
                tableName = this.userTableName;
            } else {
                tableName = this.adminTableName;
            }

            console.log('Using table:', tableName);
            console.log('Searching for CV with ID:', cvId);

            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .eq('id', cvId)
                .single();

            if (error) {
                console.error('Error getting CV by ID:', error);
                return null;
            }

            console.log('CV found:', data);
            console.log('=== END GET CV BY ID DEBUG ===');
            return data;
        } catch (error) {
            console.error('Error in getCVById:', error);
            return null;
        }
    }

    async getCVByIdFromAllTables(cvId) {
        try {
            console.log('=== SEARCHING ALL TABLES FOR CV ID:', cvId);
            
            // Search admin_cvs table
            try {
                const { data: adminData, error: adminError } = await this.supabase
                    .from(this.adminTableName)
                    .select('*')
                    .eq('id', cvId)
                    .single();
                
                if (!adminError && adminData) {
                    console.log('Found CV in admin_cvs table');
                    return adminData;
                }
            } catch (error) {
                console.log('admin_cvs table not accessible:', error.message);
            }
            
            // Search shopkeeper_cvs table
            try {
                const { data: shopkeeperData, error: shopkeeperError } = await this.supabase
                    .from('shopkeeper_cvs')
                    .select('*')
                    .eq('id', cvId)
                    .single();
                
                if (!shopkeeperError && shopkeeperData) {
                    console.log('Found CV in shopkeeper_cvs table');
                    return shopkeeperData;
                }
            } catch (error) {
                console.log('shopkeeper_cvs table not accessible:', error.message);
            }
            
            // Search user_cvs table
            try {
                const { data: userData, error: userError } = await this.supabase
                    .from(this.userTableName)
                    .select('*')
                    .eq('id', cvId)
                    .single();
                
                if (!userError && userData) {
                    console.log('Found CV in user_cvs table');
                    return userData;
                }
            } catch (error) {
                console.log('user_cvs table not accessible:', error.message);
            }
            
            console.log('CV not found in any table');
            return null;
            
        } catch (error) {
            console.error('Error searching all tables for CV:', error);
            return null;
        }
    }

    async getAllCVs(userRole = 'admin') {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available, returning localStorage CVs');
                return JSON.parse(localStorage.getItem('localCVs') || '[]');
            }

            // Determine which table to use based on user role
            let tableName;
            if (userRole === 'shopkeeper') {
                tableName = 'shopkeeper_cvs';
            } else if (userRole === 'user') {
                tableName = this.userTableName;
            } else {
                tableName = this.adminTableName;
            }

            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error getting all CVs from', tableName, ':', error);
                return [];
            }

            return data;
        } catch (error) {
            console.error('Error in getAllCVs:', error);
            return [];
        }
    }

    async saveCVToLocalStorage(cvRecord, userId, userRole) {
        try {
            console.log('Saving CV to localStorage fallback');
            
            const localCVs = JSON.parse(localStorage.getItem('localCVs') || '[]');
            const newCV = {
                id: Date.now().toString(),
                ...cvRecord,
                user_id: userId,
                user_role: userRole,
                table_name: userRole === 'shopkeeper' ? cvRecord.shopkeeper_id : 'local',
                created_at: new Date().toISOString()
            };
            
            localCVs.push(newCV);
            localStorage.setItem('localCVs', JSON.stringify(localCVs));
            
            console.log('CV saved to localStorage:', newCV);
            return newCV;
            
        } catch (error) {
            console.error('Error saving CV to localStorage:', error);
            throw error;
        }
    }

    async verifyTableExists(tableName) {
        try {
            console.log(`Verifying table exists: ${tableName}`);
            const { data, error } = await this.supabase
                .from(tableName)
                .select('id')
                .limit(1);
            
            if (error) {
                console.log(`Table ${tableName} does not exist or is not accessible:`, error.message);
                return false;
            }
            
            console.log(`Table ${tableName} exists and is accessible`);
            return true;
        } catch (error) {
            console.log(`Error verifying table ${tableName}:`, error.message);
            return false;
        }
    }

    async createShopkeeperTable(tableName, shopName) {
        try {
            console.log(`Creating shopkeeper table: ${tableName} for shop: ${shopName}`);
            
            // Since exec_sql is not available, we'll use the existing shopkeeper_cvs table
            // and add a shop_name column to distinguish between different shops
            console.log('Using existing shopkeeper_cvs table with shop_name filtering');
            return { success: true, tableName: 'shopkeeper_cvs', fallback: false };
            
        } catch (error) {
            console.error('Error in createShopkeeperTable:', error);
            return { success: false, error: error.message };
        }
    }
    
    async createShopkeeperTableFallback(tableName, shopName) {
        try {
            console.log(`Using localStorage fallback for shopkeeper table: ${tableName}`);
            
            // Store the table name in localStorage for future reference
            const tableInfo = {
                tableName: tableName,
                shopName: shopName,
                createdAt: new Date().toISOString(),
                status: 'localStorage_fallback'
            };
            
            // Store in localStorage
            const existingTables = JSON.parse(localStorage.getItem('shopkeeper_tables') || '[]');
            const tableExists = existingTables.find(t => t.tableName === tableName);
            
            if (!tableExists) {
                existingTables.push(tableInfo);
                localStorage.setItem('shopkeeper_tables', JSON.stringify(existingTables));
                console.log('Table info stored in localStorage:', tableInfo);
            }
            
            return { success: true, tableName, fallback: true };
            
        } catch (error) {
            console.error('Error in createShopkeeperTableFallback:', error);
            return { success: false, error: error.message };
        }
    }

    async createShopkeeperTableAlternative(tableName, shopName) {
        try {
            console.log(`Creating shopkeeper table using alternative method: ${tableName}`);
            
            // Create a temporary function to execute the SQL
            const createFunctionSQL = `
                CREATE OR REPLACE FUNCTION create_shopkeeper_table(table_name text, shop_name text)
                RETURNS void AS $$
                BEGIN
                    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I (
                        id SERIAL PRIMARY KEY,
                        shopkeeper_id UUID NOT NULL,
                        shop_name VARCHAR(255) NOT NULL,
                        cv_data JSONB NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )', table_name);
                    
                    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
                    
                    EXECUTE format('CREATE POLICY IF NOT EXISTS "%s_shopkeeper_policy" ON public.%I
                        FOR ALL USING (shopkeeper_id = auth.uid())', table_name, table_name);
                END;
                $$ LANGUAGE plpgsql;
                
                SELECT create_shopkeeper_table('${tableName}', '${shopName}');
                
                DROP FUNCTION create_shopkeeper_table(text, text);
            `;
            
            const { data, error } = await this.supabase.rpc('exec_sql', { sql: createFunctionSQL });
            
            if (error) {
                console.error('Alternative table creation failed:', error);
                console.log('Table creation failed, but continuing with save attempt...');
                return { success: false, error: error.message };
            }
            
            console.log('Shopkeeper table created successfully using alternative method:', tableName);
            return { success: true, tableName };
            
        } catch (error) {
            console.error('Error in createShopkeeperTableAlternative:', error);
            console.log('Table creation failed, but continuing with save attempt...');
            return { success: false, error: error.message };
        }
    }

    async searchCVs(name, mobile, template, userRole = 'admin', userId = null, limit = 50, offset = 0, loadFullData = false) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available, searching localStorage');
                const localCVs = JSON.parse(localStorage.getItem('localCVs') || '[]');
                const filtered = localCVs.filter(cv => this.matchesSearchCriteria(cv, name, mobile, template));
                return {
                    data: filtered.slice(offset, offset + limit),
                    total: filtered.length,
                    hasMore: (offset + limit) < filtered.length
                };
            }

            // For admin role, search ALL tables to get all CVs
            if (userRole === 'admin') {
                return await this.searchAllTables(name, mobile, template, limit, offset, loadFullData);
            }

            // Determine which table to use based on user role
            let tableName;
            if (userRole === 'shopkeeper') {
                // Use the existing shopkeeper_cvs table
                tableName = 'shopkeeper_cvs';
                console.log('Using shopkeeper_cvs table for shopkeeper CVs');
            } else if (userRole === 'user') {
                tableName = this.userTableName;
            } else {
                tableName = this.adminTableName;
            }

            // Select only essential fields for fast loading, or all fields for full data
            const selectFields = loadFullData ? '*' : 'id, name, phone, email, template, created_at, updated_at';
            
            let query = this.supabase
                .from(tableName)
                .select(selectFields, { count: 'exact' });

            // Add role-specific filtering
            if (userRole === 'shopkeeper' && userId) {
                // Filter by shopkeeper_id for shopkeepers
                query = query.eq('shopkeeper_id', userId);
                console.log('Filtering shopkeeper CVs by shopkeeper_id:', userId);
            } else if (userRole === 'user' && userId) {
                // Filter by user_id for users
                query = query.eq('user_id', userId);
                console.log('Filtering user CVs by user_id:', userId);
            }

            if (name) {
                query = query.ilike('name', `%${name}%`);
            }
            if (mobile) {
                query = query.ilike('phone', `%${mobile}%`);
            }
            if (template) {
                query = query.eq('template', template);
            }

            // Add pagination
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                console.error('Error searching CVs in', tableName, ':', error);
                
                // If it's a shopkeeper and the dynamic table doesn't exist, return empty array
                if (userRole === 'shopkeeper' && error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.log('Dynamic shopkeeper table not found');
                    console.log('This shopkeeper may not have created any CVs yet, or the table was not created properly');
                    return { data: [], total: 0, hasMore: false };
                }
                
                console.error('Full error object:', error);
                throw new Error(`Database search failed: ${error.message}`);
            }

            const total = count || 0;
            const hasMore = (offset + limit) < total;

            console.log(`Found ${data.length} CVs in ${tableName} table for ${userRole} ${userId} (${offset}-${offset + data.length} of ${total})`);
            
            return {
                data: data || [],
                total: total,
                hasMore: hasMore
            };
        } catch (error) {
            console.error('Error in searchCVs:', error);
            return { data: [], total: 0, hasMore: false };
        }
    }

    async searchAllTables(name, mobile, template, limit = 50, offset = 0, loadFullData = false) {
        try {
            console.log('=== SEARCHING ALL TABLES FOR ADMIN ===');
            console.log('Search params:', { name, mobile, template, limit, offset });
            console.log('Supabase available:', this.isSupabaseAvailable());
            console.log('Supabase client:', !!this.supabase);
            
            const selectFields = loadFullData ? '*' : 'id, name, phone, email, template, created_at, updated_at';
            const allResults = [];
            let totalCount = 0;
            
            // Search admin_cvs table
            try {
                console.log('Searching admin_cvs table...');
                console.log('Table name:', this.adminTableName);
                let adminQuery = this.supabase
                    .from(this.adminTableName)
                    .select(selectFields, { count: 'exact' });
                
                if (name) {
                    adminQuery = adminQuery.ilike('name', `%${name}%`);
                }
                if (mobile) {
                    adminQuery = adminQuery.ilike('phone', `%${mobile}%`);
                }
                if (template) {
                    adminQuery = adminQuery.eq('template', template);
                }
                
                const { data: adminData, error: adminError, count: adminCount } = await adminQuery
                    .order('created_at', { ascending: false });
                
                console.log('Admin table query result:', { adminData, adminError, adminCount });
                
                if (!adminError && adminData) {
                    allResults.push(...adminData.map(cv => ({ ...cv, source: 'admin' })));
                    totalCount += adminCount || 0;
                    console.log(`Found ${adminData.length} CVs in admin_cvs table (total: ${adminCount})`);
                } else {
                    console.log('admin_cvs table error or empty:', adminError?.message);
                    console.log('Admin error details:', adminError);
                }
            } catch (error) {
                console.log('admin_cvs table not accessible:', error.message);
                console.log('Admin table error:', error);
            }
            
            // Search shopkeeper_cvs table
            try {
                console.log('Searching shopkeeper_cvs table...');
                let shopkeeperQuery = this.supabase
                    .from('shopkeeper_cvs')
                    .select(selectFields, { count: 'exact' });
                
                if (name) {
                    shopkeeperQuery = shopkeeperQuery.ilike('name', `%${name}%`);
                }
                if (mobile) {
                    shopkeeperQuery = shopkeeperQuery.ilike('phone', `%${mobile}%`);
                }
                if (template) {
                    shopkeeperQuery = shopkeeperQuery.eq('template', template);
                }
                
                const { data: shopkeeperData, error: shopkeeperError, count: shopkeeperCount } = await shopkeeperQuery
                    .order('created_at', { ascending: false });
                
                console.log('Shopkeeper table query result:', { shopkeeperData, shopkeeperError, shopkeeperCount });
                
                if (!shopkeeperError && shopkeeperData) {
                    allResults.push(...shopkeeperData.map(cv => ({ ...cv, source: 'shopkeeper' })));
                    totalCount += shopkeeperCount || 0;
                    console.log(`Found ${shopkeeperData.length} CVs in shopkeeper_cvs table (total: ${shopkeeperCount})`);
                } else {
                    console.log('shopkeeper_cvs table error or empty:', shopkeeperError?.message);
                    console.log('Shopkeeper error details:', shopkeeperError);
                }
            } catch (error) {
                console.log('shopkeeper_cvs table not accessible:', error.message);
                console.log('Shopkeeper table error:', error);
            }
            
            // Search user_cvs table
            try {
                console.log('Searching user_cvs table...');
                console.log('User table name:', this.userTableName);
                let userQuery = this.supabase
                    .from(this.userTableName)
                    .select(selectFields, { count: 'exact' });
                
                if (name) {
                    userQuery = userQuery.ilike('name', `%${name}%`);
                }
                if (mobile) {
                    userQuery = userQuery.ilike('phone', `%${mobile}%`);
                }
                if (template) {
                    userQuery = userQuery.eq('template', template);
                }
                
                const { data: userData, error: userError, count: userCount } = await userQuery
                    .order('created_at', { ascending: false });
                
                console.log('User table query result:', { userData, userError, userCount });
                
                if (!userError && userData) {
                    allResults.push(...userData.map(cv => ({ ...cv, source: 'user' })));
                    totalCount += userCount || 0;
                    console.log(`Found ${userData.length} CVs in user_cvs table (total: ${userCount})`);
                } else {
                    console.log('user_cvs table error or empty:', userError?.message);
                    console.log('User error details:', userError);
                }
            } catch (error) {
                console.log('user_cvs table not accessible:', error.message);
                console.log('User table error:', error);
            }
            
            // Sort by created_at descending
            allResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Apply pagination
            const total = allResults.length;
            const paginatedResults = allResults.slice(offset, offset + limit);
            const hasMore = (offset + limit) < total;
            
            console.log(`=== FINAL RESULTS ===`);
            console.log(`Total CVs found across all tables: ${total} (actual results)`);
            console.log(`Database total count: ${totalCount} (from count queries)`);
            console.log(`Returning ${paginatedResults.length} CVs (${offset}-${offset + paginatedResults.length})`);
            console.log(`All results sample:`, allResults.slice(0, 3));
            console.log(`Paginated results:`, paginatedResults);
            console.log(`=== END FINAL RESULTS ===`);
            
            return {
                data: paginatedResults,
                total: total,
                hasMore: hasMore
            };
            
        } catch (error) {
            console.error('Error searching all tables:', error);
            return { data: [], total: 0, hasMore: false };
        }
    }

    matchesSearchCriteria(cv, name, mobile, template) {
        let matches = true;

        if (name && cv.name && !cv.name.toLowerCase().includes(name.toLowerCase())) {
            matches = false;
        }

        if (mobile && cv.phone && !cv.phone.includes(mobile)) {
            matches = false;
        }

        if (template && cv.template && cv.template !== template) {
            matches = false;
        }

        return matches;
    }

    async deleteCV(cvId, userRole = 'admin') {
        try {
            console.log('=== DELETE CV DEBUG ===');
            console.log('CV ID to delete:', cvId);
            console.log('User Role:', userRole);
            
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for deletion');
                return false;
            }

            // Determine which table to use based on user role
            let tableName;
            if (userRole === 'shopkeeper') {
                tableName = 'shopkeeper_cvs';
            } else if (userRole === 'user') {
                tableName = this.userTableName;
            } else {
                tableName = this.adminTableName;
            }

            console.log('Using table for deletion:', tableName);

            const { error } = await this.supabase
                .from(tableName)
                .delete()
                .eq('id', cvId);

            if (error) {
                console.error('Error deleting CV from', tableName, ':', error);
                return false;
            }

            console.log('CV deleted successfully from', tableName);
            return true;
        } catch (error) {
            console.error('Error in deleteCV:', error);
            return false;
        }
    }

    convertFromTableFormat(tableCV) {
        if (!tableCV) return null;

        try {
        return {
                id: tableCV.id,
            personalInfo: {
                    fullName: tableCV.name || tableCV.cv_name || '',
                    email: tableCV.email || '',
                    phones: tableCV.phone ? [{ phone: tableCV.phone }] : [],
                    address: tableCV.address || '',
                    profilePicture: tableCV.image_url || null,
                    summary: tableCV.objective || ''
                },
                education: this.parseJsonField(tableCV.education),
                experience: this.parseJsonField(tableCV.work_experience),
                certifications: this.parseJsonField(tableCV.certifications),
                skills: this.parseJsonField(tableCV.skills),
                languages: this.parseJsonField(tableCV.languages),
                hobbies: this.parseJsonField(tableCV.hobbies),
                customSections: this.parseJsonField(tableCV.custom_sections),
                otherInfo: this.parseJsonField(tableCV.other_information),
                references: this.parseJsonField(tableCV.cv_references),
                template: 'classic' // Default since template column doesn't exist
            };
        } catch (error) {
            console.error('Error converting from table format:', error);
            return tableCV;
        }
    }

    // Helper method to safely parse JSON fields
    parseJsonField(jsonString) {
        try {
            if (!jsonString || jsonString === 'null' || jsonString === 'undefined') {
                return [];
            }
            
            if (Array.isArray(jsonString) || (typeof jsonString === 'object' && jsonString !== null)) {
                return jsonString;
            }
            
            if (typeof jsonString === 'string') {
                if (jsonString.includes(',') && !jsonString.startsWith('[') && !jsonString.startsWith('{')) {
                    return jsonString.split(',').map(item => item.trim()).filter(item => item.length > 0);
                }
                return JSON.parse(jsonString);
            }
            
            return [];
        } catch (error) {
            console.error('Error parsing JSON field:', error);
            if (typeof jsonString === 'string' && jsonString.length > 0) {
                if (jsonString.includes(',')) {
                    return jsonString.split(',').map(item => item.trim()).filter(item => item.length > 0);
                } else {
                    return [jsonString.trim()];
                }
            }
            return [];
        }
    }

    // Shopkeeper management methods
    async getShopkeeperByEmail(email) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for shopkeeper lookup');
        return null;
    }

            const { data, error } = await this.supabase
                .from('shopkeepers')
                .select('*')
                .eq('email', email)
                .single();

            if (error) {
                console.error('Error getting shopkeeper by email:', error);
        return null;
    }

            return data;
        } catch (error) {
            console.error('Error in getShopkeeperByEmail:', error);
            return null;
        }
    }

    async getAllShopkeepers() {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for shopkeeper lookup');
                return [];
            }
            
            const { data, error } = await this.supabase
                .from('shopkeepers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error getting all shopkeepers:', error);
                return [];
            }

            return data;
        } catch (error) {
            console.error('Error in getAllShopkeepers:', error);
            return [];
        }
    }

    async createShopkeeper(shopkeeperData) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for shopkeeper creation');
                return null;
            }

            const { data, error } = await this.supabase
                .from('shopkeepers')
                .insert([shopkeeperData])
                .select();

            if (error) {
                console.error('Error creating shopkeeper:', error);
                return null;
            }

            return data[0];
        } catch (error) {
            console.error('Error in createShopkeeper:', error);
            return null;
        }
    }

    async updateShopkeeper(shopkeeperId, updateData) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for shopkeeper update');
                return null;
            }

            const { data, error } = await this.supabase
                .from('shopkeepers')
                .update(updateData)
                .eq('id', shopkeeperId)
                .select();

            if (error) {
                console.error('Error updating shopkeeper:', error);
        return null;
    }

            return data[0];
        } catch (error) {
            console.error('Error in updateShopkeeper:', error);
            return null;
        }
    }

    async deleteShopkeeper(shopkeeperId) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for shopkeeper deletion');
                return false;
            }

            const { error } = await this.supabase
                .from('shopkeepers')
                .delete()
                .eq('id', shopkeeperId);

            if (error) {
                console.error('Error deleting shopkeeper:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteShopkeeper:', error);
            return false;
        }
    }

    // CV download tracking methods
    async trackCVDownload(shopkeeperId, cvId, downloadType = 'pdf', fileSizeKB = null) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for download tracking');
                return false;
            }

            console.log('Tracking CV Download:', { shopkeeperId, cvId, downloadType, fileSizeKB });

            const downloadData = {
                shopkeeper_id: shopkeeperId,
                cv_id: cvId,
                download_type: downloadType,
                downloaded_at: new Date().toISOString(),
                file_size_kb: fileSizeKB,
                ip_address: null, // Could be added if needed
                user_agent: navigator.userAgent
            };

            const { data, error } = await this.supabase
                .from('cv_downloads')
                .insert([downloadData])
                .select();

            if (error) {
                console.error('Error tracking CV download:', error);
                // If table doesn't exist, create it automatically
                if (error.code === 'PGRST116' || error.message.includes('relation "cv_downloads" does not exist')) {
                    console.log('cv_downloads table does not exist. Please run the SQL script to create it.');
                    return false;
                }
                return false;
            }

            console.log('Download tracked successfully:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Error in trackCVDownload:', error);
            return false;
        }
    }

    async getShopkeeperDownloads(shopkeeperId) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for download history');
                return [];
            }

            // For now, return empty array since cv_downloads table doesn't exist yet
            console.log('Returning empty downloads for shopkeeper:', shopkeeperId);
            return [];

            // TODO: Uncomment this once cv_downloads table is created
            /*
            const { data, error } = await this.supabase
                .from('cv_downloads')
                .select(`
                    *,
                    cvs:cv_id (
                        id,
                        name,
                        email,
                        phone
                    )
                `)
                .eq('shopkeeper_id', shopkeeperId)
                .order('downloaded_at', { ascending: false });

            if (error) {
                console.error('Error getting shopkeeper downloads:', error);
                return [];
            }

            return data;
            */
        } catch (error) {
            console.error('Error in getShopkeeperDownloads:', error);
            return [];
        }
    }

    async getShopkeeperStats(shopkeeperId) {
        try {
            if (!this.isSupabaseAvailable()) {
                console.warn('Supabase not available for shopkeeper stats');
                return { totalDownloads: 0, uniqueCVs: 0 };
            }

            console.log('Getting stats for shopkeeper:', shopkeeperId);

            const { data, error } = await this.supabase
                .from('cv_downloads')
                .select('*')
                .eq('shopkeeper_id', shopkeeperId);

            if (error) {
                console.error('Error getting shopkeeper stats:', error);
                if (error.code === 'PGRST116' || error.message.includes('relation "cv_downloads" does not exist')) {
                    console.log('cv_downloads table does not exist. Please run the SQL script to create it.');
                }
                return { totalDownloads: 0, uniqueCVs: 0 };
            }

            const totalDownloads = data.length;
            const uniqueCVs = new Set(data.map(d => d.cv_id)).size;

            console.log('Shopkeeper stats:', { totalDownloads, uniqueCVs });
            return {
                totalDownloads,
                uniqueCVs
            };
        } catch (error) {
            console.error('Error in getShopkeeperStats:', error);
            return { totalDownloads: 0, uniqueCVs: 0 };
        }
    }
}

// Create global instance
window.supabaseDatabaseManager = new SupabaseDatabaseManager();

// Global test function
window.testSupabase = async function() {
    console.log('=== MANUAL SUPABASE TEST ===');
    if (window.supabaseDatabaseManager) {
        const result = await window.supabaseDatabaseManager.testConnection();
        console.log('Test result:', result);
    } else {
        console.log('Database manager not available');
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseDatabaseManager;
}








