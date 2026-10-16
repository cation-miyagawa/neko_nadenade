(() => {
'use strict';

const GAME_CONFIG = {
  durationSec: 60,
  angryLine: 30,
  angryMoodPenalty: 5,
  angryFaceMs: 1200,
};

const ZONE_NAMES = {
  head: '頭の上',
  face: 'ほっぺ',
  chin: 'あごの下',
  back: '背中',
  belly: 'お腹',
  paws: 'あし',
  tail: 'しっぽ',
};
const ALL_ZONES = Object.keys(ZONE_NAMES);

const TAIL_D = 'M409 257 Q488 264 510 208 Q524 172 494 148';

function tail(outer, inner) {
  return `<path class="tail-outer" d="${TAIL_D}" stroke-width="${outer}"/>`
    + `<path class="tail-inner" d="${TAIL_D}" stroke-width="${inner}"/>`;
}

const CATS = [
  {
    id: 'munchkin',
    name: 'マンチカン',
    level: '初心者向け',
    levelClass: 'easy',
    description: '短い脚がチャームポイント。どこをなでても喜ぶ人なつっこい子。',
    moodNote: 'いつもごきげん。連打すると少し下がる',
    likes: ALL_ZONES,
    mood: {
      start: 85,
      base: { type: 'fixed', value: 85 },
      drift: 6,
      rapidMs: 350,
      rapidPenalty: 4,
      calmGain: 3,
      dislikePenalty: 0,
    },
    hearts: { good: 2, bad: 0, angry: 3 },
    lines: {
      good: ['{zone}なでなで、うれしいにゃ！ 😻', '{zone}も好きにゃ〜 💖', 'もっともっと〜 🐾', 'ごろごろごろ… 😽'],
      rapid: ['ちょっと速いにゃ〜 😹', 'あわてないでにゃ 🐾'],
      bad: ['{zone}はイヤにゃ！ 😾'],
      angry: ['今はひとやすみしたいにゃ… 😿', 'もう、なですぎにゃ！ 😾'],
    },
    look: {
      colors: { fur: '#d9a16e', stroke: '#a87351', mark: '#bf845b', belly: '#f6dfbc', inner: '#f4ad9d', nose: '#c66d82' },
      tail: tail(57, 49) + '<path class="mark-line" d="M486 191 Q509 193 516 178" stroke-width="10"/>',
      bodyMarks: '<path class="mark" d="M296 175 Q315 202 302 219 L283 186Z M353 175 Q373 200 364 218 L346 176Z M408 192 Q425 213 412 229 L397 191Z"/>',
      paws: '<ellipse class="fur" cx="245" cy="328" rx="34" ry="15"/><ellipse class="fur" cx="410" cy="331" rx="34" ry="15"/>',
      ears: '<path class="fur" d="M135 135 L115 49 Q111 37 126 45 L184 83Z"/><path class="fur" d="M230 81 L282 42 Q296 33 294 52 L278 138Z"/>'
        + '<path class="inner-ear" d="M139 113 L128 67 L166 95Z M250 94 L283 68 L267 120Z"/>',
      head: '<ellipse class="fur" cx="204" cy="172" rx="114" ry="99"/>',
      headMarks: '<path class="mark" d="M177 76 L189 114 L172 126 L161 83Z M216 74 L220 119 L203 121 L201 76Z M244 83 L240 120 L226 117 L230 78Z"/>',
      eyes: '<circle cx="160" cy="158" r="14" fill="#3b2b2c"/><circle cx="165" cy="152" r="4.5" fill="#fff"/>'
        + '<circle cx="248" cy="158" r="14" fill="#3b2b2c"/><circle cx="253" cy="152" r="4.5" fill="#fff"/>',
    },
  },
  {
    id: 'mix',
    name: 'MIX',
    level: '中級者向け',
    levelClass: 'normal',
    description: '近所にいそうなキジトラの雑種。気分の波があって、なでる場所にうるさい。',
    moodNote: '上がったり下がったり。連打するとすぐ下がる',
    likes: ['head', 'chin'],
    mood: {
      start: 55,
      base: { type: 'wave', center: 55, amplitude: 30, period: 10 },
      drift: 5,
      rapidMs: 600,
      rapidPenalty: 12,
      calmGain: 4,
      dislikePenalty: 15,
    },
    hearts: { good: 3, bad: 3, angry: 4 },
    lines: {
      good: ['{zone}、そこそこいいにゃ 😺', '{zone}は好きかも 💛', 'まあ、悪くないにゃ ✨'],
      rapid: ['ちょっと速いにゃ 😼', 'もうちょっとゆっくり… 😼'],
      bad: ['{zone}は触らないでにゃ！ 😾', '{zone}はダメにゃ！ 🙀'],
      angry: ['今はそういう気分じゃないにゃ 😾', 'シャーッ！ 放っておいて！ 😾'],
    },
    look: {
      colors: { fur: '#c5b089', stroke: '#6a5844', mark: '#5a4634', belly: '#f4eee4', inner: '#e8b4a8', nose: '#b86b70' },
      tail: tail(57, 49)
        + '<path class="mark-line" d="M452 248 L470 268 M478 218 L508 236 M492 184 L528 176" stroke-width="9" stroke-linecap="butt"/>',
      bodyMarks: '<path class="mark" d="M292 176 Q312 204 298 222 L278 188Z M348 174 Q368 202 358 220 L340 176Z M402 190 Q420 214 408 230 L392 190Z"/>'
        + '<path class="mark-line" d="M310 198 Q318 216 310 232 M360 196 Q368 214 360 230 M410 208 Q418 224 410 238" stroke-width="5" opacity=".75"/>',
      paws: '<ellipse class="fur" cx="239" cy="323" rx="43" ry="21"/><ellipse class="fur" cx="416" cy="327" rx="43" ry="20"/>',
      ears: '<path class="fur" d="M135 135 L115 49 Q111 37 126 45 L184 83Z"/><path class="fur" d="M230 81 L282 42 Q296 33 294 52 L278 138Z"/>'
        + '<path class="inner-ear" d="M139 113 L128 67 L166 95Z M250 94 L283 68 L267 120Z"/>',
      head: '<ellipse class="fur" cx="204" cy="172" rx="114" ry="99"/>',
      headMarks: '<path class="mark" d="M177 76 L189 114 L172 126 L161 83Z M216 74 L220 119 L203 121 L201 76Z M244 83 L240 120 L226 117 L230 78Z"/>',
      eyes: '<circle cx="160" cy="158" r="16" fill="#7fb84a" stroke="#3a2a20" stroke-width="3.5"/><circle cx="160" cy="158" r="7" fill="#2a1c14"/><circle cx="165" cy="152" r="4" fill="#fff"/>'
        + '<circle cx="248" cy="158" r="16" fill="#7fb84a" stroke="#3a2a20" stroke-width="3.5"/><circle cx="248" cy="158" r="7" fill="#2a1c14"/><circle cx="253" cy="152" r="4" fill="#fff"/>',
    },
  },
  {
    id: 'manul',
    name: 'マヌルネコ',
    level: '上級者向け',
    levelClass: 'hard',
    description: '世界最古の猫のひとつ。いつも不機嫌そうな顔。ときどき気まぐれでなでさせてくれる。',
    moodNote: '基本低い。たまに「気まぐれタイム」がくる',
    likes: ['head'],
    mood: {
      start: 32,
      base: { type: 'fixed', value: 32 },
      whim: { every: [8, 14], duration: 6, value: 70 },
      drift: 6,
      rapidMs: 900,
      rapidPenalty: 15,
      calmGain: 5,
      dislikePenalty: 20,
    },
    hearts: { good: 5, bad: 5, angry: 5 },
    lines: {
      good: ['……まあ、{zone}なら許す。 😐', '……ふん。 😑', '……悪くない。 😼'],
      rapid: ['……しつこい。 😾', '……ゆっくりにしろ。 😼'],
      bad: ['{zone}に触るな。 😾', '……{zone}は無理。 🙀'],
      angry: ['ヴーッ…… 😾', 'シャーーッ！！ 😾', '……今は放っておけ。 😾'],
    },
    look: {
      colors: { fur: '#a89c8b', stroke: '#6b6156', mark: '#3f3832', belly: '#ddd4c6', inner: '#8a7a6c', nose: '#8a6c66' },
      tail: tail(60, 52)
        + '<path class="mark-line" d="M461 223 L486 273 M484 198 L536 218 M486 182 L540 168" stroke-width="9" stroke-linecap="butt"/>'
        + '<circle class="mark" cx="494" cy="148" r="28"/>',
      bodyMarks: '<path class="mark-line" d="M300 180 Q306 196 300 210 M340 174 Q346 192 340 208 M380 178 Q386 196 380 212 M420 190 Q426 206 420 220" stroke-width="4" opacity=".35"/>',
      paws: '<ellipse class="fur" cx="239" cy="323" rx="45" ry="22"/><ellipse class="fur" cx="416" cy="327" rx="45" ry="21"/>',
      ears: '<path class="fur" d="M86 150 Q82 100 118 96 Q140 104 144 128Z"/><path class="fur" d="M322 150 Q326 100 290 96 Q268 104 264 128Z"/>'
        + '<path class="inner-ear" d="M98 136 Q98 112 116 108 Q128 114 130 126Z M310 136 Q310 112 292 108 Q280 114 278 126Z"/>',
      head: '<ellipse class="fur" cx="204" cy="178" rx="126" ry="92"/>',
      headMarks: '<circle class="mark" cx="172" cy="112" r="4"/><circle class="mark" cx="190" cy="104" r="4"/><circle class="mark" cx="208" cy="102" r="4"/>'
        + '<circle class="mark" cx="226" cy="104" r="4"/><circle class="mark" cx="242" cy="112" r="4"/><circle class="mark" cx="196" cy="120" r="3.5"/><circle class="mark" cx="218" cy="120" r="3.5"/>'
        + '<path class="mark-line" d="M134 176 Q118 190 96 192 M138 192 Q122 208 104 212 M274 176 Q290 190 312 192 M270 192 Q286 208 304 212" stroke-width="5"/>',
      muzzle: '<ellipse cx="204" cy="206" rx="54" ry="30" fill="#ece6da"/>',
      eyes: '<circle cx="160" cy="160" r="15" fill="#e3c24a" stroke="#3a332c" stroke-width="3.5"/><circle cx="160" cy="160" r="6" fill="#1f1a16"/><circle cx="164" cy="155" r="3" fill="#fff"/>'
        + '<circle cx="248" cy="160" r="15" fill="#e3c24a" stroke="#3a332c" stroke-width="3.5"/><circle cx="248" cy="160" r="6" fill="#1f1a16"/><circle cx="252" cy="155" r="3" fill="#fff"/>'
        + '<path d="M140 142 L180 148 M268 142 L228 148" stroke="#3a332c" stroke-width="5" stroke-linecap="round"/>',
    },
  },
];

const SMILE_EYES = '<path d="M142 159 Q160 141 176 160 M230 160 Q248 141 267 159" stroke="#4e3839" stroke-width="6" stroke-linecap="round" fill="none"/>';
const ANGRY_EYES = '<path d="M140 151 L178 165 M265 151 L226 165" stroke="#4e3839" stroke-width="6" stroke-linecap="round"/>'
  + '<text x="300" y="92" font-size="44">💢</text>';
const MOUTH = '<path class="nose" d="M195 185 Q203 177 212 185 L204 194Z"/>'
  + '<path class="whisker" d="M204 193 L204 204 M204 204 Q191 218 178 204 M204 204 Q217 218 230 204"/>'
  + '<path class="whisker" d="M168 199 L111 188 M168 208 L105 209 M168 218 L117 231 M241 199 L295 188 M241 208 L306 209 M241 218 L292 231"/>';
const ZONES = '<g class="zones">'
  + '<path data-zone="tail" d="M453 247 Q485 253 504 214 Q536 166 497 125 L469 140 Q505 170 480 201 Q467 222 443 219Z"/>'
  + '<ellipse data-zone="back" cx="360" cy="221" rx="113" ry="46"/>'
  + '<ellipse data-zone="belly" cx="348" cy="286" rx="76" ry="42"/>'
  + '<ellipse data-zone="paws" cx="239" cy="323" rx="47" ry="24"/><ellipse data-zone="paws" cx="416" cy="327" rx="47" ry="24"/>'
  + '<ellipse data-zone="face" cx="204" cy="185" rx="118" ry="50"/>'
  + '<ellipse data-zone="head" cx="204" cy="108" rx="112" ry="62"/>'
  + '<ellipse data-zone="chin" cx="204" cy="226" rx="64" ry="34"/>'
  + '</g>';

function buildCatSvg(cat, opts = {}) {
  const L = cat.look;
  const c = L.colors;
  const style = `--fur:${c.fur};--fur-stroke:${c.stroke};--mark:${c.mark};--belly:${c.belly};--inner:${c.inner};--nose:${c.nose}`;
  return `<svg class="cat-svg ${opts.className || ''}" viewBox="0 0 600 390" style="${style}" role="img" aria-label="${cat.name}のイラスト">`
    + '<ellipse cx="300" cy="342" rx="205" ry="27" fill="#ccb0a3" opacity=".27"/>'
    + `<g class="tail">${L.tail}</g>`
    + (L.behindBody || '')
    + (L.body || '<ellipse class="fur" cx="335" cy="257" rx="153" ry="87"/>')
    + (L.bodyMarks || '')
    + (L.belly !== undefined ? L.belly : '<ellipse class="belly" cx="340" cy="284" rx="79" ry="46"/>')
    + L.paws
    + (L.ruff || '')
    + L.ears
    + (L.behindHead || '')
    + L.head
    + (L.headMarks || '')
    + (L.blush || '<ellipse class="blush" cx="129" cy="196" rx="22" ry="12"/><ellipse class="blush" cx="282" cy="196" rx="22" ry="12"/>')
    + (L.muzzle || '')
    + `<g class="eyes">${L.eyes}</g>`
    + `<g class="smile">${L.smile || SMILE_EYES}</g>`
    + `<g class="angryeyes">${L.angryEyes || ANGRY_EYES}</g>`
    + (L.mouth || MOUTH)
    + (L.extras || '')
    + (opts.interactive ? ZONES : '')
    + '</svg>';
}

function likesText(cat) {
  return cat.likes.length === ALL_ZONES.length ? '全身' : cat.likes.map(z => ZONE_NAMES[z]).join('・');
}

window.NekoData = { GAME_CONFIG, ZONE_NAMES, CATS, buildCatSvg, likesText };
})();
