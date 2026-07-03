// ======================================================
// MEGA-ADMIN (DWS) — panel zarzadzania calym zespolem
// Warstwa dokladana PO istniejacej logice. Zero zmian w innych plikach.
// Kafelek "Admin" + panel widoczne TYLKO dla mega-admina.
// ======================================================

// Lista mega-adminow (male litery, jak login do apki). Musi byc spojna z backendem PRESENCE_ADMINS.
var MEGA_ADMINS = ['dws'];

function isMegaAdmin(name) {
  var u = (name || window._user || '').toString().trim().toLowerCase();
  return MEGA_ADMINS.indexOf(u) !== -1;
}
window.isMegaAdmin = isMegaAdmin;

// --- Pokaz/ukryj kafelek Admin zaleznie od zalogowanego uzytkownika ---
function refreshAdminTileVisibility() {
  var tile = document.getElementById('msb_admin');
  if (!tile) return;
  tile.style.display = isMegaAdmin() ? '' : 'none';
}

// --- Rozszerz switchMode o tryb 'admin' bez ruszania oryginalu ---
(function () {
  var _orig = window.switchMode;
  window.switchMode = function (mode) {
    if (typeof _orig === 'function') _orig(mode);
    if (mode === 'admin') renderAdmin();
  };
})();

// --- Wstrzykniecie kafelka + panelu do DOM po zaladowaniu ---
function ensureAdminDom() {
  // Kafelek w nawigacji (po "Do druku")
  if (!document.getElementById('msb_admin')) {
    var navWrap = document.querySelector('.nav-tiles');
    if (navWrap) {
      var btn = document.createElement('button');
      btn.className = 'nav-tile';
      btn.id = 'msb_admin';
      btn.setAttribute('onclick', "switchMode('admin')");
      btn.style.display = 'none';
      btn.innerHTML = '<span class="nt-icon">👑</span><span class="nt-label">Admin</span>';
      navWrap.appendChild(btn);
    }
  }
  // Panel
  if (!document.getElementById('panel_admin')) {
    var panel = document.createElement('div');
    panel.id = 'panel_admin';
    panel.className = 'mpanel';
    panel.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
        '<span style="font-size:1.4em">👑</span>' +
        '<h2 style="margin:0;font-size:1.15em">Panel mega-admina <span style="color:var(--green)">DWS</span></h2>' +
      '</div>' +
      '<div id="adminTabs" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' +
        '<button class="adm-tab active" data-t="zespol" onclick="adminTab(\'zespol\')">📊 Zespół</button>' +
        '<button class="adm-tab" data-t="konta" onclick="adminTab(\'konta\')">👤 Konta</button>' +
        '<button class="adm-tab" data-t="leady" onclick="adminTab(\'leady\')">📋 Leady</button>' +
        '<button class="adm-tab" data-t="nagrody" onclick="adminTab(\'nagrody\')">🎖️ Nagrody</button>' +
      '</div>' +
      '<div id="adm_zespol" class="adm-view"></div>' +
      '<div id="adm_konta" class="adm-view" style="display:none"></div>' +
      '<div id="adm_leady" class="adm-view" style="display:none"></div>' +
      '<div id="adm_nagrody" class="adm-view" style="display:none"></div>';
    // wstaw przed panelem quick albo na koniec appScreen
    var host = document.getElementById('appScreen') || document.body;
    host.appendChild(panel);
  }
  // Style
  if (!document.getElementById('adminStyles')) {
    var st = document.createElement('style');
    st.id = 'adminStyles';
    st.textContent =
      '.adm-tab{background:var(--card,#111a2e);color:var(--text,#eee);border:1px solid var(--border,#2a3550);' +
      'border-radius:8px;padding:7px 12px;font-size:.85em;font-weight:700;cursor:pointer;transition:.15s}' +
      '.adm-tab.active{background:var(--green,#10d873);color:#04150c;border-color:var(--green,#10d873)}' +
      '.adm-card{background:var(--card,#111a2e);border:1px solid var(--border,#2a3550);border-radius:12px;padding:12px;margin-bottom:10px}' +
      '.adm-kpi{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}' +
      '.adm-kpi > div{flex:1;min-width:90px;background:var(--card,#111a2e);border:1px solid var(--border,#2a3550);' +
      'border-radius:12px;padding:10px 12px;text-align:center}' +
      '.adm-kpi .n{font-size:1.5em;font-weight:800;color:var(--green,#10d873)}' +
      '.adm-kpi .l{font-size:.7em;color:var(--muted,#8a93a8);text-transform:uppercase;letter-spacing:.4px;margin-top:2px}' +
      '.adm-row{display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px dotted var(--border,#2a3550);font-size:.85em}' +
      '.adm-row:last-child{border-bottom:none}' +
      '.adm-row .rank{width:22px;font-weight:800;color:var(--muted,#8a93a8)}' +
      '.adm-row .nm{flex:1;font-weight:700}' +
      '.adm-row .v{width:52px;text-align:right;font-variant-numeric:tabular-nums}' +
      '.adm-btn{background:var(--green,#10d873);color:#04150c;border:none;border-radius:8px;padding:6px 12px;' +
      'font-weight:700;font-size:.82em;cursor:pointer}' +
      '.adm-btn.gray{background:var(--border,#2a3550);color:var(--text,#eee)}' +
      '.adm-btn.red{background:#e0483d;color:#fff}' +
      '.adm-muted{color:var(--muted,#8a93a8);font-size:.82em}' +
      '.adm-lead{background:var(--card,#111a2e);border:1px solid var(--border,#2a3550);border-radius:10px;padding:9px 11px;margin-bottom:7px}' +
      '.adm-lead .top{display:flex;justify-content:space-between;font-size:.8em;color:var(--muted,#8a93a8)}' +
      '.adm-lead .cn{font-weight:800;font-size:.98em;margin:2px 0}' +
      '.adm-badge{display:inline-block;font-size:.68em;padding:1px 7px;border-radius:10px;background:var(--border,#2a3550);color:var(--text,#eee);font-weight:700}' +
      '.adm-badge.hot{background:#e0483d;color:#fff}';
    document.head.appendChild(st);
  }
}

