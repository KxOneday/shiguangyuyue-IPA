/* ============================================================
 * app.js —— 入口：注册 SW、读状态、渲染、定期刷新
 * ============================================================ */
'use strict';
(function () {
  window.addEventListener('DOMContentLoaded', () => {
    const store = window.DM.store;
    store.load();

    if ('serviceWorker' in navigator) {
      // 新版 SW 接管后自动刷新一次（每个会话最多一次，防止随机参数注册造成循环刷新）
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        try {
          if (sessionStorage.getItem('dm_sw_reloaded') === '1') return;
          sessionStorage.setItem('dm_sw_reloaded', '1');
        } catch (e) { /* 忽略 */ }
        location.reload();
      });
      // 固定 URL 注册；sw.js 由服务器以 no-store 提供，每次访问都会做字节级更新检查
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    window.DM.ui.init();

    // 每分钟刷新一次“天数”，保证跨天/临界状态正确
    setInterval(() => { window.DM.ui.refreshClock(); }, 60000);

    // 提醒调度：打开页面时把清单同步给 SW（并在前台到点直接提醒）
    window.DM.ui.syncReminders();
    setInterval(() => { window.DM.ui.syncReminders(); }, 15 * 60000);
  });
})();
