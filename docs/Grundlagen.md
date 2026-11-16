# Zeitmanagement-App – Grundlagen & Entscheidungen

*Stand: Mo 16.11.2026, Ergebnis des ersten Planungsgesprächs (Vibecoding KI-Werkstatt, Jade Hochschule)*

---

## 1. Idee & Gesamtziel

Eine App, die beim **Zeit- und Aufgabenmanagement** hilft. Sie enthält einen **Stunden- und Wochenplan** mit verschiedenen Kategorien von Einträgen.

**Ziel:** beim Zeitmanagement helfen, Aufgaben nicht vergessen, den allgemeinen Workflow unterstützen und verbessern.

---

## 2. Rahmenbedingungen (Phase 0)

| Punkt | Stand | Ergebnis |
|---|---|---|
| Uni-Projekt / Abgabe | ✅ | Abgabe: GitHub-Repo mit README **und** Poster, bis **Fr 20.11., 16 Uhr** |
| Allein oder Team | ❓ offen | – |
| Für wen | ✅ | **Für alle.** Es ist ein Grundgerüst, in das jede Person ihre eigenen Termine einträgt. |
| Plattform | ✅ | **PWA** (siehe Abschnitt 4) |
| Vorkenntnisse | ✅ | Grundprinzip vom Programmieren, kein tiefes Wissen. **Claude Code erklärt jeden Schritt einfach.** |
| Uni-PDF zur Arbeitsweise | ✅ | gelesen und eingearbeitet (siehe Abschnitt 6) |

### Wochenplan der Werkstatt

| Tag | Kursthema | Etappe fürs Projekt |
|---|---|---|
| Mo 16.11. | KI-Grundlagen, Kontext managen | Idee & Plan: `PLAN.md` steht |
| Di 17.11. | UI Design, APIs und Connections | Grundgerüst & Aussehen: Die App läuft |
| Mi 18.11. | KI und ihre Gefahren | Daten von außen |
| Do 19.11. | Vom Laptop in die Welt | Fertig & veröffentlicht. Freeze spätestens 18 Uhr, **besser 12 Uhr**, danach Poster |
| Fr 20.11. | Polieren und präsentieren | Präsentation, Abgabe bis 16 Uhr |

---

## 3. Kategorien von Einträgen (erste Fassung, noch zu verfeinern)

| Kategorie | Beispiele | Eigenschaft |
|---|---|---|
| **Feste wiederkehrende Termine** | Arbeit, Uni | jede Woche, feste Uhrzeit |
| **Flexible Termine** | Verabredungen, Unternehmungen, Freizeit | verschiebbar/flexibel (Bedeutung noch zu klären) |
| **Aufgaben** | Uni-Abgaben, Ziele, Erledigungen | Deadline statt fester Uhrzeit |
| **Einmalige Termine** | Arzttermin | einmal, feste Uhrzeit |

**Wichtige Designfrage:** *Termine* sind an eine Uhrzeit gebunden, *Aufgaben* haben eine Deadline, aber noch keinen Zeitpunkt, und *Ziele* sind langfristig und bestehen aus **Unterzielen**. Wie die App diese drei Dinge zusammenbringt, ist die Kernentscheidung des Projekts.

**Pro Kategorie noch zu klären:** feste Uhrzeit?, Dauer, Wiederholung, Deadline, Priorität, Verschiebbarkeit, Erinnerung, gespeicherte Details (Ort, Raum, Notiz).

---

## 4. Technik-Entscheidung: PWA

**Gewählt:** eine Web-App im Handy-Format (**Progressive Web App**)

- läuft auf **iPhone und Android** mit nur einem Code
- lässt sich über „Zum Home-Bildschirm“ installieren und hat dann ein eigenes Icon und Vollbild, fühlt sich also wie eine App an
- wird über **GitHub Pages** veröffentlicht, alle können sie per Link öffnen
- Daten liegen **lokal auf dem Gerät**. Damit hat jede Person automatisch ihren eigenen Plan, ohne Login und ohne Server.
- Die App startet mit einem **leeren Plan**, Nutzer tragen ihre Termine selbst ein (später ggf. ein kurzes Onboarding)

**Verworfen für diese Woche:**
- *Native App im App Store:* braucht Mac, Xcode, einen kostenpflichtigen Entwickler-Account und die Prüfung durch Apple, in einer Woche nicht realistisch
- *React Native / Expo:* zu viel Einrichtung und Risiko bei Grundkenntnissen und drei Bautagen

**Bekannte Einschränkung:** Echte Push-Benachrichtigungen bei geschlossener App bräuchten einen Server. Diese Woche gibt es nur Hinweise in der App („Heute fällig“, „Überfällig“).

---

## 5. Vision: Kollaboration (Version 2, nach der Werkstattwoche)

