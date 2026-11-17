// ============================================================
// Planer: legt Aufgaben und Arbeit an Unterzielen als
// "Optionen" (gestrichelte Vorschläge) in deine freie Zeit.
//
// So funktioniert es:
//  1. Freie Zeit = Arbeitsfenster (Einstellungen) minus Termine inkl.
//     Puffer, Sperrzeiten und bestätigte Blöcke. Höchstens
//     "max. Std. pro Tag" Arbeit pro Tag. Ganztägige Termine = frei.
//  2. Die Zeit wird in 30-Minuten-Stücke geteilt. Stücke direkt
//     hintereinander werden zu EINEM Block verbunden.
//  3. Reihenfolge nach CPM: kritisch → eng → Rest, dann wenig
//     Puffer zuerst. Aufgaben ordnen sich über ihre Deadline ein.
//     Wichtiges darf Optionen mit mehr Puffer verdrängen.
//  4. Abhängigkeiten: Ein Unterziel startet erst nach seinem Vorgänger.
//
// Automatisch (bei jeder Änderung): vergangene Optionen verschwinden,
// Optionen, die einem neuen Termin im Weg sind, werden neu eingeplant
// (mit kurzer Meldung). Bestätigte Blöcke bewegt die App nie selbst.
// Knopf "Neu planen": alle Optionen komplett neu verteilen.
// ============================================================

