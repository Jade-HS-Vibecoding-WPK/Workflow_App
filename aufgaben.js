// ============================================================
// Aufgaben: Abhaken-Logik und die Ansicht "Aufgaben"
// ============================================================

// Kurze Meldung unten mit "Rückgängig"-Knopf
const Toast = (() => {
  let el = null;
  let timer = null;
  function show(text, undo) {
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.innerHTML = `<span></span>${undo ? '<button type="button">Rückgängig</button>' : ""}`;
    el.querySelector("span").textContent = text;
    if (undo) el.querySelector("button").onclick = () => { hide(); undo(); };
    el.classList.add("toast--show");
    clearTimeout(timer);
    timer = setTimeout(hide, 4500);
  }
  function hide() { if (el) el.classList.remove("toast--show"); }
  return { show };
})();

const Tasks = (() => {
  const S = Schedule;

  // Blöcke, die noch kommen (nicht vorbei) – fallen beim Abhaken weg und geben die Zeit frei
  function dropUpcoming(slots) {
    const now = new Date();
    const today = S.isoDate(now);
    const nm = now.getHours() * 60 + now.getMinutes();
    return (slots || []).filter((s) => s.date < today || (s.date === today && S.toMin(s.end) <= nm));
  }

  // Abhaken / wieder öffnen.
  // Wiederkehrende Aufgabe: Deadline rückt auf den nächsten Termin,
  // die Erledigung wird im Verlauf festgehalten.
  async function toggleDone(id) {
    const before = await Store.get(id);
    if (!before) return;
    const today = S.isoDate(new Date());
    let after;

    if (before.done) {
      after = { ...before, done: false, doneAt: null, history: (before.history || []).filter((h) => h.doneAt !== before.doneAt) };
      await Store.save(after);
      Toast.show(`„${before.title}“ ist wieder offen`);
      return;
    }

    const repeats = before.recurrence && before.recurrence.freq !== "einmalig" && before.deadline;
    if (repeats) {
      const next = S.nextOccurrence(before.recurrence, before.deadline < today ? today : before.deadline);
      after = {
        ...before,
        slots: dropUpcoming(before.slots),
        deadline: next,
        history: [...(before.history || []), { doneAt: new Date().toISOString(), deadlineWas: before.deadline, estimateMin: before.durationMin }],
      };
      await Store.save(after);
      Toast.show(`Erledigt · nächstes Mal ${S.deadlineLabel(next)}`, () => Store.save(before));
    } else {
      const doneAt = new Date().toISOString();
      // Verlauf für Statistik (Wochenrückblick, Schätzung lernen)
      after = {
        ...before, done: true, doneAt,
        slots: dropUpcoming(before.slots),
        // Ziel abschließen: auch die geplanten Blöcke der Unterziele freigeben
        ...(before.subgoals ? { subgoals: before.subgoals.map((sg) => ({ ...sg, slots: dropUpcoming(sg.slots) })) } : {}),
        history: [...(before.history || []), { doneAt, deadlineWas: before.deadline, estimateMin: before.durationMin }] };
      await Store.save(after);
      Toast.show(`„${before.title}“ erledigt`, () => Store.save(before));
    }
  }

  return { toggleDone, dropUpcoming };
})();

