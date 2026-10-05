'use strict';
/* Áudio 100% sintetizado (Web Audio): efeitos, motor com marchas, músicas e voz */
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
/* melodia em texto: nota, "." pausa, "-" segura a nota anterior (cada item = 1/16) */
function parseMel(str) {
  const t = str.trim().split(/\s+/), out = new Array(t.length).fill(null);
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '.' || t[i] === '-') continue;
    let d = 1; while (t[i + d] === '-') d++;
    out[i] = [midi(t[i]), d];
  }
  return out;
}
function chordOf(name) {
  const m = /^([A-G])(#|b)?(m?)$/.exec(name);
  return { root: NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), third: m[3] ? 3 : 4 };
}
const EVERY2 = [0, 2, 4, 6, 8, 10, 12, 14], OFFBEAT = [2, 6, 10, 14];
const SONGS = {
  race: {
    bpm: 150, vol: 0.8, chords: ['C', 'G', 'Am', 'F'], kick: [0, 6, 8, 11], snare: [4, 12], hat: EVERY2, lead: 'lead', pad: true,
    bass: [0, null, 0, 12, null, 0, 12, null, 0, null, 0, 12, null, 0, 7, null],
    mel: parseMel(`C5 . E5 . G5 . C6 - . . G5 . E5 . G5 .
                   D5 . G5 . B5 . D6 - . . B5 . G5 . B5 .
                   C6 . B5 . A5 . E5 - . . A5 . C6 . E6 .
                   F5 . A5 . C6 . A5 . G5 . F5 . G5 - - -`)
  },
  home: {
    bpm: 118, vol: 0.9, chords: ['C', 'F', 'G', 'C'], kick: [0, 8], snare: [4, 12], hat: OFFBEAT, lead: 'pluck', pad: true,
    bass: [0, null, null, null, 7, null, null, null, 0, null, null, null, 7, null, 12, null],
    mel: parseMel(`E5 . G5 . C6 . G5 . E5 . G5 . C6 - - .
                   F5 . A5 . C6 . A5 . F5 . A5 . C6 - - .
                   G5 . B5 . D6 . B5 . G5 . A5 . B5 . D6 .
                   C6 - . . G5 - . . E5 - . . C5 - - -`)
  },
  wash: {
    bpm: 112, vol: 0.85, chords: ['F', 'C', 'G', 'C'], kick: [0, 10], snare: [4, 12], hat: EVERY2, lead: 'pluck', pad: false,
    bass: [0, null, 7, null, 0, null, 7, null, 0, null, 7, null, 0, 4, 7, null],
    mel: parseMel(`A5 . . A5 C6 . A5 . F5 . . F5 A5 . . .
                   G5 . . G5 C6 . G5 . E5 . . E5 G5 . . .
                   B5 . . B5 D6 . B5 . G5 . A5 . B5 . D6 .
                   C6 . G5 . E5 . G5 . C6 - - . . . . .`)
  },
  paint: {
    bpm: 96, vol: 0.9, chords: ['C', 'Am', 'F', 'G'], kick: [0], snare: null, hat: OFFBEAT, lead: 'box', pad: true,
    bass: [0, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
    mel: parseMel(`E6 - . . G6 - . . C6 - . . E6 - . .
                   C6 - . . E6 - . . A5 - . . C6 - . .
                   A5 - . . C6 - . . F6 - . . E6 - . .
                   D6 - . . B5 - . . G5 - . . B5 - . .`)
  }
};

const Snd = {
  ac: null, on: store.get('sound', true), musicOn: store.get('music', true), engine: null, loops: {}, song: null, wantSong: null, timer: null, ducked: false,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = this.ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    comp.connect(ac.destination);
    this.master = this.g(this.on ? 0.9 : 0, comp);
    this.sfx = this.g(1, this.master);
    this.music = this.g(this.musicLevel(), this.master);
    // eco/reverberação
    const verb = ac.createConvolver(); verb.buffer = this.impulse(1.8, 2.6); verb.connect(this.g(0.22, this.master));
    this.sfx.connect(this.g(0.12, verb)); this.music.connect(this.g(0.2, verb));
    const n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.nbuf = b;
    if (this.wantSong) { const w = this.wantSong; this.song = null; this.playMusic(w); }
  },
  g(v, dest) { const g = this.ac.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; },
  impulse(sec, decay) {
    const ac = this.ac, n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  },
  t() { return this.ac.currentTime; },
  musicLevel() { return this.musicOn ? (this.ducked ? 0.12 : 0.3) : 0; },
  setOn(v) {
    this.on = v; store.set('sound', v);
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.t(), 0.05);
    if (!v && window.speechSynthesis) speechSynthesis.cancel();
  },
  setMusic(v) { this.musicOn = v; store.set('music', v); if (this.music) this.music.gain.setTargetAtTime(this.musicLevel(), this.t(), 0.1); },
  duck(on) { this.ducked = on; if (this.music) this.music.gain.setTargetAtTime(this.musicLevel(), this.t(), 0.15); },

  /* oscilador com envelope (a=ataque, hold=sustenta, r=soltura, lp=filtro, vib=vibrato) */
  osc(type, f, t, dur, vol, dest, o = {}) {
    if (!this.ac) return;
    const ac = this.ac, os = ac.createOscillator(), g = ac.createGain();
    os.type = type; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
    if (o.detune) os.detune.value = o.detune;
    const a = o.a || 0.005, r = o.r || dur * 0.6;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
    if (o.hold) g.gain.setValueAtTime(vol, t + Math.max(a, dur - r));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = os;
    if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; fl.Q.value = o.q || 0.7; os.connect(fl); node = fl; }
    if (o.vib) {
      const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibAmt || 10;
      l.connect(lg); lg.connect(os.detune); l.start(t); l.stop(t + dur + 0.1);
    }
    node.connect(g); g.connect(dest || this.sfx); os.start(t); os.stop(t + dur + 0.05);
  },
  /* ruído filtrado com envelope */
  nz(t, dur, vol, type, f, q, dest, o = {}) {
    if (!this.ac) return;
    const ac = this.ac, s = ac.createBufferSource(); s.buffer = this.nbuf; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t);
    if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + dur); fl.Q.value = q || 1;
    const g = ac.createGain(), a = o.a || 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
    if (o.hold) g.gain.setValueAtTime(vol, t + Math.max(a, dur * o.hold));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  drum(type, t, dest, v = 1) {
    dest = dest || this.sfx;
    if (type === 'kick') { this.osc('sine', 150, t, 0.35, 0.9 * v, dest, { to: 42, slide: 0.12 }); this.osc('triangle', 90, t, 0.08, 0.3 * v, dest, { to: 40 }); }
    else if (type === 'snare') { this.nz(t, 0.18, 0.35 * v, 'bandpass', 1800, 0.8, dest); this.nz(t, 0.12, 0.2 * v, 'highpass', 5000, 0.7, dest); this.osc('triangle', 200, t, 0.1, 0.25 * v, dest, { to: 150 }); }
    else if (type === 'hat') this.nz(t, 0.045, 0.12 * v, 'highpass', 8000, 0.7, dest);
  },

  /* ---------- efeitos ---------- */
  honk(kind = 'normal') {
    if (!this.ac) return; const t = this.t();
    const horn = (f1, f2, at, d) => [f1, f2].forEach(f => {
      this.osc('sawtooth', f, at, d, 0.09, null, { a: 0.015, hold: 1, r: 0.04, lp: 2200, q: 3 });
      this.osc('square', f * 1.003, at, d, 0.04, null, { a: 0.015, hold: 1, r: 0.04, lp: 1500 });
    });
    if (kind === 'aooga') [0, 0.6].forEach(d => this.osc('sawtooth', 150, t + d, 0.5, 0.16, null, { to: 430, slide: 0.32, a: 0.03, hold: 1, r: 0.1, lp: 1400, q: 6, vib: 9, vibAmt: 30 }));
    else if (kind === 'high') [0, 0.16, 0.32].forEach(d => horn(740, 932, t + d, 0.12));
    else if (kind === 'low') horn(233, 294, t, 0.6);
    else if (kind === 'soft') { horn(370, 466, t, 0.18); horn(370, 466, t + 0.24, 0.25); }
    else { horn(415, 523, t, 0.2); horn(415, 523, t + 0.26, 0.3); }
  },
  coin() { if (!this.ac) return; const t = this.t(); this.osc('square', 988, t, 0.09, 0.1, null, { lp: 4000 }); this.osc('square', 1319, t + 0.08, 0.35, 0.1, null, { lp: 4000, r: 0.3 }); this.osc('sine', 2637, t + 0.08, 0.25, 0.05); },
  pop() { if (!this.ac) return; const t = this.t(); this.osc('sine', 420, t, 0.12, 0.3, null, { to: 980 }); this.nz(t, 0.05, 0.06, 'highpass', 3000, 0.7); },
  tick() { if (!this.ac) return; this.osc('triangle', 1200, this.t(), 0.06, 0.15); },
  splat() { if (!this.ac) return; const t = this.t(); this.nz(t, 0.35, 0.5, 'lowpass', 900, 1, null, { to: 200 }); this.osc('sine', 160, t, 0.25, 0.4, null, { to: 45 }); this.nz(t + 0.02, 0.25, 0.15, 'bandpass', 2500, 2); },
  squish() { if (!this.ac) return; this.nz(this.t(), 0.12, 0.16, 'bandpass', rand(900, 1800), 4, null, { to: rand(2000, 3200), a: 0.02 }); },
  bubble() { if (!this.ac) return; this.osc('sine', rand(500, 900), this.t(), 0.07, 0.1, null, { to: rand(1400, 2200) }); },
  sparkle() { if (!this.ac) return; const t = this.t(); [2093, 2637, 3136, 4186].forEach((f, i) => this.osc('sine', f, t + i * 0.06, 0.4, 0.06)); },
  beep(hi) { if (!this.ac) return; const t = this.t(), d = hi ? 0.7 : 0.3; this.osc('square', hi ? 880 : 440, t, d, 0.1, null, { lp: 3000, hold: 1, r: 0.05 }); this.osc('sine', hi ? 1760 : 880, t, d, 0.05, null, { hold: 1, r: 0.05 }); },
  shift() { if (!this.ac) return; const t = this.t(); this.nz(t, 0.3, 0.1, 'highpass', 1800, 0.7, null, { to: 4000 }); this.osc('sawtooth', 180, t, 0.08, 0.05, null, { lp: 600 }); },
  screech(d = 0.8) { if (!this.ac) return; const t = this.t(); this.nz(t, d, 0.2, 'bandpass', 2600, 9, null, { a: 0.05, hold: 0.6 }); this.osc('sawtooth', 1300, t, d, 0.025, null, { lp: 3000, vib: 23, vibAmt: 40, a: 0.05, hold: 1, r: 0.2 }); },
  cheer(dur = 2.5, vol = 1) {
    if (!this.ac) return; const t = this.t();
    for (let i = 0; i < 45; i++) this.nz(t + Math.random() * dur * 0.8, rand(0.3, 0.9), 0.05 * vol, 'bandpass', rand(700, 2200), rand(2, 5), null, { a: 0.08 });
    for (let i = 0; i < 3; i++) this.osc('sine', 2100, t + rand(0.1, dur * 0.6), 0.5, 0.035 * vol, null, { to: 2900, slide: 0.15, a: 0.02 });
    this.nz(t, dur, 0.08 * vol, 'bandpass', 1200, 0.6, null, { a: 0.3, hold: 0.6 });
  },
  fanfare() {
    if (!this.ac) return; const t = this.t();
    const brass = (m, s, d, v = 0.08) => {
      const f = mtof(m);
      this.osc('sawtooth', f, t + s, d, v, null, { a: 0.03, hold: 1, r: 0.15, lp: 2400, vib: 5.5, vibAmt: 8 });
      this.osc('sawtooth', f * 1.004, t + s, d, v * 0.7, null, { a: 0.03, hold: 1, r: 0.15, lp: 1800 });
    };
    brass(67, 0, 0.14); brass(67, 0.15, 0.14); brass(67, 0.3, 0.14); brass(72, 0.45, 0.6); brass(64, 0.45, 0.6, 0.05);
    brass(76, 1.1, 1.3); brass(72, 1.1, 1.3, 0.06); brass(79, 1.1, 1.3, 0.06); brass(48, 1.1, 1.3, 0.07);
    this.drum('snare', t + 0.45); this.drum('kick', t + 1.1); this.drum('snare', t + 1.1, null, 0.6);
  },

  /* sons contínuos (água, spray, pneu) */
  loop(name, on, o = {}) {
    if (!this.ac) return; let L = this.loops[name];
    if (on && !L) {
      const s = this.ac.createBufferSource(); s.buffer = this.nbuf; s.loop = true;
      const f = this.ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.value = o.f || 1000; f.Q.value = o.q || 0.8;
      const g = this.g(0, this.sfx); s.connect(f); f.connect(g); s.start();
      L = this.loops[name] = { s, f, g }; g.gain.setTargetAtTime(o.vol || 0.15, this.t(), 0.05);
    } else if (!on && L) { L.g.gain.setTargetAtTime(0, this.t(), 0.08); L.s.stop(this.t() + 0.6); delete this.loops[name]; }
  },
  stopLoops() { for (const k in this.loops) this.loop(k, false); },

  /* motor: dois serrotes + subgrave, pulsação de explosões, ruído de admissão e turbo */
  engineStart() {
    if (!this.ac || this.engine) return; const ac = this.ac;
    const out = this.g(0, this.sfx);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4; lp.frequency.value = 500; lp.connect(out);
    const am = this.g(0.6, lp);
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), sub = ac.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth'; sub.type = 'square';
    [o1, o2, sub].forEach(o => o.connect(am));
    const lfo = ac.createOscillator(); lfo.type = 'square'; lfo.connect(this.g(0.4, am.gain));
    const ns = ac.createBufferSource(); ns.buffer = this.nbuf; ns.loop = true;
    const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.Q.value = 1.2; ns.connect(nf); nf.connect(this.g(0.12, lp));
    const tw = ac.createOscillator(); tw.type = 'sine'; const twg = this.g(0, out); tw.connect(twg);
    const all = [o1, o2, sub, lfo, ns, tw]; all.forEach(o => o.start());
    this.engine = { out, lp, o1, o2, sub, lfo, nf, tw, twg, all };
    this.engineSet(0.1, 0);
  },
  engineSet(rpm, load) {
    const e = this.engine; if (!e) return;
    const t = this.t(), f = 32 + rpm * 120, k = 0.05;
    e.o1.frequency.setTargetAtTime(f, t, k); e.o2.frequency.setTargetAtTime(f * 1.012, t, k); e.sub.frequency.setTargetAtTime(f / 2, t, k);
    e.lfo.frequency.setTargetAtTime(f / 2, t, k); e.nf.frequency.setTargetAtTime(400 + rpm * 1800, t, k);
    e.lp.frequency.setTargetAtTime(250 + rpm * 1400 + load * 700, t, k);
    e.out.gain.setTargetAtTime(0.06 + rpm * 0.07 + load * 0.04, t, 0.08);
    e.tw.frequency.setTargetAtTime(900 + rpm * 2600, t, k); e.twg.gain.setTargetAtTime(load > 0.6 ? 0.005 + rpm * 0.008 : 0, t, 0.1);
  },
  engineStop() {
    const e = this.engine; if (!e) return; const t = this.t();
    e.out.gain.setTargetAtTime(0, t, 0.08); e.all.forEach(o => o.stop(t + 0.5)); this.engine = null;
  },

  /* ---------- música (sequenciador com antecedência) ---------- */
  playMusic(name) {
    this.wantSong = name;
    if (!this.ac) return;
    const s = name ? SONGS[name] : null;
    if (this.song === s) return;
    this.song = s; this.step = 0; this.nextT = this.t() + 0.08;
    if (s && !this.timer) this.timer = setInterval(() => this.sched(), 25);
  },
  sched() {
    const s = this.song; if (!s || !this.ac || this.ac.state !== 'running') return;
    const spb = 60 / s.bpm / 4;
    if (this.nextT < this.t() - 0.2) this.nextT = this.t() + 0.05;
    while (this.nextT < this.t() + 0.15) { this.playStep(s, this.step, this.nextT, spb); this.nextT += spb; this.step++; }
  },
  playStep(s, i, t, spb) {
    if (!this.musicOn) return;
    const n = s.mel.length, st = i % n, b = st % 16, bar = Math.floor(st / 16);
    const ch = chordOf(s.chords[bar % s.chords.length]), M = this.music, v = s.vol || 1;
    if (s.kick && s.kick.includes(b)) this.drum('kick', t, M, 0.8 * v);
    if (s.snare && s.snare.includes(b)) this.drum('snare', t, M, 0.7 * v);
    if (s.hat && s.hat.includes(b)) this.drum('hat', t, M, 0.8 * v);
    const bo = s.bass && s.bass[b];
    if (bo != null) {
      const m = 36 + ch.root + bo;
      this.osc('sawtooth', mtof(m), t, spb * 1.8, 0.14 * v, M, { lp: 700, q: 2, r: spb });
      this.osc('sine', mtof(m), t, spb * 1.8, 0.14 * v, M);
    }
    if (s.pad && b === 0) {
      const bd = spb * 16;
      [0, ch.third, 7].forEach(iv => this.osc('sawtooth', mtof(60 + ch.root + iv), t, bd, 0.022 * v, M, { a: 0.25, hold: 1, r: 0.3, lp: 1100, detune: rand(-8, 8) }));
    }
    const mn = s.mel[st];
    if (mn) {
      const d = mn[1] * spb, f = mtof(mn[0]);
      if (s.lead === 'box') { this.osc('sine', f, t, Math.max(d, 0.6), 0.15 * v, M); this.osc('sine', f * 2, t, 0.3, 0.04 * v, M); }
      else if (s.lead === 'pluck') { this.osc('triangle', f, t, Math.max(d, 0.25), 0.2 * v, M); this.osc('square', f, t, 0.08, 0.05 * v, M, { lp: 3000 }); }
      else { this.osc('square', f, t, d * 0.95, 0.06 * v, M, { a: 0.01, hold: 1, r: 0.06, lp: 2600, vib: 5, vibAmt: 10 }); this.osc('triangle', f * 1.003, t, d * 0.95, 0.08 * v, M, { a: 0.01, hold: 1, r: 0.06 }); }
    }
  }
};

/* ---------- voz (escolhe a voz pt-BR mais natural disponível) ---------- */
let voice = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices() || [], pt = vs.filter(v => /^pt/i.test(v.lang)), br = pt.filter(v => /BR/i.test(v.lang));
    const score = v => (/natural|neural|online|premium|enhanced/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 3 : 0) + (/luciana|francisca|thalita|felipe|antonio|daniel/i.test(v.name) ? 2 : 0);
    voice = (br.length ? br : pt).sort((a, b) => score(b) - score(a))[0] || null;
  } catch (e) {}
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(txt) {
  if (!Snd.on || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt); u.lang = 'pt-BR'; if (voice) u.voice = voice;
    u.rate = 0.98; u.pitch = 1.15;
    u.onstart = () => Snd.duck(true); u.onend = u.onerror = () => Snd.duck(false);
    speechSynthesis.speak(u);
    clearTimeout(say.t); say.t = setTimeout(() => Snd.duck(false), 6000);
  } catch (e) {}
}
