# CLAUDE.md – Regeln für dieses Projekt

Dieses Dokument enthält die festen Regeln. Den aktuellen Stand findest du in `PLAN.md`, die Hintergründe in `docs/Grundlagen.md`.

## Ziel
Eine Zeitmanagement-App (PWA) mit Stunden- und Wochenplan und verschiedenen Kategorien von Einträgen (feste Termine, flexible Termine, Aufgaben, einmalige Termine, Ziele mit Unterzielen). Sie hilft, Aufgaben nicht zu vergessen und den Workflow zu verbessern.
Abgabe: GitHub-Repo mit README und Poster bis **Fr 20.11.2026, 16 Uhr**. Einzelprojekt (kein Team). Freeze: Do 19.11.2026 zwischen 12 und 16 Uhr (genauer je nach Stand).

## Arbeitsweise
- **PLAN.md wird immer aktuell gehalten:** Vor jedem Commit aktualisieren und im selben Commit mitspeichern. Außerdem sofort aktualisieren, sobald eine Entscheidung fällt, ein Feature fertig ist oder sich die nächsten Schritte ändern. Diese Regel gilt dauerhaft.
- Neue Regeln oder Entscheidungen kommen sofort in diese `CLAUDE.md`.
- Ein Feature pro Sitzung: klein halten, testen, committen, Stand in `PLAN.md` festhalten.
- Nach jedem Commit wird auf GitHub hochgeladen (`git push`).
- **Backups (Sicherungspunkte):** Vor jedem größeren Schritt und nach jedem fertigen Feature wird ein Sicherungspunkt gesetzt: Commit + Git-Markierung `backup-JJJJ-MM-TT-HHMM` (mit hochladen: `git push --tags`) + Eintrag oben in `BACKUPS.md` (Zeitstempel, Name, was zuletzt gemacht wurde, Zustand der App). Zurückholen nur auf Wunsch von Niklas, und zwar als **neuer Commit** (`git checkout <backup> -- .`), damit nichts aus der Geschichte verloren geht.
- **Umfang (Entscheidung 17.11.):** Wir liegen gut in der Zeit, deshalb werden auch die Could-Punkte fest eingebaut und alles optimiert. Die App darf komplexer werden, die Leitlinien gegen Überladung gelten trotzdem.
- **Entscheidung 18.11. (Aufräumen + Azure):** Zuerst wird die App aufgeräumt und intuitiver gemacht (ohne Funktionen zu verlieren; Testpersonen fanden sie „schwer zu durchschauen“). Danach Azure in Stufen: Stufe 1 Login + Daten auf andere Geräte (Azure Static Web Apps, Konto „Azure for Students“), Stufe 2 Freigaben (eher nach der Abgabe). Die App bleibt ohne Login voll nutzbar; GitHub Pages bleibt als lokale Version ohne Konto bestehen (Backup), die Azure-Version darf eine eigene Adresse haben. Azure-Einrichtung macht Niklas im Portal mit Anleitung; Schlüssel nie in Chat/Code/GitHub.
- Der Nutzer hat Grundkenntnisse: **jeden Schritt einfach auf Deutsch erklären.** Vor größeren Schritten erst Fragen stellen.
- Keine echten personenbezogenen Daten verwenden, zum Testen nur erfundene Termine.
- Keine API-Keys oder Tokens in Chats, Code oder auf GitHub (Keys nur in `.env`, und `.env` gehört in `.gitignore`).
- Nur im Projektordner arbeiten.

