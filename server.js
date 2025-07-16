const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/cv-pdf', async (req, res) => {
  const { cvUrl, formData, visibleSections } = req.query;
  
  console.log('PDF generation request received:', { cvUrl, formData: !!formData, visibleSections: !!visibleSections });
  
  if (!cvUrl) {
    console.error('Missing cvUrl parameter');
    return res.status(400).send('Missing cvUrl parameter');
  }

  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    });
    
    const page = await browser.newPage();
    
    // Set longer timeout for navigation
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    
    // Set sessionStorage before navigating to the page
    if (formData && visibleSections) {
      await page.evaluateOnNewDocument((data, sections) => {
        sessionStorage.setItem('print_cv_data', data);
        sessionStorage.setItem('print_cv_sections', sections);
      }, formData, visibleSections);
    }
    
    console.log('Navigating to:', cvUrl);
    await page.goto(cvUrl, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

    console.log('Page loaded, waiting for content...');
    // Wait for content to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if the page loaded correctly
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Inject CSS for better PDF rendering and page breaks
    await page.addStyleTag({
      content: `
        @media print {
          body { 
            margin: 0; 
            padding: 0;
            height: auto !important;
            min-height: auto !important;
          }
          * { 
            box-sizing: border-box; 
          }
          .page-break { 
            page-break-before: always; 
          }
          .avoid-break { 
            page-break-inside: avoid; 
          }
          .cv-page {
            page-break-after: always;
            height: auto !important;
            min-height: auto !important;
          }
          .cv-page:last-child {
            page-break-after: auto;
          }
        }
      `
    });

    // Set a large viewport to capture all content
    await page.setViewport({
      width: 1200,
      height: 3000,
      deviceScaleFactor: 1,
    });

    // Wait a bit more for content to settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if content is present
    const contentCheck = await page.evaluate(() => {
      const body = document.body;
      return {
        hasContent: body.children.length > 0,
        bodyHeight: body.scrollHeight,
        bodyWidth: body.scrollWidth
      };
    });
    
    console.log('Content check:', contentCheck);

    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });

    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cv.pdf"',
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send(`Failed to generate PDF: ${err.message}`);
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PDF server is running' });
});

// API Routes for development
app.get('/api/health', async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        pdf: 'available',
        supabase: 'available'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      uptime: process.uptime()
    };

    // Check if Puppeteer is available
    try {
      const puppeteer = require('puppeteer');
      healthCheck.services.puppeteer = 'available';
    } catch (error) {
      console.log('Puppeteer not available:', error.message);
      healthCheck.services.puppeteer = 'unavailable';
      healthCheck.services.pdf = 'unavailable';
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    console.error('Health check error:', error);
    // Don't return 500 for health check errors, just return a degraded status
    res.status(200).json({
      status: 'degraded',
      message: error.message,
      timestamp: new Date().toISOString(),
      services: {
        pdf: 'unavailable',
        supabase: 'unavailable'
      }
    });
  }
});

// PDF Generation API
app.post('/api/generate-pdf', async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let browser;
  try {
    const { html, filename = 'cv.pdf' } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Starting PDF generation...');
    console.log('HTML content length:', html.length);

    // Launch browser with proper configuration for development
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
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-web-resources',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain'
      ]
    });

    const page = await browser.newPage();
    
    // Set a larger viewport
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 1,
    });

    // Set content and wait for it to load
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait a bit for any dynamic content to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add print-specific CSS
    await page.addStyleTag({
      content: `
        @media print {
          html, body { 
            margin: 0 !important; 
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
          }
          * { 
            box-sizing: border-box; 
          }
          .page-break { 
            page-break-before: always; 
          }
          .avoid-break { 
            page-break-inside: avoid; 
          }
          .cv-page {
            page-break-after: always;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .cv-page:last-child {
            page-break-after: auto;
          }
          #cv-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `
    });
    
    console.log('Generating PDF...');
    
    // Generate PDF with optimized settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      timeout: 30000
    });

    console.log('PDF generated successfully, size:', pdf.length, 'bytes');

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send PDF
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    
    // More detailed error response
    const errorResponse = {
      error: 'Failed to generate PDF',
      message: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Only include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
});

// Simple PDF Generation API
app.post('/api/generate-pdf-simple', async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let browser;
  try {
    const { html, filename = 'cv.pdf' } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Starting simple PDF generation...');
    console.log('HTML content length:', html.length);

    // Try different Chrome executable paths for development
    const chromePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' // Windows 32-bit
    ];

    let browserLaunched = false;
    let lastError = null;

    for (const chromePath of chromePaths) {
      if (!chromePath) continue;
      
      try {
        console.log(`Trying Chrome path: ${chromePath}`);
        
        browser = await puppeteer.launch({
          headless: true,
          executablePath: chromePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-default-browser-check',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-client-side-phishing-detection',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-sync',
            '--disable-web-resources',
            '--metrics-recording-only',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain'
          ],
          skipDownload: true
        });

        browserLaunched = true;
        console.log(`Successfully launched browser with path: ${chromePath}`);
        break;
      } catch (error) {
        console.log(`Failed to launch browser with path ${chromePath}:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!browserLaunched) {
      throw new Error(`Could not launch browser. Tried paths: ${chromePaths.filter(Boolean).join(', ')}. Last error: ${lastError?.message}`);
    }

    const page = await browser.newPage();
    
    // Set a larger viewport
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 1,
    });

    // Set content and wait for it to load
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait a bit for any dynamic content to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add print-specific CSS
    await page.addStyleTag({
      content: `
        @media print {
          html, body { 
            margin: 0 !important; 
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
          }
          * { 
            box-sizing: border-box; 
          }
          .page-break { 
            page-break-before: always; 
          }
          .avoid-break { 
            page-break-inside: avoid; 
          }
          .cv-page {
            page-break-after: always;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .cv-page:last-child {
            page-break-after: auto;
          }
          #cv-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `
    });
    
    console.log('Generating PDF...');
    
    // Generate PDF with optimized settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      timeout: 30000
    });

    console.log('PDF generated successfully, size:', pdf.length, 'bytes');

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send PDF
    res.send(pdf);

  } catch (error) {
    console.error('Simple PDF generation error:', error);
    
    // More detailed error response
    const errorResponse = {
      error: 'Failed to generate PDF',
      message: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      chromePaths: [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
      ].filter(Boolean)
    };
    
    // Only include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PDF server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  console.log(`API routes available at: http://localhost:${PORT}/api/`);
}); 