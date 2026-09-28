// 바다 지도 그림: 섬별 소품, 상어, 물고기 떼, 구름, 갈매기, 돌고래, 물속 풍경
// 좌표는 지도 viewBox(760×800) 기준이고, 섬 소품은 섬 가운데(0,0) 기준이에요.

const palm = (x, flip = 1) => `
  <path d="M${x} 4 Q${x - 8 * flip} -34 ${x + 4 * flip} -66" stroke="#9C6B3A" stroke-width="7" fill="none" stroke-linecap="round"/>
  <g class="palm">
    <g fill="#2E9E5B">
      <ellipse cx="${x - 14 * flip}" cy="-68" rx="20" ry="7" transform="rotate(${-20 * flip} ${x - 14 * flip} -68)"/>
      <ellipse cx="${x + 22 * flip}" cy="-70" rx="20" ry="7" transform="rotate(${20 * flip} ${x + 22 * flip} -70)"/>
      <ellipse cx="${x + 2 * flip}" cy="-80" rx="7" ry="18"/>
      <ellipse cx="${x - 10 * flip}" cy="-58" rx="16" ry="6" transform="rotate(${40 * flip} ${x - 10 * flip} -58)"/>
    </g>
    <circle cx="${x + 5 * flip}" cy="-64" r="4" fill="#8A5A2B"/>
  </g>`;

const miniStar = (x, y, r, fill) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="#C97A12" stroke-width="1.5" stroke-linejoin="round"/>`;
};

// 섬마다 그 섬 친구에 맞는 소품
export const ISLAND_PROPS = {
  2: `<g class="sway"><path d="M-62 8 q-6 -18 2 -34 q6 -14 -2 -28" stroke="#2E9E5B" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M-50 10 q6 -14 -2 -26" stroke="#4CC37A" stroke-width="5" fill="none" stroke-linecap="round"/></g>
      <path d="M48 14 q7 -12 14 0z" fill="#FFB4A2"/><circle cx="68" cy="16" r="3" fill="#fff"/><circle cx="74" cy="12" r="2" fill="#FFD6C2"/>`,
  5: `<line x1="-56" y1="12" x2="-50" y2="-38" stroke="#8A5528" stroke-width="3"/>
      <path d="M-80 -30 Q-50 -62 -20 -38 Z" fill="#FF7A59"/><path d="M-62 -40 Q-50 -56 -36 -36 Z" fill="#FFD166"/>
      ${miniStar(56, 12, 10, '#F2A516')}${miniStar(74, 16, 6, '#FF9F43')}`,
  3: `<ellipse cx="-50" cy="8" rx="20" ry="9" fill="#7FD3E6" stroke="#5FAE55" stroke-width="3"/>
      <circle cx="-56" cy="7" r="4.5" fill="#3BB273"/><path d="M-46 6 l3 -7 l3 7z" fill="#FF8FB1"/>
      ${palm(56, -1)}`,
  4: `${palm(-52)}
      <ellipse cx="54" cy="12" rx="17" ry="6" fill="#E3C78A"/>
      <g fill="#fff" stroke="#D8C08A" stroke-width="1.5"><ellipse cx="48" cy="7" rx="4.5" ry="5.5"/><ellipse cx="58" cy="6" rx="4.5" ry="5.5"/><ellipse cx="53" cy="10" rx="4.5" ry="5.5"/></g>`,
  6: `<g class="twinkle"><path d="M-60 10 L-53 -20 L-46 10Z" fill="#B28CFF"/><path d="M-48 10 L-43 -8 L-38 10Z" fill="#8FE3FF"/><path d="M-68 10 L-64 -4 L-60 10Z" fill="#FF9BD2"/></g>
      <g stroke="#fff" stroke-width="2" stroke-linecap="round" class="twinkle"><path d="M58 -2 v16 M50 6 h16 M52 0 l12 12 M64 0 l-12 12"/></g>`,
  7: `<g fill="none" stroke-width="4" opacity=".9">
        <path d="M-84 10 A28 30 0 0 1 -28 10" stroke="#FF5A5A"/><path d="M-80 10 A24 26 0 0 1 -32 10" stroke="#FFD23C"/>
        <path d="M-76 10 A20 22 0 0 1 -36 10" stroke="#5ACB6A"/><path d="M-72 10 A16 18 0 0 1 -40 10" stroke="#3CA8FF"/></g>
      ${palm(58, -1)}`,
  8: `<path d="M40 16 Q42 -22 60 -26 Q80 -22 82 16 Z" fill="#8C9BA5" stroke="#6E7D86" stroke-width="2"/>
      <path d="M52 16 Q54 -4 62 -4 Q70 -4 71 16Z" fill="#2B3A42"/>
      ${palm(-54)}`,
  9: `<path d="M50 14 L54 -34 H62 L66 14Z" fill="#fff" stroke="#C9D6DC" stroke-width="2"/>
      <path d="M52 -8 H64 M51 4 H65" stroke="#E74C3C" stroke-width="5"/>
      <circle cx="58" cy="-38" r="11" fill="#FFE08A" opacity=".45" class="twinkle"/>
      <rect x="53" y="-42" width="10" height="8" fill="#FFE08A"/><path d="M51 -42 L58 -50 L65 -42Z" fill="#C0392B"/>
      ${palm(-54)}`
};

// 물속 풍경 (깊은 곳, 산호초, 바위 그림자) — 섬보다 아래에 깔려요
export const UNDERWATER = `
  <g opacity=".1" fill="#07415F">
    <ellipse cx="500" cy="560" rx="120" ry="40"/><ellipse cx="250" cy="310" rx="140" ry="45"/><ellipse cx="700" cy="300" rx="80" ry="120"/>
  </g>
  <g opacity=".35">
    <path d="M250 560 q10 -24 20 0 q10 -18 18 0 q8 -14 16 0" fill="#FF8FB1"/>
    <path d="M470 300 q8 -22 16 0 q8 -16 16 0" fill="#C9A4F0"/>
    <path d="M690 590 q6 -26 12 0 M700 590 q6 -20 12 0" stroke="#2E9E5B" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="60" cy="560" rx="22" ry="10" fill="#6E7D86"/><ellipse cx="80" cy="566" rx="12" ry="6" fill="#8C9BA5"/>
  </g>
  <g class="glints">
    ${[[300, 250], [560, 330], [80, 330], [700, 520], [460, 760], [250, 520], [620, 260], [40, 760]].map(([x, y], i) =>
      `<path d="M${x} ${y - 6} Q${x} ${y} ${x + 6} ${y} Q${x} ${y} ${x} ${y + 6} Q${x} ${y} ${x - 6} ${y} Q${x} ${y} ${x} ${y - 6}Z" fill="#fff" class="twinkle" style="animation-delay:-${(i * 0.4).toFixed(1)}s"/>`).join('')}
  </g>`;

// 웃는 상어 몸 전체 (지도에서 뛰어오를 때, 보스전에서 써요)
export const SHARK_BODY = `
    <path d="M-48 0 L-70 -20 L-63 0 L-70 18Z" fill="#8FA3B1" stroke="#4E5D68" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-4 -22 L8 -48 L20 -20Z" fill="#8FA3B1" stroke="#4E5D68" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-52 0 C-32 -28 32 -32 56 -4 C44 16 -20 22 -52 0Z" fill="#8FA3B1" stroke="#4E5D68" stroke-width="3"/>
    <path d="M-30 6 C0 20 32 14 50 2 C32 16 -10 20 -30 6Z" fill="#fff"/>
    <path d="M6 4 L-2 20 L14 8Z" fill="#8FA3B1" stroke="#4E5D68" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="32" cy="-9" r="4.5" fill="#10222e"/><circle cx="33.6" cy="-10.6" r="1.5" fill="#fff"/>
    <ellipse cx="27" cy="2" rx="4.5" ry="2.6" fill="#FF8FA3" opacity=".75"/>
    <path d="M36 4 q8 5 15 -2" stroke="#10222e" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;

