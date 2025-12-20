import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import FileDownload from '../../utils/fileDownload';
import './pdf3.css';

// PDF Generation Configuration
const PDF_CONFIG = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 0, // No margins for edge-to-edge design
  scale: 3, // Canvas scale for better compatibility
  imageQuality: 2, // JPEG quality
  imageTimeout: 15000 // Timeout for images
};

// Helper Functions
const validateCVPreview = () => {
  const template3Root = document.querySelector('.template3-root');
  const cvPreview = template3Root ? template3Root.querySelector('.cv-preview') : document.querySelector('.template3-root .cv-preview');
  
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

  // Store original dimensions for cv-preview
  const originalWidth = cvPreview.style.width || '';
  const originalMaxWidth = cvPreview.style.maxWidth || '';
  const originalMinWidth = cvPreview.style.minWidth || '';
  
  // Also handle template3-root wrapper if it exists
  const template3Root = cvPreview.closest('.template3-root');
  let originalRootWidth = '';
  let originalRootMaxWidth = '';
  let originalRootMinWidth = '';
  
  if (template3Root) {
    originalRootWidth = template3Root.style.width || '';
    originalRootMaxWidth = template3Root.style.maxWidth || '';
    originalRootMinWidth = template3Root.style.minWidth || '';
    
    // Force A4 dimensions on wrapper
    template3Root.style.width = '800px';
    template3Root.style.maxWidth = '800px';
    template3Root.style.minWidth = '800px';
    template3Root.classList.add('pdf-mode');
  }
  
  // Force A4 dimensions for PDF generation
  // A4: 210mm x 297mm at 96 DPI ≈ 794px x 1123px
  // Using 800px width for better rendering quality
  cvPreview.style.width = '800px';
  cvPreview.style.maxWidth = '800px';
  cvPreview.style.minWidth = '800px';
  cvPreview.style.margin = '0 auto';
  cvPreview.style.display = 'flex';

  // Apply PDF mode styling
  cvPreview.classList.add('pdf-mode');

  return { 
    downloadButton, 
    originalDisplay,
    originalWidth,
    originalMaxWidth,
    originalMinWidth,
    template3Root,
    originalRootWidth,
    originalRootMaxWidth,
    originalRootMinWidth
  };
};

