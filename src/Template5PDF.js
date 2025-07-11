import React, { useRef } from 'react';
import PropTypes from 'prop-types';

const europassLogoUrl = '/europass_logo.png'; // Use local logo from public folder

const sectionTitleStyle = {
  fontWeight: 'bold',
  fontSize: '18px',
  textTransform: 'uppercase',
  borderBottom: '2px solid #888',
  marginTop: '32px',
  marginBottom: '12px',
  letterSpacing: '0.5px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

// Helper to extract Date of Birth from otherInformation
const getDateOfBirth = (formData) => {
  if (formData.dateOfBirth || formData.dob || formData.birthDate) {
    return formData.dateOfBirth || formData.dob || formData.birthDate;
  }
  if (Array.isArray(formData.otherInformation)) {
    const dobEntry = formData.otherInformation.find(
      (item) => item.label && item.label.toLowerCase().includes('date of birth')
    );
    if (dobEntry && dobEntry.value) return dobEntry.value;
  }
  return '';
};

const Template5PDF = ({ formData }) => {
  const containerRef = useRef(null);
  const {
    name = '',
    nationality = '',
    gender = '',
    phone = '',
    email = '',
    address = '',
    education = [],
    workExperience = [],
    languages = [],
    languageSkills = {},
    hobbies = [],
  } = formData;
  const dateOfBirth = getDateOfBirth(formData);

  return (
    <div ref={containerRef} style={{ fontFamily: 'Arial, sans-serif', background: '#fff', color: '#222', padding: '16px 32px 32px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ position: 'relative', borderBottom: '2px solid #bbb', paddingBottom: 16, marginBottom: 24, minHeight: 120 }}>
        <img src={europassLogoUrl} alt="Europass Logo" style={{ position: 'absolute', top: -45, right: -30, width: 320, height: 'auto', zIndex: 2 }} />
        <div style={{ paddingTop: 15 }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0, marginBottom: 24 }}>{name || 'Your Name'}</h1>
          <div style={{ marginTop: 16, fontSize: 16 }}>
            <span style={{ fontWeight: 'bold' }}>Phone number:</span> {phone || 'Phone'} |
            <span style={{ fontWeight: 'bold' }}> Date of birth:</span> {dateOfBirth || 'DD/MM/YYYY'} |
            <span style={{ fontWeight: 'bold' }}> Nationality:</span> {nationality || 'Nationality'} |
            <span style={{ fontWeight: 'bold' }}> Gender:</span> {gender || 'Gender'}
          </div>
          <div style={{ fontSize: 16, marginTop: 4, wordBreak: 'keep-all', hyphens: 'none', whiteSpace: 'normal' }}>
            <span style={{ fontWeight: 'bold' }}>Email address:</span> {email || 'your@email.com'}
          </div>
          <div style={{ fontSize: 16, marginTop: 4, wordBreak: 'keep-all', hyphens: 'none', whiteSpace: 'normal' }}>
            <span style={{ fontWeight: 'bold' }}>Address:</span> {address || 'Your address'}
          </div>
        </div>
      </div>

      {/* Education Section */}
      <div style={sectionTitleStyle}>Education and Training</div>
      <div>
        {education.map((edu, idx) => (
          <div key={idx} style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>
              {edu.degree || 'Degree'} {edu.year ? `(${edu.year})` : ''}
            </div>
            <div style={{ fontSize: 15, color: '#444' }}>{edu.institute || 'Institute'}</div>
            {edu.details && <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{edu.details}</div>}
          </div>
        ))}
      </div>

      {/* Language Skills Section */}
      <div style={sectionTitleStyle}>Language Skills</div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 'bold', fontSize: 15 }}>Mother tongue(s): <span style={{ fontWeight: 'normal' }}>{languageSkills.motherTongue || 'Urdu'}</span></div>
        {languageSkills.otherLanguages && languageSkills.otherLanguages.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>Other language(s):</div>
            {/* Table for language skills */}
            <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 6, fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f3f3f3' }}>
                  <th style={{ border: '1px solid #bbb', padding: 4 }}>Language</th>
                  <th style={{ border: '1px solid #bbb', padding: 4 }}>Listening</th>
                  <th style={{ border: '1px solid #bbb', padding: 4 }}>Reading</th>
                  <th style={{ border: '1px solid #bbb', padding: 4 }}>Spoken production</th>
                  <th style={{ border: '1px solid #bbb', padding: 4 }}>Spoken interaction</th>
                  <th style={{ border: '1px solid #bbb', padding: 4 }}>Writing</th>
                </tr>
              </thead>
              <tbody>
                {languageSkills.otherLanguages.map((lang, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #bbb', padding: 4, fontWeight: 'bold' }}>{lang.language}</td>
                    <td style={{ border: '1px solid #bbb', padding: 4 }}>{lang.listening}</td>
                    <td style={{ border: '1px solid #bbb', padding: 4 }}>{lang.reading}</td>
                    <td style={{ border: '1px solid #bbb', padding: 4 }}>{lang.spokenProduction}</td>
                    <td style={{ border: '1px solid #bbb', padding: 4 }}>{lang.spokenInteraction}</td>
                    <td style={{ border: '1px solid #bbb', padding: 4 }}>{lang.writing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              Levels: A1 and A2: Basic user; B1 and B2: Independent user; C1 and C2: Proficient user
            </div>
          </div>
        )}
      </div>

      {/* Work Experience Section */}
      <div style={sectionTitleStyle}>Work Experience</div>
      <div>
        {workExperience.map((job, idx) => (
          <div key={idx} style={{ marginBottom: 22 }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>
              {job.designation || 'Job Title'} {job.company ? `| ${job.company}` : ''} {job.duration ? `(${job.duration})` : ''}
            </div>
            <div style={{ fontSize: 15, color: '#444' }}>{job.location || ''}</div>
            {job.details && Array.isArray(job.details) ? (
              <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: 14, color: '#222' }}>
                {job.details.map((d, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>{d}</li>
                ))}
              </ul>
            ) : job.details ? (
              <div style={{ marginTop: 6, fontSize: 14, color: '#222' }}>{job.details}</div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Hobbies and Interests Section */}
      <div style={sectionTitleStyle}>Hobbies and Interests</div>
      <div style={{ fontSize: 15, marginTop: 6 }}>
        {hobbies && hobbies.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {hobbies.map((hobby, idx) => (
              <li key={idx} style={{ marginBottom: 2 }}>{hobby}</li>
            ))}
          </ul>
        ) : (
          <span>No hobbies listed.</span>
        )}
      </div>
    </div>
  );
};

Template5PDF.propTypes = {
  formData: PropTypes.object.isRequired,
};

export default Template5PDF;
