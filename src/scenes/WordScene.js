// 두 번째 바다의 문장제 게임. 아이가 직접 읽고 풀어요 (🔊를 누를 때만 읽어 줘요). 숫자와 핵심 낱말은 색으로 표시해요.
// 단계: 알 찾기·부화는 보기 고르기, 성장·황금(해적 선장 보스)은 숫자판에 직접 써요.
// 틀리면 1번째: 묶음 그림 + 첫 계산 힌트, 2번째: 풀이 전체. 틀린 이유를 "문장 이해"와 "계산"으로 나눠 기록해요.
import confetti from 'canvas-confetti';
import { store } from '../core/store.js';
import { h, topbar, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { speak, stopSpeaking } from '../core/speech.js';
import { hintDotsHTML, shuffle } from '../core/quiz.js';
import { correctFx } from '../core/juice.js';
import { SEA2, SEA2_STAGES } from '../data/sea2.js';
import { WORD_ISLANDS, makeProblem } from '../data/wordProblems.js';
import { sea2Art } from '../graphics/sea2.js';

const HEARTS = 3;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// 숫자와 계산에 필요한 낱말을 색으로 표시해요
function highlight(text) {
  return esc(text)
    .replace(/(\d+)/g, '<b class="wn">$1</b>')
    .replace(/(씩|배|모두|남은|남았|더 많|더|몇)/g, '<u class="wk">$1</u>');
}

// 보기: 정답과 헷갈리기 쉬운 수 3개 (풀이 중간값, 더하기 실수, ±1·2)
function choicesFor(p) {
  const mids = p.steps.flatMap((s) => (s.match(/\d+/g) || []).map(Number));
  const pool = [...mids, p.a + p.b, p.answer + 1, p.answer - 1, p.answer + 2, p.answer - 2, p.answer + 10, p.answer - 10];
  const wrong = shuffle([...new Set(pool.filter((v) => v > 0 && v !== p.answer))]).slice(0, 3);
  return shuffle([p.answer, ...wrong]);
}

export class WordScene {
  constructor(app, { island, stage }) {
    this.app = app;
    this.i = island;
    this.isl = SEA2[island];
    this.cfg = SEA2_STAGES[stage];
    this.stageIndex = stage;
    this.word = WORD_ISLANDS[this.isl.word];
    this.alive = true;
    this.u = unit();
    const allowed = store.goldDans().length ? store.goldDans() : [2, 3, 4, 5, 6, 7, 8, 9];
    this.problems = Array.from({ length: this.cfg.count + (this.cfg.boss ? HEARTS : 0) }, () => makeProblem(this.isl.word, allowed, { kid: store.data.kidName }));
    this.idx = 0;
    this.firstTry = 0;
    this.earned = 0;
    this.hearts = HEARTS;
    this.hp = this.cfg.count; // 보스 체력
    const beads = this.cfg.boss ? '<span class="boss-hearts"></span>' : `<span class="beads">${'<i></i>'.repeat(this.cfg.count)}</span>`;
    this.bar = topbar(app, { back: 'sea2', backLabel: '← 두 번째 바다', center: beads });
    const art = this.cfg.boss
      ? '<div class="word-captain" aria-hidden="true">🏴‍☠️</div>'
      : sea2Art(this.isl.id, Math.max(1, store.progress2(this.isl.id)), Math.round(this.u * 13), this.word.icon);
    this.el = h(`
      <div class="scene sea-bg word-scene ${this.cfg.boss ? 'word-boss' : ''}">
        <div class="word-side">
          <div class="word-art bob">${art}</div>
          ${this.cfg.boss ? '<div class="boss-hp"><span>해적 선장 체력</span><div class="boss-hp-bar"><b></b><i></i></div></div>' : ''}
          <button class="btn btn-foam word-listen" data-act="listen">🔊 읽어 주기</button>
        </div>
        <div class="word-main">
          <div class="mode-label">${this.word.icon} ${esc(this.word.name)} · ${this.cfg.icon} ${esc(this.cfg.label)}</div>
          <div class="word-card"><p class="word-q"></p></div>
          <div class="word-hint"></div>
          <div class="feedback"></div>
          <div class="word-answer"></div>
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="listen"]')) {
        sound.playPop();
        speak(this.p.text);
      }
    });
  }

  mounted() {
    this.drawHud();
    this.next();
  }

  drawHud() {
    if (this.cfg.boss) {
      this.el.querySelector('.boss-hearts').innerHTML = Array.from({ length: HEARTS }, (_, k) => `<b>${k < this.hearts ? '💖' : '🤍'}</b>`).join('');
      const w = `${(this.hp / this.cfg.count) * 100}%`;
      this.el.querySelector('.boss-hp-bar i').style.width = w;
      this.el.querySelector('.boss-hp-bar b').style.width = w;
    }
  }

  next() {
    this.p = this.problems[this.idx];
    this.miss = 0;
    this.locked = false;
    this.el.querySelector('.word-q').innerHTML = highlight(this.p.text);
    this.el.querySelector('.word-hint').innerHTML = '';
    this.setFeedback(this.idx === 0 ? '문제를 천천히 읽고, 색칠된 숫자를 봐요!' : '');
    const box = this.el.querySelector('.word-answer');
    if (this.cfg.input === 'choice') {
      box.className = 'word-answer answers four-row';
      box.innerHTML = choicesFor(this.p).map((v) => `<button class="answer bubble-btn" data-v="${v}">${v}</button>`).join('');
      box.onclick = (e) => {
        const b = e.target.closest('.answer');
        if (b && !b.disabled && !this.locked) this.check(Number(b.dataset.v), b);
      };
    } else {
      this.typed = '';
      box.className = 'word-answer word-keypad';
      box.innerHTML = `
        <div class="kp-input"><span class="kp-typed"></span><span class="kp-caret"></span></div>
        <div class="word-keys">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button class="kp-key" data-k="${k}">${k}</button>`).join('')}
          <button class="kp-key small" data-k="del">⌫</button>
          <button class="kp-key" data-k="0">0</button>
          <button class="kp-key ok" data-k="ok">확인</button>
        </div>`;
      box.onclick = (e) => {
        const k = e.target.closest('[data-k]')?.dataset.k;
        if (!k || this.locked) return;
        if (k === 'ok') {
          if (this.typed) this.check(Number(this.typed), box.querySelector('.kp-input'));
          return;
        }
        sound.playPop();
        this.typed = k === 'del' ? this.typed.slice(0, -1) : (this.typed + k).slice(0, 3);
        box.querySelector('.kp-typed').textContent = this.typed;
      };
    }
  }

  setFeedback(text, tone = '') {
    const f = this.el.querySelector('.feedback');
    f.textContent = text;
    f.className = `feedback ${tone}`;
  }

  // 틀린 이유: 풀이 중간값이나 a+b를 냈으면 문장을 잘못 이해한 것, 아니면 계산 실수
  missKind(v) {
    const mids = this.p.steps.slice(0, -1).flatMap((s) => (s.match(/\d+/g) || []).map(Number));
    return mids.includes(v) || v === this.p.a + this.p.b ? 'read' : 'calc';
  }

  async check(v, el) {
    const { p } = this;
    if (v !== p.answer) {
      sound.playBoing();
      if (this.miss === 0) store.recordWord(this.isl.id, this.missKind(v));
      this.miss++;
      if (el.classList.contains('answer')) el.disabled = true;
      if (this.cfg.input === 'keypad') {
        this.typed = '';
        this.el.querySelector('.kp-typed').textContent = '';
      }
      if (this.cfg.boss && this.miss === 1) {
        this.hearts--;
        this.drawHud();
        if (this.hearts <= 0) return this.finish(false);
      }
      const hint = this.el.querySelector('.word-hint');
      if (this.miss === 1) {
        hint.innerHTML = `${p.a * p.b <= 45 ? hintDotsHTML(p.a, p.b) : ''}<p class="word-step">먼저 <b>${esc(p.steps[0].split("=")[0].trim())}</b>부터 계산해 봐!</p>`;
        this.setFeedback('괜찮아! 그림과 힌트를 봐요', 'soft');
      } else {
        hint.innerHTML = `<p class="word-step">풀이: ${esc(p.steps.join('  →  '))}</p>`;
        this.setFeedback(`정답은 ${p.answer}이야. 같이 해 보자!`, 'soft');
        this.el.querySelector(`.answer[data-v="${p.answer}"]`)?.classList.add('glow');
      }
      return;
    }

    this.locked = true;
    const clean = this.miss === 0;
    correctFx(this, el, clean);
    if (clean) {
      this.firstTry++;
      store.recordWord(this.isl.id, 'ok');
      if (this.cfg.boss) {
        this.hp--;
        this.drawHud();
        this.replay(this.el.querySelector('.word-captain'), 'hit');
      }
    }
    store.addStars(1);
    this.earned++;
    el.classList?.add('right');
    const beads = this.el.querySelectorAll('.beads i');
    if (beads[this.idx]) beads[this.idx].className = clean ? 'ok' : 'retry';
    this.el.querySelector('.word-hint').innerHTML = `<p class="word-step">풀이: ${esc(p.steps.join('  →  '))}</p>`;
    this.setFeedback(`정답! ${p.answer} 🎉`, 'good');
    await wait(1700);
    if (!this.alive) return;
    this.idx++;
    const done = this.cfg.boss ? this.hp <= 0 || this.idx >= this.problems.length : this.idx >= this.cfg.count;
    if (done) this.finish(this.cfg.boss ? this.hp <= 0 : this.firstTry >= this.cfg.pass);
    else this.next();
  }

  replay(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  finish(passed) {
    this.locked = true;
    stopSpeaking();
    store.addGame(0);
    const { from, to } = passed ? store.raiseProgress2(this.isl.id, this.cfg.to) : { from: store.progress2(this.isl.id), to: store.progress2(this.isl.id) };
    const grew = to > from;
    const bonus = passed ? (grew ? (this.cfg.boss ? 20 : 5) : 2) : 0;
    if (bonus) store.addStars(bonus);
    const f = this.isl.friend;
    const title = !passed
      ? (this.cfg.boss ? '해적 선장이 도망갔어요! 다시 도전!' : `${this.cfg.pass}개 맞히면 돼요. 조금만 더!`)
      : grew ? ['', `${f.name}의 알을 찾았어요!`, `${f.name}가 깨어났어요!`, `${f.name}가 쑥쑥 자랐어요!`, `황금 ${f.name}가 됐어요!`][to] : '잘했어요!';
    const size = Math.round(this.u * 18);
    const art = sea2Art(this.isl.id, Math.max(1, grew ? to : from), size, this.word.icon);
    const el = h(`
      <div class="overlay">
        <div class="sheet small center word-result">
          <h2 class="sheet-title">${esc(title)}</h2>
          <div class="word-result-art ${grew ? 'pop' : ''}">${art}</div>
          <p class="sheet-msg">한 번에 맞힌 문제 ${this.firstTry} / ${this.idx} · ⭐ +${this.earned + bonus}</p>
          <div class="row">
            <button class="btn btn-foam" data-go="again">🔄 다시 하기</button>
            <button class="btn btn-coral" data-go="sea2">⛵ 바다 지도로</button>
          </div>
        </div>
      </div>`);
    el.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]')?.dataset.go;
      if (!go) return;
      sound.playPop();
      if (go === 'again') this.app.go('word', { island: this.i, stage: this.stageIndex });
      else this.app.go('sea2', { island: this.i });
    });
    document.getElementById('app').appendChild(el);
    if (passed) {
      sound.playFanfare();
      confetti({ particleCount: grew ? 140 : 70, spread: 90, origin: { y: 0.45 }, zIndex: 300 });
    } else sound.playBoing();
  }

  destroy() {
    this.alive = false;
    stopSpeaking();
    this.bar.destroy();
  }
}
