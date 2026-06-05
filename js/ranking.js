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

function _avHTML(name, size, fontSize) {
  var av        = (typeof getAvatar === 'function') ? getAvatar(name) : {};
  var ico       = AV_ICONS.find(function(x){return x.id===(av.icon||'default');})  || {emoji:'⚡'};
  var clr       = AV_COLORS.find(function(x){return x.id===(av.color||'green');}) || {bg:'linear-gradient(135deg,#10d873,#0baf5e)'};
  var frm       = AV_FRAMES.find(function(x){return x.id===(av.frame||'none');})  || {css:'none'};
  var customImg = localStorage.getItem('av_custom_' + (name||'').toLowerCase());
  var avBg      = customImg ? 'transparent' : clr.bg;
  var avShadow  = (frm.css && frm.css !== 'none') ? frm.css : '';
  var avContent = customImg
    ? '<img src="'+customImg+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">'
    : ico.emoji;
  return '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+avBg+';'+
    'display:flex;align-items:center;justify-content:center;font-size:'+fontSize+';'+
    'box-shadow:'+avShadow+';overflow:hidden;flex-shrink:0">'+avContent+'</div>';
}

function _drawRanking(list) {
  var me        = (window._user || '').toLowerCase();
  var container = document.getElementById('rankingList');
  if (!container) return;

  list.sort(function(a,b){ return (b[_rankTab]||0) - (a[_rankTab]||0); });
  var maxVal = list.length > 0 ? (list[0][_rankTab] || 1) : 1;

  // Taby
  var tabDefs = [
    {key:'xp',    icon:'\u2b50', label:'XP'},
    {key:'total', icon:'\ud83d\udccb', label:'Ankiety'},
    {key:'hot',   icon:'\ud83d\udd25', label:'Gor\u0105ce'},
    {key:'today', icon:'\ud83d\udcc5', label:'Dzi\u015b'},
  ];
  var tabHtml = '<div style="display:flex;gap:6px;overflow-x:auto;padding:12px 14px 0;margin-bottom:8px">';
  tabDefs.forEach(function(t) {
    var active = t.key === _rankTab;
    tabHtml += '<button onclick="setRankTab(\'' + t.key + '\')" class="rank-tab' + (active?' active':'') + '" style="' +
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

  var valLabels = {xp:'XP', total:'ankiet', hot:'gor\u0105cych', today:'dzi\u015b'};

  // ── PODIUM (TOP 3) — uk\u0142ad olimpijski: \u015brodek z\u0142oto, lewo srebro, prawo br\u0105z ──
  var podiumHtml = '';
  var top3 = list.slice(0, 3);
  if (top3.length >= 1) {
    // kolejno\u015b\u0107 wizualna: [2.\u017csrebro][1.z\u0142oto][3.br\u0105z]
    var order = [];
    if (top3[1]) order.push({u:top3[1], pos:2});
    order.push({u:top3[0], pos:1});
    if (top3[2]) order.push({u:top3[2], pos:3});

    var podCfg = {
      1: {h:96,  medal:'\ud83e\udd47', clr:'#ffd700', av:60, avF:'1.9em', glow:'0 0 28px rgba(255,215,0,0.45)'},
      2: {h:70,  medal:'\ud83e\udd48', clr:'#c0c0c0', av:50, avF:'1.5em', glow:'0 0 18px rgba(192,192,192,0.35)'},
      3: {h:54,  medal:'\ud83e\udd49', clr:'#cd7f32', av:46, avF:'1.4em', glow:'0 0 16px rgba(205,127,50,0.35)'}
    };

    podiumHtml = '<div style="display:flex;justify-content:center;align-items:flex-end;gap:10px;padding:18px 12px 6px;">';
    order.forEach(function(o) {
      var u = o.u, pos = o.pos, c = podCfg[pos];
      var isMe = (u.name||'').toLowerCase() === me;
      var ttl  = (typeof getTitle === 'function') ? getTitle(u.name) : null;
      var val  = u[_rankTab] || 0;
      var ttlHtml = (ttl && ttl.label)
        ? '<div style="font-size:0.56em;font-weight:800;color:'+ttl.color+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px;margin:1px auto 0">'+ttl.label+'</div>'
        : '';
      podiumHtml +=
        '<div style="display:flex;flex-direction:column;align-items:center;width:31%;max-width:110px;">' +
          // medal + avatar
          '<div style="font-size:1.5em;line-height:1;margin-bottom:3px">'+c.medal+'</div>' +
          '<div style="box-shadow:'+c.glow+';border-radius:50%;margin-bottom:5px">'+_avHTML(u.name, c.av, c.avF)+'</div>' +
          // imi\u0119
          '<div style="font-size:0.68em;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;text-align:center">'+(isMe?'\ud83d\udc64 ':'')+u.name+'</div>' +
          ttlHtml +
          // s\u0142upek pude\u0142ka
          '<div style="width:100%;height:'+c.h+'px;margin-top:6px;border-radius:10px 10px 0 0;' +
            'background:linear-gradient(180deg,'+c.clr+'33,'+c.clr+'11);' +
            'border:1.5px solid '+c.clr+'66;border-bottom:none;' +
            'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:8px;position:relative">' +
            '<div style="font-size:1.4em;font-weight:900;color:'+c.clr+'">'+pos+'</div>' +
            '<div style="font-size:0.82em;font-weight:900;color:var(--text);margin-top:auto;margin-bottom:6px">'+val+'</div>' +
            '<div style="font-size:0.52em;color:var(--muted);margin-bottom:8px">'+valLabels[_rankTab]+'</div>' +
          '</div>' +
        '</div>';
    });
    podiumHtml += '</div>';
    // podstawa pod pude\u0142kiem
    podiumHtml += '<div style="height:6px;background:linear-gradient(90deg,transparent,var(--border2),transparent);margin:0 14px 10px;border-radius:3px"></div>';
  }

  // ── LISTA (pozycje 4+) ──
  var cardsHtml = '';
  var rest = list.slice(3);
  if (rest.length > 0) {
    cardsHtml = '<div style="padding:4px 10px 10px">';
    rest.forEach(function(u, i) {
      var pos    = i + 4;
      var isMe   = (u.name || '').toLowerCase() === me;
      var lv     = getLv(u.xp || 0);
      var ttl    = (typeof getTitle === 'function') ? getTitle(u.name) : null;
      var val    = u[_rankTab] || 0;
      var pct    = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
      var borderClr = isMe ? 'var(--green)' : 'var(--border2)';
      var cardBg    = isMe ? 'linear-gradient(135deg,rgba(16,216,115,0.08),rgba(16,216,115,0.03))' : 'var(--card)';
      var ttlLine = (ttl && ttl.label)
        ? ' \u00b7 <span style="color:'+ttl.color+';font-weight:800">'+ttl.label+'</span>'
        : '';

      cardsHtml +=
        '<div style="display:grid;grid-template-columns:28px 44px 1fr auto;align-items:center;gap:10px;' +
        'background:' + cardBg + ';border:1px solid ' + borderClr + ';' +
        'border-radius:14px;padding:10px 12px;margin-bottom:7px;position:relative">' +
          '<div style="font-size:0.88em;font-weight:900;text-align:center;color:var(--muted2)">#' + pos + '</div>' +
          _avHTML(u.name, 40, '1.3em') +
          '<div style="min-width:0">' +
            '<div style="font-size:0.82em;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
              (isMe ? '\ud83d\udc64 ' : '') + u.name +
            '</div>' +
            '<div style="font-size:0.64em;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
              lv.icon + ' ' + lv.name + ttlLine +
              (u.streak > 1 ? ' \u00b7 \ud83d\udd25' + u.streak + 'd' : '') +
            '</div>' +
            '<div style="height:4px;background:var(--bg3);border-radius:2px;margin-top:5px">' +
              '<div style="height:100%;width:' + pct + '%;background:var(--green);border-radius:2px;opacity:' + (isMe?'1':'0.55') + '"></div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0">' +
            '<div style="font-size:1em;font-weight:900;color:' + (isMe?'var(--green)':'var(--text)') + '">' + val + '</div>' +
            '<div style="font-size:0.6em;color:var(--muted)">' + valLabels[_rankTab] + '</div>' +
          '</div>' +
        '</div>';
    });
    cardsHtml += '</div>';
  }

  container.innerHTML = tabHtml + podiumHtml + cardsHtml;
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
