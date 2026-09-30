// 전설의 친구: 무지개 용왕 잉어 (오른쪽을 봐요). public/characters/legend.png 가 있으면 그림으로 보여줘요
import { face, hasImage, imageArt } from './characters.js';

export function legendArt(size) {
  if (hasImage('legend')) return imageArt('legend', size).replace('class="char-svg', 'class="char-svg legend-svg');
  return `<svg class="char-svg legend-svg" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="lgBody" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#FF6B8B"/><stop offset=".25" stop-color="#FFB347"/><stop offset=".5" stop-color="#FFE066"/>
        <stop offset=".75" stop-color="#6BE3B0"/><stop offset="1" stop-color="#6BA8FF"/>
      </linearGradient>
    </defs>
    <path d="M22 60 Q4 36 2 22 Q16 34 26 50 Q14 60 2 98 Q18 84 26 70Z" fill="#B58AFF" stroke="#7A4FD0" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M40 40 Q52 14 72 22 Q62 30 60 40Z" fill="#FF8FB1" stroke="#D0507A" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M48 82 Q56 104 72 98 Q62 90 62 80Z" fill="#6BCBFF" stroke="#3A8FC0" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 60 Q30 36 64 36 Q100 38 106 60 Q100 82 64 84 Q30 84 22 60Z" fill="url(#lgBody)" stroke="#7A4FD0" stroke-width="3"/>
    <g fill="#fff" opacity=".55"><circle cx="44" cy="52" r="5"/><circle cx="56" cy="46" r="4"/><circle cx="52" cy="62" r="4.5"/><circle cx="66" cy="56" r="4"/><circle cx="40" cy="66" r="3.5"/></g>
    <path d="M96 66 Q112 72 116 86 M98 70 Q108 84 104 96" stroke="#FFD54A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M84 36 L80 22 L88 32 L92 18 L94 34" fill="#FFD54A" stroke="#E0A800" stroke-width="2" stroke-linejoin="round"/>
    ${face(88, 56, 0.72)}
  </svg>`;
}
