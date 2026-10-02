// Convert a pointer event to board coordinates (accounts for pan and zoom)
export const toWorld = (e, canvas, view) => {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left - view.x) / view.scale,
    y: (e.clientY - r.top - view.y) / view.scale,
  };
};

// Bounding box of any shape
export const getBounds = (s) => {
  if (s.type === 'pen') {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [px, py] of s.points) {
      if (px < x0) x0 = px;
      if (py < y0) y0 = py;
      if (px > x1) x1 = px;
      if (py > y1) y1 = py;
    }
    return { x0, y0, x1, y1 };
  }
  return {
    x0: Math.min(s.x, s.x + s.w),
    y0: Math.min(s.y, s.y + s.h),
    x1: Math.max(s.x, s.x + s.w),
    y1: Math.max(s.y, s.y + s.h),
  };
};

// Return a moved copy of a shape (never mutates the original)
export const moveShape = (s, dx, dy) =>
  s.type === 'pen'
    ? { ...s, points: s.points.map(([px, py]) => [px + dx, py + dy]) }
    : { ...s, x: s.x + dx, y: s.y + dy };

// Distance from a point to a line segment
const distToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

// Return the topmost shape under the point, or null
// `tol` is the click tolerance in board units (pass 8 / scale to keep it constant on screen)
export const hitTest = (shapes, { x, y }, tol = 6) => {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];

    if (s.type === 'arrow') {
      if (distToSegment(x, y, s.x, s.y, s.x + s.w, s.y + s.h) <= tol) return s;
      continue;
    }

    const b = getBounds(s);
    if (x < b.x0 - tol || x > b.x1 + tol || y < b.y0 - tol || y > b.y1 + tol) continue;

    if (s.type === 'pen') {
      const p = s.points;
      for (let j = 1; j < p.length; j++) {
        if (distToSegment(x, y, p[j - 1][0], p[j - 1][1], p[j][0], p[j][1]) <= tol) return s;
      }
      continue;
    }

    return s; // rect / ellipse: inside the (padded) box
  }
  return null;
};

// Handle positions for a shape, in board coordinates
export const getHandles = (s) => {
  if (s.type === 'arrow') {
    return [
      { id: 'start', x: s.x, y: s.y },
      { id: 'end', x: s.x + s.w, y: s.y + s.h },
    ];
  }
  if (s.type === 'rect' || s.type === 'ellipse') {
    const { x0, y0, x1, y1 } = getBounds(s);
    return [
      { id: 'nw', x: x0, y: y0 },
      { id: 'ne', x: x1, y: y0 },
      { id: 'se', x: x1, y: y1 },
      { id: 'sw', x: x0, y: y1 },
    ];
  }
  return []; // pen: no handles yet
};

// Which handle (if any) is under the point? `tol` is in board units.
export const hitHandle = (s, { x, y }, tol) => {
  for (const h of getHandles(s)) {
    if (Math.abs(x - h.x) <= tol && Math.abs(y - h.y) <= tol) return h.id;
  }
  return null;
};

// Return a resized copy of the ORIGINAL shape for a given handle and pointer position
export const resizeShape = (s, handle, p) => {
  if (s.type === 'arrow') {
    return handle === 'start'
      ? { ...s, x: p.x, y: p.y, w: s.x + s.w - p.x, h: s.y + s.h - p.y }
      : { ...s, w: p.x - s.x, h: p.y - s.y };
  }
  // rect / ellipse: the corner opposite the dragged handle stays fixed
  const b = getBounds(s);
  const [fx, fy] = {
    nw: [b.x1, b.y1],
    ne: [b.x0, b.y1],
    se: [b.x0, b.y0],
    sw: [b.x1, b.y0],
  }[handle];
  return {
    ...s,
    x: Math.min(p.x, fx),
    y: Math.min(p.y, fy),
    w: Math.abs(p.x - fx),
    h: Math.abs(p.y - fy),
  };
};