// --- Przelaczanie zakladek panelu ---
function adminTab(t) {
  document.querySelectorAll('#adminTabs .adm-tab').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-t') === t);
  });
  ['zespol', 'konta', 'leady', 'nagrody'].forEach(function (v) {
    var el = document.getElementById('adm_' + v);
    if (el) el.style.display = (v === t) ? '' : 'none';
  });
  if (t === 'zespol') loadTeamStats();
  if (t === 'konta') renderKonta();
  if (t === 'leady') loadLeads();
  if (t === 'nagrody') renderNagrody();
}
window.adminTab = adminTab;

function renderAdmin() {
  if (!isMegaAdmin()) {
    var g = document.getElementById('panel_admin');
    if (g) g.innerHTML = '<div class="adm-card">⛔ Brak uprawnień.</div>';
    return;
  }
  ensureAdminDom();
  adminTab('zespol');
}
window.renderAdmin = renderAdmin;

// ======================================================
// ZAKLADKA: ZESPOL (statystyki z backendu)
// ======================================================
function loadTeamStats() {
  var box = document.getElementById('adm_zespol');
  if (!box) return;
  box.innerHTML = '<div class="adm-muted">⏳ Ładuję statystyki zespołu…</div>';
  var url = WEBHOOK + '?action=getTeamStats&viewer=' + encodeURIComponent(window._user || '');
  fetch(url).then(function (r) { return r.json(); }).then(function (res) {
    if (res.status !== 'ok') { box.innerHTML = '<div class="adm-card">⛔ ' + (res.message || 'Błąd') + '</div>'; return; }
    var s = res.summary || {};
    var html =
      '<div class="adm-kpi">' +
        '<div><div class="n">' + (s.ankieterzy || 0) + '</div><div class="l">Ankieterzy</div></div>' +
        '<div><div class="n">' + (s.ankiety || 0) + '</div><div class="l">Ankiety</div></div>' +
        '<div><div class="n">' + (s.dzis || 0) + '</div><div class="l">Dziś</div></div>' +
        '<div><div class="n">' + (s.gorace || 0) + '</div><div class="l">Gorące</div></div>' +
      '</div>';
    html += '<div class="adm-card"><div style="font-weight:800;margin-bottom:6px">🏆 Ranking zespołu</div>';
    var team = res.team || [];
    if (!team.length) html += '<div class="adm-muted">Brak danych. Ankieterzy pojawią się po pierwszej ankiecie.</div>';
    team.forEach(function (t, i) {
      html += '<div class="adm-row"><span class="rank">' + (i + 1) + '</span>' +
        '<span class="nm">' + esc(t.name) + '</span>' +
        '<span class="v" title="Ankiety razem">' + (t.total || 0) + '</span>' +
        '<span class="v" title="Dziś">' + (t.today || 0) + '</span>' +
        '<span class="v" title="Gorące" style="color:#e0483d">' + (t.hot || 0) + '</span></div>';
    });
    html += '<div class="adm-muted" style="margin-top:6px">Kolumny: razem · dziś · <span style="color:#e0483d">gorące</span></div></div>';
    // --- Scalanie duplikatow ---
    var opts = team.map(function(t){ return '<option value="'+jsSafe(t.name)+'">'+esc(t.name)+' ('+(t.xp||0)+' XP)</option>'; }).join('');
    html += '<div class="adm-card">' +
      '<div style="font-weight:800;margin-bottom:4px">🔗 Scal duplikaty</div>' +
      '<div class="adm-muted" style="margin-bottom:8px">Łączy dwa konta w rankingu w jedno — sumuje XP, ankiety i gorące. Zostaje pierwsze, drugie znika.</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
        '<label class="adm-muted" style="min-width:64px">Zostaw:</label>' +
        '<select id="adm_mrg_keep" style="flex:1;min-width:150px;padding:7px;border-radius:8px;background:var(--card,#111a2e);color:var(--text,#eee);border:1px solid var(--border,#2a3550)">'+opts+'</select>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px">' +
        '<label class="adm-muted" style="min-width:64px">Usuń:</label>' +
        '<select id="adm_mrg_drop" style="flex:1;min-width:150px;padding:7px;border-radius:8px;background:var(--card,#111a2e);color:var(--text,#eee);border:1px solid var(--border,#2a3550)">'+opts+'</select>' +
        '<button class="adm-btn" onclick="admMergeRanking()">Scal</button>' +
      '</div>' +
    '</div>';
    box.innerHTML = html;
  }).catch(function () {
    box.innerHTML = '<div class="adm-card">⚠️ Nie udało się połączyć z serwerem.</div>';
  });
}

