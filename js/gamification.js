// ============================================================
// GAMIFICATION — XP, poziomy, misje, FX, nawigacja, launch
// ============================================================

function getStats(name) {
  var u = getUsers()[(name||'').toLowerCase()] || {};
  var today = new Date().toLocaleDateString('pl-PL');
  var td = 0;
  try { var t = JSON.parse(localStorage.getItem('4eco_td_' + (name||'').toLowerCase())) || {}; td = t.d === today ? (t.c||0) : 0; } catch(e) {}
  return {xp:u.xp||0, total:u.total||0, hot:u.hot||0, streak:u.streak||0, today:td, lastDay:u.lastDay||'', achs:u.achs||[]};
}

function addXP(name, amount, isHot) {
  var us = getUsers(), k = (name||'').toLowerCase();
  if (!us[k]) return;
  var today = new Date().toLocaleDateString('pl-PL');
  var oldLv = getLv(us[k].xp || 0).level;
  us[k].xp    = (us[k].xp||0) + amount;
  us[k].total = (us[k].total||0) + 1;
  if (isHot) us[k].hot = (us[k].hot||0) + 1;
  if (us[k].lastDay === today) {/* same day */}
  else if (isYest(us[k].lastDay)) us[k].streak = (us[k].streak||0) + 1;
  else us[k].streak = 1;
  us[k].lastDay = today;
  try {
    var td = JSON.parse(localStorage.getItem('4eco_td_'+k)) || {};
    var cnt = (td.d === today ? td.c : 0) + 1;
    localStorage.setItem('4eco_td_'+k, JSON.stringify({d:today, c:cnt}));
  } catch(e) {}
  saveUsers(us);
  checkAchs(name);
  updateUI(name);
  var newLv = getLv(us[k].xp||0).level;
  if (newLv > oldLv) { lvFlash(); showToast('🎉 LEVEL UP! Jesteś Level ' + newLv + '!'); }
  var todayC = 0;
  try { var _td = JSON.parse(localStorage.getItem('4eco_td_'+k))||{}; todayC = _td.d===today?(_td.c||0):0; } catch(e){}
  pushRanking(us[k].name, us[k].xp||0, us[k].total||0, us[k].hot||0, us[k].streak||0, todayC);
}

function isYest(ds) {
  if (!ds) return false;
  try {
    var p = ds.split('.'), d = new Date(+p[2], +p[1]-1, +p[0]);
    var y = new Date(); y.setDate(y.getDate()-1);
    return d.toDateString() === y.toDateString();
  } catch(e) { return false; }
}

function getLv(xp) {
  var lv = {level:1, name:'Rookie', icon:'🌱', nextXp:100, progress:0};
  for (var i = LEVELS.length-1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) {
      lv.level    = i+1;
      lv.name     = LEVELS[i].name;
      lv.icon     = LEVELS[i].icon;
      lv.nextXp   = LEVELS[i+1] ? LEVELS[i+1].min : 9999;
      lv.progress = LEVELS[i+1]
        ? Math.min(100, Math.round((xp - LEVELS[i].min) / (LEVELS[i+1].min - LEVELS[i].min) * 100))
        : 100;
      break;
    }
  }
  return lv;
}

function checkAchs(name) {
  var us = getUsers(), k = (name||'').toLowerCase();
  if (!us[k]) return;
  var s = getStats(name);
  if (!us[k].achs) us[k].achs = [];
  var changed = false;
  ACHS.forEach(function(a) {
    if (us[k].achs.indexOf(a.id) === -1 && a.check(s)) {
      us[k].achs.push(a.id);
      us[k].xp = (us[k].xp||0) + a.xp;
      changed = true;
      setTimeout(function(ac){ showAch(ac); }, 800, a);
    }
  });
  if (changed) saveUsers(us);
}

function showAch(a) {
  var p = document.getElementById('achPop');
  document.getElementById('achIcon').textContent = a.icon;
  document.getElementById('achName').textContent = a.name;
  document.getElementById('achXp').textContent   = '+' + a.xp + ' XP';
  p.classList.add('show');
  setTimeout(function(){ p.classList.remove('show'); }, 4000);
}

