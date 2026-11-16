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
    const classes = ["block", b.option ? "block--option" : "", b.done ? "block--done" : "", short ? "block--short" : ""].join(" ");

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
      `${b.start}–${b.end}`,
      b.sub,
      b.kind === "ziel" && b.progress != null ? `${b.progress} %` : "",
    ].filter(Boolean).join(" · ");

    return buffer + `
      <div class="${classes}" style="top:${top}px;height:${height}px;left:${left};width:${width};--c:${color}">
        ${isTodo ? '<span class="block__check" aria-hidden="true"></span>' : ""}
        <span class="block__text">
          <span class="block__title">${esc(b.title)}</span>
          ${short ? "" : `<span class="block__sub">${esc(sub)}</span>`}
        </span>
      </div>`;
  }

  function nowTop() {
    const d = new Date();
    return ((d.getHours() + d.getMinutes() / 60) - START_H) * HOUR_PX;
  }

  async function render(container, { scrollToNow = false } = {}) {
    const entries = await Store.list();
    const today = new Date();
    const plan = Schedule.dayPlan(entries, today);
    const c = Schedule.counts(entries, today);

    const sperr = plan.timed.filter((b) => b.kind === "sperr");
    const items = Schedule.layoutColumns(plan.timed.filter((b) => b.kind !== "sperr"));

    let hours = "";
    for (let h = START_H; h < END_H; h++) {
      hours += `<div class="hour" style="height:${HOUR_PX}px"><span class="hour__label">${String(h).padStart(2, "0")}:00</span></div>`;
    }

    const extras = [
      ...plan.notes.map((n) => `<div class="daynote">${esc(n.title)}</div>`),
      ...plan.allDay.map((a) => `<div class="allday" style="--c:var(--cat-einmalig)">${esc(a.title)} <span>ganztägig</span></div>`),
    ].join("");

    const emptyHint = entries.length === 0
      ? `<p class="plan-hint">Noch keine Einträge. Termine kannst du ab Feature 4 über „+“ anlegen.</p>`
      : "";

    container.innerHTML = `
      <div class="tiles">
        ${tile("heute", "Heute", c.today, "#378add", "#heute")}
        ${tile("woche", "Diese Woche fällig", c.dueThisWeek, "#ba7517", "#aufgaben")}
        ${tile("ziele", "Ziele & Aufgaben", c.open, "#7f77dd", "#ziele")}
        ${tile("warn", "Hängt hinterher", c.behind, c.behind ? "var(--warn)" : "#8e8e93", "#ziele")}
      </div>
      ${extras ? `<div class="day-extras">${extras}</div>` : ""}
      ${emptyHint}
      <section class="plan" aria-label="Tagesplan heute">
        <div class="plan__grid" style="height:${(END_H - START_H) * HOUR_PX}px">
          ${hours}
          <div class="plan__blocks">
            ${sperr.map(blockHtml).join("")}
            ${items.map(blockHtml).join("")}
          </div>
          <div class="now-line" id="now-line" style="top:${nowTop()}px"><span></span></div>
        </div>
      </section>`;

    // Rote Linie jede Minute nachrücken
    clearInterval(nowTimer);
    nowTimer = setInterval(() => {
      const line = document.getElementById("now-line");
      if (line) line.style.top = nowTop() + "px";
      else clearInterval(nowTimer);
    }, 60 * 1000);

    // Beim Öffnen zur aktuellen Uhrzeit springen (etwas Luft darüber)
    if (scrollToNow) {
      const line = document.getElementById("now-line");
      const y = line.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3;
      window.scrollTo(0, Math.max(0, y));
    }
  }

  function leave() {
    clearInterval(nowTimer);
  }

  return { render, leave };
})();
