/* לאן אוכלים — מפת הגודיס (3/3): account, privacy, feedback, admin. Shares top-level scope with app1/app2. */
'use strict';
const ADMIN_CONTACT = CFG.adminContact || 'מנהלי האפליקציה בארגון';
const fmtDate = d => { const p = il(new Date(d)); return `${p.d}.${p.mo}.${p.ymd.slice(0, 4)}`; };
const pill = (t, cls = '') => `<span class="pill ${cls}">${t}</span>`;
const avOf = u => `<span class="av" style="--c:${esc(u.color || '#e8e1d3')}">${esc(u.avatar || '🙂')}</span>`;

/* ================= privacy ================= */
function openPrivacy() {
  openModal(`${modalHead('פרטיות ואבטחה')}<div class="privacy">
    <h3>מה נשמר</h3><p>שם להצגה (אפשר כינוי), שם משתמש, צוות (לא חובה), אווטאר וצבע. הקוד האישי נשמר מוצפן, וגם מנהלי האפליקציה לא יכולים לראות אותו. לא נשמרים מספר אישי, דרגה, טלפון או מיקום.</p>
    <h3>מה כל המשתמשים רואים</h3><p>שם, אווטאר וצוות; מפגשים פתוחים; דירוגים וטיפים; וסימוני „אכלתי כאן”. מפגש של קבוצה רואים רק חברי הקבוצה, ומפגש בקישור רק מי שקיבל את הקישור.</p>
    <h3>המיקום שלכם</h3><p>נשאר במכשיר ומשמש רק לחישוב מרחקים. בניווט בתוך האפליקציה, נקודת המוצא והיעד נשלחות לשירות המסלולים של OpenStreetMap, בלי שם או פרט מזהה.</p>
    <h3>כמה זמן</h3><p>מפגשים נמחקים 14 יום אחרי המועד. סימוני „אכלתי כאן” נמחקים אחרי 30 יום (החותמות בכרטיסייה נשארות, בלי תאריכים). דירוגים והחשבון נשמרים עד שמוחקים אותם.</p>
    <h3>איפה</h3><p>מסד נתונים בענן (Supabase). אין גישה ישירה לטבלאות, רק דרך הפעולות של האפליקציה.</p>
    <h3>מה לא כותבים</h3><p>שום מידע מסווג, שמות מערכות או פרטים על פעילות. לא בפתקים של מפגשים, לא בטיפים ולא בשמות של קבוצות.</p>
    <h3>מנהלי האפליקציה</h3><p>יכולים לאפס קוד אישי, לחסום משתמש, לבטל מפגש ולהסתיר טיפ לא ראוי.</p>
    <h3>מחיקה</h3><p>בלשונית „אני” ← „מחיקת החשבון”. הכול נמחק מיד.</p>
  </div><button class="btn block" data-act="close-modal">הבנתי</button>`);
}

/* ================= feedback, PIN help, admin code ================= */
function openFeedback() {
  requireLogin(() => openModal(`${modalHead('יש לי הערה')}<form class="form" id="fbForm">
    <label class="field"><span>מה כדאי לתקן, להוסיף או לשפר?</span><textarea id="fbT" maxlength="1000" required placeholder="למשל: חסרה מסעדה, שעות לא נכונות, רעיון לפיצ׳ר"></textarea></label>
    <div class="err" id="formErr"></div><button class="btn primary block" type="submit">${icon('send')}שליחה</button>
    <p class="note" style="margin:0">ההודעה מגיעה למנהלי האפליקציה, עם השם שלכם.</p></form>`));
}
function openForgot() {
  openModal(`${modalHead('שכחתם את הקוד?')}<p style="margin:0 0 10px">פנו אל ${esc(ADMIN_CONTACT)}. תקבלו קוד זמני של 6 ספרות, ובכניסה הבאה תבחרו קוד חדש.</p>
    <div class="form"><button class="btn block" data-act="auth" data-mode="login">חזרה לכניסה</button></div>`);
}
function openClaim() {
  openModal(`${modalHead('קוד ניהול')}<form class="form" id="claimForm">
    <label class="field"><span>הקוד שקיבלתם</span><input class="input ltr" id="clC" autocapitalize="characters" autocomplete="off" required></label>
    <div class="err" id="formErr"></div><button class="btn primary block" type="submit">אישור</button></form>`);
}
function openForcePin(oldPin) {
  openModal(`<div class="modal-head"><h2>קוד אישי חדש</h2></div><form class="form" id="forcePinForm">
    <p style="margin:0">נכנסתם עם קוד זמני. בחרו קוד אישי משלכם.</p>
    <label class="field"><span>קוד חדש</span><input class="input ltr" id="fpN" type="password" inputmode="numeric" autocomplete="new-password" pattern="[0-9]{4,8}" maxlength="8" required><small>4 עד 8 ספרות</small></label>
    <div class="err" id="formErr"></div><button class="btn primary block" type="submit">שמירה</button></form>`);
  $('#forcePinForm').dataset.old = oldPin;
}
function openDeleteAccount() {
  openModal(`${modalHead('מחיקת החשבון')}<form class="form" id="delForm">
    <p style="margin:0">הפרופיל, הדירוגים, הארוחות, המועדפים והחברות בקבוצות יימחקו לצמיתות. מפגשים קרובים שקבעתם יעברו למשתתף הבא. אי אפשר לשחזר.</p>
    <label class="field"><span>הקוד האישי, לאישור</span><input class="input ltr" id="dlP" type="password" inputmode="numeric" autocomplete="current-password" required></label>
    <div class="err" id="formErr"></div>
    <button class="btn primary block" type="submit" style="background:var(--bad);border-color:var(--bad);color:#fff">${icon('trash')}מחיקה לצמיתות</button>
    <button class="btn block" type="button" data-act="close-modal">ביטול</button></form>`);
}

