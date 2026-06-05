// ============================================================
// AVATAR SYSTEM — dane, wybór, zapis, header, tryb jasny/ciemny
// ============================================================

var AV_ICONS = [
  {id:'default',  emoji:'⚡', name:'Energetyk',         req:0,    tier:'common'},
  {id:'seedling', emoji:'🌱', name:'Ekolog',             req:0,    tier:'common'},
  {id:'handshake',emoji:'🤝', name:'Networker',          req:0,    tier:'common'},
  {id:'fire',     emoji:'🔥', name:'Żywy ogień',         req:50,   tier:'common'},
  {id:'bolt',     emoji:'⚡', name:'Błyskawica',         req:80,   tier:'common'},
  {id:'rocket',   emoji:'🚀', name:'Rakieta',            req:120,  tier:'common'},
  {id:'muscle',   emoji:'💪', name:'Siłacz',             req:180,  tier:'common'},
  {id:'chart',    emoji:'📈', name:'Analityk',           req:250,  tier:'common'},
  {id:'target',   emoji:'🎯', name:'Snajper',            req:400,  tier:'rare'},
  {id:'diamond',  emoji:'💎', name:'Diament',            req:600,  tier:'rare'},
  {id:'wizard',   emoji:'🧙', name:'Czarodziej',         req:800,  tier:'rare'},
  {id:'robot',    emoji:'🤖', name:'Cyber Agent',        req:1000, tier:'rare'},
  {id:'detective',emoji:'🕵️', name:'Detektyw',           req:1200, tier:'rare'},
  {id:'wolf',     emoji:'🐺', name:'Samotny wilk',       req:1500, tier:'rare'},
  {id:'crown',    emoji:'👑', name:'Królewska',          req:2000, tier:'epic'},
  {id:'alien',    emoji:'👽', name:'Extraterrestrial',   req:2500, tier:'epic'},
  {id:'ninja',    emoji:'🥷', name:'Shadow Ninja',       req:3000, tier:'epic'},
  {id:'dragon',   emoji:'🐉', name:'Smok',               req:3500, tier:'epic'},
  {id:'phoenix',  emoji:'🦅', name:'Feniks',             req:4000, tier:'epic'},
  {id:'skull',    emoji:'💀', name:'Dark Lord',          req:5000, tier:'legendary'},
  {id:'unicorn',  emoji:'🦄', name:'Jednorożec',         req:6000, tier:'legendary'},
  {id:'galaxy',   emoji:'🌌', name:'Galaxy Brain',       req:8000, tier:'legendary'},
  {id:'god',      emoji:'🌟', name:'GOD MODE',           req:10000,tier:'legendary'},
  {id:'goat',     emoji:'🐐', name:'G.O.A.T.',           req:15000,tier:'legendary'},
  {id:'sun',      emoji:'☀️', name:'Słońce',             req:90,   tier:'common'},
  {id:'leaf',     emoji:'🍃', name:'Liść',               req:160,  tier:'common'},
  {id:'lightning2',emoji:'🌩️', name:'Burza',             req:320,  tier:'rare'},
  {id:'fox',      emoji:'🦊', name:'Lis',                req:550,  tier:'rare'},
  {id:'owl',      emoji:'🦉', name:'Sowa Mędrzec',       req:700,  tier:'rare'},
  {id:'tiger',    emoji:'🐯', name:'Tygrys',             req:1700, tier:'epic'},
  {id:'comet',    emoji:'☄️', name:'Kometa',             req:2800, tier:'epic'},
  {id:'shield',   emoji:'🛡️', name:'Strażnik',           req:4500, tier:'epic'},
  {id:'trophy',   emoji:'🏆', name:'Mistrz',             req:7000, tier:'legendary'},
  {id:'infinity', emoji:'♾️', name:'Infinity',           req:20000,tier:'legendary'}
];

