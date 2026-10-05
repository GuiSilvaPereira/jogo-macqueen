'use strict';
/* Personagens e desenho dos carros (coordenadas: comprimento 200, chão em y=0, frente para a direita) */
const CARS = [
  { id: 'mcqueen', short: 'McQueen', say: 'Relâmpago McQueen! Katchau!', color: '#e3161b', dark: '#7d080b', kind: 'sport', bolt: true, spoiler: true, rim: '#d4161b', eye: '#2f7fd8', seed: 0, horn: 'normal' },
  { id: 'mate', short: 'Mate', say: 'Mate! O melhor guincho do mundo!', color: '#a0612e', dark: '#4f2b10', kind: 'truck', rim: '#8c8c8c', eye: '#3f8f4a', seed: 1.3, horn: 'aooga' },
  { id: 'sally', short: 'Sally', say: 'Sally!', color: '#5fb6e8', dark: '#1d6795', kind: 'sport2', rim: '#d9dde2', eye: '#2f6fd0', seed: 2.1, horn: 'soft' },
  { id: 'doc', short: 'Doc', say: 'Doc Hudson!', color: '#1d3f8f', dark: '#0a1c45', kind: 'classic', num: '51', rim: '#d9dde2', eye: '#4b6fa8', seed: 0.7, horn: 'low' },
  { id: 'luigi', short: 'Luigi', say: 'Luigi! Pit stop!', color: '#f5c518', dark: '#8a6c00', kind: 'small', rim: '#d9dde2', eye: '#7a4b1f', seed: 2.8, horn: 'high' },
];
const RIVAL = { id: 'chick', short: 'Chick', color: '#2f9e3a', dark: '#14501b', kind: 'sport', num: '86', spoiler: true, mustache: true, rim: '#2f9e3a', eye: '#6b4a1f', seed: 1.9, horn: 'normal' };
const KING = { id: 'king', short: 'King', color: '#5aa9e6', dark: '#174f80', kind: 'classic', num: '43', rim: '#d9dde2', eye: '#3d6fa8', seed: 0.4, horn: 'low' };
let carIdx = clamp(store.get('car', 0) | 0, 0, CARS.length - 1);
let paint = store.get('paint', {}) || {};
const curCar = () => CARS[carIdx];

function coupe(p) {
  const belt = Math.min(p.rear, p.hood) - 3, split = (p.cx0 + p.cx1) / 2 - 6;
  const winTop = 0.25 * belt + 0.75 * (p.roof + 14), wx0 = split + 4, wx1 = p.cx1 - 8;
  return {
    coupe: true, belt, rearY: p.rear, hoodY: p.hood, split,
    eyes: { x: (wx0 + wx1) / 2, y: (winTop + belt) / 2 + 2, rx: (wx1 - wx0) / 4 + 1, ry: (belt - winTop) * 0.42 },
    mouth: { x: 88, y: (p.nose - 16) / 2 - 2 }, light: { x: 91, y: p.nose - 5 }, tail: { x: -98, y: p.rear + 10 },
    exhaust: { x: -98, y: -22 }, wheels: [-62, 62],
    body(c) {
      c.moveTo(-98, -24); c.lineTo(-98, p.rear + 8); c.quadraticCurveTo(-97, p.rear, -86, p.rear);
      c.lineTo(p.cx0, p.rear - 2);
      c.bezierCurveTo(p.cx0 + 18, p.roof, p.cx1 - 22, p.roof, p.cx1, p.hood);
      c.quadraticCurveTo(88, p.hood + 2, 98, p.nose);
      c.quadraticCurveTo(103, -22, 92, -16); c.lineTo(-90, -16); c.quadraticCurveTo(-98, -16, -98, -24);
    },
    win(c) { c.moveTo(p.cx0 + 9, belt); c.bezierCurveTo(p.cx0 + 24, p.roof + 14, p.cx1 - 26, p.roof + 14, p.cx1 - 8, belt); c.closePath(); }
  };
}
const TRUCK = {
  belt: -70, rearY: -52, hoodY: -62, split: 12, eyes: { x: 31, y: -86, rx: 9.5, ry: 14 }, mouth: { x: 90, y: -36 }, light: null,
  tail: { x: -98, y: -44 }, exhaust: { x: -98, y: -21 }, wheels: [-62, 62],
  body(c) {
    c.moveTo(-98, -22); c.lineTo(-98, -52); c.lineTo(-24, -52); c.lineTo(-24, -104);
    c.quadraticCurveTo(-24, -112, -14, -112); c.lineTo(42, -112); c.quadraticCurveTo(52, -112, 55, -102);
    c.lineTo(62, -66); c.lineTo(90, -62); c.quadraticCurveTo(100, -60, 100, -48); c.lineTo(100, -24);
    c.quadraticCurveTo(100, -16, 92, -16); c.lineTo(-90, -16); c.quadraticCurveTo(-98, -16, -98, -22);
  },
  win(c) {
    c.moveTo(-9, -104); c.lineTo(41, -104); c.quadraticCurveTo(48, -104, 48, -97); c.lineTo(48, -75); c.quadraticCurveTo(48, -68, 41, -68);
    c.lineTo(-9, -68); c.quadraticCurveTo(-16, -68, -16, -75); c.lineTo(-16, -97); c.quadraticCurveTo(-16, -104, -9, -104); c.closePath();
  }
};
const SHAPES = {
  sport: coupe({ rear: -56, roof: -116, cx0: -52, cx1: 50, hood: -58, nose: -40 }),
  sport2: coupe({ rear: -52, roof: -112, cx0: -48, cx1: 50, hood: -54, nose: -36 }),
  classic: coupe({ rear: -60, roof: -114, cx0: -44, cx1: 46, hood: -60, nose: -46 }),
  small: coupe({ rear: -62, roof: -130, cx0: -66, cx1: 54, hood: -64, nose: -50 }),
  truck: TRUCK
};

