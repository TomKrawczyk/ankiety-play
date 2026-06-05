// ======================================================
// HISTORY (localStorage)
// ======================================================
var HIST_KEY = '4eco_hist_';

function saveToHistory(data) {
  var k = HIST_KEY + (window._user||'anon').toLowerCase();
  var hist = [];
  try { hist = JSON.parse(localStorage.getItem(k)) || []; } catch(e) {}
  data._saved = new Date().toLocaleString('pl-PL');
  hist.unshift(data);
  if(hist.length > 100) hist = hist.slice(0,100);
  localStorage.setItem(k, JSON.stringify(hist));
}

function getHistory() {
  var k = HIST_KEY + (window._user||'anon').toLowerCase();
  try { return JSON.parse(localStorage.getItem(k)) || []; } catch(e) { return []; }
}

function clearHistory() {
  if(!confirm('Usunąć całą historię?')) return;
  var k = HIST_KEY + (window._user||'anon').toLowerCase();
  localStorage.removeItem(k);
  renderHistory();
}

function renderHistory() {
  var hist = getHistory();
  var el = document.getElementById('historyList');
  if(!el) return;
  if(hist.length === 0) {
    el.innerHTML = '<div class="hempty">📭 Brak zapisanych ankiet<br><span style="font-size:0.85em">Zapisane ankiety pojawią się tutaj</span></div>';
    return;
  }
  var tempCol = {Zimny:'#60a5fa',Letni:'#fbbf24',Ciepły:'#fb923c',Gorący:'#10d873'};
  var tempEm  = {Zimny:'🔵',Letni:'🟡',Ciepły:'🟠',Gorący:'🔥'};
  var html = '<div style="font-size:0.72em;color:var(--muted);margin-bottom:10px">'+hist.length+' zapisanych ankiet</div>';
  hist.forEach(function(h, i) {
    var tc = tempCol[h.temp_leada] || '#aaa';
    var te = tempEm[h.temp_leada] || '';
    html += '<div class="hitem">';
    html += '<div class="hitem-top"><div class="hitem-name">'+(h.imie||'Brak nazwy')+'</div><div class="hitem-date">'+h._saved+'</div></div>';
    html += '<div class="hitem-grid">';
    html += '<div class="hitem-cell"><div class="hl">Telefon</div><div class="hv">'+(h.telefon||'—')+'</div></div>';
    html += '<div class="hitem-cell"><div class="hl">Miejscowość</div><div class="hv">'+(h.miejscowosc||'—')+'</div></div>';
    html += '<div class="hitem-cell"><div class="hl">Kod pocztowy</div><div class="hv">'+(h.kod_pocztowy||'—')+'</div></div>';
    html += '<div class="hitem-cell"><div class="hl">Typ</div><div class="hv">'+(h.typ_ankiety||'—')+'</div></div>';
    if(h.ma_pv) html += '<div class="hitem-cell"><div class="hl">PV</div><div class="hv">'+h.ma_pv+'</div></div>';
    if(h.zrodlo_ciepla) html += '<div class="hitem-cell"><div class="hl">Ogrzewanie</div><div class="hv">'+h.zrodlo_ciepla+'</div></div>';
    if(h.rachunek_prad) html += '<div class="hitem-cell"><div class="hl">Rachunek</div><div class="hv">'+h.rachunek_prad+'</div></div>';
    if(h.interesy) html += '<div class="hitem-cell" style="grid-column:1/-1"><div class="hl">Zainteresowania</div><div class="hv">'+h.interesy+'</div></div>';
    if(h.uwagi) html += '<div class="hitem-cell" style="grid-column:1/-1"><div class="hl">Uwagi</div><div class="hv">'+h.uwagi+'</div></div>';
    html += '</div>';
    if(h.temp_leada) html += '<div class="hitem-temp" style="color:'+tc+';border:1px solid '+tc+';background:'+tc+'22">'+te+' '+h.temp_leada+'</div>';
    html += '</div>';
  });
  el.innerHTML = html;
}

// Nadpisz switchMode zeby renderowal history
// UWAGA: switchMode jest w gamification.js ktory laduje sie PO history.js,
// dlatego override odraczamy do DOMContentLoaded (inaczej ReferenceError psuje caly plik).
window.addEventListener('DOMContentLoaded', function() {
  if (typeof switchMode === 'function') {
    var _origSwitchMode = switchMode;
    switchMode = function(mode) {
      _origSwitchMode(mode);
      if (mode === 'history') renderHistory();
    };
  }
});


