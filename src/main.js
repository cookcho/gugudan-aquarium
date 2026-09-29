import { store } from './core/store.js';
import { stopSpeaking, unlockSpeech } from './core/speech.js';
import { sound } from './audio/soundManager.js';
import { music } from './audio/music.js';
import { preloadCharacterImages } from './graphics/characters.js';
import { HomeScene } from './scenes/HomeScene.js';
import { MapScene } from './scenes/MapScene.js';
import { SongScene } from './scenes/SongScene.js';
import { SteppingScene } from './scenes/SteppingScene.js';
import { MixScene } from './scenes/MixScene.js';
import { KeypadScene } from './scenes/KeypadScene.js';
import { BossScene } from './scenes/BossScene.js';
import { ReviewScene } from './scenes/ReviewScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { ParentScene } from './scenes/ParentScene.js';
import { firstTip } from './scenes/tips.js';

// 화면이 바뀔 때 거품이 아래에서 위로 휙 올라가요
function bubbleWipe() {
  const wipe = document.createElement('div');
  wipe.className = 'wipe';
  wipe.innerHTML = Array.from({ length: 16 }, () => {
    const s = 20 + Math.random() * 70;
    return `<i style="width:${s}px;height:${s}px;left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.18).toFixed(2)}s"></i>`;
  }).join('');
  document.getElementById('app').appendChild(wipe);
  setTimeout(() => wipe.remove(), 1000);
}

const SCENES = {
  home: HomeScene,
  map: MapScene,
  song: SongScene,
  stepping: SteppingScene,
  mix: MixScene,
  keypad: KeypadScene,
  boss: BossScene,
  review: ReviewScene,
  result: ResultScene,
  parent: ParentScene
};

// 학습 시간으로 세는 장면 (한 장면 최대 15분까지만 셈)
const LEARNING = new Set(['song', 'stepping', 'mix', 'keypad', 'boss', 'review']);
const MAX_SCENE_MS = 15 * 60 * 1000;

// 화면별 배경음악 (문제 푸는 화면은 읽어주는 소리를 위해 조용히)
const MUSIC_FOR = { home: 'aquarium', map: 'adventure' };

class App {
  constructor(root) {
    this.root = root;
    this.scene = null;
    this.learningSince = null;
    sound.enabled = store.data.sound;
    store.touchStreak();

    // 태블릿은 터치(손을 뗄 때)나 클릭 순간에만 소리를 허락해서, 그때 효과음과 음성을 함께 깨워요
    const wakeSound = () => {
      sound.init();
      music.play(music.want);
      window.removeEventListener('pointerdown', wakeSound, true);
    };
    window.addEventListener('pointerdown', wakeSound, true);
    const wakeSpeech = () => {
      unlockSpeech();
      window.removeEventListener('touchend', wakeSpeech, true);
      window.removeEventListener('click', wakeSpeech, true);
    };
    window.addEventListener('touchend', wakeSpeech, true);
    window.addEventListener('click', wakeSpeech, true);

    this.go('home');
  }

  go(name, params = {}) {
    stopSpeaking();
    if (this.learningSince) {
      store.addPlayMs(Math.min(Date.now() - this.learningSince, MAX_SCENE_MS));
      this.learningSince = null;
    }
    this.scene?.destroy?.();
    document.querySelectorAll('#app > .overlay, #app > .toast').forEach((el) => el.remove());
    this.root.innerHTML = '';

    music.play(MUSIC_FOR[name] || null);
    this.scene = new SCENES[name](this, params);
    this.root.appendChild(this.scene.el);
    this.scene.el.classList.add('scene-in');
    bubbleWipe();
    this.scene.mounted?.();
    if (name !== 'map') firstTip(name, this.scene.el); // 지도는 뽀글이가 늘 있어서 따로 알려줘요
    if (LEARNING.has(name)) this.learningSince = Date.now();
  }
}

// 어떤 캐릭터 그림이 있는지 먼저 확인하고 시작해요 (오래 걸리면 2초 뒤 그냥 시작)
// 배포 버전에서만: 한 번 열면 인터넷 없이도 열리게 (개발 중에는 바로바로 바뀌어야 해서 끔)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

window.addEventListener('DOMContentLoaded', async () => {
  await Promise.race([preloadCharacterImages(), new Promise((r) => setTimeout(r, 2000))]);
  new App(document.getElementById('stage'));
});
