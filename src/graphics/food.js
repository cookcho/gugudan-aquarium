// 어항 돌보기 그림: 사료 알갱이, 먹이통, 똥, 약

// 물에 떨어지는 사료 알갱이 (작은 알갱이 3개)
export function createFoodSVG(size = 32) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="13" r="6" fill="#C8773A"/><circle cx="9.5" cy="11.5" r="1.8" fill="#F2B27A"/>
      <circle cx="21" cy="11" r="5" fill="#E0913F"/><circle cx="19.8" cy="9.8" r="1.5" fill="#FFD29A"/>
      <circle cx="17" cy="22" r="5.5" fill="#A95F2C"/><circle cx="15.6" cy="20.6" r="1.6" fill="#E0A06A"/>
    </svg>`;
}

// 버튼·상점용 먹이통
export function createFoodCanSVG(size = 32) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9" y="4" width="22" height="6" rx="2" fill="#E74C3C"/>
      <rect x="7" y="9" width="26" height="28" rx="5" fill="#FFD166" stroke="#D69A12" stroke-width="2"/>
      <path d="M13 23 q5 -6 10 0 q-5 6 -10 0z" fill="#0B6E99"/><path d="M23 23 l5 -4 v8z" fill="#0B6E99"/>
      <circle cx="15.5" cy="22" r="1" fill="#fff"/>
      <g fill="#C8773A"><circle cx="12" cy="33" r="1.6"/><circle cx="20" cy="33.5" r="1.6"/><circle cx="27" cy="32.5" r="1.6"/></g>
    </svg>`;
}

// 모래 위에 떨어진 물고기 똥: 동글동글 구슬이 꼬물꼬물 이어진 짧은 줄
export function createPoopSVG(size = 24) {
  const beads = [[6, 18, 3.6], [11.5, 15.5, 4], [17.5, 16.5, 3.8], [23, 19, 3.2]];
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 30 26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="15" cy="23.5" rx="12" ry="2.2" fill="rgba(60,50,20,.18)"/>
      ${beads.map(([x, y, r]) => `
        <circle cx="${x}" cy="${y}" r="${r}" fill="#8A7A3A" stroke="#6B5E2A" stroke-width="1"/>
        <circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#B9AA66" opacity=".9"/>`).join('')}
    </svg>`;
}

// 물고기 약
export function createMedicineSVG(size = 32) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="13" y="4" width="14" height="6" rx="2" fill="#fff" stroke="#9FB4BE" stroke-width="2"/>
      <path d="M11 12 H29 V34 a4 4 0 0 1 -4 4 H15 a4 4 0 0 1 -4 -4Z" fill="#7FD3E6" stroke="#2F8FB3" stroke-width="2"/>
      <rect x="11" y="18" width="18" height="11" fill="#fff"/>
      <path d="M20 20 v7 M16.5 23.5 h7" stroke="#E74C3C" stroke-width="2.6" stroke-linecap="round"/>
    </svg>`;
}
