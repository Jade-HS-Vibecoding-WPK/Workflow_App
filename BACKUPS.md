# BACKUPS.md – Sicherungspunkte

Hier steht jeder Sicherungspunkt, der neueste ganz oben. Jeder Punkt ist eine Git-Markierung (Tag) und liegt auch auf GitHub.

**Ein Backup zurückholen:** Sag einfach in der Sitzung „Lade Backup `<Name>`“. Claude holt dann den alten Stand als **neuen Commit** zurück. Die spätere Arbeit geht dabei nicht verloren, sie bleibt in der Git-Geschichte und lässt sich wiederholen.

Für Profis, im Projektordner:
```bash
git checkout backup-JJJJ-MM-TT-HHMM -- .
```
Danach committen. Alle Markierungen anzeigen: `git tag -l "backup-*"`

---

## backup-2026-11-17-0926
- **Zeit:** Di 17.11.2026, 09:26 Uhr
- **Zustand der App:** Feature 1–10 fertig und online (Heute mit Wischen, Woche, Aufgaben, Ziele mit CPM, Status eng/kritisch, Hauptpfad, Feiertage, Einstellungen, README). Alles getestet und lauffähig.
- **Zuletzt gemacht:** Ideenliste komplett besprochen (Block A, Block B, neue Idee D1 Baustellen-Bereich). Entscheidung: Could-Punkte werden fest eingebaut, die App wird umfangreicher. Backup-Regel eingeführt.
- **Als Nächstes:** Reihenfolge der Bau-Schritte festlegen, dann mit dem Bauen anfangen.
