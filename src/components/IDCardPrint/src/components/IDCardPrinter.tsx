import React, { useState, useRef, useCallback } from 'react';
import { Upload, Printer, X, Plus, Minus, RotateCw } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card } from '../../../ui/card';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Dialog, DialogContent } from './ui/dialog';
import { useToast } from '../../../../hooks/use-toast';
import { authService, idCardCreditsService } from '../../../Supabase/supabase';
import './IDCardPrinter.css';

type ScanMode = 'original' | 'auto' | 'gray' | 'black-white';

interface ImageSettings {
  scanMode: ScanMode;
  brightness: number;
  processedImage: string | null;
}

interface CardDesign {
  id: string;
  frontImage: string | null;
  backImage: string | null;
  frontSettings: ImageSettings;
  backSettings: ImageSettings;
  copies: number;
}

const IDCardPrinter: React.FC = () => {
  const defaultSettings: ImageSettings = {
    scanMode: 'original',
    brightness: 0,
    processedImage: null
  };

  // Load card designs from localStorage on mount, or use default
  // Only load if we're continuing the same session (not navigating back)
  const loadCardDesignsFromStorage = (): CardDesign[] => {
    try {
      // Check if we have a session flag indicating we're continuing the same session
      const isContinuingSession = sessionStorage.getItem('idCardPrintSessionActive') === 'true';
      const saved = localStorage.getItem('idCardDesigns');
      
      // Only load saved cards if we're continuing the same session
      // If user navigated away and came back, start fresh
      if (isContinuingSession && saved) {
        const parsed = JSON.parse(saved);
        // Validate and return parsed data, or default if invalid
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } else {
        // New session or no saved data - clear any old data and start fresh
        localStorage.removeItem('idCardDesigns');
      }
    } catch (error) {
      console.error('Error loading card designs from localStorage:', error);
      localStorage.removeItem('idCardDesigns');
    }
    // Return default if nothing saved or error
    return [
      { 
        id: '1', 
        frontImage: null, 
        backImage: null, 
        frontSettings: { ...defaultSettings },
        backSettings: { ...defaultSettings },
        copies: 1
      }
    ];
  };

  const [cardDesigns, setCardDesigns] = useState<CardDesign[]>(loadCardDesignsFromStorage);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropCardId, setCropCardId] = useState<string | null>(null);
  const [cropSide, setCropSide] = useState<'front' | 'back' | null>(null);
  const { toast } = useToast();

  // Mark session as active when component mounts
  React.useEffect(() => {
    sessionStorage.setItem('idCardPrintSessionActive', 'true');
    
    return () => {
      // Clear session flag when component unmounts (user navigated away)
      sessionStorage.removeItem('idCardPrintSessionActive');
    };
  }, []);

  // Save card designs to localStorage whenever they change
  React.useEffect(() => {
    try {
      const serialized = JSON.stringify(cardDesigns);
      // Check if data is too large for localStorage (usually 5-10MB limit)
      if (serialized.length > 4 * 1024 * 1024) { // 4MB threshold
        console.warn('Card designs data is too large for localStorage, some data may not be saved');
        // Still try to save, but it might fail
      }
      localStorage.setItem('idCardDesigns', serialized);
    } catch (error: any) {
      console.error('Error saving card designs to localStorage:', error);
      // If quota exceeded, try to clear old data and retry
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('localStorage quota exceeded, attempting to clear old data');
        try {
          // Clear only if we can't save - but keep current session data
          localStorage.removeItem('idCardDesigns');
          localStorage.setItem('idCardDesigns', JSON.stringify(cardDesigns));
        } catch (retryError) {
          console.error('Failed to save card designs even after clearing:', retryError);
        }
      }
    }
  }, [cardDesigns]);

  // Ensure we stay on the print page (not dashboard) when component mounts and on focus
  // Also clear saved cards when component unmounts (user navigated away)
  React.useEffect(() => {
    const ensurePrintPage = () => {
      localStorage.setItem('idCardView', 'print');
      localStorage.setItem('selectedApp', 'id-card-print');
    };
    
    // Set immediately
    ensurePrintPage();
    
    // Also set when window regains focus (e.g., after print window closes)
    const handleFocus = () => {
      ensurePrintPage();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      // Clear saved cards when component unmounts (user navigated away)
      // Only clear if not currently printing
      if (localStorage.getItem('idCardPrintingInProgress') !== 'true') {
        localStorage.removeItem('idCardDesigns');
      }
    };
  }, []);

  const handleImageUpload = (file: File, cardId: string, side: 'front' | 'back') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        toast({
          title: "Upload failed",
          description: "Failed to read image file.",
          variant: "destructive",
        });
        return;
      }
      setCardDesigns(prev => prev.map(card => 
        card.id === cardId 
          ? { 
              ...card, 
              [side === 'front' ? 'frontImage' : 'backImage']: result,
              [side === 'front' ? 'frontSettings' : 'backSettings']: {
                ...defaultSettings,
                processedImage: result
              }
            }
          : card
      ));
      toast({
        title: "Image uploaded",
        description: `${side === 'front' ? 'Front' : 'Back'} side image uploaded successfully.`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload error",
        description: "Failed to read image file.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, cardId: string, side: 'front' | 'back') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file, cardId, side);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, cardId: string, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, cardId, side);
    }
  };

  const removeImage = (cardId: string, side: 'front' | 'back') => {
    setCardDesigns(prev => prev.map(card => 
      card.id === cardId 
        ? { 
            ...card, 
            [side === 'front' ? 'frontImage' : 'backImage']: null,
            [side === 'front' ? 'frontSettings' : 'backSettings']: { ...defaultSettings }
          }
        : card
    ));
  };

  const processImage = (imageSrc: string, scanMode: ScanMode, brightness: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image first
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // For auto mode and black-white mode, first pass: calculate average brightness
        let avgBrightness = 0;
        if (scanMode === 'auto' || scanMode === 'black-white') {
          let totalBrightness = 0;
          let pixelCount = 0;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            totalBrightness += gray;
            pixelCount++;
          }
          avgBrightness = totalBrightness / pixelCount;
        }

        // Apply brightness and scan mode
        const brightnessFactor = 1 + (brightness / 100);
        
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          
          // Apply brightness
          r = Math.min(255, Math.max(0, r * brightnessFactor));
          g = Math.min(255, Math.max(0, g * brightnessFactor));
          b = Math.min(255, Math.max(0, b * brightnessFactor));
          
          // Apply scan mode
          if (scanMode === 'gray') {
            // Calculate grayscale value
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            // Brighten the grayscale image by 20% for better visibility
            const brightenedGray = Math.min(255, gray * 1.2);
            data[i] = brightenedGray;
            data[i + 1] = brightenedGray;
            data[i + 2] = brightenedGray;
          } else if (scanMode === 'black-white') {
            // Fresh approach: Clean black and white conversion
            // Step 1: Convert to grayscale using standard luminance formula
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            
            // Step 2: Apply gentle brightness boost only to very dark areas
            // This helps preserve dark text without affecting the rest
            let processedGray = gray;
            if (gray < 35) {
              // Light boost for very dark pixels to make text visible
              processedGray = Math.min(255, gray * 1.12);
            }
            
            // Step 3: Calculate adaptive threshold using Otsu-like method
            // Base threshold on image statistics for optimal separation
            let threshold = 127;
            
            // Adjust threshold based on overall image brightness
            // More conservative thresholds to preserve all content
            if (avgBrightness < 50) {
              threshold = 105; // Very dark images - lower threshold
            } else if (avgBrightness < 80) {
              threshold = 115; // Dark images
            } else if (avgBrightness < 110) {
              threshold = 125; // Medium-dark images
            } else if (avgBrightness < 140) {
              threshold = 135; // Normal images
            } else if (avgBrightness < 170) {
              threshold = 145; // Bright images
            } else {
              threshold = 160; // Very bright images
            }
            
            // Step 4: Clean binary conversion - sharp and crisp
            // Pure black or white based on threshold - no blurry transitions
            const bw = processedGray > threshold ? 255 : 0;
            
            data[i] = bw;
            data[i + 1] = bw;
            data[i + 2] = bw;
          } else if (scanMode === 'auto') {
            // Auto enhance: increase brightness significantly without blurring
            // Use direct pixel manipulation (no averaging or smoothing to avoid blur)
            
            // Calculate brightness adjustment based on average brightness
            // Increase brightness more aggressively
            let brightnessAdjust = 1.0;
            if (avgBrightness < 80) {
              brightnessAdjust = 1.6; // Significantly brighten very dark images
            } else if (avgBrightness < 120) {
              brightnessAdjust = 1.4; // Strongly brighten dim images
            } else if (avgBrightness < 160) {
              brightnessAdjust = 1.25; // Moderately brighten normal images
            } else if (avgBrightness > 220) {
              brightnessAdjust = 1.0; // No adjustment for very bright images
            } else {
              brightnessAdjust = 1.15; // Slightly brighten bright images
            }
            
            // Apply brightness adjustment directly to each channel
            // This is a simple multiplication - no blurring operations
            r = Math.min(255, Math.max(0, r * brightnessAdjust));
            g = Math.min(255, Math.max(0, g * brightnessAdjust));
            b = Math.min(255, Math.max(0, b * brightnessAdjust));
            
            // Light contrast enhancement - only for mid-tones to avoid blur
            // Use a gentle approach that doesn't mix pixels
            const currentGray = r * 0.299 + g * 0.587 + b * 0.114;
            const normalizedGray = currentGray / 255;
            
            // Only apply subtle contrast to mid-range values to preserve sharpness
            if (normalizedGray > 0.2 && normalizedGray < 0.8) {
              // Gentle contrast boost for mid-tones only
              const contrastBoost = 1.1; // Reduced from 1.2 to avoid artifacts
              const midPoint = 128;
              r = Math.min(255, Math.max(0, midPoint + (r - midPoint) * contrastBoost));
              g = Math.min(255, Math.max(0, midPoint + (g - midPoint) * contrastBoost));
              b = Math.min(255, Math.max(0, midPoint + (b - midPoint) * contrastBoost));
            }
            
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            } else {
            // Original mode - just apply brightness
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  const updateScanMode = async (cardId: string, side: 'front' | 'back', scanMode: ScanMode) => {
    const card = cardDesigns.find(c => c.id === cardId);
    if (!card) return;

    const imageSrc = side === 'front' ? card.frontImage : card.backImage;
    const currentSettings = side === 'front' ? card.frontSettings : card.backSettings;
    
    if (!imageSrc) return;

    const processed = await processImage(imageSrc, scanMode, currentSettings.brightness);
    
    setCardDesigns(prev => prev.map(c => 
      c.id === cardId 
        ? {
            ...c,
            [side === 'front' ? 'frontSettings' : 'backSettings']: {
              ...currentSettings,
              scanMode,
              processedImage: processed
            }
          }
        : c
    ));
  };

  const updateBrightness = async (cardId: string, side: 'front' | 'back', brightness: number) => {
    const card = cardDesigns.find(c => c.id === cardId);
    if (!card) return;

    const imageSrc = side === 'front' ? card.frontImage : card.backImage;
    const currentSettings = side === 'front' ? card.frontSettings : card.backSettings;
    
    if (!imageSrc) return;

    const processed = await processImage(imageSrc, currentSettings.scanMode, brightness);
    
    setCardDesigns(prev => prev.map(c => 
      c.id === cardId 
        ? {
            ...c,
            [side === 'front' ? 'frontSettings' : 'backSettings']: {
              ...currentSettings,
              brightness,
              processedImage: processed
            }
          }
        : c
    ));
  };

  const extractWithRotation = (cardId: string, side: 'front' | 'back') => {
    const card = cardDesigns.find(c => c.id === cardId);
    if (!card) return;

    const imageSrc = side === 'front' ? card.frontImage : card.backImage;
    if (!imageSrc) {
      toast({
        title: "No image",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    // Open crop dialog
    setCropImageSrc(imageSrc);
    setCropCardId(cardId);
    setCropSide(side);
    setCropDialogOpen(true);
  };

  const updateCopies = (cardId: string, copies: number) => {
    if (copies < 1) copies = 1;
    if (copies > 8) copies = 8;
    setCardDesigns(prev => prev.map(card => 
      card.id === cardId ? { ...card, copies } : card
    ));
  };

  const addCardDesign = () => {
    if (cardDesigns.length >= 10) {
      toast({
        title: "Limit reached",
        description: "Maximum 10 card designs allowed.",
        variant: "destructive",
      });
      return;
    }
    setCardDesigns(prev => [...prev, {
      id: Date.now().toString(),
      frontImage: null,
      backImage: null,
      frontSettings: { ...defaultSettings },
      backSettings: { ...defaultSettings },
      copies: 1
    }]);
  };

  const removeCardDesign = (cardId: string) => {
    if (cardDesigns.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "At least one card design is required.",
        variant: "destructive",
      });
      return;
    }
    setCardDesigns(prev => prev.filter(card => card.id !== cardId));
  };

  const handlePrint = async () => {
    const hasImages = cardDesigns.some(card => card.frontImage || card.backImage);
    if (!hasImages) {
      toast({
        title: "No images",
        description: "Please upload at least one image before printing.",
        variant: "destructive",
      });
      return;
    }

    // Set flag to indicate printing is in progress - this prevents navigation to dashboard
    localStorage.setItem('idCardPrintingInProgress', 'true');
    localStorage.setItem('idCardView', 'print');
    localStorage.setItem('selectedApp', 'id-card-print');

    // Check ID Card credits before allowing print
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const canPrint = await idCardCreditsService.canPrintIDCard(user.id);
        if (!canPrint) {
          const credits = await idCardCreditsService.getCredits(user.id);
          alert(`You have no ID Card printing credits remaining (${credits} credits). To get more ID Card Credits Contact Administrator : 0315-3338612`);
          return;
        }
      }
    } catch (creditError) {
      console.error('Error checking ID Card credits:', creditError);
      // Continue with print if credit check fails (for backward compatibility)
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print blocked",
        description: "Please allow popups to print.",
        variant: "destructive",
      });
      return;
    }

    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ID Card Print</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            background: white;
          }
          .page {
            width: 210mm;
            height: 297mm;
            page-break-after: always;
            position: relative;
            padding: 0;
            margin: 0;
          }
          .page-column {
            width: 88.9mm;
            display: flex;
            flex-direction: column;
            gap: 5mm;
            align-items: flex-start;
            flex-shrink: 0;
            position: absolute;
            top: 10mm;
          }
          .page-column.left {
            left: 10mm;
          }
          .page-column.right {
            right: 10mm;
          }
          .id-card {
            width: 88.9mm;
            height: 55.88mm;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: white;
            flex-shrink: 0;
            margin: 0;
            padding: 0;
          }
          .id-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .loading {
            display: none;
          }
          @media print {
            .page {
              margin: 0;
              padding: 0;
            }
            .id-card {
              border: none;
              outline: none;
            }
          }
        </style>
      </head>
      <body>
    `;

    // Collect all front and back cards with their positions (use processed images if available)
    const allFrontCards: Array<{ image: string; cardId: string }> = [];
    const allBackCards: Array<{ image: string; cardId: string }> = [];
    
    cardDesigns.forEach(card => {
      if (card.frontImage) {
        const frontImage = card.frontSettings.processedImage || card.frontImage;
        for (let i = 0; i < card.copies; i++) {
          allFrontCards.push({ image: frontImage, cardId: card.id });
        }
      }
      if (card.backImage) {
        const backImage = card.backSettings.processedImage || card.backImage;
        for (let i = 0; i < card.copies; i++) {
          allBackCards.push({ image: backImage, cardId: card.id });
        }
      }
    });

    // Calculate number of pages needed (8 cards per page: 2 columns x 4 rows)
    const cardsPerPage = 8;
    const maxPages = Math.max(
      Math.ceil(allFrontCards.length / cardsPerPage),
      Math.ceil(allBackCards.length / cardsPerPage)
    );

    // Create pages: Front cards in 2-column grid, Back cards mirrored for double-sided printing
    for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
      // Front page - 2 columns: left, right, left, right pattern
      printContent += '<div class="page">';
      const frontStart = pageIndex * cardsPerPage;
      const frontEnd = frontStart + cardsPerPage;
      
      // Initialize columns
      const leftColumnCards: string[] = [];
      const rightColumnCards: string[] = [];
      
      // Distribute front cards: even index = left, odd index = right
      for (let i = frontStart; i < frontEnd && i < allFrontCards.length; i++) {
        const cardHtml = `
          <div class="id-card">
            <img src="${allFrontCards[i].image}" alt="Front" />
            </div>
          `;
        const positionInPage = i - frontStart;
        if (positionInPage % 2 === 0) {
          leftColumnCards.push(cardHtml);
        } else {
          rightColumnCards.push(cardHtml);
        }
      }
      
      // Add left column
      printContent += '<div class="page-column left">';
      // eslint-disable-next-line no-loop-func
      leftColumnCards.forEach(card => { printContent += card; });
      printContent += '</div>';
      
      // Add right column
      printContent += '<div class="page-column right">';
      // eslint-disable-next-line no-loop-func
      rightColumnCards.forEach(card => { printContent += card; });
      printContent += '</div>';
      printContent += '</div>';
      
      // Back page - 2 columns: right, left, right, left pattern (mirrored)
      printContent += '<div class="page">';
      const backStart = pageIndex * cardsPerPage;
      const backEnd = backStart + cardsPerPage;
      
      // Initialize columns for back
      const backLeftColumnCards: string[] = [];
      const backRightColumnCards: string[] = [];
      
      // Distribute back cards: even index = right (mirrored), odd index = left (mirrored)
      for (let i = backStart; i < backEnd && i < allBackCards.length; i++) {
        const cardHtml = `
          <div class="id-card">
            <img src="${allBackCards[i].image}" alt="Back" />
              </div>
            `;
        const positionInPage = i - backStart;
        if (positionInPage % 2 === 0) {
          backRightColumnCards.push(cardHtml); // Even positions go to right (mirrored)
        } else {
          backLeftColumnCards.push(cardHtml); // Odd positions go to left (mirrored)
        }
      }
      
      // Add left column (for odd positions) - positioned at left edge
      printContent += '<div class="page-column left">';
      // eslint-disable-next-line no-loop-func
      backLeftColumnCards.forEach(card => { printContent += card; });
      printContent += '</div>';
      
      // Add right column (for even positions) - positioned at right edge for alignment
      printContent += '<div class="page-column right">';
      // eslint-disable-next-line no-loop-func
      backRightColumnCards.forEach(card => { printContent += card; });
      printContent += '</div>';
      printContent += '</div>';
    }

    printContent += `
        <script>
          (function() {
            let imagesLoaded = 0;
            const totalImages = document.querySelectorAll('img').length;
            
            function checkAllLoaded() {
              imagesLoaded++;
              if (imagesLoaded >= totalImages) {
                // All images loaded, trigger print
                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 100);
              }
            }
            
            // Wait for all images to load
            const images = document.querySelectorAll('img');
            if (images.length === 0) {
              setTimeout(() => window.print(), 100);
            } else {
              images.forEach(img => {
                if (img.complete) {
                  checkAllLoaded();
                } else {
                  img.onload = checkAllLoaded;
                  img.onerror = checkAllLoaded; // Count errors too to avoid hanging
                }
              });
            }
            
            // Close window after print
            window.addEventListener('afterprint', function() {
              setTimeout(() => {
                if (!window.closed) {
                  window.close();
                }
              }, 100);
            });
            
            // Fallback: close after timeout
            setTimeout(() => {
              if (!window.closed) {
                window.close();
              }
            }, 30000); // 30 second timeout
          })();
        </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Decrement ID Card credits after successful print
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const newCredits = await idCardCreditsService.decrementCredits(user.id);
        if (newCredits >= 0) {
          console.log(`ID Card credits decremented. Remaining credits: ${newCredits}`);
          // Dispatch event to update credits display (if needed in future)
          window.dispatchEvent(new CustomEvent('idCardCreditsUpdated'));
          // Optionally show remaining credits to user
          if (newCredits === 0) {
            alert(`ID Cards printed successfully! You have no credits remaining. To get more ID Card Credits Contact Administrator : 0315-3338612`);
          } else {
            console.log(`Remaining ID Card credits: ${newCredits}`);
          }
        }
      }
    } catch (creditError) {
      console.error('Error decrementing ID Card credits:', creditError);
      // Don't block the print if credit decrement fails
    }

    // After printing, ensure we stay on the print page (not navigate to dashboard)
    // The card designs are already preserved in localStorage via useEffect
    // Just ensure idCardView stays as 'print'
    localStorage.setItem('idCardView', 'print');
    localStorage.setItem('selectedApp', 'id-card-print');
    
    // Keep the printing flag for a bit longer to prevent any navigation
    setTimeout(() => {
      localStorage.setItem('idCardPrintingInProgress', 'false');
    }, 2000); // Keep flag for 2 seconds after print
    
    // Also listen for when print window closes to ensure we stay on print page
    const handlePrintWindowClose = () => {
      localStorage.setItem('idCardView', 'print');
      localStorage.setItem('selectedApp', 'id-card-print');
      // Force a small delay to ensure localStorage is written
      setTimeout(() => {
        // Trigger a custom event to notify App.js to stay on print page
        window.dispatchEvent(new CustomEvent('idCardPrintCompleted', {
          detail: { stayOnPrintPage: true }
        }));
      }, 100);
    };
    
    // Listen for when main window regains focus (print window closed)
    const handleWindowFocus = () => {
      // Only handle if we just printed
      if (localStorage.getItem('idCardPrintingInProgress') === 'true') {
        handlePrintWindowClose();
      }
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    // Also set up a one-time listener for afterprint event on the main window
    // (though this might not fire if print window is separate)
    const handleAfterPrint = () => {
      handlePrintWindowClose();
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    
    window.addEventListener('afterprint', handleAfterPrint);
    
    // Cleanup after a delay
    setTimeout(() => {
      window.removeEventListener('focus', handleWindowFocus);
      localStorage.setItem('idCardPrintingInProgress', 'false');
    }, 5000); // Remove listener after 5 seconds
  };

  const totalCards = cardDesigns.reduce((sum, design) => sum + design.copies, 0);

  const ImageUploadArea = ({ 
    image, 
    processedImage,
    side, 
    cardId, 
    settings,
    onDrop, 
    onRemove,
    onScanModeChange,
    onBrightnessChange,
    onExtract
  }: { 
    image: string | null;
    processedImage: string | null;
    side: 'front' | 'back'; 
    cardId: string;
    settings: ImageSettings;
    onDrop: (e: React.DragEvent) => void;
    onRemove: () => void;
    onScanModeChange: (mode: ScanMode) => void;
    onBrightnessChange: (brightness: number) => void;
    onExtract: () => void;
  }) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const sliderRef = React.useRef<HTMLInputElement | null>(null);
    const [sliderValue, setSliderValue] = React.useState(settings.brightness);
    const [isDragging, setIsDragging] = React.useState(false);
    
    // Update local slider value when settings change externally (but not while dragging)
    React.useEffect(() => {
      if (!isDragging) {
        setSliderValue(settings.brightness);
      }
    }, [settings.brightness, isDragging]);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const displayImage = processedImage || image;

    return (
      <div className="image-section">
        <div
          className="image-upload-area"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleClick}
        >
          {displayImage ? (
            <>
              <img
                src={displayImage} 
                alt={`${side} side`}
                className="uploaded-image"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center center',
                  boxSizing: 'border-box',
                  margin: 'auto'
                }}
                onError={(e) => {
                  console.error('Image load error:', e);
                  toast({
                    title: "Image error",
                    description: "Failed to load image. Please try uploading again.",
                    variant: "destructive",
                  });
                }}
                onLoad={() => {
                  console.log('Image loaded successfully');
                }}
              />
              <Button
                variant="destructive"
                size="sm"
                className="remove-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="icon" />
              </Button>
            </>
          ) : (
            <div className="upload-placeholder">
              <Upload className="upload-icon" />
              <p className="upload-text">{side} side</p>
              <p className="upload-hint">Drag & drop or click</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={(e) => handleFileInput(e, cardId, side)}
            style={{ display: 'none' }}
          />
        </div>
        
        {displayImage && (
          <div className="image-controls">
            <div className="control-label">{side === 'front' ? 'Front' : 'Back'} Image</div>
            
            <div className="scan-mode-control">
              <span className="control-label-small">Scan Mode</span>
              <ToggleGroup 
                type="single" 
                value={settings.scanMode}
                onValueChange={(value) => {
                  if (value) onScanModeChange(value as ScanMode);
                }}
                className="scan-mode-buttons"
              >
                <ToggleGroupItem value="original" aria-label="Original">Original</ToggleGroupItem>
                <ToggleGroupItem value="auto" aria-label="Auto">Auto</ToggleGroupItem>
                <ToggleGroupItem value="gray" aria-label="Gray">Gray</ToggleGroupItem>
                <ToggleGroupItem value="black-white" aria-label="Black & White">Black & White</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="brightness-control">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <span className="control-label-small">Brightness</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#666', minWidth: '30px', textAlign: 'right' }}>
                  {isDragging ? Math.round(sliderValue) : settings.brightness}
                </span>
              </div>
              <input
                ref={sliderRef}
                type="range"
                min={-50}
                max={50}
                step="any"
                value={sliderValue}
                onMouseDown={() => {
                  setIsDragging(true);
                }}
                onTouchStart={() => {
                  setIsDragging(true);
                }}
                onInput={(e) => {
                  const slider = e.target as HTMLInputElement;
                  const newValue = parseFloat(slider.value);
                  // Update local state for smooth dragging (no parent update during drag)
                  setSliderValue(newValue);
                  // Update CSS variable for progress visualization
                  const min = parseFloat(slider.min);
                  const max = parseFloat(slider.max);
                  const percent = ((newValue - min) / (max - min)) * 100;
                  slider.style.setProperty('--slider-progress', `${percent}%`);
                }}
                onChange={(e) => {
                  // Fallback for browsers that don't support onInput
                  const slider = e.target as HTMLInputElement;
                  const newValue = parseFloat(slider.value);
                  setSliderValue(newValue);
                  // Update CSS variable
                  const min = parseFloat(slider.min);
                  const max = parseFloat(slider.max);
                  const percent = ((newValue - min) / (max - min)) * 100;
                  slider.style.setProperty('--slider-progress', `${percent}%`);
                }}
                onMouseUp={(e) => {
                  const slider = e.target as HTMLInputElement;
                  const newValue = parseFloat(slider.value);
                  setIsDragging(false);
                  // Update brightness value only when drag ends
                  onBrightnessChange(Math.round(newValue));
                }}
                onTouchEnd={(e) => {
                  const slider = e.target as HTMLInputElement;
                  const newValue = parseFloat(slider.value);
                  setIsDragging(false);
                  // Update brightness value only when drag ends
                  onBrightnessChange(Math.round(newValue));
                }}
                onMouseLeave={(e) => {
                  // Handle case where mouse leaves while dragging
                  if (isDragging) {
                    const slider = e.target as HTMLInputElement;
                    const newValue = parseFloat(slider.value);
                    setIsDragging(false);
                    onBrightnessChange(Math.round(newValue));
                  }
                }}
                className="brightness-slider-input"
                style={{
                  ['--slider-progress' as any]: `${((sliderValue - (-50)) / (50 - (-50))) * 100}%`
                }}
              />
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                onExtract();
              }}
              variant="outline"
              size="sm"
              className="extract-button"
            >
              <RotateCw className="icon" />
              Extract ID Card with Rotation
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="id-card-printer-container">
      <div className="id-card-printer-content">
        {/* Header */}
        <div className="header-section">
          <div className="header-card">
            <div className="header-icon">🪪</div>
            <h1 className="header-title">ID Card Printer</h1>
          </div>
          <p className="header-description">
            Create multiple card designs and print them perfectly aligned on A4 pages. 
            Supports up to 8 cards per page with double-sided printing.
          </p>
        </div>

        {/* Card Designs */}
        <div className="card-designs-section">
          {cardDesigns.map((card, index) => (
            <Card key={card.id} className="card-design-item">
              <div className="card-design-header">
                <h3 className="card-design-title">Card Design {index + 1}</h3>
                {cardDesigns.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCardDesign(card.id)}
                    className="remove-card-button"
                  >
                    <X className="icon" />
                  </Button>
                )}
              </div>
              
              <div className="card-images-container">
                <ImageUploadArea
                      image={card.frontImage}
                  processedImage={card.frontSettings.processedImage}
                  side="front"
                  cardId={card.id}
                  settings={card.frontSettings}
                      onDrop={(e) => handleDrop(e, card.id, 'front')}
                      onRemove={() => removeImage(card.id, 'front')}
                  onScanModeChange={(mode) => updateScanMode(card.id, 'front', mode)}
                  onBrightnessChange={(brightness) => updateBrightness(card.id, 'front', brightness)}
                  onExtract={() => extractWithRotation(card.id, 'front')}
                />

                <ImageUploadArea
                      image={card.backImage}
                  processedImage={card.backSettings.processedImage}
                  side="back"
                  cardId={card.id}
                  settings={card.backSettings}
                      onDrop={(e) => handleDrop(e, card.id, 'back')}
                      onRemove={() => removeImage(card.id, 'back')}
                  onScanModeChange={(mode) => updateScanMode(card.id, 'back', mode)}
                  onBrightnessChange={(brightness) => updateBrightness(card.id, 'back', brightness)}
                  onExtract={() => extractWithRotation(card.id, 'back')}
                />

                <div className="copies-control">
                  <label className="copies-label">Copies</label>
                  <div className="copies-input-group">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCopies(card.id, card.copies - 1)}
                        disabled={card.copies <= 1}
                      className="copies-button"
                      >
                      <Minus className="icon" />
                      </Button>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={card.copies}
                        onChange={(e) => updateCopies(card.id, parseInt(e.target.value) || 1)}
                      className="copies-input"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCopies(card.id, card.copies + 1)}
                        disabled={card.copies >= 8}
                      className="copies-button"
                      >
                      <Plus className="icon" />
                      </Button>
                    </div>
                  <span className="copies-hint">Max 8</span>
                  </div>
                </div>
            </Card>
          ))}
                          </div>

        {/* Add Card Design Button */}
        <div className="add-card-section">
                                <Button
            onClick={addCardDesign}
            variant="outline"
            className="add-card-button"
          >
            <Plus className="icon" />
            Add Card Design
                                </Button>
        </div>

        {/* Print Button */}
        <div className="print-section">
                                <Button
            onClick={handlePrint}
            disabled={!cardDesigns.some(card => card.frontImage || card.backImage)}
            className="print-button"
          >
            <Printer className="icon" />
            Print All Cards ({totalCards} total)
                                </Button>
                            </div>

        {/* Instructions */}
        <Card className="instructions-card">
          <div className="instructions-content">
            <h3 className="instructions-title">Printing Instructions</h3>
            <div className="instructions-grid">
              <div className="instruction-group">
                <h4 className="instruction-subtitle">For Perfect Alignment:</h4>
                <ul className="instruction-list">
                  <li>Use A4 paper size</li>
                  <li>Enable double-sided printing</li>
                  <li>Select "Flip on long edge" option</li>
                  <li>Use highest print quality</li>
                </ul>
                              </div>
              <div className="instruction-group">
                <h4 className="instruction-subtitle">Multiple Card Designs:</h4>
                <ul className="instruction-list">
                  <li>Front cards printed on separate pages from back cards</li>
                  <li>Back cards positioned slightly down for better alignment</li>
                  <li>Up to 8 total cards per A4 page (2×4 grid)</li>
                  <li>Multiple designs with different copy counts supported</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
                            </div>

      {/* Crop Dialog */}
      <CropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={cropImageSrc}
        onCrop={(croppedImage) => {
          if (cropCardId && cropSide) {
            const card = cardDesigns.find(c => c.id === cropCardId);
            if (card) {
              const currentSettings = cropSide === 'front' ? card.frontSettings : card.backSettings;
                                   setCardDesigns(prev => prev.map(c => 
                c.id === cropCardId 
                  ? {
                      ...c,
                      [cropSide === 'front' ? 'frontImage' : 'backImage']: croppedImage,
                      [cropSide === 'front' ? 'frontSettings' : 'backSettings']: {
                        ...currentSettings,
                        processedImage: croppedImage
                      }
                    }
                                       : c
                                   ));
                                   toast({
                title: "Success",
                description: "ID card cropped successfully.",
                                   });
                                 }
                               }
          setCropDialogOpen(false);
        }}
      />
                        </div>
  );
};

