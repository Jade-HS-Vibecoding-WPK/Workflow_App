// ============================================================
// Ansicht "Heute": oben 4 Kacheln, darunter der Tagesplan
// (0–24 Uhr) mit roter Linie für die aktuelle Uhrzeit.
// ============================================================

const HeuteView = (() => {
  const HOUR_PX = 48;   // Höhe einer Stunde im Plan
  const START_H = 0;
  const END_H = 24;
  let nowTimer = null;

  // Text sicher in HTML einsetzen (Eingaben der Person könnten < oder & enthalten)
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  const ICONS = {
    heute: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 5 5M19 19l-1.3-1.3M6.3 17.7 5 19M19 5l-1.3 1.3"/></svg>',
    woche: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    ziele: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/></svg>',
  };

  function tile(key, label, count, color, href) {
    return `
      <a class="tile" href="${href}">
        <span class="tile__top">
          <span class="tile__icon" style="background:${color}">${ICONS[key]}</span>
          <span class="tile__count">${count}</span>
        </span>
        <span class="tile__label">${label}</span>
      </a>`;
  }

  // Farbe eines Blocks: Kategorie-Farbe oder eigene Farbe (Aufgaben/Ziele)
  function colorOf(b) {
    if (b.kind === "fest") return "var(--cat-fest)";
    if (b.kind === "einmalig") return "var(--cat-einmalig)";
    if (b.kind === "sperr") return "var(--cat-sperr)";
    return b.color || "var(--accent)";
  }

  function blockHtml(b) {
    const top = (b.startMin / 60 - START_H) * HOUR_PX;
    const height = Math.max(((b.endMin - b.startMin) / 60) * HOUR_PX - 2, 20);
    const color = colorOf(b);
    const short = height < 38;

    if (b.kind === "sperr") {
      return `<div class="block block--sperr" style="top:${top}px;height:${height}px">
        <span class="block__title">${esc(b.title || "Sperrzeit")}</span></div>`;
    }

    const cols = b.cols || 1;
    const left = `calc(${(b.col || 0) / cols} * (100% - 4px))`;
    const width = `calc(${1 / cols} * (100% - 4px) - 2px)`;
    const isTodo = b.kind === "aufgabe" || b.kind === "ziel";
    const classes = ["block", b.kind === "vorgang" && b.critical ? "block--crit" : "", b.option ? "block--option" : "", b.done ? "block--done" : "", b.cancelled ? "block--cancelled" : "", short ? "block--short" : ""].join(" ");

    // Puffer vor und nach dem Termin (blass angedeutet)
    let buffer = "";
    if (b.buffer > 0) {
      const bh = (b.buffer / 60) * HOUR_PX;
      buffer = `
        <div class="buffer" style="top:${top - bh}px;height:${bh}px;left:${left};width:${width};--c:${color}"></div>
        <div class="buffer" style="top:${top + height + 2}px;height:${bh}px;left:${left};width:${width};--c:${color}"></div>`;
    }

    const sub = [
      b.option ? "Option" : "",
      b.range || `${b.start}–${b.end}`,
      b.sub,
      b.kind === "ziel" && b.progress != null ? `${b.progress} %` : "",
    ].filter(Boolean).join(" · ");

    return buffer + `
      <div class="${classes}" style="top:${top}px;height:${height}px;left:${left};width:${width};--c:${color}"
        data-id="${esc(b.id)}" ${b.occDate ? `data-occ="${b.occDate}"` : ""} ${b.slotId ? `data-slot="${esc(b.slotId)}" data-sub="${esc(b.subgoalId || "")}"` : b.kind === "vorgang" ? `data-sub="${esc(b.subgoalId)}"` : ""} role="button" tabindex="0" aria-label="${esc(b.title)}, ${b.start} bis ${b.end}${b.option ? ", Vorschlag" : ""}">
        ${isTodo ? '<span class="block__check" aria-hidden="true"></span>' : ""}
        <span class="block__text">
          <span class="block__title">${short ? `<span class="block__time">${b.start}</span>` : ""}${esc(b.title)}</span>
          ${short ? "" : `<span class="block__sub">${esc(sub)}</span>`}
        </span>
      </div>`;
  }

  function nowTop() {
    const d = new Date();
    return ((d.getHours() + d.getMinutes() / 60) - START_H) * HOUR_PX;
  }

  // Kurzer Name eines Tages relativ zu heute: "Heute", "Morgen", "Gestern", sonst Wochentag
  function dayName(date, todayIso) {
    const diff = Math.round((Schedule.parseDate(Schedule.isoDate(date)) - Schedule.parseDate(todayIso)) / 86400000);
    if (diff === 0) return "Heute";
    if (diff === 1) return "Morgen";
    if (diff === -1) return "Gestern";
    return date.toLocaleDateString("de-DE", { weekday: "long" });
  }

  // Angezeigter Tag (Adresse #heute/2026-11-17); ohne Zusatz = heute
  let shownIso = null;
  const shownDate = () => (shownIso ? Schedule.parseDate(shownIso) : new Date());

  async function render(container, { scrollToNow = false, param = null, setTitle = () => {}, slide = null } = {}) {
    const entries = await Store.list();
    const now = new Date();
    const todayIso = Schedule.isoDate(now);
    shownIso = param && /^\d{4}-\d{2}-\d{2}$/.test(param) && param !== todayIso ? param : null;
    const day = shownIso ? Schedule.parseDate(shownIso) : now;
    const isToday = !shownIso;
    const dayIso = Schedule.isoDate(day);
    const plan = Schedule.dayPlan(entries, day);
    const c = Schedule.counts(entries, now);
    // Erste Kachel zählt den angezeigten Tag
    const dayCount = plan.timed.filter((b) => b.kind !== "sperr" && !b.cancelled).length + plan.allDay.filter((a) => a.kind !== "feiertag").length;
    const name = dayName(day, todayIso);
    setTitle(name);
    const dateLine = document.getElementById("topbar-date");
    if (dateLine) dateLine.textContent = day.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
    const prev = Schedule.isoDate(Schedule.addDays(day, -1));
    const next = Schedule.isoDate(Schedule.addDays(day, 1));

    const sperr = plan.timed.filter((b) => b.kind === "sperr");
    const items = Schedule.layoutColumns(plan.timed.filter((b) => b.kind !== "sperr"));

    let hours = "";
    for (let h = START_H; h < END_H; h++) {
      hours += `<div class="hour" style="height:${HOUR_PX}px"><span class="hour__label">${String(h).padStart(2, "0")}:00</span></div>`;
    }

    const extras = [
      ...plan.notes.map((n) => `<div class="daynote" data-id="${esc(n.id)}" role="button" tabindex="0">${esc(n.title)}</div>`),
      ...plan.allDay.map((a) => a.kind === "feiertag"
        ? `<div class="allday allday--holiday" style="--c:var(--holiday)">${esc(a.title)} <span>Feiertag</span></div>`
        : `<div class="allday" style="--c:${a.color || "var(--cat-einmalig)"}" data-id="${esc(a.id)}" role="button" tabindex="0">${esc(a.title)} <span>${esc(a.sub || "ganztägig")}</span></div>`),
    ].join("");

    // Hinweis am Vortag (A5): Vorschläge für morgen – passt das?
    const tomorrowIso = Schedule.isoDate(Schedule.addDays(now, 1));
    const privat = Store.getArea() !== "bau";
    // "Was mache ich jetzt?" / "Neu planen" nur, wenn es etwas zu planen gibt
    const hasWork = entries.some((e) => !e.done && (e.type === Model.TYPES.AUFGABE || e.type === Model.TYPES.ZIEL));
    const tomorrowOpts = isToday && privat && typeof Planner !== "undefined" ? Planner.optionsOn(entries, tomorrowIso) : [];
    const tomorrowHtml = tomorrowOpts.length ? `
      <div class="tomorrow">
        <div class="tomorrow__head"><b>Morgen eingeplant</b><span>passt das?</span></div>
        ${tomorrowOpts.slice(0, 4).map((b) => `
          <button class="tomorrow__row" data-id="${esc(b.id)}" data-slot="${esc(b.slotId)}" data-sub="${esc(b.subgoalId || "")}" style="--c:${b.color || "var(--accent)"}">
            <span>${b.start}–${b.end}</span><b>${esc(b.title)}</b>
          </button>`).join("")}
        ${tomorrowOpts.length > 4 ? `<small>+ ${tomorrowOpts.length - 4} weitere</small>` : ""}
        <button class="link-btn" data-confirm-tomorrow>Alle bestätigen</button>
      </div>` : "";

    // Erinnerung: offen, aber noch nicht im Plan (alle 2 Tage)
    const remind = isToday && privat ? Tasks.reminders(entries, await Store.getSettings(), now).slice(0, 3) : [];
    const daysTo = (iso) => Math.round((Schedule.parseDate(iso) - Schedule.parseDate(Schedule.isoDate(now))) / 86400000);
    const remindHtml = remind.length ? `
      <div class="tomorrow remind">
        <div class="tomorrow__head"><b>Zur Erinnerung</b><span>Noch ist Zeit – nur damit nichts untergeht.</span></div>
        ${remind.map((e) => `
          <button class="tomorrow__row" data-remind="${esc(e.id)}" style="--c:${e.color || "var(--accent)"}">
            <b>${esc(e.title)}</b>
            <span>fällig in ${daysTo(e.deadline)} Tagen · ${Tasks.nextSlot(e, now) ? "geplant " + esc(Schedule.parseDate(Tasks.nextSlot(e, now).date).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" })) : "noch nicht eingeplant"}</span>
          </button>`).join("")}
        <button class="link-btn" data-remind-ok>Okay</button>
      </div>` : "";

    const emptyHint = entries.length === 0
      ? `<p class="plan-hint">Noch keine Einträge. Tippe oben auf „+“, um deinen ersten Termin anzulegen.</p>`
      : "";

    container.innerHTML = `
      <div class="tiles">
        ${tile("heute", name, dayCount, "#378add", "#heute")}
        ${tile("woche", "Diese Woche fällig", c.dueThisWeek, "#ba7517", "#aufgaben")}
        ${tile("ziele", "Ziele & Aufgaben", c.open, "#7f77dd", "#ziele")}
        ${tile("warn", "Hängt hinterher", c.behind, c.behind ? "var(--warn)" : "#8e8e93", "#ziele")}
      </div>
      ${isToday && privat && hasWork ? `
        <div class="plan-actions">
          <button class="pill pill--primary" data-whatnow>Was mache ich jetzt?</button>
          <button class="pill" data-replan aria-label="Vorschläge neu berechnen">↻ Neu planen</button>
        </div>` : ""}
      ${tomorrowHtml}
      ${remindHtml}
      <div class="day-nav">
        <a class="icon-btn" href="#heute/${prev}" aria-label="Vorheriger Tag">‹</a>
        <span class="day-nav__label">${esc(day.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" }))}</span>
        ${isToday ? '<span class="day-nav__today day-nav__today--off">Heute</span>' : '<a class="day-nav__today" href="#heute">Heute</a>'}
        <a class="icon-btn" href="#heute/${next}" aria-label="Nächster Tag">›</a>
      </div>
      ${extras ? `<div class="day-extras">${extras}</div>` : ""}
      ${emptyHint}
      <section class="plan ${slide ? "plan--slide-" + slide : ""}" aria-label="Tagesplan ${esc(name)}">
        <div class="plan__grid" style="height:${(END_H - START_H) * HOUR_PX}px">
          ${hours}
          <div class="plan__blocks">
            ${sperr.map(blockHtml).join("")}
            ${items.map(blockHtml).join("")}
          </div>
          ${isToday ? `<div class="now-line" id="now-line" style="top:${nowTop()}px"><span></span></div>` : ""}
        </div>
      </section>`;

    // Antippen eines Eintrags öffnet ihn zum Bearbeiten
    const isoToday = dayIso; // der angezeigte Tag
    container.querySelectorAll(".block[data-id]").forEach((el) => {
      // Teil nach Mitternacht gehört zum Termin vom Vortag (data-occ)
      const open = () => Editor.edit(el.dataset.id, el.dataset.occ || isoToday, el.dataset.slot, el.dataset.sub);
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    container.querySelectorAll(".allday[data-id], .daynote[data-id]").forEach((el) => {
      el.addEventListener("click", () => Editor.edit(el.dataset.id, isoToday));
    });

    // Planer-Knöpfe
    const wn = container.querySelector("[data-whatnow]");
    if (wn) wn.addEventListener("click", () => Planner.whatNow());
    const rp = container.querySelector("[data-replan]");
    if (rp) rp.addEventListener("click", async () => {
      const r = await Planner.sync({ full: true, silent: true });
      const n = r ? r.items.filter((it) => it.need > 0).length : 0;
      Toast.show(n ? `Vorschläge neu berechnet (${n} offen)` : "Nichts zu planen – alles erledigt");
    });
    container.querySelectorAll(".tomorrow__row").forEach((el) => {
      el.addEventListener("click", () => Planner.openSlot(el.dataset.id, el.dataset.slot, el.dataset.sub || null));
    });
    container.querySelectorAll("[data-remind]").forEach((el) => el.addEventListener("click", () => Editor.edit(el.dataset.remind)));
    const ro = container.querySelector("[data-remind-ok]");
    if (ro) ro.addEventListener("click", () => Tasks.dismissReminders(remind.map((e) => e.id)));
    const ct = container.querySelector("[data-confirm-tomorrow]");
    if (ct) ct.addEventListener("click", async () => {
      await Planner.confirmDay(tomorrowIso);
      Toast.show("Morgen ist bestätigt");
    });

    // Rote Linie jede Minute nachrücken
    clearInterval(nowTimer);
    nowTimer = setInterval(() => {
      const line = document.getElementById("now-line");
      if (line) line.style.top = nowTop() + "px";
      else clearInterval(nowTimer);
    }, 60 * 1000);

    // Beim Öffnen: heute zur aktuellen Uhrzeit, andere Tage zu 7 Uhr springen
    if (scrollToNow) {
      const grid = container.querySelector(".plan__grid");
      const target = isToday ? nowTop() : 7 * HOUR_PX;
      const y = grid.getBoundingClientRect().top + window.scrollY + target * (window.UIZoom || 1) - window.innerHeight / 3;
      window.scrollTo(0, Math.max(0, y));
    }

    // Wischen: nach links = nächster Tag, nach rechts = vorheriger Tag
    attachSwipe(container, prev, next);
  }

  let swipeTarget = null;
  function attachSwipe(container, prev, next) {
    swipeTarget = { prev, next };
    if (container.dataset.swipe) return; // nur einmal anmelden
    container.dataset.swipe = "1";
    let x0 = null, y0 = null, t0 = 0;
    container.addEventListener("touchstart", (e) => {
      if (!swipeTarget || e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    container.addEventListener("touchend", (e) => {
      if (x0 === null || !swipeTarget) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      // Deutlich waagerecht und schnell genug, sonst ist es normales Scrollen
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - t0 > 800) return;
      pendingSlide = dx < 0 ? "left" : "right";
      location.hash = "#heute/" + (dx < 0 ? swipeTarget.next : swipeTarget.prev);
    }, { passive: true });
  }
  let pendingSlide = null;
  const takeSlide = () => { const s = pendingSlide; pendingSlide = null; return s; };

  function leave() {
    clearInterval(nowTimer);
    swipeTarget = null;
  }

  return { render, leave, shownDate, takeSlide };
})();
