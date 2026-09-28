// 코드로 연주하는 잔잔한 배경음악 (파일 없이 Web Audio로 만들어요)
// - 어항: 물멍하기 좋은 편안한 로파이 (전자 피아노 화음, 아주 작은 비트, 칼림바 멜로디, 물속처럼 먹먹한 소리)
// - 모험 지도: 통통 튀는 뜯는 소리 아르페지오 + 가벼운 쉐이커 + 파도 소리
import { sound } from './soundManager.js';
import { store } from '../core/store.js';

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// chords: [베이스, 화음1, 화음2, 화음3] (MIDI 번호)
const TRACKS = {
  aquarium: {
    style: 'lofi',
    bpm: 76,
    swing: 0.18,
    // 8마디 순환: F maj9 · E m7 · D m9 · C maj9 · F maj9 · E m7 · A m9 · G9sus
    chords: [
      [41, 57, 60, 64, 67], [40, 55, 59, 62, 64], [38, 53, 57, 60, 64], [36, 55, 59, 62, 64],
      [41, 57, 60, 64, 67], [40, 55, 59, 62, 64], [45, 60, 64, 67, 71], [43, 53, 57, 60, 62]
    ],
    scale: [72, 74, 76, 79, 81, 84, 86], // C 5음계
    // 칼림바 멜로디 조각 (2마디 = 16스텝): [시작 스텝, 음계 번호, 길이(스텝)]
    motifs: [
      [[0, 4, 3], [4, 3, 1], [6, 2, 2], [8, 1, 6]],
      [[2, 2, 1], [3, 3, 1], [4, 4, 2], [7, 5, 3], [12, 4, 4]],
      [[0, 1, 2], [3, 2, 1], [4, 4, 4], [10, 3, 2], [12, 2, 4]],
      [[4, 5, 2], [6, 4, 2], [8, 3, 2], [10, 2, 6]],
      [[0, 3, 2], [2, 4, 2], [4, 6, 4], [11, 5, 1], [12, 4, 4]]
    ],
    underwater: true,
    bubbles: 0.025,
    waves: 0.04
  },
  adventure: {
    bpm: 96,
    barsPerChord: 1,
    chords: [[41, 53, 57, 60], [38, 50, 53, 57], [46, 50, 53, 58], [48, 52, 55, 60]], // F · D m · B♭ · C
    scale: [69, 72, 74, 77, 79, 81], // F 5음계
    melody: 0.22,
    arpeggio: true,
    shaker: true,
    waves: 0.03
  }
};

