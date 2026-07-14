// ============================================================
// 🎟️ DZIENNE EVENTY MISJI — vibe Gen Z
// ============================================================
// Codziennie rotuje inny EVENT z własnym motywem, zestawem misji,
// slangiem i nagrodami XP do ODBIORU (claim). Postęp liczony z realnych
// statystyk (today/hot/streak/total). Reset codziennie o północy.
// Append-only: zastępuje treść #missionRow własną sekcją eventu.

// ── Eventy: 7 motywów, jeden na każdy dzień tygodnia (rotacja) ──
var DAILY_EVENTS = [
  { // Niedziela
    id:'comfy', name:'Comfy Sunday', emoji:'🛋️', vibe:'#a78bfa',
    tag:'no pressure, tylko grind 😌',
    missions:[
      {id:'s2', icon:'📝', label:'Wbij 2 ankiety na rozgrzewkę', stat:'today', target:2, xp:60},
      {id:'h1', icon:'🔥', label:'Złap 1 gorący lead', stat:'hot', target:1, xp:90}
    ]
  },
  { // Poniedziałek
    id:'grind', name:'Monday Grindset', emoji:'💪', vibe:'#22d3ee',
    tag:'rise & grind, sigma 🗿',
    missions:[
      {id:'s5', icon:'⚡', label:'5 ankiet — zacznij tydzień z buta', stat:'today', target:5, xp:120},
      {id:'h2', icon:'🌶️', label:'2 gorące leady', stat:'hot', target:2, xp:140},
      {id:'st2',icon:'🔗', label:'Streak 2 dni z rzędu', stat:'streak', target:2, xp:80}
    ]
  },
  { // Wtorek
    id:'speed', name:'Speedrun Tuesday', emoji:'🏃', vibe:'#f472b6',
    tag:'gotta go fast — any% ankiety 💨',
    missions:[
      {id:'s7', icon:'🚀', label:'7 ankiet — speedrun mode', stat:'today', target:7, xp:170},
      {id:'h2', icon:'🔥', label:'2 gorące leady w biegu', stat:'hot', target:2, xp:130}
    ]
  },
  { // Środa
    id:'hump', name:'Hump Day Hustle', emoji:'🐫', vibe:'#34d399',
    tag:'half way there bestie 🫶',
    missions:[
      {id:'s4', icon:'📋', label:'4 ankiety — utrzymaj flow', stat:'today', target:4, xp:100},
      {id:'h1', icon:'🌶️', label:'1 gorący lead', stat:'hot', target:1, xp:90},
      {id:'st3',icon:'🔗', label:'Streak 3 dni — lock in', stat:'streak', target:3, xp:110}
    ]
  },
  { // Czwartek
    id:'boss', name:'Thursday Boss Mode', emoji:'👑', vibe:'#fbbf24',
    tag:'main character energy ✨',
    missions:[
      {id:'s6', icon:'⚡', label:'6 ankiet — boss level', stat:'today', target:6, xp:150},
      {id:'h3', icon:'🔥', label:'3 gorące leady — W rizz', stat:'hot', target:3, xp:200}
    ]
  },
  { // Piątek
    id:'fire', name:'Friday on Fire', emoji:'🔥', vibe:'#fb7185',
    tag:'lit weekend incoming 🎉',
    missions:[
      {id:'s5', icon:'🎯', label:'5 ankiet — domknij tydzień', stat:'today', target:5, xp:130},
      {id:'h3', icon:'🌶️', label:'3 gorące leady — slay', stat:'hot', target:3, xp:180},
      {id:'st4',icon:'🔗', label:'Streak 4 dni — no cap', stat:'streak', target:4, xp:140}
    ]
  },
  { // Sobota
    id:'gigachad', name:'Saturday Gigachad', emoji:'🗿', vibe:'#60a5fa',
    tag:'weekend warrior, built different 💎',
    missions:[
      {id:'s8', icon:'💎', label:'8 ankiet — built different', stat:'today', target:8, xp:200},
      {id:'h2', icon:'🔥', label:'2 gorące leady', stat:'hot', target:2, xp:140}
    ]
  }
];

