// Конфеті на честь виконаної норми. Легке полотно поверх сторінки, саме прибирається.

const COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

export function confetti({ x = 0.5, y = 0.3, count = 140 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  c.width = w * dpr;
  c.height = h * dpr;
  document.body.append(c);
  const ctx = c.getContext('2d');
  if (!ctx) return c.remove();
  ctx.scale(dpr, dpr);
  const ox = w * x;
  const oy = h * y;
  const parts = Array.from({ length: count }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
    const v = 6 + Math.random() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      s: 5 + Math.random() * 6,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      round: Math.random() < 0.3,
    };
  });
  const t0 = performance.now();
  const life = 2200;
  const frame = (t) => {
    const k = (t - t0) / life;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.6) / 0.4);
      ctx.fillStyle = p.c;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.s / 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}

export function buzz(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* немає вібрації */
  }
}
