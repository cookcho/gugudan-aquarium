// 친구들의 섬 해변 장식 그림 (w = 가로 px). 그림체는 어항 장식과 같아요: 굵은 남색 테두리 + 밝은 색
const OUT = '#0F2A3A';
const svg = (w, vw, vh, body) =>
  `<svg width="${Math.round(w)}" height="${Math.round((w * vh) / vw)}" viewBox="0 0 ${vw} ${vh}" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const S = `stroke="${OUT}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

// ---- 해변 소품 ----
export function parasol(w) {
  return svg(w, 120, 130, `
    <path d="M60 46 V124" ${S} stroke-width="6"/>
    <g ${S}>
      <path d="M4 50 Q16 18 34 44 Q48 14 60 42 Q74 14 86 44 Q104 18 116 50 Q60 36 4 50Z" fill="#FF6B8B"/>
      <path d="M34 44 Q48 14 60 42 Q74 14 86 44 Q60 36 34 44Z" fill="#FFF3E0"/>
      <circle cx="60" cy="24" r="6" fill="#FFD54A"/>
    </g>
    <path d="M44 124 H76" ${S} stroke-width="6"/>`);
}

export function beachChair(w) {
  return svg(w, 120, 100, `
    <g ${S}>
      <path d="M18 92 L52 36 H96 L70 92Z" fill="#6BCBFF"/>
      <path d="M30 76 H82 M40 60 H90" stroke="#3FA4DB" stroke-width="3"/>
      <path d="M52 36 L40 92 M96 36 L96 92" stroke-width="5"/>
      <path d="M10 92 H108" stroke-width="5"/>
    </g>`);
}

export function tube(w) {
  return svg(w, 100, 100, `
    <g ${S}>
      <circle cx="50" cy="50" r="42" fill="#FF8A5B"/>
      <path d="M50 8 A42 42 0 0 1 92 50 L64 50 A14 14 0 0 0 50 36Z" fill="#FFF3E0"/>
      <path d="M50 92 A42 42 0 0 1 8 50 L36 50 A14 14 0 0 0 50 64Z" fill="#FFF3E0"/>
      <circle cx="50" cy="50" r="16" fill="#9FE6FF"/>
    </g>`);
}

export function picnicBasket(w) {
  return svg(w, 110, 90, `
    <g ${S}>
      <path d="M22 84 L14 38 H96 L88 84Z" fill="#D9A05B"/>
      <path d="M18 56 H92 M36 38 V84 M74 38 V84" stroke="#A8743F" stroke-width="3"/>
      <path d="M32 38 Q55 2 78 38" fill="none" stroke-width="5"/>
      <rect x="8" y="30" width="94" height="12" rx="6" fill="#F2D6A8"/>
      <circle cx="46" cy="24" r="9" fill="#FF6B6B"/><circle cx="68" cy="26" r="7" fill="#7ED957"/>
    </g>`);
}

export function coconutDrink(w) {
  return svg(w, 80, 90, `
    <g ${S}>
      <path d="M16 36 Q40 86 64 36Z" fill="#8A5A2B"/>
      <ellipse cx="40" cy="36" rx="26" ry="9" fill="#FFF6E0"/>
      <path d="M52 34 L66 6" stroke="#FF6B8B" stroke-width="6"/>
      <path d="M26 30 q6 -16 18 -14" fill="none" stroke="#3FB56B" stroke-width="5"/>
      <circle cx="26" cy="32" r="5" fill="#FF8FB1"/>
    </g>`);
}

export function beachBall(w) {
  return svg(w, 80, 80, `
    <g ${S}>
      <circle cx="40" cy="40" r="34" fill="#FFF3E0"/>
      <path d="M40 6 Q58 40 40 74 Q22 40 40 6Z" fill="#FF6B6B"/>
      <path d="M40 6 Q10 24 10 48 Q24 36 40 40Z" fill="#6BCBFF"/>
      <path d="M40 74 Q70 56 70 32 Q56 44 40 40Z" fill="#FFD54A"/>
    </g>`);
}

