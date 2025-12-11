import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './pdf1.css';

// PDF Generation Configuration
const PDF_CONFIG = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 0, // No margins - edge to edge
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

  // Store original dimensions
  const originalWidth = cvPreview.style.width || '';
  const originalMaxWidth = cvPreview.style.maxWidth || '';
  const originalMinWidth = cvPreview.style.minWidth || '';
  
  // Force A4 dimensions for PDF generation
  // A4: 210mm x 297mm at 96 DPI ≈ 794px x 1123px
  // Using 800px width for better rendering quality
  cvPreview.style.width = '800px';
  cvPreview.style.maxWidth = '800px';
  cvPreview.style.minWidth = '800px';
  cvPreview.style.margin = '0 auto';
  cvPreview.style.display = 'block';

  // Apply PDF mode styling
  cvPreview.classList.add('pdf-mode');

  return { 
    downloadButton, 
    originalDisplay,
    originalWidth,
    originalMaxWidth,
    originalMinWidth
  };
};

const cleanupPDFMode = (cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth) => {
  // Restore download button
  if (downloadButton) {
    downloadButton.style.display = originalDisplay;
  }
  
  // Restore original dimensions
  cvPreview.style.width = originalWidth;
  cvPreview.style.maxWidth = originalMaxWidth;
  cvPreview.style.minWidth = originalMinWidth;
  cvPreview.style.margin = '';
  cvPreview.style.display = '';
  
  // Remove PDF mode styling
  cvPreview.classList.remove('pdf-mode');
};

const updateButtonState = (text, disabled = false) => {
  const button = document.querySelector('.download-pdf-button');
  if (button) {
    button.textContent = text;
    button.disabled = disabled;
  }
  return button;
};

// Helper function to convert blob URL to base64
const blobToBase64 = async (blobUrl) => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert blob URL to base64:', error);
    return blobUrl; // Return original if conversion fails
  }
};

// Helper function to ensure all images are loaded and convert blob URLs
const preloadAndConvertImages = async (element) => {
  const images = element.querySelectorAll('img');
  const imageData = new Map(); // Store original src and converted base64
  
  for (const img of images) {
    const originalSrc = img.src;
    
    // Wait for image to load
    if (!img.complete || img.naturalHeight === 0) {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn('Image failed to load:', img.src);
          resolve(); // Resolve anyway to not block PDF generation
        };
        // If image hasn't started loading, trigger it
        if (!img.src || img.src === '') {
          resolve();
        }
      });
    }
    
    // Convert blob URLs to base64 for better compatibility with html2canvas
    if (originalSrc && originalSrc.startsWith('blob:')) {
      try {
        const base64 = await blobToBase64(originalSrc);
        img.src = base64;
        imageData.set(img, originalSrc); // Store original to restore later
        console.log('Converted blob URL to base64 for PDF generation');
      } catch (error) {
        console.warn('Failed to convert blob URL:', error);
      }
    }
  }
  
  // Give a small delay to ensure rendering after src changes
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return imageData; // Return map to restore original srcs later
};

// Helper function to restore original image sources
const restoreImageSources = (imageData) => {
  imageData.forEach((originalSrc, img) => {
    img.src = originalSrc;
  });
};

