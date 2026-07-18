// Regenerates one static detail page per instrument from detail.template.html.
// Run automatically on `npm run build`; re-run manually (npm run generate) any
// time shared/instruments.json changes, e.g. after adding a new instrument.
const fs = require('fs');
const path = require('path');

const instruments = require('../shared/instruments.json');

const publicDir = path.join(__dirname, '..', 'public');
const templatePath = path.join(publicDir, 'detail.template.html');
const template = fs.readFileSync(templatePath, 'utf8');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Every instrument gets a detail page from the same template — one config
// entry + this loop, no per-instrument page code.
instruments.forEach((instrument) => {
  const html = template
    .replaceAll('__LABEL__', escapeHtml(instrument.label))
    .replaceAll('__DESCRIPTION__', escapeHtml(instrument.description || ''))
    .replaceAll('__UNIT__', escapeHtml(instrument.unit))
    .replaceAll('__API_ROUTE__', instrument.apiRoute)
    .replaceAll('__TV_SYMBOL_ENCODED__', encodeURIComponent(instrument.tradingViewSymbol));

  const outPath = path.join(publicDir, `${instrument.id}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`Generated ${path.relative(process.cwd(), outPath)}`);
});
