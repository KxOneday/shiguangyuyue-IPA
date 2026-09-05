/* ============================================================
 * notify.js —— Web 通知提醒（尽力而为，受浏览器/平台限制）
 * ============================================================ */
'use strict';
(function () {
  const C = () => window.DM.core;

  function supported() { return 'Notification' in window && 'serviceWorker' in navigator; }
  function permission() { return supported() ? Notification.permission : 'unsupported'; }

  function request() {
    if (!supported()) return Promise.resolve('unsupported');
    return Notification.requestPermission();
  }

  /** 计算每条提醒事件的下一次提醒时刻（毫秒时间戳） */
  function reminderItems(events, now) {
    now = now || new Date();
    const today = C().todayMid(now);
    const out = [];
    for (const ev of events) {
      if (!ev.remind) continue;
      let occ = C().nextOnOrAfter(ev, today);
      if (!occ) continue; // 非重复且已过去的日期没有“未来提醒”
      for (let guard = 0; guard < 2; guard++) {
        const due = C().addDays(occ, -ev.remind.adv);
        due.setHours(parseInt(ev.remind.hh, 10) || 9, parseInt(ev.remind.mm, 10) || 0, 0, 0);
        if (due.getTime() > now.getTime()) {
          const diff = C().dayDiff(occ, C().todayMid(due));
          const body = diff <= 0
            ? '「' + ev.title + '」就是今天 🎉'
            : '「' + ev.title + '」还有 ' + diff + ' 天（' + C().fmtCN(occ) + '）';
          out.push({ id: ev.id, title: '倒数日提醒', body, dueAt: due.getTime() });
          break;
        }
        // 已错过：若是每年重复，找下一次
        if (ev.repeat) {
          occ = C().nextOnOrAfter(ev, C().addDays(occ, 1));
          if (!occ) break;
        } else break;
      }
    }
    return out;
  }

  /** 立即弹通知 */
  function now(title, body) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'dm-now-' + Date.now() });
      }
    } catch (e) { /* 忽略 */ }
  }

  /** 把提醒清单同步给 Service Worker（后台尽力提醒） */
  function syncToWorker(items) {
    try {
      if (!('serviceWorker' in navigator)) return;
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.active) reg.active.postMessage({ type: 'sync-schedule', list: items });
      }).catch(() => {});
    } catch (e) { /* 忽略 */ }
  }

  window.DM = window.DM || {};
  window.DM.notify = { supported, permission, request, reminderItems, now, syncToWorker };
})();
