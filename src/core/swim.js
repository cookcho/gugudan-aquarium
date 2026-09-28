// 어항 친구들의 움직임. 친구마다 헤엄 버릇이 있고, 여러 행동을 번갈아 해요.
// 매 프레임 update()가 위치를 계산하고, 필요하면 효과 이름(거품, 잠 등)을 돌려줘요.

// speed: 기본 속도 · zone: 다니는 높이 · rest/dash: 쉬기·돌진을 고를 확률 · wag: 꼬리 흔드는 속도(초)
export const PROFILES = {
  2: { speed: 0.7, zone: 'any', bob: 1.1, rest: 0.3, dash: 0.03, wag: 0.9, tilt: false }, // 해마: 둥실둥실
  3: { speed: 1.3, zone: 'any', bob: 0.3, rest: 0.15, dash: 0.15, wag: 0.3, tilt: true }, // 금붕어
  4: { speed: 0.8, zone: 'low', bob: 0.3, rest: 0.35, dash: 0.03, wag: 1.2, tilt: true, sandRest: true }, // 거북
  5: { speed: 0.55, zone: 'floor', bob: 0, rest: 0.3, dash: 0, wag: 1, roll: true }, // 불가사리: 바닥에서 데굴데굴
  6: { speed: 0.5, zone: 'any', bob: 0, rest: 0.15, dash: 0, wag: 1.4, pulse: true }, // 해파리: 펄럭 올라갔다 가라앉기
  7: { speed: 1.7, zone: 'any', bob: 0.2, rest: 0.1, dash: 0.35, wag: 0.25, tilt: true }, // 무지개 물고기: 쌩쌩
  8: { speed: 0.9, zone: 'any', bob: 0.3, rest: 0.3, dash: 0, wag: 1, jet: true }, // 문어: 쭉 튀어 나가기
  9: { speed: 0.8, zone: 'upper', bob: 0.5, rest: 0.2, dash: 0.02, wag: 1.1, tilt: true, spout: true } // 고래: 크게 천천히
};

const rand = (a, b) => a + Math.random() * (b - a);

export class Swimmer {
  constructor(dan, x, y, size) {
    this.p = typeof dan === 'object' ? dan : PROFILES[dan]; // 손님은 움직임 설정을 직접 넘겨요
    this.x = x;
    this.y = y;
    this.vx = rand(-1, 1) * this.p.speed;
    this.vy = 0;
    this.size = size;
    this.face = this.vx >= 0 ? 1 : -1;
    this.t = Math.random() * 100;
    this.mode = 'wander';
    this.timer = 0;
    this.target = null;
    this.squash = 0; // 돌진·펄럭일 때 몸이 늘어났다 돌아와요
    this.spin = 0; // 눌렀을 때 빙글
    this.dance = 0; // 춤추는 남은 시간(초)
    this.held = false; // 쓰다듬는 동안은 가만히 있어요
    this.roll = 0; // 불가사리 굴러간 각도
    this.pulseClock = rand(0, 60);
  }

  // 높이 범위 (zone)
  yRange(H) {
    const s = this.size;
    const floor = H - s * 0.85;
    switch (this.p.zone) {
      case 'floor': return [floor, floor];
      case 'low': return [H * 0.45, floor];
      case 'upper': return [10, H * 0.5];
      default: return [10, floor];
    }
  }

  // 평소 돌아다닐 곳은 다닐 수 있는 높이의 위쪽 3/4. 바닥은 쉬기·잠·장식 구경 때만 가요.
  randomPoint(W, H) {
    const [y0, y1] = this.yRange(H);
    const low = this.p.zone === 'floor' ? y1 : y0 + (y1 - y0) * 0.75;
    return { x: rand(10, W - this.size - 10), y: rand(y0, low) };
  }

  // 다음 행동 고르기
  pick(ctx) {
    const { p } = this;
    const options = [['wander', 0.45], ['rest', p.rest], ['dash', p.dash], ['bubbles', 0.1]];
    if (ctx.decors.length) options.push(['visit', p.visit ?? 0.1]);
    if (ctx.friends.length) options.push(['chase', 0.1]);
    options.push(['sleep', ctx.night ? 0.2 : 0.025]);
    const total = options.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    const [mode] = options.find(([, w]) => (r -= w) < 0) || ['wander'];
    this.setMode(mode, ctx);
  }

