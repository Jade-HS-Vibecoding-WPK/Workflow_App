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
};
const DEFAULT_VIEW = "heute";

const viewEl = document.getElementById("view");
const titleEl = document.getElementById("topbar-title");
const dateEl = document.getElementById("topbar-date");

// ---------- Ansicht anzeigen ----------
function currentViewName() {
  const name = location.hash.replace("#", "");
  return VIEWS[name] ? name : DEFAULT_VIEW;
}

function render() {
  const name = currentViewName();
  const view = VIEWS[name];

  titleEl.textContent = view.title;
  document.title = view.title + " · Workflow";
  // Das Datum steht nur über "Heute"
  dateEl.textContent = name === "heute"
    ? new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })
    : "";

  // Platzhalter, bis die Ansicht gebaut ist
  viewEl.innerHTML = `
    <section class="empty">
      <p class="empty__title">${view.title}</p>
      <p class="empty__text">${view.text}</p>
      <span class="empty__tag">kommt in ${view.feature}</span>
    </section>`;

  // Aktiven Knopf in der Leiste unten markieren
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.view === name) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });

  closeMenu();
  window.scrollTo(0, 0);
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
document.getElementById("menu-close").addEventListener("click", closeMenu);
backdrop.addEventListener("click", closeMenu);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

// ---------- Start ----------
window.addEventListener("hashchange", render);
// Wenn sich Daten ändern (Speicher-Baustein meldet sich), Ansicht neu zeichnen
Store.subscribe(() => render());
render();

// ---------- Offline-Speicher (Service Worker) ----------
// Sorgt dafür, dass die App installierbar ist und auch ohne Internet startet.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service Worker konnte nicht registriert werden:", err);
    });
  });
}
