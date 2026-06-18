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
