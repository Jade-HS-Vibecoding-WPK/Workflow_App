# Workflow – Zeit- und Aufgabenplanung mit kritischem Pfad

Eine Web-App fürs Handy (PWA), die beim **Zeit- und Aufgabenmanagement** hilft: Stunden- und Wochenplan, Aufgaben, Ziele mit Unterzielen – und eine **Projektplanung nach der Methode des kritischen Pfads (CPM)**, wie man sie aus dem Baumanagement kennt. Der Plan ist zum **Abarbeiten** da: Die App rechnet mit deiner tatsächlich freien Zeit und sagt dir, ob du im Plan bist.

**▶ App öffnen:** https://jade-hs-vibecoding-wpk.github.io/Workflow_App/

Projekt der Vibecoding KI-Werkstatt (WPK) an der Jade Hochschule, November 2026.

---

## Funktionen

| Bereich | Was die App kann |
|---|---|
| **Heute** | 4 Kacheln (Heute · Diese Woche fällig · Ziele & Aufgaben · Hängt hinterher) und Tagesplan 0–24 Uhr mit roter Jetzt-Linie |
| **Feste Termine** | jede Woche, alle 2 Wochen oder monatlich (Datum oder z. B. „1. Montag“), Zeitraum ab/bis, einzelne Tage spontan absagen („fällt heute aus“) |
| **Einmalige Termine** | mit Uhrzeit oder ganztägig/mehrtägig (z. B. Urlaub), Puffer vor/nach dem Termin |
| **Priorität** | 5 Stufen für alle Einträge – niedrige Priorität darf bei Zeitdruck weichen |
| **Aufgaben** | Liste wie in Erinnerungen, optionale Deadline, geschätzte Dauer, eigene Farbe, wiederkehrend (z. B. „jeden Sonntag Wäsche“), Sortierung nach Deadline, Priorität oder Farbe |
| **Ziele** | Deadline + Unterziele mit Aufwand (Std.) oder Dauer (Tage), Zwischen-Deadlines, Fortschritt eintragen („heute 2 Std., 20 % geschafft“) → **Restzeit-Schätzung** |
| **Kritischer Pfad** | Abhängigkeiten zwischen Unterzielen, Vorwärts-/Rückwärtsrechnung ab der Deadline, FAZ/FEZ/SAZ/SEZ, Gesamt- und freier Puffer, kritische Unterziele markiert, Einschätzung „gut im Plan / knapp / hängt hinterher“ inkl. Vorschlägen, welche Termine mit niedriger Priorität ausfallen könnten |
| **Baumanagement-Modus** | alle 4 Abhängigkeitsarten (Ende→Anfang, Anfang→Anfang, Ende→Ende, Anfang→Ende), Wartezeiten, auch negativ (Überlappung) |
| **Woche** | als Stundenplan (7 Spalten) oder als Liste zum Abarbeiten, Kalenderwochen blättern, leere Stelle antippen = neuer Termin |
| **Feiertage** | werden automatisch geladen (Daten von außen), Bundesland wählbar (Standard: Niedersachsen), feste Termine können an Feiertagen automatisch ausfallen |
| **Erledigt** | abgehakte Aufgaben und Ziele bleiben 6 Monate in einem eigenen Ordner, dann löscht die App sie automatisch |
| **Sonstiges** | Hell-/Dunkelmodus nach Handy-Einstellung, funktioniert offline, installierbar wie eine App |

### Wie rechnet der kritische Pfad?

1. **Freie Zeit pro Tag** = Arbeitszeit (Standard 8–22 Uhr) minus Termine, Puffer und Sperrzeiten, höchstens „max. Std. pro Tag“ (Standard 6). Einstellbar unter *Menü → Einstellungen*.
2. **Dauer jedes Unterziels** = Reststunden ÷ durchschnittliche freie Zeit (bei „Aufwand“) bzw. restliche Kalendertage (bei „Dauer“). Die Reststunden werden aus dem eingetragenen Fortschritt hochgerechnet (2 Std. = 20 % → noch ca. 8 Std.).
3. **CPM:** frühester Anfang/Ende vorwärts, spätester Anfang/Ende rückwärts ab der Deadline. Puffer = spätester − frühester Anfang. Kleinster Puffer = kritischer Pfad.
4. **Allein-Prüfung:** Weil eine Person Schritte nicht wirklich parallel erledigt, prüft die App zusätzlich, ob die gesamte freie Zeit bis zur Deadline für alle Reststunden reicht.

