const API_BASE =
  (process.env.REACT_APP_PASSPORT_AI_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

export const PASSPORT_WIDTH_PX = 413;
export const PASSPORT_HEIGHT_PX = 531;
export const PASSPORT_RATIO = 35 / 45;

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];

export const isAcceptedPhoto = (file) =>
  ACCEPTED.includes(file.type) || /\.(jpe?g|png|webp|bmp)$/i.test(file.name);

const isGradioSpaceUrl = (url) => /hf\.space/i.test(url);

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const parseGradioSse = (text) => {
  const lines = String(text).split('\n');
  let eventName = '';
  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    }
    if (line.startsWith('data:')) {
      const payload = line.slice(5).trim();
      if (eventName === 'complete' || eventName === 'data') {
        try {
          return JSON.parse(payload);
        } catch {
          return payload;
        }
      }
      if (eventName === 'error') {
        throw new Error(payload || 'Gradio API error');
      }
    }
  }
  return null;
};

/** Call a Gradio Space endpoint (free HF Spaces). */
const callGradioApi = async (apiName, data, { timeoutMs = 90000 } = {}) => {
  const startRes = await fetch(`${API_BASE}/gradio_api/call/${apiName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!startRes.ok) {
    throw new Error(`Gradio start failed (${startRes.status})`);
  }
  const startJson = await startRes.json();
  const eventId = startJson.event_id;
  if (!eventId) {
    throw new Error('Gradio did not return event_id');
  }

  const resultUrl = `${API_BASE}/gradio_api/call/${apiName}/${eventId}`;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(resultUrl);
    const text = await res.text();
    const parsed = parseGradioSse(text);
    if (parsed != null) {
      return parsed;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Gradio API timed out');
};

export const checkPassportAiHealth = async () => {
  try {
    if (isGradioSpaceUrl(API_BASE)) {
      const result = await callGradioApi('health', [], { timeoutMs: 30000 });
      const raw = Array.isArray(result) ? result[0] : result;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return { online: data?.status === 'ok', data };
    }

    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, data };
  } catch {
    return { online: false };
  }
};

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load ${file.name}`));
    };
    img.src = url;
  });

const canvasToJpegBlob = (canvas, quality = 0.92) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode JPEG'))),
      'image/jpeg',
      quality
    );
  });

const resultFromCropJson = (data) => {
  if (!data?.imageBase64) {
    throw new Error(data?.error || 'AI API returned no image');
  }
  const binary = atob(data.imageBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: data.mime || 'image/jpeg' });
  const dataUrl = `data:${data.mime || 'image/jpeg'};base64,${data.imageBase64}`;
  return {
    blob,
    dataUrl,
    width: data.width || PASSPORT_WIDTH_PX,
    height: data.height || PASSPORT_HEIGHT_PX,
    engine: data.engine || 'api',
  };
};

/** Local fallback: center crop with slight top bias for faces. */
export const localCropPassport = async (file) => {
  const img = await loadImageFromFile(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const targetRatio = PASSPORT_RATIO;

  let sx;
  let sy;
  let sw;
  let sh;
  if (w / h > targetRatio) {
    sw = Math.floor(h * targetRatio);
    sh = h;
    sx = Math.floor((w - sw) / 2);
    sy = 0;
  } else {
    sw = w;
    sh = Math.floor(w / targetRatio);
    sx = 0;
    sy = Math.max(0, Math.floor((h - sh) * 0.28));
  }

  const canvas = document.createElement('canvas');
  canvas.width = PASSPORT_WIDTH_PX;
  canvas.height = PASSPORT_HEIGHT_PX;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob = await canvasToJpegBlob(canvas);
  return {
    blob,
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    width: canvas.width,
    height: canvas.height,
    engine: 'local-fallback',
  };
};

export const cropPassportViaApi = async (file) => {
  if (isGradioSpaceUrl(API_BASE)) {
    const dataUrl = await fileToBase64(file);
    const result = await callGradioApi('crop_b64', [dataUrl]);
    const raw = Array.isArray(result) ? result[0] : result;
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data?.ok) {
      throw new Error(data?.error || 'Gradio crop failed');
    }
    return resultFromCropJson(data);
  }

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/crop`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `AI API error (${res.status})`);
  }

  const data = await res.json();
  return resultFromCropJson(data);
};

export const cropPassportPhoto = async (file, preferApi = true) => {
  if (preferApi) {
    const health = await checkPassportAiHealth();
    if (health.online) {
      return cropPassportViaApi(file);
    }
  }
  return localCropPassport(file);
};

/** Arrange cropped passport photos on an A4 sheet (300dpi). */
export const buildPrintSheet = async (croppedItems, options = {}) => {
  const {
    cols = 4,
    rows = 5,
    marginMm = 8,
    gapMm = 4,
  } = options;

  const dpi = 300;
  const a4W = Math.round((210 / 25.4) * dpi);
  const a4H = Math.round((297 / 25.4) * dpi);
  const margin = Math.round((marginMm / 25.4) * dpi);
  const gap = Math.round((gapMm / 25.4) * dpi);

  const usableW = a4W - margin * 2 - gap * (cols - 1);
  const usableH = a4H - margin * 2 - gap * (rows - 1);
  const cellW = Math.floor(usableW / cols);
  const cellH = Math.floor(usableH / rows);

  const canvas = document.createElement('canvas');
  canvas.width = a4W;
  canvas.height = a4H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, a4W, a4H);

  const capacity = cols * rows;
  const slice = croppedItems.slice(0, capacity);

  await Promise.all(
    slice.map(
      (item, index) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = margin + col * (cellW + gap);
            const y = margin + row * (cellH + gap);

            const scale = Math.min(cellW / img.naturalWidth, cellH / img.naturalHeight);
            const dw = Math.floor(img.naturalWidth * scale);
            const dh = Math.floor(img.naturalHeight * scale);
            const dx = x + Math.floor((cellW - dw) / 2);
            const dy = y + Math.floor((cellH - dh) / 2);

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
            ctx.drawImage(img, dx, dy, dw, dh);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load cropped image for sheet'));
          img.src = item.dataUrl;
        })
    )
  );

  const blob = await canvasToJpegBlob(canvas, 0.93);
  return {
    blob,
    dataUrl: canvas.toDataURL('image/jpeg', 0.93),
    width: a4W,
    height: a4H,
    placed: slice.length,
    capacity,
  };
};

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
