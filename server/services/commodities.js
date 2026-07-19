// Converts live commodity spot prices via MetalpriceAPI into practical units:
// copper/zinc in INR per kg, crude oil (WTI) in INR per barrel.
const KG_PER_LB = 0.45359237;

async function fetchMetalPriceApiRate(symbol) {
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${process.env.METALPRICEAPI_KEY}&base=${symbol}&currencies=INR`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MetalpriceAPI request failed: ${res.status}`);
  const data = await res.json();
  if (data.success === false) throw new Error('MetalpriceAPI returned an error response');
  return data.rates.INR;
}

async function getCopperPricePerKg() {
  const pricePerLb = await fetchMetalPriceApiRate('XCU');
  return pricePerLb / KG_PER_LB;
}

async function getZincPricePerKg() {
  const pricePerLb = await fetchMetalPriceApiRate('ZNC');
  return pricePerLb / KG_PER_LB;
}

async function getCrudeOilPricePerBarrel() {
  return fetchMetalPriceApiRate('WTIOIL');
}

module.exports = { getCopperPricePerKg, getZincPricePerKg, getCrudeOilPricePerBarrel };