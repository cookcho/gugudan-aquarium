// 친구들의 섬: 두 번째 바다에서 깨운 친구들이 사는 곳. 물고기가 아닌 친구도 있어서 어항 대신 섬에서 살아요.
// 바다 친구는 헤엄치고(돌고래는 가끔 점프), 해달은 물 위에 둥둥, 펭귄·물범은 모래밭을 걷고, 성게는 바위 웅덩이에 있어요.
// 알(부화 전)은 야자수 밑 둥지에서 기다려요. 시간대(낮·노을·밤)는 어항과 같고, 밤에는 모래밭 친구가 잠을 자요.
import { store } from '../core/store.js';
import { h, topbar, unit, floatUp, timeOfDay } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { SEA2 } from '../data/sea2.js';
import { WORD_ISLANDS } from '../data/wordProblems.js';
import { sea2Art } from '../graphics/sea2.js';
import { callKid } from '../data/care.js';

// 곰치가 숨는 바위 구멍: 숨었을 때와 고개를 내밀었을 때의 가로 위치(%)
const HOLE = { hide: 89, peek: 80, y: 77 };
// 사는 곳마다 다니는 범위 (화면 %, 친구 몸 가운데 기준)와 빠르기(%/초)
const ZONE = {
  sea: { x: [8, 90], y: [43, 57], speed: 5 },
  float: { x: [24, 70], y: [57, 59], speed: 1.4 },
  land: { x: [36, 74], y: [75, 86], speed: 3.5 },
  rock: { x: [81, 93], y: [79.5, 81], speed: 0.7 }, // 성게: 바위 앞 물웅덩이에서 아주 천천히 기어다녀요
  hole: { x: [HOLE.hide, HOLE.hide], y: [HOLE.y, HOLE.y], speed: 0 }
};
// 친구마다 좁힌 범위 (해룡은 물풀 근처에서 느릿느릿)
const ZONE_ID = { story: { x: [27, 42], y: [44, 53], speed: 5 } };
const SLOW = { plus: 0.55, story: 0.6, minus: 0.8 }; // 물범·해룡·곰치는 느긋해요

const rand = (a, b) => a + Math.random() * (b - a);

function palmSVG() {
  return `<svg viewBox="0 0 200 260" aria-hidden="true">
    <path d="M104 250 C96 190 92 130 108 70" stroke="#A8743F" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M104 250 C96 190 92 130 108 70" stroke="#C99456" stroke-width="16" fill="none" stroke-dasharray="6 14"/>
    <g fill="#3FB56B" stroke="#2A8A4E" stroke-width="3" stroke-linejoin="round" class="palm-leaves">
      <path d="M108 70 C80 40 40 44 12 70 C44 58 76 62 108 74Z"/>
      <path d="M108 70 C92 30 60 12 30 16 C62 28 86 46 106 76Z"/>
      <path d="M108 70 C120 30 150 14 180 20 C150 32 128 48 110 76Z"/>
      <path d="M108 70 C140 48 176 52 196 78 C166 66 138 66 110 76Z"/>
      <path d="M108 70 C112 44 106 20 96 4 C120 20 124 46 112 74Z"/>
    </g>
    <g fill="#8A5A2B"><circle cx="100" cy="80" r="9"/><circle cx="116" cy="82" r="9"/><circle cx="108" cy="92" r="9"/></g>
  </svg>`;
}

function rockSVG() {
  return `<svg viewBox="0 0 240 150" aria-hidden="true">
    <ellipse cx="120" cy="112" rx="112" ry="34" fill="#5FC9D8" stroke="#3E9FB3" stroke-width="4"/>
    <ellipse cx="120" cy="108" rx="86" ry="20" fill="#8FE3EC" opacity=".7"/>
    <path d="M30 116 C18 70 50 40 88 48 C104 22 150 24 164 52 C200 44 226 78 212 118 C170 132 72 132 30 116Z" fill="#9AA5B8" stroke="#6D7890" stroke-width="4"/>
    <path d="M56 74 C70 60 92 60 102 70" stroke="#C3CBD9" stroke-width="6" fill="none" stroke-linecap="round"/>
    <g fill="#FF8FA3"><circle cx="186" cy="104" r="7"/><circle cx="46" cy="110" r="6"/></g>
    <path d="M150 112 l6 -14 l6 14 l14 2 l-11 8 l4 14 l-13 -8 l-13 8 l4 -14 l-11 -8Z" fill="#FFB347" stroke="#E0892A" stroke-width="2"/>
  </svg>`;
}

