# PLAN.md – Aktueller Stand

*Zuletzt aktualisiert: Mo 16.11.2026*

## Wo stehen wir?
- ✅ Idee, Rahmen und Technik-Entscheidung (PWA) stehen, Details in `docs/Grundlagen.md`
- ✅ GitHub-Repo verbunden, `CLAUDE.md` und `PLAN.md` angelegt
- ✅ Feste wiederkehrende Termine grundsätzlich geklärt (siehe „Entscheidungen“)
- ✅ Sperrzeiten geklärt
- ✅ Einmalige Termine grundsätzlich geklärt (Details später), Kategorien-Überblick steht
- ✅ Aufgaben komplett geklärt
- ⏳ Ziele: Kritischer Pfad (Abhängigkeiten zwischen Unterzielen) wird besprochen

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
- **Details:** Titel, Ort/Raum, Notiz, Farbe, **Priorität**
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
- Details: werden besprochen, wenn alle Kategorien geklärt sind.

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

### Kritischer Pfad bei Zielen (in Besprechung)
- Unterziele können **Abhängigkeiten** haben: Ein Unterziel kann erst starten, wenn andere fertig sind.
- Daraus berechnet die App den **kritischen Pfad**, also die Kette von Unterzielen, bei der jede Verzögerung die Deadline des ganzen Ziels verschiebt.
- Damit soll die App auch für **Projektplanung wie im Baumanagement** nutzbar sein.
- Details werden gerade besprochen.

### Erledigtes
- Wird **abgehakt und ausgeblendet**, aber in einem Ordner **„Erledigt“** aufbewahrt.
- Einträge im Ordner „Erledigt“ werden **nach 6 Monaten automatisch gelöscht**.

### Rahmen
- Ich arbeite **allein** an dem Projekt.

## Nächste Schritte
1. Kritischer Pfad bei Zielen ausführlich besprechen
2. Details der einmaligen Termine besprechen
3. Ansichten (Tag, Woche, Aufgabenliste, „Heute“) und Kernfunktionen festlegen
4. MoSCoW-Liste unten füllen
5. Etappen Di–Do konkret planen, inklusive „Daten von außen“ am Mittwoch

## MoSCoW (bis Fr 20.11.)
- **Must:** *(noch offen)*
- **Should:** *(noch offen)*
- **Could:** *(noch offen)*
- **Won't (diese Woche):** Accounts, Server, Kollaboration, echte Push-Benachrichtigungen

## Etappen
| Tag | Etappe | Status |
|---|---|---|
| Mo 16.11. | Idee & Plan: `PLAN.md` steht | ⏳ |
| Di 17.11. | Grundgerüst & Aussehen: Die App läuft | – |
| Mi 18.11. | Daten von außen | – |
| Do 19.11. | Fertig & veröffentlicht (Freeze besser 12 Uhr), danach Poster | – |
| Fr 20.11. | Präsentation, Abgabe bis 16 Uhr | – |

## Offene Fragen
- [x] Allein oder im Team? → allein
- [x] Feste Termine: Regelmäßigkeit, Ausnahmen, Details, Rolle bei freier Zeit → siehe „Entscheidungen“
- [x] Monatlich: festes Datum oder Wochentag? → frei wählbar, beides möglich
- [x] Sperrzeiten: harte Sperre oder Warnung? → nur Warnung
- [ ] Kategorien fest vorgegeben oder von Nutzern anpassbar?
- [ ] Freigabe-Stufe „Nur frei/belegt“ übernehmen?
- [x] Was bedeutet „flexibel“? → gemeint sind unregelmäßige, einmalige private Termine
- [x] Unregelmäßige und einmalige Termine zusammenlegen? → ja, die Priorität regelt das Verhalten
- [ ] Details der einmaligen Termine (nach den anderen Kategorien)
- [x] Aufgaben: Deadline, Dauer, Vorschlag → siehe „Aufgaben“
- [x] Ziele: Reihenfolge, Warnung → siehe „Ziele“
- [x] Erledigtes → Ordner „Erledigt“, Löschen nach 6 Monaten
- [x] Ziele: eigene Zwischen-Deadlines für Unterziele? → ja
- [ ] Kritischer Pfad: Arten von Abhängigkeiten, Wartezeiten, Aufwand vs. Dauer, Darstellung, Reaktion der App auf Verzögerungen
- [x] Wiederkehrende Aufgaben nötig? → ja
- [x] Einplanen automatisch oder per Hand? → die App plant, ich bestätige
- [x] Aufgaben aufteilen? → ja
- [x] Option nach der Bestätigung → wird zum festen Block, kann aber auch Vorschlag bleiben
- [x] Wiederholung bei Aufgaben → einmalig, wöchentlich, alle 2 Wochen, monatlich

## Ausblick Version 2
Kollaboration mit Freigabe-Stufen (voller Zugriff, Projekt-Freigabe, evtl. nur frei/belegt). Dafür nötig: ein Backend (z. B. Supabase oder Firebase), Login und Synchronisation. Mehr dazu in `docs/Grundlagen.md`, Abschnitt 5.
