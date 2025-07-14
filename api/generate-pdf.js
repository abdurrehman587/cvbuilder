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

    console.log('Starting PDF generation...');
    console.log('HTML content length:', html.length);

    // Launch browser with proper configuration for Vercel
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
        '--disable-renderer-backgrounding'
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
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait a bit for any dynamic content to render
    await page.waitForTimeout(3000);

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
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });

    console.log('PDF generated successfully, size:', pdf.length, 'bytes');

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);

    // Send PDF
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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