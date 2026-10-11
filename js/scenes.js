'use strict';
/* As quatro telas do jogo. Cada cena tem: enter, update(dt), draw, buttons, down/move/up (toque/mouse) e key (teclado). */
const isAct = c => c === 'Space' || c === 'Enter' || c === 'NumpadEnter';

/* =========================================================
   INÍCIO — escolher carro e jogo
   ========================================================= */
function Home() {
  const S = { name: 'home', hop: {} };
  function lay() {
    const port = H > W * 1.05, o = { port, cars: [] };
    o.titleY = port ? H * 0.13 : H * 0.11; o.titleS = Math.min(W * (port ? 0.085 : 0.07), H * 0.085);
    if (port) {
      const len = Math.min(W / 3.9, H * 0.19);
      [[0, 1, 2], [3, 4]].forEach((row, ri) => row.forEach((ci, j) => o.cars.push({ ci, len, x: W * (j + 1) / (row.length + 1), y: H * (0.42 + ri * 0.16) })));
      o.horizon = H * 0.25; o.roadTop = H * 0.31; o.roadBot = H * 0.63;
    } else {
      const len = Math.min(W / 5.8, H * 0.32);
      CARS.forEach((c, i) => o.cars.push({ ci: i, len, x: W * (i + 0.5) / 5, y: H * 0.63 }));
      o.horizon = H * 0.36; o.roadTop = H * 0.44; o.roadBot = H * 0.71;
    }
    o.br = port ? Math.min(W * 0.095, H * 0.06) : Math.min(H * 0.095, W * 0.06);
    o.by = port ? H * 0.8 : H * 0.83;
    return o;
  }
  function select(ci) {
    carIdx = ci; store.set('car', carIdx); S.hop[ci] = 0.6;
    Snd.honk(CARS[ci].horn); say(CARS[ci].say);
    const p = lay().cars.find(c => c.ci === ci);
    if (p) burst(p.x, p.y - p.len * 0.3, 14, '#ffd21f', 260, p.len * 0.07, 's');
  }
  S.enter = () => { Snd.playMusic('home'); say('Escolha seu carro!'); };
  S.onUnlock = () => { Snd.playMusic('home'); say('Oi! Escolha seu carro!'); };
  S.buttons = () => {
    const o = lay(), r = clamp(Math.min(W, H) * 0.045, 18, 30), b = [];
    b.push({ x: W - r - 12, y: r + 12, r, e: Snd.on ? '🔊' : '🔇', fn: () => Snd.setOn(!Snd.on) });
    b.push({ x: W - r * 3.4 - 12, y: r + 12, r, e: Snd.musicOn ? '🎵' : '🔕', fn: () => Snd.setMusic(!Snd.musicOn) });
    const de = document.documentElement;
    if (de.requestFullscreen || de.webkitRequestFullscreen) b.push({ x: W - r * 5.8 - 12, y: r + 12, r, e: '⛶', fn: toggleFull });
    const games = [['🏁', '#ffd21f', 'Corrida', () => go(Race()), '1'], ['🧽', '#5fd0ff', 'Lava-jato', () => go(Wash()), '2'], ['🎨', '#ff7ac0', 'Pintura', () => go(Paint()), '3'], ['⛰️', '#ff9a3c', 'Rampão', () => go(Ramp()), '4']];
    games.forEach((g, i) => b.push({ x: W * (0.125 + i * 0.25), y: o.by, r: o.br, e: g[0], color: g[1], label: g[2], pulse: true, fn: g[3], key: g[4] }));
    return b;
  };
  S.down = (id, x, y) => {
    for (const p of lay().cars) if (Math.abs(x - p.x) < p.len * 0.55 && y < p.y + p.len * 0.08 && y > p.y - p.len * 0.7) { select(p.ci); return; }
  };
  S.key = (code, down, rep) => {
    if (!down || rep) return;
    if (code === 'ArrowLeft' || code === 'KeyA') select((carIdx + CARS.length - 1) % CARS.length);
    else if (code === 'ArrowRight' || code === 'KeyD') select((carIdx + 1) % CARS.length);
    else if (isAct(code) || code === 'Digit1' || code === 'Numpad1') { Snd.pop(); go(Race()); }
    else if (code === 'Digit2' || code === 'Numpad2') { Snd.pop(); go(Wash()); }
    else if (code === 'Digit3' || code === 'Numpad3') { Snd.pop(); go(Paint()); }
    else if (code === 'Digit4' || code === 'Numpad4') { Snd.pop(); go(Ramp()); }
    else if (code === 'KeyF') toggleFull();
    else if (code === 'KeyH') Snd.honk(curCar().horn);
  };
  S.update = dt => { for (const k in S.hop) S.hop[k] = Math.max(0, S.hop[k] - dt); };
  S.draw = () => {
    const o = lay();
    desertScene(0, o.horizon, o.roadTop);
    ctx.fillStyle = '#cf9a58'; ctx.fillRect(0, o.roadBot, W, H - o.roadBot);
    const sg = ctx.createLinearGradient(0, o.roadBot, 0, H); sg.addColorStop(0, '#d9a764'); sg.addColorStop(1, '#b98445');
    ctx.fillStyle = sg; ctx.fillRect(0, o.roadBot, W, H - o.roadBot);
    guardrail(0, o.roadTop, Math.max(10, (o.roadTop - o.horizon) * 0.3));
    drawRoad(0, o.roadTop, o.roadBot);
    const ts = o.titleS * (1 + 0.03 * Math.sin(now * 3));
    text('⚡ KATCHAU! ⚡', W / 2, o.titleY, ts, '#ffd21f', '#c40000');
    for (const p of o.cars) {
      const car = CARS[p.ci], sel = p.ci === carIdx, ht = S.hop[p.ci] || 0;
      const hop = ht > 0 ? Math.sin((1 - ht / 0.6) * Math.PI) * p.len * 0.25 : (sel ? Math.abs(Math.sin(now * 4)) * p.len * 0.02 : 0);
      if (sel) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.drawImage(soft('255,230,120'), p.x - p.len * 0.8, p.y - p.len * 0.85, p.len * 1.6, p.len * 1.1); ctx.restore(); }
      drawCar(ctx, p.x, p.y, p.len * (sel ? 1.12 : 0.95), car, { hop, happy: sel || ht > 0, t: sel ? now * 3 : 0 });
      text(car.short, p.x, p.y + p.len * 0.14, Math.max(13, p.len * 0.13), sel ? '#ffd21f' : '#ffffff', sel ? '#c40000' : '#333');
    }
    if (kbMode() && W >= 560) hintRow([{ k: '←' }, { k: '→' }, { t: 'escolher' }, { t: '   ' }, { k: 'ESPAÇO' }, { t: 'correr' }], W / 2, o.titleY + o.titleS * 0.85, clamp(H * 0.045, 18, 28));
    drawP();
    S.buttons().forEach(drawBtn);
    vignette(0.22);
  };
  return S;
}

/* =========================================================
   CORRIDA — segure (dedo, mouse ou ESPAÇO) para acelerar; ↑ ↓ para mudar de faixa
   ========================================================= */
