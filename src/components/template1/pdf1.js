import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import FileDownload from '../../utils/fileDownload';
import { supabase, cvCreditsService, authService } from '../Supabase/supabase';

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
  // First try to find the hidden A4 preview element (always available for PDF)
  // This is the one that's always rendered but hidden off-screen
  let cvPreview = document.querySelector('.template1-preview.template1-a4-size-preview.template1-pdf-mode[style*="visibility: hidden"]');
  
  // If not found, try to find any A4 preview element
  if (!cvPreview) {
    cvPreview = document.querySelector('.template1-preview.template1-a4-size-preview.template1-pdf-mode');
  }
  
  // If still not found, try to find any A4 preview element
  if (!cvPreview) {
    cvPreview = document.querySelector('.template1-preview.template1-a4-size-preview');
  }
  
  // If not found, try to find any template1-preview element
  if (!cvPreview) {
    cvPreview = document.querySelector('.template1-preview');
  }
  
  if (!cvPreview) {
    throw new Error('CV preview not found. Please make sure the CV is loaded.');
  }

  const hasContent = cvPreview.textContent && cvPreview.textContent.trim().length > 0;
  if (!hasContent) {
    throw new Error('CV preview is empty. Please fill in some information before generating PDF.');
  }

  return cvPreview;
};

const applyPageBreaks = (cvPreview) => {
  const pageHeight = 1129; // A4 page height in pixels
  const padding = 20; // Top and bottom padding
  const usablePageHeight = pageHeight - (padding * 2);
  
  // Get all sections
  const sections = cvPreview.querySelectorAll('.cv-section');
  
  // Reset all sections first
  sections.forEach(section => {
    section.style.marginTop = '';
    section.style.pageBreakBefore = '';
    section.style.breakBefore = '';
  });
  
  // Check each section to see if it would be cut off
  sections.forEach((section, index) => {
    // Get the section's position relative to the preview container
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    // Calculate which page this section starts on (accounting for padding)
    const positionOnPage = (sectionTop - padding) % pageHeight;
    const currentPage = Math.floor((sectionTop - padding) / pageHeight);
    
    // Check if section would be cut off (starts too close to page end)
    // Leave at least 10% of page height as buffer
    const minSpaceRequired = usablePageHeight * 0.1;
    const spaceRemaining = pageHeight - positionOnPage - padding;
    const wouldBeCutOff = sectionHeight > spaceRemaining && spaceRemaining < (usablePageHeight - minSpaceRequired);
    
    if (wouldBeCutOff && index > 0) {
      // Move section to next page
      const nextPageStart = (currentPage + 1) * pageHeight + padding;
      const marginNeeded = nextPageStart - sectionTop;
      
      // Only add margin if it's positive (section is before the next page start)
      if (marginNeeded > 0) {
        section.style.marginTop = `${marginNeeded}px`;
        section.style.pageBreakBefore = 'always';
        section.style.breakBefore = 'page';
      }
    }
  });
};

