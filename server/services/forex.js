// Frankfurter is free and requires no API key.
async function getExchangeRate(base, quote) {
  const url = `https://api.frankfurter.dev/v1/latest?from=${base}&to=${quote}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Frankfurter request failed: ${res.status}`);
  const data = await res.json();
  const rate = data.rates && data.rates[quote];
  if (typeof rate !== 'number') throw new Error('Frankfurter response missing expected rate');
  return rate;
}

module.exports = { getExchangeRate };
