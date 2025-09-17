// Shopkeeper Dashboard JavaScript
class ShopkeeperDashboard {
    constructor() {
        this.currentUser = null;
        this.allCVs = [];
        this.downloadHistory = [];
        this.selectedCV = null;
        this.init();
    }

    init() {
        console.log('Shopkeeper Dashboard initialized');
        
        // Check authentication
        this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadInitialData();
    }

    checkAuth() {
        console.log('=== SHOPKEEPER AUTH CHECK ===');
        console.log('AuthSystem available:', !!AuthSystem);
        console.log('Is authenticated:', AuthSystem ? AuthSystem.isAuthenticated() : 'N/A');
        
        if (!AuthSystem.isAuthenticated()) {
            console.log('Not authenticated, redirecting to auth page');
            window.location.href = 'auth.html';
            return;
        }

        this.currentUser = AuthSystem.getCurrentUser();
        console.log('Current user:', this.currentUser);
        console.log('User role:', this.currentUser ? this.currentUser.role : 'N/A');
        console.log('User shop name:', this.currentUser ? this.currentUser.shopName : 'N/A');
        console.log('User object keys:', this.currentUser ? Object.keys(this.currentUser) : 'N/A');
        
        if (!this.currentUser || this.currentUser.role !== 'shopkeeper') {
            console.log('Access denied - not a shopkeeper');
            alert('Access denied. Shopkeeper privileges required.');
            window.location.href = 'auth.html';
            return;
        }

        // Shopkeeper authenticated successfully
        console.log('Shopkeeper authenticated:', this.currentUser.name);
        console.log('=== END SHOPKEEPER AUTH CHECK ===');
        
        // Update dashboard title with shop name
        this.updateDashboardTitle();
    }

    updateDashboardTitle() {
        console.log('=== UPDATE DASHBOARD TITLE DEBUG ===');
        console.log('Current user:', this.currentUser);
        console.log('Shop name:', this.currentUser ? this.currentUser.shopName : 'N/A');
        
        if (this.currentUser && this.currentUser.shopName) {
            const shopName = this.currentUser.shopName;
            const dashboardTitle = document.getElementById('dashboardTitle');
            const pageTitle = document.getElementById('pageTitle');
            
            console.log('Dashboard title element:', dashboardTitle);
            console.log('Page title element:', pageTitle);
            
            if (dashboardTitle) {
                dashboardTitle.textContent = `🏪 ${shopName} Dashboard`;
                console.log('Dashboard title updated to:', dashboardTitle.textContent);
            }
            
            if (pageTitle) {
                pageTitle.textContent = `${shopName} Dashboard - CV Builder`;
                console.log('Page title updated to:', pageTitle.textContent);
            }
            
            console.log(`Dashboard title updated to: ${shopName} Dashboard`);
        } else {
            console.log('No shop name found, trying to get from localStorage...');
            // Try to get shop name from localStorage
            const users = JSON.parse(localStorage.getItem('cvBuilder_users') || '[]');
            const user = users.find(u => u.id === this.currentUser?.id);
            if (user && user.shopName) {
                console.log('Found shop name in localStorage:', user.shopName);
                const dashboardTitle = document.getElementById('dashboardTitle');
                const pageTitle = document.getElementById('pageTitle');
                
                if (dashboardTitle) {
                    dashboardTitle.textContent = `🏪 ${user.shopName} Dashboard`;
                    console.log('Dashboard title updated to:', dashboardTitle.textContent);
                }
                
                if (pageTitle) {
                    pageTitle.textContent = `${user.shopName} Dashboard - CV Builder`;
                    console.log('Page title updated to:', pageTitle.textContent);
                }
            } else {
                console.log('No shop name found, keeping default title');
                console.log('User object:', this.currentUser);
                console.log('Shop name value:', this.currentUser ? this.currentUser.shopName : 'undefined');
            }
        }
        console.log('=== END UPDATE DASHBOARD TITLE DEBUG ===');
    }