var AV_COLORS = [
  {id:'green',   bg:'linear-gradient(135deg,#10d873,#0baf5e)',                  name:'Neon Green',  req:0,    tier:'common'},
  {id:'blue',    bg:'linear-gradient(135deg,#60a5fa,#3b82f6)',                  name:'Ocean',       req:0,    tier:'common'},
  {id:'teal',    bg:'linear-gradient(135deg,#2dd4bf,#0d9488)',                  name:'Teal',        req:150,  tier:'common'},
  {id:'pink',    bg:'linear-gradient(135deg,#f472b6,#ec4899)',                  name:'Bubblegum',   req:250,  tier:'common'},
  {id:'orange',  bg:'linear-gradient(135deg,#fb923c,#f97316)',                  name:'Sunset',      req:400,  tier:'common'},
  {id:'purple',  bg:'linear-gradient(135deg,#a78bfa,#7c3aed)',                  name:'Galaxy',      req:500,  tier:'common'},
  {id:'red',     bg:'linear-gradient(135deg,#f87171,#ef4444)',                  name:'Blood Moon',  req:800,  tier:'rare'},
  {id:'gold',    bg:'linear-gradient(135deg,#fbbf24,#d97706)',                  name:'Złoto',       req:1200, tier:'rare'},
  {id:'cyber',   bg:'linear-gradient(135deg,#22b8d6,#2563eb)',                  name:'Cyber Blue',  req:1500, tier:'rare'},
  {id:'forest',  bg:'linear-gradient(135deg,#4ade80,#166534)',                  name:'Deep Forest', req:2000, tier:'rare'},
  {id:'rainbow', bg:'linear-gradient(135deg,#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa)', name:'Tęcza', req:3000, tier:'epic'},
  {id:'lava',    bg:'linear-gradient(135deg,#ea580c,#b91c1c,#7f1d1d)',          name:'Lava',        req:3500, tier:'epic'},
  {id:'neon',    bg:'linear-gradient(135deg,#c026d3,#06b6d4)',                  name:'Neon Vice',   req:4000, tier:'epic'},
  {id:'dark',    bg:'linear-gradient(135deg,#1e293b,#475569)',                  name:'Shadow',      req:5000, tier:'legendary'},
  {id:'void',    bg:'linear-gradient(135deg,#000000,#1a0030,#000000)',          name:'Void',        req:8000, tier:'legendary'},
  {id:'divine',  bg:'linear-gradient(135deg,#fff7ae,#ffd700,#ff8c00,#ffd700)', name:'Divine Gold', req:12000,tier:'legendary'},
  {id:'mint',    bg:'linear-gradient(135deg,#6ee7b7,#34d399)',                  name:'Mięta',       req:0,    tier:'common'},
  {id:'sky',     bg:'linear-gradient(135deg,#93c5fd,#60a5fa)',                  name:'Niebo',       req:120,  tier:'common'},
  {id:'lavender',bg:'linear-gradient(135deg,#c4b5fd,#a78bfa)',                  name:'Lawenda',     req:300,  tier:'common'},
  {id:'coral',   bg:'linear-gradient(135deg,#fda4af,#fb7185)',                  name:'Koral',       req:450,  tier:'common'},
  {id:'amber',   bg:'linear-gradient(135deg,#fcd34d,#f59e0b)',                  name:'Bursztyn',    req:650,  tier:'rare'},
  {id:'slate',   bg:'linear-gradient(135deg,#94a3b8,#475569)',                  name:'Grafit',      req:1000, tier:'rare'},
  {id:'emerald', bg:'linear-gradient(135deg,#34d399,#059669)',                  name:'Szmaragd',    req:1600, tier:'rare'},
  {id:'plum',    bg:'linear-gradient(135deg,#d8b4fe,#9333ea,#6b21a8)',          name:'Śliwka',      req:2400, tier:'epic'},
  {id:'aurora',  bg:'linear-gradient(135deg,#5eead4,#818cf8,#c084fc)',          name:'Zorza',       req:4200, tier:'epic'},
  {id:'obsidian',bg:'linear-gradient(135deg,#334155,#0f172a,#1e293b)',          name:'Obsydian',    req:9000, tier:'legendary'}
];

