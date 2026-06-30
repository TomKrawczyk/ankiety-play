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
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<a href="' + a.plik + '" target="_blank" rel="noopener" ' +
          'style="flex:1;min-width:130px;text-align:center;background:linear-gradient(135deg,#10d873,#0bb45e);color:#04130a;font-weight:800;font-size:0.82em;padding:11px 14px;border-radius:10px;text-decoration:none;font-family:Inter,sans-serif">' +
          '🖨️ Otwórz / Drukuj</a>' +
        '<a href="' + a.plik + '" download ' +
          'style="flex:1;min-width:130px;text-align:center;background:transparent;border:1px solid var(--border);color:var(--text);font-weight:700;font-size:0.82em;padding:11px 14px;border-radius:10px;text-decoration:none;font-family:Inter,sans-serif">' +
          '⬇️ Pobierz PDF</a>' +
      '</div>' +
    '</div>';
  }).join('');
}
