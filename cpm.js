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
  // Auslastung = nötige Stunden ÷ freie Stunden bis zum spätesten Ende
  const ENG_AB = 0.5;       // ab 50 % → "eng"
  const KRITISCH_AB = 0.8;  // ab 80 % (oder es reicht nicht) → "kritisch"
  const levelOf = (u) => (u >= KRITISCH_AB ? "kritisch" : u >= ENG_AB ? "eng" : null);

  // ---------- Einstellungen ----------
  let cfg = makeCfg({});
  function makeCfg(st) {
    return {
      maxHoursPerDay: Number(st.maxStundenProTag) || 6,
      workFrom: st.arbeitVon || "08:00",
      workTo: st.arbeitBis || "22:00",
      bau: !!st.bauModus,
      wochenendeFrei: !!st.wochenendeFrei, // Sa/So keine Vorschläge, zählt nicht als freie Zeit
    };
  }
  Store.getSettings().then((st) => { cfg = makeCfg(st); });
  Store.subscribe((change) => {
    if (change.settings) cfg = makeCfg(change.settings);
    else if (change.action === "importiert" || change.action === "geleert" || change.action === "abgleich") Store.getSettings().then((st) => { cfg = makeCfg(st); });
  });

  // ---------- 1. Freie Zeit ----------
  function freeHoursOn(entries, date, now = new Date()) {
    const plan = S.dayPlan(entries, date);
    // Ganztägiger Termin (z. B. Urlaub) → kein Arbeiten an Zielen
    if (plan.allDay.some((a) => a.kind !== "feiertag")) return 0;
    // Wochenende frei (Einstellung)
    if (cfg.wochenendeFrei && (date.getDay() === 0 || date.getDay() === 6)) return 0;
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

  // ============================================================
  // Baustelle: Gewerke arbeiten Mo–Fr (Feiertage frei), unabhängig
  // von meiner freien Zeit. Dauer = Arbeitstage. Wartezeiten
  // (z. B. Estrich trocknen) zählen Kalendertage, also auch am
  // Wochenende. Alle Werte: Tage ab heute (0 = heute), Ende exklusiv.
  // ============================================================
  // DIN 69900: Pufferzeiten in Zeiteinheiten des Projektkalenders = Arbeitstage.
  // Kritischer Weg = Vorgänge mit der KLEINSTEN Gesamtpufferzeit (auch wenn bis
  // zur Fertigstellung noch Reserve ist). "eng" = höchstens 3 Arbeitstage mehr
  // Puffer als der kritische Weg.
  const BAU_ENG_TAGE = 3; // Arbeitstage
  const bauCache = new Map();

  function computeBau(goal, now = new Date()) {
    const todayIso = S.isoDate(now);
    const key = goal.id + "|" + goal.updatedAt + "|" + todayIso + "|" + (typeof Holidays !== "undefined" ? Holidays.state + Holidays.version : "") + "|" + S.bauZeit.pauseVon + S.bauZeit.pauseBis;
    if (bauCache.has(key)) return bauCache.get(key);
    const res = computeBauRaw(goal, now);
    if (bauCache.size > 50) bauCache.clear();
    bauCache.set(key, res);
    return res;
  }

  function computeBauRaw(goal, now) {
    const subs = goal.subgoals || [];
    const byId = Object.fromEntries(subs.map((s) => [s.id, s]));
    const dayDate = (i) => S.addDays(now, i);
    const isWork = (i) => {
      const d = dayDate(i);
      const wd = d.getDay();
      if (wd === 0 || (wd === 6 && !goal.samstag)) return false; // Samstag optional Arbeitstag (pro Projekt)
      if (S.inBauPause(S.isoDate(d))) return false; // Winterpause
      return !(typeof Holidays !== "undefined" && Holidays.on(S.isoDate(d)));
    };
    const nextWork = (i) => { let x = Math.ceil(i - 1e-9); while (!isWork(x)) x++; return x; };
    const prevWork = (i) => { let x = Math.floor(i + 1e-9); while (!isWork(x)) x--; return x; };
    // Ende (exklusiv) nach D Arbeitstagen ab Start s
    const addW = (s, D) => { let x = nextWork(s), n = D; if (n <= 0) return x; while (true) { if (isWork(x)) n--; x++; if (n <= 0) return x; } };
    // Spätester Start, damit D Arbeitstage bis vor "endExcl" passen
    const subW = (endExcl, D) => { let x = Math.floor(endExcl + 1e-9) - 1, n = D; if (n <= 0) return prevWork(endExcl); while (true) { if (isWork(x)) { n--; if (n <= 0) return x; } x--; } };
    const days = (iso) => Math.round((S.parseDate(iso) - S.parseDate(S.isoDate(now))) / 86400000);
    // Arbeitstage zwischen zwei Tages-Indizes [a, b) – negativ, wenn b vor a liegt
    const wdBetween = (a, b) => {
      a = Math.round(a); b = Math.round(b);
      if (b < a) return -wdBetween(b, a);
      let n = 0;
      for (let x = a; x < b; x++) if (isWork(x)) n++;
      return n;
    };
    const start0 = goal.startDate ? Math.max(0, days(goal.startDate)) : 0;

    const nodes = {};
    for (const sg of subs) {
      const total = Math.max(0, Math.ceil(sg.mode === "dauer" ? sg.durationDays : (sg.estimateHours || 0) / 8));
      const D = sg.done ? 0 : Math.ceil(total * (1 - (sg.progressPercent || 0) / 100) - 1e-9);
      nodes[sg.id] = { id: sg.id, D, done: sg.done, preds: (sg.dependencies || []).filter((d) => byId[d.fromId]), succs: [] };
    }
    for (const n of Object.values(nodes)) for (const d of n.preds) nodes[d.fromId].succs.push({ toId: n.id, type: d.type || DEP.EA, lag: Number(d.lagDays) || 0 });

    const order = [];
    const indeg = Object.fromEntries(Object.values(nodes).map((n) => [n.id, n.preds.length]));
    const queue = Object.keys(indeg).filter((id) => indeg[id] === 0);
    while (queue.length) {
      const id = queue.shift();
      order.push(id);
      for (const s of nodes[id].succs) if (--indeg[s.toId] === 0) queue.push(s.toId);
    }
    if (order.length !== subs.length) return { cycle: true, cap: 1, bau: true };

    // Vorwärts: frühester Anfang/Ende
    for (const id of order) {
      const n = nodes[id];
      let es = start0;
      const cands = [];
      for (const d of n.preds) {
        const p = nodes[d.fromId], lag = Number(d.lagDays) || 0, t = d.type || DEP.EA;
        let c = -Infinity;
        if (t === DEP.EA) c = p.EF + lag;
        if (t === DEP.AA) c = p.ES + lag;
        if (t === DEP.EE) c = subW(p.EF + lag, n.D);
        if (t === DEP.AE) c = subW(p.ES + lag, n.D);
        cands.push([d.fromId, c]);
        es = Math.max(es, c);
      }
      n.ES = n.D > 0 ? nextWork(es) : es;
      n.EF = n.D > 0 ? addW(n.ES, n.D) : n.ES;
      // "Treibende" Vorgänger: die den frühesten Anfang wirklich festlegen
      const at = (c) => (n.D > 0 ? nextWork(c) : c);
      n.drivers = cands.filter(([, c]) => c > -Infinity && at(c) === n.ES && c >= start0 - 1e-9).map(([id]) => id);
    }
    const projectEnd = Math.max(start0, ...Object.values(nodes).map((n) => n.EF));
    const deadlineEx = goal.deadline ? days(goal.deadline) + 1 : projectEnd;

    // Rückwärts: spätester Anfang/Ende (ab Deadline bzw. Zwischen-Deadline)
    for (const id of [...order].reverse()) {
      const n = nodes[id];
      const sg = byId[id];
      let lf = deadlineEx;
      if (sg.deadline) lf = Math.min(lf, days(sg.deadline) + 1);
      let lsCap = Infinity;
      for (const s of n.succs) {
        const x = nodes[s.toId];
        if (s.type === DEP.EA) lf = Math.min(lf, x.LS - s.lag);
        if (s.type === DEP.EE) lf = Math.min(lf, x.LF - s.lag);
        if (s.type === DEP.AA) lsCap = Math.min(lsCap, x.LS - s.lag);
        if (s.type === DEP.AE) lsCap = Math.min(lsCap, x.LF - s.lag);
      }
      let ls = n.D > 0 ? subW(lf, n.D) : lf;
      if (lsCap < ls) { ls = n.D > 0 ? prevWork(lsCap) : lsCap; lf = Math.min(lf, n.D > 0 ? addW(ls, n.D) : ls); }
      n.LS = ls;
      n.LF = lf;
    }

    // Puffer, Kennzeichnung, Daten
    const open = Object.values(nodes).filter((n) => !n.done);
    for (const n of Object.values(nodes)) {
      // Gesamtpuffer GP = SAZ − FAZ, freier Puffer FP nach DIN 69900 – beides in Arbeitstagen
      n.TF = wdBetween(n.ES, n.LS);
      let ff = n.succs.length ? Infinity : wdBetween(n.EF, deadlineEx);
      for (const s of n.succs) {
        const x = nodes[s.toId];
        const v = { [DEP.EA]: wdBetween(n.EF, x.ES - s.lag), [DEP.AA]: wdBetween(n.ES, x.ES - s.lag), [DEP.EE]: wdBetween(n.EF, x.EF - s.lag), [DEP.AE]: wdBetween(n.ES, x.EF - s.lag) }[s.type];
        ff = Math.min(ff, v);
      }
      n.FF = Math.min(ff, n.TF);
    }
    // DIN 69900, weitere Pufferzeiten (Arbeitstage):
    //  FRP freie Rückwärtspufferzeit: Spielraum nach vorn, wenn alle Vorgänger so
    //      spät wie möglich liegen
    //  UP  unabhängige Pufferzeit: Spielraum, wenn die Vorgänger so spät und die
    //      Nachfolger so früh wie möglich liegen (nie negativ)
    for (const n of Object.values(nodes)) {
      let es2 = start0;
      for (const d of n.preds) {
        const p = nodes[d.fromId], lag = Number(d.lagDays) || 0, t = d.type || DEP.EA;
        if (t === DEP.EA) es2 = Math.max(es2, p.LF + lag);
        if (t === DEP.AA) es2 = Math.max(es2, p.LS + lag);
        if (t === DEP.EE) es2 = Math.max(es2, subW(p.LF + lag, n.D));
        if (t === DEP.AE) es2 = Math.max(es2, subW(p.LS + lag, n.D));
      }
      es2 = n.D > 0 ? nextWork(es2) : es2;
      let lf2 = n.succs.length ? Infinity : deadlineEx, ls2 = Infinity;
      for (const s of n.succs) {
        const x = nodes[s.toId];
        if (s.type === DEP.EA) lf2 = Math.min(lf2, x.ES - s.lag);
        if (s.type === DEP.EE) lf2 = Math.min(lf2, x.EF - s.lag);
        if (s.type === DEP.AA) ls2 = Math.min(ls2, x.ES - s.lag);
        if (s.type === DEP.AE) ls2 = Math.min(ls2, x.EF - s.lag);
      }
      let lsFromSuccs = lf2 === Infinity ? Infinity : n.D > 0 ? subW(lf2, n.D) : lf2;
      if (ls2 < lsFromSuccs) lsFromSuccs = n.D > 0 ? prevWork(ls2) : ls2;
      n.FRP = Math.max(0, wdBetween(es2, n.LS));
      n.UP = lsFromSuccs === Infinity ? n.FRP : Math.max(0, wdBetween(es2, lsFromSuccs));
    }
    const minTF = open.length ? Math.min(...open.map((n) => n.TF)) : 0;
    // Kritischer Weg (DIN 69900: Weg mit der kleinsten Gesamtpufferzeit = längster Weg).
    // Weil Dauern in Arbeitstagen und Zeitabstände in Kalendertagen laufen, wird er
    // über die treibenden Abhängigkeiten bestimmt: vom Projektende rückwärts.
    const crit = new Set();
    const lastEF = open.length ? Math.max(...open.map((n) => n.EF)) : -Infinity;
    const stack = open.filter((n) => n.EF === lastEF).map((n) => n.id);
    while (stack.length) {
      const id = stack.pop();
      if (crit.has(id) || nodes[id].done) continue;
      crit.add(id);
      for (const p of nodes[id].drivers || []) stack.push(p);
    }
    const critMaxTF = crit.size ? Math.max(...[...crit].map((id) => nodes[id].TF)) : minTF;
    for (const n of Object.values(nodes)) {
      const active = !n.done;
      n.behind = active && n.TF < 0;
      n.mainPath = active && crit.has(n.id);
      n.level = !active ? null : n.mainPath || n.TF <= 0 ? "kritisch" : n.TF - critMaxTF <= BAU_ENG_TAGE ? "eng" : null;
      n.critical = n.level === "kritisch";
      n.utilization = 0; n.neededHours = 0; n.availableHours = 0;
      n.startDate = S.isoDate(dayDate(n.ES));
      n.endDate = S.isoDate(dayDate(Math.max(n.EF - 1, n.ES)));
      n.latestStart = S.isoDate(dayDate(n.LS));
      n.latestEnd = S.isoDate(dayDate(Math.max(n.LF - 1, n.LS)));
      if (n.D === 0 && n.preds.length) {
        // Meilenstein = Zeitpunkt, an dem der Vorgänger fertig ist (Ende des letzten Arbeitstags davor)
        const at = (i) => S.isoDate(dayDate(i > start0 ? prevWork(i - 1) : i));
        n.startDate = n.endDate = at(n.ES);
        n.latestStart = n.latestEnd = at(n.LS);
      }
      n.workdays = n.D;
    }
    // Gewerke doppelt eingeplant? (gleiches Gewerk, überlappende Arbeitstage)
    const clashes = [];
    const busy = open.filter((n) => n.D > 0 && byId[n.id].assignee && byId[n.id].assignee !== Model.OWNER_LOCAL);
    for (let i = 0; i < busy.length; i++) for (let j = i + 1; j < busy.length; j++) {
      const a = busy[i], b = busy[j];
      if (byId[a.id].assignee.trim().toLowerCase() !== byId[b.id].assignee.trim().toLowerCase()) continue;
      const from = Math.max(a.ES, b.ES), to = Math.min(a.EF, b.EF); // Ende exklusiv
      if (from < to && wdBetween(from, to) > 0) clashes.push({ gewerk: byId[a.id].assignee, a: a.id, b: b.id, from: S.isoDate(dayDate(from)), to: S.isoDate(dayDate(to - 1)), days: wdBetween(from, to) });
    }

    let status = "ok";
    if (!open.length) status = "fertig";
    else if (minTF < 0) status = "hinterher";
    else if (minTF === 0 && goal.deadline) status = "kritisch";
    else if (minTF <= BAU_ENG_TAGE) status = "knapp";
    return {
      cycle: false, bau: true, cap: 1, nodes, projectEnd, clashes, deadlineDays: deadlineEx, minTF, slack: minTF, status,
      utilization: 0, neededHours: 0, availableHours: 0, resourceLimited: false, isWork,
      projectEndDate: S.isoDate(dayDate(Math.max(projectEnd - 1, 0))),
    };
  }

  // ---------- 2. + 3. Kritischer Pfad für ein Ziel ----------
  function computeGoal(goal, entries, now = new Date(), capacity = null) {
    if (goal.area === "bau") return computeBau(goal, now);
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

    // Freie Stunden pro Tag ab heute (einmal ausrechnen)
    const horizon = Math.max(deadlineDays, ...Object.values(nodes).map((n) => Math.ceil(n.LF)), 0);
    const freeByDay = [];
    for (let i = 0; i < horizon; i++) freeByDay.push(freeHoursOn(entries, S.addDays(now, i), now));
    const freeUntil = (days) => freeByDay.slice(0, Math.max(Math.ceil(days - 1e-9), 0)).reduce((a, b) => a + b, 0);

    // Alle (auch indirekten) Vorgänger eines Unterziels
    const ancestors = (id, seen = new Set()) => {
      for (const d of nodes[id].preds) if (!seen.has(d.fromId)) { seen.add(d.fromId); ancestors(d.fromId, seen); }
      return seen;
    };
    const restHours = (id) => {
      const sg = byId[id];
      return sg.done || sg.mode === "dauer" ? 0 : Model.restzeitStunden(sg);
    };

    // Hauptpfad = längste Kette (bestimmt, wann das Ziel frühestens fertig ist).
    // Dafür eine zweite Rückwärtsrechnung ab dem frühesten Ende – ohne Deadlines.
    const cpEnd = Math.max(0, ...Object.values(nodes).map((n) => n.EF));
    const lf0 = {}, ls0 = {};
    for (const id of [...order].reverse()) {
      const n = nodes[id];
      let lf = cpEnd;
      for (const s2 of n.succs) {
        const v = {
          [DEP.EA]: ls0[s2.toId] - s2.lag, [DEP.AA]: ls0[s2.toId] - s2.lag + n.D,
          [DEP.EE]: lf0[s2.toId] - s2.lag, [DEP.AE]: lf0[s2.toId] - s2.lag + n.D,
        }[s2.type || DEP.EA];
        lf = Math.min(lf, v);
      }
      lf0[id] = lf;
      ls0[id] = lf - n.D;
    }

    for (const n of Object.values(nodes)) {
      n.mainPath = !n.done && n.D > 0 && ls0[n.id] - n.ES <= EPS;
      n.behind = !n.done && n.TF < -EPS;
      // Auslastung: dieses Unterziel + alles, was davor fertig sein muss,
      // geteilt durch die freie Zeit bis zu seinem spätesten Ende
      if (!n.done) {
        const needed = restHours(n.id) + [...ancestors(n.id)].reduce((sum, id) => sum + restHours(id), 0);
        const avail = freeUntil(n.LF);
        n.neededHours = needed;
        n.availableHours = avail;
        n.utilization = needed <= 0 ? 0 : avail <= 0 ? Infinity : needed / avail;
        n.level = n.behind ? "kritisch" : levelOf(n.utilization);
      } else {
        n.utilization = 0;
        n.level = null;
      }
      n.critical = n.level === "kritisch";
      n.startDate = S.isoDate(S.addDays(now, Math.floor(n.ES + 1e-9)));
      n.endDate = S.isoDate(S.addDays(now, Math.max(Math.ceil(n.EF - 1e-9) - 1, 0)));
      n.latestStart = S.isoDate(S.addDays(now, Math.floor(n.LS + 1e-9)));
      n.latestEnd = S.isoDate(S.addDays(now, Math.max(Math.ceil(n.LF - 1e-9) - 1, 0)));
    }

    // Du arbeitest allein: Unterziele, die laut CPM parallel laufen könnten,
    // erledigst du in Wirklichkeit nacheinander. Deshalb zusätzlich prüfen,
    // ob die freie Zeit bis zur Deadline für ALLE Reststunden reicht.
    const neededHours = subs.filter((x) => !x.done && x.mode !== "dauer").reduce((sum, x) => sum + Model.restzeitStunden(x), 0);
    const availableHours = freeUntil(Math.max(deadlineDays, 0));
    const resourceSlack = (availableHours - neededHours) / cap; // in Tagen
    const slack = Math.min(minTF, resourceSlack);
    const end = Math.max(projectEnd, neededHours / cap);

    // Gesamt-Auslastung des Ziels und Status
    const utilization = neededHours <= 0 ? 0 : availableHours <= 0 ? Infinity : neededHours / availableHours;
    const anyCritical = open.some((n) => n.level === "kritisch");
    const anyEng = open.some((n) => n.level === "eng");
    let status = "ok";
    if (!open.length) status = "fertig";
    else if (slack < -EPS || (goal.deadline && deadlineDays <= 0)) status = "hinterher"; // reicht nicht
    else if (utilization >= KRITISCH_AB || anyCritical) status = "kritisch";
    else if (utilization >= ENG_AB || anyEng) status = "knapp";

    return {
      cycle: false, cap, nodes, projectEnd: end, deadlineDays, minTF, slack, status, utilization,
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
    freeHoursOn, averageCapacity, computeGoal, computeBau, wouldCycle, lowPriorityUntil, behindCount,
    get cfg() { return cfg; },
  };
})();
