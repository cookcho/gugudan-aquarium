// 두 번째 바다: 문장제 섬 9개. 첫 번째 바다에서 황금 섬이 SEA2_OPEN_AT개가 되면 출항할 수 있어요.
// 섬마다 친구 한 명 (그림은 public/characters/sea2-섬id.png, 없으면 이모지 그림). 황금은 금빛으로 칠해요.
// word: 문제은행(wordProblems.js) WORD_ISLANDS의 순서
// home: 친구들의 섬에서 사는 곳 (sea 바다에서 헤엄 · float 물 위에 둥둥 · land 모래밭 · rock 바위 웅덩이)
export const SEA2_OPEN_AT = 4;

export const SEA2 = [
  { id: 'bundle', home: 'float', word: 0, friend: { name: '달콩이', species: '해달', emoji: '🦦', color: '#B07A4F', line: '조개를 묶음으로 모으는 게 좋아!' } },
  { id: 'legs', home: 'rock', word: 1, friend: { name: '뾰족이', species: '성게', emoji: '🦔', color: '#7A4FB0', line: '가시가 몇 개인지 세어 볼래?' } },
  { id: 'daily', home: 'land', word: 2, friend: { name: '펭달이', species: '꼬마 펭귄', emoji: '🐧', color: '#3A4A5C', line: '오늘은 무슨 요일이게?' } },
  { id: 'times', home: 'sea', word: 3, friend: { name: '앵두', species: '앵무새치', emoji: '🐠', color: '#2FB5A0', line: '두 배, 세 배로 헤엄칠 수 있어!' } },
  { id: 'plus', home: 'land', word: 4, friend: { name: '통통이', species: '물범', emoji: '🦭', color: '#8A9AAA', line: '더하면 더 많아져! 헤헤' } },
  { id: 'minus', home: 'sea', word: 5, friend: { name: '곰치리', species: '꼬마 곰치', emoji: '🐍', color: '#6FA84F', line: '남은 건 내가 지킬게!' } },
  { id: 'blank', home: 'sea', word: 6, friend: { name: '나비', species: '나비고기', emoji: '🦋', color: '#F2C94C', line: '숨은 숫자를 찾아볼까?' } },
  { id: 'compare', home: 'sea', word: 7, friend: { name: '돌돌이', species: '돌고래', emoji: '🐬', color: '#4A90D9', line: '누가 더 많은지 대결이야!' } },
  { id: 'story', home: 'sea', word: 8, friend: { name: '해룡이', species: '나뭇잎해룡', emoji: '🐉', color: '#9BC53D', line: '긴 이야기를 들려줄게' } }
];

// 섬 한 곳의 네 단계 (첫 번째 바다와 같아요: 알 찾기 → 부화 → 성장 → 황금)
export const SEA2_STAGES = [
  { to: 1, icon: '🥚', label: '알 찾기', game: '보기 고르기 5문제', count: 5, pass: 4, input: 'choice' },
  { to: 2, icon: '🐣', label: '부화', game: '보기 고르기 7문제', count: 7, pass: 5, input: 'choice' },
  { to: 3, icon: '🐟', label: '성장', game: '숫자판에 직접 쓰기 7문제', count: 7, pass: 5, input: 'keypad' },
  { to: 4, icon: '👑', label: '황금', game: '해적 선장 보스전', count: 6, pass: 6, input: 'keypad', boss: true }
];
