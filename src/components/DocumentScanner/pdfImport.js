const RENDER_SCALE_CAP = 2.5;
const MAX_RENDER_DIMENSION = 2400;

let pdfjsPromise = null;

const getPdfJs = async () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      return pdfjs;
    });
  }
  return pdfjsPromise;
};

export const isPdfFile = (file) =>
  file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

export const isAcceptedUploadFile = (file) => {
  if (isPdfFile(file)) return true;
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
  if (imageTypes.includes(file.type)) return true;
  return /\.(jpe?g|png|webp|bmp)$/i.test(file.name);
};

/**
 * Render each PDF page to a JPEG-backed item ready for enhancement.
 */
export const expandPdfToPageItems = async (file) => {
  const pdfjs = await getPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pageCount = pdf.numPages;

  const baseName = file.name.replace(/\.pdf$/i, '') || 'document';
  const items = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
      RENDER_SCALE_CAP,
      MAX_RENDER_DIMENSION / baseViewport.width,
      MAX_RENDER_DIMENSION / baseViewport.height
    );
    const viewport = page.getViewport({ scale: Math.max(scale, 0.5) });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Failed to render PDF page'))),
        'image/jpeg',
        0.92
      );
    });

    const pageFile = new File([blob], `${baseName}-page-${pageNum}.jpg`, { type: 'image/jpeg' });
    const label =
      pageCount === 1
        ? `${baseName}.pdf`
        : `${baseName}.pdf — page ${pageNum}`;

    items.push({
      file: pageFile,
      fileName: label,
      originalUrl: URL.createObjectURL(blob),
      sourcePdfName: file.name,
      pdfPageNumber: pageNum,
      pdfPageCount: pageCount,
    });
  }

  return items;
};
