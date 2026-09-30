// 코드로 그린 바다 친구 8명 (나중에 이미지로 바꿀 자리).
// charSVG(dan, progress, size): progress 1 알 · 2 아기 · 3 성장 · 4 황금
import { CHARACTERS } from '../data/characters.js';
import { GUESTS } from '../data/guests.js';
import { SEA2 } from '../data/sea2.js';

const GOLD = { c: '#FFD54A', d: '#D9A400', l: '#FFF3B0' };

function mix(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * amount));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function darken(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - amount)));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function face(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="part-eyes" style="animation-delay:-${(Math.random() * 5).toFixed(2)}s">
      <ellipse cx="-9" cy="0" rx="5.4" ry="6.2" fill="#fff"/><ellipse cx="9" cy="0" rx="5.4" ry="6.2" fill="#fff"/>
      <circle cx="-8.2" cy="1" r="3.6" fill="#10222e"/><circle cx="9.8" cy="1" r="3.6" fill="#10222e"/>
      <circle cx="-6.8" cy="-.6" r="1.3" fill="#fff"/><circle cx="11.2" cy="-.6" r="1.3" fill="#fff"/>
    </g>
    <ellipse cx="-15.5" cy="8" rx="4" ry="2.4" fill="#FF8FA3" opacity=".75"/><ellipse cx="15.5" cy="8" rx="4" ry="2.4" fill="#FF8FA3" opacity=".75"/>
    <path d="M-4 7.5 Q0 12 4 7.5" stroke="#10222e" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>`;
}

function crown(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-14 6 L-14 -6 L-7 1 L0 -10 L7 1 L14 -6 L14 6 Z" fill="#FFC53D" stroke="#B7860B" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="0" cy="-10" r="2.6" fill="#FF7A59"/><circle cx="-14" cy="-6" r="2" fill="#7FD3E6"/><circle cx="14" cy="-6" r="2" fill="#7FD3E6"/>
  </g>`;
}

function sparkles() {
  const star = (x, y, r) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#FFF7C2"/>`;
  return `<g class="twinkle">${star(14, 22, 6)}${star(106, 30, 5)}${star(100, 100, 6)}${star(18, 96, 4)}</g>`;
}

// ---- 종별 그림 (120×120, p = { c, d, l } 색) ----

function seahorse(x, p, s) {
  return `<g transform="translate(${x} 0) scale(${s}) translate(${-x} 0)">
    <path class="part-curl" d="M${x - 2} 80 q-12 16 2 22 q10 4 9 -7" stroke="${p.d}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M${x - 14} 50 l-8 -6 l2 12 z" fill="${p.d}"/>
    <ellipse cx="${x}" cy="62" rx="14" ry="21" fill="${p.c}"/>
    <ellipse cx="${x + 3}" cy="64" rx="7" ry="14" fill="${p.l}"/>
    <path d="M${x - 3} 56 h10 M${x - 3} 63 h11 M${x - 2} 70 h9" stroke="${p.d}" stroke-width="1.6" opacity=".5"/>
    <rect x="${x + 8}" y="33" width="15" height="8" rx="4" fill="${p.c}"/>
    <circle cx="${x + 1}" cy="36" r="13" fill="${p.c}"/>
    <path d="M${x - 6} 23 l4 -7 l3 7 l4 -6 l2 7" fill="${p.d}"/>
    ${face(x + 3, 36, 0.55)}
  </g>`;
}

