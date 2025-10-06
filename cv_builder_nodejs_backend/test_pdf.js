const puppeteer = require('puppeteer');
const fs = require('fs');

// Sample CV data
const sampleCVData = {
  personalInfo: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phones: [{ phone: '+1-555-0123' }, { phone: '+1-555-0456' }],
    address: '123 Main Street, City, State 12345',
    summary: 'Experienced software developer with 5+ years of experience in web development, mobile applications, and cloud technologies. Passionate about creating efficient, scalable solutions and leading development teams.'
  },
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Technology',
      year: '2018',
      grade: '3.8 GPA'
    },
    {
      degree: 'Master of Science in Software Engineering',
      institution: 'Tech Institute',
      year: '2020',
      grade: '3.9 GPA'
    }
  ],
  experience: [
    {
      jobTitle: 'Senior Software Developer',
      company: 'Tech Solutions Inc.',
      duration: '2021 - Present',
      description: 'Lead development of web applications using React, Node.js, and AWS. Managed a team of 3 developers and implemented CI/CD pipelines.'
    },
    {
      jobTitle: 'Software Developer',
      company: 'StartupXYZ',
      duration: '2019 - 2021',
      description: 'Developed mobile applications using React Native and managed backend services with Node.js and MongoDB.'
    }
  ],
  skills: [
    { skill: 'JavaScript' },
    { skill: 'React' },
    { skill: 'Node.js' },
    { skill: 'Python' },
    { skill: 'AWS' },
    { skill: 'Docker' }
  ],
  languages: [
    { language: 'English', languageLevel: 'Native' },
    { language: 'Spanish', languageLevel: 'Fluent' },
    { language: 'French', languageLevel: 'Intermediate' }
  ],
  hobbies: [
    { hobby: 'Photography' },
    { hobby: 'Hiking' },
    { hobby: 'Cooking' }
  ],
  certifications: [
    'AWS Certified Solutions Architect',
    'Google Cloud Professional Developer',
    'Certified Scrum Master'
  ],
  references: [
    'References available upon request'
  ],
  template: 'modern'
};

