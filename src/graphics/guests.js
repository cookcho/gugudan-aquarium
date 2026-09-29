// 놀러 오는 손님 그림 (120×120, 오른쪽을 봐요)
// public/characters/guest-손님id.png 그림이 있으면 그림으로 보여줘요.
import { face, hasImage, imageArt } from './characters.js';

const DRAW = {
  crab: () => `
    <path d="M32 80 l-16 8 M34 88 l-16 12 M38 94 l-12 14 M88 80 l16 8 M86 88 l16 12 M82 94 l12 14" stroke="#B83C22" stroke-width="5" stroke-linecap="round"/>
    <path d="M28 60 q-20 -6 -16 -28 q11 6 9 15 q9 -11 17 -2 q-4 13 -10 15z" fill="#E8603C" stroke="#B83C22" stroke-width="3" stroke-linejoin="round"/>
    <path d="M92 60 q20 -6 16 -28 q-11 6 -9 15 q-9 -11 -17 -2 q4 13 10 15z" fill="#E8603C" stroke="#B83C22" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="60" cy="78" rx="34" ry="23" fill="#E8603C" stroke="#B83C22" stroke-width="3"/>
    <ellipse cx="52" cy="70" rx="10" ry="5" fill="#FF9C7A" opacity=".7"/>
    <path d="M50 58 l-2 -16 M70 58 l2 -16" stroke="#B83C22" stroke-width="4" stroke-linecap="round"/>
    <circle cx="48" cy="40" r="7" fill="#fff" stroke="#B83C22" stroke-width="2"/><circle cx="72" cy="40" r="7" fill="#fff" stroke="#B83C22" stroke-width="2"/>
    <circle cx="49.5" cy="41" r="3.4" fill="#10222e"/><circle cx="73.5" cy="41" r="3.4" fill="#10222e"/>
    <ellipse cx="44" cy="84" rx="4" ry="2.4" fill="#FF8FA3" opacity=".8"/><ellipse cx="76" cy="84" rx="4" ry="2.4" fill="#FF8FA3" opacity=".8"/>
    <path d="M55 86 q5 5 10 0" stroke="#10222e" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,

  clown: () => `
    <path d="M26 62 L6 46 Q13 62 6 78 Z" fill="#FF8C1A" stroke="#1B1B1B" stroke-width="3" stroke-linejoin="round"/>
    <path d="M44 38 q16 -18 32 -2 z" fill="#FF8C1A" stroke="#1B1B1B" stroke-width="3" stroke-linejoin="round"/>
    <path d="M52 88 q8 12 18 4 z" fill="#FF8C1A" stroke="#1B1B1B" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="62" cy="62" rx="38" ry="26" fill="#FF8C1A" stroke="#1B1B1B" stroke-width="3"/>
    <g stroke="#1B1B1B" stroke-width="11" fill="none"><path d="M36 43 Q30 62 36 81"/><path d="M56 37 Q50 62 56 87"/><path d="M78 39 Q72 62 78 85"/></g>
    <g stroke="#fff" stroke-width="7" fill="none"><path d="M36 43 Q30 62 36 81"/><path d="M56 37 Q50 62 56 87"/><path d="M78 39 Q72 62 78 85"/></g>
    <path d="M62 70 q10 4 14 14 q-10 0 -14 -14z" fill="#FF8C1A" stroke="#1B1B1B" stroke-width="2.5"/>
    ${face(88, 58, 0.62)}`,

  tang: () => `
    <path d="M24 62 L4 44 L11 62 L4 80 Z" fill="#FFD23C" stroke="#C99A00" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M20 62 Q30 30 66 30 Q102 34 104 62 Q102 90 66 94 Q30 94 20 62Z" fill="#2F6FE0" stroke="#1B3F8C" stroke-width="3"/>
    <path d="M32 40 Q66 20 98 44" stroke="#10224A" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M32 84 Q62 102 96 80" stroke="#10224A" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M32 54 Q50 40 74 46 Q62 50 56 58 Q48 70 36 68 Q46 60 32 54Z" fill="#10224A"/>
    <path d="M22 58 l10 -5 l0 10z" fill="#FFD23C"/>
    <ellipse cx="74" cy="76" rx="10" ry="5" fill="#5C95F0" opacity=".7"/>
    ${face(88, 64, 0.82)}`,

  puffer: () => {
    let spikes = '';
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      const x1 = 58 + 34 * Math.cos(a);
      const y1 = 62 + 34 * Math.sin(a);
      const x2 = 58 + 44 * Math.cos(a);
      const y2 = 62 + 44 * Math.sin(a);
      spikes += `<path d="M${(x1 - 4 * Math.sin(a)).toFixed(1)} ${(y1 + 4 * Math.cos(a)).toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${(x1 + 4 * Math.sin(a)).toFixed(1)} ${(y1 - 4 * Math.cos(a)).toFixed(1)}Z" fill="#E0A800"/>`;
    }
    return `${spikes}
      <path d="M22 62 L6 50 L10 62 L6 74 Z" fill="#E0A800"/>
      <circle cx="58" cy="62" r="36" fill="#F2C94C" stroke="#C89A12" stroke-width="3"/>
      <ellipse cx="62" cy="76" rx="24" ry="14" fill="#FFF3C4"/>
      <g fill="#C89A12" opacity=".5"><circle cx="40" cy="48" r="3"/><circle cx="50" cy="40" r="2.5"/><circle cx="36" cy="60" r="2.5"/></g>
      ${face(68, 58, 0.9)}`;
  },

  pirate: () => `
    <g stroke="#C0442A" stroke-width="4" stroke-linecap="round"><path d="M70 92 l-4 14"/><path d="M80 92 l2 14"/><path d="M90 88 l8 12"/></g>
    <path d="M14 92 Q8 50 40 34 Q60 26 70 46 Q78 70 66 92 Z" fill="#FFF3E0" stroke="#B8651E" stroke-width="3" stroke-linejoin="round"/>
    <path d="M40 40 Q62 44 60 68 Q56 86 30 88 M46 54 Q52 66 44 76 Q36 80 30 74" fill="none" stroke="#D9793A" stroke-width="4" stroke-linecap="round"/>
    <path d="M80 70 l-2 -18 M92 70 l2 -18" stroke="#C0442A" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="84" cy="80" rx="18" ry="13" fill="#E8603C" stroke="#C0442A" stroke-width="3"/>
    <path d="M100 80 q16 -8 12 -22 q-8 2 -8 10 q-6 -6 -12 0 q2 10 8 12z" fill="#E8603C" stroke="#C0442A" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="78" cy="48" r="6" fill="#fff" stroke="#C0442A" stroke-width="2"/><circle cx="79.5" cy="49" r="3" fill="#10222e"/>
    <circle cx="96" cy="48" r="6" fill="#2B2B2B"/><path d="M88 44 l16 8" stroke="#2B2B2B" stroke-width="2.5"/>
    <path d="M70 38 Q86 20 106 34 L102 42 Q86 32 74 44Z" fill="#2B2B2B"/><circle cx="88" cy="32" r="3" fill="#fff"/>
    <path d="M80 84 q5 4 10 -1" stroke="#10222e" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,

  angler: () => `
    <path d="M60 30 Q66 6 88 10" stroke="#3B4F8C" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="90" cy="12" r="12" fill="#FFE08A" opacity=".35" class="twinkle"/>
    <circle cx="90" cy="12" r="6" fill="#FFE08A" stroke="#E0B84A" stroke-width="2"/>
    <path d="M26 64 L6 48 L10 64 L6 82 Z" fill="#2C3C70"/>
    <path d="M24 64 Q26 30 62 30 Q100 30 102 62 Q100 94 62 96 Q26 96 24 64Z" fill="#3B4F8C" stroke="#22305A" stroke-width="3"/>
    <path d="M70 78 Q86 84 100 74" stroke="#fff" stroke-width="2.5" fill="none"/>
    <path d="M74 78 l3 5 l3 -4 l3 5 l3 -4 l3 4 l3 -5" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/>
    <g fill="#5B6FAF" opacity=".7"><circle cx="42" cy="52" r="3"/><circle cx="50" cy="44" r="2.4"/><circle cx="38" cy="70" r="2.6"/></g>
    ${face(72, 56, 0.85)}`,

  shrimp: () => `
    <path d="M64 34 Q92 6 116 14 M68 38 Q98 22 118 30" stroke="#E0603C" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <g stroke="#E0603C" stroke-width="3" stroke-linecap="round"><path d="M44 78 l-4 12 M54 80 l-2 12 M64 80 l0 12 M74 76 l2 12"/></g>
    <path d="M22 66 L4 52 L8 70 L2 84 Z" fill="#FF8A65" stroke="#E0603C" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 70 Q20 44 50 40 Q86 36 94 56 Q96 72 78 78 Q50 86 22 70Z" fill="#FF8A65" stroke="#E0603C" stroke-width="3"/>
    <g stroke="#E0603C" stroke-width="2" fill="none" opacity=".7"><path d="M38 44 Q34 60 40 76"/><path d="M52 41 Q48 60 54 80"/><path d="M66 41 Q62 60 68 79"/></g>
    <ellipse cx="60" cy="72" rx="16" ry="5" fill="#FFC2A8" opacity=".8"/>
    ${face(82, 56, 0.62)}`,

  manta: () => `
    <path d="M18 64 Q6 70 2 86" stroke="#2B4470" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M20 62 Q42 26 60 40 Q66 20 108 30 Q96 46 100 60 Q104 80 64 84 Q40 86 20 62Z" fill="#3E5C8A" stroke="#1E3358" stroke-width="3" stroke-linejoin="round"/>
    <path d="M40 70 Q64 84 96 66 Q92 80 64 84 Q48 84 40 70Z" fill="#EAF3FB"/>
    <path d="M98 58 q10 -6 12 4 M98 66 q10 6 10 14" stroke="#1E3358" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g fill="#6F8FBF" opacity=".6"><circle cx="54" cy="48" r="3"/><circle cx="66" cy="44" r="2.5"/><circle cx="46" cy="58" r="2.5"/></g>
    ${face(84, 60, 0.7)}`,

  cuttle: () => `
    <g stroke="#9A6BC2" stroke-width="4" stroke-linecap="round" fill="none"><path d="M92 60 q14 -4 20 -12"/><path d="M94 66 q14 2 20 -2"/><path d="M92 72 q12 8 18 10"/></g>
    <path d="M14 62 Q14 40 50 38 Q90 38 96 62 Q90 86 50 86 Q14 84 14 62Z" fill="#B58AD8" stroke="#7E52A8" stroke-width="3"/>
    <path d="M16 62 Q14 40 50 36 Q88 36 96 58 M16 64 Q16 88 50 88 Q88 88 96 68" stroke="#E7D3F5" stroke-width="5" fill="none" stroke-dasharray="4 5" stroke-linecap="round"/>
    <g fill="#E7D3F5" opacity=".75"><ellipse cx="36" cy="54" rx="6" ry="3"/><ellipse cx="50" cy="70" rx="5" ry="3"/><ellipse cx="32" cy="70" rx="4" ry="2.5"/></g>
    ${face(76, 60, 0.75)}`,

  orca: () => `
    <path d="M24 72 L8 56 Q14 72 8 90 Z" fill="#22303C"/>
    <path d="M56 46 Q60 22 72 18 Q70 36 74 46 Z" fill="#22303C"/>
    <path d="M20 74 Q22 44 62 44 Q100 44 104 72 Q100 98 62 98 Q24 98 20 74Z" fill="#22303C" stroke="#10222e" stroke-width="3"/>
    <path d="M34 84 Q64 102 100 80 Q96 96 62 97 Q40 97 34 84Z" fill="#fff"/>
    <ellipse cx="80" cy="60" rx="10" ry="6" fill="#fff" transform="rotate(-12 80 60)"/>
    <ellipse cx="44" cy="58" rx="8" ry="4" fill="#5B6B78" opacity=".7"/>
    ${face(84, 74, 0.72)}`
};

export function guestSVG(id, size = 120, silhouette = false) {
  if (hasImage(`guest-${id}`)) return imageArt(`guest-${id}`, size).replace('class="char-svg', `class="char-svg guest-svg ${silhouette ? 'silhouette' : ''}`);
  return `<svg class="char-svg guest-svg ${silhouette ? 'silhouette' : ''}" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DRAW[id]()}</svg>`;
}
