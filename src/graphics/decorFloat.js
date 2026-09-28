// 물속에 둥실 떠 있는 장식 (w = 가로 px). 어항에서는 위아래로 천천히 흔들려요.

const svg = (w, vw, vh, body) =>
  `<svg width="${Math.round(w)}" height="${Math.round((w * vh) / vw)}" viewBox="0 0 ${vw} ${vh}" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

const OUT = '#0F2A3A';

// 투명 부표에 줄로 매달린 꼬마 잠수부 (오른쪽을 보고 헤엄쳐요)
function diver(w, suit, dark) {
  return svg(w, 120, 110, `
    <path d="M60 26 V44" stroke="#fff" stroke-width="1.5" opacity=".8"/>
    <circle cx="60" cy="15" r="12" fill="#fff" fill-opacity=".45" stroke="#fff" stroke-width="2"/>
    <ellipse cx="55" cy="10" rx="4" ry="5" fill="#fff" opacity=".9"/>
    <g stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M38 60 L14 58 M38 66 L16 72" stroke="${suit}" stroke-width="10" stroke-linecap="round"/>
      <path d="M16 52 L2 48 L6 64 Z M18 66 L4 70 L12 82 Z" fill="#FFD23C"/>
      <rect x="36" y="38" width="30" height="13" rx="6.5" fill="#FFD23C"/>
      <ellipse cx="56" cy="62" rx="24" ry="13" fill="${suit}"/>
      <path d="M72 64 L92 74" stroke="${suit}" stroke-width="9" stroke-linecap="round"/>
      <circle cx="94" cy="75" r="5" fill="#FFD9B8"/>
      <circle cx="84" cy="50" r="14" fill="${suit}"/>
      <circle cx="90" cy="54" r="8" fill="#FFD9B8" stroke="none"/>
      <rect x="82" y="42" width="18" height="11" rx="4" fill="#BFEFFF" stroke="#FF7A3D" stroke-width="3"/>
      <circle cx="96" cy="62" r="3.5" fill="#9AA7B0"/>
    </g>
    <path d="M58 58 Q60 52 66 54" stroke="${dark}" stroke-width="2" opacity=".5"/>
    <ellipse cx="86" cy="45" rx="2.5" ry="1.5" fill="#fff"/>
    <circle cx="104" cy="52" r="3" fill="#fff" fill-opacity=".6" stroke="#fff"/><circle cx="109" cy="42" r="2" fill="#fff" fill-opacity=".6" stroke="#fff"/>`);
}

export const createDiverBlueSVG = (w) => diver(w, '#3B7DD8', '#1F4F99');
export const createDiverPinkSVG = (w) => diver(w, '#F28AB8', '#C0588A');

// 노란 꼬마 잠수함 (프로펠러가 돌아요)
export function createSubmarineSVG(w) {
  return svg(w, 120, 84, `
    <g stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M66 20 V8 H76" stroke-width="4" stroke-linecap="round"/>
      <rect x="48" y="18" width="26" height="18" rx="6" fill="#FFC53D"/>
      <g class="prop-spin"><ellipse cx="12" cy="52" rx="4" ry="14" fill="#9AA7B0"/></g>
      <rect x="14" y="48" width="10" height="8" rx="2" fill="#9AA7B0"/>
      <ellipse cx="62" cy="52" rx="42" ry="24" fill="#FFD23C"/>
      <path d="M30 70 Q62 84 96 66" stroke="#D69A12" stroke-width="3" fill="none"/>
      <circle cx="46" cy="50" r="8" fill="#8EE3F5"/><circle cx="66" cy="50" r="8" fill="#8EE3F5"/><circle cx="86" cy="50" r="8" fill="#8EE3F5"/>
    </g>
    <g fill="#fff" opacity=".85"><circle cx="43" cy="47" r="2.5"/><circle cx="63" cy="47" r="2.5"/><circle cx="83" cy="47" r="2.5"/></g>
    <circle cx="68" cy="53" r="2" fill="${OUT}"/><path d="M62 54 l-3 -2 v4 z" fill="#FF8C1A"/>
    <ellipse cx="40" cy="36" rx="12" ry="4" fill="#fff" opacity=".5"/>`);
}

// 꼬마 해파리 삼형제 (둥실둥실)
export function createJellyTrioSVG(w) {
  const jelly = (x, y, s, c, l) => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <g stroke="${c}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M-10 4 q-4 8 0 16"/><path d="M-3 4 q4 9 0 18"/><path d="M4 4 q-4 9 0 18"/><path d="M11 4 q4 8 0 16"/></g>
      <path d="M-16 5 Q-16 -16 0 -16 Q16 -16 16 5 Q8 9 0 5 Q-8 9 -16 5Z" fill="${l}" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>
      <ellipse cx="-7" cy="-9" rx="4" ry="2.5" fill="#fff" opacity=".8"/>
      <circle cx="-5" cy="-3" r="1.8" fill="${OUT}"/><circle cx="5" cy="-3" r="1.8" fill="${OUT}"/>
      <path d="M-2 1 q2 2 4 0" stroke="${OUT}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </g>`;
  return svg(w, 120, 100, `
    ${jelly(30, 58, 1.1, '#E0508A', '#FFB3CF')}
    ${jelly(64, 30, 1.35, '#8A7FD8', '#CFC8F7')}
    ${jelly(96, 62, 0.95, '#2FA88A', '#A8F0DA')}`);
}

// 꼬마 탐사 로봇 (앞에 불빛)
export function createRobotSVG(w) {
  return svg(w, 120, 90, `
    <path d="M92 40 L120 26 V70 L92 56 Z" fill="#FFF3B0" opacity=".45"/>
    <g stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M56 22 V10" stroke-linecap="round"/><circle cx="56" cy="8" r="4" fill="#FF6B6B"/>
      <rect x="10" y="30" width="14" height="30" rx="6" fill="#9AA7B0"/>
      <rect x="22" y="22" width="68" height="48" rx="16" fill="#FF8C1A"/>
      <rect x="30" y="58" width="52" height="8" rx="4" fill="#fff"/>
      <circle cx="62" cy="44" r="15" fill="#fff"/>
      <circle cx="62" cy="44" r="9" fill="#2B3A55"/>
      <rect x="86" y="38" width="10" height="20" rx="4" fill="#FFE08A"/>
      <path d="M30 78 L40 70 M82 70 L92 78" stroke-width="4" stroke-linecap="round"/>
    </g>
    <circle cx="65" cy="41" r="3" fill="#fff"/>
    <ellipse cx="38" cy="30" rx="8" ry="3" fill="#fff" opacity=".45"/>
    <circle cx="96" cy="48" r="7" fill="#FFE08A" opacity=".5" class="twinkle"/>`);
}
