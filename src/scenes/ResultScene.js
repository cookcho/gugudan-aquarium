// 결과: 진화 장면을 먼저 보여주고, 숫자는 짧게.
import confetti from 'canvas-confetti';
import { store } from '../core/store.js';
import { h, unit } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { CHARACTERS, DAN_ORDER, stageName } from '../data/characters.js';
import { charSVG, guideSVG } from '../graphics/characters.js';

export class ResultScene {
  constructor(app, r) {
    this.app = app;
    this.r = r;
    const u = unit();
    const size = Math.round(u * 22);
    const c = CHARACTERS[r.dan];
    const grew = r.to > r.from;
    this.grew = grew;

    let title = r.mode === 'review' ? '오늘의 복습 끝! 🎉' : '잘했어요!';
    if (grew && r.to === 1) title = `${c.name}의 알을 찾았어요!`;
    else if (grew && r.to === 2) title = `${c.name}가 깨어났어요!`;
    else if (grew && r.to === 3) title = `${c.name}가 씩씩하게 자랐어요!`;
    else if (grew && r.to === 4) title = `황금 ${c.name}로 진화했어요!`;
    else if (r.mode === 'boss' && r.passed) title = '상어를 또 이겼어요!';
    else if (r.mode === 'boss') title = '상어가 지쳐서 도망갔어요!';
    else if (!r.passed) title = '조금만 더 하면 돼요!';

    const nextIdx = DAN_ORDER.indexOf(r.dan) + 1;
    const newIsland = grew && r.to === 2 && nextIdx < DAN_ORDER.length ? DAN_ORDER[nextIdx] : null;

    let primary = { act: 'home', label: '🐠 어항에서 만나기' };
    let secondary = { act: r.mode === 'review' ? 'map' : 'again', label: r.mode === 'review' ? '🗺️ 모험 떠나기' : '🔄 한 번 더' };
    if (r.mode === 'stepping' && r.to === 1) {
      primary = { act: 'mix', label: '🫧 섞어 풀기로 부화시키기' };
      secondary = { act: 'home', label: '🐠 어항으로' };
    } else if (r.mode === 'keypad' && grew) {
      primary = { act: 'boss', label: '🦈 상어 보스전 도전' };
      secondary = { act: 'home', label: '🐠 어항으로' };
    } else if (!r.passed) {
      primary = { act: 'again', label: '🔄 다시 도전' };
      secondary = { act: 'map', label: '🗺️ 지도로' };
    }

    const art = grew
      ? `<div class="evolve">
           <div class="evo-from">${r.from > 0 ? charSVG(r.dan, r.from, size) : guideSVG(size)}</div>
           <div class="evo-to">${charSVG(r.dan, r.to, size)}</div>
         </div>`
      : `<div class="evolve still">${r.to > 0 ? charSVG(r.dan, r.to, size) : guideSVG(size)}</div>`;

    const failText = {
      mix: `7개 맞히면 깨어나요. 이번엔 ${r.firstTry}개! 거의 다 왔어요`,
      keypad: `한 번에 7개 맞히면 자라요. 이번엔 ${r.firstTry}개! 조금만 더`,
      boss: '하트를 지키면서 다시 도전해 봐요. 틀린 문제를 먼저 연습하면 더 쉬워요'
    }[r.mode];
    const failNote = !r.passed && failText ? `<p class="result-note">${failText}</p>` : '';
    const tired = store.day().games >= 3
      ? `<div class="result-guide">${guideSVG(Math.round(u * 7))}<span>오늘 정말 많이 했어! 여기까지 하고 내일 또 만날까?</span></div>`
      : '';

    this.el = h(`
      <div class="scene result ${grew ? 'celebrate' : ''}">
        <h1 class="result-title">${title}</h1>
        ${art}
        ${grew ? `<p class="result-name">${stageName(r.dan, r.to)}</p>` : ''}
        ${failNote}
        <div class="result-pills">
          <span class="pill">⭐ +${r.stars}</span>
          <span class="pill">한 번에 맞힌 문제 ${r.firstTry} / ${r.total}</span>
          ${newIsland ? `<span class="pill new">🏝️ ${newIsland}단 섬이 열렸어요!</span>` : ''}
          ${r.fed ? '<span class="pill new">🍽️ 어항 친구들이 모두 밥을 먹었어요!</span>' : ''}
        </div>
        ${r.missed.length ? `<p class="result-review">다음에 다시 볼 문제: ${[...new Set(r.missed)].map((m) => (typeof m === 'string' ? m : `${r.dan}×${m}`)).join(', ')}</p>` : ''}
        ${tired}
        <div class="row">
          <button class="btn btn-foam" data-act="${secondary.act}">${secondary.label}</button>
          <button class="btn btn-coral btn-big" data-act="${primary.act}">${primary.label}</button>
        </div>
      </div>`);

    this.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      sound.playPop();
      if (act === 'home') app.go('home');
      if (act === 'map') app.go('map', { dan: r.dan });
      if (act === 'again') app.go(r.mode, { dan: r.dan });
      if (act === 'mix') app.go('mix', { dan: r.dan });
      if (act === 'boss') app.go('boss', { dan: r.dan });
    });
  }

  mounted() {
    if (this.grew || this.r.passed) sound.playFanfare();
    if (this.grew) {
      setTimeout(() => {
        this.el.querySelector('.evolve')?.classList.add('done');
        sound.playStar();
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.45 } });
      }, 900);
    }
  }
}
