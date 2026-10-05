'use strict';
/* Núcleo: canvas, utilidades, entrada, partículas e botões */
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, now = 0;
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const mod = (a, n) => ((a % n) + n) % n;
const lerp = (a, b, t) => a + (b - a) * t;
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const FONT = '"Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
const FINE = !!(window.matchMedia && matchMedia('(any-pointer: fine)').matches); // tem mouse/teclado
const Keys = new Set();
let lastInput = FINE ? 'key' : 'touch';
const kbMode = () => lastInput !== 'touch';

const store = {
  get(k, d) { try { const v = localStorage.getItem('mq_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mq_' + k, JSON.stringify(v)); } catch (e) {} }
};
/* gerador pseudoaleatório com semente (cenários sempre iguais) */
function srand(seed) { let s = (Math.floor(seed * 9973) % 2147483646) + 1; return () => (s = s * 16807 % 2147483647) / 2147483647; }

/* ---------- cores ---------- */
function shade(hex, f) {
  if (hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `rgb(${r},${g},${b})`;
}
function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; }

/* ---------- formas ---------- */
function rr(c, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); c.fill(); }
function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); c.fill(); }
function text(s, x, y, size, fill = '#fff', stroke = '#b00000', align = 'center') {
  ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (stroke) { ctx.lineWidth = size * 0.2; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
function emoji(e, x, y, size, rot = 0) {
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
  ctx.font = `${size}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
  ctx.fillText(e, 0, size * 0.05); ctx.restore();
}
/* tecla desenhada (dica para quem joga no computador) */
function keycap(label, x, y, h) {
  ctx.font = `900 ${h * 0.45}px ${FONT}`;
  const w = Math.max(h, ctx.measureText(label).width + h * 0.6);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, x - w / 2, y - h / 2 + h * 0.1, w, h, h * 0.2); ctx.fill();
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd5dc');
  ctx.fillStyle = g; rr(ctx, x - w / 2, y - h / 2, w, h, h * 0.2); ctx.fill();
  ctx.strokeStyle = '#8a929b'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#2b2f36'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + 1);
  return w;
}

/* linha de dicas centralizada: itens {k:'tecla'} ou {t:'texto'} */
function hintRow(items, cx, y, h) {
  const font = `900 ${h * 0.6}px ${FONT}`, kf = `900 ${h * 0.45}px ${FONT}`, gap = h * 0.35;
  const ws = items.map(it => { ctx.font = it.k ? kf : font; const m = ctx.measureText(it.k || it.t).width; return it.k ? Math.max(h, m + h * 0.6) : m; });
  let x = cx - (ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1)) / 2;
  items.forEach((it, i) => {
    if (it.k) keycap(it.k, x + ws[i] / 2, y, h);
    else { ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = h * 0.15; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(it.t, x, y); ctx.fillStyle = '#fff'; ctx.fillText(it.t, x, y); }
    x += ws[i] + gap;
  });
}

/* sprite de brilho suave (fumaça, poeira, névoa, luz) */
const softCache = {};
function soft(rgb) {
  if (softCache[rgb]) return softCache[rgb];
  const s = 64, cnv = document.createElement('canvas'); cnv.width = cnv.height = s;
  const c = cnv.getContext('2d'), g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.45, `rgba(${rgb},.55)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, s, s);
  return (softCache[rgb] = cnv);
}
/* camada pré-desenhada (para o cenário não pesar) */
function makeLayer(w, h, fn) {
  const cnv = document.createElement('canvas');
  cnv.width = Math.max(1, Math.ceil(w * DPR)); cnv.height = Math.max(1, Math.ceil(h * DPR));
  const c = cnv.getContext('2d'); c.scale(DPR, DPR); fn(c, w, h);
  return cnv;
}

function starPath(c, x, y, r, rot) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.48 : r;
    c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  c.closePath();
}
function drawStar(c, x, y, r, rot, face = true, glow = false) {
  if (glow) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.6; c.drawImage(soft('255,210,60'), x - r * 2, y - r * 2, r * 4, r * 4); c.restore(); }
  starPath(c, x, y, r, rot);
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, '#fff6b0'); g.addColorStop(0.45, '#ffd21f'); g.addColorStop(1, '#f0a000');
  c.fillStyle = g; c.fill();
  c.lineWidth = r * 0.12; c.strokeStyle = '#c87400'; c.lineJoin = 'round'; c.stroke();
  if (face) {
    c.fillStyle = '#5a3200';
    ell(c, x - r * 0.18, y - r * 0.05, r * 0.08, r * 0.12); ell(c, x + r * 0.18, y - r * 0.05, r * 0.08, r * 0.12);
    c.strokeStyle = '#5a3200'; c.lineWidth = r * 0.07; c.beginPath(); c.arc(x, y + r * 0.08, r * 0.16, 0.2, Math.PI - 0.2); c.stroke();
  }
}

