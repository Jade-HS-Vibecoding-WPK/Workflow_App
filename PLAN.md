# PLAN.md – Aktueller Stand

*Zuletzt aktualisiert: Mo 16.11.2026*

## Wo stehen wir?
- ✅ Idee, Rahmen und Technik-Entscheidung (PWA) stehen, Details in `docs/Grundlagen.md`
- ✅ GitHub-Repo verbunden, `CLAUDE.md` und `PLAN.md` angelegt
- ✅ Feste wiederkehrende Termine grundsätzlich geklärt (siehe „Entscheidungen“)
- ✅ Sperrzeiten geklärt
- ✅ Einmalige Termine grundsätzlich geklärt (Details später), Kategorien-Überblick steht
- ⏳ Aufgaben klären, danach Ziele

## Entscheidungen

### Kategorien (Überblick)
| Kategorie | Beispiele | Kern |
|---|---|---|
| **Feste wiederkehrende Termine** | Arbeit, Uni | Wiederholung, feste Uhrzeit |
| **Einmalige Termine** | Arzttermin, Verabredung, Zocken | einmal, feste Uhrzeit; die **Priorität** entscheidet, ob der Termin bei Zeitdruck weichen darf |
| **Aufgaben** | Uni-Abgaben, Erledigungen | eigene Kategorie, Deadline statt Uhrzeit, optimieren den Workflow |
| **Ziele** | langfristige Vorhaben, Uni-Projekt | eigene Kategorie, bestehen aus abhakbaren Unterzielen, optimieren den Workflow |

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

### Rahmen
- Ich arbeite **allein** an dem Projekt.

## Nächste Schritte
1. Aufgaben klären
2. Ziele klären
3. Danach: Details der einmaligen Termine besprechen
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

## Ausblick Version 2
Kollaboration mit Freigabe-Stufen (voller Zugriff, Projekt-Freigabe, evtl. nur frei/belegt). Dafür nötig: ein Backend (z. B. Supabase oder Firebase), Login und Synchronisation. Mehr dazu in `docs/Grundlagen.md`, Abschnitt 5.
