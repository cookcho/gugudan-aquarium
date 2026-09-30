// 두 번째 바다의 문장제 게임. 아이가 직접 읽고 풀어요 (🔊를 누를 때만 읽어 줘요). 숫자와 핵심 낱말은 색으로 표시해요.
// 단계: 알 찾기·부화는 보기 고르기, 성장·황금(해적 선장 보스)은 숫자판에 직접 써요.
// 틀리면 1번째: 묶음 그림 + 첫 계산 힌트, 2번째: 풀이 전체. 틀린 이유를 "문장 이해"와 "계산"으로 나눠 기록하고,
// 틀린 문제 유형은 "문장제 복습"(review) 목록에 모아요.
import confetti from 'canvas-confetti';
import { store } from '../core/store.js';
import { h, topbar, unit, floatUp } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { speak, stopSpeaking } from '../core/speech.js';
import { hintDotsHTML, shuffle } from '../core/quiz.js';
import { correctFx } from '../core/juice.js';
import { SEA2, SEA2_STAGES } from '../data/sea2.js';
import { WORD_ISLANDS, makeProblem } from '../data/wordProblems.js';
import { sea2Art } from '../graphics/sea2.js';
import { hasImage, imageArt, guideSVG } from '../graphics/characters.js';

const HEARTS = 3;
const REVIEW = { icon: '📅', label: '문장제 복습', count: 5, pass: 3, input: 'keypad' };
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
  constructor(app, { island = 0, stage = 0, review = false }) {
    this.app = app;
    this.review = review;
    this.i = island;
    this.isl = SEA2[island];
    this.stageIndex = stage;
    this.alive = true;
    this.u = unit();
    const allowed = store.goldDans().length ? store.goldDans() : [2, 3, 4, 5, 6, 7, 8, 9];
    const kid = store.data.kidName;
    if (review) {
      // 복습: 틀렸던 유형을 숫자만 바꿔서 다시 풀어요
      const list = (store.data.wordMisses || []).slice(0, REVIEW.count);
      this.problems = list.map((m) => makeProblem(m.word, allowed, { kid, template: m.template }));
      this.cfg = { ...REVIEW, count: this.problems.length, pass: Math.ceil(this.problems.length * 0.6) };
      this.label = `${REVIEW.icon} ${REVIEW.label}`;
    } else {
      this.cfg = SEA2_STAGES[stage];
      const word = WORD_ISLANDS[this.isl.word];
      this.problems = Array.from({ length: this.cfg.count + (this.cfg.boss ? HEARTS : 0) }, () => makeProblem(this.isl.word, allowed, { kid }));
      this.label = `${word.icon} ${esc(word.name)} · ${this.cfg.icon} ${esc(this.cfg.label)}`;
    }
    this.idx = 0;
    this.firstTry = 0;
    this.earned = 0;
    this.hearts = HEARTS;
    this.hp = this.cfg.count; // 보스 체력
    this.angry = false;
    const boss = this.cfg.boss;
    const beads = boss ? '<span class="boss-hearts"></span>' : `<span class="beads">${'<i></i>'.repeat(this.cfg.count)}</span>`;
    this.bar = topbar(app, { back: 'sea2', backLabel: '← 두 번째 바다', center: beads });
    let art;
    if (boss) art = `<div class="word-captain ${boss ? 'entering' : ''}" aria-hidden="true">${hasImage('boss-captain') ? imageArt('boss-captain', Math.round(this.u * 16)) : '🏴‍☠️'}</div>`;
    else if (review) art = guideSVG(Math.round(this.u * 12));
    else art = sea2Art(this.isl.id, Math.max(1, store.progress2(this.isl.id)), Math.round(this.u * 13), WORD_ISLANDS[this.isl.word].icon);
    this.el = h(`
      <div class="scene sea-bg word-scene ${boss ? 'word-boss' : ''}">
        <div class="word-side">
          <div class="word-art ${boss ? '' : 'bob'}">${art}</div>
          ${boss ? '<div class="boss-hp"><span>해적 선장 체력</span><div class="boss-hp-bar"><b></b><i></i></div></div>' : ''}
          <button class="btn btn-foam word-listen" data-act="listen">🔊 읽어 주기</button>
        </div>
        <div class="word-main">
          <div class="mode-label">${this.label}</div>
          <div class="word-card"><p class="word-q"></p></div>
          <div class="word-status">
            <div class="word-hint"></div>
            <div class="feedback"></div>
          </div>
          <div class="word-answer"></div>
        </div>
        <div class="boss-banner" hidden></div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="listen"]')) {
        sound.playPop();
        speak(this.p.text);
      }
    });
  }

  async mounted() {
    this.drawHud();
    if (this.cfg.boss) {
      // 해적 선장 등장!
      sound.playWhoosh();
      setTimeout(() => this.el.querySelector('.word-captain')?.classList.remove('entering'), 30);
      await wait(900);
      if (!this.alive) return;
      sound.playRumble();
      this.replay(this.el, 'quake');
      this.banner('해적 선장 등장! 🏴‍☠️', 1300);
      await wait(1200);
      if (!this.alive) return;
    }
    this.next();
  }

  banner(text, ms = 1200, cls = '') {
    const b = this.el.querySelector('.boss-banner');
    b.textContent = text;
    b.className = `boss-banner ${cls}`;
    b.hidden = false;
    this.replay(b, 'show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => { b.hidden = true; }, ms);
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
    this.setFeedback(this.idx === 0 ? '천천히 읽고, 빨간 숫자와 노란 힌트 말을 찾아봐요!' : '');
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
          ${[1, 2, 3, 4, 5].map((k) => `<button class="kp-key" data-k="${k}">${k}</button>`).join('')}
          <button class="kp-key small" data-k="del">⌫</button>
          ${[6, 7, 8, 9, 0].map((k) => `<button class="kp-key" data-k="${k}">${k}</button>`).join('')}
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
      if (this.miss === 0) {
        // 두 번째 바다 섬 id와 문제은행 섬 id는 같아요 (bundle, legs …)
        store.recordWord(p.island, this.missKind(v));
        store.addWordMiss(WORD_ISLANDS.findIndex((w) => w.id === p.island), p.template);
      }
      this.miss++;
      if (el.classList.contains('answer')) el.disabled = true;
      if (this.cfg.input === 'keypad') {
        this.typed = '';
        this.el.querySelector('.kp-typed').textContent = '';
      }
      if (this.cfg.boss && this.miss === 1) {
        this.hearts--;
        this.drawHud();
        this.replay(this.el.querySelector('.word-captain'), 'laugh');
        if (this.hearts <= 0) return this.finish(false);
      }
      const hint = this.el.querySelector('.word-hint');
      if (this.miss === 1) {
        hint.innerHTML = `${p.a * p.b <= 45 ? hintDotsHTML(p.a, p.b) : ''}<p class="word-step">먼저 <b>${esc(p.steps[0].split('=')[0].trim())}</b>부터 계산해 봐!</p>`;
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
    correctFx(this, el, clean, { badge: !this.cfg.boss });
    if (clean) {
      this.firstTry++;
      store.recordWord(p.island, 'ok');
      if (this.review) store.clearWordMiss(WORD_ISLANDS.findIndex((w) => w.id === p.island), p.template);
      if (this.cfg.boss) this.hitCaptain();
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
    if (!done) return this.next();
    if (this.cfg.boss && this.hp <= 0) await this.captainDefeated();
    if (this.alive) this.finish(this.cfg.boss ? this.hp <= 0 : this.firstTry >= this.cfg.pass);
  }

  // 한 번에 맞히면 선장에게 물보라! 체력 절반이면 화가 나요
  hitCaptain() {
    this.hp--;
    const cap = this.el.querySelector('.word-captain');
    const r = cap.getBoundingClientRect();
    const s = this.el.getBoundingClientRect();
    sound.playSplash();
    this.replay(cap, 'hit');
    this.replay(this.el.querySelector('.boss-hp'), 'shake');
    floatUp(this.el, r.left - s.left + r.width / 2, r.top - s.top, '💦 -1');
    this.drawHud();
    if (!this.angry && this.hp > 0 && this.hp <= this.cfg.count / 2) {
      this.angry = true;
      cap.classList.add('angry');
      this.captainArt('angry');
      setTimeout(() => {
        if (!this.alive) return;
        sound.playRumble();
        this.banner('해적 선장이 화났다! 💢', 1300, 'angry');
      }, 500);
    }
  }

  async captainDefeated() {
    const cap = this.el.querySelector('.word-captain');
    cap.classList.remove('angry');
    this.captainArt('dizzy');
    cap.classList.add('defeated');
    sound.playFanfare();
    this.banner('해적 선장을 이겼다! 🎉', 2200, 'win');
    confetti({ particleCount: 100, spread: 90, origin: { x: 0.2, y: 0.4 }, zIndex: 300 });
    await wait(2300);
  }

  // 해적 선장 그림 바꾸기 (화난·어지러운 그림이 있을 때만)
  captainArt(state) {
    const name = `boss-captain-${state}`;
    const cap = this.el.querySelector('.word-captain');
    if (cap && hasImage(name)) cap.innerHTML = imageArt(name, Math.round(this.u * 16));
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
    if (this.review) return this.finishReview();
    const wasChallenge = store.challenge2() === this.i; // 황금이 되면 도전 섬이 바뀌니까 먼저 확인해요
    const { from, to } = passed ? store.raiseProgress2(this.isl.id, this.cfg.to) : { from: store.progress2(this.isl.id), to: store.progress2(this.isl.id) };
    const grew = to > from;
    const bonus = passed ? (grew ? (this.cfg.boss ? 20 : 5) : 2) : 0;
    if (bonus) store.addStars(bonus);
    // 오늘의 도전 섬이면 별 2배
    const double = wasChallenge ? this.earned + bonus : 0;
    if (double) store.addStars(double);
    const f = this.isl.friend;
    const icon = WORD_ISLANDS[this.isl.word].icon;
    const title = !passed
      ? (this.cfg.boss ? '해적 선장이 도망갔어요! 다시 도전!' : `${this.cfg.pass}개 맞히면 돼요. 조금만 더!`)
      : grew ? ['', `${f.name}의 알을 찾았어요!`, `${f.name}가 깨어났어요!`, `${f.name}가 쑥쑥 자랐어요!`, `황금 ${f.name}가 됐어요!`][to] : '잘했어요!';
    const size = Math.round(this.u * 18);
    const art = grew
      ? `<div class="evolve charging">
           <span class="evo-rays ${to === 4 ? 'gold' : ''}"></span>
           <div class="evo-from">${sea2Art(this.isl.id, Math.max(1, from), size, from === 0 ? '?' : icon)}</div>
           <div class="evo-to">${sea2Art(this.isl.id, to, size, icon)}</div>
         </div>`
      : `<div class="evolve still">${sea2Art(this.isl.id, Math.max(1, from), size, icon)}</div>`;
    const el = h(`
      <div class="overlay">
        <div class="sheet small center word-result">
          <h2 class="sheet-title ${grew ? 'pending' : ''}">${esc(title)}</h2>
          ${art}
          <p class="sheet-msg">한 번에 맞힌 문제 ${this.firstTry} / ${this.idx} · ⭐ +${this.earned + bonus}</p>
          ${double ? `<p class="sheet-msg"><span class="pill new">🎯 도전 섬 보너스 ⭐ +${double}</span></p>` : ''}
          ${grew && to === 2 ? `<p class="sheet-msg">${f.name}는 🏝️ 친구들의 섬에서 살아요. 어항 화면의 섬 버튼으로 놀러 가요!</p>` : ''}
          <div class="row">
            <button class="btn btn-foam" data-go="again">🔄 다시 하기</button>
            <button class="btn btn-coral" data-go="sea2">⛵ 바다 지도로</button>
          </div>
        </div>
      </div>`);
    this.bindResult(el);
    if (!passed) return sound.playBoing();
    if (!grew) {
      sound.playFanfare();
      confetti({ particleCount: 70, spread: 90, origin: { y: 0.45 }, zIndex: 300 });
      return;
    }
    // 진화 연출: 흔들리며 빛을 모으고 → 번쩍 → 새 모습 (첫 번째 바다와 같아요)
    sound.playRumble();
    setTimeout(() => sound.playWhoosh(), 1100);
    setTimeout(() => {
      const evo = el.querySelector('.evolve');
      const flash = h('<div class="evo-flash"></div>');
      document.getElementById('app').appendChild(flash);
      setTimeout(() => flash.remove(), 800);
      evo.classList.remove('charging');
      evo.classList.add('done');
      el.querySelectorAll('.pending').forEach((x) => x.classList.remove('pending'));
      sound.playFanfare();
      sound.playStar();
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.45 }, zIndex: 300 });
      if (from === 1 && to === 2) {
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
          const d = 14 + Math.random() * 8;
          const bit = h(`<i class="shell-bit" style="--c:${f.color};--dx:${(Math.cos(a) * d).toFixed(1)};--dy:${(Math.sin(a) * d).toFixed(1)};--rot:${Math.round(Math.random() * 540 - 270)}deg"></i>`);
          evo.appendChild(bit);
          setTimeout(() => bit.remove(), 1200);
        }
      }
    }, 1700);
  }

  finishReview() {
    const left = (store.data.wordMisses || []).length;
    const el = h(`
      <div class="overlay">
        <div class="sheet small center word-result">
          <h2 class="sheet-title">문장제 복습 끝! 📅</h2>
          <div class="evolve still">${guideSVG(Math.round(this.u * 14))}</div>
          <p class="sheet-msg">한 번에 맞힌 문제 ${this.firstTry} / ${this.idx} · ⭐ +${this.earned}</p>
          <p class="sheet-msg">${left ? `다시 볼 문제가 ${left}개 남았어요` : '틀렸던 문제를 모두 풀었어요! 🎉'}</p>
          <div class="row">
            ${left ? '<button class="btn btn-foam" data-go="again">🔄 한 번 더 복습</button>' : ''}
            <button class="btn btn-coral" data-go="sea2">⛵ 바다 지도로</button>
          </div>
        </div>
      </div>`);
    this.bindResult(el);
    sound.playFanfare();
  }

  bindResult(el) {
    el.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]')?.dataset.go;
      if (!go) return;
      sound.playPop();
      if (go === 'again') this.app.go('word', this.review ? { review: true } : { island: this.i, stage: this.stageIndex });
      else this.app.go('sea2', { island: this.i });
    });
    document.getElementById('app').appendChild(el);
  }

  destroy() {
    this.alive = false;
    clearTimeout(this.bannerTimer);
    stopSpeaking();
    this.bar.destroy();
  }
}
