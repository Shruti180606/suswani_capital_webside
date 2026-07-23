const fs = require('fs');
const path = require('path');

const instrumentsPath = path.join(__dirname, 'instruments.json');
let instruments = null;

function loadInstruments() {
  if (!instruments) {
    const raw = fs.readFileSync(instrumentsPath, 'utf8');
    instruments = JSON.parse(raw);
  }
  return instruments;
}

function parseExpiry(expiryStr) {
  // Format: "31JUL2026" -> Date object
  const months = { JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11 };
  const day = parseInt(expiryStr.slice(0, 2), 10);
  const mon = months[expiryStr.slice(2, 5)];
  const year = parseInt(expiryStr.slice(5, 9), 10);
  return new Date(year, mon, day);
}

function getNearestContract(symbolPrefix) {
  const list = loadInstruments();
  const now = new Date();

  const matches = list.filter(item =>
    item.exch_seg === 'MCX' &&
    item.instrumenttype === 'FUTCOM' &&
    item.symbol.startsWith(symbolPrefix) &&
    /^\d/.test(item.symbol.slice(symbolPrefix.length))
  );

  const withExpiry = matches
    .map(item => ({ ...item, expiryDate: parseExpiry(item.expiry) }))
    .filter(item => item.expiryDate >= now)
    .sort((a, b) => a.expiryDate - b.expiryDate);

  return withExpiry[0] || null;
}

module.exports = { getNearestContract };
