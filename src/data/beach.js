// 친구들의 섬 해변 장식. 조개(🐚)로 사요. 조개는 문장제를 풀거나 해변에서 주워 모아요.
// zone: 놓을 수 있는 자리 (sand 모래밭 · shallow 얕은 물 · sky 하늘)
// size: 가로 크기 (--u 배수) · night: 밤에 빛나는 장식
import * as b from '../graphics/beachDecor.js';

export const BEACH_TABS = [
  { id: 'prop', label: '🏖️ 해변 소품' },
  { id: 'nature', label: '🐚 바닷가' },
  { id: 'water', label: '🌊 얕은 물' },
  { id: 'night', label: '✨ 밤에 빛나요' }
];

// 자리별로 놓을 수 있는 높이 (화면 세로 %)
export const ZONE_Y = {
  sand: [72, 93],
  shallow: [50, 60],
  sky: [8, 26]
};

export const BEACH_ITEMS = [
  // 🏖️ 해변 소품
  { type: 'parasol', cat: 'prop', zone: 'sand', name: '파라솔', cost: 8, size: 16, draw: b.parasol },
  { type: 'beachChair', cat: 'prop', zone: 'sand', name: '비치 의자', cost: 6, size: 12, draw: b.beachChair },
  { type: 'tube', cat: 'prop', zone: 'sand', name: '튜브', cost: 5, size: 10, draw: b.tube },
  { type: 'picnic', cat: 'prop', zone: 'sand', name: '피크닉 바구니', cost: 6, size: 11, draw: b.picnicBasket },
  { type: 'coconut', cat: 'prop', zone: 'sand', name: '코코넛 음료', cost: 4, size: 7, draw: b.coconutDrink },
  { type: 'beachBall', cat: 'prop', zone: 'sand', name: '비치볼', cost: 4, size: 7, draw: b.beachBall },
  // 🐚 바닷가 자연물
  { type: 'shellPile', cat: 'nature', zone: 'sand', name: '조개 무더기', cost: 3, size: 9, draw: b.shellPile },
  { type: 'driftwood', cat: 'nature', zone: 'sand', name: '유목 벤치', cost: 7, size: 14, draw: b.driftwood },
  { type: 'starfish', cat: 'nature', zone: 'sand', name: '큰 불가사리', cost: 4, size: 8, draw: b.bigStarfish },
  { type: 'reeds', cat: 'nature', zone: 'sand', name: '바닷가 갈대', cost: 5, size: 11, draw: b.reeds },
  { type: 'palm', cat: 'nature', zone: 'sand', name: '야자수 심기', cost: 12, size: 20, draw: b.palmTree },
  // 🌊 얕은 물
  { type: 'sailboat', cat: 'water', zone: 'shallow', name: '돛단배', cost: 10, size: 15, draw: b.sailboat },
  { type: 'canoe', cat: 'water', zone: 'shallow', name: '카누', cost: 8, size: 14, draw: b.canoe },
  { type: 'buoy', cat: 'water', zone: 'shallow', name: '부표', cost: 5, size: 8, draw: b.buoy },
  { type: 'coralRock', cat: 'water', zone: 'shallow', name: '산호 바위', cost: 7, size: 12, draw: b.coralRock },
  // ✨ 밤에 빛나는 것
  { type: 'campfire', cat: 'night', zone: 'sand', name: '모닥불', cost: 14, size: 11, night: true, draw: b.campfire },
  { type: 'lanterns', cat: 'night', zone: 'sky', name: '조개 등불 줄', cost: 12, size: 26, night: true, draw: b.shellLanterns },
  { type: 'lighthouse', cat: 'night', zone: 'sand', name: '작은 등대', cost: 18, size: 14, night: true, draw: b.lighthouse }
];

export const beachItem = (type) => BEACH_ITEMS.find((it) => it.type === type);
export const beachDraw = (type, u) => {
  const it = beachItem(type);
  return it ? it.draw(Math.round(u * it.size)) : '';
};
