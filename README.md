# Suswani Capital

Landing page and live market data site for Suswani Capital. Static frontend (`/public`) + a small Node/Express backend (`/server`) that keeps every API key server-side.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and paste in a real GOLDAPI_KEY (or METALPRICEAPI_KEY)
npm start
```

Visit `http://localhost:8888`.

`npm start` first regenerates the static detail pages (one per instrument in `shared/instruments.json`) from the shared config, then starts the Express server, which serves the frontend from `/public` and the API from `/api/*`.

## API keys

| Variable | Required? | Notes |
|---|---|---|
| `GOLDAPI_KEY` | Yes (or `METALPRICEAPI_KEY`) | From [goldapi.io](https://www.goldapi.io). Used for gold & silver, checked first. |
| `METALPRICEAPI_KEY` | Fallback | From [metalpriceapi.com](https://metalpriceapi.com). Used only if `GOLDAPI_KEY` is not set. |
| USD/INR | — | Uses [Frankfurter](https://www.frankfurter.dev), which is free and needs **no key at all**. |
| `NSE_API_KEY` | Optional | For SENSEX / NIFTY 50 / BANK NIFTY. Until set, these cards show placeholder data (see below). |

All placeholders live in `.env.example`. Real values go in a local `.env` (already gitignored) or in your Netlify site's environment variables — never in code.

## Adding a new instrument (e.g. crude oil)

Everything is driven by one config file: [`shared/instruments.json`](shared/instruments.json).

1. Add an entry, e.g.:
   ```json
   {
     "id": "crude-oil",
     "label": "Crude Oil (WTI)",
     "unit": "$ / barrel",
     "type": "metal-or-your-new-type",
     "apiRoute": "/api/crude-oil",
     "tradingViewSymbol": "NYMEX:CL1!",
     "description": "Live WTI crude oil price."
   }
   ```
2. If it needs a new data source (e.g. Alpha Vantage for crude oil/copper), add a small service file under `server/services/` and one `if` branch in `server/routes/index.js`'s `fetchLivePrice()`.
3. Run `npm run generate` (or just `npm start`, which runs it automatically) to produce the new static detail page.

No existing route, card, or page needs to change.

## Deploying to Netlify

- Connect the GitHub repo to Netlify.
- Build command: `npm run build` · Publish directory: `public` · Functions directory: `netlify/functions` (all pre-set in `netlify.toml`).
- Add `GOLDAPI_KEY` (and/or `METALPRICEAPI_KEY`) as environment variables in the Netlify site settings — Frankfurter needs nothing.
- `/api/*` requests are redirected to the bundled Netlify Function (`netlify/functions/api.js`), which wraps the same Express routes used locally.

## Live market indices (SENSEX / NIFTY 50 / BANK NIFTY)

These render as terminal-style cards (monospace, bordered, Last Price / High / Low / Open / Prev Close) and refresh every **60 seconds** — independent of the 4-minute refresh used by the gold/silver/USD-INR cards.

They currently show **placeholder data** with small random jitter (`server/services/indices.js`), since live NSE/BSE index data requires a paid provider. Once you've picked and paid for one:

1. Add its key as `NSE_API_KEY` in `.env` (or Netlify env vars).
2. Implement the real fetch inside `fromLiveApi()` in `server/services/indices.js`, returning the same shape as `buildPlaceholderQuote()`: `{ lastPrice, change, changePercent, high, low, open, prevClose }`.
3. Nothing else changes — the route, cache/stale fallback, card rendering, and 60s refresh all already expect that shape.

Like every other instrument, they also get a detail page (`sensex.html`, `nifty-50.html`, `bank-nifty.html`) with the same TradingView chart layout used by gold/silver/USD-INR — `public/detail.js` reads either response shape (`price`/`previous` for metal/forex, `lastPrice`/`change` for indices) so the same template and script work for both.

## Header status bar (IST/London clocks + NSE market status)

The header shows live IST and London clocks plus a "LIVE MARKET STATUS" indicator with a green/red dot (`public/status-bar.js`, shared by the homepage and every detail page). The London clock's zone label automatically switches between BST and GMT across the DST transition via `Intl.DateTimeFormat`'s `timeZoneName`, so no manual date math is needed. The clocks tick every second; the market-status check re-runs every 30 seconds since it only changes at 9:15/15:30 IST minute boundaries.

Market status is based on: weekday, 9:15 AM–3:30 PM IST trading hours, and the holiday list in [`shared/market-holidays.json`](shared/market-holidays.json) (fetched once via `/api/market-holidays`). **Update that file yourself each year** — it's a plain array of `{ "date": "YYYY-MM-DD", "name": "..." }` entries; NSE holidays (especially Diwali, Holi, Eid, etc.) shift annually since several are lunar-calendar based. The current file is pre-filled with the 2026 NSE trading holiday list.

## Notes

- Gold/silver/USD-INR cards auto-refresh every 4 minutes and show a green/red indicator versus the previous fetched value. Index cards auto-refresh every 60 seconds (see above).
- If a live fetch fails, the last known value is shown with a "may be delayed" note instead of breaking the card.
- MCX exchange feeds require a paid broker subscription and are intentionally not used — prices are sourced from GoldAPI/MetalpriceAPI and converted to ₹/10g. The TradingView charts on detail pages still reference MCX symbols for display purposes only (free, no key required).
