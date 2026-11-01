/* לאן אוכלים — מפת הגודיס (1/2): data, map, views. Classic scripts share top-level scope. */
'use strict';
const CFG = window.GD_CONFIG;
const IC = window.IC || {};
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n, cls = '') => `<svg class="ic${n.endsWith('-f') ? ' f' : ''}${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const store = {
  get(k, d) { try { const v = localStorage.getItem('gd.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('gd.' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem('gd.' + k); } catch { /* storage unavailable */ } },
};
const isDesk = () => matchMedia('(min-width: 900px)').matches;
const LIST_DATE = '18.10.26';

const CATS = {
  hummus:    { l: 'חומוס',            i: 'bowl-spoon',      c: '#b8892f' },
  shawarma:  { l: 'שווארמה',          i: 'flame',           c: '#c0482f' },
  pita:      { l: 'פלאפל וסביח',      i: 'bread',           c: '#55853a' },
  burger:    { l: 'המבורגר',          i: 'burger',          c: '#d0861a' },
  schnitzel: { l: 'שניצל',            i: 'tools-kitchen-2', c: '#b97c18' },
  grill:     { l: 'על האש',           i: 'grill',           c: '#9b3326' },
  chicken:   { l: 'עוף מטוגן',        i: 'meat',            c: '#d66a22' },
  pizza:     { l: 'פיצה ואיטלקי',     i: 'pizza',           c: '#d2432b' },
  asian:     { l: 'אסייתי',           i: 'bowl-chopsticks', c: '#1f8174' },
  sandwich:  { l: 'כריכים ובאגטים',   i: 'baguette',        c: '#a07a45' },
  cafe:      { l: 'בית קפה וחלבי',    i: 'coffee',          c: '#6b4a38' },
  healthy:   { l: 'בריא וסלטים',      i: 'salad',           c: '#36845a' },
  home:      { l: 'אוכל ביתי',        i: 'chef-hat',        c: '#556629' },
};
const KIND = { 'בשרי': 'meat', 'חלבי': 'dairy' };
const AVATARS = ['🙂', '😎', '🦊', '🐻', '🦁', '🐯', '🐼', '🦉', '🐙', '🚀', '🛰️', '⭐', '🌶️', '🍕', '🥙', '🍔', '🧆', '☕'];
const COLORS = ['#d9e6c3', '#fde3a7', '#ffd0c2', '#cfe0ff', '#e3d4ff', '#c9efe5', '#f6d1e6', '#e8e1d3'];
const GROUP_EMOJI = ['🍽️', '🥙', '🍔', '🧆', '🍕', '🍣', '☕', '🛰️', '🚀', '💻', '🎯', '🔥'];
const SLOTS = ['12:00', '12:30', '13:00', '13:30'];

const S = {
  R: [], RM: new Map(),
  tab: 'map', panel: 'half', q: '',
  f: { open: false, walk: false, kind: null, hk: false, fav: false, meet: false, cat: null },
  origin: null,
  token: store.get('token', null),
  data: null, me: null, people: new Map(),
  agg: new Map(), meetBy: new Map(),
  sel: null, after: null, google: {}, openGroup: null,
};

/* ================= time ================= */
const TZ = 'Asia/Jerusalem';
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
function il(d = new Date()) {
  const o = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour12: false, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(d).forEach(p => { o[p.type] = p.value; });
  return { wd: WD.indexOf(o.weekday), h: (+o.hour) % 24, m: +o.minute, ymd: `${o.year}-${o.month}-${o.day}`, d: +o.day, mo: +o.month };
}
const pad = n => String(n).padStart(2, '0');
const fmtMin = x => { x = ((x % 1440) + 1440) % 1440; return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`; };
const hhmm = d => { const p = il(new Date(d)); return `${pad(p.h)}:${pad(p.m)}`; };
function dayLabel(d) {
  const p = il(new Date(d)), t = il(), tm = il(new Date(Date.now() + 864e5));
  if (p.ymd === t.ymd) return 'היום';
  if (p.ymd === tm.ymd) return 'מחר';
  return `יום ${WD_HE[p.wd]} ${p.d}.${p.mo}`;
}
function ago(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 90) return 'עכשיו';
  if (s < 3600) return `לפני ${Math.round(s / 60)} דק׳`;
  if (s < 7200) return 'לפני שעה';
  if (s < 86400) return `לפני ${Math.round(s / 3600)} שעות`;
  if (s < 172800) return 'אתמול';
  return `לפני ${Math.round(s / 86400)} ימים`;
}
function until(d) {
  const m = Math.round((new Date(d) - Date.now()) / 60000);
  if (m < -5) return 'כבר התחיל';
  if (m <= 1) return 'עכשיו';
  if (m < 60) return `בעוד ${m} דק׳`;
  if (m < 120) return 'בעוד שעה';
  return '';
}
/* Opening state from the Goodi's list hours (weekday hours). */
function openState(r) {
  if (!r.hr) return { s: 'unknown', t: 'שעות לפי הסניף' };
  const { wd, h, m } = il();
  if (wd === 5) return { s: 'unknown', t: 'שישי: שעות משתנות' };
  if (wd === 6) return { s: 'unknown', t: 'שבת: כנראה סגור' };
  const now = h * 60 + m, [o, c] = r.hr;
  const isOpen = (now >= o && now < c) || (c > 1440 && now < c - 1440);
  if (isOpen) {
    const left = now >= o ? c - now : c - 1440 - now;
    return left <= 30 ? { s: 'closing', t: `נסגר בעוד ${left} דק׳` } : { s: 'open', t: `פתוח עד ${fmtMin(c)}` };
  }
  return now < o ? { s: 'closed', t: `נפתח ב-${fmtMin(o)}` } : { s: 'closed', t: 'סגור להיום' };
}
const isOpenNow = r => ['open', 'closing'].includes(openState(r).s);

