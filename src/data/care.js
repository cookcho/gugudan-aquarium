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
// 부탁 대사는 여러 개 중 하나가 나와요. kid = "선우야" 처럼 부르는 말 (이름이 없으면 빈칸)
const REQUEST_LINES = {
  feed: [
    () => '배고파요, 밥 주세요!',
    (kid) => `${kid || '있잖아'}, 배에서 꼬르륵 소리 나!`,
    () => '맛있는 밥 먹고 싶어~'
  ],
  pet: [
    () => '나 좀 쓰다듬어 줘!',
    (kid) => `${kid || '있잖아'}, 머리 쓰다듬어 줄래?`,
    () => '간질간질 쓰다듬어 줘~'
  ],
  play: [
    () => '공놀이 하자!',
    (kid) => `${kid || '있잖아'}, 공 던져 줘! 내가 받을게`,
    () => '심심해~ 공 가지고 놀자!'
  ],
  clean: [
    () => '어항이 더러워요, 청소해 줘!',
    (kid) => `${kid || '있잖아'}, 똥 좀 치워 줄래? 헤헤`
  ],
  decor: [
    () => '장식 하나를 새 자리로 옮겨 줘!',
    (kid) => `${kid ? `${kid}, 우리` : '우리'} 어항 꾸미기 하자!`
  ],
  review: [
    () => '오늘의 복습 같이 하자!',
    (kid) => `${kid || '있잖아'}, 복습 다섯 문제 같이 풀래?`
  ],
  study: [
    (kid, dan) => `나랑 ${dan}단 한 판 하자!`,
    (kid, dan) => `${kid || '있잖아'}, ${dan}단 섬에 같이 가 볼래?`,
    (kid, dan) => `${dan}단 게임 하는 거 보고 싶어!`
  ],
  card: [
    () => '내 네임카드 한번 봐 줘!',
    (kid) => `${kid || '있잖아'}, 내 이름표 눌러 봐! 카드가 있어`
  ],
  float: [
    () => '위쪽이 심심해, 물속 장식 하나 놓아 줘!',
    (kid) => `${kid || '있잖아'}, 물속에 둥실둥실 장식 놓아 줄래?`
  ]
};

// who: 'fish' 그 친구에게 해 줘야 해요 · 'any' 누가 부탁했든 하면 돼요
const REQUEST_INFO = {
  feed: { icon: '🍽️', who: 'fish' },
  pet: { icon: '🤲', who: 'fish' },
  play: { icon: '⚽', who: 'fish' },
  clean: { icon: '🧽', who: 'any' },
  decor: { icon: '🪸', who: 'any' },
  review: { icon: '📅', who: 'any' },
  study: { icon: '🎮', who: 'fish' },
  card: { icon: '🪪', who: 'fish' },
  float: { icon: '🫧', who: 'any' }
};

// 아이 이름을 부르는 말: 선우 → 선우야, 지훈 → 지훈아
export const callKid = (kid) => (kid ? `${kid}${hasBatchim(kid) ? '아' : '야'}` : '');

// text(친구 이름, 부탁, 아이 이름)
export const REQUESTS = Object.fromEntries(Object.entries(REQUEST_INFO).map(([type, info]) => [type, {
  ...info,
  text: (name, q = {}, kid = '') => {
    const lines = REQUEST_LINES[type];
    return `${name}: "${lines[(q.v || 0) % lines.length](callKid(kid), q.dan)}"`;
  }
}]));

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

// 친구를 눌렀을 때 하는 말. 친해질수록 아이 이름을 더 자주 불러요.
// ctx: { kid, level(하트 0~4), golden, streak(연속 출석), hour }
const pick = (list) => list[Math.floor(Math.random() * list.length)];
export function chatLine(ctx) {
  const k = callKid(ctx.kid);
  const plain = ['안녕! 반가워 👋', '오늘도 와 줬구나!', '같이 헤엄치자~', '뽀글뽀글, 기분 좋아!'];
  if (!k) return pick(plain);
  const named = [
    `${k}, 안녕!`,
    `${k}, 나랑 놀아 줘서 고마워!`,
    `${k}, 구구단 척척이다!`,
    `${josa(ctx.kid, '이가', '가')} 최고야!`,
    `히히, ${k} 손은 따뜻해~`,
    `${k}, 오늘도 와 줬구나!`
  ];
  if (ctx.hour >= 5 && ctx.hour < 11) named.push(`${k}, 좋은 아침!`);
  else if (ctx.hour >= 17 && ctx.hour < 21) named.push(`${k}, 오늘 하루 어땠어?`);
  else if (ctx.hour >= 21 || ctx.hour < 5) named.push(`${k}, 이제 잘 시간이야~ 잘 자!`);
  if (ctx.streak >= 3) named.push(`${k}, 벌써 ${ctx.streak}일째 만나러 왔네! 대단해!`);
  if (ctx.golden) named.push(`${k} 덕분에 황금이 됐어! ✨`);
  if (ctx.level >= 4) named.push(`${k}, 사랑해! 💖`, `${k}, 우리 제일 친한 친구지?`);
  // 이름을 부를 확률: 하트 0 → 0, 1 → 30%, 2~3 → 60%, 4 → 늘
  const chance = [0, 0.3, 0.6, 0.6, 1][ctx.level] ?? 0;
  return Math.random() < chance ? pick(named) : pick(plain);
}
