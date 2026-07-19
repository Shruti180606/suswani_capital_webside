const express = require('express');
const instruments = require('../../shared/instruments.json');
const cache = require('../services/cache');
const {
  getCopperPricePerKg,
  getZincPricePerKg,
  getCrudeOilPricePerBarrel,
} = require('../services/commodities');

const router = express.Router();

function fetchCommodityPrice(instrument) {
  if (instrument.id === 'copper') return getCopperPricePerKg();
  if (instrument.id === 'zinc') return getZincPricePerKg();
  if (instrument.id === 'crude-oil') return getCrudeOilPricePerBarrel();
  throw new Error(`Unknown commodity id: ${instrument.id}`);
}

instruments
  .filter((instrument) => instrument.type === 'commodity')
  .forEach((instrument) => {
    const routePath = instrument.apiRoute.replace(/^\/api/, '');

    router.get(routePath, async (req, res) => {
      const previous = cache.getFresh(instrument.id);
      try {
        const price = await fetchCommodityPrice(instrument);
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