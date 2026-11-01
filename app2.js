/* לאן אוכלים — מפת הגודיס (2/2): forms, actions, boot. */
'use strict';
/* ================= modals ================= */
function openModal(html, { onClose } = {}) {
  const m = $('#modal'), c = $('#modalCard');
  c.innerHTML = html; m.hidden = false; m._onClose = onClose;
  const first = c.querySelector('input, textarea, select');
  if (first && isDesk()) setTimeout(() => first.focus(), 50);
}
function closeModal() { const m = $('#modal'); m.hidden = true; $('#modalCard').innerHTML = ''; if (m._onClose) { const f = m._onClose; m._onClose = null; f(); } }
const modalHead = t => `<div class="modal-head"><h2>${t}</h2><button class="icon-btn" data-act="close-modal" aria-label="סגירה">${icon('x')}</button></div>`;
function requireLogin(fn) { if (S.me) return fn(); S.after = fn; openAuth('register'); }

function openAuth(mode = 'register') {
  const invite = store.get('invite', '');
  const av = AVATARS[Math.floor(Math.random() * 10)], col = COLORS[Math.floor(Math.random() * COLORS.length)];
  openModal(`${modalHead(mode === 'login' ? 'כניסה' : 'הצטרפות')}
    <div class="seg" style="margin-bottom:14px"><button data-act="auth" data-mode="register" aria-pressed="${mode !== 'login'}">הרשמה</button><button data-act="auth" data-mode="login" aria-pressed="${mode === 'login'}">כניסה</button></div>
    ${mode === 'login' ? `<form class="form" id="loginForm">
        <label class="field"><span>שם משתמש</span><input class="input ltr" id="lu" name="u" autocomplete="username" autocapitalize="none" required></label>
        <label class="field"><span>קוד אישי</span><input class="input ltr" id="lp" name="p" type="password" inputmode="numeric" autocomplete="current-password" pattern="[0-9]{4,8}" required></label>
        <div class="err" id="authErr"></div><button class="btn primary block" type="submit">כניסה</button></form>`
      : `<form class="form" id="regForm">
        <label class="field"><span>קוד הצטרפות</span><input class="input ltr" id="ri" name="i" value="${esc(invite)}" autocapitalize="characters" required><small>קיבלתם אותו מהארגון. בלי קוד אי אפשר להירשם.</small></label>
        <label class="field"><span>שם להצגה</span><input class="input" id="rn" name="n" maxlength="40" autocomplete="name" placeholder="איך החבר׳ה מכירים אתכם" required></label>
        <label class="field"><span>שם משתמש</span><input class="input ltr" id="ru" name="u" maxlength="24" autocomplete="username" autocapitalize="none" placeholder="noa.levi" required><small>לכניסה בפעם הבאה. אותיות, ספרות, נקודה או קו תחתון.</small></label>
        <label class="field"><span>קוד אישי</span><input class="input ltr" id="rp" name="p" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]{4,8}" maxlength="8" required><small>4 עד 8 ספרות. לא קוד שמשמש אתכם במקום אחר.</small></label>
        <label class="field"><span>צוות או מדור <span class="note">(לא חובה)</span></span><input class="input" id="rt" name="t" maxlength="40" placeholder="למשל: CTO"></label>
        <div class="field"><span>אווטאר</span><div class="opts" id="avOpts">${AVATARS.map(a => `<button type="button" class="opt emoji-opt" data-act="pick" data-group="av" data-v="${a}" aria-pressed="${a === av}">${a}</button>`).join('')}</div></div>
        <div class="field"><span>צבע</span><div class="opts" id="colOpts">${COLORS.map(c => `<button type="button" class="color-opt" style="background:${c}" data-act="pick" data-group="col" data-v="${c}" aria-pressed="${c === col}" aria-label="צבע"></button>`).join('')}</div></div>
        <div class="err" id="authErr"></div><button class="btn primary block" type="submit">הרשמה</button>
        <p class="note" style="margin:0">שומרים רק שם, שם משתמש, צוות ואווטאר. בלי מספר אישי, דרגה או טלפון.</p></form>`}
  `);
}
const picked = (group, root = $('#modalCard')) => { const b = root.querySelector(`[data-group="${group}"][aria-pressed="true"]`); return b ? b.dataset.v : null; };
async function afterLogin(res) {
  S.token = res.token; store.set('token', res.token); store.del('invite');
  await refresh();
  closeModal();
  toast(`ברוכים הבאים, ${S.me ? S.me.name.split(' ')[0] : ''}!`);
  const f = S.after; S.after = null;
  if (f) f(); else handleHash();
}

