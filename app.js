// ============================================================
// Workflow – Grundgerüst
// Kümmert sich um: Wechsel zwischen den Ansichten, das Menü
// und das Registrieren des Offline-Speichers (Service Worker).
// ============================================================

// Alle Ansichten der App. "feature" sagt, wann sie laut PLAN.md gebaut wird.
const VIEWS = {
  heute:        { title: "Heute",        text: "Hier erscheinen die Kacheln und dein Tagesplan.",            feature: "Feature 3" },
  woche:        { title: "Woche",        text: "Hier erscheint dein Wochenplan als Stundenplan.",            feature: "Feature 7" },
  kalender:     { title: "Kalender",     text: "", feature: "" },
  ziele:        { title: "Ziele",        text: "Hier erscheinen deine Ziele mit Unterzielen und Fortschritt.", feature: "Feature 6" },
  aufgaben:     { title: "Aufgaben",     text: "Hier erscheinen deine Aufgaben zum Abhaken.",                 feature: "Feature 5" },
  sperrzeiten:  { title: "Sperrzeiten",  text: "", feature: "" },
  tagesnotizen: { title: "Tagesnotizen", text: "", feature: "" },
  einstellungen:{ title: "Einstellungen",text: "Hier stellst du z. B. Schriftgröße und Baumanagement-Modus ein.", feature: "später" },
  daten:        { title: "Daten sichern", text: "", feature: "" },
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
  woche: WocheView,
  einstellungen: EinstellungenView,
  ziele: ZieleView,
  ziel: ZielDetailView,
  sperrzeiten: SperrzeitenView,
  tagesnotizen: TagesnotizenView,
  daten: DatenView,
  kalender: KalenderView,
};
let lastView = null;

