// 영어2 본문 학습 — 첫단추(한 줄 해석) · 배열(문장/실전/단어) · 삽입
// 화면은 문자열 HTML + data-act 이벤트 위임 (상상모의고사 app.js와 같은 방식). 기록은 이 기기(localStorage)에만 남아요.
(() => {
'use strict';
const D = window.STUDY;
const HOME = window.STUDY_HOME || '/';
const app = document.getElementById('app');
const LESSONS = D.lessons;
const ALL = LESSONS.flatMap(L => L.passages.map(P => Object.assign(P, { lesson: L })));
const PB = Object.fromEntries(ALL.map(P => [P.id, P]));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const MODES = { read: '첫단추', order: '배열', insert: '삽입' };

/* ── 아이콘 (Lucide, ISC) ── */
const IC = {
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
  vol: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  redo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  right: '<path d="m9 18 6-6-6-6"/>', left: '<path d="m15 18-6-6 6-6"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  link: '<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  back: '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
};
const ic = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;

/* ── 기록 (이 기기에만) ── */
const KEY = 'sk-study:eng2-l34:v1';
const P0 = { tab: 3, read: {}, sent: {}, abc: {}, word: {}, ins: {}, last: '' };
let PR = (() => { try { return Object.assign({}, P0, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, P0); } })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(PR)); } catch (e) { /* 저장 불가(사생활 보호 모드 등) — 화면은 그대로 동작 */ } };
const addTo = (bucket, pid, i) => { const l = PR[bucket][pid] || (PR[bucket][pid] = []); if (!l.includes(i)) l.push(i); save(); };
const insTotal = P => P.s.length - 1;
const insDone = P => (PR.ins[P.id] || []).length;
const wordDone = P => (PR.word[P.id] || []).length;
const orderScore = P => (PR.sent[P.id] ? 1 : 0) + (PR.abc[P.id] ? 1 : 0) + (wordDone(P) >= P.s.length ? 1 : 0);

/* ── 상태 ── */
const S = { view: 'home', pid: ALL[0].id, readMode: 'both', cues: true, rev: new Set(), om: 'sent', im: 'five', sel: null, G: null, toast: '' };

/* ── 어휘 · 단서 표시 ── */
function vocabRe(term) {
  if (/[~…]/.test(term)) return null;
  const ws = term.replace(/^be /, '').split(' ').map(w => w === 'oneself' ? '\\w+self' : (w.length >= 5 && /e$/.test(w) ? w.slice(0, -1) : w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*');
  return new RegExp('\\b' + ws.join('\\s+'), 'i');
}
// 한 문장에 [시작, 끝, 종류, 값] 구간을 표시 — 단서(cue)가 어휘보다 우선, 겹치면 앞선 것만
function marked(s, P, withCue) {
  const spans = [];
  if (withCue) (s.c || []).forEach(([ph, note]) => { const i = s.e.indexOf(ph); if (i >= 0) spans.push([i, i + ph.length, 'cue', note]); });
  (P.v || []).forEach(([w, m]) => { const re = vocabRe(w); if (!re) return; const r = re.exec(s.e); if (r) spans.push([r.index, r.index + r[0].length, 'vw', m]); });
  spans.sort((a, b) => a[0] - b[0] || (a[2] === 'cue' ? -1 : 1));
  let out = '', at = 0;
  for (const [a, b, t, v] of spans) {
    if (a < at) continue;
    out += esc(s.e.slice(at, a));
    const txt = esc(s.e.slice(a, b));
    out += t === 'cue' ? `<mark class="cue" title="${esc(v)}">${txt}</mark>` : `<span class="vw" role="button" tabindex="0" data-act="vw" data-m="${esc(v)}">${txt}</span>`;
    at = b;
  }
  return out + esc(s.e.slice(at));
}
const cueText = (s, ph) => { const i = s.e.indexOf(ph); return i < 0 ? esc(s.e) : esc(s.e.slice(0, i)) + `<mark class="cue">${esc(ph)}</mark>` + esc(s.e.slice(i + ph.length)); };
const linksHTML = s => (s.c && s.c.length) ? `<div class="links">${s.c.map(([ph, n]) => `<p class="link">${ic('link')}<b>${esc(ph)}</b><span>→ ${esc(n)}</span></p>`).join('')}</div>` : '';

/* ── 소리 ── */
const canSpeak = 'speechSynthesis' in window;
function speak(t) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/[“”]/g, '"')); u.lang = 'en-US'; u.rate = .92; speechSynthesis.speak(u); } catch (e) { /* 소리 미지원 */ } }

/* ── 주소 (#home, #read-3-1, #order-4-2, #insert-3-5) ── */
function parseHash() {
  const h = (location.hash || '').slice(1);
  const m = /^(read|order|insert)-(\d-\d+)$/.exec(h);
  if (m && PB[m[2]]) { S.view = m[1]; S.pid = m[2]; }
  else { S.view = 'home'; const l = /(\d-\d+)$/.exec(PR.last || ''); if (l && PB[l[1]]) S.pid = l[1]; }
}
function go(view, pid) {
  const h = view === 'home' ? '#home' : `#${view}-${pid}`;
  if (location.hash !== h) location.hash = h; else route();
}
function route() {
  const prev = S.view + S.pid;
  parseHash();
  if (S.view !== 'home') { PR.last = `${S.view}-${S.pid}`; PR.tab = PB[S.pid].lesson.no; save(); }
  if (prev !== S.view + S.pid) { S.G = null; S.sel = null; S.rev = new Set(); }
  render(true);
}

/* ── 공통 머리 ── */
function headHTML() {
  const pid = S.pid;
  const gi = (v, label, sub) => `<a class="gnb-i" href="#${v === 'home' ? 'home' : `${v}-${pid}`}" aria-current="${S.view === v}">${label}${sub ? `<small>${sub}</small>` : ''}</a>`;
  return `<header class="top"><div class="in top-in">
    <a class="logo" href="${esc(HOME)}"><b>상상모의고사<i>K</i></b><span>영어2 본문 학습</span></a>
    <nav class="top-r" aria-label="사이트"><a href="${esc(HOME)}">모의고사 홈</a><a href="${esc(HOME)}cut.html">등급컷</a></nav>
  </div></header>
  <nav class="gnb" aria-label="학습 메뉴"><div class="in gnb-in">
    ${gi('home', '학습 홈')}<span class="gnb-sep" aria-hidden="true"></span>
    ${gi('read', '첫단추', '한 줄 해석')}${gi('order', '배열', '순서 맞추기')}${gi('insert', '삽입', '빠진 문장 찾기')}
  </div></nav>`;
}
const footHTML = () => `<footer class="foot"><div class="in"><p>상상모의고사K · 영어2 본문 학습 (2학기 기말 Lesson 3·4)</p><p>교과서 본문은 수업 복습용으로만 실었어요. 학습 기록은 이 기기의 브라우저에만 저장돼요.</p></div></footer>`;

