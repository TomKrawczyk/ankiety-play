// ============================================================
// MAPA — tryb Pokémon GO: pozycja GPS, łapanie leadów, hotspoty
// ============================================================
// Zależności: Leaflet (CDN, ładowane w index.html). Dane trzymane lokalnie
// (localStorage) per użytkownik — piny złapanych ankiet + odkryte hotspoty.

var MAP = {
  obj: null,          // instancja Leaflet
  meMarker: null,     // znacznik gracza (Ty)
  meAccuracy: null,   // okrąg dokładności GPS
  watchId: null,      // navigator.geolocation.watchPosition id
  pins: [],           // warstwy pinów złapanych ankiet
  hotspots: [],       // warstwy hotspotów
  lastPos: null,      // ostatnia znana pozycja {lat,lng}
  ready: false
};

// Domyślny widok (środek Polski) zanim złapiemy GPS
var MAP_DEFAULT = { lat: 52.07, lng: 19.48, zoom: 6 };
var MAP_ME_ZOOM = 16;

// ── KLUCZE LOCALSTORAGE (per użytkownik) ──
function mapKey(suffix) {
  return '4eco_map_' + (window._user || 'anon') + '_' + suffix;
}

// ── ODCZYT / ZAPIS ZŁAPANYCH PINÓW ──
function loadCatches() {
  try { return JSON.parse(localStorage.getItem(mapKey('catches')) || '[]'); }
  catch (e) { return []; }
}
function saveCatches(arr) {
  try { localStorage.setItem(mapKey('catches'), JSON.stringify(arr)); } catch (e) {}
}

// ── HOTSPOTY: odkryte obszary (siatka ~150m) ──
// Pokrycie terenu = rozbijamy świat na komórki siatki. Każda nowa komórka,
// w której wypełnisz ankietę = "odkryty teren" (jak nowy obszar w Pokémon GO).
var GRID = 0.0015; // ~150m w stopniach (przybliżenie dla Polski)
function cellKey(lat, lng) {
  return Math.floor(lat / GRID) + ':' + Math.floor(lng / GRID);
}
function loadCells() {
  try { return JSON.parse(localStorage.getItem(mapKey('cells')) || '{}'); }
  catch (e) { return {}; }
}
function saveCells(obj) {
  try { localStorage.setItem(mapKey('cells'), JSON.stringify(obj)); } catch (e) {}
}

// ── KOLORY PINÓW wg temperatury leada ──
var TEMP_PIN = {
  'Gorący': { color: '#10d873', glow: 'rgba(16,216,115,.6)', emoji: '🔥' },
  'Ciepły': { color: '#fb923c', glow: 'rgba(251,146,60,.6)',  emoji: '🟠' },
  'Letni':  { color: '#fbbf24', glow: 'rgba(251,191,36,.6)',  emoji: '🟡' },
  'Zimny':  { color: '#60a5fa', glow: 'rgba(96,165,250,.6)',  emoji: '🔵' }
};
function tempStyle(temp) { return TEMP_PIN[temp] || TEMP_PIN['Zimny']; }

// ── IKONA PINA (DivIcon = pełna kontrola stylu) ──
function makeCatchIcon(temp) {
  var st = tempStyle(temp);
  return L.divIcon({
    className: 'catch-pin-wrap',
    html: '<div class="catch-pin" style="--pc:' + st.color + ';--pg:' + st.glow + '">' +
          '<span>' + st.emoji + '</span></div>',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36]
  });
}

