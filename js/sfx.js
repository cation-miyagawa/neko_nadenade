(() => {
'use strict';

let ctx = null;
let lastPurrAt = 0;
let keepAliveNode = null;
const voices = [];

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function unlock() {
  try {
    const ac = getCtx();
    const ready = ac.state === 'suspended' ? ac.resume() : Promise.resolve();
    return ready.then(() => {
      if (!keepAliveNode && ac.state === 'running') {
        const o = ac.createOscillator();
        const g = ac.createGain();
        g.gain.value = 0.00001;
        o.connect(g);
        g.connect(ac.destination);
        o.start();
        keepAliveNode = o;
      }
      return ac;
    }).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

function stopVoices() {
  voices.splice(0).forEach(node => {
    try { node.stop(); } catch { /* すでに停止 */ }
  });
}

function envelope(ac, dest, peak, attack, hold, dur) {
  const g = ac.createGain();
  const t = ac.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + Math.min(hold, dur - 0.02));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest);
  return g;
}

function purr() {
  const ac = getCtx();
  if (ac.state !== 'running') return;
  const nowMs = ac.currentTime * 1000;
  if (nowMs - lastPurrAt < 180) return;
  lastPurrAt = nowMs;

  const t = ac.currentTime;
  const dur = 0.5;
  const rumble = ac.createOscillator();
  rumble.type = 'sawtooth';
  rumble.frequency.value = 60;
  const tone = ac.createOscillator();
  tone.type = 'triangle';
  tone.frequency.value = 120;
  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 25;
  const lfoAmt = ac.createGain();
  lfoAmt.gain.value = 0.5;
  const am = ac.createGain();
  am.gain.value = 0.55;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  const g = envelope(ac, ac.destination, 0.45, 0.03, 0.14, dur);

  lfo.connect(lfoAmt);
  lfoAmt.connect(am.gain);
  rumble.connect(am);
  tone.connect(am);
  am.connect(lp);
  lp.connect(g);

  [rumble, tone, lfo].forEach(o => {
    o.start(t);
    o.stop(t + dur);
    voices.push(o);
  });
}

function hiss() {
  const ac = getCtx();
  if (ac.state !== 'running') return;
  stopVoices();
  lastPurrAt = 0;

  const t = ac.currentTime;
  const dur = 0.65;
  const frames = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1400;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(3800, t);
  bp.frequency.exponentialRampToValueAtTime(1200, t + dur);
  const g = envelope(ac, ac.destination, 0.5, 0.02, 0.2, dur);

  src.connect(hp);
  hp.connect(bp);
  bp.connect(g);
  src.start(t);
  src.stop(t + dur);
  voices.push(src);
}

const MEOW_SRC = {
  start: 'assets/meow-start.mp3',
  select: 'assets/meow-select.mp3',
};
Object.values(MEOW_SRC).forEach(src => {
  const a = new Audio(src);
  a.preload = 'auto';
});

function meow(which) {
  const src = MEOW_SRC[which] || MEOW_SRC.start;
  const a = new Audio(src);
  a.volume = 0.9;
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}

function play(kind) {
  if (kind === 'meow' || kind === 'meowStart' || kind === 'meowSelect') {
    try { meow(kind === 'meowSelect' ? 'select' : 'start'); } catch { /* 再生できない環境では無視 */ }
    unlock();
    return;
  }
  unlock().then(ac => {
    if (!ac) return;
    try {
      if (kind === 'purr') purr();
      else if (kind === 'hiss') hiss();
    } catch { /* 再生できない環境では無視 */ }
  });
}

const STEP = 60 / 112 / 2;
const LEAD = [
  659, 659, 784, 880, 784, 659, 523, 0,
  659, 784, 880, 784, 659, 587, 523, 0,
  880, 784, 659, 587, 523, 659, 784, 0,
  659, 523, 392, 523, 659, 587, 523, 0,
];
const BASS = [
  131, 0, 196, 0, 131, 0, 196, 0,
  131, 0, 196, 0, 147, 0, 196, 0,
  131, 0, 196, 0, 131, 0, 196, 0,
  110, 0, 131, 0, 147, 0, 131, 0,
];

let bgmOn = false;
let bgmWanted = true;
let bgmOut = null;
let nextStepAt = 0;
let step = 0;
let schedId = 0;

function bgmBus(ac) {
  if (!bgmOut) {
    bgmOut = ac.createGain();
    bgmOut.connect(ac.destination);
  }
  bgmOut.gain.value = 0.22;
  return bgmOut;
}

function tone(ac, freq, t, dur, type, vol, slideTo) {
  if (!freq) return;
  const when = Math.max(t, ac.currentTime + 0.01);
  const len = Math.max(dur, 0.05);
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, when + len * 0.9);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + len);
  o.connect(g);
  g.connect(bgmBus(ac));
  o.start(when);
  o.stop(when + len + 0.03);
}

function scheduleBgm() {
  if (!bgmOn) return;
  const ac = getCtx();
  if (ac.state !== 'running') {
    schedId = setTimeout(scheduleBgm, 120);
    return;
  }
  if (nextStepAt < ac.currentTime - 0.02) nextStepAt = ac.currentTime + 0.02;
  let guard = 0;
  while (nextStepAt < ac.currentTime + 0.4 && guard < 24) {
    const i = step % 32;
    const dur = STEP * 0.88;
    const slide = (i % 8 === 3 && LEAD[i]) ? LEAD[i] * 0.78 : 0;
    tone(ac, LEAD[i], nextStepAt, dur, 'triangle', 0.16, slide);
    tone(ac, BASS[i], nextStepAt, dur, 'square', 0.06);
    if (i === 15 || i === 31) tone(ac, 820, nextStepAt, 0.32, 'sine', 0.18, 390);
    nextStepAt += STEP;
    step += 1;
    guard += 1;
  }
  schedId = setTimeout(scheduleBgm, 70);
}

function startBgm() {
  if (!bgmWanted) return;
  unlock().then(ac => {
    if (!ac || !bgmWanted || bgmOn) return;
    bgmOn = true;
    step = 0;
    nextStepAt = ac.currentTime + 0.08;
    bgmBus(ac);
    clearTimeout(schedId);
    scheduleBgm();
  });
}

function stopBgm() {
  bgmOn = false;
  clearTimeout(schedId);
}

function toggleBgm() {
  bgmWanted = !bgmWanted;
  if (bgmWanted) {
    bgmOn = false;
    startBgm();
  } else {
    stopBgm();
  }
  return bgmWanted;
}

function isBgmOn() {
  return bgmWanted;
}

window.NekoSfx = { unlock, play, startBgm, stopBgm, toggleBgm, isBgmOn };
})();
