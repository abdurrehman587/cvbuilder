import React, { useState, useEffect } from 'react';
import './App.css';
import { SupabaseProvider, AdminPanel } from './components/Supabase';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Form1 from './components/template1/Form1';
import Preview1 from './components/template1/Preview1';
import Form2 from './components/template2/Form2';
import Preview2 from './components/template2/Preview2';
import useAutoSave from './components/Supabase/useAutoSave';
import { authService } from './components/Supabase/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [currentView, setCurrentView] = useState('dashboard');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    professionalSummary: '',
    education: [],
    experience: [],
    skills: ['Communication Skills', 'Time Management', 'Problem Solving', 'Hardworking'],
    certifications: [],
    languages: [],
    hobbies: [],
    references: []
  });
  // Local state for UI (will be overridden by hook)
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  // Use the useAutoSave hook for Supabase integration
  const { 
    autoSaveStatus: hookAutoSaveStatus, 
    hasUnsavedChanges: hookHasUnsavedChanges, 
    currentCVId,
    loadCV,
    createNewCV,
    markAsChanged: hookMarkAsChanged
  } = useAutoSave(formData);

  // Debug: Log hook status
  console.log('App.js - Hook status:', { 
    hookAutoSaveStatus, 
    hookHasUnsavedChanges, 
    currentCVId,
    formDataName: formData.name 
  });


  // Load saved draft on component mount
  // Removed localStorage loading - form data will reset on page reload

  // Removed localStorage saving on page unload - form data will reset on page reload

  // Auto-save happens automatically every 10 seconds

  // Mark as changed - using hook's markAsChanged instead

  // Update form data
  const updateFormData = (newData) => {
    setFormData(newData);
    hookMarkAsChanged(); // Use hook's markAsChanged instead of local state
  };

  // Handle "Make a new CV" button
  const handleMakeNewCV = () => {
    const newFormData = {
      name: '',
      position: '',
      phone: '',
      email: '',
      address: '',
      professionalSummary: '',
      education: [],
      experience: [],
      skills: ['Communication Skills', 'Time Management', 'Problem Solving', 'Hardworking'],
      certifications: [],
      languages: [],
      hobbies: [],
      references: []
    };
    setFormData(newFormData);
    setHasUnsavedChanges(false);
    setAutoSaveStatus('');
    setFormResetKey(prev => prev + 1); // Force form re-render
    createNewCV(); // Reset the hook state
    setCurrentView('cv-builder'); // Ensure we're in the CV builder view
  };

  useEffect(() => {
    // Check authentication status on mount only
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log('Error checking auth:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for authentication events from Login component
    const handleAuth = () => {
      setIsAuthenticated(true);
      setIsLoading(false);
      // If user was on form/preview page, redirect to dashboard after login
      if (currentView === 'cv-builder') {
        setCurrentView('dashboard');
      }
    };

    window.addEventListener('userAuthenticated', handleAuth);
    
    return () => {
      window.removeEventListener('userAuthenticated', handleAuth);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not on currentView changes - intentionally excluded to prevent logout on view change

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('cvBuilderAuth');
      setIsAuthenticated(false);
      setIsLoading(false);
      // Reset to dashboard view so when user logs back in, they go to dashboard
      setCurrentView('dashboard');
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setCurrentView('cv-builder');
    // Don't reset form data - preserve it when switching templates
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Handle template switching without resetting form data
  const handleTemplateSwitch = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handleEditCV = async (cv) => {
    console.log('App.js - CV selected for editing:', cv);
    // Load the CV data and switch to CV builder view
    if (cv && cv.id) {
      try {
        // Use the loadCV function from the hook to properly set currentCVId
        const loadedFormData = await loadCV(cv.id);
        if (loadedFormData) {
          setFormData(loadedFormData);
          setCurrentView('cv-builder');
          setSelectedTemplate(cv.template_id || 'template1');
          console.log('CV loaded for editing, currentCVId should be set in hook');
        } else {
          console.error('Failed to load CV data for ID:', cv.id);
          alert('Failed to load CV data. Please try again.');
        }
      } catch (error) {
        console.error('Error loading CV for editing:', error);
        alert('An error occurred while loading the CV. Please try again.');
      }
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Checking authentication...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (currentView === 'dashboard') {
    return (
      <Dashboard 
        onTemplateSelect={handleTemplateSelect}
        onLogout={handleLogout}
        onEditCV={handleEditCV}
        onCreateNewCV={handleMakeNewCV}
      />
    );
  }

  if (currentView === 'admin') {
    return <AdminPanel />;
  }

  if (currentView === 'cv-builder') {
    return (
      <div className="App">
        <div className="app-header">
          <h1>CV Builder</h1>
          
          <div className="template-selector">
            <button 
              className={`template-button ${selectedTemplate === 'template1' ? 'active' : ''}`}
              onClick={() => handleTemplateSwitch('template1')}
            >
              Template 1
            </button>
            <button 
              className={`template-button ${selectedTemplate === 'template2' ? 'active' : ''}`}
              onClick={() => handleTemplateSwitch('template2')}
            >
              Template 2
            </button>
          </div>
          
          <div className="header-actions">
            <div className="auto-save-status">
              {hookAutoSaveStatus && (
                <span className={`status-indicator ${hookAutoSaveStatus.includes('failed') ? 'error' : 'success'}`}>
                  {hookAutoSaveStatus}
                </span>
              )}
              {hookHasUnsavedChanges && !hookAutoSaveStatus && (
                <span className="status-indicator warning">
                  Unsaved changes
                </span>
              )}
              {!hookAutoSaveStatus && !hookHasUnsavedChanges && (
                <span className="status-indicator success">
                  All changes saved
                </span>
              )}
            </div>
            <button onClick={handleBackToDashboard} className="back-to-dashboard-button">
              Back to Dashboard
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
        <div className="container">
          {/* Form Side */}
                    {selectedTemplate === 'template1' ? 
                      <Form1 
                        key={formResetKey}
                        formData={formData}
                        updateFormData={updateFormData}
                        markAsChanged={hookMarkAsChanged}
                      /> : 
                      <Form2 
                        key={formResetKey}
                        formData={formData}
                        updateFormData={updateFormData}
                        markAsChanged={hookMarkAsChanged}
                      />
                    }

          {/* Preview Side */}
          {selectedTemplate === 'template1' ? 
            <Preview1 
              formData={formData}
              autoSaveStatus={autoSaveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
            /> : 
            <Preview2 
              formData={formData}
              autoSaveStatus={autoSaveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          }
        </div>
      </div>
    );
  }

  return null;
}

// Wrap the entire app with SupabaseProvider
function AppWithSupabase() {
  return (
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  );
}

export default AppWithSupabase;