# Workflow – Zeit- und Aufgabenplanung mit kritischem Pfad

Eine Web-App fürs Handy (PWA), die beim **Zeit- und Aufgabenmanagement** hilft: Tages-, Wochen- und Monatsplan, Aufgaben, Ziele mit Unterzielen – und eine **Projektplanung nach der Methode des kritischen Pfads (CPM)**, wie man sie aus dem Baumanagement kennt. Der Plan ist zum **Abarbeiten** da: Die App rechnet mit deiner tatsächlich freien Zeit, legt Aufgaben und Ziel-Arbeit als Vorschläge in deine Lücken und sagt dir, ob du im Plan bist.

**▶ App öffnen:** https://jade-hs-vibecoding-wpk.github.io/Workflow_App/

Projekt der Vibecoding KI-Werkstatt (WPK) an der Jade Hochschule, November 2026.

---

## Funktionen

### Ansichten (Leiste unten: Heute · Woche · Kalender · Ziele · Aufgaben)

| Ansicht | Was sie zeigt |
|---|---|
| **Heute** | 4 Kacheln in einer Reihe (Heute · Fällig (Woche) · Ziele & Aufgaben · Hängt hinterher – inkl. überfälliger Aufgaben), Tagesplan 0–24 Uhr mit roter Jetzt-Linie. Zwischen Tagen wischen oder ‹ › blättern. Knöpfe **„Was mache ich jetzt?“** und **„↻ Neu planen“**, Hinweis **„Morgen eingeplant – passt das?“** (ab 14 Uhr) und **„Zur Erinnerung“** für offene Aufgaben |
| **Woche** | Stundenplan (7 Spalten, Kalenderwoche) oder Liste zum Abarbeiten; leere Stelle antippen = neuer Termin |
| **Kalender** | Monatsraster mit Punkten für Termine, ⚑ für Deadlines, Feiertagen und Urlaub; Tag antippen = Liste des Tages |
| **Ziele** | Ziele mit Fortschrittsbalken und Status; im Ziel umschaltbar **Liste · Netzplan · Balkenplan** |
| **Aufgaben** | Liste wie in Erinnerungen, gruppiert nach Deadline, sortierbar nach Deadline, Priorität oder Farbe; zeigt, wann jede Aufgabe eingeplant ist |

### Einträge

| Art | Was die App kann |
|---|---|
| **Termine** | ein Formular für alle: „Wiederholen: nie“ = einmalig, sonst fester Termin – jede Woche, alle 2 Wochen oder monatlich (Datum oder z. B. „1. Montag“), Zeitraum ab/bis, einzelne Tage absagen („fällt heute aus“), auch **über Mitternacht**, optional „Uni-Veranstaltung“ (nur in der Vorlesungszeit) |
| **Einmalig** | mit Uhrzeit oder ganztägig/mehrtägig (z. B. Urlaub = keine freie Zeit, optional fallen feste Termine wie Arbeit aus), Puffer vor/nach dem Termin |
| **Aufgaben** | optionale Deadline, geschätzte Dauer, eigene Farbe, wiederkehrend (z. B. „jede Woche Wäsche“) – abhaken mit „Rückgängig“ |
| **Ziele** | Deadline + Unterziele mit Aufwand (Std.) oder Dauer (Tage), Zwischen-Deadlines, Abhängigkeiten, Fortschritt eintragen („heute 2 Std., 20 % geschafft“) → **Restzeit-Schätzung** |
| **Sperrzeiten** | eigene Zeit blockieren (z. B. Schlafen 23–7 Uhr, Training), pausierbar; die App warnt, wenn ein Termin hineinfällt |
| **Tagesnotizen** | kurze Notiz an einem Datum (z. B. „Semesterstart“), blockiert keine Zeit |
| **Priorität** | 5 Stufen für alle Einträge – niedrige Priorität darf bei Zeitdruck weichen |

Beim Speichern warnt die App bei **Überschneidungen**, **Sperrzeiten** und wahrscheinlichen **Tippfehlern** (Ende vor Beginn = über 12 Std. bis zum nächsten Tag). Nach jedem Löschen gibt es **„Rückgängig“**.

