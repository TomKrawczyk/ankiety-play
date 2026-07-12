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

// Progi jakosci sygnalu — telefon czasem daje BARDZO zgrubna pierwsza pozycje
// (siec/wifi, nie GPS), np. accuracy=50000m. Nie pokazujemy tego jako "Na żywo",
// tylko info ze szukamy lepszego sygnalu — user nie panikuje ze mapa sie myli.
var GEO_ACC_OK    = 100;   // <=100m: dobry GPS, zielony status
var GEO_ACC_SLABY = 1000;  // 100-1000m: srednio, zolty status
// >1000m: to prawie na 100% pozycja z sieci/wifi (nie GPS) — czerwony/info status

function onGeoOk(pos) {
  var lat = pos.coords.latitude, lng = pos.coords.longitude;
  var acc = pos.coords.accuracy || 50;
  var first = !MAP.lastPos;
  MAP.lastPos = { lat: lat, lng: lng, acc: acc };

  // zapis śladu trasy (filtr: tylko sensowne kroki, dobry GPS)
  recordTrackPoint(lat, lng, acc);

  // Krąg dokładności ograniczamy wizualnie (bez tego 50km "bąbel" zakrywa całą mapę)
  var circleRadius = Math.min(acc, 500);

  if (!MAP.meMarker) {
    MAP.meMarker = L.marker([lat, lng], { icon: makeMeIcon(), zIndexOffset: 1000 }).addTo(MAP.obj);
    MAP.meAccuracy = L.circle([lat, lng], {
      radius: circleRadius, color: '#16a34a', weight: 1, fillColor: '#16a34a', fillOpacity: 0.08
    }).addTo(MAP.obj);
  } else {
    MAP.meMarker.setLatLng([lat, lng]);
    MAP.meAccuracy.setLatLng([lat, lng]).setRadius(circleRadius);
  }

  if (first) MAP.obj.setView([lat, lng], MAP_ME_ZOOM);

  if (acc <= GEO_ACC_OK) {
    setGeoStatus('🟢 Na żywo · dokładność ~' + Math.round(acc) + ' m');
  } else if (acc <= GEO_ACC_SLABY) {
    setGeoStatus('🟡 Doprecyzowuję pozycję · ~' + Math.round(acc) + ' m');
  } else {
    // To jest lokalizacja z sieci/WiFi, nie z GPS — czekamy na lepszy fix,
    // ale nie blokujemy gry (marker i tak sie aktualizuje).
    var km = (acc / 1000).toFixed(acc >= 10000 ? 0 : 1);
    setGeoStatus('📡 Szukam GPS (obecnie z sieci, błąd ~' + km + ' km)');
    if (first) {
      setTimeout(function () {
        showToast('💡 Słaby sygnał GPS — sprawdź w ustawieniach telefonu tryb lokalizacji "Wysoka dokładność" i włącz GPS + dane mobilne/WiFi');
      }, 1200);
    }
  }
  updateNearbyHint();
  ensureWildSpawns();
  checkWildCatch();
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
    startWild();
  }, 60);
}

// ============================================================
// PRESENCE — żywe pozycje zespołu (kto jest teraz w terenie)
// ============================================================
// Wysyłanie własnej pozycji + pobieranie kolegów co PRESENCE_EVERY ms.
// Wyłączenie udostępniania = status "ukryty" (sygnał dla lidera, że nie pracuje).

