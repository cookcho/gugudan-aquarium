// 홈 = 내 어항. 키운 친구들이 헤엄치고, 뽀글이가 오늘 할 일을 하나 추천해요.
import { store } from '../core/store.js';
import { h, topbar, toast, floatUp, unit, timeOfDay } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { CHARACTERS, DAN_ORDER } from '../data/characters.js';
import { charSVG, guideSVG } from '../graphics/characters.js';
import { createFoodSVG, createFoodCanSVG, createPoopSVG } from '../graphics/food.js';
import { openDecorShop, openDex, openRequests, hearts, openCard, openKidName, openAlbum } from './overlays.js';
import { REQUESTS, LOVE_PERKS, ANNIVERSARIES, GIFT_PRIZES, josa, chatLine, callKid } from '../data/care.js';
import confetti from 'canvas-confetti';
import { decorSVG, SHOP_ITEMS } from '../data/shop.js';
import { bigItemById } from '../data/bigItems.js';
import { tankBackdrop } from '../graphics/tanks.js';
import { legendArt } from '../graphics/legend.js';
import { createTrainSVG } from '../graphics/decorBig.js';
import { SEA2 } from '../data/sea2.js';
import { Swimmer, PROFILES } from '../core/swim.js';
import { GuestManager } from './guests.js';

// 장식이 놓일 수 있는 높이 (어항 바닥에서 %)
const MIN_B = 2;
const MAX_B = 70;
const TIME_INFO = {
  day: { icon: '☀️', label: '낮', say: '지금은 낮이에요! 친구들이 신나게 헤엄쳐요 ☀️' },
  evening: { icon: '🌇', label: '노을 (저녁 7~9시)', say: '노을이 졌어요. 저녁 7시부터 어항이 노을빛이 돼요 🌇' },
  night: { icon: '🌙', label: '밤 (저녁 9시~아침 6시)', say: '밤이에요. 친구들이 졸려해요. 아침 6시에 해가 떠요 🌙' }
};
const POOP_U = 4.8; // 똥 크기 (--u 배수)
// 청소 스포이드: 위는 빨간 고무 꼭지, 아래는 투명한 유리관. 끝(아래 가운데)이 손가락 위치예요
const SIPHON_SVG = `<svg viewBox="0 0 60 170" aria-hidden="true">
  <g class="siphon-bulb"><rect x="12" y="4" width="36" height="46" rx="18" fill="#FF6B6B" stroke="#B83A3A" stroke-width="3"/><ellipse cx="22" cy="18" rx="5" ry="9" fill="#FFB0B0" opacity=".8"/></g>
  <rect x="16" y="44" width="28" height="10" rx="3" fill="#E04848" stroke="#B83A3A" stroke-width="2.5"/>
  <path d="M20 54 H40 V132 L32 166 H28 L20 132 Z" fill="rgba(210, 245, 255, .55)" stroke="#5E9FB8" stroke-width="3" stroke-linejoin="round"/>
  <path d="M25 60 V128" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <circle class="siphon-blob" cx="30" cy="150" r="6" fill="#8B5A2B"/>
</svg>`;
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
  if (store.data.poops.filter((p) => (p.tank ?? 0) === store.viewTank()).length >= 6) return '어항이 더러워졌어요. 청소해 줄까?';
  return null;
}