var AV_FRAMES = [
  {id:'none',       css:'none',                                                                      name:'Brak',          req:0,    tier:'common'},
  {id:'glow',       css:'0 0 12px rgba(16,216,115,0.7)',                                              name:'Zielony glow',  req:200,  tier:'common'},
  {id:'blue_glow',  css:'0 0 12px rgba(96,165,250,0.8)',                                             name:'Niebieski glow',req:400,  tier:'common'},
  {id:'pulse',      css:'0 0 0 3px rgba(16,216,115,0.6),0 0 16px rgba(16,216,115,0.3)',                name:'Pulse',         req:600,  tier:'rare'},
  {id:'pink_halo',  css:'0 0 16px rgba(244,114,182,0.9)',                                            name:'Pink Halo',     req:900,  tier:'rare'},
  {id:'gold',       css:'0 0 16px rgba(245,158,11,0.9),0 0 0 2px rgba(245,158,11,0.4)',              name:'Złota',         req:1200, tier:'rare'},
  {id:'cyber',      css:'0 0 0 2px #22b8d6,0 0 18px rgba(34,184,214,0.4)',                            name:'Cyber',         req:1800, tier:'rare'},
  {id:'rainbow',    css:'0 0 20px rgba(167,139,250,0.9)',                                            name:'Aura Tęczy',    req:2500, tier:'epic'},
  {id:'fire',       css:'0 0 24px rgba(251,146,60,1),0 0 0 2px rgba(239,68,68,0.6)',                 name:'Płomień',       req:3500, tier:'epic'},
  {id:'void',       css:'0 0 0 3px rgba(139,92,246,0.8),0 0 24px rgba(139,92,246,0.5),0 0 40px rgba(139,92,246,0.2)', name:'Void Aura', req:5000, tier:'epic'},
  {id:'divine',     css:'0 0 0 3px rgba(255,215,0,1),0 0 30px rgba(255,215,0,0.7),0 0 60px rgba(255,165,0,0.4)',     name:'Divine',    req:8000, tier:'legendary'},
  {id:'singularity',css:'0 0 0 2px #fff,0 0 20px #fff,0 0 40px rgba(255,255,255,0.5)',               name:'Singularity',  req:12000,tier:'legendary'},
  {id:'soft_mint', css:'0 0 12px rgba(52,211,153,0.55)',                                            name:'Miętowy blask',  req:120,  tier:'common'},
  {id:'sky_ring',  css:'0 0 0 2px rgba(96,165,250,0.5),0 0 14px rgba(96,165,250,0.4)',              name:'Niebieski pierścień',req:350,tier:'common'},
  {id:'amber_soft',css:'0 0 14px rgba(245,158,11,0.55)',                                            name:'Bursztynowa poświata',req:700,tier:'rare'},
  {id:'lavender_halo',css:'0 0 16px rgba(167,139,250,0.6)',                                         name:'Lawendowe halo', req:1000, tier:'rare'},
  {id:'coral_glow',css:'0 0 14px rgba(251,113,133,0.55)',                                           name:'Koralowy blask', req:1400, tier:'rare'},
  {id:'emerald_ring',css:'0 0 0 2px rgba(16,185,129,0.6),0 0 16px rgba(16,185,129,0.35)',           name:'Szmaragdowy ring',req:2000,tier:'epic'},
  {id:'dual_ring', css:'0 0 0 2px rgba(96,165,250,0.6),0 0 0 4px rgba(167,139,250,0.4)',            name:'Podwójny pierścień',req:3000,tier:'epic'},
  {id:'aurora_aura',css:'0 0 18px rgba(129,140,248,0.5),0 0 30px rgba(192,132,252,0.3)',            name:'Aura zorzy',     req:4500, tier:'epic'},
  {id:'frost',     css:'0 0 0 2px rgba(186,230,253,0.7),0 0 20px rgba(125,211,252,0.4)',            name:'Szron',          req:6500, tier:'legendary'},
  {id:'eclipse',   css:'0 0 0 3px rgba(15,23,42,0.9),0 0 0 5px rgba(148,163,184,0.5),0 0 22px rgba(100,116,139,0.4)', name:'Zaćmienie', req:10000,tier:'legendary'}
];

