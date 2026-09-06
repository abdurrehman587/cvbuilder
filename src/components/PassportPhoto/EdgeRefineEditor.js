import React, { useEffect, useRef, useState } from 'react';
import { PASSPORT_HEIGHT_PX, PASSPORT_RATIO, PASSPORT_WIDTH_PX } from './passportPhotoUtils';
import { compositeOnBackground, loadImage } from './removeBackground';

/**
 * Soft eraser / restore brush on the transparent subject layer.
 * Eraser: removes leftover bg / fringes (makes transparent → shows solid bg)
 * Restore: paints subject back from a snapshot (helps hair that was over-erased)
 */
function EdgeRefineEditor({
  cutoutDataUrl,
  bgHex,
  onApply,
  onCancel,
}) {
  const displayRef = useRef(null);
  const layerRef = useRef(null); // offscreen working RGBA layer
  const baseRef = useRef(null); // snapshot for restore brush
  const drawing = useRef(false);
  const lastPt = useRef(null);

  const [brushSize, setBrushSize] = useState(24);
  const [hardness, setHardness] = useState(0.35);
  const [tool, setTool] = useState('eraser'); // eraser | restore
  const [ready, setReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [cursor, setCursor] = useState(null); // { x, y } in frame CSS pixels

  const frameW = 280;
  const frameH = Math.round(frameW / PASSPORT_RATIO);
  const brushDisplayPx = Math.max(8, brushSize * (frameW / PASSPORT_WIDTH_PX));

  const redrawPreview = async () => {
    const layer = layerRef.current;
    if (!layer) return;
    const composed = await compositeOnBackground(layer.toDataURL('image/png'), bgHex);
    setPreviewUrl(composed.dataUrl);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const img = await loadImage(cutoutDataUrl);
      if (cancelled) return;

      const layer = document.createElement('canvas');
      layer.width = PASSPORT_WIDTH_PX;
      layer.height = PASSPORT_HEIGHT_PX;
      const ctx = layer.getContext('2d');
      ctx.clearRect(0, 0, layer.width, layer.height);
      ctx.drawImage(img, 0, 0, layer.width, layer.height);
      layerRef.current = layer;

      const base = document.createElement('canvas');
      base.width = layer.width;
      base.height = layer.height;
      base.getContext('2d').drawImage(layer, 0, 0);
      baseRef.current = base;

      setReady(true);
      await redrawPreview();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cutoutDataUrl]);

  useEffect(() => {
    if (ready) redrawPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgHex, ready]);

  const canvasToLayer = (clientX, clientY) => {
    const el = displayRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * PASSPORT_WIDTH_PX;
    const y = ((clientY - rect.top) / rect.height) * PASSPORT_HEIGHT_PX;
    return { x, y };
  };

  const stamp = (x, y) => {
    const layer = layerRef.current;
    const base = baseRef.current;
    if (!layer || !base) return;

    const ctx = layer.getContext('2d');
    const r = brushSize / 2;
    const soft = Math.max(0.05, Math.min(0.95, 1 - hardness));

    if (tool === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(x, y, r * soft, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0.85)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Restore from original cutout snapshot
      const tmp = document.createElement('canvas');
      tmp.width = layer.width;
      tmp.height = layer.height;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(base, 0, 0);
      tctx.globalCompositeOperation = 'destination-in';
      const g = tctx.createRadialGradient(x, y, r * soft, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0.9)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      tctx.fillStyle = g;
      tctx.beginPath();
      tctx.arc(x, y, r, 0, Math.PI * 2);
      tctx.fill();
      ctx.drawImage(tmp, 0, 0);
    }
  };

  const strokeTo = (x, y) => {
    const prev = lastPt.current;
    if (!prev) {
      stamp(x, y);
      lastPt.current = { x, y };
      return;
    }
    const dx = x - prev.x;
    const dy = y - prev.y;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(2, brushSize * 0.25);
    const n = Math.ceil(dist / step);
    for (let i = 1; i <= n; i += 1) {
      const t = i / n;
      stamp(prev.x + dx * t, prev.y + dy * t);
    }
    lastPt.current = { x, y };
  };

  const updateCursor = (clientX, clientY) => {
    const el = displayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCursor({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateCursor(e.clientX, e.clientY);
    const pt = canvasToLayer(e.clientX, e.clientY);
    if (!pt) return;
    lastPt.current = null;
    strokeTo(pt.x, pt.y);
  };

  const onPointerMove = (e) => {
    updateCursor(e.clientX, e.clientY);
    if (!drawing.current) return;
    const pt = canvasToLayer(e.clientX, e.clientY);
    if (!pt) return;
    strokeTo(pt.x, pt.y);
  };

  const onPointerUp = async () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPt.current = null;
    await redrawPreview();
  };

  const onPointerLeave = () => {
    if (!drawing.current) setCursor(null);
  };

  const handleApply = async () => {
    const layer = layerRef.current;
    if (!layer) return;
    setSaving(true);
    try {
      const cutoutDataUrlNext = layer.toDataURL('image/png');
      const composed = await compositeOnBackground(cutoutDataUrlNext, bgHex);
      onApply({
        ...composed,
        cutoutDataUrl: cutoutDataUrlNext,
        engine: 'bg-removed-refined',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const base = baseRef.current;
    const layer = layerRef.current;
    if (!base || !layer) return;
    layer.getContext('2d').clearRect(0, 0, layer.width, layer.height);
    layer.getContext('2d').drawImage(base, 0, 0);
    await redrawPreview();
  };

  return (
    <div className="pp-refine-editor">
      <div className="pp-manual-header">
        <h3>Refine edges &amp; hair</h3>
        <p>
          Use the eraser to clean leftover background. Use restore if you erase too much hair.
        </p>
      </div>

      <div className="pp-refine-tools">
        <button
          type="button"
          className={`pp-btn pp-btn-ghost ${tool === 'eraser' ? 'pp-tool-active' : ''}`}
          onClick={() => setTool('eraser')}
        >
          Eraser
        </button>
        <button
          type="button"
          className={`pp-btn pp-btn-ghost ${tool === 'restore' ? 'pp-tool-active' : ''}`}
          onClick={() => setTool('restore')}
        >
          Restore
        </button>
        <button type="button" className="pp-btn pp-btn-ghost" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="pp-fixed-frame-wrap">
        <div
          ref={displayRef}
          className={`pp-fixed-frame pp-refine-canvas ${tool === 'eraser' ? 'pp-cursor-eraser' : 'pp-cursor-restore'}`}
          style={{ width: frameW, height: frameH, aspectRatio: '35 / 45', cursor: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerEnter={(e) => updateCursor(e.clientX, e.clientY)}
          onPointerLeave={onPointerLeave}
          role="presentation"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Refine passport edges" draggable={false} className="pp-refine-preview-img" />
          ) : (
            <div className="pp-fixed-frame-loading">Preparing…</div>
          )}
          {cursor && (
            <div
              className={`pp-brush-ring ${tool === 'eraser' ? 'pp-brush-ring--eraser' : 'pp-brush-ring--restore'}`}
              style={{
                width: brushDisplayPx,
                height: brushDisplayPx,
                left: cursor.x,
                top: cursor.y,
              }}
            />
          )}
          <span className="pp-fixed-frame-badge">
            {tool === 'eraser' ? 'Eraser' : 'Restore'} · {brushSize}px
          </span>
        </div>
      </div>

      <div className="pp-refine-sliders">
        <label>
          Brush size
          <input
            type="range"
            min={6}
            max={80}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </label>
        <label>
          Softness
          <input
            type="range"
            min={0}
            max={90}
            value={Math.round((1 - hardness) * 100)}
            onChange={(e) => setHardness(1 - Number(e.target.value) / 100)}
          />
        </label>
      </div>

      <div className="pp-manual-controls">
        <button type="button" className="pp-btn pp-btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-primary"
          onClick={handleApply}
          disabled={!ready || saving}
        >
          {saving ? 'Saving…' : 'Apply refine'}
        </button>
      </div>
    </div>
  );
}

export default EdgeRefineEditor;