// dzisiejszy event wg dnia tygodnia
function todaysEvent() {
  var d = new Date().getDay(); // 0=Nd
  return DAILY_EVENTS[d % DAILY_EVENTS.length];
}

function dailyDateKey() { return new Date().toLocaleDateString('pl-PL'); }
function dailyClaimKey() {
  return '4eco_daily_' + (window._user || 'anon').toLowerCase();
}
// odebrane misje dziś: { date:'...', claimed:['s5','h2'] }
function loadDailyClaims() {
  try {
    var o = JSON.parse(localStorage.getItem(dailyClaimKey()) || '{}');
    if (o.date !== dailyDateKey()) return { date: dailyDateKey(), claimed: [] };
    return { date: o.date, claimed: o.claimed || [] };
  } catch (e) { return { date: dailyDateKey(), claimed: [] }; }
}
function saveDailyClaims(o) {
  try { localStorage.setItem(dailyClaimKey(), JSON.stringify(o)); } catch (e) {}
}

// bieżąca wartość statystyki dla misji
function statValue(stat, s) {
  if (stat === 'today')  return s.today  || 0;
  if (stat === 'hot')    return s.hot    || 0;
  if (stat === 'streak') return s.streak || 0;
  if (stat === 'total')  return s.total  || 0;
  return 0;
}

// render sekcji eventu dnia (wstrzykiwane do #missionRow)
function renderDailyEvent(s) {
  var mr = document.getElementById('missionRow');
  if (!mr) return;
  // ── W weekend pokazujemy MEGA-EVENT zamiast zwykłego ──
  if (typeof isWeekend === 'function' && isWeekend()) { renderWeekendEvent(); return; }
  var ev = todaysEvent();
  var claims = loadDailyClaims();
  var doneCount = 0, totalXp = 0, claimedXp = 0;

  var rows = '';
  ev.missions.forEach(function (m) {
    var cur = Math.min(statValue(m.stat, s), m.target);
    var pct = Math.min(100, Math.round(cur / m.target * 100));
    var done = cur >= m.target;
    var claimed = claims.claimed.indexOf(m.id) > -1;
    if (done) doneCount++;
    totalXp += m.xp;
    if (claimed) claimedXp += m.xp;

    var btn;
    if (claimed) {
      btn = '<span class="dm-claimed">✓ odebrane</span>';
    } else if (done) {
      btn = '<button class="dm-claim" onclick="claimDaily(\'' + m.id + '\')">ODBIERZ +' + m.xp + ' XP</button>';
    } else {
      btn = '<span class="dm-xp">+' + m.xp + ' XP</span>';
    }

    rows +=
      '<div class="dm-row' + (done ? ' done' : '') + (claimed ? ' claimed' : '') + '">' +
        '<div class="dm-ic">' + m.icon + '</div>' +
        '<div class="dm-mid">' +
          '<div class="dm-label">' + m.label + '</div>' +
          '<div class="dm-bar"><div class="dm-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="dm-prog">' + cur + '/' + m.target + '</div>' +
        '</div>' +
        '<div class="dm-act">' + btn + '</div>' +
      '</div>';
  });

  var allDone = doneCount === ev.missions.length;
  var headLine = allDone
    ? 'event sklarowany — absolute W 🏆'
    : (doneCount + '/' + ev.missions.length + ' misji ' + (doneCount ? 'zaliczone 🤙' : '— let\'s go 🚀'));

  mr.innerHTML =
    '<div class="daily-event" style="--ev:' + ev.vibe + '">' +
      '<div class="de-head">' +
        '<div class="de-title">' + ev.emoji + ' <b>' + ev.name + '</b></div>' +
        '<div class="de-tag">' + ev.tag + '</div>' +
      '</div>' +
      '<div class="de-status">' + headLine + '</div>' +
      '<div class="de-list">' + rows + '</div>' +
    '</div>';
}

