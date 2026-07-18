const express = require('express');
const instruments = require('../../shared/instruments.json');
const marketHolidays = require('../../shared/market-holidays.json');
const cache = require('../services/cache');
const { getMetalPricePer10g } = require('../services/metals');
const { getExchangeRate } = require('../services/forex');
const { getIndexQuote } = require('../services/indices');

const router = express.Router();

async function fetchLivePrice(instrument) {
  if (instrument.type === 'metal') return getMetalPricePer10g(instrument.metalSymbol);
  if (instrument.type === 'forex') return getExchangeRate(instrument.base, instrument.quote);
  throw new Error(`Unknown instrument type: ${instrument.type}`);
}

// Single source of truth for the frontend card grid and detail pages.
router.get('/config', (req, res) => {
  res.json(instruments);
});

// Single source of truth for the header status bar's NSE holiday-awareness check.
router.get('/market-holidays', (req, res) => {
  res.json(marketHolidays);
});

// One generic handler wired up per instrument in shared/instruments.json —
// adding a new instrument later means adding a config entry, not a new route file.
// instrument.apiRoute is the full public path (e.g. "/api/gold"); this router itself
// is always mounted at "/api" (directly in server/app.js, or implicitly via the
// Netlify redirect rule in netlify.toml), so the "/api" prefix is stripped here.
instruments.forEach((instrument) => {
  const routePath = instrument.apiRoute.replace(/^\/api/, '');

  // Index quotes have a different response shape (lastPrice/high/low/open/prevClose)
  // than the metal/forex price+previous shape below, so they get their own branch
  // rather than being squeezed into fetchLivePrice(). Metal/forex logic is unchanged.
  if (instrument.type === 'index') {
    router.get(routePath, async (req, res) => {
      try {
        const quote = await getIndexQuote(instrument.indexSymbol);
        cache.set(instrument.id, quote);
        res.json({
          id: instrument.id,
          label: instrument.label,
          ...quote,
          updatedAt: Date.now(),
          stale: false,
        });
      } catch (err) {
        const stale = cache.getStale(instrument.id);
        if (stale) {
          res.json({
            id: instrument.id,
            label: instrument.label,
            ...stale,
          });
        } else {
          res.status(502).json({
            id: instrument.id,
            error: 'Live index data is temporarily unavailable and no cached value exists yet.',
          });
        }
      }
    });
    return;
  }

  router.get(routePath, async (req, res) => {
    const previous = cache.getFresh(instrument.id);
    try {
      const price = await fetchLivePrice(instrument);
      cache.set(instrument.id, { price, unit: instrument.unit });
      res.json({
        id: instrument.id,
        label: instrument.label,
        unit: instrument.unit,
        price,
        previous: previous ? previous.price : null,
        updatedAt: Date.now(),
        stale: false,
      });
    } catch (err) {
      const stale = cache.getStale(instrument.id);
      if (stale) {
        res.json({
          id: instrument.id,
          label: instrument.label,
          unit: stale.unit,
          price: stale.price,
          previous: null,
          updatedAt: stale.fetchedAt,
          stale: true,
        });
      } else {
        res.status(502).json({
          id: instrument.id,
          error: 'Live price is temporarily unavailable and no cached value exists yet.',
        });
      }
    }
  });
});

module.exports = router;
