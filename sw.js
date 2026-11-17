// ============================================================
// Service Worker = kleiner Helfer im Hintergrund.
// Er speichert die App-Dateien auf dem Gerät, damit die App
// installierbar ist und auch ohne Internet startet.
//
// WICHTIG: Bei jeder Änderung an den App-Dateien die Versionsnummer
// erhöhen, sonst sehen Handys weiter die alte Version.
// ============================================================
const CACHE = "workflow-v31";

const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./model.js",
  "./store.js",
  "./schedule.js",
  "./editor.js",
  "./heute.js",
  "./aufgaben.js",
  "./erledigt.js",
  "./ziele.js",
  "./woche.js",
  "./feiertage.js",
  "./cpm.js",
  "./einstellungen.js",
  "./verwalten.js",
  "./statistik.js",
  "./planer.js",
  "./kalender.js",
  "./netzplan.js",
  "./balkenplan.js",
  "./vorlagen.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

// Beim Installieren: alle Dateien speichern
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

// Beim Aktivieren: alte Versionen löschen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Beim Laden einer Datei: erst aus dem Internet (immer aktuell),
// bei fehlendem Internet aus dem Speicher.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return; // fremde Seiten (z. B. Feiertage-API) nicht anfassen

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
