// 뽀글이 가이드: 처음 하는 것마다 한 번씩 말풍선으로 알려줘요. 본 설명은 다시 나오지 않아요.
import { store } from '../core/store.js';
import { h } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { guideSVG } from '../graphics/characters.js';
import { callKid } from '../data/care.js';

const TIPS = {
  map: '여기는 바다 지도야! 섬을 누르면 오른쪽에 게임이 나와. 뭘 할지 모르겠으면 "추천" 게임을 해 봐. 궁금하면 나를 눌러 줘 🗺️',
  song: '구구단을 잘 듣고, 한 줄씩 세 번 소리 내어 따라 말해 봐! 🎵',
  stepping: '×1부터 ×9까지 차례대로! 맞는 답의 돌을 눌러서 징검다리를 건너 봐 🌈',
  mix: '이번엔 순서가 섞여 있어! 보기에서 답을 골라 봐. 틀려도 괜찮아 🫧',
  keypad: '이번엔 보기가 없어! 조개 숫자판을 눌러서 답을 직접 써 봐 🐚',
  boss: '맞힐 때마다 물대포 발사! 상어 체력을 다 깎으면 이겨 🦈',
  review: '자주 헷갈렸던 문제를 모았어. 천천히 다시 풀어 보자 📅',
  sea2: '여기는 두 번째 바다야! 구구단으로 이야기 문제를 풀어. 섬을 누르고 오른쪽에서 시작해 봐 ⛵',
  word: '문제를 천천히 읽어 봐. 색칠된 숫자와 낱말이 힌트야! 읽기 어려우면 🔊를 눌러 줘'
};

// 뽀글이와 말풍선을 붙여요.
// - 말풍선을 누르면 닫히고, 뽀글이를 누르면 다시 나와요
// - notify(말): 바로 말하지 않고 머리 위에 "!"만 띄워요. 뽀글이를 누르면 그 말을 해요
// - stay: 뽀글이는 늘 남아요 (지도). 아니면 말풍선을 닫을 때 뽀글이도 들어가요 (게임 화면 첫 설명)
export function guideBubble(parent, { stay = false, onTap = null, cls = '' } = {}) {
  const el = h(`<div class="tip-guide ${cls}"><div class="tip-art">${guideSVG(68)}<span class="tip-badge" hidden>!</span></div><div class="tip-bubble" hidden></div></div>`);
  const bubble = el.querySelector('.tip-bubble');
  const badge = el.querySelector('.tip-badge');
  let timer = 0;
  let last = '';
  let pending = '';
  const hide = () => {
    clearTimeout(timer);
    bubble.hidden = true;
    if (!stay) el.remove();
  };
  // ms: 이 시간 뒤 저절로 닫혀요 (0이면 누를 때까지)
  const say = (text, ms = 0) => {
    clearTimeout(timer);
    last = text;
    pending = '';
    badge.hidden = true;
    bubble.textContent = text;
    bubble.hidden = false;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
    if (ms) timer = setTimeout(hide, ms);
  };
  const notify = (text) => {
    pending = text;
    badge.hidden = false;
  };
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  if (!stay) el.addEventListener('click', hide); // 첫 설명 카드는 아무 데나 누르면 닫혀요
  bubble.addEventListener('click', () => {
    sound.playPop();
    hide();
  });
  el.querySelector('.tip-art').addEventListener('click', () => {
    sound.playPop();
    if (!bubble.hidden && !pending) return hide();
    say(pending || (onTap ? onTap() : last));
  });
  parent.appendChild(el);
  return { el, say, notify, hide, get open() { return !bubble.hidden; } };
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

// 이 화면이 처음이면 뽀글이가 가운데 카드로 한 번 알려줘요 (답 버튼을 가리지 않게 누르면 바로 닫혀요)
export function firstTip(name, parent) {
  const text = takeTip(name);
  if (text) setTimeout(() => guideBubble(parent, { cls: 'tip-center' }).say(text, 9000), 600);
}
