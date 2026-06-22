// ============================================================
// 🤖 AUTO-SCORING LEADA — system sam ocenia temperaturę
// ============================================================
// Na podstawie odpowiedzi z ankiety liczymy "punkty intencji zakupowej".
// Suma punktów -> temperatura leada (Zimny / Letni / Ciepły / Gorący).
// XP za lead zależy od temperatury: Zimny 20 / Letni 30 / Ciepły 40 / Gorący 50.
//
// Mapowanie odpowiedzi na punkty: im silniejszy sygnał zakupowy
// (wysokie rachunki, ból, szybka decyzja, konkretne zainteresowanie),
// tym więcej punktów. Działa dla wszystkich typów ankiet (QPV/QHEAT/QNEW/FULL).

// XP przypisane do temperatury
var LEAD_XP = { 'Zimny': 20, 'Letni': 30, 'Ciepły': 40, 'Gorący': 50 };

// Słownik sygnałów: dla danego pola odpowiedzi -> punkty.
// Klucze odpowiedzi muszą pasować do tekstu wybranego w ankiecie.
var LEAD_SIGNALS = {
  // ── Rachunek za prąd (QPV / FULL) ──
  rachunek: {
    'Ponad 500 zł': 4, '300–500 zł': 3, '150–300 zł': 1, 'Poniżej 150 zł': 0
  },
  // ── Jak mówi o rachunkach / ból (QPV) ──
  bol: {
    'Rosną i jest tym zdenerwowany': 4, 'Nie rozumie za co płaci': 2,
    'Nie śledzi — płaci i tyle': 1, 'Jest zadowolony': 0
  },
  // ── Status PV (QPV/FULL) — brak paneli = potencjał ──
  pv_status: {
    'Nie ma paneli': 3, 'Planuje w tym roku': 4, 'Tak, ale coś nie działa': 2, 'Tak, działają': 0
  },
  pv: {
    'Nie ma paneli': 3, 'Planuje instalację': 4, 'Tak, ale ma problemy': 2, 'Tak, działają dobrze': 0
  },
  // ── Ogrzewanie: drogie/węgiel = większy potencjał (QHEAT) ──
  ogrzew: {
    'Węgiel / ekogroszek': 4, 'Prąd / bojler': 3, 'Gaz ziemny': 2,
    'Drewno / inne': 2, 'Ma już pompę ciepła': 0
  },
  koszt: {
    'Ponad 10 000 zł': 4, '6 000–10 000 zł': 3, '3 000–6 000 zł': 1, 'Poniżej 3 000 zł': 0
  },
  wiek_budynku: {
    'Stary — przed 1990': 3, '1990–2005': 2, '2005–2015': 1, 'Nowy — po 2015': 0
  },
  // ── Nowy klient: ogólny ból i decyzja (QNEW) ──
  rachunki_ogol: {
    'Horror': 4, 'Drogo': 3, 'Średnio': 1, 'Spokojnie': 0
  },
  decyzja: {
    'Jak najszybciej': 5, 'W ciągu pół roku': 3, 'Za rok lub dłużej': 1, 'Jeszcze nie wie': 0
  },
  // ── Świadomość rosnących cen energii (QPV/FULL) ──
  podwyzki: {
    'Aktywnie szuka oszczędności': 3, 'Obserwuje, zastanawia się': 1, 'Na razie się nie martwi': 0
  },
  // ── Decyzyjność: rozmowa z właścicielem/parą = mocniejszy lead ──
  kto_decyduje: {
    'Rozmawiam z właścicielem': 2, 'Małżeństwo decyduje wspólnie': 2, 'Decyduje ktoś inny': 0
  },
  // ── Gotowość na bezpłatną konsultację — najsilniejszy sygnał intencji ──
  audyt: {
    'Tak, chętnie się umówi': 5, 'Może w późniejszym terminie': 2, 'Nie jest zainteresowany': -2
  },
  // ── Ankieta RACHUNKI (otwarcie przez rachunek za prąd) ──
  // skok rachunku w górę = ból = potencjał
  skok: {
    'Mocno wzrosły': 3, 'Trochę wzrosły': 2, 'Bez zmian': 0, 'Nie śledzi': 0
  },
  // dopłaty na koniec roku = realny ból finansowy
  rozliczenie: {
    'Dopłaca spore kwoty': 3, 'Prognoza + dopłata na koniec': 2,
    'Stała kwota co miesiąc': 0, 'Nie wie / nie pamięta': 1
  },
  // reakcja na mostek "obniżyć rachunek o połowę" = intencja
  mostek: {
    'Bardzo': 4, 'Może': 2, 'Obojętnie': 0, 'Nie': -2
  },
  // zgoda na bezpłatne wyliczenie — NAJSILNIEJSZY sygnał intencji
  zgoda: {
    'Tak — zostawia dane': 5, 'Tak, ale woli sam zadzwonić': 3,
    'Niezdecydowany — dopytać później': 1, 'Nie wyraża zgody': -3
  },
  // pierwsza reakcja na zaczepkę
  otwarcie: {
    'Chętnie zaczął rozmawiać': 2, 'Ostrożnie, ale słucha': 1,
    'Zbywa, mało czasu': 0, 'Nie chce rozmawiać': -1
  }
};

