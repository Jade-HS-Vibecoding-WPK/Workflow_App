# Ideenliste – Verbessern, Erweitern, nicht Überladen

*Angelegt: Mo 16.11.2026 abends, nach Fertigstellung aller Must-Punkte (Feature 1–10). Wird gemeinsam Punkt für Punkt besprochen; Entscheidungen werden hier und in `PLAN.md` eingetragen.*

**Freeze:** Do 19.11., 12 Uhr (danach Poster). Verbleibende Bauzeit: Di, Mi, Do-Vormittag.

---

## 0. Leitlinien gegen Überladung (beschlossen Di 17.11.)

Damit die App übersichtlich bleibt, muss jede neue Funktion diese Fragen bestehen:

1. **Hilft es beim Abarbeiten?** Das Grundprinzip der App ist „Plan zum Abarbeiten, der sich anpasst“. Was nur hübsch ist, hat Nachrang.
2. **Kein neuer Bildschirm, wenn es auch ohne geht.** Lieber in bestehende Ansichten einbauen (Heute, Ziel-Detail, Menü).
3. **Standardmäßig einfach.** Fortgeschrittenes ist ausgeschaltet oder versteckt (wie der Baumanagement-Modus).
4. **Bis zum Freeze lieber 3 Dinge richtig als 8 halb.** Der Rest kommt auf das Poster unter „Ausblick“.

*Entscheidung Di 17.11.: Leitlinien bestätigt. Die Regel „höchstens ein Knopf mehr pro Ansicht“ ist gestrichen, Niklas behält den Überblick selbst.*

Bewertung in den Tabellen:
- **Aufwand:** S = klein (unter 1 Std.), M = mittel (1–3 Std.), L = groß (halber Tag und mehr)
- **Überladung:** wie stark die Funktion die App voller oder komplizierter macht (niedrig / mittel / hoch)

---

## A. Schon beschlossen, aber noch nicht gebaut

