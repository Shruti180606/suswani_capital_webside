// Converts a live spot price for a precious metal into INR per 10 grams.
// Provider priority: GoldAPI.io (GOLDAPI_KEY) first, MetalpriceAPI (METALPRICEAPI_KEY) as fallback.
const GRAMS_PER_TROY_OUNCE = 31.1034768;

async function fromGoldApi(metalSymbol) {
  const res = await fetch(`https://www.goldapi.io/api/${metalSymbol}/INR`, {
    headers: {
      'x-access-token': process.env.GOLDAPI_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`GoldAPI request failed: ${res.status}`);
  const data = await res.json();

  const pricePerGram =
    typeof data.price_gram_24k === 'number'
      ? data.price_gram_24k
      : data.price / GRAMS_PER_TROY_OUNCE;

  return pricePerGram * 10;
}

async function fromMetalPriceApi(metalSymbol) {
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${process.env.METALPRICEAPI_KEY}&base=${metalSymbol}&currencies=INR`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MetalpriceAPI request failed: ${res.status}`);
  const data = await res.json();
  if (data.success === false) throw new Error('MetalpriceAPI returned an error response');

  // base=<metal> convention: rates.INR is the INR value of 1 troy ounce of the metal.
  const pricePerOunce = data.rates.INR;
  return (pricePerOunce / GRAMS_PER_TROY_OUNCE) * 10;
}

async function getMetalPricePer10g(metalSymbol) {
  if (process.env.GOLDAPI_KEY) return fromGoldApi(metalSymbol);
  if (process.env.METALPRICEAPI_KEY) return fromMetalPriceApi(metalSymbol);
  throw new Error('No metals API key configured (set GOLDAPI_KEY or METALPRICEAPI_KEY)');
}

module.exports = { getMetalPricePer10g };
