(() => {
'use strict';

const { GAME_CONFIG, ZONE_NAMES, CATS, buildCatSvg, likesText, profileText } = window.NekoData;
const $ = id => document.getElementById(id);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const randRange = ([min, max]) => min + Math.random() * (max - min);
const fmt = (text, zone) => text.replace('{zone}', ZONE_NAMES[zone]);

const SCREENS = ['start', 'select', 'game', 'result'];
const STORAGE_PREFIX = 'neko_nadenade.best.';

const stage = $('stage');
let state = null;
let rafId = 0;
let resultTimer = 0;

function show(name) {
  SCREENS.forEach(s => $('screen-' + s).classList.toggle('is-active', s === name));
  window.scrollTo(0, 0);
}

function loadBest(catId) {
  try { return Number(localStorage.getItem(STORAGE_PREFIX + catId)) || 0; } catch { return 0; }
}
function saveBest(catId, value) {
  try { localStorage.setItem(STORAGE_PREFIX + catId, String(value)); } catch { /* 保存できない環境では無視 */ }
}

// ---- 画面: 猫選択 ----

function renderSelect() {
  $('catList').innerHTML = CATS.map(cat => `
    <article class="cat-card">
      <div class="cat-card-art">${buildCatSvg(cat)}</div>
      <div>
        <span class="badge ${cat.levelClass}">${cat.level}</span>
        <h3>${cat.petName}</h3>
        <p class="cat-profile">${profileText(cat)}</p>
        <p>${cat.description}</p>
        <dl>
          <dt>なでなでポイント</dt><dd>${likesText(cat)}</dd>
          <dt>ごきげん</dt><dd>${cat.moodNote}</dd>
        </dl>
        <div class="card-foot">
          <span class="best">ベスト ❤️ ${loadBest(cat.id)}</span>
          <button data-cat="${cat.id}">このこをなでる ♡</button>
        </div>
      </div>
    </article>`).join('');
}

$('catList').addEventListener('click', e => {
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  startGame(CATS.find(c => c.id === btn.dataset.cat));
});

// ---- ゲーム ----

function startGame(cat) {
  stopLoop();
  const now = performance.now();
  state = {
    cat,
    hearts: 0,
    mood: cat.mood.start,
    startAt: now,
    lastFrame: now,
    lastTapAt: -Infinity,
    angryUntil: 0,
    whimActive: false,
    whimEndsAt: 0,
    nextWhimAt: cat.mood.whim ? randRange(cat.mood.whim.every) : Infinity,
    ended: false,
  };
  stage.innerHTML = buildCatSvg(cat, { interactive: true });
  stage.querySelectorAll('.float').forEach(el => el.remove());
  $('catName').textContent = cat.petName;
  $('catProfile').textContent = profileText(cat);
  $('catLevel').textContent = cat.level;
  $('catLevel').className = 'badge ' + cat.levelClass;
  $('legend').textContent = `なでなでポイント：${likesText(cat)}　・　タップでなでなで`;
  $('moodLine').style.left = GAME_CONFIG.angryLine + '%';
  setMessage('やさしくなでてみよう 🐾', '');
  paintBgmBtns();
  show('game');
  paint(now, GAME_CONFIG.durationSec);
  rafId = requestAnimationFrame(tick);
}

function stopLoop() {
  cancelAnimationFrame(rafId);
  clearTimeout(resultTimer);
  rafId = 0;
}

function baseMood(elapsed) {
  const m = state.cat.mood;
  if (state.whimActive) return m.whim.value;
  const b = m.base;
  if (b.type === 'wave') return b.center + b.amplitude * Math.sin(2 * Math.PI * elapsed / b.period);
  return b.value;
}

function updateWhim(elapsed) {
  const whim = state.cat.mood.whim;
  if (!whim) return;
  if (!state.whimActive && elapsed >= state.nextWhimAt) {
    state.whimActive = true;
    state.whimEndsAt = elapsed + whim.duration;
    setMessage('……（ちらっ）気まぐれタイム！ ✨', 'whim');
  } else if (state.whimActive && elapsed >= state.whimEndsAt) {
    state.whimActive = false;
    state.nextWhimAt = elapsed + randRange(whim.every);
  }
}

function tick(now) {
  if (!state || state.ended) return;
  const dt = Math.min(0.1, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  const elapsed = (now - state.startAt) / 1000;

  updateWhim(elapsed);
  const step = state.cat.mood.drift * dt;
  state.mood = clamp(state.mood + clamp(baseMood(elapsed) - state.mood, -step, step), 0, 100);

  const remain = Math.max(0, GAME_CONFIG.durationSec - elapsed);
  paint(now, remain);
  if (remain <= 0) {
    endGame();
    return;
  }
  rafId = requestAnimationFrame(tick);
}

function pat(zone, clientX, clientY) {
  const now = performance.now();
  const { cat } = state;
  const m = cat.mood;
  const rapid = now - state.lastTapAt < m.rapidMs;
  state.lastTapAt = now;

  let delta, kind, text;
  if (state.mood < GAME_CONFIG.angryLine) {
    delta = -cat.hearts.angry;
    state.mood -= GAME_CONFIG.angryMoodPenalty;
    kind = 'angry';
    text = pick(cat.lines.angry);
  } else if (!cat.likes.includes(zone)) {
    delta = -cat.hearts.bad;
    state.mood -= m.dislikePenalty;
    kind = 'bad';
    text = fmt(pick(cat.lines.bad), zone);
  } else if (rapid) {
    delta = cat.hearts.good;
    state.mood -= m.rapidPenalty;
    kind = 'rapid';
    text = pick(cat.lines.rapid);
  } else {
    delta = cat.hearts.good;
    state.mood += m.calmGain;
    kind = 'good';
    text = fmt(pick(cat.lines.good), zone);
  }
  if (kind === 'angry' || kind === 'bad') state.angryUntil = now + GAME_CONFIG.angryFaceMs;
  if (kind === 'good' || kind === 'rapid') window.NekoSfx.play('purr');
  else if (kind === 'angry' || kind === 'bad') window.NekoSfx.play('hiss');

  state.mood = clamp(state.mood, 0, 100);
  state.hearts = Math.max(0, state.hearts + delta);
  setMessage(text, kind);

  const rect = stage.getBoundingClientRect();
  floatText(delta > 0 ? `+${delta} ❤️` : `${delta} 💔`, clientX - rect.left, clientY - rect.top, delta > 0);
  paint(now, Math.max(0, GAME_CONFIG.durationSec - (now - state.startAt) / 1000));
}

stage.addEventListener('pointerdown', e => {
  window.NekoSfx.unlock();
  if (!state || state.ended) return;
  const zoneEl = e.target.closest('[data-zone]');
  if (!zoneEl) return;
  e.preventDefault();
  pat(zoneEl.dataset.zone, e.clientX, e.clientY);
});

function moodLabel(mood) {
  if (mood >= 75) return 'ごろごろ 😻';
  if (mood >= 50) return 'ふつう 😺';
  if (mood >= GAME_CONFIG.angryLine) return 'そわそわ 😼';
  return 'ごきげんななめ 😾';
}

function paint(now, remain) {
  const { mood } = state;
  const low = mood < GAME_CONFIG.angryLine;
  $('hearts').textContent = state.hearts;
  $('timer').textContent = Math.ceil(remain);
  $('moodFill').style.width = mood + '%';
  $('moodFill').classList.toggle('low', low);
  $('moodLabel').textContent = 'ごきげん：' + moodLabel(mood);
  $('warning').textContent = low ? '⚠️ 今は触らないで！ ごきげんが戻るのを待とう'
    : state.whimActive ? '✨ 気まぐれタイム！ 今がチャンス'
    : mood < 45 ? '⚠️ そろそろ怒りそう… ゆっくりなでよう'
    : '猫の様子を見ながら、やさしくなでよう';
  stage.classList.toggle('whim', state.whimActive);

  const svg = stage.querySelector('svg');
  const angry = low || now < state.angryUntil;
  svg.classList.toggle('angry', angry);
  svg.classList.toggle('happy', !angry && mood >= 75);
}

function setMessage(text, kind) {
  const el = $('message');
  el.textContent = text;
  el.className = 'msg ' + kind;
}

function floatText(label, x, y, good) {
  const el = document.createElement('div');
  el.className = 'float ' + (good ? 'good' : 'bad');
  el.textContent = label;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  stage.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function endGame() {
  state.ended = true;
  stopLoop();
  window.NekoSfx.stopBgm();
  paintBgmBtns();
  setMessage('おしまい！', '');
  resultTimer = setTimeout(showResult, 700);
}

// ---- 画面: 結果 ----

function showResult() {
  const { cat, hearts } = state;
  const best = loadBest(cat.id);
  const isNew = hearts > best;
  if (isNew) saveBest(cat.id, hearts);

  $('resultArt').innerHTML = buildCatSvg(cat, { className: hearts > 0 ? 'happy' : 'angry' });
  $('resultName').textContent = cat.petName;
  $('resultLevel').textContent = cat.level;
  $('resultLevel').className = 'badge ' + cat.levelClass;
  $('resultProfile').textContent = profileText(cat);
  $('resultHearts').textContent = hearts;
  const record = $('resultRecord');
  record.textContent = isNew ? '🎉 新記録！' : `ハイスコア ❤️ ${best}`;
  record.classList.toggle('new', isNew);
  $('resultComment').textContent = hearts === 0 ? '猫はご立腹… 次はやさしくね 😿'
    : isNew ? 'すっかり仲良し！ 😻'
    : 'おつかれさま！ またなでてにゃ 🐈';
  show('result');
}

// ---- ボタン ----

function paintBgmBtns() {
  const on = window.NekoSfx.isBgmOn();
  document.querySelectorAll('.btn-bgm').forEach(btn => {
    btn.textContent = on ? '♪ ON' : '♪ OFF';
    btn.setAttribute('aria-pressed', String(on));
  });
}

$('screen-start').addEventListener('pointerdown', e => {
  if (e.target.closest('.btn-bgm')) return;
  window.NekoSfx.startBgm();
  paintBgmBtns();
});
$('btnStart').addEventListener('click', () => {
  window.NekoSfx.startBgm();
  paintBgmBtns();
  renderSelect();
  show('select');
});
document.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const onSelect = btn.closest('#screen-select') || btn.dataset.cat || btn.id === 'btnReselect';
  window.NekoSfx.play(onSelect ? 'meowSelect' : 'meowStart');
  if (!btn.classList.contains('btn-bgm')) return;
  window.NekoSfx.toggleBgm();
  paintBgmBtns();
});
$('btnBackToStart').addEventListener('click', () => {
  window.NekoSfx.startBgm();
  paintBgmBtns();
  show('start');
});
$('btnQuit').addEventListener('click', () => {
  if (state) state.ended = true;
  stopLoop();
  renderSelect();
  show('select');
});
$('btnRetry').addEventListener('click', () => {
  window.NekoSfx.startBgm();
  paintBgmBtns();
  startGame(state.cat);
});
$('btnReselect').addEventListener('click', () => {
  window.NekoSfx.startBgm();
  paintBgmBtns();
  renderSelect();
  show('select');
});

$('startArt').innerHTML = buildCatSvg(CATS[0], { className: 'happy' });
})();