// ── IKONA GRACZA (Ty) ──
function makeMeIcon() {
  var av = '🧑';
  try {
    if (typeof getAvatar === 'function' && typeof AV_ICONS !== 'undefined') {
      var a = getAvatar(window._user);
      var ico = AV_ICONS.find(function(x){ return x.id === (a.icon || 'default'); });
      if (ico && ico.emoji) av = ico.emoji;
    }
  } catch (e) {}
  return L.divIcon({
    className: 'me-pin-wrap',
    html: '<div class="me-pin"><div class="me-pulse"></div>' +
          '<div class="me-dot">' + av + '</div></div>',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
}

// ── INICJALIZACJA MAPY (raz) ──
function initMap() {
  if (MAP.obj) return;
  if (typeof L === 'undefined') {
    var el = document.getElementById('mapCanvas');
    if (el) el.innerHTML = '<div class="map-err">⚠️ Biblioteka mapy się nie załadowała. Sprawdź połączenie z internetem.</div>';
    return;
  }
  MAP.obj = L.map('mapCanvas', {
    zoomControl: true,
    attributionControl: false
  }).setView([MAP_DEFAULT.lat, MAP_DEFAULT.lng], MAP_DEFAULT.zoom);

  // Warstwa kafelków — CARTO Voyager (ładny, czysty styl, darmowy)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd'
  }).addTo(MAP.obj);

  MAP.ready = true;
  renderCatchesOnMap();
  renderHotspotsOnMap();
  startGeo();
}

// ── GEOLOKALIZACJA: śledzenie pozycji gracza ──
function startGeo() {
  if (!navigator.geolocation) {
    setGeoStatus('⚠️ Twoja przeglądarka nie wspiera GPS.');
    return;
  }
  setGeoStatus('📡 Szukam Twojej pozycji...');
  if (MAP.watchId !== null) return; // już śledzimy
  MAP.watchId = navigator.geolocation.watchPosition(
    onGeoOk, onGeoErr,
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  );
}

function onGeoOk(pos) {
  var lat = pos.coords.latitude, lng = pos.coords.longitude;
  var acc = pos.coords.accuracy || 50;
  var first = !MAP.lastPos;
  MAP.lastPos = { lat: lat, lng: lng, acc: acc };

  // zapis śladu trasy (filtr: tylko sensowne kroki, dobry GPS)
  recordTrackPoint(lat, lng, acc);

  if (!MAP.meMarker) {
    MAP.meMarker = L.marker([lat, lng], { icon: makeMeIcon(), zIndexOffset: 1000 }).addTo(MAP.obj);
    MAP.meAccuracy = L.circle([lat, lng], {
      radius: acc, color: '#16a34a', weight: 1, fillColor: '#16a34a', fillOpacity: 0.08
    }).addTo(MAP.obj);
  } else {
    MAP.meMarker.setLatLng([lat, lng]);
    MAP.meAccuracy.setLatLng([lat, lng]).setRadius(acc);
  }

  if (first) MAP.obj.setView([lat, lng], MAP_ME_ZOOM);
  setGeoStatus('🟢 Na żywo · dokładność ~' + Math.round(acc) + ' m');
  updateNearbyHint();
}

function onGeoErr(err) {
  var msg = '⚠️ Brak dostępu do lokalizacji.';
  if (err && err.code === 1) msg = '🔒 Zezwól na lokalizację w przeglądarce, żeby grać na mapie.';
  else if (err && err.code === 3) msg = '⏳ GPS nie odpowiada — spróbuj na otwartej przestrzeni.';
  setGeoStatus(msg);
}

function setGeoStatus(txt) {
  var el = document.getElementById('geoStatus');
  if (el) el.textContent = txt;
}

// ── CENTROWANIE NA GRACZU ──
function centerOnMe() {
  if (MAP.lastPos) {
    MAP.obj.setView([MAP.lastPos.lat, MAP.lastPos.lng], MAP_ME_ZOOM, { animate: true });
  } else {
    startGeo();
  }
}

// ── RENDER ZŁAPANYCH PINÓW ──
function renderCatchesOnMap() {
  if (!MAP.ready) return;
  MAP.pins.forEach(function (p) { MAP.obj.removeLayer(p); });
  MAP.pins = [];
  var catches = loadCatches();
  catches.forEach(function (c) {
    if (typeof c.lat !== 'number' || typeof c.lng !== 'number') return;
    var m = L.marker([c.lat, c.lng], { icon: makeCatchIcon(c.temp) }).addTo(MAP.obj);
    var d = c.date ? new Date(c.date) : null;
    var when = d ? d.toLocaleDateString('pl-PL') + ' ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '';
    m.bindPopup(
      '<div class="pin-pop">' +
      '<div class="pin-pop-h" style="color:' + tempStyle(c.temp).color + '">' +
      tempStyle(c.temp).emoji + ' ' + (c.temp || 'Lead') + '</div>' +
      '<div class="pin-pop-name">' + (c.name || 'Klient') + '</div>' +
      (c.msc ? '<div class="pin-pop-sub">📍 ' + c.msc + '</div>' : '') +
      (when ? '<div class="pin-pop-sub">🕑 ' + when + '</div>' : '') +
      '<div class="pin-pop-xp">+' + (c.xp || 0) + ' XP</div>' +
      '</div>'
    );
    MAP.pins.push(m);
  });
}

