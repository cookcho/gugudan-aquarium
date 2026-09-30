// 큰 선물: 별을 오래 모아야 살 수 있는 목표 아이템. 상점 "🎁 큰 선물" 칸에서 찜하면 어항 위 저금통에 표시돼요.
// kind: tank(어항 업그레이드, 순서대로) · requires: 먼저 가져야 하는 큰 선물
export const BIG_ITEMS = [
  { id: 'tank1', kind: 'tank', level: 1, icon: '🏠', name: '큰 수족관', cost: 300, desc: '하얀 대리석 받침대와 뒤쪽 바위 배경' },
  { id: 'tank2', kind: 'tank', level: 2, icon: '🪸', name: '산호초 수족관', cost: 600, requires: 'tank1', desc: '알록달록 산호 벽과 반짝이는 햇빛 줄기' },
  { id: 'tank3', kind: 'tank', level: 3, icon: '👑', name: '바다 왕궁 어항', cost: 1200, requires: 'tank2', desc: '금테 어항, 용궁 기둥, 보석 조명' }
];

export const bigItemById = (id) => BIG_ITEMS.find((it) => it.id === id);