const DRAW = {
  2: (p) => `${seahorse(40, p, 0.95)}${seahorse(78, p, 0.95)}
    <path d="M52 50 q8 -6 16 0" stroke="#FF8FA3" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  3: (p) => `
    <g class="part-tail" fill="${p.d}">
      <ellipse cx="24" cy="42" rx="18" ry="9" transform="rotate(-32 24 42)"/>
      <ellipse cx="20" cy="62" rx="19" ry="9"/>
      <ellipse cx="24" cy="82" rx="18" ry="9" transform="rotate(32 24 82)"/>
    </g>
    <path d="M58 36 q10 -18 26 -6 z" fill="${p.d}"/>
    <ellipse cx="66" cy="62" rx="32" ry="27" fill="${p.c}"/>
    <ellipse cx="70" cy="70" rx="20" ry="13" fill="${p.l}"/>
    <path d="M60 86 q6 10 14 4" fill="${p.d}"/>
    ${face(72, 56, 0.9)}`,

  4: (p) => `
    <g class="part-paddle" fill="${mix(p.c, 0.35)}" stroke="${p.d}" stroke-width="2">
      <ellipse cx="26" cy="52" rx="15" ry="8" transform="rotate(-28 26 52)"/>
      <ellipse cx="94" cy="52" rx="15" ry="8" transform="rotate(28 94 52)"/>
      <ellipse cx="32" cy="92" rx="13" ry="7" transform="rotate(24 32 92)"/>
      <ellipse cx="88" cy="92" rx="13" ry="7" transform="rotate(-24 88 92)"/>
    </g>
    <ellipse cx="60" cy="72" rx="34" ry="26" fill="${p.c}" stroke="${p.d}" stroke-width="2.5"/>
    <path d="M60 47 V97 M27 72 H93" stroke="${p.d}" stroke-width="2.5"/>
    <circle cx="60" cy="40" r="19" fill="${mix(p.c, 0.35)}" stroke="${p.d}" stroke-width="2"/>
    ${face(60, 39, 0.75)}`,

  5: (p) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 50 : 22;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${(60 + r * Math.cos(a)).toFixed(1)},${(64 + r * Math.sin(a)).toFixed(1)}`);
    }
    return `
      <polygon points="${pts.join(' ')}" fill="${p.c}" stroke="${p.d}" stroke-width="6" stroke-linejoin="round"/>
      <g fill="${p.l}"><circle cx="60" cy="28" r="3"/><circle cx="26" cy="54" r="3"/><circle cx="94" cy="54" r="3"/><circle cx="38" cy="94" r="3"/><circle cx="82" cy="94" r="3"/></g>
      ${face(60, 64, 0.85)}`;
  },

  6: (p) => {
    let legs = '';
    for (let i = 0; i < 6; i++) {
      const x = 32 + i * 11.2;
      legs += `<path class="part-leg" style="animation-delay:-${(i * 0.2).toFixed(1)}s" d="M${x} 70 q-6 10 0 20 q6 10 0 20" stroke="${p.d}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    }
    let flake = '';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      flake += `<line x1="60" y1="36" x2="${(60 + 10 * Math.cos(a)).toFixed(1)}" y2="${(36 + 10 * Math.sin(a)).toFixed(1)}"/>`;
    }
    return `${legs}
      <path d="M24 72 Q24 22 60 22 Q96 22 96 72 Q90 78 84 72 Q78 78 72 72 Q66 78 60 72 Q54 78 48 72 Q42 78 36 72 Q30 78 24 72Z" fill="${p.c}" opacity=".95"/>
      <g stroke="${p.l}" stroke-width="2.4" stroke-linecap="round">${flake}</g>
      ${face(60, 56, 0.85)}`;
  },

  7: (p) => {
    const rainbow = ['#FF5A5A', '#FF9A3C', '#FFD23C', '#5ACB6A', '#3CA8FF', '#4B5CD6', '#9B5BD6'];
    const scales = rainbow.map((col, i) => `<circle cx="${30 + (i % 4) * 10 + (i > 3 ? 5 : 0)}" cy="${i > 3 ? 74 : 62}" r="5.5" fill="${col}"/>`).join('');
    return `
      <path class="part-tail" d="M26 62 L6 42 L10 62 L6 82 Z" fill="${p.d}"/>
      <path d="M56 38 q14 -20 30 -2 z" fill="${p.d}"/>
      <ellipse cx="62" cy="62" rx="38" ry="27" fill="${p.c}"/>
      ${scales}
      ${face(84, 56, 0.8)}`;
  },

  8: (p) => {
    let legs = '';
    for (let i = 0; i < 8; i++) {
      const x = 24 + i * 10.3;
      const dir = i < 4 ? -1 : 1;
      legs += `<path class="part-leg" style="animation-delay:-${(i * 0.15).toFixed(2)}s" d="M${x} 66 q${dir * 4} 18 ${dir * 10} 30" stroke="${p.c}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    }
    return `${legs}
      <ellipse cx="60" cy="48" rx="34" ry="32" fill="${p.c}"/>
      <ellipse cx="48" cy="30" rx="8" ry="5" fill="${p.l}" opacity=".7"/>
      <g fill="${p.d}" opacity=".35"><circle cx="78" cy="30" r="3"/><circle cx="86" cy="42" r="2.4"/><circle cx="36" cy="44" r="2.4"/></g>
      ${face(60, 54, 0.9)}`;
  },

  9: (p) => {
    let drops = '';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.1 + (0.8 * i) / 8);
      drops += `<ellipse cx="${(92 + 22 * Math.cos(a)).toFixed(1)}" cy="${(34 + 24 * Math.sin(a)).toFixed(1)}" rx="3.4" ry="4.4" fill="#5CC8EC"/>`;
    }
    return `
      <path class="part-tail" d="M22 70 L4 54 Q10 70 4 88 Z" fill="${p.d}"/>
      <path d="M18 72 Q20 38 64 38 Q104 38 106 70 Q104 98 62 98 Q24 98 18 72Z" fill="${p.c}"/>
      <path d="M36 84 Q64 100 98 80 Q94 96 62 97 Q40 97 36 84Z" fill="${p.l}"/>
      <path d="M92 38 v-12" stroke="#5CC8EC" stroke-width="3" stroke-linecap="round"/>
      ${drops}
      ${face(78, 66, 0.85)}`;
  }
};

