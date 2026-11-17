// ============================================================
// Speicher-Baustein: die EINZIGE Stelle, die Daten speichert.
//
// Der Rest der App fragt nur hier nach ("gib mir alle Aufgaben",
// "speichere diesen Termin"). Wie und wo gespeichert wird, weiß
// nur dieser Baustein.
//
// Diese Woche: lokal im Browser des Geräts (localStorage).
// Version 2:   nur dieser Baustein wird auf einen Server umgestellt.
//              Deshalb liefern alle Funktionen schon jetzt ein
//              "Promise" zurück (Antwort kommt später), so wie es
//              bei einem Server auch wäre. In der App heißt das: await.
// ============================================================

const Store = (() => {
  const KEY = "workflow-daten";
  const SCHEMA_VERSION = 1; // erhöhen, wenn sich das Datenmodell grundlegend ändert

  let data = load();          // alle Einträge im Arbeitsspeicher
  const listeners = new Set(); // wer bei Änderungen Bescheid bekommen will

  // ---------- intern: laden und schreiben ----------
  function emptyData() {
    return { schemaVersion: SCHEMA_VERSION, entries: {}, settings: {} };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyData();
      return migrate(JSON.parse(raw));
    } catch (err) {
      console.warn("Daten konnten nicht geladen werden, starte leer:", err);
      return emptyData();
    }
  }

  // Ältere Datenstände auf die aktuelle Form bringen (für später)
  function migrate(d) {
    if (!d || typeof d !== "object" || !d.entries) return emptyData();
    d.settings = d.settings || {};
    d.schemaVersion = SCHEMA_VERSION;
    return d;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      // z. B. privater Modus oder Speicher voll
      console.error("Speichern fehlgeschlagen:", err);
      return false;
    }
  }

  function notify(change) {
    listeners.forEach((fn) => {
      try { fn(change); } catch (err) { console.error(err); }
    });
  }

  const copy = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));

  // ---------- öffentlich: das darf die App benutzen ----------

  // ---------- Bereiche: "privat" oder "bau" (Baustelle) ----------
  // Die App zeigt immer nur einen Bereich. Im privaten Bereich erscheinen
  // zusätzlich Baustellen-Termine mit "Auch im Wochenplan anzeigen".
  const areaOf = (e) => e.area || "privat";
  const getArea = () => (data.settings.bereich === "bau" ? "bau" : "privat");
  function visibleIn(e, area) {
    if (areaOf(e) === area) return true;
    return area === "privat" && e.showInPrivate === true;
  }
  async function setArea(area) {
    await saveSettings({ bereich: area === "bau" ? "bau" : "privat" });
  }

  // Alle Einträge einer Art im aktiven Bereich, z. B. Store.list(Model.TYPES.AUFGABE)
  // opts.area = anderer Bereich, opts.all = alle Bereiche
  async function list(type, opts = {}) {
    const area = opts.area || getArea();
    let all = Object.values(data.entries);
    if (!opts.all) all = all.filter((e) => visibleIn(e, area));
    return copy(type ? all.filter((e) => e.type === type) : all);
  }

  // Einen Eintrag über seine ID holen
  async function get(id) {
    return copy(data.entries[id] || null);
  }

  // Neu anlegen oder ändern (erkennt das selbst an der ID)
  async function save(entry) {
    if (!entry || !entry.id || !entry.type) throw new Error("Eintrag braucht id und type");
    const isNew = !data.entries[entry.id];
    const stored = { ...copy(entry), updatedAt: new Date().toISOString() };
    if (isNew && !entry.areaFixed) stored.area = getArea(); // neue Einträge landen im aktiven Bereich
    delete stored.areaFixed;
    data.entries[stored.id] = stored;
    if (!persist()) throw new Error("Speichern fehlgeschlagen");
    notify({ action: isNew ? "neu" : "geändert", entry: copy(stored) });
    return copy(stored);
  }

  // Mehrere Einträge auf einmal speichern (z. B. wenn der Planer viele
  // Vorschläge verschiebt) – nur EIN Mal schreiben und Bescheid geben.
  async function saveMany(entries, meta = {}) {
    if (!entries.length) return;
    const stamp = new Date().toISOString();
    for (const entry of entries) {
      if (!entry || !entry.id || !entry.type) throw new Error("Eintrag braucht id und type");
      data.entries[entry.id] = { ...copy(entry), updatedAt: stamp };
    }
    if (!persist()) throw new Error("Speichern fehlgeschlagen");
    notify({ action: "mehrere", count: entries.length, ...meta });
  }

  // Löschen
  async function remove(id) {
    const entry = data.entries[id];
    if (!entry) return false;
    delete data.entries[id];
    persist();
    notify({ action: "gelöscht", entry: copy(entry) });
    return true;
  }

  // Einstellungen (Schriftgröße, Baumanagement-Modus, …)
  async function getSettings() {
    return copy(data.settings);
  }
  async function saveSettings(patch) {
    data.settings = { ...data.settings, ...copy(patch) };
    persist();
    notify({ action: "einstellungen", settings: copy(data.settings) });
    return copy(data.settings);
  }

  // Bei Änderungen Bescheid geben (z. B. damit die Ansicht neu zeichnet)
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn); // zum Abmelden
  }

  // ---------- Daten sichern / wiederherstellen ----------
  async function exportJSON() {
    return JSON.stringify({ app: "workflow", exportedAt: new Date().toISOString(), ...data }, null, 2);
  }

  async function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.app !== "workflow" || !parsed.entries) {
      throw new Error("Das ist keine Sicherungsdatei dieser App.");
    }
    data = migrate({ schemaVersion: parsed.schemaVersion, entries: parsed.entries, settings: parsed.settings });
    persist();
    notify({ action: "importiert" });
    return Object.keys(data.entries).length;
  }

  // Alles löschen (nur zum Testen / Zurücksetzen)
  async function clearAll() {
    data = emptyData();
    persist();
    notify({ action: "geleert" });
  }

  // Wenn die App in einem zweiten Tab geändert wird: neu laden
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    data = load();
    notify({ action: "extern" });
  });

  return { list, get, save, saveMany, remove, getArea, setArea, getSettings, saveSettings, subscribe, exportJSON, importJSON, clearAll };
})();