  setMode(mode, ctx) {
    this.mode = mode;
    const { W, H } = ctx;
    switch (mode) {
      case 'wander':
        this.target = this.randomPoint(W, H);
        this.timer = rand(4, 8);
        break;
      case 'rest':
        this.target = this.p.sandRest ? { x: this.x, y: H - this.size * 0.85 } : null;
        this.timer = rand(2, 4);
        break;
      case 'dash': {
        const pt = this.randomPoint(W, H);
        this.target = pt;
        this.timer = 1.2;
        this.squash = 1;
        break;
      }
      case 'bubbles':
        this.target = null;
        this.timer = 1.6;
        this.bubbleCount = 3;
        break;
      case 'visit': {
        const d = ctx.decors[Math.floor(Math.random() * ctx.decors.length)];
        const [y0, y1] = this.yRange(H);
        this.target = { x: Math.max(10, Math.min(W - this.size - 10, d.x - this.size / 2 + rand(-30, 30))), y: Math.max(y0, Math.min(y1, d.y - this.size)) };
        this.timer = rand(3, 5);
        break;
      }
      case 'chase':
        this.buddy = ctx.friends[Math.floor(Math.random() * ctx.friends.length)];
        this.timer = rand(3, 5);
        break;
      case 'sleep':
        this.target = { x: this.x, y: H - this.size * 0.85 };
        this.timer = rand(4, 7);
        this.zzz = 0;
        break;
      default:
        break;
    }
  }

