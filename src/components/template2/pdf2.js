import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './pdf2.css';

// PDF Generation Configuration
const PDF_CONFIG = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 5, // Reduced top margin for better space utilization
  scale: 3, // Canvas scale for better compatibility
  imageQuality: 2, // JPEG quality
  imageTimeout: 15000 // Timeout for images
};

// Helper Functions
const validateCVPreview = () => {
  const cvPreview = document.querySelector('.cv-preview');
  
  if (!cvPreview) {
    throw new Error('CV preview not found. Please make sure the CV is loaded.');
  }

  const hasContent = cvPreview.textContent && cvPreview.textContent.trim().length > 0;
  if (!hasContent) {
    throw new Error('CV preview is empty. Please fill in some information before generating PDF.');
  }

  return cvPreview;
};

const setupPDFMode = (cvPreview) => {
  // Hide download button
  const downloadButton = cvPreview.querySelector('.download-pdf-container');
  const originalDisplay = downloadButton ? downloadButton.style.display : '';
  if (downloadButton) {
    downloadButton.style.display = 'none';
  }

  // Apply PDF mode styling to cv-preview
  cvPreview.classList.add('pdf-mode');
  
  // Also add pdf-mode to template2-root wrapper if it exists
  const template2Root = cvPreview.closest('.template2-root');
  if (template2Root) {
    template2Root.classList.add('pdf-mode');
  }

  return { downloadButton, originalDisplay, template2Root };
};

const cleanupPDFMode = (cvPreview, downloadButton, originalDisplay, template2Root) => {
  // Restore download button
  if (downloadButton) {
    downloadButton.style.display = originalDisplay;
  }
  
  // Remove PDF mode styling
  cvPreview.classList.remove('pdf-mode');
  
  if (template2Root) {
    template2Root.classList.remove('pdf-mode');
  }
};

const updateButtonState = (text, disabled = false) => {
  const button = document.querySelector('.download-pdf-button');
  if (button) {
    button.textContent = text;
    button.disabled = disabled;
  }
  return button;
};

