// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.searchTimeout = null;
        this.currentOffset = 0;
        this.pageSize = 50;
        this.totalCVs = 0;
        this.hasMore = false;
        this.init();
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

    init() {
        console.log('Admin Dashboard initialized');
        
        // Check if Supabase database manager is available
        if (window.supabaseDatabaseManager) {
            console.log('Supabase database manager is available');
        } else {
            console.error('Supabase database manager is NOT available!');
        }
        
        // Check authentication
        this.checkAuth();
        
        // Debug localStorage content
        this.debugLocalStorage();
        
        // Test search functionality
        this.testSearch();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show user info
        this.showUserInfo();
    }

    checkAuth() {
        if (!AuthSystem.isAuthenticated()) {
            window.location.href = 'auth.html';
            return;
        }

        const user = AuthSystem.getCurrentUser();
        if (!user || user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'auth.html';
            return;
        }
    }

    debugLocalStorage() {
        console.log('=== LOCALSTORAGE DEBUG ===');
        console.log('Total localStorage items:', localStorage.length);
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`Key ${i}:`, key);
            
            if (key && key.startsWith('cvBuilder_')) {
                try {
                    const value = JSON.parse(localStorage.getItem(key));
                    console.log(`Value for ${key}:`, value);
                } catch (e) {
                    console.log(`Value for ${key} (raw):`, localStorage.getItem(key));
                }
            }
        }
        console.log('=== END LOCALSTORAGE DEBUG ===');
    }

    // Manual test method to check search functionality
    async testSearch() {
        console.log('=== MANUAL SEARCH TEST ===');
        if (window.supabaseDatabaseManager) {
            const allCVs = await window.supabaseDatabaseManager.searchCVs('', '', null);
            console.log('All CVs found:', allCVs);
            console.log('Number of CVs:', allCVs.length);
        } else {
            console.log('Database manager not available for test');
        }
        console.log('=== END MANUAL SEARCH TEST ===');
    }

    setupEventListeners() {
        // Search form submission
        const searchForm = document.getElementById('searchCVForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.searchCVs();
            });
        }

        // Real-time search on input
        const searchName = document.getElementById('searchName');
        const searchMobile = document.getElementById('searchMobile');
        
        if (searchName) {
            searchName.addEventListener('input', () => {
                this.performRealtimeSearch();
            });
        }

        if (searchMobile) {
            searchMobile.addEventListener('input', () => {
                this.performRealtimeSearch();
            });
        }
    }

    showUserInfo() {
        const user = AuthSystem.getCurrentUser();
        const adminNameElement = document.getElementById('adminName');
        
        if (adminNameElement && user) {
            adminNameElement.textContent = user.username;
        }
    }

    goToCVBuilder() {
        console.log('=== GO TO CV BUILDER DEBUG ===');
        console.log('Admin: Starting new CV creation process');
        
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
        
        // Set flag to force language defaults reset
        sessionStorage.setItem('resetLanguageDefaults', 'true');
        
        // Set default template to classic
        sessionStorage.setItem('selectedTemplate', 'classic');
        
        console.log('Admin: Starting new CV creation - cleared all existing data');
        console.log('createNewCV flag set to:', sessionStorage.getItem('createNewCV'));
        console.log('resetLanguageDefaults flag set to:', sessionStorage.getItem('resetLanguageDefaults'));
        console.log('selectedTemplate set to:', sessionStorage.getItem('selectedTemplate'));
        console.log('About to redirect to index.html');
        
        // Redirect directly to CV builder
        window.location.href = 'index.html';
        console.log('=== END GO TO CV BUILDER DEBUG ===');
    }



    showAllCVs() {
        console.log('=== SHOW ALL CVs DEBUG ===');
        console.log('AdminDashboard instance:', this);
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
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        try {
            if (window.supabaseDatabaseManager) {
                // Get CVs with pagination (first 50)
                const result = await window.supabaseDatabaseManager.searchCVs('', '', null, 'admin', null, 50, 0);
                console.log('CVs loaded:', result);
                console.log('Number of CVs:', result.data.length);
                console.log('Total CVs:', result.total);
                console.log('Has more:', result.hasMore);
                
                // Store pagination info
                this.currentOffset = 0;
                this.pageSize = 50;
                this.totalCVs = result.total;
                this.hasMore = result.hasMore;
                
                // Store all CVs for filtering
                this.allCVs = result.data;
                
                this.displayAllCVs(result.data);
                this.updatePaginationControls();
            } else {
                console.error('Database manager not available');
                this.allCVs = [];
                this.displayAllCVs([]);
            }
        } catch (error) {
            console.error('Error loading CVs:', error);
            this.showError('Failed to load CVs. Please try again.');
            this.allCVs = [];
            this.displayAllCVs([]);
        } finally {
            this.hideLoadingIndicator();
        }
        console.log('=== END LOAD ALL CVs DEBUG ===');
    }

    async performLiveSearch() {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search - wait 500ms after user stops typing
        this.searchTimeout = setTimeout(async () => {
            const searchName = document.getElementById('liveSearchName').value.trim();
            const searchMobile = document.getElementById('liveSearchMobile').value.trim();
            
            console.log('Live search:', { searchName, searchMobile });
            
            // Show loading indicator
            this.showLoadingIndicator();
            
            try {
                if (window.supabaseDatabaseManager) {
                    // Search CVs with server-side filtering
                    const result = await window.supabaseDatabaseManager.searchCVs(
                        searchName, 
                        searchMobile, 
                        null, 
                        'admin', 
                        null, 
                        50, 
                        0
                    );
                    
                    console.log('Search results:', result);
                    console.log('Number of results:', result.data.length);
                    console.log('Total results:', result.total);
                    
                    // Update pagination info for search results
                    this.currentOffset = 0;
                    this.pageSize = 50;
                    this.totalCVs = result.total;
                    this.hasMore = result.hasMore;
                    this.allCVs = result.data;
                    
                    this.displayAllCVs(result.data);
                    this.updatePaginationControls();
                } else {
                    console.error('Database manager not available');
                    this.showError('Database not available. Please try again.');
                }
            } catch (error) {
                console.error('Error performing search:', error);
                this.showError('Search failed. Please try again.');
            } finally {
                this.hideLoadingIndicator();
            }
        }, 500); // Wait 500ms after user stops typing
    }

    async clearLiveSearch() {
        document.getElementById('liveSearchName').value = '';
        document.getElementById('liveSearchMobile').value = '';
        
        // Reload all CVs (reset to show all)
        await this.loadAllCVs();
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
                    <div class="cv-content clickable-result" onclick="adminDashboard.openCV('${cv.id}')">
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
                        <button class="delete-btn" onclick="event.stopPropagation(); adminDashboard.deleteCV('${cv.id}', '${cv.name}')" title="Delete CV">
                            🗑️
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
        console.log('CV ID to delete:', cvId);
        console.log('CV Name:', cvName);
        console.log('Supabase database manager available:', !!window.supabaseDatabaseManager);
        
        // Delete CV directly without confirmation
        try {
            if (window.supabaseDatabaseManager) {
                // Use Supabase database manager to delete CV with admin role
                const success = await window.supabaseDatabaseManager.deleteCV(cvId, 'admin');
                
                if (success) {
                    console.log(`CV deleted successfully: ${cvId}`);
                    
                    // Show success toaster
                    this.showToaster(`CV for "${cvName}" has been successfully deleted.`, 'success');
                    
                    // Refresh the CV list to update the display
                    this.loadAllCVs();
                } else {
                    console.error('Failed to delete CV from database');
                    this.showToaster('Error deleting CV from database. Please try again.', 'error');
                }
            } else {
                // Fallback to old localStorage method
                console.log('Database manager not available, using localStorage fallback');
                const cvKey = `cvBuilder_savedData_${cvId}`;
                localStorage.removeItem(cvKey);
                
                // Also remove any related data
                localStorage.removeItem(`lastModified_${cvKey}`);
                
                console.log(`CV deleted from localStorage: ${cvId}`);
                
                // Show success toaster
                this.showToaster(`CV for "${cvName}" has been successfully deleted.`, 'success');
                
                // Refresh the CV list to update the display
                this.loadAllCVs();
            }
            
        } catch (error) {
            console.error('Error deleting CV:', error);
            this.showToaster('Error deleting CV. Please try again.', 'error');
        }
        console.log('=== END DELETE CV DEBUG ===');
    }

    createViewPage(cvData) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CV View - ${cvData.personalInfo.fullName || 'Unknown'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .cv-container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
                .cv-header { display: flex; gap: 20px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #667eea; align-items: center; }
                .profile-pic { width: 120px; height: 120px; border-radius: 50%; background: #f0f0f0; }
                .personal-info h1 { margin: 0; color: #2d3748; font-size: 2rem; }
                .contact-info { margin-top: 10px; }
                .contact-item { margin: 5px 0; color: #4a5568; }
                .cv-section { margin-bottom: 20px; }
                .cv-section h3 { color: #2d3748; margin-bottom: 10px; font-size: 1.2rem; }
                .cv-section p { color: #4a5568; line-height: 1.6; text-align: justify; }
                .skill-tag, .language-tag, .hobby-tag { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; margin: 2px; font-size: 0.9rem; }
                .language-tag { background: #48bb78; }
                .hobby-tag { background: #ed8936; }
                .education-item, .experience-item { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #667eea; }
                .degree, .job-title { font-weight: 600; color: #2d3748; }
                .institution, .company { color: #667eea; }
                .year, .duration { color: #718096; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <div class="cv-container">
                ${this.generateCVHTML(cvData)}
            </div>
        </body>
        </html>
        `;
    }

    generateCVHTML(cvData) {
        const { personalInfo, education, experience, skills, languages, hobbies, customSections, certifications, otherInfo, references } = cvData;
        
        return `
            <div class="cv-header">
                <div class="profile-pic">
                    ${personalInfo.profilePicture ? 
                        `<img src="${personalInfo.profilePicture}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                        `<div style="width: 100%; height: 100%; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 2rem;">👤</div>`
                    }
                </div>
                <div class="personal-info">
                    <h1>${personalInfo.fullName || 'Your Name'}</h1>
                    <div class="contact-info">
                        ${personalInfo.phones && personalInfo.phones.length > 0 ? `<div class="contact-item">📱 ${personalInfo.phones.map(p => p.phone).join(', ')}</div>` : ''}
                        ${personalInfo.email ? `<div class="contact-item">📧 ${personalInfo.email}</div>` : ''}
                        ${personalInfo.address ? `<div class="contact-item">📍 ${personalInfo.address}</div>` : ''}
                    </div>
                </div>
            </div>
            
            ${personalInfo.summary && personalInfo.summary.trim() && personalInfo.summary !== 'Your professional summary will appear here...' ? `
            <div class="cv-section">
                <h3>💼 Professional Summary</h3>
                <p>${personalInfo.summary}</p>
            </div>
            ` : ''}
            
            ${education && education.length > 0 ? `
            <div class="cv-section">
                <h3>🎓 Education</h3>
                ${education.map(edu => `
                    <div class="education-item">
                        <div class="degree">${edu.degree || ''}</div>
                        <div class="institution">${edu.institution || ''}</div>
                        <div class="year">${edu.year || ''}</div>
                        ${edu.grade ? `<div class="grade">${edu.grade}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${experience && experience.length > 0 ? `
            <div class="cv-section">
                <h3>💼 Work Experience</h3>
                ${experience.map(exp => `
                    <div class="experience-item">
                        <div class="job-title">${exp.jobTitle || ''}</div>
                        <div class="company">${exp.company || ''}</div>
                        <div class="duration">${exp.duration || ''}</div>
                        ${exp.description ? (() => {
                            const bulletPoints = exp.description.split('\n')
                                .filter(line => line.trim())
                                .map(line => `<li>${line.trim()}</li>`)
                                .join('');
                            return `<div class="description"><ul style="margin: 0; padding-left: 20px;">${bulletPoints}</ul></div>`;
                        })() : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${certifications && certifications.length > 0 ? `
            <div class="cv-section">
                <h3>🏆 Certifications</h3>
                <ul>
                    ${certifications.map(cert => 
                        cert.certification && cert.certification.trim() ? `<li>${cert.certification}</li>` : ''
                    ).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${skills && skills.length > 0 ? `
            <div class="cv-section">
                <h3>🚀 Skills</h3>
                ${skills.map(skill => 
                    skill.skill && skill.skill.trim() ? `<span class="skill-tag">${skill.skill}</span>` : ''
                ).join('')}
            </div>
            ` : ''}
            
            ${otherInfo && otherInfo.length > 0 ? `
            <div class="cv-section">
                <h3>ℹ️ Other Information</h3>
                ${otherInfo.map(info => {
                    if (info.fatherName || info.husbandName || info.cnic || info.dateOfBirth || info.maritalStatus) {
                        let htmlContent = '';
                        if (info.fatherName) htmlContent += `<div><strong>Father's Name:</strong> ${info.fatherName}</div>`;
                        if (info.husbandName) htmlContent += `<div><strong>Husband's Name:</strong> ${info.husbandName}</div>`;
                        if (info.cnic) htmlContent += `<div><strong>CNIC:</strong> ${info.cnic}</div>`;
                        if (info.dateOfBirth) htmlContent += `<div><strong>Date of Birth:</strong> ${info.dateOfBirth}</div>`;
                        if (info.maritalStatus) htmlContent += `<div><strong>Marital Status:</strong> ${info.maritalStatus}</div>`;
                        return htmlContent;
                    } else if (info.fieldName && info.fieldValue) {
                        return `<div><strong>${info.fieldName}:</strong> ${info.fieldValue}</div>`;
                    }
                    return '';
                }).join('')}
            </div>
            ` : ''}
            
            ${languages && languages.length > 0 ? `
            <div class="cv-section">
                <h3>🌐 Languages</h3>
                ${languages.map(language => {
                    if (language.language && language.language.trim()) {
                        let displayText = language.language;
                        if (language.level && language.level.trim()) {
                            displayText += ` (${language.level})`;
                        }
                        return `<span class="language-tag">${displayText}</span>`;
                    }
                    return '';
                }).join('')}
            </div>
            ` : ''}
            
            ${hobbies && hobbies.length > 0 ? `
            <div class="cv-section">
                <h3>🎯 Hobbies</h3>
                ${hobbies.map(hobby => 
                    hobby.hobby && hobby.hobby.trim() ? `<span class="hobby-tag">${hobby.hobby}</span>` : ''
                ).join('')}
            </div>
            ` : ''}
            
            ${customSections && customSections.length > 0 ? `
            <div class="cv-section">
                ${customSections.map(section => {
                    if (section.heading && section.items && section.items.length > 0) {
                        return `
                            <h3>✨ ${section.heading}</h3>
                            <ul>
                                ${section.items.map(item => 
                                    item.value && item.value.trim() ? `<li>${item.value}</li>` : ''
                                ).join('')}
                            </ul>
                        `;
                    }
                    return '';
                }).join('')}
            </div>
            ` : ''}
            
            ${references && references.length > 0 ? `
            <div class="cv-section">
                <h3>📞 References</h3>
                <ul>
                    ${references.map(ref => 
                        ref.reference && ref.reference.trim() ? `<li>${ref.reference}</li>` : ''
                    ).join('')}
                </ul>
            </div>
            ` : ''}
        `;
    }

    getLastModified(key) {
        // Try to get last modified date from localStorage
        const lastModified = localStorage.getItem(`lastModified_${key}`);
        if (lastModified) {
            return new Date(lastModified).toLocaleString();
        }
        return 'Unknown';
    }

    // Shopkeeper management methods
    async showShopkeepers() {
        console.log('=== SHOW SHOPKEEPERS DEBUG ===');
        
        // Show shopkeepers section
        const shopkeepersSection = document.getElementById('shopkeepersSection');
        if (shopkeepersSection) {
            shopkeepersSection.style.display = 'block';
            console.log('Shopkeepers section displayed');
        } else {
            console.error('Shopkeepers section element not found!');
            return;
        }
        
        // Hide CVs section if it's open
        this.hideAllCVs();
        
        // Load and display shopkeepers
        await this.loadShopkeepers();
        console.log('=== END SHOW SHOPKEEPERS DEBUG ===');
    }


    async loadShopkeepers() {
        console.log('=== LOAD SHOPKEEPERS DEBUG ===');
        console.log('Loading shopkeepers...');
        console.log('Supabase database manager:', window.supabaseDatabaseManager);
        
        if (window.supabaseDatabaseManager) {
            try {
                const shopkeepers = await window.supabaseDatabaseManager.getAllShopkeepers();
                console.log('Shopkeepers loaded:', shopkeepers);
                console.log('Number of shopkeepers:', shopkeepers.length);
                
                this.displayShopkeepers(shopkeepers);
            } catch (error) {
                console.error('Error loading shopkeepers:', error);
                this.showToaster('Error loading shopkeepers. Please try again.', 'error');
            }
        } else {
            console.error('Database manager not available');
            this.displayShopkeepers([]);
        }
        console.log('=== END LOAD SHOPKEEPERS DEBUG ===');
    }

    displayShopkeepers(shopkeepers) {
        console.log('=== DISPLAY SHOPKEEPERS DEBUG ===');
        console.log('Shopkeepers to display:', shopkeepers);
        console.log('Number of shopkeepers:', shopkeepers.length);
        
        const shopkeepersStats = document.getElementById('shopkeepersStats');
        const shopkeepersList = document.getElementById('shopkeepersList');
        
        console.log('shopkeepersStats element:', shopkeepersStats);
        console.log('shopkeepersList element:', shopkeepersList);
        
        // Display statistics
        const totalShopkeepers = shopkeepers.length;
        const totalDownloads = shopkeepers.reduce((sum, sk) => sum + (sk.download_count || 0), 0);
        
        shopkeepersStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${totalShopkeepers}</span>
                    <span class="stat-label">Total Shopkeepers</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${totalDownloads}</span>
                    <span class="stat-label">Total Downloads</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${Math.round(totalDownloads / Math.max(totalShopkeepers, 1))}</span>
                    <span class="stat-label">Avg Downloads/Shopkeeper</span>
                </div>
            </div>
        `;
        
        // Display shopkeepers list
        if (shopkeepers.length === 0) {
            shopkeepersList.innerHTML = '<div class="no-results">No shopkeepers found in the database.</div>';
        } else {
            shopkeepersList.innerHTML = shopkeepers.map(shopkeeper => `
                <div class="shopkeeper-item">
                    <div class="shopkeeper-content">
                        <div class="shopkeeper-main">
                            <div class="shopkeeper-name">${shopkeeper.name || 'Unknown Name'}</div>
                            <div class="shopkeeper-email">📧 ${shopkeeper.email || 'No email'}</div>
                        </div>
                        <div class="shopkeeper-details">
                            <div class="shopkeeper-contact">
                                <span class="shopkeeper-phone">📱 ${shopkeeper.phone || 'No phone'}</span>
                                <span class="shopkeeper-address">📍 ${shopkeeper.address || 'No address'}</span>
                            </div>
                            <div class="shopkeeper-stats">
                                <span class="download-count">Downloads: ${shopkeeper.download_count || 0}</span>
                                <span class="created-date">Joined: ${new Date(shopkeeper.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="shopkeeper-actions">
                        <button class="btn btn-danger" onclick="adminDashboard.deleteShopkeeper('${shopkeeper.id}', '${shopkeeper.name}')" title="Delete Shopkeeper">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        console.log('Shopkeepers displayed:', shopkeepers.length, 'shopkeepers');
        console.log('=== END DISPLAY SHOPKEEPERS DEBUG ===');
    }

    showAddShopkeeperForm() {
        const addForm = document.getElementById('addShopkeeperForm');
        if (addForm) {
            addForm.style.display = 'block';
            
            // Setup form submission
            const form = document.getElementById('shopkeeperForm');
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    this.handleAddShopkeeper();
                };
            }
        }
    }

    hideAddShopkeeperForm() {
        const addForm = document.getElementById('addShopkeeperForm');
        if (addForm) {
            addForm.style.display = 'none';
            // Clear form
            document.getElementById('shopkeeperForm').reset();
        }
    }

    async handleAddShopkeeper() {
        const name = document.getElementById('shopkeeperName').value.trim();
        const email = document.getElementById('shopkeeperEmail').value.trim();
        const password = document.getElementById('shopkeeperPassword').value;
        const phone = document.getElementById('shopkeeperPhone').value.trim();
        const address = document.getElementById('shopkeeperAddress').value.trim();

        if (!name || !email || !password) {
            this.showToaster('Please fill in all required fields.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToaster('Password must be at least 6 characters long.', 'error');
            return;
        }

        try {
            const shopkeeperData = {
                name: name,
                email: email,
                password: password,
                phone: phone || null,
                address: address || null,
                download_count: 0
            };

            if (window.supabaseDatabaseManager) {
                const newShopkeeper = await window.supabaseDatabaseManager.createShopkeeper(shopkeeperData);
                
                if (newShopkeeper) {
                    this.showToaster(`Shopkeeper "${name}" added successfully!`, 'success');
                    this.hideAddShopkeeperForm();
                    await this.loadShopkeepers();
                } else {
                    this.showToaster('Error creating shopkeeper. Please try again.', 'error');
                }
            } else {
                this.showToaster('Database not available. Please try again later.', 'error');
            }
        } catch (error) {
            console.error('Error adding shopkeeper:', error);
            this.showToaster('Error adding shopkeeper. Please try again.', 'error');
        }
    }

    async deleteShopkeeper(shopkeeperId, shopkeeperName) {
        console.log('=== DELETE SHOPKEEPER DEBUG ===');
        console.log('Shopkeeper ID to delete:', shopkeeperId);
        console.log('Shopkeeper Name:', shopkeeperName);
        
        if (!confirm(`Are you sure you want to delete shopkeeper "${shopkeeperName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            if (window.supabaseDatabaseManager) {
                const success = await window.supabaseDatabaseManager.deleteShopkeeper(shopkeeperId);
                
                if (success) {
                    console.log(`Shopkeeper deleted successfully: ${shopkeeperId}`);
                    this.showToaster(`Shopkeeper "${shopkeeperName}" has been successfully deleted.`, 'success');
                    await this.loadShopkeepers();
                } else {
                    console.error('Failed to delete shopkeeper from database');
                    this.showToaster('Error deleting shopkeeper from database. Please try again.', 'error');
                }
            } else {
                this.showToaster('Database not available. Please try again later.', 'error');
            }
        } catch (error) {
            console.error('Error deleting shopkeeper:', error);
            this.showToaster('Error deleting shopkeeper. Please try again.', 'error');
        }
        console.log('=== END DELETE SHOPKEEPER DEBUG ===');
    }

    // Loading indicator methods
    showLoadingIndicator() {
        const allCVsList = document.getElementById('allCVsList');
        if (allCVsList) {
            allCVsList.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading CVs...</div>
                </div>
            `;
        }
    }

    hideLoadingIndicator() {
        // Loading indicator will be replaced by actual content
    }

    showError(message) {
        const allCVsList = document.getElementById('allCVsList');
        if (allCVsList) {
            allCVsList.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">${message}</div>
                    <button class="retry-btn" onclick="adminDashboard.loadAllCVs()">Retry</button>
                </div>
            `;
        }
    }

    // Pagination methods
    updatePaginationControls() {
        const statsElement = document.getElementById('cvsStats');
        if (statsElement && this.totalCVs > 0) {
            const currentPage = Math.floor(this.currentOffset / this.pageSize) + 1;
            const totalPages = Math.ceil(this.totalCVs / this.pageSize);
            
            statsElement.innerHTML += `
                <div class="pagination-info">
                    <span>Showing ${this.currentOffset + 1}-${Math.min(this.currentOffset + this.pageSize, this.totalCVs)} of ${this.totalCVs} CVs</span>
                    <div class="pagination-controls">
                        <button class="pagination-btn" onclick="adminDashboard.loadPreviousPage()" ${this.currentOffset === 0 ? 'disabled' : ''}>
                            ← Previous
                        </button>
                        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
                        <button class="pagination-btn" onclick="adminDashboard.loadNextPage()" ${!this.hasMore ? 'disabled' : ''}>
                            Next →
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async loadNextPage() {
        if (!this.hasMore) return;
        
        this.showLoadingIndicator();
        try {
            const newOffset = this.currentOffset + this.pageSize;
            const result = await window.supabaseDatabaseManager.searchCVs('', '', null, 'admin', null, this.pageSize, newOffset);
            
            this.currentOffset = newOffset;
            this.hasMore = result.hasMore;
            this.allCVs = [...this.allCVs, ...result.data];
            
            this.displayAllCVs(this.allCVs);
            this.updatePaginationControls();
        } catch (error) {
            console.error('Error loading next page:', error);
            this.showError('Failed to load more CVs. Please try again.');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    async loadPreviousPage() {
        if (this.currentOffset === 0) return;
        
        this.showLoadingIndicator();
        try {
            const newOffset = Math.max(0, this.currentOffset - this.pageSize);
            const result = await window.supabaseDatabaseManager.searchCVs('', '', null, 'admin', null, this.pageSize, newOffset);
            
            this.currentOffset = newOffset;
            this.hasMore = true; // We can always go forward from a previous page
            this.allCVs = result.data;
            
            this.displayAllCVs(this.allCVs);
            this.updatePaginationControls();
        } catch (error) {
            console.error('Error loading previous page:', error);
            this.showError('Failed to load previous page. Please try again.');
        } finally {
            this.hideLoadingIndicator();
        }
    }

}

// Global functions for HTML onclick handlers
function goToCVBuilder() {
    if (window.adminDashboard) {
        window.adminDashboard.goToCVBuilder();
    }
}



function logout() {
    if (AuthSystem) {
        AuthSystem.logout();
        window.location.href = 'auth.html';
    }
}

function showAllCVs() {
    console.log('=== GLOBAL showAllCVs CALLED ===');
    console.log('window.adminDashboard exists:', !!window.adminDashboard);
    
    if (window.adminDashboard) {
        console.log('Calling adminDashboard.showAllCVs()');
        window.adminDashboard.showAllCVs();
    } else {
        console.error('AdminDashboard not initialized!');
    }
}


function performLiveSearch() {
    if (window.adminDashboard) {
        window.adminDashboard.performLiveSearch();
    }
}

function clearLiveSearch() {
    if (window.adminDashboard) {
        window.adminDashboard.clearLiveSearch();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.adminDashboard = new AdminDashboard();
        console.log('Admin Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing Admin Dashboard:', error);
    }
});
