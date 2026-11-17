// ============================================================
// Balkenplan (Gantt) eines Ziels/Projekts
//
// Eine Zeile pro Unterziel/Vorgang, Zeitachse in Tagen.
//  - Balken = frühester Anfang bis frühestes Ende (FAZ–FEZ)
//  - heller Streifen dahinter = Puffer bis zum spätesten Ende (SEZ)
//  - Rahmen rot = kritisch, orange = eng
//  - ◆ = Zwischen-Deadline, rote Linie = heute, dunkle Linie = Deadline
//  - Wochenenden grau, Feiertage rot (Baustelle: dort wird nicht gearbeitet)
// Antippen = Netzplan-Kästchen mit allen Werten (wie im Netzplan).
// ============================================================

const Balkenplan = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);
  const DAY = 26;    // Breite eines Tages
  const LABEL = 136; // Breite der Namensspalte
  const MAX_DAYS = 400;

  const dayDiff = (a, b) => Math.round((S.parseDate(b) - S.parseDate(a)) / 86400000);

  function html(goal, res) {
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    if (!subs.length) return `<p class="plan-hint">Noch keine Unterziele – lege welche an, dann entsteht hier der Balkenplan.</p>`;
    if (res && res.cycle) return `<div class="advice advice--crit">Die Abhängigkeiten bilden einen Kreis – so lässt sich kein Balkenplan zeichnen.</div>`;
    const nodes = (res && res.nodes) || {};
    const bau = goal.area === "bau";
    const today = S.isoDate(new Date());

    // Zeitraum: von heute (bzw. Baubeginn) bis Deadline/spätestes Ende + 2 Tage
    let from = today;
    if (goal.startDate && goal.startDate < from) from = goal.startDate;
    const ends = [goal.deadline, res && res.projectEndDate, ...Object.values(nodes).map((n) => n.latestEnd), ...subs.map((s) => s.deadline)].filter(Boolean);
    let to = ends.reduce((m, d) => (d > m ? d : m), today);
    to = S.isoDate(S.addDays(S.parseDate(to), 2));
    let n = Math.min(dayDiff(from, to) + 1, MAX_DAYS);
    const x = (iso) => dayDiff(from, iso) * DAY;
    const width = n * DAY;

    // Kopf: Monate und Tage
    const months = [];
    const days = [];
    const shade = [];
    for (let i = 0; i < n; i++) {
      const d = S.addDays(S.parseDate(from), i);
      const iso = S.isoDate(d);
      const wd = d.getDay();
      const hol = typeof Holidays !== "undefined" && Holidays.on(iso);
      if (i === 0 || d.getDate() === 1) months.push({ i, label: d.toLocaleDateString("de-DE", { month: "long", year: "numeric" }) });
      days.push(`<span class="gt-day ${wd === 0 || wd === 6 ? "gt-day--we" : ""} ${hol ? "gt-day--hol" : ""} ${iso === today ? "gt-day--today" : ""}" ${hol ? `title="${esc(hol)}"` : ""}>
        <small>${"SMDMDFS"[wd]}</small>${d.getDate()}</span>`);
      if (wd === 0 || wd === 6 || hol) shade.push(`<i class="gt-shade ${hol ? "gt-shade--hol" : ""}" style="left:${i * DAY}px"></i>`);
    }
    const monthHtml = months.map((m, k) => {
      const next = months[k + 1] ? months[k + 1].i : n;
      return `<span class="gt-month" style="left:${m.i * DAY}px;width:${(next - m.i) * DAY}px">${esc(m.label)}</span>`;
    }).join("");

    const rows = subs.map((s, i) => {
      const nd = nodes[s.id];
      const gewerk = bau && s.assignee && s.assignee !== Model.OWNER_LOCAL ? s.assignee : "";
      let bars = "";
      if (nd && !s.done) {
        const left = x(nd.startDate);
        const w = (dayDiff(nd.startDate, nd.endDate) + 1) * DAY;
        const slackLeft = left + w;
        const slackW = Math.max(0, (dayDiff(nd.endDate, nd.latestEnd)) * DAY);
        const cls = ["gt-bar", nd.level ? "gt-bar--" + nd.level : "", nd.mainPath ? "gt-bar--main" : ""].join(" ");
        bars = `${slackW > 0 ? `<i class="gt-slack" style="left:${slackLeft}px;width:${slackW}px"></i>` : ""}
          <button class="${cls}" data-node="${esc(s.id)}" style="left:${left}px;width:${Math.max(w - 2, 6)}px"
            aria-label="${esc(s.title)}: ${esc(nd.startDate)} bis ${esc(nd.endDate)}">
            <span>${esc(s.progressPercent ? s.progressPercent + " %" : "")}</span>
            ${s.progressPercent ? `<i class="gt-progress" style="width:${s.progressPercent}%"></i>` : ""}
          </button>`;
      }
      const dl = s.deadline && s.deadline >= from ? `<i class="gt-dl" style="left:${x(s.deadline) + DAY / 2 - 6}px" title="Zwischen-Deadline">◆</i>` : "";
      return `
        <div class="gt-row ${s.done ? "gt-row--done" : ""}">
          <button class="gt-label" data-node="${esc(s.id)}">
            <span><span class="nz-num">${i + 1}</span>${s.done ? "✓ " : ""}${esc(s.title)}</span>
            ${gewerk ? `<small>${esc(gewerk)}</small>` : nd && !s.done ? `<small>${esc(S.parseDate(nd.startDate).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }))}–${esc(S.parseDate(nd.endDate).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }))}</small>` : ""}
          </button>
          <div class="gt-track" style="width:${width}px">${bars}${dl}</div>
        </div>`;
    }).join("");

    const todayLine = today >= from && dayDiff(from, today) < n ? `<i class="gt-now" style="left:${LABEL + x(today) + DAY / 2}px"></i>` : "";
    const deadlineLine = goal.deadline && goal.deadline >= from ? `<i class="gt-deadline" style="left:${LABEL + x(goal.deadline) + DAY}px" title="${bau ? "Fertigstellung" : "Deadline"}"></i>` : "";

    return `
      <div class="gt-wrap" data-gantt style="--goal-c:${goal.color}">
        <div class="gt" style="width:${LABEL + width}px">
          <div class="gt-head">
            <span class="gt-corner"></span>
            <div class="gt-months" style="width:${width}px">${monthHtml}</div>
          </div>
          <div class="gt-head gt-head--days">
            <span class="gt-corner">${bau ? "Vorgang" : "Unterziel"}</span>
            <div class="gt-days">${days.join("")}</div>
          </div>
          <div class="gt-body">
            <div class="gt-shades" style="left:${LABEL}px;width:${width}px">${shade.join("")}</div>
            ${rows}
            ${todayLine}${deadlineLine}
          </div>
        </div>
      </div>
      <p class="month-legend">
        <span><i class="nz-key nz-key--kritisch"></i>kritisch</span>
        <span><i class="nz-key nz-key--eng"></i>eng</span>
        <span><i class="gt-key-slack"></i>Puffer</span>
        <span><i class="gt-key-now"></i>heute</span>
        <span><i class="gt-key-dl"></i>${bau ? "Fertigstellung" : "Deadline"}</span>
        <span>◆ Zwischen-Deadline</span>
      </p>
      <p class="plan-hint plan-hint--small">Balken = frühester Anfang bis frühestes Ende${bau ? " (Arbeitstage, Wochenende/Feiertage grau)" : ""} · antippen = alle Werte</p>`;
  }

  function wire(container, goal, res) {
    container.querySelectorAll("[data-gantt] [data-node]").forEach((b) => b.addEventListener("click", () => Netzplan.openNode(goal, res, b.dataset.node)));
    // Beim Öffnen zu "heute" scrollen (etwas Vorlauf lassen)
    const wrap = container.querySelector("[data-gantt]");
    const now = wrap && wrap.querySelector(".gt-day--today");
    if (wrap && now) wrap.scrollLeft = Math.max(0, now.offsetLeft - LABEL - 3 * DAY);
  }

  return { html, wire };
})();
