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
  adminOpen: false, admSec: 'users', adm: null,
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
  INVITE_EXPIRED: 'תוקף קוד ההצטרפות פג. בקשו קוד חדש', DISABLED: 'החשבון חסום. פנו למנהלי האפליקציה',
  NOT_ADMIN: 'הפעולה הזאת רק למנהלים', BAD_CODE: 'הקוד לא נכון או שכבר נוצל', SELF: 'את הפעולה הזאת אי אפשר לעשות על עצמכם',
  BAD_FEEDBACK: 'כתבו לפחות כמה מילים', BAD_PIN_CONFIRM: 'הקוד האישי לא נכון', BAD_MAX: 'מספר האנשים צריך להיות 1 ומעלה',
  LAST_ADMIN: 'אתם המנהלים היחידים. הפכו מישהו אחר למנהל לפני שמוחקים את החשבון',
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

/* ================= map (MapLibre GL: satellite by default, rotate, tilt, 3D buildings) ================= */
let map, originMarker = null, basePopup = null;
const markers = new Map();
const OFM = 'https://tiles.openfreemap.org';
const ESRI_SAT = CFG.esriKey
  ? `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${encodeURIComponent(CFG.esriKey)}`
  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTR = 'צילום לווין: Esri, Maxar, Earthstar Geographics';
