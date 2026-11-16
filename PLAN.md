# PLAN.md – Aktueller Stand

*Zuletzt aktualisiert: Mo 16.11.2026*

## Wo stehen wir?
- ✅ Idee, Rahmen und Technik-Entscheidung (PWA) stehen, Details in `docs/Grundlagen.md`
- ✅ GitHub-Repo verbunden, `CLAUDE.md` und `PLAN.md` angelegt
- ✅ Feste wiederkehrende Termine grundsätzlich geklärt (siehe „Entscheidungen“)
- ⏳ Zwei Detailfragen zu festen Terminen und Sperrzeiten, danach die restlichen Kategorien

## Entscheidungen

### Feste wiederkehrende Termine (z. B. Arbeit, Uni)
- **Wiederholung:** wöchentlich, alle 2 Wochen oder monatlich
- **Zeitraum:** optionales Start- und Enddatum, z. B. „bis Semesterende“
- **Ausnahmen:** Einzelne Termine lassen sich spontan absagen („fällt heute aus“), ohne die Serie zu ändern. Das Zeitfenster gilt danach als frei.
- **Details:** Titel, Ort/Raum, Notiz, Farbe, **Priorität**
- **Freie Zeit:** Feste Termine zählen als „belegt“, die App plant Aufgaben nur in freie Lücken ein.

### Sperrzeiten (neu)
- Man kann Zeiten für sich blockieren, z. B. Freizeit, oder als Regel „keine Termine nach 20 Uhr“.
- Sperrzeiten zählen bei der Berechnung freier Zeit als „nicht verfügbar“.

### Rahmen
- Ich arbeite **allein** an dem Projekt.

## Nächste Schritte
1. Klären: Wie genau soll „monatlich“ funktionieren, und sind Sperrzeiten eine harte Sperre oder nur eine Warnung?
2. Restliche Kategorien klären: flexible Termine, Aufgaben, einmalige Termine, Ziele
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
- [ ] Monatlich: an einem festen Datum (jeden 15.) oder an einem Wochentag (jeden 1. Montag)?
- [ ] Sperrzeiten: harte Sperre oder nur Warnung, wenn man trotzdem etwas einträgt?
- [ ] Kategorien fest vorgegeben oder von Nutzern anpassbar?
- [ ] Freigabe-Stufe „Nur frei/belegt“ übernehmen?
- [ ] Was bedeutet „flexibel“ bei flexiblen Terminen genau?

## Ausblick Version 2
Kollaboration mit Freigabe-Stufen (voller Zugriff, Projekt-Freigabe, evtl. nur frei/belegt). Dafür nötig: ein Backend (z. B. Supabase oder Firebase), Login und Synchronisation. Mehr dazu in `docs/Grundlagen.md`, Abschnitt 5.
