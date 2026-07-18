const REFRESH_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

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

async function refresh() {
  const apiRoute = document.body.dataset.apiRoute;
  const priceEl = document.querySelector('[data-field="price"]');
  const trendEl = document.querySelector('[data-field="trend"]');
  const updatedEl = document.querySelector('[data-field="updated"]');

  try {
    const res = await fetch(apiRoute);
    const data = await res.json();

    if (data.error) {
      priceEl.textContent = 'Unavailable';
      updatedEl.textContent = 'Data temporarily unavailable';
      trendEl.textContent = '';
      return;
    }

    // Metal/forex responses use { price, previous }; index responses use
    // { lastPrice, change } instead — support both without touching either
    // instrument type's backend logic.
    const price = typeof data.lastPrice === 'number' ? data.lastPrice : data.price;
    priceEl.textContent = formatPrice(price);

    let isUp = null;
    if (typeof data.change === 'number') {
      isUp = data.change >= 0;
    } else if (typeof data.previous === 'number' && data.previous !== data.price) {
      isUp = data.price > data.previous;
    }

    if (isUp !== null) {
      trendEl.className = `card__trend ${isUp ? 'up' : 'down'}`;
      trendEl.textContent = isUp ? '▲ up' : '▼ down';
    } else {
      trendEl.textContent = '';
    }

    updatedEl.textContent = data.stale
      ? `Last updated ${formatTime(data.updatedAt)} · may be delayed`
      : `Last updated ${formatTime(data.updatedAt)}`;
  } catch (err) {
    priceEl.textContent = 'Unavailable';
    updatedEl.textContent = 'Data temporarily unavailable';
  }
}

refresh();
setInterval(refresh, REFRESH_INTERVAL_MS);

// The embedded TradingView widget grabs keyboard focus once it finishes loading,
// which makes the browser auto-scroll the page down to the iframe. Force the
// page back to the top so the header stays visible.
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  setTimeout(() => window.scrollTo(0, 0), 600);
});