    getShopkeeperTableName() {
        if (!this.currentUser) {
            console.error('No current user found');
            return null;
        }
        
        // Get the table name from user data
        const users = JSON.parse(localStorage.getItem('cvBuilder_users') || '[]');
        const user = users.find(u => u.id === this.currentUser.id);
        
        if (user && user.tableName) {
            console.log('Found shopkeeper table name:', user.tableName);
            return user.tableName;
        }
        
        console.error('Shopkeeper table name not found for user:', this.currentUser);
        return null;
    }

    setupEventListeners() {
        // Search form submission
        const searchForm = document.getElementById('searchName');
        if (searchForm) {
            searchForm.addEventListener('input', () => {
                this.performRealtimeSearch();
            });
        }

        const searchMobile = document.getElementById('searchMobile');
        if (searchMobile) {
            searchMobile.addEventListener('input', () => {
                this.performRealtimeSearch();
            });
        }
    }

    async loadInitialData() {
        try {
            // Load shopkeeper stats
            await this.loadShopkeeperStats();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToaster('Error loading data. Please refresh the page.', 'error');
        }
    }

    async loadShopkeeperStats() {
        try {
            if (!window.supabaseDatabaseManager) {
                console.error('Database manager not available');
                return;
            }

            const stats = await window.supabaseDatabaseManager.getShopkeeperStats(this.currentUser.id);
            if (stats) {
                this.updateStatsDisplay(stats);
            }
        } catch (error) {
            console.error('Error loading shopkeeper stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('totalDownloads').textContent = stats.totalDownloads || 0;
    }


    async loadAllCVs() {
        try {
            if (!window.supabaseDatabaseManager) {
                console.error('Database manager not available');
                this.displayCVs([]);
                return;
            }

            const cvs = await window.supabaseDatabaseManager.searchCVs('', '', null, 'shopkeeper');
            this.allCVs = cvs;
            this.displayCVs(cvs);
        } catch (error) {
            console.error('Error loading CVs:', error);
            this.showToaster('Error loading CVs. Please try again.', 'error');
        }
    }


    displayCVs(cvs) {
        const cvsList = document.getElementById('cvsList');
        
        if (cvs.length === 0) {
            cvsList.innerHTML = '<div class="no-results">No CVs found.</div>';
            return;
        }

        cvsList.innerHTML = cvs.map(cv => `
            <div class="cv-item">
                <div class="cv-content">
                    <div class="cv-main">
                        <div class="cv-name">${cv.name || 'Unknown Name'}</div>
                        <div class="cv-template">Template ${cv.template === 'classic' ? '1' : cv.template === 'modern' ? '2' : '3'}</div>
                    </div>
                    <div class="cv-details">
                        <div class="cv-contact">
                            <span class="cv-email">📧 ${cv.email || 'No email'}</span>
                            <span class="cv-phone">📱 ${cv.phone || 'No phone'}</span>
                        </div>
                        <div class="cv-dates">
                            <span class="cv-created">Created: ${new Date(cv.created_at).toLocaleDateString()}</span>
                            <span class="cv-modified">Modified: ${new Date(cv.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="cv-actions">
                    <button class="btn btn-primary" onclick="shopkeeperDashboard.showDownloadModal('${cv.id}')" title="Download CV">
                        📥 Download
                    </button>
                </div>
            </div>
        `).join('');
    }


    async searchCVs() {
        const searchName = document.getElementById('searchName').value.trim().toLowerCase();
        const searchMobile = document.getElementById('searchMobile').value.trim();
        
        try {
            if (!window.supabaseDatabaseManager) {
                console.error('Database manager not available');
                return;
            }

            const cvs = await window.supabaseDatabaseManager.searchCVs(searchName, searchMobile, null, 'shopkeeper', this.currentUser.id);
            this.allCVs = cvs;
            this.displayCVs(cvs);
        } catch (error) {
            console.error('Error searching CVs:', error);
            this.showToaster('Error searching CVs. Please try again.', 'error');
        }
    }

    performRealtimeSearch() {
        // Debounce the search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchCVs();
        }, 300);
    }

