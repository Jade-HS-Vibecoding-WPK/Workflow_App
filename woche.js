// ============================================================
// Ansicht "Woche"
//  - Stundenplan: 7 Spalten (Mo–So) mit Stundenraster, alles drin
//  - Liste: pro Tag untereinander, zum Abarbeiten
// Adresse: #woche (aktuelle Woche) oder #woche/2026-11-23 (Woche ab diesem Montag)
// ============================================================

const WocheView = (() => {
  const S = Schedule;
  const HOUR_PX = 40;
  const WD_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const esc = (s) => Editor.esc(s);
  let nowTimer = null;

  // Kalenderwoche nach ISO-Norm
  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  }

  function colorOf(b) {
    if (b.kind === "fest") return "var(--cat-fest)";
    if (b.kind === "einmalig") return "var(--cat-einmalig)";
    if (b.kind === "sperr") return "var(--cat-sperr)";
    return b.color || "var(--accent)";
  }

  // ---------- Stundenplan ----------
  function blockHtml(b, iso) {
    const top = (b.startMin / 60) * HOUR_PX;
    const height = Math.max(((b.endMin - b.startMin) / 60) * HOUR_PX - 1, 14);
    if (b.kind === "sperr") {
      return `<div class="wblock wblock--sperr" style="top:${top}px;height:${height}px" title="${esc(b.title)}"></div>`;
    }
    const cols = b.cols || 1;
    const short = b.endMin - b.startMin < 50; // zu niedrig für zwei Zeilen → Zeit und Titel nebeneinander
    const cls = ["wblock", short ? "wblock--short" : "", b.option ? "wblock--option" : "", b.cancelled ? "wblock--cancelled" : "", b.done ? "wblock--done" : ""].join(" ");
    return `
      <div class="${cls}" role="button" tabindex="0" data-id="${esc(b.id)}" data-date="${iso}" ${b.slotId ? `data-slot="${esc(b.slotId)}" data-sub="${esc(b.subgoalId || "")}"` : ""}
        style="top:${top}px;height:${height}px;left:calc(${(b.col || 0) / cols} * 100%);width:calc(${1 / cols} * 100% - 1px);--c:${colorOf(b)}"
        aria-label="${esc(b.title)}, ${b.start} bis ${b.end}${b.cancelled ? ", abgesagt" : ""}">
        <span class="wblock__time">${b.start}</span>
        <span class="wblock__title">${esc(b.title)}</span>
      </div>`;
  }

  function gridHtml(days, entries, todayIso) {
    const hours = Array.from({ length: 24 }, (_, h) => `<div class="whour" style="height:${HOUR_PX}px"><span>${h}</span></div>`).join("");
    const cols = days.map((d) => {
      const iso = S.isoDate(d);
      const plan = S.dayPlan(entries, d);
      const sperr = plan.timed.filter((b) => b.kind === "sperr");
      const items = S.layoutColumns(plan.timed.filter((b) => b.kind !== "sperr"));
      const now = new Date();
      const nowLine = iso === todayIso
        ? `<div class="now-line now-line--week" id="week-now" style="top:${((now.getHours() + now.getMinutes() / 60) * HOUR_PX)}px"><span></span></div>` : "";
      return `
        <div class="wcol ${iso === todayIso ? "wcol--today" : ""}" data-col="${iso}">
          ${sperr.map((b) => blockHtml(b, iso)).join("")}
          ${items.map((b) => blockHtml(b, iso)).join("")}
          ${nowLine}
        </div>`;
    }).join("");
    return `
      <div class="week-grid" style="height:${24 * HOUR_PX}px">
        <div class="whours">${hours}</div>
        <div class="wcols">${cols}</div>
      </div>`;
  }

  // Ganztägiges und Tagesnotizen als kleine Streifen über den Spalten
  function topStrip(days, entries) {
    const cells = days.map((d) => {
      const plan = S.dayPlan(entries, d);
      const items = [
        ...plan.allDay.map((a) => a.kind === "feiertag"
          ? `<span class="wtag wtag--holiday" title="${esc(a.title)}">${esc(a.title)}</span>`
          : `<span class="wtag" style="--c:${a.color || "var(--cat-einmalig)"}" data-id="${esc(a.id)}" data-date="${S.isoDate(d)}" role="button" tabindex="0">${esc(a.title)}</span>`),
        ...plan.notes.map((n) => `<span class="wtag wtag--note" data-id="${esc(n.id)}" data-date="${S.isoDate(d)}" role="button" tabindex="0">${esc(n.title)}</span>`),
      ];
      return `<div class="wtop">${items.join("")}</div>`;
    });
    return cells.some((c) => c.includes("wtag")) ? `<div class="week-top"><span></span>${cells.join("")}</div>` : "";
  }

  // ---------- Liste zum Abarbeiten ----------
  function listHtml(days, entries, todayIso) {
    const tasks = entries.filter((e) => e.type === Model.TYPES.AUFGABE && !e.done);
    const goals = entries.filter((e) => e.type === Model.TYPES.ZIEL && !e.done);

    return days.map((d) => {
      const iso = S.isoDate(d);
      const plan = S.dayPlan(entries, d);
      const rows = [];
      for (const a of plan.allDay) {
        if (a.kind === "feiertag") {
          rows.push(`<li class="wl-row wl-row--holiday" style="--c:var(--holiday)"><span class="wl-time">Feiertag</span><span class="wl-title">${esc(a.title)}</span></li>`);
          continue;
        }
        rows.push(`<li class="wl-row" data-id="${esc(a.id)}" data-date="${iso}" role="button" tabindex="0" style="--c:${a.color || "var(--cat-einmalig)"}">
          <span class="wl-time">${a.kind === "vorgang" ? "Vorgang" : "ganztägig"}</span><span class="wl-title">${esc(a.title)}${a.kind === "vorgang" && a.sub ? `<small>${esc(a.sub)}</small>` : ""}</span></li>`);
      }
      for (const b of plan.timed.filter((x) => x.kind !== "sperr")) {
        rows.push(`<li class="wl-row ${b.cancelled ? "wl-row--cancelled" : ""} ${b.option ? "wl-row--option" : ""}" data-id="${esc(b.id)}" data-date="${iso}" ${b.slotId ? `data-slot="${esc(b.slotId)}" data-sub="${esc(b.subgoalId || "")}"` : ""} role="button" tabindex="0" style="--c:${colorOf(b)}">
          <span class="wl-time">${b.start}–${b.end}</span>
          <span class="wl-title">${esc(b.title)}${b.option ? "<small>Vorschlag, noch nicht bestätigt</small>" : b.sub ? `<small>${esc(b.sub)}</small>` : ""}</span></li>`);
      }
      // Fällig an diesem Tag: Aufgaben, Ziele, Zwischen-Deadlines
      const due = [];
      for (const t of tasks) if (t.deadline === iso) due.push({ id: t.id, title: t.title, color: t.color, task: true });
      for (const g of goals) {
        if (g.deadline === iso) due.push({ id: g.id, title: `Ziel: ${g.title}`, color: g.color });
        for (const sg of g.subgoals) if (!sg.done && sg.deadline === iso) due.push({ id: g.id, title: `${sg.title} (${g.title})`, color: g.color });
      }
      for (const x of due) {
        rows.push(`<li class="wl-row wl-row--due" style="--c:${x.color}">
          ${x.task ? `<button class="task__check" data-check="${esc(x.id)}" aria-label="${esc(x.title)} abhaken"></button>` : `<span class="wl-flag" aria-hidden="true">⚑</span>`}
          <span class="wl-title" data-id="${esc(x.id)}" role="button" tabindex="0">${esc(x.title)}<small>fällig</small></span></li>`);
      }
      const label = d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
      return `
        <h3 class="list-group ${iso === todayIso ? "list-group--today" : ""}">${label}${iso === todayIso ? " · heute" : ""}</h3>
        ${rows.length ? `<ul class="wl">${rows.join("")}</ul>` : `<p class="wl-empty">frei</p>`}`;
    }).join("");
  }

  // ---------- Zeichnen ----------
  async function render(container, { param, scrollToNow }) {
    const settings = await Store.getSettings();
    const mode = settings.wocheModus || "plan";
    const today = new Date();
    const todayIso = S.isoDate(today);
    const monday = param ? S.startOfWeek(S.parseDate(param)) : S.startOfWeek(today);
    const days = Array.from({ length: 7 }, (_, i) => S.addDays(monday, i));
    const sunday = days[6];
    const entries = await Store.list();
    const isThisWeek = S.isoDate(monday) === S.isoDate(S.startOfWeek(today));
    const range = `${monday.getDate()}.${monday.getMonth() !== sunday.getMonth() ? (monday.getMonth() + 1) + "." : ""}–${sunday.toLocaleDateString("de-DE", { day: "numeric", month: "short" })}`;

    const dayHead = days.map((d) => {
      const iso = S.isoDate(d);
      const hol = typeof Holidays !== "undefined" && Holidays.on(iso);
      return `<div class="whead ${iso === todayIso ? "whead--today" : ""} ${hol ? "whead--holiday" : ""}" ${hol ? `title="${esc(hol)}"` : ""}><span>${WD_SHORT[d.getDay()]}</span><b>${d.getDate()}</b></div>`;
    }).join("");

    container.innerHTML = `
      <div class="week-nav">
        <a class="icon-btn" href="#woche/${S.isoDate(S.addDays(monday, -7))}" aria-label="Vorherige Woche">‹</a>
        <div class="week-nav__label"><b>KW ${isoWeek(monday)}</b> · ${range}</div>
        <a class="icon-btn" href="#woche/${S.isoDate(S.addDays(monday, 7))}" aria-label="Nächste Woche">›</a>
      </div>
      <div class="week-tools">
        <div class="segmented" role="radiogroup" aria-label="Darstellung">
          <label class="seg"><input type="radio" name="wmode" value="plan" ${mode === "plan" ? "checked" : ""}><span>Stundenplan</span></label>
          <label class="seg"><input type="radio" name="wmode" value="liste" ${mode === "liste" ? "checked" : ""}><span>Liste</span></label>
        </div>
        ${isThisWeek ? "" : `<a class="link-btn" href="#woche">Diese Woche</a>`}
      </div>
      ${mode === "plan" ? `
        <div class="week">
          <div class="week-head"><span></span>${dayHead}</div>
          ${topStrip(days, entries)}
          ${gridHtml(days, entries, todayIso)}
        </div>
        <p class="plan-hint plan-hint--small">Leere Stelle antippen = neuer Termin an diesem Tag</p>`
      : `<div class="week-list">${listHtml(days, entries, todayIso)}</div>`}`;

    // Umschalten Stundenplan / Liste (wird gemerkt)
    container.querySelectorAll('[name="wmode"]').forEach((r) => {
      r.addEventListener("change", () => Store.saveSettings({ wocheModus: r.value }));
    });

    // Einträge antippen → bearbeiten
    container.querySelectorAll("[data-id]").forEach((el) => {
      const open = (e) => { e.stopPropagation(); Editor.edit(el.dataset.id, el.dataset.date || el.closest("[data-date]")?.dataset.date, el.dataset.slot, el.dataset.sub); };
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); } });
    });
    container.querySelectorAll("[data-check]").forEach((btn) => {
      btn.addEventListener("click", () => Tasks.toggleDone(btn.dataset.check));
    });

    // Leere Stelle im Stundenplan antippen → neuer Termin zu dieser Uhrzeit
    container.querySelectorAll(".wcol").forEach((col) => {
      col.addEventListener("click", (e) => {
        if (e.target !== col) return;
        const y = e.clientY - col.getBoundingClientRect().top;
        const startMin = Math.max(0, Math.min(23, Math.floor(y / HOUR_PX))) * 60;
        Editor.chooseNew(S.parseDate(col.dataset.col), startMin);
      });
    });

    // Rote Linie nachrücken
    clearInterval(nowTimer);
    nowTimer = setInterval(() => {
      const line = document.getElementById("week-now");
      if (!line) return clearInterval(nowTimer);
      const n = new Date();
      line.style.top = (n.getHours() + n.getMinutes() / 60) * HOUR_PX + "px";
    }, 60000);

    // Beim Öffnen: zur aktuellen Uhrzeit (diese Woche) bzw. 7 Uhr springen
    if (scrollToNow && mode === "plan") {
      const grid = container.querySelector(".week-grid");
      const h = isThisWeek ? Math.max(today.getHours() - 2, 0) : 7;
      const y = grid.getBoundingClientRect().top + window.scrollY + h * HOUR_PX - 120;
      window.scrollTo(0, Math.max(0, y));
    }
  }

  function leave() { clearInterval(nowTimer); }

  return { render, leave };
})();