### Der Planer – Vorschläge in deine freie Zeit

- Aufgaben und Arbeit an Unterzielen erscheinen als **gestrichelte Vorschläge** in freien Lücken (30-Minuten-Raster, bis 6 Wochen im Voraus). Antippen = **bestätigen**, anderen Zeitpunkt wählen oder öffnen.
- **Reihenfolge nach CPM:** kritisch → eng → Rest, dann wenig Puffer, dann Priorität. Abhängigkeiten werden beachtet.
- **Sinnvolle Blöcke:** Ziel-Arbeit mindestens 1,5 Std. („darunter hat man gerade mal ausgepackt“), höchstens 3 Std. Arbeit am Stück – auch über verschiedene Aufgaben hinweg –, dann 30 Min. Pause; nach Terminen mindestens 15 Min. Luft.
- **Gleichmäßig statt vollgestopft:** Hat ein Ziel genug Puffer, bekommt es ein Tagespensum (Arbeit verteilt auf ca. 60 % der Werktage bis zur Deadline) und das Wochenende bleibt frei, solange es nicht nötig ist.
- **Wiederkehrende Aufgaben** erst in der zweiten Hälfte des Abstands (Wäsche jede Woche, fällig Do → ab So); wird es eng, früher. Aufgaben ohne Deadline nur sparsam (nächste 7 Tage, max. 1 Std./Tag).
- **Automatisch umplanen:** Kommt ein Termin dazwischen, ziehen Vorschläge um (mit Meldung); werden früher Lücken frei, rücken sie nach. Bestätigte Blöcke bewegt die App nie ohne Rückfrage.
- **„Was mache ich jetzt?“** zeigt die freie Zeit bis zum nächsten Termin und schlägt das Wichtigste vor („Los, jetzt machen“).
- **Erinnerung alle 2 Tage:** offene Aufgaben mit Deadline, die noch nicht dran sind („Noch ist Zeit – nur damit nichts untergeht“).
- Einstellbar: Arbeitszeit, max. Std. pro Tag, Urlaub, „Am Wochenende keine Vorschläge“, Vorschläge automatisch an/aus.

### Kritischer Pfad – wie rechnet die App?

1. **Freie Zeit pro Tag** = Arbeitszeit (Standard 8–22 Uhr) minus Termine, Puffer und Sperrzeiten, höchstens „max. Std. pro Tag“ (Standard 6).
2. **Dauer jedes Unterziels** = Reststunden ÷ durchschnittliche freie Zeit (bei „Aufwand“) bzw. restliche Kalendertage (bei „Dauer“). Die Reststunden werden aus dem eingetragenen Fortschritt hochgerechnet (2 Std. = 20 % → noch ca. 8 Std.).
3. **CPM:** frühester Anfang/Ende (FAZ/FEZ) vorwärts, spätester Anfang/Ende (SAZ/SEZ) rückwärts ab der Deadline, Gesamt- und freier Puffer. Alle 4 Abhängigkeitsarten (Normal-, Anfangs-, End- und Sprungfolge) mit Wartezeit, auch negativ (Überlappung).
4. **Auslastung** = nötige Stunden (Unterziel + alle Vorgänger) ÷ freie Stunden bis zu seinem spätesten Ende. Ab 50 % **„eng“** (orange), ab 80 % oder wenn es nicht reicht **„kritisch“** (rot). Die längste Kette heißt **„Hauptpfad“**.
5. **Allein-Prüfung:** Weil eine Person Schritte nicht wirklich parallel erledigt, prüft die App zusätzlich, ob die gesamte freie Zeit bis zur Deadline reicht.
6. **Status** jedes Ziels: *im Plan · eng · kritisch · hängt hinterher* – mit Hinweis, welche Unterziele eng sind und welche Termine mit niedriger Priorität ausfallen könnten.

**Netzplan** (Kästchen nach DIN 69900, Pfeile mit NF/AF/EF/SF; Abhängigkeiten per „+“-Griff verbinden) und **Balkenplan** (Gantt mit Puffer, Heute-Linie, Wochenenden und Feiertagen, Punkte für die Tage mit eingeplanter Arbeit) zeigen dasselbe grafisch. Antippen eines Kästchens/Balkens zeigt alle Werte.