function admMergeRanking() {
  var keep = document.getElementById('adm_mrg_keep').value;
  var drop = document.getElementById('adm_mrg_drop').value;
  if (!keep || !drop) { alert('Wybierz oba konta.'); return; }
  if (keep.toLowerCase() === drop.toLowerCase()) { alert('To samo konto — wybierz dwa różne.'); return; }
  if (!confirm('Scalić „' + drop + '" → „' + keep + '"?\nXP i statystyki zostaną zsumowane, konto „' + drop + '" zniknie z rankingu.')) return;
  var box = document.getElementById('adm_zespol');
  if (box) box.insertAdjacentHTML('afterbegin', '<div class="adm-muted" id="adm_mrg_msg">⏳ Scalam…</div>');
  var url = WEBHOOK + '?action=mergeRanking' +
    '&viewer=' + encodeURIComponent(window._user || '') +
    '&keep=' + encodeURIComponent(keep) +
    '&drop=' + encodeURIComponent(drop);
  fetch(url).then(function (r) { return r.json(); }).then(function (res) {
    if (res.status === 'ok') {
      alert('Scalono! „' + res.keep + '" ma teraz ' + res.mergedXp + ' XP.');
      loadTeamStats();
    } else {
      alert('Nie udało się: ' + (res.message || 'błąd'));
      var m = document.getElementById('adm_mrg_msg'); if (m) m.remove();
    }
  }).catch(function () {
    alert('Błąd połączenia z serwerem.');
    var m = document.getElementById('adm_mrg_msg'); if (m) m.remove();
  });
}
window.admMergeRanking = admMergeRanking;