// ── RENDER HOTSPOTÓW (odkryte komórki siatki) ──
function renderHotspotsOnMap() {
  if (!MAP.ready) return;
  MAP.hotspots.forEach(function (h) { MAP.obj.removeLayer(h); });
  MAP.hotspots = [];
  var cells = loadCells();
  Object.keys(cells).forEach(function (key) {
    var parts = key.split(':');
    var gy = parseInt(parts[0], 10), gx = parseInt(parts[1], 10);
    var lat = (gy + 0.5) * GRID, lng = (gx + 0.5) * GRID;
    var count = cells[key].count || 1;
    // im więcej ankiet w komórce, tym intensywniejszy hotspot
    var rad = Math.min(60 + count * 18, 140);
    var op = Math.min(0.10 + count * 0.05, 0.30);
    var h = L.circle([lat, lng], {
      radius: rad, color: '#10d873', weight: 1.2,
      fillColor: '#10d873', fillOpacity: op
    }).addTo(MAP.obj);
    h.bindPopup('<div class="pin-pop"><div class="pin-pop-h" style="color:#10d873">⭐ Twój teren</div>' +
      '<div class="pin-pop-sub">' + count + ' ' + (count === 1 ? 'ankieta' : 'ankiet') + ' w tej okolicy</div></div>');
    MAP.hotspots.push(h);
  });
}

// ── ZŁAPANIE LEADA: wołane z afterSave() po zapisie ankiety ──
// Zapisuje pin w aktualnej pozycji GPS, odkrywa komórkę terenu, odpala animację.
function catchLead(temp, name, msc, xp) {
  if (!MAP.lastPos) {
    // Brak GPS — bez pozycji nie ma pinu (statystyki liczone osobno).
    return { caught: false, reason: 'no_gps' };
  }
  var lat = MAP.lastPos.lat, lng = MAP.lastPos.lng;
  // mały losowy offset, żeby piny z tego samego miejsca się nie nakładały
  lat += (Math.random() - 0.5) * 0.00025;
  lng += (Math.random() - 0.5) * 0.00025;

  var catches = loadCatches();
  catches.push({
    lat: lat, lng: lng, temp: temp, name: name || '', msc: msc || '',
    xp: xp || 0, date: new Date().toISOString()
  });
  saveCatches(catches);

  // Odkryj komórkę terenu (hotspot)
  var cells = loadCells();
  var key = cellKey(MAP.lastPos.lat, MAP.lastPos.lng);
  var newCell = !cells[key];
  cells[key] = { count: (cells[key] ? cells[key].count : 0) + 1, last: Date.now() };
  saveCells(cells);

  // Odśwież warstwy (jeśli mapa otwarta)
  if (MAP.ready) {
    renderCatchesOnMap();
    renderHotspotsOnMap();
  }
  return { caught: true, newTerritory: newCell, lat: lat, lng: lng, temp: temp };
}

// ── ANIMACJA ZŁAPANIA (pełnoekranowa, jak rzut kulą) ──
function playCatchAnim(temp, newTerritory) {
  var st = tempStyle(temp);
  var ov = document.createElement('div');
  ov.className = 'catch-anim-ov';
  ov.innerHTML =
    '<div class="catch-ball" style="--pc:' + st.color + '">' +
    '<div class="catch-ball-top"></div><div class="catch-ball-mid"></div>' +
    '<div class="catch-ball-bot"></div></div>' +
    '<div class="catch-burst" style="--pc:' + st.color + '"></div>' +
    '<div class="catch-label">' + st.emoji + ' ZŁAPANY!</div>' +
    (newTerritory ? '<div class="catch-sub">🗺️ Nowy teren odkryty! +bonus</div>' : '');
  document.body.appendChild(ov);
  setTimeout(function () { ov.classList.add('go'); }, 30);
  setTimeout(function () { ov.classList.add('out'); }, 1700);
  setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 2200);
}