function softShadow(c, rx, ry, a) {
  c.save(); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${0.55 * a})`); g.addColorStop(0.55, `rgba(0,0,0,${0.28 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}

function eye(c, x, y, rx, ry, iris, lk, blink, col, dark) {
  const g = c.createRadialGradient(x - rx * 0.2, y - ry * 0.3, 0, x, y, Math.max(rx, ry));
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#eef3f7'); g.addColorStop(1, '#b9c4ce');
  c.fillStyle = g; ell(c, x, y, rx, ry);
  if (blink) {
    c.fillStyle = col; ell(c, x, y, rx + 1, ry + 1);
    c.strokeStyle = dark; c.lineWidth = 2.5; c.beginPath();
    c.moveTo(x - rx * 0.8, y + ry * 0.1); c.quadraticCurveTo(x, y + ry * 0.55, x + rx * 0.8, y + ry * 0.1); c.stroke();
    return;
  }
  const ix = x + lk.x * rx * 0.35, iy = y + lk.y * ry * 0.3;
  const ig = c.createRadialGradient(ix, iy, 0, ix, iy, rx * 0.62);
  ig.addColorStop(0, shade(iris, 0.45)); ig.addColorStop(0.55, iris); ig.addColorStop(1, shade(iris, -0.5));
  c.fillStyle = ig; ell(c, ix, iy, rx * 0.62, ry * 0.62);
  c.fillStyle = '#080808'; ell(c, ix, iy, rx * 0.3, ry * 0.33);
  c.fillStyle = '#fff'; ell(c, ix - rx * 0.2, iy - ry * 0.24, rx * 0.16, ry * 0.15);
  c.fillStyle = 'rgba(255,255,255,.7)'; ell(c, ix + rx * 0.18, iy + ry * 0.2, rx * 0.07, ry * 0.07);
  // sombra da pálpebra
  c.save(); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.clip();
  const lg = c.createLinearGradient(0, y - ry, 0, y - ry * 0.2); lg.addColorStop(0, 'rgba(0,0,0,.3)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = lg; c.fillRect(x - rx, y - ry, rx * 2, ry); c.restore();
  c.lineWidth = 1.5; c.strokeStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.stroke();
}

function wheel(c, x, y, r, a, rim, spin) {
  const tg = c.createRadialGradient(x, y - r * 0.2, r * 0.4, x, y, r);
  tg.addColorStop(0, '#3a3a3a'); tg.addColorStop(0.75, '#1b1b1b'); tg.addColorStop(1, '#050505');
  c.fillStyle = tg; circle(c, x, y, r);
  if (spin < 0.5) {
    c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i < 18; i++) { const b = a + i * TAU / 18; c.moveTo(x + Math.cos(b) * r * 0.86, y + Math.sin(b) * r * 0.86); c.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); }
    c.stroke();
  }
  c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, r * 0.78, 0, TAU); c.stroke();
  const rg = c.createRadialGradient(x - r * 0.15, y - r * 0.2, 0, x, y, r * 0.6);
  rg.addColorStop(0, shade(rim, 0.65)); rg.addColorStop(0.6, rim); rg.addColorStop(1, shade(rim, -0.45));
  c.fillStyle = rg; circle(c, x, y, r * 0.6);
  if (spin > 0.45) {
    c.fillStyle = 'rgba(15,15,15,.45)'; c.beginPath(); c.arc(x, y, r * 0.5, 0, TAU); c.arc(x, y, r * 0.22, 0, TAU, true); c.fill('evenodd');
  } else {
    c.fillStyle = '#121212';
    for (let i = 0; i < 5; i++) { const b = a + i * TAU / 5 + TAU / 10; circle(c, x + Math.cos(b) * r * 0.36, y + Math.sin(b) * r * 0.36, r * 0.12); }
  }
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, r * 0.6, 0, TAU); c.stroke();
  const hg = c.createRadialGradient(x - r * 0.05, y - r * 0.05, 0, x, y, r * 0.18);
  hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#6d6d6d'); c.fillStyle = hg; circle(c, x, y, r * 0.17);
}

