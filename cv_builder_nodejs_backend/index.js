const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://cvbuilder-beryl-beta.vercel.app',
    'https://cvbuilder-3des-6imqlxdz2-abdurrehmans-projects-37746bc3.vercel.app',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Health check endpoint
app.get('/up', (req, res) => {
  console.log('Health check requested from:', req.headers.origin || req.headers.host);
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'CV Builder PDF Server'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>CV Builder PDF Server</h1>
    <p>Server is running as Vercel serverless function</p>
    <p>PDF endpoint: POST /api/pdf/generate</p>
    <p>Health check: GET /up</p>
    <p>Test endpoint: GET /test</p>
  `);
});

// PDF generation endpoint
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

// Generate HTML from CV data
function generateHTML(cvData, template) {
  // Basic HTML generation - you can expand this
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CV - ${cvData.personalInfo?.fullName || 'Resume'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        h1 { color: #8B4513; }
        h2 { color: #8B4513; border-bottom: 2px solid #8B4513; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${cvData.personalInfo?.fullName || 'Your Name'}</h1>
        <p>${cvData.personalInfo?.email || ''}</p>
        <p>${cvData.personalInfo?.phones?.[0]?.phone || ''}</p>
      </div>
      
      ${cvData.personalInfo?.summary ? `
        <div class="section">
          <h2>Professional Summary</h2>
          <p>${cvData.personalInfo.summary}</p>
        </div>
      ` : ''}
      
      ${cvData.experience && cvData.experience.length > 0 ? `
        <div class="section">
          <h2>Work Experience</h2>
          ${cvData.experience.map(exp => `
            <div>
              <h3>${exp.jobTitle || ''}</h3>
              <p><strong>${exp.company || ''}</strong> - ${exp.duration || ''}</p>
              <p>${exp.description || ''}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${cvData.education && cvData.education.length > 0 ? `
        <div class="section">
          <h2>Education</h2>
          ${cvData.education.map(edu => `
            <div>
              <h3>${edu.degree || ''}</h3>
              <p><strong>${edu.institution || ''}</strong> - ${edu.year || ''}</p>
              ${edu.grade ? `<p>Grade: ${edu.grade}</p>` : ''}
            </div>
          `).join('')}
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

module.exports = app;