function updateUI(name) {
  var s  = getStats(name), lv = getLv(s.xp);
  var locKod = localStorage.getItem('4eco_loc_location_kod') || '';
  var locMsc = localStorage.getItem('4eco_loc_location_msc') || '';
  var locLabel = (locKod||locMsc) ? ' · 📍' + (locMsc||locKod) : '';

  var el;
  el = document.getElementById('hdrName');    if(el) el.textContent = name;
  el = document.getElementById('hdrLv');      if(el) el.textContent = lv.icon + ' Level ' + lv.level + ' — ' + lv.name + locLabel;
  el = document.getElementById('xpTotal');    if(el) el.textContent = s.xp;
  el = document.getElementById('xpBarLabel'); if(el) el.textContent = lv.icon + ' Level ' + lv.level + ' — ' + lv.name;
  el = document.getElementById('xpBarNext');  if(el) el.textContent = s.xp + '/' + lv.nextXp + ' XP';
  el = document.getElementById('xpFill');     if(el) el.style.width = lv.progress + '%';
  el = document.getElementById('stTotal');    if(el) el.textContent = s.total;
  el = document.getElementById('stStreak');   if(el) el.textContent = s.streak + '🔥';
  el = document.getElementById('stHot');      if(el) el.textContent = s.hot;
  el = document.getElementById('stToday');    if(el) el.textContent = s.today;
  el = document.getElementById('profileName'); if(el) el.textContent = name;
  el = document.getElementById('profileLevel');if(el) el.textContent = lv.icon + ' ' + lv.name + ' — Level ' + lv.level;
  renderMissions(s);
  if (typeof applyAvatarToHeader === 'function') applyAvatarToHeader();
}

function renderMissions(s) {
  var ms = [
    {icon:'⚡', title:'5 ankiet dziś',    target:5,  cur:s.today,            xp:'+100XP'},
    {icon:'🔥', title:'3 gorące leady',   target:3,  cur:Math.min(s.hot,3),  xp:'+150XP'},
    {icon:'🔗', title:'Streak 3 dni',     target:3,  cur:Math.min(s.streak,3),xp:'+75XP'},
    {icon:'💎', title:'10 ankiet łącznie',target:10, cur:Math.min(s.total,10),xp:'+200XP'}
  ];
  var h = '';
  ms.forEach(function(m) {
    var pct  = Math.min(100, Math.round(m.cur / m.target * 100));
    var done = m.cur >= m.target;
    h += '<div class="mc' + (done?' done':'') + '">' +
      '<div class="mc-icon">' + m.icon + (done?' ✅':'') + '</div>' +
      '<div class="mc-title">' + m.title + '</div>' +
      '<div class="mc-bar"><div class="mc-bar-fill" style="width:'+pct+'%"></div></div>' +
      '<div class="mc-xp">' + m.cur + '/' + m.target + ' · ' + m.xp + '</div>' +
    '</div>';
  });
  var mr = document.getElementById('missionRow');
  if (mr) mr.innerHTML = h;
}

// ── FX ──────────────────────────────────────────────────────
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 3000);
}

function floatXP(text) {
  var el = document.createElement('div');
  el.className = 'xp-float'; el.textContent = text;
  el.style.left = (20 + Math.random()*60) + '%'; el.style.top = '50%';
  document.body.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 1400);
}

function lvFlash() {
  var el = document.createElement('div'); el.className = 'lv-flash';
  document.body.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 700);
}

function confettiBlast() {
  var cols = ['#00ff88','#a78bfa','#60a5fa','#fb923c','#fbbf24','#f87171'];
  for (var i = 0; i < 50; i++) {
    var el = document.createElement('div'); el.className = 'confetti-p';
    el.style.cssText = 'left:'+Math.random()*100+'vw;top:-10px;width:'+(5+Math.random()*6)+'px;height:'+(5+Math.random()*6)+'px;background:'+cols[Math.floor(Math.random()*cols.length)]+';animation-duration:'+(0.8+Math.random()*0.9)+'s;animation-delay:'+Math.random()*0.4+'s';
    document.body.appendChild(el);
    setTimeout(function(e){ if(e.parentNode) e.parentNode.removeChild(e); }, 2000, el);
  }
}

