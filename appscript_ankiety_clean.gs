// ============================================================
// 4ECO FIELD AGENT — Apps Script Backend
// Obsługuje: ankiety + globalny ranking ankieterów
// ============================================================

var SHEET_ANKIETY   = "Ankiety";
var SHEET_CV        = "Leady_CV";
var SHEET_RANKING   = "Ranking";
var SHEET_PRESENCE  = "Presence";

var HEADERS_PRESENCE = [
  "Ankieter","Lat","Lng","Dokladnosc(m)","Status","Ostatni sygnal(ISO)","Ostatni sygnal(PL)"
];
var PRESENCE_TTL_MS = 3 * 60 * 1000;  // aktywny = sygnal w ostatnich 3 min

// ── ROLE / WIDOCZNOSC MAPY ──
// Admin (np. DWS) widzi WSZYSTKICH ankieterow zawsze, na calej mapie.
// Zwykly ankieter widzi tylko kolegow w promieniu PRESENCE_NEARBY_KM.
// Nazwy porownywane po znormalizowanej formie (lower, trim, bez wielokrotnych spacji).
var PRESENCE_ADMINS = ["dws"];          // <-- tu dopisz kolejnych adminow (male litery)
var PRESENCE_NEARBY_KM = 20;             // promien "najblizszej okolicy" dla ankieterow

function _normName(x){ return (x||"").toString().trim().toLowerCase().replace(/\s+/g," "); }
function _isAdmin(name){ return PRESENCE_ADMINS.indexOf(_normName(name)) !== -1; }

