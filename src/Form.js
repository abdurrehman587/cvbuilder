import React, { useState, useEffect } from 'react';
import supabase from './supabase';
import { toast } from 'react-toastify';
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
  references: [''],
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
      if (!user) return;
      
      try {
        console.log('Fetching CV for user:', user.id);
        const { data, error } = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user.id)
          .single();

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
          
          console.error('Unexpected error fetching CV:', error);
          return;
        }

        if (data) {
          console.log('CV data loaded successfully:', data);
          setFormData({
            image: null,
            imageUrl: data.image_url || '',
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            objective: JSON.parse(data.objective || '[]'),
            education: JSON.parse(data.education || '[]'),
            workExperience: JSON.parse(data.work_experience || '[]'),
            skills: JSON.parse(data.skills || '[]'),
            certifications: JSON.parse(data.certifications || '[]'),
            projects: JSON.parse(data.projects || '[]'),
            languages: JSON.parse(data.languages || '[]'),
            customLanguages: [],
            hobbies: JSON.parse(data.hobbies || '[]'),
            references: JSON.parse(data.references || '[]'),
            otherInformation: JSON.parse(data.other_information || '[]'),
          });
        }
      } catch (err) {
        console.error('Exception while fetching CV:', err);
      }
    };
    
    fetchUserCV();
    // eslint-disable-next-line
  }, [user]);



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
    updated[index].name = value;
    setFormData({ ...formData, customLanguages: updated });
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
      // Ensure user is present
      if (!user) {
        toast.error('You must be signed in to save your CV.');
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

      // Prepare payload for Supabase
      const payload = {
        user_id: user.id,
        image_url: imageUrl && imageUrl.startsWith('http') ? imageUrl : null,
        name: formData.name || '',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        objective: JSON.stringify((formData.objective || []).map(entry => entry || '')),
        education: JSON.stringify((formData.education || []).map(e => ({
          degree: e.degree || '',
          institute: e.institute || '',
          year: e.year || ''
        }))),
        work_experience: JSON.stringify((formData.workExperience || []).map(w => ({
          company: w.company || '',
          designation: w.designation || '',
          duration: w.duration || '',
          details: w.details || ''
        }))),
        skills: JSON.stringify((formData.skills || []).map(s => ({
          name: s.name || '',
          percentage: s.percentage || ''
        }))),
        certifications: JSON.stringify((formData.certifications || []).map(c => c || '')),
        projects: JSON.stringify((formData.projects || []).map(p => p || '')),
        languages: JSON.stringify([
          ...(formData.languages || []),
          ...(formData.customLanguages || [])
            .filter(lang => lang.selected && lang.name?.trim())
            .map(lang => lang.name.trim())
        ]),
        hobbies: JSON.stringify((formData.hobbies || []).map(h => h || '')),
        references: JSON.stringify((formData.references || []).map(r => r || '')),
        other_information: JSON.stringify((formData.otherInformation || []).map(info => ({
          id: info.id,
          labelType: info.labelType || '',
          label: info.label || '',
          checked: info.checked === true,
          value: info.value || '',
          name: info.name || '',
          radioValue: info.radioValue || '',
          isCustom: info.isCustom === true
        })))
      };

      // Save (insert or update) to Supabase
      const { data, error } = await supabase
        .from('cvs')
        .upsert([payload], { onConflict: 'user_id' });

      if (error) {
        console.error('Supabase error:', error);
        
        // Check if it's a table not found error
        if (error.message && error.message.includes('relation "cvs" does not exist')) {
          toast.error('Database table not found. Please run the database setup script.');
          return;
        }
        
        // Check if it's a permission error
        if (error.message && error.message.includes('permission denied')) {
          toast.error('Permission denied. Please check your authentication.');
          return;
        }
        
        toast.error(`Save failed: ${error.message}`);
        return;
      }

      toast.success('CV Saved Successfully!');
      // Optionally update formData with new imageUrl if uploaded
      if (formData.image && imageUrl) {
        setFormData(prev => ({ ...prev, image: null, imageUrl }));
      }
    } catch (error) {
      toast.error('An unexpected error occurred while saving.');
    }
  };


  const handleSearch = async () => {
    try {
      if (!searchName && !searchPhone) {
        toast.error("Please enter name or phone number to search.");
        return;
      }

      let query = supabase.from('cvs').select('*').limit(1); // <-- updated table name

      if (searchName) {
        query = query.ilike('name', `%${searchName}%`);
      }

      if (searchPhone) {
        query = query.ilike('phone', `%${searchPhone}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Search error:", error);
        toast.error("Failed to search CV.");
        return;
      }

      if (data.length === 0) {
        toast.info("No matching CV found.");
        return;
      }

      const cv = data[0];

      setFormData({
        image: null,
        imageUrl: cv.image_url || '',
        name: cv.name || '',
        phone: cv.phone || '',
        email: cv.email || '',
        address: cv.address || '',
        objective: JSON.parse(cv.objective || '[]'),
        education: JSON.parse(cv.education || '[]'),
        workExperience: JSON.parse(cv.work_experience || '[]'),
        skills: JSON.parse(cv.skills || '[]'),
        certifications: JSON.parse(cv.certifications || '[]'),
        projects: JSON.parse(cv.projects || '[]'),
        languages: JSON.parse(cv.languages || '[]'),
        customLanguages: [], // no longer used
        hobbies: JSON.parse(cv.hobbies || '[]'),
        references: JSON.parse(cv.references || '[]'),
        otherInformation: JSON.parse(cv.other_information || '[]'),
      });

      toast.success("CV loaded successfully.");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Unexpected error during search.");
    }
  };

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
        <input
          type="text"
          placeholder="Search CV by name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{
            flex: '1',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid #d1d5db',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            minWidth: '220px'
          }}
        />
        <input
          type="text"
          placeholder="Search CV by Phone Number"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          style={{
            flex: '1',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid #d1d5db',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            minWidth: '220px'
          }}
        />
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

export default Form;


