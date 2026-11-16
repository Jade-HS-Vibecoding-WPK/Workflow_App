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

  const workedHours = (sg) => round1((sg.log || []).reduce((s, e) => s + (e.hours || 0), 0));
  const round1 = (n) => Math.round(n * 10) / 10;
  const fmtHours = (h) => String(round1(h)).replace(".", ",") + " Std.";

  return { progress, remainingHours, workedHours, fmtHours, round1 };
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
  function subgoalForm(goal, sg, isNew) {
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
      </div>`,
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
    if (sg) subgoalForm(goal, sg, false);
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

  function card(g) {
    const p = GoalMath.progress(g);
    const subs = g.subgoals || [];
    const doneCount = subs.filter((x) => x.done).length;
    const rest = GoalMath.remainingHours(g);
    const overdue = g.deadline && g.deadline < S.isoDate(new Date());
    return `
      <a class="goal-card" href="#ziel/${encodeURIComponent(g.id)}" style="--c:${g.color}">
        <span class="goal-card__head">
          <span class="goal-card__title">${esc(g.title)}</span>
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
    const goals = (await Store.list(Model.TYPES.ZIEL))
      .filter((g) => !g.done)
      .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)) || b.priority - a.priority);

    container.innerHTML = `
      ${goals.length === 0 ? `
        <section class="empty">
          <p class="empty__title">Noch keine Ziele</p>
          <p class="empty__text">Ein Ziel ist ein größeres Vorhaben mit Deadline, z. B. eine Uni-Abgabe. Du teilst es in Unterziele auf und trägst deinen Fortschritt ein.</p>
        </section>` : `<div class="goal-list">${goals.map(card).join("")}</div>`}
      <button class="add-row" data-add><span class="add-row__plus">+</span> Neues Ziel</button>`;
    container.querySelector("[data-add]").addEventListener("click", Goals.newGoal);
  }

  return { render, leave() {}, daysLeft };
})();

// ---------- Detailseite eines Ziels ----------
const ZielDetailView = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);

  function subRow(goal, sg, i, byId) {
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
    ].filter(Boolean).join("");
    return `
      <li class="task ${sg.done ? "task--done" : ""}" style="--c:${goal.color}">
        <button class="task__check" data-progress="${esc(sg.id)}" aria-label="${esc(sg.title)}: Fortschritt eintragen"></button>
        <button class="task__body" data-sub="${esc(sg.id)}">
          <span class="task__title"><span class="sub-num">${i + 1}.</span> ${esc(sg.title)}</span>
          ${sg.done ? "" : `<span class="progress progress--small"><span style="width:${sg.progressPercent}%"></span></span>`}
          <span class="task__meta">${meta}</span>
        </button>
      </li>`;
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
      <h3 class="list-group">Unterziele <span>${subs.length}</span></h3>
      ${subs.length ? `<ul class="task-list">${subs.map((sg, i) => subRow(goal, sg, i, byId)).join("")}</ul>` : `
        <p class="plan-hint">Teile dein Ziel in Schritte auf, z. B. Grundriss, Lageplan, Details. Schätze für jeden den Aufwand.</p>`}
      <button class="add-row" data-add><span class="add-row__plus">+</span> Unterziel</button>
      <p class="plan-hint plan-hint--small">Kreis antippen = Fortschritt eintragen · Zeile antippen = bearbeiten</p>`;

    container.querySelector("[data-edit-goal]").addEventListener("click", () => Goals.editGoal(goal.id));
    container.querySelector("[data-add]").addEventListener("click", () => Goals.newSubgoal(goal.id));
    container.querySelectorAll("[data-progress]").forEach((b) => b.addEventListener("click", () => Goals.openProgress(goal.id, b.dataset.progress)));
    container.querySelectorAll("[data-sub]").forEach((b) => b.addEventListener("click", () => Goals.editSubgoal(goal.id, b.dataset.sub)));
    const fin = container.querySelector("[data-finish]");
    if (fin) fin.addEventListener("click", async () => { await Tasks.toggleDone(goal.id); location.hash = "#ziele"; });
  }

  return { render, leave() {} };
})();