// ======================================================
// ZAKLADKA: KONTA (lokalne konta z tego urzadzenia)
// ======================================================
function renderKonta() {
  var box = document.getElementById('adm_konta');
  if (!box) return;
  var us = (typeof getUsers === 'function') ? getUsers() : {};
  var keys = Object.keys(us);
  var html = '<div class="adm-muted" style="margin-bottom:8px">Konta zapisane na tym urządzeniu (' + keys.length + '). Reset PIN-u i usuwanie działa lokalnie.</div>';
  if (!keys.length) html += '<div class="adm-card adm-muted">Brak kont na tym urządzeniu.</div>';
  keys.forEach(function (k) {
    var u = us[k];
    var isAdm = MEGA_ADMINS.indexOf(k) !== -1;
    html += '<div class="adm-card" style="display:flex;align-items:center;gap:8px">' +
      '<div style="flex:1"><div style="font-weight:800">' + esc(u.name) + (isAdm ? ' <span class="adm-badge hot">ADMIN</span>' : '') + '</div>' +
      '<div class="adm-muted">XP: ' + (u.xp || 0) + ' · ankiet: ' + (u.total || 0) + ' · gorące: ' + (u.hot || 0) + '</div></div>' +
      '<button class="adm-btn gray" onclick="admResetPin(\'' + jsSafe(k) + '\')">🔑 PIN</button>' +
      (isAdm ? '' : '<button class="adm-btn red" onclick="admDeleteUser(\'' + jsSafe(k) + '\')">🗑</button>') +
      '</div>';
  });
  box.innerHTML = html;
}

function admResetPin(key) {
  var us = getUsers();
  if (!us[key]) return;
  var np = prompt('Nowy 4-cyfrowy PIN dla „' + us[key].name + '":', '');
  if (np === null) return;
  if (!/^\d{4}$/.test(np)) { alert('PIN musi mieć 4 cyfry.'); return; }
  us[key].pin = np;
  saveUsers(us);
  alert('PIN zresetowany.');
  renderKonta();
}
window.admResetPin = admResetPin;

function admDeleteUser(key) {
  var us = getUsers();
  if (!us[key]) return;
  if (MEGA_ADMINS.indexOf(key) !== -1) { alert('Nie można usunąć konta admina.'); return; }
  if (!confirm('Usunąć konto „' + us[key].name + '"? Tej operacji nie da się cofnąć.')) return;
  delete us[key];
  saveUsers(us);
  renderKonta();
}
window.admDeleteUser = admDeleteUser;

// ======================================================
// ZAKLADKA: LEADY (zgloszenia calego zespolu z backendu)
// ======================================================
function loadLeads() {
  var box = document.getElementById('adm_leady');
  if (!box) return;
  box.innerHTML = '<div class="adm-muted">⏳ Ładuję leady zespołu…</div>';
  var url = WEBHOOK + '?action=getLeads&limit=200&viewer=' + encodeURIComponent(window._user || '');
  fetch(url).then(function (r) { return r.json(); }).then(function (res) {
    if (res.status !== 'ok') { box.innerHTML = '<div class="adm-card">⛔ ' + (res.message || 'Błąd') + '</div>'; return; }
    var leads = res.leads || [];
    var html = '<div class="adm-muted" style="margin-bottom:8px">Ostatnie ' + leads.length + ' zgłoszeń całego zespołu.</div>';
    if (!leads.length) html += '<div class="adm-card adm-muted">Brak leadów.</div>';
    leads.forEach(function (l) {
      var hot = /gor/i.test(l.temp);
      html += '<div class="adm-lead">' +
        '<div class="top"><span>' + esc(l.data) + '</span><span>👤 ' + esc(l.ankieter || '—') + '</span></div>' +
        '<div class="cn">' + esc(l.klient || '(brak nazwiska)') + '</div>' +
        '<div class="adm-muted">📞 ' + esc(l.telefon || '—') + ' · 📍 ' + esc(l.msc || '—') + '</div>' +
        '<div style="margin-top:4px"><span class="adm-badge">' + esc(l.typ || l.tab) + '</span> ' +
        (l.temp ? '<span class="adm-badge ' + (hot ? 'hot' : '') + '">' + esc(l.temp) + '</span>' : '') + '</div>' +
        '</div>';
    });
    box.innerHTML = html;
  }).catch(function () {
    box.innerHTML = '<div class="adm-card">⚠️ Nie udało się połączyć z serwerem.</div>';
  });
}

