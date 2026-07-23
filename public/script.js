const REFRESH_INTERVAL_MS = 2 * 1000; // 2 seconds
const INDEX_REFRESH_INTERVAL_MS = 2 * 1000; // 2 seconds

document.getElementById('year').textContent = new Date().getFullYear();

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSigned(num, decimals = 2) {
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${num >= 0 ? '+' : '-'}${formatted}`;
}

function buildCard(instrument, index) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = `${instrument.id}.html`;
  card.style.animationDelay = `${index * 0.12}s`;
  card.id = `card-${instrument.id}`;
  card.innerHTML = `
    <p class="card__label">${instrument.label}</p>
    <p class="card__price is-loading" data-field="price">Loading…</p>
    
    <p class="card__unit">${instrument.unit}</p>
    <p class="card__meta">
      <span data-field="updated"></span>
      <span class="card__stale-note" data-field="stale-note"></span>
    </p>
  `;
  return card;
}
function flashPrice(el, isUp) {
  el.classList.remove('flash-up', 'flash-down');
  void el.offsetWidth;
  el.classList.add(isUp ? 'flash-up' : 'flash-down');
}

function renderCardData(instrument, data) {
  const card = document.getElementById(`card-${instrument.id}`);
  if (!card) return;

  const priceEl = card.querySelector('[data-field="price"]');
  const updatedEl = card.querySelector('[data-field="updated"]');
  const staleEl = card.querySelector('[data-field="stale-note"]');

  if (data.error) {
    priceEl.textContent = 'Unavailable';
    priceEl.classList.add('is-loading');
    updatedEl.textContent = '';
    staleEl.textContent = 'Data temporarily unavailable';
    return;
  }

  priceEl.classList.remove('is-loading');
  priceEl.textContent = formatPrice(data.priceInr ?? data.price);

  const existingTrend = card.querySelector('.card__trend');
  if (existingTrend) existingTrend.remove();

  const mainPrice = data.priceInr ?? data.price;
const mainPrevious = data.previousInr ?? data.previous;

if (typeof mainPrevious === 'number' && mainPrevious !== mainPrice) {
  const trend = document.createElement('span');
  const isUp = mainPrice > mainPrevious;

   flashPrice(priceEl, isUp);

    trend.className = `card__trend ${isUp ? 'up' : 'down'}`;
    trend.textContent = isUp ? '▲ up' : '▼ down';
    priceEl.insertAdjacentElement('afterend', trend);
  }
  const secondaryEl = card.querySelector('[data-field="price-secondary"]');
  if (secondaryEl && typeof data.priceUsd === 'number') {
    secondaryEl.style.display = '';
    if (typeof data.previousUsd === 'number' && data.previousUsd !== data.priceUsd) {
      flashPrice(secondaryEl, data.priceUsd > data.previousUsd);
    }
    secondaryEl.textContent = `≈ $${data.priceUsd.toFixed(4)}`;
  }

  updatedEl.textContent = `Last updated ${formatTime(data.updatedAt)}`;
  staleEl.textContent = data.stale ? 'Values may be delayed' : '';
}

function buildTerminalCard(instrument, index) {
  const card = document.createElement('a');
  card.className = 'card card--terminal';
  card.href = `${instrument.id}.html`;
  card.style.animationDelay = `${index * 0.12}s`;
  card.id = `card-${instrument.id}`;
  card.innerHTML = `
    <div class="terminal-box">
      <div class="terminal-box__header">${instrument.label}</div>
      <div class="terminal-box__row terminal-box__row--price">
        <span>Last Price</span>
        <span data-field="lastPrice">Loading…</span>
      </div>
      <p class="terminal-box__change" data-field="change"></p>
      <div class="terminal-box__row"><span>High</span><span data-field="high">—</span></div>
      <div class="terminal-box__row"><span>Low</span><span data-field="low">—</span></div>
      <div class="terminal-box__row"><span>Open</span><span data-field="open">—</span></div>
      <div class="terminal-box__row"><span>Prev Close</span><span data-field="prevClose">—</span></div>
      <p class="terminal-box__meta" data-field="updated"></p>
      <p class="terminal-box__stale" data-field="stale-note"></p>
    </div>
  `;
  return card;
}

function renderTerminalCardData(instrument, data) {
  const card = document.getElementById(`card-${instrument.id}`);
  if (!card) return;

  const priceEl = card.querySelector('[data-field="lastPrice"]');
  const changeEl = card.querySelector('[data-field="change"]');
  const highEl = card.querySelector('[data-field="high"]');
  const lowEl = card.querySelector('[data-field="low"]');
  const openEl = card.querySelector('[data-field="open"]');
  const prevCloseEl = card.querySelector('[data-field="prevClose"]');
  const updatedEl = card.querySelector('[data-field="updated"]');
  const staleEl = card.querySelector('[data-field="stale-note"]');

  if (data.error) {
    priceEl.textContent = 'Unavailable';
    changeEl.textContent = '';
    changeEl.className = 'terminal-box__change';
    highEl.textContent = '—';
    lowEl.textContent = '—';
    openEl.textContent = '—';
    prevCloseEl.textContent = '—';
    updatedEl.textContent = '';
    staleEl.textContent = 'Data temporarily unavailable';
    return;
  }

  priceEl.textContent = formatPrice(data.lastPrice);

  const isUp = data.change >= 0;
  changeEl.className = `terminal-box__change ${isUp ? 'up' : 'down'}`;
  changeEl.textContent = `${isUp ? '▲' : '▼'} ${formatSigned(data.change)} (${formatSigned(data.changePercent)}%)`;

  highEl.textContent = formatPrice(data.high);
  lowEl.textContent = formatPrice(data.low);
  openEl.textContent = formatPrice(data.open);
  prevCloseEl.textContent = formatPrice(data.prevClose);

  updatedEl.textContent = `Last updated ${formatTime(data.updatedAt)}`;
  staleEl.textContent = data.stale ? 'Values may be delayed' : '';
}

async function refreshInstrument(instrument) {
  try {
    const res = await fetch(instrument.apiRoute);
    const data = await res.json();
    if (instrument.type === 'index') {
      renderTerminalCardData(instrument, data);
    } else {
      renderCardData(instrument, data);
    }
  } catch (err) {
    if (instrument.type === 'index') {
      renderTerminalCardData(instrument, { error: true });
    } else {
      renderCardData(instrument, { error: true });
    }
  }
}

async function init() {
  const indexGrid = document.getElementById('index-cards-grid');
  const grid = document.getElementById('cards-grid');
  const res = await fetch('/api/config');
  const instruments = await res.json();

  const standardInstruments = instruments.filter((instrument) => instrument.type !== 'index' && instrument.id !== 'gold' && instrument.id !== 'silver' && instrument.id !== 'copper' && instrument.id !== 'zinc' && instrument.id !== 'crude-oil' && instrument.id !== 'usd-inr');
  const indexInstruments = [];

  // Rendered as two separate groups (indices, then metals/forex) so the grouping
  // holds regardless of screen width, rather than relying on grid wrap order.
  indexInstruments.forEach((instrument, index) => {
    indexGrid.appendChild(buildTerminalCard(instrument, index));
  });
  standardInstruments.forEach((instrument, index) => {
    grid.appendChild(buildCard(instrument, index));
  });

  instruments.forEach(refreshInstrument);

  setInterval(() => {
    standardInstruments.forEach(refreshInstrument);
  }, REFRESH_INTERVAL_MS);

  setInterval(() => {
    indexInstruments.forEach(refreshInstrument);
  }, INDEX_REFRESH_INTERVAL_MS);
}

init();
const previousValues = {};

function flashBadge(el, dir) {
  el.classList.remove('flash-up', 'flash-down');
  void el.offsetWidth;
  el.classList.add(dir === 'up' ? 'flash-up' : 'flash-down');
  setTimeout(() => el.classList.remove('flash-up', 'flash-down'), 700);
}

const METALS_COMMODITIES_ROUTES = ['/api/gold', '/api/silver', '/api/crude-oil', '/api/copper', '/api/zinc'];

function buildMetalRow(item) {
  const row = document.createElement('tr');
  const ltp = item.ltp !== undefined ? item.ltp : item.price;
  const change = item.netChange;
  const pct = item.percentChange;
  const hasChangeData = change !== undefined && change !== null;
  const dir = hasChangeData ? (change > 0 ? 'up' : change < 0 ? 'down' : 'flat') : 'flat';
  const sign = hasChangeData && change > 0 ? '+' : '';
  const hasBidAsk = item.bid != null && item.ask != null;

  row.innerHTML = `
    <td class="product-cell">${item.label}${item.expiry ? ` <span class="product-expiry">${item.expiry}</span>` : ''}<span class="product-change change--${dir}">${hasChangeData ? `${sign}${formatSigned(change)} (${sign}${pct != null ? pct.toFixed(2) : '0.00'}%)` : '—'}</span></td>
    <td><span class="price-cell price-cell--ltp" id="ltp-${item.id}">${formatPrice(ltp)}</span></td>
    <td>${hasBidAsk ? `<span class="price-cell" id="bid-${item.id}">${formatPrice(item.bid)}</span>` : '—'}</td>
    <td>${hasBidAsk ? `<span class="price-cell" id="ask-${item.id}">${formatPrice(item.ask)}</span>` : '—'}</td>
    <td class="ohl-cell">${item.high != null ? formatPrice(item.high) : '—'}</td>
    <td class="ohl-cell">${item.low != null ? formatPrice(item.low) : '—'}</td>
  `;

  const prev = previousValues[item.id] || {};
  requestAnimationFrame(() => {
    const ltpEl = row.querySelector(`#ltp-${item.id}`);
    const bidEl = row.querySelector(`#bid-${item.id}`);
    const askEl = row.querySelector(`#ask-${item.id}`);
    if (prev.ltp !== undefined && prev.ltp !== ltp && ltpEl) flashBadge(ltpEl, ltp > prev.ltp ? 'up' : 'down');
    if (prev.bid !== undefined && prev.bid !== item.bid && bidEl) flashBadge(bidEl, item.bid > prev.bid ? 'up' : 'down');
    if (prev.ask !== undefined && prev.ask !== item.ask && askEl) flashBadge(askEl, item.ask > prev.ask ? 'up' : 'down');
  });
  previousValues[item.id] = { ltp, bid: item.bid, ask: item.ask };

  return row;
}

