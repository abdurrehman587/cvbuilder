const MAX_DIMENSION = 2400;

export const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });

const scaleToFit = (width, height, maxDim) => {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const toGrayscale = (imageData) => {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  return gray;
};

const boxBlur = (src, width, height, radius) => {
  const out = new Float32Array(src.length);
  const tmp = new Float32Array(src.length);
  const size = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++) {
      const clamped = Math.min(width - 1, Math.max(0, x));
      sum += src[y * width + clamped];
    }
    for (let x = 0; x < width; x++) {
      const left = Math.max(0, x - radius - 1);
      const right = Math.min(width - 1, x + radius);
      if (x > 0) sum += src[y * width + right] - src[y * width + left];
      tmp[y * width + x] = sum / size;
    }
  }

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) {
      const clamped = Math.min(height - 1, Math.max(0, y));
      sum += tmp[clamped * width + x];
    }
    for (let y = 0; y < height; y++) {
      const top = Math.max(0, y - radius - 1);
      const bottom = Math.min(height - 1, y + radius);
      if (y > 0) sum += tmp[bottom * width + x] - tmp[top * width + x];
      out[y * width + x] = sum / size;
    }
  }

  return out;
};

const buildIntegral = (src, width, height) => {
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 1; y <= height; y++) {
    let rowSum = 0;
    for (let x = 1; x <= width; x++) {
      rowSum += src[(y - 1) * width + (x - 1)];
      const above = integral[(y - 1) * (width + 1) + x];
      integral[y * (width + 1) + x] = rowSum + above;
    }
  }
  return integral;
};

const rectSum = (integral, width, x1, y1, x2, y2) => {
  const w = width + 1;
  const a = integral[y1 * w + x1];
  const b = integral[y1 * w + (x2 + 1)];
  const c = integral[(y2 + 1) * w + x1];
  const d = integral[(y2 + 1) * w + (x2 + 1)];
  return d - b - c + a;
};

const removeShadows = (gray, width, height) => {
  const background = boxBlur(gray, width, height, 35);
  const normalized = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const divisor = Math.max(background[i], 24);
    normalized[i] = Math.min(255, (gray[i] / divisor) * 255 * 1.06);
  }
  return normalized;
};

const contrastStretch = (src, lowPct = 0.02, highPct = 0.98) => {
  const sorted = Array.from(src).sort((a, b) => a - b);
  const n = sorted.length;
  const low = sorted[Math.floor(n * lowPct)] ?? 0;
  const high = sorted[Math.floor(n * highPct)] ?? 255;
  const range = Math.max(high - low, 1);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    out[i] = Math.max(0, Math.min(255, ((src[i] - low) / range) * 255));
  }
  return out;
};

const applyWhiteningCurve = (src, whitePoint = 228, gamma = 1.65) => {
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    const v = src[i];
    if (v >= whitePoint) {
      out[i] = 255;
      continue;
    }
    const t = v / whitePoint;
    out[i] = 255 * (1 - Math.pow(1 - t, gamma));
  }
  return out;
};

const softAdaptiveThreshold = (gray, width, height, blockSize, c, softness) => {
  const half = Math.floor(blockSize / 2);
  const integral = buildIntegral(gray, width, height);
  const out = new Float32Array(gray.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - half);
      const y1 = Math.max(0, y - half);
      const x2 = Math.min(width - 1, x + half);
      const y2 = Math.min(height - 1, y + half);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const mean = rectSum(integral, width, x1, y1, x2, y2) / count;
      const threshold = mean - c;
      const t = (gray[y * width + x] - threshold) / softness;
      const whiteAmount = 1 / (1 + Math.exp(-t));
      out[y * width + x] = whiteAmount * 255;
    }
  }

  return out;
};

const hardAdaptiveThreshold = (gray, width, height, blockSize, c) => {
  const half = Math.floor(blockSize / 2);
  const integral = buildIntegral(gray, width, height);
  const out = new Uint8Array(gray.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - half);
      const y1 = Math.max(0, y - half);
      const x2 = Math.min(width - 1, x + half);
      const y2 = Math.min(height - 1, y + half);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const mean = rectSum(integral, width, x1, y1, x2, y2) / count;
      out[y * width + x] = gray[y * width + x] < mean - c ? 0 : 255;
    }
  }

  return out;
};