function Race() {
  const S = { name: 'race', shake: 0 }, car = curCar();
  const maxV = Math.max(W, 600) * 0.95, L = maxV * 22;
  let dist = 0, v = 0, py = 0, ty = 0, prevPy = 0, tilt = 0, stars = [], nextStar = 0, t = 0;
  let count = 3.8, lastCount = 5, goT = 0, touched = false, hintSaid = false, done = false, doneT = 0, collected = 0;
  let wheelA = 0, puffT = 0, hudPop = 0, gear = 0, skid = null, holding = false;
  const ptrs = new Set();
  let carLen, roadTop, playerX, yMin, yMax, railH;
  const rivals = [
    { car: RIVAL, f: 0.06, off: 0, k: 0.56, w: 0.7, ph: 0, hi: 1.5, wheelA: 0 },
    { car: KING, f: 0.42, off: 0, k: 0.5, w: 0.5, ph: 2, hi: 0.7, wheelA: 0 }
  ];
  S.resize = () => {
    const port = H > W * 1.05;
    roadTop = port ? H * 0.58 : H * 0.5; carLen = clamp(port ? W * 0.36 : Math.min(W * 0.27, H * 0.33), 90, 330); playerX = W * (port ? 0.34 : 0.3);
    yMin = roadTop + carLen * 0.3; yMax = H - carLen * 0.08; railH = Math.max(12, H * 0.035);
    if (!py) { py = lerp(yMin, yMax, 0.85); ty = py; prevPy = py; }
    py = clamp(py, yMin, yMax);
  };
  S.resize(); nextStar = W * 0.9;
  S.enter = () => { Snd.engineStart(); Snd.playMusic(null); say(`Prepara, ${car.short}!`); };
  S.exit = () => Snd.engineStop();
  S.buttons = () => {
    const b = [homeBtn()];
    if (done && doneT > 1.8) {
      const r = clamp(Math.min(W, H) * 0.11, 40, 80);
      b.push({ x: W / 2 - r * 1.5, y: H * 0.8, r, e: '🔁', color: '#ffd21f', pulse: true, fn: () => go(Race()), key: 'ESPAÇO' });
      b.push({ x: W / 2 + r * 1.5, y: H * 0.8, r, e: '🏠', color: '#5fd0ff', fn: () => go(Home()), key: 'ESC' });
    }
    return b;
  };
  S.down = (id, x, y) => { ptrs.add(id); ty = y + carLen * 0.25; };
  S.move = (id, x, y) => { if (ptrs.has(id)) ty = y + carLen * 0.25; };
  S.up = id => ptrs.delete(id);
  S.key = (code, down, rep) => {
    if (!down || rep) return;
    if (done && doneT > 1.8 && isAct(code)) { go(Race()); return; }
    if (/^Key[A-Z]$/.test(code) && !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) Snd.honk(car.horn); // apertar letras = buzina
  };

  S.update = dt => {
    t += dt; hudPop = Math.max(0, hudPop - dt * 3);
    holding = ptrs.size > 0 || Keys.has('Space') || Keys.has('ArrowRight') || Keys.has('KeyD') || Keys.has('Enter');
    const kv = (Keys.has('ArrowDown') || Keys.has('KeyS') ? 1 : 0) - (Keys.has('ArrowUp') || Keys.has('KeyW') ? 1 : 0);
    if (kv) ty = clamp(ty + kv * (yMax - yMin) * 1.5 * dt, yMin, yMax);
    if (count > 0) {
      count -= dt; const c = Math.ceil(count);
      if (c !== lastCount && c >= 1 && c <= 3) { lastCount = c; Snd.beep(false); }
      if (count <= 0) { Snd.beep(true); goT = 1; say('Vai!'); Snd.playMusic('race'); }
    }
    goT = Math.max(0, goT - dt);
    if (count <= 0 && holding) touched = true;
    if (count <= 0 && !touched && !hintSaid && t > 6) { hintSaid = true; say(kbMode() ? 'Aperta o espaço para correr!' : 'Segura o dedo na tela para correr!'); }
    const boosting = holding && count <= 0 && !done;
    const target = done || count > 0 ? 0 : boosting ? maxV : maxV * 0.3;
    v = lerp(v, target, 1 - Math.exp(-dt * (done ? 1.1 : boosting ? 1.8 : 1.4)));
    dist += v * dt;
    prevPy = py;
    py = lerp(py, clamp(ty, yMin, yMax), 1 - Math.exp(-dt * 6));
    tilt = lerp(tilt, clamp((py - prevPy) / dt / (yMax - yMin) * 0.05, -0.06, 0.06), 1 - Math.exp(-dt * 8));

    // motor com marchas
    const s = v / maxV, TH = [0, 0.18, 0.4, 0.65, 1.01];
    let g = 0; while (g < 3 && s >= TH[g + 1]) g++;
    if (g > gear && count <= 0 && !done) Snd.shift();
    gear = g;
    const within = (s - TH[g]) / (TH[g + 1] - TH[g]);
    let rpm = g === 0 ? 0.12 + within * 0.75 : 0.38 + within * 0.58;
    if (count > 0) rpm = holding ? 0.78 + Math.sin(t * 28) * 0.07 : 0.1;
    Snd.engineSet(rpm, holding && !done ? 1 : 0.25);
    // cantando pneu na largada
    const burn = count > 0 && count < 3.3 && holding;
    Snd.loop('burn', burn, { type: 'bandpass', f: 2400, q: 6, vol: 0.05 });
    wheelA += v * dt / (carLen * 0.1) + (burn ? dt * 40 : 0);

    // rivais — correm junto, mas sempre perdem no final
    const prog = dist / L;
    for (const r of rivals) {
      const rv = maxV * r.k * (1 + 0.15 * Math.sin(t * r.w + r.ph));
      if (count <= 0 && !done) { r.wheelA += rv * dt / (carLen * 0.1); r.off += (rv - v) * dt; }
      if (!done) {
        const hi = lerp(carLen * r.hi, -carLen * 2.6, clamp((prog - 0.72) / 0.2, 0, 1));
        r.off = clamp(r.off, prog > 0.8 ? -W * 3 : -carLen * 1.6, hi);
      }
      const base = lerp(yMin, yMax, r.f); let tgt = base;
      if (Math.abs(r.off) < carLen * 1.05 && Math.abs(py - base) < carLen * 0.25) tgt = base + (py > base ? -1 : 1) * carLen * 0.32;
      r.y = lerp(r.y === undefined ? base : r.y, clamp(tgt, yMin, yMax), 1 - Math.exp(-dt * 3));
    }

    // estrelas
    while (!done && nextStar < dist + W * 1.4 && nextStar < L - W * 0.2) {
      const n = Math.random() < 0.35 ? 3 : 1, gy = rand(yMin, yMax);
      for (let i = 0; i < n; i++) stars.push({ wx: nextStar + i * carLen * 0.6, gy, ph: rand(0, 6) });
      nextStar += rand(0.45, 0.75) * W + (n - 1) * carLen * 0.6;
    }
    for (const st of stars) {
      const sx = playerX + (st.wx - dist), dx = sx - (playerX + carLen * 0.1), dy = st.gy - py;
      if (Math.abs(dx) < carLen * 1.3 && Math.abs(dy) < carLen * 0.7) st.gy = lerp(st.gy, py, 1 - Math.exp(-dt * 4)); // ímã
      if (Math.abs(dx) < carLen * 0.6 && Math.abs(dy) < carLen * 0.35) {
        st.got = true; collected++; hudPop = 1; Snd.coin();
        burst(sx, st.gy - carLen * 0.35, 10, '#ffd21f', 300, carLen * 0.06, 's');
      }
    }
    stars = stars.filter(st => !st.got && playerX + (st.wx - dist) > -200);

    // fumaça, poeira e chamas
    puffT -= dt;
    if (puffT < 0 && (v > 5 || burn)) {
      puffT = boosting || burn ? 0.03 : 0.12;
      const ex = playerX - carLen * 0.52, ey = py - carLen * 0.105;
      addP({ type: 'soft', rgb: '210,210,210', alpha: 0.5, x: ex, y: ey, vx: -v * 0.25 - 40, vy: rand(-25, -5), life: 0.7, size: carLen * 0.04, grow: carLen * 0.18 });
      if (boosting || burn) addP({ type: 'soft', rgb: burn ? '235,235,235' : '190,170,140', alpha: burn ? 0.8 : 0.4, x: playerX - carLen * 0.31, y: py - carLen * 0.03, vx: -v * 0.4 - rand(40, 120), vy: rand(-40, -10), life: burn ? 1.2 : 0.8, size: carLen * 0.06, grow: carLen * 0.3, drag: 1 });
    }
    S.shake = s > 0.75 && !done ? (s - 0.75) * 6 : 0;

    // chegada
    if (!done && dist >= L) {
      done = true; doneT = 0; Snd.playMusic(null); Snd.screech(0.9); Snd.fanfare(); Snd.cheer(3, 1.2); confetti(90);
      skid = { a: dist - carLen * 0.31, b: dist - carLen * 0.31, y: py };
      setTimeout(() => say(`Katchau! ${car.short} ganhou! Você é o campeão!`), 600);
    }
    if (done) {
      doneT += dt; if (doneT < 3 && Math.random() < dt * 20) confetti(3);
      if (v > maxV * 0.04) skid.b = dist + carLen * 0.31;
      if (doneT > 2.2 && doneT - dt <= 2.2) Snd.playMusic('home');
    }
  };

  function checker(x, y0, y1, sq) {
    for (let y = y0, r = 0; y < y1; y += sq, r++) for (let c = 0; c < 2; c++) {
      ctx.fillStyle = (r + c) % 2 ? 'rgba(20,20,20,.92)' : 'rgba(250,250,250,.92)'; ctx.fillRect(x + c * sq, y, sq, Math.min(sq, y1 - y));
    }
  }
  function drawFinish(fx) {
    const sq = (H - roadTop) / 10; checker(fx - sq, roadTop, H, sq);
    const top = roadTop - H * 0.36, pw = Math.max(5, carLen * 0.04);
    const g = ctx.createLinearGradient(fx - pw, 0, fx + pw, 0); g.addColorStop(0, '#e8e8e8'); g.addColorStop(1, '#777');
    ctx.fillStyle = g; ctx.fillRect(fx - pw / 2, top, pw, roadTop - top + 4);
    const fw = carLen * 0.95, fh = carLen * 0.6, n = 7, cs = fw / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) {
      const wave = Math.sin(now * 6 - i * 0.8) * fh * 0.08 * (i / n);
      ctx.fillStyle = (i + j) % 2 ? '#141414' : '#f6f6f6';
      ctx.fillRect(fx + pw / 2 + i * cs, top + j * fh / 4 + wave, cs + 0.6, fh / 4 + 0.6);
    }
    const bw = carLen * 1.3, bh = carLen * 0.24, by = top - bh - 6;
    const bg = ctx.createLinearGradient(0, by, 0, by + bh); bg.addColorStop(0, '#ff3b30'); bg.addColorStop(1, '#a50b10');
    ctx.fillStyle = bg; rr(ctx, fx - bw / 2, by, bw, bh, 6); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    text('CHEGADA', fx, by + bh / 2, bh * 0.6, '#ffd21f', '#5a0000');
  }
  function startLights() {
    const R = Math.min(W, H) * 0.05, cx = W / 2, cy = H * 0.2, c = Math.ceil(count);
    const lit = count > 0 ? clamp(4 - c, 0, 3) : 3, green = count <= 0;
    if (!(count > 0 || goT > 0)) return;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(ctx, cx - R * 4 + 4, cy - R * 1.4 + 6, R * 8, R * 2.8, R * 0.6); ctx.fill();
    const pg = ctx.createLinearGradient(0, cy - R * 1.4, 0, cy + R * 1.4); pg.addColorStop(0, '#3a3f46'); pg.addColorStop(1, '#14171b');
    ctx.fillStyle = pg; rr(ctx, cx - R * 4, cy - R * 1.4, R * 8, R * 2.8, R * 0.6); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * R * 2.5, on = green || i < lit, rgb = green ? '60,255,90' : '255,40,30';
      const lg = ctx.createRadialGradient(x - R * 0.3, cy - R * 0.3, 0, x, cy, R);
      if (on) { lg.addColorStop(0, '#fff'); lg.addColorStop(0.3, `rgb(${rgb})`); lg.addColorStop(1, green ? '#0a6a1a' : '#7a0a05'); }
      else { lg.addColorStop(0, '#4a2a2a'); lg.addColorStop(1, '#1a0a0a'); }
      ctx.fillStyle = lg; circle(ctx, x, cy, R);
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(soft(rgb), x - R * 2.2, cy - R * 2.2, R * 4.4, R * 4.4); ctx.restore(); }
    }
    if (count > 0 && count <= 3) { const f = count - Math.floor(count); text(String(c), cx, cy + R * 3.2, R * 2.4 * (1 + f * 0.3), '#fff', '#c40000'); }
    else if (goT > 0) text('VAI!', cx, cy + R * 3.2, R * (2.4 + (1 - goT) * 1.2), '#3cff5a', '#0a4a14');
  }
  function speedo(x, y, R, s) {
    ctx.save(); ctx.translate(x, y);
    ctx.drawImage(soft('0,0,0'), -R * 1.3, -R * 1.2, R * 2.6, R * 2.6);
    const g = ctx.createRadialGradient(0, -R * 0.3, R * 0.1, 0, 0, R); g.addColorStop(0, '#3d434c'); g.addColorStop(1, '#0e1114');
    ctx.fillStyle = g; circle(ctx, 0, 0, R);
    ctx.strokeStyle = '#c9cfd6'; ctx.lineWidth = R * 0.07; ctx.beginPath(); ctx.arc(0, 0, R * 0.96, 0, TAU); ctx.stroke();
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    ctx.strokeStyle = '#e3161b'; ctx.lineWidth = R * 0.09; ctx.beginPath(); ctx.arc(0, 0, R * 0.78, lerp(a0, a1, 0.8), a1); ctx.stroke();
    for (let i = 0; i <= 10; i++) {
      const a = lerp(a0, a1, i / 10), big = i % 2 === 0, r2 = big ? 0.66 : 0.74;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = big ? R * 0.05 : R * 0.025;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); ctx.lineTo(Math.cos(a) * R * r2, Math.sin(a) * R * r2); ctx.stroke();
    }
    text(String(Math.round(s * 240)), 0, R * 0.42, R * 0.38, '#fff', null);
    text('km/h', 0, R * 0.7, R * 0.16, '#9aa4ad', null);
    const a = lerp(a0, a1, clamp(s + Math.sin(now * 40) * 0.004 * s, 0, 1));
    ctx.rotate(a); ctx.fillStyle = '#ff3b2f'; ctx.beginPath(); ctx.moveTo(-R * 0.14, -R * 0.045); ctx.lineTo(R * 0.82, 0); ctx.lineTo(-R * 0.14, R * 0.045); ctx.closePath(); ctx.fill(); ctx.rotate(-a);
    const hg = ctx.createRadialGradient(-R * 0.03, -R * 0.03, 0, 0, 0, R * 0.12); hg.addColorStop(0, '#fff'); hg.addColorStop(1, '#666');
    ctx.fillStyle = hg; circle(ctx, 0, 0, R * 0.11);
    ctx.restore();
  }

  S.draw = () => {
    const horizon = roadTop - H * 0.1;
    ctx.save();
    if (S.shake) ctx.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));
    desertScene(dist, horizon, roadTop);
    drawBillboards(dist, roadTop - railH, (roadTop - horizon) * 0.8);
    drawPoles(dist, roadTop - railH, (roadTop - horizon) * 2.6);
    const gsH = (roadTop - horizon) * 2.4, gsW = Math.max(W * 0.9, 500);
    const excite = done ? 1 : 0.15 + 0.85 * clamp((dist / L - 0.85) / 0.15, 0, 1);
    grandstand(playerX + (-gsW * 0.35 - dist), roadTop - railH, gsW, gsH, count > 0 ? 0.4 : 0.15, 21);
    grandstand(playerX + (L - gsW * 0.6 - dist), roadTop - railH, gsW, gsH, excite, 22);
    grandstand(playerX + (L + gsW * 0.42 - dist), roadTop - railH, gsW, gsH, excite, 23);
    guardrail(dist, roadTop, railH);
    drawRoad(dist, roadTop, H);
    if (skid) { // marcas de freada
      ctx.fillStyle = 'rgba(15,15,15,.45)';
      const x0 = playerX + (skid.a - dist), x1 = playerX + (skid.b - dist);
      ctx.fillRect(x0, skid.y - carLen * 0.025, x1 - x0, carLen * 0.035);
    }
    const sx0 = playerX + carLen * 0.55 - dist; if (sx0 > -60) checker(sx0 - (H - roadTop) / 10, roadTop, H, (H - roadTop) / 10);
    const fx = playerX + carLen * 0.5 + (L - dist); if (fx < W + carLen * 2 && fx > -carLen * 3) drawFinish(fx);
    if (v > maxV * 0.6) { // linhas de velocidade
      ctx.strokeStyle = `rgba(255,255,255,${(v / maxV - 0.6) * 1.2})`; ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const y = py - carLen * (0.05 + 0.08 * i), x = playerX - carLen * (0.6 + hash(i + Math.floor(now * 12)) * 0.5);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - carLen * 0.6, y); ctx.stroke();
      }
    }
    const items = [], s = v / maxV, boosting = holding && count <= 0 && !done;
    for (const r of rivals) {
      const rx = playerX + r.off;
      if (rx < -carLen || rx > W + carLen) continue;
      items.push({ y: r.y, d: () => drawCar(ctx, rx, r.y, carLen * 0.95, r.car, { t: r.wheelA, spin: count > 0 ? 0 : 0.6, look: { x: 0.8, y: 0 }, flame: count <= 0 && !done && Math.random() < 0.3 ? 0.5 : 0 }) });
    }
    items.push({ y: py, d: () => drawCar(ctx, playerX, py, carLen, car, {
      t: wheelA, spin: s, tilt, happy: boosting || done, brake: done && v > maxV * 0.04,
      flame: boosting && s > 0.45 ? 0.6 + Math.random() * 0.4 : 0,
      hop: done ? Math.abs(Math.sin(doneT * 6)) * carLen * 0.06 * clamp(doneT - 1, 0, 1) : Math.abs(Math.sin(t * 25)) * s * carLen * 0.01
    }) });
    for (const st of stars) {
      const sx = playerX + (st.wx - dist);
      items.push({ y: st.gy, d: () => drawStar(ctx, sx, st.gy - carLen * 0.38 + Math.sin(now * 4 + st.ph) * carLen * 0.04, carLen * 0.13, Math.sin(now * 3 + st.ph) * 0.3, true, true) });
    }
    items.sort((a, b) => a.y - b.y).forEach(i => i.d());
    drawP();
    ctx.restore();
    vignette(0.3 + S.shake * 0.04);

    // HUD
    const bw = Math.min(W * 0.42, 420), bx = W / 2 - bw / 2, by = homeR() + 10;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, bx - 6, by - 10, bw + 12, 20, 10); ctx.fill();
    const pg = ctx.createLinearGradient(0, by - 5, 0, by + 5); pg.addColorStop(0, '#fff07a'); pg.addColorStop(1, '#f39200');
    ctx.fillStyle = pg; rr(ctx, bx, by - 5, Math.max(10, bw * clamp(dist / L, 0, 1)), 10, 5); ctx.fill();
    emoji('🏁', bx + bw + 18, by, 28);
    drawCar(ctx, bx + bw * clamp(dist / L, 0, 1), by + 8, 46, car, { noShadow: true, t: wheelA });
    const sr = clamp(Math.min(W, H) * 0.045, 18, 32) * (1 + hudPop * 0.35);
    drawStar(ctx, W - sr * 3, by, sr, 0, true, true);
    text(String(collected), W - sr * 1.3, by + 2, sr * 1.3, '#fff', '#c47a00');
    const R = clamp(Math.min(W, H) * 0.1, 40, 80);
    speedo(W - R - 16, by + sr + R + 14, R, s);
    startLights();
    if (count <= 0 && !touched && !done) {
      const p = 1 + 0.12 * Math.sin(now * 6);
      if (kbMode()) {
        const kh = clamp(H * 0.07, 30, 54) * p, y = H * 0.36;
        text('Segure', W / 2, y - kh * 1.1, kh * 0.55, '#fff', '#333');
        keycap('ESPAÇO', W / 2, y, kh);
        const k2 = kh * 0.75; keycap('↑', W / 2 - k2 * 0.7, y + kh * 1.25, k2); keycap('↓', W / 2 + k2 * 0.7, y + kh * 1.25, k2);
      } else {
        const sz = Math.min(W, H) * 0.14 * p;
        emoji('👆', W * 0.62, H * 0.72, sz);
        text('Segure aqui!', W * 0.62, H * 0.72 + sz * 0.85, sz * 0.3, '#fff', '#333');
      }
    }
    if (done) {
      const k = clamp(doneT / 0.6, 0, 1), e = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
      const sz = Math.min(W, H) * 0.26 * e, cy = H * 0.3;
      ctx.save(); ctx.translate(W / 2, cy); ctx.rotate(now * 0.4); ctx.fillStyle = 'rgba(255,230,120,.22)';
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sz * 1.6, -sz * 0.18); ctx.lineTo(sz * 1.6, sz * 0.18); ctx.fill(); }
      ctx.restore();
      emoji('🏆', W / 2, cy, sz, Math.sin(now * 3) * 0.08);
      text('VOCÊ GANHOU!', W / 2, cy + sz * 0.75, Math.min(W * 0.08, H * 0.09), '#ffd21f', '#c40000');
    }
    S.buttons().forEach(drawBtn);
  };
  return S;
}