// odleglosc Haversine w km miedzy dwoma punktami
function _distKm(lat1,lng1,lat2,lng2){
  if(lat1==null||lng1==null||lat2==null||lng2==null) return Infinity;
  var R=6371, toRad=function(d){return d*Math.PI/180;};
  var dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ============================================================
// BEZPIECZENSTWO — token aplikacji + PIN wiazany z kontem (TOFU)
// ============================================================
// Token musi byc IDENTYCZNY jak APP_TOKEN w js/config.js na froncie.
// Sam w sobie nie jest "sekretem" (kod frontu jest publiczny na GitHub Pages),
// ale odcina automatyczne skanery/boty trafiajace na goly URL webhooka.
// Prawdziwa ochrona danych (GPS, leady, trasy) to PIN nizej.
var APP_TOKEN = "mA8RyfmMN82IosMeK4OgRhR27J9z7QAJ";

var PIN_COL = 8;                 // kolumna w arkuszu Ranking gdzie trzymany jest hash PIN-u (poza HEADERS_RANKING, zeby nie ruszac istniejacej logiki 7-kolumnowej)
var PIN_MAX_FAILS = 5;           // po tylu nieudanych probach -> blokada czasowa
var PIN_LOCKOUT_SEC = 15 * 60;   // 15 minut blokady (chroni przed brute-force 4-cyfrowego PIN-u)

function _hasValidToken(obj){
  return !!(obj && obj.token === APP_TOKEN);
}

function _hashPin(pin){
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, (pin || "") + "|ankiety-play-salt-2026");
  return digest.map(function(b){
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

// Sprawdza PIN dla danej nazwy wzgledem hasha zapisanego w arkuszu Ranking (kolumna PIN_COL).
// TOFU (trust-on-first-use): pierwsze uzycie danej nazwy+PIN-u zapisuje hash i przepuszcza —
// tak jak dzisiejszy lokalny PIN (rejestrowany raz, potem musi sie zgadzac). Po PIN_MAX_FAILS
// nieudanych prob w PIN_LOCKOUT_SEC -> blokada, co realnie wylucza zdalny brute-force.
function _verifyPin(name, pin){
  name = (name || "").toString().trim();
  if (!name) return false;

  var cache = CacheService.getScriptCache();
  var lockKey = "pinfail_" + name.toLowerCase();
  var fails = Number(cache.get(lockKey) || 0);
  if (fails >= PIN_MAX_FAILS) return false;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getOrCreateSheet(ss, SHEET_RANKING, HEADERS_RANKING, "#0d2137");
  var lastRow = sh.getLastRow();
  var rowIdx = -1;
  if (lastRow >= 2) {
    var names = sh.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < names.length; i++) {
      if ((names[i][0] || "").toString().trim().toLowerCase() === name.toLowerCase()) { rowIdx = i + 2; break; }
    }
  }

  var hash = _hashPin(pin);

  if (rowIdx === -1) {
    // Nowa osoba — utworz wiersz z zapisanym hashem (TOFU bootstrap)
    var blank = new Array(PIN_COL).fill("");
    blank[0] = name;
    blank[PIN_COL - 1] = hash;
    sh.appendRow(blank);
    cache.remove(lockKey);
    return true;
  }

  var stored = sh.getRange(rowIdx, PIN_COL, 1, 1).getValue();
  if (!stored) {
    // Konto juz istnieje (np. z synchronizacji rankingu) ale nie mialo jeszcze PIN-u — zapisz teraz
    sh.getRange(rowIdx, PIN_COL, 1, 1).setValue(hash);
    cache.remove(lockKey);
    return true;
  }
  if (stored === hash) { cache.remove(lockKey); return true; }

  cache.put(lockKey, String(fails + 1), PIN_LOCKOUT_SEC);
  return false;
}

// Ochrona przed formula injection przy zapisie wolnego tekstu do Sheets
// (string zaczynajacy sie od =,+,-,@ moze zostac wykonany jako formula w Excelu/Sheets)
function _sanitizeCell(v){
  v = (v === null || v === undefined) ? "" : v.toString();
  if (/^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

// Prosty rate-limit kosztownych akcji (np. OCR -> zuzywa platny/limitowany Gemini)
function _rateLimited(key, maxPerWindow, windowSec){
  var cache = CacheService.getScriptCache();
  var count = Number(cache.get(key) || 0);
  if (count >= maxPerWindow) return true;
  cache.put(key, String(count + 1), windowSec);
  return false;
}

var SHEET_RAID = "RaidWeekend";
var HEADERS_RAID = [
  "Weekend ID","Ankieter","Zapisano(PL)"
];

var SHEET_TRACKS = "Trasy";
var HEADERS_TRACKS = [
  "Data","Ankieter","Punkty JSON","Dystans(m)","Liczba pkt","Strefy","Aktualizacja(PL)"
];

var HEADERS_ANKIETY = [
  "Data zapisu","Typ ankiety","Ankieter","Data wizyty","Miejscowość",
  "Imię klienta","Telefon","Kod pocztowy","Typ obiektu","Rachunek prąd",
  "Koszt ogrzewania","Ma PV","Źródło ciepła","Wiek kotła/budynku",
  "Zainteresowania","Motywacja","Decyzja","Ból","Rachunki ogółem",
  "Świadomość podwyżek","Kto decyduje","Gotowość na konsultację",
  "Temperatura leada","Uwagi",
  "Finansowanie PV","PV od kiedy","Rachunki mimo PV","Świadomość net-billing",
  "Uzyski sprawdzane","Pewność instalacji","Potrzeba klienta","Chęć zmiany",
  "Zgoda na audyt","Pora kontaktu",
  "Klima: pomieszczenia","Klima: powierzchnia","Klima: upał latem","Klima: grzanie zimą","Klima: priorytet","Klima: termin","Klima: zgoda na wycenę",
  "Wszystkie odpowiedzi (JSON)","Zdjęcie ankiety (URL)"
];

var HEADERS_RANKING = [
  "Ankieter","XP","Ankiety ogółem","Gorące leady","Streak (dni)","Dziś","Data aktualizacji"
];

var COLORS_LEAD = {
  "Zimny":   "#d6eaf8",
  "Letni":   "#fef9e7",
  "Ciepły":  "#fdebd0",
  "Gorący":  "#d5f5e3"
};

// ============================================================
// ROUTER
// ============================================================

var HEADERS_CV = [
  "Data dodania", "Imie i nazwisko", "Adres", "Telefon", "Zrodlo (plik)", "Status"
];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    if (!_hasValidToken(d)) {
      return jsonResp({ status: "error", message: "Brak autoryzacji" });
    }

    if (d.action === 'updateRanking') {
      if (!_verifyPin(d.name, d.pin)) return jsonResp({ status: "denied", message: "Nieprawidlowy PIN" });
      return handleUpdateRanking(d);
    }

    if (d.action === 'updatePresence') {
      if (!_verifyPin(d.ankieter, d.pin)) return jsonResp({ status: "denied", message: "Nieprawidlowy PIN" });
      return handleUpdatePresence(d);
    }

    if (d.action === 'updateTrack') {
      if (!_verifyPin(d.ankieter, d.pin)) return jsonResp({ status: "denied", message: "Nieprawidlowy PIN" });
      return handleUpdateTrack(d);
    }

    if (d.action === 'joinRaid') {
      if (!_verifyPin(d.ankieter, d.pin)) return jsonResp({ status: "denied", message: "Nieprawidlowy PIN" });
      return handleJoinRaid(d);
    }

    if (d.action === 'mergeRanking') {
      if (!_verifyPin(d.viewer, d.pin) || !_isAdmin(d.viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
      return handleMergeRanking(d);
    }

    if (d.action === 'saveCV') {
      // Brak jednej powiazanej tozsamosci ankietera w tym formularzu -> token wystarcza jako brama
      return handleSaveCV(d);
    }

    if (d.action === 'ocrSurvey') {
      if (_rateLimited('ocr_global_' + Math.floor(Date.now()/60000), 20, 90)) {
        return jsonResp({ status: "error", message: "Zbyt wiele zadan OCR na raz — sprobuj za chwile" });
      }
      return handleOcrSurvey(d);
    }

    // Domyślnie: zapis ankiety (wymaga poprawnego PIN-u ankietera)
    if (!_verifyPin(d.ankieter, d.pin)) return jsonResp({ status: "denied", message: "Nieprawidlowy PIN" });
    return handleSaveAnkieta(d);

  } catch(err) {
    return jsonResp({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  try {
    var p = e.parameter || {};
    if (!_hasValidToken(p)) {
      return jsonResp({ status: "error", message: "Brak autoryzacji" });
    }

    var action = p.action || '';
    if (action === 'getRanking') {
      return handleGetRanking();
    }
    if (action === 'getPresence') {
      if (!_verifyPin(p.viewer, p.pin)) return jsonResp({ status: "denied", message: "Nieprawidlowy PIN" });
      return handleGetPresence(p.viewer || '', p.vlat, p.vlng);
    }
    if (action === 'getTracks') {
      if (!_verifyPin(p.viewer, p.pin)) return jsonResp({ status: "denied", message: "Nieprawidlowy PIN" });
      return handleGetTracks(p.date || '', p.viewer || '');
    }
    if (action === 'getRaid') {
      return handleGetRaid(p.weekend || '');
    }
    if (action === 'getTeamStats') {
      if (!_verifyPin(p.viewer, p.pin) || !_isAdmin(p.viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
      return handleGetTeamStats(p.viewer || '');
    }
    if (action === 'mergeRanking') {
      if (!_verifyPin(p.viewer, p.pin) || !_isAdmin(p.viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
      return handleMergeRanking({ viewer: p.viewer || '', keep: p.keep || '', drop: p.drop || '' });
    }
    if (action === 'getLeads') {
      if (!_verifyPin(p.viewer, p.pin) || !_isAdmin(p.viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
      return handleGetLeads(p.viewer || '', p.limit || '200');
    }
    if (action === 'getAnkietyZdjecia') {
      if (!_verifyPin(p.viewer, p.pin) || !_isAdmin(p.viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
      return handleGetAnkietyZdjecia(p.viewer || '', p.limit || '100');
    }
    return jsonResp({ status: "error", message: "Nieznana akcja GET" });
  } catch(err) {
    return jsonResp({ status: "error", message: err.toString() });
  }
}

// ============================================================
// ZAPIS ANKIETY
// ============================================================

function handleSaveAnkieta(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getOrCreateSheet(ss, SHEET_ANKIETY, HEADERS_ANKIETY, "#1a6b3c");

  var now = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });

  var row = [
    now,
    d.typ_ankiety    || "",
    d.ankieter       || "",
    d.data_wizyty    || "",
    d.miejscowosc    || "",
    d.imie           || "",
    d.telefon        || "",
    d.kod_pocztowy   || "",
    d.typ_obj        || "",
    d.rachunek_prad  || "",
    d.koszt_ogrzew   || "",
    d.ma_pv          || "",
    d.zrodlo_ciepla  || "",
    d.wiek_kotla     || "",
    d.interesy       || "",
    d.motyw          || "",
    d.decyzja        || "",
    d.bol            || "",
    d.rachunki_ogol  || "",
    d.podwyzki       || "",
    d.kto_decyduje   || "",
    d.zgoda_audyt    || d.audyt || "",
    d.temp_leada     || "",
    d.uwagi          || "",
    d.finansowanie          || "",
    d.pv_od_kiedy           || "",
    d.rachunki_mimo_pv      || "",
    d.netbilling_swiadomosc || "",
    d.uzyski_sprawdzane     || "",
    d.pewnosc_instalacji    || "",
    d.potrzeba_klienta      || "",
    d.chce_zmiany           || "",
    d.zgoda_audyt           || "",
    d.pora_kontaktu         || "",
    d.klima_pomieszczenia   || "",
    d.klima_powierzchnia    || "",
    d.klima_goraco          || "",
    d.klima_grzanie_zima    || "",
    d.klima_najwazniejsze   || "",
    d.klima_termin          || "",
    d.klima_wycena          || "",
    d.wszystkie_odpowiedzi  || "",
    d.zdjecie ? _saveZdjecieDoDrive(d.zdjecie, (d.ankieter||"ankieter") + "_" + (d.telefon||"tel")) : ""
  ];

  sh.appendRow(row.map(_sanitizeCell));
  var lastRow = sh.getLastRow();

  // Koloruj wiersz wg temperatury leada
  var color = COLORS_LEAD[d.temp_leada] || "#ffffff";
  sh.getRange(lastRow, 1, 1, HEADERS_ANKIETY.length).setBackground(color);

  return jsonResp({ status: "ok", row: lastRow });
}

// ============================================================
// AKTUALIZACJA RANKINGU (POST)
// ============================================================

function handleUpdateRanking(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getOrCreateSheet(ss, SHEET_RANKING, HEADERS_RANKING, "#0d2137");

  var name = (d.name || "").trim();
  if (!name) return jsonResp({ status: "error", message: "Brak nazwy ankietera" });

  var now = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
  var data = sh.getDataRange().getValues();

  // Szukaj istniejącego wiersza ankietera (pomijamy nagłówek - row 1)
  var found = -1;
  for (var i = 1; i < data.length; i++) {
    if ((data[i][0] || "").toLowerCase() === name.toLowerCase()) {
      found = i + 1; // +1 bo indeksy Sheets są 1-based
      break;
    }
  }

  var row = [
    name,
    d.xp      || 0,
    d.total   || 0,
    d.hot     || 0,
    d.streak  || 0,
    d.today   || 0,
    now
  ];

  if (found > 0) {
    sh.getRange(found, 1, 1, HEADERS_RANKING.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }

  // Kolorowanie top 3 po każdej aktualizacji
  colorTopRanking(sh);

  return jsonResp({ status: "ok" });
}

// ============================================================
// POBIERZ RANKING (GET)
// ============================================================

function handleGetRanking() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_RANKING);

  if (!sh || sh.getLastRow() < 2) {
    return jsonResp({ status: "ok", data: [] });
  }

  var data = sh.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue; // pomiń puste wiersze
    result.push({
      name:   row[0] || "",
      xp:     Number(row[1]) || 0,
      total:  Number(row[2]) || 0,
      hot:    Number(row[3]) || 0,
      streak: Number(row[4]) || 0,
      today:  Number(row[5]) || 0
    });
  }

  return jsonResp({ status: "ok", data: result });
}

// ============================================================
// PRESENCE — kto jest teraz w terenie (zywe pozycje)
// ============================================================
// Model: 1 wiersz na ankietera (nadpisywany). updatePresence z apki co ~60s.
// getPresence zwraca tylko osoby z sygnalem w ostatnich PRESENCE_TTL_MS.

function handleUpdatePresence(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getOrCreateSheet(ss, SHEET_PRESENCE, HEADERS_PRESENCE, "#0baf5e");

  var name = (d.ankieter || "").toString().trim();
  if (!name) return jsonResp({ status: "error", message: "brak ankietera" });

  var nowIso = new Date().toISOString();
  var nowPl  = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
  var status = d.sharing === false ? "ukryty" : "aktywny";
  var lat = (d.lat === undefined || d.lat === null) ? "" : Number(d.lat);
  var lng = (d.lng === undefined || d.lng === null) ? "" : Number(d.lng);
  var acc = (d.acc === undefined || d.acc === null) ? "" : Math.round(Number(d.acc));

  // znajdz istniejacy wiersz ankietera
  var lastRow = sh.getLastRow();
  var rowIdx = -1;
  if (lastRow >= 2) {
    var names = sh.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < names.length; i++) {
      if ((names[i][0] || "").toString().trim() === name) { rowIdx = i + 2; break; }
    }
  }
  var rowData = [name, lat, lng, acc, status, nowIso, nowPl];
  if (rowIdx === -1) {
    sh.appendRow(rowData);
  } else {
    sh.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
  }
  return jsonResp({ status: "ok" });
}

function handleGetPresence(viewer, vlatRaw, vlngRaw) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_PRESENCE);
  var admin = _isAdmin(viewer);
  var vName = _normName(viewer);
  var vlat = (vlatRaw === undefined || vlatRaw === null || vlatRaw === "") ? null : Number(vlatRaw);
  var vlng = (vlngRaw === undefined || vlngRaw === null || vlngRaw === "") ? null : Number(vlngRaw);
  var all = [];
  if (sh && sh.getLastRow() >= 2) {
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS_PRESENCE.length).getValues();
    var now = Date.now();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var name = (r[0] || "").toString().trim();
      if (!name) continue;
      var iso = r[5];
      var ts = iso ? new Date(iso).getTime() : 0;
      var ageMs = now - ts;
      var fresh = ageMs >= 0 && ageMs <= PRESENCE_TTL_MS;
      if (!fresh) continue;                 // tylko aktywni w ostatnich 3 min
      var status = (r[4] || "aktywny").toString();
      all.push({
        name:   name,
        lat:    r[1] === "" ? null : Number(r[1]),
        lng:    r[2] === "" ? null : Number(r[2]),
        acc:    r[3] === "" ? null : Number(r[3]),
        status: status,
        ageSec: Math.round(ageMs / 1000)
      });
    }
  }

  // ── FILTR WIDOCZNOSCI wg roli pytajacego ──
  var out;
  if (admin) {
    // Admin (DWS) widzi WSZYSTKICH, na calej mapie, zawsze.
    out = all;
  } else {
    // Zwykly ankieter: widzi siebie + kolegow w promieniu PRESENCE_NEARBY_KM.
    // Kolega bez pozycji (ukryty/brak GPS) NIE jest pokazywany ankieterowi.
    out = all.filter(function(a){
      if (_normName(a.name) === vName) return true;   // zawsze siebie
      if (a.lat == null || a.lng == null) return false; // brak pozycji -> niewidoczny dla kolegi
      if (vlat == null || vlng == null) return false;   // pytajacy bez pozycji -> nie liczymy okolicy
      return _distKm(vlat, vlng, a.lat, a.lng) <= PRESENCE_NEARBY_KM;
    });
  }

  return jsonResp({ status: "ok", agents: out, ttlSec: PRESENCE_TTL_MS / 1000, viewerAdmin: admin, nearbyKm: PRESENCE_NEARBY_KM });
}

// Zwraca zbior nazw (znormalizowanych) widocznych dla danego viewer-a
// w kontekscie TRAS (historyczny slad GPS) — ta sama logika prywatnosci
// co przy live-presence: admin widzi wszystkich, zwykly ankieter siebie
// + kolegow aktualnie (wg ostatniego znanego sygnalu Presence) w promieniu
// PRESENCE_NEARBY_KM. Brak wlasnej pozycji -> tylko siebie (bezpieczny domyslny wariant).
function _visibleTrackNames(viewer){
  if (_isAdmin(viewer)) return null; // null = brak filtra, widac wszystko
  var vName = _normName(viewer);
  var visible = {};
  if (vName) visible[vName] = true; // zawsze siebie

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_PRESENCE);
  if (!sh || sh.getLastRow() < 2) return visible;

  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS_PRESENCE.length).getValues();
  var byName = {};
  var vlat = null, vlng = null;
  for (var i = 0; i < rows.length; i++) {
    var nm = (rows[i][0] || "").toString().trim();
    if (!nm) continue;
    var lat = rows[i][1] === "" ? null : Number(rows[i][1]);
    var lng = rows[i][2] === "" ? null : Number(rows[i][2]);
    var nrm = _normName(nm);
    byName[nrm] = { lat: lat, lng: lng };
    if (nrm === vName) { vlat = lat; vlng = lng; }
  }
  if (vlat == null || vlng == null) return visible; // bez wlasnej pozycji -> tylko siebie

  Object.keys(byName).forEach(function(k){
    var p = byName[k];
    if (p.lat == null || p.lng == null) return;
    if (_distKm(vlat, vlng, p.lat, p.lng) <= PRESENCE_NEARBY_KM) visible[k] = true;
  });
  return visible;
}

// ============================================================
// TRASY — slad gdzie ankieter dzis chodzil (cala flota)
// ============================================================
// Model: 1 wiersz na (data + ankieter), nadpisywany. Apka wysyla cala
// dzisiejsza trase (lekka — punkty filtrowane co ~12m) co kilka minut.

function handleUpdateTrack(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getOrCreateSheet(ss, SHEET_TRACKS, HEADERS_TRACKS, "#0d6b4f");

  var name = (d.ankieter || "").toString().trim();
  var date = (d.date || "").toString().trim();
  if (!name || !date) return jsonResp({ status: "error", message: "brak ankietera/daty" });

  var pts = Array.isArray(d.points) ? d.points : [];
  var ptsJson = JSON.stringify(pts);
  var dist = Number(d.dist) || 0;
  var zones = Number(d.zones) || 0;
  var nowPl = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });

  // znajdz istniejacy wiersz (data + ankieter)
  var lastRow = sh.getLastRow();
  var rowIdx = -1;
  if (lastRow >= 2) {
    var vals = sh.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < vals.length; i++) {
      if ((vals[i][0]||"").toString().trim() === date &&
          (vals[i][1]||"").toString().trim() === name) { rowIdx = i + 2; break; }
    }
  }
  var rowData = [date, name, ptsJson, Math.round(dist), pts.length, zones, nowPl];
  if (rowIdx === -1) sh.appendRow(rowData);
  else sh.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);

  return jsonResp({ status: "ok" });
}