/* ================= admin ================= */
async function loadAdmin() {
  try { S.adm = await call('gd_admin_state'); }
  catch (e) { S.adm = null; toast(errMsg(e)); if (e.message === 'NOT_ADMIN') { S.adminOpen = false; await refresh(); } }
  if (S.tab === 'me' && S.adminOpen) renderView();
}
function openAdmin() { S.adminOpen = true; S.admSec = S.admSec || 'users'; S.adm = null; renderView(); $('#view').scrollTop = 0; loadAdmin(); }
const admUser = id => (S.adm && S.adm.users.find(u => u.id === id)) || { name: 'משתמש שנמחק', avatar: '·', color: '#e8e1d3' };
function invState(i) {
  if (!i.active) return pill('כבוי', 'off');
  if (i.expires && new Date(i.expires) < Date.now()) return pill('פג תוקף', 'bad');
  if (i.max != null && i.uses >= i.max) return pill('נוצל', 'bad');
  return pill('פעיל', 'ok');
}
const inviteUrl = code => appUrl('i-' + code);
const inviteText = code => `הצטרפו ל„לאן אוכלים” — מפת המסעדות של הגודיס, עם מפגשי צהריים של החבר׳ה.\nנכנסים מהקישור, וקוד ההצטרפות כבר ממולא: ${code}`;

