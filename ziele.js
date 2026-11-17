// ============================================================
// Ziele: Liste der Ziele, Detailseite mit Unterzielen,
// Formulare für Ziel, Unterziel und Fortschritt (Std. + %).
// ============================================================

// ---------- Rechnen ----------
const GoalMath = (() => {
  // Gewicht eines Unterziels für den Gesamtfortschritt:
  // Aufwand in Stunden, Dauer in Tagen (1 Tag ≈ 8 Std.)
  const weight = (sg) => (sg.mode === "dauer" ? Math.max(sg.durationDays, 0.25) * 8 : Math.max(sg.estimateHours, 0.25));

  function progress(goal) {
    const subs = goal.subgoals || [];
    if (!subs.length) return 0;
    let sum = 0, total = 0;
    for (const sg of subs) {
      const p = sg.done ? 100 : sg.progressPercent;
      sum += weight(sg) * p;
      total += weight(sg);
    }
    return Math.round(sum / total);
  }

  // Restliche Arbeitsstunden (nur Unterziele mit Aufwand)
  function remainingHours(goal) {
    return round1((goal.subgoals || [])
      .filter((sg) => !sg.done && sg.mode !== "dauer")
      .reduce((s, sg) => s + Model.restzeitStunden(sg), 0));
  }

  const fmtDays = (d) => {
    const r = Math.round(d * 10) / 10;
    return (Math.abs(r) === 1 ? "1 Tag" : String(Math.abs(r)).replace(".", ",") + " Tage");
  };
  const workedHours = (sg) => round1((sg.log || []).reduce((s, e) => s + (e.hours || 0), 0));
  const round1 = (n) => Math.round(n * 10) / 10;
  const fmtHours = (h) => String(round1(h)).replace(".", ",") + " Std.";

  // Kennzeichnung eines Unterziels: kritisch (rot) / eng (orange) / Hauptpfad (grau)
  const pct = (u) => (u === Infinity ? "über 100 %" : Math.round(u * 100) + " %");
  function levelBadges(n) {
    if (!n || n.done) return "";
    const lvl = n.level === "kritisch" ? `<b class="badge badge--crit" title="${pct(n.utilization)} der freien Zeit nötig">kritisch</b>`
      : n.level === "eng" ? `<b class="badge badge--warn" title="${pct(n.utilization)} der freien Zeit nötig">eng</b>` : "";
    const main = n.mainPath ? `<span class="badge badge--main" title="Längste Kette: bestimmt, wann das Ziel frühestens fertig ist">Hauptpfad</span>` : "";
    return lvl + main;
  }

  return { progress, remainingHours, workedHours, fmtHours, fmtDays, round1, pct, levelBadges };
})();

