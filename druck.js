// ============================================================
// Drucken / als PDF (Wunsch Niklas): Balkenplan (Bauzeitenplan) oder
// Netzplan in verschiedenen Formaten.
//  - Papier: A4 oder A3, quer oder hoch
//  - Balkenplan: „alles auf eine Seite“ (gestaucht) oder „gut lesbar“
//    (Zeitachse in Abschnitte geteilt, ein Abschnitt pro Seite)
//  - Netzplan: wird auf die Seitenbreite eingepasst
// Danach ist die Ansicht wieder wie vorher. Auf dem Handy: im Druckdialog
// „Als PDF sichern“ bzw. Teilen → Drucken.
// ============================================================

const Druck = (() => {
  const esc = (s) => Editor.esc(s);
  // bedruckbare Fläche in mm (Rand 10 mm)
  const PAPER = {
    "A4-quer": { w: 277, h: 190, css: "A4 landscape", label: "A4 quer" },
    "A4-hoch": { w: 190, h: 277, css: "A4 portrait", label: "A4 hoch" },
    "A3-quer": { w: 400, h: 277, css: "A3 landscape", label: "A3 quer" },
    "A3-hoch": { w: 277, h: 400, css: "A3 portrait", label: "A3 hoch" },
  };
  const PX_PER_MM = 96 / 25.4;
  const READ_DAY = 16; // Tagesbreite für „gut lesbar“
  let last = { paper: "A4-quer", fit: "eine" }; // zuletzt gewählt (pro Sitzung)

  function open(container, goal, res, mode) {
    const isGantt = mode === "balken";
    const what = isGantt ? (goal.area === "bau" ? "Bauzeitenplan" : "Balkenplan") : mode === "netz" ? "Netzplan" : "Übersicht";
    const seg = (name, val, label) => `<label class="seg"><input type="radio" name="${name}" value="${val}" ${last[name] === val ? "checked" : ""}><span>${label}</span></label>`;
    Editor.show(`
      <form class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head">
          <button type="button" class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title">${esc(what)} drucken</h2>
          <button type="submit" class="link-btn link-btn--strong">Drucken</button>
        </div>
        <div class="form-group">
          <div class="row row--stack">
            <span>Papier</span>
            <div class="segmented">${Object.entries(PAPER).map(([k, p]) => seg("paper", k, p.label)).join("")}</div>
          </div>
          ${isGantt ? `
          <div class="row row--stack">
            <span>Aufteilung</span>
            <div class="segmented">${seg("fit", "eine", "Alles auf eine Seite")}${seg("fit", "lesbar", "Gut lesbar, mehrere Seiten")}</div>
          </div>
          <p class="hint" data-fit-hint></p>` : `<p class="hint">Der ${esc(what)} wird auf die Seitenbreite eingepasst.</p>`}
        </div>
        <p class="hint hint--plain">Im Druckdialog kannst du statt zu drucken auch „Als PDF sichern“ wählen (Handy: Teilen → Drucken → mit zwei Fingern aufziehen → Teilen/Sichern).</p>
      </form>`);
    const form = Editor.sheetForm();
    form.querySelector("[data-close]").onclick = Editor.close;
    const hint = form.querySelector("[data-fit-hint]");
    const update = () => {
      if (!hint) return;
      const p = PAPER[form.querySelector('[name="paper"]:checked').value];
      const fit = form.querySelector('[name="fit"]:checked').value;
      const { from, to } = printRange(goal, res);
      const days = dayDiff(from, to) + 1;
      const perPage = segLen(days, Math.max(7, Math.floor((p.w * PX_PER_MM - Balkenplan.LABEL) / READ_DAY)));
      hint.textContent = fit === "eine"
        ? `${days} Tage auf einer Seitenbreite – gut für den Überblick, Tageszahlen entfallen.`
        : `${Math.ceil(days / perPage)} Abschnitt(e) mit je ca. ${perPage} Tagen, jeder auf einer eigenen Seite.`;
    };
    form.addEventListener("change", update);
    update();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      last = { paper: form.querySelector('[name="paper"]:checked').value, fit: isGantt ? form.querySelector('[name="fit"]:checked').value : last.fit };
      Editor.close();
      setTimeout(() => run(container, goal, res, mode, last), 250); // Blatt erst schließen
    });
  }

  const dayDiff = (a, b) => Math.round((Schedule.parseDate(b) - Schedule.parseDate(a)) / 86400000);
  // Druck-Zeitraum: ab Baubeginn (falls der in der Zukunft liegt), sonst wie am Bildschirm
  function printRange(goal, res) {
    const r = Balkenplan.range(goal, res);
    if (goal.startDate && goal.startDate > r.from) r.from = goal.startDate;
    return r;
  }
  // Abschnitte gleich lang (kein winziger Rest am Ende)
  function segLen(days, perPage) {
    const n = Math.ceil(days / perPage);
    return Math.ceil(days / n);
  }

  function run(container, goal, res, mode, opt) {
    const p = PAPER[opt.paper] || PAPER["A4-quer"];
    const pageW = Math.floor(p.w * PX_PER_MM) - 8;
    const undo = [];

    // Papierformat für den Druck festlegen
    const style = document.createElement("style");
    style.id = "print-page";
    style.textContent = `@page { size: ${p.css}; margin: 10mm; }`;
    document.head.appendChild(style);
    undo.push(() => style.remove());

    // Kopfzeile nur für den Ausdruck
    const head = document.createElement("p");
    head.className = "print-only print-head";
    head.textContent = `${goal.title} · gedruckt ${new Date().toLocaleDateString("de-DE")} · Workflow${goal.area === "bau" ? " · Berechnung nach DIN 69900, Dauern in Arbeitstagen" : ""}`;
    container.prepend(head);
    undo.push(() => head.remove());

    if (mode === "balken") {
      const wrap = container.querySelector("[data-gantt]");
      if (wrap) {
        const before = wrap.outerHTML;
        const { from, to } = printRange(goal, res);
        const days = dayDiff(from, to) + 1;
        const box = document.createElement("div");
        box.className = "print-gantt";
        if (opt.fit === "eine") {
          const dayW = Math.max(2, Math.min(Balkenplan.DAY0, Math.floor((pageW - Balkenplan.LABEL) / days)));
          box.innerHTML = Balkenplan.html(goal, res, { dayW, from, to });
        } else {
          const perPage = segLen(days, Math.max(7, Math.floor((pageW - Balkenplan.LABEL) / READ_DAY)));
          const parts = [];
          for (let i = 0; i < days; i += perPage) {
            const a = Schedule.isoDate(Schedule.addDays(Schedule.parseDate(from), i));
            const b = Schedule.isoDate(Schedule.addDays(Schedule.parseDate(from), Math.min(days - 1, i + perPage - 1)));
            parts.push(`<section class="print-seg"><p class="print-seg__head">Abschnitt ${parts.length + 1}: ${Schedule.parseDate(a).toLocaleDateString("de-DE")} – ${Schedule.parseDate(b).toLocaleDateString("de-DE")}</p>${Balkenplan.html(goal, res, { dayW: READ_DAY, from: a, to: b })}</section>`);
          }
          box.innerHTML = parts.join("");
        }
        wrap.replaceWith(box);
        undo.push(() => {
          const t = document.createElement("div");
          t.innerHTML = before;
          box.replaceWith(t.firstElementChild);
          Balkenplan.wire(container, goal, res);
        });
      }
    }
    if (mode === "netz") {
      const canvas = container.querySelector(".nz-canvas");
      if (canvas) {
        const w = canvas.offsetWidth;
        const z = Math.min(1, pageW / w);
        const old = canvas.style.zoom;
        canvas.style.zoom = z;
        undo.push(() => { canvas.style.zoom = old; });
      }
    }

    document.body.classList.add("printing");
    undo.push(() => document.body.classList.remove("printing"));
    const restore = () => {
      window.removeEventListener("afterprint", restore);
      undo.reverse().forEach((fn) => fn());
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return { open };
})();
