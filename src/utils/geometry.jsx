// Convert a pointer event to board coordinates (accounts for pan and zoom)
export const toWorld = (e, canvas, view) => {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left - view.x) / view.scale,
    y: (e.clientY - r.top - view.y) / view.scale,
  };
};

// Return the topmost shape under the point, or null
export const hitTest = (shapes, { x, y }) => {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    const x0 = Math.min(s.x, s.x + s.w), x1 = Math.max(s.x, s.x + s.w);
    const y0 = Math.min(s.y, s.y + s.h), y1 = Math.max(s.y, s.y + s.h);
    if (x >= x0 - 6 && x <= x1 + 6 && y >= y0 - 6 && y <= y1 + 6) return s;
  }
  return null;
};