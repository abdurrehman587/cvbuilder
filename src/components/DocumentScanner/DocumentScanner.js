import React, { useCallback, useRef, useState } from 'react';
import {
  enhanceDocumentImage,
  downloadJpegsSeparately,
  downloadCombinedPdf,
  downloadBlob,
} from './enhanceImage';
import { expandPdfToPageItems, isAcceptedUploadFile, isPdfFile } from './pdfImport';
import './DocumentScanner.css';

const FILE_INPUT_ACCEPT =
  'image/jpeg,image/jpg,image/png,image/webp,image/bmp,application/pdf,.pdf';

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createImageItem = (file) => ({
  id: makeId(),
  file,
  fileName: file.name,
  originalUrl: URL.createObjectURL(file),
  enhancedUrl: null,
  enhancedBlob: null,
  dataUrl: null,
  width: 0,
  height: 0,
  status: 'pending',
  error: null,
  sourcePdfName: null,
  pdfPageNumber: null,
});

function DocumentScanner() {
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const selectedItem = items.find((item) => item.id === selectedId) || items[0] || null;
  const enhancedCount = items.filter((item) => item.status === 'done').length;
  const hasEnhanced = enhancedCount > 0;
  const isBusy = isProcessing || isImporting || isDownloading;

  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList).filter(isAcceptedUploadFile);

    if (!files.length) {
      setError('Please upload JPG, PNG, WEBP, BMP images, or PDF files.');
      return;
    }

    setIsImporting(true);
    setError('');

    try {
      const newItems = [];

      for (const file of files) {
        if (isPdfFile(file)) {
          const pages = await expandPdfToPageItems(file);
          pages.forEach((page) => {
            newItems.push({
              id: makeId(),
              file: page.file,
              fileName: page.fileName,
              originalUrl: page.originalUrl,
              enhancedUrl: null,
              enhancedBlob: null,
              dataUrl: null,
              width: 0,
              height: 0,
              status: 'pending',
              error: null,
              sourcePdfName: page.sourcePdfName,
              pdfPageNumber: page.pdfPageNumber,
            });
          });
        } else {
          newItems.push(createImageItem(file));
        }
      }

      setItems((prev) => {
        const merged = [...prev, ...newItems];
        if (!selectedId && merged.length) {
          setSelectedId(merged[0].id);
        }
        return merged;
      });
    } catch (err) {
      setError(err.message || 'Failed to import PDF');
    } finally {
      setIsImporting(false);
    }
  }, [selectedId]);

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.originalUrl) URL.revokeObjectURL(target.originalUrl);
      if (target?.enhancedUrl) URL.revokeObjectURL(target.enhancedUrl);
      const next = prev.filter((item) => item.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id || null);
      }
      return next;
    });
  };

  const clearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.enhancedUrl) URL.revokeObjectURL(item.enhancedUrl);
    });
    setItems([]);
    setSelectedId(null);
    setError('');
  };

  const processAll = async () => {
    if (!items.length || isProcessing) return;
    setIsProcessing(true);
    setError('');

    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (item.status === 'done') continue;

      updated[i] = { ...item, status: 'processing', error: null };
      setItems([...updated]);

      try {
        const result = await enhanceDocumentImage(item.file);
        const enhancedUrl = URL.createObjectURL(result.blob);
        updated[i] = {
          ...updated[i],
          status: 'done',
          enhancedUrl,
          enhancedBlob: result.blob,
          dataUrl: result.dataUrl,
          width: result.width,
          height: result.height,
        };
      } catch (err) {
        updated[i] = {
          ...updated[i],
          status: 'error',
          error: err.message || 'Enhancement failed',
        };
      }
      setItems([...updated]);
    }

    setIsProcessing(false);
  };

  const handleDownloadJpegs = async () => {
    const ready = items.filter((item) => item.status === 'done' && item.enhancedBlob);
    if (!ready.length) return;
    setIsDownloading(true);
    setError('');
    try {
      await downloadJpegsSeparately(ready);
    } catch (err) {
      setError(err.message || 'Failed to download images');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    const ready = items.filter((item) => item.status === 'done' && item.dataUrl);
    if (!ready.length) return;
    setIsDownloading(true);
    setError('');
    try {
      await downloadCombinedPdf(ready);
    } catch (err) {
      setError(err.message || 'Failed to create PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = (item) => {
    if (!item.enhancedBlob) return;
    const baseName = item.fileName.replace(/\.[^.]+$/, '') || 'document';
    downloadBlob(item.enhancedBlob, `${baseName}-enhanced.jpg`);
  };

  const resetEnhancement = () => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.enhancedUrl) URL.revokeObjectURL(item.enhancedUrl);
        return {
          ...item,
          enhancedUrl: null,
          enhancedBlob: null,
          dataUrl: null,
          width: 0,
          height: 0,
          status: 'pending',
          error: null,
        };
      })
    );
    setError('');
  };

  const startOver = () => {
    clearAll();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="document-scanner-page">
      <div className="document-scanner-header">
        <div>
          <h1>Document Scanner</h1>
          <p>Upload images or PDFs to clean the background, sharpen text, and export as JPG or PDF.</p>
        </div>
        {items.length > 0 && (
          <div className="ds-header-actions">
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={startOver}
              disabled={isBusy}
            >
              Start over
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={openFilePicker}
              disabled={isBusy}
            >
              Choose files
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div
          className={`ds-dropzone ${dragOver ? 'ds-dropzone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isImporting && openFilePicker()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !isImporting && openFilePicker()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            multiple
            onChange={handleFileChange}
            className="ds-file-input"
          />
          <div className="ds-dropzone-icon">📄</div>
          <p className="ds-dropzone-title">
            {isImporting ? 'Importing PDF pages…' : 'Drop files here or click to browse'}
          </p>
          <p className="ds-dropzone-hint">Supports JPG, PNG, WEBP, BMP, PDF — batch upload OK</p>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            multiple
            onChange={handleFileChange}
            className="ds-file-input"
          />

          <div className="ds-workspace-bar">
            <button
              type="button"
              className="ds-btn ds-btn-ghost ds-btn-back"
              onClick={startOver}
              disabled={isBusy}
            >
              ← Back
            </button>
            <span className="ds-workspace-summary">
              {items.length} file{items.length > 1 ? 's' : ''} selected
              {isImporting ? ' — importing PDF…' : ''}
            </span>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={openFilePicker}
              disabled={isBusy}
            >
              Add files
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={resetEnhancement}
              disabled={isBusy || !hasEnhanced}
            >
              Reset enhancement
            </button>
          </div>
        </>
      )}

      {items.length > 0 && (
        <div
          className={`ds-dropzone ds-dropzone--compact ${dragOver ? 'ds-dropzone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isImporting && openFilePicker()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !isImporting && openFilePicker()}
        >
          <p className="ds-dropzone-title">
            {isImporting ? 'Importing PDF pages…' : 'Drop more files here or click to add'}
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="ds-toolbar">
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            onClick={processAll}
            disabled={isBusy}
          >
            {isProcessing ? 'Processing…' : `Enhance ${items.length} file${items.length > 1 ? 's' : ''}`}
          </button>

          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={handleDownloadJpegs}
            disabled={!hasEnhanced || isBusy}
          >
            Download JPGs separately
          </button>

          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={handleDownloadPdf}
            disabled={!hasEnhanced || isBusy}
          >
            Download combined PDF
          </button>

          <span className="ds-toolbar-status">
            {enhancedCount}/{items.length} enhanced
          </span>
        </div>
      )}

      {error && <div className="ds-error">{error}</div>}

      {selectedItem && (
        <div className="ds-preview-grid">
          <div className="ds-preview-panel">
            <h3>Original</h3>
            <div className="ds-preview-frame">
              <img src={selectedItem.originalUrl} alt="Original document" />
            </div>
          </div>
          <div className="ds-preview-panel">
            <h3>Enhanced</h3>
            <div className="ds-preview-frame">
              {selectedItem.status === 'done' && selectedItem.enhancedUrl ? (
                <img src={selectedItem.enhancedUrl} alt="Enhanced document" />
              ) : selectedItem.status === 'processing' ? (
                <div className="ds-preview-placeholder">Enhancing…</div>
              ) : selectedItem.status === 'error' ? (
                <div className="ds-preview-placeholder ds-preview-placeholder--error">
                  {selectedItem.error || 'Failed'}
                </div>
              ) : (
                <div className="ds-preview-placeholder">Click &quot;Enhance&quot; to process</div>
              )}
            </div>
            {selectedItem.status === 'done' && (
              <button
                type="button"
                className="ds-btn ds-btn-small"
                onClick={() => handleDownloadSingle(selectedItem)}
              >
                Download this JPG
              </button>
            )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="ds-thumbnail-list">
          <h3>Uploaded files ({items.length})</h3>
          <div className="ds-thumbnails">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ds-thumb ${selectedItem?.id === item.id ? 'ds-thumb--active' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <img src={item.enhancedUrl || item.originalUrl} alt={item.fileName} />
                <span className="ds-thumb-name">{item.fileName}</span>
                <span className={`ds-thumb-badge ds-thumb-badge--${item.status}`}>
                  {item.status === 'done' ? '✓' : item.status === 'processing' ? '…' : item.status === 'error' ? '!' : '•'}
                </span>
                <span
                  className="ds-thumb-remove"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeItem(item.id); } }}
                  aria-label="Remove"
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentScanner;
