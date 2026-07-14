// ============================================================
// PANEL LIDERA — podsumowanie dnia całego zespołu
// ============================================================
// Łączy: presence (kto pracuje / ukryty), trasy (km w terenie),
// ranking (ankiety, gorące leady). Wszystko z istniejącego webhooka.

var LIDER = { timer: null };

function renderLider() {
  var panel = document.getElementById('panel_lider');
  if (!panel) return;
  panel.innerHTML =
    '<div class="map-head"><div class="map-title">📊 Panel lidera</div>' +
    '<div class="map-geo" id="liderDate"></div></div>' +
    '<div class="lider-kpis" id="liderKpis"></div>' +
    '<div class="lider-goal" id="liderGoal"></div>' +
    '<div class="lider-sec-h">👥 Zespół teraz</div>' +
    '<div id="liderTeam" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<div class="lider-sec-h">📝 Ankiety dziś — kto ile</div>' +
    '<div id="liderToday" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<div class="lider-sec-h">🚶 Aktywność w terenie (dziś)</div>' +
    '<div id="liderTracks" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<div class="lider-sec-h">🏆 Liga terenowa (dziś)</div>' +
    '<div class="liga-info">Punkty = km × 10 + strefy × 25 + ankiety × 15</div>' +
    '<div id="liderLiga" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<div class="lider-sec-h">🎯 Skuteczność (gorące / wszystkie)</div>' +
    '<div id="liderSkut" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<div class="lider-sec-h">🏅 Ranking ogólny (XP)</div>' +
    '<div id="liderXp" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<button class="map-share off" onclick="renderLider()" style="margin-top:10px">🔄 Odśwież</button>'+
    '<div class="lider-auto" id="liderAuto">⟳ auto-odświeżanie co 45 s</div>';

  var d = new Date();
  var dEl = document.getElementById('liderDate');
  if (dEl) dEl.textContent = d.toLocaleDateString('pl-PL', { weekday:'long', day:'numeric', month:'long' });

  loadLiderData();
  startLiderAuto();
}

function liderToday() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
}

function loadLiderData(silent) {
  var pres = fetch(WEBHOOK + '?action=getPresence&viewer=' + encodeURIComponent(window._user || '') + '&' + authQS()).then(function(r){return r.json();}).catch(function(){return null;});
  var trk  = fetch(WEBHOOK + '?action=getTracks&date=' + liderToday() + '&viewer=' + encodeURIComponent(window._user || '') + '&' + authQS()).then(function(r){return r.json();}).catch(function(){return null;});
  var rank = fetch(WEBHOOK + '?action=getRanking&' + authQS()).then(function(r){return r.json();}).catch(function(){return null;});

  Promise.all([pres, trk, rank]).then(function(res){
    var agents = (res[0] && res[0].agents) || [];
    var tracks = (res[1] && res[1].tracks) || [];
    var ranking = (res[2] && res[2].data) || [];
    console.log('[Lider] presence:', agents.length, 'tracks:', tracks.length, 'ranking:', ranking.length);
    try { drawLiderKpis(agents, tracks, ranking); } catch(e){ console.error('KPI',e); }
    try { drawLiderTeam(agents); } catch(e){ console.error('Team',e); }
    try { drawLiderTracks(tracks); } catch(e){ console.error('Tracks',e); }
    try { drawLiderLiga(tracks, ranking); } catch(e){ console.error('Liga',e); }
    try { drawLiderGoal(ranking); } catch(e){ console.error('Goal',e); }
    try { drawLiderToday(ranking); } catch(e){ console.error('Today',e); }
    try { drawLiderSkut(ranking); } catch(e){ console.error('Skut',e); }
    try { drawLiderXp(ranking); } catch(e){ console.error('Xp',e); }
  }).catch(function(e){ console.error('[Lider] load fail', e); });
}

