// 🏄 돌고래 파도타기: 파도를 달리는 런게임이에요.
//  · 톡 누르면 작게, 꾹 누르면 높이 뛰어요
//  · 🪸 성게는 작게, 🪼 해파리는 높이 뛰어넘고, 🕊️ 갈매기가 오면 뛰지 말고 지나가요
//  · 🫧 거품 방패를 먹으면 한 번은 막아 줘요. 그 외엔 한 번만 부딪혀도 끝!
//  · 넘을수록 빨라지고, 하늘도 낮 → 노을 → 밤으로 바뀌어요
import { store } from '../core/store.js';
import { h, topbar, unit, floatUp, confirmBox } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { sea2Art } from '../graphics/sea2.js';
import confetti from 'canvas-confetti';

// 점프: 톡 누르면 약 9u, 꾹 누르면 약 21u 높이
const JUMP_START = -40; // × u
const HOLD_ACC = -70; // × u/초 (누르고 있는 동안 더 솟아요)
const HOLD_MAX = 0.28; // 초
const GRAVITY = 85; // × u

const SPEED0 = 16; // × u (초당). 넘을수록 점점 빨라져요
const SPEED_MAX = 34;
const SPEED_UP = 0.5;

// 해파리 간격(초): 들쭉날쭉하게, 넘을수록 조금씩 촘촘하게
const GAP_FAR = [3.4, 2.4];
const GAP_NEAR = [1.9, 1.25];
const BIRD_GAP_MIN = 1.9; // 갈매기 앞은 넉넉히 (앞 점프에서 내려올 시간)
const PAIR_FROM = 15;
const PAIR_GAP = 0.35;

const BIRD_FROM = 6; // 이 점수부터 갈매기가 나와요
const URCHIN_FROM = 3;
const SHELL_UP = 14.5; // 조개·방패가 뜬 높이 (× u)
const SHIELD_EVERY = [18, 30]; // 방패가 나오는 간격(초)
const MILESTONE = 10; // 이만큼 넘을 때마다 보너스

// 충돌 판정은 그림보다 작게 (그림 둘레의 빈 곳까지 닿으면 억울해요)
const RIDER_W = 0.32;
const RIDER_H = 0.3;
const HIT_W = 0.28;
const HIT_H = 0.28;

// 장애물: w·h는 u 배수, up은 물 위로 띄우는 높이 (갈매기만)
const KINDS = {
  urchin: { w: 5.5, h: 5, up: 0, shell: 0.5 },
  jelly: { w: 7, h: 8, up: 0, shell: 0.8 },
  bird: { w: 8, h: 6, up: 12, shell: 0 }
};

const ART = {
  urchin: `<svg viewBox="0 0 60 56" aria-hidden="true">
    <g stroke="#6B4A9E" stroke-width="4" stroke-linecap="round"><path d="M30 4 V18 M30 52 V40 M4 29 H18 M56 29 H42 M11 11 l9 9 M49 11 l-9 9 M11 47 l9 -9 M49 47 l-9 -9"/></g>
    <circle cx="30" cy="29" r="15" fill="#9B6BD8" stroke="#6B4A9E" stroke-width="4"/>
    <g fill="#42276B"><circle cx="25" cy="27" r="2.6"/><circle cx="35" cy="27" r="2.6"/></g>
  </svg>`,
  jelly: `<svg viewBox="0 0 60 70" aria-hidden="true">
    <path d="M6 30 Q6 6 30 6 Q54 6 54 30 Q42 38 30 30 Q18 38 6 30Z" fill="#C9A4FF" stroke="#8A6BD8" stroke-width="3"/>
    <g stroke="#8A6BD8" stroke-width="3" fill="none" stroke-linecap="round"><path d="M16 34 q-5 14 0 28"/><path d="M30 34 q6 16 0 32"/><path d="M44 34 q-5 14 0 28"/></g>
    <g fill="#5A3E8A"><circle cx="23" cy="22" r="3"/><circle cx="37" cy="22" r="3"/></g>
  </svg>`,
  bird: `<svg viewBox="0 0 80 60" aria-hidden="true">
    <g class="wing-up"><path d="M34 30 Q20 6 2 10 Q16 18 24 32Z" fill="#EFF4FA" stroke="#5A6B85" stroke-width="3" stroke-linejoin="round"/></g>
    <path d="M26 30 Q34 16 52 20 Q68 24 70 34 Q60 44 42 42 Q30 40 26 30Z" fill="#FFFFFF" stroke="#5A6B85" stroke-width="3" stroke-linejoin="round"/>
    <path d="M70 32 l10 3 l-10 4Z" fill="#FFB347" stroke="#D98A20" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="62" cy="29" r="2.8" fill="#2B3A4F"/>
    <g class="wing-dn"><path d="M36 34 Q26 54 8 54 Q20 44 28 32Z" fill="#DCE6F2" stroke="#5A6B85" stroke-width="3" stroke-linejoin="round"/></g>
  </svg>`
};