// 상어: 평소엔 지느러미와 물속 그림자, 누르면 몸 전체가 뛰어올라요 (오른쪽을 봐요)
export const SHARK = `
  <g class="shark-swim">
    <path d="M-50 6 C-30 -8 30 -8 48 6 C30 18 -30 18 -50 6Z M-48 6 L-66 -6 L-60 6 L-66 18Z" fill="#07415F" opacity=".35"/>
    <path d="M-6 4 L4 -28 Q12 -8 20 4 Z" fill="#8FA3B1" stroke="#4E5D68" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M-34 8 q10 -5 20 0 M26 8 q8 -4 16 0" stroke="#fff" stroke-width="2.5" opacity=".85" fill="none" stroke-linecap="round"/>
  </g>
  <g class="shark-jump" opacity="0">${SHARK_BODY}</g>`;

export const FISH_SCHOOL = `
  <g fill="#07415F" opacity=".3">
    ${[[0, 0], [22, -10], [20, 12], [44, 0], [40, -20]].map(([x, y]) => `<path transform="translate(${x} ${y})" d="M0 0 q9 -7 18 0 q-9 7 -18 0z M0 0 l-6 -5 v10z"/>`).join('')}
  </g>`;

export const CLOUD = `
  <g class="cloud-shadow" fill="#07415F" opacity=".12" transform="translate(30 70)">
    <ellipse cx="0" cy="0" rx="70" ry="22"/>
  </g>
  <g fill="#fff" opacity=".9">
    <circle cx="-30" cy="0" r="22"/><circle cx="0" cy="-12" r="28"/><circle cx="30" cy="-2" r="22"/><rect x="-52" y="-4" width="104" height="24" rx="12"/>
  </g>`;

export const GULLS = `
  <g stroke="#34495E" stroke-width="3" fill="none" stroke-linecap="round" class="flap">
    <path d="M0 0 q7 -7 14 0 q7 -7 14 0"/><path d="M30 14 q6 -6 12 0 q6 -6 12 0"/>
  </g>`;

export const DOLPHIN = `
  <g>
    <path d="M-30 4 C-16 -16 18 -18 32 -2 C20 8 -12 12 -30 4Z" fill="#5C8FB8" stroke="#2F5E86" stroke-width="2.5"/>
    <path d="M-4 -12 L4 -26 L10 -12Z" fill="#5C8FB8" stroke="#2F5E86" stroke-width="2"/>
    <path d="M-28 4 L-42 -6 L-38 4 L-42 14Z" fill="#5C8FB8" stroke="#2F5E86" stroke-width="2"/>
    <path d="M-12 6 C6 12 20 8 30 0 C20 10 -2 12 -12 6Z" fill="#DDEFF8"/>
    <circle cx="20" cy="-6" r="2.6" fill="#10222e"/>
  </g>`;

export const LITTLE_FISH = `<path d="M-9 0 q9 -8 18 0 q-9 8 -18 0z M-9 0 l-7 -6 v12z" fill="#FFB347" stroke="#C97A12" stroke-width="1.5"/>`;
