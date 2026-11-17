# PLAN.md – Aktueller Stand

*Zuletzt aktualisiert: Di 17.11.2026*

## Hier weitermachen
*Stand: Di 17.11.2026, ca. 9:30 Uhr. Ideenliste ist komplett besprochen.*

**Alle Must-Punkte + kritischer Pfad sind fertig und online.** App: https://jade-hs-vibecoding-wpk.github.io/Workflow_App/

**Neu ab Di 17.11.:** Wir sind gut in der Zeit, deshalb wird die App deutlich umfangreicher (Could-Punkte fest einbauen, alles optimieren). Vor jedem größeren Schritt wird ein **Sicherungspunkt** gesetzt, siehe [`BACKUPS.md`](BACKUPS.md). **Freeze:** Do 19.11. zwischen 12 und 16 Uhr, genauer je nach Stand.

Alle Entscheidungen zu den Ideen stehen in [`docs/Ideenliste.md`](docs/Ideenliste.md) (Spalte „Entscheidung“ und Abschnitt D1 Baustellen-Bereich).

**Reihenfolge der Bau-Etappen** (bestätigt Di 17.11.):
1. **Grundlagen-Paket** (Di Vormittag): A1 Sperrzeiten anlegen · A2 + B5 Warnung bei Sperrzeit/Überschneidung · A10 Tagesnotizen anlegen · A3 Daten sichern/wiederherstellen · B3 + B4 Grundgerüst (Schätzung und echte Zeit, Erledigtes mit Datum mitschreiben)
2. **Planungs-Kern** (Di Nachmittag – Mi früh): A4 + A9 Vorschläge in freie Zeit (30-Min.-Raster, CPM-Reihenfolge) · A8 Umplanen bei eigenem Termin + Knopf „neu berechnen“ · A5 Hinweis am Vortag · B1 „Was mache ich jetzt?“
3. **Ansichten** (Mi): A11 Monatskalender · A6 Netzplan (Idee von Niklas zur Struktur ist D1)
4. **Baustellen-Bereich** (Mi Abend – Do früh): D1 eigener Bereich + B8 Vorlage „Einfamilienhaus-Bauablauf“
5. **Wenn Zeit bleibt:** A7 Balkenplan · Pfeil-Ziehen im Netzplan · B7 Semesterzeiten + Haken „Uni-Veranstaltung“
6. **Abschluss** (Do): Test auf dem Handy, README ergänzen, **Freeze Do zwischen 12 und 16 Uhr** (genauer Zeitpunkt nach Stand), danach Poster

Vor jeder Etappe wird ein Sicherungspunkt gesetzt (`BACKUPS.md`).

Noch offen (unwichtig fürs Bauen): Was soll die App am Freitag live zeigen? Eher anstupsen oder eher ruhig?

Lokal testen: im Projektordner `python3 -m http.server 8765`, dann http://localhost:8765 öffnen (der Test-Server läuft nach dem Schließen der Sitzung nicht weiter).