var AV_TITLES = [
  {id:'none',       label:'',                   req:0,    tier:'common',    color:'var(--muted)'},
  {id:'rookie',     label:'🌱 Nowy',             req:0,    tier:'common',    color:'#4ade80'},
  {id:'scout',      label:'👁️ Scout',            req:100,  tier:'common',    color:'#60a5fa'},
  {id:'hunter',     label:'🎯 Łowca',            req:300,  tier:'common',    color:'#fb923c'},
  {id:'closer',     label:'🤝 Closer',           req:600,  tier:'rare',      color:'#a78bfa'},
  {id:'shark',      label:'🦈 Rekin sprzedaży',  req:1000, tier:'rare',      color:'#f87171'},
  {id:'ace',        label:'🃏 Ace',              req:1500, tier:'rare',      color:'#fbbf24'},
  {id:'cold_caller',label:'📞 Cold Call Master', req:2000, tier:'rare',      color:'#2dd4bf'},
  {id:'eco_warrior',label:'🌿 Eco Warrior',      req:2500, tier:'epic',      color:'#4ade80'},
  {id:'phantom',    label:'👻 Phantom',          req:3000, tier:'epic',      color:'#c084fc'},
  {id:'boss',       label:'😎 The Boss',         req:4000, tier:'epic',      color:'#f97316'},
  {id:'legend',     label:'🏆 Legend',           req:5000, tier:'legendary', color:'#ffd700'},
  {id:'god_mode',   label:'⚡ GOD MODE',         req:10000,tier:'legendary', color:'#ffd700'},
  {id:'goat',       label:'🐐 G.O.A.T.',         req:15000,tier:'legendary', color:'#ffd700'},
  {id:'prospector', label:'🔍 Poszukiwacz',      req:200,  tier:'common',    color:'#34d399'},
  {id:'negotiator', label:'💬 Negocjator',       req:450,  tier:'common',    color:'#fbbf24'},
  {id:'rainmaker',  label:'🌧️ Rainmaker',        req:800,  tier:'rare',      color:'#60a5fa'},
  {id:'energizer',  label:'⚡ Energetyk',         req:1200, tier:'rare',      color:'#10d873'},
  {id:'maestro',    label:'🎻 Maestro',          req:1800, tier:'rare',      color:'#c084fc'},
  {id:'titan',      label:'🛡️ Tytan',            req:3500, tier:'epic',      color:'#94a3b8'},
  {id:'overlord',   label:'👑 Overlord',         req:4500, tier:'epic',      color:'#f59e0b'},
  {id:'mythic',     label:'🔮 Mityczny',         req:6000, tier:'legendary', color:'#a78bfa'},
  {id:'immortal',   label:'♾️ Nieśmiertelny',     req:8000, tier:'legendary', color:'#5eead4'},
  {id:'apex',       label:'🌟 APEX',             req:20000,tier:'legendary', color:'#ffd700'}
];

// ── Tytuł avatara danego usera (z localStorage) ───────────────
function getTitle(name) {
  var key = '4eco_av_title_' + (name || window._user || '');
  var id  = localStorage.getItem(key) || 'none';
  var t   = AV_TITLES.find(function(x){ return x.id === id; }) || AV_TITLES[0];
  return t; // {id,label,req,tier,color}
}

// ── LocalStorage helpers ──────────────────────────────────────
function getAvatar(name) {
  var k = 'av_' + (name || window._user || 'anon').toLowerCase();
  try { return JSON.parse(localStorage.getItem(k)) || {icon:'default', color:'green', frame:'none'}; }
  catch(e) { return {icon:'default', color:'green', frame:'none'}; }
}

function saveAvatar(name, icon, color, frame) {
  name = name || window._user || 'anon';
  var data = {
    icon:  icon  || (window._avSel && window._avSel.icon)  || 'default',
    color: color || (window._avSel && window._avSel.color) || 'green',
    frame: frame || (window._avSel && window._avSel.frame) || 'none'
  };
  localStorage.setItem('av_' + name.toLowerCase(), JSON.stringify(data));
}

