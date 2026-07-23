const express = require('express');
const instruments = require('../../shared/instruments.json');
const cache = require('../services/cache');
const { getMetalQuote } = require('../services/metals');
const router = express.Router();

function formatExpiry(raw) {
  if (!raw) return '';
  const day = raw.slice(0, 2);
  const monRaw = raw.slice(2, 5);
  const mon = monRaw.charAt(0) + monRaw.slice(1).toLowerCase();
  return `${day} ${mon}`;
}

instruments
  .filter((instrument) => instrument.type === 'metal')
  .forEach((instrument) => {
    const routePath = instrument.apiRoute.replace(/^\/api/, '');
    router.get(routePath, async (req, res) => {
      try {
        const q = await getMetalQuote(instrument.metalSymbol);
        const payload = {
          id: instrument.id,
          label: instrument.label,
          unit: instrument.unit,
          expiry: formatExpiry(q.expiry),
          ltp: q.ltp,
          netChange: q.netChange,
          percentChange: q.percentChange,
          bid: q.bid,
          ask: q.ask,
          open: q.open,
          high: q.high,
          low: q.low,
          updatedAt: Date.now(),
          stale: false,
        };
        cache.set(instrument.id, payload);
        res.json(payload);
      } catch (err) {
        const stale = cache.getStale(instrument.id);
        if (stale) {
          res.json(stale);
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