// odbierz nagrodę za ukończoną misję dnia
function claimDaily(mid) {
  var ev = todaysEvent();
  var m = null;
  ev.missions.forEach(function (x) { if (x.id === mid) m = x; });
  if (!m) return;
  // weryfikacja: misja faktycznie ukończona
  var s = (typeof getStats === 'function') ? getStats(window._user) : {};
  if (statValue(m.stat, s) < m.target) {
    if (typeof showToast === 'function') showToast('⏳ Misja jeszcze nie zaliczona!');
    return;
  }
  var claims = loadDailyClaims();
  if (claims.claimed.indexOf(mid) > -1) return; // już odebrane
  claims.claimed.push(mid);
  saveDailyClaims(claims);

  // przyznaj XP (osobne, nie rusza liczby ankiet)
  if (typeof awardWildXp === 'function') {
    awardWildXp(window._user, m.xp);
  } else if (typeof addXP === 'function') {
    // fallback — nie powinno się zdarzyć, awardWildXp jest w map.js
    addXP(window._user, m.xp, false);
  }
  if (typeof floatXP === 'function') floatXP('🎟️ +' + m.xp + ' XP');
  if (typeof confettiBlast === 'function') confettiBlast();
  if (typeof showToast === 'function') showToast('🎟️ Misja zaliczona! +' + m.xp + ' XP');

  // sprawdź czy wszystkie misje eventu odebrane → bonus za komplet
  var allClaimed = ev.missions.every(function (x) { return claims.claimed.indexOf(x.id) > -1; });
  if (allClaimed) {
    var BONUS = 100;
    if (typeof awardWildXp === 'function') awardWildXp(window._user, BONUS);
    if (typeof showToast === 'function') setTimeout(function () { showToast('🏆 Cały event sklarowany! Bonus +' + BONUS + ' XP'); }, 1400);
    if (typeof floatXP === 'function') setTimeout(function () { floatXP('🏆 +' + BONUS + ' XP komplet!'); }, 1500);
  }

  // odśwież widok
  var s2 = (typeof getStats === 'function') ? getStats(window._user) : {};
  renderDailyEvent(s2);
}

// ============================================================
// 🏔️ WEEKEND MEGA-EVENT — sobota + niedziela jako jedno wyzwanie
// ============================================================
// W weekend zamiast dwóch osobnych eventów leci JEDEN wielki event
// rozłożony na 2 dni. Wspólny postęp (sob+nd), grubsze cele i nagrody,
// plus mega-bonus za sklarowanie całości. Vibe: weekendowy rajd.

var WEEKEND_EVENT = {
  id:'megaweekend', name:'WEEKEND RAID', emoji:'🏔️', vibe:'#f59e0b',
  tag:'2 dni, full send — no days off 😤',
  // cele liczone z postępu WEEKENDOWEGO (sob+nd razem)
  missions:[
    {id:'w_s12', icon:'⚔️', label:'12 ankiet przez cały weekend', stat:'we_surveys', target:12, xp:300},
    {id:'w_h5',  icon:'🔥', label:'5 gorących leadów — raid boss', stat:'we_hot', target:5, xp:350},
    {id:'w_2d',  icon:'📆', label:'Działaj w SOBOTĘ i NIEDZIELĘ', stat:'we_days', target:2, xp:200}
  ],
  comboBonus: 250 // mega-bonus za komplet
};

function isWeekend() { var d = new Date().getDay(); return d === 0 || d === 6; }

// klucz weekendu: rok + numer soboty (sob i nd dzielą ten sam klucz)
function weekendKey() {
  var now = new Date();
  var d = new Date(now);
  if (d.getDay() === 0) d.setDate(d.getDate() - 1); // niedziela -> przypisz do soboty
  return '4eco_we_' + (window._user || 'anon').toLowerCase() + '_' + d.getFullYear() + '_' + d.getMonth() + '_' + d.getDate();
}

