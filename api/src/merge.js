// ============================================================
// Abgleich zweier Datenstände (Gerät ⇄ Server).
// Gleiche Regel wie in der App (cloud.js → Cloud.merge):
//  - pro Eintrag gewinnt die neueste Änderung (updatedAt)
//  - eine Löschung gewinnt, wenn sie neuer ist als die letzte Änderung
//  - Einstellungen: der neuere Stand gewinnt als Ganzes
// ============================================================

function merge(a, b) {
  a = a || {}; b = b || {};
  const entries = {};
  const deleted = { ...(a.deleted || {}) };
  for (const [id, at] of Object.entries(b.deleted || {})) if (!deleted[id] || at > deleted[id]) deleted[id] = at;
  const ids = new Set([...Object.keys(a.entries || {}), ...Object.keys(b.entries || {})]);
  for (const id of ids) {
    const x = (a.entries || {})[id], y = (b.entries || {})[id];
    const win = !x ? y : !y ? x : String(y.updatedAt || "") > String(x.updatedAt || "") ? y : x;
    if (deleted[id] && String(deleted[id]) >= String(win.updatedAt || "")) continue; // gelöscht
    entries[id] = win;
    delete deleted[id]; // neuer als die Löschung (z. B. "Rückgängig")
  }
  const aS = a.settingsUpdatedAt || "", bS = b.settingsUpdatedAt || "";
  const newer = bS > aS ? b : a;
  return { entries, deleted, settings: newer.settings || {}, settingsUpdatedAt: newer.settingsUpdatedAt || null };
}

module.exports = { merge };
