(() => {
  const LS_FAVORITES = 'toco_favorites';

  let selectedCircuit = null;
  let selectedStation = null;
  let countdownTimer  = null;
  let leafletMap      = null;
  let busMarkers      = [];
  let stopMarkers     = [];
  let activeMapCircuits = new Set(CIRCUITS.map(c => c.id));

  // ── Helpers ───────────────────────────────────────────────
  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToHHMM(min) {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  }

  function getUpcomingBuses(circuit, station) {
    const now    = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const results = [];
    for (const dep of circuit.departures) {
      const arrivalMin = toMinutes(dep) + station.offset;
      if (arrivalMin > nowMin - 0.5) {
        results.push({
          time:     minutesToHHMM(arrivalMin),
          totalMin: arrivalMin,
          date:     new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                      Math.floor(arrivalMin / 60), arrivalMin % 60, 0),
        });
      }
      if (results.length >= 5) break;
    }
    return results;
  }

  function formatCountdown(targetDate) {
    const diff     = targetDate - Date.now();
    if (diff < 0) return '発車済み';
    const totalSec = Math.floor(diff / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}時間 ${m}分 ${s}秒`;
    if (m > 0) return `${m}分 ${s}秒`;
    return `${s}秒`;
  }

  function calcDistance(lat1, lng1, lat2, lng2) {
    const R  = 6371;
    const dL = (lat2 - lat1) * Math.PI / 180;
    const dG = (lng2 - lng1) * Math.PI / 180;
    const a  = Math.sin(dL / 2) ** 2 +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dG / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── URL routing ───────────────────────────────────────────
  // 書式: #/  #/c/1  #/c/1/s/0
  //
  // ナビゲーション方針:
  //   ボタンクリック → view を直接更新 + history.pushState (hashchange 発火なし)
  //   ブラウザ戻る/進む → hashchange で parseHash → renderFromHash
  //
  // history.pushState はイベントを発火しないので pjax に干渉しない。
  // hashchange はブラウザの戻る/進むのみで発火し、pjax の popstate とは独立。

  function parseHash() {
    const path = (location.hash.slice(1) || '/').replace(/^\//, '');
    const m = path.match(/^c\/(\d+)(?:\/s\/(\d+))?$/);
    if (!m) return { circuitId: null, stationId: null };
    return {
      circuitId: Number(m[1]),
      stationId: m[2] != null ? Number(m[2]) : null,
    };
  }

  function pushHashSilent(hashPath) {
    // history.pushState はイベントを発火しない
    history.pushState(null, '', location.pathname + '#/' + hashPath);
  }

  // ブラウザ戻る/進む専用
  window.addEventListener('hashchange', renderFromHash);

  // ── Favorites CRUD ────────────────────────────────────────
  function loadFavorites() {
    try { return JSON.parse(localStorage.getItem(LS_FAVORITES)) || []; }
    catch { return []; }
  }

  function saveFavorites(favs) {
    localStorage.setItem(LS_FAVORITES, JSON.stringify(favs));
  }

  function isFavorite(circuitId, stationId) {
    return loadFavorites().some(f => f.circuitId === circuitId && f.stationId === stationId);
  }

  function toggleFavorite(circuit, station) {
    const favs = loadFavorites();
    const idx  = favs.findIndex(f => f.circuitId === circuit.id && f.stationId === station.id);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push({ circuitId: circuit.id, stationId: station.id,
                  circuitName: circuit.name, stationName: station.name,
                  color: circuit.color, bg: circuit.bg });
    }
    saveFavorites(favs);
    renderFavButton();
    renderFavTab();
  }

  // ── Tab switching ─────────────────────────────────────────
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.toco-tab').forEach(el => {
        el.classList.toggle('active', el.id === `tab-${tabId}`);
      });
      if (tabId === 'map') {
        initMap();
        if (leafletMap) setTimeout(() => leafletMap.invalidateSize(), 50);
      }
      if (tabId === 'fav') renderFavTab();
    });
  });

  // ── Navigation functions ──────────────────────────────────
  // ビューを直接更新し、URL を pushState で更新する（hashchange 非発火）

  function goToCircuits() {
    selectedCircuit = null;
    selectedStation = null;
    renderCircuitView();
    pushHashSilent('');
  }

  function goToStations(circuit) {
    selectedCircuit = circuit;
    renderStationView();
    showTimetableView('station');
    pushHashSilent('c/' + circuit.id);
  }

  function goToTimetable(circuit, station) {
    selectedCircuit = circuit;
    selectedStation = station;
    renderTimetableView();
    showTimetableView('timetable');
    pushHashSilent('c/' + circuit.id + '/s/' + station.id);
  }

  // ブラウザ戻る/進む経由でのレンダリング
  function renderFromHash() {
    const { circuitId, stationId } = parseHash();
    if (circuitId == null) {
      selectedCircuit = null;
      selectedStation = null;
      renderCircuitView();
      return;
    }
    const circuit = CIRCUITS.find(c => c.id === circuitId);
    if (!circuit) { renderCircuitView(); return; }
    selectedCircuit = circuit;
    if (stationId == null) {
      renderStationView();
      showTimetableView('station');
      return;
    }
    const station = circuit.stations.find(s => s.id === stationId);
    if (!station) { renderStationView(); showTimetableView('station'); return; }
    selectedStation = station;
    renderTimetableView();
    showTimetableView('timetable');
  }

  // ── View: Circuit Selection ───────────────────────────────
  function renderCircuitView() {
    const container = document.getElementById('circuit-list');
    container.innerHTML = '';
    CIRCUITS.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'circuit-btn';
      btn.style.setProperty('--c-color', c.color);
      btn.style.setProperty('--c-bg', c.bg);
      btn.textContent = c.name + '循環';
      btn.addEventListener('click', () => goToStations(c));
      container.appendChild(btn);
    });
    showTimetableView('circuit');
  }

  function showTimetableView(name) {
    ['circuit', 'station', 'timetable'].forEach(v => {
      document.getElementById(`view-${v}`).style.display = (v === name) ? '' : 'none';
    });
  }

  // ── View: Station Selection ───────────────────────────────
  function renderStationView() {
    document.getElementById('station-title').textContent =
      selectedCircuit.name + '循環　停留所を選択';
    document.getElementById('station-title').style.color = selectedCircuit.color;
    const list = document.getElementById('station-list');
    list.innerHTML = '';
    selectedCircuit.stations.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'station-btn';
      btn.textContent = s.name;
      btn.addEventListener('click', () => goToTimetable(selectedCircuit, s));
      list.appendChild(btn);
    });
  }

  // ── View: Timetable ───────────────────────────────────────
  function renderTimetableView() {
    document.getElementById('tt-circuit').textContent  = selectedCircuit.name + '循環';
    document.getElementById('tt-circuit').style.color  = selectedCircuit.color;
    document.getElementById('tt-station').textContent  = selectedStation.name;
    document.getElementById('tt-note').textContent     = selectedCircuit.note;
    renderFavButton();
    updateTimetable();
  }

  function renderFavButton() {
    const btn = document.getElementById('btn-fav-toggle');
    if (!selectedCircuit || !selectedStation) return;
    const active = isFavorite(selectedCircuit.id, selectedStation.id);
    btn.textContent = active ? '★ お気に入り済み' : '☆ お気に入り追加';
    btn.classList.toggle('fav-active', active);
  }

  function updateTimetable() {
    if (!selectedCircuit || !selectedStation) return;
    const buses     = getUpcomingBuses(selectedCircuit, selectedStation);
    const container = document.getElementById('tt-buses');
    container.innerHTML = '';
    if (buses.length === 0) {
      const p = document.createElement('p');
      p.className   = 'no-bus';
      p.textContent = '本日のバスは終了しました。';
      container.appendChild(p);
      return;
    }
    buses.forEach((bus, i) => {
      const card  = document.createElement('div');
      card.className = 'bus-card' + (i === 0 ? ' bus-card--next' : '');
      card.style.setProperty('--c-color', selectedCircuit.color);
      card.style.setProperty('--c-bg',    selectedCircuit.bg);
      const timeEl = document.createElement('div');
      timeEl.className   = 'bus-time';
      timeEl.textContent = bus.time;
      const cdEl = document.createElement('div');
      cdEl.className       = 'bus-countdown';
      cdEl.dataset.target  = bus.date.getTime();
      cdEl.textContent     = formatCountdown(bus.date);
      card.appendChild(timeEl);
      card.appendChild(cdEl);
      container.appendChild(card);
    });
  }

  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      if (!document.getElementById('tab-timetable').classList.contains('active')) return;
      if (document.getElementById('view-timetable').style.display === 'none') return;
      document.querySelectorAll('.bus-countdown').forEach(el => {
        const target = new Date(Number(el.dataset.target));
        const text   = formatCountdown(target);
        el.textContent = text;
        if (text === '発車済み') updateTimetable();
      });
    }, 1000);
  }

  // ── Favorites Tab ─────────────────────────────────────────
  function renderFavTab() {
    const favs    = loadFavorites();
    const empty   = document.getElementById('fav-empty');
    const list    = document.getElementById('fav-list');
    list.innerHTML = '';
    empty.hidden   = favs.length > 0;
    favs.forEach(f => {
      const circuit = CIRCUITS.find(c => c.id === f.circuitId);
      const station = circuit && circuit.stations.find(s => s.id === f.stationId);
      if (!circuit || !station) return;
      const item = document.createElement('div');
      item.className = 'fav-item';
      const dot = document.createElement('div');
      dot.className        = 'fav-dot';
      dot.style.background = f.color;
      const info = document.createElement('div');
      info.className = 'fav-info';
      info.innerHTML =
        `<div class="fav-station">${f.stationName}</div>
         <div class="fav-circuit">${f.circuitName}循環</div>`;
      info.addEventListener('click', () => {
        document.querySelector('[data-tab="timetable"]').click();
        goToTimetable(circuit, station);
      });
      const del = document.createElement('button');
      del.className   = 'fav-delete';
      del.textContent = '✕';
      del.addEventListener('click', () => {
        const all = loadFavorites().filter(
          x => !(x.circuitId === f.circuitId && x.stationId === f.stationId)
        );
        saveFavorites(all);
        renderFavTab();
        renderFavButton();
      });
      item.appendChild(dot);
      item.appendChild(info);
      item.appendChild(del);
      list.appendChild(item);
    });
  }

  // ── Nearby Tab ────────────────────────────────────────────
  document.getElementById('btn-locate').addEventListener('click', () => {
    const status = document.getElementById('near-status');
    status.textContent = '現在地を取得中...';
    document.getElementById('near-list').innerHTML = '';
    if (!navigator.geolocation) {
      status.textContent = '位置情報はこのブラウザでは利用できません。';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        status.textContent = '現在地から近い順に表示しています。';
        renderNearbyStops(lat, lng);
      },
      () => { status.textContent = '位置情報の取得に失敗しました。設定を確認してください。'; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  function renderNearbyStops(userLat, userLng) {
    const candidates = [];
    CIRCUITS.forEach(circuit => {
      circuit.stations.forEach(station => {
        candidates.push({ circuit, station, dist: calcDistance(userLat, userLng, station.lat, station.lng) });
      });
    });
    candidates.sort((a, b) => a.dist - b.dist);
    const seen = new Set();
    const results = candidates.filter(({ circuit, station }) => {
      const key = `${circuit.id}-${station.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 15);
    const list = document.getElementById('near-list');
    list.innerHTML = '';
    results.forEach(({ circuit, station, dist }) => {
      const distText = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
      const buses = getUpcomingBuses(circuit, station);
      const item = document.createElement('div');
      item.className = 'near-item';
      item.innerHTML =
        `<div class="near-dot" style="background:${circuit.color}"></div>
         <div class="near-info">
           <div class="near-name">${station.name}</div>
           <div class="near-circuit">${circuit.name}循環${buses.length > 0 ? ' — 次: ' + buses[0].time : ' — 本日終了'}</div>
         </div>
         <div class="near-dist">${distText}</div>`;
      item.addEventListener('click', () => {
        document.querySelector('[data-tab="timetable"]').click();
        goToTimetable(circuit, station);
      });
      list.appendChild(item);
    });
  }

  // ── Map Tab ───────────────────────────────────────────────
  function initMap() {
    if (leafletMap) { updateMapMarkers(); return; }
    leafletMap = L.map('map-container').setView([35.827, 139.673], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(leafletMap);
    const btnContainer = document.getElementById('map-circuit-buttons');
    CIRCUITS.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'map-filter-btn active';
      btn.style.setProperty('--c-color', c.color);
      btn.style.setProperty('--c-bg',    c.bg);
      btn.dataset.circuitId = c.id;
      btn.textContent       = c.name;
      btn.addEventListener('click', () => {
        if (activeMapCircuits.has(c.id)) {
          activeMapCircuits.delete(c.id);
          btn.classList.remove('active');
        } else {
          activeMapCircuits.add(c.id);
          btn.classList.add('active');
        }
        updateMapMarkers();
      });
      btnContainer.appendChild(btn);
    });
    updateMapMarkers();
    setInterval(() => {
      if (document.getElementById('tab-map').classList.contains('active')) updateBusMarkers();
    }, 30000);
  }

  function updateMapMarkers() {
    stopMarkers.forEach(m => m.remove());
    stopMarkers = [];
    const seen = new Map();
    CIRCUITS.forEach(circuit => {
      if (!activeMapCircuits.has(circuit.id)) return;
      circuit.stations.forEach(station => {
        const key = `${station.lat},${station.lng}`;
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key).push({ circuit, station });
      });
    });
    seen.forEach((entries, key) => {
      const [lat, lng] = key.split(',').map(Number);
      const primary    = entries[0];
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:10px;height:10px;border-radius:50%;background:${primary.circuit.color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        iconSize: [10, 10], iconAnchor: [5, 5],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(leafletMap);
      const circuitLabels = entries.map(e =>
        `<span style="color:${e.circuit.color};font-weight:700">${e.circuit.name}循環</span>`
      ).join('・');
      const nextBus  = getUpcomingBuses(primary.circuit, primary.station);
      const nextText = nextBus.length > 0 ? `次: ${nextBus[0].time}` : '本日終了';
      marker.bindPopup(
        `<div class="popup-title">${primary.station.name}</div>
         <div class="popup-circuit">${circuitLabels}</div>
         <div class="popup-next">${nextText}</div>`
      );
      marker.on('click', () => {
        document.querySelector('[data-tab="timetable"]').click();
        goToTimetable(primary.circuit, primary.station);
      });
      stopMarkers.push(marker);
    });
    updateBusMarkers();
  }

  function updateBusMarkers() {
    busMarkers.forEach(m => m.remove());
    busMarkers = [];
    const now    = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    CIRCUITS.forEach(circuit => {
      if (!activeMapCircuits.has(circuit.id)) return;
      circuit.departures.forEach(dep => {
        const depMin     = toMinutes(dep);
        const lastOffset = circuit.stations[circuit.stations.length - 1].offset;
        if (nowMin < depMin || nowMin > depMin + lastOffset + 3) return;
        const elapsed  = nowMin - depMin;
        const stations = circuit.stations;
        let prevSt = stations[0], nextSt = stations[0];
        for (let i = 0; i < stations.length - 1; i++) {
          if (elapsed >= stations[i].offset && elapsed <= stations[i + 1].offset) {
            prevSt = stations[i]; nextSt = stations[i + 1]; break;
          }
        }
        const segDuration = nextSt.offset - prevSt.offset || 1;
        const progress    = Math.min((elapsed - prevSt.offset) / segDuration, 1);
        const lat = prevSt.lat + (nextSt.lat - prevSt.lat) * progress;
        const lng = prevSt.lng + (nextSt.lng - prevSt.lng) * progress;
        const busIcon = L.divIcon({
          className: '',
          html: `<div style="background:${circuit.color};color:#fff;border-radius:20px;padding:2px 6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3)">🚌 ${circuit.name}</div>`,
          iconAnchor: [20, 10],
        });
        const m = L.marker([lat, lng], { icon: busIcon, zIndexOffset: 1000 }).addTo(leafletMap);
        m.bindPopup(`<div class="popup-title">${circuit.name}循環</div><div class="popup-next">推定位置 (${dep} 発)</div>`);
        busMarkers.push(m);
      });
    });
  }

  // ── Event Bindings ────────────────────────────────────────
  document.getElementById('btn-back-station').addEventListener('click', goToCircuits);

  document.getElementById('btn-back-timetable').addEventListener('click', () => {
    if (selectedCircuit) goToStations(selectedCircuit);
    else goToCircuits();
  });

  document.getElementById('btn-refresh').addEventListener('click', updateTimetable);

  document.getElementById('btn-fav-toggle').addEventListener('click', () => {
    if (selectedCircuit && selectedStation) toggleFavorite(selectedCircuit, selectedStation);
  });

  // ── Init ──────────────────────────────────────────────────
  // アクセス時は常に循環選択を表示
  history.replaceState(null, '', location.pathname + '#/');
  renderCircuitView();
  startCountdown();
})();
