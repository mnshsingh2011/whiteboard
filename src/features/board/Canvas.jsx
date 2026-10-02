import { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addShape, updateShape, select } from './boardSlice';
import { selectShapes } from './selectors';
import { drawScene } from '../../utils/draw';
import { toWorld, hitTest } from '../../utils/geometry';

export default function Canvas() {
  const dispatch = useDispatch();
  const shapes = useSelector(selectShapes);
  const selectedId = useSelector((s) => s.board.selectedId);
  const tool = useSelector((s) => s.ui.tool);
  const color = useSelector((s) => s.ui.color);

  const canvasRef = useRef(null);
  const view = useRef({ x: 0, y: 0, scale: 1 }); // pan/zoom (used from Week 2)
  const draft = useRef(null);                    // shape being drawn or moved
  const drag = useRef(null);                     // info about the current gesture
  const raf = useRef(0);

  // Batch redraws: many events in one frame lead to one paint
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

  // Keep the canvas pixel size in sync with its container
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

  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
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
    if (!drag.current) return;
    const p = toWorld(e, canvasRef.current, view.current);
    const { start, orig } = drag.current;
    draft.current = orig
      ? { ...orig, x: orig.x + p.x - start.x, y: orig.y + p.y - start.y }
      : { ...draft.current, w: p.x - start.x, h: p.y - start.y };
    redraw();
  }, [redraw]);

  const onPointerUp = useCallback(() => {
    const d = draft.current;
    const g = drag.current;
    if (d && g) {
      if (g.orig) {
        // Only create a history step if the shape actually moved
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
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
        cursor: tool === 'select' ? 'default' : 'crosshair',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}