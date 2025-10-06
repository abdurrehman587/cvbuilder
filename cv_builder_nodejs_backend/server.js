const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/up', (req, res) => {
  res.status(200).send('OK');
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>CV Builder PDF Server</h1>
    <p>Server is running on port ${PORT}</p>
    <p>PDF endpoint: POST /api/pdf/generate</p>
    <p>Health check: GET /up</p>
  `);
});

// PDF Generation endpoint
app.post('/api/pdf/generate', async (req, res) => {
  try {
    console.log('Received PDF generation request');
    
    const { cvData, template = 'classic', html_content } = req.body;
    
    console.log('Template:', template);
    console.log('Has CV data:', !!cvData);
    console.log('Has HTML content:', !!html_content);
    
    let html;
    let pdfBuffer;
    
    if (html_content) {
      // Hybrid approach: Use HTML content from frontend
      console.log('Using hybrid approach: HTML to PDF conversion');
      html = html_content;
    } else if (cvData) {
      // Original approach: Generate HTML from CV data
      console.log('Using original approach: CV data to HTML conversion');
      html = generateHTML(cvData, template);
    } else {
      return res.status(400).json({ error: 'Either CV data or HTML content is required' });
    }
    
    // Generate PDF using Puppeteer
    pdfBuffer = await generatePDF(html);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="CV.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
    console.log('PDF generated successfully');
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'PDF generation failed', 
      message: error.message 
    });
  }
});

// Generate HTML based on template
function generateHTML(cvData, template) {
  const personalInfo = cvData.personalInfo || {};
  const education = cvData.education || [];
  const experience = cvData.experience || [];
  const skills = cvData.skills || [];
  const languages = cvData.languages || [];
  const hobbies = cvData.hobbies || [];
  const certifications = cvData.certifications || [];
  const references = cvData.references || [];
  
  switch (template) {
    case 'modern':
      return generateModernHTML(cvData);
    case 'minimalist':
      return generateMinimalistHTML(cvData);
    default:
      return generateClassicHTML(cvData);
  }
}

// Classic Template (Single Column)
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

// Modern Template (Two Column)
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

// Minimalist Template
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

// Generate PDF using Puppeteer
async function generatePDF(html) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      scale: 1.0
    });
    
    return pdfBuffer;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CV Builder PDF Server running on port ${PORT}`);
  console.log(`📄 PDF endpoint: POST http://localhost:${PORT}/api/pdf/generate`);
  console.log(`❤️  Health check: GET http://localhost:${PORT}/up`);
});

module.exports = app;

