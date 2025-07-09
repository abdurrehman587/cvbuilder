import React, { useState, useEffect } from 'react';
import supabase from './supabase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Form.css';

// Fallback toast function in case react-toastify fails
const fallbackToast = (message, type = 'info') => {
  console.log(`[FALLBACK TOAST] ${type.toUpperCase()}: ${message}`);
  // Create a simple alert as fallback
  alert(`${type.toUpperCase()}: ${message}`);
};

// Enhanced toast function with fallback
const safeToast = {
  success: (message) => {
    try {
      toast.success(message);
    } catch (error) {
      console.error('Toast error:', error);
      fallbackToast(message, 'success');
    }
  },
  error: (message) => {
    try {
      toast.error(message);
    } catch (error) {
      console.error('Toast error:', error);
      fallbackToast(message, 'error');
    }
  },
  info: (message) => {
    try {
      toast.info(message);
    } catch (error) {
      console.error('Toast error:', error);
      fallbackToast(message, 'info');
    }
  }
};

const initialEntry = '';

const fixedLanguages = ['English', 'Urdu', 'Punjabi'];

const defaultFormData = {
  image: null,
  imageUrl: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  objective: ['Seeking a challenging position where I can develop my education skills further and become a valuable team member.'],
  education: [{ degree: '', institute: '', year: '' }],
  workExperience: [{ company: '', designation: '', duration: '', details: '' }],

  skills: [
    { name: 'Communication', percentage: '90%' },
    { name: 'Hardworking', percentage: '95%' },
    { name: 'Time Management', percentage: '95%' },
    { name: 'Accurate Planning', percentage: '80%' },
  ],
  certifications: [''],
  projects: [''],
  languages: ['English', 'Urdu', 'Punjabi'],
  customLanguages: [],
  hobbies: [''],
  customSections: [],
  cv_references: ['References would be furnished on demand'],
  otherInformation: [
    { id: 1, labelType: 'radio', label: "Father's Name:", checked: true, value: '', name: 'parentSpouse', radioValue: 'father' },
    { id: 2, labelType: 'radio', label: "Husband's Name:", checked: false, value: '', name: 'parentSpouse', radioValue: 'husband' },
    { id: 3, labelType: 'checkbox', label: 'CNIC:', checked: true, value: '', isCustom: false },
    { id: 4, labelType: 'checkbox', label: 'Date of Birth:', checked: true, value: '', isCustom: false },
    { id: 5, labelType: 'checkbox', label: 'Marital Status:', checked: true, value: '', isCustom: false },
    { id: 6, labelType: 'checkbox', label: 'Religion:', checked: true, value: '', isCustom: false },
  ],
};



