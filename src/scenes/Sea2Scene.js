// 두 번째 바다 지도: 문장제 섬 9개가 굽이굽이. 하늘은 실제 시각을 따라요 (밤: 별빛 밤바다·초승달·별똥별, 노을, 낮: 해·구름·비행기).
// 오른쪽은 고른 섬의 네 단계. 오늘의 도전 섬(별 2배)과 문장제 복습도 여기서 시작해요.
import { store } from '../core/store.js';
import { h, topbar, toast, unit, timeOfDay } from '../core/ui.js';
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

// 하늘 배경: 실제 시각을 따라 바뀌어요 (어항과 같아요)
//  밤: 별이 가득, 초승달, 오로라, 빛나는 해파리, 가끔 별똥별
//  노을: 주황·보라 하늘, 지는 해, 첫 별, 가끔 별똥별
//  낮: 파란 하늘, 해와 구름, 가끔 비행기
function starsSVG(n, maxY) {
  return Array.from({ length: n }, (_, k) => {
    const x = ((k * 157 + 40) % (W + 200)) - 100;
    const y = ((k * 97 + (k % 7) * 13) % (maxY + 40)) - 40;
    const big = k % 9 === 0;
    const r = 1.3 + (k % 3) * 0.8;
    const d = `animation-delay:-${((k * 0.37) % 3).toFixed(2)}s`;
    // 큰 별은 반짝이는 십자 모양
    return big
      ? `<path class="twinkle" style="${d}" transform="translate(${x} ${y})" d="M0 -10 L2.2 -2.2 L10 0 L2.2 2.2 L0 10 L-2.2 2.2 L-10 0 L-2.2 -2.2Z" fill="#FFF3C4"/>`
      : `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${k % 5 ? '#FFFFFF' : '#FFE9A8'}" class="twinkle" style="${d}"/>`;
  }).join('');
}

function cloudSVG(x, y, s, cls) {
  return `<g class="sky-cloud ${cls}" transform="translate(${x} ${y}) scale(${s})">
    <g fill="#FFFFFF"><ellipse cx="0" cy="0" rx="60" ry="22"/><circle cx="-22" cy="-14" r="22"/><circle cx="12" cy="-22" r="28"/><circle cx="40" cy="-8" r="18"/></g>
    <ellipse cx="0" cy="12" rx="54" ry="8" fill="#DDEFFF" opacity=".8"/></g>`;
}