---

## So benutzt du die App

1. Link oben öffnen.
2. **Installieren:**
   - **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“
   - **Android (Chrome):** Menü ⋮ → „App installieren“
3. Die App startet **leer**. Über **„+“** oben legst du Termine, Aufgaben und Ziele an.
4. Einträge antippen = bearbeiten, Kreise antippen = abhaken bzw. Fortschritt eintragen.

---

## Datenschutz

- Alle Daten bleiben **nur auf deinem Gerät** (im Browser-Speicher). Es gibt keinen Login und keinen Server.
- Die einzige Verbindung nach außen ist das Laden der Feiertage. Dabei werden **nur Jahr und Land (DE)** abgefragt, keine persönlichen Daten.
- Hinweis: Wenn du die Browserdaten löschst, sind auch die Einträge weg.

---

## Technik

- **Progressive Web App** aus reinem HTML, CSS und JavaScript – ohne Frameworks und ohne Build-Werkzeuge.
- Veröffentlicht über **GitHub Pages**; ein Service Worker (`sw.js`) macht die App offline-fähig und installierbar.
- **Ein zentraler Speicher-Baustein** (`store.js`): Nur er speichert Daten. Für eine spätere Online-Version muss nur dieser Baustein auf einen Server umgestellt werden.
- Das Datenmodell enthält schon IDs, Besitzer, Freigabe-Felder und „zuständig“ bei Unterzielen (für Version 2), Abhängigkeiten werden nur über IDs gespeichert.

| Datei | Aufgabe |
|---|---|
| `index.html`, `styles.css` | Gerüst und Aussehen |
| `model.js` | Datenmodell (wie ein Eintrag aussieht) |
| `store.js` | Speicher-Baustein (einziger Zugriff auf gespeicherte Daten) |
| `schedule.js` | Was findet an welchem Tag statt (Wiederholungen, Absagen, Zähler) |
| `cpm.js` | Freie Zeit und kritischer Pfad |
| `feiertage.js` | Feiertage laden und zwischenspeichern |
| `editor.js` | Formulare zum Anlegen und Bearbeiten |
| `heute.js`, `woche.js`, `aufgaben.js`, `ziele.js`, `erledigt.js`, `einstellungen.js` | die einzelnen Ansichten |
| `app.js` | Wechsel zwischen den Ansichten, Menü, Start |

**Lokal testen:** im Projektordner `python3 -m http.server 8765` ausführen und `http://localhost:8765` öffnen.

---

## Datenquellen und Lizenzen

- **Feiertage:** [Nager.Date](https://date.nager.at) – kostenlose, öffentliche API ohne Anmeldung.
- **Icons:** App-Icon und alle Symbole in der App sind selbst erstellt.
- **Code:** MIT-Lizenz, siehe [LICENSE](LICENSE).
- Die Gestaltung ist an Apples Erinnerungen- und Kalender-App **angelehnt** (Bedienkonzept), es werden keine Apple-Grafiken, -Logos oder -Namen verwendet.

---

## KI-Nutzung

Diese App wurde im Rahmen der Vibecoding KI-Werkstatt **mit KI-Unterstützung entwickelt**: Der Code wurde mit **Claude Code** (Anthropic) erzeugt. Idee, Anforderungen, Entscheidungen (z. B. Kategorien, Design, kritischer Pfad, Prioritäten) und das Testen kamen von mir; die KI hat programmiert und jeden Schritt erklärt. Den Planungsverlauf dokumentieren [PLAN.md](PLAN.md), [CLAUDE.md](CLAUDE.md) und [docs/Grundlagen.md](docs/Grundlagen.md). Zum Testen wurden nur erfundene Termine verwendet.

---

## Ausblick (Version 2)

- **Zusammenarbeit:** Pläne verknüpfen mit Freigabe-Stufen (voller Zugriff, Projekt-Freigabe für gemeinsame Ziele, evtl. nur „frei/belegt“) – dafür Server/Backend (z. B. Supabase oder Firebase) und Login
- **Vorschläge in freie Zeit** („Du hast Dienstag Zeit, mach das doch da“) als gestrichelte Option zum Bestätigen
- **Netzplan- und Balkenplan-Ansicht** für Ziele, automatisches Umplanen nach CPM
- Sperrzeiten und Tagesnotizen verwalten, Monatskalender, Daten sichern/wiederherstellen als Datei, Schriftgröße
- Echte Push-Benachrichtigungen (brauchen einen Server)
