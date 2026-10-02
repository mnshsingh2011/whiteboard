import { useRef, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addShape, updateShape, select } from './boardSlice';
import { selectShapes, selectSelectedShape } from './selectors'; // CHANGED
import { drawScene } from '../../utils/draw';
import { toWorld, hitTest, moveShape, hitHandle, resizeShape } from '../../utils/geometry'; // CHANGED

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

// NEW: cursor shown when hovering each handle
const HANDLE_CURSOR = {
  nw: 'nwse-resize', se: 'nwse-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  start: 'move', end: 'move',
};

export default function Canvas() {
  const dispatch = useDispatch();
  const shapes = useSelector(selectShapes);
  const selectedId = useSelector((s) => s.board.selectedId);
  const selected = useSelector(selectSelectedShape); // NEW
  const tool = useSelector((s) => s.ui.tool);
  const color = useSelector((s) => s.ui.color);

  const canvasRef = useRef(null);
  const view = useRef({ x: 0, y: 0, scale: 1 });
  const draft = useRef(null);
  const drag = useRef(null);
  const raf = useRef(0);
  const spaceDown = useRef(false);
  const [zoom, setZoom] = useState(100);

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
      v.x = mx - (mx - v.x) * k;
      v.y = my - (my - v.y) * k;
      v.scale = next;
      setZoom(Math.round(next * 100));
      redraw();
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, [redraw]);

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
      const tol = 8 / view.current.scale;

      // NEW: check the selected shape's handles BEFORE normal hit-testing
      const handle = selected ? hitHandle(selected, p, tol) : null;
      if (handle) {
        drag.current = { start: p, orig: selected, handle };
        draft.current = selected;
        redraw();
        return;
      }

      const hit = hitTest(shapes, p, tol);
      dispatch(select(hit ? hit.id : null));
      if (hit) {
        drag.current = { start: p, orig: hit, dx: 0, dy: 0 };
        draft.current = hit;
      }
    } else if (tool === 'pen') {
      drag.current = { start: p };
      draft.current = { type: 'pen', color, points: [[p.x, p.y]] };
    } else {
      drag.current = { start: p };
      draft.current = { type: tool, color, x: p.x, y: p.y, w: 0, h: 0 };
    }
    redraw();
  }, [tool, color, shapes, selected, dispatch, redraw]);

  const onPointerMove = useCallback((e) => {
    const g = drag.current;

    // NEW: no gesture in progress, so just update the cursor when hovering a handle
    if (!g) {
      if (tool === 'select') {
        const p = toWorld(e, canvasRef.current, view.current);
        const h = selected ? hitHandle(selected, p, 8 / view.current.scale) : null;
        canvasRef.current.style.cursor = h ? HANDLE_CURSOR[h] : 'default';
      }
      return;
    }

    if (g.pan) {
      view.current.x = g.vx + e.clientX - g.sx;
      view.current.y = g.vy + e.clientY - g.sy;
      redraw();
      return;
    }

    const p = toWorld(e, canvasRef.current, view.current);

    if (g.handle) {
      // NEW: always compute from the ORIGINAL shape, never from the previous draft
      draft.current = resizeShape(g.orig, g.handle, p);
      g.resized = true;
    } else if (g.orig) {
      g.dx = p.x - g.start.x;
      g.dy = p.y - g.start.y;
      draft.current = moveShape(g.orig, g.dx, g.dy);
    } else if (draft.current.type === 'pen') {
      const pts = draft.current.points;
      const last = pts[pts.length - 1];
      if (Math.hypot(p.x - last[0], p.y - last[1]) * view.current.scale > 2) {
        pts.push([p.x, p.y]);
      }
    } else {
      draft.current = { ...draft.current, w: p.x - g.start.x, h: p.y - g.start.y };
    }
    redraw();
  }, [tool, selected, redraw]);

  const onPointerUp = useCallback(() => {
    const g = drag.current;
    if (g?.pan) {
      drag.current = null;
      return;
    }
    const d = draft.current;
    if (d && g) {
      if (g.handle) {
        // NEW: one resize = one undo step
        if (g.resized) {
          const { x, y, w, h } = d;
          dispatch(updateShape({ id: d.id, changes: { x, y, w, h } }));
        }
      } else if (g.orig) {
        if (g.dx || g.dy) {
          const changes = d.type === 'pen' ? { points: d.points } : { x: d.x, y: d.y };
          dispatch(updateShape({ id: d.id, changes }));
        }
      } else if (d.type === 'pen') {
        if (d.points.length > 2) dispatch(addShape(d));
      } else if (Math.hypot(d.w, d.h) > 4) {
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