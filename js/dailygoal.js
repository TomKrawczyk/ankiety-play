// ============================================================
//  CEL DNIA  —  dzienny cel ankiet + seria dni z celem
//  Mechanika: pierścień postępu (jak Apple Watch / Duolingo).
//  - adaptacyjny cel (rośnie gdy ankieter regularnie go bije)
//  - bonus XP za domknięcie celu (raz dziennie)
//  - "Seria celów" = liczba kolejnych dni z domkniętym celem
//  Wszystko lokalne (localStorage), per-użytkownik. Nie blokuje
//  niczego — jeśli moduł nie wystartuje, reszta apki działa.
// ============================================================

var DG_DEFAULT_GOAL = 5;      // startowy cel dzienny
var DG_MIN_GOAL     = 3;      // nie schodzimy niżej
var DG_MAX_GOAL     = 12;     // sufit, żeby nie demotywować
var DG_BONUS_XP     = 80;     // bonus za domknięcie celu dnia
var DG_STREAK_STEP  = 10;     // dodatkowy XP za każdy dzień serii
var DG_STREAK_CAP   = 100;    // max bonusu z serii

function dgKey(name){ return '4eco_dg_' + (name||'').toLowerCase(); }
function dgTodayStr(){ return new Date().toLocaleDateString('pl-PL'); }

// Wczytaj stan Celu Dnia użytkownika (z migracją pól)
function dgLoad(name){
  var st;
  try { st = JSON.parse(localStorage.getItem(dgKey(name))) || {}; } catch(e){ st = {}; }
  if (typeof st.goal      !== 'number') st.goal = DG_DEFAULT_GOAL;
  if (typeof st.streak    !== 'number') st.streak = 0;     // dni z rzędu z domkniętym celem
  if (typeof st.bestStreak!== 'number') st.bestStreak = 0;
  if (typeof st.hitDays   !== 'number') st.hitDays = 0;    // łączna liczba dni z celem
  if (!st.lastHitDay) st.lastHitDay = '';                  // ostatni dzień z domkniętym celem
  if (!st.claimedDay)  st.claimedDay = '';                 // dzień z przyznanym bonusem (anty-dubel)
  if (!Array.isArray(st.recent)) st.recent = [];           // ostatnie wyniki dzienne {d, c}
  return st;
}
function dgSave(name, st){
  try { localStorage.setItem(dgKey(name), JSON.stringify(st)); } catch(e){}
}

// Ile ankiet zrobiono DZIŚ (z licznika dziennego gamification)
function dgTodayCount(name){
  var k = normKey(name), today = dgTodayStr();
  try {
    var td = JSON.parse(localStorage.getItem('4eco_td_'+k)) || {};
    return td.d === today ? (td.c||0) : 0;
  } catch(e){ return 0; }
}

// Czy "wczoraj" względem podanej daty pl-PL (DD.MM.YYYY)
function dgIsYesterday(ds){
  if(!ds) return false;
  var y = new Date(); y.setDate(y.getDate()-1);
  return y.toLocaleDateString('pl-PL') === ds;
}

// Adaptacja celu: mediana ostatnich aktywnych dni.
// Regularnie z zapasem → +1. Ledwo dobija → -1 (nigdy < DG_MIN_GOAL).
function dgRecalcGoal(st){
  var vals = (st.recent||[]).map(function(r){ return r.c||0; }).filter(function(c){ return c>0; });
  if (vals.length < 3) return st.goal; // za mało danych
  vals.sort(function(a,b){return a-b;});
  var mid = vals[Math.floor(vals.length/2)];
  var goal = st.goal;
  if (mid >= st.goal + 2)      goal = st.goal + 1;
  else if (mid <= st.goal - 2) goal = st.goal - 1;
  return Math.max(DG_MIN_GOAL, Math.min(DG_MAX_GOAL, goal));
}

