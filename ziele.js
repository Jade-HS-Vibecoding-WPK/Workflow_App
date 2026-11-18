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

  // Angezeigter Puffer eines Unterziels: nie mehr als der Puffer des ganzen Ziels
  // (der berücksichtigt, dass du allein arbeitest) – sonst stehen zwei
  // verschiedene Zahlen auf einer Seite (Testrunde 3). Die DIN-Werte bleiben klassisch.
  const shownTF = (n, res) => (res && !res.bau && res.slack >= 0 ? Math.min(n.TF, res.slack) : n.TF);

  return { progress, remainingHours, workedHours, fmtHours, fmtDays, round1, pct, levelBadges, shownTF };
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
  const isBauGoal = (goal) => (goal.area ? goal.area === "bau" : Store.getArea() === "bau");

  function goalForm(goal, isNew) {
    const bau = isBauGoal(goal);
    const colors = Editor.TASK_COLORS.map((c) => `
      <label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}" ${goal.color === c ? "checked" : ""} aria-label="Farbe ${c}"><span></span></label>`).join("");

    Editor.show(formShell(isNew ? (bau ? "Neues Projekt" : "Neues Ziel") : (bau ? "Projekt bearbeiten" : "Ziel bearbeiten"), goal.color, `
      <div class="form-group">
        <input class="title-input" name="title" placeholder="${bau ? "Titel, z. B. Einfamilienhaus Musterweg 1" : "Titel, z. B. Architektur-Abgabe"}" value="${esc(goal.title)}" autocomplete="off" ${isNew ? "autofocus" : ""}>
        <textarea name="notes" rows="2" placeholder="Notiz (optional)">${esc(goal.notes)}</textarea>
      </div>
      <div class="form-group">
        ${bau ? `<label class="row"><span>Baubeginn</span><input type="date" name="startDate" value="${esc(goal.startDate || "")}"></label>` : ""}
        <label class="row"><span>${bau ? "Fertigstellung bis" : "Deadline"}</span><input type="date" name="deadline" value="${esc(goal.deadline || "")}"></label>
        ${bau ? `<label class="row"><span>Samstag ist Arbeitstag <small class="muted">sonst Mo–Fr</small></span><input type="checkbox" class="switch" name="samstag" ${goal.samstag ? "checked" : ""}></label>
        <p class="hint">Feiertage und die Winterpause (Einstellungen) sind frei. Ohne Baubeginn rechnet die App ab heute.</p>` : ""}
      </div>
      <div class="form-group">
        <div class="row row--stack">
          <span>Priorität <small class="muted">1 = kann warten · 5 = sehr wichtig</small></span>
          <div class="segmented">${prioHtml(goal.priority)}</div>
        </div>
        <div class="row row--stack"><span>Farbe</span><div class="swatches">${colors}</div></div>
      </div>
      ${isNew ? `<p class="hint hint--plain">${bau ? "Vorgänge (z. B. Erdarbeiten, Rohbau, Estrich) legst du im nächsten Schritt an – oder nimm eine Vorlage." : "Unterziele (z. B. Grundriss, Lageplan, Details) legst du im nächsten Schritt an."}</p>` : ""}`,
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
      if (form.elements.startDate) out.startDate = form.elements.startDate.value || null;
      if (form.elements.samstag) out.samstag = form.elements.samstag.checked;
      out.priority = Number((form.querySelector('[name="priority"]:checked') || {}).value || 3);
      out.color = (form.querySelector('[name="color"]:checked') || {}).value || goal.color;
      if (!out.title) return fail("Bitte gib einen Titel ein.", "title");
      if (!out.deadline) return fail(bau ? "Ein Projekt braucht einen Fertigstellungstermin." : "Ein Ziel braucht eine Deadline.", "deadline");
      if (out.startDate && out.startDate > out.deadline) return fail("Der Baubeginn liegt nach der Fertigstellung.", "startDate");
      const late = (out.subgoals || []).find((sg) => sg.deadline && sg.deadline > out.deadline);
      if (late) return fail(`Das Unterziel „${late.title}“ hat eine spätere Zwischen-Deadline.`, "deadline");
      await Store.save(out);
      Editor.close();
      if (isNew) location.hash = "#ziel/" + encodeURIComponent(out.id);
    }, {
      delete: async () => {
        if (!confirm(`„${goal.title}“ mit allen Unterzielen löschen?`)) return;
        const orig = await Store.get(goal.id); // für "Rückgängig"
        await Store.remove(goal.id);
        Editor.close();
        location.hash = "#ziele";
        if (orig) Toast.show(`„${orig.title}“ gelöscht`, async () => {
          await Store.save(orig);
          location.hash = "#ziel/" + encodeURIComponent(orig.id);
        });
      },
      finish: async () => {
        Editor.close();
        await Tasks.toggleDone(goal.id);
      },
    });
  }

  // Neues Ziel gehört zum aktiven Bereich (Baustelle → Projekt-Formular mit Baubeginn)
  const newGoal = () => goalForm(Model.neuesZiel({ area: Store.getArea() }), true);

  async function editGoal(goalId) {
    const goal = await Store.get(goalId);
    if (goal) goalForm(goal, false);
  }

  // ===== Unterziel anlegen / bearbeiten =====
  const DEP_LABELS = {
    // Anordnungsbeziehungen nach DIN 69900
    "ende-anfang": "NF Normalfolge: Ende → Anfang (erst fertig, dann starten)",
    "anfang-anfang": "AF Anfangsfolge: Anfang → Anfang (zusammen starten)",
    "ende-ende": "EF Endfolge: Ende → Ende (zusammen fertig)",
    "anfang-ende": "SF Sprungfolge: Anfang → Ende (Start des einen erlaubt Ende des anderen)",
  };

  function depsHtml(goal, sg, subs) {
    const bau = CPM.cfg.bau || isBauGoal(goal);
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
              <select name="depType-${esc(x.id)}" aria-label="Anordnungsbeziehung">
                ${Object.entries(DEP_LABELS).map(([v, l]) => `<option value="${v}" ${(d ? d.type : "ende-anfang") === v ? "selected" : ""}>${l}</option>`).join("")}
              </select>
              <span class="unit-input">Zeitabstand <input type="number" name="depLag-${esc(x.id)}" step="1" inputmode="numeric" value="${d ? d.lagDays || 0 : 0}"> Kal.-Tage</span>
            </div>` : ""}
        </div>`;
    }).join("");
    return `
      <div class="form-group">
        <div class="row row--stack">
          <span>${bau ? "Vorgänger · Anordnungsbeziehung (DIN 69900)" : "Startet erst, wenn fertig ist:"}</span>
          <div class="dep-list">${rows}</div>
        </div>
        <p class="hint">${bau
          ? (isBauGoal(goal) ? "Haken = dieser Vorgang hängt vom anderen ab. Meist NF (erst fertig, dann starten). Zeitabstand in Kalendertagen – läuft auch am Wochenende (z. B. Estrich trocknen +28). Negativ = Überlappung (z. B. −2 = 2 Tage früher anfangen)." : "Baumanagement-Modus: Anordnungsbeziehung (NF/AF/EF/SF) und Zeitabstand wählbar. Negativ = Überlappung (z. B. −2 = darf 2 Tage früher starten).")
          : "Für den kritischen Pfad. Weitere Arten und Wartezeiten gibt es im Baumanagement-Modus (Einstellungen)."}</p>
      </div>`;
  }

  function cpmHtml(res, sg) {
    if (!res || res.cycle || !res.nodes[sg.id] || sg.done) return "";
    const n = res.nodes[sg.id];
    const d = (iso) => esc(S.parseDate(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }));
    // Aufräumen D: Fachwerte eingeklappt, oben nur die Kurzfassung
    const short = res.bau ? `${d(n.startDate)} – ${d(n.endDate)}` : `frühestens fertig ${d(n.endDate)}, spätestens ${d(n.latestEnd)}`;
    return `
      <details class="more">
        <summary>Zeitplan-Details <small>${short}</small></summary>
      <div class="form-group">
        <div class="row row--stack">
          <span>Zeitplan ${GoalMath.levelBadges(n)}</span>
          <dl class="cpm-values">
            <dt>Dauer</dt><dd>${res.bau ? `${n.D} Arbeitstage` : GoalMath.fmtDays(n.D)}</dd>
            <dt>Frühester Anfang (FAZ)</dt><dd>${d(n.startDate)}</dd>
            <dt>Frühestes Ende (FEZ)</dt><dd>${d(n.endDate)}</dd>
            <dt>Spätester Anfang (SAZ)</dt><dd>${d(n.latestStart)}</dd>
            <dt>Spätestes Ende (SEZ)</dt><dd>${d(n.latestEnd)}</dd>
            <dt>Gesamtpuffer (GP)</dt><dd class="${n.TF < -0.05 ? "meta--warn" : ""}">${n.TF < -0.05 ? "−" : ""}${res.bau ? `${Math.abs(n.TF)} Arbeitstage` : GoalMath.fmtDays(n.TF)}</dd>
            ${res.bau ? "" : `<dt>Auslastung</dt><dd class="${n.level === "kritisch" ? "meta--warn" : ""}">${n.neededHours > 0 ? `${GoalMath.pct(n.utilization)} (${GoalMath.fmtHours(n.neededHours)} von ${GoalMath.fmtHours(n.availableHours)} frei)` : "–"}</dd>`}
            <dt>Freier Puffer (FP)</dt><dd>${n.FF < -0.05 ? "−" : ""}${res.bau ? `${Math.abs(n.FF)} Arbeitstage` : GoalMath.fmtDays(n.FF)}</dd>
          </dl>
        </div>
        <p class="hint">${res.bau ? "Baustelle nach DIN 69900: Dauer und Puffer in Arbeitstagen (Mo–Fr, ohne Feiertage), Zeitabstände in Kalendertagen. Kritischer Weg = längster Weg vom Baubeginn bis zum Projektende (kleinste Gesamtpufferzeit); „eng“ = höchstens 3 Arbeitstage mehr Puffer. Weil Wartezeiten in Kalendertagen laufen, kann der Puffer entlang des kritischen Wegs um ein paar Arbeitstage schwanken (Wochenenden)." : `Auslastung = nötige Stunden (dieses Unterziel und alles davor) ÷ freie Zeit bis zum spätesten Ende. Ab 50 % „eng“, ab 80 % „kritisch“. Gerechnet mit Ø ${GoalMath.fmtHours(res.cap)} freier Zeit pro Tag.`}</p>
      </div>
      </details>`;
  }

  // Häufige Gewerke als Vorschlagsliste (frei eintippbar)
  // Gewerke nach VOB/C (ATV DIN 18299 ff.) – frei eintippbar, die Liste ist nur ein Vorschlag
  const GEWERKE = [
    "Bauleitung", "Baustelleneinrichtung", "Erdarbeiten (DIN 18300)", "Landschaftsbauarbeiten (DIN 18320)",
    "Mauerarbeiten (DIN 18330)", "Betonarbeiten (DIN 18331)", "Zimmer- und Holzbauarbeiten (DIN 18334)",
    "Dachdeckungsarbeiten (DIN 18338)", "Klempnerarbeiten (DIN 18339)", "Trockenbauarbeiten (DIN 18340)",
    "Wärmedämm-Verbundsysteme (DIN 18345)", "Putz- und Stuckarbeiten (DIN 18350)", "Fliesen- und Plattenarbeiten (DIN 18352)",
    "Estricharbeiten (DIN 18353)", "Tischlerarbeiten (DIN 18355)", "Metallbauarbeiten (DIN 18360)",
    "Maler- und Lackierarbeiten (DIN 18363)", "Bodenbelagarbeiten (DIN 18365)", "Heizanlagen (DIN 18380)",
    "Gas-, Wasser- und Entwässerungsanlagen (DIN 18381)", "Elektroanlagen (DIN 18382)", "Gerüstarbeiten (DIN 18451)",
  ];

  function subgoalForm(goal, sg, isNew, res = null) {
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    const idx = subs.findIndex((x) => x.id === sg.id);
    const bau = isBauGoal(goal);
    if (bau) sg = { ...sg, mode: "dauer" };
    const gewerk = sg.assignee && sg.assignee !== Model.OWNER_LOCAL ? sg.assignee : "";

    Editor.show(formShell(isNew ? (bau ? "Neuer Vorgang" : "Neues Unterziel") : (bau ? "Vorgang" : "Unterziel"), goal.color, `
      <p class="sheet__context">${bau ? "Projekt" : "Ziel"}: ${esc(goal.title)}</p>
      <div class="form-group">
        <input class="title-input" name="title" placeholder="${bau ? "Titel, z. B. Estrich" : "Titel, z. B. Grundriss"}" value="${esc(sg.title)}" autocomplete="off" ${isNew ? "autofocus" : ""}>
        ${bau ? `<input name="gewerk" list="gewerke" placeholder="Gewerk, z. B. Estrichleger" value="${esc(gewerk)}" autocomplete="off">
        <datalist id="gewerke">${GEWERKE.map((g) => `<option value="${esc(g)}">`).join("")}</datalist>` : ""}
      </div>
      <div class="form-group" ${bau ? "hidden" : ""}>
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
      ${bau ? `
      <div class="form-group">
        <label class="row"><span>Meilenstein <small class="muted">Ereignis ohne Dauer, z. B. Richtfest, Abnahme</small></span>
          <input type="checkbox" class="switch" name="milestone" ${isNew ? "" : Number(sg.durationDays) === 0 ? "checked" : ""}></label>
        <label class="row" data-ms-hide><span>Dauer</span>
          <span class="unit-input"><input type="number" name="workdays" min="1" step="1" inputmode="numeric" value="${Math.max(1, Math.round(sg.durationDays) || 1)}"> Arbeitstage</span>
        </label>
        <p class="hint" data-ms-hide>${goal.samstag ? "Mo–Sa" : "Mo–Fr"}, Feiertage zählen nicht.</p>
        <label class="row" data-ms-hide><span>Arbeitszeit von <small class="muted">leer = Standard ${esc(Schedule.bauZeit.von)}</small></span><input type="time" name="workFrom" value="${esc(sg.workFrom || "")}"></label>
        <label class="row" data-ms-hide><span>Arbeitszeit bis <small class="muted">leer = Standard ${esc(Schedule.bauZeit.bis)}</small></span><input type="time" name="workTo" value="${esc(sg.workTo || "")}"></label>
      </div>` : ""}
      <div class="form-group">
        <label class="row"><span>Zwischen-Deadline</span><input type="date" name="deadline" value="${esc(sg.deadline || "")}" max="${esc(goal.deadline || "")}"></label>
        <p class="hint">Optional. Spätestens die ${bau ? "Fertigstellung des Projekts" : "Deadline des Ziels"} (${esc(S.deadlineLabel(goal.deadline))}).</p>
      </div>
      ${depsHtml(goal, sg, subs)}
      ${cpmHtml(res, sg)}`,
      isNew ? "" : `
        <button type="button" class="action" data-action="progress">Fortschritt eintragen</button>
        ${idx > 0 ? `<button type="button" class="action" data-action="up">In der Reihenfolge nach oben</button>` : ""}
        ${idx < subs.length - 1 ? `<button type="button" class="action" data-action="down">In der Reihenfolge nach unten</button>` : ""}
        <button type="button" class="action action--danger" data-action="delete">${bau ? "Vorgang" : "Unterziel"} löschen</button>`));

    const form = Editor.sheetForm();
    const update = () => {
      const mode = form.querySelector('[name="mode"]:checked').value;
      if (!bau) form.querySelectorAll("[data-show]").forEach((el) => { el.hidden = el.dataset.show !== mode; });
      if (bau) { const ms = form.elements.milestone.checked; form.querySelectorAll("[data-ms-hide]").forEach((el) => { el.hidden = ms; }); }
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
      if (bau) {
        out.mode = "dauer";
        const ms = form.elements.milestone.checked; // Meilenstein = Dauer 0 (DIN 69900: Ereignis)
        out.durationDays = ms ? 0 : Math.round(Number(form.elements.workdays.value));
        out.assignee = form.elements.gewerk.value.trim() || Model.OWNER_LOCAL;
        out.workFrom = form.elements.workFrom.value || null;
        out.workTo = form.elements.workTo.value || null;
        const wf = out.workFrom || Schedule.bauZeit.von, wt = out.workTo || Schedule.bauZeit.bis;
        if (Schedule.toMin(wt) <= Schedule.toMin(wf)) return fail("Das Ende der Arbeitszeit muss nach dem Beginn liegen.", "workTo");
        if (!ms && !(out.durationDays >= 1)) return fail("Gib mindestens 1 Arbeitstag ein.", "workdays");
      }
      out.deadline = form.elements.deadline.value || null;
      if (!out.title) return fail("Bitte gib einen Titel ein.", "title");
      if (out.mode === "aufwand" && !(out.estimateHours > 0)) return fail("Gib einen Aufwand größer als 0 ein.", "estimateHours");
      if (out.mode === "dauer" && !(out.durationDays > 0) && !(bau && out.durationDays === 0)) return fail("Gib eine Dauer größer als 0 ein.", "durationDays");
      if (out.deadline && goal.deadline && out.deadline > goal.deadline) return fail("Die Zwischen-Deadline liegt nach der Deadline des Ziels.", "deadline");
      // Abhängigkeiten auslesen (nur IDs, siehe CLAUDE.md)
      const fullDeps = CPM.cfg.bau || bau;
      const old = Object.fromEntries((sg.dependencies || []).map((d) => [d.fromId, d]));
      out.dependencies = [...form.querySelectorAll('[name="dep"]:checked')].map((cb) => {
        const id = cb.value;
        const typeEl = form.elements["depType-" + id];
        const lagEl = form.elements["depLag-" + id];
        return {
          fromId: id,
          type: fullDeps && typeEl ? typeEl.value : (old[id] ? old[id].type : "ende-anfang"),
          lagDays: fullDeps && lagEl ? (Number(lagEl.value) || 0) : (old[id] ? old[id].lagDays || 0 : 0),
        };
      });
      const list = isNew ? [...goal.subgoals, out] : goal.subgoals.map((x) => (x.id === out.id ? out : x));
      await saveGoal(list);
      Editor.close();
    }, {
      progress: () => progressForm(goal, sg),
      delete: async () => {
        if (!confirm(`${bau ? "Vorgang" : "Unterziel"} „${sg.title}“ löschen?`)) return;
        const orig = await Store.get(goal.id); // für "Rückgängig" (inkl. Abhängigkeiten)
        // Abhängigkeiten anderer Unterziele auf dieses Unterziel mit entfernen
        const list = goal.subgoals
          .filter((x) => x.id !== sg.id)
          .map((x) => ({ ...x, dependencies: (x.dependencies || []).filter((d) => d.fromId !== sg.id) }));
        await saveGoal(list);
        Editor.close();
        if (orig) Toast.show(`${bau ? "Vorgang" : "Unterziel"} „${sg.title}“ gelöscht`, () => Store.save(orig));
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
    subgoalForm(goal, Model.neuesUnterziel(isBauGoal(goal) ? { order, mode: "dauer", durationDays: 5 } : { order, estimateHours: 4 }), true);
  }

  async function editSubgoal(goalId, sgId) {
    const goal = await Store.get(goalId);
    const sg = goal && goal.subgoals.find((x) => x.id === sgId);
    if (!sg) return;
    const res = CPM.computeGoal(goal, await Store.list());
    subgoalForm(goal, sg, false, res);
  }

  // ===== Fortschritt eintragen: "Wie lange gearbeitet? Wie viel % geschafft?" =====
  // hoursHint: Länge des Blocks, von dem man kommt (Testrunde 3) – vorausgefüllt, änderbar
  function progressForm(goal, sg, hoursHint = null) {
    const worked = GoalMath.workedHours(sg);
    const isAufwand = sg.mode !== "dauer";

    Editor.show(formShell("Fortschritt", goal.color, `
      <p class="sheet__context">${esc(sg.title)} · ${esc(goal.title)}</p>
      <p class="notice">Bisher: ${GoalMath.fmtHours(worked)} gearbeitet · ${sg.progressPercent} % geschafft${isAufwand ? ` · Schätzung ${GoalMath.fmtHours(sg.estimateHours)}` : ` · Dauer ${String(sg.durationDays).replace(".", ",")} Tage`}</p>
      <div class="form-group">
        <label class="row"><span>Heute gearbeitet</span>
          <span class="unit-input"><input type="number" name="hours" min="0" step="0.25" inputmode="decimal" value="${hoursHint ? GoalMath.round1(hoursHint) : ""}" placeholder="0" autofocus> Std.</span>
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
        // Fertig → noch kommende Blöcke freigeben
        ...(done ? { slots: Tasks.dropUpcoming(sg.slots) } : {}),
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

  async function openProgress(goalId, sgId, hoursHint = null) {
    const goal = await Store.get(goalId);
    const sg = goal && goal.subgoals.find((x) => x.id === sgId);
    if (sg) progressForm(goal, sg, hoursHint);
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
    const bau = g.area === "bau";
    const rest = bau ? 0 : GoalMath.remainingHours(g);
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
          <span>${subs.length ? `${doneCount}/${subs.length} ${bau ? "Vorgänge" : "Unterziele"}` : bau ? "noch keine Vorgänge" : "noch keine Unterziele"}</span>
          ${bau && !res.cycle && subs.length ? `<span>fertig voraussichtlich ${esc(S.deadlineLabel(res.projectEndDate))}</span>` : ""}
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
    const bau = Store.getArea() === "bau";

    container.innerHTML = `
      ${goals.length === 0 ? `
        <section class="empty">
          <p class="empty__title">${bau ? "Noch keine Projekte" : "Noch keine Ziele"}</p>
          <p class="empty__text">${bau
            ? "Ein Projekt ist eine Baustelle mit Fertigstellungstermin. Du teilst es in Vorgänge mit Gewerken auf – die App rechnet den kritischen Pfad in Arbeitstagen."
            : "Ein Ziel ist ein größeres Vorhaben mit Deadline, z. B. eine Uni-Abgabe. Du teilst es in Unterziele auf und trägst deinen Fortschritt ein."}</p>
        </section>` : `<div class="goal-list">${goals.map((g) => card(g, entries, cap)).join("")}</div>`}
      <button class="add-row" data-add><span class="add-row__plus">+</span> ${bau ? "Neues Projekt" : "Neues Ziel"}</button>
      <button class="add-row" data-template><span class="add-row__plus add-row__plus--alt">▤</span> Aus Vorlage …</button>`;
    container.querySelector("[data-add]").addEventListener("click", Goals.newGoal);
    container.querySelector("[data-template]").addEventListener("click", () => Templates.choose());
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
    const bau = goal.area === "bau";
    const gewerk = bau && sg.assignee && sg.assignee !== Model.OWNER_LOCAL ? sg.assignee : "";
    const rest = sg.mode !== "dauer" ? Model.restzeitStunden(sg) : null;
    const overdue = !sg.done && sg.deadline && sg.deadline < S.isoDate(new Date());
    const waits = (sg.dependencies || []).map((d) => byId[d.fromId]).filter(Boolean).map((x) => x.title);
    // Aufräumen E: pro Zeile nur Fortschritt + EINE Statuszeile; Details beim Antippen
    const openPreds = (sg.dependencies || []).map((d) => byId[d.fromId]).filter((x) => x && !x.done).map((x) => x.title);
    const dShort = (iso) => esc(inline(S.deadlineLabel(iso)));
    let status = "";
    if (sg.done) status = "erledigt";
    else if (n && n.behind) status = `<span class="meta--warn">${GoalMath.fmtDays(-n.TF)} zu spät</span>`;
    else if (overdue) status = `<span class="meta--warn">überfällig (${esc(S.deadlineLabel(sg.deadline))})</span>`;
    else if (openPreds.length) status = `wartet auf ${esc(openPreds.length === 1 ? openPreds[0] : openPreds.length + " Schritte")}`;
    else if (bau && n) status = `${esc(S.parseDate(n.startDate).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }))}–${esc(S.parseDate(n.endDate).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }))}`;
    else if (n) status = `spätestens fertig ${dShort(n.latestEnd)}`;
    const meta = [
      sg.done ? "" : bau && Number(sg.durationDays) === 0 ? `<span>◆ Meilenstein${n ? " · " + esc(S.parseDate(n.startDate).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" })) : ""}</span>`
        : `<span>${sg.progressPercent} %${rest != null ? ` · noch ca. ${GoalMath.fmtHours(rest)}` : sg.mode === "dauer" ? ` · ${String(sg.durationDays).replace(".", ",")} ${bau ? "Arbeitstage" : "Tage"}` : ""}</span>`,
      gewerk ? `<span><b>${esc(gewerk)}</b></span>` : "",
      status ? `<span>${status}</span>` : "",
    ].filter(Boolean).join("");
    // In der Liste nur eng/kritisch – "Hauptpfad" steht im Netzplan/Balkenplan
    const badge = levelBadges(n).replace(/<span class="badge badge--main"[^>]*>Hauptpfad<\/span>/, "");
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
  // Baustelle: Einschätzung in Arbeitstagen und Kalendertagen
  function bauAdviceHtml(goal, res) {
    const end = esc(S.parseDate(res.projectEndDate).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }));
    const crit = (goal.subgoals || []).filter((x) => res.nodes[x.id] && res.nodes[x.id].critical && !x.done).sort((a, b) => res.nodes[a.id].ES - res.nodes[b.id].ES).map((x) => `„${esc(x.title)}“`);
    const tf = res.minTF;
    const days = (d) => `${Math.abs(d)} ${Math.abs(d) === 1 ? "Arbeitstag" : "Arbeitstage"}`;
    const calc = `<small class="advice__calc">Arbeitstage ${goal.samstag ? "Mo–Sa" : "Mo–Fr"}, Feiertage${S.bauZeit.pauseVon ? " und Winterpause" : ""} frei · Zeitabstände in Kalendertagen · nach DIN 69900</small>`;
    // Gewerke doppelt eingeplant (gleiches Gewerk, gleiche Zeit)
    const byId = Object.fromEntries((goal.subgoals || []).map((x) => [x.id, x]));
    const dd = (iso) => esc(S.parseDate(iso).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }));
    const clashes = (res.clashes || []).slice(0, 3).map((c) =>
      `<li><span class="advice__strong">${esc(c.gewerk)}</span>: „${esc(byId[c.a].title)}“ und „${esc(byId[c.b].title)}“ gleichzeitig (${dd(c.from)}${c.from !== c.to ? "–" + dd(c.to) : ""}, ${days(c.days)})</li>`).join("");
    const clashHtml = clashes ? `<div class="advice advice--warn"><b>Gewerk doppelt eingeplant</b><ul class="advice__list">${clashes}</ul>
      <small class="advice__calc">Geht das mit zwei Kolonnen? Sonst nacheinander legen (NF) oder Dauern anpassen.</small></div>` : "";
    if (res.status === "hinterher") {
      return `<div class="advice advice--crit"><b>Verzug: ca. ${days(tf)}.</b>
        So wird das Projekt erst ${end} fertig. Kritischer Weg: ${crit.slice(0, 4).join(" → ")}. Prüfe Dauern, Überlappungen (negativer Zeitabstand) oder mehr Kolonnen.
        ${calc}</div>${clashHtml}`;
    }
    const cls = res.status === "ok" ? "advice--ok" : res.status === "kritisch" ? "advice--crit" : "advice--warn";
    const head = res.status === "ok" ? "Im Plan." : res.status === "kritisch" ? "Kein Puffer mehr." : "Es wird eng.";
    return `<div class="advice ${cls}"><b>${head}</b>
      Voraussichtlich fertig ${end}, Puffer bis zur Fertigstellung ${days(tf)}.
      ${crit.length ? `Kritischer Weg: ${crit.slice(0, 5).join(" → ")}${crit.length > 5 ? " …" : ""}.` : ""}
      ${calc}</div>${clashHtml}`;
  }

  function adviceHtml(goal, res, entries) {
    if (res.cycle) return `<div class="advice advice--crit">Die Abhängigkeiten bilden einen Kreis. Bitte prüfe die Unterziele.</div>`;
    if (res.bau) return bauAdviceHtml(goal, res);
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
          ? "Mehr als die Hälfte deiner freien Zeit bis zur Deadline geht dafür drauf – bleib dran und nimm die Vorschläge an."
          : `Eng wird es bei ${which.join(", ")} – dafür brauchst du einen großen Teil deiner freien Zeit.`}
        Voraussichtlich fertig ${end}${end.endsWith(".") ? "" : "."}
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
    const bau = goal.area === "bau";
    setTitle(bau ? "Projekt" : "Ziel");
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    const byId = Object.fromEntries(subs.map((x) => [x.id, x]));
    const p = GoalMath.progress(goal);
    const rest = GoalMath.remainingHours(goal);
    const allDone = subs.length > 0 && subs.every((x) => x.done);
    const entries = await Store.list();
    const res = subs.length ? CPM.computeGoal(goal, entries) : null;
    const mode = ["netz", "balken"].includes((await Store.getSettings()).zielAnsicht) ? (await Store.getSettings()).zielAnsicht : "liste";

    // Scrollposition von Netzplan/Balkenplan merken, damit er nach einer
    // Änderung (z. B. Verbinden) nicht wieder ganz nach links springt
    const keep = container.dataset.goalId === goal.id
      ? [".nz-wrap", "[data-gantt]"].map((sel) => { const el = container.querySelector(sel); return el && { sel, x: el.scrollLeft, y: el.scrollTop }; }).filter(Boolean)
      : [];
    container.dataset.goalId = goal.id;

    container.innerHTML = `
      <a class="back-link" href="#ziele">‹ ${bau ? "Projekte" : "Ziele"}</a>
      <section class="goal-head" style="--c:${goal.color}">
        <div class="goal-head__top">
          <h2>${esc(goal.title)}</h2>
          <button class="link-btn" data-edit-goal>Bearbeiten</button>
        </div>
        ${goal.notes ? `<p class="goal-head__notes">${esc(goal.notes)}</p>` : ""}
        <div class="goal-head__stats">
          <span><b>${p} %</b> geschafft</span>
          ${bau ? `<span><b>${res && !res.cycle ? esc(S.parseDate(res.projectEndDate).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" })) : "–"}</b> fertig vorauss.</span>` : `<span><b>${rest > 0 ? GoalMath.fmtHours(rest) : "–"}</b> Arbeit übrig</span>`}
          <span><b>${esc(S.deadlineLabel(goal.deadline))}</b> ${ZieleView.daysLeft(goal.deadline)}</span>
        </div>
        <span class="progress"><span style="width:${p}%"></span></span>
      </section>
      ${allDone && !goal.done ? `<button class="banner-btn" data-finish>${bau ? "Alle Vorgänge erledigt · Projekt abschließen" : "Alle Unterziele erledigt · Ziel abschließen"}</button>` : ""}
      ${res && !allDone ? adviceHtml(goal, res, entries) : ""}
      <div class="sub-head">
        <h3 class="list-group">${bau ? "Vorgänge" : "Unterziele"} <span>${subs.length}</span></h3>
        ${subs.length ? `<div class="segmented sub-mode" role="radiogroup" aria-label="Darstellung">
          <label class="seg"><input type="radio" name="zmode" value="liste" ${mode === "liste" ? "checked" : ""}><span>Liste</span></label>
          <label class="seg"><input type="radio" name="zmode" value="netz" ${mode === "netz" ? "checked" : ""}><span>Netzplan</span></label>
          <label class="seg"><input type="radio" name="zmode" value="balken" ${mode === "balken" ? "checked" : ""}><span>Balken</span></label>
        </div>` : ""}
      </div>
      ${mode === "netz" && subs.length ? Netzplan.html(goal, res) : mode === "balken" && subs.length ? Balkenplan.html(goal, res) : subs.length ? `<ul class="task-list">${subs.map((sg, i) => subRow(goal, sg, i, byId, res)).join("")}</ul>` : `
        <p class="plan-hint">Teile dein Ziel in Schritte auf, z. B. Grundriss, Lageplan, Details. Schätze für jeden den Aufwand.</p>`}
      <button class="add-row" data-add><span class="add-row__plus">+</span> ${bau ? "Vorgang" : "Unterziel"}</button>
      <button class="add-row" data-save-template><span class="add-row__plus add-row__plus--alt">▤</span> Als Vorlage speichern</button>
      ${subs.length ? `<button class="add-row" data-print><span class="add-row__plus add-row__plus--alt">⎙</span> ${mode === "balken" ? (bau ? "Bauzeitenplan" : "Balkenplan") : mode === "netz" ? "Netzplan" : "Übersicht"} drucken / als PDF <small class="muted">A4/A3, quer/hoch</small></button>` : ""}
      ${mode === "liste" ? `<p class="plan-hint plan-hint--small">Kreis antippen = Fortschritt eintragen · Zeile antippen = bearbeiten</p>` : ""}`;
    container.querySelectorAll('[name="zmode"]').forEach((r) => r.addEventListener("change", () => Store.saveSettings({ zielAnsicht: r.value })));
    if (mode === "netz") Netzplan.wire(container, goal, res);
    if (mode === "balken") Balkenplan.wire(container, goal, res);
    keep.forEach(({ sel, x, y }) => { const el = container.querySelector(sel); if (el) { el.scrollLeft = x; el.scrollTop = y; } });

    container.querySelector("[data-edit-goal]").addEventListener("click", () => Goals.editGoal(goal.id));
    container.querySelector("[data-add]").addEventListener("click", () => Goals.newSubgoal(goal.id));
    container.querySelector("[data-save-template]").addEventListener("click", () => Templates.saveFromGoal(goal));
    const pr = container.querySelector("[data-print]");
    if (pr) pr.addEventListener("click", () => Druck.open(container, goal, res, mode));
    container.querySelectorAll("[data-progress]").forEach((b) => b.addEventListener("click", () => Goals.openProgress(goal.id, b.dataset.progress)));
    container.querySelectorAll("[data-sub]").forEach((b) => b.addEventListener("click", () => Goals.editSubgoal(goal.id, b.dataset.sub)));
    container.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => Editor.edit(b.dataset.open, b.dataset.date)));
    const fin = container.querySelector("[data-finish]");
    if (fin) fin.addEventListener("click", async () => { await Tasks.toggleDone(goal.id); location.hash = "#ziele"; });
  }

  return { render, leave() {} };
})();