function applyAvatarToHeader() {
  var av  = getAvatar(window._user);
  var ico = AV_ICONS.find(function(x){return x.id === (av.icon||'default');}) || {emoji:'⚡'};
  var clr = AV_COLORS.find(function(x){return x.id === (av.color||'green');}) || {bg:'linear-gradient(135deg,#10d873,#0baf5e)'};
  var frm = AV_FRAMES.find(function(x){return x.id === (av.frame||'none');}) || {css:'none'};
  // UWAGA: element ma id="hdrAv" (nie hdrAvatar)
  var el = document.getElementById('hdrAv');
  if (!el) return;
  var customImg = localStorage.getItem('av_custom_' + (window._user||'').toLowerCase());
  if (customImg) {
    el.innerHTML = '<img src="'+customImg+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
    el.style.background = 'transparent';
  } else {
    el.textContent  = ico.emoji;
    el.style.background  = clr.bg;
  }
  el.style.boxShadow = (frm.css && frm.css !== 'none') ? frm.css : '';
}

// ── Motyw jasny/ciemny ────────────────────────────────────────
function toggleTheme() {
  var isLight = document.body.classList.toggle('light');
  localStorage.setItem('4eco_theme', isLight ? 'light' : 'dark');
  var btn = document.querySelector('.btn-theme');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
}

function applyStoredTheme() {
  var theme = localStorage.getItem('4eco_theme') || 'dark';
  document.body.classList.toggle('light', theme === 'light');
  var btn = document.querySelector('.btn-theme');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
}

// ── Overlay profilu (przycisk avatara w nagłówku) ─────────────
function toggleProfileOverlay() {
  var ov = document.getElementById('profileOverlay');
  if (!ov) return;
  var isOpen = ov.classList.toggle('open');
  if (isOpen) {
    // odśwież avatar w overlay
    var av  = getAvatar(window._user);
    var ico = AV_ICONS.find(function(x){return x.id===(av.icon||'default');}) || {emoji:'⚡'};
    var clr = AV_COLORS.find(function(x){return x.id===(av.color||'green');}) || {bg:'linear-gradient(135deg,#10d873,#0baf5e)'};
    var frm = AV_FRAMES.find(function(x){return x.id===(av.frame||'none');}) || {css:'none'};
    var ovAv = document.getElementById('ovAvatar');
    if (ovAv) {
      var customImg = localStorage.getItem('av_custom_'+(window._user||'').toLowerCase());
      if (customImg) {
        ovAv.innerHTML = '<img src="'+customImg+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
        ovAv.style.background = 'transparent';
      } else {
        ovAv.textContent = ico.emoji;
        ovAv.style.background = clr.bg;
      }
      ovAv.style.boxShadow = (frm.css && frm.css !== 'none') ? frm.css : '';
    }
  }
}

// Zamknij overlay klikając tło
document.addEventListener('click', function(e) {
  var ov = document.getElementById('profileOverlay');
  if (ov && ov.classList.contains('open') && e.target === ov) {
    ov.classList.remove('open');
  }
});

// ── Panel edycji avatara ──────────────────────────────────────
var AV_TC = {common:'#94a3b8', rare:'#60a5fa', epic:'#a78bfa', legendary:'#ffd700'};
var AV_TL = {common:'●', rare:'◆', epic:'✦', legendary:'★'};

function renderAvatar() {
  var xp = getStats(window._user || '').xp;
  var av = getAvatar(window._user);

  window._avSel = {
    icon:  av.icon  || 'default',
    color: av.color || 'green',
    frame: av.frame || 'none',
    title: localStorage.getItem('4eco_av_title_' + (window._user || '')) || 'none'
  };

  var panel = document.getElementById('panel_avatar');
  if (!panel) return;

  panel.innerHTML = _buildAvatarPanel(xp);

  // Wstaw style tabów jeśli nie ma
  if (!document.getElementById('_avTabStyle')) {
    var st = document.createElement('style');
    st.id = '_avTabStyle';
    st.textContent =
      '.av-tab{background:var(--card);border:1.5px solid var(--border2);border-radius:10px;padding:8px 14px;'+
      'font-size:0.72em;font-weight:800;color:var(--muted2);cursor:pointer;white-space:nowrap;'+
      'font-family:inherit;transition:all 0.15s}'+
      '.av-tab.active{background:var(--green);color:#000;border-color:var(--green)}';
    document.head.appendChild(st);
  }

  _avRenderGrid('icon');
  _avRefreshPreview();
}

