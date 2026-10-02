export function drawShape(ctx, s) {
  ctx.strokeStyle = s.color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.beginPath();
  if (s.type === 'rect') ctx.rect(s.x, s.y, s.w, s.h);
  if (s.type === 'ellipse') {
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, Math.abs(s.w / 2), Math.abs(s.h / 2), 0, 0, Math.PI * 2);
  }
  ctx.stroke();
}

// Dots follow pan and zoom, which makes movement easy to see
function drawGrid(ctx, canvas, view, dpr) {
  const step = 24 * view.scale;
  if (step < 8) return; // too dense when zoomed far out, skip it
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const ox = ((view.x % step) + step) % step;
  const oy = ((view.y % step) + step) % step;
  ctx.fillStyle = '#d6d6cf';
  for (let x = ox; x < w; x += step) {
    for (let y = oy; y < h; y += step) {
      ctx.fillRect(x * dpr, y * dpr, 1.5 * dpr, 1.5 * dpr);
    }
  }
}

export function drawScene(canvas, shapes, draft, view, selectedId) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // 1) Screen space: clear and draw the grid
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas, view, dpr);

  // 2) World space: apply pan and zoom, then draw shapes
  ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, view.x * dpr, view.y * dpr);
  shapes.forEach((s) => { if (s.id !== draft?.id) drawShape(ctx, s); });
  if (draft) drawShape(ctx, draft);

  // 3) Selection box, sized so it looks the same at every zoom level
  const selected = draft?.id && draft.id === selectedId
    ? draft
    : shapes.find((s) => s.id === selectedId);
  if (selected) {
    const m = 6 / view.scale;
    ctx.save();
    ctx.setLineDash([6 / view.scale, 4 / view.scale]);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5 / view.scale;
    ctx.strokeRect(
      Math.min(selected.x, selected.x + selected.w) - m,
      Math.min(selected.y, selected.y + selected.h) - m,
      Math.abs(selected.w) + m * 2,
      Math.abs(selected.h) + m * 2
    );
    ctx.restore();
  }
}