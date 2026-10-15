// 🏄 돌고래 파도타기: 파도를 달리며 해파리를 뛰어넘는 달리기 게임이에요.
// 화면을 누르면 점프 — 해파리 위에 뜬 조개는 뛰어넘으면서 저절로 주워져요.
// 하트 3개를 다 잃으면 끝. 뛰어넘은 수가 점수고, 모은 조개는 섬에서 써요.
import { store } from '../core/store.js';
import { h, topbar, unit, floatUp, confirmBox } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { sea2Art } from '../graphics/sea2.js';
import confetti from 'canvas-confetti';

const HEARTS = 3;
const HIT_SAFE = 1.4; // 부딪힌 뒤 잠깐 무적 (초)
// 점프: 높이 약 20u, 공중에 약 1.35초 — 해파리를 넉넉히(1.7배 여유) 넘어요
const JUMP_V = -58; // × u
const GRAVITY = 85; // × u
const SPEED0 = 17; // × u (초당)
const SPEED_MAX = 24;
// 충돌 판정은 그림보다 작게 (그림 둘레의 빈 곳까지 닿으면 억울해요)
const RIDER_W = 0.32;
const RIDER_H = 0.3;
const JELLY_W = 0.28;
const JELLY_H = 0.28;
const SHELL_UP = 14.5; // 조개가 물 위로 뜬 높이 (× u) — 점프 꼭대기(약 20u)보다 낮아요
const GAP0 = 2.6; // 해파리 사이 간격(초)
const GAP_MIN = 1.7;

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
            <path class="sw a" d="M-120 30 q25 -14 50 0${' t50 0'.repeat(15)} V60 H-120Z" fill="rgba(255,255,255,.18)"/>
            <path class="sw b" d="M-120 40 q25 -12 50 0${' t50 0'.repeat(15)} V60 H-120Z" fill="rgba(255,255,255,.14)"/>
          </svg>
        </div>
        <div class="surf-field"></div>
        <div class="surf-rider"></div>
        <div class="surf-hud">
          <span class="surf-pill surf-hearts"></span>
          <span class="surf-pill">🏄 <b class="surf-score">0</b></span>
          <span class="surf-pill">🐚 <b class="surf-shell">0</b></span>
          <span class="surf-pill best">🏅 최고 <b>${store.data.surfBest || 0}</b></span>
        </div>
        <div class="surf-ready">
          <div class="surf-ready-card">
            <h2>🏄 돌고래 파도타기</h2>
            <p>화면을 누르면 돌돌이가 <b>높이 폴짝!</b><br>해파리를 뛰어넘고, 위에 뜬 🐚 조개도 주워요.<br>💗 세 개를 다 잃으면 끝이에요.</p>
            <button class="btn btn-coral btn-big" data-surf="go">시작!</button>
          </div>
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.field = this.el.querySelector('.surf-field');
    this.riderEl = this.el.querySelector('.surf-rider');
    this.size = Math.round(this.u * 11);
    this.riderEl.innerHTML = sea2Art('compare', Math.max(2, store.progress2('compare')) || 2, this.size);
    this.riderEl.style.transform = `translate(${this.u * 10}px, ${this.u * 26}px)`;
    this.drawHearts(HEARTS);
    this.el.querySelector('[data-surf="go"]').addEventListener('click', () => this.start());
  }

  drawHearts(n) {
    this.el.querySelector('.surf-hearts').innerHTML = Array.from({ length: HEARTS }, (_, i) => `<span class="${i < n ? '' : 'gone'}">💗</span>`).join('');
  }

  start() {
    sound.playWhoosh();
    this.el.querySelector('.surf-ready').remove();
    this.playing = true;
    this.score = 0;
    this.shells = 0;
    this.hearts = HEARTS;
    this.safe = 0;
    this.items = [];
    this.spawnIn = 1.6;
    this.waterY = this.el.clientHeight * 0.64;
    this.rider = { y: this.waterY, vy: 0, rot: 0, air: false };
    this.drawHearts(this.hearts);
    this.el.addEventListener('pointerdown', (e) => {
      if (!this.playing || e.target.closest('.topbar')) return;
      if (this.rider.air) return;
      this.rider.vy = JUMP_V * this.u;
      this.rider.air = true;
      sound.playPop();
    });
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

  // 지금 빠르기: 뛰어넘을수록 조금씩 빨라져요 (너무 빨라지지 않게 상한)
  speed() {
    return this.u * Math.min(SPEED_MAX, SPEED0 + this.score * 0.35);
  }

  step(dt) {
    const W = this.el.clientWidth;
    const r = this.rider;
    const u = this.u;
    this.safe = Math.max(0, this.safe - dt);

    // 돌고래: 높이 뛰었다가 파도 위로 내려앉아요
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
    }
    r.rot = r.air ? Math.max(-30, Math.min(32, (r.vy / u) * 0.9)) : Math.sin(performance.now() / 320) * 5;
    this.riderEl.classList.toggle('safe', this.safe > 0);
    this.riderEl.style.transform = `translate(${W * 0.22 - this.size / 2}px, ${r.y - this.size / 2}px) rotate(${r.rot}deg)`;

    // 해파리 만들기
    const sp = this.speed();
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnIn = Math.max(GAP_MIN, GAP0 - this.score * 0.02) + Math.random() * 0.5;
      this.spawn(W);
    }

    // 흘러오기 · 부딪힘 · 뛰어넘기
    const rx = W * 0.22;
    const rw = this.size * RIDER_W;
    const rh = this.size * RIDER_H;
    for (const it of this.items) {
      it.x -= sp * dt;
      it.el.style.transform = `translate(${it.x}px, ${it.y}px)`;
      // 머리 위 조개 줍기
      if (it.shell && !it.got) {
        const sx = it.x + it.w / 2;
        const sy = this.waterY - u * SHELL_UP; // 조개는 점프 높이에 떠 있어요
        if (Math.abs(sx - rx) < rw + u * 2.5 && Math.abs(sy - r.y) < rh + u * 3.5) {
          it.got = true;
          it.shellEl.classList.add('got');
          this.shells += 1;
          this.el.querySelector('.surf-shell').textContent = this.shells;
          sound.playStar();
          floatUp(this.el, sx, sy, '🐚 +1');
        }
      }
      // 부딪힘 (네모끼리 겹치면)
      if (!it.hit && !this.safe) {
        const ox = it.x + it.w / 2;
        const oy = it.y + it.h / 2;
        if (Math.abs(ox - rx) < rw + it.w * JELLY_W && Math.abs(oy - r.y) < rh + it.h * JELLY_H) {
          it.hit = true;
          this.bump(it);
        }
      }
      // 무사히 지나가면 점수
      if (!it.passed && it.x + it.w < rx - rw) {
        it.passed = true;
        if (!it.hit) {
          this.score += 1;
          this.el.querySelector('.surf-score').textContent = this.score;
        }
      }
      if (it.x < -it.w * 2) it.dead = true;
    }
    for (const it of this.items.filter((o) => o.dead)) it.el.remove();
    this.items = this.items.filter((o) => !o.dead);
  }

  spawn(W) {
    const u = this.u;
    const w = Math.round(u * 7);
    const jh = Math.round(u * 8);
    const withShell = Math.random() < 0.75;
    const el = h(`<div class="surf-jelly" style="width:${w}px;height:${jh}px">
      <svg viewBox="0 0 60 70" aria-hidden="true">
        <path d="M6 30 Q6 6 30 6 Q54 6 54 30 Q42 38 30 30 Q18 38 6 30Z" fill="#C9A4FF" stroke="#8A6BD8" stroke-width="3"/>
        <g stroke="#8A6BD8" stroke-width="3" fill="none" stroke-linecap="round"><path d="M16 34 q-5 14 0 28"/><path d="M30 34 q6 16 0 32"/><path d="M44 34 q-5 14 0 28"/></g>
        <g fill="#5A3E8A"><circle cx="23" cy="22" r="3"/><circle cx="37" cy="22" r="3"/></g>
      </svg>
      ${withShell ? `<i class="surf-shellbit" style="bottom:${Math.round(jh * 0.45 + u * (SHELL_UP - 1.5))}px">🐚</i>` : ''}
    </div>`);
    this.field.appendChild(el);
    this.items.push({ el, shellEl: el.querySelector('.surf-shellbit'), shell: withShell, x: W + w, y: this.waterY - jh * 0.55, w, h: jh });
  }

  bump(it) {
    this.hearts -= 1;
    this.safe = HIT_SAFE;
    this.drawHearts(this.hearts);
    sound.playBoing();
    it.el.classList.add('got');
    this.el.classList.remove('bump');
    void this.el.offsetWidth;
    this.el.classList.add('bump');
    floatUp(this.el, it.x + it.w / 2, it.y, '💫');
    if (this.hearts <= 0) this.finish();
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
      `${newBest ? '🏅 새 최고 기록!<br>' : ''}해파리를 <b>${this.score}</b>마리 뛰어넘었어요! 🏄<br>조개 ${this.shells}개를 얻었어요 🐚`,
      '🔄 한 번 더', '섬으로 돌아가기'
    );
    if (!this.alive) return;
    this.app.go(again ? 'surf' : 'island');
  }

  destroy() {
    this.alive = false;
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.bar.destroy();
  }
}
