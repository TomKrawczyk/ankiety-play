// ============================================================
// 🔔 POWIADOMIENIA PUSH — przypomnienie o evencie dnia
// ============================================================
// Lokalne powiadomienia (bez serwera): rejestrujemy service worker,
// prosimy o zgodę po pierwszej ankiecie, a o ustalonej porze rano
// pokazujemy powiadomienie z dzisiejszym eventem misji.
// Jeśli appka jest otwarta — używamy timera; powiadomienie wyświetla SW.

var PUSH = {
  hour: 9,            // godzina porannego przypomnienia (lokalna)
  promptKey: '4eco_push_asked',
  lastNotifKey: '4eco_push_last'
};

// rejestracja service workera
function initPush() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(function () {
    // jeśli zgoda już jest — uruchom planowanie
    if (Notification && Notification.permission === 'granted') scheduleDailyReminder();
  }).catch(function () {});
}

// poproś o zgodę (wywoływane po 1. zapisanej ankiecie — mniej nachalne)
function maybeAskPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (Notification.permission !== 'default') {           // już zdecydowano
    if (Notification.permission === 'granted') scheduleDailyReminder();
    return;
  }
  if (localStorage.getItem(PUSH.promptKey)) return;       // już pytaliśmy
  localStorage.setItem(PUSH.promptKey, '1');
  // delikatny toast zanim wyskoczy systemowy prompt
  if (typeof showToast === 'function') showToast('🔔 Włącz powiadomienia, by nie przegapić eventu dnia!');
  setTimeout(function () {
    Notification.requestPermission().then(function (perm) {
      if (perm === 'granted') {
        if (typeof showToast === 'function') showToast('✅ Powiadomienia włączone!');
        scheduleDailyReminder();
        // mały od razu powitalny push potwierdzający
        showLocalNotification('🔔 Gotowe!', 'Rano dostaniesz info o evencie dnia 🚀');
      }
    });
  }, 800);
}

// pokaż powiadomienie przez service worker (działa też w tle gdy karta otwarta)
function showLocalNotification(title, body) {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;
  navigator.serviceWorker.ready.then(function (reg) {
    reg.showNotification(title, {
      body: body, icon: 'icon.png', badge: 'icon.png', tag: 'daily-event', renotify: true
    });
  }).catch(function () {});
}

// tekst powiadomienia zależny od dnia (weekend vs zwykły event)
function buildReminderText() {
  if (typeof isWeekend === 'function' && isWeekend() && typeof WEEKEND_EVENT !== 'undefined') {
    return { title: '🏔️ WEEKEND RAID czeka!', body: WEEKEND_EVENT.tag + ' Wbij i zgarnij mega-nagrody XP!' };
  }
  if (typeof todaysEvent === 'function') {
    var ev = todaysEvent();
    return { title: ev.emoji + ' ' + ev.name + ' — event dnia!', body: ev.tag + ' Odbierz dzisiejsze nagrody XP 🚀' };
  }
  return { title: '🎟️ Nowy event misji!', body: 'Wbij do apki i zgarnij nagrody XP 🚀' };
}

// zaplanuj przypomnienie na najbliższą PUSH.hour (działa gdy karta żyje w tle)
function scheduleDailyReminder() {
  if (Notification.permission !== 'granted') return;
  // pokaż dziś, jeśli już po godzinie i jeszcze nie pokazaliśmy
  var todayStr = new Date().toLocaleDateString('pl-PL');
  var last = localStorage.getItem(PUSH.lastNotifKey);
  var now = new Date();
  if (now.getHours() >= PUSH.hour && last !== todayStr) {
    fireReminder(todayStr);
  }
  // ustaw timer na następną PUSH.hour
  var next = new Date();
  next.setHours(PUSH.hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  var ms = next - now;
  // setTimeout ma limit ~24.8 dnia — tu zawsze < 24h, więc OK
  setTimeout(function () {
    fireReminder(new Date().toLocaleDateString('pl-PL'));
    // i ponów na kolejny dzień
    setInterval(function () {
      fireReminder(new Date().toLocaleDateString('pl-PL'));
    }, 24 * 60 * 60 * 1000);
  }, ms);
}

function fireReminder(dayStr) {
  if (localStorage.getItem(PUSH.lastNotifKey) === dayStr) return; // raz dziennie
  localStorage.setItem(PUSH.lastNotifKey, dayStr);
  var t = buildReminderText();
  showLocalNotification(t.title, t.body);
}
