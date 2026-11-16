// ============================================================
// Workflow – Grundgerüst
// Kümmert sich um: Wechsel zwischen den Ansichten, das Menü
// und das Registrieren des Offline-Speichers (Service Worker).
// ============================================================

// Alle Ansichten der App. "feature" sagt, wann sie laut PLAN.md gebaut wird.
const VIEWS = {
  heute:        { title: "Heute",        text: "Hier erscheinen die Kacheln und dein Tagesplan.",            feature: "Feature 3" },
  woche:        { title: "Woche",        text: "Hier erscheint dein Wochenplan als Stundenplan.",            feature: "Feature 7" },
  kalender:     { title: "Kalender",     text: "Hier erscheint die Monatsübersicht.",                         feature: "später (Could)" },
  ziele:        { title: "Ziele",        text: "Hier erscheinen deine Ziele mit Unterzielen und Fortschritt.", feature: "Feature 6" },
  aufgaben:     { title: "Aufgaben",     text: "Hier erscheinen deine Aufgaben zum Abhaken.",                 feature: "Feature 5" },
  sperrzeiten:  { title: "Sperrzeiten",  text: "Hier legst du Zeiten fest, in denen nichts geplant wird.",    feature: "später (Should)" },
  tagesnotizen: { title: "Tagesnotizen", text: "Hier hängst du kurze Notizen an bestimmte Tage.",             feature: "später (Could)" },
  einstellungen:{ title: "Einstellungen",text: "Hier stellst du z. B. Schriftgröße und Baumanagement-Modus ein.", feature: "später" },
  daten:        { title: "Daten",        text: "Hier sicherst du deine Daten als Datei oder spielst sie zurück.", feature: "später (Should)" },
  erledigt:     { title: "Erledigt",     text: "Hier landen abgehakte Aufgaben und Ziele.",                    feature: "später (Should)" },
  // Detailseite eines Ziels: Adresse #ziel/<id>, in der Leiste bleibt "Ziele" markiert
  ziel:         { title: "Ziel",         text: "", feature: "", tab: "ziele" },
};
const DEFAULT_VIEW = "heute";

const viewEl = document.getElementById("view");
const titleEl = document.getElementById("topbar-title");
const dateEl = document.getElementById("topbar-date");

// ---------- Ansicht anzeigen ----------
// Adresse aufteilen: "#ziel/abc" → Ansicht "ziel", Zusatz "abc"
function currentRoute() {
  const [name, param = null] = location.hash.replace("#", "").split("/");
  return VIEWS[name] ? { name, param: param && decodeURIComponent(param) } : { name: DEFAULT_VIEW, param: null };
}
function currentViewName() {
  return currentRoute().name;
}

// Ansichten, die schon gebaut sind (der Rest zeigt einen Platzhalter)
const RENDERERS = {
  heute: HeuteView,
  aufgaben: AufgabenView,
  erledigt: ErledigtView,
  ziele: ZieleView,
  ziel: ZielDetailView,
};
let lastView = null;

async function render() {
  const { name, param } = currentRoute();
  const view = VIEWS[name];
  const routeKey = name + "/" + (param || "");
  const isNavigation = routeKey !== lastView; // neue Ansicht oder nur Daten geändert?
  const lastName = lastView && lastView.split("/")[0];
  if (lastName && RENDERERS[lastName] && isNavigation) RENDERERS[lastName].leave();
  lastView = routeKey;

  titleEl.textContent = view.title;
  document.title = view.title + " · Workflow";
  // Das Datum steht nur über "Heute"
  dateEl.textContent = name === "heute"
    ? new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })
    : "";

  // Aktiven Knopf in der Leiste unten markieren
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.view === (view.tab || name)) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  closeMenu();

  if (RENDERERS[name]) {
    if (isNavigation) window.scrollTo(0, 0);
    await RENDERERS[name].render(viewEl, { scrollToNow: isNavigation, param, setTitle: (t) => { titleEl.textContent = t; } });
    return;
  }

  // Platzhalter, bis die Ansicht gebaut ist
  viewEl.innerHTML = `
    <section class="empty">
      <p class="empty__title">${view.title}</p>
      <p class="empty__text">${view.text}</p>
      <span class="empty__tag">kommt in ${view.feature}</span>
    </section>`;
  if (isNavigation) window.scrollTo(0, 0);
}

// ---------- Menü ----------
const menu = document.getElementById("menu");
const backdrop = document.getElementById("menu-backdrop");
const menuBtn = document.getElementById("menu-open");

function openMenu() {
  menu.hidden = false;
  backdrop.hidden = false;
  menuBtn.setAttribute("aria-expanded", "true");
  document.getElementById("menu-close").focus();
}

function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true;
  backdrop.hidden = true;
  menuBtn.setAttribute("aria-expanded", "false");
}

menuBtn.addEventListener("click", openMenu);
// "+"-Knopf: neuen Eintrag für heute anlegen
document.getElementById("add-btn").addEventListener("click", () => {
  // In der Aufgaben-Ansicht direkt eine Aufgabe anlegen, sonst Auswahl zeigen
  const { name, param } = currentRoute();
  if (name === "aufgaben") Editor.newTask();
  else if (name === "ziele") Goals.newGoal();
  else if (name === "ziel" && param) Goals.newSubgoal(param);
  else Editor.chooseNew(new Date());
});
document.getElementById("menu-close").addEventListener("click", closeMenu);
backdrop.addEventListener("click", closeMenu);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

// ---------- Start ----------
window.addEventListener("hashchange", render);
// Wenn sich Daten ändern (Speicher-Baustein meldet sich), Ansicht neu zeichnen
Store.subscribe(() => render());
render();
// Alte Einträge im Ordner "Erledigt" (älter als 6 Monate) aufräumen
ErledigtView.cleanup();

// ---------- Offline-Speicher (Service Worker) ----------
// Sorgt dafür, dass die App installierbar ist und auch ohne Internet startet.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service Worker konnte nicht registriert werden:", err);
    });
  });
}