const generateCanvas = async (cvPreview) => {
  console.log('CV preview element found, generating canvas...');
  
  // Get the template2-root wrapper to ensure full layout is captured
  const template2Root = cvPreview.closest('.template2-root');
  const elementToRender = template2Root || cvPreview;
  
  console.log('Element to render dimensions:', {
    width: elementToRender.scrollWidth,
    height: elementToRender.scrollHeight,
    offsetWidth: elementToRender.offsetWidth,
    offsetHeight: elementToRender.offsetHeight,
    isTemplate2Root: !!template2Root
  });

  const canvas = await html2canvas(elementToRender, {
    scale: PDF_CONFIG.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    width: elementToRender.offsetWidth || elementToRender.scrollWidth,
    height: elementToRender.offsetHeight || elementToRender.scrollHeight,
    removeContainer: false,
    foreignObjectRendering: false, // Disabled - was causing blank pages
    imageTimeout: PDF_CONFIG.imageTimeout,
    onclone: (clonedDoc) => {
      // Force apply all PDF styles immediately via injected stylesheet
      const style = document.createElement('style');
      style.textContent = `
        .template2-root.pdf-mode .cv-preview.pdf-mode {
          display: grid !important;
          grid-template-columns: 35% 65% !important;
          gap: 0 !important;
          padding: 0 !important;
          background: white !important;
          max-width: 1200px !important;
          margin: 0 auto !important;
          font-family: 'Arial', sans-serif !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .cv-left-column {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          background: -webkit-linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          padding: 30px 25px !important;
          display: block !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .cv-right-column {
          background: white !important;
          padding: 30px 20px 30px 35px !important; /* Reduced right padding */
          display: block !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .cv-left-column * {
          color: white !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .header-name {
          color: white !important;
          font-size: 28px !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .header-title {
          color: rgba(255, 255, 255, 0.9) !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .contact-item {
          background: rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .section-heading.left-column {
          color: white !important;
          border-bottom-color: rgba(255, 255, 255, 0.3) !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .skill-pill,
        .template2-root.pdf-mode .cv-preview.pdf-mode .language-pill,
        .template2-root.pdf-mode .cv-preview.pdf-mode .hobby-pill {
          background: rgba(255, 255, 255, 0.15) !important;
          color: white !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .skill-pill *,
        .template2-root.pdf-mode .cv-preview.pdf-mode .language-pill *,
        .template2-root.pdf-mode .cv-preview.pdf-mode .hobby-pill * {
          color: white !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .skill-name,
        .template2-root.pdf-mode .cv-preview.pdf-mode .language-name,
        .template2-root.pdf-mode .cv-preview.pdf-mode .hobby-name {
          color: white !important;
          font-weight: 500 !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .info-item {
          background: rgba(255, 255, 255, 0.12) !important;
          color: white !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .info-item * {
          color: white !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .info-label,
        .template2-root.pdf-mode .cv-preview.pdf-mode .info-value {
          color: white !important;
        }
      `;
      clonedDoc.head.appendChild(style);
      
      // Apply inline styles to all elements
      const clonedRoot = clonedDoc.querySelector('.template2-root');
      if (clonedRoot) {
        clonedRoot.classList.add('pdf-mode');
        clonedRoot.style.display = 'block';
        clonedRoot.style.width = 'auto';
        clonedRoot.style.height = 'auto';
      }
      
      const clonedPreview = clonedDoc.querySelector('.cv-preview');
      if (clonedPreview) {
        clonedPreview.classList.add('pdf-mode');
        clonedPreview.style.visibility = 'visible';
        clonedPreview.style.display = 'grid';
        clonedPreview.style.gridTemplateColumns = '35% 65%';
        clonedPreview.style.gap = '0';
        clonedPreview.style.width = 'auto';
        clonedPreview.style.height = 'auto';
        clonedPreview.style.maxWidth = '1200px';
        clonedPreview.style.margin = '0 auto';
        clonedPreview.style.padding = '0';
        clonedPreview.style.background = 'white';
        clonedPreview.style.fontFamily = 'Arial, sans-serif';
        
        const leftColumn = clonedPreview.querySelector('.cv-left-column');
        const rightColumn = clonedPreview.querySelector('.cv-right-column');
        
        if (leftColumn) {
          // Create SVG gradient for better html2canvas support
          const svgGradient = `
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#purpleGradient)"/>
            </svg>
          `;
          // Try multiple background approaches
          leftColumn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          leftColumn.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          leftColumn.style.backgroundColor = '#667eea'; // Solid fallback
          leftColumn.style.backgroundRepeat = 'no-repeat';
          leftColumn.style.backgroundSize = '100% 100%';
          leftColumn.style.color = 'white';
          leftColumn.style.padding = '30px 25px';
          leftColumn.style.display = 'block';
          leftColumn.style.position = 'relative';
          
          // Apply white color to all text elements in left column
          const textElements = leftColumn.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, li, td, th, label');
          textElements.forEach(el => {
            // Only set color if it's a text element and not already explicitly set
            if (el.tagName && el.textContent.trim()) {
              el.style.color = 'white';
            }
          });
          
          // Ensure all specific elements are white
          const headerName = leftColumn.querySelector('.header-name');
          const headerTitle = leftColumn.querySelector('.header-title');
          const contactItems = leftColumn.querySelectorAll('.contact-item');
          const sectionHeadings = leftColumn.querySelectorAll('.section-heading');
          const skillNames = leftColumn.querySelectorAll('.skill-name, .language-name, .hobby-name');
          const infoLabels = leftColumn.querySelectorAll('.info-label');
          const infoValues = leftColumn.querySelectorAll('.info-value');
          
          if (headerName) headerName.style.color = 'white';
          if (headerTitle) headerTitle.style.color = 'rgba(255, 255, 255, 0.9)';
          contactItems.forEach(item => {
            item.style.color = 'rgba(255, 255, 255, 0.9)';
            const spans = item.querySelectorAll('span');
            spans.forEach(span => span.style.color = 'rgba(255, 255, 255, 0.9)');
          });
          sectionHeadings.forEach(heading => heading.style.color = 'white');
          
          // Apply styles to skill and language pills
          const skillPills = leftColumn.querySelectorAll('.skill-pill, .language-pill, .hobby-pill');
          skillPills.forEach(pill => {
            pill.style.color = 'white';
            pill.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            pill.style.padding = '10px 15px';
            pill.style.borderRadius = '8px';
            pill.style.fontSize = '13px';
            pill.style.fontWeight = '500';
            pill.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            pill.style.display = 'block';
            // Apply white to all children
            const children = pill.querySelectorAll('*');
            children.forEach(child => {
              child.style.color = 'white';
              child.style.fontSize = '13px';
              child.style.fontWeight = '500';
            });
          });
          
          skillNames.forEach(name => {
            name.style.color = 'white';
            name.style.fontSize = '13px';
            name.style.fontWeight = '500';
            name.style.display = 'block';
          });
          
          // Apply styles to info items
          const infoItems = leftColumn.querySelectorAll('.info-item');
          infoItems.forEach(item => {
            item.style.color = 'white';
            item.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
            item.style.padding = '8px 10px';
            item.style.borderRadius = '6px';
            item.style.borderLeft = '2px solid rgba(255, 255, 255, 0.3)';
            item.style.whiteSpace = 'normal';
            item.style.flexWrap = 'wrap';
            // Apply white to all children
            const children = item.querySelectorAll('*');
            children.forEach(child => {
              child.style.color = 'white';
            });
          });
          
          infoLabels.forEach(label => {
            label.style.color = 'white';
            label.style.fontSize = '13px';
            label.style.fontWeight = '600';
            label.style.whiteSpace = 'normal';
          });
          
          infoValues.forEach(value => {
            value.style.color = 'white';
            value.style.fontSize = '13px';
            value.style.fontWeight = '500';
            value.style.whiteSpace = 'normal';
            value.style.wordWrap = 'break-word';
          });
        }
        
        if (rightColumn) {
          rightColumn.style.background = 'white';
          rightColumn.style.backgroundColor = 'white';
          rightColumn.style.padding = '30px 20px 30px 35px'; // Reduced right padding
          rightColumn.style.display = 'block';
        }
      }
    }
  });

  console.log('Canvas generated, creating PDF...');
  console.log('Canvas dimensions:', {
    width: canvas.width,
    height: canvas.height
  });
  
  // Validate canvas has content
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('Canvas has invalid dimensions. Element may not be visible.');
  }
  
  // Check if canvas has any visible content (sample a small area)
  const ctx = canvas.getContext('2d');
  const sampleSize = Math.min(50, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  let hasNonWhitePixels = false;
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    // Check if pixel is not fully white/transparent
    if (a > 0 && (r < 255 || g < 255 || b < 255)) {
      hasNonWhitePixels = true;
      break;
    }
  }
  
  if (!hasNonWhitePixels) {
    console.warn('Canvas appears to be empty or all white. Continuing anyway...');
  }

  return canvas;
};