// 종마다 왕관 위치
const CROWN_AT = { 2: [59, 20, 0.8], 3: [70, 30, 0.9], 4: [60, 18, 0.9], 5: [60, 12, 0.8], 6: [60, 16, 0.9], 7: [80, 34, 0.8], 8: [60, 14, 1], 9: [66, 36, 0.8] };

function eggSVG(color, dan) {
  return `
    <ellipse cx="60" cy="106" rx="30" ry="6" fill="rgba(10,40,60,.18)"/>
    <ellipse cx="60" cy="62" rx="36" ry="44" fill="${mix(color, 0.75)}" stroke="${color}" stroke-width="3"/>
    <g fill="${mix(color, 0.35)}"><circle cx="40" cy="44" r="7"/><circle cx="80" cy="54" r="5"/><circle cx="48" cy="88" r="6"/><circle cx="82" cy="84" r="4"/></g>
    <ellipse cx="46" cy="36" rx="7" ry="11" fill="#fff" opacity=".6" transform="rotate(-20 46 36)"/>
    <text x="60" y="76" text-anchor="middle" font-family="Jua, sans-serif" font-size="34" fill="${darken(color, 0.25)}">${dan}</text>`;
}

// ---- 그림 파일 (public/characters/단-단계.png, guide.png, guest-손님id.png) ----
// 있는 그림은 그림으로, 없는 칸은 아래 코드 그림으로 보여줘요.
const available = new Set();
const imageUrl = (name) => `${import.meta.env.BASE_URL}characters/${name}.png`;

// 앱 시작 때 한 번 어떤 그림이 있는지 확인해요
export function preloadCharacterImages() {
  const names = ['guide', 'legend', 'boss-captain', 'boss-captain-angry', 'boss-captain-dizzy', 'boss-shark', 'boss-shark-angry', 'boss-shark-dizzy', ...GUESTS.map((g) => `guest-${g.id}`), ...SEA2.map((s) => `sea2-${s.id}`), ...Object.keys(CHARACTERS).flatMap((d) => [1, 2, 3, 4].map((p) => `${d}-${p}`))];
  return Promise.all(names.map((name) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      available.add(name);
      resolve();
    };
    img.onerror = resolve;
    img.src = imageUrl(name);
  })));
}

export const hasImage = (name) => available.has(name);

// HTML 안에서도, 지도 같은 SVG 안에서도 쓸 수 있게 svg로 감싸요
export function imageArt(name, size, wobble = false) {
  const image = `<image href="${imageUrl(name)}" x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>`;
  return `<svg class="char-svg char-img" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${wobble ? `<g class="egg-wobble">${image}</g>` : image}</svg>`;
}

export function charSVG(dan, progress = 2, size = 120) {
  const name = `${dan}-${Math.max(1, progress)}`;
  if (available.has(name)) return imageArt(name, size, progress <= 1);
  const base = CHARACTERS[dan].color;
  let body;
  if (progress <= 1) {
    body = `<g class="egg-wobble">${eggSVG(base, dan)}</g>`;
  } else if (progress === 4) {
    const [cx, cy, cs] = CROWN_AT[dan];
    body = `<circle cx="60" cy="62" r="54" fill="#FFE98A" opacity=".45"/>${sparkles()}${DRAW[dan](GOLD)}${crown(cx, cy, cs)}`;
  } else {
    const p = progress === 2
      ? { c: mix(base, 0.3), d: base, l: mix(base, 0.7) }
      : { c: base, d: darken(base, 0.22), l: mix(base, 0.55) };
    const art = DRAW[dan](p);
    body = progress === 2 ? `<g transform="translate(60 66) scale(.8) translate(-60 -66)">${art}</g>` : art;
  }
  return `<svg class="char-svg" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}

// 안내 캐릭터 뽀글이 (물방울)
export function guideSVG(size = 120) {
  if (available.has('guide')) return imageArt('guide', size);
  return `<svg class="char-svg" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="60" cy="64" r="44" fill="#DFF6FD" stroke="#7FD3E6" stroke-width="4"/>
    <ellipse cx="42" cy="42" rx="10" ry="14" fill="#fff" transform="rotate(-30 42 42)"/>
    <circle cx="100" cy="24" r="7" fill="#DFF6FD" stroke="#7FD3E6" stroke-width="3"/>
    <circle cx="110" cy="44" r="4" fill="#DFF6FD" stroke="#7FD3E6" stroke-width="2"/>
    ${face(60, 68, 1)}
  </svg>`;
}