function drawLiderKpis(agents, tracks, ranking) {
  var el = document.getElementById('liderKpis');
  if (!el) return;
  var active = agents.filter(function(a){ return a.status !== 'ukryty'; }).length;
  var hidden = agents.filter(function(a){ return a.status === 'ukryty'; }).length;
  var totalKm = tracks.reduce(function(s,t){ return s + (t.dist||0); }, 0) / 1000;
  // ankiety dziś + gorące leady z rankingu (kolumna "Dziś" jeśli jest)
  var ankDzis = ranking.reduce(function(s,r){ return s + (Number(r.today||r['Dziś']||0)); }, 0);
  var hot = ranking.reduce(function(s,r){ return s + (Number(r.hot||r['Gorące leady']||0)); }, 0);

  el.innerHTML =
    kpi('🟢', active, 'pracuje teraz') +
    kpi('🚫', hidden, 'ukryta pozycja') +
    kpi('🚶', totalKm.toFixed(1)+' km', 'w terenie dziś') +
    kpi('📝', ankDzis||'—', 'ankiet dziś') +
    kpi('🔥', hot||'—', 'gorące leady');
}
function kpi(icon, val, label) {
  return '<div class="lider-kpi"><div class="lk-ico">'+icon+'</div>' +
         '<div class="lk-val">'+val+'</div><div class="lk-lab">'+label+'</div></div>';
}

function drawLiderTeam(agents) {
  var el = document.getElementById('liderTeam');
  if (!el) return;
  if (!agents.length) { el.innerHTML = '<div class="team-empty">Nikt nie jest teraz w terenie.</div>'; return; }
  var html = '';
  agents.sort(function(a,b){ return (a.status==='ukryty'?1:0)-(b.status==='ukryty'?1:0); });
  agents.forEach(function(a){
    var hidden = a.status === 'ukryty';
    html += '<div class="team-row'+(hidden?' hidden':'')+'">' +
            '<span class="team-dot '+(hidden?'off':'ok')+'"></span><b>'+a.name+'</b>' +
            '<span class="team-ago">'+(hidden?'🚫 ukryta':agoTxt(a.ageSec))+'</span></div>';
  });
  el.innerHTML = html;
}

function drawLiderTracks(tracks) {
  var el = document.getElementById('liderTracks');
  if (!el) return;
  if (!tracks.length) { el.innerHTML = '<div class="team-empty">Brak tras na dziś.</div>'; return; }
  tracks.sort(function(a,b){ return (b.dist||0)-(a.dist||0); });
  var max = Math.max.apply(null, tracks.map(function(t){return t.dist||0;})) || 1;
  var html = '';
  tracks.forEach(function(t){
    var pct = Math.round(((t.dist||0)/max)*100);
    var dist = (t.dist>=1000) ? (t.dist/1000).toFixed(2)+' km' : Math.round(t.dist||0)+' m';
    html += '<div class="lider-bar-row"><div class="lbr-top"><b>'+t.name+'</b><span>'+dist+'</span></div>' +
            '<div class="lbr-track"><div class="lbr-fill" style="width:'+pct+'%"></div></div></div>';
  });
  el.innerHTML = html;
}


function drawLiderLiga(tracks, ranking) {
  var el = document.getElementById('liderLiga');
  if (!el) return;
  // mapuj ankiety dziś po imieniu z rankingu
  var ankByName = {};
  ranking.forEach(function(r){
    var n = (r.name||r['Ankieter']||'').toString().trim();
    if (n) ankByName[n.toLowerCase()] = Number(r.today||r['Dziś']||0);
  });
  // zbierz wszystkich z tras + rankingu
  var names = {};
  tracks.forEach(function(t){ if (t.name) names[t.name] = true; });
  Object.keys(ankByName).forEach(function(){});
  ranking.forEach(function(r){ var n=(r.name||r['Ankieter']||'').toString().trim(); if(n) names[n]=true; });

  var trackByName = {};
  tracks.forEach(function(t){ trackByName[(t.name||'').toLowerCase()] = t; });

  var rows = Object.keys(names).map(function(name){
    var t = trackByName[name.toLowerCase()] || {};
    var km = (t.dist||0)/1000;
    var zones = t.zones||0;
    var ank = ankByName[name.toLowerCase()]||0;
    var pts = Math.round(km*10 + zones*25 + ank*15);
    return { name: name, pts: pts, km: km, zones: zones, ank: ank };
  });
  rows.sort(function(a,b){ return b.pts - a.pts; });
  if (!rows.length) { el.innerHTML = '<div class="team-empty">Brak danych ligi na dziś.</div>'; return; }

  var medals = ['🥇','🥈','🥉'];
  var html = '';
  rows.forEach(function(r, i){
    var medal = medals[i] || ('<span class="liga-rank">'+(i+1)+'</span>');
    html += '<div class="liga-row"><span class="liga-pos">'+medal+'</span>' +
            '<div class="liga-mid"><b>'+r.name+'</b>' +
            '<span class="liga-meta">'+r.km.toFixed(1)+' km · '+r.zones+' stref · '+r.ank+' ank.</span></div>' +
            '<span class="liga-pts">'+r.pts+' pkt</span></div>';
  });
  el.innerHTML = html;
}


