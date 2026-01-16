import { useState, useEffect, useRef, useCallback } from 'react';
import { cvService, authService, supabase } from './supabase';
import { dbHelpers } from './database';

const useAutoSave = (formData, saveInterval = 10000) => {
  const [autoSaveStatus, setAutoSaveStatus] = useState('Ready');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Try to restore currentCVId from localStorage on mount
  const [currentCVId, setCurrentCVId] = useState(() => {
    const savedCVId = localStorage.getItem('currentCVId');
    return savedCVId || null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const lastSavedDataRef = useRef(null);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    console.log('Auto-save triggered:', { hasUnsavedChanges, name: formData.name?.trim() });
    
    if (!formData.name?.trim()) {
      console.log('Auto-save skipped - no name provided');
      return;
    }

    // Check if data has changed since last save
    const { profileImage, ...formDataForComparison } = formData;
    const currentDataString = JSON.stringify(formDataForComparison);
    
    // Special check for profileImage changes
    const hasProfileImageChanged = formData.profileImage && 
      (formData.profileImage instanceof File || 
       (formData.profileImage.data && formData.profileImage.data !== lastSavedDataRef.current?.profileImageData));
    
    console.log('Change detection:', {
      hasProfileImageChanged,
      profileImageType: formData.profileImage?.constructor?.name,
      isFile: formData.profileImage instanceof File,
      hasData: !!formData.profileImage?.data,
      lastSavedProfileImage: !!lastSavedDataRef.current?.profileImageData
    });
    
    if (lastSavedDataRef.current?.dataString === currentDataString && !hasProfileImageChanged) {
      console.log('Auto-save skipped - no changes since last save');
      return;
    }

    try {
      setAutoSaveStatus('Saving...');
      console.log('Starting auto-save process...');
      
      // Get current user
      const user = await authService.getCurrentUser();
      console.log('Current user:', user);
      
      if (!user) {
        console.log('No authenticated user found');
        setAutoSaveStatus('Please log in to save');
        // Keep status visible for errors
        return;
      }

      // Test Supabase connection
      console.log('Testing Supabase connection...');
      try {
        const { error: testError } = await supabase
          .from('cvs')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('Supabase connection test failed:', testError);
          setAutoSaveStatus('Database connection failed: ' + testError.message);
          // Keep status visible for errors
          return;
        }
        console.log('Supabase connection test successful');
      } catch (testErr) {
        console.error('Supabase connection test error:', testErr);
        setAutoSaveStatus('Database connection test failed: ' + testErr.message);
        // Keep status visible for errors
        return;
      }

      // Check if user is admin for update operations
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('email', user.email)
        .single();
      
      const isAdmin = userData?.is_admin || false;

      // Format CV data for database
      const cvData = await dbHelpers.formatCVData(formData);
      cvData.template_id = 'template1'; // Default template
      
      let savedCV;
      if (currentCVId) {
        // Fetch the original CV to preserve its user_id
        const originalCV = await cvService.getCV(currentCVId, user.id, isAdmin);
        if (originalCV) {
          // Preserve the original user_id when updating (important for admins editing user CVs)
          cvData.user_id = originalCV.user_id;
        } else {
          // Fallback: use current user's ID if CV not found
          cvData.user_id = user.id;
        }
        
        // Update existing CV
        savedCV = await cvService.updateCV(currentCVId, cvData, user.id, isAdmin);
        // Ensure currentCVId is stored in localStorage
        localStorage.setItem('currentCVId', currentCVId);
      } else {
        // For new CVs, set user_id to current user's ID
        cvData.user_id = user.id;
        // Check if a CV with the same name already exists to prevent duplicates
        const existingCV = await cvService.findCVByName(user.id, cvData.name, isAdmin);
        
        if (existingCV) {
          // Update existing CV instead of creating a new one
          savedCV = await cvService.updateCV(existingCV.id, cvData, user.id, isAdmin);
          setCurrentCVId(existingCV.id);
          // Store currentCVId in localStorage
          localStorage.setItem('currentCVId', existingCV.id);
        } else {
          // Create new CV only if no existing CV found
          savedCV = await cvService.createCV(cvData);
          setCurrentCVId(savedCV.id);
          // Store currentCVId in localStorage
          localStorage.setItem('currentCVId', savedCV.id);
        }
      }
      
      // Update last saved data reference
      const { profileImage: _, ...formDataForComparison } = formData;
      lastSavedDataRef.current = {
        dataString: JSON.stringify(formDataForComparison),
        profileImageData: formData.profileImage?.data || null
      };
      setHasUnsavedChanges(false);
      setAutoSaveStatus('Saved');
      
      // Keep status visible - don't clear it
    } catch (err) {
      console.error('Auto-save error:', err);
      console.error('Error details:', err.message, err.details, err.hint);
      setAutoSaveStatus('Auto-save failed: ' + err.message);
      // Keep status visible for errors
    }
  }, [formData, currentCVId, hasUnsavedChanges]);

  // Monitor authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        // Silently handle auth session errors
        if (error?.message !== 'Auth session missing!' && error?.name !== 'AuthSessionMissingError') {
          console.error('Unexpected auth error in useAutoSave:', error);
        }
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Try to find and set currentCVId when formData has a name but currentCVId is null
  // This prevents creating duplicates when form loads from localStorage
  useEffect(() => {
    const findAndSetCVId = async () => {
      // Only run if we have a name but no currentCVId
      if (!formData.name?.trim() || currentCVId || !isAuthenticated) {
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin')
          .eq('email', user.email)
          .single();
        
        const isAdmin = userData?.is_admin || false;

        // Try to find existing CV with this exact name
        const existingCV = await cvService.findCVByName(user.id, formData.name, isAdmin);
        
        if (existingCV) {
          setCurrentCVId(existingCV.id);
          // Store currentCVId in localStorage
          localStorage.setItem('currentCVId', existingCV.id);
        }
      } catch (error) {
        console.error('Error finding CV by name on form load:', error);
      }
    };

    findAndSetCVId();
  }, [formData.name, currentCVId, isAuthenticated]);

  // Set up auto-save interval
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Auto-save interval stopped - user not authenticated');
      return;
    }
    
    const interval = setInterval(async () => {
      console.log('Auto-save interval check:', { 
        hasUnsavedChanges, 
        name: formData.name?.trim(),
        currentCVId,
        formDataKeys: Object.keys(formData)
      });
      
      // Double-check authentication before auto-save
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          console.log('Auto-save skipped - user not authenticated');
          setIsAuthenticated(false);
          return;
        }
      } catch (error) {
        console.log('Auto-save skipped - authentication check failed:', error.message);
        setIsAuthenticated(false);
        return;
      }
      
      if (formData.name?.trim()) {
        console.log('Auto-save conditions met - triggering save');
        autoSave();
      } else {
        console.log('Auto-save skipped - no name provided');
      }
    }, saveInterval);

    return () => clearInterval(interval);
  }, [formData, saveInterval, isAuthenticated, autoSave, hasUnsavedChanges, currentCVId]);

  // Removed localStorage loading - form data will reset on page reload

  // Removed localStorage saving on page unload - form data will reset on page reload


  // Clear draft function
  const clearDraft = () => {
    setHasUnsavedChanges(false);
    setAutoSaveStatus('Saved');
  };

  // Mark as changed
  const markAsChanged = () => {
    console.log('markAsChanged called - setting hasUnsavedChanges to true');
    setHasUnsavedChanges(true);
  };

  // Load CV data from Supabase
  const loadCV = async (cvId) => {
    try {
      // Get current user to ensure we only load user's own CVs
      const user = await authService.getCurrentUser();
      if (!user) {
        console.error('❌ No authenticated user found');
        return null;
      }
      
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('email', user.email)
        .single();
      
      const isAdmin = userData?.is_admin || false;
      
      const cvData = await cvService.getCV(cvId, user.id, isAdmin);
      setCurrentCVId(cvId);
      // Store currentCVId in localStorage to persist across page refreshes
      localStorage.setItem('currentCVId', cvId);
      const formData = dbHelpers.extractFormData(cvData);
      return formData;
    } catch (err) {
      console.error('❌ Error loading CV:', err);
      return null;
    }
  };

  // Create new CV
  const createNewCV = () => {
    setCurrentCVId(null);
    // Clear currentCVId from localStorage when creating new CV
    localStorage.removeItem('currentCVId');
    setHasUnsavedChanges(false);
    setAutoSaveStatus('Ready');
    // Clear the last saved data reference to ensure new CV starts fresh
    lastSavedDataRef.current = null;
  };

  return {
    autoSaveStatus,
    hasUnsavedChanges,
    currentCVId,
    clearDraft,
    markAsChanged,
    loadCV,
    createNewCV
  };
};

export default useAutoSave;
