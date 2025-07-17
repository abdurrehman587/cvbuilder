import React, { useState, useEffect, useRef } from "react";
import Form from "./Form";
import supabase from "./supabase";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChooseTemplateMobile = ({ user }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
  });
  const [loading, setLoading] = useState(false);
  const [isAdminAccess, setIsAdminAccess] = useState(false);
  const [adminCVId, setAdminCVId] = useState(null);
  const [newAdminCV, setNewAdminCV] = useState(false);
  const [initialCV, setInitialCV] = useState(null);
  const formRef = useRef();

  const templates = [
    { id: 1, name: "Template 1", image: "/templates/template1.jpg" },
    { id: 2, name: "Template 2", image: "/templates/template2.jpg" },
    { id: 3, name: "Template 3", image: "/templates/template3.jpg" },
    { id: 4, name: "Template 4", image: "/templates/template4.jpg" },
    { id: 5, name: "Template 5", image: "/templates/template5.jpg" },
    { id: 6, name: "Template 6", image: "/templates/template6.jpg" },
    { id: 7, name: "Template 7", image: "/templates/template7.jpg" },
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowForm(true);
  };

  const handleFormDataChange = (data) => {
    setFormData(data);
  };

  const handleCVLoaded = (wasLoaded) => {
    console.log('CV loaded:', wasLoaded);
  };

  const handleBackToTemplates = () => {
    setShowForm(false);
    setSelectedTemplate(null);
  };

  if (showForm) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f5f6fa',
        padding: '20px'
      }}>
        <button
          onClick={handleBackToTemplates}
          style={{
            padding: '12px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
        >
          ← Back to Templates
        </button>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          height: 'calc(100vh - 120px)',
          overflowY: 'auto',
        }}>
          <Form 
            key={initialCV ? `cv-${initialCV.id}` : 'new-cv'}
            ref={formRef}
            formData={formData}
            setFormData={setFormData}
            onChange={handleFormDataChange}
            user={user}
            isAdminAccess={isAdminAccess}
            onCVLoaded={handleCVLoaded}
            adminCVId={adminCVId}
            setAdminCVId={setAdminCVId}
            newAdminCV={newAdminCV}
            initialCV={initialCV}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f6fa',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '10px'
        }}>
          Choose Your CV Template
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: 0
        }}>
          Select a template to get started
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{
              width: '100%',
              height: '200px',
              background: '#e5e7eb',
              borderRadius: '8px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#6b7280'
            }}>
              {template.name} Preview
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 8px 0',
              textAlign: 'center'
            }}>
              {template.name}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
              textAlign: 'center'
            }}>
              Professional and clean design
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChooseTemplateMobile; 