const Form = ({ formData, setFormData, onChange, user, isAdminAccess = false, onCVLoaded }) => {
  console.log('Form component rendered with formData:', formData);
  console.log('Form - cv_references:', formData?.cv_references);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (!formData) {
      setFormData(defaultFormData);
    }
  }, [formData, setFormData]);


  useEffect(() => {
    if (formData && onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  // Fetch user's CV on mount or when user changes
  useEffect(() => {
    const fetchUserCV = async () => {
      if (!user || !user.email) return;
      
      console.log('Fetching CV for user:', user.email);
      console.log('User object:', user);
      console.log('Admin access:', localStorage.getItem('admin_cv_access'));
      
      // Check if user is admin or regular user
      const isAdmin = user.isAdmin || localStorage.getItem('admin_cv_access') === 'true';
      console.log('Is admin user:', isAdmin);
      
      if (isAdmin) {
        // For admin users, fetch from admin_cvs table
        const { data, error } = await supabase
          .from('admin_cvs')
          .select('*')
          .eq('admin_email', user.email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching admin CV:', error);
          return;
        }

        if (data) {
          console.log('Admin CV data loaded:', data);
          console.log('Admin CV - references field from database:', data.cv_references);
          setFormData({
            image: null,
            imageUrl: data.image_url || '',
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            objective: data.objective || [],
            education: data.education || [],
            workExperience: data.work_experience || [],
            skills: data.skills || [],
            certifications: data.certifications || [],
            projects: data.projects || [],
            languages: data.languages || [],
            customLanguages: [],
            hobbies: data.hobbies || [],
            customSections: data.custom_sections || [],
            cv_references: data.cv_references || ['References would be furnished on demand'],
            otherInformation: data.other_information || [],
          });
          
          if (onCVLoaded) {
            onCVLoaded(true);
          }
        } else {
          console.log('No existing admin CV found for user:', user.email);
          // Initialize with default data when no existing CV is found
          setFormData(defaultFormData);
          if (onCVLoaded) {
            onCVLoaded(false);
          }
        }
      } else {
        // For regular users, fetch from user_cvs table
        const { data, error } = await supabase
          .from('user_cvs')
          .select('*')
          .eq('user_email', user.email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user CV:', error);
          return;
        }

        if (data) {
          console.log('User CV data loaded:', data);
          console.log('User CV - references field from database:', data.cv_references);
          setFormData({
            image: null,
            imageUrl: data.image_url || '',
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            objective: data.objective || [],
            education: data.education || [],
            workExperience: data.work_experience || [],
            skills: data.skills || [],
            certifications: data.certifications || [],
            projects: data.projects || [],
            languages: data.languages || [],
            customLanguages: [],
            hobbies: data.hobbies || [],
            customSections: data.custom_sections || [],
            cv_references: data.cv_references || ['References would be furnished on demand'],
            otherInformation: data.other_information || [],
          });
          
          if (onCVLoaded) {
            onCVLoaded(true);
          }
        } else {
          console.log('No existing user CV found for user:', user.email);
          // Initialize with default data when no existing CV is found
          setFormData(defaultFormData);
          if (onCVLoaded) {
            onCVLoaded(false);
          }
        }
      }
    };
    fetchUserCV();
  }, [user]);

  // Live search functionality
  useEffect(() => {
    const performLiveSearch = async () => {
      if (!isAdminAccess) return;
      
      // Only search if there's at least 2 characters in name or phone
      if ((!searchName || searchName.length < 2) && (!searchPhone || searchPhone.length < 2)) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      setShowSearchResults(true);

      try {
        // Search in both user_cvs and admin_cvs tables
        let userQuery = supabase.from('user_cvs').select('*').limit(10);
        let adminQuery = supabase.from('admin_cvs').select('*').limit(10);

        if (searchName && searchName.length >= 2) {
          userQuery = userQuery.ilike('name', `%${searchName}%`);
          adminQuery = adminQuery.ilike('name', `%${searchName}%`);
        }

        if (searchPhone && searchPhone.length >= 2) {
          // Clean the search phone number (remove all non-digit characters)
          const cleanSearchPhone = searchPhone.replace(/\D/g, '');
          
          // Search for phone numbers that contain the cleaned digits
          userQuery = userQuery.or(`phone.ilike.%${searchPhone}%,phone.ilike.%${cleanSearchPhone}%`);
          adminQuery = adminQuery.or(`phone.ilike.%${searchPhone}%,phone.ilike.%${cleanSearchPhone}%`);
        }

        // Execute both queries
        const [userResult, adminResult] = await Promise.all([
          userQuery,
          adminQuery
        ]);

        if (userResult.error) {
          console.error("User CV search error:", userResult.error);
        }

        if (adminResult.error) {
          console.error("Admin CV search error:", adminResult.error);
        }

        // Combine results
        const allResults = [
          ...(userResult.data || []),
          ...(adminResult.data || [])
        ];

        setSearchResults(allResults);
      } catch (error) {
        console.error("Live search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(performLiveSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchName, searchPhone, isAdminAccess]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('[data-search-container]');
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);



  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleWorkExperienceChange = (index, field, value) => {
    const updated = [...formData.workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, workExperience: updated });
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...formData.education];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, education: updated });
  };

  const handleAddEducation = () => {
    setFormData({ ...formData, education: [...formData.education, { degree: '', institute: '', year: '' }] });
  };

  const handleRemoveEducation = (index) => {
    const updated = [...formData.education];
    if (updated.length > 1) {
      updated.splice(index, 1);
      setFormData({ ...formData, education: updated });
    }
  };

  const handleArrayChange = (field, index, value, type) => {
    const updated = [...formData[field]];
    if (field === 'skills' && type) {
      updated[index] = { ...updated[index], [type]: value };
    } else if (field === 'customLanguages' && type === 'name') {
      updated[index] = { ...updated[index], name: value };
    } else if (field === 'otherInformation') {
      updated[index] = { ...updated[index], [type]: value };
    } else {
      updated[index] = value;
    }
    setFormData({ ...formData, [field]: updated });
  };

  const handleAddEntry = (field) => {
    if (field === 'workExperience') {
      setFormData({ ...formData, workExperience: [...formData.workExperience, { company: '', designation: '', duration: '' }] });
    } else if (field === 'skills') {
      setFormData({ ...formData, skills: [...formData.skills, { name: '', percentage: '' }] });
    } else if (field === 'customLanguages') {
      setFormData({ ...formData, customLanguages: [...formData.customLanguages, { name: '', selected: true }] });
    } else if (field === 'otherInformation') {
      const newId = formData.otherInformation.length > 0 ? Math.max(...formData.otherInformation.map(oi => oi.id)) + 1 : 1;
      setFormData({
        ...formData,
        otherInformation: [
          ...formData.otherInformation,
          { id: newId, labelType: 'checkbox', label: '', checked: true, value: '', isCustom: true },
        ]
      });
    } else if (field === 'cv_references') {
      setFormData({ ...formData, [field]: [...formData[field], 'References would be furnished on demand'] });
    } else {
      setFormData({ ...formData, [field]: [...formData[field], initialEntry] });
    }
  };

  const handleRemoveEntry = (field, index) => {
    const updated = [...formData[field]];
    if (updated.length > 1) {
      updated.splice(index, 1);
      setFormData({ ...formData, [field]: updated });
    }
  };

  const handleRadioChange = (index, radioValue) => {
    const updated = formData.otherInformation.map(item => {
      if (item.labelType === 'radio') {
        return { ...item, checked: item.radioValue === radioValue };
      }
      return item;
    });
    setFormData({ ...formData, otherInformation: updated });
  };

  const handleCheckboxChange = (index) => {
    const updated = [...formData.otherInformation];
    updated[index].checked = !updated[index].checked;
    setFormData({ ...formData, otherInformation: updated });
  };

  const handleOtherInfoValueChange = (index, value) => {
    const updated = [...formData.otherInformation];
    updated[index].value = value;
    setFormData({ ...formData, otherInformation: updated });
  };

  const handleOtherInfoLabelChange = (index, value) => {
    const updated = [...formData.otherInformation];
    updated[index].label = value;
    setFormData({ ...formData, otherInformation: updated });
  };

  const handleLanguageCheckboxChange = (language) => {
    let updatedLanguages = [...formData.languages];
    if (updatedLanguages.includes(language)) {
      updatedLanguages = updatedLanguages.filter(lang => lang !== language);
    } else {
      updatedLanguages.push(language);
    }
    setFormData({ ...formData, languages: updatedLanguages });
  };

  const handleCustomLanguageCheckboxChange = (index) => {
    const updated = [...formData.customLanguages];
    updated[index].selected = !updated[index].selected;
    setFormData({ ...formData, customLanguages: updated });
  };

  const handleCustomLanguageChange = (index, value) => {
    const updated = [...formData.customLanguages];
    updated[index].name = value;
    setFormData({ ...formData, customLanguages: updated });
  };

  const handleCustomSectionChange = (index, field, value) => {
    const updated = [...formData.customSections];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, customSections: updated });
  };

  const handleAddCustomSection = () => {
    setFormData({ 
      ...formData, 
      customSections: [...formData.customSections, { heading: '', details: [''] }] 
    });
  };

  const handleRemoveCustomSection = (index) => {
    const updated = [...formData.customSections];
    updated.splice(index, 1);
    setFormData({ ...formData, customSections: updated });
  };

  const handleCustomSectionDetailChange = (sectionIndex, detailIndex, value) => {
    const updated = [...formData.customSections];
    updated[sectionIndex].details[detailIndex] = value;
    setFormData({ ...formData, customSections: updated });
  };

  const handleAddCustomSectionDetail = (sectionIndex) => {
    const updated = [...formData.customSections];
    updated[sectionIndex].details.push('');
    setFormData({ ...formData, customSections: updated });
  };

  const handleRemoveCustomSectionDetail = (sectionIndex, detailIndex) => {
    const updated = [...formData.customSections];
    updated[sectionIndex].details.splice(detailIndex, 1);
    setFormData({ ...formData, customSections: updated });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const uploadImage = async (file) => {
    try {
      if (!file) {
        console.error('No file selected for upload.');
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Uploading image to cv-images:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('cv-images') // <-- updated bucket name
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        return null;
      }

      const { data: urlData, error: urlError } = supabase.storage
        .from('cv-images') // <-- updated bucket name
        .getPublicUrl(filePath);

      if (urlError || !urlData?.publicUrl) {
        console.error('Failed to get public URL:', urlError || 'No URL returned');
        return null;
      }

      console.log('Image uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Unexpected error during image upload:', error);
      return null;
    }
  };




  const handleSave = async () => {
    try {
      console.log('=== SAVE CV START ===');
      console.log('App version check - Form.js loaded at:', new Date().toISOString());
      console.log('User:', user);
      console.log('Form data:', formData);
      
      // Test toast to see if the system is working
      console.log('Testing toast system...');
      safeToast.info('Save operation started...');
      
      let result; // Declare result variable
      let existingCV = null; // Declare existingCV variable
      
      // Ensure user is present
      if (!user) {
        safeToast.error('You must be signed in to save your CV.');
        return;
      }

      let imageUrl = formData.imageUrl;

      // Upload image if present
      if (formData.image) {
        const uploadedUrl = await uploadImage(formData.image);
        if (!uploadedUrl) {
          toast.error('Image upload failed. Please try again.');
          return;
        }
        imageUrl = uploadedUrl;
      }

      // Check if user is admin or regular user
      const isAdmin = user.isAdmin || localStorage.getItem('admin_cv_access') === 'true';
      console.log('Is admin user:', isAdmin);
      
      if (isAdmin) {
        // For admin users, save to admin_cvs table
        const payload = {
          admin_email: user.email,
          cv_name: formData.name || 'Unnamed CV',
          image_url: imageUrl && imageUrl.startsWith('http') ? imageUrl : null,
          name: formData.name || '',
          phone: formData.phone || '',
          email: formData.email || '',
          address: formData.address || '',
          objective: (formData.objective || []).map(entry => entry || ''),
          education: (formData.education || []).map(e => ({
            degree: e.degree || '',
            institute: e.institute || '',
            year: e.year || ''
          })),
          work_experience: (formData.workExperience || []).map(w => ({
            company: w.company || '',
            designation: w.designation || '',
            duration: w.duration || '',
            details: w.details || ''
          })),
          skills: (formData.skills || []).map(s => ({
            name: s.name || '',
            percentage: s.percentage || ''
          })),
          certifications: (formData.certifications || []).map(c => c || ''),
          projects: (formData.projects || []).map(p => p || ''),
          languages: [
            ...(formData.languages || []),
            ...(formData.customLanguages || [])
              .filter(lang => lang.selected && lang.name?.trim())
              .map(lang => lang.name.trim())
          ],
          hobbies: (formData.hobbies || []).map(h => h || ''),
          custom_sections: (formData.customSections || []).map(section => ({
            heading: section.heading || '',
            details: (section.details || []).map(detail => detail || '')
          })),
          cv_references: (formData.cv_references || []).map(r => r || ''),
          other_information: (formData.otherInformation || []).map(info => ({
            id: info.id,
            labelType: info.labelType || '',
            label: info.label || '',
            checked: info.checked === true,
            value: info.value || '',
            name: info.name || '',
            radioValue: info.radioValue || '',
            isCustom: info.isCustom === true
          }))
        };

        // Check if CV already exists for this admin
        console.log('Checking for existing admin CV for user:', user.email);
        console.log('Using table: admin_cvs');
        
        // First check if CV exists to determine if it's an update or create
        // Get the most recent CV for this admin user
        const { data: existingAdminCVData, error: checkError } = await supabase
          .from('admin_cvs')
          .select('id')
          .eq('admin_email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        console.log('Admin CV check result:', { existingAdminCVData, checkError });
        existingCV = existingAdminCVData; // Assign to the outer variable

        if (checkError) {
          console.error('Error checking for existing admin CV:', checkError);
        }

        if (existingAdminCVData) {
          // Update existing admin CV using the specific ID
          console.log('Updating existing admin CV for user:', user.email);
          console.log('Update payload:', payload);
          result = await supabase
            .from('admin_cvs')
            .update(payload)
            .eq('id', existingAdminCVData.id);
        } else {
          // Insert new admin CV
          console.log('Inserting new admin CV for user:', user.email);
          console.log('Insert payload:', payload);
          result = await supabase
            .from('admin_cvs')
            .insert([payload]);
        }
      } else {
        // For regular users, use direct upsert approach to save to user_cvs table
        const payload = {
          user_email: user.email,
          image_url: imageUrl && imageUrl.startsWith('http') ? imageUrl : null,
          name: formData.name || '',
          phone: formData.phone || '',
          email: formData.email || '',
          address: formData.address || '',
          objective: (formData.objective || []).map(entry => entry || ''),
          education: (formData.education || []).map(e => ({
            degree: e.degree || '',
            institute: e.institute || '',
            year: e.year || ''
          })),
          work_experience: (formData.workExperience || []).map(w => ({
            company: w.company || '',
            designation: w.designation || '',
            duration: w.duration || '',
            details: w.details || ''
          })),
          skills: (formData.skills || []).map(s => ({
            name: s.name || '',
            percentage: s.percentage || ''
          })),
          certifications: (formData.certifications || []).map(c => c || ''),
          projects: (formData.projects || []).map(p => p || ''),
          languages: [
            ...(formData.languages || []),
            ...(formData.customLanguages || [])
              .filter(lang => lang.selected && lang.name?.trim())
              .map(lang => lang.name.trim())
          ],
          hobbies: (formData.hobbies || []).map(h => h || ''),
          custom_sections: (formData.customSections || []).map(section => ({
            heading: section.heading || '',
            details: (section.details || []).map(detail => detail || '')
          })),
          cv_references: (formData.cv_references || []).map(r => r || ''),
          other_information: (formData.otherInformation || []).map(info => ({
            id: info.id,
            labelType: info.labelType || '',
            label: info.label || '',
            checked: info.checked === true,
            value: info.value || '',
            name: info.name || '',
            radioValue: info.radioValue || '',
            isCustom: info.isCustom === true
          }))
        };

        // Check if CV already exists for this user
        console.log('Checking for existing CV for user:', user.email);
        console.log('Using table: user_cvs');
        
        // First check if CV exists to determine if it's an update or create
        const { data: existingUserCVData, error: checkError } = await supabase
          .from('user_cvs')
          .select('id')
          .eq('user_email', user.email)
          .maybeSingle();
        
        console.log('User CV check result:', { existingUserCVData, checkError });
        existingCV = existingUserCVData; // Assign to the outer variable

        if (checkError) {
          console.error('Error checking for existing CV:', checkError);
        }

        if (existingUserCVData) {
          // Update existing CV
          console.log('Updating existing CV for user:', user.email);
          console.log('Update payload:', payload);
          result = await supabase
            .from('user_cvs')
            .update(payload)
            .eq('user_email', user.email);
        } else {
          // Insert new CV
          console.log('Inserting new CV for user:', user.email);
          console.log('Insert payload:', payload);
          result = await supabase
            .from('user_cvs')
            .insert([payload]);
        }
      }

      console.log('Save result:', result);
      
      if (result.error) {
        console.error('Save error:', result.error);
        safeToast.error(`Save failed: ${result.error.message}`);
        return;
      }

      // Show appropriate success message
      console.log('About to show toast notification');
      console.log('Final existingCV value:', existingCV);
      // Determine if it was an update or new save for both admin and regular users
      const isUpdate = existingCV ? true : false;
      const message = isUpdate ? 'CV Updated Successfully!' : 'CV Created Successfully!';
      console.log('Is update:', isUpdate, 'Message:', message);
      safeToast.success(message);
      
      console.log('=== SAVE CV END ===');
      
      // Optionally update formData with new imageUrl if uploaded
      if (formData.image && imageUrl) {
        setFormData(prev => ({ ...prev, image: null, imageUrl }));
      }
    } catch (error) {
      console.error('Unexpected error during save:', error);
      safeToast.error('An unexpected error occurred while saving.');
    }
  };


  const handleSearch = async () => {
    try {
      if (!searchName && !searchPhone) {
        safeToast.error("Please enter name or phone number to search.");
        return;
      }

      // Search in both user_cvs and admin_cvs tables
      let userQuery = supabase.from('user_cvs').select('*').limit(1);
      let adminQuery = supabase.from('admin_cvs').select('*').limit(1);

      if (searchName) {
        userQuery = userQuery.ilike('name', `%${searchName}%`);
        adminQuery = adminQuery.ilike('name', `%${searchName}%`);
      }

      if (searchPhone) {
        // Clean the search phone number (remove all non-digit characters)
        const cleanSearchPhone = searchPhone.replace(/\D/g, '');
        
        // Search for phone numbers that contain the cleaned digits
        userQuery = userQuery.or(`phone.ilike.%${searchPhone}%,phone.ilike.%${cleanSearchPhone}%`);
        adminQuery = adminQuery.or(`phone.ilike.%${searchPhone}%,phone.ilike.%${cleanSearchPhone}%`);
      }

      // Execute both queries
      const [userResult, adminResult] = await Promise.all([
        userQuery,
        adminQuery
      ]);

      if (userResult.error) {
        console.error("User CV search error:", userResult.error);
      }

      if (adminResult.error) {
        console.error("Admin CV search error:", adminResult.error);
      }

      // Combine results
      const allResults = [
        ...(userResult.data || []),
        ...(adminResult.data || [])
      ];

      if (allResults.length === 0) {
        safeToast.info("No matching CV found.");
        return;
      }

      const cv = allResults[0]; // Take the first match

      setFormData({
        image: null,
        imageUrl: cv.image_url || '',
        name: cv.name || '',
        phone: cv.phone || '',
        email: cv.email || '',
        address: cv.address || '',
        objective: cv.objective || [],
        education: cv.education || [],
        workExperience: cv.work_experience || [],
        skills: cv.skills || [],
        certifications: cv.certifications || [],
        projects: cv.projects || [],
        languages: cv.languages || [],
        customLanguages: [],
        hobbies: cv.hobbies || [],
        customSections: cv.custom_sections || [],
        cv_references: cv.cv_references || [],
        otherInformation: cv.other_information || [],
      });

      safeToast.success("CV loaded successfully.");
    } catch (err) {
      console.error("Unexpected error:", err);
      safeToast.error("Unexpected error during search.");
    }
  };

  const handleSelectSearchResult = (cv) => {
    setFormData({
      image: null,
      imageUrl: cv.image_url || '',
      name: cv.name || '',
      phone: cv.phone || '',
      email: cv.email || '',
      address: cv.address || '',
      objective: cv.objective || [],
      education: cv.education || [],
      workExperience: cv.work_experience || [],
      skills: cv.skills || [],
      certifications: cv.certifications || [],
      projects: cv.projects || [],
      languages: cv.languages || [],
      customLanguages: [],
      hobbies: cv.hobbies || [],
      customSections: cv.custom_sections || [],
      cv_references: cv.cv_references || [],
      otherInformation: cv.other_information || [],
    });

    // Clear search
    setSearchName('');
    setSearchPhone('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    safeToast.success("CV loaded successfully.");
  };



  // Guard: Don't render until formData is initialized
  if (!formData) return null;

  return (
    <>
      {/* Search Container Above Form - Only for Admin Users */}
      {isAdminAccess && (
        <div 
          data-search-container
          style={{
            width: '100%',
            padding: '2rem',
            boxSizing: 'border-box',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            position: 'relative'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search CV by name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #d1d5db',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search CV by Phone Number"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #d1d5db',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none'
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Search
            </button>
          </div>

          {/* Live Search Results */}
          {showSearchResults && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '2rem',
              right: '2rem',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {isSearching ? (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((cv, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectSearchResult(cv)}
                      style={{
                        padding: '1rem',
                        borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      <div style={{
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: '#111827',
                        marginBottom: '0.25rem'
                      }}>
                        {cv.name || 'Unnamed CV'}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {cv.phone && `📞 ${cv.phone}`}
                        {cv.phone && cv.email && ' • '}
                        {cv.email && `📧 ${cv.email}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save Reminder */}
      <div style={{
        width: '100%',
        padding: '1rem 2rem',
        backgroundColor: '#fef3c7',
        borderBottom: '1px solid #f59e0b',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          💾 Don't forget to save your CV for later use.
        </div>
      </div>

      <div className="form-container">


          {/* Profile Image */}
          <div className="profile-image-section">
          <h3>Profile Image</h3>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {(formData.image || formData.imageUrl) && (
            <img
              src={
                formData.image
                  ? URL.createObjectURL(formData.image)
                  : formData.imageUrl
              }
              alt="Preview"
              className="profile-image-preview"
            />
          )}
        </div>

        {/* Contact Info Row */}
        <div className="contact-row">
          <InputField label="Name" value={formData.name} onChange={handleChange('name')} placeholder="Your full name" />
          <InputField label="Phone" value={formData.phone} onChange={handleChange('phone')} placeholder="Your phone number" />
        </div>
        <div className="contact-row">
          <InputField label="Email" value={formData.email} onChange={handleChange('email')} placeholder="Your email address" />
          <InputField label="Address" value={formData.address} onChange={handleChange('address')} placeholder="Your address" />
        </div>

        {/* Other sections unchanged for brevity, same as previous cleaned-up version */}
        <DynamicSection
          title="Objective"
          entries={formData.objective}
          onChange={(index, val) => handleArrayChange('objective', index, val)}
          onRemove={(index) => handleRemoveEntry('objective', index)}
          placeholder="Write your career objective..."
          rows={2}
        />
        <EducationSection
          education={formData.education}
          onChange={handleEducationChange}
          onAdd={handleAddEducation}
          onRemove={handleRemoveEducation}
        />
        <WorkExperienceSection
          workExperience={formData.workExperience}
          onChange={handleWorkExperienceChange}
          onAdd={() => handleAddEntry('workExperience')}
          onRemove={(index) => handleRemoveEntry('workExperience', index)}
        />
        <OtherInformationSection
          otherInformation={formData.otherInformation}
          onRadioChange={handleRadioChange}
          onCheckboxChange={handleCheckboxChange}
          onValueChange={handleOtherInfoValueChange}
          onLabelChange={handleOtherInfoLabelChange}
          onAdd={() => handleAddEntry('otherInformation')}
          onRemove={(id) => {
            const updated = formData.otherInformation.filter(oi => oi.id !== id);
            setFormData({ ...formData, otherInformation: updated });
          }}
        />
        <DynamicSection
          title="Skills"
          entries={formData.skills}
          onChange={(index, val, type) => handleArrayChange('skills', index, val, type)}
          onAdd={() => handleAddEntry('skills')}
          onRemove={(index) => handleRemoveEntry('skills', index)}
          rows={1}
          renderEntry={(entry, index) => (
            <div className="skills-entry">
              <input
                type="text"
                value={entry?.name || ''}
                onChange={(e) => handleArrayChange('skills', index, e.target.value, 'name')}
                placeholder="Skill"
              />
              <input
                type="text"
                value={entry?.percentage || ''}
                onChange={(e) => handleArrayChange('skills', index, e.target.value, 'percentage')}
                placeholder="Percentage"
                name="percentage"
              />
              <button
                onClick={() => handleRemoveEntry('skills', index)}
                disabled={formData.skills.length <= 1}
                className="remove-btn"
                type="button"
                title={formData.skills.length <= 1 ? 'At least one skill entry required' : 'Remove'}
              >
                Remove
              </button>
            </div>
          )}
        />
        <DynamicSection
          title="Certifications"
          entries={formData.certifications}
          onChange={(index, val) => handleArrayChange('certifications', index, val)}
          onAdd={() => handleAddEntry('certifications')}
          onRemove={(index) => handleRemoveEntry('certifications', index)}
          placeholder="List your certifications..."
          rows={2}
        />
        <DynamicSection
          title="Projects"
          entries={formData.projects}
          onChange={(index, val) => handleArrayChange('projects', index, val)}
          onAdd={() => handleAddEntry('projects')}
          onRemove={(index) => handleRemoveEntry('projects', index)}
          placeholder="Describe your projects..."
          rows={2}
        />
        <LanguagesSection
          fixedLanguages={fixedLanguages}
          languages={formData.languages}
          customLanguages={formData.customLanguages}
          onLanguageChange={handleLanguageCheckboxChange}
          onCustomLanguageChange={handleCustomLanguageChange}
          onCustomLanguageCheckboxChange={handleCustomLanguageCheckboxChange}
          onAddCustomLanguage={() => handleAddEntry('customLanguages')}
          onRemoveCustomLanguage={(idx) => {
            const updated = [...formData.customLanguages];
            updated.splice(idx, 1);
            setFormData({ ...formData, customLanguages: updated });
          }}
        />
        <DynamicSection
          title="Hobbies"
          entries={formData.hobbies}
          onChange={(index, val) => handleArrayChange('hobbies', index, val)}
          onAdd={() => handleAddEntry('hobbies')}
          onRemove={(index) => handleRemoveEntry('hobbies', index)}
          placeholder="List your hobbies..."
          rows={1}
        />
        <CustomSection
          customSections={formData.customSections}
          onChange={handleCustomSectionChange}
          onAdd={handleAddCustomSection}
          onRemove={handleRemoveCustomSection}
          onDetailChange={handleCustomSectionDetailChange}
          onAddDetail={handleAddCustomSectionDetail}
          onRemoveDetail={handleRemoveCustomSectionDetail}
        />
        <div style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb' }}>
          <DynamicSection
            title="References"
            entries={formData.cv_references}
            onChange={(index, val) => {
              console.log('References onChange:', { index, val, currentEntries: formData.cv_references });
              handleArrayChange('cv_references', index, val);
            }}
            onAdd={() => {
              console.log('References onAdd called');
              handleAddEntry('cv_references');
            }}
            onRemove={(index) => {
              console.log('References onRemove:', { index });
              handleRemoveEntry('cv_references', index);
            }}
            placeholder="Provide your references (e.g., Name, Position, Company, Contact)"
            rows={2}
          />
        </div>

                <button onClick={handleSave} type="button" className="save-btn">
          Save
        </button>

      </div>
    </>
  );
};

const InputField = ({ label, value, onChange, placeholder }) => (
  <div className="input-field">
    <label>{label}</label>
    <input type="text" value={value} onChange={onChange} placeholder={placeholder} />
  </div>
);

const EducationSection = ({ education, onChange, onAdd, onRemove }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8, color: '#374151' }}>Education</h3>
    <table className="table">
      <thead>
        <tr>
          <th>Degree</th>
          <th>Institute</th>
          <th>Year</th>
          <th style={{ width: 60 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {education.map((edu, index) => (
          <tr key={index}>
            <td>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => onChange(index, 'degree', e.target.value)}
                placeholder="Degree"
              />
            </td>
            <td>
              <input
                type="text"
                value={edu.institute}
                onChange={(e) => onChange(index, 'institute', e.target.value)}
                placeholder="Institute"
              />
            </td>
            <td>
              <input
                type="text"
                value={edu.year}
                onChange={(e) => onChange(index, 'year', e.target.value)}
                placeholder="Year"
              />
            </td>
            <td>
              <button
                onClick={() => onRemove(index)}
                disabled={education.length <= 1}
                className="remove-btn"
                type="button"
                title={education.length <= 1 ? 'At least one education entry required' : 'Remove'}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <button onClick={onAdd} type="button" className="add-btn">
      Add Education
    </button>
  </div>
);

const WorkExperienceSection = ({ workExperience, onChange, onAdd, onRemove }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8, color: '#374151' }}>Work Experience</h3>
    <table className="table">
      <thead>
        <tr>
          <th>Company</th>
          <th>Designation</th>
          <th>Duration</th>
          <th>Details</th>
          <th style={{ width: 60 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {workExperience.map((work, index) => (
          <tr key={index}>
            <td>
              <input
                type="text"
                value={work.company}
                onChange={(e) => onChange(index, 'company', e.target.value)}
                placeholder="Company"
              />
            </td>
            <td>
              <input
                type="text"
                value={work.designation}
                onChange={(e) => onChange(index, 'designation', e.target.value)}
                placeholder="Designation"
              />
            </td>
            <td>
              <input
                type="text"
                value={work.duration}
                onChange={(e) => onChange(index, 'duration', e.target.value)}
                placeholder="Duration"
              />
            </td>
            <td>
              <textarea
                value={work.details}
                onChange={(e) => onChange(index, 'details', e.target.value)}
                placeholder="Details"
                rows={2}
              />
            </td>
            <td>
              <button
                onClick={() => onRemove(index)}
                disabled={workExperience.length <= 1}
                className="remove-btn"
                type="button"
                title={workExperience.length <= 1 ? 'At least one work experience entry required' : 'Remove'}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <button onClick={onAdd} type="button" className="add-btn">
      Add Work Experience
    </button>
  </div>
);


const OtherInformationSection = ({
  otherInformation,
  onRadioChange,
  onCheckboxChange,
  onValueChange,
  onLabelChange,
  onAdd,
  onRemove,
}) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8, color: '#374151' }}>Other Information</h3>
    <div className="other-info-container">
      <div className="other-info-radios">
        {(otherInformation || []).filter(item => item.labelType === 'radio').map((item, index) => (
          <label key={item.id}>
            <input
              type="radio"
              name={item.name}
              checked={item.checked}
              onChange={() => onRadioChange(index, item.radioValue)}
            />
            {item.label}
            <input
              type="text"
              value={item.value}
              onChange={(e) => onValueChange(otherInformation.findIndex(oi => oi.id === item.id), e.target.value)}
              className="other-info-input"
            />
          </label>
        ))}
      </div>

      {(otherInformation || []).filter(item => item.labelType === 'checkbox' && !item.isCustom).map((item) => (
        <div key={item.id} className="other-info-checkbox-item">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => onCheckboxChange(otherInformation.findIndex(oi => oi.id === item.id))}
          />
          <span style={{ minWidth: 120 }}>{item.label}</span>
          <input
            type="text"
            value={item.value}
            onChange={(e) => onValueChange(otherInformation.findIndex(oi => oi.id === item.id), e.target.value)}
            className="other-info-input-flex"
          />
        </div>
      ))}

      {(otherInformation || []).filter(item => item.isCustom).map((item) => (
        <div key={item.id} className="other-info-checkbox-item">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => onCheckboxChange(otherInformation.findIndex(oi => oi.id === item.id))}
          />
          <input
            type="text"
            value={item.label}
            onChange={(e) => onLabelChange(otherInformation.findIndex(oi => oi.id === item.id), e.target.value)}
            placeholder="Custom field name"
            className="custom-other-info-label"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => onValueChange(otherInformation.findIndex(oi => oi.id === item.id), e.target.value)}
            className="other-info-input-flex"
          />
          <button onClick={() => onRemove(item.id)} type="button" className="remove-btn" title="Remove field">
            Remove
          </button>
        </div>
      ))}

      <button onClick={onAdd} type="button" className="add-btn-margin-top">
        Add More Information
      </button>
    </div>
  </div>
);

const LanguagesSection = ({
  fixedLanguages,
  languages,
  customLanguages,
  onLanguageChange,
  onCustomLanguageChange,
  onCustomLanguageCheckboxChange,
  onAddCustomLanguage,
  onRemoveCustomLanguage,
}) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8, color: '#374151' }}>Languages</h3>
    <div className="languages-list">
      {(fixedLanguages || []).map(language => (
        <label key={language}>
          <input
            type="checkbox"
            checked={languages.includes(language)}
            onChange={() => onLanguageChange(language)}
          />
          {language}
        </label>
      ))}
    </div>
    {(customLanguages || []).length > 0 && (customLanguages || []).map((lang, idx) => (
      <div key={idx} className="custom-language-entry">
        <input
          type="checkbox"
          checked={lang.selected}
          onChange={() => onCustomLanguageCheckboxChange(idx)}
        />
        <input
          type="text"
          value={lang.name}
          onChange={(e) => onCustomLanguageChange(idx, e.target.value)}
          placeholder="Add language"
        />
        <button onClick={() => onRemoveCustomLanguage(idx)} type="button" className="remove-btn" title="Remove language">
          Remove
        </button>
      </div>
    ))}
    <button onClick={onAddCustomLanguage} type="button" className="add-btn">
      Add Language
    </button>
  </div>
);

const CustomSection = ({
  customSections,
  onChange,
  onAdd,
  onRemove,
  onDetailChange,
  onAddDetail,
  onRemoveDetail,
}) => {
  console.log('CustomSection component rendered with:', { customSections });
    return (
    <div style={{ 
      marginBottom: '1.5rem',
      border: '2px solid #107268',
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: '#f0f8f8'
    }}>
    <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8, color: '#374151' }}>Custom Sections</h3>
    <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
      Add custom sections to your CV with your own headings and details.
    </p>
    {(customSections || []).map((section, sectionIndex) => (
      <div key={sectionIndex} style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '15px', 
        marginBottom: '15px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="text"
            value={section.heading || ''}
            onChange={(e) => onChange(sectionIndex, 'heading', e.target.value)}
            placeholder="Section Heading"
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          />
          <button
            onClick={() => onRemove(sectionIndex)}
            className="remove-btn"
            type="button"
            style={{ marginLeft: '10px' }}
            title="Remove section"
          >
            Remove Section
          </button>
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <h4 style={{ marginBottom: '8px', color: '#666' }}>Details:</h4>
          {(section.details || []).map((detail, detailIndex) => (
            <div key={detailIndex} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
              <textarea
                value={detail}
                onChange={(e) => onDetailChange(sectionIndex, detailIndex, e.target.value)}
                placeholder="Enter detail..."
                rows={2}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
              <button
                onClick={() => onRemoveDetail(sectionIndex, detailIndex)}
                className="remove-btn"
                type="button"
                style={{ marginLeft: '8px' }}
                title="Remove detail"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => onAddDetail(sectionIndex)}
            className="add-btn"
            type="button"
            style={{ marginTop: '8px' }}
          >
            Add Detail
          </button>
        </div>
      </div>
    ))}
    <button onClick={onAdd} className="add-btn" type="button">
      Add Custom Section
    </button>
  </div>
  );
};

const DynamicSection = ({ title, entries, onChange, onAdd, onRemove, placeholder, rows, renderEntry }) => {
  console.log('DynamicSection rendered:', { title, entries, hasEntries: entries && entries.length > 0 });
  
  // Ensure we always have at least one entry to show
  // For references section, use default text if empty
  const getDefaultEntry = () => {
    if (title === 'References') {
      return 'References would be furnished on demand';
    }
    if (title === 'Skills') {
      return { name: '', percentage: '' };
    }
    return '';
  };
  
  // For skills section, only show entries if they exist (no default entry)
  // For other sections, use default entry only if it's a string
  const defaultEntry = getDefaultEntry();
  const displayEntries = entries && entries.length > 0 ? entries : 
    (title === 'Skills') ? [] : 
    (typeof defaultEntry === 'string') ? [defaultEntry] : [];
  
  return (
  <div className="dynamic-section" style={{ marginBottom: '1rem' }}>
    <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8, color: '#374151' }}>{title}</h3>
    {displayEntries.map((entry, index) => (
      <div key={index} className="dynamic-entry" style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        {renderEntry && entry ? renderEntry(entry, index) : (
          <>
            <textarea
              value={typeof entry === 'string' ? entry : ''}
              onChange={(e) => onChange(index, e.target.value)}
              rows={rows}
              placeholder={placeholder}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '60px'
              }}
            />
            <button
              onClick={() => onRemove(index)}
              disabled={displayEntries.length <= 1}
              className="remove-btn"
              title={displayEntries.length <= 1 ? 'At least one entry required' : 'Remove entry'}
              type="button"
            >
              Remove
            </button>
          </>
        )}
      </div>
    ))}
    {onAdd && (
      <button onClick={onAdd} className="add-btn" type="button">
        Add
      </button>
    )}
  </div>
  );
};

export default Form;
