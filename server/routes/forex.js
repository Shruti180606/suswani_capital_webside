const express = require('express');
const instruments = require('../../shared/instruments.json');
const cache = require('../services/cache');
const { getExchangeRate } = require('../services/forex');

const router = express.Router();

instruments
  .filter((instrument) => instrument.type === 'forex')
  .forEach((instrument) => {
    const routePath = instrument.apiRoute.replace(/^\/api/, '');

    router.get(routePath, async (req, res) => {
      const previous = cache.getFresh(instrument.id);
      try {
        const price = await getExchangeRate(instrument.base, instrument.quote);
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