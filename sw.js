// Service Worker — ankiety-play (push + offline-lite)
var CACHE = 'ankiety-play-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

// Obsługa powiadomień zaplanowanych przez stronę (showNotification z timera)
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// (opcjonalnie) prawdziwy web-push z serwera — gotowe pod przyszłość
self.addEventListener('push', function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  var title = data.title || '🎟️ Nowy event misji!';
  var body = data.body || 'Wbij do apki i odbierz dzisiejsze nagrody XP 🚀';
  e.waitUntil(self.registration.showNotification(title, {
    body: body, icon: data.icon || './icon.png', badge: './icon.png', tag: 'daily-event'
  }));
});