var PRESENCE_SEND_EVERY  = 120000;  // 2 min — wysyłka własnej pozycji
var PRESENCE_FETCH_EVERY = 180000;  // 3 min — pobieranie kolegów
var MATE = { markers: {}, sendTimer: null, fetchTimer: null, isAdmin: false, nearbyKm: null };

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
  var q = '?action=getPresence&viewer=' + encodeURIComponent(window._user || '');
  if (MAP.lastPos) { q += '&vlat=' + MAP.lastPos.lat + '&vlng=' + MAP.lastPos.lng; }
  fetch(WEBHOOK + q)
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || res.status !== 'ok' || !Array.isArray(res.agents)) return;
      MATE.isAdmin = !!res.viewerAdmin;
      MATE.nearbyKm = res.nearbyKm || null;
      drawMates(res.agents);
      if (FOLLOW.active) onFollowPresenceUpdate(res.agents);
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
  var head;
  if (MATE.isAdmin) {
    head = '🛡️ Widok admina — wszyscy ankieterzy (' + active.length + ' aktywnych)';
  } else {
    head = '👥 W okolicy' + (MATE.nearbyKm ? ' (do ' + MATE.nearbyKm + ' km)' : '') + ' — ' + active.length + ' aktywnych';
  }
  var html = '<div class="team-h">' + head + '</div>';
  active.forEach(function(a){
    var followBtn = (MATE.isAdmin && typeof a.lat === 'number' && typeof a.lng === 'number')
      ? '<button class="team-follow-btn" onclick="startFollow(\'' + a.name.replace(/'/g, "\\'") + '\')">🎯 Śledź</button>'
      : '';
    html += '<div class="team-row"><span class="team-dot ok"></span>' +
            '<b>' + a.name + '</b><span class="team-ago">' + agoTxt(a.ageSec) + '</span>' + followBtn + '</div>';
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

// ============================================================
// 🎲 DZIKIE LEADY (pokestopy) — losowe punkty XP w terenie
// ============================================================
// Wokół gracza pojawiają się "dzikie leady". Wejdź w zasięg (~30 m),
// żeby je zebrać i zgarnąć bonus XP. Odnawiają się co jakiś czas.
// Wszystko lokalnie (per użytkownik) — bez zmian w backendzie.

var WILD = {
  markers: {},        // id -> Leaflet marker
  spawnTimer: null,
  count: 4,           // ile dzikich leadów utrzymywać wokół gracza
  radiusMin: 80,      // m — najbliższy spawn
  radiusMax: 320,     // m — najdalszy spawn
  catchDist: 35,      // m — w tym zasięgu zbierasz lead
  respawnEvery: 90000 // ms — co ile dosypywać brakujące
};

// typy dzikich leadów: waga losowania + XP + wygląd
var WILD_TYPES = [
  { key: 'mini',  emoji: '✨', xp: 15,  color: '#60a5fa', glow: 'rgba(96,165,250,.7)',  label: 'Iskra'    , weight: 50 },
  { key: 'std',   emoji: '⚡', xp: 30,  color: '#10d873', glow: 'rgba(16,216,115,.7)',  label: 'Lead'     , weight: 32 },
  { key: 'rare',  emoji: '💎', xp: 60,  color: '#a855f7', glow: 'rgba(168,85,247,.75)', label: 'Rzadki'   , weight: 14 },
  { key: 'gold',  emoji: '👑', xp: 120, color: '#facc15', glow: 'rgba(250,204,21,.8)',  label: 'Złoty'    , weight: 4  }
];

function wildKey() { return mapKey('wild'); }
function loadWild() {
  try { return JSON.parse(localStorage.getItem(wildKey()) || '[]'); }
  catch (e) { return []; }
}
function saveWild(arr) {
  try { localStorage.setItem(wildKey(), JSON.stringify(arr)); } catch (e) {}
}

// losuj typ wg wag
function pickWildType() {
  var total = 0; WILD_TYPES.forEach(function (t) { total += t.weight; });
  var r = Math.random() * total;
  for (var i = 0; i < WILD_TYPES.length; i++) {
    r -= WILD_TYPES[i].weight;
    if (r <= 0) return WILD_TYPES[i];
  }
  return WILD_TYPES[0];
}
function wildTypeByKey(k) {
  for (var i = 0; i < WILD_TYPES.length; i++) if (WILD_TYPES[i].key === k) return WILD_TYPES[i];
  return WILD_TYPES[0];
}

// Pole wielokąta budynku w m² (z geometrii Overpass "geom").
// Wzór trapezów na sferze (lokalne przybliżenie). Brak geometrii -> 0.
function polyAreaM2(geom) {
  if (!geom || geom.length < 3) return 0;
  var R = 6378137;
  var a = 0;
  for (var i = 0; i < geom.length; i++) {
    var p1 = geom[i], p2 = geom[(i + 1) % geom.length];
    if (!p1 || !p2) continue;
    var lon1 = p1.lon * Math.PI / 180, lon2 = p2.lon * Math.PI / 180;
    var lat1 = p1.lat * Math.PI / 180, lat2 = p2.lat * Math.PI / 180;
    a += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(a * R * R / 2);
}

// przesuń punkt o (dist metrów) pod losowym kątem
function offsetLatLng(lat, lng, distM) {
  var ang = Math.random() * 2 * Math.PI;
  var dLat = (distM * Math.cos(ang)) / 111320;
  var dLng = (distM * Math.sin(ang)) / (111320 * Math.cos(lat * Math.PI / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

// utrzymuj WILD.count dzikich leadów wokół gracza
function ensureWildSpawns() {
  if (!MAP.lastPos) return;
  var arr = loadWild();
  // odrzuć zbyt stare (>30 min) lub bardzo oddalone (>1 km) — żeby nie wisiały w nieskończoność
  var now = Date.now();
  arr = arr.filter(function (w) {
    if (now - (w.born || 0) > 30 * 60000) return false;
    if (distM({ lat: w.lat, lng: w.lng }, MAP.lastPos) > 1000) return false;
    return true;
  });
  // upewnij sie, ze mamy swieze budynki wokol gracza (OSM) — async, nie blokuje
  ensureBuildings();

  while (arr.length < WILD.count) {
    var p = pickSpawnPoint();   // preferuj realny budynek; fallback = losowy offset
    if (!p) break;              // brak danych i brak fallbacku — odpusc do nastepnego razu
    // typ dzikiego leada DOBRANY do zabudowy: gospodarstwo/duży -> cenny lead
    var t = wildTypeForTier(p.tier);
    arr.push({
      id: 'w' + now + '_' + Math.floor(Math.random() * 1e6),
      lat: p.lat, lng: p.lng, type: t.key, xp: t.xp, born: now,
      kind: p.kind || null   // co reprezentuje (Gospodarstwo rolne / Duży dom / Dom)
    });
  }
  saveWild(arr);
  renderWildOnMap();
}

// ── SPAWN NA TERENIE: wybierz punkt na realnym budynku w pobliżu ──
// Priorytet: budynki mieszkalne w zasięgu (radiusMin..radiusMax) od gracza.
// Mały offset, żeby pin „siedział” na budynku, a nie idealnie w jego środku.
function pickSpawnPoint() {
  var pool = OSM.buildings;
  if (pool && pool.length && MAP.lastPos) {
    // budynki w sensownym zasięgu spaceru
    var inRange = pool.filter(function (b) {
      var d = distM(b, MAP.lastPos);
      return d >= 25 && d <= WILD.radiusMax;
    });
    var cand = inRange.length ? inRange : pool;
    if (cand.length) {
      // Ważony wybór: gospodarstwa/duże budynki mają większą szansę być
      // wylosowane jako miejsce spawnu (to one są najlepszymi leadami).
      var b = pickWeightedBuilding(cand);
      // delikatny offset ~6-12 m, by piny się nie nakładały
      var jitter = offsetLatLng(b.lat, b.lng, 6 + Math.random() * 6);
      // niesiemy tier/kind budynku, by dobrać typ dzikiego leada do zabudowy
      return { lat: jitter.lat, lng: jitter.lng, tier: b.tier || 'std', kind: b.kind || 'Dom' };
    }
  }
  // FALLBACK (brak danych OSM / offline): stary losowy offset, typ losowy
  var d = WILD.radiusMin + Math.random() * (WILD.radiusMax - WILD.radiusMin);
  var fp = offsetLatLng(MAP.lastPos.lat, MAP.lastPos.lng, d);
  fp.tier = null; fp.kind = null;
  return fp;
}

// Losuje budynek z puli z wagą wg potencjału (gospodarstwo/duży > zwykły dom).
function pickWeightedBuilding(cand) {
  var W = { gold: 6, rare: 3, std: 1 };
  var total = 0, i;
  for (i = 0; i < cand.length; i++) total += (W[cand[i].tier] || 1);
  var r = Math.random() * total;
  for (i = 0; i < cand.length; i++) {
    r -= (W[cand[i].tier] || 1);
    if (r <= 0) return cand[i];
  }
  return cand[cand.length - 1];
}

// Dobór typu dzikiego leada do potencjału zabudowy.
// Gospodarstwo/duży obiekt -> Złoty; duży dom -> Rzadki; zwykły dom -> losowo
// mini/std (z lekkim biasem). Brak danych (fallback) -> czysto losowy typ.
function wildTypeForTier(tier) {
  if (tier === 'gold') return wildTypeByKey('gold');
  if (tier === 'rare') return wildTypeByKey('rare');
  if (tier === 'std') {
    return Math.random() < 0.45 ? wildTypeByKey('std') : wildTypeByKey('mini');
  }
  return pickWildType(); // brak klasyfikacji -> stary los wg wag
}

// ── OSM BUILDINGS: pobierz budynki mieszkalne wokół gracza (Overpass) ──
var OSM = {
  buildings: [],      // [{lat,lng}]
  center: null,       // ostatnie centrum pobrania
  fetching: false,
  lastFetch: 0,
  refetchDist: 250,   // m — gdy gracz odejdzie tyle, dociągamy nowe
  ttl: 10 * 60000     // ms — odśwież dane po 10 min
};

function ensureBuildings() {
  if (!MAP.lastPos || OSM.fetching) return;
  var now = Date.now();
  var stale = (now - OSM.lastFetch) > OSM.ttl;
  var moved = OSM.center ? distM(OSM.center, MAP.lastPos) > OSM.refetchDist : true;
  if (OSM.buildings.length && !stale && !moved) return; // mamy aktualne dane
  fetchBuildings(MAP.lastPos.lat, MAP.lastPos.lng);
}

function fetchBuildings(lat, lng) {
  if (OSM.fetching) return;
  OSM.fetching = true;
  // Promień nieco większy niż max spawn, by mieć zapas budynków
  var R = Math.round(WILD.radiusMax + 150);
  // Preferuj budynki mieszkalne; dorzuć nieotagowane (yes), pomiń przemysł/handel
  // Pobieramy: domy mieszkalne + GOSPODARSTWA ROLNE (farm/farmyard/barn) +
  // budynki rolnicze. Geometrię (geom) bierzemy, by oszacować POWIERZCHNIĘ
  // budynku — duże bryły = większe zużycie = lepszy dziki lead.
  var q = '[out:json][timeout:25];(' +
    'way["building"~"house|residential|apartments|detached|terrace|semidetached_house|bungalow|farm|farmyard|barn|farm_auxiliary|cowshed|stable|yes"](around:' + R + ',' + lat + ',' + lng + ');' +
    'way["landuse"="farmyard"](around:' + R + ',' + lat + ',' + lng + ');' +
    'node["building"~"house|residential|detached|apartments|farm"](around:' + R + ',' + lat + ',' + lng + ');' +
    ');out center geom 250;';
  var mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];
  var mi = 0;
  function tryFetch() {
    fetch(mirrors[mi], { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'data=' + encodeURIComponent(q) })
    .then(function (r) {
      if (!r.ok) throw new Error('bad status ' + r.status);
      return r.json();
    })
    .then(function (res) {
      var els = (res && res.elements) ? res.elements : [];
      var blocked = { industrial: 1, commercial: 1, retail: 1, warehouse: 1, manufacture: 1, garage: 1, garages: 1, hangar: 1, kiosk: 1, service: 1, roof: 1 };
      var farmTags = { farm: 1, farmyard: 1, barn: 1, farm_auxiliary: 1, cowshed: 1, stable: 1 };
      var mine = [], other = [];
      els.forEach(function (e) {
        var c = e.center || e;
        if (typeof c.lat !== 'number' || typeof c.lon !== 'number') return;
        var tags = e.tags || {};
        var bt = tags.building || (tags.landuse === 'farmyard' ? 'farmyard' : 'yes');
        if (blocked[bt]) return;                       // odetnij hale/parkingi/magazyny

        // szacuj powierzchnię budynku z geometrii (m²) — duże bryły = duże zużycie
        var area = polyAreaM2(e.geometry);

        // KLASYFIKACJA POTENCJAŁU (tier): co stoi w terenie -> jaki dziki lead
        //  gold = gospodarstwo rolne / bardzo duży budynek (>350 m²)
        //  rare = duży dom / budynek (>180 m²)
        //  std  = zwykły dom mieszkalny
        var tier, kind;
        if (farmTags[bt] || tags.landuse === 'farmyard') {
          tier = 'gold'; kind = 'Gospodarstwo rolne';
        } else if (area > 350) {
          tier = 'gold'; kind = 'Duży obiekt';
        } else if (area > 180) {
          tier = 'rare'; kind = 'Duży dom';
        } else {
          tier = 'std';  kind = 'Dom';
        }

        var pt = { lat: c.lat, lng: c.lon, tier: tier, kind: kind, area: Math.round(area) };
        if (bt === 'yes' && !area) other.push(pt); else mine.push(pt);
      });
      // budynki z konkretem (mieszkalne/rolne/duże) pierwsze; dolej nieotagowane
      OSM.buildings = mine.length >= 6 ? mine : mine.concat(other);
      OSM.center = { lat: lat, lng: lng };
      OSM.lastFetch = Date.now();
      OSM.fetching = false;
      // od razu spróbuj rozstawić leady na świeżych budynkach
      try { ensureWildSpawns(); } catch (e) {}
    })
    .catch(function () {
      mi++;
      if (mi < mirrors.length) { tryFetch(); return; }  // spróbuj kolejnego mirrora
      OSM.fetching = false;   // wszystkie padły — zostaje fallback losowy
    });
  }
  tryFetch();
}

function makeWildIcon(t) {
  var html =
    '<div class="wild-pin" style="--wc:' + t.color + ';--wg:' + t.glow + '">' +
      '<div class="wild-pulse"></div>' +
      '<div class="wild-core">' + t.emoji + '</div>' +
    '</div>';
  return L.divIcon({ className: 'wild-div', html: html, iconSize: [40, 40], iconAnchor: [20, 20] });
}

function renderWildOnMap() {
  if (!MAP.obj) return;
  // usuń znaczniki, których nie ma już w danych
  var arr = loadWild();
  var live = {};
  arr.forEach(function (w) { live[w.id] = true; });
  Object.keys(WILD.markers).forEach(function (id) {
    if (!live[id]) { MAP.obj.removeLayer(WILD.markers[id]); delete WILD.markers[id]; }
  });
  // dodaj brakujące
  arr.forEach(function (w) {
    if (WILD.markers[w.id]) return;
    var t = wildTypeByKey(w.type);
    var m = L.marker([w.lat, w.lng], { icon: makeWildIcon(t), zIndexOffset: 500 })
      .addTo(MAP.obj)
      .bindPopup('<b>' + t.emoji + ' ' + t.label + '</b>' +
        (w.kind ? '<br><span style="color:' + t.color + ';font-weight:700">📍 ' + w.kind + '</span>' : '') +
        '<br>+' + t.xp + ' XP<br><small>Podejdź bliżej, żeby zebrać</small>');
    WILD.markers[w.id] = m;
  });
}

// sprawdź, czy gracz wszedł w zasięg jakiegoś dzikiego leada
function checkWildCatch() {
  if (!MAP.lastPos) return;
  var arr = loadWild();
  var remaining = [];
  var collected = null;
  arr.forEach(function (w) {
    if (!collected && distM({ lat: w.lat, lng: w.lng }, MAP.lastPos) <= WILD.catchDist) {
      collected = w; // zbierz tylko jeden na raz (kolejne przy następnym kroku)
    } else {
      remaining.push(w);
    }
  });
  if (collected) {
    saveWild(remaining);
    if (WILD.markers[collected.id]) {
      MAP.obj.removeLayer(WILD.markers[collected.id]);
      delete WILD.markers[collected.id];
    }
    collectWild(collected);
  }
}

function collectWild(w) {
  var t = wildTypeByKey(w.type);
  // dolicz XP graczowi — BEZ zwiększania liczby ankiet (to nie ankieta)
  awardWildXp(window._user, t.xp);
  playWildAnim(t);
  // dosyp nowy, żeby zawsze było co zbierać
  setTimeout(ensureWildSpawns, 800);
}

// dodanie XP za dzikiego leada (osobne od addXP — nie rusza total/hot/streak)
function awardWildXp(name, amount) {
  if (!name) return;
  try {
    var us = getUsers(), k = name.toLowerCase();
    if (!us[k]) return;
    var oldLv = (typeof getLv === 'function') ? getLv(us[k].xp || 0).level : 0;
    us[k].xp = (us[k].xp || 0) + amount;
    saveUsers(us);
    // odśwież UI XP jeśli dostępne
    if (typeof updateUI === 'function') updateUI(name);
    var newLv = (typeof getLv === 'function') ? getLv(us[k].xp || 0).level : 0;
    if (newLv > oldLv && typeof lvFlash === 'function') {
      lvFlash();
      if (typeof showToast === 'function') showToast('🎉 LEVEL UP! Jesteś Level ' + newLv + '!');
    }
    // zaktualizuj ranking serwerowy (XP się zmieniło)
    if (typeof pushRanking === 'function') {
      pushRanking(us[k].name, us[k].xp || 0, us[k].total || 0, us[k].hot || 0, us[k].streak || 0, 0);
    }
  } catch (e) {}
}

// animacja zebrania dzikiego leada
function playWildAnim(t) {
  var ov = document.createElement('div');
  ov.className = 'wild-anim-ov';
  ov.innerHTML =
    '<div class="wild-burst" style="--wc:' + t.color + '"></div>' +
    '<div class="wild-emoji">' + t.emoji + '</div>' +
    '<div class="wild-xp" style="--wc:' + t.color + '">+' + t.xp + ' XP</div>' +
    '<div class="wild-lbl">' + t.label + ' zebrany!</div>';
  document.body.appendChild(ov);
  if (typeof playSound === 'function') { try { playSound('catch'); } catch (e) {} }
  setTimeout(function () { ov.classList.add('go'); }, 20);
  setTimeout(function () { ov.classList.add('out'); }, 1300);
  setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 1700);
}

// start systemu dzikich leadów (wywoływane z renderMapa)
function startWild() {
  ensureWildSpawns();
  if (WILD.spawnTimer) clearInterval(WILD.spawnTimer);
  WILD.spawnTimer = setInterval(ensureWildSpawns, WILD.respawnEvery);
}

// ============================================================
// ŚLEDZENIE NA ŻYWO — tryb "Endomondo" dla wybranego ankietera
// ============================================================
// Tylko admin (dws/PRESENCE_ADMINS). Po kliknięciu "🎯 Śledź" na kimś:
//  - odświeżanie pozycji przyspiesza z 3 min do FOLLOW_PRESENCE_EVERY
//  - dociągana jest cała dzisiejsza trasa tej osoby (getTracks) i rysowana
//    grubą, złotą linią, odświeżaną co FOLLOW_TRACK_EVERY
//  - mapa automatycznie centruje się na tej osobie po każdej aktualizacji
//  - panel na mapie pokazuje: status, ostatnia aktualizacja, dystans dziś

var FOLLOW = {
  active: false,
  name: null,
  trailLine: null,
  marker: null,
  trackTimer: null,
  autoCenter: true,
  lastPt: null
};
var FOLLOW_PRESENCE_EVERY = 10000;  // 10 s — pozycja podczas śledzenia (zamiast 3 min)
var FOLLOW_TRACK_EVERY    = 20000;  // 20 s — pełna trasa podczas śledzenia

function startFollow(name) {
  if (!MATE.isAdmin) return; // tylko admin moze sledzic konkretna osobe
  FOLLOW.active = true;
  FOLLOW.name = name;
  FOLLOW.lastPt = null;

  // przyspiesz odswiezanie prezencji na czas sledzenia
  if (MATE.fetchTimer) { clearInterval(MATE.fetchTimer); }
  MATE.fetchTimer = setInterval(fetchMates, FOLLOW_PRESENCE_EVERY);
  fetchMates();

  // odpal petle sciagania pelnej trasy
  if (FOLLOW.trackTimer) clearInterval(FOLLOW.trackTimer);
  FOLLOW.trackTimer = setInterval(fetchFollowTrack, FOLLOW_TRACK_EVERY);
  fetchFollowTrack();

  showFollowPanel();
}

function stopFollow() {
  FOLLOW.active = false;
  FOLLOW.name = null;

  // wroc do normalnego tempa odswiezania
  if (MATE.fetchTimer) { clearInterval(MATE.fetchTimer); }
  MATE.fetchTimer = setInterval(fetchMates, PRESENCE_FETCH_EVERY);

  if (FOLLOW.trackTimer) { clearInterval(FOLLOW.trackTimer); FOLLOW.trackTimer = null; }
  if (FOLLOW.trailLine) { MAP.obj.removeLayer(FOLLOW.trailLine); FOLLOW.trailLine = null; }

  hideFollowPanel();
}

function toggleFollowAutoCenter() {
  FOLLOW.autoCenter = !FOLLOW.autoCenter;
  var b = document.getElementById('followCenterBtn');
  if (b) b.textContent = FOLLOW.autoCenter ? '🎯 Auto-centruj: wł.' : '⚪ Auto-centruj: wył.';
}

// woane po kazdym fetchMates() gdy FOLLOW.active — centruje mape + odswieza panel
function onFollowPresenceUpdate(agents) {
  if (!FOLLOW.active) return;
  var a = agents.find(function (x) { return x.name === FOLLOW.name; });
  updateFollowPanel(a);
  if (a && typeof a.lat === 'number' && typeof a.lng === 'number' && FOLLOW.autoCenter && MAP.obj) {
    MAP.obj.setView([a.lat, a.lng], Math.max(MAP.obj.getZoom(), MAP_ME_ZOOM), { animate: true });
  }
}

// dociagnij cala dzisiejsza trase sledzonej osoby i narysuj wyrozniona linia
function fetchFollowTrack() {
  if (!FOLLOW.active) return;
  fetch(WEBHOOK + '?action=getTracks&date=' + todayStr())
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!FOLLOW.active || !res || res.status !== 'ok' || !Array.isArray(res.tracks)) return;
      var t = res.tracks.find(function (x) { return x.name === FOLLOW.name; });
      if (!t) return;
      drawFollowTrail(t.points || []);
      updateFollowStats(t);
    })
    .catch(function () {});
}

function drawFollowTrail(points) {
  if (!MAP.ready || !MAP.obj) return;
  if (FOLLOW.trailLine) { MAP.obj.removeLayer(FOLLOW.trailLine); FOLLOW.trailLine = null; }
  if (!points || points.length < 2) return;
  var latlngs = points.map(function (p) { return [p.lat, p.lng]; });
  FOLLOW.trailLine = L.polyline(latlngs, {
    color: '#c9a875', weight: 5, opacity: 0.95,
    lineJoin: 'round', lineCap: 'round'
  }).addTo(MAP.obj).bringToFront();
  FOLLOW.lastPt = points[points.length - 1];
}

// ── PANEL "śledzenie na żywo" (pokazuje sie nad mapa) ──
function showFollowPanel() {
  var el = document.getElementById('followPanel');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML =
    '<div class="follow-head">🎯 Śledzenie na żywo: <b>' + FOLLOW.name + '</b>' +
    '<button class="follow-close" onclick="stopFollow()">✕</button></div>' +
    '<div id="followStatus" class="follow-body">📡 Łączę się…</div>' +
    '<div id="followStats" class="follow-body follow-stats"></div>' +
    '<button id="followCenterBtn" class="follow-center-btn" onclick="toggleFollowAutoCenter()">🎯 Auto-centruj: wł.</button>';
}

function hideFollowPanel() {
  var el = document.getElementById('followPanel');
  if (el) { el.style.display = 'none'; el.innerHTML = ''; }
}

// zaktualizuj status (pozycja/wiek sygnalu) sledzonej osoby — niezalezny blok od statystyk trasy
function updateFollowPanel(agent) {
  var el = document.getElementById('followStatus');
  if (!el || !FOLLOW.active) return;
  if (!agent || typeof agent.lat !== 'number') {
    el.innerHTML = '⚠️ Brak świeżej pozycji tej osoby (starsza niż ' + Math.round(PRESENCE_TTL_MS / 60000) + ' min lub pozycja ukryta).';
    return;
  }
  var statusTxt = agent.status === 'ukryty' ? '🚫 Ukryty' : '🟢 Na żywo';
  el.innerHTML =
    '<div>' + statusTxt + ' · aktualizacja ' + (agent.ageSec < 5 ? 'teraz' : agent.ageSec + ' s temu') + '</div>' +
    '<div class="follow-coords">📍 ' + agent.lat.toFixed(5) + ', ' + agent.lng.toFixed(5) +
    (agent.acc ? ' · dokładność ~' + Math.round(agent.acc) + ' m' : '') + '</div>';
}

// dolacz statystyki trasy (dystans/liczba punktow/stref) — osobny blok, niezalezny od statusu
function updateFollowStats(t) {
  var el = document.getElementById('followStats');
  if (!el || !FOLLOW.active) return;
  var m = Number(t.dist) || 0;
  var distTxt = m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m';
  el.innerHTML = '🚶 Dziś: <b>' + distTxt + '</b> · ' + (t.count || 0) + ' pkt · ' + (t.zones || 0) + ' stref';
}
