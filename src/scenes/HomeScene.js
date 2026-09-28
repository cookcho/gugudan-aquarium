// 홈 = 내 어항. 키운 친구들이 헤엄치고, 뽀글이가 오늘 할 일을 하나 추천해요.
import { store } from '../core/store.js';
import { h, topbar, toast, floatUp, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { CHARACTERS, DAN_ORDER } from '../data/characters.js';
import { charSVG, guideSVG } from '../graphics/characters.js';
import { createFoodSVG, createFoodCanSVG, createPoopSVG } from '../graphics/food.js';
import { openDecorShop, openDex, openRequests, hearts, openCard } from './overlays.js';
import { REQUESTS, LOVE_PERKS, ANNIVERSARIES, GIFT_PRIZES, josa, hasBatchim } from '../data/care.js';
import confetti from 'canvas-confetti';
import { decorSVG, SHOP_ITEMS } from '../data/shop.js';
import { Swimmer, PROFILES } from '../core/swim.js';
import { GuestManager } from './guests.js';

// 장식이 놓일 수 있는 높이 (어항 바닥에서 %)
const MIN_B = 2;
const MAX_B = 70;
const isFloating = (type) => SHOP_ITEMS.find((it) => it.type === type)?.float;
const CLEAN_COST = 3;

// 돌봐야 할 일이 있으면 게임 추천보다 먼저 알려줘요
function careMessage() {
  const hatched = DAN_ORDER.filter((d) => store.data.progress[d] >= 2);
  const sick = hatched.find((d) => store.pet(d).sick);
  if (sick) return `${josa(store.petName(sick), '이가', '가')} 아파요! 눌러서 💊 약을 줄까?`;
  const hungry = hatched.find((d) => store.isHungry(d));
  const canReview = store.reviewFacts(1).length > 0 && !store.reviewDoneToday();
  if (hungry && canReview) return `친구들이 배고파해요! 오늘의 복습을 풀면 모두 밥을 먹어요`;
  if (hungry) return `${josa(store.petName(hungry), '이가', '가')} 배고파해요. 밥을 줄까?`;
  if (store.requestsReady()) return '부탁을 모두 들어줬어요! 📋 눌러서 도장 받자';
  const req = store.ensureRequests();
  if (req && !req.rewarded && req.list.some((q) => !q.done)) return '친구들이 부탁이 있대요! 머리 위 그림을 봐요 📋';
  if (canReview) return '오늘의 복습 5문제 풀어 볼까? 📅';
  if (store.data.poops.length >= 6) return '어항이 더러워졌어요. 청소해 줄까?';
  return null;
}

export function recommend() {
  if (store.day().games >= 3) {
    return { dan: null, text: '오늘 벌써 세 판이나 했어! 이제 친구들이랑 놀자 🐠' };
  }
  for (const dan of DAN_ORDER) {
    if (!store.isUnlocked(dan)) break;
    const p = store.data.progress[dan];
    if (p === 0) return { dan, text: `오늘은 ${dan}단 섬에서 노래부터 들어볼까?` };
    if (p === 1) return { dan, text: `${dan}단 알이 곧 깨어날 것 같아! 섞어 풀기 해볼까?` };
    if (p === 2) return { dan, text: `${dan}단 친구를 키워 볼까? 조개 숫자판에 도전!` };
    if (p === 3) return { dan, text: `${dan}단 상어 보스전! 이기면 황금 친구가 돼요` };
  }
  return { dan: DAN_ORDER[0], text: '모든 친구가 황금이 됐어! 좋아하는 섬에서 더 놀자' };
}

export class HomeScene {
  constructor(app) {
    this.app = app;
    this.fishes = [];
    this.foods = [];
    this.alive = true;
    this.feeding = false;
    this.u = unit();
    store.careTick();
    store.ensureRequests();
    store.rollGift();
    this.bar = topbar(app, { parent: true });
    this.el = h(`
      <div class="scene home theme-${store.data.theme}">
        <div class="aquarium">
          <div class="rays"></div>
          <div class="bubbles"></div>
          <div class="sand"></div>
          <div class="decor-layer"></div>
          <div class="poop-layer"></div>
          <div class="gift-layer"></div>
          <div class="murk"></div>
          <div class="algae"></div>
          <div class="tank"></div>
          <div class="food-layer"></div>
          <div class="guide-wrap">
            <div class="guide bob" data-act="guide">${guideSVG(Math.round(this.u * 10))}</div>
            <div class="speech"></div>
          </div>
        </div>
        <div class="stand">
        <div class="dock">
          <div class="dock-side">
            <button class="btn btn-foam" data-act="decor">🪸 꾸미기</button>
            <button class="btn btn-foam" data-act="dex">📖 도감</button>
            <button class="btn btn-foam" data-act="ball">⚽ 공놀이</button>
          </div>
          <button class="btn btn-coral btn-big" data-act="go">🗺️ 모험 떠나기</button>
          <div class="dock-side end">
            <button class="btn btn-foam" data-act="feed">${createFoodCanSVG(Math.round(this.u * 3))} 밥주기 <span class="feed-n">${store.data.food}</span></button>
            <button class="btn btn-foam" data-act="clean">🧽 청소 <small>⭐${CLEAN_COST}</small></button>
          </div>
        </div>
        <div class="decor-tray" hidden>
          <button class="btn btn-star" data-act="shop">🛒 상점</button>
          <div class="tray-items"></div>
          <button class="btn btn-weed" data-act="decor-done">✓ 다 했어요</button>
        </div>
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.addReviewButton();
    this.addRequestButton();
    this.tank = this.el.querySelector('.tank');
    this.aquarium = this.el.querySelector('.aquarium');
    this.foodLayer = this.el.querySelector('.food-layer');
    this.rec = recommend();
    this.say(careMessage() || this.rec.text);
    this.makeBubbles();
    this.renderDecor();
    this.buildAlgae();
    this.renderPoops();
    this.renderGift();
    this.bind();
  }

  mounted() {
    this.spawnFishes();
    this.guests = new GuestManager(this);
    // 한 프레임에서 오류가 나도 다음 프레임은 계속 그려요 (어항이 통째로 멈추지 않게)
    const loop = () => {
      try {
        this.step();
      } catch (err) {
        console.error('어항 움직임 오류:', err);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    setTimeout(() => this.alive && this.checkAnniversary(), 1200);
    // 켜 둔 동안에도 배고픔이 생기고 똥이 쌓이도록 가끔 확인해요
    this.careTimer = setInterval(() => {
      store.careTick();
      this.renderPoops();
      this.refreshStatus();
    }, 30000);
  }

  // 상단 바의 "오늘의 복습" 버튼. 안 했으면 빨간 점, 하면 ✓
  addReviewButton() {
    if (store.reviewFacts(1).length === 0) return; // 아직 푼 문제가 없으면 숨겨요
    const done = store.reviewDoneToday();
    const btn = h(`<button class="pill review-pill ${done ? 'done' : 'pending'}" data-act="review">📅 오늘의 복습 ${done ? '✓' : '<i class="dot"></i>'}</button>`);
    this.bar.el.querySelector('.group').appendChild(btn);
  }

  // 상단 바의 "오늘의 부탁" 버튼
  addRequestButton() {
    const btn = h('<button class="pill req-pill" data-act="requests"></button>');
    this.bar.el.querySelector('.group').appendChild(btn);
    this.updateRequestPill();
  }

  updateRequestPill() {
    const btn = this.bar.el.querySelector('.req-pill');
    const r = store.data.requests;
    if (!btn) return;
    btn.hidden = !r;
    if (!r) return;
    const done = r.list.filter((q) => q.done).length;
    btn.className = `pill req-pill ${store.requestsReady() ? 'ready' : ''} ${r.rewarded ? 'done' : ''}`;
    btn.innerHTML = r.rewarded ? '📋 부탁 ✓' : store.requestsReady() ? '🎁 도장 받기!' : `📋 부탁 ${done}/${r.list.length}`;
  }

  // 부탁을 들어줬을 때
  requestDone(q) {
    if (!q) return;
    const name = store.petName(q.dan);
    sound.playStar();
    toast(`${josa(name, '이의', '의')} 부탁을 들어줬어요! 💗`);
    const f = this.fishes.find((x) => x.dan === q.dan);
    this.giveLove(q.dan, 5, 'request', f);
    this.updateRequestPill();
    this.refreshStatus();
    if (store.requestsReady()) setTimeout(() => this.alive && this.say('부탁을 모두 들어줬어요! 📋 눌러서 도장 받자'), 1500);
  }

  // 친밀도 올리기 + 단계가 오르면 축하
  giveLove(dan, amount, kind, f) {
    const res = store.addLove(dan, amount, kind);
    if (!res.levelUp) return;
    const name = store.petName(dan);
    sound.playFanfare();
    const r = this.el.getBoundingClientRect();
    const fx = f ? (this.bounds.left - r.left + f.x + f.size / 2) / r.width : 0.5;
    const fy = f ? (this.bounds.top - r.top + f.y) / r.height : 0.4;
    confetti({ particleCount: 70, spread: 70, origin: { x: fx, y: fy }, zIndex: 300 });
    this.say(`${josa(name, '과', '와')} 더 친해졌어요! ${hearts(res.level)} ${LOVE_PERKS[res.level]}`);
    this.celebratingUntil = performance.now() + 3000; // 축하 말이 다른 말에 덮이지 않게
    if (f) this.showInfo(f);
  }

  // 친구 이름표: 이름 + 하트 + 만난 날
  showInfo(f) {
    f.info.innerHTML = `<b>${store.petName(f.dan)}</b> ${hearts(store.loveLevel(f.dan))}<small>만난 지 ${store.daysTogether(f.dan)}일</small><span class="info-card">🪪 카드 보기</span>`;
    f.info.hidden = false;
    f.infoUntil = performance.now() + 4000;
  }

  // 만난 지 7·30·50·100일 기념 파티
  checkAnniversary() {
    for (const dan of store.hatchedDans()) {
      const days = store.daysTogether(dan);
      const pet = store.pet(dan);
      if (!ANNIVERSARIES.includes(days) || pet.celebrated.includes(days)) continue;
      pet.celebrated.push(days);
      store.addStars(10);
      sound.playFanfare();
      confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 }, zIndex: 300 });
      this.say(`오늘은 ${josa(store.petName(dan), '을', '를')} 만난 지 ${days}일! 🎉 별 10개 선물!`);
      return;
    }
  }

  // 깜짝 선물: 친한 친구가 모래에서 찾아온 보물
  renderGift() {
    const layer = this.el.querySelector('.gift-layer');
    const g = store.data.gift;
    layer.innerHTML = g && !g.opened && g.dan ? `<button class="gift" data-act="gift" style="left:${g.x}%" aria-label="선물">🎁</button>` : '';
  }

  openGift() {
    const prize = store.openGift(GIFT_PRIZES);
    if (!prize) return;
    sound.playFanfare();
    const name = store.petName(prize.dan);
    const btn = this.el.querySelector('.gift');
    const r = btn.getBoundingClientRect();
    confetti({ particleCount: 60, spread: 60, origin: { x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight }, zIndex: 300 });
    this.say(`${josa(name, '이가', '가')} 모래에서 ${josa(prize.label, '을', '를')} 찾아왔어요!${prize.decor ? ' 보관함에 넣었어요' : ''}`);
    this.renderGift();
    this.el.querySelector('.feed-n').textContent = store.data.food;
  }

  // ---- 공놀이 ----
  toggleBall() {
    if (this.ball) {
      this.ball.el.remove();
      this.ball = null;
      this.el.querySelector('[data-act="ball"]').classList.remove('active');
      return;
    }
    if (this.feeding) this.toggleFeed();
    const r = Math.round(this.u * 2.6);
    const el = h(`<div class="ball" style="width:${r * 2}px;height:${r * 2}px"></div>`);
    this.tank.appendChild(el);
    this.ball = { el, r, x: this.bounds.width / 2, y: this.u * 4, vx: (Math.random() - 0.5) * 3, vy: 0, idle: 0 };
    this.el.querySelector('[data-act="ball"]').classList.add('active');
    this.say('공을 끌어서 던져 봐! 친구들이 튕기며 놀아요 ⚽');
    el.addEventListener('pointerdown', (e) => this.grabBall(e));
  }

  grabBall(e) {
    e.stopPropagation();
    const b = this.ball;
    if (!b) return;
    b.held = true;
    let last = { x: e.clientX, y: e.clientY, t: performance.now() };
    const move = (ev) => {
      const now = performance.now();
      const dt = Math.max(8, now - last.t);
      b.x = ev.clientX - this.bounds.left;
      b.y = ev.clientY - this.bounds.top;
      b.vx = ((ev.clientX - last.x) / dt) * 16;
      b.vy = ((ev.clientY - last.y) / dt) * 16;
      last = { x: ev.clientX, y: ev.clientY, t: now };
    };
    const up = () => {
      b.held = false;
      b.idle = 0;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  stepBall(dt, W, H) {
    const b = this.ball;
    if (!b) return;
    if (!b.held) {
      b.vy += 0.12; // 물속이라 천천히 가라앉아요
      b.vx *= 0.992;
      b.vy *= 0.992;
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.8; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.8; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.6; }
      if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.5; }
      b.idle += dt;
      if (b.idle > 40) return this.toggleBall(); // 40초 동안 안 놀면 치워요
    }
    b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) rotate(${b.x * 2}deg)`;
  }

  // 친구가 공에 닿으면 코로 톡 튕겨요
  bumpBall(f, cx, cy) {
    const b = this.ball;
    if (!b || b.held || (f.bumpCd || 0) > performance.now()) return;
    const d = Math.hypot(b.x - cx, b.y - cy);
    if (d > f.size * 0.42 + b.r) return;
    f.bumpCd = performance.now() + 900;
    const nx = (b.x - cx) / (d || 1);
    const ny = (b.y - cy) / (d || 1);
    b.vx = nx * 5 + f.sw.vx;
    b.vy = ny * 4 - 3.5;
    b.idle = 0;
    f.sw.squash = 0.8;
    sound.playPop();
    floatUp(this.tank, cx, f.y, '💖');
    this.giveLove(f.dan, 2, 'play', f);
    this.requestDone(store.completeRequest('play', f.dan));
  }

  // ---- 쓰다듬기: 누르고 문지르면 쓰다듬기, 톡 누르면 말 걸기 ----
  startTouch(f, e) {
    if (this.cleaning) return;
    e.stopPropagation();
    if (!f.sw || f.sick) {
      this.touchFish(f);
      return;
    }
    let dist = 0;
    let rubbed = 0;
    let petted = false;
    let last = { x: e.clientX, y: e.clientY, t: performance.now() };
    f.sw.held = true;
    const move = (ev) => {
      const now = performance.now();
      const d = Math.hypot(ev.clientX - last.x, ev.clientY - last.y);
      const speed = d / Math.max(1, now - last.t);
      last = { x: ev.clientX, y: ev.clientY, t: now };
      dist += d;
      rubbed += d;
      if (dist > 24 && rubbed > 80) {
        rubbed = 0;
        petted = true;
        this.strokeTick(f, speed > 1.6);
      }
    };
    const up = () => {
      f.sw.held = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (dist < 12) this.touchFish(f);
      else if (petted && !(performance.now() < this.celebratingUntil)) this.say(`${store.petName(f.dan)}: "${f.tickled ? '히히, 간지러웠어!' : '기분 좋아~ 또 해 줘!'}"`);
      f.tickled = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  strokeTick(f, fast) {
    const cx = f.x + f.size / 2;
    if (fast) {
      f.tickled = true;
      f.sw.squash = 1;
      f.sw.spin = 0.15;
      floatUp(this.tank, cx, f.y, '😆');
    } else {
      floatUp(this.tank, cx + (Math.random() - 0.5) * f.size * 0.5, f.y, '💕');
    }
    this.giveLove(f.dan, 1, 'pet', f);
    this.requestDone(store.completeRequest('pet', f.dan));
  }

  // 말풍선은 3초 보여주고 사라져요. 뽀글이를 누르면 다시 볼 수 있어요.
  say(text) {
    const sp = this.el.querySelector('.speech');
    sp.textContent = text;
    sp.classList.remove('pop', 'out');
    void sp.offsetWidth;
    sp.classList.add('pop');
    clearTimeout(this.speechTimer);
    this.speechTimer = setTimeout(() => sp.classList.add('out'), 3000);
  }

  makeBubbles() {
    const box = this.el.querySelector('.bubbles');
    for (let i = 0; i < 14; i++) {
      const s = 8 + Math.random() * 18;
      box.appendChild(h(`<i style="width:${s}px;height:${s}px;left:${Math.random() * 96}%;animation-duration:${5 + Math.random() * 6}s;animation-delay:${-Math.random() * 8}s"></i>`));
    }
  }

  renderDecor() {
    const layer = this.el.querySelector('.decor-layer');
    layer.innerHTML = '';
    for (const d of store.data.decorations.filter((it) => it.placed)) {
      const item = h(`<div class="decor${isFloating(d.type) ? ' floating' : ''}" data-type="${d.type}" style="left:${d.x}%;bottom:${Math.max(MIN_B, d.b)}%">${decorSVG(d.type, this.u)}</div>`);
      item.addEventListener('pointerdown', (e) => {
        if (!this.decorating) return;
        e.stopPropagation();
        this.drag(e, item, d.id);
      });
      layer.appendChild(item);
    }
  }

  renderTray() {
    const box = this.el.querySelector('.tray-items');
    const stored = store.data.decorations.filter((it) => !it.placed);
    box.innerHTML = stored.length
      ? stored.map((d) => `<div class="tray-item" data-id="${d.id}">${decorSVG(d.type, this.u * 0.55)}</div>`).join('')
      : '<span class="tray-empty">보관함이 비었어요. 상점에서 장식을 사 보세요</span>';
    box.querySelectorAll('.tray-item').forEach((el) => {
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const d = store.data.decorations.find((it) => it.id === el.dataset.id);
        const ghost = h(`<div class="decor dragging" style="left:-999px">${decorSVG(d.type, this.u)}</div>`);
        this.el.querySelector('.decor-layer').appendChild(ghost);
        this.drag(e, ghost, d.id, true);
      });
    });
  }

  // 장식 끌기. 보관함 위에 놓으면 보관함으로, 어항 위에 놓으면 그 자리에.
  // 보관함 아이템을 끌지 않고 톡 누르기만 하면 어항 가운데에 놓아요.
  drag(e, item, id, fromTray = false) {
    const rect = this.aquarium.getBoundingClientRect();
    const tray = this.el.querySelector('.decor-tray');
    const start = { x: e.clientX, y: e.clientY };
    let moved = false;
    let pos = { x: 50, b: 30 };
    item.classList.add('dragging');
    sound.playPop();

    const place = (cx, cy) => {
      const hPct = (item.offsetHeight / rect.height) * 100;
      pos = {
        x: Math.max(4, Math.min(96, ((cx - rect.left) / rect.width) * 100)),
        b: Math.max(MIN_B, Math.min(MAX_B, ((rect.bottom - cy) / rect.height) * 100 - hPct / 2))
      };
      item.style.left = `${pos.x}%`;
      item.style.bottom = `${pos.b}%`;
    };
    if (fromTray) place(e.clientX, e.clientY);
    const isOver = (ev) => {
      const r = tray.getBoundingClientRect();
      return ev.clientY >= r.top && ev.clientY <= r.bottom + 20;
    };

    const move = (ev) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 8) moved = true;
      place(ev.clientX, ev.clientY);
      tray.classList.toggle('drop-here', isOver(ev));
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      tray.classList.remove('drop-here');
      const overTray = isOver(ev);
      if (fromTray && !moved) {
        const d = store.data.decorations.find((it) => it.id === id);
        store.placeDecoration(id, 50, isFloating(d.type) ? 50 : 30);
        sound.playStar();
      } else if (overTray) {
        store.storeDecoration(id);
        if (!fromTray) toast('보관함에 넣었어요');
      } else {
        store.placeDecoration(id, pos.x, pos.b);
        sound.playStar();
        if (moved) this.requestDone(store.completeRequest('decor'));
      }
      this.renderDecor();
      this.renderTray();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  enterDecor() {
    this.decorating = true;
    if (this.feeding) this.toggleFeed();
    if (this.cleaning) this.stopCleaning();
    this.el.classList.add('decorating');
    this.el.querySelector('.dock').hidden = true;
    this.el.querySelector('.decor-tray').hidden = false;
    this.renderTray();
    toast('아래 보관함에서 꺼내 원하는 곳에 놓아요. 보관함으로 끌어다 넣을 수도 있어요');
  }

  exitDecor() {
    this.decorating = false;
    this.el.classList.remove('decorating');
    this.el.querySelector('.dock').hidden = false;
    this.el.querySelector('.decor-tray').hidden = true;
    this.say('어항이 예뻐졌어! ✨');
  }

  // ---- 유리에 끼는 이끼: 가장자리와 모서리부터 초록 얼룩이 번져요 ----
  buildAlgae() {
    let seed = 7; // 늘 같은 모양으로 끼도록 고정된 난수
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const greens = ['#5E8C3A', '#6F9E45', '#4F7A30', '#7FA84E', '#8BAE5A'];
    let soft = '';
    let specks = '';
    for (let i = 0; i < 46; i++) {
      const side = rnd();
      const along = rnd();
      const inward = Math.pow(rnd(), 2.2); // 가장자리에 많이, 안쪽은 드문드문
      let x;
      let y;
      if (side < 0.4) { x = along * 1000; y = 700 - inward * 260; } // 아래
      else if (side < 0.6) { x = inward * 220; y = along * 700; } // 왼쪽
      else if (side < 0.8) { x = 1000 - inward * 220; y = along * 700; } // 오른쪽
      else { x = along * 1000; y = inward * 160; } // 위
      const color = greens[Math.floor(rnd() * greens.length)];
      soft += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(18 + rnd() * 55).toFixed(0)}" ry="${(14 + rnd() * 40).toFixed(0)}" fill="${color}" opacity="${(0.25 + rnd() * 0.35).toFixed(2)}"/>`;
      if (i % 2 === 0) specks += `<circle cx="${(x + (rnd() - 0.5) * 60).toFixed(0)}" cy="${(y + (rnd() - 0.5) * 50).toFixed(0)}" r="${(2 + rnd() * 5).toFixed(1)}" fill="${color}" opacity=".7"/>`;
    }
    this.el.querySelector('.algae').innerHTML = `
      <svg viewBox="0 0 1000 700" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
        <defs><filter id="algaeBlur"><feGaussianBlur stdDeviation="9"/></filter></defs>
        <rect width="1000" height="700" fill="#6F9E45" opacity=".08"/>
        <g filter="url(#algaeBlur)">${soft}</g>
        <g>${specks}</g>
      </svg>`;
  }

  // 똥이 3개부터 이끼가 끼기 시작해서, 많을수록 진해져요. 청소하면 다시 맑아져요.
  updateDirt() {
    const n = store.data.poops.length;
    this.el.querySelector('.algae').style.opacity = Math.max(0, Math.min(1, (n - 2) / 9));
    this.el.querySelector('.murk').style.opacity = Math.min(0.25, n * 0.02);
  }

  // ---- 똥과 청소 ----
  renderPoops() {
    const layer = this.el.querySelector('.poop-layer');
    layer.innerHTML = store.data.poops.map((p) => {
      const lift = (parseInt(p.id.slice(-2), 10) || 0) % 4;
      return `<div class="poop" data-id="${p.id}" style="left:${p.x}%;bottom:${3 + lift * 1.5}%">${createPoopSVG(Math.round(this.u * 3.2))}</div>`;
    }).join('');
    this.updateDirt();
  }

  dropPoop(f) {
    if (!this.alive || f.p < 2) return;
    const x = Math.max(4, Math.min(96, ((f.x + f.size / 2) / this.bounds.width) * 100));
    const poop = store.addPoop(x);
    if (!poop) return;
    const top = f.y + f.size * 0.8 + this.u * 8;
    this.el.querySelector('.poop-layer').appendChild(
      h(`<div class="poop falling" style="left:${x}%;top:${top}px">${createPoopSVG(Math.round(this.u * 3.2))}</div>`)
    );
    setTimeout(() => this.alive && this.renderPoops(), 1600);
  }

  startCleaning() {
    if (this.cleaning) return this.stopCleaning();
    if (store.data.poops.length === 0) {
      toast('어항이 벌써 반짝반짝해요 ✨');
      return;
    }
    if (!store.spendStars(CLEAN_COST)) {
      sound.playBoing();
      toast(`청소하려면 별 ${CLEAN_COST}개가 필요해요. 구구단 모험에서 모아요 ⭐`);
      return;
    }
    if (this.feeding) this.toggleFeed();
    this.cleaning = true;
    this.el.classList.add('cleaning');
    this.el.querySelector('[data-act="clean"]').classList.add('active');
    this.say('스펀지로 똥을 문질러서 치워요! 🧽');
  }

  stopCleaning() {
    this.cleaning = false;
    this.el.classList.remove('cleaning');
    this.el.querySelector('[data-act="clean"]').classList.remove('active');
  }

  // 손가락이 지나간 자리의 똥을 치워요
  wipeAt(x, y) {
    const hit = document.elementFromPoint(x, y)?.closest('.poop:not(.falling)');
    if (!hit) return;
    sound.playPop();
    store.removePoop(hit.dataset.id);
    const rect = this.el.getBoundingClientRect();
    floatUp(this.el, x - rect.left, y - rect.top, '✨');
    hit.remove();
    this.updateDirt();
    if (store.data.poops.length === 0) {
      this.stopCleaning();
      sound.playFanfare();
      this.say('반짝반짝 깨끗해졌어요! 친구들이 좋아해요 💖');
      this.el.querySelector('[data-act="clean"]').classList.remove('hint-pulse');
      this.requestDone(store.completeRequest('clean'));
      for (const f of this.fishes) if (f.p >= 2) floatUp(this.tank, f.x + f.size / 2, f.y, '💖');
    }
  }

  // ---- 배고픔, 아픔 표시 ----
  refreshStatus() {
    for (const f of this.fishes) {
      if (f.p < 2) continue;
      f.sick = store.pet(f.dan).sick;
      f.hungry = store.isHungry(f.dan);
      const req = store.pendingRequest(f.dan);
      f.el.classList.toggle('sick', f.sick);
      f.badge.hidden = !(f.sick || f.hungry || req);
      f.badge.textContent = f.sick ? '아파요 🤒' : f.hungry ? '배고파요…' : req ? `${REQUESTS[req.type].icon} 부탁!` : '';
      f.badge.classList.toggle('sick', f.sick);
      f.badge.classList.toggle('req', !f.sick && !f.hungry && !!req);
    }
  }

  spawnFishes() {
    const rect = this.tank.getBoundingClientRect();
    this.bounds = rect;
    // 바닥에서 쉬는 친구는 모래 위에 앉아요
    const aq = this.aquarium.getBoundingClientRect();
    this.swimH = aq.bottom - rect.top - aq.height * 0.05;
    for (const dan of DAN_ORDER) {
      const p = store.data.progress[dan];
      if (p === 0) continue;
      // 아기는 작게, 성장·황금은 크게
      const size = Math.round(this.u * [0, 11, 10, 12.5, 14][p]);
      const el = h(`<div class="fish ${p === 1 ? 'egg' : ''}" style="--wag:${PROFILES[dan].wag}s">${charSVG(dan, p, size)}</div>`);
      const x = 40 + Math.random() * (rect.width - size - 80);
      const y = p === 1 ? this.swimH - size * 0.9 : 40 + Math.random() * (this.swimH - size * 2);
      const f = { dan, p, el, size, x, y, sw: p === 1 ? null : new Swimmer(dan, x, y, size) };
      el.addEventListener('pointerdown', (e) => this.startTouch(f, e));
      f.badge = h('<div class="fish-badge" hidden></div>');
      f.info = h('<div class="fish-info" hidden></div>');
      // 이름표를 누르면 네임카드가 펼쳐져요
      f.info.addEventListener('pointerdown', (e) => e.stopPropagation());
      f.info.addEventListener('click', () => {
        f.info.hidden = true;
        openCard(f.dan);
      });
      this.tank.appendChild(el);
      this.tank.appendChild(f.badge);
      this.tank.appendChild(f.info);
      this.fishes.push(f);
    }
    this.lastT = performance.now();
    this.refreshStatus();
  }

  touchFish(f) {
    sound.playPop();
    const c = { ...CHARACTERS[f.dan], name: store.petName(f.dan) };
    if (f.p === 1) {
      this.say(`${c.name}의 알이에요. ${f.dan}단 섞어 풀기를 하면 깨어나요!`);
      f.el.classList.remove('shake');
      void f.el.offsetWidth;
      f.el.classList.add('shake');
      return;
    }
    if (f.sick) {
      if (store.useMedicine()) {
        store.setSick(f.dan, false);
        sound.playFanfare();
        this.say(`${c.name}: "다 나았어! 고마워!" 💖`);
        for (let i = 0; i < 4; i++) setTimeout(() => floatUp(this.tank, f.x + f.size / 2, f.y, i % 2 ? '💖' : '✨'), i * 150);
        this.refreshStatus();
      } else {
        sound.playBoing();
        this.say(`${c.name}가 아파요… 상점에서 💊 약을 사 주세요`);
        openDecorShop(() => this.afterShop(), 'care');
      }
      return;
    }
    this.showInfo(f);
    if (f.hungry) {
      this.say(`${c.name}: "배고파요… 밥 주세요!"`);
      if (!this.feeding) this.toggleFeed();
      return;
    }
    const req = store.pendingRequest(f.dan);
    if (req) {
      this.say(REQUESTS[req.type].text(c.name));
      if (req.type === 'feed' && !this.feeding) this.toggleFeed();
      if (req.type === 'play' && !this.ball) this.toggleBall();
      if (req.type === 'clean') this.el.querySelector('[data-act="clean"]').classList.add('hint-pulse');
      return;
    }
    // 친해질수록 반응이 늘어요
    const level = store.loveLevel(f.dan);
    const kid = store.data.kidName;
    if (level >= 4 && kid) {
      this.say(`${c.name}: "${kid}${hasBatchim(kid) ? '아' : '야'}, 사랑해! 💖"`);
      f.sw.dance = 2.5;
    } else if (level >= 3) {
      this.say(`${c.name}: "신난다~ 같이 춤추자!"`);
      f.sw.dance = 2.5;
    } else if (level >= 2) {
      this.say(`${c.name}: "재주넘기 보여 줄게!"`);
      f.sw.spin = 2;
      f.sw.vy = -3;
    } else {
      this.say(level >= 1 ? `${c.name}: "안녕! 반가워 👋"` : `${c.name}: "${c.line}"`);
      f.sw.spin = 1;
      f.sw.vy = -2;
    }
    floatUp(this.tank, f.x + f.size / 2, f.y, '💖');
  }

  bind() {
    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      sound.playPop();
      if (act === 'go') this.app.go('map', { dan: this.rec.dan });
      if (act === 'guide') this.say(careMessage() || this.rec.text);
      if (act === 'review') this.app.go('review');
      if (act === 'dex') openDex();
      if (act === 'decor') this.enterDecor();
      if (act === 'decor-done') this.exitDecor();
      if (act === 'shop') openDecorShop(() => this.afterShop());
      if (act === 'feed') this.toggleFeed();
      if (act === 'clean') this.startCleaning();
      if (act === 'ball') this.toggleBall();
      if (act === 'requests') openRequests(() => {
        this.updateRequestPill();
        this.say(careMessage() || this.rec.text);
      });
      if (act === 'gift') this.openGift();
    });

    // 청소: 누르거나 문지르는 곳의 똥을 치워요
    this.el.addEventListener('pointerdown', (e) => {
      if (!this.cleaning || e.target.closest('button, .topbar')) return;
      this.wiping = true;
      this.wipeAt(e.clientX, e.clientY);
    });
    this.el.addEventListener('pointermove', (e) => {
      if (this.cleaning && this.wiping) this.wipeAt(e.clientX, e.clientY);
    });
    this.endWipe = () => { this.wiping = false; };
    window.addEventListener('pointerup', this.endWipe);

    this.el.addEventListener('pointerdown', (e) => {
      if (this.feeding || this.decorating || this.cleaning || e.target.closest('button, .topbar, .stand, .fish, .fish-info, .guide, .ball, .guest')) return;
      const r = this.tank.getBoundingClientRect();
      this.attention = { x: e.clientX - r.left, y: e.clientY - r.top, until: performance.now() + 2500 };
      const ripple = h(`<div class="ripple" style="left:${this.attention.x}px;top:${this.attention.y}px"></div>`);
      this.tank.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });

    this.el.addEventListener('pointerdown', (e) => {
      if (!this.feeding || this.decorating || this.cleaning || e.target.closest('button, .topbar, .stand, .fish-info, .guide, .ball, .guest')) return;
      const rect = this.tank.getBoundingClientRect();
      if (!store.useFood()) {
        sound.playBoing();
        toast('먹이가 다 떨어졌어요. 상점에서 별로 살 수 있어요');
        this.toggleFeed();
        openDecorShop(() => this.afterShop(), 'care');
        return;
      }
      sound.playPop();
      this.el.querySelector('.feed-n').textContent = store.data.food;
      const el = h(`<div class="food">${createFoodSVG(Math.round(this.u * 3.4))}</div>`);
      this.foodLayer.appendChild(el);
      this.foods.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, el });
    });
  }

  afterShop() {
    this.el.className = this.el.className.replace(/theme-\w+/, `theme-${store.data.theme}`);
    this.renderTray();
    this.el.querySelector('.feed-n').textContent = store.data.food;
  }

  toggleFeed() {
    this.feeding = !this.feeding;
    const b = this.el.querySelector('[data-act="feed"]');
    b.classList.toggle('active', this.feeding);
    if (this.feeding) this.say('어항을 톡톡 누르면 먹이가 떨어져요!');
    else this.say(careMessage() || this.rec.text);
  }

  step() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastT) / 1000);
    this.lastT = now;
    const W = this.bounds.width;
    const H = this.swimH;

    for (let i = this.foods.length - 1; i >= 0; i--) {
      const fd = this.foods[i];
      fd.y += 1.1;
      fd.x += Math.sin(now / 300 + i) * 0.3; // 흔들흔들 가라앉아요
      fd.el.style.transform = `translate(${fd.x}px, ${fd.y}px)`;
      if (fd.y > H - 10) {
        fd.el.remove();
        this.foods.splice(i, 1);
      }
    }
    if (this.attention && now > this.attention.until) this.attention = null;
    this.stepBall(dt, W, H);

    const swimmers = this.fishes.filter((f) => f.sw);
    if (!this.decorPts || now - this.decorAt > 2000) {
      this.decorAt = now;
      this.decorPts = [...this.el.querySelectorAll('.decor-layer .decor')].map((d) => {
        const r = d.getBoundingClientRect();
        return { x: r.left - this.bounds.left + r.width / 2, y: r.top - this.bounds.top };
      });
    }
    const decors = this.decorPts;

    for (const f of this.fishes) {
      if (!f.sw) {
        f.el.style.transform = `translate(${f.x}px, ${f.y}px)`;
        continue;
      }
      const cx = f.x + f.size / 2;
      const cy = f.y + f.size / 2;
      let food = null;
      let best = 420;
      for (const fd of this.foods) {
        const d = Math.hypot(fd.x - cx, fd.y - cy);
        if (d < best) { best = d; food = fd; }
      }
      // 먹이가 없으면 공을 쫓아가요 (배고프거나 아프면 안 놀아요)
      const toy = !food && this.ball && !this.ball.held && !f.hungry && !f.sick && Math.hypot(this.ball.x - cx, this.ball.y - cy) < 520
        ? { x: this.ball.x, y: this.ball.y } : null;
      const near = this.attention && Math.hypot(this.attention.x - cx, this.attention.y - cy) < 380;
      const events = f.sw.update({
        W, H, dt, food: food || toy,
        attention: near && !f.sick ? this.attention : null,
        friends: swimmers.filter((o) => o !== f && !o.sick).map((o) => o.sw),
        decors,
        night: store.data.theme === 'night',
        hungry: f.hungry,
        sick: f.sick
      });
      f.x = f.sw.x;
      f.y = f.sw.y;

      if (food && best < f.size * 0.4) {
        sound.playMunch();
        food.el.remove();
        this.foods = this.foods.filter((fd) => fd !== food);
        f.sw.squash = 0.8;
        floatUp(this.tank, cx, f.y, '😋');
        if (f.hungry && !(performance.now() < this.celebratingUntil)) this.say(`${store.petName(f.dan)}: "냠냠, 배불러요!"`);
        store.feedPet(f.dan);
        this.giveLove(f.dan, 2, 'feed', f);
        this.requestDone(store.completeRequest('feed', f.dan));
        this.refreshStatus();
        if (Math.random() < 0.3) setTimeout(() => this.dropPoop(f), 8000 + Math.random() * 8000);
      }
      if (toy) this.bumpBall(f, f.x + f.size / 2, f.y + f.size / 2);
      for (const ev of events) this.effect(ev, f);

      f.el.style.transform = f.sw.transform();
      if (!f.badge.hidden) f.badge.style.transform = `translate(${cx}px, ${f.y - this.u * 1.5}px) translateX(-50%)`;
      if (!f.info.hidden) {
        if (now > f.infoUntil) f.info.hidden = true;
        else f.info.style.transform = `translate(${cx}px, ${f.y + f.size + this.u * 0.4}px) translateX(-50%)`;
      }
    }
    this.guests?.step(dt, W, H);
  }

  // 행동에 따라 나오는 작은 효과들
  effect(name, f) {
    const mouthX = f.x + f.size * (f.sw.face > 0 ? 0.85 : 0.15);
    const mouthY = f.y + f.size * 0.45;
    if (name === 'bubble') {
      const b = h(`<div class="mini-bubble" style="left:${mouthX}px;top:${mouthY}px"></div>`);
      this.tank.appendChild(b);
      setTimeout(() => b.remove(), 2200);
    } else if (name === 'spout') {
      for (let i = 0; i < 5; i++) {
        const b = h(`<div class="mini-bubble" style="left:${f.x + f.size * 0.6 + (Math.random() - 0.5) * 16}px;top:${f.y + f.size * 0.2}px;animation-delay:${i * 0.12}s"></div>`);
        this.tank.appendChild(b);
        setTimeout(() => b.remove(), 2600);
      }
    } else if (name === 'ink') {
      const ink = h(`<div class="ink-puff" style="left:${f.x + f.size / 2}px;top:${f.y + f.size * 0.7}px"></div>`);
      this.tank.appendChild(ink);
      setTimeout(() => ink.remove(), 1600);
    } else if (name === 'zzz') {
      floatUp(this.tank, f.x + f.size * 0.7, f.y, '💤');
    } else if (name === 'notes') {
      floatUp(this.tank, f.x + f.size / 2, f.y, '🎵');
    }
  }

  destroy() {
    this.alive = false;
    this.guests?.destroy();
    clearInterval(this.careTimer);
    window.removeEventListener('pointerup', this.endWipe);
    cancelAnimationFrame(this.raf);
    this.bar.destroy();
  }
}
