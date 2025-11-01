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
    logging: true,
    scrollX: 0,
    scrollY: 0,
    width: elementToRender.offsetWidth || elementToRender.scrollWidth,
    height: elementToRender.offsetHeight || elementToRender.scrollHeight,
    removeContainer: false,
    foreignObjectRendering: false,
    imageTimeout: PDF_CONFIG.imageTimeout,
    onclone: (clonedDoc) => {
      // Force apply all PDF styles immediately
      const style = document.createElement('style');
      style.textContent = `
        .template2-root.pdf-mode .cv-preview.pdf-mode {
          display: grid !important;
          grid-template-columns: 1fr 2fr !important;
          gap: 0 !important;
          padding: 0 !important;
          background: white !important;
          max-width: 1200px !important;
          margin: 0 auto !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .cv-left-column {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          padding: 30px 25px !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .cv-right-column {
          background: white !important;
          padding: 30px 35px !important;
        }
      `;
      clonedDoc.head.appendChild(style);
      
      // Ensure template2-root styles are preserved
      const clonedRoot = clonedDoc.querySelector('.template2-root');
      if (clonedRoot) {
        clonedRoot.classList.add('pdf-mode');
        clonedRoot.style.display = 'block';
        clonedRoot.style.width = 'auto';
        clonedRoot.style.height = 'auto';
      }
      
      // Ensure cv-preview styles are preserved
      const clonedPreview = clonedDoc.querySelector('.cv-preview');
      if (clonedPreview) {
        clonedPreview.classList.add('pdf-mode');
        clonedPreview.style.visibility = 'visible';
        clonedPreview.style.display = 'grid';
        clonedPreview.style.gridTemplateColumns = '1fr 2fr';
        clonedPreview.style.gap = '0';
        clonedPreview.style.width = 'auto';
        clonedPreview.style.height = 'auto';
        clonedPreview.style.maxWidth = '1200px';
        clonedPreview.style.margin = '0 auto';
        clonedPreview.style.padding = '0';
        clonedPreview.style.background = 'white';
        
        // Ensure left and right columns maintain their styles
        const leftColumn = clonedPreview.querySelector('.cv-left-column');
        const rightColumn = clonedPreview.querySelector('.cv-right-column');
        
        if (leftColumn) {
          leftColumn.style.background = 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)';
          leftColumn.style.color = 'white';
          leftColumn.style.padding = '30px 25px';
          leftColumn.style.display = 'block';
          leftColumn.style.minHeight = '100%';
        }
        
        if (rightColumn) {
          rightColumn.style.background = 'white';
          rightColumn.style.padding = '30px 35px';
          rightColumn.style.display = 'block';
          rightColumn.style.minHeight = '100%';
        }
      }
    }
  });

  console.log('Canvas generated, creating PDF...');
  console.log('Canvas dimensions:', {
    width: canvas.width,
    height: canvas.height
  });

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
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    if (pageNum > 0) {
      pdf.addPage();
    }
    
    const startY = pageNum * contentHeight;
    const endY = Math.min((pageNum + 1) * contentHeight, imgHeight);
    const pageImgHeight = endY - startY;
    
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d');
    pageCanvas.width = canvas.width;
    pageCanvas.height = (pageImgHeight / imgHeight) * canvas.height;
    
    pageCtx.drawImage(
      canvas, 
      0, (startY / imgHeight) * canvas.height, 
      canvas.width, (pageImgHeight / imgHeight) * canvas.height,
      0, 0, 
      canvas.width, (pageImgHeight / imgHeight) * canvas.height
    );
    
    const pageImgData = pageCanvas.toDataURL('image/jpeg', PDF_CONFIG.imageQuality);
    pdf.addImage(pageImgData, 'JPEG', PDF_CONFIG.margin, PDF_CONFIG.margin, contentWidth, pageImgHeight);
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
    
    // Generate canvas
    const canvas = await generateCanvas(cvPreview);
    
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
