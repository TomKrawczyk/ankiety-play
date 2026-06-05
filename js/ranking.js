// ============================================================
// RANKING — pobieranie z arkusza, render kart, duel
// ============================================================
var _rankTab   = 'xp';
var _rankCache = null;

function renderRanking() {
  var container = document.getElementById('rankingList');
  var dateEl    = document.getElementById('rankingDate');
  if (!container) return;
  container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:0.85em">⏳ Ładowanie rankingu…</div>';

  fetch(WEBHOOK + '?action=getRanking')
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (res.status !== 'ok' || !res.data) throw new Error('no data');
      _rankCache = res.data;
      _drawRanking(res.data);
      if (dateEl) {
        var now = new Date();
        dateEl.textContent = 'Stan: ' + now.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
      }
    })
    .catch(function(){
      _rankCache = null;
      _drawRankingLocal();
      if (dateEl) dateEl.textContent = '⚠️ Offline';
    });
}

function _drawRankingLocal() {
  var users = getUsers();
  var today = new Date().toLocaleDateString('pl-PL');
  var list  = [];
  Object.keys(users).forEach(function(k) {
    var u = users[k];
    var todayCount = 0;
    try {
      var td = JSON.parse(localStorage.getItem('4eco_td_' + k)) || {};
      todayCount = td.d === today ? (td.c || 0) : 0;
    } catch(e){}
    list.push({name:u.name||k, xp:u.xp||0, total:u.total||0, hot:u.hot||0, today:todayCount, streak:u.streak||0});
  });
  _drawRanking(list);
}

function _drawRanking(list) {
  var me        = (window._user || '').toLowerCase();
  var container = document.getElementById('rankingList');
  if (!container) return;

  list.sort(function(a,b){ return (b[_rankTab]||0) - (a[_rankTab]||0); });
  var maxVal = list.length > 0 ? (list[0][_rankTab] || 1) : 1;

  // Taby
  var tabDefs = [
    {key:'xp',    icon:'⭐', label:'XP'},
    {key:'total', icon:'📋', label:'Ankiety'},
    {key:'hot',   icon:'🔥', label:'Gorące'},
    {key:'today', icon:'📅', label:'Dziś'},
  ];
  var tabHtml = '<div style="display:flex;gap:6px;overflow-x:auto;padding:12px 14px 0;margin-bottom:8px">';
  tabDefs.forEach(function(t) {
    var active = t.key === _rankTab;
    tabHtml += '<button onclick="setRankTab(\'' + t.key + '\')" style="' +
      'flex-shrink:0;padding:7px 14px;border-radius:20px;font-size:0.72em;font-weight:800;cursor:pointer;' +
      'border:1.5px solid ' + (active ? 'var(--green)' : 'var(--border2)') + ';' +
      'background:' + (active ? 'var(--green)' : 'var(--card)') + ';' +
      'color:' + (active ? '#000' : 'var(--muted2)') + '">' +
      t.icon + ' ' + t.label + '</button>';
  });
  tabHtml += '</div>';

  if (list.length === 0) {
    container.innerHTML = tabHtml + '<div style="padding:40px;text-align:center;color:var(--muted);font-size:0.85em">Brak danych</div>';
    return;
  }

  var medals   = ['🥇','🥈','🥉'];
  var valLabels = {xp:'XP', total:'ankiet', hot:'gorących', today:'dziś'};
  var cardsHtml = '<div style="padding:8px 10px">';

  list.forEach(function(u, i) {
    var pos    = i + 1;
    var isMe   = (u.name || '').toLowerCase() === me;
    var medal  = medals[i] || ('#' + pos);
    var lv     = getLv(u.xp || 0);
    var val    = u[_rankTab] || 0;
    var pct    = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;

    // Avatar
    var av        = (typeof getAvatar === 'function') ? getAvatar(u.name) : {};
    var ico       = AV_ICONS.find(function(x){return x.id===(av.icon||'default');})  || {emoji:'⚡'};
    var clr       = AV_COLORS.find(function(x){return x.id===(av.color||'green');}) || {bg:'linear-gradient(135deg,#00ff88,#00cc6a)'};
    var frm       = AV_FRAMES.find(function(x){return x.id===(av.frame||'none');})  || {css:'none'};
    var customImg = localStorage.getItem('av_custom_' + (u.name||'').toLowerCase());

    var avBg      = customImg ? 'transparent' : clr.bg;
    var avShadow  = (frm.css && frm.css !== 'none') ? frm.css : '';
    var avContent = customImg
      ? '<img src="'+customImg+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">'
      : ico.emoji;

    // Kolory medali
    var medalColors = {1:'#ffd700',2:'#c0c0c0',3:'#cd7f32'};
    var borderClr   = isMe ? 'var(--green)' : (medalColors[pos] || 'var(--border2)');
    var cardBg      = isMe
      ? 'linear-gradient(135deg,rgba(0,255,136,0.08),rgba(0,255,136,0.03))'
      : (pos <= 3 ? 'linear-gradient(135deg,rgba(255,255,255,0.04),transparent)' : 'var(--card)');

    cardsHtml +=
      '<div style="display:grid;grid-template-columns:28px 48px 1fr auto;align-items:center;gap:10px;' +
      'background:' + cardBg + ';border:1px solid ' + borderClr + ';' +
      'border-radius:14px;padding:10px 12px;margin-bottom:7px;position:relative">' +

        // Pozycja
        '<div style="font-size:' + (pos<=3?'1.3em':'0.88em') + ';font-weight:900;text-align:center;' +
        'color:' + (medalColors[pos] || 'var(--muted2)') + '">' + medal + '</div>' +

        // Avatar
        '<div style="width:44px;height:44px;border-radius:50%;background:' + avBg + ';' +
        'display:flex;align-items:center;justify-content:center;font-size:1.4em;' +
        'box-shadow:' + avShadow + ';overflow:hidden;flex-shrink:0">' + avContent + '</div>' +

        // Info
        '<div style="min-width:0">' +
          '<div style="font-size:0.82em;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
            (isMe ? '👤 ' : '') + u.name +
          '</div>' +
          '<div style="font-size:0.66em;color:var(--muted);margin-top:1px">' +
            lv.icon + ' ' + lv.name +
            (u.streak > 1 ? ' · 🔥' + u.streak + 'd' : '') +
          '</div>' +
          '<div style="height:4px;background:var(--bg3);border-radius:2px;margin-top:5px">' +
            '<div style="height:100%;width:' + pct + '%;background:' + (isMe?'var(--green)':'var(--green)') + ';border-radius:2px;opacity:' + (isMe?'1':'0.55') + '"></div>' +
          '</div>' +
        '</div>' +

        // Wartość
        '<div style="text-align:right;flex-shrink:0">' +
          '<div style="font-size:1em;font-weight:900;color:' + (isMe?'var(--green)':'var(--text)') + '">' + val + '</div>' +
          '<div style="font-size:0.6em;color:var(--muted)">' + valLabels[_rankTab] + '</div>' +
        '</div>' +

      '</div>';
  });
  cardsHtml += '</div>';

  container.innerHTML = tabHtml + cardsHtml;
}

function setRankTab(tab) {
  _rankTab = tab;
  if (_rankCache) _drawRanking(_rankCache);
  else renderRanking();
}

// Duel section (placeholder — rozszerz jeśli trzeba)
function renderDuel() {
  var el = document.getElementById('duel_section');
  if (!el) return;
  el.innerHTML = '';
}