async function render() {
  const { name, param } = currentRoute();
  const view = VIEWS[name];
  const routeKey = name + "/" + (param || "");
  const isNavigation = routeKey !== lastView; // neue Ansicht oder nur Daten geändert?
  const lastName = lastView && lastView.split("/")[0];
  // Blättern zwischen Tagen auf "Heute": Ansicht bleibt, Scrollposition auch
  const sameView = lastName === name && name === "heute";
  if (lastName && RENDERERS[lastName] && isNavigation && !sameView) RENDERERS[lastName].leave();
  lastView = routeKey;

  // Bereich Privat / Baustelle: Kennzeichnung oben, "Ziele" heißen auf der Baustelle "Projekte"
  const bau = Store.getArea() === "bau";
  document.body.dataset.area = bau ? "bau" : "privat";
  document.getElementById("area-pill").hidden = !bau;
  document.querySelectorAll("[data-goal-label]").forEach((el) => { el.textContent = bau ? "Projekte" : "Ziele"; });
  document.querySelectorAll('[name="area"]').forEach((r) => { r.checked = r.value === (bau ? "bau" : "privat"); });
  const viewTitle = bau && name === "ziele" ? "Projekte" : bau && name === "ziel" ? "Projekt" : view.title;

  titleEl.textContent = viewTitle;
  document.title = viewTitle + " · Workflow";
  // Das Datum steht nur über "Heute"
  dateEl.textContent = name === "heute"
    ? new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })
    : "";

  // Aktiven Knopf in der Leiste unten markieren
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.view === (view.tab || name)) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  if (isNavigation) closeMenu(); // nur beim Ansichtswechsel (nicht z. B. bei − / + im Menü)

  if (RENDERERS[name]) {
    if (isNavigation && !sameView) window.scrollTo(0, 0);
    await RENDERERS[name].render(viewEl, {
      scrollToNow: isNavigation && !sameView,
      param,
      setTitle: (t) => { titleEl.textContent = t; },
      slide: sameView && isNavigation && HeuteView.takeSlide ? HeuteView.takeSlide() || (param > (lastView.split("/")[1] || "") ? "left" : "right") : null,
    });
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
document.getElementById("help-btn").addEventListener("click", () => Help.open(currentRoute().name));
document.getElementById("add-btn").addEventListener("click", () => {
  // In der Aufgaben-Ansicht direkt eine Aufgabe anlegen, sonst Auswahl zeigen
  const { name, param } = currentRoute();
  if (name === "aufgaben") Editor.newTask();
  else if (name === "ziele") Goals.newGoal();
  else if (name === "ziel" && param) Goals.newSubgoal(param);
  else if (name === "heute") Editor.chooseNew(HeuteView.shownDate());
  else if (name === "kalender") Editor.chooseNew(KalenderView.selectedDate());
  else Editor.chooseNew(new Date());
});
document.getElementById("menu-close").addEventListener("click", closeMenu);
// Bereich wechseln (Privat ↔ Baustelle)
document.querySelectorAll('[name="area"]').forEach((r) => r.addEventListener("change", async () => {
  await Store.setArea(r.value);
  closeMenu();
  // Detailseiten gehören zum alten Bereich → zurück zur Übersicht
  if (currentViewName() === "ziel") location.hash = "#ziele";
  Toast.show(r.value === "bau" ? "Baustelle: hier arbeiten die Gewerke" : "Privat: dein eigener Zeitplan");
}));
backdrop.addEventListener("click", closeMenu);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

// Höhe der Kopfzeile merken (für Leisten, die darunter kleben bleiben)
const topbarEl = document.querySelector(".topbar");
const setTopbarHeight = () => document.documentElement.style.setProperty("--topbar-h", topbarEl.offsetHeight + "px");
window.addEventListener("resize", setTopbarHeight);
setTopbarHeight();

// ---------- Größe der ganzen App (Zoom, v. a. für den PC) ----------
// Einstellung "zoom": 0.6 … 1.75. Wirkt auf alles (Schrift, Knöpfe, Pläne).
// window.UIZoom brauchen Stellen, die mit Pixel-Positionen rechnen.
const ZOOM_STEPS = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75];
window.UIZoom = 1;
function applyZoom(z) {
  const v = ZOOM_STEPS.includes(Number(z)) ? Number(z) : 1;
  window.UIZoom = v;
  document.body.style.zoom = v === 1 ? "" : String(v);
  const label = document.getElementById("zoom-label");
  if (label) label.textContent = Math.round(v * 100) + " %";
  setTopbarHeight();
}
function stepZoom(dir) {
  const i = ZOOM_STEPS.indexOf(window.UIZoom);
  const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, (i < 0 ? ZOOM_STEPS.indexOf(1) : i) + dir))];
  Store.saveSettings({ zoom: next });
}
document.getElementById("zoom-out").addEventListener("click", () => stepZoom(-1));
document.getElementById("zoom-in").addEventListener("click", () => stepZoom(+1));
document.getElementById("zoom-label").addEventListener("click", () => Store.saveSettings({ zoom: 1 }));
Store.getSettings().then((st) => applyZoom(st.zoom));
Store.subscribe((change) => {
  if (change.settings) applyZoom(change.settings.zoom);
  else if (change.action === "importiert" || change.action === "geleert") Store.getSettings().then((st) => applyZoom(st.zoom));
});

// ---------- Hell / Dunkel (Einstellungen → Darstellung) ----------
// "auto" = wie das Handy, "hell" oder "dunkel" = immer so
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "hell") root.dataset.theme = "light";
  else if (mode === "dunkel") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  // Farbe der Statusleiste (Handy) passend setzen
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    const isDarkMeta = m.media.includes("dark");
    m.content = mode === "hell" ? "#f2f2f7" : mode === "dunkel" ? "#000000" : (isDarkMeta ? "#000000" : "#f2f2f7");
  });
}
Store.getSettings().then((st) => applyTheme(st.farbmodus));
Store.subscribe((change) => {
  if (change.settings) applyTheme(change.settings.farbmodus);
  else if (change.action === "importiert" || change.action === "geleert") Store.getSettings().then((st) => applyTheme(st.farbmodus));
});

// ---------- Start ----------
window.addEventListener("hashchange", render);
// Wenn sich Daten ändern (Speicher-Baustein meldet sich), Ansicht neu zeichnen
Store.subscribe(() => render());
render();
// Alte Einträge im Ordner "Erledigt" (älter als 6 Monate) aufräumen
ErledigtView.cleanup();
// Daten von außen: Feiertage laden (im Hintergrund, mit Zwischenspeicher)
Holidays.refresh();

// ---------- Offline-Speicher (Service Worker) ----------
// Sorgt dafür, dass die App installierbar ist und auch ohne Internet startet.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service Worker konnte nicht registriert werden:", err);
    });
  });
}
