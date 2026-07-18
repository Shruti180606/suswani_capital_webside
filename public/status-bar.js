// NSE market-status indicator in the header. Shared by index.html and every
// detail page. The holiday list is fetched once from shared/market-holidays.json
// (via /api/market-holidays) to extend the OPEN/CLOSED check — see that file to
// add/update holidays each year.
(async function () {
  let holidayDates = [];

  async function loadHolidays() {
    try {
      const res = await fetch('/api/market-holidays');
      const data = await res.json();
      holidayDates = data.map((holiday) => holiday.date);
    } catch (err) {
      // Network hiccup — fall back to weekday + trading-hours only, same as before.
      holidayDates = [];
    }
  }

  // Built once and reused — constructing a new Intl.DateTimeFormat on every
  // tick is unnecessary overhead.
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const istClockFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const londonClockFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/London',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Separate formatter (rather than parsing the clock string) so the London
  // label correctly flips between BST and GMT across the DST transition.
  const londonZoneFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    timeZoneName: 'short',
  });

  function getLondonZoneAbbr(date) {
    const part = londonZoneFormatter.formatToParts(date).find((p) => p.type === 'timeZoneName');
    return part ? part.value : 'UK';
  }

  function getIstParts(date) {
    const map = {};
    istFormatter.formatToParts(date).forEach((part) => {
      map[part.type] = part.value;
    });
    return {
      weekday: map.weekday,
      isoDate: `${map.year}-${map.month}-${map.day}`,
      // Some engines format midnight as hour "24" when hour12 is false.
      hour: map.hour === '24' ? 0 : Number(map.hour),
      minute: Number(map.minute),
    };
  }

  function isMarketOpen(now) {
    const ist = getIstParts(now);
    if (ist.weekday === 'Sat' || ist.weekday === 'Sun') return false;
    if (holidayDates.includes(ist.isoDate)) return false;

    const minutesSinceMidnight = ist.hour * 60 + ist.minute;
    const marketOpenMinutes = 9 * 60 + 15; // 9:15 AM
    const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM
    return minutesSinceMidnight >= marketOpenMinutes && minutesSinceMidnight < marketCloseMinutes;
  }

  function update() {
    const dotEl = document.querySelector('[data-field="market-dot"]');
    const marketTextEl = document.querySelector('[data-field="market-text"]');
    if (!dotEl || !marketTextEl) return;

    const open = isMarketOpen(new Date());
    dotEl.className = `status-bar__dot ${open ? 'open' : 'closed'}`;
    marketTextEl.textContent = open ? 'OPEN' : 'CLOSED';
  }

  function updateClocks() {
    const istEl = document.querySelector('[data-field="ist-clock"]');
    const londonEl = document.querySelector('[data-field="london-clock"]');
    if (!istEl || !londonEl) return;

    const now = new Date();
    istEl.textContent = `${istClockFormatter.format(now)} IST`;
    londonEl.textContent = `${londonClockFormatter.format(now)} ${getLondonZoneAbbr(now)}`;
  }

  // Load the holiday list before the first paint so market status is correct
  // immediately, rather than flashing an un-holiday-aware status for a moment.
  await loadHolidays();
  update();
  updateClocks();
  // Market status only changes at minute boundaries (9:15/15:30) — no need to
  // re-check every second.
  setInterval(update, 30000);
  // The clocks display seconds, so they do need a per-second tick.
  setInterval(updateClocks, 1000);

  // Some browsers pause/throttle CSS entrance animations (`.fade-in`, `.card`)
  // on a backgrounded or otherwise non-visible tab. If that happens while the
  // page loads, elements can be left stuck at their opacity: 0 starting state
  // forever. Force the finished state after a few checkpoints so content is
  // never permanently invisible — checked more than once since cards are
  // appended asynchronously (after the /api/config fetch resolves) and may
  // not exist in the DOM yet at the first checkpoint.
  function revealStuckElements() {
    document.querySelectorAll('.fade-in, .card').forEach((el) => {
      if (getComputedStyle(el).opacity === '0') {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
  }
  [1000, 2000, 3500, 5000].forEach((delay) => setTimeout(revealStuckElements, delay));
})();