export class SurfScene {
  constructor(app) {
    this.app = app;
    this.u = unit();
    this.alive = true;
    this.bar = topbar(app, { back: 'island', backLabel: '← 친구들의 섬' });
    this.el = h(`
      <div class="scene surf">
        <div class="surf-sky">
          <div class="surf-stars">${Array.from({ length: 40 }, (_, k) => `<i style="left:${(k * 67) % 100}%;top:${(k * 31) % 80}%;animation-delay:-${((k * 0.3) % 3).toFixed(1)}s"></i>`).join('')}</div>
          <div class="surf-sun"></div>
          <div class="surf-cloud c1"></div><div class="surf-cloud c2"></div><div class="surf-cloud c3"></div>
        </div>
        <div class="surf-sea">
          <svg class="surf-waves" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
            <path class="sw a" d="M-120 30 q25 -14 50 0${' t50 0'.repeat(15)} V60 H-120Z" fill="rgba(255,255,255,.18)"/>
            <path class="sw b" d="M-120 40 q25 -12 50 0${' t50 0'.repeat(15)} V60 H-120Z" fill="rgba(255,255,255,.14)"/>
          </svg>
        </div>
        <div class="surf-field"></div>
        <div class="surf-rider"><span class="rider-shield"></span></div>
        <div class="surf-hud">
          <span class="surf-pill">🏄 <b class="surf-score">0</b></span>
          <span class="surf-pill">🐚 <b class="surf-shell">0</b></span>
          <span class="surf-pill shield-pill" hidden>🫧 방패</span>
          <span class="surf-pill best">🏅 최고 <b>${store.data.surfBest || 0}</b></span>
        </div>
        <div class="surf-banner" hidden></div>
        <div class="surf-ready">
          <div class="surf-ready-card">
            <h2>🏄 돌고래 파도타기</h2>
            <ul class="surf-how">
              <li><b>톡</b> 누르면 작게, <b>꾹</b> 누르면 높이 뛰어요</li>
              <li>🪸 성게 · 🪼 해파리는 <b>뛰어넘어요</b></li>
              <li>🕊️ 갈매기가 오면 <b>뛰지 말고</b> 지나가요!</li>
              <li>🫧 거품 방패는 한 번 막아 줘요</li>
            </ul>
            <p class="surf-warn">한 번이라도 부딪히면 끝! 점점 빨라져요 💨</p>
            <button class="btn btn-coral btn-big" data-surf="go">시작!</button>
          </div>
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.field = this.el.querySelector('.surf-field');
    this.riderEl = this.el.querySelector('.surf-rider');
    this.size = Math.round(this.u * 11);
    this.riderEl.insertAdjacentHTML('afterbegin', sea2Art('compare', Math.max(2, store.progress2('compare')) || 2, this.size));
    this.riderEl.style.transform = `translate(${this.u * 10}px, ${this.u * 26}px)`;
    this.el.querySelector('[data-surf="go"]').addEventListener('click', () => this.start());
  }

  start() {
    sound.playWhoosh();
    this.el.querySelector('.surf-ready').remove();
    this.playing = true;
    this.score = 0;
    this.shells = 0;
    this.shield = false;
    this.items = [];
    this.spawnIn = 1.6;
    this.pairIn = 0;
    this.shieldIn = SHIELD_EVERY[0];
    this.hold = -1; // 누르고 있는 시간 (안 누르면 -1)
    this.waterY = this.el.clientHeight * 0.64;
    this.rider = { y: this.waterY, vy: 0, rot: 0, air: false };
    const down = (e) => {
      if (!this.playing || e.target.closest('.topbar')) return;
      if (!this.rider.air) {
        this.rider.vy = JUMP_START * this.u;
        this.rider.air = true;
        this.hold = 0;
        sound.playPop();
      }
    };
    const up = () => { this.hold = -1; };
    this.el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    this.offUp = () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    this.loop();
  }

  loop() {
    let last = performance.now();
    const tick = (now) => {
      if (!this.alive) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (this.playing) this.step(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  speed() {
    return this.u * Math.min(SPEED_MAX, SPEED0 + this.score * SPEED_UP);
  }

  nextGap() {
    const t = Math.min(1, this.score / 30);
    const near = GAP_NEAR[0] + (GAP_NEAR[1] - GAP_NEAR[0]) * t;
    const far = GAP_FAR[0] + (GAP_FAR[1] - GAP_FAR[0]) * t;
    return near + Math.random() * (far - near);
  }

  // 다음에 나올 장애물 고르기
  pickKind() {
    const r = Math.random();
    if (this.score >= BIRD_FROM && r < 0.26) return 'bird';
    if (this.score >= URCHIN_FROM && r < 0.5) return 'urchin';
    return 'jelly';
  }

  step(dt) {
    const W = this.el.clientWidth;
    const r = this.rider;
    const u = this.u;

    // 점프: 누르고 있으면 더 솟아요
    if (this.hold >= 0 && this.hold < HOLD_MAX && r.vy < 0) {
      this.hold += dt;
      r.vy += HOLD_ACC * u * dt;
    }
    r.vy += GRAVITY * u * dt;
    r.y += r.vy * dt;
    if (r.y >= this.waterY) {
      if (r.air && r.vy > u * 10) {
        sound.playSplash();
        this.splash(W * 0.22, this.waterY);
      }
      r.y = this.waterY;
      r.vy = 0;
      r.air = false;
      this.hold = -1;
    }
    r.rot = r.air ? Math.max(-30, Math.min(32, (r.vy / u) * 0.9)) : Math.sin(performance.now() / 320) * 5;
    this.riderEl.style.transform = `translate(${W * 0.22 - this.size / 2}px, ${r.y - this.size / 2}px) rotate(${r.rot}deg)`;

    // 장애물 만들기
    const sp = this.speed();
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const kind = this.pickKind();
      let gap = this.nextGap();
      if (kind === 'bird') gap = Math.max(gap, BIRD_GAP_MIN);
      this.spawnIn = gap;
      this.spawn(W, kind);
      // 가끔 같은 장애물 두 개가 붙어서 나와요 (갈매기는 빼고)
      if (kind !== 'bird' && this.score >= PAIR_FROM && Math.random() < 0.2) {
        this.pairKind = kind;
        this.pairIn = PAIR_GAP;
        this.spawnIn += PAIR_GAP;
      }
    }
    if (this.pairIn > 0) {
      this.pairIn -= dt;
      if (this.pairIn <= 0) {
        this.pairIn = 0;
        this.spawn(W, this.pairKind, true);
      }
    }
    // 가끔 거품 방패
    this.shieldIn -= dt;
    if (this.shieldIn <= 0) {
      this.shieldIn = SHIELD_EVERY[0] + Math.random() * (SHIELD_EVERY[1] - SHIELD_EVERY[0]);
      if (!this.shield) this.spawnShield(W);
    }

    const rx = W * 0.22;
    const rw = this.size * RIDER_W;
    const rh = this.size * RIDER_H;
    for (const it of this.items) {
      it.x -= sp * dt;
      it.el.style.transform = `translate(${it.x}px, ${it.y}px)`;
      const cx = it.x + it.w / 2;
      // 떠 있는 것(조개·방패) 줍기
      if (it.pick && !it.got) {
        if (Math.abs(cx - rx) < rw + u * 2.5 && Math.abs(it.y + it.h / 2 - r.y) < rh + u * 3.5) {
          it.got = true;
          it.el.classList.add('got');
          if (it.pick === 'shield') this.getShield();
          else this.getShell(cx, it.y);
        }
      }
      // 머리 위 조개
      if (it.shellEl && !it.shellGot) {
        const sy = this.waterY - u * SHELL_UP;
        if (Math.abs(cx - rx) < rw + u * 2.5 && Math.abs(sy - r.y) < rh + u * 3.5) {
          it.shellGot = true;
          it.shellEl.classList.add('got');
          this.getShell(cx, sy);
        }
      }
      // 부딪힘
      if (it.solid && !it.hit) {
        if (Math.abs(cx - rx) < rw + it.w * HIT_W && Math.abs(it.y + it.h / 2 - r.y) < rh + it.h * HIT_H) {
          it.hit = true;
          this.bump(it);
          if (!this.playing) return;
        }
      }
      // 무사히 지나가면 점수
      if (it.solid && !it.passed && it.x + it.w < rx - rw) {
        it.passed = true;
        if (!it.hit) this.addScore();
      }
      if (it.x < -it.w * 2) it.dead = true;
    }
    for (const it of this.items.filter((o) => o.dead)) it.el.remove();
    this.items = this.items.filter((o) => !o.dead);
  }

  addScore() {
    this.score += 1;
    this.el.querySelector('.surf-score').textContent = this.score;
    // 하늘이 낮 → 노을 → 밤으로 바뀌어요
    this.el.classList.toggle('dusk', this.score >= 20 && this.score < 40);
    this.el.classList.toggle('night', this.score >= 40);
    if (this.score % MILESTONE === 0) {
      this.shells += 3;
      this.el.querySelector('.surf-shell').textContent = this.shells;
      sound.playFanfare();
      this.banner(`${this.score}마리! 🐚 +3 · 더 빨라져요 💨`);
    }
  }

  getShell(x, y) {
    this.shells += 1;
    this.el.querySelector('.surf-shell').textContent = this.shells;
    sound.playStar();
    floatUp(this.el, x, y, '🐚 +1');
  }

  getShield() {
    this.shield = true;
    this.riderEl.classList.add('shielded');
    this.el.querySelector('.shield-pill').hidden = false;
    sound.playStar();
    this.banner('🫧 거품 방패! 한 번 막아 줘요');
  }

  banner(text) {
    const b = this.el.querySelector('.surf-banner');
    b.textContent = text;
    b.hidden = false;
    b.classList.remove('show');
    void b.offsetWidth;
    b.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => { b.hidden = true; }, 1600);
  }

  spawn(W, kind, pair = false) {
    const u = this.u;
    const k = KINDS[kind];
    const w = Math.round(u * k.w);
    const oh = Math.round(u * k.h);
    const withShell = !pair && Math.random() < k.shell;
    const el = h(`<div class="surf-ob ob-${kind}" style="width:${w}px;height:${oh}px">
      ${ART[kind]}
      ${withShell ? `<i class="surf-shellbit" style="bottom:${Math.round(oh * 0.45 + u * (SHELL_UP - 1.5))}px">🐚</i>` : ''}
    </div>`);
    this.field.appendChild(el);
    const y = k.up ? this.waterY - u * k.up - oh / 2 : this.waterY - oh * 0.55;
    this.items.push({ el, shellEl: el.querySelector('.surf-shellbit'), solid: true, x: W + w, y, w, h: oh });
  }

  spawnShield(W) {
    const u = this.u;
    const s = Math.round(u * 6);
    const el = h(`<div class="surf-bubble" style="width:${s}px;height:${s}px">🫧</div>`);
    this.field.appendChild(el);
    this.items.push({ el, pick: 'shield', x: W + s, y: this.waterY - u * SHELL_UP - s / 2, w: s, h: s });
  }

  bump(it) {
    if (this.shield) {
      // 방패가 한 번 막아 줘요
      this.shield = false;
      this.riderEl.classList.remove('shielded');
      this.el.querySelector('.shield-pill').hidden = true;
      sound.playSplash();
      it.el.classList.add('got');
      floatUp(this.el, it.x + it.w / 2, it.y, '🫧 막았다!');
      return;
    }
    this.playing = false;
    sound.playBoing();
    it.el.classList.add('got');
    this.riderEl.classList.add('bonk');
    this.el.classList.remove('bump');
    void this.el.offsetWidth;
    this.el.classList.add('bump');
    floatUp(this.el, it.x + it.w / 2, it.y, '💫');
    setTimeout(() => this.alive && this.finish(), 700);
  }

  splash(x, y) {
    for (let i = 0; i < 4; i++) {
      const d = h(`<i class="surf-drop" style="left:${x}px;top:${y}px;--dx:${(Math.random() - 0.5) * 90}px"></i>`);
      this.field.appendChild(d);
      setTimeout(() => d.remove(), 700);
    }
  }

  async finish() {
    this.playing = false;
    const best = store.data.surfBest || 0;
    const newBest = this.score > best;
    if (newBest) {
      store.data.surfBest = this.score;
      store.save();
    }
    if (this.shells) store.addShells(this.shells);
    sound.playFanfare();
    if (this.score > 0) confetti({ particleCount: 90, spread: 90, origin: { y: 0.4 }, zIndex: 300 });
    const again = await confirmBox(
      `${newBest ? '🏅 새 최고 기록!<br>' : ''}장애물을 <b>${this.score}</b>개 넘었어요! 🏄<br>조개 ${this.shells}개를 얻었어요 🐚`,
      '🔄 한 번 더', '섬으로 돌아가기'
    );
    if (!this.alive) return;
    this.app.go(again ? 'surf' : 'island');
  }

  destroy() {
    this.alive = false;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.bannerTimer);
    this.offUp?.();
    this.bar.destroy();
  }
}
