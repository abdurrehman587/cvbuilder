import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
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



const Form = forwardRef((props, ref) => {
  console.log('Form component rendered with formData:', props.formData);
  console.log('Form - cv_references:', props.formData?.cv_references);

  useEffect(() => {
    if (!props.formData) {
      props.setFormData(defaultFormData);
    }
  }, [props.formData, props.setFormData]);


  useEffect(() => {
    if (props.formData && props.onChange) {
      props.onChange(props.formData);
    }
  }, [props.formData, props.onChange]);

  // Fetch user's CV on mount or when user changes
  useEffect(() => {
    const fetchUserCV = async () => {
      if (!props.user || !props.user.email) return;
      
      console.log('Fetching CV for user:', props.user.email);
      console.log('User object:', props.user);
      console.log('Admin access:', localStorage.getItem('admin_cv_access'));
      console.log('Initial CV provided:', props.initialCV);
      console.log('New admin CV flag:', props.newAdminCV);
      
      // Check if user is admin or regular user
      const isAdmin = props.user.isAdmin || localStorage.getItem('admin_cv_access') === 'true';
      console.log('Is admin user:', isAdmin);
      
      // If newAdminCV is true, don't fetch existing CV - start with empty form
      if (props.newAdminCV) {
        console.log('Creating new admin CV - starting with empty form');
        props.setFormData(defaultFormData);
        if (props.onCVLoaded) {
          props.onCVLoaded(false);
        }
        return;
      }
      
      // If initialCV is provided (editing existing CV), use it directly
      if (props.initialCV) {
        console.log('Using initialCV data for editing:', props.initialCV);
        const cvData = props.initialCV;
        
        // Clear any cached admin CV data from localStorage
        if (localStorage.getItem('admin_selected_cv')) {
          console.log('Clearing cached admin_selected_cv from localStorage');
          localStorage.removeItem('admin_selected_cv');
        }
        
        // Clear any existing adminCVId when loading a different CV
        if (isAdmin && props.setAdminCVId) {
          console.log('Clearing adminCVId for new CV selection');
          props.setAdminCVId(null);
        }
        
        // Set the adminCVId for admin users only if this is an admin CV
        if (isAdmin && props.setAdminCVId && cvData.id && cvData.admin_email) {
          console.log('Setting adminCVId to:', cvData.id);
          props.setAdminCVId(cvData.id);
        } else {
          console.log('Not setting adminCVId:', {
            isAdmin,
            hasSetAdminCVId: !!props.setAdminCVId,
            hasCvDataId: !!cvData.id,
            cvDataId: cvData.id,
            isAdminCV: !!cvData.admin_email
          });
        }
        
        props.setFormData({
          image: null,
          imageUrl: cvData.image_url || '',
          name: cvData.name || '',
          phone: cvData.phone || '',
          email: cvData.email || '',
          address: cvData.address || '',
          objective: cvData.objective || [],
          education: cvData.education || [],
          workExperience: cvData.work_experience || [],
          skills: cvData.skills || [],
          certifications: cvData.certifications || [],
          projects: cvData.projects || [],
          languages: cvData.languages || [],
          customLanguages: [],
          hobbies: cvData.hobbies || [],
          customSections: cvData.custom_sections || [],
          cv_references: cvData.cv_references || ['References would be furnished on demand'],
          otherInformation: cvData.other_information || [],
        });
        
        if (props.onCVLoaded) {
          props.onCVLoaded(true);
        }
        return; // Don't fetch from database when initialCV is provided
      }
      
      if (isAdmin) {
        // For admin users, fetch from admin_cvs table
        const { data, error } = await supabase
          .from('admin_cvs')
          .select('*')
          .eq('admin_email', props.user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching admin CV:', error);
          return;
        }

        if (data) {
          console.log('Admin CV data loaded:', data);
          console.log('Admin CV - references field from database:', data.cv_references);
          
          // Set the adminCVId for admin users
          if (props.setAdminCVId && data.id) {
            console.log('Setting adminCVId from loaded CV data:', data.id);
            props.setAdminCVId(data.id);
          } else {
            console.log('Not setting adminCVId from loaded CV data:', {
              hasSetAdminCVId: !!props.setAdminCVId,
              hasDataId: !!data.id,
              dataId: data.id
            });
          }
          
          props.setFormData({
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
          
          if (props.onCVLoaded) {
            props.onCVLoaded(true);
          }
        } else {
          console.log('No existing admin CV found for user:', props.user.email);
          // Initialize with default data when no existing CV is found
          props.setFormData(defaultFormData);
          if (props.onCVLoaded) {
            props.onCVLoaded(false);
          }
        }
      } else {
        // For regular users, fetch from user_cvs table
        const { data, error } = await supabase
          .from('user_cvs')
          .select('*')
          .eq('user_email', props.user.email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user CV:', error);
          return;
        }

        if (data) {
          console.log('User CV data loaded:', data);
          console.log('User CV - references field from database:', data.cv_references);
          props.setFormData({
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
          
          if (props.onCVLoaded) {
            props.onCVLoaded(true);
          }
        } else {
          console.log('No existing user CV found for user:', props.user.email);
          // Initialize with default data when no existing CV is found
          props.setFormData(defaultFormData);
          if (props.onCVLoaded) {
            props.onCVLoaded(false);
          }
        }
      }
    };
    fetchUserCV();
  }, [props.user, props.initialCV, props.newAdminCV]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('[data-search-container]');
      if (searchContainer && !searchContainer.contains(event.target)) {
        // setShowSearchResults(false); // This state is removed, so this effect is no longer needed
      }
    };

    // if (showSearchResults) { // This state is removed, so this effect is no longer needed
    //   document.addEventListener('mousedown', handleClickOutside);
    // }

    return () => {
      // document.removeEventListener('mousedown', handleClickOutside); // This state is removed, so this effect is no longer needed
    };
  }, []); // Removed showSearchResults from dependency array



  const handleChange = (field) => (e) => {
    props.setFormData({ ...props.formData, [field]: e.target.value });
  };

  const handleWorkExperienceChange = (index, field, value) => {
    const updated = [...props.formData.workExperience];
    updated[index] = { ...updated[index], [field]: value };
    props.setFormData({ ...props.formData, workExperience: updated });
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...props.formData.education];
    updated[index] = { ...updated[index], [field]: value };
    props.setFormData({ ...props.formData, education: updated });
  };

  const handleAddEducation = () => {
    props.setFormData({ ...props.formData, education: [...props.formData.education, { degree: '', institute: '', year: '' }] });
  };

  const handleRemoveEducation = (index) => {
    const updated = [...props.formData.education];
    if (updated.length > 1) {
      updated.splice(index, 1);
      props.setFormData({ ...props.formData, education: updated });
    }
  };

  const handleArrayChange = (field, index, value, type) => {
    const updated = [...props.formData[field]];
    if (field === 'skills' && type) {
      updated[index] = { ...updated[index], [type]: value };
    } else if (field === 'customLanguages' && type === 'name') {
      updated[index] = { ...updated[index], name: value };
    } else if (field === 'otherInformation') {
      updated[index] = { ...updated[index], [type]: value };
    } else {
      updated[index] = value;
    }
    props.setFormData({ ...props.formData, [field]: updated });
  };

  const handleAddEntry = (field) => {
    if (field === 'workExperience') {
      props.setFormData({ ...props.formData, workExperience: [...props.formData.workExperience, { company: '', designation: '', duration: '' }] });
    } else if (field === 'skills') {
      props.setFormData({ ...props.formData, skills: [...props.formData.skills, { name: '', percentage: '' }] });
    } else if (field === 'customLanguages') {
      props.setFormData({ ...props.formData, customLanguages: [...props.formData.customLanguages, { name: '', selected: true }] });
    } else if (field === 'otherInformation') {
      const newId = props.formData.otherInformation.length > 0 ? Math.max(...props.formData.otherInformation.map(oi => oi.id)) + 1 : 1;
      props.setFormData({
        ...props.formData,
        otherInformation: [
          ...props.formData.otherInformation,
          { id: newId, labelType: 'checkbox', label: '', checked: true, value: '', isCustom: true },
        ]
      });
    } else if (field === 'cv_references') {
      props.setFormData({ ...props.formData, [field]: [...props.formData[field], 'References would be furnished on demand'] });
    } else {
      props.setFormData({ ...props.formData, [field]: [...props.formData[field], initialEntry] });
    }
  };

  const handleRemoveEntry = (field, index) => {
    const updated = [...props.formData[field]];
    if (updated.length > 1) {
      updated.splice(index, 1);
      props.setFormData({ ...props.formData, [field]: updated });
    }
  };

  const handleRadioChange = (index, radioValue) => {
    const updated = props.formData.otherInformation.map(item => {
      if (item.labelType === 'radio') {
        return { ...item, checked: item.radioValue === radioValue };
      }
      return item;
    });
    props.setFormData({ ...props.formData, otherInformation: updated });
  };

  const handleCheckboxChange = (index) => {
    const updated = [...props.formData.otherInformation];
    updated[index].checked = !updated[index].checked;
    props.setFormData({ ...props.formData, otherInformation: updated });
  };

  const handleOtherInfoValueChange = (index, value) => {
    const updated = [...props.formData.otherInformation];
    updated[index].value = value;
    props.setFormData({ ...props.formData, otherInformation: updated });
  };

  const handleOtherInfoLabelChange = (index, value) => {
    const updated = [...props.formData.otherInformation];
    updated[index].label = value;
    props.setFormData({ ...props.formData, otherInformation: updated });
  };

  const handleLanguageCheckboxChange = (language) => {
    let updatedLanguages = [...props.formData.languages];
    if (updatedLanguages.includes(language)) {
      updatedLanguages = updatedLanguages.filter(lang => lang !== language);
    } else {
      updatedLanguages.push(language);
    }
    props.setFormData({ ...props.formData, languages: updatedLanguages });
  };

  const handleCustomLanguageCheckboxChange = (index) => {
    const updated = [...props.formData.customLanguages];
    updated[index].selected = !updated[index].selected;
    props.setFormData({ ...props.formData, customLanguages: updated });
  };

  const handleCustomLanguageChange = (index, value) => {
    const updated = [...props.formData.customLanguages];
    updated[index].name = value;
    props.setFormData({ ...props.formData, customLanguages: updated });
  };

  const handleCustomSectionChange = (index, field, value) => {
    const updated = [...props.formData.customSections];
    updated[index] = { ...updated[index], [field]: value };
    props.setFormData({ ...props.formData, customSections: updated });
  };

  const handleAddCustomSection = () => {
    props.setFormData({ 
      ...props.formData, 
      customSections: [...props.formData.customSections, { heading: '', details: [''] }] 
    });
  };

  const handleRemoveCustomSection = (index) => {
    const updated = [...props.formData.customSections];
    updated.splice(index, 1);
    props.setFormData({ ...props.formData, customSections: updated });
  };

  const handleCustomSectionDetailChange = (sectionIndex, detailIndex, value) => {
    const updated = [...props.formData.customSections];
    updated[sectionIndex].details[detailIndex] = value;
    props.setFormData({ ...props.formData, customSections: updated });
  };

  const handleAddCustomSectionDetail = (sectionIndex) => {
    const updated = [...props.formData.customSections];
    updated[sectionIndex].details.push('');
    props.setFormData({ ...props.formData, customSections: updated });
  };

  const handleRemoveCustomSectionDetail = (sectionIndex, detailIndex) => {
    const updated = [...props.formData.customSections];
    updated[sectionIndex].details.splice(detailIndex, 1);
    props.setFormData({ ...props.formData, customSections: updated });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      props.setFormData({ ...props.formData, image: e.target.files[0] });
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
    console.log('=== SAVE CV START ===');
    console.log('Form props:', {
      user: props.user,
      adminCVId: props.adminCVId,
      setAdminCVId: !!props.setAdminCVId,
      newAdminCV: props.newAdminCV,
      initialCV: props.initialCV
    });
    
    try {
      console.log('App version check - Form.js loaded at:', new Date().toISOString());
      console.log('User:', props.user);
      console.log('Form data:', props.formData);
      
      // Test toast to see if the system is working
      console.log('Testing toast system...');
      
      let result; // Declare result variable
      let existingCV = null; // Declare existingCV variable
      
      // Ensure user is present
      if (!props.user) {
        safeToast.error('You must be signed in to save your CV.');
        return;
      }

      let imageUrl = props.formData.imageUrl;

      // Upload image if present
      if (props.formData.image) {
        const uploadedUrl = await uploadImage(props.formData.image);
        if (!uploadedUrl) {
          toast.error('Image upload failed. Please try again.');
          return;
        }
        imageUrl = uploadedUrl;
      }

      // Check if user is admin or regular user
      const isAdmin = props.user.isAdmin || localStorage.getItem('admin_cv_access') === 'true';
      console.log('Is admin user:', isAdmin);
      
      if (isAdmin) {
        // For admin users, save to admin_cvs table
        const payload = {
          admin_email: props.user.email,
          cv_name: props.formData.name || 'Unnamed CV',
          image_url: imageUrl && imageUrl.startsWith('http') ? imageUrl : null,
          name: props.formData.name || '',
          phone: props.formData.phone || '',
          email: props.formData.email || '',
          address: props.formData.address || '',
          objective: (props.formData.objective || []).map(entry => entry || ''),
          education: (props.formData.education || []).map(e => ({
            degree: e.degree || '',
            institute: e.institute || '',
            year: e.year || ''
          })),
          work_experience: (props.formData.workExperience || []).map(w => ({
            company: w.company || '',
            designation: w.designation || '',
            duration: w.duration || '',
            details: w.details || ''
          })),
          skills: (props.formData.skills || []).map(s => ({
            name: s.name || '',
            percentage: s.percentage || ''
          })),
          certifications: (props.formData.certifications || []).map(c => c || ''),
          projects: (props.formData.projects || []).map(p => p || ''),
          languages: [
            ...(props.formData.languages || []),
            ...(props.formData.customLanguages || [])
              .filter(lang => lang.selected && lang.name?.trim())
              .map(lang => lang.name.trim())
          ],
          hobbies: (props.formData.hobbies || []).map(h => h || ''),
          custom_sections: (props.formData.customSections || []).map(section => ({
            heading: section.heading || '',
            details: (section.details || []).map(detail => detail || '')
          })),
          cv_references: (props.formData.cv_references || []).map(r => r || ''),
          other_information: (props.formData.otherInformation || []).map(info => ({
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

        // If newAdminCV is true or adminCVId is null, insert a new row
        console.log('Save logic debug:', {
          newAdminCV: props.newAdminCV,
          adminCVId: props.adminCVId,
          hasAdminCVId: !!props.adminCVId
        });
        
        if (props.adminCVId) {
          // Update existing admin CV using the specific ID
          console.log('Updating existing admin CV for user:', props.user.email);
          console.log('Update payload:', payload);
          result = await supabase
            .from('admin_cvs')
            .update(payload)
            .eq('id', props.adminCVId);
          existingCV = true;
        } else {
          // Insert new admin CV
          console.log('Inserting new admin CV for user:', props.user.email);
          console.log('Insert payload:', payload);
          const insertResult = await supabase
            .from('admin_cvs')
            .insert([payload])
            .select('id')
            .single();
          result = insertResult;
          if (insertResult.data && insertResult.data.id && props.setAdminCVId) {
            props.setAdminCVId(insertResult.data.id);
          }
          existingCV = null;
        }
      } else {
        // For regular users, use direct upsert approach to save to user_cvs table
        const payload = {
          user_email: props.user.email,
          image_url: imageUrl && imageUrl.startsWith('http') ? imageUrl : null,
          name: props.formData.name || '',
          phone: props.formData.phone || '',
          email: props.formData.email || '',
          address: props.formData.address || '',
          objective: (props.formData.objective || []).map(entry => entry || ''),
          education: (props.formData.education || []).map(e => ({
            degree: e.degree || '',
            institute: e.institute || '',
            year: e.year || ''
          })),
          work_experience: (props.formData.workExperience || []).map(w => ({
            company: w.company || '',
            designation: w.designation || '',
            duration: w.duration || '',
            details: w.details || ''
          })),
          skills: (props.formData.skills || []).map(s => ({
            name: s.name || '',
            percentage: s.percentage || ''
          })),
          certifications: (props.formData.certifications || []).map(c => c || ''),
          projects: (props.formData.projects || []).map(p => p || ''),
          languages: [
            ...(props.formData.languages || []),
            ...(props.formData.customLanguages || [])
              .filter(lang => lang.selected && lang.name?.trim())
              .map(lang => lang.name.trim())
          ],
          hobbies: (props.formData.hobbies || []).map(h => h || ''),
          custom_sections: (props.formData.customSections || []).map(section => ({
            heading: section.heading || '',
            details: (section.details || []).map(detail => detail || '')
          })),
          cv_references: (props.formData.cv_references || []).map(r => r || ''),
          other_information: (props.formData.otherInformation || []).map(info => ({
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
        console.log('Checking for existing CV for user:', props.user.email);
        console.log('Using table: user_cvs');
        
        // First check if CV exists to determine if it's an update or create
        const { data: existingUserCVData, error: checkError } = await supabase
          .from('user_cvs')
          .select('id')
          .eq('user_email', props.user.email)
          .maybeSingle();
        
        console.log('User CV check result:', { existingUserCVData, checkError });
        existingCV = existingUserCVData; // Assign to the outer variable

        if (checkError) {
          console.error('Error checking for existing CV:', checkError);
        }

        if (existingUserCVData) {
          // Update existing CV
          console.log('Updating existing CV for user:', props.user.email);
          console.log('Update payload:', payload);
          result = await supabase
            .from('user_cvs')
            .update(payload)
            .eq('user_email', props.user.email);
        } else {
          // Insert new CV
          console.log('Inserting new CV for user:', props.user.email);
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
      if (props.formData.image && imageUrl) {
        props.setFormData(prev => ({ ...prev, image: null, imageUrl }));
      }
    } catch (error) {
      console.error('Unexpected error during save:', error);
      safeToast.error('An unexpected error occurred while saving.');
    }
  };

  // Expose handleSave to parent via ref
  useImperativeHandle(ref, () => ({
    handleSave,
  }));

  // Guard: Don't render until formData is initialized
  if (!props.formData) return null;

  return (
    <>


      <div className="form-container">


          {/* Profile Image */}
          <div className="profile-image-section">
          <h3>Profile Image</h3>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {(props.formData.image || props.formData.imageUrl) && (
            <img
              src={
                props.formData.image
                  ? URL.createObjectURL(props.formData.image)
                  : props.formData.imageUrl
              }
              alt="Preview"
              className="profile-image-preview"
            />
          )}
        </div>

        {/* Contact Info Row */}
        <div className="contact-row">
          <InputField label="Name" value={props.formData.name} onChange={handleChange('name')} placeholder="Your full name" />
          <InputField label="Phone" value={props.formData.phone} onChange={handleChange('phone')} placeholder="Your phone number" />
        </div>
        <div className="contact-row">
          <InputField label="Email" value={props.formData.email} onChange={handleChange('email')} placeholder="Your email address" />
          <InputField label="Address" value={props.formData.address} onChange={handleChange('address')} placeholder="Your address" />
        </div>

        {/* Other sections unchanged for brevity, same as previous cleaned-up version */}
        <DynamicSection
          title="Objective"
          entries={props.formData.objective}
          onChange={(index, val) => handleArrayChange('objective', index, val)}
          onRemove={(index) => handleRemoveEntry('objective', index)}
          placeholder="Write your career objective..."
          rows={2}
        />
        <EducationSection
          education={props.formData.education}
          onChange={handleEducationChange}
          onAdd={handleAddEducation}
          onRemove={handleRemoveEducation}
        />
        <WorkExperienceSection
          workExperience={props.formData.workExperience}
          onChange={handleWorkExperienceChange}
          onAdd={() => handleAddEntry('workExperience')}
          onRemove={(index) => handleRemoveEntry('workExperience', index)}
        />
        <OtherInformationSection
          otherInformation={props.formData.otherInformation}
          onRadioChange={handleRadioChange}
          onCheckboxChange={handleCheckboxChange}
          onValueChange={handleOtherInfoValueChange}
          onLabelChange={handleOtherInfoLabelChange}
          onAdd={() => handleAddEntry('otherInformation')}
          onRemove={(id) => {
            const updated = props.formData.otherInformation.filter(oi => oi.id !== id);
            props.setFormData({ ...props.formData, otherInformation: updated });
          }}
        />
        <DynamicSection
          title="Skills"
          entries={props.formData.skills}
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
                disabled={props.formData.skills.length <= 1}
                className="remove-btn"
                type="button"
                title={props.formData.skills.length <= 1 ? 'At least one skill entry required' : 'Remove'}
              >
                Remove
              </button>
            </div>
          )}
        />
        <DynamicSection
          title="Certifications"
          entries={props.formData.certifications}
          onChange={(index, val) => handleArrayChange('certifications', index, val)}
          onAdd={() => handleAddEntry('certifications')}
          onRemove={(index) => handleRemoveEntry('certifications', index)}
          placeholder="List your certifications..."
          rows={2}
        />
        <DynamicSection
          title="Projects"
          entries={props.formData.projects}
          onChange={(index, val) => handleArrayChange('projects', index, val)}
          onAdd={() => handleAddEntry('projects')}
          onRemove={(index) => handleRemoveEntry('projects', index)}
          placeholder="Describe your projects..."
          rows={2}
        />
        <LanguagesSection
          fixedLanguages={fixedLanguages}
          languages={props.formData.languages}
          customLanguages={props.formData.customLanguages}
          onLanguageChange={handleLanguageCheckboxChange}
          onCustomLanguageChange={handleCustomLanguageChange}
          onCustomLanguageCheckboxChange={handleCustomLanguageCheckboxChange}
          onAddCustomLanguage={() => handleAddEntry('customLanguages')}
          onRemoveCustomLanguage={(idx) => {
            const updated = [...props.formData.customLanguages];
            updated.splice(idx, 1);
            props.setFormData({ ...props.formData, customLanguages: updated });
          }}
        />
        <DynamicSection
          title="Hobbies"
          entries={props.formData.hobbies}
          onChange={(index, val) => handleArrayChange('hobbies', index, val)}
          onAdd={() => handleAddEntry('hobbies')}
          onRemove={(index) => handleRemoveEntry('hobbies', index)}
          placeholder="List your hobbies..."
          rows={1}
        />
        <CustomSection
          customSections={props.formData.customSections}
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
            entries={props.formData.cv_references}
            onChange={(index, val) => {
              console.log('References onChange:', { index, val, currentEntries: props.formData.cv_references });
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
});

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
