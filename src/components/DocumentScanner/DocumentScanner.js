import React, { useCallback, useRef, useState } from 'react';
import {
  enhanceDocumentImage,
  downloadJpegsSeparately,
  downloadCombinedPdf,
  downloadBlob,
} from './enhanceImage';
import './DocumentScanner.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function DocumentScanner() {
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const selectedItem = items.find((item) => item.id === selectedId) || items[0] || null;
  const enhancedCount = items.filter((item) => item.status === 'done').length;
  const hasEnhanced = enhancedCount > 0;

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter((file) => {
      if (ACCEPTED_TYPES.includes(file.type)) return true;
      return /\.(jpe?g|png|webp|bmp)$/i.test(file.name);
    });

    if (!files.length) {
      setError('Please upload JPG, PNG, WEBP, or BMP images.');
      return;
    }

    setError('');
    const newItems = files.map((file) => ({
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
    }));

    setItems((prev) => {
      const merged = [...prev, ...newItems];
      if (!selectedId && merged.length) {
        setSelectedId(merged[0].id);
      }
      return merged;
    });
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
          <p>Upload images to clean the background, sharpen text, and export as JPG or PDF.</p>
        </div>
        {items.length > 0 && (
          <div className="ds-header-actions">
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={startOver}
              disabled={isProcessing}
            >
              Start over
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={openFilePicker}
              disabled={isProcessing}
            >
              Choose images
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
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
            multiple
            onChange={handleFileChange}
            className="ds-file-input"
          />
          <div className="ds-dropzone-icon">📄</div>
          <p className="ds-dropzone-title">Drop images here or click to browse</p>
          <p className="ds-dropzone-hint">Supports JPG, PNG, WEBP, BMP — batch upload OK</p>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
            multiple
            onChange={handleFileChange}
            className="ds-file-input"
          />

          <div className="ds-workspace-bar">
            <button
              type="button"
              className="ds-btn ds-btn-ghost ds-btn-back"
              onClick={startOver}
              disabled={isProcessing || isDownloading}
            >
              ← Back
            </button>
            <span className="ds-workspace-summary">
              {items.length} image{items.length > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={openFilePicker}
              disabled={isProcessing || isDownloading}
            >
              Add images
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={resetEnhancement}
              disabled={isProcessing || isDownloading || !hasEnhanced}
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
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}
        >
          <p className="ds-dropzone-title">Drop more images here or click to add</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="ds-toolbar">
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            onClick={processAll}
            disabled={isProcessing || isDownloading}
          >
            {isProcessing ? 'Processing…' : `Enhance ${items.length} image${items.length > 1 ? 's' : ''}`}
          </button>

          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={handleDownloadJpegs}
            disabled={!hasEnhanced || isProcessing || isDownloading}
          >
            Download JPGs separately
          </button>

          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={handleDownloadPdf}
            disabled={!hasEnhanced || isProcessing || isDownloading}
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
          <h3>Uploaded images ({items.length})</h3>
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