    clearSearch() {
        document.getElementById('searchName').value = '';
        document.getElementById('searchMobile').value = '';
        this.loadAllCVs();
    }

    async downloadCV(cvId) {
        const cv = this.allCVs.find(c => c.id == cvId);
        if (!cv) {
            this.showToaster('CV not found.', 'error');
            return;
        }

        try {
            // Track the download
            if (window.supabaseDatabaseManager) {
                await window.supabaseDatabaseManager.trackCVDownload(
                    this.currentUser.id,
                    cvId,
                    'pdf'
                );
            }

            // Simulate download (in a real app, you'd generate and download the file)
            this.showToaster(`CV "${cv.name}" downloaded successfully as PDF!`, 'success');
            
            // Refresh stats
            await this.loadShopkeeperStats();
            
        } catch (error) {
            console.error('Error downloading CV:', error);
            this.showToaster('Error downloading CV. Please try again.', 'error');
        }
    }


    // CV Management Methods (similar to admin dashboard)
    goToCVBuilder() {
        // Clear any existing edit mode to start fresh
        sessionStorage.removeItem('editUserId');
        
        // Clear any existing CV data for the current user to start fresh
        const currentUser = AuthSystem.getCurrentUser();
        if (currentUser) {
            localStorage.removeItem(`cvBuilder_savedData_${currentUser.id}`);
        }
        
        // CRITICAL: Clear the current CV ID to ensure a new CV is created
        sessionStorage.removeItem('currentCVId');
        
        // Set flag to indicate this is a new CV creation
        sessionStorage.setItem('createNewCV', 'true');
        
        // Set default template to classic
        sessionStorage.setItem('selectedTemplate', 'classic');
        
        console.log('Shopkeeper: Starting new CV creation - cleared all existing data');
        
        // Redirect directly to CV builder
        window.location.href = 'index.html';
    }

    showAllCVs() {
        console.log('=== SHOW ALL CVs DEBUG ===');
        console.log('ShopkeeperDashboard instance:', this);
        console.log('Supabase database manager available:', !!window.supabaseDatabaseManager);
        
        // Show all CVs section
        const allCVsSection = document.getElementById('allCVsSection');
        console.log('All CVs section element:', allCVsSection);
        
        if (allCVsSection) {
            allCVsSection.style.display = 'block';
            console.log('All CVs section displayed');
        } else {
            console.error('All CVs section element not found!');
            return;
        }
        
        // Load and display all CVs
        this.loadAllCVs();
        console.log('=== END SHOW ALL CVs DEBUG ===');
    }


    async loadAllCVs() {
        console.log('=== LOAD ALL CVs DEBUG ===');
        console.log('Loading all CVs...');
        console.log('Supabase database manager:', window.supabaseDatabaseManager);
        console.log('Current user:', this.currentUser);
        
        if (window.supabaseDatabaseManager) {
            // Get all CVs (no search criteria) - pass the current user ID
            const allCVs = await window.supabaseDatabaseManager.searchCVs('', '', null, 'shopkeeper', this.currentUser.id);
            console.log('All CVs loaded:', allCVs);
            console.log('Number of CVs:', allCVs.length);
            
            // Debug: Check if "Abdul Rehman" is in the results
            const abdulCV = allCVs.find(cv => 
                cv.name && cv.name.toLowerCase().includes('abdul') ||
                cv.cv_name && cv.cv_name.toLowerCase().includes('abdul')
            );
            console.log('Abdul CV found:', abdulCV);
            
            // Store all CVs for filtering
            this.allCVs = allCVs;
            
            this.displayAllCVs(allCVs);
        } else {
            console.error('Database manager not available');
            this.allCVs = [];
            this.displayAllCVs([]);
        }
        console.log('=== END LOAD ALL CVs DEBUG ===');
    }

