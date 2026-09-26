import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ProfileImageAdjuster.css';

const FRAME = 280;
const OUTPUT = 800;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

/**
 * Profile crop: drag to pan, slider to zoom (live). Portaled to body to avoid
 * global .app-content-with-navbar CSS (height:auto / max-width:100%) breaking the frame.
 */
function ProfileImageAdjuster({ imageUrl, onApply, onCancel }) {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const imgElRef = useRef(null);
  const sourceRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [nw, setNw] = useState(0);
  const [nh, setNh] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  // Pixel offset of image top-left inside the frame
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const coverBase = nw > 0 && nh > 0 ? Math.max(FRAME / nw, FRAME / nh) : 1;
  const scale = coverBase * zoom;
  const imgW = nw * scale;
  const imgH = nh * scale;

  const clampPos = useCallback(
    (x, y, w, h) => ({
      x: Math.min(0, Math.max(FRAME - w, x)),
      y: Math.min(0, Math.max(FRAME - h, y)),
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      sourceRef.current = img;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const base = Math.max(FRAME / w, FRAME / h);
      const z = 1.2;
      const scaledW = w * base * z;
      const scaledH = h * base * z;
      setNw(w);
      setNh(h);
      setZoom(z);
      setPos({
        x: (FRAME - scaledW) / 2,
        y: (FRAME - scaledH) / 2,
      });
      setReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setReady(false);
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // Keep image covering the frame when zoom changes (zoom toward frame center)
  const applyZoom = (nextZoom) => {
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextZoom));
    const nextScale = coverBase * z;
    const nextW = nw * nextScale;
    const nextH = nh * nextScale;
    // Point currently at frame center in image coords
    const cx = (FRAME / 2 - pos.x) / imgW;
    const cy = (FRAME / 2 - pos.y) / imgH;
    const nextX = FRAME / 2 - cx * nextW;
    const nextY = FRAME / 2 - cy * nextH;
    setZoom(z);
    setPos(clampPos(nextX, nextY, nextW, nextH));
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    frameRef.current?.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    e.preventDefault();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(
      clampPos(dragRef.current.origX + dx, dragRef.current.origY + dy, imgW, imgH)
    );
  };

  const endDrag = (e) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      try {
        frameRef.current?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  const handleApply = async () => {
    const src = sourceRef.current;
    if (!src || !nw) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);

    const outScale = (OUTPUT / FRAME) * scale;
    const drawW = nw * outScale;
    const drawH = nh * outScale;
    const dx = pos.x * (OUTPUT / FRAME);
    const dy = pos.y * (OUTPUT / FRAME);
    ctx.drawImage(src, dx, dy, drawW, drawH);

    const blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    );
    if (!blob) return;
    onApply(new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' }));
  };

  const modal = (
    <div
      className="pia-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Adjust profile picture"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="pia-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="pia-title">Adjust profile picture</h3>
        <p className="pia-hint">Drag the photo to reposition. Move the zoom slider to see the change live.</p>

        <div className="pia-frame-wrap">
          <div
            ref={frameRef}
            className="pia-frame"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {ready ? (
              <img
                ref={imgElRef}
                className="pia-frame-img"
                src={imageUrl}
                alt="Position subject in frame"
                draggable={false}
                style={{
                  '--pia-w': `${imgW}px`,
                  '--pia-h': `${imgH}px`,
                  '--pia-x': `${pos.x}px`,
                  '--pia-y': `${pos.y}px`,
                }}
              />
            ) : (
              <div className="pia-loading">Loading…</div>
            )}
            <div className="pia-frame-ring" aria-hidden="true" />
          </div>
        </div>

        <div className="pia-zoom-row">
          <span className="pia-zoom-label">Zoom out</span>
          <input
            id="pia-zoom"
            className="pia-zoom"
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={(e) => applyZoom(Number(e.target.value))}
            onInput={(e) => applyZoom(Number(e.target.value))}
            aria-label="Zoom"
          />
          <span className="pia-zoom-label">Zoom in</span>
        </div>
        <p className="pia-zoom-value">{Math.round(zoom * 100)}%</p>

        <div className="pia-actions">
          <button type="button" className="pia-btn pia-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="pia-btn pia-btn-primary"
            onClick={handleApply}
            disabled={!ready}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default ProfileImageAdjuster;
