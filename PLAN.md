# PLAN.md – Aktueller Stand

*Zuletzt aktualisiert: Mo 16.11.2026*

## Wo stehen wir?
- ✅ Idee, Rahmen und Technik-Entscheidung (PWA) stehen, Details in `docs/Grundlagen.md`
- ✅ GitHub-Repo verbunden, `CLAUDE.md` und `PLAN.md` angelegt
- ✅ Feste wiederkehrende Termine grundsätzlich geklärt (siehe „Entscheidungen“)
- ✅ Sperrzeiten geklärt
- ✅ Einmalige Termine grundsätzlich geklärt (Details später), Kategorien-Überblick steht
- ✅ Aufgaben und Ziele grundsätzlich geklärt
- ⏳ Letzte Detailfragen zu Aufgaben und Zielen

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

### Ziele
- Größere Vorhaben **mit Deadline**, z. B. eine Uni-Abgabe.
- Bestehen aus **Unterzielen**, z. B. Architektur-Abgabe → Grundriss, Lageplan, Details …
- Pro Unterziel:
  - **geschätzter Zeitaufwand**, z. B. 10 Std.
  - **Fortschritt eintragen:** gearbeitete Zeit + Prozent, z. B. „heute 2 Std., 20 % geschafft“
- Daraus **schätzt die App die Restzeit neu**, z. B. 2 Std. = 20 % → noch ca. 8 Std. Sie schlägt vor, **wann** man daran arbeiten soll, damit die Deadline klappt.

### Rahmen
- Ich arbeite **allein** an dem Projekt.

## Nächste Schritte
1. Detailfragen zu Aufgaben und Zielen klären
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
- [ ] Aufgaben: optionale Deadline? Dauer schätzen? Was passiert beim Annehmen eines Vorschlags?
- [ ] Ziele: Reihenfolge der Unterziele? Eigene Zwischen-Deadlines? Warnung, wenn die Zeit nicht reicht?
- [ ] Erledigtes ausblenden oder im Rückblick sammeln? Wiederkehrende Aufgaben nötig?

## Ausblick Version 2
Kollaboration mit Freigabe-Stufen (voller Zugriff, Projekt-Freigabe, evtl. nur frei/belegt). Dafür nötig: ein Backend (z. B. Supabase oder Firebase), Login und Synchronisation. Mehr dazu in `docs/Grundlagen.md`, Abschnitt 5.
