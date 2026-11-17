# BACKUPS.md – Sicherungspunkte

Hier steht jeder Sicherungspunkt, der neueste ganz oben. Jeder Punkt ist eine Git-Markierung (Tag) und liegt auch auf GitHub.

**Ein Backup zurückholen:** Sag einfach in der Sitzung „Lade Backup `<Name>`“. Claude holt dann den alten Stand als **neuen Commit** zurück. Die spätere Arbeit geht dabei nicht verloren, sie bleibt in der Git-Geschichte und lässt sich wiederholen.

Für Profis, im Projektordner:
```bash
git checkout backup-JJJJ-MM-TT-HHMM -- .
```
Danach committen. Alle Markierungen anzeigen: `git tag -l "backup-*"`

---

## backup-2026-11-17-1022
- **Zeit:** Di 17.11.2026, 10:22 Uhr
- **Zustand der App:** Feature 1–10 + Etappe 1–4 (Planer, Kalender, Netzplan, Baustellen-Bereich mit Arbeitstagen, Vorlagen). Im Browser getestet, lauffähig.
- **Zuletzt gemacht:** Etappe 4 Baustellen-Bereich + Vorlagen gebaut, Feiertage-Nachladen repariert.
- **Als Nächstes:** Handy-Test, danach Extras oder Feinschliff + README.

## backup-2026-11-17-1014
- **Zeit:** Di 17.11.2026, 10:14 Uhr
- **Zustand der App:** Feature 1–10 + Etappe 1–3 + Hell/Dunkel-Schalter + kurze Blöcke einzeilig. Lauffähig.
- **Zuletzt gemacht:** Wünsche Darstellung umgesetzt.
- **Als Nächstes:** Etappe 4 Baustellen-Bereich + Vorlagen (größerer Umbau: Bereiche im Speicher).

## backup-2026-11-17-0957
- **Zeit:** Di 17.11.2026, 09:57 Uhr
- **Zustand der App:** Feature 1–10 + Etappe 1–3 (Planer, Monatskalender, Netzplan). Im Browser getestet, lauffähig.
- **Zuletzt gemacht:** Etappe 3: Monatskalender und Netzplan gebaut.
- **Als Nächstes:** Etappe 4 Baustellen-Bereich + Vorlage „Einfamilienhaus-Bauablauf“.

## backup-2026-11-17-0953
- **Zeit:** Di 17.11.2026, 09:53 Uhr
- **Zustand der App:** Feature 1–10 + Etappe 1 + Etappe 2 + Fix „Unterziel antippen“. Lauffähig.
- **Zuletzt gemacht:** Fehler behoben (Unterziel-Formular öffnete nicht).
- **Als Nächstes:** Etappe 3 Monatskalender + Netzplan.

## backup-2026-11-17-0945
- **Zeit:** Di 17.11.2026, 09:45 Uhr
- **Zustand der App:** Feature 1–10 + Etappe 1 + Etappe 2 (Planer: Vorschläge in freie Zeit, Umplanen, Hinweis am Vortag, „Was mache ich jetzt?“). Im Browser getestet, lauffähig.
- **Zuletzt gemacht:** Etappe 2 Planungs-Kern gebaut (`planer.js`).
- **Als Nächstes:** Etappe 3 Monatskalender + Netzplan.

## backup-2026-11-17-0935
- **Zeit:** Di 17.11.2026, 09:35 Uhr
- **Zustand der App:** Feature 1–10 + Etappe 1 (Sperrzeiten, Warnung bei Sperrzeit/Überschneidung, Tagesnotizen, Daten sichern/laden, Statistik-Grundgerüst). Im Browser getestet, lauffähig.
- **Zuletzt gemacht:** Etappe 1 Grundlagen-Paket gebaut.
- **Als Nächstes:** Etappe 2 Planungs-Kern (Vorschläge in freie Zeit, Umplanen, Hinweis am Vortag, „Was mache ich jetzt?“).

## backup-2026-11-17-0930
- **Zeit:** Di 17.11.2026, 09:30 Uhr
- **Zustand der App:** wie backup-2026-11-17-0926 (Feature 1–10, alles lauffähig).
- **Zuletzt gemacht:** Freeze auf Do 12–16 Uhr gesetzt, Reihenfolge der Bau-Etappen festgelegt (PLAN.md).
- **Als Nächstes:** Etappe 1 Grundlagen-Paket (Sperrzeiten, Warnungen, Tagesnotizen, Daten sichern, Zeiten mitschreiben).

## backup-2026-11-17-0926
- **Zeit:** Di 17.11.2026, 09:26 Uhr
- **Zustand der App:** Feature 1–10 fertig und online (Heute mit Wischen, Woche, Aufgaben, Ziele mit CPM, Status eng/kritisch, Hauptpfad, Feiertage, Einstellungen, README). Alles getestet und lauffähig.
- **Zuletzt gemacht:** Ideenliste komplett besprochen (Block A, Block B, neue Idee D1 Baustellen-Bereich). Entscheidung: Could-Punkte werden fest eingebaut, die App wird umfangreicher. Backup-Regel eingeführt.
- **Als Nächstes:** Reihenfolge der Bau-Schritte festlegen, dann mit dem Bauen anfangen.
