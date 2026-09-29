// 섞어 풀기 (부화 단계): 순서를 섞은 10문제, 시간 제한 없음.
// 한 번에 맞힌 문제가 7개 이상이면 알이 깨어나요. 맞힐수록 알에 금이 가요.
import { store } from '../core/store.js';
import { h, topbar, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { correctFx } from '../core/juice.js';
import { speakLine, gugudanLine } from '../core/speech.js';
import { shuffle, mixChoices, hintDotsHTML } from '../core/quiz.js';
import { charSVG } from '../graphics/characters.js';

const TOTAL = 10;
const PASS = 7;

// 그 단에서 가장 자주 틀린 문제 (기록 없으면 무작위)
function weakest(dan) {
  let best = 1 + Math.floor(Math.random() * 9);
  let worst = -1;
  for (let n = 1; n <= 9; n++) {
    const f = store.data.facts[`${dan}x${n}`];
    if (!f) continue;
    const rate = f.miss / (f.ok + f.miss);
    if (rate > worst) {
      worst = rate;
      best = n;
    }
  }
  return best;
}

export class MixScene {
  constructor(app, { dan }) {
    this.app = app;
    this.dan = dan;
    this.queue = [...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]), weakest(dan)].map((n) => ({ n, retry: false }));
    this.results = []; // 'ok' | 'retry'
    this.missed = [];
    this.firstTry = 0;
    this.earned = 0;
    this.alive = true;
    this.hatched = store.data.progress[dan] >= 2;
    this.u = unit();
    this.bar = topbar(app, { back: 'map', backLabel: '← 지도', center: `<span class="beads">${'<i></i>'.repeat(TOTAL)}</span>` });
    this.el = h(`
      <div class="scene sea-bg mix">
        <div class="egg-zone">
          <div class="egg-box">${this.eggArt()}</div>
          <div class="egg-note"></div>
        </div>
        <div class="stage-center">
          <div class="mode-label">🫧 ${dan}단 섞어 풀기</div>
          <div class="big-q"></div>
          <div class="feedback"></div>
          <div class="hint"></div>
          <div class="answers four"></div>
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
  }

  eggArt() {
    const size = Math.round(this.u * 20);
    if (this.hatched) return charSVG(this.dan, store.data.progress[this.dan], size);
    const cracks = [
      'M44 40 l6 8 l-4 6', 'M78 46 l-5 7 l5 5', 'M40 70 l8 3 l-2 7', 'M82 74 l-7 2 l3 8',
      'M58 28 l3 8 l-4 5', 'M60 96 l-3 -7 l5 -4', 'M50 58 l10 2 l8 -4 l10 3'
    ];
    return `<div class="crack-wrap">${charSVG(this.dan, 1, size)}
      <svg class="cracks" viewBox="0 0 120 120" width="${size}" height="${size}">
        ${cracks.map((d, i) => `<path class="crack" data-i="${i}" d="${d}" stroke="#5a3b1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`).join('')}
      </svg></div>`;
  }

  mounted() {
    this.next();
  }

  next() {
    if (this.queue.length === 0) return this.finish();
    this.q = this.queue.shift();
    this.miss = 0;
    this.locked = false;
    this.started = Date.now();
    const { dan } = this;
    const { n, retry } = this.q;

    this.el.querySelectorAll('.beads i').forEach((b, k) => {
      b.className = this.results[k] || '';
      if (k === this.results.length && !retry) b.className = 'now';
    });
    this.el.querySelector('.big-q').innerHTML = `${dan} × ${n} = <em>?</em>`;
    this.el.querySelector('.hint').innerHTML = '';
    this.setFeedback(retry ? '아까 그 문제! 이번엔 기억나지?' : '');
    this.el.querySelector('.egg-note').textContent = this.hatched
      ? `한 번에 맞힌 문제 ${this.firstTry}개`
      : `${PASS}개 맞히면 깨어나요 · 지금 ${this.firstTry}개`;

    const box = this.el.querySelector('.answers');
    box.innerHTML = mixChoices(dan, n).map((v) => `<button class="answer bubble-btn" data-v="${v}">${v}</button>`).join('');
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
    const { dan } = this;
    const { n, retry } = this.q;
    const answer = dan * n;

    if (v !== answer) {
      sound.playBoing();
      btn.disabled = true;
      this.miss++;
      if (this.miss === 1 && !retry) {
        store.record(dan, n, false, 0);
        this.missed.push(n);
      }
      if (this.miss === 1) {
        this.setFeedback(`괜찮아! ${dan}개씩 ${n}묶음이야`, 'soft');
        this.el.querySelector('.hint').innerHTML = hintDotsHTML(dan, n);
      } else {
        this.setFeedback(`정답은 ${answer}! 이따가 한 번 더 나올 거야`, 'soft');
        this.el.querySelector(`.answer[data-v="${answer}"]`).classList.add('glow');
      }
      return;
    }

    this.locked = true;
    const clean = this.miss === 0 && !retry;
    correctFx(this, btn, clean);
    btn.classList.add('right');
    store.addStars(1);
    this.earned++;
    if (!retry) {
      if (clean) {
        store.record(dan, n, true, Date.now() - this.started);
        this.firstTry++;
        this.crackEgg();
      }
      this.results.push(clean ? 'ok' : 'retry');
      if (this.miss >= 2) this.queue.push({ n, retry: true });
    }
    this.el.querySelector('.big-q').innerHTML = `${dan} × ${n} = <em class="pop">${answer}</em>`;
    this.setFeedback(`"${gugudanLine(dan, n)}"`, 'good');
    await Promise.all([speakLine(dan, n), new Promise((r) => setTimeout(r, 700))]);
    if (this.alive) this.next();
  }

  crackEgg() {
    const box = this.el.querySelector('.egg-box');
    box.classList.remove('shake');
    void box.offsetWidth;
    box.classList.add('shake');
    this.el.querySelectorAll('.crack').forEach((c) => c.classList.toggle('on', Number(c.dataset.i) < this.firstTry));
    // 금이 갈수록 알이 환하게 빛나고, 절반을 넘으면 혼자 들썩여요
    box.style.setProperty('--glow', Math.min(1, this.firstTry / 7).toFixed(2));
    box.classList.toggle('restless', this.firstTry >= 4);
  }

  finish() {
    const passed = this.firstTry >= PASS;
    store.addGame(this.dan);
    let from = store.data.progress[this.dan];
    let to = from;
    let bonus = 0;
    if (passed) {
      ({ from, to } = store.raiseProgress(this.dan, 2));
      bonus = to > from ? 10 : 3;
      store.addStars(bonus);
    }
    this.app.go('result', {
      dan: this.dan, mode: 'mix', firstTry: this.firstTry, total: TOTAL,
      missed: this.missed, passed, from, to, stars: this.earned + bonus
    });
  }

  destroy() {
    this.alive = false;
    this.bar.destroy();
  }
}