function initParticles() {
  var c = document.getElementById('particles');
  if (!c) return;
  for (var i = 0; i < 18; i++) {
    var p = document.createElement('div'); p.className = 'pt';
    p.style.cssText = 'left:'+Math.random()*100+'%;width:'+(1+Math.random()*3)+'px;height:'+(1+Math.random()*3)+'px;background:var(--green);animation-delay:'+Math.random()*10+'s;animation-duration:'+(8+Math.random()*10)+'s';
    c.appendChild(p);
  }
}

// ── NAV ─────────────────────────────────────────────────────
function switchMode(mode) {
  document.querySelectorAll('.mpanel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.nav-tile').forEach(function(b){ b.classList.remove('active'); });
  var panel = document.getElementById('panel_' + mode);
  if (panel) panel.classList.add('active');
  var tile = document.getElementById('msb_' + mode);
  if (tile) tile.classList.add('active');
  if (mode === 'lokalizacja') renderLokalizacja();
  if (mode === 'battlepass')  renderBattlePass();
  if (mode === 'karty')       renderKarty();
  if (mode === 'avatar')      renderAvatar();
  if (mode === 'ranking')     { renderRanking(); renderDuel(); }
  if (mode === 'history')     renderHistory();
}

function renderLokalizacja() {
  var kod = localStorage.getItem('4eco_loc_location_kod') || '';
  var msc = localStorage.getItem('4eco_loc_location_msc') || '';
  var elKod = document.getElementById('loc_kod');
  var elMsc = document.getElementById('loc_msc');
  if (elKod) elKod.value = kod;
  if (elMsc) elMsc.value = msc;
  var cur = document.getElementById('loc_current');
  if (!cur) return;
  if (kod || msc) {
    cur.innerHTML = '📍 Aktualna: <strong style="color:var(--text)">' + (kod||'?') + ' ' + (msc||'?') + '</strong>';
    cur.style.borderColor = 'rgba(0,255,136,0.3)';
  } else {
    cur.innerHTML = 'Brak zapisanej lokalizacji';
    cur.style.borderColor = 'var(--border)';
  }
}

function saveLokalizacja() {
  var kod = document.getElementById('loc_kod').value.trim();
  var msc = document.getElementById('loc_msc').value.trim();
  if (kod) localStorage.setItem('4eco_loc_location_kod', kod);
  if (msc) localStorage.setItem('4eco_loc_location_msc', msc);
  buildFlow('PV',          FLOW_QPV,   'Ankiety_Podstawowe', '',       50);
  buildFlow('PC',          FLOW_QHEAT, 'Ankiety_Podstawowe', 'blue',   50);
  buildFlow('NOWY',        FLOW_QNEW,  'Ankiety_Podstawowe', 'purple', 50);
  buildFlow('ROZBUDOWANA', FLOW_FULL,  'Ankiety_Rozbudowane','',      100);
  var ok = document.getElementById('loc_ok');
  if (ok) { ok.style.display = 'block'; setTimeout(function(){ ok.style.display = 'none'; }, 3500); }
  renderLokalizacja();
}

