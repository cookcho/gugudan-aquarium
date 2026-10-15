// 🏄 돌고래 파도타기: 돌돌이를 타고 파도를 달려요.
// 화면을 누르면 점프 — 빛나는 링을 지나면 조개를 얻고, 해파리에 부딪히면 잠깐 느려져요.
// 60초 동안 모은 조개가 점수예요. 최고 기록이 남아요.
import { store } from '../core/store.js';
import { h, topbar, unit, floatUp, confirmBox } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { sea2Art } from '../graphics/sea2.js';
import confetti from 'canvas-confetti';

const GAME_MS = 60000;
const GRAVITY = 2300; // px/s²
const JUMP_V = -980; // 누를 때 솟는 속도
const SPEED0 = 320; // 처음 흐르는 속도 (px/s)
const SPEED_MAX = 560;

export class SurfScene {
  constructor(app) {
    this.app = app;
    this.u = unit();
    this.alive = true;
    this.bar = topbar(app, { back: 'island', backLabel: '← 친구들의 섬' });
    this.el = h(`
      <div class="scene surf">
        <div class="surf-sky">
          <div class="surf-sun"></div>
          <div class="surf-cloud c1"></div><div class="surf-cloud c2"></div><div class="surf-cloud c3"></div>
        </div>
        <div class="surf-sea">
          <svg class="surf-waves" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
            <path class="sw a" d="M-120 30 q25 -14 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V60 H-120Z" fill="rgba(255,255,255,.18)"/>
            <path class="sw b" d="M-120 40 q25 -12 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V60 H-120Z" fill="rgba(255,255,255,.14)"/>
          </svg>
        </div>
        <div class="surf-field"></div>
        <div class="surf-rider"></div>
        <div class="surf-hud">
          <span class="surf-pill">🐚 <b class="surf-score">0</b></span>
          <span class="surf-pill surf-time"><i></i></span>
          <span class="surf-pill best">🏅 최고 <b>${store.data.surfBest || 0}</b></span>
        </div>
        <div class="surf-ready">
          <div class="surf-ready-card">
            <h2>🏄 돌고래 파도타기</h2>
            <p>화면을 누르면 돌돌이가 <b>폴짝</b> 뛰어요.<br>빛나는 링을 지나면 🐚 조개를 얻어요!</p>
            <button class="btn btn-coral btn-big" data-surf="go">시작!</button>
          </div>
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.field = this.el.querySelector('.surf-field');
    this.riderEl = this.el.querySelector('.surf-rider');
    this.riderEl.innerHTML = sea2Art('compare', Math.max(2, store.progress2('compare')) || 2, Math.round(this.u * 11));
    const size = Math.round(this.u * 11);
    this.riderEl.style.transform = `translate(${this.u * 10}px, ${this.u * 26}px)`;
    this.el.querySelector('[data-surf="go"]').addEventListener('click', () => this.start());
  }

  start() {
    sound.playWhoosh();
    this.el.querySelector('.surf-ready').remove();
    this.playing = true;
    this.score = 0;
    this.left = GAME_MS;
    this.speed = SPEED0;
    this.items = [];
    this.spawnIn = 0.6;
    this.slow = 0;
    const H = this.el.clientHeight;
    this.waterY = H * 0.62; // 파도 타는 높이
    this.rider = { y: this.waterY, vy: 0, rot: 0, air: false };
    const jump = (e) => {
      if (!this.playing || e.target.closest('.topbar')) return;
      if (this.rider.air) return;
      this.rider.vy = JUMP_V;
      this.rider.air = true;
      sound.playPop();
    };
    this.el.addEventListener('pointerdown', jump);
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

  step(dt) {
    const W = this.el.clientWidth;
    const H = this.el.clientHeight;
    const r = this.rider;
    // 남은 시간
    this.left -= dt * 1000;
    this.el.querySelector('.surf-time i').style.width = `${Math.max(0, (this.left / GAME_MS) * 100)}%`;
    if (this.left <= 0) return this.finish();

    // 돌고래: 점프했다 물결 위로 내려앉아요
    r.vy += GRAVITY * dt;
    r.y += r.vy * dt;
    if (r.y >= this.waterY) {
      if (r.air && r.vy > 200) {
        sound.playSplash();
        this.splash(W * 0.22, this.waterY);
      }
      r.y = this.waterY;
      r.vy = 0;
      r.air = false;
    }
    r.rot = r.air ? Math.max(-32, Math.min(34, r.vy * 0.045)) : Math.sin(now2() * 3) * 5;
    const size = this.u * 11;
    this.riderEl.style.transform = `translate(${W * 0.22 - size / 2}px, ${r.y - size / 2}px) rotate(${r.rot}deg)`;

    // 점점 빨라져요 (해파리에 닿으면 잠깐 느려져요)
    this.slow = Math.max(0, this.slow - dt);
    const t = 1 - this.left / GAME_MS;
    this.speed = (SPEED0 + (SPEED_MAX - SPEED0) * t) * (this.slow > 0 ? 0.55 : 1);

    // 장애물·링 만들기
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnIn = 0.75 + Math.random() * 0.8;
      this.spawn(W, H);
    }

    // 흘러가기 + 부딪힘 판정
    const rx = W * 0.22;
    for (const it of this.items) {
      it.x -= this.speed * dt;
      it.el.style.transform = `translate(${it.x}px, ${it.y}px)`;
      if (!it.hit && Math.hypot(it.x + it.r - rx, it.y + it.r - r.y) < it.r + size * 0.34) {
        it.hit = true;
        if (it.kind === 'ring') {
          this.score += it.gold ? 3 : 1;
          this.el.querySelector('.surf-score').textContent = this.score;
          sound.playStar();
          it.el.classList.add('got');
          floatUp(this.el, it.x + it.r, it.y, it.gold ? '🐚 +3' : '🐚 +1');
        } else {
          this.slow = 1.1;
          sound.playBoing();
          this.el.classList.remove('bump');
          void this.el.offsetWidth;
          this.el.classList.add('bump');
          it.el.classList.add('got');
          floatUp(this.el, it.x + it.r, it.y, '💫');
        }
      }
      if (it.x < -it.r * 3) it.dead = true;
    }
    for (const it of this.items.filter((o) => o.dead)) it.el.remove();
    this.items = this.items.filter((o) => !o.dead);
  }

  spawn(W, H) {
    const ring = Math.random() < 0.68;
    const gold = ring && Math.random() < 0.18;
    const r = Math.round(this.u * (ring ? 4.2 : 3.4));
    const y = ring
      ? this.waterY - this.u * (2 + Math.random() * 11) // 링은 공중에
      : this.waterY - this.u * (0.5 + Math.random() * 2); // 해파리는 물결 가까이
    const el = h(ring
      ? `<div class="surf-item ring ${gold ? 'gold' : ''}" style="width:${r * 2}px;height:${r * 2}px"></div>`
      : `<div class="surf-item jelly" style="width:${r * 2}px;height:${r * 2}px">
           <svg viewBox="0 0 60 70" aria-hidden="true">
             <path d="M6 30 Q6 6 30 6 Q54 6 54 30 Q42 38 30 30 Q18 38 6 30Z" fill="#C9A4FF" stroke="#8A6BD8" stroke-width="3"/>
             <g stroke="#8A6BD8" stroke-width="3" fill="none" stroke-linecap="round"><path d="M16 34 q-5 14 0 28"/><path d="M30 34 q6 16 0 32"/><path d="M44 34 q-5 14 0 28"/></g>
             <g fill="#5A3E8A"><circle cx="23" cy="22" r="3"/><circle cx="37" cy="22" r="3"/></g>
           </svg>
         </div>`);
    this.field.appendChild(el);
    this.items.push({ el, x: W + r, y: y - r, r, kind: ring ? 'ring' : 'jelly', gold });
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
    store.addShells(this.score);
    sound.playFanfare();
    if (this.score > 0) confetti({ particleCount: 90, spread: 90, origin: { y: 0.4 }, zIndex: 300 });
    const again = await confirmBox(
      `${newBest ? '🏅 새 최고 기록!<br>' : ''}조개를 ${this.score}개 모았어요! 🐚`,
      '🔄 한 번 더', '섬으로 돌아가기'
    );
    if (!this.alive) return;
    if (again) this.app.go('surf');
    else this.app.go('island');
  }

  destroy() {
    this.alive = false;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.bar.destroy();
  }
}

const now2 = () => performance.now() / 1000;