/* =========================================================
   LAVA-JATO — esfregue (dedo, mouse, ESPAÇO ou setas) para tirar a lama
   ========================================================= */
function Wash() {
  const S = { name: 'wash' }, car = curCar();
  let mud, mctx, init = 1, remain = 1, len, gx, gy, bb, checkT = 0, done = false, doneT = 0, mudA = 1;
  let touched = false, sqT = 0, hopT = 0, hintSaid = false, t = 0, brush = 0, brushV = 0, kbT = 0, wall = null;
  const ptr = new Map(); let look = { x: 0.7, y: 0 };
  const kb = { x: 0, y: 0, on: false };
  function geom() {
    const port = H > W * 1.05;
    len = Math.min(W * (port ? 0.86 : 0.7), H * 0.95, 760); gx = W / 2; gy = (port ? H * 0.5 : H * 0.56) + len * 0.28;
  }
  function buildWall() {
    wall = makeLayer(W, gy, (c, w, h) => {
      const ts = Math.max(36, Math.min(W, H) * 0.085), r = srand(9);
      for (let y = 0; y < h; y += ts) for (let x = 0; x < w; x += ts) {
        const l = 0.92 + r() * 0.08, g = c.createLinearGradient(x, y, x + ts, y + ts);
        g.addColorStop(0, `rgb(${Math.round(225 * l)},${Math.round(240 * l)},${Math.round(250 * l)})`); g.addColorStop(1, `rgb(${Math.round(196 * l)},${Math.round(220 * l)},${Math.round(236 * l)})`);
        c.fillStyle = g; c.fillRect(x + 1, y + 1, ts - 2, ts - 2);
      }
      const lg = c.createRadialGradient(w / 2, 0, 0, w / 2, 0, Math.max(w, h)); lg.addColorStop(0, 'rgba(255,255,255,.35)'); lg.addColorStop(1, 'rgba(0,30,60,.25)');
      c.fillStyle = lg; c.fillRect(0, 0, w, h);
    });
  }
  function build() {
    geom(); buildWall();
    mud = document.createElement('canvas'); mud.width = cv.width; mud.height = cv.height;
    mctx = mud.getContext('2d'); mctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const tmp = document.createElement('canvas'); tmp.width = cv.width; tmp.height = cv.height;
    const tc = tmp.getContext('2d'); tc.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawCar(tc, gx, gy, len, car, { noShadow: true, blink: false });
    mctx.fillStyle = 'rgba(110,72,38,.5)'; mctx.fillRect(gx - len * 0.6, gy - len * 0.75, len * 1.2, len * 0.8);
    const cols = ['#6b4423', '#7b5230', '#5a3818', '#8a6239', '#4d2f14'];
    for (let i = 0; i < 120; i++) {
      const x = gx + rand(-0.5, 0.5) * len, y = gy - rand(0, 0.62) * len, r = len * rand(0.03, 0.07);
      for (let j = 0; j < 4; j++) {
        const cx = x + rand(-r, r), cy = y + rand(-r, r), rr2 = r * rand(0.6, 1.1);
        const g = mctx.createRadialGradient(cx - rr2 * 0.3, cy - rr2 * 0.3, 0, cx, cy, rr2);
        g.addColorStop(0, shade(cols[i % cols.length], 0.2)); g.addColorStop(1, cols[(i + 2) % cols.length]);
        mctx.fillStyle = g; circle(mctx, cx, cy, rr2);
      }
      if (i % 4 === 0) { mctx.fillStyle = cols[i % cols.length]; mctx.fillRect(x - r * 0.15, y, r * 0.3, r * 1.5); circle(mctx, x, y + r * 1.5, r * 0.22); }
    }
    mctx.fillStyle = 'rgba(40,20,5,.5)';
    for (let i = 0; i < 80; i++) circle(mctx, gx + rand(-0.5, 0.5) * len, gy - rand(0, 0.62) * len, len * rand(0.004, 0.014));
    mctx.save(); mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.globalCompositeOperation = 'destination-in'; mctx.drawImage(tmp, 0, 0); mctx.restore();
    mctx.globalCompositeOperation = 'destination-out';
    const x0 = clamp(Math.floor((gx - len * 0.56) * DPR), 0, mud.width - 1), y0 = clamp(Math.floor((gy - len * 0.72) * DPR), 0, mud.height - 1);
    const x1 = clamp(Math.ceil((gx + len * 0.56) * DPR), x0 + 1, mud.width), y1 = clamp(Math.ceil((gy + len * 0.05) * DPR), y0 + 1, mud.height);
    bb = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    init = Math.max(1, count()); remain = init; done = false; mudA = 1;
  }
  function count() {
    const d = mctx.getImageData(bb.x, bb.y, bb.w, bb.h).data; let n = 0;
    for (let i = 3; i < d.length; i += 4 * 9) if (d[i] > 60) n++;
    return n;
  }
  S.resize = () => { if (!done) build(); else { geom(); buildWall(); } };
  build();
  S.enter = () => { Snd.playMusic('wash'); say(`Ih! O ${car.short} está sujo de lama! Esfrega para lavar!`); };
  S.buttons = () => {
    const b = [homeBtn()];
    if (done && doneT > 1.6) {
      const r = clamp(Math.min(W, H) * 0.1, 36, 70);
      b.push({ x: W / 2 - r * 1.5, y: H - r * 1.3, r, e: '🔁', color: '#ffd21f', pulse: true, fn: () => go(Wash()), key: 'ESPAÇO' });
      b.push({ x: W / 2 + r * 1.5, y: H - r * 1.3, r, e: '🏠', color: '#5fd0ff', fn: () => go(Home()), key: 'ESC' });
    }
    return b;
  };
  function scrub(x0, y0, x1, y1) {
    if (done) return;
    mctx.lineCap = 'round'; mctx.lineWidth = len * 0.17; mctx.strokeStyle = '#000';
    mctx.beginPath(); mctx.moveTo(x0, y0); mctx.lineTo(x1 + 0.1, y1); mctx.stroke();
    const sp = len / 500;
    if (Math.random() < 0.6) addP({ type: 'b', x: x1 + rand(-20, 20) * sp, y: y1 + rand(-20, 20) * sp, vx: rand(-40, 40), vy: rand(-90, -30), life: rand(0.6, 1.3), size: rand(5, 15) * sp + 3, grow: 5 });
    if (Math.random() < 0.5) addP({ type: 'soft', rgb: '255,255,255', alpha: 0.7, x: x1 + rand(-30, 30) * sp, y: y1 + rand(-20, 20) * sp, vy: 10, life: 1.4, size: len * 0.035, grow: 2 });
    if (sqT <= 0 && Math.hypot(x1 - x0, y1 - y0) > 3) { Snd.squish(); if (Math.random() < 0.3) Snd.bubble(); sqT = 0.09; }
    touched = true;
  }
  S.down = (id, x, y) => { ptr.set(id, { x, y }); scrub(x, y, x, y); };
  S.move = (id, x, y) => { const p = ptr.get(id); if (!p) return; scrub(p.x, p.y, x, y); p.x = x; p.y = y; };
  S.up = id => ptr.delete(id);
  S.key = (code, down, rep) => {
    if (!down || rep) return;
    if (done && doneT > 1.6 && isAct(code)) go(Wash());
    else if (code === 'KeyH') { Snd.honk(car.horn); hopT = 0.5; }
  };
  S.update = dt => {
    t += dt; sqT -= dt; hopT = Math.max(0, hopT - dt);
    // teclado: ESPAÇO esfrega sozinho em zigue-zague; setas movem a esponja
    const ax = (Keys.has('ArrowRight') || Keys.has('KeyD') ? 1 : 0) - (Keys.has('ArrowLeft') || Keys.has('KeyA') ? 1 : 0);
    const ay = (Keys.has('ArrowDown') || Keys.has('KeyS') ? 1 : 0) - (Keys.has('ArrowUp') || Keys.has('KeyW') ? 1 : 0);
    const auto = Keys.has('Space') || Keys.has('Enter');
    if ((auto || ax || ay) && !done) {
      if (!kb.on) { kb.on = true; kb.x = gx; kb.y = gy - len * 0.3; }
      const px = kb.x, pyy = kb.y;
      if (auto) { kbT += dt; kb.x = gx + Math.sin(kbT * 2.4) * len * 0.47; kb.y = gy - len * (0.3 + 0.25 * Math.sin(kbT * 0.83 + 1)); }
      kb.x = clamp(kb.x + ax * len * 0.9 * dt, gx - len * 0.55, gx + len * 0.55);
      kb.y = clamp(kb.y + ay * len * 0.7 * dt, gy - len * 0.62, gy);
      ptr.set('kb', { x: kb.x, y: kb.y }); scrub(px, pyy, kb.x, kb.y);
    } else if (kb.on) { kb.on = false; ptr.delete('kb'); }
    const active = ptr.size > 0 && !done;
    Snd.loop('water', active, { type: 'highpass', f: 2600, q: 0.5, vol: 0.045 });
    Snd.loop('brush', active, { type: 'bandpass', f: 280, q: 2, vol: 0.08 });
    brushV = lerp(brushV, active ? 7 : 0.6, 1 - Math.exp(-dt * 3)); brush += brushV * dt;
    if (!touched && !hintSaid && t > 6) { hintSaid = true; say(kbMode() ? 'Aperta o espaço para lavar!' : 'Passa o dedo no carro!'); }
    const p = [...ptr.values()][0];
    const tx = p ? clamp((p.x - (gx + len * 0.1)) / (len * 0.4), -1, 1) : 0.7, tyy = p ? clamp((p.y - (gy - len * 0.38)) / (len * 0.3), -1, 1) : 0;
    look = { x: lerp(look.x, tx, 1 - Math.exp(-dt * 8)), y: lerp(look.y, tyy, 1 - Math.exp(-dt * 8)) };
    // pingos dos bicos
    const nozzles = 6;
    if (active && Math.random() < dt * 12) { const i = Math.floor(Math.random() * nozzles); addP({ type: 'drop', x: W * (i + 0.5) / nozzles, y: H * 0.13, vy: 120, g: 900, life: 1.2, size: 4 + Math.random() * 3 }); }
    checkT -= dt;
    if (!done && checkT <= 0) {
      checkT = 0.35; remain = count();
      if (remain / init < 0.12) {
        done = true; doneT = 0; hopT = 0.7; Snd.fanfare(); Snd.sparkle(); confetti(50);
        Snd.loop('rinse', true, { type: 'bandpass', f: 1200, q: 0.4, vol: 0.12 }); setTimeout(() => Snd.loop('rinse', false), 1800);
        say(`Uau! O ${car.short} está brilhando! Katchau!`);
      }
    }
    if (done) {
      doneT += dt; mudA = Math.max(0, mudA - dt * 1.2);
      if (doneT < 1.8 && Math.random() < dt * 60) { const i = Math.floor(Math.random() * nozzles); addP({ type: 'drop', x: W * (i + 0.5) / nozzles + rand(-8, 8), y: H * 0.14, vy: 300, g: 1200, life: 1, size: 5 + Math.random() * 4 }); }
      if (doneT > 1 && doneT < 3.5 && Math.random() < dt * 14) { addP({ type: 'e', e: '✨', x: gx + rand(-0.45, 0.45) * len, y: gy - rand(0.05, 0.55) * len, vy: -20, life: 0.9, size: len * rand(0.06, 0.11) }); if (Math.random() < 0.2) Snd.sparkle(); }
      if (doneT > 1.2 && hopT <= 0 && doneT < 4) hopT = 0.7;
    }
  };
  function brushDraw(bx, top, bot, bw, color) {
    ctx.fillStyle = '#555'; ctx.fillRect(bx - 3, H * 0.13, 6, top - H * 0.13 + 2);
    ctx.save(); rr(ctx, bx - bw / 2, top, bw, bot - top, bw * 0.3); ctx.clip();
    const g = ctx.createLinearGradient(bx - bw / 2, 0, bx + bw / 2, 0);
    g.addColorStop(0, shade(color, -0.55)); g.addColorStop(0.35, shade(color, 0.3)); g.addColorStop(0.6, color); g.addColorStop(1, shade(color, -0.6));
    ctx.fillStyle = g; ctx.fillRect(bx - bw / 2, top, bw, bot - top);
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
    const st = bw * 0.2;
    for (let y = top - bw + mod(brush * st, st); y < bot + bw; y += st) { ctx.beginPath(); ctx.moveTo(bx - bw / 2, y); ctx.quadraticCurveTo(bx, y + bw * 0.35, bx + bw / 2, y); ctx.stroke(); }
    ctx.restore();
  }
  S.draw = () => {
    if (!wall) buildWall();
    ctx.drawImage(wall, 0, 0, W, gy);
    // letreiro neon
    ctx.save(); ctx.shadowColor = '#5fd0ff'; ctx.shadowBlur = 18;
    text('LAVA-JATO', W / 2, Math.max(28, H * 0.06), Math.min(W * 0.065, H * 0.065), '#ffffff', '#1e6fe0');
    ctx.restore();
    // trilho com bicos de água
    const ty0 = H * 0.11, bg = ctx.createLinearGradient(0, ty0, 0, ty0 + H * 0.03);
    bg.addColorStop(0, '#d5dbe0'); bg.addColorStop(1, '#6d7780'); ctx.fillStyle = bg; ctx.fillRect(0, ty0, W, H * 0.03);
    for (let i = 0; i < 6; i++) { const nx = W * (i + 0.5) / 6; ctx.fillStyle = '#4b545c'; ctx.beginPath(); ctx.moveTo(nx - 8, ty0 + H * 0.03); ctx.lineTo(nx + 8, ty0 + H * 0.03); ctx.lineTo(nx + 3, ty0 + H * 0.045); ctx.lineTo(nx - 3, ty0 + H * 0.045); ctx.fill(); }
    if (done && doneT < 1.8) { // enxágue
      for (let i = 0; i < 6; i++) {
        const nx = W * (i + 0.5) / 6, wg = ctx.createLinearGradient(nx - 10, 0, nx + 10, 0);
        wg.addColorStop(0, 'rgba(170,220,255,0)'); wg.addColorStop(0.5, `rgba(200,235,255,${0.55 * (1 - doneT / 1.8)})`); wg.addColorStop(1, 'rgba(170,220,255,0)');
        ctx.fillStyle = wg; ctx.fillRect(nx - 14, ty0 + H * 0.045, 28, gy - ty0);
      }
    }
    // escovas
    const bw = Math.max(30, W * 0.065), btop = H * 0.18;
    brushDraw(W * 0.045, btop, gy, bw, '#3d8bff'); brushDraw(W * 0.955, btop, gy, bw, '#ff5fa8');
    // chão molhado com reflexo
    const fg = ctx.createLinearGradient(0, gy, 0, H); fg.addColorStop(0, '#6f7c87'); fg.addColorStop(1, '#4a545d');
    ctx.fillStyle = fg; ctx.fillRect(0, gy, W, H - gy);
    const hop = hopT > 0 ? Math.sin((1 - hopT / 0.7) * Math.PI) * len * 0.1 : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(0, gy, W, H - gy); ctx.clip();
    ctx.translate(0, 2 * gy); ctx.scale(1, -1); ctx.globalAlpha = 0.22;
    drawCar(ctx, gx, gy, len, car, { look, noShadow: true, hop });
    if (mudA > 0) { ctx.globalAlpha = 0.22 * mudA; ctx.drawImage(mud, 0, -hop, W, H); }
    ctx.restore();
    const rg = ctx.createLinearGradient(0, gy, 0, H); rg.addColorStop(0, 'rgba(74,84,93,0)'); rg.addColorStop(1, 'rgba(74,84,93,.9)');
    ctx.fillStyle = rg; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = '#2d343a'; rr(ctx, gx - len * 0.15, gy + (H - gy) * 0.55, len * 0.3, Math.max(6, (H - gy) * 0.12), 3); ctx.fill();
    ctx.strokeStyle = '#59636c'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 1; i < 10; i++) { const x = gx - len * 0.15 + len * 0.03 * i; ctx.moveTo(x, gy + (H - gy) * 0.56); ctx.lineTo(x, gy + (H - gy) * 0.66); } ctx.stroke();
    // carro + lama
    drawCar(ctx, gx, gy, len, car, { look, happy: done || ptr.size > 0, hop });
    if (mudA > 0) { ctx.save(); ctx.globalAlpha = mudA; ctx.setTransform(1, 0, 0, 1, 0, -hop * DPR); ctx.drawImage(mud, 0, 0); ctx.restore(); }
    if (done && doneT < 2.5) { // brilho passando
      const sx = gx - len * 0.7 + (doneT / 1.5) * len * 1.4;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5;
      ctx.drawImage(soft('255,255,255'), sx - len * 0.12, gy - len * 0.65 - hop, len * 0.24, len * 0.65); ctx.restore();
    }
    drawP();
    for (const p of ptr.values()) {
      ctx.drawImage(soft('0,0,0'), p.x - len * 0.08, p.y - len * 0.03, len * 0.16, len * 0.12);
      emoji('🧽', p.x, p.y, len * 0.16, Math.sin(now * 20) * 0.2);
    }
    if (!touched) {
      const s = Math.min(W, H) * 0.13, k = Math.sin(now * 3);
      emoji('🧽', gx + k * len * 0.25, gy - len * 0.3, s, k * 0.3);
      if (kbMode()) { const kh = clamp(H * 0.06, 26, 46); text('Segure', W / 2, gy + (H - gy) * 0.3, kh * 0.55, '#fff', '#333'); keycap('ESPAÇO', W / 2, gy + (H - gy) * 0.3 + kh, kh); }
    }
    const pct = done ? 1 : clamp(1 - remain / init, 0, 1) / 0.88;
    const bwd = Math.min(W * 0.4, 360), bx0 = W / 2 - bwd / 2, by0 = H - 22;
    if (!(done && doneT > 1.6)) {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, bx0 - 4, by0 - 10, bwd + 8, 20, 10); ctx.fill();
      const pg = ctx.createLinearGradient(0, by0 - 6, 0, by0 + 6); pg.addColorStop(0, '#bff0ff'); pg.addColorStop(1, '#1ea7e0');
      ctx.fillStyle = pg; rr(ctx, bx0, by0 - 6, Math.max(12, bwd * clamp(pct, 0, 1)), 12, 6); ctx.fill();
      emoji('✨', bx0 + bwd + 22, by0, 26);
    }
    vignette(0.2);
    S.buttons().forEach(drawBtn);
  };
  return S;
}

