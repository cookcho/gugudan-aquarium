// 보호자 화면: 곱셈 문제로 잠그고, 구구단표 정답률과 학습 시간을 보여줘요.
import { store, today } from '../core/store.js';
import { h, confirmBox, toast } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { music } from '../audio/music.js';
import { CHARACTERS, DAN_ORDER, DANS, stageName } from '../data/characters.js';
import { koreanVoices, bestVoice, speakLine, speechSupported } from '../core/speech.js';

function acc(f) {
  return f ? f.ok / (f.ok + f.miss) : null;
}

// 3번 이상 풀고 80% 이상 맞히면 익힌 문제로 봐요
function mastered(a, b) {
  const f = store.data.facts[`${a}x${b}`];
  return !!f && f.ok + f.miss >= 3 && acc(f) >= 0.8;
}

function minutes(ms) {
  return Math.round(ms / 60000);
}

export class ParentScene {
  constructor(app) {
    this.app = app;
    this.el = h('<div class="scene parent"></div>');
    this.renderGate();
  }

  renderGate() {
    const a = 12 + Math.floor(Math.random() * 8);
    const b = 3 + Math.floor(Math.random() * 7);
    this.gateAnswer = a * b;
    this.typed = '';
    this.el.innerHTML = `
      <div class="gate">
        <h1>보호자 확인</h1>
        <p>아래 문제의 답을 입력하면 들어갈 수 있어요.</p>
        <div class="gate-q">${a} × ${b} = <span class="gate-typed">&nbsp;</span></div>
        <div class="keypad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button data-k="${k}">${k}</button>`).join('')}
          <button data-k="del">지우기</button><button data-k="0">0</button><button data-k="ok" class="ok">확인</button>
        </div>
        <button class="link-btn" data-k="back">← 어항으로 돌아가기</button>
      </div>`;
    this.el.onclick = (e) => {
      const k = e.target.closest('[data-k]')?.dataset.k;
      if (!k) return;
      if (k === 'back') return this.app.go('home');
      if (k === 'del') this.typed = this.typed.slice(0, -1);
      else if (k === 'ok') {
        if (Number(this.typed) === this.gateAnswer) return this.renderDashboard();
        toast('답이 달라요. 새 문제로 바꿨어요');
        return this.renderGate();
      } else if (this.typed.length < 4) this.typed += k;
      this.el.querySelector('.gate-typed').innerHTML = this.typed || '&nbsp;';
    };
  }

  renderDashboard() {
    const d = store.data;
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = today(i - 6);
      return { date, ms: d.days[date]?.ms || 0, label: ['일', '월', '화', '수', '목', '금', '토'][new Date(`${date}T00:00`).getDay()] };
    });
    const maxMs = Math.max(...week.map((w) => w.ms), 60000);
    const t = d.days[today()] || { ms: 0, solved: 0, correct: 0 };
    let ok = 0, all = 0;
    for (const f of Object.values(d.facts)) {
      ok += f.ok;
      all += f.ok + f.miss;
    }

    // 2~9단의 서로 다른 곱셈은 36개 (7×8과 8×7은 하나로 셈)
    let learned = 0;
    for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) if (mastered(a, b) || mastered(b, a)) learned++;

    const cells = DANS.map((a) => {
      const row = Array.from({ length: 9 }, (_, i) => {
        const b = i + 1;
        const f = d.facts[`${a}x${b}`];
        const r = acc(f);
        let cls = 'none';
        if (r !== null) cls = r >= 0.8 ? 'good' : r >= 0.5 ? 'mid' : 'low';
        const swap = cls === 'none' && b >= 2 && mastered(b, a);
        const text = f ? `${Math.round(r * 100)}%<small>${f.ok + f.miss}회</small>` : swap ? '<small>순서 바꾸면 알아요</small>' : '';
        return `<td class="${swap ? 'swap' : cls}"><b>${a}×${b}</b>${text}</td>`;
      }).join('');
      return `<tr><th>${a}단</th>${row}</tr>`;
    }).join('');

    const weak = Object.entries(d.facts)
      .filter(([, f]) => f.miss > 0 && f.ok + f.miss >= 2)
      .sort((x, y) => acc(x[1]) - acc(y[1]))
      .slice(0, 5);

    this.el.innerHTML = `
      <div class="dash">
        <header class="dash-head">
          <h1>보호자 화면</h1>
          <button class="dash-close" data-a="home">어항으로 돌아가기</button>
        </header>
        <p class="dash-story">이 앱은 아빠 DooJo가 아들 Seonu를 위해 사랑을 담아 만들었어요.<br>세상 모든 아이들이 구구단을 쉽고 재미있게 배우길 바라요. 💙</p>

        <div class="dash-cards">
          <div class="dash-card"><span>오늘 학습 시간</span><b>${minutes(t.ms)}분</b><small>푼 문제 ${t.solved}개 · 오늘의 복습 ${t.reviewDone ? '완료 ✓' : '아직'}</small></div>
          <div class="dash-card"><span>최근 7일</span><b>${minutes(week.reduce((s, w) => s + w.ms, 0))}분</b><small>매일 5~10분이 적당해요</small></div>
          <div class="dash-card"><span>연속 출석</span><b>${d.streak.count}일</b><small>마지막 ${d.streak.last || '-'}</small></div>
          <div class="dash-card"><span>한 번에 맞힌 비율</span><b>${all ? Math.round((ok / all) * 100) : 0}%</b><small>전체 ${all}문제</small></div>
        </div>

        <section class="dash-sec">
          <h2>최근 7일 학습 시간</h2>
          <div class="week">
            ${week.map((w) => `<div class="week-col"><div class="week-bar" style="height:${(w.ms / maxMs) * 100}%"></div><span>${minutes(w.ms)}분</span><em>${w.label}</em></div>`).join('')}
          </div>
        </section>

        <section class="dash-sec">
          <h2>구구단표 정답률</h2>
          <p class="dash-sub">2~9단에서 새로 외울 곱셈은 36개예요 (7×8과 8×7은 같은 문제). 지금 <b>${learned}개</b>를 익혔어요. 3번 이상 풀고 80% 이상 맞히면 익힌 것으로 봐요.</p>
          <div class="legend"><span class="good">80% 이상</span><span class="mid">50~79%</span><span class="low">50% 미만</span><span class="swap">순서 바꾸면 아는 문제</span><span class="none">아직 안 풂</span></div>
          <div class="heat-wrap"><table class="heat"><thead><tr><th></th>${Array.from({ length: 9 }, (_, i) => `<th>×${i + 1}</th>`).join('')}</tr></thead><tbody>${cells}</tbody></table></div>
        </section>

        <div class="dash-two">
          <section class="dash-sec">
            <h2>자주 틀리는 문제</h2>
            ${weak.length ? `<ol class="weak">${weak.map(([k, f]) => `<li><b>${k.replace('x', ' × ')}</b><span>${f.ok + f.miss}번 중 ${f.miss}번 틀림</span></li>`).join('')}</ol>` : '<p class="dash-sub">아직 기록이 충분하지 않아요.</p>'}
          </section>
          <section class="dash-sec">
            <h2>섬 진행</h2>
            <ul class="isl">${DAN_ORDER.map((dan) => `<li><b style="color:${CHARACTERS[dan].color}">${dan}단</b><span>${d.progress[dan] ? stageName(dan, d.progress[dan]) : store.isUnlocked(dan) ? '열림 · 시작 전' : '잠김'}</span></li>`).join('')}</ul>
          </section>
        </div>

        <section class="dash-sec">
          <h2>설정</h2>
          <div class="voice-pick">
            <label for="opt-kid">아이 이름</label>
            <input id="opt-kid" maxlength="6" value="${d.kidName || ''}" placeholder="예: 민준" autocomplete="off">
            <small class="dash-sub">친구와 아주 친해지면(💗 4개) 이 이름을 불러 줘요</small>
          </div>
          <label class="opt"><input type="checkbox" id="opt-sound" ${d.sound ? 'checked' : ''}> 소리 전체 (효과음과 배경음악)</label>
          <label class="opt"><input type="checkbox" id="opt-music" ${d.music !== false ? 'checked' : ''}> 배경음악 (어항, 모험 지도)</label>
          <div class="voice-pick"><label for="opt-music-vol">배경음악 크기</label><input type="range" id="opt-music-vol" min="0" max="100" value="${Math.round((d.musicVol ?? 0.6) * 100)}"></div>
          <label class="opt"><input type="checkbox" id="opt-voice" ${d.voice ? 'checked' : ''}> 구구단 읽어주기 음성</label>
          <div class="voice-pick">
            <label for="opt-voice-name">읽어주는 목소리</label>
            <select id="opt-voice-name"></select>
            <button class="dash-close" data-a="test-voice">🔊 들어보기</button>
          </div>
          <p class="dash-sub voice-status"></p>
          <details class="voice-help">
            <summary>태블릿에서 읽어주는 소리가 안 나요</summary>
            <ol>
              <li>태블릿 옆 소리 버튼으로 <b>미디어 음량</b>을 올려 주세요. 아이패드는 옆면 무음 스위치도 확인해 주세요.</li>
              <li><b>갤럭시탭·안드로이드</b>: 설정 &gt; 일반 &gt; 글자 읽어주기(텍스트 음성 변환)에서 기본 엔진을 <b>Google 음성 서비스</b>로 고르고, 언어를 <b>한국어</b>로 설정한 뒤 음성 데이터를 설치해 주세요. 삼성 인터넷보다 <b>Chrome</b>으로 여는 게 좋아요.</li>
              <li><b>아이패드</b>: 설정 &gt; 손쉬운 사용 &gt; 읽기 및 말하기 &gt; 음성 &gt; 한국어에서 <b>유나</b> 목소리를 내려받아 주세요.</li>
              <li>설치한 뒤 게임 화면을 새로고침하고, 위 <b>들어보기</b>를 눌러 확인해 주세요.</li>
            </ol>
          </details>
          <p class="dash-sub">목소리는 기기와 브라우저마다 달라요. Edge의 "Natural" 목소리(SunHi, InJoon)나 Chrome의 "Google 한국의"가 가장 자연스러워요. 아이패드는 설정 &gt; 손쉬운 사용 &gt; 읽기 및 말하기에서 "유나(향상됨)"를 내려받으면 좋아져요.</p>
          <button class="danger" data-a="reset">진행 기록 모두 지우기</button>
        </section>

        <section class="dash-sec">
          <h2>진행 기록 옮기기</h2>
          <p class="dash-sub">진행 기록은 이 기기의 이 주소에만 저장돼요. 새 주소나 다른 기기에서 이어서 하려면, 여기서 <b>코드를 복사</b>한 뒤 새 곳의 보호자 화면에서 <b>붙여 넣고 가져오기</b>를 누르세요.</p>
          <div class="row-left">
            <button class="dash-close" data-a="export">📤 옮기기 코드 만들기</button>
            <button class="dash-close" data-a="copy-code" hidden>📋 코드 복사</button>
          </div>
          <textarea id="transfer-code" rows="3" placeholder="여기에 옮기기 코드를 붙여 넣으세요" spellcheck="false"></textarea>
          <div class="row-left"><button class="dash-close" data-a="import">📥 붙여 넣은 코드로 가져오기</button></div>
        </section>
        <p class="dash-credit">made by DooJo</p>
      </div>`;

    this.el.onclick = async (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'home') this.app.go('home');
      if (a === 'test-voice') speakLine(7, 3);
      const box = this.el.querySelector('#transfer-code');
      if (a === 'export') {
        box.value = store.exportCode();
        this.el.querySelector('[data-a="copy-code"]').hidden = false;
        toast('옮기기 코드를 만들었어요. 복사해서 새 곳에 붙여 넣으세요');
      }
      if (a === 'copy-code') {
        try {
          await navigator.clipboard.writeText(box.value);
          toast('코드를 복사했어요');
        } catch {
          box.select();
          toast('코드를 선택했어요. 길게 눌러 복사하세요');
        }
      }
      if (a === 'import') {
        if (!box.value.trim()) return toast('먼저 옮기기 코드를 붙여 넣어 주세요');
        const yes = await confirmBox('지금 이 기기의 기록이 코드의 기록으로 바뀌어요. 가져올까요?', '가져오기', '취소');
        if (!yes) return;
        if (store.importCode(box.value)) {
          toast('기록을 가져왔어요! 🎉');
          setTimeout(() => location.reload(), 900);
        } else {
          toast('코드가 올바르지 않아요. 전체를 다시 복사해 주세요');
        }
      }
      if (a === 'reset') {
        const yes = await confirmBox('별, 친구, 학습 기록이 모두 지워져요. 정말 지울까요?', '모두 지우기', '취소');
        if (yes) {
          store.reset();
          toast('기록을 모두 지웠어요');
          this.renderDashboard();
        }
      }
    };
    this.el.querySelector('#opt-sound').onchange = (e) => {
      store.setOption('sound', e.target.checked);
      sound.enabled = e.target.checked;
      music.applyVolume();
    };
    this.el.querySelector('#opt-voice').onchange = (e) => store.setOption('voice', e.target.checked);
    this.el.querySelector('#opt-music').onchange = (e) => {
      store.setOption('music', e.target.checked);
      music.applyVolume();
    };
    this.el.querySelector('#opt-music-vol').oninput = (e) => {
      store.setOption('musicVol', Number(e.target.value) / 100);
      music.applyVolume();
    };
    this.el.querySelector('#opt-kid').onchange = (e) => store.setOption('kidName', e.target.value.trim().slice(0, 6));
    const select = this.el.querySelector('#opt-voice-name');
    const fillVoices = () => {
      const n = koreanVoices().length;
      this.el.querySelector('.voice-status').innerHTML = !speechSupported
        ? '⚠️ 이 브라우저는 읽어주기를 지원하지 않아요. Chrome이나 Safari로 열어 주세요.'
        : n === 0
          ? '⚠️ 이 기기에서 한국어 목소리를 찾지 못했어요. 아래 설치 방법을 확인해 주세요.'
          : `✅ 이 기기의 한국어 목소리 ${n}개`;
      const best = bestVoice();
      select.innerHTML = `<option value="">자동 (${best ? best.name : '기본 목소리'})</option>` +
        koreanVoices().map((v) => `<option value="${v.name}" ${v.name === d.voiceName ? 'selected' : ''}>${v.name}</option>`).join('');
    };
    fillVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', fillVoices, { once: true });
    select.onchange = () => {
      store.setOption('voiceName', select.value);
      speakLine(7, 3);
    };
  }
}
