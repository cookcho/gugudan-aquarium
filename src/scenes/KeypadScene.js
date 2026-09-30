// 조개 숫자판 (성장 단계): 보기 없이 숫자판으로 답을 직접 입력해요. 시간 제한은 없어요.
// 맞힐 때마다 조개에 진주가 하나씩 모이고, 한 번에 맞힌 문제가 7개 이상이면 친구가 자라요.
// 오늘의 복습(ReviewScene)도 이 화면을 그대로 써요.
import { store } from '../core/store.js';
import { h, topbar, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { correctFx } from '../core/juice.js';
import { speakLine, gugudanLine } from '../core/speech.js';
import { shuffle, hintDotsHTML } from '../core/quiz.js';
import { charSVG, guideSVG } from '../graphics/characters.js';

const PASS = 7;
const HINT_AFTER_MS = 5000;

function clamSVG(size, open) {
  return `
    <svg class="clam ${open ? 'open' : ''}" width="${size}" height="${size}" viewBox="0 0 120 100" aria-hidden="true">
      <path class="clam-bottom" d="M10 60 Q60 100 110 60 L104 70 Q60 104 16 70Z" fill="#B48CD8" stroke="#7E57B0" stroke-width="3"/>
      <circle class="clam-pearl" cx="60" cy="66" r="11" fill="#FFFDF5" stroke="#E9E0FF" stroke-width="2"/>
      <g class="clam-top"><path d="M10 60 Q12 16 60 12 Q108 16 110 60 Q60 40 10 60Z" fill="#D7BDF0" stroke="#7E57B0" stroke-width="3"/>
      <path d="M60 14 V46 M40 18 L48 48 M80 18 L72 48 M24 32 L38 52 M96 32 L82 52" stroke="#9E74C8" stroke-width="2.5"/></g>
    </svg>`;
}

export class KeypadScene {
  constructor(app, { dan }) {
    this.app = app;
    this.dan = dan;
    this.practice = store.isPractice(dan, 'keypad'); // 황금 섬이면 연습 (하루 한 판)
    this.setup(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).map((n) => ({ dan, n })), `🐚 ${dan}단 조개 숫자판`);
  }

  // questions: [{ dan, n }]
  setup(questions, label) {
    this.questions = questions;
    this.total = questions.length;
    this.idx = 0;
    this.firstTry = 0;
    this.missed = [];
    this.earned = 0;
    this.alive = true;
    this.u = unit();
    const back = this.backTo || 'map';
    this.bar = topbar(this.app, { back, backLabel: back === 'home' ? '← 어항' : '← 지도', center: `<span class="pearls">${'<i></i>'.repeat(this.total)}</span>` });
    this.el = h(`
      <div class="scene sea-bg keypad-scene">
        <div class="kp-left">
          <div class="mode-label">${label}</div>
          <div class="kp-buddy">
            <div class="kp-friend bob"></div>
            <div class="kp-clam">${clamSVG(Math.round(this.u * 12), false)}</div>
          </div>
          <div class="big-q"></div>
          <div class="kp-input"><span class="kp-typed"></span><span class="kp-caret"></span></div>
          <div class="feedback"></div>
          <div class="hint"></div>
          <button class="btn btn-foam kp-hint" data-k="hint" hidden>💡 힌트 보기</button>
        </div>
        <div class="kp-pad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button class="kp-key" data-k="${k}">${k}</button>`).join('')}
          <button class="kp-key small" data-k="del">⌫ 지우기</button>
          <button class="kp-key" data-k="0">0</button>
          <button class="kp-key ok" data-k="ok">확인</button>
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.el.addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]')?.dataset.k;
      if (k) this.press(k);
    });
  }

  mounted() {
    this.next();
  }

  // 문제마다 그 단의 친구가 물어봐요 (아직 부화 전이면 뽀글이)
  friendArt(dan) {
    const p = store.data.progress[dan];
    const size = Math.round(this.u * 11);
    return p >= 2 ? charSVG(dan, p, size) : guideSVG(size);
  }

  next() {
    if (this.idx >= this.total) return this.finish();
    const q = this.questions[this.idx];
    this.qdan = q.dan;
    this.n = q.n;
    this.typed = '';
    this.miss = 0;
    this.locked = false;
    this.started = Date.now();
    this.el.querySelector('.kp-friend').innerHTML = this.friendArt(q.dan);
    this.el.querySelector('.big-q').innerHTML = `${q.dan} × ${q.n} = <em>?</em>`;
    this.el.querySelector('.hint').innerHTML = '';
    this.el.querySelector('.kp-hint').hidden = true;
    this.el.querySelector('.kp-clam').innerHTML = clamSVG(Math.round(this.u * 12), false);
    this.setFeedback(this.idx === 0 ? '숫자를 눌러서 답을 써 봐!' : '');
    this.showTyped();
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      if (this.alive && !this.locked) this.el.querySelector('.kp-hint').hidden = false;
    }, HINT_AFTER_MS);
  }

  setFeedback(text, tone = '') {
    const f = this.el.querySelector('.feedback');
    f.textContent = text;
    f.className = `feedback ${tone}`;
  }

  showTyped(bump = false) {
    const t = this.el.querySelector('.kp-typed');
    t.textContent = this.typed;
    if (bump) {
      t.classList.remove('bump');
      void t.offsetWidth;
      t.classList.add('bump');
    }
  }

  press(k) {
    if (this.locked) return;
    if (k === 'hint') {
      sound.playPop();
      this.el.querySelector('.hint').innerHTML = hintDotsHTML(this.qdan, this.n);
      this.el.querySelector('.kp-hint').hidden = true;
      return;
    }
    if (k === 'del') {
      sound.playPop();
      this.typed = this.typed.slice(0, -1);
    } else if (k === 'ok') {
      if (this.typed) this.check();
      return;
    } else if (this.typed.length < 2) {
      sound.playPop();
      this.typed += k;
      return this.showTyped(true);
    }
    this.showTyped();
  }

  async check() {
    const dan = this.qdan;
    const { n } = this;
    const answer = dan * n;
    if (Number(this.typed) !== answer) {
      sound.playBoing();
      const box = this.el.querySelector('.kp-input');
      box.classList.remove('shake');
      void box.offsetWidth;
      box.classList.add('shake');
      if (this.miss === 0) {
        store.record(dan, n, false, 0);
        this.missed.push(`${dan}×${n}`);
      }
      this.miss++;
      this.typed = '';
      this.showTyped();
      this.el.querySelector('.hint').innerHTML = hintDotsHTML(dan, n);
      this.el.querySelector('.kp-hint').hidden = true;
      if (this.miss === 1) this.setFeedback(`아깝다! ${dan}개씩 ${n}묶음을 세어 볼까?`, 'soft');
      else this.setFeedback(`정답은 ${answer}이야. 같이 눌러 보자!`, 'soft');
      return;
    }

    this.locked = true;
    clearTimeout(this.hintTimer);
    if (this.miss === 0) {
      store.record(dan, n, true, Date.now() - this.started);
      this.firstTry++;
    }
    correctFx(this, this.el.querySelector('.kp-clam'), this.miss === 0);
    store.addStars(1);
    this.earned++;
    const clam = this.el.querySelector('.kp-clam');
    clam.innerHTML = clamSVG(Math.round(this.u * 12), true);
    clam.classList.remove('shine');
    void clam.offsetWidth;
    clam.classList.add('shine');
    this.el.querySelectorAll('.pearls i').forEach((b, i) => {
      if (i === this.idx) b.className = this.miss === 0 ? 'ok' : 'retry';
    });
    this.el.querySelector('.big-q').innerHTML = `${dan} × ${n} = <em class="pop">${answer}</em>`;
    this.setFeedback(`"${gugudanLine(dan, n)}"`, 'good');
    await Promise.all([speakLine(dan, n), new Promise((r) => setTimeout(r, 900))]);
    if (!this.alive) return;
    this.idx++;
    this.next();
  }

  finish() {
    const passed = this.firstTry >= PASS;
    store.addGame(this.dan);
    if (this.practice) store.markPractice(this.dan);
    let from = store.data.progress[this.dan];
    let to = from;
    let bonus = 0;
    if (passed) {
      ({ from, to } = store.raiseProgress(this.dan, 3));
      bonus = to > from ? 12 : 3;
      store.addStars(bonus);
    }
    this.app.go('result', {
      dan: this.dan, mode: 'keypad', firstTry: this.firstTry, total: this.total,
      missed: this.missed, passed, from, to, stars: this.earned + bonus
    });
  }

  destroy() {
    this.alive = false;
    clearTimeout(this.hintTimer);
    this.bar.destroy();
  }
}
