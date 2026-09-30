// 두 번째 바다: 문장제(서술형) 문제은행. 섬 9개, 섬마다 문제 틀 3~4개.
// 틀의 {…}는 뽑을 때마다 바뀌어요. {이름|은는}처럼 쓰면 받침에 맞게 조사를 붙여요.
// 숫자는 황금이 된 단(allowed)에서만 나와요. 곱셈 한 번은 늘 "a개씩 b묶음" (a × b)이에요.
// 이 파일은 확인용 페이지에도 그대로 붙여 쓰려고 다른 파일을 불러오지 않아요.

const NAMES = ['민수', '지아', '서준', '하윤', '도윤', '수아', '준우', '예린', '하준', '소율'];
// 물건: 이름, 세는 말(단위), 담는 것(묶음). food: "먹었어요" 문제에 나올 수 있는 것
const THINGS = [
  { item: '사과', unit: '개', group: '상자', food: true },
  { item: '사탕', unit: '개', group: '봉지', food: true },
  { item: '딸기', unit: '개', group: '접시', food: true },
  { item: '구슬', unit: '개', group: '주머니' },
  { item: '쿠키', unit: '개', group: '접시', food: true },
  { item: '연필', unit: '자루', group: '묶음' },
  { item: '색종이', unit: '장', group: '묶음' },
  { item: '공', unit: '개', group: '바구니' },
  { item: '꽃', unit: '송이', group: '다발' }
];
// 다리 세기 섬: 한 마리(대)에 몇 개인지 정해진 것
const CREATURES = [
  { who: '문어', part: '다리', a: 8, count: '마리' },
  { who: '거미', part: '다리', a: 8, count: '마리' },
  { who: '강아지', part: '다리', a: 4, count: '마리' },
  { who: '오리', part: '다리', a: 2, count: '마리' },
  { who: '개미', part: '다리', a: 6, count: '마리' },
  { who: '불가사리', part: '팔', a: 5, count: '마리' },
  { who: '자동차', part: '바퀴', a: 4, count: '대' },
  { who: '세발자전거', part: '바퀴', a: 3, count: '대' },
  { who: '두발자전거', part: '바퀴', a: 2, count: '대' }
];

function hasBatchim(word) {
  const last = word.charCodeAt(word.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) return (last - 0xac00) % 28 !== 0;
  return /[013678]$/.test(word); // 숫자: 일·삼·육·칠·팔·영
}
const JOSA = { 은는: ['은', '는'], 이가: ['이', '가'], 을를: ['을', '를'], 과와: ['과', '와'], 아야: ['아', '야'] };

const rand = (list) => list[Math.floor(Math.random() * list.length)];
const between = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// 곱셈 한 번: a개씩 b묶음. 둘 중 하나는 황금이 된 단이어야 해요 (×1은 빼요)
function fact(allowed, fixedA = null) {
  for (let i = 0; i < 50; i++) {
    const a = fixedA ?? between(2, 9);
    const b = between(2, 9);
    if (allowed.includes(a) || allowed.includes(b)) return [a, b];
  }
  return [fixedA ?? allowed[0], 2];
}

