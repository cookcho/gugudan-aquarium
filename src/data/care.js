// 친구와 친해지기, 오늘의 부탁, 깜짝 선물 규칙

// 친밀도 점수 → 하트 단계 (♥0 ~ ♥4)
export const LOVE_LEVELS = [0, 10, 30, 60, 100];

// 하트 단계마다 새로 할 수 있게 되는 것
export const LOVE_PERKS = [
  '',
  '반갑게 인사해요',
  '재주넘기를 할 수 있어요',
  '신나게 춤을 춰요',
  '이름을 불러 줘요'
];

// 하루에 오를 수 있는 친밀도 한도 (종류별)
export const DAILY_LOVE_CAP = { pet: 5, feed: 6, play: 6, request: 10, review: 2 };

// 기념일 (만난 지 N일)
export const ANNIVERSARIES = [7, 30, 50, 100];

// 오늘의 부탁 종류. who: 부탁한 친구가 해야 끝나는지(fish), 누가 해도 되는지(any)
export const REQUESTS = {
  feed: { icon: '🍽️', who: 'fish', text: (name) => `${name}: "배고파요, 밥 주세요!"` },
  pet: { icon: '🤲', who: 'fish', text: (name) => `${name}: "나 좀 쓰다듬어 줘!"` },
  play: { icon: '⚽', who: 'fish', text: (name) => `${name}: "공놀이 하자!"` },
  clean: { icon: '🧽', who: 'any', text: (name) => `${name}: "어항이 더러워요, 청소해 줘!"` },
  decor: { icon: '🪸', who: 'any', text: (name) => `${name}: "장식 하나를 새 자리로 옮겨 줘!"` },
  review: { icon: '📅', who: 'any', text: (name) => `${name}: "오늘의 복습 같이 하자!"` }
};

// 깜짝 선물로 나올 수 있는 것 (minLevel: 그 친구의 하트 단계가 이 이상일 때만)
export const GIFT_PRIZES = [
  { label: '별 5개', stars: 5 },
  { label: '별 8개', stars: 8, minLevel: 3 },
  { label: '먹이 5개', food: 5 },
  { label: '물고기 약', medicine: 1 },
  { label: '소라껍데기', decor: 'shell' },
  { label: '불가사리 장식', decor: 'starDeco' },
  { label: '알록달록 조약돌', decor: 'pebbles' },
  { label: '진주 조개', decor: 'clam', minLevel: 4 }
];

// 받침이 있으면 true (투투 → false, 오별이 → false, 삼삼 → true)
export function hasBatchim(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

export const josa = (word, withB, withoutB) => word + (hasBatchim(word) ? withB : withoutB);
