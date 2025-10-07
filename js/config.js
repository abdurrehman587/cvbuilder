// Production Configuration
window.CV_BUILDER_CONFIG = {
    // Environment
    environment: 'production', // 'development' or 'production'
    
    // Supabase Configuration
    supabase: {
        url: 'https://poqarsztryrdlliwjhgx.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWFyc3p0cnlyZGxsaXdqaGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTE0NzUsImV4cCI6MjA2NTYyNzQ3NX0.3fkTjLRdfTdIne_uE-m3GoNbu2mxREBlYrraRGX81_4'
    },
    
    // Application Settings
    app: {
        name: 'CV Builder',
        version: '1.0.0',
        description: 'Create Professional CVs with Ease',
        author: 'Abdur Rehman',
        repository: 'https://github.com/abdurrehman587/cvbuilder'
    },
    
    // Feature Flags
    features: {
        emailConfirmation: true, // Enable email confirmation for production
        emailConfirmationBypassForAdmin: true, // Bypass email confirmation for admin users
        localStorageFallback: true, // Keep true for development
        dynamicTables: true,
        adminPanel: true
    },
    
    // URLs
    urls: {
        home: '/',
        auth: '/auth',
        admin: '/admin',
        shopkeeper: '/shopkeeper'
    },
    
    // Database Tables
    tables: {
        userCvs: 'user_cvs',
        adminCvs: 'admin_cvs'
    }
};
