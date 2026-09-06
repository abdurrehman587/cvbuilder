import { PASSPORT_HEIGHT_PX, PASSPORT_WIDTH_PX } from './passportPhotoUtils';

const canvasToJpegBlob = (canvas, quality = 0.93) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode JPEG'))),
      'image/jpeg',
      quality
    );
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for retouch'));
    if (typeof src === 'string') {
      img.src = src;
    } else {
      const url = URL.createObjectURL(src);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    }
  });

/** Separable box blur → returns Float32 RGB (length w*h*3) */
function boxBlurRgb(src, w, h, radius) {
  const r = Math.max(1, Math.floor(radius));
  const tmp = new Float32Array(w * h * 3);
  const out = new Float32Array(w * h * 3);
  const diam = r * 2 + 1;

  for (let y = 0; y < h; y += 1) {
    for (let c = 0; c < 3; c += 1) {
      let sum = 0;
      for (let x = -r; x <= r; x += 1) {
        const xx = Math.min(w - 1, Math.max(0, x));
        sum += src[(y * w + xx) * 4 + c];
      }
      for (let x = 0; x < w; x += 1) {
        tmp[(y * w + x) * 3 + c] = sum / diam;
        const add = Math.min(w - 1, x + r + 1);
        const rem = Math.max(0, x - r);
        sum += src[(y * w + add) * 4 + c] - src[(y * w + rem) * 4 + c];
      }
    }
  }

  for (let x = 0; x < w; x += 1) {
    for (let c = 0; c < 3; c += 1) {
      let sum = 0;
      for (let y = -r; y <= r; y += 1) {
        const yy = Math.min(h - 1, Math.max(0, y));
        sum += tmp[(yy * w + x) * 3 + c];
      }
      for (let y = 0; y < h; y += 1) {
        out[(y * w + x) * 3 + c] = sum / diam;
        const add = Math.min(h - 1, y + r + 1);
        const rem = Math.max(0, y - r);
        sum += tmp[(add * w + x) * 3 + c] - tmp[(rem * w + x) * 3 + c];
      }
    }
  }
  return out;
}

function faceMask(w, h) {
  const mask = new Float32Array(w * h);
  const cx = w * 0.5;
  const cy = h * 0.38;
  const rx = w * 0.34;
  const ry = h * 0.3;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = nx * nx + ny * ny;
      mask[y * w + x] = d >= 1.35 ? 0 : Math.max(0, 1 - d / 1.35);
    }
  }
  return mask;
}

function isLikelySkin(r, g, b) {
  return r > 60 && g > 40 && b > 20 && r > b && r >= g - 15 && r - b > 12;
}

/**
 * Finishing retouch for passport photos:
 * evening face colour + mild skin smooth + brightness lift.
 */
export async function retouchPassportPhoto(imageSource, options = {}) {
  const {
    brightness = 1.14,
    evenStrength = 0.58,
    smoothStrength = 0.42,
    blurRadius = 9,
  } = options;

  const img = await loadImage(imageSource);
  const canvas = document.createElement('canvas');
  canvas.width = PASSPORT_WIDTH_PX;
  canvas.height = PASSPORT_HEIGHT_PX;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = imageData.data;
  const mask = faceMask(w, h);
  const blurred = boxBlurRgb(src, w, h, blurRadius);

  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sn = 0;
  for (let i = 0, p = 0; i < src.length; i += 4, p += 1) {
    if (mask[p] < 0.25) continue;
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    if (!isLikelySkin(r, g, b)) continue;
    sr += r;
    sg += g;
    sb += b;
    sn += 1;
  }
  if (sn < 40) {
    sr = sg = sb = sn = 0;
    for (let i = 0, p = 0; i < src.length; i += 4, p += 1) {
      if (mask[p] < 0.35) continue;
      sr += src[i];
      sg += src[i + 1];
      sb += src[i + 2];
      sn += 1;
    }
  }
  const mr = sn ? sr / sn : 180;
  const mg = sn ? sg / sn : 140;
  const mb = sn ? sb / sn : 120;

  for (let i = 0, p = 0; i < src.length; i += 4, p += 1) {
    const m = mask[p];
    let r = src[i];
    let g = src[i + 1];
    let b = src[i + 2];

    const br = blurred[p * 3];
    const bg = blurred[p * 3 + 1];
    const bb = blurred[p * 3 + 2];

    const dr = r - br;
    const dg = g - bg;
    const db = b - bb;

    let er = br;
    let eg = bg;
    let eb = bb;
    if (m > 0.05 && isLikelySkin(r, g, b)) {
      const t = evenStrength * m;
      er = br * (1 - t) + mr * t;
      eg = bg * (1 - t) + mg * t;
      eb = bb * (1 - t) + mb * t;
    }

    const detailKeep = 1 - smoothStrength * m;
    r = er + dr * (0.5 + 0.5 * detailKeep);
    g = eg + dg * (0.5 + 0.5 * detailKeep);
    b = eb + db * (0.5 + 0.5 * detailKeep);

    const faceLift = 0.3 + 0.7 * m;
    const brt = 1 + (brightness - 1) * faceLift;
    const lift = (v) => {
      const n = Math.max(0, Math.min(1, v / 255));
      return Math.max(0, Math.min(255, Math.pow(n, 0.9) * brt * 255));
    };

    src[i] = lift(r);
    src[i + 1] = lift(g);
    src[i + 2] = lift(b);
  }

  ctx.putImageData(imageData, 0, 0);
  ctx.filter = 'contrast(1.03) saturate(1.02)';
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';

  const blob = await canvasToJpegBlob(canvas);
  return {
    blob,
    dataUrl: canvas.toDataURL('image/jpeg', 0.93),
    width: canvas.width,
    height: canvas.height,
    engine: 'retouch-finish',
  };
}
