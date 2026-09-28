// 어항에 놀러 오는 손님들. 좋아하는 장식(likes)이 어항에 있으면 가끔 찾아와요.
// riddle(a, b): a개씩 b번 → a × b 구구단 수수께끼
export const GUESTS = [
  {
    id: 'crab', name: '집게', species: '꼬마 게', color: '#E8603C',
    likes: ['rock', 'pebbles', 'starDeco', 'shell'],
    motion: { speed: 0.6, zone: 'floor', bob: 0, rest: 0.35, dash: 0.05, wag: 1 },
    hello: '안녕! 조약돌 사이가 좋아서 놀러 왔어!',
    riddle: (a, b) => `조개를 ${a}개씩 ${b}번 집었어! 모두 몇 개게?`
  },
  {
    id: 'clown', name: '니모', species: '흰동가리', color: '#FF8C1A',
    likes: ['anemone', 'seaweed', 'kelp', 'bush'],
    motion: { speed: 0.9, zone: 'any', bob: 0.3, rest: 0.2, dash: 0.1, wag: 0.35, tilt: true },
    hello: '말미잘 집이 있어서 신나게 놀러 왔어!',
    riddle: (a, b) => `말미잘 촉수가 ${a}개씩 ${b}묶음! 모두 몇 개게?`
  },
  {
    id: 'puffer', name: '뽀용이', species: '복어', color: '#F2C94C',
    likes: ['coralPink', 'coralOrange', 'fanCoral', 'brainCoral'],
    motion: { speed: 0.6, zone: 'any', bob: 1.2, rest: 0.3, dash: 0.05, wag: 0.5 },
    hello: '뽀용! 산호가 예뻐서 왔어!',
    riddle: (a, b) => `뽀용! 가시가 ${a}개씩 ${b}줄 있어. 모두 몇 개게?`
  },
  {
    id: 'pirate', name: '캡틴 앵무', species: '해적 앵무조개', color: '#D9793A',
    likes: ['ship', 'chest', 'anchor', 'helmet'],
    motion: { speed: 0.9, zone: 'any', bob: 0.6, rest: 0.2, dash: 0.1, wag: 0.8, tilt: true },
    hello: '어이, 선원! 보물 냄새를 맡고 왔다!',
    riddle: (a, b) => `금화가 ${a}개씩 ${b}자루 있다! 모두 몇 개냐, 선원?`
  },
  {
    id: 'angler', name: '초롱이', species: '초롱아귀', color: '#3B4F8C', night: true,
    likes: ['jellyLamp', 'lighthouse'],
    motion: { speed: 0.5, zone: 'any', bob: 0.6, rest: 0.3, dash: 0, wag: 1.1, tilt: true },
    hello: '반짝반짝 불빛이 좋아서 왔어~',
    riddle: (a, b) => `내 불빛이 ${a}번씩 ${b}번 반짝했어. 모두 몇 번?`
  },
  {
    id: 'tang', name: '블루', species: '블루탱', color: '#2F6FE0',
    likes: ['crystal', 'clam', 'castle'],
    motion: { speed: 1, zone: 'any', bob: 0.4, rest: 0.2, dash: 0.1, wag: 0.4, tilt: true },
    hello: '반짝이는 게 좋아서 왔… 어? 내가 뭐 하러 왔더라?',
    riddle: (a, b) => `반짝이는 진주가 ${a}개씩 ${b}줄… 모두 몇 개였더라?`
  },
  {
    id: 'whale', name: '꼬마 고래', species: '아기 고래', color: '#6CB4E4',
    likes: ['bubbler', 'mushroom', 'sign'],
    motion: { speed: 0.7, zone: 'upper', bob: 0.6, rest: 0.25, dash: 0.05, wag: 1, tilt: true },
    hello: '뿌우~ 거품 놀이 하러 왔어!',
    riddle: (a, b) => `물방울을 ${a}개씩 ${b}번 뿜었어! 모두 몇 개?`
  }
];

export const guestById = (id) => GUESTS.find((g) => g.id === id);