/* ================= geo ================= */
function dist(a, b) {
  const R = 6371000, t = Math.PI / 180, dLat = (b.lat - a.lat) * t, dLng = (b.lng - a.lng) * t;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const fmtDist = m => m < 1000 ? `${Math.round(m / 10) * 10} מ׳` : m < 10000 ? `${(m / 1000).toFixed(1)} ק״מ` : `${Math.round(m / 1000)} ק״מ`;
const walkMin = m => Math.max(1, Math.round(m * 1.3 / 80));
const DEFAULT_ORIGIN = { lat: CFG.origin.lat, lng: CFG.origin.lng, label: CFG.origin.label, src: 'default' };
function setOrigin(o, { save = true } = {}) {
  S.origin = o;
  if (save) { if (o.src === 'custom') store.set('origin', o); else if (o.src === 'default') store.del('origin'); }
  S.R.forEach(r => { r._d = dist(S.origin, r); });
  drawOrigin();
  renderAll();
}
const originLabel = () => S.origin.src === 'gps' ? 'המיקום שלך' : S.origin.src === 'custom' ? 'הנקודה שבחרת' : S.origin.label;

/* ================= API ================= */
const ERR = {
  BAD_INVITE: 'קוד ההצטרפות לא נכון. בדקו מול מי ששלח לכם אותו', INVITE_FULL: 'קוד ההצטרפות כבר נוצל עד הסוף',
  BAD_USERNAME: 'שם משתמש: 3–24 תווים — אותיות, ספרות, נקודה או קו תחתון', BAD_PIN: 'הקוד האישי צריך להיות 4 עד 8 ספרות',
  BAD_NAME: 'השם צריך להיות באורך 2–40 תווים', USERNAME_TAKEN: 'שם המשתמש הזה תפוס. נסו שם אחר',
  BAD_LOGIN: 'שם המשתמש או הקוד האישי לא נכונים', LOCKED: 'יותר מדי ניסיונות. אפשר לנסות שוב בעוד 15 דקות',
  AUTH: 'החיבור פג. צריך להתחבר שוב', NOT_FOUND: 'המפגש לא נמצא או שבוטל', FULL: 'המפגש כבר מלא', PAST: 'המפגש כבר עבר',
  BAD_TIME: 'בחרו שעה מהיום ועד חודש קדימה', NOT_IN_GROUP: 'אתם לא חברים בקבוצה הזאת', BAD_GROUP_CODE: 'לא מצאנו קבוצה עם הקוד הזה',
  TOO_MANY: 'הגעתם למגבלה היומית. נסו שוב מחר', SLOT_PASSED: 'השעה הזאת כבר קרובה מדי. בחרו שעה מאוחרת יותר',
  NOT_HOST: 'רק מי שקבע את המפגש יכול לבטל אותו', NETWORK: 'אין חיבור לשרת. בדקו את האינטרנט ונסו שוב',
  NEED_LOGIN: 'צריך להתחבר קודם', BAD_RESTAURANT: 'בחרו מסעדה',
};
const errMsg = e => ERR[e && e.message] || ERR.NETWORK;
async function rpc(fn, args = {}) {
  let res;
  try {
    res = await fetch(`${CFG.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST', headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify(args),
    });
  } catch { throw new Error('NETWORK'); }
  let body = null;
  try { body = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const code = (body && body.message) || 'NETWORK';
    if (code === 'AUTH') dropSession();
    throw new Error(ERR[code] ? code : 'NETWORK');
  }
  if (body && body.error) { const e = new Error(body.error); e.data = body; throw e; }
  return body;
}
const call = (fn, args = {}) => { if (!S.token) return Promise.reject(new Error('NEED_LOGIN')); return rpc(fn, { p_token: S.token, ...args }); };
function dropSession() {
  S.token = null; S.data = null; S.me = null; store.del('token');
}
async function refresh() {
  if (!S.token) { S.data = null; S.me = null; buildAgg(); renderAll(); return; }
  try {
    const d = await call('gd_state');
    S.data = d; S.me = d.me;
    S.people = new Map((d.people || []).map(p => [p.id, p]));
    buildAgg();
    renderAll();
  } catch (e) {
    if (e.message === 'AUTH') { renderAll(); toast(ERR.AUTH); }
  }
}
function buildAgg() {
  S.agg = new Map(); S.meetBy = new Map();
  if (!S.data) return;
  for (const t of S.data.tips || []) {
    const a = S.agg.get(t.r) || { sum: 0, n: 0, tips: [] };
    a.sum += t.s; a.n++; a.tips.push(t); S.agg.set(t.r, a);
  }
  for (const m of upcoming()) {
    const list = S.meetBy.get(m.rid) || []; list.push(m); S.meetBy.set(m.rid, list);
  }
}
const upcoming = () => (S.data ? S.data.meetups || [] : []).filter(m => new Date(m.at) > Date.now() - 90 * 60000);
const favSet = () => new Set(S.data ? S.data.favorites || [] : []);
const visitedSet = () => new Set(S.data ? S.data.visited || [] : []);
const person = id => S.people.get(id) || { name: 'משתמש', avatar: '🙂', color: '#e8e1d3' };
const avatar = (id, cls = '') => { const p = person(id); return `<span class="av ${cls}" style="--c:${esc(p.color)}" title="${esc(p.name)}">${esc(p.avatar)}</span>`; };
const stackHtml = (ids, max = 5) => `<span class="stack">${ids.slice(0, max).map(id => avatar(id, 'sm')).join('')}${ids.length > max ? `<span class="more">+${ids.length - max}</span>` : ''}</span>`;
const firstName = id => (person(id).name || '').split(' ')[0];
const groupById = id => (S.data ? S.data.groups : []).find(g => g.id === id);

/* ================= links ================= */
const appUrl = h => `${location.origin}${location.pathname}#${h}`;
const gPlaceUrl = r => r.pid
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.n} ${r.c}`)}&query_place_id=${r.pid}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.n} ${r.a} ${r.c}`)}`;
const gDirUrl = r => `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}${r.pid ? `&destination_place_id=${r.pid}` : ''}`;
const wazeUrl = r => `https://waze.com/ul?ll=${r.lat}%2C${r.lng}&navigate=yes`;
const waUrl = text => `https://wa.me/?text=${encodeURIComponent(text)}`;
async function share(title, text, url) {
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  window.open(waUrl(`${text}\n${url}`), '_blank', 'noopener');
}
function meetText(m) {
  const r = S.RM.get(m.rid);
  return `🍽️ צהריים ב${r ? r.n : 'מסעדה'}${r ? ` (${r.c})` : ''}\n${dayLabel(m.at)} ב-${hhmm(m.at)}${m.note ? `\n${m.note}` : ''}\nמי בא? מצטרפים כאן:`;
}
function downloadIcs(m) {
  const r = S.RM.get(m.rid) || { n: 'מסעדה', a: '', c: '' };
  const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const e = s => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const start = new Date(m.at), end = new Date(start.getTime() + 3600e3);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//lan-ochlim//HE', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${m.id}@lan-ochlim`,
    `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:${e('צהריים ב' + r.n)}`,
    `LOCATION:${e(`${r.a}, ${r.c}`)}`, `DESCRIPTION:${e(`${m.note ? m.note + '\n' : ''}${appUrl('m-' + m.id)}`)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', `DESCRIPTION:${e('יוצאים לאכול ב' + r.n)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  a.download = 'lunch.ics'; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

/* ================= map ================= */
let map, cluster, tiles, originMarker, gAttr = '';
const markers = new Map();
function darkMode() {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
function initMap() {
  if (window.maplibregl && maplibregl.getRTLTextPluginStatus && maplibregl.getRTLTextPluginStatus() === 'unavailable') {
    try { const pr = maplibregl.setRTLTextPlugin('https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js', false); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { console.warn(e); }
  }
  map = L.map('map', { zoomControl: false, attributionControl: true, tapTolerance: 20, zoomSnap: 0.5, minZoom: 7, maxZoom: 19 })
    .setView([S.origin.lat, S.origin.lng], 14);
  map.attributionControl.setPrefix(false);
  map.attributionControl.setPosition('bottomleft');
  if (isDesk()) L.control.zoom({ position: 'topleft', zoomInTitle: 'התקרבות', zoomOutTitle: 'התרחקות' }).addTo(map);
  setTiles();
  cluster = L.markerClusterGroup({
    maxClusterRadius: 42, disableClusteringAtZoom: 14, showCoverageOnHover: false, spiderfyOnMaxZoom: true,
    iconCreateFunction: c => L.divIcon({ html: `<div class="cluster">${c.getChildCount()}</div>`, className: 'pin-wrap', iconSize: [44, 44] }),
  });
  map.addLayer(cluster);
  map.on('contextmenu', e => askBase(e.latlng));
  map.on('click', e => {
    if (S.picking) {
      S.picking = false;
      setOrigin({ lat: e.latlng.lat, lng: e.latlng.lng, label: 'הנקודה שבחרת', src: 'custom' });
      $('[data-act="locate"]').classList.remove('on');
      toast('נקודת המוצא עודכנה');
      frameNearby();
      return;
    }
    if (!$('#sheet').hidden) closeSheet();
  });
}
async function setTiles() {
  const seq = S.styleSeq = (S.styleSeq || 0) + 1;
  if (tiles) { map.removeLayer(tiles); tiles = null; }
  if (gAttr) { map.attributionControl.removeAttribution(gAttr); gAttr = ''; }
  if (CFG.googleKey) {
    try {
      const res = await fetch(`https://tile.googleapis.com/v1/createSession?key=${CFG.googleKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapType: 'roadmap', language: 'he-IL', region: 'IL' }),
      });
      if (!res.ok) throw new Error('tiles ' + res.status);
      const { session } = await res.json();
      tiles = L.tileLayer(`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${session}&key=${CFG.googleKey}`, { maxZoom: 21, tileSize: 256 }).addTo(map);
      const upd = async () => {
        try {
          const b = map.getBounds();
          const q = `session=${session}&key=${CFG.googleKey}&zoom=${Math.round(map.getZoom())}&north=${b.getNorth()}&south=${b.getSouth()}&east=${b.getEast()}&west=${b.getWest()}`;
          const v = await (await fetch(`https://tile.googleapis.com/tile/v1/viewport?${q}`)).json();
          const txt = `Google${v.copyright ? ' · ' + esc(v.copyright) : ''}`;
          if (gAttr) map.attributionControl.removeAttribution(gAttr);
          gAttr = txt; map.attributionControl.addAttribution(gAttr);
        } catch { /* keep previous attribution */ }
      };
      map.on('moveend', upd); upd();
      return;
    } catch (e) { console.warn('Google tiles unavailable, using open map', e); }
  }
  try {
    const name = darkMode() ? 'dark' : 'positron';
    const style = await (await fetch(`https://tiles.openfreemap.org/styles/${name}`)).json();
    const label = ['coalesce', ['get', 'name:he'], ['get', 'name'], ['get', 'name_en']];
    style.layers.forEach(l => { if (l.layout && l.layout['text-field']) l.layout['text-field'] = label; });
    style.layers = style.layers.filter(l => !/shield|highway-name-major|poi/.test(l.id));
    if (S.styleSeq !== seq) return;
    tiles = L.maplibreGL({
      style, interactive: false,
      attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);
  } catch (e) {
    console.warn('map style failed', e);
    toast('המפה לא נטענה. בדקו את החיבור ורעננו');
  }
}
function pinIcon(r) {
  const cat = CATS[r.cat], st = openState(r).s, mc = (S.meetBy.get(r.id) || []).length;
  const cls = ['pin', KIND[r.k] || '', st === 'closed' ? 'closed' : '', S.sel === r.id ? 'sel' : ''].join(' ');
  return L.divIcon({
    className: 'pin-wrap', iconSize: [38, 38], iconAnchor: [19, 46],
    html: `<div class="${cls}" style="--c:${cat.c}">${icon(cat.i)}${mc ? `<span class="mcount">${mc}</span>` : ''}</div>`,
  });
}
function drawMarkers() {
  if (!map) return;
  const list = filtered();
  cluster.clearLayers(); markers.clear();
  const layers = list.map(r => {
    const mk = L.marker([r.lat, r.lng], { icon: pinIcon(r), title: r.n, riseOnHover: true, keyboard: true, zIndexOffset: S.sel === r.id ? 1000 : 0 });
    mk.on('click', () => openRestaurant(r.id));
    markers.set(r.id, mk);
    return mk;
  });
  cluster.addLayers(layers);
}
function drawOrigin() {
  if (!map) return;
  if (originMarker) { map.removeLayer(originMarker); originMarker = null; }
  if (S.origin.src === 'gps') {
    originMarker = L.marker([S.origin.lat, S.origin.lng], { icon: L.divIcon({ className: 'pin-wrap', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), interactive: false, keyboard: false }).addTo(map);
  } else if (S.origin.src === 'custom') {
    originMarker = L.marker([S.origin.lat, S.origin.lng], { icon: L.divIcon({ className: 'pin-wrap', html: `<div class="base-dot">${icon('flag')}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }), title: 'נקודת המוצא שלך', keyboard: false }).addTo(map);
  }
}
function frameNearby(n = 8) {
  if (!map || !S.R.length) return;
  const pts = S.R.slice().sort((a, b) => a._d - b._d).slice(0, n).map(r => [r.lat, r.lng]);
  pts.push([S.origin.lat, S.origin.lng]);
  const desk = isDesk();
  const panelH = desk ? 0 : ($('#panel').getBoundingClientRect().height || 300) + 70;
  map.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [28, desk ? 48 : 130], paddingBottomRight: [28, desk ? 48 : panelH + 16], maxZoom: 16, animate: true });
}
function flyToVisible(r) {
  const z = Math.max(map.getZoom(), 16);
  const p = map.project([r.lat, r.lng], z);
  const size = map.getSize();
  if (isDesk()) p.x += Math.min(220, size.x * 0.25);
  else p.y += size.y * 0.27;
  map.flyTo(map.unproject(p, z), z, { duration: 0.6 });
}
function askBase(latlng) {
  L.popup({ closeButton: true, autoPan: true })
    .setLatLng(latlng)
    .setContent(`<div style="display:grid;gap:8px;min-width:190px"><b>נקודת מוצא חדשה?</b><span style="color:var(--ink-3);font-size:13px">המרחקים וזמני ההליכה יחושבו מכאן.</span><button class="btn primary sm" data-act="set-base" data-lat="${latlng.lat}" data-lng="${latlng.lng}">${icon('flag')}קבע כאן</button></div>`)
    .openOn(map);
}
function locate({ quiet = false } = {}) {
  if (!navigator.geolocation) { if (!quiet) toast('הדפדפן לא תומך במיקום'); return; }
  const btn = $('[data-act="locate"]');
  navigator.geolocation.getCurrentPosition(pos => {
    setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'המיקום שלך', src: 'gps' }, { save: false });
    btn && btn.classList.add('on');
    frameNearby();
  }, () => { if (!quiet) toast('לא הצלחנו לקבל מיקום. אפשר לבחור נקודת מוצא בלחיצה ארוכה על המפה'); }, { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 });
}

/* ================= filtering ================= */
const norm = s => String(s || '').toLowerCase().replace(/[׳'"״`\-]/g, '').replace(/\s+/g, ' ').trim();
function filtered() {
  const q = norm(S.q), f = S.f, fav = favSet();
  return S.R.filter(r => {
    if (f.open && !isOpenNow(r)) return false;
    if (f.walk && r._d > 1600) return false;
    if (f.kind && r.k !== f.kind) return false;
    if (f.hk && !r.hk) return false;
    if (f.fav && !fav.has(r.id)) return false;
    if (f.meet && !(S.meetBy.get(r.id) || []).length) return false;
    if (f.cat && r.cat !== f.cat) return false;
    if (q && !norm(`${r.n} ${r.c} ${r.a} ${CATS[r.cat].l}`).includes(q)) return false;
    return true;
  }).sort((a, b) => a._d - b._d);
}

/* ================= rendering ================= */
const TABS = [['map', 'מסעדות', 'map'], ['meet', 'מפגשים', 'calendar-event'], ['crew', 'החבר׳ה', 'users-group'], ['me', 'אני', 'user']];
function renderAll() {
  renderTop(); renderChips(); renderTabs(); renderView(); drawMarkers();
  if (S.sel && !$('#sheet').hidden) renderSheet();
}
function renderTop() {
  const b = $('#meBtn');
  b.innerHTML = S.me ? `<span class="av" style="--c:${esc(S.me.color)}">${esc(S.me.avatar)}</span>` : icon('user');
  b.setAttribute('aria-label', S.me ? `הפרופיל של ${S.me.name}` : 'התחברות');
  $('[data-act="locate"]').innerHTML = icon('current-location');
  $('#fab .fab-ic').innerHTML = icon('bolt');
}
function renderChips() {
  const f = S.f;
  const items = [
    ['open', `${icon('clock')}פתוח עכשיו`, f.open],
    ['walk', `${icon('walk')}במרחק הליכה`, f.walk],
    ['cat', `${f.cat ? icon(CATS[f.cat].i) + CATS[f.cat].l : icon('category') + 'סוג אוכל'}${icon('chevron-down')}`, !!f.cat],
    ['kind:בשרי', '<span class="dot" style="background:var(--meat)"></span>בשרי', f.kind === 'בשרי'],
    ['kind:חלבי', '<span class="dot" style="background:var(--dairy)"></span>חלבי', f.kind === 'חלבי'],
    ['hk', `${icon('circle-check')}כשרות גבוהה`, f.hk],
  ];
  if (S.me) items.push(['meet', `${icon('users')}יש מפגש`, f.meet], ['fav', `${icon('heart')}מועדפים`, f.fav]);
  $('#chips').innerHTML = items.map(([k, l, on]) => `<button class="chip" data-act="filter" data-f="${k}" aria-pressed="${on}">${l}</button>`).join('');
}
function renderTabs() {
  const seen = store.get('seenMeet', 0);
  const fresh = upcoming().filter(m => S.me && m.host !== S.me.id && new Date(m.created) > seen && !m.people.includes(S.me.id)).length;
  $('#tabs').innerHTML = TABS.map(([k, l, i]) => `<button class="tab" data-act="tab" data-tab="${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${icon(i)}<span>${l}</span>${k === 'meet' && fresh && S.tab !== 'meet' ? `<span class="badge">${fresh}</span>` : ''}</button>`).join('');
  document.body.classList.toggle('tab-other', S.tab !== 'map');
  const st = S.tab === 'map' ? S.panel : 'full';
  $('#panel').dataset.state = st;
  document.body.dataset.panel = st;
}
function renderView() {
  const v = $('#view');
  const html = S.tab === 'map' ? viewList() : S.tab === 'meet' ? viewMeet() : S.tab === 'crew' ? viewCrew() : viewMe();
  v.innerHTML = html;
}
function catAv(r, cls = '') { const c = CATS[r.cat]; return `<span class="cat-av ${cls}" style="--c:${c.c}" aria-hidden="true">${icon(c.i)}</span>`; }
function teamRate(id) { const a = S.agg.get(id); return a ? { avg: a.sum / a.n, n: a.n, tips: a.tips } : null; }
function tagsHtml(r) {
  const st = openState(r), tr = teamRate(r.id), mc = (S.meetBy.get(r.id) || []).length;
  return `<span class="st ${st.s}">${st.t}</span>${KIND[r.k] ? `<span class="kind ${KIND[r.k]}">${r.k}</span>` : ''}${r.hk ? `<span class="hk">${icon('circle-check')}כשרות גבוהה</span>` : ''}${tr ? `<span class="team-rate">${icon('star-f')}${tr.avg.toFixed(1)}</span>` : ''}${mc ? `<span class="mbadge">${icon('users')}${mc === 1 ? 'מפגש' : `${mc} מפגשים`}</span>` : ''}`;
}
function distHtml(r) {
  const w = walkMin(r._d);
  return w <= 35 ? `<b class="num">${w}</b>דק׳ הליכה` : `<b class="num">${r._d < 10000 ? (r._d / 1000).toFixed(1) : Math.round(r._d / 1000)}</b>ק״מ`;
}
function ritem(r) {
  return `<li class="ritem" data-act="open-r" data-id="${r.id}" tabindex="0" role="button" aria-label="${esc(r.n)}">
    ${catAv(r)}
    <div><div class="rname">${esc(r.n)}</div><div class="rmeta">${CATS[r.cat].l} · ${esc(r.a ? r.a + ', ' : '')}${esc(r.c)}</div><div class="rtags">${tagsHtml(r)}</div></div>
    <div class="rdist">${distHtml(r)}</div></li>`;
}
function viewList() {
  const list = filtered();
  const any = Object.values(S.f).some(Boolean) || S.q;
  const head = `<div class="list-head"><div><h2>${list.length ? `${list.length} מקומות עם גודיס` : 'לא מצאנו מקומות'}</h2>
    <div class="sub">לפי מרחק מ${esc(originLabel())} · <button class="linkish" data-act="origin">שינוי</button></div></div>
    ${any ? `<button class="linkish" data-act="clear">${icon('x')}ניקוי</button>` : ''}</div>`;
  if (!list.length) {
    return head + `<div class="empty">${icon('search')}<h3>אין תוצאות לסינון הזה</h3><p>נסו להסיר חלק מהמסננים או לחפש שם אחר.</p><button class="btn" data-act="clear">ניקוי הסינון</button></div>`;
  }
  const nudge = !S.me ? `<div class="card tint" style="margin-bottom:6px"><div class="row"><div class="grow"><b>אוכלים ביחד?</b><div class="note">הצטרפו כדי לקבוע מפגשי צהריים ולראות מה החבר׳ה ממליצים.</div></div><button class="btn sm primary" data-act="auth">הצטרפות</button></div></div>` : '';
  return head + nudge + `<ul class="rlist">${list.map(ritem).join('')}</ul>
    <p class="note" style="text-align:center;margin-top:16px">הרשימה לפי רשימת המסעדות שמכבדות גודיס, מעודכנת ל-${LIST_DATE}. שעות הפתיחה לימים א׳–ה׳.</p>`;
}

/* ----- restaurant sheet ----- */
function openRestaurant(id, { fly = true } = {}) {
  const r = S.RM.get(+id);
  if (!r) return;
  S.sel = r.id;
  const sh = $('#sheet');
  renderSheet();
  sh.hidden = false; sh.scrollTop = 0;
  document.body.classList.add('sheet-open');
  drawMarkers();
  if (fly && map) flyToVisible(r);
  history.replaceState(null, '', `#r-${r.id}`);
  if (CFG.googleKey && r.pid) loadGoogle(r);
}
function closeSheet() {
  $('#sheet').hidden = true; document.body.classList.remove('sheet-open');
  S.sel = null; drawMarkers();
  if (location.hash) history.replaceState(null, '', location.pathname);
}
function renderSheet() {
  const r = S.RM.get(S.sel);
  if (!r) return;
  const c = CATS[r.cat], st = openState(r), fav = favSet().has(r.id), g = r.pid ? S.google[r.pid] : null;
  const photos = g && g.photos && g.photos.length ? g.photos.slice(0, 6) : null;
  const art = Array.from({ length: 24 }, () => icon(c.i)).join('');
  const hero = photos
    ? `<div class="hero photos"><div class="photos-strip">${photos.map(p => `<img src="${gPhoto(p)}" alt="" loading="lazy">`).join('')}</div>${photos[0].authorAttributions && photos[0].authorAttributions[0] ? `<a class="photo-credit" href="${esc(photos[0].authorAttributions[0].uri)}" target="_blank" rel="noopener">צילום: ${esc(photos[0].authorAttributions[0].displayName)} · Google</a>` : ''}`
    : `<div class="hero" style="--c:${c.c}"><div class="hero-art">${art}</div><div class="hero-big">${icon(c.i)}</div>`;
  const tr = teamRate(r.id);
  const myTip = S.me && tr ? tr.tips.find(t => t.u === S.me.id) : null;
  const meets = (S.meetBy.get(r.id) || []);
  const recent = S.data ? (S.data.checkins || []).filter(x => x.r === r.id) : [];
  const nowThere = [...new Set(recent.filter(x => Date.now() - new Date(x.at) < 2 * 3600e3).map(x => x.u))];
  const visitors = [...new Set(recent.map(x => x.u))];
  const meToday = S.me && recent.some(x => x.u === S.me.id && il(new Date(x.at)).ymd === il().ymd);

  let googleBlock;
  if (g && !g.error) {
    const stars = g.rating ? starsHtml(g.rating) : '';
    googleBlock = `<div class="card"><h3>${icon('brand-google-maps')}בגוגל</h3>
      ${g.rating ? `<div class="grating"><b class="num">${g.rating.toFixed(1)}</b>${stars}<span class="note">${(g.userRatingCount || 0).toLocaleString('he-IL')} ביקורות</span></div>` : ''}
      ${g.editorialSummary && g.editorialSummary.text ? `<p style="margin:8px 0 0;font-size:14px">${esc(g.editorialSummary.text)}</p>` : ''}
      <div class="row" style="margin-top:10px">
        ${g.websiteUri ? `<a class="btn sm" href="${esc(g.websiteUri)}" target="_blank" rel="noopener">${icon('external-link')}אתר ותפריט</a>` : ''}
        ${g.reservable ? `<a class="btn sm accent" href="${esc(g.googleMapsUri || gPlaceUrl(r))}" target="_blank" rel="noopener">${icon('calendar-plus')}הזמנת מקום</a>` : ''}
        <a class="btn sm" href="${esc(g.googleMapsUri || gPlaceUrl(r))}" target="_blank" rel="noopener">${icon('photo')}תמונות וביקורות</a>
        ${g.nationalPhoneNumber ? `<a class="btn sm" href="tel:${esc(g.nationalPhoneNumber.replace(/[^\d+]/g, ''))}">${icon('phone')}<span class="num">${esc(g.nationalPhoneNumber)}</span></a>` : ''}
      </div></div>`;
  } else {
    googleBlock = `<a class="card tint gcard" href="${gPlaceUrl(r)}" target="_blank" rel="noopener" style="text-decoration:none">
      <span class="gl">${icon('brand-google-maps')}</span>
      <div><b>תמונות, תפריט, דירוג והזמנת מקום</b><p>הכל בעמוד המסעדה בגוגל מפות ${icon('external-link')}</p></div></a>`;
  }

  const team = S.me ? `<div class="card"><h3>${icon('users-group')}מה החבר׳ה אומרים</h3>
      ${tr ? `<div class="grating"><b class="num">${tr.avg.toFixed(1)}</b>${starsHtml(tr.avg)}<span class="note">${tr.n === 1 ? 'דירוג אחד' : `${tr.n} דירוגים`}</span></div>` : '<p class="note" style="margin:0">עוד אין דירוגים. תהיו הראשונים לספר איך היה.</p>'}
      ${tr ? tr.tips.filter(t => t.t).slice(0, 5).map(t => `<div class="tip">${avatar(t.u)}<div><div class="who"><b>${esc(person(t.u).name)}</b>${starsHtml(t.s)}<span>${ago(t.at)}</span></div><p>${esc(t.t)}</p></div></div>`).join('') : ''}
      ${visitors.length ? `<div class="row" style="margin-top:10px">${stackHtml(visitors)}<span class="note">${nowThere.length ? `${nowThere.length === 1 ? firstName(nowThere[0]) + ' שם עכשיו' : `${nowThere.length} מהחבר׳ה שם עכשיו`}` : `${visitors.length} מהחבר׳ה אכלו כאן לאחרונה`}</span></div>` : ''}
      <div class="row" style="margin-top:12px">
        <button class="btn sm" data-act="rate" data-id="${r.id}">${icon('star')}${myTip ? 'עריכת הדירוג שלי' : 'דירוג וטיפ'}</button>
        <button class="btn sm" data-act="checkin" data-id="${r.id}" ${meToday ? 'disabled' : ''}>${icon(meToday ? 'check' : 'map-pin')}${meToday ? 'סימנת שאכלת כאן היום' : 'אכלתי כאן'}</button>
      </div></div>`
    : `<div class="card tint"><h3>${icon('users-group')}מה החבר׳ה אומרים</h3><p class="note" style="margin:0 0 10px">דירוגים, טיפים ומי אכל כאן לאחרונה — למחוברים בלבד.</p><button class="btn sm primary" data-act="auth">התחברות</button></div>`;

  const meetBlock = `<div class="card"><h3>${icon('calendar-event')}מפגשים כאן</h3>
      ${meets.length ? meets.map(m => mcard(m, { compact: true })).join('') : '<p class="note" style="margin:0 0 10px">עוד אין מפגש מתוכנן כאן.</p>'}
      <button class="btn primary block" data-act="new-meet" data-id="${r.id}">${icon('calendar-plus')}קביעת מפגש כאן</button></div>`;

  $('#sheet').innerHTML = `${hero}
      <div class="sheet-top"><button class="glass" data-act="close-sheet" aria-label="סגירה">${icon('x')}</button>
      <button class="glass ${fav ? 'on' : ''}" data-act="fav" data-id="${r.id}" aria-label="${fav ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}" aria-pressed="${fav}">${icon(fav ? 'heart-f' : 'heart')}</button></div></div>
    <div class="sheet-body">
      <div><h2 class="r-title">${esc(r.n)}</h2><div class="r-sub">${c.l} · ${esc(r.c)}${r.chain ? ' · סניף כשר של רשת' : ''}</div></div>
      <div class="facts"><span class="st ${st.s}">${st.t}</span>${KIND[r.k] ? `<span class="kind ${KIND[r.k]}">${r.k}</span>` : ''}${r.hk ? `<span class="hk">${icon('circle-check')}כשרות גבוהה</span>` : ''}
        <span class="walk">${icon('walk')}<span class="num">${fmtDist(r._d)} · ${walkMin(r._d) <= 60 ? `${walkMin(r._d)} דק׳ הליכה` : 'רחוק להליכה'}</span></span></div>
      <div class="actions">
        <a class="act primary" href="${gDirUrl(r)}" target="_blank" rel="noopener">${icon('navigation')}ניווט</a>
        <a class="act" href="${wazeUrl(r)}" target="_blank" rel="noopener">${icon('brand-waze')}Waze</a>
        <a class="act" href="${gPlaceUrl(r)}" target="_blank" rel="noopener">${icon('brand-google-maps')}בגוגל</a>
        <button class="act" data-act="share-r" data-id="${r.id}">${icon('share')}שיתוף</button>
      </div>
      ${googleBlock}
      ${meetBlock}
      ${team}
      <div class="info-list">
        <div>${icon('map-pin')}<span>${esc(r.a ? r.a + ', ' : '')}${esc(r.c)}${r.approx ? '<br><span class="note">המיקום במפה לפי הכתובת, ייתכן שהוא לא מדויק</span>' : ''}</span></div>
        <div>${icon('clock')}<span>${r.h ? `<span class="num">${esc(r.h.replace(/(\d{1,2}:\d{2})\s*[-:]?\s*(\d{1,2}:\d{2})/, '$1–$2'))}</span> לפי רשימת הגודיס (${LIST_DATE})` : 'שעות לפי הסניף'}</span></div>
      </div>
    </div>`;
}
function starsHtml(v) {
  const n = Math.round(v);
  return `<span class="stars" aria-label="${v.toFixed ? v.toFixed(1) : v} מתוך 5">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= n ? '' : 'off'}">${icon('star-f')}</span>`).join('')}</span>`;
}
const gPhoto = (p, w = 800) => `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=${w}&key=${CFG.googleKey}`;
async function loadGoogle(r) {
  if (S.google[r.pid] !== undefined) return;
  S.google[r.pid] = { loading: true, error: true };
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${r.pid}?languageCode=he&regionCode=IL`, {
      headers: {
        'X-Goog-Api-Key': CFG.googleKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,websiteUri,googleMapsUri,reservable,photos,nationalPhoneNumber,editorialSummary',
      },
    });
    if (!res.ok) throw new Error(String(res.status));
    S.google[r.pid] = await res.json();
  } catch { S.google[r.pid] = { error: true }; }
  if (S.sel === r.id) renderSheet();
}

/* ----- meetups ----- */
function visInfo(m) {
  if (m.kind === 'roulette') return { i: 'dice-5', l: 'רולטה' };
  if (m.vis === 'group') { const g = groupById(m.group); return { i: 'lock', l: g ? g.name : 'קבוצה' }; }
  if (m.vis === 'open') return { i: 'world', l: 'פתוח לכולם' };
  return { i: 'link', l: 'בהזמנה' };
}
function mcard(m, { compact = false } = {}) {
  const r = S.RM.get(m.rid) || { n: 'מסעדה', c: '', cat: 'home', id: m.rid };
  const me = S.me && S.me.id, joined = me && m.people.includes(me), host = me && m.host === me;
  const full = m.max && m.people.length >= m.max;
  const vi = visInfo(m), u = until(m.at);
  return `<div class="mcard ${joined ? 'mine' : ''}">
    <div class="mtop">
      <div class="mwhen"><b class="num">${hhmm(m.at)}</b><small>${dayLabel(m.at)}</small></div>
      <div>${compact ? `<div class="mname">${m.kind === 'now' ? 'יוצאים עכשיו' : 'מפגש צהריים'}</div>` : `<button class="mname" data-act="open-r" data-id="${r.id}">${esc(r.n)}</button>`}
        <div class="mmeta"><span class="vis">${icon(vi.i)}${esc(vi.l)}</span><span>${host ? 'אתם מארחים' : `מארח/ת: ${esc(firstName(m.host))}`}</span>${m.kind === 'now' ? `<span>${icon('bolt')}ספונטני</span>` : ''}${u ? `<span>${u}</span>` : ''}</div></div>
      ${compact ? '' : catAv(r, 'sm')}
    </div>
    ${m.note && m.kind !== 'roulette' ? `<p class="mnote">${esc(m.note)}</p>` : ''}
    <div class="mfoot">${stackHtml(m.people)}<span class="note num">${m.people.length}${m.max ? `/${m.max}` : ''} מגיעים</span><span class="grow"></span>
      ${joined
        ? `<button class="btn sm" data-act="leave" data-id="${m.id}">${host ? 'ביטול' : 'לא מגיע/ה'}</button>`
        : `<button class="btn sm primary" data-act="join" data-id="${m.id}" ${full ? 'disabled' : ''}>${full ? 'מלא' : 'אני בפנים'}</button>`}
      <button class="icon-btn" data-act="share-m" data-id="${m.id}" aria-label="שיתוף המפגש">${icon('brand-whatsapp')}</button>
      ${joined ? `<button class="icon-btn" data-act="ics" data-id="${m.id}" aria-label="הוספה ליומן">${icon('calendar-plus')}</button>` : ''}
    </div></div>`;
}
function rouletteCard() {
  if (!S.me) return '';
  const rl = S.data && S.data.roulette;
  const myMeet = rl && rl.meetup ? upcoming().find(m => m.id === rl.meetup && m.people.includes(S.me.id)) : null;
  const waiting = S.data ? S.data.roulette_waiting || 0 : 0;
  const { wd, h, m } = il(), now = h * 60 + m;
  const slots = wd <= 4 ? SLOTS.filter(s => { const [a, b] = s.split(':').map(Number); return a * 60 + b - now >= 10; }) : [];
  let body;
  if (myMeet) {
    const other = myMeet.people.find(p => p !== S.me.id), p = person(other), r = S.RM.get(myMeet.rid);
    body = `<p><b>יש התאמה!</b> ב-${hhmm(myMeet.at)} אוכלים ב${esc(r ? r.n : 'מסעדה')} עם ${esc(p.name)}${p.team ? ` מ${esc(p.team)}` : ''}${p.org && p.org !== S.me.org ? ` (${esc(p.org)})` : ''}.</p>
      <div class="row"><button class="btn sm" data-act="open-r" data-id="${myMeet.rid}">${icon('map-pin')}למסעדה</button><button class="btn sm" data-act="ics" data-id="${myMeet.id}">${icon('calendar-plus')}ליומן</button></div>`;
  } else if (rl && !rl.meetup) {
    body = `<p><span class="pulse"></span>&nbsp; מחפשים לכם שותף לארוחה ב-${rl.slot}. ברגע שמישהו נוסף יצטרף, המפגש יופיע כאן.</p>
      <div class="row"><button class="btn sm" data-act="roulette-leave">ביטול</button></div>`;
  } else if (slots.length) {
    body = `<p>רוצים להכיר מישהו חדש? בוחרים שעה, ואנחנו מצמידים אתכם לארוחה עם מישהו מצוות או מארגון אחר.${waiting ? ` <b>${waiting === 1 ? 'מישהו כבר מחכה' : `${waiting} כבר מחכים`} היום.</b>` : ''}</p>
      <div class="row">${slots.map(s => `<button class="chip small" data-act="roulette" data-slot="${s}">${s}</button>`).join('')}</div>`;
  } else {
    body = `<p>הרולטה פתוחה בימים א׳–ה׳ עד 13:20. נתראה ${wd >= 4 && wd <= 5 ? 'ביום ראשון' : 'מחר'} ב-12:00.</p>`;
  }
  return `<div class="hero-card roulette"><div class="row"><h3>רולטת צהריים</h3>${icon('dice-5')}</div>${body}</div>`;
}
function viewMeet() {
  if (!S.me) return welcome('מפגשים');
  const list = upcoming().slice().sort((a, b) => new Date(a.at) - new Date(b.at));
  const groups = {};
  for (const m of list) { const k = dayLabel(m.at); (groups[k] = groups[k] || []).push(m); }
  return `<div class="list-head"><h2>מפגשים</h2><button class="btn sm primary" data-act="new-meet">${icon('plus')}מפגש חדש</button></div>
    <div class="hero-card now"><h3>רעבים?</h3><p>מודיעים לחבר׳ה שיוצאים לאכול עוד כמה דקות, ומי שרוצה מצטרף.</p><div><button class="btn sm" data-act="now">${icon('bolt')}יוצאים לאכול</button></div></div>
    ${rouletteCard()}
    ${list.length ? Object.entries(groups).map(([k, ms]) => `<div class="section-title">${k}</div>${ms.map(m => mcard(m)).join('')}`).join('')
      : `<div class="empty">${icon('calendar-event')}<h3>עוד אין מפגשים</h3><p>קבעו מפגש במסעדה, או פתחו את הרולטה והכירו מישהו חדש.</p></div>`}`;
}

/* ----- crew ----- */
function feedItems() {
  if (!S.data) return [];
  const ev = [];
  for (const t of S.data.tips || []) ev.push({ at: t.at, u: t.u, html: `דירוג ${t.s}★ ל<button data-act="open-r" data-id="${t.r}">${esc((S.RM.get(t.r) || {}).n || '')}</button>${t.t ? `: „${esc(t.t)}”` : ''}` });
  for (const c of S.data.checkins || []) ev.push({ at: c.at, u: c.u, html: `ארוחה ב<button data-act="open-r" data-id="${c.r}">${esc((S.RM.get(c.r) || {}).n || '')}</button>` });
  for (const m of upcoming()) if (m.kind !== 'roulette') ev.push({ at: m.created, u: m.host, html: `${m.kind === 'now' ? 'יוצאים עכשיו ל' : 'מפגש חדש ב'}<button data-act="open-r" data-id="${m.rid}">${esc((S.RM.get(m.rid) || {}).n || '')}</button> · ${dayLabel(m.at)} ${hhmm(m.at)}` });
  return ev.filter(e => S.RM.size).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 15);
}
function viewCrew() {
  if (!S.me) return welcome('החבר׳ה');
  const groups = S.data ? S.data.groups || [] : [];
  const feed = feedItems();
  return `<div class="list-head"><h2>החבר׳ה</h2><div class="row"><button class="btn sm" data-act="join-group">${icon('key')}קוד</button><button class="btn sm primary" data-act="new-group">${icon('plus')}קבוצה</button></div></div>
    ${groups.map(g => {
      const open = S.openGroup === g.id;
      return `<div class="gitem"><span class="gemoji">${esc(g.emoji)}</span>
        <div><div class="gname">${esc(g.name)}</div><div class="gsub">${g.members.length} חברים · ${g.kind === 'org' ? 'הקבוצה של הארגון' : 'קבוצה פרטית'}</div>
        <div class="row" style="margin-top:6px">${stackHtml(g.members, 6)}<button class="linkish" data-act="toggle-group" data-id="${g.id}">${open ? 'הסתרה' : 'מי בקבוצה'}</button></div></div>
        <div class="row" style="flex-direction:column;gap:6px"><button class="icon-btn" data-act="share-g" data-id="${g.id}" aria-label="הזמנה לקבוצה">${icon('user-plus')}</button>
        ${g.kind === 'private' ? `<button class="icon-btn" data-act="leave-group" data-id="${g.id}" aria-label="יציאה מהקבוצה">${icon('door-exit')}</button>` : ''}</div>
        ${open ? `<div class="members">${g.members.map(id => `<span class="member">${avatar(id, 'sm')}${esc(person(id).name)}${person(id).team ? ` · <span class="note">${esc(person(id).team)}</span>` : ''}</span>`).join('')}<div class="note" style="width:100%">קוד הצטרפות: <span class="code">${esc(g.code)}</span></div></div>` : ''}
      </div>`;
    }).join('') || `<div class="empty">${icon('users-group')}<h3>עוד אין קבוצות</h3><p>פתחו קבוצה עם החבר׳ה מהצוות, ושלחו להם את הקוד בווטסאפ.</p></div>`}
    <div class="section-title">מה קורה</div>
    ${feed.length ? `<ul class="feed">${feed.map(e => `<li>${avatar(e.u)}<div><b>${esc(person(e.u).name)}</b> · ${e.html}<time>${ago(e.at)}</time></div></li>`).join('')}</ul>`
      : '<p class="note">כאן יופיעו דירוגים, ארוחות ומפגשים חדשים של החבר׳ה.</p>'}`;
}

/* ----- me ----- */
const BADGES = [[1, 'ארוחה ראשונה'], [5, 'סייר גודיס'], [15, 'מומחה גודיס'], [30, 'אגדה מקומית']];
function viewMe() {
  if (!S.me) return welcome('אני');
  const me = S.me, visited = visitedSet();
  const area = S.R.filter(r => dist(DEFAULT_ORIGIN, r) < 15000).sort((a, b) => dist(DEFAULT_ORIGIN, a) - dist(DEFAULT_ORIGIN, b));
  const inArea = area.filter(r => visited.has(r.id)).length;
  const myMeets = upcoming().filter(m => m.people.includes(me.id)).length;
  const myRates = (S.data.tips || []).filter(t => t.u === me.id).length;
  const favs = S.R.filter(r => favSet().has(r.id)).sort((a, b) => a._d - b._d);
  const theme = store.get('theme', 'auto');
  return `<div class="profile"><span class="av lg" style="--c:${esc(me.color)}">${esc(me.avatar)}</span>
      <div><h2>${esc(me.name)}</h2><div class="gsub"><span dir="ltr">@${esc(me.username)}</span> · ${esc(me.org)}${me.team ? ` · ${esc(me.team)}` : ''}</div></div>
      <button class="icon-btn" data-act="edit-profile" aria-label="עריכת פרופיל">${icon('pencil')}</button></div>
    <div class="stats"><div class="stat"><b class="num">${visited.size}</b><span>מסעדות שגילית</span></div><div class="stat"><b class="num">${myMeets}</b><span>מפגשים קרובים</span></div><div class="stat"><b class="num">${myRates}</b><span>דירוגים שנתת</span></div></div>
    <div class="punch">
      <div class="punch-head"><div><b class="num">${inArea}/${area.length}</b></div><span>כרטיסיית הגודיס של גוש דן</span></div>
      <div class="stamps">${area.map(r => `<button class="stamp ${visited.has(r.id) ? 'on' : ''}" style="--c:${CATS[r.cat].c}" data-act="open-r" data-id="${r.id}" title="${esc(r.n)}" aria-label="${esc(r.n)}${visited.has(r.id) ? ' — ביקרת' : ''}">${icon(CATS[r.cat].i)}</button>`).join('')}</div>
      <div class="badges">${BADGES.map(([n, l]) => `<span class="badge-pill ${visited.size >= n ? 'on' : ''}">${icon('trophy')}${l}<span class="num">· ${n}</span></span>`).join('')}</div>
      <p class="note" style="margin:10px 0 0">כל פעם שאוכלים במקום חדש, מסמנים „אכלתי כאן” בכרטיס המסעדה וממלאים חותמת.</p>
    </div>
    ${favs.length ? `<div class="section-title">המועדפים שלי</div><ul class="rlist">${favs.map(ritem).join('')}</ul>` : ''}
    <div class="section-title">הגדרות</div>
    <div class="setting"><div><b>נקודת מוצא למרחקים</b><small>${esc(originLabel())}</small></div><button class="btn sm" data-act="origin">שינוי</button></div>
    <div class="setting"><div><b>מראה</b><small>בהיר, כהה או לפי המכשיר</small></div>
      <div class="seg" style="width:200px">${[['auto', 'אוטו׳'], ['light', 'בהיר'], ['dark', 'כהה']].map(([k, l]) => `<button data-act="theme" data-v="${k}" aria-pressed="${theme === k}">${l}</button>`).join('')}</div></div>
    <div class="setting"><div><b>קוד אישי</b><small>4 עד 8 ספרות</small></div><button class="btn sm" data-act="pin">החלפה</button></div>
    <div class="setting" style="border:0"><div><b>יציאה מהחשבון</b><small>במכשיר הזה</small></div><button class="btn sm danger" data-act="logout">${icon('logout')}יציאה</button></div>
    <p class="note" style="margin-top:14px">רשימת המסעדות מעודכנת ל-${LIST_DATE}. מצאתם טעות או מסעדה חסרה? ספרו ליהלי מצוות ה-CTO.</p>`;
}
function welcome(where) {
  const lines = {
    'מפגשים': 'קובעים צהריים במסעדה, רואים מי מגיע, ומצטרפים למפגשים של אחרים.',
    'החבר׳ה': 'קבוצות פרטיות עם החבר׳ה, ופיד של דירוגים וארוחות.',
    'אני': 'פרופיל אישי, מועדפים וכרטיסיית הגודיס שלכם.',
  }[where];
  return `<div class="welcome"><h3>אוכלים ביחד</h3><p>${lines}</p>
    <ul><li>מפגשי צהריים מתוזמנים, לקבוצה או פתוחים לכולם</li><li>„יוצאים לאכול” — הודעה מהירה לחבר׳ה</li><li>רולטת צהריים עם מישהו מצוות אחר</li><li>דירוגים וטיפים של החבר׳ה על כל מסעדה</li></ul>
    <div class="row"><button class="btn" data-act="auth" data-mode="register">${icon('user-plus')}הרשמה עם קוד הצטרפות</button><button class="btn ghost" style="color:var(--olive-ink)" data-act="auth" data-mode="login">כבר רשום? כניסה</button></div></div>
    <p class="note">את המפה והמסעדות אפשר לראות גם בלי להירשם.</p>`;
}