// ── HELPER: scal duplikaty rankingu po znormalizowanym imieniu ──
function dedupRanking(ranking) {
  function norm(n){
    return (n||'').toString().trim().toLowerCase()
      .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
      .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/ż/g,'z').replace(/ź/g,'z')
      .replace(/\s+/g,' ');
  }
  var map = {};
  ranking.forEach(function(r){
    var key = norm(r.name || r['Ankieter']);
    if (!key) return;
    if (!map[key]) {
      map[key] = { name:(r.name||r['Ankieter']||'').toString().trim(),
                   xp:0, total:0, hot:0, streak:0, today:0 };
    }
    var m = map[key];
    // bierzemy maksimum (te same konta mogą się powielać przy literówkach)
    m.xp     = Math.max(m.xp,     Number(r.xp||0));
    m.total  = Math.max(m.total,  Number(r.total||0));
    m.hot    = Math.max(m.hot,    Number(r.hot||r['Gorące leady']||0));
    m.streak = Math.max(m.streak, Number(r.streak||0));
    m.today  = Math.max(m.today,  Number(r.today||r['Dziś']||0));
    // dłuższe/ładniejsze imię (z polskimi znakami) wygrywa
    var cand = (r.name||r['Ankieter']||'').toString().trim();
    if (cand.length > m.name.length) m.name = cand;
  });
  return Object.keys(map).map(function(k){ return map[k]; });
}

// ── 🎯 CEL ZESPOŁU (dzienny) ──
var TEAM_DAILY_GOAL = 50;   // docelowa liczba ankiet zespołu / dzień
function drawLiderGoal(ranking) {
  var el = document.getElementById('liderGoal');
  if (!el) return;
  var rows = dedupRanking(ranking);
  var ankDzis = rows.reduce(function(s,r){ return s + (r.today||0); }, 0);
  var pct = Math.min(100, Math.round(ankDzis / TEAM_DAILY_GOAL * 100));
  var done = ankDzis >= TEAM_DAILY_GOAL;
  el.innerHTML =
    '<div class="goal-top"><b>Cel zespołu na dziś</b>' +
    '<span>'+ankDzis+' / '+TEAM_DAILY_GOAL+' ankiet'+(done?' ✅':'')+'</span></div>' +
    '<div class="goal-bar"><div class="goal-fill'+(done?' done':'')+'" style="width:'+pct+'%"></div></div>' +
    '<div class="goal-sub">'+(done?'🎉 Cel osiągnięty! Świetna robota zespole.':'Jeszcze '+(TEAM_DAILY_GOAL-ankDzis)+' do celu — dacie radę!')+'</div>';
}