/* ── 홈 ── */
function nextStep() {
  const order = LESSONS.find(L => L.no === PR.tab) ? [...LESSONS.find(L => L.no === PR.tab).passages, ...ALL] : ALL;
  for (const P of order) if (!PR.read[P.id]) return ['read', P];
  for (const P of order) if (!PR.sent[P.id]) return ['order', P];
  for (const P of order) if (insDone(P) < insTotal(P)) return ['insert', P];
  return ['insert', ALL[0]];
}
function homeHTML() {
  const nS = ALL.reduce((a, P) => a + P.s.length, 0), nIns = ALL.reduce((a, P) => a + insTotal(P), 0);
  const nRead = ALL.filter(P => PR.read[P.id]).length, nOrd = ALL.filter(P => PR.sent[P.id]).length, nIn = ALL.reduce((a, P) => a + insDone(P), 0);
  const [nv, nP] = nextStep();
  const L = LESSONS.find(x => x.no === PR.tab) || LESSONS[0];
  const last = PR.last && /^(read|order|insert)-(\d-\d+)$/.exec(PR.last);
  const row = P => {
    const r = !!PR.read[P.id], o = orderScore(P), i = insDone(P), it = insTotal(P);
    const meter = (v, t) => `<span class="prog"><span class="meter${v >= t ? ' full' : ''}"><i style="width:${Math.round(100 * v / t)}%"></i></span>${v}/${t}</span>`;
    return `<tr>
      <td class="id">${P.id}</td>
      <td class="t"><a href="#read-${P.id}" style="text-decoration:none"><span class="tt"><b>${esc(P.ko)}</b><span class="en">${esc(P.title)}</span></span></a></td>
      <td class="pg"><span class="pill${P.kind === '본문' ? '' : ' kind'}">${esc(P.kind)}</span><div class="muted" style="font-size:12px;margin-top:3px">${P.page} · ${P.s.length}문장</div></td>
      <td data-l="첫단추">${r ? `<span class="pill done">${ic('check')}이해 완료</span>` : '<span class="pill">아직</span>'}</td>
      <td data-l="배열">${meter(o, 3)}</td>
      <td data-l="삽입">${meter(i, it)}</td>
      <td class="a"><span class="acts"><a class="btn sm ${r ? 'ghost' : 'primary'}" href="#read-${P.id}">첫단추</a><a class="btn sm ghost" href="#order-${P.id}">배열</a><a class="btn sm ghost" href="#insert-${P.id}">삽입</a></span></td>
    </tr>`;
  };
  return `<section class="phead"><div class="in"><div>
      <div class="ph-subj"><span class="sw"></span>${esc(D.subject.name)} · ${esc(D.subject.exam)} 대비</div>
      <h1>본문 학습 · Lesson 3·4</h1>
      <p>예상문제를 풀기 전에 본문부터 내 것으로 만들어요. 한 줄씩 해석하고, 순서를 맞추고, 빠진 문장을 제자리에 끼워 넣으며 지문을 익혀요.</p>
      <dl class="ph-stats"><div><dt>지문</dt><dd>${ALL.length}개</dd></div><div><dt>문장</dt><dd>${nS}개</dd></div><div><dt>첫단추</dt><dd>${nRead}/${ALL.length}</dd></div><div><dt>문장 배열</dt><dd>${nOrd}/${ALL.length}</dd></div><div><dt>삽입</dt><dd>${nIn}/${nIns}</dd></div></dl>
    </div></div></section>
  <main class="in" id="main">
    <div class="steps" role="list">
      <a class="step" role="listitem" href="#read-${nP.id}"><span class="step-n">1</span><b>첫단추</b><span>영어 한 줄, 해석 한 줄. 단어와 연결 단서까지 보며 내용을 이해해요.</span></a>
      <a class="step" role="listitem" href="#order-${nP.id}"><span class="step-n">2</span><b>배열</b><span>문장 카드를 끌어 순서를 맞춰요. 실전 (A)(B)(C)와 단어 배열도 있어요.</span></a>
      <a class="step" role="listitem" href="#insert-${nP.id}"><span class="step-n">3</span><b>삽입</b><span>빠진 문장을 끌어다 제자리에 넣어요. 지시어가 무엇을 받는지 확인해요.</span></a>
    </div>
    <div class="resume"><p>${last ? `최근 학습: <b>${MODES[last[1]]} · ${last[2]} ${esc(PB[last[2]].ko)}</b>` : '처음이라면 3과 첫 지문의 첫단추부터 시작하세요.'}<br>다음 추천: <b>${MODES[nv]} · ${nP.id} ${esc(nP.ko)}</b></p><a class="btn primary" href="#${nv}-${nP.id}">이어서 하기 ${ic('arrow')}</a></div>
    <section class="sec" aria-labelledby="h-list">
      <div class="sec-h"><h2 id="h-list">지문별 학습</h2><span class="muted">${esc(L.reading)}</span></div>
      <div class="ltabs" role="tablist">${LESSONS.map(x => `<button class="ltab" role="tab" aria-selected="${x.no === L.no}" data-act="tab" data-n="${x.no}">Lesson ${x.no}<small>${esc(x.title)} · ${esc(x.ko)}</small></button>`).join('')}</div>
      <table class="board"><thead><tr><th style="width:56px">번호</th><th>지문</th><th style="width:120px">구분</th><th style="width:110px">첫단추</th><th style="width:120px">배열</th><th style="width:120px">삽입</th><th style="width:230px">학습하기</th></tr></thead>
      <tbody>${L.passages.map(row).join('')}</tbody></table>
      <p class="muted" style="margin-top:12px">배열 3칸 = 문장 배열 · 실전 (A)(B)(C) · 단어 배열(모든 문장). 삽입 칸 = 첫 문장을 뺀 모든 문장을 제자리에 넣은 수.</p>
    </section>
  </main>`;
}