async function renderMetalsCommodities() {
  const tbody = document.getElementById('metals-table-body');
  if (!tbody) return;
  const results = await Promise.all(METALS_COMMODITIES_ROUTES.map(async (route) => {
    try {
      const res = await fetch(route);
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  }));
  tbody.innerHTML = '';
  results.forEach((item) => {
    if (item.error) return;
    tbody.appendChild(buildMetalRow(item));
  });
}

renderMetalsCommodities();
setInterval(renderMetalsCommodities, 2000);
const INDEX_ROUTES = ['/api/sensex', '/api/nifty-50', '/api/bank-nifty'];

function buildLiveIndexCard(item) {
  const card = document.createElement('div');
  card.className = 'metal-card';
  const ltp = item.lastPrice;
  const change = item.change;
  const pct = item.changePercent;
  const hasChangeData = change !== undefined && change !== null;
  const dir = hasChangeData ? (change > 0 ? 'up' : change < 0 ? 'down' : 'flat') : 'flat';
  const sign = hasChangeData && change > 0 ? '+' : '';

  card.innerHTML = `
    <div class="metal-card__left">
      <div><span class="metal-card__symbol">${item.label}</span></div>
      <div class="metal-card__ltp" id="ltp-${item.id}">${formatPrice(ltp)}</div>
      <div class="metal-card__change metal-card__change--${dir}">${hasChangeData ? `${sign}${formatSigned(change)} (${sign}${pct != null ? pct.toFixed(2) : '0.00'}%)` : '—'}</div>
    </div>
    <div class="metal-card__right">
      <div class="metal-card__ohl">O:${formatPrice(item.open)} H:${formatPrice(item.high)} L:${formatPrice(item.low)}</div>
      <div class="metal-card__ohl">Prev Close: ${formatPrice(item.prevClose)}</div>
    </div>
  `;

  const prev = previousValues[item.id] || {};
  requestAnimationFrame(() => {
    const ltpEl = card.querySelector(`#ltp-${item.id}`);
    if (prev.ltp !== undefined && prev.ltp !== ltp && ltpEl) flashBadge(ltpEl, ltp > prev.ltp ? 'up' : 'down');
  });
  previousValues[item.id] = { ltp };

  return card;
}

async function renderIndices() {
  const grid = document.getElementById('index-cards-grid');
  if (!grid) return;
  const results = await Promise.all(INDEX_ROUTES.map(async (route) => {
    try {
      const res = await fetch(route);
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  }));
  grid.innerHTML = '';
  results.forEach((item) => {
    if (item.error) return;
    grid.appendChild(buildLiveIndexCard(item));
  });
}

renderIndices();
setInterval(renderIndices, 2000);
