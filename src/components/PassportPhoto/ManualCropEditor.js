import React, { useCallback, useEffect, useRef, useState } from 'react';
import { rotateImageToCanvas } from './passportPhotoUtils';

const W_OVER_H = 35 / 45;

/**
 * Fixed PORTRAIT 35×45 frame with pan, zoom, and rotation.
 */
function ManualCropEditor({ imageUrl, initialBox, initialRotation = 0, onApply, onCancel }) {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const sourceImgRef = useRef(null);

  const [sourceReady, setSourceReady] = useState(false);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [displayUrl, setDisplayUrl] = useState(imageUrl);
  const [frameW, setFrameW] = useState(260);

  // quarterTurns * 90 + fineTilt (-45..45)
  const initTurns = Math.round(initialRotation / 90);
  const initFine = initialRotation - initTurns * 90;
  const [quarterTurns, setQuarterTurns] = useState(initTurns);
  const [fineTilt, setFineTilt] = useState(
    Math.max(-45, Math.min(45, initFine))
  );

  const [viewW, setViewW] = useState(0.4);
  const [offset, setOffset] = useState({ x: 0.3, y: 0.1 });

  const SLIDER_MIN = 0.12;
  const SLIDER_MAX = 0.85;
  const frameH = Math.round(frameW * (45 / 35));
  const rotation = quarterTurns * 90 + fineTilt;

  const resetViewForSize = useCallback((nw, nh, box) => {
    let w = 0.42;
    if (box?.w) w = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, box.w));
    const maxW = Math.min(1, (nh * W_OVER_H) / nw);
    w = Math.min(w, maxW * 0.98);
    const h = (w * nw) / (nh * W_OVER_H);
    const x = box?.x != null ? box.x : (1 - w) / 2;
    const y = box?.y != null ? box.y : Math.max(0, (1 - h) * 0.2);
    setViewW(w);
    setOffset({
      x: Math.max(0, Math.min(1 - w, x)),
      y: Math.max(0, Math.min(1 - h, y)),
    });
  }, []);

  const normH = useCallback(
    (wFrac) => {
      if (!natural.w || !natural.h) return wFrac / W_OVER_H;
      return (wFrac * natural.w) / (natural.h * W_OVER_H);
    },
    [natural.w, natural.h]
  );

  const clampOffset = useCallback(
    (x, y, wFrac) => {
      if (!natural.w || !natural.h) {
        return { x: Math.max(0, x), y: Math.max(0, y) };
      }
      const maxW = Math.min(1, (natural.h * W_OVER_H) / natural.w);
      const w = Math.min(Math.max(0.05, wFrac), maxW);
      const h = (w * natural.w) / (natural.h * W_OVER_H);
      return {
        x: Math.max(0, Math.min(1 - w, x)),
        y: Math.max(0, Math.min(1 - h, y)),
      };
    },
    [natural.w, natural.h]
  );

  useEffect(() => {
    let cancelled = false;
    setSourceReady(false);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      sourceImgRef.current = img;
      setSourceReady(true);
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!sourceReady || !sourceImgRef.current) return;
    const src = sourceImgRef.current;
    const deg = rotation;

    let url = imageUrl;
    let nw = src.naturalWidth;
    let nh = src.naturalHeight;

    if (Math.abs(deg) > 0.05) {
      const canvas = rotateImageToCanvas(src, deg);
      url = canvas.toDataURL('image/jpeg', 0.92);
      nw = canvas.width;
      nh = canvas.height;
    }

    setDisplayUrl(url);
    setNatural({ w: nw, h: nh });
    // Keep initial box only when no rotation applied
    resetViewForSize(nw, nh, Math.abs(deg) < 0.05 ? initialBox : null);
  }, [sourceReady, rotation, imageUrl, initialBox, resetViewForSize]);

  useEffect(() => {
    const measure = () => {
      const parent = frameRef.current?.parentElement;
      const avail = parent?.clientWidth || 400;
      setFrameW(Math.max(200, Math.min(280, avail - 32)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const hFrac = natural.w ? normH(viewW) : viewW / W_OVER_H;

  const onPointerDown = (e) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current || !natural.w) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(
      clampOffset(
        dragRef.current.origX - (dx / frameW) * viewW,
        dragRef.current.origY - (dy / frameH) * hFrac,
        viewW
      )
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const sliderValue = SLIDER_MAX + SLIDER_MIN - viewW;

  const onZoomChange = (e) => {
    let nextW = SLIDER_MAX + SLIDER_MIN - Number(e.target.value);
    if (natural.w && natural.h) {
      const maxW = (natural.h * W_OVER_H) / natural.w;
      nextW = Math.min(nextW, maxW * 0.98);
    }
    const cx = offset.x + viewW / 2;
    const cy = offset.y + hFrac / 2;
    const nextH = natural.w ? (nextW * natural.w) / (natural.h * W_OVER_H) : nextW / W_OVER_H;
    setViewW(nextW);
    setOffset(clampOffset(cx - nextW / 2, cy - nextH / 2, nextW));
  };

  const scale = natural.w > 0 ? frameW / (viewW * natural.w) : 1;
  const imgW = natural.w * scale;
  const imgH = natural.h * scale;
  const imgLeft = -offset.x * natural.w * scale;
  const imgTop = -offset.y * natural.h * scale;

  return (
    <div className="pp-manual-editor">
      <div className="pp-manual-header">
        <h3>Adjust in passport frame</h3>
        <p>Rotate, drag to position, then zoom. Frame stays 35×45 portrait.</p>
      </div>

      <div className="pp-rotate-row">
        <button
          type="button"
          className="pp-btn pp-btn-ghost"
          onClick={() => setQuarterTurns((t) => t - 1)}
          title="Rotate left 90°"
        >
          ⟲ 90°
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-ghost"
          onClick={() => setFineTilt((v) => Math.max(-45, Math.round((v - 1) * 10) / 10))}
        >
          ⟲ 1°
        </button>
        <input
          type="range"
          className="pp-rotate-slider"
          min={-45}
          max={45}
          step={0.5}
          value={fineTilt}
          onChange={(e) => setFineTilt(Number(e.target.value))}
          aria-label="Fine rotation"
        />
        <button
          type="button"
          className="pp-btn pp-btn-ghost"
          onClick={() => setFineTilt((v) => Math.min(45, Math.round((v + 1) * 10) / 10))}
        >
          1° ⟳
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-ghost"
          onClick={() => setQuarterTurns((t) => t + 1)}
          title="Rotate right 90°"
        >
          90° ⟳
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-ghost"
          onClick={() => {
            setQuarterTurns(0);
            setFineTilt(0);
          }}
        >
          Reset
        </button>
      </div>
      <p className="pp-zoom-hint">Rotation: {rotation.toFixed(1)}°</p>

      <div className="pp-fixed-frame-wrap">
        <div
          ref={frameRef}
          className="pp-fixed-frame"
          style={{ width: frameW, height: frameH, aspectRatio: '35 / 45' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="presentation"
        >
          {natural.w > 0 ? (
            <img
              className="pp-fixed-frame-img"
              src={displayUrl}
              alt="Position subject in frame"
              draggable={false}
              style={{ width: imgW, height: imgH, left: imgLeft, top: imgTop }}
            />
          ) : (
            <div className="pp-fixed-frame-loading">Loading photo…</div>
          )}
          <span className="pp-fixed-frame-badge">35 × 45 mm · portrait</span>
        </div>
      </div>

      <div className="pp-zoom-slider-row">
        <span className="pp-zoom-label">−</span>
        <input
          type="range"
          className="pp-zoom-slider"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={0.005}
          value={sliderValue}
          onChange={onZoomChange}
          aria-label="Zoom"
        />
        <span className="pp-zoom-label">+</span>
      </div>
      <p className="pp-zoom-hint">Drag photo · slider zooms in/out</p>

      <div className="pp-manual-controls">
        <button type="button" className="pp-btn pp-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="pp-btn pp-btn-primary"
          disabled={!natural.w}
          onClick={() =>
            onApply({
              x: offset.x,
              y: offset.y,
              w: viewW,
              h: normH(viewW),
              rotation,
            })
          }
        >
          Apply crop
        </button>
      </div>
    </div>
  );
}

export default ManualCropEditor;
