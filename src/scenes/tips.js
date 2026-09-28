// 뽀글이 가이드: 처음 하는 것마다 한 번씩 말풍선으로 알려줘요. 본 설명은 다시 나오지 않아요.
import { store } from '../core/store.js';
import { h } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { guideSVG } from '../graphics/characters.js';
import { callKid } from '../data/care.js';

const TIPS = {
  map: '여기는 바다 지도야! 섬을 누르면 오른쪽에 게임이 나와. "추천" 게임부터 해 봐 🗺️',
  song: '구구단을 잘 듣고, 한 줄씩 세 번 소리 내어 따라 말해 봐! 🎵',
  stepping: '×1부터 ×9까지 차례대로! 맞는 답의 돌을 눌러서 징검다리를 건너 봐 🌈',
  mix: '이번엔 순서가 섞여 있어! 보기에서 답을 골라 봐. 틀려도 괜찮아 🫧',
  keypad: '이번엔 보기가 없어! 조개 숫자판을 눌러서 답을 직접 써 봐 🐚',
  boss: '맞힐 때마다 물대포 발사! 상어 체력을 다 깎으면 이겨 🦈',
  review: '자주 헷갈렸던 문제를 모았어. 천천히 다시 풀어 보자 📅'
};

// 화면 구석에 뽀글이와 말풍선을 붙여요. stay: 뽀글이는 남고 말풍선만 사라져요
export function guideBubble(parent, { stay = false, onTap = null } = {}) {
  const el = h(`<div class="tip-guide ${stay ? 'stay' : ''}"><div class="tip-art">${guideSVG(68)}</div><div class="tip-bubble" hidden></div></div>`);
  const bubble = el.querySelector('.tip-bubble');
  let timer = 0;
  const hide = () => {
    clearTimeout(timer);
    if (stay) bubble.hidden = true;
    else el.remove();
  };
  const say = (text, ms = 7000) => {
    clearTimeout(timer);
    bubble.textContent = text;
    bubble.hidden = false;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
    timer = setTimeout(hide, ms);
  };
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', () => {
    sound.playPop();
    if (onTap) onTap();
    else hide();
  });
  parent.appendChild(el);
  return { el, say, hide };
}

// 처음 보는 설명이면 (아이 이름을 붙여) 돌려주고, 본 것으로 적어 둬요
export function takeTip(name) {
  const text = TIPS[name];
  const seen = store.data.tips || [];
  if (!text || seen.includes(name)) return null;
  store.setOption('tips', [...seen, name]);
  const k = callKid(store.data.kidName);
  return k ? `${k}, ${text}` : text;
}

// 이 화면이 처음이면 뽀글이가 한 번 알려줘요
export function firstTip(name, parent) {
  const text = takeTip(name);
  if (text) setTimeout(() => guideBubble(parent).say(text), 600);
}
