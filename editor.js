// ============================================================
// Eintragen und Bearbeiten
//
// "+"-Knopf → Auswahl (Fester Termin / Einmaliger Termin …)
// → Formular als Blatt, das von unten hochfährt.
// Antippen eines Termins im Plan öffnet dasselbe Formular
// zum Ändern, Absagen oder Löschen.
// ============================================================

const Editor = (() => {
  const T = Model.TYPES;
  const S = Schedule;
  // Wochentage in deutscher Reihenfolge (0 = Sonntag wie in JavaScript)
  const WD = [["Mo", 1], ["Di", 2], ["Mi", 3], ["Do", 4], ["Fr", 5], ["Sa", 6], ["So", 0]];
  const WD_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const BUFFERS = [0, 5, 10, 15, 20, 30, 45, 60];

  let layer = null;
  let lastFocus = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const fmtDate = (iso) => S.parseDate(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });

  // ---------- Blatt öffnen / schließen ----------
  function ensureLayer() {
    if (layer) return layer;
    layer = document.createElement("div");
    layer.className = "sheet-layer";
    layer.hidden = true;
    document.body.appendChild(layer);
    layer.addEventListener("click", (e) => { if (e.target === layer) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !layer.hidden) close(); });
    return layer;
  }

  function show(html) {
    ensureLayer();
    lastFocus = document.activeElement;
    layer.innerHTML = html;
    layer.hidden = false;
    document.body.classList.add("no-scroll");
    const first = layer.querySelector("[autofocus]") || layer.querySelector("button, input");
    if (first) first.focus({ preventScroll: true });
  }

  function close() {
    if (!layer || layer.hidden) return;
    layer.hidden = true;
    layer.innerHTML = "";
    document.body.classList.remove("no-scroll");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // Nächste volle Stunde als Startzeit vorschlagen
  function defaultTimes(startMin) {
    if (startMin != null) return { start: S.fromMin(startMin), end: S.fromMin(Math.min(startMin + 60, 23 * 60 + 59)) };
    const h = Math.min(new Date().getHours() + 1, 22);
    return { start: S.fromMin(h * 60), end: S.fromMin((h + 1) * 60) };
  }

  // ---------- 1. Auswahl: was soll angelegt werden? ----------
  function chooseNew(date = new Date(), startMin = null) {
    show(`
      <div class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet__head">
          <button class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title">Neu</h2>
          <span class="sheet__spacer"></span>
        </div>
        <div class="choice-list">
          <button class="choice" data-new="${T.EINMALIG}">
            <span class="choice__dot" style="background:var(--cat-einmalig)"></span>
            <span class="choice__text"><b>Termin</b><small>feste Uhrzeit – einmalig oder wiederkehrend, z. B. Uni, Arzt, Urlaub</small></span>
          </button>
          <button class="choice" data-new="${T.AUFGABE}">
            <span class="choice__dot" style="background:#ba7517"></span>
            <span class="choice__text"><b>Aufgabe</b><small>ohne feste Uhrzeit – die App sucht dir Zeit, z. B. Reisepass beantragen</small></span>
          </button>
          <button class="choice" data-new="${T.ZIEL}">
            <span class="choice__dot" style="background:#7f77dd"></span>
            <span class="choice__text">${Store.getArea() === "bau"
              ? "<b>Projekt</b><small>Baustelle mit Vorgängen und Gewerken</small>"
              : "<b>Ziel</b><small>großes Vorhaben mit Deadline und Schritten, z. B. Uni-Abgabe</small>"}</span>
          </button>
          <button class="choice" data-new="${T.TAGESNOTIZ}">
            <span class="choice__dot" style="background:var(--text-3)"></span>
            <span class="choice__text"><b>Tagesnotiz</b><small>kurzer Hinweis am Tag, blockiert keine Zeit</small></span>
          </button>
        </div>
      </div>`);

    layer.querySelector("[data-close]").onclick = close;
    layer.querySelectorAll("[data-new]").forEach((btn) => {
      btn.onclick = () => {
        if (btn.dataset.new === T.ZIEL) {
          Goals.newGoal();
          return;
        }
        if (btn.dataset.new === T.TAGESNOTIZ) {
          Manage.openNoteForm(Model.neueTagesnotiz({ date: S.isoDate(date) }), true);
          return;
        }
        if (btn.dataset.new === T.AUFGABE) {
          openTaskForm(Model.neueAufgabe(), { isNew: true });
          return;
        }
        // Ein Formular für alle Termine – "Wiederholen" entscheidet fest/einmalig (Aufräumen B)
        const times = defaultTimes(startMin);
        const entry = Model.neuerEinmaligerTermin({ ...times, date: S.isoDate(date) });
        openForm(entry, { isNew: true, date: S.isoDate(date) });
      };
    });
  }

  // ---------- 2. Vorhandenen Eintrag bearbeiten ----------
  async function edit(id, dateIso, slotId = null, subId = null) {
    if (slotId) { Planner.openSlot(id, slotId, subId || null); return; }
    const entry = await Store.get(id);
    if (!entry) return;
    if (entry.type === T.AUFGABE) { openTaskForm(entry, { isNew: false }); return; }
    if (entry.type === T.ZIEL) {
      // Vorgang der Baustelle im Plan angetippt → Kästchen mit allen Werten
      if (subId && typeof Netzplan !== "undefined") { Netzplan.openNode(entry, CPM.computeGoal(entry, await Store.list()), subId); return; }
      location.hash = "#ziel/" + encodeURIComponent(entry.id);
      return;
    }
    if (entry.type === T.SPERRZEIT) { Manage.openSperrForm(entry, false); return; }
    if (entry.type === T.TAGESNOTIZ) { Manage.openNoteForm(entry, false); return; }
    if (entry.type !== T.FEST && entry.type !== T.EINMALIG) return;
    openForm(entry, { isNew: false, date: dateIso });
  }

  // ---------- Formular ----------
  function openForm(entry, { isNew, date }) {
    const storedFest = entry.type === T.FEST; // so ist der Termin gespeichert (für Absagen/Löschen)
    const baseDate = entry.date || date || S.isoDate(new Date());
    const rec = entry.recurrence || { freq: "nie", weekdays: [S.parseDate(baseDate).getDay()] };
    const freqNow = storedFest ? rec.freq : "nie";
    const cancelled = storedFest && date && (entry.exceptions || []).some((x) => x.date === date && x.status === "abgesagt");
    // Termin der Baustelle? (neu im Bereich Baustelle angelegt oder schon dort gespeichert)
    const isBauEntry = isNew ? Store.getArea() === "bau" : entry.area === "bau";
    // "Mehr Optionen" offen, wenn dort schon etwas eingestellt ist
    const moreOpen = !isNew && (entry.bufferMin || entry.priority !== 3 || entry.notes || entry.uni || (rec.from || rec.until) || entry.showInPrivate);

    const weekdayChips = WD.map(([short, n]) => `
      <label class="chip"><input type="checkbox" name="wd" value="${n}" ${(rec.weekdays || []).includes(n) ? "checked" : ""}><span>${short}</span></label>`).join("");

    const prio = [1, 2, 3, 4, 5].map((p) => `
      <label class="seg"><input type="radio" name="priority" value="${p}" ${entry.priority === p ? "checked" : ""}><span>${p}</span></label>`).join("");

    const actions = isNew ? "" : `
      <div class="form-group form-actions">
        ${storedFest && date ? `<button type="button" class="action" data-action="toggle-cancel">${cancelled ? `Absage am ${fmtDate(date)} zurücknehmen` : `Nur am ${fmtDate(date)} absagen`}</button>` : ""}
        <button type="button" class="action action--danger" data-action="delete">${storedFest ? "Ganze Serie löschen" : "Termin löschen"}</button>
      </div>`;

    show(`
      <form class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head">
          <button type="button" class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title"><span class="choice__dot" data-dot></span>${isNew ? "Termin" : "Bearbeiten"}</h2>
          <button type="submit" class="link-btn link-btn--strong">Sichern</button>
        </div>
        ${cancelled ? `<p class="notice">Am ${fmtDate(date)} abgesagt – das Zeitfenster ist frei.</p>` : ""}

        <div class="form-group">
          <input class="title-input" name="title" placeholder="Titel, z. B. Vorlesung Statik oder Zahnarzt" value="${esc(entry.title)}" autocomplete="off" ${isNew ? "autofocus" : ""}>
          <input name="location" placeholder="Ort / Raum (optional)" value="${esc(entry.location)}" autocomplete="off">
        </div>

        <!-- Wann? (Aufräumen C: erst die Zeit, dann die Wiederholung) -->
        <div class="form-group">
          <label class="row" data-show="once"><span>Datum</span><input type="date" name="date" value="${esc(baseDate)}"></label>
          <label class="row" data-show="once"><span>Ganztägig <small class="muted">z. B. Urlaub</small></span><input type="checkbox" name="allDay" class="switch" ${entry.allDay ? "checked" : ""}></label>
          <label class="row" data-show="allday"><span>Bis</span><input type="date" name="endDate" value="${esc(entry.endDate || "")}"></label>
          <label class="row" data-show="allday"><span>Feste Termine fallen aus <small class="muted">z. B. Arbeit, Uni im Urlaub</small></span><input type="checkbox" name="cancelFixed" class="switch" ${entry.cancelFixed ? "checked" : ""}></label>
          <label class="row" data-show="times"><span>Beginn</span><input type="time" name="start" value="${esc(entry.start)}"></label>
          <label class="row" data-show="times"><span>Ende</span><input type="time" name="end" value="${esc(entry.end)}"></label>
          <p class="hint" data-night-hint hidden>Endet am nächsten Tag (über Mitternacht).</p>
          <label class="row"><span>Wiederholen</span>
            <select name="freq">
              <option value="nie" ${freqNow === "nie" ? "selected" : ""}>nie (einmalig)</option>
              <option value="woechentlich" ${freqNow === "woechentlich" ? "selected" : ""}>jede Woche</option>
              <option value="zweiwoechentlich" ${freqNow === "zweiwoechentlich" ? "selected" : ""}>alle 2 Wochen</option>
              <option value="monatlich" ${freqNow === "monatlich" ? "selected" : ""}>jeden Monat</option>
            </select>
          </label>
          <div class="row row--stack" data-show="monthly">
            <span>Monatlich am</span>
            <div class="segmented">
              <label class="seg"><input type="radio" name="monthlyMode" value="datum" ${rec.monthlyMode !== "wochentag" ? "checked" : ""}><span>Datum</span></label>
              <label class="seg"><input type="radio" name="monthlyMode" value="wochentag" ${rec.monthlyMode === "wochentag" ? "checked" : ""}><span>Wochentag</span></label>
            </div>
          </div>
          <label class="row" data-show="monthly-datum"><span>Jeden … des Monats</span>
            <input type="number" name="dayOfMonth" min="1" max="31" inputmode="numeric" value="${esc(rec.dayOfMonth || S.parseDate(baseDate).getDate())}">
          </label>
          <label class="row" data-show="monthly-wochentag"><span>Welche Woche</span>
            <select name="nthWeek">
              ${[[1, "1."], [2, "2."], [3, "3."], [4, "4."], [-1, "letzter"]].map(([v, t]) => `<option value="${v}" ${rec.nthWeek === v ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </label>
          <div class="row row--stack" data-show="weekdays">
            <span data-wd-label>Wochentage</span>
            <div class="chips">${weekdayChips}</div>
          </div>
        </div>

        <!-- Seltenes eingeklappt (Aufräumen C) -->
        <details class="more" ${moreOpen ? "open" : ""}>
          <summary>Mehr Optionen <small>Puffer, Priorität, Notiz${isBauEntry ? ", Wochenplan" : ""}</small></summary>
          <div class="form-group">
            <label class="row" data-show="times"><span>Puffer davor/danach <small class="muted">z. B. Weg dorthin</small></span>
              <select name="bufferMin">${BUFFERS.map((b) => `<option value="${b}" ${entry.bufferMin === b ? "selected" : ""}>${b ? b + " Min." : "keiner"}</option>`).join("")}</select>
            </label>
            <div class="row row--stack">
              <span>Priorität <small class="muted">1 = darf am ehesten weichen · 5 = sehr wichtig</small></span>
              <div class="segmented">${prio}</div>
            </div>
          </div>
          <div class="form-group" data-show="repeat">
            <label class="row"><span>Uni-Veranstaltung <small class="muted">findet nur in der Vorlesungszeit statt</small></span>
              <input type="checkbox" class="switch" name="uni" ${entry.uni ? "checked" : ""}></label>
            <p class="hint" data-uni-hint></p>
            <label class="row"><span>Wiederholen ab</span><input type="date" name="from" value="${esc(rec.from || "")}"></label>
            <label class="row"><span>Wiederholen bis</span><input type="date" name="until" value="${esc(rec.until || "")}"></label>
            <p class="hint">Optional, z. B. bis Semesterende. Leer = unbegrenzt.</p>
          </div>
          <div class="form-group">
            <textarea name="notes" rows="3" placeholder="Notiz (optional)">${esc(entry.notes)}</textarea>
          </div>
          ${isBauEntry ? `
          <div class="form-group">
            <label class="row"><span>Auch im Wochenplan anzeigen <small class="muted">erscheint dann in deinem privaten Plan und blockiert dort die Zeit</small></span>
              <input type="checkbox" class="switch" name="showInPrivate" ${entry.showInPrivate ? "checked" : ""}></label>
          </div>` : ""}
        </details>

        <div class="form-warn" role="alert" hidden></div>
        <p class="form-error" role="alert" hidden></p>
        ${actions}
      </form>`);

    const form = layer.querySelector("form");
    const errorEl = form.querySelector(".form-error");
    const warnEl = form.querySelector(".form-warn");
    let warned = false; // zweites "Sichern" = trotzdem eintragen
    form.addEventListener("input", () => { warned = false; warnEl.hidden = true; });

    // Felder je nach Auswahl ein-/ausblenden
    function updateVisibility() {
      const v = (sel) => form.querySelector(sel);
      const set = (key, on) => form.querySelectorAll(`[data-show="${key}"]`).forEach((el) => { el.hidden = !on; });
      const freq = v('[name="freq"]').value;
      const repeat = freq !== "nie";
      const mode = v('[name="monthlyMode"]:checked').value;
      const monthly = repeat && freq === "monatlich";
      const allDay = !repeat && v('[name="allDay"]').checked;
      set("once", !repeat);
      set("repeat", repeat);
      set("allday", allDay);
      set("times", !allDay);
      set("monthly", monthly);
      set("monthly-datum", monthly && mode === "datum");
      set("monthly-wochentag", monthly && mode === "wochentag");
      set("weekdays", repeat && (!monthly || mode === "wochentag"));
      form.querySelector("[data-wd-label]").textContent = monthly ? "Wochentag (einer)" : "Wochentage";
      form.querySelector("[data-dot]").style.background = repeat ? "var(--cat-fest)" : "var(--cat-einmalig)";
      // Wochentag vorbelegen, wenn auf "wiederholen" umgestellt wird
      if (repeat && !form.querySelector('[name="wd"]:checked')) {
        const d = form.elements.date.value ? S.parseDate(form.elements.date.value).getDay() : new Date().getDay();
        const cb = form.querySelector(`[name="wd"][value="${d}"]`);
        if (cb) cb.checked = true;
      }
      errorEl.hidden = true;
    }
    form.addEventListener("change", updateVisibility);
    updateVisibility();

    // Hinweis "über Mitternacht"
    const nightHint = form.querySelector("[data-night-hint]");
    const updateNight = () => {
      const a = form.elements.start.value, b = form.elements.end.value;
      nightHint.hidden = !(a && b && S.toMin(b) < S.toMin(a));
      if (!nightHint.hidden) nightHint.textContent = `Endet am nächsten Tag um ${b} Uhr (über Mitternacht).`;
    };
    form.addEventListener("input", updateNight);
    updateNight();

    // Hinweis zum Haken "Uni-Veranstaltung"
    const uniHint = form.querySelector("[data-uni-hint]");
    const updateUni = () => {
      if (!uniHint) return;
      const on = form.elements.uni.checked;
      const sem = S.semester;
      uniHint.hidden = !on;
      const d = (iso) => S.parseDate(iso).toLocaleDateString("de-DE", { day: "numeric", month: "numeric", year: "numeric" });
      uniHint.textContent = !sem ? "Trag die Vorlesungszeit unter Einstellungen → Semester ein, dann weiß die App, wann die Veranstaltung stattfindet."
        : `Vorlesungszeit ${d(sem.von)}–${d(sem.bis)}${sem.freiVon && sem.freiBis ? `, frei ${d(sem.freiVon)}–${d(sem.freiBis)}` : ""}.`;
    };
    form.addEventListener("change", updateUni);
    updateUni();

    // Beim monatlichen Wochentag darf nur EIN Tag gewählt sein
    form.addEventListener("change", (e) => {
      if (e.target.name !== "wd" || !e.target.checked) return;
      const monthly = form.querySelector('[name="freq"]').value === "monatlich";
      if (monthly) form.querySelectorAll('[name="wd"]').forEach((cb) => { if (cb !== e.target) cb.checked = false; });
    });

    form.querySelector("[data-close]").onclick = close;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const result = readForm(form, entry, form.elements.freq.value !== "nie");
      if (result.error) {
        errorEl.textContent = result.error;
        errorEl.hidden = false;
        if (result.field && form.elements[result.field]) form.elements[result.field].focus();
        else errorEl.scrollIntoView({ block: "nearest" });
        return;
      }
      // Sperrzeit oder Überschneidung? Erst warnen, beim zweiten Tippen speichern
      const found = S.conflicts(await Store.list(), result.entry);
      if (!warned) {
        const html = conflictHtml(found, result.entry);
        if (html) {
          warned = true;
          warnEl.innerHTML = html;
          warnEl.hidden = false;
          warnEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return;
        }
      }
      try {
        await Store.save(result.entry);
        close();
        // Bestätigte Blöcke (Aufgaben/Ziele) im Weg? Nur nach Rückfrage verschieben
        for (const x of found.overlap.filter((o) => o.slotId)) {
          if (confirm(`„${x.title}“ ist schon fest geplant (${fmtDate(x.date)}, ${x.start}–${x.end}).\n\nNeu einplanen?`)) {
            await Planner.releaseSlot(x.id, x.slotId, x.subgoalId);
          }
        }
      } catch (err) {
        errorEl.textContent = "Speichern hat nicht geklappt. Ist der Speicher des Browsers voll oder im privaten Modus?";
        errorEl.hidden = false;
      }
    });

    // Absagen / Löschen
    form.querySelectorAll("[data-action]").forEach((btn) => {
      btn.onclick = async () => {
        if (btn.dataset.action === "delete") {
          const q = storedFest ? `„${entry.title}“ an allen Tagen löschen?` : `„${entry.title}“ löschen?`;
          if (!confirm(q)) return;
          const orig = await Store.get(entry.id); // für "Rückgängig"
          await Store.remove(entry.id);
          close();
          if (orig) Toast.show(`„${orig.title}“ gelöscht`, () => Store.save(orig));
        }
        if (btn.dataset.action === "toggle-cancel") {
          const exceptions = (entry.exceptions || []).filter((x) => x.date !== date);
          if (!cancelled) exceptions.push({ date, status: "abgesagt" });
          await Store.save({ ...entry, exceptions });
          close();
        }
      };
    });
  }

  // Warntext für Sperrzeiten / Überschneidungen
  function conflictHtml(c, entry = {}) {
    // Ende vor Beginn und sehr lang (über 12 Std.) → wahrscheinlich ein Tippfehler (Testrunde 3)
    let nightLine = "";
    if (!entry.allDay && entry.start && entry.end && entry.end !== "00:00" && entry.end < entry.start) {
      const len = 24 * 60 - S.toMin(entry.start) + S.toMin(entry.end);
      if (len > 12 * 60) nightLine = `Das Ende liegt vor dem Beginn: Der Termin geht über Mitternacht bis zum nächsten Tag ${entry.end} Uhr (${Math.round(len / 60)} Std.). Tippfehler?`;
    }
    if (!c.sperr.length && !c.overlap.length && !nightLine) return "";
    const when = (x) => (x.kind === "fest" || x.kind === "sperr" ? "" : fmtDate(x.date) + ", ") + `${x.start}–${x.end === "24:00" ? "24:00" : x.end}`;
    const list = (arr) => {
      const first = arr.slice(0, 3).map((x) => `„${esc(x.title)}“ (${when(x)})`).join(", ");
      return first + (arr.length > 3 ? ` und ${arr.length - 3} weitere` : "");
    };
    const lines = nightLine ? [nightLine] : [];
    if (c.sperr.length) lines.push(`Liegt in deiner Sperrzeit ${list(c.sperr)}.`);
    if (c.overlap.length) lines.push(`Überschneidet sich mit ${list(c.overlap)}.`);
    return `<b>Achtung</b>${lines.map((l) => `<span>${l}</span>`).join("")}<small>Tippe noch einmal auf „Sichern“, um trotzdem einzutragen.</small>`;
  }

  // Formular auslesen und prüfen
  function readForm(form, entry, isFest) {
    const val = (n) => (form.elements[n] ? form.elements[n].value.trim() : "");
    // Typ ergibt sich aus "Wiederholen" – fest ⇄ einmalig umstellen ist möglich (gleiche ID)
    const out = { ...(isFest ? Model.neuerFesterTermin() : Model.neuerEinmaligerTermin()), ...entry, type: isFest ? T.FEST : T.EINMALIG };
    if (isFest) { delete out.date; delete out.allDay; delete out.endDate; delete out.cancelFixed; out.exceptions = entry.exceptions || []; }
    else { delete out.recurrence; delete out.exceptions; out.uni = false; }

    out.title = val("title");
    out.location = val("location");
    out.notes = val("notes");
    out.priority = Number((form.querySelector('[name="priority"]:checked') || {}).value || 3);
    out.bufferMin = Number(val("bufferMin") || 0);
    out.start = val("start");
    out.end = val("end");
    if (form.elements.uni && isFest) out.uni = form.elements.uni.checked;
    if (form.elements.showInPrivate) out.showInPrivate = form.elements.showInPrivate.checked;

    if (!out.title) return { error: "Bitte gib einen Titel ein.", field: "title" };

    if (isFest) {
      const freq = val("freq");
      const monthlyMode = (form.querySelector('[name="monthlyMode"]:checked') || {}).value || "datum";
      const weekdays = [...form.querySelectorAll('[name="wd"]:checked')].map((cb) => Number(cb.value));
      out.recurrence = {
        ...Model.neuerFesterTermin().recurrence,
        ...(entry.recurrence || {}),
        freq,
        weekdays,
        monthlyMode,
        dayOfMonth: Number(val("dayOfMonth")) || null,
        nthWeek: Number(val("nthWeek")) || null,
        from: val("from") || null,
        until: val("until") || null,
      };
      if (freq !== "monatlich" && weekdays.length === 0) return { error: "Wähle mindestens einen Wochentag." };
      if (freq === "monatlich" && monthlyMode === "wochentag" && weekdays.length !== 1) return { error: "Wähle genau einen Wochentag." };
      if (freq === "monatlich" && monthlyMode === "datum" && !(out.recurrence.dayOfMonth >= 1 && out.recurrence.dayOfMonth <= 31)) return { error: "Gib einen Tag zwischen 1 und 31 ein." };
      if (out.recurrence.from && out.recurrence.until && out.recurrence.until < out.recurrence.from) return { error: "„Bis“ liegt vor „Ab“." };
    } else {
      out.date = val("date") || null;
      out.allDay = form.elements.allDay.checked;
      out.endDate = out.allDay ? (val("endDate") || null) : null;
      out.cancelFixed = !!(out.allDay && form.elements.cancelFixed && form.elements.cancelFixed.checked);
      if (!out.date) return { error: "Bitte wähle ein Datum." };
      if (out.endDate && out.endDate < out.date) return { error: "Das Enddatum liegt vor dem Startdatum." };
    }

    const needsTimes = isFest || !out.allDay;
    if (needsTimes) {
      if (!out.start || !out.end) return { error: "Bitte gib Beginn und Ende ein." };
      if (S.toMin(out.end) === S.toMin(out.start)) return { error: "Beginn und Ende dürfen nicht gleich sein." };
      // Ende vor Beginn = Termin geht über Mitternacht (endet am nächsten Tag)
    }
    return { entry: out };
  }

  // ============================================================
  // Aufgaben-Formular
  // ============================================================
  // Frei wählbare Farben für Aufgaben und Ziele (nicht Blau/Grün:
  // die gehören den Termin-Kategorien)
  const TASK_COLORS = ["#ba7517", "#d85a30", "#e24b4a", "#d4537e", "#af52de", "#7f77dd", "#a2845e", "#636366"];
  const DURATIONS = [10, 15, 30, 45, 60, 90, 120, 180, 240, 360, 480];
  const fmtDuration = (m) => (m < 60 ? `${m} Min.` : `${m / 60} Std.`.replace(".5 Std.", ",5 Std."));

  function openTaskForm(entry, { isNew }) {
    const rec = entry.recurrence || { freq: "einmalig" };
    const prio = [1, 2, 3, 4, 5].map((p) => `
      <label class="seg"><input type="radio" name="priority" value="${p}" ${entry.priority === p ? "checked" : ""}><span>${p}</span></label>`).join("");
    const colors = TASK_COLORS.map((c) => `
      <label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}" ${entry.color === c ? "checked" : ""} aria-label="Farbe ${c}"><span></span></label>`).join("");
    const durations = DURATIONS.includes(entry.durationMin) ? DURATIONS : [...DURATIONS, entry.durationMin].sort((a, b) => a - b);

    show(`
      <form class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head">
          <button type="button" class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title"><span class="choice__dot" style="background:${entry.color}" data-title-dot></span>${isNew ? "Aufgabe" : "Bearbeiten"}</h2>
          <button type="submit" class="link-btn link-btn--strong">Sichern</button>
        </div>

        <div class="form-group">
          <input class="title-input" name="title" placeholder="Titel, z. B. Reisepass beantragen" value="${esc(entry.title)}" autocomplete="off" ${isNew ? "autofocus" : ""}>
        </div>

        <div class="form-group">
          <label class="row"><span>Bis wann? <small class="muted">Deadline, optional</small></span><input type="date" name="deadline" value="${esc(entry.deadline || "")}"></label>
          <label class="row"><span>Wie lange dauert es?</span>
            <select name="durationMin">${durations.map((d) => `<option value="${d}" ${entry.durationMin === d ? "selected" : ""}>${fmtDuration(d)}</option>`).join("")}</select>
          </label>
          <label class="row"><span>Wiederholen</span>
            <select name="freq">
              <option value="einmalig" ${rec.freq === "einmalig" ? "selected" : ""}>nie (einmalig)</option>
              <option value="woechentlich" ${rec.freq === "woechentlich" ? "selected" : ""}>jede Woche</option>
              <option value="zweiwoechentlich" ${rec.freq === "zweiwoechentlich" ? "selected" : ""}>alle 2 Wochen</option>
              <option value="monatlich" ${rec.freq === "monatlich" ? "selected" : ""}>jeden Monat</option>
            </select>
          </label>
          <p class="hint" data-repeat-hint></p>
        </div>

        <!-- Seltenes eingeklappt (Aufräumen C) -->
        <details class="more" ${!isNew && (entry.priority !== 3 || entry.notes) ? "open" : ""}>
          <summary>Mehr Optionen <small>Priorität, Farbe, Notiz</small></summary>
          <div class="form-group">
            <div class="row row--stack">
              <span>Priorität <small class="muted">1 = kann warten · 5 = sehr wichtig</small></span>
              <div class="segmented">${prio}</div>
            </div>
            <div class="row row--stack">
              <span>Farbe</span>
              <div class="swatches">${colors}</div>
            </div>
          </div>
          <div class="form-group">
            <textarea name="notes" rows="2" placeholder="Notiz (optional)">${esc(entry.notes)}</textarea>
          </div>
        </details>

        <p class="form-error" role="alert" hidden></p>
        ${isNew ? "" : `
        <div class="form-group form-actions">
          <button type="button" class="action" data-action="done">${entry.done ? "Als offen markieren" : "Als erledigt abhaken"}</button>
          <button type="button" class="action action--danger" data-action="delete">Aufgabe löschen</button>
        </div>`}
      </form>`);

    const form = layer.querySelector("form");
    const errorEl = form.querySelector(".form-error");
    const hint = form.querySelector("[data-repeat-hint]");

    function update() {
      const freq = form.elements.freq.value;
      const dl = form.elements.deadline.value;
      errorEl.hidden = true;
      const dot = form.querySelector("[data-title-dot]");
      const c = form.querySelector('[name="color"]:checked');
      if (c) dot.style.background = c.value;
      if (freq === "einmalig") { hint.hidden = true; return; }
      hint.hidden = false;
      if (!dl) { hint.textContent = "Wähle eine Deadline. Danach wiederholt sich die Aufgabe ab diesem Tag."; return; }
      const d = S.parseDate(dl);
      hint.textContent = {
        woechentlich: `Jeden ${WD_LONG[d.getDay()]}.`,
        zweiwoechentlich: `Jeden zweiten ${WD_LONG[d.getDay()]}.`,
        monatlich: `Jeden ${d.getDate()}. des Monats.`,
      }[freq] + " Beim Abhaken rückt die Deadline auf den nächsten Termin.";
    }
    form.addEventListener("change", update);
    update();

    form.querySelector("[data-close]").onclick = close;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = { ...entry };
      out.title = form.elements.title.value.trim();
      out.notes = form.elements.notes.value.trim();
      out.deadline = form.elements.deadline.value || null;
      out.durationMin = Number(form.elements.durationMin.value);
      out.priority = Number((form.querySelector('[name="priority"]:checked') || {}).value || 3);
      out.color = (form.querySelector('[name="color"]:checked') || {}).value || entry.color;
      const freq = form.elements.freq.value;

      let error = "", field = "";
      if (!out.title) { error = "Bitte gib einen Titel ein."; field = "title"; }
      else if (freq !== "einmalig" && !out.deadline) { error = "Eine wiederkehrende Aufgabe braucht eine Deadline."; field = "deadline"; }
      if (error) {
        errorEl.textContent = error;
        errorEl.hidden = false;
        if (field) form.elements[field].focus();
        return;
      }

      // Wiederholung aus der Deadline ableiten (Wochentag bzw. Tag im Monat)
      if (freq === "einmalig") {
        out.recurrence = { ...Model.neueAufgabe().recurrence, freq: "einmalig" };
      } else {
        const d = S.parseDate(out.deadline);
        out.recurrence = {
          ...Model.neueAufgabe().recurrence,
          freq, weekdays: [d.getDay()], monthlyMode: "datum", dayOfMonth: d.getDate(), from: out.deadline,
        };
      }
      try {
        await Store.save(out);
        close();
      } catch (err) {
        errorEl.textContent = "Speichern hat nicht geklappt.";
        errorEl.hidden = false;
      }
    });

    form.querySelectorAll("[data-action]").forEach((btn) => {
      btn.onclick = async () => {
        if (btn.dataset.action === "delete") {
          if (!confirm(`„${entry.title}“ löschen?`)) return;
          const orig = await Store.get(entry.id); // für "Rückgängig"
          await Store.remove(entry.id);
          close();
          if (orig) Toast.show(`„${orig.title}“ gelöscht`, () => Store.save(orig));
        }
        if (btn.dataset.action === "done") {
          close();
          await Tasks.toggleDone(entry.id);
        }
      };
    });
  }

  const newTask = () => openTaskForm(Model.neueAufgabe(), { isNew: true });

  // show/close/esc/TASK_COLORS werden auch von ziele.js benutzt
  return { chooseNew, edit, close, newTask, show, esc, TASK_COLORS, sheetForm: () => layer && layer.querySelector("form") };
})();
