/* PWA: offline cache + local reminder scheduler */
'use strict';

const VERSION = 'daoshuri-v2.55.0';
const SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/lunar.js',
  './js/core.js',
  './js/store.js',
  './js/notify.js',
  './js/ui.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => scheduleFromCache())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', cp)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match('./index.html'))));
});

/* ---------------- 提醒调度（尽力而为：页面关闭后依赖浏览器策略） ---------------- */

const SCHEDULE_KEY = 'schedule-v1';

function readSchedule() {
  return caches.open(VERSION).then((c) => c.match(SCHEDULE_KEY).then((r) => (r ? r.json() : []))).catch(() => []);
}

function writeSchedule(list) {
  return caches.open(VERSION).then((c) => c.put(SCHEDULE_KEY, new Response(JSON.stringify(list), { headers: { 'Content-Type': 'application/json' } })));
}

let timer = null;

function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }

function fireOne(item) {
  try {
    self.registration.showNotification(item.title || '倒数日提醒', {
      body: item.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'countdown-' + item.id,
      data: { id: item.id }
    });
  } catch (err) { /* 静默 */ }
}

let firedKeys = new Set();
function scheduleFromCache() {
  clearTimer();
  readSchedule().then((list) => {
    const now = Date.now();
    const future = list.filter((i) => i.dueAt && i.dueAt > now).sort((a, b) => a.dueAt - b.dueAt);
    const due = list.filter((i) => i.dueAt && i.dueAt <= now);
    due.forEach((i) => {
      const key = i.id + ':' + i.dueAt;
      if (!firedKeys.has(key)) { firedKeys.add(key); fireOne(i); }
    });
    if (!future.length) return;
    // SW may be killed at any time; reminders are best-effort while running (pre-warm up to 3 min).
    const next = future[0];
    const wait = Math.min(next.dueAt - now, 3 * 86400000);
    timer = setTimeout(() => {
      const key = next.id + ':' + next.dueAt;
      if (!firedKeys.has(key)) { firedKeys.add(key); fireOne(next); }
      scheduleFromCache();
    }, wait);
  }).catch(() => {});
}

self.addEventListener('message', (e) => {
  const data = e.data || {};
  if (data.type === 'sync-schedule') {
    writeSchedule(data.list || []).then(() => scheduleFromCache());
  } else if (data.type === 'clear-schedule') {
    writeSchedule([]).then(() => clearTimer());
  }
});

// 在合适的时机（如被唤醒）重新排程
self.addEventListener('sync', (e) => { if (e.tag === 'countdown-sync') e.waitUntil(scheduleFromCache()); });
self.addEventListener('periodicsync', (e) => { if (e.tag === 'countdown-sync') e.waitUntil(scheduleFromCache()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL('./index.html', self.location.origin).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});
