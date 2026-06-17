// ======================================================
// FLOW DEFINITIONS
// ======================================================

// --- QUICK PV ---
var FLOW_QPV = [
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie z ustawień — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"pv_status", type:"choice", title:"Czy ma już panele słoneczne?", choices:[
    {icon:"✅",text:"Tak, działają"},
    {icon:"⚠️",text:"Tak, ale coś nie działa"},
    {icon:"🔜",text:"Planuje w tym roku"},
    {icon:"❌",text:"Nie ma paneli"}
  ]},
  {id:"rachunek", type:"choice", title:"Miesięczny rachunek za prąd?", choices:[
    {icon:"💸",text:"Ponad 500 zł"},
    {icon:"💰",text:"300–500 zł"},
    {icon:"💵",text:"150–300 zł"},
    {icon:"🪙",text:"Poniżej 150 zł"}
  ]},
  {id:"bol", type:"choice", title:"Jak klient mówi o rachunkach?", choices:[
    {icon:"📈",text:"Rosną i jest tym zdenerwowany"},
    {icon:"🤷",text:"Nie rozumie za co płaci"},
    {icon:"😴",text:"Nie śledzi — płaci i tyle"},
    {icon:"👍",text:"Jest zadowolony"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. pyta o dotacje, jest zainteresowany magazynem..."}
];

// --- QUICK HEAT ---
var FLOW_QHEAT = [
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"ogrzew", type:"choice", title:"Czym ogrzewa dom?", choices:[
    {icon:"🪨",text:"Węgiel / ekogroszek"},
    {icon:"🔵",text:"Gaz ziemny"},
    {icon:"⚡",text:"Prąd / bojler"},
    {icon:"🌡️",text:"Ma już pompę ciepła"},
    {icon:"🪵",text:"Drewno / inne"}
  ]},
  {id:"koszt", type:"choice", title:"Roczny koszt ogrzewania?", choices:[
    {icon:"🥵",text:"Ponad 10 000 zł"},
    {icon:"😰",text:"6 000–10 000 zł"},
    {icon:"😐",text:"3 000–6 000 zł"},
    {icon:"😊",text:"Poniżej 3 000 zł"}
  ]},
  {id:"wiek_budynku", type:"choice", title:"Wiek budynku?", choices:[
    {icon:"🏚️",text:"Stary — przed 1990"},
    {icon:"🏠",text:"1990–2005"},
    {icon:"🏡",text:"2005–2015"},
    {icon:"🏗️",text:"Nowy — po 2015"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. żona decyduje, pyta o dotacje..."}
];

// --- QUICK NEW ---
var FLOW_QNEW = [
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"typ", type:"choice", title:"Typ nieruchomości?", choices:[
    {icon:"🏠",text:"Dom jednorodzinny"},
    {icon:"🌾",text:"Gospodarstwo rolne"},
    {icon:"🏢",text:"Firma / lokal"},
    {icon:"🏘️",text:"Inne"}
  ]},
  {id:"rachunki_ogol", type:"emoji", title:"Rachunki za energię — jak klient to ocenia?", opts:[
    {emoji:"😌",label:"Spokojnie"},
    {emoji:"😐",label:"Średnio"},
    {emoji:"😟",label:"Drogo"},
    {emoji:"😡",label:"Horror"}
  ]},
  {id:"int", type:"multi", title:"Co klienta interesuje? (można zaznaczyć kilka)", choices:[
    {icon:"☀️",text:"Panele słoneczne"},
    {icon:"🌡️",text:"Pompa ciepła"},
    {icon:"🔋",text:"Magazyn energii"},
    {icon:"🏠",text:"Ocieplenie domu"},
    {icon:"❄️",text:"Klimatyzacja"}
  ]},
  {id:"decyzja", type:"choice", title:"Kiedy klient planuje decyzję?", choices:[
    {icon:"🚀",text:"Jak najszybciej"},
    {icon:"📅",text:"W ciągu pół roku"},
    {icon:"🕐",text:"Za rok lub dłużej"},
    {icon:"🤔",text:"Jeszcze nie wie"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki", hint:"Opcjonalne", placeholder:"np. oboje domownicy zainteresowani, pyta o dofinansowanie..."}
];

// --- FULL SURVEY ---
var FLOW_FULL = [
  {id:"imie", type:"text", title:"Imię i nazwisko", hint:"Wymagane", placeholder:"np. Jan Kowalski", req:true},
  {id:"tel", type:"text", title:"Numer telefonu", hint:"Obowiązkowe", placeholder:"600 000 000", req:true},
  {id:"kod", type:"text", title:"Kod pocztowy", hint:"Uzupełniony automatycznie — zmień jeśli inny", placeholder:"np. 62-600", req:true, autofill:"location_kod"},
  {id:"msc", type:"text", title:"Miejscowość", hint:"Uzupełniona automatycznie — zmień jeśli inna", placeholder:"np. Kłodawa", req:true, autofill:"location_msc"},
  {id:"typ", type:"choice", title:"Typ nieruchomości?", choices:[
    {icon:"🏠",text:"Dom jednorodzinny"},
    {icon:"🌾",text:"Gospodarstwo rolne"},
    {icon:"🏢",text:"Firma / lokal"},
    {icon:"🏘️",text:"Inne"}
  ]},
  {id:"pv", type:"choice", title:"Czy ma panele fotowoltaiczne?", choices:[
    {icon:"✅",text:"Tak, działają dobrze"},
    {icon:"⚠️",text:"Tak, ale ma problemy"},
    {icon:"🔜",text:"Planuje instalację"},
    {icon:"❌",text:"Nie ma paneli"}
  ]},
  {id:"rachunek", type:"choice", title:"Miesięczny rachunek za prąd?", choices:[
    {icon:"💸",text:"Ponad 500 zł"},
    {icon:"💰",text:"300–500 zł"},
    {icon:"💵",text:"150–300 zł"},
    {icon:"🪙",text:"Poniżej 150 zł"}
  ]},
  {id:"ogrzew", type:"choice", title:"Czym ogrzewa dom?", choices:[
    {icon:"🪨",text:"Węgiel / ekogroszek"},
    {icon:"🔵",text:"Gaz"},
    {icon:"⚡",text:"Prąd / bojler"},
    {icon:"🌡️",text:"Pompa ciepła"},
    {icon:"🪵",text:"Drewno / inne"}
  ]},
  {id:"koszt_ogrzew", type:"choice", title:"Roczny koszt ogrzewania?", choices:[
    {icon:"🥵",text:"Ponad 10 000 zł"},
    {icon:"😰",text:"6 000–10 000 zł"},
    {icon:"😐",text:"3 000–6 000 zł"},
    {icon:"😊",text:"Poniżej 3 000 zł"}
  ]},
  {id:"int", type:"multi", title:"Co klienta interesuje? (można zaznaczyć kilka)", choices:[
    {icon:"☀️",text:"Panele słoneczne"},
    {icon:"🌡️",text:"Pompa ciepła"},
    {icon:"🔋",text:"Magazyn energii"},
    {icon:"🏠",text:"Ocieplenie domu"},
    {icon:"❄️",text:"Klimatyzacja"}
  ]},
  {id:"motyw", type:"emoji", title:"Główna motywacja klienta?", opts:[
    {emoji:"💰",label:"Oszczędności"},
    {emoji:"🔌",label:"Niezależność"},
    {emoji:"🌿",label:"Ekologia"},
    {emoji:"📋",label:"Dotacje"}
  ]},
  {id:"decyzja", type:"choice", title:"Kiedy klient planuje decyzję?", choices:[
    {icon:"🚀",text:"Jak najszybciej"},
    {icon:"📅",text:"W ciągu pół roku"},
    {icon:"🕐",text:"Za rok lub dłużej"},
    {icon:"🤔",text:"Jeszcze nie wie"}
  ]},
  {id:"temp", type:"temp", title:"Jak oceniasz zainteresowanie klienta?"},
  {id:"uwagi", type:"textarea", title:"Notatki z rozmowy", hint:"Opcjonalne", placeholder:"Obiekcje, pytania, zainteresowania..."}
];

// ======================================================
// FLOW ENGINE
// ======================================================
var flows = {};

function buildFlow(containerId, questions, sheetName, color, xpAmount) {
  var container = document.getElementById(containerId);
  var answers = {};
  // Autofill pól lokalizacyjnych z zapisanej lokalizacji
  questions.forEach(function(q) {
    if(q.autofill) {
      var saved = localStorage.getItem('4eco_loc_' + q.autofill);
      if(saved) answers[q.id] = saved;
    }
  });
  var state = { current: 0, answers: answers, questions: questions, sheetName: sheetName, color: color||'', xpAmount: xpAmount||50 };
  flows[containerId] = state;
  renderQ(containerId);
}

function renderQ(fid) {
  var s = flows[fid];
  var container = document.getElementById(fid);
  var q = s.questions[s.current];
  var total = s.questions.length;
  var pct = Math.round((s.current / total) * 100);
  var isLast = s.current === total - 1;

  var html = '<div class="qflow-header"><div class="qflow-prog-wrap"><div class="qflow-prog" style="width:'+pct+'%"></div></div><div class="qflow-count">'+(s.current+1)+'/'+total+'</div></div>';
  html += '<div class="qslide active"><div class="qcard '+(s.color||'')+'">';
  html += '<div class="qnum">Pytanie '+(s.current+1)+'</div>';
  html += '<div class="qtitle">'+q.title+'</div>';
  if(q.hint) html += '<div class="qhint">'+q.hint+'</div>';

  var savedVal = s.answers[q.id];

  if(q.type==='text') {
    html += '<input class="q-input" id="qi_'+fid+'" type="'+(q.id==='tel'?'tel':'text')+'" placeholder="'+(q.placeholder||'')+'" value="'+(savedVal||'')+'" inputmode="'+(q.id==='tel'?'tel':'text')+'">';
  } else if(q.type==='textarea') {
    html += '<textarea class="q-input" id="qi_'+fid+'" rows="3" placeholder="'+(q.placeholder||'')+'" style="resize:none">'+(savedVal||'')+'</textarea>';
  } else if(q.type==='choice') {
    html += '<div class="choices">';
    q.choices.forEach(function(c,i){
      var sel = savedVal===c.text?' selected':'';
      html += '<button class="choice'+sel+'" onclick="selectChoice(\''+fid+'\',\''+c.text.replace(/'/g,'\\\'')+'\')" >';
      html += '<span class="choice-icon">'+c.icon+'</span><span class="choice-text">'+c.text+'</span>';
      html += '<span class="choice-check">'+(sel?' ✓':'')+'</span></button>';
    });
    html += '</div>';
  } else if(q.type==='multi') {
    var savedArr = savedVal || [];
    html += '<div class="choices multi">';
    q.choices.forEach(function(c){
      var sel = savedArr.indexOf(c.text)>-1?' selected':'';
      html += '<button class="choice'+sel+'" onclick="toggleMulti(\''+fid+'\',\''+c.text.replace(/'/g,'\\\'')+'\')">';
      html += '<span class="choice-icon">'+c.icon+'</span><span class="choice-text">'+c.text+'</span>';
      html += '<span class="choice-check">'+(sel?' ✓':'')+'</span></button>';
    });
    html += '</div>';
  } else if(q.type==='emoji') {
    html += '<div class="emoji-scale">';
    q.opts.forEach(function(o){
      var sel = savedVal===o.label?' selected':'';
      html += '<button class="es-btn'+sel+'" onclick="selectEmoji(\''+fid+'\',\''+o.label+'\')"><span class="es-emoji">'+o.emoji+'</span><span class="es-label">'+o.label+'</span></button>';
    });
    html += '</div>';
  } else if(q.type==='temp') {
    html += '<div class="temp-sel">';
    [{v:'Zimny',icon:'🔵',desc:'Mało zainteresowany'},{v:'Letni',icon:'🟡',desc:'Słucha, zastanawia się'},{v:'Ciepły',icon:'🟠',desc:'Wyraźnie zainteresowany'},{v:'Gorący',icon:'🔥',desc:'Chce spotkania!'}].forEach(function(t){
      var sel = savedVal===t.v?' sel':'';
      html += '<button class="ts-btn'+sel+'" data-v="'+t.v+'" onclick="selectTemp2(\''+fid+'\',\''+t.v+'\')">';
      html += '<span class="ts-icon">'+t.icon+'</span><span class="ts-label">'+t.v+'</span><span class="ts-desc">'+t.desc+'</span></button>';
    });
    html += '</div>';
  }

  // Nav
  html += '<div class="qnav">';
  if(s.current > 0) html += '<button class="btn-back" onclick="prevQ(\''+fid+'\')">← Wróć</button>';
  if(isLast) {
    html += '<button class="btn-submit '+(s.color||'')+'" onclick="submitFlow(\''+fid+'\')">✅ Zapisz +'+s.xpAmount+' XP</button>';
  } else {
    html += '<button class="btn-next '+(s.color||'')+'" onclick="nextQ(\''+fid+'\')">Dalej →</button>';
  }
  html += '</div>';

  html += '</div></div>';
  container.innerHTML = html;
  // Focus input + przewiń pole nad klawiaturę (mobile)
  setTimeout(function(){
    var inp=document.getElementById('qi_'+fid);
    if(inp){
      inp.focus();
      // po pojawieniu się klawiatury przewiń pole do widoku
      setTimeout(function(){ scrollFieldIntoView(inp); }, 350);
    }
  },300);
}

// Przewija aktywne pole tak, by było widoczne nad klawiaturą
function scrollFieldIntoView(el){
  if(!el) return;
  try {
    el.scrollIntoView({block:'center', behavior:'smooth'});
  } catch(e){
    el.scrollIntoView();
  }
}

function selectChoice(fid, val) {
  flows[fid].answers[flows[fid].questions[flows[fid].current].id] = val;
  renderQ(fid);
  setTimeout(function(){ nextQ(fid); }, 220);
}

function toggleMulti(fid, val) {
  var q = flows[fid].questions[flows[fid].current];
  var arr = flows[fid].answers[q.id] || [];
  var idx = arr.indexOf(val);
  if(idx>-1) arr.splice(idx,1); else arr.push(val);
  flows[fid].answers[q.id] = arr;
  renderQ(fid);
}

function selectEmoji(fid, val) {
  flows[fid].answers[flows[fid].questions[flows[fid].current].id] = val;
  renderQ(fid);
  setTimeout(function(){ nextQ(fid); }, 220);
}

function selectTemp2(fid, val) {
  flows[fid].answers[flows[fid].questions[flows[fid].current].id] = val;
  renderQ(fid);
}

function nextQ(fid) {
  var s = flows[fid];
  var q = s.questions[s.current];
  // Save text/textarea
  var inp = document.getElementById('qi_'+fid);
  if(inp) s.answers[q.id] = inp.value;
  // Validate required
  if(q.req) {
    var val = s.answers[q.id];
    if(!val||val.toString().trim()===''){
      var inpEl = document.getElementById('qi_'+fid);
      if(inpEl){ inpEl.style.borderColor='var(--red)'; inpEl.focus(); }
      showToast('⚠️ To pole jest wymagane!');
      return;
    }
  }
  if(s.current < s.questions.length-1){
    s.current++;
    renderQ(fid);
    window.scrollTo(0, document.querySelector('#'+fid+' .qflow-header') ? document.querySelector('#'+fid).offsetTop - 10 : 0);
  }
}

function prevQ(fid) {
  var s = flows[fid];
  var inp = document.getElementById('qi_'+fid);
  if(inp) s.answers[s.questions[s.current].id] = inp.value;
  if(s.current > 0){ s.current--; renderQ(fid); }
}

function submitFlow(fid) {
  var s = flows[fid];
  var inp = document.getElementById('qi_'+fid);
  if(inp) s.answers[s.questions[s.current].id] = inp.value;
  var a = s.answers;
  // Build payload
  var interesy = Array.isArray(a.int) ? a.int.join(', ') : (a.int||'');
  var data = {
    sheet_name: s.sheetName,
    typ_ankiety: fid,
    ankieter: window._user||'',
    data_wizyty: new Date().toLocaleDateString('pl-PL'),
    miejscowosc: a.msc||'',
    imie: a.imie||'',
    telefon: a.tel||'',
    kod_pocztowy: a.kod||'',
    typ_obj: a.typ||'',
    rachunek_prad: a.rachunek||'',
    koszt_ogrzew: a.koszt||a.koszt_ogrzew||'',
    ma_pv: a.pv||a.pv_status||'',
    zrodlo_ciepla: a.ogrzew||'',
    wiek_kotla: a.wiek_budynku||'',
    interesy: interesy,
    motyw: a.motyw||'',
    decyzja: a.decyzja||'',
    bol: a.bol||'',
    rachunki_ogol: a.rachunki_ogol||'',
    temp_leada: a.temp||'',
    uwagi: a.uwagi||''
  };
  if(!data.telefon){showToast('⚠️ Brak telefonu klienta!'); s.current=0; renderQ(fid); return;}
  sendData(data, s.xpAmount, data.temp_leada==='Gorący', fid);
}

function sendData(data, xp, isHot, fid) {
  var btns = document.querySelectorAll('#'+fid+' .btn-submit, #'+fid+' .btn-next');
  btns.forEach(function(b){b.disabled=true;b.textContent='Zapisuję...';});

  // Content-Type: text/plain omija preflight CORS i redirect w Apps Script
  fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(data)
  })
  .then(function(r){ return r.text(); })
  .then(function(txt){
    try {
      var res = JSON.parse(txt);
      if(res.status === 'error') { showToast('⚠️ Błąd arkusza: ' + res.message); }
    } catch(e) {}
    afterSave(data, xp, isHot, fid);
  })
  .catch(function(){
    // fetch rzuca błąd przy no-cors redirect — ale dane i tak dotarły
    afterSave(data, xp, isHot, fid);
  });
}

function pushRanking(name, xp, total, hot, streak, todayCount) {
  var today = new Date().toLocaleDateString('pl-PL');
  var payload = {
    action:  'updateRanking',
    name:    name,
    xp:      xp,
    total:   total,
    hot:     hot,
    streak:  streak,
    today:   todayCount,
    date:    today
  };
  fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  }).catch(function(){}); // silent - nie blokujemy UI
}

function afterSave(data, xp, isHot, fid) {
  // Oblicz XP z mnożnikiem combo
  var mult = getMultiplier();
  var finalXp = Math.round(xp * mult);
  saveToHistory(data);
  if(window._user) addXP(window._user, finalXp, isHot);
  // Zwiększ combo na następną ankietę
  comboHit();
  confettiBlast();
  floatXP('+'+finalXp+' XP' + (mult > 1 ? ' ×'+mult.toFixed(2) : ''));
  if(isHot) setTimeout(function(){floatXP('🔥 HOT!');},400);
  var multTxt = mult > 1 ? ' (×'+mult.toFixed(2)+' combo!)' : '';
  showToast(isHot?'🔥 GORĄCY LEAD! +'+finalXp+' XP'+multTxt:'✅ Zapisano! +'+finalXp+' XP'+multTxt);

  // ── ŁAPANIE NA MAPIE (Pokémon GO): pin w pozycji GPS + bonus za nowy teren ──
  try {
    if (typeof catchLead === 'function') {
      var temp = data.temp_leada || 'Zimny';
      var res = catchLead(temp, data.imie, data.miejscowosc, finalXp);
      if (res && res.caught) {
        playCatchAnim(temp, res.newTerritory);
        if (res.newTerritory) {
          // bonus XP za odkrycie nowej strefy terenu
          var BONUS = 30;
          if (window._user) addXP(window._user, BONUS, false);
          setTimeout(function(){ floatXP('🗺️ +'+BONUS+' XP nowy teren!'); }, 900);
        }
      } else if (res && res.reason === 'no_gps') {
        setTimeout(function(){ showToast('📍 Włącz lokalizację w zakładce Mapa, by łapać leady na mapie'); }, 1400);
      }
    }
  } catch (e) { /* mapa opcjonalna — nigdy nie blokuje zapisu */ }

  setTimeout(function(){showSuccess(data.typ_ankiety, data.temp_leada, finalXp, fid);},700);
}

function showSuccess(typ, temp, xp, fid) {
  var stats = getStats(window._user||'');
  var lv = getLv(stats.xp);
  var tCol = {Zimny:'#60a5fa',Letni:'#fbbf24',Ciepły:'#fb923c',Gorący:'#10d873'}[temp]||'#aaa';
  var tEm = {Zimny:'🔵',Letni:'🟡',Ciepły:'🟠',Gorący:'🔥'}[temp]||'';
  // Combo info
  var curStep = getCurrentStep();
  var mult    = COMBO_STEPS[curStep];
  var nextMult= curStep < COMBO_STEPS.length-1 ? COMBO_STEPS[curStep+1] : null;
  var comboCls= COMBO_CLASSES[curStep];
  var comboColors = {x1:'#aaa', x125:'#fbbf24', x150:'#fb923c', x175:'#f87171', x200:'#10d873'};
  var comboCol = comboColors[comboCls]||'#aaa';
  var comboRow = '<div class="srow" style="border-top:1px solid rgba(255,255,255,0.07);margin-top:8px;padding-top:8px">'+
    '<span class="srow-label">⚡ Mnożnik XP</span>'+
    '<span class="srow-val" style="color:'+comboCol+';font-size:1.1em">×'+mult.toFixed(2)+'</span></div>';
  var nextRow = nextMult ?
    '<div class="srow"><span class="srow-label">Kolejna ankieta</span>'+
    '<span class="srow-val" style="color:#10d873">→ ×'+nextMult.toFixed(2)+'</span></div>' :
    '<div class="srow"><span class="srow-label">⚡ MAX COMBO!</span>'+
    '<span class="srow-val" style="color:#10d873">🏆 ×2.00</span></div>';
  // Zapisz lokalizację do autofill na następne ankiety
  if(data.kod_pocztowy) localStorage.setItem('4eco_loc_location_kod', data.kod_pocztowy);
  if(data.miejscowosc) localStorage.setItem('4eco_loc_location_msc', data.miejscowosc);

  var app = document.getElementById('appScreen');
  app.innerHTML = '<div class="success-screen">'+
    '<div class="success-icon">✅</div>'+
    '<div class="success-xp">+'+xp+' XP!</div>'+
    '<div class="success-card">'+
      '<div class="srow"><span class="srow-label">Typ ankiety</span><span class="srow-val" style="color:var(--blue)">'+typ+'</span></div>'+
      '<div class="srow"><span class="srow-label">Lead</span><span class="srow-val" style="color:'+tCol+'">'+tEm+' '+(temp||'brak')+'</span></div>'+
    comboRow + nextRow +
    '</div>'+
    '<div class="success-card glow">'+
      '<div style="font-size:0.68em;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Twój progres</div>'+
      '<div style="font-size:1.1em;font-weight:900;color:var(--green)">'+lv.icon+' Level '+lv.level+' — '+lv.name+'</div>'+
      '<div class="sgrid">'+
        '<div class="sgrid-item"><div class="sv" style="color:var(--green)">'+stats.xp+'</div><div class="sl">XP</div></div>'+
        '<div class="sgrid-item"><div class="sv" style="color:var(--purple)">'+stats.total+'</div><div class="sl">Ankiet</div></div>'+
        '<div class="sgrid-item"><div class="sv" style="color:var(--orange)">'+stats.streak+'🔥</div><div class="sl">Streak</div></div>'+
      '</div>'+
      '<div style="height:7px;background:var(--bg3);border-radius:7px;overflow:hidden">'+
        '<div style="height:100%;width:'+lv.progress+'%;background:linear-gradient(90deg,var(--green),var(--blue));border-radius:7px;box-shadow:0 0 8px rgba(16,216,115,0.4)"></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;font-size:0.68em;color:var(--muted);margin-top:4px"><span>Level '+lv.level+'</span><span>'+stats.xp+' / '+lv.nextXp+' XP</span></div>'+
    '</div>'+
    '<button onclick="location.reload()" class="btn-primary" style="max-width:400px;font-size:1.05em">➕ Następna ankieta</button>'+
  '</div>';
}


/* ─────────────────────────────────────────────────────────────
   MOBILE: klawiatura nie może zasłaniać aktywnego pola.
   Używamy visualViewport (reaguje na pojawienie się klawiatury)
   + reakcja na focus/scroll, by zawsze trzymać input w widoku.
   ───────────────────────────────────────────────────────────── */
(function(){
  function isField(el){
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  }
  function keepInView(){
    var el = document.activeElement;
    if(!isField(el)) return;
    var vv = window.visualViewport;
    if(!vv){ el.scrollIntoView({block:'center'}); return; }
    var rect = el.getBoundingClientRect();
    // dolna krawędź widocznego obszaru (nad klawiaturą)
    var safeBottom = vv.height - 16;
    var safeTop = 70; // miejsce na nagłówek
    if(rect.bottom > safeBottom){
      window.scrollBy({top: rect.bottom - safeBottom + 12, behavior:'smooth'});
    } else if(rect.top < safeTop){
      window.scrollBy({top: rect.top - safeTop - 8, behavior:'smooth'});
    }
  }
  // Gdy pole dostaje fokus — włącz tryb klawiatury + przewiń je w widok
  document.addEventListener('focusin', function(e){
    if(isField(e.target)){
      document.body.classList.add('kb-open');
      setTimeout(keepInView, 300);
      setTimeout(keepInView, 600);
    }
  });
  // Gdy pole traci fokus — wyłącz tryb klawiatury
  document.addEventListener('focusout', function(e){
    if(isField(e.target)){
      setTimeout(function(){
        if(!isField(document.activeElement)) document.body.classList.remove('kb-open');
      }, 120);
    }
  });
  // Gdy klawiatura zmienia rozmiar viewportu — popraw pozycję
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', function(){
      if(isField(document.activeElement)) setTimeout(keepInView, 60);
    });
  }
})();