// ---- 바닷가 자연물 ----
export function shellPile(w) {
  return svg(w, 100, 70, `
    <g ${S}>
      <path d="M14 60 Q16 24 44 22 Q70 26 68 60Z" fill="#FFD6DE"/>
      <path d="M24 58 L40 24 M40 58 L44 22 M56 58 L50 26" stroke="#F2A5B5" stroke-width="3"/>
      <path d="M62 62 Q64 38 84 36 Q96 42 92 62Z" fill="#CFEFFF"/>
      <circle cx="30" cy="64" r="7" fill="#FFF1D0"/>
    </g>`);
}

export function driftwood(w) {
  return svg(w, 140, 70, `
    <g ${S}>
      <path d="M10 44 Q70 24 130 40 Q130 56 126 58 Q70 44 14 60 Q8 52 10 44Z" fill="#C9A77C"/>
      <path d="M26 50 Q70 36 116 48" stroke="#9A7A52" stroke-width="3"/>
      <path d="M30 58 V66 M110 50 V64" stroke-width="5"/>
      <circle cx="104" cy="36" r="6" fill="#7ED957"/>
    </g>`);
}

export function bigStarfish(w) {
  return svg(w, 90, 86, `
    <g ${S}>
      <path d="M45 6 L58 34 L88 36 L64 55 L73 82 L45 66 L17 82 L26 55 L2 36 L32 34Z" fill="#FFB347"/>
      <g fill="#F2A516"><circle cx="45" cy="40" r="4"/><circle cx="34" cy="52" r="3.5"/><circle cx="56" cy="52" r="3.5"/></g>
    </g>`);
}

export function reeds(w) {
  return svg(w, 90, 110, `
    <g ${S} fill="none" stroke-width="5">
      <path d="M20 106 Q10 66 24 34" stroke="#5EA85E"/>
      <path d="M44 106 Q44 60 44 26" stroke="#78C878"/>
      <path d="M68 106 Q80 68 66 38" stroke="#5EA85E"/>
    </g>
    <g ${S}>
      <ellipse cx="24" cy="26" rx="7" ry="14" fill="#A8743F"/>
      <ellipse cx="44" cy="18" rx="7" ry="15" fill="#C08B52"/>
      <ellipse cx="66" cy="30" rx="7" ry="13" fill="#A8743F"/>
    </g>`);
}

export function palmTree(w) {
  return svg(w, 150, 190, `
    <path d="M78 184 C70 130 66 80 82 40" ${S} stroke-width="14" stroke="#A8743F" fill="none"/>
    <path d="M78 184 C70 130 66 80 82 40" stroke="#C99456" stroke-width="13" fill="none" stroke-dasharray="5 12"/>
    <g fill="#3FB56B" ${S}>
      <path d="M82 40 C58 14 24 18 4 40 C30 30 56 34 82 44Z"/>
      <path d="M82 40 C70 6 44 -6 20 -2 C46 8 66 22 82 44Z"/>
      <path d="M82 40 C94 6 120 -4 144 2 C118 12 100 26 84 44Z"/>
      <path d="M82 40 C110 22 140 26 148 48 C122 36 98 36 84 44Z"/>
    </g>
    <g fill="#8A5A2B" ${S} stroke-width="3"><circle cx="76" cy="50" r="8"/><circle cx="90" cy="52" r="8"/><circle cx="83" cy="62" r="8"/></g>`);
}

// ---- 얕은 물 ----
export function sailboat(w) {
  return svg(w, 130, 130, `
    <g ${S}>
      <path d="M62 16 V96" stroke-width="5"/>
      <path d="M68 24 Q108 56 68 88Z" fill="#FFF3E0"/>
      <path d="M56 34 Q28 60 56 90Z" fill="#9FE6FF"/>
      <path d="M12 96 H118 L104 120 Q64 130 26 120Z" fill="#E86B4A"/>
      <path d="M22 108 H108" stroke="#B8472C" stroke-width="3"/>
      <path d="M62 16 L84 8 L84 20Z" fill="#FFD54A"/>
    </g>`);
}

export function canoe(w) {
  return svg(w, 140, 70, `
    <g ${S}>
      <path d="M6 28 Q70 16 134 28 Q116 60 70 62 Q24 60 6 28Z" fill="#C97B4A"/>
      <path d="M20 32 Q70 24 120 32" stroke="#A05A2E" stroke-width="3"/>
      <path d="M44 20 L96 2" stroke-width="5"/>
      <path d="M96 2 l10 -6 l4 8 l-10 6Z" fill="#D9A05B"/>
    </g>`);
}

