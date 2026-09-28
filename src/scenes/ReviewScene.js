// 오늘의 복습: 여러 단에서 자주 틀리거나 오래 걸린 문제 5개를 숫자판으로 풀어요.
// 다 풀면 별을 받고, 어항 친구들이 모두 밥을 먹어요. 보상은 하루 한 번이에요.
import { store } from '../core/store.js';
import { KeypadScene } from './KeypadScene.js';

const BONUS = 5;

export class ReviewScene extends KeypadScene {
  constructor(app) {
    super(app, { dan: 0 });
  }

  // KeypadScene 생성자가 부르는 준비 단계를 복습 문제로 바꿔요
  setup() {
    this.backTo = 'home';
    super.setup(store.reviewFacts(5), '📅 오늘의 복습');
  }

  finish() {
    const firstTime = !store.reviewDoneToday();
    store.finishReview();
    store.completeRequest('review');
    for (const d of store.hatchedDans()) store.addLove(d, 2, 'review');
    const bonus = firstTime ? BONUS : 0;
    if (bonus) store.addStars(bonus);
    this.app.go('result', {
      dan: this.questions[0]?.dan || 2, mode: 'review', firstTry: this.firstTry, total: this.total,
      missed: this.missed, passed: true, from: 0, to: 0, stars: this.earned + bonus, fed: firstTime
    });
  }
}