// ---------- Formulare ----------
const Goals = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);

  const prioHtml = (cur) => [1, 2, 3, 4, 5].map((p) => `
    <label class="seg"><input type="radio" name="priority" value="${p}" ${cur === p ? "checked" : ""}><span>${p}</span></label>`).join("");

  function formShell(title, color, body, actions = "") {
    return `
      <form class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head">
          <button type="button" class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title"><span class="choice__dot" style="background:${color}" data-title-dot></span>${title}</h2>
          <button type="submit" class="link-btn link-btn--strong">Sichern</button>
        </div>
        ${body}
        <p class="form-error" role="alert" hidden></p>
        ${actions ? `<div class="form-group form-actions">${actions}</div>` : ""}
      </form>`;
  }

  function wire(form, onSubmit, actions = {}) {
    const errorEl = form.querySelector(".form-error");
    const fail = (msg, field) => {
      errorEl.textContent = msg;
      errorEl.hidden = false;
      if (field && form.elements[field]) form.elements[field].focus();
    };
    form.querySelector("[data-close]").onclick = Editor.close;
    form.addEventListener("change", () => { errorEl.hidden = true; });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await onSubmit(fail); } catch (err) { console.error(err); fail("Speichern hat nicht geklappt."); }
    });
    form.querySelectorAll("[data-action]").forEach((btn) => {
      btn.onclick = () => actions[btn.dataset.action] && actions[btn.dataset.action]();
    });
  }

  // ===== Ziel anlegen / bearbeiten =====
  function goalForm(goal, isNew) {
    const colors = Editor.TASK_COLORS.map((c) => `
      <label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}" ${goal.color === c ? "checked" : ""} aria-label="Farbe ${c}"><span></span></label>`).join("");

    Editor.show(formShell(isNew ? "Neues Ziel" : "Ziel bearbeiten", goal.color, `
      <div class="form-group">
        <input class="title-input" name="title" placeholder="Titel, z. B. Architektur-Abgabe" value="${esc(goal.title)}" autocomplete="off" ${isNew ? "autofocus" : ""}>
        <textarea name="notes" rows="2" placeholder="Notiz (optional)">${esc(goal.notes)}</textarea>
      </div>
      <div class="form-group">
        <label class="row"><span>Deadline</span><input type="date" name="deadline" value="${esc(goal.deadline || "")}"></label>
      </div>
      <div class="form-group">
        <div class="row row--stack">
          <span>Priorität <small class="muted">1 = kann warten · 5 = sehr wichtig</small></span>
          <div class="segmented">${prioHtml(goal.priority)}</div>
        </div>
        <div class="row row--stack"><span>Farbe</span><div class="swatches">${colors}</div></div>
      </div>
      ${isNew ? `<p class="hint hint--plain">Unterziele (z. B. Grundriss, Lageplan, Details) legst du im nächsten Schritt an.</p>` : ""}`,
      isNew ? "" : `
        <button type="button" class="action" data-action="finish">${goal.done ? "Ziel wieder öffnen" : "Ziel als erledigt abschließen"}</button>
        <button type="button" class="action action--danger" data-action="delete">Ziel löschen</button>`));

    const form = Editor.sheetForm();
    form.addEventListener("change", () => {
      const c = form.querySelector('[name="color"]:checked');
      if (c) form.querySelector("[data-title-dot]").style.background = c.value;
    });

    wire(form, async (fail) => {
      const out = { ...goal };
      out.title = form.elements.title.value.trim();
      out.notes = form.elements.notes.value.trim();
      out.deadline = form.elements.deadline.value || null;
      out.priority = Number((form.querySelector('[name="priority"]:checked') || {}).value || 3);
      out.color = (form.querySelector('[name="color"]:checked') || {}).value || goal.color;
      if (!out.title) return fail("Bitte gib einen Titel ein.", "title");
      if (!out.deadline) return fail("Ein Ziel braucht eine Deadline.", "deadline");
      const late = (out.subgoals || []).find((sg) => sg.deadline && sg.deadline > out.deadline);
      if (late) return fail(`Das Unterziel „${late.title}“ hat eine spätere Zwischen-Deadline.`, "deadline");
      await Store.save(out);
      Editor.close();
      if (isNew) location.hash = "#ziel/" + encodeURIComponent(out.id);
    }, {
      delete: async () => {
        if (!confirm(`„${goal.title}“ mit allen Unterzielen löschen?`)) return;
        await Store.remove(goal.id);
        Editor.close();
        location.hash = "#ziele";
      },
      finish: async () => {
        Editor.close();
        await Tasks.toggleDone(goal.id);
      },
    });
  }

  const newGoal = () => goalForm(Model.neuesZiel(), true);

  async function editGoal(goalId) {
    const goal = await Store.get(goalId);
    if (goal) goalForm(goal, false);
  }

  // ===== Unterziel anlegen / bearbeiten =====
  const DEP_LABELS = {
    "ende-anfang": "Ende → Anfang (erst fertig, dann starten)",
    "anfang-anfang": "Anfang → Anfang (gleichzeitig starten)",
    "ende-ende": "Ende → Ende (gleichzeitig fertig)",
    "anfang-ende": "Anfang → Ende (erst wenn A startet, darf B enden)",
  };

  function depsHtml(goal, sg, subs) {
    const bau = CPM.cfg.bau;
    const current = Object.fromEntries((sg.dependencies || []).map((d) => [d.fromId, d]));
    // Nur Unterziele anbieten, die keinen Kreis bilden würden
    const candidates = subs.filter((x) => x.id !== sg.id && !CPM.wouldCycle(goal, x.id, sg.id));
    if (!candidates.length) return "";
    const rows = candidates.map((x) => {
      const d = current[x.id];
      return `
        <div class="dep-row">
          <label class="dep-check"><input type="checkbox" name="dep" value="${esc(x.id)}" ${d ? "checked" : ""}><span>${esc(x.title)}</span></label>
          ${bau ? `
            <div class="dep-extra">
              <select name="depType-${esc(x.id)}" aria-label="Art der Abhängigkeit">
                ${Object.entries(DEP_LABELS).map(([v, l]) => `<option value="${v}" ${(d ? d.type : "ende-anfang") === v ? "selected" : ""}>${l}</option>`).join("")}
              </select>
              <span class="unit-input">Wartezeit <input type="number" name="depLag-${esc(x.id)}" step="0.5" inputmode="decimal" value="${d ? d.lagDays || 0 : 0}"> Tage</span>
            </div>` : ""}
        </div>`;
    }).join("");
    return `
      <div class="form-group">
        <div class="row row--stack">
          <span>${bau ? "Abhängigkeiten" : "Startet erst, wenn fertig ist:"}</span>
          <div class="dep-list">${rows}</div>
        </div>
        <p class="hint">${bau
          ? "Baumanagement-Modus: Art der Abhängigkeit und Wartezeit wählbar. Negative Wartezeit = Überlappung (z. B. −2 = darf 2 Tage früher starten)."
          : "Für den kritischen Pfad. Weitere Arten und Wartezeiten gibt es im Baumanagement-Modus (Einstellungen)."}</p>
      </div>`;
  }

  function cpmHtml(res, sg) {
    if (!res || res.cycle || !res.nodes[sg.id] || sg.done) return "";
    const n = res.nodes[sg.id];
    const d = (iso) => esc(S.parseDate(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }));
    return `
      <div class="form-group">
        <div class="row row--stack">
          <span>Zeitplan ${GoalMath.levelBadges(n)}</span>
          <dl class="cpm-values">
            <dt>Dauer</dt><dd>${GoalMath.fmtDays(n.D)}</dd>
            <dt>Frühester Anfang (FAZ)</dt><dd>${d(n.startDate)}</dd>
            <dt>Frühestes Ende (FEZ)</dt><dd>${d(n.endDate)}</dd>
            <dt>Spätester Anfang (SAZ)</dt><dd>${d(n.latestStart)}</dd>
            <dt>Spätestes Ende (SEZ)</dt><dd>${d(n.latestEnd)}</dd>
            <dt>Gesamtpuffer (GP)</dt><dd class="${n.TF < -0.05 ? "meta--warn" : ""}">${n.TF < -0.05 ? "−" : ""}${GoalMath.fmtDays(n.TF)}</dd>
            <dt>Auslastung</dt><dd class="${n.level === "kritisch" ? "meta--warn" : ""}">${n.neededHours > 0 ? `${GoalMath.pct(n.utilization)} (${GoalMath.fmtHours(n.neededHours)} von ${GoalMath.fmtHours(n.availableHours)} frei)` : "–"}</dd>
            <dt>Freier Puffer (FP)</dt><dd>${n.FF < -0.05 ? "−" : ""}${GoalMath.fmtDays(n.FF)}</dd>
          </dl>
        </div>
        <p class="hint">Auslastung = nötige Stunden (dieses Unterziel und alles davor) ÷ freie Zeit bis zum spätesten Ende. Ab 50 % „eng“, ab 80 % „kritisch“. Gerechnet mit Ø ${GoalMath.fmtHours(res.cap)} freier Zeit pro Tag.</p>
      </div>`;
  }

  function subgoalForm(goal, sg, isNew, res = null) {
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    const idx = subs.findIndex((x) => x.id === sg.id);

    Editor.show(formShell(isNew ? "Neues Unterziel" : "Unterziel", goal.color, `
      <p class="sheet__context">Ziel: ${esc(goal.title)}</p>
      <div class="form-group">
        <input class="title-input" name="title" placeholder="Titel, z. B. Grundriss" value="${esc(sg.title)}" autocomplete="off" ${isNew ? "autofocus" : ""}>
      </div>
      <div class="form-group">
        <div class="row row--stack">
          <span>Wie wird geschätzt?</span>
          <div class="segmented">
            <label class="seg"><input type="radio" name="mode" value="aufwand" ${sg.mode !== "dauer" ? "checked" : ""}><span>Aufwand (Std.)</span></label>
            <label class="seg"><input type="radio" name="mode" value="dauer" ${sg.mode === "dauer" ? "checked" : ""}><span>Dauer (Tage)</span></label>
          </div>
        </div>
        <label class="row" data-show="aufwand"><span>Geschätzter Aufwand</span>
          <span class="unit-input"><input type="number" name="estimateHours" min="0.25" step="0.25" inputmode="decimal" value="${sg.estimateHours}"> Std.</span>
        </label>
        <label class="row" data-show="dauer"><span>Dauer</span>
          <span class="unit-input"><input type="number" name="durationDays" min="0.5" step="0.5" inputmode="decimal" value="${sg.durationDays}"> Tage</span>
        </label>
        <p class="hint" data-mode-hint></p>
      </div>
      <div class="form-group">
        <label class="row"><span>Zwischen-Deadline</span><input type="date" name="deadline" value="${esc(sg.deadline || "")}" max="${esc(goal.deadline || "")}"></label>
        <p class="hint">Optional. Spätestens die Deadline des Ziels (${esc(S.deadlineLabel(goal.deadline))}).</p>
      </div>
      ${depsHtml(goal, sg, subs)}
      ${cpmHtml(res, sg)}`,
      isNew ? "" : `
        <button type="button" class="action" data-action="progress">Fortschritt eintragen</button>
        ${idx > 0 ? `<button type="button" class="action" data-action="up">In der Reihenfolge nach oben</button>` : ""}
        ${idx < subs.length - 1 ? `<button type="button" class="action" data-action="down">In der Reihenfolge nach unten</button>` : ""}
        <button type="button" class="action action--danger" data-action="delete">Unterziel löschen</button>`));

    const form = Editor.sheetForm();
    const update = () => {
      const mode = form.querySelector('[name="mode"]:checked').value;
      form.querySelectorAll("[data-show]").forEach((el) => { el.hidden = el.dataset.show !== mode; });
      form.querySelector("[data-mode-hint]").textContent = mode === "aufwand"
        ? "Eigene Arbeitszeit. Die App plant sie später in freie Zeit ein."
        : "Kalenderzeit, die vergeht, egal wie viel du daran arbeitest (z. B. „Rohbau 3 Wochen“).";
    };
    form.addEventListener("change", update);
    update();

    const saveGoal = async (subgoals) => { await Store.save({ ...goal, subgoals }); };

    wire(form, async (fail) => {
      const out = { ...sg };
      out.title = form.elements.title.value.trim();
      out.mode = form.querySelector('[name="mode"]:checked').value;
      out.estimateHours = Number(form.elements.estimateHours.value);
      out.durationDays = Number(form.elements.durationDays.value);
      out.deadline = form.elements.deadline.value || null;
      if (!out.title) return fail("Bitte gib einen Titel ein.", "title");
      if (out.mode === "aufwand" && !(out.estimateHours > 0)) return fail("Gib einen Aufwand größer als 0 ein.", "estimateHours");
      if (out.mode === "dauer" && !(out.durationDays > 0)) return fail("Gib eine Dauer größer als 0 ein.", "durationDays");
      if (out.deadline && goal.deadline && out.deadline > goal.deadline) return fail("Die Zwischen-Deadline liegt nach der Deadline des Ziels.", "deadline");
      // Abhängigkeiten auslesen (nur IDs, siehe CLAUDE.md)
      const bau = CPM.cfg.bau;
      const old = Object.fromEntries((sg.dependencies || []).map((d) => [d.fromId, d]));
      out.dependencies = [...form.querySelectorAll('[name="dep"]:checked')].map((cb) => {
        const id = cb.value;
        const typeEl = form.elements["depType-" + id];
        const lagEl = form.elements["depLag-" + id];
        return {
          fromId: id,
          type: bau && typeEl ? typeEl.value : (old[id] ? old[id].type : "ende-anfang"),
          lagDays: bau && lagEl ? (Number(lagEl.value) || 0) : (old[id] ? old[id].lagDays || 0 : 0),
        };
      });
      const list = isNew ? [...goal.subgoals, out] : goal.subgoals.map((x) => (x.id === out.id ? out : x));
      await saveGoal(list);
      Editor.close();
    }, {
      progress: () => progressForm(goal, sg),
      delete: async () => {
        if (!confirm(`Unterziel „${sg.title}“ löschen?`)) return;
        // Abhängigkeiten anderer Unterziele auf dieses Unterziel mit entfernen
        const list = goal.subgoals
          .filter((x) => x.id !== sg.id)
          .map((x) => ({ ...x, dependencies: (x.dependencies || []).filter((d) => d.fromId !== sg.id) }));
        await saveGoal(list);
        Editor.close();
      },
      up: async () => { await move(goal, sg.id, -1); Editor.close(); },
      down: async () => { await move(goal, sg.id, +1); Editor.close(); },
    });
  }

  async function move(goal, id, dir) {
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    const i = subs.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= subs.length) return;
    [subs[i], subs[j]] = [subs[j], subs[i]];
    await Store.save({ ...goal, subgoals: subs.map((x, k) => ({ ...x, order: k })) });
  }

  async function newSubgoal(goalId) {
    const goal = await Store.get(goalId);
    if (!goal) return;
    const order = goal.subgoals.reduce((m, x) => Math.max(m, x.order + 1), 0);
    subgoalForm(goal, Model.neuesUnterziel({ order, estimateHours: 4 }), true);
  }

  async function editSubgoal(goalId, sgId) {
    const goal = await Store.get(goalId);
    const sg = goal && goal.subgoals.find((x) => x.id === sgId);
    if (!sg) return;
    const res = CPM.computeGoal(goal, await Store.list());
    subgoalForm(goal, sg, false, res);
  }

  // ===== Fortschritt eintragen: "Wie lange gearbeitet? Wie viel % geschafft?" =====
  function progressForm(goal, sg) {
    const worked = GoalMath.workedHours(sg);
    const isAufwand = sg.mode !== "dauer";

    Editor.show(formShell("Fortschritt", goal.color, `
      <p class="sheet__context">${esc(sg.title)} · ${esc(goal.title)}</p>
      <p class="notice">Bisher: ${GoalMath.fmtHours(worked)} gearbeitet · ${sg.progressPercent} % geschafft${isAufwand ? ` · Schätzung ${GoalMath.fmtHours(sg.estimateHours)}` : ` · Dauer ${String(sg.durationDays).replace(".", ",")} Tage`}</p>
      <div class="form-group">
        <label class="row"><span>Heute gearbeitet</span>
          <span class="unit-input"><input type="number" name="hours" min="0" step="0.25" inputmode="decimal" value="" placeholder="0" autofocus> Std.</span>
        </label>
        <div class="row row--stack">
          <span>Insgesamt geschafft: <b data-pct>${sg.progressPercent} %</b></span>
          <input type="range" name="percent" min="0" max="100" step="5" value="${sg.progressPercent}" aria-label="Insgesamt geschafft in Prozent">
        </div>
        <p class="hint" data-forecast></p>
      </div>`, sg.done ? `<button type="button" class="action" data-action="reopen">Unterziel wieder öffnen</button>` : ""));

    const form = Editor.sheetForm();
    const pctEl = form.querySelector("[data-pct]");
    const forecast = form.querySelector("[data-forecast]");

    const preview = () => {
      const hours = Number(form.elements.hours.value) || 0;
      const pct = Number(form.elements.percent.value);
      pctEl.textContent = pct + " %";
      if (pct >= 100) { forecast.textContent = "Damit ist das Unterziel erledigt."; return; }
      if (!isAufwand) { forecast.textContent = ""; return; }
      const probe = { ...sg, progressPercent: pct, log: [...(sg.log || []), { hours }] };
      forecast.textContent = `→ noch ca. ${GoalMath.fmtHours(Model.restzeitStunden(probe))} Arbeit`;
    };
    form.addEventListener("input", preview);
    preview();

    wire(form, async (fail) => {
      const hours = Number(form.elements.hours.value) || 0;
      const pct = Number(form.elements.percent.value);
      if (hours < 0) return fail("Die Stunden dürfen nicht negativ sein.", "hours");
      if (hours === 0 && pct === sg.progressPercent) return fail("Trag gearbeitete Zeit oder einen neuen Prozentwert ein.", "hours");
      const done = pct >= 100;
      const updated = {
        ...sg,
        progressPercent: pct,
        // Erste Schätzung merken (Statistik: "Schätzung lernen")
        initialEstimateHours: sg.initialEstimateHours ?? sg.estimateHours,
        log: [...(sg.log || []), { date: S.isoDate(new Date()), hours, percent: pct }],
        done,
        doneAt: done ? new Date().toISOString() : null,
      };
      await Store.save({ ...goal, subgoals: goal.subgoals.map((x) => (x.id === sg.id ? updated : x)) });
      Editor.close();
      Toast.show(done ? `„${sg.title}“ erledigt` : `Gespeichert · ${pct} %`);
    }, {
      reopen: async () => {
        const updated = { ...sg, done: false, doneAt: null, progressPercent: Math.min(sg.progressPercent, 95) };
        await Store.save({ ...goal, subgoals: goal.subgoals.map((x) => (x.id === sg.id ? updated : x)) });
        Editor.close();
      },
    });
  }

  async function openProgress(goalId, sgId) {
    const goal = await Store.get(goalId);
    const sg = goal && goal.subgoals.find((x) => x.id === sgId);
    if (sg) progressForm(goal, sg);
  }

  return { newGoal, editGoal, newSubgoal, editSubgoal, openProgress };
})();

