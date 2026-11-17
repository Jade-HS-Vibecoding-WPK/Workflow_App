# BACKUPS.md – Sicherungspunkte

Hier steht jeder Sicherungspunkt, der neueste ganz oben. Jeder Punkt ist eine Git-Markierung (Tag) und liegt auch auf GitHub.

**Ein Backup zurückholen:** Sag einfach in der Sitzung „Lade Backup `<Name>`“. Claude holt dann den alten Stand als **neuen Commit** zurück. Die spätere Arbeit geht dabei nicht verloren, sie bleibt in der Git-Geschichte und lässt sich wiederholen.

Für Profis, im Projektordner:
```bash
git checkout backup-JJJJ-MM-TT-HHMM -- .
```
Danach committen. Alle Markierungen anzeigen: `git tag -l "backup-*"`

---

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