function skySVG(tod) {
  const night = tod === 'night';
  const evening = tod === 'evening';
  const jelly = (x, y, c, d) => `
    <g class="glow-jelly" style="animation-delay:-${d}s" transform="translate(${x} ${y})">
      <path d="M-16 0 Q-16 -20 0 -20 Q16 -20 16 0 Q8 4 0 0 Q-8 4 -16 0Z" fill="${c}" opacity=".75"/>
      <g stroke="${c}" stroke-width="2.5" opacity=".55" fill="none" stroke-linecap="round"><path d="M-9 2 q-4 10 0 20"/><path d="M0 2 q4 12 0 24"/><path d="M9 2 q-4 10 0 20"/></g>
    </g>`;
  const sky = night
    ? '<stop offset="0" stop-color="#070B26"/><stop offset=".45" stop-color="#1B1F5E"/><stop offset="1" stop-color="#3A2A78"/>'
    : evening
      ? '<stop offset=".2" stop-color="#3B2F7A"/><stop offset=".3" stop-color="#B0578A"/><stop offset=".42" stop-color="#F08A66"/><stop offset=".55" stop-color="#9A5C9E"/><stop offset=".8" stop-color="#3A3380"/>'
      : '<stop offset=".22" stop-color="#A8E6FF"/><stop offset=".42" stop-color="#5DC8EE"/><stop offset=".78" stop-color="#1E88C0"/>';
  // 해·달 자리 (지도 오른쪽 위)
  const orb = night
    ? `<circle cx="690" cy="40" r="120" fill="url(#moonGlow)"/>
       <g transform="translate(690 40) rotate(-20)"><circle r="40" fill="#FFF6D6" mask="url(#crescentCut)"/></g>`
    : evening
      ? `<circle cx="680" cy="40" r="170" fill="url(#sunGlowEve)"/><circle cx="680" cy="40" r="58" fill="#FF9F5A"/><circle cx="680" cy="40" r="44" fill="#FFD08A"/>`
      : `<circle cx="680" cy="30" r="140" fill="url(#sunGlow)"/>
         <g class="sun-rays" transform="translate(680 30)">${Array.from({ length: 12 }, (_, k) => `<rect x="-5" y="-92" width="10" height="26" rx="5" fill="#FFE27A" transform="rotate(${k * 30})"/>`).join('')}</g>
         <circle cx="680" cy="30" r="52" fill="#FFD84A" stroke="#FFB930" stroke-width="5"/>`;
  // 물 위 반짝임 (밤: 달빛 길, 낮·노을: 햇빛)
  const pathX = 690;
  const glitter = `<g class="moonpath" fill="${night ? '#FFF6D6' : evening ? '#FFD39A' : '#FFFFFF'}">${Array.from({ length: 9 }, (_, k) => `<rect x="${pathX - 10 - (k % 3) * 8}" y="${110 + k * 70}" width="${30 + (k % 3) * 14}" height="4" rx="2" class="twinkle" style="animation-delay:-${(k * 0.3).toFixed(1)}s" opacity=".5"/>`).join('')}</g>`;
  return `
    <defs>
      <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">${sky}</linearGradient>
      <radialGradient id="moonGlow"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".45"/><stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/></radialGradient>
      <radialGradient id="sunGlow"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></radialGradient>
      <radialGradient id="sunGlowEve"><stop offset="0" stop-color="#FFB36B" stop-opacity=".8"/><stop offset="1" stop-color="#FF8A5B" stop-opacity="0"/></radialGradient>
      <linearGradient id="shootTail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6D6" stop-opacity="0"/><stop offset="1" stop-color="#FFF6D6"/></linearGradient>
      <mask id="crescentCut"><circle r="40" fill="#fff"/><circle cx="17" cy="-9" r="35" fill="#000"/></mask>
      <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5CFFB8" stop-opacity="0"/><stop offset=".3" stop-color="#5CFFB8" stop-opacity=".7"/>
        <stop offset=".65" stop-color="#7FB8FF" stop-opacity=".65"/><stop offset="1" stop-color="#C08CFF" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="ch2Glow"><stop offset="0%" stop-color="#FFF3A8" stop-opacity=".95"/><stop offset="55%" stop-color="#FFC53D" stop-opacity=".45"/><stop offset="100%" stop-color="#FFC53D" stop-opacity="0"/></radialGradient>
      <pattern id="glowWaves" width="120" height="44" patternUnits="userSpaceOnUse">
        <path d="M0 22 Q30 10 60 22 T120 22" stroke="${night ? '#7FE8FF' : '#FFFFFF'}" stroke-width="2" fill="none" opacity="${night ? 0.22 : 0.35}"/>
      </pattern>
    </defs>
    <rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#nightSky)"/>
    <rect class="wave-layer" x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#glowWaves)"/>
    ${night ? `
      <g class="aurora-band"><path d="M-300 90 Q-100 10 120 80 T540 60 T980 90 L980 150 Q760 110 540 130 T120 140 T-300 150Z" fill="url(#aurora)"/></g>
      <g class="aurora-band b2"><path d="M-300 170 Q0 110 260 160 T760 140 T1100 170 L1100 210 Q860 190 620 200 T160 210 T-300 220Z" fill="url(#aurora)" opacity=".7"/></g>` : ''}
    ${night ? `<g>${starsSVG(150, 640)}</g>` : evening ? `<g opacity=".8">${starsSVG(30, 220)}</g>` : ''}
    ${orb}
    ${glitter}
    ${night ? '' : `<g class="cloud-layer ${evening ? 'eve' : ''}">${cloudSVG(80, 60, 1, 'c1')}${cloudSVG(380, 120, 0.7, 'c2')}${cloudSVG(-60, 200, 0.85, 'c3')}${cloudSVG(520, 230, 0.55, 'c4')}</g>`}
    ${night || evening ? `<g class="plankton">${Array.from({ length: 30 }, (_, k) => `<circle cx="${(k * 211) % W}" cy="${260 + ((k * 131) % 560)}" r="${1.5 + (k % 2)}" fill="#8FF7FF" class="twinkle" style="animation-delay:-${((k * 0.29) % 3).toFixed(2)}s"/>`).join('')}</g>` : ''}
    ${night ? `${jelly(250, 300, '#FF9EDB', 0)}${jelly(520, 560, '#9FF3FF', 1.4)}${jelly(60, 560, '#C9A4FF', 2.6)}` : ''}
    <g class="shooting-layer"></g>`;
}