Verschiedene Accounts können ihre Pläne verknüpfen. Jede Verbindung bekommt eine eigene **Freigabe-Stufe**:

| Freigabe-Stufe | Beispiel | Sieht | Darf |
|---|---|---|---|
| **Voller Zugriff** | Partnerin | den gesamten Plan | ansehen **und Termine hinzufügen** |
| **Projekt-Freigabe** | Uni-Kolleg:innen | nur das gemeinsame Projekt/Ziel | Unterziele abhaken, alle sind immer auf demselben Stand |
| *(Vorschlag, offen)* Nur frei/belegt | Freundeskreis | nur, wann man Zeit hat | nur ansehen |

Damit kann man gegenseitig sehen, wann der andere Zeit hat. Gemeinsame Ziele, etwa ein Uni-Projekt, lassen sich gemeinsam abarbeiten.

**Technisch nötig:** Server bzw. Backend (z. B. Supabase oder Firebase), Accounts mit Login, Rechteverwaltung, Synchronisation und Datenschutz.

### Entscheidung

> **Diese Woche wird die lokale App fertig. Die Online-Funktionen kommen später.**
> Die Option bleibt aber während der gesamten Entwicklung im Blick, auch wenn sie noch nicht umgesetzt wird.

### Architektur-Regeln, damit Version 2 später möglich bleibt

1. **Jeder Eintrag bekommt eine eindeutige ID und einen Besitzer.**
2. **Gespeichert wird nur über eine zentrale Stelle** (Speicher-Baustein). Später wird nur dieser von „lokal“ auf „Server“ umgestellt.
3. **Ziele haben von Anfang an einzeln abhakbare Unterziele.**
4. **Freigabe-Felder sind im Datenmodell vorgesehen**, tauchen in der Oberfläche aber noch nicht auf.
5. Bei jeder größeren Entscheidung wird geprüft: **„Verbaut das die Online-Funktion später?“**

---

## 6. Arbeitsweise (laut Uni-Vorgaben)

### Projektgedächtnis
```
zeitmanagement-app/
├─ CLAUDE.md   → Regeln: Ziel, Arbeitsweise, Technik, Gestaltung
├─ PLAN.md     → Stand: Must/Should/Could, Etappen, nächste Schritte, Ausblick V2
└─ index.html …
```

### Rhythmus: ein Feature pro Sitzung
1. Neue Sitzung starten (`/clear`)
2. **Ein** Feature bauen, klein halten
3. Testen und committen
4. Übergabe: „Fasse den Stand in PLAN.md zusammen.“

Neue Regeln oder Entscheidungen kommen sofort in die `CLAUDE.md`, denn was dort nicht steht, weiß die nächste Sitzung nicht.

### Prompting
- Kontext geben („Ich habe nur Grundkenntnisse, erklär jeden Schritt einfach.“)
- Beschreiben, **was** passieren soll, nicht wie es programmiert wird
- Ein Feature pro Prompt
- Screenshots zeigen und Fehlermeldungen komplett hineinkopieren
- „Stell mir erst Fragen, bevor du loslegst.“

### Regeln
- **Keine echten personenbezogenen Daten** in die KI geben, also zum Testen erfundene Termine verwenden
- Keine API-Keys in Chats, Screenshots oder auf GitHub (Keys nur in `.env`)
- Der Agent arbeitet nur im eigenen Projektordner
- Anfragen erst lesen, dann bestätigen
- KI-Nutzung nach den Regeln der Hochschule kennzeichnen
- Lizenzen von Daten und Bildern beachten

---

## 7. Fahrplan für die weitere Besprechung

1. ~~Rahmen~~ ✅ (bis auf „allein oder Team“)
2. **Kategorien im Detail** ← als Nächstes, beginnend mit den festen wöchentlichen Terminen
3. Ansichten (Tag/Stunden, Woche, Aufgabenliste, „Heute“) und Kernfunktionen (Erinnerungen, Einplanen in freie Zeit, Überschneidungen, Rückblick)
4. MoSCoW: Must / Should / Could für Freitag
5. Etappen auf Di–Do verteilen, inklusive einer Idee für „Daten von außen“ am Mittwoch (z. B. Kalender-Import, Feiertage, Semesterzeiten)
6. Ergebnis: `PLAN.md` und `CLAUDE.md` für den Projektordner

---

## 8. Offene Fragen

- [ ] Allein oder im Team?
- [ ] Kategorien fest vorgegeben, oder können Nutzer eigene anlegen bzw. umbenennen (z. B. „Sport“)?
- [ ] Freigabe-Stufe „Nur frei/belegt“ übernehmen?
- [ ] Feste Termine: Regelmäßigkeit, Ausnahmen (Ausfall, Semesterferien), Details, Rolle bei der Berechnung freier Zeit
- [ ] Was bedeutet „flexibel“ bei flexiblen Terminen genau?
