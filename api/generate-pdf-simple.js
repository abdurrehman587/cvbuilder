const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;
  try {
    const { html, filename = 'cv.pdf' } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Starting simple PDF generation...');
    console.log('HTML content length:', html.length);

    // Try different Chrome executable paths for Vercel
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
}; 