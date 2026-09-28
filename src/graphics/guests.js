// 놀러 오는 손님 그림 (120×120, 오른쪽을 봐요)
import { face } from './characters.js';

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
    <circle cx="44" cy="58" r="34" fill="#FFF3E0" stroke="#B8651E" stroke-width="3"/>
    <path d="M44 58 m0 -26 a26 26 0 1 1 -1 0 M44 58 m0 -16 a16 16 0 1 1 -1 0 M44 58 m0 -7 a7 7 0 1 1 -1 0" fill="none" stroke="#D9793A" stroke-width="4"/>
    <g stroke="#D9793A" stroke-width="3" stroke-linecap="round"><path d="M76 80 q8 10 2 22"/><path d="M84 78 q12 8 8 22"/><path d="M92 74 q14 4 14 18"/></g>
    <path d="M70 46 Q92 40 104 56 Q106 76 80 80 Q70 70 70 46Z" fill="#F4A261" stroke="#B8651E" stroke-width="3"/>
    <path d="M70 44 Q88 26 108 40 L104 48 Q88 38 72 50Z" fill="#2B2B2B"/><circle cx="92" cy="38" r="3" fill="#fff"/>
    <circle cx="96" cy="60" r="4" fill="#10222e"/><circle cx="97.5" cy="58.5" r="1.3" fill="#fff"/>
    <path d="M78 56 l10 8" stroke="#2B2B2B" stroke-width="3"/><ellipse cx="82" cy="60" rx="5" ry="4" fill="#2B2B2B"/>
    <path d="M90 70 q5 4 10 -1" stroke="#10222e" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,

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

  whale: () => `
    <path d="M92 26 v-10 M92 20 q-8 -8 -14 -4 M92 20 q8 -8 14 -4" stroke="#7FD3E6" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M24 72 L8 58 Q14 72 8 88 Z" fill="#4A9CD1"/>
    <path d="M20 74 Q22 42 62 42 Q100 42 102 72 Q100 98 62 98 Q24 98 20 74Z" fill="#6CB4E4" stroke="#3E86BD" stroke-width="3"/>
    <path d="M36 86 Q64 100 96 82 Q92 96 62 97 Q42 97 36 86Z" fill="#E3F4FC"/>
    <path d="M58 40 l-8 -8 l2 10 z M58 40 l8 -8 l-2 10 z" fill="#FF8FB1" stroke="#E0508A" stroke-width="1.5"/><circle cx="58" cy="40" r="3.5" fill="#E0508A"/>
    ${face(78, 68, 0.8)}`
};

export function guestSVG(id, size = 120, silhouette = false) {
  return `<svg class="char-svg guest-svg ${silhouette ? 'silhouette' : ''}" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DRAW[id]()}</svg>`;
}
