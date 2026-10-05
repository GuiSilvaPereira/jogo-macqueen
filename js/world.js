'use strict';
/* Cenário do deserto: céu, montanhas, mesas de pedra, chão, postes, arquibancadas e pista.
   As camadas distantes são pré-desenhadas uma vez e repetidas (efeito parallax). */
const World = { key: '' };

function asphalt() {
  if (World.asph) return World.asph;
  const s = 256, cnv = document.createElement('canvas'); cnv.width = cnv.height = s;
  const c = cnv.getContext('2d'), img = c.createImageData(s, s), d = img.data;
  for (let i = 0; i < s * s; i++) {
    const n = 62 + Math.random() * 24 + (Math.random() < 0.025 ? 45 : 0);
    d[i * 4] = n; d[i * 4 + 1] = n; d[i * 4 + 2] = n + 6; d[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  const r = srand(5);
  for (let i = 0; i < 12; i++) {
    const x = r() * s, y = r() * s, rx = 10 + r() * 30, ry = 4 + r() * 10;
    c.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`;
    for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) ell(c, x + ox, y + oy, rx, ry);
  }
  return (World.asph = ctx.createPattern(cnv, 'repeat'));
}

function cactusArt(c, x, base, s) {
  const w = s * 0.2;
  c.fillStyle = 'rgba(80,50,20,.25)'; ell(c, x + w * 0.4, base, w * 1.3, w * 0.25);
  const g = c.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, '#7cc66a'); g.addColorStop(0.45, '#3f8f3c'); g.addColorStop(1, '#1d5422');
  c.fillStyle = g;
  rr(c, x - w / 2, base - s, w, s, w / 2); c.fill();
  const aw = w * 0.72;
  rr(c, x - w * 1.25, base - s * 0.48, w * 0.9, aw, aw / 2); c.fill();
  rr(c, x - w * 1.25, base - s * 0.78, aw, s * 0.34, aw / 2); c.fill();
  rr(c, x + w * 0.3, base - s * 0.6, w * 0.95, aw, aw / 2); c.fill();
  rr(c, x + w * 0.53, base - s * 0.9, aw, s * 0.34, aw / 2); c.fill();
  c.strokeStyle = 'rgba(10,50,10,.3)'; c.lineWidth = Math.max(0.6, w * 0.06);
  c.beginPath(); for (const dx of [-0.2, 0.15]) { c.moveTo(x + dx * w, base - s + w * 0.4); c.lineTo(x + dx * w, base); } c.stroke();
}
function bush(c, x, y, s) {
  c.fillStyle = 'rgba(80,50,20,.25)'; ell(c, x, y, s * 1.2, s * 0.25);
  const cols = ['#6f7f45', '#8a9a5b', '#a3ad6b'];
  for (let i = 0; i < 7; i++) { c.fillStyle = cols[i % 3]; circle(c, x + Math.cos(i * 2.4) * s * 0.6, y - s * 0.35 - Math.abs(Math.sin(i * 1.7)) * s * 0.4, s * 0.45); }
}
function rock(c, x, y, s) {
  c.fillStyle = 'rgba(60,40,20,.3)'; ell(c, x + s * 0.2, y, s * 1.2, s * 0.25);
  const g = c.createLinearGradient(x - s, y - s, x + s, y);
  g.addColorStop(0, '#c9ae90'); g.addColorStop(1, '#6f5844');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s * 0.9, y - s * 0.9, x - s * 0.1, y - s * 0.8);
  c.quadraticCurveTo(x + s * 0.8, y - s * 0.7, x + s, y); c.closePath(); c.fill();
}
function mesaArt(c, x, base, w, h, r) {
  const top = base - h, pts = [[x, base], [x + w * 0.1, base - h * 0.55], [x + w * 0.13, top + h * 0.05]];
  for (let i = 1; i < 8; i++) pts.push([x + w * (0.13 + 0.74 * i / 8), top + (r() - 0.3) * h * 0.06]);
  pts.push([x + w * 0.87, top + h * 0.04], [x + w * 0.9, base - h * 0.5], [x + w, base]);
  c.save(); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#f0a46a'); g.addColorStop(0.45, '#d47a45'); g.addColorStop(0.7, '#b35a30'); g.addColorStop(1, '#8a4123');
  c.fillStyle = g; c.fill(); c.clip();
  for (let i = 0; i < 9; i++) {
    const y = top + h * (0.08 + i * 0.1 + r() * 0.04);
    c.fillStyle = r() < 0.5 ? 'rgba(120,45,15,.2)' : 'rgba(255,220,180,.13)'; c.fillRect(x, y, w, h * (0.015 + r() * 0.035));
  }
  c.strokeStyle = 'rgba(80,30,10,.25)'; c.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) { const xx = x + w * (0.2 + r() * 0.65); c.beginPath(); c.moveTo(xx, top + h * 0.05); c.lineTo(xx + (r() - 0.5) * 8, top + h * (0.3 + r() * 0.4)); c.stroke(); }
  const hg = c.createLinearGradient(0, top, 0, base); hg.addColorStop(0, 'rgba(246,226,189,0)'); hg.addColorStop(1, 'rgba(246,226,189,.5)');
  c.fillStyle = hg; c.fillRect(x, top, w, h);
  c.restore();
  c.fillStyle = '#dca06c'; c.beginPath(); c.moveTo(x - w * 0.06, base); c.quadraticCurveTo(x + w * 0.08, base - h * 0.22, x + w * 0.2, base - h * 0.12);
  c.lineTo(x + w * 0.8, base - h * 0.1); c.quadraticCurveTo(x + w * 0.95, base - h * 0.2, x + w * 1.06, base); c.closePath(); c.fill();
}

/* (re)cria as camadas quando a tela muda de tamanho */
function worldBuild(horizon, groundBottom) {
  const key = [W, H, DPR, Math.round(horizon), Math.round(groundBottom)].join();
  if (World.key === key) return; World.key = key;
  const base = Math.max(W, 700);
  const mh = Math.max(40, horizon * 0.5), mw = Math.ceil(base * 1.5);
  World.mtn = { w: mw, h: mh, img: makeLayer(mw, mh, (c, w, h) => {
    const ridges = [{ ph: 0.3, amp: 0.55, b: 0.25, top: '#a3b3d6', bot: '#dde2ee' }, { ph: 2.1, amp: 0.45, b: 0.05, top: '#8b9cc6', bot: '#d3d9e8' }];
    for (const rg of ridges) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rg.top); g.addColorStop(1, rg.bot); c.fillStyle = g;
      c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 3) {
        const u = TAU * x / w;
        const n = 0.5 * Math.sin(u * 2 + rg.ph) + 0.3 * Math.sin(u * 5 + rg.ph * 2) + 0.15 * Math.sin(u * 11 + rg.ph * 3) + 0.05 * Math.sin(u * 29 + rg.ph);
        c.lineTo(x, clamp(h * (1 - rg.b - rg.amp * (0.5 + 0.5 * n)), 2, h));
      }
      c.lineTo(w, h); c.closePath(); c.fill();
    }
  }) };
  const sh = Math.max(40, horizon * 0.42), sw = Math.ceil(base * 1.25);
  World.mesa = { w: sw, h: sh, img: makeLayer(sw, sh, (c, w, h) => {
    const r = srand(7);
    for (const [fx, fw, fh] of [[0.04, 0.26, 0.85], [0.38, 0.18, 0.55], [0.62, 0.3, 1.0]]) mesaArt(c, fx * w, h, fw * w, fh * h * 0.95, r);
  }) };
  const gh = Math.max(10, groundBottom - horizon), gw = Math.ceil(base * 1.2);
  World.ground = { w: gw, h: gh, img: makeLayer(gw, gh, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#efd3a4'); g.addColorStop(0.4, '#e3b878'); g.addColorStop(1, '#cf9a58');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = srand(3), at = (x, fn) => { fn(x); fn(x - w); fn(x + w); };
    for (let i = 0; i < w * h / 80; i++) {
      const x = r() * w, y = r() * h, s = 0.6 + r() * 1.8 * (y / h + 0.3);
      c.fillStyle = r() < 0.5 ? 'rgba(140,90,40,.25)' : 'rgba(255,240,210,.3)'; c.fillRect(x, y, s, s);
    }
    const objs = []; for (let i = 0; i < 24; i++) objs.push({ x: r() * w, y: h * (0.2 + r() * 0.75), t: r(), s: r() });
    objs.sort((a, b) => a.y - b.y);
    for (const o of objs) {
      const sc = (0.25 + o.y / h * 0.75) * h;
      at(o.x, x => {
        if (o.t < 0.22) cactusArt(c, x, o.y, Math.min(sc * (0.9 + o.s * 0.5), o.y * 0.95));
        else if (o.t < 0.6) bush(c, x, o.y, sc * 0.13 * (0.7 + o.s));
        else rock(c, x, o.y, sc * 0.1 * (0.6 + o.s));
      });
    }
  }) };
  // nuvens fofinhas
  World.clouds = [0, 1, 2].map(i => makeLayer(220, 110, (c) => {
    const r = srand(11 + i);
    for (let j = 0; j < 9; j++) { const x = 40 + r() * 140, y = 60 + r() * 25, s = 30 + r() * 30; c.drawImage(soft('190,200,220'), x - s, y - s + 8, s * 2, s * 2); }
    for (let j = 0; j < 12; j++) { const x = 40 + r() * 140, y = 45 + r() * 30, s = 26 + r() * 30; c.drawImage(soft('255,255,255'), x - s, y - s, s * 2, s * 2); }
  }));
}

function drawTiled(L, off, y, scale = 1) {
  const w = L.w * scale, h = L.h * scale;
  for (let x = -mod(off, w); x < W; x += w) ctx.drawImage(L.img, x, y, w + 0.5, h);
}

function drawSky(horizon, cloudOff = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, '#2b7fd4'); g.addColorStop(0.55, '#7cc1f0'); g.addColorStop(1, '#f6e2bd');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 2);
  const m = Math.min(W, H), sx = W * 0.82, sy = horizon * 0.28;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(soft('255,235,190'), sx - m * 0.4, sy - m * 0.4, m * 0.8, m * 0.8);
  ctx.restore();
  ctx.fillStyle = '#fffbea'; circle(ctx, sx, sy, m * 0.045);
  if (World.clouds) for (let i = 0; i < 5; i++) {
    const s = m * (0.0035 + 0.0012 * (i % 3)), w = 220 * s, h = 110 * s;
    const x = mod(i * W * 0.41 - cloudOff * 0.03 - now * 6, W + w * 2) - w;
    ctx.drawImage(World.clouds[i % 3], x, horizon * (0.02 + 0.13 * (i % 3)), w, h);
  }
}

/* céu + montanhas + mesas + chão do deserto */
function desertScene(off, horizon, groundBottom) {
  worldBuild(horizon, groundBottom);
  drawSky(horizon, off);
  drawTiled(World.mtn, off * 0.03, horizon - World.mtn.h + 1);
  drawTiled(World.mesa, off * 0.1, horizon - World.mesa.h + 1);
  drawTiled(World.ground, off * 0.35, horizon);
}

/* postes de telefone com fios (dão sensação de velocidade) */
function drawPoles(off, base, h) {
  const P = Math.max(W * 0.55, 280), o = off * 0.7, tops = [];
  const pw = Math.max(3, h * 0.03);
  for (let x = -mod(o, P) - P; x < W + P; x += P) {
    const g = ctx.createLinearGradient(x - pw, 0, x + pw, 0); g.addColorStop(0, '#8a6a4a'); g.addColorStop(1, '#4a3420');
    ctx.fillStyle = g; ctx.fillRect(x - pw / 2, base - h, pw, h);
    ctx.fillStyle = '#5a4128'; ctx.fillRect(x - h * 0.13, base - h * 0.93, h * 0.26, pw * 0.8);
    ctx.fillStyle = '#d8e4e8'; for (const d of [-0.11, 0, 0.11]) circle(ctx, x + d * h, base - h * 0.94, pw * 0.4);
    tops.push(x);
  }
  ctx.strokeStyle = 'rgba(40,30,20,.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i < tops.length - 1; i++) for (const d of [-0.11, 0.11]) {
    const x1 = tops[i] + d * h, x2 = tops[i + 1] + d * h, y = base - h * 0.94;
    ctx.moveTo(x1, y); ctx.quadraticCurveTo((x1 + x2) / 2, y + P * 0.07, x2, y);
  }
  ctx.stroke();
}

/* outdoors */
const SIGNS = [['⚡ KATCHAU!', '#e3161b', '#ffd21f'], ['PIT STOP DO LUIGI', '#1f9d3a', '#fff'], ['CAFÉ DA FLO', '#3b6fd6', '#fff'], ['GUINCHO DO MATE', '#7a4a20', '#ffd27a']];
function drawBillboards(off, base, s) {
  const P = Math.max(W * 1.4, 700), o = off * 0.55, k0 = Math.floor(o / P);
  for (let k = -1; k <= Math.ceil(W / P) + 1; k++) {
    const idx = k + k0; if (hash(idx + 50) < 0.35) continue;
    const x = k * P - mod(o, P) + P * 0.3 * hash(idx + 9), sg = SIGNS[Math.floor(hash(idx + 3) * SIGNS.length)];
    const bw = s * 2.6, bh = s * 0.9, top = base - s * 1.7;
    ctx.fillStyle = '#5b4632'; ctx.fillRect(x + bw * 0.2, top + bh, s * 0.06, base - top - bh); ctx.fillRect(x + bw * 0.75, top + bh, s * 0.06, base - top - bh);
    const g = ctx.createLinearGradient(0, top, 0, top + bh); g.addColorStop(0, shade(sg[1], 0.2)); g.addColorStop(1, shade(sg[1], -0.3));
    ctx.fillStyle = '#eee'; ctx.fillRect(x - 3, top - 3, bw + 6, bh + 6);
    ctx.fillStyle = g; ctx.fillRect(x, top, bw, bh);
    ctx.font = `900 ${bh * 0.36}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = sg[2];
    ctx.fillText(sg[0], x + bw / 2, top + bh / 2, bw * 0.9);
  }
}

/* arquibancada com torcida (excite 0-1 = pulando) */
function grandstand(x, base, w, h, excite, seed) {
  if (x > W || x + w < 0) return;
  const r = srand(seed), rows = 6, rowH = h * 0.11, top = base - h;
  ctx.fillStyle = '#4f5862'; ctx.fillRect(x, top + h * 0.12, w, h * 0.88);
  const SK = ['#f1c27d', '#c68642', '#8d5524', '#ffdbac', '#e0ac69'];
  const SH = ['#e3161b', '#ffd21f', '#1e6fe0', '#ffffff', '#2fae3a', '#ff8a00', '#ff5fa8'];
  for (let i = 0; i < rows; i++) {
    const y = top + h * 0.2 + i * rowH;
    ctx.fillStyle = i % 2 ? '#8f98a2' : '#a3abb4'; ctx.fillRect(x, y + rowH * 0.62, w, rowH * 0.38);
    const pw = rowH * 0.62;
    for (let px = x + pw * 0.6 + (i % 2) * pw * 0.5; px < x + w - pw * 0.4; px += pw) {
      if (r() < 0.12) continue;
      const jump = excite * Math.max(0, Math.sin(now * 9 + px * 0.13 + i)) * rowH * 0.35;
      const by = y + rowH * 0.62 - jump;
      ctx.fillStyle = SH[Math.floor(r() * SH.length)]; rr(ctx, px - pw * 0.32, by - rowH * 0.38, pw * 0.64, rowH * 0.42, pw * 0.2); ctx.fill();
      ctx.fillStyle = SK[Math.floor(r() * SK.length)]; circle(ctx, px, by - rowH * 0.52, rowH * 0.17);
      if (excite > 0.3 && r() < 0.6) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(1, rowH * 0.08); ctx.beginPath(); ctx.moveTo(px - pw * 0.25, by - rowH * 0.3); ctx.lineTo(px - pw * 0.35, by - rowH * 0.75); ctx.moveTo(px + pw * 0.25, by - rowH * 0.3); ctx.lineTo(px + pw * 0.35, by - rowH * 0.75); ctx.stroke(); }
    }
  }
  // faixa da frente
  const fy = top + h * 0.2 + rows * rowH;
  ctx.fillStyle = '#2c3138'; ctx.fillRect(x, fy, w, base - fy);
  for (let i = 0, n = Math.max(2, Math.floor(w / (h * 0.6))); i < n; i++) {
    ctx.fillStyle = i % 2 ? '#e3161b' : '#ffd21f'; ctx.fillRect(x + i * w / n + 3, fy + 3, w / n - 6, (base - fy) - 6);
  }
  // cobertura
  const rg = ctx.createLinearGradient(0, top - h * 0.06, 0, top + h * 0.1); rg.addColorStop(0, '#dfe5ea'); rg.addColorStop(1, '#8c959e');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x - w * 0.03, top + h * 0.1); ctx.lineTo(x + w * 1.03, top - h * 0.02); ctx.lineTo(x + w * 1.03, top + h * 0.03); ctx.lineTo(x - w * 0.03, top + h * 0.15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a4048'; for (const cx of [x + 4, x + w / 2, x + w - 8]) ctx.fillRect(cx, top + h * 0.05, 4, h * 0.2);
  // bandeirinhas
  for (let i = 0; i < 8; i++) {
    const fx = x + w * (0.05 + i * 0.13), fy2 = top + h * 0.1 - (h * 0.12) * (i / 8) - h * 0.02;
    ctx.fillStyle = '#555'; ctx.fillRect(fx, fy2 - h * 0.16, 2, h * 0.16);
    ctx.fillStyle = SH[i % SH.length]; ctx.beginPath(); ctx.moveTo(fx + 2, fy2 - h * 0.16);
    ctx.lineTo(fx + 2 + h * 0.1, fy2 - h * 0.13 + Math.sin(now * 6 + i) * h * 0.015); ctx.lineTo(fx + 2, fy2 - h * 0.1); ctx.fill();
  }
}

/* guard-rail metálico atrás da zebra */
function guardrail(off, roadTop, rh) {
  const P = 70;
  ctx.fillStyle = '#6d747b';
  for (let x = -mod(off, P); x < W; x += P) ctx.fillRect(x, roadTop - rh, 5, rh);
  for (const f of [0.15, 0.55]) {
    const y = roadTop - rh + rh * f, g = ctx.createLinearGradient(0, y, 0, y + rh * 0.28);
    g.addColorStop(0, '#f4f7f9'); g.addColorStop(0.5, '#aab3bb'); g.addColorStop(1, '#6f7880');
    ctx.fillStyle = g; ctx.fillRect(0, y, W, rh * 0.28);
  }
}

/* zebra 3D */
function kerb(y, h, off) {
  const cw = Math.max(36, W * 0.05), s0 = Math.floor(off / cw);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, y + h, W, h * 0.4);
  for (let j = 0, x = s0 * cw - off; x < W; j++, x += cw) {
    const red = mod(s0 + j, 2) === 0, g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, red ? '#ff4040' : '#ffffff'); g.addColorStop(0.3, red ? '#e3161b' : '#f2f2f2'); g.addColorStop(1, red ? '#9e0d10' : '#b9b9b9');
    ctx.fillStyle = g; ctx.fillRect(x, y, cw + 0.5, h);
  }
}

