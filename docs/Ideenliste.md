# Ideenliste – Verbessern, Erweitern, nicht Überladen

*Angelegt: Mo 16.11.2026 abends, nach Fertigstellung aller Must-Punkte (Feature 1–10). Wird gemeinsam Punkt für Punkt besprochen; Entscheidungen werden hier und in `PLAN.md` eingetragen.*

**Freeze:** Do 19.11., 12 Uhr (danach Poster). Verbleibende Bauzeit: Di, Mi, Do-Vormittag.

---

## 0. Leitlinien gegen Überladung (Vorschlag, noch zu besprechen)

Damit die App übersichtlich bleibt, muss jede neue Funktion diese Fragen bestehen:

1. **Hilft es beim Abarbeiten?** Das Grundprinzip der App ist „Plan zum Abarbeiten, der sich anpasst“. Was nur hübsch ist, hat Nachrang.
2. **Kein neuer Bildschirm, wenn es auch ohne geht.** Lieber in bestehende Ansichten einbauen (Heute, Ziel-Detail, Menü).
3. **Standardmäßig einfach.** Fortgeschrittenes ist ausgeschaltet oder versteckt (wie der Baumanagement-Modus).
4. **Höchstens ein Knopf mehr pro Ansicht.**
5. **Bis zum Freeze lieber 3 Dinge richtig als 8 halb.** Der Rest kommt auf das Poster unter „Ausblick“.

Bewertung in den Tabellen:
- **Aufwand:** S = klein (unter 1 Std.), M = mittel (1–3 Std.), L = groß (halber Tag und mehr)
- **Überladung:** wie stark die Funktion die App voller oder komplizierter macht (niedrig / mittel / hoch)

---

## A. Schon beschlossen, aber noch nicht gebaut

| # | Funktion | Was genau | Nutzen | Aufwand | Überladung | Entscheidung |
|---|---|---|---|---|---|---|
| A1 | **Sperrzeiten verwalten** | Im Menü Zeiten anlegen, z. B. „keine Termine nach 20 Uhr“ oder „Do-Abend Freizeit“. Die Rechnung der freien Zeit berücksichtigt sie schon. | hoch: ohne Oberfläche kann man sie nicht nutzen | S | niedrig (Menüpunkt gibt es schon) | offen |
| A2 | **Warnung bei Sperrzeit** | Beim Eintragen in eine Sperrzeit: „Liegt in deiner Freizeit – trotzdem eintragen?“ (beschlossen: nur warnen) | mittel | S | niedrig | offen |
| A3 | **Daten sichern / wiederherstellen** | Alles als Datei exportieren und wieder einspielen (Technik ist fertig, nur Knöpfe fehlen) | hoch: Daten liegen nur auf dem Handy | S | niedrig (Menüpunkt gibt es schon) | offen |
| A4 | **Vorschläge in freie Zeit** | Die App legt Aufgaben bzw. Unterziel-Arbeit als gestrichelte „Option“ in freie Lücken; antippen → bestätigen (wird fester Block) oder Option lassen | sehr hoch: Kern der Idee | M–L | mittel | offen |
| A5 | **Hinweis am Vortag** | Oben auf „Heute“: „Morgen 14 Uhr: Reisepass beantragen – passt das?“ (nur in der App, keine Push-Nachricht) | mittel, hängt an A4 | S | niedrig | offen |
| A6 | **Netzplan-Ansicht** | Pro Ziel Kästchen mit Pfeilen; Kästchen zeigen Name, Dauer, Puffer; antippen → alle Werte. Beschlossen: Abhängigkeiten auch per Pfeil-Ziehen | hoch fürs Baumanagement und die Präsentation | L (Pfeil-Ziehen zusätzlich L) | mittel (eigene Ansicht, aber nur im Ziel) | offen |
| A7 | **Balkenplan (Gantt)** | Pro Ziel Zeitachse mit Balken | mittel | M–L | mittel | offen |
| A8 | **Automatisches Umplanen** | Wenn sich etwas ändert, plant die App alle Vorschläge neu (mit Bestätigung) | hoch, baut auf A4 auf | L | mittel | offen |
| A9 | **Aufgaben aufteilen** | Große Aufgabe auf mehrere Blöcke verteilen | mittel, baut auf A4 auf | M | niedrig | offen |
| A10 | **Tagesnotizen anlegen** | Kurze Notiz an einem Datum (Anzeige funktioniert schon, Anlegen fehlt) | niedrig–mittel | S | niedrig | offen |
| A11 | **Monatskalender** | Monatsübersicht mit Punkten, Deadlines, Urlaub; Tag antippen → Tagesplan | mittel (Leiste unten hat „Kalender“ schon) | M | niedrig | offen |
| A12 | **Schriftgröße** | In den Einstellungen klein / normal / groß | niedrig–mittel | S | niedrig | offen |

