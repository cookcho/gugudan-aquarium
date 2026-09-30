// 두 번째 바다 지도: "별빛 밤바다". 달과 달빛 길, 오로라, 별똥별, 빛나는 해파리 사이로 문장제 섬 9개가 굽이굽이.
// 오른쪽은 고른 섬의 네 단계. 오늘의 도전 섬(별 2배)과 문장제 복습도 여기서 시작해요.
import { store } from '../core/store.js';
import { h, topbar, toast, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { SEA2, SEA2_STAGES } from '../data/sea2.js';
import { WORD_ISLANDS } from '../data/wordProblems.js';
import { sea2Art } from '../graphics/sea2.js';

const W = 760;
const H = 800;
const SPOTS = [[130, 690], [380, 670], [630, 690], [630, 440], [380, 420], [130, 440], [130, 190], [380, 170], [630, 190]];
const LEVEL = { 하: '#2FB57E', 중: '#E0A000', '중·상': '#E0A000', 상: '#E0506A' };
const NS = 'http://www.w3.org/2000/svg';

function islandSVG(i, selected) {
  const s = SEA2[i];
  const w = WORD_ISLANDS[s.word];
  const [x, y] = SPOTS[i];
  const open = store.isUnlocked2(i);
  const p = store.progress2(s.id);
  const challenge = open && store.challenge2() === i;
  const art = open ? sea2Art(s.id, p, 84, w.icon) : '';
  return `
    <g class="isle ${open ? '' : 'locked'} ${selected ? 'selected' : ''}" data-i="${i}" transform="translate(${x} ${y})" role="button" aria-label="${w.name}">
      ${challenge ? '<ellipse class="ch-glow" cx="0" cy="10" rx="175" ry="110" fill="url(#ch2Glow)"/>' : ''}
      <ellipse cx="0" cy="18" rx="116" ry="50" fill="#7FE8FF" opacity=".18"/>
      <ellipse class="glow-ring" cx="0" cy="18" rx="104" ry="44" fill="none" stroke="#9FF3FF" stroke-width="3" stroke-dasharray="3 12" opacity=".7"/>
      <circle class="ring" cx="0" cy="-8" r="112" fill="none" stroke="#FFD86B" stroke-width="5" stroke-dasharray="18 12"/>
      <path d="M-92 12 C-97 -20 -50 -40 0 -38 C56 -40 97 -18 92 14 C90 40 40 52 0 50 C-46 52 -88 40 -92 12Z" fill="#E6DAF7" stroke="#B8A4E6" stroke-width="4"/>
      <path d="M-64 2 C-66 -20 -30 -31 5 -29 C42 -31 68 -16 62 4 C58 19 20 23 0 21 C-31 23 -62 17 -64 2Z" fill="#62CDBB" stroke="#339C8C" stroke-width="3"/>
      <g class="crystal"><path d="M-78 4 L-70 -26 L-62 4 Z" fill="#B7F4FF" stroke="#5CC8E0" stroke-width="2"/><path d="M-64 6 L-58 -12 L-52 6 Z" fill="#D9C4FF" stroke="#9B7FE0" stroke-width="2"/></g>
      <g class="glow-shroom"><path d="M60 8 V-6" stroke="#E6DAF7" stroke-width="4"/><ellipse cx="60" cy="-8" rx="11" ry="7" fill="#FF9EDB" stroke="#E060B0" stroke-width="2"/></g>
      ${open ? `<g class="isle-char"><foreignObject x="-42" y="-96" width="84" height="84">${art}</foreignObject></g>` : `
        <g fill="#D8D4F0" opacity=".95"><circle cx="-50" cy="-10" r="34"/><circle cx="-10" cy="-30" r="42"/><circle cx="38" cy="-14" r="36"/><circle cx="68" cy="6" r="24"/><rect x="-80" y="-6" width="150" height="34" rx="17"/></g>
        <g transform="translate(0 -6)"><rect x="-13" y="-6" width="26" height="20" rx="4" fill="#8E86B8"/><path d="M-8 -6 v-6 a8 8 0 0 1 16 0 v6" stroke="#8E86B8" stroke-width="4" fill="none"/></g>`}
      <g transform="translate(0 58)">
        <rect x="-78" y="-24" width="156" height="36" rx="10" fill="${open ? '#4B3A99' : '#8E86B8'}" stroke="#C9B8FF" stroke-width="3"/>
        <text x="0" y="2" text-anchor="middle" font-family="Jua, sans-serif" font-size="22" fill="#fff">${w.icon} ${w.name}</text>
      </g>
      ${open ? `<circle cx="84" cy="-44" r="15" fill="${LEVEL[w.level]}" stroke="#fff" stroke-width="3"/><text x="84" y="-37" text-anchor="middle" font-family="Jua, sans-serif" font-size="${w.level.length > 1 ? 11 : 18}" fill="#fff">${w.level}</text>` : ''}
      ${open ? `<g transform="translate(0 86)">${SEA2_STAGES.map((st, k) => `<circle cx="${-24 + k * 16}" cy="0" r="5.5" fill="${p >= st.to ? '#FFD86B' : 'rgba(255,255,255,.4)'}" stroke="#C9B8FF" stroke-width="1.5"/>`).join('')}</g>` : ''}
      ${challenge ? `
        <g class="ch-orbit">${[0, 90, 180, 270].map((a) => `<path transform="rotate(${a}) translate(0 -118)" d="M0 -12 L3.5 -3.5 L12 0 L3.5 3.5 L0 12 L-3.5 3.5 L-12 0 L-3.5 -3.5Z" fill="#FFF3A8" stroke="#E8A800" stroke-width="1.5"/>`).join('')}</g>
        <g class="ch-flag" transform="translate(0 ${y < 300 ? 140 : -158})">
          <rect x="-118" y="-28" width="236" height="54" rx="27" fill="#FF6B4A" stroke="#fff" stroke-width="5"/>
          <text x="0" y="10" text-anchor="middle" font-family="Jua, sans-serif" font-size="30" fill="#fff" textLength="196" lengthAdjust="spacingAndGlyphs">🎯 도전! 별 2배</text>
          ${y < 300
            ? '<path d="M-14 -32 L14 -32 L0 -50Z" fill="#FF6B4A" stroke="#fff" stroke-width="3" stroke-linejoin="round" class="ch-arrow up"/>'
            : '<path d="M-14 32 L14 32 L0 50Z" fill="#FF6B4A" stroke="#fff" stroke-width="3" stroke-linejoin="round" class="ch-arrow"/>'}
        </g>` : ''}
    </g>`;
}

// 밤하늘 배경: 달과 달빛 길, 오로라, 별, 빛나는 물결과 해파리
function skySVG() {
  const stars = Array.from({ length: 46 }, (_, k) => {
    const x = (k * 157 + 40) % (W + 400) - 200;
    const y = (k * 97) % 520 - 60;
    return `<circle cx="${x}" cy="${y}" r="${1 + (k % 3) * 0.8}" fill="${k % 5 ? '#FFFFFF' : '#FFE9A8'}" class="twinkle" style="animation-delay:-${((k * 0.37) % 3).toFixed(2)}s"/>`;
  }).join('');
  const jelly = (x, y, c, d) => `
    <g class="glow-jelly" style="animation-delay:-${d}s" transform="translate(${x} ${y})">
      <path d="M-16 0 Q-16 -20 0 -20 Q16 -20 16 0 Q8 4 0 0 Q-8 4 -16 0Z" fill="${c}" opacity=".75"/>
      <g stroke="${c}" stroke-width="2.5" opacity=".55" fill="none" stroke-linecap="round"><path d="M-9 2 q-4 10 0 20"/><path d="M0 2 q4 12 0 24"/><path d="M9 2 q-4 10 0 20"/></g>
    </g>`;
  return `
    <defs>
      <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#070B26"/><stop offset=".45" stop-color="#1B1F5E"/><stop offset="1" stop-color="#3A2A78"/>
      </linearGradient>
      <radialGradient id="moonGlow"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".55"/><stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/></radialGradient>
      <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5CFFB8" stop-opacity="0"/><stop offset=".3" stop-color="#5CFFB8" stop-opacity=".7"/>
        <stop offset=".65" stop-color="#7FB8FF" stop-opacity=".65"/><stop offset="1" stop-color="#C08CFF" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="ch2Glow"><stop offset="0%" stop-color="#FFF3A8" stop-opacity=".95"/><stop offset="55%" stop-color="#FFC53D" stop-opacity=".45"/><stop offset="100%" stop-color="#FFC53D" stop-opacity="0"/></radialGradient>
      <pattern id="glowWaves" width="120" height="44" patternUnits="userSpaceOnUse">
        <path d="M0 22 Q30 10 60 22 T120 22" stroke="#7FE8FF" stroke-width="2" fill="none" opacity=".22"/>
      </pattern>
    </defs>
    <rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#nightSky)"/>
    <rect class="wave-layer" x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#glowWaves)"/>
    <g class="aurora-band"><path d="M-300 90 Q-100 10 120 80 T540 60 T980 90 L980 150 Q760 110 540 130 T120 140 T-300 150Z" fill="url(#aurora)"/></g>
    <g class="aurora-band b2"><path d="M-300 170 Q0 110 260 160 T760 140 T1100 170 L1100 210 Q860 190 620 200 T160 210 T-300 220Z" fill="url(#aurora)" opacity=".7"/></g>
    <g>${stars}</g>
    <circle cx="690" cy="40" r="110" fill="url(#moonGlow)"/>
    <g transform="translate(690 40)"><circle r="38" fill="#FFF6D6"/><circle cx="-10" cy="-8" r="7" fill="#EFE3B8"/><circle cx="12" cy="10" r="5" fill="#EFE3B8"/><circle cx="8" cy="-16" r="3.5" fill="#EFE3B8"/></g>
    <g class="moonpath" fill="#FFF6D6">${Array.from({ length: 9 }, (_, k) => `<rect x="${680 - (k % 3) * 8}" y="${110 + k * 70}" width="${30 + (k % 3) * 14}" height="4" rx="2" class="twinkle" style="animation-delay:-${(k * 0.3).toFixed(1)}s" opacity=".5"/>`).join('')}</g>
    <g class="plankton">${Array.from({ length: 30 }, (_, k) => `<circle cx="${(k * 211) % W}" cy="${260 + ((k * 131) % 560)}" r="${1.5 + (k % 2)}" fill="#8FF7FF" class="twinkle" style="animation-delay:-${((k * 0.29) % 3).toFixed(2)}s"/>`).join('')}</g>
    ${jelly(250, 300, '#FF9EDB', 0)}${jelly(520, 560, '#9FF3FF', 1.4)}${jelly(60, 560, '#C9A4FF', 2.6)}
    <g class="shooting-layer"></g>`;
}

export class Sea2Scene {
  constructor(app, { island } = {}) {
    this.app = app;
    this.u = unit();
    this.alive = true;
    const ch = store.challenge2();
    this.selected = island ?? ch ?? Math.max(0, SEA2.findIndex((s, i) => store.isUnlocked2(i) && store.progress2(s.id) < 4));
    this.bar = topbar(app, { back: 'map', backLabel: '← 첫 번째 바다' });
    const route = SPOTS.slice(0, -1).map(([x1, y1], i) => {
      const [x2, y2] = SPOTS[i + 1];
      const done = store.progress2(SEA2[i].id) >= 2;
      return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 40} ${x2} ${y2}" fill="none" stroke="${done ? '#FFD86B' : '#9FF3FF'}" stroke-width="${done ? 7 : 4}" stroke-linecap="round" stroke-dasharray="1 16" opacity="${done ? 1 : 0.5}"/>`;
    }).join('');
    const misses = (store.data.wordMisses || []).length;
    this.el = h(`
      <div class="scene map sea2">
        <div class="map-sea">
          <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            ${skySVG()}
            ${route}
            ${SEA2.map((_, i) => islandSVG(i, i === this.selected)).join('')}
          </svg>
          ${misses ? `<button class="word-review-go" data-review>📅 문장제 복습 <b>${Math.min(misses, 5)}</b></button>` : ''}
        </div>
        <aside class="map-panel"></aside>
      </div>`);
    this.el.prepend(this.bar.el);
    this.svg = this.el.querySelector('.chart');
    this.svg.addEventListener('click', (e) => {
      const g = e.target.closest('.isle');
      if (!g) return;
      const i = Number(g.dataset.i);
      if (!store.isUnlocked2(i)) {
        sound.playBoing();
        toast(`${WORD_ISLANDS[SEA2[i - 1].word].name} 친구를 깨우면 열려요`);
        return;
      }
      sound.playPop();
      this.selected = i;
      this.el.querySelectorAll('.isle').forEach((it) => it.classList.toggle('selected', Number(it.dataset.i) === i));
      this.renderPanel();
    });
    this.el.querySelector('[data-review]')?.addEventListener('click', () => {
      sound.playPop();
      this.app.go('word', { review: true });
    });
    this.renderPanel();
  }

  mounted() {
    // 가끔 별똥별이 떨어져요
    const shoot = () => {
      if (!this.alive) return;
      const x = 80 + Math.random() * 520;
      const y = -40 + Math.random() * 120;
      const el = document.createElementNS(NS, 'g');
      el.setAttribute('class', 'shooting-star');
      el.setAttribute('transform', `translate(${x} ${y})`);
      el.innerHTML = '<path d="M0 0 L-90 -40" stroke="#FFF6D6" stroke-width="3" stroke-linecap="round"/><circle r="4" fill="#fff"/>';
      this.svg.querySelector('.shooting-layer').appendChild(el);
      setTimeout(() => el.remove(), 1300);
      this.shootTimer = setTimeout(shoot, 5000 + Math.random() * 6000);
    };
    this.shootTimer = setTimeout(shoot, 1500);
  }

  renderPanel() {
    const s = SEA2[this.selected];
    const w = WORD_ISLANDS[s.word];
    const p = store.progress2(s.id);
    const panel = this.el.querySelector('.map-panel');
    const modes = SEA2_STAGES.map((st, k) => ({ ...st, k, open: p >= st.to - 1, done: p >= st.to }));
    const rec = modes.find((m) => !m.done)?.k;
    const stageSub = (m) => (m.boss ? '해적 선장을 이기면 황금' : `${m.pass}개 맞히면 ${['알을 찾아요', '깨어나요', '자라요'][m.k]}`);
    panel.innerHTML = `
      <div class="panel-head">
        <div class="panel-art">${sea2Art(s.id, Math.max(1, p), Math.round(this.u * 8), w.icon)}</div>
        <div>
          <h2 style="color:#4B3A99">${w.icon} ${w.name} <small class="lv-chip" style="background:${LEVEL[w.level]}">${w.level}</small></h2>
          <p>${s.friend.species} ${s.friend.name} · ${w.about}</p>
        </div>
      </div>
      ${store.challenge2() === this.selected ? '<div class="challenge-tag">🎯 오늘의 도전 섬 · 별 2배!</div>' : ''}
      <div class="modes">
        ${modes.map((m) => `
          <button class="mode ${m.open ? '' : 'closed'} ${m.k === rec ? 'recommended' : ''}" data-stage="${m.k}">
            <span class="mode-icon">${m.boss ? '🏴‍☠️' : m.icon}</span>
            <span class="mode-text"><b>${m.label}</b><small>${m.open ? `${m.game} · ${stageSub(m)}` : '앞 단계를 먼저 해요'}</small></span>
            ${m.done ? '<span class="mode-done">✓</span>' : ''}
            ${m.k === rec ? '<span class="mode-tag">추천</span>' : ''}
          </button>`).join('')}
      </div>`;
    panel.onclick = (e) => {
      const b = e.target.closest('[data-stage]');
      if (!b) return;
      const m = modes[Number(b.dataset.stage)];
      if (!m.open) {
        sound.playBoing();
        toast('앞 단계를 먼저 끝내요');
        return;
      }
      sound.playPop();
      this.app.go('word', { island: this.selected, stage: m.k });
    };
  }

  destroy() {
    this.alive = false;
    clearTimeout(this.shootTimer);
    this.bar.destroy();
  }
}
