// 상점 목록: 장식 30종 + 어항 배경 4종. need = 부화시킨 친구 수 조건
import { createSeaweedSVG, createCoralSVG, createTreasureChestSVG, createSeabedPebblesSVG } from '../graphics/decorations.js';
import * as more from '../graphics/decorMore.js';
import * as floating from '../graphics/decorFloat.js';
import * as big from '../graphics/decorBig.js';

export const SHOP_TABS = [
  { id: 'plant', label: '🌿 식물' },
  { id: 'rock', label: '🪸 산호·돌' },
  { id: 'prop', label: '🏰 소품' },
  { id: 'special', label: '✨ 특별' },
  { id: 'float', label: '🫧 물속' },
  { id: 'theme', label: '🎨 배경' },
  { id: 'big', label: '🎁 큰 선물' },
  { id: 'care', label: '💊 돌보기' }
];

// size: 어항에서의 크기 (--u 배수)
export const SHOP_ITEMS = [
  { type: 'seaweed', cat: 'plant', name: '흔들 해초', cost: 8, size: 14, draw: (px) => createSeaweedSVG(px) },
  { type: 'bush', cat: 'plant', name: '수초 덤불', cost: 8, size: 11, draw: more.createBushSVG },
  { type: 'kelp', cat: 'plant', name: '긴 다시마', cost: 12, size: 6, draw: more.createKelpSVG },
  { type: 'anemone', cat: 'plant', name: '말미잘', cost: 15, size: 10, draw: more.createAnemoneSVG },

  { type: 'pebbles', cat: 'rock', name: '알록달록 조약돌', cost: 5, size: 16, draw: (px) => createSeabedPebblesSVG(px) },
  { type: 'shell', cat: 'rock', name: '소라껍데기', cost: 6, size: 7, draw: more.createShellSVG },
  { type: 'starDeco', cat: 'rock', name: '불가사리 장식', cost: 6, size: 5, draw: more.createStarDecoSVG },
  { type: 'rock', cat: 'rock', name: '이끼 바위', cost: 10, size: 13, draw: more.createRockSVG },
  { type: 'coralPink', cat: 'rock', name: '분홍 산호', cost: 12, size: 10, draw: (px) => createCoralSVG('#F43F5E', px) },
  { type: 'coralOrange', cat: 'rock', name: '주황 산호', cost: 12, size: 10, draw: (px) => createCoralSVG('#FB923C', px) },
  { type: 'fanCoral', cat: 'rock', name: '보라 부채산호', cost: 15, size: 10, draw: more.createFanCoralSVG },
  { type: 'brainCoral', cat: 'rock', name: '동글 뇌산호', cost: 15, size: 11, draw: more.createBrainCoralSVG },

  { type: 'sign', cat: 'prop', name: '우리 어항 팻말', cost: 10, size: 10, draw: more.createSignSVG },
  { type: 'anchor', cat: 'prop', name: '닻', cost: 18, size: 7, draw: more.createAnchorSVG },
  { type: 'helmet', cat: 'prop', name: '잠수부 헬멧', cost: 22, size: 8, draw: more.createHelmetSVG },
  { type: 'chest', cat: 'prop', name: '보물상자', cost: 25, size: 9, draw: (px) => createTreasureChestSVG(px, false) },
  { type: 'mushroom', cat: 'prop', name: '버섯 집', cost: 30, size: 12, need: 1, draw: more.createMushroomHouseSVG },
  { type: 'lighthouse', cat: 'prop', name: '등대', cost: 40, size: 7, need: 2, draw: more.createLighthouseSVG },
  { type: 'ship', cat: 'prop', name: '난파선', cost: 45, size: 20, need: 2, draw: more.createShipSVG },
  { type: 'castle', cat: 'prop', name: '용궁 성', cost: 60, size: 16, need: 3, draw: more.createCastleSVG },

  { type: 'clam', cat: 'special', name: '진주 조개', cost: 25, size: 8, need: 1, draw: more.createClamSVG },
  { type: 'bubbler', cat: 'special', name: '거품 기계', cost: 30, size: 5, need: 1, draw: more.createBubblerSVG },
  { type: 'jellyLamp', cat: 'special', name: '해파리 등불', cost: 35, size: 6, need: 2, draw: more.createJellyLampSVG },
  { type: 'crystal', cat: 'special', name: '반짝 수정', cost: 50, size: 9, need: 3, draw: more.createCrystalSVG },

  // 물속에 떠 있는 장식 (float: 어항에서 둥실둥실 흔들려요)
  { type: 'jellyTrio', cat: 'float', float: true, name: '꼬마 해파리 삼형제', cost: 15, size: 9.6, draw: floating.createJellyTrioSVG },
  { type: 'diverBlue', cat: 'float', float: true, name: '꼬마 잠수부 (파랑)', cost: 20, size: 12, draw: floating.createDiverBlueSVG },
  { type: 'diverPink', cat: 'float', float: true, name: '꼬마 잠수부 (분홍)', cost: 20, size: 12, draw: floating.createDiverPinkSVG },
  { type: 'submarine', cat: 'float', float: true, name: '노란 잠수함', cost: 35, size: 11.2, need: 1, draw: floating.createSubmarineSVG },
  // 큰 선물 장식 (상점 "🎁 큰 선물" 칸에서 사요, interactive: 누르면 움직여요)
  { type: 'pirateShip', cat: 'bigdecor', interactive: true, name: '해적선', cost: 300, size: 22, draw: big.createPirateShipSVG },
  { type: 'fountain', cat: 'bigdecor', interactive: true, name: '거품 분수 성', cost: 250, size: 13, draw: big.createFountainCastleSVG },
  { type: 'carousel', cat: 'bigdecor', interactive: true, name: '산호 회전목마', cost: 400, size: 15, draw: big.createCarouselSVG },
  { type: 'robot', cat: 'float', float: true, name: '탐사 로봇', cost: 40, size: 9.6, need: 2, draw: floating.createRobotSVG }
];

export const THEMES = [
  { id: 'clear', name: '맑은 바다', cost: 0, colors: ['#8EDCEB', '#0B6E99'] },
  { id: 'lagoon', name: '에메랄드 라군', cost: 30, colors: ['#A8F0E0', '#0E8C88'] },
  { id: 'sunset', name: '노을 바다', cost: 35, need: 1, colors: ['#FFC3A0', '#6A5AA8'] },
  { id: 'night', name: '반짝 밤바다', cost: 45, need: 2, colors: ['#2A3F7A', '#070F26'] }
];

export function decorSVG(type, u) {
  const item = SHOP_ITEMS.find((it) => it.type === type);
  return item ? item.draw(Math.round(u * item.size)) : '';
}
