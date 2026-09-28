// 어항 손님 관리: 좋아하는 장식이 있으면 가끔 놀러 와서 그 근처에서 놀다 가요.
// 누르면 인사하고, 하루 한 번 구구단 수수께끼를 내요.
import confetti from 'canvas-confetti';
import { store } from '../core/store.js';
import { h, floatUp, timeOfDay } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { Swimmer } from '../core/swim.js';
import { mixChoices } from '../core/quiz.js';
import { GUESTS } from '../data/guests.js';
import { josa } from '../data/care.js';
import { guestSVG } from '../graphics/guests.js';
import { sheet } from './overlays.js';

const STAY_SEC = 75; // 한 번 놀러 오면 머무는 시간
const CHECK_SEC = [40, 70]; // 다음 손님을 확인하는 간격

export class GuestManager {
  constructor(home) {
    this.home = home;
    this.guest = null;
    this.wait = 5 + Math.random() * 4; // 어항에 들어오고 조금 뒤 첫 손님 확인
  }

  // 어항에 놓인 장식 중 이 손님이 좋아하는 것의 위치
  likedPoints(g) {
    const b = this.home.bounds;
    return [...this.home.el.querySelectorAll('.decor-layer .decor')]
      .filter((d) => g.likes.includes(d.dataset.type))
      .map((d) => {
        const r = d.getBoundingClientRect();
        return { x: r.left - b.left + r.width / 2, y: r.top - b.top };
      });
  }

  // 좋아하는 장식이 많을수록, 밤바다에서는 초롱이가 더 잘 와요
  candidates() {
    const placed = store.data.decorations.filter((d) => d.placed).map((d) => d.type);
    const night = store.data.theme === 'night' || timeOfDay() === 'night';
    return GUESTS
      .map((g) => ({ g, w: placed.filter((t) => g.likes.includes(t)).length * (g.night && night ? 3 : 1) }))
      .filter((c) => c.w > 0);
  }

  step(dt, W, H) {
    if (!this.guest) {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = CHECK_SEC[0] + Math.random() * (CHECK_SEC[1] - CHECK_SEC[0]);
        if (Math.random() < 0.6) this.arrive(W, H);
      }
      return;
    }
    const gst = this.guest;
    gst.stay -= dt;
    if (gst.stay <= 0 && !gst.leaving) {
      this.leave();
      return;
    }
    gst.pointsAge = (gst.pointsAge || 0) + dt;
    if (gst.pointsAge > 2) {
      gst.pointsAge = 0;
      gst.points = this.likedPoints(gst.g);
    }
    gst.sw.update({ W, H, dt, food: null, attention: null, friends: [], decors: gst.points, night: false, hungry: false, sick: false });
    gst.el.style.transform = gst.sw.transform();
    if (!gst.badge.hidden) {
      gst.badge.style.transform = `translate(${gst.sw.x + gst.size / 2}px, ${gst.sw.y - this.home.u * 1.5}px) translateX(-50%)`;
    }
  }

  arrive(W, H) {
    const cands = this.candidates();
    if (!cands.length) return;
    let r = Math.random() * cands.reduce((s, c) => s + c.w, 0);
    const { g } = cands.find((c) => (r -= c.w) < 0) || cands[0];
    const size = Math.round(this.home.u * 11);
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? 10 : W - size - 10;
    const y = 40 + Math.random() * (H * 0.4);
    const el = h(`<div class="guest arriving">${guestSVG(g.id, size)}</div>`);
    const badge = h('<div class="fish-badge guest-badge"></div>');
    const sw = new Swimmer({ visit: 0.5, ...g.motion }, x, y, size);
    const points = this.likedPoints(g);
    if (points.length) sw.setMode('visit', { W, H, decors: points, friends: [], night: false });
    this.guest = { g, el, badge, sw, size, points, stay: STAY_SEC };
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.touch();
    });
    this.home.tank.appendChild(el);
    this.home.tank.appendChild(badge);
    this.updateBadge();
    store.guestArrived(g.id);
    sound.playStar();
    if (!this.home.decorating) this.home.say(`어? 손님이 놀러 왔어요! 눌러 봐요 ✨`);
  }

  updateBadge() {
    const gst = this.guest;
    if (!gst) return;
    const met = !!store.guestInfo(gst.g.id).met;
    const riddle = store.riddleReady(gst.g.id);
    gst.badge.hidden = met && !riddle;
    gst.badge.textContent = !met ? '✨ 새 손님!' : '❓ 수수께끼';
  }

  touch() {
    const gst = this.guest;
    if (!gst || gst.leaving) return;
    const { g } = gst;
    sound.playPop();
    gst.sw.spin = 1;
    floatUp(this.home.tank, gst.sw.x + gst.size / 2, gst.sw.y, '💖');
    const first = store.meetGuest(g.id);
    if (first) {
      sound.playFanfare();
      const r = gst.el.getBoundingClientRect();
      confetti({ particleCount: 70, spread: 70, origin: { x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight }, zIndex: 300 });
      this.home.say(`새 손님! ${g.species} ${josa(g.name, '이', '가')} 놀러 왔어요 🎉 도감에 기록했어요`);
    } else {
      this.home.say(`${g.name}: "${g.hello}"`);
    }
    this.updateBadge();
    if (store.riddleReady(g.id)) setTimeout(() => this.openRiddle(g), first ? 1600 : 900);
  }

  // 손님의 구구단 수수께끼 (하루 한 번). 맞히면 별 3개, 틀려도 별 1개
  openRiddle(g) {
    if (!this.home.alive || !store.riddleReady(g.id)) return;
    const { dan, n } = store.riddleFact();
    const answer = dan * n;
    const started = Date.now();
    const el = sheet(`❓ ${g.name}의 수수께끼`, `
      <div class="riddle">
        <div class="riddle-art">${guestSVG(g.id, 110)}</div>
        <p class="riddle-q">${g.riddle(dan, n)}</p>
        <p class="riddle-hint">${dan} × ${n} = ?</p>
        <div class="riddle-choices">${mixChoices(dan, n).map((v) => `<button class="answer bubble-btn" data-v="${v}">${v}</button>`).join('')}</div>
        <p class="riddle-result"></p>
      </div>`);
    el.querySelector('.riddle-choices').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-v]');
      if (!btn || el.dataset.done) return;
      el.dataset.done = '1';
      const ok = Number(btn.dataset.v) === answer;
      el.querySelectorAll('.riddle-choices .answer').forEach((b) => { b.disabled = Number(b.dataset.v) !== answer; });
      el.querySelector(`.answer[data-v="${answer}"]`).classList.add(ok ? 'right' : 'glow');
      store.record(dan, n, ok, Date.now() - started);
      store.addStars(ok ? 3 : 1);
      store.finishRiddle(g.id);
      if (ok) sound.playCorrect();
      else sound.playBoing();
      el.querySelector('.riddle-result').textContent = ok
        ? `정답! ${g.name}: "대단한걸!" ⭐ +3`
        : `아깝다! 정답은 ${answer}이야. 도전해 줘서 고마워 ⭐ +1`;
      this.updateBadge();
      setTimeout(() => el.remove(), 2200);
    });
  }

  leave() {
    const gst = this.guest;
    gst.leaving = true;
    gst.el.classList.add('leaving');
    gst.badge.hidden = true;
    setTimeout(() => {
      gst.el.remove();
      gst.badge.remove();
      if (this.guest === gst) this.guest = null;
    }, 1200);
  }

  destroy() {
    this.guest?.el.remove();
    this.guest?.badge.remove();
    this.guest = null;
  }
}
