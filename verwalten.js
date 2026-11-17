// ============================================================
// Menü → "Verwalten": Sperrzeiten, Tagesnotizen, Daten sichern
//
// Manage.openSperrForm / Manage.openNoteForm: Formulare (Blatt von unten)
// SperrzeitenView, TagesnotizenView, DatenView: die Ansichten im Menü
// ============================================================

const Manage = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);
  const WD = [["Mo", 1], ["Di", 2], ["Mi", 3], ["Do", 4], ["Fr", 5], ["Sa", 6], ["So", 0]];

  // "Mo–Fr", "jeden Tag", "Wochenende" oder "Mo, Mi, Fr"
  function weekdaysLabel(wds = []) {
    const set = new Set(wds);
    if (set.size === 7) return "jeden Tag";
    if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return "Mo–Fr";
    if (set.size === 2 && set.has(0) && set.has(6)) return "Wochenende";
    return WD.filter(([, n]) => set.has(n)).map(([s]) => s).join(", ") || "kein Tag";
  }
  // 00:00 als Ende heißt "bis Mitternacht"
  const endLabel = (end) => (end === "00:00" ? "24:00" : end);
  const timeLabel = (e) => `${e.start}–${endLabel(e.end)}`;

  function sheet(title, color, isNew, body, actions = "") {
    return `
      <form class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head">
          <button type="button" class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title"><span class="choice__dot" style="background:${color}"></span>${title}</h2>
          <button type="submit" class="link-btn link-btn--strong">Sichern</button>
        </div>
        ${body}
        <p class="form-error" role="alert" hidden></p>
        ${isNew ? "" : `<div class="form-group form-actions">${actions}</div>`}
      </form>`;
  }

  // Gemeinsame Verkabelung: Abbrechen, Sichern mit Prüfung, Löschen
  function wire(form, entry, readFn, label) {
    const errorEl = form.querySelector(".form-error");
    form.querySelector("[data-close]").onclick = Editor.close;
    form.addEventListener("input", () => { errorEl.hidden = true; });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const r = readFn();
      if (r.error) {
        errorEl.textContent = r.error;
        errorEl.hidden = false;
        if (r.field && form.elements[r.field]) form.elements[r.field].focus();
        return;
      }
      await Store.save(r.entry);
      Editor.close();
    });
    const del = form.querySelector('[data-action="delete"]');
    if (del) del.onclick = async () => {
      if (!confirm(`${label} „${entry.title}“ löschen?`)) return;
      await Store.remove(entry.id);
      Editor.close();
      Toast.show(`${label} gelöscht`, () => Store.save(entry));
    };
  }

  // ---------- Sperrzeit-Formular ----------
  function openSperrForm(entry, isNew) {
    const chips = WD.map(([s, n]) => `
      <label class="chip"><input type="checkbox" name="wd" value="${n}" ${(entry.weekdays || []).includes(n) ? "checked" : ""}><span>${s}</span></label>`).join("");
    Editor.show(sheet(isNew ? "Sperrzeit" : "Bearbeiten", "var(--cat-sperr)", isNew, `
      <div class="form-group">
        <input class="title-input" name="title" placeholder="Name, z. B. Freizeit, Schlafen, Training" value="${esc(entry.title)}" autocomplete="off" ${isNew ? "autofocus" : ""}>
      </div>
      <div class="form-group">
        <div class="row row--stack"><span>Wochentage</span><div class="chips">${chips}</div></div>
        <label class="row"><span>Von</span><input type="time" name="start" value="${esc(entry.start)}"></label>
        <label class="row"><span>Bis</span><input type="time" name="end" value="${esc(entry.end)}"></label>
        <p class="hint" data-night-hint></p>
      </div>
      <div class="form-group">
        <label class="row"><span>Aktiv <small class="muted">aus = pausiert, z. B. in der Prüfungsphase</small></span>
          <input type="checkbox" class="switch" name="active" ${entry.active !== false ? "checked" : ""}></label>
      </div>
      <p class="plan-hint plan-hint--small">In Sperrzeiten plant die App nichts ein. Trägst du selbst etwas hinein, warnt sie nur.</p>`,
      `<button type="button" class="action action--danger" data-action="delete">Sperrzeit löschen</button>`));

    const form = Editor.sheetForm();
    const hint = form.querySelector("[data-night-hint]");
    const updateHint = () => {
      const a = form.elements.start.value, b = form.elements.end.value;
      if (!a || !b) { hint.hidden = true; return; }
      hint.hidden = false;
      hint.textContent = b === "00:00" ? "Bis Mitternacht."
        : S.toMin(b) <= S.toMin(a) ? `Über Nacht: von ${a} Uhr bis ${b} Uhr am nächsten Morgen.` : "";
      if (!hint.textContent) hint.hidden = true;
    };
    form.addEventListener("input", updateHint);
    updateHint();

    wire(form, entry, () => {
      const out = { ...entry };
      out.title = form.elements.title.value.trim();
      out.weekdays = [...form.querySelectorAll('[name="wd"]:checked')].map((cb) => Number(cb.value));
      out.start = form.elements.start.value;
      out.end = form.elements.end.value;
      out.active = form.elements.active.checked;
      if (!out.title) return { error: "Bitte gib einen Namen ein.", field: "title" };
      if (!out.weekdays.length) return { error: "Wähle mindestens einen Wochentag." };
      if (!out.start || !out.end) return { error: "Bitte gib Beginn und Ende ein." };
      if (out.start === out.end) return { error: "Beginn und Ende dürfen nicht gleich sein." };
      return { entry: out };
    }, "Sperrzeit");
  }

  // ---------- Tagesnotiz-Formular ----------
  function openNoteForm(entry, isNew) {
    Editor.show(sheet(isNew ? "Tagesnotiz" : "Bearbeiten", "var(--text-3)", isNew, `
      <div class="form-group">
        <input class="title-input" name="title" placeholder="z. B. Semesterstart, Geburtstag Oma" value="${esc(entry.title)}" autocomplete="off" maxlength="80" ${isNew ? "autofocus" : ""}>
        <label class="row"><span>Datum</span><input type="date" name="date" value="${esc(entry.date || "")}"></label>
      </div>
      <p class="plan-hint plan-hint--small">Eine Tagesnotiz blockiert keine Zeit. Sie steht nur oben am Tag.</p>`,
      `<button type="button" class="action action--danger" data-action="delete">Notiz löschen</button>`));
    const form = Editor.sheetForm();
    wire(form, entry, () => {
      const out = { ...entry, title: form.elements.title.value.trim(), date: form.elements.date.value || null };
      if (!out.title) return { error: "Bitte gib einen Text ein.", field: "title" };
      if (!out.date) return { error: "Bitte wähle ein Datum.", field: "date" };
      return { entry: out };
    }, "Notiz");
  }

  return { openSperrForm, openNoteForm, weekdaysLabel, timeLabel };
})();