function restaurantPicker(selId, filterOpen = false) {
  const list = S.R.slice().sort((a, b) => a._d - b._d).filter(r => !filterOpen || isOpenNow(r)).slice(0, 40);
  if (selId && !list.some(r => r.id === selId)) list.unshift(S.RM.get(selId));
  return `<div class="field"><span>איפה</span>
    <label class="search" style="height:40px"><span class="sr-only">חיפוש מסעדה</span>${icon('search')}<input id="pickQ" type="search" placeholder="חיפוש מסעדה" autocomplete="off"></label>
    <div class="pick-list" id="pickList">${list.map(r => pickRow(r, r.id === selId)).join('')}</div></div>`;
}
const pickRow = (r, on) => `<button type="button" class="pick" data-act="pick" data-group="rest" data-v="${r.id}" aria-pressed="${on}">${catAv(r, 'xs')}<span>${esc(r.n)}</span><small class="num">${fmtDist(r._d)}</small></button>`;
function audienceOpts(defaultVis) {
  const groups = S.data ? S.data.groups : [];
  const opts = groups.map(g => [`group:${g.id}`, `${icon('lock')}${esc(g.name)}`]).concat([['open', `${icon('world')}פתוח לכולם באפליקציה`], ['link', `${icon('link')}רק מי שמקבל קישור`]]);
  const def = defaultVis || (groups[0] ? `group:${groups[0].id}` : 'open');
  return `<div class="field"><span>מי מוזמן</span><div class="opts">${opts.map(([k, l]) => `<button type="button" class="opt" data-act="pick" data-group="vis" data-v="${k}" aria-pressed="${k === def}">${l}</button>`).join('')}</div></div>`;
}
function openMeetForm(rid) {
  requireLogin(() => {
    const t = il(), nowMin = t.h * 60 + t.m;
    const times = ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00'];
    const defT = times.find(x => { const [a, b] = x.split(':').map(Number); return a * 60 + b - nowMin > 20; }) || '12:30';
    const defDay = times.some(x => { const [a, b] = x.split(':').map(Number); return a * 60 + b - nowMin > 20; }) && t.wd <= 4 ? 'today' : 'tomorrow';
    openModal(`${modalHead('מפגש חדש')}<form class="form" id="meetForm">
      ${restaurantPicker(rid ? +rid : (S.R.slice().sort((a, b) => a._d - b._d)[0] || {}).id)}
      <div class="field"><span>מתי</span>
        <div class="seg">${[['today', 'היום'], ['tomorrow', 'מחר'], ['other', 'תאריך אחר']].map(([k, l]) => `<button type="button" data-act="pick" data-group="day" data-v="${k}" aria-pressed="${k === defDay}">${l}</button>`).join('')}</div>
        <input class="input" type="date" id="mDate" hidden>
        <div class="opts" style="margin-top:4px">${times.map(x => `<button type="button" class="opt num" data-act="pick" data-group="time" data-v="${x}" aria-pressed="${x === defT}">${x}</button>`).join('')}<input class="input num" type="time" id="mTime" aria-label="שעה אחרת" style="width:120px;height:38px"></div></div>
      ${audienceOpts()}
      <div class="field"><span>כמה אנשים לכל היותר</span><div class="opts">${[['', 'בלי הגבלה'], ['2', '2'], ['4', '4'], ['6', '6'], ['10', '10']].map(([k, l]) => `<button type="button" class="opt num" data-act="pick" data-group="max" data-v="${k}" aria-pressed="${k === ''}">${l}</button>`).join('')}</div></div>
      <label class="field"><span>הערה <span class="note">(לא חובה)</span></span><input class="input" id="mNote" maxlength="200" placeholder="למשל: נפגשים בלובי ויוצאים יחד"></label>
      <div class="err" id="formErr"></div>
      <button class="btn primary block" type="submit">${icon('calendar-plus')}קביעת המפגש</button></form>`);
  });
}
function openNow() {
  requireLogin(() => {
    const open = S.R.filter(isOpenNow);
    const sel = (open.length ? open : S.R).slice().sort((a, b) => a._d - b._d)[0];
    openModal(`${modalHead('יוצאים לאכול')}<form class="form" id="nowForm">
      <div class="field"><span>יוצאים בעוד</span><div class="opts">${[['5', 'עכשיו'], ['15', '15 דק׳'], ['30', '30 דק׳'], ['45', '45 דק׳']].map(([k, l]) => `<button type="button" class="opt" data-act="pick" data-group="in" data-v="${k}" aria-pressed="${k === '15'}">${l}</button>`).join('')}</div></div>
      ${restaurantPicker(sel ? sel.id : null, open.length > 0)}
      ${audienceOpts()}
      <label class="field"><span>הערה <span class="note">(לא חובה)</span></span><input class="input" id="nNote" maxlength="200" placeholder="למשל: יוצאים מהשער הראשי"></label>
      <div class="err" id="formErr"></div>
      <button class="btn accent block" type="submit">${icon('bolt')}לעדכן את החבר׳ה</button></form>`);
  });
}
function afterCreate(m) {
  const r = S.RM.get(m.rid);
  openModal(`${modalHead('נקבע!')}
    <p style="margin:0 0 12px">${esc(r ? r.n : '')} · ${dayLabel(m.at)} ב-${hhmm(m.at)}. המפגש כבר מופיע ${m.vis === 'link' ? 'אצל מי שמקבל את הקישור' : 'אצל החבר׳ה באפליקציה'}. רוצים לשלוח גם בווטסאפ?</p>
    <div class="form"><a class="btn primary block" href="${waUrl(meetText(m) + '\n' + appUrl('m-' + m.id))}" target="_blank" rel="noopener">${icon('brand-whatsapp')}שליחה בווטסאפ</a>
    <button class="btn block" data-act="ics" data-id="${m.id}">${icon('calendar-plus')}הוספה ליומן</button>
    <button class="btn ghost block" data-act="close-modal">סיום</button></div>`);
}
function openRate(rid) {
  requireLogin(() => {
    const r = S.RM.get(+rid), tr = teamRate(r.id), mine = tr && tr.tips.find(t => t.u === S.me.id);
    const s0 = mine ? mine.s : 0;
    openModal(`${modalHead('איך היה?')}<form class="form" id="rateForm" data-id="${r.id}">
      <p style="margin:0">${esc(r.n)}</p>
      <div class="opts" role="radiogroup" aria-label="דירוג">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="opt" style="font-size:20px;width:52px;justify-content:center" data-act="pick" data-group="stars" data-v="${i}" aria-pressed="${i === s0}" aria-label="${i} כוכבים">${'★'.repeat(1)}<span class="num" style="font-size:14px">${i}</span></button>`).join('')}</div>
      <label class="field"><span>טיפ לחבר׳ה <span class="note">(לא חובה)</span></span><textarea id="tipT" maxlength="200" placeholder="מה הכי שווה להזמין בגודיס? כמה זמן מחכים?">${esc(mine && mine.t ? mine.t : '')}</textarea></label>
      <div class="err" id="formErr"></div>
      <button class="btn primary block" type="submit">שמירה</button>
      ${mine ? '<button class="btn ghost block danger" type="button" data-act="unrate">מחיקת הדירוג שלי</button>' : ''}</form>`);
  });
}
function openCats() {
  openModal(`${modalHead('סוג אוכל')}<div class="cat-grid">
    <button class="cat-tile" data-act="set-cat" data-v="" aria-pressed="${!S.f.cat}"><span class="cat-av sm" style="--c:var(--ink-3)">${icon('category')}</span>הכל</button>
    ${Object.entries(CATS).map(([k, c]) => { const n = S.R.filter(r => r.cat === k).length; return `<button class="cat-tile" data-act="set-cat" data-v="${k}" aria-pressed="${S.f.cat === k}"><span class="cat-av sm" style="--c:${c.c}">${icon(c.i)}</span>${c.l}<span class="note num">${n}</span></button>`; }).join('')}
  </div>`);
}
function openOrigin() {
  openModal(`${modalHead('נקודת מוצא')}<p style="margin:0 0 12px;color:var(--ink-2)">ממנה מחושבים המרחקים וזמני ההליכה. כרגע: <b>${esc(originLabel())}</b>.</p>
    <div class="form"><button class="btn primary block" data-act="locate-close">${icon('current-location')}המיקום הנוכחי שלי</button>
    <button class="btn block" data-act="pick-base">${icon('flag')}בחירת נקודה במפה (למשל הבסיס)</button>
    <button class="btn ghost block" data-act="default-base">חזרה ל${esc(DEFAULT_ORIGIN.label)}</button></div>`);
}
function openEditProfile() {
  const me = S.me;
  openModal(`${modalHead('הפרופיל שלי')}<form class="form" id="profForm">
    <label class="field"><span>שם להצגה</span><input class="input" id="pn" maxlength="40" value="${esc(me.name)}" required></label>
    <label class="field"><span>צוות או מדור</span><input class="input" id="pt" maxlength="40" value="${esc(me.team || '')}"></label>
    <div class="field"><span>אווטאר</span><div class="opts">${AVATARS.map(a => `<button type="button" class="opt emoji-opt" data-act="pick" data-group="av" data-v="${a}" aria-pressed="${a === me.avatar}">${a}</button>`).join('')}</div></div>
    <div class="field"><span>צבע</span><div class="opts">${COLORS.map(c => `<button type="button" class="color-opt" style="background:${c}" data-act="pick" data-group="col" data-v="${c}" aria-pressed="${c === me.color}" aria-label="צבע"></button>`).join('')}</div></div>
    <div class="err" id="formErr"></div><button class="btn primary block" type="submit">שמירה</button></form>`);
}
function openPin() {
  openModal(`${modalHead('החלפת קוד אישי')}<form class="form" id="pinForm">
    <label class="field"><span>הקוד הנוכחי</span><input class="input ltr" id="po" type="password" inputmode="numeric" autocomplete="current-password" required></label>
    <label class="field"><span>קוד חדש</span><input class="input ltr" id="pw" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]{4,8}" maxlength="8" required><small>4 עד 8 ספרות</small></label>
    <div class="err" id="formErr"></div><button class="btn primary block" type="submit">החלפה</button></form>`);
}
function openNewGroup() {
  openModal(`${modalHead('קבוצה חדשה')}<form class="form" id="groupForm">
    <label class="field"><span>שם הקבוצה</span><input class="input" id="gn" maxlength="40" placeholder="למשל: צהריים של CTO" required></label>
    <div class="field"><span>סמל</span><div class="opts">${GROUP_EMOJI.map((a, i) => `<button type="button" class="opt emoji-opt" data-act="pick" data-group="gem" data-v="${a}" aria-pressed="${i === 0}">${a}</button>`).join('')}</div></div>
    <div class="err" id="formErr"></div><button class="btn primary block" type="submit">פתיחת הקבוצה</button>
    <p class="note" style="margin:0">רק מי שמקבל מכם את הקוד יכול להצטרף ולראות את המפגשים של הקבוצה.</p></form>`);
}
function openJoinGroup(code = '') {
  requireLogin(() => openModal(`${modalHead('הצטרפות לקבוצה')}<form class="form" id="joinForm">
    <label class="field"><span>קוד הקבוצה</span><input class="input ltr" id="jc" maxlength="12" value="${esc(code)}" autocapitalize="characters" required></label>
    <div class="err" id="formErr"></div><button class="btn primary block" type="submit">הצטרפות</button></form>`));
}
async function openMeetLink(id) {
  requireLogin(async () => {
    try {
      const m = await call('gd_meetup_get', { p_id: id });
      const r = S.RM.get(m.rid);
      openModal(`${modalHead('הוזמנתם לצהריים')}${mcard(m)}${r ? `<button class="btn block" data-act="open-r" data-id="${r.id}">${icon('map-pin')}פרטי המסעדה</button>` : ''}`);
    } catch (e) { toast(errMsg(e)); }
  });
}
function confirmBox(title, text, act, id, label) {
  openModal(`${modalHead(title)}<p style="margin:0 0 14px">${text}</p><div class="form"><button class="btn primary block danger" style="background:var(--bad);border-color:var(--bad);color:#fff" data-act="${act}" data-id="${id}">${label}</button><button class="btn block" data-act="close-modal">חזרה</button></div>`);
}

/* ================= actions ================= */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200); }
async function doAct(fn, args, okMsg) {
  try { const r = await call(fn, args); if (okMsg) toast(okMsg); await refresh(); return r; } catch (e) { toast(errMsg(e)); return null; }
}
function setTab(t) {
  S.tab = t;
  if (t === 'meet') store.set('seenMeet', Date.now());
  if (t !== 'map') closeSheet();
  renderTabs(); renderView(); $('#view').scrollTop = 0;
  if (t === 'map' && map) setTimeout(() => map.invalidateSize(), 300);
}
function applyTheme() {
  const t = store.get('theme', 'auto');
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  if (map) setTiles();
}

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) {
    if (e.target.id === 'modal') closeModal();
    return;
  }
  const a = el.dataset.act, id = el.dataset.id;
  switch (a) {
    case 'home': e.preventDefault(); closeSheet(); setTab('map'); break;
    case 'tab': setTab(el.dataset.tab); break;
    case 'filter': {
      const f = el.dataset.f;
      if (f === 'cat') { openCats(); break; }
      if (f.startsWith('kind:')) { const k = f.slice(5); S.f.kind = S.f.kind === k ? null : k; } else S.f[f] = !S.f[f];
      renderChips(); renderView(); drawMarkers(); break;
    }
    case 'set-cat': S.f.cat = el.dataset.v || null; closeModal(); renderChips(); renderView(); drawMarkers(); break;
    case 'clear': S.f = { open: false, walk: false, kind: null, hk: false, fav: false, meet: false, cat: null }; S.q = ''; $('#q').value = ''; renderAll(); break;
    case 'open-r': closeModal(); if (S.tab !== 'map' && !isDesk()) setTab('map'); openRestaurant(id); break;
    case 'close-sheet': closeSheet(); break;
    case 'locate': locate(); break;
    case 'locate-close': closeModal(); locate(); break;
    case 'origin': openOrigin(); break;
    case 'pick-base': closeModal(); closeSheet(); if (S.tab !== 'map') setTab('map'); S.panel = 'peek'; renderTabs(); S.picking = true; toast('הקישו על המפה במקום שממנו יוצאים לאכול'); break;
    case 'default-base': closeModal(); setOrigin(DEFAULT_ORIGIN); $('[data-act="locate"]').classList.remove('on'); frameNearby(); break;
    case 'set-base': map.closePopup(); setOrigin({ lat: +el.dataset.lat, lng: +el.dataset.lng, label: 'הנקודה שבחרת', src: 'custom' }); $('[data-act="locate"]').classList.remove('on'); toast('נקודת המוצא עודכנה'); break;
    case 'now': openNow(); break;
    case 'new-meet': openMeetForm(id); break;
    case 'auth': openAuth(el.dataset.mode || 'register'); break;
    case 'close-modal': closeModal(); break;
    case 'pick': {
      const g = el.dataset.group, root = el.closest('form, .modal-card') || document;
      root.querySelectorAll(`[data-group="${g}"]`).forEach(b => b.setAttribute('aria-pressed', String(b === el)));
      if (g === 'day') { const d = $('#mDate'); d.hidden = el.dataset.v !== 'other'; if (!d.hidden && !d.value) { const t = new Date(Date.now() + 2 * 864e5); d.value = t.toISOString().slice(0, 10); } }
      if (g === 'time') { const t = $('#mTime'); if (t) t.value = ''; }
      break;
    }
    case 'fav': requireLogin(() => doAct('gd_favorite', { p_rid: +id, p_on: !favSet().has(+id) })); break;
    case 'checkin': requireLogin(async () => { const r = await doAct('gd_checkin', { p_rid: +id }); if (r) toast(`נרשם! גילית ${r.visited} מסעדות עד היום`); }); break;
    case 'rate': openRate(id); break;
    case 'unrate': { const rid = +$('#rateForm').dataset.id; closeModal(); doAct('gd_rate', { p_rid: rid, p_stars: null, p_tip: null }, 'הדירוג נמחק'); break; }
    case 'join': requireLogin(async () => { const r = await doAct('gd_meetup_join', { p_id: id }, 'נרשמת למפגש'); if (r && !$('#modal').hidden) closeModal(); }); break;
    case 'leave': {
      const m = upcoming().find(x => x.id === id);
      if (m && m.host === (S.me && S.me.id) && m.people.length > 1) { confirmBox('לצאת מהמפגש?', 'המפגש יישאר פעיל, ומי שהצטרף ראשון יהפוך למארח.', 'leave-yes', id, 'יציאה מהמפגש'); break; }
      if (m && m.host === (S.me && S.me.id)) { confirmBox('לבטל את המפגש?', 'אף אחד אחר עוד לא הצטרף. המפגש יימחק מהרשימה.', 'leave-yes', id, 'ביטול המפגש'); break; }
      doAct('gd_meetup_leave', { p_id: id }, 'הסרנו אותך מהמפגש'); break;
    }
    case 'leave-yes': closeModal(); doAct('gd_meetup_leave', { p_id: id }, 'בוצע'); break;
    case 'share-m': {
      const m = upcoming().find(x => x.id === id) || null;
      if (m) share('צהריים', meetText(m), appUrl('m-' + m.id));
      break;
    }
    case 'ics': { const m = upcoming().find(x => x.id === id); if (m) downloadIcs(m); break; }
    case 'share-r': { const r = S.RM.get(+id); share(r.n, `${r.n} (${r.c}) מכבדים גודיס. ${openState(r).t}`, appUrl('r-' + r.id)); break; }
    case 'roulette': {
      const slot = el.dataset.slot;
      const near = S.R.slice().sort((x, y) => x._d - y._d).filter(r => r.hr && (() => { const [h, mm] = slot.split(':').map(Number); const t = h * 60 + mm; return t >= r.hr[0] && t < r.hr[1] - 20; })()).slice(0, 8).map(r => r.id);
      const res = await doAct('gd_roulette_join', { p_slot: slot, p_candidates: near });
      if (res) toast(res.status === 'matched' ? 'יש התאמה! המפגש מחכה ברשימה' : 'נכנסתם לרולטה. נעדכן כאן כשתהיה התאמה');
      break;
    }
    case 'roulette-leave': doAct('gd_roulette_leave', {}, 'יצאתם מהרולטה'); break;
    case 'new-group': requireLogin(openNewGroup); break;
    case 'join-group': openJoinGroup(); break;
    case 'toggle-group': S.openGroup = S.openGroup === id ? null : id; renderView(); break;
    case 'share-g': { const g = groupById(id); if (g) share(g.name, `מצטרפים לקבוצת „${g.name}” בלאן אוכלים? קוד הקבוצה: ${g.code}`, appUrl('g-' + g.code)); break; }
    case 'leave-group': { const g = groupById(id); confirmBox('לצאת מהקבוצה?', `לא תראו יותר את המפגשים של „${esc(g ? g.name : '')}”. אפשר לחזור עם הקוד.`, 'leave-group-yes', id, 'יציאה מהקבוצה'); break; }
    case 'leave-group-yes': closeModal(); doAct('gd_group_leave', { p_group: id }, 'יצאתם מהקבוצה'); break;
    case 'edit-profile': openEditProfile(); break;
    case 'pin': openPin(); break;
    case 'theme': store.set('theme', el.dataset.v); applyTheme(); renderView(); break;
    case 'logout': try { await rpc('gd_logout', { p_token: S.token }); } catch { /* ignore */ } dropSession(); S.tab = 'map'; renderAll(); toast('יצאת מהחשבון'); break;
    default: break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else if (!$('#sheet').hidden) closeSheet(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.ritem')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.q = e.target.value; if (S.tab !== 'map') setTab('map'); if (S.panel === 'peek') { S.panel = 'half'; renderTabs(); } renderView(); drawMarkers(); }
  if (e.target.id === 'pickQ') {
    const q = norm(e.target.value), cur = picked('rest');
    const list = S.R.filter(r => !q || norm(`${r.n} ${r.c} ${r.a}`).includes(q)).sort((a, b) => a._d - b._d).slice(0, 40);
    $('#pickList').innerHTML = list.map(r => pickRow(r, String(r.id) === cur)).join('') || '<p class="note" style="padding:8px">לא נמצאה מסעדה</p>';
  }
  if (e.target.id === 'mTime' && e.target.value) $('#modalCard').querySelectorAll('[data-group="time"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, err = $('#authErr') || $('#formErr'), btn = f.querySelector('[type="submit"]');
  const busy = on => { if (btn) btn.disabled = on; };
  const fail = ex => { if (err) err.textContent = errMsg(ex); busy(false); };
  if (err) err.textContent = '';
  busy(true);
  try {
    if (f.id === 'loginForm') {
      await afterLogin(await rpc('gd_login', { p_username: $('#lu').value, p_pin: $('#lp').value }));
    } else if (f.id === 'regForm') {
      store.set('invite', $('#ri').value.trim());
      await afterLogin(await rpc('gd_register', { p_invite: $('#ri').value, p_username: $('#ru').value, p_name: $('#rn').value, p_pin: $('#rp').value, p_avatar: picked('av'), p_color: picked('col'), p_team: $('#rt').value }));
    } else if (f.id === 'meetForm' || f.id === 'nowForm') {
      const rid = +picked('rest'); if (!rid) throw new Error('BAD_RESTAURANT');
      const vis = picked('vis') || 'open';
      let at;
      if (f.id === 'nowForm') at = new Date(Date.now() + (+picked('in') || 15) * 60000);
      else {
        const day = picked('day'), time = $('#mTime').value || picked('time') || '12:30';
        let ymd = il().ymd;
        if (day === 'tomorrow') ymd = il(new Date(Date.now() + 864e5)).ymd;
        if (day === 'other') ymd = $('#mDate').value || ymd;
        at = ilToDate(ymd, time);
      }
      const m = await call('gd_meetup_create', {
        p_rid: rid, p_at: at.toISOString(), p_note: (f.id === 'nowForm' ? $('#nNote') : $('#mNote')).value,
        p_max: f.id === 'meetForm' ? (+picked('max') || null) : null,
        p_vis: vis.startsWith('group:') ? 'group' : vis, p_group: vis.startsWith('group:') ? vis.slice(6) : null,
        p_kind: f.id === 'nowForm' ? 'now' : 'planned',
      });
      await refresh(); afterCreate(m);
    } else if (f.id === 'rateForm') {
      const s = +picked('stars'); if (!s) { if (err) err.textContent = 'בחרו כמה כוכבים'; busy(false); return; }
      await call('gd_rate', { p_rid: +f.dataset.id, p_stars: s, p_tip: $('#tipT').value });
      closeModal(); toast('תודה! הדירוג נשמר'); await refresh();
    } else if (f.id === 'profForm') {
      await call('gd_profile_update', { p_name: $('#pn').value, p_avatar: picked('av'), p_color: picked('col'), p_team: $('#pt').value, p_roulette: null });
      closeModal(); toast('הפרופיל עודכן'); await refresh();
    } else if (f.id === 'pinForm') {
      await call('gd_pin_change', { p_old: $('#po').value, p_new: $('#pw').value });
      closeModal(); toast('הקוד האישי הוחלף');
    } else if (f.id === 'groupForm') {
      const g = await call('gd_group_create', { p_name: $('#gn').value, p_emoji: picked('gem') });
      await refresh(); S.openGroup = g.id;
      openModal(`${modalHead('הקבוצה מוכנה')}<p style="margin:0 0 10px">שלחו לחבר׳ה את הקוד או את הקישור:</p><p style="text-align:center;margin:0 0 14px"><span class="code" style="font-size:22px;padding:10px 14px">${esc(g.code)}</span></p>
        <div class="form"><a class="btn primary block" href="${waUrl(`מצטרפים לקבוצה שלי בלאן אוכלים? קוד: ${g.code}\n${appUrl('g-' + g.code)}`)}" target="_blank" rel="noopener">${icon('brand-whatsapp')}שליחה בווטסאפ</a><button class="btn ghost block" data-act="close-modal">סיום</button></div>`);
      if (S.tab !== 'crew') setTab('crew'); else renderView();
    } else if (f.id === 'joinForm') {
      const g = await call('gd_group_join', { p_code: $('#jc').value });
      closeModal(); toast(`הצטרפת ל„${g.name}”`); await refresh(); S.openGroup = g.id; setTab('crew');
    }
  } catch (ex) { fail(ex); return; }
  busy(false);
});
function ilToDate(ymd, time) {
  // Interpret ymd + time as Asia/Jerusalem wall-clock time.
  const [y, mo, d] = ymd.split('-').map(Number), [h, mi] = time.split(':').map(Number);
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const p = il(guess);
  const shown = Date.UTC(+p.ymd.slice(0, 4), +p.ymd.slice(5, 7) - 1, +p.ymd.slice(8, 10), p.h, p.m);
  return new Date(guess.getTime() - (shown - guess.getTime()));
}

/* ----- panel gestures (phones) ----- */
(() => {
  const h = $('#handle'); let y0 = null;
  const order = ['peek', 'half', 'full'];
  const move = dir => { const i = order.indexOf(S.panel); S.panel = order[Math.max(0, Math.min(2, i + dir))]; renderTabs(); setTimeout(() => map && map.invalidateSize(), 300); };
  h.addEventListener('click', () => { if (S.tab !== 'map') return; S.panel = S.panel === 'full' ? 'half' : S.panel === 'half' ? 'full' : 'half'; renderTabs(); });
  const start = ev => { y0 = (ev.touches ? ev.touches[0] : ev).clientY; };
  const end = ev => { if (y0 == null || S.tab !== 'map') return; const y = (ev.changedTouches ? ev.changedTouches[0] : ev).clientY; const d = y - y0; y0 = null; if (Math.abs(d) > 28) { ev.preventDefault(); move(d < 0 ? 1 : -1); } };
  h.addEventListener('touchstart', start, { passive: true }); h.addEventListener('touchend', end);
  const head = $('#panel');
  head.addEventListener('touchstart', ev => { if (ev.target.closest('.list-head')) start(ev); }, { passive: true });
  head.addEventListener('touchend', ev => { if (ev.target.closest('.list-head')) end(ev); });
})();

/* ================= deep links ================= */
function handleHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return;
  if (h.startsWith('r-')) openRestaurant(h.slice(2));
  else if (h.startsWith('m-')) openMeetLink(h.slice(2));
  else if (h.startsWith('g-')) { const code = h.slice(2); history.replaceState(null, '', location.pathname); openJoinGroup(code); }
  else if (h.startsWith('i-')) { store.set('invite', h.slice(2)); history.replaceState(null, '', location.pathname); if (!S.me) openAuth('register'); }
}
window.addEventListener('hashchange', handleHash);

/* ================= boot ================= */
async function boot() {
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (store.get('theme', 'auto') === 'auto' && map) setTiles(); });
  S.origin = store.get('origin', null) || DEFAULT_ORIGIN;
  try {
    S.R = await (await fetch('restaurants.json', { cache: 'no-cache' })).json();
  } catch { S.R = []; toast('לא הצלחנו לטעון את רשימת המסעדות. רעננו את הדף'); }
  S.R.forEach(r => { S.RM.set(r.id, r); r._d = dist(S.origin, r); });
  initMap(); drawOrigin();
  renderAll();
  if (!location.hash.startsWith('#r-')) setTimeout(() => frameNearby(), 50);
  if (S.token) await refresh();
  handleHash();
  try {
    if (navigator.permissions) {
      const p = await navigator.permissions.query({ name: 'geolocation' });
      if (p.state === 'granted') locate({ quiet: true });
    }
  } catch { /* permissions API unsupported */ }
  setInterval(() => { if (document.visibilityState === 'visible' && S.token) refresh(); }, 45000);
  setInterval(() => { if (document.visibilityState === 'visible') { renderView(); } }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.token) refresh(); });
  window.addEventListener('resize', () => map && map.invalidateSize());
}
boot();
