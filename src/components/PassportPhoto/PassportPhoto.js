import React, { useCallback, useEffect, useRef, useState } from 'react';
import EdgeRefineEditor from './EdgeRefineEditor';
import ManualCropEditor from './ManualCropEditor';
import {
  buildPrintSheet,
  checkPassportAiHealth,
  cropPassportPhoto,
  downloadBlob,
  isAcceptedPhoto,
  manualCropPassport,
  PASSPORT_RATIO,
} from './passportPhotoUtils';
import { BG_COLORS, compositeOnBackground, removePassportBackground } from './removeBackground';
import { retouchPassportPhoto } from './retouchPhoto';
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
  const [adjustingId, setAdjustingId] = useState(null);
  const [refiningId, setRefiningId] = useState(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isRetouching, setIsRetouching] = useState(false);
  const [bgColor, setBgColor] = useState('white');

  const selectedItem = items.find((item) => item.id === selectedId) || items[0] || null;
  const croppedCount = items.filter((item) => item.status === 'done').length;
  const isBusy = isProcessing || isBuildingSheet || isRemovingBg || isRetouching;

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

  const defaultManualBox = () => {
    const w = 0.48;
    const h = w / PASSPORT_RATIO;
    return {
      x: (1 - w) / 2,
      y: Math.max(0, (1 - h) * 0.18),
      w,
      h,
    };
  };

  const handleApplyManualCrop = async (payload) => {
    if (!adjustingId) return;
    const item = items.find((i) => i.id === adjustingId);
    if (!item) return;

    const { rotation = 0, ...box } = payload || {};
    setIsProcessing(true);
    setError('');
    try {
      const result = await manualCropPassport(item.file, box, rotation);
      const croppedUrl = URL.createObjectURL(result.blob);
      setItems((prev) =>
        prev.map((row) => {
          if (row.id !== adjustingId) return row;
          if (row.croppedUrl) URL.revokeObjectURL(row.croppedUrl);
          return {
            ...row,
            status: 'done',
            croppedUrl,
            croppedBlob: result.blob,
            dataUrl: result.dataUrl,
            width: result.width,
            height: result.height,
            engine: result.engine,
            manualBox: box,
            manualRotation: rotation,
          };
        })
      );
      setAdjustingId(null);
      setPrintSheet(null);
    } catch (err) {
      setError(err.message || 'Manual crop failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustingItem = adjustingId ? items.find((i) => i.id === adjustingId) : null;
  const refiningItem = refiningId ? items.find((i) => i.id === refiningId) : null;

  const handleRemoveBackground = async () => {
    if (!selectedItem?.croppedBlob && !selectedItem?.croppedUrl) return;
    setIsRemovingBg(true);
    setError('');
    try {
      const source = selectedItem.croppedBlob || selectedItem.croppedUrl;
      const hex = BG_COLORS[bgColor]?.hex || '#FFFFFF';
      const result = await removePassportBackground(source, hex);
      const croppedUrl = URL.createObjectURL(result.blob);
      setItems((prev) =>
        prev.map((row) => {
          if (row.id !== selectedItem.id) return row;
          if (row.croppedUrl) URL.revokeObjectURL(row.croppedUrl);
          return {
            ...row,
            croppedUrl,
            croppedBlob: result.blob,
            dataUrl: result.dataUrl,
            width: result.width,
            height: result.height,
            engine: `${result.engine}:${bgColor}`,
            bgRemoved: true,
            bgColor,
            cutoutDataUrl: result.cutoutDataUrl,
          };
        })
      );
      setPrintSheet(null);
      setRefiningId(selectedItem.id);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          'Background removal failed. Check your internet (model downloads on first use) and try again.'
      );
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleApplyRefine = (result) => {
    if (!refiningId) return;
    const croppedUrl = URL.createObjectURL(result.blob);
    setItems((prev) =>
      prev.map((row) => {
        if (row.id !== refiningId) return row;
        if (row.croppedUrl) URL.revokeObjectURL(row.croppedUrl);
        return {
          ...row,
          croppedUrl,
          croppedBlob: result.blob,
          dataUrl: result.dataUrl,
          width: result.width,
          height: result.height,
          engine: result.engine,
          cutoutDataUrl: result.cutoutDataUrl,
          bgRemoved: true,
        };
      })
    );
    setRefiningId(null);
    setPrintSheet(null);
  };

  const handleRetouch = async () => {
    if (!selectedItem?.croppedBlob && !selectedItem?.croppedUrl) return;
    setIsRetouching(true);
    setError('');
    try {
      const source = selectedItem.croppedBlob || selectedItem.croppedUrl;
      const result = await retouchPassportPhoto(source);
      const croppedUrl = URL.createObjectURL(result.blob);
      setItems((prev) =>
        prev.map((row) => {
          if (row.id !== selectedItem.id) return row;
          if (row.croppedUrl) URL.revokeObjectURL(row.croppedUrl);
          return {
            ...row,
            croppedUrl,
            croppedBlob: result.blob,
            dataUrl: result.dataUrl,
            width: result.width,
            height: result.height,
            engine: result.engine,
            retouched: true,
          };
        })
      );
      setPrintSheet(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Retouch failed');
    } finally {
      setIsRetouching(false);
    }
  };

  const handleBgColorChange = async (nextId) => {
    setBgColor(nextId);
    if (!selectedItem?.bgRemoved || !selectedItem?.cutoutDataUrl) return;
    const hex = BG_COLORS[nextId]?.hex || '#FFFFFF';
    try {
      const composed = await compositeOnBackground(selectedItem.cutoutDataUrl, hex);
      const croppedUrl = URL.createObjectURL(composed.blob);
      setItems((prev) =>
        prev.map((row) => {
          if (row.id !== selectedItem.id) return row;
          if (row.croppedUrl) URL.revokeObjectURL(row.croppedUrl);
          return {
            ...row,
            croppedUrl,
            croppedBlob: composed.blob,
            dataUrl: composed.dataUrl,
            bgColor: nextId,
            engine: `bg-removed:${nextId}`,
          };
        })
      );
      setPrintSheet(null);
    } catch (err) {
      setError(err.message || 'Failed to change background color');
    }
  };

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
              className="pp-btn pp-btn-retouch"
              onClick={handleRetouch}
              disabled={isBusy || selectedItem?.status !== 'done'}
            >
              {isRetouching ? 'Retouching…' : 'Retouch & finish'}
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

      {adjustingItem && (
        <ManualCropEditor
          imageUrl={adjustingItem.originalUrl}
          initialBox={adjustingItem.manualBox || defaultManualBox()}
          initialRotation={adjustingItem.manualRotation || 0}
          onApply={handleApplyManualCrop}
          onCancel={() => setAdjustingId(null)}
        />
      )}

      {refiningItem?.cutoutDataUrl && (
        <EdgeRefineEditor
          cutoutDataUrl={refiningItem.cutoutDataUrl}
          bgHex={BG_COLORS[refiningItem.bgColor || bgColor]?.hex || '#FFFFFF'}
          onApply={handleApplyRefine}
          onCancel={() => setRefiningId(null)}
        />
      )}

      {selectedItem && !adjustingItem && !refiningItem && (
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
                <div className="pp-bg-row">
                  <span className="pp-bg-label">Background:</span>
                  {Object.values(BG_COLORS).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`pp-bg-swatch ${bgColor === c.id ? 'pp-bg-swatch--active' : ''}`}
                      style={{ background: c.hex }}
                      title={`${c.label} (${c.cmyk})`}
                      aria-label={c.label}
                      onClick={() => handleBgColorChange(c.id)}
                      disabled={isBusy}
                    />
                  ))}
                  <span className="pp-bg-name">
                    {BG_COLORS[bgColor]?.label}
                    {BG_COLORS[bgColor]?.cmyk ? ` · ${BG_COLORS[bgColor].cmyk}` : ''}
                  </span>
                </div>
                <div className="pp-preview-actions">
                  <button
                    type="button"
                    className="pp-btn pp-btn-small pp-btn-adjust"
                    onClick={() => setAdjustingId(selectedItem.id)}
                    disabled={isBusy}
                  >
                    Adjust crop
                  </button>
                  <button
                    type="button"
                    className="pp-btn pp-btn-small pp-btn-bg"
                    onClick={handleRemoveBackground}
                    disabled={isBusy}
                  >
                    {isRemovingBg ? 'Removing background…' : 'Remove background'}
                  </button>
                  {selectedItem.bgRemoved && selectedItem.cutoutDataUrl && (
                    <button
                      type="button"
                      className="pp-btn pp-btn-small pp-btn-refine"
                      onClick={() => setRefiningId(selectedItem.id)}
                      disabled={isBusy}
                    >
                      Refine edges
                    </button>
                  )}
                  <button
                    type="button"
                    className="pp-btn pp-btn-small pp-btn-retouch"
                    onClick={handleRetouch}
                    disabled={isBusy}
                  >
                    {isRetouching ? 'Retouching…' : 'Retouch & finish'}
                  </button>
                  <button
                    type="button"
                    className="pp-btn pp-btn-small"
                    onClick={() =>
                      downloadBlob(
                        selectedItem.croppedBlob,
                        `${selectedItem.fileName.replace(/\.[^.]+$/, '')}-passport.jpg`
                      )
                    }
                    disabled={isBusy}
                  >
                    Download this photo
                  </button>
                </div>
                {isRemovingBg && (
                  <p className="pp-bg-hint">
                    First time may take 10–30 seconds while the AI model downloads.
                  </p>
                )}
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