export function recommend() {
  if (store.day().games >= 3) {
    return { dan: null, text: '오늘 벌써 세 판이나 했어! 이제 친구들이랑 놀자 🐠' };
  }
  // 오늘의 도전 섬을 먼저 추천해요 (별 2배). 쉬운 단만 하지 않도록 덜 자란 섬으로 이끌어요
  const ch = store.challengeDan();
  if (ch) {
    const step = ['노래부터 들어볼까?', '알을 깨워 볼까?', '친구를 키워 볼까?', '상어 보스전에 도전해 볼까?'][store.data.progress[ch]];
    return { dan: ch, text: `🎯 오늘의 도전 섬은 ${ch}단! 별이 2배야. ${step}` };
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
    this.view = store.viewTank(); // 지금 보고 있는 어항 (어항이 여러 개일 때)
    store.careTick();
    store.ensureRequests();
    store.rollGift();
    this.bar = topbar(app, { parent: true });
    this.el = h(`
      <div class="scene home theme-${store.data.theme} time-${timeOfDay()} tank-${store.data.tankLevel || 0}">
        <div class="aquarium">
          <div class="rays"></div>
          <div class="backdrop">${tankBackdrop(store.data.tankLevel || 0)}</div>
          <div class="bubbles"></div>
          <div class="sand"></div>
          <div class="decor-layer"></div>
          <div class="poop-layer"></div>
          <div class="gift-layer"></div>
          <div class="murk"></div>
          <div class="sky-tint"></div>
          <button class="time-badge" data-act="time" aria-label="지금 어항 시간"></button>
          <button class="goal-bar" data-act="goal" hidden></button>
          <div class="tank-nav" hidden></div>
          ${store.sea2Open() || SEA2.some((it) => store.progress2(it.id) >= 1) ? '<button class="island-go" data-act="island">🏝️ 친구들의 섬</button>' : ''}
          <button class="fireworks-btn" data-act="fireworks" hidden aria-label="해파리 불꽃놀이">🎆</button>
          <div class="nameplate" hidden></div>
          <div class="glow-dots">${Array.from({ length: 48 }, () => `<i style="left:${Math.random() * 98}%;top:${3 + Math.random() * 82}%;--s:${(0.35 + Math.random() * 0.75).toFixed(2)};animation-duration:${(1.6 + Math.random() * 2.6).toFixed(1)}s;animation-delay:${-(Math.random() * 4).toFixed(1)}s"></i>`).join('')}</div>
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
            <button class="btn btn-foam" data-act="follow">✨ 따라와</button>
          </div>
          <button class="btn btn-coral btn-big" data-act="go">🗺️ 모험 떠나기${store.challengeDan() ? `<span class="go-badge">🎯 ${store.challengeDan()}단 별 2배</span>` : ''}</button>
          <div class="dock-side end">
            <button class="btn btn-foam" data-act="bubble">🫧 비눗방울</button>
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
    const cam = h('<button class="pill" aria-label="사진 앨범">📸 사진</button>');
    cam.addEventListener('click', () => {
      sound.playPop();
      openAlbum(() => setTimeout(() => this.alive && this.takePhoto(), 250));
    });
    this.bar.el.querySelectorAll('.group')[1].prepend(cam);
    this.tank = this.el.querySelector('.tank');
    this.aquarium = this.el.querySelector('.aquarium');
    this.foodLayer = this.el.querySelector('.food-layer');
    this.rec = recommend();
    this.say(careMessage() || this.guideLine());
    this.makeBubbles();
    this.drawTimeBadge();
    this.renderGoal();
    this.renderMoments();
    this.renderTankNav();
    this.unsubGoal = store.subscribe(() => this.alive && this.renderGoal());
    this.renderDecor();
    this.buildAlgae();
    this.renderPoops();
    this.renderGift();
    this.bind();
  }

  mounted() {
    this.spawnFishes();
    this.spawnLegend();
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
    // 처음 한 번, 뽀글이가 아이 이름을 물어봐요
    if (!store.data.kidName && !store.data.askedName) {
      setTimeout(() => this.alive && openKidName((name) => {
        if (name) this.say(`${callKid(name)}, 반가워! 친구들이랑 같이 놀자 💙`);
      }), 800);
    }
    // 켜 둔 동안에도 배고픔이 생기고 똥이 쌓이도록 가끔 확인해요
    this.careTimer = setInterval(() => {
      store.careTick();
      this.renderPoops();
      this.refreshStatus();
      this.el.className = this.el.className.replace(/time-\w+/, `time-${timeOfDay()}`);
      this.drawTimeBadge();
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
    if (this.blowing) this.toggleBubbles();
    if (this.following) this.toggleFollow();
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

  // ---- 반짝이 따라오기: 어항을 누른 채 움직이면 반짝이 불빛을 친구들이 졸졸 따라와요 ----
  toggleFollow() {
    this.following = !this.following;
    this.el.querySelector('[data-act="follow"]').classList.toggle('active', this.following);
    this.el.classList.toggle('following', this.following);
    if (!this.following) {
      this.followLight?.remove();
      this.followLight = null;
      return;
    }
    if (this.feeding) this.toggleFeed();
    if (this.ball) this.toggleBall();
    if (this.blowing) this.toggleBubbles();
    this.followIdle = 0;
    this.say('어항을 누른 채로 움직여 봐! 친구들이 반짝이를 따라와요 ✨');
  }

  startFollow(e) {
    const r = this.tank.getBoundingClientRect();
    if (!this.followLight) {
      this.followLight = h('<div class="follow-light"></div>');
      this.tank.appendChild(this.followLight);
    }
    const light = this.followLight;
    let lastTrail = 0;
    const at = (ev) => {
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;
      this.attention = { x, y, until: performance.now() + 2500, all: true };
      this.followIdle = 0;
      light.style.transform = `translate(${x}px, ${y}px)`;
      light.classList.add('on');
      const now = performance.now();
      if (now - lastTrail > 45) {
        lastTrail = now;
        const t = h(`<i class="follow-trail" style="left:${x}px;top:${y}px"></i>`);
        this.tank.appendChild(t);
        setTimeout(() => t.remove(), 600);
      }
    };
    at(e);
    const up = () => {
      window.removeEventListener('pointermove', at);
      window.removeEventListener('pointerup', up);
      light.classList.remove('on');
    };
    window.addEventListener('pointermove', at);
    window.addEventListener('pointerup', up);
  }

  // ---- 기념사진: 지금 어항 모습(장식과 친구 위치)을 앨범에 남겨요 ----
  takePhoto() {
    const W = this.bounds.width;
    const H = this.bounds.height;
    const aq = this.aquarium.getBoundingClientRect();
    store.addPhoto({
      id: `ph${Date.now()}`,
      at: Date.now(),
      theme: store.data.theme,
      time: timeOfDay(),
      wu: +(aq.width / this.u).toFixed(1), // 어항 가로 (u 단위)
      ratio: +(aq.height / aq.width).toFixed(3),
      top: +((this.bounds.top - aq.top) / aq.height).toFixed(3), // 친구 영역이 어항에서 시작하는 높이
      tankH: +(H / aq.height).toFixed(3),
      decor: store.data.decorations.filter((d) => d.placed).map(({ type, x, b }) => ({ type, x, b })),
      fish: this.fishes.map((f) => ({ dan: f.dan, p: f.p, x: +(f.x / W).toFixed(3), y: +(f.y / H).toFixed(3), s: +(f.size / W).toFixed(3), flip: (f.sw?.face ?? 1) < 0 })),
      guest: this.guestSnap(W, H)
    });
    const flash = h('<div class="photo-flash"></div>');
    this.el.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
    sound.playShutter();
    toast('찰칵! 📸 앨범에 저장했어요');
  }

  // 놀러 와 있는 손님도 사진에 담아요 (떠나는 중이면 빼요)
  guestSnap(W, H) {
    const gst = this.guests?.guest;
    if (!gst || gst.leaving) return null;
    return { id: gst.g.id, x: +(gst.sw.x / W).toFixed(3), y: +(gst.sw.y / H).toFixed(3), s: +(gst.size / W).toFixed(3), flip: (gst.sw.face ?? 1) < 0 };
  }

  // ---- 비눗방울 놀이: 어항을 누르면 비눗방울이 나오고, 친구들이 쫓아가서 톡 터뜨려요 ----
  toggleBubbles() {
    this.blowing = !this.blowing;
    this.el.querySelector('[data-act="bubble"]').classList.toggle('active', this.blowing);
    if (!this.blowing) return;
    if (this.feeding) this.toggleFeed();
    if (this.ball) this.toggleBall();
    if (this.following) this.toggleFollow();
    this.bubbleIdle = 0;
    this.say('어항을 톡톡 누르면 비눗방울이 나와요! 친구들이 터뜨려요 🫧');
  }

  blowBubbles(x, y) {
    this.playBubbles ??= [];
    this.bubbleIdle = 0;
    sound.playPop();
    for (let i = 0; i < 3 && this.playBubbles.length < 24; i++) {
      const r = Math.round(this.u * (1.2 + Math.random() * 1.4));
      const el = h(`<div class="play-bubble" style="width:${r * 2}px;height:${r * 2}px"></div>`);
      const b = { el, r, x: x + (Math.random() - 0.5) * r * 3, y: y + (Math.random() - 0.5) * r * 2, rise: 0.5 + Math.random() * 0.6, t: Math.random() * 6 };
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.popBubble(b);
      });
      this.tank.appendChild(el);
      this.playBubbles.push(b);
    }
  }

  stepBubbles(dt, W) {
    if (!this.playBubbles?.length) {
      if (this.blowing && (this.bubbleIdle += dt) > 40) this.toggleBubbles(); // 40초 동안 안 놀면 끝나요
      return;
    }
    for (const b of this.playBubbles) {
      b.t += dt;
      b.y -= b.rise;
      b.x = Math.max(b.r, Math.min(W - b.r, b.x + Math.sin(b.t * 2) * 0.4));
      if (b.y < -b.r * 2) this.popBubble(b, true);
      else b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`;
    }
  }

  nearestBubble(cx, cy) {
    let best = null;
    let bestD = 520;
    for (const b of this.playBubbles || []) {
      const d = Math.hypot(b.x - cx, b.y - cy);
      if (d < bestD) { best = b; bestD = d; }
    }
    return best;
  }

  fishPopsBubble(f, b) {
    const cx = f.x + f.size / 2;
    const cy = f.y + f.size / 2;
    if (Math.hypot(b.x - cx, b.y - cy) > f.size * 0.42 + b.r) return;
    f.sw.squash = 0.8;
    this.popBubble(b);
    this.giveLove(f.dan, 1, 'play', f);
  }

  // quiet: 물 위로 올라가서 저절로 사라질 때
  popBubble(b, quiet = false) {
    this.playBubbles = this.playBubbles.filter((x) => x !== b);
    b.el.remove();
    if (quiet) return;
    sound.playPop();
    floatUp(this.tank, b.x, b.y, '✨');
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
  // 뽀글이의 오늘 추천. 이름이 있으면 반쯤은 "선우야, ..." 하고 불러요
  guideLine() {
    const k = callKid(store.data.kidName);
    if (timeOfDay() === 'night' && Math.random() < 0.5) return `${k ? `${k}, ` : ''}밤이 됐어! 친구들이 코 자려고 해 🌙`;
    return k && Math.random() < 0.5 ? `${k}, ${this.rec.text}` : this.rec.text;
  }

  // 어항 구석의 해·노을·달 표시 (실제 시각에 따라 어항이 바뀐다는 걸 알려줘요)
  drawTimeBadge() {
    const info = TIME_INFO[timeOfDay()];
    const b = this.el.querySelector('.time-badge');
    b.textContent = info.icon;
    b.title = info.label;
  }

  // 밤 배경을 골랐거나 실제로 밤이면 친구들이 자주 졸아요
  isNight() {
    return store.data.theme === 'night' || timeOfDay() === 'night';
  }

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
    for (const d of store.data.decorations.filter((it) => it.placed && (it.tank ?? 0) === this.view)) {
      const interactive = SHOP_ITEMS.find((it) => it.type === d.type)?.interactive;
      const item = h(`<div class="decor${isFloating(d.type) ? ' floating' : ''}${interactive ? ' interactive' : ''}" data-type="${d.type}" style="left:${d.x}%;bottom:${Math.max(MIN_B, d.b)}%">${decorSVG(d.type, this.u)}<button class="decor-back" type="button" aria-label="보관함에 넣기">↩</button></div>`);
      item.addEventListener('pointerdown', (e) => {
        if (!this.decorating && interactive && !this.cleaning) {
          e.stopPropagation();
          this.playDecor(d.type, item);
          return;
        }
        if (!this.decorating || e.button !== 0) return;
        e.stopPropagation();
        if (e.target.closest('.decor-back')) return;
        this.drag(e, item, d.id);
      });
      // 꾸미기 중에 ↩ 를 누르면 보관함으로 돌아가요
      item.querySelector('.decor-back').addEventListener('click', (e) => {
        e.stopPropagation();
        store.storeDecoration(d.id);
        sound.playPop();
        this.renderDecor();
        this.renderTray();
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
        if (e.button !== 0) return;
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
      const d = store.data.decorations.find((it) => it.id === id);
      if (fromTray && !moved) {
        store.placeDecoration(id, 50, isFloating(d.type) ? 50 : 30, this.view);
        sound.playStar();
        if (isFloating(d.type)) this.requestDone(store.completeRequest('float'));
      } else if (overTray) {
        store.storeDecoration(id);
        if (!fromTray) toast('보관함에 넣었어요');
      } else {
        store.placeDecoration(id, pos.x, pos.b, this.view);
        sound.playStar();
        if (moved) this.requestDone(store.completeRequest('decor'));
        if (isFloating(d.type)) this.requestDone(store.completeRequest('float'));
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
    toast('보관함에서 꺼내 원하는 곳에 놓아요. 장식의 ↩ 를 누르면 다시 보관함에 들어가요');
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
    const n = this.poopsHere().length;
    this.el.querySelector('.algae').style.opacity = Math.max(0, Math.min(1, (n - 2) / 9));
    this.el.querySelector('.murk').style.opacity = Math.min(0.25, n * 0.02);
  }

  // ---- 똥과 청소 ----
  renderPoops() {
    const layer = this.el.querySelector('.poop-layer');
    layer.innerHTML = this.poopsHere().map((p) => {
      const lift = (parseInt(p.id.slice(-2), 10) || 0) % 4;
      return `<div class="poop" data-id="${p.id}" style="left:${p.x}%;bottom:${3 + lift * 1.5}%">${createPoopSVG(Math.round(this.u * POOP_U))}</div>`;
    }).join('');
    this.updateDirt();
  }

  dropPoop(f) {
    if (!this.alive || f.p < 2) return;
    const x = Math.max(4, Math.min(96, ((f.x + f.size / 2) / this.bounds.width) * 100));
    const poop = store.addPoop(x, this.view);
    if (!poop) return;
    const top = f.y + f.size * 0.8 + this.u * 8;
    this.el.querySelector('.poop-layer').appendChild(
      h(`<div class="poop falling" style="left:${x}%;top:${top}px">${createPoopSVG(Math.round(this.u * POOP_U))}</div>`)
    );
    setTimeout(() => this.alive && this.renderPoops(), 1600);
  }

  startCleaning() {
    if (this.cleaning) return this.stopCleaning();
    if (this.poopsHere().length === 0) {
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
    this.say('스포이드를 똥에 대고 꾹 누르면 쏙 빨아들여요! 🧪');
    // 손가락을 따라다니는 스포이드 (끝이 손가락 위치)
    this.siphon = h(`<div class="siphon">${SIPHON_SVG}</div>`);
    this.el.appendChild(this.siphon);
    const r = this.aquarium.getBoundingClientRect();
    this.moveSiphon(r.left + r.width / 2, r.top + r.height * 0.6);
  }

  moveSiphon(x, y) {
    if (!this.siphon) return;
    const r = this.el.getBoundingClientRect();
    this.siphon.style.left = `${x - r.left}px`;
    this.siphon.style.top = `${y - r.top}px`;
  }

  stopCleaning() {
    this.cleaning = false;
    this.siphon?.remove();
    this.siphon = null;
    this.el.classList.remove('cleaning');
    this.el.querySelector('[data-act="clean"]').classList.remove('active');
  }

  // 손가락이 지나간 자리의 똥을 치워요
  poopsHere() {
    return store.data.poops.filter((p) => (p.tank ?? 0) === this.view);
  }

  // 스포이드 끝 가까이 있는 똥을 쏙 빨아들여요
  wipeAt(x, y) {
    const reach = this.u * 5;
    let hit = null;
    let best = reach;
    for (const el of this.el.querySelectorAll('.poop:not(.falling):not(.sucked)')) {
      const b = el.getBoundingClientRect();
      const d = Math.hypot(b.left + b.width / 2 - x, b.top + b.height / 2 - y);
      if (d < best) { best = d; hit = el; }
    }
    if (!hit) return;
    const b = hit.getBoundingClientRect();
    hit.style.setProperty('--tx', `${x - (b.left + b.width / 2)}px`);
    hit.style.setProperty('--ty', `${y - (b.top + b.height / 2)}px`);
    hit.classList.add('sucked');
    sound.playSlurp();
    if (this.siphon) {
      this.siphon.classList.remove('gulp');
      void this.siphon.offsetWidth;
      this.siphon.classList.add('gulp');
    }
    store.removePoop(hit.dataset.id);
    setTimeout(() => {
      hit.remove();
      if (!this.alive) return;
      const rect = this.el.getBoundingClientRect();
      floatUp(this.el, x - rect.left, y - rect.top, '✨');
      this.updateDirt();
      if (this.poopsHere().length === 0 && this.cleaning) this.cleanDone();
    }, 380);
  }

  cleanDone() {
    this.stopCleaning();
    sound.playFanfare();
    this.say('반짝반짝 깨끗해졌어요! 친구들이 좋아해요 💖');
    this.el.querySelector('[data-act="clean"]').classList.remove('hint-pulse');
    this.requestDone(store.completeRequest('clean'));
    for (const f of this.fishes) if (f.p >= 2) floatUp(this.tank, f.x + f.size / 2, f.y, '💖');
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
      if (p === 0 || store.tankOf(String(dan)) !== this.view) continue;
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
        this.requestDone(store.completeRequest('card', f.dan));
      });
      this.tank.appendChild(el);
      this.tank.appendChild(f.badge);
      this.tank.appendChild(f.info);
      this.fishes.push(f);
    }
    this.lastT = performance.now();
    this.refreshStatus();
  }

  // 도감에서 친구를 다른 어항으로 옮기면 친구들을 다시 불러와요
  respawnFishes() {
    for (const f of this.fishes) {
      f.el.remove();
      f.badge?.remove();
      f.info?.remove();
    }
    this.fishes = [];
    this.spawnFishes();
  }

  // 어항이 여러 개면 ◀ ▶로 넘겨 봐요
  renderTankNav() {
    const count = store.tankCount();
    const nav = this.el.querySelector('.tank-nav');
    const center = this.bar.el.querySelector('.topbar-center');
    nav.hidden = count < 2;
    if (count < 2) {
      center.innerHTML = '';
      return;
    }
    nav.innerHTML = `
      <button class="tank-arrow left" data-act="tank" data-tank="${(this.view + count - 1) % count}" aria-label="이전 어항">◀</button>
      <button class="tank-arrow right" data-act="tank" data-tank="${(this.view + 1) % count}" aria-label="다음 어항">▶</button>`;
    // 상단 가운데 나무 간판: 지금 보는 어항 (누르면 다음 어항으로)
    center.innerHTML = `
      <button class="tank-sign" data-act="tank" data-tank="${(this.view + 1) % count}" aria-label="${this.view + 1}번 어항, 누르면 다음 어항">
        <span class="sign-board"><b>${this.view + 1}번 어항</b><span class="sign-dots">${Array.from({ length: count }, (_, i) => `<i class="${i === this.view ? 'on' : ''}"></i>`).join('')}</span></span>
      </button>`;
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
        openDecorShop((c) => this.afterShop(c), 'care');
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
      this.say(REQUESTS[req.type].text(c.name, req, store.data.kidName));
      if (req.type === 'feed' && !this.feeding) this.toggleFeed();
      if (req.type === 'play' && !this.ball) this.toggleBall();
      if (req.type === 'clean') this.el.querySelector('[data-act="clean"]').classList.add('hint-pulse');
      return;
    }
    // 친해질수록 반응이 늘고, 아이 이름을 더 자주 불러요
    const level = store.loveLevel(f.dan);
    const line = level === 0 ? c.line : chatLine({ kid: store.data.kidName, level, golden: f.p === 4, streak: store.data.streak.count, hour: new Date().getHours() });
    this.say(`${c.name}: "${line}"`);
    if (level >= 3) {
      f.sw.dance = 2.5;
    } else if (level >= 2) {
      f.sw.spin = 2;
      f.sw.vy = -3;
    } else {
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
      if (act === 'guide') this.say(careMessage() || this.guideLine());
      if (act === 'review') this.app.go('review');
      if (act === 'dex') openDex('fish', () => this.respawnFishes());
      if (act === 'decor') this.enterDecor();
      if (act === 'decor-done') this.exitDecor();
      if (act === 'shop') openDecorShop((c) => this.afterShop(c));
      if (act === 'feed') this.toggleFeed();
      if (act === 'clean') this.startCleaning();
      if (act === 'ball') this.toggleBall();
      if (act === 'bubble') this.toggleBubbles();
      if (act === 'follow') this.toggleFollow();
      if (act === 'time') this.say(TIME_INFO[timeOfDay()].say);
      if (act === 'goal') openDecorShop((c) => this.afterShop(c), 'big');
      if (act === 'fireworks') this.fireworks();
      if (act === 'island') this.app.go('island');
      const t = e.target.closest('[data-tank]')?.dataset.tank;
      if (t !== undefined) {
        sound.playWhoosh();
        store.setOption('viewTank', Number(t));
        this.app.go('home');
      }
      if (act === 'requests') openRequests(() => {
        this.updateRequestPill();
        this.say(careMessage() || this.guideLine());
      });
      if (act === 'gift') this.openGift();
    });

    // 청소: 누르거나 문지르는 곳의 똥을 치워요
    this.el.addEventListener('pointerdown', (e) => {
      if (!this.cleaning || e.target.closest('button, .topbar')) return;
      this.wiping = true;
      this.moveSiphon(e.clientX, e.clientY);
      this.wipeAt(e.clientX, e.clientY);
    });
    this.el.addEventListener('pointermove', (e) => {
      if (!this.cleaning) return;
      this.moveSiphon(e.clientX, e.clientY);
      if (this.wiping) this.wipeAt(e.clientX, e.clientY);
    });
    this.endWipe = () => { this.wiping = false; };
    window.addEventListener('pointerup', this.endWipe);

    this.el.addEventListener('pointerdown', (e) => {
      if (this.feeding || this.decorating || this.cleaning || e.target.closest('button, .topbar, .stand, .fish, .fish-info, .guide, .ball, .guest, .play-bubble')) return;
      const r = this.tank.getBoundingClientRect();
      if (this.following) return this.startFollow(e);
      if (this.blowing) return this.blowBubbles(e.clientX - r.left, e.clientY - r.top);
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
        openDecorShop((c) => this.afterShop(c), 'care');
        return;
      }
      sound.playPop();
      this.el.querySelector('.feed-n').textContent = store.data.food;
      const el = h(`<div class="food">${createFoodSVG(Math.round(this.u * 3.4))}</div>`);
      this.foodLayer.appendChild(el);
      this.foods.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, el });
    });
  }

  afterShop(change) {
    this.el.className = this.el.className.replace(/theme-\w+/, `theme-${store.data.theme}`);
    this.renderTray();
    this.el.querySelector('.feed-n').textContent = store.data.food;
    if (change?.big) this.celebrateBig(change.big);
  }

  // 어항 단계에 맞게 받침대와 뒤쪽 배경을 바꿔요
  applyTank() {
    const level = store.data.tankLevel || 0;
    this.el.className = this.el.className.replace(/\btank-\d\b/, `tank-${level}`);
    this.el.querySelector('.backdrop').innerHTML = tankBackdrop(level);
  }

  // ---- 전설의 무지개 잉어: 스페셜로 데려오면 어항에서 가장 크고 화려하게 헤엄쳐요 ----
  spawnLegend() {
    if (this.legend || !store.ownsBig('legend') || this.view !== 0) return;
    const size = Math.round(this.u * 17);
    const el = h(`<div class="legend-fish">${legendArt(size)}</div>`);
    const sw = new Swimmer({ speed: 0.9, zone: 'any', bob: 0.6, rest: 0.1, dash: 0.1, wag: 0.8, tilt: true, visit: 0.1 }, this.bounds.width * 0.5, this.swimH * 0.35, size);
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      sound.playStar();
      const k = callKid(store.data.kidName);
      this.say(`무지개 잉어: "${k ? `${k}, ` : ''}구구단 박사가 됐구나! 정말 자랑스러워 🌈"`);
      sw.spin = 2;
      sw.vy = -3;
      for (let i = 0; i < 5; i++) setTimeout(() => this.alive && floatUp(this.tank, sw.x + size / 2, sw.y, i % 2 ? '🌈' : '✨'), i * 120);
    });
    this.tank.appendChild(el);
    this.legend = { el, sw, size, sparkle: 0 };
  }

  stepLegend(dt, W, H) {
    const lg = this.legend;
    if (!lg) return;
    lg.sw.update({ W, H, dt, food: null, attention: this.attention, friends: [], decors: [], night: false, hungry: false, sick: false });
    lg.el.style.transform = lg.sw.transform();
    lg.sparkle += dt;
    if (lg.sparkle > 0.5) {
      lg.sparkle = 0;
      const t = h(`<i class="legend-trail" style="left:${lg.sw.x + (lg.sw.face < 0 ? lg.size * 0.85 : lg.size * 0.15)}px;top:${lg.sw.y + lg.size * 0.5}px"></i>`);
      this.tank.appendChild(t);
      setTimeout(() => t.remove(), 1200);
    }
  }

  // ---- 움직이는 대형 장식 ----
  playDecor(type, el) {
    const t = this.tank.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const img = !!el.querySelector('.big-img'); // 그림 파일일 때는 대포·분수 꼭지 위치가 조금 달라요
    if (type === 'pirateShip') {
      // 대포(오른쪽 끝)에서 비눗방울이 펑! 친구들이 쫓아가요
      sound.playRumble();
      el.classList.remove('boom');
      void el.offsetWidth;
      el.classList.add('boom');
      const x = r.right - t.left - r.width * 0.05;
      const y = r.top - t.top + r.height * (img ? 0.75 : 0.68);
      for (let i = 0; i < 3; i++) setTimeout(() => this.alive && this.blowBubbles(x + i * 12, y - i * 6), i * 140);
    } else if (type === 'fountain') {
      // 꼭대기에서 거품이 솟고, 친구들이 몰려와요
      sound.playWhoosh();
      const x = r.left - t.left + r.width / 2;
      const y = r.top - t.top + r.height * (img ? 0.25 : 0.1);
      for (let i = 0; i < 4; i++) setTimeout(() => this.alive && this.blowBubbles(x, y - i * 10), i * 120);
      this.attention = { x, y: y + r.height * 0.4, until: performance.now() + 3000, all: true };
    } else if (type === 'carousel') {
      sound.playStar();
      el.classList.remove('fast');
      void el.offsetWidth;
      el.classList.add('fast');
      for (let i = 0; i < 4; i++) setTimeout(() => this.alive && floatUp(this.tank, r.left - t.left + r.width * (0.2 + i * 0.2), r.top - t.top, i % 2 ? '🎵' : '🎶'), i * 150);
    }
  }

  // 해저 기차: 가지고 있으면 40~70초마다 바닥을 칙칙폭폭 지나가요
  stepTrain(dt) {
    if (!store.ownsBig('train') || this.decorating) return;
    this.trainWait = (this.trainWait ?? 8) - dt;
    if (this.trainWait > 0 || this.el.querySelector('.train')) return;
    this.trainWait = 40 + Math.random() * 30;
    const train = h(`<div class="train">${createTrainSVG(Math.round(this.u * 26))}</div>`);
    train.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      sound.playBoing();
      const t = this.tank.getBoundingClientRect();
      const r = train.getBoundingClientRect();
      floatUp(this.tank, r.right - t.left - r.width * 0.2, r.top - t.top, '뿌뿌! 🚂');
    });
    this.aquarium.appendChild(train);
    sound.playWhoosh();
    setTimeout(() => train.remove(), 12500);
  }

  // ---- 특별한 순간: 황금 명판, 해파리 불꽃놀이 ----
  renderMoments() {
    const plate = this.el.querySelector('.nameplate');
    plate.hidden = !store.ownsBig('nameplate');
    plate.textContent = `${store.data.kidName ? `${store.data.kidName}의` : '우리'} 바다`;
    this.el.querySelector('.fireworks-btn').hidden = !store.ownsBig('fireworks');
  }

  fireworks() {
    if (this.showing) return;
    this.showing = true;
    const colors = ['#FF6B8B', '#FFD54A', '#6BE3B0', '#6BCBFF', '#B58AFF'];
    this.say('해파리 불꽃놀이 시작! 🎆');
    for (let k = 0; k < 9; k++) {
      setTimeout(() => {
        if (!this.alive) return;
        const x = 12 + Math.random() * 76;
        const y = 14 + Math.random() * 44;
        const c = colors[k % colors.length];
        const sparks = Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg"></i>`).join('');
        const burst = h(`<div class="jelly-burst" style="left:${x}%;top:${y}%;--c:${c}">${sparks}<b>🪼</b></div>`);
        this.aquarium.appendChild(burst);
        sound.playStar();
        setTimeout(() => burst.remove(), 1600);
      }, k * 420);
    }
    setTimeout(() => {
      this.showing = false;
      if (this.alive) sound.playFanfare();
    }, 9 * 420 + 400);
  }

  celebrateBig(item) {
    if (item.kind === 'tank') this.applyTank();
    if (item.kind === 'friend') this.spawnLegend();
    if (item.kind === 'decor') this.renderTray();
    if (item.kind === 'event') this.trainWait = 2;
    if (item.kind === 'moment') this.renderMoments();
    if (item.kind === 'aquarium') this.renderTankNav();
    sound.playFanfare();
    confetti({ particleCount: 160, spread: 110, origin: { y: 0.5 }, zIndex: 300 });
    setTimeout(() => this.alive && confetti({ particleCount: 90, spread: 140, origin: { y: 0.35 }, zIndex: 300 }), 500);
    const says = {
      tank: `우와! ${item.name}이 됐어요! 친구들이 신나해요 🎉`,
      decor: `${item.name}을 샀어요! 🪸 꾸미기에서 보관함에 있는 걸 어항에 놓아 봐요`,
      event: `${item.name}가 생겼어요! 곧 어항 바닥을 지나갈 거예요 🚂`,
      music: `${item.name}이 흘러나와요 🎵 상점에서 다시 누르면 원래 곡으로 돌아가요`,
      aquarium: '두 번째 어항이 생겼어요! 어항 양옆의 ◀ ▶를 눌러 봐요. 도감에서 친구를 옮겨 살게 할 수 있어요 🐠',
      moment: item.id === 'fireworks' ? '어항 오른쪽 위 🎆를 눌러 봐요! 불꽃놀이가 시작돼요' : '어항 앞에 황금 명판이 생겼어요 🏅'
    };
    this.say(says[item.kind] || `${item.name}을 샀어요! 🎉`);
    for (const f of this.fishes) if (f.p >= 2) floatUp(this.tank, f.x + f.size / 2, f.y, '💖');
    this.renderGoal();
  }

  // 저금통: 찜한 스페셜까지 별이 얼마나 모였는지 보여줘요
  renderGoal() {
    const bar = this.el.querySelector('.goal-bar');
    const it = store.data.goal && bigItemById(store.data.goal);
    if (!it || store.ownsBig(it.id)) {
      bar.hidden = true;
      return;
    }
    const have = Math.min(store.data.stars, it.cost);
    const ready = store.data.stars >= it.cost;
    bar.hidden = false;
    bar.classList.toggle('ready', ready);
    bar.innerHTML = `<span class="goal-label">🐷 ${it.icon} ${it.name}</span><span class="goal-track"><i style="width:${(have / it.cost) * 100}%"></i></span><span class="goal-num">${ready ? '살 수 있어요! 🎉' : `⭐ ${store.data.stars} / ${it.cost}`}</span>`;
  }

  toggleFeed() {
    if (!this.feeding && this.blowing) this.toggleBubbles();
    if (!this.feeding && this.following) this.toggleFollow();
    this.feeding = !this.feeding;
    const b = this.el.querySelector('[data-act="feed"]');
    b.classList.toggle('active', this.feeding);
    if (this.feeding) this.say('어항을 톡톡 누르면 먹이가 떨어져요!');
    else this.say(careMessage() || this.guideLine());
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
    this.stepBubbles(dt, W);
    if (this.following && (this.followIdle += dt) > 40) this.toggleFollow(); // 40초 동안 안 놀면 끝나요

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
      const bubble = !food && !toy && !f.hungry && !f.sick ? this.nearestBubble(cx, cy) : null;
      const dAtt = this.attention ? Math.hypot(this.attention.x - cx, this.attention.y - cy) : Infinity;
      const near = this.attention && (this.attention.all || dAtt < 380); // 반짝이 따라오기는 멀리 있어도 와요
      // 반짝이 가까이서 3초 동안 따라오면 친해져요
      if (this.attention?.all && !f.sick && dAtt < f.size) {
        f.followT = (f.followT || 0) + dt;
        if (f.followT > 3) {
          f.followT = 0;
          floatUp(this.tank, cx, f.y, '💖');
          this.giveLove(f.dan, 1, 'play', f);
        }
      }
      const events = f.sw.update({
        W, H, dt, food: food || toy || bubble,
        attention: near && !f.sick ? this.attention : null,
        friends: swimmers.filter((o) => o !== f && !o.sick).map((o) => o.sw),
        decors,
        night: this.isNight(),
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
      if (bubble) this.fishPopsBubble(f, bubble);
      for (const ev of events) this.effect(ev, f);

      f.el.style.transform = f.sw.transform();
      if (!f.badge.hidden) f.badge.style.transform = `translate(${cx}px, ${f.y - this.u * 1.5}px) translateX(-50%)`;
      if (!f.info.hidden) {
        if (now > f.infoUntil) f.info.hidden = true;
        else f.info.style.transform = `translate(${cx}px, ${f.y + f.size + this.u * 0.4}px) translateX(-50%)`;
      }
    }
    this.guests?.step(dt, W, H);
    this.stepLegend(dt, W, H);
    this.stepTrain(dt);
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
    this.unsubGoal?.();
  }
}