const OFM_ATTR = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const HE_LABEL = ['coalesce', ['get', 'name:he'], ['get', 'name'], ['get', 'name_en']];
const styleCache = {};
const pos = r => r._pos || [r.lng, r.lat];
function darkMode() {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
/* Restaurants that share a building get spread a few metres apart so every pin can be tapped. */
function spreadPins() {
  const groups = new Map();
  S.R.forEach(r => { const k = `${r.lat.toFixed(4)},${r.lng.toFixed(4)}`; (groups.get(k) || groups.set(k, []).get(k)).push(r); });
  groups.forEach(g => {
    if (g.length < 2) return;
    g.forEach((r, i) => { const a = (2 * Math.PI * i) / g.length; r._pos = [r.lng + 0.00016 * Math.cos(a), r.lat + 0.00013 * Math.sin(a)]; });
  });
}
async function ofmStyle(name) {
  if (!styleCache[name]) styleCache[name] = await (await fetch(`${OFM}/styles/${name}`)).json();
  return JSON.parse(JSON.stringify(styleCache[name]));
}
async function googleTiles(sat) {
  const res = await fetch(`https://tile.googleapis.com/v1/createSession?key=${CFG.googleKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sat ? { mapType: 'satellite', language: 'he-IL', region: 'IL', layerTypes: ['layerRoadmap'] } : { mapType: 'roadmap', language: 'he-IL', region: 'IL' }),
  });
  if (!res.ok) throw new Error('google tiles ' + res.status);
  const { session } = await res.json();
  return `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${session}&key=${CFG.googleKey}`;
}
async function buildStyle() {
  const sat = S.basemap === 'sat';
  if (CFG.googleKey) {
    try {
      const url = await googleTiles(sat);
      return { version: 8, glyphs: `${OFM}/fonts/{fontstack}/{range}.pbf`, sources: { g: { type: 'raster', tiles: [url], tileSize: 256, maxzoom: 21, attribution: 'מפה וצילום: © Google' } }, layers: [{ id: 'g', type: 'raster', source: 'g' }] };
    } catch (e) { console.warn('Google tiles unavailable, using free map', e); }
  }
  const st = await ofmStyle(sat ? 'positron' : (darkMode() ? 'dark' : 'positron'));
  const vec = Object.keys(st.sources).find(k => st.sources[k].type === 'vector') || 'openmaptiles';
  st.sources[vec].attribution = OFM_ATTR;
  if (sat) {
    const labels = st.layers.filter(l => l.type === 'symbol' && !/shield|poi|housenumber|aeroway/.test(l.id) && l.layout && l.layout['text-field']);
    labels.forEach(l => {
      l.layout['text-field'] = HE_LABEL;
      l.paint = Object.assign({}, l.paint, { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,0.78)', 'text-halo-width': 1.6, 'text-halo-blur': 0.4 });
    });
    st.sources.sat = { type: 'raster', tiles: [ESRI_SAT], tileSize: 256, maxzoom: 19, attribution: ESRI_ATTR };
    st.layers = [
      { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-saturation': 0.1, 'raster-contrast': 0.05 } },
      { id: 'sat-roads', type: 'line', source: vec, 'source-layer': 'transportation', minzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]], paint: { 'line-color': 'rgba(255,240,200,0.32)', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 17, 3] } },
      ...labels,
    ];
  } else {
    st.layers.forEach(l => { if (l.layout && l.layout['text-field']) l.layout['text-field'] = HE_LABEL; });
    st.layers = st.layers.filter(l => !/shield|highway-name-major|poi/.test(l.id) && !(l.type === 'fill' && /building/.test(l.id)));
    st.layers.push({
      id: 'bld-3d', type: 'fill-extrusion', source: vec, 'source-layer': 'building', minzoom: 14.5,
      paint: {
        'fill-extrusion-color': darkMode() ? '#2a3322' : '#dfe3d6',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.82,
      },
    });
  }
  return st;
}
async function setTiles() {
  const seq = S.styleSeq = (S.styleSeq || 0) + 1;
  let style;
  try { style = await buildStyle(); } catch (e) { console.warn('map style failed', e); toast('המפה לא נטענה. בדקו את החיבור ורעננו'); return; }
  if (S.styleSeq !== seq || !map) return;
  document.body.classList.toggle('sat', S.basemap === 'sat');
  map.setStyle(style);
}
function initMap() {
  try { if (maplibregl.getRTLTextPluginStatus() === 'unavailable') maplibregl.setRTLTextPlugin('https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js', false).catch(() => {}); } catch (e) { console.warn(e); }
  map = new maplibregl.Map({
    container: 'map', center: [S.origin.lng, S.origin.lat], zoom: 14, minZoom: 6, maxZoom: 19.5, maxPitch: 70,
    style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#c9cfbf' } }] },
    attributionControl: false, dragRotate: true, touchPitch: true, cooperativeGestures: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: isDesk(), showCompass: true }), 'top-left');
  map.on('style.load', () => { if (RT.data) drawRoute(); });
  map.on('zoom', () => $('#map').classList.toggle('far', map.getZoom() < 11.5));
  map.on('contextmenu', e => askBase(e.lngLat));
  map.on('click', e => {
    if (S.picking) {
      S.picking = false;
      setOrigin({ lat: e.lngLat.lat, lng: e.lngLat.lng, label: 'הנקודה שבחרת', src: 'custom' });
      $('[data-act="locate"]').classList.remove('on');
      toast('נקודת המוצא עודכנה');
      frameNearby();
      return;
    }
    if (isRouting()) return;
    if (!$('#sheet').hidden) closeSheet();
  });
  map.on('dragstart', () => { RT.follow = false; });
  map.on('rotate', () => document.body.classList.toggle('rotated', Math.abs(map.getBearing()) > 1 || map.getPitch() > 1));
  map.on('pitch', () => document.body.classList.toggle('rotated', Math.abs(map.getBearing()) > 1 || map.getPitch() > 1));
  setTiles();
}
function pinHtml(r) {
  const cat = CATS[r.cat], st = openState(r).s, mc = (S.meetBy.get(r.id) || []).length;
  const cls = ['pin', KIND[r.k] || '', st === 'closed' ? 'closed' : '', S.sel === r.id ? 'sel' : ''].join(' ');
  return `<div class="${cls}" style="--c:${cat.c}">${icon(cat.i)}${mc ? `<span class="mcount">${mc}</span>` : ''}</div>`;
}
function drawMarkers() {
  if (!map) return;
  const list = filtered(), keep = new Set(list.map(r => r.id));
  markers.forEach((mk, id) => { if (!keep.has(id)) { mk.remove(); markers.delete(id); } });
  list.forEach(r => {
    const html = pinHtml(r);
    let mk = markers.get(r.id);
    if (!mk) {
      const el = document.createElement('button');
      el.className = 'pin-wrap mk'; el.type = 'button'; el.setAttribute('aria-label', r.n); el.title = r.n;
      el.addEventListener('click', ev => { ev.stopPropagation(); openRestaurant(r.id); });
      mk = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(pos(r)).addTo(map);
      markers.set(r.id, mk);
    }
    const el = mk.getElement();
    if (el._html !== html) { el.innerHTML = html; el._html = html; }
    el.style.zIndex = S.sel === r.id ? '5' : '';
  });
}
function dotMarker(cls, inner, ll) {
  const el = document.createElement('div');
  el.className = cls; el.innerHTML = inner || '';
  return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(ll).addTo(map);
}
function drawOrigin() {
  if (!map) return;
  if (originMarker) { originMarker.remove(); originMarker = null; }
  if (S.origin.src === 'gps') originMarker = dotMarker('me-dot', '', [S.origin.lng, S.origin.lat]);
  else if (S.origin.src === 'custom') originMarker = dotMarker('base-dot', icon('flag'), [S.origin.lng, S.origin.lat]);
}
function boundsOf(pts) { const b = new maplibregl.LngLatBounds(pts[0], pts[0]); pts.forEach(p => b.extend(p)); return b; }
function frameNearby(n = 8) {
  if (!map || !S.R.length) return;
  const pts = S.R.slice().sort((a, b) => a._d - b._d).slice(0, n).map(pos);
  pts.push([S.origin.lng, S.origin.lat]);
  const desk = isDesk();
  const panelH = desk ? 0 : ($('#panel').getBoundingClientRect().height || 300) + 70;
  map.fitBounds(boundsOf(pts), { padding: { top: desk ? 48 : 130, bottom: desk ? 48 : panelH + 16, left: 28, right: 28 }, maxZoom: 16.5, duration: 700, bearing: map.getBearing(), pitch: map.getPitch() });
}
function flyToVisible(r) {
  const size = map.getContainer().getBoundingClientRect();
  map.flyTo({ center: pos(r), zoom: Math.max(map.getZoom(), 16.5), offset: isDesk() ? [-Math.min(220, size.width * 0.25), 0] : [0, -size.height * 0.27], duration: 700 });
}
function askBase(ll) {
  if (basePopup) basePopup.remove();
  basePopup = new maplibregl.Popup({ closeButton: true, maxWidth: '240px' })
    .setLngLat(ll)
    .setHTML(`<div style="display:grid;gap:8px;min-width:190px"><b>נקודת מוצא חדשה?</b><span style="color:var(--ink-3);font-size:13px">המרחקים וזמני ההליכה יחושבו מכאן.</span><button class="btn primary sm" data-act="set-base" data-lat="${ll.lat}" data-lng="${ll.lng}">${icon('flag')}קבע כאן</button></div>`)
    .addTo(map);
}
function locate({ quiet = false } = {}) {
  if (!navigator.geolocation) { if (!quiet) toast('הדפדפן לא תומך במיקום'); return; }
  const btn = $('[data-act="locate"]');
  navigator.geolocation.getCurrentPosition(p => {
    setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'המיקום שלך', src: 'gps' }, { save: false });
    btn && btn.classList.add('on');
    frameNearby();
  }, () => { if (!quiet) toast('לא הצלחנו לקבל מיקום. אפשר לבחור נקודת מוצא בלחיצה ארוכה על המפה'); }, { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 });
}
function toggle3d() {
  if (map.getPitch() > 5) map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
  else map.easeTo({ pitch: 58, bearing: map.getBearing() || -20, zoom: Math.max(map.getZoom(), 16), duration: 800 });
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
  const bb = $('#baseBtn');
  if (bb) { bb.hidden = false; bb.innerHTML = icon(S.basemap === 'sat' ? 'map' : 'satellite'); bb.setAttribute('aria-label', S.basemap === 'sat' ? 'תצוגת מפה' : 'תצוגת לווין'); bb.title = bb.getAttribute('aria-label'); }
  const b3 = $('#btn3d'); if (b3 && !b3.innerHTML) b3.innerHTML = '<span class="t3d">3D</span>';
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
  const html = S.tab === 'map' ? viewList() : S.tab === 'meet' ? viewMeet() : S.tab === 'crew' ? viewCrew() : (S.adminOpen && S.me && S.me.role === 'admin' ? viewAdmin() : viewMe());
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
/* Representative dish photos (Pexels). Meat places never get a photo that shows dairy. */
const MEAT_SAFE = { sandwich: [1], cafe: [1], pizza: [] };
const catPhoto = r => {
  const opts = r.k === 'בשרי' && MEAT_SAFE[r.cat] ? MEAT_SAFE[r.cat] : [1, 2];
  return opts.length ? `img/cat/${r.cat}-${opts[r.id % opts.length]}.jpg` : '';
};
function thumbHtml(r, g) {
  const ph = g && g.photos && g.photos[0];
  const src = ph ? gPhoto(ph, 240) : catPhoto(r);
  if (!src) return catAv(r);
  return `<span class="thumb" style="--c:${CATS[r.cat].c}"><img src="${src}" alt="" loading="lazy" onerror="this.remove()"><span class="thumb-cat">${icon(CATS[r.cat].i)}</span></span>`;
}
function ritem(r, i = 99) {
  const g = i < (CFG.googleListCount || 12) ? gGet(r) : gPeek(r);
  const gr = g && g.rating ? `<span class="g-rate" title="דירוג בגוגל">${icon('star-f')}<b class="num">${g.rating.toFixed(1)}</b><small class="num">(${fmtCount(g.userRatingCount)})</small></span>` : '';
  const price = g ? priceText(g) : '';
  return `<li class="ritem" data-act="open-r" data-id="${r.id}" tabindex="0" role="button" aria-label="${esc(r.n)}">
    ${thumbHtml(r, g)}
    <div><div class="rname-row"><span class="rname">${esc(r.n)}</span>${gr}</div><div class="rmeta">${CATS[r.cat].l}${price ? ` · <span class="price num">${price}</span>` : ''} · ${esc(r.a ? r.a + ', ' : '')}${esc(r.c)}</div><div class="rtags">${tagsHtml(r)}</div></div>
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
  return head + nudge + `<ul class="rlist">${list.map((r, i) => ritem(r, i)).join('')}</ul>
    <p class="note" style="text-align:center;margin-top:16px">הרשימה לפי רשימת המסעדות שמכבדות גודיס, מעודכנת ל-${LIST_DATE}. שעות הפתיחה לימים א׳–ה׳.${gOn() ? ' תמונות, דירוגים ומחירים: Google.' : ' תמונות האוכל להמחשה, מ-Pexels.'}</p>`;
}

/* ----- restaurant sheet ----- */
function openRestaurant(id, { fly = true } = {}) {
  const r = S.RM.get(+id);
  if (!r) return;
  if (isRouting()) endRoute();
  S.sel = r.id;
  const sh = $('#sheet');
  renderSheet();
  sh.hidden = false; sh.scrollTop = 0;
  document.body.classList.add('sheet-open');
  drawMarkers();
  if (fly && map) flyToVisible(r);
  history.replaceState(null, '', `#r-${r.id}`);
  gGet(r);
}
function closeSheet() {
  $('#sheet').hidden = true; document.body.classList.remove('sheet-open');
  S.sel = null; drawMarkers();
  if (location.hash) history.replaceState(null, '', location.pathname);
}
function renderSheet() {
  const r = S.RM.get(S.sel);
  if (!r) return;
  const c = CATS[r.cat], st = openState(r), fav = favSet().has(r.id), g = gPeek(r);
  const photos = g && g.photos && g.photos.length ? g.photos.slice(0, 10) : null;
  const art = Array.from({ length: 24 }, () => icon(c.i)).join('');
  const hero = photos
    ? `<div class="hero photos"><div class="photos-strip" id="heroStrip">${photos.map((p, i) => `<button class="hero-ph" data-act="gallery" data-id="${r.id}" data-i="${i}" aria-label="תמונה ${i + 1} מתוך ${photos.length}"><img src="${gPhoto(p, 900)}" alt="" ${i ? 'loading="lazy"' : ''}></button>`).join('')}</div>
        <span class="ph-count num">${icon('photo')}${photos.length}</span>${credit(photos[0], 'photo-credit')}`
    : !catPhoto(r) ? `<div class="hero" style="--c:${c.c}"><div class="hero-art">${art}</div><div class="hero-big">${icon(c.i)}</div>`
    : `<div class="hero cat-photo" style="--c:${c.c}"><div class="hero-art">${art}</div><img class="hero-img" src="${catPhoto(r)}" alt="" onerror="this.remove()"><div class="hero-big">${icon(c.i)}</div>${gOn() && r.pid && !g ? '<span class="ph-loading">טוען תמונות מגוגל…</span>' : '<span class="ph-note">תמונה להמחשה</span>'}`;
  const tr = teamRate(r.id);
  const myTip = S.me && tr ? tr.tips.find(t => t.u === S.me.id) : null;
  const meets = (S.meetBy.get(r.id) || []);
  const recent = S.data ? (S.data.checkins || []).filter(x => x.r === r.id) : [];
  const nowThere = [...new Set(recent.filter(x => Date.now() - new Date(x.at) < 2 * 3600e3).map(x => x.u))];
  const visitors = [...new Set(recent.map(x => x.u))];
  const meToday = S.me && recent.some(x => x.u === S.me.id && il(new Date(x.at)).ymd === il().ymd);

  let googleBlock;
  if (g && !g.error) {
    const mapsUrl = esc(g.googleMapsUri || gPlaceUrl(r));
    const hours = g.regularOpeningHours && g.regularOpeningHours.weekdayDescriptions;
    const openNow = g.currentOpeningHours && typeof g.currentOpeningHours.openNow === 'boolean' ? g.currentOpeningHours.openNow : null;
    googleBlock = `<div class="card gbox"><h3>${icon('brand-google')}מידע מגוגל</h3>
      <div class="gstats">
        ${g.rating ? `<div><b class="num">${g.rating.toFixed(1)}</b>${starsHtml(g.rating)}<small class="num">${fmtCount(g.userRatingCount)} ביקורות</small></div>` : ''}
        ${priceText(g) ? `<div><b class="num" dir="ltr">${priceText(g)}</b><small>${g.priceRange ? 'לאדם' : 'רמת מחיר'}</small></div>` : ''}
        ${openNow !== null ? `<div><b class="${openNow ? 'ok' : 'bad'}">${openNow ? 'פתוח' : 'סגור'}</b><small>עכשיו, לפי גוגל</small></div>` : ''}
      </div>
      ${g.editorialSummary && g.editorialSummary.text ? `<p class="gsum">${esc(g.editorialSummary.text)}</p>` : ''}
      ${hours ? `<details class="ghours"><summary>${icon('clock')}שעות פתיחה בגוגל</summary><ul>${hours.map(h => `<li>${esc(h)}</li>`).join('')}</ul></details>` : ''}
      <div class="row" style="margin-top:12px">
        ${g.websiteUri ? `<a class="btn sm" href="${esc(g.websiteUri)}" target="_blank" rel="noopener">${icon('external-link')}אתר ותפריט</a>` : ''}
        ${g.reservable ? `<a class="btn sm accent" href="${mapsUrl}" target="_blank" rel="noopener">${icon('calendar-plus')}הזמנת מקום</a>` : ''}
        <a class="btn sm" href="${mapsUrl}" target="_blank" rel="noopener">${icon('brand-google-maps')}ביקורות בגוגל</a>
        ${g.nationalPhoneNumber ? `<a class="btn sm" href="tel:${esc(g.nationalPhoneNumber.replace(/[^\d+]/g, ''))}">${icon('phone')}<span class="num">${esc(g.nationalPhoneNumber)}</span></a>` : ''}
      </div></div>
      ${photos ? `<div class="card"><h3>${icon('photo')}תמונות <span class="note num">${photos.length}</span></h3><div class="gal">${photos.map((p, i) => `<button class="gal-ph" data-act="gallery" data-id="${r.id}" data-i="${i}" aria-label="תמונה ${i + 1}"><img src="${gPhoto(p, 400)}" alt="" loading="lazy"></button>`).join('')}</div><p class="note" style="margin:8px 0 0">התמונות מגוגל, באדיבות המצלמים.</p></div>` : ''}`;
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
      <div><h2 class="r-title">${esc(r.n)}</h2><div class="r-sub">${c.l} · ${esc(r.c)}${r.chain ? ' · סניף כשר של רשת' : ''}</div>
        ${g && g.rating ? `<div class="r-grate"><span class="g-rate big">${icon('star-f')}<b class="num">${g.rating.toFixed(1)}</b><small class="num">(${fmtCount(g.userRatingCount)} בגוגל)</small></span>${priceText(g) ? `<span class="price num">${priceText(g)}</span>` : ''}</div>` : ''}</div>
      <div class="facts"><span class="st ${st.s}">${st.t}</span>${KIND[r.k] ? `<span class="kind ${KIND[r.k]}">${r.k}</span>` : ''}${r.hk ? `<span class="hk">${icon('circle-check')}כשרות גבוהה</span>` : ''}
        <span class="walk">${icon('walk')}<span class="num">${fmtDist(r._d)} · ${walkMin(r._d) <= 60 ? `${walkMin(r._d)} דק׳ הליכה` : 'רחוק להליכה'}</span></span></div>
      <div class="actions">
        <button class="act primary" data-act="route" data-id="${r.id}">${icon('navigation')}ניווט</button>
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
/* ================= Google Places (live; needs googleKey in config.js) ================= */
const G = { cache: new Map(), pending: new Set(), timer: null, dirtySel: false };
const G_FIELDS = 'rating,userRatingCount,priceLevel,priceRange,photos,websiteUri,googleMapsUri,reservable,nationalPhoneNumber,editorialSummary,currentOpeningHours.openNow,regularOpeningHours.weekdayDescriptions';
const gOn = () => !!CFG.googleKey;
const gPeek = r => (r && r.pid && G.cache.get(r.pid)) || null;
function gGet(r) {
  if (!gOn() || !r || !r.pid) return null;
  const hit = G.cache.get(r.pid);
  if (hit) return hit.error ? null : hit;
  if (!G.pending.has(r.pid)) { G.pending.add(r.pid); fetchPlace(r); }
  return null;
}
async function fetchPlace(r) {
  let data;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(r.pid)}?languageCode=he&regionCode=IL`, {
      headers: { 'X-Goog-Api-Key': CFG.googleKey, 'X-Goog-FieldMask': G_FIELDS },
    });
    if (!res.ok) throw new Error(String(res.status));
    data = await res.json();
  } catch { data = { error: true }; }
  G.cache.set(r.pid, data);
  G.pending.delete(r.pid);
  const sel = S.RM.get(S.sel);
  if (sel && sel.pid === r.pid) G.dirtySel = true;
  clearTimeout(G.timer);
  G.timer = setTimeout(() => {
    if (S.tab === 'map') renderView();
    if (G.dirtySel && !$('#sheet').hidden) { G.dirtySel = false; renderSheet(); }
  }, 150);
}
const gPhoto = (p, w = 800) => `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=${w}&key=${CFG.googleKey}`;
function credit(p, cls) {
  const a = p && p.authorAttributions && p.authorAttributions[0];
  return a ? `<a class="${cls}" href="${esc(a.uri)}" target="_blank" rel="noopener">${esc(a.displayName)} · Google</a>` : `<span class="${cls}">Google</span>`;
}
const fmtCount = n => { n = +n || 0; return n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '')}K`; };
function priceText(g) {
  if (!g || g.error) return '';
  const pr = g.priceRange;
  if (pr && pr.startPrice) {
    const cur = (pr.startPrice.currencyCode || 'ILS') === 'ILS' ? '₪' : `${pr.startPrice.currencyCode} `;
    const a = +pr.startPrice.units || 0, b = pr.endPrice ? +pr.endPrice.units : null;
    return b ? `${cur}${a}–${b}` : `${cur}${a}+`;
  }
  return { PRICE_LEVEL_FREE: 'חינם', PRICE_LEVEL_INEXPENSIVE: '₪', PRICE_LEVEL_MODERATE: '₪₪', PRICE_LEVEL_EXPENSIVE: '₪₪₪', PRICE_LEVEL_VERY_EXPENSIVE: '₪₪₪₪' }[g.priceLevel] || '';
}
function openGallery(rid, i = 0) {
  const r = S.RM.get(+rid), g = gPeek(r);
  if (!g || !g.photos || !g.photos.length) return;
  const ph = g.photos.slice(0, 10), lb = $('#lightbox');
  lb.innerHTML = `<div class="lb-top"><button class="glass" data-act="gallery-close" aria-label="סגירה">${icon('x')}</button><b>${esc(r.n)}</b><span class="num" id="lbCount">${i + 1}/${ph.length}</span></div>
    <div class="lb-strip" id="lbStrip">${ph.map((p, k) => `<figure><img src="${gPhoto(p, 1400)}" alt="תמונה ${k + 1}" ${Math.abs(k - i) > 1 ? 'loading="lazy"' : ''}>${credit(p, 'lb-credit')}</figure>`).join('')}</div>`;
  lb.hidden = false;
  const strip = $('#lbStrip');
  requestAnimationFrame(() => { strip.scrollLeft = strip.clientWidth * i; });
  strip.addEventListener('scroll', () => {
    const k = Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth));
    const c = $('#lbCount'); if (c) c.textContent = `${Math.min(ph.length, k + 1)}/${ph.length}`;
  }, { passive: true });
}
function galleryStep(dir) {
  const strip = $('#lbStrip'); if (!strip) return;
  strip.scrollBy({ left: dir * strip.clientWidth, behavior: 'smooth' });
}

/* ================= in-app route (OpenStreetMap routing; voice navigation via Google/Waze) ================= */
const RT = { layers: [], watch: null, data: null, rid: null, mode: 'foot', live: false, follow: true, lastReroute: 0, from: null, gps: false, arrived: false, showSteps: false, loading: false, err: '', progress: 0, meMk: null, wake: null };
const ROUTER = CFG.routing || 'https://routing.openstreetmap.de';
const isRouting = () => document.body.classList.contains('routing');
function getPos(timeout = 7000) {
  return new Promise(res => {
    if (!navigator.geolocation) { res(null); return; }
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(null), { enableHighAccuracy: true, timeout, maximumAge: 30000 });
  });
}
async function startRoute(rid, mode) {
  const r = S.RM.get(+rid);
  if (!r) return;
  endRoute();
  Object.assign(RT, { rid: r.id, mode: mode || RT.mode || 'foot', arrived: false, err: '', loading: true, showSteps: false, progress: 0, data: null });
  $('#sheet').hidden = true; document.body.classList.remove('sheet-open'); document.body.classList.add('routing');
  S.sel = r.id; drawMarkers(); renderRoute();
  const pos = await getPos();
  RT.gps = !!pos;
  RT.from = pos || { lat: S.origin.lat, lng: S.origin.lng };
  if (pos) setOrigin({ lat: pos.lat, lng: pos.lng, label: 'המיקום שלך', src: 'gps' }, { save: false });
  await computeRoute();
}
async function computeRoute() {
  const r = S.RM.get(RT.rid);
  if (!r || !RT.from) return;
  RT.loading = true; renderRoute();
  const prof = RT.mode === 'car' ? ['routed-car', 'driving'] : ['routed-foot', 'foot'];
  try {
    const res = await fetch(`${ROUTER}/${prof[0]}/route/v1/${prof[1]}/${RT.from.lng},${RT.from.lat};${r.lng},${r.lat}?overview=full&geometries=geojson&steps=true`);
    const d = await res.json();
    if (d.code !== 'Ok' || !d.routes || !d.routes[0]) throw new Error(d.code || 'route');
    const rt = d.routes[0];
    const coords = rt.geometry.coordinates.map(([x, y]) => [y, x]);
    const cum = [0];
    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + dist({ lat: coords[i - 1][0], lng: coords[i - 1][1] }, { lat: coords[i][0], lng: coords[i][1] }));
    const k = cum[cum.length - 1] ? rt.distance / cum[cum.length - 1] : 1;
    let at = 0;
    const steps = rt.legs[0].steps.map(st => { const o = { m: st.maneuver, name: st.name || '', d: st.distance, at }; at += st.distance; return o; });
    RT.data = { coords, cum: cum.map(c => c * k), total: rt.distance, dur: rt.duration, steps };
    RT.progress = 0; RT.err = '';
  } catch {
    RT.data = null; RT.err = 'לא הצלחנו לחשב מסלול כרגע. אפשר לנווט עם גוגל מפות או Waze.';
  }
  RT.loading = false;
  drawRoute(); renderRoute();
  if (RT.data && !RT.live) fitRoute();
}
function clearRouteLayers() {
  if (!map) return;
  ['route-line', 'route-casing'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
  if (map.getSource('route')) map.removeSource('route');
  RT.layers.forEach(m => m.remove()); RT.layers = [];
}
function drawRoute() {
  clearRouteLayers();
  if (!RT.data) return;
  const foot = RT.mode === 'foot';
  try {
    map.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: RT.data.coords.map(([la, ln]) => [ln, la]) } } });
    map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': foot ? 10 : 11, 'line-opacity': 0.95 } });
    map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: Object.assign({ 'line-color': '#1d6ff2', 'line-width': foot ? 6 : 7 }, foot ? { 'line-dasharray': [0, 1.9] } : {}) });
  } catch (e) { map.once('style.load', drawRoute); return; }
  if (RT.gps) { if (!RT.meMk) RT.meMk = dotMarker('me-dot rt', '', [RT.from.lng, RT.from.lat]); }
  else RT.layers.push(dotMarker('base-dot', icon('flag'), [RT.from.lng, RT.from.lat]));
}
function fitRoute() {
  if (!RT.data) return;
  const desk = isDesk(), card = $('#routeCard').getBoundingClientRect().height || 260;
  map.fitBounds(boundsOf(RT.data.coords.map(([la, ln]) => [ln, la])), {
    padding: { top: desk ? 48 : 90, bottom: desk ? 48 : card + 24, left: 36, right: desk ? 440 : 36 }, maxZoom: 17, duration: 700, bearing: 0, pitch: 0,
  });
}
const fmtDur = s => { const m = Math.max(1, Math.round(s / 60)); return m < 60 ? `${m} דק׳` : `${Math.floor(m / 60)}:${pad(m % 60)} ש׳`; };
const TURN_HE = { left: 'פנו שמאלה', right: 'פנו ימינה', 'slight left': 'פנו קלות שמאלה', 'slight right': 'פנו קלות ימינה', 'sharp left': 'פנו בחדות שמאלה', 'sharp right': 'פנו בחדות ימינה', straight: 'המשיכו ישר', uturn: 'בצעו פניית פרסה' };
function stepIcon(m) {
  if (m.type === 'arrive') return 'flag';
  if (m.type === 'depart') return RT.mode === 'car' ? 'car' : 'walk';
  if (/roundabout|rotary/.test(m.type)) return 'arrow-rotary-right';
  return { left: 'corner-up-left', right: 'corner-up-right', 'slight left': 'arrow-bear-left', 'slight right': 'arrow-bear-right', 'sharp left': 'arrow-sharp-turn-left', 'sharp right': 'arrow-sharp-turn-right', uturn: 'arrow-back-up' }[m.modifier] || 'arrow-up';
}
function stepText(st, r) {
  const m = st.m, nm = st.name;
  if (m.type === 'arrive') return `הגעתם ל${r.n}`;
  if (m.type === 'depart') return nm ? `יוצאים לדרך ב${nm}` : 'יוצאים לדרך';
  if (/roundabout|rotary/.test(m.type)) return `בכיכר, צאו ביציאה ה-${m.exit || 1}${nm ? ` אל ${nm}` : ''}`;
  if ((m.type === 'continue' || m.type === 'new name') && (!m.modifier || m.modifier === 'straight')) return nm ? `המשיכו ב${nm}` : 'המשיכו ישר';
  const t = TURN_HE[m.modifier] || 'המשיכו';
  return nm ? `${t} אל ${nm}` : t;
}
function renderRoute() {
  const el = $('#routeCard'), r = S.RM.get(RT.rid);
  if (!r || !isRouting()) { el.hidden = true; return; }
  const d = RT.data;
  const left = d ? Math.max(0, d.total - RT.progress) : 0;
  const leftDur = d ? d.dur * (left / (d.total || 1)) : 0;
  const next = d && RT.live && !RT.arrived ? d.steps.find(st => st.at > RT.progress + 5) : null;
  const gMode = RT.mode === 'car' ? 'driving' : 'walking';
  el.innerHTML = `
    <div class="rc-head"><div class="grow"><small>${RT.live ? 'בדרך אל' : 'מסלול אל'}</small><h3>${esc(r.n)}</h3></div>
      <button class="icon-btn" data-act="route-close" aria-label="סיום המסלול">${icon('x')}</button></div>
    ${RT.arrived ? `<div class="rc-arrive"><b>הגעת! בתיאבון</b><div class="row">${S.me ? `<button class="btn sm primary" data-act="checkin" data-id="${r.id}">${icon('map-pin')}אכלתי כאן</button>` : ''}<button class="btn sm" data-act="route-close">סיום</button></div></div>` : ''}
    ${next ? `<div class="rc-next">${icon(stepIcon(next.m))}<div><b>${esc(stepText(next, r))}</b><small class="num">בעוד ${fmtDist(Math.max(0, next.at - RT.progress))}</small></div></div>` : ''}
    <div class="seg rc-mode"><button data-act="route-mode" data-v="foot" aria-pressed="${RT.mode === 'foot'}">${icon('walk')}הליכה</button><button data-act="route-mode" data-v="car" aria-pressed="${RT.mode === 'car'}">${icon('car')}רכב</button></div>
    <div class="rc-sum">${RT.loading ? '<span class="note">מחשב מסלול…</span>' : RT.err ? `<span class="err">${esc(RT.err)}</span>` : `<b class="num">${fmtDur(leftDur)}</b><span class="num">${fmtDist(left)}</span><span class="num">הגעה ב-${hhmm(new Date(Date.now() + leftDur * 1000))}</span>`}</div>
    ${!RT.gps && !RT.loading && d ? `<p class="note" style="margin:0">המסלול מחושב מ${esc(originLabel())}, כי אין גישה למיקום שלך.</p>` : ''}
    <div class="row rc-actions">
      <button class="btn primary grow" data-act="route-live" ${d && !RT.arrived ? '' : 'disabled'}>${icon(RT.live ? 'circle-x' : 'navigation')}${RT.live ? 'עצירת מעקב' : 'יוצאים לדרך'}</button>
      <button class="icon-btn" data-act="route-steps" aria-label="שלבי המסלול" aria-pressed="${RT.showSteps}" ${d ? '' : 'disabled'}>${icon('route-2')}</button>
      <a class="icon-btn" href="${gDirUrl(r)}&travelmode=${gMode}" target="_blank" rel="noopener" aria-label="ניווט קולי בגוגל מפות">${icon('brand-google-maps')}</a>
      <a class="icon-btn" href="${wazeUrl(r)}" target="_blank" rel="noopener" aria-label="ניווט ב-Waze">${icon('brand-waze')}</a>
    </div>
    ${RT.showSteps && d ? `<ol class="rc-steps">${d.steps.map(st => `<li class="${st.at + st.d < RT.progress ? 'done' : ''}">${icon(stepIcon(st.m))}<span>${esc(stepText(st, r))}</span><small class="num">${st.d > 0 ? fmtDist(st.d) : ''}</small></li>`).join('')}</ol>` : ''}
    <p class="note rc-credit">מסלול לפי OpenStreetMap. לניווט קולי: גוגל מפות או Waze.</p>`;
  el.hidden = false;
}
function toggleLive() {
  if (RT.live) { stopLive(); renderRoute(); return; }
  if (!navigator.geolocation) { toast('הדפדפן לא תומך במיקום'); return; }
  RT.live = true; RT.follow = true; RT.showSteps = false;
  RT.watch = navigator.geolocation.watchPosition(onRoutePos, () => {
    toast('אין גישה למיקום. אפשר לנווט עם גוגל מפות או Waze');
    stopLive(); renderRoute();
  }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { RT.wake = l; }).catch(() => {}); } catch { /* no wake lock */ }
  renderRoute();
}
function stopLive() {
  RT.live = false;
  if (RT.watch != null) navigator.geolocation.clearWatch(RT.watch);
  RT.watch = null;
  if (RT.wake) { RT.wake.release().catch(() => {}); RT.wake = null; }
}
function onRoutePos(p) {
  const me = { lat: p.coords.latitude, lng: p.coords.longitude }, r = S.RM.get(RT.rid);
  if (!r) return;
  if (!RT.meMk) RT.meMk = dotMarker('me-dot rt', '', [me.lng, me.lat]);
  else RT.meMk.setLngLat([me.lng, me.lat]);
  const hd = p.coords.heading, sp = p.coords.speed;
  if (typeof hd === 'number' && !isNaN(hd) && sp > 0.6) RT.heading = hd;
  if (!RT.gps) { RT.gps = true; RT.from = me; computeRoute(); return; }
  if (!RT.data) return;
  let best = 0, bd = Infinity;
  RT.data.coords.forEach((c, i) => { const dd = dist(me, { lat: c[0], lng: c[1] }); if (dd < bd) { bd = dd; best = i; } });
  RT.progress = Math.max(RT.progress, RT.data.cum[best]);
  if (dist(me, r) < 30 || RT.data.total - RT.progress < 20) {
    if (!RT.arrived) { RT.arrived = true; stopLive(); toast('הגעת! בתיאבון'); }
  } else if (bd > 60 && Date.now() - RT.lastReroute > 20000) {
    RT.lastReroute = Date.now(); RT.from = me; RT.progress = 0; computeRoute(); return;
  }
  if (RT.follow) panToMe([me.lng, me.lat]);
  renderRoute();
}
function panToMe(ll) {
  const card = $('#routeCard').getBoundingClientRect().height || 300;
  map.easeTo({ center: ll, zoom: Math.max(map.getZoom(), 17.3), pitch: RT.live ? 50 : map.getPitch(), bearing: RT.live && RT.heading != null ? RT.heading : map.getBearing(), offset: isDesk() ? [-200, 0] : [0, -card / 2 + 60], duration: 600 });
}
function endRoute() {
  stopLive(); if (map) clearRouteLayers();
  if (RT.meMk) { RT.meMk.remove(); RT.meMk = null; }
  document.body.classList.remove('routing');
  const el = $('#routeCard'); if (el) el.hidden = true;
}
function stopRoute() {
  const rid = RT.rid;
  endRoute(); RT.data = null; RT.rid = null;
  if (rid) openRestaurant(rid, { fly: false });
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
  return `${me.must_change_pin ? `<div class="notice">${icon('alert-triangle')}<div><b>אתם עם קוד זמני</b><small>בחרו קוד אישי משלכם</small></div><button class="btn sm primary" data-act="force-pin-open">בחירה</button></div>` : ''}
    <div class="profile"><span class="av lg" style="--c:${esc(me.color)}">${esc(me.avatar)}</span>
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
    ${me.role === 'admin' ? `<div class="setting admin-row"><div><b>${icon('shield-check')}ניהול האפליקציה</b><small>משתמשים, קודי הצטרפות, משוב ותוכן</small></div><button class="btn sm primary" data-act="admin-open">פתיחה</button></div>` : ''}
    <div class="section-title">הגדרות</div>
    <div class="setting"><div><b>נקודת מוצא למרחקים</b><small>${esc(originLabel())}</small></div><button class="btn sm" data-act="origin">שינוי</button></div>
    <div class="setting"><div><b>מראה</b><small>בהיר, כהה או לפי המכשיר</small></div>
      <div class="seg" style="width:200px">${[['auto', 'אוטו׳'], ['light', 'בהיר'], ['dark', 'כהה']].map(([k, l]) => `<button data-act="theme" data-v="${k}" aria-pressed="${theme === k}">${l}</button>`).join('')}</div></div>
    <div class="setting"><div><b>קוד אישי</b><small>4 עד 8 ספרות</small></div><button class="btn sm" data-act="pin">החלפה</button></div>
    <div class="setting"><div><b>יש לי הערה</b><small>טעות, מסעדה חסרה או רעיון</small></div><button class="btn sm" data-act="feedback">${icon('message-circle')}כתיבה</button></div>
    <div class="setting"><div><b>פרטיות ואבטחה</b><small>מה נשמר, מי רואה וכמה זמן</small></div><button class="btn sm" data-act="privacy">${icon('shield-lock')}פרטים</button></div>
    <div class="setting"><div><b>יציאה מהחשבון</b><small>במכשיר הזה</small></div><button class="btn sm" data-act="logout">${icon('logout')}יציאה</button></div>
    <div class="setting" style="border:0"><div><b>מחיקת החשבון</b><small>כל הנתונים שלכם נמחקים מיד</small></div><button class="btn sm danger" data-act="del-account">${icon('trash')}מחיקה</button></div>
    <p class="note" style="margin-top:14px">רשימת המסעדות מעודכנת ל-${LIST_DATE}. מצאתם טעות או מסעדה חסרה? <button class="linkish" data-act="feedback">ספרו לנו</button>${me.role === 'admin' ? '' : ` · <button class="linkish" style="color:var(--ink-3);font-weight:500" data-act="claim">קוד ניהול</button>`}</p>`;
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