function drawRoad(off, top, bottom) {
  const h = bottom - top;
  ctx.save(); ctx.translate(-mod(off, 256), 0); ctx.fillStyle = asphalt(); ctx.fillRect(0, top, W + 256, h); ctx.restore();
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(0.25, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(255,255,255,.06)');
  ctx.fillStyle = g; ctx.fillRect(0, top, W, h);
  for (const f of [0.34, 0.8]) {
    const y = top + h * f, gg = ctx.createLinearGradient(0, y - h * 0.08, 0, y + h * 0.08);
    gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(0.5, 'rgba(0,0,0,.16)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gg; ctx.fillRect(0, y - h * 0.08, W, h * 0.16);
  }
  const kh = Math.max(8, h * 0.05);
  kerb(top, kh, off);
  ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fillRect(0, top + kh * 1.5 + h * 0.02, W, Math.max(2, h * 0.012));
  const dw = Math.max(50, W * 0.09), my = top + h * 0.57;
  ctx.fillStyle = 'rgba(245,245,235,.85)';
  for (let x = -mod(off, dw * 2); x < W; x += dw * 2) ctx.fillRect(x, my - h * 0.008, dw, Math.max(3, h * 0.016));
  kerb(bottom - kh * 0.8, kh * 0.8, off);
}

function vignette(a = 0.3) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
