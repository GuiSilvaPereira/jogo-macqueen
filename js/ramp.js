'use strict';
/* =========================================================
   RAMPÃO — descer a rampa gigante, saltar, dar piruetas e ver quantos metros voou.
   Toque/ESPAÇO: começa · na descida = turbo · no ar = pirueta. Sempre aterrissa de pé.
   Mundo em "metros" (carro = 4 m); y cresce para baixo, como no canvas.
   ========================================================= */
function Ramp() {
  const S = { name: 'ramp', shake: 0 }, car = curCar();
  const GRAV = 16, LIP = 80, CAR = 4, HC = CAR * 0.27, TRACK = 0.35;
  const sm = u => u * u * (3 - 2 * u), dsm = u => 6 * u * (1 - u);
  // perfil da rampa: plataforma → descida → fundo → rampa de salto (até LIP)
  const rampY = x => x < 0 ? 0 : x < 60 ? 40 * sm(x / 60) : x < 70 ? 40 : 40 - 6 * Math.pow(Math.min(1, (x - 70) / 10), 2);
  const rampD = x => x < 0 ? 0 : x < 60 ? 40 * dsm(x / 60) / 60 : x < 70 ? 0 : -1.2 * Math.min(1, (x - 70) / 10);
  // morro de aterrissagem depois do salto
  const landY = x => x < LIP ? 38 : x < 220 ? 38 + 14 * sm((x - LIP) / 140) : 52;
  const landD = x => x < LIP || x >= 220 ? 0 : 14 * dsm((x - LIP) / 140) / 140;

  let state = 'ready', x = -6, y = 0, v = 0, vx = 0, vy = 0, ang = 0, w = 0, spun = 0, flips = 0, t = 0, stT = 0;
  let boostT = 0, landX = 0, collected = 0, squash = 0, wheelA = 0, hintSaid = false, puffT = 0;
  let best = store.get('rampBest', 0), newBest = false, meters = 0;
  let camX = 34, camY = 15, z = 0, wparts = [], popups = [];
  const ptrs = new Set();
  const stars = [], balloons = [];
  for (let sx = 8; sx < 58; sx += 6) stars.push({ x: sx, y: rampY(sx) - 2.4, ph: sx });
  for (const [A, R] of [[11, 70], [21, 110], [33, 165]])
    for (let sx = 90; sx < LIP + R - 8; sx += 9) stars.push({ x: sx, y: 34 - A * Math.sin(Math.PI * (sx - LIP) / R) - 1, ph: sx + A });
  for (const [bx, by, c] of [[118, 6, '#e3161b'], [140, 9, '#1e6fe0'], [162, -2, '#ffd21f'], [196, 3, '#2fae3a'], [104, 14, '#ff5fa8']]) balloons.push({ x: bx, y: by, c, ph: bx });

  const zBase = () => Math.min(W, H) * 0.26 / CAR;
  const zReady = () => Math.min(W / 100, H / 58);
  const sx = wx => W / 2 + (wx - camX) * z, sy = wy => H / 2 + (wy - camY) * z;
  // partículas no mundo (em metros), separadas das de tela
  function addW(p) { const keep = parts; parts = wparts; addP(p); wparts = parts; parts = keep; }
  function popup(txt, col = '#ffd21f') { popups.push({ txt, col, t: 0 }); }
  const center = () => ({ x: x + Math.sin(ang) * HC, y: y - Math.cos(ang) * HC });

  S.resize = () => { if (!z) z = zReady(); };
  S.resize();
  S.enter = () => { Snd.engineStart(); Snd.playMusic('home'); say(`O ${car.short} está no topo do rampão! Toca para descer!`); hintSaid = true; t = 0; };
  S.exit = () => Snd.engineStop();

  function act() {
    if (state === 'ready') {
      state = 'ramp'; v = 7; boostT = 0.5; Snd.honk(car.horn); Snd.playMusic('race'); say('Lá vai!');
    } else if (state === 'ramp') {
      v = Math.min(55, v + 3.5); boostT = 0.45; Snd.shift();
      for (let i = 0; i < 5; i++) addW({ type: 'soft', rgb: '255,170,60', alpha: 0.7, x: x - Math.cos(ang) * 2.2, y: y - 0.5, vx: -rand(4, 10), vy: rand(-3, 0), life: 0.5, size: 0.4, grow: 2 });
    } else if (state === 'air') {
      w = Math.max(-16, w - 8); Snd.whoosh();
    }
  }
  S.buttons = () => {
    const b = [homeBtn()];
    if (state === 'done' && stT > 1.4) {
      const r = clamp(Math.min(W, H) * 0.1, 38, 76);
      b.push({ x: W / 2 - r * 1.5, y: H - r * 1.4, r, e: '🔁', color: '#ffd21f', pulse: true, fn: () => go(Ramp()), key: 'ESPAÇO' });
      b.push({ x: W / 2 + r * 1.5, y: H - r * 1.4, r, e: '🏠', color: '#5fd0ff', fn: () => go(Home()), key: 'ESC' });
    }
    return b;
  };
  S.down = id => { ptrs.add(id); act(); };
  S.up = id => ptrs.delete(id);
  S.key = (code, down, rep) => {
    if (!down || rep) return;
    if (state === 'done') { if (stT > 1.4 && isAct(code)) go(Ramp()); return; }
    if (isAct(code) || code === 'ArrowUp' || code === 'ArrowRight' || code === 'KeyW' || code === 'KeyD') act();
    else if (/^Key[A-Z]$/.test(code)) Snd.honk(car.horn);
  };

  function collect(dt) {
    const c = center();
    for (const s of stars) {
      if (s.got) continue;
      const d = Math.hypot(s.x - c.x, s.y - c.y);
      if (d < 4.5 && state === 'air') { s.x = lerp(s.x, c.x, 1 - Math.exp(-dt * 5)); s.y = lerp(s.y, c.y, 1 - Math.exp(-dt * 5)); } // ímã
      if (d < 2.6) {
        s.got = true; collected++; Snd.coin();
        for (let i = 0; i < 8; i++) { const a = rand(0, TAU); addW({ type: 's', x: s.x, y: s.y, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, g: 10, life: 0.6, size: 0.35, vr: 5 }); }
      }
    }
    for (const b of balloons) {
      if (b.got || Math.hypot(b.x - c.x, b.y - c.y) > 3.6) continue;
      b.got = true; collected += 3; Snd.balloon(); Snd.coin();
      for (let i = 0; i < 18; i++) { const a = rand(0, TAU); addW({ type: 'r', x: b.x, y: b.y, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, g: 12, drag: 1.5, life: 1.2, size: 0.3, rot: rand(0, 6), vr: rand(-8, 8), color: i % 2 ? b.c : CONF[i % CONF.length] }); }
      popup('POP! +3', b.c);
    }
  }
  function land() {
    const sl = Math.atan(landD(x));
    y = landY(x); v = Math.max(8, vx * Math.cos(sl) + vy * Math.sin(sl));
    ang = sl + mod(ang - sl + Math.PI, TAU) - Math.PI; w = 0;
    state = 'ground'; landX = x; squash = 0.2; S.shake = 1;
    Snd.thud(); Snd.cheer(2.5, 1);
    for (let i = 0; i < 26; i++) addW({ type: 'soft', rgb: '210,170,120', alpha: 0.7, x: x + rand(-2.5, 2.5), y: y - 0.3, vx: rand(-9, 9), vy: rand(-7, -1), g: 6, drag: 2, life: rand(0.8, 1.4), size: 0.6, grow: 2.5 });
    meters = Math.round(landX - LIP);
    newBest = meters > best; if (newBest) { best = meters; store.set('rampBest', best); }
    popup(meters + ' METROS!');
    const fl = flips ? (flips === 1 ? ' E uma pirueta!' : ` E ${flips} piruetas!`) : '';
    setTimeout(() => say(`Uau! ${meters} metros!${fl}${newBest ? ' Novo recorde!' : ''}`), 350);
  }

  S.update = dt => {
    t += dt; boostT = Math.max(0, boostT - dt); squash *= Math.exp(-dt * 7); S.shake *= Math.exp(-dt * 5);
    for (const p of popups) p.t += dt;
    popups = popups.filter(p => p.t < 2.2);
    const hold = ptrs.size > 0 || Keys.has('Space') || Keys.has('Enter') || Keys.has('ArrowRight') || Keys.has('ArrowUp');
    if (state === 'ready') {
      if (t > 7 && !S.hinted) { S.hinted = true; say(kbMode() ? 'Aperta o espaço!' : 'Toca na tela!'); }
      Snd.engineSet(0.15 + Math.abs(Math.sin(t * 2)) * 0.1, 0);
    } else if (state === 'ramp') {
      const th = Math.atan(rampD(x));
      v = clamp(v + (GRAV * Math.sin(th) - 0.003 * v * v + (hold ? 5 : 0)) * dt, 3, 55);
      x += v * Math.cos(th) * dt; y = rampY(x); ang = lerp(ang, th, 1 - Math.exp(-dt * 14));
      if (hold) boostT = Math.max(boostT, 0.1);
      if (x >= LIP) {
        const th2 = Math.atan(rampD(LIP - 0.01));
        x = LIP; y = rampY(LIP); vx = v * Math.cos(th2); vy = v * Math.sin(th2); state = 'air';
        Snd.whoosh(); say('Uiii!');
      }
      Snd.engineSet(clamp(v / 50, 0.15, 1), hold || boostT > 0 ? 1 : 0.4);
    } else if (state === 'air') {
      vy += GRAV * dt; x += vx * dt; y += vy * dt;
      if (hold && w > -9) w = lerp(w, -9, 1 - Math.exp(-dt * 4)); // segurar = continuar girando
      const gap = landY(x) - y;
      if (vy > 0 && gap < 4 + vy * 0.3) { // perto do chão: endireita para cair de pé
        const sl = Math.atan(landD(x)), tgt = sl + TAU * Math.round((ang - sl) / TAU);
        w *= Math.exp(-dt * 12); ang = lerp(ang, tgt, 1 - Math.exp(-dt * 12));
      } else if (Math.abs(w) < 1.5) {
        const tr = Math.atan2(vy, vx) * 0.4, tgt = tr + TAU * Math.round((ang - tr) / TAU);
        ang = lerp(ang, tgt, 1 - Math.exp(-dt * 2));
      }
      ang += w * dt;
      if (w < 0) spun -= w * dt;
      w *= Math.exp(-dt * 1.1);
      if (spun >= TAU * (flips + 1) - 0.4) {
        flips++; Snd.sparkle();
        popup(flips === 1 ? 'PIRUETA!' : flips + ' PIRUETAS!', '#5fd0ff');
        say(['', 'Pirueta!', 'Duas!', 'Três!', 'Quatro!'][flips] || 'Uau!');
      }
      Snd.engineSet(0.85, 0);
      if (y >= landY(x) && vy > 0) land();
    } else if (state === 'ground') {
      const sl = Math.atan(landD(x));
      v = Math.max(0, v - (12 - GRAV * Math.sin(sl)) * dt);
      x += v * Math.cos(sl) * dt; y = landY(x); ang = lerp(ang, sl, 1 - Math.exp(-dt * 10));
      Snd.engineSet(clamp(v / 50, 0.1, 1), 0.2);
      if (v > 4 && Math.random() < dt * 25) addW({ type: 'soft', rgb: '200,165,120', alpha: 0.5, x: x - 1.3, y: y - 0.2, vx: -rand(1, 4), vy: rand(-2, 0), life: 0.7, size: 0.4, grow: 2 });
      if (v <= 0.01) { state = 'done'; stT = 0; confetti(90); Snd.fanfare(); Snd.playMusic('home'); }
    } else if (state === 'done') {
      stT += dt; if (stT < 3 && Math.random() < dt * 18) confetti(2);
      Snd.engineSet(0.12, 0);
    }
    if (state !== 'ready' && state !== 'done') collect(dt);
    Snd.loop('wind', state === 'air' || (state === 'ramp' && v > 22), { type: 'highpass', f: 1000, q: 0.4, vol: 0.07 });
    wheelA += (state === 'air' ? 0 : v) * dt / 0.4;
    // fumaça do escapamento
    puffT -= dt;
    if (puffT < 0 && (state === 'ramp' || state === 'air')) {
      puffT = boostT > 0 ? 0.03 : 0.1;
      addW({ type: 'soft', rgb: boostT > 0 ? '255,200,120' : '220,220,220', alpha: 0.45, x: x - Math.cos(ang) * 2.1 + Math.sin(ang) * 0.45, y: y - Math.sin(ang) * 2.1 - Math.cos(ang) * 0.45, vx: -rand(2, 6), vy: rand(-2, 0), life: 0.6, size: 0.25, grow: 1.6 });
    }
    { const keep = parts; parts = wparts; updP(dt); wparts = parts; parts = keep; }
    // câmera: mostra a rampa toda no começo, depois segue o carro e se afasta no ar
    const zt = state === 'ready' ? zReady() : state === 'air' ? zBase() * clamp(1 - (landY(x) - y) / 45, 0.5, 1) : zBase() * 0.85;
    z = lerp(z, zt, 1 - Math.exp(-dt * 2.2));
    const cxT = state === 'ready' ? 34 : x + clamp(state === 'air' ? vx : v, 0, 50) * 0.28;
    const cyT = state === 'ready' ? 15 : y - 2.5;
    camX = lerp(camX, cxT, 1 - Math.exp(-dt * 4)); camY = lerp(camY, cyT, 1 - Math.exp(-dt * 4));
  };

  /* ---------- desenho ---------- */
  function terrain(fy, a, b, fill) {
    const step = Math.max(0.25, 4 / z);
    ctx.beginPath(); ctx.moveTo(sx(a), H + 10);
    for (let wx = a; wx <= b; wx += step) ctx.lineTo(sx(wx), sy(fy(wx)));
    ctx.lineTo(sx(b), sy(fy(b))); ctx.lineTo(sx(b), H + 10); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function track(fy, a, b, dash) {
    const step = Math.max(0.25, 4 / z);
    ctx.beginPath();
    for (let wx = a; wx <= b; wx += step) ctx.lineTo(sx(wx), sy(fy(wx) + TRACK));
    ctx.lineTo(sx(b), sy(fy(b) + TRACK));
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    ctx.strokeStyle = '#46464c'; ctx.lineWidth = TRACK * 2 * z; ctx.stroke();
    ctx.setLineDash(dash.map(d => d * z)); ctx.strokeStyle = dash.col; ctx.lineWidth = 0.16 * z;
    ctx.beginPath();
    for (let wx = a; wx <= b; wx += step) ctx.lineTo(sx(wx), sy(fy(wx) + 0.08));
    ctx.stroke(); ctx.setLineDash([]);
  }
  function flag(wx, wy, h, col) {
    ctx.fillStyle = '#666'; ctx.fillRect(sx(wx) - 0.06 * z, sy(wy - h), 0.12 * z, h * z);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx(wx), sy(wy - h));
    ctx.lineTo(sx(wx + 1.4), sy(wy - h + 0.4 + Math.sin(now * 6 + wx) * 0.12)); ctx.lineTo(sx(wx), sy(wy - h + 0.9)); ctx.fill();
  }
  function balloon(b) {
    const bx = sx(b.x), by = sy(b.y + Math.sin(now * 2 + b.ph) * 0.4), r = 1.2 * z;
    ctx.strokeStyle = 'rgba(80,80,80,.7)'; ctx.lineWidth = Math.max(1, 0.05 * z); ctx.beginPath(); ctx.moveTo(bx, by + r * 1.2);
    ctx.quadraticCurveTo(bx + r * 0.4, by + r * 2, bx, by + r * 2.8); ctx.stroke();
    const g = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.1, bx, by, r * 1.2);
    g.addColorStop(0, shade(b.c, 0.6)); g.addColorStop(0.5, b.c); g.addColorStop(1, shade(b.c, -0.4));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(bx, by, r, r * 1.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = b.c; ctx.beginPath(); ctx.moveTo(bx - r * 0.18, by + r * 1.3); ctx.lineTo(bx + r * 0.18, by + r * 1.3); ctx.lineTo(bx, by + r * 1.15); ctx.fill();
  }

  S.draw = () => {
    const horizon = clamp(H * 0.45 + (22 - camY) * z * 0.25, H * 0.2, H * 0.75);
    desertScene(camX * z * 0.6, horizon, horizon + H * 0.14);
    ctx.fillStyle = '#cf9a58'; ctx.fillRect(0, horizon + H * 0.14 - 1, W, H);
    ctx.save();
    if (S.shake > 0.05) ctx.translate(rand(-1, 1) * S.shake * 7, rand(-1, 1) * S.shake * 7);
    const x0 = camX - W / 2 / z - 2, x1 = camX + W / 2 / z + 2;
    const excite = state === 'ground' || state === 'done' ? 1 : state === 'air' ? 0.6 : 0.15;
    grandstand(sx(125), sy(landY(190)), 70 * z, 17 * z, excite, 31);
    // morro de aterrissagem (areia)
    if (x1 > LIP) {
      const g = ctx.createLinearGradient(0, sy(36), 0, sy(70)); g.addColorStop(0, '#e6bd7f'); g.addColorStop(1, '#a8743e');
      terrain(landY, Math.max(x0, LIP), x1, g);
      for (let k = Math.floor(Math.max(x0, LIP) / 14); k * 14 < x1; k++) { // cactos e pedras
        const wx = k * 14 + hash(k) * 8; if (wx < LIP + 4) continue;
        if (hash(k + 3) < 0.5) cactusArt(ctx, sx(wx), sy(landY(wx) - 0.1), (2.5 + hash(k + 5) * 2) * z);
        else rock(ctx, sx(wx), sy(landY(wx)), (0.5 + hash(k + 7) * 0.6) * z);
      }
    }
    // montanha da rampa (pedra com camadas)
    if (x0 < LIP) {
      const g = ctx.createLinearGradient(0, sy(-2), 0, sy(60)); g.addColorStop(0, '#f0a46a'); g.addColorStop(0.5, '#cf7440'); g.addColorStop(1, '#8a4123');
      ctx.save(); terrain(rampY, Math.max(x0, -30), Math.min(x1, LIP), g); ctx.clip();
      for (let k = 1; k < 14; k++) { ctx.fillStyle = k % 2 ? 'rgba(110,40,15,.18)' : 'rgba(255,220,180,.12)'; ctx.fillRect(0, sy(k * 4.6 + 1), W, (0.5 + (k % 3) * 0.3) * z); }
      const sh = ctx.createLinearGradient(sx(LIP - 6), 0, sx(LIP), 0); sh.addColorStop(0, 'rgba(60,20,10,0)'); sh.addColorStop(1, 'rgba(60,20,10,.4)');
      ctx.fillStyle = sh; ctx.fillRect(sx(LIP - 6), 0, 6 * z, H);
      ctx.restore();
    }
    // marcos de distância e recorde
    for (let d = 20; d <= 300; d += 20) {
      const wx = LIP + d; if (wx < x0 - 3 || wx > x1 + 3) continue;
      const gy = landY(wx);
      ctx.fillStyle = '#5b4632'; ctx.fillRect(sx(wx) - 0.08 * z, sy(gy - 2.4), 0.16 * z, 2.4 * z);
      ctx.fillStyle = '#fff'; rr(ctx, sx(wx - 1.5), sy(gy - 3.6), 3 * z, 1.3 * z, 0.2 * z); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(1, 0.06 * z); ctx.stroke();
      ctx.font = `900 ${0.85 * z}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#c40000';
      ctx.fillText(d + 'm', sx(wx), sy(gy - 2.95));
    }
    if (best > 0 && LIP + best > x0 - 4 && LIP + best < x1 + 4) {
      const wx = LIP + best, gy = landY(wx);
      ctx.fillStyle = '#888'; ctx.fillRect(sx(wx) - 0.08 * z, sy(gy - 6), 0.16 * z, 6 * z);
      ctx.fillStyle = '#ffd21f'; ctx.beginPath(); ctx.moveTo(sx(wx), sy(gy - 6)); ctx.lineTo(sx(wx + 3.4), sy(gy - 5.2 + Math.sin(now * 5) * 0.2)); ctx.lineTo(sx(wx), sy(gy - 4.3)); ctx.fill();
      emoji('⭐', sx(wx + 1.2), sy(gy - 5.15), 0.8 * z);
      text('RECORDE', sx(wx), sy(gy - 6.8), 0.7 * z, '#ffd21f', '#7a4a00');
    }
    // pistas
    const d1 = [1.2, 1.2]; d1.col = '#ffffff';
    track(landY, Math.max(x0, LIP + 0.5), x1, d1);
    const d2 = [1, 1]; d2.col = '#e3161b';
    if (x0 < LIP) track(rampY, Math.max(x0, -30), Math.min(x1, 69.5), d2);
    if (x0 < LIP && x1 > 69) { const d3 = [0.6, 0.6]; d3.col = '#ffd21f'; track(rampY, 69.5, LIP, d3); }
    // bandeirinhas na descida + portão de largada
    for (let wx = 4; wx < 60; wx += 8) if (wx > x0 - 2 && wx < x1 + 2) flag(wx, rampY(wx), 2.4, CONF[(wx / 8 | 0) % 6]);
    if (x0 < 4) {
      ctx.fillStyle = '#777'; ctx.fillRect(sx(-13) - 0.1 * z, sy(-7.5), 0.2 * z, 7.5 * z); ctx.fillRect(sx(1) - 0.1 * z, sy(-7.5), 0.2 * z, 7.5 * z);
      const bw = 14, bh = 1.8;
      for (let i = 0; i < 14; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff'; ctx.fillRect(sx(-13 + i), sy(-7.5 - bh + j * bh / 2), z + 0.5, bh / 2 * z + 0.5); }
      ctx.fillStyle = '#e3161b'; rr(ctx, sx(-11), sy(-11.6), 10 * z, 2.2 * z, 0.4 * z); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, 0.12 * z); ctx.stroke();
      text('RAMPÃO', sx(-6), sy(-10.5), 1.4 * z, '#ffd21f', '#5a0000');
    }
    // estrelas e balões
    for (const s of stars) if (!s.got && s.x > x0 - 2 && s.x < x1 + 2) drawStar(ctx, sx(s.x), sy(s.y + Math.sin(now * 4 + s.ph) * 0.2), 0.9 * z, Math.sin(now * 3 + s.ph) * 0.3, true, true);
    for (const b of balloons) if (!b.got && b.x > x0 - 3 && b.x < x1 + 3) balloon(b);
    // sombra no chão durante o voo
    if (state === 'air') {
      const gy = landY(x), k = clamp(1 - (gy - y) / 40, 0.15, 1);
      ctx.save(); ctx.globalAlpha = 0.5 * k; ctx.drawImage(soft('0,0,0'), sx(x) - 2.6 * z * k, sy(gy) - 0.5 * z * k, 5.2 * z * k, 1 * z * k); ctx.restore();
    }
    // carro (gira em torno do centro)
    const c = center();
    ctx.save(); ctx.translate(sx(c.x), sy(c.y)); ctx.rotate(ang);
    drawCar(ctx, 0, HC * z, CAR * z, car, {
      noShadow: state === 'air', t: wheelA, spin: clamp(v / 40, 0, 1), squash, happy: state !== 'ready',
      flame: boostT > 0 ? 0.7 + Math.random() * 0.3 : 0, brake: state === 'ground' && v > 2,
      look: state === 'air' ? { x: 0.8, y: 0.7 } : state === 'ready' ? { x: 0.9, y: 0.6 } : { x: 0.9, y: 0.2 }
    });
    ctx.restore();
    // partículas do mundo
    ctx.save(); ctx.translate(W / 2 - camX * z, H / 2 - camY * z); ctx.scale(z, z);
    { const keep = parts; parts = wparts; drawP(); parts = keep; }
    ctx.restore();
    ctx.restore();
    drawP();
    vignette(0.28);

    // HUD
    const by = homeR() + 14, sr = clamp(Math.min(W, H) * 0.045, 18, 32);
    drawStar(ctx, W - sr * 3, by, sr, 0, true, true);
    text(String(collected), W - sr * 1.3, by + 2, sr * 1.3, '#fff', '#c47a00');
    if (best > 0 && state !== 'done') text('Recorde: ' + best + 'm', W / 2, by, clamp(H * 0.04, 15, 26), '#ffd21f', '#333');
    if (state === 'air') text(Math.max(0, Math.round(x - LIP)) + ' m', W / 2, by + clamp(H * 0.08, 30, 56), clamp(H * 0.08, 28, 56), '#fff', '#1e6fe0');
    const hs = clamp(Math.min(W, H) * 0.05, 18, 34), hy = H - hs * 1.4;
    if (state === 'ready') {
      const p = 1 + 0.1 * Math.sin(now * 6);
      if (kbMode()) { text('Aperte para descer!', W / 2, H * 0.62, hs * 1.1 * p, '#fff', '#333'); keycap('ESPAÇO', W / 2, H * 0.62 + hs * 1.9, hs * 1.6 * p); }
      else { emoji('👆', W / 2, H * 0.6, hs * 3.2 * p); text('Toque para descer!', W / 2, H * 0.6 + hs * 2.3, hs * 1.1, '#fff', '#333'); }
    } else if (state === 'ramp') text('Toque rápido = TURBO! 🔥', W / 2, hy, hs, '#ffd21f', '#333');
    else if (state === 'air') text('Toque = PIRUETA! 🔄', W / 2, hy, hs, '#5fd0ff', '#333');
    popups.forEach((p, i) => {
      const k = clamp(p.t / 0.25, 0, 1), a = clamp((2.2 - p.t) / 0.5, 0, 1), fs = Math.min(W * 0.09, H * 0.1);
      ctx.globalAlpha = a;
      text(p.txt, W / 2, H * 0.36 + (i - popups.length + 1) * fs * 1.1 - p.t * 20, fs * (0.6 + 0.4 * k), p.col, '#5a0000');
      ctx.globalAlpha = 1;
    });
    if (state === 'done') {
      const k = clamp(stT / 0.6, 0, 1), e = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2), fs = Math.min(W * 0.1, H * 0.12) * e;
      text(meters + ' METROS!', W / 2, H * 0.24, fs, '#ffd21f', '#c40000');
      let info = '⭐ ' + collected; if (flips) info += flips === 1 ? '   🔄 1 pirueta' : `   🔄 ${flips} piruetas`;
      text(info, W / 2, H * 0.24 + fs * 0.85, fs * 0.38, '#fff', '#333');
      if (newBest) text('🏆 NOVO RECORDE! 🏆', W / 2, H * 0.24 + fs * 1.45, fs * 0.42 * (1 + 0.05 * Math.sin(now * 8)), '#ffd21f', '#7a4a00');
    }
    S.buttons().forEach(drawBtn);
  };
  return S;
}