class Music {
  constructor() {
    this.want = null; // 지금 화면에서 원하는 곡
    this.current = null; // { name, bus, waves }
    this.timer = null;
    this.master = null;
    this.lastNote = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
      else this.play(this.want);
    });
  }

  volume() {
    const on = store.data.sound && store.data.music !== false;
    return on ? (store.data.musicVol ?? 0.6) * 0.5 : 0;
  }

  // 효과음과 같은 오디오를 쓰고, 은은한 메아리(딜레이)를 걸어요
  setup() {
    if (!sound.ctx) return false;
    if (this.master) return true;
    const ctx = sound.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.36;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1800;
    this.send = ctx.createGain();
    this.send.gain.value = 0.35;
    this.send.connect(delay);
    delay.connect(tone);
    tone.connect(feedback);
    feedback.connect(delay);
    tone.connect(this.master);
    return true;
  }

  applyVolume() {
    if (!this.master) return;
    const t = sound.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.volume(), t, 0.4);
  }

  // 화면에 맞는 곡으로 바꿔요 (null이면 조용히)
  play(name) {
    this.want = name;
    if (document.hidden || !this.setup()) return;
    this.applyVolume();
    if (this.current?.name === name && this.timer) return;
    this.fadeOut();
    if (!name) return;
    const ctx = sound.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(this.master);
    bus.connect(this.send);
    bus.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
    const track = TRACKS[name];
    let voices = bus; // 악기 소리가 들어가는 곳
    let lfo = null;
    if (track.underwater) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      lp.Q.value = 0.7;
      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const depth = ctx.createGain();
      depth.gain.value = 600;
      lfo.connect(depth);
      depth.connect(lp.frequency);
      lfo.start();
      lp.connect(bus);
      voices = lp;
    }
    this.current = { name, bus, voices, lfo, track, step: 0, motif: null, next: ctx.currentTime + 0.1, waves: this.startWaves(bus, track.waves) };
    this.timer = setInterval(() => this.schedule(), 60);
  }

  pause() {
    clearInterval(this.timer);
    this.timer = null;
    if (this.master) this.master.gain.setTargetAtTime(0, sound.ctx.currentTime, 0.2);
  }

  fadeOut() {
    clearInterval(this.timer);
    this.timer = null;
    const old = this.current;
    this.current = null;
    if (!old) return;
    const t = sound.ctx.currentTime;
    old.bus.gain.cancelScheduledValues(t);
    old.bus.gain.setTargetAtTime(0, t, 0.5);
    setTimeout(() => {
      old.waves?.stop();
      old.lfo?.stop();
      old.bus.disconnect();
    }, 2500);
  }

  // 파도 소리: 부드럽게 걸러낸 잡음이 천천히 커졌다 작아져요
  startWaves(bus, level) {
    const ctx = sound.ctx;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // 부드러운 갈색 잡음
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const g = ctx.createGain();
    g.gain.value = level;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = level * 0.7;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    src.connect(lp);
    lp.connect(g);
    g.connect(bus);
    src.start();
    lfo.start();
    return { stop: () => { src.stop(); lfo.stop(); } };
  }

  schedule() {
    const cur = this.current;
    if (!cur) return;
    const ctx = sound.ctx;
    const stepDur = 60 / cur.track.bpm / 2; // 8분음표
    while (cur.next < ctx.currentTime + 0.35) {
      this.playStep(cur, cur.step, cur.next, stepDur);
      cur.next += stepDur;
      cur.step++;
    }
  }

  tone(bus, { freq, t, dur, type = 'sine', gain = 0.05, attack = 0.01 }) {
    const ctx = sound.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + attack + dur + 0.05);
  }

  // 멜로디는 화음에 맞는 음 쪽으로 조금씩 걸어가요
  pickMelody(track, chord) {
    const chordPcs = chord.slice(1).map((n) => n % 12);
    const near = track.scale.filter((n) => Math.abs(n - (this.lastNote || track.scale[2])) <= 5);
    const pool = near.length ? near : track.scale;
    const good = pool.filter((n) => chordPcs.includes(n % 12));
    const choices = good.length && Math.random() < 0.7 ? good : pool;
    this.lastNote = choices[Math.floor(Math.random() * choices.length)];
    return this.lastNote;
  }

  // ---- 어항 로파이 ----
  // 전자 피아노: 기본음 + 옥타브 위 배음, 빨리 울리고 천천히 사라져요
  keys(out, freq, t, dur, gain) {
    this.tone(out, { freq, t, dur, type: 'sine', gain, attack: 0.008 });
    this.tone(out, { freq: freq * 2, t, dur: dur * 0.5, type: 'triangle', gain: gain * 0.18, attack: 0.005 });
  }

  // 칼림바: 맑은 기본음 + 짧게 반짝이는 높은 배음
  kalimba(out, freq, t, dur) {
    this.tone(out, { freq, t, dur, type: 'sine', gain: 0.05, attack: 0.004 });
    this.tone(out, { freq: freq * 4.02, t, dur: 0.12, type: 'sine', gain: 0.012, attack: 0.002 });
  }

  noiseHit(out, t, { dur, gain, type, freq, q = 1 }) {
    const ctx = sound.ctx;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t);
  }

  kick(out, t) {
    const ctx = sound.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.13, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playLofi(cur, i, t0, stepDur) {
    const { track, voices, bus } = cur;
    const inBar = i % 8;
    const bar = Math.floor(i / 8);
    const chord = track.chords[bar % track.chords.length];
    const t = t0 + (inBar % 2 === 1 ? stepDur * track.swing : 0); // 살짝 흔들리는 리듬
    const beat = stepDur * 2;

    // 전자 피아노 화음: 마디 첫 박 + 가끔 2박 뒤에 가볍게 한 번 더
    if (inBar === 0) chord.slice(1).forEach((n, k) => this.keys(voices, hz(n), t + k * 0.012, beat * 3.2, 0.028));
    if (inBar === 3 && Math.random() < 0.6) chord.slice(1, 4).forEach((n) => this.keys(voices, hz(n), t, beat * 1.2, 0.016));
    // 부드러운 베이스
    if (inBar === 0) this.tone(voices, { freq: hz(chord[0]), t, dur: beat * 1.6, type: 'sine', gain: 0.1, attack: 0.02 });
    if (inBar === 5) this.tone(voices, { freq: hz(chord[0] + 7), t, dur: beat * 0.8, type: 'sine', gain: 0.07, attack: 0.02 });
    // 아주 작은 비트: 쿵(1, 3박 뒤) · 톡(2, 4박) · 사각사각(8분음표)
    if (inBar === 0 || inBar === 5) this.kick(voices, t);
    if (inBar === 2 || inBar === 6) this.noiseHit(voices, t, { dur: 0.12, gain: 0.05, type: 'bandpass', freq: 1800, q: 0.8 });
    // 사각사각은 먹먹한 필터를 거치지 않게 해서 살짝 산뜻함을 남겨요
    this.noiseHit(bus, t, { dur: 0.035, gain: inBar % 2 ? 0.012 : 0.007, type: 'highpass', freq: 6500 });

    // 칼림바 멜로디: 2마디마다 조각 하나, 가끔은 쉬어 가요
    if (bar % 2 === 0 && inBar === 0) cur.motif = Math.random() < 0.7 ? track.motifs[Math.floor(Math.random() * track.motifs.length)] : null;
    if (cur.motif) {
      const s16 = (bar % 2) * 8 + inBar;
      for (const [start, deg, len] of cur.motif) {
        if (start === s16) this.kalimba(voices, hz(track.scale[deg]), t, stepDur * len * 1.6);
      }
    }
    // 가끔 뽀글 거품
    if (Math.random() < track.bubbles) this.bloop(bus, t0 + Math.random() * stepDur);
  }

  playStep(cur, i, t, stepDur) {
    if (cur.track.style === 'lofi') return this.playLofi(cur, i, t, stepDur);
    const { track, bus } = cur;
    const inBar = i % 8;
    const bar = Math.floor(i / 8);
    const chord = track.chords[Math.floor(bar / track.barsPerChord) % track.chords.length];
    const chordStart = inBar === 0 && bar % track.barsPerChord === 0;

    // 부드러운 화음 (어항)
    if (track.pad && chordStart) {
      const len = stepDur * 8 * track.barsPerChord;
      chord.slice(1).forEach((n) => this.tone(bus, { freq: hz(n), t, dur: len, gain: 0.03, attack: 1.2 }));
    }
    // 베이스
    if (inBar === 0 || (track.arpeggio && inBar === 4)) {
      this.tone(bus, { freq: hz(chord[0]), t, dur: stepDur * (track.arpeggio ? 1.5 : 3), type: track.arpeggio ? 'triangle' : 'sine', gain: track.arpeggio ? 0.07 : 0.09, attack: 0.02 });
    }
    // 아르페지오 (모험)
    if (track.arpeggio) {
      const pattern = [0, 1, 2, 1, 0, 1, 2, 1];
      const n = chord[1 + pattern[inBar]] + 12;
      this.tone(bus, { freq: hz(n), t, dur: 0.32, type: 'triangle', gain: 0.045 });
    }
    // 멜로디 (오르골 / 뜯는 소리)
    if (inBar % 2 === 0 && Math.random() < track.melody) {
      const n = this.pickMelody(track, chord);
      this.tone(bus, { freq: hz(n), t, dur: track.arpeggio ? 0.4 : 1.3, type: 'sine', gain: 0.055 });
      this.tone(bus, { freq: hz(n + 12), t, dur: track.arpeggio ? 0.2 : 0.6, type: 'triangle', gain: 0.012 });
    }
    // 가벼운 쉐이커 (모험, 엇박)
    if (track.shaker && inBar % 2 === 1) this.shake(bus, t);
    // 가끔 뽀글 거품 (어항)
    if (track.bubbles && Math.random() < 0.05) this.bloop(bus, t);
  }

  shake(bus, t) {
    const ctx = sound.ctx;
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.value = 0.025;
    src.connect(hp);
    hp.connect(g);
    g.connect(bus);
    src.start(t);
  }

  bloop(bus, t) {
    const ctx = sound.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(1300 + Math.random() * 400, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.022, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

export const music = new Music();
