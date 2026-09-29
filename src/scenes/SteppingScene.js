// 무지개 징검다리: ×1부터 ×9까지 순서대로 외우며 건너요.
// 두 번째 판부터는 이미 건넌 줄의 답을 가려서 앞 줄을 떠올리게 해요.
import { store } from '../core/store.js';
import { h, topbar, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { speakLine, gugudanLine } from '../core/speech.js';
import { stepChoices, hintDotsHTML } from '../core/quiz.js';
import { charSVG, guideSVG } from '../graphics/characters.js';
import confetti from 'canvas-confetti';

// 건넌 돌은 무지개색으로 빛나요 (×1 빨강 … ×9 분홍)
const RAINBOW = ['#FF5A5A', '#FF9A3C', '#FFD23C', '#7ED957', '#3BC9A8', '#3FA9F5', '#5B6CF0', '#A56CF0', '#F26BB5'];
const stoneX = (k) => 12 + k * 9; // k번째 돌 가운데 (%)

export class SteppingScene {
  constructor(app, { dan }) {
    this.app = app;
    this.dan = dan;
    this.n = 1;
    this.firstTry = 0;
    this.missed = [];
    this.earned = 0;
    this.alive = true;
    this.hideMode = store.data.progress[dan] >= 1;
    const u = unit();
    const p = store.data.progress[dan];
    const hero = p >= 2 ? charSVG(dan, p, Math.round(u * 9)) : guideSVG(Math.round(u * 9));
    this.bar = topbar(app, { back: 'map', backLabel: '← 지도', center: `<span class="stones-top">${'<i></i>'.repeat(9)}</span>` });
    this.el = h(`
      <div class="scene sea-bg stepping">
        <ol class="lines"></ol>
        <div class="stage-center">
          <div class="mode-label">🌈 ${dan}단 징검다리${this.hideMode ? ' · 가리기 모드' : ''}</div>
          <div class="big-q"></div>
          <div class="feedback">돌을 톡 눌러서 건너자!</div>
          <div class="hint"></div>
        </div>
        <div class="river">
          <div class="bank left"></div>
          ${Array.from({ length: 9 }, (_, k) => `<span class="stone" style="left:${stoneX(k)}%;--c:${RAINBOW[k]}"></span>`).join('')}
          <div class="bank right"></div>
          <div class="hero" style="left:4.5%">${hero}</div>
        </div>
        <div class="answers three"></div>
      </div>`);
    this.el.prepend(this.bar.el);
  }

  mounted() {
    this.render();
  }

  render() {
    const { dan, n } = this;
    this.miss = 0;
    this.started = Date.now();
    this.locked = false;

    this.el.querySelectorAll('.stones-top i').forEach((s, k) => s.classList.toggle('on', k < n - 1));
    this.el.querySelector('.lines').innerHTML = Array.from({ length: 9 }, (_, k) => {
      const m = k + 1;
      let right = '';
      if (m < n) right = this.hideMode ? '= <span class="hidden-ans">?</span>' : `= ${dan * m}`;
      else if (m === n) right = '= ?';
      return `<li class="${m < n ? 'done' : m === n ? 'now' : ''}"><span>${dan} × ${m}</span><b>${right}</b></li>`;
    }).join('');
    this.el.querySelector('.big-q').innerHTML = `${dan} × ${n} = <em>?</em>`;
    this.el.querySelector('.hint').innerHTML = '';
    this.setFeedback(n === 1 ? '돌을 톡 눌러서 건너자!' : '다음 돌은 뭘까?');

    const box = this.el.querySelector('.answers');
    box.innerHTML = stepChoices(dan, n).map((v) => `<button class="answer stone-btn" data-v="${v}">${v}</button>`).join('');
    box.onclick = (e) => {
      const b = e.target.closest('.answer');
      if (b && !b.disabled && !this.locked) this.choose(b, Number(b.dataset.v));
    };
  }

  setFeedback(text, tone = '') {
    const f = this.el.querySelector('.feedback');
    f.textContent = text;
    f.className = `feedback ${tone}`;
  }

  async choose(btn, v) {
    const { dan, n } = this;
    const answer = dan * n;
    const hero = this.el.querySelector('.hero');

    if (v !== answer) {
      sound.playBoing();
      if (this.miss === 0) {
        store.record(dan, n, false, 0);
        this.missed.push(n);
      }
      this.miss++;
      btn.disabled = true;
      hero.classList.remove('splash');
      void hero.offsetWidth;
      hero.classList.add('splash');
      if (this.miss === 1) {
        this.setFeedback(`앗, 퐁당! ${dan}개씩 ${n}묶음을 세어볼까?`, 'soft');
        this.el.querySelector('.hint').innerHTML = hintDotsHTML(dan, n);
      } else {
        this.setFeedback(`정답은 ${answer}이야. 같이 눌러보자!`, 'soft');
        this.el.querySelector(`.answer[data-v="${answer}"]`).classList.add('glow');
      }
      return;
    }

    this.locked = true;
    if (this.miss === 0) {
      store.record(dan, n, true, Date.now() - this.started);
      this.firstTry++;
    }
    sound.playCorrect();
    store.addStars(1);
    this.earned++;
    btn.classList.add('right');
    this.el.querySelector('.big-q').innerHTML = `${dan} × ${n} = <em class="pop">${answer}</em>`;
    this.setFeedback(`"${gugudanLine(dan, n)}"`, 'good');
    hero.classList.remove('splash');
    hero.style.left = `${stoneX(n - 1)}%`;
    hero.classList.add('jump');
    setTimeout(() => hero.classList.remove('jump'), 500);
    setTimeout(() => this.alive && this.land(n - 1), 300);

    await Promise.all([speakLine(dan, n), new Promise((r) => setTimeout(r, 800))]);
    if (!this.alive) return;
    if (n < 9) {
      this.n++;
      this.render();
    } else {
      await this.arrive();
      if (this.alive) this.finish();
    }
  }

  // 돌에 착지: 돌이 살짝 가라앉고 물방울이 튀고, 무지개색으로 빛나요
  land(k) {
    const stone = this.el.querySelectorAll('.stone')[k];
    stone.classList.add('lit');
    stone.classList.remove('land');
    void stone.offsetWidth;
    stone.classList.add('land');
    const river = this.el.querySelector('.river');
    const ring = h(`<i class="step-ring" style="left:${stoneX(k)}%"></i>`);
    river.appendChild(ring);
    setTimeout(() => ring.remove(), 800);
    for (let i = 0; i < 6; i++) {
      const dx = (i - 2.5) * 1.2 + (Math.random() - 0.5);
      const drop = h(`<i class="step-drop" style="left:${stoneX(k)}%;--dx:${dx.toFixed(2)};--dy:${(2.5 + Math.random() * 2).toFixed(2)}"></i>`);
      river.appendChild(drop);
      setTimeout(() => drop.remove(), 700);
    }
  }

  // 마지막 돌을 건너면 오른쪽 땅에 도착해서 만세!
  async arrive() {
    const hero = this.el.querySelector('.hero');
    hero.style.left = '95.5%';
    hero.classList.add('jump');
    await new Promise((r) => setTimeout(r, 550));
    if (!this.alive) return;
    hero.classList.remove('jump');
    hero.classList.add('cheer');
    sound.playFanfare();
    this.setFeedback('도착! 만세! 🎉', 'good');
    const r = hero.getBoundingClientRect();
    const o = { x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight };
    confetti({ particleCount: 90, spread: 80, origin: o, zIndex: 300 });
    setTimeout(() => this.alive && confetti({ particleCount: 60, spread: 110, origin: o, zIndex: 300 }), 400);
    await new Promise((r2) => setTimeout(r2, 1800));
  }

  finish() {
    store.addStars(3);
    store.addGame(this.dan);
    const { from, to } = store.raiseProgress(this.dan, 1);
    this.app.go('result', {
      dan: this.dan, mode: 'stepping', firstTry: this.firstTry, total: 9,
      missed: this.missed, passed: true, from, to, stars: this.earned + 3
    });
  }

  destroy() {
    this.alive = false;
    this.bar.destroy();
  }
}