function viewAdmin() {
  const head = `<div class="list-head"><button class="icon-btn" data-act="admin-close" aria-label="חזרה">${icon('arrow-right')}</button><h2 style="flex:1">ניהול</h2><button class="icon-btn" data-act="admin-refresh" aria-label="רענון">${icon('refresh')}</button></div>`;
  const a = S.adm;
  if (!a) return `${head}<p class="note">טוען…</p>`;
  const st = a.stats;
  const tiles = [[st.users, 'משתמשים'], [st.active7, 'פעילים השבוע'], [st.new7, 'הצטרפו השבוע'], [st.meetups7, 'מפגשים השבוע'],
    [st.mixed7, 'מפגשים בין צוותים'], [st.roulette7, 'התאמות רולטה'], [st.checkins7, 'ארוחות שסומנו'], [st.feedback_open, 'הערות פתוחות']];
  const secs = [['users', `משתמשים`], ['invites', 'קודים'], ['feedback', `משוב${st.feedback_open ? ` (${st.feedback_open})` : ''}`], ['content', 'תוכן']];
  let body = '';
  if (S.admSec === 'users') {
    body = a.users.map(u => `<div class="gitem adm">${avOf(u)}
      <div><div class="gname">${esc(u.name)} <span class="note" dir="ltr">@${esc(u.username)}</span></div>
        <div class="gsub">${esc(u.team || u.org)} · הצטרפו ${fmtDate(u.since)}${u.seen ? ` · נראו ${ago(u.seen)}` : ''}</div>
        <div class="row" style="gap:4px;margin-top:4px">${u.role === 'admin' ? pill('מנהל', 'ok') : ''}${u.disabled ? pill('חסום', 'bad') : ''}${u.locked ? pill('נעול 15 דק׳', 'warn') : ''}${u.must_change_pin ? pill('קוד זמני', 'warn') : ''}${u.id === S.me.id ? pill('אתם') : ''}</div></div>
      ${u.id === S.me.id ? '<span></span>' : `<button class="btn sm" data-act="adm-user" data-id="${u.id}">פעולות</button>`}</div>`).join('') || '<p class="note">אין עדיין משתמשים.</p>';
  } else if (S.admSec === 'invites') {
    body = `<button class="btn primary block" data-act="adm-inv-new" style="margin-bottom:10px">${icon('plus')}קוד הצטרפות חדש</button>` +
      a.invites.map(i => `<div class="inv">
        <div class="inv-top"><span class="code" style="font-size:16px">${esc(i.code)}</span>${invState(i)}</div>
        <div class="gsub">${esc(i.org)} · ${i.max != null ? `נוצל ${i.uses} מתוך ${i.max}` : `${i.uses} הצטרפו, בלי הגבלה`} · ${i.expires ? `בתוקף עד ${fmtDate(i.expires)}` : 'בלי תאריך תפוגה'}</div>
        <div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="btn sm primary" data-act="adm-inv-share" data-id="${esc(i.code)}">${icon('brand-whatsapp')}שליחה</button><button class="btn sm" data-act="adm-inv-copy" data-id="${esc(i.code)}">${icon('copy')}העתקת קישור</button><button class="btn sm" data-act="adm-inv-edit" data-id="${esc(i.code)}">${icon('pencil')}עריכה</button></div>
      </div>`).join('');
  } else if (S.admSec === 'feedback') {
    body = a.feedback.length ? `<ul class="feed">${a.feedback.map(f => { const u = admUser(f.u); return `<li class="${f.done ? 'done' : ''}">${avOf(u)}<div><b>${esc(u.name)}</b> · <time style="display:inline">${ago(f.at)}</time><p class="fb-body">${esc(f.body)}</p>
        <button class="linkish" data-act="adm-fb" data-id="${f.id}" data-v="${f.done ? '0' : '1'}">${f.done ? 'החזרה לפתוחות' : `${icon('check')}טופל`}</button></div></li>`; }).join('')}</ul>`
      : `<div class="empty">${icon('message-circle')}<h3>אין עדיין הערות</h3><p>הערות שמשתמשים שולחים מ„אני” ← „יש לי הערה” יופיעו כאן.</p></div>`;
  } else {
    const ms = a.meetups, tips = a.tips;
    body = `<div class="section-title" style="margin-top:4px">מפגשים מהשבוע האחרון ומהשבועות הבאים</div>` +
      (ms.length ? ms.map(m => { const r = S.RM.get(m.rid) || {}; const h = admUser(m.host); return `<div class="setting"><div><b>${esc(r.n || 'מסעדה')}</b> ${m.canceled ? pill('בוטל', 'bad') : ''}
        <small>${dayLabel(m.at)} ${hhmm(m.at)} · ${esc(h.name)} · ${m.n} משתתפים · ${{ open: 'פתוח לכולם', group: 'קבוצה', link: 'בקישור' }[m.vis] || ''}${m.note ? ` · „${esc(m.note)}”` : ''}</small></div>
        ${m.canceled ? '' : `<button class="btn sm danger" data-act="adm-meet-cancel" data-id="${m.id}">ביטול</button>`}</div>`; }).join('') : '<p class="note">אין מפגשים.</p>') +
      `<div class="section-title">טיפים אחרונים</div>` +
      (tips.length ? tips.map(t => { const r = S.RM.get(t.r) || {}; const u = admUser(t.u); return `<div class="setting"><div><b>${esc(u.name)}</b> על ${esc(r.n || 'מסעדה')} · ${t.s}★ ${t.hidden ? pill('מוסתר', 'off') : ''}<small>„${esc(t.t)}”</small></div>
        <button class="btn sm" data-act="adm-tip" data-id="${t.u}" data-r="${t.r}" data-v="${t.hidden ? '0' : '1'}">${icon(t.hidden ? 'eye' : 'eye-off')}${t.hidden ? 'החזרה' : 'הסתרה'}</button></div>`; }).join('') : '<p class="note">אין טיפים.</p>');
  }
  return `${head}<div class="adm-stats">${tiles.map(([n, l]) => `<div class="stat"><b class="num">${n}</b><span>${l}</span></div>`).join('')}</div>
    <div class="seg" style="margin:6px 0 12px">${secs.map(([k, l]) => `<button data-act="adm-sec" data-v="${k}" aria-pressed="${S.admSec === k}">${l}</button>`).join('')}</div>${body}`;
}
function openAdmUser(id) {
  const u = admUser(id);
  openModal(`${modalHead(esc(u.name))}<p class="note" style="margin:-6px 0 12px"><span dir="ltr">@${esc(u.username)}</span> · ${esc(u.team || u.org)}</p><div class="form">
    <button class="btn block" data-act="adm-reset" data-id="${id}">${icon('key')}איפוס קוד אישי</button>
    <button class="btn block" data-act="adm-role" data-id="${id}" data-v="${u.role === 'admin' ? 'member' : 'admin'}">${icon('shield-check')}${u.role === 'admin' ? 'הסרת הרשאת ניהול' : 'הפיכה למנהל'}</button>
    <button class="btn block" data-act="adm-disable" data-id="${id}" data-v="${u.disabled ? '0' : '1'}">${icon(u.disabled ? 'lock-open' : 'ban')}${u.disabled ? 'ביטול החסימה' : 'חסימה'}</button>
    <button class="btn block danger" data-act="adm-del" data-id="${id}">${icon('trash')}מחיקת המשתמש</button>
    <p class="note" style="margin:0">חסימה מנתקת את המשתמש ומסתירה אותו מכולם, ואפשר לבטל אותה. מחיקה היא לצמיתות.</p></div>`);
}
function openInvForm(code) {
  const i = code ? S.adm.invites.find(x => x.code === code) : { max: 60, expires: null, active: true };
  const exp = i.expires ? il(new Date(i.expires)).ymd : '';
  openModal(`${modalHead(code ? `עריכת ${esc(code)}` : 'קוד הצטרפות חדש')}<form class="form" id="invForm">
    <label class="field"><span>כמה אנשים יכולים להצטרף</span><input class="input num" id="ivM" type="number" min="1" max="10000" value="${i.max ?? ''}" placeholder="בלי הגבלה"><small>השאירו ריק בשביל בלי הגבלה</small></label>
    <label class="field"><span>בתוקף עד</span><input class="input" id="ivE" type="date" value="${exp}"><small>השאירו ריק בשביל בלי תאריך תפוגה</small></label>
    <div class="field"><span>מצב</span><div class="seg">${[['1', 'פעיל'], ['0', 'כבוי']].map(([k, l]) => `<button type="button" data-act="pick" data-group="ivA" data-v="${k}" aria-pressed="${(i.active ? '1' : '0') === k}">${l}</button>`).join('')}</div></div>
    <div class="err" id="formErr"></div><button class="btn primary block" type="submit">${code ? 'שמירה' : 'יצירת הקוד'}</button></form>`);
  $('#invForm').dataset.code = code || '';
}
async function admDo(fn, args, okMsg) {
  try { const r = await call(fn, args); if (okMsg) toast(okMsg); await loadAdmin(); return r; } catch (e) { toast(errMsg(e)); return null; }
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('הקישור הועתק'); }
  catch {
    openModal(`${modalHead('הקישור')}<input class="input ltr" id="cpT" readonly value="${esc(t)}"><button class="btn block" style="margin-top:10px" data-act="close-modal">סגירה</button>`);
    const i = $('#cpT'); i.focus(); i.select();
  }
}

