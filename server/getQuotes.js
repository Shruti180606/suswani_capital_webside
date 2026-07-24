const axios = require('axios');
const { getToken } = require('./smartapi');
const { getNearestContract } = require('./getCommodityToken');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const FIXED_INSTRUMENTS = [
  { name: 'NIFTY50', exch: 'NSE', token: '26000' },
  { name: 'BANKNIFTY', exch: 'NSE', token: '26009' },
  { name: 'SENSEX', exch: 'BSE', token: '99919000' }
];
const COMMODITY_MAP = {
  GOLD: 'GOLD',
  SILVER: 'SILVER',
  CRUDEOIL: 'CRUDEOIL',
  COPPER: 'COPPER',
  ZINC: 'ZINC'
};
let cachedQuotes = null;
let cacheTime = 0;
const CACHE_TTL_MS = 2000;
function buildInstrumentList() {
  const commodityInstruments = Object.entries(COMMODITY_MAP).map(([name, prefix]) => {
    const contract = getNearestContract(prefix);
    if (!contract) return null;
    return { name, exch: 'MCX', token: contract.token, expiry: contract.expiry };
  }).filter(Boolean);
  return [...FIXED_INSTRUMENTS, ...commodityInstruments];
}
async function fetchQuotesFromApi() {
  const jwtToken = await getToken();
  const instruments = buildInstrumentList();
  const exchangeTokens = {};
  instruments.forEach(inst => {
    if (!exchangeTokens[inst.exch]) exchangeTokens[inst.exch] = [];
    exchangeTokens[inst.exch].push(inst.token);
  });
  const response = await axios.post(
    'https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/',
    { mode: 'FULL', exchangeTokens },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': process.env.SMARTAPI_KEY,
        'Authorization': `Bearer ${jwtToken}`
      }
    }
  );
  const fetched = response.data.data.fetched || [];
  const tokenToName = {};
  const tokenToExpiry = {};
  instruments.forEach(inst => {
    tokenToName[inst.token] = inst.name;
    tokenToExpiry[inst.token] = inst.expiry || null;
  });
  const quoteMap = {};
  fetched.forEach(q => {
    const name = tokenToName[q.symbolToken];
    if (name) quoteMap[name] = { ...q, expiry: tokenToExpiry[q.symbolToken] };
  });
  return quoteMap;
}
async function getQuoteMap() {
  const now = Date.now();
  if (cachedQuotes && (now - cacheTime) < CACHE_TTL_MS) {
    return cachedQuotes;
  }
  try {
    cachedQuotes = await fetchQuotesFromApi();
    cacheTime = now;
    return cachedQuotes;
  } catch (err) {
    console.error('[getQuotes] First attempt failed:', err.message);
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      cachedQuotes = await fetchQuotesFromApi();
      cacheTime = now;
      return cachedQuotes;
    } catch (retryErr) {
      console.error('[getQuotes] Retry also failed:', retryErr.message);
      if (cachedQuotes) {
        console.warn('[getQuotes] Serving last-known-good cached quotes instead');
        return cachedQuotes;
      }
      throw retryErr;
    }
  }
}
module.exports = { getQuoteMap };
