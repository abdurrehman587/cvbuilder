// CV Builder JavaScript
class CVBuilder {
    constructor() {
        this.cvData = {
            personalInfo: {
                fullName: '',
                email: '',
                phones: [],
                address: '',
                profilePicture: null,
                summary: 'Dedicated and results-driven professional with a strong commitment to excellence and continuous learning. Seeking opportunities to leverage my skills and contribute to organizational success while advancing my career in a dynamic and challenging environment.'
            },
            education: [],
            experience: [],
            certifications: [],
            skills: [
                { skill: 'Communication Skills' },
                { skill: 'Time Management' },
                { skill: 'Hardworking' },
                { skill: 'Accurate Planning' }
            ],
            languages: [
                { language: 'English', level: '' },
                { language: 'Urdu', level: '' },
                { language: 'Punjabi', level: '' }
            ],
            hobbies: [],
            customSections: [],
            otherInfo: [],
            references: [
                { reference: 'References would be furnished on demand.' }
            ]
        };
        
        this.autoSaveInterval = null;
        this.lastSaved = null;
        this.hasUnsavedChanges = false;
        this.hiddenSections = new Set(); // Track which sections are hidden
        this.isSaving = false; // Prevent multiple simultaneous saves
        
        this.init().catch(error => {
            console.error('Error during CVBuilder initialization:', error);
        });
    }

    async init() {
        console.log('CVBuilder init called');
        console.log('DOM ready state:', document.readyState);
        
        // Ensure user session is maintained
        this.ensureUserSession();
        
        // Test if elements exist first
        this.testElements();
        
        this.setupEventListeners();
        console.log('Event listeners setup completed');
        
        this.setupAccordion();
        console.log('Accordion setup completed');
        
        this.setupInitialItems();
        console.log('Initial items setup completed');
        
        // Setup Enter key navigation
        this.setupEnterKeyNavigation();
        console.log('Enter key navigation setup completed');
        
        // Initialize save indicator first
        this.initializeSaveIndicator();
        
        // Load saved data if available (before applying template)
        await this.loadSavedData();
        
        // Load initial data from form fields (only if not loading saved data)
        if (!sessionStorage.getItem('currentCVId')) {
            this.loadInitialData();
        }
        console.log('Initial data loading completed');
        
        // Apply template styling (after loading data)
        this.applyTemplate();
        console.log('Template applied');
        
        this.updatePreview();
        
        // Start auto-save
        this.startAutoSave();
        
        console.log('CVBuilder init completed');
    }
    
    testElements() {
        console.log('Testing if elements exist...');
        
        const formElements = {
            fullName: document.getElementById('fullName'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            address: document.getElementById('address'),
            summary: document.getElementById('summary')
        };
        
        const previewElements = {
            previewName: document.getElementById('previewName'),
            previewEmail: document.getElementById('previewEmail'),
            previewPhone: document.getElementById('previewPhone'),
            previewAddress: document.getElementById('previewAddress'),
            previewSummary: document.getElementById('previewSummary')
        };
        
        console.log('Form elements found:', formElements);
        console.log('Preview elements found:', previewElements);
    }

    setupEventListeners() {
        console.log('setupEventListeners called');
        
        // Personal info inputs
        const fullNameElement = document.getElementById('fullName');
        const emailElement = document.getElementById('email');
        const phoneElement = document.getElementById('phone');
        const addressElement = document.getElementById('address');
        const summaryElement = document.getElementById('summary');
        
        console.log('Setting up event listeners for:', {
            fullName: !!fullNameElement,
            email: !!emailElement,
            phone: !!phoneElement,
            address: !!addressElement,
            summary: !!summaryElement
        });
        
        if (fullNameElement) {
            fullNameElement.addEventListener('input', (e) => {
                console.log('Full name changed:', e.target.value);
                this.cvData.personalInfo.fullName = e.target.value;
                this.markAsChanged();
                this.updatePreview();
            });
            console.log('Event listener added to fullName');
        } else {
            console.error('fullName element not found!');
        }
        
        if (emailElement) {
            emailElement.addEventListener('input', (e) => {
                console.log('Email changed:', e.target.value);
                this.cvData.personalInfo.email = e.target.value;
                this.markAsChanged();
                this.updatePreview();
            });
            console.log('Event listener added to email');
        } else {
            console.error('email element not found!');
        }
        
        // Add event listeners to existing phone inputs
        this.initializePhoneEventListeners();
        
        if (addressElement) {
            addressElement.addEventListener('input', (e) => {
                console.log('Address changed:', e.target.value);
                this.cvData.personalInfo.address = e.target.value;
                this.markAsChanged();
                this.updatePreview();
            });
            console.log('Event listener added to address');
        } else {
            console.error('address element not found!');
        }
        
        if (summaryElement) {
            summaryElement.addEventListener('input', (e) => {
                console.log('Summary changed:', e.target.value);
                this.cvData.personalInfo.summary = e.target.value;
                this.markAsChanged();
                this.updatePreview();
            });
            console.log('Event listener added to summary');
        } else {
            console.error('summary element not found!');
        }


        // Profile picture
        const profilePicElement = document.getElementById('profilePic');
        if (profilePicElement) {
            profilePicElement.addEventListener('change', (e) => {
            this.handleProfilePicture(e.target.files[0]);
        });
            console.log('Event listener added to profilePic');
        } else {
            console.error('profilePic element not found!');
        }

        // Add buttons
        const addEducationBtn = document.getElementById('addEducation');
        const addExperienceBtn = document.getElementById('addExperience');
        const addSkillBtn = document.getElementById('addSkill');
        const addOtherInfoBtn = document.getElementById('addOtherInfo');
        const downloadBtn = document.getElementById('downloadCV');
        
        if (addEducationBtn) {
            addEducationBtn.addEventListener('click', () => this.addEducation());
            console.log('Event listener added to addEducation');
        } else {
            console.error('addEducation button not found!');
        }
        
        if (addExperienceBtn) {
            addExperienceBtn.addEventListener('click', () => this.addExperience());
            console.log('Event listener added to addExperience');
        } else {
            console.error('addExperience button not found!');
        }
        
        const addCertificationBtn = document.getElementById('addCertification');
        if (addCertificationBtn) {
            addCertificationBtn.addEventListener('click', () => this.addCertification());
            console.log('Event listener added to addCertification');
        } else {
            console.error('addCertification button not found!');
        }
        
        if (addSkillBtn) {
            addSkillBtn.addEventListener('click', () => this.addSkill());
            console.log('Event listener added to addSkill');
        } else {
            console.error('addSkill button not found!');
        }
        
        const addLanguageBtn = document.getElementById('addLanguage');
        if (addLanguageBtn) {
            addLanguageBtn.addEventListener('click', () => this.addLanguage());
            console.log('Event listener added to addLanguage');
        } else {
            console.error('addLanguage button not found!');
        }
        
        const addHobbyBtn = document.getElementById('addHobby');
        if (addHobbyBtn) {
            addHobbyBtn.addEventListener('click', () => this.addHobby());
            console.log('Event listener added to addHobby');
        } else {
            console.error('addHobby button not found!');
        }
        
        const addReferenceBtn = document.getElementById('addReference');
        if (addReferenceBtn) {
            addReferenceBtn.addEventListener('click', () => this.addReference());
            console.log('Event listener added to addReference');
        } else {
            console.error('addReference button not found!');
        }
        
        const addCustomSectionBtn = document.getElementById('addCustomSection');
        if (addCustomSectionBtn) {
            addCustomSectionBtn.addEventListener('click', () => this.addCustomSection());
            console.log('Event listener added to addCustomSection');
        } else {
            console.error('addCustomSection button not found!');
        }
        
        if (addOtherInfoBtn) {
            addOtherInfoBtn.addEventListener('click', () => this.addOtherInfo());
            console.log('Event listener added to addOtherInfo');
        } else {
            console.error('addOtherInfo button not found!');
        }

        // Download button
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadCV());
            console.log('Event listener added to downloadCV');
        } else {
            console.error('downloadCV button not found!');
        }
        

        // Template switcher functionality
        this.setupTemplateSwitcher();
        