/* =========================================================
   PINTURA — toque numa lata (ou ← → e ESPAÇO) e a pistola pinta o carro
   ========================================================= */
const COLORS = [['Vermelho', '#e3161b'], ['Laranja', '#ff8a00'], ['Amarelo', '#f5c518'], ['Verde', '#2fae3a'], ['Azul', '#1e6fe0'],
  ['Roxo', '#8a3ffc'], ['Rosa', '#ff5fa8'], ['Branco', '#f2f2f2'], ['Preto', '#2a2d33'], ['Prata', '#b8c0c8']];
function Paint() {
  const S = { name: 'paint' }, car = curCar();
  const items = [{ name: 'Cor original', c: car.color, orig: true }, ...COLORS.map(([n, c]) => ({ name: n, c }))];
  let hopT = 0, sq = 0, anim = null, cursor = 0, cursorShown = false;
  function lay() {
    const port = H > W * 1.05, o = { pos: [] };
    if (port) {
      o.len = Math.min(W * 0.86, H * 0.5); o.gx = W / 2; o.gy = H * 0.33 + o.len * 0.28; o.r = Math.min(W / 14, H * 0.045);
      items.forEach((it, i) => { const row = i < 6 ? 0 : 1, n = row ? items.length - 6 : 6, j = row ? i - 6 : i; o.pos.push({ x: W * (j + 0.5) / n, y: H * (0.73 + row * 0.13) }); });
    } else {
      o.len = Math.min(W * 0.52, H * 0.72); o.gx = W / 2; o.gy = H * 0.45 + o.len * 0.28; o.r = Math.min(W / (items.length * 2.5), H * 0.07);
      items.forEach((it, i) => o.pos.push({ x: W * (i + 0.5) / items.length, y: H - o.r * 1.9 }));
    }
    return o;
  }
  function choose(i) {
    const it = items[i]; if (!it) return;
    if (anim) finish();
    cursor = i; Snd.pop();
    anim = { from: paint[car.id] || car.color, to: it.c, it, t: 0 };
    Snd.loop('spray', true, { type: 'highpass', f: 3800, q: 0.6, vol: 0.12 });
  }
  function finish() {
    const it = anim.it, o = lay();
    if (it.orig) delete paint[car.id]; else paint[car.id] = it.c;
    store.set('paint', paint); Snd.loop('spray', false); Snd.splat(); Snd.sparkle(); say(it.name + '!'); sq = 0.12;
    burst(o.gx, o.gy - o.len * 0.3, 10, '#ffd21f', o.len, o.len * 0.04, 's');
    anim = null;
  }
  S.enter = () => { Snd.playMusic('paint'); say('Escolha uma cor para pintar o ' + car.short + '!'); };
  S.buttons = () => [homeBtn()];
  S.down = (id, x, y) => {
    const o = lay();
    for (let i = 0; i < items.length; i++) if (Math.hypot(x - o.pos[i].x, y - o.pos[i].y) < o.r * 1.3) { choose(i); return; }
    if (Math.abs(x - o.gx) < o.len * 0.5 && y < o.gy && y > o.gy - o.len * 0.62) { hopT = 0.6; Snd.honk(car.horn); say(car.say); }
  };
  S.key = (code, down, rep) => {
    if (!down) return;
    if (code === 'ArrowLeft' || code === 'KeyA') { cursor = (cursor + items.length - 1) % items.length; cursorShown = true; Snd.tick(); }
    else if (code === 'ArrowRight' || code === 'KeyD') { cursor = (cursor + 1) % items.length; cursorShown = true; Snd.tick(); }
    else if (rep) return;
    else if (isAct(code)) choose(cursor);
    else if (/^(Digit|Numpad)\d$/.test(code)) { const n = parseInt(code.slice(-1), 10); choose(n === 0 ? 9 : n - 1); }
    else if (code === 'KeyH') { hopT = 0.6; Snd.honk(car.horn); }
    else if (/^Key[A-Z]$/.test(code)) { let i; do { i = Math.floor(Math.random() * items.length); } while (i === cursor); choose(i); } // qualquer letra = cor surpresa
  };
  S.update = dt => {
    hopT = Math.max(0, hopT - dt); sq *= Math.exp(-dt * 6);
    if (anim) {
      anim.t += dt / 1.1;
      const o = lay(), gxp = lerp(o.gx - o.len * 0.6, o.gx + o.len * 0.6, clamp(anim.t, 0, 1)), gyp = o.gy - o.len * 0.66;
      for (let i = 0; i < 4; i++) addP({ type: 'soft', rgb: hexRgb(anim.to), alpha: 0.5, x: gxp + rand(-6, 6), y: gyp + o.len * 0.08, vx: rand(-60, 60), vy: rand(200, 420) * o.len / 400, life: 0.5, size: o.len * 0.03, grow: o.len * 0.12, drag: 2 });
      if (anim.t >= 1) finish();
    }
  };
  function paintCan(x, y, r, color, sel, orig) {
    const w = r * 1.6, h = r * 1.5, top = y - h / 2;
    ctx.drawImage(soft('0,0,0'), x - w * 0.7, top + h - w * 0.2, w * 1.4, w * 0.5);
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, '#7e878f'); g.addColorStop(0.35, '#f4f7f9'); g.addColorStop(0.6, '#b4bcc3'); g.addColorStop(1, '#5d656c');
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, top, w, h);
    ctx.beginPath(); ctx.ellipse(x, top + h, w / 2, w * 0.14, 0, 0, Math.PI); ctx.fill();
    const lg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    lg.addColorStop(0, shade(color, -0.35)); lg.addColorStop(0.35, shade(color, 0.3)); lg.addColorStop(0.6, color); lg.addColorStop(1, shade(color, -0.5));
    ctx.fillStyle = lg; ctx.fillRect(x - w / 2, top + h * 0.3, w, h * 0.5);
    ctx.fillStyle = '#c9d0d6'; ell(ctx, x, top, w / 2, w * 0.14);
    const pg = ctx.createRadialGradient(x - w * 0.12, top - w * 0.03, 0, x, top, w / 2);
    pg.addColorStop(0, shade(color, 0.4)); pg.addColorStop(0.6, color); pg.addColorStop(1, shade(color, -0.25));
    ctx.fillStyle = pg; ell(ctx, x, top, w * 0.43, w * 0.11);
    ctx.fillStyle = color; rr(ctx, x - w * 0.3, top, w * 0.09, h * 0.38, w * 0.045); ctx.fill(); circle(ctx, x - w * 0.255, top + h * 0.38, w * 0.06);
    rr(ctx, x + w * 0.15, top, w * 0.07, h * 0.22, w * 0.035); ctx.fill();
    if (orig) emoji('⭐', x, top + h * 0.55, r * 0.75);
    if (sel) { ctx.strokeStyle = '#ffd21f'; ctx.lineWidth = 4; rr(ctx, x - w / 2 - 6, top - w * 0.2 - 6, w + 12, h + w * 0.34 + 12, 10); ctx.stroke(); }
  }
  function sprayGun(x, y, s, color) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#3a3f46'; rr(ctx, -s * 0.08, -s * 0.05, s * 0.16, s * 0.42, s * 0.04); ctx.fill();
    const g = ctx.createLinearGradient(0, -s * 0.2, 0, 0); g.addColorStop(0, '#e5e9ec'); g.addColorStop(1, '#868e96');
    ctx.fillStyle = g; rr(ctx, -s * 0.3, -s * 0.2, s * 0.6, s * 0.18, s * 0.06); ctx.fill();
    ctx.fillStyle = color; rr(ctx, -s * 0.12, -s * 0.48, s * 0.24, s * 0.3, s * 0.06); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#222'; ctx.fillRect(-s * 0.04, -s * 0.02, s * 0.08, s * 0.08);
    ctx.restore();
  }
  S.draw = () => {
    const o = lay();
    // cabine de pintura
    const wg = ctx.createLinearGradient(0, 0, 0, o.gy); wg.addColorStop(0, '#4b5560'); wg.addColorStop(1, '#2c333b');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, o.gy);
    for (let i = 0; i < 4; i++) {
      const lx = W * (0.12 + i * 0.25), lw = W * 0.14;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4; ctx.drawImage(soft('230,240,255'), lx - lw * 0.2, -H * 0.06, lw * 1.4, H * 0.18); ctx.restore();
      ctx.fillStyle = '#f4f8ff'; rr(ctx, lx, H * 0.015, lw, H * 0.03, 4); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x < W; x += 60) { ctx.moveTo(x, H * 0.06); ctx.lineTo(x, o.gy); } ctx.stroke();
    ctx.save(); ctx.shadowColor = '#ff7ac0'; ctx.shadowBlur = 18;
    text('PINTURA', W / 2, Math.max(30, H * 0.1), Math.min(W * 0.065, H * 0.065), '#fff', '#8a3ffc'); ctx.restore();
    // chão brilhante com reflexo
    const fg = ctx.createLinearGradient(0, o.gy, 0, H); fg.addColorStop(0, '#30363d'); fg.addColorStop(1, '#16191d');
    ctx.fillStyle = fg; ctx.fillRect(0, o.gy, W, H - o.gy);
    const hop = hopT > 0 ? Math.sin((1 - hopT / 0.6) * Math.PI) * o.len * 0.12 : 0;
    const carOpts = { hop, squash: sq, happy: sq > 0.01 || hopT > 0 || !!anim, look: anim ? { x: lerp(-1, 1, anim.t), y: -0.8 } : { x: 0.4, y: 0.6 } };
    const drawPainted = (c0, extra = {}) => {
      if (!anim) { drawCar(ctx, o.gx, o.gy, o.len, car, Object.assign({}, carOpts, extra)); return; }
      drawCar(ctx, o.gx, o.gy, o.len, car, Object.assign({}, carOpts, extra, { color: anim.from }));
      const sx = lerp(o.gx - o.len * 0.6, o.gx + o.len * 0.6, clamp(anim.t, 0, 1));
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip();
      drawCar(ctx, o.gx, o.gy, o.len, car, Object.assign({}, carOpts, extra, { color: anim.to, noShadow: true }));
      ctx.restore();
    };
    ctx.save(); ctx.beginPath(); ctx.rect(0, o.gy, W, H - o.gy); ctx.clip();
    ctx.translate(0, 2 * o.gy); ctx.scale(1, -1); ctx.globalAlpha = 0.25; drawPainted(null, { noShadow: true }); ctx.restore();
    const rg = ctx.createLinearGradient(0, o.gy, 0, o.gy + o.len * 0.4); rg.addColorStop(0, 'rgba(22,25,29,0)'); rg.addColorStop(1, 'rgba(22,25,29,.95)');
    ctx.fillStyle = rg; ctx.fillRect(0, o.gy, W, H - o.gy);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25; ctx.drawImage(soft('255,250,230'), o.gx - o.len * 0.8, o.gy - o.len * 0.9, o.len * 1.6, o.len * 1.1); ctx.restore();
    drawPainted(null);
    if (anim) {
      const gxp = lerp(o.gx - o.len * 0.6, o.gx + o.len * 0.6, clamp(anim.t, 0, 1)), gyp = o.gy - o.len * 0.66;
      const mg = ctx.createLinearGradient(0, gyp, 0, gyp + o.len * 0.4);
      mg.addColorStop(0, `rgba(${hexRgb(anim.to)},.55)`); mg.addColorStop(1, `rgba(${hexRgb(anim.to)},0)`);
      ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(gxp - 4, gyp + o.len * 0.08); ctx.lineTo(gxp + o.len * 0.1, gyp + o.len * 0.42); ctx.lineTo(gxp - o.len * 0.1, gyp + o.len * 0.42); ctx.closePath(); ctx.fill();
      drawP();
      sprayGun(gxp, gyp, o.len * 0.17, anim.to);
    } else drawP();
    const selIdx = paint[car.id] ? items.findIndex(x => !x.orig && x.c === paint[car.id]) : 0;
    items.forEach((it, i) => {
      const p = o.pos[i], b = 1 + 0.04 * Math.sin(now * 4 + i);
      paintCan(p.x, p.y, o.r * b, it.c, i === selIdx, it.orig);
    });
    if (kbMode() || cursorShown) {
      const p = o.pos[cursor], ay = p.y - o.r * 1.6 - Math.abs(Math.sin(now * 5)) * 8;
      ctx.fillStyle = '#ffd21f'; ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x - o.r * 0.4, ay - o.r * 0.45); ctx.lineTo(p.x + o.r * 0.4, ay - o.r * 0.45); ctx.lineTo(p.x, ay); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    vignette(0.25);
    S.buttons().forEach(drawBtn);
  };
  return S;
}