// ======================================================
// ZAKLADKA: NAGRODY (nadawanie XP / odznak lokalnym kontom)
// ======================================================
function renderNagrody() {
  var box = document.getElementById('adm_nagrody');
  if (!box) return;
  var us = (typeof getUsers === 'function') ? getUsers() : {};
  var opts = Object.keys(us).map(function (k) { return '<option value="' + jsSafe(k) + '">' + esc(us[k].name) + '</option>'; }).join('');
  box.innerHTML =
    '<div class="adm-card">' +
      '<div style="font-weight:800;margin-bottom:8px">🎖️ Przyznaj XP</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
        '<select id="adm_rew_user" style="flex:1;min-width:140px;padding:7px;border-radius:8px;background:var(--card,#111a2e);color:var(--text,#eee);border:1px solid var(--border,#2a3550)">' + opts + '</select>' +
        '<input id="adm_rew_xp" type="number" placeholder="XP" style="width:90px;padding:7px;border-radius:8px;background:var(--card,#111a2e);color:var(--text,#eee);border:1px solid var(--border,#2a3550)">' +
        '<button class="adm-btn" onclick="admGiveXp()">Dodaj</button>' +
      '</div>' +
      '<div class="adm-muted" style="margin-top:6px">Wpisz ujemną liczbę, żeby odjąć XP.</div>' +
    '</div>' +
    '<div class="adm-card">' +
      '<div style="font-weight:800;margin-bottom:8px">🏅 Nadaj odznakę / tytuł</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
        '<select id="adm_bdg_user" style="flex:1;min-width:140px;padding:7px;border-radius:8px;background:var(--card,#111a2e);color:var(--text,#eee);border:1px solid var(--border,#2a3550)">' + opts + '</select>' +
        '<input id="adm_bdg_txt" type="text" placeholder="np. Mistrz Tygodnia" style="flex:1;min-width:120px;padding:7px;border-radius:8px;background:var(--card,#111a2e);color:var(--text,#eee);border:1px solid var(--border,#2a3550)">' +
        '<button class="adm-btn" onclick="admGiveBadge()">Nadaj</button>' +
      '</div>' +
    '</div>';
}

function admGiveXp() {
  var key = document.getElementById('adm_rew_user').value;
  var xp = parseInt(document.getElementById('adm_rew_xp').value, 10);
  if (!key || isNaN(xp)) { alert('Wybierz osobę i wpisz liczbę XP.'); return; }
  var us = getUsers();
  if (!us[key]) return;
  us[key].xp = Math.max(0, (us[key].xp || 0) + xp);
  saveUsers(us);
  // Jesli to zalogowany user — odswiez UI
  if (window._user && window._user.toLowerCase() === key && typeof updateUI === 'function') updateUI(window._user);
  alert((xp >= 0 ? 'Dodano ' : 'Odjęto ') + Math.abs(xp) + ' XP dla ' + us[key].name + '.');
  renderNagrody();
}
window.admGiveXp = admGiveXp;

function admGiveBadge() {
  var key = document.getElementById('adm_bdg_user').value;
  var txt = (document.getElementById('adm_bdg_txt').value || '').trim();
  if (!key || !txt) { alert('Wybierz osobę i wpisz nazwę odznaki.'); return; }
  var us = getUsers();
  if (!us[key]) return;
  us[key].achs = us[key].achs || [];
  if (us[key].achs.indexOf(txt) === -1) us[key].achs.push(txt);
  saveUsers(us);
  // Zapisz tez tytul awatara (spojne z avatar.js)
  try { localStorage.setItem('4eco_av_title_' + us[key].name, txt); } catch (e) {}
  alert('Nadano odznakę „' + txt + '" dla ' + us[key].name + '.');
}
window.admGiveBadge = admGiveBadge;

// --- helpery ---
function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function jsSafe(s) { return String(s).replace(/'/g, "\\'"); }

// --- Inicjalizacja: pokaz kafelek adminowi po zaladowaniu / logowaniu ---
function admInit() {
  ensureAdminDom();
  refreshAdminTileVisibility();
}
if (document.readyState !== 'loading') admInit();
else window.addEventListener('DOMContentLoaded', admInit);

// Po logowaniu launchApp ustawia window._user — dogonimy widocznosc kafelka.
(function () {
  var _orig = window.launchApp;
  if (typeof _orig === 'function') {
    window.launchApp = function (name) {
      _orig(name);
      ensureAdminDom();
      refreshAdminTileVisibility();
    };
  }
})();
