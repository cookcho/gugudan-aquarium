// 무지개 징검다리: ×1부터 ×9까지 순서대로 외우며 건너요.
// 두 번째 판부터는 이미 건넌 줄의 답을 가려서 앞 줄을 떠올리게 해요.
import { store } from '../core/store.js';
import { h, topbar, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { speakLine, gugudanLine } from '../core/speech.js';
import { stepChoices, hintDotsHTML } from '../core/quiz.js';
import { charSVG, guideSVG } from '../graphics/characters.js';

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
          ${Array.from({ length: 9 }, (_, k) => `<span class="stone" style="left:${12 + k * 9}%"></span>`).join('')}
          <div class="bank right"></div>
          <div class="hero" style="left:4%">${hero}</div>
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
    hero.style.left = `${12 + (n - 1) * 9}%`;
    hero.classList.add('jump');
    setTimeout(() => hero.classList.remove('jump'), 500);

    await Promise.all([speakLine(dan, n), new Promise((r) => setTimeout(r, 800))]);
    if (!this.alive) return;
    if (n < 9) {
      this.n++;
      this.render();
    } else {
      this.finish();
    }
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