// 얕은 물의 물풀 (해룡이가 이 근처에 살아요)
function weedSVG() {
  return `<svg viewBox="0 0 160 120" aria-hidden="true">
    ${[[20, '#4FA85B'], [52, '#6CC46A'], [84, '#3E9A55'], [116, '#7AD17A'], [140, '#4FA85B']].map(([x, c], k) => `<path class="weed-blade" style="animation-delay:-${k * 0.6}s" d="M${x} 120 C${x - 14} 90 ${x + 14} 60 ${x - 6} ${24 + (k % 2) * 16}" stroke="${c}" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}
  </svg>`;
}

function hutSign(title) {
  return `<svg viewBox="0 0 220 150" aria-hidden="true">
    <rect x="98" y="70" width="12" height="80" rx="4" fill="#A8743F"/>
    <rect x="8" y="14" width="204" height="64" rx="14" fill="#E0A96A" stroke="#A8743F" stroke-width="5"/>
    <text x="110" y="56" text-anchor="middle" font-family="Jua, sans-serif" font-size="28" fill="#6B4320" textLength="180" lengthAdjust="spacingAndGlyphs">${title}</text>
  </svg>`;
}

export class IslandScene {
  constructor(app, { from = 'home' } = {}) {
    this.app = app;
    this.u = unit();
    this.alive = true;
    this.tod = timeOfDay();
    const hatched = SEA2.filter((s) => store.progress2(s.id) >= 2);
    const eggs = SEA2.filter((s) => store.progress2(s.id) === 1);
    this.bar = topbar(app, { back: from, backLabel: from === 'sea2' ? '← 두 번째 바다' : '← 어항', center: `🏝️ 친구들의 섬 <small class="isle-count">친구 ${hatched.length} / 9</small>` });
    const shells = Array.from({ length: 9 }, (_, k) => `<i class="shell s${k % 3}" style="left:${(k * 37 + 6) % 94}%;top:${22 + ((k * 23) % 70)}%;rotate:${k * 40}deg"></i>`).join('');
    // 밤하늘 별: 작은 별 여러 크기 + 가끔 반짝이는 십자 별
    const stars = Array.from({ length: 120 }, (_, k) => `<i class="${k % 9 === 0 ? 'big' : `s${k % 3}`}" style="left:${(k * 67 + (k % 5) * 7) % 100}%;top:${(k * 29 + (k % 4) * 11) % 92}%;animation-delay:-${((k * 0.37) % 3).toFixed(2)}s"></i>`).join('');
    this.el = h(`
      <div class="scene island">
        <div class="isle-world ${this.tod}">
          <div class="isle-sky">
            <div class="isle-stars">${stars}</div>
            <div class="isle-sun"></div>
            <div class="isle-cloud c1"></div><div class="isle-cloud c2"></div><div class="isle-cloud c3"></div>
            <div class="isle-far"></div>
          </div>
          <div class="isle-sea">
            <svg class="isle-waves" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
              ${[8, 20, 32].map((y, k) => `<path class="wv w${k}" d="M-40 ${y} q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#fff" stroke-width="1.2" vector-effect="non-scaling-stroke" opacity=".45"/>`).join('')}
            </svg>
            <div class="isle-glints">${Array.from({ length: 12 }, (_, k) => `<i style="left:${(k * 83) % 96}%;top:${(k * 41) % 90}%;animation-delay:-${(k * 0.4).toFixed(1)}s"></i>`).join('')}</div>
          </div>
          <svg class="isle-shore" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
            <path class="foam" d="M0 6 C8 2 14 9 22 5 C30 1 38 8 46 5 C54 2 62 9 70 5 C78 1 86 8 94 4 L100 4 L100 20 L0 20Z" fill="#FFFFFF" opacity=".85"/>
            <path d="M0 9 C8 6 14 12 22 9 C30 5 38 12 46 9 C54 6 62 12 70 9 C78 5 86 12 94 8 L100 8 L100 20 L0 20Z" fill="#EFCB85"/>
          </svg>
          <div class="isle-sand">${shells}</div>
          <div class="isle-palm">${palmSVG()}</div>
          <div class="isle-rock">${rockSVG()}</div>
          <div class="isle-weed">${weedSVG()}</div>
          <div class="isle-sign">${hutSign(store.data.kidName ? `${store.data.kidName}의 섬` : '친구들의 섬')}</div>
          <div class="isle-nest" ${eggs.length ? '' : 'hidden'}>
            <div class="nest-eggs">${eggs.map((s) => `<button class="nest-egg" data-egg="${s.id}">${sea2Art(s.id, 1, Math.round(this.u * 5.5), WORD_ISLANDS[s.word].icon)}</button>`).join('')}</div>
          </div>
          <div class="isle-actors"></div>
          <div class="isle-say" hidden></div>
          ${store.sea2Open() ? '<button class="isle-sail" data-sail>⛵ 두 번째 바다</button>' : ''}
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.world = this.el.querySelector('.isle-world');
    this.actors = this.el.querySelector('.isle-actors');
    this.sayEl = this.el.querySelector('.isle-say');
    this.friends = hatched.map((s) => this.makeFriend(s));

    this.el.querySelector('[data-sail]')?.addEventListener('click', () => {
      sound.playPop();
      this.app.go('sea2');
    });
    this.el.querySelector('.isle-nest').addEventListener('click', (e) => {
      const b = e.target.closest('[data-egg]');
      if (!b) return;
      const s = SEA2.find((it) => it.id === b.dataset.egg);
      sound.playPop();
      b.classList.remove('shake');
      void b.offsetWidth;
      b.classList.add('shake');
      this.say(b, `${s.friend.name}의 알이에요. 두 번째 바다 ${WORD_ISLANDS[s.word].name}에서 '부화'를 하면 깨어나요!`);
    });
    // 물을 누르면 물결이 퍼져요
    this.el.querySelector('.isle-sea').addEventListener('pointerdown', (e) => {
      const r = this.world.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const ring = h(`<div class="isle-ripple" style="left:${x}px;top:${y}px"></div>`);
      this.world.appendChild(ring);
      setTimeout(() => ring.remove(), 900);
    });
  }

  makeFriend(s) {
    const p = store.progress2(s.id);
    const amphi = s.home === 'land'; // 펭귄·물범: 모래밭에서 걷다가 가끔 바다에 들어가 헤엄쳐요
    const mode = s.home;
    const z = this.zoneOf({ s, mode });
    const size = Math.round(this.u * (p === 2 ? 9 : p === 4 ? 12 : 11));
    const el = h(`<div class="isle-friend ${mode} ${p === 4 ? 'gold' : ''}" style="width:${size}px;height:${size}px">
      <div class="isle-body"></div><i class="isle-shadow"></i><span class="zz">💤</span></div>`);
    const f = {
      s, p, el, size, amphi, mode,
      x: rand(z.x[0], z.x[1]),
      y: rand(z.y[0], z.y[1]),
      face: Math.random() < 0.5 ? -1 : 1,
      t: Math.random() * 10,
      wait: rand(0, 2),
      hop: 0,
      jump: -1,
      nextJump: rand(6, 12),
      act: null, // 쉬는 동안 하는 몸짓 { type, time, dur }
      goal: null, // 'dive' 바다로 들어가기 · 'shore' 모래밭으로 나오기
      swimLeft: 0,
      printT: 0,
      peek: 0, // 곰치: 0 숨음 ~ 1 고개 내밀기
      peekWait: rand(1, 4),
      sleep: this.tod === 'night' && (amphi || mode === 'float')
    };
    f.tx = f.x;
    f.ty = f.y;
    this.setArt(f);
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.touch(f);
    });
    this.actors.appendChild(el);
    return f;
  }

  // 지금 모습에 맞는 그림: 모래밭은 서 있는(누운) 그림, 바다는 헤엄 그림, 밤에는 자는 그림
  setArt(f) {
    const variant = f.sleep ? 'sleep' : f.amphi && f.mode === 'land' ? 'land' : '';
    const key = `${f.mode}:${variant}`;
    if (f.artKey === key) return;
    f.artKey = key;
    f.el.firstElementChild.innerHTML = sea2Art(f.s.id, f.p, f.size, '', variant);
    f.el.className = `isle-friend ${f.mode} ${f.p === 4 ? 'gold' : ''} ${f.sleep ? 'asleep' : ''}`;
  }

  touch(f) {
    sound.playPop();
    const { name, line } = f.s.friend;
    if (f.sleep) {
      this.say(f.el, `${name}: "쿨쿨… 음냐, 내일 또 놀자…" 💤`);
      f.hop = 0.5;
      return;
    }
    const kid = store.data.kidName;
    this.say(f.el, `${name}: "${Math.random() < 0.35 && kid ? `${callKid(kid)}, 섬에 와 줘서 고마워!` : line}"`);
    f.hop = 1;
    f.wait = Math.max(f.wait, 1.2);
    if (f.mode === 'hole') {
      f.peekOut = true;
      f.peekWait = 4;
    }
    const r = f.el.getBoundingClientRect();
    const w = this.world.getBoundingClientRect();
    floatUp(this.world, r.left - w.left + r.width / 2, r.top - w.top, f.p === 4 ? '✨' : '💖');
  }

  // 누른 것 위에 말풍선
  say(target, text) {
    const r = target.getBoundingClientRect();
    const w = this.world.getBoundingClientRect();
    this.sayEl.textContent = text;
    this.sayEl.hidden = false;
    const x = Math.min(Math.max(r.left - w.left + r.width / 2, w.width * 0.18), w.width * 0.82);
    this.sayEl.style.left = `${x}px`;
    this.sayEl.style.top = `${Math.max(r.top - w.top - 8, this.u * 3)}px`;
    this.sayEl.classList.remove('pop');
    void this.sayEl.offsetWidth;
    this.sayEl.classList.add('pop');
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => (this.sayEl.hidden = true), 3200);
  }

  mounted() {
    if (!this.friends.length) {
      // 아직 아무도 없으면 표지판이 알려줘요
      setTimeout(() => this.alive && this.say(this.el.querySelector('.isle-sign'), store.sea2Open()
        ? '두 번째 바다에서 친구를 깨우면 이 섬에 와서 살아요! ⛵'
        : `첫 번째 바다에서 황금 섬을 모으면 두 번째 바다로 갈 수 있어요. 거기 친구들이 이 섬에 와서 살아요!`), 600);
    }
    // 밤·노을에는 가끔 별똥별이 떨어져요 (가끔 두 개 연달아)
    if (this.tod !== 'day') {
      const sky = this.el.querySelector('.isle-sky');
      const shoot = () => {
        const el = h(`<i class="isle-shoot" style="left:${10 + Math.random() * 60}%;top:${5 + Math.random() * 35}%"></i>`);
        sky.appendChild(el);
        setTimeout(() => el.remove(), 1300);
      };
      const tick = () => {
        if (!this.alive) return;
        shoot();
        if (Math.random() < 0.3) setTimeout(() => this.alive && shoot(), 450);
        this.shootTimer = setTimeout(tick, this.tod === 'night' ? 3000 + Math.random() * 4000 : 6000 + Math.random() * 6000);
      };
      this.shootTimer = setTimeout(tick, 1500);
    }
    const ripple = () => {
      if (!this.alive) return;
      const swimmers = this.friends.filter((f) => f.mode === 'sea' && f.jump < 0);
      if (swimmers.length) {
        const f = swimmers[Math.floor(Math.random() * swimmers.length)];
        const ring = h(`<div class="isle-ripple small" style="left:${f.x}%;top:${f.y - 3}%"></div>`);
        this.world.appendChild(ring);
        setTimeout(() => ring.remove(), 900);
      }
      this.rippleTimer = setTimeout(ripple, 1500 + Math.random() * 2500);
    };
    this.rippleTimer = setTimeout(ripple, 1200);
    let last = performance.now();
    const loop = (now) => {
      if (!this.alive) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const W = this.world.clientWidth;
      const H = this.world.clientHeight;
      for (const f of this.friends) this.step(f, dt, W, H);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  step(f, dt, W, H) {
    const { s } = f;
    const zone = this.zoneOf(f);
    f.t += dt;
    f.hop = Math.max(0, f.hop - dt * 2.2);
    const night = this.tod === 'night';
    let lift = 0;
    let rot = 0;
    let sx = 1;
    let sy = 1;
    // 돌고래는 가끔 물 위로 점프해요
    if (s.id === 'compare' && !night) {
      if (f.jump < 0) {
        f.nextJump -= dt;
        if (f.nextJump <= 0) {
          f.jump = 0;
          this.splash(f, W, H);
        }
      } else {
        f.jump += dt / 1.5;
        if (f.jump >= 1) {
          f.jump = -1;
          f.nextJump = rand(8, 15);
          this.splash(f, W, H);
        }
      }
    }
    let moving = false;
    if (f.mode === 'hole') {
      // 곰치: 바위 구멍에서 쏙 나왔다가 두리번, 다시 쏙 들어가요
      f.peekWait -= dt;
      const want = f.peekOut ? 1 : 0;
      f.peek += Math.sign(want - f.peek) * Math.min(Math.abs(want - f.peek), dt * 1.6);
      if (f.peekWait <= 0) {
        f.peekOut = !f.peekOut;
        f.peekWait = f.peekOut ? rand(3, 7) : rand(2, 5) * (night ? 2 : 1);
      }
      f.x = HOLE.hide + (HOLE.peek - HOLE.hide) * f.peek;
      f.face = -1;
      rot = f.peek > 0.9 ? Math.sin(f.t * 2) * 8 : 0;
    } else if (f.jump >= 0) {
      lift = Math.sin(Math.PI * f.jump) * H * 0.2;
      rot = (f.jump - 0.5) * 90;
      f.x = Math.min(zone.x[1], Math.max(zone.x[0], f.x + f.face * 7 * dt));
    } else if (!f.sleep && zone.speed) {
      if (f.mode === 'sea' && f.amphi) f.swimLeft -= dt;
      if (f.wait > 0) {
        f.wait -= dt;
      } else {
        const dx = f.tx - f.x;
        const dy = f.ty - f.y;
        const d = Math.hypot(dx, dy);
        if (d < 0.6) {
          this.arrive(f);
        } else {
          let v = zone.speed * (SLOW[s.id] || 1) * (night ? (f.mode === 'rock' ? 1.6 : 0.5) : 1) * dt; // 성게는 밤에 더 부지런해요
          // 물범은 모래에서 몸을 늘였다 줄이며 애벌레처럼 앞으로 가요
          if (f.mode === 'land' && s.id === 'plus') v *= 0.3 + 1.4 * Math.max(0, Math.sin(f.t * 5));
          f.x += (dx / d) * Math.min(v, d);
          f.y += (dy / d) * Math.min(v, d);
          if (Math.abs(dx) > 0.3) f.face = dx < 0 ? -1 : 1;
          moving = true;
        }
      }
    }
    // 걷는 모습
    if (moving && f.mode === 'land') {
      if (s.id === 'plus') {
        const k = Math.sin(f.t * 5);
        sx = 1 + k * 0.1;
        sy = 1 - k * 0.07;
      } else {
        // 펭귄: 한 발씩 뒤뚱 + 발걸음마다 통통, 모래에 발자국
        const k = Math.sin(f.t * 10);
        rot = k * 9;
        lift = Math.abs(k) * this.u * 0.8;
        f.printT -= dt;
        if (f.printT <= 0) {
          f.printT = 0.32;
          this.footprint(f, W, H, k > 0 ? 1 : -1);
        }
      }
    }
    // 쉬는 동안 몸짓: 두리번, 폴짝, 기지개, 데굴, 부르르
    if (f.act) {
      f.act.time += dt;
      const k = Math.min(1, f.act.time / f.act.dur);
      const bell = Math.sin(Math.PI * k);
      if (f.act.type === 'stretch') {
        sy *= 1 + bell * 0.14;
        sx *= 1 - bell * 0.07;
      } else if (f.act.type === 'roll') {
        rot += 360 * k;
        lift += bell * this.u * 1.2;
      } else if (f.act.type === 'shake') {
        rot += Math.sin(f.act.time * 45) * 10 * (1 - k);
      } else if (f.act.type === 'dive') {
        // 해달 잠수: 쏙 가라앉았다가 다른 곳에서 뿅
        const sink = k < 0.3 ? k / 0.3 : k > 0.7 ? (1 - k) / 0.3 : 1;
        lift -= sink * this.u * 3;
        f.el.style.opacity = String(1 - sink);
        if (!f.act.moved && k > 0.5) {
          f.act.moved = true;
          const z = this.zoneOf(f);
          f.x = rand(z.x[0], z.x[1]);
          f.tx = f.x;
        }
        if (!f.act.popped && k > 0.72) {
          f.act.popped = true;
          this.splash(f, W, H);
        }
        if (k >= 1) f.el.style.opacity = '';
      } else if (f.act.type === 'look' && !f.act.flipped && k > 0.5) {
        f.act.flipped = true;
        f.face = -f.face;
      }
      if (k >= 1) f.act = null;
    }
    // 물속 친구는 살랑살랑, 물 위 친구는 흔들흔들
    let bob = 0;
    if (f.mode === 'sea' && f.jump < 0) {
      bob = Math.sin(f.t * 2.2) * this.u * 0.5;
      rot += Math.sin(f.t * 1.6) * 4;
    } else if (f.mode === 'float') {
      bob = Math.sin(f.t * 1.8) * this.u * 0.4;
      rot += Math.sin(f.t * 1.3) * 8;
    } else if (f.mode === 'rock') {
      // 가시가 꼼지락: 기어갈 때는 조금 더 흔들려요
      rot += Math.sin(f.t * (moving ? 4 : 2)) * (moving ? 6 : 3);
      sy *= 1 + Math.sin(f.t * 3) * 0.03;
    } else if (f.mode === 'land' && !moving && !f.act) {
      sy *= 1 + Math.sin(f.t * (f.sleep ? 1.4 : 2.2)) * 0.025; // 숨 쉬기
    }
    // 멀리(위) 있을수록 작게
    const depth = f.mode === 'rock' ? 0.8 : f.mode === 'sea' ? 0.72 + ((f.y - 43) / 14) * 0.28 : f.mode === 'land' ? 0.95 + ((f.y - 75) / 11) * 0.12 : 1;
    const sc = depth * (1 + f.hop * 0.08);
    const hopY = Math.sin(f.hop * Math.PI) * this.u * 2.5;
    const px = (f.x / 100) * W - f.size / 2;
    const py = (f.y / 100) * H - f.size / 2 + bob - lift - hopY;
    f.el.style.transform = `translate(${px}px, ${py}px)`;
    f.el.firstElementChild.style.transform = `scale(${sc * f.face * sx}, ${sc * sy}) rotate(${rot}deg)`;
    f.el.style.zIndex = f.mode === 'hole' ? '680' : String(Math.round(f.y * 10) + (f.jump >= 0 ? 500 : 0));
    f.el.classList.toggle('jumping', f.jump >= 0);
  }

  // 목표에 닿았을 때: 바다로 풍덩, 모래밭으로 올라오기, 또는 다음 갈 곳 고르기
  arrive(f) {
    const W = this.world.clientWidth;
    const H = this.world.clientHeight;
    if (f.goal === 'dive') {
      f.goal = null;
      this.splash(f, W, H);
      f.mode = 'sea';
      f.y = 57;
      f.swimLeft = rand(10, 20);
      f.hop = 0.6;
      this.setArt(f);
    } else if (f.goal === 'shore') {
      f.goal = null;
      this.splash(f, W, H);
      f.mode = 'land';
      f.y = 74;
      f.wait = 0.8;
      f.act = { type: 'shake', time: 0, dur: 0.8 }; // 몸을 부르르 털어요
      this.setArt(f);
      return this.pick(f);
    }
    this.pick(f);
  }

  pick(f) {
    const z = this.zoneOf(f);
    if (f.amphi && f.mode === 'land' && this.tod !== 'night' && Math.random() < 0.2) {
      // 물가로 가서 풍덩!
      f.goal = 'dive';
      f.tx = rand(z.x[0], z.x[1]);
      f.ty = 72;
      f.wait = rand(0.5, 1.5);
      return;
    }
    if (f.amphi && f.mode === 'sea' && f.swimLeft <= 0) {
      f.goal = 'shore';
      f.tx = rand(ZONE.land.x[0], ZONE.land.x[1]);
      f.ty = 57;
      f.wait = 0;
      return;
    }
    f.tx = rand(z.x[0], z.x[1]);
    f.ty = rand(z.y[0], z.y[1]);
    if (f.mode === 'land') {
      f.wait = rand(1.5, 4);
      // 쉬면서 가끔 몸짓을 해요
      const acts = f.s.id === 'plus' ? ['stretch', 'roll', 'look'] : ['look', 'hop', 'stretch', 'look'];
      if (Math.random() < 0.6) {
        const type = acts[Math.floor(Math.random() * acts.length)];
        if (type === 'hop') f.hop = 1;
        else f.act = { type, time: 0, dur: type === 'roll' ? 1.1 : type === 'look' ? 1.6 : 1 };
      }
      // 가까이 있는 모래밭 친구가 있으면 서로 마주 봐요
      const buddy = this.friends.find((o) => o !== f && o.mode === 'land' && Math.abs(o.x - f.x) < 14 && Math.abs(o.y - f.y) < 8);
      if (buddy) {
        f.face = buddy.x > f.x ? 1 : -1;
        buddy.face = -f.face;
      }
    } else {
      f.wait = f.mode === 'rock' ? rand(2, 6) : rand(0.3, 2.5);
      if (f.mode === 'float' && !f.sleep && Math.random() < 0.45) {
        const type = Math.random() < 0.55 ? 'roll' : 'dive';
        f.act = { type, time: 0, dur: type === 'dive' ? 3.2 : 1.4 };
        f.wait = f.act.dur;
        if (type === 'dive') floatUp(this.world, (f.x / 100) * this.world.clientWidth, (f.y / 100) * this.world.clientHeight, '🫧');
      }
    }
  }

  zoneOf(f) {
    return (f.mode === 'sea' && ZONE_ID[f.s.id]) || ZONE[f.mode] || ZONE.sea;
  }

  // 펭귄 발자국: 모래에 콕콕 찍혔다가 천천히 사라져요
  footprint(f, W, H, side) {
    const x = (f.x / 100) * W + side * this.u * 0.6;
    const y = (f.y / 100) * H + f.size * 0.4;
    const el = h(`<i class="isle-print" style="left:${x}px;top:${y}px"></i>`);
    this.actors.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  splash(f, W, H) {
    sound.playPop?.();
    floatUp(this.world, (f.x / 100) * W, (f.y / 100) * H, '💦');
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.sayTimer);
    clearTimeout(this.shootTimer);
    clearTimeout(this.rippleTimer);
    this.bar.destroy();
  }
}