function handleGetTracks(date, viewer) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_TRACKS);
  var out = [];
  if (!date) {
    var d = new Date();
    date = d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
  }
  var visible = _visibleTrackNames(viewer || '');
  if (sh && sh.getLastRow() >= 2) {
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS_TRACKS.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      if ((rows[i][0]||"").toString().trim() !== date) continue;
      var trkName = (rows[i][1]||"").toString().trim();
      if (visible !== null && !visible[_normName(trkName)]) continue; // niewidoczny dla tego widza -> pomin
      var pts = [];
      try { pts = JSON.parse(rows[i][2] || "[]"); } catch(e) { pts = []; }
      out.push({
        name: trkName,
        points: pts,
        dist: Number(rows[i][3]) || 0,
        count: Number(rows[i][4]) || 0,
        zones: Number(rows[i][5]) || 0
      });
    }
  }
  return jsonResp({ status: "ok", date: date, tracks: out });
}

// ============================================================
// HELPERS
// ============================================================

function getOrCreateSheet(ss, name, headers, headerBg) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    var hRange = sh.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setBackground(headerBg)
          .setFontColor("white")
          .setFontWeight("bold");
    sh.setFrozenRows(1);
  } else {
    // Samonaprawa: jeśli arkusz istnieje, ale brakuje nowych kolumn nagłówka
    // (np. doszły pola Audytu PV), dopisz brakujące nagłówki bez ruszania danych.
    var curCols = sh.getLastColumn();
    if (curCols < headers.length) {
      var missing = headers.slice(curCols);
      var mRange = sh.getRange(1, curCols + 1, 1, missing.length);
      mRange.setValues([missing]);
      mRange.setBackground(headerBg)
            .setFontColor("white")
            .setFontWeight("bold");
    }
  }
  return sh;
}

