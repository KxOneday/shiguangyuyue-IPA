/* ============================================================
 * ui.js —— 界面渲染与交互（列表 / 滑动 / 编辑器 / 日历 / 管理）
 * ============================================================ */
'use strict';
(function () {
  const C = () => window.DM.core;
  const S = () => window.DM.store;
  const N = () => window.DM.notify;

  /* ---------- 图标 ---------- */
  const IC = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="16" rx="3.5"/><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6.5 7l1 13a1 1 0 001 .9h7a1 1 0 001-.9l1-13"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20l4.5-1L20 7.5a2 2 0 000-2.8l-.7-.7a2 2 0 00-2.8 0L5 15.5 4 20z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 3l6 6-2.5.5L16 13l4 4-2 2-4-4-4.5 4.5-.5-3L6 13l3-3.5L8.5 6 9 6.5z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M14.5 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9.5 5l7 7-7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5L19.5 7"/></svg>',
    set: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.1"/><circle cx="12" cy="12" r="7.2" stroke-dasharray="1.5 3.2"/></svg>',
    cat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>'
  };
  function icon(name) { return IC[name] || ''; }

  /* ---------- 渐变背景预设 ---------- */
  const GRADS = {
    g1: { css: 'linear-gradient(135deg,#ff9966,#ff5e62)' },
    g2: { css: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
    g3: { css: 'linear-gradient(135deg,#2193b0,#6dd5ed)' },
    g4: { css: 'linear-gradient(135deg,#11998e,#38ef7d)' },
    g5: { css: 'linear-gradient(135deg,#ff512f,#dd2476)' },
    g6: { css: 'linear-gradient(135deg,#141e30,#243b55)' },
    g7: { css: 'linear-gradient(135deg,#ff9a9e,#fad0c4)' },
    spectrum: { css: 'linear-gradient(135deg,#ff9a66,#ff5e62,#c65ce0,#4f8cff)' }
  };
  function colorGrad(h) { h = h || 8; return 'linear-gradient(135deg,hsl(' + h + ',85%,66%),hsl(' + h + ',58%,42%))'; }
  const PALETTE = ['#FF5E5B', '#FFA000', '#29B6F6', '#3D7EF7', '#9C6BFF', '#26C281', '#FF6FB5', '#8E8E93', '#FF3B30', '#FF9500', '#00C7BE', '#A2845E'];

  /* ---------- 小工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
  function soft(c) { return c + '22'; } // 15% alpha 后缀（8 位 hex）

  /* ---------- 状态 ---------- */
  const ui = {
    filter: 'all', q: '', tab: 'home', view: 'list',
    calYM: null, calSel: null, editingId: null,
    draftPhoto: null, // dataURL（新增/替换时）
    el: {}, lastDayStr: '', swipeLockUntil: 0,
    predictingProbs: false // AI怀孕概率预测中
  };
  const TAB_PATHS = {
    home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M9.8 20v-6h4.4v6"/>',
    list: '<path d="M12 20.1S5.2 15.6 3 11.3C1.4 8.2 3.4 5 6.6 5c1.9 0 3.3 1.1 4 2.2L12 8.7l1.4-1.5c.7-1.1 2.1-2.2 4-2.2 3.2 0 5.2 3.2 3.6 6.3-2.2 4.3-9 8.8-9 8.8z"/>',
    cal: '<rect x="4" y="5.5" width="16" height="15" rx="3"/><path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4"/>',
    set: '<circle cx="12" cy="12" r="3.1"/><circle cx="12" cy="12" r="7.4" stroke-dasharray="1.6 3.2"/>'
  };

  /* =========================================================
   * Toast / 确认 / 弹层
   * ========================================================= */
  function toast(text, kind, ms) {
    const box = $('toasts');
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = esc(text);
    box.appendChild(t);
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 300); }, ms || 2600);
    return t;
  }
  function toastUndo(text, fn) {
    const box = $('toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    const b = document.createElement('button');
    b.textContent = '撤销';
    b.onclick = () => { fn(); t.remove(); };
    t.append(document.createTextNode(text), b);
    box.appendChild(t);
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 300); }, 5000);
    return t;
  }

  let pgEl = null;
  function modalOpen() {
    const ov = $('overlay');
    return !!(ov && !ov.hidden && ov.classList.contains('open'));
  }
  function syncLock() { document.body.classList.toggle('lock', !!pgEl || modalOpen()); }

  function openSheet(html) {
    // 独立页面：整页推进，带左右转场
    if (pgEl) pgEl.remove();
    // 底层面板先淡去，避免新页滑入时底下内容“透白”闪烁
    document.body.classList.add('pg-on');
    pgEl = document.createElement('div');
    pgEl.className = 'pg sheet';
    pgEl.style.background = 'var(--bg)';
    pgEl.style.animation = 'pgIn .3s cubic-bezier(.22, .9, .3, 1)';
    pgEl.innerHTML = html;
    document.body.appendChild(pgEl);
    syncLock();
    // 旧版“右上角 ✕”改为页面返回箭头
    pgEl.querySelectorAll('[data-close]').forEach((b) => {
      if (b.classList.contains('x')) { b.classList.add('pg-back'); b.innerHTML = icon('back'); }
    });
    pgEl.addEventListener('click', (e) => {
      const dc = e.target.closest('[data-close]');
      if (dc) closeSheet();
    });
    return pgEl;
  }
  function closeSheet() {
    if (!pgEl) return;
    const el = pgEl;
    pgEl = null;
    // 退出：页面从左往右滑出，同时底层淡回
    document.body.classList.remove('pg-on');
    el.classList.add('pop');
    el.style.animation = 'pgOut .24s ease forwards';
    syncLock();
    setTimeout(() => { el.remove(); }, 260);
  }

  function openModal(html) {
    const ov = $('overlay');
    $('sheet').innerHTML = html;
    ov.hidden = false;
    ov.classList.add('open', 'mid');
    syncLock();
    return ov;
  }
  function closeModal() {
    const ov = $('overlay');
    if (!modalOpen()) return;
    ov.classList.remove('open', 'mid');
    ov.hidden = true;
    $('sheet').innerHTML = '';
    syncLock();
  }

  function confirmDlg(title, msg, okText) {
    return new Promise((res) => {
      const box = openModal(
        '<div class="confirm-box"><h3>' + esc(title) + '</h3><p>' + esc(msg || '') + '</p>' +
        '<div class="btns"><button data-r="0">取消</button><button class="ok" data-r="1">' + esc(okText || '确定') + '</button></div></div>'
      ).querySelector('.confirm-box');
      const done = (v) => { ovClean(); closeModal(); res(v); };
      const mask = box.closest('#overlay').querySelector('.overlay-mask');
      const ovClean = () => {
        box.removeEventListener('click', onBox);
        mask.removeEventListener('click', onMask);
      };
      const onBox = (e) => {
        const v = e.target.getAttribute && e.target.getAttribute('data-r');
        if (v != null) done(v === '1');
      };
      const onMask = () => done(false);
      box.addEventListener('click', onBox);
      mask.addEventListener('click', onMask);
    });
  }

  function promptDlg(title, def, okText) {
    return new Promise((res) => {
      const box = openModal(
        '<div class="confirm-box"><h3>' + esc(title) + '</h3>' +
        '<div style="margin:4px 0 14px"><input id="pmtInp" type="text" style="width:100%;border:0;outline:none;background:var(--card2);border-radius:10px;padding:10px;font-size:15px" value="' + esc(def || '') + '"/></div>' +
        '<div class="btns"><button data-r="0">取消</button><button class="ok" data-r="1" style="background:var(--accent)">' + esc(okText || '确定') + '</button></div></div>'
      ).querySelector('.confirm-box');
      const inp = box.querySelector('#pmtInp');
      const done = (v) => { ovClean(); closeModal(); res(v ? (inp.value || '').trim() : null); };
      const ovClean = () => {
        box.removeEventListener('click', onBox);
        box.removeEventListener('keydown', onKey);
        mask.removeEventListener('click', onMask);
      };
      const mask = box.closest('#overlay').querySelector('.overlay-mask');
      const onBox = (e) => {
        const v = e.target.getAttribute && e.target.getAttribute('data-r');
        if (v != null) done(v === '1');
      };
      const onKey = (e) => { if (e.key === 'Enter') done(true); };
      const onMask = () => done(false);
      box.addEventListener('click', onBox);
      box.addEventListener('keydown', onKey);
      mask.addEventListener('click', onMask);
      setTimeout(() => { inp.focus(); inp.select(); }, 60);
    });
  }

  /* =========================================================
   * 顶栏 / 首屏
   * ========================================================= */
  function renderToday() {
    const info = C().todayLine();
    $('todayline').innerHTML =
      '<span class="td-date">' + esc(info.date) + '<b>·</b><span class="td-week">' + esc(info.week) + '</span></span>' +
      '<span class="td-lunar">' + esc(info.lunar || '') + '</span>';
  }

  function renderChips() {
    const st = S().load();
    const cats = st.cats;
    let h = chip('all', '全部', ui.filter === 'all', null, 'all');
    for (const c of cats) h += chip('c-' + c.id, c.name, ui.filter === c.id, c.color, 'cat');
    $('chips').innerHTML = h;
  }
  function chip(key, label, on, color, kind) {
    const cc = color ? 'style="--cc:' + color + '"' : '';
    const dot = kind === 'cat' ? '<span class="dot"></span>' : '';
    return '<button type="button" class="chip' + (on ? ' on' : '') + (kind === 'cat' ? ' cat' : ' ' + kind) + '" data-f="' + key + '" ' + cc + '>' + dot + esc(label) + '</button>';
  }

  function setIcons() {
    const bS = $('btnSearch'), bV = $('btnView'), bM = $('btnMore'), bA = $('btnAdd'), bC = $('btnCat');
    if (bS) { bS.innerHTML = icon('search'); bS.style.display = ui.tab === 'list' ? '' : 'none'; }
    if (bC) { bC.innerHTML = icon('cat'); bC.className = 'iconbtn'; bC.style.display = ui.tab === 'list' ? '' : 'none'; }
    if (bV) { bV.style.display = 'none'; }
    if (bM) { bM.style.display = 'none'; }
    if (bA) { bA.innerHTML = icon('plus'); bA.className = 'iconbtn'; bA.style.display = ui.tab === 'list' ? '' : 'none'; }
    const fab = $('fab'); if (fab) { fab.innerHTML = icon('plus'); fab.style.display = 'none'; }
    const sc = $('searchClear'); if (sc) sc.innerHTML = icon('close');
    const hp = $('headPanel');
    if (hp) hp.style.display = ui.tab === 'list' ? '' : 'none';
    // 底栏图标与选中态
    document.querySelectorAll('#tabbar svg[data-ic]').forEach((s) => { s.innerHTML = TAB_PATHS[s.dataset.ic] || ''; });
    document.querySelectorAll('#tabbar .tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === ui.tab));
    const sb = $('searchbar');
    if (sb && !sb.hidden && ui.tab !== 'list') sb.hidden = true;
  }

  function filteredEvents() {
    const st = S().load();
    let list = st.events.slice();
    if (ui.q) {
      const q = ui.q.toLowerCase();
      list = list.filter((e) => (e.title || '').toLowerCase().includes(q) || (e.note || '').toLowerCase().includes(q));
    }
    if (ui.filter !== 'all') list = list.filter((e) => e.cat === ui.filter);
    return S().sortEvents(list);
  }

  /* =========================================================
   * 事件卡片
   * ========================================================= */
  function cardHTML(ev) {
    const st = S().catById(ev.cat);
    const state = C().stateOf(ev);
    const cc = st.color;
    const cls = ev.bg === 'img' ? 'm-img' : ev.bg && ev.bg !== 'none' ? 'm-grad' : 'm-plain';

    // 第 2 排：置顶 / 每年 / 农历… 标签
    const chipArr = [];
    if (ev.pinned) chipArr.push('<span class="mini-chip" style="--cc:' + esc(st.color) + '">置顶</span>');
    for (const ch of state.extraChips) chipArr.push('<span class="mini-chip" style="--cc:' + esc(st.color) + '">' + esc(ch) + '</span>');
    const chipsRow = chipArr.length ? '<div class="c-chips">' + chipArr.join('') + '</div>' : '';

    // 第 3 排左侧：本年的日期 + 下方农历小字
    let sub = '';
    if (state.lunarLine) sub = '<span class="lunar">' + esc(state.lunarLine) + '</span>';
    else if (state.pastNice) sub = '<span class="note">' + esc(state.pastNice) + '</span>';

    const daysBlock = state.phase === 'today'
      ? '<div class="c-days c-today"><span class="c-todaytxt">就是今天 🎉</span></div>'
      : state.num == null
        ? '<div class="c-days"></div>'
        : '<div class="c-days"><span class="c-kw">' + esc(state.kw) + '</span><span class="c-num">' + esc(String(state.num)) + '</span><span class="c-unit">天</span></div>';

    return '<article class="card ' + cls + '" data-id="' + ev.id + '" data-k="card" style="--cc:' + esc(cc) + ';--ccs:' + soft(cc) + '">' +
      '<div class="c-bg" data-bg></div>' +
      '<div class="c-inner">' +
      '<div class="c-row1">' +
      '<span class="c-icon">' + esc(st.icon || '📅') + '</span>' +
      '<div class="c-title"><span class="t">' + esc(ev.title) + '</span></div>' +
      '<button class="c-more" type="button" data-k="more" aria-label="更多">' + icon('more') + '</button>' +
      '</div>' +
      chipsRow +
      '<div class="c-foot">' +
      '<div class="c-left"><span class="c-date">' + esc(state.dateLine) + '</span>' + (sub ? sub : '') + '</div>' +
      daysBlock +
      '</div>' +
      '</div>' +
      '<div class="c-actions"><button type="button" class="c-edit" data-k="edit">' + icon('edit') + '编辑</button><button type="button" class="c-del" data-k="del">' + icon('trash') + '删除</button></div>' +
      '</article>';
  }

  function applyCardBg(card, ev) {
    const bg = card.querySelector('[data-bg]');
    if (!bg) return;
    if (ev.bg === 'img') {
      S().getPhoto(ev.id).then((url) => {
        if (url && bg) bg.style.backgroundImage = 'url("' + url + '")';
      });
    } else if (ev.bg === 'custom') {
      bg.style.backgroundImage = colorGrad(ev.bgHue || 8);
    } else if (ev.bg && ev.bg !== 'none' && GRADS[ev.bg]) {
      bg.style.backgroundImage = GRADS[ev.bg].css;
    } else if (ev.bg && ev.bg !== 'none') {
      bg.style.backgroundImage = colorGrad(8);
    }
  }

  function renderList() {
    const list = filteredEvents();
    const el = $('content');
    if (!list.length) {
      const st = S().load();
      const empty = st.events.length === 0
        ? '<div class="empty"><div class="big">🗓️</div><h2>还没有事件</h2><p>新建一个倒计时或纪念日，开始记录吧</p>' +
          '<button class="btn" id="emptyAdd" type="button">新建事件</button></div>'
        : '<div class="empty"><div class="big">🔍</div><h2>没有匹配的事件</h2><p>换个筛选条件或清空搜索试试</p></div>';
      el.innerHTML = empty;
      const add = $('emptyAdd'); if (add) add.onclick = () => openEditor(null);
      return;
    }
    el.innerHTML = list.map(cardHTML).join('');
    for (const card of el.children) {
      const ev = list.find((e) => e.id === card.dataset.id);
      if (ev) applyCardBg(card, ev);
    }
  }

  /* ---------- 滑动删除 ---------- */
  function wireSwipes() {
    const content = $('content');
    content.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      if (e.target.closest('button')) return;
      const x0 = e.clientX, y0 = e.clientY, t0 = Date.now();
      const move = (ev) => { /* 占位，简单判定 */ };
      const up = (ev) => {
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        content.removeEventListener('pointermove', move);
        content.removeEventListener('pointerup', up);
        content.removeEventListener('pointercancel', up);
        if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
        const all = content.querySelectorAll('.card.swipe-open');
        all.forEach((c) => c !== card && c.classList.remove('swipe-open'));
        if (dx < -30) { card.classList.add('swipe-open'); ui.swipeLockUntil = Date.now() + 400; }
        else card.classList.remove('swipe-open');
      };
      content.addEventListener('pointermove', move);
      content.addEventListener('pointerup', up);
      content.addEventListener('pointercancel', up);
    });
  }

  /* ---------- iOS 左边缘右滑返回 ---------- */
  function wireSwipeBack() {
    let startX = 0, startY = 0, tracking = false;
    const EDGE = 25;
    const THRESHOLD = 70;
    document.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (t.clientX < EDGE) { tracking = true; startX = t.clientX; startY = t.clientY; }
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      const t = e.touches[0];
      const dx = t.clientX - startX, dy = Math.abs(t.clientY - startY);
      if (dx > 10 && dx > dy) e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX, dy = Math.abs(t.clientY - startY);
      if (dx > THRESHOLD && dy < dx) {
        if (pgEl) closeSheet();
        else if (window.history.length > 1) window.history.back();
      }
    });
  }

  /* =========================================================
   * 事件操作
   * ========================================================= */
  function openCardMenu(ev) {
    const row = (emoji, label, fn, danger) => {
      const d = document.createElement('button');
      d.className = 'si' + (danger ? ' danger' : '');
      d.innerHTML = '<span class="ic">' + emoji + '</span><span class="lb">' + esc(label) + '</span>';
      d.onclick = () => { closeSheet(); fn(); };
      return d;
    };
    const sheetEl = openSheet('<div class="sh"><div class="t">' + esc(ev.title) + '</div><button class="x" data-close="1">' + icon('close') + '</button></div><div class="slist" id="menuList"></div>');
    const box = sheetEl.querySelector('#menuList');
    box.appendChild(row('✏️', '编辑', () => openEditor(ev.id)));
    box.appendChild(row(ev.pinned ? '📌' : '📍', ev.pinned ? '取消置顶' : '置顶', () => { ev.pinned = !ev.pinned; S().updateEvent(ev); renderAll(); toast(ev.pinned ? '已置顶' : '已取消置顶'); }));
    box.appendChild(row('📋', '复制创建一个', () => {
      const cp = Object.assign({}, ev, { id: undefined, ctime: Date.now(), title: ev.title + '（副本）', pinned: false, bg: ev.bg === 'img' ? 'none' : ev.bg });
      delete cp.id;
      S().addEvent(cp);
      renderAll();
      toast('已创建副本');
    }));
    box.appendChild(row('🗑', '删除', async () => {
      const ok = await confirmDlg('删除事件', '确定删除「' + ev.title + '」吗？', '删除');
      if (ok) removeWithUndo(ev);
    }, true));
  }

  function removeWithUndo(ev) {
    S().removeEvent(ev.id);
    renderAll();
    toastUndo('已删除「' + ev.title + '」', () => { S().addEvent(ev); renderAll(); });
  }

  function deleteById(id) {
    const ev = S().load().events.find((e) => e.id === id);
    if (ev) removeWithUndo(ev);
  }

  /* =========================================================
   * 编辑器
   * ========================================================= */
  function blankDraft() {
    const t = C().todayMid();
    return { title: '', note: '', cat: 'ji', pinned: false, cal: 'solar', y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate(), lm: 5, ld: 5, lLeap: false, ly: null, repeat: false, anniversary: false, bg: 'custom', bgHue: 8, remind: null };
  }

  function openEditor(id, presetDate) {
    const st = S().load();
    const ev = id ? st.events.find((e) => e.id === id) : null;
    const d = ev ? JSON.parse(JSON.stringify(ev)) : blankDraft();
    ui.editingId = id || null;
    ui.draftPhoto = null;
    if (presetDate && !ev) { d.y = presetDate.getFullYear(); d.m = presetDate.getMonth() + 1; d.d = presetDate.getDate(); }
    const editing = !!ev;

    const sheetHtml =
      '<div class="ed-top">' +
      '<button class="ed-back" data-close="1" type="button" aria-label="返回">' + icon('back') + '</button>' +
      '<div class="ed-title">' + (editing ? '编辑日子' : '添加新日子') + '</div>' +
      '<button class="ed-save-top" id="edSaveTop" type="button">保存</button>' +
      '</div>' +
      '<div class="ed-body">' +

      '<div class="ed-group name-block"><div class="ct"><input id="edTitle" type="text" maxlength="80" placeholder="点击这里输入事件名称" value="' + esc(d.title) + '"/></div></div>' +

      '<div class="ed-group">' +
      '<div class="ed-row target-row"><span class="lb">目标日</span><div class="ct">' +
      '<div class="seg ed-cal-seg" id="edCalSeg">' +
      '<button type="button" class="' + (d.cal === 'solar' ? 'on' : '') + '" data-cal="solar">公历</button>' +
      '<button type="button" class="' + (d.cal === 'lunar' ? 'on' : '') + '" data-cal="lunar">农历</button></div>' +
      '<div class="ed-target-text" id="edTargetText"></div>' +
      '</div></div>' +
      '<div class="ed-row" id="rowLeap"' + (d.cal === 'lunar' ? '' : ' style="display:none"') + '><span class="lb">闰月</span><div class="ct"><button class="switch' + (d.lLeap ? ' on' : '') + '" id="edLeap" type="button" aria-label="闰月"></button></div></div>' +
      '<div class="ed-wheel" id="edWheel">' +
      '<div class="wheel-col" id="edWheelY"></div>' +
      '<div class="wheel-col" id="edWheelM"></div>' +
      '<div class="wheel-col" id="edWheelD"></div>' +
      '<div class="wheel-glass"></div>' +
      '</div>' +
      '<div class="ed-wheel-hint">选择未来日期倒数，选择过去日期正数</div>' +
      '<div class="ed-preview" id="edPreview"></div>' +
      '</div>' +

      '<div class="ed-group">' +
      '<div class="ed-row" id="edCatRow"><span class="lb">分类</span><div class="ct cat-pick" id="edCatPick">' +
      '<span class="cat-ic" id="edCatIc" style="--cc:' + esc(S().catById(d.cat).color) + '">' + esc(S().catById(d.cat).icon || '📅') + '</span>' +
      '<span class="cat-nm" id="edCatNm">' + esc(S().catById(d.cat).name) + '</span>' +
      '<span class="chev">›</span>' +
      '</div></div>' +
      '<div class="ed-cat-list" id="edCatList" hidden>' +
      st.cats.map((c) => '<button type="button" class="cat-row' + (d.cat === c.id ? ' on' : '') + '" data-cat="' + c.id + '" style="--cc:' + c.color + '"><span class="dot"></span><span class="cn">' + esc(c.name) + '</span></button>').join('') +
      '<button type="button" class="cat-row mgmt" id="edCatMgmt"><span class="cn">＋ 管理分类</span></button>' +
      '</div>' +
      '<div class="ed-row"><span class="lb">卡片背景</span><div class="ct">' +
      '<button type="button" class="bg-tile spec' + (d.bg === 'img' ? '' : ' on') + '" id="edBgSpec" style="background:' + colorGrad(d.bgHue || 8) + '" aria-label="色样（自定义颜色）"><span class="lab">色样</span><span class="tick">' + icon('check') + '</span></button>' +
      '<div class="ed-bg-legend" id="edImgHint"' + (d.bg === 'img' ? '' : ' style="display:none"') + '>当前为旧版“图片”背景，选择“色样”后将变为纯色（原图不可恢复）。</div>' +
      '</div></div>' +
      '<div class="ed-row bg-spec-row" id="edBgPanel"' + (d.bg === 'img' ? ' style="display:none"' : '') + '><span class="lb">颜色</span><div class="ct"><input type="range" id="edBgHue" min="0" max="360" step="1" value="' + (d.bgHue || 8) + '" aria-label="选择颜色" /></div></div>' +
      '</div>' +

      '<div class="ed-group">' +
      '<div class="ed-row"><button class="row-switch" id="edPinRow" type="button"><span class="l">置顶<small>始终排在最前面</small></span><span class="switch' + (d.pinned ? ' on' : '') + '" id="edPin"></span></button></div>' +
      '<div class="ed-row"><button class="row-switch" id="edRepeatRow" type="button"><span class="l">每年重复<small>节日 / 生日每年提醒；关闭后只按所选日期算一次</small></span><span class="switch' + (d.repeat ? ' on' : '') + '" id="edRepeat"></span></button></div>' +
      '</div>' +

      '<div class="ed-group">' +
      '<div class="ed-row"><span class="lb">定期提醒</span><div class="ct remind-ct">' +
      '<select id="edRemindAdv" class="remelect" aria-label="提前天数"></select>' +
      '<span class="tm"><select id="edRemindHour" class="remelect" aria-label="小时"></select><span class="colon">:</span><select id="edRemindMin" class="remelect" aria-label="分钟"></select></span>' +
      '</div></div>' +
      '</div>' +

      '<button class="save-btn" id="edSave" type="button">保存</button>' +
      (editing ? '<button class="ed-del" id="edDel" type="button">删除该日子</button>' : '') +
      '</div>';

    const sheetEl = openSheet(sheetHtml);
    sheetEl.classList.add('editor');

    /* 交互接线 */
    const F = (id) => sheetEl.querySelector('#' + id);

    // 分类管理返回时恢复已输入内容
    if (ui._restoreText) {
      const rt = ui._restoreText;
      const ti = F('edTitle'), nt = F('edNote');
      if (ti && rt.title != null) ti.value = rt.title;
      if (nt && rt.note != null) nt.value = rt.note;
      ui._restoreText = null;
    }

    // 名称行焦点
    // 转场结束再聚焦输入框，避免滑入瞬间弹键盘/闪白
    setTimeout(() => { const ti = F('edTitle'); if (ti && !document.hidden) ti.focus(); }, 340);

    // 滚轮数据（目标日：公历/农历三列滚轮，样式仿 Days Matter）
    const lu = window.DM.lunar;
    const ITEM_H = 48;
    const WEEK = C().WEEK_CN;
    const lunarToday = () => {
      const t = C().todayMid();
      try { return lu.solarToLunar(t.getFullYear(), t.getMonth() + 1, t.getDate()); } catch (e) { return null; }
    };
    const ensureLunarYear = () => { if (!d.ly || !lu.inRange(d.ly)) { const lt = lunarToday(); d.ly = lt ? lt.lYear : new Date().getFullYear(); } d.ly = parseInt(d.ly, 10) || new Date().getFullYear(); };

    const getYy = () => (d.cal === 'lunar' ? d.ly : d.y);
    const getMm = () => (d.cal === 'lunar' ? d.lm : d.m);
    const getDd = () => (d.cal === 'lunar' ? d.ld : d.d);
    const setYy = (v) => { if (d.cal === 'lunar') d.ly = v; else d.y = v; };
    const setMm = (v) => { if (d.cal === 'lunar') d.lm = v; else d.m = v; };
    const setDd = (v) => { if (d.cal === 'lunar') d.ld = v; else d.d = v; };

    const dayCount = () => {
      if (d.cal === 'solar') return C().daysInMonth(d.y, d.m);
      if (lu.inRange(d.ly)) { const n = lu.monthDayCount(d.ly, d.lm, !!d.lLeap); return n || 30; }
      return 30;
    };
    const yLabels = () => { const a = []; for (let y = 1900; y <= 2100; y++) a.push(d.cal === 'lunar' ? (y + lu.ganzhiOf(y)) : (y + '年')); return a; };
    const mLabels = () => { if (d.cal === 'lunar') return lu.MONTH_NAMES.slice(); const a = []; for (let m = 1; m <= 12; m++) a.push(m + '月'); return a; };
    const dLabels = () => { const c = dayCount(); const a = []; for (let i = 1; i <= c; i++) a.push(d.cal === 'lunar' ? lu.dayName(i) : (i + '日')); return a; };

    const OFFSET = 2; // 每列首尾各 2 个透明占位行，保证第一/最后一个值也能居中显示
    function setCol(colId, labels, idx, onPick) {
      const col = F(colId); if (!col) return;
      const WH = 240; // 与 CSS .ed-wheel 高度一致
      const maxScroll = Math.max(0, (labels.length + OFFSET * 2) * ITEM_H - WH);
      const pad = '<div class="witem pad"></div>';
      col.innerHTML = pad.repeat(OFFSET) +
        labels.map((t, i) => '<div class="witem' + (i === idx ? ' cur' : '') + '" data-i="' + i + '">' + esc(t) + '</div>').join('') +
        pad.repeat(OFFSET);
      col._labels = labels; col._cur = idx;
      // 滚动到使 idx 这项正对中间（前面 OFFSET 个占位把首项也顶到中间）
      col.scrollTop = Math.max(0, Math.min(maxScroll, idx * ITEM_H));
      col.onscroll = () => {
        // 顶部 OFFSET 个占位使“第 idx 行”恰好居中时 scrollTop = idx*ITEM_H
        const i2 = Math.max(0, Math.min(col._labels.length - 1, Math.round(col.scrollTop / ITEM_H)));
        if (i2 === col._cur) return;
        col._cur = i2;
        const items = col.children;
        for (let k = 0; k < items.length; k++) items[k].classList.toggle('cur', k === i2 + OFFSET);
        if (onPick) onPick(i2);
      };
      col.onclick = (e) => {
        const t = e.target.closest ? e.target.closest('.witem[data-i]') : null;
        if (!t) return;
        const i = parseInt(t.dataset.i, 10);
        col.scrollTop = Math.max(0, Math.min(maxScroll, i * ITEM_H));
        if (onPick) onPick(i);
      };
    }

    function updateTargetText() {
      const t = F('edTargetText'); if (!t) return;
      if (d.cal === 'solar') {
        const w = WEEK[C().dateOf(d.y, d.m, d.d).getDay()];
        t.textContent = d.y + '年' + d.m + '月' + d.d + '日 ' + w;
      } else {
        t.textContent = lu.ganzhiOf(d.ly) + '（' + d.ly + '）' + lu.monthName(d.lm, d.lLeap) + lu.dayName(d.ld);
      }
    }
    function rebuildDay() {
      const labels = dLabels();
      let dd = Math.min(getDd(), labels.length); setDd(dd);
      setCol('edWheelD', labels, dd - 1, (i) => { setDd(i + 1); updateTargetText(); updatePreview(); });
    }
    function rebuildAll() {
      setCol('edWheelY', yLabels(), getYy() - 1900, (yy) => { setYy(1900 + yy); rebuildDay(); updateTargetText(); updatePreview(); });
      setCol('edWheelM', mLabels(), getMm() - 1, (mm) => { setMm(mm + 1); rebuildDay(); updateTargetText(); updatePreview(); });
      rebuildDay();
      updateTargetText();
    }

    ['solar', 'lunar'].forEach((v) => {
      F('edCalSeg').querySelector('[data-cal="' + v + '"]').onclick = () => {
        if (v !== d.cal) {
          d.cal = v;
          F('edCalSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.cal === v));
          F('rowLeap').style.display = v === 'lunar' ? '' : 'none';
          if (v === 'lunar') {
            ensureLunarYear();
            if (!d.lm) { const lt = lunarToday(); if (lt) { d.lm = lt.lMonth; d.ld = lt.lDay; d.lLeap = lt.isLeap; const ls = F('edLeap'); if (ls) ls.classList.toggle('on', d.lLeap); } }
          }
          rebuildAll();
          updatePreview();
        }
      };
    });
    F('edLeap').onclick = () => { d.lLeap = !d.lLeap; F('edLeap').classList.toggle('on', d.lLeap); rebuildDay(); updatePreview(); };
    ensureLunarYear();
    rebuildAll();

    // 分类（倒数本行）
    const catRow = F('edCatRow'), catList = F('edCatList');
    const renderCat = () => {
      const c = S().catById(d.cat);
      const ic = F('edCatIc'), nm = F('edCatNm');
      if (ic) { ic.textContent = c.icon || '📅'; ic.style.setProperty('--cc', c.color); }
      if (nm) nm.textContent = c.name;
    };
    if (catRow) catRow.onclick = () => { if (catList) catList.hidden = !catList.hidden; };
    if (catList) catList.querySelectorAll('.cat-row[data-cat]').forEach((b) => {
      b.onclick = () => {
        d.cat = b.dataset.cat;
        catList.querySelectorAll('.cat-row[data-cat]').forEach((x) => x.classList.toggle('on', x.dataset.cat === d.cat));
        renderCat(); catList.hidden = true;
      };
    });
    const cm = F('edCatMgmt');
    if (cm) cm.onclick = () => { ui._restoreText = { title: F('edTitle').value, note: null }; openCatManage(true); };
    renderCat();

    // 背景：光谱（自定义颜色）/ 照片
    if (!d.bgHue && d.bg !== 'img') d.bgHue = 8;
    const spec = F('edBgSpec'), bgPanel = F('edBgPanel'), hueIn = F('edBgHue'), imgHint = F('edImgHint');
    const syncBg = () => {
      const isImg = d.bg === 'img';
      if (spec) { spec.classList.toggle('on', !isImg); spec.style.background = colorGrad(d.bgHue || 8); }
      if (bgPanel) bgPanel.style.display = isImg ? 'none' : '';
      if (imgHint) imgHint.style.display = isImg ? '' : 'none';
      if (hueIn && !isImg) hueIn.value = d.bgHue || 8;
    };
    // 点“色样”/拉颜色条：旧图片背景会转为自定义颜色
    if (spec) spec.onclick = () => { d.bg = 'custom'; syncBg(); };
    if (hueIn) hueIn.oninput = () => { d.bg = 'custom'; d.bgHue = +hueIn.value || 8; if (spec) spec.style.background = colorGrad(d.bgHue); };
    if (hueIn) hueIn.onchange = () => { d.bg = 'custom'; };
    syncBg();

    // 开关（直接读写 d 字段，便于预览/保存实时反映）
    const swRow = (rowId, swId, field) => {
      const row = F(rowId), sw = F(swId);
      const set = (v) => { d[field] = v; if (sw) sw.classList.toggle('on', v); };
      set(!!d[field]);
      row.onclick = (e) => { if (e.target === sw) return; set(!d[field]); updatePreview(); };
      sw.onclick = (e) => { e.stopPropagation(); set(!d[field]); updatePreview(); };
    };
    swRow('edPinRow', 'edPin', 'pinned');
    swRow('edRepeatRow', 'edRepeat', 'repeat');
    function updateRepeatUI() {
      const sw = F('edRepeat');
      if (sw) sw.classList.toggle('on', !!d.repeat);
      const row = F('edRepeatRow');
      if (row) { row.style.opacity = 1; row.style.pointerEvents = 'auto'; }
    }
    F('edSaveTop').onclick = () => { const s = F('edSave'); if (s) s.click(); };

    // 提醒（24 小时制）
    const advOpts =
      '<option value=""' + (d.remind ? '' : ' selected') + '>不提醒</option>' +
      '<option value="0"' + (d.remind && d.remind.adv === 0 ? ' selected' : '') + '>当天</option>' +
      '<option value="1"' + (d.remind && d.remind.adv === 1 ? ' selected' : '') + '>提前 1 天</option>' +
      '<option value="3"' + (d.remind && d.remind.adv === 3 ? ' selected' : '') + '>提前 3 天</option>' +
      '<option value="7"' + (d.remind && d.remind.adv === 7 ? ' selected' : '') + '>提前 7 天</option>';
    F('edRemindAdv').innerHTML = advOpts;
    let hOpts = '', mOpts = '';
    for (let h = 0; h < 24; h++) { const hh = String(h).padStart(2, '0'); hOpts += '<option value="' + hh + '"' + (d.remind && d.remind.hh === hh ? ' selected' : '') + '>' + hh + '</option>'; }
    for (let mi = 0; mi < 60; mi++) { const mm = String(mi).padStart(2, '0'); mOpts += '<option value="' + mm + '"' + (d.remind && d.remind.mm === mm ? ' selected' : '') + '>' + mm + '</option>'; }
    F('edRemindHour').innerHTML = hOpts;
    F('edRemindMin').innerHTML = mOpts;
    const syncRemind = () => {
      const v = F('edRemindAdv').value;
      const dis = v === '';
      F('edRemindHour').disabled = dis;
      F('edRemindMin').disabled = dis;
      if (v === '') d.remind = null;
      else d.remind = { adv: parseInt(v, 10), hh: F('edRemindHour').value || '09', mm: F('edRemindMin').value || '00' };
    };
    F('edRemindAdv').onchange = syncRemind;
    F('edRemindHour').onchange = syncRemind;
    F('edRemindMin').onchange = syncRemind;
    if (!d.remind) { F('edRemindHour').value = '09'; F('edRemindMin').value = '00'; }
    syncRemind();

    function updatePreview() {
      const p = F('edPreview');
      if (!p) return;
      const lu2 = window.DM.lunar;
      const today = C().todayMid();
      try {
        if (d.cal === 'solar') {
          const dt = C().dateOf(d.y, d.m, d.d);
          const diff = C().dayDiff(dt, today);
          p.className = 'ed-preview';
          p.textContent = C().fmtCNYMD(dt) + ' · 距今' + (diff >= 0 ? (diff === 0 ? '就是今天' : '还有 ' + diff + ' 天') : (d.anniversary ? '第 ' + (-diff + 1) + ' 天' : '已过 ' + (-diff) + ' 天'));
        } else {
          // 农历：开启“每年重复”→ 每年提醒；关闭 → 按所选农历年份一次性
          if (d.repeat) {
            let found = null;
            for (let gy = today.getFullYear(); gy <= today.getFullYear() + 5 && !found; gy++) {
              const s = C().lunarDateInYear({ cal: 'lunar', lm: d.lm, ld: d.ld, lLeap: d.lLeap }, gy);
              if (s) { const diff = C().dayDiff(s, today); if (diff >= 0) { found = { dt: s, diff }; break; } }
            }
            if (found) {
              p.className = 'ed-preview';
              p.textContent = '每年重复 · 农历' + lu2.monthName(d.lm, d.lLeap) + lu2.dayName(d.ld) + ' ≈ 公历' + C().fmtCN(found.dt) + ' · ' + (found.diff === 0 ? '就是今天' : '还有 ' + found.diff + ' 天');
            } else {
              p.className = 'ed-preview err';
              p.textContent = '⚠️ 农历' + lu2.monthName(d.lm, d.lLeap) + '没有' + lu2.dayName(d.ld) + '（如无三十的月份），请调整日期';
            }
          } else {
            if (!d.ly || !lu2.inRange(d.ly)) {
              p.className = 'ed-preview err';
              p.textContent = '⚠️ 请选择农历年份（1900–2100）';
            } else {
              const s = lu2.lunarToSolar(d.ly, d.lm, d.ld, !!d.lLeap);
              if (!s) {
                p.className = 'ed-preview err';
                p.textContent = '⚠️ ' + d.ly + '年没有该农历日期' + (d.lLeap ? '（该年无此闰月）' : '（当月无此日）') + '，请调整';
              } else {
                const dt = C().dateOf(s.y, s.m, s.d);
                const diff = C().dayDiff(dt, today);
                p.className = 'ed-preview';
                p.textContent = '农历' + d.ly + '年' + lu2.monthName(d.lm, d.lLeap) + lu2.dayName(d.ld) + ' ≈ 公历' + C().fmtCNYMD(dt) + ' · 距今' + (diff >= 0 ? (diff === 0 ? '就是今天' : '还有 ' + diff + ' 天') : (d.anniversary ? '已是第 ' + (-diff + 1) + ' 天' : '已过 ' + (-diff) + ' 天')) + '（一次性）';
              }
            }
          }
        }
      } catch (e) { p.textContent = ''; }
    }
    updateRepeatUI();
    updatePreview();

    // 保存
    F('edSave').onclick = async () => {
      const title = F('edTitle').value.trim();
      if (!title) { toast('请填写事件名称', 'err'); F('edTitle').focus(); return; }
      d.title = title;
      if (d.cal === 'solar') { delete d.lm; delete d.ld; delete d.lLeap; delete d.ly; }
      else {
        delete d.y; delete d.m; delete d.d;
        ensureLunarYear();
        if (!d.repeat) {
          const lu2 = window.DM.lunar;
          const chk = lu2.inRange(d.ly) ? lu2.lunarToSolar(d.ly, d.lm, d.ld, !!d.lLeap) : null;
          if (!chk) {
            toast('所选农历日期在 ' + d.ly + ' 年不存在，请调整年份/月/日，或开启“每年重复”', 'err');
            return;
          }
        }
      }

      // 图片：切走 img 时清理旧图；切到 img 时写入
      const s = S().load();
      const old = editing ? s.events.find((e) => e.id === ev.id) : null;
      if (d.bg === 'img' && !ui.draftPhoto && !(editing && old && old.bg === 'img')) {
        toast('已选择“图片”背景，请先点 📷 按钮选择一张图片', 'err');
        return;
      }
      const finalEv = Object.assign({}, old, d);
      if (editing) {
        if (d.bg !== 'img' && old && old.bg === 'img') S().dropPhotoBlob('p_' + old.id);
        if (d.bg === 'img' && ui.draftPhoto) await S().putPhoto(finalEv.id || old.id, ui.draftPhoto);
        S().updateEvent(finalEv);
      } else {
        const created = S().addEvent(finalEv);
        if (d.bg === 'img' && ui.draftPhoto) await S().putPhoto(created.id, ui.draftPhoto);
      }
      closeSheet();
      renderAll();
      toast('已保存');
      window.DM.ui.syncReminders();
    };

    if (editing) F('edDel').onclick = async () => {
      const ok = await confirmDlg('删除事件', '确定删除「' + ev.title + '」吗？', '删除');
      if (ok) { closeSheet(); removeWithUndo(ev); }
    };
  }

  function compressImage(dataUrl, cb) {
    const img = new Image();
    img.onload = () => {
      const MAX = 1080;
      let { width: w, height: h } = img;
      if (w > MAX || h > MAX) {
        const r = MAX / Math.max(w, h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      try { cb(cv.toDataURL('image/jpeg', 0.82)); } catch (e) { cb(dataUrl); }
    };
    img.onerror = () => cb(dataUrl);
    img.src = dataUrl;
  }

  /* =========================================================
   * 分类管理
   * ========================================================= */
  function openCatManage(backToEditor) {
    const sheetEl = openSheet(
      '<div class="ed-top">' +
      '<button class="ed-back" id="cmBack" type="button" aria-label="返回">' + icon('back') + '</button>' +
      '<div class="ed-title">分类管理</div>' +
      '<button class="ed-save-top" id="cmDone" type="button">完成</button>' +
      '</div>' +
      '<div class="ed-body">' +
      '<p class="cat-hint">点「✎」改名（行内编辑），点「🗑」立即删除（该分类下的事件会自动归入其它分类，可撤销）。</p>' +
      '<div class="ed-group" id="cmList"></div>' +
      '<div class="cat-new">' +
      '<div class="cn-head">' +
      '<div class="cn-preview" id="cmPreview">⭐</div>' +
      '<input id="cmName" maxlength="8" placeholder="新分类名称，如：健身"/>' +
      '<input class="icn" id="cmIco" maxlength="2" placeholder="图标"/>' +
      '</div>' +
      '<div class="cols" id="cmCols"></div>' +
      '<button class="cat-ok" id="cmOk" type="button">添加分类</button>' +
      '</div>' +
      '</div>'
    );
    sheetEl.classList.add('mg');
    const listEl = sheetEl.querySelector('#cmList');
    function rowHTML(c) {
      const n = S().load().events.filter((e) => e.cat === c.id).length;
      return '<div class="cm-row" data-id="' + c.id + '" style="--cc:' + c.color + '">' +
        '<span class="cm-ic">' + esc(c.icon || '⭐') + '</span>' +
        '<span class="cm-main"><span class="cm-name">' + esc(c.name) + '</span><span class="cm-sub">' + n + ' 个事件</span></span>' +
        '<button type="button" class="cm-act ren" aria-label="改名">' + icon('edit') + '</button>' +
        '<button type="button" class="cm-act del" aria-label="删除">' + icon('trash') + '</button>' +
        '</div>' +
        '<div class="cm-edit" data-id="' + c.id + '" hidden>' +
        '<input class="cm-einp" maxlength="8" value="' + esc(c.name) + '" placeholder="分类名"/>' +
        '<input class="cm-eicn" maxlength="2" value="' + esc(c.icon || '') + '" placeholder="图标"/>' +
        '<div class="cm-ecols" data-id="' + c.id + '"></div>' +
        '<button type="button" class="cm-eok">保存</button>' +
        '<button type="button" class="cm-ecancel">取消</button>' +
        '</div>';
    }
    function paint(openEditId) {
      const st2 = S().load();
      listEl.innerHTML = (st2.cats.map(rowHTML).join('')) || '<p class="cm-empty">暂无分类，先在下方添加一个吧</p>';
      st2.cats.forEach((c) => {
        const box = listEl.querySelector('.cm-ecols[data-id="' + c.id + '"]');
        if (!box) return;
        PALETTE.forEach((p) => {
          const b = document.createElement('button');
          b.type = 'button'; b.style.background = p; b.dataset.c = p;
          b.classList.toggle('on', p.toUpperCase() === c.color.toUpperCase());
          box.appendChild(b);
        });
      });
      if (openEditId) { const ed = listEl.querySelector('.cm-edit[data-id="' + openEditId + '"]'); if (ed) ed.hidden = false; }
    }
    paint();

    // 添加新分类
    const colsEl = sheetEl.querySelector('#cmCols');
    const preview = sheetEl.querySelector('#cmPreview');
    PALETTE.forEach((p) => { const b = document.createElement('button'); b.type = 'button'; b.style.background = p; b.dataset.c = p; colsEl.appendChild(b); });
    colsEl.querySelector('button').classList.add('on');
    preview.style.setProperty('--cc', PALETTE[0]);
    colsEl.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      colsEl.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      preview.style.setProperty('--cc', b.dataset.c);
    });
    sheetEl.querySelector('#cmIco').addEventListener('input', (e) => {
      preview.textContent = e.target.value.trim() || '⭐';
    });
    sheetEl.querySelector('#cmOk').onclick = () => {
      const nm = sheetEl.querySelector('#cmName').value.trim();
      if (!nm) { toast('请输入分类名称', 'err'); return; }
      const col = colsEl.querySelector('.on') ? colsEl.querySelector('.on').dataset.c : PALETTE[0];
      const ic = sheetEl.querySelector('#cmIco').value.trim() || '⭐';
      S().addCat({ id: 'c' + Date.now().toString(36), name: nm, color: col, icon: ic });
      sheetEl.querySelector('#cmName').value = ''; sheetEl.querySelector('#cmIco').value = '';
      preview.textContent = '⭐'; preview.style.setProperty('--cc', PALETTE[0]);
      colsEl.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      colsEl.querySelector('button').classList.add('on');
      paint(); renderChips(); toast('已添加分类');
    };

    // 行内操作：改名 / 删除 / 保存 / 取消 / 选色
    listEl.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('.cm-act.del')) { e.stopPropagation(); doDel(t.closest('.cm-act.del')); return; }
      if (t.closest('.cm-act.ren')) { e.stopPropagation(); doRename(t.closest('.cm-act.ren')); return; }
      if (t.closest('.cm-eok')) { e.stopPropagation(); saveEdit(t.closest('.cm-eok')); return; }
      if (t.closest('.cm-ecancel')) { e.stopPropagation(); closeEdit(t.closest('.cm-ecancel')); return; }
      const cb = t.closest('.cm-ecols button');
      if (cb) { e.stopPropagation(); const box = cb.parentElement; box.querySelectorAll('button').forEach((x) => x.classList.remove('on')); cb.classList.add('on'); return; }
    });
    function doDel(btn) {
      const row = btn.closest('.cm-row'); if (!row) return;
      const c = S().load().cats.find((x) => x.id === row.dataset.id); if (!c) return;
      S().removeCat(c.id);
      renderChips(); paint();
      toastUndo('已删除分类「' + c.name + '」', () => { S().addCat(c); renderChips(); paint(); });
    }
    function doRename(btn) {
      const row = btn.closest('.cm-row'); const id = row && row.dataset.id; if (!id) return;
      listEl.querySelectorAll('.cm-edit').forEach((x) => { x.hidden = true; });
      const ed = listEl.querySelector('.cm-edit[data-id="' + id + '"]'); if (ed) ed.hidden = false;
    }
    function closeEdit(btn) { const ed = btn.closest('.cm-edit'); if (ed) ed.hidden = true; }
    function saveEdit(btn) {
      const ed = btn.closest('.cm-edit'); if (!ed) return;
      const id = ed.dataset.id;
      const c = S().load().cats.find((x) => x.id === id); if (!c) return;
      const name = (ed.querySelector('.cm-einp').value || '').trim();
      if (!name) { toast('名称不能为空', 'err'); return; }
      const icon = (ed.querySelector('.cm-eicn').value || '').trim() || c.icon || '⭐';
      const colBtn = ed.querySelector('.cm-ecols button.on');
      const color = colBtn ? colBtn.dataset.c : c.color;
      S().updateCat(Object.assign({}, c, { name, color, icon }));
      ed.hidden = true; paint(); renderChips();
    }

    const backBtn = sheetEl.querySelector('#cmBack'), doneBtn = sheetEl.querySelector('#cmDone');
    if (backToEditor) {
      const reopen = () => { closeSheet(); const id = ui.editingId; ui.editingId = null; openEditor(id); };
      backBtn.onclick = reopen; doneBtn.onclick = reopen;
    } else {
      backBtn.onclick = () => closeSheet();
      doneBtn.onclick = () => closeSheet();
    }
  }

  /* =========================================================
   * 更多菜单 / 设置 / 备份
   * ========================================================= */
  function openMoreMenu() {
    const sheetEl = openSheet(
      '<div class="sh"><div class="t">更多</div><button class="x" data-close="1">' + icon('close') + '</button></div>' +
      '<div class="slist" id="menuList">' +
      si('🗂', '分类管理', 'openCat') +
      si('🎨', '外观与主题', 'theme') +
      si('💾', '备份与恢复', 'backup') +
      si('ℹ️', '关于本应用', 'about') +
      '</div>'
    );
    sheetEl.querySelector('#menuList').addEventListener('click', (e) => {
      const b = e.target.closest('.si'); if (!b) return;
      const act = b.dataset.act;
      if (act === 'openCat') { closeSheet(); openCatManage(false); }
      else if (act === 'theme') { closeSheet(); openTheme(); }
      else if (act === 'theme') { closeSheet(); openTheme(); }
      else if (act === 'backup') { closeSheet(); openBackup(); }
      else if (act === 'about') { closeSheet(); openAbout(); }
    });
  }
  function si(ic, label, act, hint) {
    return '<button class="si" data-act="' + act + '"><span class="ic">' + ic + '</span><span class="lb">' + esc(label) + '</span><span class="hint">' + esc(hint || '') + '</span></button>';
  }

  function openNotify() {
    const perm = N().permission();
    const sheetEl = openSheet(
      '<div class="sh"><div class="t">通知与提醒</div><button class="x" data-close="1">' + icon('close') + '</button></div>' +
      '<div class="slist" id="menuList">' +
      si('🔔', '开启通知权限', 'req', perm === 'granted' ? '已允许' : perm === 'denied' ? '已拒绝' : '未开启') +
      si('📣', '发送一条测试通知', 'test') +
      '</div>' +
      '<div class="sec">说明</div><div class="stack"><p class="hint" style="padding:0 4px">Web 通知受浏览器与平台限制：在电脑 Chrome/Edge 上需要保持浏览器运行；安卓手机安装到桌面后较可靠；iOS 需 iOS 16.4+ 并将网页“添加到主屏幕”后才会在后台推送。事件在“到达提醒日当天/提前 N 天”时会弹出系统通知，同时事件卡片本身也会准时更新。</p></div>'
    );
    sheetEl.querySelector('#menuList').addEventListener('click', (e) => {
      const b = e.target.closest('.si'); if (!b) return;
      if (b.dataset.act === 'req') {
        N().request().then((p) => {
          toast(p === 'granted' ? '通知已开启 🎉' : p === 'denied' ? '通知被拒绝，请在浏览器设置中允许' : '当前浏览器不支持通知');
          closeSheet(); openNotify();
        });
      } else if (b.dataset.act === 'test') {
        if (N().permission() !== 'granted') { toast('请先开启通知权限', 'err'); return; }
        N().now('倒数日 · 测试通知', '这是一条测试消息，提醒功能工作正常 ✅');
        toast('已发送测试通知');
      }
    });
  }

  function openTheme() {
    const pref = S().getPrefs().theme || 'auto';
    const sheetEl = openSheet(
      '<div class="sh"><div class="t">外观与主题</div><button class="x" data-close="1">' + icon('close') + '</button></div>' +
      '<div class="stack"><div class="seg" id="themeSeg">' +
      '<button class="' + (pref === 'light' ? 'on' : '') + '" data-t="light">浅色</button>' +
      '<button class="' + (pref === 'dark' ? 'on' : '') + '" data-t="dark">深色</button>' +
      '<button class="' + (pref === 'yuyue' ? 'on' : '') + '" data-t="yuyue">屿月</button>' +
      '<button class="' + (pref === 'dora' ? 'on' : '') + '" data-t="dora">哆啦</button>' +
      '<button class="' + (pref === 'auto' ? 'on' : '') + '" data-t="auto">跟随系统</button>' +
      '</div></div>'
    );
    const seg = sheetEl.querySelector('#themeSeg');
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      S().setPrefs({ theme: b.dataset.t });
      applyTheme();
      seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      toast('已切换主题');
    });
  }

  function applyTheme() {
    const t = S().getPrefs().theme || 'auto';
    document.documentElement.setAttribute('data-theme', t);
  }

  function openBackup() {
    const sheetEl = openSheet(
      '<div class="sh"><div class="t">备份与恢复</div><button class="x" data-close="1">' + icon('close') + '</button></div>' +
      '<div class="slist" id="menuList">' +
      si('⬇️', '导出备份（JSON 文件）', 'exp', '含背景图片') +
      si('⬆️', '从备份文件导入', 'imp', '覆盖当前数据') +
      '</div>'
    );
    sheetEl.querySelector('#menuList').addEventListener('click', (e) => {
      const b = e.target.closest('.si'); if (!b) return;
      if (b.dataset.act === 'exp') {
        S().exportData().then((json) => {
          const blob = new Blob([json], { type: 'application/json' });
          const filename = 'daoshuri-backup-' + new Date().toISOString().slice(0, 10) + '.json';
          const file = new File([blob], filename, { type: 'application/json' });
          const fallback = () => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 3000);
            toast('备份已导出');
          };
          // 优先调起系统分享面板，让用户选择保存位置（iOS 可选"存储到文件"）
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: '时光屿月备份', text: filename })
              .then(() => toast('备份已导出'))
              .catch(fallback);
          } else {
            fallback();
          }
        });
      } else if (b.dataset.act === 'imp') {
        const fi = $('importFile');
        fi.onchange = () => {
          const f = fi.files && fi.files[0]; if (!f) return;
          const rd = new FileReader();
          rd.onload = async () => {
            try {
              const n = await S().importData(rd.result);
              closeSheet(); renderAll();
              toast('已导入 ' + n + ' 个事件');
            } catch (err) { toast('导入失败：文件格式不正确', 'err'); }
          };
          rd.readAsText(f);
          fi.value = '';
        };
        fi.click();
      }
    });
  }

  function openAbout() {
    openSheet(
      '<div class="sh"><div class="t">关于</div><button class="x" data-close="1">' + icon('close') + '</button></div>' +
      '<div class="about-logo"><span class="brand-logo about-app"><img class="brand-img" src="icons/app.png" alt="应用图标" /></span></div>' +
      '<div class="stack" style="align-items:center;gap:4px;padding-bottom:22px"><b style="font-size:20px">时光屿月</b><span style="color:var(--text2);font-size:13px">v1.0.0</span>' +
      '<a class="about-author" href="https://ti.qq.com/open_qq/index2.html?url=mqqapi%3A%2F%2Fuserprofile%2Ffriend_profile_card%3Fsrc_type%3Dweb%26version%3D1.0%26source%3D2%26uin%3D848007464" target="_blank" rel="noopener">作者：Felix.</a></div>'
    );
  }

  /* ---------- 小米 MiMo AI ---------- */
  const MIMO_KEY = 'sk-cwy1rgts293yogn09rmmg7zd68xocv4lf08mj58gpjal0r0c';
  function callMiMo(prompt, maxTokens) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180秒超时
    return fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + MIMO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mimo-v2.5-pro', messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens || 800 }),
      signal: controller.signal
    }).then(r => r.json()).then(data => {
      clearTimeout(timeoutId);
      return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    }).catch(() => { clearTimeout(timeoutId); return null; });
  }
  /* 周期状态 hash：周期更新时缓存失效 */
  function cycleHash(cycle) {
    const cycles = S().getCycles();
    const keys = Object.keys(cycles).sort();
    const sig = keys.map(k => k + ':' + (cycles[k] || '')).join(',');
    return [cycle.lastStart || '', cycle.cycleLen || 28, cycle.periodLen || 5, keys.length, sig].join('|');
  }
  /* AI 缓存版本号：升级后自动失效旧缓存 */
  const AI_CACHE_VER = 'v3';
  /* 首页小贴士：每天一条，周期更新时重新生成 */
  function fetchHomeTip(phase, cycle) {
    const el = document.getElementById('homeTipText');
    if (!el) return;
    const todayStr = C().ymd(C().todayMid());
    const ch = cycleHash(cycle);
    try {
      const cached = JSON.parse(localStorage.getItem('mimo_home_tip') || 'null');
      if (cached && cached.ver === AI_CACHE_VER && cached.date === todayStr && cached.hash === ch && cached.text) { el.textContent = cached.text; return; }
    } catch (e) { /* 忽略 */ }
    el.textContent = '男友思考中💭';
    const phaseName = { none: '未设置周期', period: '经期', ovulation: '排卵日', fertile: '易孕期', safe: '安全期' }[phase] || '';
    const prompt = '今天处于' + phaseName + '，给一条30字内的实用健康建议，直接回复建议内容不要解释。';
    callMiMo(prompt, 400).then(text => {
      if (text) {
        const t = text.trim();
        if (t) {
          el.textContent = t;
          try { localStorage.setItem('mimo_home_tip', JSON.stringify({ ver: AI_CACHE_VER, date: todayStr, hash: ch, text: t })); } catch (e) { /* 忽略 */ }
        } else {
          el.textContent = '今天也要好好照顾自己哦～';
        }
      } else {
        el.textContent = '今天也要好好照顾自己哦～';
      }
    });
  }
  function getAiProbs(cycle) {
    const todayStr = C().ymd(C().todayMid());
    const ch = cycleHash(cycle);
    try {
      const cached = JSON.parse(localStorage.getItem('mimo_probs') || 'null');
      if (cached && cached.ver === AI_CACHE_VER && cached.date === todayStr && cached.hash === ch && cached.probs && Object.keys(cached.probs).length > 0) return cached.probs;
    } catch (e) { /* 忽略 */ }
    return null;
  }
  function fetchAiProbs(cycle) {
    const todayStr = C().ymd(C().todayMid());
    const ch = cycleHash(cycle);
    const today = C().todayMid();
    const cycles = S().getCycles();
    const cycleLen = cycle.cycleLen || 28;
    const periodLen = cycle.periodLen || 5;
    // 未来7天日期
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      dates.push(C().ymd(d));
    }
    // 收集所有周期记录（按开始日期排序）
    const allCycles = Object.keys(cycles).sort();
    let cycleList = '';
    if (allCycles.length > 0) {
      cycleList = allCycles.map(k => '- ' + k + ' ~ ' + (cycles[k] || '未结束')).join('\n');
    } else {
      cycleList = '（无历史记录）';
    }
    // 当前活动周期开始日
    const activeStart = cycle.lastStart || '';
    const activeInfo = activeStart ? activeStart : '无（上一周期已结束）';
    // 构建prompt
    const prompt = '用户生理周期记录（开始~结束）：\n' + cycleList + '\n\n' +
      '用户设置：周期约' + cycleLen + '天，经期约' + periodLen + '天\n' +
      '当前活动周期开始日：' + activeInfo + '\n\n' +
      '请根据权威医学研究（Wilcox et al. NEJM 1995、ACOG 指南等）分析以下7天的怀孕概率：\n' +
      dates.join(', ') + '\n\n' +
      '分析要点：\n' +
      '1. 根据用户实际周期记录推算排卵日（通常下次月经前14天）\n' +
      '2. 易孕期为排卵日前5天至排卵日后1天\n' +
      '3. 精子存活约3-5天，卵子存活约12-24小时\n' +
      '4. 周期不规律时按实际记录调整\n' +
      '5. 返回0-100的整数百分比\n\n' +
      '只返回JSON，不要解释：\n' +
      '{"' + dates.join('":0,"') + '":0}';
    return callMiMo(prompt, 8000).then(text => {
      if (!text) { ui.predictingProbs = false; return {}; }
      try {
        // 用正则提取第一个JSON对象（AI可能返回额外文字）
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) { ui.predictingProbs = false; return {}; }
        const probs = JSON.parse(jsonMatch[0]);
        const result = {};
        for (const ds of dates) {
          let v = parseFloat(probs[ds]);
          if (isNaN(v)) v = 0;
          if (v > 0 && v <= 1) v = v * 100; // AI可能返回小数(0-1)，转为百分比
          result[ds] = Math.max(0, Math.min(100, Math.round(v)));
        }
        if (Object.keys(result).length > 0) {
          try { localStorage.setItem('mimo_probs', JSON.stringify({ ver: AI_CACHE_VER, date: todayStr, hash: ch, probs: result })); } catch (e) { /* 忽略 */ }
        }
        return result;
      } catch (e) { ui.predictingProbs = false; return {}; }
    });
  }
  function ensureAiProbs(cycle, callback) {
    const cached = getAiProbs(cycle);
    if (cached) { if (callback) callback(cached); return; }
    fetchAiProbs(cycle).then(probs => {
      if (callback) callback(probs || {});
    }).catch(() => {
      ui.predictingProbs = false;
      if (callback) callback({});
    });
  }
  /** 清除 AI 缓存（周期变更时调用） */
  function clearAiCache() {
    try { localStorage.removeItem('mimo_probs'); } catch (e) { /* 忽略 */ }
    try { localStorage.removeItem('mimo_home_tip'); } catch (e) { /* 忽略 */ }
  }
  /** 每天预测次数限制（3次） */
  const PROBS_DAILY_LIMIT = 3;
  function getProbCount() {
    try {
      const c = JSON.parse(localStorage.getItem('mimo_prob_count') || 'null');
      const todayStr = C().ymd(C().todayMid());
      if (c && c.date === todayStr) return c.count || 0;
    } catch (e) { /* 忽略 */ }
    return 0;
  }
  function incProbCount() {
    const todayStr = C().ymd(C().todayMid());
    const count = getProbCount() + 1;
    try { localStorage.setItem('mimo_prob_count', JSON.stringify({ date: todayStr, count })); } catch (e) { /* 忽略 */ }
    return count;
  }
  function resetProbCount() {
    try { localStorage.removeItem('mimo_prob_count'); } catch (e) { /* 忽略 */ }
  }

  /* =========================================================
   * 日历视图
   * ========================================================= */
  function calCursor() {
    const today = C().todayMid();
    if (!ui.calYM) ui.calYM = { y: today.getFullYear(), m: today.getMonth() + 1 };
    return ui.calYM;
  }
  const FESTS_LUNAR = { '1-1': '春节', '1-15': '元宵', '5-5': '端午', '7-7': '七夕', '8-15': '中秋', '9-9': '重阳', '12-8': '腊八' };
  const FESTS_SOLAR = { '1-1': '元旦', '5-1': '劳动', '10-1': '国庆' };

  function eventDotsForMonth(ev, y, m) {
    return C().datesInYear(ev, y).filter((d) => d.getMonth() + 1 === m);
  }

  function renderCalendar() {
    const el = $('content');
    const { y, m } = calCursor();
    const today = C().todayMid();
    const lu = window.DM.lunar;
    const st = S().load();
    const dim = C().daysInMonth(y, m);
    const firstDow = new Date(y, m - 1, 1).getDay();
    const lead = (firstDow + 6) % 7; // 周一开头
    const title = y + '年' + m + '月';

    // 事件 → 该月内的日期
    const dotMap = {}; // 'd' -> [{ev, color}]
    for (const ev of st.events) {
      const cid = S().catById(ev.cat);
      for (const d of eventDotsForMonth(ev, y, m)) {
        const k = d.getDate();
        (dotMap[k] = dotMap[k] || []).push({ ev, color: cid.color });
      }
    }

    // 选定日（默认今天如果在当月）
    let sel = ui.calSel;
    if (!sel || sel.getFullYear() !== y || sel.getMonth() + 1 !== m) {
      sel = (y === today.getFullYear() && m === today.getMonth() + 1) ? today : null;
      ui.calSel = sel;
    }

    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="cal-cell blank"></div>';
    for (let day = 1; day <= dim; day++) {
      const isToday = y === today.getFullYear() && m === today.getMonth() + 1 && day === today.getDate();
      const isSel = sel && day === sel.getDate();
      let lunarTxt = '', fest = '';
      try {
        const lt = lu.solarToLunar(y, m, day);
        if (lt) {
          fest = FESTS_LUNAR[lt.lMonth + '-' + lt.lDay];
          if (!fest) fest = FESTS_SOLAR[m + '-' + day];
          lunarTxt = fest || lu.dayName(lt.lDay);
        }
      } catch (e) { /* 范围外 */ }
      const dots = (dotMap[day] || []).map((x) => '<i style="--cc:' + x.color + '"></i>').join('');
      cells += '<div class="cal-cell' + (isToday ? ' today' : '') + (isSel ? ' sel' : '') + '" data-day="' + day + '">' +
        '<span class="dn">' + day + '</span>' +
        (lunarTxt ? '<span class="ln' + (fest ? ' fest' : '') + '">' + lunarTxt + '</span>' : '') +
        '<span class="dots">' + dots + '</span></div>';
    }

    let dayList = '';
    if (sel) {
      const evs = [];
      for (const ev of st.events) {
        for (const d of eventDotsForMonth(ev, sel.getFullYear(), sel.getMonth() + 1)) {
          if (d.getDate() === sel.getDate()) evs.push(ev);
        }
      }
      dayList = '<div class="day-events"><h4>' + C().fmtCNYMD(sel) + ' 共 ' + evs.length + ' 个事件</h4>';
      if (!evs.length) dayList += '<p style="color:var(--text3);font-size:13px;padding:4px 2px">这一天没有事件。</p>';
      else {
        for (const ev of evs) {
          const cid = S().catById(ev.cat);
          const s = C().stateOf(ev);
          dayList += '<div class="day-ev" data-id="' + ev.id + '" style="--cc:' + cid.color + '">' +
            '<span class="c-icon">' + esc(cid.icon || '📅') + '</span>' +
            '<span class="ev-t"><span class="n">' + esc(ev.title) + '</span><span class="s">' + esc(cid.name) + (s.annual ? ' · 每年' : '') + '</span></span>' +
            '<span class="ev-num">' + (s.phase === 'none' ? '—' : (s.phase === 'today' ? '今天' : (s.phase === 'past' ? (s.kw === '第' ? s.num + ' 天' : '已过 ' + s.num + ' 天') : '还有 ' + s.num + ' 天'))) + '</span></div>';
        }
      }
      dayList += '</div>';
    }

    el.innerHTML =
      '<div class="cal">' +
      '<div class="cal-head"><span class="cal-title">' + title + '</span><span class="cal-nav">' +
      '<button class="iconbtn" id="calPrev" type="button">' + icon('left') + '</button>' +
      '<button class="iconbtn" id="calToday" type="button" title="回到今天">今</button>' +
      '<button class="iconbtn" id="calNext" type="button">' + icon('right') + '</button></span></div>' +
      '<div class="cal-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>' +
      '<div class="cal-grid">' + cells + '</div>' +
      '</div>' + dayList;

    $('calPrev').onclick = () => { ui.calYM = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }; ui.calSel = null; renderCalendar(); };
    $('calNext').onclick = () => { ui.calYM = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }; ui.calSel = null; renderCalendar(); };
    $('calToday').onclick = () => { ui.calYM = { y: today.getFullYear(), m: today.getMonth() + 1 }; ui.calSel = today; renderCalendar(); };

    el.querySelectorAll('.cal-cell:not(.blank)').forEach((c) => {
      c.onclick = () => {
        ui.calSel = C().dateOf(y, m, parseInt(c.dataset.day, 10));
        renderCalendar();
      };
    });
    el.querySelectorAll('.day-ev').forEach((d) => {
      d.onclick = () => openEditor(d.dataset.id);
    });
  }

  /* =========================================================
   * 月历（生理周期记录 + 预测）
   * ========================================================= */
  const PC_NAMES = { period: '经期', fertile: '易孕期', ovulation: '排卵日', normal: '安全期' };
  const PC_MOODS = ['😌 平静', '😄 开心', '😢 低落', '😠 烦躁', '😪 疲惫'];
  const PC_SYMP = ['痛经', '腰酸', '疲劳', '头晕', '恶心', '乳房胀'];
  const PC_COLORS = ['鲜红', '暗红', '粉红', '褐色', '黑褐', '橙红'];
  const PC_COLOR_HEX = { 鲜红: '#e03131', 暗红: '#9d2b28', 粉红: '#f783ac', 褐色: '#8d6e63', 黑褐: '#4e342e', 橙红: '#e8590c' };

  function pcalCursor() {
    const t = C().todayMid();
    if (!ui.calYM) ui.calYM = { y: t.getFullYear(), m: t.getMonth() + 1 };
    return ui.calYM;
  }
  let pcAnimTok = 0;
  function monthSwitch(dir) {
    const { y, m } = pcalCursor();
    if (dir === 1) ui.calYM = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
    else if (dir === -1) ui.calYM = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
    renderPeriodPage();
  }
  function slideMonth(dir) {
    const tok = ++pcAnimTok;
    let g = null;
    try { g = document.querySelector('#pcGrid'); } catch (e) { g = null; }
    if (!g) { monthSwitch(dir); return; }
    const dist = dir === 1 ? -26 : 26;
    g.style.transition = 'transform .16s ease, opacity .16s ease';
    g.style.transform = 'translateX(' + dist + 'px)';
    g.style.opacity = '0';
    setTimeout(() => {
      if (tok !== pcAnimTok) return;
      monthSwitch(dir);
      let g2 = null;
      try { g2 = document.querySelector('#pcGrid'); } catch (e) { g2 = null; }
      if (!g2) return;
      g2.style.transition = 'none';
      g2.style.transform = 'translateX(' + (-dist) + 'px)';
      g2.style.opacity = '0';
      requestAnimationFrame(() => {
        if (tok !== pcAnimTok) return;
        g2.style.transition = 'transform .22s cubic-bezier(.32,.72,.24,1), opacity .22s ease';
        g2.style.transform = 'translateX(0)';
        g2.style.opacity = '1';
      });
    }, 150);
  }
  function selOfMonth(y, m) {
    const t = C().todayMid();
    const d = (ui.pday && !isNaN(ui.pday)) ? new Date(ui.pday) : t;
    if (d.getFullYear() === y && d.getMonth() + 1 === m) return d;
    return (y === t.getFullYear() && m === t.getMonth() + 1) ? t : C().dateOf(y, m, 1);
  }
  function markObj(mark) { return { f: mark ? (mark.f || 0) : 0, p: mark ? (mark.p || 0) : 0, mood: mark ? (mark.mood || '') : '', c: mark ? (mark.c || '') : '', e: mark ? (mark.e || 0) : 0, s: mark && Array.isArray(mark.s) ? mark.s.slice() : [] }; }

  /* =========================================================
   * 全新周期推算算法
   * ========================================================= */

  /** 获取当前活动周期的开始日：有 lastStart 用 lastStart，否则用最近已记录周期的开始日（不跳转到下一期） */
  function getActiveStart(cycle, cycles) {
    if (cycle.lastStart) return cycle.lastStart;
    let latest = null;
    for (const k of Object.keys(cycles || {})) {
      if (!latest || k > latest) latest = k;
    }
    return latest;
  }

  /** 获取某天在当前活动周期内的状态（仅当前周期，不含历史和未来） */
  function statusInActiveCycle(date, activeStart, cycleLen, periodLen) {
    if (!activeStart) return null;
    const diff = C().dayDiff(date, C().parseYMD(activeStart));
    if (diff < 0 || diff >= cycleLen) return null;
    if (diff < periodLen) return 'period';
    const ov = cycleLen - 14;
    if (diff === ov) return 'ovulation';
    if (diff >= ov - 5 && diff <= ov + 1) return 'fertile';
    return 'safe';
  }

  /** 获取历史日期的状态（只返回 period 或 safe，不显示易孕期/排卵日） */
  function statusInHistory(date, cycles, periodLen) {
    let bestStart = null;
    for (const k of Object.keys(cycles || {})) {
      const sd = C().parseYMD(k);
      if (sd && C().dayDiff(date, sd) >= 0) {
        if (!bestStart || C().dayDiff(sd, C().parseYMD(bestStart)) > 0) bestStart = k;
      }
    }
    if (!bestStart) return null;
    const diff = C().dayDiff(date, C().parseYMD(bestStart));
    const endStr = cycles[bestStart];
    const endDiff = endStr ? C().dayDiff(C().parseYMD(endStr), C().parseYMD(bestStart)) : (periodLen - 1);
    if (diff >= 0 && diff <= endDiff) return 'period';
    return 'safe';
  }

  /** 综合判断某天的显示状态 */
  function dayStatus(date, cycle, cycles) {
    const cycleLen = cycle.cycleLen || 28;
    const periodLen = cycle.periodLen || 5;
    // 1. 已记录周期的经期
    if (cycleInRecords(cycles, date)) return 'period';
    // 2. 当前活动周期的状态（易孕期只显示活动周期内的，不自动跳到下一期）
    const activeStart = getActiveStart(cycle, cycles);
    const s = statusInActiveCycle(date, activeStart, cycleLen, periodLen);
    if (s) return s;
    // 3. 历史日期
    if (activeStart && C().dayDiff(date, C().parseYMD(activeStart)) < 0) {
      const h = statusInHistory(date, cycles, periodLen);
      if (h) return h;
    }
    // 4. 活动周期之后的未来日期：只显示推算经期，不显示易孕期/排卵日
    if (activeStart) {
      const diff = C().dayDiff(date, C().parseYMD(activeStart));
      if (diff >= cycleLen) {
        const k = Math.floor(diff / cycleLen);
        const cycleDay = diff - k * cycleLen;
        if (cycleDay < periodLen) return 'period';
        return 'safe';
      }
    }
    return 'safe';
  }

  /** 顶部摘要：当前周期第几天、下次经期等 */
  function periodSummary(cycle, cycles, today) {
    const activeStart = getActiveStart(cycle, cycles);
    if (!activeStart) return null;
    const cycleLen = cycle.cycleLen || 28;
    const periodLen = cycle.periodLen || 5;
    const diff = C().dayDiff(today, C().parseYMD(activeStart));
    const day = ((diff % cycleLen) + cycleLen) % cycleLen;
    const nextStart = C().addDays(C().parseYMD(activeStart), Math.ceil((diff + 1) / cycleLen) * cycleLen);
    const daysToNext = C().dayDiff(nextStart, today);
    return { day: day + 1, next: nextStart, days: daysToNext, L: periodLen, inPeriod: day < periodLen };
  }

  function actualRunFor(marks, date) {
    const ds = C().ymd(date);
    if (!marks[ds] || !(marks[ds].f > 0)) return null;
    let d = date;
    while (marks[C().ymd(C().addDays(d, -1))] && marks[C().ymd(C().addDays(d, -1))].f > 0) d = C().addDays(d, -1);
    const start = C().ymd(d);
    d = date;
    while (marks[C().ymd(C().addDays(d, 1))] && marks[C().ymd(C().addDays(d, 1))].f > 0) d = C().addDays(d, 1);
    return { start, end: C().ymd(d) };
  }
  /** 该日期是否落在某条已记录的周期区间（开始 ~ 你选的结束日）内 */
  function cycleInRecords(cycles, date) {
    for (const s of Object.keys(cycles || {})) {
      const sd = C().parseYMD(s), ed = C().parseYMD(cycles[s]);
      if (sd && ed && C().dayDiff(date, sd) >= 0 && C().dayDiff(ed, date) >= 0) return true;
    }
    return false;
  }

  function renderPeriodPage() {
    const el = $('content');
    if (!el) return;
    const { y, m } = pcalCursor();
    const today = C().todayMid();
    const sel = selOfMonth(y, m);
    ui.pday = sel.getTime();
    const marks = S().getMarks();
    const cycle = S().getCycle();
    const cycles = S().getCycles();
    const aiProbs = getAiProbs(cycle);
    const dim = C().daysInMonth(y, m);
    const firstDow = new Date(y, m - 1, 1).getDay();
    const lead = (firstDow + 6) % 7;
    const lu = window.DM.lunar;
    const inPredictionWindow = (ds) => {
      const diff = C().dayDiff(C().parseYMD(ds), today);
      return diff >= 0 && diff <= 6;
    };

    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="pc-cell blank"></div>';
    for (let day = 1; day <= dim; day++) {
      const dt = C().dateOf(y, m, day);
      const ds = C().ymd(dt);
      let kind = dayStatus(dt, cycle, cycles);
      // 旧代码用 'normal' 表示安全期，新算法用 'safe'，统一一下
      if (kind === 'safe') kind = 'normal';
      const actual = (marks[ds] && marks[ds].f > 0) || cycleInRecords(cycles, dt);
      const isToday = C().ymd(today) === ds;
      const isSel = C().ymd(sel) === ds;
      const inWindow = inPredictionWindow(ds);
      let dayProb = 0;
      if (inWindow && aiProbs && aiProbs[ds] != null) dayProb = aiProbs[ds];
      let ln = '';
      try { const lt = lu.solarToLunar(y, m, day); if (lt) ln = lt.lDay === 1 ? '初一' : (lt.lDay === 15 ? '十五' : ''); } catch (e) { /* 忽略 */ }
      cells += '<div class="pc-cell ' + kind + (actual ? ' actual' : '') + (isToday ? ' today' : '') + (isSel ? ' sel' : '') + '" data-d="' + ds + '">' +
        '<span class="dn">' + day + '</span>' +
        (ln ? '<span class="ln">' + ln + '</span>' : '<span class="ln"> </span>') +
        (aiProbs && inWindow ? '<span class="prob">' + dayProb + '%</span>' : '') +
        '</div>';
    }

    // 图例 + 概要
    const sum = periodSummary(cycle, cycles, today);
    const todayRun = actualRunFor(marks, today);
    const todayEndMarked = !!(todayRun && cycles[todayRun.start]);
    const activeOriginal = !!(cycle.lastStart && !cycles[cycle.lastStart]);
    let summaryHtml;
    if (!cycle.lastStart && Object.keys(cycles).length === 0) {
      summaryHtml = '<div class="pc-sum warn">还没有设置周期：点任意一天 →「设为本次开始」，之后会自动推算。</div>';
    } else if (sum) {
      let t;
      if (activeOriginal && !todayEndMarked) {
        t = '本次经期已开始 · 预测约 ' + (cycle.periodLen || 5) + ' 天（实际可能长几天）——请到真正结束那天点「选择结束日」';
      } else {
        t = (sum.day ? '周期第 ' + sum.day + ' 天' : '周期外') + (sum.next ? ' ｜ 下次预计 <b>' + C().fmtCN(sum.next) + '</b>' + (sum.days != null ? '（还有 ' + sum.days + ' 天）' : '') : '');
      }
      summaryHtml = '<div class="pc-sum">' + t + '</div>';
    } else {
      summaryHtml = '';
    }
    let probBtn;
    const probCount = getProbCount();
    const remaining = PROBS_DAILY_LIMIT - probCount;
    if (ui.predictingProbs) {
      probBtn = '<button type="button" class="pc-prob-btn" disabled>AI预测中...</button>';
    } else if (remaining <= 0) {
      probBtn = '<button type="button" class="pc-prob-btn" disabled>今日次数已用完(' + PROBS_DAILY_LIMIT + '/' + PROBS_DAILY_LIMIT + ')</button>';
    } else if (aiProbs) {
      probBtn = '<button type="button" class="pc-prob-btn" data-act="predictprob">重新预测(剩' + remaining + '次)</button>';
    } else {
      probBtn = '<button type="button" class="pc-prob-btn" data-act="predictprob">怀孕概率</button>';
    }
    const legend = '<div class="pc-legend"><span class="lg per"></span>经期<span class="lg ovu"></span>排卵日<span class="lg fer"></span>易孕期<span class="lg safe"></span>安全期</div>';

    el.innerHTML =
      '<div class="pcal">' +
      '<div class="pc-head"><button type="button" class="iconbtn" data-act="prev">' + icon('left') + '</button>' +
      '<span class="pc-title">' + y + '年' + m + '月</span>' +
      '<button type="button" class="iconbtn" data-act="next">' + icon('right') + '</button>' +
      '<button type="button" class="iconbtn" data-act="today" title="回到今天">今</button>' +
      '<button type="button" class="iconbtn" data-act="conf" title="周期设置">' + icon('set') + '</button>' +
      '</div>' +
      '<div class="pc-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>' +
      '<div class="pc-grid" id="pcGrid">' + cells + '</div>' +
      '<div class="pc-prob-row">' + probBtn + '</div>' +
      legend + summaryHtml +
      '</div>' +
      renderDayPanel(sel, marks, cycle, cycles);

    // 事件接线
    el.querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = () => {
        const a = b.dataset.act;
        if (a === 'prev') slideMonth(-1);
        else if (a === 'next') slideMonth(1);
        else if (a === 'today') { ui.calYM = { y: today.getFullYear(), m: today.getMonth() + 1 }; renderPeriodPage(); }
        else if (a === 'conf') { openCycleSheet(); }
        else if (a === 'predictprob') {
          if (getProbCount() >= PROBS_DAILY_LIMIT) { toast('今日预测次数已用完', 'err'); return; }
          ui.predictingProbs = true;
          b.disabled = true; b.textContent = 'AI预测中...';
          clearAiCache();
          ensureAiProbs(cycle, (probs) => {
            ui.predictingProbs = false;
            if (probs && Object.keys(probs).length > 0) {
              incProbCount();
            } else {
              toast('预测失败，请稍后重试', 'err');
            }
            if (ui.tab === 'cal') renderPeriodPage();
          });
        }
      };
    });
    el.querySelectorAll('.pc-cell[data-d]').forEach((c) => {
      c.onclick = () => { ui.pday = C().parseYMD(c.dataset.d).getTime(); renderPeriodPage(); };
    });
    el.querySelectorAll('.pc-btn').forEach((b) => { b.onclick = () => wireDayPanel(b.dataset); });
    el.querySelectorAll('.pc-flow').forEach((b) => { b.onclick = () => wireDayPanel({ flow: b.dataset.v }); });
    el.querySelectorAll('.pc-pain').forEach((b) => { b.onclick = () => wireDayPanel({ pain: b.dataset.v }); });
    el.querySelectorAll('.pc-mood').forEach((b) => { b.onclick = () => wireDayPanel({ mood: b.dataset.m }); });
    el.querySelectorAll('.pc-symptom').forEach((b) => { b.onclick = () => wireDayPanel({ symptom: b.dataset.s }); });
    el.querySelectorAll('.pc-color').forEach((b) => { b.onclick = () => wireDayPanel({ color: b.dataset.c }); });

    // 月历网格：左右滑动切换月份
    const pcal = el.querySelector('.pcal');
    if (pcal) {
      let sx = null, sy = null;
      const down = (e) => { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; };
      const up = (e) => {
        if (sx == null) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        sx = null; sy = null;
        if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
        slideMonth(dx < 0 ? 1 : -1);
      };
      pcal.addEventListener('pointerdown', down);
      pcal.addEventListener('pointerup', up);
      pcal.addEventListener('pointercancel', up);
    }
  }

  function renderDayPanel(sel, marks, cycle, cycles) {
    const ds = C().ymd(sel);
    const mk = markObj(marks[ds]);
    let predKind = dayStatus(sel, cycle, cycles);
    if (predKind === 'safe') predKind = 'normal';
    const kLabel = PC_NAMES[predKind] || '—';
    const actualText = mk.f > 0 ? '经期量：' + ['', '少', '中', '多'][mk.f] : '';
    const aiProbs = getAiProbs(cycle);
    const todayMid = C().todayMid();
    const selDiff = C().dayDiff(sel, todayMid);
    const inWindow = selDiff >= 0 && selDiff <= 6;
    let prob = 0;
    if (inWindow && aiProbs && aiProbs[ds] != null) prob = aiProbs[ds];
    const run = actualRunFor(marks, sel);
    const activeCur = !!(cycle.lastStart && !cycles[cycle.lastStart]);
    const runEndMarked = !!(run && cycles[run.start]);
    const runEnd = run && cycles[run.start] ? cycles[run.start] : '';
    const activeStart = getActiveStart(cycle, cycles);
    const showProb = inWindow && !!aiProbs;

    // 未来的日期默认不可设置，只能查看预测
    if (C().dayDiff(sel, C().todayMid()) > 0) {
      return '<div class="pday">' +
        '<div class="pday-head"><b>' + C().fmtCN(sel) + ' ' + C().WEEK_CN[sel.getDay()] + '</b>' +
        '<span class="pday-kind ' + predKind + '">预测：' + kLabel + '</span></div>' +
        (showProb ? '<div class="pday-prob' + (prob >= 50 ? ' hi' : prob >= 15 ? ' mid' : '') + '">若今日同房，怀孕概率约 ' + prob + '%<small>（AI 预测，仅供参考）</small></div>' : '') +
        '<div class="pday-hint">🔒 未来的日期只能查看预测，不能记录经期/症状；请在当天再来记录或选择结束日。</div>' +
        '</div>';
    }

    const flowSeg = [0, 1, 2, 3].map((v) => '<button type="button" class="pc-flow' + (mk.f === v ? ' on' : '') + '" data-v="' + v + '">' + ['无', '少', '中', '多'][v] + '</button>').join('');
    const painSeg = [0, 1, 2, 3].map((v) => '<button type="button" class="pc-pain' + (mk.p === v ? ' on' : '') + '" data-v="' + v + '">' + ['无', '轻', '中', '重'][v] + '</button>').join('');
    const moodHtml = PC_MOODS.map((mm) => '<button type="button" class="pc-opt pc-mood' + (mk.mood === mm ? ' on' : '') + '" data-m="' + mm + '">' + mm + '</button>').join('');
    const sympHtml = PC_SYMP.map((ss) => '<button type="button" class="pc-opt pc-symptom' + (mk.s.indexOf(ss) >= 0 ? ' on' : '') + '" data-s="' + ss + '">' + ss + '</button>').join('');
    const colorHtml = PC_COLORS.map((cc) => '<button type="button" class="pc-opt pc-color' + (mk.c === cc ? ' on' : '') + '" data-c="' + cc + '"><i class="dot" style="background:' + PC_COLOR_HEX[cc] + '"></i>' + cc + '</button>').join('');

    const hasRecord = mk.f || mk.p || mk.mood || mk.c || mk.s.length;
    const isStartDay = cycle.lastStart === ds;
    let endOfCycle = null;
    for (const k of Object.keys(cycles)) { if (cycles[k] === ds) { endOfCycle = k; break; } }
    const isEndDay = !!endOfCycle;
    let cycLine = '';
    if (activeStart) {
      const diff = C().dayDiff(sel, C().parseYMD(activeStart));
      const cycleLen = cycle.cycleLen || 28;
      if (diff >= 0) {
        const dayInCycle = diff % cycleLen;
        if (mk.f > 0 || run) {
          cycLine = '本次经期第 ' + (C().dayDiff(sel, C().parseYMD(run ? run.start : activeStart)) + 1) + ' 天';
        } else if (predKind === 'period') {
          cycLine = '预测经期第 ' + (dayInCycle + 1) + ' 天';
        }
      }
    }
    return '<div class="pday">' +
      '<div class="pday-head"><b>' + C().fmtCN(sel) + ' ' + C().WEEK_CN[sel.getDay()] + '</b>' +
      '<span class="pday-kind ' + predKind + '">' + (mk.f > 0 ? '已记录 · 经期' : '预测：' + kLabel) + '</span></div>' +
      (cycLine ? '<div class="pday-cycle">' + cycLine + (activeCur && !runEndMarked ? ' · 实际可能超过' + (cycle.periodLen || 5) + '天：干净后请点下方「选择结束日」' : '') + '</div>' : '') +
      (showProb ? '<div class="pday-prob' + (prob >= 50 ? ' hi' : prob >= 15 ? ' mid' : '') + '">若今日同房，怀孕概率约 ' + prob + '%<small>' + (prob >= 50 ? '（高危，如备孕请安排；反之注意防护）' : prob >= 15 ? '（较高）' : '（较低）') + ' · AI预测</small></div>' : '') +
      (actualText ? '<div class="pday-rec">' + actualText + (mk.p ? ' · 疼痛' + ['', '轻', '中', '重'][mk.p] : '') + (mk.mood ? ' · ' + mk.mood : '') + (mk.c ? ' · ' + mk.c + '色' : '') + (mk.s.length ? ' · ' + mk.s.join('/') : '') + '</div>' : '') +
      '<div class="pday-sec"><span>经期</span><div class="seg pc-seg">' + flowSeg + '</div></div>' +
      '<div class="pday-sec"><span>疼痛</span><div class="seg pc-seg">' + painSeg + '</div></div>' +
      '<div class="pday-sec"><span>心情</span><div class="pday-scroll">' + moodHtml + '</div></div>' +
      '<div class="pday-sec"><span>症状</span><div class="pday-scroll">' + sympHtml + '</div></div>' +
      '<div class="pday-sec"><span>颜色</span><div class="pday-scroll">' + colorHtml + '</div></div>' +
      '<div class="pday-ops">' +
      (isStartDay ? '<button type="button" class="btn ghost sm pc-btn del-ghost" data-clearstart="1">取消开始</button>' : '<button type="button" class="btn ghost sm pc-btn" data-setstart="1">设为本次开始</button>') +
      (isEndDay ? '<button type="button" class="btn ghost sm pc-btn del-ghost" data-clearend="1">取消结束</button>' : '<button type="button" class="btn ghost sm pc-btn' + (((mk.f > 0 || predKind === 'period' || activeCur) && !runEndMarked) ? ' ok' : '') + '" data-end="1">' + (runEndMarked ? '修改结束日' : '选择结束日') + '</button>') +
      (hasRecord ? '<button type="button" class="btn ghost sm pc-btn del-ghost" data-clearrec="1">清除当日记录</button>' : '') +
      '</div>' +
      (runEndMarked ? '<div class="pday-hint">本周期已记录：开始 ' + C().fmtCN(C().parseYMD(run.start)) + ' → 结束 ' + C().fmtCN(C().parseYMD(runEnd)) + '（若选错了，点其它日期即可修改）。</div>' : (activeCur ? '<div class="pday-hint">本次经期已开始、尚未选择结束日。预测约 ' + (cycle.periodLen || 5) + ' 天，实际可能第 ' + ((cycle.periodLen || 5) + 1) + '、' + ((cycle.periodLen || 5) + 2) + ' 天才干净——请在真正结束的那天点「选择结束日」。</div>' : '')) +
      '</div>';
  }

  function wireDayPanel(d) {
    // 记录心情/症状/颜色等横滑行的位置，避免选择后跳回最左
    const scrolls = [];
    try { document.querySelectorAll('.pday-scroll').forEach((el) => scrolls.push(el.scrollLeft)); } catch (e) { /* 忽略 */ }
    const restore = () => {
      try {
        let i = 0;
        document.querySelectorAll('.pday-scroll').forEach((el) => { if (scrolls[i] != null) el.scrollLeft = scrolls[i]; i++; });
      } catch (e) { /* 忽略 */ }
    };
    const sel = new Date(ui.pday);
    const ds = C().ymd(sel);
    let mark = markObj(S().getMarks()[ds]);
    if (d.flow != null) { mark.f = parseInt(d.flow, 10); if (!mark.f && !mark.p && !mark.mood && !mark.c && !mark.s.length) { S().delMark(ds); } else { S().putMark(ds, mark); } }
    else if (d.pain != null) { mark.p = parseInt(d.pain, 10); S().putMark(ds, mark); }
    else if (d.mood) { if (mark.mood === d.mood) mark.mood = ''; else mark.mood = d.mood; S().putMark(ds, mark); }
    else if (d.symptom) { const i = mark.s.indexOf(d.symptom); if (i >= 0) mark.s.splice(i, 1); else mark.s.push(d.symptom); S().putMark(ds, mark); }
    else if (d.color) { if (mark.c === d.color) mark.c = ''; else mark.c = d.color; S().putMark(ds, mark); }
    else if (d.end) {
      // 选择结束日：把当前活动周期存入记录，lastStart 置空
      const cycNow = S().getCycle();
      const cycRecs = S().getCycles();
      const run = actualRunFor(S().getMarks(), sel);
      let startStr = null;
      if (run && C().dayDiff(sel, C().parseYMD(run.start)) >= 0) {
        startStr = run.start;
      } else if (cycNow.lastStart) {
        startStr = cycNow.lastStart;
      } else {
        let best = null;
        for (const k of Object.keys(cycRecs)) {
          const sd = C().parseYMD(k);
          if (sd && C().dayDiff(sel, sd) >= 0 && (!best || C().dayDiff(sd, best) > 0)) best = k;
        }
        startStr = best;
      }
      if (!startStr) { toast('请先点「设为本次开始」，再选择结束日', 'err'); }
      else if (C().dayDiff(sel, C().parseYMD(startStr)) < 0) { toast('结束日不能早于开始日', 'err'); }
      else {
        const existed = !!cycRecs[startStr];
        S().putCycleRecord(startStr, C().ymd(sel));
        S().setCycle({ lastStart: null });
        clearAiCache();
        toast(existed ? '已更新本周期结束日' : '已记录本周期结束');
      }
    }
    else if (d.setstart) {
      // 设置新开始日：如果有未结束的活动周期，自动按推算经期长度结束
      const oldCycle = S().getCycle();
      if (oldCycle.lastStart && oldCycle.lastStart !== ds && !S().getCycles()[oldCycle.lastStart]) {
        const autoEnd = C().ymd(C().addDays(C().parseYMD(oldCycle.lastStart), (oldCycle.periodLen || 5) - 1));
        S().putCycleRecord(oldCycle.lastStart, autoEnd);
      }
      S().setCycle({ lastStart: ds });
      clearAiCache();
      toast('已设为本次开始，周期已重新推算');
    }
    else if (d.clearstart) {
      // 取消开始：删除当前活动周期的记录，lastStart 置空
      const cur = S().getCycle();
      if (cur.lastStart) S().delCycleRecord(cur.lastStart);
      S().setCycle({ lastStart: null });
      clearAiCache();
      toast('已取消本次开始');
    }
    else if (d.clearend) {
      // 取消结束：从记录删除，如果是最近的周期则恢复为活动周期
      const cycRecs = S().getCycles();
      for (const k of Object.keys(cycRecs)) {
        if (cycRecs[k] === ds) {
          S().delCycleRecord(k);
          const remaining = S().getCycles();
          let latest = null;
          for (const rk of Object.keys(remaining)) { if (!latest || rk > latest) latest = rk; }
          if (!latest || k > latest) S().setCycle({ lastStart: k });
          clearAiCache();
          toast('已取消结束日');
          break;
        }
      }
    }
    else if (d.clearrec) { S().delMark(ds); }
    // 清理空记录
    const nm = markObj(S().getMarks()[ds]);
    if (!nm.f && !nm.p && !nm.mood && !nm.c && !nm.s.length) S().delMark(ds);
    renderPeriodPage();
    restore();
  }

  function openCycleSheet() {
    const cyc = S().getCycle();
    const sheetEl = openSheet(
      '<div class="ed-top"><button class="ed-back" id="cyBack" type="button">' + icon('back') + '</button><div class="ed-title">周期设置</div><button class="ed-save-top" id="cyDone" type="button">完成</button></div>' +
      '<div class="ed-body"><div class="ed-group">' +
      '<div class="ed-row"><span class="lb">最近开始</span><div class="ct"><input id="cyStart" type="date" value="' + (cyc.lastStart || C().ymd(C().todayMid())) + '"/></div></div>' +
      '<div class="ed-row"><span class="lb">周期长度</span><div class="ct numunit"><input class="nu" id="cyLen" type="number" min="15" max="60" value="' + (cyc.cycleLen || 28) + '"/><span class="un">天</span></div></div>' +
      '<div class="ed-row"><span class="lb">经期长度</span><div class="ct numunit"><input class="nu" id="cyPer" type="number" min="1" max="12" value="' + (cyc.periodLen || 5) + '"/><span class="un">天</span></div></div>' +
      '</div>' +
      '<p class="cat-hint">排卵日按“下次经期前 14 天”估算，易孕期为排卵前 5 天至后 1 天；未来预测的经期长度按上方设置值计算。记录仅供个人参考，不能替代医疗建议。</p>' +
      '<button class="save-btn" id="cySave" type="button">保存</button>' +
      '<button class="ed-del" id="cyReset" type="button">清除周期数据</button>' +
      '</div>'
    );
    const back = sheetEl.querySelector('#cyBack'), done = sheetEl.querySelector('#cyDone');
    const cyBtn = sheetEl.querySelector('#cyReset');
    let armed = false, disarmT = null;
    const disarm = () => { armed = false; if (disarmT) { clearTimeout(disarmT); disarmT = null; } if (cyBtn) { cyBtn.textContent = '清除周期数据'; cyBtn.classList.remove('armed'); } };
    back.onclick = () => { disarm(); closeSheet(); };
    done.onclick = () => { disarm(); closeSheet(); };
    sheetEl.querySelector('#cySave').onclick = () => {
      const st = sheetEl.querySelector('#cyStart').value;
      const len = parseInt(sheetEl.querySelector('#cyLen').value, 10);
      const per = parseInt(sheetEl.querySelector('#cyPer').value, 10);
      if (!st || !len || !per) { toast('请完整填写', 'err'); return; }
      S().setCycle({ lastStart: st, lastEnd: null, cycleLen: len, periodLen: per });
      clearAiCache();
      disarm(); closeSheet(); renderPeriodPage(); toast('周期设置已保存');
    };
    const doClear = () => {
      S().resetCycleData();
      clearAiCache();
      ui.calYM = null; ui.pday = null;
      disarm(); closeSheet();
      try { sessionStorage.setItem('dm_cycle_cleared', '1'); } catch (e) { /* 忽略 */ }
      setTimeout(() => { try { location.reload(); } catch (e) { /* 忽略 */ } }, 120);
    };
    // 清除周期数据：先点一次“武装”，再点一次确认清除（同层完成，不弹第二层）
    cyBtn.onclick = () => {
      if (!armed) {
        armed = true;
        cyBtn.classList.add('armed');
        cyBtn.textContent = '确定清除';
        disarmT = setTimeout(disarm, 4000);
        return;
      }
      disarm();
      doClear();
    };
  }

  /* =========================================================
   * 主渲染
   * ========================================================= */
  function renderAll() {
    applyTheme();
    const NAMES = { home: '首页', list: '纪念日', cal: '月历', set: '设置' };
    const bn = $('brandName');
    if (bn) bn.textContent = NAMES[ui.tab] || '纪念日';
    const bd = $('brandDate');
    if (bd) updateBrandDateText();
    try { document.title = NAMES[ui.tab] + ' · 倒计时与纪念日'; } catch (e) { /* 忽略 */ }
    setIcons();
    if (ui.tab === 'list') {
      renderToday();
      renderChips();
      renderList();
    } else if (ui.tab === 'home') {
      renderHomePage();
    } else if (ui.tab === 'cal') {
      renderPeriodPage();
    } else {
      renderSettings();
    }
  }

  /* 底部页签切换时的内容过渡动画（向左/向右轻推进入） */
  function animateTabSwitch(from, to) {
    const ORDER = ['home', 'list', 'cal', 'set'];
    const a = ORDER.indexOf(from), b = ORDER.indexOf(to);
    let dir = 1; // 默认从右进入（顺着底栏顺序）
    if (a >= 0 && b >= 0) dir = ((b - a + ORDER.length) % ORDER.length) <= 2 ? 1 : -1;
    const hp = $('headPanel');
    const targets = [$('content')];
    if (hp && hp.style.display !== 'none') targets.push(hp);
    targets.forEach((n) => {
      if (!n) return;
      n.classList.remove('pgTabR', 'pgTabL');
      void n.offsetWidth;
      n.classList.add(dir > 0 ? 'pgTabR' : 'pgTabL');
      setTimeout(() => n.classList.remove('pgTabR', 'pgTabL'), 300);
    });
  }

  function setTab(tab) {
    if (!['home', 'list', 'cal', 'set'].includes(tab)) tab = 'home';
    const prev = ui.tab || 'home';
    if (prev === tab) { renderAll(); return; }
    ui.tab = tab;
    ui.q = ''; const sb = $('searchbar'), si = $('searchInput');
    if (sb) sb.hidden = true;
    if (si) si.value = '';
    renderAll();
    animateTabSwitch(prev, tab);
  }

  function renderPlaceholder(emoji, title, sub) {
    const c = $('content');
    if (!c) return;
    c.innerHTML = '<div class="ph"><div class="ph-i">' + emoji + '</div><div class="ph-t">' + esc(title) + '</div><div class="ph-s">' + esc(sub) + '</div></div>';
  }

  function todayCyclePhase() {
    const today = C().todayMid();
    const cycle = S().getCycle();
    const marks = S().getMarks();
    const cycles = S().getCycles();
    const ds = C().ymd(today);
    const activeStart = getActiveStart(cycle, cycles);
    if (!activeStart) return { phase: 'none', info: null, cycle, marks, cycles };
    const run = actualRunFor(marks, today);
    if (run || (marks[ds] && marks[ds].f > 0)) return { phase: 'period', info: { actual: true, run }, cycle, marks, cycles };
    const kind = dayStatus(today, cycle, cycles);
    return { phase: kind === 'normal' ? 'safe' : kind, info: null, cycle, marks, cycles };
  }

  function homeCycleBlock(ph) {
    const today = C().todayMid();
    const { phase, info, cycle, marks, cycles } = ph;
    const meta = { icon: '🌱', title: '生理期 · 待设置', big: '设置开始日', sub: '点卡片去月历开启预测', tag: '' };
    if (phase === 'period') {
      meta.icon = '🌸';
      if (info && info.run) {
        meta.title = '生理期 · 经期进行中';
        meta.big = '第 ' + (C().dayDiff(today, C().parseYMD(info.run.start)) + 1) + ' 天';
        meta.sub = '注意保暖休息，结束那天记得标记结束';
      } else {
        const sum = periodSummary(cycle, cycles, today);
        meta.title = '生理期 · 预测经期';
        meta.big = sum ? '第 ' + sum.day + ' 天' : '经期日';
        meta.sub = '预测阶段，实际以你记录为准';
      }
      meta.tag = '';
    } else if (phase === 'ovulation') {
      meta.icon = '🥚'; meta.title = '生理期 · 排卵日'; meta.big = '受孕概率高';
      meta.sub = '身体信号：分泌物清亮、体温略升'; meta.tag = '今日排卵';
    } else if (phase === 'fertile') {
      meta.icon = '❤️'; meta.title = '生理期 · 易孕期'; meta.big = '概率较高';
      meta.sub = '保持记录，随时掌握身体状态'; meta.tag = '易孕窗口';
    } else if (phase === 'safe') {
      meta.icon = '🍃'; meta.title = '生理期 · 安全期'; meta.big = '状态平稳';
      meta.sub = '今天照顾好自己，为下个周期蓄力'; meta.tag = '';
    }
    const sum = phase !== 'none' ? periodSummary(cycle, cycles, today) : null;
    const progress = sum ? '<div class="hc-bar"><i style="width:' + Math.min(100, Math.round((sum.day / (cycle.cycleLen || 28)) * 100)) + '%"></i></div>' : '';
    // 怀孕概率：已预测则显示今天的概率
    const aiProbs = getAiProbs(cycle);
    const todayStr = C().ymd(today);
    let probLine = '';
    if (aiProbs && aiProbs[todayStr] != null) {
      const p = aiProbs[todayStr];
      probLine = '<div class="hc-prob">今日怀孕概率 <b>' + p + '%</b>' + (p >= 50 ? ' 高危' : p >= 15 ? ' 较高' : ' 较低') + '</div>';
    } else if (phase !== 'none') {
      probLine = '<div class="hc-prob hc-prob-empty">怀孕概率未预测 · 去月历点击「怀孕概率」</div>';
    }
    return '<div class="hm hc ph-' + phase + '" id="homeCycle">' +
      '<div class="hc-icon">' + meta.icon + '</div>' +
      '<div class="hc-body">' +
      '<div class="hc-t">' + esc(meta.title) + (meta.tag ? '<span class="hc-tag">' + esc(meta.tag) + '</span>' : '') + '</div>' +
      '<div class="hc-big">' + esc(meta.big) + '</div>' +
      '<div class="hc-sub">' + esc(meta.sub) + '</div>' +
      probLine +
      progress +
      '</div>' +
      '<span class="chev">›</span>' +
      '</div>';
  }

  function homeAnnivBlock() {
    const st = S().load();
    const list = S().sortEvents(st.events.slice()).slice(0, 3);
    let rows = '';
    for (const ev of list) {
      const cat = S().catById(ev.cat);
      const s = C().stateOf(ev);
      rows += '<div class="hm-ev" data-id="' + ev.id + '" style="--cc:' + cat.color + '">' +
        '<span class="hm-ev-i">' + esc(cat.icon || '📌') + '</span>' +
        '<span class="hm-ev-t"><b>' + esc(ev.title) + '</b><i>' + esc(s.dateLine) + '</i></span>' +
        '<span class="hm-ev-n">' + (s.phase === 'today' ? '就是今天' : (s.phase === 'past' ? '已过 ' + s.num + ' 天' : (s.phase === 'none' ? '—' : '还有 ' + s.num + ' 天'))) + '</span>' +
        '</div>';
    }
    if (!rows) rows = '<div class="hm-empty">还没有事件，点下方按钮新建</div>';
    return '<div class="hm hc anni" id="homeAnni">' +
      '<div class="hc-icon">📅</div>' +
      '<div class="hc-body">' +
      '<div class="hc-t">纪念日<span class="hc-tag">最近 ' + Math.min(3, st.events.length) + ' 条</span></div>' +
      rows +
      '<button type="button" class="btn ghost sm hm-plus" id="homeAddEv">＋ 新建事件</button>' +
      '</div>' +
      '</div>';
  }

  function renderHomePage() {
    const el = $('content');
    if (!el) return;
    const ph = todayCyclePhase();
    const phaseLabel = { none: '未设置', period: '经期', ovulation: '排卵日', fertile: '易孕期', safe: '安全期' }[ph.phase] || '';
    el.innerHTML =
      '<div class="hm hc tip" id="homeTip">' +
      '<div class="hc-icon">💡</div>' +
      '<div class="hc-body">' +
      '<div class="hc-t">今日小贴士<span class="hc-tag">' + esc(phaseLabel) + '</span></div>' +
      '<div class="hm-tip-t" id="homeTipText">正在生成...</div>' +
      '</div>' +
      '</div>' +
      homeCycleBlock(ph) +
      homeAnnivBlock();

    fetchHomeTip(ph.phase, ph.cycle);

    const goCal = () => { ui.calYM = null; ui.pday = null; setTab('cal'); };
    const cyc = el.querySelector('#homeCycle'); if (cyc) cyc.onclick = goCal;
    const add = el.querySelector('#homeAddEv'); if (add) add.onclick = () => openEditor(null);
    el.querySelectorAll('.hm-ev').forEach((r) => { r.onclick = () => openEditor(r.dataset.id); });
  }

  function renderSettings() {
    const c = $('content');
    if (!c) return;
    const rows = [
      ['🎨', '外观与主题', 'theme'],
      ['💾', '备份与恢复', 'backup'],
      ['ℹ️', '关于本应用', 'about']
    ];
    let h = '<div class="page"><div class="ed-group page-list">';
    for (const r of rows) h += '<div class="set-row" data-act="' + r[2] + '"><span class="ic">' + r[0] + '</span><span class="cn">' + r[1] + '</span><span class="chev">›</span></div>';
    h += '</div></div>';
    c.innerHTML = h;
    c.querySelectorAll('.set-row').forEach((b) => {
      b.onclick = () => {
        const a = b.dataset.act;
        if (a === 'theme') openTheme();
        else if (a === 'backup') openBackup();
        else if (a === 'about') openAbout();
      };
    });
  }

  function refreshClock() {
    const ds = C().ymd(new Date());
    if (ds !== ui.lastDayStr) { ui.lastDayStr = ds; renderAll(); }
  }

  const pad2n = (n) => String(n).padStart(2, '0');
  const WEEK_CN2 = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  // 北京/服务器时间同步：以 Date 响应头为准，纠正本机时钟偏差
  function netNow() { return new Date(Date.now() + (ui.netOffset || 0)); }
  function syncNetTime() {
    if (!window.fetch || typeof location === 'undefined' || !location.href || location.protocol === 'file:') return;
    const t0 = Date.now();
    fetch(location.href.split('#')[0], { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        const srv = r.headers.get('Date');
        if (!srv) return;
        const st = Date.parse(srv);
        if (isNaN(st)) return;
        const t1 = Date.now();
        const off = st - Math.round((t0 + t1) / 2);
        if (Math.abs(off) < 86400000) ui.netOffset = off; // 忽略异常头
        updateBrandDateText();
      }).catch(() => { /* 离线/file 下用本机时间 */ });
  }
  function updateBrandDateText() {
    const bd = $('brandDate');
    if (!bd) return;
    if (ui.tab !== 'home') { bd.textContent = ''; return; }
    const t = netNow();
    bd.textContent = t.getFullYear() + '年' + (t.getMonth() + 1) + '月' + t.getDate() + '日 ' + WEEK_CN2[t.getDay()] + ' ' + pad2n(t.getHours()) + ':' + pad2n(t.getMinutes()) + ':' + pad2n(t.getSeconds());
  }

  function syncReminders() {
    const st = S().load();
    if (!st.events.length) return;
    const items = N().reminderItems(st.events);
    N().syncToWorker(items);
    // 前台到点直接弹（仅未来 10 分钟内的）
    const now = Date.now();
    for (const it of items) {
      if (it.dueAt > now && it.dueAt - now < 10 * 60000) {
        const wait = it.dueAt - now;
        setTimeout(() => {
          if (document.visibilityState === 'visible') N().now(it.title, it.body);
        }, wait + 200);
      }
    }
  }

  /* ---------- 顶层事件绑定 ---------- */
  function wireTop() {
    $('btnAdd').onclick = () => openEditor(null);
    const bC = $('btnCat');
    if (bC) bC.onclick = () => openCatManage(false);
    $('fab').onclick = () => openEditor(null);
    $('btnMore').onclick = openMoreMenu;
    $('btnView').onclick = () => {
      ui.view = ui.view === 'list' ? 'calendar' : 'list';
      S().setPrefs({ view: ui.view });
      renderAll();
    };
    $('btnSearch').onclick = () => {
      const sb = $('searchbar');
      sb.hidden = !sb.hidden;
      if (!sb.hidden) $('searchInput').focus();
      else { ui.q = ''; $('searchInput').value = ''; renderAll(); }
    };
    $('searchClear').onclick = () => { ui.q = ''; const sb = $('searchbar'); if (sb) sb.hidden = true; const si = $('searchInput'); if (si) si.value = ''; renderList(); };
    $('searchInput').addEventListener('input', (e) => { ui.q = e.target.value.trim(); if (ui.tab === 'list') renderList(); });

    // 底栏导航
    const tb = $('tabbar');
    if (tb) tb.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); });

    // 筛选 chips
    $('chips').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      const f = b.dataset.f;
      if (f === 'all') ui.filter = 'all';
      else ui.filter = ui.filter === f.slice(2) ? 'all' : f.slice(2);
      renderChips();
      if (ui.tab === 'list') renderList();
    });

    // 遮罩关闭：页面与居中模态分开处理
    $('overlay').addEventListener('click', (e) => {
      const t = e.target;
      if ((t.classList && t.classList.contains('overlay-mask')) || (t.closest && t.closest('[data-close]'))) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (modalOpen()) { const c = $('overlay').querySelector('[data-r="0"]'); if (c) c.click(); else closeModal(); }
      else closeSheet();
    });

    // 列表点击
    $('content').addEventListener('click', (e) => {
      const actBtn = e.target.closest('button[data-k]');
      if (actBtn) {
        const card = actBtn.closest('.card');
        const id = card && card.dataset.id;
        const ev = id ? S().load().events.find((x) => x.id === id) : null;
        if (ev) {
          const k = actBtn.dataset.k;
          if (k === 'more') openCardMenu(ev);
          else if (k === 'edit') openEditor(id);
          else if (k === 'del') removeWithUndo(ev);
        }
        return;
      }
      const card = e.target.closest('.card');
      if (card && Date.now() > ui.swipeLockUntil) {
        const id = card.dataset.id;
        if (id && S().load().events.some((x) => x.id === id)) openEditor(id);
      }
    });
  }

  function init() {
    ui.el = { chips: $('chips'), content: $('content') };
    // 支持 ?tab=home|list|cal|set 直达某页（供截图/分享使用）
    try {
      const qt = new URLSearchParams(window.location.search || '').get('tab');
      if (['home', 'list', 'cal', 'set'].includes(qt)) ui.tab = qt;
    } catch (e) { /* 忽略 */ }
    // 打开默认在首页（不再恢复上次所在的页签）
    // 若没有事件且是首次，不自动塞示例
    applyTheme();
    wireTop();
    wireSwipes();
    wireSwipeBack();
    renderAll();
    ui.lastDayStr = C().ymd(new Date());
    // 顶栏实时时钟（首页显示秒）
    setInterval(updateBrandDateText, 1000);
    syncNetTime();
    setInterval(syncNetTime, 10 * 60000);
    // 清除周期数据后整页重载，加载完成提示一次
    try {
      if (sessionStorage.getItem('dm_cycle_cleared') === '1') {
        sessionStorage.removeItem('dm_cycle_cleared');
        setTimeout(() => toast('周期数据已清除 ✓（记录与预测已清空）'), 300);
      }
    } catch (e) { /* 忽略 */ }
    // ?pg=editor|cat|theme|about|cycle|more 自动打开页面（截图/调试用）
    try {
      const sp = new URLSearchParams(location.search || '').get('pg');
      if (sp) {
        const map = {
          editor: () => openEditor(null), cat: () => openCatManage(false),
          theme: () => openTheme(), about: () => openAbout(),
          cycle: () => openCycleSheet(), more: () => openMoreMenu(),
          dlg: () => confirmDlg('删除事件', '确定删除「测试日子」吗？', '删除')
        };
        if (map[sp]) map[sp]();
      }
    } catch (e) { /* 忽略 */ }
    // 安卓返回键处理：Capacitor App 插件优先，History API 兜底
    const handleBack = () => {
      if (pgEl) { closeSheet(); return true; }
      if (modalOpen()) { closeModal(); return true; }
      if (ui.pday) { ui.pday = null; renderAll(); return true; }
      if (ui.tab !== 'home') { setTab('home'); return true; }
      return false; // 在首页且无弹窗，允许退出
    };
    const tryCapacitorBack = () => {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', () => {
          if (!handleBack()) window.Capacitor.Plugins.App.exitApp();
        });
        return true;
      }
      return false;
    };
    if (!tryCapacitorBack()) {
      // 兜底：延迟重试，确保 Capacitor 加载完成
      setTimeout(() => {
        if (!tryCapacitorBack()) {
          // 最后兜底：History API
          history.pushState({ dm: 'root' }, '');
          window.addEventListener('popstate', () => {
            handleBack();
            history.pushState({ dm: 'root' }, '');
          });
        }
      }, 1000);
    }
  }

  window.DM = window.DM || {};
  window.DM.ui = { init, renderAll, renderList, renderCalendar, renderPeriodPage, renderHomePage, openCycleSheet, refreshClock, syncReminders, openEditor, openCatManage, toast };
})();
