import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import FileDownload from '../../utils/fileDownload';
import './pdf5.css';

// PDF Generation Configuration
const PDF_CONFIG = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 6.35, // Top/bottom margins: 0.25 inches = 6.35mm
  marginLeft: 6.35, // Left margin: 0.25 inches = 6.35mm
  marginRight: 6.35, // Right margin: 0.25 inches = 6.35mm
  scale: 3, // Canvas scale for better compatibility
  imageQuality: 2, // JPEG quality
  imageTimeout: 15000 // Timeout for images
};

// Helper Functions
const validateCVPreview = () => {
  // Use hidden preview for PDF generation (not the visible scaled one)
  const cvPreview = document.querySelector('.cv-preview-hidden') || document.querySelector('.cv-preview');
  
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
  
  // Force A4 dimensions for PDF generation with margins
  // A4: 210mm x 297mm at 96 DPI ≈ 794px x 1123px
  // Account for margins: 210mm - 12.7mm (6.35mm each side) = 197.3mm content width
  // At 96 DPI: 197.3mm ≈ 745px
  cvPreview.style.width = '745px';
  cvPreview.style.maxWidth = '745px';
  cvPreview.style.minWidth = '745px';
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

const updateButtonState = (text, disabled = false, isCompact = false) => {
  if (isCompact) {
    // Update all compact buttons (both hidden and visible)
    const buttons = document.querySelectorAll('.download-pdf-button-compact');
    buttons.forEach(button => {
      if (button) {
        button.textContent = text;
        button.disabled = disabled;
      }
    });
    return buttons[0] || null;
  } else {
    // Update all standard buttons (both hidden and visible)
    const buttons = document.querySelectorAll('.download-pdf-button:not(.download-pdf-button-compact)');
    buttons.forEach(button => {
      button.textContent = text;
      button.disabled = disabled;
    });
    return buttons[0] || null;
  }
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
    
    // Convert relative paths to absolute URLs for html2canvas
    if (originalSrc && originalSrc.startsWith('/') && !originalSrc.startsWith('//')) {
      try {
        const absoluteUrl = window.location.origin + originalSrc;
        img.src = absoluteUrl;
        imageData.set(img, originalSrc); // Store original to restore later
        console.log('Converted relative path to absolute URL for PDF generation:', absoluteUrl);
        // Wait a bit for the image to load with the new URL
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Failed to convert relative path:', error);
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

  // Calculate A4 dimensions in pixels at 96 DPI with margins
  // A4: 210mm x 297mm = 794px x 1123px (at 96 DPI)
  // Content width with margins: 210mm - 12.7mm (6.35mm each side) = 197.3mm ≈ 745px
  // Using 745px width for better quality rendering (accounts for 0.25 inch margins)
  const a4WidthPx = 745;
  const a4HeightPx = Math.round(a4WidthPx * (PDF_CONFIG.pageHeight / PDF_CONFIG.pageWidth)); // Maintain A4 aspect ratio
  
  const canvas = await html2canvas(cvPreview, {
    scale: PDF_CONFIG.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: true,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
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
        clonedPreview.style.margin = '0';
        clonedPreview.style.padding = '0';
        
        // Ensure body and html have no margins
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
        
        // Ensure europass header has no border and no spacing
        const europassHeader = clonedPreview.querySelector('.europass-header');
        if (europassHeader) {
          europassHeader.style.borderBottom = 'none';
          europassHeader.style.border = 'none';
          europassHeader.style.marginBottom = '0';
          europassHeader.style.padding = '0';
          europassHeader.style.margin = '0';
        }
        
        const europassHeaderContent = clonedPreview.querySelector('.europass-header-content');
        if (europassHeaderContent) {
          europassHeaderContent.style.borderBottom = 'none';
          europassHeaderContent.style.border = 'none';
          europassHeaderContent.style.margin = '0';
          europassHeaderContent.style.padding = '0';
        }
        
        // Remove top margin from first section
        const firstSection = clonedPreview.querySelector('.europass-section');
        if (firstSection) {
          firstSection.style.marginTop = '0';
          firstSection.style.paddingTop = '0';
        }
        
        const europassLogo = clonedPreview.querySelector('.europass-logo');
        if (europassLogo) {
          europassLogo.style.visibility = 'visible';
          europassLogo.style.display = 'block';
          europassLogo.style.opacity = '1';
          europassLogo.style.height = '15px';
          europassLogo.style.maxWidth = '38px';
          // Ensure logo container is visible
          const logoContainer = europassLogo.closest('.europass-logo-container');
          if (logoContainer) {
            logoContainer.style.visibility = 'visible';
            logoContainer.style.display = 'flex';
            logoContainer.style.opacity = '1';
            logoContainer.style.marginLeft = '-22px';
            logoContainer.style.maxWidth = '38px';
          }
        }
        
        // Also adjust header-right margins
        const headerRight = clonedPreview.querySelector('.europass-header-right');
        if (headerRight) {
          headerRight.style.marginLeft = '-22px';
        }
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

  // Calculate content dimensions with margins
  const contentWidth = PDF_CONFIG.pageWidth - PDF_CONFIG.marginLeft - PDF_CONFIG.marginRight;
  const contentHeight = PDF_CONFIG.pageHeight - (PDF_CONFIG.margin * 2);
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  const xPosition = PDF_CONFIG.marginLeft;
  const yPosition = PDF_CONFIG.margin;

  // Single page or multi-page handling
  if (imgHeight <= contentHeight) {
    pdf.addImage(imgData, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);
  } else {
    handleMultiPagePDF(pdf, canvas, contentWidth, contentHeight, imgHeight, xPosition, yPosition);
  }

  return pdf;
};

const handleMultiPagePDF = (pdf, canvas, contentWidth, contentHeight, imgHeight, xPosition, yPosition) => {
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
    
    // Add image to PDF at the correct position (0,0 when no margins)
    pdf.addImage(pageImgData, 'JPEG', xPosition, yPosition, contentWidth, pageImgHeight);
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
    updateButtonState('Generating PDF...', true, false);
    
    // Setup PDF mode
    const setup = setupPDFMode(cvPreview);
    downloadButton = setup.downloadButton;
    originalDisplay = setup.originalDisplay;
    originalWidth = setup.originalWidth;
    originalMaxWidth = setup.originalMaxWidth;
    originalMinWidth = setup.originalMinWidth;
    
    // Ensure compact mode is not active for standard PDF
    cvPreview.classList.remove('compact-mode');
    
    // Wait a bit for layout to settle after setting fixed width
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate canvas
    const canvas = await generateCanvas(cvPreview);
    
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
      cleanupPDFMode(cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth);
    }
    updateButtonState('📄 Download PDF', false, false);
  }
};

// Compact PDF Generation Function (with tighter line spacing)
const generateCompactPDF = async () => {
  let cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth;

  try {
    console.log('Starting Compact PDF generation...');
    
    // Validate CV preview
    cvPreview = validateCVPreview();
    
    // Update button state
    updateButtonState('Generating PDF...', true, true);
    
    // Setup PDF mode with compact class
    const setup = setupPDFMode(cvPreview);
    downloadButton = setup.downloadButton;
    originalDisplay = setup.originalDisplay;
    originalWidth = setup.originalWidth;
    originalMaxWidth = setup.originalMaxWidth;
    originalMinWidth = setup.originalMinWidth;
    
    // Add compact mode class
    cvPreview.classList.add('compact-mode');
    
    // Wait a bit for layout to settle after setting fixed width
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate canvas
    const canvas = await generateCanvas(cvPreview);
    
    // Create PDF
    const pdf = createPDF(canvas);
    
    // Download PDF
    const nameInput = document.querySelector('#name-input');
    const userName = nameInput ? nameInput.value.trim() : 'CV';
    const fileName = userName ? `${userName.replace(/\s+/g, '_')}_CV_Compact.pdf` : `CV_Compact_${new Date().toISOString().split('T')[0]}.pdf`;
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
    
    console.log('Compact PDF download completed');
    
  } catch (error) {
    console.error('Error generating Compact PDF:', error);
    alert(`Error generating Compact PDF: ${error.message}. Please try again.`);
  } finally {
    // Cleanup
    if (cvPreview) {
      cvPreview.classList.remove('compact-mode');
      cleanupPDFMode(cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth);
    }
    updateButtonState('📄 Download PDF (Compact)', false, true);
  }
};

export default generatePDF;
export { generateCompactPDF };