/* ================= events ================= */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const id = el.dataset.id;
  switch (el.dataset.act) {
    case 'privacy': openPrivacy(); break;
    case 'feedback': openFeedback(); break;
    case 'forgot': openForgot(); break;
    case 'claim': openClaim(); break;
    case 'del-account': openDeleteAccount(); break;
    case 'force-pin-open': openPin(); break;
    case 'admin-open': openAdmin(); break;
    case 'admin-close': S.adminOpen = false; renderView(); break;
    case 'admin-refresh': S.adm = null; renderView(); loadAdmin(); break;
    case 'adm-sec': S.admSec = el.dataset.v; renderView(); break;
    case 'adm-user': openAdmUser(id); break;
    case 'adm-reset': {
      closeModal();
      const r = await admDo('gd_admin_reset_pin', { p_user: id });
      if (r) {
        const u = admUser(id);
        openModal(`${modalHead('קוד זמני')}<p style="margin:0 0 10px">הקוד הזמני של ${esc(u.name)}:</p><p style="text-align:center;margin:0 0 12px"><span class="code" style="font-size:28px;padding:12px 18px">${esc(r.pin)}</span></p>
          <p class="note" style="margin:0 0 12px">שם המשתמש: <span dir="ltr">${esc(u.username)}</span>. בכניסה הבאה הוא יתבקש לבחור קוד חדש. הקוד מוצג רק עכשיו.</p>
          <div class="form"><a class="btn primary block" href="${waUrl(`הקוד הזמני שלך ללאן אוכלים: ${r.pin}\nשם המשתמש: ${u.username}\nבכניסה תתבקש לבחור קוד חדש.\n${location.origin}${location.pathname}`)}" target="_blank" rel="noopener">${icon('brand-whatsapp')}שליחה בווטסאפ</a><button class="btn block" data-act="close-modal">סיום</button></div>`);
      }
      break;
    }
    case 'adm-role': closeModal(); admDo('gd_admin_user_set', { p_user: id, p_disabled: null, p_role: el.dataset.v }, el.dataset.v === 'admin' ? 'נוסף מנהל' : 'הרשאת הניהול הוסרה'); break;
    case 'adm-disable': closeModal(); admDo('gd_admin_user_set', { p_user: id, p_disabled: el.dataset.v === '1', p_role: null }, el.dataset.v === '1' ? 'המשתמש נחסם' : 'החסימה בוטלה'); break;
    case 'adm-del': { const u = admUser(id); confirmBox('למחוק את המשתמש?', `כל הנתונים של ${esc(u.name)} יימחקו לצמיתות. אם רק צריך לעצור גישה, עדיף לחסום.`, 'adm-del-yes', id, 'מחיקה לצמיתות'); break; }
    case 'adm-del-yes': closeModal(); admDo('gd_admin_user_delete', { p_user: id }, 'המשתמש נמחק'); break;
    case 'adm-inv-new': openInvForm(null); break;
    case 'adm-inv-edit': openInvForm(id); break;
    case 'adm-inv-share': share('לאן אוכלים', inviteText(id), inviteUrl(id)); break;
    case 'adm-inv-copy': copyText(inviteUrl(id)); break;
    case 'adm-fb': admDo('gd_admin_feedback_done', { p_id: +id, p_done: el.dataset.v === '1' }); break;
    case 'adm-meet-cancel': confirmBox('לבטל את המפגש?', 'המפגש ייעלם לכל המשתתפים.', 'adm-meet-cancel-yes', id, 'ביטול המפגש'); break;
    case 'adm-meet-cancel-yes': closeModal(); admDo('gd_admin_meetup_cancel', { p_id: id }, 'המפגש בוטל'); break;
    case 'adm-tip': admDo('gd_admin_tip_hide', { p_user: id, p_rid: +el.dataset.r, p_hidden: el.dataset.v === '1' }, el.dataset.v === '1' ? 'הטיפ הוסתר' : 'הטיפ חזר'); break;
    default: break;
  }
});