## Technik
- PWA, veröffentlicht über GitHub Pages; Daten nur lokal auf dem Gerät, kein Login, kein Server.
- Die App startet mit einem leeren Plan.
- Umsetzung: reines **HTML, CSS und JavaScript** ohne Build-Werkzeuge (`index.html`, `styles.css`, `app.js`). So läuft die App direkt auf GitHub Pages.
- **Zwei Bereiche:** „Privat“ (rechnet mit eigener freier Zeit) und „Baustelle“ (Baumanagement-Modus, eigene Daten, Gewerke arbeiten Mo–Fr ohne Feiertage, Wartezeiten zählen Kalendertage inkl. Wochenende). Vorgänge erscheinen als Zeitblöcke in der Arbeitszeit der Gewerke (Standard 7–16 Uhr, Einstellung `bauArbeitVon/Bis`, pro Vorgang `workFrom/workTo`). Baustellen-Termine erscheinen privat nur mit Schalter „Auch im Wochenplan anzeigen“ (standardmäßig aus, von Hand einschalten; dann zählen sie privat als belegt). Details: `docs/Ideenliste.md` → D1. Technik: Feld `area` an jedem Eintrag; `Store.list()` liefert nur den aktiven Bereich (`Store.getArea/setArea`, Option `{ area }` bzw. `{ all: true }`); Bau-Ziele rechnet `CPM.computeBau` (Arbeitstage). Der Planer arbeitet nur im Bereich „privat“.
- Begriffe: „Hauptpfad“ = längste Kette (CPM). „eng“ ab 50 %, „kritisch“ ab 80 % Auslastung der freien Zeit (oder wenn es nicht reicht). Schwellen in `cpm.js` (`ENG_AB`, `KRITISCH_AB`).
- Externe Daten nur aus kostenlosen Quellen ohne API-Key; Quelle in der App und im README nennen. Keine persönlichen Daten an externe Dienste schicken.
- Arbeitsname der App: **„Workflow“** (änderbar).
- Online-Adresse: https://jade-hs-vibecoding-wpk.github.io/Workflow_App/ (GitHub Pages, Branch `main`, Ordner root; jeder Push wird automatisch veröffentlicht).
- `sw.js` (Service Worker) speichert die App für den Offline-Betrieb: **Bei jeder Änderung an App-Dateien die Versionsnummer `CACHE` in `sw.js` erhöhen** und neue Dateien in die Liste `FILES` eintragen.
- Dateien: `model.js` (Datenmodell, Funktionen `Model.neu…()`), `store.js` (Speicher-Baustein, **einziger** Zugriff auf gespeicherte Daten: `Store.list/get/save/remove`, alle mit `await`), `schedule.js` (Zeitplan-Logik: was an welchem Tag stattfindet, Zähler für Kacheln), `editor.js` (Formulare zum Anlegen/Bearbeiten: `Editor.chooseNew()`, `Editor.edit(id, datum)`), `heute.js` (Ansicht Heute), `aufgaben.js` (Abhaken-Logik `Tasks`, Meldung `Toast`, Ansicht Aufgaben), `erledigt.js` (Ordner Erledigt, Aufräumen nach 6 Monaten), `feiertage.js` (Daten von außen: `Holidays`, Nager.Date-API, Zwischenspeicher über Store), `cpm.js` (freie Zeit + kritischer Pfad: `CPM.computeGoal`, `CPM.freeHoursOn`), `einstellungen.js` (Ansicht Einstellungen: Planung, Feiertage), `verwalten.js` (`Manage` Formulare für Sperrzeiten/Tagesnotizen, Ansichten Sperrzeiten, Tagesnotizen, Daten sichern), `statistik.js` (`Stats`: Wochenrückblick + Schätzgenauigkeit, Grundgerüst), `kalender.js` (Ansicht Kalender `#kalender/<Datum>`: Monatsübersicht + Tagesliste), `vorlagen.js` (`Templates`: Vorlagen EFH-Bauablauf + Uni-Abgabe, eigene Vorlagen in den Einstellungen), `balkenplan.js` (`Balkenplan.html/wire`: Gantt im Ziel-Detail), `netzplan.js` (`Netzplan.html/wire/openNode`, Verbinden per „+“-Griff/Ziehen: Netzplan im Ziel-Detail, Kästchen nach DIN 69900, Folgen NF/AF/EF/SF), `planer.js` (`Planner`: Vorschläge in freie Zeit im 30-Min.-Raster nach CPM-Reihenfolge, automatisches Umplanen, Vorschlags-Blatt, „Was mache ich jetzt?“; speichert über `Store.saveMany`), `woche.js` (Ansicht Woche `#woche/<Montag>`: Stundenplan + Liste), `ziele.js` (`GoalMath` Fortschritt/Restzeit, `Goals` Formulare, Ansichten Ziele und Ziel-Detail `#ziel/<id>`), `app.js` (Wechsel zwischen Ansichten; gebaute Ansichten stehen in `RENDERERS`). Nie direkt auf `localStorage` zugreifen, immer über `Store`.
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
- **Leitlinien gegen Überladung** (beschlossen 17.11.): Jede neue Funktion muss beim Abarbeiten helfen; kein neuer Bildschirm, wenn es ohne geht; Fortgeschrittenes standardmäßig aus/versteckt; bis zum Freeze lieber wenig richtig als viel halb. Details in `docs/Ideenliste.md` → Abschnitt 0.
- **Stil-Richtung:** angelehnt an Apples Erinnerungen-App (klare Listen, runde Abhak-Kreise, farbige Listen) und gemischt mit dem Layout der Apple-Kalender-App (Tages-/Wochenraster). Das ist nur Inspiration: eigener Name, eigenes Icon, keine Apple-Logos oder kopierten Grafiken.
- Feste Kategorie-Farben für Termine und Sperrzeiten, frei wählbare Farben nur für Aufgaben und Ziele. Unbestätigte Vorschläge gestrichelt und blass.
- **Größe der App** (Zoom) per Einstellung `zoom` → CSS-`zoom` am `<body>`. Wer mit Bildschirm-Koordinaten (`getBoundingClientRect`, `clientX/Y`) und Plan-Pixeln rechnet, muss durch `window.UIZoom` teilen bzw. damit malnehmen.
- Hell- und Dunkelmodus nach Handy-Einstellung, in den Einstellungen auch fest auf Hell oder Dunkel stellbar (`data-theme` am `<html>`; neue Dunkel-Regeln immer für beide Fälle schreiben). Leiste unten: Heute · Woche · Kalender · Ziele · Aufgaben.
- Details siehe `PLAN.md` → „Design“.