// ── PODPOWIEDŹ: ile leadów masz w pobliżu ──
function updateNearbyHint() {
  var el = document.getElementById('mapNearby');
  if (!el) return;
  var catches = loadCatches();
  var cells = loadCells();
  var territory = Object.keys(cells).length;
  el.innerHTML =
    '<span>📍 Złapane: <b>' + catches.length + '</b></span>' +
    '<span>🗺️ Teren: <b>' + territory + '</b> stref</span>';
}

// ── RENDER ZAKŁADKI MAPA (wołane z switchMode) ──
function renderMapa() {
  // Leaflet potrzebuje, by kontener był widoczny zanim policzy rozmiar
  setTimeout(function () {
    initMap();
    if (MAP.obj) MAP.obj.invalidateSize();
    updateNearbyHint();
    updateShareBtn();
    startPresence();
    initTrack();
    startTrackSync();
    updateTeamModeBtn();
  }, 60);
}

// ============================================================
// PRESENCE — żywe pozycje zespołu (kto jest teraz w terenie)
// ============================================================
// Wysyłanie własnej pozycji + pobieranie kolegów co PRESENCE_EVERY ms.
// Wyłączenie udostępniania = status "ukryty" (sygnał dla lidera, że nie pracuje).

var PRESENCE_SEND_EVERY  = 120000;  // 2 min — wysyłka własnej pozycji
var PRESENCE_FETCH_EVERY = 180000;  // 3 min — pobieranie kolegów
var MATE = { markers: {}, sendTimer: null, fetchTimer: null };

// ── Udostępnianie lokalizacji: domyślnie WŁĄCZONE ──
function isSharing() {
  return localStorage.getItem(mapKey('sharing')) !== 'off';
}
function setSharing(on) {
  localStorage.setItem(mapKey('sharing'), on ? 'on' : 'off');
  updateShareBtn();
  // natychmiast wyślij nowy status (aktywny/ukryty)
  sendPresence();
  // jeśli wyłączono — zdejmij ewentualny własny duplikat z widoku kolegów
  if (!on) fetchMates();
}
function toggleSharing() { setSharing(!isSharing()); }

function updateShareBtn() {
  var btn = document.getElementById('shareBtn');
  if (!btn) return;
  if (isSharing()) {
    btn.className = 'map-share on';
    btn.innerHTML = '📡 Udostępniam pozycję';
  } else {
    btn.className = 'map-share off';
    btn.innerHTML = '🚫 Pozycja ukryta (lider widzi „nie pracuje”)';
  }
}

// ── WYŚLIJ swoją pozycję na wspólny webhook ──
function sendPresence() {
  if (!window._user) return;
  var sharing = isSharing();
  var payload = {
    action: 'updatePresence',
    ankieter: window._user,
    sharing: sharing,
    lat: (sharing && MAP.lastPos) ? MAP.lastPos.lat : null,
    lng: (sharing && MAP.lastPos) ? MAP.lastPos.lng : null,
    acc: (sharing && MAP.lastPos) ? MAP.lastPos.acc : null
  };
  try {
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    }).catch(function(){});
  } catch (e) {}
}

// ── POBIERZ kolegów i narysuj ich na mapie ──
function fetchMates() {
  if (!MAP.ready) return;
  fetch(WEBHOOK + '?action=getPresence')
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || res.status !== 'ok' || !Array.isArray(res.agents)) return;
      drawMates(res.agents);
    })
    .catch(function(){});
}