// ── 📝 ANKIETY DZIŚ — słupki per ankieter ──
function drawLiderToday(ranking) {
  var el = document.getElementById('liderToday');
  if (!el) return;
  var rows = dedupRanking(ranking).filter(function(r){ return r.today > 0; });
  rows.sort(function(a,b){ return b.today - a.today; });
  if (!rows.length) { el.innerHTML = '<div class="team-empty">Brak ankiet zarejestrowanych dziś.</div>'; return; }
  var max = rows[0].today || 1;
  var html = '';
  rows.forEach(function(r, i){
    var pct = Math.round(r.today / max * 100);
    var lead = i === 0 ? ' lead' : '';
    html += '<div class="lider-bar-row"><div class="lbr-top"><b>'+(i===0?'👑 ':'')+r.name+'</b><span>'+r.today+' ank.</span></div>' +
            '<div class="lbr-track"><div class="lbr-fill'+lead+'" style="width:'+pct+'%"></div></div></div>';
  });
  el.innerHTML = html;
}

// ── 🎯 SKUTECZNOŚĆ: % gorących leadów ──
function drawLiderSkut(ranking) {
  var el = document.getElementById('liderSkut');
  if (!el) return;
  var rows = dedupRanking(ranking).filter(function(r){ return r.total > 0; });
  rows.forEach(function(r){ r.rate = Math.round((r.hot / r.total) * 100); });
  rows.sort(function(a,b){ return b.rate - a.rate || b.total - a.total; });
  if (!rows.length) { el.innerHTML = '<div class="team-empty">Brak danych o leadach.</div>'; return; }
  var html = '';
  rows.slice(0, 10).forEach(function(r){
    var cls = r.rate >= 50 ? 'hot' : (r.rate >= 25 ? 'mid' : 'low');
    html += '<div class="skut-row"><div class="skut-mid"><b>'+r.name+'</b>' +
            '<span class="skut-meta">'+r.hot+' 🔥 / '+r.total+' ankiet</span></div>' +
            '<span class="skut-rate '+cls+'">'+r.rate+'%</span></div>';
  });
  el.innerHTML = html;
}

// ── 🏅 RANKING OGÓLNY XP (z poziomami) ──
function drawLiderXp(ranking) {
  var el = document.getElementById('liderXp');
  if (!el) return;
  var rows = dedupRanking(ranking);
  rows.sort(function(a,b){ return b.xp - a.xp; });
  if (!rows.length) { el.innerHTML = '<div class="team-empty">Brak danych XP.</div>'; return; }
  var maxXp = rows[0].xp || 1;
  var medals = ['🥇','🥈','🥉'];
  var html = '';
  rows.slice(0, 12).forEach(function(r, i){
    var lv = (typeof getLv === 'function') ? getLv(r.xp) : {icon:'🌱', level:1, name:''};
    var pct = Math.round(r.xp / maxXp * 100);
    var pos = medals[i] || ('<span class="liga-rank">'+(i+1)+'</span>');
    html += '<div class="xp-row"><span class="xp-pos">'+pos+'</span>' +
            '<div class="xp-mid"><div class="xp-name"><b>'+r.name+'</b>' +
            '<span class="xp-lv">'+lv.icon+' Lv '+lv.level+'</span></div>' +
            '<div class="xp-track"><div class="xp-fill" style="width:'+pct+'%"></div></div></div>' +
            '<span class="xp-val">'+r.xp+'</span></div>';
  });
  el.innerHTML = html;
}

// ── AUTO-ODŚWIEŻANIE PANELU LIDERA ──────────────────────────
// Timer co 45 s, ale TYLKO gdy panel Lider jest widoczny.
// Sam się zatrzymuje gdy użytkownik wyjdzie z zakładki (oszczędza webhook).
var _liderTimer = null;

function liderPanelVisible() {
  var p = document.getElementById('panel_lider');
  return !!(p && p.classList.contains('active'));
}

function startLiderAuto() {
  stopLiderAuto();
  _liderTimer = setInterval(function(){
    if (!liderPanelVisible()) { stopLiderAuto(); return; }   // wyszedł z Lidera → stop
    loadLiderData(true);                                     // silent = bez "Ładuję…"
    var a = document.getElementById('liderAuto');
    if (a) {
      var t = new Date().toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
      a.textContent = '⟳ auto-odświeżanie co 45 s · ostatnio ' + t;
    }
  }, 45000);
}

function stopLiderAuto() {
  if (_liderTimer) { clearInterval(_liderTimer); _liderTimer = null; }
}
