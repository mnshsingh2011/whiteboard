import { getBounds, getHandles } from './geometry';

export function drawShape(ctx, s) {
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.beginPath();

  if (s.type === 'rect') {
    ctx.rect(s.x, s.y, s.w, s.h);
    ctx.stroke();
  } else if (s.type === 'ellipse') {
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, Math.abs(s.w / 2), Math.abs(s.h / 2), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (s.type === 'arrow') {
    const ex = s.x + s.w, ey = s.y + s.h;
    const a = Math.atan2(s.h, s.w);
    const head = 14;
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(ex, ey);
    ctx.moveTo(ex - head * Math.cos(a - 0.4), ey - head * Math.sin(a - 0.4));
    ctx.lineTo(ex, ey);
    ctx.lineTo(ex - head * Math.cos(a + 0.4), ey - head * Math.sin(a + 0.4));
    ctx.stroke();
  } else if (s.type === 'pen') {
    const p = s.points;
    ctx.moveTo(p[0][0], p[0][1]);
    // Curve through midpoints so the stroke looks smooth, not jagged
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i][0] + p[i + 1][0]) / 2;
      const my = (p[i][1] + p[i + 1][1]) / 2;
      ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
    }
    const last = p[p.length - 1];
    ctx.lineTo(last[0], last[1]);
    ctx.stroke();
  }
}

function drawGrid(ctx, canvas, view, dpr) {
  const step = 24 * view.scale;
  if (step < 8) return;
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

function drawHandles(ctx, shape, scale) {
  const size = 9 / scale; // stays 9px on screen at any zoom
  ctx.save();
  ctx.setLineDash([]);
  ctx.lineWidth = 1.5 / scale;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#4f46e5';
  for (const h of getHandles(shape)) {
    ctx.beginPath();
    ctx.rect(h.x - size / 2, h.y - size / 2, size, size);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
export function drawScene(canvas, shapes, draft, view, selectedId) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas, view, dpr);

  ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, view.x * dpr, view.y * dpr);
  shapes.forEach((s) => { if (s.id !== draft?.id) drawShape(ctx, s); });
  if (draft) drawShape(ctx, draft);

  const selected = draft?.id && draft.id === selectedId
    ? draft
    : shapes.find((s) => s.id === selectedId);
    if (selected) {
    const b = getBounds(selected);
    ctx.save();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5 / view.scale;
    if (selected.type === 'pen') {
      // Pen strokes have no handles, so keep the dashed box with a margin
      const m = 6 / view.scale;
      ctx.setLineDash([6 / view.scale, 4 / view.scale]);
      ctx.strokeRect(b.x0 - m, b.y0 - m, b.x1 - b.x0 + m * 2, b.y1 - b.y0 + m * 2);
    } else if (selected.type !== 'arrow') {
      // Thin outline exactly on the shape's box, so the handles sit on its corners
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    }
    ctx.restore();
    drawHandles(ctx, selected, view.scale);
  }
}