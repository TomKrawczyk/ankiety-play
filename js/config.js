// ============================================================
// CONFIG — stałe, poziomy, osiągnięcia
// ============================================================
var WEBHOOK = "https://script.google.com/macros/s/AKfycbzZGgo_HjGyuP_o7KpyUWtdPUuHBwrjujpTcpH3Igg58L7wKSkrWqwB_4btcPxphoFL/exec";

// ============================================================
// BEZPIECZENSTWO — token aplikacji + PIN wiazany z kontem (TOFU)
// Webhook Apps Script jest publiczny (widoczny w tym pliku), wiec token
// SAM nie chroni przed kims kto czyta zrodlo strony — ale odciecie surowego
// URL od skanerow/botow + wymaganie PIN-u dopasowanego do konta (patrz .gs
// backend, funkcja _verifyPin z blokada po 5 nieudanych probach/15min)
// realnie zamyka mozliwosc podglaszania GPS/leadow bez znajomosci PIN-u.
// ============================================================
var APP_TOKEN = "mA8RyfmMN82IosMeK4OgRhR27J9z7QAJ";

function _currentPin(){
  try{
    var u = getUsers()[normKey(window._user||'')];
    return u ? (u.pin||'') : '';
  }catch(e){ return ''; }
}
// Doklej do query stringa GET (bez wiodacego ? ani &)
function authQS(){
  return 'token=' + encodeURIComponent(APP_TOKEN) + '&pin=' + encodeURIComponent(_currentPin());
}
// Wstaw token+pin do obiektu wysylanego w POST body
function authBody(obj){
  obj = obj || {};
  obj.token = APP_TOKEN;
  obj.pin = _currentPin();
  return obj;
}

var LEVELS = [
  {min:0,    name:"Rookie",     icon:"🌱"},
  {min:100,  name:"Prospector", icon:"⛏️"},
  {min:300,  name:"Hunter",     icon:"🎯"},
  {min:600,  name:"Closer",     icon:"🔥"},
  {min:1000, name:"Elite",      icon:"⚡"},
  {min:1800, name:"Legend",     icon:"👑"},
  {min:3000, name:"GOD MODE",   icon:"🌟"}
];

// ============================================================
// SEZON (miesięczny cykl) + helpery dat
// ============================================================
// Sezon = bieżący miesiąc kalendarzowy. Auto-rytm bez ręcznej konfiguracji.
function getSeasonInfo() {
  var now = new Date();
  var months = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  var y = now.getFullYear(), m = now.getMonth();
  var firstNext = new Date(y, m+1, 1);
  var msLeft = firstNext - now;
  var daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
  var totalDays = new Date(y, m+1, 0).getDate();
  var dayOfMonth = now.getDate();
  return {
    id: y + '-' + (m+1),
    name: months[m] + ' ' + y,
    daysLeft: daysLeft,
    totalDays: totalDays,
    progress: Math.min(100, Math.round(dayOfMonth / totalDays * 100))
  };
}

// Klucz tygodnia ISO (rok + numer tygodnia) — reset co poniedziałek
function getWeekKey(d) {
  d = d ? new Date(d) : new Date();
  var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  var day = t.getUTCDay() || 7;           // pon=1..niedz=7
  t.setUTCDate(t.getUTCDate() + 4 - day); // czwartek bieżącego tygodnia
  var yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  var week = Math.ceil((((t - yStart) / 86400000) + 1) / 7);
  return t.getUTCFullYear() + '-W' + (week < 10 ? '0' + week : week);
}

// Ile dni do końca tygodnia (do niedzieli 23:59)
function getDaysToWeekEnd() {
  var now = new Date();
  var day = now.getDay() || 7; // pon=1..niedz=7
  return 7 - day + 1;          // pon=7 ... niedz=1
}

// Definicje tygodniowych wyzwań. progKey = pole z weekly stats.
var WEEKLY_CHALLENGES = [
  {id:'w_surveys', icon:'📋', name:'10 ankiet w tygodniu', goal:10, progKey:'surveys', xp:200},
  {id:'w_hot',     icon:'🔥', name:'3 Gorące leady',       goal:3,  progKey:'hot',     xp:250},
  {id:'w_days',    icon:'📅', name:'Aktywny 4 dni',        goal:4,  progKey:'days',    xp:300},
  {id:'w_sprint',  icon:'⚡', name:'Dzień: 5 ankiet',      goal:5,  progKey:'bestDay', xp:180},
  {id:'w_grind',   icon:'💪', name:'25 ankiet w tygodniu', goal:25, progKey:'surveys', xp:500}
];

var ACHS = [
  {id:"first",   icon:"🎉", name:"Pierwsze kroki",     xp:25,   check:function(s){return s.total>=1;}},
  {id:"speed3",  icon:"⚡", name:"3 ankiety dziś",     xp:50,   check:function(s){return s.today>=3;}},
  {id:"streak3", icon:"🔗", name:"3 dni z rzędu",      xp:75,   check:function(s){return s.streak>=3;}},
  {id:"hot1",    icon:"🌶️", name:"Pierwszy Gorący lead",xp:60,  check:function(s){return s.hot>=1;}},
  {id:"hot5",    icon:"🔥", name:"5x Gorący lead",     xp:100,  check:function(s){return s.hot>=5;}},
  {id:"ten",     icon:"💎", name:"10 ankiet total",    xp:150,  check:function(s){return s.total>=10;}},
  {id:"daily5",  icon:"🚀", name:"5 ankiet w 1 dzień", xp:120,  check:function(s){return s.today>=5;}},
  {id:"streak7", icon:"📅", name:"Tydzień z rzędu",    xp:200,  check:function(s){return s.streak>=7;}},
  {id:"twenty",  icon:"🏆", name:"20 ankiet total",    xp:300,  check:function(s){return s.total>=20;}},
  {id:"hot10",   icon:"🌋", name:"10x Gorący lead",    xp:250,  check:function(s){return s.hot>=10;}},
  {id:"daily10", icon:"💥", name:"10 ankiet w 1 dzień",xp:300,  check:function(s){return s.today>=10;}},
  {id:"fifty",   icon:"👑", name:"50 ankiet total",    xp:500,  check:function(s){return s.total>=50;}},
  {id:"streak14",icon:"🗓️", name:"14 dni z rzędu",     xp:400,  check:function(s){return s.streak>=14;}},
  {id:"hot25",   icon:"☄️", name:"25x Gorący lead",    xp:500,  check:function(s){return s.hot>=25;}},
  {id:"hundred", icon:"🎖️", name:"100 ankiet total",   xp:1000, check:function(s){return s.total>=100;}},
  {id:"streak30",icon:"🔱", name:"30 dni z rzędu",     xp:1000, check:function(s){return s.streak>=30;}},
  {id:"hot50",   icon:"🌟", name:"50x Gorący lead",    xp:1000, check:function(s){return s.hot>=50;}},
  {id:"machine", icon:"🤖", name:"250 ankiet total",   xp:2000, check:function(s){return s.total>=250;}},
  {id:"legend500",icon:"♾️", name:"500 ankiet total",  xp:4000, check:function(s){return s.total>=500;}}
];
