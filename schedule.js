// ============================================================
// Zeitplan-Logik: Was findet an welchem Tag statt?
//
// Rechnet aus den gespeicherten Einträgen aus, was an einem
// bestimmten Datum im Plan steht (Wiederholungen, Ausnahmen,
// Sperrzeiten, Vorschläge …). Wird von "Heute" und später von
// "Woche" und "Kalender" benutzt.
// ============================================================

const Schedule = (() => {
  const T = Model.TYPES;
  const pad = (n) => String(n).padStart(2, "0");

  // ---------- Datums-Helfer ----------
  function isoDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function parseDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function toMin(hhmm) {
    const [h, m] = String(hhmm || "0:0").split(":").map(Number);
    return h * 60 + (m || 0);
  }
  function fromMin(min) {
    return pad(Math.floor(min / 60)) + ":" + pad(min % 60);
  }
  function startOfWeek(d) { // Montag
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  function addDays(d, n) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  // ---------- Semester (Einstellungen): Vorlesungszeit ----------
  // { von, bis, freiVon, freiBis } – selbst eingetragen, keine Datenquelle nötig
  let semester = null;
  const readSemester = (st) => { semester = st && st.semester && st.semester.von && st.semester.bis ? st.semester : null; };
  Store.getSettings().then(readSemester);
  Store.subscribe((c) => {
    if (c.settings) readSemester(c.settings);
    else if (c.action === "importiert" || c.action === "geleert") Store.getSettings().then(readSemester);
  });
  // Arbeitszeit der Gewerke auf der Baustelle (Einstellungen → Baustelle)
  let bauZeit = { von: "07:00", bis: "16:00" };
  const readBau = (st) => { bauZeit = { von: (st && st.bauArbeitVon) || "07:00", bis: (st && st.bauArbeitBis) || "16:00" }; };
  Store.getSettings().then(readBau);
  Store.subscribe((c) => {
    if (c.settings) readBau(c.settings);
    else if (c.action === "importiert" || c.action === "geleert") Store.getSettings().then(readBau);
  });

  // Liegt der Tag in der Vorlesungszeit? (ohne Semester-Angabe: immer ja)
  function inLecture(iso) {
    if (!semester) return true;
    if (iso < semester.von || iso > semester.bis) return false;
    if (semester.freiVon && semester.freiBis && iso >= semester.freiVon && iso <= semester.freiBis) return false;
    return true;
  }

  // ---------- Wiederholung: findet der Termin an diesem Tag statt? ----------
  function recursOn(rec, date, fallbackFrom) {
    if (!rec) return false;
    const iso = isoDate(date);
    if (rec.from && iso < rec.from) return false;
    if (rec.until && iso > rec.until) return false;
    const wd = date.getDay();
    const weekdays = rec.weekdays || [];

    switch (rec.freq) {
      case "woechentlich":
        return weekdays.includes(wd);
      case "zweiwoechentlich": {
        if (!weekdays.includes(wd)) return false;
        const anchor = startOfWeek(parseDate(rec.from || fallbackFrom));
        const weeks = Math.round((startOfWeek(date) - anchor) / (7 * 86400000));
        return ((weeks % 2) + 2) % 2 === 0;
      }
      case "monatlich":
        if (rec.monthlyMode === "datum") return date.getDate() === rec.dayOfMonth;
        // "wochentag": z. B. jeder 1. Montag, -1 = letzter
        if (!weekdays.includes(wd)) return false;
        if (rec.nthWeek === -1) return addDays(date, 7).getMonth() !== date.getMonth();
        return Math.ceil(date.getDate() / 7) === rec.nthWeek;
      default:
        return false; // "einmalig"
    }
  }

  // ---------- Alles, was an einem Tag im Plan steht ----------
  // Ergebnis: { timed: [...Blöcke mit Uhrzeit], allDay: [...], notes: [...] }
  function dayPlan(entries, date) {
    const iso = isoDate(date);
    const timed = [];
    const allDay = [];
    const notes = [];
    const goalsById = {};

    // Feiertag (Daten von außen, siehe feiertage.js)
    const holiday = typeof Holidays !== "undefined" ? Holidays.on(iso) : null;
    if (holiday) allDay.push({ id: null, kind: "feiertag", title: holiday });

    for (const e of entries) {
      switch (e.type) {
        case T.FEST: {
          if (!recursOn(e.recurrence, date, (e.createdAt || iso).slice(0, 10))) break;
          if (e.uni && !inLecture(iso)) break; // Uni-Veranstaltung außerhalb der Vorlesungszeit
          const ex = (e.exceptions || []).find((x) => x.date === iso);
          // Fällt heute aus → Zeit ist frei. Wird nur noch blass angezeigt,
          // damit man die Absage wieder zurücknehmen kann.
          // Einstellung: feste Termine fallen an Feiertagen automatisch aus
          const byHoliday = !!(holiday && Holidays.skipFixed);
          const cancelled = !!(ex && ex.status === "abgesagt") || byHoliday;
          timed.push(block(e, "fest", e.start, e.end, {
            sub: byHoliday ? "Feiertag" : cancelled ? "abgesagt" : bauSub(e), buffer: cancelled ? 0 : e.bufferMin, cancelled,
          }));
          break;
        }
        case T.EINMALIG: {
          if (e.allDay) {
            const last = e.endDate || e.date;
            if (e.date && e.date <= iso && iso <= last) allDay.push({ id: e.id, kind: "einmalig", title: e.title, sub: e.area === "bau" ? "Baustelle" : "" });
          } else if (e.date === iso) {
            timed.push(block(e, "einmalig", e.start, e.end, { sub: bauSub(e), buffer: e.bufferMin }));
          }
          break;
        }
        case T.SPERRZEIT: {
          if (e.active === false) break; // pausiert
          const wds = e.weekdays || [];
          const overnight = toMin(e.end) <= toMin(e.start); // z. B. 22:00–06:00
          if (wds.includes(date.getDay())) {
            timed.push(block(e, "sperr", e.start, overnight ? "24:00" : e.end));
          }
          // Teil nach Mitternacht gehört zum Vortag
          if (overnight && toMin(e.end) > 0 && wds.includes((date.getDay() + 6) % 7)) {
            timed.push(block(e, "sperr", "00:00", e.end));
          }
          break;
        }
        case T.AUFGABE:
          for (const s of e.slots || []) {
            if (s.date !== iso) continue;
            timed.push(block(e, "aufgabe", s.start, s.end, {
              color: e.color, option: !s.confirmed, done: e.done, slotId: s.id,
            }));
          }
          break;
        case T.ZIEL:
          goalsById[e.id] = e;
          // Baustelle: laufende Vorgänge (Gewerke) als Zeitblöcke (Arbeitszeit des Gewerks)
          if (e.area === "bau" && !e.done && typeof CPM !== "undefined") {
            const res = CPM.computeBau(e);
            const idx = Math.round((parseDate(iso) - parseDate(isoDate(new Date()))) / 86400000);
            if (!res.cycle && idx >= 0 && res.isWork(idx)) {
              for (const sg of e.subgoals || []) {
                const n = res.nodes[sg.id];
                if (!n || n.done || !(n.ES <= idx && idx < n.EF)) continue;
                const von = sg.workFrom || bauZeit.von, bis = sg.workTo || bauZeit.bis;
                timed.push(block(e, "vorgang", von, bis, {
                  title: sg.title, color: e.color, critical: n.critical, subgoalId: sg.id,
                  sub: [sg.assignee && sg.assignee !== Model.OWNER_LOCAL ? sg.assignee : "", n.critical ? "kritisch" : ""].filter(Boolean).join(" · ") || "Vorgang",
                }));
              }
            }
          }
          for (const sg of e.subgoals || []) {
            for (const s of sg.slots || []) {
              if (s.date !== iso) continue;
              timed.push(block(e, "ziel", s.start, s.end, {
                title: sg.title, sub: e.title, color: e.color, option: !s.confirmed,
                done: sg.done, slotId: s.id, subgoalId: sg.id,
                progress: sg.progressPercent,
              }));
            }
          }
          break;
        case T.TAGESNOTIZ:
          if (e.date === iso) notes.push({ id: e.id, title: e.title });
          break;
      }
    }

    timed.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
    return { timed, allDay, notes };
  }

  // Baustellen-Termine im privaten Plan erkennbar machen
  const bauSub = (e) => [e.area === "bau" ? "Baustelle" : "", e.location].filter(Boolean).join(" · ");

  function block(e, kind, start, end, extra = {}) {
    const startMin = toMin(start);
    let endMin = toMin(end);
    if (endMin <= startMin) endMin = startMin + 30; // Sicherheit bei falscher Eingabe
    return {
      id: e.id, kind, title: e.title, sub: "", priority: e.priority,
      start, end, startMin, endMin, buffer: 0, color: null, option: false, done: false, cancelled: false,
      ...extra,
    };
  }

  // ---------- Zahlen für die Kacheln ----------
  function counts(entries, today) {
    const iso = isoDate(today);
    const weekEnd = isoDate(addDays(startOfWeek(today), 6)); // Sonntag
    const plan = dayPlan(entries, today);

    let dueThisWeek = 0;
    let open = 0;
    let behind = 0;

    for (const e of entries) {
      if (e.type === T.AUFGABE && !e.done) {
        open++;
        if (e.deadline && e.deadline <= weekEnd) dueThisWeek++;
      }
      if (e.type === T.ZIEL && !e.done) {
        open++;
        if (e.deadline && e.deadline <= weekEnd) dueThisWeek++;
        let goalBehind = e.deadline && e.deadline < iso;
        for (const sg of e.subgoals || []) {
          if (sg.done) continue;
          if (sg.deadline && sg.deadline <= weekEnd) dueThisWeek++;
          // Vorläufig: überfällige Unterziele. Der kritische Pfad kommt in Feature 9.
          if (sg.deadline && sg.deadline < iso) goalBehind = true;
        }
        if (goalBehind) behind++;
      }
    }

    // Kritischer Pfad (cpm.js): Ziele, die ihre Deadline so nicht schaffen
    if (typeof CPM !== "undefined") behind = CPM.behindCount(entries, today);

    return {
      today: plan.timed.filter((b) => b.kind !== "sperr" && !b.cancelled).length + plan.allDay.filter((a) => a.kind !== "feiertag").length,
      dueThisWeek,
      open,
      behind,
    };
  }

  // ---------- Überschneidungen: Blöcke nebeneinander legen ----------
  // Gibt jedem Block "col" (Spalte) und "cols" (Anzahl Spalten in seiner Gruppe).
  function layoutColumns(blocks) {
    let group = [];
    let groupEnd = -1;
    const flush = () => {
      const colEnds = [];
      for (const b of group) {
        let c = colEnds.findIndex((end) => end <= b.startMin);
        if (c === -1) { c = colEnds.length; colEnds.push(0); }
        colEnds[c] = b.endMin;
        b.col = c;
      }
      for (const b of group) b.cols = colEnds.length;
      group = [];
    };
    for (const b of blocks) {
      if (b.startMin >= groupEnd && group.length) flush();
      group.push(b);
      groupEnd = Math.max(groupEnd, b.endMin);
    }
    if (group.length) flush();
    return blocks;
  }

  // ---------- Warnung beim Eintragen: Sperrzeit / Überschneidung ----------
  // Prüft einen (noch nicht gespeicherten) Termin gegen alles andere im Plan.
  // Feste Termine: die nächsten 4 Wochen. Optionen (unbestätigte Vorschläge)
  // zählen nicht, die plant die App selbst um.
  // Ergebnis: { sperr: [...], overlap: [...] } mit { title, date, start, end }
  function conflicts(entries, cand, now = new Date()) {
    const out = { sperr: [], overlap: [] };
    if (cand.type !== T.FEST && cand.type !== T.EINMALIG) return out;
    if (cand.type === T.EINMALIG && cand.allDay) return out;
    const others = entries.filter((e) => e.id !== cand.id);
    const s = toMin(cand.start), e = toMin(cand.end);
    const dates = [];
    if (cand.type === T.EINMALIG) {
      if (cand.date) dates.push(parseDate(cand.date));
    } else {
      const rec = cand.recurrence || {};
      let d = parseDate(rec.from && rec.from > isoDate(now) ? rec.from : isoDate(now));
      for (let i = 0; i < 28; i++, d = addDays(d, 1)) {
        const iso = isoDate(d);
        if (!recursOn(rec, d, iso)) continue;
        if (cand.uni && !inLecture(iso)) continue;
        if ((cand.exceptions || []).some((x) => x.date === iso && x.status === "abgesagt")) continue;
        dates.push(d);
      }
    }
    const seen = new Set();
    for (const d of dates) {
      for (const b of dayPlan(others, d).timed) {
        if (b.cancelled || b.option || b.kind === "vorgang") continue; // Gewerke arbeiten parallel, kein Konflikt
        if (!(b.startMin < e && s < b.endMin)) continue;
        const key = b.id + "|" + (b.kind === "fest" || b.kind === "sperr" ? b.start : isoDate(d));
        if (seen.has(key)) continue; // gleiche Serie nur einmal nennen
        seen.add(key);
        (b.kind === "sperr" ? out.sperr : out.overlap).push({
          title: b.title, date: isoDate(d), start: b.start, end: b.end, kind: b.kind,
          id: b.id, slotId: b.slotId || null, subgoalId: b.subgoalId || null,
        });
      }
    }
    return out;
  }

  // ---------- Wiederkehrende Aufgaben: nächster Termin ----------
  // Sucht den nächsten Tag NACH "afterIso", an dem die Wiederholung greift.
  function nextOccurrence(rec, afterIso) {
    let d = addDays(parseDate(afterIso), 1);
    for (let i = 0; i < 400; i++, d = addDays(d, 1)) {
      if (recursOn(rec, d, afterIso)) return isoDate(d);
    }
    return null;
  }

  // Deadline als kurzer Text: "Überfällig", "Heute", "Morgen", "Do", "24.12."
  function deadlineLabel(iso, today = new Date()) {
    if (!iso) return "";
    const t = isoDate(today);
    const diff = Math.round((parseDate(iso) - parseDate(t)) / 86400000);
    const d = parseDate(iso);
    const short = d.toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });
    if (diff < 0) return "Überfällig · " + short;
    if (diff === 0) return "Heute";
    if (diff === 1) return "Morgen";
    if (diff < 7) return d.toLocaleDateString("de-DE", { weekday: "long" });
    return d.toLocaleDateString("de-DE", { weekday: "short" }) + " " + short;
  }

  return { inLecture, get semester() { return semester; }, get bauZeit() { return bauZeit; }, isoDate, parseDate, toMin, fromMin, startOfWeek, addDays, recursOn, dayPlan, counts, layoutColumns, nextOccurrence, deadlineLabel, conflicts };
})();