function _buildAvatarPanel(xp) {
  return '<div style="padding:14px 14px 80px">' +

    // Podgląd + Zapisz
    '<div style="display:flex;align-items:center;gap:12px;background:var(--card2);border:1px solid var(--border2);border-radius:16px;padding:14px;margin-bottom:14px">' +
      '<div id="_avPrev" style="width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2em;flex-shrink:0;transition:all 0.3s">⚡</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:0.8em;font-weight:900;color:var(--text)">Podgląd avatara</div>' +
        '<div id="_avPrevName" style="font-size:0.7em;color:var(--muted);margin-top:2px">—</div>' +
        '<div style="font-size:0.62em;color:var(--green);margin-top:3px">⚡ ' + (typeof getStats === 'function' ? getStats(window._user||'').xp : 0) + ' XP</div>' +
      '</div>' +
      '<button onclick="_avSaveAndApply(this)" style="flex-shrink:0;background:var(--green);color:#000;border:none;border-radius:10px;padding:10px 14px;font-weight:900;font-size:0.78em;cursor:pointer">💾 Zapisz</button>' +
    '</div>' +

    // Taby
    '<div style="display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;padding-bottom:2px">' +
      '<button class="av-tab active" id="_avT_icon"  onclick="_avTab(\'icon\')">🎭 Ikony</button>' +
      '<button class="av-tab"        id="_avT_color" onclick="_avTab(\'color\')">🎨 Kolory</button>' +
      '<button class="av-tab"        id="_avT_frame" onclick="_avTab(\'frame\')">✨ Ramki</button>' +
      '<button class="av-tab"        id="_avT_title" onclick="_avTab(\'title\')">🏅 Tytuły</button>' +
    '</div>' +

    '<div id="_avPanel_icon"  style="display:block"></div>' +
    '<div id="_avPanel_color" style="display:none"></div>' +
    '<div id="_avPanel_frame" style="display:none"></div>' +
    '<div id="_avPanel_title" style="display:none"></div>' +
  '</div>';
}

function _avTab(type) {
  ['icon','color','frame','title'].forEach(function(t) {
    var p = document.getElementById('_avPanel_' + t);
    var b = document.getElementById('_avT_' + t);
    if (p) p.style.display = t === type ? 'block' : 'none';
    if (b) b.classList.toggle('active', t === type);
  });
  _avRenderGrid(type);
}

function _avPick(type, id) {
  if (!window._avSel) return;
  window._avSel[type] = id;
  _avRenderGrid(type);
  _avRefreshPreview();
}

function _avRefreshPreview() {
  var s   = window._avSel;
  if (!s) return;
  var ico = AV_ICONS.find(function(x){return x.id===s.icon;})  || AV_ICONS[0];
  var clr = AV_COLORS.find(function(x){return x.id===s.color;}) || AV_COLORS[0];
  var frm = AV_FRAMES.find(function(x){return x.id===s.frame;}) || AV_FRAMES[0];
  var ttl = AV_TITLES.find(function(x){return x.id===s.title;}) || AV_TITLES[0];
  var prev = document.getElementById('_avPrev');
  if (prev) {
    prev.textContent = ico.emoji;
    prev.style.background = clr.bg;
    prev.style.boxShadow  = (frm.css && frm.css !== 'none') ? frm.css : '';
  }
  var nm = document.getElementById('_avPrevName');
  if (nm) {
    nm.innerHTML = ico.name + ' · ' + clr.name +
      (ttl && ttl.label ? '<br><span style="font-size:0.85em;color:' + ttl.color + '">' + ttl.label + '</span>' : '');
  }
}

function _avSaveAndApply(btn) {
  var s = window._avSel;
  if (!s) return;
  saveAvatar(window._user, s.icon, s.color, s.frame);
  localStorage.setItem('4eco_av_title_' + (window._user || ''), s.title);
  applyAvatarToHeader();
  btn.textContent = '✓ Zapisano!';
  setTimeout(function() { btn.textContent = '💾 Zapisz'; }, 1800);
}

