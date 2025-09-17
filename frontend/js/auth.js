// Multi-User Authentication System for CV Builder
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.currentLoginType = null;
        this.config = window.CV_BUILDER_CONFIG || {};
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
            this.showMessage('Please enter a valid email address. Check for typos and ensure the email format is correct.', 'error');
            return;
        }
        
        // Check for common email typos and suggest corrections
        const suggestions = this.suggestEmailCorrections(email);
        if (suggestions.length > 0) {
            this.showMessage(`Did you mean: ${suggestions.join(' or ')}?`, 'info');
        }

        this.setLoading(true, 'signup');

        try {
            const user = await this.signup(name, email, password, type, shopName);
            if (user) {
                // Check if email confirmation is required
                if (this.config.features?.emailConfirmation && user.requiresEmailConfirmation) {
                    this.showMessage('Account created successfully! Please check your email and click the confirmation link to activate your account.', 'success');
                    this.showEmailConfirmationMessage(email);
                    
                    // For shopkeepers with email confirmation, also show toaster and switch to login
                    if (type === 'shopkeeper') {
                        setTimeout(() => {
                            this.showToaster('Account created! Please check your email and then sign in.', 'success');
                            this.switchToLogin('shopkeeper');
                        }, 3000);
                    }
                } else {
                    // Show success message with toaster
                    this.showToaster('Account created successfully!', 'success');
                    
                    // For shopkeepers, redirect to sign-in page after a delay
                    if (type === 'shopkeeper') {
                        setTimeout(() => {
                            this.showMessage('Please sign in with your new account credentials.', 'info');
                            // Switch to login form
                            this.switchToLogin('shopkeeper');
                        }, 2000);
                    } else {
                        // For regular users, redirect to main page
                        this.showRedirectOverlay();
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    }
                }
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
                    return user;

                } catch (supabaseError) {
                    console.error('Supabase authentication error:', supabaseError);
                    
                    // If email not confirmed, try to use localStorage fallback
                    if (supabaseError.message && supabaseError.message.includes('Email not confirmed')) {
                        console.log('Email not confirmed, trying localStorage fallback...');
                        
                        // Check if user exists in localStorage
                        const users = this.getUsers();
                        const localUser = users.find(u => u.email === email && u.password === password && u.role === expectedRole);
                        
                        if (localUser) {
                            console.log('Found user in localStorage, using fallback authentication');
                            this.currentUser = localUser;
                            localStorage.setItem('cvBuilder_user', JSON.stringify(localUser));
                            localStorage.setItem('cvBuilder_auth', 'true');
                            console.log('✅ User signed in successfully via localStorage fallback:', localUser.name, 'Role:', localUser.role);
                            return localUser;
                        } else {
                            console.log('No matching user found in localStorage');
                            throw new Error('Invalid email or password');
                        }
                    }
                    
                    throw supabaseError;
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
                    return user;
                } else {
                    throw new Error('Invalid email or password');
                }
            }
        } catch (error) {
            console.error('Signin error:', error);
            throw error;
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
                        // Provide more specific error messages
                        if (error.message.includes('Email address') && error.message.includes('invalid')) {
                            throw new Error('Please enter a valid email address. Check for typos and ensure the email format is correct.');
                        } else if (error.message.includes('already registered')) {
                            throw new Error('An account with this email already exists. Please use a different email or try signing in.');
                        } else {
                            throw new Error(`Registration failed: ${error.message}`);
                        }
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

                    // No need to create initial record in shopkeeper_cvs table
                    // All shopkeeper data will be saved to their individual shop table

                    console.log('User created successfully:', newUser);
                    console.log('=== END SIGNUP DEBUG ===');
                    
                    // Check if email confirmation is required
                    const requiresEmailConfirmation = this.config.features?.emailConfirmation && 
                        data.user && !data.user.email_confirmed_at;
                    
                    return {
                        ...newUser,
                        requiresEmailConfirmation: requiresEmailConfirmation
                    };

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
                
                // For localStorage fallback, no email confirmation required
                return {
                    ...newUser,
                    requiresEmailConfirmation: false
                };
            }

        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    isValidEmail(email) {
        // More comprehensive email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(email)) {
            return false;
        }
        
        // Additional checks
        if (email.length > 254) {
            return false;
        }
        
        const parts = email.split('@');
        if (parts[0].length > 64) {
            return false;
        }
        
        return true;
    }

    suggestEmailCorrections(email) {
        const suggestions = [];
        const commonTypos = {
            'compsing': 'composing',
            'gmail': 'gmail.com',
            'yahoo': 'yahoo.com',
            'hotmail': 'hotmail.com',
            'outlook': 'outlook.com'
        };
        
        for (const [typo, correction] of Object.entries(commonTypos)) {
            if (email.includes(typo)) {
                suggestions.push(email.replace(typo, correction));
            }
        }
        
        return suggestions;
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

    showEmailConfirmationMessage(email) {
        this.clearMessages();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message success email-confirmation-message';
        messageDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3em; margin-bottom: 15px;">📧</div>
                <h3 style="margin-bottom: 15px; color: #28a745;">Check Your Email!</h3>
                <p style="margin-bottom: 15px;">We've sent a confirmation link to:</p>
                <p style="font-weight: bold; color: #007bff; margin-bottom: 20px;">${email}</p>
                <p style="margin-bottom: 20px; color: #666;">
                    Please click the link in the email to activate your account. 
                    You can then sign in and start building your CV.
                </p>
                <div style="margin-top: 20px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        Close
                    </button>
                    <button onclick="window.location.href='auth.html'" 
                            style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        Back to Sign In
                    </button>
                </div>
            </div>
        `;
        
        const activeForm = document.querySelector('.login-form[style*="block"]');
        if (activeForm) {
            activeForm.insertBefore(messageDiv, activeForm.firstChild);
        }
    }

    showToaster(message, type = 'success') {
        // Remove any existing toasters
        const existingToasters = document.querySelectorAll('.toaster');
        existingToasters.forEach(toaster => toaster.remove());
        
        const toaster = document.createElement('div');
        toaster.className = `toaster toaster-${type}`;
        toaster.innerHTML = `
            <div class="toaster-content">
                <span class="toaster-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="toaster-message">${message}</span>
                <button class="toaster-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add toaster styles
        toaster.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add animation keyframes
        if (!document.querySelector('#toaster-styles')) {
            const style = document.createElement('style');
            style.id = 'toaster-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .toaster-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .toaster-icon {
                    font-size: 18px;
                }
                .toaster-message {
                    flex: 1;
                    font-weight: 500;
                }
                .toaster-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                .toaster-close:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toaster);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toaster.parentElement) {
                toaster.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => toaster.remove(), 300);
            }
        }, 4000);
    }

    switchToLogin(type) {
        // Hide all forms
        const allForms = document.querySelectorAll('.login-form');
        allForms.forEach(form => form.style.display = 'none');
        
        // Show the specific login form
        const loginForm = document.getElementById(`${type}LoginForm`);
        if (loginForm) {
            loginForm.style.display = 'block';
        }
        
        // Update the active tab
        const allTabs = document.querySelectorAll('.auth-tab');
        allTabs.forEach(tab => tab.classList.remove('active'));
        
        const activeTab = document.querySelector(`[data-tab="${type}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Clear any existing messages
        this.clearMessages();
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
            // Sanitize shop name for table name (remove spaces, special chars, limit length)
            const sanitizedShopName = shopName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
            const tableName = `shop_${sanitizedShopName}_cvs`;
            
            console.log(`Creating dynamic table: ${tableName} for shop: ${shopName}`);
            
            // Method 1: Try using Supabase's SQL execution
            try {
                const createTableSQL = `
                    CREATE TABLE IF NOT EXISTS ${tableName} (
                        id BIGSERIAL PRIMARY KEY,
                        shopkeeper_id TEXT NOT NULL,
                        cv_name TEXT,
                        name TEXT,
                        email TEXT,
                        phone TEXT,
                        address TEXT,
                        objective TEXT,
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
                        template TEXT DEFAULT 'classic',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                    );
                `;

                // Try RPC method first
                const { data, error } = await window.supabaseDatabaseManager.supabase.rpc('exec_sql', {
                    sql: createTableSQL
                });

                if (error) {
                    console.log('RPC method failed, trying alternative approach:', error.message);
                    throw error;
                }

                console.log('Table created successfully via RPC:', tableName);
                
            } catch (rpcError) {
                console.log('RPC method failed, trying direct SQL execution...');
                
                // Method 2: Try direct SQL execution using a different approach
                try {
                    // Create a temporary function to execute SQL
                    const createFunctionSQL = `
                        CREATE OR REPLACE FUNCTION create_shopkeeper_table(table_name TEXT)
                        RETURNS TEXT AS $$
                        BEGIN
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
                            RETURN 'Table created successfully';
                        END;
                        $$ LANGUAGE plpgsql;
                    `;

                    // Create the function
                    await window.supabaseDatabaseManager.supabase.rpc('exec_sql', {
                        sql: createFunctionSQL
                    });

                    // Use the function to create the table
                    const { data: funcData, error: funcError } = await window.supabaseDatabaseManager.supabase.rpc('create_shopkeeper_table', {
                        table_name: tableName
                    });

                    if (funcError) {
                        throw funcError;
                    }

                    console.log('Table created successfully via function:', tableName);
                    
                } catch (funcError) {
                    console.log('Function method failed, using fallback approach...');
                    
                    // Method 3: Fallback - just store the table name and continue
                    console.log(`Table creation attempted: ${tableName} for shop: ${shopName}`);
                    console.log('Note: Table will be created when first CV is saved');
                }
            }

            // Store table name in user data for future reference
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].tableName = tableName;
                localStorage.setItem('cvBuilder_users', JSON.stringify(users));
                console.log('Table name stored in user data:', tableName);
            }

            // No need to create record in main shopkeeper_cvs table
            // All data will be saved to the individual shop table

        } catch (error) {
            console.error('Error in createShopkeeperTable:', error);
            // Don't throw error as table creation is not critical for signup
            console.log('Continuing with signup despite table creation error');
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