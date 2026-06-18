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
    '<div class="lider-sec-h">👥 Zespół teraz</div>' +
    '<div id="liderTeam" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<div class="lider-sec-h">🚶 Aktywność w terenie (dziś)</div>' +
    '<div id="liderTracks" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<div class="lider-sec-h">🏆 Liga terenowa (dziś)</div>' +
    '<div class="liga-info">Punkty = km × 10 + strefy × 25 + ankiety × 15</div>' +
    '<div id="liderLiga" class="map-team"><div class="team-empty">Ładuję…</div></div>' +
    '<button class="map-share off" onclick="renderLider()" style="margin-top:10px">🔄 Odśwież</button>';

  var d = new Date();
  var dEl = document.getElementById('liderDate');
  if (dEl) dEl.textContent = d.toLocaleDateString('pl-PL', { weekday:'long', day:'numeric', month:'long' });

  loadLiderData();
}

function liderToday() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
}

function loadLiderData() {
  var pres = fetch(WEBHOOK + '?action=getPresence').then(function(r){return r.json();}).catch(function(){return null;});
  var trk  = fetch(WEBHOOK + '?action=getTracks&date=' + liderToday()).then(function(r){return r.json();}).catch(function(){return null;});
  var rank = fetch(WEBHOOK + '?action=getRanking').then(function(r){return r.json();}).catch(function(){return null;});

  Promise.all([pres, trk, rank]).then(function(res){
    var agents = (res[0] && res[0].agents) || [];
    var tracks = (res[1] && res[1].tracks) || [];
    var ranking = (res[2] && res[2].data) || [];
    console.log('[Lider] presence:', agents.length, 'tracks:', tracks.length, 'ranking:', ranking.length);
    try { drawLiderKpis(agents, tracks, ranking); } catch(e){ console.error('KPI',e); }
    try { drawLiderTeam(agents); } catch(e){ console.error('Team',e); }
    try { drawLiderTracks(tracks); } catch(e){ console.error('Tracks',e); }
    try { drawLiderLiga(tracks, ranking); } catch(e){ console.error('Liga',e); }
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
