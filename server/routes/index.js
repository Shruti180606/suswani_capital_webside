const express = require('express');
const instruments = require('../../shared/instruments.json');
const marketHolidays = require('../../shared/market-holidays.json');

const router = express.Router();

// Single source of truth for the frontend card grid and detail pages.
router.get('/config', (req, res) => {
  res.json(instruments);
});

// Single source of truth for the header status bar's NSE holiday-awareness check.
router.get('/market-holidays', (req, res) => {
  res.json(marketHolidays);
});

// Each domain file only registers routes for its own instrument type,
// filtered from shared/instruments.json — see that file's comments for the pattern.
router.use('/', require('./metals'));
router.use('/', require('./forex'));
router.use('/', require('./indices'));
router.use('/', require('./commodities'));


module.exports = router;