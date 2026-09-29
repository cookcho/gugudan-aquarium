// 상어 보스전 (황금 단계): 맞힐 때마다 내 친구가 물대포를 쏴서 상어 체력을 깎아요. 시간 제한은 없어요.
// 하트 3개(실수 2번까지). 자주 틀린 문제가 더 자주 나와요. 이기면 황금으로 진화해요.
// 연출: 상어 등장 → 물대포와 물보라 → 3연속이면 무지개 슈퍼 물대포 → 체력 절반이면 화난 상어 → 이기면 어지러워 도망
import confetti from 'canvas-confetti';
import { store } from '../core/store.js';
import { h, topbar, unit, floatUp } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { speakLine, gugudanLine } from '../core/speech.js';
import { mixChoices, hintDotsHTML } from '../core/quiz.js';
import { charSVG, hasImage, imageArt } from '../graphics/characters.js';
import { SHARK_BODY } from '../graphics/mapArt.js';

const SHARK_HP = 8;
const HEARTS = 3;
const COMBO = 3; // 연속으로 이만큼 맞히면 슈퍼 물대포 (2칸)
const SHARK_IMAGE = { normal: 'boss-shark', angry: 'boss-shark-angry', dizzy: 'boss-shark-dizzy' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
    this.streak = 0;
    this.angry = false;
    this.alive = true;
    this.last = 0;
    this.locked = true;
    this.u = unit();
    const p = Math.max(3, store.data.progress[dan]);
    const bubbles = Array.from({ length: 10 }, () => {
      const s = 6 + Math.random() * 14;
      return `<i style="width:${s}px;height:${s}px;left:${Math.random() * 96}%;animation-duration:${6 + Math.random() * 6}s;animation-delay:${-Math.random() * 8}s"></i>`;
    }).join('');
    this.bar = topbar(app, { back: 'map', backLabel: '← 지도', center: '<span class="boss-hearts"></span>' });
    this.el = h(`
      <div class="scene boss-scene">
        <div class="rays"></div>
        <div class="bubbles">${bubbles}</div>
        <div class="boss-arena">
          <div class="boss-hp"><span>대장 상어 체력</span><div class="boss-hp-bar"><b></b><i></i></div></div>
          <div class="boss-hero bob">${charSVG(dan, p, Math.round(this.u * 15))}</div>
          <div class="boss-shark entering"><div class="shark-art"></div></div>
          <div class="boss-beam"></div>
          <div class="boss-banner" hidden></div>
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
    this.arena = this.el.querySelector('.boss-arena');
    this.shark = this.el.querySelector('.boss-shark');
    this.setShark('normal');
  }

  mounted() {
    this.drawHud();
    this.enter();
  }

  // 상어 얼굴 바꾸기. 그림 파일(오른쪽을 봐요)은 뒤집어서 왼쪽을 보게 해요
  setShark(state) {
    const art = this.shark.querySelector('.shark-art');
    const name = SHARK_IMAGE[state];
    if (hasImage(name)) {
      art.className = 'shark-art flip';
      art.innerHTML = imageArt(name, Math.round(this.u * 24));
    } else {
      art.className = 'shark-art';
      art.innerHTML = `<svg viewBox="-80 -60 160 100" width="${Math.round(this.u * 30)}" height="${Math.round(this.u * 19)}" aria-hidden="true"><g transform="scale(-1 1)">${SHARK_BODY}</g></svg>`;
    }
  }

  // 대장 상어 등장: 헤엄쳐 들어와서 쿵!
  async enter() {
    sound.playWhoosh();
    requestAnimationFrame(() => this.shark.classList.remove('entering'));
    await wait(1100);
    if (!this.alive) return;
    sound.playRumble();
    this.replay(this.arena, 'quake');
    this.banner('대장 상어 등장! 🦈', 1300);
    await wait(1400);
    if (this.alive) this.next();
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
    this.el.querySelector('.boss-hearts').innerHTML = Array.from({ length: HEARTS }, (_, i) => `<b class="${i < this.hearts ? 'on' : ''}">${i < this.hearts ? '💖' : '🤍'}</b>`).join('');
    const w = `${(this.hp / SHARK_HP) * 100}%`;
    this.el.querySelector('.boss-hp-bar i').style.width = w;
    this.el.querySelector('.boss-hp-bar b').style.width = w; // 흰 자국이 조금 늦게 따라와요
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
    this.setFeedback(this.asked === 1 ? '맞히면 물대포 발사! 💦 3번 연속이면 슈퍼 물대포!' : '');
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

  // arena 안에서의 위치
  spot(el) {
    const a = this.arena.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { left: r.left - a.left, right: r.right - a.left, top: r.top - a.top, cy: r.top - a.top + r.height / 2, w: r.width, h: r.height };
  }

  // 물대포: 친구에게서 상어까지 물줄기가 쭉 뻗어요
  fire(superShot) {
    const hero = this.spot(this.el.querySelector('.boss-hero'));
    const shark = this.spot(this.shark);
    const beam = this.el.querySelector('.boss-beam');
    const x = hero.right - hero.w * 0.15;
    beam.style.left = `${x}px`;
    beam.style.top = `${hero.cy}px`;
    beam.style.width = `${Math.max(40, shark.left + shark.w * 0.3 - x)}px`;
    beam.classList.toggle('super', superShot);
    this.replay(beam, 'fire');
    this.replay(this.el.querySelector('.boss-hero'), 'recoil');
    sound.playWhoosh();
  }

  // 명중: 물보라, "-1", 상어 번쩍, 체력 바 흔들
  impact(dmg, superShot) {
    const shark = this.spot(this.shark);
    const x = shark.left + shark.w * 0.3;
    const y = shark.cy;
    sound.playSplash();
    this.replay(this.shark, 'hit');
    this.replay(this.el.querySelector('.boss-hp'), 'shake');
    if (superShot) this.replay(this.arena, 'quake');
    for (let i = 0; i < (superShot ? 14 : 8); i++) {
      const a = Math.PI * (0.5 + Math.random());
      const d = 4 + Math.random() * (superShot ? 8 : 5);
      const drop = h(`<i class="boss-drop ${superShot ? 'rainbow' : ''}" style="left:${x}px;top:${y}px;--dx:${(Math.cos(a) * d).toFixed(2)};--dy:${(Math.sin(a) * d - 3).toFixed(2)};--hue:${Math.floor(Math.random() * 360)}"></i>`);
      this.arena.appendChild(drop);
      setTimeout(() => drop.remove(), 800);
    }
    const ring = h(`<i class="boss-ring" style="left:${x}px;top:${y}px"></i>`);
    this.arena.appendChild(ring);
    setTimeout(() => ring.remove(), 700);
    const num = h(`<b class="boss-dmg ${superShot ? 'super' : ''}" style="left:${x}px;top:${shark.top}px">-${dmg}</b>`);
    this.arena.appendChild(num);
    setTimeout(() => num.remove(), 1100);
    this.drawHud();
  }

  async choose(btn, v) {
    const { dan, n } = this;
    const answer = dan * n;

    if (v !== answer) {
      // 틀리면 상어가 덥석! 친구는 휙 피하고, 하트 하나가 줄어요
      sound.playBoing();
      btn.disabled = true;
      if (this.miss === 0) {
        store.record(dan, n, false, 0);
        this.missed.push(n);
        this.hearts--;
        this.streak = 0;
        this.drawHud();
        this.replay(this.shark, 'chomp');
        const heroEl = this.el.querySelector('.boss-hero');
        this.replay(heroEl, 'dodge');
        const hero = this.spot(heroEl);
        floatUp(this.arena, hero.left + hero.w / 2, hero.top, '휙!');
      }
      this.miss++;
      this.el.querySelector('.hint').innerHTML = hintDotsHTML(dan, n);
      this.el.querySelector(`.answer[data-v="${answer}"]`).classList.add('glow');
      if (this.hearts <= 0) {
        this.locked = true;
        this.shark.classList.add('laugh');
        this.setFeedback('상어가 너무 세다! 다음엔 이길 수 있어', 'soft');
        setTimeout(() => this.alive && this.finish(false), 1600);
      } else {
        this.setFeedback(`앗, 덥석! 정답은 ${answer}이야. 눌러서 계속하자`, 'soft');
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
      // 한 번에 맞히면 물대포! 3연속이면 무지개 슈퍼 물대포로 2칸
      store.record(dan, n, true, Date.now() - this.started);
      this.firstTry++;
      this.streak++;
      const superShot = this.streak % COMBO === 0;
      const dmg = superShot ? 2 : 1;
      this.hp = Math.max(0, this.hp - dmg);
      if (superShot) this.banner(`🌈 ${this.streak}연속! 슈퍼 물대포!`, 1200, 'combo');
      this.fire(superShot);
      setTimeout(() => this.alive && this.impact(dmg, superShot), 280);
      if (!this.angry && this.hp > 0 && this.hp <= SHARK_HP / 2) {
        this.angry = true;
        setTimeout(() => {
          if (!this.alive) return;
          this.setShark('angry');
          this.shark.classList.add('angry');
          sound.playRumble();
          this.banner('대장 상어가 화났다! 💢', 1300, 'angry');
        }, 900);
      }
      this.setFeedback(`💦 명중! "${gugudanLine(dan, n)}"`, 'good');
    } else {
      this.streak = 0;
      this.setFeedback(`"${gugudanLine(dan, n)}"`, 'good');
    }
    await Promise.all([speakLine(dan, n), wait(1100)]);
    if (!this.alive) return;
    if (this.hp <= 0) {
      await this.victory();
      if (this.alive) this.finish(true);
    } else {
      this.next();
    }
  }

  // 이겼다! 상어는 어지러워 빙글빙글, 발라당 뒤집혀 도망가요
  async victory() {
    this.setShark('dizzy');
    this.shark.classList.remove('angry');
    this.shark.classList.add('defeated');
    const hero = this.el.querySelector('.boss-hero');
    hero.classList.remove('bob');
    hero.classList.add('cheer');
    sound.playFanfare();
    this.banner('상어를 이겼다! 🎉', 2400, 'win');
    this.setFeedback('와! 대장 상어를 물리쳤어!', 'good');
    const r = this.shark.getBoundingClientRect();
    const o = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
    confetti({ particleCount: 100, spread: 90, origin: o, zIndex: 300 });
    setTimeout(() => this.alive && confetti({ particleCount: 70, spread: 120, origin: { x: 0.3, y: 0.4 }, zIndex: 300 }), 500);
    await wait(2600);
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
    clearTimeout(this.bannerTimer);
    this.bar.destroy();
  }
}