// stan weekendu: skumulowany postęp sob+nd
function loadWeekendState() {
  try {
    var o = JSON.parse(localStorage.getItem(weekendKey()) || '{}');
    return { surveys: o.surveys || 0, hot: o.hot || 0, days: o.days || [], claimed: o.claimed || [] };
  } catch (e) { return { surveys: 0, hot: 0, days: [], claimed: [] }; }
}
function saveWeekendState(o) {
  try { localStorage.setItem(weekendKey(), JSON.stringify(o)); } catch (e) {}
}

// wywoływane po zapisie ankiety w weekend — kumuluje postęp
function trackWeekendProgress(isHot) {
  if (!isWeekend()) return;
  var st = loadWeekendState();
  st.surveys += 1;
  if (isHot) st.hot += 1;
  var today = new Date().toLocaleDateString('pl-PL');
  if (st.days.indexOf(today) === -1) st.days.push(today);
  saveWeekendState(st);
}

// wartość statystyki weekendowej dla misji
function weStatValue(stat, st) {
  if (stat === 'we_surveys') return st.surveys || 0;
  if (stat === 'we_hot')     return st.hot || 0;
  if (stat === 'we_days')    return (st.days || []).length;
  return 0;
}

// render weekendowego mega-eventu (zastępuje zwykły event w sob/nd)
function renderWeekendEvent() {
  var mr = document.getElementById('missionRow');
  if (!mr) return;
  var ev = WEEKEND_EVENT;
  var st = loadWeekendState();
  var doneCount = 0;

  var rows = '';
  ev.missions.forEach(function (m) {
    var cur = Math.min(weStatValue(m.stat, st), m.target);
    var pct = Math.min(100, Math.round(cur / m.target * 100));
    var done = cur >= m.target;
    var claimed = st.claimed.indexOf(m.id) > -1;
    if (done) doneCount++;

    var btn;
    if (claimed) btn = '<span class="dm-claimed">✓ odebrane</span>';
    else if (done) btn = '<button class="dm-claim" onclick="claimWeekend(\'' + m.id + '\')">ODBIERZ +' + m.xp + ' XP</button>';
    else btn = '<span class="dm-xp">+' + m.xp + ' XP</span>';

    rows +=
      '<div class="dm-row' + (done ? ' done' : '') + (claimed ? ' claimed' : '') + '">' +
        '<div class="dm-ic">' + m.icon + '</div>' +
        '<div class="dm-mid">' +
          '<div class="dm-label">' + m.label + '</div>' +
          '<div class="dm-bar"><div class="dm-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="dm-prog">' + cur + '/' + m.target + '</div>' +
        '</div>' +
        '<div class="dm-act">' + btn + '</div>' +
      '</div>';
  });

  var allDone = doneCount === ev.missions.length;
  var headLine = allDone ? 'RAID CLEARED — absolute legend 🏆🔥'
    : (doneCount + '/' + ev.missions.length + ' celów raidu 💪');

  mr.innerHTML =
    '<div class="daily-event weekend-event" style="--ev:' + ev.vibe + '">' +
      '<div class="we-banner">🏔️ MEGA WEEKEND EVENT 🏔️</div>' +
      '<div class="de-head">' +
        '<div class="de-title">' + ev.emoji + ' <b>' + ev.name + '</b></div>' +
        '<div class="de-tag">' + ev.tag + '</div>' +
      '</div>' +
      '<div class="de-status">' + headLine + '</div>' +
      '<div class="de-list">' + rows + '</div>' +
    '</div>';
}