// Crop Dialog Component
const CropDialog = ({
  open,
  onOpenChange,
  imageSrc,
  onCrop
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCrop: (croppedImage: string) => void;
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number; angle: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [rotationCenter, setRotationCenter] = useState<{ x: number; y: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hoveredCorner, setHoveredCorner] = useState<string | null>(null);

  // ID Card aspect ratio: 3.5" x 2.2" = 1.59:1
  const ID_CARD_ASPECT_RATIO = 3.5 / 2.2;

  const initializeCropBox = useCallback(() => {
    if (!imageRef.current || !containerRef.current || !imageSrc) return;

    const container = imageRef.current;
    const img = container.querySelector('img');
    if (!img) return;
    
    // Wait for image to load
    if (img.complete) {
      const cropContainerRect = containerRef.current.getBoundingClientRect();
      const imageContainerRect = container.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      
      // Image is centered in its container, so get its center position
      const imageCenterX = imageContainerRect.left + imageContainerRect.width / 2;
      const imageCenterY = imageContainerRect.top + imageContainerRect.height / 2;
      
      // Calculate crop box size based on image display size
      const maxWidth = Math.min(imgRect.width * 0.8, cropContainerRect.width - 100);
      const maxHeight = maxWidth / ID_CARD_ASPECT_RATIO;
      
      // Position crop box centered on the image
      // Convert from screen coordinates to container-relative coordinates
      const cropBoxCenterX = imageCenterX - cropContainerRect.left;
      const cropBoxCenterY = imageCenterY - cropContainerRect.top;
      
      const x = cropBoxCenterX - maxWidth / 2;
      const y = cropBoxCenterY - maxHeight / 2;
      
      setCropBox({
        x,
        y,
        width: maxWidth,
        height: maxHeight,
        angle: 0
      });
    } else {
      img.onload = initializeCropBox;
    }
  }, [imageSrc, ID_CARD_ASPECT_RATIO]);

  React.useEffect(() => {
    if (open && imageSrc) {
      setTimeout(initializeCropBox, 100);
    }
  }, [open, imageSrc, initializeCropBox]);

  // Add global mouse up listener to ensure rotation stops when mouse is released anywhere
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isRotating || isDragging || isResizing) {
        handleMouseUp();
      }
    };

    if (open) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [open, isRotating, isDragging, isResizing]);

  const getHandlePosition = (handle: string, cropBox: { x: number; y: number; width: number; height: number }) => {
    const cx = cropBox.x + cropBox.width / 2;
    const cy = cropBox.y + cropBox.height / 2;
    
    switch (handle) {
      case 'nw': return { x: cropBox.x, y: cropBox.y };
      case 'n': return { x: cx, y: cropBox.y };
      case 'ne': return { x: cropBox.x + cropBox.width, y: cropBox.y };
      case 'e': return { x: cropBox.x + cropBox.width, y: cy };
      case 'se': return { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height };
      case 's': return { x: cx, y: cropBox.y + cropBox.height };
      case 'sw': return { x: cropBox.x, y: cropBox.y + cropBox.height };
      case 'w': return { x: cropBox.x, y: cy };
      default: return { x: cx, y: cy };
    }
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    if (!cropBox || !containerRef.current || !imageRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const containerRect = imageRef.current.getBoundingClientRect();
    // Get coordinates relative to container (crop box is in container space, not rotated)
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    // Check if clicking on a handle
    if (handle) {
      if (['nw', 'ne', 'se', 'sw'].includes(handle)) {
        // Check if clicking near the rotation area (outside the handle)
        const handlePos = getHandlePosition(handle, cropBox);
        const distance = Math.sqrt(Math.pow(x - handlePos.x, 2) + Math.pow(y - handlePos.y, 2));
        
        // If clicking far from handle (rotation area), rotate; otherwise resize
        if (distance > 15 && distance < 40) {
          // Rotation mode
          setIsRotating(true);
          setRotationCenter({ x: cropBox.x + cropBox.width / 2, y: cropBox.y + cropBox.height / 2 });
          setDragStart({ x, y });
          return;
        } else {
          // Resize mode (clicking directly on corner handle)
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStart({ x, y });
          return;
        }
      } else if (['n', 's', 'e', 'w'].includes(handle)) {
        // Side handles: resize freely (no aspect ratio constraint)
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart({ x, y });
        return;
      }
    }
    
    // Check if click is inside crop box (relative to image) - for dragging
    if (
      x >= cropBox.x && x <= cropBox.x + cropBox.width &&
      y >= cropBox.y && y <= cropBox.y + cropBox.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropBox.x, y: y - cropBox.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cropBox || !containerRef.current || !imageRef.current) return;

    // Use the crop container (not the image container) for full working space
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cropContainerRect = containerRef.current.getBoundingClientRect();
    const imageContainerRect = imageRef.current.getBoundingClientRect();
    
    // Get coordinates relative to image container (where crop box is positioned)
    const x = e.clientX - imageContainerRect.left;
    const y = e.clientY - imageContainerRect.top;

    if (isRotating && dragStart && rotationCenter) {
      const angle1 = Math.atan2(dragStart.y - rotationCenter.y, dragStart.x - rotationCenter.x);
      const angle2 = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
      const deltaAngle = angle2 - angle1;
      setCropBox({
        ...cropBox,
        angle: cropBox.angle + deltaAngle
      });
      setDragStart({ x, y });
    } else if (isResizing && dragStart && resizeHandle) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      let newX = cropBox.x;
      let newY = cropBox.y;
      let newWidth = cropBox.width;
      let newHeight = cropBox.height;
      
      // Resize based on handle - free movement (no aspect ratio constraint)
      if (resizeHandle === 'n') {
        // Top side - move top edge up/down freely
        const newHeightValue = cropBox.height - deltaY;
        newHeight = Math.max(50, newHeightValue);
        newY = cropBox.y + cropBox.height - newHeight;
        // Don't change width for top/bottom handles
        newWidth = cropBox.width;
        newX = cropBox.x;
      } else if (resizeHandle === 's') {
        // Bottom side - move bottom edge up/down freely
        const newHeightValue = cropBox.height + deltaY;
        newHeight = Math.max(50, newHeightValue);
        // Don't change width for top/bottom handles
        newWidth = cropBox.width;
        newX = cropBox.x;
        newY = cropBox.y;
      } else if (resizeHandle === 'e') {
        // Right side - move right edge left/right freely
        const newWidthValue = cropBox.width + deltaX;
        newWidth = Math.max(50, newWidthValue);
        // Don't change height for left/right handles
        newHeight = cropBox.height;
        newX = cropBox.x;
        newY = cropBox.y;
      } else if (resizeHandle === 'w') {
        // Left side - move left edge left/right freely
        const newWidthValue = cropBox.width - deltaX;
        newWidth = Math.max(50, newWidthValue);
        newX = cropBox.x + cropBox.width - newWidth;
        // Don't change height for left/right handles
        newHeight = cropBox.height;
        newY = cropBox.y;
      } else if (resizeHandle === 'nw') {
        // Top-left corner - move both top and left edges
        newWidth = Math.max(50, cropBox.width - deltaX);
        newHeight = Math.max(50, cropBox.height - deltaY);
        newX = cropBox.x + cropBox.width - newWidth;
        newY = cropBox.y + cropBox.height - newHeight;
      } else if (resizeHandle === 'ne') {
        // Top-right corner - move both top and right edges
        newWidth = Math.max(50, cropBox.width + deltaX);
        newHeight = Math.max(50, cropBox.height - deltaY);
        newY = cropBox.y + cropBox.height - newHeight;
        newX = cropBox.x;
      } else if (resizeHandle === 'se') {
        // Bottom-right corner - move both bottom and right edges
        newWidth = Math.max(50, cropBox.width + deltaX);
        newHeight = Math.max(50, cropBox.height + deltaY);
        newX = cropBox.x;
        newY = cropBox.y;
      } else if (resizeHandle === 'sw') {
        // Bottom-left corner - move both bottom and left edges
        newWidth = Math.max(50, cropBox.width - deltaX);
        newHeight = Math.max(50, cropBox.height + deltaY);
        newX = cropBox.x + cropBox.width - newWidth;
        newY = cropBox.y;
      }
      
      // Use the full crop container bounds for maximum working space
      const cropContainerRect = containerRef.current?.getBoundingClientRect();
      const imageContainerRect = imageRef.current.getBoundingClientRect();
      
      if (!cropContainerRect) return;
      
      // Calculate the available space - use the crop container's full size
      // The crop box coordinates are relative to the image container, but we want to allow
      // it to extend to the full crop container bounds
      const offsetX = imageContainerRect.left - cropContainerRect.left;
      const offsetY = imageContainerRect.top - cropContainerRect.top;
      
      // Maximum bounds relative to image container coordinate system
      // Allow crop box to extend from -offset to (cropContainerSize - offset)
      const minX = -offsetX;
      const minY = -offsetY;
      const maxX = cropContainerRect.width - offsetX;
      const maxY = cropContainerRect.height - offsetY;
      
      // Allow free movement - only constrain if absolutely necessary to stay within bounds
      // For top/bottom handles, allow full vertical movement across entire working space
      if (resizeHandle === 'n' || resizeHandle === 's') {
        // Top/bottom handles - allow full vertical range across entire crop container
        // Only constrain if going completely out of bounds
        if (newY < minY) {
          // If top edge goes above crop container, adjust height
          newHeight = newHeight + (newY - minY);
          newY = minY;
        }
        if (newY + newHeight > maxY) {
          // If bottom edge goes below crop container, adjust height
          newHeight = maxY - newY;
        }
        // Ensure minimum height
        if (newHeight < 50) {
          if (resizeHandle === 'n') {
            newY = newY + newHeight - 50;
          }
          newHeight = 50;
        }
      } else if (resizeHandle === 'w' || resizeHandle === 'e') {
        // Left/right handles - allow full horizontal range across entire crop container
        // Only constrain if going completely out of bounds
        if (newX < minX) {
          // If left edge goes left of crop container, adjust width
          newWidth = newWidth + (newX - minX);
          newX = minX;
        }
        if (newX + newWidth > maxX) {
          // If right edge goes right of crop container, adjust width
          newWidth = maxX - newX;
        }
        // Ensure minimum width
        if (newWidth < 50) {
          if (resizeHandle === 'w') {
            newX = newX + newWidth - 50;
          }
          newWidth = 50;
        }
      } else {
        // Corner handles - constrain both dimensions
        if (newX < minX) {
          newWidth = newWidth + (newX - minX);
          newX = minX;
        }
        if (newY < minY) {
          newHeight = newHeight + (newY - minY);
          newY = minY;
        }
        if (newX + newWidth > maxX) {
          newWidth = maxX - newX;
        }
        if (newY + newHeight > maxY) {
          newHeight = maxY - newY;
        }
        
        // Ensure minimum size
        if (newWidth < 50) {
          if (resizeHandle === 'w' || resizeHandle === 'nw' || resizeHandle === 'sw') {
            newX = newX + newWidth - 50;
          }
          newWidth = 50;
        }
        if (newHeight < 50) {
          if (resizeHandle === 'n' || resizeHandle === 'nw' || resizeHandle === 'ne') {
            newY = newY + newHeight - 50;
          }
          newHeight = 50;
        }
      }
      
      setCropBox({
        ...cropBox,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
      setDragStart({ x, y });
    } else if (isDragging && dragStart) {
      let newX = x - dragStart.x;
      let newY = y - dragStart.y;
      
      // Constrain to image container bounds
      newX = Math.max(0, Math.min(newX, imageContainerRect.width - cropBox.width));
      newY = Math.max(0, Math.min(newY, imageContainerRect.height - cropBox.height));
      
      setCropBox({
        ...cropBox,
        x: newX,
        y: newY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setDragStart(null);
    setResizeHandle(null);
    setRotationCenter(null);
  };

  const handleCrop = () => {
    if (!cropBox || !imageRef.current || !imageSrc) return;

    const container = imageRef.current;
    const img = container.querySelector('img');
    if (!img) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get container and image dimensions
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Calculate image position within container (centered)
    const imgOffsetX = (containerRect.width - imgRect.width) / 2;
    const imgOffsetY = (containerRect.height - imgRect.height) / 2;
    
    // Convert crop box from container coordinates to image display coordinates
    const cropXInImage = cropBox.x - imgOffsetX;
    const cropYInImage = cropBox.y - imgOffsetY;

    // Handle rotation
    if (Math.abs(cropBox.angle) > 0.01) {
      // Step 1: Create rotated version of the full image
      const rotatedCanvas = document.createElement('canvas');
      const rotatedCtx = rotatedCanvas.getContext('2d');
      if (!rotatedCtx) return;

      // Calculate bounding box for rotated image
      const cos = Math.abs(Math.cos(cropBox.angle));
      const sin = Math.abs(Math.sin(cropBox.angle));
      const rotatedWidth = img.naturalWidth * cos + img.naturalHeight * sin;
      const rotatedHeight = img.naturalWidth * sin + img.naturalHeight * cos;

      rotatedCanvas.width = rotatedWidth;
      rotatedCanvas.height = rotatedHeight;

      // Draw rotated image centered
      rotatedCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
      rotatedCtx.rotate(cropBox.angle);
      rotatedCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      // Step 2: Map crop box from displayed (rotated) coordinates to rotated canvas
      // The displayed image shows the rotated version, so imgRect reflects the rotated bounding box
      // Calculate scale factors
      const scaleX = rotatedWidth / imgRect.width;
      const scaleY = rotatedHeight / imgRect.height;
      
      // Map crop box coordinates to rotated canvas space
      let cropX = cropXInImage * scaleX;
      let cropY = cropYInImage * scaleY;
      let cropW = cropBox.width * scaleX;
      let cropH = cropBox.height * scaleY;

      // Clamp to rotated canvas bounds
      cropX = Math.max(0, Math.min(cropX, rotatedWidth - cropW));
      cropY = Math.max(0, Math.min(cropY, rotatedHeight - cropH));
      cropW = Math.min(cropW, rotatedWidth - cropX);
      cropH = Math.min(cropH, rotatedHeight - cropY);

      // Step 3: Create output canvas with crop box display dimensions
      canvas.width = cropBox.width;
      canvas.height = cropBox.height;

      // Extract and draw the cropped region
      ctx.drawImage(
        rotatedCanvas,
        cropX, cropY, cropW, cropH,
        0, 0, cropBox.width, cropBox.height
      );
    } else {
      // No rotation - direct crop from original image
      const scaleX = img.naturalWidth / imgRect.width;
      const scaleY = img.naturalHeight / imgRect.height;
      
      const cropX = cropXInImage * scaleX;
      const cropY = cropYInImage * scaleY;
      const cropW = cropBox.width * scaleX;
      const cropH = cropBox.height * scaleY;
      
      canvas.width = cropBox.width;
      canvas.height = cropBox.height;

      ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        0, 0, cropBox.width, cropBox.height
      );
    }

    const croppedImage = canvas.toDataURL('image/png');
    onCrop(croppedImage);
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="crop-dialog-content" style={{ padding: 0 }}>
        <div
          ref={containerRef}
          className="crop-container"
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            handleMouseMove(e);
            // Check if mouse is near a corner handle for rotation indicator
            if (!cropBox || !imageRef.current || isDragging || isResizing || isRotating) return;
            
            const containerRect = imageRef.current.getBoundingClientRect();
            const x = e.clientX - containerRect.left;
            const y = e.clientY - containerRect.top;
            
            // Check distance to each corner
            const corners = ['nw', 'ne', 'se', 'sw'] as const;
            for (const corner of corners) {
              const handlePos = getHandlePosition(corner, cropBox);
              const distance = Math.sqrt(Math.pow(x - handlePos.x, 2) + Math.pow(y - handlePos.y, 2));
              if (distance > 15 && distance < 50) {
                setHoveredCorner(corner);
                return;
              }
            }
            setHoveredCorner(null);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseUp();
          }}
          onMouseLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseUp();
            setHoveredCorner(null);
          }}
        >
          <div
            ref={imageRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              transition: 'none'
            }}
          >
            <img
              src={imageSrc}
              alt="Crop"
              className="crop-image"
              style={{
                transform: cropBox ? `rotate(${cropBox.angle}rad)` : 'none',
                transformOrigin: 'center center',
                transition: 'none',
                maxWidth: '50%',
                maxHeight: '50%',
                width: 'auto',
                height: 'auto',
                display: 'block',
                margin: 'auto'
              }}
              onLoad={initializeCropBox}
            />
            {cropBox && (
              <div
                className="crop-box"
                style={{
                  position: 'absolute',
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`
                }}
              >
                {/* Corner resize handles */}
                <div 
                  className="crop-handle crop-handle-nw crop-handle-corner" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e, 'nw');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Resize"
                  style={{ pointerEvents: 'all' }}
                ></div>
                <div 
                  className="crop-handle crop-handle-ne crop-handle-corner" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e, 'ne');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Resize"
                  style={{ pointerEvents: 'all' }}
                ></div>
                <div 
                  className="crop-handle crop-handle-sw crop-handle-corner" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e, 'sw');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Resize"
                  style={{ pointerEvents: 'all' }}
                ></div>
                <div 
                  className="crop-handle crop-handle-se crop-handle-corner" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e, 'se');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Resize"
                  style={{ pointerEvents: 'all' }}
                ></div>
                
                {/* Side resize handles */}
                <div 
                  className="crop-handle crop-handle-n crop-handle-resize" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e, 'n');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Resize"
                  style={{ pointerEvents: 'all' }}
                ></div>
                <div 
                  className="crop-handle crop-handle-s crop-handle-resize" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e, 's');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Resize"
                  style={{ pointerEvents: 'all' }}
                ></div>
                <div 
                  className="crop-handle crop-handle-e crop-handle-resize" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e, 'e');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Resize"
                  style={{ pointerEvents: 'all' }}
                ></div>
                <div 
                  className="crop-handle crop-handle-w crop-handle-resize" 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseDown(e, 'w');
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Resize"
                  style={{ pointerEvents: 'all' }}
                ></div>
                
                {/* Rotation indicators (dotted circles exactly on corners - positioned relative to crop box) */}
                <div 
                  className="crop-rotate-indicator crop-rotate-nw"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRotating(true);
                    setRotationCenter({ x: cropBox.x + cropBox.width / 2, y: cropBox.y + cropBox.height / 2 });
                    const containerRect = imageRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setDragStart({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
                    }
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Rotate"
                >
                  <div className="rotate-circle"></div>
                              </div>
                <div 
                  className="crop-rotate-indicator crop-rotate-ne"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRotating(true);
                    setRotationCenter({ x: cropBox.x + cropBox.width / 2, y: cropBox.y + cropBox.height / 2 });
                    const containerRect = imageRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setDragStart({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
                    }
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Rotate"
                >
                  <div className="rotate-circle"></div>
                            </div>
                <div 
                  className="crop-rotate-indicator crop-rotate-se"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRotating(true);
                    setRotationCenter({ x: cropBox.x + cropBox.width / 2, y: cropBox.y + cropBox.height / 2 });
                    const containerRect = imageRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setDragStart({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
                    }
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Rotate"
                >
                  <div className="rotate-circle"></div>
                              </div>
                <div 
                  className="crop-rotate-indicator crop-rotate-sw"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRotating(true);
                    setRotationCenter({ x: cropBox.x + cropBox.width / 2, y: cropBox.y + cropBox.height / 2 });
                    const containerRect = imageRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setDragStart({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
                    }
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMouseUp();
                  }}
                  title="Rotate"
                >
                  <div className="rotate-circle"></div>
                        </div>
                  </div>
                )}
              </div>
        </div>
        <div className="crop-dialog-footer">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            style={{ 
              background: '#f5f5f5', 
              borderColor: '#ddd',
              color: '#333'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCrop}
            style={{ 
              background: '#3b82f6', 
              borderColor: '#3b82f6',
              color: 'white'
            }}
          >
            Crop ID Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IDCardPrinter;
