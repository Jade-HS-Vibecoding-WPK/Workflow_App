// ============================================================
// Ansicht "Kalender": Monatsübersicht (Adresse #kalender/JJJJ-MM-TT)
//
// Jeder Tag zeigt kleine Punkte für Termine und Vorschläge,
// Fähnchen für Deadlines, rote Zahl für Feiertage, einen Streifen
// für ganztägige Termine (z. B. Urlaub) und ein Zeichen für
// Tagesnotizen. Tag antippen = Liste des Tages darunter,
// "Tagesplan ›" öffnet den Tag in "Heute".
// ============================================================

const KalenderView = (() => {
  const S = Schedule;
  const T = Model.TYPES;
  const esc = (s) => Editor.esc(s);
  const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  let selected = null; // gewählter Tag (bleibt beim Neuzeichnen)

  function colorOf(b) {
    if (b.kind === "fest") return "var(--cat-fest)";
    if (b.kind === "einmalig") return "var(--cat-einmalig)";
    return b.color || "var(--accent)";
  }

  // Alles, was an einem Tag fällig ist (Aufgaben, Ziele, Zwischen-Deadlines)
  function dueOn(entries, iso) {
    const out = [];
    for (const e of entries) {
      if (e.done) continue;
      if (e.type === T.AUFGABE && e.deadline === iso) out.push({ id: e.id, title: e.title, color: e.color, task: true });
      if (e.type === T.ZIEL) {
        if (e.deadline === iso) out.push({ id: e.id, title: `Ziel: ${e.title}`, color: e.color, goal: true });
        for (const sg of e.subgoals || []) if (!sg.done && sg.deadline === iso) out.push({ id: e.id, title: `${sg.title} (${e.title})`, color: e.color, goal: true });
      }
    }
    return out;
  }

  function cellHtml(d, entries, monthIdx, todayIso) {
    const iso = S.isoDate(d);
    const plan = S.dayPlan(entries, d);
    const holiday = plan.allDay.find((a) => a.kind === "feiertag");
    const allDay = plan.allDay.filter((a) => a.kind !== "feiertag");
    const timed = plan.timed.filter((b) => b.kind !== "sperr" && !b.cancelled);
    const due = dueOn(entries, iso);
    const dots = timed.slice(0, 4).map((b) => `<i class="mdot ${b.option ? "mdot--option" : ""}" style="--c:${colorOf(b)}"></i>`).join("");
    const cls = ["mcell",
      d.getMonth() !== monthIdx ? "mcell--other" : "",
      iso === todayIso ? "mcell--today" : "",
      iso === selected ? "mcell--sel" : "",
      holiday ? "mcell--holiday" : "",
      allDay.length ? "mcell--allday" : ""].join(" ");
    const label = [
      d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }),
      holiday ? holiday.title : "", allDay.map((a) => a.title).join(", "),
      timed.length ? `${timed.length} Einträge` : "", due.length ? `${due.length} fällig` : "",
    ].filter(Boolean).join(", ");
    return `
      <button class="${cls}" data-day="${iso}" aria-label="${esc(label)}" ${iso === selected ? 'aria-pressed="true"' : ""}>
        <span class="mcell__num">${d.getDate()}</span>
        ${allDay.length ? `<span class="mcell__bar" style="--c:${allDay[0].color || "var(--cat-einmalig)"}">${allDay.length > 1 ? `${allDay.length}× ` : ""}${esc(allDay[0].title)}</span>` : ""}
        <span class="mcell__marks">
          ${dots}${timed.length > 4 ? `<i class="mplus">+</i>` : ""}
          ${due.length ? `<i class="mflag" style="--c:${due[0].color}">⚑</i>` : ""}
          ${plan.notes.length ? `<i class="mnote" aria-hidden="true">✎</i>` : ""}
        </span>
      </button>`;
  }

  // Liste des gewählten Tages unter dem Kalender
  function agendaHtml(entries, iso) {
    const d = S.parseDate(iso);
    const plan = S.dayPlan(entries, d);
    const rows = [];
    for (const n of plan.notes) rows.push(`<li class="wl-row" data-id="${esc(n.id)}" role="button" tabindex="0" style="--c:var(--text-3)"><span class="wl-time">Notiz</span><span class="wl-title">${esc(n.title)}</span></li>`);
    for (const a of plan.allDay) {
      rows.push(a.kind === "feiertag"
        ? `<li class="wl-row wl-row--holiday" style="--c:var(--holiday)"><span class="wl-time">Feiertag</span><span class="wl-title">${esc(a.title)}</span></li>`
        : `<li class="wl-row" data-id="${esc(a.id)}" data-date="${iso}" role="button" tabindex="0" style="--c:${a.color || "var(--cat-einmalig)"}"><span class="wl-time">${a.kind === "vorgang" ? "Vorgang" : "ganztägig"}</span><span class="wl-title">${esc(a.title)}${a.sub && a.kind === "vorgang" ? `<small>${esc(a.sub)}</small>` : ""}</span></li>`);
    }
    for (const b of plan.timed.filter((x) => x.kind !== "sperr")) {
      rows.push(`<li class="wl-row ${b.cancelled ? "wl-row--cancelled" : ""} ${b.option ? "wl-row--option" : ""}" data-id="${esc(b.id)}" data-date="${iso}" ${b.slotId ? `data-slot="${esc(b.slotId)}" data-sub="${esc(b.subgoalId || "")}"` : ""} role="button" tabindex="0" style="--c:${colorOf(b)}">
        <span class="wl-time">${b.start}–${b.end}</span>
        <span class="wl-title">${esc(b.title)}${b.option ? "<small>Vorschlag, noch nicht bestätigt</small>" : b.sub ? `<small>${esc(b.sub)}</small>` : ""}</span></li>`);
    }
    for (const x of dueOn(entries, iso)) {
      rows.push(`<li class="wl-row wl-row--due" data-id="${esc(x.id)}" role="button" tabindex="0" style="--c:${x.color}">
        <span class="wl-flag" aria-hidden="true">⚑</span><span class="wl-title">${esc(x.title)}<small>fällig</small></span></li>`);
    }
    return `
      <div class="agenda-head">
        <h3 class="list-group">${d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</h3>
        <a class="link-btn" href="#heute/${iso}">Tagesplan ›</a>
      </div>
      ${rows.length ? `<ul class="wl">${rows.join("")}</ul>` : `<p class="wl-empty">Nichts eingetragen – frei.</p>`}`;
  }

  async function render(container, { param }) {
    const today = new Date();
    const todayIso = S.isoDate(today);
    const base = param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? S.parseDate(param) : today;
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const monthIdx = first.getMonth();
    // Auswahl: im gezeigten Monat bleiben, sonst heute bzw. der 1.
    const inMonth = (iso) => iso && S.parseDate(iso).getMonth() === monthIdx && S.parseDate(iso).getFullYear() === first.getFullYear();
    if (param && inMonth(param)) selected = param;
    if (!inMonth(selected)) selected = inMonth(todayIso) ? todayIso : S.isoDate(first);

    const start = S.startOfWeek(first);
    const last = new Date(first.getFullYear(), monthIdx + 1, 0);
    const weeks = Math.ceil((Math.round((last - start) / 86400000) + 1) / 7);
    const entries = await Store.list();
    const cells = [];
    for (let i = 0; i < weeks * 7; i++) cells.push(cellHtml(S.addDays(start, i), entries, monthIdx, todayIso));

    const prev = S.isoDate(new Date(first.getFullYear(), monthIdx - 1, 1));
    const next = S.isoDate(new Date(first.getFullYear(), monthIdx + 1, 1));
    const isThisMonth = inMonth(todayIso);

    container.innerHTML = `
      <div class="week-nav">
        <a class="icon-btn" href="#kalender/${prev}" aria-label="Vorheriger Monat">‹</a>
        <div class="week-nav__label"><b>${first.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</b></div>
        <a class="icon-btn" href="#kalender/${next}" aria-label="Nächster Monat">›</a>
      </div>
      ${isThisMonth ? "" : `<div class="week-tools"><span></span><a class="link-btn" href="#kalender">Heute</a></div>`}
      <div class="month">
        <div class="month__head">${WD.map((w) => `<span>${w}</span>`).join("")}</div>
        <div class="month__grid">${cells.join("")}</div>
      </div>
      <p class="month-legend">
        <span><i class="mdot" style="--c:var(--cat-fest)"></i>fest</span>
        <span><i class="mdot" style="--c:var(--cat-einmalig)"></i>einmalig</span>
        <span><i class="mdot mdot--option" style="--c:var(--accent)"></i>Vorschlag</span>
        <span><i class="mflag" style="--c:var(--text-2)">⚑</i>fällig</span>
        <span><i class="mnote">✎</i>Notiz</span>
      </p>
      <section class="agenda">${agendaHtml(entries, selected)}</section>`;

    // Tag antippen → Liste darunter (zweimal antippen → Tagesplan)
    container.querySelectorAll("[data-day]").forEach((el) => {
      el.addEventListener("click", () => {
        const iso = el.dataset.day;
        if (iso === selected) { location.hash = "#heute/" + iso; return; }
        if (!inMonth(iso)) { location.hash = "#kalender/" + iso; return; }
        selected = iso;
        container.querySelectorAll(".mcell--sel").forEach((c) => { c.classList.remove("mcell--sel"); c.removeAttribute("aria-pressed"); });
        el.classList.add("mcell--sel");
        el.setAttribute("aria-pressed", "true");
        container.querySelector(".agenda").innerHTML = agendaHtml(entries, iso);
        wireAgenda(container);
      });
    });
    wireAgenda(container);
    attachSwipe(container, prev, next);
  }

  function wireAgenda(container) {
    container.querySelectorAll(".agenda [data-id]").forEach((el) => {
      const open = () => Editor.edit(el.dataset.id, el.dataset.date, el.dataset.slot, el.dataset.sub);
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }

  // Wischen: links = nächster Monat, rechts = vorheriger
  let swipe = null;
  function attachSwipe(container, prev, next) {
    swipe = { prev, next };
    if (container.dataset.mswipe) return;
    container.dataset.mswipe = "1";
    let x0 = null, y0 = 0;
    container.addEventListener("touchstart", (e) => {
      if (!swipe || e.touches.length !== 1 || !e.target.closest(".month")) { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    container.addEventListener("touchend", (e) => {
      if (x0 === null || !swipe) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      location.hash = "#kalender/" + (dx < 0 ? swipe.next : swipe.prev);
    }, { passive: true });
  }

  const selectedDate = () => (selected ? S.parseDate(selected) : new Date());
  return { render, leave() { swipe = null; }, selectedDate };
})();