| # | Funktion | Was genau | Nutzen | Aufwand | Überladung | Entscheidung |
|---|---|---|---|---|---|---|
| A1 | **Sperrzeiten verwalten** | Im Menü Zeiten anlegen, z. B. „keine Termine nach 20 Uhr“ oder „Do-Abend Freizeit“. Die Rechnung der freien Zeit berücksichtigt sie schon. | hoch: ohne Oberfläche kann man sie nicht nutzen | S | niedrig (Menüpunkt gibt es schon) | ✅ bauen (Di 17.11.) |
| A2 | **Warnung bei Sperrzeit** | Beim Eintragen in eine Sperrzeit: „Liegt in deiner Freizeit – trotzdem eintragen?“ (beschlossen: nur warnen) | mittel | S | niedrig | ✅ bauen, zusammen mit A1 und B5 (Di 17.11.) |
| A3 | **Daten sichern / wiederherstellen** | Alles als Datei exportieren und wieder einspielen (Technik ist fertig, nur Knöpfe fehlen) | hoch: Daten liegen nur auf dem Handy | S | niedrig (Menüpunkt gibt es schon) | ✅ bauen (Di 17.11.) |
| A4 | **Vorschläge in freie Zeit** | Die App legt Aufgaben bzw. Unterziel-Arbeit als gestrichelte „Option“ in freie Lücken; antippen → bestätigen (wird fester Block) oder Option lassen | sehr hoch: Kern der Idee | M–L | mittel | ✅ bauen: füllt freie Lücken im 30-Min.-Raster, aneinanderliegende Stücke werden ein Block, Lücken unter 30 Min. bleiben frei, „max. Std./Tag“ gilt (Di 17.11., Raster noch zu bestätigen) |
| A5 | **Hinweis am Vortag** | Oben auf „Heute“: „Morgen 14 Uhr: Reisepass beantragen – passt das?“ (nur in der App, keine Push-Nachricht) | mittel, hängt an A4 | S | niedrig | ✅ bauen, sobald A4 steht (Di 17.11.) |
| A6 | **Netzplan-Ansicht** | Pro Ziel Kästchen mit Pfeilen; Kästchen zeigen Name, Dauer, Puffer; antippen → alle Werte. Beschlossen: Abhängigkeiten auch per Pfeil-Ziehen | hoch fürs Baumanagement und die Präsentation | L (Pfeil-Ziehen zusätzlich L) | mittel (eigene Ansicht, aber nur im Ziel) | ✅ bauen, sehr wichtig für Niklas: Umschalter im Ziel, Kästchen mit Name/Dauer/Puffer, Farben kritisch/eng/Hauptpfad, antippen → alle Werte. Pfeil-Ziehen → Ausblick. Idee von Niklas zur Struktur folgt (Di 17.11.) |
| A7 | **Balkenplan (Gantt)** | Pro Ziel Zeitachse mit Balken | mittel | M–L | mittel | ⏸️ Ausblick, nur falls Mi-Abend Zeit übrig (Di 17.11.) |
| A8 | **Automatisches Umplanen** | Wenn sich etwas ändert, plant die App alle Vorschläge neu (mit Bestätigung) | hoch, baut auf A4 auf | L | mittel | ✅ Wunsch Niklas: Trägt man selbst etwas in einen geplanten Block ein, wird nur dieser Block automatisch neu eingeplant (Option: ohne Nachfrage, mit kurzer Meldung; bestätigter Block: Nachfrage „verschieben?“, danach wieder Option). Übriger Plan bleibt stehen. Reihenfolge nach CPM: wenig Puffer zuerst (kritisch → eng → Rest; Aufgaben nach Deadline/Priorität), Wichtiges darf Optionen mit mehr Puffer verdrängen, bestätigte Blöcke nie ohne Nachfrage; Warnung, wenn ein Unterziel dadurch kritisch wird. Gleiche Reihenfolge wie A4. Zusätzlich Knopf „Vorschläge neu berechnen“ für alles (Di 17.11., beschlossen) |
| A9 | **Aufgaben aufteilen** | Große Aufgabe auf mehrere Blöcke verteilen | mittel, baut auf A4 auf | M | niedrig | ✅ bauen als Teil von A4 (Aufteilen ergibt sich aus dem Raster) – Wunsch Niklas (Di 17.11.) |
| A10 | **Tagesnotizen anlegen** | Kurze Notiz an einem Datum (Anzeige funktioniert schon, Anlegen fehlt) | niedrig–mittel | S | niedrig | ✅ bauen (Di 17.11.) |
| A11 | **Monatskalender** | Monatsübersicht mit Punkten, Deadlines, Urlaub; Tag antippen → Tagesplan | mittel (Leiste unten hat „Kalender“ schon) | M | niedrig | ✅ bauen, Wunsch Niklas („unbedingt“): Monatsübersicht mit Punkten, Deadlines, Feiertagen, Urlaub, Tagesnotizen; Tag antippen → Heute für diesen Tag (Di 17.11.) |
| A12 | **Schriftgröße** | In den Einstellungen klein / normal / groß | niedrig–mittel | S | niedrig | ❌ weglassen, das Handy regelt die Schriftgröße selbst (Di 17.11.) |

---

## B. Neue Ideen aus dem ersten Brainstorming