### Zwei Bereiche: Privat und Baustelle

Über das Menü umschaltbar. Die **Baustelle** ist ein Baumanagement-Modus mit eigenen Daten, gerechnet nach **DIN 69900 (Netzplantechnik)**:

- **Projekte** statt Ziele, **Vorgänge** statt Unterziele, jeweils mit **Gewerk** – Vorschlagsliste nach **VOB/C** (z. B. „Estricharbeiten (DIN 18353)“), frei eintippbar.
- **Anordnungsbeziehungen** NF (Normalfolge), AF (Anfangsfolge), EF (Endfolge), SF (Sprungfolge) mit **Zeitabstand** in Kalendertagen (z. B. Estrich trocknen +28), negativ = Überlappung.
- **Dauern und Puffer in Arbeitstagen** (Mo–Fr, optional auch Samstag; Feiertage und eine einstellbare **Winterpause** sind frei). Netzplan-Kästchen mit FAZ, FEZ, SAZ, SEZ, Gesamtpuffer (GP), freiem Puffer (FP), freiem Rückwärtspuffer (FRP) und unabhängigem Puffer (UP).
- **Kritischer Weg** = längster Weg vom Baubeginn bis zum Projektende (kleinste Gesamtpufferzeit). Weil Dauern in Arbeitstagen und Zeitabstände in Kalendertagen laufen, bestimmt die App ihn über die „treibenden“ Abhängigkeiten.
- **Meilensteine** (Dauer 0, z. B. Richtfest, Rohbau dicht, Übergabe) als ◆.
- **Warnung, wenn ein Gewerk doppelt eingeplant** ist (gleiches Gewerk, gleiche Zeit).
- Laufende Vorgänge erscheinen als Zeitblöcke im Tages- und Wochenplan (Arbeitszeit der Gewerke, Standard 7–16 Uhr). Baustellen-Termine erscheinen privat nur mit dem Schalter „Auch im Wochenplan anzeigen“.
- **Bauzeitenplan drucken / als PDF** (Balkenplan auf A4 quer).

**Vorlagen:** „Einfamilienhaus – Bauablauf“ (26 Vorgänge, 3 Meilensteine, Gewerke nach VOB/C, Aushärte- und Trockenzeiten als Faustwerte) und „Uni-Abgabe (Architektur)“. Jedes Ziel/Projekt lässt sich auch **als eigene Vorlage speichern**.

*Hinweis:* Normen-Nummern und Trockenzeiten sind Orientierungswerte (z. B. Zementestrich ca. 1 Woche je cm Dicke bis 4 cm; Belegreife vor dem Belegen per CM-Messung prüfen) – im echten Projekt gelten die aktuellen Normen und Herstellerangaben.

### Sonstiges

- **Leicht zu starten:** Willkommens-Karte beim ersten Start, Knopf **„Beispiel ansehen“** (erfundene Beispieldaten, mit einem Tipp wieder weg), **„?“** oben erklärt jede Ansicht samt Legende, Seltenes in Formularen unter „Mehr Optionen“.

- **Feiertage** werden automatisch geladen (Bundesland wählbar, Standard Niedersachsen); feste Termine können an Feiertagen ausfallen.
- **Semesterzeiten:** Uni-Veranstaltungen finden nur in der Vorlesungszeit statt.
- **Erledigt-Ordner:** abgehakte Aufgaben und Ziele bleiben 6 Monate, mit Wochenrückblick und „Wie gut passen meine Schätzungen?“.
- **Daten sichern:** Sicherung als Datei speichern und wieder laden, Erinnerung nach 14 Tagen.
- **Darstellung:** Hell/Dunkel automatisch oder fest, **Größe der App** 60–175 % (praktisch am PC).
- Funktioniert **offline** und ist **installierbar** wie eine App.

---

## So benutzt du die App

1. Link oben öffnen.
2. **Installieren:**
   - **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“
   - **Android (Chrome):** Menü ⋮ → „App installieren“
