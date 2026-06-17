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
  }, 60);
}