function colorTopRanking(sh) {
  try {
    var lastRow = sh.getLastRow();
    if (lastRow < 2) return;

    // Pobierz dane i posortuj wg XP żeby znaleźć top 3
    var data = sh.getRange(2, 1, lastRow - 1, HEADERS_RANKING.length).getValues();
    var indexed = data.map(function(r, i) { return { row: i + 2, xp: Number(r[1]) || 0, name: r[0] }; });
    indexed.sort(function(a, b) { return b.xp - a.xp; });

    // Reset kolorów
    sh.getRange(2, 1, lastRow - 1, HEADERS_RANKING.length).setBackground("#ffffff");

    // Top 3 kolory
    var topColors = ["#fff3cd", "#e8e8e8", "#f5deb3"]; // złoty, srebrny, brązowy
    for (var i = 0; i < Math.min(3, indexed.length); i++) {
      sh.getRange(indexed[i].row, 1, 1, HEADERS_RANKING.length)
        .setBackground(topColors[i]);
    }
  } catch(e) {}
}

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
// LEADY Z CV — zapis danych kontaktowych z PDF-ow (pod obdzwonke bota)
// ============================================================

function handleSaveCV(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getOrCreateSheet(ss, SHEET_CV, HEADERS_CV, "#0d6b4f");

  // Obsluga paczki (batch) lub pojedynczego rekordu
  var items = [];
  if (d.leads && d.leads.length) {
    items = d.leads;
  } else {
    items = [d];
  }

  // Deduplikacja po ostatnich 9 cyfrach telefonu (jak w Leo/kontaktach)
  var existing = {};
  var lastRow = sh.getLastRow();
  if (lastRow > 1) {
    var telCol = sh.getRange(2, 4, lastRow - 1, 1).getValues();
    for (var i = 0; i < telCol.length; i++) {
      var t9 = _last9(telCol[i][0]);
      if (t9) existing[t9] = true;
    }
  }

  var added = 0, dup = 0, skipped = 0;
  var rows = [];
  var now = new Date();
  var ts = Utilities.formatDate(now, "Europe/Warsaw", "yyyy-MM-dd HH:mm");

  for (var j = 0; j < items.length; j++) {
    var it = items[j] || {};
    var name = (it.name || it.imie || "").toString().trim();
    var addr = (it.address || it.adres || "").toString().trim();
    var tel  = (it.phone || it.telefon || "").toString().trim();
    var src  = (it.source || it.plik || "").toString().trim();

    // Wymagany telefon — bez numeru lead bezuzyteczny do obdzwonki
    var t9 = _last9(tel);
    if (!t9) { skipped++; continue; }
    if (existing[t9]) { dup++; continue; }
    existing[t9] = true;

    rows.push([ts, name, addr, tel, src, "nowy"].map(_sanitizeCell));
    added++;
  }

  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS_CV.length).setValues(rows);
  }

  return jsonResp({ status: "ok", added: added, duplicates: dup, skipped_no_phone: skipped });
}