function flame(c, x, y, f) {
  const L = (18 + Math.random() * 16) * f, h = 4 + 2.5 * f;
  c.save(); c.globalCompositeOperation = 'lighter';
  c.drawImage(soft('255,140,30'), x - L * 1.2, y - L * 0.6, L * 1.4, L * 1.2);
  for (const [col, lk, hk] of [['rgba(255,80,0,.85)', 1, 1], ['rgba(255,200,40,.9)', 0.7, 0.65], ['rgba(170,215,255,.95)', 0.35, 0.35]]) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y - h * hk);
    c.quadraticCurveTo(x - L * lk * 0.6, y - h * hk * 1.2, x - L * lk, y);
    c.quadraticCurveTo(x - L * lk * 0.6, y + h * hk * 1.2, x, y + h * hk); c.closePath(); c.fill();
  }
  c.restore();
}

function decor(c, car) {
  if (car.bolt) {
    const pts = [[-62, -47], [14, -45], [6, -38], [58, -33], [-8, -26], [0, -33], [-62, -36]];
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
    const g = c.createLinearGradient(0, -47, 0, -26); g.addColorStop(0, '#fff07a'); g.addColorStop(0.5, '#ffd21f'); g.addColorStop(1, '#f39200');
    c.fillStyle = g; c.fill(); c.lineWidth = 2; c.strokeStyle = '#d06a00'; c.stroke();
    c.font = `italic 900 19px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 4; c.strokeStyle = '#fff'; c.strokeText('95', -30, -41); c.fillStyle = '#c00'; c.fillText('95', -30, -41);
  }
  if (car.num && !car.bolt) {
    c.fillStyle = '#fff'; circle(c, -6, -37, 13); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; c.stroke();
    c.font = `900 15px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = car.dark; c.fillText(car.num, -6, -36);
  }
  if (car.id === 'sally') {
    c.strokeStyle = 'rgba(15,45,90,.75)'; c.lineWidth = 2; c.beginPath();
    c.moveTo(-90, -40); c.bezierCurveTo(-80, -50, -70, -30, -60, -42); c.bezierCurveTo(-55, -48, -48, -40, -52, -36); c.stroke();
  }
  if (car.id === 'luigi') {
    ['#1f9d3a', '#fff', '#d4161b'].forEach((k, i) => { c.fillStyle = k; c.fillRect(-20 + i * 10, -46, 10, 16); });
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; c.strokeRect(-20, -46, 30, 16);
  }
  if (car.kind === 'truck') { // ferrugem
    const spots = [[-72, -38, 11, 6], [-36, -30, 9, 5], [28, -100, 7, 4], [74, -42, 9, 6], [-10, -60, 6, 9], [40, -80, 5, 4]];
    for (const [sx, sy, a, b] of spots) {
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, a); g.addColorStop(0, 'rgba(90,45,15,.85)'); g.addColorStop(1, 'rgba(120,60,20,0)');
      c.fillStyle = g; ell(c, sx, sy, a, b);
    }
  }
}

/* desenha um carro com o ponto de contato no chão em (x,y)
   o: {t: giro das rodas, spin: borrão 0-1, hop, tilt, squash, happy, look:{x,y}, blink, flame, brake, color, noShadow} */
