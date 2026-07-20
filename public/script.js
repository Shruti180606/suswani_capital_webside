const REFRESH_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
const INDEX_REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

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
  priceEl.textContent = formatPrice(data.price);

  const existingTrend = card.querySelector('.card__trend');
  if (existingTrend) existingTrend.remove();

  if (typeof data.previous === 'number' && data.previous !== data.price) {
    const trend = document.createElement('span');
    const isUp = data.price > data.previous;

    priceEl.classList.remove('flash-up', 'flash-down');
    void priceEl.offsetWidth; // forces reflow so the animation replays even if triggered again quickly
    priceEl.classList.add(isUp ? 'flash-up' : 'flash-down');
    
    trend.className = `card__trend ${isUp ? 'up' : 'down'}`;
    trend.textContent = isUp ? '▲ up' : '▼ down';
    priceEl.insertAdjacentElement('afterend', trend);
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

  const standardInstruments = instruments.filter((instrument) => instrument.type !== 'index');
  const indexInstruments = instruments.filter((instrument) => instrument.type === 'index');

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
