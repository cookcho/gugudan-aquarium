// 상점 장식 추가분 (w = 가로 px)

const svg = (w, vw, vh, body, cls = '') =>
  `<svg width="${Math.round(w)}" height="${Math.round((w * vh) / vw)}" viewBox="0 0 ${vw} ${vh}" fill="none" xmlns="http://www.w3.org/2000/svg"${cls ? ` class="${cls}"` : ''}>${body}</svg>`;

export function createBushSVG(w) {
  let b = '';
  for (let i = 0; i < 7; i++) {
    const x = 10 + i * 13;
    const h = 40 + (i % 3) * 14;
    b += `<path d="M${x} 80 Q${x - 8} ${80 - h / 2} ${x + 2} ${80 - h}" stroke="${i % 2 ? '#2E9E5B' : '#4CC37A'}" stroke-width="8" stroke-linecap="round" fill="none"/>`;
  }
  return svg(w, 100, 84, b, 'swaying-seaweed');
}

export function createKelpSVG(w) {
  return svg(w, 50, 180, `
    <path d="M25 180 C10 140 40 120 22 80 C8 50 34 30 26 4" stroke="#6B8E23" stroke-width="10" stroke-linecap="round"/>
    <g fill="#8DB33F"><ellipse cx="14" cy="130" rx="12" ry="6" transform="rotate(-30 14 130)"/><ellipse cx="36" cy="100" rx="12" ry="6" transform="rotate(30 36 100)"/><ellipse cx="14" cy="60" rx="11" ry="5" transform="rotate(-30 14 60)"/><ellipse cx="34" cy="30" rx="10" ry="5" transform="rotate(30 34 30)"/></g>`, 'swaying-seaweed');
}

export function createAnemoneSVG(w) {
  let t = '';
  for (let i = 0; i < 9; i++) {
    const x = 12 + i * 9.5;
    const bend = i % 2 ? 6 : -6;
    t += `<path d="M${x} 56 q${bend} -22 ${-bend / 3} -40" stroke="#FF8FB1" stroke-width="7" stroke-linecap="round"/><circle cx="${x - bend / 3}" cy="15" r="4.5" fill="#FFC2D4"/>`;
  }
  return svg(w, 100, 80, `<g class="swaying-seaweed">${t}</g><ellipse cx="50" cy="64" rx="40" ry="15" fill="#E8508A"/><ellipse cx="50" cy="60" rx="30" ry="6" fill="#F27AA6"/>`);
}

export function createFanCoralSVG(w) {
  const tips = [[20, 20], [35, 8], [50, 4], [65, 8], [80, 20], [88, 38], [12, 38]];
  const branches = tips.map(([x, y]) => `<path d="M50 88 Q${(50 + x) / 2} ${(88 + y) / 2 + 10} ${x} ${y}" stroke="#9B5BD6" stroke-width="5" stroke-linecap="round"/>`).join('');
  return svg(w, 100, 100, `<path d="M10 40 Q50 -14 90 40 Q70 70 50 80 Q30 70 10 40Z" fill="#C9A4F0" opacity=".55"/>${branches}<rect x="44" y="82" width="12" height="16" rx="4" fill="#7E44B8"/>`, 'soft-float');
}

export function createBrainCoralSVG(w) {
  return svg(w, 100, 72, `
    <ellipse cx="50" cy="68" rx="40" ry="3" fill="rgba(0,0,0,.12)"/>
    <ellipse cx="50" cy="42" rx="46" ry="28" fill="#F4A261"/>
    <path d="M14 40 q8 -12 16 0 t16 0 t16 0 t16 0 t10 0 M20 54 q8 -10 16 0 t16 0 t16 0 t12 0 M24 28 q8 -10 16 0 t16 0 t16 0" stroke="#D9793A" stroke-width="3" fill="none" stroke-linecap="round"/>`);
}

export function createRockSVG(w) {
  return svg(w, 120, 70, `
    <path d="M6 66 C4 40 22 18 48 14 C70 6 104 18 114 44 C118 56 116 66 116 66Z" fill="#8C9BA5"/>
    <path d="M20 40 C30 26 50 20 64 22" stroke="#B5C2C8" stroke-width="5" stroke-linecap="round"/>
    <path d="M60 16 C70 8 96 12 108 30 C92 26 76 24 60 16Z" fill="#6FAF5A"/>
    <circle cx="84" cy="48" r="4" fill="#6E7D86"/><circle cx="40" cy="54" r="3" fill="#6E7D86"/>`);
}

