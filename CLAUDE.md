# CLAUDE.md – Regeln für dieses Projekt

Dieses Dokument enthält die festen Regeln. Den aktuellen Stand findest du in `PLAN.md`, die Hintergründe in `docs/Grundlagen.md`.

## Ziel
Eine Zeitmanagement-App (PWA) mit Stunden- und Wochenplan und verschiedenen Kategorien von Einträgen (feste Termine, flexible Termine, Aufgaben, einmalige Termine, Ziele mit Unterzielen). Sie hilft, Aufgaben nicht zu vergessen und den Workflow zu verbessern.
Abgabe: GitHub-Repo mit README und Poster bis **Fr 20.11.2026, 16 Uhr**. Einzelprojekt (kein Team).

## Arbeitsweise
- **PLAN.md wird immer aktuell gehalten:** Vor jedem Commit aktualisieren und im selben Commit mitspeichern. Außerdem sofort aktualisieren, sobald eine Entscheidung fällt, ein Feature fertig ist oder sich die nächsten Schritte ändern. Diese Regel gilt dauerhaft.
- Neue Regeln oder Entscheidungen kommen sofort in diese `CLAUDE.md`.
- Ein Feature pro Sitzung: klein halten, testen, committen, Stand in `PLAN.md` festhalten.
- Nach jedem Commit wird auf GitHub hochgeladen (`git push`).
- Der Nutzer hat Grundkenntnisse: **jeden Schritt einfach auf Deutsch erklären.** Vor größeren Schritten erst Fragen stellen.
- Keine echten personenbezogenen Daten verwenden, zum Testen nur erfundene Termine.
- Keine API-Keys oder Tokens in Chats, Code oder auf GitHub (Keys nur in `.env`, und `.env` gehört in `.gitignore`).
- Nur im Projektordner arbeiten.

## Technik
- PWA, veröffentlicht über GitHub Pages; Daten nur lokal auf dem Gerät, kein Login, kein Server.
- Die App startet mit einem leeren Plan.
- Architektur-Regeln für Version 2 (Kollaboration):
  1. Jeder Eintrag hat eine eindeutige ID und einen Besitzer.
  2. Gespeichert wird nur über einen zentralen Speicher-Baustein.
  3. Ziele haben von Anfang an einzeln abhakbare Unterziele.
  4. Freigabe-Felder und das Feld „zuständig“ bei Unterzielen sind im Datenmodell vorgesehen, aber noch nicht in der Oberfläche.
  5. Bei jeder größeren Entscheidung prüfen: „Verbaut das die Online-Funktion später?“
  6. Abhängigkeiten zwischen Unterzielen werden nur über deren IDs gespeichert (Art + optionale Wartezeit), nie über Namen oder die Position in einer Liste.

## Gestaltung
Handy-Format zuerst. Weitere Regeln folgen am Di 17.11. (UI Design).
