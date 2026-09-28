// 보기 만들기와 힌트

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(candidates, answer, count) {
  const unique = [...new Set(candidates)].filter((v) => v > 0 && v !== answer && v <= 90);
  return shuffle(unique).slice(0, count);
}

// 징검다리: 보기 3개. 이웃한 답을 무작위로 골라서 정답이 가운데에만 오지 않게 해요.
export function stepChoices(dan, n) {
  const answer = dan * n;
  const wrong = pick([dan * (n - 2), dan * (n - 1), dan * (n + 1), dan * (n + 2), answer + 1, answer - 1], answer, 2);
  return shuffle([answer, ...wrong]);
}

// 섞어 풀기: 보기 4개. 옆 단, 옆 줄처럼 헷갈리기 쉬운 답으로 골라요.
export function mixChoices(dan, n) {
  const answer = dan * n;
  const wrong = pick(
    [dan * (n - 1), dan * (n + 1), (dan - 1) * n, (dan + 1) * n, answer + 1, answer - 1, answer + 10, answer - 10],
    answer,
    3
  );
  return shuffle([answer, ...wrong]);
}

// 묶음 그림 힌트: dan개씩 n묶음
export function hintDotsHTML(dan, n) {
  const group = `<span class="hint-group">${'<i></i>'.repeat(dan)}</span>`;
  return `<div class="hint-dots">${group.repeat(n)}</div>`;
}
