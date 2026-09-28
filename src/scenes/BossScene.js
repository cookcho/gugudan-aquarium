// 상어 보스전 (황금 단계): 맞힐 때마다 내 친구가 물대포를 쏴서 상어 체력을 깎아요. 시간 제한은 없어요.
// 하트 3개(실수 2번까지). 자주 틀린 문제가 더 자주 나와요. 이기면 황금으로 진화해요.
import { store } from '../core/store.js';
import { h, topbar, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { speakLine, gugudanLine } from '../core/speech.js';
import { mixChoices, hintDotsHTML } from '../core/quiz.js';
import { charSVG } from '../graphics/characters.js';
import { SHARK_BODY } from '../graphics/mapArt.js';

const SHARK_HP = 8;
const HEARTS = 3;

// 틀린 적이 많은 문제일수록 더 자주 뽑혀요 (바로 앞 문제는 피해요)
function pickFact(dan, last) {
  const weights = [];
  for (let n = 1; n <= 9; n++) {
    if (n === last) continue;
    const f = store.data.facts[`${dan}x${n}`];
    const missRate = f ? f.miss / (f.ok + f.miss) : 0;
    weights.push([n, 1 + missRate * 3]);
  }
  let r = Math.random() * weights.reduce((s, [, w]) => s + w, 0);
  return weights.find(([, w]) => (r -= w) < 0)?.[0] ?? weights[0][0];
}

export class BossScene {
  constructor(app, { dan }) {
    this.app = app;
    this.dan = dan;
    this.hp = SHARK_HP;
    this.hearts = HEARTS;
    this.firstTry = 0;
    this.asked = 0;
    this.missed = [];
    this.earned = 0;
    this.alive = true;
    this.last = 0;
    this.u = unit();
    const p = Math.max(3, store.data.progress[dan]);
    this.bar = topbar(app, { back: 'map', backLabel: '← 지도', center: '<span class="boss-hearts"></span>' });
    this.el = h(`
      <div class="scene boss-scene">
        <div class="boss-arena">
          <div class="boss-hp"><span>상어 체력</span><div class="boss-hp-bar"><i></i></div></div>
          <div class="boss-hero bob">${charSVG(dan, p, Math.round(this.u * 15))}</div>
          <div class="boss-shark">
            <svg viewBox="-80 -60 160 100" width="${Math.round(this.u * 30)}" height="${Math.round(this.u * 19)}" aria-hidden="true">
              <g transform="scale(-1 1)">${SHARK_BODY}</g>
            </svg>
          </div>
          <div class="boss-shot"></div>
        </div>
        <div class="boss-center">
          <div class="mode-label">🦈 ${dan}단 상어 보스전</div>
          <div class="big-q"></div>
          <div class="feedback"></div>
          <div class="hint"></div>
        </div>
        <div class="answers four-row"></div>
      </div>`);
    this.el.prepend(this.bar.el);
  }

  mounted() {
    this.drawHud();
    this.next();
  }

  drawHud() {
    this.el.querySelector('.boss-hearts').innerHTML = Array.from({ length: HEARTS }, (_, i) => `<b class="${i < this.hearts ? 'on' : ''}">${i < this.hearts ? '💖' : '🤍'}</b>`).join('');
    this.el.querySelector('.boss-hp-bar i').style.width = `${(this.hp / SHARK_HP) * 100}%`;
  }

  next() {
    this.n = pickFact(this.dan, this.last);
    this.last = this.n;
    this.miss = 0;
    this.locked = false;
    this.started = Date.now();
    this.asked++;
    this.el.querySelector('.big-q').innerHTML = `${this.dan} × ${this.n} = <em>?</em>`;
    this.el.querySelector('.hint').innerHTML = '';
    this.setFeedback(this.asked === 1 ? '맞히면 물대포 발사! 💦' : '');
    const box = this.el.querySelector('.answers');
    box.innerHTML = mixChoices(this.dan, this.n).map((v) => `<button class="answer bubble-btn" data-v="${v}">${v}</button>`).join('');
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

  replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  async choose(btn, v) {
    const { dan, n } = this;
    const answer = dan * n;

    if (v !== answer) {
      // 틀리면 상어가 앙! 하트 하나가 줄고, 정답을 알려줘요
      sound.playBoing();
      btn.disabled = true;
      if (this.miss === 0) {
        store.record(dan, n, false, 0);
        this.missed.push(n);
        this.hearts--;
        this.drawHud();
        this.replay(this.el.querySelector('.boss-shark'), 'chomp');
        this.replay(this.el.querySelector('.boss-hero'), 'hurt');
      }
      this.miss++;
      this.el.querySelector('.hint').innerHTML = hintDotsHTML(dan, n);
      this.el.querySelector(`.answer[data-v="${answer}"]`).classList.add('glow');
      if (this.hearts <= 0) {
        this.locked = true;
        this.setFeedback('상어가 너무 세다! 다음엔 이길 수 있어', 'soft');
        setTimeout(() => this.alive && this.finish(false), 1400);
      } else {
        this.setFeedback(`앗, 앙! 정답은 ${answer}이야. 눌러서 계속하자`, 'soft');
      }
      return;
    }

    this.locked = true;
    sound.playCorrect();
    btn.classList.add('right');
    store.addStars(1);
    this.earned++;
    this.el.querySelector('.big-q').innerHTML = `${dan} × ${n} = <em class="pop">${answer}</em>`;
    if (this.miss === 0) {
      // 한 번에 맞히면 물대포로 상어 체력이 줄어요
      store.record(dan, n, true, Date.now() - this.started);
      this.firstTry++;
      this.hp--;
      this.replay(this.el.querySelector('.boss-shot'), 'fire');
      setTimeout(() => {
        if (!this.alive) return;
        sound.playStar();
        this.replay(this.el.querySelector('.boss-shark'), 'hit');
        this.drawHud();
      }, 450);
      this.setFeedback(`💦 명중! "${gugudanLine(dan, n)}"`, 'good');
    } else {
      this.setFeedback(`"${gugudanLine(dan, n)}"`, 'good');
    }
    await Promise.all([speakLine(dan, n), new Promise((r) => setTimeout(r, 1000))]);
    if (!this.alive) return;
    if (this.hp <= 0) this.finish(true);
    else this.next();
  }

  finish(won) {
    store.addGame(this.dan);
    let from = store.data.progress[this.dan];
    let to = from;
    let bonus = 0;
    if (won) {
      ({ from, to } = store.raiseProgress(this.dan, 4));
      bonus = to > from ? 20 : 5;
      store.addStars(bonus);
    }
    this.app.go('result', {
      dan: this.dan, mode: 'boss', firstTry: this.firstTry, total: this.asked,
      missed: this.missed, passed: won, from, to, stars: this.earned + bonus
    });
  }

  destroy() {
    this.alive = false;
    this.bar.destroy();
  }
}
