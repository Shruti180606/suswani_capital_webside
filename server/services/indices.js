// Live index quotes require a paid NSE/BSE data provider — see NSE_API_KEY in .env.example.
// Until a key is set and a real provider is wired into fromLiveApi() below, deterministic
// placeholder data (with small jitter) is returned so the cards, routes, and 60s auto-refresh
// cycle all work end-to-end today and need no further changes once the key is added.

const PLACEHOLDER_BASE = {
  SENSEX: { lastPrice: 82845.12, prevClose: 82332.67, open: 82401.15, high: 82921.88, low: 82318.76 },
  NIFTY50: { lastPrice: 25143.8, prevClose: 24987.1, open: 25021.1, high: 25185.95, low: 24998.2 },
  BANKNIFTY: { lastPrice: 57845.3, prevClose: 57963.55, open: 57910.55, high: 57982.15, low: 57612.4 },
};

function buildPlaceholderQuote(indexSymbol) {
  const base = PLACEHOLDER_BASE[indexSymbol];
  if (!base) throw new Error(`No placeholder data configured for index: ${indexSymbol}`);

  // Small jitter so refreshes visibly move even on placeholder data.
  const jitter = (Math.random() - 0.5) * base.lastPrice * 0.0015;
  const lastPrice = base.lastPrice + jitter;
  const change = lastPrice - base.prevClose;
  const changePercent = (change / base.prevClose) * 100;

  return {
    lastPrice,
    change,
    changePercent,
    high: Math.max(base.high, lastPrice),
    low: Math.min(base.low, lastPrice),
    open: base.open,
    prevClose: base.prevClose,
  };
}

async function fromLiveApi(indexSymbol) {
  // TODO: once a paid NSE/BSE data provider is chosen, replace this with a real fetch
  // using process.env.NSE_API_KEY, returning the same shape as buildPlaceholderQuote():
  // { lastPrice, change, changePercent, high, low, open, prevClose }
  throw new Error('NSE_API_KEY is set, but no live index provider is wired up yet in services/indices.js');
}

async function getIndexQuote(indexSymbol) {
  if (process.env.NSE_API_KEY) return fromLiveApi(indexSymbol);
  return buildPlaceholderQuote(indexSymbol);
}

module.exports = { getIndexQuote };
