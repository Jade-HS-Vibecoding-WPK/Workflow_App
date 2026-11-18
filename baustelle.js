// ============================================================
// Baustellen-Werkzeuge (Projektseite im Bereich Baustelle)
//  C1 Basisplan festhalten + Soll-Ist-Vergleich
//  C2 Verzug eintragen (Vorgang dauert länger) – zeigt, was sich verschiebt
//  C3 Wetter-Warnung für Außenarbeiten (Open-Meteo, kostenlos, ohne Schlüssel;
//     es wird nur der Ortsname bzw. die Koordinaten des Orts abgefragt)
//  C4 Bautagebuch (Notiz pro Tag, Wetter und Gewerke vorausgefüllt)
//  C5 Mängelliste je Vorgang (Hilfsfunktionen, Formular in ziele.js)
//  C6 Gewerke-Übersicht („Wer ist wann auf der Baustelle?“)
//  C9 Export der Vorgänge als CSV (öffnet in Excel/Numbers)
// Alles wird im Projekt selbst gespeichert (Felder baseline, diary, ort;
// am Vorgang defects und delays) – nur über Store.
// ============================================================

const Bau = (() => {
  const S = Schedule;
  const esc = (s) => Editor.esc(s);
  const today = () => S.isoDate(new Date());
  const dShort = (iso) => S.parseDate(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
  const dLong = (iso) => S.parseDate(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const idxOf = (iso) => Math.round((S.parseDate(iso) - S.parseDate(today())) / 86400000);
  const isMs = (sg) => Number(sg.durationDays) === 0;
  const gewerkOf = (sg) => (sg.assignee && sg.assignee !== Model.OWNER_LOCAL ? sg.assignee : "");

  // Arbeitstage zwischen zwei Daten (b nach a = positiv), nach dem Projektkalender
  function wdDiff(res, a, b) {
    if (!res || !res.isWork) return 0;
    let x = idxOf(a), y = idxOf(b), sign = 1;
    if (y < x) { [x, y] = [y, x]; sign = -1; }
    let n = 0;
    for (let i = x; i < y; i++) if (res.isWork(i)) n++;
    return sign * n;
  }

  // ---------- Datei herunterladen / teilen ----------
  async function download(name, text, type) {
    const file = new File([text], name, { type });
    const touch = matchMedia("(pointer: coarse)").matches;
    try {
      if (touch && navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: name });
      else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      }
    } catch (err) {
      if (!err || err.name !== "AbortError") Toast.show("Export hat nicht geklappt");
    }
  }

  // ================= C1 Basisplan / Soll-Ist =================
  async function saveBaseline(goal, res) {
    const items = {};
    for (const sg of goal.subgoals) {
      const n = res.nodes[sg.id];
      if (n) items[sg.id] = { s: n.startDate, e: n.endDate };
    }
    const before = await Store.get(goal.id);
    await Store.save({ ...goal, baseline: { at: new Date().toISOString(), end: res.projectEndDate, items } });
    Toast.show("Basisplan festgehalten – Abweichungen siehst du ab jetzt", () => Store.save(before));
  }

  // Abweichung eines Vorgangs gegenüber dem Basisplan (Arbeitstage, + = später)
  function delayOf(goal, res, sg) {
    const b = goal.baseline && goal.baseline.items[sg.id];
    const n = res && res.nodes[sg.id];
    if (!b || !n || sg.done) return null;
    return wdDiff(res, b.e, n.endDate);
  }

  function baselineHtml(goal, res) {
    if (!goal.baseline || !res || res.cycle) return "";
    const total = wdDiff(res, goal.baseline.end, res.projectEndDate);
    const late = goal.subgoals.map((sg) => ({ sg, d: delayOf(goal, res, sg) })).filter((x) => x.d > 0).sort((a, b) => b.d - a.d).slice(0, 3);
    const cls = total > 0 ? "advice--warn" : "advice--ok";
    return `<div class="advice ${cls}"><b>Soll-Ist (Basisplan vom ${dLong(goal.baseline.at.slice(0, 10))})</b>
      Fertigstellung ${total > 0 ? `<b>${total} AT später</b>` : total < 0 ? `${-total} AT früher` : "wie geplant"} (Soll ${dShort(goal.baseline.end)}, jetzt ${dShort(res.projectEndDate)}).
      ${late.length ? `<ul class="advice__list">${late.map((x) => `<li>„${esc(x.sg.title)}“ ${x.d} AT später</li>`).join("")}</ul>` : ""}
      <small class="advice__calc">Im Balkenplan zeigt eine dünne Linie den Basisplan.</small></div>`;
  }

  // ================= C2 Verzug eintragen =================
  function delayForm(goal, sgId) {
    const sg = goal.subgoals.find((x) => x.id === sgId);
    if (!sg) return;
    Editor.show(`
      <form class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head">
          <button type="button" class="link-btn" data-close>Abbrechen</button>
          <h2 id="sheet-title">Verzug eintragen</h2>
          <button type="submit" class="link-btn link-btn--strong">Sichern</button>
        </div>
        <p class="sheet__context">${esc(sg.title)}${gewerkOf(sg) ? " · " + esc(gewerkOf(sg)) : ""} · bisher ${sg.durationDays} AT</p>
        <div class="form-group">
          <label class="row"><span>Dauert länger um</span><span class="unit-input"><input type="number" name="days" min="1" step="1" inputmode="numeric" value="1" autofocus> Arbeitstage</span></label>
          <input name="reason" placeholder="Grund, z. B. Lieferverzug, Schlechtwetter" autocomplete="off">
        </div>
        ${(sg.delays || []).length ? `<p class="hint">Bisher: ${sg.delays.map((d) => `${dShort(d.date)} +${d.days} AT${d.reason ? " (" + esc(d.reason) + ")" : ""}`).join(" · ")}</p>` : ""}
        <p class="form-error" role="alert" hidden></p>
      </form>`);
    const form = Editor.sheetForm();
    form.querySelector("[data-close]").onclick = Editor.close;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const days = Math.round(Number(form.elements.days.value));
      if (!(days >= 1)) { const er = form.querySelector(".form-error"); er.textContent = "Gib mindestens 1 Arbeitstag ein."; er.hidden = false; return; }
      const before = await Store.get(goal.id);
      const resBefore = CPM.computeBau(before);
      const updated = { ...sg, durationDays: Number(sg.durationDays) + days, delays: [...(sg.delays || []), { date: today(), days, reason: form.elements.reason.value.trim() }] };
      const after = { ...before, subgoals: before.subgoals.map((x) => (x.id === sg.id ? updated : x)) };
      await Store.save(after);
      const saved = await Store.get(goal.id);
      const resAfter = CPM.computeBau(saved);
      // Was verschiebt sich? Fertigstellung und Meilensteine
      const moved = [];
      const endShift = wdDiff(resAfter, resBefore.projectEndDate, resAfter.projectEndDate);
      for (const x of saved.subgoals.filter(isMs)) {
        const a = resBefore.nodes[x.id], b = resAfter.nodes[x.id];
        if (a && b && a.startDate !== b.startDate) moved.push(`◆ ${esc(x.title)}: ${dShort(a.startDate)} → ${dShort(b.startDate)}`);
      }
      Editor.show(`
        <div class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div class="sheet__head"><span class="sheet__spacer"></span><h2 id="sheet-title">Verzug eingetragen</h2><button class="link-btn link-btn--strong" data-close>Fertig</button></div>
          <div class="help-body">
            <p>„${esc(sg.title)}“ dauert jetzt ${updated.durationDays} AT (+${days}).</p>
            <p>${endShift > 0 ? `<b>Die Fertigstellung verschiebt sich um ${endShift} AT</b> auf ${dShort(resAfter.projectEndDate)}` : "Die Fertigstellung bleibt – der Puffer fängt den Verzug auf."}</p>
            ${moved.length ? `<ul class="advice__list">${moved.map((m) => `<li>${m}</li>`).join("")}</ul>` : ""}
          </div>
          <button class="action" data-undo-delay>Rückgängig</button>
        </div>`);
      const layer = document.querySelector(".sheet-layer");
      layer.querySelector("[data-close]").onclick = Editor.close;
      layer.querySelector("[data-undo-delay]").onclick = async () => { await Store.save(before); Editor.close(); Toast.show("Verzug zurückgenommen"); };
    });
  }

  // ================= C5 Mängelliste =================
  const openDefects = (sg) => (sg.defects || []).filter((d) => !d.done).length;

  function defectsHtml(sg) {
    const list = sg.defects || [];
    return `
      <div class="form-group" data-defects>
        <div class="row row--stack">
          <span>Mängel ${list.length ? `<small class="muted">${openDefects(sg)} offen von ${list.length}</small>` : `<small class="muted">z. B. bei der Abnahme</small>`}</span>
          <ul class="defects">${list.map((d) => `
            <li data-id="${esc(d.id)}"><label><input type="checkbox" ${d.done ? "checked" : ""}><span>${esc(d.text)}</span></label><button type="button" class="link-btn" data-del-defect aria-label="Mangel entfernen">✕</button></li>`).join("")}</ul>
          <div class="defects__add"><input name="defectText" placeholder="Neuer Mangel, z. B. Fuge Bad nacharbeiten" autocomplete="off"><button type="button" class="link-btn" data-add-defect>Hinzufügen</button></div>
        </div>
      </div>`;
  }

  // Formular-Teil verdrahten; liefert eine Funktion, die die aktuelle Liste ausliest
  function wireDefects(form, sg) {
    const box = form.querySelector("[data-defects]");
    if (!box) return () => sg.defects || [];
    let list = [...(sg.defects || [])];
    const ul = box.querySelector(".defects");
    const add = () => {
      const inp = form.elements.defectText;
      const text = inp.value.trim();
      if (!text) return;
      const d = { id: Model.newId(), text, done: false, at: today() };
      list.push(d);
      ul.insertAdjacentHTML("beforeend", `<li data-id="${esc(d.id)}"><label><input type="checkbox"><span>${esc(text)}</span></label><button type="button" class="link-btn" data-del-defect aria-label="Mangel entfernen">✕</button></li>`);
      inp.value = "";
      inp.focus();
    };
    box.querySelector("[data-add-defect]").onclick = add;
    form.elements.defectText.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } });
    ul.addEventListener("click", (e) => {
      const b = e.target.closest("[data-del-defect]");
      if (!b) return;
      const li = b.closest("li");
      list = list.filter((d) => d.id !== li.dataset.id);
      li.remove();
    });
    return () => list.map((d) => {
      const li = ul.querySelector(`li[data-id="${CSS.escape(d.id)}"]`);
      return li ? { ...d, done: li.querySelector("input").checked } : d;
    });
  }

  // ================= C6 Gewerke-Übersicht =================
  function trades(goal, res) {
    const by = {};
    for (const sg of goal.subgoals) {
      const n = res.nodes[sg.id];
      if (!n || sg.done || isMs(sg)) continue;
      const g = gewerkOf(sg) || "ohne Gewerk";
      (by[g] = by[g] || []).push({ sg, n });
    }
    for (const g of Object.keys(by)) by[g].sort((a, b) => a.n.ES - b.n.ES);
    return Object.entries(by).sort((a, b) => a[1][0].n.ES - b[1][0].n.ES);
  }

  function tradesSheet(goal, res) {
    const list = trades(goal, res);
    const text = `${goal.title} – Gewerke-Übersicht (Stand ${dLong(today())})\n\n` + list.map(([g, xs]) =>
      `${g}\n` + xs.map(({ sg, n }) => `  ${dLong(n.startDate)} – ${dLong(n.endDate)}  ${sg.title} (${n.D} AT${n.critical ? ", kritisch" : ""})`).join("\n")).join("\n\n");
    Editor.show(`
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet__head"><button class="link-btn" data-close>Schließen</button><h2 id="sheet-title">Wer ist wann da?</h2><span class="sheet__spacer"></span></div>
        <p class="hint hint--plain">Alle offenen Vorgänge nach Gewerk – zum Weitergeben an die Firmen.</p>
        ${list.map(([g, xs]) => `
          <h3 class="list-group">${esc(g)}</h3>
          <ul class="wl">${xs.map(({ sg, n }) => `
            <li class="wl-row" style="--c:${n.critical ? "#ff3b30" : goal.color}"><span class="wl-time">${dShort(n.startDate)}${n.startDate !== n.endDate ? "–" + dShort(n.endDate) : ""}</span><span class="wl-title">${esc(sg.title)} <small class="muted">${n.D} AT${n.critical ? " · kritisch" : ""}</small></span></li>`).join("")}</ul>`).join("") || `<p class="plan-hint">Keine offenen Vorgänge.</p>`}
        <div class="form-group form-actions"><button class="action" data-copy>Als Text kopieren</button></div>
      </div>`);
    const layer = document.querySelector(".sheet-layer");
    layer.querySelector("[data-close]").onclick = Editor.close;
    layer.querySelector("[data-copy]").onclick = async () => {
      try { await navigator.clipboard.writeText(text); Toast.show("Kopiert – z. B. in eine Mail einfügen"); }
      catch { Toast.show("Kopieren ging nicht"); }
    };
  }

  // ================= C9 CSV-Export =================
  function exportCsv(goal, res) {
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    const nr = Object.fromEntries(subs.map((s, i) => [s.id, i + 1]));
    const SH = { "ende-anfang": "NF", "anfang-anfang": "AF", "ende-ende": "EF", "anfang-ende": "SF" };
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Nr", "Vorgang", "Gewerk", "Dauer (AT)", "FAZ", "FEZ", "SAZ", "SEZ", "GP (AT)", "FP (AT)", "kritisch", "Vorgänger", "Fortschritt %", "offene Mängel", "Basisplan Ende", "Abweichung (AT)"];
    const rows = subs.map((sg) => {
      const n = res.nodes[sg.id] || {};
      const preds = (sg.dependencies || []).map((d) => `${nr[d.fromId]} ${SH[d.type || "ende-anfang"]}${Number(d.lagDays) ? (d.lagDays > 0 ? "+" : "") + d.lagDays : ""}`).join(", ");
      const b = goal.baseline && goal.baseline.items[sg.id];
      return [nr[sg.id], sg.title, gewerkOf(sg), isMs(sg) ? "Meilenstein" : n.D, n.startDate ? dLong(n.startDate) : "", n.endDate ? dLong(n.endDate) : "",
        n.latestStart ? dLong(n.latestStart) : "", n.latestEnd ? dLong(n.latestEnd) : "", n.TF ?? "", n.FF ?? "", n.critical ? "ja" : "",
        preds, sg.progressPercent || 0, openDefects(sg) || "", b ? dLong(b.e) : "", b ? delayOf(goal, res, sg) ?? "" : ""];
    });
    // Semikolon + BOM, damit Excel (deutsch) die Datei direkt richtig öffnet
    const csv = "﻿" + [head, ...rows].map((r) => r.map(q).join(";")).join("\r\n");
    const safe = goal.title.replace(/[^\wäöüÄÖÜß -]/g, "").trim().replace(/\s+/g, "-") || "projekt";
    download(`${safe}-vorgaenge-${today()}.csv`, csv, "text/csv");
  }

  // ================= C3 Wetter (Open-Meteo) =================
  // Außenarbeiten erkennen (Gewerk oder Titel)
  const FROST = /beton|fundament|bodenplatte|decke|mauer|außenputz|fassade|wärmedämm|estrich|pflaster|landschaft|außenanlage/i;
  const RAIN = /dach|zimmer|erd|aushub|fassade|außen|klempner|gerüst|landschaft|beton|fundament|bodenplatte/i;
  const WIND = /dach|zimmer|gerüst|kran|klempner/i;
  const CACHE_H = 3;

  async function forecast(ort) {
    const st = await Store.getSettings();
    const cache = st.wetterCache || {};
    const key = ort.trim().toLowerCase();
    const c = cache[key];
    if (c && Date.now() - new Date(c.fetchedAt).getTime() < CACHE_H * 3600000) return c;
    try {
      let geo = c && c.lat != null ? { latitude: c.lat, longitude: c.lon, name: c.name } : null;
      if (!geo) {
        const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ort.trim())}&count=1&language=de&format=json`)).json();
        geo = g && g.results && g.results[0];
        if (!geo) return { error: `Ort „${ort}“ nicht gefunden` };
      }
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,wind_speed_10m_max&timezone=Europe%2FBerlin&forecast_days=7`;
      const w = await (await fetch(url)).json();
      if (!w || !w.daily) throw new Error("keine Daten");
      const entry = { lat: geo.latitude, lon: geo.longitude, name: geo.name, fetchedAt: new Date().toISOString(), daily: w.daily };
      await Store.saveSettings({ wetterCache: { ...cache, [key]: entry } });
      return entry;
    } catch (err) {
      return c ? { ...c, stale: true } : { error: "Wetter gerade nicht erreichbar (offline?)" };
    }
  }

  function warnings(goal, res, wx) {
    const out = [];
    if (!wx || !wx.daily) return out;
    const d = wx.daily;
    d.time.forEach((iso, i) => {
      const idx = idxOf(iso);
      if (idx < 0 || !res.isWork(idx)) return;
      const active = goal.subgoals.filter((sg) => { const n = res.nodes[sg.id]; return n && !sg.done && !isMs(sg) && n.ES <= idx && idx < n.EF; });
      const tmin = d.temperature_2m_min[i], rain = d.precipitation_sum[i], wind = d.wind_speed_10m_max[i];
      const hit = (re) => active.filter((sg) => re.test(sg.title + " " + gewerkOf(sg))).map((sg) => `„${esc(sg.title)}“`);
      if (tmin <= 0 && hit(FROST).length) out.push(`${dShort(iso)}: Frost ${Math.round(tmin)} °C – ${hit(FROST).join(", ")}`);
      if (rain >= 10 && hit(RAIN).length) out.push(`${dShort(iso)}: Regen ${Math.round(rain)} mm – ${hit(RAIN).join(", ")}`);
      if (wind >= 50 && hit(WIND).length) out.push(`${dShort(iso)}: Wind bis ${Math.round(wind)} km/h – ${hit(WIND).join(", ")}`);
    });
    return out;
  }

  function weatherDay(wx, iso) {
    if (!wx || !wx.daily) return "";
    const i = wx.daily.time.indexOf(iso);
    if (i < 0) return "";
    const d = wx.daily;
    return `${Math.round(d.temperature_2m_min[i])}…${Math.round(d.temperature_2m_max[i])} °C, ${Math.round(d.precipitation_sum[i])} mm Regen, Wind bis ${Math.round(d.wind_speed_10m_max[i])} km/h`;
  }

  async function loadWeather(container, goal, res) {
    const box = container.querySelector("[data-weather]");
    if (!box || !goal.ort || !res || res.cycle) return;
    box.innerHTML = `<p class="plan-hint plan-hint--small">Wetter für ${esc(goal.ort)} wird geladen …</p>`;
    const wx = await forecast(goal.ort);
    if (!container.contains(box)) return;
    if (wx.error) { box.innerHTML = `<p class="plan-hint plan-hint--small">${esc(wx.error)}</p>`; return; }
    const w = warnings(goal, res, wx);
    const days = wx.daily.time.map((iso, i) => `<span class="wx-day ${wx.daily.temperature_2m_min[i] <= 0 ? "wx-day--frost" : ""} ${wx.daily.precipitation_sum[i] >= 10 ? "wx-day--rain" : ""}"><small>${S.parseDate(iso).toLocaleDateString("de-DE", { weekday: "short" })}</small>${Math.round(wx.daily.temperature_2m_max[i])}°<small>${Math.round(wx.daily.temperature_2m_min[i])}°</small>${wx.daily.precipitation_sum[i] >= 1 ? `<small>${Math.round(wx.daily.precipitation_sum[i])} mm</small>` : ""}</span>`).join("");
    box.innerHTML = `<div class="advice ${w.length ? "advice--warn" : "advice--ok"}"><b>Wetter ${esc(wx.name || goal.ort)}${wx.stale ? " (letzter Stand)" : ""}</b>
      ${w.length ? `<ul class="advice__list">${w.slice(0, 5).map((x) => `<li>${x}</li>`).join("")}</ul>` : "Keine Frost-, Regen- oder Sturmwarnung für Außenarbeiten in den nächsten 7 Tagen."}
      <div class="wx-strip">${days}</div>
      <small class="advice__calc">Quelle: Open-Meteo (open-meteo.com), kostenlos · abgefragt wird nur der Ort · Warnung bei Frost ≤ 0 °C, Regen ≥ 10 mm, Wind ≥ 50 km/h</small></div>`;
  }

  // ================= C4 Bautagebuch =================
  async function diarySheet(goalId) {
    const goal = await Store.get(goalId);
    if (!goal) return;
    const res = CPM.computeBau(goal);
    const list = [...(goal.diary || [])].sort((a, b) => (b.date + b.at).localeCompare(a.date + a.at));
    const wx = goal.ort ? (await Store.getSettings()).wetterCache?.[goal.ort.trim().toLowerCase()] : null;
    const crewOn = (iso) => {
      const idx = idxOf(iso);
      return [...new Set(goal.subgoals.filter((sg) => { const n = res.nodes && res.nodes[sg.id]; return n && !isMs(sg) && n.ES <= idx && idx < n.EF; }).map((sg) => gewerkOf(sg)).filter(Boolean))].join(", ");
    };
    Editor.show(`
      <form class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head"><button type="button" class="link-btn" data-close>Schließen</button><h2 id="sheet-title">Bautagebuch</h2><button type="submit" class="link-btn link-btn--strong">Eintragen</button></div>
        <p class="sheet__context">${esc(goal.title)}</p>
        <div class="form-group">
          <label class="row"><span>Datum</span><input type="date" name="date" value="${today()}"></label>
          <input name="crew" placeholder="Wer war da? (Gewerke)" value="${esc(crewOn(today()))}" autocomplete="off">
          <input name="weather" placeholder="Wetter" value="${esc(weatherDay(wx, today()))}" autocomplete="off">
          <textarea name="text" rows="3" placeholder="Was ist passiert? Lieferungen, Besonderheiten, Behinderungen …"></textarea>
        </div>
        <p class="form-error" role="alert" hidden></p>
        <h3 class="list-group">Einträge <span>${list.length}</span></h3>
        ${list.length ? `<ul class="diary">${list.map((d) => `
          <li><b>${dShort(d.date)}</b>${d.weather ? ` <small class="muted">· ${esc(d.weather)}</small>` : ""}${d.crew ? `<small class="muted">Vor Ort: ${esc(d.crew)}</small>` : ""}<span>${esc(d.text)}</span>
            <button type="button" class="link-btn" data-del-diary="${esc(d.id)}">Löschen</button></li>`).join("")}</ul>` : `<p class="plan-hint">Noch keine Einträge.</p>`}
        ${list.length ? `<div class="form-group form-actions"><button type="button" class="action" data-diary-csv>Bautagebuch als CSV exportieren</button></div>` : ""}
      </form>`);
    const form = Editor.sheetForm();
    form.querySelector("[data-close]").onclick = Editor.close;
    form.elements.date.addEventListener("change", () => {
      const iso = form.elements.date.value;
      if (!iso) return;
      form.elements.crew.value = crewOn(iso);
      form.elements.weather.value = weatherDay(wx, iso) || form.elements.weather.value;
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = form.elements.text.value.trim();
      if (!text) { const er = form.querySelector(".form-error"); er.textContent = "Schreib kurz, was passiert ist."; er.hidden = false; form.elements.text.focus(); return; }
      const g = await Store.get(goalId);
      const entry = { id: Model.newId(), date: form.elements.date.value || today(), at: new Date().toISOString(), crew: form.elements.crew.value.trim(), weather: form.elements.weather.value.trim(), text };
      await Store.save({ ...g, diary: [...(g.diary || []), entry] });
      Toast.show("Ins Bautagebuch eingetragen");
      diarySheet(goalId);
    });
    form.querySelectorAll("[data-del-diary]").forEach((b) => b.addEventListener("click", async () => {
      const g = await Store.get(goalId);
      await Store.save({ ...g, diary: (g.diary || []).filter((d) => d.id !== b.dataset.delDiary) });
      Toast.show("Eintrag gelöscht", () => Store.save(g));
      diarySheet(goalId);
    }));
    const dc = form.querySelector("[data-diary-csv]");
    if (dc) dc.addEventListener("click", () => {
      const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const rows = [["Datum", "Wetter", "Vor Ort", "Eintrag"], ...[...list].reverse().map((d) => [dLong(d.date), d.weather, d.crew, d.text])];
      download(`bautagebuch-${today()}.csv`, "﻿" + rows.map((r) => r.map(q).join(";")).join("\r\n"), "text/csv");
    });
  }

  // ================= Ort für das Wetter =================
  async function ortForm(goalId) {
    const goal = await Store.get(goalId);
    Editor.show(`
      <form class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title" novalidate>
        <div class="sheet__head"><button type="button" class="link-btn" data-close>Abbrechen</button><h2 id="sheet-title">Ort der Baustelle</h2><button type="submit" class="link-btn link-btn--strong">Sichern</button></div>
        <div class="form-group"><input class="title-input" name="ort" placeholder="Ort, z. B. Oldenburg" value="${esc(goal.ort || "")}" autocomplete="off" autofocus></div>
        <p class="hint hint--plain">Nur für die Wetter-Warnung: Die App fragt bei Open-Meteo (kostenlos, ohne Anmeldung) die 7-Tage-Vorhersage für diesen Ort ab. Es wird nur der Ortsname gesendet – keine Adresse, keine persönlichen Daten. Leer lassen = kein Wetter.</p>
      </form>`);
    const form = Editor.sheetForm();
    form.querySelector("[data-close]").onclick = Editor.close;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const g = await Store.get(goalId);
      await Store.save({ ...g, ort: form.elements.ort.value.trim() || null });
      Editor.close();
    });
  }

  // ================= Abschnitt „Baustelle“ auf der Projektseite =================
  function toolsHtml(goal, res) {
    if (goal.area !== "bau" || !goal.subgoals.length || !res || res.cycle) return "";
    const n = (goal.diary || []).length;
    const defects = goal.subgoals.reduce((a, sg) => a + openDefects(sg), 0);
    return `
      <h3 class="list-group">Baustelle</h3>
      <div data-weather></div>
      <ul class="menu__list bau-tools">
        <li><button data-bau="ort">Wetter-Warnung <small>${goal.ort ? esc(goal.ort) + " · Ort ändern" : "Ort eintragen (Open-Meteo)"}</small></button></li>
        <li><button data-bau="baseline">${goal.baseline ? "Basisplan neu festhalten" : "Basisplan festhalten"} <small>${goal.baseline ? "Soll-Ist-Vergleich läuft seit " + dLong(goal.baseline.at.slice(0, 10)) : "für den Soll-Ist-Vergleich"}</small></button></li>
        <li><button data-bau="diary">Bautagebuch <small>${n ? n + (n === 1 ? " Eintrag" : " Einträge") : "Notiz pro Tag, Wetter und Gewerke vorausgefüllt"}</small></button></li>
        <li><button data-bau="trades">Wer ist wann da? <small>Gewerke-Übersicht zum Weitergeben${defects ? ` · ${defects} Mängel offen` : ""}</small></button></li>
        <li><button data-bau="csv">Vorgänge als CSV <small>für Excel/Numbers</small></button></li>
      </ul>`;
  }

  function wireTools(container, goal, res) {
    container.querySelectorAll("[data-bau]").forEach((b) => b.addEventListener("click", () => {
      const a = b.dataset.bau;
      if (a === "ort") ortForm(goal.id);
      if (a === "baseline") {
        if (goal.baseline && !confirm("Den bisherigen Basisplan durch den aktuellen Stand ersetzen?")) return;
        saveBaseline(goal, res);
      }
      if (a === "diary") diarySheet(goal.id);
      if (a === "trades") tradesSheet(goal, res);
      if (a === "csv") exportCsv(goal, res);
    }));
    loadWeather(container, goal, res);
  }

  return { toolsHtml, wireTools, baselineHtml, delayOf, delayForm, defectsHtml, wireDefects, openDefects, exportCsv };
})();
