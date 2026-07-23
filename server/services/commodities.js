const { getQuoteMap } = require('../getQuotes');

function extractDepth(q) {
  const buy = q.depth && q.depth.buy && q.depth.buy[0] ? q.depth.buy[0].price : null;
  const sell = q.depth && q.depth.sell && q.depth.sell[0] ? q.depth.sell[0].price : null;
  return { bid: buy, ask: sell };
}

function buildQuote(q) {
  const { bid, ask } = extractDepth(q);
  return {
    ltp: q.ltp != null ? q.ltp : null,
    open: q.open != null ? q.open : null,
    high: q.high != null ? q.high : null,
    low: q.low != null ? q.low : null,
    bid: bid,
    ask: ask,
    netChange: q.netChange != null ? q.netChange : null,
    percentChange: q.percentChange != null ? q.percentChange : null,
    expiry: q.expiry || null,
  };
}

async function getCommodityQuote(name) {
  const quotes = await getQuoteMap();
  const q = quotes[name];
  if (!q) throw new Error(`No live quote available for ${name}`);
  return buildQuote(q);
}

async function getCopperPricePerKg() {
  const quote = await getCommodityQuote('COPPER');
  return quote.ltp;
}
async function getZincPricePerKg() {
  const quote = await getCommodityQuote('ZINC');
  return quote.ltp;
}
async function getCrudeOilPricePerBarrel() {
  const quote = await getCommodityQuote('CRUDEOIL');
  return quote.ltp;
}

module.exports = {
  getCopperPricePerKg,
  getZincPricePerKg,
  getCrudeOilPricePerBarrel,
  getCommodityQuote,
};