function _last9(v) {
  var digits = (v == null ? "" : v.toString()).replace(/[^0-9]/g, "");
  if (digits.length < 9) return "";
  return digits.slice(-9);
}


// ============================================================
// RAID WEEKEND — zapisy na weekendowy mega-event
// ============================================================

function handleJoinRaid(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getOrCreateSheet(ss, SHEET_RAID, HEADERS_RAID, "#f59e0b");

  var name = (d.ankieter || "").toString().trim();
  var weekend = (d.weekend || "").toString().trim();
  if (!name || !weekend) return jsonResp({ status: "error", message: "brak danych" });

  // sprawdz czy juz zapisany na ten weekend (dedup)
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var rows = sh.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < rows.length; i++) {
      if ((rows[i][0] || "").toString().trim() === weekend &&
          (rows[i][1] || "").toString().trim().toLowerCase() === name.toLowerCase()) {
        return jsonResp({ status: "ok", already: true });
      }
    }
  }
  var nowPl = new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
  sh.appendRow([weekend, name, nowPl]);
  return jsonResp({ status: "ok" });
}

function handleGetRaid(weekend) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_RAID);
  var out = [];
  weekend = (weekend || "").toString().trim();
  if (sh && sh.getLastRow() >= 2) {
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
    var seen = {};
    for (var i = 0; i < rows.length; i++) {
      var wk = (rows[i][0] || "").toString().trim();
      var nm = (rows[i][1] || "").toString().trim();
      if (!nm) continue;
      if (weekend && wk !== weekend) continue;   // tylko biezacy weekend
      var key = nm.toLowerCase();
      if (seen[key]) continue;                    // dedup
      seen[key] = true;
      out.push(nm);
    }
  }
  return jsonResp({ status: "ok", data: out });
}


