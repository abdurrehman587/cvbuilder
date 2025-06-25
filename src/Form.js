import React, { useState, useEffect } from 'react';
import supabase from './supabase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Form.css';

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
  references: ['Reference would be furnished on demand'],
  customSections: [],
  otherInformation: [
    { id: 1, labelType: 'radio', label: "Father's Name:", checked: true, value: '', name: 'parentSpouse', radioValue: 'father' },
    { id: 2, labelType: 'radio', label: "Husband's Name:", checked: false, value: '', name: 'parentSpouse', radioValue: 'husband' },
    { id: 3, labelType: 'checkbox', label: 'CNIC:', checked: true, value: '', isCustom: false },
    { id: 4, labelType: 'checkbox', label: 'Date of Birth:', checked: true, value: '', isCustom: false },
    { id: 5, labelType: 'checkbox', label: 'Marital Status:', checked: true, value: '', isCustom: false },
    { id: 6, labelType: 'checkbox', label: 'Religion:', checked: true, value: '', isCustom: false },
  ],
};



const Form = ({ formData, setFormData, onChange, user }) => {

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [currentCvId, setCurrentCvId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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

  // Debounced live search effect
  useEffect(() => {
    if (!user || !user.isAdmin) return;

    // Live search function defined inside useEffect
    const performLiveSearch = async () => {
      if (!user || !user.isAdmin) return;
      if (!searchName && !searchPhone) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      console.log('Live search triggered with:', { searchName, searchPhone });
      setIsSearching(true);
      try {
        if (!supabase || !supabase.from) {
          console.error('Supabase client not available');
          return;
        }

        // Try using RPC function for search
        console.log('Trying RPC search...');
        let searchParams = {};
        if (searchName) searchParams.p_name = searchName;
        if (searchPhone) searchParams.p_phone = searchPhone.replace(/[^0-9]/g, '');
        
        console.log('RPC search parameters:', searchParams);
        const { data, error } = await supabase.rpc('admin_search_cvs', searchParams);
        console.log('RPC search result:', { data, error, dataLength: data?.length });

        // Add detailed debugging for search results
        if (data && data.length > 0) {
          console.log('RPC search - First result structure:', Object.keys(data[0]));
          console.log('RPC search - First result custom_sections:', data[0].custom_sections);
          console.log('RPC search - First result custom_sections type:', typeof data[0].custom_sections);
          console.log('RPC search - First result custom_sections JSON:', JSON.stringify(data[0].custom_sections));
          console.log('RPC search - Full first result:', data[0]);
        }

        if (error) {
          console.error("RPC search error:", error);
          // Fallback to direct table access
          console.log('Falling back to direct table search...');
          let query = supabase.from('cvs').select('*');

          if (searchName) {
            query = query.ilike('name', `%${searchName}%`);
            console.log('Added name filter:', `%${searchName}%`);
          }

          if (searchPhone) {
            const cleanPhone = searchPhone.replace(/[^0-9]/g, '');
            query = query.ilike('phone', `%${cleanPhone}%`);
            console.log('Added phone filter:', `%${cleanPhone}%`);
          }

          if (user && !user.isAdmin) {
            query = query.eq('user_id', user.id);
            console.log('Added user filter for non-admin');
          }

          console.log('Executing direct search query...');
          const { data: directData, error: directError } = await query;
          console.log('Direct search result:', { data: directData, error: directError, dataLength: directData?.length });

          // Add detailed debugging for direct search results
          if (directData && directData.length > 0) {
            console.log('Direct search - First result structure:', Object.keys(directData[0]));
            console.log('Direct search - First result custom_sections:', directData[0].custom_sections);
            console.log('Direct search - First result custom_sections type:', typeof directData[0].custom_sections);
            console.log('Direct search - First result custom_sections JSON:', JSON.stringify(directData[0].custom_sections));
          }

          if (directError) {
            console.error("Direct search error:", directError);
            return;
          }

          setSearchResults(directData || []);
          setShowSearchResults(directData && directData.length > 0);
          console.log('Search results updated (direct):', { results: directData?.length, showResults: directData && directData.length > 0 });
          return;
        }

        setSearchResults(data || []);
        setShowSearchResults(data && data.length > 0);
        console.log('Search results updated (RPC):', { results: data?.length, showResults: data && data.length > 0 });
      } catch (error) {
        console.error("Live search exception:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const searchTimeout = setTimeout(() => {
      if (searchName || searchPhone) {
        performLiveSearch();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(searchTimeout);
  }, [searchName, searchPhone, user]);

  // Maintain admin access flag for admin users
  useEffect(() => {
    if (user?.isAdmin) {
      // Set admin access flag immediately
      localStorage.setItem('admin_cv_access', 'true');
      console.log('Admin access flag set for admin user');
      
      // Set up interval to maintain admin access flag
      const adminAccessInterval = setInterval(() => {
        const currentAdminAccess = localStorage.getItem('admin_cv_access');
        if (currentAdminAccess !== 'true') {
          localStorage.setItem('admin_cv_access', 'true');
          console.log('Admin access flag restored');
        }
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(adminAccessInterval);
    }
  }, [user]);

  // Fetch user's CV on mount or when user changes
  useEffect(() => {
    const fetchUserCV = async () => {
      if (!user) return;
      
      // Ensure admin access flag is maintained for admin users
      if (user.isAdmin) {
        localStorage.setItem('admin_cv_access', 'true');
        console.log('Admin access flag maintained for admin user');
      }
      
      // Check if admin has selected a CV to load
      const adminSelectedCV = localStorage.getItem('admin_selected_cv');
      if (user.isAdmin && adminSelectedCV) {
        try {
          const cvData = JSON.parse(adminSelectedCV);
          console.log('Loading admin-selected CV:', cvData);
          
          setCurrentCvId(cvData.id);
          
          console.log('Admin CV - Raw custom_sections:', cvData.custom_sections);
          console.log('Admin CV - Type of custom_sections:', typeof cvData.custom_sections);
          
          const parsedCustomSections = safeJsonParse(cvData.custom_sections, []);
          console.log('Admin CV - Parsed custom sections:', parsedCustomSections);
          
          // Validate custom sections data - be more lenient to preserve sections for editing
          const validatedCustomSections = Array.isArray(parsedCustomSections) 
            ? parsedCustomSections.filter(section => 
                section && 
                typeof section === 'object' && 
                (section.title !== undefined || section.heading !== undefined) && 
                (section.items !== undefined || section.details !== undefined)
              ).map(section => ({
                id: section.id || Date.now() + Math.random(),
                title: section.title || section.heading || '',
                items: Array.isArray(section.items) ? section.items : 
                       Array.isArray(section.details) ? section.details : ['']
              }))
            : [];
          
          console.log('Admin CV - Validated custom sections:', validatedCustomSections);
          
          // Ensure admin access flag is set for admin-selected CV
          localStorage.setItem('admin_cv_access', 'true');
          console.log('Admin access flag set for admin-selected CV');
          
          setFormData({
            image: null,
            imageUrl: cvData.image_url || '',
            name: cvData.name || '',
            phone: cvData.phone || '',
            email: cvData.email || '',
            address: cvData.address || '',
            objective: safeJsonParse(cvData.objective, []),
            education: safeJsonParse(cvData.education, []),
            workExperience: safeJsonParse(cvData.work_experience, []),
            skills: safeJsonParse(cvData.skills, []),
            certifications: safeJsonParse(cvData.certifications, []),
            projects: safeJsonParse(cvData.projects, []),
            languages: safeJsonParse(cvData.languages, []),
            customLanguages: [],
            hobbies: safeJsonParse(cvData.hobbies, []),
            references: safeJsonParse(cvData.references, []),
            customSections: validatedCustomSections,
            otherInformation: safeJsonParse(cvData.other_information, []),
          });
          
          // Clear the admin selected CV from localStorage after loading
          localStorage.removeItem('admin_selected_cv');
          toast.success('CV loaded successfully from admin search!');
          return;
        } catch (error) {
          console.error('Error parsing admin-selected CV:', error);
          localStorage.removeItem('admin_selected_cv');
        }
      }
      
      // Skip auto-loading for admin users - they should use search instead
      if (user.isAdmin) {
        console.log('Admin user detected - skipping auto CV load. Use search to find CVs.');
        return;
      }
      
      try {
        console.log('Fetching CV for user:', user.id);
        const { data, error } = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching CV:', error);
          
          // Check if table doesn't exist
          if (error.message && error.message.includes('relation "cvs" does not exist')) {
            console.warn('CV table does not exist. Please run the database setup script.');
            return;
          }
          
          // Check if no data found (this is normal for new users)
          if (error.code === 'PGRST116') {
            console.log('No existing CV found for user - this is normal for new users');
            return;
          }
          
          // Check for RLS policy issues
          if (error.message && error.message.includes('new row violates row-level security policy')) {
            console.error('RLS policy issue - user may not have proper permissions');
            return;
          }
          
          console.error('Unexpected error fetching CV:', error);
          return;
        }

        if (data) {
          console.log('CV data loaded successfully:', data);
          console.log('Raw custom_sections from database:', data.custom_sections);
          console.log('Type of custom_sections:', typeof data.custom_sections);
          
          // Parse custom sections with new structure
          const parsedCustomSections = safeJsonParse(data.custom_sections, []);
          console.log('Parsed custom sections:', parsedCustomSections);
          
          // Validate and normalize custom sections data
          const validatedCustomSections = Array.isArray(parsedCustomSections) 
            ? parsedCustomSections.filter(section => 
                section && 
                typeof section === 'object' && 
                (section.title !== undefined || section.heading !== undefined) && 
                (section.items !== undefined || section.details !== undefined)
              ).map(section => ({
                id: section.id || Date.now() + Math.random(),
                title: section.title || section.heading || '',
                items: Array.isArray(section.items) ? section.items : 
                       Array.isArray(section.details) ? section.details : ['']
              }))
            : [];
          
          console.log('Validated custom sections:', validatedCustomSections);
          
          // Parse other information
          const parsedOtherInformation = safeJsonParse(data.other_information, []);
          console.log('Parsed other information:', parsedOtherInformation);
          
          setCurrentCvId(data.id);
          setFormData({
            image: null,
            imageUrl: data.image_url || '',
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            objective: safeJsonParse(data.objective, []),
            education: safeJsonParse(data.education, []),
            workExperience: safeJsonParse(data.work_experience, []),
            skills: safeJsonParse(data.skills, []),
            certifications: safeJsonParse(data.certifications, []),
            projects: safeJsonParse(data.projects, []),
            languages: safeJsonParse(data.languages, []),
            customLanguages: [],
            hobbies: safeJsonParse(data.hobbies, []),
            references: safeJsonParse(data.references, []),
            customSections: validatedCustomSections,
            otherInformation: parsedOtherInformation || defaultFormData.otherInformation,
          });
        }
      } catch (err) {
        console.error('Exception while fetching CV:', err);
      }
    };
    
    fetchUserCV();
    // eslint-disable-next-line
  }, [user]);

  // Ensure otherInformation is always properly set
  useEffect(() => {
    if (formData && (!formData.otherInformation || formData.otherInformation.length === 0)) {
      console.log('Form - Fixing undefined otherInformation, setting to default');
      setFormData(prev => ({
        ...prev,
        otherInformation: defaultFormData.otherInformation
      }));
    }
  }, [formData, setFormData]);

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
    updated[index] = { ...updated[index], name: value };
    setFormData({ ...formData, customLanguages: updated });
  };

  // Custom Sections Handlers - NEW IMPLEMENTATION
  const handleAddCustomSection = () => {
    const newSection = {
      id: Date.now(),
      title: '',
      items: ['']
    };
    setFormData(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSection]
    }));
  };

  const handleRemoveCustomSection = (sectionIndex) => {
    setFormData(prev => ({
      ...prev,
      customSections: prev.customSections.filter((_, index) => index !== sectionIndex)
    }));
  };

  const handleCustomSectionTitleChange = (sectionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      customSections: prev.customSections.map((section, index) => 
        index === sectionIndex ? { ...section, title: value } : section
      )
    }));
  };

  const handleCustomSectionItemChange = (sectionIndex, itemIndex, value) => {
    setFormData(prev => ({
      ...prev,
      customSections: prev.customSections.map((section, index) => 
        index === sectionIndex 
          ? { 
              ...section, 
              items: section.items.map((item, i) => i === itemIndex ? value : item)
            }
          : section
      )
    }));
  };

  const handleAddCustomSectionItem = (sectionIndex) => {
    setFormData(prev => ({
      ...prev,
      customSections: prev.customSections.map((section, index) => 
        index === sectionIndex 
          ? { ...section, items: [...section.items, ''] }
          : section
      )
    }));
  };

  const handleRemoveCustomSectionItem = (sectionIndex, itemIndex) => {
    setFormData(prev => ({
      ...prev,
      customSections: prev.customSections.map((section, index) => 
        index === sectionIndex 
          ? { 
              ...section, 
              items: section.items.filter((_, i) => i !== itemIndex)
            }
          : section
      )
    }));
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

  // Safe JSON parsing function
  const safeJsonParse = (value, defaultValue = []) => {
    if (!value) return defaultValue;
    if (typeof value === 'object') return value; // Already parsed
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        
        // Special handling for custom sections to ensure proper structure
        if (Array.isArray(parsed)) {
          // Check if this looks like custom sections data (array of objects with heading and details)
          if (parsed.length > 0 && parsed[0] && typeof parsed[0] === 'object' && 
              (parsed[0].heading !== undefined || parsed[0].details !== undefined)) {
            console.log('Parsing custom sections data:', parsed);
            return parsed;
          }
          // Regular array data
          return parsed;
        }
        
        // If parsed is an object but not an array, return as is
        if (typeof parsed === 'object') {
          return parsed;
        }
        
        return parsed;
      } catch (error) {
        console.warn('Failed to parse JSON:', value, error);
        // If it's a simple string, wrap it in an array
        return [value];
      }
    }
    return defaultValue;
  };

  const handleSave = async () => {
    console.log('=== SAVE FUNCTION STARTED ===');
    console.log('User:', user);
    console.log('Is admin:', user?.isAdmin);
    console.log('Current CV ID:', currentCvId);
    console.log('Form data ID:', formData.id);

    // Check if user is logged in
    if (!user) {
      console.log('=== NO USER ERROR ===');
      toast.error('You must be logged in to save a CV.');
      return;
    }

    console.log('=== REGULAR SAVE PATH ===');
    
    // Handle image upload first
    let imageUrl = formData.imageUrl;
    if (formData.image) {
      console.log('Uploading image...');
      const uploadedUrl = await uploadImage(formData.image);
      if (!uploadedUrl) {
        toast.error('Image upload failed. Please try again.');
        return;
      }
      imageUrl = uploadedUrl;
      console.log('Image uploaded successfully:', imageUrl);
    }

    try {
      if (user.isAdmin) {
        console.log('=== ADMIN SAVE PATH ===');
        
        // First, check if a CV with the same name and phone already exists
        if (!formData.id) {
          console.log('Checking for existing CV with same name and phone...');
          const { data: existingCv, error: searchError } = await supabase
            .from('cvs')
            .select('id')
            .eq('name', formData.name)
            .eq('phone', formData.phone)
            .is('user_id', null) // Only check admin-created CVs
            .limit(1);
            
          if (searchError) {
            console.error('Error searching for existing CV:', searchError);
          } else if (existingCv && existingCv.length > 0) {
            console.log('Found existing CV with same name and phone:', existingCv[0]);
            // Set the existing CV ID so it will be updated instead of created
            setFormData(prev => ({ ...prev, id: existingCv[0].id }));
            setCurrentCvId(existingCv[0].id);
          }
        }
        
        // Use RPC function for admin users to bypass RLS
        const rpcData = {
          p_cv_id: formData.id || currentCvId,
          p_name: formData.name,
          p_phone: formData.phone,
          p_email: formData.email,
          p_address: formData.address,
          p_objective: JSON.stringify(formData.objective),
          p_education: JSON.stringify(formData.education),
          p_work_experience: JSON.stringify(formData.workExperience),
          p_skills: JSON.stringify(formData.skills),
          p_certifications: JSON.stringify(formData.certifications),
          p_projects: JSON.stringify(formData.projects),
          p_languages: JSON.stringify(formData.languages),
          p_hobbies: JSON.stringify(formData.hobbies),
          p_references: JSON.stringify(formData.references),
          p_custom_sections: JSON.stringify(formData.customSections),
          p_other_information: JSON.stringify(formData.otherInformation),
          p_image_url: imageUrl || null,
        };
        
        console.log('Calling admin_update_cv RPC with data:', rpcData);
        console.log('DEBUG - formData.customSections before JSON.stringify:', formData.customSections);
        console.log('DEBUG - p_custom_sections after JSON.stringify:', rpcData.p_custom_sections);
        console.log('DEBUG - formData.otherInformation before JSON.stringify:', formData.otherInformation);
        console.log('DEBUG - p_other_information after JSON.stringify:', rpcData.p_other_information);
        
        const { data, error } = await supabase.rpc('admin_update_cv', rpcData);
        
        if (error) throw error;
        
        if (formData.id || currentCvId) {
          toast.success('CV updated successfully! (Admin Mode)');
          console.log('CV updated successfully via RPC:', data);
        } else {
          toast.success('CV created successfully! (Admin Mode)');
          console.log('CV created successfully via RPC:', data);
          // Update the form data with the new ID
          if (data && data.length > 0 && data[0].id) {
            const newId = data[0].id;
            console.log('Setting new CV ID:', newId);
            setFormData(prev => ({ ...prev, id: newId }));
            setCurrentCvId(newId);
          }
        }
      } else {
        // Regular user save logic
        if (formData.id) {
          console.log('=== UPDATING EXISTING CV ===');
          // Update existing CV by id
          const updateData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            objective: JSON.stringify(formData.objective),
            education: JSON.stringify(formData.education),
            work_experience: JSON.stringify(formData.workExperience),
            skills: JSON.stringify(formData.skills),
            certifications: JSON.stringify(formData.certifications),
            projects: JSON.stringify(formData.projects),
            languages: JSON.stringify(formData.languages),
            hobbies: JSON.stringify(formData.hobbies),
            references: JSON.stringify(formData.references),
            custom_sections: JSON.stringify(formData.customSections),
            other_information: JSON.stringify(formData.otherInformation),
            user_id: user.id,
            image_url: imageUrl || null,
          };
          
          console.log('Updating CV with ID:', formData.id);
          console.log('Update data:', updateData);
          
          const { data, error } = await supabase
            .from('cvs')
            .update(updateData)
            .eq('id', formData.id);
            
          if (error) throw error;
          toast.success('CV updated successfully!');
          console.log('CV updated successfully:', data);
        } else {
          console.log('=== CREATING NEW CV ===');
          // Insert new CV
          const insertData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            objective: JSON.stringify(formData.objective),
            education: JSON.stringify(formData.education),
            work_experience: JSON.stringify(formData.workExperience),
            skills: JSON.stringify(formData.skills),
            certifications: JSON.stringify(formData.certifications),
            projects: JSON.stringify(formData.projects),
            languages: JSON.stringify(formData.languages),
            hobbies: JSON.stringify(formData.hobbies),
            references: JSON.stringify(formData.references),
            custom_sections: JSON.stringify(formData.customSections),
            other_information: JSON.stringify(formData.otherInformation),
            user_id: user.id,
            image_url: imageUrl || null,
          };
          
          console.log('Creating new CV with data:', insertData);
          
          const { data, error } = await supabase
            .from('cvs')
            .insert([insertData]);
            
          if (error) throw error;
          toast.success('CV created successfully!');
          console.log('CV created successfully:', data);
        }
      }
    } catch (error) {
      console.error('=== SAVE ERROR ===');
      console.error('Error details:', error);
      toast.error('Error saving CV: ' + error.message);
    }
    
    console.log('=== SAVE FUNCTION ENDED ===');
  };

  // Function to load CV from search results
  const loadCVFromSearch = (cv) => {
    console.log('Loading CV from search:', cv);
    console.log('Search CV - Raw custom_sections:', cv.custom_sections);
    console.log('Search CV - Type of custom_sections:', typeof cv.custom_sections);
    console.log('Search CV - Raw other_information:', cv.other_information);
    console.log('Search CV - Type of other_information:', typeof cv.other_information);
    
    // Parse other_information data
    const parsedOtherInformation = safeJsonParse(cv.other_information, defaultFormData.otherInformation);
    console.log('Search CV - Parsed other information:', parsedOtherInformation);
    
    // Ensure admin access flag is maintained for admin users
    if (user?.isAdmin) {
      localStorage.setItem('admin_cv_access', 'true');
      console.log('Admin access flag maintained for CV loading from search');
    }
    
    const parsedCustomSections = safeJsonParse(cv.custom_sections, []);
    console.log('Search CV - Parsed custom sections:', parsedCustomSections);
    console.log('Search CV - Parsed custom sections type:', typeof parsedCustomSections);
    console.log('Search CV - Parsed custom sections length:', parsedCustomSections?.length);
    console.log('Search CV - Parsed custom sections structure:', parsedCustomSections?.map(s => ({
      heading: s?.heading,
      details: s?.details,
      detailsLength: s?.details?.length,
      hasValidData: s?.heading && s?.details && s?.details.length > 0
    })));
    
    // Validate custom sections data - be more lenient to preserve sections for editing
    const validatedCustomSections = Array.isArray(parsedCustomSections) 
      ? parsedCustomSections.filter(section => 
          section && 
          typeof section === 'object' && 
          (section.title !== undefined || section.heading !== undefined) && 
          (section.items !== undefined || section.details !== undefined)
        ).map(section => ({
          id: section.id || Date.now() + Math.random(),
          title: section.title || section.heading || '',
          items: Array.isArray(section.items) ? section.items : 
                 Array.isArray(section.details) ? section.details : ['']
        }))
      : [];
    
    console.log('Search CV - Validated custom sections:', validatedCustomSections);
    
    setCurrentCvId(cv.id);
    setFormData({
      image: null,
      imageUrl: cv.image_url || '',
      name: cv.name || '',
      phone: cv.phone || '',
      email: cv.email || '',
      address: cv.address || '',
      objective: safeJsonParse(cv.objective, []),
      education: safeJsonParse(cv.education, []),
      workExperience: safeJsonParse(cv.work_experience, []),
      skills: safeJsonParse(cv.skills, []),
      certifications: safeJsonParse(cv.certifications, []),
      projects: safeJsonParse(cv.projects, []),
      languages: safeJsonParse(cv.languages, []),
      customLanguages: safeJsonParse(cv.custom_languages, []),
      hobbies: safeJsonParse(cv.hobbies, []),
      references: safeJsonParse(cv.references, []),
      customSections: validatedCustomSections,
      otherInformation: parsedOtherInformation || defaultFormData.otherInformation,
    });

    console.log('Search CV - Form data set with otherInformation:', parsedOtherInformation || defaultFormData.otherInformation);

    setShowSearchResults(false);
    setSearchName('');
    setSearchPhone('');
    toast.success(`CV loaded successfully for ${cv.name || 'Unknown User'}`);
  };

  // Add debugging for formData.customSections changes
  React.useEffect(() => {
    console.log('Form - useEffect - formData.customSections changed:', formData.customSections);
    console.log('Form - useEffect - formData.customSections type:', typeof formData.customSections);
    console.log('Form - useEffect - formData.customSections length:', formData.customSections?.length);
    console.log('Form - useEffect - formData.customSections JSON:', JSON.stringify(formData.customSections));
    
    // Add stack trace to see where the change is coming from
    console.trace('Form - customSections change stack trace');
  }, [formData.customSections]);

  // Add debugging for entire formData changes
  React.useEffect(() => {
    console.log('Form - useEffect - entire formData changed:', {
      hasCustomSections: 'customSections' in formData,
      customSectionsValue: formData.customSections,
      customSectionsType: typeof formData.customSections,
      formDataKeys: Object.keys(formData)
    });
  }, [formData]);

  // Guard: Don't render until formData is initialized
  if (!formData) return null;

  return (
    <>
      {/* Search Container Above Form */}
      <div style={{
        width: '100%',
        padding: '2rem',
        boxSizing: 'border-box',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder={user?.isAdmin ? "Search any CV by name" : "Search CV by name"}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid #d1d5db',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              paddingRight: isSearching ? '2.5rem' : '1rem'
            }}
          />
          {isSearching && (
            <div style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}>
              🔍
            </div>
          )}
        </div>
        <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder={user?.isAdmin ? "Search any CV by Phone Number" : "Search CV by Phone Number"}
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid #d1d5db',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              paddingRight: isSearching ? '2.5rem' : '1rem'
            }}
          />
          {isSearching && (
            <div style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}>
              🔍
            </div>
          )}
        </div>
      </div>

      {/* Search Results Display */}
      {showSearchResults && searchResults.length > 0 && (
        <div style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ margin: 0, color: '#374151' }}>
              Search Results ({searchResults.length} CV{searchResults.length === 1 ? '' : 's'})
            </h3>
            <button
              onClick={() => {
                setShowSearchResults(false);
                setSearchResults([]);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              ✕ Close
            </button>
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {searchResults.map((cv, index) => (
              <div
                key={cv.id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                    {cv.name || 'No Name'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    📞 {cv.phone || 'No Phone'} | 📧 {cv.email || 'No Email'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    ID: {cv.id} | Created: {new Date(cv.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => loadCVFromSearch(cv)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  📝 Load CV
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                value={entry.name}
                onChange={(e) => handleArrayChange('skills', index, e.target.value, 'name')}
                placeholder="Skill"
              />
              <input
                type="text"
                value={entry.percentage}
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
        <DynamicSection
          title="References"
          entries={formData.references}
          onChange={(index, val) => handleArrayChange('references', index, val)}
          onAdd={() => handleAddEntry('references')}
          onRemove={(index) => handleRemoveEntry('references', index)}
          placeholder="Provide your references..."
          rows={1}
        />

        <CustomSectionsSection
          customSections={formData.customSections}
          onHeadingChange={handleCustomSectionTitleChange}
          onDetailChange={handleCustomSectionItemChange}
          onAddDetail={handleAddCustomSectionItem}
          onRemoveDetail={handleRemoveCustomSectionItem}
          onAddSection={handleAddCustomSection}
          onRemoveSection={handleRemoveCustomSection}
        />
        
        <button onClick={handleSave} type="button" className="save-btn">
          {user?.isAdmin ? '💾 Save CV (Admin)' : 'Save'}
        </button>

      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
        {otherInformation.filter(item => item.labelType === 'radio').map((item, index) => (
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

      {otherInformation.filter(item => item.labelType === 'checkbox' && !item.isCustom).map((item) => (
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

      {otherInformation.filter(item => item.isCustom).map((item) => (
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
      {fixedLanguages.map(language => (
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
    {customLanguages.length > 0 && customLanguages.map((lang, idx) => (
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

const DynamicSection = ({ title, entries, onChange, onAdd, onRemove, placeholder, rows, renderEntry }) => (
  <div className="dynamic-section">
    <h3>{title}</h3>
    {entries.map((entry, index) => (
      <div key={index} className="dynamic-entry">
        {renderEntry ? renderEntry(entry, index) : (
          <>
            <textarea
              value={entry}
              onChange={(e) => onChange(index, e.target.value)}
              rows={rows}
              placeholder={placeholder}
            />
            <button
              onClick={() => onRemove(index)}
              disabled={entries.length <= 1}
              className="remove-btn"
              title={entries.length <= 1 ? 'At least one entry required' : 'Remove entry'}
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

const CustomSectionsSection = ({
  customSections = [],
  onHeadingChange,
  onDetailChange,
  onAddDetail,
  onRemoveDetail,
  onAddSection,
  onRemoveSection,
}) => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8, color: '#374151' }}>
        Custom Sections
      </h3>
      
      {customSections.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          border: '2px dashed #d1d5db', 
          borderRadius: '8px',
          color: '#6b7280'
        }}>
          <p>No custom sections added yet.</p>
          <p>Click "Add New Section" to create your first custom section.</p>
        </div>
      ) : (
        customSections.map((section, sectionIndex) => (
          <div key={section.id || sectionIndex} style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '1rem',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <input
                type="text"
                value={section.title || ''}
                onChange={(e) => onHeadingChange(sectionIndex, e.target.value)}
                placeholder="Section Title"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  marginRight: '1rem'
                }}
              />
              <button
                onClick={() => onRemoveSection(sectionIndex)}
                className="remove-btn"
                type="button"
                title="Remove section"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove Section
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '1rem' }}>Section Items:</h4>
              {(section.items || []).map((item, itemIndex) => (
                <div key={itemIndex} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.5rem', 
                  marginBottom: '0.5rem' 
                }}>
                  <textarea
                    value={item || ''}
                    onChange={(e) => onDetailChange(sectionIndex, itemIndex, e.target.value)}
                    placeholder="Enter section item..."
                    rows={2}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    onClick={() => onRemoveDetail(sectionIndex, itemIndex)}
                    disabled={(section.items || []).length <= 1}
                    className="remove-btn"
                    type="button"
                    title={(section.items || []).length <= 1 ? 'At least one item required' : 'Remove item'}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (section.items || []).length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: (section.items || []).length <= 1 ? 0.5 : 1,
                      fontSize: '0.75rem'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => onAddDetail(sectionIndex)}
                className="add-btn"
                type="button"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem'
                }}
              >
                Add Item
              </button>
            </div>
          </div>
        ))
      )}
      
      <button
        onClick={onAddSection}
        className="add-btn"
        type="button"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600'
        }}
      >
        Add New Section
      </button>
    </div>
  );
};

export default Form;


