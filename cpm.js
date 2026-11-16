// ============================================================
// Kritischer Pfad (CPM = Critical Path Method)
//
// 1. Freie Zeit: Wie viele Stunden kann ich pro Tag an Zielen
//    arbeiten? = Arbeitsfenster (z. B. 8–22 Uhr) minus Termine,
//    Puffer und Sperrzeiten, höchstens "max. Std. pro Tag".
// 2. Dauer jedes Unterziels in Tagen:
//    - Aufwand: Reststunden ÷ durchschnittliche freie Zeit pro Tag
//    - Dauer:   restliche Kalendertage
// 3. Vorwärtsrechnung: frühester Anfang/Ende (FAZ/FEZ)
//    Rückwärtsrechnung ab der Deadline: spätester Anfang/Ende (SAZ/SEZ)
//    Puffer = SAZ − FAZ. Kleinster Puffer = kritischer Pfad.
//    Negativer Puffer = die Deadline ist so nicht zu schaffen.
// Alle Werte sind Tage ab heute (0 = heute).
// ============================================================

const CPM = (() => {
  const S = Schedule;
  const T = Model.TYPES;
  const DEP = Model.DEP_TYPES;
  const EPS = 0.05;

  // ---------- Einstellungen ----------
  let cfg = makeCfg({});
  function makeCfg(st) {
    return {
      maxHoursPerDay: Number(st.maxStundenProTag) || 6,
      workFrom: st.arbeitVon || "08:00",
      workTo: st.arbeitBis || "22:00",
      bau: !!st.bauModus,
    };
  }
  Store.getSettings().then((st) => { cfg = makeCfg(st); });
  Store.subscribe((change) => {
    if (change.settings) cfg = makeCfg(change.settings);
    else if (change.action === "importiert" || change.action === "geleert") Store.getSettings().then((st) => { cfg = makeCfg(st); });
  });

  // ---------- 1. Freie Zeit ----------
  function freeHoursOn(entries, date, now = new Date()) {
    const plan = S.dayPlan(entries, date);
    // Ganztägiger Termin (z. B. Urlaub) → kein Arbeiten an Zielen
    if (plan.allDay.some((a) => a.kind !== "feiertag")) return 0;
    let from = S.toMin(cfg.workFrom);
    const to = S.toMin(cfg.workTo);
    if (S.isoDate(date) === S.isoDate(now)) from = Math.max(from, now.getHours() * 60 + now.getMinutes());
    if (to <= from) return 0;

    // Belegte Zeiten (Termine inkl. Puffer, Sperrzeiten) zusammenfassen
    const busy = plan.timed
      .filter((b) => !b.cancelled && !b.option && (b.kind === "fest" || b.kind === "einmalig" || b.kind === "sperr"))
      .map((b) => [Math.max(from, b.startMin - (b.buffer || 0)), Math.min(to, b.endMin + (b.buffer || 0))])
      .filter(([a, b]) => b > a)
      .sort((x, y) => x[0] - y[0]);
    let busyMin = 0, curA = null, curB = null;
    for (const [a, b] of busy) {
      if (curB === null || a > curB) { if (curB !== null) busyMin += curB - curA; curA = a; curB = b; }
      else curB = Math.max(curB, b);
    }
    if (curB !== null) busyMin += curB - curA;
    return Math.min((to - from - busyMin) / 60, cfg.maxHoursPerDay);
  }

  // Durchschnittliche freie Zeit pro Tag in den nächsten 4 Wochen
  function averageCapacity(entries, now = new Date()) {
    let sum = 0;
    for (let i = 0; i < 28; i++) sum += freeHoursOn(entries, S.addDays(now, i), now);
    return Math.max(sum / 28, 0.25);
  }

  const daysUntil = (iso, now) => Math.round((S.parseDate(iso) - S.parseDate(S.isoDate(now))) / 86400000) + 1; // Deadline-Tag zählt mit

  // ---------- 2. + 3. Kritischer Pfad für ein Ziel ----------
  function computeGoal(goal, entries, now = new Date(), capacity = null) {
    const cap = capacity || averageCapacity(entries, now);
    const subs = goal.subgoals || [];
    const byId = Object.fromEntries(subs.map((s) => [s.id, s]));
    const nodes = {};

    for (const sg of subs) {
      let D = 0;
      if (!sg.done) {
        D = sg.mode === "dauer"
          ? sg.durationDays * (1 - sg.progressPercent / 100)
          : Model.restzeitStunden(sg) / cap;
      }
      nodes[sg.id] = {
        id: sg.id, D, done: sg.done,
        preds: (sg.dependencies || []).filter((d) => byId[d.fromId]),
        succs: [],
      };
    }
    for (const n of Object.values(nodes)) {
      for (const d of n.preds) nodes[d.fromId].succs.push({ toId: n.id, type: d.type, lag: Number(d.lagDays) || 0 });
    }

    // Reihenfolge so, dass Vorgänger immer zuerst kommen (sonst: Kreis!)
    const order = [];
    const indeg = Object.fromEntries(Object.values(nodes).map((n) => [n.id, n.preds.length]));
    const queue = Object.keys(indeg).filter((id) => indeg[id] === 0);
    while (queue.length) {
      const id = queue.shift();
      order.push(id);
      for (const s of nodes[id].succs) if (--indeg[s.toId] === 0) queue.push(s.toId);
    }
    if (order.length !== subs.length) return { cycle: true, cap };

    // Vorwärts: frühester Anfang (ES) / frühestes Ende (EF)
    for (const id of order) {
      const n = nodes[id];
      n.ES = 0;
      for (const d of n.preds) {
        const p = nodes[d.fromId], lag = Number(d.lagDays) || 0;
        const v = {
          [DEP.EA]: p.EF + lag, [DEP.AA]: p.ES + lag,
          [DEP.EE]: p.EF + lag - n.D, [DEP.AE]: p.ES + lag - n.D,
        }[d.type || DEP.EA];
        n.ES = Math.max(n.ES, v);
      }
      n.EF = n.ES + n.D;
    }
    const projectEnd = Math.max(0, ...Object.values(nodes).map((n) => n.EF));
    const deadlineDays = goal.deadline ? daysUntil(goal.deadline, now) : projectEnd;

    // Rückwärts: spätester Anfang (LS) / spätestes Ende (LF), ab der Deadline
    for (const id of [...order].reverse()) {
      const n = nodes[id];
      const sg = byId[id];
      n.LF = deadlineDays;
      if (sg.deadline) n.LF = Math.min(n.LF, daysUntil(sg.deadline, now)); // Zwischen-Deadline
      for (const s of n.succs) {
        const x = nodes[s.toId];
        const v = {
          [DEP.EA]: x.LS - s.lag, [DEP.AA]: x.LS - s.lag + n.D,
          [DEP.EE]: x.LF - s.lag, [DEP.AE]: x.LF - s.lag + n.D,
        }[s.type || DEP.EA];
        n.LF = Math.min(n.LF, v);
      }
      n.LS = n.LF - n.D;
    }

    // Puffer: Gesamtpuffer (TF) und freier Puffer (FF)
    const open = Object.values(nodes).filter((n) => !n.done);
    for (const n of Object.values(nodes)) {
      n.TF = n.LS - n.ES;
      let ff = n.succs.length ? Infinity : deadlineDays - n.EF;
      for (const s of n.succs) {
        const x = nodes[s.toId];
        const v = {
          [DEP.EA]: x.ES - s.lag - n.EF, [DEP.AA]: x.ES - s.lag - n.ES,
          [DEP.EE]: x.EF - s.lag - n.EF, [DEP.AE]: x.EF - s.lag - n.ES,
        }[s.type || DEP.EA];
        ff = Math.min(ff, v);
      }
      n.FF = Math.min(ff, n.TF);
    }
    const minTF = open.length ? Math.min(...open.map((n) => n.TF)) : 0;
    for (const n of Object.values(nodes)) {
      n.critical = !n.done && n.TF <= minTF + EPS;
      n.behind = !n.done && n.TF < -EPS;
      n.startDate = S.isoDate(S.addDays(now, Math.floor(n.ES + 1e-9)));
      n.endDate = S.isoDate(S.addDays(now, Math.max(Math.ceil(n.EF - 1e-9) - 1, 0)));
      n.latestStart = S.isoDate(S.addDays(now, Math.floor(n.LS + 1e-9)));
      n.latestEnd = S.isoDate(S.addDays(now, Math.max(Math.ceil(n.LF - 1e-9) - 1, 0)));
    }

    // Du arbeitest allein: Unterziele, die laut CPM parallel laufen könnten,
    // erledigst du in Wirklichkeit nacheinander. Deshalb zusätzlich prüfen,
    // ob die freie Zeit bis zur Deadline für ALLE Reststunden reicht.
    const neededHours = subs.filter((x) => !x.done && x.mode !== "dauer").reduce((sum, x) => sum + Model.restzeitStunden(x), 0);
    let availableHours = 0;
    for (let i = 0; i < Math.max(deadlineDays, 0); i++) availableHours += freeHoursOn(entries, S.addDays(now, i), now);
    const resourceSlack = (availableHours - neededHours) / cap; // in Tagen
    const slack = Math.min(minTF, resourceSlack);
    const end = Math.max(projectEnd, neededHours / cap);

    let status = "ok";
    if (!open.length) status = "fertig";
    else if (slack < -EPS || (goal.deadline && deadlineDays <= 0)) status = "hinterher";
    else if (slack < 2) status = "knapp";

    return {
      cycle: false, cap, nodes, projectEnd: end, deadlineDays, minTF, slack, status,
      neededHours, availableHours, resourceLimited: resourceSlack < minTF - EPS,
      projectEndDate: S.isoDate(S.addDays(now, Math.max(Math.ceil(end - 1e-9) - 1, 0))),
    };
  }

  // Würde die Abhängigkeit "fromId → toId" einen Kreis bilden?
  // (= hängt fromId schon direkt oder indirekt von toId ab?)
  function wouldCycle(goal, fromId, toId) {
    const subs = Object.fromEntries((goal.subgoals || []).map((s) => [s.id, s]));
    const seen = new Set();
    const stack = [fromId];
    while (stack.length) {
      const id = stack.pop();
      if (id === toId) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const d of (subs[id] && subs[id].dependencies) || []) stack.push(d.fromId);
    }
    return false;
  }

  // Termine mit niedriger Priorität bis zur Deadline (könnten ausfallen)
  function lowPriorityUntil(entries, deadlineIso, now = new Date()) {
    const today = S.isoDate(now);
    return entries
      .filter((e) => e.type === T.EINMALIG && e.priority <= 2 && e.date && e.date >= today && (!deadlineIso || e.date <= deadlineIso))
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.start).localeCompare(String(b.start)))
      .map((e) => ({ id: e.id, title: e.title, date: e.date, hours: e.allDay ? 0 : (S.toMin(e.end) - S.toMin(e.start)) / 60 }));
  }

  // Alle Ziele berechnen (für die Kachel "Hängt hinterher")
  function behindCount(entries, now = new Date()) {
    const goals = entries.filter((e) => e.type === T.ZIEL && !e.done);
    if (!goals.length) return 0;
    const cap = averageCapacity(entries, now);
    return goals.filter((g) => {
      const r = computeGoal(g, entries, now, cap);
      return !r.cycle && r.status === "hinterher";
    }).length;
  }

  return {
    freeHoursOn, averageCapacity, computeGoal, wouldCycle, lowPriorityUntil, behindCount,
    get cfg() { return cfg; },
  };
})();
