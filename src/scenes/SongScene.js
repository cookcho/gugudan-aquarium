// 노래 듣기: 한 줄을 읽어주면 아이가 따라 말하고 거품을 톡! 한 줄마다 세 번 따라 해요.
import { store } from '../core/store.js';
import { h, topbar, unit, toast } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { speakLine, gugudanLine, koreanVoices, speechSupported } from '../core/speech.js';
import { CHARACTERS } from '../data/characters.js';
import { charSVG, guideSVG } from '../graphics/characters.js';

const REPEATS = 3;

export class SongScene {
  constructor(app, { dan }) {
    this.app = app;
    this.dan = dan;
    this.i = 1;
    this.rep = 0;
    this.alive = true;
    const u = unit();
    const p = store.data.progress[dan];
    const singer = p >= 2 ? charSVG(dan, p, Math.round(u * 15)) : guideSVG(Math.round(u * 15));
    this.bar = topbar(app, { back: 'map', backLabel: '← 지도', center: `🎵 ${dan}단 따라 하기` });
    this.el = h(`
      <div class="scene sea-bg song">
        <ol class="lines">
          ${Array.from({ length: 9 }, (_, k) => `<li data-n="${k + 1}"><span>${dan} × ${k + 1}</span><b>= ${dan * (k + 1)}</b></li>`).join('')}
        </ol>
        <div class="stage-center">
          <div class="singer bob">${singer}</div>
          <div class="big-q"></div>
          <div class="reading"></div>
          <div class="reps">${'<i></i>'.repeat(REPEATS)}</div>
          <div class="song-actions">
            <button class="btn btn-foam" data-act="again">🔊 다시 듣기</button>
            <button class="tap-bubble" data-act="next" hidden></button>
          </div>
        </div>
      </div>`);
    this.el.prepend(this.bar.el);
    this.el.addEventListener('click', (e) => this.onClick(e));
  }

  mounted() {
    this.showLine();
    // 음성 목록은 기기에 따라 늦게 들어와서 잠깐 기다렸다 확인해요
    setTimeout(() => {
      if (!this.alive || !store.data.voice) return;
      if (!speechSupported) toast('이 브라우저는 읽어주기를 지원하지 않아요. Chrome이나 Safari로 열어 주세요');
      else if (koreanVoices().length === 0) toast('이 기기에 한국어 읽기 음성이 없어요. 보호자 화면에서 설치 방법을 확인해 주세요');
    }, 1500);
  }

  async showLine() {
    const { dan, i } = this;
    this.rep = 0;
    this.el.querySelectorAll('.lines li').forEach((li) => {
      const n = Number(li.dataset.n);
      li.classList.toggle('now', n === i);
      li.classList.toggle('done', n < i);
    });
    const q = this.el.querySelector('.big-q');
    q.innerHTML = `${dan} × ${i} = <em>?</em>`;
    this.el.querySelector('.reading').textContent = '';
    this.el.querySelector('.tap-bubble').hidden = true;
    this.updateReps();
    await new Promise((r) => setTimeout(r, 400));
    if (!this.alive || this.i !== i) return;
    q.innerHTML = `${dan} × ${i} = <em class="pop">${dan * i}</em>`;
    this.el.querySelector('.reading').textContent = `"${gugudanLine(dan, i)}"`;
    this.playRep();
  }

  floatNote(singer) {
    const note = h(`<span class="note-float" style="--dx:${Math.round(Math.random() * 60 - 10)}px">${Math.random() < 0.5 ? '🎵' : '🎶'}</span>`);
    singer.appendChild(note);
    setTimeout(() => note.remove(), 1400);
  }

  updateReps() {
    this.el.querySelectorAll('.reps i').forEach((d, k) => d.classList.toggle('on', k < this.rep));
  }

  // 읽어주고 → 아이가 따라 말하고 톡
  async playRep() {
    const { i, rep } = this;
    const bubble = this.el.querySelector('.tap-bubble');
    const singer = this.el.querySelector('.singer');
    bubble.hidden = true;
    singer.classList.add('sing');
    // 읽어 주는 동안 음표가 둥실 떠올라요
    const notes = setInterval(() => this.alive && this.floatNote(singer), 380);
    this.floatNote(singer);
    await speakLine(this.dan, i);
    clearInterval(notes);
    if (!this.alive || this.i !== i || this.rep !== rep) return;
    singer.classList.remove('sing');
    bubble.innerHTML = `따라 말하고<br>톡! <small>${rep + 1}/${REPEATS}</small>`;
    bubble.hidden = false;
  }

  onClick(e) {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'again') {
      sound.playPop();
      const singer = this.el.querySelector('.singer');
      const notes = setInterval(() => this.alive && this.floatNote(singer), 380);
      this.floatNote(singer);
      speakLine(this.dan, this.i).then(() => clearInterval(notes));
    } else if (act === 'next') {
      sound.playPop();
      this.rep++;
      this.updateReps();
      if (this.rep < REPEATS) {
        this.playRep();
      } else if (this.i < 9) {
        sound.playStar();
        const li = this.el.querySelector(`.lines li[data-n="${this.i}"]`);
        li?.classList.add('shine');
        this.i++;
        this.showLine();
      } else {
        this.finish();
      }
    } else if (act === 'replay') {
      sound.playPop();
      this.el.querySelector('.overlay')?.remove();
      this.i = 1;
      this.showLine();
    } else if (act === 'stepping') {
      sound.playPop();
      this.app.go('stepping', { dan: this.dan });
    }
  }

  finish() {
    sound.playFanfare();
    this.el.querySelector('.tap-bubble').hidden = true;
    const c = CHARACTERS[this.dan];
    this.el.appendChild(h(`
      <div class="overlay">
        <div class="sheet small center">
          <h2 class="sheet-title">다 따라 했어! 👏</h2>
          <p class="sheet-msg">이제 ${this.dan}단 징검다리를 건너서 ${c.name}의 알을 찾아볼까?</p>
          <div class="row">
            <button class="btn btn-foam" data-act="replay">🎵 처음부터 다시</button>
            <button class="btn btn-coral" data-act="stepping">🌈 징검다리 건너기</button>
          </div>
        </div>
      </div>`));
  }

  destroy() {
    this.alive = false;
    this.bar.destroy();
  }
}
