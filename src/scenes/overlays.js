// 어항 위에 뜨는 창: 꾸미기(상점), 도감
import { store } from '../core/store.js';
import { h, toast, unit, confirmBox } from '../core/ui.js';
import { sound } from '../audio/soundManager.js';
import { CHARACTERS, DAN_ORDER, STAGES, stageName } from '../data/characters.js';
import { charSVG, guideSVG } from '../graphics/characters.js';
import { SHOP_TABS, SHOP_ITEMS, THEMES, decorSVG } from '../data/shop.js';
import { createFoodCanSVG, createMedicineSVG } from '../graphics/food.js';
import { REQUESTS, josa } from '../data/care.js';
import confetti from 'canvas-confetti';
import { GUESTS } from '../data/guests.js';
import { guestSVG } from '../graphics/guests.js';

const guestLikes = (type) => GUESTS.some((g) => g.likes.includes(type));

export function sheet(title, bodyHTML) {
  const el = h(`
    <div class="overlay">
      <div class="sheet">
        <button class="sheet-close" aria-label="닫기">✕</button>
        <h2 class="sheet-title">${title}</h2>
        <div class="sheet-body">${bodyHTML}</div>
      </div>
    </div>`);
  el.querySelector('.sheet-close').addEventListener('click', () => {
    sound.playPop();
    el.remove();
  });
  document.getElementById('app').appendChild(el);
  return el;
}

