const REFRESH_MS = 30_000;
let prevPrices   = {};
let progressTimer;

// прогрес-бар, що показує час до наступного оновлення
function startProgress() {
  clearInterval(progressTimer);
  const bar   = document.getElementById('progress');
  const start = Date.now();
  bar.style.transition = 'none';
  bar.style.transform  = 'scaleX(1)';
  progressTimer = setInterval(() => {
    const scale = Math.max(0, 1 - (Date.now() - start) / REFRESH_MS);
    bar.style.transform = `scaleX(${scale})`;
    if (scale <= 0) clearInterval(progressTimer);
  }, 200);
}

// форматування чисел
function fmt(n, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtPrice(p) {
  if (p >= 1000) return '$' + fmt(p, 2);
  if (p >= 1)    return '$' + fmt(p, 3);
  if (p >= 0.01) return '$' + fmt(p, 4);
  return '$' + p.toFixed(6);
}
function fmtBig(n) {
  if (n >= 1e12) return '$' + fmt(n / 1e12, 2) + 'T';
  if (n >= 1e9)  return '$' + fmt(n / 1e9,  2) + 'B';
  if (n >= 1e6)  return '$' + fmt(n / 1e6,  2) + 'M';
  return '$' + fmt(n, 0);
}
function chgClass(v) {
  return v > 0.01 ? 'up' : v < -0.01 ? 'down' : 'flat';
}

// рендерування таблиці з даними про монети
function render(data) {
  const tbody  = document.getElementById('tbody');
  const maxVol = Math.max(...data.map(c => c.volume));

  data.forEach((coin, i) => {
    const oldPrice  = prevPrices[coin.symbol];
    let flashClass  = '';
    if (oldPrice !== undefined) {
      if      (coin.current_price > oldPrice) flashClass = 'flash-up';
      else if (coin.current_price < oldPrice) flashClass = 'flash-down';
    }
    prevPrices[coin.symbol] = coin.current_price;

    const volPct = maxVol > 0 ? (coin.volume / maxVol * 100).toFixed(1) : 0;

    let row = tbody.rows[i];
    if (!row) row = tbody.insertRow();

    if (flashClass) {
      row.className = flashClass;
      setTimeout(() => { row.className = ''; }, 700);
    }

    row.innerHTML = `
      <td class="rank">${coin.rank}</td>
      <td>
        <div class="coin-info">
          ${coin.image ? `<img class="coin-icon" src="${coin.image}" alt="${coin.symbol}" loading="lazy">` : ''}
          <div>
            <div class="coin-name">${coin.name}</div>
            <div class="coin-sym">${coin.symbol}</div>
          </div>
        </div>
      </td>
      <td class="right price price-large">${fmtPrice(coin.current_price)}</td>
      <td class="right"><span class="chg ${chgClass(coin.change_1h)}">${fmt(coin.change_1h)}%</span></td>
      <td class="right"><span class="chg ${chgClass(coin.change_24h)}">${fmt(coin.change_24h)}%</span></td>
      <td class="right hide-sm"><span class="chg ${chgClass(coin.change_7d)}">${fmt(coin.change_7d)}%</span></td>
      <td class="right hide-sm mcap">${fmtBig(coin.market_cap)}</td>
      <td class="right hide-sm">
        <div class="vol-wrap" style="justify-content:flex-end">
          <span class="mcap">${fmtBig(coin.volume)}</span>
          <div class="vol-bar"><div class="vol-fill" style="width:${volPct}%"></div></div>
        </div>
      </td>`;
  });

  while (tbody.rows.length > data.length) tbody.deleteRow(tbody.rows.length - 1);
}

// веб-сокет для отримання даних про монети в реальному часі
const ws       = new WebSocket('ws://' + location.host + '/ws');
const statusEl = document.getElementById('status');

ws.onopen = () => {
  statusEl.innerHTML = '<span class="dot"></span>ПІДКЛЮЧЕНО — ОЧІКУЄМО ДАНІ...';
  statusEl.className = '';
};

ws.onmessage = (e) => {
  const now = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  statusEl.innerHTML = `<span class="dot"></span>ОНОВЛЕНО О ${now}`;
  statusEl.className = '';
  render(JSON.parse(e.data));
  startProgress();
};

ws.onerror = () => {
  statusEl.textContent = 'ПОМИЛКА З\'ЄДНАННЯ';
  statusEl.className   = 'error';
};

ws.onclose = () => {
  statusEl.textContent = 'З\'ЄДНАННЯ ВТРАЧЕНО';
  statusEl.className   = 'error';
};