const createPDF = (canvas) => {
  const imgData = canvas.toDataURL('image/jpeg', PDF_CONFIG.imageQuality);
  const pdf = new jsPDF({
    orientation: PDF_CONFIG.orientation,
    unit: PDF_CONFIG.unit,
    format: PDF_CONFIG.format
  });

  const contentWidth = PDF_CONFIG.pageWidth - (PDF_CONFIG.margin * 2);
  const contentHeight = PDF_CONFIG.pageHeight - (PDF_CONFIG.margin * 2);
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  // Single page or multi-page handling
  if (imgHeight <= contentHeight) {
    pdf.addImage(imgData, 'JPEG', PDF_CONFIG.margin, PDF_CONFIG.margin, imgWidth, imgHeight);
  } else {
    handleMultiPagePDF(pdf, canvas, contentWidth, contentHeight, imgHeight);
  }

  return pdf;
};

const handleMultiPagePDF = (pdf, canvas, contentWidth, contentHeight, imgHeight) => {
  const totalPages = Math.ceil(imgHeight / contentHeight);
  console.log('Multi-page PDF:', { totalPages, imgHeight, contentHeight });
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    if (pageNum > 0) {
      pdf.addPage();
    }
    
    const startY = pageNum * contentHeight;
    const endY = Math.min((pageNum + 1) * contentHeight, imgHeight);
    const pageImgHeight = endY - startY;
    
    // Skip empty pages
    if (pageImgHeight <= 0) {
      console.warn(`Skipping empty page ${pageNum + 1}`);
      continue;
    }
    
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d');
    const sourceHeight = (pageImgHeight / imgHeight) * canvas.height;
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    
    // Validate source dimensions
    if (sourceHeight <= 0 || canvas.width <= 0) {
      console.warn(`Invalid dimensions for page ${pageNum + 1}:`, { sourceHeight, width: canvas.width });
      continue;
    }
    
    const sourceY = (startY / imgHeight) * canvas.height;
    pageCtx.drawImage(
      canvas, 
      0, sourceY, 
      canvas.width, sourceHeight,
      0, 0, 
      canvas.width, sourceHeight
    );
    
    const pageImgData = pageCanvas.toDataURL('image/jpeg', PDF_CONFIG.imageQuality);
    
    // Only add page if image data is valid
    if (pageImgData && pageImgData !== 'data:,') {
      pdf.addImage(pageImgData, 'JPEG', PDF_CONFIG.margin, PDF_CONFIG.margin, contentWidth, pageImgHeight);
    } else {
      console.warn(`Empty image data for page ${pageNum + 1}`);
    }
  }
};