    performLiveSearch() {
        const searchName = document.getElementById('liveSearchName').value.trim().toLowerCase();
        const searchMobile = document.getElementById('liveSearchMobile').value.trim();
        
        console.log('Live search:', { searchName, searchMobile });
        
        if (!this.allCVs) {
            console.log('No CVs loaded yet');
            return;
        }
        
        // Filter CVs based on search criteria
        const filteredCVs = this.allCVs.filter(cv => {
            const nameMatch = !searchName || (cv.name && cv.name.toLowerCase().includes(searchName));
            const mobileMatch = !searchMobile || (cv.phone && cv.phone.includes(searchMobile));
            
            return nameMatch && mobileMatch;
        });
        
        console.log('Filtered CVs:', filteredCVs.length, 'out of', this.allCVs.length);
        
        // Display filtered results
        this.displayAllCVs(filteredCVs);
    }

    clearLiveSearch() {
        document.getElementById('liveSearchName').value = '';
        document.getElementById('liveSearchMobile').value = '';
        
        // Show all CVs again
        if (this.allCVs) {
            this.displayAllCVs(this.allCVs);
        }
    }

    displayAllCVs(cvs) {
        console.log('=== DISPLAY ALL CVs DEBUG ===');
        console.log('CVs to display:', cvs);
        console.log('Number of CVs:', cvs.length);
        
        const cvsStats = document.getElementById('cvsStats');
        const allCVsList = document.getElementById('allCVsList');
        
        console.log('cvsStats element:', cvsStats);
        console.log('allCVsList element:', allCVsList);
        
        // Display statistics
        const totalCVs = cvs.length;
        const templateStats = {};
        cvs.forEach(cv => {
            const template = cv.template || 'classic';
            templateStats[template] = (templateStats[template] || 0) + 1;
        });
        
        cvsStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${totalCVs}</span>
                    <span class="stat-label">Total CVs</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${templateStats.classic || 0}</span>
                    <span class="stat-label">Template 1</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${templateStats.modern || 0}</span>
                    <span class="stat-label">Template 2</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${templateStats.minimalist || 0}</span>
                    <span class="stat-label">Template 3</span>
                </div>
            </div>
        `;
        
        // Display CVs list
        if (cvs.length === 0) {
            allCVsList.innerHTML = '<div class="no-results">No CVs found in the database.</div>';
        } else {
            allCVsList.innerHTML = cvs.map(cv => `
                <div class="cv-item">
                    <div class="cv-content clickable-result" onclick="shopkeeperDashboard.openCV('${cv.id}')">
                        <div class="cv-main">
                            <div class="cv-name">${cv.name || 'Unknown Name'}</div>
                            <div class="cv-template">Template ${cv.template === 'classic' ? '1' : cv.template === 'modern' ? '2' : '3'}</div>
                        </div>
                        <div class="cv-details">
                            <div class="cv-contact">
                                <span class="cv-email">📧 ${cv.email || 'No email'}</span>
                                <span class="cv-phone">📱 ${cv.phone || 'No phone'}</span>
                            </div>
                            <div class="cv-dates">
                                <span class="cv-created">Created: ${new Date(cv.created_at).toLocaleDateString()}</span>
                                <span class="cv-modified">Modified: ${new Date(cv.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="cv-actions">
                        <button class="btn btn-danger" onclick="event.stopPropagation(); shopkeeperDashboard.deleteCV('${cv.id}', '${cv.name || 'Unknown Name'}')" title="Delete CV">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        console.log('All CVs displayed:', cvs.length, 'CVs');
        console.log('cvsStats innerHTML length:', cvsStats ? cvsStats.innerHTML.length : 'N/A');
        console.log('allCVsList innerHTML length:', allCVsList ? allCVsList.innerHTML.length : 'N/A');
        console.log('=== END DISPLAY ALL CVs DEBUG ===');
    }

    openCV(cvId) {
        console.log('=== OPEN CV DEBUG ===');
        console.log('Opening CV with ID:', cvId);
        console.log('CV ID type:', typeof cvId);
        
        // Store the CV ID for editing
        sessionStorage.setItem('currentCVId', cvId);
        console.log('Stored currentCVId in sessionStorage:', sessionStorage.getItem('currentCVId'));
        
        // Redirect to CV builder with the specific CV for editing
        window.location.href = 'index.html';
        console.log('Redirecting to CV builder...');
        console.log('=== END OPEN CV DEBUG ===');
    }

    async deleteCV(cvId, cvName) {
        console.log('=== DELETE CV DEBUG ===');
        console.log('Deleting CV with ID:', cvId);
        console.log('CV Name:', cvName);
        
        try {
            if (!window.supabaseDatabaseManager) {
                throw new Error('Database manager not available');
            }
            
            // Get the shopkeeper table name
            const tableName = this.getShopkeeperTableName();
            if (!tableName) {
                throw new Error('Shopkeeper table not found');
            }
            
            // Delete from dynamic shopkeeper table
            const { error } = await window.supabaseDatabaseManager.supabase
                .from(tableName)
                .delete()
                .eq('id', cvId);
            
            if (error) {
                throw error;
            }
            
            console.log('CV deleted successfully from database');
            
            // Remove from local allCVs array
            if (this.allCVs) {
                this.allCVs = this.allCVs.filter(cv => cv.id !== cvId);
            }
            
            // Refresh the display
            this.displayAllCVs(this.allCVs);
            
            // Show success message
            this.showToaster(`CV "${cvName}" deleted successfully!`, 'success');
            
            // Refresh stats
            await this.loadShopkeeperStats();
            
        } catch (error) {
            console.error('Error deleting CV:', error);
            this.showToaster(`Error deleting CV: ${error.message}`, 'error');
        }
        
        console.log('=== END DELETE CV DEBUG ===');
    }

    // Toaster notification methods
    showToaster(message, type = 'success', duration = 4000) {
        // Remove any existing toasters
        this.clearToasters();
        
        // Create toaster notification
        const toaster = document.createElement('div');
        toaster.className = `toaster-notification ${type}`;
        
        // Set icon based on type
        let icon = '✅';
        if (type === 'error') icon = '❌';
        else if (type === 'warning') icon = '⚠️';
        
        toaster.innerHTML = `
            <div class="toaster-content">
                <span class="toaster-icon">${icon}</span>
                <div class="toaster-text">
                    <strong>${message}</strong>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(toaster);
        
        // Auto-remove after specified duration
        setTimeout(() => {
            if (toaster.parentNode) {
                toaster.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (toaster.parentNode) {
                        toaster.parentNode.removeChild(toaster);
                    }
                }, 300);
            }
        }, duration);
    }

    clearToasters() {
        const existingToasters = document.querySelectorAll('.toaster-notification');
        existingToasters.forEach(toaster => {
            if (toaster.parentNode) {
                toaster.parentNode.removeChild(toaster);
            }
        });
    }
}

// Global functions for HTML onclick handlers
function logout() {
    if (AuthSystem) {
        AuthSystem.logout();
        window.location.href = 'auth.html';
    }
}

function goToCVBuilder() {
    if (window.shopkeeperDashboard) {
        window.shopkeeperDashboard.goToCVBuilder();
    }
}

function showAllCVs() {
    console.log('=== GLOBAL showAllCVs CALLED ===');
    console.log('window.shopkeeperDashboard exists:', !!window.shopkeeperDashboard);
    
    if (window.shopkeeperDashboard) {
        console.log('Calling shopkeeperDashboard.showAllCVs()');
        window.shopkeeperDashboard.showAllCVs();
    } else {
        console.error('ShopkeeperDashboard not initialized!');
    }
}


function performLiveSearch() {
    if (window.shopkeeperDashboard) {
        window.shopkeeperDashboard.performLiveSearch();
    }
}


function clearLiveSearch() {
    if (window.shopkeeperDashboard) {
        window.shopkeeperDashboard.clearLiveSearch();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.shopkeeperDashboard = new ShopkeeperDashboard();
        console.log('Shopkeeper Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing Shopkeeper Dashboard:', error);
    }
});