const generateCanvas = async (cvPreview) => {
  console.log('CV preview element found, generating canvas...');
  console.log('CV preview dimensions:', {
    width: cvPreview.scrollWidth,
    height: cvPreview.scrollHeight,
    offsetWidth: cvPreview.offsetWidth,
    offsetHeight: cvPreview.offsetHeight
  });

  // Preload all images and convert blob URLs to base64
  console.log('Preloading and converting images...');
  const imageData = await preloadAndConvertImages(cvPreview);
  console.log('Images preloaded and converted');

  // Calculate A4 dimensions in pixels at 96 DPI
  // A4: 210mm x 297mm = 794px x 1123px (at 96 DPI)
  // Using 800px width for better quality rendering
  const a4WidthPx = 800;
  const a4HeightPx = Math.round(a4WidthPx * (PDF_CONFIG.pageHeight / PDF_CONFIG.pageWidth)); // Maintain A4 aspect ratio
  
  const canvas = await html2canvas(cvPreview, {
    scale: PDF_CONFIG.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: true,
    scrollX: 0,
    scrollY: 0,
    width: a4WidthPx,
    height: cvPreview.scrollHeight || a4HeightPx,
    removeContainer: false,
    foreignObjectRendering: false,
    imageTimeout: PDF_CONFIG.imageTimeout,
    onclone: (clonedDoc) => {
      const clonedPreview = clonedDoc.querySelector('.cv-preview');
      if (clonedPreview) {
        clonedPreview.style.visibility = 'visible';
        clonedPreview.style.display = 'block';
        clonedPreview.style.width = 'auto';
        clonedPreview.style.height = 'auto';
        
        // Remove margins and padding from body and html for zero-margin PDF
        const clonedBody = clonedDoc.body;
        const clonedHtml = clonedDoc.documentElement;
        if (clonedBody) {
          clonedBody.style.margin = '0';
          clonedBody.style.padding = '0';
        }
        if (clonedHtml) {
          clonedHtml.style.margin = '0';
          clonedHtml.style.padding = '0';
        }
        
        // Ensure profile images are visible in cloned document
        const profileImages = clonedPreview.querySelectorAll('.profile-image');
        profileImages.forEach((img) => {
          img.style.visibility = 'visible';
          img.style.display = 'block';
          img.style.opacity = '1';
          // Ensure image container is visible
          const container = img.closest('.profile-image-container');
          if (container) {
            container.style.visibility = 'visible';
            container.style.display = 'flex';
            container.style.opacity = '1';
          }
        });
      }
    }
  });

  // Restore original image sources after canvas generation
  restoreImageSources(imageData);

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

  // Calculate content dimensions with no margins (edge to edge)
  const contentWidth = PDF_CONFIG.pageWidth; // Full width since no margins
  const contentHeight = PDF_CONFIG.pageHeight; // Full height since no top margin
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  // Single page or multi-page handling
  const xPos = 0; // No left margin
  const yPos = 0; // No top margin
  
  if (imgHeight <= contentHeight) {
    pdf.addImage(imgData, 'JPEG', xPos, yPos, imgWidth, imgHeight);
  } else {
    handleMultiPagePDF(pdf, canvas, contentWidth, contentHeight, imgHeight, xPos, yPos);
  }

  return pdf;
};

const handleMultiPagePDF = (pdf, canvas, contentWidth, contentHeight, imgHeight, xPos, yPos) => {
  const totalPages = Math.ceil(imgHeight / contentHeight);
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    if (pageNum > 0) {
      pdf.addPage();
    }
    
    // Calculate clean page boundaries without overlap to prevent duplication
    const startY = pageNum * contentHeight;
    const endY = Math.min((pageNum + 1) * contentHeight, imgHeight);
    const pageImgHeight = endY - startY;
    
    // Convert to canvas pixel coordinates
    const sourceStartY = (startY / imgHeight) * canvas.height;
    const sourceEndY = (endY / imgHeight) * canvas.height;
    const sourceHeight = sourceEndY - sourceStartY;
    
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    
    // Draw the portion of the canvas (no overlap)
    pageCtx.drawImage(
      canvas, 
      0, sourceStartY, 
      canvas.width, sourceHeight,
      0, 0, 
      canvas.width, sourceHeight
    );
    
    const pageImgData = pageCanvas.toDataURL('image/jpeg', PDF_CONFIG.imageQuality);
    
    // Add image to PDF at the correct position (use xPos and yPos which are 0 when margin is 0)
    pdf.addImage(pageImgData, 'JPEG', xPos, yPos, contentWidth, pageImgHeight);
  }
};

const generateFileName = () => {
  const nameInput = document.querySelector('#name-input');
  const userName = nameInput ? nameInput.value.trim() : 'CV';
  return userName ? `${userName.replace(/\s+/g, '_')}_CV.pdf` : `CV_${new Date().toISOString().split('T')[0]}.pdf`;
};

// Main PDF Generation Function
const generatePDF = async () => {
  let cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth;

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
    originalWidth = setup.originalWidth;
    originalMaxWidth = setup.originalMaxWidth;
    originalMinWidth = setup.originalMinWidth;
    
    // Wait a bit for layout to settle after setting fixed width
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
      cleanupPDFMode(cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth);
    }
    updateButtonState('📄 Download PDF', false);
  }
};

export default generatePDF;