document.addEventListener('submit', async e => {
  const f = e.target;
  if (!['fbForm', 'claimForm', 'forcePinForm', 'delForm', 'invForm'].includes(f.id)) return;
  e.preventDefault();
  const err = $('#formErr'), btn = f.querySelector('[type="submit"]');
  if (err) err.textContent = '';
  if (btn) btn.disabled = true;
  try {
    if (f.id === 'fbForm') {
      await call('gd_feedback_send', { p_body: $('#fbT').value });
      closeModal(); toast('תודה! ההערה נשלחה');
    } else if (f.id === 'claimForm') {
      await call('gd_admin_claim', { p_code: $('#clC').value });
      closeModal(); await refresh(); setTab('me'); openAdmin(); toast('קיבלתם הרשאת ניהול');
    } else if (f.id === 'forcePinForm') {
      await call('gd_pin_change', { p_old: f.dataset.old, p_new: $('#fpN').value });
      closeModal(); toast('הקוד החדש נשמר'); await refresh();
    } else if (f.id === 'delForm') {
      await call('gd_account_delete', { p_pin: $('#dlP').value });
      closeModal(); dropSession(); S.adminOpen = false; S.tab = 'map'; renderAll(); toast('החשבון נמחק');
    } else if (f.id === 'invForm') {
      const m = $('#ivM').value.trim(), d = $('#ivE').value;
      const r = await call('gd_admin_invite_save', {
        p_code: f.dataset.code, p_max: m ? +m : null,
        p_expires: d ? ilToDate(d, '23:59').toISOString() : null, p_active: (picked('ivA') || '1') === '1',
      });
      closeModal(); toast(f.dataset.code ? 'הקוד עודכן' : `נוצר קוד ${r.code}`); S.admSec = 'invites'; await loadAdmin();
    }
  } catch (ex) { if (err) err.textContent = errMsg(ex); if (btn) btn.disabled = false; }
});