// ============================================================
// COMBO MULTIPLIER SYSTEM
// 5 min okno — każda ankieta zwiększa mnożnik
// Brak ankiety przez 5 min → reset do ×1.00
// ×1.00 → ×1.25 → ×1.50 → ×1.75 → ×2.00 (max)
// ============================================================
var COMBO_WINDOW   = 5 * 60;   // 5 minut w sekundach
var COMBO_STEPS    = [1.00, 1.25, 1.50, 1.75, 2.00];
var COMBO_CLASSES  = ['x1',  'x125', 'x150', 'x175', 'x200'];
var COMBO_KEY      = '4eco_combo';

var _comboTick  = null;   // setInterval timer
var _comboSec   = COMBO_WINDOW; // pozostały czas w sekundach

function loadCombo() {
  try {
    var raw = localStorage.getItem(COMBO_KEY);
    if (!raw) return { step: 0, ts: 0 };
    return JSON.parse(raw);
  } catch(e) { return { step: 0, ts: 0 }; }
}

function saveCombo(step) {
  localStorage.setItem(COMBO_KEY, JSON.stringify({ step: step, ts: Date.now() }));
}

function getCurrentStep() {
  var d = loadCombo();
  var elapsed = (Date.now() - d.ts) / 1000;
  if (elapsed >= COMBO_WINDOW) return 0;          // wygasł
  return Math.min(d.step, COMBO_STEPS.length - 1);
}

function getMultiplier() {
  return COMBO_STEPS[getCurrentStep()];
}

// Wywołaj po zapisaniu ankiety — zwiększa combo
function comboHit() {
  var d = loadCombo();
  var elapsed = (Date.now() - d.ts) / 1000;
  var curStep = (elapsed >= COMBO_WINDOW) ? 0 : Math.min(d.step, COMBO_STEPS.length - 1);
  var newStep = Math.min(curStep + 1, COMBO_STEPS.length - 1);
  saveCombo(newStep);
  renderComboBar(newStep, COMBO_WINDOW);
  // Popup
  if (newStep > 0) {
    var mult = COMBO_STEPS[newStep];
    showComboPopup('⚡ COMBO ×' + mult.toFixed(2) + '!');
  }
  startComboTick();
}

function showComboPopup(txt) {
  var el = document.createElement('div');
  el.className = 'combo-popup';
  el.textContent = txt;
  document.body.appendChild(el);
  setTimeout(function() { try { document.body.removeChild(el); } catch(e){} }, 1700);
}

function renderComboBar(step, secLeft) {
  var bar = document.getElementById('comboBar');
  if (!bar) return;
  var mult = COMBO_STEPS[step];
  var cls  = COMBO_CLASSES[step];

  bar.style.display = 'flex';

  var val  = document.getElementById('comboVal');
  var fill = document.getElementById('comboFill');
  var tmr  = document.getElementById('comboTimer');

  if (val)  { val.textContent = '×' + mult.toFixed(2); val.className = 'combo-value ' + cls; }
  if (fill) { 
    var pct = Math.max(0, Math.min(100, (secLeft / COMBO_WINDOW) * 100));
    fill.style.width = pct + '%';
    fill.className = 'combo-fill ' + cls;
  }
  if (tmr) {
    var m = Math.floor(secLeft / 60);
    var s = Math.floor(secLeft % 60);
    tmr.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    // Miganie gdy < 60s
    tmr.style.color = secLeft < 60 ? (Math.floor(secLeft) % 2 === 0 ? '#f87171' : '#555') : '#888';
  }
}

function startComboTick() {
  if (_comboTick) clearInterval(_comboTick);
  var d = loadCombo();
  _comboTick = setInterval(function() {
    var elapsed = (Date.now() - d.ts) / 1000;
    var secLeft = Math.max(0, COMBO_WINDOW - elapsed);
    var step    = getCurrentStep();
    renderComboBar(step, secLeft);
    if (secLeft <= 0) {
      clearInterval(_comboTick);
      _comboTick = null;
      saveCombo(0);
      renderComboBar(0, 0);
      showToast('⏱️ Combo wygasło — mnożnik ×1.00');
    }
  }, 1000);
}

// Init przy starcie — jeśli jest aktywne combo, wznów odliczanie
function initCombo() {
  var d = loadCombo();
  var elapsed = (Date.now() - d.ts) / 1000;
  if (d.step > 0 && elapsed < COMBO_WINDOW) {
    renderComboBar(d.step, COMBO_WINDOW - elapsed);
    startComboTick();
  }
}