export class Sea2Scene {
  constructor(app, { island } = {}) {
    this.app = app;
    this.u = unit();
    this.alive = true;
    const ch = store.challenge2();
    this.tod = timeOfDay();
    this.selected = island ?? ch ?? Math.max(0, SEA2.findIndex((s, i) => store.isUnlocked2(i) && store.progress2(s.id) < 4));
    this.bar = topbar(app, { back: 'map', backLabel: '← 첫 번째 바다' });
    const route = SPOTS.slice(0, -1).map(([x1, y1], i) => {
      const [x2, y2] = SPOTS[i + 1];
      const done = store.progress2(SEA2[i].id) >= 2;
      return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 40} ${x2} ${y2}" fill="none" stroke="${done ? '#FFD86B' : '#9FF3FF'}" stroke-width="${done ? 7 : 4}" stroke-linecap="round" stroke-dasharray="1 16" opacity="${done ? 1 : 0.5}"/>`;
    }).join('');
    const misses = (store.data.wordMisses || []).length;
    this.el = h(`
      <div class="scene map sea2 sky-${this.tod}">
        <div class="map-sea">
          <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            ${skySVG(this.tod)}
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
    // 밤·노을에는 가끔 별똥별(가끔 두 개 연달아), 낮에는 가끔 비행기가 지나가요
    const layer = this.svg.querySelector('.shooting-layer');
    const star = () => {
      const el = document.createElementNS(NS, 'g');
      el.setAttribute('class', 'shooting-star');
      el.setAttribute('transform', `translate(${80 + Math.random() * 520} ${-40 + Math.random() * 140})`);
      el.innerHTML = '<path d="M0 0 L-110 -48" stroke="url(#shootTail)" stroke-width="3.5" stroke-linecap="round"/><path d="M0 0 L-110 -48" stroke="#FFF6D6" stroke-width="1.2" stroke-linecap="round" opacity=".7"/><circle r="4.5" fill="#fff"/><circle r="9" fill="#FFF6D6" opacity=".35"/>';
      layer.appendChild(el);
      setTimeout(() => el.remove(), 1300);
    };
    const plane = () => {
      const el = document.createElementNS(NS, 'g');
      const y = 40 + Math.random() * 160;
      el.setAttribute('class', 'sky-plane');
      el.setAttribute('transform', `translate(0 ${y})`);
      el.innerHTML = `<g class="plane-body">
        <path d="M-400 2 H-60" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 10" opacity=".75"/>
        <path d="M-50 -6 C-20 -12 30 -12 46 -4 C54 0 54 6 46 8 C30 14 -20 14 -50 8Z" fill="#FFFFFF" stroke="#4A6FA5" stroke-width="3"/>
        <path d="M-44 -6 L-58 -28 L-42 -28 L-24 -8Z" fill="#FF6B6B" stroke="#4A6FA5" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-6 4 L-24 30 L-6 30 L18 6Z" fill="#6FC3FF" stroke="#4A6FA5" stroke-width="3" stroke-linejoin="round"/>
        <g fill="#6FC3FF"><circle cx="6" cy="0" r="3.5"/><circle cx="18" cy="0" r="3.5"/><circle cx="30" cy="0" r="3.5"/></g>
      </g>`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), 11000);
    };
    const tick = () => {
      if (!this.alive) return;
      if (this.tod === 'day') {
        plane();
        this.shootTimer = setTimeout(tick, 14000 + Math.random() * 12000);
        return;
      }
      star();
      if (Math.random() < 0.3) setTimeout(() => this.alive && star(), 450);
      this.shootTimer = setTimeout(tick, this.tod === 'night' ? 3000 + Math.random() * 4000 : 6000 + Math.random() * 6000);
    };
    this.shootTimer = setTimeout(tick, this.tod === 'day' ? 2500 : 1200);
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
      </div>
      <button class="island-go in-panel" data-island>🏝️ 친구들의 섬 <small>깨어난 친구 ${SEA2.filter((it) => store.progress2(it.id) >= 2).length}/9</small></button>`;
    panel.onclick = (e) => {
      if (e.target.closest('[data-island]')) {
        sound.playPop();
        this.app.go('island', { from: 'sea2' });
        return;
      }
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