// Zainteresowania (multi) — każdy konkretny produkt = sygnał zakupowy
var INTEREST_POINTS = {
  'Panele słoneczne': 1, 'Pompa ciepła': 1, 'Magazyn energii': 1,
  'Mała turbina wiatrowa': 1, 'Ocieplenie domu': 1, 'Klimatyzacja': 1
};

// Co zjada prąd (multi 'zjadacz' w ankiecie RACHUNKI) — duże zużycie = większy potencjał
var CONSUMER_POINTS = {
  'Ogrzewanie / bojler': 2, 'Pompa ciepła': 2, 'Auto elektryczne': 2,
  'Klimatyzacja': 1, 'Zwykłe AGD / dom': 0
};

// Liczy łączny wynik intencji z odpowiedzi ankiety
function scoreLead(answers) {
  var pts = 0;
  Object.keys(LEAD_SIGNALS).forEach(function (field) {
    var val = answers[field];
    if (val == null) return;
    var map = LEAD_SIGNALS[field];
    if (map[val] != null) pts += map[val];
  });
  // zainteresowania (multi-select): max 3 pkt, +bonus za liczbę
  var ints = answers.int || answers.interesy;
  if (Array.isArray(ints)) {
    var ip = 0;
    ints.forEach(function (it) { ip += (INTEREST_POINTS[it] || 0); });
    pts += Math.min(ip, 3);
    if (ints.length >= 3) pts += 1; // szeroki apetyt = cieplejszy lead
  }
  // co zjada prąd (multi 'zjadacz'): duże zużycie energii = większy potencjał, max 4 pkt
  var cons = answers.zjadacz;
  if (Array.isArray(cons)) {
    var cp = 0;
    cons.forEach(function (it) { cp += (CONSUMER_POINTS[it] || 0); });
    pts += Math.min(cp, 4);
  }
  // notatki ankietera: słowa-klucze podbijają temperaturę
  var note = (answers.uwagi || '').toLowerCase();
  if (note) {
    if (/spotkani|umów|umow|oddzwoni|zadzwoń|zadzwon|termin|jutro|pilne/.test(note)) pts += 3;
    if (/dotacj|dofinans|mój prąd|moj prad|czyste powietrze/.test(note)) pts += 1;
    if (/zainteresowan|chce|chętn|chetn/.test(note)) pts += 1;
    if (/nie zainteresowan|nie chce|odmówi|odmowi|nie teraz/.test(note)) pts -= 3;
  }
  return pts;
}

// Mapuje wynik punktowy na temperaturę leada
function tempFromScore(pts) {
  if (pts >= 11) return 'Gorący';
  if (pts >= 7)  return 'Ciepły';
  if (pts >= 2)  return 'Letni';
  return 'Zimny';
}

// Główna funkcja: analizuje odpowiedzi -> {temp, xp, pts}
function analyzeLeadTemp(answers) {
  var pts = scoreLead(answers || {});
  var temp = tempFromScore(pts);
  return { temp: temp, xp: LEAD_XP[temp], pts: pts };
}
