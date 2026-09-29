// 정답 효과 모음 (모든 게임 공통)
// - 별이 정답 자리에서 위쪽 별 개수로 날아가요
// - 한 번에 맞힌 게 이어지면 "🔥 3연속!" 배지가 뜨고, 정답 소리가 조금씩 높아져요
// - 안드로이드 태블릿은 짧게 톡 진동해요
import { h } from './ui.js';
import { sound } from '../audio/soundManager.js';

const BADGE_AT = [3, 5, 7, 10, 15, 20];

// scene.el 안의 위쪽 별 개수(⭐)로 별이 날아가요
export function flyStar(sceneEl, fromEl) {
  const pill = sceneEl.querySelector('.star-n')?.closest('.pill');
  if (!pill || !fromEl) return;
  const a = fromEl.getBoundingClientRect();
  const b = pill.getBoundingClientRect();
  const star = h(`<div class="fly-star">⭐</div>`);
  star.style.left = `${a.left + a.width / 2}px`;
  star.style.top = `${a.top + a.height / 2}px`;
  document.getElementById('app').appendChild(star);
  const dx = b.left + b.width * 0.3 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = star.animate([
    { transform: 'translate(-50%, -50%) scale(.6)', opacity: 1 },
    { transform: `translate(calc(-50% + ${dx * 0.4}px), calc(-50% + ${dy * 0.4 - 60}px)) scale(1.5)`, opacity: 1, offset: 0.4 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.7)`, opacity: 1 }
  ], { duration: 700, easing: 'cubic-bezier(.5, 0, .6, 1)' });
  anim.onfinish = () => {
    star.remove();
    pill.classList.remove('bump');
    void pill.offsetWidth;
    pill.classList.add('bump');
  };
}

// 정답일 때 부르세요. clean: 한 번에 맞혔는지. badge: 연속 배지를 보일지 (보스전은 따로 있어요)
export function correctFx(scene, fromEl, clean, { badge = true } = {}) {
  scene.combo = clean ? (scene.combo || 0) + 1 : 0;
  sound.playCorrect(scene.combo);
  navigator.vibrate?.(15);
  flyStar(scene.el, fromEl);
  if (badge && BADGE_AT.includes(scene.combo)) {
    const el = h(`<div class="combo-badge">🔥 ${scene.combo}연속!</div>`);
    scene.el.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}
