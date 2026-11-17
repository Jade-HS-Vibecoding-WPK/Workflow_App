// ============================================================
// Statistik – Grundgerüst für zwei spätere Funktionen:
//
//  B3 "Schätzung lernen": Wie gut treffen meine Schätzungen?
//     Vergleicht bei fertigen Unterzielen (Aufwand) die erste
//     Schätzung mit der wirklich gearbeiteten Zeit.
//     Faktor 1,3 = ich brauche im Schnitt 30 % länger.
//     (Die App rechnet das noch NICHT automatisch ein.)
//
//  B4 "Wochenrückblick": Was habe ich in einer Woche geschafft?
//
// Die Daten dafür schreibt die App schon mit:
//  - Unterziele: log [{ date, hours, percent }] + initialEstimateHours
//  - Aufgaben:   doneAt bzw. history [{ doneAt, estimateMin }]
// ============================================================

const Stats = (() => {
  const S = Schedule;
  const T = Model.TYPES;
  const inRange = (iso, from, to) => !!iso && iso >= from && iso <= to;
  const day = (ts) => (ts ? S.isoDate(new Date(ts)) : null);

  // B4: Zusammenfassung einer Woche (Montag bis Sonntag)
  function weekSummary(entries, monday) {
    const from = S.isoDate(monday);
    const to = S.isoDate(S.addDays(monday, 6));
    let goalHours = 0, subgoalsDone = 0, tasksDone = 0, taskMinutes = 0;
    for (const e of entries) {
      if (e.type === T.ZIEL) {
        for (const sg of e.subgoals || []) {
          for (const l of sg.log || []) if (inRange(l.date, from, to)) goalHours += l.hours || 0;
          if (sg.done && inRange(day(sg.doneAt), from, to)) subgoalsDone++;
        }
      }
      if (e.type === T.AUFGABE) {
        const doneDays = (e.history || []).map((h) => ({ d: day(h.doneAt), min: h.estimateMin ?? e.durationMin }));
        // Einmalige Aufgaben ohne Verlaufseintrag (ältere Daten)
        if (e.done && !(e.history || []).some((h) => h.doneAt === e.doneAt)) doneDays.push({ d: day(e.doneAt), min: e.durationMin });
        for (const x of doneDays) if (inRange(x.d, from, to)) { tasksDone++; taskMinutes += x.min || 0; }
      }
    }
    return { from, to, goalHours: Math.round(goalHours * 10) / 10, subgoalsDone, tasksDone, taskMinutes };
  }

  // B3: Wie genau sind meine Schätzungen? (nur fertige Unterziele mit Aufwand)
  function estimateAccuracy(entries) {
    let est = 0, act = 0, n = 0;
    for (const e of entries) {
      if (e.type !== T.ZIEL) continue;
      for (const sg of e.subgoals || []) {
        if (!sg.done || sg.mode !== "aufwand") continue;
        const worked = (sg.log || []).reduce((s, l) => s + (l.hours || 0), 0);
        const first = sg.initialEstimateHours ?? sg.estimateHours;
        if (!(worked > 0 && first > 0)) continue;
        est += first; act += worked; n++;
      }
    }
    return { n, factor: n ? Math.round((act / est) * 100) / 100 : null };
  }

  // Kurzer Text für die Anzeige, z. B. "im Schnitt 30 % länger als geschätzt"
  function accuracyText(acc) {
    if (!acc.n) return "";
    const p = Math.round((acc.factor - 1) * 100);
    const base = `aus ${acc.n} fertigen Unterziel${acc.n === 1 ? "" : "en"}`;
    if (Math.abs(p) < 5) return `Deine Schätzungen passen gut (${base}).`;
    return p > 0 ? `Du brauchst im Schnitt ${p} % länger als geschätzt (${base}).`
      : `Du bist im Schnitt ${-p} % schneller als geschätzt (${base}).`;
  }

  return { weekSummary, estimateAccuracy, accuracyText };
})();
