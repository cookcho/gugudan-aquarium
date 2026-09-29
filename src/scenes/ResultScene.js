// 결과: 진화 장면을 먼저 보여주고, 숫자는 짧게.
import confetti from 'canvas-confetti';
import { store } from '../core/store.js';
import { h, unit, toast } from '../core/ui.js';
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

    // 오늘의 도전 섬이면 별 2배 (받은 만큼 한 번 더)
    const bonus = r.dan && r.dan === store.challengeDan() && r.stars > 0 ? r.stars : 0;
    if (bonus) store.addStars(bonus);

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
           <span class="evo-rays ${r.to === 4 ? 'gold' : ''}"></span>
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
        <h1 class="result-title ${grew ? 'pending' : ''}">${title}</h1>
        ${art}
        ${grew ? `<p class="result-name pending">${stageName(r.dan, r.to)}</p>` : ''}
        ${failNote}
        <div class="result-pills">
          <span class="pill">⭐ +${r.stars}</span>
          ${bonus ? `<span class="pill new">🎯 도전 섬 보너스 ⭐ +${bonus}</span>` : ''}
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
      if (act === 'again') {
        // 연습은 하루 한 판: 오늘 이미 했으면 지도로 보내요
        if (store.isPractice(r.dan, r.mode) && store.practiceDone(r.dan)) {
          const ch = store.challengeDan();
          app.go('map', { dan: ch || r.dan }); // 화면을 바꾼 뒤에 안내해요 (바꿀 때 안내가 지워져요)
          toast(ch && ch !== r.dan ? `${r.dan}단 연습은 오늘 끝! 🎯 ${ch}단 섬은 별이 2배야` : `${r.dan}단 연습은 오늘 끝! 내일 또 만나요 🌙`);
        } else app.go(r.mode, { dan: r.dan });
      }
      if (act === 'mix') app.go('mix', { dan: r.dan });
      if (act === 'boss') app.go('boss', { dan: r.dan });
    });
  }

  mounted() {
    if (!this.grew) {
      if (this.r.passed) sound.playFanfare();
      return;
    }
    // 진화 연출: 흔들리며 빛을 모으고(1.7초) → 번쩍! → 새 모습
    this.el.querySelector('.evolve').classList.add('charging');
    sound.playRumble();
    setTimeout(() => sound.playWhoosh(), 1100);
    setTimeout(() => this.reveal(), 1700);
  }

  reveal() {
    const { r } = this;
    const evo = this.el.querySelector('.evolve');
    const flash = h('<div class="evo-flash"></div>');
    this.el.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
    evo.classList.remove('charging');
    evo.classList.add('done');
    this.el.querySelectorAll('.pending').forEach((el) => el.classList.remove('pending'));
    sound.playFanfare();
    sound.playStar();
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.45 } });
    // 알이 깨어날 때: 알껍데기 조각이 사방으로
    if (r.from === 1 && r.to === 2) {
      const color = CHARACTERS[r.dan].color;
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
        const d = 14 + Math.random() * 8;
        const bit = h(`<i class="shell-bit" style="--c:${color};--dx:${(Math.cos(a) * d).toFixed(1)};--dy:${(Math.sin(a) * d).toFixed(1)};--rot:${Math.round(Math.random() * 540 - 270)}deg"></i>`);
        evo.appendChild(bit);
        setTimeout(() => bit.remove(), 1200);
      }
    }
    // 황금이 될 때: 금가루가 반짝이며 떨어져요
    if (r.to === 4) {
      const dust = h(`<div class="gold-dust">${Array.from({ length: 28 }, () => `<i style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 2).toFixed(2)}s;animation-duration:${(1.8 + Math.random() * 1.4).toFixed(2)}s"></i>`).join('')}</div>`);
      evo.appendChild(dust);
      setTimeout(() => dust.remove(), 5500);
    }
  }
}
