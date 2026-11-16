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

    for (const e of entries) {
      switch (e.type) {
        case T.FEST: {
          if (!recursOn(e.recurrence, date, (e.createdAt || iso).slice(0, 10))) break;
          const ex = (e.exceptions || []).find((x) => x.date === iso);
          if (ex && ex.status === "abgesagt") break; // fällt heute aus → Zeit ist frei
          timed.push(block(e, "fest", e.start, e.end, { sub: e.location, buffer: e.bufferMin }));
          break;
        }
        case T.EINMALIG: {
          if (e.allDay) {
            const last = e.endDate || e.date;
            if (e.date && e.date <= iso && iso <= last) allDay.push({ id: e.id, kind: "einmalig", title: e.title });
          } else if (e.date === iso) {
            timed.push(block(e, "einmalig", e.start, e.end, { sub: e.location, buffer: e.bufferMin }));
          }
          break;
        }
        case T.SPERRZEIT:
          if ((e.weekdays || []).includes(date.getDay())) {
            timed.push(block(e, "sperr", e.start, e.end));
          }
          break;
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

  function block(e, kind, start, end, extra = {}) {
    const startMin = toMin(start);
    let endMin = toMin(end);
    if (endMin <= startMin) endMin = startMin + 30; // Sicherheit bei falscher Eingabe
    return {
      id: e.id, kind, title: e.title, sub: "", priority: e.priority,
      start, end, startMin, endMin, buffer: 0, color: null, option: false, done: false,
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

    return {
      today: plan.timed.filter((b) => b.kind !== "sperr").length + plan.allDay.length,
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

  return { isoDate, parseDate, toMin, fromMin, startOfWeek, addDays, recursOn, dayPlan, counts, layoutColumns };
})();