export function buoy(w) {
  return svg(w, 80, 100, `
    <g ${S}>
      <path d="M26 92 Q22 48 40 18 Q58 48 54 92Z" fill="#FF6B6B"/>
      <path d="M24 66 H56 M26 48 H54" stroke="#C94A4A" stroke-width="3"/>
      <ellipse cx="40" cy="92" rx="30" ry="8" fill="#FFF3E0"/>
      <circle cx="40" cy="14" r="7" fill="#FFD54A"/>
    </g>`);
}

export function coralRock(w) {
  return svg(w, 120, 90, `
    <g ${S}>
      <path d="M10 84 Q4 46 34 36 Q52 10 80 34 Q114 42 110 84Z" fill="#8FA2B8"/>
      <path d="M28 80 Q24 54 46 46" stroke="#B4C4D6" stroke-width="4" fill="none"/>
      <path d="M78 84 V62 M78 70 q-12 -10 -10 -24 M78 66 q14 -8 12 -26" stroke="#FF8FB1" stroke-width="7" fill="none"/>
      <circle cx="34" cy="76" r="6" fill="#FFD54A"/>
    </g>`);
}

// ---- 밤에 빛나는 것 ----
export function campfire(w) {
  return svg(w, 110, 100, `
    <g class="fire-flame" ${S}>
      <path d="M55 10 Q78 40 70 62 Q64 76 55 76 Q46 76 40 62 Q32 40 55 10Z" fill="#FF8A2B"/>
      <path d="M55 32 Q68 50 62 64 Q58 72 55 72 Q52 72 48 64 Q42 50 55 32Z" fill="#FFD54A"/>
    </g>
    <g ${S}>
      <path d="M14 86 L96 70" stroke="#A8743F" stroke-width="10"/>
      <path d="M16 70 L94 88" stroke="#C9A77C" stroke-width="10"/>
      <ellipse cx="55" cy="90" rx="48" ry="8" fill="#9AA5B8"/>
    </g>`);
}

export function shellLanterns(w) {
  const bulb = (x, y, c) => `
    <g class="lantern-bulb">
      <path d="M${x} ${y} V${y + 10}" stroke="${OUT}" stroke-width="3"/>
      <path d="M${x - 11} ${y + 26} Q${x - 11} ${y + 10} ${x} ${y + 10} Q${x + 11} ${y + 10} ${x + 11} ${y + 26} Q${x} ${y + 32} ${x - 11} ${y + 26}Z" fill="${c}" stroke="${OUT}" stroke-width="3.5"/>
      <path d="M${x - 6} ${y + 26} L${x - 3} ${y + 12} M${x} ${y + 27} L${x} ${y + 11} M${x + 6} ${y + 26} L${x + 3} ${y + 12}" stroke="rgba(255,255,255,.7)" stroke-width="2"/>
    </g>`;
  return svg(w, 240, 80, `
    <path d="M4 10 Q120 54 236 10" fill="none" stroke="${OUT}" stroke-width="4"/>
    ${bulb(40, 29, '#FFD6DE')}${bulb(84, 40, '#CFEFFF')}${bulb(128, 44, '#FFF1B8')}${bulb(172, 40, '#D9C4FF')}${bulb(212, 27, '#C8F3D8')}`);
}

export function lighthouse(w) {
  return svg(w, 110, 180, `
    <g ${S}>
      <path d="M28 168 L36 60 H74 L82 168Z" fill="#FFF3E0"/>
      <path d="M34 128 H76 M32 96 H78" stroke="none"/>
      <path d="M35 76 H75 L76 96 H34Z" fill="#E8603C"/>
      <path d="M32 128 H78 L79 148 H31Z" fill="#E8603C"/>
      <rect x="30" y="48" width="50" height="14" rx="4" fill="#9AA5B8"/>
      <rect x="38" y="24" width="34" height="26" rx="4" fill="#CFEFFF"/>
      <path d="M34 24 L55 6 L76 24Z" fill="#E8603C"/>
      <path d="M18 168 H92" stroke-width="5"/>
    </g>
    <g class="beacon-ray"><path d="M72 37 L150 10 L150 64Z" fill="#FFE89A" opacity=".55"/></g>`);
}
