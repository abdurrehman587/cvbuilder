import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import FileDownload from '../../utils/fileDownload';
import './pdf2.css';

// PDF Generation Configuration
const PDF_CONFIG = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 0, // No margins for edge-to-edge printing
  marginRight: 0, // No right margin
  scale: 3, // Canvas scale for better compatibility
  imageQuality: 2, // JPEG quality
  imageTimeout: 15000 // Timeout for images
};

// Helper Functions
const validateCVPreview = () => {
  // Check for template2-root wrapper first, then fall back to cv-preview
  const template2Root = document.querySelector('.template2-root');
  const cvPreview = template2Root || document.querySelector('.cv-preview');
  
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
  
  // Also add pdf-mode to template2-root wrapper if it exists
  const template2Root = cvPreview.closest('.template2-root');
  if (template2Root) {
    template2Root.classList.add('pdf-mode');
    template2Root.style.width = '800px';
    template2Root.style.maxWidth = '800px';
    template2Root.style.minWidth = '800px';
  }

  return { 
    downloadButton, 
    originalDisplay, 
    template2Root,
    originalWidth,
    originalMaxWidth,
    originalMinWidth
  };
};

const cleanupPDFMode = (cvPreview, downloadButton, originalDisplay, template2Root, originalWidth, originalMaxWidth, originalMinWidth) => {
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
  
  // Remove pdf-mode from template2-root wrapper if it exists
  if (template2Root) {
    template2Root.classList.remove('pdf-mode');
    template2Root.style.width = '';
    template2Root.style.maxWidth = '';
    template2Root.style.minWidth = '';
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

  // Calculate A4 dimensions in pixels at 96 DPI
  // A4: 210mm x 297mm = 794px x 1123px (at 96 DPI)
  // Using 800px width for better quality rendering
  const a4WidthPx = 800;
  const a4HeightPx = Math.round(a4WidthPx * (PDF_CONFIG.pageHeight / PDF_CONFIG.pageWidth)); // Maintain A4 aspect ratio
  
  const canvas = await html2canvas(elementToRender, {
    scale: PDF_CONFIG.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: true,
    scrollX: 0,
    scrollY: 0,
    width: a4WidthPx,
    height: elementToRender.scrollHeight || a4HeightPx,
    removeContainer: false,
    foreignObjectRendering: false,
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
        .template2-root.pdf-mode .cv-preview.pdf-mode .cv-left-column * {
          color: white !important;
        }
        .template2-root.pdf-mode .cv-preview.pdf-mode .cv-right-column {
          background: white !important;
          color: #333 !important;
          padding: 30px 35px !important;
          display: block !important;
        }
      `;
      clonedDoc.head.appendChild(style);
      
      const clonedPreview = clonedDoc.querySelector('.cv-preview');
      if (clonedPreview) {
        clonedPreview.style.visibility = 'visible';
        clonedPreview.style.display = 'grid';
        clonedPreview.style.gridTemplateColumns = '35% 65%';
        clonedPreview.style.width = 'auto';
        clonedPreview.style.height = 'auto';
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

  const contentWidth = PDF_CONFIG.pageWidth;
  const contentHeight = PDF_CONFIG.pageHeight;
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  // Single page or multi-page handling
  if (imgHeight <= contentHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
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
    
    // Add image to PDF at the correct position (no margins for edge-to-edge printing)
    pdf.addImage(pageImgData, 'JPEG', 0, 0, contentWidth, pageImgHeight);
  }
};

const generateFileName = () => {
  const nameInput = document.querySelector('#name-input');
  const userName = nameInput ? nameInput.value.trim() : 'CV';
  return userName ? `${userName.replace(/\s+/g, '_')}_CV.pdf` : `CV_${new Date().toISOString().split('T')[0]}.pdf`;
};

// Main PDF Generation Function
const generatePDF = async () => {
  let cvPreview, downloadButton, originalDisplay, template2Root, originalWidth, originalMaxWidth, originalMinWidth;

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
      cleanupPDFMode(cvPreview, downloadButton, originalDisplay, template2Root, originalWidth, originalMaxWidth, originalMinWidth);
    }
    updateButtonState('📄 Download PDF', false);
  }
};

export default generatePDF;
