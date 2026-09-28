// 화면 공통 도구: 요소 만들기, 말풍선 토스트, 확인 창, 상단 바
import { store } from './store.js';
import { sound } from '../audio/soundManager.js';
import { music } from '../audio/music.js';

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// CSS의 --u와 같은 값(px)
export function unit() {
  const portrait = innerHeight > innerWidth;
  return portrait ? Math.min(innerWidth * 0.019, innerHeight * 0.011) : Math.min(innerWidth * 0.01, innerHeight * 0.0155);
}

export function toast(message) {
  const el = h(`<div class="toast">${message}</div>`);
  document.getElementById('app').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2000);
  setTimeout(() => el.remove(), 2400);
}

export function confirmBox(message, okLabel = '네', cancelLabel = '아니요') {
  return new Promise((resolve) => {
    const el = h(`
      <div class="overlay">
        <div class="sheet small">
          <p class="sheet-msg">${message}</p>
          <div class="row">
            <button class="btn btn-foam" data-v="0">${cancelLabel}</button>
            <button class="btn btn-coral" data-v="1">${okLabel}</button>
          </div>
        </div>
      </div>`);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      sound.playPop();
      el.remove();
      resolve(b.dataset.v === '1');
    });
    document.getElementById('app').appendChild(el);
  });
}

// 떠오르는 작은 효과 (하트, 별)
export function floatUp(parent, x, y, text) {
  const el = h(`<div class="float-up" style="left:${x}px;top:${y}px">${text}</div>`);
  parent.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// 상단 바. back: 돌아갈 장면 이름, 없으면 버튼 없음
export function topbar(app, { back = null, backLabel = '←', center = '', parent = false } = {}) {
  const el = h(`
    <div class="topbar">
      <div class="group">
        ${back ? `<button class="pill" data-act="back">${backLabel}</button>` : ''}
        <span class="pill">⭐ <b class="star-n">${store.data.stars}</b></span>
        ${!back ? `<span class="pill">🔥 ${store.data.streak.count}일째</span>` : ''}
      </div>
      <div class="topbar-center">${center}</div>
      <div class="group">
        <button class="pill" data-act="sound" aria-label="효과음">${store.data.sound ? '🔊' : '🔇'}</button>
        ${parent ? '<button class="pill" data-act="parent">🔒 보호자</button>' : ''}
      </div>
    </div>`);
  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'back') {
      sound.playPop();
      app.go(back);
    } else if (act === 'sound') {
      const on = !store.data.sound;
      sound.enabled = on;
      store.setOption('sound', on);
      music.applyVolume();
      e.target.closest('[data-act]').textContent = on ? '🔊' : '🔇';
      sound.playPop();
    } else if (act === 'parent') {
      sound.playPop();
      app.go('parent');
    }
  });
  const unsub = store.subscribe((d) => {
    el.querySelector('.star-n').textContent = d.stars;
  });
  return { el, destroy: unsub };
}
