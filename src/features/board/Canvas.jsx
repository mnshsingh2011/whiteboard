import { useRef, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addShape, updateShape, select } from './boardSlice';
import { selectShapes } from './selectors';
import { drawScene } from '../../utils/draw';
import { toWorld, hitTest } from '../../utils/geometry';

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

export default function Canvas() {
  const dispatch = useDispatch();
  const shapes = useSelector(selectShapes);
  const selectedId = useSelector((s) => s.board.selectedId);
  const tool = useSelector((s) => s.ui.tool);
  const color = useSelector((s) => s.ui.color);

  const canvasRef = useRef(null);
  const view = useRef({ x: 0, y: 0, scale: 1 });
  const draft = useRef(null);
  const drag = useRef(null);
  const raf = useRef(0);
  const spaceDown = useRef(false);
  const [zoom, setZoom] = useState(100); // only for the badge; changes rarely

  const redraw = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() =>
      drawScene(canvasRef.current, shapes, draft.current, view.current, selectedId)
    );
  }, [shapes, selectedId]);

  useEffect(() => {
    redraw();
    return () => cancelAnimationFrame(raf.current);
  }, [redraw]);

  useEffect(() => {
    const c = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const ro = new ResizeObserver(() => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      redraw();
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [redraw]);

  // Wheel zoom. Added manually because React's onWheel is passive,
  // and we need preventDefault() to stop the page from scrolling.
  useEffect(() => {
    const c = canvasRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const v = view.current;

      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * Math.exp(-e.deltaY * 0.0015)));
      const k = next / v.scale;

      // Keep the board point under the cursor fixed while scaling
      v.x = mx - (mx - v.x) * k;
      v.y = my - (my - v.y) * k;
      v.scale = next;

      setZoom(Math.round(next * 100)); // same value = no re-render
      redraw();
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, [redraw]);

  // Track the Space key (hold Space and drag to pan)
  useEffect(() => {
    const isTyping = (e) => ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
    const down = (e) => {
      if (e.code === 'Space' && !isTyping(e)) {
        e.preventDefault();
        spaceDown.current = true;
      }
    };
    const up = (e) => { if (e.code === 'Space') spaceDown.current = false; };
    const blur = () => { spaceDown.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const resetView = useCallback(() => {
    view.current = { x: 0, y: 0, scale: 1 };
    setZoom(100);
    redraw();
  }, [redraw]);

  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    // Pan: Hand tool, Space held, or middle mouse button
    if (tool === 'hand' || spaceDown.current || e.button === 1) {
      e.preventDefault();
      drag.current = {
        pan: true,
        sx: e.clientX, sy: e.clientY,
        vx: view.current.x, vy: view.current.y,
      };
      return;
    }

    const p = toWorld(e, canvasRef.current, view.current);
    if (tool === 'select') {
      const hit = hitTest(shapes, p);
      dispatch(select(hit ? hit.id : null));
      if (hit) {
        drag.current = { start: p, orig: hit };
        draft.current = hit;
      }
    } else {
      drag.current = { start: p };
      draft.current = { type: tool, color, x: p.x, y: p.y, w: 0, h: 0 };
    }
    redraw();
  }, [tool, color, shapes, dispatch, redraw]);

  const onPointerMove = useCallback((e) => {
    const g = drag.current;
    if (!g) return;

    if (g.pan) {
      view.current.x = g.vx + e.clientX - g.sx;
      view.current.y = g.vy + e.clientY - g.sy;
      redraw();
      return;
    }

    const p = toWorld(e, canvasRef.current, view.current);
    draft.current = g.orig
      ? { ...g.orig, x: g.orig.x + p.x - g.start.x, y: g.orig.y + p.y - g.start.y }
      : { ...draft.current, w: p.x - g.start.x, h: p.y - g.start.y };
    redraw();
  }, [redraw]);

  const onPointerUp = useCallback(() => {
    const g = drag.current;
    if (g?.pan) {
      drag.current = null;
      return;
    }
    const d = draft.current;
    if (d && g) {
      if (g.orig) {
        if (d.x !== g.orig.x || d.y !== g.orig.y) {
          dispatch(updateShape({ id: d.id, changes: { x: d.x, y: d.y } }));
        }
      } else if (Math.abs(d.w) > 3 || Math.abs(d.h) > 3) {
        dispatch(addShape(d));
      }
    }
    draft.current = null;
    drag.current = null;
    redraw();
  }, [dispatch, redraw]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          touchAction: 'none',
          cursor: tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : 'crosshair',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <button
        onClick={resetView}
        title="Reset view"
        style={{
          position: 'absolute', left: 12, bottom: 12, zIndex: 1,
          background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px',
        }}
      >
        {zoom}%
      </button>
    </>
  );
}