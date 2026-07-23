const { getQuoteMap } = require('../getQuotes');

async function getIndexQuote(indexSymbol) {
  const quotes = await getQuoteMap();
  const q = quotes[indexSymbol];
  if (!q) throw new Error(`No live quote available for index: ${indexSymbol}`);

  const lastPrice = q.ltp;
  const prevClose = q.close;
  const change = lastPrice - prevClose;
  const changePercent = (change / prevClose) * 100;

  return {
    lastPrice,
    change,
    changePercent,
    high: q.high || lastPrice,
    low: q.low || lastPrice,
    open: q.open || lastPrice,
    prevClose,
  };
}

module.exports = { getIndexQuote };
