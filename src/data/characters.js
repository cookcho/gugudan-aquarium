// 2~9단 바다 친구들. 생김새에 그 단의 숫자가 숨어 있어요 (8단 문어 = 다리 8개).

// 쉬운 단부터 여는 순서
export const DAN_ORDER = [2, 5, 3, 4, 6, 9, 7, 8];
export const DANS = [2, 3, 4, 5, 6, 7, 8, 9];

// progress: 0 아직 없음 · 1 알 · 2 아기(부화) · 3 성장 · 4 황금
export const STAGES = [
  { progress: 1, icon: '🥚', label: '알' },
  { progress: 2, icon: '🐣', label: '아기' },
  { progress: 3, icon: '🐟', label: '성장' },
  { progress: 4, icon: '👑', label: '황금' }
];

export const CHARACTERS = {
  2: { dan: 2, trait: '늘 둘이 꼭 붙어 다녀요. 황금이 되면 왕관도 두 개!', name: '투투', species: '쌍둥이 해마', island: '쌍둥이 해마섬', color: '#3BB273', line: '둘씩 둘씩!' },
  3: { dan: 3, trait: '꼬리가 세 갈래라 하나 둘 셋 박자로 헤엄쳐요', name: '삼삼이', species: '세 꼬리 금붕어', island: '세 꼬리 금붕어섬', color: '#FF7A59', line: '하나 둘 셋, 셋씩!' },
  4: { dan: 4, trait: '지느러미 네 개로 느긋하게 바다를 누벼요', name: '포포', species: '네 지느러미 거북', island: '느긋한 거북섬', color: '#4AA3C8', line: '천천히 넷씩 가자~' },
  5: { dan: 5, trait: '팔이 다섯 개라 하이파이브를 제일 좋아해요', name: '오별이', species: '불가사리', island: '반짝 불가사리섬', color: '#F2A516', line: '하이파이브! 다섯씩!' },
  6: { dan: 6, trait: '몸의 여섯 갈래 눈꽃 무늬가 반짝반짝 빛나요', name: '육각이', species: '눈꽃 해파리', island: '눈꽃 해파리섬', color: '#8A7FD8', line: '반짝반짝 여섯 번!' },
  7: { dan: 7, trait: '비늘이 빨주노초파남보 일곱 빛깔이에요', name: '칠색이', species: '무지개 물고기', island: '무지개섬', color: '#E0508A', line: '빨주노초파남보, 일곱!' },
  8: { dan: 8, trait: '다리 여덟 개로 숫자 카드를 하나씩 들고 다녀요', name: '팔팔이', species: '문어', island: '팔팔 문어섬', color: '#D9534F', line: '다리가 여덟, 팔팔하게!' },
  9: { dan: 9, trait: '숨 쉴 때마다 물줄기가 아홉 갈래로 솟아요', name: '구름이', species: '아홉 물줄기 고래', island: '고래 구름섬', color: '#2F6FA3', line: '아홉 갈래 물줄기, 슝!' }
};

export function stageName(dan, progress) {
  const c = CHARACTERS[dan];
  return ['???', `${c.name}의 알`, `아기 ${c.name}`, `씩씩한 ${c.name}`, `황금 ${c.name}`][progress];
}