function makeMateIcon(name, ageSec) {
  var initial = (name || '?').trim().charAt(0).toUpperCase();
  var stale = ageSec > 90; // sygnał starszy niż 1.5 min → lekko przygaszony
  return L.divIcon({
    className: 'mate-pin-wrap',
    html: '<div class="mate-pin' + (stale ? ' stale' : '') + '">' +
          '<div class="mate-dot">' + initial + '</div>' +
          '<div class="mate-name">' + name + '</div></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

function drawMates(agents) {
  var seen = {};
  agents.forEach(function(a){
    // pomiń samego siebie (mam już własny zielony marker)
    if (a.name && window._user && a.name.trim() === window._user.trim()) return;
    // ukryci / bez pozycji — nie rysujemy pinu (są w panelu statusu)
    if (a.status === 'ukryty' || typeof a.lat !== 'number' || typeof a.lng !== 'number') return;
    seen[a.name] = true;
    var icon = makeMateIcon(a.name, a.ageSec || 0);
    if (MATE.markers[a.name]) {
      MATE.markers[a.name].setLatLng([a.lat, a.lng]).setIcon(icon);
    } else {
      MATE.markers[a.name] = L.marker([a.lat, a.lng], { icon: icon, zIndexOffset: 500 }).addTo(MAP.obj);
    }
  });
  // usuń markery osób, które zniknęły (nieaktywne >3 min — backend już je odfiltrował)
  Object.keys(MATE.markers).forEach(function(name){
    if (!seen[name]) {
      MAP.obj.removeLayer(MATE.markers[name]);
      delete MATE.markers[name];
    }
  });
  // panel listy zespołu (łącznie z ukrytymi)
  renderTeamPanel(agents);
}

// ── PANEL: lista zespołu w terenie (kto aktywny / kto ukryty) ──
function renderTeamPanel(agents) {
  var el = document.getElementById('mapTeam');
  if (!el) return;
  var others = agents.filter(function(a){
    return !(a.name && window._user && a.name.trim() === window._user.trim());
  });
  if (others.length === 0) {
    el.innerHTML = '<div class="team-empty">Nikt inny nie jest teraz w terenie.</div>';
    return;
  }
  var active = others.filter(function(a){ return a.status !== 'ukryty'; });
  var hidden = others.filter(function(a){ return a.status === 'ukryty'; });
  var html = '<div class="team-h">👥 Zespół w terenie (' + active.length + ' aktywnych)</div>';
  active.forEach(function(a){
    html += '<div class="team-row"><span class="team-dot ok"></span>' +
            '<b>' + a.name + '</b><span class="team-ago">' + agoTxt(a.ageSec) + '</span></div>';
  });
  hidden.forEach(function(a){
    html += '<div class="team-row hidden"><span class="team-dot off"></span>' +
            '<b>' + a.name + '</b><span class="team-ago">🚫 ukryta pozycja</span></div>';
  });
  el.innerHTML = html;
}

function agoTxt(sec) {
  if (sec == null) return '';
  if (sec < 60) return 'teraz';
  return Math.round(sec / 60) + ' min temu';
}

// ── START / STOP pętli presence ──
function startPresence() {
  if (MATE.sendTimer || MATE.fetchTimer) return;
  updateShareBtn();
  sendPresence();   // od razu zgłoś obecność
  fetchMates();     // od razu pobierz kolegów
  MATE.sendTimer  = setInterval(sendPresence, PRESENCE_SEND_EVERY);   // co 2 min
  MATE.fetchTimer = setInterval(fetchMates,   PRESENCE_FETCH_EVERY);  // co 3 min
}

// ============================================================
// ŚLAD TRASY — gdzie ankieter dziś chodził
// ============================================================
// Punkty GPS z dzisiejszego dnia zapisywane lokalnie (per użytkownik+data).
// Filtr: dopisujemy punkt tylko gdy dokładność jest sensowna i przeszliśmy
// co najmniej MIN_STEP_M od ostatniego — żeby nie tworzyć tysięcy punktów w miejscu.

var TRACK = { line: null, points: [], shown: true };
var MIN_STEP_M = 12;     // min. przesunięcie, by zapisać nowy punkt (metry)
var MAX_ACC_M  = 60;     // ignoruj odczyty gorsze niż 60 m (szum GPS)

function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
}
function trackKey() { return mapKey('track_' + todayStr()); }

function loadTrack() {
  try { return JSON.parse(localStorage.getItem(trackKey()) || '[]'); }
  catch (e) { return []; }
}
function saveTrack(arr) {
  try { localStorage.setItem(trackKey(), JSON.stringify(arr)); } catch (e) {}
}

// odległość Haversine (metry)
function distM(a, b) {
  var R = 6371000, toR = Math.PI/180;
  var dLat = (b.lat-a.lat)*toR, dLng = (b.lng-a.lng)*toR;
  var la1 = a.lat*toR, la2 = b.lat*toR;
  var h = Math.sin(dLat/2)*Math.sin(dLat/2) +
          Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2*R*Math.asin(Math.sqrt(h));
}

// dopisz punkt trasy (woła onGeoOk)
function recordTrackPoint(lat, lng, acc) {
  if (acc && acc > MAX_ACC_M) return;        // zbyt słaby sygnał — pomiń
  if (!TRACK.points.length) TRACK.points = loadTrack();
  var pt = { lat: lat, lng: lng, t: Date.now() };
  var last = TRACK.points[TRACK.points.length - 1];
  if (last && distM(last, pt) < MIN_STEP_M) return;  // za blisko — nie dubluj
  TRACK.points.push(pt);
  saveTrack(TRACK.points);
  drawTrack();
  updateTrackStats();
}

// narysuj polyline trasy
function drawTrack() {
  if (!MAP.ready) return;
  if (TRACK.line) { MAP.obj.removeLayer(TRACK.line); TRACK.line = null; }
  if (!TRACK.shown || TRACK.points.length < 2) return;
  var latlngs = TRACK.points.map(function(p){ return [p.lat, p.lng]; });
  TRACK.line = L.polyline(latlngs, {
    color: '#16a34a', weight: 4, opacity: 0.85,
    lineJoin: 'round', lineCap: 'round', dashArray: '1,8'
  }).addTo(MAP.obj);
}

// łączny dystans trasy (metry)
function trackDistance() {
  var d = 0;
  for (var i = 1; i < TRACK.points.length; i++) d += distM(TRACK.points[i-1], TRACK.points[i]);
  return d;
}

function updateTrackStats() {
  var el = document.getElementById('trackStats');
  if (!el) return;
  var m = trackDistance();
  var txt = m >= 1000 ? (m/1000).toFixed(2) + ' km' : Math.round(m) + ' m';
  el.innerHTML = '🚶 Dziś: <b>' + txt + '</b> · <b>' + TRACK.points.length + '</b> pkt';
}

// pokaż/ukryj trasę
function toggleTrack() {
  TRACK.shown = !TRACK.shown;
  drawTrack();
  updateTrackBtn();
}
function updateTrackBtn() {
  var b = document.getElementById('trackBtn');
  if (!b) return;
  b.className = 'map-share ' + (TRACK.shown ? 'on' : 'off');
  b.innerHTML = TRACK.shown ? '🟢 Ślad trasy: widoczny' : '⚪ Ślad trasy: ukryty';
}

// wyśrodkuj mapę na całej trasie
function fitTrack() {
  if (!MAP.ready || TRACK.points.length < 2) { centerOnMe(); return; }
  var latlngs = TRACK.points.map(function(p){ return [p.lat, p.lng]; });
  MAP.obj.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
}

// wyczyść dzisiejszą trasę
function clearTrack() {
  if (!confirm('Wyczyścić dzisiejszy ślad trasy? Tej operacji nie można cofnąć.')) return;
  TRACK.points = [];
  saveTrack([]);
  drawTrack();
  updateTrackStats();
}

// init przy otwarciu mapy
function initTrack() {
  TRACK.points = loadTrack();
  drawTrack();
  updateTrackStats();
  updateTrackBtn();
}

// ============================================================
// TRASY ZESPOŁU — gdzie dziś chodził każdy (widok floty)
// ============================================================
// Własna trasa wysyłana na webhook co TRACK_SEND_EVERY. Tryb "Zespół"
// pobiera i rysuje trasy wszystkich w odrębnych kolorach.

var TRACK_SEND_EVERY = 240000;   // 4 min — wysyłka własnej trasy
var TEAM = { mode: 'me', layers: [], timer: null, colors: [
  '#16a34a','#2563eb','#db2777','#ea580c','#9333ea','#0891b2','#ca8a04','#dc2626',
  '#15803d','#7c3aed','#c026d3','#0d9488','#b45309','#4f46e5'
] };

function colorForName(name) {
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h*31 + name.charCodeAt(i)) >>> 0;
  return TEAM.colors[h % TEAM.colors.length];
}

// ── WYŚLIJ własną trasę na serwer ──
function sendTrack() {
  if (!window._user || TRACK.points.length < 2) return;
  // wysyłamy odchudzoną trasę (max ~300 pkt, próbkowane) by payload był lekki
  var pts = TRACK.points;
  if (pts.length > 300) {
    var step = Math.ceil(pts.length / 300), thin = [];
    for (var i = 0; i < pts.length; i += step) thin.push(pts[i]);
    thin.push(pts[pts.length-1]);
    pts = thin;
  }
  var slim = pts.map(function(p){ return { lat: +p.lat.toFixed(5), lng: +p.lng.toFixed(5) }; });
  try {
    fetch(WEBHOOK, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'updateTrack', ankieter: window._user,
        date: todayStr(), points: slim, dist: trackDistance(),
        zones: Object.keys(loadCells()).length
      })
    }).catch(function(){});
  } catch (e) {}
}

