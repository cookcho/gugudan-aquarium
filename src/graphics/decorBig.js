// 큰 선물 장식 (w = 가로 px). 누르면 움직여요: 해적선 대포, 거품 분수, 회전목마 / 해저 기차는 저절로 지나가요
const svg = (w, vw, vh, body, cls = '') =>
  `<svg width="${Math.round(w)}" height="${Math.round((w * vh) / vw)}" viewBox="0 0 ${vw} ${vh}" fill="none" xmlns="http://www.w3.org/2000/svg"${cls ? ` class="${cls}"` : ''}>${body}</svg>`;
const OUT = '#0F2A3A';

// 해적선: 오른쪽 대포(구멍 위치 약 x 196, y 118)에서 비눗방울이 나와요
export function createPirateShipSVG(w) {
  return svg(w, 220, 170, `
    <g stroke="${OUT}" stroke-width="3" stroke-linejoin="round">
      <path d="M100 20 V128" stroke-width="6"/>
      <path d="M104 26 Q150 46 104 86Z" fill="#FFF7E6"/>
      <path d="M96 34 Q58 56 96 92Z" fill="#FFF7E6"/>
      <path d="M100 20 L128 10 L128 26 Z" fill="#2B2B2B"/>
      <path d="M20 112 H200 L184 150 Q110 166 36 150 Z" fill="#9C5B2E"/>
      <path d="M28 126 H192" stroke="#6E3D1C"/>
      <circle cx="70" cy="138" r="6" fill="#FFE08A"/><circle cx="110" cy="140" r="6" fill="#FFE08A"/><circle cx="150" cy="138" r="6" fill="#FFE08A"/>
      <rect x="176" y="110" width="26" height="14" rx="6" fill="#4A4A4A"/>
      <circle cx="202" cy="117" r="5" fill="#1F1F1F"/>
    </g>
    <circle cx="121" cy="18" r="3" fill="#fff"/>
    <path d="M60 150 q50 16 100 0" stroke="#fff" stroke-width="3" opacity=".4"/>`);
}

// 거품 분수 성: 꼭대기(약 x 60, y 18)에서 거품이 솟아요
export function createFountainCastleSVG(w) {
  return svg(w, 120, 130, `
    <g stroke="${OUT}" stroke-width="3" stroke-linejoin="round">
      <rect x="14" y="60" width="92" height="66" rx="6" fill="#BDE3F2"/>
      <rect x="8" y="44" width="24" height="82" rx="4" fill="#9ED3EA"/><rect x="88" y="44" width="24" height="82" rx="4" fill="#9ED3EA"/>
      <path d="M8 44 L20 26 L32 44Z M88 44 L100 26 L112 44Z" fill="#FF8FB1"/>
      <path d="M44 126 V96 Q60 80 76 96 V126Z" fill="#5E9FB8"/>
      <path d="M40 60 Q60 20 80 60Z" fill="#E8F7FF"/>
      <rect x="54" y="18" width="12" height="16" rx="3" fill="#FFD54A"/>
    </g>
    <g fill="#fff" opacity=".85"><circle cx="60" cy="12" r="5"/><circle cx="52" cy="6" r="3"/><circle cx="68" cy="5" r="3.5"/></g>
    <g fill="#FFE08A"><circle cx="28" cy="80" r="4"/><circle cx="92" cy="80" r="4"/></g>`);
}

// 산호 회전목마: 지붕 아래 해마 인형들이 빙글빙글 (가운데 부분이 돌아요)
export function createCarouselSVG(w) {
  const horses = [0, 1, 2].map((i) => `
    <g transform="translate(${30 + i * 30} 0)">
      <path d="M0 40 V92" stroke="#D4AF37" stroke-width="3"/>
      <g transform="translate(0 ${i % 2 ? 70 : 62})">
        <ellipse cx="0" cy="0" rx="8" ry="11" fill="${['#FF8FB1', '#6BCBFF', '#FFD54A'][i]}" stroke="${OUT}" stroke-width="2.5"/>
        <circle cx="3" cy="-12" r="6" fill="${['#FF8FB1', '#6BCBFF', '#FFD54A'][i]}" stroke="${OUT}" stroke-width="2.5"/>
        <path d="M-3 10 q-6 8 0 12" stroke="${OUT}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>
    </g>`).join('');
  return svg(w, 120, 130, `
    <g stroke="${OUT}" stroke-width="3" stroke-linejoin="round">
      <path d="M8 40 Q60 -6 112 40Z" fill="#FF6B8B"/>
      <path d="M8 40 Q20 50 34 40 Q47 50 60 40 Q73 50 86 40 Q99 50 112 40" fill="#FFD54A"/>
      <path d="M60 4 V-2" stroke-width="3"/><circle cx="60" cy="4" r="4" fill="#FFD54A"/>
      <rect x="56" y="40" width="8" height="70" fill="#E8D9A8"/>
    </g>
    <g class="carousel-spin">${horses}</g>
    <g stroke="${OUT}" stroke-width="3"><ellipse cx="60" cy="112" rx="54" ry="10" fill="#F472A6"/><ellipse cx="60" cy="108" rx="50" ry="7" fill="#FFC2D9"/></g>`);
}

// 해저 기차 (이벤트로 지나가요, 오른쪽으로 달려요)
export function createTrainSVG(w) {
  const car = (x, c) => `<g transform="translate(${x} 0)"><rect x="0" y="22" width="44" height="30" rx="6" fill="${c}" stroke="${OUT}" stroke-width="3"/><rect x="8" y="28" width="12" height="10" rx="2" fill="#E8F7FF" stroke="${OUT}" stroke-width="2"/><rect x="24" y="28" width="12" height="10" rx="2" fill="#E8F7FF" stroke="${OUT}" stroke-width="2"/><circle cx="11" cy="54" r="6" fill="#4A4A4A" stroke="${OUT}" stroke-width="2"/><circle cx="33" cy="54" r="6" fill="#4A4A4A" stroke="${OUT}" stroke-width="2"/></g>`;
  return svg(w, 200, 64, `
    ${car(0, '#6BCBFF')}${car(50, '#FFD54A')}
    <g transform="translate(100 0)" stroke="${OUT}" stroke-width="3" stroke-linejoin="round">
      <rect x="0" y="16" width="62" height="36" rx="6" fill="#FF6B6B"/>
      <rect x="8" y="4" width="22" height="18" rx="3" fill="#FF6B6B"/>
      <rect x="44" y="0" width="10" height="18" rx="2" fill="#4A4A4A"/>
      <rect x="12" y="8" width="14" height="10" rx="2" fill="#E8F7FF" stroke-width="2"/>
      <path d="M62 44 L78 54 H62Z" fill="#FFD54A"/>
      <circle cx="16" cy="54" r="7" fill="#4A4A4A" stroke-width="2"/><circle cx="44" cy="54" r="7" fill="#4A4A4A" stroke-width="2"/>
    </g>
    <path d="M52 52 H100" stroke="${OUT}" stroke-width="3"/>`);
}
