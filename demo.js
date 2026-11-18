// ============================================================
// Beispiel ansehen (Aufräumen A): legt erfundene Beispieldaten an,
// damit man beim ersten Start sieht, was die App kann – auch für
// die Präsentation. Alle Beispiel-Einträge tragen demo: true und
// lassen sich mit einem Tipp wieder entfernen. Nur erfundene Daten!
// ============================================================

const Demo = (() => {
  const S = Schedule;
  const M = Model;

  // Datum relativ zu heute als "JJJJ-MM-TT"
  const inDays = (n) => S.isoDate(S.addDays(new Date(), n));
  // nächster Wochentag (0 = So … 6 = Sa), frühestens morgen
  const next = (wd) => { for (let i = 1; i <= 7; i++) if (S.addDays(new Date(), i).getDay() === wd) return inDays(i); return inDays(7); };
  const weekly = (weekdays) => ({ ...M.neuerFesterTermin().recurrence, weekdays });

  async function load() {
    const d = { demo: true };
    const sunday = next(0);
    const entries = [
      M.neuerFesterTermin({ ...d, title: "Vorlesung Baukonstruktion", start: "08:00", end: "09:30", location: "Raum A 101", recurrence: weekly([1, 3]) }),
      M.neuerFesterTermin({ ...d, title: "Entwurfsseminar", start: "10:00", end: "12:00", recurrence: weekly([2, 4]) }),
      M.neuerFesterTermin({ ...d, title: "Nebenjob Café", start: "14:00", end: "18:00", bufferMin: 15, recurrence: weekly([5]) }),
      M.neueSperrzeit({ ...d, title: "Schlafen", start: "23:00", end: "07:00" }),
      M.neuerEinmaligerTermin({ ...d, title: "Zahnarzt", date: inDays(2), start: "09:00", end: "09:45", priority: 5 }),
      M.neuerEinmaligerTermin({ ...d, title: "Spieleabend", date: inDays(3), start: "19:00", end: "22:00", priority: 1 }),
      M.neueTagesnotiz({ ...d, title: "Semesterfest", date: inDays(5) }),
      M.neueAufgabe({ ...d, title: "Bücher zurückgeben", deadline: inDays(1), durationMin: 30 }),
      M.neueAufgabe({ ...d, title: "Reisepass beantragen", deadline: inDays(12), durationMin: 60, priority: 4, color: "#d4537e" }),
      M.neueAufgabe({
        ...d, title: "Wäsche", deadline: sunday, durationMin: 90, color: "#378add",
        recurrence: { ...M.neueAufgabe().recurrence, freq: "woechentlich", weekdays: [0], dayOfMonth: S.parseDate(sunday).getDate(), from: sunday },
      }),
      M.neueAufgabe({ ...d, title: "Fahrrad reparieren", durationMin: 60, color: "#1d9e75" }),
    ];
    // Ein Uni-Ziel und ein Bauprojekt aus den Vorlagen
    const uni = Templates.BUILTIN.find((t) => t.area !== "bau");
    const bau = Templates.BUILTIN.find((t) => t.area === "bau");
    if (uni) entries.push({ ...Templates.build(uni, { title: "Beispiel: Uni-Abgabe", deadline: inDays(30) }), ...d });
    if (bau) {
      const start = S.isoDate(S.addDays(S.startOfWeek(new Date()), 7));
      entries.push({ ...Templates.build(bau, { title: "Beispiel: Einfamilienhaus", deadline: inDays(220), startDate: start }), ...d, area: "bau" });
    }
    await Store.saveMany(entries.map((e) => ({ ...e, area: e.area || "privat" })));
    if (typeof Planner !== "undefined") await Planner.sync({ full: true, silent: true });
  }

  async function active() {
    return (await Store.list(null, { all: true })).some((e) => e.demo);
  }

  async function remove() {
    for (const e of await Store.list(null, { all: true })) if (e.demo) await Store.remove(e.id);
  }

  return { load, active, remove };
})();