3. Die App startet **leer** mit einer kurzen Erklärung – oder tippe auf **„Beispiel ansehen“**. Über **„+“** oben legst du Termine, Aufgaben, Ziele und Tagesnotizen an; Sperrzeiten, Einstellungen und Datensicherung findest du im **Menü ☰**.
4. Einträge antippen = bearbeiten, Kreise antippen = abhaken bzw. Fortschritt eintragen, gestrichelte Vorschläge antippen = bestätigen oder verschieben.

---

## Datenschutz

- Alle Daten bleiben **nur auf deinem Gerät** (im Browser-Speicher). Es gibt keinen Login und keinen Server.
- Die einzige Verbindung nach außen ist das Laden der Feiertage. Dabei werden **nur Jahr und Land (DE)** abgefragt, keine persönlichen Daten.
- Hinweis: Wenn du die Browserdaten löschst, sind auch die Einträge weg – deshalb gibt es *Menü → Daten sichern*.

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
| `cpm.js` | Freie Zeit, kritischer Pfad, Auslastung, Bau-Rechnung in Arbeitstagen |
| `planer.js` | Vorschläge in freie Zeit, Umplanen, „Was mache ich jetzt?“ |
| `feiertage.js` | Feiertage laden und zwischenspeichern |
| `editor.js` | Formulare für Termine und Aufgaben |
| `verwalten.js` | Sperrzeiten, Tagesnotizen, Daten sichern |
| `vorlagen.js` | Vorlagen (Einfamilienhaus, Uni-Abgabe, eigene) |
| `demo.js`, `hilfe.js` | Beispiel ansehen, „?“-Hilfe |
| `netzplan.js`, `balkenplan.js` | Netzplan (DIN 69900) und Balkenplan im Ziel |
| `statistik.js` | Wochenrückblick und Schätzgenauigkeit |
| `heute.js`, `woche.js`, `kalender.js`, `aufgaben.js`, `ziele.js`, `erledigt.js`, `einstellungen.js` | die einzelnen Ansichten |
| `app.js` | Wechsel zwischen den Ansichten, Menü, Bereich, Größe, Start |

**Lokal testen:** im Projektordner `python3 -m http.server 8765` ausführen und `http://localhost:8765` öffnen.

---

## Datenquellen und Lizenzen

- **Feiertage:** [Nager.Date](https://date.nager.at) – kostenlose, öffentliche API ohne Anmeldung.
- **Icons:** App-Icon und alle Symbole in der App sind selbst erstellt.
- **Code:** MIT-Lizenz, siehe [LICENSE](LICENSE).
- Die Gestaltung ist an Apples Erinnerungen- und Kalender-App **angelehnt** (Bedienkonzept), es werden keine Apple-Grafiken, -Logos oder -Namen verwendet.

---

## KI-Nutzung

Diese App wurde im Rahmen der Vibecoding KI-Werkstatt **mit KI-Unterstützung entwickelt**: Der Code wurde mit **Claude Code** (Anthropic) erzeugt. Idee, Anforderungen, Entscheidungen (z. B. Kategorien, Design, kritischer Pfad, Prioritäten, Regeln des Planers) und das Testen auf dem Handy kamen von mir; die KI hat programmiert, jeden Schritt erklärt und eigene Testrunden im Browser gemacht. Den Planungsverlauf dokumentieren [PLAN.md](PLAN.md), [CLAUDE.md](CLAUDE.md), [BACKUPS.md](BACKUPS.md), [docs/Grundlagen.md](docs/Grundlagen.md) und [docs/Ideenliste.md](docs/Ideenliste.md). Zum Testen wurden nur erfundene Termine verwendet.

---

## Ausblick (Version 2)

- **Zusammenarbeit:** Pläne verknüpfen mit Freigabe-Stufen (voller Zugriff, Projekt-Freigabe für gemeinsame Ziele, evtl. nur „frei/belegt“) und Unterziele/Vorgänge Personen oder Gewerken zuweisen – dafür Server/Backend (z. B. Supabase oder Firebase) und Login
- **Echte Push-Benachrichtigungen** (brauchen einen Server)
- **Schätzungen lernen:** aus dem Verlauf ableiten, wie lange Aufgaben wirklich dauern, und Vorschläge daran anpassen
- Synchronisation zwischen Handy und PC