const generateFileName = () => {
  const nameInput = document.querySelector('#name-input');
  const userName = nameInput ? nameInput.value.trim() : 'CV';
  return userName ? `${userName.replace(/\s+/g, '_')}_CV.pdf` : `CV_${new Date().toISOString().split('T')[0]}.pdf`;
};

// Main PDF Generation Function
const generatePDF = async () => {
  let cvPreview, downloadButton, originalDisplay, template2Root;

  try {
    console.log('Starting PDF generation...');
    
    // Validate CV preview
    cvPreview = validateCVPreview();
    
    // Update button state
    updateButtonState('Generating PDF...', true);
    
    // Setup PDF mode
    const setup = setupPDFMode(cvPreview);
    downloadButton = setup.downloadButton;
    originalDisplay = setup.originalDisplay;
    template2Root = setup.template2Root;
    
    // Wait a moment for styles to apply
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Apply critical styles directly to elements before cloning
    const leftColumn = cvPreview.querySelector('.cv-left-column');
    const rightColumn = cvPreview.querySelector('.cv-right-column');
    let originalLeftBg = '';
    let originalRightBg = '';
    
    if (leftColumn) {
      // Save original styles
      originalLeftBg = leftColumn.style.background || '';
      // Apply gradient with multiple fallbacks for html2canvas
      leftColumn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      leftColumn.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      leftColumn.style.backgroundColor = '#667eea'; // Solid fallback
      leftColumn.style.backgroundRepeat = 'no-repeat';
      leftColumn.style.backgroundSize = '100% 100%';
      
      // Apply styles to skill and language pills before cloning
      const skillPills = leftColumn.querySelectorAll('.skill-pill, .language-pill, .hobby-pill');
      skillPills.forEach(pill => {
        pill.style.color = 'white';
        pill.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        const children = pill.querySelectorAll('*');
        children.forEach(child => {
          child.style.color = 'white';
          child.style.fontSize = '13px';
          child.style.fontWeight = '500';
        });
      });
      
      // Apply styles to info items before cloning
      const infoItems = leftColumn.querySelectorAll('.info-item');
      infoItems.forEach(item => {
        item.style.color = 'white';
        item.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
        const children = item.querySelectorAll('.info-label, .info-value');
        children.forEach(child => {
          child.style.color = 'white';
        });
      });
    }
    
    if (rightColumn) {
      originalRightBg = rightColumn.style.background || '';
      rightColumn.style.background = 'white';
      rightColumn.style.backgroundColor = 'white';
    }
    
    // Force a reflow to ensure styles are computed
    if (cvPreview) {
      void cvPreview.offsetHeight; // Force reflow
    }
    
    // Generate canvas
    const canvas = await generateCanvas(cvPreview);
    
    // Restore original styles after capture
    if (leftColumn) {
      if (originalLeftBg) {
        leftColumn.style.background = originalLeftBg;
      } else {
        leftColumn.style.background = '';
        leftColumn.style.backgroundColor = '';
      }
    }
    if (rightColumn) {
      if (originalRightBg) {
        rightColumn.style.background = originalRightBg;
      } else {
        rightColumn.style.background = '';
        rightColumn.style.backgroundColor = '';
      }
    }
    
    // Create PDF
    const pdf = createPDF(canvas);
    
    // Download PDF
    const fileName = generateFileName();
    pdf.save(fileName);
    
    console.log('PDF download completed');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Error generating PDF: ${error.message}. Please try again.`);
  } finally {
    // Cleanup
    if (cvPreview) {
      cleanupPDFMode(cvPreview, downloadButton, originalDisplay, template2Root);
    }
    updateButtonState('📄 Download PDF', false);
  }
};

export default generatePDF;
