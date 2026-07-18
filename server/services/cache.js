// Tiny in-memory "last known good" store so a failed upstream fetch can still
// serve the previous value with a stale flag instead of breaking the UI.
const store = new Map();

function set(id, data) {
  store.set(id, { ...data, fetchedAt: Date.now(), stale: false });
}

function getFresh(id) {
  return store.get(id) || null;
}

function getStale(id) {
  const entry = store.get(id);
  if (!entry) return null;
  return { ...entry, stale: true };
}

module.exports = { set, getFresh, getStale };
