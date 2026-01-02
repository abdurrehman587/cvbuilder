import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const usePreviewHandler = (passedFormData = null) => {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    profileImage: null,
    professionalSummary: '',
    education: [],
    experience: [],
    skills: [],
    certifications: [],
    languages: [],
    hobbies: [],
    otherInfo: [],
    customSection: [],
    references: []
  });
  
  // Use ref to track current formData to avoid stale closure issues
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Function to get form data from Form1 inputs
  // This reads from DOM, so it works even when form is not visible (like on preview page)
  // Use ref for hobbies to prevent infinite loop - hobbies are read from current formDataRef
  const getFormData = useCallback(() => {
    const data = {
      name: document.getElementById('name-input')?.value || '',
      position: document.getElementById('position-input')?.value || '',
      phone: document.getElementById('phone-input')?.value || '',
      email: document.getElementById('email-input')?.value || '',
      address: document.getElementById('address-input')?.value || '',
      profileImage: document.getElementById('file-input')?.files?.[0] || null,
      professionalSummary: document.getElementById('professional-summary-textarea')?.value || '',
      education: [],
      experience: [],
      skills: [],
      certifications: [],
      languages: formDataRef.current?.languages || [], // Use ref to avoid dependency
      hobbies: formDataRef.current?.hobbies || [], // Use ref to avoid dependency
      otherInfo: [],
      customSection: [],
      references: []
    };

    // Get education data - first get the main education section, then any additional groups
    const mainDegree = document.getElementById('degree-input')?.value || '';
    const mainBoard = document.getElementById('board-input')?.value || '';
    const mainYear = document.getElementById('year-input')?.value || '';
    const mainMarks = document.getElementById('marks-input')?.value || '';
    
    let educationData = [];
    
    // Add main education entry if it has data
    if (mainDegree.trim() || mainBoard.trim() || mainYear.trim() || mainMarks.trim()) {
      educationData.push({
        degree: mainDegree,
        board: mainBoard,
        year: mainYear,
        marks: mainMarks
      });
    }
    
    // Get additional education groups
    const educationGroups = document.querySelectorAll('.education-group');
    educationData = educationData.concat(Array.from(educationGroups).map(group => {
      const degree = group.querySelector('.degree-input')?.value || '';
      const board = group.querySelector('.board-input')?.value || '';
      const year = group.querySelector('.year-input')?.value || '';
      const marks = group.querySelector('.marks-input')?.value || '';
      
      if (degree.trim() || board.trim() || year.trim() || marks.trim()) {
        return { degree, board, year, marks };
      }
      return null;
    }).filter(edu => edu !== null));
    
    data.education = educationData;
    
    // Debug log removed to prevent console spam

    // Get experience data - first get the main experience section, then any additional groups
    const mainJobTitle = document.getElementById('job-title-input')?.value || '';
    const mainCompany = document.getElementById('company-input')?.value || '';
    const mainDuration = document.getElementById('duration-input')?.value || '';
    const mainJobDetails = document.getElementById('job-details-textarea')?.value || '';
    
    let experienceData = [];
    
    // Add main experience entry if it has data
    if (mainJobTitle.trim() || mainCompany.trim() || mainDuration.trim() || mainJobDetails.trim()) {
      experienceData.push({
        jobTitle: mainJobTitle,
        company: mainCompany,
        duration: mainDuration,
        jobDetails: mainJobDetails
      });
    }
    
    // Get additional experience groups
    const experienceGroups = document.querySelectorAll('.experience-group');
    experienceData = experienceData.concat(Array.from(experienceGroups).map(group => {
      const jobTitle = group.querySelector('.job-title-input')?.value || '';
      const company = group.querySelector('.company-input')?.value || '';
      const duration = group.querySelector('.duration-input')?.value || '';
      const jobDetails = group.querySelector('.job-details-textarea')?.value || '';
      
      if (jobTitle.trim() || company.trim() || duration.trim() || jobDetails.trim()) {
        return { jobTitle, company, duration, jobDetails };
      }
      return null;
    }).filter(exp => exp !== null));
    
    data.experience = experienceData;

    // Get skills data
    const skillInputs = document.querySelectorAll('.skills-section input[type="text"]');
    data.skills = Array.from(skillInputs).map(input => input.value).filter(value => value.trim() !== '');

    // Get certifications data
    const certInputs = document.querySelectorAll('.certifications-section input[type="text"]');
    data.certifications = Array.from(certInputs).map(input => input.value).filter(value => value.trim() !== '');

    // Get languages data
    const langInputs = document.querySelectorAll('.languages-section .language-input');
    const langLevelInputs = document.querySelectorAll('.languages-section .language-level-input');
    data.languages = Array.from(langInputs).map((input, index) => {
      const name = input.value.trim();
      const levelInput = langLevelInputs[index];
      const level = levelInput ? levelInput.value.trim() : '';
      if (name) {
        return { name, level };
      }
      return null;
    }).filter(lang => lang !== null);

    // Get hobbies data - now managed through React state
    // Since hobbies are now managed in React state, we need to get them from the current formData state
    data.hobbies = formData.hobbies || [];

    // Get references data
    const refInputs = document.querySelectorAll('.references-section input[type="text"]');
    data.references = Array.from(refInputs).map(input => input.value).filter(value => value.trim() !== '');

    // Get other information data
    const otherInfoData = [];
    
    // Get main other information fields
    const fatherName = document.getElementById('father-name-input-always')?.value || '';
    const husbandName = document.getElementById('husband-name-input-always')?.value || '';
    const cnic = document.getElementById('cnic-input-always')?.value || '';
    const dob = document.getElementById('dob-input-always')?.value || '';
    const maritalStatus = document.getElementById('marital-status-input-always')?.value || '';
    const religion = document.getElementById('religion-input-always')?.value || '';
    
    // Add main fields if they have values
    if (fatherName.trim()) otherInfoData.push({ label: "Father's Name", value: fatherName });
    if (husbandName.trim()) otherInfoData.push({ label: "Husband's Name", value: husbandName });
    if (cnic.trim()) otherInfoData.push({ label: "CNIC", value: cnic });
    if (dob.trim()) otherInfoData.push({ label: "Date of Birth", value: dob });
    if (maritalStatus.trim()) otherInfoData.push({ label: "Marital Status", value: maritalStatus });
    if (religion.trim()) otherInfoData.push({ label: "Religion", value: religion });
    
    // Get custom other information fields
    const customInfoGroups = document.querySelectorAll('.custom-info-wrapper');
    customInfoGroups.forEach(group => {
      const labelInput = group.querySelector('.custom-label-input-field');
      const valueInput = group.querySelector('.custom-value-input-field');
      if (labelInput?.value.trim() && valueInput?.value.trim()) {
        otherInfoData.push({ label: labelInput.value, value: valueInput.value });
      }
    });
    
    data.otherInfo = otherInfoData;

    // Get custom section data
    const customSectionHeading = document.getElementById('custom-section-heading-input')?.value || '';
    const customSectionDetail = document.getElementById('custom-section-detail-input')?.value || '';
    
    let customSectionData = [];
    
    // Add main custom section if it has data
    if (customSectionHeading.trim() || customSectionDetail.trim()) {
      customSectionData.push({
        heading: customSectionHeading,
        detail: customSectionDetail
      });
    }
    
    // Get additional custom section details
    const customDetailInputs = document.querySelectorAll('.custom-detail-input');
    customDetailInputs.forEach(input => {
      const detail = input.value.trim();
      if (detail) {
        customSectionData.push({
          heading: '', // No heading for additional details
          detail: detail
        });
      }
    });
    
    data.customSection = customSectionData;

    return data;
  }, []); // Empty deps - use ref for hobbies to prevent infinite loop

  // Use passed form data if available, but also read from DOM to get latest values
  useEffect(() => {
    // First, check localStorage for form data (in case it was stored before navigation)
    const storedData = localStorage.getItem('cvFormData');
    let dataToUse = passedFormData;
    
    if (storedData && (!passedFormData || !passedFormData.name)) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('PreviewHandler3 - Loaded form data from localStorage:', parsedData);
        dataToUse = parsedData;
      } catch (e) {
        console.error('PreviewHandler3 - Error parsing stored form data:', e);
      }
    }
    
    if (dataToUse) {
      // Always use dataToUse as primary source (from App.js state or localStorage)
      // This ensures we have all data even when form is not in DOM (preview page)
      const domData = getFormData();
      console.log('PreviewHandler3 - passedFormData:', passedFormData);
      console.log('PreviewHandler3 - dataToUse:', dataToUse);
      console.log('PreviewHandler3 - domData:', domData);
      
      // Check if DOM has meaningful data (form is still in DOM)
      const domHasData = domData.name || domData.position || domData.phone || 
                        domData.professionalSummary ||
                        (domData.education && domData.education.length > 0) ||
                        (domData.experience && domData.experience.length > 0);
      
      // Merge strategy: 
      // - Always start with dataToUse (from App.js state or localStorage) as it's the source of truth
      // - If DOM has data, merge DOM data to fill in any gaps
      // - Always merge professionalSummary from DOM if available (form input takes priority)
      // - This ensures we have all data whether form is in DOM or not
      // - For profileImage: prefer DOM file input (if file is selected), then dataToUse (from database), then null
      const mergedData = {
        ...dataToUse, // Start with dataToUse (source of truth)
        ...(domHasData ? domData : {}), // Only merge DOM data if it has meaningful content
        // Always prefer DOM professionalSummary if it exists (form input is most current)
        professionalSummary: domData.professionalSummary || dataToUse.professionalSummary,
        // Profile image: prefer DOM file input if available (newly selected), then dataToUse (from database/base64), then null
        profileImage: domData.profileImage || dataToUse.profileImage,
        customSection: dataToUse.customSection && dataToUse.customSection.length > 0 
          ? dataToUse.customSection 
          : (domData.customSection || []),
        otherInfo: dataToUse.otherInfo && dataToUse.otherInfo.length > 0
          ? dataToUse.otherInfo
          : (domData.otherInfo || [])
      };
      
      console.log('PreviewHandler3 - mergedData:', mergedData);
      console.log('PreviewHandler3 - mergedData.education:', mergedData.education);
      console.log('PreviewHandler3 - mergedData.experience:', mergedData.experience);
      setFormData(mergedData);
      // Update ref immediately so updatePreviewData can check it
      formDataRef.current = mergedData;
    } else {
      // If no passedFormData or stored data, just read from DOM
      const domData = getFormData();
      setFormData(domData);
      formDataRef.current = domData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedFormData]); // Remove getFormData from deps to prevent infinite loop - it's stable now

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (formData.profileImage && formData.profileImage instanceof File) {
        URL.revokeObjectURL(URL.createObjectURL(formData.profileImage));
      }
    };
  }, [formData.profileImage]);

  // Function to update preview data - memoized to prevent infinite re-renders
  // This reads from DOM and updates state, but also merges with passedFormData if available
  const updatePreviewData = useCallback(() => {
    const newData = getFormData();
    console.log('updatePreviewData - newData from DOM:', newData);
    
    // Check if DOM has meaningful data
    const domHasData = newData.name || newData.position || newData.phone || 
                      newData.professionalSummary ||
                      (newData.education && newData.education.length > 0) ||
                      (newData.experience && newData.experience.length > 0);
    
    // Check localStorage for stored data (in case form is not in DOM)
    const storedData = localStorage.getItem('cvFormData');
    let dataToUse = passedFormData;
    
    if (storedData && (!passedFormData || !passedFormData.name)) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('updatePreviewData - Loaded from localStorage:', parsedData);
        dataToUse = parsedData;
      } catch (e) {
        console.error('updatePreviewData - Error parsing stored data:', e);
      }
    }
    
    // If DOM is empty (form not in DOM, like on preview page), don't overwrite with empty data
    // Only update if DOM has data or if we don't have any data yet
    // Use formDataRef to get current state value (not stale closure)
    const currentFormData = formDataRef.current;
    const hasExistingData = currentFormData.name || currentFormData.professionalSummary || currentFormData.education?.length > 0 || currentFormData.experience?.length > 0;
    const hasDataToUse = dataToUse && (dataToUse.name || dataToUse.professionalSummary || dataToUse.education?.length > 0 || dataToUse.experience?.length > 0);
    
    if (!domHasData && (hasDataToUse || hasExistingData)) {
      console.log('updatePreviewData - DOM is empty but we have data, skipping update to prevent overwrite');
      console.log('updatePreviewData - currentFormData:', currentFormData);
      console.log('updatePreviewData - hasDataToUse:', hasDataToUse, 'hasExistingData:', hasExistingData);
      return; // Don't overwrite existing data with empty DOM data
    }
    
    // If we have dataToUse, merge it with DOM data
    if (dataToUse) {
      const mergedData = {
        ...newData, // Start with DOM data
        ...dataToUse, // Override with dataToUse (from app state or localStorage)
        // Always prefer DOM professionalSummary if it exists (form input is most current)
        professionalSummary: newData.professionalSummary || dataToUse.professionalSummary,
        // Profile image: prefer DOM file input if it has a file, otherwise use dataToUse
        // This ensures newly selected files are captured immediately
        profileImage: newData.profileImage || dataToUse.profileImage,
        customSection: dataToUse.customSection && dataToUse.customSection.length > 0 
          ? dataToUse.customSection 
          : (newData.customSection || []),
        otherInfo: dataToUse.otherInfo && dataToUse.otherInfo.length > 0
          ? dataToUse.otherInfo
          : (newData.otherInfo || [])
      };
      console.log('updatePreviewData - mergedData:', mergedData);
      setFormData(mergedData);
      formDataRef.current = mergedData;
    } else {
      setFormData(newData);
      formDataRef.current = newData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedFormData]); // Remove getFormData from deps to prevent infinite loop - it's stable now

  // Function to get profile image URL - memoized to prevent flickering
  const getProfileImageUrl = useMemo(() => {
    if (formData.profileImage) {
      // If it's a File object, create object URL
      if (formData.profileImage instanceof File) {
        return URL.createObjectURL(formData.profileImage);
      }
      // If it's base64 data from database, use it directly
      if (formData.profileImage.data) {
        return formData.profileImage.data;
      }
    }
    return null;
  }, [formData.profileImage]);

  // Function to format contact information
  const formatContactInfo = () => {
    const contact = [];
    
    if (formData.phone) {
      contact.push({ type: 'phone', value: formData.phone, icon: '📞' });
    }
    if (formData.email) {
      contact.push({ type: 'email', value: formData.email, icon: '✉️' });
    }
    if (formData.address) {
      contact.push({ type: 'address', value: formData.address, icon: '📍' });
    }
    
    return contact;
  };

  // Real-time updates are now handled by the parent component through props
  // No need for setInterval which was causing infinite re-renders

  return {
    formData,
    updatePreviewData,
    getProfileImageUrl,
    formatContactInfo
  };
};

export default usePreviewHandler;