## Wo stehen wir?
- ✅ Idee, Rahmen und Technik-Entscheidung (PWA) stehen, Details in `docs/Grundlagen.md`
- ✅ GitHub-Repo verbunden, `CLAUDE.md` und `PLAN.md` angelegt
- ✅ Feste wiederkehrende Termine grundsätzlich geklärt (siehe „Entscheidungen“)
- ✅ Sperrzeiten geklärt
- ✅ Aufgaben komplett geklärt
- ✅ Ziele inklusive kritischem Pfad geklärt
- ✅ Einmalige Termine komplett geklärt, Kategorien-Überblick steht
- ✅ Design-Grundlagen und Startbildschirm geklärt
- ✅ Ansichten und Menü geklärt
- ✅ MoSCoW-Liste und Etappen festgelegt
- ✅ Feature 1: PWA-Grundgerüst gebaut (Leiste unten, Menü, Platzhalter-Ansichten, Hell/Dunkel, Icons, offline-fähig), lokal getestet
- ✅ Online über GitHub Pages, auf dem Handy installiert und getestet
- ✅ Feature 2: Speicher-Baustein (`store.js`) + Datenmodell (`model.js`), getestet: Speichern, Ändern, Löschen, Neuladen, Export/Import
- ✅ Feature 3: Heute-Ansicht: 4 Kacheln mit Zählern, Tagesplan 0–24 Uhr mit roter Jetzt-Linie (springt beim Öffnen zur aktuellen Uhrzeit), Blöcke in Kategorie-Farben, Überschneidungen nebeneinander, Optionen gestrichelt, Sperrzeiten schraffiert, Puffer, Tagesnotizen und ganztägige Termine oben. Zeitplan-Logik in `schedule.js` (Wiederholungen, abgesagte Tage). „Hängt hinterher“ zählt vorerst überfällige Ziele/Unterziele, CPM kommt in Feature 9.
- ✅ Feature 4: Termine anlegen: „+“-Knopf → Auswahl → Formular (Blatt von unten). Feste Termine mit Wochentagen, jede Woche / alle 2 Wochen / monatlich (Datum oder Wochentag), Zeitraum ab/bis. Einmalige Termine mit Datum, ganztägig/mehrtägig. Beginn, Ende, Ort, Puffer, Priorität 1–5, Notiz. Prüfung der Eingaben. Antippen im Plan öffnet zum Bearbeiten; „Nur heute absagen“ (bleibt blass sichtbar, Zeit ist frei) und Löschen.
- ✅ Feature 5: Aufgaben: Liste wie Erinnerungen (Abhak-Kreise in Aufgabenfarbe), Gruppen nach Deadline (Überfällig/Heute/Diese Woche/Später/Ohne), Sortierung umschaltbar (Deadline/Priorität/Farbe, wird gemerkt). Formular: Titel, Notiz, optionale Deadline, Wiederholung (einmalig/wöchentlich/alle 2 Wochen/monatlich, abgeleitet aus der Deadline), Dauer, Priorität, 8 Farben. Abhaken mit „Rückgängig“; wiederkehrende Aufgaben rücken auf den nächsten Termin. Ordner „Erledigt“ mit Wiederherstellen, automatisches Löschen nach 6 Monaten.
- ✅ Feature 6: Ziele: Liste mit Fortschrittsbalken, Deadline, „noch X Tage“, Unterziel-Zähler und Restarbeit. Detailseite (#ziel/<id>) mit Kennzahlen, Unterzielen in Reihenfolge (nach oben/unten verschiebbar), Aufwand (Std.) oder Dauer (Tage), Zwischen-Deadline (geprüft gegen Ziel-Deadline). Kreis antippen = Fortschritt eintragen (Std. heute + % gesamt, Live-Vorschau der Restzeit); 100 % = erledigt. Gesamtfortschritt gewichtet (Dauer: 1 Tag ≈ 8 Std.). „Ziel abschließen“ → Ordner Erledigt. Anzeige „wartet auf: …“ ist vorbereitet (Abhängigkeiten anlegen kommt in Feature 9).
- ✅ Feature 7: Woche: umschaltbar **Stundenplan** (7 Spalten, Stundenraster, KW-Anzeige, vor/zurück blättern, heute rot markiert, Jetzt-Linie, Sperrzeiten schraffiert, ganztägige Termine und Tagesnotizen als Streifen oben, Kopfzeile bleibt beim Scrollen stehen) und **Liste** zum Abarbeiten (pro Tag, inkl. fälliger Aufgaben zum Abhaken und Ziel-Deadlines). Leere Stelle antippen = neuer Termin an diesem Tag/zu dieser Uhrzeit. Auswahl wird gemerkt.
- ✅ Feature 8: Feiertage (Daten von außen): Quelle Nager.Date (date.nager.at, kostenlos, ohne Key, nur Jahr + Land werden abgefragt). Lädt aktuelles + nächstes Jahr im Hintergrund, Zwischenspeicher über `Store` (max. alle 30 Tage neu), funktioniert offline mit letztem Stand. Anzeige: Heute (oben), Woche (Kopf rot, Streifen, Liste). Einstellungen: Bundesland (Standard Niedersachsen), „Feste Termine fallen an Feiertagen aus“ (Standard aus), Jetzt neu laden, nächste Feiertage.
- ✅ Feature 9: Kritischer Pfad (`cpm.js`):
  - **Freie Zeit** pro Tag = Arbeitsfenster (Standard 8–22 Uhr) minus Termine inkl. Puffer und Sperrzeiten, höchstens „max. Std./Tag“ (Standard 6). Urlaub = 0. Einstellbar.
  - **Dauer** je Unterziel: Aufwand → Reststunden ÷ Ø freie Zeit (nächste 4 Wochen); Dauer → restliche Kalendertage.
  - **CPM**: Vorwärts-/Rückwärtsrechnung ab Deadline (Zwischen-Deadlines berücksichtigt), alle 4 Abhängigkeitsarten mit Wartezeit (auch negativ), FAZ/FEZ/SAZ/SEZ, Gesamt- und freier Puffer, kritische Unterziele markiert. Kreise werden verhindert (nur zulässige Vorgänger wählbar).
  - **Allein-Prüfung**: Reicht die freie Zeit bis zur Deadline für alle Reststunden? Fließt in den Status ein.
  - **Status + Einschätzung** auf der Zielseite: „gut im Plan“ / „knapp“ / „hängt hinterher“ mit Puffer, voraussichtlichem Ende und Termin-Vorschlägen mit Priorität 1–2, die ausfallen könnten. Chip in der Ziel-Liste. Kachel „Hängt hinterher“ zählt jetzt nach CPM.
  - **Baumanagement-Modus** (Einstellungen): Abhängigkeitsart + Wartezeit wählbar, sonst nur „startet nach“.
  - Hinweis: Die Puffer je Unterziel sind klassischer CPM (ohne Allein-Prüfung); der Gesamtstatus berücksichtigt beides.
- ✅ README für die Abgabe (Funktionen, CPM-Erklärung, Bedienung, Datenschutz, Technik, Quellen/Lizenzen, KI-Nutzung, Ausblick)
- ✅ Feature 10: Test auf dem Handy (Niklas, Mo 16.11.): alles läuft
- ✅ Wunsch: Auf „Heute“ zwischen Tagen wischen (links = nächster Tag, rechts = vorheriger), zusätzlich ‹ › und „Heute“-Knopf. Titel/erste Kachel zeigen den Tag („Morgen“, „Mittwoch“ …), Jetzt-Linie nur heute, „+“ legt für den angezeigten Tag an, Scrollposition bleibt beim Blättern. Adresse `#heute/<Datum>`.
- ✅ Wunsch: „kritisch“ nur bei echter Enge. **Auslastung** = nötige Stunden (Unterziel + alle Vorgänger) ÷ freie Stunden bis zu seinem spätesten Ende. Unter 50 % kein Hinweis, **50–80 % „eng“** (orange), **ab 80 % oder wenn es nicht reicht „kritisch“** (rot). Die längste Kette heißt jetzt **„Hauptpfad“** (grau, unabhängig von Deadlines berechnet). Ziel-Status: im Plan / eng / kritisch / hängt hinterher (= reicht nicht); Hinweistext nennt die engen Unterziele.
- ✅ Ideenliste besprochen (`docs/Ideenliste.md`), Reihenfolge vorgeschlagen
- ✅ Etappe 1 Grundlagen-Paket (Di 17.11. vormittags), im Browser getestet:
  - **A1 Sperrzeiten** (Menü → Sperrzeiten): Name, Wochentage, von/bis, auch **über Nacht** (z. B. 23–7 Uhr) und „bis Mitternacht“ (00:00), **pausierbar** (Schalter „Aktiv“). Zählen als nicht verfügbar.
  - **A2 + B5 Warnung**: Beim Sichern eines Termins prüft die App Sperrzeiten und Überschneidungen (feste Termine: nächste 4 Wochen) und zeigt einen Hinweis. Zweites Tippen auf „Sichern“ = trotzdem eintragen. Optionen zählen nicht.
  - **A10 Tagesnotizen**: über „+“ → Tagesnotiz oder Menü → Tagesnotizen; antippen in Heute/Woche öffnet sie zum Ändern.
  - **A3 Daten sichern**: Sicherung als JSON-Datei (Handy: Teilen-Menü, Computer: Download), Sicherung laden (mit Rückfrage und „Rückgängig“), Anzeige „letzte Sicherung“ mit Erinnerung nach 14 Tagen, „Alle Daten löschen“ (mit Rückgängig).
  - **B3 + B4 Grundgerüst** (`statistik.js`): Aufgaben merken Erledigung + Schätzung im Verlauf, Unterziele die erste Schätzung. Im Ordner „Erledigt“ steht oben „Diese Woche: …“ und wie gut die Schätzungen passen.
- ✅ Etappe 2 Planungs-Kern (Di 17.11.), im Browser getestet (`planer.js`):
  - **A4 + A9 Vorschläge in freie Zeit**: Aufgaben und Unterziele (Aufwand) werden als gestrichelte Optionen in freie Lücken gelegt (Arbeitsfenster minus Termine inkl. Puffer, Sperrzeiten, bestätigte Blöcke; max. Std./Tag; Urlaub = frei). 30-Min.-Raster, zusammenhängende Stücke = ein Block, Blöcke möglichst ab 1 Std. (kleinere Lücken nur, wenn nötig), letzter Block auf die echte Restzeit gekürzt. Bis zu 6 Wochen im Voraus.
  - **Reihenfolge nach CPM**: kritisch → eng → Rest, dann wenig Puffer, dann Priorität. Abhängigkeiten werden beachtet (Nachfolger erst nach dem Vorgänger, inkl. Wartezeit). Kritische/enge Posten dürfen Optionen weniger wichtiger Posten vor ihrer Deadline verdrängen.
  - **A8 Umplanen**: Bei jeder Änderung prüft die App: vergangene Optionen verschwinden, Optionen im Weg eines Termins ziehen automatisch um (Meldung „… verschoben auf …“, bei Zeitnot mit Warnung). Der übrige Plan bleibt stehen. Bestätigte Blöcke im Weg: Rückfrage „Neu einplanen?“. Knopf **„↻ Neu planen“** auf Heute verteilt alle Optionen neu. Schalter „Vorschläge automatisch einplanen“ in den Einstellungen.
  - **Option antippen** (Heute/Woche): Bestätigen · Anderer Zeitpunkt (dort nicht mehr vorschlagen) · öffnen. Fester Block: Erledigt/Fortschritt · wieder zum Vorschlag · entfernen.
  - **A5 Hinweis am Vortag**: auf Heute „Morgen eingeplant – passt das?“ mit den Optionen von morgen und „Alle bestätigen“.
  - **B1 „Was mache ich jetzt?“**: Knopf auf Heute; zeigt die freie Zeit bis zum nächsten Termin/Block/Feierabend und schlägt das Wichtigste vor (kurze Lücke: was hineinpasst zuerst). „Los, jetzt machen“ trägt einen festen Block ab jetzt ein. Bei Termin/Sperrzeit/Feierabend: Hinweis auf Pause.
- ✅ Fehler behoben (Di 17.11.): Unterziel-Zeile antippen öffnete das Bearbeiten-Formular nicht mehr (seit der Umstellung auf „eng/kritisch“ fehlte dem Formular die Kennzeichnungs-Funktion). Liegt jetzt gemeinsam in `GoalMath`.
- ✅ Etappe 3 Ansichten (Di 17.11.), im Browser getestet (Handy-Format, hell/dunkel):
  - **A11 Monatskalender** (Leiste unten „Kalender“, `kalender.js`): Monatsraster Mo–So, heute rot, Feiertage rote Zahl, Punkte für Termine (Vorschläge gestrichelt), ⚑ für Deadlines, ✎ für Tagesnotizen, Streifen für ganztägige Termine (Urlaub). Tag antippen = Liste des Tages darunter (Einträge antippbar), nochmal antippen oder „Tagesplan ›“ = Tag in Heute. Blättern mit ‹ › oder Wischen. „+“ legt für den gewählten Tag an.
  - **A6 Netzplan** (`netzplan.js`): im Ziel umschaltbar **Liste | Netzplan** (wird gemerkt). Kästchen mit Nr., Name, Dauer (Std. ≈ Tage), Puffer, Zeitraum; Rahmen rot = kritisch, orange = eng, grau dick = Hauptpfad; erledigt blass. Pfeile je nach Art an Anfang/Ende, beschriftet mit NF/AF/EF/SF und Wartezeit; Unterziele ohne Nachfolger führen zum Kreis „Ziel“ mit Deadline. Seitlich scrollbar. Kästchen antippen = **Netzplan-Kästchen nach DIN 69900** (FAZ · Dauer · FEZ / Name / SAZ · GP · SEZ) + freier Puffer, Auslastung, Vorgänger; Knöpfe Fortschritt/Bearbeiten. Abhängigkeiten weiter im Formular (Pfeil-Ziehen = Ausblick).
- ⏳ Etappe 4: Baustellen-Bereich (D1) + Vorlage (B8)

## Entscheidungen

### Kategorien (Überblick)
| Kategorie | Beispiele | Kern |
|---|---|---|
| **Feste wiederkehrende Termine** | Arbeit, Uni | Wiederholung, feste Uhrzeit |
| **Einmalige Termine** | Arzttermin, Verabredung, Zocken | einmal, feste Uhrzeit; die **Priorität** entscheidet, ob der Termin bei Zeitdruck weichen darf |
| **Aufgaben** | Reisepass beantragen | einmalig erledigen, keine feste Uhrzeit, dient als Erinnerung, die App schlägt freie Zeit vor |
| **Ziele** | Uni-Abgabe (z. B. Architektur-Projekt) | Deadline und Unterziele mit Zeitaufwand und Fortschritt, die App plant die restliche Zeit |

Dazu kommen **Sperrzeiten**. Sie sind keine Einträge, sondern Regeln für die eigene Verfügbarkeit.

### Feste wiederkehrende Termine (z. B. Arbeit, Uni)
- **Wiederholung:** wöchentlich, alle 2 Wochen oder monatlich. Bei monatlich wählt man frei: festes Datum (z. B. jeden 5.) oder Wochentag im Monat (z. B. jeden 1. Montag).
- **Zeitraum:** optionales Start- und Enddatum, z. B. „bis Semesterende“
- **Ausnahmen:** Einzelne Termine lassen sich spontan absagen („fällt heute aus“), ohne die Serie zu ändern. Das Zeitfenster gilt danach als frei.
- **Details:** Titel, Ort/Raum, Notiz, **Priorität** (Farbe kommt von der Kategorie)
- **Freie Zeit:** Feste Termine zählen als „belegt“, die App plant Aufgaben nur in freie Lücken ein.

### Sperrzeiten (neu)
- Man kann Zeiten für sich blockieren, z. B. Freizeit, oder als Regel „keine Termine nach 20 Uhr“.
- Sperrzeiten zählen bei der Berechnung freier Zeit als „nicht verfügbar“.
- Sperrzeiten **warnen nur**: Trägt man trotzdem etwas ein, fragt die App „Liegt in deiner Sperrzeit, trotzdem eintragen?“.

### Einmalige Termine (zusammengelegt aus „unregelmäßige“ und „einmalige“ Termine)
- Dazu gehören alle Termine, die nur einmal stattfinden: z. B. Arzttermin, „Samstag Verabredung“, „Donnerstagabend zocken / Freizeit“.
- Die **Priorität** regelt das Verhalten: hoch (z. B. Arzt) wird nie verschoben, niedrig (z. B. Zocken) darf weichen.
- Sie zählen als **belegt**. Besteht aber Zeitdruck, darf die App dort **priorisierte Aufgaben vorschlagen**.
- Kommt etwas Wichtiges dazwischen, schlägt die App vor, den Termin zu verschieben, aber **nur abhängig von der Priorität**.
- **Details:** Titel, Ort/Raum, Notiz, Priorität und ein **Puffer**; Farbe kommt von der Kategorie (Zeit vor/nach dem Termin, die ebenfalls belegt ist).
- **Nicht nötig:** Fahrzeit (der Puffer reicht), Erinnerungen, Status „unsicher“.
- **Ganztägige Termine** gibt es, z. B. Urlaub über mehrere Tage. Geburtstage gehören **nicht** in den Kalender, der Fokus liegt auf dem Workflow.

### Tagesnotizen (neu)
- An einem bestimmten Datum kann man eine **kurze Notiz** anheften, z. B. „Geburtstag Oma“ oder „Semesterstart“.
- Sie blockiert **keine Zeit** und zählt nicht bei der freien Zeit.

### Priorität (gilt für alle Kategorien)
- **5 Stufen**, damit es genauer wird (1 = sehr niedrig … 5 = sehr hoch).
- **„Darf weichen“** legt die App automatisch über die Priorität fest. Bevor ein Termin wirklich verschoben wird oder ausfällt, **muss ich bestätigen**.

### Aufgaben
- Etwas, das man **einmal erledigt und dann fertig** ist, z. B. „Reisepass beantragen“.
- **Keine feste Uhrzeit**, die Aufgabe dient als **Erinnerung**.
- Die App macht **Vorschläge** in freier Zeit, z. B. „Du hast Dienstag Zeit, mach das doch da.“
- **Optionale Deadline:** Je näher sie rückt, desto dringender schlägt die App die Aufgabe vor.
- **Geschätzte Dauer**, z. B. 30 Min., damit der Vorschlag in die passende Lücke kommt.
- **Die App plant selbst ein, aber ich bestätige am Ende.** Nichts landet ohne Bestätigung fest im Plan.
- **Aufteilen:** Große Aufgaben, die sich über längere Zeit ziehen, können auf mehrere Blöcke verteilt werden.
- **Wiederholung:** einmalig (Standard), wöchentlich, alle 2 Wochen oder monatlich (Datum oder Wochentag), z. B. „jeden Sonntag Wäsche“.
- **Nach dem Bestätigen** wird die Option zu einem **festen Block**. Man kann sie aber auch als Vorschlag (Option) stehen lassen.
- Ein Vorschlag erscheint als **„Option“ in einer eigenen Farbe** im Kalender, nicht als fester Block. Am **Tag vorher** erinnert die App daran („Mach das doch morgen um …“). Diese Woche passiert das nur als Hinweis in der App, echte Push-Nachrichten bräuchten einen Server.

### Ziele
- Größere Vorhaben **mit Deadline**, z. B. eine Uni-Abgabe.
- Bestehen aus **Unterzielen**, z. B. Architektur-Abgabe → Grundriss, Lageplan, Details …
- Pro Unterziel:
  - **geschätzter Zeitaufwand**, z. B. 10 Std.
  - **Fortschritt eintragen:** gearbeitete Zeit + Prozent, z. B. „heute 2 Std., 20 % geschafft“
- Daraus **schätzt die App die Restzeit neu**, z. B. 2 Std. = 20 % → noch ca. 8 Std. Sie schlägt vor, **wann** man daran arbeiten soll, damit die Deadline klappt.
- **Zwischen-Deadlines:** Jedes Unterziel kann eine eigene Deadline haben, z. B. „Grundriss bis 01.12., ganze Abgabe bis 15.12.“
- **Reihenfolge** der Unterziele: kann man festlegen und ändern, oder man sagt einfach „alle bis Datum X fertig“.
- **Warnung**, wenn die freie Zeit bis zur Deadline nicht reicht, z. B. „Du brauchst noch 12 Std., hast aber nur 8 Std. frei.“
- **Allgemeine Einschätzung** zum Stand, z. B. „Du bist gut im Plan, weiter so!“ oder „Du hängst hinterher, investier mehr Zeit und lass etwas anderes ausfallen.“

### Kritischer Pfad bei Zielen
- Unterziele können **Abhängigkeiten** haben: Ein Unterziel kann erst starten, wenn andere fertig sind.
- Daraus berechnet die App den **kritischen Pfad**, also die Kette von Unterzielen, bei der jede Verzögerung die Deadline des ganzen Ziels verschiebt.
- Damit soll die App auch für **Projektplanung wie im Baumanagement** nutzbar sein.
- **Arten von Abhängigkeiten**, alle vier:
  - Ende → Anfang: erst fertig, dann starten (Standard)
  - Anfang → Anfang: gleichzeitig starten
  - Ende → Ende: gleichzeitig fertig
  - Anfang → Ende: erst wenn A startet, darf B enden (selten)
- **Wartezeiten** zwischen Unterzielen, z. B. „Estrich 7 Tage trocknen“. Das ist **optional zuschaltbar** (Baumanagement-Modus).
- **Aufwand oder Dauer**, pro Unterziel wählbar:
  - Aufwand in Stunden (eigene Arbeitszeit, wird in freie Zeit eingeplant)
  - Dauer in Tagen (Kalenderzeit, z. B. „Rohbau 3 Wochen“)
- **Wer arbeitet daran:** Diese Woche mache ich alles selbst. Im Datenmodell gibt es aber schon ein Feld **„zuständig“** für die spätere Zusammenarbeit (Version 2).
- **Wartezeiten können negativ sein (Überlappung)**, z. B. „Putz darf 2 Tage vor Ende der Elektro starten“.
- **Darstellung:** im **Kalender** und als **Netzplan** (Kästchen mit Pfeilen).
  - Jedes Kästchen zeigt **Name, Dauer und Puffer**. Per Tippen öffnet sich alles: frühester/spätester Anfang, frühestes/spätestes Ende, Gesamtpuffer und freier Puffer.
- **Abhängigkeiten anlegen:** im **Formular** des Unterziels („Startet nach: …“) **und** im Netzplan durch Ziehen eines Pfeils.
- **Bei Verzögerung auf dem kritischen Pfad:** Die App **warnt** und **plant um**, sie zeigt also, welche Termine mit niedriger Priorität ausfallen könnten.

### Erledigtes
- Wird **abgehakt und ausgeblendet**, aber in einem Ordner **„Erledigt“** aufbewahrt.
- Einträge im Ordner „Erledigt“ werden **nach 6 Monaten automatisch gelöscht**.

### Grundprinzip: Plan zum Abarbeiten
- Der Plan soll den **Workflow optimieren**, man **arbeitet ihn ab**. Er ist kein reiner Kalender.
- Ändert sich etwas, z. B. eine Zeit wird anders genutzt oder ein Termin kommt dazu, **passt sich der gesamte Zeitplan an**, nach der Logik des kritischen Pfads (CPM). Die App rechnet neu und schlägt den neuen Plan vor, **ich bestätige**.

### Design
- **Stil:** angelehnt an Erinnerungen (Listen, Abhak-Kreise) + Kalender (Stundenraster). Nur Inspiration, eigener Name und eigenes Icon.
- **Startbildschirm:** oben **Kacheln** für die wichtigsten Ansichten, darunter der **Tagesplan von heute** im Stundenraster.
  - 4 Kacheln mit Zähler: **Heute** · **Diese Woche fällig** · **Ziele & Aufgaben** (zusammen) · **Hängt hinterher** (Warnkachel: Ziele/Unterziele, die laut CPM hinter dem Plan liegen)
  - Erster Entwurf wurde gezeigt, der Gesamteindruck passt.
- **Hell- und Dunkelmodus**, folgt automatisch der Handy-Einstellung.
- **Farben:**
  - Feste Termine, einmalige Termine und Sperrzeiten haben **je eine feste Kategorie-Farbe**, nicht selbst wählbar.
  - **Aufgaben und Ziele** bekommen **eigene, frei wählbare Farben**, damit man sie klar unterscheiden kann.
- **Optionen (unbestätigte Vorschläge)** erscheinen im Kalender **gestrichelt und blass**.
- **Leiste unten:** Heute · Woche · Kalender · Ziele · Aufgaben

### Ansichten
- **Heute:** Startbildschirm (Kacheln + Tagesplan), siehe „Design“.
- **Woche**, umschaltbar zwischen zwei Formen:
  - **Stundenplan:** 7 Spalten mit Stundenraster, alles drin
  - **Abarbeitungsliste:** pro Tag eine Liste untereinander, zum Abarbeiten
- **Kalender:** Monatsansicht mit Punkten für Termine und Markierungen für Deadlines, Urlaub und Tagesnotizen. Antippen eines Tages öffnet den Tagesplan.
- **Ziele:** Liste der Ziele mit Farbe, Deadline und Fortschrittsbalken (%). Antippen öffnet die Unterziele, umschaltbar zwischen **Liste**, **Netzplan** und **Balkenplan**.
- **Aufgaben:** Liste wie in Erinnerungen mit Abhak-Kreisen. Sortierung **umschaltbar**: nach Deadline, Priorität oder Farbe/Gruppe.
- **Abhaken eines Ziel-Blocks:** Die App fragt direkt „Wie lange gearbeitet? Wie viel % geschafft?“, damit die CPM-Berechnung aktuell bleibt.
- **Menü** (Symbol oben links oder rechts): öffnet alle Ansichten und Menüs. **Ganz unten** liegt der Sonderordner **„Erledigt“**.
  - Inhalt: alle Ansichten, **Sperrzeiten**, **Tagesnotizen**, **Einstellungen** (Hell/Dunkel, Baumanagement-Modus, **Schriftgröße**), **Daten sichern / wiederherstellen** (Export/Import als Datei), ganz unten **„Erledigt“**.

### Rahmen
- Ich arbeite **allein** an dem Projekt.

## Nächste Schritte
1. Feature 10: Test auf dem Handy, Fehler beheben, README
2. Freeze Do zwischen 12 und 16 Uhr, danach Poster
3. Weiter nach Etappen-Tabelle

## MoSCoW (fertig bis Do 19.11., 12 Uhr) – bestätigt

**Must: ohne das gibt es keine App**
- [x] PWA-Grundgerüst: installierbar, online über GitHub Pages
- [x] Speicher-Baustein (lokal) + Datenmodell mit IDs, Besitzer, versteckten V2-Feldern
- [~] Anlegen/Bearbeiten/Löschen: feste Termine ✅, einmalige Termine ✅, Aufgaben ✅, Ziele mit Unterzielen ✅
- [x] Priorität (5 Stufen) und Kategorie-Farben
- [x] Heute-Ansicht (Kacheln + Tagesplan) ✅, Woche als Stundenplan ✅, Ziele-Liste, Aufgaben-Liste, Leiste unten
- [x] Abhaken; bei Zielen Abfrage „Std. + %“ → Restzeit-Schätzung
- [x] Daten von außen: Feiertage automatisch laden

**Should: das Highlight, wenn der Kern steht**
- [x] Abhängigkeiten „Ende → Anfang“ + Berechnung des kritischen Pfads, Kennzeichnung im Plan
- [x] Kachel „Hängt hinterher“ + Warnung „Zeit reicht nicht“
- [ ] Vorschläge in freie Zeit als gestrichelte Option zum Bestätigen
- [ ] Sperrzeiten
- [x] Wiederholung alle 2 Wochen / monatlich, Zeitraum, einzelnen Termin absagen (vorgezogen in Feature 4)
- [ ] Dunkelmodus ✅ (im Grundgerüst), Ordner „Erledigt“ ✅, Daten sichern/wiederherstellen

**Could: wird jetzt fest eingebaut** (Entscheidung Di 17.11.: wir sind gut in der Zeit, die App soll deutlich umfangreicher werden)
- [ ] Netzplan-Ansicht und Balkenplan
- [x] Weitere Abhängigkeitsarten, Wartezeiten (auch negativ), Baumanagement-Modus, Dauer in Tagen
- [ ] Automatisches Umplanen des ganzen Plans nach CPM
- [ ] Aufgaben aufteilen, Woche als Abarbeitungsliste ✅, Monatskalender
- [ ] Tagesnotizen, ganztägige Termine ✅, Schriftgröße, umschaltbare Sortierung ✅, Einschätzungstexte ✅, Löschen nach 6 Monaten ✅

**Won't (diese Woche):** Accounts, Server, Zusammenarbeit, Push-Nachrichten. Diese Punkte stehen auf dem Poster unter „Ausblick“.

## Etappen
| Tag | Etappe | Features (je eine Sitzung) | Status |
|---|---|---|---|
| Mo 16.11. | Idee & Plan | `PLAN.md` und `CLAUDE.md` stehen | ✅ |
| Di 17.11. | Grundgerüst & Aussehen: Die App läuft (✅ schon Mo fertig) | 1. PWA-Gerüst + Leiste unten + online auf GitHub Pages · 2. Speicher-Baustein + Datenmodell · 3. Heute-Ansicht mit Tagesplan · 4. Feste und einmalige Termine anlegen | – |
| Mi 18.11. | Daten von außen | 5. Aufgaben · 6. Ziele + Unterziele + Abhaken mit Std./% · 7. Woche als Stundenplan · 8. Feiertage laden | – |
| Do 19.11. | Fertig & veröffentlicht | 9. Abhängigkeiten + kritischer Pfad + „Hängt hinterher“ · 10. Test auf dem Handy, Fehler beheben, README · **Freeze zwischen 12 und 16 Uhr**, danach Poster | – |
| Fr 20.11. | Polieren und präsentieren | Präsentation, Abgabe bis 16 Uhr | – |

Weitere Should-Punkte kommen dazwischen, wenn ein Feature schneller fertig ist.

## Offene Fragen
- [x] Allein oder im Team? → allein
- [x] Feste Termine: Regelmäßigkeit, Ausnahmen, Details, Rolle bei freier Zeit → siehe „Entscheidungen“
- [x] Monatlich: festes Datum oder Wochentag? → frei wählbar, beides möglich
- [x] Sperrzeiten: harte Sperre oder Warnung? → nur Warnung
- [ ] Kategorien fest vorgegeben oder von Nutzern anpassbar?
- [ ] Freigabe-Stufe „Nur frei/belegt“ übernehmen?
- [x] Was bedeutet „flexibel“? → gemeint sind unregelmäßige, einmalige private Termine
- [x] Unregelmäßige und einmalige Termine zusammenlegen? → ja, die Priorität regelt das Verhalten
- [x] Details der einmaligen Termine → Grundfelder, ganztägig, 5 Prioritätsstufen, Tagesnotizen
- [x] Aufgaben: Deadline, Dauer, Vorschlag → siehe „Aufgaben“
- [x] Ziele: Reihenfolge, Warnung → siehe „Ziele“
- [x] Erledigtes → Ordner „Erledigt“, Löschen nach 6 Monaten
- [x] Ziele: eigene Zwischen-Deadlines für Unterziele? → ja
- [x] Kritischer Pfad: Abhängigkeiten, Wartezeiten, Aufwand/Dauer, Darstellung, Reaktion → siehe „Kritischer Pfad“
- [x] Kritischer Pfad: Anlegen, Netzplan-Werte, Überlappung → siehe „Kritischer Pfad“
- [ ] Kritischer Pfad: Was davon ist bis Freitag Must, was kommt später?
- [x] Wiederkehrende Aufgaben nötig? → ja
- [x] Einplanen automatisch oder per Hand? → die App plant, ich bestätige
- [x] Aufgaben aufteilen? → ja
- [x] Option nach der Bestätigung → wird zum festen Block, kann aber auch Vorschlag bleiben
- [x] Wiederholung bei Aufgaben → einmalig, wöchentlich, alle 2 Wochen, monatlich

## Ausblick Version 2
Kollaboration mit Freigabe-Stufen (voller Zugriff, Projekt-Freigabe, evtl. nur frei/belegt). Dafür nötig: ein Backend (z. B. Supabase oder Firebase), Login und Synchronisation. Mehr dazu in `docs/Grundlagen.md`, Abschnitt 5.
