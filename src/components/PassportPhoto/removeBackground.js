import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { PASSPORT_HEIGHT_PX, PASSPORT_WIDTH_PX } from './passportPhotoUtils';

/**
 * Pure white + blue matched to user reference photo.
 * Sampled background ≈ RGB(0,160,224) / #00A0E0
 * Print target: C100 M0 Y0 K0 (screen hex from reference JPG)
 */
export const BG_COLORS = {
  white: {
    id: 'white',
    label: 'Pure white',
    hex: '#FFFFFF',
    cmyk: 'C0 M0 Y0 K0',
  },
  blue: {
    id: 'blue',
    label: 'Blue',
    hex: '#00A0E0',
    cmyk: 'C100 M0 Y0 K0',
  },
};

const canvasToJpegBlob = (canvas, quality = 0.93) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode JPEG'))),
      'image/jpeg',
      quality
    );
  });

const canvasToPngBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode PNG'))),
      'image/png'
    );
  });

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.crossOrigin = 'anonymous';
    img.src = src;
  });

/** Composite RGBA subject onto solid background → JPEG passport size */
export async function compositeOnBackground(cutoutSource, bgHex = '#FFFFFF') {
  let url = null;
  let cutout;
  if (typeof cutoutSource === 'string') {
    cutout = await loadImage(cutoutSource);
  } else {
    url = URL.createObjectURL(cutoutSource);
    cutout = await loadImage(url);
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = PASSPORT_WIDTH_PX;
    canvas.height = PASSPORT_HEIGHT_PX;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgHex || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(
      canvas.width / cutout.naturalWidth,
      canvas.height / cutout.naturalHeight
    );
    const dw = cutout.naturalWidth * scale;
    const dh = cutout.naturalHeight * scale;
    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;
    ctx.drawImage(cutout, dx, dy, dw, dh);

    const blob = await canvasToJpegBlob(canvas);
    return {
      blob,
      dataUrl: canvas.toDataURL('image/jpeg', 0.93),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
}

/**
 * Remove background. Returns solid composite + transparent cutout for eraser refine.
 */
export async function removePassportBackground(imageSource, bgHex = '#FFFFFF') {
  const cutoutBlob = await imglyRemoveBackground(imageSource, {
    output: {
      format: 'image/png',
      quality: 0.9,
    },
  });

  // Normalize cutout to passport size (RGBA) for the refine tool
  const cutoutUrl = URL.createObjectURL(cutoutBlob);
  try {
    const cutout = await loadImage(cutoutUrl);
    const layer = document.createElement('canvas');
    layer.width = PASSPORT_WIDTH_PX;
    layer.height = PASSPORT_HEIGHT_PX;
    const lctx = layer.getContext('2d');
    const scale = Math.max(
      layer.width / cutout.naturalWidth,
      layer.height / cutout.naturalHeight
    );
    const dw = cutout.naturalWidth * scale;
    const dh = cutout.naturalHeight * scale;
    const dx = (layer.width - dw) / 2;
    const dy = (layer.height - dh) / 2;
    lctx.clearRect(0, 0, layer.width, layer.height);
    lctx.drawImage(cutout, dx, dy, dw, dh);

    const cutoutPngBlob = await canvasToPngBlob(layer);
    const cutoutDataUrl = layer.toDataURL('image/png');

    const composed = await compositeOnBackground(cutoutDataUrl, bgHex);
    return {
      ...composed,
      cutoutBlob: cutoutPngBlob,
      cutoutDataUrl,
      engine: 'bg-removed',
    };
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
}