const blendLayers = (a, b, weightB) => {
  const out = new Float32Array(a.length);
  const weightA = 1 - weightB;
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i] * weightA + b[i] * weightB;
  }
  return out;
};

const computeLocalContrast = (gray, width, height, radius) => {
  const blurred = boxBlur(gray, width, height, radius);
  const contrast = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    contrast[i] = Math.abs(gray[i] - blurred[i]);
  }
  return contrast;
};

const computeEdgeDensity = (localContrast, width, height, radius, threshold = 11) => {
  const mask = new Float32Array(localContrast.length);
  for (let i = 0; i < localContrast.length; i++) {
    mask[i] = localContrast[i] >= threshold ? 1 : 0;
  }
  return boxBlur(mask, width, height, radius);
};

const dilateMask = (mask, width, height, radius) => {
  const out = new Float32Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || nx < 0 || ny >= height || nx >= width) continue;
          maxVal = Math.max(maxVal, mask[ny * width + nx]);
        }
      }
      out[y * width + x] = maxVal;
    }
  }
  return out;
};

const findLargestComponentBox = (mask, width, height, options = {}) => {
  const {
    threshold = 0.42,
    minAreaRatio = 0.001,
    maxAreaRatio = 0.16,
    minAspect = 0.45,
    maxAspect = 2.6,
    rejectBorderTouchAboveRatio = 0.04,
  } = options;
  const total = width * height;
  const minArea = total * minAreaRatio;
  const maxArea = total * maxAreaRatio;
  const visited = new Uint8Array(total);
  const queue = [];
  let best = null;

  for (let start = 0; start < total; start++) {
    if (mask[start] < threshold || visited[start]) continue;

    queue.length = 0;
    queue.push(start);
    visited[start] = 1;

    let area = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (let qi = 0; qi < queue.length; qi++) {
      const idx = queue[qi];
      area += 1;
      const x = idx % width;
      const y = Math.floor(idx / width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      if (x > 0) {
        const neighbor = idx - 1;
        if (!visited[neighbor] && mask[neighbor] >= threshold) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
      if (x < width - 1) {
        const neighbor = idx + 1;
        if (!visited[neighbor] && mask[neighbor] >= threshold) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
      if (y > 0) {
        const neighbor = idx - width;
        if (!visited[neighbor] && mask[neighbor] >= threshold) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
      if (y < height - 1) {
        const neighbor = idx + width;
        if (!visited[neighbor] && mask[neighbor] >= threshold) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
    }

    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;
    const aspect = boxH / Math.max(boxW, 1);
    const touchesBorder =
      minX <= 2 ||
      minY <= 2 ||
      maxX >= width - 3 ||
      maxY >= height - 3;

    const isValid =
      area >= minArea &&
      area <= maxArea &&
      aspect >= minAspect &&
      aspect <= maxAspect &&
      !(touchesBorder && area > total * rejectBorderTouchAboveRatio);

    if (!isValid) continue;
    if (!best || area > best.area) {
      best = { minX, maxX, minY, maxY, area };
    }
  }

  return best;
};

const maskFromBox = (box, width, height, expandPx = 6) => {
  const mask = new Float32Array(width * height);
  if (!box) return mask;

  const x1 = Math.max(0, box.minX - expandPx);
  const y1 = Math.max(0, box.minY - expandPx);
  const x2 = Math.min(width - 1, box.maxX + expandPx);
  const y2 = Math.min(height - 1, box.maxY + expandPx);

  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      mask[y * width + x] = 1;
    }
  }

  return mask;
};

const isIdCardLikeDocument = (imageData, width, height) => {
  const { data } = imageData;
  const total = width * height;
  let greenPixels = 0;
  let skinOnGreen = 0;

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const onCardGreen = g > r + 12 && g > b + 8 && g > 85;
    if (onCardGreen) greenPixels += 1;
    const isSkinLike =
      r > 50 &&
      r >= g * 0.8 &&
      r >= b * 0.82 &&
      Math.abs(r - g) < 70;
    if (onCardGreen && isSkinLike) skinOnGreen += 1;
  }

  return greenPixels / total > 0.06 && skinOnGreen > 60;
};

const buildPortraitMask = (imageData, width, height) => {
  const { data } = imageData;
  const skin = new Float32Array(width * height);

  for (let i = 0; i < skin.length; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const onCardGreen = g > r + 4 && g > b + 2 && g > 75;
    const isSkinLike =
      r > 50 &&
      r >= g * 0.8 &&
      r >= b * 0.82 &&
      Math.abs(r - g) < 70;
    skin[i] = onCardGreen && isSkinLike ? 1 : 0;
  }

  const dilated = dilateMask(skin, width, height, 6);
  const box = findLargestComponentBox(dilated, width, height, {
    threshold: 0.5,
    minAreaRatio: 0.0008,
    maxAreaRatio: 0.12,
    minAspect: 0.5,
    maxAspect: 2.5,
    rejectBorderTouchAboveRatio: 0.035,
  });

  return maskFromBox(box, width, height, 10);
};

const buildThumbMask = (imageData, shadowFree, width, height) => {
  const { data } = imageData;
  const fineContrast = computeLocalContrast(shadowFree, width, height, 1);
  const localMean = boxBlur(shadowFree, width, height, 14);
  const raw = new Float32Array(width * height);

  for (let i = 0; i < raw.length; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const tone = shadowFree[i];
    const ridgeDepth = localMean[i] - shadowFree[i];
    const onCardGreen = g > r + 10 && g > b + 6 && g > 80;

    raw[i] =
      onCardGreen &&
      tone >= 90 &&
      tone <= 215 &&
      ridgeDepth >= 1.2 &&
      ridgeDepth <= 32 &&
      fineContrast[i] >= 1.3
        ? 1
        : 0;
  }

  const dilated = dilateMask(raw, width, height, 4);
  const box = findLargestComponentBox(dilated, width, height, {
    threshold: 0.5,
    minAreaRatio: 0.0002,
    maxAreaRatio: 0.02,
    minAspect: 0.25,
    maxAspect: 4,
    rejectBorderTouchAboveRatio: 0.12,
  });

  return maskFromBox(box, width, height, 8);
};

const enhanceThumbPixels = (imageData, thumbMask, shadowFree, width, height) => {
  const { data } = imageData;
  const localMean = boxBlur(shadowFree, width, height, 9);
  const out = new ImageData(width, height);
  out.data.set(data);

  for (let i = 0; i < thumbMask.length; i++) {
    if (thumbMask[i] < 0.5) continue;

    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const diff = shadowFree[i] - localMean[i];
    const targetGray = Math.max(0, Math.min(255, localMean[i] - diff * 2.6));
    const origGray = 0.299 * r + 0.587 * g + 0.114 * b;
    const delta = targetGray - origGray;

    out.data[idx] = Math.max(0, Math.min(255, Math.round(r + delta)));
    out.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g + delta)));
    out.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b + delta)));
  }

  return out;
};