  // 목표를 향해 부드럽게 방향을 틀어요
  steer(tx, ty, speed, k = 0.04) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const sp = Math.min(speed, d * 0.05 + 0.1);
    this.vx += ((dx / d) * sp - this.vx) * k;
    this.vy += ((dy / d) * sp - this.vy) * k;
    return d;
  }

  // ctx: { W, H, dt, foods, attention, friends, decors, night, hungry, sick }
  update(ctx) {
    const { p } = this;
    const { W, H, dt } = ctx;
    const events = [];
    this.t += dt;
    this.timer -= dt;
    this.squash *= 0.93;
    if (this.spin > 0) this.spin = Math.max(0, this.spin - dt * 1.6);
    if (this.dance > 0) this.dance = Math.max(0, this.dance - dt);
    if (this.held) {
      this.vx *= 0.8;
      this.vy *= 0.8;
      this.x += this.vx;
      this.y += this.vy;
      return events;
    }

    // 1순위: 아픔 → 바닥에서 힘없이
    if (ctx.sick) {
      this.vx += (Math.sign(this.vx || 1) * 0.25 - this.vx) * 0.02;
      this.vy += ((H - this.size * 0.85 - this.y) * 0.01 - this.vy) * 0.1;
    } else if (ctx.food) {
      // 2순위: 먹이 → 신나서 달려가요. 다 먹으면 새 목적지로 돌아다녀요.
      // (목적지 없이 돌아다니기로 바꾸면, 먹이를 다 먹은 뒤 움직임 계산이 멈춰요)
      if (this.mode !== 'wander' || !this.target) this.setMode('wander', ctx);
      this.timer = Math.max(this.timer, 0.5);
      this.steer(ctx.food.x - this.size / 2, ctx.food.y - this.size / 2, p.speed * 1.8 + 0.8, 0.12);
    } else if (ctx.attention) {
      // 3순위: 아이가 터치한 곳이 궁금해요
      this.steer(ctx.attention.x - this.size / 2, ctx.attention.y - this.size / 2, p.speed * 1.2 + 0.4, 0.06);
    } else {
      if (this.timer <= 0) this.pick(ctx);
      if (!this.target && (this.mode === 'wander' || this.mode === 'visit' || this.mode === 'dash' || this.mode === 'sleep')) {
        this.target = this.randomPoint(W, H);
      }
      const hungrySlow = ctx.hungry ? 0.7 : 1;
      switch (this.mode) {
        case 'wander':
        case 'visit': {
          const d = this.steer(this.target.x, this.target.y, p.speed * hungrySlow);
          if (d < 20 && this.mode === 'wander') this.target = this.randomPoint(W, H);
          if (d < 20 && this.mode === 'visit') {
            this.vx *= 0.9;
            this.vy *= 0.9;
          }
          break;
        }
        case 'dash':
          this.steer(this.target.x, this.target.y, p.speed * 3.2, 0.1);
          break;
        case 'rest':
        case 'bubbles':
          if (this.target) this.steer(this.target.x, this.target.y, 0.5, 0.05);
          this.vx *= 0.95;
          this.vy *= 0.95;
          if (this.mode === 'bubbles' && this.bubbleCount > 0 && Math.random() < dt * 2.5) {
            this.bubbleCount--;
            events.push('bubble');
          }
          break;
        case 'chase': {
          const b = this.buddy;
          if (!b) break;
          const d = this.steer(b.x, b.y, p.speed * 1.6 + 0.4, 0.07);
          if (d < this.size * 0.9 && Math.random() < dt * 1.5) {
            events.push('notes');
            b.setMode('dash', ctx); // 잡히면 친구가 도망가요
          }
          break;
        }
        case 'sleep':
          this.steer(this.target.x, this.target.y, 0.4, 0.05);
          this.vx *= 0.9;
          this.zzz = (this.zzz || 0) + dt;
          if (this.zzz > 1.6) {
            this.zzz = 0;
            events.push('zzz');
          }
          break;
        default:
          break;
      }
    }

    // 종별 버릇
    if (p.pulse && !ctx.sick) {
      // 해파리: 1.4초마다 펄럭 올라가고, 그 사이 천천히 가라앉아요
      this.pulseClock += dt;
      if (this.pulseClock > 1.4) {
        this.pulseClock = 0;
        this.vy -= 1.6;
        this.squash = 1;
      }
      this.vy += 0.025;
    }
    if (p.jet && !ctx.sick && !ctx.food && this.mode === 'wander' && this.target && Math.random() < dt * 0.35) {
      // 문어: 가끔 쭉 튀어 나가고, 더 가끔 먹물
      const a = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      this.vx = Math.cos(a) * 3.2;
      this.vy = Math.sin(a) * 3.2;
      this.squash = 1.3;
      if (Math.random() < 0.25) events.push('ink');
    }
    if (p.spout && this.mode === 'rest' && Math.random() < dt * 0.6) events.push('spout');

    // 이동과 벽
    this.x += this.vx;
    this.y += this.vy;
    const [y0, y1] = this.yRange(H);
    if (this.x < 10) { this.x = 10; this.vx = Math.abs(this.vx); }
    if (this.x > W - this.size - 10) { this.x = W - this.size - 10; this.vx = -Math.abs(this.vx); }
    if (this.y < y0) { this.y = y0; this.vy = Math.abs(this.vy) * 0.3; }
    if (this.y > y1) { this.y = y1; this.vy = -Math.abs(this.vy) * 0.3; }

    // 방향 전환은 휙 뒤집지 않고 몸을 돌려요
    if (Math.abs(this.vx) > 0.12) this.face += (Math.sign(this.vx) - this.face) * 0.12;
    if (p.roll) this.roll += this.vx * 3;
    return events;
  }

  // CSS transform
  transform() {
    const { p } = this;
    const bob = p.bob ? Math.sin(this.t * 2.2) * p.bob * 4 : 0;
    const wave = Math.sin(this.t * 6) * 0.025;
    let rot = 0;
    if (p.tilt) rot = Math.max(-22, Math.min(22, this.vy * 9)) * Math.sign(this.face);
    if (p.roll) rot = this.roll;
    rot += this.spin * 360;
    let hop = 0;
    if (this.dance > 0) {
      rot += Math.sin(this.t * 16) * 16;
      hop = Math.abs(Math.sin(this.t * 8)) * -10;
    }
    const sq = this.squash;
    const sx = (1 + wave + sq * 0.14) * this.face;
    const sy = 1 - wave - sq * 0.12;
    return `translate(${this.x}px, ${this.y + bob + hop}px) rotate(${rot}deg) scale(${sx}, ${sy})`;
  }
}