const Planner = (() => {
  const S = Schedule;
  const T = Model.TYPES;
  const DEP = Model.DEP_TYPES;
  const STEP = 30;      // Raster in Minuten
  const HORIZON = 42;   // so viele Tage im Voraus wird geplant
  const MIN_GOAL = 90;  // Ziel-Arbeit: kürzester sinnvoller Block (1,5 Std.) – Wunsch Niklas
  const MIN_TASK = 60;  // Aufgaben: Blöcke möglichst ab 1 Std., kleinere Lücken nur wenn nötig
  const MAX_BLOCK = 180; // höchstens 3 Std. am Stück, danach 30 Min. Pause (Testrunde 1)
  const NODL_DAYS = 7;   // Aufgaben ohne Deadline: nur in den nächsten 7 Tagen …
  const NODL_PER_DAY = 60; // … und höchstens 1 Std. pro Tag (sonst ist alles gestrichelt)
  const up5 = (m) => Math.ceil(m / 5) * 5; // Uhrzeiten auf 5 Minuten runden
  // Mindestlänge eines Blocks für diesen Posten (nie mehr als die ganze Restzeit)
  const minLenOf = (it, rest) => Math.min(it.kind === "sub" ? MIN_GOAL : STEP, Math.max(rest, STEP));

  let autoPlan = true;  // Einstellung "Vorschläge automatisch einplanen"
  let running = false, again = false, timer = null;
  const pendingMoved = new Set(); // Posten, deren bestätigter Block weichen musste

  const nowMin = (d) => d.getHours() * 60 + d.getMinutes();
  const slotLen = (s) => S.toMin(s.end) - S.toMin(s.start);
  const overlaps = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;
  const fmtDay = (iso) => S.parseDate(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
  const fmtH = (min) => (min < 60 ? `${min} Min.` : `${String(Math.round(min / 6) / 10).replace(".", ",")} Std.`);

  // Slot schon vorbei?
  function ended(s, todayIso, nm) {
    return s.date < todayIso || (s.date === todayIso && S.toMin(s.end) <= nm);
  }

  // ---------- Arbeitsposten sammeln und nach Wichtigkeit sortieren ----------
  function collectItems(entries, now) {
    const todayIso = S.isoDate(now);
    const nm = nowMin(now);
    const cap = CPM.averageCapacity(entries, now);
    const covered = (slots) => (slots || []).filter((s) => s.confirmed && !ended(s, todayIso, nm)).reduce((a, s) => a + slotLen(s), 0);
    const out = [];

    for (const e of entries) {
      if (e.type === T.AUFGABE) {
        e.slots = e.slots || [];
        const need = e.done ? 0 : Math.max(0, (e.durationMin || 30) - covered(e.slots));
        let slack = 60 - e.priority; // ohne Deadline: viel Puffer
        if (e.deadline) slack = (S.parseDate(e.deadline) - S.parseDate(todayIso)) / 86400000 + 1 - need / 60 / cap;
        out.push({
          key: e.id, kind: "task", entry: e, holder: e, need, slack,
          level: slack < 1 ? 0 : slack < 3 ? 1 : 2, prio: e.priority,
          due: e.deadline && e.deadline >= todayIso ? e.deadline : null,
          noDL: !e.deadline, // ohne Deadline: nur sparsam vorschlagen
          title: e.title, color: e.color, preds: [],
        });
      }
      if (e.type === T.ZIEL && !e.done) {
        const r = CPM.computeGoal(e, entries, now, cap);
        for (const sg of e.subgoals || []) {
          sg.slots = sg.slots || [];
          if (sg.mode !== "aufwand") continue; // "Dauer" = Kalenderzeit, keine eigene Arbeit
          const n = r.cycle ? null : r.nodes[sg.id];
          const rest = sg.done ? 0 : Math.round((Model.restzeitStunden(sg) || 0) * 60);
          const need = Math.max(0, rest - covered(sg.slots));
          const due = n ? n.latestEnd : (sg.deadline || e.deadline);
          out.push({
            key: e.id + "/" + sg.id, kind: "sub", entry: e, holder: sg, sg, need,
            slack: n ? n.TF : 30,
            level: n && n.level === "kritisch" ? 0 : n && n.level === "eng" ? 1 : 2,
            prio: e.priority, due: due && due >= todayIso ? due : null,
            title: sg.title, goalTitle: e.title, color: e.color, node: n, nodes: r.nodes || {},
            preds: (sg.dependencies || []).map((d) => ({ key: e.id + "/" + d.fromId, fromId: d.fromId, type: d.type || DEP.EA, lag: Number(d.lagDays) || 0 })),
          });
        }
      }
    }
    out.sort((a, b) => a.level - b.level || a.slack - b.slack || b.prio - a.prio
      || String(a.due || "9999").localeCompare(String(b.due || "9999")) || a.title.localeCompare(b.title));
    out.forEach((it, i) => { it.rank = i; });
    return out;
  }

  // ---------- Freie Zeit pro Tag ----------
  function buildDays(entries, now) {
    const cfg = CPM.cfg;
    const todayIso = S.isoDate(now);
    const days = {};
    for (let i = 0; i < HORIZON; i++) {
      const d = S.addDays(now, i);
      const iso = S.isoDate(d);
      const plan = S.dayPlan(entries, d);
      let from = Math.ceil(S.toMin(cfg.workFrom) / STEP) * STEP;
      const to = S.toMin(cfg.workTo);
      if (iso === todayIso) from = Math.max(from, Math.ceil(nowMin(now) / STEP) * STEP);
      const busy = [];
      let load = 0;
      for (const b of plan.timed) {
        if (b.cancelled || b.option) continue;
        if (b.kind === "fest" || b.kind === "einmalig") busy.push([b.startMin - (b.buffer || 0), b.endMin + (b.buffer || 0)]);
        else if (b.kind === "sperr") busy.push([b.startMin, b.endMin]);
        else if (b.kind === "aufgabe" || b.kind === "ziel") { busy.push([b.startMin, b.endMin]); load += b.endMin - b.startMin; }
      }
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      days[iso] = {
        iso, from, to, busy, opts: [], load, freeLoad: 0,
        // Urlaub (ganztägig) oder Wochenende frei (Einstellung)
        blocked: plan.allDay.some((a) => a.kind !== "feiertag") || (cfg.wochenendeFrei && weekend),
      };
    }
    return days;
  }

  // ---------- Hauptfunktion ----------
  // full = alle Optionen verwerfen und neu verteilen (Knopf "Neu planen")
  function computePlan(entries, now, { full = false, place = true } = {}) {
    const cfg = CPM.cfg;
    const maxMin = cfg.maxHoursPerDay * 60;
    const todayIso = S.isoDate(now);
    const nm = nowMin(now);
    const items = collectItems(entries, now);
    const byKey = Object.fromEntries(items.map((it) => [it.key, it]));
    const days = buildDays(entries, now);
    const moved = new Set([...pendingMoved].filter((k) => byKey[k]));

    const isFree = (day, a, b) => !day.busy.some(([x, y]) => overlaps(a, b, x, y)) && !day.opts.some((o) => overlaps(a, b, o.a, o.b));
    const declinedHit = (it, iso, a, b) => (it.holder.declined || []).some((x) => x.date === iso && overlaps(a, b, S.toMin(x.start), S.toMin(x.end)));
    const optMinutes = (it) => it.holder.slots.filter((s) => !s.confirmed && !ended(s, todayIso, nm)).reduce((a, s) => a + slotLen(s), 0);
    const remaining = (it) => it.need - optMinutes(it);

    // Erledigte/abgelehnte Vergangenheit aufräumen
    for (const it of items) {
      if (it.holder.declined) it.holder.declined = it.holder.declined.filter((x) => x.date >= todayIso);
    }

    const nodlUntil = S.isoDate(S.addDays(now, NODL_DAYS - 1));

    // 1. Vorhandene Optionen prüfen (Wichtigstes zuerst behält seinen Platz)
    for (const it of items) {
      const keep = [];
      let kept = 0;
      for (const s of it.holder.slots) {
        if (s.confirmed) { keep.push(s); continue; }
        if (ended(s, todayIso, nm) || full) continue;            // vorbei oder Neuplanung
        if (it.need <= 0) continue;                               // erledigt
        const day = days[s.date];
        const a = S.toMin(s.start);
        let b = S.toMin(s.end);
        // Restzeit gesunken (z. B. nach Fortschritt) → Vorschlag kürzen
        if (kept < it.need && kept + (b - a) > it.need) {
          let len = it.need - kept;
          if (it.kind === "sub" && it.need >= MIN_GOAL) len = Math.max(len, MIN_GOAL);
          len = up5(len);
          if (len < b - a) { b = a + len; s.end = S.fromMin(b); }
        }
        const running = s.date === todayIso && a < nm;
        if (!running && b - a > MAX_BLOCK) continue;              // zu lang am Stück → neu verteilen
        if (it.noDL && (s.date > nodlUntil || (day && day.freeLoad + (b - a) > NODL_PER_DAY))) continue;
        // Läuft gerade (heute schon begonnen) → darf vor "from" liegen
        const inWindow = day && !day.blocked && a >= S.toMin(cfg.workFrom) && b <= day.to;
        const hitsFixed = !day || day.blocked || day.busy.some(([x, y]) => overlaps(a, b, x, y));
        const tooShort = it.kind === "sub" && b - a < minLenOf(it, it.need) && !(s.date === todayIso && a < nm); // z. B. alte 30-Min.-Blöcke
        const ok = inWindow && !hitsFixed && !tooShort && isFree(day, a, b) && !declinedHit(it, s.date, a, b) && day.load + (b - a) <= maxMin && kept < it.need;
        if (!ok) {
          // Nur melden, wenn ein Termin/Sperrzeit/Urlaub im Weg ist
          if (hitsFixed && day) moved.add(it.key);
          continue;
        }
        day.opts.push({ a, b, key: it.key, slot: s });
        day.load += b - a;
        if (it.noDL) day.freeLoad += b - a;
        kept += b - a;
        keep.push(s);
      }
      it.holder.slots = keep;
    }
    // Nur echte Verschiebungen melden (nicht "zu viel geplant" oder "vorbei")
    for (const k of [...moved]) if (byKey[k] && byKey[k].need <= 0) moved.delete(k);

    if (!place && !moved.size) return { items, moved: [], late: [] };

    // 2. Fehlende Zeit einplanen
    const placed = new Set();
    const visiting = new Set();
    let noEvict = false; // beim Nachrücken niemanden verdrängen
    const created = {}; // neu angelegte Optionen je Posten (für die Meldung)
    const late = new Set();

    function predEarliest(it) {
      let best = { iso: todayIso, min: 0 };
      for (const p of it.preds) {
        const pi = byKey[p.key];
        let t = null;
        if (pi) {
          if (!placed.has(pi.key) && !visiting.has(pi.key)) placeItem(pi);
          const ss = pi.holder.slots.filter((s) => !ended(s, todayIso, nm)).sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start));
          if (ss.length) {
            const s = p.type === DEP.AA ? ss[0] : ss[ss.length - 1];
            t = p.type === DEP.AA ? { iso: s.date, min: S.toMin(s.start) } : { iso: s.date, min: S.toMin(s.end) };
          }
        } else {
          const n = it.nodes[p.fromId]; // z. B. Unterziel mit "Dauer"
          if (n && !n.done) t = { iso: S.isoDate(S.addDays(now, Math.ceil((p.type === DEP.AA ? n.ES : n.EF) - 1e-9))), min: 0 };
        }
        if (t && p.lag) t = { iso: S.isoDate(S.addDays(S.parseDate(t.iso), Math.ceil(p.lag))), min: p.lag > 0 ? 0 : t.min };
        if (t && (t.iso > best.iso || (t.iso === best.iso && t.min > best.min))) best = t;
      }
      return best;
    }

    // Stücke in freie Lücken legen; untilIso = nur bis zu diesem Tag.
    // Ziel-Arbeit: nur Lücken ab 1,5 Std. Aufgaben: erst Lücken ab 1 Std.,
    // dann (falls nötig) auch kleinere.
    function fill(it, start, untilIso) {
      if (it.kind === "sub") { fillRuns(it, start, untilIso, MIN_GOAL / STEP); return; }
      fillRuns(it, start, untilIso, MIN_TASK / STEP);
      if (remaining(it) > 0) fillRuns(it, start, untilIso, 1);
    }

    function fillRuns(it, start, untilIso, minRun) {
      let rem = remaining(it);
      if (rem <= 0) return 0;
      let chunks = Math.ceil(rem / STEP);
      const total = chunks;
      let placedChunks = 0;
      const blocks = [];
      if (it.noDL) untilIso = untilIso && untilIso < nodlUntil ? untilIso : nodlUntil;
      for (let i = 0; i < HORIZON && chunks > 0; i++) {
        const iso = S.isoDate(S.addDays(now, i));
        if (iso < start.iso) continue;
        if (untilIso && iso > untilIso) break;
        const day = days[iso];
        if (!day || day.blocked) continue;
        // Zusammenhängende freie Stücke suchen ("Läufe"). Ein Lauf wird nur
        // genommen, wenn er mindestens minRun Stücke lang ist (außer der
        // Rest ist kleiner) – so entstehen keine 30-Min.-Krümel.
        let t = day.from;
        while (t + STEP <= day.to && chunks > 0) {
          const usable = (x) => !(iso === start.iso && x < start.min) && isFree(day, x, x + STEP) && !declinedHit(it, iso, x, x + STEP);
          if (!usable(t)) { t += STEP; continue; }
          let run = 0;
          while (t + (run + 1) * STEP <= day.to && usable(t + run * STEP)) run++;
          let room = Math.floor((maxMin - day.load) / STEP);
          if (it.noDL) room = Math.min(room, Math.floor((NODL_PER_DAY - day.freeLoad) / STEP));
          let take = Math.min(run, chunks, room, MAX_BLOCK / STEP);
          if (take <= 0) break; // Tageslimit erreicht
          if (take < Math.min(minRun, chunks)) { t += run * STEP; continue; }
          // Ziel-Arbeit: keinen Rest unter der Mindestlänge übrig lassen
          const left = chunks - take;
          if (it.kind === "sub" && left > 0 && left < minRun) {
            if (chunks - minRun >= minRun) take = chunks - minRun; // Rest wird genau ein Mindestblock
            else chunks = take + minRun;                           // lieber etwas mehr einplanen
          }
          const cur = { iso, a: t, b: t + take * STEP, parts: [] };
          for (let k = 0; k < take; k++) {
            const o = { a: t + k * STEP, b: t + (k + 1) * STEP, key: it.key };
            day.opts.push(o);
            cur.parts.push(o);
          }
          day.load += take * STEP;
          if (it.noDL) day.freeLoad += take * STEP;
          chunks -= take;
          placedChunks += take;
          blocks.push(cur);
          // Lauf noch nicht ausgeschöpft (3-Std.-Grenze) → 30 Min. Pause, dann weiter
          t += take < run ? (take + 1) * STEP : run * STEP;
        }
      }
      // Letzten Block auf die echte Restzeit kürzen (z. B. 45 Min. statt 60),
      // aber nie unter die Mindestlänge
      if (chunks === 0 && blocks.length) {
        const last = blocks[blocks.length - 1];
        const extra = placedChunks * STEP - rem;
        const keep = blocks.length === 1 ? minLenOf(it, rem) : minLenOf(it, Infinity);
        if (extra > 0) {
          const full = last.b;
          last.b -= Math.max(0, Math.min(extra, (last.b - last.a) - keep));
          last.b = Math.min(full, up5(last.b)); // auf 5 Min. runden, z. B. 17:15 statt 17:12
        }
      }
      for (const bl of blocks) {
        const slot = { id: Model.newId(), date: bl.iso, start: S.fromMin(bl.a), end: S.fromMin(bl.b), confirmed: false };
        bl.parts.forEach((o) => { o.slot = slot; });
        it.holder.slots.push(slot);
        (created[it.key] = created[it.key] || []).push(slot);
      }
      return (total - chunks) * STEP;
    }

    // Optionen weniger wichtiger Posten bis "untilIso" freiräumen
    function evictFor(it, start, untilIso) {
      let freed = 0;
      for (const day of Object.values(days)) {
        if (day.iso < start.iso || day.iso > untilIso) continue;
        day.opts = day.opts.filter((o) => {
          const other = byKey[o.key];
          if (!other || other.rank <= it.rank || !o.slot || o.slot.confirmed) return true;
          other.holder.slots = other.holder.slots.filter((s) => s !== o.slot);
          day.load -= o.b - o.a;
          freed += o.b - o.a;
          placed.delete(other.key); // wird gleich neu eingeplant
          return false;
        });
      }
      return freed;
    }

    function placeItem(it) {
      if (placed.has(it.key) || visiting.has(it.key)) return;
      visiting.add(it.key);
      const start = predEarliest(it);
      if (remaining(it) > 0) {
        if (it.due && it.due >= start.iso) {
          fill(it, start, it.due);
          if (remaining(it) > 0 && it.level <= 1 && !noEvict && evictFor(it, start, it.due) > 0) fill(it, start, it.due);
        }
        if (remaining(it) > 0) {
          if (it.due) late.add(it.key);
          fill(it, start, null);
        }
      }
      visiting.delete(it.key);
      placed.add(it.key);
    }

    // Nachrücken: Vorschläge eines Postens neu legen – nur in freie Lücken oder
    // auf den eigenen alten Platz (andere werden nicht verdrängt). Ändert sich
    // nichts, bleiben die alten Vorschläge (gleiche IDs) erhalten.
    const sig = (arr) => arr.map((s) => s.date + s.start + s.end).sort().join("|");
    function reflow(it) {
      const old = it.holder.slots.filter((s) => !s.confirmed && !ended(s, todayIso, nm));
      const runningNow = old.some((s) => s.date === todayIso && S.toMin(s.start) < nm);
      if (!old.length || runningNow) { placeItem(it); return; }
      for (const day of Object.values(days)) {
        day.opts = day.opts.filter((o) => {
          if (o.key !== it.key || !old.includes(o.slot)) return true;
          day.load -= o.b - o.a;
          if (it.noDL) day.freeLoad -= o.b - o.a;
          return false;
        });
      }
      it.holder.slots = it.holder.slots.filter((s) => !old.includes(s));
      noEvict = true;
      placeItem(it);
      noEvict = false;
      const neu = it.holder.slots.filter((s) => !s.confirmed && !old.includes(s));
      if (sig(neu) === sig(old)) {
        // gleicher Plan → alte Vorschläge behalten (keine unnötigen Änderungen)
        const byPos = Object.fromEntries(old.map((s) => [s.date + s.start + s.end, s]));
        it.holder.slots = it.holder.slots.filter((s) => !neu.includes(s)).concat(old);
        for (const day of Object.values(days)) for (const o of day.opts) if (o.key === it.key && neu.includes(o.slot)) o.slot = byPos[o.slot.date + o.slot.start + o.slot.end] || o.slot;
        if (created[it.key]) created[it.key] = created[it.key].filter((s) => !neu.includes(s));
      }
    }

    if (place) {
      // Verdrängte Posten landen wieder in "placed = nein" → zweite Runde
      for (let round = 0; round < 3; round++) {
        for (const it of items) if (!placed.has(it.key)) (full || round > 0 ? placeItem(it) : reflow(it));
        if (items.every((it) => placed.has(it.key))) break;
      }
    } else {
      for (const k of moved) if (byKey[k]) placeItem(byKey[k]);
    }

    return { items, created, moved: [...moved].map((k) => byKey[k]).filter(Boolean), late: [...late].map((k) => byKey[k]) };
  }

  // ---------- Ausführen und speichern ----------
  async function sync({ full = false, silent = false } = {}) {
    if (running) { again = true; return null; }
    running = true;
    let result = null;
    try {
      const entries = await Store.list(null, { area: "privat" });
      const before = Object.fromEntries(entries.map((e) => [e.id, JSON.stringify(e)]));
      const now = new Date();
      result = computePlan(entries, now, { full, place: autoPlan || full });
      pendingMoved.clear();
      const changed = entries.filter((e) => JSON.stringify(e) !== before[e.id]);
      if (changed.length) await Store.saveMany(changed, { source: "planer" });
      if (!silent) report(result);
    } catch (err) {
      console.error("Planer:", err);
    } finally {
      running = false;
    }
    if (again) { again = false; return sync({ silent: true }); }
    return result;
  }

  // Kurze Meldung, wenn ein Block wegen eines neuen Termins umziehen musste
  function report(r) {
    if (!r || !r.moved.length) return;
    const it = r.moved[0];
    const next = (r.created[it.key] || []).filter((s) => it.holder.slots.includes(s)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
    let text = next ? `„${it.title}“ verschoben auf ${fmtDay(next.date)}, ${next.start}–${next.end}` : `„${it.title}“ findet gerade keinen freien Platz`;
    if (r.late.includes(it)) text += " – wird knapp vor der Deadline!";
    else if (r.moved.length > 1) text += ` (+${r.moved.length - 1} weitere)`;
    Toast.show(text);
  }

  // Bei jeder Änderung (außer den eigenen) kurz danach neu prüfen
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => sync(), 60);
  }
  Store.subscribe((change) => {
    if (change.source === "planer") return;
    if (change.settings) autoPlan = change.settings.autoPlanen !== false;
    if (change.action === "importiert" || change.action === "geleert") Store.getSettings().then((st) => { autoPlan = st.autoPlanen !== false; });
    schedule();
  });
  Store.getSettings().then((st) => { autoPlan = st.autoPlanen !== false; schedule(); });
  // Zeit vergeht: vergangene Optionen aufräumen
  setInterval(() => sync({ silent: true }), 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) sync({ silent: true }); });

  // ---------- Optionen und Blöcke bearbeiten ----------
  async function locate(entryId, slotId, subId) {
    const entry = await Store.get(entryId);
    if (!entry) return null;
    const holder = subId ? (entry.subgoals || []).find((x) => x.id === subId) : entry;
    const slot = holder && (holder.slots || []).find((s) => s.id === slotId);
    return slot ? { entry, holder, slot } : null;
  }

  async function updateSlot(entryId, slotId, subId, fn) {
    const f = await locate(entryId, slotId, subId);
    if (!f) return;
    fn(f.holder, f.slot);
    await Store.save(f.entry);
  }

  const confirmSlot = (id, slotId, subId) => updateSlot(id, slotId, subId, (h, s) => { s.confirmed = true; });
  const makeOption = (id, slotId, subId) => updateSlot(id, slotId, subId, (h, s) => { s.confirmed = false; });
  // "Anderer Zeitpunkt": hier nicht mehr vorschlagen
  const decline = (id, slotId, subId) => updateSlot(id, slotId, subId, (h, s) => {
    h.declined = [...(h.declined || []), { date: s.date, start: s.start, end: s.end }];
    h.slots = h.slots.filter((x) => x !== s);
  });
  // Bestätigten Block freigeben (z. B. weil ein neuer Termin dort liegt)
  async function releaseSlot(id, slotId, subId) {
    pendingMoved.add(subId ? id + "/" + subId : id);
    await updateSlot(id, slotId, subId, (h, s) => { h.slots = h.slots.filter((x) => x !== s); });
  }

  async function openSlot(entryId, slotId, subId) {
    const f = await locate(entryId, slotId, subId);
    if (!f) return;
    const { entry, holder, slot } = f;
    const esc = Editor.esc;
    const isTask = entry.type === T.AUFGABE;
    const title = isTask ? entry.title : holder.title;
    const sub = isTask ? "Aufgabe" : `Ziel: ${entry.title}`;
    const when = `${S.parseDate(slot.date).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}, ${slot.start}–${slot.end}`;
    let info = "";
    if (!isTask) {
      const r = CPM.computeGoal(entry, await Store.list(null, { area: "privat" }));
      const n = !r.cycle && r.nodes[holder.id];
      const rest = Math.round((Model.restzeitStunden(holder) || 0) * 60);
      info = `Noch ${fmtH(rest)} für dieses Unterziel${n && n.level ? ` · <b class="lvl lvl--${n.level}">${n.level}</b>` : ""}${n ? ` · spätestens fertig ${fmtDay(n.latestEnd)}` : ""}`;
    } else {
      info = `Dauer ${fmtH(entry.durationMin)}${entry.deadline ? ` · Deadline ${S.deadlineLabel(entry.deadline)}` : ""}`;
    }

    Editor.show(`
      <div class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet__head">
          <button class="link-btn" data-close>Schließen</button>
          <h2 id="sheet-title">${slot.confirmed ? "Fester Block" : "Vorschlag"}</h2>
          <span class="sheet__spacer"></span>
        </div>
        <div class="slot-card ${slot.confirmed ? "" : "slot-card--option"}" style="--c:${entry.color || "var(--accent)"}">
          <b>${esc(title)}</b>
          <small>${esc(sub)}</small>
          <span>${esc(when)}</span>
        </div>
        <p class="notice">${info}</p>
        <div class="form-group form-actions">
          ${slot.confirmed ? `
            ${isTask ? `<button class="action" data-a="done">Erledigt abhaken</button>` : `<button class="action" data-a="progress">Fortschritt eintragen</button>`}
            <button class="action" data-a="option">Wieder zum Vorschlag machen</button>
            <button class="action action--danger" data-a="release">Block entfernen und neu einplanen</button>` : `
            <button class="action" data-a="confirm"><b>Bestätigen</b></button>
            <button class="action" data-a="decline">Anderer Zeitpunkt</button>`}
          <button class="action" data-a="open">${isTask ? "Aufgabe öffnen" : "Ziel öffnen"}</button>
        </div>
      </div>`);
    const layer = document.querySelector(".sheet-layer");
    layer.querySelector("[data-close]").onclick = Editor.close;
    layer.querySelectorAll("[data-a]").forEach((btn) => {
      btn.onclick = async () => {
        const a = btn.dataset.a;
        Editor.close();
        if (a === "confirm") { await confirmSlot(entryId, slotId, subId); Toast.show("Bestätigt – fester Block"); }
        if (a === "decline") { await decline(entryId, slotId, subId); Toast.show("Die App sucht einen anderen Zeitpunkt"); }
        if (a === "option") await makeOption(entryId, slotId, subId);
        if (a === "release") await releaseSlot(entryId, slotId, subId);
        if (a === "done") await Tasks.toggleDone(entryId);
        if (a === "progress") Goals.openProgress(entryId, subId);
        if (a === "open") { if (isTask) Editor.edit(entryId); else location.hash = "#ziel/" + encodeURIComponent(entryId); }
      };
    });
  }

  // Alle Optionen eines Tages bestätigen (Hinweis am Vortag)
  async function confirmDay(iso) {
    const entries = await Store.list(null, { area: "privat" });
    const changed = [];
    for (const e of entries) {
      let hit = false;
      const holders = e.type === T.AUFGABE ? [e] : e.type === T.ZIEL ? (e.subgoals || []) : [];
      for (const h of holders) for (const s of h.slots || []) if (s.date === iso && !s.confirmed) { s.confirmed = true; hit = true; }
      if (hit) changed.push(e);
    }
    await Store.saveMany(changed);
    return changed.length;
  }

  // Optionen an einem Tag (für den Hinweis am Vortag)
  function optionsOn(entries, iso) {
    return S.dayPlan(entries, S.parseDate(iso)).timed.filter((b) => b.option && !b.done);
  }

  // ---------- "Was mache ich jetzt?" ----------
  // Schaut auf die freie Zeit bis zum nächsten Termin und schlägt
  // das Wichtigste vor (gleiche Reihenfolge wie beim Einplanen).
  // fromMin: ab wann geschaut wird (Standard: jetzt; während eines Termins: danach)
  function nowSituation(entries, now, fromMin = null) {
    const cfg = CPM.cfg;
    const nm = fromMin == null ? nowMin(now) : fromMin;
    const plan = S.dayPlan(entries, now);
    const fixed = plan.timed.filter((b) => !b.cancelled && !b.option && (b.kind === "fest" || b.kind === "einmalig"));
    const running = fixed.find((b) => b.startMin <= nm && nm < b.endMin);
    const sperr = plan.timed.find((b) => b.kind === "sperr" && b.startMin <= nm && nm < b.endMin);
    const busyStarts = plan.timed
      .filter((b) => !b.cancelled && !b.option && b.kind !== "sperr" && !(b.kind === "aufgabe" || b.kind === "ziel") && b.startMin - (b.buffer || 0) > nm)
      .map((b) => ({ min: b.startMin - (b.buffer || 0), label: `„${b.title}“ (${b.start} Uhr)` }));
    plan.timed.filter((b) => !b.cancelled && !b.option && (b.kind === "aufgabe" || b.kind === "ziel") && b.startMin > nm)
      .forEach((b) => busyStarts.push({ min: b.startMin, label: `deinem Block „${b.title}“ (${b.start} Uhr)` }));
    plan.timed.filter((b) => b.kind === "sperr" && b.startMin > nm)
      .forEach((b) => busyStarts.push({ min: b.startMin, label: `deiner Sperrzeit „${b.title}“ (${b.start} Uhr)` }));
    busyStarts.push({ min: S.toMin(cfg.workTo), label: `Feierabend (${cfg.workTo} Uhr)` });
    const next = busyStarts.sort((a, b) => a.min - b.min)[0];
    const outside = nm < S.toMin(cfg.workFrom) || nm >= S.toMin(cfg.workTo);
    return { running, sperr, outside, from: nm, gap: Math.max(0, next.min - nm), nextLabel: next.label };
  }

  function startable(it) {
    if (it.kind !== "sub") return true;
    return (it.sg.dependencies || []).every((d) => {
      const p = it.entry.subgoals.find((x) => x.id === d.fromId);
      if (!p || p.done) return true;
      if ((d.type || DEP.EA) === DEP.AA) return (p.log || []).length > 0 || p.progressPercent > 0;
      return false;
    });
  }

  async function whatNow() {
    const entries = await Store.list(null, { area: "privat" });
    const now = new Date();
    let sit = nowSituation(entries, now);
    // Läuft gerade ein Termin? Dann für die Zeit danach vorschlagen (auch bei Terminen direkt hintereinander)
    const runningNow = sit.running;
    for (let k = 0; k < 5 && sit.running; k++) sit = nowSituation(entries, now, up5(sit.running.endMin + (sit.running.buffer || 0)));
    const later = !!runningNow;
    const cfg = CPM.cfg;
    const weekend = cfg.wochenendeFrei && (now.getDay() === 0 || now.getDay() === 6);
    let cands = collectItems(entries, now).filter((it) => it.need > 0 && startable(it));
    // Ziel-Arbeit lohnt sich erst ab 1,5 Std. (außer es ist nur noch weniger übrig)
    const shortForGoals = sit.gap < MIN_GOAL && cands.some((it) => it.kind === "sub" && it.need > sit.gap);
    cands = cands.filter((it) => !(it.kind === "sub" && sit.gap < MIN_GOAL && it.need > sit.gap));
    // Kurze Lücke: was hineinpasst zuerst
    if (sit.gap < 60) cands = [...cands.filter((it) => it.need <= sit.gap), ...cands.filter((it) => it.need > sit.gap)];
    let idx = 0;
    let force = false;
    const esc = Editor.esc;

    function draw() {
      let head = "";
      let card = "";
      let buttons = "";
      const intro = later ? `Gerade läuft „${esc(runningNow.title)}“ bis ${runningNow.end} Uhr. ` : "";
      const when = later ? `danach (ab ${S.fromMin(sit.from)} Uhr)` : "gerade";
      if ((sit.sperr || sit.outside || weekend) && !force) {
        head = intro + (weekend ? "Es ist Wochenende – heute keine Vorschläge. Gönn dir die Pause!"
          : sit.sperr ? `${later ? "Danach" : "Gerade"} ist deine Sperrzeit „${esc(sit.sperr.title)}“. Gönn dir die Pause!`
          : `${later ? "Danach" : "Gerade"} ist außerhalb deiner Arbeitszeit. Gönn dir die Pause!`);
        buttons = `<button class="action" data-a="force">Trotzdem etwas vorschlagen</button>`;
      } else if (!cands.length) {
        head = intro + (shortForGoals
          ? `${later ? "Danach" : "Jetzt"} nur ${fmtH(sit.gap)} bis ${esc(sit.nextLabel)} – für Ziel-Arbeit lohnt sich erst ein Block ab 1,5 Std. Kurze Pause?`
          : "Nichts offen – alles erledigt. Genieß die freie Zeit!");
      } else if (sit.gap < 10 && !force) {
        head = intro + `${later ? "Danach" : "Jetzt"} nur ${sit.gap} Min. bis ${esc(sit.nextLabel)} – kurz durchatmen.`;
      } else {
        const gap = force && (sit.sperr || sit.outside || weekend) ? 60 : sit.gap;
        const it = cands[idx % cands.length];
        const len = Math.max(it.kind === "sub" ? Math.min(MIN_GOAL, it.need) : 15, Math.min(gap, it.need));
        const lvl = it.level === 0 ? "kritisch" : it.level === 1 ? "eng" : "";
        head = intro + (later ? `Danach (ab ${S.fromMin(sit.from)} Uhr) hast du ${fmtH(gap)} bis ${esc(sit.nextLabel)}.` : `Du hast ${fmtH(gap)} bis ${esc(sit.nextLabel)}.`);
        card = `
          <div class="slot-card" style="--c:${it.color || "var(--accent)"}">
            <b>${esc(it.title)}</b>
            <small>${it.kind === "sub" ? `Ziel: ${esc(it.goalTitle)}` : "Aufgabe"}${lvl ? ` · <span class="lvl lvl--${lvl}">${lvl}</span>` : ""}</small>
            <span>noch ${fmtH(it.need)}${it.due ? ` · fertig bis ${fmtDay(it.due)}` : ""} → ${when} ${fmtH(len)}</span>
          </div>`;
        buttons = `<button class="action" data-a="go" data-len="${len}"><b>${later ? `Für ${S.fromMin(sit.from)} Uhr einplanen` : "Los, jetzt machen"}</b></button>
          ${cands.length > 1 ? `<button class="action" data-a="other">Anderer Vorschlag (${(idx % cands.length) + 1}/${cands.length})</button>` : ""}`;
      }
      Editor.show(`
        <div class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div class="sheet__head">
            <button class="link-btn" data-close>Schließen</button>
            <h2 id="sheet-title">Was mache ich jetzt?</h2>
            <span class="sheet__spacer"></span>
          </div>
          <p class="whatnow-head">${head}</p>
          ${card}
          ${buttons ? `<div class="form-group form-actions">${buttons}</div>` : ""}
        </div>`);
      const layer = document.querySelector(".sheet-layer");
      layer.querySelector("[data-close]").onclick = Editor.close;
      layer.querySelectorAll("[data-a]").forEach((b) => {
        b.onclick = async () => {
          if (b.dataset.a === "other") { idx++; draw(); return; }
          if (b.dataset.a === "force") { force = true; draw(); return; }
          if (b.dataset.a === "go") await startNow(cands[idx % cands.length], Number(b.dataset.len), later ? sit.from : null);
        };
      });
    }
    draw();
  }

  // Bestätigten Block ab jetzt eintragen
  async function startNow(it, len, startMin = null) {
    const now = new Date();
    const start = startMin != null ? startMin : Math.floor(nowMin(now) / 5) * 5;
    const end = Math.min(up5(start + len), 24 * 60 - 1);
    const entry = await Store.get(it.entry.id);
    const holder = it.kind === "sub" ? entry.subgoals.find((x) => x.id === it.sg.id) : entry;
    holder.slots = [...(holder.slots || []), { id: Model.newId(), date: S.isoDate(now), start: S.fromMin(start), end: S.fromMin(end), confirmed: true }];
    await Store.save(entry);
    Editor.close();
    Toast.show(startMin != null ? `„${it.title}“ für ${S.fromMin(start)}–${S.fromMin(end)} Uhr eingetragen` : `Viel Erfolg! „${it.title}“ bis ${S.fromMin(end)} Uhr eingetragen`);
  }

  return {
    sync, computePlan, collectItems, openSlot, confirmDay, optionsOn, releaseSlot, whatNow,
    get auto() { return autoPlan; }, STEP, fmtH, ended, nowMin,
  };
})();
