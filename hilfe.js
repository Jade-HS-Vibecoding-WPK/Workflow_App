// ============================================================
// "?"-Hilfe (Aufräumen I): kurze Erklärung + Legende zur Ansicht,
// die gerade offen ist. Ein Tipp oben auf "?".
// ============================================================

const Help = (() => {
  const key = (c, label, style = "") => `<li><i class="help-key ${c}" style="${style}"></i>${label}</li>`;
  const LEGEND_PLAN = `
    <ul class="help-legend">
      ${key("", "Termin (fest oder einmalig)", "--c:var(--cat-fest)")}
      ${key("help-key--dashed", "Vorschlag der App – antippen zum Übernehmen", "--c:var(--accent)")}
      ${key("", "geplant: übernommener Vorschlag (durchgezogen)", "--c:#ba7517")}
      ${key("help-key--hatch", "Sperrzeit – dort plant die App nichts")}
      ${key("help-key--now", "rote Linie = jetzt")}
    </ul>`;
  const LEGEND_GOAL = `
    <ul class="help-legend">
      ${key("help-key--crit", "kritisch: braucht ab 80 % deiner freien Zeit (oder reicht nicht)")}
      ${key("help-key--warn", "eng: braucht ab 50 % deiner freien Zeit")}
      ${key("help-key--main", "Hauptpfad: die längste Kette – bestimmt, wann alles frühestens fertig ist")}
    </ul>`;

  const TEXT = {
    heute: ["Heute", `Dein Tag auf einen Blick. Oben die Zahlen, darunter der Tagesplan. Wische nach links/rechts für andere Tage.
      <b>„Was mache ich jetzt?“</b> schlägt dir vor, was in die freie Zeit bis zum nächsten Termin passt.
      <b>„Neu planen“</b> verteilt alle Vorschläge neu.${LEGEND_PLAN}`],
    woche: ["Woche", `Die ganze Woche als Stundenplan oder als Liste zum Abhaken. Leere Stelle antippen = neuer Termin zu dieser Zeit.${LEGEND_PLAN}`],
    kalender: ["Kalender", `Der Monat im Überblick. Punkte = Termine (gestrichelt = Vorschlag), ⚑ = Deadline, ✎ = Tagesnotiz, rote Zahl = Feiertag. Tag antippen = Liste des Tages, nochmal antippen = Tagesplan.`],
    aufgaben: ["Aufgaben", `Dinge ohne feste Uhrzeit. Gib eine Deadline und die Dauer an – die App sucht dir passende freie Zeit und zeigt unter jeder Aufgabe, wann sie dran ist. Kreis antippen = erledigt.`],
    ziele: ["Ziele", `Große Vorhaben mit Deadline, aufgeteilt in Schritte (Unterziele). Die App rechnet aus, ob deine freie Zeit reicht, und plant die Arbeit ein. „Aus Vorlage …“ legt ein fertiges Beispiel an.${LEGEND_GOAL}`],
    ziel: ["Ziel", `Oben: wie weit du bist und ob die Zeit reicht. Darunter die Schritte. <b>Kreis antippen</b> = Fortschritt eintragen, <b>Zeile antippen</b> = bearbeiten (z. B. „startet erst, wenn … fertig ist“).
      <b>Netzplan</b> und <b>Balken</b> zeigen dieselben Schritte als Grafik – für Fachleute mit allen Werten (FAZ, SEZ, Puffer …).${LEGEND_GOAL}`],
    erledigt: ["Erledigt", `Abgehakte Aufgaben und Ziele. Kreis antippen = wieder öffnen. Nach 6 Monaten räumt die App sie automatisch weg.`],
    sperrzeiten: ["Sperrzeiten", `Zeiten, die dir gehören – z. B. Schlafen, Sport, Freizeit. Dort schlägt die App nichts vor und warnt, wenn du einen Termin hineinlegst.`],
    tagesnotizen: ["Tagesnotizen", `Kurze Notiz an einem Tag (z. B. „Semesterstart“). Blockiert keine Zeit.`],
    einstellungen: ["Einstellungen", `Wichtig für die Planung: <b>Arbeitszeit</b> (in welchem Fenster die App plant) und <b>höchstens pro Tag</b>. Abschnitte antippen zum Auf- und Zuklappen.`],
    daten: ["Daten sichern", `Deine Daten liegen nur auf diesem Gerät. Sichere sie ab und zu als Datei – damit kannst du sie auch auf ein anderes Gerät holen.`],
  };

  function open(view) {
    const bau = Store.getArea() === "bau";
    const [title, body] = TEXT[view] || ["Hilfe", "Über „+“ legst du Termine, Aufgaben und Ziele an. Die App plant Aufgaben und Ziel-Arbeit als Vorschläge in deine freie Zeit."];
    Editor.show(`
      <div class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet__head">
          <span class="sheet__spacer"></span>
          <h2 id="sheet-title">${title}${bau ? " · Baustelle" : ""}</h2>
          <button class="link-btn link-btn--strong" data-close>Fertig</button>
        </div>
        <div class="help-body">${body}
          ${bau ? `<p class="hint">Baustelle: Vorgänge dauern Arbeitstage (Mo–Fr, ohne Feiertage), Wartezeiten wie Trocknen zählen Kalendertage.</p>` : ""}
        </div>
      </div>`);
    document.querySelector(".sheet-layer [data-close]").onclick = Editor.close;
  }

  return { open };
})();