---

## B. Neue Ideen aus dem ersten Brainstorming

| # | Idee | Was genau | Nutzen | Aufwand | Überladung | Meine erste Einschätzung | Entscheidung |
|---|---|---|---|---|---|---|---|
| B1 | **„Was mache ich jetzt?“** | Knopf auf „Heute“: schaut auf die freie Zeit bis zum nächsten Termin und schlägt das Wichtigste vor („1,5 Std. bis zur Vorlesung → Grundriss, kritisch“) | sehr hoch, „Abarbeiten“ in einem Knopf | M | niedrig (ein Knopf) | starker Kandidat | offen |
| B2 | **Arbeits-Timer** | Beim Unterziel „Start“ → Zeit läuft → „Stopp“ fragt nur noch nach % | hoch: spart Eintippen, genauere Daten | M | niedrig–mittel | gut, aber: Was, wenn man den Stopp vergisst? | offen |
| B3 | **Schätzung lernen** | App merkt, dass du z. B. 30 % länger brauchst, und rechnet das ein | hoch, aber erst mit Daten sinnvoll | M | niedrig (läuft im Hintergrund) | eher Ausblick | offen |
| B4 | **Wochenrückblick** | „Diese Woche: 12 Std. an Zielen, 8 Aufgaben erledigt, Schätzungen zu 85 % getroffen“ | mittel, Motivation | M | mittel (neue Ansicht) | nett, kein Muss | offen |
| B5 | **Überschneidungs-Warnung** | Beim Eintragen: „Überschneidet sich mit Vorlesung 10–12 Uhr“ | mittel | S | niedrig | passt gut zu A2 | offen |
| B6 | **Kalender-Import (.ics)** | Stundenplan aus Stud.IP / Google / Apple-Kalender übernehmen | hoch fürs Einrichten | M–L | niedrig | zweite „Daten von außen“; Risiko: viele Sonderfälle bei Wiederholungen | offen |
| B7 | **Semesterzeiten** | Vorlesungszeit der Jade HS als Vorschlag für „bis Semesterende“ | niedrig–mittel | S–M | niedrig | Datenquelle unklar (keine offizielle API) | offen |
| B8 | **Vorlagen für Ziele** | z. B. „Architektur-Abgabe“ mit Grundriss, Lageplan, Details …; Bauablauf-Vorlagen | mittel–hoch für Wiederholungstäter | S–M | niedrig | einfach und praktisch | offen |
| B9 | **Blöcke verschieben** | Termin/Option im Plan per Ziehen verschieben | mittel | L (Touch-Ziehen ist fummelig) | niedrig | eher Ausblick | offen |

---

## C. Offene Brainstorming-Fragen

- Was nervt dich im Alltag beim Planen am meisten – und löst die App das schon?
- Welche Situation soll die App am Freitag in der Präsentation **live** zeigen? (Danach richten wir die Prioritäten aus.)
- Gibt es etwas in der App, das du **weglassen oder vereinfachen** würdest?
- Wie viele Ziele/Aufgaben hast du realistisch gleichzeitig? (Wichtig für Übersicht und Vorschläge.)
- Soll die App dich eher **anstupsen** (Hinweise, Einschätzungen) oder eher **ruhig** sein?

---

## D. Weitere Ideen aus dem Gespräch

*(wird beim Besprechen ergänzt)*

---

## E. Ergebnis: Reihenfolge bis zum Freeze

*(wird am Ende der Besprechung festgelegt und nach `PLAN.md` übertragen)*
