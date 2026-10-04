// 어항 업그레이드 배경 (어항 뒤쪽에 깔려요). viewBox 1000×600, 아래를 기준으로 화면에 꽉 차게
const svg = (body) => `<svg class="backdrop-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${body}</svg>`;

// 1단계 큰 수족관: 뒤쪽 바위 능선과 바위 아치
const ROCKS = `
  <g fill="#0A3F5A" opacity=".8">
    <path d="M0 600 V420 Q50 360 110 390 Q160 320 230 370 Q290 400 330 600Z"/>
    <path d="M650 600 Q660 430 720 400 Q790 330 850 380 Q930 350 1000 400 V600Z"/>
    <path d="M380 600 V500 Q395 400 470 385 Q545 375 575 440 Q595 490 605 600 H560 Q550 500 490 495 Q430 495 420 600Z"/>
  </g>
  <g fill="#134F6C" opacity=".85">
    <path d="M0 600 V480 Q70 450 140 470 Q200 440 260 600Z"/>
    <path d="M760 600 Q800 470 870 460 Q940 450 1000 480 V600Z"/>
  </g>
  <g fill="#2E7D5B" opacity=".7"><path d="M120 470 q-8 -40 6 -70 M135 470 q10 -35 0 -60" stroke="#2E7D5B" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M880 460 q-10 -45 8 -75 M896 462 q12 -38 2 -64" stroke="#2E7D5B" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;

// 2단계 산호초: 알록달록 산호 벽
const CORALS = `
  <g opacity=".8" transform="translate(0 -55)">
    <path d="M60 600 V520 M60 540 q-20 -20 -18 -45 M60 530 q22 -18 20 -50" stroke="#F472A6" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M200 600 q-40 -80 0 -150 q40 70 0 150Z" fill="#FB923C"/>
    <circle cx="300" cy="560" r="34" fill="#A78BFA"/><circle cx="330" cy="545" r="22" fill="#C4B5FD"/>
    <path d="M700 600 V500 M700 520 q-24 -24 -20 -55 M700 510 q26 -20 24 -58 M700 540 q30 -10 40 -40" stroke="#34D399" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M820 600 q-50 -60 -30 -130 q30 30 40 70 q20 -50 50 -60 q10 70 -20 120Z" fill="#F43F5E"/>
    <circle cx="940" cy="565" r="28" fill="#FBBF24"/><circle cx="960" cy="545" r="16" fill="#FDE68A"/>
    <path d="M470 600 q-10 -70 30 -110 q30 40 10 110Z" fill="#60A5FA"/>
  </g>`;

// 3단계 바다 왕궁: 양옆 용궁 기둥, 가운데 아치, 위쪽 보석 조명
const PALACE = `
  <g opacity=".85">
    ${[40, 960].map((x) => `
      <rect x="${x - 26}" y="170" width="52" height="430" fill="#F5EFE0" stroke="#D4AF37" stroke-width="5"/>
      <rect x="${x - 38}" y="150" width="76" height="26" rx="6" fill="#E8D9A8" stroke="#D4AF37" stroke-width="5"/>
      <path d="M${x - 12} 190 V590 M${x + 12} 190 V590" stroke="#E2D6B8" stroke-width="5"/>`).join('')}
    <path d="M360 600 V470 Q500 340 640 470 V600 H600 V480 Q500 390 400 480 V600Z" fill="#F5EFE0" stroke="#D4AF37" stroke-width="5" opacity=".7"/>
    <circle cx="500" cy="400" r="18" fill="#FFD54A" stroke="#fff" stroke-width="4"/>
  </g>
  <path d="M0 105 Q125 155 250 105 T500 105 T750 105 T1000 105" stroke="#D4AF37" stroke-width="4" fill="none"/>
  <g class="jewels">${[60, 185, 310, 435, 560, 685, 810, 935].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 123 : 131}" r="12" fill="${['#FF6B8B', '#6BCBFF', '#FFD54A', '#9B8CFF'][i % 4]}" stroke="#fff" stroke-width="3" class="twinkle" style="animation-delay:-${(i * 0.3).toFixed(1)}s"/>`).join('')}</g>`;

import { hasBackdrop, backdropUrl } from './characters.js';

export function tankBackdrop(level) {
  if (level <= 0) return '';
  if (hasBackdrop(level)) return `<div class="backdrop-img" style="background-image:url('${backdropUrl(level)}')"></div>`;
  return svg(`${ROCKS}${level >= 2 ? CORALS : ''}${level >= 3 ? PALACE : ''}`);
}