function showTab(id, btn) {
  document.querySelectorAll('#panel_quick .tpanel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.sub-tile').forEach(function(b){ b.classList.remove('active'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── BATTLEPASS (prosty render) ───────────────────────────────
function renderBattlePass() {
  var s  = getStats(window._user || '');
  var xp = s.xp;
  var GOAL = 3000;
  var pct  = Math.min(100, Math.round(xp / GOAL * 100));
  var el;
  el = document.getElementById('bp_xp_cur');  if(el) el.textContent = xp + ' XP';
  el = document.getElementById('bp_xp_fill'); if(el) el.style.width = pct + '%';

  var REWARDS = [
    {xp:100,  icon:'🔥', name:'Skórka Ogień'},
    {xp:300,  icon:'🎯', name:'Tytuł: Łowca'},
    {xp:600,  icon:'💎', name:'Ramka Diament'},
    {xp:1000, icon:'⚡', name:'Skórka Elite'},
    {xp:1500, icon:'👑', name:'Tytuł: Legend'},
    {xp:2000, icon:'🌟', name:'Skórka GOD MODE'},
    {xp:3000, icon:'🏆', name:'Sezon MASTER'}
  ];
  var list = document.getElementById('bp_rewards_list');
  if (!list) return;
  var html = '';
  REWARDS.forEach(function(r) {
    var done   = xp >= r.xp;
    var active = !done && xp >= (r.xp * 0.6);
    html += '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);opacity:'+(done?'1':active?'0.8':'0.4')+'">' +
      '<div style="font-size:1.4em">' + (done ? '✅' : r.icon) + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:0.8em;font-weight:800;color:'+(done?'var(--green)':'var(--text)')+'">' + r.name + '</div>' +
        '<div style="font-size:0.66em;color:var(--muted)">' + r.xp + ' XP</div>' +
      '</div>' +
      '<div style="font-size:0.72em;font-weight:800;color:'+(done?'var(--green)':'var(--muted)')+'">' + (done?'Odblokowano':'🔒') + '</div>' +
    '</div>';
  });
  list.innerHTML = html;
}

// ── KARTY (lista zdobytych kart gracza) ─────────────────────
function renderKarty() {
  var panel = document.getElementById('panel_karty');
  if (!panel) return;

  var k     = '4eco_cards_' + (window._user||'anon').toLowerCase();
  var owned = [];
  try { owned = JSON.parse(localStorage.getItem(k)) || []; } catch(e) {}
  var ownedIds = owned.map(function(c){ return c.id; });

  var RARITY_COLORS = {common:'#94a3b8', rare:'#60a5fa', epic:'#a78bfa', legendary:'#fbbf24'};
  var RARITY_LABELS = {common:'Common', rare:'Rare', epic:'Epic', legendary:'Legendary'};
  var RARITY_ORDER  = {common:0, rare:1, epic:2, legendary:3};

  // ── Statystyki kolekcji
  var total    = typeof CARD_DEFINITIONS !== 'undefined' ? CARD_DEFINITIONS.length : 0;
  var gotCount = owned.length;
  var pct      = total > 0 ? Math.round(gotCount/total*100) : 0;

  var html = '<div style="padding:12px 12px 90px">';

  // Nagłówek + pasek
  html += '<div style="background:var(--card2);border:1px solid var(--border2);border-radius:16px;padding:14px 16px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<div style="font-size:0.9em;font-weight:900;color:var(--text)">🃏 Kolekcja</div>' +
      '<div style="font-size:0.72em;color:var(--muted);font-weight:700">'+gotCount+' / '+total+' kart</div>' +
    '</div>' +
    '<div style="background:var(--bg3);border-radius:8px;height:8px;overflow:hidden;margin-bottom:8px">' +
      '<div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,var(--yellow),var(--orange));border-radius:8px;transition:width 0.6s ease"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      ['common','rare','epic','legendary'].map(function(r){
        var cnt = owned.filter(function(c){return c.rarity===r;}).length;
        var def_cnt = typeof CARD_DEFINITIONS !== 'undefined' ? CARD_DEFINITIONS.filter(function(c){return c.rarity===r;}).length : '?';
        return '<div style="flex:1;text-align:center;background:var(--bg3);border-radius:10px;padding:6px 4px;border:1px solid '+(cnt>0?RARITY_COLORS[r]:'var(--border2)')+'">' +
          '<div style="font-size:0.72em;font-weight:900;color:'+(cnt>0?RARITY_COLORS[r]:'var(--muted)')+'">'+cnt+'</div>' +
          '<div style="font-size:0.52em;color:var(--muted);text-transform:uppercase;font-weight:700">'+RARITY_LABELS[r].slice(0,3)+'</div>' +
        '</div>';
      }).join('') +
    '</div>' +
  '</div>';

  // ── Zdobyte karty
  if (owned.length > 0) {
    var sorted = owned.slice().sort(function(a,b){
      return (RARITY_ORDER[b.rarity]||0)-(RARITY_ORDER[a.rarity]||0);
    });
    html += '<div style="font-size:0.7em;font-weight:900;color:var(--yellow);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-left:2px">✅ Twoje karty ('+owned.length+')</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:20px">';
    sorted.forEach(function(card) {
      var rc = RARITY_COLORS[card.rarity||'common'];
      var cardJson = JSON.stringify(card).replace(/"/g,'&quot;');
      html += '<div onclick="showCardDetail('+cardJson+')" style="background:var(--card2);border:1.5px solid '+rc+';border-radius:14px;padding:14px 10px;text-align:center;cursor:pointer;box-shadow:0 0 12px rgba(0,0,0,0.3);transition:transform 0.15s;position:relative;-webkit-tap-highlight-color:transparent" class="card-tap">' +
        '<div style="position:absolute;top:6px;right:8px;font-size:0.48em;font-weight:900;color:'+rc+';text-transform:uppercase;letter-spacing:0.5px">'+RARITY_LABELS[card.rarity||'common']+'</div>' +
        '<div style="font-size:2.2em;margin:8px 0 6px;filter:drop-shadow(0 0 6px rgba(0,0,0,0.5))">'+card.icon+'</div>' +
        '<div style="font-size:0.7em;font-weight:900;color:var(--text);line-height:1.2">'+card.name+'</div>' +
        (card.bonus?'<div style="font-size:0.55em;color:'+rc+';margin-top:4px;font-weight:800">'+card.bonus+'</div>':'') +
        '<div style="font-size:0.52em;color:var(--muted);margin-top:4px">'+( card.date||'' )+'</div>' +
      '</div>';
    });
    html += '</div>';
  }

  // ── Katalog kart do zdobycia
  if (typeof CARD_DEFINITIONS !== 'undefined' && CARD_DEFINITIONS.length > 0) {
    var locked = CARD_DEFINITIONS.filter(function(d){ return ownedIds.indexOf(d.id) === -1; });
    if (locked.length > 0) {
      html += '<div style="font-size:0.7em;font-weight:900;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-left:2px">🔒 Do zdobycia ('+locked.length+')</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">';
      locked.forEach(function(card) {
        var rc = RARITY_COLORS[card.rarity||'common'];
        html += '<div style="background:var(--bg3);border:1.5px dashed var(--border2);border-radius:14px;padding:14px 10px;text-align:center;opacity:0.55;position:relative">' +
          '<div style="position:absolute;top:6px;right:8px;font-size:0.48em;font-weight:900;color:'+rc+';text-transform:uppercase;letter-spacing:0.5px;opacity:0.7">'+RARITY_LABELS[card.rarity||'common']+'</div>' +
          '<div style="font-size:2.2em;margin:8px 0 6px;filter:grayscale(1)">'+card.icon+'</div>' +
          '<div style="font-size:0.7em;font-weight:900;color:var(--muted);line-height:1.2">'+card.name+'</div>' +
          '<div style="font-size:0.55em;color:var(--muted);margin-top:4px;line-height:1.3">'+card.desc.substring(0,45)+(card.desc.length>45?'…':'')+'</div>' +
        '</div>';
      });
      html += '</div>';
    }
  }

  html += '</div>';
  panel.innerHTML = html;
}

function hexToRgb(hex) {
  var r=0,g=0,b=0;
  if(!hex||hex[0]!=='#') return '150,150,150';
  hex=hex.slice(1);
  if(hex.length===3){r=parseInt(hex[0]+hex[0],16);g=parseInt(hex[1]+hex[1],16);b=parseInt(hex[2]+hex[2],16);}
  else{r=parseInt(hex.slice(0,2),16);g=parseInt(hex.slice(2,4),16);b=parseInt(hex.slice(4,6),16);}
  return r+','+g+','+b;
}

// ── LAUNCH ──────────────────────────────────────────────────
function launchApp(name) {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display  = 'block';
  window._user = name;
  applyStoredTheme();
  updateUI(name);
  initCombo();
  applyAvatarToHeader();
  buildFlow('PV',          FLOW_QPV,   'Ankiety_Podstawowe', '',       50);
  buildFlow('PC',          FLOW_QHEAT, 'Ankiety_Podstawowe', 'blue',   50);
  buildFlow('NOWY',        FLOW_QNEW,  'Ankiety_Podstawowe', 'purple', 50);
  buildFlow('ROZBUDOWANA', FLOW_FULL,  'Ankiety_Rozbudowane','',      100);
}

window.addEventListener('DOMContentLoaded', function() {
  // Motyw stosujemy natychmiast
  applyStoredTheme();
  initParticles();
  var s = getSession();
  if (s && s.name) launchApp(s.name);
  var lPin = document.getElementById('lPin');
  var rPin2 = document.getElementById('rPin2');
  if (lPin)  lPin.addEventListener('keydown',  function(e){ if(e.key==='Enter') doLogin(); });
  if (rPin2) rPin2.addEventListener('keydown', function(e){ if(e.key==='Enter') doRegister(); });
});
