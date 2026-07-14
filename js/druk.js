// ── DO DRUKU — skrócone ankiety PDF (1 strona A4) ──────────────
// Pliki leżą w repo /druk/. Otwieramy w nowej karcie (podgląd + druk + pobranie).
var DRUK_ANKIETY = [
  {
    id: 'pv',
    icon: '☀️',
    nazwa: 'Ankieta PV / Fotowoltaika',
    opis: 'Szybki kontakt + 7 pytań. Dla właścicieli i zainteresowanych instalacją PV.',
    plik: 'druk/ankieta_pv_skrocona.pdf',
    kolor: 'rgba(16,216,115,0.35)'
  },
  {
    id: 'klima',
    icon: '❄️',
    nazwa: 'Ankieta Klimatyzacja',
    opis: 'Szybki kontakt + 7 pytań. Dobór i wycena klimatyzacji / pompy powietrze-powietrze.',
    plik: 'druk/ankieta_klimatyzacja_skrocona.pdf',
    kolor: 'rgba(56,170,255,0.35)'
  }
];

function renderDruk() {
  var box = document.getElementById('drukList');
  if (!box) return;
  box.innerHTML = DRUK_ANKIETY.map(function(a) {
    return '' +
    '<div style="border:1px solid var(--border);border-left:4px solid ' + a.kolor + ';border-radius:12px;padding:14px 16px;margin-bottom:12px;background:rgba(255,255,255,0.02)">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">' +
        '<span style="font-size:1.5em">' + a.icon + '</span>' +
        '<span style="font-size:0.95em;font-weight:800;color:var(--text)">' + a.nazwa + '</span>' +
      '</div>' +
      '<div style="font-size:0.78em;color:var(--muted);margin-bottom:12px;line-height:1.4">' + a.opis + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
        '<a href="' + a.plik + '" target="_blank" rel="noopener" ' +
          'style="flex:1;min-width:130px;text-align:center;background:linear-gradient(135deg,#10d873,#0bb45e);color:#04130a;font-weight:800;font-size:0.82em;padding:11px 14px;border-radius:10px;text-decoration:none;font-family:Inter,sans-serif">' +
          '🖨️ Otwórz / Drukuj</a>' +
        '<a href="' + a.plik + '" download ' +
          'style="flex:1;min-width:130px;text-align:center;background:transparent;border:1px solid var(--border);color:var(--text);font-weight:700;font-size:0.82em;padding:11px 14px;border-radius:10px;text-decoration:none;font-family:Inter,sans-serif">' +
          '⬇️ Pobierz PDF</a>' +
      '</div>' +
      '<button onclick="triggerOcrPhoto(\'' + a.id + '\')" ' +
        'style="width:100%;text-align:center;background:var(--card2);border:1.5px dashed var(--border2);color:var(--text);font-weight:700;font-size:0.82em;padding:11px 14px;border-radius:10px;font-family:Inter,sans-serif;cursor:pointer">' +
        '📸 Wpisz z wypełnionej kartki</button>' +
    '</div>';
  }).join('');
  _ensureOcrFileInput();
}

// Input pliku musi istniec ZANIM ktokolwiek kliknie "Wpisz z kartki" —
// przyciski OCR sa teraz rowniez nad flow PV/Klima (widoczne od razu,
// zanim uzytkownik w ogole odwiedzi zakladke "Do druku"), wiec tworzymy
// input lazy, niezaleznie od renderDruk().
function _ensureOcrFileInput() {
  if (document.getElementById('ocrFileInput')) return;
  var inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.id = 'ocrFileInput'; inp.style.display = 'none';
  inp.onchange = handleOcrFileChosen;
  document.body.appendChild(inp);
}

// ============================================================
// OCR Z KARTKI PAPIEROWEJ — zdjęcie -> Gemini Vision -> prefill flow
// ============================================================
var OCR_TYPE_MAP = {
  pv:    { ocrType: 'pv_skrocona', tabId: 'q_pvskr', flowId: 'PVSKR' },
  klima: { ocrType: 'klima',       tabId: 'q_klima', flowId: 'KLIMA' }
};

function triggerOcrPhoto(druk_id) {
  var cfg = OCR_TYPE_MAP[druk_id];
  if (!cfg) return;
  _ensureOcrFileInput();
  window._ocrTarget = cfg;
  document.getElementById('ocrFileInput').click();
}

function handleOcrFileChosen(ev) {
  var file = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!file || !window._ocrTarget) return;
  var cfg = window._ocrTarget;

  showToast('📸 Przetwarzam zdjęcie…');
  _compressImageToBase64(file, 1280, 0.72, function(base64) {
    // Zdjecie zapisujemy do flow NIEZALEZNIE od wyniku OCR — trafi do arkusza
    // przy zapisie ankiety jako dowod/kopia zapasowa, nawet jesli odczyt sie nie uda.
    var s = flows[cfg.flowId];
    if (s) s.photo = base64;

    fetch(WEBHOOK, {
      method: 'POST',
      body: JSON.stringify(authBody({ action: 'ocrSurvey', type: cfg.ocrType, image: base64 }))
    })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (res.status !== 'ok' || !res.data) {
          showToast('⚠️ Nie odczytano danych automatycznie — zdjęcie dołączone, wypełnij ręcznie');
          switchMode('quick');
          showTab(cfg.tabId, document.querySelector('[onclick="showTab(\'' + cfg.tabId + '\',this)"]'));
          return;
        }
        _applyOcrPrefill(cfg, res.data);
      })
      .catch(function(err){
        showToast('⚠️ Błąd połączenia z OCR — zdjęcie dołączone, wypełnij ręcznie');
        switchMode('quick');
        showTab(cfg.tabId, document.querySelector('[onclick="showTab(\'' + cfg.tabId + '\',this)"]'));
      });
  });
}

// Kompresuje zdjęcie do JPEG base64 (bez wysyłania oryginału w pełnej rozdzielczości)
function _compressImageToBase64(file, maxDim, quality, cb) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var w = img.width, h = img.height;
      var scale = Math.min(1, maxDim / Math.max(w, h));
      var cw = Math.round(w * scale), ch = Math.round(h * scale);
      var canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
      cb(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Wpisuje odczytane dane do odpowiedniego flow (jako "prefill" — ankieter i tak
// przechodzi krok po kroku i zatwierdza/koryguje każdą odpowiedź przed zapisem)
function _applyOcrPrefill(cfg, data) {
  var s = flows[cfg.flowId];
  if (!s) return;

  var filled = 0, total = 0;
  Object.keys(data).forEach(function(k) {
    total++;
    var v = data[k];
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return;
    s.answers[k] = v;
    filled++;
  });

  s.current = 0;
  renderQ(cfg.flowId);
  switchMode('quick');
  showTab(cfg.tabId, document.querySelector('[onclick="showTab(\'' + cfg.tabId + '\',this)"]'));
  showToast('✅ Odczytano ' + filled + '/' + total + ' pól — sprawdź i zapisz');
}
