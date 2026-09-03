import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildPrintSheet,
  checkPassportAiHealth,
  cropPassportPhoto,
  downloadBlob,
  isAcceptedPhoto,
} from './passportPhotoUtils';
import './PassportPhoto.css';

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function PassportPhoto() {
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [aiOnline, setAiOnline] = useState(false);
  const [aiMode, setAiMode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBuildingSheet, setIsBuildingSheet] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [printSheet, setPrintSheet] = useState(null);

  const selectedItem = items.find((item) => item.id === selectedId) || items[0] || null;
  const croppedCount = items.filter((item) => item.status === 'done').length;
  const isBusy = isProcessing || isBuildingSheet;

  const refreshAiStatus = useCallback(async () => {
    const health = await checkPassportAiHealth();
    if (health.online) {
      setAiOnline(true);
      setAiMode(health.data?.mode || 'cloud');
      return;
    }
    // Free path: browser crop always works (HF Gradio/Docker may be paid).
    setAiOnline(true);
    setAiMode('browser-crop');
  }, []);

  useEffect(() => {
    refreshAiStatus();
    const timer = setInterval(refreshAiStatus, 8000);
    return () => clearInterval(timer);
  }, [refreshAiStatus]);

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter(isAcceptedPhoto);
    if (!files.length) {
      setError('Please upload JPG, PNG, WEBP, or BMP photos.');
      return;
    }

    setError('');
    const newItems = files.map((file) => ({
      id: makeId(),
      file,
      fileName: file.name,
      originalUrl: URL.createObjectURL(file),
      croppedUrl: null,
      croppedBlob: null,
      dataUrl: null,
      width: 0,
      height: 0,
      engine: null,
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
    setPrintSheet(null);
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
      if (target?.croppedUrl) URL.revokeObjectURL(target.croppedUrl);
      const next = prev.filter((item) => item.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id || null);
      }
      return next;
    });
    setPrintSheet(null);
  };

  const clearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.croppedUrl) URL.revokeObjectURL(item.croppedUrl);
    });
    setItems([]);
    setSelectedId(null);
    setPrintSheet(null);
    setError('');
  };

  const processAll = async () => {
    if (!items.length || isBusy) return;
    setIsProcessing(true);
    setError('');
    await refreshAiStatus();

    const updated = [...items];
    for (let i = 0; i < updated.length; i += 1) {
      const item = updated[i];
      if (item.status === 'done') continue;

      updated[i] = { ...item, status: 'processing', error: null };
      setItems([...updated]);

      try {
        const result = await cropPassportPhoto(item.file, true);
        const croppedUrl = URL.createObjectURL(result.blob);
        if (updated[i].croppedUrl) URL.revokeObjectURL(updated[i].croppedUrl);
        updated[i] = {
          ...updated[i],
          status: 'done',
          croppedUrl,
          croppedBlob: result.blob,
          dataUrl: result.dataUrl,
          width: result.width,
          height: result.height,
          engine: result.engine,
        };
      } catch (err) {
        updated[i] = {
          ...updated[i],
          status: 'error',
          error: err.message || 'Crop failed',
        };
      }
      setItems([...updated]);
    }

    setIsProcessing(false);
    setPrintSheet(null);
  };

  const handleBuildSheet = async () => {
    const ready = items.filter((item) => item.status === 'done' && item.dataUrl);
    if (!ready.length) return;
    setIsBuildingSheet(true);
    setError('');
    try {
      const sheet = await buildPrintSheet(ready, { cols: 4, rows: 5 });
      setPrintSheet(sheet);
    } catch (err) {
      setError(err.message || 'Failed to build print sheet');
    } finally {
      setIsBuildingSheet(false);
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className="passport-photo-page">
      <div className="pp-header">
        <div>
          <h1>Passport Photos</h1>
          <p>
            Crop photos to passport size and arrange them on an A4 sheet for printing.
            Heavy AI training stays in a separate project so CV Builder stays fast.
          </p>
        </div>
        {items.length > 0 && (
          <button type="button" className="pp-btn pp-btn-ghost" onClick={clearAll} disabled={isBusy}>
            Start over
          </button>
        )}
      </div>

      <div className={`pp-ai-status ${aiOnline ? 'pp-ai-status--online' : 'pp-ai-status--offline'}`}>
        <span className="pp-ai-dot" />
        {aiMode === 'browser-crop' ? (
          <span>
            Browser crop ready (free) — works on this page without Hugging Face PRO.
            Optional cloud API later: see <code>passport-ai/DEPLOY_NOW.md</code>.
          </span>
        ) : aiOnline ? (
          <span>
            Passport AI connected ({aiMode || 'ready'}) — cropping runs on the AI server.
          </span>
        ) : (
          <span>
            AI unavailable. Browser crop should still work after Refresh.
          </span>
        )}
        <button type="button" className="pp-btn pp-btn-tiny" onClick={refreshAiStatus} disabled={isBusy}>
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div
          className={`pp-dropzone ${dragOver ? 'pp-dropzone--active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
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
            className="pp-file-input"
          />
          <div className="pp-dropzone-icon">🪪</div>
          <p className="pp-dropzone-title">Drop photos here or click to browse</p>
          <p className="pp-dropzone-hint">JPG, PNG, WEBP, BMP — batch upload OK</p>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
            multiple
            onChange={handleFileChange}
            className="pp-file-input"
          />

          <div className="pp-toolbar">
            <button type="button" className="pp-btn pp-btn-ghost" onClick={openFilePicker} disabled={isBusy}>
              Add photos
            </button>
            <button
              type="button"
              className="pp-btn pp-btn-primary"
              onClick={processAll}
              disabled={isBusy}
            >
              {isProcessing ? 'Cropping…' : `Crop ${items.length} photo${items.length > 1 ? 's' : ''}`}
            </button>
            <button
              type="button"
              className="pp-btn pp-btn-secondary"
              onClick={handleBuildSheet}
              disabled={croppedCount === 0 || isBusy}
            >
              {isBuildingSheet ? 'Building sheet…' : 'Make A4 print sheet'}
            </button>
            <span className="pp-toolbar-status">
              {croppedCount}/{items.length} cropped
            </span>
          </div>
        </>
      )}

      {error && <div className="pp-error">{error}</div>}

      {selectedItem && (
        <div className="pp-preview-grid">
          <div className="pp-preview-panel">
            <h3>Original</h3>
            <div className="pp-preview-frame">
              <img src={selectedItem.originalUrl} alt="Original upload" />
            </div>
          </div>
          <div className="pp-preview-panel">
            <h3>Passport crop</h3>
            <div className="pp-preview-frame pp-preview-frame--passport">
              {selectedItem.status === 'done' && selectedItem.croppedUrl ? (
                <img src={selectedItem.croppedUrl} alt="Passport crop result" />
              ) : selectedItem.status === 'processing' ? (
                <div className="pp-placeholder">Cropping…</div>
              ) : selectedItem.status === 'error' ? (
                <div className="pp-placeholder pp-placeholder--error">
                  {selectedItem.error || 'Failed'}
                </div>
              ) : (
                <div className="pp-placeholder">Click &quot;Crop&quot; to process</div>
              )}
            </div>
            {selectedItem.status === 'done' && (
              <>
                <p className="pp-engine-hint">Engine: {selectedItem.engine || 'unknown'}</p>
                <button
                  type="button"
                  className="pp-btn pp-btn-small"
                  onClick={() =>
                    downloadBlob(
                      selectedItem.croppedBlob,
                      `${selectedItem.fileName.replace(/\.[^.]+$/, '')}-passport.jpg`
                    )
                  }
                >
                  Download this photo
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {printSheet && (
        <div className="pp-sheet-panel">
          <div className="pp-sheet-header">
            <h3>A4 print sheet ({printSheet.placed}/{printSheet.capacity} photos)</h3>
            <button
              type="button"
              className="pp-btn pp-btn-secondary"
              onClick={() => downloadBlob(printSheet.blob, 'passport-print-sheet.jpg')}
            >
              Download A4 sheet
            </button>
          </div>
          <div className="pp-sheet-frame">
            <img src={printSheet.dataUrl} alt="A4 passport print sheet" />
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="pp-thumbnail-list">
          <h3>Uploaded photos ({items.length})</h3>
          <div className="pp-thumbnails">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`pp-thumb ${selectedItem?.id === item.id ? 'pp-thumb--active' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <img src={item.croppedUrl || item.originalUrl} alt={item.fileName} />
                <span className="pp-thumb-name">{item.fileName}</span>
                <span className={`pp-thumb-badge pp-thumb-badge--${item.status}`}>
                  {item.status === 'done' ? '✓' : item.status === 'processing' ? '…' : item.status === 'error' ? '!' : '•'}
                </span>
                <span
                  className="pp-thumb-remove"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      removeItem(item.id);
                    }
                  }}
                  aria-label="Remove"
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pp-guide">
        <h3>Cloud-first (keeps your PC light)</h3>
        <ol>
          <li>
            <strong>This page</strong> is only the UI inside CV Builder — no training files here.
          </li>
          <li>
            <strong>Website data</strong> stays on Supabase (online).
          </li>
          <li>
            <strong>AI training & models</strong> should live on Google Colab + Hugging Face /
            Drive — not on this PC&apos;s disk.
          </li>
          <li>
            Set <code>REACT_APP_PASSPORT_AI_URL</code> in <code>.env</code> to your cloud AI URL.
            See <code>passport-ai/CLOUD.md</code> for step-by-step hosting.
          </li>
          <li>
            Until cloud is ready, local fallback crop still works without heavy models.
          </li>
        </ol>
      </div>
    </div>
  );
}

export default PassportPhoto;