/* ── 학습 화면 공통 틀 ── */
function shellHTML(inner) {
  const P = PB[S.pid], L = P.lesson;
  const stat = Q => S.view === 'read' ? (PR.read[Q.id] ? ic('check', 'ok') : '<i class="dot"></i>')
    : S.view === 'order' ? (orderScore(Q) >= 3 ? ic('check', 'ok') : `<em>${orderScore(Q)}/3</em>`)
      : (insDone(Q) >= insTotal(Q) ? ic('check', 'ok') : `<em>${insDone(Q)}/${insTotal(Q)}</em>`);
  const idx = ALL.indexOf(P), prev = ALL[idx - 1], next = ALL[idx + 1];
  return `<main class="in lnb-layout" id="main">
    <aside class="lnb" aria-label="지문 목록">
      <div class="lnb-t"><small>Lesson ${L.no} · ${MODES[S.view]}</small><b>${esc(L.title)}</b></div>
      <div class="lnb-l">${LESSONS.map(x => `<button data-act="lnbl" data-n="${x.no}" aria-pressed="${x.no === L.no}">${x.no}과</button>`).join('')}</div>
      <nav class="lnb-nav">${L.passages.map(Q => `<a class="lnb-i" href="#${S.view}-${Q.id}" aria-current="${Q.id === P.id}"><em>${Q.id}</em><span>${esc(Q.ko)}</span>${stat(Q)}</a>`).join('')}</nav>
    </aside>
    <div class="main">
      <nav class="crumb" aria-label="현재 위치"><a href="#home">학습 홈</a>${ic('right')}<span>${MODES[S.view]}</span>${ic('right')}<span aria-current="page">${P.id}</span></nav>
      <div class="ptitle">
        <div class="tags"><span class="sw"></span><b>Lesson ${L.no}</b><span>·</span><span class="pill${P.kind === '본문' ? '' : ' kind'}">${esc(P.kind)}</span><span>${P.page}</span><span>· ${P.s.length}문장</span></div>
        <h2 class="en">${esc(P.title)}</h2><p>${P.id} ${esc(P.ko)}</p>
      </div>
      <div class="pick"><label class="sr" for="pick">지문 선택</label><select id="pick" data-act="pick">${LESSONS.map(x => `<optgroup label="Lesson ${x.no} ${esc(x.title)}">${x.passages.map(Q => `<option value="${Q.id}"${Q.id === P.id ? ' selected' : ''}>${Q.id} ${esc(Q.ko)}</option>`).join('')}</optgroup>`).join('')}</select></div>
      <div class="mtabs" role="tablist">${Object.entries(MODES).map(([v, n]) => `<a class="mtab" role="tab" href="#${v}-${P.id}" aria-selected="${S.view === v}">${n}<small>${v === 'read' ? (PR.read[P.id] ? '완료' : '') : v === 'order' ? orderScore(P) + '/3' : insDone(P) + '/' + insTotal(P)}</small></a>`).join('')}</div>
      ${inner}
      <div class="acts-row" style="justify-content:space-between;margin-top:32px">
        ${prev ? `<a class="btn ghost" href="#${S.view}-${prev.id}">${ic('left')}${prev.id}</a>` : '<span></span>'}
        ${next ? `<a class="btn ghost" href="#${S.view}-${next.id}">${next.id}${ic('right')}</a>` : '<span></span>'}
      </div>
    </div>
  </main>`;
}

/* ── 1. 첫단추 ── */
function readHTML() {
  const P = PB[S.pid], m = S.readMode;
  let para = 1;
  const rows = P.s.map((s, i) => {
    const kE = `${P.id}:${i}:e`, kK = `${P.id}:${i}:k`;
    const en = (m === 'hideEn' && !S.rev.has(kE)) ? `<button class="cover" data-act="rev" data-k="${kE}">영어 문장 떠올린 뒤 눌러서 확인</button>` : `<p class="en">${marked(s, P, S.cues)}</p>`;
    const ko = (m === 'hideKo' && !S.rev.has(kK)) ? `<button class="cover" data-act="rev" data-k="${kK}">해석해 본 뒤 눌러서 확인</button>` : `<p class="ko">${esc(s.k)}</p>`;
    const head = (s.p && i > 0) ? `<p class="ln-para">¶ 문단 ${++para}</p>` : '';
    return `<li class="ln">${head}<span class="ln-n">${i + 1}</span><div class="ln-b">${en}${ko}${S.cues && !(m === 'hideEn' && !S.rev.has(kE)) ? linksHTML(s) : ''}</div>
      <div class="ln-a">${canSpeak ? `<button class="ib" data-act="say" data-i="${i}" aria-label="${i + 1}번 문장 듣기" title="듣기">${ic('vol')}</button>` : ''}</div></li>`;
  }).join('');
  const done = !!PR.read[P.id];
  return shellHTML(`
    <div class="bar"><p>모르는 단어는 점선을 눌러 뜻을 봐요. <mark class="cue">노란 표시</mark>는 앞뒤 문장을 이어 주는 지시어·연결어예요.</p>
      <div class="bar-r"><span class="seg" role="group" aria-label="보기 방식">
        <button data-act="rmode" data-m="both" aria-pressed="${m === 'both'}">영·한 함께</button><button data-act="rmode" data-m="hideKo" aria-pressed="${m === 'hideKo'}">해석 가리기</button><button data-act="rmode" data-m="hideEn" aria-pressed="${m === 'hideEn'}">영어 가리기</button></span>
        <button class="tog" data-act="cues" aria-pressed="${S.cues}">${ic('link')}연결 단서</button></div></div>
    <details class="vocab"${P.v.length <= 10 ? ' open' : ''}><summary>이 지문의 단어 ${P.v.length}개 <span>교과서 옆 단어 목록</span></summary><ul>${P.v.map(([w, k]) => `<li><b>${esc(w)}</b><span>${esc(k)}</span></li>`).join('')}</ul></details>
    <ol class="lines">${rows}</ol>
    <div class="done-row"><p>${done ? '이해 완료로 표시했어요. 이제 문장 순서를 맞춰 보며 흐름을 굳혀요.' : '모든 문장을 해석할 수 있게 되면 이해 완료로 표시하세요.'}</p>
      <div class="bar-r">${m !== 'both' ? '<button class="btn ghost" data-act="revall">모두 펼치기</button>' : ''}<button class="btn ${done ? 'ghost' : 'dark'}" data-act="readdone">${done ? '완료 취소' : `${ic('check')}이해 완료`}</button><a class="btn primary" href="#order-${P.id}">배열로 연습 ${ic('arrow')}</a></div></div>`);
}

