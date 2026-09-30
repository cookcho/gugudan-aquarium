// 두 번째 바다 친구 그림. 단계: 0 없음 · 1 알 · 2 아기 · 3 성장 · 4 황금
// 그림 파일(sea2-섬id.png)이 있으면 그걸 쓰고, 없으면 이모지로 그려요. 아기는 작게, 황금은 금빛에 왕관.
import { hasImage, imageArt } from './characters.js';
import { SEA2 } from '../data/sea2.js';

function mix(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * t));
  return `rgb(${c.join(',')})`;
}

function eggSVG(color, icon, size) {
  return `<svg class="char-svg" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true"><g class="egg-wobble">
    <ellipse cx="60" cy="106" rx="30" ry="6" fill="rgba(10,40,60,.18)"/>
    <ellipse cx="60" cy="62" rx="36" ry="44" fill="${mix(color, 0.72)}" stroke="${color}" stroke-width="3"/>
    <g fill="${mix(color, 0.4)}"><circle cx="40" cy="44" r="7"/><circle cx="80" cy="54" r="5"/><circle cx="48" cy="88" r="6"/><circle cx="82" cy="84" r="4"/></g>
    <ellipse cx="46" cy="36" rx="7" ry="11" fill="#fff" opacity=".6" transform="rotate(-20 46 36)"/>
    <text x="60" y="76" text-anchor="middle" font-size="34">${icon}</text></g></svg>`;
}

// variant: 'land' 모래밭 자세 · 'sleep' 자는 모습 (그림이 없으면 땅 그림 → 기본 그림 순서로 써요)
export function sea2Art(islandId, stage, size, icon = '', variant = '') {
  const isl = SEA2.find((s) => s.id === islandId);
  const f = isl.friend;
  if (stage <= 1) return eggSVG(f.color, stage === 1 ? icon : '?', size);
  const base = `sea2-${islandId}`;
  const name = [variant && `${base}-${variant}`, variant === 'sleep' && `${base}-land`, base].find((n) => n && hasImage(n)) || base;
  const inner = hasImage(name)
    ? imageArt(name, size)
    : `<svg class="char-svg" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="62" r="46" fill="${mix(f.color, 0.75)}" stroke="${f.color}" stroke-width="4"/>
        <text x="60" y="84" text-anchor="middle" font-size="62">${f.emoji}</text></svg>`;
  const cls = stage === 2 ? 'baby' : stage === 4 ? 'gold' : '';
  return `<span class="sea2-art ${cls}" style="width:${size}px;height:${size}px">${inner}${stage === 4 ? '<span class="sea2-crown">👑</span>' : ''}</span>`;
}