| # | Idee | Was genau | Nutzen | Aufwand | Überladung | Meine erste Einschätzung | Entscheidung |
|---|---|---|---|---|---|---|---|
| B1 | **„Was mache ich jetzt?“** | Knopf auf „Heute“: schaut auf die freie Zeit bis zum nächsten Termin und schlägt das Wichtigste vor („1,5 Std. bis zur Vorlesung → Grundriss, kritisch“) | sehr hoch, „Abarbeiten“ in einem Knopf | M | niedrig (ein Knopf) | starker Kandidat | ✅ bauen, nutzt dieselbe CPM-Reihenfolge wie A4 (Di 17.11.) |
| B2 | **Arbeits-Timer** | Beim Unterziel „Start“ → Zeit läuft → „Stopp“ fragt nur noch nach % | hoch: spart Eintippen, genauere Daten | M | niedrig–mittel | gut, aber: Was, wenn man den Stopp vergisst? | ⏸️ später (Di 17.11.) |
| B3 | **Schätzung lernen** | App merkt, dass du z. B. 30 % länger brauchst, und rechnet das ein | hoch, aber erst mit Daten sinnvoll | M | niedrig (läuft im Hintergrund) | eher Ausblick | 🔸 Grundgerüst: App speichert geschätzte und tatsächliche Zeiten, damit später gelernt werden kann; Korrektur selbst noch nicht (Di 17.11.) |
| B4 | **Wochenrückblick** | „Diese Woche: 12 Std. an Zielen, 8 Aufgaben erledigt, Schätzungen zu 85 % getroffen“ | mittel, Motivation | M | mittel (neue Ansicht) | nett, kein Muss | 🔸 Grundgerüst: Arbeitszeiten und Erledigtes werden mit Datum festgehalten, damit ein Rückblick später rechnen kann (Di 17.11.) |
| B5 | **Überschneidungs-Warnung** | Beim Eintragen: „Überschneidet sich mit Vorlesung 10–12 Uhr“ | mittel | S | niedrig | passt gut zu A2 | ✅ bauen, zusammen mit A2 (Di 17.11.) |
| B6 | **Kalender-Import (.ics)** | Stundenplan aus Stud.IP / Google / Apple-Kalender übernehmen | hoch fürs Einrichten | M–L | niedrig | zweite „Daten von außen“; Risiko: viele Sonderfälle bei Wiederholungen | ❌ vorerst nicht, eigener Kalender, keine Importe (Di 17.11.) |
| B7 | **Semesterzeiten** | Vorlesungszeit der Jade HS als Vorschlag für „bis Semesterende“ | niedrig–mittel | S–M | niedrig | Datenquelle unklar (keine offizielle API) | ❌ keine Datenquelle. Falls umgesetzt: Semesterzeiten selbst eintragen + bei festen Terminen Haken „Uni-Veranstaltung“, damit sie nur in der Vorlesungszeit stattfinden (Di 17.11., optional) |
| B8 | **Vorlagen für Ziele** | z. B. „Architektur-Abgabe“ mit Grundriss, Lageplan, Details …; Bauablauf-Vorlagen | mittel–hoch für Wiederholungstäter | S–M | niedrig | einfach und praktisch | ✅ bauen, leicht anpassbar: Vorlage erzeugt ein normales Ziel, alles danach frei änderbar; erste Vorlage „Einfamilienhaus-Bauablauf“ (Di 17.11.) |
| B9 | **Blöcke verschieben** | Termin/Option im Plan per Ziehen verschieben | mittel | L (Touch-Ziehen ist fummelig) | niedrig | eher Ausblick | ⏸️ Ausblick (Di 17.11.) |

---

## C. Offene Brainstorming-Fragen

- Was nervt dich im Alltag beim Planen am meisten – und löst die App das schon?
- Welche Situation soll die App am Freitag in der Präsentation **live** zeigen? (Danach richten wir die Prioritäten aus.)
- Gibt es etwas in der App, das du **weglassen oder vereinfachen** würdest?
- Wie viele Ziele/Aufgaben hast du realistisch gleichzeitig? (Wichtig für Übersicht und Vorschläge.)
- Soll die App dich eher **anstupsen** (Hinweise, Einschätzungen) oder eher **ruhig** sein?

---

## D. Weitere Ideen aus dem Gespräch

### D1. Baustellen-Bereich (Idee Niklas, beschlossen Di 17.11.)
Der Baumanagement-Modus wird ein **eigener Bereich** neben „Privat“. Privat bleibt genau so, wie es ist.
- **Umschalten** im Menü: Privat ↔ Baustelle. Der Baustellen-Bereich startet **leer** und hat **dieselben Ansichten** (Heute, Woche, Kalender, Ziele, Aufgaben) mit eigenen Daten.
- Ziel = Baustelle/Projekt, Unterziel = Vorgang mit **Gewerk** (Feld „zuständig“ aus dem Datenmodell).
- **Rechnung:** Die Gewerke arbeiten durchgehend, also keine Rücksicht auf die eigene freie Zeit. Vorgänge dauern **Arbeitstage Mo–Fr**, Feiertage sind frei.
- **Wartezeiten** (z. B. Estrich trocknen) zählen **Kalendertage inkl. Wochenende und Feiertagen**.
- **Verbindung zu Privat:** Pro Baustellen-Termin gibt es einen Schalter **„Auch im Wochenplan anzeigen“**. Der Schalter ist **standardmäßig aus** und wird nur von Hand eingeschaltet. Erst dann erscheint der Termin im privaten Plan und **zählt dort als belegt** (keine Vorschläge darauf). Nichts passiert automatisch.
- **Reihenfolge:** nach dem Kern aus Block A, zusammen mit dem Netzplan (A6).
- Architektur-Check (Regel 5): Passt zur Online-Version, denn eine Baustelle teilt man später mit anderen.

---

## E. Ergebnis: Reihenfolge bis zum Freeze

*(wird am Ende der Besprechung festgelegt und nach `PLAN.md` übertragen)*
