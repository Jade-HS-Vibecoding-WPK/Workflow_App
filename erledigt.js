// ============================================================
// Sonderordner "Erledigt" (im Menü ganz unten)
// Abgehakte Aufgaben (später auch Ziele) bleiben hier 6 Monate,
// danach löscht die App sie automatisch.
// ============================================================

const ErledigtView = (() => {
  const KEEP_DAYS = 183; // ca. 6 Monate

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  // Alles löschen, was länger als 6 Monate erledigt ist (läuft beim App-Start)
  async function cleanup() {
    const limit = Date.now() - KEEP_DAYS * 86400000;
    const all = await Store.list(null, { all: true });
    for (const e of all) {
      if (e.done && e.doneAt && new Date(e.doneAt).getTime() < limit) await Store.remove(e.id);
    }
  }

  async function render(container) {
    const done = (await Store.list())
      .filter((e) => e.done && (e.type === Model.TYPES.AUFGABE || e.type === Model.TYPES.ZIEL))
      .sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt)));

    // Kleiner Wochenrückblick (Grundgerüst, wird später ausgebaut)
    const all = await Store.list();
    const w = Stats.weekSummary(all, Schedule.startOfWeek(new Date()));
    const acc = Stats.accuracyText(Stats.estimateAccuracy(all));
    const fmtH = (h) => String(h).replace(".", ",") + " Std.";
    const weekParts = [
      w.goalHours ? `${fmtH(w.goalHours)} an Zielen gearbeitet` : "",
      w.subgoalsDone ? `${w.subgoalsDone} Unterziel${w.subgoalsDone === 1 ? "" : "e"} fertig` : "",
      w.tasksDone ? `${w.tasksDone} Aufgabe${w.tasksDone === 1 ? "" : "n"} erledigt` : "",
    ].filter(Boolean);

    container.innerHTML = `
      ${weekParts.length || acc ? `
        <div class="notice notice--week"><b>Diese Woche</b> ${weekParts.length ? weekParts.join(" · ") : "noch nichts erledigt"}${acc ? `<br><small>${acc}</small>` : ""}</div>` : ""}
      <p class="plan-hint">Erledigtes bleibt hier 6 Monate und wird dann automatisch gelöscht.</p>
      ${done.length === 0 ? `
        <section class="empty">
          <p class="empty__title">Noch nichts erledigt</p>
          <p class="empty__text">Abgehakte Aufgaben landen hier.</p>
        </section>` : `
        <ul class="task-list">
          ${done.map((t) => `
            <li class="task task--done" style="--c:${t.color || "var(--accent)"}">
              <button class="task__check" data-undo="${esc(t.id)}" aria-label="${esc(t.title)} wieder öffnen"></button>
              <span class="task__body">
                <span class="task__title">${esc(t.title)}</span>
                <span class="task__meta"><span>erledigt am ${new Date(t.doneAt).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}</span></span>
              </span>
            </li>`).join("")}
        </ul>`}`;

    container.querySelectorAll("[data-undo]").forEach((btn) => {
      btn.addEventListener("click", () => Tasks.toggleDone(btn.dataset.undo));
    });
  }

  return { render, leave() {}, cleanup };
})();
