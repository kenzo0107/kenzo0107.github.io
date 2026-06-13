(() => {
  const LS_CIRCUIT = 'toco_circuit_id';
  const LS_STATION = 'toco_station_id';

  let selectedCircuit = null;
  let selectedStation = null;
  let countdownTimer = null;

  const views = {
    circuit: document.getElementById('view-circuit'),
    station: document.getElementById('view-station'),
    timetable: document.getElementById('view-timetable'),
  };

  function showView(name) {
    Object.values(views).forEach(v => v.hidden = true);
    views[name].hidden = false;
  }

  // Parse "H:MM" → total minutes from midnight
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
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const results = [];

    for (const dep of circuit.departures) {
      const arrivalMin = toMinutes(dep) + station.offset;
      if (arrivalMin > nowMin - 0.5) { // 30秒のバッファ
        results.push({
          time: minutesToHHMM(arrivalMin),
          totalMin: arrivalMin,
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate(),
            Math.floor(arrivalMin / 60), arrivalMin % 60, 0),
        });
      }
      if (results.length >= 5) break;
    }
    return results;
  }

  function formatCountdown(targetDate) {
    const diff = targetDate - Date.now();
    if (diff < 0) return '発車済み';
    const totalSec = Math.floor(diff / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}時間 ${m}分 ${s}秒`;
    if (m > 0) return `${m}分 ${s}秒`;
    return `${s}秒`;
  }

  // ── Circuit View ──────────────────────────────────────────
  function renderCircuitView() {
    const container = document.getElementById('circuit-list');
    container.innerHTML = '';
    CIRCUITS.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'circuit-btn';
      btn.style.setProperty('--c-color', c.color);
      btn.style.setProperty('--c-bg', c.bg);
      btn.textContent = c.name + '循環';
      btn.addEventListener('click', () => {
        selectedCircuit = c;
        localStorage.setItem(LS_CIRCUIT, c.id);
        renderStationView();
        showView('station');
      });
      container.appendChild(btn);
    });
    showView('circuit');
  }

  // ── Station View ──────────────────────────────────────────
  function renderStationView() {
    const title = document.getElementById('station-title');
    const list = document.getElementById('station-list');
    title.textContent = selectedCircuit.name + '循環　停留所を選択';
    title.style.color = selectedCircuit.color;
    list.innerHTML = '';

    selectedCircuit.stations.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'station-btn';
      btn.textContent = s.name;
      btn.addEventListener('click', () => {
        selectedStation = s;
        localStorage.setItem(LS_STATION, s.id);
        renderTimetableView();
        showView('timetable');
      });
      list.appendChild(btn);
    });
  }

  // ── Timetable View ────────────────────────────────────────
  function renderTimetableView() {
    document.getElementById('tt-circuit').textContent = selectedCircuit.name + '循環';
    document.getElementById('tt-circuit').style.color = selectedCircuit.color;
    document.getElementById('tt-station').textContent = selectedStation.name;
    document.getElementById('tt-note').textContent = selectedCircuit.note;
    updateTimetable();
  }

  function updateTimetable() {
    if (!selectedCircuit || !selectedStation) return;
    const buses = getUpcomingBuses(selectedCircuit, selectedStation);
    const container = document.getElementById('tt-buses');
    container.innerHTML = '';

    if (buses.length === 0) {
      const p = document.createElement('p');
      p.className = 'no-bus';
      p.textContent = '本日のバスは終了しました。';
      container.appendChild(p);
      return;
    }

    buses.forEach((bus, i) => {
      const card = document.createElement('div');
      card.className = 'bus-card' + (i === 0 ? ' bus-card--next' : '');
      card.style.setProperty('--c-color', selectedCircuit.color);
      card.style.setProperty('--c-bg', selectedCircuit.bg);

      const timeEl = document.createElement('div');
      timeEl.className = 'bus-time';
      timeEl.textContent = bus.time;

      const cdEl = document.createElement('div');
      cdEl.className = 'bus-countdown';
      cdEl.dataset.target = bus.date.getTime();
      cdEl.textContent = formatCountdown(bus.date);

      card.appendChild(timeEl);
      card.appendChild(cdEl);
      container.appendChild(card);
    });
  }

  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      if (views.timetable.hidden) return;
      document.querySelectorAll('.bus-countdown').forEach(el => {
        const target = new Date(Number(el.dataset.target));
        const text = formatCountdown(target);
        el.textContent = text;
        if (text === '発車済み') {
          // 次のバスを再取得
          updateTimetable();
        }
      });
    }, 1000);
  }

  // ── Event Bindings ────────────────────────────────────────
  document.getElementById('btn-back-station').addEventListener('click', () => {
    renderCircuitView();
  });

  document.getElementById('btn-back-timetable').addEventListener('click', () => {
    renderStationView();
    showView('station');
  });

  document.getElementById('btn-refresh').addEventListener('click', () => {
    updateTimetable();
  });

  // ── Init ──────────────────────────────────────────────────
  renderCircuitView();

  // 前回の選択を復元
  const lastCircuit = CIRCUITS.find(x => x.id === Number(localStorage.getItem(LS_CIRCUIT)));
  const lastStation = lastCircuit && lastCircuit.stations.find(x => x.id === Number(localStorage.getItem(LS_STATION)));
  if (lastCircuit && lastStation) {
    selectedCircuit = lastCircuit;
    selectedStation = lastStation;
    renderTimetableView();
    showView('timetable');
  }

  startCountdown();
})();
