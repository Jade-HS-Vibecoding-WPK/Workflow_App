// ============================================================
// Datenmodell: So sieht jeder Eintrag aus.
//
// Jede Funktion "neu…" erzeugt einen leeren Eintrag mit allen Feldern
// und sinnvollen Startwerten. Die App füllt dann nur noch aus,
// was die Person eingibt.
//
// Regeln aus CLAUDE.md:
//  - Jeder Eintrag hat eine eindeutige ID und einen Besitzer.
//  - Freigabe-Felder und "zuständig" sind schon da (für Version 2),
//    werden aber noch nicht angezeigt.
//  - Abhängigkeiten zwischen Unterzielen zeigen nur auf IDs.
// ============================================================

const Model = (() => {
  // Die Arten von Einträgen
  const TYPES = {
    FEST: "termin_fest",          // feste wiederkehrende Termine (Arbeit, Uni)
    EINMALIG: "termin_einmalig",  // einmalige Termine (Arzt, Verabredung, Zocken, Urlaub)
    AUFGABE: "aufgabe",           // einmal erledigen (Reisepass), optional wiederkehrend
    ZIEL: "ziel",                 // Deadline + Unterziele mit kritischem Pfad
    SPERRZEIT: "sperrzeit",       // z. B. "keine Termine nach 20 Uhr"
    TAGESNOTIZ: "tagesnotiz",     // kurze Notiz an einem Datum
  };

  // Arten von Abhängigkeiten (kritischer Pfad)
  const DEP_TYPES = {
    EA: "ende-anfang",   // erst fertig, dann starten (Standard)
    AA: "anfang-anfang", // gleichzeitig starten
    EE: "ende-ende",     // gleichzeitig fertig
    AE: "anfang-ende",   // erst wenn A startet, darf B enden
  };

  const OWNER_LOCAL = "lokal"; // Diese Woche gibt es nur eine Person: das Gerät

  // Bereiche: eigener Zeitplan oder Baustelle (Baumanagement, Gewerke arbeiten)
  const AREAS = { PRIVAT: "privat", BAU: "bau" };

  // Eindeutige ID erzeugen
  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  const now = () => new Date().toISOString();

  // Felder, die JEDER Eintrag hat
  function base(type, fields = {}) {
    return {
      id: newId(),
      type,
      owner: OWNER_LOCAL,
      area: AREAS.PRIVAT, // wird beim Speichern auf den aktiven Bereich gesetzt
      title: "",
      notes: "",
      priority: 3,        // 1 = sehr niedrig … 5 = sehr hoch
      done: false,
      doneAt: null,       // wann abgehakt (für Ordner "Erledigt", Löschen nach 6 Monaten)
      createdAt: now(),
      updatedAt: now(),
      // Version 2: Freigabe (noch nicht in der Oberfläche)
      sharing: { level: null, sharedWith: [] },
      ...fields,
    };
  }

  // Wiederholung (für feste Termine und Aufgaben)
  // freq: "einmalig" | "woechentlich" | "zweiwoechentlich" | "monatlich"
  function recurrence(fields = {}) {
    return {
      freq: "woechentlich",
      weekdays: [],           // 0 = Sonntag … 6 = Samstag
      monthlyMode: "datum",   // "datum" (jeden 5.) oder "wochentag" (jeden 1. Montag)
      dayOfMonth: null,       // z. B. 5
      nthWeek: null,          // 1–5, -1 = letzter
      from: null,             // Zeitraum: Startdatum "JJJJ-MM-TT"
      until: null,            // Zeitraum: Enddatum (z. B. Semesterende)
      ...fields,
    };
  }

  // ---------- Die einzelnen Arten ----------

  function neuerFesterTermin(fields = {}) {
    return base(TYPES.FEST, {
      start: "08:00",       // Uhrzeit "HH:MM"
      end: "09:00",
      location: "",
      bufferMin: 0,         // Puffer vor/nach dem Termin (Minuten)
      recurrence: recurrence(),
      exceptions: [],       // einzelne Tage: [{ date: "JJJJ-MM-TT", status: "abgesagt" }]
      showInPrivate: false, // nur Baustelle: "Auch im Wochenplan anzeigen" (blockiert dann private Zeit)
      uni: false,           // Uni-Veranstaltung: findet nur in der Vorlesungszeit statt (Einstellungen → Semester)
      ...fields,
    });
  }

  function neuerEinmaligerTermin(fields = {}) {
    return base(TYPES.EINMALIG, {
      date: null,           // "JJJJ-MM-TT"
      start: "10:00",
      end: "11:00",
      allDay: false,        // ganztägig (z. B. Urlaub)
      endDate: null,        // bei mehrtägig: letzter Tag
      location: "",
      bufferMin: 0,
      showInPrivate: false, // nur Baustelle: "Auch im Wochenplan anzeigen"
      ...fields,
    });
  }

  function neueAufgabe(fields = {}) {
    return base(TYPES.AUFGABE, {
      deadline: null,       // optional "JJJJ-MM-TT"
      durationMin: 30,      // geschätzte Dauer
      color: "#ba7517",     // frei wählbar
      recurrence: recurrence({ freq: "einmalig" }),
      // Vorschläge der App ("Optionen") und bestätigte Blöcke.
      // Aufteilen = mehrere Blöcke.
      slots: [],            // [{ id, date, start, end, confirmed: false }]
      ...fields,
    });
  }

  function neuesZiel(fields = {}) {
    return base(TYPES.ZIEL, {
      deadline: null,       // "JJJJ-MM-TT"
      startDate: null,      // Baustelle: Baubeginn (vorher plant der Netzplan nichts)
      color: "#7f77dd",     // frei wählbar
      orderMode: "frei",    // "frei" = Reihenfolge per Abhängigkeiten, "alle-bis-deadline"
      subgoals: [],         // Liste von neuesUnterziel()
      ...fields,
    });
  }

  function neuesUnterziel(fields = {}) {
    return {
      id: newId(),
      title: "",
      order: 0,
      mode: "aufwand",      // "aufwand" (Stunden) oder "dauer" (Kalendertage)
      estimateHours: 1,     // bei Aufwand
      durationDays: 1,      // bei Dauer
      deadline: null,       // Zwischen-Deadline (optional)
      progressPercent: 0,
      log: [],              // Fortschritt: [{ date, hours, percent }]
      initialEstimateHours: null, // erste Schätzung, gemerkt beim ersten Eintrag (Statistik)
      // Abhängigkeiten: zeigen NUR auf IDs anderer Unterziele
      dependencies: [],     // [{ fromId, type: "ende-anfang", lagDays: 0 }] (lag auch negativ)
      slots: [],            // geplante Arbeitsblöcke (wie bei Aufgaben)
      done: false,
      doneAt: null,
      assignee: OWNER_LOCAL, // wer arbeitet daran; Baustelle: Gewerk (z. B. "Estrichleger")
      workFrom: null,        // Baustelle: eigene Arbeitszeit des Gewerks (sonst Einstellung, Standard 07:00–16:00)
      workTo: null,
      ...fields,
    };
  }

  function neueSperrzeit(fields = {}) {
    return base(TYPES.SPERRZEIT, {
      title: "Freizeit",
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      start: "20:00",
      end: "00:00",         // 00:00 = bis Mitternacht; Ende vor Beginn = über Nacht (z. B. 22:00–06:00)
      active: true,         // false = pausiert (zählt nicht)
      ...fields,
    });
  }

  function neueTagesnotiz(fields = {}) {
    return base(TYPES.TAGESNOTIZ, {
      date: null,
      ...fields,
    });
  }

  // Fortschritt eintragen und Restzeit schätzen
  // Beispiel: 2 Std. gearbeitet, jetzt 20 % → noch ca. 8 Std.
  function restzeitStunden(subgoal) {
    const worked = subgoal.log.reduce((sum, e) => sum + (e.hours || 0), 0);
    const p = subgoal.progressPercent;
    if (subgoal.mode !== "aufwand") return null;
    if (p >= 100) return 0;
    if (worked > 0 && p > 0) return Math.round((worked / p) * (100 - p) * 10) / 10;
    return Math.max(subgoal.estimateHours - worked, 0);
  }

  return {
    TYPES, DEP_TYPES, OWNER_LOCAL, AREAS, newId,
    neuerFesterTermin, neuerEinmaligerTermin, neueAufgabe,
    neuesZiel, neuesUnterziel, neueSperrzeit, neueTagesnotiz,
    restzeitStunden,
  };
})();
