// 저장 데이터 v2 (LocalStorage). v1(MVP) 저장이 있으면 자동으로 옮겨요.
import { DANS, DAN_ORDER, CHARACTERS } from '../data/characters.js';
import { LOVE_LEVELS, DAILY_LOVE_CAP, REQUESTS } from '../data/care.js';
import { SHOP_ITEMS } from '../data/shop.js';

const FLOAT_TYPES = SHOP_ITEMS.filter((it) => it.float).map((it) => it.type);

const KEY = 'gugudan_aquarium_save_v2';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// 하루 1~2번 들어오는 아이 기준: 들어올 때마다 밥 주기, 이틀에 한 번쯤 청소, 가끔 약
const HUNGRY_MS = 12 * HOUR_MS; // 12시간 넘게 못 먹으면 배고파요 (다음 날 오면 늘 배고파요)
const POOP_EVERY_MS = 12 * HOUR_MS; // 물고기 한 마리가 12시간마다 똥 하나 (하루 2개)
const SICK_ROLL_MS = 20 * HOUR_MS; // 아플지 말지는 하루에 한 번만 정해요
const MAX_POOPS = 12;
const FAST_MS = 5000; // 5초 안에 맞히면 "빨리 맞혔다"로 봐요
const V1_KEY = 'gugudan_aquarium_save_v1';

export function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function freshSave() {
  return {
    version: 2,
    stars: 10,
    food: 15,
    sound: true,
    music: true, // 배경음악
    musicVol: 0.6,
    voice: true,
    voiceName: '', // 비어 있으면 가장 자연스러운 목소리를 자동으로
    themes: ['clear'],
    theme: 'clear',
    progress: Object.fromEntries(DANS.map((d) => [d, 0])),
    facts: {}, // "7x8": { ok, miss, ms, last }
    days: {}, // "2026-09-27": { ms, solved, correct, games }
    streak: { count: 0, last: null },
    // 돌보기: 물고기별 마지막 밥 시간과 아픔, 쌓인 똥, 약
    pets: {}, // "2": { lastFed, sick }
    poops: [], // { id, x } x는 가로 %
    medicine: 1,
    kidName: '', // 보호자 화면에서 입력. 친밀도 ♥4 친구가 불러 줘요
    requests: null, // { date, list: [{ type, dan, done }], rewarded }
    stamps: 0,
    guests: {}, // 손님별 { met(처음 만난 날), visits, riddleDate }
    photos: [], // 기념사진: 찍은 순간의 어항 모습 (장식·친구 위치), 최신이 앞
    bigItems: [], // 산 큰 선물 id
    goal: null, // 저금통 목표로 찜한 큰 선물 id
    tankLevel: 0, // 어항 단계 0 기본 · 1 큰 수족관 · 2 산호초 · 3 바다 왕궁
    gift: null, // { date, dan, x, opened }
    lastVisit: Date.now(),
    lastSickRoll: Date.now(),
    decorations: [
      { id: 'd1', type: 'seaweed', x: 6, b: 0, placed: true },
      { id: 'd2', type: 'coralPink', x: 18, b: 0, placed: true },
      { id: 'd3', type: 'seaweed', x: 88, b: 0, placed: true }
    ]
  };
}

// 손님 꼬마 고래(whale)가 범고래(orca)로 바뀌었어요. 예전 기록을 옮겨요.
function renameGuests(save) {
  if (save.guests?.whale) {
    save.guests.orca = save.guests.whale;
    delete save.guests.whale;
  }
  return save;
}

function fromV1(v1) {
  const save = freshSave();
  save.stars = v1.stars ?? save.stars;
  save.food = v1.foodCount ?? save.food;
  for (const [dan, st] of Object.entries(v1.stages || {})) {
    if (st.fishLevel > 0) save.progress[dan] = st.fishLevel + 1;
    else if (st.step1Cleared) save.progress[dan] = 1;
  }
  return save;
}

