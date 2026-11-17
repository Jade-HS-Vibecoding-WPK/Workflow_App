// ============================================================
// Ansicht "Einstellungen" (über das Menü)
// Bisher: Feiertage (Bundesland, neu laden, feste Termine
// an Feiertagen ausfallen lassen). Weitere Einstellungen
// (Schriftgröße, Baumanagement-Modus) folgen später.
// ============================================================

const EinstellungenView = (() => {
  const esc = (s) => Editor.esc(s);
  let busy = false;

  async function render(container) {
    const settings = await Store.getSettings();
    const st = Holidays.state;
    const status = Holidays.status;
    const loadedAt = Object.entries(settings.feiertageCache || {})
      .filter(([k]) => k.endsWith("-" + st))
      .map(([, v]) => v.fetchedAt)
      .sort()
      .pop();
    const next = Holidays.upcoming(6);

    const cfg = CPM.cfg;
    const hourOpts = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((h) => `<option value="${h}" ${cfg.maxHoursPerDay === h ? "selected" : ""}>${h} Std.</option>`).join("");
    const theme = settings.farbmodus || "auto";
    const sem = settings.semester || {};
    container.innerHTML = `
      <h3 class="list-group">Darstellung</h3>
      <div class="form-group settings">
        <div class="row row--stack">
          <span>Hell / Dunkel <small class="muted">„Automatisch“ folgt der Einstellung deines Handys</small></span>
          <div class="segmented" role="radiogroup" aria-label="Farbmodus">
            ${[["auto", "Automatisch"], ["hell", "Hell"], ["dunkel", "Dunkel"]].map(([v, l]) => `
              <label class="seg"><input type="radio" name="theme" value="${v}" ${theme === v ? "checked" : ""}><span>${l}</span></label>`).join("")}
          </div>
        </div>
      </div>

      <h3 class="list-group">Planung</h3>
      <div class="form-group settings">
        <label class="row"><span>Höchstens pro Tag an Zielen arbeiten</span>
          <select name="maxH">${hourOpts}</select>
        </label>
        <label class="row"><span>Arbeitszeit ab</span><input type="time" name="von" value="${cfg.workFrom}"></label>
        <label class="row"><span>Arbeitszeit bis</span><input type="time" name="bis" value="${cfg.workTo}"></label>
        <label class="row"><span>Vorschläge automatisch einplanen <small class="muted">Aufgaben und Ziel-Arbeit als gestrichelte Option in freie Lücken</small></span>
          <input type="checkbox" class="switch" name="auto" ${settings.autoPlanen !== false ? "checked" : ""}>
        </label>
        <p class="hint">Die App rechnet mit deiner freien Zeit in diesem Fenster (ohne Termine und Sperrzeiten), höchstens mit dem Maximum pro Tag. Gerade: Ø ${GoalMath.fmtHours(CPM.averageCapacity(await Store.list()))} pro Tag.</p>
        <label class="row"><span>Baumanagement-Modus <small class="muted">alle Abhängigkeitsarten, Wartezeiten, Überlappung</small></span>
          <input type="checkbox" class="switch" name="bau" ${cfg.bau ? "checked" : ""}>
        </label>
      </div>

      <h3 class="list-group">Semester</h3>
      <div class="form-group settings">
        <label class="row"><span>Vorlesungszeit ab</span><input type="date" name="semVon" value="${esc(sem.von || "")}"></label>
        <label class="row"><span>Vorlesungszeit bis</span><input type="date" name="semBis" value="${esc(sem.bis || "")}"></label>
        <label class="row"><span>Vorlesungsfrei ab <small class="muted">optional, z. B. Weihnachten</small></span><input type="date" name="semFreiVon" value="${esc(sem.freiVon || "")}"></label>
        <label class="row"><span>Vorlesungsfrei bis</span><input type="date" name="semFreiBis" value="${esc(sem.freiBis || "")}"></label>
        <p class="hint">Selbst eintragen (z. B. aus dem Semesterplan der Hochschule). Feste Termine mit Haken „Uni-Veranstaltung“ finden nur in der Vorlesungszeit statt.</p>
      </div>

      <h3 class="list-group">Feiertage</h3>
      <div class="form-group settings">
        <label class="row"><span>Bundesland</span>
          <select name="land">
            ${Object.entries(Holidays.STATES).map(([code, name]) => `<option value="${code}" ${code === st ? "selected" : ""}>${name}</option>`).join("")}
          </select>
        </label>
        <label class="row"><span>Feste Termine fallen an Feiertagen aus <small class="muted">z. B. Vorlesungen</small></span>
          <input type="checkbox" class="switch" name="skip" ${Holidays.skipFixed ? "checked" : ""}>
        </label>
        <div class="row row--stack">
          <span class="${status.ok === false ? "meta--warn" : "muted"}">${esc(status.message)}${loadedAt ? ` · zuletzt geladen ${new Date(loadedAt).toLocaleDateString("de-DE")}` : ""}</span>
          <button type="button" class="link-btn" data-reload>${busy ? "Lädt …" : "Jetzt neu laden"}</button>
        </div>
      </div>
      ${next.length ? `
        <h3 class="list-group">Nächste Feiertage <span>${esc(Holidays.STATES[st])}</span></h3>
        <ul class="wl">
          ${next.map((h) => `<li class="wl-row wl-row--holiday" style="--c:var(--holiday)">
            <span class="wl-time">${Schedule.parseDate(h.date).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}</span>
            <span class="wl-title">${esc(h.name)}</span></li>`).join("")}
        </ul>` : ""}
      <p class="plan-hint plan-hint--small">Quelle: Nager.Date (date.nager.at), kostenlos und ohne Anmeldung. Abgefragt werden nur Jahr und Land, keine persönlichen Daten.</p>`;

    container.querySelector('[name="land"]').addEventListener("change", async (e) => {
      busy = true;
      await render(container);
      await Holidays.setState(e.target.value);
      busy = false;
      await render(container);
    });
    container.querySelector('[name="maxH"]').addEventListener("change", (e) => Store.saveSettings({ maxStundenProTag: Number(e.target.value) }));
    // Semester speichern (nur gültige Angaben)
    const semFields = ["semVon", "semBis", "semFreiVon", "semFreiBis"].map((n) => container.querySelector(`[name="${n}"]`));
    semFields.forEach((f) => f.addEventListener("change", () => {
      const [von, bis, freiVon, freiBis] = semFields.map((x) => x.value || null);
      if (von && bis && bis < von) { Toast.show("„bis“ liegt vor „ab“"); render(container); return; }
      if (freiVon && freiBis && freiBis < freiVon) { Toast.show("Vorlesungsfrei: „bis“ liegt vor „ab“"); render(container); return; }
      Store.saveSettings({ semester: { von, bis, freiVon, freiBis } });
    }));
    container.querySelectorAll('[name="theme"]').forEach((r) => r.addEventListener("change", () => Store.saveSettings({ farbmodus: r.value })));
    container.querySelector('[name="auto"]').addEventListener("change", (e) => Store.saveSettings({ autoPlanen: e.target.checked }));
    container.querySelector('[name="bau"]').addEventListener("change", (e) => Store.saveSettings({ bauModus: e.target.checked }));
    const von = container.querySelector('[name="von"]'), bis = container.querySelector('[name="bis"]');
    const saveTimes = () => {
      if (von.value && bis.value && Schedule.toMin(bis.value) > Schedule.toMin(von.value)) Store.saveSettings({ arbeitVon: von.value, arbeitBis: bis.value });
      else render(container); // ungültig → alten Wert wieder anzeigen
    };
    von.addEventListener("change", saveTimes);
    bis.addEventListener("change", saveTimes);
    container.querySelector('[name="skip"]').addEventListener("change", (e) => Holidays.setSkipFixed(e.target.checked));
    container.querySelector("[data-reload]").addEventListener("click", async () => {
      busy = true;
      await render(container);
      await Holidays.refresh({ force: true });
      busy = false;
      await render(container);
    });
  }

  return { render, leave() {} };
})();