const setupPDFMode = (cvPreview) => {
  // Apply page breaks to prevent section cutoff
  applyPageBreaks(cvPreview);
  
  // Hide download button
  const downloadButton = cvPreview.querySelector('.download-pdf-container');
  const originalDisplay = downloadButton ? downloadButton.style.display : '';
  if (downloadButton) {
    downloadButton.style.display = 'none';
  }

  // Store original styles
  const originalWidth = cvPreview.style.width || '';
  const originalMaxWidth = cvPreview.style.maxWidth || '';
  const originalMinWidth = cvPreview.style.minWidth || '';
  const originalTransform = cvPreview.style.transform || '';
  const originalDisplayStyle = cvPreview.style.display || '';
  const originalVisibility = cvPreview.style.visibility || '';
  const originalOpacity = cvPreview.style.opacity || '';
  const originalPosition = cvPreview.style.position || '';
  const originalZIndex = cvPreview.style.zIndex || '';
  const originalTop = cvPreview.style.top || '';
  const originalLeft = cvPreview.style.left || '';
  
  // Make sure preview is visible and positioned correctly for PDF generation
  // If it's in a modal, ensure the modal is visible too
  const modal = cvPreview.closest('.a4-preview-modal-content');
  const modalOverlay = cvPreview.closest('.a4-preview-modal-overlay');
  let originalModalDisplay = '';
  let originalModalOverlayDisplay = '';
  
  if (modal) {
    originalModalDisplay = modal.style.display || '';
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
  }
  
  if (modalOverlay) {
    originalModalOverlayDisplay = modalOverlay.style.display || '';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.visibility = 'visible';
    modalOverlay.style.opacity = '1';
  }
  
  // Force A4 dimensions for PDF generation
  // A4: 210mm x 297mm at 96 DPI ≈ 794px x 1123px
  // Using 800px width for better rendering quality
  cvPreview.style.width = '800px';
  cvPreview.style.maxWidth = '800px';
  cvPreview.style.minWidth = '800px';
  cvPreview.style.margin = '0 auto';
  cvPreview.style.display = 'block';
  cvPreview.style.visibility = 'visible';
  cvPreview.style.opacity = '1';
  cvPreview.style.position = 'fixed';
  cvPreview.style.top = '0';
  cvPreview.style.left = '0';
  cvPreview.style.zIndex = '99999';
  cvPreview.style.background = '#ffffff';
  
  // Remove any transform scale (from zoom controls)
  cvPreview.style.transform = 'scale(1)';
  cvPreview.style.transformOrigin = 'center center';

  // Ensure PDF mode styling is applied
  cvPreview.classList.add('pdf-mode');
  cvPreview.classList.add('a4-size-preview');

  return { 
    downloadButton, 
    originalDisplay,
    originalWidth,
    originalMaxWidth,
    originalMinWidth,
    originalTransform,
    originalDisplayStyle,
    originalVisibility,
    originalOpacity,
    originalPosition,
    originalZIndex,
    originalTop,
    originalLeft,
    modal,
    modalOverlay,
    originalModalDisplay,
    originalModalOverlayDisplay
  };
};

