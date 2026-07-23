const { getQuoteMap } = require('../getQuotes');

function extractDepth(q) {
  const buy = q.depth && q.depth.buy && q.depth.buy[0] ? q.depth.buy[0].price : null;
  const sell = q.depth && q.depth.sell && q.depth.sell[0] ? q.depth.sell[0].price : null;
  return { bid: buy, ask: sell };
}

function buildQuote(q, divisor) {
  const { bid, ask } = extractDepth(q);
  return {
    ltp: q.ltp != null ? q.ltp / divisor : null,
    open: q.open != null ? q.open / divisor : null,
    high: q.high != null ? q.high / divisor : null,
    low: q.low != null ? q.low / divisor : null,
    bid: bid != null ? bid / divisor : null,
    ask: ask != null ? ask / divisor : null,
    netChange: q.netChange != null ? q.netChange / divisor : null,
    percentChange: q.percentChange != null ? q.percentChange : null,
    expiry: q.expiry || null,
  };
}

async function getMetalQuote(metalSymbol) {
  const quotes = await getQuoteMap();
  if (metalSymbol === 'XAU') {
    const q = quotes.GOLD;
    if (!q) throw new Error('No live quote available for Gold');
    return buildQuote(q, 1);
  }
  if (metalSymbol === 'XAG') {
    const q = quotes.SILVER;
    if (!q) throw new Error('No live quote available for Silver');
    return buildQuote(q, 1);
  }
  throw new Error(`Unsupported metal symbol: ${metalSymbol}`);
}

async function getMetalPricePer10g(metalSymbol) {
  const quote = await getMetalQuote(metalSymbol);
  return quote.ltp;
}

module.exports = { getMetalQuote, getMetalPricePer10g };