function startTrackSync() {
  if (TEAM.timer) return;
  setTimeout(sendTrack, 5000);                 // pierwsza wysyłka po 5s
  TEAM.timer = setInterval(sendTrack, TRACK_SEND_EVERY);
}

// ── Przełącz Moja / Zespół ──
function toggleTeamMode() {
  TEAM.mode = TEAM.mode === 'me' ? 'team' : 'me';
  updateTeamModeBtn();
  clearTeamLayers();
  if (TEAM.mode === 'team') {
    if (TRACK.line) { MAP.obj.removeLayer(TRACK.line); TRACK.line = null; }  // schowaj solo
    fetchTeamTracks();
  } else {
    drawTrack();   // wróć do własnej trasy
  }
}
function updateTeamModeBtn() {
  var b = document.getElementById('teamModeBtn');
  if (!b) return;
  if (TEAM.mode === 'team') { b.className = 'map-share on'; b.innerHTML = '👥 Trasy zespołu (kliknij: moja)'; }
  else { b.className = 'map-share off'; b.innerHTML = '🚶 Moja trasa (kliknij: zespół)'; }
}

function clearTeamLayers() {
  TEAM.layers.forEach(function(l){ MAP.obj.removeLayer(l); });
  TEAM.layers = [];
}

// ── POBIERZ i narysuj trasy wszystkich ──
function fetchTeamTracks() {
  if (TEAM.mode !== 'team') return;
  var el = document.getElementById('teamTracksList');
  if (el) el.innerHTML = '<div class="team-empty">Ładuję trasy zespołu…</div>';
  fetch(WEBHOOK + '?action=getTracks&date=' + todayStr())
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || res.status !== 'ok' || !Array.isArray(res.tracks)) return;
      drawTeamTracks(res.tracks);
    })
    .catch(function(){ if (el) el.innerHTML = '<div class="team-empty">Nie udało się pobrać tras.</div>'; });
}