const unsharpMask = (src, width, height, radius, amount) => {
  const blurred = boxBlur(src, width, height, radius);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    out[i] = Math.max(0, Math.min(255, src[i] + amount * (src[i] - blurred[i])));
  }
  return out;
};

const grayToImageData = (values, width, height) => {
  const output = new ImageData(width, height);
  for (let i = 0; i < values.length; i++) {
    const value = Math.max(0, Math.min(255, Math.round(values[i])));
    const idx = i * 4;
    output.data[idx] = value;
    output.data[idx + 1] = value;
    output.data[idx + 2] = value;
    output.data[idx + 3] = 255;
  }
  return output;
};

/**
 * Preserve gray tones for diagrams and light text on book/note pages.
 */
const enhanceGeneralDocument = (shadowFree, width, height) => {
  const stretched = contrastStretch(shadowFree, 0.006, 0.994);
  const sharp = unsharpMask(stretched, width, height, 1, 0.6);
  const localMean = boxBlur(sharp, width, height, 18);
  const out = new Float32Array(sharp.length);

  for (let i = 0; i < out.length; i++) {
    let value = localMean[i] + 1.4 * (sharp[i] - localMean[i]);
    if (value >= 240) {
      out[i] = 255;
    } else if (value <= 50) {
      out[i] = Math.max(0, value * 0.88);
    } else {
      out[i] = Math.max(0, Math.min(255, value));
    }
  }

  return out;
};

