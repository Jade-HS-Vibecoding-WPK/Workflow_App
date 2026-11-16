# PLAN.md – Aktueller Stand

*Zuletzt aktualisiert: Mo 16.11.2026*

## Hier weitermachen
README ist geschrieben. **Offen: Niklas testet die App auf dem Handy** (Checkliste im Chat), gefundene Fehler beheben. Danach Freeze (Do 12 Uhr) und Poster. Falls Zeit bleibt (Should): Vorschläge in freie Zeit, Sperrzeiten verwalten, Daten sichern/wiederherstellen.

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
- ⏳ Feature 10: Test auf dem Handy

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
2. Freeze Do 12 Uhr, danach Poster
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

**Could: wenn noch Zeit ist**
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
| Do 19.11. | Fertig & veröffentlicht | 9. Abhängigkeiten + kritischer Pfad + „Hängt hinterher“ · 10. Test auf dem Handy, Fehler beheben, README · **Freeze 12 Uhr**, danach Poster | – |
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