export function openDecorShop(onChange, startTab = 'plant') {
  let tab = startTab;
  const px = Math.round(unit() * 8);

  const lockNote = (need) => `<span class="shop-cost locked">🔒 친구 ${need}명 부화</span>`;
  const card = (it) => {
    const locked = it.need && store.hatchedCount() < it.need;
    return `
      <button class="shop-item ${locked ? 'locked' : ''}" data-buy="${it.type}">
        <span class="shop-art">${it.draw(px)}</span>
        <span class="shop-name">${it.name}</span>
        ${guestLikes(it.type) ? '<span class="shop-tag">💌 손님이 좋아해요</span>' : ''}
        ${locked ? lockNote(it.need) : `<span class="shop-cost">⭐ ${it.cost}</span>`}
      </button>`;
  };
  const themeCard = (t) => {
    const owned = store.data.themes.includes(t.id);
    const locked = !owned && t.need && store.hatchedCount() < t.need;
    const using = store.data.theme === t.id;
    let tag = `<span class="shop-cost">⭐ ${t.cost}</span>`;
    if (locked) tag = lockNote(t.need);
    else if (using) tag = '<span class="shop-cost using">사용 중 ✓</span>';
    else if (owned) tag = '<span class="shop-cost owned">사용하기</span>';
    return `
      <button class="shop-item ${locked ? 'locked' : ''}" data-theme="${t.id}">
        <span class="shop-art"><span class="theme-swatch" style="background:linear-gradient(180deg, ${t.colors[0]}, ${t.colors[1]})"></span></span>
        <span class="shop-name">${t.name}</span>
        ${tag}
      </button>`;
  };

  const render = () => {
    let grid;
    if (tab === 'theme') grid = THEMES.map(themeCard).join('');
    else if (tab === 'care') grid = `
      <button class="shop-item" data-food="10"><span class="shop-art">${createFoodCanSVG(px)}</span><span class="shop-name">먹이 10개 <small>(${store.data.food}개 있음)</small></span><span class="shop-cost">⭐ 5</span></button>
      <button class="shop-item" data-food="30"><span class="shop-art">${createFoodCanSVG(px)}${createFoodCanSVG(px)}</span><span class="shop-name">먹이 30개</span><span class="shop-cost">⭐ 12</span></button>
      <button class="shop-item" data-medicine="1"><span class="shop-art">${createMedicineSVG(px)}</span><span class="shop-name">물고기 약 <small>(${store.data.medicine}개 있음)</small></span><span class="shop-cost">⭐ 10</span></button>`;
    else grid = SHOP_ITEMS.filter((it) => it.cat === tab).map(card).join('');
    return `
      <p class="sheet-sub">내 별 ⭐ <b>${store.data.stars}</b> · 산 장식은 보관함에 들어가요. 창을 닫고 원하는 곳에 끌어다 놓아요</p>
      <div class="shop-tabs">${SHOP_TABS.map((t) => `<button class="shop-tab ${t.id === tab ? 'on' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}</div>
      <div class="shop-grid">${grid}</div>`;
  };

  const el = sheet('🛒 뽀글 상점', render());
  const refresh = () => {
    el.querySelector('.sheet-body').innerHTML = render();
    onChange();
  };
  const pay = (cost) => {
    if (store.spendStars(cost)) return true;
    sound.playBoing();
    toast('별이 조금 모자라요. 구구단 모험에서 별을 모아요 ⭐');
    return false;
  };

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab], [data-buy], [data-theme], [data-food], [data-medicine]');
    if (!b) return;
    if (b.dataset.tab) {
      sound.playPop();
      tab = b.dataset.tab;
      el.querySelector('.sheet-body').innerHTML = render();
      return;
    }
    if (b.classList.contains('locked')) {
      sound.playBoing();
      toast('친구를 더 부화시키면 살 수 있어요!');
      return;
    }
    if (b.dataset.food) {
      const n = Number(b.dataset.food);
      if (!pay(n === 10 ? 5 : 12)) return;
      sound.playStar();
      store.addFood(n);
      toast(`먹이 ${n}개를 받았어요`);
    } else if (b.dataset.medicine) {
      if (!pay(10)) return;
      sound.playStar();
      store.addMedicine(1);
      toast('물고기 약을 샀어요! 아픈 친구를 톡 누르면 약을 줘요 💊');
    } else if (b.dataset.theme) {
      const t = THEMES.find((x) => x.id === b.dataset.theme);
      if (store.data.themes.includes(t.id)) {
        sound.playPop();
        store.setTheme(t.id);
      } else {
        if (!pay(t.cost)) return;
        sound.playStar();
        store.buyTheme(t.id);
        toast(`어항 배경이 ${t.name}(으)로 바뀌었어요!`);
      }
    } else {
      const it = SHOP_ITEMS.find((x) => x.type === b.dataset.buy);
      if (!pay(it.cost)) return;
      sound.playStar();
      store.addDecoration(it.type);
      toast(`${it.name}을(를) 보관함에 넣었어요!`);
    }
    refresh();
  });
}

export function openDex(startTab = 'fish') {
  let tab = startTab;
  const rows = DAN_ORDER.map((dan) => {
    const c = CHARACTERS[dan];
    const p = store.data.progress[dan];
    const cells = STAGES.map((s) => {
      const got = p >= s.progress;
      return `
        <div class="dex-cell ${got ? '' : 'locked'}">
          ${got ? charSVG(dan, s.progress, 64) : '<span class="dex-q">?</span>'}
          <span>${got ? stageName(dan, s.progress) : s.label}</span>
        </div>`;
    }).join('');
    return `
      <div class="dex-row">
        <div class="dex-head">
          <b style="color:${c.color}">${dan}단</b><span>${p >= 2 ? store.petName(dan) : c.species}</span>
          ${p >= 2 ? `<span class="dex-love">${hearts(store.loveLevel(dan))}</span><span class="dex-links"><button class="link-mini" data-card="${dan}">🪪 카드</button><button class="link-mini" data-rename="${dan}">✏️ 이름 짓기</button></span>` : ''}
        </div>
        <div class="dex-cells">${cells}</div>
      </div>`;
  }).join('');
  const total = DAN_ORDER.reduce((sum, d) => sum + store.data.progress[d], 0);
  // 놀러 온 손님: 만난 손님은 이름과 방문 횟수, 못 만난 손님은 실루엣과 좋아하는 장식 힌트
  const itemName = (type) => SHOP_ITEMS.find((it) => it.type === type)?.name;
  const metCount = GUESTS.filter((g) => store.data.guests?.[g.id]?.met).length;
  const guestCards = GUESTS.map((g) => {
    const info = store.data.guests?.[g.id];
    const met = !!info?.met;
    return `
      <div class="guest-card ${met ? '' : 'unmet'}">
        ${guestSVG(g.id, 70, !met)}
        <b>${met ? g.name : '???'}</b>
        <small>${met ? `${g.species} · ${info.visits}번 놀러 왔어요` : `좋아하는 것: ${g.likes.map(itemName).filter(Boolean).join(', ')}`}</small>
      </div>`;
  }).join('');
  // 상점처럼 탭으로 나눠요: 바다 친구 / 손님
  const render = () => `
    <div class="shop-tabs">
      <button class="shop-tab ${tab === 'fish' ? 'on' : ''}" data-tab="fish">🐠 바다 친구 <small>${total}/32</small></button>
      <button class="shop-tab ${tab === 'guests' ? 'on' : ''}" data-tab="guests">🦀 손님 <small>${metCount}/${GUESTS.length}</small></button>
    </div>
    ${tab === 'fish'
      ? `<p class="sheet-sub">모은 친구 <b>${total}</b> / 32 · 하트는 친구와 친한 정도예요</p><div class="dex">${rows}</div>`
      : `<p class="sheet-sub">만난 손님 <b>${metCount}</b> / ${GUESTS.length} · 손님이 좋아하는 장식을 어항에 놓으면 가끔 놀러 와요</p><div class="guest-grid">${guestCards}</div>`}`;
  const el = sheet('📖 바다 도감', render());
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) {
      sound.playPop();
      tab = t.dataset.tab;
      el.querySelector('.sheet-body').innerHTML = render();
      return;
    }
    const card = e.target.closest('[data-card]');
    if (card) {
      openCard(Number(card.dataset.card));
      return;
    }
    const b = e.target.closest('[data-rename]');
    if (!b) return;
    sound.playPop();
    openRename(Number(b.dataset.rename), () => {
      el.remove();
      openDex(tab);
    });
  });
}

export function hearts(level) {
  return '💗'.repeat(level) + '🤍'.repeat(4 - level);
}

// 친구 이름 짓기 (최대 6글자)
export function openRename(dan, onDone) {
  const el = sheet('✏️ 이름 짓기', `
    <div class="rename">
      <div class="rename-art">${charSVG(dan, store.data.progress[dan], 110)}</div>
      <label for="rename-input">${CHARACTERS[dan].species} 친구의 새 이름</label>
      <input id="rename-input" maxlength="6" value="${store.petName(dan)}" autocomplete="off">
      <div class="row">
        <button class="btn btn-foam" data-v="reset">원래 이름으로</button>
        <button class="btn btn-coral" data-v="save">이름 정하기</button>
      </div>
    </div>`);
  const input = el.querySelector('#rename-input');
  setTimeout(() => input.focus(), 50);
  el.addEventListener('click', (e) => {
    const v = e.target.closest('[data-v]')?.dataset.v;
    if (!v) return;
    sound.playStar();
    store.setNickname(dan, v === 'reset' ? '' : input.value || CHARACTERS[dan].name);
    toast(`이제 이름은 ${josa(store.petName(dan), '이에요', '예요')}!`);
    el.remove();
    onDone();
  });
}

// 오늘의 부탁 목록과 도장 카드
export function openRequests(onChange) {
  const render = () => {
    const r = store.ensureRequests();
    if (!r) return '<p class="sheet-msg">친구가 깨어나면 부탁을 해요. 먼저 모험을 떠나 알을 부화시켜 봐요!</p>';
    const rows = r.list.map((q) => `
      <div class="req-row ${q.done ? 'done' : ''}">
        <span class="req-art">${charSVG(q.dan, store.data.progress[q.dan], 56)}</span>
        <span class="req-text">${REQUESTS[q.type].icon} ${REQUESTS[q.type].text(store.petName(q.dan), q, store.data.kidName)}</span>
        <span class="req-state">${q.done ? '✓ 들어줬어요' : '하는 중'}</span>
      </div>`).join('');
    const filled = r.rewarded && store.data.stamps % 7 === 0 ? 7 : store.data.stamps % 7;
    const stamps = Array.from({ length: 7 }, (_, i) => `<i class="${i < filled ? 'on' : ''}">${i === 6 ? '🎁' : i < filled ? '💮' : ''}</i>`).join('');
    const ready = store.requestsReady();
    return `
      <div class="req-list">${rows}</div>
      <div class="stamp-card"><span>도장 카드</span><div class="stamps">${stamps}</div><small>7개 모으면 큰 선물!</small></div>
      <div class="row">
        ${r.rewarded
          ? '<button class="btn btn-foam" disabled>오늘 도장을 받았어요 ✓</button>'
          : `<button class="btn ${ready ? 'btn-coral' : 'btn-foam'}" data-claim ${ready ? '' : 'disabled'}>${ready ? '🎁 도장 받기' : '부탁을 다 들어주면 도장을 받아요'}</button>`}
      </div>`;
  };
  const el = sheet('📋 오늘의 부탁', render());
  el.addEventListener('click', (e) => {
    if (!e.target.closest('[data-claim]')) return;
    const got = store.claimRequests();
    if (!got) return;
    sound.playFanfare();
    confetti({ particleCount: got.big ? 160 : 80, spread: 80, origin: { y: 0.5 }, zIndex: 300 });
    toast(got.big ? `도장 7개 완성! 큰 선물로 별 ${got.stars}개! 🎉` : `도장 받았어요! 별 ${got.stars}개 💮`);
    el.querySelector('.sheet-body').innerHTML = render();
    onChange();
  });
}

// ---- 네임카드 (포켓몬 카드처럼) ----
// 물고기 나이: 부화한 날이 1살, 일주일마다 한 살씩
export const fishAge = (days) => 1 + Math.floor((days - 1) / 7);

// 그 단의 구구단 실력 별점 (한 번에 맞힌 비율)
function skillStars(dan) {
  let ok = 0;
  let all = 0;
  for (let n = 1; n <= 9; n++) {
    const f = store.data.facts[`${dan}x${n}`];
    if (!f) continue;
    ok += f.ok;
    all += f.ok + f.miss;
  }
  if (all < 5) return { stars: '☆☆☆☆', note: '기록을 모으는 중' };
  const r = ok / all;
  const n = r >= 0.9 ? 4 : r >= 0.75 ? 3 : r >= 0.5 ? 2 : 1;
  return { stars: '★'.repeat(n) + '☆'.repeat(4 - n), note: `정답률 ${Math.round(r * 100)}%` };
}

export function openCard(dan) {
  const p = store.data.progress[dan];
  if (p < 2) return;
  const c = CHARACTERS[dan];
  const pet = store.pet(dan);
  const days = store.daysTogether(dan);
  const [, m, d] = pet.born.split('-').map(Number);
  const tier = ['', '', 'baby', 'silver', 'gold'][p];
  const stage = ['', '', '🐣 아기', '🐟 성장', '👑 황금'][p];
  const skill = skillStars(dan);
  const el = h(`
    <div class="overlay card-overlay">
      <div class="namecard tier-${tier}" style="--c:${c.color}">
        <div class="nc-top"><span class="nc-hearts">${hearts(store.loveLevel(dan))}</span><span class="nc-stage">${stage}</span></div>
        <div class="nc-art"><span class="nc-dan">${dan}단</span>${charSVG(dan, p, 190)}</div>
        <div class="nc-name"><b>${store.petName(dan)}</b><small>${c.species}</small></div>
        <dl class="nc-info">
          <div><dt>🎂 생일</dt><dd>${m}월 ${d}일</dd></div>
          <div><dt>🐟 물고기 나이</dt><dd>${fishAge(days)}살 <small>함께한 지 ${days}일</small></dd></div>
          <div><dt>✨ 특징</dt><dd>${c.trait}</dd></div>
          <div><dt>💬 입버릇</dt><dd>"${c.line}"</dd></div>
          <div><dt>📊 ${dan}단 실력</dt><dd><span class="nc-stars">${skill.stars}</span> <small>${skill.note}</small></dd></div>
        </dl>
        <div class="nc-foot">No.${dan}-${p} · 구구단 아쿠아리움</div>
      </div>
      <div class="nc-actions">
        <button class="btn btn-foam" data-a="rename">✏️ 이름 짓기</button>
        <button class="btn btn-coral" data-a="close">닫기</button>
      </div>
    </div>`);
  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (!a && e.target !== el) return;
    sound.playPop();
    el.remove();
    if (a === 'rename') openRename(dan, () => openCard(dan));
  });
  document.getElementById('app').appendChild(el);
  sound.playStar();
}

// 처음 켰을 때 뽀글이가 아이 이름을 물어봐요. 이름이 있으면 친구들이 불러 줘요 (보호자 화면에서도 바꿀 수 있어요)
export function openKidName(onDone) {
  store.setOption('askedName', true);
  const el = sheet('💙 반가워!', `
    <div class="rename">
      <div class="rename-art">${guideSVG(110)}</div>
      <label for="kid-input" class="kid-ask">나는 뽀글이야! 네 이름은 뭐야?</label>
      <input id="kid-input" maxlength="6" placeholder="이름을 써 줘" autocomplete="off">
      <div class="row">
        <button class="btn btn-foam" data-v="later">나중에</button>
        <button class="btn btn-coral" data-v="save">이게 내 이름이야!</button>
      </div>
    </div>`);
  const input = el.querySelector('#kid-input');
  setTimeout(() => input.focus(), 50);
  const done = (save) => {
    const name = input.value.trim().slice(0, 6);
    if (save && !name) {
      sound.playBoing();
      input.focus();
      return;
    }
    if (save) {
      sound.playStar();
      store.setOption('kidName', name);
    } else {
      sound.playPop();
    }
    el.remove();
    onDone(save ? name : '');
  };
  input.addEventListener('keydown', (e) => e.key === 'Enter' && !e.isComposing && done(true));
  el.addEventListener('click', (e) => {
    const v = e.target.closest('[data-v]')?.dataset.v;
    if (v) done(v === 'save');
  });
}

// ---- 사진 앨범: 찍은 순간의 어항을 작게 다시 그려서 보여줘요 ----
function photoCard(ph, cardW) {
  const cardH = Math.round(cardW * ph.ratio);
  const du = cardW / ph.wu; // 사진 속 장식 크기 단위
  const theme = THEMES.find((t) => t.id === ph.theme) || THEMES[0];
  const decor = ph.decor.map((d) => `<div class="photo-decor" style="left:${d.x}%;bottom:${Math.max(2, d.b)}%">${decorSVG(d.type, du)}</div>`).join('');
  const fish = ph.fish.map((f) => {
    const size = Math.round(f.s * cardW);
    return `<div class="photo-fish ${f.flip ? 'flip' : ''}" style="left:${Math.round(f.x * cardW)}px;top:${Math.round((ph.top + f.y * ph.tankH) * cardH)}px">${charSVG(f.dan, f.p, size)}</div>`;
  }).join('');
  const gu = ph.guest;
  const guest = gu ? `<div class="photo-fish ${gu.flip ? 'flip' : ''}" style="left:${Math.round(gu.x * cardW)}px;top:${Math.round((ph.top + gu.y * ph.tankH) * cardH)}px">${guestSVG(gu.id, Math.round(gu.s * cardW))}</div>` : '';
  const d = new Date(ph.at);
  const icon = { day: '☀️', evening: '🌇', night: '🌙' }[ph.time] || '';
  return `
    <figure class="photo" data-id="${ph.id}">
      <div class="photo-tank time-${ph.time}" style="width:${cardW}px;height:${cardH}px;background:linear-gradient(180deg, ${theme.colors[0]}, ${theme.colors[1]})">
        <div class="photo-sand"></div>${decor}${fish}${guest}
      </div>
      <figcaption>${d.getMonth() + 1}월 ${d.getDate()}일 ${icon}<button class="photo-del" data-del="${ph.id}" aria-label="사진 지우기">✕</button></figcaption>
    </figure>`;
}

export function openAlbum(onShoot) {
  const cardW = Math.round(unit() * 26);
  const photos = store.data.photos || [];
  const el = sheet('📸 사진 앨범', `
    <div class="album">
      <div class="album-top">
        <button class="btn btn-coral" data-v="shoot">📸 지금 찍기</button>
        <span class="album-note">예쁘게 꾸민 어항을 사진으로 남겨요 (30장까지)</span>
      </div>
      <div class="album-grid">${photos.length ? photos.map((ph) => photoCard(ph, cardW)).join('') : '<p class="album-empty">아직 사진이 없어요. 친구들과 첫 사진을 찍어 볼까?</p>'}</div>
    </div>`);
  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-v="shoot"]')) {
      sound.playPop();
      el.remove();
      onShoot();
      return;
    }
    const del = e.target.closest('[data-del]');
    if (del) {
      if (await confirmBox('이 사진을 지울까요?', '지우기', '그냥 둘래요')) {
        store.removePhoto(del.dataset.del);
        del.closest('.photo').remove();
      }
      return;
    }
    const card = e.target.closest('.photo');
    const ph = card && photos.find((x) => x.id === card.dataset.id);
    if (ph) openPhoto(ph);
  });
}

// 사진 크게 보기: 화면에 꽉 차게 다시 그려요. 아무 데나 누르면 닫혀요
function openPhoto(ph) {
  sound.playPop();
  const w = Math.round(Math.min(innerWidth * 0.86, (innerHeight * 0.76) / ph.ratio));
  const el = h(`<div class="overlay photo-view">${photoCard(ph, w)}<p class="photo-view-hint">아무 데나 누르면 닫혀요</p></div>`);
  el.querySelector('.photo-del')?.remove();
  el.addEventListener('click', () => {
    sound.playPop();
    el.remove();
  });
  document.getElementById('app').appendChild(el);
}