// ============================================================
// MEGA-ADMIN (DWS) — statystyki zespolu i leady
// Chronione: tylko dla nazw z PRESENCE_ADMINS (mega-admin).
// ============================================================

function handleGetTeamStats(viewer) {
  if (!_isAdmin(viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
  // Ranking = zrodlo prawdy o zespole (name, today, hot, total/xp).
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("Ranking");
  var team = [];
  if (sh && sh.getLastRow() > 1) {
    var rng = sh.getDataRange().getValues();
    var head = rng[0].map(function(h){ return (h||"").toString().trim().toLowerCase(); });
    function idx(names){ for (var i=0;i<head.length;i++){ if (names.indexOf(head[i])!==-1) return i; } return -1; }
    var iName = idx(["ankieter","name","imie","imię i nazwisko"]);
    var iTot  = idx(["total","suma","razem","ankiety"]);
    var iToday= idx(["dziś","dzis","today"]);
    var iHot  = idx(["gorące leady","gorace leady","hot","gorące"]);
    var iXp   = idx(["xp","punkty"]);
    for (var r=1;r<rng.length;r++){
      var row=rng[r];
      var nm=(iName>=0?row[iName]:"")||"";
      if (!nm) continue;
      team.push({
        name:  nm.toString(),
        total: iTot>=0 ? Number(row[iTot])||0 : 0,
        today: iToday>=0 ? Number(row[iToday])||0 : 0,
        hot:   iHot>=0 ? Number(row[iHot])||0 : 0,
        xp:    iXp>=0 ? Number(row[iXp])||0 : 0
      });
    }
  }
  team.sort(function(a,b){ return b.total - a.total; });
  var totAnk=0, totHot=0, totToday=0;
  team.forEach(function(t){ totAnk+=t.total; totHot+=t.hot; totToday+=t.today; });
  return jsonResp({
    status:"ok",
    team: team,
    summary: { ankieterzy: team.length, ankiety: totAnk, gorace: totHot, dzis: totToday }
  });
}

function handleGetLeads(viewer, limitRaw) {
  if (!_isAdmin(viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
  var limit = Math.min(Math.max(parseInt(limitRaw,10)||200, 1), 1000);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = ["Ankiety_Podstawowe","Ankiety_Audyt_PV","Ankiety_Rozbudowane"];
  var leads = [];
  tabs.forEach(function(tab){
    var sh = ss.getSheetByName(tab);
    if (!sh || sh.getLastRow() < 2) return;
    var rng = sh.getDataRange().getValues();
    var head = rng[0].map(function(h){ return (h||"").toString().trim().toLowerCase(); });
    function idx(names){ for (var i=0;i<head.length;i++){ for (var j=0;j<names.length;j++){ if (head[i].indexOf(names[j])!==-1) return i; } } return -1; }
    var iData = idx(["data","czas","timestamp"]);
    var iAnk  = idx(["ankieter"]);
    var iImie = idx(["imię","imie","nazwisko","klient"]);
    var iTel  = idx(["telefon","tel","numer"]);
    var iMsc  = idx(["miejscowość","miejscowosc","msc"]);
    var iTemp = idx(["temperatura","temp"]);
    var iTyp  = idx(["typ","ankieta","rodzaj"]);
    for (var r=rng.length-1; r>=1 && leads.length<limit; r--){
      var row=rng[r];
      leads.push({
        tab: tab,
        data: iData>=0 ? (row[iData]||"").toString() : "",
        ankieter: iAnk>=0 ? (row[iAnk]||"").toString() : "",
        klient: iImie>=0 ? (row[iImie]||"").toString() : "",
        telefon: iTel>=0 ? (row[iTel]||"").toString() : "",
        msc: iMsc>=0 ? (row[iMsc]||"").toString() : "",
        temp: iTemp>=0 ? (row[iTemp]||"").toString() : "",
        typ: iTyp>=0 ? (row[iTyp]||"").toString() : tab
      });
    }
  });
  return jsonResp({ status:"ok", leads: leads, count: leads.length });
}


// ============================================================
// MEGA-ADMIN — scalanie duplikatow w rankingu
// POST {action:'mergeRanking', viewer:'dws', keep:'Przemek Ościak', drop:'Przemek Osciak'}
// Sumuje XP/ankiety/gorące/dziś do 'keep', bierze wyzszy streak, usuwa wiersz 'drop'.
// ============================================================
function handleMergeRanking(d) {
  if (!_isAdmin(d.viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
  var keep = (d.keep || "").toString().trim();
  var drop = (d.drop || "").toString().trim();
  if (!keep || !drop) return jsonResp({ status:"error", message:"Brak keep/drop" });
  if (keep.toLowerCase() === drop.toLowerCase()) return jsonResp({ status:"error", message:"To samo konto" });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_RANKING);
  if (!sh || sh.getLastRow() < 2) return jsonResp({ status:"error", message:"Brak rankingu" });

  var data = sh.getDataRange().getValues();  // [Ankieter,XP,Ankiety,Gorące,Streak,Dziś,Data]
  var iKeep = -1, iDrop = -1;
  for (var i=1;i<data.length;i++){
    var nm=(data[i][0]||"").toString().trim().toLowerCase();
    if (nm===keep.toLowerCase()) iKeep=i;
    if (nm===drop.toLowerCase()) iDrop=i;
  }
  if (iKeep<0) return jsonResp({ status:"error", message:"Nie ma konta docelowego: "+keep });
  if (iDrop<0) return jsonResp({ status:"error", message:"Nie ma konta do usuniecia: "+drop });

  var k=data[iKeep], p=data[iDrop];
  var merged = [
    k[0],                                             // nazwa (keep)
    (Number(k[1])||0)+(Number(p[1])||0),              // XP
    (Number(k[2])||0)+(Number(p[2])||0),              // Ankiety
    (Number(k[3])||0)+(Number(p[3])||0),              // Gorące
    Math.max(Number(k[4])||0, Number(p[4])||0),       // Streak (wyzszy)
    (Number(k[5])||0)+(Number(p[5])||0),              // Dziś
    new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })
  ];
  sh.getRange(iKeep+1, 1, 1, HEADERS_RANKING.length).setValues([merged]);
  sh.deleteRow(iDrop+1);
  colorTopRanking(sh);
  return jsonResp({ status:"ok", keep:k[0], mergedXp:merged[1] });
}


// ============================================================
// OCR ANKIETY PAPIEROWEJ — zdjecie kartki -> Gemini Vision -> JSON
// ============================================================
// KROK RECZNY: wklej tu swoj klucz Gemini (https://aistudio.google.com/apikey)
var GEMINI_API_KEY = "WKLEJ_TU_SWOJ_KLUCZ_GEMINI";
var GEMINI_MODELS  = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];

var OCR_PROMPTS = {
  pv_skrocona:
    'Masz zdjecie/skan papierowej ankiety terenowej "PV skrocona" (fotowoltaika). ' +
    'Odpowiedzi klienta sa zakreslone/zaznaczone (ptaszek, X, okrag, podkreslenie) przy jednej z opcji w kazdym pytaniu. ' +
    'Dane kontaktowe sa wpisane odrecznie w polach na gorze formularza.\n\n' +
    'Zwroc WYLACZNIE czysty JSON, z dokladnie tymi polami:\n' +
    '{\n' +
    '  "imie": string albo null,\n' +
    '  "tel": string albo null,\n' +
    '  "msc": string albo null,\n' +
    '  "pora": jedna z ["Rano","Popoludnie","Wieczor","Weekend"] albo null,\n' +
    '  "finansowanie": jedna z ["Wlasne","Kredyt","Dotacja + wlasne"] albo null,\n' +
    '  "od_kiedy": jedna z ["do 1 roku","1-3 lata","3-5 lat","ponad 5 lat"] albo null,\n' +
    '  "rachunki_mimo": jedna z ["Tak, zaskakujaco","Trochę za wysokie","Sa w porzadku"] albo null,\n' +
    '  "uzyski": jedna z ["Tak","Nie","Nie wiem jak"] albo null,\n' +
    '  "pewnosc": jedna z ["Tak","Nie jestem pewien","Nie wiem jak sprawdzic"] albo null,\n' +
    '  "potrzeba": lista (0 lub wiecej) zlozona z ["Nizsze rachunki","Pewnosc, ze PV dziala","Magazyn energii","Pompa ciepla"],\n' +
    '  "audyt": jedna z ["Tak, chetnie","Najpierw wiecej info","Nie teraz"] albo null\n' +
    '}\n' +
    'Zwracaj TYLKO wartosci z podanych list dopuszczalnych (dokladne dopasowanie tekstu), albo null jesli pytanie nie zostalo zaznaczone lub nie da sie odczytac z pewnoscia. Nie zgaduj.',

  klima:
    'Masz zdjecie/skan papierowej ankiety terenowej "Klimatyzacja". ' +
    'Odpowiedzi klienta sa zakreslone/zaznaczone (ptaszek, X, okrag, podkreslenie) przy jednej z opcji w kazdym pytaniu. ' +
    'Dane kontaktowe sa wpisane odrecznie w polach na gorze formularza.\n\n' +
    'Zwroc WYLACZNIE czysty JSON, z dokladnie tymi polami:\n' +
    '{\n' +
    '  "imie": string albo null,\n' +
    '  "tel": string albo null,\n' +
    '  "msc": string albo null,\n' +
    '  "pora": jedna z ["Rano","Popoludnie","Wieczor","Weekend"] albo null,\n' +
    '  "ile_pomieszczen": jedna z ["1","2","3","4 i wiecej"] albo null,\n' +
    '  "powierzchnia": jedna z ["do 25 m2","25-50 m2","50-100 m2","ponad 100 m2"] albo null,\n' +
    '  "goraco": jedna z ["Tak, nie da sie funkcjonowac","Bywa uciazliwie","Da sie wytrzymac"] albo null,\n' +
    '  "grzanie_zima": jedna z ["Tak, bardzo","Moze","Nie potrzebuje"] albo null,\n' +
    '  "najwazniejsze": jedna z ["Komfort i cisza","Niski koszt pradu","Grzanie zima","Estetyka montazu"] albo null,\n' +
    '  "termin": jedna z ["Jak najszybciej","W ciagu kilku miesiecy","Dopiero sie rozgladam"] albo null,\n' +
    '  "wycena": jedna z ["Tak, chetnie","Najpierw wiecej info","Nie teraz"] albo null\n' +
    '}\n' +
    'Zwracaj TYLKO wartosci z podanych list dopuszczalnych (dokladne dopasowanie tekstu), albo null jesli pytanie nie zostalo zaznaczone lub nie da sie odczytac z pewnoscia. Nie zgaduj.'
};

function handleOcrSurvey(d) {
  try {
    var prompt = OCR_PROMPTS[d.type];
    if (!prompt) return jsonResp({ status: "error", message: "Nieznany typ ankiety: " + d.type });
    if (!d.image) return jsonResp({ status: "error", message: "Brak zdjecia" });

    var base64 = d.image.indexOf(',') > -1 ? d.image.split(',')[1] : d.image;

    var payload = {
      contents: [{ parts: [ { text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64 } } ] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" }
    };

    var lastErr = "";
    for (var i = 0; i < GEMINI_MODELS.length; i++) {
      var model = GEMINI_MODELS[i];
      var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + GEMINI_API_KEY;
      try {
        var resp = UrlFetchApp.fetch(url, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
        var code = resp.getResponseCode();
        if (code === 429 || code === 503) { lastErr = "HTTP " + code + " (" + model + ")"; continue; }
        if (code !== 200) { lastErr = "HTTP " + code + ": " + resp.getContentText().substring(0,200); continue; }

        var res = JSON.parse(resp.getContentText());
        var text = res.candidates[0].content.parts[0].text;
        var extracted = JSON.parse(text);
        return jsonResp({ status: "ok", data: extracted, model: model });
      } catch (innerErr) {
        lastErr = innerErr.toString();
        continue;
      }
    }
    return jsonResp({ status: "error", message: "Wszystkie modele Gemini zawiodly: " + lastErr });

  } catch (err) {
    return jsonResp({ status: "error", message: err.toString() });
  }
}


// ============================================================
// ZDJECIA ANKIET (dowod papierowej kartki, dolaczone przy zapisie)
// ============================================================

// Zapisuje base64 (JPEG) do folderu Drive "AnkietyZdjecia_4ECO" (tworzy jesli trzeba),
// ustawia udostepnianie "kto ma link - moze wyswietlic" i zwraca link do podgladu.
function _saveZdjecieDoDrive(base64Data, filenameHint) {
  try {
    var b64 = base64Data.indexOf(',') > -1 ? base64Data.split(',')[1] : base64Data;
    var bytes = Utilities.base64Decode(b64);
    var blob = Utilities.newBlob(bytes, "image/jpeg",
      "ankieta_" + _slugify(filenameHint) + "_" + new Date().getTime() + ".jpg");

    var folderName = "AnkietyZdjecia_4ECO";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch (e) {
    return "";
  }
}

function _slugify(s) {
  return (s || "").toString().replace(/[^a-zA-Z0-9]+/g, "_").substring(0, 40);
}

// Panel admina -> zakladka "Zdjecia": lista ostatnich ankiet z dolaczonym zdjeciem kartki.
function handleGetAnkietyZdjecia(viewer, limitRaw) {
  if (!_isAdmin(viewer)) return jsonResp({ status: "denied", message: "Brak uprawnien" });
  var limit = Math.min(Math.max(parseInt(limitRaw, 10) || 100, 1), 500);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_ANKIETY);
  var items = [];
  if (sh && sh.getLastRow() > 1) {
    var rng = sh.getDataRange().getValues();
    var head = rng[0].map(function (h) { return (h || "").toString().trim().toLowerCase(); });
    function idx(name) { return head.indexOf(name.toLowerCase()); }
    var iData  = idx("Data zapisu");
    var iTyp   = idx("Typ ankiety");
    var iAnk   = idx("Ankieter");
    var iImie  = idx("Imię klienta");
    var iTel   = idx("Telefon");
    var iMsc   = idx("Miejscowość");
    var iTemp  = idx("Temperatura leada");
    var iZdj   = idx("Zdjęcie ankiety (URL)");
    if (iZdj === -1) return jsonResp({ status: "ok", items: [] });

    for (var r = rng.length - 1; r >= 1 && items.length < limit; r--) {
      var row = rng[r];
      var url = (row[iZdj] || "").toString();
      if (!url) continue;
      items.push({
        data: iData >= 0 ? (row[iData] || "").toString() : "",
        typ: iTyp >= 0 ? (row[iTyp] || "").toString() : "",
        ankieter: iAnk >= 0 ? (row[iAnk] || "").toString() : "",
        imie: iImie >= 0 ? (row[iImie] || "").toString() : "",
        telefon: iTel >= 0 ? (row[iTel] || "").toString() : "",
        msc: iMsc >= 0 ? (row[iMsc] || "").toString() : "",
        temp: iTemp >= 0 ? (row[iTemp] || "").toString() : "",
        zdjecie: url
      });
    }
  }
  return jsonResp({ status: "ok", items: items });
}
