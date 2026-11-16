# CLAUDE.md – Regeln für dieses Projekt

Dieses Dokument enthält die festen Regeln. Den aktuellen Stand findest du in `PLAN.md`, die Hintergründe in `docs/Grundlagen.md`.

## Ziel
Eine Zeitmanagement-App (PWA) mit Stunden- und Wochenplan und verschiedenen Kategorien von Einträgen (feste Termine, flexible Termine, Aufgaben, einmalige Termine, Ziele mit Unterzielen). Sie hilft, Aufgaben nicht zu vergessen und den Workflow zu verbessern.
Abgabe: GitHub-Repo mit README und Poster bis **Fr 20.11.2026, 16 Uhr**. Einzelprojekt (kein Team).

## Arbeitsweise
- **PLAN.md wird immer aktuell gehalten:** Vor jedem Commit aktualisieren und im selben Commit mitspeichern. Außerdem sofort aktualisieren, sobald eine Entscheidung fällt, ein Feature fertig ist oder sich die nächsten Schritte ändern. Diese Regel gilt dauerhaft.
- Neue Regeln oder Entscheidungen kommen sofort in diese `CLAUDE.md`.
- Ein Feature pro Sitzung: klein halten, testen, committen, Stand in `PLAN.md` festhalten.
- Nach jedem Commit wird auf GitHub hochgeladen (`git push`).
- Der Nutzer hat Grundkenntnisse: **jeden Schritt einfach auf Deutsch erklären.** Vor größeren Schritten erst Fragen stellen.
- Keine echten personenbezogenen Daten verwenden, zum Testen nur erfundene Termine.
- Keine API-Keys oder Tokens in Chats, Code oder auf GitHub (Keys nur in `.env`, und `.env` gehört in `.gitignore`).
- Nur im Projektordner arbeiten.

## Technik
- PWA, veröffentlicht über GitHub Pages; Daten nur lokal auf dem Gerät, kein Login, kein Server.
- Die App startet mit einem leeren Plan.
- Umsetzung: reines **HTML, CSS und JavaScript** ohne Build-Werkzeuge (`index.html`, `styles.css`, `app.js`). So läuft die App direkt auf GitHub Pages.
- Arbeitsname der App: **„Workflow“** (änderbar).
- Online-Adresse: https://jade-hs-vibecoding-wpk.github.io/Workflow_App/ (GitHub Pages, Branch `main`, Ordner root; jeder Push wird automatisch veröffentlicht).
- `sw.js` (Service Worker) speichert die App für den Offline-Betrieb: **Bei jeder Änderung an App-Dateien die Versionsnummer `CACHE` in `sw.js` erhöhen** und neue Dateien in die Liste `FILES` eintragen.
- Dateien: `model.js` (Datenmodell, Funktionen `Model.neu…()`), `store.js` (Speicher-Baustein, **einziger** Zugriff auf gespeicherte Daten: `Store.list/get/save/remove`, alle mit `await`), `schedule.js` (Zeitplan-Logik: was an welchem Tag stattfindet, Zähler für Kacheln), `editor.js` (Formulare zum Anlegen/Bearbeiten: `Editor.chooseNew()`, `Editor.edit(id, datum)`), `heute.js` (Ansicht Heute), `aufgaben.js` (Abhaken-Logik `Tasks`, Meldung `Toast`, Ansicht Aufgaben), `erledigt.js` (Ordner Erledigt, Aufräumen nach 6 Monaten), `app.js` (Wechsel zwischen Ansichten; gebaute Ansichten stehen in `RENDERERS`). Nie direkt auf `localStorage` zugreifen, immer über `Store`.
- Lokal testen: `python3 -m http.server 8765` im Projektordner, dann `http://localhost:8765` öffnen.
- Architektur-Regeln für Version 2 (Kollaboration):
  1. Jeder Eintrag hat eine eindeutige ID und einen Besitzer.
  2. Gespeichert wird nur über einen zentralen Speicher-Baustein.
  3. Ziele haben von Anfang an einzeln abhakbare Unterziele.
  4. Freigabe-Felder und das Feld „zuständig“ bei Unterzielen sind im Datenmodell vorgesehen, aber noch nicht in der Oberfläche.
  5. Bei jeder größeren Entscheidung prüfen: „Verbaut das die Online-Funktion später?“
  6. Abhängigkeiten zwischen Unterzielen werden nur über deren IDs gespeichert (Art + optionale Wartezeit), nie über Namen oder die Position in einer Liste.

## Gestaltung
Handy-Format zuerst.
- **Stil-Richtung:** angelehnt an Apples Erinnerungen-App (klare Listen, runde Abhak-Kreise, farbige Listen) und gemischt mit dem Layout der Apple-Kalender-App (Tages-/Wochenraster). Das ist nur Inspiration: eigener Name, eigenes Icon, keine Apple-Logos oder kopierten Grafiken.
- Feste Kategorie-Farben für Termine und Sperrzeiten, frei wählbare Farben nur für Aufgaben und Ziele. Unbestätigte Vorschläge gestrichelt und blass.
- Hell- und Dunkelmodus nach Handy-Einstellung. Leiste unten: Heute · Woche · Kalender · Ziele · Aufgaben.
- Details siehe `PLAN.md` → „Design“.