function _avRenderGrid(type) {
  var xp = getStats(window._user || '').xp;
  var sel = window._avSel ? window._avSel[type] : '';
  var container = document.getElementById('_avPanel_' + type);
  if (!container) return;

  var items, isCircle = false, isTitle = false;
  if      (type === 'icon')  { items = AV_ICONS; }
  else if (type === 'color') { items = AV_COLORS; isCircle = true; }
  else if (type === 'frame') { items = AV_FRAMES; isCircle = true; }
  else if (type === 'title') { items = AV_TITLES; isTitle = true; }

  var html = '';
  var tiers = ['common','rare','epic','legendary'];
  var grouped = {};
  tiers.forEach(function(t){ grouped[t] = []; });
  items.forEach(function(item){ (grouped[item.tier || 'common']).push(item); });

  tiers.forEach(function(tier) {
    var grp = grouped[tier];
    if (!grp.length) return;
    var tc = AV_TC[tier], tl = AV_TL[tier];
    html += '<div style="font-size:0.6em;font-weight:900;color:'+tc+';text-transform:uppercase;letter-spacing:1px;padding:8px 0 4px">' + tl + ' ' + tier.toUpperCase() + '</div>';

    if (isTitle) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">';
      grp.forEach(function(item) {
        var locked = xp < item.req;
        var isSel  = item.id === sel;
        html += '<div ' + (locked ? '' : 'onclick="_avPick(\'title\',\'' + item.id + '\')"') +
          ' style="border:' + (isSel ? '2px solid '+tc : '1.5px solid var(--border2)') + ';border-radius:20px;' +
          'padding:6px 12px;cursor:' + (locked ? 'not-allowed' : 'pointer') + ';' +
          'opacity:' + (locked ? '0.35' : '1') + ';background:' + (isSel ? 'rgba(0,0,0,0.25)' : 'var(--card)') + ';white-space:nowrap">' +
          '<div style="font-size:0.78em;font-weight:800;color:' + (isSel ? tc : 'var(--muted2)') + '">' + (item.label || '(brak)') + '</div>' +
          (item.req > 0 ? '<div style="font-size:0.55em;color:' + (locked ? 'var(--muted)' : 'var(--green)') + '">' + item.req + ' XP</div>' : '') +
          (locked ? ' 🔒' : '') +
          '</div>';
      });
      html += '</div>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(' + (isTitle?'80px':'70px') + ',1fr));gap:6px;margin-bottom:8px">';
      grp.forEach(function(item) {
        var locked = xp < item.req;
        var isSel  = item.id === sel;
        var onclick = locked ? '' : 'onclick="_avPick(\'' + type + '\',\'' + item.id + '\')"';
        html += '<div ' + onclick +
          ' style="border:' + (isSel ? '2px solid '+tc : '1.5px solid var(--border2)') + ';border-radius:12px;' +
          'padding:8px 4px;text-align:center;cursor:' + (locked ? 'not-allowed' : 'pointer') + ';' +
          'opacity:' + (locked ? '0.35' : '1') + ';background:' + (isSel ? 'rgba(0,0,0,0.2)' : 'var(--card)') + ';' +
          'transition:all 0.15s;position:relative">';
        if (isCircle) {
          var shadow = (type === 'frame') ? (item.css === 'none' ? 'none' : item.css) : (item.css || 'none');
          html += '<div style="width:32px;height:32px;border-radius:50%;background:' + (type==='color' ? item.bg : 'linear-gradient(135deg,#333,#555)') + ';margin:0 auto 4px;box-shadow:' + shadow + '"></div>';
        } else {
          html += '<div style="font-size:1.6em;line-height:1.2">' + item.emoji + '</div>';
        }
        html += '<div style="font-size:0.58em;font-weight:700;color:var(--text);line-height:1.2;margin-top:2px">' + item.name + '</div>';
        if (item.req > 0) html += '<div style="font-size:0.52em;color:' + (locked ? 'var(--muted)' : 'var(--green)') + '">' + item.req + ' XP</div>';
        if (locked) html += '<div style="position:absolute;top:4px;right:4px;font-size:0.65em">🔒</div>';
        if (isSel)  html += '<div style="position:absolute;top:4px;left:4px;font-size:0.65em;color:' + tc + '">✓</div>';
        html += '</div>';
      });
      html += '</div>';
    }
  });

  container.innerHTML = html;
}
