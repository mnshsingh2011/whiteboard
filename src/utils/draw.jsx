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

export function drawScene(canvas, shapes, draft, view, selectedId) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Clear everything, then apply pan/zoom for drawing
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, view.x * dpr, view.y * dpr);

  // Skip the stored copy of a shape while its draft is being moved
  shapes.forEach((s) => { if (s.id !== draft?.id) drawShape(ctx, s); });
  if (draft) drawShape(ctx, draft);

  // Dashed box around the selected shape
  const selected = draft?.id && draft.id === selectedId
    ? draft
    : shapes.find((s) => s.id === selectedId);
  if (selected) {
    const m = 6;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      Math.min(selected.x, selected.x + selected.w) - m,
      Math.min(selected.y, selected.y + selected.h) - m,
      Math.abs(selected.w) + m * 2,
      Math.abs(selected.h) + m * 2
    );
    ctx.restore();
  }
}