// Wołane PO każdej zapisanej ankiecie (z afterSave).
// Zwraca obiekt zdarzenia, jeśli WŁAŚNIE domknięto cel (do animacji).
function dgOnSurvey(name){
  if(!name) return null;
  var st = dgLoad(name), today = dgTodayStr();
  var count = dgTodayCount(name);

  // Zapis dziennego wyniku do "recent" (max 7, unikalne dni)
  var ex = st.recent.filter(function(r){ return r.d === today; })[0];
  if (ex) ex.c = count; else st.recent.push({d:today, c:count});
  if (st.recent.length > 7) st.recent = st.recent.slice(-7);

  var justHit = false;
  if (count >= st.goal && st.claimedDay !== today) {
    st.claimedDay = today;
    st.hitDays = (st.hitDays||0) + 1;
    if (dgIsYesterday(st.lastHitDay)) st.streak = (st.streak||0) + 1;
    else st.streak = 1;
    st.lastHitDay = today;
    if (st.streak > (st.bestStreak||0)) st.bestStreak = st.streak;
    justHit = true;
    st.goal = dgRecalcGoal(st); // adaptacja na kolejne dni
  }
  dgSave(name, st);

  if (justHit) {
    var streakBonus = Math.min(DG_STREAK_CAP, (st.streak-1) * DG_STREAK_STEP);
    return { hit:true, goal:st.goal, streak:st.streak, bonus:DG_BONUS_XP, streakBonus:streakBonus, total:DG_BONUS_XP+streakBonus };
  }
  return { hit:false, goal:st.goal, count:count };
}

// Render pierścienia Celu Dnia (SVG donut) do #dgWrap
function dgRender(name){
  var host = document.getElementById('dgWrap');
  if(!host) return;
  if(!name){ host.style.display='none'; return; }
  host.style.display = 'block';

  var st = dgLoad(name);
  var count = dgTodayCount(name);
  var goal = st.goal || DG_DEFAULT_GOAL;
  var pct = Math.max(0, Math.min(100, Math.round(count/goal*100)));
  var done = count >= goal;

  var R = 26, C = 2*Math.PI*R;
  var off = C * (1 - pct/100);
  var col = done ? 'var(--green,#10d873)' : '#fbbf24';

  var streakTxt = (st.streak||0) > 0
    ? '🎯 <b>'+st.streak+'</b> dni z rzędu z celem'+( (st.bestStreak||0)>(st.streak||0) ? ' · rekord '+st.bestStreak : '')
    : 'Domknij cel, by zacząć serię 🎯';

  var head = done
    ? '<span style="color:var(--green,#10d873);font-weight:900">✅ Cel dnia zaliczony!</span>'
    : '<span style="font-weight:800">Cel dnia: '+count+'/'+goal+' ankiet</span>';

  var sub = done
    ? 'Świetna robota — każda kolejna ankieta to czysty zysk 💪'
    : (goal-count===1 ? '<b>Jeszcze tylko 1</b> i masz dzień zaliczony!' : 'Jeszcze <b>'+(goal-count)+'</b> do celu');

  host.innerHTML =
    '<div class="dg-card'+(done?' dg-done':'')+'">' +
      '<div class="dg-ring">' +
        '<svg width="64" height="64" viewBox="0 0 64 64">' +
          '<circle cx="32" cy="32" r="'+R+'" fill="none" stroke="rgba(148,163,184,0.35)" stroke-width="7"/>' +
          '<circle cx="32" cy="32" r="'+R+'" fill="none" stroke="'+col+'" stroke-width="7" stroke-linecap="round" ' +
            'stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 32 32)" ' +
            'style="transition:stroke-dashoffset .6s ease"/>' +
        '</svg>' +
        '<div class="dg-ring-num">'+(done?'🎯':count)+'</div>' +
      '</div>' +
      '<div class="dg-info">' +
        '<div class="dg-head">'+head+'</div>' +
        '<div class="dg-sub">'+sub+'</div>' +
        '<div class="dg-streak">'+streakTxt+'</div>' +
      '</div>' +
    '</div>';
}

// Animacja + bonus przy domknięciu celu (wołane z afterSave)
function dgCelebrate(ev){
  if(!ev || !ev.hit) return;
  try {
    if (typeof confettiBlast === 'function') confettiBlast();
    if (typeof showToast === 'function')
      showToast('🎯 CEL DNIA DOMKNIĘTY! +'+ev.total+' XP (seria '+ev.streak+' dni)');
    if (typeof floatXP === 'function') {
      setTimeout(function(){ floatXP('🎯 CEL DNIA +'+ev.bonus+' XP'); }, 300);
      if (ev.streakBonus>0) setTimeout(function(){ floatXP('🔥 Seria +'+ev.streakBonus+' XP'); }, 800);
    }
    if (window._user && typeof addBonusXP === 'function') addBonusXP(window._user, ev.total);
    else if (window._user && typeof addXP === 'function') addXP(window._user, ev.total, false);
  } catch(e){}
}