// ---------- Ansicht "Ziele" (Liste) ----------
const ZieleView = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);

  function daysLeft(iso) {
    const d = Math.round((S.parseDate(iso) - S.parseDate(S.isoDate(new Date()))) / 86400000);
    if (d < 0) return `${-d} Tage überfällig`;
    if (d === 0) return "heute fällig";
    return d === 1 ? "noch 1 Tag" : `noch ${d} Tage`;
  }

  function card(g, entries, cap) {
    const res = CPM.computeGoal(g, entries, new Date(), cap);
    const chip = res.cycle ? "" : {
      hinterher: '<span class="badge badge--crit">hängt hinterher</span>',
      kritisch: '<span class="badge badge--crit">kritisch</span>',
      knapp: '<span class="badge badge--warn">eng</span>',
      ok: '<span class="badge badge--ok">im Plan</span>',
    }[res.status] || "";
    const p = GoalMath.progress(g);
    const subs = g.subgoals || [];
    const doneCount = subs.filter((x) => x.done).length;
    const rest = GoalMath.remainingHours(g);
    const overdue = g.deadline && g.deadline < S.isoDate(new Date());
    return `
      <a class="goal-card" href="#ziel/${encodeURIComponent(g.id)}" style="--c:${g.color}">
        <span class="goal-card__head">
          <span class="goal-card__title">${esc(g.title)} ${chip}</span>
          <span class="goal-card__pct">${p} %</span>
        </span>
        <span class="progress"><span style="width:${p}%"></span></span>
        <span class="goal-card__meta">
          <span class="${overdue ? "meta--warn" : ""}">${esc(S.deadlineLabel(g.deadline))} · ${daysLeft(g.deadline)}</span>
          <span>${subs.length ? `${doneCount}/${subs.length} Unterziele` : "noch keine Unterziele"}</span>
          ${rest > 0 ? `<span>noch ca. ${GoalMath.fmtHours(rest)}</span>` : ""}
        </span>
      </a>`;
  }

  async function render(container) {
    const entries = await Store.list();
    const cap = CPM.averageCapacity(entries);
    const goals = entries.filter((e) => e.type === Model.TYPES.ZIEL)
      .filter((g) => !g.done)
      .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)) || b.priority - a.priority);

    container.innerHTML = `
      ${goals.length === 0 ? `
        <section class="empty">
          <p class="empty__title">Noch keine Ziele</p>
          <p class="empty__text">Ein Ziel ist ein größeres Vorhaben mit Deadline, z. B. eine Uni-Abgabe. Du teilst es in Unterziele auf und trägst deinen Fortschritt ein.</p>
        </section>` : `<div class="goal-list">${goals.map((g) => card(g, entries, cap)).join("")}</div>`}
      <button class="add-row" data-add><span class="add-row__plus">+</span> Neues Ziel</button>`;
    container.querySelector("[data-add]").addEventListener("click", Goals.newGoal);
  }

  return { render, leave() {}, daysLeft };
})();