const cleanupPDFMode = (cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth, originalTransform, originalDisplayStyle, originalVisibility, originalOpacity, originalPosition, originalZIndex, originalTop, originalLeft, modal, modalOverlay, originalModalDisplay, originalModalOverlayDisplay) => {
  // Restore download button
  if (downloadButton) {
    downloadButton.style.display = originalDisplay;
  }
  
  // Restore modal visibility if it was hidden
  if (modal && originalModalDisplay) {
    modal.style.display = originalModalDisplay;
  }
  if (modalOverlay && originalModalOverlayDisplay) {
    modalOverlay.style.display = originalModalOverlayDisplay;
  }
  
  // Restore original styles
  cvPreview.style.width = originalWidth;
  cvPreview.style.maxWidth = originalMaxWidth;
  cvPreview.style.minWidth = originalMinWidth;
  cvPreview.style.margin = '';
  cvPreview.style.display = originalDisplayStyle || '';
  cvPreview.style.visibility = originalVisibility || '';
  cvPreview.style.opacity = originalOpacity || '';
  cvPreview.style.transform = originalTransform || '';
  cvPreview.style.transformOrigin = '';
  cvPreview.style.position = originalPosition || '';
  cvPreview.style.zIndex = originalZIndex || '';
  cvPreview.style.top = originalTop || '';
  cvPreview.style.left = originalLeft || '';
  
  // Note: We keep pdf-mode class as it might be needed for the preview
  // Only remove it if it wasn't there originally
  // (This is handled by the component's state)
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

  // Apply page breaks to original preview before cloning
  applyPageBreaks(cvPreview);
  
  // Force a reflow to ensure page breaks are applied
  void cvPreview.offsetHeight;

  // Preload all images and convert blob URLs to base64
  console.log('Preloading and converting images...');
  const imageData = await preloadAndConvertImages(cvPreview);
  console.log('Images preloaded and converted');

  // Calculate A4 dimensions in pixels at 96 DPI
  // A4: 210mm x 297mm = 794px x 1123px (at 96 DPI)
  // Using 800px width for better quality rendering
  const a4WidthPx = 800;
  const a4HeightPx = Math.round(a4WidthPx * (PDF_CONFIG.pageHeight / PDF_CONFIG.pageWidth)); // Maintain A4 aspect ratio
  
  // Ensure the preview element has correct dimensions before generating canvas
  if (cvPreview.style.width !== '800px') {
    cvPreview.style.width = '800px';
    cvPreview.style.minWidth = '800px';
    cvPreview.style.maxWidth = '800px';
  }
  
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
      // Try to find A4 preview first, then fallback to any cv-preview
      let clonedPreview = clonedDoc.querySelector('.cv-preview.a4-size-preview');
      if (!clonedPreview) {
        clonedPreview = clonedDoc.querySelector('.cv-preview');
      }
      
      if (clonedPreview) {
        clonedPreview.style.visibility = 'visible';
        clonedPreview.style.display = 'block';
        clonedPreview.style.width = '800px';
        clonedPreview.style.minWidth = '800px';
        clonedPreview.style.maxWidth = '800px';
        clonedPreview.style.height = 'auto';
        clonedPreview.style.transform = 'scale(1)';
        clonedPreview.style.transformOrigin = 'center center';
        clonedPreview.style.margin = '0 auto';
        clonedPreview.style.opacity = '1';
        
        // Ensure pdf-mode class is applied
        clonedPreview.classList.add('pdf-mode');
        clonedPreview.classList.add('a4-size-preview');
        
        // Ensure background is white
        clonedPreview.style.background = '#ffffff';
        clonedPreview.style.backgroundColor = '#ffffff';
        
        // Remove margins and padding from body and html for zero-margin PDF
        const clonedBody = clonedDoc.body;
        const clonedHtml = clonedDoc.documentElement;
        if (clonedBody) {
          clonedBody.style.margin = '0';
          clonedBody.style.padding = '0';
          clonedBody.style.backgroundColor = '#ffffff';
          clonedBody.style.background = '#ffffff';
        }
        if (clonedHtml) {
          clonedHtml.style.margin = '0';
          clonedHtml.style.padding = '0';
          clonedHtml.style.backgroundColor = '#ffffff';
          clonedHtml.style.background = '#ffffff';
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
        
        // Apply page breaks to cloned document to prevent section cutoff
        // Use the same logic as the original preview
        const pageHeight = 1129;
        const padding = 20;
        const usablePageHeight = pageHeight - (padding * 2);
        const clonedSections = clonedPreview.querySelectorAll('.cv-section');
        
        clonedSections.forEach((section, index) => {
          // Force a reflow to get accurate measurements
          void section.offsetHeight;
          
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight || section.scrollHeight;
          const positionOnPage = (sectionTop - padding) % pageHeight;
          const currentPage = Math.floor((sectionTop - padding) / pageHeight);
          const minSpaceRequired = usablePageHeight * 0.1;
          const spaceRemaining = pageHeight - positionOnPage - padding;
          const wouldBeCutOff = sectionHeight > spaceRemaining && spaceRemaining < (usablePageHeight - minSpaceRequired);
          
          if (wouldBeCutOff && index > 0) {
            const nextPageStart = (currentPage + 1) * pageHeight + padding;
            const marginNeeded = nextPageStart - sectionTop;
            if (marginNeeded > 0) {
              section.style.marginTop = `${marginNeeded}px`;
              section.style.pageBreakBefore = 'always';
              section.style.breakBefore = 'page';
            }
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

const generateFileName = (formData = null) => {
  let userName = '';
  
  // First try to get from formData if provided (for preview page)
  if (formData && formData.name) {
    userName = formData.name.trim();
  }
  
  // If not found, try to get from DOM input (for form page)
  if (!userName) {
    const nameInput = document.querySelector('#name-input');
    userName = nameInput ? nameInput.value.trim() : '';
  }
  
  // If still not found, try localStorage
  if (!userName) {
    try {
      const storedData = localStorage.getItem('cvFormData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        userName = parsedData.name ? parsedData.name.trim() : '';
      }
    } catch (e) {
      console.warn('Error reading name from localStorage:', e);
    }
  }
  
  return userName ? `${userName.replace(/\s+/g, '_')}_CV.pdf` : `CV_${new Date().toISOString().split('T')[0]}.pdf`;
};

// Main PDF Generation Function
const generatePDF = async (formData = null) => {
  let cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth, originalTransform, originalDisplayStyle, originalVisibility, originalOpacity, originalPosition, originalZIndex, originalTop, originalLeft, modal, modalOverlay, originalModalDisplay, originalModalOverlayDisplay;

  try {
    console.log('Starting PDF generation...');
    
    // Check CV credits before allowing download
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const canDownload = await cvCreditsService.canDownloadCV(user.id);
        if (!canDownload) {
          const credits = await cvCreditsService.getCredits(user.id);
          alert(`You have no CV download credits remaining (${credits} credits). Please contact admin to add more credits.`);
          updateButtonState('📄 Download PDF', false);
          return;
        }
      }
    } catch (creditError) {
      console.error('Error checking CV credits:', creditError);
      // Continue with download if credit check fails (for backward compatibility)
    }
    
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
    originalTransform = setup.originalTransform;
    originalDisplayStyle = setup.originalDisplayStyle;
    originalVisibility = setup.originalVisibility;
    originalOpacity = setup.originalOpacity;
    originalPosition = setup.originalPosition;
    originalZIndex = setup.originalZIndex;
    originalTop = setup.originalTop;
    originalLeft = setup.originalLeft;
    modal = setup.modal;
    modalOverlay = setup.modalOverlay;
    originalModalDisplay = setup.originalModalDisplay;
    originalModalOverlayDisplay = setup.originalModalOverlayDisplay;
    
    // Wait a bit for layout to settle after setting fixed width
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate canvas
    const canvas = await generateCanvas(cvPreview);
    
    // Create PDF
    const pdf = createPDF(canvas);
    
    // Download PDF
    const fileName = generateFileName(formData);
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // On mobile, save PDF directly to Downloads folder using native plugin
      try {
        // Get PDF as blob
        const pdfBlob = pdf.output('blob');
        
        // Convert blob to base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });
        
        console.log('Attempting to use native FileDownload plugin...');
        console.log('File name:', fileName);
        
        try {
          // Use native plugin to save directly to Downloads folder
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
          // Fallback: Show error message
          alert(`Failed to save PDF to Downloads folder. Error: ${error.message}\n\nPlease check the console logs for more details.\n\nNote: The file must be saved to Downloads folder, not app data.`);
          throw error;
        }
      } catch (error) {
        console.error('Error saving PDF on mobile:', error);
        alert(`Error saving PDF: ${error.message}\n\nPlease check app permissions and try again.`);
      }
    } else {
      // On web, use normal download
      pdf.save(fileName);
    }
    
    // Decrement credits after successful download
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const newCredits = await cvCreditsService.decrementCredits(user.id);
        if (newCredits >= 0) {
          console.log(`CV credits decremented. Remaining credits: ${newCredits}`);
          // Dispatch event to update credits display in Header and Dashboard
          window.dispatchEvent(new CustomEvent('cvCreditsUpdated'));
          // Optionally show remaining credits to user
          if (newCredits === 0) {
            alert(`PDF downloaded successfully! You have no credits remaining. Please contact admin to add more credits.`);
          } else {
            console.log(`Remaining CV credits: ${newCredits}`);
          }
        }
      }
    } catch (creditError) {
      console.error('Error decrementing CV credits:', creditError);
      // Don't block the download if credit decrement fails
    }
    
    console.log('PDF download completed');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Error generating PDF: ${error.message}. Please try again.`);
  } finally {
    // Cleanup
    if (cvPreview) {
      cleanupPDFMode(cvPreview, downloadButton, originalDisplay, originalWidth, originalMaxWidth, originalMinWidth, originalTransform, originalDisplayStyle, originalVisibility, originalOpacity, originalPosition, originalZIndex, originalTop, originalLeft, modal, modalOverlay, originalModalDisplay, originalModalOverlayDisplay);
    }
    updateButtonState('📄 Download PDF', false);
  }
};

export default generatePDF;
