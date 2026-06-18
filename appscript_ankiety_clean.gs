// ============================================================
// 4ECO FIELD AGENT — Apps Script Backend
// Obsługuje: ankiety + globalny ranking ankieterów
// ============================================================

var SHEET_ANKIETY   = "Ankiety";
var SHEET_RANKING   = "Ranking";
var SHEET_PRESENCE  = "Presence";

var HEADERS_PRESENCE = [
  "Ankieter","Lat","Lng","Dokladnosc(m)","Status","Ostatni sygnal(ISO)","Ostatni sygnal(PL)"
];
var PRESENCE_TTL_MS = 3 * 60 * 1000;  // aktywny = sygnal w ostatnich 3 min

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
  "Temperatura leada","Uwagi"
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

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    if (d.action === 'updateRanking') {
      return handleUpdateRanking(d);
    }

    if (d.action === 'updatePresence') {
      return handleUpdatePresence(d);
    }

    if (d.action === 'updateTrack') {
      return handleUpdateTrack(d);
    }

    if (d.action === 'joinRaid') {
      return handleJoinRaid(d);
    }

    // Domyślnie: zapis ankiety
    return handleSaveAnkieta(d);

  } catch(err) {
    return jsonResp({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action || '';
    if (action === 'getRanking') {
      return handleGetRanking();
    }
    if (action === 'getPresence') {
      return handleGetPresence();
    }
    if (action === 'getTracks') {
      return handleGetTracks(e.parameter.date || '');
    }
    if (action === 'getRaid') {
      return handleGetRaid(e.parameter.weekend || '');
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
    d.audyt          || "",
    d.temp_leada     || "",
    d.uwagi          || ""
  ];

  sh.appendRow(row);
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

function handleGetPresence() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_PRESENCE);
  var out = [];
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
      out.push({
        name:   name,
        lat:    r[1] === "" ? null : Number(r[1]),
        lng:    r[2] === "" ? null : Number(r[2]),
        acc:    r[3] === "" ? null : Number(r[3]),
        status: status,
        ageSec: Math.round(ageMs / 1000)
      });
    }
  }
  return jsonResp({ status: "ok", agents: out, ttlSec: PRESENCE_TTL_MS / 1000 });
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

function handleGetTracks(date) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_TRACKS);
  var out = [];
  if (!date) {
    var d = new Date();
    date = d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
  }
  if (sh && sh.getLastRow() >= 2) {
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS_TRACKS.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      if ((rows[i][0]||"").toString().trim() !== date) continue;
      var pts = [];
      try { pts = JSON.parse(rows[i][2] || "[]"); } catch(e) { pts = []; }
      out.push({
        name: (rows[i][1]||"").toString().trim(),
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
