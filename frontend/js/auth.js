// Multi-User Authentication System for CV Builder
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.currentLoginType = null;
        this.init();
    }

    init() {
        console.log('AuthSystem initialized');
        
        // Check if user is already logged in
        this.checkAuthStatus();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize database connection
        this.initializeDatabase();
    }

    setupEventListeners() {
        // Login form submissions
        const userLoginForm = document.getElementById('userLoginFormElement');
        if (userLoginForm) {
            userLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin('user');
            });
        }

        // User signup form submission
        const userSignupForm = document.getElementById('userSignupFormElement');
        if (userSignupForm) {
            userSignupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup('user');
            });
        }

        const shopkeeperLoginForm = document.getElementById('shopkeeperLoginFormElement');
        if (shopkeeperLoginForm) {
            shopkeeperLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin('shopkeeper');
            });
        }

        // Shopkeeper signup form submission
        const shopkeeperSignupForm = document.getElementById('shopkeeperSignupFormElement');
        if (shopkeeperSignupForm) {
            shopkeeperSignupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup('shopkeeper');
            });
        }

        const adminLoginForm = document.getElementById('adminLoginFormElement');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin('admin');
            });
        }
    }

    selectLoginType(type) {
        console.log('Selected login type:', type);
        this.currentLoginType = type;
        
        // Hide login type selector
        document.querySelector('.login-type-selector').style.display = 'none';
        
        // Show login forms container
        const formsContainer = document.getElementById('loginFormsContainer');
        formsContainer.style.display = 'block';
        
        // Update header
        const title = document.getElementById('loginFormTitle');
        const subtitle = document.getElementById('loginFormSubtitle');
        
        switch(type) {
            case 'user':
                title.textContent = 'User Login';
                subtitle.textContent = 'Sign in to create and manage your personal CVs';
                document.getElementById('userLoginForm').style.display = 'block';
                document.getElementById('shopkeeperLoginForm').style.display = 'none';
                document.getElementById('adminLoginForm').style.display = 'none';
                break;
            case 'shopkeeper':
                title.textContent = 'Shopkeeper Login';
                subtitle.textContent = 'Sign in to manage CVs for your business';
                document.getElementById('userLoginForm').style.display = 'none';
                document.getElementById('shopkeeperLoginForm').style.display = 'block';
                document.getElementById('adminLoginForm').style.display = 'none';
                break;
            case 'admin':
                title.textContent = 'Admin Login';
                subtitle.textContent = 'Sign in for full system access and management';
                document.getElementById('userLoginForm').style.display = 'none';
                document.getElementById('shopkeeperLoginForm').style.display = 'none';
                document.getElementById('adminLoginForm').style.display = 'block';
                break;
        }
    }

    showLoginTypeSelector() {
        // Show login type selector
        document.querySelector('.login-type-selector').style.display = 'grid';
        
        // Hide login forms container
        document.getElementById('loginFormsContainer').style.display = 'none';
        
        // Clear any messages
        this.clearMessages();
    }

    // Tab switching for user login/signup
    switchUserTab(tab) {
        const loginTab = document.getElementById('userLoginTab');
        const signupTab = document.getElementById('userSignupTab');
        const loginBtn = document.querySelector('.tab-btn[onclick="switchUserTab(\'login\')"]');
        const signupBtn = document.querySelector('.tab-btn[onclick="switchUserTab(\'signup\')"]');
        
        if (tab === 'login') {
            loginTab.style.display = 'block';
            signupTab.style.display = 'none';
            loginBtn.classList.add('active');
            signupBtn.classList.remove('active');
        } else if (tab === 'signup') {
            loginTab.style.display = 'none';
            signupTab.style.display = 'block';
            loginBtn.classList.remove('active');
            signupBtn.classList.add('active');
        }
        
        // Clear any messages when switching tabs
        this.clearMessages();
    }

    // Global function for switching shopkeeper tabs
    switchShopkeeperTab(tab) {
        const loginTab = document.getElementById('shopkeeperSigninTab');
        const signupTab = document.getElementById('shopkeeperSignupTab');
        const loginBtn = document.querySelector('.tab-btn[onclick="switchShopkeeperTab(\'login\')"]');
        const signupBtn = document.querySelector('.tab-btn[onclick="switchShopkeeperTab(\'signup\')"]');
        
        if (tab === 'login') {
            loginTab.style.display = 'block';
            signupTab.style.display = 'none';
            loginBtn.classList.add('active');
            signupBtn.classList.remove('active');
        } else if (tab === 'signup') {
            loginTab.style.display = 'none';
            signupTab.style.display = 'block';
            loginBtn.classList.remove('active');
            signupBtn.classList.add('active');
        }
        
        // Clear any messages when switching tabs
        this.clearMessages();
    }

    async handleLogin(type) {
        const emailField = document.getElementById(`${type}Email`);
        const passwordField = document.getElementById(`${type}Password`);
        
        const email = emailField.value.trim();
        const password = passwordField.value;

        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        this.setLoading(true, type);

        try {
            const user = await this.signin(email, password, type);
            if (user) {
                this.showRedirectOverlay();
                setTimeout(() => {
                    // Redirect based on user role
                    if (user.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else if (user.role === 'shopkeeper') {
                        window.location.href = 'shopkeeper-dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
            } else {
                this.showMessage('Invalid email or password', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(error.message || 'An error occurred. Please try again.', 'error');
        } finally {
            this.setLoading(false, type);
        }
    }

    async handleSignup(type) {
        if (type !== 'user' && type !== 'shopkeeper') {
            this.showMessage('Signup is only available for users and shopkeepers', 'error');
            return;
        }

        let nameField, emailField, passwordField, confirmPasswordField, shopField;
        
        if (type === 'user') {
            nameField = document.getElementById('signupName');
            emailField = document.getElementById('signupEmail');
            passwordField = document.getElementById('signupPassword');
            confirmPasswordField = document.getElementById('signupConfirmPassword');
        } else if (type === 'shopkeeper') {
            nameField = document.getElementById('shopkeeperSignupName');
            emailField = document.getElementById('shopkeeperSignupEmail');
            passwordField = document.getElementById('shopkeeperSignupPassword');
            confirmPasswordField = document.getElementById('shopkeeperSignupConfirmPassword');
            shopField = document.getElementById('shopkeeperSignupShop');
        }
        
        const name = nameField.value.trim();
        const email = emailField.value.trim();
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        const shopName = shopField ? shopField.value.trim() : null;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (type === 'shopkeeper' && !shopName) {
            this.showMessage('Please enter your shop name', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        this.setLoading(true, 'signup');

        try {
            const user = await this.signup(name, email, password, type, shopName);
            if (user) {
                this.showMessage('Account created successfully! Redirecting...', 'success');
                this.showRedirectOverlay();
                setTimeout(() => {
                    if (type === 'shopkeeper') {
                        window.location.href = 'shopkeeper-dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1500);
            } else {
                this.showMessage('Failed to create account. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage(error.message || 'An error occurred during signup. Please try again.', 'error');
        } finally {
            this.setLoading(false, 'signup');
        }
    }

    async signin(email, password, expectedRole) {
        console.log('=== SIGNIN DEBUG ===');
        console.log('Email:', email);
        console.log('Expected Role:', expectedRole);
        console.log('Password length:', password.length);
        
        try {
            // Try Supabase authentication first if available
            if (this.databaseAvailable && window.supabaseDatabaseManager && window.supabaseDatabaseManager.supabase) {
                try {
                    console.log('Attempting Supabase authentication...');
                    const { data, error } = await window.supabaseDatabaseManager.supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                    if (error) {
                        console.log('Supabase authentication failed:', error.message);
                        throw new Error(`Authentication failed: ${error.message}`);
                    }

                    console.log('Supabase authentication successful:', data);
                    
                    // Get user metadata
                    const userData = data.user?.user_metadata || {};
                    const userRole = userData.role || 'user';
                    
                    // Check if the role matches expected role
                    if (userRole !== expectedRole) {
                        throw new Error(`Invalid role. Expected ${expectedRole}, got ${userRole}`);
                    }

                    const user = {
                        id: data.user.id,
                        name: userData.name || email.split('@')[0],
                        email: email,
                        role: userRole,
                        supabaseId: data.user.id,
                        createdAt: data.user.created_at
                    };

                    // Store in localStorage for offline access
                    this.currentUser = user;
                    localStorage.setItem('cvBuilder_user', JSON.stringify(user));
                    localStorage.setItem('cvBuilder_auth', 'true');
                    
                    console.log('✅ User signed in successfully via Supabase:', user.name, 'Role:', user.role);
                    return { success: true, user: user };

                } catch (supabaseError) {
                    console.error('Supabase authentication error:', supabaseError);
                    return { success: false, error: supabaseError.message };
                }
            } else {
                // Fallback to localStorage authentication
                console.log('Using localStorage fallback for authentication');
                const users = this.getUsers();
                console.log('Users found in localStorage:', users.length);
                
                const user = users.find(u => u.email === email && u.password === password && u.role === expectedRole);
                
                if (user) {
                    this.currentUser = user;
                    localStorage.setItem('cvBuilder_user', JSON.stringify(user));
                    localStorage.setItem('cvBuilder_auth', 'true');
                    console.log('✅ User signed in successfully via localStorage:', user.name, 'Role:', user.role);
                    return { success: true, user: user };
                } else {
                    return { success: false, error: 'Invalid email or password' };
                }
            }
        } catch (error) {
            console.error('Signin error:', error);
            return { success: false, error: error.message };
        }
    }

    getUsers() {
        const users = localStorage.getItem('cvBuilder_users');
        return users ? JSON.parse(users) : [];
    }

    async initializeDatabase() {
        console.log('Initializing database connection...');
        
        // Wait for Supabase to be available
        if (window.supabaseDatabaseManager && window.supabaseDatabaseManager.supabase) {
            console.log('Database connection available');
            this.databaseAvailable = true;
        } else {
            console.log('Database connection not available, using localStorage fallback');
            this.databaseAvailable = false;
        }
    }

    async signup(name, email, password, role = 'user', shopName = null) {
        console.log('=== SIGNUP DEBUG ===');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Password length:', password.length);
        console.log('Role:', role);
        console.log('Shop Name:', shopName);

        try {
            // Check if user already exists in localStorage
            const users = this.getUsers();
            const existingUser = users.find(u => u.email === email);
            
            if (existingUser) {
                throw new Error('An account with this email already exists');
            }

            // Try to register in Supabase first if available
            if (this.databaseAvailable && window.supabaseDatabaseManager && window.supabaseDatabaseManager.supabase) {
                try {
                    console.log('Attempting to register user in Supabase...');
                    const { data, error } = await window.supabaseDatabaseManager.supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                name: name,
                                role: role,
                                shopName: shopName
                            }
                        }
                    });

                    if (error) {
                        throw new Error(`Registration failed: ${error.message}`);
                    }

                    console.log('User registered in Supabase successfully:', data);
                    
                    // Create dynamic table for shopkeeper if needed
                    if (role === 'shopkeeper' && shopName) {
                        await this.createShopkeeperTable(shopName, data.user?.id);
                    }
                    
                    // Create user object for local storage
                    const newUser = {
                        id: data.user?.id || `${role}_${Date.now()}`,
                        name: name,
                        email: email,
                        role: role,
                        shopName: shopName,
                        createdAt: new Date().toISOString(),
                        supabaseId: data.user?.id
                    };

                    // Add user to localStorage for offline access
                    users.push(newUser);
                    localStorage.setItem('cvBuilder_users', JSON.stringify(users));

                    // Create initial record in shopkeeper_cvs table for shopkeepers
                    if (role === 'shopkeeper' && window.supabaseDatabaseManager) {
                        try {
                            console.log('Creating initial shopkeeper_cvs record...');
                            const initialCVRecord = {
                                shopkeeper_id: newUser.id,
                                cv_name: `${name} - Initial CV`,
                                name: name,
                                email: email,
                                phone: '',
                                address: '',
                                objective: `Welcome to ${shopName}! This is your initial CV record.`,
                                image_url: null,
                                education: [],
                                work_experience: [],
                                skills: [],
                                certifications: [],
                                projects: [],
                                languages: [],
                                hobbies: [],
                                cv_references: [],
                                other_information: [],
                                custom_sections: [],
                                template: 'classic',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };

                            const { data: cvData, error: cvError } = await window.supabaseDatabaseManager.supabase
                                .from('shopkeeper_cvs')
                                .insert([initialCVRecord])
                                .select();

                            if (cvError) {
                                console.error('Error creating initial shopkeeper_cvs record:', cvError);
                                // Don't fail signup if this fails, just log it
                            } else {
                                console.log('Initial shopkeeper_cvs record created successfully:', cvData[0]);
                            }
                        } catch (cvError) {
                            console.error('Error creating initial shopkeeper_cvs record:', cvError);
                            // Don't fail signup if this fails, just log it
                        }
                    }

                    console.log('User created successfully:', newUser);
                    console.log('=== END SIGNUP DEBUG ===');
                    return newUser;

                } catch (supabaseError) {
                    console.error('Supabase registration failed:', supabaseError);
                    throw new Error(`Registration failed: ${supabaseError.message}`);
                }
            } else {
                // Fallback to localStorage only
                console.log('Using localStorage fallback for registration');
                
                const newUser = {
                    id: `${role}_${Date.now()}`,
                    name: name,
                    email: email,
                    password: password, // In a real app, this should be hashed
                    role: role,
                    shopName: shopName,
                    createdAt: new Date().toISOString()
                };

                users.push(newUser);
                localStorage.setItem('cvBuilder_users', JSON.stringify(users));

                console.log('User created successfully (localStorage only):', newUser);
                console.log('=== END SIGNUP DEBUG ===');
                return newUser;
            }

        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    checkAuthStatus() {
        const isAuthenticated = localStorage.getItem('cvBuilder_auth');
        const user = localStorage.getItem('cvBuilder_user');
        
        if (isAuthenticated === 'true' && user) {
            this.currentUser = JSON.parse(user);
            // Only redirect if we're on the auth page
            if (window.location.pathname.includes('auth.html')) {
                // Add a small delay to prevent flickering
                setTimeout(() => {
                    // Redirect based on user role
                    if (this.currentUser.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else if (this.currentUser.role === 'shopkeeper') {
                        window.location.href = 'shopkeeper-dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 100);
            }
        }
    }

    showMessage(message, type) {
        this.clearMessages();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        const activeForm = document.querySelector('.login-form[style*="block"]');
        if (activeForm) {
            activeForm.insertBefore(messageDiv, activeForm.firstChild);
        }
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
    }

    clearMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
    }

    showRedirectOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'redirect-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <span>Sign in successful! Redirecting...</span>
        `;
        document.body.appendChild(overlay);
    }

    setLoading(loading, type) {
        let submitButton, allInputs;
        
        if (type === 'signup') {
            submitButton = document.querySelector('#userSignupFormElement .btn-primary');
            allInputs = document.querySelectorAll('#userSignupFormElement input');
        } else {
            submitButton = document.querySelector(`#${type}LoginForm .btn-primary`);
            allInputs = document.querySelectorAll(`#${type}LoginForm input`);
        }
        
        if (loading) {
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            // Disable all inputs during loading
            allInputs.forEach(input => input.disabled = true);
        } else {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
            // Re-enable all inputs
            allInputs.forEach(input => input.disabled = false);
        }
    }

    // Static method to check if user is authenticated
    static isAuthenticated() {
        return localStorage.getItem('cvBuilder_auth') === 'true';
    }

    // Static method to get current user
    static getCurrentUser() {
        const user = localStorage.getItem('cvBuilder_user');
        return user ? JSON.parse(user) : null;
    }

    // Static method to logout
    static logout() {
        localStorage.removeItem('cvBuilder_auth');
        localStorage.removeItem('cvBuilder_user');
        window.location.href = 'auth.html';
    }

    // Method to create dynamic table for shopkeeper
    async createShopkeeperTable(shopName, userId) {
        if (!this.databaseAvailable || !window.supabaseDatabaseManager) {
            console.log('Database not available, skipping table creation');
            return;
        }

        try {
            // Sanitize shop name for table name (remove spaces, special chars)
            const tableName = `shop_${shopName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_cvs`;
            
            console.log(`Creating dynamic table: ${tableName} for shop: ${shopName}`);
            
            // Create table using SQL
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    shopkeeper_id TEXT NOT NULL,
                    name TEXT,
                    email TEXT,
                    phone TEXT,
                    address TEXT,
                    objective JSONB DEFAULT '[]'::jsonb,
                    image_url TEXT,
                    education JSONB DEFAULT '[]'::jsonb,
                    work_experience JSONB DEFAULT '[]'::jsonb,
                    skills JSONB DEFAULT '[]'::jsonb,
                    certifications JSONB DEFAULT '[]'::jsonb,
                    projects JSONB DEFAULT '[]'::jsonb,
                    languages JSONB DEFAULT '[]'::jsonb,
                    hobbies JSONB DEFAULT '[]'::jsonb,
                    cv_references JSONB DEFAULT '[]'::jsonb,
                    other_information JSONB DEFAULT '[]'::jsonb,
                    custom_sections JSONB DEFAULT '[]'::jsonb,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );
            `;

            const { data, error } = await window.supabaseDatabaseManager.supabase.rpc('exec_sql', {
                sql: createTableSQL
            });

            if (error) {
                console.error('Error creating shopkeeper table:', error);
                // Try alternative method using direct SQL execution
                const { data: altData, error: altError } = await window.supabaseDatabaseManager.supabase
                    .from('information_schema.tables')
                    .select('*')
                    .eq('table_name', tableName);
                
                if (altError) {
                    console.log('Table creation attempted, but verification failed:', altError);
                } else {
                    console.log('Table created successfully:', tableName);
                }
            } else {
                console.log('Table created successfully:', tableName);
            }

            // Store table name in user data for future reference
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].tableName = tableName;
                localStorage.setItem('cvBuilder_users', JSON.stringify(users));
            }

        } catch (error) {
            console.error('Error in createShopkeeperTable:', error);
            // Don't throw error as table creation is not critical for signup
        }
    }
}

// Global functions for HTML onclick events
function selectLoginType(type) {
    if (window.authSystem) {
        window.authSystem.selectLoginType(type);
    }
}

function showLoginTypeSelector() {
    if (window.authSystem) {
        window.authSystem.showLoginTypeSelector();
    }
}

function switchUserTab(tab) {
    if (window.authSystem) {
        window.authSystem.switchUserTab(tab);
    }
}

function switchShopkeeperTab(tab) {
    if (window.authSystem) {
        window.authSystem.switchShopkeeperTab(tab);
    }
}

function logout() {
    AuthSystem.logout();
}

// Initialize authentication system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});

// Make AuthSystem available globally
window.AuthSystem = AuthSystem;