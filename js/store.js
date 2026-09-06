/* ============================================================
 * store.js —— 持久化：localStorage(事件/分类/偏好) + IndexedDB(背景图)
 * ============================================================ */
'use strict';
(function () {
  const LS_KEY = 'daoshuri_state_v1';
  const DB_NAME = 'daoshuri', DB_VER = 1, STORE = 'photos';

  const DEFAULT_CATS = [
    { id: 'ji',  name: '纪念日', color: '#FF5E5B', icon: '❤️' },
    { id: 'bd',  name: '生日',   color: '#FFA000', icon: '🎂' },
    { id: 'lv',  name: '旅行',   color: '#29B6F6', icon: '✈️' },
    { id: 'wk',  name: '工作',   color: '#3D7EF7', icon: '💼' },
    { id: 'st',  name: '学习',   color: '#9C6BFF', icon: '📚' },
    { id: 'life',name: '生活',   color: '#26C281', icon: '🏠' },
    { id: 'ft',  name: '节日',   color: '#FF6FB5', icon: '🎉' },
    { id: 'oth', name: '其他',   color: '#8E8E93', icon: '📌' }
  ];

  let state = null;
  let dbp = null;

  function idb() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return dbp;
  }

  function tx(mode, fn) {
    return idb().then((db) => new Promise((res, rej) => {
      const t = db.transaction(STORE, mode);
      const s = t.objectStore(STORE);
      const out = fn(s);
      t.oncomplete = () => res(out && out.__promise ? out.__promise : out);
      t.onerror = () => rej(t.error);
    }));
  }

  function loadPhotoBlob(key) {
    return tx('readonly', (s) => { const r = s.get(key); r.__promise = new Promise((res) => { r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }); return r; })
      .catch(() => null);
  }

  function savePhotoBlob(key, blob) {
    return tx('readwrite', (s) => s.put(blob, key));
  }

  function dropPhotoBlob(key) {
    return tx('readwrite', (s) => s.delete(key)).catch(() => {});
  }

  /* ---------- 主状态 ---------- */
  function load() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(LS_KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (e) { state = null; }
    if (!state || !Array.isArray(state.events) || !Array.isArray(state.cats)) {
      state = { ver: 1, cats: DEFAULT_CATS.slice(), events: [], prefs: { theme: 'auto', view: 'list', calYM: null } };
      save();
    }
    return state;
  }

  function save() {
    if (!state) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
      try {
        // 可能是图片等导致超限：清掉旧 key 重试一次
        localStorage.removeItem(LS_KEY);
        localStorage.setItem(LS_KEY, JSON.stringify(state));
      } catch (e2) {
        window.dispatchEvent(new CustomEvent('dm:toast', { detail: { text: '存储空间不足，请先导出备份后清理数据', kind: 'err' } }));
      }
    }
  }

  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function sortEvents(list) {
    const C = window.DM.core;
    const today = C.todayMid();
    return list.slice().sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      const stA = computeDiff(a, today), stB = computeDiff(b, today);
      // 排序键：未来(按天数近→远) < 今天 < 已过(按距今天近→远)
      return keyOf(stA) - keyOf(stB);
    });
    function computeDiff(ev, t) {
      const C2 = window.DM.core;
      const s = C2.stateOf(ev, t);
      return { diff: s.diffDays === null ? -Infinity : s.diffDays, annual: s.annual, ev };
    }
    function keyOf(st) {
      if (st.diff === -Infinity) return 1e12;
      return st.diff >= 0 ? st.diff : 1e9 - st.diff; // 已过事件排在“未来”之后
    }
  }

  /* ---------- CRUD ---------- */
  function addEvent(ev) {
    const s = load();
    if (!ev.id) ev.id = genId();
    if (!ev.ctime) ev.ctime = Date.now();
    s.events.push(ev);
    save();
    return ev;
  }

  function updateEvent(ev) {
    const s = load();
    const i = s.events.findIndex((e) => e.id === ev.id);
    if (i >= 0) { s.events[i] = ev; save(); }
    return ev;
  }

  function removeEvent(id) {
    const s = load();
    s.events = s.events.filter((e) => e.id !== id);
    // 背景图暂不立即删除，支持“撤销删除”；下次同名 id 写入时会被覆盖
    save();
  }

  function addCat(cat) { const s = load(); s.cats.push(cat); save(); return cat; }
  function updateCat(cat) {
    const s = load();
    const i = s.cats.findIndex((c) => c.id === cat.id);
    if (i >= 0) { s.cats[i] = cat; save(); }
  }
  function removeCat(id) {
    const s = load();
    const def = s.cats.find((c) => c.id === 'oth');
    s.events.forEach((e) => { if (e.cat === id) e.cat = def ? def.id : (s.cats[0] || {}).id; });
    s.cats = s.cats.filter((c) => c.id !== id);
    if (!s.cats.length) s.cats = DEFAULT_CATS.slice();
    save();
  }
  function catById(id) {
    const s = load();
    return s.cats.find((c) => c.id === id) || s.cats[0] || DEFAULT_CATS[0];
  }

  /* ---------- 背景图 ---------- */
  function putPhoto(evId, blobOrDataUrl) {
    const key = 'p_' + evId;
    if (blobOrDataUrl instanceof Blob) return savePhotoBlob(key, blobOrDataUrl);
    return fetch(blobOrDataUrl).then((r) => r.blob()).then((blob) => savePhotoBlob(key, blob));
  }

  async function getPhoto(evId) {
    const blob = await loadPhotoBlob('p_' + evId);
    if (!blob) return null;
    return new Promise((res) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => res(null); rd.readAsDataURL(blob); });
  }

  /* ---------- 备份 / 恢复 ---------- */
  async function exportData() {
    const s = load();
    const photos = {};
    for (const e of s.events) {
      if (e.bg === 'img') {
        const d = await getPhoto(e.id);
        if (d) photos['p_' + e.id] = d;
      }
    }
    // 连带备份“月历/生理周期”数据
    return JSON.stringify({
      app: 'daoshuri', ver: 2, exportedAt: new Date().toISOString(),
      cats: s.cats, events: s.events, photos,
      cycle: getCycle(), marks: getMarks(), cycles: getCycles()
    });
  }

  async function importData(jsonText) {
    const data = JSON.parse(jsonText);
    if (!data || !Array.isArray(data.events) || !Array.isArray(data.cats)) throw new Error('文件格式不正确');
    const s = load();
    s.cats = data.cats;
    s.events = data.events;
    save();
    const ph = data.photos || {};
    for (const k of Object.keys(ph)) {
      const evId = k.replace(/^p_/, '');
      await putPhoto(evId, ph[k]);
    }
    // 恢复月历/生理周期数据（旧备份无这些字段则跳过）
    if (data.marks && typeof data.marks === 'object') {
      try { localStorage.setItem(MARKS_KEY, JSON.stringify(data.marks)); } catch (e) { /* 忽略 */ }
    }
    if (data.cycles && typeof data.cycles === 'object') {
      try { localStorage.setItem(CYCLES_KEY, JSON.stringify(data.cycles)); } catch (e) { /* 忽略 */ }
    }
    if (data.cycle && typeof data.cycle === 'object') setCycle(data.cycle);
    return s.events.length;
  }

  /* ---------- 示例数据 ---------- */
  function sampleEvents() {
    const C = window.DM.core;
    const today = C.todayMid();
    const mk = (o) => Object.assign({ id: genId(), note: '', cat: 'oth', pinned: false, ctime: Date.now(), cal: 'solar', repeat: false, anniversary: false, bg: 'none', remind: null }, o);
    const out = [];
    const lvStart = C.addDays(today, 45);
    out.push(mk({ title: '旅行出发', note: '记得订机票和酒店～', cat: 'lv', y: lvStart.getFullYear(), m: lvStart.getMonth() + 1, d: lvStart.getDate() }));
    const ann = C.addDays(today, -700);
    out.push(mk({ title: '在一起纪念日', cat: 'ji', anniversary: true, y: ann.getFullYear(), m: ann.getMonth() + 1, d: ann.getDate(), remind: { adv: 0, hh: '09', mm: '00' } }));
    const bd = C.addDays(today, 90);
    out.push(mk({ title: '我的生日', note: '农历五月初五', cat: 'bd', anniversary: true, cal: 'lunar', lm: 5, ld: 5, lLeap: false, repeat: true }));
    const pay = C.addDays(today, 12);
    out.push(mk({ title: '工资日', cat: 'wk', repeat: true, y: pay.getFullYear(), m: pay.getMonth() + 1, d: pay.getDate() }));
    const newYear = new Date(today.getFullYear() + (today.getMonth() >= 0 ? 1 : 0), 0, 1);
    if (newYear.getTime() <= today.getTime()) newYear.setFullYear(today.getFullYear() + 1);
    out.push(mk({ title: '跨年倒数', cat: 'ft', y: newYear.getFullYear(), m: 1, d: 1 }));
    return out;
  }

  function setPrefs(patch) { const s = load(); Object.assign(s.prefs, patch); save(); }
  function getPrefs() { return load().prefs || {}; }

  /* ---------- 生理周期记录（月历页） ---------- */
  const MARKS_KEY = 'daoshuri_marks_v1';
  const CYCLES_KEY = 'daoshuri_cycles_v1';
  const CYCLE_DEF = { lastStart: null, lastEnd: null, cycleLen: 28, periodLen: 5 };

  /** 单周期记录：{ 开始日期: 结束日期 }，每段经期独立 */
  function getCycles() {
    try { return JSON.parse(localStorage.getItem(CYCLES_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function putCycleRecord(startStr, endStr) {
    const c = getCycles();
    c[startStr] = endStr;
    try { localStorage.setItem(CYCLES_KEY, JSON.stringify(c)); } catch (e) { /* 忽略 */ }
    return c;
  }
  function delCycleRecord(startStr) {
    const c = getCycles();
    if (c[startStr] != null) { delete c[startStr]; try { localStorage.setItem(CYCLES_KEY, JSON.stringify(c)); } catch (e) { /* 忽略 */ } }
    return c;
  }
  function clearCycles() {
    try { localStorage.removeItem(CYCLES_KEY); } catch (e) { /* 忽略 */ }
  }
  /** 一键重置整个周期模块：删每日记录 + 删周期记录 + 重置设置 */
  function resetCycleData() {
    try { localStorage.removeItem(MARKS_KEY); } catch (e) { /* 忽略 */ }
    try { localStorage.removeItem(CYCLES_KEY); } catch (e) { /* 忽略 */ }
    const s = load();
    s.prefs.cycle = { lastStart: null, lastEnd: null, cycleLen: 28, periodLen: 5 };
    save();
    return s;
  }
  /** 删除“早于用户设置开始日”的旧记录与旧周期（避免开始日前残留预测/标红） */
  function trimBeforeStart(startStr) {
    const mk = getMarks();
    let ch = false;
    for (const k of Object.keys(mk)) { if (k < startStr) { delete mk[k]; ch = true; } }
    if (ch) { try { localStorage.setItem(MARKS_KEY, JSON.stringify(mk)); } catch (e) { /* 忽略 */ } }
    const cy = getCycles();
    ch = false;
    for (const k of Object.keys(cy)) { if (k < startStr || cy[k] < startStr) { delete cy[k]; ch = true; } }
    if (ch) { try { localStorage.setItem(CYCLES_KEY, JSON.stringify(cy)); } catch (e) { /* 忽略 */ } }
  }

  function getMarks() {
    try { return JSON.parse(localStorage.getItem(MARKS_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function putMark(dateStr, obj) {
    const m = getMarks();
    m[dateStr] = obj;
    try { localStorage.setItem(MARKS_KEY, JSON.stringify(m)); } catch (e) { /* 忽略 */ }
    return m;
  }
  function delMark(dateStr) {
    const m = getMarks();
    delete m[dateStr];
    try { localStorage.setItem(MARKS_KEY, JSON.stringify(m)); } catch (e) { /* 忽略 */ }
    return m;
  }
  function getCycle() { return Object.assign({}, CYCLE_DEF, (getPrefs().cycle || {})); }
  function setCycle(patch) {
    const cur = getCycle();
    const next = Object.assign({}, cur, patch || {});
    if (next.cycleLen == null || next.cycleLen < 7) next.cycleLen = 28;
    if (next.cycleLen > 90) next.cycleLen = 28;
    if (next.periodLen == null || next.periodLen < 1) next.periodLen = 5;
    if (next.periodLen > 20) next.periodLen = 5;
    setPrefs({ cycle: next });
    return next;
  }

  window.DM = window.DM || {};
  window.DM.store = {
    load, save, genId, sortEvents,
    addEvent, updateEvent, removeEvent,
    addCat, updateCat, removeCat, catById, defaultCats: DEFAULT_CATS,
    putPhoto, getPhoto, dropPhotoBlob,
    exportData, importData, sampleEvents,
    setPrefs, getPrefs,
    getMarks, putMark, delMark, getCycle, setCycle,
    getCycles, putCycleRecord, delCycleRecord, clearCycles, resetCycleData, trimBeforeStart
  };
})();