/* ---------- partículas ---------- */
let parts = [];
function addP(p) { parts.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 1, size: 6, rot: 0, vr: 0, type: 'c', color: '#fff', grow: 0, alpha: 1, drag: 0 }, p, { max: p.life || 1 })); }
function updP(dt) {
  for (const p of parts) {
    if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.rot += p.vr * dt; p.life -= dt; p.size = Math.max(0.5, p.size + p.grow * dt);
  }
  parts = parts.filter(p => p.life > 0);
  if (parts.length > 900) parts.splice(0, parts.length - 900);
}
function drawP(filter) {
  for (const p of parts) {
    if (filter && !filter(p)) continue;
    const fade = clamp(p.life / p.max * 1.6, 0, 1);
    ctx.globalAlpha = fade * p.alpha;
    if (p.type === 'c') { ctx.fillStyle = p.color; circle(ctx, p.x, p.y, p.size); }
    else if (p.type === 'soft') ctx.drawImage(soft(p.rgb), p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    else if (p.type === 'b') {
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = Math.max(1.5, p.size * 0.1);
      const g = ctx.createRadialGradient(p.x - p.size * 0.3, p.y - p.size * 0.3, 0, p.x, p.y, p.size);
      g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(0.8, 'rgba(190,230,255,.25)'); g.addColorStop(1, 'rgba(255,200,255,.5)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ell(ctx, p.x - p.size * 0.38, p.y - p.size * 0.38, p.size * 0.22, p.size * 0.14);
    }
    else if (p.type === 'drop') {
      ctx.fillStyle = 'rgba(160,215,255,.85)'; ell(ctx, p.x, p.y, p.size * 0.45, p.size);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(ctx, p.x - p.size * 0.12, p.y - p.size * 0.3, p.size * 0.12, p.size * 0.3);
    }
    else if (p.type === 'r') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.rot * 1.7)); ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9); ctx.restore(); }
    else if (p.type === 's') drawStar(ctx, p.x, p.y, p.size, p.rot, false);
    else if (p.type === 'e') emoji(p.e, p.x, p.y, p.size, p.rot);
  }
  ctx.globalAlpha = 1;
}
const CONF = ['#e3161b', '#ffd21f', '#1e6fe0', '#2fae3a', '#ff5fa8', '#ff8a00', '#ffffff'];
function confetti(n) {
  for (let i = 0; i < n; i++) addP({ type: 'r', x: rand(0, W), y: rand(-60, -10), vx: rand(-60, 60), vy: rand(80, 260), g: 120, drag: 0.6, life: rand(2.5, 4), size: rand(5, 10), rot: rand(0, 6), vr: rand(-8, 8), color: CONF[i % CONF.length] });
}
function burst(x, y, n, color, speed, size, type = 'c') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(speed * 0.4, speed);
    addP({ type, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: speed * 0.8, drag: 1, life: rand(0.5, 0.9), size: rand(size * 0.5, size), rot: rand(0, 6), vr: rand(-6, 6), color: Array.isArray(color) ? color[i % color.length] : color });
  }
}

/* ---------- botões ---------- */
function drawBtn(b) {
  const pr = b.pulse ? 1 + 0.07 * Math.sin(now * 5) : 1, r = b.r * pr;
  ctx.drawImage(soft('0,0,0'), b.x - r * 1.25, b.y - r * 1.05, r * 2.5, r * 2.5);
  const g = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
  const base = b.color || '#ffffff';
  g.addColorStop(0, shade(base, 0.55)); g.addColorStop(0.7, base); g.addColorStop(1, shade(base, -0.25));
  ctx.fillStyle = g; circle(ctx, b.x, b.y, r);
  ctx.lineWidth = r * 0.1; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.95, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(ctx, b.x, b.y - r * 0.5, r * 0.6, r * 0.28);
  emoji(b.e, b.x, b.y, r * 1.05);
  if (b.label) text(b.label, b.x, b.y + r * 1.38, Math.max(14, b.r * 0.36), '#fff', '#333');
  if (b.key && kbMode()) keycap(b.key, b.x + r * 0.8, b.y - r * 0.8, Math.max(18, r * 0.42));
}
const homeR = () => clamp(Math.min(W, H) * 0.065, 24, 44);
const homeBtn = () => ({ x: homeR() + 14, y: homeR() + 14, r: homeR(), e: '🏠', color: '#ffffff', fn: () => go(Home()) });
