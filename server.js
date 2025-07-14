const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

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
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PDF server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
}); 