const AufgabenView = (() => {
  const S = Schedule;
  const SORTS = [["deadline", "Deadline"], ["priority", "Priorität"], ["color", "Farbe"]];
  const COLOR_NAMES = {
    "#ba7517": "Ocker", "#d85a30": "Orange", "#e24b4a": "Rot", "#d4537e": "Pink",
    "#af52de": "Violett", "#7f77dd": "Lila", "#a2845e": "Braun", "#636366": "Grau",
  };
  const PRIO_NAMES = { 5: "Sehr wichtig", 4: "Wichtig", 3: "Normal", 2: "Kann warten", 1: "Irgendwann" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const fmtDuration = (m) => (m < 60 ? `${m} Min.` : `${String(m / 60).replace(".", ",")} Std.`);

  // Gruppe, in die eine Aufgabe je nach Sortierung fällt
  function groupOf(task, sort, today, weekEnd) {
    if (sort === "priority") return { key: 6 - task.priority, label: PRIO_NAMES[task.priority] };
    if (sort === "color") return { key: task.color, label: COLOR_NAMES[task.color] || "Eigene Farbe", color: task.color };
    const d = task.deadline;
    if (!d) return { key: 4, label: "Ohne Deadline" };
    if (d < today) return { key: 0, label: "Überfällig", warn: true };
    if (d === today) return { key: 1, label: "Heute" };
    if (d <= weekEnd) return { key: 2, label: "Diese Woche" };
    return { key: 3, label: "Später" };
  }

  function byDeadlineThenPrio(a, b) {
    const da = a.deadline || "9999", db = b.deadline || "9999";
    return da.localeCompare(db) || b.priority - a.priority || a.title.localeCompare(b.title);
  }

  function row(t, today) {
    const overdue = t.deadline && t.deadline < today;
    const repeats = t.recurrence && t.recurrence.freq !== "einmalig";
    const meta = [
      t.deadline ? `<span class="${overdue ? "meta--warn" : ""}">${esc(S.deadlineLabel(t.deadline))}</span>` : "",
      `<span>${fmtDuration(t.durationMin)}</span>`,
      repeats ? `<span title="wiederkehrend">↻ ${{ woechentlich: "wöchentlich", zweiwoechentlich: "alle 2 Wochen", monatlich: "monatlich" }[t.recurrence.freq]}</span>` : "",
      t.priority >= 4 ? `<span class="prio">${"!".repeat(t.priority - 2)}</span>` : "",
    ].filter(Boolean).join("");
    return `
      <li class="task" style="--c:${t.color}">
        <button class="task__check" data-check="${esc(t.id)}" aria-label="${esc(t.title)} abhaken"></button>
        <button class="task__body" data-edit="${esc(t.id)}">
          <span class="task__title">${esc(t.title)}</span>
          ${t.notes ? `<span class="task__notes">${esc(t.notes)}</span>` : ""}
          <span class="task__meta">${meta}</span>
        </button>
      </li>`;
  }

  async function render(container) {
    const settings = await Store.getSettings();
    const sort = settings.aufgabenSort || "deadline";
    const now = new Date();
    const today = S.isoDate(now);
    const weekEnd = S.isoDate(S.addDays(S.startOfWeek(now), 6));
    const tasks = (await Store.list(Model.TYPES.AUFGABE)).filter((t) => !t.done).sort(byDeadlineThenPrio);

    // In Gruppen einsortieren
    const groups = new Map();
    for (const t of tasks) {
      const g = groupOf(t, sort, today, weekEnd);
      if (!groups.has(g.key)) groups.set(g.key, { ...g, items: [] });
      groups.get(g.key).items.push(t);
    }
    const ordered = [...groups.values()].sort((a, b) => (typeof a.key === "number" ? a.key - b.key : String(a.key).localeCompare(String(b.key))));

    const sortSwitch = SORTS.map(([v, l]) => `
      <label class="seg"><input type="radio" name="sort" value="${v}" ${sort === v ? "checked" : ""}><span>${l}</span></label>`).join("");

    container.innerHTML = `
      <div class="segmented list-sort" role="radiogroup" aria-label="Sortieren nach">${sortSwitch}</div>
      ${tasks.length === 0 ? `
        <section class="empty">
          <p class="empty__title">Keine offenen Aufgaben</p>
          <p class="empty__text">Lege eine Aufgabe an, z. B. „Reisepass beantragen“. Sie hat keine feste Uhrzeit und erinnert dich, bis sie erledigt ist.</p>
        </section>` : ""}
      ${ordered.map((g) => `
        <h3 class="list-group ${g.warn ? "list-group--warn" : ""}">${g.color ? `<span class="choice__dot" style="background:${g.color}"></span>` : ""}${esc(g.label)} <span>${g.items.length}</span></h3>
        <ul class="task-list">${g.items.map((t) => row(t, today)).join("")}</ul>`).join("")}
      <button class="add-row" data-add>
        <span class="add-row__plus">+</span> Neue Aufgabe
      </button>`;

    container.querySelectorAll('[name="sort"]').forEach((r) => {
      r.addEventListener("change", () => Store.saveSettings({ aufgabenSort: r.value }));
    });
    container.querySelectorAll("[data-check]").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.closest(".task").classList.add("task--checking"); // kurz gefüllt anzeigen
        setTimeout(() => Tasks.toggleDone(btn.dataset.check), 250);
      });
    });
    container.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => Editor.edit(btn.dataset.edit));
    });
    container.querySelector("[data-add]").addEventListener("click", () => Editor.newTask());
  }

  return { render, leave() {} };
})();