function drawTeamTracks(tracks) {
  clearTeamLayers();
  var allBounds = [];
  var listHtml = '';
  tracks.sort(function(a,b){ return (b.dist||0)-(a.dist||0); });
  tracks.forEach(function(t){
    if (!t.points || t.points.length < 2) {
      listHtml += teamRow(t, true);
      return;
    }
    var color = colorForName(t.name);
    var latlngs = t.points.map(function(p){ return [p.lat, p.lng]; });
    var line = L.polyline(latlngs, { color: color, weight: 4, opacity: 0.8, lineJoin:'round', lineCap:'round' }).addTo(MAP.obj);
    line.bindPopup('<b style="color:'+color+'">'+t.name+'</b><br>'+fmtDist(t.dist)+' · '+t.count+' pkt');
    TEAM.layers.push(line);
    // kropka startu i końca
    var end = L.circleMarker(latlngs[latlngs.length-1], { radius:6, color:'#fff', weight:2, fillColor:color, fillOpacity:1 }).addTo(MAP.obj);
    TEAM.layers.push(end);
    allBounds = allBounds.concat(latlngs);
    listHtml += teamRow(t, false, color);
  });
  if (allBounds.length) MAP.obj.fitBounds(L.latLngBounds(allBounds), { padding:[40,40] });
  var el = document.getElementById('teamTracksList');
  if (el) el.innerHTML = listHtml || '<div class="team-empty">Brak tras na dziś.</div>';
}

