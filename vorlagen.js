// ============================================================
// Vorlagen für Ziele und Projekte
//
// Eine Vorlage ist eine Liste von Unterzielen/Vorgängen mit
// Dauer, Gewerk und Abhängigkeiten. "Anwenden" legt daraus ein
// ganz normales Ziel/Projekt an – danach ist alles frei änderbar.
// Eigene Vorlagen: auf der Ziel-/Projektseite "Als Vorlage speichern".
// Gespeichert in den Einstellungen (Store), nur auf diesem Gerät.
// ============================================================

const Templates = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);
  const EA = "ende-anfang", AA = "anfang-anfang";

  // ---------- Fertige Vorlagen ----------
  // d = Arbeitstage (Baustelle), h = Stunden (privat), after = Vorgänger [key, Art, Wartezeit]
  const BUILTIN = [
    {
      id: "efh", area: "bau", name: "Einfamilienhaus – Bauablauf", color: "#d85a30",
      text: "21 Vorgänge vom Baustelleneinrichten bis zur Übergabe, mit Gewerken, Aushärte- und Trockenzeiten.",
      items: [
        { k: "einr", t: "Baustelleneinrichtung", g: "Bauleitung", d: 2 },
        { k: "erd", t: "Erdarbeiten / Aushub", g: "Tiefbau", d: 3, after: [["einr"]] },
        { k: "bpl", t: "Fundamente und Bodenplatte", g: "Rohbau", d: 5, after: [["erd"]] },
        { k: "meg", t: "Mauerwerk EG", g: "Rohbau", d: 10, after: [["bpl", EA, 7]] }, // Bodenplatte aushärten
        { k: "deg", t: "Decke über EG", g: "Rohbau", d: 4, after: [["meg"]] },
        { k: "mdg", t: "Mauerwerk DG", g: "Rohbau", d: 7, after: [["deg", EA, 3]] },
        { k: "dst", t: "Dachstuhl", g: "Zimmerei", d: 4, after: [["mdg"]] },
        { k: "dach", t: "Dacheindeckung", g: "Dachdecker", d: 5, after: [["dst"]] },
        { k: "fen", t: "Fenster und Außentüren", g: "Fensterbauer", d: 3, after: [["dach"]] },
        { k: "elr", t: "Elektro-Rohinstallation", g: "Elektro", d: 6, after: [["fen"]] },
        { k: "shk", t: "Sanitär/Heizung-Rohinstallation", g: "Sanitär/Heizung (SHK)", d: 8, after: [["elr", AA, 2]] },
        { k: "fas", t: "Fassade / Außenputz", g: "Putzer", d: 8, after: [["fen"]] },
        { k: "ipu", t: "Innenputz", g: "Putzer", d: 8, after: [["elr"], ["shk"]] },
        { k: "est", t: "Estrich", g: "Estrichleger", d: 3, after: [["ipu", EA, 2]] },
        { k: "tro", t: "Trockenbau DG", g: "Trockenbau", d: 6, after: [["ipu"]] },
        { k: "fli", t: "Fliesen", g: "Fliesenleger", d: 6, after: [["est", EA, 21]] }, // Estrich trocknen (Belegreife)
        { k: "mal", t: "Malerarbeiten", g: "Maler", d: 5, after: [["tro"], ["fli"]] },
        { k: "bod", t: "Bodenbeläge", g: "Bodenleger", d: 4, after: [["mal"]] },
        { k: "end", t: "Endmontage Elektro und Sanitär", g: "Elektro", d: 4, after: [["bod"]] },
        { k: "aus", t: "Außenanlagen", g: "Garten- und Landschaftsbau", d: 8, after: [["fas"]] },
        { k: "abn", t: "Abnahme und Übergabe", g: "Bauleitung", d: 1, after: [["end"], ["aus"]] },
      ],
    },
    {
      id: "uni", area: "privat", name: "Uni-Abgabe (Architektur)", color: "#7f77dd",
      text: "Von der Recherche bis zum Druck – mit geschätzten Stunden und sinnvoller Reihenfolge.",
      items: [
        { k: "rec", t: "Recherche und Ortsanalyse", h: 4 },
        { k: "ent", t: "Entwurfsskizzen", h: 6, after: [["rec"]] },
        { k: "gr", t: "Grundrisse", h: 10, after: [["ent"]] },
        { k: "lp", t: "Lageplan", h: 3, after: [["ent"]] },
        { k: "sa", t: "Schnitte und Ansichten", h: 8, after: [["gr"]] },
        { k: "mod", t: "Modell bauen", h: 12, after: [["gr"]] },
        { k: "pl", t: "Plakat-Layout", h: 6, after: [["sa"], ["lp"]] },
        { k: "dr", t: "Druck und Abgabe vorbereiten", h: 2, after: [["pl"], ["mod"]] },
      ],
    },
  ];

  async function own() {
    return ((await Store.getSettings()).vorlagen || []);
  }

  // Ziel/Projekt aus einer Vorlage bauen (neue IDs, Abhängigkeiten nur über IDs)
  function build(tpl, { title, deadline, startDate }) {
    const ids = Object.fromEntries(tpl.items.map((it) => [it.k, Model.newId()]));
    const bau = tpl.area === "bau";
    const subgoals = tpl.items.map((it, i) => Model.neuesUnterziel({
      id: ids[it.k], title: it.t, order: i,
      mode: bau || it.d ? "dauer" : "aufwand",
      durationDays: it.d || 1, estimateHours: it.h || 1,
      assignee: it.g || Model.OWNER_LOCAL,
      dependencies: (it.after || []).filter(([k]) => ids[k]).map(([k, type, lag]) => ({ fromId: ids[k], type: type || EA, lagDays: lag || 0 })),
    }));
    return Model.neuesZiel({ title, color: tpl.color, deadline, startDate: startDate || null, subgoals, area: tpl.area, areaFixed: true });
  }

  // Vorschlag für die Fertigstellung: frühestes Ende + etwas Puffer
  // entries: eigene Termine – privat rechnet der Vorschlag mit der echten freien
  // Zeit und legt die Deadline nicht in einen Urlaub (Testrunde 3)
  function suggestDeadline(tpl, startDate, entries = []) {
    const bau = tpl.area === "bau";
    const probe = build(tpl, { title: "x", deadline: null, startDate });
    probe.id = "probe-" + Date.now();
    const res = CPM.computeGoal(probe, bau ? [] : entries);
    if (res.cycle) return S.isoDate(S.addDays(new Date(), 30));
    let iso = S.isoDate(S.addDays(S.parseDate(res.projectEndDate), bau ? 14 : 3));
    if (!bau) {
      for (let k = 0; k < 10; k++) {
        const v = entries.find((e) => e.type === Model.TYPES.EINMALIG && e.allDay && e.date <= iso && iso <= (e.endDate || e.date));
        if (!v) break;
        iso = S.isoDate(S.addDays(S.parseDate(v.endDate || v.date), 1)); // erster Tag nach dem Urlaub
      }
    }
    return iso;
  }

  // ---------- Auswahl ----------
  async function choose() {
    const area = Store.getArea();
    const mine = (await own()).filter((t) => t.area === area);
    const list = [...BUILTIN.filter((t) => t.area === area), ...mine];
    Editor.show(`
      <div class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet__head">
          <button class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title">Vorlage wählen</h2>
          <span class="sheet__spacer"></span>
        </div>
        <div class="choice-list">
          ${list.map((t) => `
            <div class="tpl-row">
              <button class="choice" data-tpl="${esc(t.id)}">
                <span class="choice__dot" style="background:${t.color}"></span>
                <span class="choice__text"><b>${esc(t.name)}</b><small>${esc(t.text || `${t.items.length} ${area === "bau" ? "Vorgänge" : "Unterziele"} · eigene Vorlage`)}</small></span>
              </button>
              ${t.own ? `<button class="link-btn tpl-del" data-del="${esc(t.id)}" aria-label="Vorlage ${esc(t.name)} löschen">Löschen</button>` : ""}
            </div>`).join("")}
        </div>
        <p class="hint hint--plain">Eigene Vorlagen: auf der Seite eines ${area === "bau" ? "Projekts" : "Ziels"} „Als Vorlage speichern“.</p>
      </div>`);
    const layer = document.querySelector(".sheet-layer");
    layer.querySelector("[data-close]").onclick = Editor.close;
    layer.querySelectorAll("[data-tpl]").forEach((b) => { b.onclick = () => applyForm(list.find((t) => t.id === b.dataset.tpl)); });
    layer.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = async () => {
        const t = mine.find((x) => x.id === b.dataset.del);
        if (!t || !confirm(`Vorlage „${t.name}“ löschen?`)) return;
        const before = await own(); // für "Rückgängig"
        await Store.saveSettings({ vorlagen: before.filter((x) => x.id !== t.id) });
        choose();
        Toast.show(`Vorlage „${t.name}“ gelöscht`, async () => { await Store.saveSettings({ vorlagen: before }); if (document.querySelector(".sheet-layer")) choose(); });
      };
    });
  }

  // ---------- Name, Baubeginn, Fertigstellung → anlegen ----------
  async function applyForm(tpl) {
    if (!tpl) return;
    const bau = tpl.area === "bau";
    const entries = bau ? [] : await Store.list(null, { area: "privat" });
    // Baubeginn: nächster Montag
    const mon = S.addDays(S.startOfWeek(new Date()), 7);
    const start = bau ? S.isoDate(mon) : null;
    Editor.show(`
      <form class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head">
          <button type="button" class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title"><span class="choice__dot" style="background:${tpl.color}"></span>${esc(tpl.name)}</h2>
          <button type="submit" class="link-btn link-btn--strong">Anlegen</button>
        </div>
        <div class="form-group">
          <input class="title-input" name="title" value="${esc(bau ? "Einfamilienhaus Musterweg 1" : tpl.name)}" autocomplete="off">
        </div>
        <div class="form-group">
          ${bau ? `<label class="row"><span>Baubeginn</span><input type="date" name="startDate" value="${start}"></label>` : ""}
          <label class="row"><span>${bau ? "Fertigstellung bis" : "Deadline"}</span><input type="date" name="deadline" value="${suggestDeadline(tpl, start, entries)}"></label>
          <p class="hint" data-hint>Vorschlag: frühestes Ende plus ${bau ? "2 Wochen" : "3 Tage"} Puffer${bau ? "" : ", gerechnet mit deiner freien Zeit, nicht im Urlaub"}.</p>
        </div>
        <p class="hint hint--plain">Danach ist alles frei änderbar: ${bau ? "Vorgänge, Dauern, Gewerke, Wartezeiten" : "Unterziele, Stunden, Reihenfolge"}.</p>
        <p class="form-error" role="alert" hidden></p>
      </form>`);
    const form = Editor.sheetForm();
    form.querySelector("[data-close]").onclick = Editor.close;
    if (form.elements.startDate) form.elements.startDate.addEventListener("change", () => {
      form.elements.deadline.value = suggestDeadline(tpl, form.elements.startDate.value || null);
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = form.querySelector(".form-error");
      const title = form.elements.title.value.trim();
      const deadline = form.elements.deadline.value;
      const startDate = form.elements.startDate ? form.elements.startDate.value || null : null;
      const fail = (m) => { err.textContent = m; err.hidden = false; };
      if (!title) return fail("Bitte gib einen Titel ein.");
      if (!deadline) return fail("Bitte wähle einen Termin.");
      if (startDate && startDate > deadline) return fail("Der Baubeginn liegt nach der Fertigstellung.");
      const goal = build(tpl, { title, deadline, startDate });
      await Store.save(goal);
      Editor.close();
      location.hash = "#ziel/" + encodeURIComponent(goal.id);
      Toast.show(`„${title}“ aus Vorlage angelegt`);
    });
  }

  // ---------- Eigene Vorlage aus einem Ziel/Projekt ----------
  function saveFromGoal(goal) {
    const subs = [...(goal.subgoals || [])].sort((a, b) => a.order - b.order);
    if (!subs.length) { Toast.show("Erst Unterziele bzw. Vorgänge anlegen"); return; }
    Editor.show(`
      <form class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head">
          <button type="button" class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title">Als Vorlage speichern</h2>
          <button type="submit" class="link-btn link-btn--strong">Sichern</button>
        </div>
        <div class="form-group">
          <input class="title-input" name="name" value="${esc(goal.title)}" autocomplete="off" autofocus>
        </div>
        <p class="hint hint--plain">Gespeichert werden ${subs.length} ${goal.area === "bau" ? "Vorgänge" : "Unterziele"} mit Dauer, ${goal.area === "bau" ? "Gewerk, " : ""}Reihenfolge und Abhängigkeiten – ohne Fortschritt und Termine.</p>
      </form>`);
    const form = Editor.sheetForm();
    form.querySelector("[data-close]").onclick = Editor.close;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim() || goal.title;
      const key = Object.fromEntries(subs.map((x, i) => [x.id, "s" + i]));
      const tpl = {
        id: "own-" + Model.newId(), own: true, area: goal.area || "privat", name, color: goal.color,
        items: subs.map((x) => ({
          k: key[x.id], t: x.title,
          ...(x.mode === "dauer" ? { d: x.durationDays } : { h: x.estimateHours }),
          ...(x.assignee && x.assignee !== Model.OWNER_LOCAL ? { g: x.assignee } : {}),
          after: (x.dependencies || []).filter((d) => key[d.fromId]).map((d) => [key[d.fromId], d.type, d.lagDays || 0]),
        })),
      };
      await Store.saveSettings({ vorlagen: [...(await own()), tpl] });
      Editor.close();
      Toast.show(`Vorlage „${name}“ gespeichert`);
    });
  }

  return { choose, saveFromGoal, build, BUILTIN };
})();