const thickenTextStrokes = (pixels, textMask, width, height, radius = 1) => {
  const out = new Float32Array(pixels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!textMask[idx] || pixels[idx] > 185) continue;
      let darkest = pixels[idx];
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || nx < 0 || ny >= height || nx >= width) continue;
          const neighbor = ny * width + nx;
          if (textMask[neighbor]) {
            darkest = Math.min(darkest, pixels[neighbor]);
          }
        }
      }
      out[idx] = darkest;
    }
  }
  return out;
};

/**
 * Binarize text and paper for ID cards. Photo regions are composited separately.
 */
const finalizeIdCardBackground = (softValues, stretched, width, height, detailMask) => {
  const hardBg = hardAdaptiveThreshold(stretched, width, height, 31, 10);
  const localContrast = computeLocalContrast(stretched, width, height, 5);
  const edgeDensity = computeEdgeDensity(localContrast, width, height, 14, 11);
  const out = new Float32Array(softValues.length);
  const textMask = new Uint8Array(softValues.length);

  for (let i = 0; i < softValues.length; i++) {
    const tone = stretched[i];
    const brightness = softValues[i];
    const darkness = 255 - brightness;
    const contrast = localContrast[i];
    const texture = edgeDensity[i];
    const detailWeight = detailMask[i];

    if (detailWeight >= 0.5) {
      out[i] = 255;
      continue;
    }

    const isStrongText =
      tone <= 78 ||
      darkness >= 64 ||
      (tone <= 108 && contrast >= 15) ||
      (darkness >= 36 && contrast >= 12 && texture < 0.14);

    const isPaper =
      (hardBg[i] === 255 && tone >= 132 && texture < 0.09) ||
      (tone >= 168 && texture < 0.07) ||
      (brightness >= 145 && texture < 0.08 && detailWeight < 0.5);

    if (isPaper) {
      out[i] = 255;
      continue;
    }

    if (isStrongText) {
      textMask[i] = 1;
      out[i] = Math.max(0, 255 - darkness * 1.12);
      continue;
    }

    if (brightness >= 128 && texture < 0.1) {
      out[i] = 255;
      continue;
    }

    if (darkness >= 30 && contrast >= 10) {
      textMask[i] = 1;
      out[i] = Math.max(0, 255 - darkness * 1.18);
      continue;
    }

    out[i] = brightness >= 118 ? 255 : Math.max(0, 255 - darkness * 1.05);
  }

  return thickenTextStrokes(out, textMask, width, height, 1);
};

const compositeDocument = (
  imageData,
  thumbPixels,
  docGray,
  portraitMask,
  thumbMask,
  textMask,
  width,
  height
) => {
  const output = new ImageData(width, height);
  const { data: src } = imageData;
  const { data: thumbData } = thumbPixels;
  const { data } = output;

  for (let i = 0; i < docGray.length; i++) {
    const idx = i * 4;

    if (portraitMask[i] >= 0.5) {
      data[idx] = src[idx];
      data[idx + 1] = src[idx + 1];
      data[idx + 2] = src[idx + 2];
      data[idx + 3] = 255;
      continue;
    }

    if (thumbMask[i] >= 0.5) {
      data[idx] = thumbData[idx];
      data[idx + 1] = thumbData[idx + 1];
      data[idx + 2] = thumbData[idx + 2];
      data[idx + 3] = 255;
      continue;
    }

    const value = Math.max(0, Math.min(255, Math.round(docGray[i])));
    data[idx] = value;
    data[idx + 1] = value;
    data[idx + 2] = value;
    data[idx + 3] = 255;
  }

  return output;
};