// odbierz nagrodę weekendową
function claimWeekend(mid) {
  var ev = WEEKEND_EVENT, m = null;
  ev.missions.forEach(function (x) { if (x.id === mid) m = x; });
  if (!m) return;
  var st = loadWeekendState();
  if (weStatValue(m.stat, st) < m.target) {
    if (typeof showToast === 'function') showToast('⏳ Cel raidu jeszcze nie zaliczony!');
    return;
  }
  if (st.claimed.indexOf(mid) > -1) return;
  st.claimed.push(mid);
  saveWeekendState(st);

  if (typeof awardWildXp === 'function') awardWildXp(window._user, m.xp);
  if (typeof floatXP === 'function') floatXP('🏔️ +' + m.xp + ' XP');
  if (typeof confettiBlast === 'function') confettiBlast();
  if (typeof showToast === 'function') showToast('⚔️ Cel raidu zaliczony! +' + m.xp + ' XP');

  var allClaimed = ev.missions.every(function (x) { return st.claimed.indexOf(x.id) > -1; });
  if (allClaimed) {
    if (typeof awardWildXp === 'function') awardWildXp(window._user, ev.comboBonus);
    if (typeof showToast === 'function') setTimeout(function () { showToast('🏆 RAID CLEARED! Mega-bonus +' + ev.comboBonus + ' XP'); }, 1400);
    if (typeof floatXP === 'function') setTimeout(function () { floatXP('🏆 +' + ev.comboBonus + ' XP RAID!'); }, 1500);
  }
  renderWeekendEvent();
}

// ============================================================
// 📣 ZAPOWIEDŹ WEEKENDU — baner w piątek po otwarciu apki
// ============================================================
// W piątek (i tylko raz dziennie) pokazujemy hype-baner, że zbliża się
// WEEKEND RAID. Zero kosztów — czysto lokalne. Jeśli ankieter ma włączone
// powiadomienia, dorzucamy też lokalny push z zapowiedzią.

function isFriday() { return new Date().getDay() === 5; }

function weekendTeaserKey() {
  return '4eco_weteaser_' + (window._user || 'anon').toLowerCase();
}

// pokaż zapowiedź weekendu — wywoływane po otwarciu apki
function maybeShowWeekendTeaser() {
  if (!isFriday()) return;
  var today = new Date().toLocaleDateString('pl-PL');
  // raz dziennie
  if (localStorage.getItem(weekendTeaserKey()) === today) return;
  localStorage.setItem(weekendTeaserKey(), today);

  var ev = (typeof WEEKEND_EVENT !== 'undefined') ? WEEKEND_EVENT : null;
  var maxXp = ev ? (ev.missions.reduce(function (a, m) { return a + m.xp; }, 0) + (ev.comboBonus || 0)) : 1100;

  // overlay z hype-em
  var ov = document.createElement('div');
  ov.className = 'wt-overlay';
  ov.innerHTML =
    '<div class="wt-card">' +
      '<div class="wt-emoji">🏔️</div>' +
      '<div class="wt-kicker">JUTRO STARTUJE</div>' +
      '<div class="wt-title">WEEKEND RAID</div>' +
      '<div class="wt-sub">2 dni, full send — no days off 😤</div>' +
      '<div class="wt-rewards">' +
        '<div class="wt-rw"><b>⚔️ 12</b><span>ankiet</span></div>' +
        '<div class="wt-rw"><b>🔥 5</b><span>hot leadów</span></div>' +
        '<div class="wt-rw"><b>💰 ' + maxXp + '</b><span>XP do zdobycia</span></div>' +
      '</div>' +
      '<div class="wt-hype">Naładuj baterię — w sobotę i niedzielę gramy o mega-nagrody! 🚀</div>' +
      '<div class="wt-roster" id="wtRoster"><div class="wt-roster-h">🤝 Ekipa na raid</div><div class="wt-roster-list" id="wtRosterList">⏳ ładuję…</div></div>' +
      '<button class="wt-btn" id="wtJoinBtn" onclick="joinRaid()">ZAPISUJĘ SIĘ NA RAID 🔥</button>' +
    '</div>';
  document.body.appendChild(ov);
  setTimeout(function () { ov.classList.add('show'); }, 30);
  // pobierz aktualną ekipę zapisaną na raid
  loadRaidRoster();

  // jeśli są włączone powiadomienia — dorzuć lokalny push (też zero kosztów)
  try {
    if (typeof showLocalNotification === 'function' && window.Notification && Notification.permission === 'granted') {
      showLocalNotification('🏔️ Jutro WEEKEND RAID!', 'Mega-event na sob+nd — do ' + maxXp + ' XP. Naładuj baterię! 🚀');
    }
  } catch (e) {}
}

