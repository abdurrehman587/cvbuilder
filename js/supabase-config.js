// Supabase Configuration
class SupabaseConfig {
    constructor() {
        // Get configuration from environment variables or use defaults
        this.supabaseUrl = this.getEnvVar('VITE_SUPABASE_URL', 'https://poqarsztryrdlliwjhgx.supabase.co');
        this.supabaseKey = this.getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWFyc3p0cnlyZGxsaXdqaGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTE0NzUsImV4cCI6MjA2NTYyNzQ3NX0.3fkTjLRdfTdIne_uE-m3GoNbu2mxREBlYrraRGX81_4');
        
        // Initialize Supabase client
        this.supabase = null;
        this.initializeSupabase();
    }

    // Helper method to get environment variables
    getEnvVar(key, defaultValue) {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            // For GitHub Pages, we'll use the default values
            // In production, you can set these via GitHub Secrets
            return defaultValue;
        }
        return process.env[key] || defaultValue;
    }

    initializeSupabase() {
        try {
            // Wait for Supabase to be available
            const checkSupabase = () => {
                if (typeof supabase !== 'undefined') {
                    this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
                    console.log('Supabase initialized successfully');
                    return true;
                }
                return false;
            };

            if (!checkSupabase()) {
                // Retry after a short delay
                setTimeout(() => {
                    if (checkSupabase()) {
                        console.log('Supabase initialized on retry');
                    } else {
                        console.error('Supabase library not loaded after retry');
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error initializing Supabase:', error);
        }
    }

    // Get Supabase client
    getClient() {
        return this.supabase;
    }

    // Check if Supabase is available
    isAvailable() {
        return this.supabase !== null;
    }
}

// Create global instance
window.supabaseConfig = new SupabaseConfig();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseConfig;
}