const processIdCardDocument = (imageData, shadowFree, width, height) => {
  const stretched = contrastStretch(shadowFree, 0.015, 0.985);
  const localContrast = computeLocalContrast(stretched, width, height, 5);
  const edgeDensity = computeEdgeDensity(localContrast, width, height, 14, 11);

  const portraitMask = buildPortraitMask(imageData, width, height);
  const thumbMask = buildThumbMask(imageData, shadowFree, width, height);
  const detailMask = new Float32Array(width * height);
  for (let i = 0; i < detailMask.length; i++) {
    detailMask[i] = Math.max(portraitMask[i], thumbMask[i]);
  }
  const thumbPixels = enhanceThumbPixels(imageData, thumbMask, shadowFree, width, height);

  const whitened = applyWhiteningCurve(stretched, 232, 1.55);
  const softLocal = softAdaptiveThreshold(stretched, width, height, 41, 4, 16);
  const softInk = blendLayers(whitened, softLocal, 0.35);

  const docGray = finalizeIdCardBackground(softInk, stretched, width, height, detailMask);

  const textMask = new Uint8Array(shadowFree.length);
  for (let i = 0; i < shadowFree.length; i++) {
    if (detailMask[i] >= 0.5) continue;
    const tone = stretched[i];
    const brightness = softInk[i];
    const darkness = 255 - brightness;
    const contrast = localContrast[i];
    const texture = edgeDensity[i];
    const isStrongText =
      tone <= 78 ||
      darkness >= 64 ||
      (tone <= 108 && contrast >= 15) ||
      (darkness >= 36 && contrast >= 12 && texture < 0.14);
    if (isStrongText || (darkness >= 30 && contrast >= 10)) {
      textMask[i] = 1;
    }
  }

  return compositeDocument(
    imageData,
    thumbPixels,
    docGray,
    portraitMask,
    thumbMask,
    textMask,
    width,
    height
  );
};

const processDocument = (imageData, shadowFree, width, height) => {
  if (isIdCardLikeDocument(imageData, width, height)) {
    return processIdCardDocument(imageData, shadowFree, width, height);
  }

  const docGray = enhanceGeneralDocument(shadowFree, width, height);
  return grayToImageData(docGray, width, height);
};

export const enhanceDocumentImage = async (file, quality = 0.92) => {
  const img = await loadImageFromFile(file);
  const { width, height } = scaleToFit(img.naturalWidth, img.naturalHeight, MAX_DIMENSION);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const gray = toGrayscale(imageData);
  const shadowFree = removeShadows(gray, width, height);

  const processed = processDocument(imageData, shadowFree, width, height);

  ctx.putImageData(processed, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Failed to encode image'))),
      'image/jpeg',
      quality
    );
  });

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { blob, dataUrl, width, height, canvas };
};

export const canvasToJpegBlob = (canvas, quality = 0.92) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode JPEG'))),
      'image/jpeg',
      quality
    );
  });

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadJpegsSeparately = async (items, delayMs = 300) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.enhancedBlob) continue;
    const baseName = item.fileName.replace(/\.[^.]+$/, '') || `document-${i + 1}`;
    downloadBlob(item.enhancedBlob, `${baseName}-enhanced.jpg`);
    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

export const downloadCombinedPdf = async (items) => {
  const { jsPDF } = await import('jspdf');
  const ready = items.filter((item) => item.enhancedBlob && item.dataUrl);
  if (!ready.length) {
    throw new Error('No enhanced images to export');
  }

  const first = ready[0];
  const orientation = first.width >= first.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [first.width, first.height],
    compress: true,
  });

  pdf.addImage(first.dataUrl, 'JPEG', 0, 0, first.width, first.height, undefined, 'FAST');

  for (let i = 1; i < ready.length; i++) {
    const item = ready[i];
    const pageOrientation = item.width >= item.height ? 'landscape' : 'portrait';
    pdf.addPage([item.width, item.height], pageOrientation);
    pdf.addImage(item.dataUrl, 'JPEG', 0, 0, item.width, item.height, undefined, 'FAST');
  }

  pdf.save('enhanced-documents.pdf');
};