function closeWeekendTeaser() {
  var ov = document.querySelector('.wt-overlay');
  if (!ov) return;
  ov.classList.remove('show');
  setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 300);
}


// ── RAID ROSTER: kto z zespołu zapisał się na weekendowy raid ──
function raidWeekendId() {
  // ID weekendu = rok + miesiąc + data SOBOTY tego weekendu.
  // piątek -> +1 (sobota), niedziela -> -1 (sobota). Spójne przez cały weekend.
  var d = new Date();
  var day = d.getDay();
  if (day === 5) d.setDate(d.getDate() + 1);      // piątek -> sobota
  else if (day === 0) d.setDate(d.getDate() - 1); // niedziela -> sobota
  return d.getFullYear() + '_' + d.getMonth() + '_' + d.getDate();
}

function loadRaidRoster() {
  var box = document.getElementById('wtRosterList');
  if (!box || typeof WEBHOOK === 'undefined') return;
  fetch(WEBHOOK + '?action=getRaid&weekend=' + raidWeekendId() + '&' + authQS())
    .then(function (r) { return r.json(); })
    .then(function (res) {
      var list = (res && res.data) ? res.data : [];
      renderRaidRoster(list);
    })
    .catch(function () {
      if (box) box.innerHTML = '<span class="wt-roster-empty">Bądź pierwszy! 🚀</span>';
    });
}

function renderRaidRoster(list) {
  var box = document.getElementById('wtRosterList');
  if (!box) return;
  var me = (window._user || '').toLowerCase();
  var joined = list.some(function (n) { return (n || '').toLowerCase() === me; });
  if (!list.length) {
    box.innerHTML = '<span class="wt-roster-empty">Nikt jeszcze — bądź pierwszy! 🚀</span>';
  } else {
    var chips = list.slice(0, 12).map(function (n) {
      var mine = (n || '').toLowerCase() === me;
      return '<span class="wt-chip' + (mine ? ' me' : '') + '">' + (mine ? '🫵 ' : '') + n + '</span>';
    }).join('');
    var extra = list.length > 12 ? '<span class="wt-chip more">+' + (list.length - 12) + '</span>' : '';
    box.innerHTML = '<div class="wt-count">' + list.length + ' osób gotowych na raid 💪</div>' +
      '<div class="wt-chips">' + chips + extra + '</div>';
  }
  // zaktualizuj przycisk jeśli już zapisany
  var btn = document.getElementById('wtJoinBtn');
  if (btn && joined) {
    btn.textContent = '✅ JESTEŚ NA RAIDZIE — LET\'S GO 🔥';
    btn.classList.add('joined');
    btn.setAttribute('onclick', 'closeWeekendTeaser()');
  }
}

function joinRaid() {
  var btn = document.getElementById('wtJoinBtn');
  if (btn && btn.classList.contains('joined')) { closeWeekendTeaser(); return; }
  if (typeof WEBHOOK === 'undefined' || !window._user) { closeWeekendTeaser(); return; }

  // optymistycznie: oznacz jako zapisany od razu
  if (btn) {
    btn.textContent = '✅ ZAPISANO! LET\'S GO 🔥';
    btn.classList.add('joined');
    btn.setAttribute('onclick', 'closeWeekendTeaser()');
  }
  if (typeof showToast === 'function') showToast('🤝 Jesteś na raidzie! Do zobaczenia w weekend 🔥');
  if (typeof confettiBlast === 'function') confettiBlast();

  var payload = authBody({ action: 'joinRaid', ankieter: window._user, weekend: raidWeekendId() });
  try {
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    }).then(function () {
      // odśwież listę po zapisie
      setTimeout(loadRaidRoster, 800);
    }).catch(function () {});
  } catch (e) {}
}
