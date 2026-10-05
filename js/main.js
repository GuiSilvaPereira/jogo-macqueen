'use strict';
/* Motor principal: troca de cena, eventos (toque, mouse, teclado) e laço de animação */
let scene = null;
function go(s) {
  if (scene && scene.exit) scene.exit();
  Snd.stopLoops(); Snd.engineStop();
  parts = []; scene = s; if (s.enter) s.enter();
}
function toggleFull() {
  const de = document.documentElement;
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (de.requestFullscreen || de.webkitRequestFullscreen).call(de);
  } catch (e) {}
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (scene && scene.resize) scene.resize();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

let unlocked = false;
function unlock() {
  Snd.init();
  if (!unlocked) { unlocked = true; if (scene.onUnlock) scene.onUnlock(); }
}

/* toque e mouse */
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); lastInput = e.pointerType === 'mouse' ? 'mouse' : 'touch'; unlock();
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  const x = e.clientX, y = e.clientY;
  for (const b of (scene.buttons ? scene.buttons() : [])) {
    if (Math.hypot(x - b.x, y - b.y) <= b.r * 1.15) { Snd.pop(); b.fn(); return; }
  }
  scene.down && scene.down(e.pointerId, x, y);
});
cv.addEventListener('pointermove', e => { e.preventDefault(); scene.move && scene.move(e.pointerId, e.clientX, e.clientY); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => cv.addEventListener(n, e => { scene.up && scene.up(e.pointerId); }));
cv.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

/* teclado */
const NOSCROLL = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Backspace', 'Tab'];
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (NOSCROLL.includes(e.code)) e.preventDefault();
  lastInput = 'key'; unlock();
  Keys.add(e.code);
  if ((e.code === 'Escape' || e.code === 'Backspace') && !e.repeat) {
    if (scene.name !== 'home') { Snd.pop(); go(Home()); }
    return;
  }
  scene.key && scene.key(e.code, true, e.repeat);
});
window.addEventListener('keyup', e => { Keys.delete(e.code); scene.key && scene.key(e.code, false, false); });
window.addEventListener('blur', () => Keys.clear());
document.addEventListener('visibilitychange', () => {
  Keys.clear();
  if (!Snd.ac) return;
  if (document.hidden) { Snd.ac.suspend(); if (window.speechSynthesis) speechSynthesis.cancel(); } else Snd.ac.resume();
});

scene = Home();
let last = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts; now += dt;
  scene.update(dt); updP(dt);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  scene.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
