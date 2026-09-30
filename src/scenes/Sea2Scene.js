// 두 번째 바다 지도: 문장제 섬 9개가 아래에서 위로 굽이굽이. 오른쪽은 고른 섬의 네 단계
import { store } from '../core/store.js';
import { h, topbar, toast, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { SEA2, SEA2_STAGES } from '../data/sea2.js';
import { WORD_ISLANDS } from '../data/wordProblems.js';
import { sea2Art } from '../graphics/sea2.js';

const W = 760;
const H = 800;
const SPOTS = [[130, 690], [380, 670], [630, 690], [630, 440], [380, 420], [130, 440], [130, 190], [380, 170], [630, 190]];
const LEVEL = { 하: '#2E8B57', 중: '#D98A00', '중·상': '#D98A00', 상: '#C0392B' };

function islandSVG(i, selected) {
  const s = SEA2[i];
  const w = WORD_ISLANDS[s.word];
  const [x, y] = SPOTS[i];
  const open = store.isUnlocked2(i);
  const p = store.progress2(s.id);
  const art = open ? sea2Art(s.id, p, 84, w.icon) : '';
  return `
    <g class="isle ${open ? '' : 'locked'} ${selected ? 'selected' : ''}" data-i="${i}" transform="translate(${x} ${y})" role="button" aria-label="${w.name}">
      <ellipse cx="0" cy="16" rx="112" ry="52" fill="#B9A7F0" opacity=".45"/>
      <circle class="ring" cx="0" cy="-8" r="112" fill="none" stroke="#FFC53D" stroke-width="5" stroke-dasharray="18 12"/>
      <path d="M-92 12 C-97 -20 -50 -40 0 -38 C56 -40 97 -18 92 14 C90 40 40 52 0 50 C-46 52 -88 40 -92 12Z" fill="#F6E3B4" stroke="#E3C78A" stroke-width="4"/>
      <path d="M-64 2 C-66 -20 -30 -31 5 -29 C42 -31 68 -16 62 4 C58 19 20 23 0 21 C-31 23 -62 17 -64 2Z" fill="#9BD58C" stroke="#5FAE55" stroke-width="3"/>
      ${open ? `<g class="isle-char"><foreignObject x="-42" y="-96" width="84" height="84">${art}</foreignObject></g>` : `
        <g fill="#fff"><circle cx="-50" cy="-10" r="34"/><circle cx="-10" cy="-30" r="42"/><circle cx="38" cy="-14" r="36"/><circle cx="68" cy="6" r="24"/><rect x="-80" y="-6" width="150" height="34" rx="17"/></g>
        <g transform="translate(0 -6)"><rect x="-13" y="-6" width="26" height="20" rx="4" fill="#9FB4BE"/><path d="M-8 -6 v-6 a8 8 0 0 1 16 0 v6" stroke="#9FB4BE" stroke-width="4" fill="none"/></g>`}
      <g transform="translate(0 58)">
        <rect x="-78" y="-24" width="156" height="36" rx="10" fill="${open ? '#6D4FB5' : '#A7B5BC'}" stroke="#fff" stroke-width="3"/>
        <text x="0" y="2" text-anchor="middle" font-family="Jua, sans-serif" font-size="22" fill="#fff">${w.icon} ${w.name}</text>
      </g>
      ${open ? `<circle cx="84" cy="-44" r="15" fill="${LEVEL[w.level]}" stroke="#fff" stroke-width="3"/><text x="84" y="-37" text-anchor="middle" font-family="Jua, sans-serif" font-size="${w.level.length > 1 ? 11 : 18}" fill="#fff">${w.level}</text>` : ''}
      ${open ? `<g transform="translate(0 86)">${SEA2_STAGES.map((st, k) => `<circle cx="${-24 + k * 16}" cy="0" r="5.5" fill="${p >= st.to ? '#FFC53D' : 'rgba(255,255,255,.55)'}" stroke="#6D4FB5" stroke-width="1.5"/>`).join('')}</g>` : ''}
    </g>`;
}

export class Sea2Scene {
  constructor(app, { island } = {}) {
    this.app = app;
    this.u = unit();
    this.selected = island ?? Math.max(0, SEA2.findIndex((s, i) => store.isUnlocked2(i) && store.progress2(s.id) < 4));
    this.bar = topbar(app, { back: 'map', backLabel: '← 첫 번째 바다' });
    const route = SPOTS.slice(0, -1).map(([x1, y1], i) => {
      const [x2, y2] = SPOTS[i + 1];
      const done = store.progress2(SEA2[i].id) >= 2;
      return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 40} ${x2} ${y2}" fill="none" stroke="${done ? '#FFE08A' : '#fff'}" stroke-width="${done ? 7 : 5}" stroke-linecap="round" stroke-dasharray="1 16" opacity="${done ? 1 : 0.55}"/>`;
    }).join('');
    this.el = h(`
      <div class="scene map sea2">
        <div class="map-sea">
          <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            <defs><radialGradient id="sea2Grad" cx="50%" cy="40%" r="80%"><stop offset="0%" stop-color="#8E7FD8"/><stop offset="60%" stop-color="#5B5BB5"/><stop offset="100%" stop-color="#2E3A7A"/></radialGradient></defs>
            <rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#sea2Grad)"/>
            <g fill="#fff" opacity=".5">${Array.from({ length: 26 }, (_, k) => `<circle cx="${(k * 137) % W}" cy="${(k * 293) % H}" r="${1.5 + (k % 3)}" class="twinkle" style="animation-delay:-${(k % 7) * 0.4}s"/>`).join('')}</g>
            ${route}
            ${SEA2.map((_, i) => islandSVG(i, i === this.selected)).join('')}
          </svg>
        </div>
        <aside class="map-panel"></aside>
      </div>`);
    this.el.prepend(this.bar.el);
    this.el.querySelector('.chart').addEventListener('click', (e) => {
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
    this.renderPanel();
  }

  renderPanel() {
    const s = SEA2[this.selected];
    const w = WORD_ISLANDS[s.word];
    const p = store.progress2(s.id);
    const panel = this.el.querySelector('.map-panel');
    const modes = SEA2_STAGES.map((st, k) => ({ ...st, k, open: p >= st.to - 1, done: p >= st.to }));
    const rec = modes.find((m) => !m.done)?.k;
    panel.innerHTML = `
      <div class="panel-head">
        <div class="panel-art">${sea2Art(s.id, Math.max(1, p), Math.round(this.u * 9), w.icon)}</div>
        <div>
          <h2 style="color:#6D4FB5">${w.icon} ${w.name} <small class="lv-chip" style="background:${LEVEL[w.level]}">${w.level}</small></h2>
          <p>${s.friend.species} ${s.friend.name} · ${w.about}</p>
        </div>
      </div>
      <div class="modes">
        ${modes.map((m) => `
          <button class="mode ${m.open ? '' : 'closed'} ${m.k === rec ? 'recommended' : ''}" data-stage="${m.k}">
            <span class="mode-icon">${m.boss ? '🏴‍☠️' : m.icon}</span>
            <span class="mode-text"><b>${m.label}</b><small>${m.open ? `${m.game} · ${m.boss ? '해적 선장을 이기면 황금' : `${m.pass}개 맞히면 ${m.label === '알 찾기' ? '알을 찾아요' : m.label === '부화' ? '깨어나요' : '자라요'}`}` : '앞 단계를 먼저 해요'}</small></span>
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
    this.bar.destroy();
  }
}