        // Manual save button functionality
        this.setupManualSaveButton();
    }


    setupTemplateSwitcher() {
        // Setup template switching buttons
        const templateButtons = document.querySelectorAll('.template-btn');
        
        templateButtons.forEach(button => {
            button.addEventListener('click', () => {
                const templateType = button.getAttribute('data-template');
                console.log('Template button clicked:', templateType);
                
                // Update active button
                templateButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Switch template
                this.switchTemplate(templateType);
            });
        });
        
        // Set initial active button based on current template
        this.updateActiveTemplateButton();
        
        console.log('Template switcher setup completed');
    }

    updateActiveTemplateButton() {
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        const templateButtons = document.querySelectorAll('.template-btn');
        
        templateButtons.forEach(button => {
            const templateType = button.getAttribute('data-template');
            if (templateType === selectedTemplate) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    setupManualSaveButton() {
        const manualSaveBtn = document.getElementById('manualSaveBtn');
        
        if (manualSaveBtn) {
            manualSaveBtn.addEventListener('click', () => {
                console.log('Manual save button clicked');
                this.saveData();
            });
            console.log('Manual save button event listener added');
        } else {
            console.error('Manual save button not found!');
        }
    }

    applyTemplate() {
        const cvPreview = document.getElementById('cvPreview');
        if (!cvPreview) return;

        // Get selected template from sessionStorage or default to classic
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        console.log('Applying template:', selectedTemplate);

        // Remove all template classes
        cvPreview.classList.remove('template-2', 'template-3');
        
        // Generate different HTML structure based on template
        if (selectedTemplate === 'modern') {
            this.generateTemplate2HTML();
            cvPreview.classList.add('template-2');
            console.log('Applied Template 2 (modern) styling');
        } else if (selectedTemplate === 'minimalist') {
            this.generateTemplate3HTML();
            cvPreview.classList.add('template-3');
            console.log('Applied Template 3 (minimalist) styling');
        } else {
            this.generateTemplate1HTML();
            console.log('Applied Template 1 (classic) styling');
        }
        
        // After template change, update preview (form data should already be loaded)
        this.updatePreview();
        console.log('Template applied and preview updated');
    }

    // Method to handle template switching while preserving data
    switchTemplate(templateType) {
        console.log('Switching to template:', templateType);
        
        // Force save before switching templates
        if (this.hasUnsavedChanges) {
            console.log('Saving data before template switch');
            this.forceSave();
        }
        
        // Store new template selection
        sessionStorage.setItem('selectedTemplate', templateType);
        
        // Apply the new template
        this.applyTemplate();
        
        // Update active button
        this.updateActiveTemplateButton();
        
        console.log('Template switched successfully to:', templateType);
    }

    generateTemplate1HTML() {
        const cvPreview = document.getElementById('cvPreview');
        if (!cvPreview) return;

        // Generate Template 1 (Classic) HTML structure
        cvPreview.innerHTML = `
            <div class="cv-header">
                <div class="profile-pic">
                    <img id="profileImage" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMwIDMwQzMzLjMxMzcgMzAgMzYgMjcuMzEzNyAzNiAyNEMzNiAyMC42ODYzIDMzLjMxMzcgMTggMzAgMThDMjYuNjg2MyAxOCAyNCAyMC42ODYzIDI0IDI0QzI0IDI3LjMxMzcgMjYuNjg2MyAzMCAzMCAzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQ4IDQyQzQ4IDQ2LjQxODMgNDQuNDE4MyA1MCA0MCA1MEgyMEMxNS41ODE3IDUwIDEyIDQ2LjQxODMgMTIgNDJWMzZIMTJWNDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K" alt="Profile">
                </div>
                <div class="personal-info">
                    <h1 id="previewName">Your Name</h1>
                    <div class="contact-info">
                        <div class="contact-item" id="previewPhone">📱 +1234567890</div>
                        <div class="contact-item" id="previewEmail">📧 your.email@example.com</div>
                        <div class="contact-item" id="previewAddress">📍 Your Address</div>
                    </div>
                </div>
            </div>
            
            <div class="cv-section" id="summary-section">
                <div class="section-header-preview">
                    <h3>💼 Professional Summary</h3>
                </div>
                <p id="previewSummary">Your professional summary will appear here...</p>
            </div>
            
            <div class="cv-section" id="education-section">
                <div class="section-header-preview">
                    <h3>🎓 Education</h3>
                </div>
                <div id="previewEducation"></div>
            </div>
            
            <div class="cv-section" id="experience-section">
                <div class="section-header-preview">
                    <h3>💼 Work Experience</h3>
                </div>
                <div id="previewExperience"></div>
            </div>
            
            <div class="cv-section" id="certifications-section">
                <div class="section-header-preview">
                    <h3>🏆 Certifications</h3>
                </div>
                <div id="previewCertifications"></div>
            </div>
            
            <div class="cv-section" id="skills-section">
                <div class="section-header-preview">
                    <h3>🚀 Skills</h3>
                </div>
                <div id="previewSkills"></div>
            </div>
            
            <div class="cv-section" id="other-section">
                <div class="section-header-preview">
                    <h3>ℹ️ Other Information</h3>
                </div>
                <div id="previewOtherInfo"></div>
            </div>
            
            <div class="cv-section" id="languages-section">
                <div class="section-header-preview">
                    <h3>🌐 Languages</h3>
                </div>
                <div id="previewLanguages"></div>
            </div>
            
            <div class="cv-section" id="hobbies-section">
                <div class="section-header-preview">
                    <h3>🎯 Hobbies</h3>
                </div>
                <div id="previewHobbies"></div>
            </div>
            
            <div class="cv-section" id="custom-section" style="${this.hiddenSections.has('custom') ? 'display: none;' : ''}">
                <div id="previewCustomSections"></div>
            </div>
            
            <div class="cv-section" id="references-section">
                <div class="section-header-preview">
                    <h3>📞 References</h3>
                </div>
                <div id="previewReferences"></div>
            </div>
        `;
    }

    generateTemplate2HTML() {
        const cvPreview = document.getElementById('cvPreview');
        if (!cvPreview) return;

        // Generate Template 2 (Modern Two-Column) HTML structure
        cvPreview.innerHTML = `
            <div class="template-2-container">
                <!-- Left Sidebar -->
                <div class="template-2-sidebar">
                    <!-- Profile Picture -->
                    <div class="template-2-profile-pic">
                        <img id="profileImage" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMwIDMwQzMzLjMxMzcgMzAgMzYgMjcuMzEzNyAzNiAyNEMzNiAyMC42ODYzIDMzLjMxMzcgMTggMzAgMThDMjYuNjg2MyAxOCAyNCAyMC42ODYzIDI0IDI0QzI0IDI3LjMxMzcgMjYuNjg2MyAzMCAzMCAzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQ4IDQyQzQ4IDQ2LjQxODMgNDQuNDE4MyA1MCA0MCA1MEgyMEMxNS41ODE3IDUwIDEyIDQ2LjQxODMgMTIgNDJWMzZIMTJWNDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K" alt="Profile">
                    </div>

                    <!-- Contact Information -->
                    <div class="template-2-contact-section" id="template2ContactSection">
                        <!-- Contact items will be dynamically added here when data is available -->
                    </div>

                    <!-- Skills Section -->
                    <div class="template-2-sidebar-section">
                        <h3 class="template-2-sidebar-title">
                            <span class="template-2-section-icon">⚙️</span>
                            Skills
                        </h3>
                        <div class="template-2-skills-list" id="previewSkills">
                            <!-- Skills will be populated here -->
                        </div>
                    </div>

                    <!-- Languages Section -->
                    <div class="template-2-sidebar-section">
                        <h3 class="template-2-sidebar-title">
                            <span class="template-2-section-icon">🌐</span>
                            Languages
                        </h3>
                        <div class="template-2-languages-list" id="previewLanguages">
                            <!-- Languages will be populated here -->
                        </div>
                    </div>

                    <!-- Hobbies Section -->
                    <div class="template-2-sidebar-section">
                        <h3 class="template-2-sidebar-title">
                            <span class="template-2-section-icon">🎯</span>
                            Hobbies
                        </h3>
                        <div class="template-2-hobbies-list" id="previewHobbies">
                            <!-- Hobbies will be populated here -->
                        </div>
                    </div>

                    <!-- Other Information Section -->
                    <div class="template-2-sidebar-section">
                        <h3 class="template-2-sidebar-title">
                            <span class="template-2-section-icon">ℹ️</span>
                            Other Information
                        </h3>
                        <div class="template-2-other-info-list" id="previewOtherInfo">
                            <!-- Other information will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Right Main Content -->
                <div class="template-2-main-content">
                    <!-- Header with Name and Title -->
                    <div class="template-2-header">
                        <h1 id="previewName">YOUR NAME HERE</h1>
                    </div>

                    <!-- Profile Section -->
                    <div class="template-2-main-section">
                        <h3 class="template-2-main-title">
                            <span class="template-2-main-icon">👤</span>
                            Profile
                        </h3>
                        <p id="previewSummary">Your professional summary will appear here...</p>
                    </div>

                    <!-- Education Section -->
                    <div class="template-2-main-section">
                        <h3 class="template-2-main-title">
                            <span class="template-2-main-icon">🎓</span>
                            Education
                        </h3>
                        <div id="previewEducation">
                            <!-- Education will be populated here -->
                        </div>
                    </div>

                    <!-- Work Experience Section -->
                    <div class="template-2-main-section">
                        <h3 class="template-2-main-title">
                            <span class="template-2-main-icon">💼</span>
                            Work Experience
                        </h3>
                        <div id="previewExperience">
                            <!-- Experience will be populated here -->
                        </div>
                    </div>

                    <!-- Certifications Section -->
                    <div class="template-2-main-section" id="certifications-section" style="${(!this.cvData.certifications || this.cvData.certifications.length === 0) ? 'display: none;' : ''}">
                        <h3 class="template-2-main-title">
                            <span class="template-2-main-icon">🏆</span>
                            Certifications
                        </h3>
                        <div id="previewCertifications">
                            <!-- Certifications will be populated here -->
                        </div>
                    </div>

                    <!-- Custom Sections -->
                    <div class="template-2-main-section" style="${this.hiddenSections.has('custom') ? 'display: none;' : ''}">
                        <div id="previewCustomSections">
                            <!-- Custom sections will be populated here -->
                        </div>
                    </div>

                    <!-- References Section -->
                    <div class="template-2-main-section" style="${(!this.cvData.references || this.cvData.references.length === 0) ? 'display: none;' : ''}">
                        <h3 class="template-2-main-title">
                            <span class="template-2-main-icon">📞</span>
                            References
                        </h3>
                        <div id="previewReferences">
                            <!-- References will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateTemplate3HTML() {
        const cvPreview = document.getElementById('cvPreview');
        if (!cvPreview) return;

        // Generate Template 3 (Creative Card-Based) HTML structure
        cvPreview.innerHTML = `
            <div class="template-3-container">
                <!-- Header Section with Gradient Background -->
                <div class="template-3-header">
                    <div class="template-3-header-content">
                        <div class="template-3-profile-section">
                            <div class="template-3-profile-pic">
                                <img id="profileImage" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iNjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMwIDMwQzMzLjMxMzcgMzAgMzYgMjcuMzEzNyAzNiAyNEMzNiAyMC42ODYzIDMzLjMxMzcgMTggMzAgMThDMjYuNjg2MyAxOCAyNCAyMC42ODYzIDI0IDI0QzI0IDI3LjMxMzcgMjYuNjg2MyAzMCAzMCAzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQ4IDQyQzQ4IDQ2LjQxODMgNDQuNDE4MyA1MCA0MCA1MEgyMEMxNS41ODE3IDUwIDEyIDQ2LjQxODMgMTIgNDJWMzZIMTJWNDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K" alt="Profile">
                            </div>
                            <div class="template-3-name-section">
                                <h1 id="previewName">YOUR NAME HERE</h1>
                            </div>
                            <div class="template-3-contact-info" id="template3ContactInfo">
                                <!-- Contact info will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="template-3-main-grid">
                    <!-- Left Column -->
                    <div class="template-3-left-column">
                        <!-- Certifications Card -->
                        <div class="template-3-card" id="certifications-section">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">🏆</span>
                                <h3>Certifications</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div id="previewCertifications">
                                    <!-- Certifications will be populated here -->
                                </div>
                            </div>
                        </div>

                        <!-- Other Information Card -->
                        ${!this.hiddenSections.has('otherInfo') ? `
                        <div class="template-3-card">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">📋</span>
                                <h3>Other Information</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div id="previewOtherInfo">
                                    <!-- Other information will be populated here -->
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Skills Card -->
                        <div class="template-3-card">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">⚙️</span>
                                <h3>Skills</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div class="template-3-skills-grid" id="previewSkills">
                                    <!-- Skills will be populated here -->
                                </div>
                            </div>
                        </div>

                        <!-- Languages Card -->
                        <div class="template-3-card">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">🌐</span>
                                <h3>Languages</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div class="template-3-languages-list" id="previewLanguages">
                                    <!-- Languages will be populated here -->
                                </div>
                            </div>
                        </div>

                        <!-- Hobbies Card -->
                        <div class="template-3-card">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">🎯</span>
                                <h3>Hobbies</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div class="template-3-hobbies-list" id="previewHobbies">
                                    <!-- Hobbies will be populated here -->
                                </div>
                            </div>
                        </div>

                        <!-- References Card -->
                        ${!this.hiddenSections.has('references') ? `
                        <div class="template-3-card">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">📞</span>
                                <h3>References</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div id="previewReferences">
                                    <!-- References will be populated here -->
                                </div>
                            </div>
                        </div>
                        ` : ''}

                    </div>

                    <!-- Right Column -->
                    <div class="template-3-right-column">
                        <!-- Profile Card -->
                        <div class="template-3-card">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">👤</span>
                                <h3>Profile</h3>
                            </div>
                            <div class="template-3-card-content">
                                <p id="previewSummary">Your professional summary will appear here...</p>
                            </div>
                        </div>

                        <!-- Education Card -->
                        <div class="template-3-card">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">🎓</span>
                                <h3>Education</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div id="previewEducation">
                                    <!-- Education will be populated here -->
                                </div>
                            </div>
                        </div>

                        <!-- Experience Card -->
                        <div class="template-3-card">
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">💼</span>
                                <h3>Work Experience</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div id="previewExperience">
                                    <!-- Experience will be populated here -->
                                </div>
                            </div>
                        </div>

                        <!-- Custom Sections -->
                        <div id="previewCustomSections">
                            <!-- Custom sections will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupAccordion() {
        const sectionHeaders = document.querySelectorAll('.section-header');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sectionName = header.getAttribute('data-section');
                this.toggleSection(sectionName);
            });
        });
    }

    setupEnterKeyNavigation() {
        // Add Enter key navigation to all existing form inputs
        const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea, select');
        this.addEnterKeyNavigation(allInputs);
    }

    moveToNextInput(currentInput) {
        // Get all form inputs in the document
        const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea, select'));
        
        // Find current input index
        const currentIndex = allInputs.indexOf(currentInput);
        
        if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
            // Move to next input
            const nextInput = allInputs[currentIndex + 1];
            nextInput.focus();
            
            // If it's a select element, open the dropdown
            if (nextInput.tagName === 'SELECT') {
                nextInput.click();
            }
        }
    }

    addEnterKeyNavigation(inputs) {
        // Add Enter key navigation to a collection of inputs
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.moveToNextInput(input);
                }
            });
        });
    }

    formatCNIC(input) {
        // Remove all non-numeric characters
        let value = input.value.replace(/\D/g, '');
        
        // Limit to 13 digits
        if (value.length > 13) {
            value = value.substring(0, 13);
        }
        
        // Add dashes at appropriate positions
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5);
        }
        if (value.length > 13) {
            value = value.substring(0, 13) + '-' + value.substring(13);
        }
        
        input.value = value;
    }

    formatDateOfBirth(input) {
        // Remove all non-numeric characters
        let value = input.value.replace(/\D/g, '');
        
        // Limit to 8 digits (DDMMYYYY)
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        // Add dashes at appropriate positions
        if (value.length > 2) {
            value = value.substring(0, 2) + '-' + value.substring(2);
        }
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5);
        }
        
        input.value = value;
    }

    setupFieldFormatting() {
        // Use event delegation to handle both existing and dynamically created fields
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('cnic')) {
                this.formatCNIC(e.target);
                this.markAsChanged();
                this.updatePreview();
            } else if (e.target.classList.contains('dateOfBirth')) {
                this.formatDateOfBirth(e.target);
                this.markAsChanged();
                this.updatePreview();
            }
        });
    }

    toggleSection(clickedSection) {
        console.log('=== TOGGLE SECTION DEBUG ===');
        console.log('Clicked section:', clickedSection);
        const allSections = ['contact', 'summary', 'education', 'experience', 'certifications', 'skills', 'other', 'languages', 'hobbies', 'custom', 'references'];
        const allHeaders = document.querySelectorAll('.section-header');
        const allContents = document.querySelectorAll('.section-content');
        
        allSections.forEach(section => {
            const header = document.querySelector(`[data-section="${section}"]`);
            const content = document.querySelector(`.${section}-section`);
            
            if (section === clickedSection) {
                console.log(`Showing section: ${section}`);
                console.log('Content element found:', !!content);
                // Show clicked section
                if (content) {
                    content.style.display = 'block';
                }
                if (header) {
                    header.classList.add('active');
                    header.innerHTML = header.innerHTML.replace('▶', '▼');
                }
                
                // Add default hobby input field if hobbies section is clicked and empty
                if (section === 'hobbies') {
                    const hobbiesList = document.getElementById('hobbiesList');
                    const existingHobbyItems = hobbiesList.querySelectorAll('.hobby-item');
                    
                    if (existingHobbyItems.length === 0) {
                        this.addHobby();
                    }
                }
            } else {
                // Hide other sections
                content.style.display = 'none';
                header.classList.remove('active');
                header.innerHTML = header.innerHTML.replace('▼', '▶');
            }
        });
    }

    setupInitialItems() {
        console.log('setupInitialItems called');
        
        // Add event listeners to initial education items
        const initialEducationItems = document.querySelectorAll('.education-item');
        console.log('Found initial education items:', initialEducationItems.length);
        initialEducationItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            console.log('Adding listeners to education inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Education input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
            });
        });

        // Add event listeners to initial experience items
        const initialExperienceItems = document.querySelectorAll('.experience-item');
        console.log('Found initial experience items:', initialExperienceItems.length);
        initialExperienceItems.forEach(item => {
            const inputs = item.querySelectorAll('input, textarea');
            console.log('Adding listeners to experience inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Experience input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
                
                // Add Enter key functionality for description textareas
                if (input.classList.contains('description')) {
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const cursorPos = input.selectionStart;
                            const textBefore = input.value.substring(0, cursorPos);
                            const textAfter = input.value.substring(input.selectionEnd);
                            
                            // Add only new line (no bullet point in form)
                            const newText = textBefore + '\n' + textAfter;
                            input.value = newText;
                            
                            // Set cursor position after the new line
                            const newCursorPos = cursorPos + 1; // 1 character for '\n'
                            input.setSelectionRange(newCursorPos, newCursorPos);
                            
                            this.markAsChanged();
                            this.updatePreview();
                        }
                    });
                }
            });
        });

        // Add event listeners to initial certification items
        const initialCertificationItems = document.querySelectorAll('.certification-item');
        console.log('Found initial certification items:', initialCertificationItems.length);
        initialCertificationItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            console.log('Adding listeners to certification inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Certification input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
            });
        });

        // Add event listeners to initial skill items
        const initialSkillItems = document.querySelectorAll('.skill-item');
        console.log('Found initial skill items:', initialSkillItems.length);
        initialSkillItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            console.log('Adding listeners to skill inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Skill input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
            });
        });

        // Add event listeners to initial language items
        const initialLanguageItems = document.querySelectorAll('.language-item');
        console.log('Found initial language items:', initialLanguageItems.length);
        initialLanguageItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            console.log('Adding listeners to language inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Language input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
            });
        });

        // Add event listeners to initial hobby items
        const initialHobbyItems = document.querySelectorAll('.hobby-item');
        console.log('Found initial hobby items:', initialHobbyItems.length);
        initialHobbyItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            console.log('Adding listeners to hobby inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Hobby input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
            });
        });

        // Add event listeners to initial custom section items
        const initialCustomSectionItems = document.querySelectorAll('.custom-section-item');
        console.log('Found initial custom section items:', initialCustomSectionItems.length);
        initialCustomSectionItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            console.log('Adding listeners to custom section inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Custom section input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
            });
        });

        // Add event listeners to initial other info items
        const initialOtherInfoItems = document.querySelectorAll('.other-info-item');
        console.log('Found initial other info items:', initialOtherInfoItems.length);
        initialOtherInfoItems.forEach(item => {
            const inputs = item.querySelectorAll('input, select');
            console.log('Adding listeners to other info inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Other info input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
                input.addEventListener('change', () => {
                    console.log('Other info select changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
            });
        });

        // Add formatting to CNIC and Date of Birth fields
        this.setupFieldFormatting();

        // Add event listeners to initial reference items
        const initialReferenceItems = document.querySelectorAll('.reference-item');
        console.log('Found initial reference items:', initialReferenceItems.length);
        initialReferenceItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            console.log('Adding listeners to reference inputs:', inputs.length);
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log('Reference input changed:', input.value);
                    this.markAsChanged();
                    this.updatePreview();
                });
            });
        });
    }

    handleProfilePicture(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.cvData.personalInfo.profilePicture = e.target.result;
                this.updatePreview();
            };
            reader.readAsDataURL(file);
        }
    }

    addEducation() {
        this.addEducationItem();
    }

    addExperience() {
        const experienceList = document.getElementById('experienceList');
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';
        experienceItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row">
                <label>Job Title:</label>
                <input type="text" class="jobTitle" placeholder="e.g., Software Developer">
            </div>
            <div class="form-row">
                <label>Company:</label>
                <input type="text" class="company" placeholder="e.g., Tech Solutions Inc.">
            </div>
            <div class="form-row">
                <label>Duration:</label>
                <input type="text" class="duration" placeholder="e.g., Jan 2022 - Present">
            </div>
            <div class="form-row">
                <label>Description:</label>
                <textarea class="description" rows="3" placeholder="Describe your responsibilities and achievements"></textarea>
            </div>
        `;

        // Add event listeners to new inputs
        const inputs = experienceItem.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });
        
        // Add Enter key navigation
        this.addEnterKeyNavigation(inputs);

        experienceList.appendChild(experienceItem);
    }

    addCertification() {
        const certificationsList = document.getElementById('certificationsList');
        const certificationItem = document.createElement('div');
        certificationItem.className = 'certification-item';
        certificationItem.innerHTML = `
            <input type="text" class="certification" placeholder="e.g., AWS Certified Solutions Architect">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
        `;

        // Add event listeners to new inputs
        const inputs = certificationItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });

        certificationsList.appendChild(certificationItem);
    }

    addSkill() {
        const skillsList = document.getElementById('skillsList');
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <div class="form-row">
                <label>Skill:</label>
                <input type="text" class="skill" placeholder="e.g., JavaScript, Python, Communication">
            </div>
        `;

        // Add event listeners to new inputs
        const inputs = skillItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });

        skillsList.appendChild(skillItem);
    }

    addLanguage() {
        const languagesList = document.getElementById('languagesList');
        const languageItem = document.createElement('div');
        languageItem.className = 'language-item';
        languageItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row language-inputs-row">
                <div class="input-group">
                    <label>Language:</label>
                    <input type="text" class="language" placeholder="e.g., English">
                </div>
                <div class="input-group">
                    <label>Level/Detail:</label>
                    <input type="text" class="languageLevel" placeholder="e.g., Native, Fluent, Intermediate">
                </div>
            </div>
        `;

        // Add event listeners to new inputs
        const inputs = languageItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });

        languagesList.appendChild(languageItem);
    }

    addHobby() {
        this.addHobbyItem();
    }

    addPhone() {
        this.addPhoneItem();
    }

    addPhoneItem(phoneData = null) {
        const phoneList = document.getElementById('phoneList');
        const phoneItem = document.createElement('div');
        phoneItem.className = 'phone-item';
        phoneItem.innerHTML = `
            <input type="tel" class="phone" placeholder="Enter your phone number" value="${phoneData?.phone || ''}">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
        `;
        
        // Add event listener to the new phone input
        const phoneInput = phoneItem.querySelector('.phone');
        phoneInput.addEventListener('input', () => {
            this.markAsChanged();
            this.updatePreview();
        });
        
        phoneList.appendChild(phoneItem);
    }

    initializePhoneEventListeners() {
        const phoneInputs = document.querySelectorAll('.phone');
        phoneInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });
    }

    addReference() {
        this.addReferenceItem();
    }

    addReferenceItem(referenceData = null) {
        const referencesList = document.getElementById('referencesList');
        const referenceItem = document.createElement('div');
        referenceItem.className = 'reference-item';
        referenceItem.innerHTML = `
            <input type="text" class="reference" placeholder="e.g., References would be furnished on demand." value="${referenceData?.reference || ''}">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
        `;

        // Add event listeners to new inputs
        const inputs = referenceItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });

        referencesList.appendChild(referenceItem);
    }

    addCustomSection() {
        const customSectionsList = document.getElementById('customSectionsList');
        const customSectionItem = document.createElement('div');
        customSectionItem.className = 'custom-section-item';
        customSectionItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row">
                <label>Section Heading:</label>
                <input type="text" class="customSectionHeading" placeholder="e.g., Certifications, Awards, Projects">
            </div>
            <div class="custom-items-wrapper">
                <div class="custom-item">
                    <input type="text" class="customItemValue" placeholder="Enter item">
                    <button type="button" class="remove-custom-item-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
                </div>
            </div>
            <button type="button" class="add-custom-item-btn" onclick="cvBuilder.addCustomItem(this)">➕ Add Item</button>
        `;

        // Add event listeners to new inputs
        const inputs = customSectionItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });
        
        // Add Enter key navigation
        this.addEnterKeyNavigation(inputs);

        customSectionsList.appendChild(customSectionItem);
    }

    addCustomItem(button) {
        const customItemsWrapper = button.previousElementSibling;
        const customItem = document.createElement('div');
        customItem.className = 'custom-item';
        customItem.innerHTML = `
            <input type="text" class="customItemValue" placeholder="Enter item">
            <button type="button" class="remove-custom-item-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
        `;

        // Add event listener to new input
        const input = customItem.querySelector('input');
        input.addEventListener('input', () => {
            this.markAsChanged();
            this.updatePreview();
        });
        
        // Add Enter key navigation
        this.addEnterKeyNavigation([input]);

        customItemsWrapper.appendChild(customItem);
    }

    loadInitialData() {
        console.log('Loading initial data from form fields...');
        
        // Load initial personal info from form
        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const addressInput = document.getElementById('address');
        const summaryInput = document.getElementById('summary');
        
        if (fullNameInput) this.cvData.personalInfo.fullName = fullNameInput.value;
        if (emailInput) this.cvData.personalInfo.email = emailInput.value;
        if (addressInput) this.cvData.personalInfo.address = addressInput.value;
        if (summaryInput) this.cvData.personalInfo.summary = summaryInput.value;
        
        // Load initial phone numbers from the form
        this.cvData.personalInfo.phones = [];
        const initialPhoneItems = document.querySelectorAll('.phone-item');
        initialPhoneItems.forEach((item, index) => {
            const phoneInput = item.querySelector('.phone');
            if (phoneInput && phoneInput.value) {
                this.cvData.personalInfo.phones.push({ phone: phoneInput.value.trim() });
                console.log(`Loaded initial phone ${index + 1}:`, phoneInput.value);
            }
        });
        console.log('Initial phones loaded:', this.cvData.personalInfo.phones);
        
        console.log('Initial personal info loaded:', this.cvData.personalInfo);
        
        // Load initial skills from the form
        const initialSkillItems = document.querySelectorAll('.skill-item');
        this.cvData.skills = [];
        
        initialSkillItems.forEach((item, index) => {
            const skillInput = item.querySelector('.skill');
            if (skillInput && skillInput.value) {
                this.cvData.skills.push({ skill: skillInput.value.trim() });
                console.log(`Loaded initial skill ${index + 1}:`, skillInput.value);
            }
        });
        
        console.log('Initial skills loaded:', this.cvData.skills);
        
        // Load initial certifications from the form
        const initialCertificationItems = document.querySelectorAll('.certification-item');
        this.cvData.certifications = [];
        
        initialCertificationItems.forEach((item, index) => {
            const certificationInput = item.querySelector('.certification');
            if (certificationInput && certificationInput.value) {
                this.cvData.certifications.push({ certification: certificationInput.value.trim() });
                console.log(`Loaded initial certification ${index + 1}:`, certificationInput.value);
            }
        });
        
        console.log('Initial certifications loaded:', this.cvData.certifications);
        
        // Load initial languages from the form
        const initialLanguageItems = document.querySelectorAll('.language-item');
        this.cvData.languages = [];
        
        initialLanguageItems.forEach((item, index) => {
            const languageInput = item.querySelector('.language');
            const levelInput = item.querySelector('.languageLevel');
            if (languageInput && languageInput.value) {
                this.cvData.languages.push({ 
                    language: languageInput.value.trim(),
                    level: levelInput ? levelInput.value.trim() : ''
                });
                console.log(`Loaded initial language ${index + 1}:`, languageInput.value, 'Level:', levelInput ? levelInput.value : '');
            }
        });
        
        console.log('Initial languages loaded:', this.cvData.languages);

        // Load initial hobbies from form
        const initialHobbyItems = document.querySelectorAll('.hobby-item');
        this.cvData.hobbies = [];
        
        initialHobbyItems.forEach((item, index) => {
            const hobbyInput = item.querySelector('.hobby');
            if (hobbyInput && hobbyInput.value) {
                this.cvData.hobbies.push({ hobby: hobbyInput.value.trim() });
                console.log(`Loaded initial hobby ${index + 1}:`, hobbyInput.value);
            }
        });
        
        console.log('Initial hobbies loaded:', this.cvData.hobbies);

        // Load initial custom sections from form
        const initialCustomSectionItems = document.querySelectorAll('.custom-section-item');
        this.cvData.customSections = [];
        
        initialCustomSectionItems.forEach((sectionItem, sectionIndex) => {
            const heading = sectionItem.querySelector('.customSectionHeading')?.value || '';
            const items = [];
            
            const itemInputs = sectionItem.querySelectorAll('.customItemValue');
            itemInputs.forEach((itemInput, itemIndex) => {
                const itemValue = itemInput.value || '';
                if (itemValue.trim()) {
                    items.push({ value: itemValue.trim() });
                }
            });
            
            if (heading.trim() || items.length > 0) {
                this.cvData.customSections.push({
                    heading: heading.trim(),
                    items: items
                });
                console.log(`Loaded initial custom section ${sectionIndex + 1}:`, { heading, items: items.length });
            }
        });
        
        console.log('Initial custom sections loaded:', this.cvData.customSections);
    }

    addOtherInfo() {
        const otherInfoList = document.getElementById('otherInfoList');
        const otherInfoItem = document.createElement('div');
        otherInfoItem.className = 'other-info-item';
        otherInfoItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row">
                <label>Field Name:</label>
                <input type="text" class="fieldName" placeholder="e.g., Nationality, Blood Group, etc.">
            </div>
            <div class="form-row">
                <label>Field Value:</label>
                <input type="text" class="fieldValue" placeholder="Enter value">
            </div>
        `;

        // Add event listeners to new inputs
        const inputs = otherInfoItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
            input.addEventListener('change', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });

        otherInfoList.appendChild(otherInfoItem);
    }

    collectFormData() {
        
        // Collect personal info
        const fullNameElement = document.getElementById('fullName');
        const emailElement = document.getElementById('email');
        const addressElement = document.getElementById('address');
        const summaryElement = document.getElementById('summary');
        
        console.log('Form elements found:', {
            fullName: !!fullNameElement,
            email: !!emailElement,
            address: !!addressElement,
            summary: !!summaryElement
        });
        
        this.cvData.personalInfo.fullName = fullNameElement ? fullNameElement.value : '';
        this.cvData.personalInfo.email = emailElement ? emailElement.value : '';
        this.cvData.personalInfo.address = addressElement ? addressElement.value : '';
        this.cvData.personalInfo.summary = summaryElement ? summaryElement.value : '';
        
        // Collect phone numbers
        this.cvData.personalInfo.phones = [];
        const phoneItems = document.querySelectorAll('.phone-item');
        console.log('Found phone items:', phoneItems.length);
        phoneItems.forEach((item, index) => {
            const phoneInput = item.querySelector('.phone');
            const phone = phoneInput ? phoneInput.value.trim() : '';
            console.log(`Phone ${index + 1}:`, phone);
            
            if (phone) {
                this.cvData.personalInfo.phones.push({ phone: phone });
            }
        });
        console.log('Collected phones:', this.cvData.personalInfo.phones);
        
        console.log('Collected form data:', this.cvData.personalInfo);

        // Collect education data
        this.cvData.education = [];
        const educationItems = document.querySelectorAll('.education-item');
        console.log('=== EDUCATION DATA COLLECTION DEBUG ===');
        console.log('Found education items:', educationItems.length);
        console.log('Education items:', educationItems);
        
        educationItems.forEach((item, index) => {
            console.log(`Processing education item ${index + 1}:`, item);
            
            const degreeInput = item.querySelector('.degree');
            const institutionInput = item.querySelector('.institution');
            const yearInput = item.querySelector('.year');
            const gradeInput = item.querySelector('.grade');
            
            console.log(`Education item ${index + 1} inputs:`, {
                degreeInput: degreeInput,
                institutionInput: institutionInput,
                yearInput: yearInput,
                gradeInput: gradeInput
            });
            
            const degree = degreeInput?.value || '';
            const institution = institutionInput?.value || '';
            const year = yearInput?.value || '';
            const grade = gradeInput?.value || '';
            
            console.log(`Education item ${index + 1} values:`, { degree, institution, year, grade });
            
            if (degree || institution || year || grade) {
                const educationData = { degree, institution, year, grade };
                this.cvData.education.push(educationData);
                console.log(`Education item ${index + 1} added to cvData:`, educationData);
            } else {
                console.log(`Education item ${index + 1} skipped (no data)`);
            }
        });
        
        console.log('Final education array:', this.cvData.education);
        console.log('=== END EDUCATION DATA COLLECTION DEBUG ===');

        // Collect experience data
        this.cvData.experience = [];
        const experienceItems = document.querySelectorAll('.experience-item');
        console.log('Found experience items:', experienceItems.length);
        experienceItems.forEach((item, index) => {
            const jobTitle = item.querySelector('.jobTitle')?.value || '';
            const company = item.querySelector('.company')?.value || '';
            const duration = item.querySelector('.duration')?.value || '';
            const description = item.querySelector('.description')?.value || '';
            
            console.log(`Experience item ${index + 1} data:`, { jobTitle, company, duration, description });
            
            if (jobTitle || company || duration || description) {
                this.cvData.experience.push({ jobTitle, company, duration, description });
            }
        });

        // Collect certifications data
        this.cvData.certifications = [];
        const certificationItems = document.querySelectorAll('.certification-item');
        certificationItems.forEach((item, index) => {
            const certification = item.querySelector('.certification')?.value || '';
            
            if (certification && certification.trim()) {
                this.cvData.certifications.push({ certification: certification.trim() });
            }
        });

        // Collect skills data
        this.cvData.skills = [];
        const skillItems = document.querySelectorAll('.skill-item');
        console.log('Found skill items:', skillItems.length);
        skillItems.forEach((item, index) => {
            const skill = item.querySelector('.skill')?.value || '';
            console.log(`Skill ${index + 1}:`, skill);
            
            if (skill && skill.trim()) {
                this.cvData.skills.push({ skill: skill.trim() });
            }
        });
        
        console.log('Skills collected from form:', this.cvData.skills);
        
        // If no skills found, use default skills
        if (this.cvData.skills.length === 0) {
            console.log('No skills found in form, using default skills');
            this.cvData.skills = [
                { skill: 'Communication Skills' },
                { skill: 'Time Management' },
                { skill: 'Hardworking' },
                { skill: 'Accurate Planning' }
            ];
            console.log('Default skills set:', this.cvData.skills);
        }
        
        console.log('Collected skills:', this.cvData.skills);

        // Collect languages data
        this.cvData.languages = [];
        const languageItems = document.querySelectorAll('.language-item');
        console.log('Found language items:', languageItems.length);
        languageItems.forEach((item, index) => {
            const language = item.querySelector('.language')?.value || '';
            const level = item.querySelector('.languageLevel')?.value || '';
            console.log(`Language ${index + 1}:`, language, 'Level:', level);
            
            if (language && language.trim()) {
                this.cvData.languages.push({ 
                    language: language.trim(),
                    level: level.trim()
                });
            }
        });
        
        // If no languages found, use default languages
        if (this.cvData.languages.length === 0) {
            console.log('No languages found in form, using default languages');
            this.cvData.languages = [
                { language: 'English', level: 'Native' },
                { language: 'Urdu', level: 'Fluent' },
                { language: 'Punjabi', level: 'Conversational' }
            ];
            console.log('Default languages set:', this.cvData.languages);
        }
        
        console.log('Collected languages:', this.cvData.languages);

        // Collect hobbies data
        this.cvData.hobbies = [];
        const hobbyItems = document.querySelectorAll('.hobby-item');
        console.log('Found hobby items:', hobbyItems.length);
        hobbyItems.forEach((item, index) => {
            const hobby = item.querySelector('.hobby')?.value || '';
            console.log(`Hobby ${index + 1}:`, hobby);
            
            if (hobby && hobby.trim()) {
                this.cvData.hobbies.push({ hobby: hobby.trim() });
            }
        });
        
        console.log('Collected hobbies:', this.cvData.hobbies);

        // Collect custom sections data
        this.cvData.customSections = [];
        const customSectionItems = document.querySelectorAll('.custom-section-item');
        customSectionItems.forEach((sectionItem, sectionIndex) => {
            const heading = sectionItem.querySelector('.customSectionHeading')?.value || '';
            const items = [];
            
            const itemInputs = sectionItem.querySelectorAll('.customItemValue');
            itemInputs.forEach((itemInput, itemIndex) => {
                const itemValue = itemInput.value || '';
                if (itemValue.trim()) {
                    items.push({ value: itemValue.trim() });
                }
            });
            
            if (heading.trim() || items.length > 0) {
                this.cvData.customSections.push({
                    heading: heading.trim(),
                    items: items
                });
            }
        });

        // Collect other information data
        this.cvData.otherInfo = [];
        const otherInfoItems = document.querySelectorAll('.other-info-item');
        console.log('Found other info items:', otherInfoItems.length);
        otherInfoItems.forEach((item, index) => {
            const fatherName = item.querySelector('.fatherName')?.value || '';
            const husbandName = item.querySelector('.husbandName')?.value || '';
            const cnic = item.querySelector('.cnic')?.value || '';
            const dateOfBirth = item.querySelector('.dateOfBirth')?.value || '';
            const maritalStatus = item.querySelector('.maritalStatus')?.value || '';
            const religion = item.querySelector('.religion')?.value || '';
            const fieldName = item.querySelector('.fieldName')?.value || '';
            const fieldValue = item.querySelector('.fieldValue')?.value || '';
            
            console.log(`Other info item ${index + 1}:`, { fatherName, husbandName, cnic, dateOfBirth, maritalStatus, religion, fieldName, fieldValue });
            
            // For the first item (standard fields)
            if (fatherName || husbandName || cnic || dateOfBirth || maritalStatus || religion) {
                this.cvData.otherInfo.push({ 
                    fatherName, 
                    husbandName, 
                    cnic, 
                    dateOfBirth, 
                    maritalStatus,
                    religion
                });
            }
            
            // For additional items (custom fields)
            if (fieldName && fieldValue) {
                this.cvData.otherInfo.push({ 
                    fieldName, 
                    fieldValue 
                });
            }
        });
        
        console.log('Collected other info:', this.cvData.otherInfo);
        
        // Collect references data
        this.cvData.references = [];
        const referenceItems = document.querySelectorAll('.reference-item');
        console.log('Found reference items:', referenceItems.length);
        referenceItems.forEach(item => {
            const referenceInput = item.querySelector('.reference');
            if (referenceInput && referenceInput.value.trim()) {
                this.cvData.references.push({
                    reference: referenceInput.value.trim()
                });
            }
        });
        console.log('Collected references:', this.cvData.references);
    }

    updatePreview() {
        this.collectFormData();
        
        // Mark as changed for auto-save
        this.markAsChanged();
        
        // Update personal info
        const previewNameElement = document.getElementById('previewName');
        const previewSummaryElement = document.getElementById('previewSummary');
        
        console.log('Preview elements found:', {
            previewName: !!previewNameElement,
            previewSummary: !!previewSummaryElement
        });
        
        if (previewNameElement) {
            const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
            const fullName = this.cvData.personalInfo.fullName || 'Your Name';
            
            if (selectedTemplate === 'minimalist') {
                // For Template 3, split name into separate lines for each word
                const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
                if (nameParts.length > 0) {
                    const nameLines = nameParts.map(part => `<span class="name-line">${part}</span>`).join('');
                    previewNameElement.innerHTML = nameLines;
                } else {
                    // Empty name, show placeholder
                    previewNameElement.innerHTML = `<span class="name-line">Your Name</span>`;
                }
            } else {
                // For other templates, display full name as before
                previewNameElement.textContent = fullName;
            }
            console.log('Updated preview name to:', fullName);
        } else {
            console.error('previewName element not found!');
        }
        
        if (previewSummaryElement) {
            previewSummaryElement.textContent = this.cvData.personalInfo.summary || 'Your professional summary will appear here...';
            console.log('Updated preview summary to:', previewSummaryElement.textContent);
        } else {
            console.error('previewSummary element not found!');
        }
        
        // Update profile picture
        if (this.cvData.personalInfo.profilePicture) {
            document.getElementById('profileImage').src = this.cvData.personalInfo.profilePicture;
        }
        
        // Update contact info
        this.updateContactInfo();
        
        // Update education
        this.updateEducationPreview();
        
        // Update experience
        this.updateExperiencePreview();
        
        // Update certifications
        this.updateCertificationsPreview();
        
        // Update skills
        this.updateSkillsPreview();
        
        // Update languages
        this.updateLanguagesPreview();
        this.updateHobbiesPreview();
        
        // Update custom sections
        this.updateCustomSectionsPreview();
        
        // Update other information
        this.updateOtherInfoPreview();
        
        // Update references
        this.updateReferencesPreview();
    }

    updateContactInfo() {
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        console.log('Updating contact info:', {
            phones: this.cvData.personalInfo.phones,
            email: this.cvData.personalInfo.email,
            address: this.cvData.personalInfo.address
        });
        
        if (selectedTemplate === 'modern') {
            // Template 2: Dynamically create contact items
            const contactSection = document.getElementById('template2ContactSection');
            if (contactSection) {
                // Clear existing contact items
                contactSection.innerHTML = '';
                
                // Add phone numbers if available
                if (this.cvData.personalInfo.phones && this.cvData.personalInfo.phones.length > 0) {
                    const phoneNumbers = this.cvData.personalInfo.phones.map(p => p.phone).join(', ');
                    const phoneItem = document.createElement('div');
                    phoneItem.className = 'template-2-contact-item phone-contact';
                    phoneItem.innerHTML = `
                        <span class="template-2-contact-icon">📱</span>
                        <span>${phoneNumbers}</span>
                    `;
                    contactSection.appendChild(phoneItem);
                    console.log('Phone added to Template 2:', phoneNumbers);
                }
                
                // Add email if available
                if (this.cvData.personalInfo.email) {
                    const emailItem = document.createElement('div');
                    emailItem.className = 'template-2-contact-item';
                    emailItem.innerHTML = `
                        <span class="template-2-contact-icon">📧</span>
                        <span>${this.cvData.personalInfo.email}</span>
                    `;
                    contactSection.appendChild(emailItem);
                    console.log('Email added to Template 2:', this.cvData.personalInfo.email);
                }
                
                // Add address if available
                if (this.cvData.personalInfo.address) {
                    const addressItem = document.createElement('div');
                    addressItem.className = 'template-2-contact-item';
                    addressItem.innerHTML = `
                        <span class="template-2-contact-icon">📍</span>
                        <span>${this.cvData.personalInfo.address}</span>
                    `;
                    contactSection.appendChild(addressItem);
                    console.log('Address added to Template 2:', this.cvData.personalInfo.address);
                }
            }
        } else if (selectedTemplate === 'minimalist') {
            // Template 3: Dynamically create contact items in header
            const contactInfo = document.getElementById('template3ContactInfo');
            if (contactInfo) {
                // Clear existing contact items
                contactInfo.innerHTML = '';
                
                // Add phone numbers if available
                if (this.cvData.personalInfo.phones && this.cvData.personalInfo.phones.length > 0) {
                    const phoneNumbers = this.cvData.personalInfo.phones.map(p => p.phone).join(', ');
                    const phoneItem = document.createElement('div');
                    phoneItem.className = 'template-3-contact-item';
                    phoneItem.innerHTML = `
                        <span class="icon">📱</span>
                        <span>${phoneNumbers}</span>
                    `;
                    contactInfo.appendChild(phoneItem);
                    console.log('Phone added to Template 3:', phoneNumbers);
                }
                
                // Add email if available
                if (this.cvData.personalInfo.email) {
                    const emailItem = document.createElement('div');
                    emailItem.className = 'template-3-contact-item';
                    emailItem.innerHTML = `
                        <span class="icon">📧</span>
                        <span>${this.cvData.personalInfo.email}</span>
                    `;
                    contactInfo.appendChild(emailItem);
                    console.log('Email added to Template 3:', this.cvData.personalInfo.email);
                }
                
                // Add address if available
                if (this.cvData.personalInfo.address) {
                    const addressItem = document.createElement('div');
                    addressItem.className = 'template-3-contact-item';
                    addressItem.innerHTML = `
                        <span class="icon">📍</span>
                        <span>${this.cvData.personalInfo.address}</span>
                    `;
                    contactInfo.appendChild(addressItem);
                    console.log('Address added to Template 3:', this.cvData.personalInfo.address);
                }
            }
        } else {
            // Template 1: Use existing elements
            const emailElement = document.getElementById('previewEmail');
            const phoneElement = document.getElementById('previewPhone');
            const addressElement = document.getElementById('previewAddress');
            
            console.log('Contact info elements found:', {
                emailElement: !!emailElement,
                phoneElement: !!phoneElement,
                addressElement: !!addressElement
            });
            
            // Clear all elements first
            emailElement.textContent = '';
            phoneElement.textContent = '';
            addressElement.textContent = '';
            
            // Template 1: With icons
            if (this.cvData.personalInfo.phones && this.cvData.personalInfo.phones.length > 0) {
                const phoneNumbers = this.cvData.personalInfo.phones.map(p => p.phone).join(', ');
                phoneElement.textContent = `📱 ${phoneNumbers}`;
                phoneElement.style.display = 'block';
                console.log('Phones displayed (Template 1):', phoneElement.textContent);
            } else {
                phoneElement.style.display = 'none';
            }
        
            if (this.cvData.personalInfo.email) {
                emailElement.textContent = `📧 ${this.cvData.personalInfo.email}`;
                emailElement.style.display = 'block';
                console.log('Email displayed (Template 1):', emailElement.textContent);
            } else {
                emailElement.style.display = 'none';
            }
        
            if (this.cvData.personalInfo.address) {
                addressElement.textContent = `📍 ${this.cvData.personalInfo.address}`;
                addressElement.style.display = 'block';
                console.log('Address displayed (Template 1):', addressElement.textContent);
            } else {
                addressElement.style.display = 'none';
            }
        }
    }

    updateEducationPreview() {
        const educationContainer = document.getElementById('previewEducation');
        educationContainer.innerHTML = '';
        
        if (this.cvData.education.length === 0) {
            educationContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">Add your educational background to showcase your qualifications</p>';
            return;
        }
        
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        this.cvData.education.forEach(edu => {
            const educationItem = document.createElement('div');
            
            // Only show elements that have content, with empty placeholders
            const degree = edu.degree || '';
            const institution = edu.institution || '';
            const year = edu.year || '';
            const grade = edu.grade || '';
            
            if (selectedTemplate === 'minimalist') {
                // Template 3: Use specific styling with new layout
                educationItem.className = 'template-3-education-item';
                
                let htmlContent = '';
                
                // First row: Degree on left, Year on right
                if (degree || year) {
                    htmlContent += `<div class="template-3-education-row1">`;
                    if (degree) {
                        htmlContent += `<div class="template-3-degree">${degree}</div>`;
                    }
                    if (year) {
                        htmlContent += `<div class="template-3-dates">${year}</div>`;
                    }
                    htmlContent += `</div>`;
                }
                
                // Second row: Institution and Grade
                if (institution || grade) {
                    htmlContent += `<div class="template-3-education-row2">`;
                    if (institution) {
                        htmlContent += `<div class="template-3-school">${institution}</div>`;
                    }
                    if (grade) {
                        htmlContent += `<div class="template-3-description">${grade}</div>`;
                    }
                    htmlContent += `</div>`;
                }
                
                educationItem.innerHTML = htmlContent;
            } else {
                // Template 1 & 2: Use original styling
                educationItem.className = 'education-preview-item';
                
                // Build the HTML dynamically based on what content exists
                let htmlContent = '';
                
                if (degree) {
                    htmlContent += `<div class="degree">${degree}</div>`;
                }
                
                if (institution) {
                    if (htmlContent) htmlContent += '<span style="color: #059669;">•</span>';
                    htmlContent += `<div class="institution">${institution}</div>`;
                }
                
                if (year) {
                    if (htmlContent) htmlContent += '<span style="color: #059669;">•</span>';
                    htmlContent += `<div class="year">${year}</div>`;
                }
                
                if (grade) {
                    if (htmlContent) htmlContent += '<span style="color: #059669;">•</span>';
                    htmlContent += `<div class="grade">${grade}</div>`;
                }
                
                educationItem.innerHTML = htmlContent;
            }
            
            // Only show the item if there's at least some content
            if (educationItem.innerHTML.trim()) {
                educationContainer.appendChild(educationItem);
            }
        });
    }

    updateExperiencePreview() {
        const experienceContainer = document.getElementById('previewExperience');
        experienceContainer.innerHTML = '';
        
        if (this.cvData.experience.length === 0) {
            experienceContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">Add your work experience to showcase your professional background</p>';
            return;
        }
        
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        this.cvData.experience.forEach(exp => {
            const experienceItem = document.createElement('div');
            
            // Only show elements that have content
            const jobTitle = exp.jobTitle || '';
            const company = exp.company || '';
            const duration = exp.duration || '';
            const description = exp.description || '';
            
            if (selectedTemplate === 'minimalist') {
                // Template 3: Use specific styling
                experienceItem.className = 'template-3-experience-item';
                
                let htmlContent = '';
                
                // First row: Job title and duration
                if (jobTitle || duration) {
                    htmlContent += '<div class="template-3-experience-row1">';
                    if (jobTitle) {
                        htmlContent += `<div class="template-3-job-title">${jobTitle}</div>`;
                    }
                    if (duration) {
                        htmlContent += `<div class="template-3-dates">${duration}</div>`;
                    }
                    htmlContent += '</div>';
                }
                
                // Second row: Company and description
                if (company || description) {
                    htmlContent += '<div class="template-3-experience-row2">';
                    if (company) {
                        htmlContent += `<div class="template-3-company">${company}</div>`;
                    }
                if (description) {
                    // Convert line breaks to bullet points
                    const bulletPoints = description.split('\n')
                        .filter(line => line.trim())
                        .map(line => `<li>${line.trim()}</li>`)
                        .join('');
                    htmlContent += `<div class="template-3-description"><ul style="margin: 0; padding-left: 20px;">${bulletPoints}</ul></div>`;
                }
                    htmlContent += '</div>';
                }
                
                experienceItem.innerHTML = htmlContent;
            } else {
                // Template 1 & 2: Use original styling
                experienceItem.className = 'experience-preview-item';
                
                // Build the HTML dynamically based on what content exists
                let htmlContent = '';
                
                // Create header row with job title and duration on same line
                if (jobTitle || duration) {
                    htmlContent += '<div style="display: flex; align-items: center; margin-bottom: 4px;">';
                    if (jobTitle) {
                        htmlContent += `<div class="job-title">${jobTitle}</div>`;
                    }
                    if (duration) {
                        htmlContent += `<div class="duration">${duration}</div>`;
                    }
                    htmlContent += '</div>';
                }
                
                if (company) {
                    htmlContent += `<div class="company">${company}</div>`;
                }
                
                if (description) {
                    // Convert line breaks to bullet points
                    const bulletPoints = description.split('\n')
                        .filter(line => line.trim())
                        .map(line => `<li>${line.trim()}</li>`)
                        .join('');
                    htmlContent += `<div class="description"><ul style="margin: 0; padding-left: 20px;">${bulletPoints}</ul></div>`;
                }
                
                experienceItem.innerHTML = htmlContent;
            }
            
            // Only show the item if there's at least some content
            if (experienceItem.innerHTML.trim()) {
                experienceContainer.appendChild(experienceItem);
            }
        });
    }

    updateCertificationsPreview() {
        const certificationsContainer = document.getElementById('previewCertifications');
        
        if (!certificationsContainer) {
            return;
        }
        
        certificationsContainer.innerHTML = '';
        
        // Check if there are any certifications with actual content
        const hasCertifications = this.cvData.certifications.some(cert => 
            cert.certification && cert.certification.trim() !== ''
        );
        
        // Check template type
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        // Get the correct section selector based on template
        let certificationsSection;
        if (selectedTemplate === 'minimalist') {
            // Template 3 uses .template-3-card with id certifications-section
            certificationsSection = document.querySelector('.template-3-card#certifications-section');
        } else {
            // Template 1 & 2 use .cv-section with id certifications-section
            certificationsSection = document.querySelector('.cv-section#certifications-section');
        }
        
        if (!hasCertifications) {
            // Hide the section if no certifications
            if (certificationsSection) {
                certificationsSection.style.display = 'none';
                this.hiddenSections.add('certifications');
            }
            return;
        } else {
            // Show the section if there are certifications
            if (certificationsSection) {
                certificationsSection.style.display = 'block';
                this.hiddenSections.delete('certifications');
            }
        }
        
        // Force show the section in preview regardless of hiddenSections
        if (certificationsSection) {
            certificationsSection.style.display = 'block';
        }
        
        // For Template 2, ensure the section is visible when there are certifications
        if (selectedTemplate === 'modern' && hasCertifications) {
            if (certificationsSection) {
                certificationsSection.style.display = 'block';
            }
        }
        
        if (selectedTemplate === 'minimalist') {
            // Template 3: Create certification items with styling
            this.cvData.certifications.forEach(cert => {
                if (cert.certification && cert.certification.trim()) {
                    const certItem = document.createElement('div');
                    certItem.className = 'template-3-certification-item';
                    
                    const certName = document.createElement('div');
                    certName.className = 'template-3-certification-name';
                    certName.textContent = cert.certification;
                    
                    certItem.appendChild(certName);
                    
                    if (cert.issuer && cert.issuer.trim()) {
                        const certIssuer = document.createElement('div');
                        certIssuer.className = 'template-3-certification-issuer';
                        certIssuer.textContent = cert.issuer;
                        certItem.appendChild(certIssuer);
                    }
                    
                    certificationsContainer.appendChild(certItem);
                }
            });
        } else {
            // Template 1 & 2: Create a simple list for certifications
            const certificationsList = document.createElement('ul');
            certificationsList.style.cssText = 'list-style: none; padding: 0; margin: 0;';
            
            this.cvData.certifications.forEach((cert, index) => {
                if (cert.certification && cert.certification.trim()) {
                    const listItem = document.createElement('li');
                    listItem.style.cssText = 'position: relative; padding: 2px 0 2px 20px; margin-bottom: 0; color: #4a5568; line-height: 1.3; font-size: 14px;';
                    
                    // Add bullet point
                    const bullet = document.createElement('span');
                    bullet.style.cssText = 'position: absolute; left: 0; top: 2px; color: #667eea; font-size: 14px; font-weight: bold;';
                    bullet.textContent = '•';
                    
                    listItem.appendChild(bullet);
                    listItem.appendChild(document.createTextNode(cert.certification));
                    certificationsList.appendChild(listItem);
                }
            });
            
            certificationsContainer.appendChild(certificationsList);
        }
    }

    updateSkillsPreview() {
        const skillsContainer = document.getElementById('previewSkills');
        if (!skillsContainer) {
            console.error('previewSkills container not found!');
            return;
        }
        skillsContainer.innerHTML = '';
        
        if (this.cvData.skills.length === 0) {
            skillsContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">Add your skills to showcase your capabilities</p>';
            return;
        }
        
        // Check if we're using Template 2 (modern)
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        if (selectedTemplate === 'modern') {
            // Template 2: Create simple skill list for print-friendly display
            const skillsList = document.createElement('div');
            skillsList.className = 'template-2-skills-list';
            
            this.cvData.skills.forEach((skill, index) => {
                if (skill.skill && skill.skill.trim()) {
                    const skillItem = document.createElement('div');
                    skillItem.className = 'template-2-skill-item';
                    skillItem.textContent = skill.skill;
                    skillsList.appendChild(skillItem);
                }
            });
            
            skillsContainer.appendChild(skillsList);
        } else if (selectedTemplate === 'minimalist') {
            // Template 3: Create skill grid
            this.cvData.skills.forEach(skill => {
                if (skill.skill && skill.skill.trim()) {
                    const skillItem = document.createElement('div');
                    skillItem.className = 'template-3-skill-item';
                    skillItem.textContent = skill.skill;
                    skillsContainer.appendChild(skillItem);
                }
            });
        } else {
            // Template 1: Create skill tags
        const skillsWrapper = document.createElement('div');
        skillsWrapper.className = 'skills-tags-wrapper';
        
        this.cvData.skills.forEach(skill => {
            if (skill.skill && skill.skill.trim()) {
                const skillTag = document.createElement('span');
                skillTag.className = 'skill-tag';
                skillTag.textContent = skill.skill;
                skillsWrapper.appendChild(skillTag);
            }
        });
        
        skillsContainer.appendChild(skillsWrapper);
        }
    }

    updateLanguagesPreview() {
        const languagesContainer = document.getElementById('previewLanguages');
        if (!languagesContainer) return;
        languagesContainer.innerHTML = '';
        
        if (this.cvData.languages.length === 0) {
            languagesContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">Add your languages to showcase your communication abilities</p>';
            return;
        }
        
        // Check if we're using Template 2 (modern)
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        if (selectedTemplate === 'modern') {
            // Template 2: Create language items like skills for sidebar
            const languagesList = document.createElement('div');
            languagesList.className = 'template-2-skills-list';
            
            this.cvData.languages.forEach(language => {
                if (language.language && language.language.trim()) {
                    const languageItem = document.createElement('div');
                    languageItem.className = 'template-2-skill-item';
                    
                    let displayText = language.language;
                    if (language.level && language.level.trim()) {
                        displayText += ` (${language.level})`;
                    }
                    
                    languageItem.textContent = displayText;
                    languagesList.appendChild(languageItem);
                }
            });
            
            languagesContainer.appendChild(languagesList);
        } else if (selectedTemplate === 'minimalist') {
            // Template 3: Create language items in a single row
            const languagesList = document.createElement('div');
            languagesList.className = 'template-3-languages-list';
            
            this.cvData.languages.forEach(language => {
                if (language.language && language.language.trim()) {
                    const languageItem = document.createElement('div');
                    languageItem.className = 'template-3-language-item';
                    
                    let displayText = language.language;
                    if (language.level && language.level.trim()) {
                        displayText += ` (${language.level})`;
                    }
                    languageItem.textContent = displayText;
                    
                    languagesList.appendChild(languageItem);
                }
            });
            
            languagesContainer.appendChild(languagesList);
        } else {
            // Template 1: Create language tags
            const languagesWrapper = document.createElement('div');
            languagesWrapper.className = 'languages-tags-wrapper';
            
            this.cvData.languages.forEach(language => {
                if (language.language && language.language.trim()) {
                    const languageTag = document.createElement('span');
                    languageTag.className = 'language-tag';
                    
                    let displayText = language.language;
                    if (language.level && language.level.trim()) {
                        displayText += ` (${language.level})`;
                    }
                    languageTag.textContent = displayText;
                    languagesWrapper.appendChild(languageTag);
                }
            });
            
            languagesContainer.appendChild(languagesWrapper);
        }
    }

    updateHobbiesPreview() {
        const hobbiesContainer = document.getElementById('previewHobbies');
        if (!hobbiesContainer) {
            console.error('previewHobbies element not found!');
            return;
        }
        
        try {
            hobbiesContainer.innerHTML = '';
            
            // Check if there are any hobbies with actual content
            const hasHobbies = this.cvData.hobbies.some(hobby => 
                hobby.hobby && hobby.hobby.trim() !== ''
            );
            
            // Check if we're using Template 2 (modern)
            const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
            
            if (selectedTemplate === 'modern') {
                // For Template 2, find the hobbies sidebar section
                const hobbiesSidebarSection = hobbiesContainer.closest('.template-2-sidebar-section');
                
                if (!hasHobbies) {
                    // Hide the entire hobbies sidebar section if no hobbies
                    if (hobbiesSidebarSection) {
                        hobbiesSidebarSection.style.display = 'none';
                        this.hiddenSections.add('hobbies');
                    }
                    return;
                } else {
                    // Show the hobbies sidebar section if there are hobbies
                    if (hobbiesSidebarSection) {
                        hobbiesSidebarSection.style.display = 'block';
                        this.hiddenSections.delete('hobbies');
                    }
                }
                
                // Template 2: Create hobby items like skills for sidebar
                const hobbiesList = document.createElement('div');
                hobbiesList.className = 'template-2-skills-list'; // Use skills list class
                
                this.cvData.hobbies.forEach(hobby => {
                    if (hobby.hobby && hobby.hobby.trim()) {
                        const hobbyItem = document.createElement('div');
                        hobbyItem.className = 'template-2-skill-item'; // Use skill item class
                        hobbyItem.textContent = hobby.hobby; // Remove uppercase
                        hobbiesList.appendChild(hobbyItem);
                    }
                });
                
                hobbiesContainer.appendChild(hobbiesList);
            } else if (selectedTemplate === 'minimalist') {
                // For Template 3, find the hobbies card section
                const hobbiesCardSection = hobbiesContainer.closest('.template-3-card');
                
                if (!hasHobbies) {
                    // Hide the entire hobbies card section if no hobbies
                    if (hobbiesCardSection) {
                        hobbiesCardSection.style.display = 'none';
                        this.hiddenSections.add('hobbies');
                    }
                    return;
                } else {
                    // Show the hobbies card section if there are hobbies
                    if (hobbiesCardSection) {
                        hobbiesCardSection.style.display = 'block';
                        this.hiddenSections.delete('hobbies');
                    }
                }
                
                // Template 3: Create hobby items with styling
                this.cvData.hobbies.forEach(hobby => {
                    if (hobby.hobby && hobby.hobby.trim()) {
                        const hobbyItem = document.createElement('div');
                        hobbyItem.className = 'template-3-hobby-item';
                        hobbyItem.textContent = hobby.hobby;
                        hobbiesContainer.appendChild(hobbyItem);
                    }
                });
            } else {
                // For Template 1, use the original logic
                const hobbiesSection = document.getElementById('hobbies-section');
                
                if (!hasHobbies) {
                    // Hide the section if no hobbies
                    if (hobbiesSection) {
                        hobbiesSection.style.display = 'none';
                        this.hiddenSections.add('hobbies');
                    }
                    return;
                } else {
                    // Show the section if there are hobbies
                    if (hobbiesSection) {
                        hobbiesSection.style.display = 'block';
                        this.hiddenSections.delete('hobbies');
                    }
                }
                
                // Template 1: Create a compact hobbies display with tags
                const hobbiesWrapper = document.createElement('div');
                hobbiesWrapper.className = 'hobbies-tags-wrapper';
                
                this.cvData.hobbies.forEach(hobby => {
                    if (hobby.hobby && hobby.hobby.trim()) {
                        const hobbyTag = document.createElement('span');
                        hobbyTag.className = 'hobby-tag';
                        hobbyTag.textContent = hobby.hobby;
                        hobbiesWrapper.appendChild(hobbyTag);
                    }
                });
                
                hobbiesContainer.appendChild(hobbiesWrapper);
            }
        } catch (error) {
            console.error('Error updating hobbies preview:', error);
        }
    }

    updateCustomSectionsPreview() {
        const customSectionsContainer = document.getElementById('previewCustomSections');
        const customSection = document.getElementById('custom-section');
        if (!customSectionsContainer) {
            console.error('previewCustomSections element not found! This should not happen.');
            console.log('Available elements with "preview" in ID:', 
                Array.from(document.querySelectorAll('[id*="preview"]')).map(el => el.id));
            return;
        }
        
        try {
            customSectionsContainer.innerHTML = '';
            
            // Check if there are any custom sections with actual content
            const hasCustomSections = this.cvData.customSections.some(section => 
                section.heading && section.heading.trim() !== '' && 
                section.items && section.items.length > 0 && 
                section.items.some(item => item.value && item.value.trim() !== '')
            );
            
            if (!hasCustomSections) {
                // Hide the section if no custom sections
                if (customSection) {
                    customSection.style.display = 'none';
                    this.hiddenSections.add('custom');
                }
                return;
            } else {
                // Show the section if there are custom sections
                if (customSection) {
                    customSection.style.display = 'block';
                    this.hiddenSections.delete('custom');
                }
            }
            
            const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
            
            // Create custom sections display
            this.cvData.customSections.forEach(section => {
                if (section.heading && section.items && section.items.length > 0) {
                    const sectionDiv = document.createElement('div');
                    
                    if (selectedTemplate === 'minimalist') {
                        // Template 3: Use card design
                        sectionDiv.className = 'template-3-card';
                        sectionDiv.innerHTML = `
                            <div class="template-3-card-header">
                                <span class="template-3-card-icon">✨</span>
                                <h3>${section.heading}</h3>
                            </div>
                            <div class="template-3-card-content">
                                <div class="template-3-custom-items-list">
                                    ${section.items.map(item => 
                                        item.value && item.value.trim() ? 
                                        `<div class="template-3-custom-item">${item.value}</div>` : ''
                                    ).join('')}
                                </div>
                            </div>
                        `;
                    } else {
                        // Template 1 & 2: Use original design
                        sectionDiv.className = 'custom-section-preview';
                        
                        const headingDiv = document.createElement('div');
                        headingDiv.className = 'custom-section-heading';
                        headingDiv.innerHTML = `✨ ${section.heading}`;
                        
                        const itemsList = document.createElement('ul');
                        itemsList.className = 'custom-items-list';
                        
                        section.items.forEach(item => {
                            if (item.value && item.value.trim()) {
                                const listItem = document.createElement('li');
                                listItem.textContent = item.value;
                                itemsList.appendChild(listItem);
                            }
                        });
                        
                        sectionDiv.appendChild(headingDiv);
                        sectionDiv.appendChild(itemsList);
                    }
                    
                    customSectionsContainer.appendChild(sectionDiv);
                }
            });
        } catch (error) {
            console.error('Error updating custom sections preview:', error);
        }
    }

    removeSection(sectionName) {
        let sectionElement = document.getElementById(`${sectionName}-section`);
        
        if (sectionElement) {
            // Hide the section
            sectionElement.style.display = 'none';
            this.hiddenSections.add(sectionName);
            
            // Show confirmation message
            this.showSectionRemovedMessage(sectionName);
            
            // Mark as changed for auto-save
            this.markAsChanged();
            
            console.log(`Section ${sectionName} removed from preview`);
        }
    }




    showSectionRemovedMessage(sectionName) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = `Section removed from preview`;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    updateOtherInfoPreview() {
        const otherInfoContainer = document.getElementById('previewOtherInfo');
        if (!otherInfoContainer) {
            return;
        }
        otherInfoContainer.innerHTML = '';
        
        // Check if we're using Template 2 (modern)
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        if (selectedTemplate === 'modern') {
            // For Template 2, find the other info sidebar section
            const otherInfoSidebarSection = otherInfoContainer.closest('.template-2-sidebar-section');
            
            // Check if there are any other info items with actual content
            const hasOtherInfo = this.cvData.otherInfo.some(info => 
                (info.fatherName && info.fatherName.trim()) ||
                (info.husbandName && info.husbandName.trim()) ||
                (info.cnic && info.cnic.trim()) ||
                (info.dateOfBirth && info.dateOfBirth.trim()) ||
                (info.maritalStatus && info.maritalStatus.trim()) ||
                (info.religion && info.religion.trim()) ||
                (info.fieldName && info.fieldValue && info.fieldName.trim() && info.fieldValue.trim())
            );
            
            if (!hasOtherInfo) {
                // Hide the entire other info sidebar section if no data
                if (otherInfoSidebarSection) {
                    otherInfoSidebarSection.style.display = 'none';
                    this.hiddenSections.add('otherInfo');
                }
                return;
            } else {
                // Show the other info sidebar section if there is data
                if (otherInfoSidebarSection) {
                    otherInfoSidebarSection.style.display = 'block';
                    this.hiddenSections.delete('otherInfo');
                }
            }
            
            // Template 2: Create other info items like skills for sidebar
            const otherInfoList = document.createElement('div');
            otherInfoList.className = 'template-2-skills-list'; // Use skills list class for consistency
            
            this.cvData.otherInfo.forEach(info => {
                if (info.fatherName && info.fatherName.trim()) {
                    const infoItem = document.createElement('div');
                    infoItem.className = 'template-2-skill-item'; // Use skill item class
                    infoItem.textContent = `Father: ${info.fatherName}`;
                    otherInfoList.appendChild(infoItem);
                }
                
                if (info.husbandName && info.husbandName.trim()) {
                    const infoItem = document.createElement('div');
                    infoItem.className = 'template-2-skill-item';
                    infoItem.textContent = `Husband: ${info.husbandName}`;
                    otherInfoList.appendChild(infoItem);
                }
                
                if (info.cnic && info.cnic.trim()) {
                    const infoItem = document.createElement('div');
                    infoItem.className = 'template-2-skill-item';
                    infoItem.textContent = `CNIC: ${info.cnic}`;
                    otherInfoList.appendChild(infoItem);
                }
                
                if (info.dateOfBirth && info.dateOfBirth.trim()) {
                    const infoItem = document.createElement('div');
                    infoItem.className = 'template-2-skill-item';
                    infoItem.textContent = `DOB: ${info.dateOfBirth}`;
                    otherInfoList.appendChild(infoItem);
                }
                
                if (info.maritalStatus && info.maritalStatus.trim()) {
                    const infoItem = document.createElement('div');
                    infoItem.className = 'template-2-skill-item';
                    infoItem.textContent = `Status: ${info.maritalStatus}`;
                    otherInfoList.appendChild(infoItem);
                }
                
                if (info.religion && info.religion.trim()) {
                    const infoItem = document.createElement('div');
                    infoItem.className = 'template-2-skill-item';
                    infoItem.textContent = `Religion: ${info.religion}`;
                    otherInfoList.appendChild(infoItem);
                }
                
                if (info.fieldName && info.fieldValue && info.fieldName.trim() && info.fieldValue.trim()) {
                    const infoItem = document.createElement('div');
                    infoItem.className = 'template-2-skill-item';
                    infoItem.textContent = `${info.fieldName}: ${info.fieldValue}`;
                    otherInfoList.appendChild(infoItem);
                }
            });
            
            otherInfoContainer.appendChild(otherInfoList);
        } else {
            // For other templates, use the original logic
            if (this.cvData.otherInfo.length === 0) {
                otherInfoContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">Add additional information to complete your CV</p>';
                return;
            }
            
            // Create a compact display for other information
            const infoWrapper = document.createElement('div');
            infoWrapper.className = 'other-info-wrapper';
            
            this.cvData.otherInfo.forEach(info => {
                if (info.fatherName || info.husbandName || info.cnic || info.dateOfBirth || info.maritalStatus || info.religion) {
                    // Standard fields
                    if (info.fatherName) {
                        const infoItem = document.createElement('div');
                        infoItem.className = 'other-info-item-preview';
                        infoItem.innerHTML = `<strong>Father's Name:</strong> ${info.fatherName}`;
                        infoWrapper.appendChild(infoItem);
                    }
                    
                    if (info.husbandName) {
                        const infoItem = document.createElement('div');
                        infoItem.className = 'other-info-item-preview';
                        infoItem.innerHTML = `<strong>Husband's Name:</strong> ${info.husbandName}`;
                        infoWrapper.appendChild(infoItem);
                    }
                    
                    if (info.cnic) {
                        const infoItem = document.createElement('div');
                        infoItem.className = 'other-info-item-preview';
                        infoItem.innerHTML = `<strong>CNIC:</strong> ${info.cnic}`;
                        infoWrapper.appendChild(infoItem);
                    }
                    
                    if (info.dateOfBirth) {
                        const infoItem = document.createElement('div');
                        infoItem.className = 'other-info-item-preview';
                        infoItem.innerHTML = `<strong>Date of Birth:</strong> ${info.dateOfBirth}`;
                        infoWrapper.appendChild(infoItem);
                    }
                    
                    if (info.maritalStatus) {
                        const infoItem = document.createElement('div');
                        infoItem.className = 'other-info-item-preview';
                        infoItem.innerHTML = `<strong>Marital Status:</strong> ${info.maritalStatus}`;
                        infoWrapper.appendChild(infoItem);
                    }
                    
                    if (info.religion) {
                        const infoItem = document.createElement('div');
                        infoItem.className = 'other-info-item-preview';
                        infoItem.innerHTML = `<strong>Religion:</strong> ${info.religion}`;
                        infoWrapper.appendChild(infoItem);
                    }
                } else if (info.fieldName && info.fieldValue) {
                    // Custom fields
                    const infoItem = document.createElement('div');
                    infoItem.className = 'other-info-item-preview';
                    infoItem.innerHTML = `<strong>${info.fieldName}:</strong> ${info.fieldValue}`;
                    infoWrapper.appendChild(infoItem);
                }
            });
            
            otherInfoContainer.appendChild(infoWrapper);
        }
    }

    updateReferencesPreview() {
        const referencesContainer = document.getElementById('previewReferences');
        if (!referencesContainer) return;
        
        referencesContainer.innerHTML = '';
        
        // Check if we're using Template 2 (modern)
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        if (selectedTemplate === 'modern') {
            // For Template 2, find the references main section
            const referencesMainSection = referencesContainer.closest('.template-2-main-section');
            
            // Check if there are any references with actual content
            const hasReferences = this.cvData.references && this.cvData.references.length > 0 && 
                this.cvData.references.some(ref => ref.reference && ref.reference.trim());
            
            if (!hasReferences) {
                // Hide the entire references main section if no data
                if (referencesMainSection) {
                    referencesMainSection.style.display = 'none';
                    this.hiddenSections.add('references');
                }
                return;
            } else {
                // Show the references main section if there is data
                if (referencesMainSection) {
                    referencesMainSection.style.display = 'block';
                    this.hiddenSections.delete('references');
                }
            }
            
            // Template 2: Create references list for main content
            const referencesList = document.createElement('ul');
            referencesList.className = 'template-2-achievements';
            referencesList.style.margin = '0';
            referencesList.style.paddingLeft = '12px';
            
            this.cvData.references.forEach(ref => {
                if (ref.reference && ref.reference.trim()) {
                    const listItem = document.createElement('li');
                    listItem.textContent = ref.reference;
                    listItem.style.fontSize = '0.75rem';
                    listItem.style.color = '#333';
                    listItem.style.marginBottom = '3px';
                    listItem.style.lineHeight = '1.5';
                    referencesList.appendChild(listItem);
                }
            });
            
            referencesContainer.appendChild(referencesList);
        } else {
            // For other templates, use the original logic
            if (this.cvData.references && this.cvData.references.length > 0) {
                const referencesList = document.createElement('ul');
                referencesList.style.margin = '0';
                referencesList.style.paddingLeft = '20px';
                referencesList.style.color = '#374151';
                referencesList.style.fontSize = '14px';
                referencesList.style.lineHeight = '1.5';
                
                this.cvData.references.forEach(ref => {
                    if (ref.reference && ref.reference.trim()) {
                        const listItem = document.createElement('li');
                        listItem.textContent = ref.reference;
                        listItem.style.marginBottom = '0px';
                        referencesList.appendChild(listItem);
                    }
                });
                
                referencesContainer.appendChild(referencesList);
            }
        }
    }

    async downloadCV() {
        try {
            // Show loading state
            const downloadBtn = document.getElementById('downloadCV');
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '⏳ Generating PDF...';
            downloadBtn.disabled = true;

            // Generate multi-page PDF
            await this.generateMultiPagePDF();

            // Track download if user is a shopkeeper
            await this.trackDownload('pdf');

            // Reset button
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;

        } catch (error) {
            console.error('Error generating PDF:', error);
            
            // Try fallback method - create text-based PDF
            try {
                console.log('Attempting fallback PDF generation...');
                await this.generateFallbackPDF();
                
                // Reset button
                const downloadBtn = document.getElementById('downloadCV');
                downloadBtn.innerHTML = '📄 Download CV as PDF';
                downloadBtn.disabled = false;
                
                this.showDownloadSuccess(50); // Approximate size for fallback
                
            } catch (fallbackError) {
                console.error('Fallback PDF generation also failed:', fallbackError);
                
                // Reset button on error
                const downloadBtn = document.getElementById('downloadCV');
                downloadBtn.innerHTML = '📄 Download CV as PDF';
                downloadBtn.disabled = false;
                
                alert('Error generating PDF. Please try again or check your browser compatibility.');
            }
        }
    }

    async generateMultiPagePDF() {
        try {
            // Get the preview element
            const previewElement = document.getElementById('cvPreview');
            const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
            
            // Create a temporary container with the exact preview content
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '800px';
            tempContainer.style.backgroundColor = 'white';
            tempContainer.style.padding = '0';
            tempContainer.style.fontFamily = 'Arial, sans-serif';
            tempContainer.style.fontSize = '14px';
            tempContainer.style.lineHeight = '1.4';
            tempContainer.style.color = '#333';
            tempContainer.style.visibility = 'visible';
            tempContainer.style.opacity = '1';
            tempContainer.style.maxWidth = '800px';
            tempContainer.style.margin = '0 auto';
            
            // Clone the preview content
            const clonedPreview = previewElement.cloneNode(true);
            
            // Apply inline styles to match the preview exactly
            this.applyInlineStyles(clonedPreview);
            
            tempContainer.appendChild(clonedPreview);
            document.body.appendChild(tempContainer);

            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 100));

            // Calculate page dimensions
            const pageWidth = 800; // A4 width in pixels at 96 DPI
            const pageHeight = 1123; // A4 height in pixels at 96 DPI
            const margin = 0; // No margin for Template 2 to preserve design

            // For Template 2, we need to handle the two-column layout differently
            if (selectedTemplate === 'modern') {
                await this.generateTemplate2PDF(tempContainer, pageWidth, pageHeight);
            } else {
                // For other templates, use the regular multi-page approach
                const pages = await this.splitContentIntoPages(tempContainer, pageWidth, pageHeight, 20);
                await this.generateRegularPDF(pages, pageWidth, pageHeight);
            }

            // Clean up
            document.body.removeChild(tempContainer);

        } catch (error) {
            console.error('Error generating multi-page PDF:', error);
            throw error;
        }
    }

    async generateTemplate2PDF(container, pageWidth, pageHeight) {
        try {
            // Get the template-2-container
            const template2Container = container.querySelector('.template-2-container');
            if (!template2Container) {
                throw new Error('Template 2 container not found');
            }

            // Apply Template 2 specific styles for PDF
            this.applyTemplate2PDFStyles(template2Container);

            // Generate canvas for the entire Template 2 layout
            const canvas = await html2canvas(template2Container, {
                scale: 2.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: pageWidth,
                height: template2Container.scrollHeight,
                logging: false,
                allowTaint: true,
                foreignObjectRendering: false,
                removeContainer: false,
                imageTimeout: 15000
            });

            // Create PDF
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // Calculate dimensions
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            // Check if content fits on one page
            if (imgHeight * ratio <= pdfHeight) {
                // Single page - add image directly
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, 'FAST');
            } else {
                // Multi-page - split the content
                await this.splitTemplate2IntoPages(template2Container, pdf, pageWidth, pageHeight);
            }

            // Set PDF properties
            pdf.setProperties({
                title: `CV - ${this.cvData.personalInfo.fullName || 'Resume'}`,
                subject: 'Curriculum Vitae',
                author: this.cvData.personalInfo.fullName || 'CV Builder',
                creator: 'CV Builder App',
                producer: 'CV Builder App'
            });

            // Generate filename
            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = `CV_${this.cvData.personalInfo.fullName?.replace(/\s+/g, '_') || 'Resume'}_${timestamp}.pdf`;
            
            // Download PDF
            pdf.save(fileName);

            // Log success
            const pdfOutput = pdf.output('datauristring');
            const fileSizeKB = Math.round(pdfOutput.length * 0.75 / 1024);
            console.log(`Template 2 PDF generated successfully - File size: ~${fileSizeKB} KB`);
            
            // Show success message
            this.showDownloadSuccess(fileSizeKB, 'Template 2');

        } catch (error) {
            console.error('Error generating Template 2 PDF:', error);
            throw error;
        }
    }

    applyTemplate2PDFStyles(container) {
        // Ensure Template 2 styles are properly applied for PDF
        container.style.width = '800px';
        container.style.minHeight = '100vh';
        container.style.display = 'flex';
        container.style.fontFamily = 'Arial, sans-serif';
        
        // Style the sidebar
        const sidebar = container.querySelector('.template-2-sidebar');
        if (sidebar) {
            sidebar.style.width = '35%';
            sidebar.style.background = 'linear-gradient(135deg, #D2B48C 0%, #DEB887 50%, #D2B48C 100%)';
            sidebar.style.color = 'black';
            sidebar.style.padding = '0';
            sidebar.style.display = 'flex';
            sidebar.style.flexDirection = 'column';
        }
        
        // Style the main content
        const mainContent = container.querySelector('.template-2-main-content');
        if (mainContent) {
            mainContent.style.width = '65%';
            mainContent.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
            mainContent.style.color = '#333';
            mainContent.style.padding = '0';
        }
        
        // Apply styles to all elements
        this.applyPDFStyles(container);
    }

    async splitTemplate2IntoPages(container, pdf, pageWidth, pageHeight) {
        // For Template 2, we'll create pages that maintain the two-column layout
        const sidebar = container.querySelector('.template-2-sidebar');
        const mainContent = container.querySelector('.template-2-main-content');
        
        if (!sidebar || !mainContent) {
            throw new Error('Template 2 sidebar or main content not found');
        }

        // Create a page with the full layout
        const pageContainer = document.createElement('div');
        pageContainer.style.width = '800px';
        pageContainer.style.height = '1123px';
        pageContainer.style.display = 'flex';
        pageContainer.style.fontFamily = 'Arial, sans-serif';
        pageContainer.style.position = 'relative';
        pageContainer.style.overflow = 'hidden';
        
        // Clone sidebar and main content
        const clonedSidebar = sidebar.cloneNode(true);
        const clonedMainContent = mainContent.cloneNode(true);
        
        // Apply styles
        clonedSidebar.style.width = '35%';
        clonedSidebar.style.height = '100%';
        clonedMainContent.style.width = '65%';
        clonedMainContent.style.height = '100%';
        
        pageContainer.appendChild(clonedSidebar);
        pageContainer.appendChild(clonedMainContent);
        
        document.body.appendChild(pageContainer);
        
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Generate canvas
        const canvas = await html2canvas(pageContainer, {
            scale: 2.5,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 800,
            height: 1123,
            logging: false,
            allowTaint: true,
            foreignObjectRendering: false,
            removeContainer: false,
            imageTimeout: 15000
        });
        
        // Clean up
        document.body.removeChild(pageContainer);
        
        // Add to PDF
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, 'FAST');
    }

    async generateRegularPDF(pages, pageWidth, pageHeight) {
        // Create PDF
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        // Add each page to PDF
        for (let i = 0; i < pages.length; i++) {
            if (i > 0) {
                pdf.addPage();
            }

            const pageCanvas = await html2canvas(pages[i], {
                scale: 2.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: pageWidth,
                height: pageHeight,
                logging: false,
                allowTaint: true,
                foreignObjectRendering: false,
                removeContainer: false,
                imageTimeout: 15000
            });

            // Add image to PDF
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageCanvas.width;
            const imgHeight = pageCanvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            const imgData = pageCanvas.toDataURL('image/jpeg', 1.0);
            pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio, undefined, 'FAST');
        }

        // Set PDF properties
        pdf.setProperties({
            title: `CV - ${this.cvData.personalInfo.fullName || 'Resume'}`,
            subject: 'Curriculum Vitae',
            author: this.cvData.personalInfo.fullName || 'CV Builder',
            creator: 'CV Builder App',
            producer: 'CV Builder App'
        });

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `CV_${this.cvData.personalInfo.fullName?.replace(/\s+/g, '_') || 'Resume'}_${timestamp}.pdf`;
        
        // Download PDF
        pdf.save(fileName);

        // Log success
        const pdfOutput = pdf.output('datauristring');
        const fileSizeKB = Math.round(pdfOutput.length * 0.75 / 1024);
        console.log(`Regular PDF generated successfully - ${pages.length} pages, File size: ~${fileSizeKB} KB`);
        
        // Show success message
        this.showDownloadSuccess(fileSizeKB, 'Multi-page');
    }

    async splitContentIntoPages(container, pageWidth, pageHeight, margin) {
        const pages = [];
        const contentHeight = pageHeight - (margin * 2);
        let currentY = 0;
        let currentPage = null;

        // Get all sections that can be split, preserving order
        const sections = Array.from(container.querySelectorAll('.cv-section, .template-2-main-section, .template-2-sidebar-section, .cv-header, .template-2-container'));
        
        for (const section of sections) {
            // Create a temporary container to measure section height
            const tempSection = section.cloneNode(true);
            tempSection.style.position = 'absolute';
            tempSection.style.left = '-9999px';
            tempSection.style.top = '0';
            tempSection.style.width = `${pageWidth - (margin * 2)}px`;
            tempSection.style.visibility = 'visible';
            tempSection.style.opacity = '1';
            tempSection.style.fontSize = '14px'; // Ensure consistent font size
            tempSection.style.lineHeight = '1.4';
            tempSection.style.fontFamily = 'Arial, sans-serif';
            
            document.body.appendChild(tempSection);
            
            // Wait for rendering
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const sectionHeight = tempSection.offsetHeight;
            document.body.removeChild(tempSection);

            // Check if section fits on current page
            if (currentY + sectionHeight > contentHeight && currentPage) {
                // Section doesn't fit, start new page
                pages.push(currentPage);
                currentPage = this.createPageContainer(pageWidth, pageHeight, margin);
                currentY = 0;
            }

            // Add section to current page
            if (!currentPage) {
                currentPage = this.createPageContainer(pageWidth, pageHeight, margin);
            }

            const clonedSection = section.cloneNode(true);
            clonedSection.style.position = 'relative';
            clonedSection.style.top = `${currentY}px`;
            clonedSection.style.width = '100%';
            clonedSection.style.fontSize = '14px';
            clonedSection.style.lineHeight = '1.4';
            clonedSection.style.fontFamily = 'Arial, sans-serif';
            clonedSection.style.color = '#333';
            
            // Ensure proper styling for headers and sections
            this.applyPDFStyles(clonedSection);
            
            currentPage.appendChild(clonedSection);
            
            currentY += sectionHeight + 15; // Add some spacing between sections
        }

        // Add the last page if it has content
        if (currentPage && currentPage.children.length > 0) {
            pages.push(currentPage);
        }

        return pages;
    }

    createPageContainer(pageWidth, pageHeight, margin) {
        const page = document.createElement('div');
        page.style.width = `${pageWidth}px`;
        page.style.height = `${pageHeight}px`;
        page.style.backgroundColor = 'white';
        page.style.padding = `${margin}px`;
        page.style.fontFamily = 'Arial, sans-serif';
        page.style.fontSize = '14px';
        page.style.lineHeight = '1.4';
        page.style.color = '#333';
        page.style.position = 'relative';
        page.style.overflow = 'hidden';
        return page;
    }

    applyPDFStyles(element) {
        // Apply consistent styling to maintain the clean CV design
        const style = element.style;
        
        // Ensure consistent font family and size
        style.fontFamily = 'Arial, sans-serif';
        style.fontSize = '14px';
        style.lineHeight = '1.4';
        style.color = '#333';
        
        // Style section headers
        const headers = element.querySelectorAll('h1, h2, h3, .section-title, .cv-section h3');
        headers.forEach(header => {
            header.style.fontWeight = 'bold';
            header.style.fontSize = '16px';
            header.style.textTransform = 'uppercase';
            header.style.marginBottom = '8px';
            header.style.marginTop = '15px';
            header.style.color = '#000';
        });
        
        // Style contact information
        const contactInfo = element.querySelectorAll('.contact-info, .personal-info');
        contactInfo.forEach(contact => {
            contact.style.fontSize = '12px';
            contact.style.lineHeight = '1.3';
            contact.style.marginBottom = '10px';
        });
        
        // Style job titles and company names
        const jobTitles = element.querySelectorAll('.job-title, .jobTitle');
        jobTitles.forEach(title => {
            title.style.fontWeight = 'bold';
            title.style.fontSize = '14px';
            title.style.marginBottom = '2px';
        });
        
        const companies = element.querySelectorAll('.company, .institution');
        companies.forEach(company => {
            company.style.fontSize = '13px';
            company.style.fontWeight = 'normal';
            company.style.marginBottom = '2px';
        });
        
        // Style descriptions and lists
        const descriptions = element.querySelectorAll('.description, p, li');
        descriptions.forEach(desc => {
            desc.style.fontSize = '12px';
            desc.style.lineHeight = '1.4';
            desc.style.marginBottom = '3px';
        });
        
        // Style dates and durations
        const dates = element.querySelectorAll('.duration, .year');
        dates.forEach(date => {
            date.style.fontSize = '12px';
            date.style.fontStyle = 'italic';
            date.style.color = '#666';
        });
        
        // Ensure proper spacing
        const sections = element.querySelectorAll('.cv-section, .experience-item, .education-item');
        sections.forEach(section => {
            section.style.marginBottom = '15px';
            section.style.paddingBottom = '10px';
        });
        
        // Style horizontal lines
        const hrElements = element.querySelectorAll('hr');
        hrElements.forEach(hr => {
            hr.style.border = 'none';
            hr.style.borderTop = '1px solid #000';
            hr.style.margin = '8px 0';
        });
    }

    async trackDownload(downloadType = 'pdf') {
        try {
            // Check if user is authenticated and is a shopkeeper
            if (!AuthSystem || !AuthSystem.isAuthenticated()) {
                console.log('User not authenticated, skipping download tracking');
                return;
            }

            const currentUser = AuthSystem.getCurrentUser();
            if (!currentUser || currentUser.role !== 'shopkeeper') {
                console.log('User is not a shopkeeper, skipping download tracking');
                return;
            }

            // Get current CV ID
            const currentCVId = sessionStorage.getItem('currentCVId');
            if (!currentCVId) {
                console.log('No current CV ID found, skipping download tracking');
                return;
            }

            // Track the download
            if (window.supabaseDatabaseManager) {
                const success = await window.supabaseDatabaseManager.trackCVDownload(
                    currentUser.id,
                    currentCVId,
                    downloadType,
                    fileSizeKB
                );
                
                if (success) {
                    console.log('Download tracked successfully for shopkeeper:', currentUser.name);
                    // Show success message with download count
                    this.showDownloadSuccess(fileSizeKB, quality);
                } else {
                    console.error('Failed to track download');
                    this.showDownloadSuccess(fileSizeKB, quality);
                }
            } else {
                console.warn('Database manager not available for download tracking');
                this.showDownloadSuccess(fileSizeKB, quality);
            }
        } catch (error) {
            console.error('Error tracking download:', error);
        }
    }

    showDownloadSuccess(fileSizeKB, quality = 'Standard') {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'download-success-notification';
        notification.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <div class="success-text">
                    <strong>PDF Downloaded Successfully!</strong>
                    <p>File size: ~${fileSizeKB} KB (${quality} Quality)</p>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }

    async generateFallbackPDF() {
        // Fallback method: Create a simple text-based PDF
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const personalInfo = this.cvData.personalInfo;
        const education = this.cvData.education;
        const experience = this.cvData.experience;
        const skills = this.cvData.skills;
        const languages = this.cvData.languages;
        const otherInfo = this.cvData.otherInfo;

        let yPosition = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;

        // Helper function to add text with word wrap
        const addText = (text, fontSize = 12, isBold = false) => {
            pdf.setFontSize(fontSize);
            if (isBold) {
                pdf.setFont(undefined, 'bold');
            } else {
                pdf.setFont(undefined, 'normal');
            }
            
            const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
            pdf.text(lines, margin, yPosition);
            yPosition += lines.length * (fontSize * 0.4) + 5;
        };

        // Header
        if (personalInfo.fullName) {
            addText(personalInfo.fullName.toUpperCase(), 18, true);
        }
        
        if (personalInfo.email) addText(`Email: ${personalInfo.email}`, 10);
        if (personalInfo.phones && personalInfo.phones.length > 0) {
            const phoneNumbers = personalInfo.phones.map(p => p.phone).join(', ');
            addText(`Phone: ${phoneNumbers}`, 10);
        }
        if (personalInfo.address) addText(`Address: ${personalInfo.address}`, 10);
        
        yPosition += 10;

        // Summary
        if (personalInfo.summary) {
            addText('PROFESSIONAL SUMMARY', 14, true);
            addText(personalInfo.summary, 10);
            yPosition += 5;
        }

        // Education
        if (education.length > 0) {
            addText('EDUCATION', 14, true);
            education.forEach(edu => {
                if (edu.degree) addText(edu.degree, 12, true);
                if (edu.institution) addText(edu.institution, 10);
                if (edu.year) addText(`Year: ${edu.year}`, 10);
                if (edu.grade) addText(edu.grade, 10);
                yPosition += 5;
            });
        }

        // Experience
        if (experience.length > 0) {
            addText('EXPERIENCE', 14, true);
            experience.forEach(exp => {
                if (exp.jobTitle) addText(exp.jobTitle, 12, true);
                if (exp.company) addText(exp.company, 10);
                if (exp.duration) addText(exp.duration, 10);
                if (exp.description) addText(exp.description, 10);
                yPosition += 5;
            });
        }

        // Skills
        if (skills.length > 0) {
            addText('SKILLS', 14, true);
            const skillText = skills.map(skill => skill.skill).join(', ');
            addText(skillText, 10);
            yPosition += 5;
        }

        // Languages
        if (languages.length > 0) {
            addText('LANGUAGES', 14, true);
            const languageText = languages.map(lang => lang.language).join(', ');
            addText(languageText, 10);
            yPosition += 5;
        }

        // Other Information
        if (otherInfo.length > 0) {
            addText('OTHER INFORMATION', 14, true);
            otherInfo.forEach(info => {
                if (info.fieldName && info.fieldValue) {
                    addText(`${info.fieldName}: ${info.fieldValue}`, 10);
                }
            });
        }

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `CV_${personalInfo.fullName?.replace(/\s+/g, '_') || 'Resume'}_${timestamp}.pdf`;
        
        // Download PDF
        pdf.save(fileName);
        
        console.log('Fallback PDF generated successfully');
    }

    applyInlineStyles(element) {
        // First, ensure the element has proper visibility
        element.style.visibility = 'visible';
        element.style.opacity = '1';
        element.style.backgroundColor = 'white';
        element.style.color = '#333';
        
        // Apply all the CSS styles inline to ensure PDF matches preview exactly
        const styles = {
            // CV Header styles
            '.cv-header': {
                display: 'flex',
                gap: '20px',
                marginBottom: '15px',
                paddingBottom: '12px',
                borderBottom: '2px solid #667eea',
                alignItems: 'center'
            },
            '.profile-pic': {
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '3px solid #667eea',
                overflow: 'hidden',
                flexShrink: '0',
                alignSelf: 'center'
            },
            '.profile-pic img': {
                width: '100%',
                height: '100%',
                objectFit: 'cover'
            },
            '.personal-info h1': {
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '8px',
                textTransform: 'uppercase',
                lineHeight: '1.2'
            },
            '.contact-info': {
                display: 'flex',
                flexDirection: 'column',
                gap: '1px'
            },
            '.contact-item': {
                padding: '1px 0',
                background: 'transparent',
                border: 'none',
                color: '#0369a1',
                fontWeight: '500',
                fontSize: '14px',
                lineHeight: '1.3'
            },
            // CV Section styles
            '.cv-section': {
                marginBottom: '8px',
                padding: '8px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
            },
            '.cv-section h3': {
                color: '#2d3748',
                marginBottom: '6px',
                marginTop: '0',
                fontSize: '1.1rem',
                fontWeight: '600'
            },
            '.cv-section p': {
                color: '#4a5568',
                lineHeight: '1.4',
                margin: '0'
            },
            // Education styles
            '.education-preview-item': {
                background: '#f0fdf4',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #bbf7d0',
                marginBottom: '4px',
                fontSize: '13px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px'
            },
            '.education-preview-item .degree': {
                fontWeight: '600',
                color: '#065f46',
                fontSize: '14px'
            },
            '.education-preview-item .institution': {
                color: '#047857',
                fontSize: '13px'
            },
            '.education-preview-item .year': {
                color: '#059669',
                fontWeight: '500',
                fontSize: '12px',
                background: '#dcfce7',
                padding: '2px 6px',
                borderRadius: '4px'
            },
            '.education-preview-item .grade': {
                color: '#065f46',
                fontStyle: 'italic',
                fontSize: '11px',
                background: '#f0fdf4',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #bbf7d0'
            },
            // Experience styles
            '.experience-preview-item': {
                background: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '4px',
                borderLeft: '3px solid #3b82f6',
                marginBottom: '6px',
                fontSize: '13px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            },
            '.experience-preview-item .job-title': {
                fontWeight: '700',
                color: '#1e293b',
                fontSize: '15px',
                marginBottom: '0',
                marginTop: '0',
                padding: '0',
                lineHeight: '1.2',
                textTransform: 'capitalize',
                flex: '1'
            },
            '.experience-preview-item .company': {
                color: '#3b82f6',
                fontWeight: '600',
                fontSize: '13px',
                marginBottom: '0',
                marginTop: '0',
                padding: '0',
                lineHeight: '1.2'
            },
            '.experience-preview-item .duration': {
                color: '#64748b',
                fontWeight: '500',
                fontSize: '12px',
                marginBottom: '0',
                marginLeft: 'auto'
            },
            '.experience-preview-item .description': {
                color: '#475569',
                fontSize: '12px',
                lineHeight: '1.4',
                marginTop: '4px',
                paddingTop: '6px',
                borderTop: '1px solid #e2e8f0'
            },
            // Skills styles
            '.skills-tags-wrapper': {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '2px 0'
            },
            '.skill-tag': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: '500',
                display: 'inline-block',
                boxShadow: '0 1px 3px rgba(102, 126, 234, 0.2)',
                lineHeight: '1.2'
            },
            // Languages styles
            '.languages-tags-wrapper': {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '2px 0'
            },
            '.language-tag': {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: '500',
                display: 'inline-block',
                boxShadow: '0 1px 3px rgba(16, 185, 129, 0.2)',
                lineHeight: '1.2'
            },
            '.hobbies-tags-wrapper': {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '2px 0'
            },
            '.hobby-tag': {
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: '500',
                display: 'inline-block',
                boxShadow: '0 1px 3px rgba(139, 92, 246, 0.2)',
                lineHeight: '1.2'
            },
            '.custom-section-preview': {
                marginBottom: '15px',
                padding: '12px 0',
                borderBottom: '1px solid #e2e8f0'
            },
            '.custom-section-preview:last-child': {
                borderBottom: 'none',
                marginBottom: '0'
            },
            '.custom-section-heading': {
                fontSize: '1rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px',
                paddingBottom: '3px',
                borderBottom: '1px solid #667eea'
            },
            '.custom-items-list': {
                listStyle: 'none',
                padding: '0',
                margin: '0'
            },
            '.custom-items-list li': {
                position: 'relative',
                padding: '2px 0 2px 20px',
                marginBottom: '0',
                color: '#4a5568',
                lineHeight: '1.3',
                fontSize: '14px'
            },
            '.custom-items-list li::before': {
                content: '"•"',
                position: 'absolute',
                left: '0',
                top: '2px',
                color: '#667eea',
                fontSize: '14px',
                fontWeight: 'bold'
            },
            '.custom-items-list li:last-child': {
                marginBottom: '0'
            },
            // Hide remove buttons in PDF
            '.remove-section-btn': {
                display: 'none'
            },
            // Other info styles
            '.other-info-wrapper': {
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            },
            '.other-info-item-preview': {
                background: '#f0f9ff',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #bae6fd',
                fontSize: '13px',
                color: '#1e40af',
                lineHeight: '1.3'
            }
        };

        // Apply styles to elements
        Object.keys(styles).forEach(selector => {
            const elements = element.querySelectorAll(selector);
            elements.forEach(el => {
                Object.assign(el.style, styles[selector]);
            });
        });

        // Apply styles to the element itself if it matches
        Object.keys(styles).forEach(selector => {
            if (element.matches && element.matches(selector)) {
                Object.assign(element.style, styles[selector]);
            }
        });
    }

    generateCVHTML() {
        const personalInfo = this.cvData.personalInfo;
        const education = this.cvData.education;
        const experience = this.cvData.experience;
        const skills = this.cvData.skills;
        const languages = this.cvData.languages;
        const otherInfo = this.cvData.otherInfo;
        const hobbies = this.cvData.hobbies;
        const certifications = this.cvData.certifications;
        const customSections = this.cvData.customSections;
        const references = this.cvData.references;
        
        // Get selected template from sessionStorage or default to classic
        const selectedTemplate = sessionStorage.getItem('selectedTemplate') || 'classic';
        
        // Generate different HTML based on template
        if (selectedTemplate === 'modern') {
            return this.generateTemplate2HTMLForDownload();
        } else if (selectedTemplate === 'minimalist') {
            return this.generateTemplate3HTMLForDownload();
        } else {
            return this.generateTemplate1HTMLForDownload();
        }
    }
    
    generateTemplate1HTMLForDownload() {
        const personalInfo = this.cvData.personalInfo;
        const education = this.cvData.education;
        const experience = this.cvData.experience;
        const skills = this.cvData.skills;
        const languages = this.cvData.languages;
        const otherInfo = this.cvData.otherInfo;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${personalInfo.fullName || 'Resume'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 15px;
            background: white;
        }
        .cv-header {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 2px solid #667eea;
            align-items: center;
        }
        .profile-pic {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 3px solid #667eea;
            overflow: hidden;
            flex-shrink: 0;
            align-self: center;
        }
        .profile-pic img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .personal-info h1 {
            font-size: 1.8rem;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .contact-item {
            padding: 2px 0;
            background: transparent;
            border: none;
            color: #0369a1;
            font-weight: 500;
            font-size: 14px;
        }
        .cv-section {
            margin-bottom: 8px;
            padding: 8px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .cv-section h3 {
            color: #2d3748;
            margin-bottom: 6px;
            margin-top: 0;
            font-size: 1.1rem;
            font-weight: 600;
        }
        .cv-section p {
            color: #4a5568;
            line-height: 1.4;
            margin: 0;
        }
        
        /* Education Preview */
        .education-preview-item {
            background: #f0fdf4;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #bbf7d0;
            margin-bottom: 4px;
            font-size: 13px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
        }
        .education-preview-item .degree {
            font-weight: 600;
            color: #065f46;
            font-size: 14px;
        }
        .education-preview-item .institution {
            color: #047857;
            font-size: 13px;
        }
        .education-preview-item .year {
            color: #059669;
            font-weight: 500;
            font-size: 12px;
            background: #dcfce7;
            padding: 2px 6px;
            border-radius: 4px;
        }
        .education-preview-item .grade {
            color: #065f46;
            font-style: italic;
            font-size: 11px;
            background: #f0fdf4;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #bbf7d0;
        }
        
        /* Experience Preview */
        .experience-preview-item {
            background: #f8fafc;
            padding: 6px 10px;
            border-radius: 4px;
            border-left: 3px solid #3b82f6;
            margin-bottom: 6px;
            font-size: 13px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .experience-preview-item .job-title {
            font-weight: 700;
            color: #1e293b;
            font-size: 15px;
            margin-bottom: 0;
            margin-top: 0;
            padding: 0;
            line-height: 1.2;
            text-transform: capitalize;
            flex: 1;
        }
        .experience-preview-item .company {
            color: #3b82f6;
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 0;
            margin-top: 0;
            padding: 0;
            line-height: 1.2;
        }
        .experience-preview-item .duration {
            color: #64748b;
            font-weight: 500;
            font-size: 12px;
            margin-bottom: 0;
            margin-left: auto;
        }
        .experience-preview-item .description {
            color: #475569;
            font-size: 12px;
            line-height: 1.4;
            margin-top: 4px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
        }
        
        /* Skills Preview */
        .skills-tags-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 2px 0;
        }
        .skill-tag {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
            box-shadow: 0 1px 3px rgba(102, 126, 234, 0.2);
            line-height: 1.2;
        }
        
        /* Other Information Preview */
        .other-info-wrapper {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .other-info-item-preview {
            background: #f0f9ff;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #bae6fd;
            font-size: 13px;
            color: #1e40af;
            line-height: 1.3;
        }
        
        @media print {
            @page {
                size: A4;
                margin: 0;
            }
            
            body { 
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            .cv-section { break-inside: avoid; }
            
            /* Template 2 Print Styles */
            .template-2-container {
                width: 100% !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                display: flex !important;
                flex-direction: row !important;
            }
            
            .template-2-sidebar {
                width: 35% !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 20px !important;
                background: linear-gradient(135deg, #D2B48C 0%, #DEB887 50%, #D2B48C 100%) !important;
                color: black !important;
                overflow: visible !important;
            }
            
            .template-2-main-content {
                width: 65% !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                color: #333 !important;
                overflow: visible !important;
            }
            
            /* Ensure proper font sizes for print */
            .template-2-header h1 {
                font-size: 2.2rem !important;
                line-height: 1.2 !important;
            }
            
            .template-2-main-title {
                font-size: 1rem !important;
                margin-bottom: 8px !important;
            }
            
            .template-2-main-section p {
                font-size: 0.9rem !important;
                line-height: 1.4 !important;
            }
            
            .template-2-sidebar-title {
                font-size: 0.9rem !important;
                margin-bottom: 6px !important;
            }
            
            .template-2-skill-item {
                font-size: 0.8rem !important;
                padding: 3px 6px !important;
                margin-bottom: 3px !important;
            }
            
            /* Hide hover effects and transitions for print */
            .template-2 * {
                transition: none !important;
                transform: none !important;
            }
            
            .template-2-main-section:hover {
                transform: none !important;
                box-shadow: none !important;
            }
            
            /* Ensure proper spacing for print */
            .template-2-main-section {
                margin-bottom: 15px !important;
                padding: 12px 20px !important;
                break-inside: avoid;
            }
            
            .template-2-sidebar-section {
                margin-bottom: 12px !important;
                padding: 0 8px !important;
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="cv-container">
        <div class="cv-header">
            <div class="profile-pic">
                ${personalInfo.profilePicture ? `<img src="${personalInfo.profilePicture}" alt="Profile">` : '<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:50px;color:#9ca3af;">👤</div>'}
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
        
        ${!this.hiddenSections.has('summary') ? `
        <div class="cv-section">
            <h3>💼 Professional Summary</h3>
            <p>${personalInfo.summary || 'Your professional summary will appear here...'}</p>
        </div>
        ` : ''}
        
        ${!this.hiddenSections.has('education') ? `
        <div class="cv-section">
            <h3>🎓 Education</h3>
            ${education.length > 0 ? 
                education.map(edu => {
                    const degree = edu.degree || '';
                    const institution = edu.institution || '';
                    const year = edu.year || '';
                    const grade = edu.grade || '';
                    
                    let htmlContent = '';
                    if (degree) htmlContent += `<div class="degree">${degree}</div>`;
                    if (institution) htmlContent += `<span style="color: #059669;">•</span><div class="institution">${institution}</div>`;
                    if (year) htmlContent += `<span style="color: #059669;">•</span><div class="year">${year}</div>`;
                    if (grade) htmlContent += `<span style="color: #059669;">•</span><div class="grade">${grade}</div>`;
                    
                    return htmlContent ? `<div class="education-preview-item">${htmlContent}</div>` : '';
                }).join('') : 
                '<p style="color: #6b7280; font-style: italic;">Add your educational background to showcase your qualifications</p>'
            }
        </div>
        ` : ''}
        
        ${!this.hiddenSections.has('experience') ? `
        <div class="cv-section">
            <h3>💼 Work Experience</h3>
            ${experience.length > 0 ? 
                experience.map(exp => {
                    const jobTitle = exp.jobTitle || '';
                    const company = exp.company || '';
                    const duration = exp.duration || '';
                    const description = exp.description || '';
                    
                    let htmlContent = '';
                    if (jobTitle || duration) {
                        htmlContent += '<div style="display: flex; align-items: center; margin-bottom: 4px;">';
                        if (jobTitle) htmlContent += `<div class="job-title">${jobTitle}</div>`;
                        if (duration) htmlContent += `<div class="duration">${duration}</div>`;
                        htmlContent += '</div>';
                    }
                    if (company) htmlContent += `<div class="company">${company}</div>`;
                    if (description) {
                        // Convert line breaks to bullet points
                        const bulletPoints = description.split('\n')
                            .filter(line => line.trim())
                            .map(line => `<li>${line.trim()}</li>`)
                            .join('');
                        htmlContent += `<div class="description"><ul style="margin: 0; padding-left: 20px;">${bulletPoints}</ul></div>`;
                    }
                    
                    return htmlContent ? `<div class="experience-preview-item">${htmlContent}</div>` : '';
                }).join('') : 
                '<p style="color: #6b7280; font-style: italic;">Add your work experience to showcase your professional background</p>'
            }
        </div>
        ` : ''}
        
        <div class="cv-section">
            <h3>🏆 Certifications</h3>
            ${this.cvData.certifications.length > 0 ? 
                `<ul style="list-style: none; padding: 0; margin: 0;">${this.cvData.certifications.map(cert => 
                    cert.certification && cert.certification.trim() ? 
                    `<li style="position: relative; padding: 2px 0 2px 20px; margin-bottom: 0; color: #4a5568; line-height: 1.3; font-size: 14px;"><span style="position: absolute; left: 0; top: 2px; color: #667eea; font-size: 14px; font-weight: bold;">•</span>${cert.certification}</li>` : ''
                ).join('')}</ul>` : 
                '<p style="color: #6b7280; font-style: italic;">Add your certifications to showcase your professional qualifications</p>'
            }
        </div>
        
        ${!this.hiddenSections.has('skills') ? `
        <div class="cv-section">
            <h3>🚀 Skills</h3>
            ${skills.length > 0 ? 
                `<div class="skills-tags-wrapper">${skills.map(skill => 
                    skill.skill && skill.skill.trim() ? 
                    `<span class="skill-tag">${skill.skill}</span>` : ''
                ).join('')}</div>` : 
                '<p style="color: #6b7280; font-style: italic;">Add your skills to showcase your capabilities</p>'
            }
        </div>
        ` : ''}
        
        ${!this.hiddenSections.has('languages') ? `
        <div class="cv-section">
            <h3>🌐 Languages</h3>
            ${languages.length > 0 ? 
                `<div class="languages-tags-wrapper">${languages.map(language => {
                    if (language.language && language.language.trim()) {
                        let displayText = language.language;
                        if (language.level && language.level.trim()) {
                            displayText += ` (${language.level})`;
                        }
                        return `<span class="language-tag">${displayText}</span>`;
                    }
                    return '';
                }).join('')}</div>` : 
                '<p style="color: #6b7280; font-style: italic;">Add your languages to showcase your communication abilities</p>'
            }
        </div>
        ` : ''}
        
        ${!this.hiddenSections.has('hobbies') ? `
        <div class="cv-section">
            <h3>🎯 Hobbies</h3>
            ${this.cvData.hobbies.length > 0 ? 
                `<div class="hobbies-tags-wrapper">${this.cvData.hobbies.map(hobby => 
                    hobby.hobby && hobby.hobby.trim() ? 
                    `<span class="hobby-tag">${hobby.hobby}</span>` : ''
                ).join('')}</div>` : 
                '<p style="color: #6b7280; font-style: italic;">Add your hobbies to show your personality and interests</p>'
            }
        </div>
        ` : ''}
        
        ${!this.hiddenSections.has('custom') && this.cvData.customSections.length > 0 ? 
            this.cvData.customSections.map(section => {
                if (section.heading && section.items && section.items.length > 0) {
                    return `
                        <div class="custom-section-preview">
                            <div class="custom-section-heading">✨ ${section.heading}</div>
                            <ul class="custom-items-list">
                                ${section.items.map(item => 
                                    item.value ? `<li>${item.value}</li>` : ''
                                ).join('')}
                            </ul>
                        </div>
                    `;
                }
                return '';
            }).join('') : ''}
        
        ${!this.hiddenSections.has('other') && otherInfo.length > 0 ? `
        <div class="cv-section">
            <h3>ℹ️ Other Information</h3>
            <div class="other-info-wrapper">
                ${otherInfo.map(info => {
                    if (info.fatherName || info.husbandName || info.cnic || info.dateOfBirth || info.maritalStatus || info.religion) {
                        let htmlContent = '';
                        if (info.fatherName) htmlContent += `<div class="other-info-item-preview"><strong>Father's Name:</strong> ${info.fatherName}</div>`;
                        if (info.husbandName) htmlContent += `<div class="other-info-item-preview"><strong>Husband's Name:</strong> ${info.husbandName}</div>`;
                        if (info.cnic) htmlContent += `<div class="other-info-item-preview"><strong>CNIC:</strong> ${info.cnic}</div>`;
                        if (info.dateOfBirth) htmlContent += `<div class="other-info-item-preview"><strong>Date of Birth:</strong> ${info.dateOfBirth}</div>`;
                        if (info.maritalStatus) htmlContent += `<div class="other-info-item-preview"><strong>Marital Status:</strong> ${info.maritalStatus}</div>`;
                        if (info.religion) htmlContent += `<div class="other-info-item-preview"><strong>Religion:</strong> ${info.religion}</div>`;
                        return htmlContent;
                    } else if (info.fieldName && info.fieldValue) {
                        return `<div class="other-info-item-preview"><strong>${info.fieldName}:</strong> ${info.fieldValue}</div>`;
                    }
                    return '';
                }).join('')}
            </div>
        </div>` : ''}
        
        ${!this.hiddenSections.has('references') && this.cvData.references && this.cvData.references.length > 0 ? `
        <div class="cv-section">
            <h3>📞 References</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.5;">
                ${this.cvData.references.map(ref => 
                    ref.reference && ref.reference.trim() ? `<li style="margin-bottom: 0px;">${ref.reference}</li>` : ''
                ).join('')}
            </ul>
        </div>` : ''}
    </div>
</body>
</html>`;
    }
    
    generateTemplate2HTMLForDownload() {
        const personalInfo = this.cvData.personalInfo;
        const education = this.cvData.education;
        const experience = this.cvData.experience;
        const skills = this.cvData.skills;
        const languages = this.cvData.languages;
        const otherInfo = this.cvData.otherInfo;
        const hobbies = this.cvData.hobbies;
        const certifications = this.cvData.certifications;
        const customSections = this.cvData.customSections;
        const references = this.cvData.references;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${personalInfo.fullName || 'Resume'}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: #333;
        }
        
        .template-2-container {
            display: flex;
            min-height: 100vh;
            width: 100%;
            margin: 0;
            padding: 0;
        }
        
        .template-2-sidebar {
            width: 35%;
            background: linear-gradient(135deg, #D2B48C 0%, #DEB887 50%, #D2B48C 100%);
            color: black;
            padding: 20px;
            display: flex;
            flex-direction: column;
        }
        
        .template-2-main-content {
            width: 65%;
            background: white;
            color: #333;
            padding: 20px;
        }
        
        .template-2-profile-pic {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px auto;
            overflow: hidden;
            border: 4px solid #8B4513;
        }
        
        .template-2-profile-pic img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .template-2-contact-section {
            margin-bottom: 20px;
        }
        
        .template-2-contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 0.8rem;
            color: black;
        }
        
        .template-2-contact-icon {
            font-size: 1.2rem;
            color: #dc2626;
        }
        
        .template-2-sidebar-section {
            margin-bottom: 20px;
        }
        
        .template-2-sidebar-title {
            color: black;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .template-2-section-icon {
            font-size: 1.2rem;
            color: #047857;
        }
        
        .template-2-skills-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .template-2-skill-item {
            font-size: 0.8rem;
            color: black;
            font-weight: 500;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .template-2-header {
            text-align: right;
            margin-bottom: 25px;
            padding: 20px 0 15px 0;
        }
        
        .template-2-header h1 {
            color: #8B4513;
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .template-2-main-section {
            margin-bottom: 20px;
            padding: 15px 25px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 12px;
            border: 1px solid rgba(139, 69, 19, 0.1);
        }
        
        .template-2-main-title {
            color: #8B4513;
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .template-2-main-icon {
            font-size: 1.2rem;
            color: #7c3aed;
        }
        
        .template-2-main-section p {
            color: #333;
            line-height: 1.4;
            margin: 0;
            text-align: justify;
            font-size: 0.85rem;
        }
        
        .template-2-experience-item,
        .template-2-education-item {
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px solid #E0E0E0;
        }
        
        .template-2-experience-item:last-child,
        .template-2-education-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .template-2-experience-header,
        .template-2-education-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        
        .template-2-experience-header h4,
        .template-2-education-header h4 {
            font-size: 1.0rem;
            font-weight: 600;
            color: #8B4513;
            margin: 0;
        }
        
        .template-2-date {
            font-size: 0.8rem;
            color: #666;
            background: #F5F5F5;
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 500;
        }
        
        .template-2-company,
        .template-2-school {
            font-size: 0.9rem;
            color: #555;
            margin: 0 0 6px 0;
            font-weight: 500;
        }
        
        .template-2-achievements {
            margin: 0;
            padding-left: 12px;
        }
        
        .template-2-achievements li {
            font-size: 0.75rem;
            color: #333;
            margin-bottom: 3px;
            line-height: 1.5;
        }
        
        @media print {
            @page {
                size: A4;
                margin: 0;
            }
            
            body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            .template-2-container {
                width: 100% !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                display: flex !important;
                flex-direction: row !important;
            }
            
            .template-2-sidebar {
                width: 35% !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 20px !important;
                background: linear-gradient(135deg, #D2B48C 0%, #DEB887 50%, #D2B48C 100%) !important;
                color: black !important;
                overflow: visible !important;
            }
            
            .template-2-main-content {
                width: 65% !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                color: #333 !important;
                overflow: visible !important;
            }
            
            .template-2-header h1 {
                font-size: 2.2rem !important;
                line-height: 1.2 !important;
            }
            
            .template-2-main-title {
                font-size: 1rem !important;
                margin-bottom: 8px !important;
            }
            
            .template-2-main-section p {
                font-size: 0.9rem !important;
                line-height: 1.4 !important;
            }
            
            .template-2-sidebar-title {
                font-size: 0.9rem !important;
                margin-bottom: 6px !important;
            }
            
            .template-2-skill-item {
                font-size: 0.8rem !important;
                padding: 3px 6px !important;
                margin-bottom: 3px !important;
            }
            
            .template-2-main-section {
                margin-bottom: 15px !important;
                padding: 12px 20px !important;
                break-inside: avoid;
            }
            
            .template-2-sidebar-section {
                margin-bottom: 12px !important;
                padding: 0 8px !important;
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="template-2-container">
        <!-- Left Sidebar -->
        <div class="template-2-sidebar">
            <!-- Profile Picture -->
            <div class="template-2-profile-pic">
                ${personalInfo.profilePicture ? 
                    `<img src="${personalInfo.profilePicture}" alt="Profile">` : 
                    '<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:50px;color:#9ca3af;">👤</div>'
                }
            </div>

            <!-- Contact Information -->
            <div class="template-2-contact-section">
                ${personalInfo.phones && personalInfo.phones.length > 0 ? `
                    <div class="template-2-contact-item">
                        <span class="template-2-contact-icon">📱</span>
                        <span>${personalInfo.phones.map(p => p.phone).join(', ')}</span>
                    </div>
                ` : ''}
                ${personalInfo.email ? `
                    <div class="template-2-contact-item">
                        <span class="template-2-contact-icon">📧</span>
                        <span>${personalInfo.email}</span>
                    </div>
                ` : ''}
                ${personalInfo.address ? `
                    <div class="template-2-contact-item">
                        <span class="template-2-contact-icon">📍</span>
                        <span>${personalInfo.address}</span>
                    </div>
                ` : ''}
            </div>

            <!-- Skills Section -->
            <div class="template-2-sidebar-section">
                <h3 class="template-2-sidebar-title">
                    <span class="template-2-section-icon">⚙️</span>
                    Skills
                </h3>
                <div class="template-2-skills-list">
                    ${skills.length > 0 ? 
                        skills.map(skill => 
                            skill.skill && skill.skill.trim() ? 
                            `<div class="template-2-skill-item">${skill.skill}</div>` : ''
                        ).join('') : 
                        '<div class="template-2-skill-item">Add your skills</div>'
                    }
                </div>
            </div>

            <!-- Languages Section -->
            <div class="template-2-sidebar-section">
                <h3 class="template-2-sidebar-title">
                    <span class="template-2-section-icon">🌐</span>
                    Languages
                </h3>
                <div class="template-2-skills-list">
                    ${languages.length > 0 ? 
                        languages.map(language => {
                            if (language.language && language.language.trim()) {
                                let displayText = language.language;
                                if (language.level && language.level.trim()) {
                                    displayText += ` (${language.level})`;
                                }
                                return `<div class="template-2-skill-item">${displayText}</div>`;
                            }
                            return '';
                        }).join('') : 
                        '<div class="template-2-skill-item">Add your languages</div>'
                    }
                </div>
            </div>

            <!-- Hobbies Section -->
            <div class="template-2-sidebar-section">
                <h3 class="template-2-sidebar-title">
                    <span class="template-2-section-icon">🎯</span>
                    Hobbies
                </h3>
                <div class="template-2-skills-list">
                    ${hobbies.length > 0 ? 
                        hobbies.map(hobby => 
                            hobby.hobby && hobby.hobby.trim() ? 
                            `<div class="template-2-skill-item">${hobby.hobby}</div>` : ''
                        ).join('') : 
                        '<div class="template-2-skill-item">Add your hobbies</div>'
                    }
                </div>
            </div>

            <!-- Other Information Section -->
            <div class="template-2-sidebar-section">
                <h3 class="template-2-sidebar-title">
                    <span class="template-2-section-icon">ℹ️</span>
                    Other Information
                </h3>
                <div class="template-2-skills-list">
                    ${otherInfo.length > 0 ? 
                        otherInfo.map(info => {
                            if (info.fatherName && info.fatherName.trim()) {
                                return `<div class="template-2-skill-item">Father: ${info.fatherName}</div>`;
                            }
                            if (info.husbandName && info.husbandName.trim()) {
                                return `<div class="template-2-skill-item">Husband: ${info.husbandName}</div>`;
                            }
                            if (info.cnic && info.cnic.trim()) {
                                return `<div class="template-2-skill-item">CNIC: ${info.cnic}</div>`;
                            }
                            if (info.dateOfBirth && info.dateOfBirth.trim()) {
                                return `<div class="template-2-skill-item">DOB: ${info.dateOfBirth}</div>`;
                            }
                            if (info.maritalStatus && info.maritalStatus.trim()) {
                                return `<div class="template-2-skill-item">Status: ${info.maritalStatus}</div>`;
                            }
                            if (info.religion && info.religion.trim()) {
                                return `<div class="template-2-skill-item">Religion: ${info.religion}</div>`;
                            }
                            if (info.fieldName && info.fieldValue && info.fieldName.trim() && info.fieldValue.trim()) {
                                return `<div class="template-2-skill-item">${info.fieldName}: ${info.fieldValue}</div>`;
                            }
                            return '';
                        }).join('') : 
                        '<div class="template-2-skill-item">Add other information</div>'
                    }
                </div>
            </div>
        </div>

        <!-- Right Main Content -->
        <div class="template-2-main-content">
            <!-- Header with Name -->
            <div class="template-2-header">
                <h1>${personalInfo.fullName || 'YOUR NAME HERE'}</h1>
            </div>

            <!-- Profile Section -->
            <div class="template-2-main-section">
                <h3 class="template-2-main-title">
                    <span class="template-2-main-icon">👤</span>
                    Profile
                </h3>
                <p>${personalInfo.summary || 'Your professional summary will appear here...'}</p>
            </div>

            <!-- Education Section -->
            <div class="template-2-main-section">
                <h3 class="template-2-main-title">
                    <span class="template-2-main-icon">🎓</span>
                    Education
                </h3>
                ${education.length > 0 ? 
                    education.map(edu => `
                        <div class="template-2-education-item">
                            <div class="template-2-education-header">
                                <h4>${edu.degree || 'Degree'}</h4>
                                <span class="template-2-date">${edu.year || 'Year'}</span>
                            </div>
                            <div class="template-2-school">${edu.institution || 'Institution'}</div>
                            ${edu.grade ? `<div class="template-2-achievements"><ul><li>Grade: ${edu.grade}</li></ul></div>` : ''}
                        </div>
                    `).join('') : 
                    '<p>Add your educational background</p>'
                }
            </div>

            <!-- Work Experience Section -->
            <div class="template-2-main-section">
                <h3 class="template-2-main-title">
                    <span class="template-2-main-icon">💼</span>
                    Work Experience
                </h3>
                ${experience.length > 0 ? 
                    experience.map(exp => `
                        <div class="template-2-experience-item">
                            <div class="template-2-experience-header">
                                <h4>${exp.jobTitle || 'Job Title'}</h4>
                                <span class="template-2-date">${exp.duration || 'Duration'}</span>
                            </div>
                            <div class="template-2-company">${exp.company || 'Company'}</div>
                            ${exp.description ? `
                                <div class="template-2-achievements">
                                    <ul>
                                        ${exp.description.split('\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `).join('') : 
                    '<p>Add your work experience</p>'
                }
            </div>

            <!-- Certifications Section -->
            ${certifications.length > 0 ? `
            <div class="template-2-main-section">
                <h3 class="template-2-main-title">
                    <span class="template-2-main-icon">🏆</span>
                    Certifications
                </h3>
                <div class="template-2-achievements">
                    <ul>
                        ${certifications.map(cert => 
                            cert.certification && cert.certification.trim() ? 
                            `<li>${cert.certification}</li>` : ''
                        ).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}

            <!-- Custom Sections -->
            ${customSections.length > 0 ? `
            <div class="template-2-main-section">
                <h3 class="template-2-main-title">
                    <span class="template-2-main-icon">✨</span>
                    Custom Sections
                </h3>
                ${customSections.map(section => `
                    <div class="template-2-main-section">
                        <h4 style="color: #8B4513; font-size: 0.9rem; margin-bottom: 8px;">${section.heading || 'Section'}</h4>
                        <div class="template-2-achievements">
                            <ul>
                                ${section.items ? section.items.map(item => 
                                    item.value && item.value.trim() ? `<li>${item.value}</li>` : ''
                                ).join('') : ''}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- References Section -->
            ${references.length > 0 ? `
            <div class="template-2-main-section">
                <h3 class="template-2-main-title">
                    <span class="template-2-main-icon">📞</span>
                    References
                </h3>
                <div class="template-2-achievements">
                    <ul>
                        ${references.map(ref => 
                            ref.reference && ref.reference.trim() ? 
                            `<li>${ref.reference}</li>` : ''
                        ).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
    }

    // Auto-save functionality
    startAutoSave() {
        console.log('Starting auto-save every 10 seconds');
        
        // Clear any existing interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Save every 30 seconds (increased from 10 seconds)
        this.autoSaveInterval = setInterval(() => {
            console.log('Auto-save check - hasUnsavedChanges:', this.hasUnsavedChanges, 'isSaving:', this.isSaving);
            if (this.hasUnsavedChanges && !this.isSaving) {
                console.log('Auto-saving data...');
                this.saveData();
            } else {
                console.log('No unsaved changes or save in progress, skipping auto-save');
            }
        }, 30000); // Increased from 10000ms to 30000ms
        
        console.log('Auto-save interval started with ID:', this.autoSaveInterval);

        // Save when user leaves the page
        window.addEventListener('beforeunload', () => {
            console.log('Page unloading - saving data if needed');
            if (this.hasUnsavedChanges && !this.isSaving) {
                this.saveDataSilently();
            }
        });

        // Save when page becomes hidden (tab switch, minimize, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.hasUnsavedChanges && !this.isSaving) {
                console.log('Page hidden - saving data');
                this.saveDataSilently();
            }
        });

        // Save when window loses focus
        window.addEventListener('blur', () => {
            if (this.hasUnsavedChanges && !this.isSaving) {
                console.log('Window lost focus - saving data');
                this.saveDataSilently();
            }
        });

        // Additional save trigger every 60 seconds regardless of changes (backup) - increased from 30 seconds
        setInterval(() => {
            if (this.hasUnsavedChanges && !this.isSaving) {
                console.log('Backup save triggered');
                this.saveDataSilently();
            }
        }, 60000); // Increased from 30000ms to 60000ms
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('Auto-save stopped');
        }
    }

    async saveData() {
        // Prevent multiple simultaneous saves
        if (this.isSaving) {
            console.log('Save already in progress, skipping...');
            return;
        }
        
        this.isSaving = true;
        console.log('Starting save operation...');
        
        try {
            // Collect current form data
            this.collectFormData();
            
            // Get current user
            const user = AuthSystem.getCurrentUser();
            if (!user) {
                console.error('No user logged in, cannot save data');
                console.log('Available localStorage keys:', Object.keys(localStorage));
                console.log('cvBuilder_user:', localStorage.getItem('cvBuilder_user'));
                console.log('cvBuilder_auth:', localStorage.getItem('cvBuilder_auth'));
                
                // Try to recover session
                this.tryRecoverSession();
                
                // Show error to user
                this.updateSaveIndicator('error');
                return;
            }

            // Use Supabase database manager to save CV
            if (window.supabaseDatabaseManager) {
                // Debug: Log the data being saved
                console.log('=== SAVING CV DATA ===');
                console.log('Supabase database manager available:', window.supabaseDatabaseManager);
                console.log('User ID:', user.id);
                console.log('Full cvData being saved:', JSON.stringify(this.cvData, null, 2));
                console.log('Education data specifically:', this.cvData.education);
                console.log('Other Info data specifically:', this.cvData.otherInfo);
                console.log('=== END SAVING CV DATA ===');
                
                // Check if this is an update to existing CV
                const existingCVId = sessionStorage.getItem('currentCVId');
                console.log('Existing CV ID from sessionStorage:', existingCVId);
                
                let cvRecord;
                if (existingCVId) {
                    // Try to update existing CV
                    console.log('Updating existing CV with ID:', existingCVId);
                    cvRecord = await window.supabaseDatabaseManager.updateCV(existingCVId, this.cvData, user.id, user.role);
                    if (cvRecord) {
                        console.log('CV updated successfully with ID:', existingCVId);
                    } else {
                        // If update failed (table doesn't exist), create a new CV
                        console.log('Update failed, creating new CV instead');
                        sessionStorage.removeItem('currentCVId'); // Clear the old ID
                        cvRecord = await window.supabaseDatabaseManager.saveCV(this.cvData, user.id, user.role);
                        if (cvRecord && cvRecord.id) {
                            sessionStorage.setItem('currentCVId', cvRecord.id);
                            console.log('NEW CV created successfully with ID:', cvRecord.id);
                        }
                    }
                } else {
                    // Create new CV
                    console.log('Creating NEW CV for user:', user.id, 'with role:', user.role);
                    console.log('CV Data being saved:', this.cvData);
                    cvRecord = await window.supabaseDatabaseManager.saveCV(this.cvData, user.id, user.role);
                    console.log('Save result:', cvRecord);
                    if (cvRecord && cvRecord.id) {
                        sessionStorage.setItem('currentCVId', cvRecord.id);
                        console.log('NEW CV created successfully with ID:', cvRecord.id);
                    } else {
                        console.error('Failed to create CV - cvRecord is null or missing ID');
                    }
                }
                
                if (cvRecord) {
                    this.lastSaved = new Date();
                    this.hasUnsavedChanges = false;
                    console.log('CV saved successfully at', this.lastSaved.toLocaleTimeString());
                    console.log('CV Record details:', cvRecord);
                    console.log('CV Name:', cvRecord.name || cvRecord.cv_name);
                    this.updateSaveIndicator('saved');
                } else {
                    console.error('Failed to save CV - cvRecord is null/undefined');
                    this.updateSaveIndicator('error');
                    throw new Error('CV save failed - no record returned from database');
                }
            } else {
                console.error('Database manager not available');
                this.updateSaveIndicator('error');
                throw new Error('Database manager not available - cannot save CV');
            }
            
        } catch (error) {
            console.error('Error saving data:', error);
            this.updateSaveIndicator('error');
            
            // Show user-friendly error message
            if (error.message.includes('Database save failed')) {
                alert('Failed to save CV to database. Please check your connection and try again.');
            } else if (error.message.includes('Database manager not available')) {
                alert('Database connection not available. Please refresh the page and try again.');
            } else {
                alert('Save failed: ' + error.message);
            }
        } finally {
            // Always release the save lock
            this.isSaving = false;
            console.log('Save operation completed, lock released');
        }
    }

    // Clean up localStorage to free space
    cleanupLocalStorage() {
        try {
            console.log('Cleaning up localStorage...');
            
            // Get all keys
            const keys = Object.keys(localStorage);
            const cvKeys = keys.filter(key => key.startsWith('cvBuilder_savedData_'));
            
            if (cvKeys.length > 1) {
                // Keep only the most recent 3 CVs
                const cvDataWithTimestamps = cvKeys.map(key => {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        return {
                            key,
                            timestamp: new Date(data.lastSaved || 0),
                            data
                        };
                    } catch (e) {
                        return { key, timestamp: new Date(0), data: null };
                    }
                }).sort((a, b) => b.timestamp - a.timestamp);
                
                // Remove old CVs (keep only 3 most recent)
                const toRemove = cvDataWithTimestamps.slice(3);
                toRemove.forEach(item => {
                    localStorage.removeItem(item.key);
                    console.log('Removed old CV data:', item.key);
                });
            }
            
            // Clear any other temporary data
            keys.forEach(key => {
                if (key.startsWith('temp_') || key.startsWith('debug_')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('localStorage cleanup completed');
        } catch (error) {
            console.error('Error during localStorage cleanup:', error);
        }
    }

    saveDataSilently() {
        // Prevent multiple simultaneous saves
        if (this.isSaving) {
            console.log('Save already in progress, skipping silent save...');
            return;
        }
        
        this.isSaving = true;
        console.log('Starting silent save operation...');
        
        try {
            // Collect current form data
            this.collectFormData();
            
            // Get current user
            const user = AuthSystem.getCurrentUser();
            if (!user) {
                console.log('No user logged in for silent save, attempting recovery...');
                this.tryRecoverSession();
                return;
            }

            // Create save data with timestamp
            const saveData = {
                cvData: this.cvData,
                lastSaved: new Date().toISOString(),
                userId: user.id
            };

            // Save to localStorage with user-specific key
            const saveKey = `cvBuilder_savedData_${user.id}`;
            const dataString = JSON.stringify(saveData);
            
            try {
                localStorage.setItem(saveKey, dataString);
            } catch (quotaError) {
                console.warn('localStorage quota exceeded in silent save, cleaning up...');
                this.cleanupLocalStorage();
                try {
                    localStorage.setItem(saveKey, dataString);
                } catch (secondError) {
                    console.warn('Still quota exceeded after cleanup in silent save, emergency clear...');
                    this.emergencyClearStorage();
                    localStorage.setItem(saveKey, dataString);
                }
            }
            
            this.lastSaved = new Date();
            this.hasUnsavedChanges = false;
            
            console.log('Data saved silently at', this.lastSaved.toLocaleTimeString());
            // Note: No save indicator update to avoid overriding autosave information
            
        } catch (error) {
            console.error('Error saving data silently:', error);
        } finally {
            // Always release the save lock
            this.isSaving = false;
            console.log('Silent save operation completed, lock released');
        }
    }

    async loadSavedData() {
        try {
            // Check if we're creating a new CV
            const createNewCV = sessionStorage.getItem('createNewCV');
            if (createNewCV === 'true') {
                console.log('Creating new CV with default data');
                console.log('Current CV ID before clearing:', sessionStorage.getItem('currentCVId'));
                // Don't clear the flag immediately - let the redirection logic check it first
                
                // Ensure no existing CV ID is set
                sessionStorage.removeItem('currentCVId');
                console.log('Cleared currentCVId for new CV creation');
                
                // Reset to default data
                this.resetToDefaultData();
                
                // Check if we need to force language defaults reset
                const resetLanguageDefaults = sessionStorage.getItem('resetLanguageDefaults');
                if (resetLanguageDefaults === 'true') {
                    console.log('Forcing language defaults reset');
                    this.cvData.languages = [
                        { language: 'English', level: '' },
                        { language: 'Urdu', level: '' },
                        { language: 'Punjabi', level: '' }
                    ];
                    sessionStorage.removeItem('resetLanguageDefaults');
                }
                
                // Populate form fields with default data
                this.populateFormFields();
                
                this.updatePreview();
                this.updateSaveIndicator('new');
                
                // Clear the flag after everything is set up and page is fully loaded
                setTimeout(() => {
                    sessionStorage.removeItem('createNewCV');
                    console.log('Cleared createNewCV flag after setup and delay');
                }, 500); // Wait 500ms before clearing the flag
                return;
            }
            
            const user = AuthSystem.getCurrentUser();
            if (!user) {
                console.log('No user logged in, cannot load saved data');
                this.updateSaveIndicator('new');
                return;
            }

            // Check if we have a current CV ID in session storage
            const currentCVId = sessionStorage.getItem('currentCVId');
            console.log('=== LOAD SAVED DATA DEBUG ===');
            console.log('Current CV ID from sessionStorage:', currentCVId);
            console.log('Supabase database manager available:', !!window.supabaseDatabaseManager);
            
            if (currentCVId && window.supabaseDatabaseManager) {
                console.log('Attempting to load CV from Supabase with ID:', currentCVId);
                // Load from Supabase database manager
                const savedCV = await window.supabaseDatabaseManager.getCVById(currentCVId, user.role);
                console.log('CV loaded from Supabase:', savedCV);
                
                if (savedCV) {
                    // Convert from database format to CV data format
                    this.cvData = window.supabaseDatabaseManager.convertFromTableFormat(savedCV);
                    this.lastSaved = new Date(savedCV.updated_at || savedCV.created_at);
                    
                    console.log('Loaded saved data from database:', this.lastSaved.toLocaleString());
                    console.log('Saved data structure:', savedCV);
                    console.log('Converted CV data:', this.cvData);
                    
                    // Update form fields with saved data
                    this.populateFormFields();
                    
                    // Update preview with loaded data
                    this.updatePreview();
                    
                    // Mark as loaded (no unsaved changes initially)
                    this.hasUnsavedChanges = false;
                    this.updateSaveIndicator('loaded');
                    console.log('=== END LOAD SAVED DATA DEBUG - SUCCESS ===');
                    return;
                } else {
                    console.log('No CV found with ID:', currentCVId);
                }
            } else {
                console.log('No currentCVId or Supabase manager not available');
            }
            console.log('=== END LOAD SAVED DATA DEBUG - FALLBACK ===');

            // Fallback to old localStorage method
            const saveKey = `cvBuilder_savedData_${user.id}`;
            const savedData = localStorage.getItem(saveKey);
            
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                
                // Validate saved data structure
                if (parsedData && parsedData.cvData) {
                    this.cvData = parsedData.cvData;
                    this.lastSaved = new Date(parsedData.lastSaved);
                    
                    console.log('Loaded saved data from localStorage:', this.lastSaved.toLocaleString());
                    console.log('Saved data structure:', parsedData);
                    
                    // Update form fields with saved data
                    this.populateFormFields();
                    
                    // Update preview with loaded data
                    this.updatePreview();
                    
                    // Mark as loaded (no unsaved changes initially)
                    this.hasUnsavedChanges = false;
                    this.updateSaveIndicator('loaded');
                } else {
                    console.error('Invalid saved data structure');
                    this.updateSaveIndicator('new');
                }
            } else {
                console.log('No saved data found for user');
                // Populate form with default values
                this.populateFormFields();
                this.updateSaveIndicator('new');
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
            this.updateSaveIndicator('error');
        }
    }

    resetToDefaultData() {
        console.log('Resetting to default data');
        this.cvData = {
            personalInfo: {
                fullName: '',
                email: '',
                phones: [],
                address: '',
                profilePicture: null,
                summary: 'Dedicated and results-driven professional with a strong commitment to excellence and continuous learning. Seeking opportunities to leverage my skills and contribute to organizational success while advancing my career in a dynamic and challenging environment.'
            },
            education: [],
            experience: [],
            certifications: [],
            skills: [
                { skill: 'Communication Skills' },
                { skill: 'Time Management' },
                { skill: 'Hardworking' },
                { skill: 'Accurate Planning' }
            ],
            languages: [
                { language: 'English', level: '' },
                { language: 'Urdu', level: '' },
                { language: 'Punjabi', level: '' }
            ],
            hobbies: [],
            customSections: [],
            otherInfo: [],
            references: [
                { reference: 'References would be furnished on demand.' }
            ]
        };
        console.log('Reset to default data completed');
    }

    populateFormFields() {
        console.log('=== POPULATE FORM FIELDS DEBUG ===');
        console.log('Current cvData:', this.cvData);
        console.log('Personal info:', this.cvData.personalInfo);
        
        // Populate personal info
        const personalInfo = this.cvData.personalInfo;
        if (personalInfo.fullName) {
            const fullNameInput = document.getElementById('fullName');
            if (fullNameInput) {
                fullNameInput.value = personalInfo.fullName;
                console.log('Set fullName to:', personalInfo.fullName);
            } else {
                console.error('fullName input not found');
            }
        }
        if (personalInfo.email) document.getElementById('email').value = personalInfo.email;
        if (personalInfo.address) document.getElementById('address').value = personalInfo.address;
        if (personalInfo.summary) document.getElementById('summary').value = personalInfo.summary;
        
        // Populate phone numbers
        this.populatePhoneFields();

        // Populate education fields
        this.populateEducationFields();
        
        // Populate experience fields
        this.populateExperienceFields();
        
        // Populate skills fields
        this.populateSkillsFields();
        
        // Populate languages fields
        this.populateLanguagesFields();
        
        // Populate hobbies fields
        this.populateHobbiesFields();
        
        // Populate other info fields
        this.populateOtherInfoFields();
        
        // Populate references fields
        this.populateReferencesFields();
        
        // Populate custom sections fields
        this.populateCustomSectionsFields();
    }

    populateEducationFields() {
        console.log('=== POPULATE EDUCATION FIELDS DEBUG ===');
        const educationList = document.getElementById('educationList');
        console.log('Education list element:', educationList);
        
        if (!educationList) {
            console.error('Education list element not found!');
            return;
        }

        // Clear existing education items
        educationList.innerHTML = '';
        console.log('Cleared existing education items');

        // Add education items from saved data
        console.log('CV data education:', this.cvData.education);
        if (this.cvData.education && this.cvData.education.length > 0) {
            console.log('Adding education items from saved data:', this.cvData.education.length);
            this.cvData.education.forEach((edu, index) => {
                console.log(`Adding education item ${index + 1}:`, edu);
                this.addEducationItem(edu);
            });
        } else {
            console.log('No saved education data, adding empty education item');
            // Add one empty education item
            this.addEducationItem();
        }
        console.log('=== END POPULATE EDUCATION FIELDS DEBUG ===');
    }

    addEducationItem(educationData = null) {
        console.log('=== ADD EDUCATION ITEM DEBUG ===');
        console.log('Education data passed:', educationData);
        
        const educationList = document.getElementById('educationList');
        console.log('Education list element:', educationList);
        
        if (!educationList) {
            console.error('Education list element not found in addEducationItem!');
            return;
        }
        
        const educationItem = document.createElement('div');
        educationItem.className = 'education-item';
        
        const degreeValue = educationData?.degree || '';
        const institutionValue = educationData?.institution || '';
        const yearValue = educationData?.year || '';
        const gradeValue = educationData?.grade || '';
        
        console.log('Education item values:', { degreeValue, institutionValue, yearValue, gradeValue });
        
        educationItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row">
                <label>Degree:</label>
                <input type="text" class="degree" placeholder="e.g., Bachelor of Science" value="${degreeValue}">
            </div>
            <div class="form-row">
                <label>Institution:</label>
                <input type="text" class="institution" placeholder="e.g., University Name" value="${institutionValue}">
            </div>
            <div class="form-row">
                <label>Year:</label>
                <input type="text" class="year" placeholder="e.g., 2023" value="${yearValue}">
            </div>
            <div class="form-row">
                <label>Grade/GPA:</label>
                <input type="text" class="grade" placeholder="e.g., 3.8/4.0" value="${gradeValue}">
            </div>
        `;

        // Add event listeners to new inputs
        const inputs = educationItem.querySelectorAll('input');
        console.log('Found inputs in education item:', inputs.length);
        inputs.forEach((input, index) => {
            console.log(`Adding event listener to input ${index + 1}:`, input);
            input.addEventListener('input', () => {
                console.log('Education input changed:', input.value);
                this.markAsChanged();
                this.updatePreview();
            });
        });

        educationList.appendChild(educationItem);
        console.log('Education item added to list');
        console.log('=== END ADD EDUCATION ITEM DEBUG ===');
    }

    populateExperienceFields() {
        const experienceList = document.getElementById('experienceList');
        if (!experienceList) return;

        // Clear existing experience items
        experienceList.innerHTML = '';

        // Add experience items from saved data
        if (this.cvData.experience && this.cvData.experience.length > 0) {
            this.cvData.experience.forEach(exp => {
                this.addExperienceItem(exp);
            });
        } else {
            // Add one empty experience item
            this.addExperienceItem();
        }
    }

    addExperienceItem(experienceData = null) {
        const experienceList = document.getElementById('experienceList');
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';
        experienceItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row">
                <label>Job Title:</label>
                <input type="text" class="jobTitle" placeholder="e.g., Software Developer" value="${experienceData?.jobTitle || ''}">
            </div>
            <div class="form-row">
                <label>Company:</label>
                <input type="text" class="company" placeholder="e.g., Tech Company" value="${experienceData?.company || ''}">
            </div>
            <div class="form-row">
                <label>Duration:</label>
                <input type="text" class="duration" placeholder="e.g., 2022-2023" value="${experienceData?.duration || ''}">
            </div>
            <div class="form-row">
                <label>Description:</label>
                <textarea class="description" placeholder="Press Enter for new line">${experienceData?.description || ''}</textarea>
            </div>
        `;

        // Add event listeners to new inputs
        const inputs = experienceItem.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
            
            // Add Enter key functionality for description textareas
            if (input.classList.contains('description')) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const cursorPos = input.selectionStart;
                        const textBefore = input.value.substring(0, cursorPos);
                        const textAfter = input.value.substring(input.selectionEnd);
                        
                        // Add only new line (no bullet point in form)
                        const newText = textBefore + '\n' + textAfter;
                        input.value = newText;
                        
                        // Set cursor position after the new line
                        const newCursorPos = cursorPos + 1; // 1 character for '\n'
                        input.setSelectionRange(newCursorPos, newCursorPos);
                        
                        this.markAsChanged();
                        this.updatePreview();
                    }
                });
            }
        });

        experienceList.appendChild(experienceItem);
    }

    populateSkillsFields() {
        const skillsList = document.getElementById('skillsList');
        if (!skillsList) return;

        // Check if there are already skills in the HTML with values
        const existingSkills = skillsList.querySelectorAll('.skill-item input.skill');
        const hasExistingSkills = Array.from(existingSkills).some(input => input.value.trim() !== '');

        // Only clear and repopulate if there are no existing skills with values
        if (!hasExistingSkills) {
            // Clear existing skills items
            skillsList.innerHTML = '';

            // Add skills items from saved data
            if (this.cvData.skills && this.cvData.skills.length > 0) {
                this.cvData.skills.forEach(skill => {
                    this.addSkillItem(skill);
                });
            } else {
                // Add default skills
                const defaultSkills = ['Communication Skills', 'Time Management', 'Hardworking', 'Accurate Planning'];
                defaultSkills.forEach(skill => {
                    this.addSkillItem({ skill: skill });
                });
            }
        }
    }

    addSkillItem(skillData = null) {
        const skillsList = document.getElementById('skillsList');
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <div class="form-row">
                <label>Skill:</label>
                <input type="text" class="skill" placeholder="e.g., JavaScript, Python, Communication" value="${skillData?.skill || ''}">
            </div>
        `;

        // Add event listener to new input
        const input = skillItem.querySelector('input');
        input.addEventListener('input', () => {
            this.markAsChanged();
            this.updatePreview();
        });

        skillsList.appendChild(skillItem);
    }

    populateLanguagesFields() {
        console.log('=== POPULATE LANGUAGES FIELDS DEBUG ===');
        console.log('Current cvData.languages:', this.cvData.languages);
        
        const languagesList = document.getElementById('languagesList');
        if (!languagesList) {
            console.error('Languages list element not found!');
            return;
        }

        // Clear existing languages items
        languagesList.innerHTML = '';
        console.log('Cleared existing languages items');

        // Add languages items from saved data
        if (this.cvData.languages && this.cvData.languages.length > 0) {
            console.log('Adding languages from saved data:', this.cvData.languages);
            this.cvData.languages.forEach((lang, index) => {
                console.log(`Adding language item ${index + 1}:`, lang);
                this.addLanguageItem(lang);
            });
        } else {
            console.log('No saved languages data, adding defaults');
            // Add default languages with blank levels
            const defaultLanguages = [
                { language: 'English', level: '' },
                { language: 'Urdu', level: '' },
                { language: 'Punjabi', level: '' }
            ];
            defaultLanguages.forEach(lang => {
                this.addLanguageItem(lang);
            });
        }
        console.log('=== END POPULATE LANGUAGES FIELDS DEBUG ===');
    }

    populateHobbiesFields() {
        console.log('=== POPULATE HOBBIES FIELDS DEBUG ===');
        const hobbiesList = document.getElementById('hobbiesList');
        if (!hobbiesList) {
            console.error('Hobbies list element not found!');
            return;
        }

        // Clear existing hobbies items
        hobbiesList.innerHTML = '';
        console.log('Cleared existing hobbies items');

        // Add hobbies items from saved data
        if (this.cvData.hobbies && this.cvData.hobbies.length > 0) {
            console.log('Adding hobbies items from saved data:', this.cvData.hobbies.length);
            this.cvData.hobbies.forEach((hobby, index) => {
                console.log(`Adding hobby item ${index + 1}:`, hobby);
                this.addHobbyItem(hobby);
            });
        } else {
            console.log('No saved hobbies data found');
        }
        console.log('=== END POPULATE HOBBIES FIELDS DEBUG ===');
    }

    populatePhoneFields() {
        console.log('=== POPULATE PHONE FIELDS DEBUG ===');
        const phoneList = document.getElementById('phoneList');
        if (!phoneList) {
            console.error('Phone list element not found!');
            return;
        }
        
        // Clear existing phone items
        phoneList.innerHTML = '';
        console.log('Cleared existing phone items');
        
        if (this.cvData.personalInfo.phones && this.cvData.personalInfo.phones.length > 0) {
            console.log('Adding phone items from saved data:', this.cvData.personalInfo.phones.length);
            this.cvData.personalInfo.phones.forEach((phone, index) => {
                console.log(`Adding phone item ${index + 1}:`, phone);
                this.addPhoneItem(phone);
            });
        } else {
            console.log('No saved phone data found, adding default phone item');
            this.addPhoneItem();
        }
        console.log('=== END POPULATE PHONE FIELDS DEBUG ===');
    }

    addHobbyItem(hobbyData = null) {
        const hobbiesList = document.getElementById('hobbiesList');
        const hobbyItem = document.createElement('div');
        hobbyItem.className = 'hobby-item';
        hobbyItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <input type="text" class="hobby" placeholder="e.g., Reading, Sports, Music" value="${hobbyData?.hobby || ''}">
        `;

        // Add event listeners to new inputs
        const inputs = hobbyItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });

        hobbiesList.appendChild(hobbyItem);
    }

    addLanguageItem(languageData = null) {
        console.log('=== ADD LANGUAGE ITEM DEBUG ===');
        console.log('Language data received:', languageData);
        console.log('Language value:', languageData?.language || '');
        console.log('Level value:', languageData?.level || '');
        
        const languagesList = document.getElementById('languagesList');
        const languageItem = document.createElement('div');
        languageItem.className = 'language-item';
        languageItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row language-inputs-row">
                <div class="input-group">
                    <label>Language:</label>
                    <input type="text" class="language" placeholder="e.g., English" value="${languageData?.language || ''}">
                </div>
                <div class="input-group">
                    <label>Level/Detail:</label>
                    <input type="text" class="languageLevel" placeholder="e.g., Native, Fluent, Intermediate" value="${languageData?.level || ''}">
                </div>
            </div>
        `;

        // Add event listeners to new inputs
        const inputs = languageItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });

        languagesList.appendChild(languageItem);
        console.log('Language item added to DOM');
        console.log('=== END ADD LANGUAGE ITEM DEBUG ===');
    }

    populateOtherInfoFields() {
        console.log('=== POPULATE OTHER INFO FIELDS DEBUG ===');
        const otherInfoList = document.getElementById('otherInfoList');
        if (!otherInfoList) {
            console.error('Other info list element not found!');
            return;
        }

        console.log('CV data otherInfo:', this.cvData.otherInfo);
        
        // Populate the standard fields with saved data
        if (this.cvData.otherInfo && this.cvData.otherInfo.length > 0) {
            // Find the standard fields data (first item with standard fields)
            const standardFields = this.cvData.otherInfo.find(info => 
                info.fatherName || info.husbandName || info.cnic || 
                info.dateOfBirth || info.maritalStatus || info.religion
            );
            
            if (standardFields) {
                console.log('Found standard fields data:', standardFields);
                // Populate the existing standard fields
                const fatherNameInput = otherInfoList.querySelector('.fatherName');
                const husbandNameInput = otherInfoList.querySelector('.husbandName');
                const cnicInput = otherInfoList.querySelector('.cnic');
                const dateOfBirthInput = otherInfoList.querySelector('.dateOfBirth');
                const maritalStatusSelect = otherInfoList.querySelector('.maritalStatus');
                const religionSelect = otherInfoList.querySelector('.religion');
                
                console.log('Found form elements:', { fatherNameInput, husbandNameInput, cnicInput, dateOfBirthInput, maritalStatusSelect, religionSelect });
                
                if (fatherNameInput) fatherNameInput.value = standardFields.fatherName || '';
                if (husbandNameInput) husbandNameInput.value = standardFields.husbandName || '';
                if (cnicInput) cnicInput.value = standardFields.cnic || '';
                if (dateOfBirthInput) dateOfBirthInput.value = standardFields.dateOfBirth || '';
                if (maritalStatusSelect) maritalStatusSelect.value = standardFields.maritalStatus || '';
                if (religionSelect) religionSelect.value = standardFields.religion || '';
                
                console.log('Populated standard fields with values');
            } else {
                console.log('No standard fields data found');
            }
            
            // Add additional custom fields from saved data
            const customFields = this.cvData.otherInfo.filter(info => 
                info.fieldName && info.fieldValue && 
                !info.fatherName && !info.husbandName && !info.cnic && 
                !info.dateOfBirth && !info.maritalStatus && !info.religion
            );
            
            customFields.forEach(info => {
                this.addOtherInfoItem(info);
            });
        } else {
            console.log('No otherInfo data to populate');
        }
        console.log('=== END POPULATE OTHER INFO FIELDS DEBUG ===');
    }

    populateReferencesFields() {
        console.log('=== POPULATE REFERENCES FIELDS DEBUG ===');
        const referencesList = document.getElementById('referencesList');
        if (!referencesList) {
            console.error('References list element not found!');
            return;
        }
        
        // Clear existing reference items
        referencesList.innerHTML = '';
        console.log('Cleared existing reference items');
        
        if (this.cvData.references && this.cvData.references.length > 0) {
            console.log('Adding reference items from saved data:', this.cvData.references.length);
            this.cvData.references.forEach((reference, index) => {
                console.log(`Adding reference item ${index + 1}:`, reference);
                this.addReferenceItem(reference);
            });
        } else {
            console.log('No saved reference data found, adding default reference item');
            this.addReferenceItem();
        }
        console.log('=== END POPULATE REFERENCES FIELDS DEBUG ===');
    }

    populateCustomSectionsFields() {
        console.log('=== POPULATE CUSTOM SECTIONS FIELDS DEBUG ===');
        const customSectionsList = document.getElementById('customSectionsList');
        if (!customSectionsList) {
            console.error('Custom sections list element not found!');
            return;
        }
        
        // Clear existing custom section items
        customSectionsList.innerHTML = '';
        console.log('Cleared existing custom section items');
        
        if (this.cvData.customSections && this.cvData.customSections.length > 0) {
            console.log('Adding custom section items from saved data:', this.cvData.customSections.length);
            this.cvData.customSections.forEach((section, sectionIndex) => {
                console.log(`Adding custom section ${sectionIndex + 1}:`, section);
                this.addCustomSectionItem(section);
            });
        } else {
            console.log('No saved custom sections data found');
        }
        console.log('=== END POPULATE CUSTOM SECTIONS FIELDS DEBUG ===');
    }

    addCustomSectionItem(customSectionData = null) {
        console.log('=== ADD CUSTOM SECTION ITEM DEBUG ===');
        console.log('Custom section data passed:', customSectionData);
        
        const customSectionsList = document.getElementById('customSectionsList');
        if (!customSectionsList) {
            console.error('Custom sections list element not found in addCustomSectionItem!');
            return;
        }
        
        const customSectionItem = document.createElement('div');
        customSectionItem.className = 'custom-section-item';
        
        const headingValue = customSectionData?.heading || '';
        const items = customSectionData?.items || [];
        
        console.log('Custom section item values:', { headingValue, itemsCount: items.length });
        
        let itemsHTML = '';
        if (items.length > 0) {
            itemsHTML = items.map(item => `
                <div class="custom-item">
                    <input type="text" class="customItemValue" placeholder="Enter item" value="${item.value || ''}">
                    <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
                </div>
            `).join('');
        } else {
            // Add one empty item
            itemsHTML = `
                <div class="custom-item">
                    <input type="text" class="customItemValue" placeholder="Enter item" value="">
                    <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
                </div>
            `;
        }
        
        customSectionItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row">
                <label>Section Heading:</label>
                <input type="text" class="customSectionHeading" placeholder="e.g., Certifications, Awards, Projects" value="${headingValue}">
            </div>
            <div class="custom-items-wrapper">
                ${itemsHTML}
                <button type="button" class="add-custom-item-btn" onclick="cvBuilder.addCustomItem(this)">+ Add Item</button>
            </div>
        `;
        
        // Add event listeners for Enter key navigation
        const inputs = customSectionItem.querySelectorAll('input');
        this.addEnterKeyNavigation(inputs);
        
        customSectionsList.appendChild(customSectionItem);
        console.log('=== END ADD CUSTOM SECTION ITEM DEBUG ===');
    }

    addOtherInfoItem(otherInfoData = null) {
        const otherInfoList = document.getElementById('otherInfoList');
        const otherInfoItem = document.createElement('div');
        otherInfoItem.className = 'other-info-item';
        otherInfoItem.innerHTML = `
            <button type="button" class="remove-btn" onclick="this.parentElement.remove(); cvBuilder.updatePreview();">×</button>
            <div class="form-row">
                <label>Field Name:</label>
                <select class="fieldName" onchange="this.nextElementSibling.placeholder = this.options[this.selectedIndex].dataset.placeholder || 'Enter value'">
                    <option value="">Select or type custom field</option>
                    <option value="Nationality" data-placeholder="e.g., Pakistani">Nationality</option>
                    <option value="Blood Group" data-placeholder="e.g., O+">Blood Group</option>
                    <option value="Passport No" data-placeholder="e.g., AB1234567">Passport No</option>
                    <option value="Driving License" data-placeholder="e.g., LHR-1234567">Driving License</option>
                    <option value="Emergency Contact" data-placeholder="e.g., +92-300-1234567">Emergency Contact</option>
                    <option value="LinkedIn Profile" data-placeholder="e.g., linkedin.com/in/username">LinkedIn Profile</option>
                    <option value="GitHub Profile" data-placeholder="e.g., github.com/username">GitHub Profile</option>
                    <option value="Website" data-placeholder="e.g., www.yourwebsite.com">Website</option>
                    <option value="Custom">Custom Field</option>
                </select>
            </div>
            <div class="form-row">
                <label>Field Value:</label>
                <input type="text" class="fieldValue" placeholder="Enter value" value="${otherInfoData?.fieldValue || ''}">
            </div>
        `;

        // Add event listeners to new inputs and selects
        const inputs = otherInfoItem.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.markAsChanged();
                this.updatePreview();
            });
            input.addEventListener('change', () => {
                this.markAsChanged();
                this.updatePreview();
            });
        });

        otherInfoList.appendChild(otherInfoItem);
    }

    markAsChanged() {
        console.log('markAsChanged() called - setting hasUnsavedChanges to true');
        this.hasUnsavedChanges = true;
        this.updateSaveIndicator('unsaved');
        
        // Force save after 5 seconds of inactivity (debounced save) - increased from 2 seconds
        clearTimeout(this.debouncedSave);
        this.debouncedSave = setTimeout(() => {
            if (this.hasUnsavedChanges && !this.isSaving) {
                console.log('Debounced save triggered');
                this.saveData();
            }
        }, 5000); // Increased from 2000ms to 5000ms
    }

    // Force save method for critical moments
    forceSave() {
        console.log('Force save requested');
        this.collectFormData();
        this.saveData();
    }

    // Emergency clear localStorage if quota is still exceeded
    emergencyClearStorage() {
        try {
            console.log('Emergency localStorage clear initiated...');
            const keys = Object.keys(localStorage);
            const cvKeys = keys.filter(key => key.startsWith('cvBuilder_savedData_'));
            
            // Keep only the current user's data
            const user = AuthSystem.getCurrentUser();
            if (user) {
                const currentUserKey = `cvBuilder_savedData_${user.id}`;
                cvKeys.forEach(key => {
                    if (key !== currentUserKey) {
                        localStorage.removeItem(key);
                        console.log('Removed:', key);
                    }
                });
            }
            
            // Clear all other non-essential data
            keys.forEach(key => {
                if (!key.startsWith('cvBuilder_savedData_') && 
                    !key.startsWith('cvBuilder_users') && 
                    !key.startsWith('cvBuilder_auth')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('Emergency clear completed');
        } catch (error) {
            console.error('Error during emergency clear:', error);
        }
    }

    // Try to recover user session
    tryRecoverSession() {
        try {
            console.log('Attempting to recover user session...');
            
            // Check if there's any user data in localStorage
            const users = JSON.parse(localStorage.getItem('cvBuilder_users') || '[]');
            if (users.length > 0) {
                // Try to find the most recent user or admin
                const adminUser = users.find(u => u.role === 'admin');
                const lastUser = users[users.length - 1];
                const userToRecover = adminUser || lastUser;
                
                if (userToRecover) {
                    console.log('Recovering session for user:', userToRecover.name);
                    localStorage.setItem('cvBuilder_user', JSON.stringify(userToRecover));
                    localStorage.setItem('cvBuilder_auth', 'true');
                    
                    // Try to save data again
                    setTimeout(() => {
                        this.saveData();
                    }, 100);
                } else {
                    console.error('No users found to recover session');
                    this.updateSaveIndicator('error');
                }
            } else {
                console.error('No user data found in localStorage');
                this.updateSaveIndicator('error');
            }
        } catch (error) {
            console.error('Error during session recovery:', error);
            this.updateSaveIndicator('error');
        }
    }

    // Ensure user session is maintained
    ensureUserSession() {
        try {
            const user = AuthSystem.getCurrentUser();
            if (!user) {
                console.log('No user session found, attempting to recover...');
                this.tryRecoverSession();
            } else {
                console.log('User session found:', user.name);
            }
        } catch (error) {
            console.error('Error checking user session:', error);
        }
    }

    initializeSaveIndicator() {
        // Create save indicator element
        let indicator = document.getElementById('saveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.className = 'save-indicator';
            
            // Add to user-info container for proper alignment
            const userInfo = document.getElementById('userInfo');
            if (userInfo) {
                userInfo.insertBefore(indicator, userInfo.firstChild);
                console.log('Save indicator added to user-info');
            } else {
                console.error('User info container not found for save indicator');
            }
        }
        
        // Show initial status
        this.updateSaveIndicator('new');
    }


    updateSaveIndicator(status) {
        console.log('updateSaveIndicator called with status:', status);
        // Get existing save indicator
        let indicator = document.getElementById('saveIndicator');
        if (!indicator) {
            console.error('Save indicator not found, initializing...');
            this.initializeSaveIndicator();
            indicator = document.getElementById('saveIndicator');
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString();

        switch (status) {
            case 'saved':
                indicator.innerHTML = `
                    <span class="save-status saved">💾 CV Saved at ${timeStr}</span>
                `;
                break;
            case 'unsaved':
                indicator.innerHTML = `
                    <span class="save-status unsaved">● Unsaved changes</span>
                `;
                break;
            case 'loading':
                indicator.innerHTML = `
                    <span class="save-status loading">⏳ Loading CV...</span>
                `;
                break;
            case 'loaded':
                indicator.innerHTML = `
                    <span class="save-status loaded">✓ CV Loaded (Last saved: ${this.lastSaved ? this.lastSaved.toLocaleString() : 'Unknown'})</span>
                `;
                break;
            case 'new':
                indicator.innerHTML = `
                    <span class="save-status new">📄 New CV Document</span>
                `;
                break;
            case 'error':
                indicator.innerHTML = `
                    <span class="save-status error">⚠️ Save Error - Check Console for Details</span>
                `;
                break;
        }
    }
}

// Initialize the CV Builder when the page loads
let cvBuilder;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing CV Builder');
    try {
    cvBuilder = new CVBuilder();
        console.log('CV Builder initialized successfully');
    } catch (error) {
        console.error('Error initializing CV Builder:', error);
    }
});
