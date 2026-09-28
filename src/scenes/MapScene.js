// 바다 지도: 왼쪽은 섬 8개가 있는 해도, 오른쪽은 고른 섬의 게임 목록
import { store } from '../core/store.js';
import { h, topbar, toast, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { CHARACTERS, DAN_ORDER, STAGES, stageName } from '../data/characters.js';
import { charSVG } from '../graphics/characters.js';
import { ISLAND_PROPS, UNDERWATER, SHARK, FISH_SCHOOL, CLOUD, GULLS, DOLPHIN, LITTLE_FISH } from '../graphics/mapArt.js';

const NS = 'http://www.w3.org/2000/svg';
function svgEl(markup) {
  const box = document.createElementNS(NS, 'svg');
  box.innerHTML = markup.trim();
  return box.firstElementChild;
}

// 해도 좌표 (viewBox 760×800). DAN_ORDER 순서로 아래에서 위로 굽이굽이.
const W = 760;
const H = 800;
const SPOTS = [[130, 690], [370, 660], [620, 690], [615, 455], [375, 425], [135, 440], [215, 195], [520, 170]];

function modesFor(p) {
  return [
    { id: 'song', icon: '🎵', label: '따라 하기', sub: '한 줄씩 세 번 따라 말해요', open: true, done: false },
    { id: 'stepping', icon: '🌈', label: '무지개 징검다리', sub: p >= 1 ? '가리기 모드로 다시 건너요' : '건너면 알을 찾아요', open: true, done: p >= 1 },
    { id: 'mix', icon: '🫧', label: '섞어 풀기', sub: p >= 2 ? '연습하고 별 모으기' : p >= 1 ? '7개 맞히면 알이 깨어나요' : '징검다리를 먼저 건너요', open: p >= 1, done: p >= 2 },
    { id: 'keypad', icon: '🐚', label: '조개 숫자판', sub: p >= 3 ? '연습하고 진주 모으기' : p >= 2 ? '숫자를 직접 써서 7개 맞히면 자라요' : '친구가 깨어나면 열려요', open: p >= 2, done: p >= 3 },
    { id: 'boss', icon: '🦈', label: '상어 보스전', sub: p >= 4 ? '다시 겨뤄서 별 모으기' : p >= 3 ? '상어를 이기면 황금으로 진화해요' : '조개 숫자판을 먼저 끝내요', open: p >= 3, done: p >= 4 }
  ];
}

function nextMode(p) {
  return [('song'), 'mix', 'keypad', 'boss'][p] || null;
}

// Catmull-Rom 곡선으로 섬 사이 뱃길
function segment(i) {
  const P = (k) => SPOTS[Math.max(0, Math.min(SPOTS.length - 1, k))];
  const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
  const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
  const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
  return `M${p1[0]} ${p1[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
}

function islandSVG(dan, i, selected) {
  const [x, y] = SPOTS[i];
  const open = store.isUnlocked(dan);
  const p = store.data.progress[dan];
  const c = CHARACTERS[dan];
  const pips = STAGES.map((s, k) => `<circle cx="${-24 + k * 16}" cy="84" r="5.5" fill="${p >= s.progress ? '#FFC53D' : 'rgba(255,255,255,.55)'}" stroke="#8A5528" stroke-width="1.5"/>`).join('');
  const art = !open
    ? ''
    : p > 0
      ? charSVG(dan, p, 84)
      : `<svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="50" r="22" fill="#fff" opacity=".85"/><text x="42" y="60" text-anchor="middle" font-family="Jua, sans-serif" font-size="30" fill="${c.color}">?</text></svg>`;
  const cloud = open ? '' : `
    <g class="fog">
      <g fill="#fff"><circle cx="-50" cy="-10" r="34"/><circle cx="-10" cy="-30" r="42"/><circle cx="38" cy="-14" r="36"/><circle cx="68" cy="6" r="24"/><circle cx="-76" cy="12" r="22"/><rect x="-80" y="-6" width="150" height="34" rx="17"/></g>
      <g transform="translate(0 -6)"><rect x="-13" y="-6" width="26" height="20" rx="4" fill="#9FB4BE"/><path d="M-8 -6 v-6 a8 8 0 0 1 16 0 v6" stroke="#9FB4BE" stroke-width="4" fill="none"/></g>
    </g>`;

  return `
    <g class="isle ${open ? '' : 'locked'} ${selected ? 'selected' : ''}" data-dan="${dan}" transform="translate(${x} ${y})" role="button" aria-label="${dan}단 섬">
      <ellipse cx="0" cy="16" rx="112" ry="52" fill="#8FE0EE" opacity=".55"/>
      <ellipse class="surf" cx="0" cy="16" rx="98" ry="42" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="12 10" opacity=".7"/>
      <circle class="ring" cx="0" cy="-8" r="112" fill="none" stroke="#FFC53D" stroke-width="5" stroke-dasharray="18 12"/>
      <path d="M-92 12 C-97 -20 -50 -40 0 -38 C56 -40 97 -18 92 14 C90 40 40 52 0 50 C-46 52 -88 40 -92 12Z" fill="#F6E3B4" stroke="#E3C78A" stroke-width="4"/>
      <path d="M-64 2 C-66 -20 -30 -31 5 -29 C42 -31 68 -16 62 4 C58 19 20 23 0 21 C-31 23 -62 17 -64 2Z" fill="#8BD17C" stroke="#5FAE55" stroke-width="3"/>
      ${ISLAND_PROPS[dan]}
      ${p === 4 ? '<g class="twinkle" fill="#FFF3B0"><path d="M-90 -40 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4z"/><path d="M86 -60 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3z"/></g>' : ''}
      <g transform="translate(58 -4)"><line x1="0" y1="0" x2="0" y2="-54" stroke="#8A5528" stroke-width="4"/><path d="M2 -54 L30 -46 L2 -38 Z" fill="${c.color}"/></g>
      <g class="isle-char"><g transform="translate(-42 -96)">${art}</g></g>
      ${cloud}
      <g transform="translate(0 56)">
        <rect x="-3" y="-8" width="6" height="16" fill="#8A5528"/>
        <rect x="-40" y="-26" width="80" height="34" rx="8" fill="${open ? '#C98A4B' : '#A7B5BC'}" stroke="${open ? '#8A5528' : '#7F8F97'}" stroke-width="3"/>
        <text x="0" y="0" text-anchor="middle" font-family="Jua, sans-serif" font-size="24" fill="#fff">${dan}단</text>
      </g>
      ${open ? `<g transform="translate(0 0)">${pips}</g>` : ''}
    </g>`;
}

function mapSVG(selected) {
  const lastOpen = DAN_ORDER.reduce((m, d, i) => (store.isUnlocked(d) ? i : m), 0);
  const route = SPOTS.slice(0, -1).map((_, i) => {
    const done = i < lastOpen;
    return `<path d="${segment(i)}" fill="none" stroke="${done ? '#FFE08A' : '#fff'}" stroke-width="${done ? 7 : 5}" stroke-linecap="round" stroke-dasharray="1 16" opacity="${done ? 1 : 0.6}"/>`;
  }).join('');
  const [bx, by] = SPOTS[DAN_ORDER.indexOf(selected)];
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="seaGrad" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stop-color="#7AD3E8"/><stop offset="60%" stop-color="#3AA4CC"/><stop offset="100%" stop-color="#1D83B0"/>
        </radialGradient>
        <pattern id="waves" width="80" height="40" patternUnits="userSpaceOnUse">
          <path d="M4 20 q10 -8 20 0 t20 0" stroke="#fff" stroke-opacity=".22" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M44 38 q8 -6 16 0" stroke="#fff" stroke-opacity=".15" stroke-width="2" fill="none" stroke-linecap="round"/>
        </pattern>
      </defs>
      <rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#seaGrad)"/>
      <rect class="wave-layer" x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#waves)"/>
      <rect class="wave-layer2" x="-400" y="-360" width="${W + 800}" height="${H + 800}" fill="url(#waves)" opacity=".6"/>
      ${UNDERWATER}
      <g class="critters-under"></g>
      <g transform="translate(690 90)" class="compass">
        <circle r="42" fill="#FFF7E3" stroke="#C98A4B" stroke-width="4"/>
        <path d="M0 -34 L8 0 L0 34 L-8 0Z" fill="#E8603C"/><path d="M-34 0 L0 -8 L34 0 L0 8Z" fill="#0B6E99"/>
        <circle r="5" fill="#fff" stroke="#8A5528" stroke-width="2"/>
        <text y="-46" text-anchor="middle" font-family="Jua, sans-serif" font-size="18" fill="#fff">북</text>
      </g>
      ${route}
      ${DAN_ORDER.map((d, i) => islandSVG(d, i, d === selected)).join('')}
      <g class="critters-over"></g>
      <g class="boat" style="transform: translate(${bx + 100}px, ${by + 30}px)">
        <g class="boat-bob">
          <path d="M-30 0 H30 L20 16 H-20 Z" fill="#C0392B" stroke="#7F2A1F" stroke-width="3" stroke-linejoin="round"/>
          <line x1="0" y1="0" x2="0" y2="-46" stroke="#6B4423" stroke-width="4"/>
          <path d="M3 -44 L28 -8 H3 Z" fill="#fff" stroke="#C9D6DC" stroke-width="2"/>
          <path d="M-3 -38 L-22 -8 H-3 Z" fill="#FFE08A"/>
          <path d="M-40 22 q10 -6 20 0 t20 0 t20 0 t20 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>
        </g>
      </g>
      <g class="sky"></g>
      <g class="fx"></g>
    </svg>`;
}

export class MapScene {
  constructor(app, { dan } = {}) {
    this.app = app;
    this.u = unit();
    this.selected = dan && store.isUnlocked(dan) ? dan : DAN_ORDER.find((d) => store.isUnlocked(d) && store.data.progress[d] < 2) || 2;
    this.bar = topbar(app, { back: 'home', backLabel: '← 어항' });
    this.el = h(`
      <div class="scene map">
        <div class="map-sea">${mapSVG(this.selected)}</div>
        <aside class="map-panel"></aside>
      </div>`);
    this.el.prepend(this.bar.el);
    this.svg = this.el.querySelector('.chart');
    this.svg.addEventListener('click', (e) => this.onTap(e));
    this.renderPanel();
    this.buildCritters();
  }

  mounted() {
    this.last = performance.now();
    this.t = 0;
    const loop = () => {
      try {
        this.animate();
      } catch (err) {
        console.error('지도 움직임 오류:', err);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  buildCritters() {
    const under = this.svg.querySelector('.critters-under');
    const sky = this.svg.querySelector('.sky');
    // 상어 두 마리: 섬 사이 넓은 바닷길을 오가요
    this.sharks = [
      { cx: 400, amp: 300, base: 565, speed: 0.22, phase: 0 },
      { cx: 420, amp: 250, base: 312, speed: 0.18, phase: 2 }
    ].map((sh) => {
      const el = svgEl(`<g class="shark" role="button" aria-label="상어">${SHARK}</g>`);
      under.appendChild(el);
      return { ...sh, el, jumping: 0 };
    });
    this.schools = [
      { cx: 708, cy: 300, rx: 22, ry: 110, speed: 0.35, phase: 0 },
      { cx: 380, cy: 772, rx: 300, ry: 6, speed: 0.12, phase: 1 }
    ].map((sc) => {
      const el = svgEl(`<g>${FISH_SCHOOL}</g>`);
      under.appendChild(el);
      return { ...sc, el };
    });
    this.clouds = [
      { x: 100, y: 90, speed: 9 },
      { x: 560, y: 560, speed: 7 }
    ].map((cl) => {
      const el = svgEl(`<g class="map-cloud">${CLOUD}</g>`);
      sky.appendChild(el);
      return { ...cl, el };
    });
    this.gull = { el: svgEl(`<g opacity="0">${GULLS}</g>`), x: -80, y: 60, active: false, wait: 4 };
    sky.appendChild(this.gull.el);
    this.dolphinWait = 3;
  }

  toSvg(e) {
    const pt = this.svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  // 물 위로 뛰어오르기 (돌고래, 작은 물고기)
  leap(markup, x, y, dist, height, dur) {
    const el = svgEl(`<g>${markup}</g>`);
    this.svg.querySelector('.fx').appendChild(el);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const start = performance.now();
    this.splash(x, y);
    const step = (now) => {
      const k = Math.min(1, (now - start) / (dur * 1000));
      const px = x + dir * dist * k;
      const py = y - height * Math.sin(Math.PI * k);
      el.setAttribute('transform', `translate(${px} ${py}) rotate(${(k - 0.5) * 70 * dir}) scale(${dir} 1)`);
      if (k < 1 && this.svg.isConnected) requestAnimationFrame(step);
      else {
        el.remove();
        this.splash(px, y);
      }
    };
    requestAnimationFrame(step);
  }

  splash(x, y) {
    const el = svgEl(`<g transform="translate(${x} ${y})"><circle class="map-ripple" r="18" fill="none" stroke="#fff" stroke-width="3"/><circle class="map-ripple late" r="12" fill="none" stroke="#fff" stroke-width="2"/></g>`);
    this.svg.querySelector('.fx').appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  sayOnMap(x, y, text) {
    this.svg.querySelector('.map-say')?.remove();
    const w = Math.min(330, text.length * 16 + 30);
    const bx = Math.max(10, Math.min(W - w - 10, x - w / 2));
    const el = svgEl(`
      <g class="map-say">
        <path d="M${x - 8} ${y - 4} L${x} ${y + 10} L${x + 8} ${y - 4}Z" fill="#fff"/>
        <rect x="${bx}" y="${y - 44}" width="${w}" height="42" rx="21" fill="#fff" stroke="#CFE6EE" stroke-width="2"/>
        <text x="${bx + w / 2}" y="${y - 16}" text-anchor="middle" font-family="Jua, sans-serif" font-size="19" fill="#0F2A3A">${text}</text>
      </g>`);
    this.svg.querySelector('.fx').appendChild(el);
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => el.remove(), 2400);
  }

  jumpShark(sh) {
    if (sh.jumping) return;
    sound.playBoing();
    sh.jumping = 0.0001;
    const [x, y] = sh.pos;
    this.splash(x, y);
    this.sayOnMap(x, y - 90, '보스전에서 기다릴게! 🦈');
  }

  animate() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;

    for (const sh of this.sharks) {
      if (!sh.jumping) sh.phase += sh.speed * dt;
      const x = sh.cx + sh.amp * Math.sin(sh.phase);
      const y = sh.base + 10 * Math.sin(sh.phase * 2);
      const face = Math.cos(sh.phase) >= 0 ? 1 : -1;
      sh.pos = [x, y];
      let lift = 0;
      let rot = 0;
      if (sh.jumping) {
        sh.jumping += dt / 1.3;
        const k = Math.min(1, sh.jumping);
        lift = 80 * Math.sin(Math.PI * k);
        rot = (k - 0.5) * 50;
        if (sh.jumping >= 1) {
          sh.jumping = 0;
          this.splash(x, y);
          sound.playPop();
        }
      }
      sh.el.querySelector('.shark-swim').setAttribute('opacity', sh.jumping ? 0 : 1);
      sh.el.querySelector('.shark-jump').setAttribute('opacity', sh.jumping ? 1 : 0);
      sh.el.setAttribute('transform', `translate(${x} ${y - lift}) rotate(${rot * face}) scale(${face} 1)`);
    }

    for (const sc of this.schools) {
      sc.phase += sc.speed * dt;
      const x = sc.cx + sc.rx * Math.sin(sc.phase);
      const y = sc.cy + sc.ry * Math.cos(sc.phase);
      const dx = Math.cos(sc.phase) * sc.rx;
      const dy = -Math.sin(sc.phase) * sc.ry;
      const face = (Math.abs(dx) > Math.abs(dy) ? dx : dy) >= 0 ? 1 : -1;
      sc.el.setAttribute('transform', `translate(${x} ${y}) scale(${face} 1)`);
    }

    for (const cl of this.clouds) {
      cl.x += cl.speed * dt;
      if (cl.x > W + 160) cl.x = -160;
      cl.el.setAttribute('transform', `translate(${cl.x} ${cl.y})`);
    }

    const g = this.gull;
    if (!g.active) {
      g.wait -= dt;
      if (g.wait <= 0) {
        Object.assign(g, { active: true, x: -80, y: 40 + Math.random() * 90 });
        g.el.setAttribute('opacity', 1);
      }
    } else {
      g.x += 70 * dt;
      g.y += Math.sin(this.t * 2) * 0.3;
      g.el.setAttribute('transform', `translate(${g.x} ${g.y})`);
      if (g.x > W + 80) {
        Object.assign(g, { active: false, wait: 10 + Math.random() * 10 });
        g.el.setAttribute('opacity', 0);
      }
    }

    // 가끔 돌고래가 넓은 바닷길에서 뛰어올라요
    this.dolphinWait -= dt;
    if (this.dolphinWait <= 0) {
      this.dolphinWait = 6 + Math.random() * 6;
      const lanes = [565, 312, 772];
      this.leap(DOLPHIN, 120 + Math.random() * 520, lanes[Math.floor(Math.random() * lanes.length)], 90, 60, 1.4);
    }
  }

  onTap(e) {
    const shark = e.target.closest('.shark');
    if (shark) {
      this.jumpShark(this.sharks.find((sh) => sh.el === shark));
      return;
    }
    if (e.target.closest('.isle')) {
      this.onIsland(e);
      return;
    }
    // 바다를 누르면 물결이 퍼지고 작은 물고기가 폴짝
    const pt = this.toSvg(e);
    sound.playPop();
    this.splash(pt.x, pt.y);
    if (Math.random() < 0.7) this.leap(LITTLE_FISH, pt.x, pt.y, 40, 34, 0.8);
  }

  onIsland(e) {
    const g = e.target.closest('.isle');
    if (!g) return;
    const dan = Number(g.dataset.dan);
    if (!store.isUnlocked(dan)) {
      sound.playBoing();
      const prev = DAN_ORDER[DAN_ORDER.indexOf(dan) - 1];
      toast(`${prev}단 친구를 부화시키면 구름이 걷혀요`);
      return;
    }
    sound.playPop();
    const [ix, iy] = SPOTS[DAN_ORDER.indexOf(dan)];
    const c = CHARACTERS[dan];
    const p = store.data.progress[dan];
    const who = g.querySelector('.isle-char');
    who.classList.remove('poke');
    void who.getBoundingClientRect();
    who.classList.add('poke');
    this.sayOnMap(ix, iy - 104, p > 0 ? `${c.name}: ${c.line}` : '알을 찾아줘!');
    this.selected = dan;
    this.el.querySelectorAll('.isle').forEach((it) => it.classList.toggle('selected', Number(it.dataset.dan) === dan));
    const [x, y] = SPOTS[DAN_ORDER.indexOf(dan)];
    this.el.querySelector('.boat').style.transform = `translate(${x + 100}px, ${y + 30}px)`;
    this.renderPanel();
  }

  renderPanel() {
    const dan = this.selected;
    const c = CHARACTERS[dan];
    const p = store.data.progress[dan];
    const rec = nextMode(p);
    const panel = this.el.querySelector('.map-panel');
    panel.innerHTML = `
      <div class="panel-head">
        <div class="panel-art">${charSVG(dan, Math.max(1, p), Math.round(this.u * 11))}</div>
        <div>
          <h2 style="color:${c.color}">${dan}단 ${c.island}</h2>
          <p>${p > 0 ? stageName(dan, p) : `${c.species} ${c.name}의 알을 찾아요`}</p>
        </div>
      </div>
      <div class="ladder">${STAGES.map((s) => `<span class="${p >= s.progress ? 'on' : ''}">${s.icon} ${s.label}</span>`).join('')}</div>
      <div class="modes">
        ${modesFor(p).map((m) => `
          <button class="mode ${m.open ? '' : 'closed'} ${m.id === rec ? 'recommended' : ''}" data-mode="${m.id}">
            <span class="mode-icon">${m.icon}</span>
            <span class="mode-text"><b>${m.label}</b><small>${m.sub}</small></span>
            ${m.done ? '<span class="mode-done">✓</span>' : ''}
            ${m.id === rec ? '<span class="mode-tag">추천</span>' : ''}
          </button>`).join('')}
      </div>`;
    panel.onclick = (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      const m = modesFor(p).find((x) => x.id === b.dataset.mode);
      if (!m.open) {
        sound.playBoing();
        toast(m.sub);
        return;
      }
      sound.playPop();
      this.app.go(m.id, { dan });
    };
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.sayTimer);
    this.bar.destroy();
  }
}