/* ── 2. 배열 ── */
// 2-1 문장 배열: 첫 문장은 고정, 나머지를 섞어요
function newSent(P) { const rest = P.s.map((_, i) => i).slice(1); let o; do { o = shuffle(rest); } while (rest.length > 1 && same(o, rest)); return { k: 'sent', pid: P.id, cur: o, marks: null, tries: 0, done: false, ko: false }; }
// 2-2 실전: 주어진 글 + (A)(B)(C) 세 덩어리 — 단서가 있는 문장이 덩어리 첫머리에 오도록 자르기
function newAbc(P) {
  const n = P.s.length, k = Math.max(1, Math.round(n / 5)), r = n - k;
  const head = i => (P.s[i].c ? 2 : 0) + (P.s[i].p ? 1 : 0);
  const cands = [];
  for (let a = k + 1; a < n - 1; a++) for (let b = a + 1; b < n; b++) {
    const sz = [a - k, b - a, n - b], mean = r / 3, bal = sz.reduce((x, y) => x + (y - mean) ** 2, 0);
    cands.push({ a, b, sc: head(a) + head(b) + head(k) - bal * .6 + Math.random() * .8 });
  }
  cands.sort((x, y) => y.sc - x.sc);
  const { a, b } = cands[Math.floor(Math.random() * Math.min(3, cands.length))] || { a: k + 1, b: k + 2 };
  const chunks = [[k, a], [a, b], [b, n]].map(([x, y]) => P.s.map((_, i) => i).slice(x, y));
  const perms = [[0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const ans = perms[Math.floor(Math.random() * perms.length)];   // ans[j] = 정답 j번째 덩어리의 라벨 번호
  const lab = []; ans.forEach((L, j) => { lab[L] = j; });          // lab[L] = 라벨 L이 붙은 덩어리
  return { k: 'abc', pid: P.id, given: P.s.map((_, i) => i).slice(0, k), chunks, lab, ans, cur: [0, 1, 2], marks: null, tries: 0, done: false };
}
// 2-3 단어 배열: 문장을 2~5단어 조각으로 (쉼표 뒤에서 끊기 우선)
function pieces(e) {
  const w = e.split(/\s+/), n = w.length;
  const target = Math.max(3, Math.min(9, Math.round(n / 3.2)));
  if (n <= target) return w;
  const size = Math.round(n / target), out = [];
  let cur = [];
  for (let i = 0; i < n; i++) {
    cur.push(w[i]);
    const left = n - i - 1, need = target - out.length - 1;   // 남은 단어 수, 앞으로 더 필요한 조각 수
    if (left === 0 || need <= 0) continue;
    const punct = /[,;:]["”’]?$/.test(w[i]) && cur.length >= 2;
    if (left <= need || cur.length >= size || punct) { out.push(cur.join(' ')); cur = []; }
  }
  if (cur.length) out.push(cur.join(' '));
  return out;
}
function newWord(P, si) {
  const solved = PR.word[P.id] || [];
  if (si == null) { si = P.s.findIndex((_, i) => !solved.includes(i)); if (si < 0) si = 0; }
  const pc = pieces(P.s[si].e).map((t, id) => ({ id, t }));
  let bank; do { bank = shuffle(pc.map(x => x.id)); } while (pc.length > 1 && same(bank, pc.map(x => x.id)));
  return { k: 'word', pid: P.id, si, pc, bank, ans: [], state: 'play', tries: 0 };
}
function orderGame(P) {
  const want = S.om;
  if (!S.G || S.G.pid !== P.id || S.G.k !== want) S.G = want === 'sent' ? newSent(P) : want === 'abc' ? newAbc(P) : newWord(P);
  return S.G;
}
function orderHTML() {
  const P = PB[S.pid], G = orderGame(P);
  const tabs = `<div class="bar"><p>${G.k === 'sent' ? '첫 문장 다음에 올 문장들을 끌어서 순서대로 놓으세요. 카드를 눌러 고른 뒤 다른 카드를 누르면 그 자리로 옮겨져요.' : G.k === 'abc' ? '시험과 같은 순서 문제예요. (A)(B)(C) 상자를 끌어서 주어진 글 다음 순서대로 놓으세요.' : '해석을 보고 영어 조각을 순서대로 놓으세요. 조각을 누르면 아래 줄로 올라가고, 다시 누르면 내려와요.'}</p>
    <div class="bar-r"><span class="seg" role="group" aria-label="배열 종류">
      <button data-act="om" data-m="sent" aria-pressed="${G.k === 'sent'}">문장 배열${PR.sent[P.id] ? ' ✓' : ''}</button><button data-act="om" data-m="abc" aria-pressed="${G.k === 'abc'}">실전 (A)(B)(C)${PR.abc[P.id] ? ' ✓' : ''}</button><button data-act="om" data-m="word" aria-pressed="${G.k === 'word'}">단어 배열 ${wordDone(P)}/${P.s.length}</button></span></div></div>`;
  return shellHTML(tabs + (G.k === 'sent' ? sentHTML(P, G) : G.k === 'abc' ? abcHTML(P, G) : wordHTML(P, G)));
}
const whyList = (P, idxs) => {
  const items = idxs.filter(i => P.s[i].c && P.s[i].c.length).map(i => `<li><b>${i + 1}번</b><p class="en">${cueText(P.s[i], P.s[i].c[0][0])}</p><p class="k">${P.s[i].c.map(([ph, n]) => `${esc(ph)} → ${esc(n)}`).join(' · ')}</p></li>`);
  return items.length ? `<ul class="why">${items.join('')}</ul>` : '';
};
function sentHTML(P, G) {
  const card = (i, pos) => {
    const mk = G.marks ? (G.marks[pos] ? ic('check') : ic('x')) : '';
    return `<li class="card${G.marks ? (G.marks[pos] ? ' ok' : ' no') : ''}${S.sel === i ? ' sel' : ''}" data-drag="1" data-i="${i}" data-act="pickcard" tabindex="0" aria-label="문장 카드">
      <span class="grip" data-handle>${ic('grip')}</span><span class="body"><span class="en">${esc(P.s[i].e)}</span>${G.ko ? `<span class="ko">${esc(P.s[i].k)}</span>` : ''}</span><span class="mk">${mk}</span></li>`;
  };
  const right = G.marks ? G.marks.filter(Boolean).length : 0;
  return `<ol class="olist" data-zone="y" data-group="sent" data-kind="sent">
      <li class="card fixed"><span class="grip">${ic('lock')}</span><span class="body"><span class="en">${esc(P.s[0].e)}</span>${G.ko ? `<span class="ko">${esc(P.s[0].k)}</span>` : ''}</span><span class="mk">1</span></li>
      ${G.cur.map(card).join('')}</ol>
    ${G.marks && !G.done ? `<p class="score"><b>${G.cur.length}개 중 ${right}개</b>가 제자리예요. 빨간 카드를 옮겨 다시 채점하세요. (시도 ${G.tries}회)</p>` : ''}
    ${G.done ? `<div class="result pop"><h3>${ic('check')}순서 완성 · 채점 ${G.tries}회</h3><p class="muted">아래 노란 표현이 앞 문장과 이어지는 단서예요. 시험에서는 이 표현들이 바뀌어 나올 수 있으니 "무엇을 받는지"를 기억하세요.</p>${whyList(P, G.cur)}<div class="acts-row" style="margin-top:0"><button class="btn ghost" data-act="again">${ic('shuffle')}다시 섞기</button><button class="btn primary" data-act="om" data-m="abc">실전 (A)(B)(C) ${ic('arrow')}</button></div></div>`
      : `<div class="acts-row"><button class="btn primary" data-act="check-sent">채점하기</button><button class="tog" data-act="ko" aria-pressed="${G.ko}">${ic('eye')}해석 힌트</button><button class="btn ghost" data-act="again">${ic('shuffle')}다시 섞기</button></div>`}`;
}
function abcHTML(P, G) {
  const L = ['(A)', '(B)', '(C)'];
  const box = (lb, pos) => {
    const ch = G.chunks[G.lab[lb]];
    return `<li class="card${G.marks ? (G.marks[pos] ? ' ok' : ' no') : ''}${S.sel === lb ? ' sel' : ''}" data-drag="1" data-i="${lb}" data-act="pickcard" tabindex="0">
      <span class="grip" data-handle><span class="lab">${L[lb]}</span></span><span class="body"><span class="en">${ch.map(i => esc(P.s[i].e)).join(' ')}</span></span><span class="mk">${G.marks ? (G.marks[pos] ? ic('check') : ic('x')) : ''}</span></li>`;
  };
  const ansTxt = G.ans.map(x => L[x]).join(' – ');
  return `<div class="given"><small>주어진 글</small><p class="en">${G.given.map(i => esc(P.s[i].e)).join(' ')}</p></div>
    <ol class="olist" data-zone="y" data-group="abc" data-kind="abc">${G.cur.map(box).join('')}</ol>
    ${G.marks && !G.done ? `<p class="score">아직 순서가 맞지 않아요. 각 상자의 <b>첫 문장</b>이 앞 상자의 무엇을 받는지 보세요. (시도 ${G.tries}회)</p>` : ''}
    ${G.done ? `<div class="result pop"><h3>${ic('check')}정답 ${esc(ansTxt)}</h3>${(() => {
      const li = G.chunks.map((ch, j) => { const s = P.s[ch[0]]; return s.c && s.c.length ? `<li><b>${L[G.ans[j]]}</b><p class="en">${cueText(s, s.c[0][0])}</p><p class="k">${s.c.map(([ph, n]) => `${esc(ph)} → ${esc(n)}`).join(' · ')}</p></li>` : ''; }).join('');
      return li ? `<p class="muted">각 상자의 첫 문장이 앞 내용과 이어지는 단서예요.</p><ul class="why">${li}</ul>` : '';
    })()}<div class="acts-row" style="margin-top:0"><button class="btn ghost" data-act="again">${ic('shuffle')}다른 문제</button><button class="btn primary" data-act="om" data-m="word">단어 배열 ${ic('arrow')}</button></div></div>`
      : `<div class="acts-row"><button class="btn primary" data-act="check-abc">채점하기</button><button class="btn ghost" data-act="again">${ic('shuffle')}다른 문제</button></div>`}`;
}
function wordHTML(P, G) {
  const solved = PR.word[P.id] || [];
  const s = P.s[G.si];
  const chip = (id, where) => `<button class="chip" data-drag="free" data-i="${id}" data-act="chip" data-w="${where}">${esc(G.pc[id].t)}</button>`;
  const st = G.state;
  return `<div class="wq">
      <div class="wq-h"><span>${G.si + 1} / ${P.s.length} 문장</span><span>${G.tries ? `시도 ${G.tries}회` : ''}</span></div>
      <p class="wq-ko">${esc(s.k)}</p>
      <div class="wline${st === 'right' || st === 'shown' ? ' ok' : st === 'wrong' ? ' no' : ''}" data-zone="wrap" data-group="w" data-kind="ans" aria-label="내 답">${(st === 'shown' ? G.pc.map(x => x.id) : G.ans).map(id => chip(id, 'ans')).join('')}</div>
      ${st === 'shown' ? '' : `<div class="wbank" data-zone="wrap" data-group="w" data-kind="bank" aria-label="조각">${G.bank.map(id => chip(id, 'bank')).join('')}</div>`}
      ${st === 'wrong' ? '<p class="score" style="color:var(--bad)">순서가 달라요. 조각을 눌러 내리거나 끌어서 고쳐 보세요.</p>' : ''}
      ${st === 'right' ? `<p class="score" style="color:var(--good)"><b style="color:inherit">${ic('check')} 정답!</b> ${linksHTML(s) ? '' : ''}</p>${linksHTML(s)}` : ''}
      ${st === 'shown' ? '<p class="score">정답을 확인했어요. 이 문장은 다시 풀어야 완료로 쳐요.</p>' : ''}
      <div class="acts-row">${st === 'right' || st === 'shown'
        ? `<button class="btn primary" data-act="wnext">다음 문장 ${ic('arrow')}</button>${st === 'shown' ? '<button class="btn ghost" data-act="wretry">다시 풀기</button>' : ''}${canSpeak ? `<button class="btn ghost" data-act="say" data-i="${G.si}">${ic('vol')}듣기</button>` : ''}`
        : `<button class="btn ghost" data-act="wreset">${ic('redo')}처음부터</button><button class="btn ghost" data-act="wshow">정답 보기</button>`}</div>
      <div class="wdots" aria-label="문장 선택">${P.s.map((_, i) => `<button class="wdot${solved.includes(i) ? ' solved' : ''}" data-act="wgo" data-i="${i}" aria-current="${i === G.si}" aria-label="${i + 1}번 문장">${i + 1}</button>`).join('')}</div>
    </div>`;
}

/* ── 3. 삽입 ── */
function newIns(P, t) {
  const solved = PR.ins[P.id] || [];
  if (t == null) { const left = P.s.map((_, i) => i).slice(1).filter(i => !solved.includes(i)); t = left.length ? left[Math.floor(Math.random() * left.length)] : 1 + Math.floor(Math.random() * (P.s.length - 1)); }
  const m = P.s.length - 1;           // 남은 문장 수, 자리 g = 남은 문장 g번째 '앞' (g=m 이면 맨 끝)
  let gaps;
  if (S.im === 'all' || m <= 5) gaps = Array.from({ length: m }, (_, i) => i + 1);
  else { let lo = Math.max(1, Math.min(t - Math.floor(Math.random() * 5), m - 4)); gaps = [lo, lo + 1, lo + 2, lo + 3, lo + 4]; }
  return { k: 'ins', pid: P.id, t, gaps, wrong: [], state: 'play', mode: S.im, ko: false };
}
function insGame(P) { if (!S.G || S.G.pid !== P.id || S.G.k !== 'ins' || S.G.mode !== S.im) S.G = newIns(P); return S.G; }
function insertHTML() {
  const P = PB[S.pid], G = insGame(P), t = G.t, given = P.s[t];
  const rest = P.s.map((s, i) => ({ s, i })).filter(x => x.i !== t);
  const solved = PR.ins[P.id] || [];
  const label = g => String(S.im === 'five' ? G.gaps.indexOf(g) + 1 : g);
  const gapEl = g => {
    if (G.state !== 'play' && g === t) return `<span class="slot${G.state === 'shown' ? ' reveal' : ''}">${esc(given.e)}</span> `;
    if (!G.gaps.includes(g)) return '';
    const st = G.wrong.includes(g) ? ' no' : '';
    return `<button class="gap${st}" data-gap="${g}" data-act="gap" ${G.state !== 'play' ? 'disabled' : ''} aria-label="${G.gaps.indexOf(g) + 1}번 자리">${label(g)}</button> `;
  };
  // 문단 나누기를 지키면서 자리 표시를 끼워 넣기
  const paras = []; let cur = [];
  rest.forEach((x, j) => {
    const g = j;                                    // 이 문장 앞의 자리 번호 (j=0 앞은 자리 없음)
    const brk = x.s.p || (x.i === t + 1 && P.s[t].p);   // 뺀 문장이 문단 첫 문장이면 다음 문장에서 문단을 나눠요
    if (brk && cur.length) { paras.push(cur); cur = []; }
    if (j > 0) cur.push(gapEl(g));
    cur.push(`<span class="en">${esc(x.s.e)}</span> `);
  });
  cur.push(gapEl(rest.length));
  paras.push(cur);
  const prevS = P.s[t - 1], nextS = P.s[t + 1];
  const res = G.state === 'play' ? '' : `<div class="result${G.state === 'shown' ? ' reveal' : ''} pop">
      <h3>${G.state === 'right' ? `${ic('check')}정답! ${label(t)}번 자리` : `정답은 ${label(t)}번 자리예요`}</h3>
      ${(given.c || []).length || (nextS && (nextS.c || []).length) ? `<ul class="why">
        ${(given.c || []).map(([ph, n]) => `<li><b>주어진</b><p class="en">${cueText(given, ph)}</p><p class="k">${esc(ph)} → ${esc(n)}</p></li>`).join('')}
        ${nextS && nextS.c ? nextS.c.map(([ph, n]) => `<li><b>뒤 문장</b><p class="en">${cueText(nextS, ph)}</p><p class="k">${esc(ph)} → ${esc(n)}</p></li>`).join('') : ''}</ul>` : ''}
      <dl class="ctx">${prevS ? `<div><dt>앞 문장</dt><dd>${esc(prevS.k)}</dd></div>` : ''}<div class="me"><dt>주어진</dt><dd>${esc(given.k)}</dd></div>${nextS ? `<div><dt>뒤 문장</dt><dd>${esc(nextS.k)}</dd></div>` : '<div><dt>뒤 문장</dt><dd>(지문의 마지막 문장)</dd></div>'}</dl>
      <div class="acts-row" style="margin-top:0"><button class="btn primary" data-act="inext">다음 문장 ${ic('arrow')}</button>${G.state === 'shown' ? '<button class="btn ghost" data-act="iretry">이 문장 다시</button>' : ''}</div></div>`;
  return shellHTML(`<div class="bar"><p>${S.im === 'five' ? '시험처럼 다섯 자리 중에서 골라요.' : '모든 문장 사이가 후보예요. 실전보다 어려워요.'} 주어진 문장을 끌어다 놓거나, 자리 번호를 눌러도 돼요.</p>
      <div class="bar-r"><span class="seg" role="group" aria-label="자리 수"><button data-act="im" data-m="five" aria-pressed="${S.im === 'five'}">실전 5자리</button><button data-act="im" data-m="all" aria-pressed="${S.im === 'all'}">모든 자리</button></span></div></div>
    <div class="ins-given" data-drag="ins" aria-label="주어진 문장"><span class="grip">${ic('grip')}</span><span class="body"><small>주어진 문장 · ${solved.length}/${insTotal(P)} 완료</small><span class="en">${esc(given.e)}</span>${G.ko ? `<span class="ko">${esc(given.k)}</span>` : ''}</span></div>
    <div class="acts-row" style="margin-top:10px"><button class="tog" data-act="iko" aria-pressed="${G.ko}">${ic('eye')}해석 힌트</button>${G.wrong.length && G.state === 'play' ? `<span class="muted" style="align-self:center">틀린 자리 ${G.wrong.length}곳 · 두 번 틀리면 정답을 보여 줘요</span>` : ''}</div>
    <div class="pass">${paras.map(p => `<p>${p.join('')}</p>`).join('')}</div>
    ${res}
    <div class="wdots" aria-label="넣을 문장 고르기">${P.s.map((_, i) => i === 0 ? '' : `<button class="wdot${solved.includes(i) ? ' solved' : ''}" data-act="igo" data-i="${i}" aria-current="${i === t}" aria-label="${i + 1}번 문장">${i + 1}</button>`).join('')}</div>`);
}
function chooseGap(g) {
  const P = PB[S.pid], G = S.G;
  if (!G || G.state !== 'play' || !G.gaps.includes(g) || G.wrong.includes(g)) return;
  if (g === G.t) { G.state = G.wrong.length < 2 ? 'right' : 'shown'; if (G.state === 'right') addTo('ins', P.id, G.t); render(); scrollRes(); return; }
  G.wrong.push(g);
  if (G.wrong.length >= 2) { G.state = 'shown'; render(); scrollRes(); return; }
  render();
  const el = app.querySelector(`[data-gap="${g}"]`); if (el) el.classList.add('shake');
}
const scrollRes = () => { const r = app.querySelector('.result'); if (r) r.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };

/* ── 그리기 ── */
let lastView = '';
function render(top) {
  const body = S.view === 'home' ? homeHTML() : S.view === 'read' ? readHTML() : S.view === 'order' ? orderHTML() : insertHTML();
  const y = window.scrollY;
  app.innerHTML = headHTML() + body + footHTML() + (S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : '');
  document.title = S.view === 'home' ? '영어2 본문 학습' : `${MODES[S.view]} ${S.pid} · 영어2 본문 학습`;
  const key = S.view + S.pid;
  if (top && key !== lastView) window.scrollTo(0, 0); else window.scrollTo(0, y);
  lastView = key;
}
let toastT;
function toast(m) { S.toast = m; render(); clearTimeout(toastT); toastT = setTimeout(() => { S.toast = ''; const t = app.querySelector('.toast'); if (t) t.remove(); }, 1800); }

/* ── 드래그 (마우스는 카드 어디서나, 터치는 손잡이·조각에서) ── */
let D0 = null, justDragged = false, raf = 0;
document.addEventListener('pointerdown', e => {
  const it = e.target.closest('[data-drag]');
  if (!it || (e.pointerType === 'mouse' && e.button !== 0)) return;
  if (e.pointerType !== 'mouse' && it.dataset.drag === '1' && !e.target.closest('[data-handle]')) return;
  if (it.closest('.wline.ok') || (S.G && S.G.done)) return;
  D0 = { it, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, started: false, ins: it.dataset.drag === 'ins' };
});
function startDrag() {
  const it = D0.it, r = it.getBoundingClientRect();
  D0.started = true; document.body.classList.add('dragging');
  if (D0.ins) {
    if (!S.G || S.G.state !== 'play') { D0 = null; document.body.classList.remove('dragging'); return; }
    const g = it.cloneNode(true); g.classList.add('drag-ghost'); g.removeAttribute('data-drag');
    Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
    document.body.appendChild(g); D0.ghost = g; it.style.opacity = '.35'; return;
  }
  const ph = document.createElement(it.tagName === 'LI' ? 'li' : 'span');
  ph.className = 'ph'; ph.style.height = r.height + 'px'; if (it.dataset.drag === 'free') { ph.style.width = r.width + 'px'; ph.style.display = 'inline-block'; }
  it.after(ph); D0.ph = ph; D0.group = it.closest('[data-zone]').dataset.group;
  it.classList.add('lifted');
  Object.assign(it.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', zIndex: 100, pointerEvents: 'none', margin: 0 });
  document.querySelectorAll('.card.ok,.card.no').forEach(c => c.classList.remove('ok', 'no'));
}
function place(z, x, y) {
  const kids = [...z.children].filter(c => c !== D0.it && c !== D0.ph && c.matches('[data-drag]'));
  let before = null;
  if (z.dataset.zone === 'y') before = kids.find(k => { const r = k.getBoundingClientRect(); return y < r.top + r.height / 2; });
  else for (const k of kids) { const r = k.getBoundingClientRect(); if (y < r.top) { before = k; break; } if (y <= r.bottom && x < r.left + r.width / 2) { before = k; break; } }
  if (before) { if (D0.ph.nextSibling !== before) z.insertBefore(D0.ph, before); }
  else if (z.lastElementChild !== D0.ph) z.appendChild(D0.ph);
}
function nearGap(x, y) {
  let best = null, bd = 64;
  app.querySelectorAll('.gap:not([disabled])').forEach(g => { const r = g.getBoundingClientRect(); const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom); const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = g; } });
  return best;
}
function tick() {
  if (!D0 || !D0.started) { raf = 0; return; }
  const { x, y } = D0;
  if (D0.ins) {
    D0.ghost.style.transform = `translate(${x - D0.x0}px,${y - D0.y0}px)`;
    const g = nearGap(x, y); app.querySelectorAll('.gap.hot').forEach(h => h !== g && h.classList.remove('hot')); if (g) g.classList.add('hot'); D0.hot = g;
  } else {
    D0.it.style.transform = `translate(${x - D0.x0}px,${y - D0.y0}px)`;
    const el = document.elementFromPoint(x, y), z = el && el.closest('[data-zone]');
    if (z && z.dataset.group === D0.group) place(z, x, y);
  }
  const edge = 70, h = window.innerHeight;
  if (y < edge) window.scrollBy(0, -Math.ceil((edge - y) / 5)); else if (y > h - edge) window.scrollBy(0, Math.ceil((y - (h - edge)) / 5));
  raf = requestAnimationFrame(tick);
}
document.addEventListener('pointermove', e => {
  if (!D0) return;
  D0.x = e.clientX; D0.y = e.clientY;
  if (!D0.started) { if (Math.hypot(e.clientX - D0.x0, e.clientY - D0.y0) < 6) return; startDrag(); if (!D0) return; }
  e.preventDefault();
  if (!raf) raf = requestAnimationFrame(tick);
}, { passive: false });
function endDrag(cancel) {
  if (!D0) return;
  const d = D0; D0 = null; cancelAnimationFrame(raf); raf = 0;
  if (!d.started) return;
  document.body.classList.remove('dragging'); justDragged = true; setTimeout(() => { justDragged = false; }, 0);
  if (d.ins) { d.ghost.remove(); d.it.style.opacity = ''; if (!cancel && d.hot) chooseGap(+d.hot.dataset.gap); else app.querySelectorAll('.gap.hot').forEach(h => h.classList.remove('hot')); return; }
  d.ph.replaceWith(d.it); d.it.removeAttribute('style'); d.it.classList.remove('lifted');
  dropped(d.it);
}
document.addEventListener('pointerup', () => endDrag(false));
document.addEventListener('pointercancel', () => endDrag(true));
document.addEventListener('click', e => { if (justDragged) { e.stopPropagation(); e.preventDefault(); } }, true);
// 드롭 뒤: 화면 순서를 상태로 옮기기
function dropped(it) {
  const G = S.G, z = it.closest('[data-zone]'); if (!G || !z) return;
  if (G.k === 'sent' || G.k === 'abc') { G.cur = [...z.querySelectorAll('[data-drag]')].map(c => +c.dataset.i); G.marks = null; S.sel = null; render(); return; }
  if (G.k === 'word') {
    G.ans = [...app.querySelectorAll('[data-kind="ans"] [data-drag]')].map(c => +c.dataset.i);
    G.bank = [...app.querySelectorAll('[data-kind="bank"] [data-drag]')].map(c => +c.dataset.i);
    if (G.state === 'wrong') G.state = 'play';
    wordCheck();
  }
}
function wordCheck() {
  const P = PB[S.pid], G = S.G;
  if (G.bank.length === 0 && G.state === 'play') {
    const got = G.ans.map(id => G.pc[id].t).join(' '), want = P.s[G.si].e;
    G.tries++;
    if (got === want) { G.state = 'right'; addTo('word', P.id, G.si); } else G.state = 'wrong';
  }
  render();
}

/* ── 키보드: 카드에 초점을 두고 Alt+↑/↓ 로 옮기기 ── */
document.addEventListener('keydown', e => {
  const c = e.target.closest && e.target.closest('.card[data-drag]');
  if (c && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    const G = S.G, i = +c.dataset.i, p = G.cur.indexOf(i), q = p + (e.key === 'ArrowUp' ? -1 : 1);
    if (q < 0 || q >= G.cur.length) return;
    e.preventDefault(); [G.cur[p], G.cur[q]] = [G.cur[q], G.cur[p]]; G.marks = null; render();
    const n = app.querySelector(`.card[data-i="${i}"]`); if (n) n.focus();
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.vw,.card[data-drag]')) { e.preventDefault(); e.target.click(); }
});

/* ── 누르기 ── */
app.addEventListener('change', e => { if (e.target.dataset.act === 'pick') go(S.view, e.target.value); });
app.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) { app.querySelectorAll('.vw[data-open]').forEach(v => v.removeAttribute('data-open')); return; }
  const a = t.dataset.act, P = PB[S.pid], G = S.G;
  switch (a) {
    case 'tab': PR.tab = +t.dataset.n; save(); render(); break;
    case 'lnbl': { const L = LESSONS.find(x => x.no === +t.dataset.n); go(S.view, L.passages[0].id); break; }
    case 'vw': { const on = t.hasAttribute('data-open'); app.querySelectorAll('.vw[data-open]').forEach(v => v.removeAttribute('data-open')); if (!on) t.setAttribute('data-open', ''); break; }
    case 'rmode': S.readMode = t.dataset.m; S.rev = new Set(); render(); break;
    case 'cues': S.cues = !S.cues; render(); break;
    case 'rev': S.rev.add(t.dataset.k); render(); break;
    case 'revall': P.s.forEach((_, i) => { S.rev.add(`${P.id}:${i}:e`); S.rev.add(`${P.id}:${i}:k`); }); render(); break;
    case 'say': speak(P.s[+t.dataset.i].e); break;
    case 'readdone': if (PR.read[P.id]) delete PR.read[P.id]; else PR.read[P.id] = Date.now(); save(); if (PR.read[P.id]) toast('이해 완료로 표시했어요'); else render(); break;
    case 'om': S.om = t.dataset.m; S.G = null; S.sel = null; render(); break;
    case 'ko': G.ko = !G.ko; render(); break;
    case 'again': S.G = null; S.sel = null; render(); break;
    case 'pickcard': {
      if (!G || G.done || !t.matches('[data-drag]')) break;
      const i = +t.dataset.i;
      if (S.sel == null) S.sel = i;
      else if (S.sel === i) S.sel = null;
      else { const from = G.cur.indexOf(S.sel), to = G.cur.indexOf(i); G.cur.splice(from, 1); G.cur.splice(to, 0, S.sel); S.sel = null; G.marks = null; }
      render(); break;
    }
    case 'check-sent': {
      G.tries++; G.marks = G.cur.map((x, p) => x === p + 1);
      if (G.marks.every(Boolean)) { G.done = true; PR.sent[P.id] = Math.min(PR.sent[P.id] || 99, G.tries); save(); }
      S.sel = null; render(); if (G.done) scrollRes(); break;
    }
    case 'check-abc': {
      G.tries++; G.marks = G.cur.map((lb, p) => G.lab[lb] === p);
      if (G.marks.every(Boolean)) { G.done = true; PR.abc[P.id] = true; save(); }
      S.sel = null; render(); if (G.done) scrollRes(); break;
    }
    case 'chip': {
      if (G.state === 'right' || G.state === 'shown') break;
      const id = +t.dataset.i;
      if (t.dataset.w === 'bank') { G.bank = G.bank.filter(x => x !== id); G.ans.push(id); }
      else { G.ans = G.ans.filter(x => x !== id); G.bank.push(id); }
      if (G.state === 'wrong') G.state = 'play';
      wordCheck(); break;
    }
    case 'wreset': G.bank = shuffle(G.pc.map(x => x.id)); G.ans = []; G.state = 'play'; render(); break;
    case 'wshow': G.state = 'shown'; G.ans = G.pc.map(x => x.id); G.bank = []; render(); break;
    case 'wretry': S.G = newWord(P, G.si); render(); break;
    case 'wnext': {
      const solved = PR.word[P.id] || [];
      let n = P.s.findIndex((_, i) => i > G.si && !solved.includes(i)); if (n < 0) n = P.s.findIndex((_, i) => !solved.includes(i));
      if (n < 0) { toast(`${P.id} 단어 배열을 모두 마쳤어요`); n = (G.si + 1) % P.s.length; }
      S.G = newWord(P, n); render(); break;
    }
    case 'wgo': S.G = newWord(P, +t.dataset.i); render(); break;
    case 'im': S.im = t.dataset.m; S.G = null; render(); break;
    case 'iko': G.ko = !G.ko; render(); break;
    case 'gap': chooseGap(+t.dataset.gap); break;
    case 'inext': {
      const solved = PR.ins[P.id] || [];
      if (solved.length >= insTotal(P) && G.state === 'right') toast(`${P.id}의 모든 문장을 제자리에 넣었어요`);
      S.G = newIns(P); if (S.G.t === G.t && insTotal(P) > 1) S.G = newIns(P); render();
      const gv = app.querySelector('.ins-given'); if (gv) gv.scrollIntoView({ block: 'nearest' });
      break;
    }
    case 'iretry': S.G = newIns(P, G.t); render(); break;
    case 'igo': S.G = newIns(P, +t.dataset.i); render(); break;
  }
});

window.addEventListener('hashchange', route);
route();
})();
