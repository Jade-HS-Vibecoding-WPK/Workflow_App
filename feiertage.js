// ============================================================
// Daten von außen: Feiertage
//
// Quelle: Nager.Date (https://date.nager.at), kostenlos, ohne
// Anmeldung und ohne API-Key. Es werden nur Jahr und Land (DE)
// abgefragt, keine persönlichen Daten.
//
// Die geladenen Feiertage werden über den Speicher-Baustein
// zwischengespeichert. So funktionieren sie auch offline, und
// die App fragt höchstens alle 30 Tage neu nach.
// ============================================================

const Holidays = (() => {
  const API = "https://date.nager.at/api/v3/PublicHolidays";
  const MAX_AGE_DAYS = 30;

  const STATES = {
    BW: "Baden-Württemberg", BY: "Bayern", BE: "Berlin", BB: "Brandenburg",
    HB: "Bremen", HH: "Hamburg", HE: "Hessen", MV: "Mecklenburg-Vorpommern",
    NI: "Niedersachsen", NW: "Nordrhein-Westfalen", RP: "Rheinland-Pfalz", SL: "Saarland",
    SN: "Sachsen", ST: "Sachsen-Anhalt", SH: "Schleswig-Holstein", TH: "Thüringen",
  };
  const DEFAULT_STATE = "NI"; // Jade Hochschule: Niedersachsen

  // Schneller Nachschlage-Speicher im Arbeitsspeicher: { "2026-12-25": "1. Weihnachtstag" }
  let byDate = {};
  let state = DEFAULT_STATE;
  let skipFixed = false;
  let status = { ok: null, message: "Noch nicht geladen" };

  // Feiertag an diesem Datum? (Name oder null)
  const on = (iso) => byDate[iso] || null;

  let version = 0; // zählt hoch, wenn sich die Feiertage ändern (für Zwischenspeicher anderer Bausteine)

  function rebuild(settings) {
    version++;
    state = settings.feiertageLand || DEFAULT_STATE;
    skipFixed = !!settings.feiertageFesteAusfallen;
    byDate = {};
    const cache = settings.feiertageCache || {};
    for (const key of Object.keys(cache)) {
      if (!key.endsWith("-" + state)) continue;
      for (const h of cache[key].list) byDate[h.date] = h.name;
    }
  }

  // Ein Jahr aus dem Internet holen und für das Bundesland filtern
  async function fetchYear(year, st) {
    const res = await fetch(`${API}/${year}/DE`);
    if (!res.ok) throw new Error("Server antwortet mit Fehler " + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Unerwartete Antwort");
    return data
      .filter((h) => h.global || (h.counties || []).includes("DE-" + st))
      .map((h) => ({ date: h.date, name: h.localName || h.name }));
  }

  // Laden, falls nötig (oder erzwungen). Läuft beim Start im Hintergrund.
  async function refresh({ force = false } = {}) {
    const settings = await Store.getSettings();
    rebuild(settings);
    const now = new Date();
    const years = [now.getFullYear(), now.getFullYear() + 1];
    const cache = { ...(settings.feiertageCache || {}) };
    let changed = false;

    try {
      for (const y of years) {
        const key = `${y}-${state}`;
        const entry = cache[key];
        const age = entry ? (Date.now() - new Date(entry.fetchedAt).getTime()) / 86400000 : Infinity;
        if (!force && age < MAX_AGE_DAYS) continue;
        cache[key] = { fetchedAt: now.toISOString(), list: await fetchYear(y, state) };
        changed = true;
      }
      status = { ok: true, message: changed ? "Gerade aktualisiert" : "Aktuell (aus dem Zwischenspeicher)" };
    } catch (err) {
      console.warn("Feiertage konnten nicht geladen werden:", err);
      const hasCache = years.some((y) => cache[`${y}-${state}`]);
      status = {
        ok: false,
        message: hasCache
          ? "Keine Verbindung – es werden die zuletzt geladenen Feiertage angezeigt."
          : "Feiertage konnten nicht geladen werden. Prüfe die Internetverbindung.",
      };
    }

    if (changed) {
      // Nur die letzten Jahre aufheben, damit der Speicher klein bleibt
      for (const key of Object.keys(cache)) {
        if (Number(key.slice(0, 4)) < now.getFullYear() - 1) delete cache[key];
      }
      rebuild({ ...settings, feiertageCache: cache }); // erst nachschlagen können …
      await Store.saveSettings({ feiertageCache: cache }); // … dann speichern (löst Neuzeichnen aus)
    } else {
      rebuild(await Store.getSettings());
    }
    return status;
  }

  // Bundesland wechseln: sofort umstellen, dann ggf. nachladen
  async function setState(code) {
    if (!STATES[code]) return;
    const settings = { ...(await Store.getSettings()), feiertageLand: code };
    rebuild(settings);
    await Store.saveSettings({ feiertageLand: code });
    return refresh();
  }

  // Feste Termine an Feiertagen automatisch ausfallen lassen (an/aus)
  async function setSkipFixed(on) {
    skipFixed = !!on;
    await Store.saveSettings({ feiertageFesteAusfallen: skipFixed });
  }

  // Nach Import oder Zurücksetzen der Daten neu aufbauen
  Store.subscribe(async (change) => {
    if (change.action === "importiert" || change.action === "geleert" || change.action === "abgleich") {
      rebuild(await Store.getSettings());
      refresh(); // fehlende Jahre gleich nachladen (z. B. nach "Alle Daten löschen")
    }
  });

  // Alle Feiertage ab heute (für die Einstellungen)
  function upcoming(limit = 6) {
    const today = Schedule.isoDate(new Date());
    return Object.entries(byDate)
      .filter(([d]) => d >= today)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, limit)
      .map(([date, name]) => ({ date, name }));
  }

  return {
    STATES, on, refresh, upcoming, setState, setSkipFixed,
    get state() { return state; },
    get version() { return version; },
    get skipFixed() { return skipFixed; },
    get status() { return status; },
  };
})();