// ---------- Detailseite eines Ziels ----------
const ZielDetailView = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);

  // Kennzeichnung kommt aus GoalMath (wird auch im Unterziel-Formular gebraucht)
  const pct = GoalMath.pct;
  const levelBadges = GoalMath.levelBadges;

  // "Heute"/"Morgen" mitten im Satz klein schreiben
  const inline = (lbl) => (lbl === "Heute" || lbl === "Morgen" ? lbl.toLowerCase() : lbl);

  function subRow(goal, sg, i, byId, res) {
    const n = res && !res.cycle ? res.nodes[sg.id] : null;
    const rest = sg.mode !== "dauer" ? Model.restzeitStunden(sg) : null;
    const overdue = !sg.done && sg.deadline && sg.deadline < S.isoDate(new Date());
    const waits = (sg.dependencies || []).map((d) => byId[d.fromId]).filter(Boolean).map((x) => x.title);
    const meta = [
      sg.done ? `<span>erledigt</span>` : `<span>${sg.progressPercent} %</span>`,
      !sg.done && rest != null ? `<span>noch ca. ${GoalMath.fmtHours(rest)}</span>` : "",
      sg.mode === "dauer" ? `<span>${String(sg.durationDays).replace(".", ",")} Tage Dauer</span>` : "",
      GoalMath.workedHours(sg) ? `<span>${GoalMath.fmtHours(GoalMath.workedHours(sg))} gearbeitet</span>` : "",
      sg.deadline ? `<span class="${overdue ? "meta--warn" : ""}">${overdue ? "" : "bis "}${esc(S.deadlineLabel(sg.deadline))}</span>` : "",
      waits.length ? `<span>wartet auf: ${esc(waits.join(", "))}</span>` : "",
      n && !sg.done ? `<span>fertig frühestens ${esc(inline(S.deadlineLabel(n.endDate)))}</span>` : "",
      n && !sg.done ? (n.behind
        ? `<span class="meta--warn">${GoalMath.fmtDays(-n.TF)} zu spät</span>`
        : `<span>Puffer ${GoalMath.fmtDays(n.TF)}</span>`) : "",
      n && !sg.done && n.neededHours > 0 && n.level ? `<span class="${n.level === "kritisch" ? "meta--warn" : ""}">${pct(n.utilization)} der freien Zeit</span>` : "",
    ].filter(Boolean).join("");
    const badge = levelBadges(n);
    return `
      <li class="task ${sg.done ? "task--done" : ""}" style="--c:${goal.color}">
        <button class="task__check" data-progress="${esc(sg.id)}" aria-label="${esc(sg.title)}: Fortschritt eintragen"></button>
        <button class="task__body" data-sub="${esc(sg.id)}">
          <span class="task__title"><span class="sub-num">${i + 1}.</span> ${esc(sg.title)} ${badge}</span>
          ${sg.done ? "" : `<span class="progress progress--small"><span style="width:${sg.progressPercent}%"></span></span>`}
          <span class="task__meta">${meta}</span>
        </button>
      </li>`;
  }

  // Einschätzung: "gut im Plan" / "knapp" / "hängt hinterher" + Tipps
  function adviceHtml(goal, res, entries) {
    if (res.cycle) return `<div class="advice advice--crit">Die Abhängigkeiten bilden einen Kreis. Bitte prüfe die Unterziele.</div>`;
    const capTxt = GoalMath.fmtHours(res.cap);
    const end = esc(inline(S.deadlineLabel(res.projectEndDate)));
    if (res.status === "ok") {
      return `<div class="advice advice--ok"><b>Du bist gut im Plan – weiter so!</b>
        Mit Ø ${capTxt} freier Zeit pro Tag bist du voraussichtlich ${end} fertig. Puffer: ca. ${GoalMath.fmtDays(res.slack)}.
        <small class="advice__calc">${GoalMath.fmtHours(res.neededHours)} Arbeit übrig · ${GoalMath.fmtHours(res.availableHours)} frei bis zur Deadline</small></div>`;
    }
    const calc = `<small class="advice__calc">${GoalMath.fmtHours(res.neededHours)} Arbeit übrig · ${GoalMath.fmtHours(res.availableHours)} frei bis zur Deadline · ${pct(res.utilization)} verplant</small>`;
    // Welche Unterziele sind eng/kritisch? (z. B. wegen einer Zwischen-Deadline)
    const tight = (lvl) => (goal.subgoals || [])
      .filter((x) => res.nodes[x.id] && res.nodes[x.id].level === lvl)
      .map((x) => `„${esc(x.title)}“ (${pct(res.nodes[x.id].utilization)} bis ${esc(inline(S.deadlineLabel(res.nodes[x.id].latestEnd)))})`);
    if (res.status === "knapp") {
      const which = tight("eng");
      return `<div class="advice advice--warn"><b>Es wird eng.</b>
        ${res.utilization >= 0.5
          ? "Mehr als die Hälfte deiner freien Zeit bis zur Deadline geht dafür drauf – bleib am Hauptpfad dran."
          : `Eng wird es bei ${which.join(", ")} – dafür brauchst du einen großen Teil deiner freien Zeit.`}
        Voraussichtlich fertig ${end}.
        ${calc}</div>`;
    }
    if (res.status === "kritisch") {
      const lowK = CPM.lowPriorityUntil(entries, goal.deadline).slice(0, 4);
      const which = tight("kritisch");
      return `<div class="advice advice--crit"><b>Es wird kritisch.</b>
        ${res.utilization >= 0.8 ? "Fast deine ganze freie Zeit bis zur Deadline ist dafür nötig." : `Kritisch: ${which.join(", ")}.`}
        Plane feste Arbeitsblöcke ein${lowK.length ? " oder lass etwas mit niedriger Priorität ausfallen:" : "."}
        ${calc}
        ${lowK.length ? `<ul class="advice__list">${lowK.map((e) => `<li><button class="link-btn" data-open="${esc(e.id)}" data-date="${esc(e.date)}">${esc(e.title)}</button> · ${esc(S.deadlineLabel(e.date))}${e.hours ? ` · ${GoalMath.fmtHours(e.hours)}` : ""}</li>`).join("")}</ul>` : ""}
      </div>`;
    }
    const late = Math.max(-res.slack, 0);
    const low = CPM.lowPriorityUntil(entries, goal.deadline).slice(0, 4);
    return `<div class="advice advice--crit"><b>Du hängst hinterher.</b>
      ${late > 0.05 ? `Mit Ø ${capTxt} freier Zeit pro Tag wirst du ca. ${GoalMath.fmtDays(late)} zu spät fertig.` : "Die Deadline ist erreicht oder überschritten."}
      Investier mehr Zeit${low.length ? " oder lass etwas mit niedriger Priorität ausfallen:" : "."}
      <small class="advice__calc">${GoalMath.fmtHours(res.neededHours)} Arbeit übrig · nur ${GoalMath.fmtHours(res.availableHours)} frei bis zur Deadline</small>
      ${low.length ? `<ul class="advice__list">${low.map((e) => `<li><button class="link-btn" data-open="${esc(e.id)}" data-date="${esc(e.date)}">${esc(e.title)}</button> · ${esc(S.deadlineLabel(e.date))}${e.hours ? ` · ${GoalMath.fmtHours(e.hours)}` : ""}</li>`).join("")}</ul>` : ""}
    </div>`;
  }

  async function render(container, { param, setTitle }) {
    const goal = param && await Store.get(param);
    if (!goal || goal.type !== Model.TYPES.ZIEL) {
      container.innerHTML = `<section class="empty"><p class="empty__title">Ziel nicht gefunden</p><p class="empty__text"><a href="#ziele">Zurück zu den Zielen</a></p></section>`;
      return;
    }
    setTitle("Ziel");
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    const byId = Object.fromEntries(subs.map((x) => [x.id, x]));
    const p = GoalMath.progress(goal);
    const rest = GoalMath.remainingHours(goal);
    const allDone = subs.length > 0 && subs.every((x) => x.done);
    const entries = await Store.list();
    const res = subs.length ? CPM.computeGoal(goal, entries) : null;

    container.innerHTML = `
      <a class="back-link" href="#ziele">‹ Ziele</a>
      <section class="goal-head" style="--c:${goal.color}">
        <div class="goal-head__top">
          <h2>${esc(goal.title)}</h2>
          <button class="link-btn" data-edit-goal>Bearbeiten</button>
        </div>
        ${goal.notes ? `<p class="goal-head__notes">${esc(goal.notes)}</p>` : ""}
        <div class="goal-head__stats">
          <span><b>${p} %</b> geschafft</span>
          <span><b>${rest > 0 ? GoalMath.fmtHours(rest) : "–"}</b> Arbeit übrig</span>
          <span><b>${esc(S.deadlineLabel(goal.deadline))}</b> ${ZieleView.daysLeft(goal.deadline)}</span>
        </div>
        <span class="progress"><span style="width:${p}%"></span></span>
      </section>
      ${allDone && !goal.done ? `<button class="banner-btn" data-finish>Alle Unterziele erledigt · Ziel abschließen</button>` : ""}
      ${res && !allDone ? adviceHtml(goal, res, entries) : ""}
      <h3 class="list-group">Unterziele <span>${subs.length}</span></h3>
      ${subs.length ? `<ul class="task-list">${subs.map((sg, i) => subRow(goal, sg, i, byId, res)).join("")}</ul>` : `
        <p class="plan-hint">Teile dein Ziel in Schritte auf, z. B. Grundriss, Lageplan, Details. Schätze für jeden den Aufwand.</p>`}
      <button class="add-row" data-add><span class="add-row__plus">+</span> Unterziel</button>
      <p class="plan-hint plan-hint--small">Kreis antippen = Fortschritt eintragen · Zeile antippen = bearbeiten</p>`;

    container.querySelector("[data-edit-goal]").addEventListener("click", () => Goals.editGoal(goal.id));
    container.querySelector("[data-add]").addEventListener("click", () => Goals.newSubgoal(goal.id));
    container.querySelectorAll("[data-progress]").forEach((b) => b.addEventListener("click", () => Goals.openProgress(goal.id, b.dataset.progress)));
    container.querySelectorAll("[data-sub]").forEach((b) => b.addEventListener("click", () => Goals.editSubgoal(goal.id, b.dataset.sub)));
    container.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => Editor.edit(b.dataset.open, b.dataset.date)));
    const fin = container.querySelector("[data-finish]");
    if (fin) fin.addEventListener("click", async () => { await Tasks.toggleDone(goal.id); location.hash = "#ziele"; });
  }

  return { render, leave() {} };
})();
