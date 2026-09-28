// 어항을 생동감 넘치게 만드는 고품질 바다 장식 SVG 에셋들

/**
 * 살랑살랑 흔들리는 초록 해초
 */
export function createSeaweedSVG(height = 140) {
  const width = Math.round(height * 0.45);
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 60 140" fill="none" xmlns="http://www.w3.org/2000/svg" class="swaying-seaweed">
      <defs>
        <linearGradient id="seaweedGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#15803D"/>
          <stop offset="60%" stop-color="#22C55E"/>
          <stop offset="100%" stop-color="#86EFAC"/>
        </linearGradient>
      </defs>
      <!-- 줄기 1 -->
      <path d="M20 140 C10 110 35 85 18 55 C6 30 25 10 22 0 C15 15 2 35 10 60 C20 85 5 110 12 140 Z" fill="url(#seaweedGrad)" opacity="0.95"/>
      <!-- 줄기 2 -->
      <path d="M35 140 C45 115 25 90 42 60 C55 35 38 12 40 2 C32 18 45 40 32 65 C20 90 35 115 28 140 Z" fill="url(#seaweedGrad)" opacity="0.85"/>
    </svg>
  `;
}

/**
 * 화사한 핑크/오렌지 산호초
 */
export function createCoralSVG(color = '#F43F5E', width = 110) {
  const height = Math.round(width * 0.85);
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 110 95" fill="none" xmlns="http://www.w3.org/2000/svg" class="soft-float">
      <defs>
        <linearGradient id="coralGrad_${color.replace('#','')}" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="${color}"/>
          <stop offset="100%" stop-color="#FED7AA"/>
        </linearGradient>
        <filter id="coralShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.15)"/>
        </filter>
      </defs>
      <g filter="url(#coralShadow)">
        <path d="M55 95 
                 C52 75 42 65 30 70 C15 75 8 58 22 50 C32 45 35 32 25 22 C18 12 32 5 40 16 C48 26 50 35 55 30 
                 C60 25 58 10 70 8 C80 6 85 22 75 32 C68 40 78 48 88 45 C102 42 105 62 92 68 C80 72 68 76 65 95 Z" 
              fill="url(#coralGrad_${color.replace('#','')})"/>
        <!-- 귀여운 도트 무늬 -->
        <circle cx="32" cy="50" r="3" fill="#FFF" opacity="0.6"/>
        <circle cx="76" cy="36" r="3.5" fill="#FFF" opacity="0.6"/>
        <circle cx="55" cy="52" r="4" fill="#FFF" opacity="0.5"/>
        <circle cx="86" cy="58" r="2.5" fill="#FFF" opacity="0.6"/>
      </g>
    </svg>
  `;
}

/**
 * 터치하면 열리며 보물 방울을 뿜는 보물상자
 */
export function createTreasureChestSVG(width = 85, isOpen = false) {
  const height = Math.round(width * 0.8);
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 90 75" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor: pointer;">
      <defs>
        <filter id="chestGlow">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="rgba(0,0,0,0.2)"/>
        </filter>
      </defs>
      <g filter="url(#chestGlow)">
        <!-- 상자 몸통 -->
        <rect x="10" y="32" width="70" height="38" rx="6" fill="#854D0E"/>
        <rect x="15" y="35" width="60" height="32" rx="4" fill="#A16207"/>
        <!-- 황금 테두리 밴드 -->
        <rect x="22" y="32" width="8" height="38" fill="#FACC15"/>
        <rect x="60" y="32" width="8" height="38" fill="#FACC15"/>
        <!-- 자물쇠 -->
        <rect x="40" y="38" width="10" height="12" rx="2" fill="#FDE047" stroke="#713F12" stroke-width="1.5"/>
        <circle cx="45" cy="43" r="2" fill="#713F12"/>

        ${isOpen ? `
          <!-- 열린 뚜껑 -->
          <path d="M6 30 C12 8 78 8 84 30 L74 34 C68 18 22 18 16 34 Z" fill="#CA8A04" stroke="#713F12" stroke-width="1.5"/>
          <!-- 뚜껑 안쪽에서 뿜어져 나오는 황금빛 -->
          <ellipse cx="45" cy="30" rx="28" ry="8" fill="#FEF08A" opacity="0.85"/>
          <circle cx="45" cy="22" r="5" fill="#FACC15"/>
          <circle cx="34" cy="25" r="3" fill="#FDE047"/>
          <circle cx="56" cy="25" r="3.5" fill="#FDE047"/>
        ` : `
          <!-- 닫힌 둥근 뚜껑 -->
          <path d="M10 32 C10 16 80 16 80 32 Z" fill="#CA8A04"/>
          <path d="M22 32 C22 18 30 18 30 32 Z" fill="#FACC15"/>
          <path d="M60 32 C60 18 68 18 68 32 Z" fill="#FACC15"/>
        `}
      </g>
    </svg>
  `;
}

/**
 * 바닥 조약돌과 아기 불가사리
 */
export function createSeabedPebblesSVG(width = 200) {
  return `
    <svg width="${width}" height="35" viewBox="0 0 200 35" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 둥근 조약돌들 -->
      <ellipse cx="25" cy="22" rx="18" ry="10" fill="#E2E8F0" opacity="0.7"/>
      <ellipse cx="60" cy="25" rx="14" ry="8" fill="#CBD5E1" opacity="0.8"/>
      <ellipse cx="95" cy="20" rx="20" ry="11" fill="#F1F5F9" opacity="0.75"/>
      <ellipse cx="135" cy="24" rx="15" ry="9" fill="#E2E8F0" opacity="0.8"/>
      <ellipse cx="175" cy="22" rx="16" ry="9" fill="#CBD5E1" opacity="0.7"/>

      <!-- 바닥 작은 아기 불가사리 -->
      <path d="M80 15 L82 20 L87 21 L83 24 L84 29 L80 26 L76 29 L77 24 L73 21 L78 20 Z" fill="#F43F5E" opacity="0.85"/>
      <circle cx="80" cy="22" r="1" fill="#FFF"/>
    </svg>
  `;
}