// ---------- Ansicht Sperrzeiten ----------
const SperrzeitenView = (() => {
  const esc = (s) => Editor.esc(s);
  async function render(container) {
    const list = (await Store.list(Model.TYPES.SPERRZEIT))
      .sort((a, b) => (b.active !== false) - (a.active !== false) || a.start.localeCompare(b.start));
    container.innerHTML = `
      <p class="plan-hint">Zeiten, die dir gehören: Hier plant die App nichts ein, und sie zählen nicht als freie Zeit.</p>
      ${list.length ? `<ul class="wl">${list.map((e) => `
        <li class="wl-row ${e.active === false ? "wl-row--cancelled" : ""}" data-id="${esc(e.id)}" role="button" tabindex="0" style="--c:var(--cat-sperr)">
          <span class="wl-time">${Manage.timeLabel(e)}</span>
          <span class="wl-title">${esc(e.title)}<small>${Manage.weekdaysLabel(e.weekdays)}${e.active === false ? " · pausiert" : ""}</small></span>
        </li>`).join("")}</ul>` : `
        <section class="empty">
          <p class="empty__title">Noch keine Sperrzeiten</p>
          <p class="empty__text">Zum Beispiel „Freizeit ab 20 Uhr“ oder „Schlafen 23–7 Uhr“.</p>
        </section>`}
      <button class="add-row" data-add><span class="add-row__plus">+</span> Neue Sperrzeit</button>`;
    container.querySelectorAll("[data-id]").forEach((el) => {
      const open = () => Editor.edit(el.dataset.id);
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    container.querySelector("[data-add]").addEventListener("click", () => Manage.openSperrForm(Model.neueSperrzeit({ title: "" }), true));
  }
  return { render, leave() {} };
})();

// ---------- Ansicht Tagesnotizen ----------
const TagesnotizenView = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);
  const fmt = (iso) => S.parseDate(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  async function render(container) {
    const today = S.isoDate(new Date());
    const all = (await Store.list(Model.TYPES.TAGESNOTIZ)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const coming = all.filter((n) => n.date >= today);
    const past = all.filter((n) => n.date < today).reverse().slice(0, 10);
    const rows = (list) => `<ul class="wl">${list.map((n) => `
      <li class="wl-row" data-id="${esc(n.id)}" role="button" tabindex="0" style="--c:var(--text-3)">
        <span class="wl-time">${fmt(n.date)}</span><span class="wl-title">${esc(n.title)}</span>
      </li>`).join("")}</ul>`;
    container.innerHTML = `
      <p class="plan-hint">Kurze Notizen an einem Tag, z. B. „Semesterstart“. Sie blockieren keine Zeit.</p>
      ${coming.length ? `<h3 class="list-group">Kommend <span>${coming.length}</span></h3>${rows(coming)}` : ""}
      ${past.length ? `<h3 class="list-group">Vergangen <span>${past.length}</span></h3>${rows(past)}` : ""}
      ${all.length ? "" : `<section class="empty"><p class="empty__title">Noch keine Tagesnotizen</p>
        <p class="empty__text">Tippe auf „Neue Notiz“ oder im Plan auf „+“.</p></section>`}
      <button class="add-row" data-add><span class="add-row__plus">+</span> Neue Notiz</button>`;
    container.querySelectorAll("[data-id]").forEach((el) => el.addEventListener("click", () => Editor.edit(el.dataset.id)));
    container.querySelector("[data-add]").addEventListener("click", () => Manage.openNoteForm(Model.neueTagesnotiz({ date: today }), true));
  }
  return { render, leave() {} };
})();

// ---------- Ansicht Daten sichern / wiederherstellen ----------
const DatenView = (() => {
  const T = Model.TYPES;
  const NAMES = [[T.FEST, "fester Termin", "feste Termine"], [T.EINMALIG, "einmaliger Termin", "einmalige Termine"], [T.AUFGABE, "Aufgabe", "Aufgaben"], [T.ZIEL, "Ziel", "Ziele"], [T.SPERRZEIT, "Sperrzeit", "Sperrzeiten"], [T.TAGESNOTIZ, "Tagesnotiz", "Tagesnotizen"]];
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  async function exportFile() {
    const text = await Store.exportJSON();
    const name = `workflow-sicherung-${Schedule.isoDate(new Date())}.json`;
    const file = new File([text], name, { type: "application/json" });
    // Auf dem Handy: Teilen-Menü (z. B. „In Dateien sichern“), am Computer: Download
    const touch = matchMedia("(pointer: coarse)").matches;
    try {
      if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Workflow-Sicherung" });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      }
    } catch (err) {
      if (err && err.name === "AbortError") return; // Teilen abgebrochen
      Toast.show("Sichern hat nicht geklappt");
      return;
    }
    await Store.saveSettings({ letzteSicherung: new Date().toISOString() });
    Toast.show("Sicherung erstellt: " + name);
  }

  async function importFile(file) {
    let parsed;
    try { parsed = JSON.parse(await file.text()); } catch { Toast.show("Die Datei ist keine gültige Sicherung."); return; }
    if (!parsed || parsed.app !== "workflow" || !parsed.entries) { Toast.show("Das ist keine Sicherungsdatei dieser App."); return; }
    const n = Object.keys(parsed.entries).length;
    const when = parsed.exportedAt ? ` vom ${fmtDate(parsed.exportedAt)}` : "";
    if (!confirm(`Sicherung${when} mit ${n} Einträgen laden?\n\nDeine aktuellen Daten werden dabei ersetzt.`)) return;
    const before = await Store.exportJSON(); // für "Rückgängig"
    try {
      await Store.importJSON(JSON.stringify(parsed));
      Toast.show(`${n} Einträge geladen`, () => Store.importJSON(before));
    } catch (err) {
      Toast.show(err.message || "Laden hat nicht geklappt");
    }
  }

  async function render(container) {
    const all = await Store.list();
    const st = await Store.getSettings();
    const last = st.letzteSicherung;
    const daysSince = last ? Math.floor((Date.now() - new Date(last)) / 86400000) : null;
    const counts = NAMES.map(([t, one, many]) => { const c = all.filter((e) => e.type === t).length; return [c, c === 1 ? one : many]; }).filter(([c]) => c > 0);

    container.innerHTML = `
      <p class="plan-hint">Deine Daten liegen nur auf diesem Gerät. Mit einer Sicherungsdatei kannst du sie aufbewahren oder auf ein anderes Gerät bringen.</p>
      <div class="form-group settings">
        <div class="row row--stack">
          <span>${all.length} Einträge${counts.length ? `<small class="muted">${counts.map(([c, l]) => `${c} ${l}`).join(" · ")}</small>` : ""}</span>
        </div>
        <div class="row row--stack">
          <span class="${daysSince === null || daysSince > 14 ? "meta--warn" : "muted"}">${last ? `Letzte Sicherung: ${fmtDate(last)}${daysSince > 14 ? " – Zeit für eine neue!" : ""}` : "Noch keine Sicherung erstellt."}</span>
        </div>
      </div>
      <div class="form-group form-actions">
        <button type="button" class="action" data-export>Sicherung erstellen</button>
        <button type="button" class="action" data-import>Sicherung laden …</button>
        <input type="file" accept="application/json,.json" data-file hidden>
      </div>
      <div class="form-group form-actions">
        <button type="button" class="action action--danger" data-clear>Alle Daten löschen</button>
      </div>
      <p class="plan-hint plan-hint--small">Die Sicherung ist eine JSON-Datei. Sie bleibt bei dir, die App schickt sie nirgendwohin.</p>`;

    container.querySelector("[data-export]").addEventListener("click", exportFile);
    const input = container.querySelector("[data-file]");
    container.querySelector("[data-import]").addEventListener("click", () => input.click());
    input.addEventListener("change", () => { if (input.files[0]) importFile(input.files[0]); input.value = ""; });
    container.querySelector("[data-clear]").addEventListener("click", async () => {
      if (!confirm("Wirklich ALLE Daten auf diesem Gerät löschen?\n\nTipp: Erstelle vorher eine Sicherung.")) return;
      const before = await Store.exportJSON();
      await Store.clearAll();
      Toast.show("Alle Daten gelöscht", () => Store.importJSON(before));
    });
  }
  return { render, leave() {} };
})();