// Generate HTML functions (copied from server.js)
function generateClassicHTML(cvData) {
  const personalInfo = cvData.personalInfo || {};
  const education = cvData.education || [];
  const experience = cvData.experience || [];
  const skills = cvData.skills || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CV - ${personalInfo.fullName || 'Your Name'}</title>
      <style>
        @page { 
          size: A4; 
          margin: 20mm; 
        }
        body { 
          font-family: 'Arial', sans-serif; 
          font-size: 12pt; 
          line-height: 1.4; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #8B4513;
          padding-bottom: 15px;
        }
        .name { 
          font-size: 24pt; 
          font-weight: bold; 
          color: #8B4513; 
          margin-bottom: 10px;
        }
        .contact { 
          font-size: 11pt; 
          color: #666; 
        }
        .section { 
          margin-bottom: 20px; 
        }
        .section-title { 
          font-size: 14pt; 
          font-weight: bold; 
          color: #8B4513; 
          border-bottom: 2px solid #8B4513;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .job-title, .degree { 
          font-weight: bold; 
          color: #8B4513; 
          font-size: 12pt;
        }
        .company, .institution { 
          font-weight: bold; 
          color: #333;
        }
        .duration { 
          color: #666; 
          font-style: italic;
        }
        .description { 
          margin-top: 5px; 
          text-align: justify;
        }
        .skills { 
          margin-top: 5px; 
        }
        .skill-item { 
          display: inline-block; 
          margin-right: 10px; 
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${personalInfo.fullName || 'Your Name'}</div>
        <div class="contact">
          ${personalInfo.email ? `Email: ${personalInfo.email}` : ''}
          ${personalInfo.phones && personalInfo.phones.length ? ` | Phone: ${personalInfo.phones.map(p => p.phone || p).join(', ')}` : ''}
          ${personalInfo.address ? ` | Address: ${personalInfo.address}` : ''}
        </div>
      </div>
      
      ${personalInfo.summary ? `
        <div class="section">
          <div class="section-title">PROFESSIONAL SUMMARY</div>
          <div class="description">${personalInfo.summary}</div>
        </div>
      ` : ''}
      
      ${education.length ? `
        <div class="section">
          <div class="section-title">EDUCATION</div>
          ${education.map(edu => `
            <div style="margin-bottom: 10px;">
              <div class="degree">${edu.degree || ''}</div>
              <div class="institution">${edu.institution || ''} - <span class="duration">${edu.year || ''}</span></div>
              ${edu.grade ? `<div style="margin-top: 3px;">Grade: ${edu.grade}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${experience.length ? `
        <div class="section">
          <div class="section-title">WORK EXPERIENCE</div>
          ${experience.map(exp => `
            <div style="margin-bottom: 15px;">
              <div class="job-title">${exp.jobTitle || ''}</div>
              <div class="company">${exp.company || ''} - <span class="duration">${exp.duration || ''}</span></div>
              ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${skills.length ? `
        <div class="section">
          <div class="section-title">SKILLS</div>
          <div class="skills">
            ${skills.map(skill => `
              <span class="skill-item">• ${skill.skill || skill}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

function generateModernHTML(cvData) {
  const personalInfo = cvData.personalInfo || {};
  const education = cvData.education || [];
  const experience = cvData.experience || [];
  const skills = cvData.skills || [];
  const languages = cvData.languages || [];
  const hobbies = cvData.hobbies || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CV - ${personalInfo.fullName || 'Your Name'}</title>
      <style>
        @page { 
          size: A4; 
          margin: 15mm; 
        }
        body { 
          font-family: 'Arial', sans-serif; 
          font-size: 12pt; 
          line-height: 1.4; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          display: flex;
          gap: 15px;
        }
        .sidebar {
          width: 35%;
          background-color: #f8f9fa;
          padding: 20px;
          border-right: 3px solid #8B4513;
        }
        .main-content {
          width: 65%;
          padding: 20px;
        }
        .name {
          font-size: 20pt;
          font-weight: bold;
          color: #8B4513;
          text-align: right;
          margin-bottom: 20px;
        }
        .sidebar-title {
          font-size: 12pt;
          font-weight: bold;
          color: #8B4513;
          border-bottom: 2px solid #8B4513;
          padding-bottom: 5px;
          margin-bottom: 10px;
          margin-top: 20px;
        }
        .sidebar-title:first-child {
          margin-top: 0;
        }
        .contact-item {
          font-size: 10pt;
          margin-bottom: 8px;
          color: #333;
        }
        .skill-item, .language-item, .hobby-item {
          font-size: 10pt;
          margin-bottom: 5px;
        }
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          color: #8B4513;
          border-bottom: 2px solid #8B4513;
          padding-bottom: 5px;
          margin-bottom: 10px;
          margin-top: 20px;
        }
        .section-title:first-child {
          margin-top: 0;
        }
        .job-title, .degree {
          font-weight: bold;
          color: #8B4513;
          font-size: 12pt;
        }
        .company, .institution {
          font-weight: bold;
          color: #333;
        }
        .duration {
          color: #666;
          font-style: italic;
        }
        .description {
          margin-top: 5px;
          text-align: justify;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="sidebar">
          <div class="sidebar-title">CONTACT</div>
          ${personalInfo.phones && personalInfo.phones.length ? `
            <div class="contact-item">Phone: ${personalInfo.phones.map(p => p.phone || p).join(', ')}</div>
          ` : ''}
          ${personalInfo.email ? `
            <div class="contact-item">Email: ${personalInfo.email}</div>
          ` : ''}
          ${personalInfo.address ? `
            <div class="contact-item">Address: ${personalInfo.address}</div>
          ` : ''}
          
          ${skills.length ? `
            <div class="sidebar-title">SKILLS</div>
            ${skills.map(skill => `
              <div class="skill-item">• ${skill.skill || skill}</div>
            `).join('')}
          ` : ''}
          
          ${languages.length ? `
            <div class="sidebar-title">LANGUAGES</div>
            ${languages.map(lang => `
              <div class="language-item">• ${lang.language || ''} - ${lang.languageLevel || ''}</div>
            `).join('')}
          ` : ''}
          
          ${hobbies.length ? `
            <div class="sidebar-title">HOBBIES</div>
            ${hobbies.map(hobby => `
              <div class="hobby-item">• ${hobby.hobby || hobby}</div>
            `).join('')}
          ` : ''}
        </div>
        
        <div class="main-content">
          <div class="name">${personalInfo.fullName || 'Your Name'}</div>
          
          ${personalInfo.summary ? `
            <div class="section-title">PROFESSIONAL SUMMARY</div>
            <div class="description">${personalInfo.summary}</div>
          ` : ''}
          
          ${experience.length ? `
            <div class="section-title">WORK EXPERIENCE</div>
            ${experience.map(exp => `
              <div style="margin-bottom: 15px;">
                <div class="job-title">${exp.jobTitle || ''}</div>
                <div class="company">${exp.company || ''} - <span class="duration">${exp.duration || ''}</span></div>
                ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
              </div>
            `).join('')}
          ` : ''}
          
          ${education.length ? `
            <div class="section-title">EDUCATION</div>
            ${education.map(edu => `
              <div style="margin-bottom: 10px;">
                <div class="degree">${edu.degree || ''}</div>
                <div class="institution">${edu.institution || ''} - <span class="duration">${edu.year || ''}</span></div>
                ${edu.grade ? `<div style="margin-top: 3px;">Grade: ${edu.grade}</div>` : ''}
              </div>
            `).join('')}
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateMinimalistHTML(cvData) {
  const personalInfo = cvData.personalInfo || {};
  const education = cvData.education || [];
  const experience = cvData.experience || [];
  const skills = cvData.skills || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CV - ${personalInfo.fullName || 'Your Name'}</title>
      <style>
        @page { 
          size: A4; 
          margin: 20mm; 
        }
        body { 
          font-family: 'Arial', sans-serif; 
          font-size: 12pt; 
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 20px;
        }
        .name {
          font-size: 28pt;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }
        .contact {
          font-size: 12pt;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 12pt;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .item {
          margin-bottom: 10px;
        }
        .title {
          font-weight: bold;
          font-size: 11pt;
        }
        .subtitle {
          color: #666;
          font-size: 10pt;
        }
        .description {
          margin-top: 5px;
          text-align: justify;
        }
        .skills {
          margin-top: 5px;
        }
        .skill-item {
          display: inline-block;
          margin-right: 15px;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${personalInfo.fullName || 'Your Name'}</div>
        <div class="contact">
          ${personalInfo.email ? personalInfo.email : ''}
          ${personalInfo.phones && personalInfo.phones.length ? ` • ${personalInfo.phones.map(p => p.phone || p).join(', ')}` : ''}
          ${personalInfo.address ? ` • ${personalInfo.address}` : ''}
        </div>
      </div>
      
      ${personalInfo.summary ? `
        <div class="section">
          <div class="section-title">PROFESSIONAL SUMMARY</div>
          <div class="description">${personalInfo.summary}</div>
        </div>
      ` : ''}
      
      ${education.length ? `
        <div class="section">
          <div class="section-title">EDUCATION</div>
          ${education.map(edu => `
            <div class="item">
              <div class="title">${edu.degree || ''}</div>
              <div class="subtitle">${edu.institution || ''} • ${edu.year || ''}</div>
              ${edu.grade ? `<div class="subtitle">${edu.grade}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${experience.length ? `
        <div class="section">
          <div class="section-title">EXPERIENCE</div>
          ${experience.map(exp => `
            <div class="item">
              <div class="title">${exp.jobTitle || ''}</div>
              <div class="subtitle">${exp.company || ''} • ${exp.duration || ''}</div>
              ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${skills.length ? `
        <div class="section">
          <div class="section-title">SKILLS</div>
          <div class="skills">
            ${skills.map(skill => `
              <span class="skill-item">${skill.skill || skill}</span>
            `).join(' • ')}
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

// Test PDF generation
async function testPDFGeneration() {
  console.log('=== CV Builder Node.js PDF Generation Test ===');
  console.log('Testing PDF generation with sample data...\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Test Classic Template
    console.log('1. Testing Classic Template...');
    const classicHTML = generateClassicHTML(sampleCVData);
    await page.setContent(classicHTML, { waitUntil: 'networkidle0' });
    
    const classicPDF = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    const classicFilename = `test_cv_classic_${Date.now()}.pdf`;
    fs.writeFileSync(classicFilename, classicPDF);
    console.log(`✅ Classic template PDF generated: ${classicFilename}`);
    console.log(`   File size: ${classicPDF.length} bytes\n`);
    
    // Test Modern Template
    console.log('2. Testing Modern Template (Two-column)...');
    const modernHTML = generateModernHTML(sampleCVData);
    await page.setContent(modernHTML, { waitUntil: 'networkidle0' });
    
    const modernPDF = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });
    
    const modernFilename = `test_cv_modern_${Date.now()}.pdf`;
    fs.writeFileSync(modernFilename, modernPDF);
    console.log(`✅ Modern template PDF generated: ${modernFilename}`);
    console.log(`   File size: ${modernPDF.length} bytes\n`);
    
    // Test Minimalist Template
    console.log('3. Testing Minimalist Template...');
    const minimalistHTML = generateMinimalistHTML(sampleCVData);
    await page.setContent(minimalistHTML, { waitUntil: 'networkidle0' });
    
    const minimalistPDF = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    const minimalistFilename = `test_cv_minimalist_${Date.now()}.pdf`;
    fs.writeFileSync(minimalistFilename, minimalistPDF);
    console.log(`✅ Minimalist template PDF generated: ${minimalistFilename}`);
    console.log(`   File size: ${minimalistPDF.length} bytes\n`);
    
    console.log('🎉 All PDF generation tests completed successfully!');
    console.log('\nGenerated files:');
    console.log(`  - ${classicFilename} (${classicPDF.length} bytes)`);
    console.log(`  - ${modernFilename} (${modernPDF.length} bytes)`);
    console.log(`  - ${minimalistFilename} (${minimalistPDF.length} bytes)`);
    console.log('\nYou can open these PDF files to verify the quality and layout.');
    
  } catch (error) {
    console.error('❌ Error during PDF generation:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testPDFGeneration();