// 섬 9개: level 하·중·상, gen(allowed)이 틀에 넣을 값과 답을 돌려줘요
export const WORD_ISLANDS = [
  {
    id: 'bundle', icon: '🍎', name: '묶음 섬', level: '하', about: '○개씩 ○묶음을 곱하기 한 번으로',
    templates: [
      '{이름|은는} {물건|을를} 한 {묶음}에 {a}{단위}씩 {b}{묶음} 샀어요. {물건|은는} 모두 몇 {단위}일까요?',
      '한 {묶음}에 {물건|이가} {a}{단위}씩 들어 있어요. {b}{묶음}에는 {물건|이가} 모두 몇 {단위} 있을까요?',
      '{이름|은는} {물건|을를} 친구 {b}명에게 {a}{단위}씩 나누어 주려고 해요. {물건|은는} 모두 몇 {단위} 필요할까요?'
    ],
    gen(allowed) {
      const [a, b] = fact(allowed);
      return { a, b, answer: a * b, steps: [`${a} × ${b} = ${a * b}`] };
    }
  },
  {
    id: 'legs', icon: '🐙', name: '다리 세기 섬', level: '하', about: '동물과 탈것의 다리·바퀴 수로 곱하기',
    templates: [
      '{동물} 한 {세기}는 {부위|이가} {a}개예요. {동물} {b}{세기}의 {부위|은는} 모두 몇 개일까요?',
      '{이름|은는} 바닷가에서 {동물} {b}{세기}를 보았어요. {동물} 한 {세기}의 {부위|은는} {a}개예요. {부위|은는} 모두 몇 개일까요?'
    ],
    gen(allowed) {
      const c = rand(CREATURES);
      const [, b] = fact(allowed, c.a);
      return { a: c.a, b, 동물: c.who, 부위: c.part, 세기: c.count, answer: c.a * b, steps: [`${c.a} × ${b} = ${c.a * b}`] };
    }
  },
  {
    id: 'daily', icon: '📅', name: '달력 섬', level: '하', about: '날짜·반 친구·책 읽기 같은 생활 속 곱하기',
    templates: [
      '일주일은 7일이에요. {b}주는 모두 며칠일까요?',
      '{이름|은는} 하루에 줄넘기를 {a}번씩 해요. {b}일 동안 모두 몇 번 할까요?',
      '한 모둠에 {a}명씩 앉아요. 모둠이 {b}개면 반 친구는 모두 몇 명일까요?',
      '{이름|은는} 매일 동화책을 {a}쪽씩 읽어요. {b}일 동안 모두 몇 쪽을 읽을까요?'
    ],
    gen(allowed, t) {
      const [a, b] = t === 0 ? fact(allowed, 7) : fact(allowed);
      return { a, b, answer: a * b, steps: [`${a} × ${b} = ${a * b}`] };
    }
  },
  {
    id: 'times', icon: '🔁', name: '몇 배 섬', level: '중', about: '"~의 ○배"를 곱셈으로 바꾸기 (2~5배)',
    templates: [
      '{이름|은는} 딱지를 {a}장 가지고 있어요. {이름2|은는} {이름}의 {b}배를 가지고 있어요. {이름2|은는} 딱지를 몇 장 가지고 있을까요?',
      '파란 구슬은 {a}개이고, 빨간 구슬은 파란 구슬의 {b}배예요. 빨간 구슬은 몇 개일까요?',
      '어제는 {물건|을를} {a}{단위} 먹었어요. 오늘은 어제의 {b}배를 먹었어요. 오늘 먹은 {물건|은는} 몇 {단위}일까요?'
    ],
    gen(allowed) {
      let a;
      let b;
      do { [a, b] = fact(allowed); } while (b > 5); // "몇 배"는 2~5배까지만
      return { a, b, answer: a * b, steps: [`${a} × ${b} = ${a * b}`] };
    }
  },
  {
    id: 'plus', icon: '➕', name: '더하기 섬', level: '중', about: '곱하고 나서 더하기 (두 번 계산)',
    templates: [
      '{물건|이가} {a}{단위}씩 {b}{묶음} 있고, 낱개로 {c}{단위|이가} 더 있어요. {물건|은는} 모두 몇 {단위}일까요?',
      '{이름|은는} 스티커를 한 장에 {a}개씩 {b}장 모았고, 오늘 {c}개를 더 받았어요. 스티커는 모두 몇 개일까요?',
      '버스 {b}대에 어린이가 {a}명씩 타고, 선생님 {c}명도 함께 갔어요. 소풍 간 사람은 모두 몇 명일까요?'
    ],
    gen(allowed) {
      const [a, b] = fact(allowed);
      const c = between(1, 9);
      return { a, b, c, answer: a * b + c, steps: [`${a} × ${b} = ${a * b}`, `${a * b} + ${c} = ${a * b + c}`] };
    }
  },
  {
    id: 'minus', icon: '➖', name: '빼기 섬', level: '중', about: '곱하고 나서 빼기 (두 번 계산)',
    templates: [
      '{물건|이가} {a}{단위}씩 {b}{묶음} 있었어요. 그중 {c}{단위|을를} 먹었어요. 남은 {물건|은는} 몇 {단위}일까요?',
      '{이름|은는} 색종이를 {a}장씩 {b}묶음 가지고 있었어요. 종이접기에 {c}장을 썼어요. 남은 색종이는 몇 장일까요?',
      '의자가 한 줄에 {a}개씩 {b}줄 있어요. 친구 {c}명이 한 자리씩 앉았어요. 빈 의자는 몇 개일까요?'
    ],
    gen(allowed) {
      const [a, b] = fact(allowed);
      const c = between(1, Math.min(9, a * b - 1));
      return { a, b, c, answer: a * b - c, steps: [`${a} × ${b} = ${a * b}`, `${a * b} - ${c} = ${a * b - c}`] };
    }
  },
  {
    id: 'blank', icon: '❓', name: '빈칸 섬', level: '중·상', about: '전체를 알고 거꾸로 생각하기 (□ 구하기)',
    templates: [
      '{물건|을를} 한 {묶음}에 {a}{단위}씩 담았더니 모두 {ab}{단위|이가} 되었어요. {묶음|은는} 몇 개일까요?',
      '{물건|을를} {b}{묶음}에 똑같이 나누어 담았더니 모두 {ab}{단위}예요. 한 {묶음}에 몇 {단위}씩 담았을까요?',
      '□ × {a} = {ab}예요. □에 알맞은 수는 무엇일까요?'
    ],
    gen(allowed, t) {
      const [a, b] = fact(allowed);
      const answer = t === 1 ? a : b; // 두 번째 틀은 "한 묶음에 몇 개씩"을 물어요
      return { a, b, ab: a * b, answer, steps: t === 1 ? [`□ × ${b} = ${a * b}`, `${a} × ${b} = ${a * b} 이니까 □ = ${a}`] : [`${a} × □ = ${a * b}`, `${a} × ${b} = ${a * b} 이니까 □ = ${b}`] };
    }
  },
  {
    id: 'compare', icon: '⚖️', name: '비교 섬', level: '상', about: '두 가지를 곱해서 누가 얼마나 더 많은지',
    templates: [
      '{이름|은는} 꽃을 {a}송이씩 {b}줄 심었고, {이름2|은는} {c}송이씩 {d}줄 심었어요. 더 많이 심은 친구는 몇 송이 더 심었을까요?',
      '사탕이 {a}개씩 든 봉지 {b}개와 {c}개씩 든 봉지 {d}개가 있어요. 더 많은 쪽은 몇 개 더 많을까요?',
      '{이름|은는} 구슬을 {a}개씩 {b}줄 가지고 있어요. {이름2|은는} 구슬 {c}개를 가지고 있어요. {이름|은는} {이름2}보다 몇 개 더 많이 가지고 있을까요?'
    ],
    gen(allowed, t) {
      const [a, b] = fact(allowed);
      if (t === 2) {
        const c = between(1, a * b - 1);
        return { a, b, c, answer: a * b - c, steps: [`${a} × ${b} = ${a * b}`, `${a * b} - ${c} = ${a * b - c}`] };
      }
      let c;
      let d;
      do { [c, d] = fact(allowed); } while (c * d === a * b);
      const big = Math.max(a * b, c * d);
      const small = Math.min(a * b, c * d);
      return { a, b, c, d, answer: big - small, steps: [`${a} × ${b} = ${a * b}`, `${c} × ${d} = ${c * d}`, `${big} - ${small} = ${big - small}`] };
    }
  },
  {
    id: 'story', icon: '🏰', name: '이야기 섬', level: '상', about: '세 번 계산하는 긴 이야기 (최종 섬)',
    templates: [
      '{물건|을를} {a}{단위}씩 {b}{묶음} 샀어요. 그중 {c}{단위|을를} 먹고, 친구에게 {d}{단위|을를} 주었어요. 남은 {물건|은는} 몇 {단위}일까요?',
      '{이름|은는} 딱지를 {a}장씩 {b}묶음 가지고 있었어요. 형에게 {c}장을 더 받고, 동생에게 {d}장을 주었어요. {이름|은는} 딱지를 몇 장 가지고 있을까요?',
      '빨간 공은 {a}개씩 {b}바구니, 파란 공은 {c}개씩 {d}바구니 있어요. 공은 모두 몇 개일까요?'
    ],
    gen(allowed, t) {
      const [a, b] = fact(allowed);
      if (t === 2) {
        const [c, d] = fact(allowed);
        return { a, b, c, d, answer: a * b + c * d, steps: [`${a} × ${b} = ${a * b}`, `${c} × ${d} = ${c * d}`, `${a * b} + ${c * d} = ${a * b + c * d}`] };
      }
      const c = between(1, 9);
      if (t === 1) {
        const d = between(1, Math.min(9, a * b + c - 1));
        return { a, b, c, d, answer: a * b + c - d, steps: [`${a} × ${b} = ${a * b}`, `${a * b} + ${c} = ${a * b + c}`, `${a * b + c} - ${d} = ${a * b + c - d}`] };
      }
      const c2 = between(1, Math.min(9, Math.floor((a * b) / 2)));
      const d = between(1, Math.min(9, a * b - c2 - 1));
      return { a, b, c: c2, d, answer: a * b - c2 - d, steps: [`${a} × ${b} = ${a * b}`, `${a * b} - ${c2} = ${a * b - c2}`, `${a * b - c2} - ${d} = ${a * b - c2 - d}`] };
    }
  }
];

// 틀에 값을 채워 문제를 만들어요. kid: 아이 이름이 있으면 가끔 주인공이 돼요
export function makeProblem(islandIndex, allowed, { kid = '', template = null } = {}) {
  const island = WORD_ISLANDS[islandIndex];
  const t = template ?? Math.floor(Math.random() * island.templates.length);
  const v = island.gen(allowed, t);
  const thing = rand(/먹/.test(island.templates[t]) ? THINGS.filter((x) => x.food) : THINGS);
  const [n1, n2] = [...NAMES].sort(() => Math.random() - 0.5);
  const values = {
    이름: kid && Math.random() < 0.3 ? kid : n1,
    이름2: n2,
    물건: thing.item,
    단위: thing.unit,
    묶음: thing.group,
    ...v
  };
  const text = island.templates[t].replace(/\{([^}|]+)(?:\|([^}]+))?\}/g, (_, key, josa) => {
    const word = String(values[key] ?? '');
    if (!josa) return word;
    const [withB, withoutB] = JOSA[josa];
    return word + (hasBatchim(word) ? withB : withoutB);
  });
  return { island: island.id, level: island.level, template: t, text, answer: v.answer, steps: v.steps, a: v.a, b: v.b };
}