const cleanupPDFMode = (cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth, template3Root, originalRootWidth, originalRootMaxWidth, originalRootMinWidth) => {
  // Restore download button
  if (downloadButton) {
    downloadButton.style.display = originalDisplay;
  }
  
  // Restore original dimensions for cv-preview
  cvPreview.style.width = originalWidth;
  cvPreview.style.maxWidth = originalMaxWidth;
  cvPreview.style.minWidth = originalMinWidth;
  cvPreview.style.margin = '';
  cvPreview.style.display = '';
  
  // Remove PDF mode styling
  cvPreview.classList.remove('pdf-mode');
  
  // Restore template3-root wrapper if it exists
  if (template3Root) {
    template3Root.style.width = originalRootWidth;
    template3Root.style.maxWidth = originalRootMaxWidth;
    template3Root.style.minWidth = originalRootMinWidth;
    template3Root.classList.remove('pdf-mode');
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

const generateCanvas = async (elementToRender) => {
  console.log('Element to render found, generating canvas...');
  
  // Remove all height constraints
  elementToRender.style.height = 'auto';
  elementToRender.style.maxHeight = 'none';
  elementToRender.style.minHeight = 'auto';
  elementToRender.style.overflow = 'visible';
  
  // Also ensure all child elements have no height constraints
  const allChildren = elementToRender.querySelectorAll('*');
  allChildren.forEach(child => {
    if (child.style) {
      if (child.style.maxHeight && child.style.maxHeight !== 'none') {
        child.style.maxHeight = 'none';
      }
      if (child.style.height && child.style.height.includes('vh')) {
        child.style.height = 'auto';
      }
    }
  });
  
  // Force a reflow to get accurate measurements
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
  
  // Get the actual full height - try multiple times to ensure it's stable
  let actualHeight = elementToRender.scrollHeight;
  await new Promise(resolve => setTimeout(resolve, 100));
  const secondHeight = elementToRender.scrollHeight;
  actualHeight = Math.max(actualHeight, secondHeight);
  
  // Wait one more time and check again
  await new Promise(resolve => setTimeout(resolve, 100));
  const thirdHeight = elementToRender.scrollHeight;
  actualHeight = Math.max(actualHeight, thirdHeight);
  
  // Add a small buffer (1%) to ensure we capture everything
  actualHeight = Math.ceil(actualHeight * 1.01);
  
  // Set explicit height to ensure html2canvas captures it all
  elementToRender.style.height = actualHeight + 'px';
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Final measurement
  actualHeight = Math.max(actualHeight, elementToRender.scrollHeight);
  
  console.log('Element dimensions:', {
    scrollWidth: elementToRender.scrollWidth,
    scrollHeight: elementToRender.scrollHeight,
    offsetWidth: elementToRender.offsetWidth,
    offsetHeight: elementToRender.offsetHeight,
    clientHeight: elementToRender.clientHeight,
    actualHeight: actualHeight
  });

  // Calculate A4 dimensions in pixels at 96 DPI
  // A4: 210mm x 297mm = 794px x 1123px (at 96 DPI)
  // Using 800px width for better quality rendering
  const a4WidthPx = 800;
  const a4HeightPx = Math.round(a4WidthPx * (PDF_CONFIG.pageHeight / PDF_CONFIG.pageWidth));
  
  const canvas = await html2canvas(elementToRender, {
    scale: PDF_CONFIG.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    width: a4WidthPx,
    height: actualHeight || a4HeightPx,
    windowWidth: a4WidthPx,
    windowHeight: actualHeight || a4HeightPx,
    removeContainer: false,
    foreignObjectRendering: false,
    imageTimeout: PDF_CONFIG.imageTimeout,
    onclone: (clonedDoc) => {
      // Handle template3-root wrapper
      const clonedRoot = clonedDoc.querySelector('.template3-root');
      const clonedPreview = clonedRoot ? clonedRoot.querySelector('.cv-preview') : clonedDoc.querySelector('.cv-preview');
      const clonedHeader = clonedRoot ? clonedRoot.querySelector('.cv-header') : clonedDoc.querySelector('.cv-header');
      
      if (clonedRoot) {
        clonedRoot.style.visibility = 'visible';
        clonedRoot.style.display = 'block';
        clonedRoot.style.width = '800px';
        clonedRoot.style.maxWidth = '800px';
        clonedRoot.style.minWidth = '800px';
        clonedRoot.style.height = 'auto';
        clonedRoot.style.maxHeight = 'none';
        clonedRoot.style.minHeight = 'auto';
        clonedRoot.style.overflow = 'visible';
      }
      
      if (clonedPreview) {
        clonedPreview.style.visibility = 'visible';
        clonedPreview.style.display = 'flex';
        clonedPreview.style.width = '800px';
        clonedPreview.style.maxWidth = '800px';
        clonedPreview.style.minWidth = '800px';
        clonedPreview.style.height = 'auto';
        clonedPreview.style.maxHeight = 'none';
        clonedPreview.style.minHeight = 'auto';
        clonedPreview.style.overflow = 'visible';
      }
      
      // Ensure main content area has no height constraints
      const clonedMainContent = clonedPreview ? clonedPreview.querySelector('.cv-main-content') : null;
      if (clonedMainContent) {
        clonedMainContent.style.height = 'auto';
        clonedMainContent.style.maxHeight = 'none';
        clonedMainContent.style.minHeight = 'auto';
        clonedMainContent.style.overflow = 'visible';
      }
      
      // Ensure all section cards are visible and have no height constraints
      const clonedSections = clonedPreview ? clonedPreview.querySelectorAll('.cv-section-card') : [];
      clonedSections.forEach(section => {
        section.style.height = 'auto';
        section.style.maxHeight = 'none';
        section.style.overflow = 'visible';
        section.style.visibility = 'visible';
        section.style.display = 'block';
      });
      
      // Ensure download button container is hidden
      const clonedDownloadBtn = clonedPreview ? clonedPreview.querySelector('.download-pdf-container') : null;
      if (clonedDownloadBtn) {
        clonedDownloadBtn.style.display = 'none';
      }
      
      // Ensure header is fully visible
      if (clonedHeader) {
        clonedHeader.style.visibility = 'visible';
        clonedHeader.style.display = 'block';
        clonedHeader.style.overflow = 'visible';
        clonedHeader.style.width = '100%';
        clonedHeader.style.minHeight = 'auto';
        
        // Ensure header graphics are visible
        const clonedGraphics = clonedHeader.querySelector('.header-graphics');
        if (clonedGraphics) {
          clonedGraphics.style.visibility = 'visible';
          clonedGraphics.style.opacity = '1';
          clonedGraphics.style.display = 'block';
        }
        
        // Ensure header content wrapper is visible
        const clonedContentWrapper = clonedHeader.querySelector('.header-content-wrapper');
        if (clonedContentWrapper) {
          clonedContentWrapper.style.visibility = 'visible';
          clonedContentWrapper.style.opacity = '1';
          clonedContentWrapper.style.display = 'flex';
        }
      }
    }
  });

  console.log('Canvas generated, creating PDF...');
  console.log('Canvas dimensions:', {
    width: canvas.width,
    height: canvas.height,
    expectedHeight: actualHeight,
    ratio: canvas.height / actualHeight
  });
  
  // Verify canvas captured full content
  if (canvas.height < actualHeight * 0.9) {
    console.warn('Canvas height is less than expected!', {
      canvasHeight: canvas.height,
      expectedHeight: actualHeight
    });
  }

  return canvas;
};

const createPDF = (canvas) => {
  const pdf = new jsPDF({
    orientation: PDF_CONFIG.orientation,
    unit: PDF_CONFIG.unit,
    format: PDF_CONFIG.format
  });

  const contentWidth = PDF_CONFIG.pageWidth;
  const contentHeight = PDF_CONFIG.pageHeight;
  const imgWidth = contentWidth;
  
  // Calculate imgHeight based on canvas dimensions
  // Ensure we use the full canvas height
  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  
  // Verify the calculation is correct
  const expectedCanvasHeight = (imgHeight * canvas.width) / contentWidth;
  if (Math.abs(canvas.height - expectedCanvasHeight) > 10) {
    console.warn('Canvas height mismatch!', {
      canvasHeight: canvas.height,
      expectedHeight: expectedCanvasHeight,
      difference: Math.abs(canvas.height - expectedCanvasHeight)
    });
  }

  console.log('Creating PDF:', {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    contentWidth,
    contentHeight,
    imgWidth,
    imgHeight,
    willBeMultiPage: imgHeight > contentHeight,
    totalPages: Math.ceil(imgHeight / contentHeight)
  });

  // Single page or multi-page handling
  if (imgHeight <= contentHeight) {
    const imgData = canvas.toDataURL('image/jpeg', PDF_CONFIG.imageQuality);
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    handleMultiPagePDF(pdf, canvas, contentWidth, contentHeight, imgHeight);
  }

  return pdf;
};

const handleMultiPagePDF = (pdf, canvas, contentWidth, contentHeight, imgHeight) => {
  const totalPages = Math.ceil(imgHeight / contentHeight);
  
  console.log('Multi-page PDF:', {
    totalPages,
    imgHeight,
    contentHeight,
    canvasHeight: canvas.height,
    canvasWidth: canvas.width,
    ratio: imgHeight / contentHeight
  });
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    if (pageNum > 0) {
      pdf.addPage();
    }
    
    // Calculate clean page boundaries without overlap to prevent duplication
    const startY = pageNum * contentHeight;
    const endY = Math.min((pageNum + 1) * contentHeight, imgHeight);
    const pageImgHeight = endY - startY;
    
    // Convert to canvas pixel coordinates (use exact floating point, no rounding)
    const sourceStartY = (startY / imgHeight) * canvas.height;
    const sourceEndY = (endY / imgHeight) * canvas.height;
    const sourceHeight = sourceEndY - sourceStartY;
    
    console.log(`Page ${pageNum + 1}/${totalPages}:`, {
      startY: startY.toFixed(2),
      endY: endY.toFixed(2),
      pageImgHeight: pageImgHeight.toFixed(2),
      sourceStartY: sourceStartY.toFixed(2),
      sourceEndY: sourceEndY.toFixed(2),
      sourceHeight: sourceHeight.toFixed(2),
      remaining: (imgHeight - endY).toFixed(2)
    });
    
    // Create a canvas for this page
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    
    // Draw the portion of the canvas (no overlap, exact coordinates)
    pageCtx.drawImage(
      canvas, 
      0, sourceStartY, 
      canvas.width, sourceHeight,
      0, 0, 
      canvas.width, sourceHeight
    );
    
    const pageImgData = pageCanvas.toDataURL('image/jpeg', PDF_CONFIG.imageQuality);
    
    // Add image to PDF at the correct position (edge-to-edge, no margins)
    pdf.addImage(pageImgData, 'JPEG', 0, 0, contentWidth, pageImgHeight);
  }
  
  console.log(`PDF created successfully with ${totalPages} page(s)`);
};

const generateFileName = () => {
  const nameInput = document.querySelector('#name-input');
  const userName = nameInput ? nameInput.value.trim() : 'CV';
  return userName ? `${userName.replace(/\s+/g, '_')}_CV.pdf` : `CV_${new Date().toISOString().split('T')[0]}.pdf`;
};

// Main PDF Generation Function
const generatePDF = async () => {
  let cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth, template3Root, originalRootWidth, originalRootMaxWidth, originalRootMinWidth;

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
    template3Root = setup.template3Root;
    originalRootWidth = setup.originalRootWidth;
    originalRootMaxWidth = setup.originalRootMaxWidth;
    originalRootMinWidth = setup.originalRootMinWidth;
    
    // Wait a bit for layout to settle after setting fixed width
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate canvas - use template3Root if available, otherwise cvPreview
    const elementToRender = template3Root || cvPreview;
    
    // Ensure element is fully rendered and measured
    elementToRender.style.height = 'auto';
    elementToRender.style.maxHeight = 'none';
    elementToRender.style.overflow = 'visible';
    
    // Force browser to recalculate layout
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    
    const canvas = await generateCanvas(elementToRender);
    
    // Create PDF
    const pdf = createPDF(canvas);
    
    // Download PDF
    const fileName = generateFileName();
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // On mobile, save PDF directly to Downloads folder
      try {
        const pdfBlob = pdf.output('blob');
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });
        
        // Use native plugin to save directly to Downloads folder
        console.log('Attempting to use native FileDownload plugin...');
        console.log('File name:', fileName);
        
        try {
          const result = await FileDownload.savePdfToDownloads({
            base64Data: base64Data,
            fileName: fileName
          });
          
          console.log('FileDownload plugin result:', result);
          
          if (result && result.success) {
            alert(`✅ PDF saved successfully to Downloads folder!\n\nFile: ${fileName}\n\nPath: ${result.path || 'Downloads'}`);
          } else {
            throw new Error('Plugin returned unsuccessful result');
          }
        } catch (error) {
          console.error('Error using FileDownload plugin:', error);
          alert(`Failed to save PDF to Downloads folder. Error: ${error.message}\n\nPlease check the console logs for more details.\n\nNote: The file must be saved to Downloads folder, not app data.`);
          throw error;
        }
      } catch (error) {
        console.error('Error saving PDF on mobile:', error);
        alert(`Error saving PDF: ${error.message}\n\nPlease check app permissions and try again.`);
      }
    } else {
      pdf.save(fileName);
    }
    
    console.log('PDF download completed');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Error generating PDF: ${error.message}. Please try again.`);
  } finally {
    // Cleanup
    if (cvPreview) {
      cleanupPDFMode(cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth, template3Root, originalRootWidth, originalRootMaxWidth, originalRootMinWidth);
    }
    updateButtonState('📄 Download PDF', false);
  }
};

export default generatePDF;

