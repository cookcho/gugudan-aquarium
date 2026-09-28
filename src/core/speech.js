// 구구단 읽어주기 ("칠삼 이십일"). 브라우저 음성 합성(ko-KR)을 써요.
import { store } from './store.js';

const DIGIT = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const HAS_BATCHIM = new Set(['일', '삼', '육', '칠', '팔']);

export function readNumber(n) {
  if (n < 10) return DIGIT[n];
  const tens = Math.floor(n / 10);
  return `${tens === 1 ? '' : DIGIT[tens]}십${DIGIT[n % 10]}`;
}

// 이일은 이, 이이는 사, … 칠삼 이십일 → ['칠삼', '이십일']
function lineParts(dan, n) {
  const head = DIGIT[dan] + DIGIT[n];
  const product = dan * n;
  if (product < 10) return [`${head}${HAS_BATCHIM.has(DIGIT[n]) ? '은' : '는'}`, readNumber(product)];
  return [head, readNumber(product)];
}

export function gugudanLine(dan, n) {
  return lineParts(dan, n).join(' ');
}

// 한 문장으로 읽어야 앞뒤 속도가 같아요. 쉼표에서 살짝 쉬어요 ("칠삼, 이십일").
export function speakLine(dan, n) {
  return speak(lineParts(dan, n).join(', '));
}

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// 태블릿 브라우저는 사용자가 터치한 순간에 한 번 말해야 그 뒤로 음성을 허락해요.
// 첫 터치 때 소리 없는 짧은 말을 한 번 해서 잠금을 풀어둬요.
let unlocked = false;
export function unlockSpeech() {
  if (unlocked || !speechSupported) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance('안녕');
  u.lang = 'ko-KR';
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

export function koreanVoices() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ko'));
}

// 자연스러운 목소리일수록 높은 점수 (Edge Natural > Google·Siri > 기본)
function naturalness(v) {
  if (/Natural|Neural|Online/i.test(v.name)) return 3;
  if (/Google|Yuna|Siri|Premium|Enhanced/i.test(v.name)) return 2;
  return v.localService ? 0 : 1;
}

export function bestVoice() {
  return [...koreanVoices()].sort((a, b) => naturalness(b) - naturalness(a))[0];
}

function koreanVoice() {
  const chosen = store.data.voiceName && koreanVoices().find((v) => v.name === store.data.voiceName);
  return chosen || bestVoice();
}

// 다 읽으면 끝나는 Promise. 음성이 꺼져 있거나 지원하지 않으면 잠깐 기다렸다 끝나요.
export function speak(text, retry = true) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!store.data.voice || !synth) {
      setTimeout(resolve, 700);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.7;
    u.pitch = 1.1;
    const voice = koreanVoice();
    if (voice) u.voice = voice;
    const fallback = setTimeout(resolve, 6000);
    u.onend = () => {
      clearTimeout(fallback);
      resolve();
    };
    // 음성 목록이 늦게 들어오는 기기에서는 첫 읽기가 실패할 수 있어서 한 번 더 시도해요
    u.onerror = (e) => {
      clearTimeout(fallback);
      if (retry && e.error !== 'interrupted' && e.error !== 'canceled') {
        setTimeout(() => speak(text, false).then(resolve), 300);
      } else {
        resolve();
      }
    };
    // 안드로이드 Chrome은 가끔 음성이 '일시정지' 상태로 멈춰 있어서 풀어줘요
    if (synth.paused) synth.resume();
    // 읽던 말을 끊자마자 바로 시작하면 첫 글자가 뭉개져서, 잠깐 쉬었다 시작해요
    if (synth.speaking || synth.pending) {
      synth.cancel();
      setTimeout(() => synth.speak(u), 120);
    } else {
      synth.speak(u);
    }
  });
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