export function createShellSVG(w) {
  return svg(w, 80, 60, `
    <path d="M8 50 C4 30 20 8 44 8 C62 8 76 22 74 38 C72 50 58 56 40 56 C24 56 12 56 8 50Z" fill="#FFD6C2" stroke="#E8A48A" stroke-width="3"/>
    <path d="M44 8 C52 20 52 36 40 56 M60 14 C64 26 62 42 54 54 M28 12 C34 26 32 42 24 56" stroke="#E8A48A" stroke-width="2.5" fill="none"/>
    <path d="M8 50 L0 57 L14 56Z" fill="#FFB49A"/>`);
}

export function createStarDecoSVG(w) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 9 : 22;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(25 + r * Math.cos(a)).toFixed(1)},${(26 + r * Math.sin(a)).toFixed(1)}`);
  }
  return svg(w, 50, 50, `<polygon points="${pts.join(' ')}" fill="#FF9F43" stroke="#E17A1B" stroke-width="3" stroke-linejoin="round"/><g fill="#FFD9A8"><circle cx="25" cy="15" r="2"/><circle cx="17" cy="27" r="2"/><circle cx="33" cy="27" r="2"/></g>`);
}

export function createClamSVG(w) {
  return svg(w, 90, 72, `
    <path d="M8 50 Q45 70 82 50 L78 58 Q45 76 12 58Z" fill="#B48CD8"/>
    <path d="M8 50 Q10 10 45 8 Q80 10 82 50 Q45 30 8 50Z" fill="#D7BDF0" stroke="#9E74C8" stroke-width="3"/>
    <path d="M45 10 V40 M30 14 L38 42 M60 14 L52 42 M18 26 L32 44 M72 26 L58 44" stroke="#9E74C8" stroke-width="2"/>
    <circle cx="45" cy="54" r="14" fill="#FFF8DC" opacity=".35" class="twinkle"/>
    <circle cx="45" cy="54" r="9" fill="#FFFDF5" stroke="#E9E0FF" stroke-width="2"/><circle cx="42" cy="51" r="3" fill="#fff"/>`);
}

export function createAnchorSVG(w) {
  return svg(w, 80, 100, `
    <g stroke="#6E7D86" stroke-width="8" stroke-linecap="round" fill="none"><circle cx="40" cy="14" r="8"/><line x1="40" y1="22" x2="40" y2="86"/><line x1="24" y1="36" x2="56" y2="36"/><path d="M10 64 Q14 90 40 90 Q66 90 70 64"/></g>
    <path d="M4 66 L10 56 L16 66Z M64 66 L70 56 L76 66Z" fill="#6E7D86"/>`);
}

export function createHelmetSVG(w) {
  return svg(w, 90, 90, `
    <circle cx="45" cy="42" r="34" fill="#D4A017" stroke="#9C7410" stroke-width="3"/>
    <circle cx="45" cy="42" r="16" fill="#7FD3E6" stroke="#9C7410" stroke-width="5"/>
    <circle cx="16" cy="44" r="7" fill="#7FD3E6" stroke="#9C7410" stroke-width="3"/><circle cx="74" cy="44" r="7" fill="#7FD3E6" stroke="#9C7410" stroke-width="3"/>
    <rect x="18" y="72" width="54" height="16" rx="4" fill="#B8860B"/><circle cx="40" cy="36" r="4" fill="#fff" opacity=".8"/>`);
}

export function createSignSVG(w) {
  return svg(w, 100, 90, `
    <rect x="46" y="40" width="8" height="48" fill="#8A5528"/>
    <rect x="6" y="8" width="88" height="40" rx="8" fill="#C98A4B" stroke="#8A5528" stroke-width="3"/>
    <text x="50" y="35" text-anchor="middle" font-family="Jua, sans-serif" font-size="20" fill="#fff">우리 어항</text>`);
}

export function createMushroomHouseSVG(w) {
  return svg(w, 110, 110, `
    <rect x="30" y="52" width="50" height="54" rx="10" fill="#FFF3D6" stroke="#E3C78A" stroke-width="3"/>
    <path d="M6 58 Q10 8 55 8 Q100 8 104 58 Z" fill="#E74C3C"/>
    <g fill="#fff"><circle cx="34" cy="30" r="7"/><circle cx="62" cy="22" r="6"/><circle cx="82" cy="40" r="6"/><circle cx="50" cy="46" r="4"/></g>
    <path d="M46 106 V84 a9 9 0 0 1 18 0 V106Z" fill="#9C6B3A"/><circle cx="68" cy="70" r="6" fill="#7FD3E6" stroke="#9C6B3A" stroke-width="2"/>`);
}

export function createShipSVG(w) {
  const holes = [50, 80, 110].map((x) => `<circle cx="${x}" cy="84" r="6" fill="#2B4B5C" stroke="#C9A36A" stroke-width="2"/>`).join('');
  return svg(w, 160, 112, `
    <g transform="rotate(-8 80 80)">
      <path d="M10 70 H150 L132 104 H30 Z" fill="#8B5A2B" stroke="#5E3A1A" stroke-width="3"/>
      <path d="M14 80 H146 M20 92 H140" stroke="#6B4423" stroke-width="2"/>
      ${holes}
      <line x1="80" y1="70" x2="86" y2="10" stroke="#5E3A1A" stroke-width="5"/>
      <path d="M86 14 L118 26 L84 44 Z" fill="#E9E1D0" opacity=".9"/>
    </g>
    <path d="M24 108 q-6 -20 4 -34 M140 104 q6 -16 -2 -28" stroke="#3BB273" stroke-width="4" fill="none" stroke-linecap="round"/>`);
}

export function createLighthouseSVG(w) {
  return svg(w, 70, 152, `
    <circle cx="35" cy="31" r="22" fill="#FFE08A" opacity=".35" class="twinkle"/>
    <path d="M20 146 L28 40 H42 L50 146Z" fill="#fff" stroke="#C9D6DC" stroke-width="2"/>
    <path d="M22 120 L48 120 L49 134 L21 134Z M25 84 L45 84 L46 98 L24 98Z M27 52 L43 52 L44 64 L26 64Z" fill="#E74C3C"/>
    <rect x="24" y="22" width="22" height="18" fill="#FFE08A"/>
    <path d="M20 22 L35 6 L50 22Z" fill="#C0392B"/><rect x="18" y="38" width="34" height="5" fill="#34495E"/>
    <rect x="10" y="144" width="50" height="7" rx="3" fill="#8C9BA5"/>`);
}

export function createCastleSVG(w) {
  return svg(w, 140, 130, `
    <rect x="30" y="50" width="80" height="78" fill="#FFB4A2"/>
    <rect x="10" y="30" width="30" height="98" fill="#FF8C7A"/><rect x="100" y="30" width="30" height="98" fill="#FF8C7A"/>
    <path d="M6 32 L25 6 L44 32Z M96 32 L115 6 L134 32Z" fill="#7C5CD6"/><path d="M56 52 L70 22 L84 52Z" fill="#7C5CD6"/>
    <path d="M54 128 V100 a16 16 0 0 1 32 0 V128Z" fill="#6B3E26"/>
    <rect x="18" y="56" width="14" height="18" rx="7" fill="#7FD3E6"/><rect x="108" y="56" width="14" height="18" rx="7" fill="#7FD3E6"/><circle cx="70" cy="74" r="8" fill="#7FD3E6"/>
    <path d="M25 6 V0 L35 3 L25 6 M115 6 V0 L125 3 L115 6" fill="#FFC53D" stroke="#FFC53D" stroke-width="1.5"/>`);
}

export function createBubblerSVG(w) {
  const bubbles = [0, 1, 2, 3, 4].map((i) => `<circle cx="${24 + (i % 2) * 12}" cy="118" r="${4 + (i % 3) * 2}" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-width="1.5" style="animation-delay:${i * 0.5}s"/>`).join('');
  return svg(w, 60, 160, `<g class="bubbler">${bubbles}</g><rect x="14" y="128" width="32" height="26" rx="6" fill="#4AA3C8" stroke="#2C6E8A" stroke-width="3"/><rect x="24" y="120" width="12" height="10" rx="3" fill="#2C6E8A"/>`);
}

export function createJellyLampSVG(w) {
  return svg(w, 70, 112, `
    <circle cx="35" cy="34" r="32" fill="#FFB7F5" opacity=".3" class="twinkle"/>
    <path d="M12 40 Q12 12 35 12 Q58 12 58 40Z" fill="#F7A8E8"/>
    <g stroke="#F7A8E8" stroke-width="3" stroke-linecap="round"><path d="M18 40 q-4 12 2 24"/><path d="M28 40 q4 14 -2 30"/><path d="M42 40 q-4 14 2 30"/><path d="M52 40 q4 12 -2 24"/></g>
    <path d="M35 70 V104" stroke="#8C9BA5" stroke-width="3"/><ellipse cx="35" cy="106" rx="14" ry="4" fill="#8C9BA5"/>`);
}

export function createCrystalSVG(w) {
  return svg(w, 90, 90, `
    <ellipse cx="45" cy="86" rx="40" ry="4" fill="rgba(0,0,0,.15)"/>
    <g class="twinkle"><path d="M45 4 L58 40 L45 86 L32 40Z" fill="#B28CFF"/><path d="M45 4 L58 40 L45 86Z" fill="#9B6BFF"/></g>
    <path d="M20 30 L30 54 L22 86 L12 54Z" fill="#8FE3FF"/><path d="M70 36 L80 58 L72 86 L62 58Z" fill="#FF9BD2"/>`);
}