function drawCar(c, x, y, len, car, o = {}) {
  const k = len / 200, P = SHAPES[car.kind];
  const pc = o.color !== undefined ? o.color : paint[car.id];
  const custom = pc && pc !== car.color ? pc : null;
  const col = custom || car.color, dark = custom ? shade(custom, -0.55) : car.dark;
  c.save(); c.translate(x, y);
  if (!o.noShadow) softShadow(c, 106 * k, 13 * k, o.hop ? clamp(1 - o.hop / len * 2, 0.35, 1) : 1);
  c.translate(0, -(o.hop || 0));
  c.scale(k, k);
  if (o.tilt) c.rotate(o.tilt);
  if (o.squash) c.scale(1 + o.squash, 1 - o.squash);
  if (car.kind === 'small') c.scale(0.86, 1);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (o.flame) flame(c, P.exhaust.x - 10, P.exhaust.y, o.flame);
  if (car.kind === 'truck') { // guincho
    const bg = c.createLinearGradient(-40, -52, -74, -96); bg.addColorStop(0, '#6b6b6b'); bg.addColorStop(1, '#3a3a3a');
    c.strokeStyle = bg; c.lineWidth = 9; c.beginPath(); c.moveTo(-40, -52); c.lineTo(-74, -96); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-42, -55); c.lineTo(-74, -96); c.stroke();
    c.lineWidth = 2; c.strokeStyle = '#1a1a1a'; c.beginPath(); c.moveTo(-74, -96); c.lineTo(-90, -62); c.stroke();
    c.lineWidth = 4.5; c.strokeStyle = '#4d4d4d'; c.beginPath(); c.arc(-90, -56, 6, -Math.PI / 2, Math.PI * 0.9); c.stroke();
  }
  if (car.spoiler) {
    const r = P.rearY; c.fillStyle = dark; c.fillRect(-92, r - 14, 5, 16); c.fillRect(-80, r - 14, 5, 16);
    const sg = c.createLinearGradient(0, r - 22, 0, r - 13); sg.addColorStop(0, shade(col, 0.35)); sg.addColorStop(1, shade(col, -0.35));
    rr(c, -103, r - 22, 36, 9, 3); c.fillStyle = sg; c.fill(); c.strokeStyle = dark; c.lineWidth = 2; c.stroke();
  }
  // escapamento
  const eg = c.createLinearGradient(0, P.exhaust.y - 3, 0, P.exhaust.y + 3); eg.addColorStop(0, '#e8e8e8'); eg.addColorStop(1, '#4a4a4a');
  c.fillStyle = eg; rr(c, P.exhaust.x - 8, P.exhaust.y - 3, 12, 6, 2); c.fill();
  c.fillStyle = '#111'; ell(c, P.exhaust.x - 8, P.exhaust.y, 1.5, 2.4);

  // carroceria com pintura metálica
  const bg = c.createLinearGradient(0, -115, 0, -16);
  bg.addColorStop(0, shade(col, 0.4)); bg.addColorStop(0.45, shade(col, 0.12)); bg.addColorStop(0.56, col);
  bg.addColorStop(0.82, shade(col, -0.22)); bg.addColorStop(1, shade(col, -0.55));
  c.beginPath(); P.body(c); c.fillStyle = bg; c.fill();
  c.save(); c.clip();
  const lg = c.createLinearGradient(0, -34, 0, -16); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.3)');
  c.fillStyle = lg; c.fillRect(-110, -34, 220, 20);
  const hg = c.createLinearGradient(-95, 0, 95, 0);
  hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(0.3, 'rgba(255,255,255,.65)'); hg.addColorStop(0.75, 'rgba(255,255,255,.35)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hg; ell(c, 0, P.belt + 8, 90, 3.2);
  c.fillStyle = 'rgba(0,0,0,.14)'; ell(c, 0, P.belt + 13, 90, 2);
  c.fillStyle = 'rgba(255,255,255,.4)'; ell(c, 74, P.hoodY + 5, 15, 2.4);
  c.fillStyle = 'rgba(255,255,255,.25)'; ell(c, -80, P.rearY + 4, 10, 2);
  decor(c, car);
  if (P.coupe) { // porta e maçaneta
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.4; c.beginPath();
    c.moveTo(P.split + 2, P.belt + 2); c.quadraticCurveTo(P.split + 6, -40, P.split + 3, -19); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, P.split - 18, P.belt + 6, 11, 3, 1.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(P.split - 17, P.belt + 6, 9, 0.8);
  }
  c.restore();
  c.beginPath(); P.body(c); c.lineWidth = 2.5; c.strokeStyle = dark; c.stroke();

  // vidros + olhos
  c.save(); c.beginPath(); P.win(c); c.clip();
  const wg = c.createLinearGradient(0, -125, 0, P.belt); wg.addColorStop(0, '#a9cbe8'); wg.addColorStop(0.45, '#3d5677'); wg.addColorStop(1, '#121a28');
  c.fillStyle = wg; c.fillRect(-120, -150, 240, 150);
  c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath();
  c.moveTo(P.split - 26, -150); c.lineTo(P.split - 14, -150); c.lineTo(P.split - 44, 0); c.lineTo(P.split - 56, 0); c.fill();
  c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath();
  c.moveTo(P.split - 10, -150); c.lineTo(P.split - 6, -150); c.lineTo(P.split - 36, 0); c.lineTo(P.split - 40, 0); c.fill();
  const sg = c.createLinearGradient(0, -120, 0, P.belt); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#d3e2ef');
  c.fillStyle = sg; c.fillRect(P.split + 4, -150, 120, 150);
  c.fillStyle = col; c.fillRect(P.split - 0.5, -150, 5, 150);
  const E = P.eyes, lk = o.look || { x: 0.7, y: 0 };
  const bl = o.blink !== undefined ? o.blink : mod(now + (car.seed || 0), 3.6) < 0.13;
  eye(c, E.x - E.rx + 1, E.y, E.rx, E.ry, car.eye, lk, bl, col, dark);
  eye(c, E.x + E.rx - 1, E.y, E.rx, E.ry, car.eye, lk, bl, col, dark);
  c.restore();
  c.beginPath(); P.win(c); c.lineWidth = 3; c.strokeStyle = '#1a1a20'; c.stroke();

  // lanternas e faróis
  const tl = P.tail;
  c.fillStyle = o.brake ? '#ff2a2a' : '#b3141b'; rr(c, tl.x, tl.y - 4, 5, 8, 2); c.fill();
  if (o.brake) { c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(soft('255,40,30'), tl.x - 20, tl.y - 18, 36, 36); c.restore(); }
  if (P.light) {
    const lg2 = c.createRadialGradient(P.light.x - 1, P.light.y - 1, 0, P.light.x, P.light.y, 5);
    lg2.addColorStop(0, '#ffffff'); lg2.addColorStop(1, '#ffe27a');
    c.fillStyle = lg2; ell(c, P.light.x, P.light.y, 5, 4); c.strokeStyle = dark; c.lineWidth = 1.5; c.stroke();
  }
  if (car.kind === 'truck') {
    c.fillStyle = '#777'; c.fillRect(16, -118, 8, 7);
    const lg3 = c.createRadialGradient(18, -124, 0, 20, -122, 6); lg3.addColorStop(0, '#fff'); lg3.addColorStop(1, '#ffd84a');
    c.fillStyle = lg3; circle(c, 20, -122, 6); c.strokeStyle = '#555'; c.lineWidth = 2; c.stroke();
  }
  // boca
  const m = P.mouth; c.strokeStyle = '#3a0d0d'; c.lineWidth = 3;
  if (car.mustache) {
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(m.x - 12, m.y - 4);
    c.quadraticCurveTo(m.x - 4, m.y - 12, m.x + 1, m.y - 6); c.quadraticCurveTo(m.x + 6, m.y - 12, m.x + 12, m.y - 4);
    c.quadraticCurveTo(m.x, m.y - 2, m.x - 12, m.y - 4); c.fill();
  }
  if (o.happy) {
    c.beginPath(); c.moveTo(m.x - 11, m.y - 3); c.quadraticCurveTo(m.x + 1, m.y + 15, m.x + 11, m.y - 2); c.closePath();
    c.fillStyle = '#4a0f0f'; c.fill(); c.stroke();
    c.fillStyle = '#ff6b7a'; ell(c, m.x + 1, m.y + 5, 5, 3);
    c.fillStyle = '#fff'; c.fillRect(m.x - 7, m.y - 2.5, 14, 2.5);
  } else {
    c.beginPath(); c.moveTo(m.x - 10, m.y - 2); c.quadraticCurveTo(m.x + 1, m.y + 8, m.x + 11, m.y - 1); c.stroke();
  }
  if (car.kind === 'truck') { c.fillStyle = '#fff'; c.strokeStyle = '#999'; c.lineWidth = 1; [-3, 4].forEach(dx => { c.fillRect(m.x + dx, m.y + 2, 6, 8); c.strokeRect(m.x + dx, m.y + 2, 6, 8); }); }
  // caixas de roda + rodas
  for (const wx of P.wheels) {
    const ag = c.createRadialGradient(wx, -20, 16, wx, -20, 26); ag.addColorStop(0, '#000'); ag.addColorStop(1, '#2b2b2b');
    c.fillStyle = ag; c.beginPath(); c.arc(wx, -20, 25.5, Math.PI, 0); c.fill();
  }
  for (const wx of P.wheels) wheel(c, wx, -20, 20, o.t || 0, car.rim || '#cfcfcf', o.spin || 0);
  c.restore();
}