class Store {
  constructor() {
    this.listeners = new Set();
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const base = freshSave();
        const decorations = (parsed.decorations || base.decorations).map((d) => ({ placed: true, ...d }));
        return renameGuests({ ...base, ...parsed, decorations, progress: { ...base.progress, ...parsed.progress } });
      }
      const v1 = localStorage.getItem(V1_KEY);
      if (v1) return fromV1(JSON.parse(v1));
    } catch (e) {
      console.warn('저장 데이터를 읽지 못해 새로 시작해요:', e);
    }
    return freshSave();
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('저장 실패:', e);
    }
    for (const fn of this.listeners) fn(this.data);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  day(date = today()) {
    if (!this.data.days[date]) this.data.days[date] = { ms: 0, solved: 0, correct: 0, games: 0 };
    return this.data.days[date];
  }

  // ---- 학습 밸런스 ----
  // 상어까지 다 깬 황금 섬의 게임(연습)만 섬마다 하루 한 판. 아직 키우는 섬은 몇 번이든 돼요
  // (따라 하기는 별을 주지 않아서 제한이 없어요)
  isPractice(dan, mode) {
    return ['stepping', 'mix', 'keypad', 'boss'].includes(mode) && (this.data.progress[dan] ?? 0) >= 4;
  }

  practiceDone(dan) {
    return !!this.day().practice?.[dan];
  }

  markPractice(dan) {
    const d = this.day();
    d.practice = { ...(d.practice || {}), [dan]: true };
    this.save();
  }

  // 오늘의 도전 섬: 열린 섬 중 가장 덜 자란 섬 (같으면 나중에 열린 어려운 섬). 여기서 받은 별은 2배
  challengeDan() {
    const d = this.day();
    if (d.challenge !== undefined) return d.challenge;
    let pick = null;
    for (const x of DAN_ORDER) {
      if (!this.isUnlocked(x) || this.data.progress[x] >= 4) continue;
      if (pick === null || this.data.progress[x] <= this.data.progress[pick]) pick = x;
    }
    d.challenge = pick;
    this.save();
    return pick;
  }

  addStars(n) {
    this.data.stars = Math.max(0, this.data.stars + n);
    this.save();
  }

  spendStars(n) {
    if (this.data.stars < n) return false;
    this.data.stars -= n;
    this.save();
    return true;
  }

  // 진행도는 올라가기만 해요. { from, to } 반환
  raiseProgress(dan, p) {
    const from = this.data.progress[dan];
    if (p > from) {
      this.data.progress[dan] = p;
      if (p >= 2 && from < 2) this.data.pets[dan] = { lastFed: Date.now(), sick: false };
      this.save();
    }
    return { from, to: Math.max(from, p) };
  }

  hatchedCount() {
    return Object.values(this.data.progress).filter((p) => p >= 2).length;
  }

  buyTheme(id) {
    if (!this.data.themes.includes(id)) this.data.themes.push(id);
    this.data.theme = id;
    this.save();
  }

  setTheme(id) {
    this.data.theme = id;
    this.save();
  }

  // ---- 돌보기 ----
  pet(dan) {
    if (!this.data.pets[dan]) this.data.pets[dan] = { lastFed: Date.now(), sick: false };
    const pet = this.data.pets[dan];
    if (pet.love === undefined) Object.assign(pet, { love: 0, born: today(), celebrated: [], gains: {} });
    return pet;
  }

  petName(dan) {
    return this.pet(dan).nickname || CHARACTERS[dan].name;
  }

  setNickname(dan, name) {
    this.pet(dan).nickname = name.trim().slice(0, 6);
    this.save();
  }

  // ---- 친밀도 ----
  loveLevel(dan) {
    const love = this.pet(dan).love;
    let level = 0;
    LOVE_LEVELS.forEach((need, i) => { if (love >= need) level = i; });
    return level;
  }

  // 종류별 하루 한도 안에서 친밀도를 올려요. { gained, levelUp, level }
  addLove(dan, amount, kind) {
    const pet = this.pet(dan);
    if (pet.gains.date !== today()) pet.gains = { date: today() };
    const cap = DAILY_LOVE_CAP[kind] ?? 99;
    const used = pet.gains[kind] || 0;
    const gained = Math.max(0, Math.min(amount, cap - used));
    const before = this.loveLevel(dan);
    pet.gains[kind] = used + gained;
    pet.love += gained;
    this.save();
    const level = this.loveLevel(dan);
    return { gained, levelUp: level > before, level };
  }

  daysTogether(dan) {
    const born = new Date(`${this.pet(dan).born}T00:00`);
    const now = new Date(`${today()}T00:00`);
    return Math.round((now - born) / 86400000) + 1;
  }

  // ---- 오늘의 부탁 ----
  hatchedDans() {
    return DAN_ORDER.filter((d) => this.data.progress[d] >= 2);
  }

  ensureRequests() {
    if (this.data.requests?.date === today()) return this.data.requests;
    const dans = this.hatchedDans();
    if (dans.length === 0) {
      this.data.requests = null;
      return null;
    }
    const types = ['feed', 'pet', 'play', 'study', 'card'];
    if (this.data.poops.length >= 3) types.push('clean');
    if (this.data.decorations.some((d) => d.placed)) types.push('decor');
    if (this.data.decorations.some((d) => FLOAT_TYPES.includes(d.type))) types.push('float');
    const challenge = this.challengeDan();
    if (challenge) types.push('challenge', 'challenge'); // 도전 섬 부탁은 자주 나와요
    if (this.reviewFacts(1).length && !this.reviewDoneToday()) types.push('review', 'review');
    const picked = [];
    while (picked.length < 3 && types.length) {
      const t = types.splice(Math.floor(Math.random() * types.length), 1)[0];
      if (!picked.includes(t)) picked.push(t);
    }
    const order = [...dans].sort(() => Math.random() - 0.5);
    this.data.requests = {
      date: today(),
      rewarded: false,
      list: picked.map((type, i) => ({ type, dan: order[i % order.length], done: false, v: Math.floor(Math.random() * 6), ...(type === 'challenge' ? { target: challenge } : {}) }))
    };
    this.save();
    return this.data.requests;
  }

  pendingRequest(dan) {
    const r = this.data.requests;
    if (!r || r.date !== today()) return null;
    return r.list.find((q) => !q.done && q.dan === dan) || null;
  }

  // 부탁을 들어줬는지 확인하고, 들어줬으면 그 부탁을 돌려줘요
  completeRequest(type, dan = null) {
    const r = this.data.requests;
    if (!r || r.date !== today()) return null;
    const q = r.list.find((x) => !x.done && x.type === type && (REQUESTS[type].who === 'any' || x.dan === dan));
    if (!q) return null;
    q.done = true;
    this.save();
    return q;
  }

  requestsReady() {
    const r = this.data.requests;
    return !!r && r.date === today() && !r.rewarded && r.list.every((q) => q.done);
  }

  // 도장 받기: 선물을 주고, 7개마다 큰 선물
  claimRequests() {
    if (!this.requestsReady()) return null;
    this.data.requests.rewarded = true;
    this.data.stamps++;
    const big = this.data.stamps % 7 === 0;
    const stars = big ? 20 : 6;
    this.data.stars += stars;
    this.save();
    return { stars, big, stamps: this.data.stamps };
  }

  // ---- 놀러 오는 손님 ----
  guestInfo(id) {
    if (!this.data.guests[id]) this.data.guests[id] = { met: null, visits: 0, riddleDate: null };
    return this.data.guests[id];
  }

  guestArrived(id) {
    this.guestInfo(id).visits++;
    this.save();
  }

  // 손님을 눌러서 만났을 때. 처음이면 true
  meetGuest(id) {
    const g = this.guestInfo(id);
    const first = !g.met;
    if (first) g.met = today();
    this.save();
    return first;
  }

  riddleReady(id) {
    return this.guestInfo(id).riddleDate !== today();
  }

  finishRiddle(id) {
    this.guestInfo(id).riddleDate = today();
    this.save();
  }

  // 수수께끼로 낼 곱셈: 약한 문제 중에서, 없으면 열린 섬에서
  riddleFact() {
    const weak = this.reviewFacts(5);
    if (weak.length) return weak[Math.floor(Math.random() * weak.length)];
    return { dan: 2, n: 2 + Math.floor(Math.random() * 8) };
  }

  // ---- 깜짝 선물: ♥2 이상 친구가 하루 한 번쯤 모래에서 보물을 찾아와요 ----
  rollGift() {
    if (this.data.gift?.date === today()) return this.data.gift;
    const friends = this.hatchedDans().filter((d) => this.loveLevel(d) >= 2);
    if (friends.length && Math.random() < 0.6) {
      this.data.gift = { date: today(), dan: friends[Math.floor(Math.random() * friends.length)], x: 15 + Math.random() * 70, opened: false };
    } else {
      this.data.gift = { date: today(), dan: null, opened: true };
    }
    this.save();
    return this.data.gift;
  }

  openGift(prizes) {
    const g = this.data.gift;
    if (!g || g.opened) return null;
    g.opened = true;
    const level = this.loveLevel(g.dan);
    const pool = prizes.filter((p) => (p.minLevel || 0) <= level);
    const prize = pool[Math.floor(Math.random() * pool.length)];
    if (prize.stars) this.data.stars += prize.stars;
    if (prize.food) this.data.food += prize.food;
    if (prize.medicine) this.data.medicine += prize.medicine;
    if (prize.decor) this.data.decorations.push({ id: `d${Date.now()}`, type: prize.decor, x: 50, b: 0, placed: false });
    this.save();
    return { ...prize, dan: g.dan };
  }

  hungryFor(dan) {
    return Date.now() - this.pet(dan).lastFed;
  }

  isHungry(dan) {
    return this.hungryFor(dan) > HUNGRY_MS;
  }

  feedPet(dan) {
    this.pet(dan).lastFed = Date.now();
    this.save();
  }

  setSick(dan, sick) {
    this.pet(dan).sick = sick;
    this.save();
  }

  addPoop(x) {
    if (this.data.poops.length >= MAX_POOPS) return null;
    const poop = { id: `p${Date.now()}${Math.floor(Math.random() * 1000)}`, x };
    this.data.poops.push(poop);
    this.save();
    return poop;
  }

  removePoop(id) {
    this.data.poops = this.data.poops.filter((p) => p.id !== id);
    this.save();
  }

  useMedicine() {
    if (this.data.medicine <= 0) return false;
    this.data.medicine--;
    this.save();
    return true;
  }

  addMedicine(n) {
    this.data.medicine += n;
    this.save();
  }

  // 앱을 열 때 지난 시간만큼 똥이 쌓이고, 가끔 한 마리가 아파요 (절대 죽지 않아요)
  careTick() {
    const now = Date.now();
    const hatched = Object.entries(this.data.progress).filter(([, p]) => p >= 2).map(([d]) => Number(d));
    hatched.forEach((d) => this.pet(d));
    // 4시간이 다 차지 않은 시간은 다음 번에 이어서 세요
    const raw = now - this.data.lastVisit;
    const intervals = Math.floor(raw / POOP_EVERY_MS);
    for (let i = 0; i < intervals * hatched.length; i++) {
      if (this.data.poops.length >= MAX_POOPS) break;
      this.data.poops.push({ id: `p${now}${i}`, x: 8 + Math.random() * 84 });
    }
    this.data.lastVisit = raw > 3 * DAY_MS ? now : this.data.lastVisit + intervals * POOP_EVERY_MS;

    const anySick = hatched.some((d) => this.pet(d).sick);
    if (hatched.length && !anySick && now - this.data.lastSickRoll > SICK_ROLL_MS) {
      this.data.lastSickRoll = now;
      const dan = hatched[Math.floor(Math.random() * hatched.length)];
      // 잘 돌보면 2주에 한 번쯤, 하루를 거르거나 어항이 많이 더러우면 더 자주
      let chance = 0.07;
      if (this.hungryFor(dan) > 2 * DAY_MS) chance += 0.3;
      if (this.data.poops.length >= 10) chance += 0.2;
      if (Math.random() < chance) this.pet(dan).sick = true;
    }
    this.save();
  }

  isUnlocked(dan) {
    const i = DAN_ORDER.indexOf(dan);
    return i === 0 || this.data.progress[DAN_ORDER[i - 1]] >= 2;
  }

  // 문제마다 첫 시도 결과만 기록해요
  record(dan, n, ok, ms) {
    const key = `${dan}x${n}`;
    const f = this.data.facts[key] || { ok: 0, miss: 0, ms: 0, last: null };
    if (ok) {
      f.ok++;
      f.ms += Math.min(ms, 30000);
    } else {
      f.miss++;
    }
    // 연달아 빨리 맞힌 횟수. 3번이 되면 복습 목록에서 빠져요.
    f.streak = ok && ms <= FAST_MS ? (f.streak || 0) + 1 : 0;
    f.last = today();
    this.data.facts[key] = f;
    const d = this.day();
    d.solved++;
    if (ok) d.correct++;
    this.save();
  }

  // ---- 오늘의 복습 ----
  // 자주 틀렸거나 오래 걸린 문제 5개. 모자라면 열린 섬에서 오래 안 푼 문제로 채워요.
  reviewFacts(count = 5) {
    const weak = Object.entries(this.data.facts)
      .map(([key, f]) => {
        const [dan, n] = key.split('x').map(Number);
        const tries = f.ok + f.miss;
        const slow = f.ok === 0 || f.ms / f.ok > FAST_MS;
        const score = (f.miss / tries) * 3 + (slow ? 1 : 0) - (f.streak || 0) * 0.8;
        return { dan, n, f, slow, score };
      })
      .filter((e) => (e.f.streak || 0) < 3 && (e.f.miss > 0 || e.slow))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(({ dan, n }) => ({ dan, n }));

    if (weak.length < count) {
      const taken = new Set(weak.map((q) => `${q.dan}x${q.n}`));
      const pool = [];
      for (const [dan, p] of Object.entries(this.data.progress)) {
        if (p < 1) continue;
        for (let n = 2; n <= 9; n++) {
          const key = `${dan}x${n}`;
          if (!taken.has(key)) pool.push({ dan: Number(dan), n, last: this.data.facts[key]?.last || '' });
        }
      }
      pool.sort((a, b) => (a.last < b.last ? -1 : a.last > b.last ? 1 : Math.random() - 0.5));
      weak.push(...pool.slice(0, count - weak.length).map(({ dan, n }) => ({ dan, n })));
    }
    return weak;
  }

  reviewDoneToday() {
    return !!this.day().reviewDone;
  }

  finishReview() {
    this.day().reviewDone = true;
    // 복습을 하면 어항 친구들이 모두 밥을 먹어요
    for (const [dan, p] of Object.entries(this.data.progress)) {
      if (p >= 2) this.pet(dan).lastFed = Date.now();
    }
    this.save();
  }

  addPlayMs(ms) {
    this.day().ms += ms;
    this.save();
  }

  // 게임 한 판을 끝냈어요. 그 단 친구가 "한 판 하자"고 부탁했으면 들어준 거예요
  addGame(dan) {
    this.day().games++;
    if (this.completeRequest('study', dan)) this.addLove(dan, 5, 'request');
    if (dan && dan === this.challengeDan()) {
      const q = this.completeRequest('challenge');
      if (q) this.addLove(q.dan, 5, 'request');
    }
    this.save();
  }

  touchStreak() {
    const s = this.data.streak;
    if (s.last === today()) return;
    s.count = s.last === today(-1) ? s.count + 1 : 1;
    s.last = today();
    this.save();
  }

  useFood() {
    if (this.data.food <= 0) return false;
    this.data.food--;
    this.save();
    return true;
  }

  addFood(n) {
    this.data.food += n;
    this.save();
  }

  // 산 장식은 보관함으로 (placed: false). 꾸미기 모드에서 어항에 놓아요.
  addDecoration(type) {
    this.data.decorations.push({ id: `d${Date.now()}`, type, x: 50, b: 0, placed: false });
    this.save();
  }

  placeDecoration(id, x, b) {
    const d = this.data.decorations.find((it) => it.id === id);
    if (!d) return;
    Object.assign(d, { x, b, placed: true });
    this.save();
  }

  storeDecoration(id) {
    const d = this.data.decorations.find((it) => it.id === id);
    if (!d) return;
    d.placed = false;
    this.save();
  }

  // ---- 큰 선물 (저금통) ----
  ownsBig(id) {
    return (this.data.bigItems || []).includes(id);
  }

  // 먼저 가져야 하는 선물이 있으면 그걸 사야 열려요
  bigUnlocked(item) {
    return !item.requires || this.ownsBig(item.requires);
  }

  setGoal(id) {
    this.data.goal = id;
    this.save();
  }

  buyBig(item) {
    if (this.ownsBig(item.id) || !this.bigUnlocked(item) || !this.spendStars(item.cost)) return false;
    this.data.bigItems = [...(this.data.bigItems || []), item.id];
    if (item.kind === 'tank') this.data.tankLevel = Math.max(this.data.tankLevel || 0, item.level);
    if (this.data.goal === item.id) this.data.goal = null;
    this.save();
    return true;
  }

  // 기념사진은 30장까지 (넘으면 가장 오래된 사진부터 빠져요)
  addPhoto(photo) {
    this.data.photos = [photo, ...(this.data.photos || [])].slice(0, 30);
    this.save();
  }

  removePhoto(id) {
    this.data.photos = (this.data.photos || []).filter((ph) => ph.id !== id);
    this.save();
  }

  setOption(name, value) {
    this.data[name] = value;
    this.save();
  }

  reset() {
    this.data = freshSave();
    this.save();
  }

  // ---- 진행 기록 옮기기 (주소가 바뀌어도 이어서 하게) ----
  exportCode() {
    const json = JSON.stringify(this.data);
    return `GUGU1:${btoa(unescape(encodeURIComponent(json)))}`;
  }

  // 옮기기 코드를 넣으면 그 기록으로 바꿔요. 잘못된 코드면 false
  importCode(code) {
    try {
      const raw = code.trim().replace(/^GUGU1:/, '');
      const parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (parsed.version !== 2 || !parsed.progress) return false;
      const base = freshSave();
      this.data = renameGuests({ ...base, ...parsed, progress: { ...base.progress, ...parsed.progress } });
      this.save();
      return true;
    } catch {
      return false;
    }
  }
}

export const store = new Store();