function teamRow(t, empty, color) {
  return '<div class="team-row"><span class="team-dot" style="background:'+(color||'#94a3b8')+'"></span>' +
         '<b>'+t.name+'</b><span class="team-ago">'+(empty ? 'brak trasy' : fmtDist(t.dist))+'</span></div>';
}
function fmtDist(m) { m = m||0; return m>=1000 ? (m/1000).toFixed(2)+' km' : Math.round(m)+' m'; }

// ============================================================
// HEATMAPA POKRYCIA — gdzie zespół już był, a gdzie białe plamy
// ============================================================
// Lekka siatka (~150m). Z punktów tras zespołu liczymy ile osób/przejść
// trafiło w każdą komórkę i kolorujemy od chłodnego (mało) do gorącego (dużo).

var HEAT = { layer: null, on: false, cell: 0.00135 }; // ~150m w stopniach szer.

function toggleHeat() {
  HEAT.on = !HEAT.on;
  updateHeatBtn();
  if (HEAT.on) {
    if (TEAM.mode !== 'team') { fetchTeamTracks(); } // upewnij się że mamy dane
    fetchHeat();
  } else {
    clearHeat();
  }
}
function updateHeatBtn() {
  var b = document.getElementById('heatBtn');
  if (!b) return;
  b.className = 'map-share ' + (HEAT.on ? 'on' : 'off');
  b.innerHTML = HEAT.on ? '🔥 Pokrycie: włączone' : '🗺️ Pokrycie terenu (heatmapa)';
}
function clearHeat() {
  if (HEAT.layer) { MAP.obj.removeLayer(HEAT.layer); HEAT.layer = null; }
}

function fetchHeat() {
  fetch(WEBHOOK + '?action=getTracks&date=' + todayStr())
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || res.status !== 'ok') return;
      drawHeat(res.tracks || []);
    }).catch(function(){});
}

function drawHeat(tracks) {
  clearHeat();
  if (!HEAT.on) return;
  // zlicz trafienia w komórki siatki
  var grid = {}, maxHits = 0;
  tracks.forEach(function(t){
    if (!t.points) return;
    var seenCell = {}; // jedna osoba liczy się raz na komórkę (pokrycie, nie czas postoju)
    t.points.forEach(function(p){
      var gx = Math.floor(p.lat / HEAT.cell);
      var gy = Math.floor(p.lng / HEAT.cell);
      var key = gx + '_' + gy;
      if (seenCell[key]) return;
      seenCell[key] = true;
      grid[key] = (grid[key] || 0) + 1;
      if (grid[key] > maxHits) maxHits = grid[key];
    });
  });
  if (!maxHits) return;
  var rects = [];
  Object.keys(grid).forEach(function(key){
    var parts = key.split('_'), gx = +parts[0], gy = +parts[1];
    var hits = grid[key];
    var lat0 = gx * HEAT.cell, lng0 = gy * HEAT.cell;
    var bounds = [[lat0, lng0], [lat0 + HEAT.cell, lng0 + HEAT.cell]];
    var ratio = hits / maxHits;
    rects.push(L.rectangle(bounds, {
      stroke: false, fillColor: heatColor(ratio), fillOpacity: 0.45
    }));
  });
  HEAT.layer = L.layerGroup(rects).addTo(MAP.obj);
  HEAT.layer.eachLayer(function(l){ l.bringToBack && l.bringToBack(); });
}

function heatColor(r) {
  // chłodny niebieski (mało) -> zielony -> żółty -> czerwony (dużo)
  if (r < 0.25) return '#3b82f6';
  if (r < 0.5)  return '#10d873';
  if (r < 0.75) return '#facc15';
  return '#dc2626';
}
