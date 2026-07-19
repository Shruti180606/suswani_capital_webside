const express = require('express');
const instruments = require('../../shared/instruments.json');
const cache = require('../services/cache');
const { getIndexQuote } = require('../services/indices');

const router = express.Router();

instruments
  .filter((instrument) => instrument.type === 'index')
  .forEach((instrument) => {
    const routePath = instrument.apiRoute.replace(/^\/api/, '');

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
  });

module.exports = router;